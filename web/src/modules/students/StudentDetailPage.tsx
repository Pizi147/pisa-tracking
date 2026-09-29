import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BoLocDoan, Card, DaiChiXem, Empty, ErrorState, Info, Level, Outcome, Skeleton, Status, TargetText, Th} from '../../ui/ui.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { cuonOnDinh } from '../../lib/cuonOnDinh.ts';
import { useToast } from '../../ui/Toast.tsx';
import { SkillBoard, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import { HanhTrinh } from './HanhTrinh.tsx';
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
  attemptStatusLabel, fmtBand, skillLabel, sosLabel, sosTone, studentStatusLabel,
} from '../../lib/format.ts';
import {
  HO_SO_TAB_LABEL, JOURNEY_EVENT_LABEL, caseCategoriesFor, tenMonNgan, docThamSoHoSo, duongHoSoHocVien,
  deadlineView, khoaLopThuong, ketQuaTestGanNhat, ngay, tuanLich, type HoSoTab,
} from '@shared/domain/index.ts';
import { HangTab } from '../../ui/HangTab.tsx';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';
import { Han } from '../../ui/Han.tsx';
import { QuaHan, ChipLichSu } from '../../ui/Nhan.tsx';
import { useSession } from '../../lib/session.tsx';

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
  /** Tín hiệu đang được xác minh — mở form case với đầu mục và kỹ năng điền sẵn. */
  const [verify, setVerify] = useState<any | null>(null);
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
  /* A5: dấu ⚠ trên tab Ý thức. Cùng đường với khối bên trong — useApi tự tải lại khi '/students' bị vô hiệu. */
  const warn = useApi<{ message: string }>(id ? `/students/${id}/violation-warning` : null, [id]);

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
              <p className="text-xs text-slate-400 mt-1 mb-0">
                {/*
                  ĐẦU HỒ SƠ LỚP THƯỜNG (Q18): {mã lớp} · GVCN {tên} · {khoá đang học}, KHÔNG tên
                  chương trình, KHÔNG "Mục tiêu"/"Dự kiến thi" (Q18, §3.8 dòng cuối) — dùng đúng
                  hàm `khoaLopThuong` mà cột Khoá của hồ sơ lớp (PR-Qa) đã dùng, để hai chỗ luôn
                  nói cùng một câu. `tiepTheo`/`nhacLoTrinh` từ `data.lopHoc` (PR-LT, Task 3).
                */}
                {data.currentClass?.khoa
                  ? (() => {
                    const { chinh, phu } = khoaLopThuong({
                      maChuongTrinh: data.currentClass.khoa.ma,
                      tuanHienTai: data.currentClass.khoa.tuanHienTai,
                      tongTuan: data.currentClass.khoa.tongTuan,
                      tuanKetThuc: data.currentClass.khoa.tuanKetThuc,
                      tiepTheo: data.lopHoc?.tiepTheo ?? null,
                      nhacLoTrinh: data.lopHoc?.nhacLoTrinh ?? false,
                      homNay: homNay ?? '',
                    });
                    return (
                      <>
                        {data.currentClass.code}
                        {data.currentClass.coreTeacher && <> · GVCN {data.currentClass.coreTeacher}</>}
                        {' · '}{chinh}{phu ? ` · ${phu}` : ''}
                      </>
                    );
                  })()
                  : data.currentClass
                    ? <>{data.currentClass.code} · {data.currentClass.programme ?? data.currentClass.branchName}
                        {data.currentClass.coreTeacher && <> · GVCN {data.currentClass.coreTeacher}</>}</>
                    : 'Chưa xếp lớp'}
                {cy && !cy.ratio && (cy.target !== null || cy.khongCamKet) && <> · mục tiêu <TargetText band={cy.target} kck={cy.khongCamKet} /></>}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-start">
              {data.journeyStrip?.length > 1 && (
                <button type="button" className="btn" aria-expanded={cycleOpen}
                  onClick={() => setCycleOpen(!cycleOpen)}>Lộ trình <span aria-hidden className="text-[10px] text-slate-400">{cycleOpen ? '▾' : '▸'}</span></button>
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

      {/* BỐN Ô SỐ (Q7, R8c/Q11) — bốn câu hỏi, không phải một phép chia. LUÔN hiện phía trên hàng tab, kể cả khi chưa có lộ trình (spec §4.1; chủ sản phẩm chốt 22/09 sau rà soát). */}
      <HeaderStats data={data} rows={skillRows} homNay={homNay}
        onOpenDot={(attemptId) => navigate(duongHoSoHocVien(data.id, { dot: attemptId }))}
        onOpenKn={moKyNang} />

      {/* Xác minh SOS: giữ chỗ cũ — dưới 4 ô số, trên hàng tab; tự ẩn khi không có tín hiệu. */}
      <PendingSignals signals={data.pendingSignals ?? []} onVerify={(sg) => setVerify(sg)} onReload={reload} />

      {/*
        BA TAB NGAY DƯỚI ĐẦU TRANG (D2, spec 2026-09-22): Học thuật (mặc định) · Ý thức & Phối hợp · Hành trình.
        Tab nhớ qua địa chỉ `?tab=` (A6) để Việc cần làm / hồ sơ lớp mở thẳng đúng tab — không nhớ bằng localStorage.
        Không có lộ trình thì chỉ tab Học thuật trống; tab Ý thức và Hành trình vẫn mở được (J8).
      */}
      <HangTab ariaLabel="Nội dung hồ sơ học viên" value={tab} onChange={setTab}
        tabs={[
          { key: 'hoc-thuat', label: HO_SO_TAB_LABEL['hoc-thuat'] },
          { key: 'y-thuc', label: HO_SO_TAB_LABEL['y-thuc'], canhBao: !!warn.data?.message },
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
              : <IeltsAttempts attempts={data.attempts} dotId={p.dot} homNay={homNay} onOpen={(a) => navigate(attemptHref(a))} />}
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
          <StudentYThucSection studentId={data.id} studentName={data.fullName}
            canRecordViolation={!!data.viewer.canRecordViolation}
            canManageDiscipline={!!data.viewer.canManageDiscipline}
            canhBao={warn.data ?? null}
            onGoAcademic={() => setTab('hoc-thuat')} />
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
        onDone={(cid) => { reload(); setOpenCase({ caseId: cid }); }} />

      {/* Tạo Case ĐỂ TRẢ LỜI một tín hiệu: đầu mục và kỹ năng điền sẵn, nhận định do người viết. */}
      <QuickReport open={!!verify} onClose={() => setVerify(null)}
        studentId={data.id} studentName={data.fullName} lop={data.currentClass?.code} cycleId={cy?.id ?? null}
        signal={verify}
        onDone={(cid) => { setVerify(null); reload(); setOpenCase({ caseId: cid }); }} />

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
  const openCases = (rows ?? []).flatMap((r) => r.cases.map((c) => ({ ...c, category: r.category })))
    .filter((c) => c.status !== 'done');
  const runningPlans = openCases.flatMap((c) => c.plans)
    .filter((p) => p.status === 'planned' || p.status === 'started').length;
  const next = data.headline?.next ?? null;
  const kq = ketQuaTestGanNhat(data.attempts ?? [], homNay);
  const cheDo = data.cycle?.ratio ? 'ratio' as const : 'ielts' as const;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Stat label="Kết quả Test gần nhất"
        value={kq ? kq.nhan : '—'}
        onClick={kq ? () => onOpenDot(kq.attemptId) : undefined}
        title="Mở đợt Test này ở bảng Học thuật"
        sub={kq
          ? (kq.dungKetQuaDot
            ? <KetQuaDot coDiem={kq.coDiem} yeuCau={kq.yeuCau} dat={kq.dat} sos={kq.sos} cheDo={cheDo} soMonChuaDat={kq.soMonChuaDat} />
            : `${kq.coDiem}/${kq.yeuCau} phần có điểm`)
          : 'chưa có điểm nào'} />

      <Stat label="Kỹ năng cần hỗ trợ"
        value={String(below.length)}
        tone={below.length ? 'danger' : scored.length ? 'ok' : undefined}
        onClick={below.length ? () => onOpenKn(below[0].category) : undefined}
        title="Mở bảng kỹ năng ở đúng môn chưa đạt đầu tiên"
        sub={below.length
          ? below.map((r) => r.label).join(' · ')
          : scored.length ? (cheDo === 'ratio' ? 'mọi môn đạt' : 'mọi môn đạt kỳ vọng') : 'chưa có điểm nào'} />

      <Stat label="Case đang mở"
        value={String(openCases.length)}
        tone={openCases.length ? 'warn' : undefined}
        onClick={openCases.length ? () => onOpenKn(openCases[0].category) : undefined}
        title="Mở bảng kỹ năng ở kỹ năng của Case mở đầu tiên"
        sub={openCases.length ? `${runningPlans} PA đang theo dõi` : 'không có case nào đang mở'} />

      <Stat label="Việc cần làm tiếp" nho
        value={next?.text ?? 'Không có'}
        tone={next?.overdue ? 'danger' : undefined}
        onClick={next ? () => onOpenKn(next.category) : undefined}
        title="Mở bảng kỹ năng ở đúng kỹ năng của việc này"
        sub={next?.loai === 'cap-nhat-pa' && next.due
          /* PR-N1 (K3 §4c, mockup 20): việc ghi kết quả PA nói TUẦN + hạn hết Thứ Hai + quá hạn n ngày — cùng luật <Han>. */
          ? (() => {
            const v = deadlineView({ kind: 'cap-nhat-pa', due: next.due, today: homNay ?? '' });
            return <span className="tabular-nums">{v.viec.replace(/^Ghi kết quả /, '')} · {v.han}{v.quaHan && <> <QuaHan ngay={v.daysOverdue} /></>}</span>;
          })()
          : next?.due
          ? (next.overdue
            ? <QuaHan ngay={Math.max(1, Math.round((Date.parse(`${(homNay ?? '').slice(0, 10)}T00:00:00Z`) - Date.parse(`${next.due.slice(0, 10)}T00:00:00Z`)) / 86_400_000))} />
            : `hạn ${ngay(next.due, homNay)}`)
          : next ? 'chưa đặt hạn' : 'không có việc nào đang chờ'} />
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

function IeltsAttempts({ attempts, dotId, homNay, onOpen }: {
  attempts: any[]; dotId?: number; homNay: string | null; onOpen: (a: any) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr>
            <Th hint="Số thứ tự lượt Mock Test trong lộ trình này.">MT</Th>
            <Th hint="Lớp em học VÀO LÚC làm bài này — chuyển lớp không viết lại lịch sử.">Lớp lúc đánh giá</Th>
            <Th hint="Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.">Tuần</Th>
            <Th hint="Lượt đã chấm xong, đang chờ, hay đã huỷ.">Trạng thái</Th>
            <Th hint="Band Listening">L</Th><Th hint="Band Reading">R</Th><Th hint="Band Writing — gộp từ W1 và W2">W</Th><Th hint="Band Speaking">S</Th>
            <Th hint="Band tổng của lượt, tính theo quy tắc IELTS. Thiếu một kỹ năng thì chưa có Overall.">Overall</Th>
            <Th hint="Mức mong đợi của chính đợt Test đó, tính theo mục tiêu tại thời điểm ấy. Đổi mục tiêu không chấm lại quá khứ.">Kỳ vọng</Th>
            <Th hint="Số kỹ năng dưới kỳ vọng của đợt Test đó — chính là mức SOS. Thiếu điểm thì chưa kết luận.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} id={`dot-${a.id}`} className="row-hover cursor-pointer" onClick={() => onOpen(a)}
              style={a.id === dotId ? { background: 'var(--accent-soft)' } : undefined}>
              <td className="td tabular-nums whitespace-nowrap">MT{a.attemptNo}{a.lichSu && <> <ChipLichSu /></>}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.weekStart ? tuanLich(a.weekStart, homNay) : <Info pending>Chưa có tuần</Info>}
              </td>
              <td className="td">
                <Status kind={a.status === 'done' ? 'done' : a.status === 'cancelled' ? 'idle' : 'doing'}>
                  {attemptStatusLabel(a.status)}
                </Status>
              </td>
              <td className="td tabular-nums">{fmtBand(a.bands?.listening)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.reading)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.writing)}</td>
              <td className="td tabular-nums">{fmtBand(a.bands?.speaking)}</td>
              <td className="td tabular-nums text-slate-100">{fmtBand(a.overall)}</td>
              <td className="td tabular-nums">{fmtBand(a.expectation)}</td>
              <td className="td">
                <Level tone={sosTone(a.sosLevel)}>
                  {a.sosLevel === null ? `Chờ ${a.required - a.scored} kỹ năng` : sosLabel(a.sosLevel)}
                </Level>
                {a.provisional && <div className="text-[10px] text-slate-500">mới {a.scored}/{a.required} kỹ năng</div>}
                {a.scopeNote && <div className="text-[10px] text-slate-500">{a.scopeNote}</div>}
                <Link to={attemptHref(a)} className="link text-[10px]" onClick={(e) => e.stopPropagation()}>Hồ sơ đợt ›</Link>
              </td>
            </tr>
          ))}
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
            <Th hint="Số môn chưa đạt — chính là mức SOS. Môn chưa có điểm không tính là chưa đạt.">Kết quả</Th>
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
                <Level tone={sosTone(a.sosLevel)}>
                  {a.sosLevel === null ? `Chờ ${a.required - a.scored} môn` : sosLabel(a.sosLevel)}
                </Level>
                {a.provisional && <div className="text-[10px] text-slate-500">mới {a.scored}/{a.required} môn</div>}
                <Link to={attemptHref(a)} className="link text-[10px]" onClick={(e) => e.stopPropagation()}>Hồ sơ đợt ›</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

