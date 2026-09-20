/**
 * CHÍN ĐIỂM LUẬT CHƯA CHỐT (C01–C09) VÀ MỘT NGOẠI LỆ CỦA §17.1 (C10) — thiet-ke/LUAT_CHO_CHOT.md.
 *
 * Chủ sản phẩm CHƯA TRẢ LỜI những câu này. Quy tắc của file này: **không tự chọn phương án thuận tiện
 * nhất rồi chôn nó vào giữa một hàm.** Mỗi điểm chưa chốt là MỘT HẰNG SỐ CÓ TÊN, kèm chú thích nêu CẢ HAI
 * PHƯƠNG ÁN và lý do đang dùng cái nào. Nơi gọi chỉ ĐỌC hằng số, không có `if` rải rác; đổi quyết định
 * là sửa một dòng ở đây. Và **không viết migration dữ liệu** dựa trên một điểm chưa chốt — giữ nguyên
 * dữ liệu gốc trong khi chờ.
 *
 * Giá trị đang dùng khi chờ luôn là hành vi ĐANG CHẠY của code hiện tại (giữ nguyên dữ liệu) — trừ C10,
 * vốn chưa có luồng nào và mặc định về phía không tự chốt.
 *
 * TRẠNG THÁI CÀI ĐẶT (20/09/2026): **chỉ C10 được code đọc.** C01–C09 là hành vi đã chạy từ trước và vẫn
 * được viết cứng ở nơi gọi; hằng số ở đây ghi lại quyết định đang chờ và là chỗ để nối dây khi chủ sản
 * phẩm trả lời. Chưa nối = đổi hằng số ở đây CHƯA đổi hành vi — cần nối từng chỗ gọi rồi mới đổi.
 * Không hiển thị mã C trên giao diện người dùng (LUAT_CHO_CHOT.md §4).
 */

/**
 * C01 — CHƯA CHỐT 20/09/2026.
 * Sau 3 ngày xác minh SOS, phương án đầu tiên có nằm trong cùng hạn đó không?
 *   'hai-moc-rieng' : hai mốc riêng như code hiện tại — giao diện hiện HAI `<Han>` khác loại.  ← đang dùng
 *   'mot-han-chung' : một hạn 3 ngày gồm cả nguyên nhân lẫn phương án đầu tiên (rule book §13.1).
 * Ảnh hưởng: hồ sơ HV · Công việc · Tổng quan.
 */
export const C01_HAN_XAC_MINH_SOS_GOM_PA = 'hai-moc-rieng' as const;

/**
 * C02 — CHƯA CHỐT 20/09/2026.
 * GVCN có quyền xử lý case học thuật TRÁI MÔN trong lớp chủ nhiệm không?
 *   'gvcn-ca-lop'   : GVCN xử lý cả lớp — theo AUTH-01 đã code.  ← đang dùng, KHÔNG mở rộng thêm
 *   'gvcn-dung-mon' : GVCN chỉ xử lý môn mình dạy, như mọi GVBM.
 * Ảnh hưởng: form + Case · quyền máy chủ.
 */
export const C02_GVCN_XU_LY_CASE_TRAI_MON = 'gvcn-ca-lop' as const;

/**
 * C03 — CHƯA CHỐT 20/09/2026.
 * Nâng mức Gấp thì hạn tính từ ngày mở hay từ ngày nâng +2?
 *   'ngay-nang-cong-2' : `min(hạn hiện tại, ngày nâng + 2)` — code hiện tại `deadlineAfterRaise`.  ← đang dùng
 *   'tu-ngay-mo'       : hạn Gấp tính lùi từ ngày MỞ case (sổ ví dụ: mở 14/09 → 16/09).
 * Ví dụ chênh: nâng ngày 16/09 — phương án đầu cho 18/09, phương án sau cho 16/09.
 * Ảnh hưởng: case Ý thức · badge quá hạn.
 */
export const C03_HAN_KHI_NANG_GAP = 'ngay-nang-cong-2' as const;

/**
 * C04 — CHƯA CHỐT 20/09/2026.
 * Đợt Ý thức đã đóng, có báo cáo mới trong cửa sổ gộp: mở lại hay tạo đợt mới?
 *   'doi-moi-lien-ket' : tạo ĐỢT MỚI liên kết với đợt cũ, không viết lại kết luận cũ.  ← đang dùng
 *   'mo-lai'           : mở lại chính đợt cũ.
 * Ảnh hưởng: form báo vấn đề · hồ sơ HV.
 */
export const C04_BAO_CAO_MOI_SAU_KHI_DONG = 'doi-moi-lien-ket' as const;

