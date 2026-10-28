/**
 * BAND-QUY-DOI (chủ SP 28/10) — BẢNG QUY ĐỔI số câu đúng → band (L / R) là dữ liệu, Quản trị sửa được.
 *
 * Mỗi lần lưu (sửa, Hoàn tác, khôi phục) thêm MỘT phiên bản, không sửa / xoá phiên bản cũ; bảng đang dùng = phiên bản mới nhất. Chưa có phiên bản
 * nào → bảng gốc (`BANG_QUY_DOI_GOC`, phiên bản 0). Band được LƯU kèm điểm lúc ghi (`saveScore`), nên đổi bảng chỉ áp cho điểm nhập SAU đó —
 * điểm đã có giữ band (SOS / Case / kết quả không đổi). Quyền: Quản trị hệ thống (`admin.config`) sửa; Quản lý xem; mọi người đăng nhập đọc bảng
 * đang dùng (`/ref/bang-quy-doi` — hộp nhập điểm xem trước band).
 */
import { db, tx } from '../db.ts';
import { can, type Principal } from '../permissions.ts';
import { BANG_QUY_DOI_GOC, PERMISSIONS, kiemBangQuyDoi, laVaiQuanLy, type BangQuyDoi } from '../../../shared/domain/index.ts';
import { badRequest, chuTuDo, conflict, forbidden, nowIso } from '../util.ts';
import { writeAudit } from './audit.ts';

/** Cùng câu ở cuối `schema.sql` (migrate `prBandQuyDoi` chạy câu này). */
export const DDL_BANG_QUY_DOI = `CREATE TABLE IF NOT EXISTS bang_quy_doi (
  id INTEGER PRIMARY KEY,
  listening TEXT NOT NULL,
  reading TEXT NOT NULL,
  ly_do TEXT,
  khoi_phuc_tu INTEGER,
  nguoi_id INTEGER REFERENCES users(id),
  tao_luc TEXT NOT NULL
)`;

type DongPb = { id: number; listening: string; reading: string; ly_do: string | null; khoi_phuc_tu: number | null; tao_luc: string; ten: string | null };
const bangCua = (r: { listening: string; reading: string }): BangQuyDoi => ({ listening: JSON.parse(r.listening), reading: JSON.parse(r.reading) });

/** Bảng đang dùng + số phiên bản (0 = gốc). Một câu đọc mỗi lần — không nhớ đệm, để mọi máy chủ (Netlify) cùng thấy bản vừa lưu. */
function hienHanh(): { id: number; bang: BangQuyDoi } {
  const r = db().prepare('SELECT id, listening, reading FROM bang_quy_doi ORDER BY id DESC LIMIT 1').get() as DongPb | undefined;
  return r ? { id: r.id, bang: bangCua(r) } : { id: 0, bang: BANG_QUY_DOI_GOC };
}
export const bangHienHanh = (): BangQuyDoi => hienHanh().bang;

/** Ô khác nhau giữa hai bảng: `{ "L 18": [5, 5.5] }` — nhật ký + số ô đổi của mỗi phiên bản. */
function oDoi(cu: BangQuyDoi, moi: BangQuyDoi): Record<string, [number, number]> {
  const r: Record<string, [number, number]> = {};
  for (const k of ['listening', 'reading'] as const) {
    moi[k].forEach((v, n) => { if (cu[k][n] !== v) r[`${k === 'listening' ? 'L' : 'R'} ${n}`] = [cu[k][n], v]; });
  }
  return r;
}

/** Quản trị hệ thống hoặc vai Quản lý — cờ `nav.bangQuyDoi` gọi cùng hàm. */
export const xemDuocBangQuyDoi = (p: Principal) => can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }) || laVaiQuanLy(p.roleKeys);

