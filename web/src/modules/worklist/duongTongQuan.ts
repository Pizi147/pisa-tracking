import { laVaiQuanLy, thamSoCt, type ChuongTrinh } from '@shared/domain/index.ts';
import type { Session } from '../../lib/session.tsx';

/**
 * TQ-QT-NHE A2: vai + URL Tổng quan V5 — MỘT nơi tính cho trang (`OverviewPage`) và khung App (tải trước kèm "Của tôi" của badge), để hai bên cùng khoá
 * đường dẫn (`useApi` gộp GET đang bay theo đúng chuỗi). Tệp nhỏ, không kéo trang Tổng quan (tải lười) vào gói chính.
 */
export type VaiTq = 'tvv' | 'gv' | 'khac' | 'ht' | 'ql' | 'admin' | 'cx';
export const vaiTongQuan = (s: Pick<Session, 'nav' | 'roles'> | null | undefined): VaiTq => {
  const nav = s?.nav;
  return nav?.hvCuaToi ? 'tvv'
    : !nav?.analysis ? (nav?.work ? 'gv' : nav?.students ? 'khac' : 'ht')
      : laVaiQuanLy(s?.roles) ? 'ql' : nav?.workChamDiem ? 'admin' : s?.roles?.includes('cx') ? 'cx' : 'ql';
};
export const thamSoTq = (branchId: number | null, ct: ChuongTrinh) => `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
/* NHẸ HƠN PR-3 (PTA rà #2002 Turso): `gon=1` — bảng chỉ tính SOS (Tình hình + ma trận); Head / QT / Admin `kemViec=1` — việc Công việc "Tất cả" cùng request. */
export const duongTongQuanV5 = (vai: VaiTq, branchId: number | null, khung: ChuongTrinh): string | null =>
  (vai === 'ql' || vai === 'cx' || vai === 'admin' ? `/tong-quan/v5?${thamSoTq(branchId, khung)}&gon=1${vai === 'cx' ? '' : '&kemViec=1'}` : null);
