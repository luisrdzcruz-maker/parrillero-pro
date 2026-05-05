# Asset System

Parrillero Pro uses assets only when they help users decide, understand, or execute a cook. Production UI should resolve assets through typed maps or registries instead of hardcoded component paths.

## Official Asset Folders

Source assets live under `assets/raw`. These files are not served directly by the app.

- `assets/raw/icons/ui`
- `assets/raw/icons/animals`
- `assets/raw/icons/cuts`
- `assets/raw/icons/equipment`
- `assets/raw/icons/methods`
- `assets/raw/icons/warnings`
- `assets/raw/icons/live`
- `assets/raw/icons/setup`
- `assets/raw/setup`

Production assets live under `public`. These files are served by Next.js.

- `public/icons/ui`
- `public/icons/animals`
- `public/icons/cuts`
- `public/icons/equipment`
- `public/icons/methods`
- `public/icons/warnings`
- `public/icons/live`
- `public/icons/setup`
- `public/cut-icons`
- `public/cuts`
- `public/setup`
- `public/animals`
- `public/brand`
- `public/hero`
- `public/images`
- `public/visuals`

## Source vs Production Formats

PNG files may be used as source assets under `assets/raw`.

Production UI should use optimized `webp` or `avif` files from `public`. Do not point React components directly at `assets/raw` paths.

Use `svg` only for simple interface symbols when vector rendering is needed and the asset is intentionally maintained as a vector.

## Naming Conventions

Use lowercase kebab-case filenames.

Good:

```txt
ribeye.webp
two-zone-fire.webp
temperature-warning.webp
```

Avoid:

```txt
RibEye Final.png
warning_icon_v2_new.webp
```

Icon keys should match the public path without the extension when possible. Category-specific prefixes are allowed when they improve scanning.

## Folder Responsibilities

Use `public/cut-icons` for the current cut selection icon system. This folder remains active for existing UI and is exposed through `lib/cutIconMap.ts`.

Use `public/icons/cuts` for the future generalized icon registry. Do not replace `public/cut-icons` until the migration is explicit.

Use `public/cuts` for cut photos or cut illustrations that are not compact selection icons.

Use `public/setup` for setup visuals that explain grill configuration, heat zones, equipment setup, or execution context.

Use `public/icons/setup` for compact setup icons, not full setup visuals.

Use `public/animals` for animal silhouettes, anatomical maps, or animal-level discovery assets.

Use `public/brand`, `public/hero`, `public/images`, and `public/visuals` only for their existing product-specific roles. Do not place reusable registry icons there.

## Registry API

New code should prefer the typed icon registry:

```ts
import { getIconPath } from "@/lib/assets/getIconPath";

const iconPath = getIconPath({
  category: "cuts",
  key: "beef/ribeye",
});
```

Existing cut selection code can continue using `getCutIconPath` from `lib/cutIconMap.ts`. Future cut icon code can use `getCutIconPathFromRegistry` from `lib/assets/cutIconAdapter.ts`.

## Adding a New Icon

1. Add the source PNG under the matching `assets/raw/icons/<category>` folder.
2. Process the source into optimized production formats under `public/icons/<category>`.
3. Add or generate a registry entry for the optimized public asset.
4. Use `getIconPath` from UI code instead of hardcoding a public path.
5. Verify that the visual helps the user decide, understand, or execute.

For current cut selection icons, keep using the existing `public/cut-icons` pipeline until the generalized registry migration is approved.

## Processing Scripts

Current relevant commands:

```bash
npm run process:icons
npm run process:cut-icons
npm run build:cut-icon-map
npm run assets:cut-icons
npm run pipeline:icons
npm run pipeline:assets
```

Use `npm run assets:cut-icons` after changing current cut selection icon source assets. It processes cut icons and rebuilds `lib/cutIconMap.ts`.

Use the broader icon pipeline only when working on generalized icons, and keep generated outputs in the matching `public/icons/<category>` folder.

## What Not To Do

Do not add decorative assets that do not improve decision, confidence, learning, or execution.

Do not move existing assets without an explicit migration task.

Do not replace `public/cut-icons` with `public/icons/cuts` in the current UI until the migration is approved.

Do not hardcode new asset paths in components.

Do not use `assets/raw` paths in production UI.

Do not add image files in registry-only foundation changes.

Do not mix cut icons, cut photos, and setup visuals in the same folder.
