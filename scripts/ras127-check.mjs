/**
 * Sanity checks for the RAS 127-20 Method 1 implementation.
 * Run with: node scripts/ras127-check.mjs
 *
 * These are not exhaustive unit tests - they are the checks that would have
 * caught the mistakes that are easy to make in this calculation:
 *   - swapping Mr (demand) and Mf (capacity)
 *   - losing the absolute value on Pasd
 *   - silently extrapolating outside the table envelope
 *   - inventing an NOA value
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

// Transpile the TS module to plain ESM with the TypeScript compiler that is
// already a dev dependency, so this script has no extra deps.
const dir = mkdtempSync(join(tmpdir(), "ras127-"));
const src = readFileSync("src/lib/roofing/ras127.ts", "utf8");
writeFileSync(join(dir, "ras127.ts"), src);
writeFileSync(
  join(dir, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      target: "es2020",
      module: "esnext",
      moduleResolution: "bundler",
      skipLibCheck: true,
      types: [],
    },
    files: ["ras127.ts"],
  })
);
execFileSync("npx", ["tsc", "-p", dir], { stdio: "inherit" });
const mod = await import(join(dir, "ras127.js"));

let failures = 0;
function check(name, actual, expected, tol = 1e-6) {
  const ok =
    typeof expected === "number"
      ? Math.abs(actual - expected) <= tol
      : JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`FAIL  ${name}\n        got      ${JSON.stringify(actual)}\n        expected ${JSON.stringify(expected)}`);
  } else {
    console.log(`ok    ${name}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Filed permit worked example (Miami Lakes eTRAKiT RWR2020-1913):
//    39.1 x 0.205 = 8.016  ->  8.016 - 6.86 = 1.156  <=  NOA Mf 31.3  PASS
//    Supplied as a sealed pressure because 39.1 psf comes from the legacy
//    table, which RAS 127-20 struck through.
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    lambda: 0.205,
    mg: 6.86,
    mf: 31.3,
    sealedPressures: [{ zones: ["1"], pasd: 39.1 }],
  });
  check("filed example: ok", r.ok, true);
  check("filed example: Pasd*lambda", r.zones[0].pasdLambda, 8.0155, 1e-3);
  check("filed example: Mr", r.zones[0].mr, 1.1555, 1e-3);
  check("filed example: passes", r.passes, true);
  check("filed example: used sealed pressures", r.usedSealedPressures, true);
}

// ---------------------------------------------------------------------------
// 1b. Two real permit packages the contractor filed and had reviewed, read off
//     Section E of the HVHZ application. These are the strongest evidence we
//     have that the engine matches what a plans examiner expects to see, so
//     every printed intermediate value is asserted, not just the outcome.
//
//     Package A - 12615 SW 34th Pl, Davie (Broward)
//       Westlake Royal / Newpoint Saxony 900, NOA 24-0320.02
//       lambda 0.315, Mg 7.71, Mf 31.3
//       (Zone 1: 60 x 0.315 = 18.9)  - 7.71 = 11.19
//       (Zone 2: 96 x 0.315 = 30.24) - 7.71 = 22.53
//
//     Note: Mg 7.71 is the 5":12 direct-deck cell our NOA extraction flagged
//     for breaking the monotonic run (7.51 -> 7.71 -> 7.17). It appears here
//     in a filed package exactly as printed, which is why the catalog keeps
//     the NOA's value instead of "fixing" it.
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    lambda: 0.315,
    mg: 7.71,
    mf: 31.3,
    sealedPressures: [
      { zones: ["1"], pasd: 60 },
      { zones: ["2"], pasd: 96 },
    ],
  });
  check("Davie pkg: zone 1 Pasd*lambda", r.zones[0].pasdLambda, 18.9, 5e-3);
  check("Davie pkg: zone 1 Mr", r.zones[0].mr, 11.19, 5e-3);
  check("Davie pkg: zone 2 Pasd*lambda", r.zones[1].pasdLambda, 30.24, 5e-3);
  check("Davie pkg: zone 2 Mr", r.zones[1].mr, 22.53, 5e-3);
  check("Davie pkg: passes", r.passes, true);
}

// ---------------------------------------------------------------------------
// 1c. Package B - 1020 NE 203rd Terrace, Miami (Miami-Dade)
//       Westlake / Newpoint Barcelona 900, NOA 24-1008.13
//       lambda 0.301, Mg 6.76, Mf 29
//       (Zone 1:  60 x 0.301 = 18.06) - 6.76 = 11.30
//       (Zone 2:  94 x 0.301 = 28.29) - 6.76 = 21.53
//       (Zone 3: 114 x 0.301 = 34.31) - 6.76 = 27.55
//
//     Rounding note: the form shows 28.29 and 34.31, i.e. the contractor
//     rounded each product to two decimals before subtracting. We keep full
//     precision internally and round only at print time, so the tolerance
//     here absorbs that half-cent difference.
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    lambda: 0.301,
    mg: 6.76,
    mf: 29,
    sealedPressures: [
      { zones: ["1"], pasd: 60 },
      { zones: ["2"], pasd: 94 },
      { zones: ["3"], pasd: 114 },
    ],
  });
  check("Miami pkg: zone 1 Pasd*lambda", r.zones[0].pasdLambda, 18.06, 5e-3);
  check("Miami pkg: zone 1 Mr", r.zones[0].mr, 11.3, 5e-3);
  check("Miami pkg: zone 2 Pasd*lambda", r.zones[1].pasdLambda, 28.29, 5e-3);
  check("Miami pkg: zone 2 Mr", r.zones[1].mr, 21.53, 5e-3);
  check("Miami pkg: zone 3 Pasd*lambda", r.zones[2].pasdLambda, 34.31, 5e-3);
  check("Miami pkg: zone 3 Mr", r.zones[2].mr, 27.55, 5e-3);
  check("Miami pkg: passes", r.passes, true);
  // Mf 29 against a zone 3 demand of 27.55 leaves only 1.45 ft-lbf of margin.
  // Worth confirming the engine reports the tightest zone honestly rather than
  // rounding its way to a comfortable-looking pass.
  check("Miami pkg: zone 3 is the governing zone", r.zones[2].mr > r.zones[1].mr, true);
}

// ---------------------------------------------------------------------------
// 2. Negative Pasd must be treated as a magnitude, not subtracted.
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    lambda: 0.205,
    mg: 6.86,
    mf: 31.3,
    sealedPressures: [{ zones: ["1"], pasd: -39.1 }],
  });
  check("sign convention: same Mr for -39.1", r.zones[0].mr, 1.1555, 1e-3);
}

// ---------------------------------------------------------------------------
// 3. Table lookup: gable / Exposure C / 5:12 / 18 ft mean roof height
//    -> RAS 127-20 Table 2, band "Over 15 to 20 ft" = -60 / -96 / -136
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    roofForm: "gable",
    exposureCategory: "C",
    slopeRise: 5,
    meanRoofHeightFt: 18,
    riskCategory: "II",
    hasOverhang: true,
    designWindSpeedMph: 175,
    lambda: 0.282,
    mg: 6.41,
    mf: 37.4,
  });
  check("table lookup: table number", r.tableNumber, 2);
  check("table lookup: height band", r.heightBandLabel, "Over 15 to 20 ft");
  check("table lookup: zone count", r.zones.length, 3);
  check("table lookup: Pasd values", r.zones.map((z) => z.pasd), [60, 96, 136]);
  check("table lookup: within scope", r.scope.withinTableScope, true);
  check("table lookup: no seal needed", r.requiresEngineering, false);
  // Corner zone: 136 * 0.282 = 38.352 - 6.41 = 31.942 <= 37.4 -> pass
  check("table lookup: corner Mr", r.zones[2].mr, 31.942, 1e-3);
  check("table lookup: overall pass", r.passes, true);
}

// ---------------------------------------------------------------------------
// 4. A capacity shortfall must fail, and must fail only in the corner zone.
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    roofForm: "gable",
    exposureCategory: "C",
    slopeRise: 5,
    meanRoofHeightFt: 18,
    riskCategory: "II",
    hasOverhang: true,
    lambda: 0.282,
    mg: 6.41,
    mf: 21.9, // 2-10d smooth shank on 19/32 ply
  });
  check("shortfall: overall fails", r.passes, false);
  check("shortfall: field zone passes", r.zones[0].passes, true);
  check("shortfall: corner zone fails", r.zones[2].passes, false);
  check("shortfall: corner margin negative", r.zones[2].margin < 0, true);
}

// ---------------------------------------------------------------------------
// 5. Scope: Exposure B has no table and must demand a seal, not guess.
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    roofForm: "gable",
    exposureCategory: "B",
    slopeRise: 5,
    meanRoofHeightFt: 18,
    riskCategory: "II",
    hasOverhang: true,
    lambda: 0.282,
    mg: 6.41,
    mf: 37.4,
  });
  check("exposure B: not ok", r.ok, false);
  check("exposure B: requires engineering", r.requiresEngineering, true);
  check("exposure B: no zones produced", r.zones.length, 0);
}

// ---------------------------------------------------------------------------
// 6. Scope: above 60 ft, and outside the 2:12-12:12 slope range.
// ---------------------------------------------------------------------------
{
  const tall = mod.calculateRas127Method1({
    roofForm: "hip",
    exposureCategory: "C",
    slopeRise: 5,
    meanRoofHeightFt: 72,
    riskCategory: "II",
    hasOverhang: true,
    lambda: 0.282,
    mg: 6.41,
    mf: 37.4,
  });
  check("over 60 ft: requires engineering", tall.requiresEngineering, true);

  const steep = mod.calculateRas127Method1({
    roofForm: "gable",
    exposureCategory: "C",
    slopeRise: 14,
    meanRoofHeightFt: 18,
    riskCategory: "II",
    hasOverhang: true,
    lambda: 0.282,
    mg: 6.41,
    mf: 37.4,
  });
  check("14:12 slope: requires engineering", steep.requiresEngineering, true);

  const rc3 = mod.calculateRas127Method1({
    roofForm: "gable",
    exposureCategory: "C",
    slopeRise: 5,
    meanRoofHeightFt: 18,
    riskCategory: "III",
    hasOverhang: true,
    lambda: 0.282,
    mg: 6.41,
    mf: 37.4,
  });
  check("risk category III: requires engineering", rc3.requiresEngineering, true);
}

// ---------------------------------------------------------------------------
// 7. Missing NOA values must be reported, never assumed.
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    roofForm: "gable",
    exposureCategory: "C",
    slopeRise: 5,
    meanRoofHeightFt: 18,
    riskCategory: "II",
    hasOverhang: true,
  });
  check("missing NOA: not ok", r.ok, false);
  check("missing NOA: passes is null", r.passes, null);
  check("missing NOA: three items missing", r.missing.length, 3);
}

// ---------------------------------------------------------------------------
// 8. Slope band boundaries are inclusive at the top, per the table headings
//    (">=2:12 to <=4:12", ">4:12 to <=6:12", ">6:12 to <=12:12").
// ---------------------------------------------------------------------------
check("slope band 2", mod.slopeBandFromRise(2), "2_to_4");
check("slope band 4", mod.slopeBandFromRise(4), "2_to_4");
check("slope band 4.5", mod.slopeBandFromRise(4.5), "4_to_6");
check("slope band 6", mod.slopeBandFromRise(6), "4_to_6");
check("slope band 6.5", mod.slopeBandFromRise(6.5), "6_to_12");
check("slope band 12", mod.slopeBandFromRise(12), "6_to_12");
check("slope band 1.5 (out of scope)", mod.slopeBandFromRise(1.5), null);
check("slope band 13 (out of scope)", mod.slopeBandFromRise(13), null);

// ---------------------------------------------------------------------------
// 9. Hip roofs must surface the illegible-footnote warning.
// ---------------------------------------------------------------------------
{
  const r = mod.calculateRas127Method1({
    roofForm: "hip",
    exposureCategory: "C",
    slopeRise: 5,
    meanRoofHeightFt: 18,
    riskCategory: "II",
    hasOverhang: true,
    lambda: 0.282,
    mg: 6.41,
    mf: 37.4,
  });
  check("hip: table 8", r.tableNumber, 8);
  check(
    "hip: footnote warning present",
    r.scope.warnings.some((w) => w.includes("footnote 2")),
    true
  );
}

// ---------------------------------------------------------------------------
// 10. Lambda fallback formula (FBC-B 1518.8.5), against the filed FL6021 R1
//     engineer's example: b = 1.0 ft, l = 1.438 ft.
// ---------------------------------------------------------------------------
check("lambda direct deck", mod.estimateLambda(1.0, 1.438, "direct_deck"), 0.3226, 1e-3);
check("lambda batten", mod.estimateLambda(1.0, 1.438, "batten"), 0.2977, 1e-3);
check("lambda rejects zero", mod.estimateLambda(0, 1.438, "direct_deck"), null);

// ---------------------------------------------------------------------------
// 11. Every table must have 10 height-band values per column.
// ---------------------------------------------------------------------------
{
  let bad = 0;
  for (const form of ["gable", "hip"]) {
    for (const exp of ["C", "D"]) {
      for (const band of ["2_to_4", "4_to_6", "6_to_12"]) {
        const r = mod.lookupPressures({
          roofForm: form,
          exposureCategory: exp,
          slopeBand: band,
          meanRoofHeightFt: 60,
        });
        if (r.pressures.length === 0) bad++;
      }
    }
  }
  check("all 12 tables resolve at 60 ft", bad, 0);
}

console.log(
  failures === 0
    ? "\nAll RAS 127 checks passed."
    : `\n${failures} check(s) FAILED.`
);
process.exit(failures === 0 ? 0 : 1);
