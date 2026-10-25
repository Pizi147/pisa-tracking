/** P1 (chủ SP 24/10): tiêu chí W / S chỉ số nguyên — band x.5 thành bốn tiêu chí nguyên cùng band (5.5 → 5 6 5 6). Chỉ dùng ở seed / phép kiểm. */
export const tieuChiThu = (b: number | null): (number | null)[] =>
  b === null ? [null, null, null, null] : [Math.floor(b), Math.ceil(b), Math.floor(b), Math.ceil(b)];
