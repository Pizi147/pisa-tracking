/**
 * DỰNG PDF BÁO CÁO PH (chủ SP 07/11: "BẮT CHƯỚC Y HỆT" hai mẫu Google Sheets — FT `CP Refire 01 … SPM.pdf`, lớp thường `… CP ELE 30.pdf`).
 * Thuần: nhận thư viện (`pdf-lib` + `@pdf-lib/fontkit`, nạp lười ở nơi gọi — `web/src/modules/classes/xuatPdfBaoCaoPh.ts`) + phông Quicksand
 * (`web/src/assets/quicksand`, OFL) + nội dung một em (`BaoCaoPdf`, máy chủ dựng) → byte PDF. Chạy được cả ở Node (phép kiểm `prBaoCaoPhPdf`).
 * KHÔNG xuất ở `index.ts` (chỉ nơi xuất PDF nạp).
 *
 * Bố cục như bảng tính: mọi kích thước đo bằng "px" của trang tính mẫu rồi nhân `s` (pt / px) theo kiểu — FT dọc A4 (s 0,4231, chữ 6,6 pt),
 * lớp thường ngang A4 (s 0,75, chữ 12 pt). Hàng cao = số dòng × bước dòng + 5 px (tối thiểu 21 px), chữ tự xuống dòng theo bề rộng cột.
 * Ngắt trang theo hàng (không cắt ngang một hàng); hàng tiêu đề (hồng / xanh) không đứng một mình cuối trang; khoảng trống giữa khối không mở đầu trang.
 * Chữ nghiêng: Quicksand không có bản nghiêng — mẫu nghiêng giả bằng ma trận chữ (FT 0,2, lớp thường 0,25) → làm y vậy.
 */
import type * as PdfLib from 'pdf-lib';
import type { BaoCaoPdf, MucBc } from './baoCaoPh.ts';

type Kieu = {
  trang: [number, number]; s: number; x0: number; y0: number; cot: number[]; co: number; buoc: number; buocHang: number; dem: number; le: number;
  nghieng: number; vienKhoang: boolean; nhanGiua: boolean; diemGiua: boolean; diemDo: boolean; khoangSauDau: number;
  dau: { cao: number; trai: number[]; tieuDe: number[]; tieuDeCot: [number, number]; hs: number; lop: number; tachNhan: boolean };
};
/* Số đo lấy từ hai tệp mẫu (pymupdf: khung ô, đường kẻ, toạ độ chữ, ma trận chữ) — xem mô tả PR BCPH-PDF (b). */
const FT: Kieu = {
  trang: [595, 842], s: 0.42312, x0: 50.4, y0: 53.6, cot: [452, 179, 179, 179, 179], co: 15.6, buoc: 19.5, buocHang: 19.2, dem: 5.6, le: 3,
  nghieng: 0.2, vienKhoang: false, nhanGiua: false, diemGiua: true, diemDo: true, khoangSauDau: 20,
  dau: { cao: 114, trai: [32.6, 52.1, 71.6], tieuDe: [18.7, 38.2], tieuDeCot: [1, 3], hs: 62.2, lop: 86, tachNhan: true },
};
const THUONG: Kieu = {
  trang: [842.88, 595.92], s: 0.75, x0: 52.1, y0: 53.2, cot: [486, 124, 124, 124, 124], co: 16, buoc: 19, buocHang: 19, dem: 5, le: 3.6,
  nghieng: 0.25, vienKhoang: true, nhanGiua: true, diemGiua: false, diemDo: false, khoangSauDau: 0,
  dau: { cao: 104, trai: [39, 58.1, 77.1], tieuDe: [29, 48], tieuDeCot: [1, 4], hs: 67, lop: 86, tachNhan: false },
};

