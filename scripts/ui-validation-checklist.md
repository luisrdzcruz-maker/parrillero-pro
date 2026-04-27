# UI validation checklist (Parrillero)

Use **Chrome or Safari** on real devices and/or **DevTools device toolbar** (e.g. iPhone 12/13, iPhone SE, small Android 360×800).

Target: `app/page.tsx` mobile shell (bottom `nav`, `!pb-[max(9rem,…+safe-area)]` padding).

---

## 0. Setup (every run)

- [ ] `npm run dev` — open the app, hard refresh
- [ ] **Viewport:** rotate portrait + landscape on small width
- [ ] **OS:** if possible, test **notch / home indicator** (safe-area)

---

## 1. No overflow on mobile

- [ ] Scroll every main mode (Inicio, Cocción wizard, result, Menu, Parrillada, etc.) **slowly**; no horizontal “wobble”
- [ ] **Long text:** trigger screens with long results / many cards; no sideways scroll
- [ ] **Zoom:** no accidental `font-size` / `100vw` elements wider than the screen (cards, modals, tables)

**Semi-automated:** With the app open, open **DevTools → Console**, paste the full contents of **`scripts/ui-audit.paste-in-console.js`**, then press Enter. It logs horizontal overflow, wide nodes, fixed bottom bars, and small tap targets.

---

## 2. Buttons (and tappable areas) are clickable

- [ ] All **primary** actions (e.g. “Generar plan”, “Crear menú”, tab switches) work on first tap (no need to zoom)
- [ ] **Touch targets** feel ≥ **44×44px** (Apple HIG) on text links that behave like buttons
- [ ] **No overlap:** a transparent layer or `pointer-events` is not eating taps (e.g. absolute overlays)
- [ ] **Bottom bar:** with keyboard dismissed, tab buttons respond and show active state

**Semi-automated:** the paste-in script can flag interactive elements under ~40px (informational; tune per design).

---

## 3. No hidden content behind the bottom nav

- [ ] On **mobile** (`md` breakpoint and below), scroll to the **last** item on each long screen: last line of copy / last button is **fully above** the bottom tab bar, not under it
- [ ] On devices with a **home indicator**, bottom padding still clears content (safe-area)
- [ ] **Cocción** flow: “Generar plan” and result cards’ footers are not clipped
- [ ] **Live cooking** / hero blocks: primary controls remain above the bar when possible

**Check:** the page shell should keep large bottom padding on small screens; if content hides, that padding or scroll container is wrong.

---

## 4. Consistent spacing

- [ ] **Horizontal:** same `px-*` / gutter feel between Inicio, panels, and results (no random flush-left on one step only)
- [ ] **Vertical:** section titles ↔ content gaps match within a mode (no one-off `mt-0` on a single card)
- [ ] **Between modes:** tab switch does not change outer padding in a jarring way
- [ ] **Focus states** (if visible): not clipped by `overflow: hidden` parents

---

## 5. Quick sign-off (release)

- [ ] **360×800** and **390×844** (or 430×932): no overflow, no clipped bottom
- [ ] **Landscape** narrow: still usable; critical buttons reachable
- [ ] **Lighthouse** (optional): no layout-shift explosions on load for main route

---

## Print this checklist in the terminal

```bash
npx tsx scripts/print-ui-checklist.ts
```

(Requires `tsx`, same as other scripts in this repo.)
