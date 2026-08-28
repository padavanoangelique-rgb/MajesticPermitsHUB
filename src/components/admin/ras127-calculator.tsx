"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateRas127Method1,
  estimateLambda,
  ESTIMATE_LAMBDA_CAVEAT,
  SLOPE_BANDS,
  type Ras127Inputs,
  type RoofForm,
  type ExposureCategory,
} from "@/lib/roofing/ras127";

const LABEL =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const FIELD =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

export interface SavedCalculation {
  id: string;
  method: string;
  label: string | null;
  mr_required_ft_lbf: number | null;
  mr_noa_ft_lbf: number | null;
  passes: boolean | null;
  requires_engineering: boolean;
  engineering_reason: string | null;
  standard_ref: string | null;
  created_at: string;
}

export function Ras127Calculator({
  jobId,
  defaults,
  saved,
}: {
  jobId: string;
  defaults: {
    slopeRise?: number | null;
    meanRoofHeightFt?: number | null;
    exposureCategory?: string | null;
    riskCategory?: string | null;
    designWindSpeedMph?: number | null;
    noaNumber?: string | null;
    tileProfile?: string | null;
  };
  saved: SavedCalculation[];
}) {
  const router = useRouter();

  const [roofForm, setRoofForm] = useState<RoofForm | "">("");
  const [exposure, setExposure] = useState<ExposureCategory | "">(
    (defaults.exposureCategory as ExposureCategory) || ""
  );
  const [slopeRise, setSlopeRise] = useState(
    defaults.slopeRise != null ? String(defaults.slopeRise) : ""
  );
  const [height, setHeight] = useState(
    defaults.meanRoofHeightFt != null ? String(defaults.meanRoofHeightFt) : ""
  );
  const [riskCategory, setRiskCategory] = useState(defaults.riskCategory || "II");
  const [windSpeed, setWindSpeed] = useState(
    defaults.designWindSpeedMph != null ? String(defaults.designWindSpeedMph) : ""
  );
  const [overhang, setOverhang] = useState<"true" | "false" | "">("");

  const [lambda, setLambda] = useState("");
  const [mg, setMg] = useState("");
  const [mf, setMf] = useState("");
  const [application, setApplication] = useState<"direct_deck" | "batten">(
    "direct_deck"
  );

  // Lambda fallback helper
  const [showEstimator, setShowEstimator] = useState(false);
  const [exposedWidth, setExposedWidth] = useState("");
  const [tileLength, setTileLength] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const num = (v: string) => (v === "" ? null : Number(v));

  const inputs: Ras127Inputs = useMemo(
    () => ({
      roofForm: roofForm || null,
      exposureCategory: exposure || null,
      slopeRise: num(slopeRise),
      meanRoofHeightFt: num(height),
      riskCategory: riskCategory || null,
      designWindSpeedMph: num(windSpeed),
      hasOverhang: overhang === "" ? null : overhang === "true",
      lambda: num(lambda),
      mg: num(mg),
      mf: num(mf),
    }),
    [roofForm, exposure, slopeRise, height, riskCategory, windSpeed, overhang, lambda, mg, mf]
  );

  // Live preview, computed with the same engine the server uses.
  const result = useMemo(() => calculateRas127Method1(inputs), [inputs]);

  const estimated = useMemo(() => {
    const b = num(exposedWidth);
    const l = num(tileLength);
    if (b == null || l == null) return null;
    return estimateLambda(b, l, application);
  }, [exposedWidth, tileLength, application]);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/calculations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        roof_form: roofForm,
        exposure_category: exposure,
        slope_rise: slopeRise,
        mean_roof_height_ft: height,
        risk_category: riskCategory,
        design_wind_speed_mph: windSpeed,
        has_overhang: overhang,
        lambda,
        mg,
        mf,
        application,
        noa_number: defaults.noaNumber ?? null,
        tile_profile: defaults.tileProfile ?? null,
        label: `RAS 127 Method 1 — ${roofForm || "roof"} / Exp ${exposure || "?"}`,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("Worksheet saved");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error || "Save failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
        <p className="font-semibold text-[#0B1F3F] dark:text-white">
          Mr = (Pasd × λ) − Mg, and the attachment is acceptable when Mf ≥ Mr in
          every roof zone.
        </p>
        <p className="mt-1">
          λ, Mg and Mf come from the tile&rsquo;s NOA or Florida Product
          Approval — they are product-specific and are never estimated here.
          Design pressures come from the RAS 127-20 tables, which cover Exposure
          C and D, Risk Category II, gable or hip roofs with overhangs, up to 60
          ft mean roof height and 2:12 to 12:12 slope. Anything outside that
          needs an analysis signed and sealed by a Florida PE or registered
          architect.
        </p>
      </div>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C9A24B]">
          Roof &amp; site
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={LABEL}>Roof form</span>
            <select
              value={roofForm}
              onChange={(e) => setRoofForm(e.target.value as RoofForm | "")}
              className={FIELD}
            >
              <option value="">Select…</option>
              <option value="gable">Gable</option>
              <option value="hip">Hip</option>
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Exposure</span>
            <select
              value={exposure}
              onChange={(e) =>
                setExposure(e.target.value as ExposureCategory | "")
              }
              className={FIELD}
            >
              <option value="">Select…</option>
              <option value="B">B — no RAS 127 table</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Slope (rise in 12)</span>
            <input
              type="number"
              step="0.5"
              value={slopeRise}
              onChange={(e) => setSlopeRise(e.target.value)}
              className={FIELD}
            />
            <span className="mt-1 block text-[11px] text-slate-500">
              Bands: {SLOPE_BANDS.map((b) => b.label).join(" · ")}
            </span>
          </label>
          <label className="block">
            <span className={LABEL}>Mean roof height (ft)</span>
            <input
              type="number"
              step="0.5"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Risk category</span>
            <select
              value={riskCategory}
              onChange={(e) => setRiskCategory(e.target.value)}
              className={FIELD}
            >
              <option value="II">II</option>
              <option value="I">I</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Overhang</span>
            <select
              value={overhang}
              onChange={(e) => setOverhang(e.target.value as any)}
              className={FIELD}
            >
              <option value="">Not confirmed</option>
              <option value="true">Yes — has overhang</option>
              <option value="false">No overhang</option>
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Design wind speed (mph)</span>
            <input
              type="number"
              value={windSpeed}
              onChange={(e) => setWindSpeed(e.target.value)}
              className={FIELD}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C9A24B]">
          From the NOA / Product Approval
        </legend>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block">
            <span className={LABEL}>Application</span>
            <select
              value={application}
              onChange={(e) => setApplication(e.target.value as any)}
              className={FIELD}
            >
              <option value="direct_deck">Direct deck</option>
              <option value="batten">Batten</option>
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>λ (ft³)</span>
            <input
              type="number"
              step="0.001"
              value={lambda}
              onChange={(e) => setLambda(e.target.value)}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Mg (ft-lbf)</span>
            <input
              type="number"
              step="0.01"
              value={mg}
              onChange={(e) => setMg(e.target.value)}
              className={FIELD}
            />
            <span className="mt-1 block text-[11px] text-slate-500">
              Varies by slope in the NOA.
            </span>
          </label>
          <label className="block">
            <span className={LABEL}>Mf (ft-lbf)</span>
            <input
              type="number"
              step="0.01"
              value={mf}
              onChange={(e) => setMf(e.target.value)}
              className={FIELD}
            />
            <span className="mt-1 block text-[11px] text-slate-500">
              Attachment resistance for the chosen fastener.
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowEstimator((v) => !v)}
          className="mt-3 text-xs font-semibold text-[#C9A24B] hover:underline"
        >
          {showEstimator ? "Hide" : "NOA does not list λ?"}
        </button>

        {showEstimator && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {ESTIMATE_LAMBDA_CAVEAT}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={LABEL}>Exposed width b (ft)</span>
                <input
                  type="number"
                  step="0.001"
                  value={exposedWidth}
                  onChange={(e) => setExposedWidth(e.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Tile length l (ft)</span>
                <input
                  type="number"
                  step="0.001"
                  value={tileLength}
                  onChange={(e) => setTileLength(e.target.value)}
                  className={FIELD}
                />
              </label>
              <div className="flex items-end">
                {estimated != null ? (
                  <button
                    type="button"
                    onClick={() => setLambda(String(estimated))}
                    className="rounded-lg bg-[#0B1F3F] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Use λ = {estimated}
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">
                    Enter b and l.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </fieldset>

      {/* ---------------- Results ---------------- */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Result
        </h3>

        {result.requiresEngineering && (
          <div className="mt-2 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
            <p className="font-semibold">
              Signed and sealed engineering analysis required.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {result.scope.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {!result.ok && !result.requiresEngineering && result.missing.length > 0 && (
          <div className="mt-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <p className="font-semibold">Still needed:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {result.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {result.ok && (
          <>
            <div
              className={`mt-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                result.passes
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {result.passes
                ? "Acceptable — Mf is greater than or equal to Mr in every zone."
                : "Not acceptable — Mr exceeds the attachment resistance Mf in at least one zone."}
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-700">
                    <th className="py-2 pr-3">Zone</th>
                    <th className="py-2 pr-3">Pasd (psf)</th>
                    <th className="py-2 pr-3">Pasd × λ</th>
                    <th className="py-2 pr-3">− Mg = Mr</th>
                    <th className="py-2 pr-3">NOA Mf</th>
                    <th className="py-2 pr-3">Margin</th>
                    <th className="py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {result.zones.map((z) => (
                    <tr
                      key={z.label}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-2 pr-3 font-medium">{z.label}</td>
                      <td className="py-2 pr-3">{z.pasd}</td>
                      <td className="py-2 pr-3">{z.pasdLambda}</td>
                      <td className="py-2 pr-3 font-semibold">{z.mr}</td>
                      <td className="py-2 pr-3">{num(mf)}</td>
                      <td
                        className={`py-2 pr-3 ${
                          z.margin < 0 ? "text-red-600" : "text-slate-500"
                        }`}
                      >
                        {z.margin > 0 ? `+${z.margin}` : z.margin}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            z.passes
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          }`}
                        >
                          {z.passes ? "Pass" : "Fail"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              {result.usedSealedPressures
                ? "Using sealed design pressures."
                : `RAS 127-20 Table ${result.tableNumber}, ${result.heightBandLabel}.`}{" "}
              {result.standardRef}
            </p>
          </>
        )}

        {result.scope.warnings.length > 0 && (
          <ul className="mt-3 space-y-1 text-[11px] text-amber-700 dark:text-amber-400">
            {result.scope.warnings.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-[11px] italic text-slate-400">
          {result.provenance}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !result.ok}
            className="rounded-xl bg-[#0B1F3F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save worksheet"}
          </button>
          {msg && <span className="text-xs text-slate-500">{msg}</span>}
        </div>
      </div>

      {/* ---------------- History ---------------- */}
      {saved.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Saved worksheets
          </h3>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
            {saved.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0B1F3F] dark:text-white">
                    {c.label || c.method}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.mr_required_ft_lbf != null && c.mr_noa_ft_lbf != null
                      ? `Governing Mr ${c.mr_required_ft_lbf} vs NOA Mf ${c.mr_noa_ft_lbf} ft-lbf`
                      : c.engineering_reason
                        ? "Requires sealed engineering"
                        : "—"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    c.passes
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : c.passes === false
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {c.passes ? "Pass" : c.passes === false ? "Fail" : "Incomplete"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
