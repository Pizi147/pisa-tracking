/**
 * CAU-HINH-CASE-SOS (chủ SP 11/11) — cấu hình nhóm nguyên nhân / nhóm PA / việc theo mốc SOS ở DB, Quản trị sửa, QL xem.
 * Đặc tả `docs/superpowers/specs/2026-11-11-cau-hinh-case-sos-design.md` mục 3–6.
 *
 * Bảng dùng chung `cau_hinh_phien_ban` (QUAN-TRI-V2 cũng ghi loại của họ): mỗi lần lưu thêm MỘT dòng, không sửa / xoá dòng cũ; bản đang dùng = id lớn
 * nhất của loại; chưa có dòng = bản gốc (`cauHinhGoc`, id 0). Id mới ≥ 2 → `case_issues.taxonomy_version = 1` cũ luôn là bản gốc.
 *
 * ĐỌC ÍT (Turso): bản đang dùng nhớ THEO TIẾN TRÌNH, khoá bằng `moc_he_thong['tham-chieu']` (đọc kèm câu phiên — trigger trên bảng này tăng số), nên
 * không ai sửa thì 0 câu / request. Phiên bản cũ (Case / PA / việc chụp) bất biến → nhớ theo id mãi. Ngoài request (phép kiểm, ops) đọc thẳng (bảng nhỏ).
 */
import { db, tx } from '../db.ts';
import { can, type Principal } from '../permissions.ts';
import {
  LOAI_CAU_HINH, PERMISSIONS, cauHinh, cauHinhGoc, datNguonCauHinh, kiemCauHinh, laKhac, laMaThem, laVaiQuanLy, soOMocCuaPa, thayDoi,
  type BanCauHinh, type DuLieuCauHinh, type LoaiCauHinh, type MocSos, type NguyenNhan, type PhuongAn, type ThayDoi,
} from '../../../shared/domain/index.ts';
import { badRequest, conflict, forbidden, loi as loiHttp, nowIso } from '../util.ts';
import { writeAudit } from './audit.ts';
import { layMoc } from './nguCanhRequest.ts';
import { thamChieuDayDuKhiKiem, type MocHeThong } from './mocHeThong.ts';

/* Bảng chung `cau_hinh_phien_ban` (+ chỉ mục, trigger tham chiếu): QTV2-HAN (`platform/cauHinh.ts`, migrate `prCauHinhPhienBan`); Case & SOS dùng `loai` riêng. */
/** Chỉ mục một phần theo mã (như schema.sql): dòng sinh từ bản ≥ 2 — nơi duy nhất có mã Quản trị thêm. Điều kiện phải khớp câu đọc bên dưới (`demDangDung`, `daDung`). */
export const CHI_MUC_MA = [
  ['idx_case_issue_ma', 'case_issues', 'taxonomy_code', 'taxonomy_version > 1'],
  ['idx_iv_kind', 'case_interventions', 'kind', 'pb_loai IS NOT NULL'],
  ['idx_sca_kind', 'sos_coordination_actions', 'kind', 'pb_moc IS NOT NULL'],
] as const;

type Ban = BanCauHinh;
const LOAI_SQL = LOAI_CAU_HINH.map((l) => `'${l}'`).join(',');

function docDangDung(): Map<LoaiCauHinh, Ban> {
  let rows: { id: number; loai: LoaiCauHinh; du_lieu: string }[];
  try {
    rows = db().prepare(
      `SELECT id, loai, du_lieu FROM cau_hinh_phien_ban WHERE id IN (SELECT MAX(id) FROM cau_hinh_phien_ban WHERE loai IN (${LOAI_SQL}) GROUP BY loai)`,
    ).all() as typeof rows;
  } catch (e) {
    /* Migrate DB cũ: bước giữa (vd taoCaseTuDong) đọc cấu hình TRƯỚC prCauHinhPhienBan tạo bảng → bản gốc (= bảng rỗng), như `cauHinh.ts`. */
    if (!/no such table: cau_hinh_phien_ban/i.test(String((e as Error)?.message))) throw e;
    rows = [];
  }
  const m = new Map<LoaiCauHinh, Ban>();
  for (const l of LOAI_CAU_HINH) m.set(l, { id: 0, du_lieu: cauHinhGoc()[l] });
  for (const r of rows) m.set(r.loai, { id: r.id, du_lieu: JSON.parse(r.du_lieu) });
  return m;
}

