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
