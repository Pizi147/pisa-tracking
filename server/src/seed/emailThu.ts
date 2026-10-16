/**
 * OV-13f (Q8): email học viên không được trùng — seed demo và phép kiểm thêm học viên cần email RIÊNG mỗi em (trước đây mọi em dùng chung một
 * email thử). Đếm tăng trong một tiến trình: tất định với cùng thứ tự chạy, không trùng trong một DB.
 */
let n = 0;
export const emailThu = () => `hv.${++n}@demo.test`;