/** Theo kết nối (như `nhoThamChieu`): phép kiểm đổi kết nối / DB chép lại không thấy nhớ của kết nối cũ. */
const dangDungTheoKetNoi = new WeakMap<object, { so: number | null; luc: number; v: Map<LoaiCauHinh, Ban> }>();
const NHO_NGOAI_REQUEST_MS = 60_000;
const banTheoKetNoi = new WeakMap<object, Map<number, Ban | null>>();
const trongRequest = (): number | null => (layMoc() as MocHeThong | undefined)?.thamChieu ?? null;

/**
 * Trong request: khoá bằng mốc tham chiếu (tiến trình khác sửa → số đổi → đọc lại). NGOÀI request (phép kiểm, lệnh ops, việc nền): nhớ theo kết nối tối đa
 * 60 s hoặc tới khi chính máy chủ này ghi cấu hình (`luuCauHinh` → `quenNhoCauHinh`) — không đọc lại mỗi lần tra nhãn trong một vòng tạo 80 Case,
 * mà lần sửa ở tiến trình khác vẫn tới việc nền trong 60 s.
 */
export function cauHinhDangDung<L extends LoaiCauHinh>(l: L): BanCauHinh<L> {
  if (thamChieuDayDuKhiKiem.bat) return docDangDung().get(l) as BanCauHinh<L>;
  const so = trongRequest();
  const conn = db();
  let c = dangDungTheoKetNoi.get(conn);
  if (!c || c.so !== so || (so == null && Date.now() - c.luc > NHO_NGOAI_REQUEST_MS)) dangDungTheoKetNoi.set(conn, c = { so, luc: Date.now(), v: docDangDung() });
  return c.v.get(l) as BanCauHinh<L>;
}

export function cauHinhTheoId<L extends LoaiCauHinh>(l: L, id: number): BanCauHinh<L> | null {
  const doc = (): Ban | null => {
    const r = db().prepare('SELECT id, loai, du_lieu FROM cau_hinh_phien_ban WHERE id = ?').get(id) as { id: number; loai: string; du_lieu: string } | undefined;
    return r && r.loai === l ? { id: r.id, du_lieu: JSON.parse(r.du_lieu) } : null;
  };
  if (thamChieuDayDuKhiKiem.bat) return doc() as BanCauHinh<L> | null;
  const conn = db();
  let m = banTheoKetNoi.get(conn);
  if (!m) banTheoKetNoi.set(conn, m = new Map());
  if (!m.has(id)) m.set(id, doc());
  return m.get(id) as BanCauHinh<L> | null;
}

datNguonCauHinh({ hienTai: cauHinhDangDung, theoPb: cauHinhTheoId });

/** Phép kiểm / sau khi lưu: bỏ nhớ của kết nối hiện tại. */
export function quenNhoCauHinh(): void {
  dangDungTheoKetNoi.delete(db());
  banTheoKetNoi.delete(db());
}

// ---------------------------------------------------------------- màn Quản trị

export const xemDuocCauHinh = (p: Principal) => can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }) || laVaiQuanLy(p.roleKeys);
const suaDuocCauHinh = (p: Principal) => can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true });

/**
 * Số Case / PA / việc đang gắn mỗi mã Quản trị THÊM (`….m<n>`) — màn hiện "Đang dùng" và quyết Xoá / Ẩn. Mã gốc luôn coi là đang dùng (chỉ ẩn được)
 * nên không đếm. Một câu, đi chỉ mục theo mã (`idx_case_issue_ma`, `idx_iv_kind`, `idx_sca_kind`) — chỉ đọc dòng của mã thêm; chưa thêm mã nào → 0 câu.
 */