/**
 * C05 — ĐÃ CHỐT 19/09/2026 (giữ để không ai khôi phục luật cũ).
 * SOS có bắt buộc sinh phương án trao đổi không?
 *   'khong-bat-buoc' : KHÔNG. GVCN tự quyết định và tự lập phương án.  ← đã chốt
 *   'bat-buoc'       : hai phương án trao đổi tự sinh — LUẬT CŨ, đã hết hiệu lực (rule book §17.5).
 */
export const C05_SOS_SINH_PA_TRAO_DOI = 'khong-bat-buoc' as const;

/**
 * C06 — CHƯA CHỐT 20/09/2026.
 * "Phát hiện trước đây nhưng đang xử lý" khác "đã hoàn thành từ trước" thế nào?
 *   'chi-da-hoan-thanh' : tab "Đã xong từ trước" chỉ nhận case ĐÃ HOÀN THÀNH; case đang xử lý dùng form thường.  ← đang dùng
 *   'ca-dang-xu-ly'     : tab này nhận cả case còn đang xử lý.
 * Ảnh hưởng: form + Case.
 */
export const C06_NHAP_BU_CASE_DANG_XU_LY = 'chi-da-hoan-thanh' as const;

/**
 * C07 — CHƯA CHỐT 20/09/2026.
 * Đợt FT chỉ có W1 hoặc chỉ có W2 thì tính Writing thế nào?
 *   'chua-ho-tro'          : CHƯA hỗ trợ — chặn ở cấu hình phạm vi, không lặng lẽ dùng W1 thay Writing tổng.  ← đang dùng
 *   'cho-phep-w1-hoac-w2'  : cho phép, cần luật tính Writing riêng.
 * Ảnh hưởng: Kế hoạch Test.
 */
export const C07_DOT_FT_CHI_W1_HOAC_W2 = 'chua-ho-tro' as const;

/**
 * C08 — CHƯA CHỐT 20/09/2026.
 * Hạn chấm Normal là Chủ nhật tuần thi hay Chủ nhật tuần kế?
 *   'theo-quy-dinh-lop'  : KHÔNG áp mặc định của FT; giao diện ghi "Hạn chấm theo quy định của lớp".  ← đang dùng
 *   'chu-nhat-tuan-thi'  : hết Chủ nhật của chính tuần thi.
 *   'chu-nhat-tuan-ke'   : hết Chủ nhật tuần kế tiếp.
 * Ảnh hưởng: bảng chấm Normal.
 */
export const C08_HAN_CHAM_NORMAL = 'theo-quy-dinh-lop' as const;

/**
 * C09 — CHƯA CHỐT 20/09/2026.
 * Đề nghị dời lịch lần hai tự hết hạn lúc nào, và nếu QL không trả lời thì sao?
 *   'giu-cho-ql-duyet'      : KHÔNG suy "không trả lời" = "từ chối"; giữ "Chờ quản lý duyệt" tới khi có thao tác.  ← chọn khi chờ
 *   'tu-choi-khi-het-han'   : hết hạn duyệt thì coi như bị từ chối và huỷ phần bị ảnh hưởng (code hiện tại đang làm thế
 *                             ở `sweepExpiredMoves`).
 * LƯU Ý: giá trị chọn khi chờ KHÁC hành vi code hiện tại — đây là điểm duy nhất C-nào lệch. Vì chưa chốt và
 * vì chưa nối dây, code vẫn chạy 'tu-choi-khi-het-han'; nối dây là một việc riêng cần chủ sản phẩm biết.
 * Ảnh hưởng: Kế hoạch Test · Công việc.
 */
export const C09_DE_NGHI_DOI_LICH_HET_HAN = 'giu-cho-ql-duyet' as const;

/**
 * C10 — NGOẠI LỆ CỦA RULE BOOK §17.1, CHƯA CHỐT 20/09/2026. **Đây là hằng số DUY NHẤT code đang đọc.**
 * Nhập '-' cho một tuần ĐÃ KẾT THÚC từ trước: chốt ngay hay cần Quản lý hiệu chỉnh?
 *   'cho-ql-hieu-chinh' : KHÔNG tự chốt ngay — tạo một mục chờ Quản lý hiệu chỉnh. Không âm thầm mở lại tuần
 *                         đã chốt, cũng không cấm sửa dữ liệu sai.  ← mặc định (LUAT_CHO_CHOT.md §3)
 *   'chot-ngay'         : coi là không dự thi ngay khi nhập.
 * Hai câu ngỏ đi kèm (ai sửa kết luận sau cuối tuần; có đảo quyết định duyệt đã phát sinh không) cũng chưa
 * trả lời: hiện chỉ Quản lý sửa được sau khi đã chốt, và không đảo quyết định nào đã có.
 */
export const C10_NHAP_DAU_TRU_TUAN_QUA_KHU = 'cho-ql-hieu-chinh' as const;
