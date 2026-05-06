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
- pork_belly_slices

## Items Skipped
- none currently skipped in catalog-backed Parrillada Lite candidates.

## Metadata Coverage
- Included items are planningMetadata-backed.
- Fallback path exists.
- Current QA reported:
  - included metadata-backed items: 37
  - fallback-note items: 0
  - skipped items: 0

## Advanced Cut Tuning Note
- Scope limited to planning metadata, Parrillada eligibility, catalog quality reporting, and `qa:parrillada` coverage.
- Target cuts tuned: `brisket`, `short_ribs`, `baby_back_ribs`, `spare_ribs`, `pork_belly`, `chuck_roast`, `whole_chicken`, `spatchcock_chicken`, `pork_belly_slices`.
- Included after tuning: all nine target cuts remained catalog-eligible.
- Skipped after tuning: none of the target cuts; advanced safety gates now report explicit skip reasons when a targeted long-cook cut becomes unsafe.
- `pork_belly_slices` decision: kept as `standard` + `fastFinish` (short session), not forced into advanced long-cook handling.
- Confidence baseline: planning metadata remains `single-cut-engine/high` for all current catalog candidates.
- Long-cook planning hints now use metadata context (`Needs low and slow`, `Start early`, `Higher timing risk`) rather than one generic advanced hint.
- Remaining limitation: scheduler QA validates deterministic timeline sanity and warning surfacing, not full culinary optimization for every long-cook path.

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
- catalog: advanced long-cook + vegetable
- catalog: advanced long-cook + side
- catalog: ribs + side
- catalog: whole/spatchcock chicken + side
- catalog: pork belly + side
- catalog: pork belly slices + side
- catalog: brisket + chuck roast + side
- generated: beef + vegetable
- generated: pork + vegetable
- generated: chicken + side
- generated: fish + vegetable
- generated: sausage + side
- generated: advanced long-cook + fast finish
- generated: timing-sensitive + flexible
- generated: holdable main + delicate side

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
- Parrillada Lite QA scenarios stay within the 2-4 item range
- generated scenarios report explicit skips when a family cannot be built

## Catalog-Wide QA Summary
- scenario families generated: 8
- scenarios passed: 29/29
- scenarios skipped: 0
- included items covered by passing scenarios: 28
- advanced items covered by passing scenarios: 8
- warning severity totals (info/warning/critical): 27/21/5

## Validation Results
- `npm run qa:parrillada`: PASS 29/29
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
- advanced long-cook scenario can still produce low confidence when warning count exceeds threshold
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
4. Monitor advanced-cut safety gate skips in future catalog/report runs.
5. Later add Event/Pro mode for more than 4 items.
