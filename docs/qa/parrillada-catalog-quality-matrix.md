# Parrillada Catalog Quality Matrix

Generated at: 2026-05-06T23:04:40.083Z

## Summary
- Total candidates: 37
- Included items: 37
- Skipped items: 0
- Metadata-backed items: 37
- Fallback-note items: 0
- High confidence count: 37
- Medium confidence count: 0
- Low confidence count: 0
- Recommended count: 11
- Standard count: 17
- Advanced count: 9
- Items requiring early start: 11
- Items with risk tags: 32
- Target advanced-tuning cuts included: 9
- Target advanced-tuning cuts skipped: 0

## Confidence Breakdown
- High: 37
- Medium: 0
- Low: 0
- Missing: 0

## Skipped Items and Reasons
- none

## Advanced Item Notes
- bone_in_ribeye (Bone-in ribeye / Chuletón): totalSession=53m, riskTags=-, requiresEarlyStart=yes, planningHint=Higher timing risk, notes=-
- tomahawk (Tomahawk): totalSession=55m, riskTags=-, requiresEarlyStart=yes, planningHint=Higher timing risk, notes=-
- whole_chicken (Whole Chicken): totalSession=99m, riskTags=safety_critical, safe_temp_mode, requiresEarlyStart=yes, planningHint=Higher timing risk, notes=-
- brisket (Brisket): totalSession=680m, riskTags=safety_critical, fat_cap, fatcap_probe_tender_not_doneness, requiresEarlyStart=yes, planningHint=Needs low and slow, notes=-
- short_ribs (Short Ribs): totalSession=305m, riskTags=safety_critical, requiresEarlyStart=yes, planningHint=Needs low and slow, notes=-
- baby_back_ribs (Baby Back Ribs): totalSession=210m, riskTags=safety_critical, requiresEarlyStart=yes, planningHint=Higher timing risk, notes=-
- spare_ribs (Spare Ribs): totalSession=270m, riskTags=safety_critical, requiresEarlyStart=yes, planningHint=Higher timing risk, notes=-
- pork_belly (Pork Belly): totalSession=165m, riskTags=safety_critical, requiresEarlyStart=yes, planningHint=Higher timing risk, notes=-
- chuck_roast (Chuck Roast): totalSession=370m, riskTags=safety_critical, requiresEarlyStart=yes, planningHint=Needs low and slow, notes=-

## Main Risk Areas
- safety_critical: 19
- fast_cook: 16
- safe_temp_mode: 13
- fat_cap: 3
- flare_up_high: 2
- fatcap_flare_up_risk: 2
- fatcap_move_to_indirect_on_flareup: 2
- fatcap_fat_cap_burn_risk: 1
- fatcap_slice_against_grain: 1
- delicate_target_mode: 1
- fatcap_probe_tender_not_doneness: 1

## Recommended Next Actions
- Prioritize medium/low/missing confidence rows and improve metadata derivation before expanding eligibility.
- Keep advanced rows behind stricter safety gates until risk tags and timing sensitivity are validated in additional scenarios.
- Expand scenario coverage in `qa:parrillada` for high-risk tags that appear most often.
- Re-run this report after any catalog or planningMetadata updates to track quality drift.

## Full Item Matrix

