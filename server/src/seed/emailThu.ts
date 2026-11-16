import { db } from '../db.ts';

/**
 * OV-13f (Q8): email học viên không được trùng — seed demo và phép kiểm thêm học viên cần email RIÊNG mỗi em (trước đây mọi em dùng chung một
 * email thử). Đếm tăng trong một tiến trình: tất định với cùng thứ tự chạy, không trùng trong một DB.
 */
let n = 0;
export const emailThu = () => `hv.${++n}@demo.test`;
/** CN-1 (tests/dbGoc.ts): bản chép DB gốc đếm tiếp từ số lúc chụp, như chạy riêng — email em tạo không phụ thuộc tệp chạy trước. */
export const soEmailThu = () => n;
export const datSoEmailThu = (k: number) => { n = k; };

/** N47 (chủ SP 16/11): mặc định mới của `commitIntake` cho lớp đã chạy là TUẦN NÀY — seed demo giữ tuần khai giảng như dữ liệu demo cũ (phép kiểm dựa vào). */
export const tuanKhaiGiang = (classId: number): string | null => (db().prepare('SELECT start_date FROM classes WHERE id = ?').get(classId) as any)?.start_date ?? null;
