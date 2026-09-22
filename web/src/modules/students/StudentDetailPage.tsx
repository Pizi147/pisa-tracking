import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Info, Level, Outcome, SectionNote, Skeleton, Status, Th} from '../../ui/ui.tsx';
import { Drawer, Modal } from '../../ui/Drawer.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { CasePanel } from '../cases/CasePanel.tsx';
import { SkillBoard, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import { JourneyTimeline } from './JourneyTimeline.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { StudentPlanPanel } from './StudentPlanPanel.tsx';
import { StudentManagePanel } from './StudentManagePanel.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { StudentYThucSection } from '../yThuc/StudentYThucSection.tsx';
import {
  attemptHref,
  attemptStatusLabel, fmtBand, fmtDate, skillLabel, sosLabel, sosTone, studentStatusLabel,
} from '../../lib/format.ts';
import { HO_SO_TAB_LABEL, JOURNEY_EVENT_LABEL, ketQuaTestGanNhat, parseHoSoTab, type HoSoTab } from '@shared/domain/index.ts';
import { HangTab } from '../../ui/HangTab.tsx';
import { KetQuaDot } from '../../ui/KetQuaDot.tsx';

type Profile = any;

/**
 * HỒ SƠ HỌC VIÊN.
 *
 * Trang này phải trả lời được trong khoảng ba mươi giây: em bắt đầu ở đâu, đang ở đâu,
 * đích ở đâu, có đang theo kịp không, đang vướng gì, ai đã làm gì, và bước tiếp theo là gì.
 *
 * BỐ CỤC (chủ sản phẩm chốt 22/09/2026, spec PR-HV — thay ba tầng của bản 13/09):
 *
 *   Đầu trang    EM NÀY LÀ AI          tên, lớp, GVCN, mục tiêu; nút Lộ trình · + Case · ⋮
 *   Bốn ô số     LIẾC MỘT CÁI          Kết quả Test gần nhất · Kỹ năng cần hỗ trợ · Case đang mở · Việc cần làm tiếp
 *   Ba tab       Học thuật (mặc định: bảng kỹ năng + case, rồi Mock Test) · Ý thức & Phối hợp · Hành trình
 *
 * Tab nằm NGAY DƯỚI đầu trang, không dồn xuống cuối; tab nhớ qua địa chỉ `?tab=`.
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
  const [params, setParams] = useSearchParams();
  const cycleParam = params.get('lo-trinh');
  const q = cycleParam ? `?cycleId=${cycleParam}` : '';
  const { data, loading, error, reload } = useApi<Profile>(id ? `/students/${id}${q}` : null, [cycleParam]);
  const [manageOpen, setManageOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  /** Tín hiệu đang được xác minh — mở form case với đầu mục và kỹ năng điền sẵn. */
  const [verify, setVerify] = useState<any | null>(null);
  const [openCase, setOpenCase] = useState<number | null>(null);
  /*
   * HẠNG MỤC ĐANG LỌC — một state duy nhất nối bảng kỹ năng với khối case bên dưới.
   * Bấm "Reading" ở bảng trên là khối dưới chỉ còn case Reading; bấm lại thì bỏ lọc.
   */
  const [skillPick, setSkillPick] = useState<string | null>(null);
  /** Hành trình: chỉ mốc xuyên chương trình, hay toàn bộ ghi nhận (mục 4.5). */
  const [allJourney, setAllJourney] = useState(false);
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
  /* Tab đang xem đọc từ địa chỉ (A6); đổi tab là `replace` để nút Quay lại của trình duyệt không phải bấm nhiều lần. */
  const tab = parseHoSoTab(params.get('tab'));
  const setTab = (t: HoSoTab) => {
    const next = new URLSearchParams(params);          // giữ nguyên 'lo-trinh'
    if (t === 'hoc-thuat') next.delete('tab'); else next.set('tab', t);
    setParams(next, { replace: true });
  };
  /* A5: dấu ⚠ trên tab Ý thức. Cùng đường với khối bên trong — useApi tự tải lại khi '/students' bị vô hiệu. */
  const warn = useApi<{ message: string }>(id ? `/students/${id}/violation-warning` : null, [id]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const cy = data.cycle;

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
        <div className="rounded-xl border p-3 sm:p-4"
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
                {data.currentClass
                  ? <>{data.currentClass.code} · {data.currentClass.programme ?? data.currentClass.branchName}
                      {data.currentClass.coreTeacher && <> · GVCN {data.currentClass.coreTeacher}</>}</>
                  : 'Chưa xếp lớp'}
                {cy && !cy.ratio && cy.target !== null && <> · mục tiêu {fmtBand(cy.target)}</>}
                {cy?.ratio && cy.endWeek && <> · kết thúc {cy.endWeek.code}</>}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-start">
              {data.journeyStrip?.length > 1 && (
                <button className={`btn ${cycleOpen ? 'btn-primary' : ''}`}
                  onClick={() => setCycleOpen(!cycleOpen)}>Lộ trình</button>
              )}
              {data.viewer.canReport && (
                <button className="btn btn-primary" onClick={() => setReportOpen(true)}>+ Case</button>
              )}
              <button className="btn" title="Quản lý học viên" aria-label="Quản lý học viên"
                onClick={() => setManageOpen(true)}>⋮</button>
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
              {data.journeyStrip.map((j: any, i: number) => (
                <span key={j.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-700" aria-hidden>→</span>}
                  <button className={`btn btn-sm ${j.id === cy?.id ? 'btn-primary' : ''}`}
                    onClick={() => setCycle(j.id)}>
                    {j.label}
                    {j.current && <span className="opacity-70 ml-1">· đang học</span>}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BỐN Ô SỐ (Q7) — bốn câu hỏi, không phải một phép chia. LUÔN hiện phía trên hàng tab, kể cả khi chưa có lộ trình (spec §4.1; chủ sản phẩm chốt 22/09 sau rà soát). */}
      <HeaderStats data={data} rows={skillRows} />

      {/* Xác minh SOS: giữ chỗ cũ — dưới 4 ô số, trên hàng tab; tự ẩn khi không có tín hiệu. */}
      <PendingSignals signals={data.pendingSignals ?? []} onVerify={(sg) => setVerify(sg)} />

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
          <Card title="Tiến độ và hỗ trợ theo kỹ năng"
            action={<span className="text-xs text-slate-500">Bấm một hàng để mở chi tiết ngay bên dưới</span>}
            bodyClass="p-0">
            <SkillBoard rows={skillRows}
              loading={board.loading} error={board.error} onRetry={board.reload}
              selected={skillPick}
              onPick={setSkillPick}
              onReport={() => setReportOpen(true)}
              onChanged={() => { board.reload(); reload(); }} />
          </Card>

          {/*
            TÊN KHỐI GỌI ĐÚNG THEO CHƯƠNG TRÌNH (mục 7.11): lớp Fast Track là "Mock Test",
            lớp Normal là "Kết quả kiểm tra". Cụm "Điểm qua các lượt" đã bỏ — nó không phải
            tiếng Việt ai dùng, và nó đúng với cả hai loại lớp nên chẳng nói được gì.
          */}
          <Card title={cy.ratio ? 'Kết quả kiểm tra' : 'Mock Test'} bodyClass="p-0">
            {data.attempts.length === 0 ? (
              <div className="p-4"><Empty title="Chưa có lượt đánh giá nào trong lộ trình này" /></div>
            ) : cy.ratio ? <RatioAttempts attempts={data.attempts} onOpen={(a) => navigate(attemptHref(a))} />
              : <IeltsAttempts attempts={data.attempts} onOpen={(a) => navigate(attemptHref(a))} />}
            <div className="p-3">
              <SectionNote>
                Lớp ghi ở đây là lớp TẠI LÚC ĐÁNH GIÁ — chuyển lớp không viết lại lịch sử này.
                Số MT đánh lại từ 1 khi sang lộ trình mới, học tiếp trong cùng lộ trình thì tăng tiếp.
              </SectionNote>
              {cy.targetRevisions.length > 0 && (
                <p className="text-xs text-slate-500 mt-2 mb-0">
                  Mục tiêu đã đổi {cy.targetRevisions.length} lần — lần gần nhất {fmtDate(cy.targetRevisions[0].effectiveFrom)}:
                  {' '}{fmtBand(cy.targetRevisions[0].oldTarget)} → {fmtBand(cy.targetRevisions[0].newTarget)}
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
                <SectionNote>
                  Chưa ghi điểm đầu vào nên chưa tính được đã tiến bộ bao nhiêu. Hệ thống KHÔNG lấy
                  MT1 làm điểm đầu vào — hai thứ đó khác nhau.
                </SectionNote>
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
            onGoAcademic={() => setTab('hoc-thuat')} />
        </Card>
      )}

      {tab === 'hanh-trinh' && (
        <Card title="Hành trình học tập" bodyClass="p-4 space-y-4">
          {/*
            DÒNG THỜI GIAN NGANG, KHÔNG LẶP LẠI BIỂU ĐỒ ĐIỂM.

            Bản trước vẽ thêm một biểu đồ điểm ở đây, đúng cái biểu đồ đã có trong từng
            hàng kỹ năng ở khối trên. Hai hình giống nhau trên một trang thì người đọc
            phải so xem chúng có khác gì không — mất công mà không thêm thông tin.

            Ở đây câu hỏi khác: CẢ HÀNH TRÌNH đã diễn ra theo trình tự nào. Nên nó là
            một dòng thời gian theo tuần, mỗi case một nhóm, mỗi phương án một làn.
          */}
          {cy && <JourneyTimeline rows={skillRows} progress={data.progress ?? null} onOpenCase={setOpenCase} />}

          <div>
            {/*
              MỐC XUYÊN CHƯƠNG TRÌNH (mục 4.5): vào học, vào lớp, chuyển chương trình,
              đổi target hay kế hoạch thi, bàn giao case, kết quả thi thật, kết luận lộ
              trình. Mọi cập nhật phương án đã nằm trong hàng kỹ năng ở khối trên —
              kể lại lần nữa ở đây chỉ làm cả hai chỗ cùng dài ra mà không rõ hơn.
            */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-slate-200 m-0">
                {allJourney ? 'Toàn bộ ghi nhận' : 'Các mốc đã qua'}
              </h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setAllJourney(!allJourney)}>
                {allJourney ? 'Chỉ xem mốc chính' : 'Mở toàn hành trình'}
              </button>
            </div>
            {(() => {
              const eps = allJourney ? (data.allEpisodes ?? data.episodes) : data.episodes;
              return eps.length === 0 ? <Empty title="Chưa có sự kiện nào" /> : (
                <ol className="space-y-3 list-none p-0 m-0">
                  {eps.map((ep: any) => <Episode key={ep.key} ep={ep} onOpenCase={setOpenCase} />)}
                </ol>
              );
            })()}
            <SectionNote>
              Phần này là hành trình của CẢ em, không riêng lộ trình đang xem: lớp cũ, lộ
              trình cũ và case đã bàn giao đều tra lại được ở đây.
            </SectionNote>
          </div>
        </Card>
      )}

      {/* ============================================== hộp thoại */}
      {planOpen && cy && (
        <StudentPlanPanel
          cycleId={cy.id}
          studentName={data.fullName}
          ratio={!!cy.ratio}
          onClose={() => setPlanOpen(false)}
          onDone={reload}
        />
      )}

      <QuickReport open={reportOpen} onClose={() => setReportOpen(false)}
        studentId={data.id} studentName={data.fullName} cycleId={cy?.id ?? null}
        onDone={(cid) => { reload(); setOpenCase(cid); }} />

      {/* Mở case ĐỂ TRẢ LỜI một tín hiệu: đầu mục và kỹ năng điền sẵn, nhận định do người viết. */}
      <QuickReport open={!!verify} onClose={() => setVerify(null)}
        studentId={data.id} studentName={data.fullName} cycleId={cy?.id ?? null}
        signal={verify}
        onDone={(cid) => { setVerify(null); reload(); setOpenCase(cid); }} />

      {/* Không có nút mở trang riêng: route `/hoc-thuat/case/:id` vẫn còn cho link sâu từ thông báo. */}
      <Drawer open={openCase !== null} onClose={() => setOpenCase(null)} title="Vấn đề - Case"
        subtitle={data.fullName}>
        {openCase !== null && <CasePanel caseId={openCase} compact />}
      </Drawer>

      <StudentManagePanel
        open={manageOpen} onClose={() => setManageOpen(false)}
        student={{
          id: data.id, name: data.fullName, classId: data.currentClass?.id ?? null,
          dob: data.dob ?? null, consultantName: data.consultantName ?? null, note: data.note ?? null,
        }}
        cycle={cy} attempts={data.attempts} canEdit={data.viewer.canEdit}
        onOpenPlan={() => setPlanOpen(true)} onDone={reload}
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
 * Mỗi ô nói ĐÚNG MỘT điều. Ô KHÔNG bấm được — ô bấm được là việc của PR-R.
 */
function HeaderStats({ data, rows }: { data: any; rows: SkillBoardRow[] | null }) {
  const scored = (rows ?? []).filter((r) => r.band !== null);
  const below = scored.filter((r) => r.missed === true);
  const openCases = (rows ?? []).flatMap((r) => r.cases).filter((c) => c.status !== 'done');
  const runningPlans = openCases.flatMap((c) => c.plans)
    .filter((p) => p.status === 'planned' || p.status === 'started').length;
  const next = data.headline?.next ?? null;
  const kq = ketQuaTestGanNhat(data.attempts ?? []);

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Stat label="Kết quả Test gần nhất"
        value={kq ? kq.nhan : '—'}
        sub={kq
          ? (kq.dungKetQuaDot
            ? <KetQuaDot coDiem={kq.coDiem} yeuCau={kq.yeuCau} dat={kq.dat} sos={kq.sos} />
            : `${kq.coDiem}/${kq.yeuCau} phần có điểm`)
          : 'chưa có điểm nào'} />

      <Stat label="Kỹ năng cần hỗ trợ"
        value={String(below.length)}
        tone={below.length ? 'danger' : scored.length ? 'ok' : undefined}
        sub={below.length
          ? below.map((r) => r.short ?? r.label).join(' · ')
          : scored.length ? 'mọi môn đạt kỳ vọng' : 'chưa có điểm nào'} />

      <Stat label="Case đang mở"
        value={String(openCases.length)}
        tone={openCases.length ? 'warn' : undefined}
        sub={openCases.length ? `${runningPlans} PA đang theo dõi` : 'không có case nào đang mở'} />

      <Stat label="Việc cần làm tiếp" nho
        value={next?.text ?? 'Không có'}
        tone={next?.overdue ? 'danger' : undefined}
        sub={next?.due
          ? `${next.overdue ? 'quá hạn' : 'hạn'} ${fmtDate(next.due)}`
          : next ? 'chưa đặt hạn' : 'không có việc nào đang chờ'} />
    </div>
  );
}

function Stat({ label, value, sub, tone, nho }: {
  label: string; value: string; sub?: ReactNode; tone?: 'ok' | 'warn' | 'danger';
  /** Giá trị là một câu chữ (ô "Việc cần làm tiếp"): chữ nhỏ hơn, cho xuống dòng. */
  nho?: boolean;
}) {
  const color = tone === 'danger' ? 'text-rose-300'
    : tone === 'warn' ? 'text-amber-200'
    : tone === 'ok' ? 'text-emerald-300' : 'text-slate-100';
  return (
    <div className="rounded-xl border px-3 py-2.5 min-w-0" style={{ borderColor: 'var(--line)' }}>
      <span className="block text-[11px] text-slate-500">{label}</span>
      <span className={`block font-semibold mt-0.5 break-words ${nho ? 'text-sm leading-snug' : 'text-lg leading-tight'} ${color}`}>{value}</span>
      {sub && <span className="block text-[11px] text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}

function IeltsAttempts({ attempts, onOpen }: { attempts: any[]; onOpen: (a: any) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
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
            <tr key={a.id} className="row-hover cursor-pointer" onClick={() => onOpen(a)}>
              <td className="td tabular-nums">MT{a.attemptNo}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.periodCode ?? <Info pending>Chưa có tuần</Info>}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Lớp Normal chấm theo ĐIỂM ĐẠT / TỔNG ĐIỂM — không có band, không có Overall, không có
 * kỳ vọng IELTS. Bấm một dòng ở đây mở BẢNG ĐIỂM LỚP NORMAL, không phải màn Mock Test.
 */
function RatioAttempts({ attempts, onOpen }: { attempts: any[]; onOpen: (a: any) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <Th hint="Progress Test (giữa khoá) hay Final Test (cuối khoá) của chương trình lớp.">Bài</Th>
            <th className="th">Lớp</th>
            <Th hint="Tuần kế hoạch của lượt này. Một lượt chỉ thuộc đúng một tuần — không có ngày thi cụ thể.">Tuần</Th>
            <Th hint="Điểm đạt trên tổng điểm của từng môn. Lớp Normal không quy ra band.">Điểm từng phần</Th>
            <Th hint="Số kỹ năng dưới kỳ vọng của đợt Test đó — chính là mức SOS. Thiếu điểm thì chưa kết luận.">Kết quả</Th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="row-hover cursor-pointer" onClick={() => onOpen(a)}>
              <td className="td whitespace-nowrap">{a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá'}</td>
              <td className="td text-slate-300">{a.classCode ?? '—'}</td>
              <td className="td whitespace-nowrap">
                {a.periodCode ?? <Info pending>Chưa có tuần</Info>}
              </td>
              <td className="td">
                <span className="flex flex-wrap gap-1">
                  {(a.skills ?? []).map((s: any) => (
                    <Outcome key={s.skill} tone={s.outcome === 'missing' ? 'muted' : s.outcome === 'pass' ? 'ok' : 'warn'}>
                      {s.label} {s.score !== null ? `${s.score}/${s.total}` : '—'}
                    </Outcome>
                  ))}
                </span>
              </td>
              <td className="td">
                <Level tone={sosTone(a.sosLevel)}>
                  {a.sosLevel === null ? `Chờ ${a.required - a.scored} phần` : sosLabel(a.sosLevel)}
                </Level>
                {a.provisional && <div className="text-[10px] text-slate-500">mới {a.scored}/{a.required} phần</div>}
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
function Episode({ ep, onOpenCase }: { ep: any; onOpenCase: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const many = ep.events.length > 1;
  const caseId = ep.kind === 'case' ? Number(String(ep.link).split('/').pop()) : null;

  return (
    <li className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-xs text-slate-500 tabular-nums">
          {ep.from === ep.to ? fmtDate(ep.from) : `${fmtDate(ep.from)} → ${fmtDate(ep.to)}`}
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
              <span className="text-[11px] text-slate-500 w-20 shrink-0 tabular-nums pt-0.5">{fmtDate(e.eventDate)}</span>
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
function PendingSignals({ signals, onVerify }: {
  signals: any[]; onVerify: (sg: any) => void;
}) {
  if (!signals.length) return null;

  const overdue = signals.filter((s) => s.overdue).length;
  return (
    <>
      <Card title="Xác minh vấn đề SOS"
        action={<span className="text-xs text-slate-500">
          {signals.length} tín hiệu{overdue > 0 ? ` · ${overdue} quá hạn` : ''}
        </span>}>
        <ul className="space-y-2 list-none p-0 m-0">
          {signals.map((sg) => (
            <li key={sg.id} className="surface-2 rounded-lg p-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-slate-100">
                  {sg.label}
                  {sg.band !== null && sg.expectation !== null && (
                    <span className="text-slate-400"> · {fmtBand(sg.band)} so với kỳ vọng {fmtBand(sg.expectation)}</span>
                  )}
                  {sg.attemptNo && <span className="text-slate-500 text-xs"> · MT{sg.attemptNo}</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Hệ thống mới chỉ đọc được con số. Xem lại bài rồi quyết định.
                </div>
                <div className="text-xs mt-1">
                  {sg.overdue
                    ? <span className="text-rose-300">Quá hạn xác minh {fmtDate(sg.verifyDue)}</span>
                    : <span className="text-slate-400">Hạn xác minh {fmtDate(sg.verifyDue)}</span>}
                  {sg.ownerName && <span className="text-slate-500"> · {sg.ownerName}</span>}
                </div>
              </div>
              {sg.canResolve && (
                <button className="btn btn-sm btn-primary" onClick={() => onVerify(sg)}>Mở case</button>
              )}
            </li>
          ))}
        </ul>
        <SectionNote>
          Điểm dưới kỳ vọng chỉ sinh một <strong>tín hiệu cần xác minh</strong>, không tự mở case
          và không tự sinh phương án hỗ trợ: máy đọc được con số nhưng không biết vì sao, và cũng
          không xếp được tutor thay người. Xác minh nghĩa là <strong>mở case</strong> với tên và
          mô tả cụ thể — đó là nhận định của người dạy, máy không viết hộ.
          Hạn là <strong>ba ngày</strong> kể từ lúc tín hiệu được ghi nhận, tính cả ngày đầu.
        </SectionNote>
      </Card>

    </>
  );
}
