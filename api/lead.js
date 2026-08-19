// Vercel serverless function: receives both homepage forms (type=patient | clinic) and delivers the lead.
// Configure in Vercel → Project → Settings → Environment Variables (each optional, use one or both):
//   LEAD_WEBHOOK     n8n Webhook node Production URL — lead is POSTed as JSON (n8n → Airtable)
//   RESEND_API_KEY   from https://resend.com (free tier) — lead is e-mailed
//   LEAD_TO          e-mail address(es) that receive leads, comma separated   (needs RESEND_API_KEY)
//   LEAD_FROM        optional sender, default 'Tandartsfinder <leads@tandartsfinder.nl>' (domain must be verified in Resend)
// With nothing configured the lead is only written to the Vercel function logs.

const REQUIRED = {
  patient: ['naam', 'email', 'telefoon', 'postcode', 'plaats'],
  clinic: ['praktijknaam', 'naam', 'email', 'telefoon', 'plaats']
};
const FIELDS = ['type', 'naam', 'email', 'telefoon', 'toelichting', 'postcode', 'voor_wie', 'situatie',
  'beschikbaar_van', 'beschikbaar_tot', 'beschikbaar_tijd_van', 'beschikbaar_tijd_tot',
  'praktijknaam', 'plaats', 'praktijk_website', 'aantal_tandartsen', 'taal', 'pagina',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'gclid'];

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true });                       // honeypot → pretend success
  const req_ = REQUIRED[b.type];
  if (!req_ || b.akkoord !== 'ja' || req_.some(k => !b[k])) return res.status(400).json({ error: 'invalid' });

  const lead = {};
  for (const k of FIELDS) if (b[k]) lead[k] = b[k];
  lead.tijdstip = b.tijdstip || new Date().toISOString();
  lead.ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  console.log('LEAD', JSON.stringify(lead));

  const jobs = [];
  if (process.env.LEAD_WEBHOOK) {
    jobs.push(fetch(process.env.LEAD_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) }));
  }
  if (process.env.RESEND_API_KEY && process.env.LEAD_TO) {
    const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rows = Object.entries(lead).filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('');
    const clinic = lead.type === 'clinic';
    jobs.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.LEAD_FROM || 'Tandartsfinder <leads@tandartsfinder.nl>',
        to: process.env.LEAD_TO.split(',').map(s => s.trim()),
        reply_to: lead.email,
        subject: clinic ? `Nieuwe praktijkaanmelding: ${lead.praktijknaam} (${lead.plaats})` : `Nieuwe patiëntaanvraag: ${lead.naam} (${lead.postcode})`,
        html: `<h2 style="font-family:sans-serif">${clinic ? 'Nieuwe praktijk' : 'Nieuwe patiënt'} via tandartsfinder.nl</h2><table style="font-family:sans-serif;font-size:15px">${rows}</table>`
      })
    }));
  }

  const results = await Promise.allSettled(jobs);
  const failed = results.filter(r => r.status === 'rejected' || (r.value && !r.value.ok));
  if (failed.length) {
    console.error('LEAD DELIVERY FAILED', failed.map(r => r.reason || r.value.status));
    if (failed.length === jobs.length) return res.status(502).json({ error: 'delivery' });
  }
  res.status(200).json({ ok: true, delivered: jobs.length - failed.length });
};
