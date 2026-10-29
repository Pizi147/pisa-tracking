import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DaiChiXem } from '../../ui/ui.tsx';
import { CHIP_SOS, Nhan, lopSos, toneBadgeLop } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useApi } from '../../lib/useApi.ts';
import { api, onInvalidate } from '../../lib/api.ts';
import { ThanhTruocSau } from '../../ui/ThanhTruocSau.tsx';
import { CHE_DO_NHAN, type CheDoHocVien } from './TabHocVienLop.tsx';
import { useSession } from '../../lib/session.tsx';
import { TenGiaoVien } from './TenGiaoVien.tsx';
import { DaiLopChuyen } from './DaiChuyenLop.tsx';
import type { TinhTrangXoaKetThuc } from './XoaKetThucLopPanel.tsx';
import {
  DUONG_TAB_TEST, TAB_HO_SO_LOP_NHAN, trangCha, type TabHoSoLop, badgeLop, badgeHienTheoVai, vaiXemHocVien, khungCua, duongLichTest, laVaiQuanLy, needScoresText, menuHoSoLop, nhomGiaoVienBoMon, ketQuaGanNhat, type KetQuaVao, type ViecMenuLop, type NhomGiaoVien, tuanLich, type BadgeLop, type DaiLop, type WorkScope,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { duongViecLop, type ViecLop } from './ThanhViecLop.tsx';
import { PanelNhapDiemLop } from '../cham/PanelNhapDiemLop.tsx';
import { duongDiemTheoLuot, type DanhSachLuot } from '../cham/LuoiChamLop.tsx';
import type { RosterRow } from '../students/ClassRoster.tsx';

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
  /** P3: lớp có góp ý hàng tuần cũ → ⋯ › Lịch sử góp ý tuần. */
  coGopY?: boolean;
  /** PR-CT: dữ liệu dải Kết thúc khoá / Bàn giao / Sắp nhận (mockup 20 — A, H); null khi lớp đã kết thúc. */
  dai: DaiLop | null;
  status?: string; finishedAt?: string | null;
  viewer: {
    canPlanWeek: boolean; canAddStudents: boolean; canAssign: boolean; canAssignSubject?: boolean; canEditProgress: boolean;
    /** OV-13p: `student.edit` ở lớp — `canAddStudents` chỉ là thêm học viên (`student.add`). */
    coTheSuaHocVien?: boolean;
    editableSkills: string[]; isCoreTeacher: boolean;
    canReportCase: boolean; canRecordViolation: boolean; canEnterScores: boolean;
    /** OV-10b: ⋯ dòng của Admin / TVV / CX (`student.edit_info` · `student.edit_more`). */
    coTheSuaThongTin?: boolean; coTheSuaThem?: boolean;
    /** OV-13i: Sửa thông tin cả lớp — GVCN / QL / TVV / CX đúng phạm vi (máy chủ `duocSuaCaLop`). */
    coTheSuaCaLop?: boolean;
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
/** `lich-su-gop-y`: Góp ý hàng tuần gỡ khỏi giao diện 24/10 (chủ SP) — dữ liệu cũ chỉ còn xem ở Lịch sử góp ý tuần. */
/** `chuyen-tiep`: dải nhắc / badge lớp thường → trang Cuối khoá (lớp FT không còn Chuyển tiếp lớp — R5.3). */
export type ViecDauTrang = ViecMenuLop | 'chuyen-tiep' | 'ban-giao' | 'phan-cong' | 'case' | 'lich-su-gop-y';

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
export function DauTrangLop({ data, onViec, onBanGiao, thanhViec }: {
  data: HoSoLop; onViec: (v: ViecDauTrang) => void;
  /** V8-HSL hàng ⑤: thanh "Việc của tôi" (ThanhViecLop) nằm trong đầu trang, sau dải lớp chuyển. */
  thanhViec?: ReactNode;
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
  const tomTat = useTomTatLop(data, homNay);
  /* OV-13b · LOP-1-LOP: badge "n việc quá hạn" = `soQuaHanLop` của viec-theo-em (cùng danh sách việc `myWork` với Công việc, cùng `demViec`; GV chỉ việc
     của mình) — cùng đường ThanhViecLop nên một GET; QL / QT thôi đọc `/my-work?nguoi=tat-ca` cả chi nhánh (GV vẫn có `/my-work` của khung App). */
  const viec = useApi<ViecLop>(duongViecLop(data.id), [data.id]);
  const soViecQuaHan = viec.data?.soQuaHanLop ?? 0;
  /* Thao tác Case / PA… chỉ vô hiệu `/my-work` — trước PR badge đọc `/my-work` nên tự tải lại; giữ vậy. `reload` (không `invalidate`): lưu điểm vô hiệu
     cả `/classes` lẫn `/my-work` → dùng lại GET vừa bắt đầu, không gọi đôi. */
  useEffect(() => onInvalidate((x) => { if (x === '/my-work') viec.reload(); }), [viec.reload]);
  const bGoc = badgeLop({
    vai: laVaiQuanLy(session?.roles) ? 'ql' : 'gv', needsPlacement: !!s?.needsPlacement, canXepLop: s?.canXepLop ?? 0, missingSkills: s?.missingSkills ?? [],
    soBaiChoCham: s?.needScores ?? 0,
    needScoresTitle: s && s.needScores > 0 ? needScoresText(s.workScope, s.needScores) : null,
    phase: s?.phase ?? 'running', soChoDuyet: data.soChoDuyet, soViecQuaHan,
    missingCount: (s?.missing ?? []).filter((m) => m.key !== 'teachers').length,
    soChuaLoTrinhTiep: s?.soChuaLoTrinhTiep ?? 0,
    chuongTrinh: data.programme?.code ?? null,
  });
  /* PR-S5F-a (mockup 20): lớp đã có dải "Lộ trình tiếp theo" (OV-3b) thì bỏ chip "n HV cần xếp lớp tiếp" — hai chỗ nói cùng một việc. */
  const boXep = (ds: BadgeLop[]) => (data.dai?.loTrinh ? ds.filter((x) => x.key !== 'xep-lop') : ds);
  /*
   * OV-10b: badge "n bài chờ chấm" dẫn vào Test — vai không có Test không thấy. TVV / CX / Admin: `badgeHienTheoVai` (HL-8).
   */
  const vai = vaiXemHocVien(session?.roles);
  const boCham = (ds: BadgeLop[]) => ds.filter((x) => (x.key !== 'cham' || !!session?.nav?.test) && badgeHienTheoVai(vai, x.key));
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
  /* Quản trị hoặc Quản lý của lớp gọi được đường này (403 với người khác) — nên chỉ hỏi khi có cờ. `coTheXoa` do máy chủ trả: lớp trống (OV-12a). */
  const hoiXk = !!data.viewer.coTheXoaKetThuc || !!data.viewer.coTheKetThucLop;
  const xk = useApi<TinhTrangXoaKetThuc>(hoiXk ? `/classes/${data.id}/xoa-ket-thuc` : null, [data.id, hoiXk]);
  /* OV-15b (C16): Nhập điểm mở panel nhập điểm của lớp ngay tại hồ sơ (thay Test › Điểm theo lớp); chọn lượt / môn trong panel. */
  const [nhapDiem, setNhapDiem] = useState(false);
  /* PR-OV3a (M2 §1): nút cố định Nhập điểm · + Case · ⋯ — không đổi chỗ theo chặng. ⋯ gom Lớp → Lộ trình → Công cụ → (kẻ) kết thúc, cùng thứ tự hai loại lớp. */
  const mucLop = menuHoSoLop({
    thuong, lienTuc: !!data.lienTuc, chuongTrinh: data.programme?.code ?? null, soHocVien: s?.studentCount ?? 0,
    canEditProgress: data.viewer.canEditProgress, canAssign: data.viewer.canAssign, canAssignSubject: !!data.viewer.canAssignSubject,
    canAddStudents: data.viewer.canAddStudents, coTheSuaHocVien: !!data.viewer.coTheSuaHocVien, coTheSuaCaLop: !!data.viewer.coTheSuaCaLop, coTheChuyenTiep: data.viewer.coTheChuyenTiep,
    /* PR-XUAT (Q8): GVCN của lớp hoặc người xếp lịch (Quản lý) — máy chủ xuất vẫn kiểm lại phạm vi. */
    coTheXuatExcel: !!session?.nav?.xuatMt && (data.viewer.isCoreTeacher || data.viewer.canPlanWeek),
    coTheMoLaiLop: !!data.viewer.coTheMoLaiLop, coTheXoa: !!xk.data?.coTheXoa, coTheKetThuc: !!xk.data && xk.data.coDuLieu && !xk.data.daKetThuc,
    coTheXemLichSu: true,
  });
  const menu: MucMenu[] = mucLop.flatMap((m, i) => {
    const truoc = mucLop[i - 1];
    const dau = m.nhom && m.nhom !== truoc?.nhom ? [{ key: `nhom-${m.nhom}`, nhan: t(m.nhom), tieuDe: true, keTruoc: false, onChon: () => undefined }] : [];
    const muc = { key: m.key, nhan: m.nhan, keTruoc: !m.nhom && !!truoc?.nhom, nguyHiem: m.key === 'xoa-lop', onChon: () => onViec(m.key) };
    /* Góp ý hàng tuần gỡ 24/10 — giữ đường xem dữ liệu cũ ngay dưới Lịch sử (cùng nhóm Công cụ), chỉ khi lớp có góp ý (PTA Plan 25/10). */
    return m.key === 'lich-su' && data.coGopY ? [...dau, muc, { key: 'lich-su-gop-y', nhan: t('Lịch sử góp ý tuần'), onChon: () => onViec('lich-su-gop-y') }] : [...dau, muc];
  });

  /* V8-HSL (mockup v8 `ho-so-lop.html`, chủ SP duyệt 29/10): đầu trang 4 hàng ~170 px — ① ‹ nguồn · trước / sau ② mã lớp + chương trình · HV · tuần ·
     khai giảng | Nhập điểm · + Case · ⋯ ③ GVCN + GV bộ môn một dòng 13 px ④ số (Lượt gần nhất · Đạt ⓘ · SOS chip mức + số HV ngoài chip) | badge đổi
     trang "›" ⑤ Việc của tôi. GIỮ mọi nút / badge / đích (bảng thao tác `thiet-ke/v8/ho-so-lop-ghi-chu.md`). */
  const bConLai = b;
  const nhom = nhomGiaoVienBoMon(data.skills.map((x) => x.skill), data.skillTeachers, data.programme?.code ?? null);
  const meta: ReactNode[] = [
    dich(data.programme?.name ?? data.kind),
    <><b className="font-semibold tabular-nums text-slate-100">{s?.studentCount ?? 0}</b> HV</>,
    s?.currentWeek ? <>{t('tuần {n}', { n: '' }).trim()} <b className="font-semibold tabular-nums text-slate-100">{s.currentWeek}{s.totalWeeks ? `/${s.totalWeeks}` : ''}</b></> : null,
    data.startDate ? t('khai giảng {ngay}', { ngay: `${data.startDate.slice(8, 10)}/${data.startDate.slice(5, 7)}` }) : null,
  ].filter(Boolean);
  const nutBadge = (x: BadgeLop) => {
    const bam = bamBadge(x);
    /* G6: badge đổi trang có "›". */
    return bam
      ? <Nhan key={x.key} tone={toneBadgeLop(x)} title={x.title} onClick={bam}>{x.nhan} <span aria-hidden className="font-bold">›</span></Nhan>
      : <Nhan key={x.key} tone={toneBadgeLop(x)} title={x.title}>{x.nhan}</Nhan>;
  };

  return (
    <header className="flex flex-col gap-1.5">
      {/* PR-DH (Q-0310-4): Quay lại + Lớp trước/sau theo danh sách vừa mở; mở thẳng bằng link thì theo các lớp cùng khung ở Học viên & Lớp. */}
      <ThanhTruocSau loai="lop" gon id={data.id} cha={trangCha('lop')} ten={t('Hồ sơ lớp {lop}', { lop: data.code })}
        chiTiet={CHE_DO_NHAN[sp.get('che-do') as CheDoHocVien] ?? TAB_HO_SO_LOP_NHAN[sp.get('tab') as TabHoSoLop]}
        duong={(cid) => `/hoc-vien/lop/${cid}${sp.get('tab') ? `?tab=${sp.get('tab')}` : ''}`}
        dsDuPhong={async () => {
          const r = await api.get<{ rows: { id: number; scoringMode: string | null }[] }>('/hoc-vien-lop/ids');   // PR-TD2-b: không tải cả trang
          return { ids: r.rows.filter((c) => khungCua(c.scoringMode) === (thuong ? 'thuong' : 'ft')).map((c) => c.id), nhan: thuong ? t('Lớp thường') : 'Fast Track' };
        }} />
      {data.status === 'finished' && (
        /* HL-10 (Q4): Quản lý của lớp vẫn sửa điểm (máy chủ `kiemLopKetThuc`) — "chỉ xem" chỉ cho người khác. */
        <DaiChiXem>{t('Lớp đã kết thúc')}{data.finishedAt ? ` ${tuanLich(data.finishedAt, homNay)}` : ''}{data.viewer.coTheMoLaiLop ? '' : ` — ${t('chỉ xem')}`}</DaiChiXem>
      )}
      {/* ② nhận diện + nút cố định (PR-OV3a). 375: nút xuống một hàng, chia đều. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <h1 className="m-0 text-[22px] font-bold leading-[1.3] text-slate-100">{data.code}</h1>
        <span className="flex flex-wrap items-baseline text-sm text-slate-400 max-sm:basis-full">
          {meta.map((m, i) => <span key={i} className={`whitespace-nowrap ${i === 3 ? 'max-sm:hidden' : ''}`}>{i > 0 && <span aria-hidden>{' · '}</span>}{m}</span>)}
        </span>
        <div className="ml-auto flex items-center gap-2 max-sm:ml-0 max-sm:w-full max-sm:[&>button:not([aria-haspopup])]:flex-1">
          {data.viewer.canEnterScores && <button type="button" className="btn h-9 justify-center max-sm:h-11" onClick={() => setNhapDiem(true)}>{t('Nhập điểm')}</button>}
          {nhapDiem && <PanelNhapDiemLop classId={data.id} classCode={data.code} onDong={() => setNhapDiem(false)} />}
          {data.viewer.canReportCase && <button type="button" className="btn h-9 justify-center max-sm:h-11" onClick={() => onViec('case')}>+ Case</button>}
          <MenuDong muc={menu} nhan={t('Thao tác khác')} lopNut={NUT_BA_CHAM} />
        </div>
      </div>

      {/* ③ GVCN + GV bộ môn một dòng 13 px — tên chữ thường (link hồ sơ GV khi được xem), không xanh to. */}
      <DongGiaoVienBoMon nhom={[...(gvcn ? [{ nhan: t('GVCN'), title: t('Giáo viên chủ nhiệm'), id: gvcn.id, ten: gvcn.name, kyNang: [] }] : []), ...nhom]} />

      {/* ④ số của lớp | badge đổi trang. */}
      <div className="flex min-h-7 flex-wrap items-center gap-x-[26px] gap-y-2">
        {tomTat?.luot && <So n={t('Lượt gần nhất')} g={tomTat.luot} />}
        {tomTat?.dat && (
          <So n={tomTat.dat.nhan} g={(
            <span className="inline-flex items-baseline gap-1">
              <span className="tabular-nums text-dat">{Math.round((tomTat.dat.so / tomTat.dat.tong) * 100)} %</span>
              <span className="mr-1 text-[13px] font-medium tabular-nums text-slate-500">{tomTat.dat.so}/{tomTat.dat.tong} HV</span>
              <NutLuat label={t('Cách tính Đạt')}>{t('Em đạt kỳ vọng ở lượt gần nhất đã đủ điểm của từng em / số em có lượt đủ điểm. Cùng kết luận với cột Kết quả.')}</NutLuat>
            </span>
          )} />
        )}
        {tomTat && tomTat.sos.length > 0 && (
          <So ngang n="SOS" g={(
            <span className="inline-flex flex-wrap items-center gap-x-3.5 gap-y-1">
              {tomTat.sos.map(([muc, n]) => (
                <span key={muc} className="inline-flex items-center gap-1.5 whitespace-nowrap" title={t('SOS {muc}: {n} HV', { muc, n })}>
                  <span className={`${CHIP_SOS} ${lopSos(muc)}`}>SOS {muc}</span>
                  <span className="tabular-nums">{n}</span><span className="text-[13px] font-medium text-slate-400">HV</span>
                </span>
              ))}
            </span>
          )} />
        )}
        {(bConLai.hien.length > 0 || bConLai.an.length > 0) && (
          <div className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0">
            {bConLai.hien.map(nutBadge)}
            {bConLai.an.length > 0 && (
              <MenuDong kieu="chip" bieuTuong={`+${bConLai.an.length}`} nhan={t('{n} việc khác của lớp', { n: bConLai.an.length })}
                muc={bConLai.an.map((x) => { const bam = bamBadge(x); return { key: x.key, nhan: x.nhan, tieuDe: !bam, onChon: bam ?? (() => undefined) }; })} />
            )}
          </div>
        )}
      </div>

      <DaiLopChuyen dai={data.dai} homNay={homNay} onChuyenTiep={() => onViec('chuyen-tiep')} onBanGiao={onBanGiao} />
      {/* ⑤ "Việc của tôi" một hàng (ThanhViecLop — nơi gọi truyền vào). */}
      {thanhViec}
    </header>
  );
}

/** Ô số hàng ④ (mockup `.ng`): nhãn 13 nhạt + giá trị 15 đậm cùng đường cơ sở. */
function So({ n, g, ngang }: { n: ReactNode; g: ReactNode; ngang?: boolean }) {
  return (
    /* 375 (mockup): nhãn trên, giá trị dưới — trừ SOS (một hàng chip). */
    <span className={`inline-flex items-baseline gap-2 whitespace-nowrap ${ngang ? '' : 'max-sm:flex-col max-sm:items-start max-sm:gap-0'}`}>
      <span className="text-[13px] font-medium text-slate-400">{n}</span>
      <span className="text-[15px] font-bold text-slate-100">{g}</span>
    </span>
  );
}
/* Nút ⋯ đầu trang cao 36 (mockup `.btn.ba-cham`) — cùng hàng nút Nhập điểm / + Case; điện thoại 44. */
const NUT_BA_CHAM = 'btn h-9 w-9 shrink-0 !px-0 font-bold tracking-wider max-sm:h-11 max-sm:w-11';

/** Nhãn nhỏ xám trên, giá trị đậm dưới (mockup `.nhan-gt`, P2) — hồ sơ lớp + hồ sơ HV. */
export function NhanGt({ n, g }: { n: ReactNode; g: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col gap-px">
      <span className="text-xs font-medium text-slate-500">{n}</span>
      <span className="text-[15px] font-bold text-slate-100">{g}</span>
    </span>
  );
}

/**
 * SỐ ĐẦU TRANG (khu b): Lượt gần nhất = lượt của lớp có tuần thi gần nhất đã tới (không lượt lịch sử) · Đạt = em đạt kỳ vọng ở LƯỢT GẦN NHẤT ĐÃ
 * ĐỦ ĐIỂM CỦA TỪNG EM (P8 — không lấy một MT chung của lớp; cùng một MT thì nhãn "Đạt MT2") · SOS theo mức (`sosLevel` của bảng lớp). Dùng lại
 * hai đường tab Học viên đã tải trước (`/roster`, `/diem-theo-luot`) — không thêm lời gọi.
 */
function useTomTatLop(data: HoSoLop, homNay: string | null) {
  const roster = useApi<RosterRow[]>(`/classes/${data.id}/roster`, [data.id]);
  const ds = useApi<DanhSachLuot>(data.viewer.coTheXemDiem ? duongDiemTheoLuot(data.id) : null, [data.id]);
  if (!roster.data) return null;
  const em = roster.data.filter((r) => r.status === 'active' && !r.archived);
  const sos = ([1, 2, 3] as const).map((m) => [m, em.filter((r) => (r.sosLevel ?? 0) === m || (m === 3 && (r.sosLevel ?? 0) > 3)).length] as [number, number]).filter(([, n]) => n > 0);
  /* Kết luận máy chủ (`standing` → `ketQuaGanNhat`, cùng ô Kết quả của bảng): mẫu = em có lượt đủ điểm, đạt = `dat`. */
  const moi = em.map((r) => (r as { standing?: KetQuaVao | null }).standing).filter((k): k is KetQuaVao => !!k && k.scored >= k.required && !!k.attemptLabel);
  const nhanLuot = [...new Set(moi.map((k) => k.attemptLabel!))];
  const dat = moi.length ? { nhan: nhanLuot.length === 1 ? t('Đạt {mt}', { mt: dich(nhanLuot[0]) }) : data.isFastTrack ? t('Đạt MT') : t('Đạt Test'), so: moi.filter((k) => ketQuaGanNhat(k).dat).length, tong: moi.length } : null;
  const homNayTuan = homNay ?? '9999';
  const l = (ds.data?.luot ?? []).filter((x) => !x.lichSu && x.tuanStart && x.tuanStart <= homNayTuan).sort((a, b) => (b.tuanStart ?? '').localeCompare(a.tuanStart ?? ''))[0];
  return { sos, dat, luot: l ? `${dich(l.nhan)} · ${tuanLich(l.tuanStart!, homNayTuan)}` : null };
}

/**
 * GV BỘ MÔN MỘT DÒNG KHÔNG XUỐNG HÀNG (06c §1): "L · R Trần Ngọc Hà   W1 Lê Minh Khoa …". Điện thoại hiện 2 nhóm, máy tính 5 nhóm,
 * còn lại "+k" — bấm ra đủ danh sách ngay bên dưới (không popover trong vùng cắt `overflow-x-clip`). Lớp CSS là chuỗi tĩnh.
 */
function DongGiaoVienBoMon({ nhom }: { nhom: NhomGiaoVien[] }) {
  const [du, setDu] = useState(false);
  if (!nhom.length) return null;
  const mot = (g: NhomGiaoVien, i: number, luonHien: boolean) => (
    <span key={`${g.nhan}-${i}`}
      className={`items-baseline gap-1 whitespace-nowrap ${luonHien || i < 2 ? 'inline-flex' : i < 5 ? 'hidden sm:inline-flex' : 'hidden'}`}>
      <abbr className="font-medium text-slate-400 no-underline" title={g.title}>{g.nhan}</abbr>
      {g.id !== null ? <TenGiaoVien id={g.id} ten={g.ten} /> : <span className="text-amber-200">{g.ten}</span>}
    </span>
  );
  return (
    /* V8-HSL hàng ③: 13 px, tên chữ chính đậm vừa (không link xanh to). */
    <div className="text-[13px] text-slate-400 [&_.ten-ho-so]:font-medium">
      {/* HL-18: cắt chiều ngang thôi (`overflow-x-clip`) — vùng chạm 44 px của tên GV / "+k" ở 375 không bị cắt theo chiều dọc. */}
      <div className="flex items-center gap-3.5 overflow-x-clip whitespace-nowrap">
        {nhom.map((g, i) => mot(g, i, false))}
        {nhom.length > 2 && (
          <button type="button" aria-expanded={du} className="link relative border-0 bg-transparent p-0 text-[13px] sm:hidden after:absolute after:-inset-x-3 after:-inset-y-3.5 after:content-['']" onClick={() => setDu((v) => !v)}>
            +{nhom.length - 2}
          </button>
        )}
        {nhom.length > 5 && (
          <button type="button" className="link hidden border-0 bg-transparent p-0 text-[13px] sm:inline" onClick={() => setDu((v) => !v)}>
            +{nhom.length - 5}
          </button>
        )}
      </div>
      {du && <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1">{nhom.map((g, i) => mot(g, i, true))}</div>}
    </div>
  );
}
