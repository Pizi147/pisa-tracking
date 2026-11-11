import { strToU8, zipSync } from 'fflate';

/**
 * EXCEL ĐỊNH DẠNG SẴN (Phân tích V2 · PR-5, chủ SP 12/11: "bản đẹp, dễ nhìn, dùng được luôn"): tự ghi OOXML gọn bằng `fflate` (đã có trong gói).
 * Thư viện `xlsx` bản cộng đồng (0.18.5) KHÔNG ghi được in đậm / nền / màu chữ / cố định hàng — nên không dùng nó cho 4 báo cáo này
 * (các nút xuất cũ vẫn dùng `xlsx`, giữ nguyên).
 * Mỗi sheet: dòng 1 tên báo cáo (đậm 14) · dòng 2 mô tả (chi nhánh · chương trình · khoảng tuần · dữ liệu đến) · dòng trống · tiêu đề bảng
 * (1–2 hàng, đậm, nền nhạt, ô nhóm gộp) · thân. Cố định tới hết tiêu đề bảng (+ cột đầu), lọc trên hàng tiêu đề cuối, độ rộng cột vừa chữ.
 * Số là số; % là số 0–1 với định dạng `0%`. Chữ luôn là chuỗi (ô "=…" không thành công thức).
 */
export type MauXlsx = 'vuot' | 'dat' | 'chua-dat' | 'sos1' | 'sos2' | 'sos3' | 'mo' | 'nhan';
export type OXlsx = string | number | null | undefined | {
  v: string | number | null | undefined;
  /** 'pt' = số 0–1 hiện "85%"; 'ngay' = chuỗi ISO yyyy-mm-dd → ô ngày dd/mm/yyyy (sắp xếp được). Mặc định theo kiểu giá trị. */
  dang?: 'pt' | 'ngay';
  mau?: MauXlsx; dam?: boolean;
};
export type SheetDep = {
  ten: string;
  /** Hàng tiêu đề bảng (1 hoặc 2). Hàng nhóm: ô `null` sau một nhãn = gộp vào nhãn đó. */
  dau: (string | null)[][];
  hang: OXlsx[][];
  /** Chỉ số hàng (trong `hang`) là hàng tổng — đậm, nền nhạt. */
  tong?: number[];
  /** Cố định cột đầu (tên). Mặc định có. */
  coDinhCot?: boolean;
};

/* Màu như web, chế độ sáng (Excel nền trắng — `index.css` `--kq-*` / `--sosN-chu-rgb` / `--accent`): Vượt xanh lá · Đạt xanh · Chưa đạt đỏ · SOS vàng → cam → đỏ. */
const MAU: Record<MauXlsx, string> = { vuot: 'FF38674C', dat: 'FF273C8F', 'chua-dat': 'FFA63A2D', sos1: 'FF715C32', sos2: 'FF7C4316', sos3: 'FF8F3026', mo: 'FF6B7280', nhan: 'FF273C8F' };
const NEN_DAU = 'FFE8EEF7', NEN_TONG = 'FFF3F5F9', VIEN = 'FFC9D2E0';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const tenCot = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : tenCot(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));
const oRef = (c: number, r: number) => `${tenCot(c)}${r + 1}`;

