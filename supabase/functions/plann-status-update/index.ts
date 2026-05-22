// supabase/functions/plann-status-update/index.ts
// Zapier webhook: called by Zapier when Plann publishes a post.
// Updates the matching post's status to "live" in the posts table.
//
// Deploy: supabase functions deploy plann-status-update
// Secret: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
//
// Request body (JSON — Zapier sends one of these):
//   { "post_id": "uuid" }
//   { "post_title": "Exact post title" }
//   { "title": "Exact post title" }       ← alternate field name
//
// Response: { "updated": 1, "post_id": "uuid" } | { "error": "..." }

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  const supabaseUrl     = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase        = createClient(supabaseUrl, serviceRoleKey)

  let body: { post_id?: string; post_title?: string; title?: string }
  try { body = await req.json() } catch { body = {} }

  const postId    = body.post_id
  const postTitle = body.post_title ?? body.title

  if (!postId && !postTitle) {
    return new Response(JSON.stringify({ error: 'Provide post_id or post_title' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const patch = { status: 'live', published_at: new Date().toISOString() }

  let query = supabase.from('posts').update(patch).select('id')

  if (postId)    query = query.eq('id', postId)
  else           query = query.ilike('title', postTitle!)

  const { data, error } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ updated: data?.length ?? 0, post_id: data?.[0]?.id ?? null }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
