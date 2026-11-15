/**
 * HD-a — HƯỚNG DẪN TRÊN WEB (thay sổ tay PDF, đặc tả OV-13 mục 4). Nội dung là DỮ LIỆU trong mã: mọi chữ là khoá `t()` (chữ Việt, có bản Anh —
 * tsc báo chữ chưa dịch). `<b>…</b>` = chữ đậm (`ChuDam`).
 * HD-V2 (đặc tả `2026-11-05-huong-dan-v2/de-xuat.md` mục 5, 9.5): "mỗi việc một lối chính" — `lam` (Tôi muốn…) là MỘT nguồn; "Việc làm ở đây"
 * của mỗi màn dựng từ `loiChinh` / `loiTat` (không viết tay ở từng màn). Vai chưa chuyển (PR b, c) giữ `viec` + `muc` cũ, panel vẫn hiện.
 */
import type { Khoa } from '../i18n/index.ts';

/** Bỏ dấu: "han" tìm ra "hạn", "de xuat" ra "Đề xuất". Ở đây, không ở `index.ts`: ô tìm thanh trên (`ToKhop`) dùng mà không kéo nội dung Hướng dẫn vào gói chính. */
export const boDau = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

export type VaiHd = 'gv' | 'ql' | 'qt' | 'tvv' | 'cx' | 'admin' | 'ht';

/** "Chỉ cho tôi": khoanh phần tử `data-hd="{hd}"` đang hiện + một dòng chú thích; `duong` = trang mở trước nếu đang ở trang khác.
 *  Nhiều `hd` = cùng một chỗ nhưng máy tính / điện thoại là hai phần tử khác nhau (phép HD-CHI đòi đủ cả hai). */
export type ChiChoToi = { hd: string | readonly string[]; duong?: string; chu: Khoa };
/** Một mục: tên + "khi nào" + 1–4 bước (+ Chỉ cho tôi). HD-V2: `viec` = bước riêng ở màn này của việc `viec` (ô Lối chính vẫn sinh từ `lam`). */
export type MucHd = { id: string; ten: Khoa; khi?: Khoa; buoc: Khoa[]; chi?: ChiChoToi; viec?: string };
/** Một đích bấm được (Trước / Sau, Không làm ở đây): chữ đúng nhãn web + đường (`App.tsx`). */
export type DichHd = { chu: Khoa; duong: string };
/**
 * Một màn: khớp đường dẫn theo tiền tố dài nhất (`'/'` chỉ khớp đúng `/`). HD-V2: `dangO` (một câu + Trước / Sau), `khongLam`
 * (đích đúng chỗ hoặc `cua` = "việc của QL"); `panel` = mục của panel đang mở (`KhungPanel hd=…`), `duong` rỗng.
 */
export type ManHd = {
  id: string; ten: Khoa; duong: string[]; muc: MucHd[];
  dangO?: { cau: Khoa; truoc?: DichHd; sau?: DichHd };
  khongLam?: { ten: Khoa; den?: DichHd; cua?: Khoa }[];
  panel?: PanelHd;
  /** HD3-1: panel mở NGOÀI dòng việc (Case từ hồ sơ HV, form Vi phạm) → thẻ việc của panel (id trong `lam`) — "?" mở thẳng tầng 1. */
  the?: string;
};
/** HD-V3: panel LÀM VIỆC có mục riêng (`KhungPanel hd=…`); mảng để phép HD-PANEL duyệt. Panel không có ở đây: "?" mở Màn nền. */
export const PANEL_HD = [
  'ngan-case', 'nhap-diem', 'ket-qua-pa', 'phoi-hop-sos', 'vi-pham', 'xu-ly-vi-pham', 'ban-giao', 'bao-cao-ph', 'chuyen-lop', 'xuat-excel', 'lo-trinh',
  'duyet', 'sua-thong-tin', 'sua-ca-lop', 'sau-thi', 'chot-ngay-thi', 'xep-lich-mt', 'them-hv', 'xuat-ds', 'bao-ph', 'xet-lai',
] as const;
export type PanelHd = (typeof PANEL_HD)[number];
export type TuHd = { ten: Khoa; nghia: Khoa };

/** Nhóm cố định của Tôi muốn… (đặc tả 3.4) — nhóm trống ẩn. */
export type NhomHd = 'diem' | 'case' | 'hv' | 'lich' | 'duyet' | 'khac';
/**
 * Một việc của vai (Tôi muốn…). `loiChinh.man` = id màn của lối chính (không có = làm ở mọi màn, vd ô Tìm); `duong` = "Đi tới ›" (không có:
 * đường cần id, vd hồ sơ một em). `loiTat` = id màn cũng mở cùng chỗ → "Việc làm ở đây" của màn đó tự có việc này + ô Lối chính.
 * `tatThem` = lối tắt không phải màn ("⋯ dòng em"). `tuKhac` = từ đồng nghĩa để tìm (chữ thô, VI + EN). `chiGvcn` / `chiS`: chỉ GV chủ nhiệm / GV Speaking.
 */
