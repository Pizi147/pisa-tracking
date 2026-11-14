/**
 * GD-16 (mockup ⑩, lời 37): chia một danh sách theo chi nhánh — dải theo id chi nhánh tăng dần (cùng thứ tự `soSanhLop` máy chủ), trong dải GIỮ thứ tự
 * máy chủ trả. Mục không biết chi nhánh vào dải cuối "Khác".
 */
export function theoChiNhanh<T>(ds: readonly T[], cua: (x: T) => { id: number; ten: string } | null): { khoa: string; ten: string; ds: T[] }[] {
  const m = new Map<number, { khoa: string; ten: string; ds: T[] }>();
  for (const x of ds) {
    const cn = cua(x);
    const id = cn?.id ?? Number.MAX_SAFE_INTEGER;
    (m.get(id) ?? m.set(id, { khoa: String(cn?.id ?? 'khac'), ten: cn?.ten ?? '—', ds: [] }).get(id)!).ds.push(x);
  }
  return [...m].sort(([a], [b]) => a - b).map(([, g]) => g);
}
