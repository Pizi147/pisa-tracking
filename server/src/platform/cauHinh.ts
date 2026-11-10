/**
 * QTV2-HAN / QTV2-BAND — CẤU HÌNH CÓ PHIÊN BẢN (bảng chung `cau_hinh_phien_ban`, PTA chốt 11/11 — CAU-HINH-CASE-SOS dùng cùng bảng, `loai` khác).
 * Ba loại ở đây, MỘT lõi (`taoLoai`): Hạn mặc định (`han_mac_dinh`), Kỳ vọng MT FT (`ky_vong_ft`), Ngưỡng lớp thường (`nguong_thuong`).
 * Mỗi lần lưu (sửa, Hoàn tác, khôi phục) = MỘT dòng mới, không sửa / xoá dòng cũ. Bảng rỗng = bản gốc trong mã.
 * `tao_luc` = đồng hồ nghiệp vụ (`nowNghiepVu`) — cùng đồng hồ với mốc của việc ⇒ "chỉ áp cho cái sinh sau" (`banTaiMoc`, shared/domain/phienBan.ts).
 * Quyền: Quản trị hệ thống sửa (`ADMIN_CONFIG`); Quản trị + Quản lý xem (`xemDuocBangQuyDoi`).
 * Đọc ít: danh sách bản nhớ theo kết nối, làm mới khi `moc_he_thong.tham-chieu` đổi (trigger trên bảng này) hoặc ngay sau lưu — 0 câu / request khi không ai sửa.
 */
import { db } from '../db.ts';
import { can, require_, type Principal } from '../permissions.ts';
import {
  HAN_MAC_DINH_GOC, KY_VONG_FT_GOC, MA_HAN, NGUONG_THUONG_GOC, PERMISSIONS, TEN_KY_VONG_FT, TEN_NGUONG_THUONG, datNguonBand, datNguonHan, kiemHanMacDinh,
  kiemKyVongFt, kiemNguongThuong, ngayTheoGioVN, nhanTruongHan, type BanCauHinh, type HanMacDinh, type KyVongFt, type MaHan, type NguongThuong,
} from '../../../shared/domain/index.ts';
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

type Dong = { id: number; du_lieu: string; thay_doi: string | null; khoi_phuc_tu: number | null; tao_luc: string; ten?: string | null };
type Doi = { ma: string; truong: string; truoc: number; sau: number };

/** Một loại cấu hình: gốc trong mã, ghép bản lưu lên gốc (bản cũ thiếu khoá mới lấy gốc), kiểm, so khác, tên trường cho nhật ký. */
type DinhNghia<T> = {
  loai: string; ten: string; goc: T; ghep: (goc: T, du: any) => T; kiem: (v: unknown) => { ma: string | null; loi: string } | null;
  khac: (cu: T, moi: T) => Doi[]; nhan: (d: Doi) => string;
};

