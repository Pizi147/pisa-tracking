/**
 * SỔ ĐĂNG KÝ CHỈ SỐ — hợp đồng số liệu (thiet-ke/HOP_DONG_SO_LIEU.md).
 *
 * ẢNH ĐÃ CÓ THẬT: Toàn cảnh ghi 18 học viên / 32 case, còn Thực trạng ghi 20 / 34 dưới cùng một
 * cái tên (F10). Hai màn đếm hai tập khác nhau mà không ai biết. Luật để chuyện đó không tái diễn:
 *
 *   1. MỘT CHỈ SỐ = MỘT HÀM. Cả con số lẫn danh sách khi bấm vào đều gọi CÙNG một hàm trả về
 *      TẬP ID. Số là độ dài của tập. Không có đường nào đếm riêng.
 *   2. Tầng dưới trả tập ID, không trả số — đó là cách duy nhất làm "số khớp danh sách" đúng
 *      theo CẤU TRÚC chứ không nhờ kỷ luật.
 *   3. Phạm vi rỗng trả rỗng. Không hiểu phạm vi rỗng thành toàn hệ thống.
 *   4. Không cộng số học viên theo lớp/chi nhánh/tuần: một em có thể ở nhiều tập.
 *   5. Ba thời gian không trộn: hiện trạng · phát sinh trong kỳ · kết quả trong kỳ.
 *   6. Drill-down áp đúng quyền của số tổng.
 *
 * Mỗi chỉ số khai báo ĐỦ TÁM TRƯỜNG; thiếu một trường thì không được lên dashboard (có phép kiểm
 * khoá điều này). Hàm tập ID nằm ở `server/src/worklist/metrics.ts` — chỉ số nào CHƯA có hàm ở
 * đó thì đã khai báo nhưng chưa dùng được, và máy chủ nói thẳng "chưa có danh sách" thay vì trả
 * một con số không kiểm chứng được.
 */

export type ChiSo = {
  id: string;
  ten: string;
  /** Câu hỏi mà con số trả lời, viết đủ chữ. */
  cauHoi: string;
  /** Đơn vị đếm. Ba đơn vị học viên · case · phương án KHÔNG BAO GIỜ cộng vào nhau. */
  donVi: 'hoc-vien' | 'case' | 'phuong-an' | 'bai-thi' | 'tin-hieu' | 'dot-test' | 'nghia-vu' | 'vi-pham' | 'bien-phap';
  /** Mô tả MẪU SỐ (tập đủ điều kiện), viết đủ chữ. */
  tapDuDieuKien: string;
  thoiGian: 'hien-trang' | 'phat-sinh-trong-ky' | 'ket-qua-trong-ky';
  /** Quy tắc khử trùng. */
  khuTrung: string;
  /** Đường mở danh sách — dùng CÙNG hàm tập ID với con số. */
  drilldown: string;
};

