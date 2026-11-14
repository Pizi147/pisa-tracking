import { useEffect, useState } from 'react';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { ThanhTruocSau } from '../../ui/ThanhTruocSau.tsx';
import { Card, DaiChiXem, Empty, ErrorState, Info, Level, Outcome, Skeleton, TargetText, Th} from '../../ui/ui.tsx';
import { cuonOnDinh } from '../../lib/cuonOnDinh.ts';
import type { SkillBoardRow } from '../cases/SkillBoard.tsx';
import { KetLuanKhoa, MiniTestO } from './KetLuanKhoa.tsx';
import { HanhTrinh } from './HanhTrinh.tsx';
import { DiemDau, HanhTrinhKn, OVERALL, thiThatCua, type ChonKn, type LoTrinhD, type ThiThatD } from './HanhTrinhKyNang.tsx';
import { TienDoTrenLop } from './TienDoTrenLop.tsx';
import { CotCaseHv, type MoCot } from './CotCaseHv.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { CacLoTrinh } from './CacLoTrinh.tsx';
import { NganTongKet } from './NganTongKet.tsx';
import { PanelBuocTiep } from './PanelBuocTiep.tsx';
import { HopGiaHan, NhanSauThi } from './HopGiaHan.tsx';
import { Nhan, NhanLich } from '../../ui/Nhan.tsx';
import { CHU_DA_XONG, diemW12 } from '@shared/domain/index.ts';
import { DaiChoDuyet, DaiTamDung, DongLienHe, DongThongTin, ThanhViec, viecSangPanel, type Viec } from './DauHoSo.tsx';
import { NutTask } from '../congViec/NutTask.tsx';
import { PanelViec } from '../congViec/PanelViecLuoi.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { useSession } from '../../lib/session.tsx';
import { NganCase } from './NganCaseLuoi.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { StudentPlanPanel } from './StudentPlanPanel.tsx';
import { StudentManagePanel, mucQuanLyHocVien, thongTinEmCua, type ViecQuanLy } from './StudentManagePanel.tsx';
import { TomTatLuuTru } from './TomTatLuuTru.tsx';
import { MenuDong, NUT_BA_CHAM, NUT_DAU_HO_SO } from '../../ui/MenuDong.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { StudentYThucSection } from '../yThuc/StudentYThucSection.tsx';
import { attemptHref, fmtBand, skillLabel, sosTone, studentStatusLabel } from '../../lib/format.ts';
import {
  HO_SO_TAB_LABEL, duongDotTest, caseCategoriesFor, tenMonNgan, docThamSoHoSo, duongHoSoHocVien,
  nhanKetQuaThuong, tenBaiThuong, CHUONG_TRINH_KHONG_CHIA_MON, ngay, tuanLich, trangCha, vaiXemHocVien, type HoSoTab,
} from '@shared/domain/index.ts';
import { HangTab } from '../../ui/HangTab.tsx';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { DiemKq } from '../../ui/KhuonViec.tsx';
import { OTuanDay } from '../../ui/TuanDayGv.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { DaiHocVienChuyen } from '../classes/DaiChuyenLop.tsx';
import { huyQuyetDinhNgay } from './ChuyenLopPanel.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { BanGiaoPanel } from '../classes/BanGiaoPanel.tsx';
import { DaiXetLai } from '../classes/PanelXetLai.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type OpenCase = { caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'them-pa' | 'xac-nhan' | 'xac-nhan-pa' } | null;

type Profile = any;

/**
 * HỒ SƠ HỌC VIÊN.
 *
 * Trang này phải trả lời được trong khoảng ba mươi giây: em bắt đầu ở đâu, đang ở đâu,
 * đích ở đâu, có đang theo kịp không, đang vướng gì, ai đã làm gì, và bước tiếp theo là gì.
 *
 * BỐ CỤC (chủ sản phẩm chốt 22/09/2026, spec PR-HV/PR-Qb — thay ba tầng của bản 13/09):
 *
 *   Đầu trang    EM NÀY LÀ AI          tên, {khoá đang học lớp thường | Target FT}, GVCN; nút + Case · ⋮
 *   Bốn ô số     LIẾC MỘT CÁI, BẤM ĐƯỢC  Kết quả Test gần nhất · Kỹ năng cần hỗ trợ · Case đang mở · Việc cần làm tiếp
 *   Ba tab       Học thuật (mặc định: bảng kỹ năng + Case, rồi Mock Test) · Ý thức & Phối hợp · Hành trình theo giai đoạn
 *
 * Tab nằm NGAY DƯỚI đầu trang, không dồn xuống cuối; tab nhớ qua địa chỉ `?tab=` — có `?dot=`/`?kn=` thì
 * luôn mở Học thuật (R7, Q10). Hành trình vẽ MỘT trục theo lịch thật cho MỖI giai đoạn (Lớp thường | Fast
 * Track), không gộp hai thang điểm khác nhau vào một trục.
 *
 * Bản trước là BẢY cái hộp xếp chồng, trong đó ba hộp — "Đang cần chú ý", "Đường đi từng kỹ
 * năng" và bảng "Vấn đề học vụ" — nói cùng một chuyện bằng ba cách khác nhau, nên đọc hết
 * trang vẫn phải tự ghép lại mới ra kết luận. Owner gọi đúng tên nó: "vừa rối mắt vừa sơ sài".
 *
 * Ai chỉ cần liếc nhanh thì dừng ở tầng 1–2 và không phải cuộn dòng nào.
 *
 * Toàn bộ dữ liệu thuộc về MỘT lộ trình. Đổi lộ trình ở đầu trang là đổi cả trang — không
 * bao giờ trộn hai lộ trình vào một khung nhìn, vì Target và thang điểm của chúng khác nhau.
 */
