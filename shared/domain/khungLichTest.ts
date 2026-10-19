/**
 * KHUNG MẶC ĐỊNH CỦA LỊCH TEST (OV-15b mục 6, C14; chủ SP 19/10 "Lịch Test tự chọn Fast Track che bài lớp thường").
 * `null` = hiện CẢ HAI khung. Thứ tự: `loai` trên đường dẫn (`tat-ca` = cả hai) → khung của lớp trên đường dẫn → khung có bài CỦA NGƯỜI XEM
 * (cả hai có bài → cả hai) → khung có lớp (cả hai có lớp → cả hai). Không theo khung đã nhớ trên máy: lựa chọn cũ không được giấu bài khung kia.
 */
export type KhungLich = 'ft' | 'thuong';

export function khungLichTestMacDinh(o: {
  param: string | null; theoLop: KhungLich | null;
  /** Số bài còn phải chấm của người xem theo khung (mọi khối). */
  coBai: Record<KhungLich, number>;
  /** Số lớp theo khung (mọi khối). */
  dem: Record<KhungLich, number>;
  /** Phạm vi người xem có cả hai khung — khung chọn trên đường dẫn mở được cả khi tuần này rỗng (UX-2). */
  phamViHai: boolean;
}): KhungLich | null {
  if (o.param === 'tat-ca') return null;
  if ((o.param === 'ft' || o.param === 'thuong') && (o.dem[o.param] > 0 || o.phamViHai)) return o.param;
  if (o.theoLop && o.dem[o.theoLop] > 0) return o.theoLop;
  const chon = (so: Record<KhungLich, number>): KhungLich | null | undefined =>
    so.ft > 0 && so.thuong > 0 ? null : so.ft > 0 ? 'ft' : so.thuong > 0 ? 'thuong' : undefined;
  const theoBai = chon(o.coBai);
  if (theoBai !== undefined) return theoBai;
  return chon(o.dem) ?? null;
}
