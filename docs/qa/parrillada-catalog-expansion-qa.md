# Parrillada Catalog Expansion QA

## Summary
Parrillada Lite now uses catalog-backed planning items resolved through single-cut planningMetadata, while preserving the demo fallback path when catalog-backed coverage is unavailable.

## Scope
This QA covers:
- catalog-backed Parrillada item source
- planningMetadata-backed planner inputs
- Menu Builder compatibility
- scheduler sanity checks
- expanded `qa:parrillada` scenarios

## Out of Scope
This QA does not prove:
- chef-perfect culinary quality for every cut
- full production multi-zone event planning
- saved Parrillada menus
- Live multi-cut execution
- Smart Probe integration
- Supabase persistence
- full UI polish for very large catalogs

## Catalog Items Included
Currently included Parrillada catalog items:
- ribeye
- bone_in_ribeye
- picanha
- iberian_secreto
- chicken_wing
- salmon
- asparagus
- corn_on_cob
- pork_tenderloin
- pork_chop
- sausages
- chorizo_criollo
- striploin
- tenderloin
- skirt_steak
- flank_steak
- t_bone
- tomahawk
- pork_loin
- iberian_presa
- pork_collar
- chicken_breast
- chicken_drumstick
- chicken_leg_quarter
- whole_chicken
- spatchcock_chicken
- potato_halves
- mushrooms
- bell_peppers
- eggplant_slices
- brisket
- short_ribs
- baby_back_ribs
- spare_ribs
- pork_belly
- chuck_roast

## Items Skipped
- pork_belly_slices: excluded by advanced safety gate because session duration is too short for advanced long-cook handling.

## Metadata Coverage
- Included items are planningMetadata-backed.
- Fallback path exists.
- Current QA reported:
  - included metadata-backed items: 36
  - fallback-note items: 0
  - skipped items: 1

## QA Scenarios
`qa:parrillada` currently covers:
- original demo scenarios
- catalog: ribeye + asparagus
- catalog: picanha + iberian_secreto + asparagus
- catalog: chicken_wing + corn_on_cob
- catalog: salmon + asparagus + corn_on_cob
- catalog: default 4-item menu
- catalog: beef + vegetable mix
- catalog: pork + vegetable mix
- catalog: chicken + side mix
- catalog: fish + vegetable mix
- catalog: default expanded 4-item menu
- catalog: advanced long-cook mix if safe items resolve

## Assertions Covered
`qa:parrillada` validates:
- plan exists
- timeline is non-empty
- phases are sorted by start time
- global preheat ends before first cook/sear/check/flip
- prep ends before cook/sear
- cook/sear finishes before rest/hold/serve
- serve happens near requested serve time
- no non-positive duration
- plan confidence exists
- warnings array exists
- catalog-backed items have planningMetadata or explicit fallback note

## Validation Results
- `npm run qa:parrillada`: PASS 15/15
- `npm run qa:cooking`: PASS 1116/1116
- `npm run lint`: PASS with known `app/page.tsx` warning
- `npm run build`: PASS

## Manual QA Checklist
- Menu / BBQ Plan opens Parrillada Lite
- selected menu is readable
- Add item panel opens
- category filters work
- search works
- recommended/standard/advanced grouping is readable
- icons render or fallback safely
- selecting 1 item shows incomplete state
- selecting 2-4 items generates timeline
- selecting 5th item is blocked
- serve time edit does not crash
- Set earliest serve time works
- timeline updates after item/strategy/time changes
- Home/Cooking/Live/Saved still reachable

## Known Risks
- advanced long-cook scenario can produce lower confidence and warnings
- QA validates scheduler structure, not perfect culinary outcome
- full catalog may need stronger metadata quality review
- large catalog may later need sticky category headers or real bottom sheet/modal
- grill model capacity is still simplified
- no saved Parrillada menus yet
- no Live multi-cut execution yet

## Recommended Next Steps
1. Commit current catalog expansion and QA report.
2. Run final validation.
3. Push PR.
4. In follow-up branch, tune advanced cuts and full catalog metadata quality.
5. Later add Event/Pro mode for more than 4 items.
