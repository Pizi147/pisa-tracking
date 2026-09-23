import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DaiChiXem } from '../../ui/ui.tsx';
import { Nhan, toneNhanTuBadge } from '../../ui/Nhan.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useApi } from '../../lib/useApi.ts';
import { TenGiaoVien } from './TenGiaoVien.tsx';
import type { TinhTrangXoaKetThuc } from './XoaKetThucLopPanel.tsx';
import {
  badgeLop, duongLichTest, needScoresText, ngay, nhomGiaoVienBoMon, tuanKhoa, type BadgeLop, type NhomGiaoVien, type WorkScope,
} from '@shared/domain/index.ts';

/** `GET /classes/:id/overview` (server/src/classes/classes.ts → classOverview). */
export type HoSoLop = {
  id: number; code: string; kind: string; route: string | null; isFastTrack: boolean; startDate: string | null; note: string | null;
  branchId: number; branchName: string;
  summary: {
    studentCount: number; needScores: number; workScope: WorkScope; phase: string;
    currentWeek: number | null; totalWeeks: number | null; needsPlacement: boolean;
    missing: { key: string; label: string; who: string }[]; missingSkills: string[];
    /** PR-LT: số em thật sự cần xếp lớp tiếp (Q9), số em chưa có lộ trình tiếp theo (chỉ hai tuần cuối khoá, Q5). */
    canXepLop: number; soChuaLoTrinhTiep: number;
  } | null;
  skills: { skill: string; sessionsPerWeek: number }[];
  coreTeachers: { id: number; name: string }[];
  skillTeachers: { skill: string; id: number; name: string }[];
  programme: { code: string; name: string; weeks: number | null; scoringMode: string } | null;
  soCaseMo: number;
  canhBaoYThuc: number;
  status?: string; finishedAt?: string | null;
  viewer: {
    canPlanWeek: boolean; canAddStudents: boolean; canAssign: boolean; canEditProgress: boolean;
    editableSkills: string[]; isCoreTeacher: boolean;
    canReportCase: boolean; canRecordViolation: boolean; canEnterScores: boolean;
    /** PR-LT: nút Chuyển tiếp lớp/badge — cùng luật CLASS_EDIT với canEditProgress, tên riêng cho rõ ý. */
    coTheChuyenTiep: boolean;
    /** PR-UX3: ⋮ Xoá lớp / Kết thúc lớp — chỉ Quản trị hệ thống (máy chủ kiểm lại). */
    coTheXoaKetThuc?: boolean;
  };
};
export type ViecDauTrang = 'tien-do' | 'chuyen-tiep' | 'phan-cong' | 'thong-tin' | 'case' | 'hoc-vien' | 'xoa-lop' | 'ket-thuc-lop';

/**
 * ĐẦU TRANG HỒ SƠ LỚP (đặc tả §3.7, mockup 06c §1).
 *   dòng 1  "Hồ sơ lớp" · mã · chương trình | Lộ trình lớp (FT) / Lịch kiểm tra (lớp thường) · Chuyển tiếp lớp (lớp thường) · + Case ·
 *           + Học viên · Nhập điểm Test · ⋮ (Sửa phân công, Sửa thông tin lớp)
 *   dòng 2  chi nhánh · LT · n học viên · W{n}/{tổng} · khai giảng — hộp nhỏ "GVCN tên"
 *   dòng 3  GV bộ môn một dòng không xuống hàng, gom theo người; hẹp thì "+k" (bấm ra đủ danh sách)
 *   dòng 4  tối đa 2 badge
 * Mỗi nút chỉ hiện khi người xem làm được (Q9).
 */
