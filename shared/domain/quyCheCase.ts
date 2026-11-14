/**
 * GD-4b DÒNG QUY CHẾ — nhóm Case: câu theo bảng 83 câu `thiet-ke/v21/bang-mau-ghi-chu.md` mục 2 (số Q ghi cạnh từng hàm). Câu ở `shared/`, không viết tay ở panel.
 * Q16 / Q17 (Chọn PA) và Q20 (Ghi kết quả PA mặc định) ở `quyChe.ts` (GD-3). `{…}` = dữ liệu panel đã nạp; thiếu thì câu không có giá trị đó.
 */
import { t } from '../i18n/index.ts';
import type { QuyChe } from './quyChe.ts';
import { quyCheKetQuaPa } from './quyChe.ts';
import type { PlanDecision } from './cases.ts';

/** Q13 Mô tả Case (luat/2 C-10, mục 2–3): hạn 5 ngày, SOS 3 là 3 ngày; lưu mô tả xong là việc Xác nhận PA. */
export const quyCheMoTaCase = (han: string | null): QuyChe => ({
  chu: han ? t('Hạn {han} (5 ngày; SOS 3: 3) · lưu xong bạn xác nhận PA', { han }) : t('Hạn 5 ngày (SOS 3: 3 ngày) · lưu xong bạn xác nhận PA'),
});

/** Q14 Xác nhận PA (luat/2 C-11, C-14): PA quy chế chạy từ ngày Bắt đầu (mặc định hôm nay), kết quả ghi theo kỳ 2 tuần. `tu` = null khi Bắt đầu là hôm nay. */
export const quyCheXacNhanPa = (tu: string | null): QuyChe => ({
  chu: tu ? t('PA quy chế chạy từ {tu} · ghi kết quả 2 tuần một lần', { tu }) : t('PA quy chế chạy từ hôm nay · ghi kết quả 2 tuần một lần'),
});

/** Q15 Không cần theo dõi (luat/2 C-19): gửi QL duyệt trong `n` ngày (`hanDuyetNgay`), duyệt thì Case đóng. */
export const quyCheKhongTheoDoi = (n: number): QuyChe => ({
  chu: t('Không cần theo dõi: QL duyệt trong {n} ngày · duyệt thì Case đóng', { n }),
  chiTiet: t('Kết quả xem ở Yêu cầu của tôi.'),
});

/**
 * Q18 / Q19 Thêm PA (luat/2 C-10, C-12, việc no_plan): loại GV tự làm → PA chạy khi lưu; loại "Cần QL duyệt" (Hỗ trợ học thuật · Khác) → QL nhận thẻ.
 * `han` = hạn việc "Thêm PA" (Case chưa có PA): `undefined` = không biết → câu không ngày; `null` = Case không có hạn lập PA (đã có PA) → chỉ vế "lưu xong".
 */
export const quyCheThemPa = (deXuat: boolean, han?: string | null): QuyChe => deXuat
  ? { chu: t('Loại này cần QL duyệt · QL nhận thẻ khi bạn lưu') }
  : { chu: han ? t('Hạn {han} (5 ngày; Gấp: 3) · lưu xong PA chạy', { han }) : han === undefined ? t('Hạn 5 ngày (Gấp: 3 ngày) · lưu xong PA chạy') : t('Lưu xong PA chạy') };

/**
 * Q20–Q26 Ghi kết quả PA theo lựa chọn đang chọn (luat/2 C-14 – C-17, C-20). Thứ tự: Mini Test (Q26) · kỳ cuối (Q25) · Xin hỗ trợ QL (Q23) · Kết thúc (Q22)
 * · Điều chỉnh / Thay / Đề xuất PA khác (Q21) · PA quy chế giữ nguyên (Q24, câu Q20 vào ⓘ) · mặc định (Q20).
 */
