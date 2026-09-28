/**
 * PHÍM ĐIỀU HƯỚNG (E2/E3) — luật thuần, không DOM. Danh sách thả (chọn người, menu) đi vòng bằng mũi tên; Tab vòng trong panel;
 * lịch tự vẽ đi theo ngày (←/→), tuần (↑/↓), đầu/cuối tuần (Home/End), tháng (PageUp/PageDown, kẹp ngày cuối tháng).
 */
const DAY = 86_400_000;

/** Chỉ số mục kế tiếp trong danh sách `n` mục đang ở `i` (−1 = chưa chọn); `null` khi phím không thuộc danh sách. */
export function buocDanhSach(n: number, i: number, phim: string): number | null {
  if (n <= 0) return null;
  switch (phim) {
    case 'ArrowDown': return i < 0 ? 0 : (i + 1) % n;
    case 'ArrowUp': return i < 0 ? n - 1 : (i - 1 + n) % n;
    case 'Home': return 0;
    case 'End': return n - 1;
    default: return null;
  }
}

/** Ô nhận focus kế tiếp khi Tab (`lui` = Shift+Tab) trong khung có `n` ô; đi vòng, không thoát khỏi panel. */
export function buocVongFocus(n: number, i: number, lui: boolean): number {
  if (n <= 0) return -1;
  if (i < 0) return lui ? n - 1 : 0;
  return lui ? (i - 1 + n) % n : (i + 1) % n;
}

/** Ngày kế tiếp trên lịch từ `iso` theo phím; `null` khi phím không thuộc lịch. */
export function buocLich(iso: string, phim: string): string | null {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1;
  const d = Number(iso.slice(8, 10));
  const t = Date.UTC(y, m, d);
  const ra = (x: number) => new Date(x).toISOString().slice(0, 10);
  const thu = new Date(t).getUTCDay();          // 0 = Chủ nhật
  const veThuHai = thu === 0 ? -6 : 1 - thu;
  const thang = (buoc: number) => {
    const cuoi = new Date(Date.UTC(y, m + buoc + 1, 0)).getUTCDate();
    return ra(Date.UTC(y, m + buoc, Math.min(d, cuoi)));
  };
  switch (phim) {
    case 'ArrowLeft': return ra(t - DAY);
    case 'ArrowRight': return ra(t + DAY);
    case 'ArrowUp': return ra(t - 7 * DAY);
    case 'ArrowDown': return ra(t + 7 * DAY);
    case 'Home': return ra(t + veThuHai * DAY);
    case 'End': return ra(t + (veThuHai + 6) * DAY);
    case 'PageUp': return thang(-1);
    case 'PageDown': return thang(1);
    default: return null;
  }
}
