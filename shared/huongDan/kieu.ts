/**
 * HD-a — HƯỚNG DẪN TRÊN WEB (thay sổ tay PDF, đặc tả OV-13 mục 4, mockup `thiet-ke/mockup-ov13-2026-10-15.html` mục 5a–5c).
 * Nội dung là DỮ LIỆU trong mã: mọi chữ là khoá `t()` (chữ Việt, có bản Anh — tsc báo chữ chưa dịch). `<b>…</b>` = chữ đậm (`ChuDam`).
 */
import type { Khoa } from '../i18n/index.ts';

export type VaiHd = 'gv' | 'ql' | 'qt' | 'tvv' | 'cx' | 'admin' | 'ht';

/** "Chỉ cho tôi": khoanh phần tử `data-hd="{hd}"` đang hiện + một dòng chú thích; `duong` = trang mở trước nếu đang ở trang khác.
 *  Nhiều `hd` = cùng một chỗ nhưng máy tính / điện thoại là hai phần tử khác nhau (phép HD-CHI đòi đủ cả hai). */
export type ChiChoToi = { hd: string | readonly string[]; duong?: string; chu: Khoa };
/** Một mục: tên + "khi nào" + 1–4 bước (+ Chỉ cho tôi). */
export type MucHd = { id: string; ten: Khoa; khi?: Khoa; buoc: Khoa[]; chi?: ChiChoToi };
/** Một màn của "Theo màn": khớp đường dẫn theo tiền tố dài nhất (`'/'` chỉ khớp đúng `/`). */
export type ManHd = { id: string; ten: Khoa; duong: string[]; muc: MucHd[] };
export type TuHd = { ten: Khoa; nghia: Khoa };
/** Bốn phần của một vai: Việc hằng tuần (đúng 5) · Theo màn · Luật và hạn · Thuật ngữ. */
export type HuongDan = { viec: MucHd[]; man: ManHd[]; luat: MucHd[]; tu: TuHd[] };
export type PhanHd = 'viec' | 'man' | 'luat' | 'tu';
