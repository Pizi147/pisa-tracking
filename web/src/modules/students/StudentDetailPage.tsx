import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { ThanhTruocSau } from '../../ui/ThanhTruocSau.tsx';
import { Card, DaiChiXem, Empty, ErrorState, Info, Level, Outcome, Skeleton, TargetText, Th} from '../../ui/ui.tsx';
import { cuonOnDinh } from '../../lib/cuonOnDinh.ts';
import { SkillBoard, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import { KetLuanKhoa, MiniTestO } from './KetLuanKhoa.tsx';
import { HanhTrinh } from './HanhTrinh.tsx';
import { CacLoTrinh } from './CacLoTrinh.tsx';
import { NganTongKet } from './NganTongKet.tsx';
import { BonO, CauTomTat, DaiChoDuyet, DaiTamDung, DongThongTin, ThanhViec, type Viec } from './DauHoSo.tsx';
import { NganCase } from './NganCase.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { StudentPlanPanel } from './StudentPlanPanel.tsx';
import { StudentManagePanel, mucQuanLyHocVien, thongTinEmCua, type ViecQuanLy } from './StudentManagePanel.tsx';
import { Menu } from '../../ui/Menu.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { StudentYThucSection } from '../yThuc/StudentYThucSection.tsx';
import {
  attemptHref,
  attemptStatusLabel, fmtBand, skillLabel, sosTone, studentStatusLabel,
} from '../../lib/format.ts';
import {
  HO_SO_TAB_LABEL, duongDotTest, caseCategoriesFor, tenMon, tenMonNgan, docThamSoHoSo, duongHoSoHocVien,
  nhanKetQuaThuong, tenBaiThuong, CHUONG_TRINH_KHONG_CHIA_MON, ngay, tuanLich, maHocVienNgan, trangCha, type HoSoTab,
} from '@shared/domain/index.ts';
import { HangTab } from '../../ui/HangTab.tsx';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { NhanCu } from '../../ui/OMt.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { DaiHocVienChuyen } from '../classes/DaiChuyenLop.tsx';

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
  const [viecQuanLy, setViecQuanLy] = useState<ViecQuanLy | null>(null);
  const dienThoai = useDienThoai();
  const [planOpen, setPlanOpen] = useState(false);
  const dongPlan = () => {
    setPlanOpen(false);
    if (p.mo) { const next = new URLSearchParams(params); next.delete('mo'); setParams(next, { replace: true }); }
  };
  const [reportOpen, setReportOpen] = useState(false);
  /** Ngăn Case (Q9) mở do BẤM trong trang (khối PA, ⋮ …) — mở do URL (`?case=`) đọc thẳng từ `p`. */
  const [openCase, setOpenCase] = useState<OpenCase>(null);
  /*
   * HẠNG MỤC ĐANG LỌC — một state duy nhất nối bảng kỹ năng với khối Case bên dưới.
   * Bấm "Reading" ở bảng trên là khối dưới chỉ còn Case Reading; bấm lại thì bỏ lọc.
   */
  const [skillPick, setSkillPick] = useState<string | null>(null);
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
    [id, boardCycleId],
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
  /* A5 (PR-YT4): dấu ⚠ trên tab Ý thức = em Quá hạn hoặc Bắt buộc xử lý. CÙNG đường với tab bên trong (một cửa trạng thái). */
  const yThuc = useApi<{ nhom: string | null }>(id ? `/students/${id}/y-thuc` : null, [id]);

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
      if (mapped) setSkillPick(mapped);
      return cuonOnDinh(() => document.getElementById('bang-ky-nang'), null);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data, p.dot, p.kn, p.muc]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const cy = data.cycle;
  /* Mở đúng đợt (`?dot=`) hoặc do bấm trong trang — ngăn Case dùng chung một chỗ (Q9). */
  const ngan: OpenCase = p.caseId != null ? { caseId: p.caseId, paId: p.paId, viec: p.viec === 'thi-that' ? undefined : p.viec } : openCase;
  /* PR-TK: `?tong-ket=<cycleId>` mở ngăn Tổng kết lộ trình (Lưu trữ, hồ sơ lớp, link chia sẻ); `?viec=thi-that` (việc nhắc GVCN) mở ngăn Kết quả thi thật. */
  const xoaThamSo = (...ks: string[]) => { const next = new URLSearchParams(params); ks.forEach((k) => next.delete(k)); setParams(next, { replace: true }); };
  const moTongKet = (cid: number) => { const next = new URLSearchParams(params); next.set('tong-ket', String(cid)); setParams(next, { replace: true }); };
  const dongNgan = () => {
    setOpenCase(null);
    if (p.caseId != null) {
      const next = new URLSearchParams(params);
      next.delete('case'); next.delete('pa'); next.delete('viec');
      setParams(next, { replace: true });
    }
  };
  /** Bấm một ô số (R8c, Q11): về tab Học thuật, chọn kỹ năng, cuộn tới bảng. */
  const moKyNang = (kn: string | null | undefined) => {
    if (!kn) return;
    // Giữ nguyên lộ trình đang xem — không để bấm ô số làm nhảy về lộ trình mặc định.
    navigate(duongHoSoHocVien(data.id, { kn, loTrinh: p.loTrinh }));
  };

  /** Nút động từ của thanh việc: mở đúng Ngăn Case / tab Ý thức / trang bàn giao. */
  const lamViec = (x: Viec) => {
    const m = x.mo;
    if (!m) return;
    if (m.loai === 'case') setOpenCase({ caseId: m.caseId, paId: m.paId, viec: m.viec });
    else if (m.loai === 'tab') navigate(duongHoSoHocVien(data.id, { tab: m.tab, sub: m.sub }));
    else navigate(m.href);
  };

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
        <ThanhTruocSau loai="hoc-vien" id={data.id} cha={trangCha('hoc-vien')} ten={`Hồ sơ ${data.fullName}`} chiTiet={data.currentClass?.code}
          duong={(sid) => duongHoSoHocVien(sid, { tab: p.tab })}
          dsDuPhong={data.currentClass ? async () => {
            const r = await api.get<{ id: number; fullName: string; archived: boolean }[]>(`/classes/${data.currentClass.id}/roster?chiId=1`);   // PR-TD2-b
            return { ids: r.filter((x) => !x.archived).sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi')).map((x) => x.id), nhan: `Lớp ${data.currentClass.code}` };
          } : undefined} />
        {data.lopHoc?.chiXem && (
          <DaiChiXem>Học viên đã lưu trữ{data.archivedAt ? ` ${ngay(data.archivedAt, homNay)}` : ''} — chỉ xem</DaiChiXem>
        )}
        <div className="rounded-xl border p-3 sm:p-4 mt-1.5"
             style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-xs text-slate-500">
                Hồ sơ học viên · {maHocVienNgan(data.studentCode)}
              </span>
              <h1 className="text-xl font-semibold text-slate-100 flex flex-wrap items-center gap-2 m-0 mt-0.5">
                {data.fullName}
                <MissingBadge items={data.missing} />
                {data.status !== 'active' && <Info>{studentStatusLabel(data.status)}</Info>}
                {data.archivedAt && <Info>Đã lưu trữ</Info>}
              </h1>
              <DongThongTin tt={data.dauHoSo.thongTin} />
            </div>

            <div className="flex flex-wrap gap-2 items-start">
              {data.viewer.canReport && !data.lopHoc?.chiXem && (
                <button className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => setReportOpen(true)}>+ Case</button>
              )}
              {/* ⋮ = MENU THẢ; mỗi mục mở THẲNG panel của việc đó (Q10). Không có quyền nào → Menu không vẽ gì. */}
              <Menu label="⋯" className="btn min-h-[44px] sm:min-h-0" items={mucQuanLyHocVien({
                canEdit: data.viewer.canEdit, suaThongTin: !!data.viewer.coTheSuaThongTin, lopHoc: data.lopHoc ?? null, cycle: cy, status: data.status, coTheXoa: !!data.viewer.coTheXoa,
                deXuatSua: !!data.viewer.coTheDeXuatSua,
              }).map((m) => ({
                label: m.nhan, danger: m.nguyHiem, keTruoc: m.keTruoc, hint: m.phu,
                onClick: () => (m.key === 'lo-trinh' ? setPlanOpen(true) : setViecQuanLy(m.key)),
              }))} />
            </div>
          </div>

          {/* PR-VAI-b (Q6): câu tóm tắt máy viết — "em đang thế nào", dưới vạch mảnh của khung thông tin. */}
          <CauTomTat manh={data.dauHoSo.tomTat} />

        </div>
      </div>

      {/* PR-VAI-b (T65, mockup 24 D1): dải vàng Tạm dừng — đọc TRƯỚC bốn ô vì nó đổi nghĩa mọi con số bên dưới. */}
      <DaiTamDung tamDung={data.dauHoSo.thongTin.tamDung} />

      {/* PR-CT (mockup 20 — E): dải Sắp chuyển / Đã chuyển ngay dưới dòng thông tin đầu trang; nút theo vai do máy chủ quyết. */}
      <DaiHocVienChuyen dai={data.dai ?? null} homNay={homNay}
        onLam={(k) => {
          if (k === 'huy-lenh') { setViecQuanLy('chuyen-lop'); return; }
          const d = data.dai;
          navigate(`/hoc-vien/lop/${d.lopNguon.id}?viec=ban-giao&lenh=${d.lenhId}${k === 'ban-giao-mon' && d.mon ? `&mon=${d.mon.ma}` : ''}`);
        }} />

      {/* BỐN Ô (PR-VAI-b, K3-03, T72): Kết quả gần nhất · Học thuật · Ý thức · Sắp tới — mỗi ô một nguồn, bấm mở đúng chỗ sinh số. */}
      <BonO o={data.dauHoSo.o} homNay={homNay}
        onDot={(attemptId) => navigate(duongHoSoHocVien(data.id, { dot: attemptId, loTrinh: p.loTrinh }))}
        onKn={moKyNang} onYThuc={() => setTab('y-thuc')}
        kyNangHref={(kn, attemptId) => (attemptId && !data.dauHoSo.o?.ketQua?.ratio ? duongDotTest({ id: attemptId, kind: 'mock' }, kn) : null)} />

      {/* PR-VAI-b (K3-01, T72): việc gấp nhất của NGƯỜI XEM với em; không có việc thì không vẽ gì. */}
      <ThanhViec viec={data.dauHoSo.viec} homNay={homNay} onLam={lamViec} />
      {/* PR-VAI-b (V1/K3-47): Quản lý duyệt ngay trong hồ sơ — chỗ của thanh việc (Quản lý không có việc học thuật với em). */}
      {data.viewer.coTheDuyet && <DaiChoDuyet studentId={data.id} homNay={homNay} onDoi={reload} onThemPa={(caseId) => setOpenCase({ caseId, viec: 'them-pa' })} />}

      {/*
        BA TAB NGAY DƯỚI ĐẦU TRANG (D2, spec 2026-09-22): Học thuật (mặc định) · Ý thức & Phối hợp · Hành trình.
        Tab nhớ qua địa chỉ `?tab=` (A6) để Việc cần làm / hồ sơ lớp mở thẳng đúng tab — không nhớ bằng localStorage.
        Không có lộ trình thì chỉ tab Học thuật trống; tab Ý thức và Hành trình vẫn mở được (J8).
      */}
      <HangTab ariaLabel="Nội dung hồ sơ học viên" value={tab} onChange={setTab}
        tabs={[
          { key: 'hoc-thuat', label: HO_SO_TAB_LABEL['hoc-thuat'] },
          { key: 'y-thuc', label: HO_SO_TAB_LABEL['y-thuc'], canhBao: yThuc.data?.nhom === 'qua_han' || yThuc.data?.nhom === 'bat_buoc' },
          { key: 'hanh-trinh', label: HO_SO_TAB_LABEL['hanh-trinh'] },
        ]} />

      {tab === 'hoc-thuat' && (!cy ? (
        <Empty title="Học viên chưa có lộ trình nào" hint="Mở lộ trình để bắt đầu theo dõi Target và các mốc đánh giá." />
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
          {data.cuoiKhoa && data.cuoiKhoa.scored > 0 && (
            <KetLuanKhoa studentId={data.id} studentName={data.fullName} lop={data.cuoiKhoa.lop ?? data.currentClass?.code ?? null} classId={data.currentClass?.id ?? null} ct={data.cuoiKhoa.ct ?? cy.programmeCode ?? null}
              cuoiKhoa={data.cuoiKhoa} coTheKetLuan={!!data.viewer?.coTheKetLuan} onDoi={reload} />
          )}
          {/* id để R8c/kn cuộn tới đúng khung này (Task 5) — không sửa SkillBoard. */}
          <div id="bang-ky-nang">
            <Card title={dienThoai ? 'Tiến độ theo kỹ năng · Case gấp lên trước' : 'Tiến độ và hỗ trợ theo kỹ năng'}
              action={dienThoai ? undefined : <span className="text-xs text-slate-500">Bấm một hàng để mở chi tiết ngay bên dưới</span>}
              bodyClass="p-0">
              <SkillBoard rows={skillRows}
                loading={board.loading} error={board.error} onRetry={board.reload}
                selected={skillPick}
                onPick={setSkillPick}
                onReport={() => setReportOpen(true)}
                onChanged={() => { board.reload(); reload(); }}
                onMoCase={(caseId, o) => setOpenCase({ caseId, paId: o?.paId, viec: o?.viec })}
                tamDungTu={board.data?.tamDungTu ?? null} />
            </Card>
          </div>

          {/*
            TÊN KHỐI GỌI ĐÚNG THEO CHƯƠNG TRÌNH (mục 7.11): lớp Fast Track là "Mock Test",
            lớp thường là "Kết quả kiểm tra". Cụm "Điểm qua các lượt" đã bỏ — nó không phải
            tiếng Việt ai dùng, và nó đúng với cả hai loại lớp nên chẳng nói được gì.
          */}
          <Card title={cy.ratio ? 'Kết quả Test' : 'Mock Test'} bodyClass="p-0">
            {data.attempts.length === 0 ? (
              <div className="p-4"><Empty title="Chưa có lượt đánh giá nào trong lộ trình này" /></div>
            ) : cy.ratio ? <RatioAttempts attempts={data.attempts} dotId={p.dot} homNay={homNay} ct={cy.programmeCode ?? null} onOpen={(a) => navigate(attemptHref(a))} />
              : <>
                {/* RF: kỳ vọng mọi MT bằng target — nói một lần ở đầu khối, không lặp ở từng hàng. */}
                {cy.route === 'RF' && <p className="m-0 px-3 pt-2 text-xs text-slate-500">Lộ trình RF — kỳ vọng mọi MT bằng Target.</p>}
                <IeltsAttempts attempts={data.attempts} dotId={p.dot} homNay={homNay} onOpen={(a) => navigate(attemptHref(a))} />
              </>}
            <div className="p-3">
              {cy.targetRevisions.length > 0 && (
                <p className="text-xs text-slate-500 mt-2 mb-0">
                  Target đã đổi {cy.targetRevisions.length} lần — lần gần nhất {tuanLich(cy.targetRevisions[0].effectiveFrom, homNay)}:
                  {' '}<TargetText band={cy.targetRevisions[0].oldTarget} kck={cy.targetRevisions[0].oldKck} /> → <TargetText band={cy.targetRevisions[0].newTarget} kck={cy.targetRevisions[0].newKck} />
                  {cy.targetRevisions[0].reason && ` (${cy.targetRevisions[0].reason})`}.
                  {' '}Các lượt đã chốt vẫn giữ kỳ vọng tính theo Target lúc đó.
                </p>
              )}
              {cy.outcome && (
                <p className="text-sm text-slate-200 mt-2 mb-0">
                  Kết luận lộ trình: <strong>{cy.outcome.label}</strong>
                  {cy.outcome.score !== null && ` · ${fmtBand(cy.outcome.score)}`}
                  {cy.outcome.note && <span className="text-slate-400"> — {cy.outcome.note}</span>}
                </p>
              )}
              {!cy.baseline && !cy.ratio && (
                <p className="text-xs text-slate-500 mt-2 mb-0">Chưa ghi điểm đầu vào.</p>
              )}
            </div>
          </Card>
        </>
      ))}

      {tab === 'y-thuc' && (
        <Card bodyClass="p-4">
          <StudentYThucSection studentId={data.id} thuong={!!cy.ratio} onGoAcademic={() => setTab('hoc-thuat')} />
        </Card>
      )}

      {tab === 'hanh-trinh' && <CacLoTrinh studentId={data.id} onTongKet={moTongKet} onHocThuat={() => setTab('hoc-thuat')} />}

      {tab === 'hanh-trinh' && (
        <Card title="Hành trình học tập" bodyClass="p-4 space-y-4">
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

      {/* ============================================== hộp thoại */}
      {/* PR-DL: `?mo=lo-trinh` (bảng điểm theo lượt, em chưa có lịch MT) mở sẵn panel; đóng thì bỏ tham số. */}
      {(planOpen || p.mo === 'lo-trinh') && cy && (
        <StudentPlanPanel
          cycleId={cy.id}
          studentName={data.fullName}
          ratio={!!cy.ratio}
          canEditCycle={!!data.viewer.canEditCycle}
          onDeXuatSua={() => { dongPlan(); setViecQuanLy('de-xuat-sua'); }}
          onClose={dongPlan}
          onDone={reload}
        />
      )}

      <QuickReport open={reportOpen} onClose={() => setReportOpen(false)}
        studentId={data.id} studentName={data.fullName} lop={data.currentClass?.code} cycleId={cy?.id ?? null}
        onDone={(cid) => { reload(); setOpenCase({ caseId: cid }); }}
        onMoCase={(cid, viec) => { reload(); setOpenCase({ caseId: cid, viec }); }} />

      {/* Ngăn Case (Q9) — không đổi tab; cuộn tới đúng PA khi mở kèm `paId`. Mở do `?case=` thì đóng cũng xoá URL. */}
      {ngan && (
        <NganCase caseId={ngan.caseId} paId={ngan.paId} viec={ngan.viec} hocVien={data.fullName} lop={data.currentClass?.code}
          onClose={dongNgan} onChanged={reload} />
      )}

      {p.tongKet != null && <NganTongKet cycleId={p.tongKet} onClose={() => xoaThamSo('tong-ket')} onDoi={reload} />}

      <StudentManagePanel
        viec={viecQuanLy ?? (p.viec === 'thi-that' && cy?.route ? 'outcome' : null)} onClose={() => { setViecQuanLy(null); if (p.viec === 'thi-that') xoaThamSo('viec'); }} lop={data.currentClass?.code}
        student={thongTinEmCua(data)} quyen={data.viewer} lopHoc={data.lopHoc ?? null}
        cycle={cy} attempts={data.attempts} onDone={reload} soViPhamMo={data.dauHoSo?.soViPhamMo}
        onDeXuatSua={() => setViecQuanLy('de-xuat-sua')}
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
    ...(a.status === 'cancelled' ? [{ chu: 'đã huỷ', title: 'Lượt này đã huỷ.' }] : []),
    ...(a.huyPhan ? [{ chu: 'huỷ phần', title: 'Có phần thi bị huỷ.' }] : []),
    ...(a.doiKyNang?.length ? [{
      chu: `dời ${a.doiKyNang.map((k) => tenMonNgan(ct, k)).join(' ')}`,
      title: `Dời do vắng: ${a.doiKyNang.map((k) => tenMon(ct, k)).join(', ')}.`,
    }] : []),
  ];
  const toiDa = a.lichSu ? 1 : 2;
  return (
    <>
      {a.lichSu && <> <NhanCu /></>}
      {nhan.slice(0, toiDa).map((x) => (
        <span key={x.chu} title={x.title}
          className="ml-1 inline-flex items-center whitespace-nowrap rounded border border-muted-line px-[5px] align-middle text-[11.5px] leading-4 text-muted">
          {x.chu}
        </span>
      ))}
      {nhan.length > toiDa && (
        <span className="ml-1 text-[11.5px] text-muted" title={nhan.slice(toiDa).map((x) => x.title).join(' ')}>
          +{nhan.length - toiDa}
        </span>
      )}
    </>
  );
}