const XANH: [number, number, number] = [0.16078, 0.22745, 0.56863];
const HONG: [number, number, number] = [0.94902, 0.35294, 0.59608];
const KE: [number, number, number] = [0.71765, 0.71765, 0.71765];
const XAM_O: [number, number, number] = [0.50196, 0.50196, 0.50196];
const MUC: MucBc[] = ['xuat_sac', 'tot', 'kha', 'yeu'];
const MUC_VI = ['Xuất sắc', 'Tốt', 'Khá', 'Yếu'];
const MUC_EN = ['Outstanding', 'Good', 'Sound', 'Basic'];
/** Tiêu đề khối kỹ năng như mẫu (VN / EN); lớp thường W = "PREP - WRITING TASK" một dòng. */
const TEN_PHAN: Record<string, [string, string | null]> = {
  L: ['NGHE', 'LISTENING'], R: ['ĐỌC', 'READING'], W1: ['VIẾT 1', 'WRITING 1'], W2: ['VIẾT 2', 'WRITING 2'],
  W: ['PREP - WRITING TASK', null], S: ['NÓI', 'SPEAKING'], P: ['PHÁT ÂM', 'PRONUNCIATION'],
};
/** Hai nhóm phần chung: chữ in hoa như mẫu (dữ liệu tiêu chí giữ chữ thường cho web). */
const NHOM_CHUNG: [string, string][] = [['I. TRÁCH NHIỆM HỌC TẬP CỦA HỌC VIÊN', 'LEARNING PROFILE'], ['II THÁI ĐỘ HỌC TẬP', 'LEARNING ATTITUDE']];

type Chu = { t: string; b?: boolean; i?: boolean; do?: boolean };
type Doan = Chu[];
type O = {
  tu: number; den: number; doan?: Doan[]; trang?: boolean; ngang?: 'trai' | 'giua'; doc?: 'tren' | 'giua' | 'duoi'; tick?: boolean | null;
  /** Chữ thứ hai cùng dòng, bắt đầu ở cột `cot` (mẫu: tên GV đặt ở cột sau nhãn, không kẻ vạch giữa). */
  them?: { cot: number; chu: Chu };
  /** Dòng đã ngắt sẵn (phần sau của một hàng quá cao bị chia qua trang). */
  dong?: Doan[];
};
/** `giu`: không đứng một mình cuối trang (đi cùng ≥ 3 dòng đầu hàng sau) · `kem`: đi liền n hàng sau (bảng tiêu chí không cắt ngang). */
type Hang = { o: O[]; nen?: [number, number, number]; vien: boolean; khoang?: boolean; giu?: boolean; kem?: number; cao?: number };

