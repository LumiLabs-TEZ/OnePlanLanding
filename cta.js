/* OnePlan, shared conversion script: device detection, App Store click tracking
   (Vercel Web Analytics custom events) + Apple campaign tokens, Zalo gating,
   and an injected sticky mobile CTA. Loaded on every page like trip.js.
   To activate the Android (Zalo) capture, set ZALO_URL below. */
(function () {
  var STORE = "https://apps.apple.com/us/app/oneplan-travel/id6761648165";
  var ZALO_URL = ""; // TODO set the Zalo OA/group URL to turn on Android capture

  var de = document.documentElement;
  var lang = (de.lang || "en").toLowerCase().indexOf("vi") === 0 ? "vi" : "en";
  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  var isMobile = isIOS || isAndroid || window.matchMedia("(max-width:820px)").matches;
  de.classList.add(isIOS ? "is-ios" : isAndroid ? "is-android" : "is-desktop");

  function track(name, props) {
    props = props || {};
    try { if (typeof window.va === "function") window.va("event", name, props); } catch (e) {}
    try { if (typeof window.fbq === "function") window.fbq("trackCustom", name, props); } catch (e) {}
    try { if (window.ttq && typeof ttq.track === "function") ttq.track(name, props); } catch (e) {}
  }
  function locOf(el) {
    var d = el.getAttribute && el.getAttribute("data-loc");
    if (d) return d;
    if (el.closest(".op-sticky")) return "sticky";
    if (el.closest(".art-cta")) return "article_end";
    if (el.closest(".cta-panel")) return "cta_panel";
    if (el.closest(".hero")) return "hero";
    if (el.closest(".foot, .jfoot")) return "footer";
    return "other";
  }
  function tagStore(a, loc) {
    if (a.href.indexOf("ct=") === -1) {
      a.href += (a.href.indexOf("?") === -1 ? "?" : "&") + "ct=site_" + loc + "_" + lang + "&mt=8";
    }
    a.addEventListener("click", function () { track("appstore_click", { location: loc, lang: lang }); });
  }

  // Tag + track every App Store link already in the page
  [].forEach.call(document.querySelectorAll('a[href*="apps.apple.com/us/app/oneplan-travel"]'), function (a) {
    tagStore(a, locOf(a));
  });
  // "Get the app" links that scroll to #download
  [].forEach.call(document.querySelectorAll('a[href$="#download"]'), function (a) {
    a.addEventListener("click", function () { track("download_cta_scroll", { lang: lang }); });
  });

  // Zalo gating: show the Android capture only when a Zalo URL is configured
  if (ZALO_URL) {
    de.classList.add("has-zalo");
    [].forEach.call(document.querySelectorAll("[data-zalo]"), function (a) {
      a.setAttribute("href", ZALO_URL);
      a.addEventListener("click", function () { track("zalo_click", { location: locOf(a), lang: lang }); });
    });
    [].forEach.call(document.querySelectorAll(".needs-zalo"), function (e) { e.hidden = false; });
    [].forEach.call(document.querySelectorAll(".no-zalo"), function (e) { e.hidden = true; });
  }

  // QR shown (desktop only): fire once when it scrolls into view
  var qr = document.querySelector(".dl-qr");
  if (qr && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { track("qr_shown", { lang: lang }); io.disconnect(); } });
    });
    io.observe(qr);
  }

  // Injected sticky mobile CTA, so it works site-wide without editing every file
  (function () {
    if (!isMobile) return;
    try { if (localStorage.getItem("op_sticky") === "0") return; } catch (e) {}
    var inner;
    if (isIOS) {
      inner = '<a class="badge" href="' + STORE + '" target="_blank" rel="noopener">' +
        '<span class="apple-glyph" aria-hidden="true"></span><span><span class="b1">' +
        (lang === "vi" ? "Tải về trên" : "Download on the") + '</span><span class="b2">App Store</span></span></a>';
    } else if (isAndroid && ZALO_URL) {
      inner = '<a class="op-zalo-btn" data-zalo href="' + ZALO_URL + '" target="_blank" rel="noopener">' +
        (lang === "vi" ? "Nhận thông báo bản Android" : "Get notified about Android") + "</a>";
    } else { return; }
    var bar = document.createElement("div");
    bar.className = "op-sticky";
    bar.innerHTML = inner + '<button class="op-sticky-x" type="button" aria-label="' +
      (lang === "vi" ? "Đóng" : "Dismiss") + '">&times;</button>';
    document.body.appendChild(bar);
    var sa = bar.querySelector('a[href*="apps.apple.com"]');
    if (sa) tagStore(sa, "sticky");
    var sz = bar.querySelector("[data-zalo]");
    if (sz) sz.addEventListener("click", function () { track("zalo_click", { location: "sticky", lang: lang }); });
    bar.querySelector(".op-sticky-x").addEventListener("click", function () {
      bar.remove(); try { localStorage.setItem("op_sticky", "0"); } catch (e) {}
    });
  })();

  // Injected floating promo card (desktop only): Unikorn Product of the Day + App Store.
  // Mobile keeps the sticky bar above, so this never overlaps it.
  (function () {
    if (isMobile) return;
    var state;
    try { state = localStorage.getItem("op_float"); } catch (e) {}
    if (state === "closed") return;

    var UNI_LINK = "https://unikorn.vn/p/oneplan-travel?ref=embed-oneplan-travel";
    var UNI_BADGE = "https://unikorn.vn/api/widgets/badge/oneplan-travel/rank?theme=light&amp;type=daily";
    var T = lang === "vi"
      ? { neu: "MỚI", sub: "Lên kế hoạch nhóm, chia tiền, tất cả trong một app.", b1: "Tải về trên", min: "Thu nhỏ", x: "Đóng", open: "Mở OnePlan", pod: "Sản phẩm của ngày" }
      : { neu: "NEW", sub: "Plan group trips and split costs, all in one place.", b1: "Download on the", min: "Minimize", x: "Dismiss", open: "Show OnePlan offer", pod: "Product of the Day" };

    function save(v) { try { localStorage.setItem("op_float", v); } catch (e) {} }

    var wrap = document.createElement("div");
    wrap.className = "op-float-wrap";
    document.body.appendChild(wrap);
    var card, launcher;

    function showCard() {
      if (card) return;
      if (launcher) { launcher.remove(); launcher = null; }
      card = document.createElement("div");
      card.className = "op-float";
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-label", "OnePlan Travel");
      card.innerHTML =
        '<div class="op-float-media"><img src="/assets/Thumbnail.jpg" alt="" loading="lazy" />' +
          '<div class="op-float-ctrls">' +
            '<button class="op-float-min" type="button" aria-label="' + T.min + '">–</button>' +
            '<button class="op-float-x" type="button" aria-label="' + T.x + '">×</button>' +
          '</div></div>' +
        '<div class="op-float-body">' +
          '<div class="op-float-head"><img class="op-float-icon" src="/assets/logo-icon.png" alt="" />' +
            '<div class="op-float-meta"><div class="op-float-name">OnePlan Travel <span class="op-float-tag">' + T.neu + '</span></div>' +
            '<div class="op-float-sub">' + T.sub + '</div></div></div>' +
          '<a class="op-float-uni" href="' + UNI_LINK + '" target="_blank" rel="noopener" aria-label="OnePlan Travel on Unikorn.vn">' +
            '<img src="' + UNI_BADGE + '" alt="OnePlan Travel daily rank on Unikorn.vn" width="264" height="64" loading="lazy" /></a>' +
          '<a class="badge op-float-dl" data-loc="float" href="' + STORE + '" target="_blank" rel="noopener">' +
            '<span class="apple-glyph" aria-hidden="true"></span><span><span class="b1">' + T.b1 + '</span><span class="b2">App Store</span></span></a>' +
        '</div>';
      wrap.appendChild(card);
      var dl = card.querySelector(".op-float-dl"); if (dl) tagStore(dl, "float");
      var uni = card.querySelector(".op-float-uni");
      if (uni) uni.addEventListener("click", function () { track("unikorn_click", { location: "float", lang: lang }); });
      card.querySelector(".op-float-min").addEventListener("click", function () { card.remove(); card = null; save("min"); showLauncher(); });
      card.querySelector(".op-float-x").addEventListener("click", function () { card.remove(); card = null; save("closed"); });
      track("float_shown", { lang: lang });
    }

    function showLauncher() {
      if (launcher) return;
      launcher = document.createElement("button");
      launcher.type = "button";
      launcher.className = "op-float-launch";
      launcher.setAttribute("aria-label", T.open);
      launcher.innerHTML = '<img src="/assets/logo-icon.png" alt="" /><span>🏆 ' + T.pod + '</span>';
      launcher.addEventListener("click", function () { save("open"); showCard(); });
      wrap.appendChild(launcher);
    }

    if (state === "min") showLauncher(); else showCard();
  })();

  // Minimal CSS for the sticky bar + Zalo button (works on every page)
  var css =
    ".op-sticky{position:fixed;left:0;right:0;bottom:0;z-index:90;display:flex;align-items:center;justify-content:center;gap:10px;" +
    "padding:10px 46px;padding-bottom:calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);" +
    "-webkit-backdrop-filter:saturate(180%) blur(12px);backdrop-filter:saturate(180%) blur(12px);border-top:1px solid rgba(0,0,0,.08);box-shadow:0 -6px 20px rgba(0,0,0,.10)}" +
    ".op-sticky .badge{display:inline-flex;align-items:center;gap:10px;background:#282828;color:#fff;border-radius:14px;padding:11px 18px;text-decoration:none}" +
    ".op-sticky .badge .b1{font-size:10px;opacity:.72;display:block;line-height:1.2}.op-sticky .badge .b2{font-weight:600;font-size:15px;display:block}" +
    ".op-sticky .apple-glyph{width:18px;height:22px;flex:none;background:currentColor;-webkit-mask:url(/assets/Apple-logo.svg) no-repeat center/contain;mask:url(/assets/Apple-logo.svg) no-repeat center/contain}" +
    ".op-sticky-x{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:0;background:transparent;font-size:24px;line-height:1;color:#8d8d84;cursor:pointer}" +
    ".op-zalo-btn{display:inline-flex;align-items:center;gap:8px;font-family:inherit;font-weight:600;font-size:15px;color:#fff;background:#0068ff;border-radius:14px;padding:13px 22px;border:0;cursor:pointer;text-decoration:none}" +
    ".op-zalo-btn:hover{background:#0057d6}" +
    "@media (min-width:821px){.op-sticky{display:none}}" +
    // floating promo card (desktop)
    ".op-float-wrap{position:fixed;right:20px;bottom:20px;z-index:95;display:flex;flex-direction:column;align-items:flex-end;gap:10px;pointer-events:none}" +
    ".op-float,.op-float-launch{pointer-events:auto}" +
    ".op-float{width:340px;max-width:calc(100vw - 40px);background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:20px;box-shadow:0 18px 50px rgba(20,20,40,.18);overflow:hidden;animation:opFloatIn .5s cubic-bezier(.16,1,.3,1) both}" +
    ".op-float-media{position:relative;aspect-ratio:16/9;background:#f1efe9}" +
    ".op-float-media img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".op-float-ctrls{position:absolute;top:8px;right:8px;display:flex;gap:6px}" +
    ".op-float-ctrls button{width:28px;height:28px;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:#3a3a3a;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:background .15s,transform .15s}" +
    ".op-float-ctrls button:hover{background:#fff;transform:translateY(-1px)}" +
    ".op-float-body{padding:14px 16px 16px}" +
    ".op-float-head{display:flex;gap:10px;align-items:center;margin-bottom:12px}" +
    ".op-float-icon{width:40px;height:40px;border-radius:10px;flex:none;box-shadow:0 1px 4px rgba(0,0,0,.12)}" +
    ".op-float-name{font-weight:700;font-size:15px;color:#1c1c1e;display:flex;align-items:center;gap:6px;line-height:1.2}" +
    ".op-float-tag{font-size:9px;font-weight:700;letter-spacing:.04em;color:#0066cc;background:rgba(0,102,204,.12);border-radius:5px;padding:2px 5px}" +
    ".op-float-sub{font-size:12.5px;color:#6b6b70;margin-top:3px;line-height:1.4}" +
    ".op-float-uni{display:block;margin:0 0 12px;text-align:center}" +
    ".op-float-uni img{width:100%;max-width:264px;height:auto;display:inline-block}" +
    ".op-float .badge.op-float-dl{display:flex;align-items:center;justify-content:center;gap:10px;background:#282828;color:#fff;border-radius:14px;padding:12px 18px;text-decoration:none;transition:transform .15s,box-shadow .15s}" +
    ".op-float .badge.op-float-dl:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.18)}" +
    ".op-float .op-float-dl .b1{font-size:10px;opacity:.72;display:block;line-height:1.2}.op-float .op-float-dl .b2{font-weight:600;font-size:15px;display:block}" +
    ".op-float .op-float-dl .apple-glyph{width:18px;height:22px;flex:none;background:currentColor;-webkit-mask:url(/assets/Apple-logo.svg) no-repeat center/contain;mask:url(/assets/Apple-logo.svg) no-repeat center/contain}" +
    ".op-float-launch{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:999px;padding:8px 14px 8px 8px;box-shadow:0 10px 30px rgba(20,20,40,.16);cursor:pointer;font-family:inherit;font-weight:600;font-size:13px;color:#1c1c1e;animation:opFadeIn .3s ease both}" +
    ".op-float-launch img{width:28px;height:28px;border-radius:8px}" +
    ".op-float-launch:hover{transform:translateY(-1px);box-shadow:0 14px 34px rgba(20,20,40,.22)}" +
    "@keyframes opFloatIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}" +
    "@keyframes opFadeIn{from{opacity:0}to{opacity:1}}" +
    "@media (max-width:820px){.op-float-wrap{display:none}}" +
    "@media (prefers-reduced-motion:reduce){.op-float,.op-float-launch{animation:none}}";
  var st = document.createElement("style");
  st.appendChild(document.createTextNode(css));
  document.head.appendChild(st);
})();