export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const homNay = useNgayNghiepVu().homNay || null;
  const [params, setParams] = useSearchParams();
  /* R7/R8c/Q9/Q10 (PR-Qb): MỘT hàm đọc mọi tham số của hồ sơ — không còn đọc lẻ từng khoá. */
  const p = docThamSoHoSo((k) => params.get(k));
  const q = p.loTrinh ? `?cycleId=${p.loTrinh}` : p.dot != null ? `?attemptId=${p.dot}` : '';
  const { data, loading, error, reload } = useApi<Profile>(id ? `/students/${id}${q}` : null, [p.loTrinh, p.dot]);
  const toast = useToast();
  /* GD-7 (③ K8a): 375 mở Case bằng Ngăn Case toàn màn, không bung trong cột. */
  const dienThoai = useDienThoai();
  const [viecQuanLy, setViecQuanLy] = useState<ViecQuanLy | null>(null);
  const [giaHan, setGiaHan] = useState(false);   // OV-13q
  const [quayLaiBt, setQuayLaiBt] = useState(false);   // OV-13m: Quay lại học sau Tạm dừng sau thi = panel Bước tiếp mở sẵn Lộ trình mới
  /* OV-10b (mockup vai mục 3): TVV / CX / Admin — nút việc của vai hiện thẳng (không ⋯), khối Đang xử lý. QL / GV không đổi. */
  const vaiXem = vaiXemHocVien(useSession().session?.roles);
  const [planOpen, setPlanOpen] = useState(false);
  const dongPlan = () => {
    setPlanOpen(false);
    if (p.mo) { const next = new URLSearchParams(params); next.delete('mo'); setParams(next, { replace: true }); }
  };
  const [reportOpen, setReportOpen] = useState(false);
  /* CV-LOI (X-74): "+ Case cho {kỹ năng}" mở form chọn sẵn kỹ năng đó (category); "+ Case" chung → null. */
  const [kyNangDau, setKyNangDau] = useState<string | null>(null);
  const baoCase = (cat: string) => { setKyNangDau(cat); setReportOpen(true); };
  /** Ngăn Case (Q9) mở do BẤM trong trang (khối PA, ⋮ …) — mở do URL (`?case=`) đọc thẳng từ `p`. */
  const [openCase, setOpenCase] = useState<OpenCase>(null);
  /* UI-HO-SO-HV-2: Case mở NGAY TRONG cột Case & PA (Việc của tôi, chart) — không có trong cột thì Ngăn Case như cũ. Tuần đang rê ở Tiến độ → chart tô cột. */
  const [moCot, setMoCot] = useState<MoCot | null>(null);
  const [toTuan, setToTuan] = useState<string | null>(null);
  /*
   * HẠNG MỤC ĐANG LỌC — một state duy nhất nối bảng kỹ năng với khối Case bên dưới.
   * Bấm "Reading" ở bảng trên là khối dưới chỉ còn Case Reading; bấm lại thì bỏ lọc.
   */
  const [chonTay, setChonTay] = useState<ChonKn | null>(null);
  /*
   * BẢNG KỸ NĂNG NẠP Ở ĐÂY, KHÔNG NẠP TRONG KHỐI CON.
   *
   * Hai chỗ cần đúng bộ dữ liệu này: bảng "Tiến độ và hỗ trợ theo kỹ năng" và dòng thời gian
   * ở tab Hành trình. Để mỗi khối tự gọi lấy là hai lần gọi cho một lần mở trang, và tệ hơn:
   * hai khối có thể hiện hai trạng thái khác nhau của cùng một case.
   */
  /* Lộ trình ĐANG XEM, không phải tham số trên URL: không có tham số thì là lộ trình đang chạy. */
  const boardCycleId: number | null = data?.cycle?.id ?? null;
  /* PR-TD2-c: URL không chỉ lộ trình/đợt → hồ sơ và bảng cùng chọn lộ trình đang chạy (`currentCycle`), nên gọi bảng NGAY, song song với hồ sơ. */
  const board = useApi<{ rows: SkillBoardRow[]; tamDungTu?: string | null }>(
    !id ? null : !p.loTrinh && p.dot == null ? `/students/${id}/skill-board`
      : boardCycleId ? `/students/${id}/skill-board?cycleId=${boardCycleId}` : null,
    /* AUDIT-LOI (mục 11): không có `boardCycleId` ở đây — đường dẫn đã mang đủ khoá; `boardCycleId` null → id khi hồ sơ về làm gọi lại CÙNG
       `/students/:id/skill-board` (~52 câu SQL) mỗi lần mở hồ sơ. */
  );
  const skillRows = board.data?.rows ?? null;
  /*
   * TAB ĐANG XEM đọc từ địa chỉ (A6); có `dot`/`kn` thì LUÔN Học thuật (R7, Q10) — hai tham số đó
   * chỉ có nghĩa ở tab này. Đổi tab là `replace` để nút Quay lại của trình duyệt không phải bấm
   * nhiều lần, và xoá `dot`/`kn` vì người xem đã chủ động rời khỏi thứ hai tham số đó đang trỏ tới.
   */
  const tab: HoSoTab = p.dot != null || p.kn || p.muc ? 'hoc-thuat' : p.tab ?? 'hoc-thuat';
  const setTab = (t: HoSoTab) => {
    const next = new URLSearchParams(params);          // giữ nguyên 'lo-trinh'
    next.delete('dot'); next.delete('kn'); next.delete('muc');
    if (t === 'hoc-thuat') next.delete('tab'); else next.set('tab', t);
    setParams(next, { replace: true });
  };
  /* A5 (PR-YT4) · GD-7: đường Ý thức của em — CÙNG đường với tab bên trong; nay còn cho quyền "+ Task" (Vi phạm / Nhắc nhở · Báo / Hỏi tình hình), không thêm request. */
  const yThuc = useApi<{ canRecord?: boolean; coTheBao?: boolean; coTheHoi?: boolean; gvcn?: string | null }>(id ? `/students/${id}/y-thuc` : null, [id]);
  /* GD-7 (③ R3.2): việc đang mở ở panel việc tại chỗ + danh sách lúc mở (để "Việc tiếp ›" đi đúng thứ tự khi việc vừa xong rời danh sách). */
  const [viecMo, setViecMo] = useState<{ it: WorkItem; ds: Viec[] } | null>(null);

  /*
   * MỞ ĐÚNG ĐỢT / ĐÚNG KỸ NĂNG (R7, R8c) — cuộn một lần khi dữ liệu vừa có cho ĐÚNG cặp `dot`/`kn`
   * đang xem (đổi tham số thì cuộn lại; tải lại nền cùng tham số thì không cuộn lần hai).
   */
  useEffect(() => {
    if (!data) return;
    if (p.dot != null) {
      return cuonOnDinh(() => document.getElementById(`dot-${p.dot}`), document.getElementById('bang-ky-nang'));
    } else if (p.muc === 'ket-luan-khoa') {
      return cuonOnDinh(() => document.getElementById('ket-luan-khoa'), null);   // PR-UXF-b (Q10): việc "Đánh dấu kỳ vọng đầu ra" mở thẳng hộp Kết luận khoá
    } else if (p.kn && data.cycle) {
      const boHop = caseCategoriesFor(data.cycle.ratio ? 'ratio' : 'ielts_band', data.cycle.programmeCode);
      const mapped = anhXaKyNang(p.kn, boHop);
      if (mapped) setChonTay(mapped);
      return cuonOnDinh(() => document.getElementById('hanh-trinh-kn'), null);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data, p.dot, p.kn, p.muc]);

  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const cy = data.cycle;
  /* Lớp cho Trước / Sau: lớp đang học, em Tạm dừng thì lớp em giữ chỗ (đầu hồ sơ đọc cùng ghi danh — `dauHoSo.thongTin`). */
  const tt = data.dauHoSo?.thongTin;
  const lopTruocSau: { id: number; code: string } | null = data.currentClass ? { id: data.currentClass.id, code: data.currentClass.code }
    : data.status === 'inactive' && tt?.lopId ? { id: tt.lopId, code: tt.lop } : null;
  /* Mở đúng đợt (`?dot=`) hoặc do bấm trong trang — ngăn Case dùng chung một chỗ (Q9). */
  const ngan: OpenCase = p.caseId != null ? { caseId: p.caseId, paId: p.paId, viec: p.viec === 'thi-that' ? undefined : p.viec } : openCase;
  /* PR-TK: `?tong-ket=<cycleId>` mở ngăn Tổng kết lộ trình (Lưu trữ, hồ sơ lớp, link chia sẻ); `?viec=thi-that` (việc nhắc GVCN) mở ngăn Kết quả thi thật. */
  const xoaThamSo = (...ks: string[]) => { const next = new URLSearchParams(params); ks.forEach((k) => next.delete(k)); setParams(next, { replace: true }); };
  const moTongKet = (cid: number) => { const next = new URLSearchParams(params); next.set('tong-ket', String(cid)); setParams(next, { replace: true }); };
  /* OV-13m: `?buoc-tiep=<cycleId>` mở panel Bước tiếp (việc Chọn bước tiếp, Các lộ trình, Quay lại học sau Tạm dừng sau thi). */
  const moBuocTiep = (cid: number) => { const next = new URLSearchParams(params); next.set('buoc-tiep', String(cid)); setParams(next, { replace: true }); };
  const bt = data.buocTiep as { chon: string | null; hen: string | null; coTheChon: boolean; cycleId: number } | null;
  const tamDungSauThi = bt?.chon === 'tam_dung' && bt.coTheChon;
  const dongNgan = () => {
    setOpenCase(null);
    if (p.caseId != null) {
      const next = new URLSearchParams(params);
      next.delete('case'); next.delete('pa'); next.delete('viec');
      setParams(next, { replace: true });
    }
  };
  /*
   * Ô ĐIỂM ĐANG CHỌN (UI-HO-SO-HV, `10` mục 5): bấm ô ở đầu trang = đổi kỹ năng của Hành trình + Case & PA (về tab Học thuật nếu đang ở tab khác).
   * Chưa bấm: `?kn=` của liên kết, không thì kỹ năng có Case gấp nhất (`dauHoSo.o.hocThuat`), không thì Overall.
   */
  const rowsFt = (skillRows ?? []).filter((r) => !r.tuLopTruoc);
  const macDinh = data.dauHoSo?.o?.hocThuat?.dong?.[0]?.category as string | undefined;
  /* UI-CHART-D: `?dot=` (mở đúng lượt) → Overall, vì bảng Mock Test nay nằm ở chỗ chart khi chọn Overall. */
  /* U02 (mockup A1, PTA 03/11): FT mặc định Overall; lớp thường (không có Overall) giữ môn có Case gấp nhất. */
  const chon: ChonKn = chonTay ?? (cy?.ratio && rowsFt[0] ? (macDinh && rowsFt.some((r) => r.category === macDinh) ? macDinh : rowsFt[0].category) : OVERALL);
  const hangChon = chon === OVERALL ? null : (skillRows ?? []).find((r) => r.category === chon && !r.tuLopTruoc) ?? null;
  const tenChon = chon === OVERALL ? 'Overall' : hangChon ? dich(hangChon.label) : chon;
  const chonKn = (k: ChonKn) => { setChonTay(k); if (tab !== 'hoc-thuat') setTab('hoc-thuat'); };
  /*
   * MỞ CASE TẠI CHỖ (UI-HO-SO-HV-2, mockup M5 "GV S sau buổi học"): Case có trong cột Case & PA → đổi sang kỹ năng của Case (Overall giữ — đã có mọi Case),
   * mở đúng view (Ghi kết quả / Thêm PA / …) hoặc cuộn tới PA ngay trong cột. Case không thuộc kỹ năng nào của lộ trình (Ý thức, bàn giao) → Ngăn Case như cũ.
   */
  const moCase = (caseId: number, o?: { paId?: number; viec?: MoCot['viec'] }) => {
    const hang = tab === 'hoc-thuat' && cy ? (skillRows ?? []).find((r) => r.cases.some((c) => c.id === caseId)) : null;
    if (!hang || dienThoai) { setOpenCase({ caseId, paId: o?.paId, viec: o?.viec }); return; }
    if (chon !== OVERALL && hang.category !== chon && !hang.tuLopTruoc) setChonTay(hang.category);
    else if (chon !== OVERALL && hang.tuLopTruoc) setChonTay(OVERALL);   // Case bàn giao chỉ nằm ở Overall
    setMoCot({ caseId, paId: o?.paId, viec: o?.viec, n: Date.now() });
    if (!o?.paId || o.viec) cuonOnDinh(() => document.getElementById(`case-${caseId}`), null);
  };

  /* GD-7: em của hồ sơ — điền sẵn cho "+ Task" và panel việc. */
  const emHs = { id: data.id, ten: data.fullName, lopId: data.currentClass?.id ?? tt?.lopId ?? null, lop: data.currentClass?.code ?? tt?.lop ?? null };
  const dsViec: Viec[] = data.dauHoSo?.viec?.cuaBan ?? [];
  /**
   * Bấm một việc ở "Việc cần làm" (③ R3.2, [XM-3]): CÙNG panel việc của Công việc, nổi phải, tại hồ sơ (không nhảy tab). Việc không có panel (Báo PH → tab
   * Phối hợp, Bàn giao → trang lớp) mở như cũ.
   */
  const lamViec = (x: Viec, ds: Viec[] = dsViec) => {
    const w = viecSangPanel(x, emHs);
    if (w) { setViecMo({ it: w, ds }); return; }
    const m = x.mo;
    if (!m) return;
    if (m.loai === 'tab') navigate(duongHoSoHocVien(data.id, { tab: m.tab, sub: m.sub }));
    else if (m.loai === 'duong') navigate(m.href);
  };
  /* "Việc tiếp ›": việc kế sau việc đang mở trong danh sách lúc mở, còn trong danh sách mới và mở được tại panel. */
  const keTiep = viecMo ? viecMo.ds.slice(viecMo.ds.findIndex((x) => x.key === viecMo.it.key) + 1)
    .find((x) => dsViec.some((y) => y.key === x.key) && viecSangPanel(x, emHs)) ?? null : null;
  const daLamViec = () => { invalidate('/my-work'); invalidate(`/students/${data.id}/y-thuc`); reload(); board.reload(); yThuc.reload(); };
  /* "+ Task" (③ R3.1, K6): mục theo quyền máy chủ — Case `canReport` · Vi phạm `canRecord` · Tình hình `coTheBao` (GV báo TVV) / `coTheHoi` (TVV hỏi GVCN). */
  const mucTask = [
    ...(data.viewer.canReport ? ['case' as const] : []),
    ...(yThuc.data?.canRecord ? ['vi-pham' as const] : []),
    ...(yThuc.data?.coTheBao || yThuc.data?.coTheHoi ? ['tinh-hinh' as const] : []),
  ];
  const nutTask = (noi: 'dau' | 'noi') => mucTask.length > 0 && (
    <NutTask noi={noi} em={{ id: emHs.id, ten: emHs.ten, lopId: emHs.lopId ?? 0, lop: emHs.lop ?? '', tvv: data.tvv?.ten ?? data.consultantName ?? null }}
      muc={mucTask} hoi={!yThuc.data?.coTheBao && yThuc.data?.coTheHoi ? { gvcn: yThuc.data?.gvcn ?? null } : undefined}
      cycleId={cy?.id ?? null} phu={!!data.lopHoc?.chiXem} dauHoSo
      onMoCase={(cid, viec) => { reload(); setOpenCase({ caseId: cid, viec }); }}
      onXong={(cid) => { daLamViec(); if (cid) setOpenCase({ caseId: cid }); }} />
  );

  return (
    <div className="page space-y-4">
      {/* ══════════════════════════════════════════ A — EM NÀY LÀ AI */}
      {/*
        ĐẦU HỒ SƠ CUỘN BÌNH THƯỜNG, KHÔNG DÍNH TRÊN ĐẦU (mục 6.1).
        Một dải ghim lại chiếm chỗ vĩnh viễn ở mọi màn hình; cuộn xuống đọc bảng điểm thì
        cái cần thấy là bảng điểm.

        BỐN Ô SỐ thay cho năm đoạn chữ của bản trước. Bốn ô trả lời đúng bốn câu người ta mở
        hồ sơ để hỏi — bài gần nhất ra sao, giờ đang yếu ở đâu, còn bao nhiêu việc đang mở,
        và việc tiếp theo là gì — mỗi câu một ô, đọc được trong một cái liếc.
      */}
      <div>
        <ThanhTruocSau loai="hoc-vien" id={data.id} cha={trangCha('hoc-vien')} ten={t('Hồ sơ {ten}', { ten: data.fullName })} chiTiet={lopTruocSau?.code}
          duong={(sid) => duongHoSoHocVien(sid, { tab: p.tab })}
          dsDuPhong={lopTruocSau ? async () => {
            const r = await api.get<{ id: number; fullName: string; archived: boolean }[]>(`/classes/${lopTruocSau.id}/roster?chiId=1`);   // PR-TD2-b
            const ds = r.filter((x) => !x.archived);
            /* OV-11d (HV-24): em đang Tạm dừng vẫn giữ lớp — mở thẳng hồ sơ em vẫn có Trước · n/N · Sau (danh sách lớp chỉ có em đang học). */
            if (!ds.some((x) => x.id === data.id)) ds.push({ id: data.id, fullName: data.fullName, archived: false });
            return { ids: ds.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi')).map((x) => x.id), nhan: t('Lớp {lop}', { lop: lopTruocSau.code }) };
          } : undefined} />
        {data.lopHoc?.chiXem && (
          <DaiChiXem>{data.status === 'inactive'
            ? t('Tạm dừng · ở Lưu trữ')
            : t('Học viên đã lưu trữ{ngay}', { ngay: data.archivedAt ? ` ${ngay(data.archivedAt, homNay)}` : '' })}</DaiChiXem>
        )}
        {/*
          UI-HO-SO-HV (`dieu-chinh-cuoi.html` khu c + `ho-so-hv.html`): đầu HAI dòng, không khung — dòng 1 tên + nhãn trạng thái | + Case · ⋯ (GIỮ V4);
          dòng 2 nhãn nhỏ / giá trị đậm (Lớp · Lộ trình · Target · Tuần học · Ngày thi · GVCN · TVV); liên hệ một dòng nhỏ dưới (GIỮ OV-10b).
          Câu tóm tắt máy viết + bốn ô (PR-VAI-b) BỎ — số ở ô điểm to, việc ở thanh Việc cần làm (truy vết `ho-so-hv` mục 2).
        */}
        <header className="mt-1.5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="m-0 flex flex-wrap items-center gap-2 text-xl font-bold leading-tight text-slate-100">
              {data.fullName}
              <MissingBadge items={data.missing} />
              {/* P7 (k6): em Tạm dừng ở Lưu trữ — "Tạm dừng 14/09 · Có thể quay lại"; em Kết thúc học — "Kết thúc học 22/08". */}
              {data.status === 'inactive' && data.archivedAt ? <Info>{t('Tạm dừng {ngay} · Có thể quay lại', { ngay: ngay(data.archivedAt, homNay) })}</Info>
                : data.status === 'finished' && data.finishedAt ? <Info>{t('Kết thúc học {ngay}', { ngay: ngay(data.finishedAt, homNay) })}</Info>
                  : data.status !== 'active' && <Info>{studentStatusLabel(data.status)}</Info>}
              {data.archivedAt && data.status === 'active' && <Info>{t('Đã lưu trữ')}</Info>}
              {/* OV-13q: "Đã thi · chờ kết quả · hạn …" / "Đã xong · chờ bước tiếp · hạn …" thay nhãn "Đã xong" khi còn việc sau thi. */}
              {data.sauThi ? <NhanSauThi s={data.sauThi} /> : bt && (!bt.chon || bt.hen) && <Nhan tone="ok">{CHU_DA_XONG}</Nhan>}
              {data.sauThi?.coTheGiaHan && (
                <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" onClick={() => setGiaHan(true)}>{t('Gia hạn')}</button>
              )}
            </h1>
            {/* ml-auto: xuống dòng ở 375 thì nút vẫn bám phải — menu ⋯ (mở về bên trái) không tràn khỏi màn. */}
            <div className="ml-auto flex flex-wrap items-start gap-2">
              {/* GD-7 (③ R3.1, [XM-2]): "+ Task" (Case · Vi phạm / Nhắc nhở · Tình hình học tập) thay "+ Case" — em điền sẵn, không bước chọn em.
                  RKC (mở Q-B1): em Lưu trữ vẫn có (nút thường — [XM-5]). 375: nút tròn nổi (K8). */}
              {nutTask('dau')}
              {/* ⋮ = MENU THẢ; mỗi mục mở THẲNG panel của việc đó (Q10). Không có quyền nào → MenuDong không vẽ gì. OV-10b: TVV / CX / Admin — cùng các mục thành nút. */}
              {(() => {
                const muc = mucQuanLyHocVien({
                  canEdit: data.viewer.canEdit, suaThongTin: !!data.viewer.coTheSuaThongTin, suaThem: !!data.viewer.coTheSuaThem, nhapThiThat: !!data.viewer.coTheNhapThiThat, lopHoc: data.lopHoc ?? null, cycle: cy, status: data.status, coTheXoa: !!data.viewer.coTheXoa,
                  deXuatSua: !!data.viewer.coTheDeXuatSua, buocTiep: !!bt?.chon && bt.coTheChon,
                });
                /* #9 (G4-10): "Bước tiếp…" mở thẳng panel Bước tiếp đã chọn (xem / đổi / Hoàn tác) — cùng `?buoc-tiep=` của việc Chọn bước tiếp. */
                const mo = (k: typeof muc[number]['key']) => (k === 'lo-trinh' ? setPlanOpen(true) : k === 'buoc-tiep' ? moBuocTiep(bt!.cycleId) : setViecQuanLy(k));
                /* P7 (k6): hồ sơ lưu trữ — "Quay lại học" là nút chính đầu hồ sơ, không nằm trong ⋯. */
                const nutQuayLai = data.lopHoc?.chiXem && muc.some((m) => m.key === 'quay-lai')
                  ? <button type="button" className={`${NUT_DAU_HO_SO} btn-primary`} onClick={() => mo('quay-lai')}>{t('Quay lại học')}</button> : null;
                const conLai = nutQuayLai ? muc.filter((m) => m.key !== 'quay-lai') : muc;
                return <>{nutQuayLai}{vaiXem ? conLai.map((m) => (
                  <button key={m.key} type="button" className={NUT_DAU_HO_SO} title={m.phu} onClick={() => mo(m.key)}>{m.nhan}</button>
                )) : conLai.length > 0 && (
                  <MenuDong lopNut={NUT_BA_CHAM} muc={conLai.map((m) => ({
                    key: m.key, nhan: m.nhan, nguyHiem: m.nguyHiem, keTruoc: m.keTruoc, goi: m.phu, onChon: () => mo(m.key),
                  }))} />
                )}</>;
              })()}
            </div>
          </div>
          {data.archivedAt ? <TomTatLuuTru studentId={data.id} target={cy?.target ?? null} kck={!!cy?.khongCamKet} ketThuc={data.finishedAt ?? null} />
            : <DongThongTin tt={data.dauHoSo.thongTin} tvv={data.tvv?.ten ?? data.consultantName} mon={cy?.monHoc ?? null}
              /* L6 / 2.3 (chủ SP 13/11) · ③ K5: GV lớp (không sửa thẳng Target) — nhắc + "Đề xuất sửa" ở ô Target, thay việc "Điền Target" (không vào số việc). */
              deXuatTarget={data.viewer.coTheDeXuatSua && data.missing?.some((m: { key: string }) => m.key === 'target') ? () => setViecQuanLy('de-xuat-sua') : undefined} />}
          <DongLienHe l={data.lienHe} email={data.email} dob={data.dob} />
        </header>
      </div>

      {/* PR-VAI-b (T65, mockup 24 D1): dải vàng Tạm dừng — đọc TRƯỚC bốn ô vì nó đổi nghĩa mọi con số bên dưới. */}
      <DaiTamDung tamDung={data.dauHoSo.thongTin.tamDung}
        onQuayLai={data.status !== 'inactive' || data.lopHoc?.chiXem ? undefined : tamDungSauThi ? () => setQuayLaiBt(true)
          : data.lopHoc?.quyen?.quayLai ? () => setViecQuanLy('quay-lai') : undefined} />

      {/* PR-CT (mockup 20 — E): dải Sắp chuyển / Đã chuyển ngay dưới dòng thông tin đầu trang; nút theo vai do máy chủ quyết. */}
      <DaiHocVienChuyen dai={data.dai ?? null} homNay={homNay}
        onLam={(k) => {
          const d = data.dai;
          /* #8 (G4-08): huỷ thẳng tại dải + Hoàn tác — không mở lại panel, không hỏi lý do. */
          if (k === 'huy-lenh') { huyQuyetDinhNgay(toast, d.lenhId, data.id, reload).catch((e: any) => toast.push('error', e?.message ?? t('Không lưu được — thử lại.'))); return; }
          /* BAN-GIAO-NHAN (chủ SP 05/11): đọc phiếu tại hồ sơ — trang lớp cũ 403 với GV lớp mới không dạy lớp cũ. */
          if (k === 'doc-ban-giao') { const n = new URLSearchParams(params); n.set('ban-giao', String(d.lenhId)); setParams(n, { replace: true }); return; }
          navigate(`/hoc-vien/lop/${d.lopNguon.id}?viec=ban-giao&lenh=${d.lenhId}${k === 'ban-giao-mon' && d.mon ? `&mon=${d.mon.ma}` : ''}`);
        }} />

      {/* P9a: dải vàng Xét lại lộ trình (QL quyết · GVCN lớp đang học xem) — panel một em tại trang. */}
      {data.currentClass && <DaiXetLai classId={data.currentClass.id} studentId={data.id} />}

      {/* UI-HO-SO-HV: ô điểm to Overall · L · R · W1 · W2 · S — bấm đổi kỹ năng của Hành trình + Case & PA (khu c `.diem-dau`). */}
      {cy && skillRows && <DiemDau rows={skillRows} attempts={data.attempts} ketQuaId={data.dauHoSo?.o?.ketQua?.kq?.attemptId ?? null} chon={chon} onChon={chonKn} homNay={homNay} mon={cy.monDangKy ?? null}
        thi={homNay && !cy.ratio ? thiThatCua(cy as LoTrinhD, homNay) : null} />}

      {/* UI-HO-SO-HV: thanh Việc cần làm — chỗ DUY NHẤT có việc; bấm = mở đúng chỗ làm ngay tại trang. */}
      <ThanhViec viec={data.dauHoSo.viec} onLam={(x) => lamViec(x)} dangMo={viecMo?.it.key ?? null} />
      {/* PR-VAI-b (V1/K3-47): Quản lý duyệt ngay trong hồ sơ — chỗ của thanh việc (Quản lý không có việc học thuật với em). */}
      {data.viewer.coTheDuyet && <DaiChoDuyet studentId={data.id} homNay={homNay} onDoi={reload} onThemPa={(caseId) => setOpenCase({ caseId, viec: 'them-pa' })} />}

      {/*
        BA TAB NGAY DƯỚI ĐẦU TRANG (D2, spec 2026-09-22): Học thuật (mặc định) · Ý thức & Phối hợp · Hành trình.
        Tab nhớ qua địa chỉ `?tab=` (A6) để Việc cần làm / hồ sơ lớp mở thẳng đúng tab — không nhớ bằng localStorage.
        Không có lộ trình thì chỉ tab Học thuật trống; tab Ý thức và Hành trình vẫn mở được (J8).
      */}
      <HangTab panelId="hshv-vung" ariaLabel={t('Nội dung hồ sơ học viên')} value={tab} onChange={setTab}
        tabs={[
          { key: 'hoc-thuat', label: HO_SO_TAB_LABEL['hoc-thuat'] },
          /* GD-7 (③ K1 / K4, V22): bỏ chấm cảnh báo ở tab — việc Ý thức của người xem đã ở "Việc cần làm" (đỏ khi quá hạn). */
          { key: 'y-thuc', label: HO_SO_TAB_LABEL['y-thuc'] },
          { key: 'hanh-trinh', label: HO_SO_TAB_LABEL['hanh-trinh'] },
        ]} />

      {/* DON-NHO-3 (TAB-A11Y): vùng tab cùng space-y-4 của trang → khoảng cách không đổi. */}
      <div id="hshv-vung" role="tabpanel" aria-label={HO_SO_TAB_LABEL[tab]} className="space-y-4">
        {tab === 'hoc-thuat' && (!cy ? (
          <Empty title={t('Học viên chưa có lộ trình nào')} hint={t('Mở lộ trình để bắt đầu theo dõi Target và các mốc đánh giá.')} />
        ) : (
          <>
            {/*
              KHỐI CHÍNH CỦA HỒ SƠ (mục 4.2). Bấm một hàng thì nội dung mở ra NGAY DƯỚI hàng
              đó — biểu đồ của chính kỹ năng ấy, các Case đang mở, lịch sử đã kết thúc.

              Khối "Case và kết quả hỗ trợ" tách riêng ở dưới đã BỎ: nó kể lại đúng những Case
              mà bảng này vừa tóm tắt, nên cùng một Case hiện hai lần trên một trang, và bấm
              một hàng ở đây thì phải cuộn xuống chỗ khác mới thấy kết quả.
            */}
            {/* PR-LT2b (M-05): ô Mini Test ở đầu tab (lộ trình mới có bổ trợ miễn phí) · hộp Kết luận khoá (lớp thường đã có điểm Cuối khoá). */}
            {data.miniTest && <MiniTestO mt={data.miniTest} onGhi={(caseId, paId) => setOpenCase({ caseId, paId, viec: 'ghi-ket-qua' })} />}
            {data.cuoiKhoa && (data.cuoiKhoa.scored > 0 || data.cuoiKhoa.lenFt) && (
              <KetLuanKhoa studentId={data.id} studentName={data.fullName} lop={data.cuoiKhoa.lop ?? data.currentClass?.code ?? null} classId={data.currentClass?.id ?? null} ct={data.cuoiKhoa.ct ?? cy.programmeCode ?? null}
                cuoiKhoa={data.cuoiKhoa} coTheKetLuan={!!data.viewer?.coTheKetLuan} onDoi={reload} />
            )}
            {/*
              HÀNH TRÌNH THEO KỸ NĂNG ĐANG CHỌN (UI-CHART-D, mockup M5): kỹ năng → chart D | Bảng (`HanhTrinhKn`); Overall (FT) → bảng Mock Test ĐẶT CHỖ CHART
              + hàng Thi thật cuối, nổi nhất (chủ SP 27/10). Tiến độ trên lớp vẫn dưới, thang riêng, không vào MT.
            */}
            <section id="hanh-trinh-kn" className="card overflow-hidden" aria-label={chon === OVERALL && !cy.ratio ? 'Mock Test' : t('Hành trình · {kn}', { kn: tenChon })}>
              {chon === OVERALL && !cy.ratio ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
                    <h2 className="m-0 text-[17px] font-bold text-slate-100">Mock Test</h2>
                    <NutLuat label={t('Cách đọc bảng Mock Test')}>{t('Điểm tô theo kỳ vọng của chính lượt · hàng cuối là thi thật — kết quả cuối của lộ trình, so Target.')}</NutLuat>
                  </div>
                  <KhoiMockTest cy={cy} ten={data.fullName} attempts={data.attempts} dotId={p.dot} homNay={homNay} onOpen={(a) => navigate(attemptHref(a))} />
                </>
              ) : board.error ? <div className="p-4"><ErrorState message={board.error.message} hint={board.error.hint} status={board.error.status} onRetry={board.reload} /></div>
                : !skillRows ? <div className="p-4"><Skeleton rows={4} /></div>
                : homNay && <HanhTrinhKn studentId={data.id} kn={chon} row={hangChon} attempts={data.attempts} cy={cy} homNay={homNay} tenKn={tenChon}
                  tamDung={data.dauHoSo?.thongTin?.khoangDung} onMoCase={(caseId, paId) => moCase(caseId, { paId })} toTuan={toTuan} />}
            </section>

            {/*
              HAI CỘT DƯỚI HÀNH TRÌNH (UI-HO-SO-HV-2, mockup M5): trái Tiến độ trên lớp (form ghi / sửa / xoá trong cột, Hoàn tác, góp ý tuần khoá đọc) · phải
              Case & PA của kỹ năng đang chọn (Overall: mọi Case) — khối Case A của M6, form tại chỗ. 375: xếp dọc. Bỏ panel Ghi tiến độ cũ.
            */}
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              {/* U02 dòng 16: 375 xếp dọc — Case trước (việc trước), Tiến độ sau; ≥ 1024 hai cột trái Tiến độ | phải Case. */}
              {homNay && <div className="order-2 min-w-0 lg:order-1"><TienDoTrenLop studentId={data.id} lopNay={data.currentClass?.id ?? null} chon={chon} ct={cy.programmeCode ?? null} homNay={homNay} onRe={setToTuan}
                kns={rowsFt.map((r) => r.category)} tenKn={tenChon} /></div>}
              <div className="order-1 min-w-0 lg:order-2">
              {board.error ? <div className="card p-4"><ErrorState message={board.error.message} hint={board.error.hint} status={board.error.status} onRetry={board.reload} /></div>
                : !skillRows ? <div className="card p-4"><Skeleton rows={4} /></div>
                : <CotCaseHv rows={hangChon ? [hangChon] : skillRows} tenKn={tenChon} mo={moCot} hocVien={data.fullName} lop={data.currentClass?.code}
                  onReport={data.viewer.canReport ? baoCase : undefined} onMoNgan={(caseId) => setOpenCase({ caseId })}
                  onChanged={() => { board.reload(); reload(); }} />}
              </div>
            </div>

            {/*
              TÊN KHỐI GỌI ĐÚNG THEO CHƯƠNG TRÌNH (mục 7.11): lớp thường là "Kết quả Test" (cuối tab). FT: bảng Mock Test nay ở chỗ chart khi chọn Overall (UI-CHART-D).
            */}
            {cy.ratio && (
              <Card title={t('Kết quả Test')} bodyClass="p-0">
                {data.attempts.length === 0 ? (
                  <div className="p-4"><Empty title={t('Chưa có lượt đánh giá nào trong lộ trình này')} /></div>
                ) : <RatioAttempts attempts={data.attempts} dotId={p.dot} homNay={homNay} ct={cy.programmeCode ?? null} onOpen={(a) => navigate(attemptHref(a))} />}
                <GhiChuLoTrinh cy={cy} homNay={homNay} />
              </Card>
            )}
          </>
        ))}

        {tab === 'y-thuc' && (
          /* UI-Y-THUC-HV: các khối của tab tự là thẻ (mockup v7) — không bọc thêm một thẻ ngoài (thẻ lồng thẻ). */
          <StudentYThucSection studentId={data.id} thuong={!!cy?.ratio} onGoAcademic={() => setTab('hoc-thuat')} />
        )}

        {tab === 'hanh-trinh' && <CacLoTrinh studentId={data.id} onTongKet={moTongKet} onBuocTiep={moBuocTiep} onHocThuat={() => setTab('hoc-thuat')} />}

        {tab === 'hanh-trinh' && (
          <Card title={t('Hành trình học tập')} bodyClass="p-4 space-y-4">
            {/*
              TRỤC TUẦN THEO LỊCH THẬT, MỖI GIAI ĐOẠN MỘT TRỤC (§3.8, PR-Qb) — thay dòng thời gian
              cũ vẽ lại đúng biểu đồ điểm đã có ở khối trên. Tự gọi máy chủ riêng theo giai đoạn
              đang chọn, chỉ khi tab này đang mở.
            */}
            {/* PR-VAI-b: chương theo lớp (thay Lịch sử lớp) + trục tuần — một đường `/hanh-trinh`. */}
            <HanhTrinh studentId={data.id} active={tab === 'hanh-trinh'}
              onOpenCase={(caseId, paId) => setOpenCase({ caseId, paId })} />
          </Card>
        )}
      </div>

      {/* ============================================== hộp thoại */}
      {/* PR-DL: `?mo=lo-trinh` (bảng điểm theo lượt, em chưa có lịch MT) mở sẵn panel; đóng thì bỏ tham số. */}
      {(planOpen || p.mo === 'lo-trinh') && cy && (
        <StudentPlanPanel
          cycleId={cy.id}
          studentName={data.fullName}
          ratio={!!cy.ratio}
          onSuaThongTin={data.viewer.canEdit ? () => { dongPlan(); setViecQuanLy('info'); } : undefined}
          onClose={dongPlan}
          onDone={reload}
        />
      )}

      <QuickReport open={reportOpen} kyNangDau={kyNangDau} onClose={() => { setReportOpen(false); setKyNangDau(null); }}
        studentId={data.id} studentName={data.fullName} lop={data.currentClass?.code} cycleId={cy?.id ?? null}
        onDone={(cid) => { reload(); setOpenCase({ caseId: cid }); }}
        onMoCase={(cid, viec) => { reload(); setOpenCase({ caseId: cid, viec }); }} />

      {/* Ngăn Case (Q9) — không đổi tab; cuộn tới đúng PA khi mở kèm `paId`. Mở do `?case=` thì đóng cũng xoá URL. */}
      {ngan && (
        <NganCase caseId={ngan.caseId} paId={ngan.paId} viec={ngan.viec} hocVien={data.fullName} lop={data.currentClass?.code}
          onClose={dongNgan} onChanged={reload} />
      )}

      {/* GD-7: panel việc của Công việc, tại hồ sơ — lưu xong tải lại hồ sơ + bảng kỹ năng (thanh việc, cột Case cùng nguồn). */}
      {viecMo && <PanelViec key={viecMo.it.key} it={viecMo.it} onDong={() => setViecMo(null)} onDaLam={daLamViec}
        onTiep={keTiep ? () => lamViec(keTiep, viecMo.ds) : null} />}
      {!viecMo && !ngan && nutTask('noi')}

      {giaHan && data.sauThi && (
        <HopGiaHan x={{ cycleId: data.sauThi.cycleId, han: data.sauThi.han, daGiaHan: data.sauThi.daGiaHan }} hocVien={data.fullName} lop={lopTruocSau?.code ?? null}
          onClose={() => setGiaHan(false)} onDone={reload} />
      )}
      {p.banGiao != null && <BanGiaoPanel docLenh={p.banGiao} onClose={() => xoaThamSo('ban-giao')} onDone={() => {}} />}
      {p.tongKet != null && <NganTongKet cycleId={p.tongKet} onClose={() => xoaThamSo('tong-ket')} onDoi={reload} />}
      {(p.buocTiep != null || quayLaiBt) && (
        <PanelBuocTiep cycleId={p.buocTiep ?? bt!.cycleId} hocVien={{ id: data.id, ten: data.fullName }} lop={lopTruocSau?.code ?? null}
          chonSan={quayLaiBt ? 'lo_trinh_moi' : undefined} onDone={reload}
          onClose={() => { setQuayLaiBt(false); if (p.buocTiep != null) xoaThamSo('buoc-tiep'); }} />
      )}

      <StudentManagePanel
        viec={viecQuanLy ?? (p.viec === 'thi-that' && cy?.route ? 'outcome' : null)} onClose={() => { setViecQuanLy(null); if (p.viec === 'thi-that') xoaThamSo('viec'); }} lop={data.currentClass?.code}
        student={thongTinEmCua(data)} quyen={data.viewer} lopHoc={data.lopHoc ?? null}
        cycle={cy} attempts={data.attempts} onDone={reload} soViPhamMo={data.dauHoSo?.soViPhamMo}
        onDeXuatSua={data.viewer.coTheDeXuatSua ? () => setViecQuanLy('de-xuat-sua') : undefined} onDoiViec={setViecQuanLy}
      />
    </div>
  );
}

