/* TD-NGUOI-2: giờ Việt Nam — tách khỏi `PanelBaoPhTvv.tsx` (thẻ Ý thức dùng thẳng, panel tải khi mở). */
/** "14/09/2026 15:30" giờ Việt Nam từ ISO UTC của máy chủ. */
export const lucVn = (iso: string) => {
  const d = new Date(Date.parse(iso) + 7 * 3_600_000).toISOString();
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} ${d.slice(11, 16)}`;
};
/** "15:30" giờ Việt Nam lúc này — chân "✓ Đã lưu" cùng giờ với Lịch sử. */
export const gioVnNay = () => lucVn(new Date().toISOString()).slice(-5);