export const METRICS: readonly ChiSo[] = [
  {
    id: 'hv-sos-hien-tai', ten: 'Học viên có SOS hiện tại',
    cauHoi: 'Bao nhiêu em đang có ít nhất một kỹ năng dưới kỳ vọng ở đợt Test mới nhất hợp lệ?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Học viên ĐANG HỌC trong phạm vi, có đợt Test mới nhất hợp lệ (không huỷ, đã có điểm) mà SOS ≥ 1. SOS tạm thời (mới chấm một phần) và kết quả cuối (đủ điểm) tách riêng nhưng đều thuộc tập này. Không lấy MAX toàn lịch sử.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id', drilldown: '/metrics/hv-sos-hien-tai',
  },
  {
    id: 'hv-duoi-ky-vong-mon', ten: 'Học viên dưới kỳ vọng theo môn',
    cauHoi: 'Bao nhiêu em dưới kỳ vọng ở một môn cụ thể?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Mẫu số: học viên đang học mà đợt Test mới nhất hợp lệ ĐÁNH GIÁ ĐƯỢC môn đó (có điểm và có kỳ vọng). Tập đếm: những em trong đó dưới kỳ vọng CỦA CHÍNH ĐỢT ĐÓ, không phải target hiện tại. Không nêu môn thì tính "bất kỳ môn nào".',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id theo môn', drilldown: '/metrics/hv-duoi-ky-vong-mon',
  },
  {
    id: 'hv-co-case-mo', ten: 'Học viên có case đang mở',
    cauHoi: 'Bao nhiêu em đang có ít nhất một case chưa kết luận?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Học viên có ít nhất một case HỌC THUẬT chưa kết luận trong phạm vi, kể cả em đã kết thúc khoá mà case chưa được kết luận. Ý thức không còn case (21/09/2026) nên không có mặt ở đây. KHÔNG gộp case đã đóng (F02). Khác cột "HV đang gặp" ở bảng Thực trạng, vốn chỉ tính em đang học.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id', drilldown: '/metrics/hv-co-case-mo',
  },
  {
    id: 'case-mo', ten: 'Case đang mở',
    cauHoi: 'Bao nhiêu case đang chờ kết luận?',
    donVi: 'case',
    tapDuDieuKien: 'Case HỌC THUẬT chưa kết luận trong phạm vi (Ý thức không còn case). Đếm case, không đếm học viên, không đếm tín hiệu SOS.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT case_id', drilldown: '/metrics/case-mo',
  },
  {
    id: 'tin-hieu-cho-xac-minh', ten: 'Tín hiệu cần xác minh',
    cauHoi: 'Bao nhiêu tín hiệu từ điểm Test còn chờ người tìm nguyên nhân?',
    donVi: 'tin-hieu',
    tapDuDieuKien: 'Tín hiệu còn hiệu lực, chưa xác minh, hạn ba ngày. Sửa điểm sai thì THU HỒI tín hiệu.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT signal_id', drilldown: '/metrics/tin-hieu-cho-xac-minh',
  },
  {
    id: 'case-thieu-pa', ten: 'Case thiếu phương án',
    cauHoi: 'Bao nhiêu case đang mở mà chưa có phương án hợp lệ nào?',
    donVi: 'case',
    tapDuDieuKien: 'Case HỌC THUẬT đang mở, đủ điều kiện cần hỗ trợ, chưa có phương án hợp lệ. Case CHỜ DUYỆT tách riêng, không quy chậm cho giáo viên.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT case_id', drilldown: '/metrics/case-thieu-pa',
  },
  {
    id: 'pa-can-cap-nhat', ten: 'Phương án cần cập nhật',
    cauHoi: 'Bao nhiêu phương án đang theo dõi mà đã quá hạn cập nhật kết quả tuần?',
    donVi: 'phuong-an',
    tapDuDieuKien: 'Phương án đang theo dõi, không chờ duyệt, quá hạn cập nhật tuần. Khác "quá hạn làm" (F11).',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT intervention_id', drilldown: '/metrics/pa-can-cap-nhat',
  },
  {
    id: 'pa-cho-duyet', ten: 'Phương án chờ duyệt',
    cauHoi: 'Bao nhiêu phương án giáo viên đề xuất đang chờ Quản lý trả lời?',
    donVi: 'phuong-an',
    tapDuDieuKien: 'Phương án đang chờ duyệt ở case đang mở trong phạm vi. Đếm phương án — không đếm case, không đếm học viên.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT intervention_id', drilldown: '/metrics/pa-cho-duyet',
  },
  {
    id: 'pa-co-ket-qua', ten: 'Phương án có kết quả xác định',
    cauHoi: 'Bao nhiêu phương án đã kết thúc và có kết quả rõ ràng?',
    donVi: 'phuong-an',
    tapDuDieuKien: 'Phương án đã kết thúc, kết quả thuộc {có tiến bộ, một phần, không tiến bộ, kém hơn}. Một phương án MỘT dòng cuối. Loại case nhập bù.',
    thoiGian: 'ket-qua-trong-ky', khuTrung: 'COUNT DISTINCT intervention_id (kết quả cuối)', drilldown: '/metrics/pa-co-ket-qua',
  },
  {
    id: 'ty-le-co-cai-thien', ten: 'Tỷ lệ có cải thiện',
    cauHoi: 'Trong các phương án đã kết thúc có kết quả xác định, bao nhiêu phần có cải thiện?',
    donVi: 'phuong-an',
    tapDuDieuKien: '(có tiến bộ + một phần) / (bốn mức xác định). LOẠI "chưa đủ dữ liệu" và case nhập bù. Luôn hiện n/N.',
    thoiGian: 'ket-qua-trong-ky', khuTrung: 'COUNT DISTINCT intervention_id (kết quả cuối)', drilldown: '/metrics/ty-le-co-cai-thien',
  },
  {
    id: 'dung-han-cap-nhat', ten: 'Đúng hạn cập nhật',
    cauHoi: 'Bao nhiêu nghĩa vụ cập nhật được hoàn thành đúng hạn?',
    donVi: 'nghia-vu',
    tapDuDieuKien: 'Mẫu số: nghĩa vụ cập nhật tuần (một phương án × một chu kỳ) của case học thuật đã QUA hạn — đã cập nhật hoặc chưa ai cập nhật; phương án chờ duyệt, case Ý thức và case nhập bù không có nghĩa vụ. Tử số: nghĩa vụ hoàn thành đúng hạn. Mặc định mọi nghĩa vụ đã qua hạn tới ngày dữ liệu; có thể giới hạn theo kỳ. KHÔNG đếm số lần bấm ghi chú.',
    thoiGian: 'ket-qua-trong-ky', khuTrung: 'COUNT DISTINCT (phương án × chu kỳ)', drilldown: '/metrics/dung-han-cap-nhat',
  },
  {
    id: 'do-phu-danh-gia', ten: 'Độ phủ đánh giá',
    cauHoi: 'Bao nhiêu phần học viên cần đánh giá đã có dữ liệu đủ điều kiện?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Mẫu số: học viên đang học có ít nhất một đợt Test (không huỷ) đã đến lịch — kể cả chưa chấm. Tử số: em mà đợt đã đến lịch mới nhất đủ điểm mọi kỹ năng bắt buộc (dù đạt hay trượt). KHÁC tỷ lệ đạt.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id', drilldown: '/metrics/do-phu-danh-gia',
  },
  /*
   * Ý THỨC (PR-J, 21/09/2026) — TÁM CHỈ SỐ MỚI, thay "Tái diễn Ý thức" (không còn đợt nên không còn "lần thứ mấy").
   * Nguồn: thiet-ke/HOP_DONG_SO_LIEU.md §5 và Y_THUC_VI_PHAM_VA_BIEN_PHAP.md §8. BA ĐƠN VỊ vi phạm · học viên · biện pháp
   * không bao giờ cộng vào nhau. Ý thức nằm hoàn toàn ngoài mọi bảng hiệu quả hỗ trợ.
   */
  {
    id: 'vi-pham-tong', ten: 'Vi phạm',
    cauHoi: 'Có bao nhiêu vi phạm còn hiệu lực đã xảy ra trong kỳ?',
    donVi: 'vi-pham',
    tapDuDieuKien: 'Vi phạm còn hiệu lực (không bị đánh dấu không chính xác). Đếm theo NGÀY XẢY RA, không theo ngày ghi nhận — GV nhớ ra muộn không làm sự việc xảy ra muộn. Thuộc lớp GHI LÚC ĐÓ.',
    thoiGian: 'phat-sinh-trong-ky', khuTrung: 'COUNT DISTINCT violation_id', drilldown: '/metrics/vi-pham-tong',
  },
  {
    id: 'vi-pham-chua-xu-ly', ten: 'Vi phạm chưa xử lý',
    cauHoi: 'Hiện có bao nhiêu vi phạm còn hiệu lực mà chưa nằm trong biện pháp nào?',
    donVi: 'vi-pham',
    tapDuDieuKien: 'Vi phạm còn hiệu lực và KHÔNG có dòng nào trong bảng nối với biện pháp — kể cả biện pháp đang chuẩn bị (đã gom vào là GVCN đã bắt tay xử lý). Theo lớp học viên ĐANG học.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT violation_id', drilldown: '/metrics/vi-pham-chua-xu-ly',
  },
  {
    id: 'vi-pham-khong-hieu-luc', ten: 'Vi phạm không còn hiệu lực',
    cauHoi: 'Có bao nhiêu vi phạm đã bị đánh dấu không chính xác trong kỳ?',
    donVi: 'vi-pham',
    tapDuDieuKien: 'Vi phạm đã đánh dấu không chính xác. Đứng RIÊNG: không trừ vào "Vi phạm" trên cùng một hàng. Đếm theo ngày xảy ra.',
    thoiGian: 'phat-sinh-trong-ky', khuTrung: 'COUNT DISTINCT violation_id', drilldown: '/metrics/vi-pham-khong-hieu-luc',
  },
  {
    id: 'hv-co-vi-pham', ten: 'Học viên có vi phạm',
    cauHoi: 'Có bao nhiêu học viên có ít nhất một vi phạm còn hiệu lực trong kỳ?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Học viên có ít nhất một vi phạm còn hiệu lực xảy ra trong kỳ. Em có ba vi phạm vẫn là MỘT học viên; em chỉ có vi phạm đã hủy thì không tính.',
    thoiGian: 'phat-sinh-trong-ky', khuTrung: 'COUNT DISTINCT student_id', drilldown: '/metrics/hv-co-vi-pham',
  },
  {
    id: 'hv-can-xu-ly', ten: 'Học viên cần xử lý',
    cauHoi: 'Có bao nhiêu học viên đang có vi phạm để lâu chưa xử lý?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Học viên đang học có ít nhất một vi phạm chưa xử lý VÀ cái cũ nhất đã quá 5 ngày. CÙNG hàm với cảnh báo 5 ngày ở tab Ý thức, dòng danh sách lớp và Việc cần làm của GVCN — không đếm riêng.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id', drilldown: '/metrics/hv-can-xu-ly',
  },
  {
    id: 'bien-phap-da-thuc-hien', ten: 'Biện pháp đã thực hiện',
    cauHoi: 'Có bao nhiêu biện pháp xử lý đã được thực hiện trong kỳ?',
    donVi: 'bien-phap',
    tapDuDieuKien: 'Biện pháp đã thực hiện, đếm theo NGÀY THỰC HIỆN thực tế. Một Report gom n vi phạm là MỘT biện pháp, không phải n. Thuộc lớp của biện pháp.',
    thoiGian: 'ket-qua-trong-ky', khuTrung: 'COUNT DISTINCT measure_id', drilldown: '/metrics/bien-phap-da-thuc-hien',
  },
  {
    id: 'bien-phap-dang-chuan-bi', ten: 'Biện pháp đang chuẩn bị',
    cauHoi: 'Hiện có bao nhiêu biện pháp đã tạo mà chưa thực hiện?',
    donVi: 'bien-phap',
    tapDuDieuKien: 'Biện pháp ở trạng thái đang chuẩn bị. Biện pháp không có hạn nên không có khái niệm "quá hạn".',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT measure_id', drilldown: '/metrics/bien-phap-dang-chuan-bi',
  },
  {
    id: 'bien-phap-theo-loai', ten: 'Biện pháp theo loại',
    cauHoi: 'Trong kỳ đã thực hiện bao nhiêu biện pháp mỗi loại?',
    donVi: 'bien-phap',
    tapDuDieuKien: 'Biện pháp đã thực hiện trong kỳ, tách CHÍN loại. Ba Thư cảnh cáo lần 1, 2, 3 tách riêng — không gộp thành một dòng. Có thể lọc một loại bằng tham số kind.',
    thoiGian: 'ket-qua-trong-ky', khuTrung: 'COUNT DISTINCT measure_id theo loại', drilldown: '/metrics/bien-phap-theo-loai',
  },
];

/**
 * Tên đơn vị để nói cho người đọc — `18 học viên`, `32 case`. Ba đơn vị học viên · case · phương án
 * tuyệt đối không cộng vào nhau, nên mỗi con số PHẢI đi kèm đơn vị của nó.
 */
export const METRIC_UNIT_LABEL: Record<ChiSo['donVi'], string> = {
  'hoc-vien': 'học viên', case: 'case', 'phuong-an': 'phương án', 'bai-thi': 'bài thi',
  'tin-hieu': 'tín hiệu', 'dot-test': 'đợt Test', 'nghia-vu': 'nghĩa vụ',
  'vi-pham': 'vi phạm', 'bien-phap': 'biện pháp',
};

/** Tra một chỉ số theo mã; mã lạ trả null (không đoán). */
export function metricById(id: string): ChiSo | null {
  return METRICS.find((m) => m.id === id) ?? null;
}
