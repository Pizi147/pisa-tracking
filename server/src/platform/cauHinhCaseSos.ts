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
  LOAI_CAU_HINH, PERMISSIONS, cauHinhGoc, datNguonCauHinh, kiemCauHinh, laKhac, laVaiQuanLy, thayDoi,
  type BanCauHinh, type DuLieuCauHinh, type LoaiCauHinh, type MocSos, type NguyenNhan, type PhuongAn, type ThayDoi,
} from '../../../shared/domain/index.ts';
import { badRequest, conflict, forbidden, nowIso } from '../util.ts';
import { writeAudit } from './audit.ts';
import { layMoc } from './nguCanhRequest.ts';
import { thamChieuDayDuKhiKiem, type MocHeThong } from './mocHeThong.ts';

/** Cùng câu ở `schema.sql` (migrate `prCauHinhCaseSos` chạy câu này). `IF NOT EXISTS`: mục khác của Quản trị có thể đã tạo bảng. */
export const DDL_CAU_HINH_PHIEN_BAN = `CREATE TABLE IF NOT EXISTS cau_hinh_phien_ban (
  id INTEGER PRIMARY KEY,
  loai TEXT NOT NULL,
  du_lieu TEXT NOT NULL,
  thay_doi TEXT,
  khoi_phuc_tu INTEGER,
  nguoi_id INTEGER REFERENCES users(id),
  tao_luc TEXT NOT NULL
)`;
export const DDL_CAU_HINH_PHIEN_BAN_IDX = 'CREATE INDEX IF NOT EXISTS idx_chpb_loai ON cau_hinh_phien_ban(loai, id)';

type Ban = BanCauHinh;
const LOAI_SQL = LOAI_CAU_HINH.map((l) => `'${l}'`).join(',');

function docDangDung(): Map<LoaiCauHinh, Ban> {
  const rows = db().prepare(
    `SELECT id, loai, du_lieu FROM cau_hinh_phien_ban WHERE id IN (SELECT MAX(id) FROM cau_hinh_phien_ban WHERE loai IN (${LOAI_SQL}) GROUP BY loai)`,
  ).all() as { id: number; loai: LoaiCauHinh; du_lieu: string }[];
  const m = new Map<LoaiCauHinh, Ban>();
  for (const l of LOAI_CAU_HINH) m.set(l, { id: 0, du_lieu: cauHinhGoc()[l] });
  for (const r of rows) m.set(r.loai, { id: r.id, du_lieu: JSON.parse(r.du_lieu) });
  return m;
}

/** Theo kết nối (như `nhoThamChieu`): phép kiểm đổi kết nối / DB chép lại không thấy nhớ của kết nối cũ. */
const dangDungTheoKetNoi = new WeakMap<object, { so: number | null; v: Map<LoaiCauHinh, Ban> }>();
const banTheoKetNoi = new WeakMap<object, Map<number, Ban | null>>();
const trongRequest = (): number | null => (layMoc() as MocHeThong | undefined)?.thamChieu ?? null;

/**
 * Trong request: khoá bằng mốc tham chiếu (tiến trình khác sửa → số đổi → đọc lại). NGOÀI request (phép kiểm, lệnh ops, việc nền): nhớ theo kết nối tới khi
 * chính máy chủ này ghi cấu hình (`luuCauHinh` → `quenNhoCauHinh`) — không đọc lại mỗi lần tra nhãn trong một vòng tạo 80 Case.
 * ponytail: việc nền chạy ngoài request ở tiến trình khác không thấy lần sửa từ tiến trình khác tới khi tiến trình đó khởi động lại; dùng mốc tham chiếu nếu việc nền tạo Case.
 */
