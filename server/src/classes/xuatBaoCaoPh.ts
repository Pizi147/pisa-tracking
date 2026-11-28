/**
 * XUẤT EXCEL BÁO CÁO PH (đặc tả BAO-CAO-PH mục 5.3, 5.4, 12): ba mức — một em · một lớp (hồ sơ lớp, việc Admin) · nhiều lớp theo tháng (Học viên & Lớp › Xuất Excel).
 * Đúng mẫu CP FT 131: mỗi lớp một sheet (tên = mã lớp), cột A nhãn song ngữ, mỗi cột sau một em (hàng 1 họ tên); khối theo thứ tự mẫu
 * GVCN → Nhận xét chung → tiêu chí; mỗi kỹ năng "Giáo viên … (… Teacher)" → Điểm → Đề xuất cải thiện → tiêu chí. Ô mức "Khá (Sound)".
 * File = ảnh lúc bấm xuất (điểm sống đọc lúc đó). Không đánh dấu "đã xuất". Quyền: QL · Admin · TVV (+ QT) ở chi nhánh lớp.
 * Turso: một lớp ≈ 5 + số phần có điểm câu; nhiều lớp đọc theo lô (em, bản ghi, GV một câu mỗi loại; điểm FT một câu mỗi kỹ năng, lớp thường mỗi lớp).
 */
