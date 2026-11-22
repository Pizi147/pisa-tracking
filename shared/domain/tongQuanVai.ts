import { dongNhinThay, HANG_MUC_CV, mucCuaViec, type DongDem } from './tongQuan.ts';
import { laViecChamCheo } from './gopViec.ts';
import { mucHan, type MucHan } from './hienThiNgay.ts';
import { t } from '../i18n/index.ts';

/**
 * NHẸ HƠN PR-3 (Tổng quan "Hôm nay có gì bất thường?", mockup v23 `tong-quan.html`): mọi số Giáo viên / Lớp cần chú ý / Cần xử lý lọc từ `dong` của
 * `/my-work` ĐÃ NẠP (Head / Quản trị / Admin: đúng URL Công việc "Tất cả" — `nguoi=tat-ca`; CX: badge) — KHÔNG câu SQL nào thêm, và đếm bằng CÙNG luật
 * Công việc: dòng nhìn thấy (`dongNhinThay`), bỏ chấm chéo (như `demDongViec`), quá hạn = `urgency` máy chủ.
 */
export type DongTq = DongDem & {
  group: string; mine: boolean; ownerId: number | null; owner: string | null; classId: number | null; classCode: string | null;
  due: string | null; kind?: string | null; hangMuc?: string | null; soBai?: number; cn?: number | null; con?: readonly DongTq[] | null;
};

/** Việc thật trong dòng (dòng gộp lớp × loại → từng việc con). */
export const laViec = <T extends DongTq>(ds: readonly T[]): T[] => ds.flatMap((d) => (d.con?.length ? (d.con as unknown as T[]) : [d]));

/** Việc quá hạn của GV khác (Công việc "Của GV"), đơn vị = dòng của Công việc (`demDongViec(...).quaHan`). */
export const quaHanCuaGv = <T extends DongTq>(ds: readonly T[]): T[] =>
  dongNhinThay(ds.filter((d) => !d.mine)).filter((x) => x.urgency === 'overdue' && !laViecChamCheo(x));

/** Loại ở Tổng quan = mục của Công việc (`mucCuaViec`), riêng Mock / Progress / Checkpoint gộp "chấm" (mockup "3 chấm · 2 Case"). */
export const loaiTq = (it: { group: string; key: string; kind?: string | null; hangMuc?: string | null }): string => {
  const m = mucCuaViec(it);
  return m === 'mock' || m === 'pf' || m === 'cp' ? 'cham' : m;
};
const NHAN_MUC: Record<string, string> = Object.fromEntries(HANG_MUC_CV);
export const nhanLoaiTq = (k: string): string =>
  (k === 'cham' ? t('chấm') : k === 'bao-ph-test' ? t('Báo PH') : k === 'giao' ? t('Việc được giao') : k === 'khac' ? t('Khác') : NHAN_MUC[k] ?? k);

export type NhomGv<T> = { ownerId: number | null; owner: string | null; viec: T[]; loai: [string, number][] };
/** Gom theo người phụ trách: nhiều việc trước, loại nhiều trước; việc chưa ai giữ (`ownerId` null) đứng cuối. */
export function nhomTheoGv<T extends DongTq>(ds: readonly T[]): NhomGv<T>[] {
  const m = new Map<number | null, T[]>();
  for (const x of ds) (m.get(x.ownerId) ?? m.set(x.ownerId, []).get(x.ownerId)!).push(x);
  return [...m].map(([ownerId, viec]) => {
    const l = new Map<string, number>();
    for (const x of viec) l.set(loaiTq(x), (l.get(loaiTq(x)) ?? 0) + 1);
    return { ownerId, owner: viec[0].owner, viec, loai: [...l].sort((a, b) => b[1] - a[1]) };
  }).sort((a, b) => Number(a.ownerId === null) - Number(b.ownerId === null) || b.viec.length - a.viec.length || (a.owner ?? '').localeCompare(b.owner ?? '', 'vi'));
}

/** Cột ma trận "Lớp cần chú ý" (phương án C) — mỗi cột một (nhóm) loại việc của Công việc. */
export type CotLop = 'case' | 'diem' | 'meeting' | 'bcph';
export const cotLopCua = (it: { group: string; key: string }): CotLop | null =>
  it.group === 'no_plan' ? 'case' : it.group === 'score' ? (laViecChamCheo(it) ? null : 'diem')
    : it.group === 'phoi_hop_sos' || it.group === 'meeting_xep_lich' || it.group === 'meeting_ket_qua' ? 'meeting' : it.group === 'xuat_bc_ph' ? 'bcph' : null;
export type OLop<T> = { viec: T[]; /** Số hiện ở ô: Điểm = Σ bài, cột khác = số việc. */ so: number; muc: MucHan; hanSom: string | null };
export type HangLop<T> = { classId: number; classCode: string; o: Partial<Record<CotLop, OLop<T>>> };
/** Mức của một nhóm việc: có việc quá hạn (máy chủ) → 'qua'; không thì hạn sớm nhất theo `mucHan`. */
const mucNhom = (ds: readonly DongTq[], homNay: string): MucHan => {
  if (ds.some((x) => x.urgency === 'overdue')) return 'qua';
  const som = ds.map((x) => x.due).filter((x): x is string => !!x).sort()[0];
  return som ? mucHan(som, homNay) : 'xa';
};
/**
 * Lớp × loại: CHỈ lớp có ô quá hạn / sắp đến (≤ 2 ngày); lớp gấp nhất lên đầu (nhiều ô quá hạn → nhiều ô sắp đến → hạn sớm nhất).
 * Số ô = việc mở ra ở panel của ô (`viec`; Điểm: Σ `soBai` của các việc đó).
 */
export function maTranLop<T extends DongTq>(ds: readonly T[], cot: readonly CotLop[], homNay: string): HangLop<T>[] {
  const theoLop = new Map<number, { code: string; o: Map<CotLop, T[]> }>();
  for (const x of laViec(ds)) {
    const c = cotLopCua(x);
    if (!c || !cot.includes(c) || x.classId == null) continue;
    const l = theoLop.get(x.classId) ?? theoLop.set(x.classId, { code: x.classCode ?? `#${x.classId}`, o: new Map() }).get(x.classId)!;
    (l.o.get(c) ?? l.o.set(c, []).get(c)!).push(x);
  }
  const hang = [...theoLop].map(([classId, l]) => {
    const o: HangLop<T>['o'] = {};
    for (const [c, viec] of l.o) {
      o[c] = { viec, so: c === 'diem' ? viec.reduce((s, x) => s + (x.soBai ?? 0), 0) : viec.length, muc: mucNhom(viec, homNay),
        hanSom: viec.map((x) => x.due).filter((x): x is string => !!x).sort()[0] ?? null };
    }
    return { classId, classCode: l.code, o };
  }).filter((h) => Object.values(h.o).some((x) => x!.muc !== 'xa'));
  const dem = (h: HangLop<T>, m: MucHan) => Object.values(h.o).filter((x) => x!.muc === m).length;
  const som = (h: HangLop<T>) => Object.values(h.o).map((x) => x!.hanSom ?? '9999').sort()[0];
  return hang.sort((a, b) => dem(b, 'qua') - dem(a, 'qua') || dem(b, 'sap') - dem(a, 'sap') || som(a).localeCompare(som(b)) || a.classCode.localeCompare(b.classCode));
}
