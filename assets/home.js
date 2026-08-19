(function () {
  var LANG = (document.documentElement.lang || 'nl').slice(0, 2), EN = LANG === 'en';
  var SENDING = EN ? 'Sending…' : 'Bezig met versturen…';

  /* ---- optional availability period (flatpickr range) ---- */
  var fp = null, avail = document.getElementById('p-periode');
  if (avail && window.flatpickr) {
    fp = flatpickr(avail, {
      mode: 'range', minDate: 'today', dateFormat: 'Y-m-d',
      altInput: true, altFormat: 'j M Y',
      locale: (!EN && flatpickr.l10ns.nl) ? 'nl' : 'default'
    });
  }

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
      btn.disabled = true; btn.textContent = SENDING; err.classList.remove('on');
      var data = { taal: LANG, pagina: location.href, tijdstip: new Date().toISOString() };
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      Object.assign(data, attr);
      if (form.id === 'form-patient' && fp && fp.selectedDates.length) {
        data.beschikbaar_van = fp.formatDate(fp.selectedDates[0], 'Y-m-d');
        data.beschikbaar_tot = fp.formatDate(fp.selectedDates[fp.selectedDates.length - 1], 'Y-m-d');
      }
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
