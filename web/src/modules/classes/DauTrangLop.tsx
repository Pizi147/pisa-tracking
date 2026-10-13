import { Fragment, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DaiChiXem } from '../../ui/ui.tsx';
import { Nhan, toneNhanTuBadge } from '../../ui/Nhan.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { ThanhTruocSau } from '../../ui/ThanhTruocSau.tsx';
import { CHE_DO_NHAN, type CheDoHocVien } from './TabHocVienLop.tsx';
import { useSession } from '../../lib/session.tsx';
import { TenGiaoVien } from './TenGiaoVien.tsx';
import { DaiLopChuyen } from './DaiChuyenLop.tsx';
import type { TinhTrangXoaKetThuc } from './XoaKetThucLopPanel.tsx';
import {
  DUONG_TAB_TEST, ROUTE_NAME, TAB_HO_SO_LOP_NHAN, trangCha, type TabHoSoLop, badgeLop, khungCua, duongLichTest, laVaiQuanLy, needScoresText, menuHoSoLop, nhomGiaoVienBoMon, tuanKhoa, type ViecMenuLop, tuanLich, type BadgeLop, type DaiLop, type NhomGiaoVien, type WorkScope,
} from '@shared/domain/index.ts';

/** `GET /classes/:id/overview` (server/src/classes/classes.ts → classOverview). */
export type HoSoLop = {
  id: number; code: string; kind: string; route: string | null; isFastTrack: boolean; startDate: string | null; note: string | null;
  /** OV-6b2: lớp liên tục (PET, KET…) — không Lộ trình tiếp theo, nhãn "tuần n". */
  lienTuc?: boolean;
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
    canPlanWeek: boolean; canAddStudents: boolean; canAssign: boolean; canAssignSubject?: boolean; canEditProgress: boolean;
    editableSkills: string[]; isCoreTeacher: boolean;
    canReportCase: boolean; canRecordViolation: boolean; canEnterScores: boolean;
    /** OV-10b: ⋯ dòng của Admin / TVV / CX (`student.edit_info` · `student.edit_more`). */
    coTheSuaThongTin?: boolean; coTheSuaThem?: boolean;
    /** PR-LT: nút Chuyển tiếp lớp/badge — cùng luật CLASS_EDIT với canEditProgress, tên riêng cho rõ ý. */
    coTheChuyenTiep: boolean;
    /** PR-UX3: ⋮ Xoá lớp — chỉ Quản trị hệ thống (máy chủ kiểm lại). */
    coTheXoaKetThuc?: boolean;
    /** PR-LUI-b (06/10): Quản lý của lớp cũng ⋮ Kết thúc lớp (lớp còn hoạt động) và ⋮ Mở lại lớp (lớp đã kết thúc). */
    coTheKetThucLop?: boolean; coTheMoLaiLop?: boolean;
    /** PR-DL: khối điểm cuối trang (PR-OV3a: mở sẵn, bỏ mục ⋯) — cùng luật `requireXemLuotCham`. */
    coTheXemDiem?: boolean;
  };
};
/** `phan-cong`: panel Thông tin lớp mở sẵn phần Phân công (badge "Thiếu GV", `?viec=phan-cong`). */
export type ViecDauTrang = ViecMenuLop | 'ban-giao' | 'phan-cong' | 'case';

/**
 * ĐẦU TRANG HỒ SƠ LỚP (đặc tả §3.7, mockup 06c §1; PR-HVL K2-14, B4, E7, K2-13). Nằm ở: Học viên & Lớp → Hồ sơ lớp → đầu trang.
 *   dòng 1  "Hồ sơ lớp" · mã · chương trình | nút CỐ ĐỊNH Nhập điểm · + Case · ⋯ (PR-OV3a, M2 §1 — không đổi theo chặng; 375: một hàng đủ rộng)
 *   ⋯       `menuHoSoLop`: Lớp (Thông tin lớp · Sửa thông tin học viên · + Học viên) → Lộ trình (thường: Lộ trình tiếp theo · Kỳ vọng đầu ra;
 *           FT: Chuyển tiếp lớp) → Công cụ (Xuất Excel) → (đường kẻ) Mở lại / Xoá / Kết thúc lớp
 *   dòng 2  chi nhánh · LT (bọc `<abbr>` "Lộ trình 1") · n học viên · W{n}/{tổng} · khai giảng — hộp nhỏ "GVCN tên"; lớp thường cuối khoá: "Cuối khoá: 6/8 em có đủ điểm"
 *   dòng 3  GV bộ môn một dòng không xuống hàng, gom theo người; hẹp thì "+k" (bấm ra đủ danh sách)
 *   dòng 4  tối đa 2 badge theo vai, phần còn lại "+n" (menu)
 * Mỗi nút chỉ hiện khi người xem làm được (Q9).
 */