import { DS_JSON, db, docNho, theoLoJson } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { activeAt, lopConViec, lopDayDu, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { nhoTheoGhi } from '../platform/mocHeThong.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { badRequest, forbidden, notFound } from '../util.ts';
import { COT_BAI_ROI, COT_BO_EM, COT_MON_EM, diemGoc, docTuyChinhDot, dotCuaLop, emTrongDot, khongCuaEm, lopFt, quyenBc, type LopBc } from './baoCaoPh.ts';
import { classProgressMany } from './schedule.ts';
import {
  addDaysIso, boPhanBc, chuMucExcel, chuDiem, chuDiemPdf, emDuDot, nhanDotBc, soNgayQuaHan, type BanGhiBc, type BaoCaoPdf, type DiemGocBc, type DotBc, type KhongCan,
  type MucBc, type PhanBc,
} from '../../../shared/domain/index.ts';

export type SheetXuat = { ten: string; aoa: (string | number | null)[][] };
/** `khong`: phần em không cần làm (BC-PH-KY-NANG — `khongCuaEm`). */
type Em = { id: number; ten: string; khong: KhongCan };

/** Một phần của một em: GV phụ trách (lúc hạn đợt), ô chữ, điểm sửa tay / điểm gốc, mức từng tiêu chí. `can` = false: em không cần phần này → ô trống, PDF bỏ khối. */
type PhanEm = { p: PhanBc; can: boolean; gv: string; chu: string; sua: number | string | null; goc: DiemGocBc | null; muc: Record<string, MucBc> };
/** NỘI DUNG một (lớp, đợt) — MỘT nguồn cho Excel (`dungSheet`) và PDF (`baoCaoPdf`), BCPH-PDF. */
type NoiDung = { em: Em; phan: PhanEm[] }[];
function noiDung(bo: readonly PhanBc[], em: readonly Em[], ghi: Map<string, BanGhiBc>, gv: Map<string, string[]>, goc: Map<string, Map<number, DiemGocBc>>,
  khongDiem = false): NoiDung {
  return em.map((e) => ({
    em: e,
    phan: bo.map((p) => {
      const gvP = (gv.get(p.khoa) ?? []).join(', ');
      if (e.khong[p.khoa]) return { p, can: false, gv: gvP, chu: '', sua: null, goc: null, muc: {} };
      const b = ghi.get(`${e.id}:${p.khoa}`) ?? null;
      /* BC-PH-KY-NANG: GV chọn "Không ghi điểm" → ô điểm trống (Excel, PDF). */
      const coDiem = p.coDiem && !b?.boDiem && !khongDiem;
      return { p, can: true, gv: gvP, chu: b?.chu ?? '', sua: coDiem ? b?.diemSua ?? null : null, goc: coDiem ? goc.get(p.khoa)?.get(e.id) ?? null : null, muc: b?.muc ?? {} };
    }),
  }));
}

/** Một sheet = một lớp × một đợt × các em (đúng thứ tự mẫu). */
function dungSheet(ten: string, ma: string, bo: readonly PhanBc[], nd: NoiDung): SheetXuat {
  const aoa: (string | number | null)[][] = [[ma, ...nd.map((x) => x.em.ten)]];
  bo.forEach((p, i) => {
    const o = nd.map((x) => x.phan[i]);
    const tenGv = o[0]?.gv ?? '';
    if (p.khoa === 'chung') {
      aoa.push(['Giáo viên chủ nhiệm (Core teacher):', tenGv]);
      aoa.push(['Nhận xét chung (General comment):', ...o.map((x) => x.chu || null)]);
    } else {
      aoa.push([`${p.excelVi} (${p.excelEn}) :`, tenGv]);
      aoa.push(['Điểm:\nScore:', ...o.map((x) => {
        if (typeof x.sua === 'string') return x.sua;   // FT sửa thành chữ ("6.5 - 7.0")
        const so = x.sua ?? x.goc?.so ?? null;
        if (so == null) return null;
        return x.goc?.tong != null ? `${so}/${x.goc.tong}` : Number(chuDiem(so));
      })]);
      aoa.push(['Đề xuất cải thiện (Suggestion):', ...o.map((x) => x.chu || null)]);
    }
    for (const n of p.nhom) {
      n.ds.forEach((tc, j) => {
        const nhan = p.khoa === 'chung' ? `${j + 1}. ${tc.vi}\n${tc.en}` : `${tc.vi}\n${tc.en}`;
        aoa.push([nhan, ...o.map((x) => { const m = x.muc[tc.khoa]; return m ? chuMucExcel(m) : null; })]);
      });
    }
  });
  return { ten, aoa };
}

/** Báo cáo PDF từng em (BCPH-PDF) — cùng nội dung Excel + đầu trang chi nhánh. */
function baoCaoPdf(c: LopBc, nd: NoiDung, cn: { dia_chi: string | null; so_dien_thoai: string | null } | undefined): BaoCaoPdf[] {
  return nd.map((x) => ({
    ft: lopFt(c), diaChi: cn?.dia_chi ?? null, soDienThoai: cn?.so_dien_thoai ?? null, hocVien: x.em.ten, lop: c.code,
    phan: x.phan.filter((o) => o.can).map((o) => ({
      khoa: o.p.khoa, ngan: o.p.ngan, gv: o.gv, chu: o.chu, diem: o.p.coDiem ? chuDiemPdf(o.sua, o.goc) : null,
      nhom: o.p.nhom.map((n) => ({ vi: n.vi, en: n.en, ds: n.ds.map((tc) => ({ vi: tc.vi, en: tc.en, muc: o.muc[tc.khoa] ?? null })) })),
    })),
  }));
}

/** Tên sheet Excel: ≤ 31 ký tự, bỏ ký tự cấm, trùng thì thêm số (đặc tả §10). */
function tenSheet(goc: string, daDung: Set<string>): string {
  const sach = goc.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Sheet';
  let ten = sach;
  for (let i = 2; daDung.has(ten.toLowerCase()); i++) ten = `${sach.slice(0, 31 - String(i).length - 1)} ${i}`;
  daDung.add(ten.toLowerCase());
  return ten;
}

/** `khongDiem` (chủ SP 28/11): người xuất chọn bỏ điểm cả tệp — mọi ô điểm trống. */
type Viec = { c: LopBc; d: DotBc; bo: readonly PhanBc[]; em: Em[]; tenSheet: string; khongDiem?: boolean };

/** Em của nhiều (lớp, đợt) — MỘT câu ghi danh; cùng luật `emCuaDot` (phủ ngày mốc, em đang học; BO-BAO-CAO-PH: em đã bỏ đợt đó không có). */
function emTheoLo(ds: readonly { c: LopBc; d: DotBc }[], homNay: string): Map<string, Em[]> {
  const out = new Map<string, Em[]>();
  const rows: any[] = [];
  theoLoJson([...new Set(ds.map((x) => x.c.id))], (json) => {
    /* TOC-DO-2511c: `docNho` — Tổng quan kèm "Của tôi" (Admin) gọi hai lượt Công việc cùng câu (dòng chỉ đọc). */
    rows.push(...docNho(
      `SELECT e.class_id, substr(e.started_at, 1, 10) AS tu, substr(e.ended_at, 1, 10) AS den, ${COT_BAI_ROI('e')} AS bai, ${COT_BO_EM('s', 'e')} AS bo, ${COT_MON_EM('e')} AS mon,
              s.id, s.full_name
         FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${DS_JSON}) AND ${HV_DANG_HOC_SQL('s')} AND e.status != 'withdrawn' ORDER BY s.full_name`, json));
  });
  for (const { c, d } of ds) {
    const thay = new Set<number>();
    const bo = boPhanBc(c.programme_code ?? c.kind) ?? [];
    out.set(`${c.id}|${d.ma}`, rows.filter((r) => r.class_id === c.id && emTrongDot(r, d, homNay) && !thay.has(r.id) && thay.add(r.id))
      .map((r) => ({ id: r.id, ten: r.full_name, khong: khongCuaEm(r, c, bo, d) })));
  }
  return out;
}

/** Bản ghi + GV (phân công LÚC HẠN đợt) + điểm gốc cho các việc → nội dung từng việc (cùng thứ tự). */
function dungNoiDung(viec: readonly Viec[]): NoiDung[] {
  if (!viec.length) return [];
  const ghi = new Map<string, Map<string, BanGhiBc>>();
  const dots = [...new Set(viec.map((v) => v.d.ma))];
  const sids = [...new Set(viec.flatMap((v) => v.em.map((e) => e.id)))];
  theoLoJson(sids, (json) => {
    for (const r of db().prepare(`SELECT dot, student_id, phan, muc, chu, diem_sua, bo_diem FROM bao_cao_ph WHERE dot IN (SELECT value FROM json_each(?)) AND student_id IN (${DS_JSON})`)
      .all(JSON.stringify(dots), json) as any[]) {
      const m = ghi.get(r.dot) ?? new Map<string, BanGhiBc>();
      m.set(`${r.student_id}:${r.phan}`, { muc: r.muc ? JSON.parse(r.muc) : {}, datSan: [], chu: r.chu ?? '', diemSua: r.diem_sua ?? null, boDiem: !!r.bo_diem });
      ghi.set(r.dot, m);
    }
  });
  /* GV in trên báo cáo = phân công LÚC HẠN đợt (đợt còn mở: hôm nay) — đổi GV sau hạn không đổi báo cáo đợt cũ (PTA chốt 07/11). Một câu cho mọi lớp. */
  const homNay = demoToday();
  const moc = (v: Viec) => (v.d.han < homNay ? v.d.han : homNay);
  const mocs = viec.map(moc).sort();
  const pc: any[] = [];
  theoLoJson([...new Set(viec.map((v) => v.c.id))], (json) => {
    pc.push(...db().prepare(
      `SELECT ta.class_id, ta.skill, ta.is_core, ta.effective_from, ta.effective_to, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id IN (${DS_JSON}) AND ta.status IN ('active', 'ended') AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?) ORDER BY ta.id`,
    ).all(json, mocs.at(-1), mocs[0]) as any[]);
  });
  const gvLuc = (v: Viec) => {
    const m = new Map<string, string[]>();
    const ngay = moc(v);
    for (const r of pc) {
      const k = r.is_core ? 'chung' : r.skill;
      if (!k || r.class_id !== v.c.id || r.effective_from > ngay || (r.effective_to && r.effective_to < ngay)) continue;
      const ds = m.get(k) ?? [];
      if (!ds.includes(r.full_name)) ds.push(r.full_name);
      m.set(k, ds);
    }
    return m;
  };
  /* Điểm gốc: lớp FT cùng đợt tháng → một câu mỗi kỹ năng cho mọi em; lớp thường theo lớp (lượt của chính lớp). ponytail: lớp thường mỗi lớp ≤ 4 câu — chi nhánh vài lớp có đợt trong tháng. */
  const goc = new Map<string, Map<string, Map<number, DiemGocBc>>>();   // khoá nhóm → phần → em
  const nhomGoc = (v: Viec) => (v.d.loai === 'thang' ? `ft|${v.d.ma}` : `${v.c.id}|${v.d.ma}`);
  const theoNhom = new Map<string, Viec[]>();
  for (const v of viec) theoNhom.set(nhomGoc(v), [...(theoNhom.get(nhomGoc(v)) ?? []), v]);
  for (const [k, ds] of theoNhom) {
    const m = new Map<string, Map<number, DiemGocBc>>();
    const em = [...new Set(ds.flatMap((v) => v.em.map((e) => e.id)))];
    for (const p of ds[0].bo) if (p.coDiem) m.set(p.khoa, diemGoc(ds[0].c, ds[0].d, p.khoa, em));
    goc.set(k, m);
  }
  return viec.map((v) => noiDung(v.bo, v.em, ghi.get(v.d.ma) ?? new Map(), gvLuc(v), v.khongDiem ? new Map() : goc.get(nhomGoc(v)) ?? new Map(), v.khongDiem));
}

/** Sheets Excel của các việc. */
const dungSheets = (viec: readonly Viec[]): SheetXuat[] => dungNoiDung(viec).map((nd, i) => dungSheet(viec[i].tenSheet, viec[i].c.code, viec[i].bo, nd));

const tep = (...phan: string[]) => `PISA_BaoCaoPH_${phan.join('_').replace(/[^\p{L}\p{N}_-]+/gu, '-')}_${demoToday()}.xlsx`;

/**
 * GET /classes/:id/bao-cao-ph/xuat?dot=&em=&kieu= — một lớp (mọi em của đợt) hoặc một em. Excel: một sheet một cột / em.
 * `kieu=pdf` (BCPH-PDF): nội dung từng em (`BaoCaoPdf`) — web dựng PDF; + 1 câu địa chỉ / SĐT chi nhánh lớp (1 dòng).
 */
export function xuatLopBaoCaoPh(p: Principal, classId: number, dotMa: string | null, emId: number | null, kieu: 'xlsx' | 'pdf' = 'xlsx', coDiem = true) {
  const c = lopDayDu().get(classId) as LopBc | undefined;
  if (!c) throw notFound('Không tìm thấy lớp');
  if (!quyenBc(p, c).xuat) throw forbidden('Xuất báo cáo PH: chỉ Head, Admin, Tư vấn viên.');
  const homNay = demoToday();
  const dl = dotCuaLop(c, homNay);
  if (!dl) throw badRequest('Chương trình của lớp chưa có mẫu báo cáo PH');
  const d = dl.ds.find((x) => x.ma === dotMa) ?? (dotMa ? null : dl.ds[0]);
  if (!d) throw notFound('Đợt báo cáo không có ở lớp này');
  let em = emTheoLo([{ c, d }], homNay).get(`${c.id}|${d.ma}`) ?? [];
  if (emId != null) {
    em = em.filter((e) => e.id === emId);
    if (!em.length) throw badRequest('Học viên không có trong đợt báo cáo này');
  }
  const nhan = nhanDotBc(d, homNay);
  const viec: Viec[] = [{ c, d, bo: dl.bo, em, tenSheet: tenSheet(c.code, new Set()), khongDiem: !coDiem }];
  writeAudit({ actorUserId: p.userId, action: 'bao_cao_ph.xuat', entityType: emId ? 'student' : 'class', entityId: emId ?? c.id, entityLabel: c.code,
    after: { dot: d.ma, soHv: em.length, ...(kieu === 'pdf' ? { kieu } : {}), ...(coDiem ? {} : { khongDiem: true }) } });
  if (kieu === 'pdf') {
    const cn = db().prepare('SELECT dia_chi, so_dien_thoai FROM branches WHERE id = ?').get(c.branch_id) as any;
    return { ds: baoCaoPdf(c, dungNoiDung(viec)[0], cn), lop: c.code, nhanDot: nhan, dem: { hocVien: em.length, lop: 1 } };
  }
  const sheets = dungSheets(viec);
  return { sheets, tenTep: emId ? tep(c.code, nhan, em[0].ten) : tep(c.code, nhan), dem: { hocVien: em.length, lop: 1 } };
}

/**
 * Các (lớp, đợt) của tháng `thang` (YYYY-MM) cho tập em (đặc tả §5.3, ghi chú L1): FT = đợt tháng đó (đã mở); lớp thường = đợt Progress / Final
 * CÓ HẠN trong tháng đó (hai đợt cùng tháng: hai sheet, sheet sau "{mã} · Final"). Em = em của tập đang học lớp đó; lớp không có đợt → `khongDot`.
 * Lớp ngoài quyền xuất của người xem bị bỏ (máy chủ kiểm từng lớp).
 */
function viecTheoThang(p: Principal, ids: readonly number[], thang: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(thang)) throw badRequest('Tháng không hợp lệ');
  const homNay = demoToday();
  /* RA-LOI-0611 (PTA 06/11): em của lớp LÚC HẠN (đặc tả §4) — cùng hàm `emTheoLo` với tab lớp, không lọc theo ghi danh đang chạy: em chuyển lớp sau hạn
     vẫn nằm trong file tháng của lớp cũ. Ở đây chỉ lấy lớp ứng viên: ghi danh của tập em có phủ tháng đó (lọc rẻ; mốc chính xác ở `emTheoLo`). */
  const dauThang = `${thang}-01`, cuoiThang = `${thang}-31`;
  const lopCua = new Map<number, Set<number>>();
  theoLoJson([...new Set(ids)], (json) => {
    for (const r of db().prepare(
      `SELECT DISTINCT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.student_id IN (${DS_JSON}) AND e.status != 'withdrawn' AND ${HV_DANG_HOC_SQL('s')}
          AND substr(e.started_at, 1, 10) <= ? AND (e.ended_at IS NULL OR substr(e.ended_at, 1, 10) > ?)`,
    ).all(json, cuoiThang, dauThang) as any[]) lopCua.set(r.class_id, (lopCua.get(r.class_id) ?? new Set()).add(r.student_id));
  });
  const lop = [...lopCua.keys()].map((id) => lopDayDu().get(id) as LopBc).filter((c) => c && quyenBc(p, c, homNay).xuat)
    .sort((a, b) => a.code.localeCompare(b.code));
  const cap: { c: LopBc; d: DotBc; bo: readonly PhanBc[] }[] = [];
  const khongDot: string[] = [];
  const tuyChinh = docTuyChinhDot(lop.map((c) => c.id));   // BC-DOT-QL: đợt QL / Admin bỏ hoặc thêm — một câu cho cả lô lớp
  const tienDo = classProgressMany(lop.map((c) => c.id));   // BC-PH-MOC: tuần khai giảng / mốc thi — một lô, không đọc từng lớp
  for (const c of lop) {
    const dl = dotCuaLop(c, homNay, tienDo, tuyChinh);
    if (!dl) { khongDot.push(c.code); continue; }
    const ds = dl.ds.filter((d) => (d.loai === 'thang' ? d.mo.slice(0, 7) === thang : d.han.slice(0, 7) === thang));
    if (!ds.length) khongDot.push(c.code);
    for (const d of ds.sort((a, b) => a.mo.localeCompare(b.mo))) cap.push({ c, d, bo: dl.bo });
  }
  const emDot = emTheoLo(cap, homNay);
  const daDung = new Set<string>();
  const viec: Viec[] = cap.map(({ c, d, bo }) => ({
    c, d, bo, em: (emDot.get(`${c.id}|${d.ma}`) ?? []).filter((e) => lopCua.get(c.id)!.has(e.id)),
    tenSheet: tenSheet(cap.filter((x) => x.c.id === c.id).length > 1 && d.loai === 'final' ? `${c.code} · Final` : c.code, daDung),
  })).filter((v) => v.em.length);
  return { viec, khongDot, homNay };
}

