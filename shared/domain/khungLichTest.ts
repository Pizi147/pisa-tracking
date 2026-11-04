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

/**
 * LT-GON (chủ SP 05/11: "đừng phân ra MT mấy MT mấy — HV cùng một lớp thì một hàng rồi bấm vào hiện lên"): khối "Quá hạn chấm" MỘT HÀNG MỘT LỚP.
 * Gộp mọi dòng nợ (đợt / MT / kỹ năng / Progress / Final) của cùng lớp: số bài cộng, hạn = hạn CŨ nhất (quá hạn lâu nhất), người chưa chấm hợp lại
 * ("GV chấm chéo" cuối), lượt (attemptIds) hợp lại để lưới dưới hàng chỉ hiện các bài đó. `luoi` = các lưới cần mở (FT một lưới mọi MT; MT0 riêng;
 * lớp thường mỗi bài một lưới). Thứ tự lớp = thứ tự dòng đầu của lớp (máy chủ đã xếp quá hạn lâu trước). Chỉ gộp dữ liệu đã nạp — không thêm request.
 */
export type DongNoGopVao = {
  key: string; classId: number; mode: string; kind: string; attemptNo: number | null; dotLabel: string; periodId: number | null; weekStart: string | null;
  kyNang: string[]; kyNangLabel: string; conBai: number; soHv: number; attemptIds: number[]; han: string | null; quaHan: boolean; luiLich: unknown;
  cuaToi: boolean; duocCham: boolean; coDayLop: boolean; gvNo: string[];
  phan: { toi: { kyNang: string[]; con: number } | null; khac: { kyNang: string[]; con: number; quaHanNgay: number | null } | null } | null;
};
export type LuoiNoLop = { kind: string | null; nhan: string };
export function gopNoTheoLop<T extends DongNoGopVao>(ds: readonly T[], chamCheo: string): (T & { luoi: LuoiNoLop[]; soDong: number })[] {
  const nhom = new Map<number, T[]>();
  for (const d of ds) nhom.set(d.classId, [...(nhom.get(d.classId) ?? []), d]);
  const hop = (a: readonly string[][]) => [...new Set(a.flat())];
  return [...nhom.values()].map((g) => {
    const dau = g[0];
    const han = g.map((d) => d.han).filter((h): h is string => !!h).sort()[0] ?? null;
    const gv = hop(g.map((d) => d.gvNo));
    const gopPhan = (k: 'toi' | 'khac') => {
      const p = g.map((d) => d.phan?.[k]).filter((x): x is NonNullable<typeof x> => !!x);
      if (!p.length) return null;
      const qh = p.map((x) => ('quaHanNgay' in x ? x.quaHanNgay : null)).filter((n): n is number => n !== null);
      return { kyNang: hop(p.map((x) => x.kyNang)), con: p.reduce((n, x) => n + x.con, 0), ...(k === 'khac' ? { quaHanNgay: qh.length ? Math.max(...qh) : null } : {}) };
    };
    const coPhan = g.some((d) => d.phan);
    const khoaLuoi = (d: T) => (d.mode === 'ratio' ? d.kind : d.kind === 'mt0' ? 'mt0' : '');
    const luoi: LuoiNoLop[] = [...new Set(g.map(khoaLuoi))].map((k) => ({ kind: k || null, nhan: k ? g.find((d) => khoaLuoi(d) === k)!.dotLabel.split(' · ')[0] : 'Mock Test' }));
    return {
      ...dau, key: `lop:${dau.classId}`, kind: g.every((d) => d.kind === dau.kind) ? dau.kind : '', attemptNo: null,
      dotLabel: [...new Set(g.map((d) => d.dotLabel))].join(' · '), periodId: null, weekStart: null,
      kyNang: hop(g.map((d) => d.kyNang)), kyNangLabel: hop(g.map((d) => d.kyNangLabel.split(', '))).join(', '),
      conBai: g.reduce((n, d) => n + d.conBai, 0), soHv: g.reduce((n, d) => n + d.soHv, 0), attemptIds: [...new Set(g.flatMap((d) => d.attemptIds))],
      han, quaHan: g.some((d) => d.quaHan), luiLich: null,
      cuaToi: g.some((d) => d.cuaToi), duocCham: g.some((d) => d.duocCham), coDayLop: g.some((d) => d.coDayLop),
      gvNo: [...gv.filter((x) => x !== chamCheo), ...gv.filter((x) => x === chamCheo)],
      phan: coPhan ? { toi: gopPhan('toi'), khac: gopPhan('khac') } as T['phan'] : null,
      luoi, soDong: g.length,
    };
  });
}
