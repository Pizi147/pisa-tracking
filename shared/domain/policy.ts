/**
 * CÁC ĐIỂM LUẬT TỪNG CHƯA CHỐT (C01–C10) — thiet-ke/LUAT_CHO_CHOT.md. Chủ sản phẩm trả lời ngày 20/09/2026.
 *
 * Mỗi điểm là MỘT HẰNG SỐ CÓ TÊN, kèm chú thích nêu cả hai phương án và cái nào đang dùng. Nơi gọi chỉ ĐỌC hằng số,
 * không có `if` rải rác. Không hiển thị mã C trên giao diện người dùng (LUAT_CHO_CHOT.md §4).
 *
 * TRẠNG THÁI (cập nhật PR-Rc1, 23/09/2026):
 *   · NỐI DÂY, mã đọc hằng số:  C02 (quyền máy chủ; RB-6 áp thêm cho "hoàn thành Case") · C10 (chốt ngay)
 *     · C08 (lớp thường ghi "-" thì môn đó tự dời sang tuần sau — PR-Rc1, R14).
 *   · ĐÃ CHỐT, khớp hành vi đang chạy: C01 (21/09 — hai mốc riêng) · C06 · C07 · C09.
 *   · HẾT HIỆU LỰC: C03 · C04 (21/09 — bỏ mô hình Case Ý thức) · C05 (21/09 tối — thay bằng Phối hợp SOS, rulebook v3).
 *     Giữ hằng số và ghi lý do, không xoá dấu vết một quyết định có thật.
 */

/**
 * C01 — ĐÃ CHỐT 21/09/2026 (nguồn 21/09 §3.2 tự trả lời): hai mốc riêng, khớp mã đang chạy.
 * Cách hiểu của chủ sản phẩm: trong 3 ngày kể từ khi có SOS thì phải có phương án; có phương án rồi thì đi theo luật cũ —
 *   Học thuật: ghi kết quả vào mỗi Chủ nhật hằng tuần và chốt kết quả vào cuối đợt.
 *     (PR-N1, chủ sản phẩm 27/09 R-PA1: nay hạn ghi kết quả tuần là HẾT THỨ HAI tuần sau — xem `weeklyUpdateDue`.)
 *   Ý thức: hoàn thành hết phương án trong thời hạn mặc định của Case là 1 tuần.
 *   'hai-moc-rieng' : hai mốc riêng như code hiện tại (hạn xác minh SOS, rồi hạn lập phương án).  ← đã chốt
 *   'mot-han-chung' : MỘT hạn 3 ngày kể từ SOS, trong đó phải có phương án.
 */
export const C01_HAN_XAC_MINH_SOS_GOM_PA = 'hai-moc-rieng' as const;

/**
 * C02 — ĐÃ CHỐT 20/09/2026, ĐÃ NỐI DÂY (`permissions.ts`, quyền sửa/xử lý Case).
 * GVCN KHÔNG được xử lý Case học thuật TRÁI MÔN: mỗi giáo viên, kể cả GVCN, chỉ xử lý Case đúng kỹ năng mình dạy.
 * Case Ý thức (không có kỹ năng) vẫn chỉ GVCN.
 *   'gvcn-dung-mon' : GVCN chỉ xử lý môn mình dạy, như mọi GVBM.  ← đã chốt
 *   'gvcn-ca-lop'   : GVCN xử lý cả lớp (AUTH-01 cũ) — hết hiệu lực.
 */
export const C02_GVCN_XU_LY_CASE_TRAI_MON = 'gvcn-dung-mon' as const;

/**
 * C03 — HẾT HIỆU LỰC 21/09/2026. Đã chốt 20/09/2026, từng nối dây vào cửa sổ gộp báo cáo của Case Ý thức.
 * LÝ DO HẾT HIỆU LỰC: rule book mục 18 (`thiet-ke/LUAT_CHO_CHOT.md` mục 6.3) bỏ hẳn mô hình Case Ý thức. Mỗi vi phạm nay là một dòng
 * độc lập, không còn đợt để gộp — nên không còn "cửa sổ ba ngày" nào để đặt. Không mã nào còn đọc hằng số này.
 *
 * Luật cũ: báo cáo khác cùng phân loại trong 3 NGÀY ĐẦU tồn tại của Case cũ (ngày mở + 2 ngày sau) thì lồng vào Case đang có;
 * không thì ra Case mới. Hạn mặc định của Case là 1 tuần từ ngày mở; nâng mức ưu tiên không siết hạn phương án.
 *
 * GIỮ hằng số (không xoá) để dấu vết quyết định còn đó — xoá là xoá mất một quyết định có thật.
 */
export const C03_CUA_SO_GOP_CASE_Y_THUC_NGAY = 3 as const;

/**
 * C04 — HẾT HIỆU LỰC 21/09/2026. Đã chốt 20/09/2026: giữ như hiện tại.
 * LÝ DO HẾT HIỆU LỰC: cùng lý do với C03 — không còn "đợt Ý thức" nên không còn chuyện đợt đã đóng có báo cáo mới. Báo cáo mới
 * chỉ là một vi phạm mới; không có gì để mở lại hay để liên kết.
 *   'doi-moi-lien-ket' : đợt Ý thức đã đóng mà có báo cáo mới thì tạo ĐỢT MỚI liên kết, không viết lại kết luận cũ.  ← luật cũ
 *   'mo-lai'           : mở lại đợt cũ.
 */
