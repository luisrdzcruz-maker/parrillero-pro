# Critical Cut Output Review

Date: 2026-05-06

Branch: `qa/critical-cut-output-review`

Scope:
- Review critical single-cut outputs for temperature mode, doneness safety, timing semantics, prep guidance, fat-cap or flare-up warnings, ResultHero-style session totals, and live phase metadata.
- Apply only the focused Bone-in ribeye / Chuletón normalization needed to keep it distinct from normal ribeye and Tomahawk.

Validation used:
- `npm run validate:cuts:v2`
- `npm run qa:cooking`

## Summary

No dangerous output issue was found in the reviewed critical cuts after the Chuletón normalization.

The old canonical naming was present:
- `cut_id=ribeye`
- `variant_id=bone_in_chuleton`

It was normalized to:
- `cut_id=bone_in_ribeye`
- `variant_id=chuleton`

Legacy aliases still resolve to `bone_in_ribeye/chuleton`, including:
- `ribeye + bone_in_chuleton`
- `ribeye:bone_in_chuleton`
- `bone_in_chuleton`
- `chuleton`
- `chuletón`
- `bone-in ribeye`
- `cowboy steak`

## Cut Review

| Cut reviewed | Observed output summary | Pass / fail | Issues found | Fix timing |
| --- | --- | --- | --- | --- |
| `ribeye / steak` | `doneness_target`; normal steak profile; direct or direct-plus-two-zone behavior; dry brine `45 min-24 h`; cut-plan time excludes setup. | PASS | None. Kept separate from Chuletón. | No fix needed. |
| `bone_in_ribeye / chuleton` | `doneness_target`; `thick_beef_direct_indirect`; bone-aware thick steak input profile; dry brine `2-24 h`; longer rest and larger grill area than normal ribeye. | PASS | Old `ribeye/bone_in_chuleton` canonical row existed. Runtime aliases could drift toward Tomahawk through generated aliases without an override. | Fixed now. |
| `tomahawk / long_bone` | `doneness_target`; `thick_beef_direct_indirect`; long-bone variant remains separate from Chuletón; timing remains longer than normal steak. | PASS | CSV variant was `default`, not `long_bone`. | Fixed now. |
| `picanha / whole` | `doneness_target`; whole fat-cap profile; indirect-first with brief controlled fat-cap sear; warning codes include fat-cap burn, flare-up, and move-to-indirect behavior. | PASS | None. | No fix needed. |
| `tri_tip` | `doneness_target`; medium-rare/medium only; reverse-sear roast behavior; slices against two grain directions; not a 92°C texture target. | PASS | Generated source still labels style as low-slow, but catalog/runtime guards force doneness target. | Later cleanup only. |
| `chuck_roast` | `texture_breakdown`; doneness selector hidden; probe-tender guidance; long low-and-slow timing; dry brine `12-24 h`. | PASS | None. | No fix needed. |
| `brisket` | `texture_breakdown`; doneness selector hidden; stall/probe-tender/long-hold warnings; fat-cap protection metadata; session total remains long and realistic. | PASS | None. | No fix needed. |
| `pork_ribs` | `texture_breakdown`; doneness selector hidden; safe pork/rub salt awareness; low-and-slow timing; no steak doneness. | PASS | None. | No fix needed. |
| `chicken_breast` | `safe_temp`; doneness selector hidden; unsafe rare request resolves to safe target; lean poultry over-salting warning present. | PASS | None. | No fix needed. |
| `whole_chicken` | `safe_temp`; doneness selector hidden; breast/thigh safe-temp guidance; whole-bird dry brine and cross-contamination warnings present. | PASS | None. | No fix needed. |
| `salmon` | `delicate_target`; short fish salting window `10-30 min`; serve-immediately and overcook-risk warnings; not treated like steak. | PASS | None. | No fix needed. |
| `virrey` | `delicate_target`; short fish salting window `10-30 min`; serve-immediately and overcook-risk warnings; not treated like steak. | PASS | None. | No fix needed. |
| `asparagus` | `visual_only`; doneness selector hidden; salt just before; no meat temperature target; live metadata keeps setup/cook phases distinct. | PASS | None. | No fix needed. |

## Ribeye / Chuletón / Tomahawk Differences

`ribeye / steak` remains the normal quick steak model:
- `cut_id=ribeye`
- `variant_id=steak`
- display ES: `Ribeye / Entrecot`
- display EN: `Ribeye steak`
- `cooking_profile=steak_direct`
- dry brine `45 min-24 h`
- smaller grill area and normal steak rest

`bone_in_ribeye / chuleton` is now the canonical Chuletón model:
- `cut_id=bone_in_ribeye`
- `variant_id=chuleton`
- display ES: `Chuletón`
- display EN: `Bone-in ribeye / Chuletón`
- `cooking_profile=thick_beef_direct_indirect`
- `input_profile=thick_steak_bone_in_thickness_weight`
- dry brine `2-24 h`
- two-zone / reverse-sear friendly
- larger area, bone-aware probing, longer rest, and timing that does not collapse to thin ribeye timing

`tomahawk / long_bone` remains separate:
- `cut_id=tomahawk`
- `variant_id=long_bone`
- display ES/EN: `Tomahawk`
- `cooking_profile=thick_beef_direct_indirect`
- long-bone shape remains distinct from Chuletón

## Remaining Risks / Later Work

- Resolved in `docs/qa/critical-alias-metadata-cleanup.md`: generated Tomahawk aliases no longer claim generic bone-in ribeye / cowboy steak identity.
- Resolved in `docs/qa/critical-alias-metadata-cleanup.md`: generated `tri_tip` metadata no longer exposes `low_slow` as its primary style.