// ==================================================================== khối nhỏ

/**
 * Chip lịch sử + nhãn nhỏ cạnh tên lượt (đã huỷ · huỷ phần · dời …) — tối đa hai, còn lại "+n" có tooltip. Dùng chung bảng Mock
 * Test và bảng lớp thường (PR-U12), cả bảng máy tính lẫn thẻ điện thoại.
 */
function NhanDot({ a, ct = null }: {
  a: { lichSu?: boolean; status?: string; huyPhan?: boolean; doiKyNang?: string[] };
  /** Mã chương trình lớp thường — tên môn trong nhãn "dời" (FOU G+V …); bỏ trống = kỹ năng IELTS. */
  ct?: string | null;
}) {
  const nhan = [
    ...(a.status === 'cancelled' ? [{ chu: t('đã huỷ'), title: t('Lượt này đã huỷ.') }] : []),
    /* HSL-GON (chủ SP 05/11): "huỷ phần" / "dời S" là ghi chú lịch — chỉ ở màn Test (hồ sơ MT, Lịch Test); hồ sơ HV giữ "đã huỷ" (trạng thái cả lượt). */
  ];
  const toiDa = a.lichSu ? 1 : 2;
  return (
    <>
      {nhan.slice(0, toiDa).map((x) => (
        <span key={x.chu} title={x.title}
          className="ml-1 inline-flex items-center whitespace-nowrap rounded border border-muted-line px-[5px] align-middle text-[12px] leading-4 text-muted">
          {x.chu}
        </span>
      ))}
      {nhan.length > toiDa && (
        <span className="ml-1 text-[12px] text-muted" title={nhan.slice(toiDa).map((x) => x.title).join(' ')}>
          +{nhan.length - toiDa}
        </span>
      )}
    </>
  );
}

