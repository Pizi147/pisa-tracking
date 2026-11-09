import { db } from '../db.ts';
import { coGhiTrongRequest, coNho, layMoc, nho } from './nguCanhRequest.ts';

/**
 * MỐC CHUNG TOÀN HỆ THỐNG (TL-NEN, TRANG-LON S3) — bảng `moc_he_thong` (migrate/prTlNen.ts), đọc kèm câu phiên (`COT_MOC`, auth.ts): 0 câu thêm.
 * (1) `tham-chieu`: phiên bản bảng tham chiếu (lớp, chương trình, cấu hình) do trigger tăng → `nhoThamChieu` nhớ THEO TIẾN TRÌNH giữa các
 *     request, đọc lại khi số đổi (người ghi ở tiến trình nào cũng vậy). (2) `quet:*`: lượt quét đường đọc chạy TOÀN HỆ THỐNG theo mốc
 *     (chủ SP 31/10): ≥ 60 s từ lần quét trước, HOẶC đã có một lần ghi qua API và lượt trước ≥ 15 s (`luiMocQuetSauGhi`, GIAM-DOC-0611), HOẶC sang ngày nghiệp vụ khác.
 */
export type KhoaQuet = 'quet:yeu-cau' | 'quet:lenh' | 'quet:doi-qua-han' | 'quet:lop-trong';
/**
 * `soViec` (SỔ NGHĨA VỤ PR-2, Task 7a): `ghi` = số lần ghi thành công qua API (dòng `so-viec`, tăng ở `luiMocQuetSauGhi`); `cn` = số `ghi` + ngày nghiệp vụ
 * lúc sổ VIỆC của chi nhánh được ghi lại lần cuối (dòng `so-viec:<cn>`, `lamMoiViec`).
 */
export type MocHeThong = { thamChieu: number | null; quet: Partial<Record<KhoaQuet, { luc: string | null; ngay: string | null }>>;
  soViec: { ghi: number | null; cn: Map<number, { so: number | null; luc: string | null; ngay: string | null }> } };

/** Cột con thêm vào câu phiên — một dòng JSON `{ khoa: [so, luc, ngay] }`. */
export const COT_MOC = `(SELECT json_group_object(khoa, json_array(so, luc, ngay)) FROM moc_he_thong) AS u_moc`;

export function docMoc(json: string | null | undefined): MocHeThong {
  const m: MocHeThong = { thamChieu: null, quet: {}, soViec: { ghi: null, cn: new Map() } };
  let o: Record<string, [number | null, string | null, string | null]>;
  try { o = JSON.parse(json ?? ''); } catch { return m; }
  if (!o || typeof o !== 'object') return m;
  const tc = o['tham-chieu']?.[0];
  if (typeof tc === 'number') m.thamChieu = tc;
  for (const k of ['quet:yeu-cau', 'quet:lenh', 'quet:doi-qua-han', 'quet:lop-trong'] as const) {
    if (Array.isArray(o[k])) m.quet[k] = { luc: o[k][1] ?? null, ngay: o[k][2] ?? null };
  }
  for (const [k, v] of Object.entries(o)) {
    if (!Array.isArray(v)) continue;
    if (k === 'so-viec') m.soViec.ghi = typeof v[0] === 'number' ? v[0] : null;
    else if (k.startsWith('so-viec:')) m.soViec.cn.set(Number(k.slice(8)), { so: typeof v[0] === 'number' ? v[0] : null, luc: v[1] ?? null, ngay: v[2] ?? null });
  }
  return m;
}

/** Phép kiểm "giống hệt": bật → không dùng nhớ tiến trình (mọi lần đọc mới). */
export const thamChieuDayDuKhiKiem = { bat: false };

/** Theo KẾT NỐI (như db.ts): phép kiểm đổi kết nối / DB chép lại không thấy nhớ của kết nối cũ. */
const theoKetNoi = new WeakMap<object, Map<string, { so: number; giaTri: unknown }>>();

/**
 * Bảng tham chiếu nhớ theo tiến trình, khoá bằng phiên bản DB. Chỉ dùng khi đang trong request GET có phiên, request chưa ghi gì, cờ kiểm tắt;
 * còn lại tính như cũ (vẫn một lần mỗi request qua `nho`). Giá trị dùng chung giữa request — nơi gọi KHÔNG sửa tại chỗ.
 */
export function nhoThamChieu<T>(khoa: string, tinh: () => T): T {
  return nho(khoa, () => {
    const so = (layMoc() as MocHeThong | undefined)?.thamChieu;
    if (so == null || thamChieuDayDuKhiKiem.bat || !coNho() || coGhiTrongRequest()) return tinh();
    const conn = db();
    let m = theoKetNoi.get(conn);
    if (!m) theoKetNoi.set(conn, m = new Map());
    const cu = m.get(khoa);
    if (cu && cu.so === so) return cu.giaTri as T;
    const giaTri = tinh();
    m.set(khoa, { so, giaTri });
    return giaTri;
  });
}

/** Phép kiểm (TL-NEN N1-e): nhớ tiến trình của kết nối hiện tại. */
export const nhoThamChieuHienTai = () => theoKetNoi.get(db());

/** Bỏ mọi nhớ tiến trình của kết nối hiện tại (tests/dbGoc.ts, `clearScoringModeCache`). */
export function xoaNhoThamChieu(): void {
  theoKetNoi.delete(db());
}

export const QUET_DOC_MS = 60_000;