/**
 * POST /hoc-vien-lop/xuat-bao-cao-ph { ids, thang, xemTruoc } — Học viên & Lớp › Xuất Excel › mẫu "Báo cáo PH".
 * `xemTruoc`: chỉ đếm (lớp FT / lớp thường có đợt, không đợt, em đủ mọi phần) — không đọc điểm, không ghi nhật ký.
 */
export function xuatBaoCaoPhNhieu(p: Principal, body: { ids?: unknown; thang?: unknown; xemTruoc?: unknown; ghiDiem?: unknown }) {
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
  const { viec, khongDot, homNay } = viecTheoThang(p, ids, String(body.thang ?? ''));
  const demLop = (ft: boolean) => {
    const v = viec.filter((x) => lopFt(x.c) === ft);
    return { lop: new Set(v.map((x) => x.c.id)).size, hocVien: new Set(v.flatMap((x) => x.em.map((e) => e.id))).size };
  };
  const tong = new Set(viec.flatMap((x) => x.em.map((e) => e.id))).size;
  if (body.xemTruoc) {
    /* Em đủ mọi phần CẦN LÀM (BC-PH-KY-NANG `emDuDot`): một câu bản ghi `du` theo (đợt, em, phần). */
    const du = new Set<string>();
    const sids = [...new Set(viec.flatMap((v) => v.em.map((e) => e.id)))];
    theoLoJson(sids, (json) => {
      for (const r of db().prepare(`SELECT dot, student_id, phan FROM bao_cao_ph WHERE du = 1 AND student_id IN (${DS_JSON}) AND dot IN (SELECT value FROM json_each(?))`)
        .all(json, JSON.stringify([...new Set(viec.map((v) => v.d.ma))])) as any[]) du.add(`${r.dot}|${r.student_id}|${r.phan}`);
    });
    const emDu = new Set(viec.flatMap((v) => v.em.filter((e) => emDuDot(v.bo, e.khong, (k) => du.has(`${v.d.ma}|${e.id}|${k}`))).map((e) => e.id))).size;
    return { ft: demLop(true), thuong: demLop(false), khongDot, emDu, tong };
  }
  if (!viec.length) throw badRequest('Không có lớp nào có đợt báo cáo PH trong tháng này');
  /* BC-PH-KY-NANG: `ghiDiem: false` — không ghi điểm cả tệp (như `?diem=0` của xuất một lớp). */
  const sheets = dungSheets(body.ghiDiem === false ? viec.map((v) => ({ ...v, khongDiem: true })) : viec);
  writeAudit({ actorUserId: p.userId, action: 'bao_cao_ph.xuat', entityType: 'xuat_hoc_vien', entityLabel: `${tong} học viên · ${viec.length} lớp`,
    after: { thang: body.thang, soLop: viec.length, soHv: tong } });
  return { sheets, tenTep: tep(String(body.thang), `${viec.length}-lop`), dem: { hocVien: tong, lop: viec.length }, khongDot, homNay };
}

