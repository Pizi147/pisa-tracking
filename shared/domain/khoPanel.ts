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
