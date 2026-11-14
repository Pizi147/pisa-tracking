/**
 * DÒNG QUY CHẾ (overhaul V6, `04-thiet-ke.md` 5.3; mockup `thiet-ke/v21/trang-dau-gv.html` K2, K4, K5): một câu ≤ 90 ký tự ngay trên chân panel việc —
 * mặc định là gì · lưu xong ai nhận, hạn nào · chọn khác thì sao. Câu ở MỘT chỗ (không viết tay từng panel); chi tiết dài vào ⓘ.
 * GD-4b: các panel khác ở `quyCheCase.ts` · `quyCheYThuc.ts` · `quyCheVanHanh.ts` (bảng 83 câu mockup ⑤ R5.5). Vắng khi nhập điểm: `quyCheNhapDiem`.
 */
import { t } from '../i18n/index.ts';

export type QuyChe = { chu: string; chiTiet?: string };

/** SOS-TAM-PA: "Theo PA quy chế" = PA của GV dừng ("Được thay thế"); "Giữ PA của tôi" → QL duyệt, quá 3 ngày chưa trả lời chốt theo PA của GV. */
export const quyCheChonPa = (giu: boolean): QuyChe => giu
  ? { chu: t('QL duyệt trong 3 ngày · quá hạn theo bạn'), chiTiet: t('Quá 3 ngày Quản lý chưa trả lời: chốt theo PA của bạn.') }
  : { chu: t('PA của bạn dừng, kết quả giữ'), chiTiet: t('PA của bạn chuyển "Được thay thế"; kết quả đã ghi vẫn giữ trong Case.') };

/** Kết quả PA ghi theo kỳ 2 tuần; chủ SP 13/11: không Hoàn tác — sai thì "Sửa kết quả" ở thẻ PA. */
export const quyCheKetQuaPa = (han: string | null): QuyChe => ({
  chu: [t('Kỳ 2 tuần'), han ? t('hạn {han}', { han }) : null, t('Lưu là chốt, đổi bằng Sửa')].filter(Boolean).join(' · '),
  chiTiet: t('Lưu nháp không chốt, việc và hạn không đổi. Đã lưu thì sửa ở thẻ PA › Sửa kết quả.'),
});

/** Ý thức D1–D2: vi phạm sinh việc xem cho GVCN, 3 vi phạm / 2 tuần phải xử lý; nhắc nhở không tính. */
export const quyCheViPham = (chiNhac: boolean): QuyChe => chiNhac
  ? { chu: t('Không tính vào bậc, không sinh việc'), chiTiet: t('Không tính 3 vi phạm / 2 tuần · không lên bậc · không tạo việc') }
  : { chu: t('GVCN nhận việc xem · đủ 3 trong 2 tuần thì phải xử lý'), chiTiet: t('Đủ 3 vi phạm trong 2 tuần: GVCN phải xử lý theo bậc.') };
