import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DaiChiXem } from '../../ui/ui.tsx';
import { CHIP_SOS, Nhan, lopSos, toneBadgeLop } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { MenuDong, NUT_BA_CHAM, NUT_DAU_HO_SO, type MucMenu } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate, onInvalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ThanhTruocSau } from '../../ui/ThanhTruocSau.tsx';
import { CHE_DO_NHAN, type CheDoHocVien } from './TabHocVienLop.tsx';
import { useSession } from '../../lib/session.tsx';
import { TenGiaoVien } from './TenGiaoVien.tsx';
import { DongChoDoi, type ChoDoiLop } from './TeacherAssignPanel.tsx';
import { DaiLopChuyen } from './DaiChuyenLop.tsx';
import type { TinhTrangXoaKetThuc } from './XoaKetThucLopPanel.tsx';
import { TAB_HO_SO_LOP_NHAN, trangCha, type TabHoSoLop, badgeLop, badgeHienTheoVai, vaiXemHocVien, khungCua, duongLichTest, laVaiQuanLy, needScoresText, menuHoSoLop, nhomGiaoVienBoMon, ketQuaGanNhat, type KetQuaVao, type ViecMenuLop, type NhomGiaoVien, tuanLich, type BadgeLop, type DaiLop, type WorkScope } from '@shared/domain/index.ts';
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
  /** BAO-CAO-PH: có tab "Báo cáo PH" (chương trình có mẫu + người xem có quyền) + chip đợt đang mở / vừa quá hạn. */
  baoCaoPh?: { coTab: true; dot: string | null; nhan: string | null; han: string | null; quaHan: number } | null;
  /** P3: lớp có góp ý hàng tuần cũ → ⋯ › Lịch sử góp ý tuần. */
  coGopY?: boolean;
  /** PR-D: lịch đổi phân công đang chờ (hàng GV + Thông tin lớp › Phân công). */
  phanCongCho?: ChoDoiLop[];
  /** PR-CT: dữ liệu dải Kết thúc khoá / Bàn giao / Sắp nhận (mockup 20 — A, H); null khi lớp đã kết thúc. */
  dai: DaiLop | null;
  status?: string; finishedAt?: string | null;
  viewer: {
    canPlanWeek: boolean; canAddStudents: boolean; canAssign: boolean; canAssignSubject?: boolean; canEditProgress: boolean;
    /** SUA-LICH-LOP: sửa khai giảng / tuần Progress / Final (GVCN lớp, Admin chi nhánh, QL) — máy chủ `duocSuaLichLop`. */
    canEditSchedule?: boolean;
    /** OV-13p: `student.edit` ở lớp — `canAddStudents` chỉ là thêm học viên (`student.add`). */
    coTheSuaHocVien?: boolean;
    editableSkills: string[]; isCoreTeacher: boolean;
    canReportCase: boolean; canRecordViolation: boolean; canEnterScores: boolean; canManageDiscipline?: boolean;
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
 *   dòng 2  chi nhánh · LT (bọc `<abbr>` "Lộ trình 1") · n học viên · tuần {n}/{tổng} · khai giảng — hộp nhỏ "GVCN tên"; lớp thường cuối khoá: "Cuối khoá: 6/8 em có đủ điểm"
 *   dòng 3  GV bộ môn một dòng không xuống hàng, gom theo người; hẹp thì "+k" (bấm ra đủ danh sách)
 *   dòng 4  tối đa 2 badge theo vai, phần còn lại "+n" (menu)
 * Mỗi nút chỉ hiện khi người xem làm được (Q9).
 */
export function DauTrangLop({ data, onViec: onViecGoc, onBanGiao, onBanGiaoGv, thanhViec }: {
  data: HoSoLop; onViec: (v: ViecDauTrang) => void;
  /** V8-HSL hàng ⑤: thanh "Việc của tôi" (ThanhViecLop) nằm trong đầu trang, sau dải lớp chuyển. */
  thanhViec?: ReactNode;
  /** PR-CT: mở panel Bàn giao từ dải (lớp NGUỒN mặc định là lớp đang xem; `mon` = bảng GVBM). */
  onBanGiao: (o: { lop?: number; mon?: string }) => void;
  /** PR-B: mở panel bàn giao khi đổi GV (id việc). */
  onBanGiaoGv?: (id: number) => void;
}) {
  /*
   * RKC-4b (PTA 07/11): thao tác VÒNG ĐỜI ở lớp đã kết thúc (+ Học viên, Cuối khoá, Chuyển tiếp) — máy chủ hỏi "Mở lại lớp để …?" (`deViec`), đồng ý thì
   * mở lại rồi làm tiếp ngay tại đây. Phân công: máy chủ hỏi lúc lưu. Bấm Đóng ở hộp hỏi → không làm gì.
   */
  const toastVd = useToast();
  const VONG_DOI: Partial<Record<ViecDauTrang, string>> = { 'hoc-vien': t('thêm học viên'), 'lo-trinh-ca-lop': t('chốt lộ trình cả lớp'), 'chuyen-tiep': t('chuyển tiếp lớp') };
  const onViec = (v: ViecDauTrang) => {
    const viec = data.status === 'finished' ? VONG_DOI[v] : undefined;
    if (!viec) { onViecGoc(v); return; }
    void api.post(`/classes/${data.id}/mo-lai`, { deViec: viec })
      .then(() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); onViecGoc(v); })
      .catch((e: any) => { if (e?.status !== 409) toastVd.push('error', e?.message ?? t('Không lưu được')); });   // 409 = bấm Đóng ở hộp hỏi
  };
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const thuong = data.programme?.scoringMode === 'ratio';
  const s = data.summary;
  const gvcn = data.coreTeachers[0] ?? null;
  const tomTat = useTomTatLop(data, homNay);
  /* OV-13b · LOP-1-LOP: badge "n việc quá hạn" = `soQuaHanLop` của viec-theo-em (cùng danh sách việc `myWork` với Công việc, cùng `demDongViec` — S11 đếm dòng; GV chỉ việc
     của mình) — cùng đường ThanhViecLop nên một GET; QL / QT thôi đọc `/my-work?nguoi=tat-ca` cả chi nhánh (GV vẫn có `/my-work` của khung App). */
  const viec = useApi<ViecLop>(duongViecLop(data.id), [data.id]);
  const soViecQuaHan = viec.data?.soQuaHanLop ?? 0;
  /* Thao tác Case / PA… chỉ vô hiệu `/my-work` — trước PR badge đọc `/my-work` nên tự tải lại; giữ vậy và vô hiệu đúng đường này để badge + thanh "Việc của
     tôi" cùng tải lại (một GET). Lưu điểm vô hiệu `/classes` rồi `/my-work` cùng nhịp → đường đã tải lại theo `/classes`, bỏ qua để không gọi đôi. */
  useEffect(() => {
    const duong = duongViecLop(data.id);
    let vuaTai = false;
    return onInvalidate((x) => {
      if (x !== null && duong.startsWith(x)) { vuaTai = true; queueMicrotask(() => { vuaTai = false; }); }
      else if (x === '/my-work' && !vuaTai) invalidate(duong);
    });
  }, [data.id]);
  const bGoc = badgeLop({
    vai: laVaiQuanLy(session?.roles) ? 'ql' : 'gv', needsPlacement: !!s?.needsPlacement, canXepLop: s?.canXepLop ?? 0, missingSkills: s?.missingSkills ?? [],
    soBaiChoCham: s?.needScores ?? 0,
    needScoresTitle: s && s.needScores > 0 ? needScoresText(s.workScope, s.needScores) : null,
    /* GD-6 (XM-2, PTA 14/11): GV không có badge "n việc quá hạn của lớp" — máy chủ đếm việc của chính GV, trùng chip ⚠ của Việc cần làm; QL giữ (cả lớp). */
    phase: s?.phase ?? 'running', soChoDuyet: data.soChoDuyet, soViecQuaHan: laVaiQuanLy(session?.roles) ? soViecQuaHan : 0,
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
      : x.key === 'cho-duyet' && session?.nav?.workApprove ? () => navigate(`/cong-viec?nhom=duyet&lop=${data.id}`)
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
    canEditProgress: data.viewer.canEditProgress, canEditSchedule: !!data.viewer.canEditSchedule, canAssign: data.viewer.canAssign, canAssignSubject: !!data.viewer.canAssignSubject,
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
  /* P1 rà 11/11 G4-23: một badge ẩn thì hiện thẳng ("+1 việc" mở ra "15 việc quá hạn" là sai đơn vị); nhiều badge ẩn → chip "+n". */
  const bConLai = b.an.length === 1 ? { hien: [...b.hien, ...b.an], an: [] as typeof b.an } : b;
  const nhom = nhomGiaoVienBoMon(data.skills.map((x) => x.skill), data.skillTeachers, data.programme?.code ?? null);
  /* HSL-GON (M1, M4): viên chương trình · HV · tuần chữ 500 mờ (không số đậm trong viên); "khai giảng" không thành viên — rê chuột viên tuần (`title`). */
  const khaiGiang = data.startDate ? t('khai giảng {ngay}', { ngay: `${data.startDate.slice(8, 10)}/${data.startDate.slice(5, 7)}` }) : undefined;
  const meta: ReactNode[] = [
    dich(data.programme?.name ?? data.kind),
    <><span className="tabular-nums">{s?.studentCount ?? 0}</span> HV</>,
    /* Lớp đã kết thúc: không đếm tuần (tuần học tính tới hôm nay → "tuần 42/8"); dải "Lớp đã kết thúc W…" bên dưới đã nói mốc. */
    s?.currentWeek && data.status !== 'finished' ? <span title={khaiGiang}>{t('tuần {n}', { n: '' }).trim()} <span className="tabular-nums">{s.currentWeek}{s.totalWeeks ? `/${s.totalWeeks}` : ''}</span></span>
      : khaiGiang ?? null,
  ].filter(Boolean);
  const nutBadge = (x: BadgeLop) => {
    const bam = bamBadge(x);
    /* MOCKUP-1111 màn 1: "n việc quá hạn của lớp" — phạm vi lớp, khỏi lẫn với "Việc của tôi · n" ngay dưới. */
    const nhan = x.key === 'qua-han' ? `${x.nhan} ${t('của lớp')}` : x.nhan;
    /* G6: badge đổi trang có "›". */
    return bam
      ? <Nhan key={x.key} tone={toneBadgeLop(x)} title={x.title} onClick={bam}>{nhan} <span aria-hidden className="font-bold">›</span></Nhan>
      : <Nhan key={x.key} tone={toneBadgeLop(x)} title={x.title}>{nhan}</Nhan>;
  };

  /* GD-6 (mockup v21 ② K1, lời 25): GV một dòng gộp theo người — GVCN dạy luôn kỹ năng thì một nhãn "GVCN, L, R"; KHÔNG ô TVV (TVV ở phần mở rộng em). */
  const nhomGon: NhomGiaoVien[] = (() => {
    const ds = nhom.map((g) => ({ ...g, nhan: g.nhan.replace(/ · /g, ', ') }));
    if (!gvcn) return ds;
    const cung = ds.find((g) => g.id === gvcn.id);
    const dau: NhomGiaoVien = cung ? { ...cung, nhan: `${t('GVCN')}, ${cung.nhan}`, title: `${t('Giáo viên chủ nhiệm')} · ${cung.title}` }
      : { nhan: t('GVCN'), title: t('Giáo viên chủ nhiệm'), id: gvcn.id, ten: gvcn.name, kyNang: [] };
    return [dau, ...ds.filter((g) => g !== cung)];
  })();
  const nhomDu: NhomGiaoVien[] = [...(gvcn ? [{ nhan: t('GVCN'), title: t('Giáo viên chủ nhiệm'), id: gvcn.id, ten: gvcn.name, kyNang: [] }] : []), ...nhom];
  const coSo = !!tomTat && (!!tomTat.luot || !!tomTat.dat || tomTat.sos.length > 0);
  const coBadge = bConLai.hien.length > 0 || bConLai.an.length > 0;

  return (
    /* GD-6 (mockup v21 ② K1, R2.1): đầu trang HAI hàng — ① ‹ nguồn · mã · chip · Nhập điểm · + Case · ⋯ │ ‹ n/N › ② GV một dòng (bấm mở đủ) —
       rồi DẢI SỐ MỎNG (Lượt mới nhất · Đạt ⓘ · SOS │ badge phạm vi lớp "›"), dải lớp chuyển, Việc cần làm. Không mất nút / số / đích nào. */
    <header className="flex flex-col gap-2 pb-1">
      {/* PR-DH (Q-0310-4): Quay lại + Lớp trước/sau theo danh sách vừa mở; mở thẳng bằng link thì theo các lớp cùng khung ở Học viên & Lớp. */}
      <ThanhTruocSau loai="lop" id={data.id} cha={trangCha('lop')} ten={t('Hồ sơ lớp {lop}', { lop: data.code })}
        chiTiet={CHE_DO_NHAN[sp.get('che-do') as CheDoHocVien] ?? TAB_HO_SO_LOP_NHAN[sp.get('tab') as TabHoSoLop]}
        duong={(cid) => `/hoc-vien/lop/${cid}${sp.get('tab') ? `?tab=${sp.get('tab')}` : ''}`}
        dsDuPhong={async () => {
          const r = await api.get<{ rows: { id: number; scoringMode: string | null }[] }>('/hoc-vien-lop/ids');   // PR-TD2-b: không tải cả trang
          return { ids: r.rows.filter((c) => khungCua(c.scoringMode) === (thuong ? 'thuong' : 'ft')).map((c) => c.id), nhan: thuong ? t('Lớp thường') : 'Fast Track' };
        }}
        giua={<>
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 max-sm:order-2 max-sm:basis-full">
            <h1 className="m-0 whitespace-nowrap text-[22px] font-bold leading-[1.3] text-slate-100 sm:ml-1">{data.code}</h1>
            {/* U03 (mockup `.tags .tag.nhat`): chương trình · HV · tuần thành chip nền phụ. */}
            <span className="flex flex-wrap items-center gap-1.5">
              {meta.map((m, i) => <span key={i} className="inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-md bg-[color:var(--surface-2)] px-2 text-xs font-medium text-dim">{m}</span>)}
            </span>
          </span>
          <div className="ml-auto flex items-center gap-2 max-sm:order-3 max-sm:ml-0 max-sm:w-full max-sm:[&>button:not([aria-haspopup])]:flex-1">
            {data.viewer.canEnterScores && <button type="button" className={NUT_DAU_HO_SO} onClick={() => setNhapDiem(true)}>{t('Nhập điểm')}</button>}
            {nhapDiem && <PanelNhapDiemLop classId={data.id} classCode={data.code} onDong={() => setNhapDiem(false)} />}
            {data.viewer.canReportCase && <button type="button" className={NUT_DAU_HO_SO} onClick={() => onViec('case')}>+ Case</button>}
            <MenuDong muc={menu} nhan={t('Thao tác khác')} lopNut={NUT_BA_CHAM} />
          </div>
        </>} />
      {data.status === 'finished' && (
        /* HL-10 (Q4): Quản lý của lớp vẫn sửa điểm (máy chủ `kiemLopKetThuc`) — "chỉ xem" chỉ cho người khác. */
        <DaiChiXem>{t('Lớp đã kết thúc')}{data.finishedAt ? ` ${tuanLich(data.finishedAt, homNay)}` : ''}{data.viewer.coTheMoLaiLop ? '' : ` — ${t('chỉ xem')}`}</DaiChiXem>
      )}

      {/* ② GV theo kỹ năng MỘT dòng (bấm mở bản đủ — tên GV ở bản đủ là link hồ sơ GV). */}
      <DongGiaoVien gon={nhomGon} du={nhomDu} />
      <DongChoDoi cho={data.phanCongCho ?? []} ct={data.programme?.code ?? null} homNay={homNay} />

      {/* Dải số mỏng (mockup `.dai-so`): số của lớp │ badge phạm vi lớp "›" (dời từ hàng tiêu đề — XM-5). */}
      {(coSo || coBadge) && (
        <div className="flex min-h-[38px] flex-wrap items-center gap-y-1.5 rounded-lg border py-[5px] pr-1.5 max-sm:px-3 max-sm:py-2"
          style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          {tomTat?.luot && <SoMong n={t('Lượt mới nhất')}><b className={SO_DAM}>{tomTat.luot}</b></SoMong>}
          {tomTat?.dat && (
            <SoMong n={tomTat.dat.nhan}>
              <b className={SO_DAM}>{Math.round((tomTat.dat.so / tomTat.dat.tong) * 100)} %</b>
              <span className="tabular-nums">{tomTat.dat.so}/{tomTat.dat.tong} HV</span>
              <NutLuat label={t('Cách tính Đạt')}>{t('Em đạt kỳ vọng ở lượt gần nhất đã đủ điểm của từng em / số em có lượt đủ điểm. Cùng kết luận với cột Kết quả.')}</NutLuat>
            </SoMong>
          )}
          {tomTat && tomTat.sos.length > 0 && (
            /* Mockup: tổng "n HV"; số theo mức ở chip nhỏ sau (không mất thông tin). */
            <SoMong n="SOS">
              <b className={SO_DAM}>{tomTat.sos.reduce((n, [, x]) => n + x, 0)} HV</b>
              {tomTat.sos.map(([muc, n]) => (
                <span key={muc} className={`${CHIP_SOS} ${lopSos(muc)} tabular-nums`} title={t('SOS {muc}: {n} HV', { muc, n })}>SOS {muc} · {n}</span>
              ))}
            </SoMong>
          )}
          {coBadge && (
            <span className="ml-auto flex flex-wrap items-center gap-1.5 pl-2.5 max-sm:ml-0 max-sm:basis-full max-sm:pl-0">
              {bConLai.hien.map(nutBadge)}
              {bConLai.an.length > 0 && (
                <MenuDong kieu="chip" bieuTuong={`+${bConLai.an.length}`} nhan={t('{n} việc khác của lớp', { n: bConLai.an.length })}
                  muc={bConLai.an.map((x) => { const bam = bamBadge(x); return { key: x.key, nhan: x.nhan, tieuDe: !bam, onChon: bam ?? (() => undefined) }; })} />
              )}
            </span>
          )}
        </div>
      )}

      <DaiLopChuyen dai={data.dai} homNay={homNay} onChuyenTiep={() => onViec('chuyen-tiep')} onBanGiao={onBanGiao} onBanGiaoGv={onBanGiaoGv} />
      {/* Việc cần làm (ThanhViecLop — nơi gọi truyền vào). */}
      {thanhViec}
    </header>
  );
}

/** Dải số mỏng (mockup `.dai-so .s`): nhãn 13 mờ + giá trị 14 / 600 cùng dòng, vạch ngăn trái (ô đầu không vạch). */
const SO_DAM = 'text-sm font-semibold tabular-nums text-slate-100';
function SoMong({ n, children }: { n: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex min-h-[22px] items-center gap-1.5 whitespace-nowrap border-l px-3.5 text-[13px] text-dim first:border-l-0 max-sm:px-2.5 max-sm:first:pl-0"
      style={{ borderColor: 'var(--line)' }}>
      {n} {children}
    </span>
  );
}
/** U03 (mockup `.fact`): ô nhãn 12 mờ trên – giá trị 15/600 dưới, vạch ngăn trái 1 px (ô đầu không vạch) — hàng GV và hàng số của lớp. */
const FACT = 'flex min-w-0 flex-col gap-0.5 whitespace-nowrap border-l px-[18px] py-0.5 first:border-l-0 first:pl-0 max-sm:px-3';

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
  /* MT0-THEO-EM: `mt:0` = MT0 em mang từ lớp thường (thi ở lớp cũ) — không là lượt của lớp FT. */
  const l = (ds.data?.luot ?? []).filter((x) => !x.lichSu && x.ma !== 'mt:0' && x.tuanStart && x.tuanStart <= homNayTuan).sort((a, b) => (b.tuanStart ?? '').localeCompare(a.tuanStart ?? ''))[0];
  return { sos, dat, luot: l ? `${dich(l.nhan)} · ${tuanLich(l.tuanStart!, homNayTuan)}` : null };
}

