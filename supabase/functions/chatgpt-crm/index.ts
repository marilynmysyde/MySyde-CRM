// supabase/functions/chatgpt-crm/index.ts
// MySyde CRM API for ChatGPT (Custom GPT "Actions").
//
// Lets a teammate's ChatGPT read and add to the CRM directly, without a
// browser login. Each person gets their own API key; the key decides who
// "I"/"me" is (default assignee, created_by on notes). No delete endpoints.
//
// Deploy:  supabase functions deploy chatgpt-crm --no-verify-jwt
// Secret:  supabase secrets set CRM_GPT_KEYS="Francesca:<key>"   (comma-separate more people)
// Schema:  GET {base}/openapi.json  (no key needed; ChatGPT imports it from this URL)
// Revoke:  remove the person's entry from CRM_GPT_KEYS and re-set the secret.

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
}

const TASK_STATUSES   = ['todo', 'in_progress', 'review', 'done']
const PRIORITIES      = ['low', 'medium', 'high']
const DEAL_STAGES     = ['prospect', 'pitched', 'proposal', 'creative', 'live', 'closed_won', 'closed_lost']
const PARTNER_TYPES   = ['chamber', 'city_gov', 'downtown_assoc', 'community_org', 'local_business', 'nonprofit', 'other']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

function whoIs(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  for (const pair of (Deno.env.get('CRM_GPT_KEYS') ?? '').split(',')) {
    const i = pair.indexOf(':')
    if (i < 1) continue
    const name = pair.slice(0, i).trim()
    const key  = pair.slice(i + 1).trim()
    if (key && key.length >= 32 && key === token) return name
  }
  return null
}

