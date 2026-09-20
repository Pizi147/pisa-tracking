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
  donVi: 'hoc-vien' | 'case' | 'phuong-an' | 'bai-thi' | 'tin-hieu' | 'dot-test' | 'nghia-vu';
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
    tapDuDieuKien: 'Học viên có đợt Test mới nhất hợp lệ; SOS tạm thời và kết quả cuối tách riêng. Không lấy MAX toàn lịch sử.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id', drilldown: '/metrics/hv-sos-hien-tai',
  },
  {
    id: 'hv-duoi-ky-vong-mon', ten: 'Học viên dưới kỳ vọng theo môn',
    cauHoi: 'Bao nhiêu em dưới kỳ vọng ở một môn cụ thể?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Học viên có thể đánh giá được môn đó. So với kỳ vọng CỦA CHÍNH ĐỢT ĐÓ, không phải target hiện tại.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id theo môn', drilldown: '/metrics/hv-duoi-ky-vong-mon',
  },
  {
    id: 'hv-co-case-mo', ten: 'Học viên có case đang mở',
    cauHoi: 'Bao nhiêu em đang có ít nhất một case chưa kết luận?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Học viên có ít nhất một case chưa kết luận trong phạm vi, kể cả em đã kết thúc khoá mà case chưa được kết luận. KHÔNG gộp case đã đóng (F02). Khác cột "HV đang gặp" ở bảng Thực trạng, vốn chỉ tính em đang học.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id', drilldown: '/metrics/hv-co-case-mo',
  },
  {
    id: 'case-mo', ten: 'Case đang mở',
    cauHoi: 'Bao nhiêu case đang chờ kết luận?',
    donVi: 'case',
    tapDuDieuKien: 'Case chưa kết luận trong phạm vi. Đếm case, không đếm học viên, không đếm tín hiệu SOS.',
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
    tapDuDieuKien: 'Case đang mở, đủ điều kiện cần hỗ trợ, chưa có phương án hợp lệ. Case CHỜ DUYỆT tách riêng, không quy chậm cho giáo viên.',
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
    tapDuDieuKien: 'Nghĩa vụ hoàn thành đúng hạn / nghĩa vụ đến hạn trong kỳ. KHÔNG đếm số lần bấm ghi chú.',
    thoiGian: 'ket-qua-trong-ky', khuTrung: 'COUNT DISTINCT (phương án × chu kỳ)', drilldown: '/metrics/dung-han-cap-nhat',
  },
  {
    id: 'do-phu-danh-gia', ten: 'Độ phủ đánh giá',
    cauHoi: 'Bao nhiêu phần học viên cần đánh giá đã có dữ liệu đủ điều kiện?',
    donVi: 'hoc-vien',
    tapDuDieuKien: 'Học viên có dữ liệu đủ điều kiện / học viên cần được đánh giá. KHÁC tỷ lệ đạt.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT student_id', drilldown: '/metrics/do-phu-danh-gia',
  },
];

/**
 * Tên đơn vị để nói cho người đọc — `18 học viên`, `32 case`. Ba đơn vị học viên · case · phương án
 * tuyệt đối không cộng vào nhau, nên mỗi con số PHẢI đi kèm đơn vị của nó.
 */
export const METRIC_UNIT_LABEL: Record<ChiSo['donVi'], string> = {
  'hoc-vien': 'học viên', case: 'case', 'phuong-an': 'phương án', 'bai-thi': 'bài thi',
  'tin-hieu': 'tín hiệu', 'dot-test': 'đợt Test', 'nghia-vu': 'nghĩa vụ',
};

/** Tra một chỉ số theo mã; mã lạ trả null (không đoán). */
export function metricById(id: string): ChiSo | null {
  return METRICS.find((m) => m.id === id) ?? null;
}
