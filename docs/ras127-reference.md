# RAS 127 Method 1 — Engineering Reference for Calculator Implementation

**Compiled:** 2026-08-28. **Code basis:** Florida Building Code, 8th Edition (2023) — FBC-Building Chapter 16, FBC-B Chapter 15 (HVHZ), and *2023 FBC — Test Protocols for HVHZ* (which contains RAS 127-20).

> **READ THIS FIRST — the premise in the request is incorrect.**
> `Mf = qh · CL · b · L · La · λ` is **not** the RAS 127 Method 1 equation. It is a conflation of two *different*, mutually exclusive calculation frameworks:
>
> | | RAS 127 Method 1 (HVHZ / permit form) | FBC §1609.6.3 "Rigid Tile" (FRSA/TRI manual) |
> |---|---|---|
> | Equation | `Mr = (Pasd × λ) − Mg` | `Ma = qh · Kd · CL · b · L · La · [1.0 − GCp]` |
> | Wind input | ASD design uplift **pressure** `Pasd` (psf), from RAS 127 tables or PE analysis | velocity pressure `qh` (psf) + `GCp` |
> | Tile aero term | single lumped **aerodynamic multiplier λ (ft³)** from the NOA | explicit `CL · b · L · La` (a.k.a. "Tile Factor" `b·L·La`) |
> | Compare against | NOA `Mf` (attachment resistance) | NOA / TRI allowable uplift moment |
> | Where used | Miami-Dade / Broward HVHZ permit form Section E | Rest of Florida + IBC |
>
> There is **no `CL`, no `La`, and no `qh`** in RAS 127 Method 1. `λ` already contains the tile geometry and the lift/moment coefficients (it is derived from TAS 108 testing, or from `λ = 0.156·b·l²` / `0.144·b·l²`). Multiplying `λ` by `CL·b·L·La` would double-count tile geometry by roughly an order of magnitude.
>
> **There is also no "RAS 127 Table 1 — aerodynamic multiplier."** RAS 127 Tables 1–12 are *design wind uplift pressure* tables. λ is **product-specific and comes from the tile's Product Approval / NOA** — it is not tabulated by profile+slope in any code table. (Beware a false friend: FBC **Table 1609.7(2)** is titled "Adjustment factor for building height and exposure, (λ)" — a completely unrelated λ used for garage-door/simplified pressures.)

---

## VERIFIED (traced to primary/authoritative sources fetched in this session)