/**
 * VIỆC ADMIN "Xuất báo cáo PH · {lớp} · {đợt}" (đặc tả §12, ghi chú mockup mục 7 k1): chỉ người có vai Admin (`office_admin`) ở chi nhánh lớp — QL không nhận.
 *   · lớp ĐỦ (mọi em đủ mọi phần) → hiện 7 ngày từ ngày lớp đủ, nút Xuất lớp;
 *   · đợt đã quá hạn mà chưa đủ → hiện từ ngày hạn, 7 ngày, "thiếu n em" (PTA quyết).
 * ponytail: "ngày lớp đủ" = lần lưu cuối của đợt khi lớp đã đủ (không lưu cột riêng) — sửa lại sau khi đủ thì ngày dời theo; thêm cột khi cần mốc cố định.
 * Turso: chỉ lớp có đợt trong cửa sổ (mở ≤ hôm nay ≤ hạn + 30) — một câu ghi danh + một câu đếm bản ghi cho mọi lớp đó (+ tiến độ lớp thường).
 */
export type ViecXuatBc = { classId: number; code: string; dot: string; nhanDot: string; han: string; soEm: number; thieu: number; duLuc: string | null; quaHan: number };
/**
 * Đợt của các lớp trong cửa sổ đọc (mở ≤ hôm nay ≤ hạn + 30) kèm số em còn thiếu — MỘT nguồn cho việc Admin "Xuất báo cáo PH" và việc QL "Báo cáo PH quá hạn" (N49).
 * Turso: một câu ghi danh + một câu đếm bản ghi cho mọi lớp đó (+ tiến độ lớp thường); nhớ theo request (Admin kiêm QL cùng chi nhánh đọc một lần).
 */