/** Bảng kiểu ô (cellXfs): khoá = font|fill|numFmt|căn → chỉ số. */
class KieuO {
  private ds = new Map<string, number>();
  fonts = ['<font><sz val="11"/><name val="Calibri"/></font>'];
  private fontId = new Map<string, number>([['', 0]]);
  xfs: string[] = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'];
  constructor() { this.ds.set('||0|', 0); }
  private font(dam: boolean, mau: string, co: number) {
    const k = `${dam}|${mau}|${co}`;
    if (!this.fontId.has(k)) { this.fontId.set(k, this.fonts.length); this.fonts.push(`<font>${dam ? '<b/>' : ''}<sz val="${co}"/>${mau ? `<color rgb="${mau}"/>` : ''}<name val="Calibri"/></font>`); }
    return this.fontId.get(k)!;
  }
  /** fill: 0 không · 2 nền tiêu đề · 3 nền tổng. numFmt: 0 chung · 1 "0" · 9 "0%" · 164 "dd/mm/yyyy". */
  lay(o: { dam?: boolean; mau?: string; co?: number; fill?: 0 | 2 | 3; fmt?: 0 | 1 | 9 | 164; giua?: boolean; vien?: boolean; xuong?: boolean }) {
    const f = this.font(!!o.dam, o.mau ?? '', o.co ?? 11);
    const k = `${f}|${o.fill ?? 0}|${o.fmt ?? 0}|${o.giua ? 'g' : ''}${o.vien ? 'v' : ''}${o.xuong ? 'x' : ''}`;
    if (!this.ds.has(k)) {
      this.ds.set(k, this.xfs.length);
      const can = o.giua || o.xuong ? `<alignment${o.giua ? ' horizontal="center"' : ''} vertical="center"${o.xuong ? ' wrapText="1"' : ''}/>` : '';
      this.xfs.push(`<xf numFmtId="${o.fmt ?? 0}" fontId="${f}" fillId="${o.fill ?? 0}" borderId="${o.vien ? 1 : 0}"${o.fmt ? ' applyNumberFormat="1"' : ''} applyFont="1"${o.fill ? ' applyFill="1"' : ''}${o.vien ? ' applyBorder="1"' : ''}${can ? ' applyAlignment="1"' : ''}>${can}</xf>`);
    }
    return this.ds.get(k)!;
  }
  xml() {
    const fill = (rgb: string) => `<fill><patternFill patternType="solid"><fgColor rgb="${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
      + `<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>`
      + `<fonts count="${this.fonts.length}">${this.fonts.join('')}</fonts>`
      + `<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${fill(NEN_DAU)}${fill(NEN_TONG)}</fills>`
      + `<borders count="2"><border/><border><left/><right/><top/><bottom style="thin"><color rgb="${VIEN}"/></bottom><diagonal/></border></borders>`
      + `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
      + `<cellXfs count="${this.xfs.length}">${this.xfs.join('')}</cellXfs></styleSheet>`;
  }
}

/** Ngày ISO → số ngày Excel (gốc 30/12/1899). */
const soNgayExcel = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86_400_000; };
const giaTri = (o: OXlsx) => (o != null && typeof o === 'object' ? (o.dang === 'ngay' && typeof o.v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(o.v) ? soNgayExcel(o.v) : o.v) : o);
const doDai = (o: OXlsx) => { const v = giaTri(o); if (v == null) return 0; if (typeof o === 'object' && o?.dang) return o.dang === 'pt' ? 5 : 10; return String(v).length; };