/**
 * Chạy lượt quét `fn` theo mốc DB, một lần mỗi request. Ngoài request có phiên (phép kiểm gọi thẳng, ops) → chạy thẳng.
 * Mốc còn hạn (cùng ngày, < 60 s) → bỏ qua, 0 câu. Còn lại nhận lượt bằng UPDATE có điều kiện: `changes = 1` mới quét — nhiều tiến trình
 * không quét trùng. Quét lỗi → trả mốc về NULL (lần sau thử lại), lỗi ném tiếp. Trả true khi đã quét.
 */
export function quetTheoMoc(khoa: KhoaQuet, homNay: string, fn: () => void): boolean {
  return nho(`quet-moc:${khoa}:${homNay}`, () => {
    const m = layMoc() as MocHeThong | undefined;
    if (!m) { fn(); return true; }
    const q = m.quet[khoa];
    if (!q) { fn(); return true; }   // thiếu dòng mốc (DB dựng thiếu / bị xoá): quét như chưa có mốc — không bao giờ tắt hẳn lượt quét
    const bayGio = Date.now();
    if (q.luc && q.ngay === homNay && bayGio - Date.parse(q.luc) < QUET_DOC_MS) return false;
    const conn = db();
    /*
     * `RETURNING` qua `all()`, không `run()`: câu nhận lượt chỉ chạm `moc_he_thong` — không xoá bộ nhớ request, không tắt nhớ bảng tham chiếu.
     * Nhận lượt lỗi (khoá bận, Hrana…) → VẪN quét như trước PR (+ log): không bao giờ tắt quét âm thầm.
     */
    let r: unknown[];
    try {
      r = conn.prepare('UPDATE moc_he_thong SET luc = ?, ngay = ? WHERE khoa = ? AND (luc IS NULL OR ngay IS NOT ? OR luc < ?) RETURNING khoa')
        .all(new Date(bayGio).toISOString(), homNay, khoa, homNay, new Date(bayGio - QUET_DOC_MS).toISOString()) as unknown[];
    } catch (e) {
      console.error('[moc-quet] không nhận được lượt quét — vẫn quét', e);
      r = [khoa];
    }
    if (r.length !== 1) return false;
    try { fn(); } catch (e) {
      conn.prepare('UPDATE moc_he_thong SET luc = NULL WHERE khoa = ?').run(khoa);
      throw e;
    }
    return true;
  });
}

/**
 * Lượt quét MỖI NGÀY MỘT LẦN (LOP-TRONG): mốc trong câu phiên đã là hôm nay → 0 câu. Còn lại nhận lượt bằng MỘT câu upsert có điều kiện (thiếu dòng mốc thì
 * tạo — không bao giờ tắt hẳn): chỉ tiến trình đổi được `ngay` mới quét. Quét lỗi → trả `ngay` về NULL (lần sau thử lại), lỗi ném tiếp.
 */
export function quetMoiNgay(khoa: KhoaQuet, homNay: string, fn: () => void): boolean {
  return nho(`quet-ngay:${khoa}:${homNay}`, () => {
    if ((layMoc() as MocHeThong | undefined)?.quet[khoa]?.ngay === homNay) return false;
    const conn = db();
    const r = conn.prepare(`INSERT INTO moc_he_thong (khoa, luc, ngay) VALUES (?, ?, ?)
        ON CONFLICT (khoa) DO UPDATE SET luc = excluded.luc, ngay = excluded.ngay WHERE ngay IS NOT excluded.ngay RETURNING khoa`)
      .all(khoa, new Date().toISOString(), homNay) as unknown[];
    if (r.length !== 1) return false;
    try { fn(); } catch (e) {
      conn.prepare('UPDATE moc_he_thong SET ngay = NULL WHERE khoa = ?').run(khoa);
      throw e;
    }
    return true;
  });
}

/** GIAM-DOC-0611 [XM-A] (chủ SP 06/11 đồng ý): sau một lần ghi, quét lại khi lượt trước đã đủ từng này — trước quét ngay ở GET kế, gần như mỗi lần ghi một lượt. */
export const QUET_SAU_GHI_MS = 15_000;

/**
 * Một lần ghi thành công qua API → lượt quét kế (của bất kỳ ai, tiến trình nào) chạy khi lượt trước đã ≥ `QUET_SAU_GHI_MS` (thẻ tự tạo / tự đóng trễ tối đa 15 s).
 * Lùi mốc MỘT lần: mốc mới hơn `now − 45 s` (lượt vừa quét, chưa lùi) → mốc − 45 s, tức hết hạn 60 s ở lượt trước + 15 s; ghi tiếp không lùi thêm (mốc đã cũ hơn
 * `now − 45 s`). Mốc NULL / cũ hơn giữ nguyên (đằng nào cũng quét trong ≤ 15 s).
 */
export function luiMocQuetSauGhi(): void {
  const lui = QUET_DOC_MS - QUET_SAU_GHI_MS;
  /* Cùng câu: SỔ NGHĨA VỤ (PR-2, Task 7a) — đếm lần ghi (`so-viec`); GET đọc sổ việc thấy số đổi thì ghi lại sổ việc của chi nhánh (`lamMoiViec`). */
  db().prepare(`UPDATE moc_he_thong SET so = CASE WHEN khoa = 'so-viec' THEN COALESCE(so, 0) + 1 ELSE so END,
      luc = CASE WHEN khoa = 'so-viec' THEN luc ELSE strftime('%Y-%m-%dT%H:%M:%fZ', luc, ?) END
    WHERE khoa = 'so-viec' OR (khoa LIKE 'quet:%' AND luc > ?)`)
    .run(`-${lui / 1000} seconds`, new Date(Date.now() - lui).toISOString());
}