/** Chữ cái kỹ năng ở dòng Điểm của thẻ điện thoại (cùng chữ với đầu cột bảng). */
const CHU_KY_NANG = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' } as const;

/**
 * BẢNG MOCK TEST của hồ sơ HV (F8, K4-33). Nằm ở: Học viên & Lớp › hồ sơ học viên › tab Học thuật › khối "Mock Test".
 *
 * MỘT cột Kết quả (`KetQuaDot` — nói tiến độ lẫn kết luận một lần, không "Đã lên lịch" + "Chờ n kỹ năng" + "mới 2/4"). Số căn
 * phải. Ô MT{n} là liên kết (Tab vào được); cả hàng vẫn bấm được. Nhãn nhỏ cạnh MT: lịch sử · đã huỷ · huỷ phần · dời S —
 * tối đa hai, còn lại "+n" có tooltip.
 */
function IeltsAttempts({ attempts, dotId, homNay, onOpen }: {
  attempts: any[]; dotId?: number; homNay: string | null; onOpen: (a: any) => void;
}) {
  const dienThoai = useDienThoai();
  /* G5: điểm một kỹ năng mở hồ sơ Mock cuộn tới đúng kỹ năng (Tab vào được; hàng bảng vẫn bấm mở đợt). */
  const diemKyNang = (a: any, k: 'listening' | 'reading' | 'writing' | 'speaking') => (
    a.bands?.[k] != null
      ? <Link to={duongDotTest(a, k)} className="link" title={`Mở Hồ sơ Mock Test · MT${a.attemptNo} · ${skillLabel(k)}`} onClick={(e) => e.stopPropagation()}>{fmtBand(a.bands[k])}</Link>
      : fmtBand(a.bands?.[k])
  );
  /*
   * ĐIỆN THOẠI (PR-UXD Q9): mỗi lượt MỘT thẻ — đầu thẻ `MT2 · W3 SEP` + Kết quả bên phải (tầng 1), rồi Điểm L R W S · Overall · Kỳ vọng ·
   * Lớp (tầng 3, cuối). Cùng trường `a.*` và cùng link `attemptHref` / `duongDotTest` với bảng — đổi bảng thì đổi thẻ.
   */
  if (dienThoai) {
    return (
      <div>
        {attempts.map((a) => (
          <TheDong key={a.id} id={`dot-${a.id}`} className={a.id === dotId ? 'bg-[color:var(--accent-soft)]' : ''}
            dau={(
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={attemptHref(a)} className="link font-semibold tabular-nums">MT{a.attemptNo}</Link><NhanDot a={a} />
                  <div className="text-xs text-slate-500">{a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>Chưa có tuần</Info>}</div>
                </div>
                <div className="shrink-0 text-right">
                  <KetQuaDot coDiem={a.scored} yeuCau={a.required} dat={a.evaluable ? a.sosLevel === 0 : null} sos={a.sosLevel ?? null} chot={a.chot} />
                  {a.scopeNote && <div className="text-xs text-slate-500">{a.scopeNote}</div>}
                </div>
              </div>
            )}
            dong={[
              {
                nhan: 'Điểm',
                noiDung: (['listening', 'reading', 'writing', 'speaking'] as const).map((k, i) => (
                  <Fragment key={k}>{i > 0 && ' · '}<span className="text-slate-500">{CHU_KY_NANG[k]}</span> {diemKyNang(a, k)}</Fragment>
                )),
              },
              { nhan: 'Overall', noiDung: fmtBand(a.overall) },
              { nhan: 'Kỳ vọng', noiDung: fmtBand(a.expectation) },
              { nhan: 'Lớp', noiDung: a.classCode ?? '—' },
            ]} />
        ))}
      </div>
    );
  }
  const so = 'td text-right tabular-nums';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr>
            <Th hint="Số thứ tự lượt Mock Test trong lộ trình này.">MT</Th>
            <Th hint="Lớp em học VÀO LÚC làm bài này — chuyển lớp không viết lại lịch sử.">Lớp lúc đánh giá</Th>
            <Th hint="Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.">Tuần</Th>
            <Th align="right" hint="Band Listening">L</Th><Th align="right" hint="Band Reading">R</Th>
            <Th align="right" hint="Band Writing — gộp từ W1 và W2">W</Th><Th align="right" hint="Band Speaking">S</Th>
            <Th align="right" hint="Band tổng của lượt, tính theo quy tắc IELTS. Thiếu một kỹ năng thì chưa có Overall.">OVR</Th>
            <Th align="right" hint="Mức mong đợi của chính đợt Test đó, tính theo Target tại thời điểm ấy. Đổi Target không chấm lại quá khứ.">Kỳ vọng</Th>
            <Th hint="Tiến độ chấm và kết luận của đợt: số kỹ năng dưới kỳ vọng — chính là mức SOS. Thiếu điểm thì chưa kết luận.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => {
            return (
              <tr key={a.id} id={`dot-${a.id}`} className="row-hover cursor-pointer" onClick={() => onOpen(a)}
                style={a.id === dotId ? { background: 'var(--accent-soft)' } : undefined}>
                <td className="td whitespace-nowrap">
                  <Link to={attemptHref(a)} className="link tabular-nums" onClick={(e) => e.stopPropagation()}>MT{a.attemptNo}</Link>
                  <NhanDot a={a} />
                </td>
                <td className="td text-slate-300">{a.classCode ?? '—'}</td>
                <td className="td whitespace-nowrap">
                  {a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>Chưa có tuần</Info>}
                </td>
                {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                  <td key={k} className={so}>{diemKyNang(a, k)}</td>
                ))}
                <td className={`${so} text-slate-100`}>{fmtBand(a.overall)}</td>
                <td className={so}>{fmtBand(a.expectation)}</td>
                <td className="td">
                  <KetQuaDot coDiem={a.scored} yeuCau={a.required} dat={a.evaluable ? a.sosLevel === 0 : null} sos={a.sosLevel ?? null} chot={a.chot} />
                  {a.scopeNote && <div className="text-xs text-slate-500">{a.scopeNote}</div>}
                </td>
              </tr>
            );
          })}
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
        <Outcome key={s.skill} tone={s.outcome === 'missing' ? 'muted' : s.outcome === 'pass' ? 'ok' : 'warn'}
          title={s.label}>
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
                  <div className="text-xs text-slate-500">{a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>Chưa có tuần</Info>}</div>
                </div>
                <div className="shrink-0 text-right">
                  <KetQuaThuongO a={a} ct={ct} />
                </div>
              </div>
            )}
            dong={[
              { nhan: 'Điểm từng phần', noiDung: chipMon(a) },
              { nhan: 'Lớp', noiDung: a.classCode ?? '—' },
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
            <Th hint="Progress Test hay Final Test của khoá học. Bấm để mở bảng điểm đợt.">Bài</Th>
            <Th hint="Lớp em học VÀO LÚC làm bài này — chuyển lớp không viết lại lịch sử.">Lớp</Th>
            <Th hint="Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.">Tuần</Th>
            <Th hint="Số câu đúng / tổng số câu từng môn. Đạt khi từ 70% trở lên.">Điểm từng phần</Th>
            <Th hint="Progress Test: số môn đạt trên tổng, kèm môn không đạt. Final Test: % tổng. Môn chưa có điểm không tính là chưa đạt.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} id={`dot-${a.id}`} className="row-hover cursor-pointer" onClick={() => onOpen(a)}
              style={a.id === dotId ? { background: 'var(--accent-soft)' } : undefined}>
              <td className="td whitespace-nowrap">{oBai(a, 'link')}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>Chưa có tuần</Info>}
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
 * PR-LT2a (T58): kết quả một lượt lớp thường — `2/4 môn đạt` + `Không đạt: L R` (Giữa khoá), `64%` (Cuối khoá); không có chữ SOS.
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
        <Level tone="muted">Chờ {a.required - a.scored} môn</Level>
        {kq.phu && <div className="text-xs font-semibold text-soon">{kq.phu}</div>}
      </>
    );
  }
  return (
    <>
      <Level tone={a.sosLevel === null ? (kq.dat ? 'ok' : 'muted') : sosTone(a.sosLevel)}>{kq.chinh}</Level>
      {kq.phu && <div className="text-xs text-slate-400">{kq.phu}</div>}
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