/* `ql` (việc QL, N49): chỉ đợt quá hạn > 7 ngày, hạn ≥ ngày bật, KHÔNG trần 30 ngày (giữ tới khi lớp đủ / bỏ đợt / lớp kết thúc) — lọc TRƯỚC câu em / bản ghi. */
function dotBcCuaSo(cn: ReadonlySet<number | null>, branchId: number | null, homNay: string, ql: { batTu: string } | null = null) {
  return nho(`bc-ph-cua-so:${[...cn].join(',')}:${branchId ?? ''}:${ql ? ql.batTu : ''}`, () => {
    const cap: { c: LopBc; d: DotBc; bo: readonly PhanBc[] }[] = [];
    /* N71: + lớp đã kết thúc — Admin: trong 30 ngày sau khi lớp kết thúc (`lopConViec`); QL (N49): như việc GV, tới khi xong (`lopBcConViec`). */
    const lop = [...lopDayDu().values() as Iterable<LopBc>].filter((c) => (ql ? lopBcConViec(c, ql.batTu) : lopConViec(c, homNay)) && (cn.has(null) || cn.has(c.branch_id))
      && (branchId == null || c.branch_id === branchId) && boPhanBc(c.programme_code ?? c.kind));
    const tienDo = classProgressMany(lop.map((c) => c.id));   // một lô cho mọi lớp (FT: tuần khai giảng — BC-PH-MOC)
    const tuyChinh = docTuyChinhDot(lop.map((c) => c.id));   // BC-DOT-QL: đợt bỏ không thành việc, không tính "thiếu n em"; đợt thêm như đợt thường
    for (const c of lop) {
      const dl = dotCuaLop(c, homNay, tienDo, tuyChinh);
      /* Đợt quá hạn tới 30 ngày vẫn đọc: lớp viết đủ muộn (sau hạn + 7) vẫn có 7 ngày việc "đủ". RA-LOI-0711e: lọc theo cửa sổ, không lấy "2 đợt mới
         nhất" — đợt QL thêm (BC-DOT-QL) mở sau đợt tháng từng đẩy đợt tháng ra khỏi 2 đợt đầu, mất việc của nó. */
      for (const d of dl?.ds ?? []) {
        const qh = soNgayQuaHan(d, homNay);
        if (dl && (ql ? qh > 7 && d.han >= ql.batTu : qh <= 30)) cap.push({ c, d, bo: dl.bo });
      }
    }
    if (!cap.length) return [];
    const emDot = emTheoLo(cap, homNay);
    const sids = [...new Set([...emDot.values()].flatMap((ds) => ds.map((e) => e.id)))];
    /* BC-PH-KY-NANG: phần đã đủ của từng (đợt, em) — em đủ = mọi phần cần làm đủ (`emDuDot`). */
    const dem = new Map<string, { du: Set<string>; luc: string }>();
    theoLoJson(sids, (json) => {
      for (const r of docNho(`SELECT dot, student_id, group_concat(CASE WHEN du = 1 THEN phan END) du, MAX(sua_luc) luc FROM bao_cao_ph
          WHERE student_id IN (${DS_JSON}) AND dot IN (SELECT value FROM json_each(?)) GROUP BY dot, student_id`,
        json, JSON.stringify([...new Set(cap.map((x) => x.d.ma))]))) dem.set(`${r.dot}|${r.student_id}`, { du: new Set(r.du ? String(r.du).split(',') : []), luc: r.luc });
    });
    const ket = cap.flatMap(({ c, d, bo }) => {
      const em = emDot.get(`${c.id}|${d.ma}`) ?? [];
      if (!em.length) return [];
      const thieu = em.filter((e) => !emDuDot(bo, e.khong, (k) => !!dem.get(`${d.ma}|${e.id}`)?.du.has(k))).length;
      const luc = thieu ? null : em.map((e) => dem.get(`${d.ma}|${e.id}`)?.luc ?? '').sort().at(-1)!;
      return [{ c, d, soEm: em.length, thieu, luc, qh: soNgayQuaHan(d, homNay) }];
    });
    /* BO-BAO-CAO-PH: bỏ em cuối còn thiếu cũng làm lớp "đủ" → ngày đủ = lần lưu cuối HOẶC lần bỏ em cuối (sau). Một câu, chỉ khi có lớp đủ. */
    const du = ql ? [] : ket.filter((x) => x.thieu === 0);   // việc QL chỉ lấy lớp còn thiếu
    if (du.length) {
      const bo = new Map<string, string>();
      theoLoJson([...new Set(du.map((x) => x.c.id))], (json) => {
        for (const r of db().prepare(`SELECT class_id, dot, MAX(luc) luc FROM bao_cao_ph_bo_em WHERE class_id IN (${DS_JSON}) AND dot IN (SELECT value FROM json_each(?)) GROUP BY class_id, dot`)
          .all(json, JSON.stringify([...new Set(du.map((x) => x.d.ma))])) as any[]) bo.set(`${r.class_id}|${r.dot}`, r.luc);
      });
      for (const x of du) { const l = bo.get(`${x.c.id}|${x.d.ma}`); if (l && l > x.luc!) x.luc = l; }
    }
    return ket;
  });
}