| cutId | displayName | status | skipReason | animal | category | planningMetadataSource | planningMetadataConfidence | setupMinutes | activeCookMinutes | restMinutes | totalSessionMinutes | requiredZones | preferredZones | zoneDemand | timingSensitivity | canHoldWarm | maxHoldMinutes | serveWindowMinutes | riskTags | visibility | role | complexity | goodForGroups | requiresEarlyStart | planningHint | targetCut | advancedSafetyStatus | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ribeye | Ribeye | included | - | Beef | Beef | single-cut-engine | high | 10 | 5 | 5 | 20 | direct_high | direct_high, direct_medium, indirect_medium | low | high | no | 8 | 8 | fast_cook | recommended | main | easy | yes | no | Main cut | no | not_required | - |
| bone_in_ribeye | Bone-in ribeye / Chuletón | included | - | Beef | Beef | single-cut-engine | high | 10 | 31 | 12 | 53 | direct_high, indirect_medium | indirect_medium, direct_high | low | high | no | 8 | 8 | - | advanced | longCook | advanced | yes | yes | Higher timing risk | no | passed | - |
| picanha | Picanha | included | - | Beef | Beef | single-cut-engine | high | 10 | 33 | 10 | 53 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium | low | medium | yes | 20 | 12 | fat_cap, flare_up_high, fatcap_fat_cap_burn_risk, fatcap_flare_up_risk, fatcap_move_to_indirect_on_flareup, fatcap_slice_against_grain | recommended | main | medium | yes | no | Good for groups | no | not_required | - |
| striploin | Striploin | included | - | Beef | Beef | single-cut-engine | high | 10 | 5 | 5 | 20 | direct_high | direct_high, direct_medium, indirect_medium | low | high | no | 8 | 8 | fast_cook | recommended | main | easy | yes | no | Main cut | no | not_required | - |
| tenderloin | Tenderloin | included | - | Beef | Beef | single-cut-engine | high | 10 | 5 | 5 | 20 | direct_high | direct_high, direct_medium, indirect_medium | low | high | no | 8 | 8 | fast_cook | recommended | main | medium | no | no | Serve immediately | no | not_required | - |
| skirt_steak | Skirt Steak | included | - | Beef | Beef | single-cut-engine | high | 10 | 3 | 5 | 18 | direct_high | direct_high, direct_medium, indirect_medium | low | high | no | 8 | 8 | fast_cook | standard | fastFinish | medium | no | no | Fast finish | no | not_required | - |
| flank_steak | Flank Steak | included | - | Beef | Beef | single-cut-engine | high | 10 | 3 | 5 | 18 | direct_high | direct_high, direct_medium, indirect_medium | low | high | no | 8 | 8 | fast_cook | standard | main | medium | no | no | Slice before serving | no | not_required | - |
| t_bone | T-Bone | included | - | Beef | Beef | single-cut-engine | high | 10 | 25 | 5 | 40 | direct_high | direct_high, direct_medium, indirect_medium | low | high | no | 8 | 8 | - | recommended | main | medium | yes | no | Main cut | no | not_required | - |
| tomahawk | Tomahawk | included | - | Beef | Beef | single-cut-engine | high | 10 | 35 | 10 | 55 | direct_high, indirect_medium | indirect_medium, direct_high | low | high | no | 8 | 8 | - | advanced | longCook | advanced | yes | yes | Higher timing risk | no | passed | - |
| iberian_secreto | Iberian Secreto | included | - | Pork | Pork | single-cut-engine | high | 10 | 4 | 5 | 19 | direct_high | direct_high, direct_medium | low | high | no | 5 | 5 | safe_temp_mode, fast_cook | recommended | fastFinish | medium | no | no | Fast finish | no | not_required | - |
| pork_loin | Pork Loin | included | - | Pork | Pork | single-cut-engine | high | 10 | 100 | 5 | 115 | indirect_medium, plancha | plancha, direct_medium, indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical | recommended | main | medium | yes | yes | Main cut | no | not_required | - |
| iberian_presa | Iberian Presa | included | - | Pork | Pork | single-cut-engine | high | 10 | 6 | 5 | 21 | direct_high | direct_high, direct_medium | low | high | no | 5 | 5 | safe_temp_mode, fast_cook | recommended | fastFinish | medium | no | no | Fast finish | no | not_required | - |
| pork_collar | Pork Collar | included | - | Pork | Pork | single-cut-engine | high | 10 | 100 | 5 | 115 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical | standard | main | medium | yes | yes | Main cut | no | not_required | - |
| chicken_breast | Chicken Breast | included | - | Chicken | Chicken | single-cut-engine | high | 10 | 18 | 5 | 33 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium | low | medium | yes | 25 | 15 | safety_critical, safe_temp_mode | standard | main | easy | yes | no | Main cut | no | not_required | - |
| chicken_drumstick | Chicken Drumstick | included | - | Chicken | Chicken | single-cut-engine | high | 10 | 18 | 5 | 33 | indirect_medium | indirect_medium, indirect_low, direct_medium | low | medium | yes | 25 | 15 | safety_critical, safe_temp_mode | standard | starter | easy | yes | no | Good for groups | no | not_required | - |
| chicken_leg_quarter | Chicken Leg Quarter | included | - | Chicken | Chicken | single-cut-engine | high | 10 | 47 | 10 | 67 | indirect_medium | indirect_medium, indirect_low, direct_medium | low | medium | yes | 25 | 15 | safety_critical, safe_temp_mode | standard | main | medium | yes | no | Main cut | no | not_required | - |
| chicken_wing | Chicken Wing | included | - | Chicken | Chicken | single-cut-engine | high | 10 | 12 | 3 | 25 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium | low | medium | yes | 25 | 15 | safety_critical, safe_temp_mode, fast_cook | recommended | starter | easy | yes | no | Starter | no | not_required | - |
| whole_chicken | Whole Chicken | included | - | Chicken | Chicken | single-cut-engine | high | 10 | 79 | 10 | 99 | indirect_medium | indirect_medium, indirect_low, direct_medium | low | medium | yes | 30 | 15 | safety_critical, safe_temp_mode | advanced | longCook | advanced | yes | yes | Higher timing risk | yes | passed | - |
| spatchcock_chicken | Spatchcock Chicken | included | - | Chicken | Chicken | single-cut-engine | high | 10 | 52 | 10 | 72 | indirect_medium | indirect_medium, indirect_low, direct_medium | low | medium | yes | 30 | 15 | safety_critical, safe_temp_mode | recommended | main | medium | yes | no | Good for groups | yes | not_required | - |
| salmon | Salmon | included | - | Fish | Fish | single-cut-engine | high | 10 | 4 | 2 | 16 | direct_high | direct_high, direct_medium, plancha | low | high | no | 3 | 4 | safety_critical, delicate_target_mode, fast_cook | standard | fastFinish | medium | no | no | Serve immediately | no | not_required | - |
| asparagus | Asparagus | included | - | Verduras | Vegetables | single-cut-engine | high | 5 | 7 | 1 | 13 | direct_medium | plancha, direct_medium, indirect_medium | low | low | yes | 25 | 20 | fast_cook | standard | side | easy | yes | no | Fast finish | no | not_required | - |
| corn_on_cob | Corn on the Cob | included | - | Verduras | Vegetables | single-cut-engine | high | 5 | 14 | 1 | 20 | direct_medium | plancha, direct_medium, indirect_medium | low | low | yes | 25 | 20 | - | standard | side | easy | yes | no | Good for groups | no | not_required | - |
| potato_halves | Potato Halves | included | - | Verduras | Vegetables | single-cut-engine | high | 5 | 30 | 1 | 36 | direct_medium | plancha, direct_medium, indirect_medium | low | low | yes | 25 | 20 | - | standard | side | easy | yes | no | Good for groups | no | not_required | - |
| mushrooms | Mushrooms | included | - | Verduras | Vegetables | single-cut-engine | high | 5 | 9 | 1 | 15 | direct_medium | plancha, direct_medium, indirect_medium | low | low | yes | 25 | 20 | fast_cook | standard | side | easy | yes | no | Fast finish | no | not_required | - |
| bell_peppers | Bell Peppers | included | - | Verduras | Vegetables | single-cut-engine | high | 5 | 12 | 1 | 18 | direct_medium | plancha, direct_medium, indirect_medium | low | low | yes | 25 | 20 | fast_cook | standard | side | easy | yes | no | Fast finish | no | not_required | - |
| eggplant_slices | Eggplant Slices | included | - | Verduras | Vegetables | single-cut-engine | high | 5 | 11 | 1 | 17 | direct_medium | plancha, direct_medium, indirect_medium | low | low | yes | 25 | 20 | fast_cook | standard | side | easy | yes | no | Fast finish | no | not_required | - |
| pork_tenderloin | Pork Tenderloin | included | - | Pork | Pork | single-cut-engine | high | 10 | 6 | 5 | 21 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical, safe_temp_mode, fast_cook | recommended | main | medium | yes | no | Main cut | no | not_required | - |
| pork_chop | Pork Chop | included | - | Pork | Pork | single-cut-engine | high | 10 | 6 | 5 | 21 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical, safe_temp_mode, fast_cook | standard | main | easy | yes | no | Main cut | no | not_required | - |
| sausages | Sausages | included | - | Pork | Sausages | single-cut-engine | high | 10 | 17 | 3 | 30 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical, safe_temp_mode | standard | starter | easy | yes | no | Good for groups | no | not_required | - |
| chorizo_criollo | Chorizo Criollo | included | - | Pork | Sausages | single-cut-engine | high | 10 | 23 | 3 | 36 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical, safe_temp_mode | standard | starter | easy | yes | no | Starter | no | not_required | - |
| brisket | Brisket | included | - | Beef | Beef | single-cut-engine | high | 10 | 610 | 60 | 680 | smoke_low, indirect_medium | indirect_medium, indirect_low, smoke_low | medium | low | yes | 90 | 45 | safety_critical, fat_cap, fatcap_probe_tender_not_doneness | advanced | longCook | advanced | yes | yes | Needs low and slow | yes | passed | - |
| short_ribs | Short Ribs | included | - | Beef | Beef | single-cut-engine | high | 10 | 280 | 15 | 305 | smoke_low, indirect_medium | indirect_medium, indirect_low, smoke_low | medium | low | yes | 90 | 45 | safety_critical | advanced | longCook | advanced | yes | yes | Needs low and slow | yes | passed | - |
| baby_back_ribs | Baby Back Ribs | included | - | Pork | Pork | single-cut-engine | high | 10 | 190 | 10 | 210 | indirect_medium | indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical | advanced | longCook | advanced | yes | yes | Higher timing risk | yes | passed | - |
| spare_ribs | Spare Ribs | included | - | Pork | Pork | single-cut-engine | high | 10 | 250 | 10 | 270 | indirect_medium | indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical | advanced | longCook | advanced | yes | yes | Higher timing risk | yes | passed | - |
| pork_belly | Pork Belly | included | - | Pork | Pork | single-cut-engine | high | 10 | 145 | 10 | 165 | indirect_medium, plancha | plancha, direct_medium, indirect_medium, indirect_low, smoke_low | medium | medium | yes | 45 | 20 | safety_critical | advanced | longCook | advanced | yes | yes | Higher timing risk | yes | passed | - |
| pork_belly_slices | Pork Belly Slices | included | - | Pork | Pork | single-cut-engine | high | 10 | 4 | 5 | 19 | direct_high | direct_high, direct_medium | low | high | no | 5 | 5 | fat_cap, flare_up_high, safe_temp_mode, fast_cook, fatcap_flare_up_risk, fatcap_move_to_indirect_on_flareup | standard | fastFinish | medium | no | no | Fast finish | yes | not_required | - |
| chuck_roast | Chuck Roast | included | - | Beef | Beef | single-cut-engine | high | 10 | 340 | 20 | 370 | smoke_low, indirect_medium | indirect_medium, indirect_low, smoke_low | medium | low | yes | 90 | 45 | safety_critical | advanced | longCook | advanced | yes | yes | Needs low and slow | yes | passed | - |