/**
 * KHỐI MOCK TEST KHI CHỌN OVERALL (UI-CHART-D, chủ SP 27/10): bảng Mock Test như web đang có, đặt chỗ chart, + hàng Thi thật cuối, nổi nhất
 * (kết quả cuối của lộ trình, so Target). Ghi chú Target đã đổi / kết luận / đầu vào giữ dưới bảng.
 */
function KhoiMockTest({ cy, ten, attempts, dotId, homNay, onOpen }: { cy: any; ten: string; attempts: any[]; dotId?: number; homNay: string | null; onOpen: (a: any) => void }) {
  const th = homNay ? thiThatCua(cy as LoTrinhD, homNay) : null;
  return (
    <>
      {attempts.length === 0 && !th ? <div className="p-4"><Empty title={t('Chưa có lượt đánh giá nào trong lộ trình này')} /></div> : <>
        {/* Tăng dần như mockup M5: đọc cùng chiều chart, Thi thật là hàng cuối (kết quả cuối của lộ trình). */}
        <IeltsAttempts attempts={[...attempts].sort((x, y) => (x.weekStart ?? '9999').localeCompare(y.weekStart ?? '9999') || x.attemptNo - y.attemptNo)} dotId={dotId} homNay={homNay} onOpen={onOpen} thi={th} cycleId={cy.id} ten={ten} />
      </>}
      <GhiChuLoTrinh cy={cy} homNay={homNay} />
    </>
  );
}

