# Language Audit Report

Date: 2026-05-01  
Branch: `feature/product-core-data-driven-cuts`  
Model: Codex 5.3  
Scope: read-only audit of Spanish/English mixing in internal architecture

## 1. Executive summary

The repository contains intentional multilingual support at the UI and localization layers, but internal engine and data-pipeline logic still uses Spanish canonical values in critical paths.  
Most dangerous mixing is concentrated in cooking/parrillada core modules, where Spanish values are not only display content but control flow keys, enums, and parser contracts.

- **P0 (high risk):** Spanish canonical values in internal logic contracts (plan block keys, cut IDs, equipment IDs, zone enums, parser-required keys).
- **P1 (medium risk):** Spanish naming/comments/regex heuristics/log phrases embedded in engine QA and script logic.
- **P2 (low risk):** Spanish-heavy architecture and design docs, plus non-critical generated/audit outputs.

Validation commands were executed:

- `npm run lint` -> exit code `0`
- `npm run build` -> exit code `0`

## 2. P0 issues: internal logic using Spanish canonical values

### P0-1. Spanish plan section keys are part of internal engine contracts

- Files:
  - `lib/cookingRules.ts`
  - `lib/cookingOutputValidation.ts`
  - `lib/parser/normalizeBlocks.ts`
  - `scripts/cooking-engine-qa.ts`
  - `scripts/cooking-quality.ts`
- Issue:
  - Internal validation/parsing logic treats `TIEMPOS`, `TEMPERATURA`, `PASOS`, `CONSEJOS`, `COMPRA`, `ORDEN`, `CANTIDADES` as canonical behavior keys, not only presentation.
- Risk:
  - Language leakage across pipeline boundaries and brittle interoperability when internal services/scripts assume English-only contracts.

### P0-2. Spanish cut IDs are used as canonical product identifiers

- Files:
  - `lib/cookingCatalog.ts`
  - `lib/resolveCookingProfile.ts`
- Issue:
  - Core `productCatalog` includes IDs like `aguja`, `lomo_alto`, etc., used in matching and profile resolution.
- Risk:
  - Domain identity is language-coupled, complicating normalization, external integrations, and future schema enforcement.

### P0-3. Spanish equipment values drive core decision logic

- Files:
  - `lib/cookingRules.ts`
  - `lib/cookingQualityScore.ts`
  - `lib/cookingQaRun.ts`
  - `lib/qa/cookingDashboardQa.ts`
  - `scripts/cooking-engine-qa.ts`
  - `scripts/cooking-snapshots.ts`
  - `scripts/cooking-quality.ts`
  - `scripts/cooking-response-audit.ts`
- Issue:
  - Canonical equipment arrays use `"parrilla gas"`, `"parrilla carbón"`, `"cocina interior"` in internal test and scoring flows.
- Risk:
  - Internal logic behavior depends on Spanish labels instead of language-agnostic IDs.

### P0-4. Parrillada engine internal enums and state values are Spanish

- Files:
  - `lib/parrilladaEngine.ts`
  - `lib/uiHelpers.ts`
- Issue:
  - Internal zone/priority values include `"directa" | "indirecta" | "reposo" | "acompañamiento"` and `"alta" | "media" | "baja"`.
- Risk:
  - Business logic and UI helpers are tightly coupled to Spanish-state tokens, increasing migration and integration risk.

### P0-5. Live cooking internal zone state mixes Spanish and English

- File:
  - `lib/liveCookingPlan.ts`
- Issue:
  - Internal zone inference returns `"Directo"`, `"Indirecto"`, `"Reposo"`, `"Servir"` while parsing both Spanish and English text.
- Risk:
  - Runtime state machine values are localized strings instead of stable language-neutral enums.

## 3. P1 issues: Spanish names/comments/logs in engine/scripts/data pipeline

### P1-1. Spanish function naming in internal scoring utilities

- Files:
  - `lib/cookingQualityScore.ts`
  - `scripts/cooking-quality.ts`
- Examples:
  - `parseTemperaturaC`
- Risk:
  - Mixed-language internals reduce maintainability and increase cognitive load for English-only engineering workflows.

