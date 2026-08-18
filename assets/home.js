(function () {
  var EN = (document.documentElement.lang || 'nl').slice(0, 2) === 'en';
  var T = EN
    ? { pill: 'Accepting new patients', go: 'View & register →', on: 'on', one: ' practice', many: ' practices', inCity: ' in ', tail: ' accepting new patients' }
    : { pill: 'Nu plek voor nieuwe patiënten', go: 'Bekijk & meld aan →', on: 'op', one: ' praktijk', many: ' praktijken', inCity: ' in ', tail: ' met plek voor nieuwe patiënten' };
  var all = (window.PRACTICES || []).filter(function (p) { return p.accepting !== false; });
  var list = document.getElementById('list'), count = document.getElementById('count'),
      nomatch = document.getElementById('nomatch'), select = document.getElementById('city');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // city dropdown from data
  var cities = all.map(function (p) { return p.city; }).filter(function (c, i, a) { return a.indexOf(c) === i; }).sort();
  cities.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; select.appendChild(o); });
  var fromUrl = new URLSearchParams(location.search).get('stad');
  if (fromUrl && cities.indexOf(fromUrl) > -1) select.value = fromUrl;

  function card(p) {
    return '<a class="practice" href="' + esc(EN && p.url_en ? p.url_en : p.url) + '">' +
      '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">' +
      '<div><span class="pill">' + T.pill + '</span>' +
      '<h3>' + esc(p.name) + '</h3><p class="loc">' + esc(p.area || p.city) + ' · ' + esc(p.address) + '</p>' +
      '<ul>' + ((EN && p.usps_en) || p.usps || []).slice(0, 4).map(function (u) { return '<li><svg class="icon"><use href="#i-check"/></svg><span>' + esc(u) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="foot">' + (p.rating ? '<span class="rating"><span class="stars" aria-hidden="true">★★★★★</span> <b>' + esc(p.rating) + '</b> ' + T.on + ' ' + esc(p.ratingSource || '') + '</span>' : '<span></span>') +
      '<span class="go">' + T.go + '</span></div></div></a>';
  }

  function render() {
    var city = select.value;
    var shown = city ? all.filter(function (p) { return p.city === city; }) : all;
    list.innerHTML = shown.map(card).join('');
    nomatch.hidden = shown.length > 0;
    var noun = shown.length === 1 ? T.one : T.many;
    count.textContent = shown.length ? shown.length + noun + (city ? T.inCity + city : T.tail) : '';
    var u = new URL(location); city ? u.searchParams.set('stad', city) : u.searchParams.delete('stad');
    history.replaceState(null, '', u);
  }
  select.addEventListener('change', render);
  render();
})();
