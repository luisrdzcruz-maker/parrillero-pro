import { generatedCutProfiles } from "../lib/generated/cutProfiles";
import { resolveCookingProfile } from "../lib/resolveCookingProfile";

const defaults = {
  weightKg: "1",
  thicknessCm: "3",
  equipment: "charcoal",
  language: "en" as const,
};

const unresolved: string[] = [];
const badTime: string[] = [];

for (const profile of generatedCutProfiles) {
  const requestedDoneness = profile.allowedDoneness[0] ?? "medium";
  const resolved = resolveCookingProfile({
    animal: profile.animalId,
    cut: profile.id,
    doneness: requestedDoneness,
    ...defaults,
  });

  if (!resolved) {
    unresolved.push(profile.id);
    continue;
  }

  if (!resolved.cut.cookingMinutes || resolved.cut.cookingMinutes <= 0) {
    badTime.push(profile.id);
  }
}

const tuna = generatedCutProfiles.find((profile) => profile.id === "tuna_steak");
const groundBeef = generatedCutProfiles.find((profile) => profile.id === "ground_beef");

const knownCuts = ["ribeye", "striploin", "chuck_roast", "pork_shoulder", "tuna_steak", "asparagus"] as const;
const knownStatus = knownCuts.map((cutId) => {
  const profile = generatedCutProfiles.find((item) => item.id === cutId);
  if (!profile) {
    return { id: cutId, ok: false, minutes: null, source: null };
  }

  const resolved = resolveCookingProfile({
    animal: profile.animalId,
    cut: cutId,
    doneness: profile.allowedDoneness[0] ?? "medium",
    ...defaults,
  });
  return {
    id: cutId,
    ok: Boolean(resolved),
    minutes: resolved?.cut.cookingMinutes ?? null,
    source: resolved?.profileSource ?? null,
  };
});

console.log(
  JSON.stringify(
    {
      total: generatedCutProfiles.length,
      unresolvedCount: unresolved.length,
      unresolved,
      badTimeCount: badTime.length,
      badTime,
      tunaAllowed: tuna?.allowedDoneness ?? [],
      groundBeefAllowed: groundBeef?.allowedDoneness ?? [],
      knownStatus,
    },
    null,
    2,
  ),
);