export function DauTrangLop({ data, periodId, onViec, onCheDoCanHoTro }: {
  data: HoSoLop; periodId: number | null; onViec: (v: ViecDauTrang) => void; onCheDoCanHoTro: () => void;
}) {
  const navigate = useNavigate();
  const { homNay } = useNgayNghiepVu();
  const thuong = data.programme?.scoringMode === 'ratio';
  const s = data.summary;
  const gvcn = data.coreTeachers[0] ?? null;
  const nhom = nhomGiaoVienBoMon(data.skills.map((x) => x.skill), data.skillTeachers);
  const b = badgeLop({
    needsPlacement: !!s?.needsPlacement, canXepLop: s?.canXepLop ?? 0, missingSkills: s?.missingSkills ?? [],
    soBaiChoCham: s?.needScores ?? 0,
    needScoresTitle: s && s.needScores > 0 ? needScoresText(s.workScope, s.needScores) : null,
    soCaseMo: data.soCaseMo, phase: s?.phase ?? 'running',
    missingCount: (s?.missing ?? []).filter((m) => m.key !== 'teachers').length,
    soChuaLoTrinhTiep: s?.soChuaLoTrinhTiep ?? 0,
  });
  const bamBadge = (x: BadgeLop): (() => void) | null =>
    x.key === 'case' ? onCheDoCanHoTro
      : x.key === 'cham' ? () => navigate(duongLichTest({ classId: data.id }))
      : x.key === 'het-khoa' && data.viewer.coTheChuyenTiep ? () => onViec('chuyen-tiep')
      : null;
  /* Chỉ Quản trị hệ thống mới gọi được đường này (403 với người khác) — nên chỉ hỏi khi có cờ. */
  const xk = useApi<TinhTrangXoaKetThuc>(data.viewer.coTheXoaKetThuc ? `/classes/${data.id}/xoa-ket-thuc` : null, [data.id, data.viewer.coTheXoaKetThuc]);
  const menu: MucMenu[] = [
    ...(data.viewer.canAssign ? [{ key: 'phan-cong', nhan: 'Sửa phân công', onChon: () => onViec('phan-cong') }] : []),
    ...(data.viewer.canEditProgress ? [{ key: 'thong-tin', nhan: 'Sửa thông tin lớp', onChon: () => onViec('thong-tin') }] : []),
    /* Cuối menu, sau đường kẻ: Xoá lớp (lớp còn trống) · Kết thúc lớp (lớp đã có dữ liệu, còn hoạt động). */
    ...(xk.data?.coTheXoa ? [{ key: 'xoa-lop', nhan: 'Xoá lớp', keTruoc: true, onChon: () => onViec('xoa-lop') }] : []),
    ...(xk.data && xk.data.coDuLieu && !xk.data.daKetThuc
      ? [{ key: 'ket-thuc-lop', nhan: 'Kết thúc lớp', keTruoc: !xk.data.coTheXoa, onChon: () => onViec('ket-thuc-lop') }] : []),
  ];
  const nhapDiem = thuong ? `/bang-diem-thuong/${data.id}` : `/nhap-diem/${data.id}${periodId ? `?periodId=${periodId}` : ''}`;
  const tuan = thuong && s?.currentWeek && s.totalWeeks && s.currentWeek >= 1
    ? tuanKhoa(Math.min(s.currentWeek, s.totalWeeks), s.totalWeeks) : null;
  const thongTin = [
    data.branchName, data.route, `${s?.studentCount ?? 0} học viên`, tuan,
    data.startDate ? `khai giảng ${ngay(data.startDate, homNay)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <header className="card space-y-2 p-3 sm:p-4">
      {data.status === 'finished' && (
        <DaiChiXem>Lớp đã kết thúc{data.finishedAt ? ` ${ngay(data.finishedAt, homNay)}` : ''} — chỉ xem</DaiChiXem>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Hồ sơ lớp</div>
          <h1 className="m-0 text-lg font-semibold text-slate-100">{data.code} · {data.programme?.name ?? data.kind}</h1>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-1.5">
          {data.viewer.canEditProgress && (
            <button type="button" className="btn btn-sm" onClick={() => onViec('tien-do')}>{thuong ? 'Lịch kiểm tra' : 'Lộ trình lớp'}</button>
          )}
          {thuong && data.viewer.coTheChuyenTiep && (
            <button type="button" className="btn btn-sm" onClick={() => onViec('chuyen-tiep')}>Chuyển tiếp lớp</button>
          )}
          {data.viewer.canReportCase && <button type="button" className="btn btn-sm" onClick={() => onViec('case')}>+ Case</button>}
          {data.viewer.canAddStudents && <button type="button" className="btn btn-sm" onClick={() => onViec('hoc-vien')}>+ Học viên</button>}
          {data.viewer.canEnterScores && <Link className="btn btn-sm btn-primary no-underline" to={nhapDiem}>Nhập điểm Test</Link>}
          <MenuDong muc={menu} bieuTuong="⋮" nhan="Thêm thao tác" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>{thongTin}</span>
        <span className="whitespace-nowrap rounded-md border px-2 py-0.5 text-slate-300" style={{ borderColor: 'var(--line)' }}>
          <abbr title="Giáo viên chủ nhiệm" className="no-underline">GVCN</abbr>{' '}
          {gvcn ? <TenGiaoVien id={gvcn.id} ten={gvcn.name} /> : <span className="text-amber-200">Chưa có GVCN</span>}
        </span>
      </div>

      <DongGiaoVienBoMon nhom={nhom} />

      {b.hien.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {b.hien.map((x) => {
            const bam = bamBadge(x);
            return bam
              ? <Nhan key={x.key} tone={toneNhanTuBadge(x.tone)} title={x.title} onClick={bam}>{x.nhan}</Nhan>
              : <Nhan key={x.key} tone={toneNhanTuBadge(x.tone)} title={x.title}>{x.nhan}</Nhan>;
          })}
          {b.an.length > 0 && <span className="text-[11px] text-slate-500" title={b.an.map((x) => x.nhan).join(' · ')}>+{b.an.length}</span>}
        </div>
      )}
    </header>
  );
}

/**
 * GV BỘ MÔN MỘT DÒNG KHÔNG XUỐNG HÀNG (06c §1): "L · R Trần Ngọc Hà   W1 Lê Minh Khoa …". Điện thoại hiện 2 nhóm, máy tính 5 nhóm,
 * còn lại "+k" — bấm ra đủ danh sách ngay bên dưới (không popover trong vùng `overflow-hidden`). Lớp CSS là chuỗi tĩnh.
 */
function DongGiaoVienBoMon({ nhom }: { nhom: NhomGiaoVien[] }) {
  const [du, setDu] = useState(false);
  if (!nhom.length) return null;
  const mot = (g: NhomGiaoVien, i: number, luonHien: boolean) => (
    <span key={`${g.nhan}-${i}`}
      className={`items-baseline gap-1 whitespace-nowrap ${luonHien || i < 2 ? 'inline-flex' : i < 5 ? 'hidden sm:inline-flex' : 'hidden'}`}>
      <abbr className="font-medium text-slate-500 no-underline" title={g.title}>{g.nhan}</abbr>
      {g.id !== null ? <TenGiaoVien id={g.id} ten={g.ten} /> : <span className="text-amber-200">{g.ten}</span>}
    </span>
  );
  return (
    <div className="text-xs">
      <div className="flex items-center gap-3.5 overflow-hidden whitespace-nowrap">
        {nhom.map((g, i) => mot(g, i, false))}
        {nhom.length > 2 && (
          <button type="button" className="link border-0 bg-transparent p-0 text-xs sm:hidden" onClick={() => setDu((v) => !v)}>
            +{nhom.length - 2}
          </button>
        )}
        {nhom.length > 5 && (
          <button type="button" className="link hidden border-0 bg-transparent p-0 text-xs sm:inline" onClick={() => setDu((v) => !v)}>
            +{nhom.length - 5}
          </button>
        )}
      </div>
      {du && <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1">{nhom.map((g, i) => mot(g, i, true))}</div>}
    </div>
  );
}
