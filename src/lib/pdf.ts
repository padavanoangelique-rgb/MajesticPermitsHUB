import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";

const NAVY = rgb(11 / 255, 31 / 255, 63 / 255);
const INK = rgb(20 / 255, 30 / 255, 55 / 255);
const MUTED = rgb(90 / 255, 100 / 255, 120 / 255);
const RULE = rgb(220 / 255, 225 / 255, 235 / 255);


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
  /** The job's status as one line of text, for the list. */
  status_text?: string | null;
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

/** 12/1/26: short enough to stay on one line in a narrow column. Date-only values are read as written, with no time zone. */
function shortDate(iso?: string | null): string {
  if (!iso) return "";
  const plain = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (plain) return `${Number(plain[2])}/${Number(plain[3])}/${plain[1].slice(2)}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}`;
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

// ---------- The job list ----------
//
// One flat list, one row per job. The status is a column, not a heading. The page is condensed to fit one sheet when
// it can (the type shrinks a little), and when a list is longer than a sheet it runs on to the next with its column
// headings repeated and no row split across a page. A box at the start of each row is for ticking the job off.

const MARGIN = 36;
const FOOTER_H = 22;
const TITLE_H = 40;
const HEAD_H = 15;
const MAX_SIZE = 9;
const MIN_FIT_SIZE = 7;
const PAGINATED_SIZE = 8;

export interface ListColumn {
  key: keyof JobRow | "index" | "box";
  label: string;
  width: number;
}

export interface JobListOptions {
  title: string;
  subtitle: string;
  columns: ListColumn[];
  rows: JobRow[];
  landscape?: boolean;
  emptyText?: string;
  /** A heavier line is drawn where this value changes from one row to the next (the jurisdiction, for the admin list). */
  groupBy?: keyof JobRow;
}

type Measured = { cells: string[][]; height: number };

function measureRows(opts: JobListOptions, font: PDFFont, size: number): Measured[] {
  const pad = 4;
  const leading = size + 1.5;
  return opts.rows.map((row, index) => {
    const cells = opts.columns.map((column) => {
      if (column.key === "box") return [""];
      if (column.key === "index") return [String(index + 1)];
      const value = row[column.key];
      const text = value == null || value === "" ? "-" : String(value);
      return wrapText(text, font, size, column.width - pad * 2);
    });
    const lines = Math.max(...cells.map((lines) => lines.length));
    return { cells, height: lines * leading + 5 };
  });
}

/** The biggest type size (down to a readable minimum) at which the whole list fits on one sheet, or null. */
function sizeThatFits(opts: JobListOptions, font: PDFFont, available: number): number | null {
  for (let size = MAX_SIZE; size >= MIN_FIT_SIZE - 0.001; size -= 0.5) {
    const total = measureRows(opts, font, size).reduce((sum, row) => sum + row.height, 0);
    if (total <= available) return size;
  }
  return null;
}

export async function buildJobListPdf(opts: JobListOptions): Promise<Uint8Array> {
  const pageW = opts.landscape ? 792 : 612;
  const pageH = opts.landscape ? 612 : 792;
  const tableW = pageW - MARGIN * 2;
  const columns = scaleColumns(opts.columns, tableW);
  const list: JobListOptions = { ...opts, columns };

  const pdf = await PDFDocument.create();
  pdf.setTitle(opts.title);
  pdf.setAuthor("Majestic Permits");
  pdf.setCreator("MajesticPermitsHUB");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const firstTop = pageH - MARGIN - TITLE_H;
  const bottom = MARGIN + FOOTER_H;
  const onePage = firstTop - HEAD_H - 6 - bottom;
  const fitted = sizeThatFits(list, font, onePage);
  const size = fitted ?? PAGINATED_SIZE;
  const measured = measureRows(list, font, size);

  let page = pdf.addPage([pageW, pageH]);
  let y = pageH - MARGIN;

  // Title: text on white, so it prints light.
  page.drawText(sanitize(opts.title), { x: MARGIN, y: y - 14, size: 15, font: bold, color: NAVY });
  page.drawText(sanitize(opts.subtitle), { x: MARGIN, y: y - 28, size: 8.5, font, color: MUTED });
  page.drawLine({ start: { x: MARGIN, y: y - 36 }, end: { x: pageW - MARGIN, y: y - 36 }, thickness: 1.2, color: NAVY });
  y -= TITLE_H;

  const drawColumnHeads = () => {
    page.drawRectangle({ x: MARGIN, y: y - HEAD_H + 3, width: tableW, height: HEAD_H, color: rgb(0.93, 0.94, 0.96) });
    let x = MARGIN;
    for (const column of columns) {
      if (column.key !== "box") page.drawText(sanitize(column.label), { x: x + 4, y: y - 8, size: 7.5, font: bold, color: NAVY });
      x += column.width;
    }
    y -= HEAD_H + 3;
  };
  drawColumnHeads();

  if (!measured.length) {
    page.drawText(sanitize(opts.emptyText || "Nothing to list."), { x: MARGIN + 4, y: y - 14, size: 10, font: bold, color: NAVY });
  }

  measured.forEach((row, rowIndex) => {
    if (y - row.height < bottom) {
      page = pdf.addPage([pageW, pageH]);
      y = pageH - MARGIN;
      drawColumnHeads();
    }
    let x = MARGIN;
    columns.forEach((column, columnIndex) => {
      if (column.key === "box") {
        page.drawRectangle({ x: x + 4, y: y - size - 1.5, width: size, height: size, borderColor: INK, borderWidth: 0.7 });
      } else {
        let lineY = y - size - 0.5;
        for (const line of row.cells[columnIndex]) {
          page.drawText(sanitize(line), { x: x + 4, y: lineY, size, font, color: INK });
          lineY -= size + 1.5;
        }
      }
      x += column.width;
    });
    const group = opts.groupBy;
    const lastOfGroup = !!group && rowIndex < opts.rows.length - 1 && String(opts.rows[rowIndex][group] || "").trim().toLowerCase() !== String(opts.rows[rowIndex + 1][group] || "").trim().toLowerCase();
    page.drawLine({
      start: { x: MARGIN, y: y - row.height + 2 },
      end: { x: pageW - MARGIN, y: y - row.height + 2 },
      thickness: lastOfGroup ? 1.1 : 0.4,
      color: lastOfGroup ? NAVY : RULE,
    });
    y -= row.height;
  });

  const pages = pdf.getPages();
  const stamp = fmtDate(new Date().toISOString());
  pages.forEach((p, i) => {
    p.drawText(sanitize(`Majestic Permits - Confidential - ${stamp}`), { x: MARGIN, y: MARGIN - 6, size: 7.5, font, color: MUTED });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: pageW - MARGIN - font.widthOfTextAtSize(label, 7.5), y: MARGIN - 6, size: 7.5, font, color: MUTED });
  });
  return pdf.save();
}