/** Dưới bảng Mock Test / Kết quả Test: Target đã đổi · kết luận lộ trình · chưa ghi điểm đầu vào (giữ nguyên chữ cũ). */
function GhiChuLoTrinh({ cy, homNay }: { cy: any; homNay: string | null }) {
  return (
    <div className="p-3">
      {cy.targetRevisions.length > 0 && (
        <p className="text-xs text-slate-500 mt-2 mb-0">
          {t('Target đã đổi {n} lần — lần gần nhất {tuan}:', { n: cy.targetRevisions.length, tuan: tuanLich(cy.targetRevisions[0].effectiveFrom, homNay) })}
          {' '}<TargetText band={cy.targetRevisions[0].oldTarget} kck={cy.targetRevisions[0].oldKck} kyThi={cy.kyThi} /> → <TargetText band={cy.targetRevisions[0].newTarget} kck={cy.targetRevisions[0].newKck} kyThi={cy.kyThi} />
          {cy.targetRevisions[0].reason && ` (${cy.targetRevisions[0].reason})`}.
          {' '}{t('Các lượt đã chốt vẫn giữ kỳ vọng tính theo Target lúc đó.')}
        </p>
      )}
      {cy.outcome && (
        <p className="text-sm text-slate-200 mt-2 mb-0">
          {t('Kết luận lộ trình:')} <strong>{dich(cy.outcome.label)}</strong>
          {cy.outcome.score !== null && ` · ${fmtBand(cy.outcome.score)}`}
          {cy.outcome.note && <span className="text-slate-400"> — {cy.outcome.note}</span>}
        </p>
      )}
      {!cy.baseline && !cy.ratio && (
        <p className="text-xs text-slate-500 mt-2 mb-0">{t('Chưa ghi điểm đầu vào.')}</p>
      )}
    </div>
  );
}

