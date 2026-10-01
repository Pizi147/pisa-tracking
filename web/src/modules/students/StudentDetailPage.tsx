import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BoLocDoan, Card, DaiChiXem, Empty, ErrorState, Info, Level, Outcome, Skeleton, TargetText, Th} from '../../ui/ui.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { cuonOnDinh } from '../../lib/cuonOnDinh.ts';
import { MuiTen, SkillBoard, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import { KetLuanKhoa, MiniTestO } from './KetLuanKhoa.tsx';
import { HanhTrinh } from './HanhTrinh.tsx';
import { DongThongTin, ThanhViec, type Viec } from './DauHoSo.tsx';
import { LichSuLop } from './LichSuLop.tsx';
import { NganCase } from './NganCase.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { StudentPlanPanel } from './StudentPlanPanel.tsx';
import { StudentManagePanel, mucQuanLyHocVien, type ViecQuanLy } from './StudentManagePanel.tsx';
import { Menu } from '../../ui/Menu.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { StudentYThucSection } from '../yThuc/StudentYThucSection.tsx';
import {
  attemptHref,
  attemptStatusLabel, fmtBand, skillLabel, skillShort, sosTone, studentStatusLabel,
} from '../../lib/format.ts';
import {
  HO_SO_TAB_LABEL, JOURNEY_EVENT_LABEL, caseCategoriesFor, tenMonNgan, docThamSoHoSo, duongHoSoHocVien,
  ketQuaTestGanNhat, nhanKetQuaThuong, CHUONG_TRINH_KHONG_CHIA_MON, ngay, tuanLich, type HoSoTab,
} from '@shared/domain/index.ts';
import { HangTab } from '../../ui/HangTab.tsx';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { Han } from '../../ui/Han.tsx';
import { ChipLichSu } from '../../ui/Nhan.tsx';
import { useSession } from '../../lib/session.tsx';
import { DaiHocVienChuyen } from '../classes/DaiChuyenLop.tsx';

type OpenCase = { caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'them-pa' | 'xac-nhan' | 'xac-nhan-pa' | 'ke-hoach' } | null;

type Profile = any;

/**
 * HỒ SƠ HỌC VIÊN.
 *
 * Trang này phải trả lời được trong khoảng ba mươi giây: em bắt đầu ở đâu, đang ở đâu,
 * đích ở đâu, có đang theo kịp không, đang vướng gì, ai đã làm gì, và bước tiếp theo là gì.
 *
 * BỐ CỤC (chủ sản phẩm chốt 22/09/2026, spec PR-HV/PR-Qb — thay ba tầng của bản 13/09):
 *
 *   Đầu trang    EM NÀY LÀ AI          tên, {khoá đang học lớp thường | mục tiêu FT}, GVCN; nút Lộ trình · + Case · ⋮
 *   Bốn ô số     LIẾC MỘT CÁI, BẤM ĐƯỢC  Kết quả Test gần nhất · Kỹ năng cần hỗ trợ · Case đang mở · Việc cần làm tiếp
 *   Ba tab       Học thuật (mặc định: bảng kỹ năng + case, rồi Mock Test) · Ý thức & Phối hợp · Hành trình theo giai đoạn
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
 * bao giờ trộn hai lộ trình vào một khung nhìn, vì mục tiêu và thang điểm của chúng khác nhau.
 */
export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const homNay = session?.demoDate ?? null;
  const [params, setParams] = useSearchParams();
  /* R7/R8c/Q9/Q10 (PR-Qb): MỘT hàm đọc mọi tham số của hồ sơ — không còn đọc lẻ từng khoá. */
  const p = docThamSoHoSo((k) => params.get(k));
  const q = p.loTrinh ? `?cycleId=${p.loTrinh}` : p.dot != null ? `?attemptId=${p.dot}` : '';
  const { data, loading, error, reload } = useApi<Profile>(id ? `/students/${id}${q}` : null, [p.loTrinh, p.dot]);
  const [viecQuanLy, setViecQuanLy] = useState<ViecQuanLy | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  /** Ngăn Case (Q9) mở do BẤM trong trang (khối PA, ⋮ …) — mở do URL (`?case=`) đọc thẳng từ `p`. */
  const [openCase, setOpenCase] = useState<OpenCase>(null);
  /*
   * HẠNG MỤC ĐANG LỌC — một state duy nhất nối bảng kỹ năng với khối case bên dưới.
   * Bấm "Reading" ở bảng trên là khối dưới chỉ còn case Reading; bấm lại thì bỏ lọc.
   */
  const [skillPick, setSkillPick] = useState<string | null>(null);
  /** Dải chọn lộ trình — chỉ bày khi người dùng hỏi tới, không chiếm chỗ mặc định. */
  const [cycleOpen, setCycleOpen] = useState(false);
  /*
   * BẢNG KỸ NĂNG NẠP Ở ĐÂY, KHÔNG NẠP TRONG KHỐI CON.
   *
   * Hai chỗ cần đúng bộ dữ liệu này: bảng "Tiến độ và hỗ trợ theo kỹ năng" và dòng thời gian
   * ở tab Hành trình. Để mỗi khối tự gọi lấy là hai lần gọi cho một lần mở trang, và tệ hơn:
   * hai khối có thể hiện hai trạng thái khác nhau của cùng một case.
   */
  /* Lộ trình ĐANG XEM, không phải tham số trên URL: không có tham số thì là lộ trình đang chạy. */
  const boardCycleId: number | null = data?.cycle?.id ?? null;
  const board = useApi<{ rows: SkillBoardRow[] }>(
    id && boardCycleId ? `/students/${id}/skill-board?cycleId=${boardCycleId}` : null,
    [id, boardCycleId],
  );
  const skillRows = board.data?.rows ?? null;
  /*
   * TAB ĐANG XEM đọc từ địa chỉ (A6); có `dot`/`kn` thì LUÔN Học thuật (R7, Q10) — hai tham số đó
   * chỉ có nghĩa ở tab này. Đổi tab là `replace` để nút Quay lại của trình duyệt không phải bấm
   * nhiều lần, và xoá `dot`/`kn` vì người xem đã chủ động rời khỏi thứ hai tham số đó đang trỏ tới.
   */
  const tab: HoSoTab = p.dot != null || p.kn ? 'hoc-thuat' : p.tab ?? 'hoc-thuat';
  const setTab = (t: HoSoTab) => {
    const next = new URLSearchParams(params);          // giữ nguyên 'lo-trinh'
    next.delete('dot'); next.delete('kn');
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
    } else if (p.kn && data.cycle) {
      const boHop = caseCategoriesFor(data.cycle.ratio ? 'ratio' : 'ielts_band', data.cycle.programmeCode);
      const mapped = anhXaKyNang(p.kn, boHop);
      if (mapped) setSkillPick(mapped);
      return cuonOnDinh(() => document.getElementById('bang-ky-nang'), null);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data, p.dot, p.kn]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const cy = data.cycle;
  /* Mở đúng đợt (`?dot=`) hoặc do bấm trong trang — ngăn Case dùng chung một chỗ (Q9). */
  const ngan: OpenCase = p.caseId != null ? { caseId: p.caseId, paId: p.paId, viec: p.viec } : openCase;
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

  const setCycle = (cid: number) => {
    const next = new URLSearchParams(params);
    if (cid === data.cycles.find((c: any) => c.status === 'active')?.id) next.delete('lo-trinh');
    else next.set('lo-trinh', String(cid));
    setParams(next, { replace: true });
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
        <button className="btn btn-sm btn-ghost mb-1.5" onClick={() => navigate(-1)}>← Quay lại</button>
        {data.lopHoc?.chiXem && (
          <DaiChiXem>Học viên đã lưu trữ{data.archivedAt ? ` ${ngay(data.archivedAt, homNay)}` : ''} — chỉ xem</DaiChiXem>
        )}
        <div className="rounded-xl border p-3 sm:p-4 mt-1.5"
             style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[11px] text-slate-500">
                Hồ sơ học viên · {data.studentCode}
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
              {data.journeyStrip?.length > 1 && (
                <button type="button" className="btn" aria-expanded={cycleOpen}
                  onClick={() => setCycleOpen(!cycleOpen)}>Lộ trình <span className="text-slate-400"><MuiTen mo={cycleOpen} /></span></button>
              )}
              {data.viewer.canReport && !data.lopHoc?.chiXem && (
                <button className="btn btn-primary" onClick={() => setReportOpen(true)}>+ Case</button>
              )}
              {/* ⋮ = MENU THẢ; mỗi mục mở THẲNG panel của việc đó (Q10). Không có quyền nào → Menu không vẽ gì. */}
              <Menu label="⋮" className="btn" items={mucQuanLyHocVien({
                canEdit: data.viewer.canEdit, lopHoc: data.lopHoc ?? null, cycle: cy, status: data.status, coTheXoa: !!data.viewer.coTheXoa,
                deXuatSua: !!data.viewer.coTheDeXuatSua,
              }).map((m) => ({
                label: m.nhan, danger: m.nguyHiem, keTruoc: m.keTruoc,
                onClick: () => (m.key === 'lo-trinh' ? setPlanOpen(true) : setViecQuanLy(m.key)),
              }))} />
            </div>
          </div>

          {/*
            DẢI LỘ TRÌNH chỉ bày khi được hỏi tới. Nó là thứ dùng vài lần một khoá, không đáng
            chiếm một tầng cố định ở đầu mọi hồ sơ.
          */}
          {cycleOpen && data.journeyStrip?.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t"
                 style={{ borderColor: 'var(--line)' }}>
              <span className="text-[11px] text-slate-500 mr-1">Chọn lộ trình để xem</span>
              <BoLocDoan ariaLabel="Chọn lộ trình để xem" value={String(cy?.id ?? '')} onChange={(k) => setCycle(Number(k))}
                muc={data.journeyStrip.map((j: any) => ({ key: String(j.id), nhan: j.current ? `${j.label} · đang học` : j.label }))} />
            </div>
          )}
        </div>
      </div>

      {/* PR-CT (mockup 20 — E): dải Sắp chuyển / Đã chuyển ngay dưới dòng thông tin đầu trang; nút theo vai do máy chủ quyết. */}
      <DaiHocVienChuyen dai={data.dai ?? null} homNay={homNay}
        onLam={(k) => {
          if (k === 'huy-lenh') { setViecQuanLy('chuyen-lop'); return; }
          const d = data.dai;
          navigate(`/hoc-vien/lop/${d.lopNguon.id}?viec=ban-giao&lenh=${d.lenhId}${k === 'ban-giao-mon' && d.mon ? `&mon=${d.mon.ma}` : ''}`);
        }} />

      {/* BỐN Ô SỐ (Q7, R8c/Q11) — bốn câu hỏi, không phải một phép chia. LUÔN hiện phía trên hàng tab, kể cả khi chưa có lộ trình (spec §4.1; chủ sản phẩm chốt 22/09 sau rà soát). */}
      <HeaderStats data={data} rows={skillRows} homNay={homNay}
        onOpenDot={(attemptId) => navigate(duongHoSoHocVien(data.id, { dot: attemptId }))}
        onOpenKn={moKyNang} />

      {/* PR-VAI-b (K3-01, T72): việc gấp nhất của NGƯỜI XEM với em; không có việc thì không vẽ gì. */}
      <ThanhViec viec={data.dauHoSo.viec} homNay={homNay} onLam={lamViec} />

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
        <Empty title="Học viên chưa có lộ trình nào" hint="Mở lộ trình để bắt đầu theo dõi mục tiêu và các mốc đánh giá." />
      ) : (
        <>
          {/*
            KHỐI CHÍNH CỦA HỒ SƠ (mục 4.2). Bấm một hàng thì nội dung mở ra NGAY DƯỚI hàng
            đó — biểu đồ của chính kỹ năng ấy, các case đang mở, lịch sử đã kết thúc.

            Khối "Case và kết quả hỗ trợ" tách riêng ở dưới đã BỎ: nó kể lại đúng những case
            mà bảng này vừa tóm tắt, nên cùng một case hiện hai lần trên một trang, và bấm
            một hàng ở đây thì phải cuộn xuống chỗ khác mới thấy kết quả.
          */}
          {/* PR-LT2b (M-05): ô Mini Test ở đầu tab (lộ trình mới có bổ trợ miễn phí) · hộp Kết luận khoá (lớp thường đã có điểm Cuối khoá). */}
          {data.miniTest && <MiniTestO mt={data.miniTest} onGhi={(caseId, paId) => setOpenCase({ caseId, paId, viec: 'ghi-ket-qua' })} />}
          {data.cuoiKhoa && data.cuoiKhoa.scored > 0 && (
            <KetLuanKhoa studentId={data.id} studentName={data.fullName} lop={data.cuoiKhoa.lop ?? data.currentClass?.code ?? null} ct={data.cuoiKhoa.ct ?? cy.programmeCode ?? null}
              cuoiKhoa={data.cuoiKhoa} coTheKetLuan={!!data.viewer?.coTheKetLuan} onDoi={reload} />
          )}
          {/* id để R8c/kn cuộn tới đúng khung này (Task 5) — không sửa SkillBoard. */}
          <div id="bang-ky-nang">
            <Card title="Tiến độ và hỗ trợ theo kỹ năng"
              action={<span className="text-xs text-slate-500">Bấm một hàng để mở chi tiết ngay bên dưới</span>}
              bodyClass="p-0">
              <SkillBoard rows={skillRows}
                loading={board.loading} error={board.error} onRetry={board.reload}
                selected={skillPick}
                onPick={setSkillPick}
                onReport={() => setReportOpen(true)}
                onChanged={() => { board.reload(); reload(); }}
                onMoCase={(caseId, o) => setOpenCase({ caseId, paId: o?.paId, viec: o?.viec })} />
            </Card>
          </div>

          {/*
            TÊN KHỐI GỌI ĐÚNG THEO CHƯƠNG TRÌNH (mục 7.11): lớp Fast Track là "Mock Test",
            lớp Normal là "Kết quả kiểm tra". Cụm "Điểm qua các lượt" đã bỏ — nó không phải
            tiếng Việt ai dùng, và nó đúng với cả hai loại lớp nên chẳng nói được gì.
          */}
          <Card title={cy.ratio ? 'Kết quả kiểm tra' : 'Mock Test'} bodyClass="p-0">
            {data.attempts.length === 0 ? (
              <div className="p-4"><Empty title="Chưa có lượt đánh giá nào trong lộ trình này" /></div>
            ) : cy.ratio ? <RatioAttempts attempts={data.attempts} dotId={p.dot} homNay={homNay} ct={cy.programmeCode ?? null} onOpen={(a) => navigate(attemptHref(a))} />
              : <>
                {/* RF: kỳ vọng mọi MT bằng target — nói một lần ở đầu khối, không lặp ở từng hàng. */}
                {cy.route === 'RF' && <p className="m-0 px-3 pt-2 text-xs text-slate-500">Lộ trình RF — kỳ vọng mọi MT bằng target.</p>}
                <IeltsAttempts attempts={data.attempts} dotId={p.dot} homNay={homNay} onOpen={(a) => navigate(attemptHref(a))} />
              </>}
            <div className="p-3">
              {cy.targetRevisions.length > 0 && (
                <p className="text-xs text-slate-500 mt-2 mb-0">
                  Mục tiêu đã đổi {cy.targetRevisions.length} lần — lần gần nhất {ngay(cy.targetRevisions[0].effectiveFrom, homNay)}:
                  {' '}<TargetText band={cy.targetRevisions[0].oldTarget} kck={cy.targetRevisions[0].oldKck} /> → <TargetText band={cy.targetRevisions[0].newTarget} kck={cy.targetRevisions[0].newKck} />
                  {cy.targetRevisions[0].reason && ` (${cy.targetRevisions[0].reason})`}.
                  {' '}Các lượt đã chốt vẫn giữ kỳ vọng tính theo mục tiêu lúc đó.
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
          <StudentYThucSection studentId={data.id} onGoAcademic={() => setTab('hoc-thuat')} />
        </Card>
      )}

      {tab === 'hanh-trinh' && (
        <Card title="Hành trình học tập" bodyClass="p-4 space-y-4">
          {/* LỊCH SỬ LỚP (PR-LT, §3.8 dòng cuối) — đứng TRÊN trục tuần, mỗi lớp em từng học một dòng. */}
          <LichSuLop studentId={data.id} active={tab === 'hanh-trinh'} />
          {/*
            TRỤC TUẦN THEO LỊCH THẬT, MỖI GIAI ĐOẠN MỘT TRỤC (§3.8, PR-Qb) — thay dòng thời gian
            cũ vẽ lại đúng biểu đồ điểm đã có ở khối trên. Tự gọi máy chủ riêng theo giai đoạn
            đang chọn, chỉ khi tab này đang mở.
          */}
          <HanhTrinh studentId={data.id} active={tab === 'hanh-trinh'}
            episodes={data.episodes} allEpisodes={data.allEpisodes}
            onOpenCase={(caseId, paId) => setOpenCase({ caseId, paId })} />
        </Card>
      )}

      {/* ============================================== hộp thoại */}
      {planOpen && cy && (
        <StudentPlanPanel
          cycleId={cy.id}
          studentName={data.fullName}
          ratio={!!cy.ratio}
          canEditCycle={!!data.viewer.canEditCycle}
          onDeXuatSua={() => { setPlanOpen(false); setViecQuanLy('de-xuat-sua'); }}
          onClose={() => setPlanOpen(false)}
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

      <StudentManagePanel
        viec={viecQuanLy} onClose={() => setViecQuanLy(null)} lop={data.currentClass?.code}
        student={{
          id: data.id, name: data.fullName, classId: data.currentClass?.id ?? null,
          dob: data.dob ?? null, email: data.email ?? null, consultantName: data.consultantName ?? null, note: data.note ?? null,
          status: data.status,
        }}
        cycle={cy} attempts={data.attempts} onDone={reload}
      />
    </div>
  );
}

// ==================================================================== khối nhỏ

/**
 * BỐN Ô SỐ Ở ĐẦU HỒ SƠ (Q7, spec PR-HV §4.1) — bốn câu hỏi khác nhau, cố ý không cộng thành gì.
 *
 *   Kết quả Test gần nhất   bài vừa rồi ra sao — đúng câu của <KetQuaDot>; lớp Normal KHÔNG bịa Overall
 *   Kỹ năng cần hỗ trợ      giờ đang yếu ở đâu — số kỹ năng dưới kỳ vọng, kèm tên
 *   Case đang mở            còn bao nhiêu việc chưa xong — số case, và số PA đang theo dõi
 *   Việc cần làm tiếp       phải làm gì, trước ngày nào — câu có động từ do máy chủ dựng (`headline.next`)
 *
 * Mỗi ô nói ĐÚNG MỘT điều. BỐN Ô ĐỀU BẤM ĐƯỢC (R8c, Q11) — mỗi ô dẫn đúng chỗ tạo ra con số đó.
 * Giá trị `—`/`0` không bấm được (không có gì để mở).
 */
function HeaderStats({ data, rows, homNay, onOpenDot, onOpenKn }: {
  data: any; rows: SkillBoardRow[] | null; homNay: string | null;
  onOpenDot: (attemptId: number) => void; onOpenKn: (kn: string | null | undefined) => void;
}) {
  const scored = (rows ?? []).filter((r) => r.band !== null);
  const below = scored.filter((r) => r.missed === true);
  /* PR-S3F #5: môn có điểm mà không có kỳ vọng (em KCK, chưa target) không được tính là "đạt kỳ vọng". */
  const khongKyVong = scored.filter((r) => r.missed === null).length;
  const daDatHet = scored.length > 0 && khongKyVong === 0;
  const openCases = (rows ?? []).flatMap((r) => r.cases.map((c) => ({ ...c, category: r.category })))
    .filter((c) => c.status !== 'done');
  /* PR-S3F #10: PA "Chờ xác nhận" (Q28-3) chưa chạy — không tính vào "đang theo dõi", ghi riêng. */
  const songPlans = openCases.flatMap((c) => c.plans).filter((p) => p.status === 'planned' || p.status === 'started');
  const choXacNhan = songPlans.filter((p) => p.choXacNhan).length;
  /* PR-LT2a: PA Bổ trợ chờ kế hoạch được duyệt cũng chưa chạy. PR-S5F-b: Case còn chờ nguyên nhân thì PA của nó chờ NGUYÊN NHÂN,
     chưa tới bước kế hoạch — đếm riêng, không gọi "chờ kế hoạch". */
  const chuaChayCua = (cs: typeof openCases) => cs.flatMap((c) => c.plans).filter((p) => (p.status === 'planned' || p.status === 'started') && p.chuaChay).length;
  const choNguyenNhan = chuaChayCua(openCases.filter((c) => c.sos?.awaitingCause));
  const choKeHoach = chuaChayCua(openCases.filter((c) => !c.sos?.awaitingCause));
  const runningPlans = songPlans.length - choXacNhan - choNguyenNhan - choKeHoach;
  const kq = ketQuaTestGanNhat(data.attempts ?? [], homNay);
  const cheDo = data.cycle?.ratio ? 'ratio' as const : 'ielts' as const;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Stat label="Kết quả Test gần nhất"
        value={kq ? kq.nhan : '—'}
        onClick={kq ? () => onOpenDot(kq.attemptId) : undefined}
        title="Mở đợt Test này ở bảng Học thuật"
        sub={kq
          ? (kq.phanTram !== null ? `${kq.phanTram}% tổng` : kq.dungKetQuaDot
            ? <KetQuaDot coDiem={kq.coDiem} yeuCau={kq.yeuCau} dat={kq.dat} sos={kq.sos} cheDo={cheDo} soMonChuaDat={kq.soMonChuaDat} />
            : `${kq.coDiem}/${kq.yeuCau} phần có điểm`)
          : 'chưa có điểm nào'} />

      <Stat label="Kỹ năng cần hỗ trợ"
        value={String(below.length)}
        tone={below.length ? 'danger' : scored.length > khongKyVong ? 'ok' : undefined}
        onClick={below.length ? () => onOpenKn(below[0].category) : undefined}
        title="Mở bảng kỹ năng ở đúng môn chưa đạt đầu tiên"
        sub={below.length
          ? below.map((r) => r.label).join(' · ')
          : !scored.length ? 'chưa có điểm nào'
          : daDatHet ? (cheDo === 'ratio' ? 'mọi môn đạt' : 'mọi môn đạt kỳ vọng')
          : khongKyVong === scored.length ? (data.cycle?.khongCamKet ? 'KCK · không đặt kỳ vọng' : 'chưa có kỳ vọng')
          : 'các môn có kỳ vọng đều đạt'} />

      <Stat label="Case đang mở"
        value={String(openCases.length)}
        tone={openCases.length ? 'warn' : undefined}
        onClick={openCases.length ? () => onOpenKn(openCases[0].category) : undefined}
        title="Mở bảng kỹ năng ở kỹ năng của Case mở đầu tiên"
        sub={openCases.length ? `${runningPlans} PA đang theo dõi${choXacNhan ? ` · ${choXacNhan} chờ xác nhận` : ''}${choNguyenNhan ? ` · ${choNguyenNhan} chờ nguyên nhân` : ''}${choKeHoach ? ` · ${choKeHoach} chờ kế hoạch` : ''}` : 'không có case nào đang mở'} />

    </div>
  );
}

