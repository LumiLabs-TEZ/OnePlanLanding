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
    "@media (min-width:821px){.op-sticky{display:none}}";
  var st = document.createElement("style");
  st.appendChild(document.createTextNode(css));
  document.head.appendChild(st);
})();
