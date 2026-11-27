// Meta Conversions API: sends the server-side copy of the browser 'Lead' event.
// Shared file: identical in tandartsfinder and tandartsfinder-site — change both. The _ prefix keeps it out of Vercel's routes.
// Configure in Vercel → Environment Variables (both required, otherwise nothing is sent):
//   META_PIXEL_ID      the same Pixel/dataset id as META_PIXEL_ID in assets/consent.js
//   META_CAPI_TOKEN    Events Manager → dataset → Settings → Conversions API → Generate access token
//   META_TEST_CODE     optional, Events Manager → Test events code, to see events under "Test events" while checking
// Only sent when the visitor gave marketing consent in the cookie banner. event_id equals the browser Pixel's eventID,
// so Meta counts one lead, not two. E-mail and phone are SHA-256 hashed as Meta requires; no form answers are sent.
const crypto = require('crypto');

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const dutchPhone = phone => String(phone).replace(/\D/g, '').replace(/^00/, '').replace(/^0/, '31');

module.exports = function sendMetaLead(lead, req) {
  const { META_PIXEL_ID: pixel, META_CAPI_TOKEN: token, META_TEST_CODE: testCode } = process.env;
  if (!pixel || !token || lead.marketing_consent !== 'ja' || !lead.event_id) return null;

  const userData = {
    em: [sha256(String(lead.email).trim().toLowerCase())],
    ph: [sha256(dutchPhone(lead.telefoon))],
    client_ip_address: lead.ip || undefined,
    client_user_agent: req.headers['user-agent'] || undefined,
    fbp: lead.fbp || undefined,
    fbc: lead.fbc || (lead.fbclid ? `fb.1.${Date.now()}.${lead.fbclid}` : undefined)
  };
  const body = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: lead.event_id,
      action_source: 'website',
      event_source_url: lead.pagina || undefined,
      user_data: userData,
      custom_data: { lead_type: lead.type || 'patient' }
    }],
    test_event_code: testCode || undefined
  };
  return fetch(`https://graph.facebook.com/v26.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }).then(async r => { if (!r.ok) console.error('META CAPI FAILED', r.status, await r.text()); })
    .catch(e => console.error('META CAPI FAILED', e.message));
};