/**
 * Ô Kết quả một lượt ở bảng Mock Test hồ sơ (U02, UA-Q4 — bỏ nhãn "Đủ điểm"): đủ điểm + đạt → "✓ Đạt kỳ vọng"; đủ điểm + SOS → chip SOS kèm kỹ năng dưới
 * kỳ vọng ("SOS 3 · L, W, S"); còn lại (thiếu điểm, KCK…) giữ `KetQuaDot`.
 */
function KetQuaMt({ a, gon = false }: { a: any; /** 375: "✓ Đạt", chip SOS không kèm kỹ năng. */ gon?: boolean }) {
  const du = a.scored >= a.required && a.evaluable && !a.kckDuoi;
  if (du && a.sosLevel === 0) return gon ? <span className="inline-flex items-center whitespace-nowrap rounded border border-doing-line px-2 py-0.5 text-xs font-semibold text-kq-bang">✓ {t('Đạt')}</span>
    : <KetQuaDot phan="overall" coDiem={a.scored} yeuCau={a.required} dat sos={0} chot={a.chot} />;
  if (du && gon && a.sosLevel > 0) return <ChipSos muc={a.sosLevel} dot={`MT${a.attemptNo}`} hienKyNang={false} />;
  if (du && a.sosLevel > 0 && a.expectation != null) {
    const duoi = (['listening', 'reading', 'writing', 'speaking'] as const).filter((k) => a.bands?.[k] != null && a.bands[k] < a.expectation).map((k) => CHU_KY_NANG[k === 'writing' ? 'writing1' : k].slice(0, 1));
    return <ChipSos muc={a.sosLevel} kyNang={duoi} dot={`MT${a.attemptNo}`} />;
  }
  return <KetQuaDot coDiem={a.scored} yeuCau={a.required} dat={a.evaluable ? a.sosLevel === 0 : null} sos={a.sosLevel ?? null} chot={a.chot} kckDuoi={a.kckDuoi} />;
}

/** Kết quả của hàng Thi thật: Đạt Target / Chưa đạt Target · −0.5 (OVR so Target lúc nhập) · đã thi chờ KQ · chưa thi · không thi. */
function KetQuaThi({ th }: { th: ThiThatD | 'khong' }) {
  if (th === 'khong') return <span className="text-slate-300">{t('Không thi')}</span>;
  if (th.loai === 'cho') return <NhanLich loai="da-thi">{t('Đã thi · chờ KQ')}</NhanLich>;
  if (th.loai === 'du-kien') return <span className="text-slate-400">{t('chưa thi')}</span>;
  const { ovr } = th.diem, tg = th.target;
  if (ovr == null || tg == null) return null;
  return ovr >= tg ? <span className="font-bold text-kq-bang">✓ {t('Đạt Target')}</span>
    : <span className="font-bold text-kq-duoi">✗ {t('Chưa đạt Target')} · −{fmtBand(tg - ovr)}</span>;
}