function Stat({ label, value, sub, tone, nho, onClick, title }: {
  label: string; value: string; sub?: ReactNode; tone?: 'ok' | 'warn' | 'danger';
  /** Giá trị là một câu chữ (ô "Việc cần làm tiếp"): chữ nhỏ hơn, cho xuống dòng. */
  nho?: boolean;
  /** Có thì cả ô vẽ thành nút bấm được (R8c) — không có thì vẫn là thẻ tĩnh như cũ. */
  onClick?: () => void; title?: string;
}) {
  const color = tone === 'danger' ? 'text-rose-300'
    : tone === 'warn' ? 'text-amber-200'
    : tone === 'ok' ? 'text-emerald-300' : 'text-slate-100';
  const Khung = onClick ? 'button' : 'div';
  return (
    <Khung type={onClick ? 'button' : undefined} onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 min-w-0 text-left w-full appearance-none bg-transparent group ${onClick ? '' : ''}`}
      style={{ borderColor: 'var(--line)' }} title={onClick ? title : undefined}>
      <span className="block text-[11px] text-slate-500">{label}</span>
      <span className={`block font-semibold mt-0.5 break-words ${nho ? 'text-sm leading-snug' : 'text-lg leading-tight'} ${color} ${onClick ? 'group-hover:underline' : ''}`}>{value}</span>
      {sub && <span className="block text-[11px] text-slate-500 mt-0.5">{sub}</span>}
    </Khung>
  );
}

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
  const nhanCua = (a: any): { chu: string; title: string }[] => [
    ...(a.status === 'cancelled' ? [{ chu: 'đã huỷ', title: 'Lượt này đã huỷ.' }] : []),
    ...(a.huyPhan ? [{ chu: 'huỷ phần', title: 'Có kỹ năng bị huỷ phần thi.' }] : []),
    ...(a.doiKyNang?.length ? [{
      chu: `dời ${a.doiKyNang.map((k: string) => skillShort(k)).join(' ')}`,
      title: `Dời do vắng: ${a.doiKyNang.map((k: string) => skillLabel(k)).join(', ')}.`,
    }] : []),
  ];
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
            <Th align="right" hint="Band tổng của lượt, tính theo quy tắc IELTS. Thiếu một kỹ năng thì chưa có Overall.">Overall</Th>
            <Th align="right" hint="Mức mong đợi của chính đợt Test đó, tính theo mục tiêu tại thời điểm ấy. Đổi mục tiêu không chấm lại quá khứ.">Kỳ vọng</Th>
            <Th hint="Tiến độ chấm và kết luận của đợt: số kỹ năng dưới kỳ vọng — chính là mức SOS. Thiếu điểm thì chưa kết luận.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => {
            const nhan = nhanCua(a);
            return (
              <tr key={a.id} id={`dot-${a.id}`} className="row-hover cursor-pointer" onClick={() => onOpen(a)}
                style={a.id === dotId ? { background: 'var(--accent-soft)' } : undefined}>
                <td className="td whitespace-nowrap">
                  <Link to={attemptHref(a)} className="link tabular-nums" onClick={(e) => e.stopPropagation()}>MT{a.attemptNo}</Link>
                  {a.lichSu && <> <ChipLichSu /></>}
                  {nhan.slice(0, a.lichSu ? 1 : 2).map((x) => (
                    <span key={x.chu} title={x.title}
                      className="ml-1 inline-flex items-center whitespace-nowrap rounded border border-muted-line px-[5px] align-middle text-[11.5px] leading-4 text-muted">
                      {x.chu}
                    </span>
                  ))}
                  {nhan.length > (a.lichSu ? 1 : 2) && (
                    <span className="ml-1 text-[11.5px] text-muted" title={nhan.slice(a.lichSu ? 1 : 2).map((x) => x.title).join(' ')}>
                      +{nhan.length - (a.lichSu ? 1 : 2)}
                    </span>
                  )}
                </td>
                <td className="td text-slate-300">{a.classCode ?? '—'}</td>
                <td className="td whitespace-nowrap">
                  {a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>Chưa có tuần</Info>}
                </td>
                <td className={so}>{fmtBand(a.bands?.listening)}</td>
                <td className={so}>{fmtBand(a.bands?.reading)}</td>
                <td className={so}>{fmtBand(a.bands?.writing)}</td>
                <td className={so}>{fmtBand(a.bands?.speaking)}</td>
                <td className={`${so} text-slate-100`}>{fmtBand(a.overall)}</td>
                <td className={so}>{fmtBand(a.expectation)}</td>
                <td className="td">
                  <KetQuaDot coDiem={a.scored} yeuCau={a.required} dat={a.evaluable ? a.sosLevel === 0 : null} sos={a.sosLevel ?? null} />
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
 */
function RatioAttempts({ attempts, dotId, homNay, onOpen, ct = null }: {
  attempts: any[]; dotId?: number; homNay: string | null; onOpen: (a: any) => void;
  /** Mã chương trình lộ trình — tên môn FOU G+V/P, Pre FOU Tổng hợp (MH2). */
  ct?: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr>
            <Th hint="Giữa khoá hay Cuối khoá của khoá học.">Bài</Th>
            <th className="th">Lớp</th>
            <Th hint="Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.">Tuần</Th>
            <Th hint="Số câu đúng / tổng số câu từng môn. Đạt khi từ 70% trở lên.">Điểm từng phần</Th>
            <Th hint="Giữa khoá: số môn đạt trên tổng, kèm môn không đạt. Cuối khoá: % tổng. Môn chưa có điểm không tính là chưa đạt.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} id={`dot-${a.id}`} className="row-hover cursor-pointer" onClick={() => onOpen(a)}
              style={a.id === dotId ? { background: 'var(--accent-soft)' } : undefined}>
              <td className="td whitespace-nowrap">{a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá'}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>Chưa có tuần</Info>}
              </td>
              <td className="td">
                <span className="flex flex-wrap gap-1">
                  {(a.skills ?? []).map((s: any) => (
                    <Outcome key={s.skill} tone={s.outcome === 'missing' ? 'muted' : s.outcome === 'pass' ? 'ok' : 'warn'}
                      title={s.label}>
                      {tenMonNgan(ct, s.skill)} {s.score !== null ? `${s.score}/${s.total}` : '—'}
                    </Outcome>
                  ))}
                </span>
              </td>
              <td className="td">
                <KetQuaThuongO a={a} ct={ct} />
                {a.provisional && <div className="text-xs text-slate-400">mới {a.scored}/{a.required} môn</div>}
                <Link to={attemptHref(a)} className="link text-[11px]" onClick={(e) => e.stopPropagation()}>Hồ sơ đợt ›</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** PR-LT2a (T58): kết quả một lượt lớp thường — `2/4 môn đạt` + `Không đạt: L R` (Giữa khoá), `64%` (Cuối khoá); không có chữ SOS. */
function KetQuaThuongO({ a, ct }: { a: any; ct: string | null }) {
  if (a.sosLevel === null && a.scored === 0) return <Level tone="muted">Chờ {a.required - a.scored} môn</Level>;
  const kq = nhanKetQuaThuong({
    kind: a.kind === 'final' ? 'final' : 'progress', ct, scored: a.scored, required: a.required,
    failedSkills: (a.skills ?? []).filter((s: any) => s.outcome === 'fail').map((s: any) => s.skill as string),
    tyLeTong: a.tyLeTong ?? null, khongChiaMon: !!ct && CHUONG_TRINH_KHONG_CHIA_MON.includes(ct),
  });
  return (
    <>
      <Level tone={a.sosLevel === null ? (kq.dat ? 'ok' : 'muted') : sosTone(a.sosLevel)}>{kq.chinh}</Level>
      {kq.phu && <div className="text-xs text-slate-400">{kq.phu}</div>}
    </>
  );
}

/**
 * MỘT CHƯƠNG của hành trình.
 *
 * Chương có nhiều sự kiện thì mặc định gấp lại, chỉ hiện dòng mở đầu và số việc bên trong —
 * người đọc quét cả năm tháng trong một màn hình, mở ra khi thực sự muốn xem chi tiết.
 */
export function Episode({ ep, onOpenCase }: { ep: any; onOpenCase: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  /* PR-CT (Q17): chương có sự kiện Xác nhận bàn giao → nút mở lại phiếu (chỉ đọc nếu người xem không phải GVCN lớp cũ). */
  const banGiao = ep.events.find((e: any) => e.banGiao?.lopNguonId)?.banGiao ?? null;
  const many = ep.events.length > 1;
  const caseId = ep.kind === 'case' ? Number(String(ep.link).split('/').pop()) : null;

  return (
    <li className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-xs text-slate-500 tabular-nums">
          {ep.from === ep.to ? ngay(ep.from) : `${ngay(ep.from)} → ${ngay(ep.to)}`}
        </span>
        <span className="text-sm text-slate-100 min-w-0">{ep.title}</span>
        {many && <Info>{ep.events.length} mốc</Info>}
      </div>

      {/*
        Chương một sự kiện: tiêu đề ĐÃ LÀ nội dung, chỉ hiện thêm phần chi tiết nếu có.
        Lặp lại y hệt tiêu đề ngay bên dưới chỉ làm hành trình dài gấp đôi mà không thêm gì.
      */}
      {!many && ep.events[0].detail && (
        <p className="text-xs text-slate-400 mt-1 mb-0">{ep.events[0].detail}</p>
      )}
      {open && many && (
        <ol className="mt-2 space-y-1 list-none p-0 m-0">
          {ep.events.map((e: any) => (
            <li key={e.id} className="flex gap-3 items-start">
              <span className="text-[11px] text-slate-500 w-20 shrink-0 tabular-nums pt-0.5">{ngay(e.eventDate)}</span>
              <span className="min-w-0">
                <span className="block text-sm text-slate-200">
                  {e.title}
                  <span className="text-[11px] text-slate-500 ml-2">
                    {JOURNEY_EVENT_LABEL[e.eventType] ?? e.eventType}
                  </span>
                </span>
                {e.detail && <span className="block text-xs text-slate-400">{e.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2 mt-1">
        {many && (
          <button className="btn btn-sm btn-ghost" onClick={() => setOpen((v) => !v)}>
            {open ? 'Thu gọn' : `Xem ${ep.events.length} mốc`}
          </button>
        )}
        {caseId && (
          <button className="btn btn-sm btn-ghost" onClick={() => onOpenCase(caseId)}>Mở vấn đề</button>
        )}
        {banGiao && (
          <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/hoc-vien/lop/${banGiao.lopNguonId}?viec=ban-giao&lenh=${banGiao.lenhId}`)}>Đọc bàn giao</button>
        )}
      </div>
    </li>
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