function demDangDung(ban: Map<LoaiCauHinh, Ban>): Record<string, number> {
  const ma = (l: LoaiCauHinh) => maCua(l, ban.get(l)!.du_lieu).filter(laMaThem);
  const dem = { case_issues: 'COUNT(DISTINCT case_id)', case_interventions: 'COUNT(*)', sos_coordination_actions: 'COUNT(*)' } as const;
  const dsMa = [ma('nguyen_nhan'), ma('phuong_an'), ma('moc_sos')];
  const phan = CHI_MUC_MA.map(([, b, c, dk], i) => ({ b, c, dk, ds: dsMa[i] })).filter((x) => x.ds.length);
  if (!phan.length) return {};
  const rows = db().prepare(phan.map(({ b, c, dk, ds }) => `SELECT ${c} AS ma, ${dem[b]} AS n FROM ${b} WHERE ${dk} AND ${c} IN (${ds.map(() => '?').join(',')}) GROUP BY ${c}`).join(' UNION ALL '))
    .all(...phan.flatMap((x) => x.ds)) as { ma: string; n: number }[];
  const r: Record<string, number> = {};
  for (const x of rows) r[x.ma] = (r[x.ma] ?? 0) + Number(x.n);
  return r;
}

type DongNhatKy = { id: number; loai: LoaiCauHinh; luc: string; nguoi: string | null; thayDoi: ThayDoi[]; khoiPhucTu: number | null };

export function xemCauHinh(p: Principal) {
  if (!xemDuocCauHinh(p)) throw forbidden('Chỉ Quản trị hệ thống và Quản lý xem được cấu hình Case & SOS.');
  const ban = docDangDung();
  const nhatKy = (db().prepare(
    `SELECT c.id, c.loai, c.tao_luc, c.thay_doi, c.khoi_phuc_tu, u.full_name AS ten FROM cau_hinh_phien_ban c LEFT JOIN users u ON u.id = c.nguoi_id
      WHERE c.loai IN (${LOAI_SQL}) ORDER BY c.id DESC LIMIT 30`,
  ).all() as any[]).map((r): DongNhatKy => ({
    id: r.id, loai: r.loai, luc: r.tao_luc, nguoi: r.ten ?? null, thayDoi: r.thay_doi ? JSON.parse(r.thay_doi) : [], khoiPhucTu: r.khoi_phuc_tu ?? null,
  }));
  return {
    nguyen_nhan: ban.get('nguyen_nhan')!, phuong_an: ban.get('phuong_an')!, moc_sos: ban.get('moc_sos')!,
    dangDung: demDangDung(ban), nhatKy, suaDuoc: suaDuocCauHinh(p),
  };
}

// ---------------------------------------------------------------- lưu

/** Mọi mã mục của một bản (để biết mục nào bị bỏ / mã mới cấp số mấy). */
function maCua(l: LoaiCauHinh, d: any): string[] {
  if (l === 'nguyen_nhan') return (['ft', 'thuong'] as const).flatMap((b) => Object.values((d as NguyenNhan)[b] ?? {}).flat().map((m) => m.ma));
  if (l === 'phuong_an') return (d as PhuongAn).muc.map((m) => m.ma);
  return (d as MocSos).viec.map((v) => v.ma);
}

/** Cấp mã cho mục mới (`ma` rỗng): `student.<nhánh>.m<n>` · `pa.m<n>` · `viec.m<n>`, n tăng theo mọi phiên bản đã có — không dùng lại mã. */
function capMa(l: LoaiCauHinh, d: any): void {
  const daCo = (db().prepare('SELECT du_lieu FROM cau_hinh_phien_ban WHERE loai = ?').all(l) as { du_lieu: string }[])
    .flatMap((r) => maCua(l, JSON.parse(r.du_lieu))).concat(maCua(l, d).filter(Boolean));
  let n = Math.max(0, ...daCo.map((m) => Number(m.match(/\.m(\d+)$/)?.[1] ?? 0)));
  const cap = (truoc: string) => `${truoc}.m${++n}`;
  if (l === 'nguyen_nhan') {
    for (const b of ['ft', 'thuong'] as const) for (const [k, ds] of Object.entries((d as NguyenNhan)[b] ?? {})) for (const m of ds ?? []) if (!m.ma) m.ma = cap(`student.${k}`);
  } else if (l === 'phuong_an') { for (const m of (d as PhuongAn).muc ?? []) if (!m.ma) m.ma = cap('pa'); }
  else for (const v of (d as MocSos).viec ?? []) if (!v.ma) v.ma = cap('viec');
}