export const quyCheGhiKetQua = (x: { han: string | null; decision: PlanDecision | ''; deXuat: boolean; lanCuoi: boolean; batBuoc: boolean; miniTest: boolean }): QuyChe => {
  if (x.miniTest) return { chu: t('Từ 70 %: Case tự hoàn thành · dưới 70 %: QL quyết') };
  if (x.lanCuoi) return { chu: t('Kết quả cuối: lưu xong PA khép') };
  if (x.decision === 'ask_manager') return { chu: t('Xin hỗ trợ QL: PA vẫn chạy · QL nhận thẻ') };
  if (x.decision === 'end') return { chu: t('Chỉ kết thúc khi Tiến bộ rõ hoặc Tiến bộ một phần') };
  if (x.deXuat || x.decision === 'adjust' || x.decision === 'replace') return { chu: t('Điều chỉnh / Thay PA cần lý do') };
  if (x.batBuoc) return { chu: t('PA quy chế: không thay, không kết thúc sớm'), chiTiet: quyCheKetQuaPa(x.han).chu };
  return quyCheKetQuaPa(x.han);
};

/**
 * Q27 Xác nhận Case lớp thường (Progress môn < 70 %, việc cause). [XM-10] bảng ghi "PA Bổ trợ đã chạy" (C-06); mã: PA Bổ trợ ở trạng thái chờ (`planned`)
 * tới khi bấm Xác nhận Case (`POST /cases/:id/xac-nhan` → "PA Bổ trợ bắt đầu từ hôm nay") → câu theo mã: "lưu xong PA Bổ trợ chạy".
 */
export const quyCheXacNhanCase = (han: string | null): QuyChe => ({
  chu: han ? t('Hạn {han} (5 ngày) · lưu xong PA Bổ trợ chạy · quá hạn báo QL', { han }) : t('Hạn 5 ngày · lưu xong PA Bổ trợ chạy · quá hạn báo QL'),
});

/** Q28 / Q29 Xác nhận Case Speaking (luat/2 C-08, việc xem_nx_s): dùng nhận xét người chấm, hoặc viết khác (ngưỡng `CHU_TOI_THIEU_CASE`). */
export const quyCheXacNhanS = (vietKhac: boolean, nguoiCham: string | null, toiThieu: number): QuyChe => vietKhac
  ? { chu: t('Viết khác: tối thiểu {n} ký tự · thay nhận xét người chấm', { n: toiThieu }) }
  : { chu: nguoiCham ? t('Nhận xét của {ten} thành mô tả Case', { ten: nguoiCham }) : t('Nhận xét người chấm thành mô tả Case') };

/** Q30 / Q31 Hoàn thành Case (luat/2 C-18): kết luận ≥ `toiThieu` ký tự, mở lại được; còn PA đang chạy thì PA dừng cùng lúc. */
export const quyCheHoanThanhCase = (soPaChay: number, toiThieu: number): QuyChe => soPaChay > 0
  ? { chu: t('Còn {n} PA đang chạy: PA dừng khi bạn hoàn thành Case', { n: soPaChay }), chiTiet: t('Kết luận tối thiểu {n} ký tự · mở lại được', { n: toiThieu }) }
  : { chu: t('Kết luận tối thiểu {n} ký tự · mở lại được', { n: toiThieu }) };

/** Q32 / Q33 + Task › Case (luat/2 C-09, C-10): mô tả `toiThieu`–`toiDa` ký tự; hạn thêm PA 5 ngày, mức Gấp 3 ngày. */
export const quyCheBaoCase = (gap: boolean, toiThieu: number, toiDa: number): QuyChe => gap
  ? { chu: t('Gấp: hạn thêm PA 3 ngày'), chiTiet: t('Mô tả {a}–{b} ký tự · lưu xong bạn thêm PA trong 3 ngày', { a: toiThieu, b: toiDa }) }
  : { chu: t('Mô tả {a}–{b} ký tự · lưu xong bạn thêm PA trong 5 ngày', { a: toiThieu, b: toiDa }) };