1. **RAS 127-20 Method 1 (moment-based) equation and pass/fail test** — `Mr = (Pasd × λ) − Mg`; acceptable if `Mf ≥ Mr` in every roof zone. Full text of RAS 127-20 §2.1–2.6 from [floridabuilding.org RAS-127 PDF](http://www.floridabuilding.org/fbc/thecode/2020_Code_Development/February2020Workshop/Attachments/Structural/Attachment%20comment-1-c-RAS%20127.pdf); same wording on the current [Miami-Dade HVHZ Uniform Roofing Application Form, FBC 8th Edition (2023)](https://www.miamidade.gov/permits/library/roofing-permit.pdf).
2. **RAS 127-20 Method 3 (uplift-based)** — `Fr = [(Pasd × l × w) − W] × cos θ`; acceptable if `F' ≥ Fr`. Same sources.
3. **All 12 RAS 127-20 Pasd tables**, transcribed below verbatim from the [floridabuilding.org PDF](http://www.floridabuilding.org/fbc/thecode/2020_Code_Development/February2020Workshop/Attachments/Structural/Attachment%20comment-1-c-RAS%20127.pdf).
4. **RAS 127-20 is still the version in force for the FBC 8th Edition (2023)** — listed in [ICC Digital Codes FLTP2023P1 (2023 FBC Test Protocols)](https://codes.iccsafe.org/content/FLTP2023P1/roofing-application-standard-ras-no-127-20-procedure-for-determining-the-moment-of-resistance-and-minimum-characteristic-resistance-load-to-install-a-tile-system-on-a-building-of-a-specified-roof-slope-and-height-using-allowable-stress-design-asd-in-accordance-with-asce-7), and remains RAS 127-20 in the 2026 9th Edition per [FRSA's 2026 tile code update](https://www.floridaroof.com/2026-Tile-Code-Update).
5. **λ origin and units (ft³)** — from NOA (TAS 108 testing), or by the FBC HVHZ formula `λ = 0.156·b·l²` (direct deck) / `0.144·b·l²` (batten), `b` = *exposed width* (ft), `l` = tile *length* (ft): [FBC-B §1518.8.5 / floridabuilding.org HVHZ Ch.15](https://www.floridabuilding.org/fbc/thecode/2013_Code_Development/HVHZ/FBCB/Chapter_15_2010.htm), [UpCodes "Clay and Concrete Roof Tile"](https://up.codes/s/clay-and-concrete-roof-tile). TAS 108 derivation `λ = C'Ma · b · l²`: [TAS 108-95](http://www.ecodes.biz/ecodes_support/free_resources/2010Florida/TestProtocols/PDFs/Testing%20Application%20Standard%20No_108-95.pdf).
6. **A real NOA λ / Mg / Mf table** (this is the "table" a calculator must read, per product) — [Miami-Dade NOA 24-1008.09, Eagle Roofing Products, Medium Profile Concrete Tile](https://www.miamidade.gov/building/library/productcontrol/noa/24100809.pdf).
7. **A verified worked Method 1 calculation** from a filed permit: `39.1 × 0.205 = 8.016 − 6.86 = 1.156 ≤ 31.3 (NOA Mf)` — [Miami Lakes eTRAKiT HVHZ Roof Permit Form Section E](https://trakit.miamilakes-fl.gov/etrakit/viewAttachment.aspx?Group=PERMIT&ActivityNo=RWR2020-1913&key=EPR:2006011122478). Note 39.1 / 68.1 / 100.7 psf are exactly RAS 127-20 Table 1 (Exp C, ≤20 ft, >2:12–6:12).
8. **FBC 8th Ed. (2023) §1609.6.3 Rigid Tile, Equation 16-18** variable list — including `Kd` — and its 8 applicability limits: [UpCodes 2023 FBC-Building Ch.16](https://up.codes/viewer/florida/fl-building-code-2023/chapter/16/structural-design), and [Florida Building Commission §1609 reference material](https://www.floridabuilding.org/fbc/commission/FBC_0824/Commission_Education_POC/836/836-2-REFERMAT.pdf).
9. **CL = 0.2** for concrete and clay tile (in the §1609.6.3 framework only), and the `La = 0.76L` moment-arm definition with axis-of-rotation rules: same two sources.
10. **ASCE 7-22 is the referenced edition for FBC 8th Ed.** — Miami-Dade's own tile form says "Minimum Design Wind Pressures (psf) from 2020 RAS-127 **or Calculations per ASCE 7-22**": [Miami-Dade Roof Section D — Tile Roof](https://www.miamidade.gov/permits/library/roof-section-d-tile-roof.pdf). Also stated in [FRSA's 2026 update](https://www.floridaroof.com/2026-Tile-Code-Update).
11. **ASCE 7-22 `qh` equation, Kd removal, and terrain constants** — `qz = 0.00256·Kz·Kzt·Ke·V²` with Kd moved to the Chapter 30 pressure equations: [NRCA / Professional Roofing, "A revised approach to wind load calculations" (2023)](https://www.professionalroofing.net/Articles/A-revised-approach-to-wind-load-calculations--05-01-2023/5225). `Kz = 2.41(z/zg)^(2/α)`, with B: α=7.5 zg=3280 ft; C: α=9.8 zg=2460 ft; D: α=11.5 zg=1935 ft: [S.K. Ghosh Associates / SEAU ASCE 7-22 update slides](https://seau.org/images/meeting/022024/seau_2024_asce_7_22_updates.pdf).
12. **FRSA/TRI 7th Edition manual** (ASCE 7-22 based, Tile Factor = 1.407 ft³, `qh` tables, `Ma` examples, Vasd conversion, profile definitions): [FRSA-TRI Florida High Wind Concrete and Clay Tile Installation Manual, 7th Edition, 12/31/23](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf).
13. **HVHZ TAS 106 field static uplift test requirement** for mortar/adhesive-set tile: [UpCodes FBC-B §1523.6.5.2.2 / HVHZ Testing](https://up.codes/s/high-velocity-hurricane-zones-testing), [TAS 106 text](https://up.codes/viewer/florida/fl-test-protocols-2020/chapter/testing_app_std_106_/testing-application-standard-tas-no-106-standard-procedure-for-field-verificatio).
14. **Mg derivation** `Mg = W · cos(θ − α) · Lg` from a filed engineer's calculation sheet: [FL6021 R1 — ATL of South Florida, Restoring Moment & Aerodynamic Multiplier calcs](https://www.floridabuilding.org/upload/PR_Tech_Docs/FL6021_R1_TR_Spanish%20-%20Restoring%20Moment%20%20Aerodynamic%20Multipl.pdf).

## UNVERIFIED / NEEDS ENGINEER CONFIRMATION

| # | Item | Status |
|---|---|---|
| U1 | **A code/RAS table of λ values by tile profile + slope + battened/direct-deck does not exist.** λ is per-product, from the NOA. I found no authoritative generic λ table and I have **not** invented one. If your calculator needs λ, it must be entered by the user from the NOA (or computed from `0.156·b·l²` / `0.144·b·l²` if the NOA does not list λ). | **Confirmed absent** — do not fabricate |
| U2 | **Is `Kd` in FBC 8th Ed. Equation 16-18?** The *variable list* published by [UpCodes for the 2023 8th Edition](https://up.codes/viewer/florida/fl-building-code-2023/chapter/16/structural-design) and by the [Florida Building Commission](https://www.floridabuilding.org/fbc/commission/FBC_0824/Commission_Education_POC/836/836-2-REFERMAT.pdf) **does include `Kd` = wind directionality factor from Chapter 26 of ASCE 7**. The equation itself renders as an image on both pages and I could **not** read the printed equation. But the [FRSA/TRI 7th Edition manual (12/31/23)](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf) labels its example "FBC – 1609.5.3" (7th-Edition numbering) and computes `Ma = qh CL b L La (1.0 − GCp)` with **no Kd**. Applying `Kd = 0.85` reduces `Ma` by 15%. **A Florida PE must decide.** Safe default: omit Kd (conservative, matches FRSA tables). | **Sources disagree** |
| U3 | **Exact numeric ASCE 7-22 Table 26.10-1 `Kh`/`Kz` values.** I could not fetch the ASCE table itself (paywalled). The `Kh` table below is **computed** from the verified `Kz = 2.41(z/zg)^(2/α)` formula and cross-checks to published values, but is not a transcription of Table 26.10-1. | **Computed, spot-checked** |
| U4 | **FRSA 7th Ed. Example 1 internal inconsistency**: the same page gives `qh = 46.38 psf` from the formula and `qh = 46.9 psf` from its own table for Exp C / 40 ft / 170 mph, then uses 46.9. Also "La = 1.08 L (ft)" in Example 2 is a typo for "La = 1.08 ft". Do not replicate. | **Source error, flagged** |
| U5 | **Broward "Method 2"** (simplified table) — two different numeric tables appear on [UpCodes](https://up.codes/s/tile-calculations) (−46 to −57.9) and on the [floridabuilding.org HVHZ Ch.15 page](https://www.floridabuilding.org/fbc/thecode/2013_Code_Development/HVHZ/FBCB/Chapter_15_2010.htm) (34.4 to 42.2), both legacy. The current Miami-Dade form says Method 2 is "only applicable in Broward County." **Do not implement Method 2** without a current Broward BORA source. | **Sources disagree / legacy** |
| U6 | **Whether Ke may be taken as 1.0** — FRSA states `Ke = 1.0 up to 1,000 ft` elevation, which is true for all of Florida. Cited to FRSA, not to ASCE 7-22 §26.9 directly. | Low risk |
| U6b | **The RAS 127-20 PDF I read is the 2020 Florida Building Commission code-development REDLINE**, not the final published standard (it opens with "Revise the following sections as follows:" and text extraction loses the strikethrough markup — hence artifacts like "Tables 1-3 **is are** applicable"). **I rendered the pages as images to resolve this: the legacy 2-column Tables 1–2 are fully struck through — i.e. DELETED by RAS 127-20 — and the new Tables 1–12 (highlighted as new insertions) are the replacement.** So use Tables 1–12 only; Appendix A.0 is historical. I could not open the final published FLTP2023P1 text (ICC paywall) to confirm the adopted result matches the redline. | **Resolved by page render; published text unverified** |
| U6c | **Table 6, row >20′ to ≤25′, Zone "1, 2e and 2r" reads −87**, breaking the monotonic sequence −86 → −87 → −92. Verified as what the PDF says; may be a typo in the standard itself. | **Possible code typo** |
| U6d | **"(Overhang)" is struck through in the Table 11 header** (rendered image, p.17) but *not* in Tables 1 or 12. Meanwhile §1 Scope says Tables 10–12 apply to hip roofs "and overhangs." Redline ambiguity — unresolved. | **Ambiguous** |
| U6e | **The superscript footnotes "1, 2" on the Exposure D headings of new Tables 11 and 12 are never defined anywhere in the redline document.** Their content is unknown. | **Not found** |
| U7 | **No importance factor** appears in ASCE 7-16/7-22 velocity pressure (it was removed after ASCE 7-05). Risk Category enters via the wind-speed map, not a factor. I did not fetch ASCE 7-22 §26.10.2 verbatim to confirm. | Low risk |

---

## 1. Method 1 — exact equation and pass/fail inequality

RAS 127-20, §2, verbatim from the [Florida Building Commission PDF](http://www.floridabuilding.org/fbc/thecode/2020_Code_Development/February2020Workshop/Attachments/Structural/Attachment%20comment-1-c-RAS%20127.pdf):

> 2.1 Determine the minimum design wind pressures for the field, perimeter and corner areas (Pasd 1, Pasd 2 and Pasd 3, respectively) each roof pressure zone using the values given in Tables 1-3, or Tables 4-6, Tables 7-9 or Tables 10-12, as applicable, or those obtained by engineering analysis prepared, signed and sealed by a professional engineer or registered architect based on ASCE 7.
> 2.2 Locate the aerodynamic multiplier (λ) in tile Product Approval.
> 2.3 Determine the restoring moment due to gravity (Mg) per Product Approval.
> 2.4 Determine the attachment resistance (Mf) per Product Approval.
> 2.5 Determine the Moment of Resistance (Mr) per following formula: **Mr = (Pasd λ) - Mg**
> 2.6 Compare the values for Mr, with the values for Mf, noted in the Product Approval. If the Mf values are greater than or equal to the Mr values, for each area of the roof [i.e., field Pasd(1), perimeter Pasd(2) and corner Pasd(3) areas], then the tile attachment method is acceptable.

### Implementation form

For each roof pressure zone *i*:

```
Mr_i = (|Pasd_i| × λ) − Mg          [ft-lbf]
PASS  ⟺  Mf ≥ Mr_i   for all zones i
```

**Sign convention (critical):** RAS 127 tabulates `Pasd` as **negative** (uplift) numbers, but the Miami-Dade permit form instructs: *"Enter positive uplift pressures when using this table"* ([Miami-Dade HVHZ Uniform Roofing Application Form](https://www.miamidade.gov/permits/library/roofing-permit.pdf)). Use the **absolute value**. Verified by the filed worked example: `39.1 × 0.205 = 8.016 − 6.86 = 1.156 ≤ 31.3` ([Miami Lakes permit record](https://trakit.miamilakes-fl.gov/etrakit/viewAttachment.aspx?Group=PERMIT&ActivityNo=RWR2020-1913&key=EPR:2006011122478)).

### Variables — every one, with units

| Symbol | Name | Units | Source | Notes |
|---|---|---|---|---|
| `Pasd` | ASD design wind uplift pressure, per roof pressure zone | **psf** | RAS 127-20 Tables 1–12, **or** PE/RA-sealed ASCE 7 analysis | `Pasd = 0.6 · Pult` (footnote 3 of RAS 127-20 Tables 1 & 2). Enter as positive magnitude. |
| `λ` | Aerodynamic multiplier | **ft³** | **Tile Product Approval / NOA** | Product-specific; differs for batten vs. direct-deck. TAS 108-derived `λ = C'Ma·b·l²`, or FBC formula (§3 below). |
| `Mg` | Restoring moment due to gravity | **ft-lbf** | Tile NOA (tabulated by roof slope and batten/direct-deck) | `Mg = W · cos(θ − α) · Lg` per [FL6021 R1](https://www.floridabuilding.org/upload/PR_Tech_Docs/FL6021_R1_TR_Spanish%20-%20Restoring%20Moment%20%20Aerodynamic%20Multipl.pdf). Deducted, per §2.5 — **yes, your assumption is correct on this point.** |
| `Mr` | Required Moment of Resistance | **ft-lbf** | Calculated | Note the naming: in RAS 127, `Mr` is the *demand*, `Mf` is the *capacity*. This is the reverse of the usual convention — do not swap them. |
| `Mf` | Attachment resistance, expressed as a moment | **ft-lbf** | Attachment-system Product Approval / NOA (from TAS 101 for mortar/adhesive-set, TAS 102/102A for mechanically fastened) | Capacity. Margins of safety already applied in NOA values. |
| `θ` | Roof slope angle | degrees (or x:12) | Job site | Selects the `Mg` column in the NOA; also used in Method 3. |
| `H` | Mean roof height | ft | Job site | Selects the `Pasd` row. |
| `F'` | Minimum characteristic resistance load | **lbf** | NOA | Method 3 only (uplift-based systems). |
| `Fr` | Required uplift resistance | **lbf** | Calculated | Method 3 only. |
| `W` | Average tile weight | **lbf** | NOA | Method 3 only. |
| `l`, `w` | Tile length, tile width | ft | NOA | Method 3 only. See §5. |

### Method 3 (for reference — uplift-based / non-air-permeable systems)

```
Fr_i = [ (|Pasd_i| × l × w) − W ] × cos θ      [lbf]
PASS ⟺ F' ≥ Fr_i
```
Which method applies is decided by the NOA, not by the calculator: systems **tested per TAS 108** (air-permeable, verified per TAS 116, meeting TAS 108 size criteria) get λ + Mf + Mg and use **moment-based Method 1**; systems **not** TAS 108-tested get `F'` and use **uplift-based Method 3** ([FBC-B §1523.6.5.2.2.2 / .2.2.3](https://www.floridabuilding.org/fbc/thecode/2013_Code_Development/HVHZ/FBCB/Chapter_15_2010.htm), [UpCodes §1523.6.5.2](https://up.codes/s/clay-and-cement-roof-tiles)).

---

## 2. Velocity pressure `qh` — only needed for the §1609.6.3 route, NOT for RAS 127 Method 1

RAS 127 Method 1 consumes `Pasd` (psf) directly. `qh` enters only if (a) you replace the RAS 127 tables with a PE-sealed ASCE 7 analysis, or (b) you implement the FBC §1609.6.3 / FRSA-TRI route.

### ASCE 7-22 (referenced by FBC 8th Edition, 2023)

```
qh = 0.00256 · Kh · Kzt · Ke · V²          [psf, V in mph]
```

- `0.00256` — unit/air-density coefficient (psf; use 0.613 for N/m² with V in m/s).
- `Kh` — velocity pressure exposure coefficient evaluated at **mean roof height h** (ASCE 7-22 Table 26.10-1). ASCE 7-22 Table 26.10-1 is titled "Velocity Pressure Exposure Coefficients, **Kh and Kz**" ([NRCA](https://nrcawebstorage.blob.core.windows.net/files/Content%20Updates/ASCE%20Web%20Ex%20-%20Coefficients.docx)) — `Kh` is simply `Kz` evaluated at `z = h`.
- `Kzt` — topographic factor (ASCE 7-22 §26.8). `Kzt = 1.0` for flat terrain, which is the FRSA/TRI assumption for Florida.
- `Ke` — ground elevation factor (ASCE 7-22 §26.9). **`Ke = 1.0` up to 1,000 ft elevation** per [FRSA/TRI 7th Ed.](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf) — i.e. 1.0 everywhere in Florida.
- **`Kd` is NOT in the ASCE 7-22 velocity pressure equation.** It was moved into the individual pressure/force equations (Chapters 27–30) — [NRCA / Professional Roofing (2023)](https://www.professionalroofing.net/Articles/A-revised-approach-to-wind-load-calculations--05-01-2023/5225). Under ASCE 7-16 it *was* inside `qz`: `qz = 0.00256 Kz Kzt Kd Ke V²`. **Edition difference — matters.** See U2 for whether it belongs in `Ma`.
- **No importance factor.** Risk Category is handled through the mapped wind speed `V` (ASCE 7 maps are risk-category-specific). See U7.
- `V` — FRSA/TRI computes `qh` from the **nominal (ASD) wind speed** `Vasd = Vult · √0.6`, per [FBC-B Table 1609.3.1](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf). Published conversion (from that manual):

  | Vult | 110 | 120 | 130 | 140 | 150 | 160 | 170 | 180 | 190 |
  |---|---|---|---|---|---|---|---|---|---|
  | Vasd | 85 | 93 | 101 | 108 | 116 | 124 | 132 | 139 | 147 |

### Kh interpolation equation (ASCE 7-22) — VERIFIED

```
z = max(h, 15 ft)
Kh = 2.41 · (z / zg)^(2/α)          for 15 ft ≤ z ≤ zg
Kh = 2.41                            for zg < z ≤ 3280 ft
```
Terrain constants, ASCE 7-22 Table 26.11-1 ([SEAU / S.K. Ghosh ASCE 7-22 slides](https://seau.org/images/meeting/022024/seau_2024_asce_7_22_updates.pdf)):

| Exposure | α (ASCE 7-22) | zg, ft (ASCE 7-22) | α (ASCE 7-16, superseded) | zg, ft (7-16) |
|---|---|---|---|---|
| B | **7.5** | **3280** | 7.0 | 1200 |
| C | **9.8** | **2460** | 9.5 | 900 |
| D | **11.5** | **1935** | 11.5 | 700 |

Also changed in 7-22: the leading coefficient is **2.41** (was 2.01 in 7-16) — same source. **Using 7-16 constants with the 7-22 coefficient, or vice-versa, produces wrong answers.**

### Kh by mean roof height — COMPUTED from the formula above (see U3)

*Not transcribed from ASCE 7-22 Table 26.10-1. Computed values agree to ±0.01 with published 7-22 Kz tabulations (0.57/0.85/1.03 at 0–15 ft; 0.76/1.04/1.22 at 40 ft; 0.85/1.13/1.31 at 60 ft) and reproduce FRSA's stated `Kh = 1.04` for Exp C at 40 ft exactly.*

| h (ft) | Exp B | Exp C | Exp D |
|---|---|---|---|
| ≤15 | 0.573 | 0.851 | 1.035 |
| 20 | 0.619 | 0.903 | 1.088 |
| 25 | 0.656 | 0.945 | 1.131 |
| 30 | 0.689 | 0.980 | 1.168 |
| 35 | 0.718 | 1.012 | 1.199 |
| 40 | 0.744 | 1.040 | 1.228 |
| 45 | 0.768 | 1.065 | 1.253 |
| 50 | 0.790 | 1.088 | 1.276 |
| 55 | 0.810 | 1.110 | 1.297 |
| 60 | 0.829 | 1.129 | 1.317 |

**Recommendation:** implement the closed-form equation (verified) rather than hard-coding this table, and label output as computed. For any permit-critical value, use the `qh` tables published in the [FRSA/TRI 7th Edition manual](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf) (Exposure C excerpt, psf, Vult across the top):

| h (ft) | 115 | 120 | 130 | 140 | 150 | 160 | 170 | 180 | 190 |
|---|---|---|---|---|---|---|---|---|---|
| 0–15 | 17.3 | 18.8 | 22.1 | 25.2 | 29.4 | 33.4 | 37.7 | 42.3 | 47.1 |
| 20 | 18.3 | 19.9 | 23.4 | 27.1 | 31.1 | 35.4 | 40.0 | 44.8 | 49.9 |
| 30 | 19.9 | 21.7 | 25.4 | 29.5 | 33.9 | 38.5 | 43.5 | 48.8 | 54.3 |
| 40 | 21.1 | 23.0 | 27.0 | 31.3 | 35.9 | 40.9 | 46.9 | 51.8 | 57.7 |
| 50 | 22.1 | 24.1 | 28.3 | 32.8 | 37.7 | 42.9 | 48.4 | 54.2 | 60.4 |
| 60 | 23.0 | 25.0 | 29.3 | 34.0 | 39.1 | 44.4 | 50.2 | 56.2 | 62.7 |

(See U4 — this table's 40 ft / 170 mph value of 46.9 does not reconcile with the manual's own worked formula result of 46.38.)

---

## 3. "RAS 127 Table 1 — aerodynamic multiplier λ": DOES NOT EXIST

**Explicit statement:** I could find **no authoritative table of λ values as a function of tile profile and roof slope**, in RAS 127, in FBC, or in any FRSA/TRI/TRI-Alliance document. I am not going to reconstruct one.

What actually exists:

**(a) λ is published per product in the NOA**, as a two-column table (batten vs. direct deck), by tile profile. Real example — [Miami-Dade NOA 24-1008.09 (Eagle Roofing, Medium Profile Concrete Tile)](https://www.miamidade.gov/building/library/productcontrol/noa/24100809.pdf):

*Table 1: Average Weight (W) and Dimensions*
| Tile Profile | W (lbf) | l (ft) | w (ft) |
|---|---|---|---|
| Medium Profile Concrete Tile | 9.5 | 1.417 | 1.04 |

*Table 2: Aerodynamic Multipliers — λ (ft³)*
| Tile Profile | λ, Batten Application | λ, Direct Deck Application |
|---|---|---|
| Medium Profile Concrete Tile | 0.305 | 0.282 |

*Table 3: Restoring Moments due to Gravity — Mg (ft-lbf)* — note λ does **not** vary with slope, but **Mg does**:
| Tile Profile | 2"&3":12 Batten | 2"&3":12 Direct | 4":12 Batten | 4":12 Direct | 5":12 Batten | 5":12 Direct | 6":12 Batten | 6":12 Direct | 7":12+ Batten | 7":12+ Direct |
|---|---|---|---|---|---|---|---|---|---|---|
| Medium Profile Concrete Tile | N/A | 6.65 | 6.21 | 6.54 | 6.08 | 6.41 | 5.93 | 6.25 | 5.77 | 6.08 |

*Table 4 excerpt: Attachment Resistance as a Moment — Mf (ft-lbf), Nail-On Systems*
| Fastener | Direct Deck (min 15/32" ply) | Direct Deck (min 19/32" ply) | Battens |
|---|---|---|---|
| 2-10d Ring Shank Nails | 27.8 | 37.4 | 28.8 |
| 1-10d Smooth or Screw Shank Nail | 8.8 | 11.8 | 4.1 |
| 2-10d Smooth or Screw Shank Nails | 16.4 | 21.9 | 7.1 |
| 1 #8 Screw | 25.8 | 25.8 | 22.9 |
| 2 #8 Screw | 47.1 | 47.1 | 49.1 |
| 1-10d Smooth/Screw Shank Nail (Field Clip) | 24.3 | 24.3 | 24.2 |
| 1-10d Smooth/Screw Shank Nail (Eave Clip) | 19.0 | 19.0 | 22.1 |
| 2-10d Smooth/Screw Shank Nails (Field Clip) | 35.5 | 35.5 | 34.8 |

**(b) If the NOA does not list λ**, the FBC HVHZ closed form applies ([FBC-B §1518.8.5](https://www.floridabuilding.org/fbc/thecode/2013_Code_Development/HVHZ/FBCB/Chapter_15_2010.htm), [UpCodes](https://up.codes/s/clay-and-concrete-roof-tile)):

```
direct deck:  λ = 0.156 × b × l²        [ft³]
batten:       λ = 0.144 × b × l²        [ft³]
b = exposed width of the tiles (ft);  l = length of tiles (ft)
```
Worked example from a filed engineer's report ([FL6021 R1](https://www.floridabuilding.org/upload/PR_Tech_Docs/FL6021_R1_TR_Spanish%20-%20Restoring%20Moment%20%20Aerodynamic%20Multipl.pdf)): b = 12.0"/12 = 1.0 ft, l = 17.25"/12 = 1.438 ft → direct deck λ = 0.156 × 1.0 × 1.438² = **0.32**; batten λ = 0.144 × 1.0 × 1.438² = **0.30**.

**⚠ Formula and NOA disagree in direction.** The formula gives direct-deck λ > batten λ. NOA 24-1008.09 gives the opposite (batten 0.305 > direct deck 0.282), because those values came from **TAS 108 testing** rather than the formula. **Always prefer the NOA value.** Sanity check: the formula applied to that NOA's dimensions gives 0.156 × 1.04 × 1.417² = 0.326, ~16% higher than the tested 0.282.

**(c) TAS 108 derivation** ([TAS 108-95](http://www.ecodes.biz/ecodes_support/free_resources/2010Florida/TestProtocols/PDFs/Testing%20Application%20Standard%20No_108-95.pdf)): `λ = C'Ma × b × l²`, where `C'Ma` = adjusted coefficient of moment, `b` = tile cover width, `l` = tile length; for "S"-shaped clay/concrete tile, `C'Ma = CMa × 0.984`.

**Design guidance for the calculator:** make λ a **required user input read off the NOA**, with the profile / batten-vs-direct-deck selection, plus an optional "estimate from dimensions" fallback that is clearly labeled as the FBC §1518.8.5 formula and flagged as superseded by any NOA value.

---

## 4. Lift coefficient `CL`

- **RAS 127 Method 1 has no `CL` term.** It is absorbed into λ.
- In the **FBC §1609.6.3 / IBC §1609.5.3** framework: **`CL = 0.2`** for concrete and clay tile, "or shall be determined by test in accordance with Section 1504.2.1" ([UpCodes 2023 FBC-B Ch.16](https://up.codes/viewer/florida/fl-building-code-2023/chapter/16/structural-design)). Used as 0.2 in every FRSA/TRI worked example ([FRSA/TRI 7th Ed.](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf)).

---

## 5. `La`, `b`, `L` — definitions and measurement

**Again: `La` does not appear in RAS 127 Method 1.** It belongs to §1609.6.3.

`La` — verbatim from [FBC 8th Ed. §1609.6.3 / UpCodes](https://up.codes/viewer/florida/fl-building-code-2023/chapter/16/structural-design):

> Moment arm, feet (mm) from the axis of rotation to the point of uplift on the roof tile. The point of uplift shall be taken at **0.76L** from the head of the tile and the middle of the exposed width. For roof tiles with nails or screws (with or without a tail clip), the **axis of rotation shall be taken as the head of the tile for direct deck application or as the top edge of the batten for battened applications**. For roof tiles fastened only by a nail or screw along the side of the tile, the axis of rotation shall be determined by testing. For roof tiles installed with battens and fastened only by a clip near the tail of the tile, the moment arm shall be determined about the top edge of the batten with consideration given for the point of rotation of the tiles based on straight bond or broken bond and the tile profile.

So `La = 0.76 · L` for the standard direct-deck / battened nail-or-screw case ([FRSA/TRI 7th Ed.](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf) states `La = 0.76*L`). Typical values from published examples: `L = 17" = 1.42 ft → La = 1.08 ft`; `L = 16.5" = 1.375 ft → La = 1.045 ft` ([TRI ESR-2015P](https://www.eagleroofing.com/wp-content/uploads/2015/04/esr-2015p.pdf)).

| Symbol | Definition | Measured as | Units |
|---|---|---|---|
| `b` | **Exposed width** of the roof tile | **Exposed/cover width, NOT overall width.** FBC §1609.6.3: "Exposed width, feet (mm) of the roof tile." FBC §1518.8.5 for λ: "b (in feet) = **exposed width** of the tiles." TAS 108: "b = tile **cover** width." | ft |
| `L` (`l`) | **Length** of the roof tile | **Total / overall length**, head to tail — *not* the exposed length. FRSA: "L = roof tile length (ft)"; its Example 1 uses "a total tile length of 17"" → L = 1.42 ft. Ludowici/TRI example uses `L = 16-½"` total. | ft |
| `La` | Moment arm | `0.76 · L` (uses total L) | ft |
| Tile Factor | `TF = b · L · La` | ft³; FRSA/TRI tables are built for **TF = 1.407 ft³** and scale linearly by `TF_actual / 1.407` | ft³ |

⚠ **Note the `w` vs `b` trap.** In RAS 127 **Method 3**, the NOA-listed `w` is the **tile width** used with `l` to get tributary area (NOA 24-1008.09 lists `w = 1.04 ft` for that tile). In `λ` and in `Ma`, `b` is the **exposed/cover width**. For many interlocking profiles these differ. Read each value from the NOA field that carries the matching label.

---

## 6. Scope limits of Method 1, and when a Florida PE seal is required

### RAS 127-20 table scope — verbatim from §1 Scope

> Compliance with the requirements and procedures herein specified, where the design wind uplift pressures (Pasd) have been determined based on Tables 1-3, or Tables 4-6, Tables 7-9 or Tables 10-12 of this standard, as applicable, **do not require additional signed and sealed engineering design calculation. All other calculations must be prepared, signed and sealed by a professional engineer or registered architect.** … **All calculations must be submitted to the building official at time of permitting.**
> Tables 1-3 are applicable to a wind speed of **175 mph, risk category II buildings with gable roofs with overhangs, and exposure category C.** Tables 4-6 … **exposure category D.** Tables 7-9 … **hip roofs and overhangs, and exposure category C.** Tables 10-12 … **hip roofs and overhangs, and exposure category D.**

Therefore the **table-based (no-seal) envelope is**:

| Parameter | Allowed without a PE seal |
|---|---|
| Wind speed | 175 mph Vult (the tables are built for it) |
| Risk Category | **II only** |
| Roof form | Gable or hip, **with overhangs** |
| Exposure | **C or D only — there is NO Exposure B table** |
| Mean roof height | **≤ 60 ft** (Tables 1–12 run ≤15′ through >55′ to ≤60′) |
| Roof slope | **≥2:12 to ≤12:12** (bands: ≥2:12–≤4:12, >4:12–≤6:12, >6:12–≤12:12) |
| Tile system type | Air-permeable, TAS 108-tested → Method 1; otherwise Method 3 |

Anything outside that — Exposure B, Risk Category I/III/IV, h > 60 ft, slope < 2:12 or > 12:12, no overhang, monoslope/other roof forms, or wanting credit for a lower site wind speed — **requires an engineering analysis prepared, signed and sealed by a Florida professional engineer or registered architect, based on ASCE 7.** The PE-sealed `Pasd` then feeds the same `Mr = Pasd·λ − Mg` comparison.

Note the older/legacy RAS 127 Tables 1–2 (also present in the same PDF) top out at **>35′ to ≤40′**; the current Tables 1–12 extend to 60 ft. If your calculator uses the legacy 2-table format, its height limit is 40 ft.

### Method 1 vs 2 vs 3 (these labels come from the permit form, not from RAS 127)

Per the [Miami-Dade HVHZ Uniform Roofing Application Form, FBC 8th Ed. (2023), Section E](https://www.miamidade.gov/permits/library/roofing-permit.pdf):

- **Method 1 — "Moment Based Tile Calculations per RAS 127."** For moment-based systems. `(Zone × λ) − Mg = Mr ≤ NOA Mf`. Zone rows on the current Miami-Dade form: Zone 1, Zone 2 (→Mr2e), Zone 3 (→Mr2n). Some jurisdictional variants of the form carry five rows: Mr1, Mr2e, Mr2n, Mr2r, Mr3e ([Bal Harbour roofing permit package](https://balharbourfl.gov/wp-content/uploads/2022/08/ROOFING-PERMIT-PACKAGE-2020.pdf)).
- **Method 2 — "Simplified Tile Calculations."** The form states: *"Method 2 'Simplified Tile Calculations' only applicable in Broward County."* Broward's legacy version required use "in conjunction with a list of moment based tile systems endorsed by the Broward County Board of Rules and Appeals" ([floridabuilding.org HVHZ Ch.15](https://www.floridabuilding.org/fbc/thecode/2013_Code_Development/HVHZ/FBCB/Chapter_15_2010.htm)). See U5 — do not implement.
- **Method 3 — "Uplift Based Tile Calculations per RAS 127."** For non-air-permeable / non-TAS-108-tested systems. `F' ≥ Fr`.

### FRSA/TRI Concrete and Clay Tile Installation Manual — relationship

- The FRSA/TRI manual is the **prescriptive installation standard for tile in Florida outside the HVHZ**, and implements the **§1609.6.3 `Ma`** framework, not RAS 127. Its Table 2 series gives pre-computed **Required Aerodynamic Uplift Moment `Ma` (ft-lbf)** by roof form (hip/gable), Exposure (**B, C and D** — it *does* cover B, unlike RAS 127), slope band (Less than 4.5:12 / 4.5:12 to <6:12 / 6:12 to 12:12), mean roof height (0–30, 40, 50, 60 ft or 0–15, 20, 30… for Exp C/D) and Vult (115–190 mph), for **Tile Factor = 1.407 ft³**; you scale by `TF_actual / 1.407` ([FRSA/TRI 7th Ed.](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf)).
- Zone naming differs: FRSA uses **LPZ** (Low Pressure Zone = Zone 2 for hips / Zones 1 & 2) and **HPZ** (High Pressure Zone = Zone 3). RAS 127 and the permit form use Zones 1/2e/2n/2r/3e/3r. **Do not map these mechanically.**
- Current edition: **7th Edition, dated 12/31/23, built on ASCE 7-22.** FRSA states there will be **no revisions to its tables for the 2026 9th Edition code cycle** ([FRSA 2026 tile code update](https://www.floridaroof.com/2026-Tile-Code-Update)).
- Profile definitions from the FRSA/TRI 7th Ed. glossary: **Flat/Low profile** = rise ≤ 1/2"; **Medium profile** = rise > 1/2" and rise-to-width ratio ≤ 1:5 (installed); **High profile** = rise-to-width ratio greater than 1/2" rise (installed). *(The high-profile wording in the glossary is internally garbled; treat with caution.)*
- FBC §1609.6.3 applicability limits (8 items, [UpCodes 2023 FBC-B Ch.16](https://up.codes/viewer/florida/fl-building-code-2023/chapter/16/structural-design)) — these bound the `Ma` route, and are worth enforcing as validation in a calculator:
  1. Tiles loose laid on battens, mechanically fastened, mortar set, or adhesive set.
  2. Installed on solid sheathing designed as components and cladding.
  3. Underlayment installed per Chapter 15.
  4. Single-lapped interlocking, min head lap ≥ 2 in (51 mm).
  5. **Tile length between 1.0 and 1.75 ft** (305–533 mm).
  6. **Exposed width between 0.67 and 1.25 ft** (204–381 mm).
  7. Max tail thickness ≤ 1.3 in (33 mm).
  8. Mortar/adhesive-set systems: **≥ two-thirds of tile area free of mortar or adhesive contact.**
- §1609.6.2 Exception (the gateway): only **air-permeable** rigid tile over a compliant deck may be designed by §1609.6.3.
- Tornado loads (new, FBC 8th Ed. §1609.6.3.1): for Risk Category III/IV where required, replace `qh` with `qhT` (ASCE 7 §32.10) and `GCp` with `KvT(GCp)` (ASCE 7 §32.14). Out of scope for typical residential tile but must not be silently ignored for RC III/IV.

---

## 7. HVHZ (Miami-Dade / Broward) permit-submittal specifics

1. **Section E of the HVHZ Uniform Roofing Application Form must be filled in and submitted at permit application.** Both RAS 127-20 and the form state: *"All calculations must be submitted to the building official at the time of permit application"* ([RAS 127-20](http://www.floridabuilding.org/fbc/thecode/2020_Code_Development/February2020Workshop/Attachments/Structural/Attachment%20comment-1-c-RAS%20127.pdf), [Miami-Dade form](https://www.miamidade.gov/permits/library/roofing-permit.pdf)).
2. **Enter positive uplift pressures** in Section E Method 1, even though RAS 127 tabulates them negative ([Miami-Dade form](https://www.miamidade.gov/permits/library/roofing-permit.pdf)).
3. **Required attachments** listed on the Miami-Dade form: Fire Directory listing page; from the Product Approval — front page, specific system description, specific system limitations, general limitations, applicable detail drawings; **"Design calculations per Chapter 16, or if applicable, RAS 127 or RAS 128"**; other component Product Approvals; municipal permit application; Owner's Notification for Roofing Considerations (reroofing); any required roof testing/calculation documentation ([Miami-Dade form](https://www.miamidade.gov/permits/library/roofing-permit.pdf)).
4. **λ, Mg, Mf, F', W, l, w all come from a currently valid NOA / Florida Product Approval**, which must accompany the submittal. Some AHJs require the specific values to be highlighted/circled in the NOA — e.g. Pembroke Park requires the applicable RAS 127 roof type/slope table page printed with pressures highlighted, and NOA Tables 1–8 values highlighted ([Pembroke Park Roofing Application Checklist, FBC 2023 8th Ed.](https://www.tppfl.gov/DocumentCenter/View/970/ROOFING-APPLICATION-CHECKLIST)).
5. **`Pasd` source on the HVHZ form** is "the applicable Table in RAS-127 **or** an engineering analysis prepared by a PE based upon ASCE 7." Miami-Dade's Section D tile form phrases it as "from **2020 RAS-127** or **Calculations per ASCE 7-22**" ([Miami-Dade Roof Section D — Tile Roof](https://www.miamidade.gov/permits/library/roof-section-d-tile-roof.pdf)) — confirming ASCE 7-22 for the 8th Edition.
6. **NOA-level testing prerequisites (HVHZ):** mortar/adhesive-set systems tested for static uplift per **TAS 101**; mechanically fastened rigid systems per **TAS 102 / 102(A)**; wind characteristics (to obtain λ) per **TAS 108**; air permeability per **TAS 116** ([FBC-B §1523.6.5.2.2 / .2.3](https://www.floridabuilding.org/fbc/thecode/2013_Code_Development/HVHZ/FBCB/Chapter_15_2010.htm), [UpCodes §1523.6.5.2](https://up.codes/s/clay-and-cement-roof-tiles)).
7. **TAS 106 field static uplift test is a construction-phase HVHZ requirement** for mortar/adhesive-set tile, and may be required by the building official for mechanically attached systems; results must be submitted to the building official ([FBC-B HVHZ Ch.15](https://www.floridabuilding.org/fbc/thecode/2013_Code_Development/HVHZ/FBCB/Chapter_15_2010.htm), [UpCodes HVHZ Testing](https://up.codes/s/high-velocity-hurricane-zones-testing)). Key TAS 106 numbers ([TAS 106 text](https://up.codes/viewer/florida/fl-test-protocols-2020/chapter/testing_app_std_106_/testing-application-standard-tas-no-106-standard-procedure-for-field-verificatio)): **35 ± 5 lbf** per tile for mortar/adhesive-set; **0.80 × F' (or Mr')** for mechanically attached; ≥1 test for roofs <5 squares, else ≥1 test per 2 squares in the field, 1 per square in perimeter and corner areas, plus 1 per 20 hip/ridge tiles; **≥75% of tests must pass**. Typical NOA limitation: *"For mortar or adhesive set tile applications, a static field uplift test in accordance with TAS 106 shall be required"* ([NOA 24-1008.09](https://www.miamidade.gov/building/library/productcontrol/noa/24100809.pdf)). Some non-HVHZ AHJs now impose it too ([Highland Beach policy, 2026](https://highlandbeach.us/DocumentCenter/View/955/Roof-Tile-Uplift-Test-Requirement-PDF)).
8. **Broward** publishes its own 8th-Edition Uniform Roofing Application form/interpretations via the Board of Rules and Appeals ([Broward BORA documents](https://www.broward.org/CodeAppeals/AboutUs/Documents/6th%20Edition%20(2017)%20Uniform%20Roofing%20Application.pdf) — 6th Ed. shown; confirm current 8th Ed. before relying on Method 2).
9. **Practitioner convention (not code):** HVHZ projects are commonly run at **Exposure C / 175 mph** to stay inside the RAS 127 no-seal table envelope; using a lower site wind speed pushes you into PE-sealed territory. Reported by practitioners on [r/Roofing](https://www.reddit.com/r/Roofing/comments/1mccm8w/common_mistakes_on_miamidades_hvhz_roofing_form/) — **treat as anecdote, not authority.**

---

## Appendix A — RAS 127-20 `Pasd` tables (transcribed verbatim)

All values in **psf, negative = uplift**. Source: [floridabuilding.org RAS-127 PDF](http://www.floridabuilding.org/fbc/thecode/2020_Code_Development/February2020Workshop/Attachments/Structural/Attachment%20comment-1-c-RAS%20127.pdf). Common footnotes: ¹Calculated in accordance with ASCE 7. ²"For Hip Roofs with slope **≤ 5.5:12**, Pasd(3) shall be treated as Pasd(2)" — the operator is destroyed by PDF text extraction, but I rendered p.3 as an image and the legacy Table 2 footnote clearly reads **≤**. ³`Pasd = 0.6·Pult`. **These footnotes belong to the DELETED legacy tables (A.0) only; the new Tables 1–12 carry no such hip-slope provision — hip slope is handled by the separate Tables 7–12 instead.**

### A.0 Legacy 2-table format — **DELETED by RAS 127-20** (struck through in the redline; see U6b). Height limit 40 ft.

Retained here only because a filed 2020 Miami Lakes permit used the Exposure C ≤20′ row (39.1 / 68.1 / 100.7), so you may encounter these numbers in older submittals. **Do not implement for new submittals — use Tables 1–12.**

**Legacy Table 1 — Risk Category II, Exposure C**
| Roof mean height | >2:12–≤6:12 Pasd(1) | Pasd(2) | Pasd(3)² | >6:12–≤12:12 Pasd(1) | Pasd(2)&(3) |
|---|---|---|---|---|---|
| ≤20′ | −39.1 | −68.1 | −100.7 | −42.8 | −50.0 |
| >20′ to ≤25′ | −40.9 | −71.3 | −105.4 | −44.8 | −52.3 |
| >25′ to ≤30′ | −42.4 | −73.9 | −109.3 | −46.4 | −54.3 |
| >30′ to ≤35′ | −43.9 | −76.6 | −113.2 | −48.1 | −56.2 |
| >35′ to ≤40′ | −45.1 | −78.7 | −116.3 | −49.4 | −57.8 |

**Legacy Table 2 — Risk Category II, Exposure D**
| Roof mean height | >2:12–≤6:12 Pasd(1) | Pasd(2) | Pasd(3)² | >6:12–≤12:12 Pasd(1) | Pasd(2)&(3) |
|---|---|---|---|---|---|
| ≤20′ | −47.0 | −81.9 | −121.0 | −51.4 | −60.1 |
| >20′ to ≤25′ | −48.8 | −85.0 | −125.7 | −53.4 | −62.4 |
| >25′ to ≤30′ | −50.3 | −87.7 | −129.6 | −55.0 | −64.4 |
| >30′ to ≤35′ | −51.5 | −89.9 | −132.7 | −56.4 | −65.9 |
| >35′ to ≤40′ | −52.7 | −91.9 | −135.8 | −57.7 | −67.9 |

*(The Miami Lakes filed permit uses 39.1 / 68.1 / 100.7 — i.e. the legacy Exposure C ≤20′ row.)*

### A.1 Current Tables 1–12 (Gable Tables 1–6, Hip Tables 7–12) — all "(Overhang)", Risk Category II

**Table 1 — Gable, slope ≥2:12 to ≤4:12, Exposure C**
| Roof Mean Height | Zones 1 and 2e | Zones 2n, 2r and 3e | Zone 3r |
|---|---|---|---|
| ≤15′ | −74 | −108 | −128 |
| >15 to ≤20′ | −78 | −114 | −136 |
| >20′ to ≤25′ | −82 | −120 | −142 |
| >25′ to ≤30′ | −85 | −125 | −148 |
| >30 to ≤35′ | −88 | −129 | −153 |
| >35 to ≤40′ | −91 | −132 | −157 |
| >40′ to ≤45′ | −93 | −136 | −162 |
| >45′ to ≤50′ | −95 | −139 | −165 |
| >50′ to ≤55′ | −97 | −142 | −169 |
| >55′ to ≤60′ | −98 | −144 | −171 |

**Table 2 — Gable, slope >4:12 to ≤6:12, Exposure C**
| Roof Mean Height | 1 and 2e | 2n, 2r and 3e | 3r |
|---|---|---|---|
| ≤15′ | −57 | −91 | −128 |
| >15 to ≤20′ | −60 | −96 | −136 |
| >20′ to ≤25′ | −63 | −101 | −142 |
| >25′ to ≤30′ | −66 | −105 | −148 |
| >30 to ≤35′ | −68 | −109 | −153 |
| >35 to ≤40′ | −70 | −111 | −157 |
| >40′ to ≤45′ | −72 | −115 | −162 |
| >45′ to ≤50′ | −73 | −117 | −165 |
| >50′ to ≤55′ | −75 | −120 | −169 |
| >55′ to ≤60′ | −76 | −121 | −171 |

**Table 3 — Gable, slope >6:12 to ≤12:12, Exposure C**
| Roof Mean Height | 1, 2e and 2r | 2n and 3r | 3e |
|---|---|---|---|
| ≤15′ | −67 | −74 | −115 |
| >15 to ≤20′ | −71 | −78 | −122 |
| >20′ to ≤25′ | −74 | −82 | −127 |
| >25′ to ≤30′ | −78 | −85 | −132 |
| >30 to ≤35′ | −80 | −88 | −137 |
| >35 to ≤40′ | −82 | −91 | −141 |
| >40′ to ≤45′ | −85 | −93 | −146 |
| >45′ to ≤50′ | −86 | −95 | −147 |
| >50′ to ≤55′ | −88 | −97 | −151 |
| >55′ to ≤60′ | −89 | −98 | −153 |

**Table 4 — Gable, slope ≥2:12 to ≤4:12, Exposure D**
| Roof Mean Height | 1 and 2e | 2n, 2r and 3e | 3r |
|---|---|---|---|
| ≤15′ | −90 | −131 | −156 |
| >15 to ≤20′ | −94 | −137 | −163 |
| >20′ to ≤25′ | −98 | −142 | −169 |
| >25′ to ≤30′ | −101 | −148 | −175 |
| >30 to ≤35′ | −104 | −152 | −180 |
| >35 to ≤40′ | −106 | −155 | −184 |
| >40′ to ≤45′ | −109 | −157 | −189 |
| >45′ to ≤50′ | −111 | −161 | −192 |
| >50′ to ≤55′ | −113 | −164 | −195 |
| >55′ to ≤60′ | −114 | −167 | −198 |

**Table 5 — Gable, slope >4:12 to ≤6:12, Exposure D**
| Roof Mean Height | 1 and 2e | 2n, 2r and 3e | 3r |
|---|---|---|---|
| ≤15′ | −69 | −110 | −156 |
| >15 to ≤20′ | −73 | −116 | −163 |
| >20′ to ≤25′ | −75 | −120 | −169 |
| >25′ to ≤30′ | −78 | −124 | −175 |
| >30 to ≤35′ | −80 | −128 | −180 |
| >35 to ≤40′ | −82 | −131 | −184 |
| >40′ to ≤45′ | −84 | −134 | −189 |
| >45′ to ≤50′ | −85 | −136 | −192 |
| >50′ to ≤55′ | −87 | −138 | −195 |
| >55′ to ≤60′ | −88 | −140 | −198 |

**Table 6 — Gable, slope >6:12 to ≤12:12, Exposure D**
| Roof Mean Height | 1, 2e and 2r | 2n and 3r | 3e |
|---|---|---|---|
| ≤15′ | −82 | −90 | −140 |
| >15 to ≤20′ | −86 | −94 | −146 |
| >20′ to ≤25′ | −87 | −98 | −151 |
| >25′ to ≤30′ | −92 | −101 | −157 |
| >30 to ≤35′ | −94 | −103 | −161 |
| >35 to ≤40′ | −97 | −106 | −165 |
| >40′ to ≤45′ | −99 | −109 | −168 |
| >45′ to ≤50′ | −101 | −111 | −172 |
| >50′ to ≤55′ | −102 | −112 | −174 |
| >55′ to ≤60′ | −104 | −114 | −177 |

*Note (U6c): the >20′–≤25′ row of Table 6 reads −87 in Zone "1, 2e and 2r", breaking the otherwise monotonic sequence (−86 → −87 → −92). Verify against the printed code before use.*

**Table 7 — Hip, slope ≥2:12 to ≤4:12, Exposure C**
| Roof Mean Height | Zone 1 | Zone 2r | Zones 2e and 3 |
|---|---|---|---|
| ≤15′ | −67 | −88 | −94 |
| >15 to ≤20′ | −71 | −93 | −100 |
| >20′ to ≤25′ | −75 | −97 | −104 |
| >25′ to ≤30′ | −78 | −101 | −109 |
| >30 to ≤35′ | −80 | −105 | −113 |
| >35 to ≤40′ | −82 | −107 | −115 |
| >40′ to ≤45′ | −85 | −110 | −119 |
| >45′ to ≤50′ | −86 | −112 | −121 |
| >50′ to ≤55′ | −88 | −115 | −124 |
| >55′ to ≤60′ | −89 | −117 | −125 |

**Table 8 — Hip, slope >4:12 to ≤6:12, Exposure C**
| Roof Mean Height | Zone 1 | Zones 2r and 2e | Zone 3 |
|---|---|---|---|
| ≤15′ | −71 | −91 | −111 |
| >15 to ≤20′ | −75 | −97 | −118 |
| >20′ to ≤25′ | −79 | −101 | −124 |
| >25′ to ≤30′ | −82 | −105 | −129 |
| >30 to ≤35′ | −84 | −109 | −133 |
| >35 to ≤40′ | −87 | −112 | −137 |
| >40′ to ≤45′ | −89 | −114 | −140 |
| >45′ to ≤50′ | −91 | −117 | −143 |
| >50′ to ≤55′ | −93 | −120 | −146 |
| >55′ to ≤60′ | −94 | −122 | −149 |

**Table 9 — Hip, slope >6:12 to ≤12:12, Exposure C**
| Roof Mean Height | Zone 1 | Zone 2r | Zone 2e | Zone 3 |
|---|---|---|---|---|
| ≤15′ | −57 | −98 | −101 | −128 |
| >15 to ≤20′ | −60 | −104 | −108 | −136 |
| >20′ to ≤25′ | −63 | −109 | −113 | −143 |
| >25′ to ≤30′ | −66 | −113 | −117 | −149 |
| >30 to ≤35′ | −67 | −117 | −121 | −153 |
| >35 to ≤40′ | −70 | −120 | −124 | −158 |
| >40′ to ≤45′ | −71 | −123 | −128 | −162 |
| >45′ to ≤50′ | −73 | −126 | −130 | −165 |
| >50′ to ≤55′ | −75 | −129 | −133 | −169 |
| >55′ to ≤60′ | −76 | −131 | −135 | −172 |

**Table 10 — Hip, slope ≥2:12 to ≤4:12, Exposure D**
| Roof Mean Height | Zone 1 | Zone 2r | Zones 2e and 3 |
|---|---|---|---|
| ≤15′ | −82 | −106 | −114 |
| >15 to ≤20′ | −86 | −111 | −120 |
| >20′ to ≤25′ | −89 | −116 | −124 |
| >25′ to ≤30′ | −91 | −120 | −129 |
| >30 to ≤35′ | −94 | −123 | −132 |
| >35 to ≤40′ | −97 | −126 | −136 |
| >40′ to ≤45′ | −99 | −128 | −138 |
| >45′ to ≤50′ | −101 | −131 | −141 |
| >50′ to ≤55′ | −102 | −133 | −143 |
| >55′ to ≤60′ | −104 | −135 | −146 |

**Table 11 — Hip, slope >4:12 to ≤6:12, Exposure D** — *see U6d: "(Overhang)" is struck through in this table's header only.*
| Roof Mean Height | Zone 1 | Zones 2e, 2r and 3 |
|---|---|---|
| ≤15′ | −65 | −90 |
| >15 to ≤20′ | −68 | −94 |
| >20′ to ≤25′ | −71 | −98 |
| >25′ to ≤30′ | −73 | −101 |
| >30 to ≤35′ | −75 | −104 |
| >35 to ≤40′ | −77 | −106 |
| >40′ to ≤45′ | −79 | −109 |
| >45′ to ≤50′ | −80 | −111 |
| >50′ to ≤55′ | −82 | −112 |
| >55′ to ≤60′ | −83 | −114 |

**Table 12 — Hip, slope >6:12 to ≤12:12, Exposure D**
| Roof Mean Height | Zone 1 | Zone 2e | Zone 2r | Zone 3 |
|---|---|---|---|---|
| ≤15′ | −69 | −119 | −123 | −156 |
| >15 to ≤20′ | −73 | −124 | −129 | −163 |
| >20′ to ≤25′ | −75 | −129 | −133 | −169 |
| >25′ to ≤30′ | −78 | −134 | −138 | −175 |
| >30 to ≤35′ | −80 | −137 | −142 | −180 |
| >35 to ≤40′ | −82 | −141 | −145 | −184 |
| >40′ to ≤45′ | −84 | −143 | −148 | −188 |
| >45′ to ≤50′ | −85 | −146 | −151 | −192 |
| >50′ to ≤55′ | −87 | −149 | −154 | −195 |
| >55′ to ≤60′ | −88 | −151 | −156 | −198 |

**Table 13 — Where to Obtain Information (RAS 127-20)**
| Description | Symbol | Where to find |
|---|---|---|
| Roof Zone Design Pressure | Pasd(1), Pasd(2), Pasd(3) | Tables 1-3, or Tables 4-6, Tables 7-9 or Tables 10-12, as applicable, or by an engineer analysis prepared, signed and sealed by a professional engineer based on ASCE 7 |
| Mean Roof Height | H | Job Site |
| Roof Slope | θ | Job Site |
| Aerodynamic Multiplier | λ | Product Approval |
| Restoring Moment due to Gravity | Mg | Product Approval |
| Attachment Resistance | Mf | Product Approval |
| Required Moment Resistance | Mr | Calculated |
| Minimum Characteristic Resistance Load | F' | Product Approval |
| Required Uplift Resistance | Fr | Calculated |
| Average Tile Weight | W | Product Approval |
| Tile Dimensions | l = length, w = width | Product Approval |

**Roof zone geometry** (FRSA/TRI 7th Ed. Figures 1.0/2.0, ASCE 7-22 based): `a` = 10% of the width or 40% of the height, whichever is smaller, but **not less than 3 ft**; the width (dimension `B`) **shall not include the overhang**; `h` = mean roof height = (eave height + ridge height)/2 ([FRSA/TRI 7th Ed.](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf)).

---

## Appendix B — Recommended calculator architecture

1. **Two separate calculators, never blended.**
   - *RAS 127 Method 1 (HVHZ):* inputs = roof form (gable/hip), Exposure (C/D), slope band, mean roof height band → look up `Pasd` per zone from Appendix A; inputs λ, Mg, Mf from NOA (with batten/direct-deck and slope selectors) → `Mr = |Pasd|·λ − Mg`; PASS if `Mf ≥ Mr` for every zone.
   - *FBC §1609.6.3 / FRSA-TRI (non-HVHZ):* `Ma = qh·[Kd?]·CL·b·L·La·(1 − GCp)` with `CL = 0.2`, `La = 0.76L`, `qh` from ASCE 7-22, `GCp` from ASCE 7-22 Ch. 30 figures. Prefer the FRSA Table 2 series scaled by `TF/1.407`.
2. **Hard-block, don't extrapolate**, outside the RAS 127 no-seal envelope (Exposure B, Risk Cat ≠ II, h > 60 ft, slope <2:12 or >12:12, non-gable/hip, no overhang, V > 175 mph). Emit: "requires signed and sealed engineering analysis by a Florida PE or RA per RAS 127-20 §1."
3. **Never compute λ, Mg, Mf, or F' silently.** Require NOA entry; make the NOA number and its expiration date mandatory fields, printed on the output. Offer `λ = 0.156·b·l²` / `0.144·b·l²` only as a labeled fallback.
4. **Show the arithmetic** in exactly the permit-form layout (`(Zone n: P × λ = X) − Mg = Mr_n ≤ NOA Mf`) so the output can be transcribed into Section E.
5. **Disclaim.** Output should state the code edition (FBC 8th Ed. 2023 / ASCE 7-22 / RAS 127-20), that values must be verified against the current NOA and the printed code, and that anything outside the table envelope requires a Florida PE seal. Flag the `Kd` ambiguity (U2) prominently to any engineer user.
6. **Do not implement Method 2** (Broward simplified) — see U5.

---

## Source list (all fetched this session)

- [RAS 127-20 full text and Tables 1–13 — floridabuilding.org](http://www.floridabuilding.org/fbc/thecode/2020_Code_Development/February2020Workshop/Attachments/Structural/Attachment%20comment-1-c-RAS%20127.pdf)
- [Miami-Dade HVHZ Uniform Roofing Application Form, FBC 8th Ed. (2023)](https://www.miamidade.gov/permits/library/roofing-permit.pdf)
- [Miami-Dade Roof Section D — Tile Roof](https://www.miamidade.gov/permits/library/roof-section-d-tile-roof.pdf)
- [Miami-Dade NOA 24-1008.09 — Eagle Roofing, Medium Profile Concrete Tile](https://www.miamidade.gov/building/library/productcontrol/noa/24100809.pdf)
- [Filed Method 1 worked example — Miami Lakes eTRAKiT](https://trakit.miamilakes-fl.gov/etrakit/viewAttachment.aspx?Group=PERMIT&ActivityNo=RWR2020-1913&key=EPR:2006011122478)
- [FRSA/TRI Florida High Wind Concrete and Clay Tile Installation Manual, 7th Ed. (12/31/23)](https://eagleroofing.com/wp-content/uploads/2024/01/FRSA-TRI_Florida_High_Wind_Tile_Installation_Manual_7th_Edition_R1.pdf)
- [FRSA — Tile Changes in the 2026 Ninth Edition FBC](https://www.floridaroof.com/2026-Tile-Code-Update)
- [UpCodes — 2023 FBC-Building Chapter 16 (§1609.6.3, Eq. 16-18)](https://up.codes/viewer/florida/fl-building-code-2023/chapter/16/structural-design)
- [Florida Building Commission — §1609 reference material (Aug 2024)](https://www.floridabuilding.org/fbc/commission/FBC_0824/Commission_Education_POC/836/836-2-REFERMAT.pdf)
- [FBC-B HVHZ Chapter 15 — §1518.8.5/.6, §1523.6.5.2, Section E](https://www.floridabuilding.org/fbc/thecode/2013_Code_Development/HVHZ/FBCB/Chapter_15_2010.htm)
- [UpCodes — Clay and Concrete Roof Tile (λ formulas)](https://up.codes/s/clay-and-concrete-roof-tile)
- [UpCodes — §1523.6.5.2 Clay and Cement Roof Tiles](https://up.codes/s/clay-and-cement-roof-tiles)
- [UpCodes — Section E (Tile Calculations), Methods 1/2/3](https://up.codes/s/tile-calculations)
- [UpCodes — HVHZ Testing (§1523.6.5.2.2)](https://up.codes/s/high-velocity-hurricane-zones-testing)
- [UpCodes — TAS 106 full text](https://up.codes/viewer/florida/fl-test-protocols-2020/chapter/testing_app_std_106_/testing-application-standard-tas-no-106-standard-procedure-for-field-verificatio)
- [TAS 108-95 — aerodynamic multiplier derivation](http://www.ecodes.biz/ecodes_support/free_resources/2010Florida/TestProtocols/PDFs/Testing%20Application%20Standard%20No_108-95.pdf)
- [FL6021 R1 — ATL of South Florida, Mg and λ calculations](https://www.floridabuilding.org/upload/PR_Tech_Docs/FL6021_R1_TR_Spanish%20-%20Restoring%20Moment%20%20Aerodynamic%20Multipl.pdf)
- [ICC Digital Codes — RAS 127-20 in FLTP2023P1](https://codes.iccsafe.org/content/FLTP2023P1/roofing-application-standard-ras-no-127-20-procedure-for-determining-the-moment-of-resistance-and-minimum-characteristic-resistance-load-to-install-a-tile-system-on-a-building-of-a-specified-roof-slope-and-height-using-allowable-stress-design-asd-in-accordance-with-asce-7)
- [NRCA / Professional Roofing — A revised approach to wind load calculations (ASCE 7-22)](https://www.professionalroofing.net/Articles/A-revised-approach-to-wind-load-calculations--05-01-2023/5225)
- [SEAU / S.K. Ghosh Associates — ASCE 7-22 updates (α, zg, 2.41)](https://seau.org/images/meeting/022024/seau_2024_asce_7_22_updates.pdf)
- [TRI ESR-2015P — La = 0.76L worked example](https://www.eagleroofing.com/wp-content/uploads/2015/04/esr-2015p.pdf)
- [Broward County BORA — Uniform Roofing Application (6th Ed., legacy Method 2)](https://www.broward.org/CodeAppeals/AboutUs/Documents/6th%20Edition%20(2017)%20Uniform%20Roofing%20Application.pdf)
- [Bal Harbour Village roofing permit package (5-zone Section E variant)](https://balharbourfl.gov/wp-content/uploads/2022/08/ROOFING-PERMIT-PACKAGE-2020.pdf)
- [Pembroke Park Roofing Application Checklist (FBC 2023 8th Ed.)](https://www.tppfl.gov/DocumentCenter/View/970/ROOFING-APPLICATION-CHECKLIST)
- [Highland Beach — TAS 106 field uplift test policy (2026)](https://highlandbeach.us/DocumentCenter/View/955/Roof-Tile-Uplift-Test-Requirement-PDF)
