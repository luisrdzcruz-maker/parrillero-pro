# Prep And Salting Guidance QA

## What Was Added

Parrillero Pro now resolves lightweight prep and salting guidance through `lib/prepGuidance.ts`.

The helper prefers Cut Catalog v2 metadata when available:

- `prep_profile`
- `prep_lead_time_min_minutes`
- `prep_lead_time_max_minutes`
- `salt_strategy`
- `salt_timing_min_minutes`
- `salt_timing_max_minutes`
- `salt_amount_guidance`
- `salt_surface_guidance`
- `prep_warning_codes`

If Catalog v2 has no runtime row for a cut, the helper falls back by animal, style, and known cut family.

## What Is Displayed

Result shows one compact prep line near the setup/result context.

Examples:

- `Recommended prep: Salt 2 h-24 h before. If cooking now, salt just before and pat dry.`
- `Recommended prep: Salt 10 min-30 min before only.`
- `Recommended prep: Salt just before cooking.`

Spanish UI uses the same compact shape with localized copy.

## What Is Not Included In Session Time

Prep lead time is intentionally not added to:

- `activeCookMinutes`
- `cutPlanMinutes`
- `sessionTotalMinutes`
- Live Cooking timer totals

`prepLeadTimeMinutes` means salting, dry-brining, marinade, or other prep before the cooking session. The cooking session remains `setupMinutes + cutPlanMinutes`.

## Fallback Behavior

Fallback guidance is deterministic:

- Steak: dry brine 45 min-24 h, or salt just before and pat dry.
- Thick steak or chuleton: dry brine 2 h-24 h.
- Whole picanha: dry brine 2 h-24 h, light on the fat cap.
- Low-and-slow beef: dry brine 12 h-24 h.
- Whole chicken: dry brine 4 h-24 h.
- Chicken breast: dry brine 30 min-4 h.
- Fish: salt 10 min-30 min before only.
- Vegetables and asparagus: salt just before cooking.

Old saved plans and AI fallback plans continue to render normally if no `prepGuidance` metadata is present.

## Next Steps

- Expand runtime Catalog v2 rows so fish and all vegetable variants resolve from catalog metadata instead of fallback.
- Add localized Finnish prep copy if Finnish result screens need first-class prep guidance.
- Consider a future user setting for "cooking now" versus "planning ahead" so the line can choose one path instead of showing both for dry-brined meats.