/** Chữ cái kỹ năng ở dòng Điểm của thẻ điện thoại (cùng chữ với đầu cột bảng). */
const CHU_KY_NANG = { listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', speaking: 'S' } as const;
/** UI-CHART-D (mockup M5): bảng Mock Test tách W1 | W2 cho khớp ô điểm đầu trang (điểm từng ô `diemKn`); thi thật W một số. */
const KN_MOCK = ['listening', 'reading', 'writing1', 'writing2', 'speaking'] as const;

/**
 * BẢNG MOCK TEST của hồ sơ HV (F8, K4-33). Nằm ở: Học viên & Lớp › hồ sơ học viên › tab Học thuật › khối "Mock Test".
 *
 * MỘT cột Kết quả (`KetQuaDot` — nói tiến độ lẫn kết luận một lần, không "Đã lên lịch" + "Chờ n kỹ năng" + "mới 2/4"). Số căn
 * phải. Ô MT{n} là liên kết (Tab vào được); cả hàng vẫn bấm được. Nhãn nhỏ cạnh MT: lịch sử · đã huỷ · huỷ phần · dời S —
 * tối đa hai, còn lại "+n" có tooltip.
 */
function IeltsAttempts({ attempts, dotId, homNay, onOpen, thi = null, cycleId, ten }: {
  attempts: any[]; dotId?: number; homNay: string | null; onOpen: (a: any) => void; cycleId: number; ten: string;
  /** UI-CHART-D: hàng Thi thật cuối bảng (null = chưa có kế hoạch thi). */
  thi?: ThiThatD | 'khong' | null;
}) {
  const thiKq = thi && thi !== 'khong' && thi.loai === 'kq' ? thi : null;
  const diemThi = (k: 'l' | 'r' | 'w' | 's' | 'ovr') => (thiKq?.diem[k] != null ? <DiemKq diem={thiKq.diem[k]!} kyVong={thiKq.target} /> : '—');
  /* TL-GV (v20): điểm kỹ năng thi thật = ô hộp → hộp Tuần dạy (GV · số tuần · %). OVR có đủ L R W S cạnh → chữ thường. */
  const oThi = (k: 'l' | 'r' | 'w' | 's') => (thiKq?.diem[k] != null
    ? <OTuanDay kn={k} cycleId={cycleId} ten={ten} diem={thiKq.diem} target={thiKq.target} nhan={`${k.toUpperCase()} ${thiKq.diem[k]}`}>{diemThi(k)}</OTuanDay> : diemThi(k));
  const ngayThi = !thi || thi === 'khong' ? '—' : thi.loai === 'du-kien' ? t('dự kiến {thang}', { thang: thi.nhan }) : thi.nhan;
  const dienThoai = useDienThoai();
  /* U02 dòng 14 (rỗng ≠ thiếu ≠ chưa tới): lượt chưa tới tuần, chưa điểm nào → một ô "Chưa tới tuần" thay sáu "—". */
  const chuaToi = (a: any) => !a.scored && !!a.weekStart && !!homNay && a.weekStart > homNay;
  /* G12: số điểm tô ✓ / ✗ theo kỳ vọng của lượt (như lưới lớp), không màu link. G5: điểm một kỹ năng mở hồ sơ Mock cuộn tới đúng kỹ năng (Tab vào được; hàng bảng vẫn bấm mở đợt). */
  const diemKyNang = (a: any, k: typeof KN_MOCK[number]) => {
    /* PTA 12/11: W1 · W2 qua `diemW12` như Tổng kết lộ trình — lượt cũ chỉ có W gộp → W ở cả hai ô. */
    const w = k === 'writing1' || k === 'writing2', kd = w ? 'writing' : k;
    const b = w ? diemW12((x) => (x === 'writing' ? a.bands?.writing : a.diemKn?.[x]))[k === 'writing1' ? 'w1' : 'w2'] : a.bands?.[k] ?? null;
    return b != null
      ? <Link to={duongDotTest(a, kd)} className={`no-underline hover:underline ${dienThoai ? '-mx-1.5 -my-3.5 inline-block px-1.5 py-3.5' : ''}`} title={`${t('Mở Hồ sơ Mock Test')} · MT${a.attemptNo} · ${w ? CHU_KY_NANG[k] : skillLabel(kd)}`} onClick={(e) => e.stopPropagation()}><DiemKq diem={b} kyVong={a.expectation} /></Link>
      : fmtBand(b);
  };
  /*
   * ĐIỆN THOẠI (PR-UXD Q9): mỗi lượt MỘT thẻ — đầu thẻ `MT2 · W3 SEP` + Kết quả bên phải (tầng 1), rồi Điểm L R W S · Overall · Kỳ vọng ·
   * Lớp (tầng 3, cuối). Cùng trường `a.*` và cùng link `attemptHref` / `duongDotTest` với bảng — đổi bảng thì đổi thẻ.
   */
  /*
   * GD-7 (③ K8a `.mt-dong`): điện thoại mỗi lượt hai dòng — "MTn › · tuần" + Kết quả bên phải; dòng điểm từng kỹ năng đã có ("R ✓6.5 W1 ✓6.0 …") rồi
   * OVR (chưa có OVR → "kỳ vọng 6.0"). Lượt chưa tới tuần: chỉ "kỳ vọng" bên phải, không dòng điểm. Cùng ô điểm / link với bảng 1440.
   */
  if (dienThoai) {
    const coDiem = (a: any, k: typeof KN_MOCK[number]) => (k === 'writing1' || k === 'writing2' ? a.bands?.writing != null || a.diemKn?.[k === 'writing1' ? 'w1' : 'w2'] != null : a.bands?.[k] != null);
    return (
      <div>
        {attempts.map((a) => (
          <div key={a.id} id={`dot-${a.id}`} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 border-t px-3 py-1.5 text-[14px] first:border-t-0 ${a.id === dotId ? 'bg-[color:var(--accent-soft)]' : ''}`}
            style={{ borderColor: 'var(--line)' }}>
            <span className="flex min-w-0 items-center gap-2 whitespace-nowrap"><Link to={attemptHref(a)} className="link inline-flex min-h-[44px] items-center font-semibold tabular-nums">MT{a.attemptNo} ›</Link><NhanDot a={a} />
              <span className="text-[13px] font-medium tabular-nums text-slate-400">{a.weekStart ? tuanLich(a.weekStart, homNay) : t('Chưa có tuần')}</span></span>
            <span className="justify-self-end">{chuaToi(a)
              ? <span className="text-[13px] tabular-nums text-faint">{t('kỳ vọng {kv}', { kv: fmtBand(a.expectation) })}</span>
              : <KetQuaMt a={a} gon />}</span>
            {!chuaToi(a) && (
              <span className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 pb-1.5 text-[13px] tabular-nums text-slate-400">
                {KN_MOCK.filter((k) => coDiem(a, k)).map((k) => <span key={k} className="whitespace-nowrap">{CHU_KY_NANG[k]} {diemKyNang(a, k)}</span>)}
                {a.overall != null
                  ? <span className="whitespace-nowrap">OVR <DiemKq diem={a.overall} kyVong={a.expectation} /></span>
                  : <span className="whitespace-nowrap">{t('kỳ vọng {kv}', { kv: fmtBand(a.expectation) })}</span>}
              </span>
            )}
          </div>
        ))}
        {thi && (
          <TheDong className="hang-thi-that" dau={(
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><b>{t('Thi thật')}</b><div className="text-xs text-slate-400">{ngayThi}</div></div>
              <div className="shrink-0 text-right"><KetQuaThi th={thi} /></div>
            </div>
          )}
          dong={thiKq ? [
            { nhan: t('Điểm'), noiDung: <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">{(['l', 'r', 'w', 's'] as const).map((k) => <span key={k} className="inline-flex items-center gap-1 whitespace-nowrap"><span className="text-[13px] text-slate-500">{k.toUpperCase()}</span>{oThi(k)}</span>)}</span> },
            { nhan: 'Overall', noiDung: diemThi('ovr') },
            { nhan: 'Target', noiDung: fmtBand(thiKq.target) },
          ] : []} />
        )}
      </div>
    );
  }
  const so = 'td text-right tabular-nums';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr>
            <Th hint={t('Số thứ tự lượt Mock Test trong lộ trình này.')}>MT</Th>
            <Th hint={t('Lớp em học VÀO LÚC làm bài này — chuyển lớp không viết lại lịch sử.')}>{t('Lớp lúc đánh giá')}</Th>
            <Th hint={t('Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.')}>{t('Tuần')}</Th>
            <Th align="right" hint="Band Listening">L</Th><Th align="right" hint="Band Reading">R</Th>
            <Th align="right" hint="Band Writing Task 1">W1</Th><Th align="right" hint="Band Writing Task 2">W2</Th><Th align="right" hint="Band Speaking">S</Th>
            <Th align="right" hint={t('Band tổng của lượt, tính theo quy tắc IELTS. Thiếu một kỹ năng thì chưa có Overall.')}>OVR</Th>
            <Th align="right" hint={t('Mức mong đợi của chính đợt Test đó, tính theo Target tại thời điểm ấy. Đổi Target không chấm lại quá khứ.')}>{t('Kỳ vọng')}</Th>
            <Th hint={t('Tiến độ chấm và kết luận của đợt: số kỹ năng dưới kỳ vọng — chính là mức SOS. Thiếu điểm thì chưa kết luận.')}>{t('Kết quả')}</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => {
            return (
              <tr key={a.id} id={`dot-${a.id}`} className="bam cursor-pointer" onClick={() => onOpen(a)}
                style={a.id === dotId ? { background: 'var(--accent-soft)' } : undefined}>
                <td className="td whitespace-nowrap">
                  <Link to={attemptHref(a)} className="link tabular-nums" onClick={(e) => e.stopPropagation()}>MT{a.attemptNo} ›</Link>
                  <NhanDot a={a} />
                </td>
                <td className="td text-slate-300">{a.classCode ?? '—'}</td>
                <td className="td whitespace-nowrap">
                  {a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>{t('Chưa có tuần')}</Info>}
                </td>
                {/* HSL-GON (chủ SP 05/11): lượt chưa tới tuần → ô điểm "–" như mọi ô chưa điểm (cột Tuần đã nói), không ô gộp "Chưa tới tuần". */}
                {chuaToi(a) ? [...KN_MOCK, 'ovr'].map((k) => <td key={k} className={so}>{fmtBand(null)}</td>) : <>
                  {KN_MOCK.map((k) => (
                    <td key={k} className={so}>{diemKyNang(a, k)}</td>
                  ))}
                  <td className={`${so} text-slate-100`}>{a.overall != null ? <DiemKq diem={a.overall} kyVong={a.expectation} /> : fmtBand(a.overall)}</td>
                </>}
                <td className={so}>{fmtBand(a.expectation)}</td>
                <td className="td">
                  {chuaToi(a) ? null : <KetQuaMt a={a} />}
                  {a.scopeNote && <div className="text-xs text-slate-500">{dich(a.scopeNote)}</div>}
                </td>
              </tr>
            );
          })}
          {thi && (
            <tr className="hang-thi-that">
              <td className="td whitespace-nowrap">{t('Thi thật')}</td>
              <td className="td">IELTS</td>
              <td className="td whitespace-nowrap">{ngayThi}</td>
 {thiKq ? (['l', 'r', 'w', 's', 'ovr'] as const).map((k) => <td key={k} colSpan={k === 'w' ? 2 : undefined} className={so}>{k === 'ovr' ? diemThi(k) : k === 'w' ? <span className="flex justify-center">{oThi(k)}</span> : oThi(k)}</td>)
                : <td colSpan={6} className="td" />}
              <td className={so}>{thi !== 'khong' && thi.target != null ? `Target ${fmtBand(thi.target)}` : '—'}</td>
              <td className="td"><KetQuaThi th={thi} /></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Lớp thường chấm theo ĐIỂM ĐẠT / TỔNG ĐIỂM — không có band, không có Overall, không có
 * kỳ vọng IELTS. Bấm một dòng ở đây mở đúng bảng điểm lớp thường, không phải màn Mock Test.
 *
 * PR-U12: đọc như bảng Mock Test (K4-33) — ô Bài là liên kết (Tab vào được) kèm `NhanDot`; cả hàng vẫn bấm được; MỘT ô Kết quả
 * nói một lần (`KetQuaThuongO`). Không có chữ SOS (Rulebook §20.6).
 */
function RatioAttempts({ attempts, dotId, homNay, onOpen, ct = null }: {
  attempts: any[]; dotId?: number; homNay: string | null; onOpen: (a: any) => void;
  /** Mã chương trình lộ trình — tên môn FOU G+V/P, Pre FOU Tổng hợp (MH2). */
  ct?: string | null;
}) {
  const dienThoai = useDienThoai();
  /* Chip điểm từng phần — dùng chung bảng và thẻ điện thoại. */
  const chipMon = (a: any) => (
    <span className="flex flex-wrap gap-1">
      {(a.skills ?? []).map((s: any) => (
        <Outcome key={s.skill} tone={s.outcome === 'missing' ? 'muted' : s.outcome === 'pass' ? 'dat' : 'danger'}
          title={dich(s.label)}>
          {tenMonNgan(ct, s.skill)} {s.score !== null ? `${s.score}/${s.total}` : '—'}
        </Outcome>
      ))}
    </span>
  );
  /* Ô Bài — liên kết tới bảng điểm đợt + nhãn; dùng chung bảng và thẻ điện thoại. */
  const oBai = (a: any, className: string) => (
    <>
      <Link to={attemptHref(a)} className={className} onClick={(e) => e.stopPropagation()}>{tenBaiThuong(attempts, a)}</Link>
      <NhanDot a={a} ct={ct} />
    </>
  );
  /* ĐIỆN THOẠI (PR-UXD Q9): mỗi lượt MỘT thẻ — `Giữa khoá · W3 SEP` + Kết quả bên phải, rồi Điểm từng phần · Lớp. */
  if (dienThoai) {
    return (
      <div>
        {attempts.map((a) => (
          <TheDong key={a.id} id={`dot-${a.id}`} className={a.id === dotId ? 'bg-[color:var(--accent-soft)]' : ''}
            dau={(
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-sm">
                  {oBai(a, 'link font-semibold')}
                  <div className="text-xs text-slate-500">{a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>{t('Chưa có tuần')}</Info>}</div>
                </div>
                <div className="shrink-0 text-right">
                  <KetQuaThuongO a={a} ct={ct} />
                </div>
              </div>
            )}
            dong={[
              { nhan: t('Điểm từng phần'), noiDung: chipMon(a) },
              { nhan: t('Lớp'), noiDung: a.classCode ?? '—' },
            ]} />
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr>
            <Th hint={t('Progress Test hay Final Test của khoá học. Bấm để mở bảng điểm đợt.')}>{t('Bài')}</Th>
            <Th hint={t('Lớp em học VÀO LÚC làm bài này — chuyển lớp không viết lại lịch sử.')}>{t('Lớp')}</Th>
            <Th hint={t('Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.')}>{t('Tuần')}</Th>
            <Th hint={t('Số câu đúng / tổng số câu từng môn. Đạt khi từ 70% trở lên.')}>{t('Điểm từng phần')}</Th>
            <Th hint={t('Progress Test: số môn đạt trên tổng, kèm môn không đạt. Final Test: % tổng. Môn chưa có điểm không tính là chưa đạt.')}>{t('Kết quả')}</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} id={`dot-${a.id}`} className="bam cursor-pointer" onClick={() => onOpen(a)}
              style={a.id === dotId ? { background: 'var(--accent-soft)' } : undefined}>
              <td className="td whitespace-nowrap">{oBai(a, 'link')}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>{t('Chưa có tuần')}</Info>}
              </td>
              <td className="td">{chipMon(a)}</td>
              <td className="td">
                <KetQuaThuongO a={a} ct={ct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * PR-LT2a: kết quả một lượt lớp thường — `2/4 môn đạt · SOS 2` + `Không đạt: L R` (Progress Test; OV-12c: nhãn SOS theo số môn trượt), `64%` (Cuối khoá).
 * PR-U12: nói MỘT lần — chưa đủ môn thì `Chờ n môn` (như `KetQuaDot` "Chờ n kỹ năng"), không kèm "mới x/y môn" hay "(đã chấm)";
 * lượt đã huỷ mà chưa đủ môn không còn chờ gì → `—` (nhãn `đã huỷ` cạnh tên bài đã nói lý do). Pre FOU (không chia môn) giữ `%`.
 */
function KetQuaThuongO({ a, ct }: { a: any; ct: string | null }) {
  const khongChiaMon = !!ct && CHUONG_TRINH_KHONG_CHIA_MON.includes(ct);
  const kq = nhanKetQuaThuong({
    kind: a.kind === 'final' ? 'final' : 'progress', ct, scored: a.scored, required: a.required,
    failedSkills: (a.skills ?? []).filter((s: any) => s.outcome === 'fail').map((s: any) => s.skill as string),
    tyLeTong: a.tyLeTong ?? null, khongChiaMon, nguong: a.passThreshold,
  });
  /* Lượt đã xong (`done`) mà thiếu môn = môn bị huỷ phần, không còn chờ → nói kết quả các môn đã chấm. */
  if (!khongChiaMon ? a.scored < a.required && a.status !== 'done' : a.sosLevel === null && a.scored === 0) {
    if (a.status === 'cancelled') return <span className="text-muted">—</span>;
    return (
      <>
        <Level tone="muted">{t('Chờ {n} môn', { n: a.required - a.scored })}</Level>
        {kq.phu && <div className="text-xs font-semibold text-soon">{dich(kq.phu)}</div>}
      </>
    );
  }
  return (
    <>
      <span className="inline-flex flex-wrap items-center gap-1">
        <Level tone={a.sosLevel === null ? (kq.dat ? 'info' : 'muted') : sosTone(a.sosLevel)}>{dich(kq.chinh)}</Level>
        {a.kind !== 'final' && !khongChiaMon && a.sosLevel > 0 && <ChipSos muc={a.sosLevel} thuong dot="Progress Test" ten={null} kyNang={(a.skills ?? []).filter((s: any) => s.outcome === 'fail').map((s: any) => tenMonNgan(ct, s.skill))} />}
      </span>
      {kq.phu && <div className="text-xs text-slate-400">{dich(kq.phu)}</div>}
    </>
  );
}

export { skillLabel };

/**
 * `kn=` TRÊN URL ↔ HẠNG MỤC BẢNG KỸ NĂNG CỦA LỘ TRÌNH ĐANG XEM (R7, Task 5).
 *
 * `kn` là kỹ năng NĂM Ô (writing1/writing2 tách với writing) vì đó là bộ URL dùng chung của
 * `duongHoSo.ts`. Bảng kỹ năng của lớp thường chỉ có "writing" gộp; của FT có W1/W2 riêng —
 * ghép khi cần, không khớp thì bỏ (không đoán bừa Task 1 hay Task 2).
 */
function anhXaKyNang(kn: string, boHop: readonly string[]): string | null {
  if (boHop.includes(kn)) return kn;
  if ((kn === 'writing1' || kn === 'writing2') && boHop.includes('writing')) return 'writing';
  if (kn === 'writing' && boHop.includes('writing1')) return 'writing1';
  return null;
}