export const C04_BAO_CAO_MOI_SAU_KHI_DONG = 'doi-moi-lien-ket' as const;

/**
 * C05 — HẾT HIỆU LỰC 21/09/2026 tối: rulebook v3 thay bằng Phối hợp SOS điền sẵn (thiet-ke/SOS_VA_PHOI_HOP_V3.md §5). Giữ hằng số để lịch sử quyết định còn tra được.
 * Trước đó: ĐÃ CHỐT 19/09/2026 (giữ để không ai khôi phục luật cũ).
 *   'khong-bat-buoc' : SOS KHÔNG bắt buộc sinh phương án trao đổi; GVCN tự quyết định và tự lập phương án.  ← đã chốt
 *   'bat-buoc'       : hai phương án trao đổi tự sinh — LUẬT CŨ, hết hiệu lực (rule book §17.5).
 */
export const C05_SOS_SINH_PA_TRAO_DOI = 'khong-bat-buoc' as const;

/**
 * C06 — ĐÃ CHỐT 20/09/2026: GIỮ như hiện tại.
 *   'chi-da-hoan-thanh' : tab "Đã xong từ trước" chỉ nhận Case ĐÃ HOÀN THÀNH; Case đang xử lý dùng form thường.  ← đã chốt
 *   'ca-dang-xu-ly'     : tab này nhận cả Case còn đang xử lý.
 */
export const C06_NHAP_BU_CASE_DANG_XU_LY = 'chi-da-hoan-thanh' as const;

/**
 * C07 — ĐÃ CHỐT 20/09/2026 (khớp hành vi đang chạy).
 * Writing gồm W1 và W2: PHẢI ĐỦ CẢ HAI. Thiếu một bài nghĩa là giáo viên của bài đó chưa chấm (hoặc chấm sai) — cứ báo quá
 * hạn như bình thường; không lấy W1 thay Writing tổng, không suy ra vắng.
 *   'phai-du-hai-task'    : đủ cả W1 và W2 mới có Writing.  ← đã chốt
 *   'cho-phep-w1-hoac-w2' : cho phép một task — KHÔNG dùng.
 */
export const C07_DOT_FT_CHI_W1_HOAC_W2 = 'phai-du-hai-task' as const;

/**
 * C08 — ĐÃ CHỐT 21/09/2026 đêm. Hạn chấm lớp thường: hết thứ Tư tuần kế tiếp (T19, PR-MTa 06/10 — trước là Chủ nhật tuần thi). Lớp thường CÓ dùng dấu "-": GIÁO VIÊN
 * ghi khi em chưa làm bài của tuần (máy không tự thêm); ghi "-" thì môn đó tự dời sang tuần sau.
 * ĐÃ NỐI DÂY (PR-Rc1): lớp thường ghi '-' thì môn đó tự dời sang tuần sau — `normal/regular.ts`
 * (`reportRegularNoShow`), dùng lại `setSkillWeek`. `attempts.ts` chỉ chỉ đường sang đó.
 *   'chu-nhat-tuan-thi'  : hết Chủ nhật của tuần thi.  ← đã chốt
 */
export const C08_HAN_CHAM_NORMAL = 'chu-nhat-tuan-thi' as const;

/**
 * C09 — ĐÃ CHỐT 20/09/2026 (khớp hành vi đang chạy ở `sweepExpiredMoves`).
 * Đề nghị dời lịch lần hai: chờ Quản lý duyệt cho hết tuần đó; không phản hồi thì HUỶ phần thi. Giáo viên muốn xếp lại
 * thì tự chủ động trao đổi với Quản lý ngoài website.
 *   'tu-choi-khi-het-han' : hết hạn duyệt = coi như bị từ chối, huỷ phần bị ảnh hưởng.  ← đã chốt
 *   'giu-cho-ql-duyet'    : giữ "Chờ quản lý duyệt" tới khi có thao tác — KHÔNG dùng.
 */
export const C09_DE_NGHI_DOI_LICH_HET_HAN = 'tu-choi-khi-het-han' as const;

/**
 * C10 — ĐÃ CHỐT 20/09/2026, ĐÃ NỐI DÂY (`saveScore`, `settleNoShows`, `noShowStateOf`).
 * Nhập '-' cho một tuần ĐÃ KẾT THÚC từ trước: CHỐT NGAY, coi là không dự thi (ngày hiệu lực vẫn là cuối Chủ nhật của tuần
 * lịch của bài). Sau cuối tuần CHỈ Quản lý sửa được kết luận; quyết định mới GHI ĐÈ TRỰC TIẾP quyết định trước và thành
 * quyết định hiện hành — không có bước duyệt lại. Lịch sử thay đổi chỉ lưu ở nhật ký audit để truy vết, không hiển thị và
 * không tham gia luồng việc.
 *   'chot-ngay'         : coi là không dự thi ngay khi nhập.  ← đã chốt
 *   'cho-ql-hieu-chinh' : tạo một mục chờ Quản lý hiệu chỉnh — phương án cũ, còn code nhưng không dùng.
 */
export const C10_NHAP_DAU_TRU_TUAN_QUA_KHU = 'chot-ngay' as const;
