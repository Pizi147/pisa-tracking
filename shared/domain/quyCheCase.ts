/**
 * GD-4b DÒNG QUY CHẾ — nhóm Case: câu theo bảng 83 câu `thiet-ke/v21/bang-mau-ghi-chu.md` mục 2 (số Q ghi cạnh từng hàm). Câu ở `shared/`, không viết tay ở panel.
 * Q16 / Q17 (Chọn PA) và Q20 (Ghi kết quả PA mặc định) ở `quyChe.ts` (GD-3). `{…}` = dữ liệu panel đã nạp; thiếu thì câu không có giá trị đó.
 */
import { t } from '../i18n/index.ts';
import type { QuyChe } from './quyChe.ts';
import { quyCheKetQuaPa } from './quyChe.ts';
import { chenHan } from './hanMacDinh.ts';
import type { PlanDecision } from './cases.ts';
import { nguongMiniTest } from './bandNguong.ts';

/** Q13 Mô tả Case (luat/2 C-10, mục 2–3): hạn 5 ngày, SOS 3 là 3 ngày; lưu mô tả xong là việc Xác nhận PA. */
export const quyCheMoTaCase = (han: string | null): QuyChe => ({
  chu: chenHan(han ? t('Hạn {han} ({han:xac_nhan_case}; SOS 3: {han:xac_nhan_case.ngayGap}) · lưu xong bạn xác nhận PA', { han }) : t('Hạn {han:xac_nhan_case} (SOS 3: {han:xac_nhan_case.ngayGap}) · lưu xong bạn xác nhận PA')),
});

/** Q14 Xác nhận PA (luat/2 C-11, C-14): PA quy chế chạy từ ngày Bắt đầu (mặc định hôm nay), kết quả ghi theo kỳ 2 tuần. `tu` = null khi Bắt đầu là hôm nay. */
export const quyCheXacNhanPa = (tu: string | null): QuyChe => ({
  chu: tu ? t('PA quy chế chạy từ {tu} · ghi kết quả 2 tuần một lần', { tu }) : t('PA quy chế chạy từ hôm nay · ghi kết quả 2 tuần một lần'),
});

/** Q15 Không cần theo dõi (luat/2 C-19): gửi QL duyệt trong `n` ngày (`hanDuyetNgay`), duyệt thì Case đóng. */
export const quyCheKhongTheoDoi = (n: number): QuyChe => ({
  chu: t('Không cần theo dõi: Head duyệt trong {n} ngày · duyệt thì Case đóng', { n }),
  chiTiet: t('Kết quả xem ở Yêu cầu của tôi.'),
});

/**
 * Q18 / Q19 Thêm PA (luat/2 C-10, C-12, việc no_plan): loại GV tự làm → PA chạy khi lưu; loại "Cần QL duyệt" (Hỗ trợ học thuật · Khác) → QL nhận thẻ.
 * `han` = hạn việc "Thêm PA" (Case chưa có PA): `undefined` = không biết → câu không ngày; `null` = Case không có hạn lập PA (đã có PA) → chỉ vế "lưu xong".
 */
export const quyCheThemPa = (deXuat: boolean, han?: string | null): QuyChe => deXuat
  ? { chu: t('Loại này cần Head duyệt · Head nhận thẻ khi bạn lưu') }
  : { chu: chenHan(han ? t('Hạn {han} ({han:xac_nhan_case}; Gấp: {han:xac_nhan_case.ngayGap}) · lưu xong PA chạy', { han }) : han === undefined ? t('Hạn {han:xac_nhan_case} (Gấp: {han:xac_nhan_case.ngayGap}) · lưu xong PA chạy') : t('Lưu xong PA chạy')) };

/**
 * Q20–Q26 Ghi kết quả PA theo lựa chọn đang chọn (luat/2 C-14 – C-17, C-20). Thứ tự: Mini Test (Q26) · kỳ cuối (Q25) · Xin hỗ trợ QL (Q23) · Kết thúc (Q22)
 * · Điều chỉnh / Thay / Đề xuất PA khác (Q21) · PA quy chế giữ nguyên (Q24, câu Q20 vào ⓘ) · mặc định (Q20).
 */
