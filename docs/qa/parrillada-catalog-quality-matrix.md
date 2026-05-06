# Parrillada Catalog Quality Matrix

Generated at: 2026-05-06T22:36:49.139Z

## Summary
- Total candidates: 37
- Included: 36
- Skipped: 1
- Fallback items: 0
- Confidence high/medium/low/missing: 37/0/0/0

## Main Risk Areas
- fast_cook: 16
- safe_temp_mode: 13
- safety_critical: 10
- fat_cap: 3
- flare_up_high: 2
- fatcap_flare_up_risk: 2
- fatcap_move_to_indirect_on_flareup: 2
- fatcap_fat_cap_burn_risk: 1

## Quality Matrix

| cutId | displayName | animal | category | included | skipReason | source | confidence | setupMinutes | activeCookMinutes | restMinutes | totalSessionMinutes | requiredZones | preferredZones | zoneDemand | timingSensitivity | canHoldWarm | maxHoldMinutes | serveWindowMinutes | riskTags | visibility | role | complexity | requiresEarlyStart | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ribeye | Ribeye | Beef | Beef | included | - | single-cut-engine | high | 10 | 5 | 5 | 20 | direct_high | direct_high, direct_medium, indirect_medium | low | high | false | 8 | 8 | fast_cook | recommended | main | easy | false | - |
| bone_in_ribeye | Bone-in ribeye / Chuletón | Beef | Beef | included | - | single-cut-engine | high | 10 | 31 | 12 | 53 | direct_high, indirect_medium | indirect_medium, direct_high | low | high | false | 8 | 8 | - | advanced | longCook | advanced | true | - |
| picanha | Picanha | Beef | Beef | included | - | single-cut-engine | high | 10 | 33 | 10 | 53 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium | low | medium | true | 20 | 12 | fat_cap, flare_up_high, fatcap_fat_cap_burn_risk, fatcap_flare_up_risk, fatcap_move_to_indirect_on_flareup, fatcap_slice_against_grain | recommended | main | medium | false | - |
| striploin | Striploin | Beef | Beef | included | - | single-cut-engine | high | 10 | 5 | 5 | 20 | direct_high | direct_high, direct_medium, indirect_medium | low | high | false | 8 | 8 | fast_cook | recommended | main | easy | false | - |
| tenderloin | Tenderloin | Beef | Beef | included | - | single-cut-engine | high | 10 | 5 | 5 | 20 | direct_high | direct_high, direct_medium, indirect_medium | low | high | false | 8 | 8 | fast_cook | recommended | main | medium | false | - |
| skirt_steak | Skirt Steak | Beef | Beef | included | - | single-cut-engine | high | 10 | 3 | 5 | 18 | direct_high | direct_high, direct_medium, indirect_medium | low | high | false | 8 | 8 | fast_cook | standard | fastFinish | medium | false | - |
| flank_steak | Flank Steak | Beef | Beef | included | - | single-cut-engine | high | 10 | 3 | 5 | 18 | direct_high | direct_high, direct_medium, indirect_medium | low | high | false | 8 | 8 | fast_cook | standard | main | medium | false | - |
| t_bone | T-Bone | Beef | Beef | included | - | single-cut-engine | high | 10 | 25 | 5 | 40 | direct_high | direct_high, direct_medium, indirect_medium | low | high | false | 8 | 8 | - | recommended | main | medium | false | - |
| tomahawk | Tomahawk | Beef | Beef | included | - | single-cut-engine | high | 10 | 35 | 10 | 55 | direct_high, indirect_medium | indirect_medium, direct_high | low | high | false | 8 | 8 | - | advanced | longCook | advanced | true | - |
| iberian_secreto | Iberian Secreto | Pork | Pork | included | - | single-cut-engine | high | 10 | 4 | 5 | 19 | direct_high | direct_high, direct_medium | low | high | false | 5 | 5 | safe_temp_mode, fast_cook | recommended | fastFinish | medium | false | - |
| pork_loin | Pork Loin | Pork | Pork | included | - | single-cut-engine | high | 10 | 100 | 5 | 115 | plancha | plancha, direct_medium, direct_high | low | high | false | 5 | 5 | - | recommended | main | medium | true | - |
| iberian_presa | Iberian Presa | Pork | Pork | included | - | single-cut-engine | high | 10 | 6 | 5 | 21 | direct_high | direct_high, direct_medium | low | high | false | 5 | 5 | safe_temp_mode, fast_cook | recommended | fastFinish | medium | false | - |
| pork_collar | Pork Collar | Pork | Pork | included | - | single-cut-engine | high | 10 | 100 | 5 | 115 | direct_high | direct_high, direct_medium | low | high | false | 5 | 5 | - | standard | main | medium | true | - |
| chicken_breast | Chicken Breast | Chicken | Chicken | included | - | single-cut-engine | high | 10 | 18 | 5 | 33 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium | low | medium | true | 25 | 15 | safety_critical, safe_temp_mode | standard | main | easy | false | - |
| chicken_drumstick | Chicken Drumstick | Chicken | Chicken | included | - | single-cut-engine | high | 10 | 18 | 5 | 33 | indirect_medium | indirect_medium, indirect_low, direct_medium | low | medium | true | 25 | 15 | safety_critical, safe_temp_mode | standard | starter | easy | false | - |
| chicken_leg_quarter | Chicken Leg Quarter | Chicken | Chicken | included | - | single-cut-engine | high | 10 | 47 | 10 | 67 | indirect_medium | indirect_medium, indirect_low, direct_medium | low | medium | true | 25 | 15 | safety_critical, safe_temp_mode | standard | main | medium | false | - |
| chicken_wing | Chicken Wing | Chicken | Chicken | included | - | single-cut-engine | high | 10 | 12 | 3 | 25 | indirect_medium, direct_high | direct_high, direct_medium, indirect_medium | low | medium | true | 25 | 15 | safety_critical, safe_temp_mode, fast_cook | recommended | starter | easy | false | - |
| whole_chicken | Whole Chicken | Chicken | Chicken | included | - | single-cut-engine | high | 10 | 79 | 10 | 99 | indirect_medium | indirect_medium, indirect_low, direct_medium | low | medium | true | 25 | 15 | safety_critical, safe_temp_mode | advanced | longCook | advanced | true | - |
| spatchcock_chicken | Spatchcock Chicken | Chicken | Chicken | included | - | single-cut-engine | high | 10 | 52 | 10 | 72 | indirect_medium | indirect_medium, indirect_low, direct_medium | low | medium | true | 25 | 15 | safety_critical, safe_temp_mode | recommended | main | medium | false | - |
| salmon | Salmon | Fish | Fish | included | - | single-cut-engine | high | 10 | 4 | 2 | 16 | direct_high | direct_high, direct_medium, plancha | low | high | false | 3 | 4 | safety_critical, delicate_target_mode, fast_cook | standard | fastFinish | medium | false | - |
| asparagus | Asparagus | Verduras | Vegetables | included | - | single-cut-engine | high | 5 | 7 | 1 | 13 | direct_medium | plancha, direct_medium, indirect_medium | low | low | true | 25 | 20 | fast_cook | standard | side | easy | false | - |
| corn_on_cob | Corn on the Cob | Verduras | Vegetables | included | - | single-cut-engine | high | 5 | 14 | 1 | 20 | direct_medium | plancha, direct_medium, indirect_medium | low | low | true | 25 | 20 | - | standard | side | easy | false | - |
| potato_halves | Potato Halves | Verduras | Vegetables | included | - | single-cut-engine | high | 5 | 30 | 1 | 36 | direct_medium | plancha, direct_medium, indirect_medium | low | low | true | 25 | 20 | - | standard | side | easy | false | - |
| mushrooms | Mushrooms | Verduras | Vegetables | included | - | single-cut-engine | high | 5 | 9 | 1 | 15 | direct_medium | plancha, direct_medium, indirect_medium | low | low | true | 25 | 20 | fast_cook | standard | side | easy | false | - |
| bell_peppers | Bell Peppers | Verduras | Vegetables | included | - | single-cut-engine | high | 5 | 12 | 1 | 18 | direct_medium | plancha, direct_medium, indirect_medium | low | low | true | 25 | 20 | fast_cook | standard | side | easy | false | - |
| eggplant_slices | Eggplant Slices | Verduras | Vegetables | included | - | single-cut-engine | high | 5 | 11 | 1 | 17 | direct_medium | plancha, direct_medium, indirect_medium | low | low | true | 25 | 20 | fast_cook | standard | side | easy | false | - |
| pork_tenderloin | Pork Tenderloin | Pork | Pork | included | - | single-cut-engine | high | 10 | 6 | 5 | 21 | direct_high | direct_high, direct_medium | low | high | false | 5 | 5 | safe_temp_mode, fast_cook | recommended | main | medium | false | - |
| pork_chop | Pork Chop | Pork | Pork | included | - | single-cut-engine | high | 10 | 6 | 5 | 21 | direct_high | direct_high, direct_medium | low | high | false | 5 | 5 | safe_temp_mode, fast_cook | standard | main | easy | false | - |
| sausages | Sausages | Pork | Sausages | included | - | single-cut-engine | high | 10 | 17 | 3 | 30 | direct_high | direct_high, direct_medium | low | high | false | 5 | 5 | safe_temp_mode | standard | starter | easy | false | - |
| chorizo_criollo | Chorizo Criollo | Pork | Sausages | included | - | single-cut-engine | high | 10 | 23 | 3 | 36 | direct_high | direct_high, direct_medium | low | high | false | 5 | 5 | safe_temp_mode | standard | starter | easy | false | - |
| brisket | Brisket | Beef | Beef | included | - | single-cut-engine | high | 10 | 610 | 60 | 680 | smoke_low, indirect_medium | indirect_medium, indirect_low, smoke_low | medium | low | true | 90 | 45 | safety_critical, fat_cap, fatcap_probe_tender_not_doneness | advanced | longCook | advanced | true | - |
| short_ribs | Short Ribs | Beef | Beef | included | - | single-cut-engine | high | 10 | 280 | 15 | 305 | smoke_low, indirect_medium | indirect_medium, indirect_low, smoke_low | medium | low | true | 90 | 45 | safety_critical | advanced | longCook | advanced | true | - |
| baby_back_ribs | Baby Back Ribs | Pork | Pork | included | - | single-cut-engine | high | 10 | 190 | 10 | 210 | indirect_medium | indirect_medium, indirect_low, direct_high, direct_medium | low | high | false | 5 | 5 | - | advanced | longCook | advanced | true | - |
| spare_ribs | Spare Ribs | Pork | Pork | included | - | single-cut-engine | high | 10 | 250 | 10 | 270 | indirect_medium | indirect_medium, indirect_low, direct_high, direct_medium | low | high | false | 5 | 5 | - | advanced | longCook | advanced | true | - |
| pork_belly | Pork Belly | Pork | Pork | included | - | single-cut-engine | high | 10 | 145 | 10 | 165 | plancha | plancha, direct_medium, direct_high | low | high | false | 5 | 5 | - | advanced | longCook | advanced | true | - |
| pork_belly_slices | Pork Belly Slices | Pork | Pork | skipped | advanced item session too short (19m) | single-cut-engine | high | 10 | 4 | 5 | 19 | direct_high | direct_high, direct_medium | low | high | false | 5 | 5 | fat_cap, flare_up_high, safe_temp_mode, fast_cook, fatcap_flare_up_risk, fatcap_move_to_indirect_on_flareup | standard | main | medium | false | - |
| chuck_roast | Chuck Roast | Beef | Beef | included | - | single-cut-engine | high | 10 | 340 | 20 | 370 | smoke_low, indirect_medium | indirect_medium, indirect_low, smoke_low | medium | low | true | 90 | 45 | safety_critical | advanced | longCook | advanced | true | - |
