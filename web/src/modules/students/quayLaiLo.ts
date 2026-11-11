/**
 * U02 (SUA-RA-1311, đề bài 13/11): "Quay lại học · n em" ở Lưu trữ — chạy từng em, ghi KẾT QUẢ TỪNG EM để vùng kết quả nằm lại sau khi toast tắt
 * ("Đã xong n/m · Cần chọn lớp · Chưa lưu được"); "Thử lại" gửi lại ĐÚNG các em lỗi (`ids` = phần lỗi, `truoc` = kết quả lần trước, giữ các em khác).
 * Thuần (không React) để phép kiểm máy chủ chạy được; `goi` = `api` của web.
 */
export type KetQuaEm = { id: number; ten: string; tt: 'xong' | 'chon-lop' | 'loi'; loi?: string };
type Goi = { get: <T>(u: string) => Promise<T>; post: (u: string, b: unknown) => Promise<unknown> };

export async function quayLaiLo(ids: readonly number[], tenCua: (id: number) => string, goi: Goi, truoc: readonly KetQuaEm[] = []): Promise<KetQuaEm[]> {
  const ra = new Map(truoc.map((x) => [x.id, x]));
  for (const id of ids) {
    const ten = tenCua(id);
    try {
      const tt = await goi.get<{ huong: string }>(`/students/${id}/quay-lai`);
      if (tt.huong !== 'lop-cu') { ra.set(id, { id, ten, tt: 'chon-lop' }); continue; }
      await goi.post(`/students/${id}/quay-lai`, {});
      ra.set(id, { id, ten, tt: 'xong' });
    } catch (e: any) {
      if (e?.huy) continue;   // Đóng hộp xác nhận = không làm em này, không phải lỗi (giữ kết quả cũ nếu có)
      ra.set(id, { id, ten, tt: 'loi', loi: e?.message ?? '' });
    }
  }
  return [...ra.values()];
}

/** Một em "Cần chọn lớp" vừa xong ở panel (Xử lý tiếp) → đánh dấu xong. */
export const danhDauXong = (kq: readonly KetQuaEm[], id: number): KetQuaEm[] => kq.map((x) => (x.id === id ? { ...x, tt: 'xong' as const, loi: undefined } : x));
