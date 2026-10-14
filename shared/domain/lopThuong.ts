/**
 * LỚP THƯỜNG · GIỮA KHOÁ (PR-LT2a, đặc tả 27/09 §6.1–6.2 N1–N5, Q-F, T57, T58, M-03, M-05) — LUẬT THUẦN, không đụng database.
 *
 * Môn < 70% ở Giữa khoá → Case tự tạo `[Giữa khoá] G+V không đạt` (không nhãn SOS) + PA Bổ trợ bắt buộc đến Cuối khoá, trừ buổi Free.
 * FOU: 2 buổi/tuần CHUNG cho mọi môn trượt (một nhóm); BE/ELE: 1 buổi/tuần/môn (nhóm một dòng). Pre FOU không có Giữa khoá (PF2).
 * LT2b thêm hàm Cuối khoá (% hướng) CUỐI file này.
 */
import { programmeOf, RATIO_PASS_THRESHOLD, tenMonNgan, nhanBaiThuong } from './normal.ts';
import { tuanLich } from './hienThiNgay.ts';

/** N1: FOU bổ trợ CHUNG 2 buổi/tuần cho mọi môn trượt; BE/ELE 1 buổi/tuần/môn. Pre FOU (và FT) không có Giữa khoá → null. */
export function boTroGiuaKhoa(ct: string | null | undefined): { buoiMoiTuan: 1 | 2; chung: boolean } | null {
  const c = programmeOf(ct);
  if (c === 'FOU') return { buoiMoiTuan: 2, chung: true };
  if (c === 'BE' || c === 'ELE') return { buoiMoiTuan: 1, chung: false };
  return null;
}

/** Nhóm PA bổ trợ: FOU `gk:{attemptId}` (mọi môn trượt của một bài); BE/ELE `gk:{attemptId}:{skill}`. */
export const nhomBoTro = (ct: string | null | undefined, attemptId: number, skill: string) =>
  boTroGiuaKhoa(ct)?.chung ? `gk:${attemptId}` : `gk:${attemptId}:${skill}`;

/** Mô tả PA (T46). Lớp không có Giữa khoá → chuỗi rỗng (không bịa số buổi). */
export function moTaBoTro(ct: string | null | undefined, skill: string): string {
  const b = boTroGiuaKhoa(ct);
  if (!b) return '';
  return b.chung
    ? `Bổ trợ ${b.buoiMoiTuan} buổi/tuần · chung các môn trượt · đến Cuối khoá · trừ buổi Free`
    : `Bổ trợ ${b.buoiMoiTuan} buổi/tuần · ${tenMonNgan(ct, skill)} · đến Cuối khoá · trừ buổi Free`;
}

/** Tên Case lớp thường: `[Progress Test] G+V không đạt [SOS 2]` — OV-12c (chủ SP 14/10, bỏ T58 ở Case): nhãn SOS theo số môn trượt của lượt. */
export function tenCaseThuong(x: { dot: 'progress' | 'final'; giua: string; sos?: number | null }): string {
  return `[${nhanBaiThuong(x.dot)}] ${x.giua}${x.sos ? ` [SOS ${x.sos}]` : ''}`;
}

/**
 * PR-U12: tên bài trong bảng hồ sơ — `Giữa khoá` / `Cuối khoá`; bảng có ≥ 2 bài cùng loại thì đánh số theo thời gian
 * (`attemptNo` tăng dần — bảng xếp mới trước, nên không đánh theo thứ tự hàng).
 */
export function tenBaiThuong(
  rows: readonly { kind: string; attemptNo: number }[], a: { kind: string; attemptNo: number },
): string {
  const ten = nhanBaiThuong(a.kind);
  const cung = rows.filter((r) => (r.kind === 'final') === (a.kind === 'final'));
  return cung.length > 1 ? `${ten} ${cung.filter((r) => r.attemptNo <= a.attemptNo).length}` : ten;
}

