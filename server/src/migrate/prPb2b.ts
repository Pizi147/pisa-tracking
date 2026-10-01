/**
 * PR-Pb2-b (bảng Phân tích giáo viên, Q13, Q14): CHỈ ĐỔI CẤU TRÚC — ba cột ngày nghiệp vụ. KHÔNG chép dữ liệu cũ, không lệnh chạy thử
 * (DB được reset trước bản chính). Tự kiểm cột nên chạy lặp được; lần hai không báo gì. Ba cột cũng nằm CUỐI bảng trong `schema.sql`.
 */
const COT: [bang: string, cot: string, lyDo: string][] = [
  ['assessment_scores', 'nhap_dau_ngay', 'Ô điểm: ngày nhập đầu (tính chấm đúng hạn; sửa sau không đổi)'],
  ['violations', 'han_xu_ly', 'Vi phạm: hạn xử lý chốt lúc thành "Cần xử lý"'],
  ['violations', 'phan_hoi_ngay', 'Vi phạm: ngày GVCN xác nhận xử lý hoặc gửi đề xuất lần đầu'],
];

export function migratePrPb2b(conn: any, applied: string[]) {
  for (const [bang, cot, lyDo] of COT) {
    if ((conn.prepare(`PRAGMA table_info(${bang})`).all() as any[]).some((c) => c.name === cot)) continue;
    conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} TEXT`);
    applied.push(lyDo);
  }
}