/** Màn Quản trị › Bảng quy đổi: bảng đang dùng + mọi phiên bản (mới nhất trước, phiên bản 0 = gốc ở cuối; `doi` = ô đổi so với phiên bản trước). */
export function xemBangQuyDoi(p: Principal) {
  if (!xemDuocBangQuyDoi(p)) throw forbidden('Chỉ Quản trị hệ thống và Quản lý xem được bảng quy đổi.');
  const ds = db().prepare(
    `SELECT b.*, u.full_name AS ten FROM bang_quy_doi b LEFT JOIN users u ON u.id = b.nguoi_id ORDER BY b.id`,
  ).all() as DongPb[];
  let truoc = BANG_QUY_DOI_GOC;
  const phienBan = [{ id: 0, luc: null as string | null, nguoi: null as string | null, lyDo: null as string | null, khoiPhucTu: null as number | null, doi: {} as Record<string, [number, number]> }];
  for (const r of ds) {
    const bang = bangCua(r);
    phienBan.push({ id: r.id, luc: r.tao_luc, nguoi: r.ten, lyDo: r.ly_do, khoiPhucTu: r.khoi_phuc_tu, doi: oDoi(truoc, bang) });
    truoc = bang;
  }
  return { bang: truoc, phienBan: phienBan.reverse(), suaDuoc: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }) };
}

/**
 * Lưu một phiên bản mới: bảng gửi lên (`listening`, `reading`) hoặc chép lại phiên bản `khoiPhucTu` (Hoàn tác / khôi phục; 0 = gốc).
 * `tuPhienBan` = phiên bản người sửa đang thấy — khác bản đang dùng → 409 (không đè bản người khác vừa lưu). Giống hệt bảng đang dùng → không thêm phiên bản.
 */
export function luuBangQuyDoi(p: Principal, input: { listening?: unknown; reading?: unknown; lyDo?: unknown; khoiPhucTu?: unknown; tuPhienBan?: unknown }) {
  if (!can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })) throw forbidden('Chỉ Quản trị hệ thống sửa được bảng quy đổi.');
  const lyDo = chuTuDo(input.lyDo, 'Lý do', 500);
  const conn = db();
  return tx(() => {
    const ht = hienHanh();
    if (input.tuPhienBan !== undefined && input.tuPhienBan !== ht.id) {
      throw conflict('Bảng quy đổi vừa được người khác lưu — tải lại để xem bản mới rồi sửa tiếp.');
    }
    let moi: BangQuyDoi;
    let khoiPhucTu: number | null = null;
    if (input.khoiPhucTu !== undefined) {
      const id = input.khoiPhucTu;
      if (!Number.isInteger(id) || (id as number) < 0) throw badRequest('Phiên bản cần khôi phục không hợp lệ.');
      const r = id === 0 ? null : conn.prepare('SELECT listening, reading FROM bang_quy_doi WHERE id = ?').get(id) as DongPb | undefined;
      if (id !== 0 && !r) throw badRequest('Không tìm thấy phiên bản cần khôi phục.');
      moi = r ? bangCua(r) : BANG_QUY_DOI_GOC;
      khoiPhucTu = id as number;
    } else {
      const loi = kiemBangQuyDoi({ listening: input.listening, reading: input.reading });
      if (loi.length) throw badRequest(loi[0].loi, { loi });
      moi = { listening: input.listening as number[], reading: input.reading as number[] };
    }
    const doi = oDoi(ht.bang, moi);
    if (!Object.keys(doi).length) return { ...xemBangQuyDoi(p), truoc: ht.id };
    const id = Number(conn.prepare('INSERT INTO bang_quy_doi (listening, reading, ly_do, khoi_phuc_tu, nguoi_id, tao_luc) VALUES (?,?,?,?,?,?)')
      .run(JSON.stringify(moi.listening), JSON.stringify(moi.reading), lyDo, khoiPhucTu, p.userId, nowIso()).lastInsertRowid);
    writeAudit({
      actorUserId: p.userId, action: khoiPhucTu === null ? 'bang_quy_doi.sua' : 'bang_quy_doi.khoi_phuc', entityType: 'bang_quy_doi', entityId: id,
      entityLabel: 'Bảng quy đổi band', before: Object.fromEntries(Object.entries(doi).map(([k, v]) => [k, v[0]])),
      after: { ...Object.fromEntries(Object.entries(doi).map(([k, v]) => [k, v[1]])), ...(lyDo ? { lyDo } : {}), ...(khoiPhucTu !== null ? { khoiPhucTu } : {}) },
    });
    /* `truoc` = phiên bản ngay trước lần lưu này — web gắn vào nút Hoàn tác của toast. */
    return { ...xemBangQuyDoi(p), truoc: ht.id };
  });
}