/**
 * VIỆC ADMIN "Xuất báo cáo PH · {lớp} · {đợt}" (đặc tả §12, ghi chú mockup mục 7 k1): chỉ người có vai Admin (`office_admin`) ở chi nhánh lớp — QL không nhận.
 *   · lớp ĐỦ (mọi em đủ mọi phần) → hiện 7 ngày từ ngày lớp đủ, nút Xuất lớp;
 *   · đợt đã quá hạn mà chưa đủ → hiện từ ngày hạn, 7 ngày, "thiếu n em" (PTA quyết).
 * ponytail: "ngày lớp đủ" = lần lưu cuối của đợt khi lớp đã đủ (không lưu cột riêng) — sửa lại sau khi đủ thì ngày dời theo; thêm cột khi cần mốc cố định.
 */
export function viecXuatBaoCaoPh(p: Principal, branchId: number | null): ViecXuatBc[] {
  const cn = new Set(p.grants.filter((g) => g.roleKey === 'office_admin').map((g) => g.branchId));
  if (!cn.size) return [];
  const homNay = demoToday();
  const out: ViecXuatBc[] = [];
  for (const { c, d, soEm, thieu, luc, qh } of dotBcCuaSo(cn, branchId, homNay)) {
    if (thieu === 0) {
      const duNgay = [ngayVn(luc!), homNay].sort()[0];   // ngày demo / đồng hồ lệch: không sau hôm nay
      if (soNgayQuaHan({ han: duNgay }, homNay) > 7) continue;
      out.push({ classId: c.id, code: c.code, dot: d.ma, nhanDot: nhanDotBc(d, homNay), han: d.han, soEm, thieu: 0, duLuc: duNgay, quaHan: 0 });
    } else if (qh > 0 && qh <= 7) {
      out.push({ classId: c.id, code: c.code, dot: d.ma, nhanDot: nhanDotBc(d, homNay), han: d.han, soEm, thieu, duLuc: null, quaHan: qh });
    }
  }
  return out;
}