/**
 * TÍN HIỆU CHỜ XÁC MINH — khối riêng, đặt TRƯỚC bảng tiến độ và danh sách case.
 *
 * Đây là thứ chặn đầu chuỗi: chừng nào chưa ai xem, chưa ai biết vấn đề thật là gì, nên
 * không có phương án nào để làm và không có kết quả nào để cập nhật.
 *
 * Nó cố ý KHÔNG nằm chung với danh sách case. Một tín hiệu chưa ai xác minh không phải một
 * vấn đề đã được xác định; để lẫn vào nhau là cách chắc chắn nhất để con số "em này đang có
 * mấy vấn đề" nói quá sự thật.
 *
 * Hai lối ra, cả hai đều hợp lệ:
 *   · mở case — khi xem lại bài thấy có vấn đề thật
 *   · ghi nhận đã xem — khi không có vấn đề thật, và phải viết ra vì sao
 */
function PendingSignals({ signals, onVerify, onReload }: {
  signals: any[]; onVerify: (sg: any) => void; onReload: () => void;
}) {
  if (!signals.length) return null;
  const overdue = signals.filter((s) => s.overdue).length;
  return (
    <Card title={<>Xác minh vấn đề SOS <Info title="Tín hiệu chờ người dạy xem bài; hạn 3 ngày.">ⓘ</Info></>}
      action={<span className="text-xs text-slate-500">
        {signals.length} tín hiệu{overdue > 0 ? ` · ${overdue} quá hạn` : ''}
      </span>}>
      <ul className="space-y-2 list-none p-0 m-0">
        {signals.map((sg) => <TinHieuHang key={sg.id} sg={sg} onVerify={onVerify} onReload={onReload} />)}
      </ul>
    </Card>
  );
}

