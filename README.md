# tandartsfinder.nl — homepage

Static homepage (NL + EN): hero (2 CTAs) → patient form "Ik zoek een tandarts" → clinic form "Meld uw praktijk aan" → how it works → FAQ. Both forms POST JSON to `/api/lead` (type patient|clinic).

```
index.html, en/index.html   pages
data/practices.js           practice data (currently unused — featured card removed)
assets/vendor/              flatpickr (js+css+nl locale), vendored — no CDN at runtime
assets/style.css            shared design system (copy of the practice page's)
assets/home.css, home.js    homepage-only styles + lead forms + availability picker (validation, POST /api/lead)
privacy.html                → /privacy
```

Deploy: separate Vercel project (preset Other), domain `tandartsfinder.nl` + `www`. Local: `node dev.js` → http://localhost:3457

## How a lead flows

form (`type=patient` | `type=clinic`) → `/api/lead` (validates, honeypot `website`) → n8n webhook → Switch on `type` → Airtable base *Tandartsfinder.nl*, table **Patiënten** or **Praktijken**. Optional e-mail via Resend (`RESEND_API_KEY` + `LEAD_TO`, + `LEAD_FROM`).

## Setup

- **Vercel**: env var `LEAD_WEBHOOK` = n8n Webhook node Production URL, redeploy.
- **n8n**: import `n8n-local/n8n-workflow.json`, add Airtable credential, pick the table in both Airtable nodes (base is pre-filled), Publish.
- **Airtable**: base *Tandartsfinder.nl*, two tables with exactly these columns (all single-line text, `Status` single select):
  - **Patiënten**: Name, Phone, Email, Postcode, For whom, Situation, Available from, Available until, Notes, Language, UTM source, UTM medium, UTM campaign, UTM content, fbclid, gclid, Page, Submitted at, Status
  - **Praktijken**: Practice, City, Website, Dentists, Name, Phone, Email, Notes, Language, UTM source, UTM medium, UTM campaign, UTM content, fbclid, gclid, Page, Submitted at, Status
