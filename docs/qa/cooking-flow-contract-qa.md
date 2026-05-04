# Cooking Flow Contract QA

Run the Result-to-Live contract checker with:

```bash
npm run qa:flow
```

The script validates curated high-risk fixtures through:

Input -> Engine Plan -> Result Blocks -> Live Payload -> Live URL Round Trip.

It is intentionally small and fast. Add fixtures in `scripts/cooking-flow-qa.ts` when a cut, doneness family, or navigation contract has caused a UI regression or represents a high-risk flow.

## Adding Fixtures

Add a `SingleCutFlowInput` entry to `FLOW_FIXTURES` with:

- `fixtureId`: readable stable id, for example `pork/iberian-secreto`.
- `animal`: canonical animal id used in URLs.
- `animalLabel`: UI/engine label used when building the plan.
- `cutId`: canonical app cut id. Use underscores when that is the stored id.
- `doneness`: valid doneness id for meat/fish/poultry. Omit only when not applicable, such as vegetables.
- `equipment`, `thicknessCm`, and `lang`: the state that must survive Result -> Live.

The validators live in `lib/qa/cookingFlowContracts.ts`. Multi-cut QA can reuse the same single-cut item contract through `validateMultiCutFlowContract`.
