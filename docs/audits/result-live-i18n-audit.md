# Result + Live i18n Audit

## Scope

Audited files:

- `components/ResultHero.tsx`
- `components/ResultHeader.tsx`
- `components/ResultActions.tsx`
- `components/ResultGrid.tsx`
- `components/ResultCard.tsx`
- `components/ResultTimeline.tsx`
- `components/live/*`
- `lib/i18n/texts.ts`

Constraints respected:

- Read-only audit.
- No behavior changes.
- No i18n refactor.
- No product code edits.

## 1) Hardcoded Spanish strings

High-impact user-visible Spanish hardcoded directly in Result/Live components (not sourced from `lib/i18n/texts.ts`):

- `components/ResultHero.tsx`
  - `"Plan de coccion"`, `"Resultado listo"`, `"Tiempo"`, `"Objetivo"`, `"Reposo"`, `"Editar"`, `"Lo esencial para cocinar sin dudar."`, `"Senal segura"`.
- `components/ResultActions.tsx`
  - Live CTA/support labels (`"Siguiente accion"`, `"Abre la guia en vivo con este plan"`), save/share feedback strings (`"Guardando..."`, `"No se pudo guardar"`, `"Compartiendo..."`, `"Copiado al portapapeles"`), share message body.
- `components/ResultGrid.tsx`
  - Many card labels and subtitles: `"Visual de configuración"`, `"Control inteligente de zonas y prioridades"`, `"Error que arruina este corte"`, `"⏱️ Timeline Parrillada"`, `"🔥 Grill Manager Pro"`, `"🛒 Lista de compra"`, etc.
- `components/ResultCard.tsx`
  - Variant labels and setup toggle copy: `"Pasos de coccion"`, `"Error critico"`, `"Configuración del fuego"`, `"Visual de configuración"`, `"Zonas de calor y flujo recomendado"`, `"Ocultar"`, `"Ver →"`, `"Ahora"`, `"objetivo"`, `"Ocultar guía"`, `"Ver guía"`.
- `components/ResultTimeline.tsx`
  - Timeline controls/status are Spanish-only: `"Pausar live"`, `"Iniciar live"`, `"Pausar demo"`, `"Demo: empezar ahora"`, `"Ahora"`, `"Próximo"`, `"Empieza en"`, `"Parrillada lista"`, `"Todos los eventos del timeline han pasado."`, `"Duración aprox:"`.
- `components/live/Timeline.tsx`, `TimerDial.tsx`, `StepCard.tsx`, `LiveVisualGuideCard.tsx`, `liveVisualGuide.ts`
  - Spanish-only literals still present (`"Paso X de Y"`, `"Pausado"`, `"Quedan"`, `"¡Atención!"`, `"Manual"`, `"Calor directo"`, `"Zona indirecta"`, `"Guía visual"`, etc.).

## 2) Hardcoded English strings

User-visible hardcoded English appears in Result/Live components outside `texts.ts`:

- `components/ResultHero.tsx`
  - `"Cooking plan"`, `"Result ready"`, `"Time"`, `"Target"`, `"Rest"`, `"Edit"`, `"The essentials for confident cooking."`, `"Safety signal"`.
- `components/ResultActions.tsx`
  - `"Next action"`, `"Open the live guide with this plan"`, save/share status + feedback + share body.
- `components/ResultGrid.tsx`
  - `"Smart zone and priority control"`, `"Error that ruins this cut"`, `"⏱️ BBQ Timeline"`, `"🛒 Shopping list"`, etc.
- `components/ResultCard.tsx`
  - `"Cooking steps"`, `"Critical error"`, `"Times · Temperature"`, `"Fire setup"`, `"Hide"`, `"View →"`.
- `components/live` files
  - Many EN fallbacks are local literals in bilingual/trilingual ternaries or presets, not centralized in `texts.ts`.

## 3) Hardcoded Finnish strings

User-visible hardcoded Finnish appears in Result/Live components outside `texts.ts`:

- `components/ResultHero.tsx`
  - `"Kypsennyssuunnitelma"`, `"Tulos valmis"`, `"Aika"`, `"Tavoite"`, `"Lepuutus"`, `"Muokkaa"`, `"Turvasignaali"`.
- `components/ResultActions.tsx`
  - `"Seuraava toiminto"`, `"Avaa live-opas talla suunnitelmalla"`, save/share statuses and feedback.
- `components/ResultGrid.tsx`
  - `"Asetuskuva"`, `"Alykas vyohykkeiden ja prioriteettien hallinta"`, `"Virhe joka pilaa taman leikkauksen"`, `"⏱️ BBQ-aikajana"`, etc.
