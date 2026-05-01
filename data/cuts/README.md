# Cut Profile Data Contract

`cut-profiles.csv` is the English canonical source for product cut metadata.

Phase 1 owns the data architecture only:

- keep stable ids in `snake_case`
- keep canonical labels in English
- use pipe-delimited values for list fields
- run `npm run validate:cuts` before generating
- run `npm run generate:cuts` to update `lib/generated/cutProfiles.ts`

Later agents can map this generated profile layer into UI labels, cooking rules, and localized copy.
