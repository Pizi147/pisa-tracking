import { QuaHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { deadlineView, type DeadlineKind, type LienHe, type NhomXuLy } from '@shared/domain/index.ts';

/** `GET /hoc-vien-lop?goc=sos` (server/src/classes/hocVienSos.ts → CaseTomTat / DongSos / TrangSos). */
export type CaseTomTat = {
  id: number; topic: string | null; kyNang: string | null; nguyenNhan: string | null; nhanXet: string | null;
  pa: { id: number; ten: string; nguoi: string | null; choXacNhan: boolean; xong: boolean }[];
  ketQua: string | null; ketQuaNgay: string | null; nhom: NhomXuLy; trangThai: string;
  viecTiep: { chu: string; han: string | null; loaiHan: DeadlineKind | null; quaHan: boolean; nguoi: string | null } | null;
  attemptId: number | null; attemptNo: number | null; done: boolean;
};
export type DongSos = {
  attemptId: number; studentId: number; ten: string; ma: string; classId: number; classCode: string; branchName: string | null; ft: boolean;
  luot: string; tuan: string; sosLevel: number; kyNang: string[]; cases: CaseTomTat[]; tvv: string | null; lienHe: LienHe;
};
/** SL2: Đang SOS = SOS hiện tại — một em một dòng (lượt = đợt mới nhất hợp lệ), không lọc tuần. */
export type TrangSos = { rows: DongSos[] };

/** Việc tiếp của dòng: việc gấp nhất (quá hạn trước) + "+n việc". */
export function ViecTiepDong({ r }: { r: DongSos }) {
  const { homNay } = useNgayNghiepVu();
  const ds = r.cases.filter((c) => c.viecTiep).sort((a, b) => Number(b.viecTiep!.quaHan) - Number(a.viecTiep!.quaHan) || (a.viecTiep!.han ?? '9').localeCompare(b.viecTiep!.han ?? '9'));
  if (!ds.length) return <span className="text-slate-500">—</span>;
  const v = ds[0].viecTiep!;
  const d = v.han ? deadlineView({ kind: v.loaiHan ?? 'xac-minh-sos', due: v.han, today: homNay }) : null;
  return (
    <span className="block text-xs">
      <span className="block truncate text-slate-200" title={[dich(v.chu), v.nguoi].filter(Boolean).join(' · ')}>{dich(v.chu)}{v.nguoi && <span className="text-slate-400"> · {v.nguoi}</span>}</span>
      <span className="block text-slate-500">
        {v.quaHan && d ? <QuaHan ngay={d.daysOverdue} /> : d ? d.han : null}
        {ds.length > 1 && <span>{d ? ' · ' : ''}{t('+{n} việc', { n: ds.length - 1 })}</span>}
      </span>
    </span>
  );
}

/** Case chưa có nguyên nhân: Case MT chưa mô tả → "Chờ mô tả Case" (máy chủ: `trangThaiCaseV4`), còn lại (Progress) "chưa xác nhận". */
export const chuChuaNguyenNhan = (c: CaseTomTat, dai = false) =>
  c.trangThai === 'Chờ mô tả Case' ? t('Chờ mô tả Case') : dai ? t('chưa xác nhận nguyên nhân') : t('chưa xác nhận');
