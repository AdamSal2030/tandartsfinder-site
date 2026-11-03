/* Tandartsfinder.nl — cookiebanner + Google Consent Mode v2 (advanced) + tag loader.
   Gedeeld bestand: identiek in tandartsfinder en tandartsfinder-site — wijzig beide.
   - Google (GTM): laadt direct, maar met alle toestemming op 'denied' → alleen cookieloze pings
     tot de bezoeker akkoord geeft (advanced consent mode).
   - Meta Pixel: laadt pas NA toestemming (Meta kent geen cookieloze modus).
   Nooit formulierdata (situatie/postcode) naar Meta/Google sturen — alleen een kaal Lead-event.
   Moet als eerste script in <head> staan (synchroon), zodat de consent-default vóór GTM staat. */
(function () {
  'use strict';
  var META_PIXEL_ID = '';               // bv. '1234567890'
  var GTM_ID        = 'GTM-M832V8XP';
  var KEY = 'tf_consent_v1', DAYS = 180;
  var GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
  var DENIED  = { ad_storage: 'denied',  ad_user_data: 'denied',  ad_personalization: 'denied',  analytics_storage: 'denied' };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function stored() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return v && Date.now() - v.t < DAYS * 864e5 ? v : null;
    } catch (e) { return null; }
  }
  function store(marketing) { try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), m: !!marketing })); } catch (e) {} }
  function script(src) { var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }

  // 1. Default: alles geweigerd, behalve noodzakelijk. Daarna direct een eerder gegeven keuze toepassen.
  gtag('consent', 'default', Object.assign({ functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 }, DENIED));
  gtag('set', 'ads_data_redaction', true);
  var prior = stored();
  if (prior && prior.m) gtag('consent', 'update', GRANTED);

  // 2. GTM laden (advanced mode: ook zonder toestemming, respecteert de consent-status hierboven).
  if (GTM_ID) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    script('https://www.googletagmanager.com/gtm.js?id=' + GTM_ID);
  }

  // 3. Meta pas na toestemming.
  var granted = false, queue = [];
  function grant() {
    if (granted) return; granted = true;
    gtag('consent', 'update', GRANTED);
    if (META_PIXEL_ID) {
      if (window.fbq) fbq('consent', 'grant');
      else {
        var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        n.queue = []; n.loaded = true; n.version = '2.0'; n.push = n; window._fbq = n;
        script('https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', META_PIXEL_ID); fbq('track', 'PageView');
      }
    }
    queue.forEach(function (fn) { fn(); }); queue = [];
  }
  function revoke() {
    if (!granted) return; granted = false;
    gtag('consent', 'update', DENIED);
    if (window.fbq) fbq('consent', 'revoke');
  }

  // type: 'patient' | 'clinic' — GTM-trigger: Custom Event 'lead_submit' (filter op lead_type).
  window.tfTrackLead = function (type) {
    var fire = function () { if (window.fbq) fbq('track', 'Lead'); };
    granted ? fire() : queue.push(fire);
    window.dataLayer.push({ event: 'lead_submit', lead_type: type || 'patient' });
  };

  var T = {
    nl: { label: 'Cookievoorkeuren', intro: '<strong>Wij gebruiken cookies.</strong> Noodzakelijke cookies laten deze pagina werken. Met uw toestemming plaatsen we ook cookies voor marketing &amp; meting, zodat we zien welke advertentie tot een aanmelding leidt.',
          privacy: 'Lees onze privacyverklaring', href: '/privacy', settings: 'Instellingen', deny: 'Weigeren', allow: 'Alles accepteren', save: 'Keuze opslaan',
          need: '<strong>Noodzakelijk</strong> — nodig om de pagina en het formulier te laten werken. Altijd aan.',
          mk: '<strong>Marketing &amp; meting</strong> — Meta Pixel en Google tag, om advertenties te meten en te verbeteren.' },
    en: { label: 'Cookie preferences', intro: '<strong>We use cookies.</strong> Necessary cookies make this page work. With your consent we also set cookies for marketing &amp; measurement, so we can see which ad leads to a registration.',
          privacy: 'Read our privacy policy', href: '/privacy', settings: 'Settings', deny: 'Decline', allow: 'Accept all', save: 'Save choice',
          need: '<strong>Necessary</strong> — required for the page and the form to work. Always on.',
          mk: '<strong>Marketing &amp; measurement</strong> — Meta Pixel and Google tag, to measure and improve ads.' }
  };
  var t = T[(document.documentElement.lang || 'nl').slice(0, 2)] || T.nl;

  var CSS = '.tf-cc{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#fff;box-shadow:0 -8px 40px rgba(16,32,66,.18);padding:18px 20px;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1e293b}' +
    '.tf-cc>div{max-width:1080px;margin:0 auto;display:flex;gap:18px;align-items:center;flex-wrap:wrap}.tf-cc p{margin:0;flex:1 1 380px;min-width:260px}.tf-cc a{color:#1b3b8b}' +
    '.tf-cc nav{display:flex;gap:10px;flex-wrap:wrap}.tf-cc button{font:inherit;font-weight:600;border-radius:10px;padding:11px 18px;cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#1e293b}' +
    '.tf-cc button.ok{background:#0e9f77;border-color:#0e9f77;color:#fff}.tf-cc section{flex:1 1 100%;display:none;border-top:1px solid #e2e8f0;padding-top:14px}' +
    '.tf-cc section.on{display:block}.tf-cc label{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}@media(max-width:640px){.tf-cc nav{width:100%}.tf-cc nav button{flex:1}}';

  // expand: open with the settings panel visible (used by the "Cookievoorkeuren" link).
  function banner(expand) {
    var open = document.querySelector('.tf-cc');
    if (open) { if (expand) open.querySelector('section').classList.add('on'); return; }
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var el = document.createElement('div');
    el.className = 'tf-cc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', t.label);
    el.innerHTML = '<div><p>' + t.intro + ' <a href="' + t.href + '">' + t.privacy + '</a>.</p>' +
      '<nav><button type="button" data-a="settings">' + t.settings + '</button><button type="button" data-a="deny">' + t.deny + '</button>' +
      '<button type="button" class="ok" data-a="allow">' + t.allow + '</button></nav>' +
      '<section><label><input type="checkbox" checked disabled> <span>' + t.need + '</span></label>' +
      '<label><input type="checkbox" id="tf-mk"' + (granted ? ' checked' : '') + '> <span>' + t.mk + '</span></label>' +
      '<button type="button" class="ok" data-a="save">' + t.save + '</button></section></div>';
    if (expand) el.querySelector('section').classList.add('on');
    document.body.appendChild(el);
    document.body.style.paddingBottom = el.offsetHeight + 'px';   // measured once; banner height changes on resize are rare and harmless
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'settings') { el.querySelector('section').classList.toggle('on'); return; }
      var ok = a === 'allow' || (a === 'save' && el.querySelector('#tf-mk').checked);
      store(ok); ok ? grant() : revoke(); el.remove(); document.body.style.paddingBottom = '';
    });
  }

  function boot() {
    if (prior) { if (prior.m) grant(); } else banner();
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-cookies]')) return;
      e.preventDefault();
      banner(true);
    });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
