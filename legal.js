/* Legal pages: content is pre-rendered per language (EN at /…, VI at /vi/…).
   This only powers the reading-progress bar and the active section in the index. */
(function(){
  function qa(s){ return [].slice.call(document.querySelectorAll(s)); }
  function q(s){ return document.querySelector(s); }

  // Active section in the table of contents
  if('IntersectionObserver' in window){
    var links = {};
    qa('#ltoc-list a').forEach(function(a){ links[a.getAttribute('data-id')] = a; });
    var io = new IntersectionObserver(function(ents){
      ents.forEach(function(e){
        if(e.isIntersecting){
          qa('#ltoc-list a').forEach(function(a){ a.classList.remove('active'); });
          var l = links[e.target.id]; if(l) l.classList.add('active');
        }
      });
    }, { rootMargin:'-80px 0px -70% 0px', threshold:0 });
    qa('.leg-sec').forEach(function(s){ io.observe(s); });
  }

  // Reading-progress bar
  function update(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var top = h.scrollTop || document.body.scrollTop || 0;
    var p = max>0 ? Math.min(1, Math.max(0, top/max)) : 0;
    var bar = q('.lprog'); if(bar) bar.style.width = (p*100).toFixed(1)+'%';
  }
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  update();
})();
