/**
 * Galactic Arm Assignment Audit
 *
 * Compares each system's galacticArmHint against where the game's own spiral
 * geometry places it, then prints a report and asserts no system sits clearly
 * inside the wrong arm's shape.
 *
 * Status codes
 *   ✅  Stated hint matches computed nearest arm.
 *   ⚠️  System is outside all arm shapes; nearest arm ≠ stated hint (borderline –
 *       human call required).
 *   ❌  System is inside a different arm's shape (definite mismatch – test fails).
 *   —   Exempt (galactic halo has no 2-D shape in this model).
 */

import { describe, it, expect } from "vitest";
import { GALAXY_DATA } from "../galaxy";
import type { GalaxyRegion } from "../../types";
import { signedDistToShape } from "../../utils/spiralGeometry";

// ---------------------------------------------------------------------------
// For each system, determine the computed arm using the same priority logic
// as hitTestRegion:
//   1. If the system is inside one or more shapes, return the one whose
//      label is nearest (matches game click behaviour for overlapping regions).
//   2. If outside all shapes, return the region with the smallest signed
//      distance (nearest boundary).
// Single pass: signed distance computed once per region.
// ---------------------------------------------------------------------------
function computeNearestArm(
  px: number,
  py: number,
  regions: GalaxyRegion[],
): { id: string; dist: number } {
  let insideBestId = "";
  let insideBestLabelDist = Infinity;
  let insideBestSignedDist = Infinity;
  let outsideBestId = "none";
  let outsideBestDist = Infinity;

  for (const region of regions) {
    if (!region.shape) continue;
    const sd = signedDistToShape(px, py, region.shape);
    if (sd < 0) {
      const labelDist = Math.hypot(px - region.labelX, py - region.labelY);
      if (labelDist < insideBestLabelDist) {
        insideBestLabelDist = labelDist;
        insideBestId = region.id;
        insideBestSignedDist = sd;
      }
    } else if (sd < outsideBestDist) {
      outsideBestDist = sd;
      outsideBestId = region.id;
    }
  }

  if (insideBestId) return { id: insideBestId, dist: insideBestSignedDist };
  return { id: outsideBestId, dist: outsideBestDist };
}

// ---------------------------------------------------------------------------
// Audit types
// ---------------------------------------------------------------------------
type Status = "✅" | "⚠️" | "❌" | "—";
type SystemEntry = (typeof GALAXY_DATA.systems)[number];

interface AuditRow {
  id: string;
  hint: string;
  computed: string;
  insideComputed: boolean;
  insideStated: boolean;
  distToStated: number;
  distToComputed: number;
  status: Status;
}

function classifySystemEntry(
  entry: SystemEntry,
  regionById: Map<string, GalaxyRegion>,
  regions: GalaxyRegion[],
): AuditRow {
  const { id, galacticX: px, galacticY: py } = entry;
  const hint: string = entry.galacticArmHint ?? "none";

  if (hint === "halo") {
    return {
      id,
      hint,
      computed: "halo (exempt)",
      insideComputed: false,
      insideStated: false,
      distToStated: NaN,
      distToComputed: NaN,
      status: "—",
    };
  }

  const { id: computedId, dist: distToComputed } = computeNearestArm(
    px,
    py,
    regions,
  );
  const statedRegion = regionById.get(hint);
  const distToStated = statedRegion?.shape
    ? signedDistToShape(px, py, statedRegion.shape)
    : Infinity;
  const insideComputed = distToComputed < 0;
  const insideStated = distToStated < 0;

  let status: Status;
  if (computedId === hint) {
    status = "✅";
  } else if (insideComputed) {
    status = "❌";
  } else {
    status = "⚠️";
  }

  return {
    id,
    hint,
    computed: computedId,
    insideComputed,
    insideStated,
    distToStated: Math.round(distToStated),
    distToComputed: Math.round(distToComputed),
    status,
  };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
describe("Galactic arm assignment audit", () => {
  it(
    "reports hint vs geometry for every system — no system should be inside the wrong arm shape",
    { timeout: 30_000 },
    () => {
      const { systems, regions } = GALAXY_DATA;
      const regionById = new Map(regions.map((r) => [r.id, r]));
      const rows = systems.map((entry) =>
        classifySystemEntry(entry, regionById, regions),
      );

      // -------------------------------------------------------------------
      // Print the full audit table
      // -------------------------------------------------------------------
      console.log("\n╔══════════════════════════════════════════════════════╗");
      console.log("║          GALACTIC ARM ASSIGNMENT AUDIT               ║");
      console.log("╚══════════════════════════════════════════════════════╝");
      console.log(
        "  ✅ hint = computed nearest  ⚠️ outside all shapes, nearest ≠ hint",
      );
      console.log("  ❌ inside wrong arm shape   — exempt (halo)\n");

      const colWidths = {
        id: 20,
        hint: 14,
        computed: 14,
        distS: 16,
        distC: 17,
        status: 8,
      };
      const header =
        "ID".padEnd(colWidths.id) +
        "Hint".padEnd(colWidths.hint) +
        "Computed".padEnd(colWidths.computed) +
        "Dist→Stated(ly)".padEnd(colWidths.distS) +
        "Dist→Computed(ly)".padEnd(colWidths.distC) +
        "Status";
      const sep = "─".repeat(header.length);
      console.log(sep);
      console.log(header);
      console.log(sep);

      for (const r of rows) {
        const distS = isNaN(r.distToStated) ? "—" : String(r.distToStated);
        const distC = isNaN(r.distToComputed) ? "—" : String(r.distToComputed);
        console.log(
          r.id.padEnd(colWidths.id) +
            r.hint.padEnd(colWidths.hint) +
            r.computed.padEnd(colWidths.computed) +
            distS.padEnd(colWidths.distS) +
            distC.padEnd(colWidths.distC) +
            r.status,
        );
      }
      console.log(sep);

      // -------------------------------------------------------------------
      // Summary by status
      // -------------------------------------------------------------------
      const counts: Record<Status, number> = {
        "✅": 0,
        "⚠️": 0,
        "❌": 0,
        "—": 0,
      };
      for (const r of rows) counts[r.status]++;
      console.log(
        `\nSummary: ✅ ${counts["✅"]}  ⚠️  ${counts["⚠️"]}  ❌ ${counts["❌"]}  — ${counts["—"]} (exempt)\n`,
      );

      const warnings = rows.filter((r) => r.status === "⚠️");
      if (warnings.length > 0) {
        console.log(
          "⚠️  Systems outside all shapes — nearest arm ≠ stated hint (review manually):",
        );
        for (const r of warnings) {
          console.log(
            `   ${r.id.padEnd(20)} hint=${r.hint.padEnd(14)} nearest=${r.computed} (${r.distToComputed} ly from nearest boundary)`,
          );
        }
        console.log();
      }

      // -------------------------------------------------------------------
      // Assertion: no system should be inside the wrong arm's shape
      // -------------------------------------------------------------------
      const definite = rows.filter((r) => r.status === "❌");
      if (definite.length > 0) {
        console.log(
          "❌ Systems inside the wrong arm shape (fix galacticArmHint):",
        );
        for (const r of definite) {
          console.log(
            `   ${r.id}: hint='${r.hint}' but geometry says '${r.computed}' (dist to computed boundary: ${r.distToComputed} ly)`,
          );
        }
      }

      expect(
        definite.map((r) => ({ id: r.id, hint: r.hint, computed: r.computed })),
        "These systems are inside the wrong arm shape — update their galacticArmHint",
      ).toHaveLength(0);
    },
  );
});