### P1-2. Spanish heuristics embedded in regex logic

- Files:
  - `lib/cookingQualityScore.ts`
  - `scripts/cooking-quality.ts`
  - `lib/cookingVisuals.ts`
  - `lib/setupVisualMap.ts`
- Issue:
  - Rule heuristics include Spanish behavior tokens (`reposo`, `fuego directo`, `sellado inverso`, `parrilla directa`, etc.) in core interpretation code.
- Risk:
  - Hard-coded mixed-language behavior in internal logic instead of normalized intermediary tokens.

### P1-3. Spanish fallback operational text in parser normalization

- File:
  - `lib/parser/normalizeBlocks.ts`
- Issue:
  - Fallback block text used during normalization is Spanish for multiple internal keys.
- Risk:
  - Internal fallback outputs can leak localized content into downstream non-UI processing.

### P1-4. Script output and warnings mix language-specific architecture terms

- Files:
  - `scripts/cooking-response-audit.ts`
  - `scripts/cooking-engine-qa.ts`
- Issue:
  - Script-level warnings and probes reference mixed key names (`PASOS/STEPS`, Spanish case inputs).
- Risk:
  - Operational QA outputs are inconsistent for English-only internal tooling consumers.

## 4. P2 issues: Spanish in docs or non-critical files

### P2-1. Architecture/design documentation contains extensive Spanish

- File:
  - `docs/cooking-live/v2.md`
- Issue:
  - Mixed-language architecture spec with many Spanish operational terms.
- Risk:
  - Lower onboarding clarity for English-only contributors; limited direct runtime risk.

### P2-2. Non-critical generated and QA output files include Spanish content

- Files:
  - `qa/cooking-response-audit.csv`
  - `lib/generated/cutProfiles.ts`
- Issue:
  - Spanish terms appear in generated aliases and response excerpts.
- Risk:
  - Low runtime risk; mostly reporting/content layer noise.

## 5. Allowed Spanish found

The following are considered acceptable under audit rules:

- **Visible UI labels and localized UI copy**
  - `lib/i18n/texts.ts`
  - `app/lib/i18n.ts`
  - UI-facing pages/components containing display strings.
- **Translation dictionaries / multilingual content**
  - `lib/i18n/texts.ts`
  - `app/lib/i18n.ts`
- **Localized cut names and aliases**
  - `data/cuts/parrillero_pro_input_profiles_en.csv`
  - `lib/generated/cutProfiles.ts`
- **Brand name**
  - `Parrillero Pro` references across the project.
- **Legacy adapter mappings**
  - `lib/legacyCookingInputAdapter.ts` (Spanish alias normalization/mapping is appropriate for backward compatibility).

## 6. Recommended fix order

1. **Stabilize internal contracts (P0 first)**
  - Introduce language-agnostic internal enums/IDs for plan sections, equipment, zones, and priorities.
2. **Decouple canonical IDs from localized labels**
  - Keep localized labels in i18n/data dictionaries, but enforce canonical English-neutral IDs in core models.
3. **Refactor parser/validator boundaries**
  - Normalize multilingual input at boundaries; keep only normalized internal tokens downstream.
4. **Rename mixed-language internal symbols**
  - Replace Spanish function/type/constant names in engine/scripts with English equivalents.
5. **Reduce mixed-language heuristics in logic**
  - Move language-specific regex terms into localization/adapter layers.
6. **Harden CI checks**
  - Add language-audit lint rules for internal folders (allowlisted exceptions for UI/i18n/localized data).
7. **Finally clean docs (P2)**
  - Align architecture docs to English after runtime contracts are stabilized.

## 7. Files that should NOT be changed (UI/i18n/localized content)

- `lib/i18n/texts.ts`
- `app/lib/i18n.ts`
- `data/cuts/parrillero_pro_input_profiles_en.csv`
- `lib/generated/cutProfiles.ts` (localized aliases/content)
- UI-facing copy in `app/`** and `components/**` where strings are user-visible/localized
- Legacy translation/mapping compatibility in `lib/legacyCookingInputAdapter.ts`