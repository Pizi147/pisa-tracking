import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Level, Outcome, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { Khoi } from '../../ui/KhungPanel.tsx';
import { Nhan, QuaHan, type ToneNhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CHUA_CO_PHUONG_AN, GOI_Y_THEM_PHUONG_AN } from '../../ui/chu.ts';
import { caseStatusLabel, fmtBand, skillLabel, sosLabel, sosTone } from '../../lib/format.ts';
import {
  CASE_CATEGORY_LABEL, INTERVENTION_KIND_LABEL, INTERVENTION_STATUS_LABEL,
  NEXT_STEP_LABEL, OUTCOME_MARK, OUTCOME_TONE,
  deadlineView, outcomeLabelFor,
} from '@shared/domain/index.ts';
import { LichSuDieuChinh, type BanDieuChinh } from './CapNhatTuan.tsx';
import { NganCase } from '../students/NganCase.tsx';

/**
 * MỘT VẤN ĐỀ HỌC VỤ (PR-UX3, N-4, mockup 15 §3) — kể theo hai câu người đọc cần: VẤN ĐỀ gì, và ĐÃ LÀM GÌ (các PA, mỗi PA một
 * thẻ; kết quả các tuần trước ở "Lịch sử cập nhật" thu gọn).
 *
 * Phần THÂN (`ThanCase`) dùng chung cho mọi lối vào: ngăn Case (`NganCase`, một panel đổi nội dung theo `view`) và trang riêng
 * `/hoc-thuat/case/:id` (`CasePanel`, có hàng nút mở ngăn Case). Các thao tác (Ghi kết quả · Thêm PA · Hoàn thành · Trả lời)
 * KHÔNG còn hộp thoại đè lên ngăn — ngăn Case đổi nội dung và có dòng "← Case Listening" để về.
 */

export type CaseDetail = {
  id: number; originKind: string;
  /** Còn thiếu gì để hoàn thành case. Rỗng = đủ điều kiện đóng (mục 7.7 [5]). */
  closeBlockers: string[];
  student: { id: number; code: string; name: string; status: string } | null;
  cycle: { id: number; seq: number; route: string | null; target_score: number | null } | null;
  classId: number | null; attemptId: number | null; attemptNo: number | null;
  sosLevel: number | null; urgency: string | null;
  summary: string | null; headline: string; detectedAt: string; reportedBy: string | null;
  status: string; disposition: string | null; dispositionNote: string | null; closedAt: string | null;
  /** Tên case tự sinh theo mốc mới nhất, ví dụ "MT2 - Listening dưới kỳ vọng". */
  title: string | null;
  /** Hạng mục — đơn vị của case từ vòng 4. */
  category: string | null; categoryLabel: string | null;
  /** Case mở song song có chủ ý với một case khác cùng hạng mục. */
  parallel: boolean;
  /** Lớp chấm điểm đạt/tổng (Normal) hay band 0–9 (Fast Track). */
  ratio: boolean;
  /** Các hạng mục hợp lệ để ghi điểm giáo viên tự chấm. */
  categories: { code: string; label: string }[];
  note: string | null;
  /** Hạn BÁO KẾT QUẢ của cả case — khác hạn ghi kết quả từng phương án. */
  followUntil: string | null; followOverdue: boolean;
  /** Kết quả chung đã chốt. */
  outcome: string | null; outcomeLabel: string | null;
  outcomeNote: string | null; outcomeDecision: string | null; outcomeAt: string | null;
  /** Case bị PR-LT tự đóng khi em chuyển khỏi lớp/khoá (S16/S17) — không phải GV kết luận. */
  systemCloseLabel: string | null;
  /** Mọi phương án đã có kết quả chưa — điều kiện để chốt kết quả chung. */
  canFinish: boolean;
  /** Các mốc trong vòng đời case. Giao diện xếp MỚI NHẤT LÊN ĐẦU (mục 4.3). */
  milestones: any[];
  issues: any[]; interventions: any[]; followups: any[]; history: any[];
  viewer: { canEdit: boolean; canClose: boolean; canApprove: boolean };
};

/** Nội dung của ngăn Case: một `KhungPanel` đổi nội dung theo view, không chồng panel. */
export type ViewCase = { loai: 'case' } | { loai: 'ghi-ket-qua'; paId: number } | { loai: 'them-pa' }
  | { loai: 'hoan-thanh' } | { loai: 'tra-loi'; paId: number };

