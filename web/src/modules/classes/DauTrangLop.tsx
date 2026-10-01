import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DaiChiXem } from '../../ui/ui.tsx';
import { Nhan, toneNhanTuBadge } from '../../ui/Nhan.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { TenGiaoVien } from './TenGiaoVien.tsx';
import { DaiLopChuyen } from './DaiChuyenLop.tsx';
import type { TinhTrangXoaKetThuc } from './XoaKetThucLopPanel.tsx';
import {
  ROUTE_NAME, badgeLop, duongLichTest, laVaiQuanLy, needScoresText, nhomGiaoVienBoMon, nutChinhDauTrang, tuanKhoa, tuanLich, type BadgeLop, type DaiLop, type NhomGiaoVien, type WorkScope,
} from '@shared/domain/index.ts';

/** `GET /classes/:id/overview` (server/src/classes/classes.ts → classOverview). */
export type HoSoLop = {
  id: number; code: string; kind: string; route: string | null; isFastTrack: boolean; startDate: string | null; note: string | null;
  branchId: number; branchCode: string; branchName: string;
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
  programme: { code: string; name: string; weeks: number | null; scoringMode: string; checkpoints?: string[] } | null;
  soCaseMo: number;
  /** B4: cùng hai số với hộp lớp ở Học viên & Lớp (`viecHocVienTheoLop`) — badge `cho-duyet` / `qua-han`. */
  soChoDuyet: number; soEmQuaHan: number;
  /** Lớp thường ở Cuối khoá / hết khoá: số em có đủ điểm bài Cuối khoá (null ở chặng khác). */
  cuoiKhoa: { du: number; tong: number; canQl?: number } | null;
  canhBaoYThuc: number;
  /** PR-CT: dữ liệu dải Kết thúc khoá / Bàn giao / Sắp nhận (mockup 20 — A, H); null khi lớp đã kết thúc. */
  dai: DaiLop | null;
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
export type ViecDauTrang = 'tien-do' | 'chuyen-tiep' | 'ban-giao' | 'phan-cong' | 'thong-tin' | 'case' | 'hoc-vien' | 'xoa-lop' | 'ket-thuc-lop' | 'xuat-mt';

/**
 * ĐẦU TRANG HỒ SƠ LỚP (đặc tả §3.7, mockup 06c §1; PR-HVL K2-14, B4, E7, K2-13). Nằm ở: Học viên & Lớp → Hồ sơ lớp → đầu trang.
 *   dòng 1  "Hồ sơ lớp" · mã · chương trình | MỘT nút chính theo chặng (`nutChinhDauTrang`: + Học viên khi lớp rỗng · Chuyển tiếp lớp · n em khi lớp thường
 *           cuối khoá · Nhập điểm Test khi còn bài chờ nhập) · tối đa 2 nút phụ (Nhập điểm Test · + Học viên · + Case; thừa vào ⋮) · ⋮
 *   ⋮       Tuần khai giảng (FT) / Lịch kiểm tra (lớp thường) · Chuyển tiếp lớp (khi không phải nút chính) · nút phụ thừa · Sửa phân công ·
 *           Sửa thông tin lớp · (đường kẻ) Xoá / Kết thúc lớp
 *   dòng 2  chi nhánh · LT (bọc `<abbr>` "Lộ trình 1") · n học viên · W{n}/{tổng} · khai giảng — hộp nhỏ "GVCN tên"; lớp thường cuối khoá: "Cuối khoá: 6/8 em có đủ điểm"
 *   dòng 3  GV bộ môn một dòng không xuống hàng, gom theo người; hẹp thì "+k" (bấm ra đủ danh sách)
 *   dòng 4  tối đa 2 badge theo vai, phần còn lại "+n" (menu)
 * Mỗi nút chỉ hiện khi người xem làm được (Q9).
 */
export function DauTrangLop({ data, periodId, onViec, onBanGiao }: {
  data: HoSoLop; periodId: number | null; onViec: (v: ViecDauTrang) => void;
  /** PR-CT: mở panel Bàn giao từ dải (lớp NGUỒN mặc định là lớp đang xem; `mon` = bảng GVBM). */
  onBanGiao: (o: { lop?: number; mon?: string }) => void;
}) {
  const navigate = useNavigate();
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const thuong = data.programme?.scoringMode === 'ratio';
  const s = data.summary;
  const gvcn = data.coreTeachers[0] ?? null;
  const nhom = nhomGiaoVienBoMon(data.skills.map((x) => x.skill), data.skillTeachers, data.programme?.code ?? null);
  const bGoc = badgeLop({
    vai: laVaiQuanLy(session?.roles) ? 'ql' : 'gv', needsPlacement: !!s?.needsPlacement, canXepLop: s?.canXepLop ?? 0, missingSkills: s?.missingSkills ?? [],
    soBaiChoCham: s?.needScores ?? 0,
    needScoresTitle: s && s.needScores > 0 ? needScoresText(s.workScope, s.needScores) : null,
    phase: s?.phase ?? 'running', soChoDuyet: data.soChoDuyet, soEmQuaHan: data.soEmQuaHan,
    missingCount: (s?.missing ?? []).filter((m) => m.key !== 'teachers').length,
    soChuaLoTrinhTiep: s?.soChuaLoTrinhTiep ?? 0,
    chuongTrinh: data.programme?.code ?? null,
  });
  /* PR-S5F-a (mockup 20): lớp đã có dải "Kết thúc khoá" thì bỏ chip "n HV cần xếp lớp tiếp" — hai chỗ nói cùng một việc. */
  const boXep = (ds: BadgeLop[]) => (data.dai?.ketThucKhoa ? ds.filter((x) => x.key !== 'xep-lop') : ds);
  const b = { hien: boXep(bGoc.hien), an: boXep(bGoc.an) };
  const bamBadge = (x: BadgeLop): (() => void) | null =>
    /* PR-S4F #4: cùng đích với hộp lớp ở Học viên & Lớp — số trên badge = số dòng. */
    x.key === 'qua-han' ? () => navigate(`/hoc-vien?view=qua-han&classId=${data.id}`)
      : x.key === 'cham' ? () => navigate(duongLichTest({ classId: data.id }))
      : x.key === 'xep-lop' && data.viewer.coTheChuyenTiep ? () => onViec('chuyen-tiep')
      : x.key === 'cho-duyet' ? () => navigate(`/cong-viec/cho-duyet?lop=${data.id}`)
      : null;
  /* Chỉ Quản trị hệ thống mới gọi được đường này (403 với người khác) — nên chỉ hỏi khi có cờ. */
  const xk = useApi<TinhTrangXoaKetThuc>(data.viewer.coTheXoaKetThuc ? `/classes/${data.id}/xoa-ket-thuc` : null, [data.id, data.viewer.coTheXoaKetThuc]);
  const nhapDiem = thuong ? `/bang-diem-thuong/${data.id}` : `/nhap-diem/${data.id}${periodId ? `?periodId=${periodId}` : ''}`;
  /* K2-14: MỘT nút chính theo chặng; nút phụ tối đa 2, thừa vào ⋮. "Nhập điểm" là chính khi còn bài chờ nhập của người xem. */
  const chinh = nutChinhDauTrang({
    thuong, phase: s?.phase ?? 'running', needsPlacement: !!s?.needsPlacement, soHocVien: s?.studentCount ?? 0,
    coTheThemHv: data.viewer.canAddStudents, coTheNhapDiem: data.viewer.canEnterScores && (s?.needScores ?? 0) > 0,
    coTheChuyenTiep: data.viewer.coTheChuyenTiep, soEmChuyen: s?.canXepLop ?? 0,
  });
  const phu: { key: string; nhan: string; lam: () => void }[] = [
    ...(data.viewer.canEnterScores && chinh.loai !== 'nhap-diem' ? [{ key: 'nhap-diem', nhan: 'Nhập điểm Test', lam: () => navigate(nhapDiem) }] : []),
    ...(data.viewer.canAddStudents && chinh.loai !== 'them-hv' ? [{ key: 'hoc-vien', nhan: '+ Học viên', lam: () => onViec('hoc-vien') }] : []),
    ...(data.viewer.canReportCase ? [{ key: 'case', nhan: '+ Case', lam: () => onViec('case') }] : []),
  ];
  const menu: MucMenu[] = [
    /* E7: panel FT tên "Tuần khai giảng", lớp thường "Lịch kiểm tra". Xuất Excel (PR-XUAT) chép vào mảng này, sau "Sửa thông tin lớp". */
    ...(data.viewer.canEditProgress ? [{ key: 'tien-do', nhan: thuong ? 'Lịch kiểm tra' : 'Tuần khai giảng', onChon: () => onViec('tien-do') }] : []),
    /* PR-CT (Q30-1): Quản lý RA LỆNH — lớp thường "Chuyển lớp cả lớp…", lớp FT (gộp / tách lớp, đổi lộ trình) "Chuyển nhiều em…". GVCN không thấy. */
    ...(thuong && data.viewer.coTheChuyenTiep ? [{ key: 'chuyen-tiep', nhan: 'Chuyển lớp cả lớp…', onChon: () => onViec('chuyen-tiep') }] : []),
    ...(!thuong && data.dai?.viewer.coTheChuyenNhieuEm ? [{ key: 'chuyen-tiep', nhan: 'Chuyển nhiều em…', onChon: () => onViec('chuyen-tiep') }] : []),
    ...phu.slice(2).map((x) => ({ key: x.key, nhan: x.nhan, onChon: x.lam })),
    ...(data.viewer.canAssign ? [{ key: 'phan-cong', nhan: 'Sửa phân công', onChon: () => onViec('phan-cong') }] : []),
    ...(data.viewer.canEditProgress ? [{ key: 'thong-tin', nhan: 'Sửa thông tin lớp', onChon: () => onViec('thong-tin') }] : []),
    /* PR-XUAT (Q8): GVCN của lớp hoặc người xếp lịch (Quản lý) — máy chủ xuất vẫn kiểm lại phạm vi. */
    ...(session?.nav?.xuatMt && (data.viewer.isCoreTeacher || data.viewer.canPlanWeek) ? [{ key: 'xuat-mt', nhan: 'Xuất Excel', onChon: () => onViec('xuat-mt') }] : []),
    /* Cuối menu, sau đường kẻ: Xoá lớp (lớp còn trống) · Kết thúc lớp (lớp đã có dữ liệu, còn hoạt động). */
    ...(xk.data?.coTheXoa ? [{ key: 'xoa-lop', nhan: 'Xoá lớp', keTruoc: true, onChon: () => onViec('xoa-lop') }] : []),
    ...(xk.data && xk.data.coDuLieu && !xk.data.daKetThuc
      ? [{ key: 'ket-thuc-lop', nhan: 'Kết thúc lớp', keTruoc: !xk.data.coTheXoa, onChon: () => onViec('ket-thuc-lop') }] : []),
  ];
  const tuan = thuong && s?.currentWeek && s.totalWeeks && s.currentWeek >= 1
    ? tuanKhoa(Math.min(s.currentWeek, s.totalWeeks), s.totalWeeks) : null;
  /* K2-13: giữ ký hiệu LT1 · LT2 · RF, tên đủ ở tooltip. */
  const thongTin = [
    data.branchName,
    data.route ? <abbr key="lt" title={ROUTE_NAME[data.route as keyof typeof ROUTE_NAME] ?? data.route} className="no-underline">{data.route}</abbr> : null,
    `${s?.studentCount ?? 0} học viên`, tuan,
    data.startDate ? `khai giảng ${tuanLich(data.startDate, homNay)}` : null,   // mã tuần (CLAUDE.md 30/09, mockup 20)
  ].filter(Boolean);

  return (
    <header className="card space-y-2 p-3 sm:p-4">
      {data.status === 'finished' && (
        <DaiChiXem>Lớp đã kết thúc{data.finishedAt ? ` ${tuanLich(data.finishedAt, homNay)}` : ''} — chỉ xem</DaiChiXem>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Hồ sơ lớp</div>
          <h1 className="m-0 text-lg font-semibold text-slate-100">{data.code} · {data.programme?.name ?? data.kind}</h1>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-1.5">
          {phu.slice(0, 2).map((x) => <button key={x.key} type="button" className="btn btn-sm" onClick={x.lam}>{x.nhan}</button>)}
          {chinh.loai === 'nhap-diem' ? <Link className="btn btn-sm btn-primary no-underline" to={nhapDiem}>{chinh.nhan}</Link>
            : chinh.loai ? (
              <button type="button" className="btn btn-sm btn-primary" onClick={() => onViec(chinh.loai === 'them-hv' ? 'hoc-vien' : 'chuyen-tiep')}>{chinh.nhan}</button>
            ) : null}
          <MenuDong muc={menu} bieuTuong="⋮" nhan="Thêm thao tác" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>{thongTin.map((x, i) => <Fragment key={i}>{i > 0 && ' · '}{x}</Fragment>)}</span>
        {data.cuoiKhoa && <span className="tabular-nums text-slate-300">Cuối khoá: {data.cuoiKhoa.du}/{data.cuoiKhoa.tong} em có đủ điểm{data.cuoiKhoa.canQl ? ` · ${data.cuoiKhoa.canQl} em Quản lý cân nhắc` : ''}</span>}
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
          {b.an.length > 0 && (
            <MenuDong bieuTuong={`+${b.an.length}`} nhan={`${b.an.length} việc khác của lớp`}
              muc={b.an.map((x) => ({ key: x.key, nhan: x.nhan, onChon: () => (bamBadge(x) ?? (() => undefined))() }))} />
          )}
        </div>
      )}

      <DaiLopChuyen dai={data.dai} homNay={homNay} onChuyenTiep={() => onViec('chuyen-tiep')} onBanGiao={onBanGiao} />
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
