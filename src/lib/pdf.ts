import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";

const NAVY = rgb(11 / 255, 31 / 255, 63 / 255);
const GOLD = rgb(201 / 255, 162 / 255, 75 / 255);
const INK = rgb(20 / 255, 30 / 255, 55 / 255);
const MUTED = rgb(90 / 255, 100 / 255, 120 / 255);
const RULE = rgb(220 / 255, 225 / 255, 235 / 255);
const ROW_ALT = rgb(248 / 255, 249 / 255, 252 / 255);

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

export interface JobRow {
  property_address: string;
  homeowner_name?: string | null;
  stage?: string | null;
  sub_status?: string | null;
  next_step?: string | null;
  permit_number?: string | null;
  permit_eta?: string | null;
  jurisdiction?: string | null;
  building_dept_url?: string | null;
  noc_status?: string | null;
  contractor_company?: string | null;
}

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

interface Ctx {
  pdf: PDFDocument;
  page: PDFPage;
  fonts: Fonts;
  y: number;
  title: string;
  subtitle: string;
  brand: "Majestic Permits" | "The Permit Closer";
}

/** Standard PDF fonts only support WinAnsi. Replace anything they can't encode. */
function sanitize(text: string): string {
  return text
    .replace(/[\u2014\u2013]/g, "-") // em/en dash
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes
    .replace(/[\u2026]/g, "...") // ellipsis
    .replace(/[\u2192\u2197\u2198\u2199\u2190]/g, "->") // arrows
    .replace(/[\u00B7]/g, "·") // middot is WinAnsi-safe
    .replace(/[^\x00-\xFF]/g, "?"); // catch-all
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [""];
  text = sanitize(text);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (current) lines.push(current);
      // Word alone longer than the column: hard-slice it
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = "";
        for (const ch of word) {
          if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
            if (chunk) lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawHeader(ctx: Ctx) {
  const { page, fonts } = ctx;
  // Navy bar
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 90,
    width: PAGE_W,
    height: 90,
    color: NAVY,
  });
  // Gold accent stripe
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 96,
    width: PAGE_W,
    height: 4,
    color: GOLD,
  });

  page.drawText(sanitize(ctx.brand), {
    x: MARGIN,
    y: PAGE_H - 42,
    size: 20,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(sanitize(ctx.title), {
    x: MARGIN,
    y: PAGE_H - 62,
    size: 12,
    font: fonts.regular,
    color: GOLD,
  });
  page.drawText(sanitize(ctx.subtitle), {
    x: MARGIN,
    y: PAGE_H - 78,
    size: 9,
    font: fonts.regular,
    color: rgb(0.85, 0.87, 0.93),
  });

  ctx.y = PAGE_H - 96 - 28;
}

function drawFooter(ctx: Ctx, pageNum: number, totalPages: number) {
  const { page, fonts } = ctx;
  page.drawText(
    sanitize(
      `Majestic Permits · Confidential · Generated ${fmtDate(new Date().toISOString())}`
    ),
    {
      x: MARGIN,
      y: 24,
      size: 8,
      font: fonts.regular,
      color: MUTED,
    }
  );
  const pageLabel = `Page ${pageNum} of ${totalPages}`;
  const w = fonts.regular.widthOfTextAtSize(pageLabel, 8);
  page.drawText(pageLabel, {
    x: PAGE_W - MARGIN - w,
    y: 24,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
}

function ensureRoom(ctx: Ctx, needed: number) {
  if (ctx.y - needed >= MARGIN + 40) return;
  ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
  drawHeader(ctx);
}

function drawSectionTitle(ctx: Ctx, title: string, count: number) {
  ensureRoom(ctx, 40);
  const safeTitle = sanitize(title);
  ctx.page.drawText(safeTitle, {
    x: MARGIN,
    y: ctx.y,
    size: 13,
    font: ctx.fonts.bold,
    color: NAVY,
  });
  const badge = `${count} ${count === 1 ? "permit" : "permits"}`;
  const bw = ctx.fonts.regular.widthOfTextAtSize(badge, 9);
  ctx.page.drawRectangle({
    x: MARGIN + ctx.fonts.bold.widthOfTextAtSize(safeTitle, 13) + 10,
    y: ctx.y - 3,
    width: bw + 12,
    height: 16,
    color: rgb(0.94, 0.96, 1),
  });
  ctx.page.drawText(badge, {
    x: MARGIN + ctx.fonts.bold.widthOfTextAtSize(safeTitle, 13) + 16,
    y: ctx.y + 1,
    size: 9,
    font: ctx.fonts.regular,
    color: NAVY,
  });
  ctx.y -= 12;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 1,
    color: GOLD,
  });
  ctx.y -= 14;
}

interface Column {
  key: keyof JobRow | "index";
  label: string;
  width: number;
  isLink?: (row: JobRow) => string | null;
}

function drawTable(ctx: Ctx, columns: Column[], rows: JobRow[]) {
  const size = 9;
  const headerH = 20;
  const pad = 6;

  // Column headers
  ensureRoom(ctx, headerH + 30);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - headerH + 5,
    width: CONTENT_W,
    height: headerH,
    color: NAVY,
  });
  let x = MARGIN;
  for (const col of columns) {
    ctx.page.drawText(sanitize(col.label), {
      x: x + pad,
      y: ctx.y - 10,
      size: 9,
      font: ctx.fonts.bold,
      color: rgb(1, 1, 1),
    });
    x += col.width;
  }
  ctx.y -= headerH + 4;

  // Rows
  rows.forEach((row, idx) => {
    // Compute wrapped lines per column so we know the row height
    const perColLines: string[][] = columns.map((col) => {
      // For link cells we only show the clickable label, not the raw URL.
      if (col.isLink) return [""];
      let text = "";
      if (col.key === "index") text = String(idx + 1);
      else {
        const v = row[col.key];
        text = v == null || v === "" ? "-" : String(v);
      }
      return wrapText(text, ctx.fonts.regular, size, col.width - pad * 2);
    });
    const rowLines = Math.max(...perColLines.map((l) => l.length));
    const rowH = Math.max(22, rowLines * (size + 3) + pad * 2 - 4);

    ensureRoom(ctx, rowH + 6);

    // Zebra
    if (idx % 2 === 0) {
      ctx.page.drawRectangle({
        x: MARGIN,
        y: ctx.y - rowH + 4,
        width: CONTENT_W,
        height: rowH,
        color: ROW_ALT,
      });
    }

    // Cell contents
    let cx = MARGIN;
    columns.forEach((col, colIdx) => {
      const lines = perColLines[colIdx];
      let ly = ctx.y - 4;
      lines.forEach((line) => {
        ctx.page.drawText(sanitize(line), {
          x: cx + pad,
          y: ly,
          size,
          font: ctx.fonts.regular,
          color: INK,
        });
        ly -= size + 3;
      });

      // Building-dept link cell: render just a clickable label, no wrapped URL.
      if (col.isLink) {
        const href = col.isLink(row);
        if (href) {
          const label = "Open portal ->";
          const labelY = ctx.y - 4 - Math.floor(rowH / 3);
          ctx.page.drawText(label, {
            x: cx + pad,
            y: labelY,
            size,
            font: ctx.fonts.bold,
            color: GOLD,
          });
          const linkY = labelY;
          const linkW = ctx.fonts.bold.widthOfTextAtSize(label, size);
          ctx.page.node.addAnnot(
            ctx.pdf.context.register(
              ctx.pdf.context.obj({
                Type: "Annot",
                Subtype: "Link",
                Rect: [cx + pad, linkY - 2, cx + pad + linkW, linkY + size + 2],
                Border: [0, 0, 0],
                A: {
                  Type: "Action",
                  S: "URI",
                  URI: href,
                },
              })
            )
          );
        }
      }
      cx += col.width;
    });

    // Row divider
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y - rowH + 4 },
      end: { x: PAGE_W - MARGIN, y: ctx.y - rowH + 4 },
      thickness: 0.5,
      color: RULE,
    });

    ctx.y -= rowH;
  });

  ctx.y -= 12;
}