/** Mục Quản trị thêm mà bản mới bỏ đi: chưa có gì dùng → bỏ được; đã dùng → lưu thẳng thì 400, Hoàn tác / Khôi phục thì giữ lại ở dạng ẩn. */
function daDung(l: LoaiCauHinh, ma: string): boolean {
  if (!laMaThem(ma)) return true;
  const conn = db();
  if (l === 'nguyen_nhan') {
    /* ponytail: ô nhận xét (assessment_scores) không có chỉ mục theo nhóm — chỉ quét khi XOÁ một nhóm Quản trị thêm mà chưa Case nào gắn (hiếm). */
    return !!conn.prepare('SELECT 1 FROM case_issues WHERE taxonomy_version > 1 AND taxonomy_code = ? LIMIT 1').get(ma)
      || !!conn.prepare(`SELECT 1 FROM assessment_scores WHERE nhom_nguyen_nhan LIKE ? LIMIT 1`).get(`%"${ma}"%`);
  }
  if (l === 'phuong_an') return paDaCoPa(ma) || soOMocCuaPa(cauHinh('moc_sos').du_lieu, ma) > 0;   // PA quy chế ở ô Mốc SOS đang dùng = đã dùng
  return !!conn.prepare('SELECT 1 FROM sos_coordination_actions WHERE pb_moc IS NOT NULL AND kind = ? LIMIT 1').get(ma);
}

/* ponytail: dòng mang mã Quản trị thêm luôn sinh từ bản ≥ 2 (con trỏ khác NULL) — đọc qua chỉ mục một phần `CHI_MUC_MA`. */
const paDaCoPa = (ma: string) => laMaThem(ma) ? !!db().prepare('SELECT 1 FROM case_interventions WHERE pb_loai IS NOT NULL AND kind = ? LIMIT 1').get(ma) : true;

function giuLaiDangAn(l: LoaiCauHinh, cu: any, moi: any, ma: string): void {
  if (l === 'nguyen_nhan') {
    for (const b of ['ft', 'thuong'] as const) for (const [k, ds] of Object.entries((cu as NguyenNhan)[b] ?? {})) {
      const m = ds?.find((x) => x.ma === ma);
      const dich = (moi as NguyenNhan)[b]?.[k as keyof NguyenNhan['ft']];
      if (m && dich && !dich.some((x) => x.ma === ma)) dich.splice(Math.max(0, dich.length - 1), 0, { ...m, an: true });   // trước "Khác"
    }
  } else if (l === 'phuong_an') {
    const m = (cu as PhuongAn).muc.find((x) => x.ma === ma);
    const ds = (moi as PhuongAn).muc;
    const khac = ds.findIndex((x) => laKhac(x.ma));
    /* Đang là PA quy chế ở ô Mốc SOS → giữ HIỆN (ô mốc không trỏ PA ẩn); không thì giữ ẩn. */
    if (m) ds.splice(khac < 0 ? ds.length : khac, 0, soOMocCuaPa(cauHinh('moc_sos').du_lieu, ma) ? { ...m, an: undefined } : { ...m, an: true });
  } else {
    const v = (cu as MocSos).viec.find((x) => x.ma === ma);
    if (v) (moi as MocSos).viec.push({ ...v, an: true });
  }
}

