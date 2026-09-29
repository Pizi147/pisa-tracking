/**
 * M1 — LỊCH MT MẶC ĐỊNH TỰ TẠO khi mở lộ trình FT (Thêm HV, vào lớp FT, mở lộ trình mới, đổi LT ↔ RF). Giao kèo với PR-NHAP: giữ
 * đúng tên + chữ ký. Lõi dùng chung với "Áp lịch" và đổi tuần bắt đầu: `apLichMacDinhLo` (classes/schedule.ts).
 */
import { apLichMacDinhLo, type LuotMacDinh } from '../classes/schedule.ts';
import { badRequest } from '../util.ts';

export type { LuotMacDinh };

/**
 * M1 — tạo lượt MT mặc định còn thiếu cho MỘT lộ trình FT. Gọi TRONG tx của nơi mở lộ trình; KHÔNG tự kiểm quyền (người gọi đã kiểm).
 * Lộ trình không có route (lớp thường) hoặc chưa có start_period_id → []. Chạy lại không tạo trùng (bỏ số đã có lượt còn hiệu lực).
 * ngayTao: mốc "lịch sử" — mặc định demoToday().
 * daThiToiMt: 0–8, tạo thêm MT(n) tới số này (K2-33, cột của PR-NHAP); không truyền = lịch mặc định (T33, không MT4+).
 */
export function taoMtMacDinh(cycleId: number, opts: { actorUserId: number | null; ngayTao?: string; daThiToiMt?: number }): LuotMacDinh[] {
  return taoMtMacDinhLo([{ cycleId, daThiToiMt: opts.daThiToiMt }], opts).get(cycleId) ?? [];
}

/**
 * `taoMtMacDinh` cho NHIỀU lộ trình (PR-TOC: Thêm học viên, chuyển cả lớp) — số câu SQL không phụ thuộc số em. Kết quả theo
 * `cycleId`; lộ trình không tạo được gì không có trong Map.
 */
export function taoMtMacDinhLo(
  ds: readonly { cycleId: number; daThiToiMt?: number }[], opts: { actorUserId: number | null; ngayTao?: string },
): Map<number, LuotMacDinh[]> {
  for (const { daThiToiMt: n } of ds) {
    if (n !== undefined && !(Number.isInteger(n) && n >= 0 && n <= 8)) throw badRequest('"Đã thi tới MT" phải là số từ 0 đến 8.');
  }
  const kq = apLichMacDinhLo(ds, opts.actorUserId, { ngayTao: opts.ngayTao, chiTao: true });
  return new Map([...kq].map(([id, k]) => [id, k.created]));
}
