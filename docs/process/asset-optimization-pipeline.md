# Asset Optimization Pipeline

PNG files under `assets/raw` are source/master assets only. Production UI should not import or reference `assets/raw` files directly.

## Source Folders

- `assets/raw/icons/*.png` -> `public/brand/icons/*.webp`
- `assets/raw/cuts/*.png` -> `public/cuts/*.webp`
- `assets/raw/setup/*.png` -> `public/setup/*.webp`

## Commands

- `npm run process:assets` processes every supported category.
- `npm run process:icons` processes brand and navigation icon sources.
- `npm run process:cuts` processes cut visual sources.
- `npm run process:setup-images` processes setup visual sources and keeps the existing setup workflow intact.
- `npm run build:asset-maps` regenerates asset maps from `data/assets/*-prompts.json`.

The processor writes deterministic lowercase, slug-safe WebP filenames. It skips outputs that are already up to date and prints the source path, output path, and before/after file sizes for each processed or skipped file.

Use public WebP paths such as `/brand/icons/example.webp`, `/cuts/example.webp`, or `/setup/example.webp` in components, or use the generated maps where the category already has one. Do not wire new assets into UI as part of the processing step.