/** Stretch or shrink the columns to the sheet's width, keeping their proportions. */
function scaleColumns(columns: ListColumn[], width: number): ListColumn[] {
  const total = columns.reduce((sum, column) => sum + column.width, 0);
  return columns.map((column) => ({ ...column, width: (column.width / total) * width }));
}

// ---------- The reports ----------

const todayLong = () =>
  new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** The contractor's weekly list: every open job, its status, and what is needed next. */
export async function buildContractorWeeklyPdf(opts: {
  contractorName: string;
  jobs: JobRow[];
}): Promise<Uint8Array> {
  const count = opts.jobs.length;
  return buildJobListPdf({
    title: "Weekly permit status",
    subtitle: `${opts.contractorName} - ${todayLong()} - ${count} open ${count === 1 ? "permit" : "permits"}`,
    columns: [
      { key: "box", label: "", width: 16 },
      { key: "index", label: "#", width: 20 },
      { key: "property_address", label: "Property", width: 170 },
      { key: "status_text", label: "Status", width: 120 },
      { key: "permit_number", label: "Permit #", width: 66 },
      { key: "next_step", label: "Next step", width: 126 },
      { key: "permit_eta", label: "ETA", width: 56 },
    ],
    rows: opts.jobs.map((job) => ({ ...job, status_text: job.status_text || job.sub_status || job.stage, permit_eta: shortDate(job.permit_eta) })),
    emptyText: "No open permits this week.",
  });
}

/** Majestic's list: the jobs in one flat list, landscape, status as a column, a box to tick each one off. */
export async function buildAdminListPdf(opts: {
  title: string;
  rows: JobRow[];
  nocCount: number;
}): Promise<Uint8Array> {
  const count = opts.rows.length;
  return buildJobListPdf({
    title: opts.title,
    subtitle: `${todayLong()} - ${count} ${count === 1 ? "job" : "jobs"}${opts.nocCount ? ` - ${opts.nocCount} NOC${opts.nocCount === 1 ? "" : "s"} to record` : ""}`,
    landscape: true,
    groupBy: "jurisdiction",
    columns: [
      { key: "box", label: "", width: 16 },
      { key: "index", label: "#", width: 20 },
      { key: "property_address", label: "Property", width: 150 },
      { key: "contractor_company", label: "Contractor", width: 84 },
      { key: "jurisdiction", label: "Jurisdiction", width: 104 },
      { key: "status_text", label: "Status", width: 124 },
      { key: "permit_number", label: "Permit #", width: 62 },
      { key: "next_step", label: "Next step", width: 110 },
      { key: "permit_eta", label: "ETA", width: 50 },
    ],
    rows: opts.rows.map((job) => ({ ...job, permit_eta: shortDate(job.permit_eta) })),
    emptyText: "No jobs match this report.",
  });
}
