/* Shared renderer + EN/VI toggle + reading progress + active-section index.
   Each page sets window.LEGAL_DATA = { en:{...}, vi:{...} } before loading this. */
(function(){
  var data = window.LEGAL_DATA; if(!data) return;
  function q(s){ return document.querySelector(s); }
  function qa(s){ return [].slice.call(document.querySelectorAll(s)); }

  var saved = localStorage.getItem('oneplan-lang');
  var lang = saved || ((navigator.language||'en').toLowerCase().indexOf('vi')===0 ? 'vi' : 'en');
  if(lang!=='vi' && lang!=='en') lang='en';

  var io = null;

  function blockHTML(bl){
    if(bl[0]==='p')  return '<p>'+bl[1]+'</p>';
    if(bl[0]==='h3') return '<h3>'+bl[1]+'</h3>';
    if(bl[0]==='ul'){ return '<ul>'+bl[1].map(function(it){return '<li>'+it+'</li>';}).join('')+'</ul>'; }
    return '';
  }

  function render(){
    var d = data[lang];
    document.documentElement.lang = lang;
    document.title = d.docTitle;
    q('.lback-label').textContent = d.back;
    q('.leff').textContent = d.effLabel + ' · ' + d.effDate;
    q('.ltitle').textContent = d.title;
    var lead = q('.llead');
    if(d.lead){ lead.style.display=''; lead.textContent = d.lead; } else { lead.style.display='none'; }
    q('.ltoc h4').textContent = d.indexLabel;
    qa('.langtog button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-l')===lang); });

    var toc = q('#ltoc-list'); toc.innerHTML='';
    var host = q('#lsections'); host.innerHTML='';
    d.sections.forEach(function(s, i){
      var num = i+1, id = 'sec-'+s.id;
      var a = document.createElement('a');
      a.href = '#'+id; a.setAttribute('data-id', id); a.textContent = num+'. '+s.t;
      toc.appendChild(a);
      var sec = document.createElement('section');
      sec.className = 'leg-sec'; sec.id = id;
      sec.innerHTML = '<h2><span class="num">'+num+'.</span><span>'+s.t+'</span></h2>' + s.b.map(blockHTML).join('');
      host.appendChild(sec);
    });

    q('#lfoot-note').textContent = d.footer;
    var fb = q('#lfoot-back'); fb.textContent = d.backFull;

    initObserver();
    updateProgress();
  }

  function initObserver(){
    if(io) io.disconnect();
    if(!('IntersectionObserver' in window)) return;
    var links = {}; qa('#ltoc-list a').forEach(function(a){ links[a.getAttribute('data-id')] = a; });
    io = new IntersectionObserver(function(ents){
      ents.forEach(function(e){
        if(e.isIntersecting){
          qa('#ltoc-list a').forEach(function(a){ a.classList.remove('active'); });
          var l = links[e.target.id]; if(l) l.classList.add('active');
        }
      });
    }, { rootMargin:'-80px 0px -70% 0px', threshold:0 });
    qa('.leg-sec').forEach(function(s){ io.observe(s); });
  }

  function updateProgress(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var top = h.scrollTop || document.body.scrollTop || 0;
    var p = max>0 ? Math.min(1, Math.max(0, top/max)) : 0;
    var bar = q('.lprog'); if(bar) bar.style.width = (p*100).toFixed(1)+'%';
  }

  window.addEventListener('scroll', updateProgress, { passive:true });
  window.addEventListener('resize', updateProgress);

  qa('.langtog button').forEach(function(b){
    b.addEventListener('click', function(){
      lang = b.getAttribute('data-l');
      localStorage.setItem('oneplan-lang', lang);
      render();
    });
  });

  render();
})();
