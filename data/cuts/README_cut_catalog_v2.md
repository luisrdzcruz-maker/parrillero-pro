# Parrillero Pro Cut Catalog v2 package — schema version 2.1

Files intentionally keep the `*_v2.csv` names because the previous package was not added to the repo yet.

## Files

- `cut_catalog_v2.csv` — cut/variant rows with cooking, QA, prep, service, yield, and multi-cooking metadata.
- `cooking_profiles_v2.csv` — reusable cooking behavior profiles.
- `prep_profiles_v2.csv` — reusable prep/salting/dry-brine profiles.

## Key semantic decisions

### Time fields

- `setup_minutes_min/max`: preheat/setup time at session/equipment level.
- `active_cook_min/max_minutes`: time on grill/heat.
- `rest_min/max_minutes`: rest time.
- `cut_plan_minutes_min/max`: calculated as active cook + rest. This is what cut-level QA should validate.
- `session_total_minutes_min/max`: setup + cut plan. Useful for UI, but not for multi-cut per-cut QA.
- `prep_lead_time_min/max_minutes`: salting/brining/marinating lead time. Do not add this to session total.

### Temperature modes

- `doneness_target`: steak-style doneness options are allowed.
- `safe_temp`: doneness hidden; safe final temperature controls plan.
- `texture_breakdown`: low-and-slow cuts; probe tenderness/texture controls plan.
- `visual_only`: vegetables and some visual doneness items.
- `delicate_target_or_visual`: fish; short salt window and late scheduling.

### Critical examples represented

- `chuck_roast`: `temperature_mode=texture_breakdown`, `hide_doneness_selector=true`, no steak doneness.
- `tri_tip`: `temperature_mode=doneness_target`, medium-rare/medium temps, not 92°C.
- `picanha`: fat-cap behavior, flare-up risk, brief controlled fat-cap sear.
- `ribeye` + `bone_in_chuleton`: bone-in ribeye/chuletón is a ribeye variant using thick steak profile.
- `chicken_*`: `safe_temp`, no rare/medium options.
- `asparagus`: `visual_only`, high timing sensitivity, serve immediately.

## Migration notes

1. Import these files as data only.
2. Add validation checks before changing engine behavior.
3. Resolve time semantics first: cut QA should validate `cut_plan_minutes`, not `session_total_minutes`.
4. Use `temperature_mode` to decide whether to show doneness, safe temp, texture target, or visual guidance.
5. Use `prep_profile` and salt columns for prep guidance, not cooking duration.
6. Use multi-cooking fields gradually: zone demand, timing sensitivity, hold behavior, yield, attention load.

## Simple validation ideas

- Required columns exist in all CSVs.
- Every `cooking_profile` in `cut_catalog_v2.csv` exists in `cooking_profiles_v2.csv`.
- Every `prep_profile` in `cut_catalog_v2.csv` exists in `prep_profiles_v2.csv`.
- If `hide_doneness_selector=true`, `allowed_doneness` should be empty or non-steak.
- If `temperature_mode=texture_breakdown`, `forbidden_doneness` should include steak doneness.
- `cut_plan_minutes_min = active_cook_min_minutes + rest_min_minutes`.
- `session_total_minutes_min = setup_minutes_min + cut_plan_minutes_min`.
- Picanha rows must include fat-cap warnings.
- Poultry rows must include safe temperature warnings.

Generated rows:

- Cut catalog rows: 28
- Cooking profile rows: 16
- Prep profile rows: 10