export const quyCheGhiKetQua = (x: { han: string | null; decision: PlanDecision | ''; deXuat: boolean; lanCuoi: boolean; batBuoc: boolean; miniTest: boolean; htCase?: boolean; ketThucSom?: boolean; sapToi?: boolean }): QuyChe => {
  if (x.miniTest) return { chu: t('Từ 70 %: Case tự hoàn thành · dưới 70 %: Head quyết') };
  if (x.lanCuoi) return { chu: t('Kết quả cuối: lưu xong PA khép') };
  if (x.decision === 'ask_manager') return { chu: t('Xin hỗ trợ Head: PA vẫn chạy · Head nhận thẻ') };
  /* GD-20d (⑫ D2): form có ô "Hoàn thành Case" (`htCase` ≠ undefined) → câu theo ô tick. */
  if (x.decision === 'end' && x.htCase !== undefined) return { chu: x.htCase ? t('Kết thúc PA · Case hoàn thành, mở lại được ở thẻ Case') : t('Kết thúc PA · Case còn mở · không hạn') };
  if (x.decision === 'end') return { chu: t('Chỉ kết thúc khi Tiến bộ rõ hoặc Tiến bộ một phần') };
  if (x.deXuat || x.decision === 'adjust' || x.decision === 'replace') return { chu: t('Điều chỉnh / Thay PA cần lý do') };
  /* TU2-4 (XM-5): PA chưa tới hạn — Lưu sớm = chốt kỳ (không hộp xác nhận, sửa được); Lưu nháp giữ tới hạn. */
  if (x.sapToi) return { chu: t('Lưu nháp giữ tới hạn · Lưu là chốt, đổi bằng Sửa') };
  if (x.batBuoc) return { chu: x.ketThucSom ? t('PA quy chế: không thay · kết thúc sớm ở thẻ PA') : t('PA quy chế: không thay, không kết thúc sớm'), chiTiet: quyCheKetQuaPa(x.han).chu };
  return quyCheKetQuaPa(x.han);
};

/**
 * GD-20d (⑫ D1–D3): ô "Hoàn thành Case" BẬT SẴN khi đủ ba — Kết thúc PA (hoặc kết quả cuối) · PA cuối còn chạy của Case · kỳ này đạt:
 * Tiến triển "Tiến bộ rõ" (`improved`); Bổ trợ miễn phí: Mini Test ≥ `nguongMiniTest` (ngưỡng chung, theo ngày làm). Thiếu một → tắt sẵn. Không máy tự đóng Case.
 */
export const hoanThanhCaseBatSan = (x: { ketThuc: boolean; outcome: string; boTroMienPhi: boolean; mtTyLe: number | null; mtNgay: string | null }): boolean => {
  if (!x.ketThuc) return false;   // "PA cuối còn chạy" do nơi gọi chặn (`hoanThanhCase` chỉ có khi PA là PA cuối)
  if (x.boTroMienPhi) return x.mtTyLe != null && Number.isFinite(x.mtTyLe) && x.mtTyLe >= nguongMiniTest(x.mtNgay);
  return x.outcome === 'improved';
};

/**
 * Q27 Xác nhận Case lớp thường (Progress môn < 70 %, việc cause). [XM-10] bảng ghi "PA Bổ trợ đã chạy" (C-06); mã: PA Bổ trợ ở trạng thái chờ (`planned`)
 * tới khi bấm Xác nhận Case (`POST /cases/:id/xac-nhan` → "PA Bổ trợ bắt đầu từ hôm nay") → câu theo mã: "lưu xong PA Bổ trợ chạy".
 */
export const quyCheXacNhanCase = (han: string | null): QuyChe => ({
  chu: chenHan(han ? t('Hạn {han} ({han:xac_nhan_case}) · lưu xong PA Bổ trợ chạy · quá hạn báo Head', { han }) : t('Hạn {han:xac_nhan_case} · lưu xong PA Bổ trợ chạy · quá hạn báo Head')),
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
  ? { chu: chenHan(t('Gấp: hạn thêm PA {han:xac_nhan_case.ngayGap}')), chiTiet: chenHan(t('Mô tả {a}–{b} ký tự · lưu xong bạn thêm PA trong {han:xac_nhan_case.ngayGap}', { a: toiThieu, b: toiDa })) }
  : { chu: chenHan(t('Mô tả {a}–{b} ký tự · lưu xong bạn thêm PA trong {han:xac_nhan_case}', { a: toiThieu, b: toiDa })) };
