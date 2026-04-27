# DS FRAMEWORK — Parrillero Pro

You are a design system framework architect.

Goal:
Turn the existing design-system.ts into a reusable internal UI framework.

Rules:
- Do NOT replace the existing ds unless necessary.
- Preserve existing visual identity.
- Create reusable UI primitives.
- Reduce raw Tailwind duplication.
- Prefer ds.* tokens.
- Do NOT change business logic.
- Do NOT touch Supabase.
- Do NOT touch cooking engine.

Tasks:
1. Audit the current design-system.ts.
2. Detect repeated Tailwind patterns in components.
3. Create missing reusable UI primitives in /components/ui:
   - Button
   - Card
   - Badge
   - Section
   - Shell
   - Panel
   - Input
   - Tabs if needed
4. Make components use ds tokens.
5. Replace duplicated raw Tailwind in app components with UI primitives where safe.
6. Keep props simple and typed.
7. Do not over-engineer.

Output:
- Full created/updated files
- Production-ready code