/**
 * OV-13f (Q8): email học viên không được trùng — seed demo và phép kiểm thêm học viên cần email RIÊNG mỗi em (trước đây mọi em dùng chung một
 * email thử). Đếm tăng trong một tiến trình: tất định với cùng thứ tự chạy, không trùng trong một DB.
 */
let n = 0;
export const emailThu = () => `hv.${++n}@demo.test`;
/** CN-1 (tests/dbGoc.ts): bản chép DB gốc đếm tiếp từ số lúc chụp, như chạy riêng — email em tạo không phụ thuộc tệp chạy trước. */
export const soEmailThu = () => n;
export const datSoEmailThu = (k: number) => { n = k; };