/**
 * N49 (chủ SP 16/11, audit câu 4; N71 25/11): Báo cáo PH quá hạn > 7 ngày mà lớp còn em chưa đủ → MỘT việc nhắc mỗi lớp × đợt cho QL / Quản trị của chi nhánh
 * lớp (tab "Việc quản lý") — GV VẪN giữ việc của mình (`viecBaoCaoPhGv`). Giữ tới khi lớp đủ hoặc QL / Admin chọn "Không báo cáo đợt này" (`docTuyChinhDot`);
 * lớp đã kết thúc vẫn tính (rà #1788: không trần 30 ngày). `batTu`: như việc GV — đợt có hạn trước ngày bật không sinh việc (GV chưa từng có việc đó).
 * Turso: tiến độ lớp + tuỳ chỉnh đợt (lớp của chi nhánh), rồi em + bản ghi CHỈ của đợt quá hạn > 7 ngày; nhớ theo tiến trình tới lần ghi kế tiếp
 * (`nhoTheoGhi`) → badge QL mở lại khi chưa ai ghi gì: 0 câu.
 */
export function viecBcPhQuaHanQl(p: Principal, branchId: number | null, batTu = ''): ViecXuatBc[] {
  const cn = new Set(p.grants.filter((g) => g.roleKey === 'manager' || g.roleKey === 'system_admin').map((g) => g.branchId));
  if (!cn.size) return [];
  const homNay = demoToday();
  return nhoTheoGhi(`bc-ph-qh:${[...cn].join(',')}:${branchId ?? ''}:${batTu}`, homNay, () => dotBcCuaSo(cn, branchId, homNay, { batTu }).filter((x) => x.thieu > 0))
    .map(({ c, d, soEm, thieu, qh }) => ({ classId: c.id, code: c.code, dot: d.ma, nhanDot: nhanDotBc(d, homNay), han: d.han, soEm, thieu, duLuc: null, quaHan: qh }));
}
/**
 * LG-3 VIỆC GV "Báo cáo PH" (chủ SP 13–14/11 — lời 12, 13, 16): mỗi lớp × đợt một việc cho người có phần phải viết theo phân công HÔM NAY
 * (GV kỹ năng: phần mình · GVCN: Chung · GVCN kiêm kỹ năng: MỘT dòng mọi phần của mình). Đợt: đang mở hoặc quá hạn — N40 sửa theo N71 (chủ SP 25/11 "Giữ tới khi
 * xong"): quá hạn GIỮ tới khi viết xong (bỏ "hiện thêm 7 ngày rồi rời"); lớp đã kết thúc (em cuối chuyển đi) vẫn tính;
 * mọi loại đợt (tháng FT, Progress / Final lớp thường, đợt QL thêm). Xong = mọi em trong đợt đủ mọi phần của mình — tính theo bản ghi em × phần nên hai GV
 * cùng phần: một người viết đủ thì cả hai cùng xong. `batTu`: không sinh việc cho đợt có hạn trước ngày này (ngày bật tính năng).
 * Turso: 0 câu khi không có phân công lớp có mẫu báo cáo; còn lại tiến độ lớp + tuỳ chỉnh đợt (lớp của GV, nhớ theo request) và — chỉ khi có đợt trong
 * cửa sổ — em (1 câu) + bản ghi đủ của phần mình (1 câu, ≤ em × phần dòng).
 */
export type ViecBcGv = { userId: number; classId: number; code: string; dot: string; nhanDot: string; han: string; soEm: number; thieu: number; phan: string[] };
/** Người giữ phần: GV (chính người xem) hoặc mọi GV trong phạm vi khi QL / QT xem "Tất cả" — cùng câu đọc cho cả nhóm. */
export type NguoiBc = { userId: number; assignments: readonly Pick<Principal['assignments'][number], 'classId' | 'skill' | 'isCore' | 'effectiveFrom' | 'effectiveTo'>[] };
/**
 * N71: lớp còn sinh việc Báo cáo PH tới khi xong — đang chạy, hoặc đã kết thúc từ sau (ngày bật − 31) (đợt có hạn trước ngày bật không sinh việc: lớp xong trước
 * đó không thể còn đợt nào). ponytail: đợt QL thêm cho lớp ĐÃ kết thúc lâu trước ngày bật thì không tính — cần thì đọc theo `bao_cao_ph_dot`.
 */
const lopBcConViec = (c: Pick<LopBc, 'status'> & { finished_at?: string | null }, batTu: string): boolean =>
  c.status === 'active' || (c.status === 'finished' && (!batTu || (c.finished_at ?? '').slice(0, 10) >= addDaysIso(batTu, -31)));
