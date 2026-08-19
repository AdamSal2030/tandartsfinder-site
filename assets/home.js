(function () {
  var LANG = (document.documentElement.lang || 'nl').slice(0, 2), EN = LANG === 'en';
  var T = EN
    ? { pill: 'Accepting new patients', go: 'View & register →', on: 'on', sending: 'Sending…' }
    : { pill: 'Nu plek voor nieuwe patiënten', go: 'Bekijk & meld aan →', on: 'op', sending: 'Bezig met versturen…' };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---- featured practice card(s) ---- */
  function card(p) {
    return '<a class="practice" href="' + esc(EN && p.url_en ? p.url_en : p.url) + '">' +
      '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      '<div><span class="pill">' + T.pill + '</span>' +
      '<h3>' + esc(p.name) + '</h3><p class="loc">' + esc(p.area || p.city) + ' · ' + esc(p.address) + '</p>' +
      '<ul>' + ((EN && p.usps_en) || p.usps || []).slice(0, 4).map(function (u) { return '<li><svg class="icon"><use href="#i-check"/></svg><span>' + esc(u) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="foot">' + (p.rating ? '<span class="rating"><span class="stars" aria-hidden="true">★★★★★</span> <b>' + esc(p.rating) + '</b> ' + T.on + ' ' + esc(p.ratingSource || '') + '</span>' : '<span></span>') +
      '<span class="go">' + T.go + '</span></div></div></a>';
  }
  document.getElementById('list').innerHTML = (window.PRACTICES || []).filter(function (p) { return p.accepting !== false; }).map(card).join('');

  /* ---- lead forms (patient + clinic) → POST /api/lead ---- */
  var params = new URLSearchParams(location.search), attr = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'gclid'].forEach(function (k) { if (params.get(k)) attr[k] = params.get(k); });

  function mark(el, bad) { var f = el.closest('.field'); if (f) f.classList.toggle('bad', !!bad); return !bad; }
  function valid(form) {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (el) {
      var v = el.value.trim(), bad;
      if (el.type === 'checkbox') bad = !el.checked;
      else if (el.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
      else if (el.type === 'tel') bad = !/^\+?[0-9]{8,15}$/.test(v.replace(/[\s\-().]/g, ''));
      else if (el.name === 'postcode') {
        v = v.toUpperCase().replace(/\s+/g, ''); bad = !/^[1-9][0-9]{3}[A-Z]{2}$/.test(v);
        if (!bad) el.value = v.slice(0, 4) + ' ' + v.slice(4);
      } else bad = !v;
      ok = mark(el, bad) && ok;
    });
    return ok;
  }

  document.querySelectorAll('form.leadform').forEach(function (form) {
    form.addEventListener('input', function (e) { mark(e.target, false); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid(form)) { var b = form.querySelector('.bad'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      var btn = form.querySelector('[type=submit]'), label = btn.textContent, err = form.querySelector('.formerror');
      btn.disabled = true; btn.textContent = T.sending; err.classList.remove('on');
      var data = { taal: LANG, pagina: location.href, tijdstip: new Date().toISOString() };
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      Object.assign(data, attr);
      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () {
          form.querySelector('.fields').hidden = true;
          form.querySelector('.done').hidden = false;
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .catch(function () { btn.disabled = false; btn.textContent = label; err.classList.add('on'); });
    });
  });
})();
