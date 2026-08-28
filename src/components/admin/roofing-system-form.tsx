"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROOF_SYSTEMS, WORK_TYPES } from "@/lib/roofing/forms";

export interface RoofingSystem {
  roof_system: string | null;
  work_type: string | null;
  roof_area_sf: number | null;
  product_approval_type: string | null;
  noa_number: string | null;
  noa_holder: string | null;
  noa_expires_on: string | null;
  manufacturer: string | null;
  product_name: string | null;
  deck_type: string | null;
  mean_roof_height_ft: number | null;
  roof_slope_rise: number | null;
  exposure_category: string | null;
  design_wind_speed_mph: number | null;
  risk_category: string | null;
  tile_profile: string | null;
  attachment_method: string | null;
  asbestos_survey_status: string;
  asbestos_note: string | null;
  roof_to_wall_required: boolean | null;
  insured_value_usd: number | null;
  year_permitted: number | null;
  notes: string | null;
}

const LABEL =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const FIELD =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

export function RoofingSystemForm({
  jobId,
  initial,
}: {
  jobId: string;
  initial: RoofingSystem | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [roofSystem, setRoofSystem] = useState(initial?.roof_system ?? "");

  const isTile = roofSystem.includes("tile");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, any> = {};
    fd.forEach((v, k) => {
      body[k] = v;
    });
    // Tri-state select needs to survive as null, not "".
    body.roof_to_wall_required = fd.get("roof_to_wall_required");

    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/roofing/${jobId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSaving(false);
      setMsg(j.error || "Save failed");
      return;
    }

    // Saving the system changes what forms are required, so rebuild the list.
    await fetch(`/api/admin/roofing/${jobId}/checklist`, { method: "POST" });
    setSaving(false);
    setMsg("Saved — checklist updated");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={LABEL}>Roof system</span>
          <select
            name="roof_system"
            value={roofSystem}
            onChange={(e) => setRoofSystem(e.target.value)}
            className={FIELD}
          >
            <option value="">Not set</option>
            {ROOF_SYSTEMS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={LABEL}>Work type</span>
          <select
            name="work_type"
            defaultValue={initial?.work_type ?? ""}
            className={FIELD}
          >
            <option value="">Not set</option>
            {WORK_TYPES.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={LABEL}>Roof area (sq ft)</span>
          <input
            name="roof_area_sf"
            type="number"
            step="0.01"
            defaultValue={initial?.roof_area_sf ?? ""}
            className={FIELD}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C9A24B]">
          Product approval
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={LABEL}>Approval type</span>
            <select
              name="product_approval_type"
              defaultValue={initial?.product_approval_type ?? ""}
              className={FIELD}
            >
              <option value="">Not set</option>
              <option value="noa">Miami-Dade NOA</option>
              <option value="florida_product_approval">
                Florida Product Approval
              </option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>NOA / approval number</span>
            <input
              name="noa_number"
              defaultValue={initial?.noa_number ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Approval expires</span>
            <input
              name="noa_expires_on"
              type="date"
              defaultValue={initial?.noa_expires_on ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Approval holder</span>
            <input
              name="noa_holder"
              defaultValue={initial?.noa_holder ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Manufacturer</span>
            <input
              name="manufacturer"
              defaultValue={initial?.manufacturer ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Product</span>
            <input
              name="product_name"
              defaultValue={initial?.product_name ?? ""}
              className={FIELD}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C9A24B]">
          Geometry &amp; wind design
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={LABEL}>Mean roof height (ft)</span>
            <input
              name="mean_roof_height_ft"
              type="number"
              step="0.01"
              defaultValue={initial?.mean_roof_height_ft ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Slope (rise in 12)</span>
            <input
              name="roof_slope_rise"
              type="number"
              step="0.01"
              defaultValue={initial?.roof_slope_rise ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Deck type</span>
            <input
              name="deck_type"
              placeholder="e.g. 19/32 plywood"
              defaultValue={initial?.deck_type ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Design wind speed (mph)</span>
            <input
              name="design_wind_speed_mph"
              type="number"
              defaultValue={initial?.design_wind_speed_mph ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Exposure category</span>
            <select
              name="exposure_category"
              defaultValue={initial?.exposure_category ?? ""}
              className={FIELD}
            >
              <option value="">Not set</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>
          <label className="block">
            <span className={LABEL}>Risk category</span>
            <select
              name="risk_category"
              defaultValue={initial?.risk_category ?? ""}
              className={FIELD}
            >
              <option value="">Not set</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
            </select>
          </label>
        </div>

        {isTile && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Tile profile</span>
              <select
                name="tile_profile"
                defaultValue={initial?.tile_profile ?? ""}
                className={FIELD}
              >
                <option value="">Not set</option>
                <option value="high">High profile</option>
                <option value="low">Low profile</option>
                <option value="flat">Flat profile</option>
              </select>
            </label>
            <label className="block">
              <span className={LABEL}>Attachment method</span>
              <select
                name="attachment_method"
                defaultValue={initial?.attachment_method ?? ""}
                className={FIELD}
              >
                <option value="">Not set</option>
                <option value="mechanically_fastened">
                  Mechanically fastened
                </option>
                <option value="battens">Mechanically fastened over battens</option>
                <option value="mortar_set">Mortar set</option>
                <option value="adhesive_set">Adhesive set</option>
              </select>
            </label>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C9A24B]">
          Retrofit &amp; compliance
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className={LABEL}>Insured / ad-valorem value</span>
            <input
              name="insured_value_usd"
              type="number"
              step="0.01"
              defaultValue={initial?.insured_value_usd ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Year permitted</span>
            <input
              name="year_permitted"
              type="number"
              placeholder="e.g. 1998"
              defaultValue={initial?.year_permitted ?? ""}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>Roof-to-wall required</span>
            <select
              name="roof_to_wall_required"
              defaultValue={
                initial?.roof_to_wall_required === true
                  ? "true"
                  : initial?.roof_to_wall_required === false
                    ? "false"
                    : "unknown"
              }
              className={FIELD}
            >
              <option value="unknown">Decide from value &amp; year</option>
              <option value="true">Yes — required</option>
              <option value="false">No — not required</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL}>Asbestos survey</span>
            <select
              name="asbestos_survey_status"
              defaultValue={initial?.asbestos_survey_status ?? "unconfirmed"}
              className={FIELD}
            >
              <option value="unconfirmed">Unconfirmed</option>
              <option value="pending">Pending</option>
              <option value="on_file">On file</option>
              <option value="not_applicable">Not applicable</option>
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              Reminder only — this never blocks a submittal.
            </span>
          </label>
          <label className="block">
            <span className={LABEL}>Asbestos note</span>
            <input
              name="asbestos_note"
              defaultValue={initial?.asbestos_note ?? ""}
              className={FIELD}
            />
          </label>
        </div>
      </fieldset>

      <label className="block">
        <span className={LABEL}>Internal notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          className={FIELD}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#0B1F3F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save roof system"}
        </button>
        {msg && <span className="text-xs text-slate-500">{msg}</span>}
      </div>
    </form>
  );
}