/** "Case Listening" — tên ngắn của Case cho tiêu đề ngăn và dòng "← Case Listening". */
export function tenNganCase(d: { categoryLabel: string | null; category: string | null }): string {
  const kn = d.categoryLabel ?? (d.category ? CASE_CATEGORY_LABEL[d.category as keyof typeof CASE_CATEGORY_LABEL] ?? d.category : null);
  return kn ? `Case ${kn}` : 'Case';
}

const daBatDau = (iv: any) => iv.status === 'planned' || iv.status === 'started';

/** Tone `Nhan` của trạng thái PA (trạng thái CÔNG VIỆC, không phải kết quả — mục 2.2): xanh dương đang chạy, tím chờ, xám xong/huỷ. */
function toneTrangThaiPa(status: string): ToneNhan {
  return status === 'completed' ? 'done' : status === 'cancelled' ? 'muted' : status === 'planned' ? 'wait' : 'doing';
}

/** Số ngày từ `tu` đến `den` (ISO), `null` khi thiếu. */
function soNgayGiua(tu: string | null | undefined, den: string | null | undefined): number | null {
  if (!tu || !den) return null;
  const a = Date.parse(`${tu.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${den.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(a) || Number.isNaN(b) ? null : Math.round((b - a) / 86_400_000);
}

export function CasePanel({ caseId }: { caseId: number }) {
  const { data, loading, error, reload } = useApi<CaseDetail>(`/cases/${caseId}`);
  const [ngan, setNgan] = useState<ViewCase | null>(null);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-base font-semibold text-slate-100">{data.title ?? data.headline}</h3>
        <Nhan tone={data.status === 'done' ? 'done' : data.status === 'open' ? 'muted' : 'doing'}>{caseStatusLabel(data.status)}</Nhan>
        {data.sosLevel !== null && data.status !== 'done' && <Level tone={sosTone(data.sosLevel)}>{sosLabel(data.sosLevel)}</Level>}
        {data.student && <Link className="link text-xs" to={`/hoc-vien/${data.student.id}`}>{data.student.name}</Link>}
      </div>
      <ThanCase data={data} onViec={setNgan} />
      {data.viewer.canEdit && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm" onClick={() => setNgan({ loai: 'them-pa' })}>+ Thêm PA</button>
          {data.status !== 'done' && data.viewer.canClose && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setNgan({ loai: 'hoan-thanh' })}>Hoàn thành Case</button>
          )}
        </div>
      )}
      {ngan && (
        <NganCase caseId={caseId} viecBanDau={ngan} hocVien={data.student?.name} onClose={() => setNgan(null)} onChanged={reload} />
      )}
    </div>
  );
}

/** Trang riêng cho một vấn đề — chia sẻ được, mở từ mọi nơi về cùng một bản ghi. */
export function CasePage({ caseId }: { caseId: number }) {
  return (
    <div className="max-w-[900px]">
      <Card title="Vấn đề - Case">
        <CasePanel caseId={caseId} />
      </Card>
    </div>
  );
}

/**
 * THÂN của Case: khối Vấn đề · khối Phương án (mỗi PA một thẻ; dòng PA mang `data-pa-id` cho Hành trình cuộn tới) · Lịch sử cập
 * nhật thu gọn · Bằng chứng. Không vỏ, không chân — vỏ là `KhungPanel` của `NganCase` hoặc trang riêng.
 */
export function ThanCase({ data, onViec }: { data: CaseDetail; onViec: (v: ViewCase) => void }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const primary = data.issues.find((i) => i.role === 'primary') ?? null;
  const secondary = data.issues.filter((i) => i.role === 'secondary');
  const context = data.issues.filter((i) => i.role === 'context');
  /* Đang chạy lên trên, đã xong xuống dưới; trong mỗi nhóm, mới nhất trước. */
  const dsPa = [...(data.interventions ?? [])].sort((a, b) =>
    Number(daBatDau(b)) - Number(daBatDau(a)) || (b.id as number) - (a.id as number));
  const lichSu = buildLichSu(data, ngan);
  const chiXem = !data.viewer.canClose && data.status !== 'done';

  return (
    <>
      <Khoi tieuDe="Vấn đề">
        <div>
          <p className="m-0 text-sm font-semibold text-slate-100">{data.title ?? data.headline}</p>
          {data.summary && <p className="m-0 mt-1 text-sm text-slate-300">{data.summary}</p>}
          {data.note && <p className="m-0 mt-1 text-xs text-slate-400">{data.note}</p>}
        </div>
        {(primary || secondary.length > 0 || context.length > 0) && (
          <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            {primary && <span title={primary.observation ?? undefined}>Nhóm nguyên nhân: <span className="text-slate-200">{primary.label}</span></span>}
            {secondary.map((i) => <Nhan key={i.id} tone="muted" title={i.observation ?? undefined}>{i.label}</Nhan>)}
            {context.map((i) => <Nhan key={i.id} tone="muted" dut title={i.observation ?? undefined}>Bối cảnh: {i.label}</Nhan>)}
          </p>
        )}
      </Khoi>

      <Khoi tieuDe={`Phương án · ${dsPa.length}`}
        luat={(
          <>
            <p className="m-0">Mỗi PA có hạn ghi kết quả hằng tuần vào Chủ nhật. Case chỉ hoàn thành được khi mọi PA đã khép.</p>
            {chiXem && <p className="m-0">Chỉ Quản lý, hoặc GVCN dạy đúng môn của Case, mới hoàn thành được Case này. Bạn vẫn ghi được kết quả của từng PA.</p>}
          </>
        )}>
        {dsPa.length === 0 ? (
          <Empty title={CHUA_CO_PHUONG_AN} hint={GOI_Y_THEM_PHUONG_AN} />
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {dsPa.map((iv) => <TheKhoiPa key={iv.id} iv={iv} data={data} homNay={homNay} ngan={ngan} onViec={onViec} />)}
          </ul>
        )}
        {data.outcome || data.status === 'done' ? (
          <p className="m-0 text-sm text-slate-100">
            Đã kết luận{data.outcomeLabel && <>: <strong>{data.outcomeLabel}</strong></>}
            {data.outcomeNote && <span className="text-slate-400"> — {data.outcomeNote}</span>}
            {data.closedAt && <span className="text-slate-500"> · kết thúc theo dõi {ngan(data.closedAt)}</span>}
          </p>
        ) : null}
        {lichSu.length > 0 && (
          <details>
            <summary className="cursor-pointer text-xs text-slate-400">Lịch sử cập nhật ({lichSu.length})</summary>
            <ol className="m-0 mt-2 list-none space-y-2 border-l p-0 pl-3" style={{ borderColor: 'var(--line)' }}>
              {lichSu.map((m) => (
                <li key={m.key} className="text-xs">
                  <span className="block text-[11px] tabular-nums text-slate-500">{ngan(m.on)}{m.dot ? ` · ${m.dot}` : ''}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-slate-200">{m.tieuDe}{m.badge}</span>
                  {m.than}
                </li>
              ))}
            </ol>
          </details>
        )}
      </Khoi>

      <Khoi tieuDe="Bằng chứng">
        <BangChung ownerType="sos_case" ownerId={data.id} canEdit={data.viewer.canEdit} tieuDe="" />
      </Khoi>
    </>
  );
}

/** Một PA = một thẻ nhẹ: tên loại + trạng thái (+ quá hạn bên phải) · mô tả · người · khoảng ngày · hạn ghi kết quả · nút. */
function TheKhoiPa({ iv, data, homNay, ngan, onViec }: {
  iv: any; data: CaseDetail; homNay: string; ngan: (d: string | null | undefined) => string; onViec: (v: ViewCase) => void;
}) {
  const dangChay = daBatDau(iv);
  const choDuyet = iv.approvalState === 'pending';
  const hanGhi = iv.actionDue && dangChay ? deadlineView({ kind: 'cap-nhat-pa', due: iv.actionDue, today: homNay }) : null;
  const revisions: BanDieuChinh[] = iv.revisions ?? [];
  const all: any[] = data.interventions ?? [];
  const tenPA = (x: any) => x.description || INTERVENTION_KIND_LABEL[x.kind as keyof typeof INTERVENTION_KIND_LABEL] || x.kind;
  const thayBang = iv.supersededBy ? all.find((x) => x.id === iv.supersededBy) ?? null : null;
  const thayCho = all.find((x) => x.supersededBy === iv.id) ?? null;
  const batDau = iv.startedDate ?? iv.plannedDate ?? null;
  const ketThuc = iv.completedDate ?? iv.followupDue ?? null;
  const khoang = batDau && ketThuc ? `${ngan(batDau)} → ${ngan(ketThuc)}` : batDau ? `từ ${ngan(batDau)}` : ketThuc ? `đến ${ngan(ketThuc)}` : null;
  const nguoi = iv.performer ? `${iv.performer}${iv.byProxy && iv.recordedBy ? ` (${iv.recordedBy} nhập hộ)` : ''}` : 'Chưa có người làm';
  return (
    <li className="rounded-lg border px-3 py-2.5 surface-2" style={{ borderColor: 'var(--line)' }} data-pa-id={iv.id}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-semibold text-slate-100">{INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind}</span>
        {/* Trạng thái CÔNG VIỆC, không phải kết quả (mục 2.2): "Đã xong" chỉ nghĩa việc đã làm xong. */}
        <Nhan tone={toneTrangThaiPa(iv.status)}>{INTERVENTION_STATUS_LABEL[iv.status as keyof typeof INTERVENTION_STATUS_LABEL] ?? iv.status}</Nhan>
        {choDuyet && <Nhan tone="wait" title={iv.approvalDue ? `Hạn Quản lý trả lời ${ngan(iv.approvalDue)}` : undefined}>Chờ QL duyệt</Nhan>}
        {iv.approvalState === 'approved' && <Nhan tone="done">Đã duyệt</Nhan>}
        {iv.approvalState === 'declined' && <Nhan tone="muted">Không duyệt</Nhan>}
        <span className="flex-1" />
        {hanGhi && hanGhi.tone === 'overdue' && !choDuyet && <QuaHan ngay={hanGhi.daysOverdue} />}
      </div>
      {iv.description && <p className="m-0 mt-1 text-sm text-slate-300">{iv.description}</p>}
      {(thayCho || thayBang) && (
        <p className="m-0 mt-0.5 truncate text-[11px] text-slate-500">
          {[thayCho && `Thay cho: ${tenPA(thayCho)}`, thayBang && `Được thay bằng: ${tenPA(thayBang)}`].filter(Boolean).join(' · ')}
        </p>
      )}
      <p className="m-0 mt-1 text-[11px] text-slate-500">
        {[nguoi, khoang].filter(Boolean).join(' · ')}
        {hanGhi && !choDuyet && <> · hạn ghi kết quả {hanGhi.han.replace(/^hạn /, '')}</>}
      </p>
      {iv.approvalNote && (
        <p className="m-0 mt-1 border-l pl-3 text-xs text-slate-300" style={{ borderColor: 'var(--line)' }}>
          Quản lý{iv.approvedBy ? ` (${iv.approvedBy})` : ''}: {iv.approvalNote}
        </p>
      )}
      {revisions.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[11px] text-slate-400">Đã điều chỉnh {revisions.length} lần</summary>
          <div className="mt-1"><LichSuDieuChinh revisions={revisions} /></div>
        </details>
      )}
      <div className="mt-1.5 flex flex-wrap gap-2">
        {data.viewer.canEdit && dangChay && !choDuyet && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => onViec({ loai: 'ghi-ket-qua', paId: iv.id })}
            title="Ghi kết quả tuần này: kết quả, tiến triển, và quyết định Giữ nguyên / Điều chỉnh / Thay / Kết thúc">
            Ghi kết quả
          </button>
        )}
        {choDuyet && data.viewer.canApprove && (
          <button type="button" className="btn btn-sm" onClick={() => onViec({ loai: 'tra-loi', paId: iv.id })}>Trả lời đề xuất</button>
        )}
        {choDuyet && !data.viewer.canApprove && (
          <span className="self-center text-xs text-slate-500">Đang chờ Quản lý trả lời; thời gian chờ tính cho Quản lý.</span>
        )}
      </div>
    </li>
  );
}

// ==================================================================== lịch sử cập nhật (thu gọn)

type MucLichSu = { key: string; on: string; dot: string | null; tieuDe: ReactNode; badge: ReactNode; than: ReactNode };

const MILESTONE_TITLE: Record<string, string> = {
  repeat: 'Trượt lại',
  recurrence: 'Tái phát sau khi đã chốt kết thúc',
  passed: 'Đã đạt kỳ vọng',
  closed: 'Chốt kết thúc',
  extended: 'Chốt đợt này, kéo dài theo dõi',
};

/** Điểm cô tự chấm: LUÔN có chữ "cô chấm" — một con số 6.5 đứng trơ sẽ bị đọc nhầm thành điểm mock. */
function MetricPills({ metrics }: {
  metrics?: { skill: string; component?: string | null; score: number; total: number | null }[] | null;
}) {
  if (!metrics?.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {metrics.map((m) => (
        <Nhan key={`${m.skill}:${m.component ?? ''}`} tone="muted">
          cô chấm {m.component ?? (CASE_CATEGORY_LABEL[m.skill as keyof typeof CASE_CATEGORY_LABEL] ?? m.skill)}{' '}
          {m.total ? `${m.score}/${m.total}` : fmtBand(m.score)}
        </Nhan>
      ))}
    </span>
  );
}

/** Mốc của Case + mọi lần ghi kết quả, MỚI NHẤT LÊN ĐẦU (mục 4.3). Phương án đã nằm ở khối trên nên không lặp ở đây. */
function buildLichSu(data: CaseDetail, ngan: (d: string | null | undefined) => string): MucLichSu[] {
  const out: MucLichSu[] = [];
  for (const m of data.milestones ?? []) {
    if (m.kind === 'opened') continue;   // ngày mở và người tạo đã ở khối Vấn đề
    out.push({
      key: `m${m.id}`, on: m.occurredOn, dot: m.attemptNo ? `MT${m.attemptNo}` : null,
      tieuDe: MILESTONE_TITLE[m.kind] ?? m.kind,
      badge: (
        <>
          {m.band !== null && m.band !== undefined && (
            <Outcome tone={m.expectation !== null && m.band < m.expectation ? 'danger' : 'ok'}>
              {fmtBand(m.band)}{m.expectation !== null ? ` · kỳ vọng ${fmtBand(m.expectation)}` : ''}
            </Outcome>
          )}
          {m.sosLevel ? <Level tone={sosTone(m.sosLevel)}>{sosLabel(m.sosLevel)}</Level> : null}
        </>
      ),
      than: m.note ? <span className="block text-slate-400">{m.note}</span> : null,
    });
  }
  const tenPa = (id: number | null) => {
    const iv = (data.interventions ?? []).find((x: any) => x.id === id);
    return iv ? (iv.description || INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] || iv.kind) : null;
  };
  for (const f of data.followups ?? []) {
    const tre = f.late ? soNgayGiua(f.cycleDue, f.observedOn) : null;
    out.push({
      key: `f${f.id}`, on: f.observedOn, dot: f.cycleNo ? `Đợt ${f.cycleNo}` : null,
      tieuDe: f.interventionId ? (tenPa(f.interventionId) ?? 'Kết quả PA') : (f.metrics?.length ? 'Điểm giáo viên tự chấm' : 'Theo dõi chung'),
      badge: (
        <>
          {f.outcome && (
            <Outcome tone={OUTCOME_TONE[f.outcome] ?? 'muted'} mark={OUTCOME_MARK[f.outcome]}>{outcomeLabelFor(f.outcome)}</Outcome>
          )}
          {f.late && <span className="text-[11px] text-slate-500">ghi trễ{tre && tre > 0 ? ` ${tre} ngày` : ''}</span>}
        </>
      ),
      than: (
        <>
          {(f.nextStep || f.observerName) && (
            <span className="block text-[11px] text-slate-500">
              {f.nextStep && <>→ {NEXT_STEP_LABEL[f.nextStep as keyof typeof NEXT_STEP_LABEL] ?? f.nextStep}</>}
              {f.nextStep && f.observerName && ' · '}
              {f.observerName && <>{f.observerName} ghi</>}
            </span>
          )}
          {f.note && <span className="block text-slate-300">{f.note}</span>}
          {f.remainingIssue && <span className="block text-[11px] text-slate-400">Còn tồn: {f.remainingIssue}</span>}
          {f.decisionNote && (
            <span className="block text-[11px] text-slate-400">{f.nextStep === 'adjust' || f.nextStep === 'propose' ? 'Lý do' : 'Ghi chú'}: {f.decisionNote}</span>
          )}
          <MetricPills metrics={f.metrics} />
        </>
      ),
    });
  }
  out.sort((a, b) => (b.on ?? '').localeCompare(a.on ?? '') || b.key.localeCompare(a.key));
  return out;
}

export { skillLabel };