export type ViecHd = {
  id: string; ten: Khoa; nhom: NhomHd;
  loiChinh: { man?: string; chu: Khoa; duong?: string; chi?: ChiChoToi };
  loiTat?: string[]; tatThem?: Khoa[]; cung?: Khoa;
  buoc: Khoa[]; tuKhac?: string[]; chiGvcn?: true; chiS?: true;
  /**
   * HD3-1 — THẺ VIỆC khuôn cố định (đặc tả 15 mục 4.4): Khi nào có · Làm (= `buoc`) · Xong khi · Hạn · Làm sai · Không làm được · Sau đó.
   * Dòng không có thì không hiện; mỗi dòng ≤ 1 câu. Hạn viết bằng mã chèn `{han:ma}` / `{han:ma.truong}` (`chenHan` — số lấy từ Hạn mặc định).
   * `khiCo` / `sau` viết theo TÊN VAI ("GV kỹ năng đó"), không "bạn" — vai làm thay / chỉ xem đọc cùng thẻ (15 mục 8.3).
   */
  khiCo?: Khoa; xong?: Khoa; han?: Khoa; sai?: Khoa; khongDuoc?: Khoa[]; sau?: Khoa;
  /** Nhóm Tôi muốn… + tầng 2 Công việc: khoá tab Công việc (`TAB_CV`, TVV `NHOM_CV_TVV`) hoặc `duyet` · `hv` · `khac`. Thiếu: suy từ `nhom`. */
  tab?: string;
  /** Loại DÒNG VIỆC trên web mở thẻ này ở tầng 1 (`maViec` của dòng: nhóm việc máy chủ, `cham_speaking`). */
  viecWeb?: string[];
  /** HD3-6 (phép HD-NHAN theo tệp): tệp web của MÀN / PANEL làm việc này — chữ đậm của thẻ phải có trong các tệp này (+ `web/src/ui`, `shared/domain`,
   *  `mywork.ts`). Thiếu: so cả nguồn như HD-V2 (HD3-2 … HD3-5 khai khi viết thẻ). */
  tep?: string[];
};
/**
 * HD3-1 — THẺ TRƯỜNG HỢP (tab "Trường hợp", đặc tả 15 mục 4.7): Máy làm gì · Bạn làm gì · Ai khác nhận việc; `the` = thẻ việc liên quan (id trong `lam`).
 */
export type TinhHuongHd = { id: string; ten: Khoa; may?: Khoa[]; ban?: Khoa; ai?: Khoa[]; the?: string; tuKhac?: string[] };
/** Việc của vai khác — chỉ hiện trong kết quả tìm, một dòng "… — việc của QL". */
export type ViecVaiKhac = { ten: Khoa; cua: Khoa; tuKhac?: string[] };

/**
 * Phần của một vai. Cũ: Việc hằng tuần (`viec`) · Theo màn · Luật và hạn · Thuật ngữ. HD-V2: `lam` (Tôi muốn…) + `tuan` (nhịp → id việc của `lam`)
 * + `vaiKhac`; vai đã chuyển không còn `viec`.
 */
export type HuongDan = {
  viec: MucHd[]; man: ManHd[]; luat: MucHd[]; tu: TuHd[];
  lam?: ViecHd[]; tuan?: { nhip: Khoa; viec: string[] }[]; vaiKhac?: ViecVaiKhac[];
  /** HD3-1: tab "Trường hợp" (ẩn tình huống vai không gặp = không viết ở vai đó). */
  tinhHuong?: TinhHuongHd[];
  /** HD3-5: tên tab Công việc riêng của vai (Admin / QL: "van-hanh" = "Việc quản lý") — Hướng dẫn gọi đúng tên trên trang. */
  tenTab?: Partial<Record<string, Khoa>>;
};

/**
 * HD3-1 "Có gì mới" (đặc tả 15 mục 4.8): số phiên bản nội dung Hướng dẫn — tăng sau mỗi đợt đổi lớn (kèm dòng ở `CO_GI_MOI`). Tài khoản lưu số
 * phiên bản đã xem (`users.da_xem_huong_dan`); nhỏ hơn số này → chấm trên "?". Ở đây (không ở `index.ts`): thanh trên đọc mà không kéo nội dung.
 */
export const PHIEN_BAN_HD = 3;
export type PhanHd = 'viec' | 'man' | 'luat' | 'tu';