/** Hình tối thiểu trước khi cấp mã (danh sách là mảng mục có `ma` chuỗi) — chi tiết từng ô do `kiemCauHinh`. */
function hinhHopLe(l: LoaiCauHinh, d: any): boolean {
  const dsMuc = (ds: unknown) => Array.isArray(ds) && ds.every((m) => m && typeof m === 'object' && typeof (m as any).ma === 'string');
  if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
  if (l === 'nguyen_nhan') return (['ft', 'thuong'] as const).every((b) => d[b] && typeof d[b] === 'object' && Object.values(d[b]).every(dsMuc));
  if (l === 'phuong_an') return dsMuc(d.muc);
  return dsMuc(d.viec) && !!d.ft && typeof d.ft === 'object' && !!d.thuong && typeof d.thuong === 'object';
}

const TEN_LOAI: Record<LoaiCauHinh, string> = { nguyen_nhan: 'Nguyên nhân', phuong_an: 'Phương án', moc_sos: 'Mốc SOS' };
const VIEC_CHU: Record<ThayDoi['viec'], string> = { them: 'Thêm', sua: 'Sửa', an: 'Ẩn', hien: 'Hiện lại', xoa: 'Xoá', thu_tu: 'Đổi thứ tự', o_moc: 'Sửa ô' };
/** Cùng chữ với cột nhật ký của tab (web `chuDoi`). */
const chuThayDoi = (d: ThayDoi) => `${VIEC_CHU[d.viec]} · ${d.muc}${d.truoc || d.sau ? `: ${d.truoc ?? ''}${d.truoc && d.sau ? ' → ' : ''}${d.sau ?? ''}` : ''}`;

const idMoi = () => Math.max(Number((db().prepare('SELECT MAX(id) AS m FROM cau_hinh_phien_ban').get() as any)?.m ?? 0), 1) + 1;

/**
 * Lưu một lần đổi của danh sách `l`: `duLieu` (cả danh sách sau khi đổi) hoặc `khoiPhucTu` (Hoàn tác / Khôi phục — id phiên bản, 0 = bản gốc).
 * `tuPhienBan` (bắt buộc) = bản người sửa đang thấy — khác bản đang dùng → 409, không đè bản người khác vừa lưu. Giống hệt bản đang dùng → không thêm bản.
 */