const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const ilike = (s: string) => `%${s.replace(/[%_,()]/g, ' ').trim()}%`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const url   = new URL(req.url)
  const path  = url.pathname.replace(/^.*\/chatgpt-crm/, '') || '/'
  const base  = `${url.origin.replace('http://', 'https://')}/functions/v1/chatgpt-crm`

  if (req.method === 'GET' && path === '/openapi.json') return json(openapi(base))

  const me = whoIs(req)
  if (!me) return json({ error: 'Missing or invalid API key' }, 401)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const q  = (k: string) => url.searchParams.get(k)?.trim() || null
  const body = ['POST', 'PATCH'].includes(req.method) ? await req.json().catch(() => ({})) : {}

  try {
    // ── Summary: my open tasks, overdue, deals ending soon ─────────────────
    if (req.method === 'GET' && path === '/summary') {
      const who = q('assigned_to') ?? me
      const [{ data: tasks }, { data: ending }] = await Promise.all([
        db.from('tasks').select('id,title,status,priority,due_date,assigned_to')
          .neq('status', 'done').ilike('assigned_to', who).order('due_date', { ascending: true, nullsFirst: false }),
        db.from('deals').select('id,title,stage,run_end,monthly_rate,partners(name)')
          .in('stage', ['live', 'creative']).gte('run_end', today()).lte('run_end', plusDays(30)).order('run_end'),
      ])
      const t = tasks ?? []
      return json({
        person: who, today: today(),
        overdue:  t.filter(x => x.due_date && x.due_date < today()),
        due_next_7_days: t.filter(x => x.due_date && x.due_date >= today() && x.due_date <= plusDays(7)),
        later_or_undated: t.filter(x => !x.due_date || x.due_date > plusDays(7)),
        deals_ending_next_30_days: ending ?? [],
      })
    }

    // ── Tasks ──────────────────────────────────────────────────────────────
    if (path === '/tasks' && req.method === 'GET') {
      let s = db.from('tasks').select('id,title,description,status,priority,due_date,assigned_to,tags,partner_id,deal_id,created_at')
      const status = q('status') ?? 'open'
      if (status === 'open') s = s.neq('status', 'done')
      else if (TASK_STATUSES.includes(status)) s = s.eq('status', status)
      const who = q('assigned_to')
      if (who && who.toLowerCase() !== 'all') s = s.ilike('assigned_to', who)
      const search = q('search')
      if (search) s = s.or(`title.ilike.${ilike(search)},description.ilike.${ilike(search)}`)
      const { data, error } = await s.order('due_date', { ascending: true, nullsFirst: false }).limit(100)
      if (error) throw error
      return json({ tasks: data })
    }

    if (path === '/tasks' && req.method === 'POST') {
      if (!body.title) return json({ error: 'title is required' }, 400)
      const row = {
        title:       String(body.title),
        description: body.description ?? null,
        status:      'todo',
        priority:    PRIORITIES.includes(body.priority) ? body.priority : 'medium',
        due_date:    body.due_date ?? null,
        assigned_to: body.assigned_to ?? me,
        tags:        Array.isArray(body.tags) ? body.tags : [],
        partner_id:  body.partner_id ?? null,
        deal_id:     body.deal_id ?? null,
      }
      const { data, error } = await db.from('tasks').insert(row).select().single()
      if (error) throw error
      return json({ created: data, view: 'https://crm.mysyde.com/tasks' }, 201)
    }

    const taskMatch = path.match(/^\/tasks\/([0-9a-f-]{36})$/)
    if (taskMatch && req.method === 'PATCH') {
      const id = taskMatch[1]
      const patch: Record<string, unknown> = {}
      if (body.title)       patch.title = String(body.title)
      if (body.due_date !== undefined) patch.due_date = body.due_date
      if (PRIORITIES.includes(body.priority)) patch.priority = body.priority
      if (body.assigned_to) patch.assigned_to = body.assigned_to
      if (TASK_STATUSES.includes(body.status)) {
        patch.status = body.status
        patch.completed_at = body.status === 'done' ? new Date().toISOString() : null
      }
      if (body.add_note) {
        const { data: cur } = await db.from('tasks').select('description').eq('id', id).single()
        const stamp = `${today()} (${me} via ChatGPT): ${body.add_note}`
        patch.description = cur?.description ? `${cur.description}\n\n${stamp}` : stamp
      }
      if (!Object.keys(patch).length) return json({ error: 'Nothing to update' }, 400)
      const { data, error } = await db.from('tasks').update(patch).eq('id', id).select().single()
      if (error) throw error
      return json({ updated: data })
    }

    // ── Deals ──────────────────────────────────────────────────────────────
    if (path === '/deals' && req.method === 'GET') {
      let s = db.from('deals').select('id,title,stage,placement_type,monthly_rate,months,total_value,invoice_status,payments_made,run_start,run_end,notes,partners(id,name)')
      const stage = q('stage')
      if (stage && DEAL_STAGES.includes(stage)) s = s.eq('stage', stage)
      else if (!q('include_closed')) s = s.not('stage', 'in', '(closed_won,closed_lost)')
      const search = q('search')
      if (search) s = s.or(`title.ilike.${ilike(search)},notes.ilike.${ilike(search)}`)
      const { data, error } = await s.order('created_at', { ascending: false }).limit(100)
      if (error) throw error
      return json({ deals: data })
    }

    if (path === '/deals' && req.method === 'POST') {
      if (!body.title) return json({ error: 'title is required' }, 400)
      const row = {
        title:      String(body.title),
        partner_id: body.partner_id ?? null,
        stage:      DEAL_STAGES.includes(body.stage) ? body.stage : 'prospect',
        notes:      body.notes ? `${today()} (${me} via ChatGPT): ${body.notes}` : null,
      }
      const { data, error } = await db.from('deals').insert(row).select('id,title,stage,partner_id').single()
      if (error) throw error
      return json({ created: data, view: `https://crm.mysyde.com/deal/${data.id}` }, 201)
    }

    // ── Partners & contacts ────────────────────────────────────────────────
    if (path === '/partners' && req.method === 'GET') {
      let s = db.from('partners').select('id,name,type,website,address,notes,drive_folder_url,active')
      const search = q('search')
      if (search) s = s.or(`name.ilike.${ilike(search)},notes.ilike.${ilike(search)}`)
      const { data, error } = await s.order('name').limit(100)
      if (error) throw error
      return json({ partners: data })
    }

    if (path === '/partners' && req.method === 'POST') {
      if (!body.name) return json({ error: 'name is required' }, 400)
      const row = {
        name:  String(body.name),
        type:  PARTNER_TYPES.includes(body.type) ? body.type : 'other',
        website: body.website ?? null,
        notes: body.notes ? `${today()} (${me} via ChatGPT): ${body.notes}` : null,
      }
      const { data, error } = await db.from('partners').insert(row).select('id,name,type').single()
      if (error) throw error
      return json({ created: data, view: `https://crm.mysyde.com/partner/${data.id}` }, 201)
    }

    if (path === '/contacts' && req.method === 'GET') {
      let s = db.from('contacts').select('id,name,email,phone,role,notes,partners(id,name)')
      const search = q('search')
      if (search) s = s.or(`name.ilike.${ilike(search)},email.ilike.${ilike(search)},role.ilike.${ilike(search)}`)
      const { data, error } = await s.order('name').limit(100)
      if (error) throw error
      return json({ contacts: data })
    }

    // ── Notes (activity log on a partner or deal) ──────────────────────────
    if (path === '/notes' && req.method === 'POST') {
      if (!body.body) return json({ error: 'body is required' }, 400)
      if (!body.partner_id && !body.deal_id) return json({ error: 'partner_id or deal_id is required' }, 400)
      const { data, error } = await db.from('activity_log').insert({
        type: 'note', body: String(body.body), partner_id: body.partner_id ?? null,
        deal_id: body.deal_id ?? null, created_by: `${me} (ChatGPT)`,
      }).select().single()
      if (error) throw error
      return json({ created: data }, 201)
    }

    return json({ error: `Unknown route ${req.method} ${path}` }, 404)
  } catch (e) {
    return json({ error: (e as Error).message ?? String(e) }, 500)
  }
})

