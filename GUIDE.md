# MySyde Connect — How-To Guide

**Your internal operating system for managing kiosk ad sales, partners, content, and renewals.**

Live URL: https://mysyde-crm.vercel.app

---

## Table of Contents
1. [Signing In](#signing-in)
2. [Team Access](#team-access)
3. [Google Calendar](#google-calendar)
4. [Dashboard](#dashboard)
5. [Sales Pipeline (Board)](#sales-pipeline)
6. [Deal Record](#deal-record)
7. [Partners](#partners)
8. [Contacts](#contacts)
9. [Kiosks](#kiosks)
10. [Tasks](#tasks)
11. [Social Content](#social-content)
12. [Renewal Alerts](#renewal-alerts)
13. [CSV Export](#csv-export)

---

## Signing In

The CRM requires a login. Access is by email magic link — no password needed.

**How to sign in:**
1. Go to **mysyde-crm.vercel.app**
2. Enter your work email address
3. Click **Send sign-in link**
4. Check your inbox — click the link in the email
5. You'll land directly on the CRM, logged in

The link expires after 24 hours. If it expires, just go back to the login page and request a new one.

**Signing out:**
Click **Sign out** in the top-right corner of the topbar next to your initials.

---

## Team Access

Any team member can access the CRM by signing in with their work email. No admin setup required — just send them the URL.

**To add a new team member:**
1. Send them the link: **mysyde-crm.vercel.app**
2. They enter their email and click the magic link
3. That's it — they're in

Access is all-or-nothing: every signed-in user can read and write all data. There are no separate permission levels at this time.

---

## Google Calendar

Connect your Google Calendar to see today's events and upcoming meetings in the right-hand sidebar.

**How to connect:**
1. Click **+ Connect Google** in the right sidebar (visible from any page)
2. A Google sign-in popup will appear — sign in and grant calendar access
3. Your events will appear immediately in the **Today's Agenda** panel

**What you'll see:**
- Today's meetings and events with times
- Tasks due today pulled from the CRM Tasks module

The connection is stored in your browser session. If it disconnects, click **+ Connect Google** again to re-authorize.

---

## Dashboard

Your morning home base. Open this first every day.

**What you'll see:**
- **Live MRR** — total monthly revenue from all active (Live) deals
- **Pipeline Value** — total value of all open deals
- **Active Kiosks** — how many kiosks are live in the field
- **Tasks Due This Week** — across all partners

**Upcoming Renewals** section shows any deals with a run end date within 30 days, with a day countdown. Click any deal name to go directly to the record.

**Recent Activity** shows the last 10 actions logged across the whole CRM.

---

## Sales Pipeline

The kanban board. Every deal in the system lives here.

**Stages (left to right):**
| Stage | What it means |
|-------|--------------|
| Prospect | New lead, not yet pitched |
| Pitched | You've had a conversation |
| Proposal | Formal proposal sent or in progress |
| Creative | Ad design in progress |
| Live | Ad is running on the kiosk |
| Won | Deal closed successfully |
| Lost | Deal did not close |

**How to use:**
- **Create a deal** — click **+ New Deal** at the top of any column
- **Move a deal** — drag the card to a new column, or open the deal and change the stage badge
- **Open a deal** — click any card to open the full Deal Record
- **Filter/search** — use the search bar (Ctrl+K) to find any deal by name or partner
- **Export to CSV** — click the **Export** button on the Board page to download all deals

---

## Deal Record

The full detail view for a single deal. Access by clicking any deal card on the Board.

### Sections

**Stage & Status** (top of page)
- Click the colored stage badge to change the stage
- Moving to Won or Lost will prompt you to enter the close date
- Click the Invoice badge to update payment status (None / Deposit Pending / Paid / Overdue)

**Run Dates**
- Click the ✎ icon to set or edit campaign start and end dates
- The renewal alert date is automatically calculated as 14 days before the end date

**Placement**
- Select the ad type (Top Banner, Bottom Banner, Premier Welcome, etc.)
- Choose Screen 1, Screen 2, or Both
- Select the pricing tier — the monthly rate and total value calculate automatically

**Creative Status**
- Track where the design is: None → Briefed → In Progress → Revised → Approved → Uploaded
- Click each status bubble to advance the workflow

**Canva File**
- Paste the Canva design URL to link the creative file directly to the deal
- The file name auto-populates from the URL

**Payment Link**
- Click **Generate Payment Link** to create a Stripe payment link for the exact deal total
- The link is saved to the deal and can be copied anytime
- Use this in proposals so the partner can pay online

**Proposal Email**
- Click **Draft Proposal Email** to generate a complete, ready-to-send email
- Includes partner name, placement details, pricing, campaign dates, and the Stripe payment link
- Click **Copy to Clipboard**, then paste directly into Gmail

**Gmail Thread**
- Paste a Gmail thread URL or thread ID to link the email conversation to the deal
- Once linked, the thread summary shows directly in the record (when Google is connected)

**Notes**
- Internal notes only — not visible to partners
- Click **Save notes** after editing

**Activity Log**
- Automatically logs stage changes, Canva updates, Gmail links, and payment link generation
- Manually add notes, calls, or email summaries using the text box at the top of the log

---

## Partners

A partner is any organization you work with — chamber, city, downtown association, etc.

**How to use:**
- **Add a partner** — click **+ New Partner** on the Partners page
- **Partner types:** Chamber, City Government, Downtown Association, Community Org, Local Business, Nonprofit, Other
- **Partner Record** shows all linked deals, contacts, kiosks, tasks, posts, and activity for that partner
- **Deactivate** — toggle a partner inactive rather than deleting to preserve history
- **Export** — click Export on the Partners page to download a CSV

---

## Contacts

Individual people at partner organizations.

**How to use:**
- **Add a contact** — click **+ New Contact**
- Link them to a partner so they appear in that partner's record
- Contact name and email will be used in proposal emails when linked to a deal
- **Export** — CSV export available on the Contacts page

---

## Kiosks

Physical kiosk units in the field.

**How to use:**
- **Add a kiosk** — click **+ New Kiosk**
- **Statuses:** Pending → Active → Inactive
- Link each kiosk to the partner location it's installed at
- Set the installation date to track how long it's been live
- **Export** — CSV export available on the Kiosks page

---

## Tasks

Task boards for tracking action items across all partners and deals.

**Columns:** To Do → In Progress → Review → Done

**How to use:**
- **Add a task** — click **+ New Task** on the Tasks page
- Link tasks to a partner, deal, contact, or kiosk for full context
- Set priority (Low, Medium, High) and a due date
- **Recurring tasks** — toggle "Recurring" and set Weekly, Monthly, or Quarterly
- Tasks due this week appear on the Dashboard

---

## Social Content

Manage your social media posts across platforms.

**Statuses:** Idea → Draft → Review → Scheduled → Live → Archived

**How to use:**
- **Add a post** — click **+ New Post**
- Select platforms (Facebook, Instagram, LinkedIn, TikTok)
- Write caption, add hashtags, set scheduled date
- Link a Canva file for the visual
- Link to a partner or deal for context
- **Content Calendar** — switch to Calendar view to see scheduled posts by date

---

## Renewal Alerts

Automatic daily emails when deals are approaching their end date.

**How it works:**
- Every morning at 8am ET, the system checks for deals whose run end date is 14–28 days away (the 14-day renewal window)
- If any are found, an email is sent to marilyn@mysyde.com from alerts@mysyde.com
- The email lists each deal, the partner name, the run end date, and days remaining
- Deals marked as Lost are excluded

**No action needed** — it runs automatically. You can also trigger it manually from the Supabase Dashboard → Edge Functions → renewal-alerts → Test.

---

## CSV Export

Download your data for reporting, sharing, or backup.

| Page | What exports |
|------|-------------|
| Board | All deals with stage, partner, dates, and value |
| Partners | All partners with type and status |
| Contacts | All contacts with email, phone, and partner |
| Kiosks | All kiosks with status, location, and partner |

Click the **Export** button on any of these pages. The file downloads instantly as a CSV named with today's date.

---

## Tips

- **Search everything** — press **Ctrl+K** to search deals, partners, contacts, and kiosks from anywhere in the app
- **Sample data** — the Board and other pages show sample records when no real data exists. Once you add real records, the samples disappear
- **Direct URLs work** — you can bookmark any page (e.g. `/contacts`, `/board`) and navigate directly to it
- **Every time you push to GitHub**, Vercel auto-deploys — no manual steps needed
- **Back up your data** — run a CSV export at the end of each month

---

*Last updated: May 22, 2026*