export function DauTrangLop({ data, onViec, onBanGiao }: {
  data: HoSoLop; onViec: (v: ViecDauTrang) => void;
  /** PR-CT: mở panel Bàn giao từ dải (lớp NGUỒN mặc định là lớp đang xem; `mon` = bảng GVBM). */
  onBanGiao: (o: { lop?: number; mon?: string }) => void;
}) {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
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
  /* PR-S5F-a (mockup 20): lớp đã có dải "Lộ trình tiếp theo" (OV-3b) thì bỏ chip "n HV cần xếp lớp tiếp" — hai chỗ nói cùng một việc. */
  const boXep = (ds: BadgeLop[]) => (data.dai?.loTrinh ? ds.filter((x) => x.key !== 'xep-lop') : ds);
  /* OV-10b: badge "n bài chờ chấm" dẫn vào Test — vai không có Test (TVV / CX) không thấy. */
  const boCham = (ds: BadgeLop[]) => (session?.nav?.test ? ds : ds.filter((x) => x.key !== 'cham'));
  const b0 = { hien: boCham(boXep(bGoc.hien)), an: boCham(boXep(bGoc.an)) };
  /* DH: nhãn chặng chỉ là chữ — không vào menu "+n" (mục bấm không làm gì); nếu bị ẩn thì hiện thẳng ở hàng. */
  const b = { hien: [...b0.hien, ...b0.an.filter((x) => x.key === 'chang')], an: b0.an.filter((x) => x.key !== 'chang') };
  const bamBadge = (x: BadgeLop): (() => void) | null =>
    /* PR-S4F #4: cùng đích với hộp lớp ở Học viên & Lớp — số trên badge = số dòng. */
    x.key === 'qua-han' ? () => navigate(`/hoc-vien?view=qua-han&classId=${data.id}`)
      : x.key === 'cham' && session?.nav?.test ? () => navigate(duongLichTest({ classId: data.id }))
      : x.key === 'xep-lop' && data.viewer.coTheChuyenTiep ? () => onViec('chuyen-tiep')
      : x.key === 'cho-duyet' && session?.nav?.workApprove ? () => navigate(`/cong-viec/cho-duyet?lop=${data.id}`)
      /* DH: "Thiếu GV …" → panel Phân công (chỉ ai sửa được phân công, người khác để chữ); "Thiếu n thông tin" → em thiếu của lớp. */
      : x.key === 'thieu-gv' && (data.viewer.canAssign || data.viewer.canAssignSubject) ? () => onViec('phan-cong')
      : x.key === 'thieu-tt' ? () => navigate(`/hoc-vien?view=thieu_tt&classId=${data.id}`)
      : null;
  /* Quản trị hoặc Quản lý của lớp gọi được đường này (403 với người khác) — nên chỉ hỏi khi có cờ. `coTheXoa` do máy chủ trả: chỉ Quản trị. */
  const hoiXk = !!data.viewer.coTheXoaKetThuc || !!data.viewer.coTheKetThucLop;
  const xk = useApi<TinhTrangXoaKetThuc>(hoiXk ? `/classes/${data.id}/xoa-ket-thuc` : null, [data.id, hoiXk]);
  /* PR-OV1a (3.2): cả lớp thường và FT mở Test › Điểm theo lớp đúng lớp (lớp thường có lượt MT0 bảng band). */
  const nhapDiem = `${DUONG_TAB_TEST['diem-lop']}?lop=${data.id}`;
  /* PR-OV3a (M2 §1): nút cố định Nhập điểm · + Case · ⋯ — không đổi chỗ theo chặng. ⋯ gom Lớp → Lộ trình → Công cụ → (kẻ) kết thúc, cùng thứ tự hai loại lớp. */
  const mucLop = menuHoSoLop({
    thuong, lienTuc: !!data.lienTuc, chuongTrinh: data.programme?.code ?? null, soHocVien: s?.studentCount ?? 0,
    canEditProgress: data.viewer.canEditProgress, canAssign: data.viewer.canAssign, canAssignSubject: !!data.viewer.canAssignSubject,
    canAddStudents: data.viewer.canAddStudents, coTheChuyenTiep: data.viewer.coTheChuyenTiep, coTheChuyenNhieuEm: !!data.dai?.viewer.coTheChuyenNhieuEm,
    /* PR-XUAT (Q8): GVCN của lớp hoặc người xếp lịch (Quản lý) — máy chủ xuất vẫn kiểm lại phạm vi. */
    coTheXuatExcel: !!session?.nav?.xuatMt && (data.viewer.isCoreTeacher || data.viewer.canPlanWeek),
    coTheMoLaiLop: !!data.viewer.coTheMoLaiLop, coTheXoa: !!xk.data?.coTheXoa, coTheKetThuc: !!xk.data && xk.data.coDuLieu && !xk.data.daKetThuc,
  });
  const menu: MucMenu[] = mucLop.flatMap((m, i) => {
    const truoc = mucLop[i - 1];
    const dau = m.nhom && m.nhom !== truoc?.nhom ? [{ key: `nhom-${m.nhom}`, nhan: m.nhom, tieuDe: true, keTruoc: false, onChon: () => undefined }] : [];
    return [...dau, { key: m.key, nhan: m.nhan, keTruoc: !m.nhom && !!truoc?.nhom, nguyHiem: m.key === 'xoa-lop', onChon: () => onViec(m.key) }];
  });
  const tuan = thuong && s?.currentWeek && s.currentWeek >= 1
    ? s.totalWeeks ? tuanKhoa(Math.min(s.currentWeek, s.totalWeeks), s.totalWeeks) : data.lienTuc ? `tuần ${s.currentWeek}` : null : null;   // OV-6b2: liên tục không "/tổng"
  /* K2-13: giữ ký hiệu LT1 · LT2 · RF, tên đủ ở tooltip. */
  const thongTin = [
    data.branchName,
    data.route ? <abbr key="lt" title={ROUTE_NAME[data.route as keyof typeof ROUTE_NAME] ?? data.route} className="no-underline">{data.route}</abbr> : null,
    `${s?.studentCount ?? 0} học viên`, tuan,
    data.startDate ? `khai giảng ${tuanLich(data.startDate, homNay)}` : null,   // mã tuần (CLAUDE.md 30/09, mockup 20)
  ].filter(Boolean);

  return (
    <header className="card space-y-2 p-3 sm:p-4">
      {/* PR-DH (Q-0310-4): Quay lại + Lớp trước/sau theo danh sách vừa mở; mở thẳng bằng link thì theo các lớp cùng khung ở Học viên & Lớp. */}
      <ThanhTruocSau loai="lop" id={data.id} cha={trangCha('lop')} ten={`Hồ sơ lớp ${data.code}`}
        chiTiet={CHE_DO_NHAN[sp.get('che-do') as CheDoHocVien] ?? TAB_HO_SO_LOP_NHAN[sp.get('tab') as TabHoSoLop]}
        duong={(cid) => `/hoc-vien/lop/${cid}${sp.get('tab') ? `?tab=${sp.get('tab')}` : ''}`}
        dsDuPhong={async () => {
          const r = await api.get<{ rows: { id: number; scoringMode: string | null }[] }>('/hoc-vien-lop/ids');   // PR-TD2-b: không tải cả trang
          return { ids: r.rows.filter((c) => khungCua(c.scoringMode) === (thuong ? 'thuong' : 'ft')).map((c) => c.id), nhan: thuong ? 'Lớp thường' : 'Fast Track' };
        }} />
      {data.status === 'finished' && (
        <DaiChiXem>Lớp đã kết thúc{data.finishedAt ? ` ${tuanLich(data.finishedAt, homNay)}` : ''} — chỉ xem</DaiChiXem>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">Hồ sơ lớp</div>
          <h1 className="m-0 text-lg font-semibold text-slate-100">{data.code} · {data.programme?.name ?? data.kind}</h1>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-1.5 max-sm:w-full">
          {data.viewer.canEnterScores && <Link className="btn btn-sm no-underline max-sm:min-h-[44px] max-sm:flex-1" to={nhapDiem}>Nhập điểm</Link>}
          {data.viewer.canReportCase && <button type="button" className="btn btn-sm max-sm:min-h-[44px] max-sm:flex-1" onClick={() => onViec('case')}>+ Case</button>}
          <MenuDong muc={menu} nhan="Thao tác khác" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>{thongTin.map((x, i) => <Fragment key={i}>{i > 0 && ' · '}{x}</Fragment>)}</span>
        {data.cuoiKhoa && <span className="tabular-nums text-slate-300">Final Test: {data.cuoiKhoa.du}/{data.cuoiKhoa.tong} em có đủ điểm{data.cuoiKhoa.canQl ? ` · ${data.cuoiKhoa.canQl} em Quản lý cân nhắc` : ''}</span>}
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
            <MenuDong kieu="chip" bieuTuong={`+${b.an.length}`} nhan={`${b.an.length} việc khác của lớp`}
              muc={b.an.map((x) => { const bam = bamBadge(x); return { key: x.key, nhan: x.nhan, tieuDe: !bam, onChon: bam ?? (() => undefined) }; })} />
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