function taoLoai<T>(d: DinhNghia<T>) {
  const entityType = `cau_hinh.${d.loai}`;
  /** Bản đã lưu (cũ → mới). `tu` = NGÀY giờ VN của lần lưu (lưu 00:00–06:59 sáng VN không áp ngược cho hôm trước). Dòng hỏng bỏ qua. */
  const doc = (): BanCauHinh<T>[] => {
    let rows: Dong[] = [];
    try { rows = db().prepare('SELECT id, du_lieu, tao_luc FROM cau_hinh_phien_ban WHERE loai = ? ORDER BY id').all(d.loai) as Dong[]; } catch { rows = []; }   // DB chưa migrate
    const ds: BanCauHinh<T>[] = [{ id: 0, tu: '', v: d.goc }];
    for (const r of rows) {
      let du: unknown;
      try { du = JSON.parse(r.du_lieu); } catch { console.error('[cau-hinh] bản hỏng', d.loai, r.id); continue; }
      ds.push({ id: r.id, tu: ngayTheoGioVN(r.tao_luc) ?? r.tao_luc.slice(0, 10), v: d.ghep(d.goc, du ?? {}) });
    }
    return ds;
  };
  const nho = new WeakMap<object, { so: number | null; ds: BanCauHinh<T>[] }>();
  /** Nhớ theo kết nối: trong request có phiên → làm mới khi mốc `tham-chieu` đổi; ngoài request → tới khi `xoaNho` (sau lưu; hàm định kỳ gọi đầu lượt). */
  const ds = (): BanCauHinh<T>[] => {
    const conn = db();
    const so = (layMoc() as { thamChieu?: number } | undefined)?.thamChieu ?? null;
    const c = nho.get(conn);
    if (c && (so === null || c.so === so)) return c.ds;
    const moi = doc();
    nho.set(conn, { so, ds: moi });
    return moi;
  };
  const xoaNho = () => { nho.delete(db()); };
  const moiNhat = () => ds().at(-1)!;

  /** Bản đang dùng + 30 lần đổi gần nhất (ai · lúc · đổi gì). QT + QL xem. */
  const xem = (p: Principal) => {
    if (!xemDuocBangQuyDoi(p)) throw forbidden(`Chỉ Quản trị hệ thống và Quản lý xem được ${d.ten}.`);
    const hien = moiNhat();
    const rows = db().prepare(
      `SELECT b.id, b.thay_doi, b.khoi_phuc_tu, b.tao_luc, u.full_name AS ten FROM cau_hinh_phien_ban b LEFT JOIN users u ON u.id = b.nguoi_id
        WHERE b.loai = ? ORDER BY b.id DESC LIMIT 30`,
    ).all(d.loai) as Dong[];
    return {
      id: hien.id, v: hien.v, goc: d.goc, suaDuoc: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
      lichSu: rows.map((r) => ({ id: r.id, luc: r.tao_luc, nguoi: r.ten ?? null, khoiPhucTu: r.khoi_phuc_tu, doi: r.thay_doi ? JSON.parse(r.thay_doi) : [] })),
    };
  };

  /**
   * Lưu một bản mới (hiệu lực ngay cho cái sinh sau). `tuPhienBan` = bản người sửa đang thấy; khác bản đang dùng → 409 (không đè). Giống hệt → không
   * thêm bản. Chỉ Quản trị hệ thống (`ADMIN_CONFIG`).
   */
  const luu = (p: Principal, input: { giaTri?: unknown; tuPhienBan?: unknown; khoiPhucTu?: unknown }) => {
    require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, `Chỉ Quản trị hệ thống sửa được ${d.ten}.`);
    const loi = d.kiem(input.giaTri);
    if (loi) throw badRequest(loi.loi, { o: loi.ma });
    const hien = moiNhat();
    if (Number(input.tuPhienBan) !== hien.id) throw conflict(`Vừa có người sửa ${d.ten} — tải lại rồi sửa tiếp.`);
    const moi = input.giaTri as T;
    const doi = d.khac(hien.v, moi);
    if (doi.length === 0) return { id: hien.id, doi, truocId: hien.id, truocGiaTri: hien.v };
    const khoiPhucTu = input.khoiPhucTu == null ? null : Number(input.khoiPhucTu);
    const id = Number(db().prepare(
      'INSERT INTO cau_hinh_phien_ban (loai, du_lieu, thay_doi, khoi_phuc_tu, nguoi_id, tao_luc) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(d.loai, JSON.stringify(moi), JSON.stringify(doi), Number.isFinite(khoiPhucTu) ? khoiPhucTu : null, p.userId, nowNghiepVu()).lastInsertRowid);
    writeAudit({
      actorUserId: p.userId, action: `${entityType}.${khoiPhucTu != null ? 'khoi_phuc' : 'sua'}`, entityType, entityId: id, entityLabel: d.ten,
      before: Object.fromEntries(doi.map((x) => [d.nhan(x), x.truoc])), after: Object.fromEntries(doi.map((x) => [d.nhan(x), x.sau])),
    });
    xoaNho();
    return { id, doi, truocId: hien.id, truocGiaTri: hien.v };
  };
  return { ds, xoaNho, xem, luu, entityType };
}

/** So hai bản phẳng `{ truong: số }` — `ma` = trường. */
const khacPhang = <T extends Record<string, number>>(cu: T, moi: T): Doi[] =>
  Object.keys(moi).filter((k) => cu[k] !== moi[k]).map((k) => ({ ma: k, truong: '', truoc: cu[k], sau: moi[k] }));

const HAN = taoLoai<HanMacDinh>({
  loai: 'han_mac_dinh', ten: 'hạn mặc định', goc: HAN_MAC_DINH_GOC as unknown as HanMacDinh, kiem: kiemHanMacDinh,
  /* Ghép theo từng hạn VÀ từng trường. */
  ghep: (goc, du) => Object.fromEntries(MA_HAN.map((ma) => [ma, { ...goc[ma], ...(du[ma] ?? {}) }])) as HanMacDinh,
  khac: (cu, moi) => {
    const r: Doi[] = [];
    for (const ma of MA_HAN) for (const [k, v] of Object.entries(moi[ma])) {
      const t = (cu[ma] as Record<string, number>)[k];
      if (t !== v) r.push({ ma, truong: k, truoc: t, sau: v as number });
    }
    return r;
  },
  nhan: (x) => nhanTruongHan(x.ma as MaHan, x.truong),
});
const KY_VONG = taoLoai<KyVongFt>({
  loai: 'ky_vong_ft', ten: 'kỳ vọng MT Fast Track', goc: { ...KY_VONG_FT_GOC }, kiem: kiemKyVongFt,
  ghep: (goc, du) => ({ ...goc, ...du }), khac: khacPhang, nhan: (x) => TEN_KY_VONG_FT[x.ma as keyof KyVongFt] ?? x.ma,
});
const NGUONG = taoLoai<NguongThuong>({
  loai: 'nguong_thuong', ten: 'ngưỡng lớp thường', goc: { ...NGUONG_THUONG_GOC }, kiem: kiemNguongThuong,
  ghep: (goc, du) => ({ ...goc, ...du }), khac: khacPhang, nhan: (x) => TEN_NGUONG_THUONG[x.ma as keyof NguongThuong] ?? x.ma,
});
/* Nạp mô-đun này (routes, hàm định kỳ) = mọi hàm luật dùng chung đọc bản trong DB. */
datNguonHan(HAN.ds);
datNguonBand(KY_VONG.ds, NGUONG.ds);

/** Các bản cho phiên đăng nhập (web tính cùng hàm). 0 câu khi không ai sửa. */
export const dsBanHan = HAN.ds;
export const dsBanKyVong = KY_VONG.ds;
export const dsBanNguong = NGUONG.ds;
/**
 * SQL: ngưỡng Mini Test (tỉ lệ) theo bản tại ngày làm (`cot` = cột ngày, vd `m.ngay_lam`) — CASE từ bản mới về cũ. Chỉ chèn số và ngày
 * `YYYY-MM-DD` đã kiểm (bản lưu qua `kiemNguongThuong`, `tu` từ `ngayTheoGioVN`) — không có chữ người dùng.
 */
export function sqlNguongMiniTest(cot: string): string {
  const ds = NGUONG.ds();
  const so = (n: number) => { const x = Number(n) / 100; if (!Number.isFinite(x)) throw new Error('ngưỡng hỏng'); return String(x); };
  const nhanh = ds.slice(1).reverse().filter((b) => /^\d{4}-\d{2}-\d{2}$/.test(b.tu)).map((b) => `WHEN ${cot} >= '${b.tu}' THEN ${so(b.v.miniTest)}`);
  return nhanh.length ? `(CASE ${nhanh.join(' ')} ELSE ${so(ds[0].v.miniTest)} END)` : so(ds[0].v.miniTest);
}
/** Xoá nhớ của cả ba loại (lần lưu ở lambda khác không xoá được nhớ của lambda này — hàm định kỳ gọi đầu mỗi lượt). */
export const xoaNhoHan = () => { HAN.xoaNho(); KY_VONG.xoaNho(); NGUONG.xoaNho(); };

/** GET /admin/cau-hinh/han — giữ dạng `{ id, han, goc, suaDuoc, lichSu }` (màn Hạn mặc định). */
export function xemHanMacDinh(p: Principal) { const x = HAN.xem(p); return { ...x, han: x.v }; }
/** PUT /admin/cau-hinh/han { han, tuPhienBan, khoiPhucTu? } → `{ id, doi, truocId, truocHan }`. */
export function luuHanMacDinh(p: Principal, input: { han?: unknown; tuPhienBan?: unknown; khoiPhucTu?: unknown }) {
  const r = HAN.luu(p, { giaTri: input.han, tuPhienBan: input.tuPhienBan, khoiPhucTu: input.khoiPhucTu });
  return { id: r.id, doi: r.doi, truocId: r.truocId, truocHan: r.truocGiaTri };
}

/** QTV2-BAND: GET/PUT /admin/cau-hinh/ky-vong-ft · /admin/cau-hinh/nguong-thuong — `{ id, v, goc, suaDuoc, lichSu }`; PUT `{ giaTri, tuPhienBan, khoiPhucTu? }`. */
const LOAI_BAND: Record<string, { xem: (p: Principal) => unknown; luu: (p: Principal, i: { giaTri?: unknown; tuPhienBan?: unknown; khoiPhucTu?: unknown }) => unknown }> = {
  'ky-vong-ft': KY_VONG, 'nguong-thuong': NGUONG,
};
const loaiBand = (loai: string) => {
  if (!Object.hasOwn(LOAI_BAND, loai)) throw badRequest('Không có mục cấu hình này.');
  return LOAI_BAND[loai];
};
export const xemBand = (p: Principal, loai: string) => loaiBand(loai).xem(p);
export const luuBand = (p: Principal, loai: string, input: { giaTri?: unknown; tuPhienBan?: unknown; khoiPhucTu?: unknown }) => loaiBand(loai).luu(p, input);
