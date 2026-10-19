/** Sheet máy chủ dựng sẵn (hàng 1 = tiêu đề). */
export type SheetXuat = { ten: string; aoa: (string | number | null)[][] };

/**
 * Dựng `.xlsx` từ mảng hai chiều máy chủ trả (thư viện `xlsx` nạp động — không vào gói chính) rồi tải về. Chữ (tên, email, ghi chú, nhận xét)
 * vào ô KIỂU CHỮ (`t: 's'`) — "=…" không thành công thức (phép kiểm C15-7). Sheet đầu có lọc; cột rộng theo chữ dài nhất 200 dòng đầu.
 */
export async function taiXlsx(sheets: readonly SheetXuat[], tenTep: string): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  sheets.forEach((s, i) => {
    const ws = XLSX.utils.aoa_to_sheet(s.aoa);
    if (i === 0 && ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
    ws['!cols'] = (s.aoa[0] ?? []).map((_, c) => ({ wch: Math.min(48, Math.max(8, ...s.aoa.slice(0, 200).map((h) => String(h[c] ?? '').length + 2))) }));
    XLSX.utils.book_append_sheet(wb, ws, s.ten);
  });
  XLSX.writeFile(wb, tenTep);
}