async function newDoc(
  title: string,
  subtitle: string,
  brand: "Majestic Permits" | "The Permit Closer" = "Majestic Permits"
): Promise<Ctx> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setAuthor("Majestic Permits");
  pdf.setCreator("MajesticPermitsHUB");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const ctx: Ctx = {
    pdf,
    page,
    fonts: { regular, bold },
    y: PAGE_H - MARGIN,
    title,
    subtitle,
    brand,
  };
  drawHeader(ctx);
  return ctx;
}

async function finalize(ctx: Ctx): Promise<Uint8Array> {
  const pages = ctx.pdf.getPages();
  pages.forEach((p, i) => {
    // Reuse drawFooter using a temp ctx pointer
    const tempCtx: Ctx = { ...ctx, page: p };
    drawFooter(tempCtx, i + 1, pages.length);
  });
  return ctx.pdf.save();
}

// ---------- Contractor weekly PDF ----------

export async function buildContractorWeeklyPdf(opts: {
  contractorName: string;
  jobs: JobRow[];
}): Promise<Uint8Array> {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const ctx = await newDoc(
    "Weekly permit status",
    `${opts.contractorName} · ${today} · ${opts.jobs.length} open ${
      opts.jobs.length === 1 ? "permit" : "permits"
    }`
  );

  // Intro paragraph
  const intro = sanitize(
    "Here is where each of your open permits stands this week, and the specific next step required to keep it moving. Permits marked complete or closed have been excluded."
  );
  const lines = wrapText(intro, ctx.fonts.regular, 10, CONTENT_W);
  for (const line of lines) {
    ctx.page.drawText(line, {
      x: MARGIN,
      y: ctx.y,
      size: 10,
      font: ctx.fonts.regular,
      color: INK,
    });
    ctx.y -= 14;
  }
  ctx.y -= 8;

  if (opts.jobs.length === 0) {
    ctx.page.drawText(sanitize("No open permits this week. Have a great one."), {
      x: MARGIN,
      y: ctx.y,
      size: 11,
      font: ctx.fonts.bold,
      color: NAVY,
    });
  } else {
    const columns: Column[] = [
      { key: "index", label: "#", width: 24 },
      { key: "property_address", label: "Property", width: 150 },
      { key: "stage", label: "Stage", width: 90 },
      { key: "sub_status", label: "Sub-status", width: 70 },
      { key: "next_step", label: "Next step required", width: 130 },
      { key: "permit_eta", label: "ETA", width: 52 },
    ];
    const rows = opts.jobs.map((j) => ({
      ...j,
      permit_eta: fmtDate(j.permit_eta || null),
    }));
    drawTable(ctx, columns, rows);
  }

  return finalize(ctx);
}