export function cauHinhDangDung<L extends LoaiCauHinh>(l: L): BanCauHinh<L> {
  if (thamChieuDayDuKhiKiem.bat) return docDangDung().get(l) as BanCauHinh<L>;
  const so = trongRequest();
  const conn = db();
  let c = dangDungTheoKetNoi.get(conn);
  if (!c || c.so !== so) dangDungTheoKetNoi.set(conn, c = { so, v: docDangDung() });
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

/** Số Case / PA / việc đang gắn mỗi mã (một câu) — màn hiện "Đang dùng" và quyết Xoá / Ẩn. */
function demDangDung(): Record<string, number> {
  const rows = db().prepare(
    `SELECT taxonomy_code AS ma, COUNT(DISTINCT case_id) AS n FROM case_issues GROUP BY taxonomy_code
     UNION ALL SELECT kind, COUNT(*) FROM case_interventions GROUP BY kind
     UNION ALL SELECT kind, COUNT(*) FROM sos_coordination_actions GROUP BY kind`,
  ).all() as { ma: string; n: number }[];
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
    dangDung: demDangDung(), nhatKy, suaDuoc: suaDuocCauHinh(p),
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
  const conn = db();
  if (l === 'nguyen_nhan') {
    return !!conn.prepare('SELECT 1 FROM case_issues WHERE taxonomy_code = ? LIMIT 1').get(ma)
      || !!conn.prepare(`SELECT 1 FROM assessment_scores WHERE nhom_nguyen_nhan LIKE ? LIMIT 1`).get(`%"${ma}"%`);
  }
  if (l === 'phuong_an') return !!conn.prepare('SELECT 1 FROM case_interventions WHERE kind = ? LIMIT 1').get(ma);
  return !!conn.prepare('SELECT 1 FROM sos_coordination_actions WHERE kind = ? LIMIT 1').get(ma);
}

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
    if (m) ds.splice(khac < 0 ? ds.length : khac, 0, { ...m, an: true });
  } else {
    const v = (cu as MocSos).viec.find((x) => x.ma === ma);
    if (v) (moi as MocSos).viec.push({ ...v, an: true });
  }
}

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
      if (!moi || typeof moi !== 'object') throw badRequest('Dữ liệu cấu hình không hợp lệ.');
      capMa(l, moi);
    }
    const boDi = maCua(l, ht.du_lieu).filter((ma) => !maCua(l, moi).includes(ma));
    for (const ma of boDi) {
      if (!daDung(l, ma)) continue;
      if (khoiPhucTu === null) throw badRequest('Mục đã có Case / ô nhận xét / việc dùng — chỉ ẩn được, không xoá.');
      giuLaiDangAn(l, ht.du_lieu, moi, ma);
    }
    const loi = kiemCauHinh(l, moi);
    if (loi.length) throw badRequest(loi[0].loi, { loi });
    const doi = thayDoi(l, ht.du_lieu as DuLieuCauHinh[typeof l], moi);
    if (!doi.length) return { truoc: ht.id, moi: false };
    const id = idMoi();
    db().prepare('INSERT INTO cau_hinh_phien_ban (id, loai, du_lieu, thay_doi, khoi_phuc_tu, nguoi_id, tao_luc) VALUES (?,?,?,?,?,?,?)')
      .run(id, l, JSON.stringify(moi), JSON.stringify(doi), khoiPhucTu, p.userId, nowIso());
    writeAudit({
      actorUserId: p.userId, action: `cau_hinh_case_sos.${khoiPhucTu === null ? 'sua' : 'khoi_phuc'}`, entityType: 'cau_hinh_phien_ban', entityId: id,
      entityLabel: `Case & SOS · ${l}`, before: { phienBan: ht.id }, after: { thayDoi: doi, ...(khoiPhucTu !== null ? { khoiPhucTu } : {}) },
    });
    return { truoc: ht.id, moi: true };
  });
  quenNhoCauHinh();
  /* `truoc` = phiên bản ngay trước lần lưu — web gắn vào nút Hoàn tác của toast. */
  return { ...xemCauHinh(p), truoc: r.truoc };
}
