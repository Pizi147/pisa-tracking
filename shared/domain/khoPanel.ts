/**
 * KHO "MỘT PANEL MỘT LÚC" (PR-UX0, N-4, G-8) — thuần, không React, kiểm được bằng harness máy chủ.
 *
 * Mở panel B khi panel A đang mở → gọi `dong` của A (một lần) rồi ghi B; không bao giờ có hai panel. Đóng A sau khi B
 * đã mở (cleanup của A chạy muộn) → không làm gì, để không đóng nhầm B. `KhungPanel` dùng một kho chung toàn web.
 */
export type KhoPanel = {
  mo(id: string, dong: () => void): void;
  dong(id: string): void;
  dangMo(): string | null;
};

export function taoKhoPanel(): KhoPanel {
  let hienTai: { id: string; dong: () => void } | null = null;
  return {
    mo(id, dong) {
      const cu = hienTai;
      hienTai = { id, dong };
      if (cu && cu.id !== id) cu.dong();
    },
    dong(id) {
      if (hienTai?.id === id) hienTai = null;
    },
    dangMo() {
      return hienTai?.id ?? null;
    },
  };
}

/**
 * KHOÁ `?so-lieu=` CỦA MỘT SỐ BẤM ĐƯỢC (OV-13b; SL1 A1-01). Hai nơi cùng trang vẽ cùng một số (dải "HV cần chú ý" và hàng tổng bảng) phải khác
 * `vung` — trùng khoá thì bấm một số mở HAI panel, kho một panel đóng cả hai (số "nháy"). Không `vung` = khoá cũ (link đã lưu vẫn mở).
 */
export function khoaSoLieu(o: { id?: string; extra?: Record<string, string>; nguon?: string; vung?: string }): string {
  const goc = o.id !== undefined ? `${o.id}${o.extra ? `|${new URLSearchParams(o.extra)}` : ''}` : `nguon:${o.nguon}`;
  return o.vung ? `${goc}|@${o.vung}` : goc;
}

/**
 * NHÁP THEO KHOÁ VIỆC (NEN-PANEL, 08 K12; T15, T16) — chữ đang gõ trong panel việc giữ ở máy (`sessionStorage` của thẻ trình duyệt), khoá =
 * khoá việc + tên ô. Tải lại trang / lỡ rời trang rồi mở lại đúng việc đó → chữ còn. Lưu xong hoặc "Bỏ chữ" → `xoaNhapViec`. Kho hỏng
 * (chế độ riêng tư, đầy) thì bỏ qua: nháp là tiện ích, không được chặn việc gõ / lưu. Thuần, kiểm được ở harness máy chủ.
 */
export type KhoNhap = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
const TIEN_TO_NHAP = 'pisa-nhap:';
const khoaNhap = (viec: string, o: string) => `${TIEN_TO_NHAP}${viec}\u0001${o}`;

export function docNhap<T>(kho: KhoNhap | null, viec: string, o: string): T | undefined {
  try {
    const s = kho?.getItem(khoaNhap(viec, o));
    return s == null ? undefined : JSON.parse(s) as T;
  } catch { return undefined; }
}

/** `trong` = ô đã về giá trị ban đầu → xoá khoá (không để nháp rỗng làm panel tưởng còn chữ). */
export function ghiNhap(kho: KhoNhap | null, viec: string, o: string, gt: unknown, trong: boolean): void {
  try {
    if (trong) kho?.removeItem(khoaNhap(viec, o));
    else kho?.setItem(khoaNhap(viec, o), JSON.stringify(gt));
  } catch { /* kho đầy / bị chặn — chữ vẫn trong ô */ }
}

export function xoaNhapViec(kho: KhoNhap | null, viec: string): void {
  if (!kho) return;
  try {
    const dau = `${TIEN_TO_NHAP}${viec}\u0001`;   // \u0001: khoá việc có thể chứa ':' / '|'
    const bo: string[] = [];
    for (let i = 0; i < kho.length; i++) { const k = kho.key(i); if (k?.startsWith(dau)) bo.push(k); }
    for (const k of bo) kho.removeItem(k);
  } catch { /* như trên */ }
}

/** "Lưu · việc tiếp ›" (V5; R1-LUU-TIEP đổi chữ 07 mục 4.4): chỉ sang việc kế SAU khi máy chủ trả đã lưu — `luu` trả `false` / ném lỗi thì ở lại, chữ giữ. */
export async function luuRoiTiep(luu: () => Promise<boolean | void>, tiep: () => void): Promise<void> {
  if ((await luu()) !== false) tiep();
}

/**
 * CHỦ NHÁP (rà #530): nháp chỉ của MỘT người + góc nhìn. Phiên đổi chủ (đăng xuất, đổi tài khoản, đổi góc nhìn, hết phiên rồi người khác đăng
 * nhập cùng thẻ) → xoá mọi nháp trước khi trang mới vẽ — chữ của người trước không lọt sang người sau cùng máy. Khoá chủ ngoài tiền tố nháp.
 */
export function datChuNhap(kho: KhoNhap | null, chu: string): void {
  if (!kho) return;
  try {
    if (kho.getItem('pisa-nhap-chu') === chu) return;
    const bo: string[] = [];
    for (let i = 0; i < kho.length; i++) { const k = kho.key(i); if (k?.startsWith(TIEN_TO_NHAP)) bo.push(k); }
    for (const k of bo) kho.removeItem(k);
    kho.setItem('pisa-nhap-chu', chu);
  } catch { /* kho hỏng: không có nháp để lọt */ }
}
