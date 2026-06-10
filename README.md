# OnePlan landing page

Apple-style (apple.com / iPhone) landing page for OnePlan Travel, generated from the
Apple-inspired design system in `../DESIGN.md` (via `npx getdesign add apple`).

## Stack
- `index.html` — one self-contained file (inline CSS + a small scroll-reveal/carousel script). No build step.
- SF Pro on Apple devices (system font), Inter as cross-platform fallback (Google Fonts link).
- `assets/` — `hero.mp4` (hero film), `demo_poster.jpg` (hero poster fallback), `logo.png`,
  `screens/` (app screenshots @3x, 1179×2556).

## Layout (mirrors apple.com/iphone-air)
Hero film → "Get the highlights" reel → deep features (Save / Plan / Split, weight-400 headlines) →
"Worth the switch?" stat grid → Ready-made plans carousel ("Why Apple"-style cards) → closing → footer.
Single accent: Action Blue #0066cc. One product shadow. Alternating light/parchment ↔ dark sections.

## Preview locally
```
python3 serve.py        # http://localhost:8000  (HTTP/1.1 + Range, so hero.mp4 plays)
```

## TODO before go-live
1. Point `/privacy` and `/terms` at the real pages.
2. (Optional) Add looping clips to the 5 "Get the highlights" cards (assets/clips/, swap <img> → <video>).
3. For production, self-host Inter (or rely on SF Pro on Apple devices) instead of the Google Fonts link.

App Store link is live: https://apps.apple.com/us/app/oneplan-travel/id6761648165
