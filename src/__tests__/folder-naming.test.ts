import { readdirSync, statSync } from "fs";
import { join, resolve } from "path";

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
// __tests__ is a universal Jest/Vitest convention; systems/ is a data sub-dir of known shape
const ALLOWED = new Set(["__tests__", "systems"]);

function collectViolations(dir: string, srcRoot: string): string[] {
  const violations: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!ALLOWED.has(entry) && !KEBAB_CASE.test(entry)) {
      violations.push("src" + full.slice(srcRoot.length).replace(/\\/g, "/"));
    }
    violations.push(...collectViolations(full, srcRoot));
  }
  return violations;
}

describe("folder naming convention", () => {
  it("every src/ directory uses kebab-case (or is an allowed exception)", () => {
    const srcRoot = resolve(__dirname, "..");
    const violations = collectViolations(srcRoot, srcRoot);
    expect(violations).toEqual([]);
  });
});
