# MySyde Connect — How-To Guide

**Your internal operating system for managing kiosk ad sales, partners, content, and renewals.**

Live URL: https://mysyde-crm.vercel.app

---

## Table of Contents
1. [Dashboard](#dashboard)
2. [Sales Pipeline (Board)](#sales-pipeline)
3. [Deal Record](#deal-record)
4. [Partners](#partners)
5. [Contacts](#contacts)
6. [Kiosks](#kiosks)
7. [Tasks](#tasks)
8. [Social Content](#social-content)
9. [Renewal Alerts](#renewal-alerts)
10. [CSV Export](#csv-export)

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
- **Filter/search** — use the search bar (⌘K) to find any deal by name or partner
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

- **Search everything** — press ⌘K (Mac) or Ctrl+K (Windows) to search deals, partners, contacts, and kiosks from anywhere
- **Sample data** — the Board and other pages show sample records when no real data exists. Once you add real records, the samples disappear
- **Every time you push to GitHub**, Vercel auto-deploys — no manual steps needed
- **Back up your data** — run a CSV export at the end of each month

---

*Last updated: May 2026*
