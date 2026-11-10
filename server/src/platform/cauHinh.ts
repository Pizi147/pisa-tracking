/**
 * QTV2-HAN — CẤU HÌNH CÓ PHIÊN BẢN (bảng chung `cau_hinh_phien_ban`, PTA chốt 11/11 — CAU-HINH-CASE-SOS dùng cùng bảng, `loai` khác).
 * Mỗi lần lưu (sửa, Hoàn tác, khôi phục) = MỘT dòng mới, không sửa / xoá dòng cũ. Bảng rỗng = bản gốc trong mã (`HAN_MAC_DINH_GOC`).
 * `tao_luc` = đồng hồ nghiệp vụ (`nowNghiepVu`) — cùng đồng hồ với mốc của việc ⇒ "chỉ áp cho việc sinh sau" (`hanTai`, shared/domain/hanMacDinh.ts).
 * Quyền: Quản trị hệ thống sửa (`ADMIN_CONFIG`); Quản trị + Quản lý xem (`xemDuocBangQuyDoi`).
 * Đọc ít: danh sách bản nhớ theo kết nối, làm mới khi `moc_he_thong.tham-chieu` đổi (trigger trên bảng này) hoặc ngay sau lưu — 0 câu / request khi không ai sửa.
 */
import { db } from '../db.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { HAN_MAC_DINH_GOC, MA_HAN, PERMISSIONS, datNguonHan, kiemHanMacDinh, type BanHan, type HanMacDinh } from '../../../shared/domain/index.ts';
import { badRequest, conflict, forbidden } from '../util.ts';
import { nowNghiepVu } from '../demoConfig.ts';
import { writeAudit } from './audit.ts';
import { layMoc } from './nguCanhRequest.ts';
import { xemDuocBangQuyDoi } from './bangQuyDoi.ts';

