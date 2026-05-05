# Critical Alias Metadata Cleanup

Date: 2026-05-06

Branch: `data/critical-alias-metadata-cleanup`

## Scope

This cleanup addressed two non-dangerous catalog metadata risks from the critical cut review:

- Generated Tomahawk aliases still claimed generic bone-in ribeye / cowboy steak identity.
- Generated `tri_tip` metadata still exposed a `low_slow` style label even though runtime behavior was already guarded as `doneness_target`.

No UI, navigation, Supabase, dependency, or broad engine migration changes were made.

## Tomahawk And Chuletón Distinction

`bone_in_ribeye / chuleton` and `tomahawk / long_bone` remain separate catalog identities.

`bone_in_ribeye / chuleton` owns these generic bone-in ribeye aliases:

- `chuleton`
- `chuletón`
- `bone-in ribeye`
- `ribeye on the bone`
- `cowboy steak`

`tomahawk / long_bone` keeps only long-bone identity aliases:

- `tomahawk`
- `long bone ribeye`
- `long-bone ribeye`
- `frenched ribeye`

This prevents a user asking for Chuletón, cowboy steak, or generic bone-in ribeye from being silently routed to Tomahawk metadata.

## Tri-Tip Metadata

`tri_tip` remains a roast-like reverse-sear cut, but it is not a low-and-slow texture-breakdown cut.

The generated metadata now exposes:

- `style=reverse`
- `cookingStyle=reverse`
- medium-rare / medium target behavior

Runtime/catalog behavior remains:

- `temperature_mode=doneness_target`
- not `texture_breakdown`
- no 92 C pull-apart target

## Validation Results

Ran on 2026-05-06:

- `npm run validate:cuts:v2` passed.
- `npm run lint` passed with one existing warning in `app/page.tsx` about `router` in a React hook dependency array.
- `npm run build` passed.
- `npm run qa:cooking` passed: `1116/1116`.
- `npm run check` passed; it repeated lint/build/QA and printed the UI checklist.

## Follow-Up Risk

No known dangerous runtime risk remains from this cleanup. The remaining lint warning is outside the touched engine/data files.