/**
 * GV THEO KỸ NĂNG MỘT DÒNG (GD-6, mockup v21 ② `.gv-dong` / `.gv-du`): cả dòng là MỘT nút — "GVCN, L, R Đinh Thu Hằng │ S … │ W1 …" 13 px, không
 * xuống hàng; bấm mở bản đủ (ô nhãn trên – tên dưới, tên là link hồ sơ GV — XM-3). 375: hai người đầu + "+n người". Chưa phân công: tên màu sắp hạn.
 */
function DongGiaoVien({ gon, du }: { gon: NhomGiaoVien[]; du: NhomGiaoVien[] }) {
  const [mo, setMo] = useState(false);
  if (!gon.length) return null;
  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" aria-expanded={mo} onClick={() => setMo((v) => !v)} aria-label={t('Giáo viên của lớp')}
        className="group inline-flex min-h-7 max-w-full items-center overflow-hidden whitespace-nowrap rounded-md border-0 bg-transparent p-0 text-left text-[13px] leading-[1.35] max-sm:min-h-[44px]">
        {gon.map((g, i) => (
          <span key={`${g.nhan}-${i}`} title={g.title} style={{ borderColor: 'var(--line)' }}
            className={`items-baseline gap-1.5 border-l px-3 first:border-l-0 first:pl-0 max-sm:px-2.5 ${i >= 2 ? 'hidden sm:inline-flex' : 'inline-flex'}`}>
            <i className="text-xs font-semibold not-italic text-faint">{g.nhan}</i>
            <b className={`font-semibold group-hover:text-[color:var(--accent)] ${g.id === null ? 'text-soon' : 'text-slate-100'}`}>{g.ten}</b>
          </span>
        ))}
        {gon.length > 2 && <span className="pl-2.5 text-xs font-semibold text-dim sm:hidden">{t('+{n} người', { n: gon.length - 2 })}</span>}
        <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" className={`ml-0.5 shrink-0 fill-none stroke-current text-dim transition-transform motion-reduce:transition-none ${mo ? 'rotate-180' : ''}`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 6L8 10.5 12.5 6" /></svg>
      </button>
      {mo && (
        <div className="flex flex-wrap gap-y-2 rounded-lg border px-3.5 py-2.5 text-[13px] [&_.ten-ho-so]:font-semibold [&_.ten-ho-so]:text-slate-100" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          {du.map((g, i) => (
            <span key={`${g.nhan}-${i}`} className={FACT} style={{ borderColor: 'var(--line)' }}>
              <abbr className="text-xs font-medium leading-[1.3] text-faint no-underline" title={g.title}>{g.nhan}</abbr>
              <span className="text-sm font-semibold leading-[1.35] text-slate-100">{g.id !== null ? <TenGiaoVien id={g.id} ten={g.ten} /> : <span className="text-soon">{g.ten}</span>}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