- `components/ResultCard.tsx`
  - `"Kypsennysvaiheet"`, `"Kriittinen virhe"`, `"Tuliasetus"`, `"Nayta →"`, `"Lampoalueet ja suositeltu jarjestys"`.
- `components/live` files
  - Finnish variants are hardcoded in per-component ternaries and labels in `LiveStepCard.tsx`.

## 4) Mixed-language risks

Key mixed-language risks in Result + Live surfaces:

- Spanish-only Live timeline in `components/ResultTimeline.tsx` regardless of app language.
- English `status: "Live"` in `components/ResultActions.tsx` for ES/FI contexts (intentional branding maybe, but inconsistent with surrounding translated copy).
- `components/live/StepCard.tsx` and `components/live/liveVisualGuide.ts` are largely Spanish-only while other Live components rely on `getLiveText(...)`.
- Cross-language key detection in `components/ResultGrid.tsx` relies on block labels (`SETUP`, `TIMES`, `TEMPERATURA`, etc.); mixed upstream payloads can cause title/order mismatch.
- Copy quality inconsistencies from accent-stripped strings in user-facing text (`"coccion"`, `"Alykas"`, `"Nayta"`, `"Lampo..."`) produce perceived language quality issues.

## 5) Missing or duplicated i18n keys

From the audited Result/Live files versus `lib/i18n/texts.ts`:

- Missing in `texts.ts` (Result + Live scope):
  - Result hero labels/subcopy (`plan`, `result ready`, `time`, `target`, `rest`, `edit`, safety label).
  - Result action states/feedback (`save`/`share` statuses, live helper microcopy, native share feedback lines).
  - Result grid/card labels (`setup visual`, `critical error`, `timeline title`, `shopping list label`, `grill manager subtitle`, setup toggle labels).
  - Result timeline controls/status (`start/pause live`, `start/pause demo`, active/next/done timeline phrases).
  - Live visual-guide labels and chip/action strings currently embedded in presets.
- Duplicated semantic copy:
  - Setup visual labels and setup-zone chips are duplicated in both `components/ResultGrid.tsx` and `components/ResultCard.tsx`.
  - Similar save/share status semantics appear in local `labels` object and also in broader app text domains.

## 6) User-visible copy that should move to `lib/i18n/texts.ts`

Priority copy domains to centralize in `texts.ts`:

- Result Hero domain:
  - plan/title fallbacks, metric labels, edit/fallback summary/safety badge label.
- Result Actions domain:
  - live eyebrow/helper/status, save/share statuses, share feedback, share body text.
- Result Grid/Card domain:
  - setup visual labels, section subtitles, localized block titles (`setup/times/temp/steps/shopping`), error-card title.
- Result Timeline domain:
  - all header button labels, live panel labels, active/next/done phrases, duration prefix.
- Live Visual Guide domain:
  - preset titles/actions/chips/tips and card header (`"Guía visual"`).

## 7) Low-risk fixes

Low-risk, behavior-preserving fixes recommended first:

- Centralize existing literals into `texts.ts` keys while keeping current rendering logic unchanged.
- Replace repeated per-component ternaries (`es`/`fi`/`en`) with text lookups only.
- Normalize existing copy quality (accented characters and Finnish diacritics) in key values, not in component logic.
- Deduplicate setup copy source (single key namespace consumed by both Result setup surfaces).
- Keep `"Live"` brand token explicit if desired, but document as intentional untranslated product term.

## 8) Fixes to postpone

Postpone until after low-risk key extraction:

- Reworking upstream block-key strategy (`SETUP`, `TIMES`, etc.) to remove language-dependent parsing assumptions.
- Migrating `surfaceFallbacks` and `texts.ts` into a single i18n architecture layer (larger structural change).
- Revising timeline information architecture or card ordering (product/UX scope, not pure i18n extraction).
- Broad terminology harmonization across all app modes outside Result/Live.

## Top i18n risks

1. Spanish-only strings still ship in Live timeline and visual-guide surfaces.
2. Result + Live copy is fragmented across many inline ternaries, creating drift and inconsistent parity across ES/EN/FI.
3. `texts.ts` lacks a complete Result/Live keyset, so translations are not centrally controlled.

## Suggested priority order

1. Extract all Result/Live user-visible literals into `texts.ts` keys (no behavior changes).
2. Replace local ternaries with key lookups and keep current fallback behavior.
3. Fix language-quality inconsistencies (diacritics/wording) inside centralized keys.
4. Deduplicate repeated setup/timeline copy domains.
5. Plan structural i18n consolidation (`surfaceFallbacks` vs `texts.ts`) as a separate refactor track.