/**
 * Một tín hiệu — sửa sau rà #75 (7): làm Y HỆT `DongTinHieu.tsx` (cùng luồng SOS lớp thường) thay vì
 * tự viết lại thiếu: ô lý do KHÔNG bắt buộc, chặn bấm hai lần khi đang gửi, báo lỗi ra toast, làm mới
 * cả `/my-work` và `/signals` (không chỉ hồ sơ này) sau khi xử lý xong.
 */
function TinHieuHang({ sg, onVerify, onReload }: { sg: any; onVerify: (sg: any) => void; onReload: () => void }) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const boQua = async () => {
    setBusy(true);
    try {
      await api.post(`/signals/pending/${sg.id}/dismiss`, { reason: lyDo.trim() || null });
      toast.push('ok', 'Đã bỏ qua tín hiệu.');
      invalidate('/my-work'); invalidate('/signals');
      onReload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  // form Tạo Case mở từ hồ sơ phải điền sẵn điểm ("Điểm: 26/40") — QuickReport tự thêm nhãn "Điểm:".
  const moCase = () => onVerify({ ...sg, scoreText: sg.score !== null && sg.total !== null ? `${sg.score}/${sg.total}` : null });
  return (
    <li className="surface-2 rounded-lg p-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-slate-100">
          {/* Q19: lớp thường ghi {môn} {đúng}/{tổng} · Giữa|Cuối khoá — không "MT{n}", không "so với kỳ vọng". */}
          {sg.kind === 'normal'
            ? <>{sg.label} {sg.score}/{sg.total} · {sg.attemptKind === 'final' ? 'Cuối khoá' : 'Giữa khoá'}</>
            : <>
                {sg.label}
                {sg.band !== null && sg.expectation !== null && (
                  <span className="text-slate-400"> · {fmtBand(sg.band)} so với kỳ vọng {fmtBand(sg.expectation)}</span>
                )}
                {sg.attemptNo && <span className="text-slate-500 text-xs"> · MT{sg.attemptNo}</span>}
              </>}
        </div>
        <div className="text-xs mt-1">
          <Han loai="xac-minh-sos" han={sg.verifyDue} coViec />
          {sg.ownerName && <span className="text-slate-500"> · {sg.ownerName}</span>}
        </div>
      </div>
      {sg.canResolve && (
        <span className="flex flex-wrap items-center gap-1.5 justify-end">
          {sg.actions?.includes('dismiss') && (
            <>
              <input className="field h-7 text-xs w-36" value={lyDo} maxLength={200} onChange={(e) => setLyDo(e.target.value)}
                placeholder="Lý do (không bắt buộc)" aria-label="Lý do bỏ qua (không bắt buộc)" />
              <button className="btn btn-sm btn-ghost" disabled={busy} onClick={boQua}>Bỏ qua</button>
            </>
          )}
          <button className="btn btn-sm btn-primary" onClick={moCase}>Tạo Case</button>
        </span>
      )}
    </li>
  );
}
