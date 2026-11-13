/**
 * F04 (audit 13/11): Hoàn tác gửi lô tình hình học tập — rút từng bản, ĐỌC kết quả từng em (không nuốt lỗi) để báo "Đã rút n/m · chưa rút: …".
 * Thuần (không React) để phép kiểm máy chủ chạy được; `post` = `api.post` của web.
 */
export type KetQuaHoanTac = { xong: number; tong: number; loi: { ten: string; loi: string }[] };

export async function hoanTacLo(ds: readonly { id: number; ten: string }[], post: (u: string, b: unknown) => Promise<unknown>): Promise<KetQuaHoanTac> {
  const kq = await Promise.allSettled(ds.map((x) => post(`/tinh-hinh/${x.id}/rut`, { hoanTac: true })));
  const loi = kq.flatMap((r, i) => (r.status === 'rejected' ? [{ ten: ds[i].ten, loi: (r.reason as Error)?.message ?? '' }] : []));
  return { xong: ds.length - loi.length, tong: ds.length, loi };
}
