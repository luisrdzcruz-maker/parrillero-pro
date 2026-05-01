# Cut Profile Data Contract

`parrillero_pro_input_profiles_en.csv` is the English canonical source for product cut metadata.

Phase 1 owns the data architecture only:

- keep stable ids in `snake_case`
- keep canonical labels in English
- use semicolon-delimited values for list fields
- run `npm run validate:cuts` before generating
- run `npm run generate:cuts` to update `lib/generated/cutProfiles.ts`

Later agents can map this generated profile layer into UI labels, cooking rules, and localized copy.

Legacy `cut-profiles.csv` has been retired to avoid dual-source confusion. Keep all cut profile updates in `parrillero_pro_input_profiles_en.csv`.