// ── OpenAPI schema for ChatGPT Actions ──────────────────────────────────────
function openapi(base: string) {
  const str = { type: 'string' }
  const id  = { type: 'string', format: 'uuid' }
  const okObj = { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } }
  const q = (name: string, description: string, extra: Record<string, unknown> = {}) =>
    ({ name, in: 'query', required: false, description, schema: { type: 'string', ...extra } })
  const jsonBody = (properties: Record<string, unknown>, required: string[] = []) =>
    ({ required: true, content: { 'application/json': { schema: { type: 'object', properties, required } } } })

  return {
    openapi: '3.1.0',
    info: { title: 'MySyde CRM', version: '1.0.0', description: 'Read and add to the MySyde CRM (crm.mysyde.com): tasks, deals, partners, contacts and notes. No deletes.' },
    servers: [{ url: base }],
    components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } }, schemas: {} },
    security: [{ bearer: [] }],
    paths: {
      '/summary': { get: {
        operationId: 'getMySummary',
        summary: "Daily summary: the user's overdue tasks, tasks due in the next 7 days, later tasks, and deals ending in the next 30 days.",
        parameters: [q('assigned_to', 'Person name (defaults to the API key owner, e.g. Francesca). Use another name to see their list.')],
        responses: { '200': okObj } } },
      '/tasks': {
        get: {
          operationId: 'listTasks', summary: 'List tasks. Defaults to open (not done) tasks for everyone.',
          parameters: [
            q('status', 'open (default), todo, in_progress, review, done', { enum: ['open', ...TASK_STATUSES] }),
            q('assigned_to', 'Person name, e.g. Francesca, Marilyn, Ricky, or all'),
            q('search', 'Text to find in the title or description'),
          ],
          responses: { '200': okObj } },
        post: {
          operationId: 'createTask', summary: 'Create a task. Write a thorough description: what, numbered steps, done-when, full links, contacts.',
          requestBody: jsonBody({
            title: { ...str, description: 'Short action title' },
            description: { ...str, description: 'What / Steps / Done when / Links / Contacts' },
            due_date: { ...str, format: 'date', description: 'YYYY-MM-DD' },
            priority: { type: 'string', enum: PRIORITIES },
            assigned_to: { ...str, description: 'Defaults to the API key owner' },
            tags: { type: 'array', items: str },
            partner_id: id, deal_id: id,
          }, ['title']),
          responses: { '201': okObj } },
      },
      '/tasks/{id}': { patch: {
        operationId: 'updateTask', summary: 'Update a task: mark done, change due date, priority, owner, or append a dated note.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: id }],
        requestBody: jsonBody({
          status: { type: 'string', enum: TASK_STATUSES },
          due_date: { ...str, format: 'date' },
          priority: { type: 'string', enum: PRIORITIES },
          assigned_to: str, title: str,
          add_note: { ...str, description: 'Text appended to the description with a date stamp' },
        }),
        responses: { '200': okObj } } },
      '/deals': {
        get: {
          operationId: 'listDeals', summary: 'List deals (sales pipeline). Excludes closed deals unless include_closed=true.',
          parameters: [q('stage', 'Filter by stage', { enum: DEAL_STAGES }), q('search', 'Text in title or notes'), q('include_closed', 'true to include closed deals')],
          responses: { '200': okObj } },
        post: {
          operationId: 'createDeal', summary: 'Create a new deal (starts as prospect). Look up partner_id with listPartners first.',
          requestBody: jsonBody({ title: str, partner_id: id, stage: { type: 'string', enum: DEAL_STAGES }, notes: str }, ['title']),
          responses: { '201': okObj } },
      },
      '/partners': {
        get: { operationId: 'listPartners', summary: 'List or search partners (businesses, cities, chambers, nonprofits).',
          parameters: [q('search', 'Name or text in notes')], responses: { '200': okObj } },
        post: { operationId: 'createPartner', summary: 'Add a new partner organization. Search first to avoid duplicates.',
          requestBody: jsonBody({ name: str, type: { type: 'string', enum: PARTNER_TYPES }, website: str, notes: str }, ['name']),
          responses: { '201': okObj } },
      },
      '/contacts': { get: { operationId: 'listContacts', summary: 'Search people (name, email, role) and their organization.',
        parameters: [q('search', 'Name, email or role')], responses: { '200': okObj } } },
      '/notes': { post: { operationId: 'addNote', summary: 'Log a note on a partner or deal (shows in its activity history).',
        requestBody: jsonBody({ body: str, partner_id: id, deal_id: id }, ['body']), responses: { '201': okObj } } },
    },
  }
}