// ---------- Admin weekly PDF ----------

export async function buildAdminWeeklyPdf(opts: {
  jobsByStage: Record<string, JobRow[]>;
  stageOrder: string[];
  totalOpen: number;
  nocsToRecord: JobRow[];
}): Promise<Uint8Array> {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const ctx = await newDoc(
    "Admin operations report",
    `${today} · ${opts.totalOpen} open ${
      opts.totalOpen === 1 ? "permit" : "permits"
    } · ${opts.nocsToRecord.length} NOC${
      opts.nocsToRecord.length === 1 ? "" : "s"
    } needing attention`
  );

  // Summary block
  const boxes = [
    {
      label: "Open permits",
      value: String(opts.totalOpen),
    },
    {
      label: "NOCs pending/submitted",
      value: String(opts.nocsToRecord.length),
    },
    {
      label: "Stages tracked",
      value: String(Object.keys(opts.jobsByStage).length),
    },
  ];
  const boxW = (CONTENT_W - 24) / 3;
  boxes.forEach((b, i) => {
    const x = MARGIN + i * (boxW + 12);
    ctx.page.drawRectangle({
      x,
      y: ctx.y - 54,
      width: boxW,
      height: 54,
      color: rgb(0.97, 0.98, 1),
      borderColor: RULE,
      borderWidth: 1,
    });
    ctx.page.drawText(b.value, {
      x: x + 12,
      y: ctx.y - 26,
      size: 20,
      font: ctx.fonts.bold,
      color: NAVY,
    });
    ctx.page.drawText(b.label, {
      x: x + 12,
      y: ctx.y - 44,
      size: 9,
      font: ctx.fonts.regular,
      color: MUTED,
    });
  });
  ctx.y -= 70;

  // NOC section (always show even when empty)
  drawSectionTitle(ctx, "NOCs needing attention", opts.nocsToRecord.length);
  if (opts.nocsToRecord.length === 0) {
    ctx.page.drawText(sanitize("Nothing outstanding. NOCs are current."), {
      x: MARGIN,
      y: ctx.y,
      size: 10,
      font: ctx.fonts.regular,
      color: MUTED,
    });
    ctx.y -= 20;
  } else {
    const columns: Column[] = [
      { key: "property_address", label: "Property", width: 170 },
      { key: "contractor_company", label: "Contractor", width: 110 },
      { key: "noc_status", label: "NOC status", width: 80 },
      { key: "jurisdiction", label: "Jurisdiction", width: 90 },
      {
        key: "building_dept_url",
        label: "Portal",
        width: 66,
        isLink: (r) => r.building_dept_url || null,
      },
    ];
    drawTable(ctx, columns, opts.nocsToRecord);
  }

  // Per-stage sections
  for (const stage of opts.stageOrder) {
    const list = opts.jobsByStage[stage] || [];
    if (list.length === 0) continue;
    drawSectionTitle(ctx, stage, list.length);
    const columns: Column[] = [
      { key: "index", label: "#", width: 22 },
      { key: "property_address", label: "Property", width: 140 },
      { key: "contractor_company", label: "Contractor", width: 90 },
      { key: "sub_status", label: "Sub-status", width: 65 },
      { key: "next_step", label: "Next step", width: 110 },
      { key: "permit_eta", label: "ETA", width: 45 },
      {
        key: "building_dept_url",
        label: "Portal",
        width: 44,
        isLink: (r) => r.building_dept_url || null,
      },
    ];
    const rows = list.map((j) => ({ ...j, permit_eta: fmtDate(j.permit_eta || null) }));
    drawTable(ctx, columns, rows);
  }

  return finalize(ctx);
}
