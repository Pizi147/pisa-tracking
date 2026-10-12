/**
 * LUẬT MT0 (PR-MT0, đặc tả T5, T5b) — lượt Mock số 0 cho em lớp thường FOU/BE/ELE được ghi hướng Lên FT.
 * MT0 = một dòng `assessment_attempts` `kind = 'mt0'`, `attempt_no = 0`, ở tuần Cuối khoá (Final) của lớp đang học; chấm band;
 * SOS chỉ để nhìn (không tín hiệu / Case / PA / Phối hợp). Chốt ở Chuyển tiếp lớp thì thành mốc đầu vào của lộ trình FT mới.
 * Thuần: không đọc DB, ngày truyền vào.
 */
import { mondayOfDate } from './week.ts';
import { tuanLich } from './hienThiNgay.ts';
import { addDaysIso } from './sos.ts';
import type { ProgrammeCode } from './normal.ts';
import type { Huong } from './lenLop.ts';
import { ASSESSED_SKILLS, type AssessedSkill } from './skills.ts';

/** Chương trình có MT0 (không Pre FOU). */
export const MT0_CHUONG_TRINH: readonly ProgrammeCode[] = ['FOU', 'BE', 'ELE'];
/** Band ≤ Target − 2.0 thì chip SOS. */
export const MT0_SOS_CACH = 2.0;

export const laMt0 = (a: { kind?: string | null }): boolean => a.kind === 'mt0';

export const coMt0 = (ma: ProgrammeCode | string | null, huong: Huong | string): boolean =>
  huong === 'fast_track' && !!ma && (MT0_CHUONG_TRINH as readonly string[]).includes(ma);

/** Hạn chấm MT0 = thứ Tư tuần sau tuần thi (= luật lớp thường, đặc tả §1; PR-CT2). Tính khi đọc nên không migrate. */
export const hanChamMt0 = (tuanThi: string): string => addDaysIso(mondayOfDate(tuanThi.slice(0, 10)), 9);

/** Tuần muộn nhất của MT0: thứ Hai tuần 2 FT; chưa có lộ trình FT thì tuần Cuối khoá + 14 ngày (tuần 1 FT = tuần ngay sau Final). */
export function tuanMuonNhatMt0(o: { tuanBatDauFt: string | null; tuanCuoiKhoa: string | null }): string | null {
  if (o.tuanBatDauFt) return addDaysIso(mondayOfDate(o.tuanBatDauFt.slice(0, 10)), 7);
  if (o.tuanCuoiKhoa) return addDaysIso(mondayOfDate(o.tuanCuoiKhoa.slice(0, 10)), 14);
  return null;
}

/**
 * Kiểm tuần mới của MT0: không sớm hơn tuần Cuối khoá (`tuanSomNhat`, so với tuần sớm nhất `tuanDau`), muộn nhất tuần 2 FT (so với
 * tuần muộn nhất `tuanMoi`), luôn trước MT1. Hợp lệ → null.
 */
export function kiemTuanMt0(o: {
  tuanMoi: string; tuanMuonNhat: string | null; tuanMt1: string | null; tuanDau?: string | null; tuanSomNhat?: string | null;
}): string | null {
  const moi = mondayOfDate(o.tuanMoi.slice(0, 10));
  if (o.tuanSomNhat && mondayOfDate((o.tuanDau ?? o.tuanMoi).slice(0, 10)) < mondayOfDate(o.tuanSomNhat.slice(0, 10))) {
    return `MT0 sớm nhất ${tuanLich(o.tuanSomNhat)}.`;
  }
  if (o.tuanMuonNhat && moi > o.tuanMuonNhat.slice(0, 10)) return `MT0 muộn nhất ${tuanLich(o.tuanMuonNhat)}.`;
  if (o.tuanMt1 && moi >= mondayOfDate(o.tuanMt1.slice(0, 10))) return `MT0 phải trước MT1 (${tuanLich(o.tuanMt1)}).`;
  return null;
}

/** Kỹ năng MT0 có band ≤ Target − 2.0 (chip SOS hiển thị). Target null → không SOS. */
export function kyNangSosMt0(bands: Partial<Record<AssessedSkill, number | null>>, target: number | null): { skill: AssessedSkill; band: number }[] {
  if (target === null || target === undefined) return [];
  return ASSESSED_SKILLS.flatMap((skill) => {
    const band = bands[skill];
    return band !== null && band !== undefined && band <= target - MT0_SOS_CACH ? [{ skill, band }] : [];
  });
}

export type TrangThaiMt0 = 'cho' | 'dung' | 'khong_dung' | 'huy';

/** Suy ra, không lưu: huỷ › nằm ở lộ trình FT = dùng › khoá đã đóng hoặc hướng ≠ Lên FT = không dùng › chờ. */
export function trangThaiMt0(o: { status: string; trongLoTrinhFt: boolean; huongFt: boolean; khoaDaDong: boolean }): TrangThaiMt0 {
  if (o.status === 'cancelled') return 'huy';
  if (o.trongLoTrinhFt) return 'dung';
  if (o.khoaDaDong || !o.huongFt) return 'khong_dung';
  return 'cho';
}

export function nhanMt0(t: TrangThaiMt0): string {
  return t === 'khong_dung' ? 'MT0 · không dùng' : t === 'huy' ? 'MT0 · huỷ' : 'MT0';
}

/** Chip SOS MT0: `W 4.0 SOS`. */
export const chipSosMt0 = (x: { skill: AssessedSkill; band: number }): string =>
  `${x.skill[0].toUpperCase()} ${x.band.toFixed(1)} SOS`;