/** Lớp × phần người giữ phải viết theo phân công hôm nay (lớp có mẫu báo cáo) — `viecBaoCaoPhGv` và `dotBcSapMoGv` dùng chung. */
function phanCuaNguoi(nguoi: readonly NguoiBc[], homNay: string, batTu: string) {
  const cuaToi = new Map<string, Set<string>>();   // "người|lớp" → phần
  for (const n of nguoi) for (const a of n.assignments) {
    const k = a.isCore ? 'chung' : a.skill;
    if (!k || !activeAt(a, homNay)) continue;
    const khoa = `${n.userId}|${a.classId}`;
    cuaToi.set(khoa, (cuaToi.get(khoa) ?? new Set<string>()).add(k));
  }
  if (!cuaToi.size) return [];
  const lop = lopDayDu();
  return [...cuaToi].flatMap(([khoa, k]) => {
    const [userId, id] = khoa.split('|').map(Number);
    const c = lop.get(id) as LopBc | undefined;
    const phan = c && lopBcConViec(c, batTu) ? boPhanBc(c.programme_code ?? c.kind)?.filter((x) => k.has(x.khoa)) ?? [] : [];
    return phan.length ? [{ userId, c: c!, phan }] : [];
  });
}

export function viecBaoCaoPhGv(nguoi: readonly NguoiBc[], homNay: string, batTu = ''): ViecBcGv[] {
  const can = phanCuaNguoi(nguoi, homNay, batTu);
  if (!can.length) return [];
  const ids = [...new Set(can.map((x) => x.c.id))];
  const tienDo = classProgressMany(ids), tuyChinh = docTuyChinhDot(ids);
  const dotLop = new Map(ids.map((id) => [id, (dotCuaLop(lopDayDu().get(id) as LopBc, homNay, tienDo, tuyChinh)?.ds ?? [])
    .filter((d) => d.mo <= homNay && d.han >= batTu)]));   // N40 / N71: quá hạn giữ tới khi xong
  const cap = can.flatMap((x) => (dotLop.get(x.c.id) ?? []).map((d) => ({ ...x, d })));
  if (!cap.length) return [];
  const emDot = emTheoLo(cap, homNay);
  const sids = [...new Set([...emDot.values()].flatMap((ds) => ds.map((e) => e.id)))];
  const du = new Set<string>();
  const dots = JSON.stringify([...new Set(cap.map((x) => x.d.ma))]), phans = JSON.stringify([...new Set(cap.flatMap((x) => x.phan.map((ph) => ph.khoa)))]);
  theoLoJson(sids, (json) => {
    for (const r of db().prepare(`SELECT dot, student_id, phan FROM bao_cao_ph WHERE du = 1 AND student_id IN (${DS_JSON})
        AND dot IN (SELECT value FROM json_each(?)) AND phan IN (SELECT value FROM json_each(?))`).all(json, dots, phans) as any[]) du.add(`${r.dot}|${r.student_id}|${r.phan}`);
  });
  const out: ViecBcGv[] = [];
  for (const { userId, c, d, phan } of cap) {
    /* BC-PH-KY-NANG: chỉ em CẦN phần của người giữ (không học / Head bỏ → không là việc). */
    const em = (emDot.get(`${c.id}|${d.ma}`) ?? []).filter((e) => phan.some((ph) => !e.khong[ph.khoa]));
    const thieu = em.filter((e) => phan.some((ph) => !e.khong[ph.khoa] && !du.has(`${d.ma}|${e.id}|${ph.khoa}`))).length;
    if (thieu) out.push({ userId, classId: c.id, code: c.code, dot: d.ma, nhanDot: nhanDotBc(d, homNay), han: d.han, soEm: em.length, thieu, phan: phan.map((ph) => ph.khoa) });
  }
  return out;
}

/**
 * LG-13 (H7 "Sắp tới"): đợt Báo cáo PH của người giữ phần MỞ trong 7 ngày tới (mở > hôm nay, ≤ hôm nay + 7) — ngày đó `viecBaoCaoPhGv` sinh việc
 * (cùng phân công, cùng `dotCuaLop`, cùng mốc bật `batTu`, lớp có em trong đợt). Turso: tiến độ + tuỳ chỉnh đợt cùng tập lớp với `viecBaoCaoPhGv` (nhớ theo request) → 0 câu;
 * có đợt sắp mở thì + 1 câu em. ponytail: tính theo phân công + lịch HÔM NAY (đổi phân công / dời tuần thi trong tuần thì ngày đổi theo).
 */
export type DotBcSapMo = { classId: number; code: string; dot: string; nhanDot: string; mo: string };
export function dotBcSapMoGv(n: NguoiBc, homNay: string, batTu = ''): DotBcSapMo[] {
  const can = phanCuaNguoi([n], homNay, batTu);
  if (!can.length) return [];
  const ids = [...new Set(can.map((x) => x.c.id))];
  const tienDo = classProgressMany(ids), tuyChinh = docTuyChinhDot(ids);
  const den = addDaysIso(homNay, 7);
  const cap = can.flatMap(({ c }) => (dotCuaLop(c, den, tienDo, tuyChinh)?.ds ?? []).filter((d) => d.mo > homNay && d.han >= batTu).map((d) => ({ c, d })));
  if (!cap.length) return [];
  /* Lớp không em nào trong đợt thì không sinh việc — một câu em, chỉ những ngày có đợt sắp mở. */
  const emDot = emTheoLo(cap, den);
  return cap.filter(({ c, d }) => emDot.get(`${c.id}|${d.ma}`)?.length)
    .map(({ c, d }) => ({ classId: c.id, code: c.code, dot: d.ma, nhanDot: nhanDotBc(d, homNay), mo: d.mo }))
    .sort((a, b) => a.mo.localeCompare(b.mo) || a.classId - b.classId);
}

/** Ngày (giờ VN) của một mốc ISO. */
const ngayVn = (iso: string) => new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 10);
