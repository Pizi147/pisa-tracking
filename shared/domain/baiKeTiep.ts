/**
 * R1-LUU-TIEP (chủ SP 26/10, thiết kế deploy-ux mục 4.1 luật 5): "Lưu · bài tiếp ›" sang bài CÒN THIẾU kế tiếp của người xem.
 * Một định nghĩa "còn thiếu" cho mọi lưới FT; thứ tự hàng là ẢNH CHỤP lúc mở hộp đầu tiên (lọc / tải lại không làm lệch bài kế).
 */
import { awaitingScore, type SkillProgress } from './fasttrack.ts';

export type ODiemConThieu = { required: boolean; canEdit: boolean; band: number | null; noShow?: unknown; progress: string };

/**
 * Ô FT người xem còn phải nhập: bắt buộc (môn đăng ký), sửa được, chưa band, không "-", đã tới tuần thi, không huỷ / vắng / chờ duyệt dời.
 * MT lịch sử (`lich_su`, nhập bù) cũng là còn thiếu để nhập — không phải nợ (`awaitingScore` không tính), nhưng "bài tiếp" vẫn phải sang.
 */
export const conThieuFt = (c: ODiemConThieu) =>
  c.required && c.canEdit && c.band === null && !c.noShow && (awaitingScore(c.progress as SkillProgress) || c.progress === 'lich_su');

/** `khoa` = attemptId (lưới) hoặc id dòng (Speaking chéo). */
export type ViTriO = { khoa: number; kyNang: string };

/**
 * Ô còn thiếu kế tiếp: cùng kỹ năng sau ô hiện tại → cùng kỹ năng từ đầu (vòng) → từng kỹ năng khác trong `kyNangToi` (thứ tự cột) từ hàng đầu.
 * `conThieu` kiểm trên dữ liệu MỚI NHẤT (khoá không còn → false). Không bao giờ trả lại chính `hienTai`.
 */
export function baiKeTiep(thuTu: readonly number[], conThieu: (v: ViTriO) => boolean, hienTai: ViTriO, kyNangToi: readonly string[]): ViTriO | null {
  const i = thuTu.indexOf(hienTai.khoa);
  const vong = i < 0 ? thuTu : [...thuTu.slice(i + 1), ...thuTu.slice(0, i)];
  for (const khoa of vong) if (conThieu({ khoa, kyNang: hienTai.kyNang })) return { khoa, kyNang: hienTai.kyNang };
  for (const kyNang of kyNangToi) {
    if (kyNang === hienTai.kyNang) continue;
    for (const khoa of thuTu) if (conThieu({ khoa, kyNang })) return { khoa, kyNang };
  }
  return null;
}
