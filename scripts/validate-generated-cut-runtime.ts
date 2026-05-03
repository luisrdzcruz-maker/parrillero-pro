import { generatedCutProfiles } from "../lib/generated/cutProfiles";

function hasText(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function countProfiles(predicate: (profile: (typeof generatedCutProfiles)[number]) => boolean) {
  return generatedCutProfiles.filter(predicate).length;
}

if (generatedCutProfiles.length === 0) {
  console.error("Generated runtime validation failed: no generated cut profiles found.");
  process.exit(1);
}

const total = generatedCutProfiles.length;
const fiDisplayNames = countProfiles((profile) => hasText(profile.displayNameFi));
const esDisplayNames = countProfiles(
  (profile) => hasText(profile.displayNameEsEs) || hasText(profile.displayNameEsAr),
);
const withZone = countProfiles((profile) => hasText(profile.zone));
const withAnatomicalArea = countProfiles((profile) => hasText(profile.anatomicalArea));
const withShortDescription = countProfiles((profile) => hasText(profile.shortDescriptionEn));
const withSafetyNote = countProfiles((profile) => hasText(profile.safetyNoteEn));
const withCriticalWarning = countProfiles(
  (profile) => hasText(profile.criticalWarningEn) || hasText(profile.criticalMistakeEn),
);
const withSeparatedFields = countProfiles(
  (profile) =>
    hasText(profile.shortDescriptionEn) || hasText(profile.safetyNoteEn) || hasText(profile.criticalWarningEn),
);

console.log(`Generated cut runtime coverage (${total} profiles)`);
console.log(`- FI display names: ${fiDisplayNames}`);
console.log(`- ES display names (es-ES or es-AR): ${esDisplayNames}`);
console.log(`- Zone: ${withZone}`);
console.log(`- Anatomical area: ${withAnatomicalArea}`);
console.log(`- shortDescriptionEn: ${withShortDescription}`);
console.log(`- safetyNoteEn: ${withSafetyNote}`);
console.log(`- criticalWarningEn / criticalMistakeEn: ${withCriticalWarning}`);
console.log(`- Any separated descriptor/safety/warning field: ${withSeparatedFields}`);