function sheetXml(s: SheetDep, tieuDe: string, moTa: string, k: KieuO): string {
  const soCot = Math.max(...s.dau.map((h) => h.length), ...s.hang.map((h) => h.length), 1);
  const dong: string[] = [];
  const gop: string[] = [];
  const o = (c: number, r: number, v: string | number | null | undefined, xf: number) => {
    if (v == null || v === '') return xf ? `<c r="${oRef(c, r)}" s="${xf}"/>` : '';
    return typeof v === 'number' && Number.isFinite(v) ? `<c r="${oRef(c, r)}" s="${xf}"><v>${v}</v></c>`
      : `<c r="${oRef(c, r)}" s="${xf}" t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
  };
  dong.push(`<row r="1" ht="22" customHeight="1">${o(0, 0, tieuDe, k.lay({ dam: true, co: 14 }))}</row>`);
  dong.push(`<row r="2">${o(0, 1, moTa, k.lay({ mau: MAU.mo }))}</row>`);
  const r0 = 3;   // dòng 3 trống, tiêu đề bảng từ dòng 4 (chỉ số 3)
  const xfDau = k.lay({ dam: true, fill: 2, giua: true, vien: true, xuong: true });
  const xfDauTen = k.lay({ dam: true, fill: 2, vien: true, xuong: true });
  s.dau.forEach((h, i) => {
    const r = r0 + i;
    const cells: string[] = [];
    for (let c = 0; c < soCot; c++) {
      cells.push(o(c, r, h[c], c === 0 ? xfDauTen : xfDau));
      if (h[c] != null && i < s.dau.length - 1) {
        let e = c; while (e + 1 < soCot && h[e + 1] === null) e++;
        if (e > c) gop.push(`${oRef(c, r)}:${oRef(e, r)}`);
      }
    }
    dong.push(`<row r="${r + 1}" ht="${i === s.dau.length - 1 ? 30 : 20}" customHeight="1">${cells.join('')}</row>`);
  });
  /* Hàng nhóm: ô trống dưới nhãn nhóm của cột không thuộc nhóm (vd "Lớp") → gộp dọc 2 hàng. */
  if (s.dau.length === 2) for (let c = 0; c < soCot; c++) if (s.dau[0][c] && s.dau[1][c] == null) gop.push(`${oRef(c, r0)}:${oRef(c, r0 + 1)}`);
  const tong = new Set(s.tong ?? []);
  const rDau = r0 + s.dau.length;
  s.hang.forEach((h, i) => {
    const r = rDau + i;
    const laTong = tong.has(i);
    const cells = h.map((x, c) => {
      const v = giaTri(x);
      const ob = x != null && typeof x === 'object' ? x : null;
      const fmt = typeof v !== 'number' ? 0 : ob?.dang === 'pt' ? 9 : ob?.dang === 'ngay' ? 164 : Number.isInteger(v) ? 1 : 0;
      const xf = k.lay({ dam: laTong || ob?.dam, mau: ob?.mau ? MAU[ob.mau] : undefined, fill: laTong ? 3 : 0, fmt, giua: c > 0 && (typeof v === 'number' || v === '—') });
      return o(c, r, v, xf);
    });
    dong.push(`<row r="${r + 1}">${cells.join('')}</row>`);
  });
  const rong = Array.from({ length: soCot }, (_, c) => {
    /* Tiêu đề hàng cuối + 4 (nút lọc ▾); nhãn nhóm gộp không tính (chia cho các cột của nhóm). */
    const dau = String(s.dau[s.dau.length - 1][c] ?? (s.dau.length > 1 ? s.dau[0][c] ?? '' : '')).length + 4;
    const dai = Math.max(dau, ...s.hang.slice(0, 300).map((h) => doDai(h[c]) + 2));
    return `<col min="${c + 1}" max="${c + 1}" width="${Math.min(c === 0 ? 40 : 30, Math.max(c === 0 ? 16 : 9, dai))}" customWidth="1"/>`;
  });
  const coDinhCot = s.coDinhCot !== false;
  const pane = `<pane ${coDinhCot ? 'xSplit="1" ' : ''}ySplit="${rDau}" topLeftCell="${oRef(coDinhCot ? 1 : 0, rDau)}" activePane="${coDinhCot ? 'bottomRight' : 'bottomLeft'}" state="frozen"/>`;
  const cuoi = rDau + Math.max(s.hang.length, 1) - 1;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>`
    + `<cols>${rong.join('')}</cols><sheetData>${dong.join('')}</sheetData>`
    + (s.hang.length ? `<autoFilter ref="${oRef(0, rDau - 1)}:${oRef(soCot - 1, cuoi)}"/>` : '')
    + (gop.length ? `<mergeCells count="${gop.length}">${gop.map((g) => `<mergeCell ref="${g}"/>`).join('')}</mergeCells>` : '')
    + `<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
}

/** Tên sheet Excel: ≤ 31 ký tự, không : \ / ? * [ ], không trùng. */
const tenSheet = (ten: string, da: Set<string>) => {
  let x = ten.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31).trim() || 'Sheet';
  for (let i = 2; da.has(x.toLowerCase()); i++) x = `${x.slice(0, 28)} ${i}`;
  da.add(x.toLowerCase());
  return x;
};

/** Dựng tệp .xlsx (Uint8Array). `tieuDe` / `moTa` ghi đầu mọi sheet. */
export function dungXlsx(tieuDe: string, moTa: string, sheets: readonly SheetDep[]): Uint8Array {
  const k = new KieuO();
  const da = new Set<string>();
  const ten = sheets.map((s) => tenSheet(s.ten, da));
  const ws = sheets.map((s) => sheetXml(s, tieuDe, moTa, k));
  const f: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${ws.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${ten.map((x, i) => `<sheet name="${esc(x)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${ws.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${ws.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
  };
  ws.forEach((x, i) => { f[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(x); });
  f['xl/styles.xml'] = strToU8(k.xml());   // sau các sheet: KieuO đã đủ kiểu
  return zipSync(f, { level: 6 });
}