export async function dungPdfBaoCao(lib: typeof PdfLib, fontkit: unknown, phong: { r: Uint8Array; b: Uint8Array }, bc: BaoCaoPdf): Promise<Uint8Array> {
  const k = bc.ft ? FT : THUONG;
  const pdf = await lib.PDFDocument.create();
  pdf.registerFontkit(fontkit as any);
  const fR = await pdf.embedFont(phong.r, { subset: true });
  const fB = await pdf.embedFont(phong.b, { subset: true });
  pdf.setTitle(`${bc.lop} - ${bc.hocVien}`);
  pdf.setCreator('PISA Tracking');
  const co = k.co * k.s;
  const rong = (c: Chu) => (c.b ? fB : fR).widthOfTextAtSize(c.t, co);
  const xCot = (i: number) => k.x0 + k.cot.slice(0, i).reduce((a, b) => a + b, 0) * k.s;

  /** Ngắt dòng một đoạn (nhiều kiểu chữ) theo bề rộng px; trả các dòng. Từ dài hơn cả dòng: cắt theo ký tự. */
  function ngat(d: Doan, rongPx: number): Doan[] {
    const toiDa = (rongPx - 2 * k.le - 2) * k.s;
    const dong: Doan[] = [];
    let cur: Doan = []; let w = 0;
    const day = () => { dong.push(cur); cur = []; w = 0; };
    for (const c of d) {
      for (const phan of c.t.split(/(\s+)/)) {
        if (!phan) continue;
        if (/^\s+$/.test(phan)) {
          if (phan.includes('\n')) { day(); continue; }
          if (cur.length) { const sp = { ...c, t: ' ' }; cur.push(sp); w += rong(sp); }
          continue;
        }
        let tu = { ...c, t: phan };
        while (rong(tu) > toiDa) {   // từ quá dài: cắt
          let n = tu.t.length;
          while (n > 1 && rong({ ...tu, t: tu.t.slice(0, n) }) > toiDa - (cur.length ? w : 0)) n--;
          if (cur.length && n <= 1) { day(); continue; }
          cur.push({ ...tu, t: tu.t.slice(0, n) }); day(); tu = { ...tu, t: tu.t.slice(n) };
        }
        if (cur.length && w + rong(tu) > toiDa) {
          while (cur.length && /^\s+$/.test(cur[cur.length - 1].t)) cur.pop();
          day();
        }
        cur.push(tu); w += rong(tu);
      }
    }
    while (cur.length && /^\s+$/.test(cur[cur.length - 1].t)) cur.pop();
    if (cur.length || !dong.length) dong.push(cur);
    return dong;
  }
  const rongO = (o: O) => k.cot.slice(o.tu, o.den + 1).reduce((a, b) => a + b, 0);
  const dongO = (o: O) => o.dong ?? (o.doan ?? []).flatMap((d) => ngat(d, rongO(o)));
  const caoHang = (h: Hang) => h.cao ?? Math.max(21, Math.max(1, ...h.o.map((o) => dongO(o).length)) * k.buocHang + k.dem);

  /* ---------------- dựng các hàng ---------------- */
  const hang: Hang[] = [];
  const tieuDe = (vi: string, en: string | null): Doan[] => [[{ t: vi, b: true }], ...(en ? [[{ t: en, b: true, i: true }]] : [])];
  const oMuc = (): O[] => MUC.map((_, i) => ({ tu: i + 1, den: i + 1, ngang: 'giua', doc: 'giua', trang: true, doan: [[{ t: MUC_VI[i], b: true }], [{ t: MUC_EN[i], b: true, i: true }]] }));
  const tick = (muc: MucBc | null): O[] => MUC.map((m, i) => ({ tu: i + 1, den: i + 1, tick: muc === m }));
  const khoang = () => { for (let i = 0; i < 2; i++) hang.push({ o: [{ tu: 0, den: 0 }, ...MUC.map((_, j) => ({ tu: j + 1, den: j + 1 }))], vien: k.vienKhoang, khoang: true, cao: 21 }); };
  const nhanChu = (vi: string, en: string): Doan => [{ t: `${vi} `, b: true }, { t: `(${en})`, b: true, i: true }, { t: ':', b: true }];
  const nhan = (d: Doan): O => ({ tu: 0, den: 0, doan: [d], doc: k.nhanGiua ? 'giua' : 'duoi' });
  const gvHang = (vi: string, en: string | null, gv: string, nhanGv: Doan): Hang => ({
    nen: HONG, vien: true, giu: true, kem: 2,
    o: [{ tu: 0, den: 0, trang: true, doan: tieuDe(vi, en), doc: 'giua' },
      ...(k.dau.tachNhan
        ? [{ tu: 1, den: 4, trang: true, doan: [nhanGv], doc: 'giua' as const, them: { cot: 2, chu: { t: gv, b: true } } }]
        : [{ tu: 1, den: 4, trang: true, doan: [[...nhanGv, { t: ` ${gv}`, b: true }]], doc: 'giua' as const }])],
  });

  bc.phan.forEach((p, ip) => {
    if (p.khoa === 'chung') {
      const nhanGv: Doan = [{ t: 'Giáo viên chủ nhiệm (Core teacher):', b: true }];
      hang.push({ nen: HONG, vien: true, giu: true, kem: 1, o: k.dau.tachNhan
        ? [{ tu: 0, den: 0, trang: true, doan: [[{ t: 'NHẬN XÉT', b: true }]] }, { tu: 1, den: 4, trang: true, doan: [nhanGv], them: { cot: 3, chu: { t: p.gv, b: true } } }]
        : [{ tu: 0, den: 0, trang: true, doan: [[{ t: 'NHẬN XÉT', b: true }]] }, { tu: 1, den: 4, trang: true, doan: [[...nhanGv, { t: ` ${p.gv}`, b: true }]] }] });
      hang.push({ vien: true, o: [nhan([{ t: 'Nhận xét chung ', b: true }, { t: '(General comment)', b: true, i: true }, { t: ':', b: true }]), { tu: 1, den: 4, doan: [[{ t: p.chu }]] }] });
      p.nhom.forEach((n, i) => {
        const [vi, en] = NHOM_CHUNG[i] ?? [n.vi ?? '', n.en ?? ''];
        hang.push(i === 0
          ? { nen: XANH, vien: true, kem: n.ds.length, o: [{ tu: 0, den: 0, trang: true, doan: tieuDe(vi, en) }, ...oMuc()] }
          : { vien: true, kem: n.ds.length, o: [{ tu: 0, den: 0, doan: tieuDe(vi, en) }, ...MUC.map((_, j) => ({ tu: j + 1, den: j + 1 }))] });
        n.ds.forEach((x, j) => hang.push({ vien: true, o: [{ tu: 0, den: 0, doan: [[{ t: `${j + 1}. ${x.vi}` }], [{ t: x.en, i: true }]] }, ...tick(x.muc)] }));
      });
    } else {
      const [vi, en] = TEN_PHAN[p.ngan] ?? [p.ngan.toUpperCase(), null];
      hang.push(gvHang(vi, en, p.gv, [{ t: 'Giáo viên ', b: true }, { t: '(Teacher)', b: true, i: true }, { t: ' :', b: true }]));
      hang.push({ vien: true, o: [{ tu: 0, den: 0, doan: [[{ t: 'Điểm:', b: true }], [{ t: 'Score:', b: true, i: true }]] },
        { tu: 1, den: 4, ngang: k.diemGiua ? 'giua' : 'trai', doc: 'giua', doan: p.diem ? [[{ t: p.diem, b: true, do: k.diemDo }]] : [] }] });
      hang.push({ vien: true, o: [nhan(nhanChu('Đề xuất cải thiện', 'Suggestion')), { tu: 1, den: 4, doan: [[{ t: p.chu }]] }] });
      const ds = p.nhom.flatMap((n) => n.ds);
      if (ds.length) {
        hang.push({ nen: XANH, vien: true, kem: ds.length, o: [{ tu: 0, den: 0, trang: true, doan: tieuDe('Cấp độ đạt được', 'Level achieved') }, ...oMuc()] });
        for (const x of ds) hang.push({ vien: true, o: [{ tu: 0, den: 0, doan: [[{ t: x.vi }], [{ t: x.en, i: true }]] }, ...tick(x.muc)] });
      }
    }
    if (ip < bc.phan.length - 1) khoang();
  });

  /* ---------------- vẽ ---------------- */
  const [W, H] = k.trang;
  const day = H - k.y0;   // lề dưới = lề trên (mẫu)
  let trang = pdf.addPage([W, H]);
  const Y = (yPt: number) => H - yPt;   // toạ độ PDF tính từ dưới
  const rgb = (c: [number, number, number]) => lib.rgb(c[0], c[1], c[2]);
  const veChu = (c: Chu, x: number, yBase: number, mau: [number, number, number], size = co) => trang.drawText(c.t, {
    x, y: Y(yBase), size, font: c.b ? fB : fR, color: rgb(c.do ? [1, 0, 0] : mau), ...(c.i ? { ySkew: lib.radians(Math.atan(k.nghieng)) } : {}),
  });
  const veDong = (d: Doan, x: number, yBase: number, mau: [number, number, number]) => { for (const c of d) { veChu(c, x, yBase, mau); x += rong(c); } };

  /** Cỡ chữ để `c` vừa bề rộng `w` pt (trừ lề hai bên) — chữ đầu trang dài (tên HV, địa chỉ) thu nhỏ thay vì tràn ô bên. */
  const vua = (c: Chu, w: number) => Math.min(co, co * (w - 2 * k.le * k.s) / Math.max(rong(c), 0.01));
  /* Đầu trang (khối xanh): vẽ một lần ở trang đầu. */
  const xR = xCot(5);
  trang.drawRectangle({ x: k.x0, y: Y(k.y0 + k.dau.cao * k.s), width: xR - k.x0, height: k.dau.cao * k.s, color: rgb(XANH) });
  const trang1 = [{ t: 'PISA INTERNATIONAL LANGUAGES CONSULTANCY', b: true }, { t: `Địa chỉ: ${bc.diaChi ?? ''}` }, { t: `Số điện thoại: ${bc.soDienThoai ?? ''}` }];
  trang1.forEach((c, i) => veChu(c, k.x0 + k.le * k.s, k.y0 + k.dau.trai[i] * k.s, [1, 1, 1], vua(c, xCot(1) - k.x0)));
  const [c1, c2] = k.dau.tieuDeCot;
  const giua = (xCot(c1) + xCot(c2 + 1)) / 2;
  const tieu = bc.ft ? ['NHẬN XÉT ĐỊNH KỲ FT', 'STUDENTS MONTHLY REPORTS'] : ['NHẬN XÉT GIỮA KỲ/CUỐI KỲ LỚP THƯỜNG', 'STUDENTS REPORTS FOR NORMAL CLASS'];
  tieu.forEach((t, i) => veChu({ t, b: true }, giua - rong({ t, b: true }) / 2, k.y0 + k.dau.tieuDe[i] * k.s, [1, 1, 1]));
  if (k.dau.tachNhan) {
    veChu({ t: 'Học sinh / Student name:' }, xCot(1) + k.le * k.s, k.y0 + k.dau.hs * k.s, [1, 1, 1]);
    veChu({ t: bc.hocVien }, xCot(3) + k.le * k.s, k.y0 + k.dau.hs * k.s, [1, 1, 1], vua({ t: bc.hocVien }, xR - xCot(3)));
    veChu({ t: 'Lớp/ Class:' }, xCot(1) + k.le * k.s, k.y0 + k.dau.lop * k.s, [1, 1, 1]);
    veChu({ t: bc.lop }, xCot(3) + k.le * k.s, k.y0 + k.dau.lop * k.s, [1, 1, 1], vua({ t: bc.lop }, xR - xCot(3)));
  } else {
    for (const [t, y] of [[`Học sinh / Student name: ${bc.hocVien}`, k.dau.hs], [`Lớp/ Class:  ${bc.lop}`, k.dau.lop]] as const) {
      const c = vua({ t }, xR - xCot(1));
      veChu({ t }, giua - rong({ t }) * c / co / 2, k.y0 + y * k.s, [1, 1, 1], c);
    }
  }
  let y = k.y0 + (k.dau.cao + k.khoangSauDau) * k.s;

  /**
   * Chia hàng `h` sau `n` dòng của ô nhiều dòng nhất (nhận xét dài): phần đầu giữ mọi ô, phần sau chỉ còn chữ còn lại. Ô có ≤ n dòng / n < 2 → null.
   */
  const tach = (h: Hang, n: number): [Hang, Hang] | null => {
    const iDai = h.o.reduce((m, o, j) => (dongO(o).length > dongO(h.o[m]).length ? j : m), 0);
    const dong = dongO(h.o[iDai]);
    if (n < 2 || dong.length <= n || h.nen) return null;
    const phan = (ds: Doan[], dau: boolean): Hang => ({ ...h, giu: false, o: h.o.map((o, j) => (j === iDai ? { ...o, doan: undefined, dong: ds, doc: 'tren' as const } : dau ? o : { ...o, doan: [], them: undefined })) });
    return [phan(dong.slice(0, n), true), phan(dong.slice(n), false)];
  };
  const soDongVua = (caoPt: number) => Math.floor((caoPt / k.s - k.dem) / k.buocHang);
  const moTrang = () => { trang = pdf.addPage([W, H]); y = k.y0; };
  const hangDoi = [...hang];
  while (hangDoi.length) {
    let h = hangDoi.shift()!;
    if (h.khoang && y === k.y0) continue;   // khoảng trống không mở đầu trang
    let cao = caoHang(h) * k.s;
    /* Tiêu đề (hồng / xanh) đi cùng ít nhất 3 dòng đầu của hàng sau — không đứng một mình cuối trang. */
    const kem = h.kem ? hangDoi.slice(0, h.kem).reduce((a, x) => a + caoHang(x), 0) * k.s : 0;
    const sau = kem && cao + kem <= day - k.y0 ? kem : h.giu && hangDoi[0] ? Math.min(caoHang(hangDoi[0]), 3 * k.buocHang + k.dem) * k.s : 0;
    if (y + cao + sau > day) {
      /* Hàng cao hơn cả trang (nhận xét rất dài): viết phần vừa chỗ còn lại, phần sau sang trang. Hàng khác: sang trang nguyên hàng. */
      const t = y > k.y0 && !sau && cao > day - k.y0 ? tach(h, soDongVua(day - y)) : null;
      if (t) { [h] = t; hangDoi.unshift(t[1]); cao = caoHang(h) * k.s; }
      else if (y > k.y0) { moTrang(); if (h.khoang) continue; }
      if (y === k.y0 && cao > day - k.y0) {   // cao hơn cả trang
        const t2 = tach(h, soDongVua(day - k.y0));
        if (t2) { [h] = t2; hangDoi.unshift(t2[1]); cao = caoHang(h) * k.s; }
      }
    }
    if (h.nen) trang.drawRectangle({ x: k.x0, y: Y(y + cao), width: xR - k.x0, height: cao, color: rgb(h.nen) });
    for (const o of h.o) {
      const x1 = xCot(o.tu), x2 = xCot(o.den + 1);
      if (h.vien) trang.drawRectangle({ x: x1, y: Y(y + cao), width: x2 - x1, height: cao, borderColor: rgb(KE), borderWidth: k.s });
      if (o.tick != null) {
        const c = 19.2 * k.s, ox = (x1 + x2) / 2 - c / 2, oy = y + cao / 2 - c / 2;
        veO(o.tick, ox, oy, c);
        continue;
      }
      const dong = dongO(o);
      if (!dong.length) continue;
      const mau: [number, number, number] = o.trang ? [1, 1, 1] : [0, 0, 0];
      const caoChu = dong.length * k.buoc * k.s;
      const doc = o.doc ?? 'tren';
      const yDau = doc === 'tren' ? y + 1.5 * k.s : doc === 'giua' ? y + (cao - caoChu) / 2 : y + cao - caoChu - 2 * k.s;
      dong.forEach((d, j) => {
        const w = d.reduce((a, c) => a + rong(c), 0);
        const x = o.ngang === 'giua' ? (x1 + x2) / 2 - w / 2 : x1 + k.le * k.s;
        veDong(d, x, yDau + j * k.buoc * k.s + co * 1.0, mau);
      });
      if (o.them) veChu(o.them.chu, xCot(o.them.cot) + k.le * k.s, yDau + co, mau);
    }
    y += cao;
    if (hangDoi.length && y >= day - 0.01) moTrang();
  }

  /** Ô tích như mẫu (biểu tượng check_box / check_box_outline_blank 18 × 18, bo góc 2): trống = viền xám; chọn = nền xám, dấu tích trắng. */
  function veO(chon: boolean, x: number, yTop: number, c: number) {
    const u = c / 18;
    const vuong = (x0: number, y0: number, w: number, r: number, mau: [number, number, number]) => trang.drawSvgPath(
      `M${r},0 H${w - r} Q${w},0 ${w},${r} V${w - r} Q${w},${w} ${w - r},${w} H${r} Q0,${w} 0,${w - r} V${r} Q0,0 ${r},0 Z`,
      { x: x0, y: Y(y0), color: rgb(mau), scale: 1 });
    vuong(x, yTop, c, 2 * u, XAM_O);
    if (!chon) { vuong(x + 2 * u, yTop + 2 * u, c - 4 * u, 0, [1, 1, 1]); return; }
    /* Dấu tích trong hệ 24 của biểu tượng: M10 17 l-5-5 1.41-1.41 L10 14.17 l7.59-7.59 L19 8 z (gốc ô ở (3,3)). */
    const p = [[10, 17], [5, 12], [6.41, 10.59], [10, 14.17], [17.59, 6.58], [19, 8]].map(([a, b]) => `${(a - 3) * u},${(b - 3) * u}`);
    trang.drawSvgPath(`M${p.join(' L')} Z`, { x, y: Y(yTop), color: lib.rgb(1, 1, 1) });
  }

  return pdf.save();
}