/** Cùng câu ở `schema.sql` (migrate `prCauHinhPhienBan` chạy các câu này). */
export const DDL_CAU_HINH_PHIEN_BAN = [
  `CREATE TABLE IF NOT EXISTS cau_hinh_phien_ban (
    id INTEGER PRIMARY KEY,
    loai TEXT NOT NULL,
    du_lieu TEXT NOT NULL,
    thay_doi TEXT,
    khoi_phuc_tu INTEGER,
    nguoi_id INTEGER REFERENCES users(id),
    tao_luc TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_chpb_loai ON cau_hinh_phien_ban(loai, id)',
  ...(['INSERT', 'UPDATE', 'DELETE'] as const).map((v) => `CREATE TRIGGER IF NOT EXISTS tg_tc_cau_hinh_phien_ban_${v.slice(0, 3).toLowerCase()} AFTER ${v} ON cau_hinh_phien_ban
    BEGIN UPDATE moc_he_thong SET so = so + 1 WHERE khoa = 'tham-chieu'; END`),
];

const LOAI_HAN = 'han_mac_dinh';
type Dong = { id: number; du_lieu: string; thay_doi: string | null; khoi_phuc_tu: number | null; tao_luc: string; ten?: string | null };

/** Bản đã lưu (cũ → mới) ghép lên bản gốc theo từng khoá — bản cũ thiếu khoá mới thì lấy gốc. */
function docDsHan(): BanHan[] {
  let rows: Dong[] = [];
  try { rows = db().prepare('SELECT id, du_lieu, tao_luc FROM cau_hinh_phien_ban WHERE loai = ? ORDER BY id').all(LOAI_HAN) as Dong[]; } catch { rows = []; }   // DB chưa migrate
  const goc = HAN_MAC_DINH_GOC as unknown as HanMacDinh;
  return [{ id: 0, tu: '', han: goc }, ...rows.map((r) => ({ id: r.id, tu: r.tao_luc, han: { ...goc, ...(JSON.parse(r.du_lieu) as HanMacDinh) } }))];
}

const nhoTheoKetNoi = new WeakMap<object, { so: number | null; ds: BanHan[] }>();
/** Danh sách bản, nhớ theo kết nối: trong request có phiên → làm mới khi mốc `tham-chieu` đổi; ngoài request → tới khi `xoaNhoHan` (sau lưu). */
export function dsBanHan(): BanHan[] {
  const conn = db();
  const so = (layMoc() as { thamChieu?: number } | undefined)?.thamChieu ?? null;
  const c = nhoTheoKetNoi.get(conn);
  if (c && (so === null || c.so === so)) return c.ds;
  const ds = docDsHan();
  nhoTheoKetNoi.set(conn, { so, ds });
  return ds;
}
export const xoaNhoHan = () => { nhoTheoKetNoi.delete(db()); };
/* Nạp mô-đun này (routes) = mọi hàm hạn dùng chung đọc bản trong DB. */
datNguonHan(dsBanHan);

const banMoiNhat = (): BanHan => dsBanHan().at(-1)!;

/** GET /admin/cau-hinh/han — bản đang dùng + 30 lần đổi gần nhất (ai · lúc · đổi gì). */
export function xemHanMacDinh(p: Principal) {
  if (!xemDuocBangQuyDoi(p)) throw forbidden('Chỉ Quản trị hệ thống và Quản lý xem được hạn mặc định.');
  const hien = banMoiNhat();
  const ds = db().prepare(
    `SELECT b.id, b.thay_doi, b.khoi_phuc_tu, b.tao_luc, u.full_name AS ten FROM cau_hinh_phien_ban b LEFT JOIN users u ON u.id = b.nguoi_id
      WHERE b.loai = ? ORDER BY b.id DESC LIMIT 30`,
  ).all(LOAI_HAN) as Dong[];
  return {
    id: hien.id, han: hien.han, goc: HAN_MAC_DINH_GOC, suaDuoc: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
    lichSu: ds.map((r) => ({ id: r.id, luc: r.tao_luc, nguoi: r.ten ?? null, khoiPhucTu: r.khoi_phuc_tu, doi: r.thay_doi ? JSON.parse(r.thay_doi) : [] })),
  };
}

/** Các trường khác nhau giữa hai bản: `[{ ma, truong, truoc, sau }]` — nhật ký + chữ Hoàn tác. */
function khac(cu: HanMacDinh, moi: HanMacDinh) {
  const r: { ma: string; truong: string; truoc: number; sau: number }[] = [];
  for (const ma of MA_HAN) for (const [k, v] of Object.entries(moi[ma])) {
    const t = (cu[ma] as Record<string, number>)[k];
    if (t !== v) r.push({ ma, truong: k, truoc: t, sau: v as number });
  }
  return r;
}

/**
 * PUT /admin/cau-hinh/han { han, tuPhienBan, khoiPhucTu? } — lưu một bản mới (có hiệu lực ngay cho việc sinh sau). `tuPhienBan` = bản người sửa đang
 * thấy; khác bản đang dùng → 409 (người khác vừa sửa — tải lại, không đè). Giống hệt bản đang dùng → không thêm bản.
 */
export function luuHanMacDinh(p: Principal, input: { han?: unknown; tuPhienBan?: unknown; khoiPhucTu?: unknown }) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống sửa được hạn mặc định.');
  const loi = kiemHanMacDinh(input.han);
  if (loi) throw badRequest(loi.loi, { o: loi.ma });
  const hien = banMoiNhat();
  if (Number(input.tuPhienBan) !== hien.id) throw conflict('Vừa có người sửa hạn mặc định — tải lại rồi sửa tiếp.');
  const moi = input.han as HanMacDinh;
  const doi = khac(hien.han, moi);
  if (doi.length === 0) return { id: hien.id, doi };
  const khoiPhucTu = input.khoiPhucTu == null ? null : Number(input.khoiPhucTu);
  const id = Number(db().prepare(
    'INSERT INTO cau_hinh_phien_ban (loai, du_lieu, thay_doi, khoi_phuc_tu, nguoi_id, tao_luc) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(LOAI_HAN, JSON.stringify(moi), JSON.stringify(doi), Number.isFinite(khoiPhucTu) ? khoiPhucTu : null, p.userId, nowNghiepVu()).lastInsertRowid);
  writeAudit({
    actorUserId: p.userId, action: khoiPhucTu ? 'cau_hinh.han_mac_dinh.khoi_phuc' : 'cau_hinh.han_mac_dinh.sua', entityType: 'cau_hinh.han_mac_dinh', entityId: id,
    entityLabel: 'Hạn mặc định',
    before: Object.fromEntries(doi.map((d) => [`${d.ma}.${d.truong}`, d.truoc])), after: Object.fromEntries(doi.map((d) => [`${d.ma}.${d.truong}`, d.sau])),
  });
  xoaNhoHan();
  return { id, doi, truocId: hien.id, truocHan: hien.han };
}
