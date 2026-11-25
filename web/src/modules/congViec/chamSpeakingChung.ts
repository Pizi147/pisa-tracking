import type { Cell } from '../fasttrack/ScoreEntry.tsx';
import type { FtSheet } from '../cham/LuoiFT.tsx';
import type { NguoiChon } from '@shared/domain/index.ts';
import { tuanLich } from '@shared/domain/index.ts';

/**
 * Dữ liệu + hàm gom của tab "Chấm Speaking" (khuôn A, mockup `thiet-ke/v26/cham-speaking.html`) — dùng chung giữa danh sách lớp (`ChamSpeakingMuc`) và panel
 * (`PanelChamSpeaking`, lazy): cùng một đường `GET /my-work/cham-speaking` (`baiChamSpeaking`, server/src/fasttrack/attempts.ts), cùng hàm đếm.
 */
export type Dong = FtSheet['rows'][number] & {
  classId: number; classCode: string; weekStart: string | null; kyVong: number | null;
  /** Lớp thường (MT0). */
  laThuong?: boolean;
  /** S-CHEO-CN: chỉ có ở `?cn=khac` (mục "Chi nhánh khác"). */
  branchName?: string;
  /** Chưa chấm (đếm vào "n bài"); false = đã có điểm (ngăn "Đã có điểm"). */
  cho: boolean; cell: Cell & { enteredById?: number | null };
};
/** Một lớp = một dòng danh sách = một panel. */
export type Lop = { khoa: string; classId: number; classCode: string; branchName: string; thuong: boolean; rows: Dong[] };
export type DuLieu = { rows: Dong[]; soBai: number;
  /** LG-5c / GD-2: "GV chấm" đã chọn của người xem theo "lớp:đợt" (`docGvChamCotLo`); ô chưa chọn → `macDinh`. */
  gvChamCot?: { chon: Record<string, NguoiChon | null>; macDinh: NguoiChon | null } };

export const duongChamSpeaking = (nguoi: number | null, cnKhac: boolean) => {
  const x = [nguoi ? `nguoi=${nguoi}` : '', cnKhac ? 'cn=khac' : ''].filter(Boolean).join('&');
  return `/my-work/cham-speaking${x ? `?${x}` : ''}`;
};

/** Tìm không dấu, không phân biệt hoa thường. */
export const chuan = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
export const soCho = (rows: readonly Dong[]) => rows.filter((r) => r.cho).length;
export const soQua = (rows: readonly Dong[]) => rows.filter((r) => r.cho && r.cell.overdue).length;
/** Hạn sớm nhất của bài còn chờ ("25/08"). */
export const hanSom = (rows: readonly Dong[]) => rows.filter((r) => r.cho && r.cell.deadline).map((r) => r.cell.deadline!).sort()[0] ?? null;
export const locQ = (rows: Dong[], q: string) => {
  const k = chuan(q);
  return k ? rows.filter((r) => chuan(r.studentName).includes(k) || chuan(r.studentEmail ?? '').includes(k)) : rows;
};
/** Mã tuần của các bài còn chờ, cũ → mới, không trùng: "W4 AUG, W1 SEP" (chủ SP 25/11: chỉ mã tuần, không ghi Mock / MT). */
export const tuanCuaLop = (rows: readonly Dong[], chiCho = true) =>
  [...new Set(rows.filter((r) => (!chiCho || r.cho) && r.weekStart).map((r) => r.weekStart!))].sort().map((w) => tuanLich(w)).join(', ');

/**
 * Gom theo lớp (S-CHEO-CN 16/11); KHUÔN A (chủ SP 25/11): lớp còn bài xếp theo hạn sớm nhất (quá hạn lên đầu), không hạn sau cùng; lớp hết bài cuối, theo mã.
 * Trong lớp: tuần gần nhất lên đầu, rồi tên em. "Lớp tiếp ›" đi theo thứ tự này.
 */
export function gom(rows: Dong[]): Lop[] {
  const lop = new Map<number, Lop>();
  for (const r of rows) {
    const l = lop.get(r.classId) ?? { khoa: `l${r.classId}`, classId: r.classId, classCode: r.classCode, branchName: r.branchName ?? '', thuong: !!r.laThuong, rows: [] };
    lop.set(r.classId, l);
    l.rows.push(r);
  }
  const ma = (a: Lop, b: Lop) => a.classCode.localeCompare(b.classCode, 'vi', { numeric: true });
  const ds = [...lop.values()].sort((a, b) => {
    const ca = soCho(a.rows) > 0, cb = soCho(b.rows) > 0;
    if (ca !== cb) return ca ? -1 : 1;
    const ha = hanSom(a.rows), hb = hanSom(b.rows);
    return (ha ?? '9999').localeCompare(hb ?? '9999') || ma(a, b);
  });
  for (const l of ds) {
    l.rows.sort((a, b) => (b.weekStart ?? '').localeCompare(a.weekStart ?? '') || a.studentName.localeCompare(b.studentName, 'vi') || a.attemptNo - b.attemptNo);
  }
  return ds;
}
/** Lớp kế còn bài sau `n` theo thứ tự danh sách, vòng lại đầu; không còn lớp nào khác → null. */
export const lopKe = (ds: readonly Lop[], n: Lop) => ds.slice(ds.indexOf(n) + 1).find((x) => soCho(x.rows)) ?? ds.find((x) => x !== n && soCho(x.rows)) ?? null;
