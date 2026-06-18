/* OnePlan Travel — Trip Plan scroll-synced map.
   Reads .trip-stop[data-lat][data-lng] from the article and flies a Leaflet
   map to each stop as it scrolls into view (scrollytelling, à la ScrollMap). */
(function () {
  if (typeof L === 'undefined') return;
  var mapEl = document.getElementById('trip-map');
  if (!mapEl) return;
  var stops = [].slice.call(document.querySelectorAll('.trip-stop[data-lat]'));
  if (!stops.length) return;

  var pts = stops.map(function (s) {
    return [parseFloat(s.getAttribute('data-lat')), parseFloat(s.getAttribute('data-lng'))];
  });
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var map = L.map(mapEl, {
    scrollWheelZoom: false, zoomControl: true, attributionControl: false
  }).setView(pts[0], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);

  // faint full route + numbered pins
  L.polyline(pts, { color: '#0066cc', weight: 3, opacity: 0.28, dashArray: '1 9', lineCap: 'round' }).addTo(map);
  var markers = pts.map(function (p, i) {
    return L.marker(p, {
      icon: L.divIcon({ className: 'trip-pin', html: '<span><b>' + (i + 1) + '</b></span>', iconSize: [30, 30], iconAnchor: [15, 28] })
    }).addTo(map);
  });

  var bounds = L.latLngBounds(pts).pad(0.18);
  map.fitBounds(bounds);

  var active = -1;
  function activate(i) {
    if (i === active) return;
    active = i;
    markers.forEach(function (m, j) { if (m._icon) m._icon.classList.toggle('is-active', j === i); });
    stops.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
    if (i < 0) { map.flyToBounds(bounds, { duration: reduce ? 0 : 0.9 }); return; }
    map.flyTo(pts[i], 14, { duration: reduce ? 0 : 1.1 });
  }

  // on scroll, activate the stop nearest the vertical centre of the viewport
  // (and show the whole route while the intro still dominates the screen).
  var intro = document.querySelector('.trip-intro');
  function update() {
    if (intro) {
      var ir = intro.getBoundingClientRect();
      if (ir.bottom > window.innerHeight * 0.55) { activate(-1); return; }
    }
    var cy = window.innerHeight * 0.5, best = 0, bd = Infinity;
    for (var i = 0; i < stops.length; i++) {
      var r = stops[i].getBoundingClientRect();
      var c = (r.top + r.bottom) / 2, d = Math.abs(c - cy);
      if (d < bd) { bd = d; best = i; }
    }
    activate(best);
  }
  var last = 0;
  window.addEventListener('scroll', function () {
    var now = Date.now(); if (now - last < 90) return; last = now; update();
  }, { passive: true });
  update();

  // Leaflet needs a size kick once the sticky layout settles
  var fix = function () { map.invalidateSize(); if (active < 0) map.fitBounds(bounds); };
  setTimeout(fix, 250);
  window.addEventListener('load', fix);
  window.addEventListener('resize', function () { map.invalidateSize(); });
})();
