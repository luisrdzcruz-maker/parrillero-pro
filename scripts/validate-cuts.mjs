import path from "path";
import { validateCutProfiles } from "./cuts-data.mjs";

const { sourcePath, count, errors } = validateCutProfiles();

if (errors.length > 0) {
  console.error(`Cut profile validation failed: ${path.relative(process.cwd(), sourcePath)}`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Cut profile validation passed: ${count} profiles`);
