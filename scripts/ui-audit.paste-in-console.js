/**
 * DevTools console audit (mobile UI) — PASTE this entire file into the browser
 * console while your app is open (e.g. http://localhost:3000). Not for production
 * users; for developers only.
 *
 * Tip: scroll to the bottom of the page before running the "hidden behind nav"
 *       heuristic so the last content is in view.
 */
(function runUiAudit() {
  const doc = document.documentElement;
  const body = document.body;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scrollW = doc.scrollWidth;
  const scrollH = doc.scrollHeight;
  const horizOverflow = scrollW > vw + 1;

  console.log("[ui-audit] viewport", { vw, vh, scrollW, scrollH, horizOverflow });

  if (horizOverflow) {
    const wide = [];
    const all = body.querySelectorAll("*");
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (!(el instanceof HTMLElement)) continue;
      const r = el.getBoundingClientRect();
      if (r.width > vw + 2) {
        wide.push({
          tag: el.tagName,
          className: (el.className && String(el.className).slice(0, 80)) || "",
          w: Math.round(r.width),
        });
      }
    }
    console.warn("[ui-audit] elements wider than viewport (sample, max 15):", wide.slice(0, 15));
  }

  const fixedBottom = [];
  const forEachEl = (root) => {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let n = w.nextNode();
    while (n) {
      if (n instanceof HTMLElement) {
        const st = getComputedStyle(n);
        if (st.position === "fixed") {
          const b = st.bottom;
          if (b === "0px" || (parseFloat(b) === 0 && st.bottom && !st.bottom.includes("auto"))) {
            fixedBottom.push(n);
          }
        }
      }
      n = w.nextNode();
    }
  };
  forEachEl(body);
  const navHint = bottomNavBars(fixedBottom, vh, vw);
  console.log("[ui-audit] fixed bottom elements (count):", fixedBottom.length, navHint);

  const interactive = body.querySelectorAll(
    'button, a[href], [role="button"], input, select, textarea, .cursor-pointer',
  );
  const tooSmall = [];
  interactive.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const r = el.getBoundingClientRect();
    const area = r.width * r.height;
    if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40) && area < 2000) {
      tooSmall.push({ tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height) });
    }
  });
  if (tooSmall.length) {
    console.info(
      "[ui-audit] tappable areas < 40px (sample; review design, max 20):",
      tooSmall.slice(0, 20),
    );
  } else {
    console.log("[ui-audit] no tiny interactive targets in quick scan (threshold 40px).");
  }

  /** Guess bottom nav and whether last scroll position leaves room above it. */
  function bottomNavBars(fixedEls, innerH, innerW) {
    if (fixedEls.length === 0) return { note: "no position:fixed; bottom:0" };
    const navs = fixedEls.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom >= innerH - 2 && r.width > innerW * 0.4;
    });
    if (navs.length === 0) return { note: "no wide fixed bar at screen bottom" };
    const last = findBottomMostContent(body);
    if (last) {
      const r = last.getBoundingClientRect();
      const minNavH = 56;
      const clear = innerH - r.bottom;
      return {
        navBars: navs.length,
        lastContentBottom: Math.round(r.bottom),
        spaceBelowLastContentPx: Math.round(clear),
        manualCheck:
          clear < minNavH
            ? "Last content may sit under the bottom bar — verify scroll padding"
            : "Looks OK; still verify visually.",
      };
    }
    return { navBars: navs.length, note: "could not find obvious main content to compare" };
  }

  function findBottomMostContent(root) {
    const candidates = root.querySelectorAll(
      "main, [role=main], article, section, .prose, .px-3, .px-4",
    );
    let best = null;
    let bestBottom = -1;
    candidates.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const r = el.getBoundingClientRect();
      if (r.height < 8) return;
      if (r.bottom > bestBottom) {
        bestBottom = r.bottom;
        best = el;
      }
    });
    if (!best) return body;
    const deep = getDeepestVisibleChildAtBottom(best);
    return deep || best;
  }

  function getDeepestVisibleChildAtBottom(el) {
    let current = el;
    for (let d = 0; d < 5 && current.children.length; d++) {
      const children = [...current.children].filter((c) => c instanceof HTMLElement);
      if (children.length === 0) break;
      const last = children[children.length - 1];
      const r = last.getBoundingClientRect();
      if (r.height < 1) break;
      current = last;
    }
    return current;
  }
})();