/**
 * MỘT chữ kết quả lớp thường cho mọi nơi (T58): Giữa khoá `2/4 môn đạt` + phu `Không đạt: G+V P`; Pre FOU và đủ môn có `pct` (% tổng).
 * KHÔNG bao giờ có chữ "SOS". LT2b thêm hướng Cuối khoá SAU chữ này.
 */
export function nhanKetQuaThuong(r: {
  kind: 'progress' | 'final'; ct: string | null; scored: number; required: number;
  failedSkills: string[]; tyLeTong: number | null; khongChiaMon: boolean;
  /** OV-6b1: ngưỡng đạt của lớp (`RegularResult.passThreshold`). */
  nguong?: number;
}): { chinh: string; phu: string | null; pct: string | null; dat: boolean | null } {
  const pct = r.tyLeTong != null ? `${Math.round(r.tyLeTong * 100)}%` : null;
  if (r.khongChiaMon) return { chinh: pct ?? '—', phu: null, pct, dat: r.tyLeTong != null ? r.tyLeTong >= (r.nguong ?? RATIO_PASS_THRESHOLD) : null };
  if (r.scored <= 0) return { chinh: '—', phu: null, pct: null, dat: null };
  const truot = r.failedSkills.length;
  const thieu = r.scored < r.required;
  const chinh = r.kind === 'final' && pct ? pct
    : `${r.scored - truot}/${r.scored} môn đạt`;
  return {
    chinh, pct,
    phu: truot ? `Không đạt: ${r.failedSkills.map((s) => tenMonNgan(r.ct, s)).join(' ')}` : null,
    dat: truot > 0 ? false : thieu ? null : true,
  };
}

/**
 * 4 nội dung Báo phụ huynh qua TVV (quy định mục II.1): kết quả · môn khó khăn · nguyên nhân (Mô tả Xác nhận Case;
 * chưa có → "GVBM chưa xác nhận") · phương án hỗ trợ + khả năng phải học lại.
 */
export function noiDungBaoPh(x: { ketQua: string; monTruot: string[]; nguyenNhan: string[]; boTro: string }): [string, string, string, string] {
  return [
    `Thực trạng kết quả học tập: ${x.ketQua}`,
    `Kỹ năng đang gặp khó khăn: ${x.monTruot.join(', ') || '—'}`,
    `Nguyên nhân / đánh giá ban đầu của giáo viên: ${x.nguyenNhan.filter(Boolean).join(' · ') || 'GVBM chưa xác nhận'}`,
    `Phương án hỗ trợ: ${x.boTro}. Khả năng phải học lại level nếu không pass bài Final Test.`,
  ];
}

/** Chữ mốc PA bổ trợ: `đến Cuối khoá · W4 OCT` / `đến Cuối khoá · chưa có lịch`. */
export function mocChuBoTro(followupDue: string | null, homNay: string): string {
  return followupDue ? `đến Cuối khoá · ${tuanLich(followupDue, homNay)}` : 'đến Cuối khoá · chưa có lịch';
}

/** Tên các môn của một nhóm theo `ct`, dạng `G+V, P` (dùng cho tiêu đề việc/thẻ). */
export const tenNhomMon = (ct: string | null | undefined, skills: readonly string[]) => skills.map((s) => tenMonNgan(ct, s)).join(', ');

/**
 * OV-6b2 — KẾT QUẢ CHECKPOINT (PET, KET): đủ điểm mọi môn mới kết luận. Đạt mọi môn → "Đạt"; môn chưa đạt → chip "SOS · L+S" (chỉ để nhìn —
 * KHÔNG Case / PA / việc, chủ SP 11/10). Chưa đủ điểm → null.
 */
export function chipCheckpoint(r: { complete: boolean; skills: readonly { skill: string; outcome: string }[] }, ct: string | null):
  { chu: string; dat: boolean } | null {
  if (!r.complete) return null;
  const truot = r.skills.filter((s) => s.outcome === 'fail').map((s) => tenMonNgan(ct, s.skill));
  return truot.length ? { chu: `SOS · ${truot.join(' ')}`, dat: false } : { chu: 'Đạt', dat: true };
}