export function luuCauHinh(p: Principal, loai: unknown, input: { duLieu?: unknown; khoiPhucTu?: unknown; tuPhienBan?: unknown }) {
  if (!suaDuocCauHinh(p)) throw forbidden('Chỉ Quản trị hệ thống sửa được cấu hình Case & SOS.');
  if (!(LOAI_CAU_HINH as readonly unknown[]).includes(loai)) throw badRequest('Danh sách cấu hình không hợp lệ.');
  const l = loai as LoaiCauHinh;
  if (!Number.isInteger(input.tuPhienBan)) throw badRequest('Thiếu phiên bản đang sửa — tải lại rồi sửa lại.');
  if ((input.duLieu === undefined) === (input.khoiPhucTu === undefined)) throw badRequest('Gửi danh sách mới hoặc phiên bản cần khôi phục (một trong hai).');
  const r = tx(() => {
    const ht = docDangDung().get(l)!;
    if (input.tuPhienBan !== ht.id) throw conflict('Vừa có người khác sửa danh sách này — tải lại để xem bản mới rồi sửa tiếp.');
    let moi: any;
    let khoiPhucTu: number | null = null;
    if (input.khoiPhucTu !== undefined) {
      const id = input.khoiPhucTu;
      if (!Number.isInteger(id) || (id as number) < 0) throw badRequest('Phiên bản cần khôi phục không hợp lệ.');
      const b = id === 0 ? { du_lieu: cauHinhGoc()[l] } : cauHinhTheoId(l, id as number);
      if (!b) throw badRequest('Không tìm thấy phiên bản cần khôi phục.');
      moi = JSON.parse(JSON.stringify(b.du_lieu));
      khoiPhucTu = id as number;
    } else {
      moi = JSON.parse(JSON.stringify(input.duLieu ?? null));
      if (!hinhHopLe(l, moi)) throw badRequest('Dữ liệu cấu hình không hợp lệ.');
      capMa(l, moi);
    }
    const boDi = maCua(l, ht.du_lieu).filter((ma) => !maCua(l, moi).includes(ma));
    for (const ma of boDi) {
      if (!daDung(l, ma)) continue;
      if (khoiPhucTu === null) {
        const so = l === 'phuong_an' ? soOMocCuaPa(cauHinh('moc_sos').du_lieu, ma) : 0;
        if (so) throw loiHttp(400, 'Phương án đang ở {n} ô Mốc SOS — bỏ khỏi ô trước, rồi mới xoá.', { n: so });
        throw badRequest('Mục đã có Case / ô nhận xét / việc dùng — chỉ ẩn được, không xoá.');
      }
      giuLaiDangAn(l, ht.du_lieu, moi, ma);
    }
    /* PA đã có PA dùng: khoá cách chạy (nhóm · có người dạy · đếm số buổi) — PA cũ đọc cờ của bản đang dùng; chỉ đổi tên / thứ tự / ẩn.
       Lưu thẳng → 400; Hoàn tác / Khôi phục → giữ cờ của bản đang dùng. */
    if (l === 'phuong_an') {
      const cuMuc = new Map((ht.du_lieu as PhuongAn).muc.map((m) => [m.ma, m]));
      for (const m of (moi as PhuongAn).muc) {
        const c = cuMuc.get(m.ma);
        if (!c || !laMaThem(m.ma) || (c.nhom === m.nhom && c.nguoiDay === m.nguoiDay && c.soBuoi === m.soBuoi) || !paDaCoPa(m.ma)) continue;
        if (khoiPhucTu === null) throw loiHttp(400, '"{ten}" đã có PA dùng — chỉ đổi tên, thứ tự, ẩn được.', { ten: m.ten });
        Object.assign(m, { nhom: c.nhom, nguoiDay: c.nguoiDay, soBuoi: c.soBuoi });
      }
    }
    const loi = kiemCauHinh(l, moi);
    if (loi.length) throw badRequest(loi[0].loi, { loi });
    const doi = thayDoi(l, ht.du_lieu as DuLieuCauHinh[typeof l], moi);
    if (!doi.length) return { truoc: ht.id, moi: false };
    const id = idMoi();
    try {
      db().prepare('INSERT INTO cau_hinh_phien_ban (id, loai, du_lieu, thay_doi, khoi_phuc_tu, nguoi_id, tao_luc) VALUES (?,?,?,?,?,?,?)')
        .run(id, l, JSON.stringify(moi), JSON.stringify(doi), khoiPhucTu, p.userId, nowIso());
    } catch (e: any) {
      /* Hai lần lưu cùng lúc (hai tiến trình) lấy cùng MAX(id) + 1 → lần sau trùng khoá: báo như sửa đè. */
      if (/UNIQUE|PRIMARY KEY/i.test(String(e?.message))) throw conflict('Vừa có người khác sửa danh sách này — tải lại để xem bản mới rồi sửa tiếp.');
      throw e;
    }
    writeAudit({
      actorUserId: p.userId, action: `cau_hinh_case_sos.${khoiPhucTu === null ? 'sua' : 'khoi_phuc'}`, entityType: 'cau_hinh_phien_ban', entityId: id,
      /* Nhật ký chung đọc trường không gạch dưới: một dòng "Thay đổi" dễ đọc; chi tiết (máy đọc) để ở khoá `_…`. */
      entityLabel: `Case & SOS · ${TEN_LOAI[l]}`, before: { _phienBan: ht.id },
      after: { 'Thay đổi': doi.map(chuThayDoi).join(' · '), _thayDoi: doi, ...(khoiPhucTu !== null ? { _khoiPhucTu: khoiPhucTu } : {}) },
    });
    return { truoc: ht.id, moi: true };
  });
  quenNhoCauHinh();
  /* `truoc` = phiên bản ngay trước lần lưu — web gắn vào nút Hoàn tác của toast. */
  return { ...xemCauHinh(p), truoc: r.truoc };
}
