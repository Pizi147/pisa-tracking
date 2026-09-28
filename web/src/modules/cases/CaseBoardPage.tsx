import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, Info, Level, Skeleton, Status, Th } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { Han } from '../../ui/Han.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { CasePanel } from './CasePanel.tsx';
import { fmtDate, sosLabel, sosTone } from '../../lib/format.ts';
import {
  CASE_CATEGORY_LABEL, ENTRY_SKILL_LABEL,
  FT_CASE_CATEGORIES, NORMAL_CASE_CATEGORIES, URGENCY_LABEL,
  type ChuongTrinh,
} from '@shared/domain/index.ts';
import { PhanTich } from '../phanTich/PhanTich.tsx';

type Facets = {
  skill: Record<string, number>;
  issueBranch: Record<string, number>; branch: Record<string, number>;
  state: Record<string, number>;
  classKind: Record<string, number>;
  skillNone: number; total: number;
};

const STATE_LABEL: Record<string, string> = {
  chua_xu_ly: 'Chưa xử lý',
  no_plan: 'Chưa có PA học thuật',
  working: 'Đang xử lý',
  done: 'Đã xong',
};

/**
 * "CASE BOARD" NAY LÀ TOÀN BỘ TAB PHÂN TÍCH (PR-Pb) — CaseBoard chỉ còn render `<PhanTich />`, khung hàng góc nhìn +
 * bộ lọc chung của §3.3. Tên export và prop `embedded` giữ nguyên cho `OverviewPage.tsx` của Pa (chỉ import, không sửa).
 */
export function CaseBoard(_props: { embedded?: boolean } = {}) {
  return <PhanTich />;
}

/**
 * DANH SÁCH CASE (Q2 — giữ nguyên, không làm lại) — một trong năm mục của hàng góc nhìn Phân tích.
 * Nhận bộ lọc CHUNG từ `PhanTich` (chi nhánh, chương trình, lớp); tự quản lý ba tham số riêng của chính màn này
 * (`hang-doi`, `tinh-hinh`, `ky-nang`) vì đó là các đường dẫn sâu vẫn còn được gửi từ nơi khác (Q16).
 */
export function DanhSachCase({ branchId, ct, classId }: { branchId: number | null; ct: ChuongTrinh; classId: number | null }) {
  const [params, setParams] = useSearchParams();
  const queue = params.get('hang-doi') ?? '';
  const skill = params.get('ky-nang') ?? '';
  const state = params.get('tinh-hinh') ?? '';
  const [openCase, setOpenCase] = useState<number | null>(null);

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: false });
  };
  const clearFilters = () => {
    const next = new URLSearchParams(params);
    for (const k of ['ky-nang', 'tinh-hinh', 'hang-doi']) next.delete(k);
    setParams(next, { replace: false });
  };

  const classKind = ct === 'thuong' ? 'normal' : ct === 'ft' ? 'ft' : '';
  /*
   * ĐỔI CHƯƠNG TRÌNH THÌ XOÁ KỸ NĂNG KHÔNG CÒN HỢP LỆ (mục 4.3) — chương trình nay đến từ bộ lọc CHUNG
   * (`ChonChuongTrinh` của khung Phân tích), không phải ô riêng của màn này như bản trước.
   */
  useEffect(() => {
    const valid: readonly string[] = classKind === 'normal' ? NORMAL_CASE_CATEGORIES : classKind === 'ft' ? FT_CASE_CATEGORIES : [];
    const cur = params.get('ky-nang');
    if (cur && cur !== 'none' && !valid.includes(cur)) set('ky-nang', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classKind]);

  const qs = new URLSearchParams();
  if (queue) qs.set('queue', queue);
  if (branchId) qs.set('branchId', String(branchId));
  if (classKind) qs.set('classKind', classKind);
  if (classId) qs.set('classId', String(classId));
  if (skill) qs.set('skill', skill);
  const suffix = qs.toString() ? `?${qs}` : '';

  const list = useApi<{ rows: any[]; scopeEmpty: boolean; facets: Facets }>(
    `/cases${suffix}`, [queue, branchId, classKind, classId, skill],
  );

  if (list.error) return <ErrorState message={list.error.message} hint={list.error.hint} onRetry={list.reload} />;

  /*
   * KHÔNG GIẤU VẤN ĐỀ ĐÃ XONG, chỉ LÀM MỜ và đẩy xuống cuối (mục cũ giữ nguyên).
   */
  const inScope = list.data?.rows ?? [];
  const rows = (state ? inScope.filter((r) => r.state === state) : inScope)
    .slice()
    .sort((a, b) => (a.state === 'done' ? 1 : 0) - (b.state === 'done' ? 1 : 0));
  const f = list.data?.facets;
  /** Đếm trong đúng tập đang hiển thị, để số trên ô và số dòng bên dưới không lệch nhau. */
  const stateCount = (k: string) => inScope.filter((r) => r.state === k).length;

  const topicLabel = (k: string) =>
    ENTRY_SKILL_LABEL[k as keyof typeof ENTRY_SKILL_LABEL]
    ?? CASE_CATEGORY_LABEL[k as keyof typeof CASE_CATEGORY_LABEL]
    ?? k;

  return (
    <div className="space-y-4">
      {/*
        BA TRẠNG THÁI LOẠI TRỪ NHAU, cộng lại đúng bằng tổng — bức tranh chung, khác câu hỏi "làm gì trước".
      */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {(['chua_xu_ly', 'no_plan', 'working', 'done'] as const).map((k) => (
          <QueueTile key={k} label={STATE_LABEL[k]} value={stateCount(k)} active={state === k}
            dim={k === 'done'}
            onClick={() => set('tinh-hinh', state === k ? '' : k)} />
        ))}
      </div>

      <Card title="Lọc">
        <div className="space-y-3">
          {/*
            BỘ KỸ NĂNG KHÁC NHAU GIỮA HAI CHƯƠNG TRÌNH (mục 4.3): chỉ hiện khi chương trình chung đã xác định
            một phía cụ thể — "Cả hai" thì hai bộ kỹ năng chồng chéo (W1/W2 và W), không bày ra được.
          */}
          {classKind && (
            <FilterRow label="Kỹ năng">
              <Chip active={!skill} onClick={() => set('ky-nang', '')}>Tổng hợp</Chip>
              {(classKind === 'normal' ? NORMAL_CASE_CATEGORIES : FT_CASE_CATEGORIES).map((k) => (
                <Chip key={k} active={skill === k} onClick={() => set('ky-nang', skill === k ? '' : k)}>
                  {CASE_CATEGORY_LABEL[k]}
                  {f?.skill[k] !== undefined ? ` · ${f.skill[k]}` : ''}
                </Chip>
              ))}
              {(f?.skillNone ?? 0) > 0 && (
                <Chip active={skill === 'none'} onClick={() => set('ky-nang', skill === 'none' ? '' : 'none')}>
                  Chưa xác định cụ thể · {f?.skillNone}
                </Chip>
              )}
            </FilterRow>
          )}
          {/*
            BỘ LỌC ĐANG ÁP DỤNG PHẢI NHÌN THẤY VÀ XOÁ ĐƯỢC (mục 4.4).
          */}
          {(skill || state || queue) && (
            <FilterRow label="Đang lọc">
              {skill && (
                <Chip active onClick={() => set('ky-nang', '')}>
                  {skill === 'none' ? 'Chưa xác định cụ thể' : topicLabel(skill)} ✕
                </Chip>
              )}
              {state && <Chip active onClick={() => set('tinh-hinh', '')}>{STATE_LABEL[state]} ✕</Chip>}
              {queue && (
                <Chip active onClick={() => set('hang-doi', '')}>
                  {queue === 'due' ? 'Tới hạn xem lại' : 'Mức cao hoặc gấp'} ✕
                </Chip>
              )}
              <button className="btn btn-sm btn-ghost" onClick={clearFilters}>Xoá hết bộ lọc</button>
            </FilterRow>
          )}
        </div>
      </Card>

      {/* ---------------------------------------------- danh sách */}
      <Card
        title={`Vấn đề - Case (${rows.length})`}
        action={state
          ? <button className="btn btn-sm btn-ghost" onClick={() => set('tinh-hinh', '')}>
              Bỏ lọc {STATE_LABEL[state].toLowerCase()}
            </button>
          : null}
        bodyClass="p-0">
        {list.loading ? <div className="p-4"><Skeleton rows={6} /></div>
          : list.data?.scopeEmpty ? <div className="p-4"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
          : rows.length === 0 ? <div className="p-4"><Empty title="Không có vấn đề nào khớp bộ lọc" /></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th hint="Tên em và lớp em đang học. Bấm một dòng để mở case đó.">Học viên</Th>
                    <Th hint="Tên case và một câu tóm tắt chuyện đang xảy ra.">Nội dung</Th>
                    <Th hint="Hạng mục của case, và nhận định nguyên nhân nếu đã có người dạy phân loại.">Kỹ năng · nguyên nhân</Th>
                    <Th hint="Case sinh từ kết quả một bài đánh giá, do giáo viên ghi nhận, hay do Quản lý giao.">Nguồn</Th>
                    <Th hint="Số phương án đã ghi cho case này, và phương án đang chạy.">Đã làm</Th>
                    <Th hint="Ba trạng thái loại trừ nhau: chưa có phương án · đang xử lý · đã hoàn thành. Mức SOS và mức độ ưu tiên đứng riêng.">Tình trạng</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}
                      /* Đã xong thì LÀM MỜ chứ không giấu — vẫn đọc lại được, nhưng không tranh chỗ. */
                      className={`row-hover cursor-pointer ${r.state === 'done' ? 'opacity-45' : ''}`}
                      onClick={() => setOpenCase(r.id)}>
                      <td className="td whitespace-nowrap">
                        <span className="text-slate-100">{r.studentName}</span>
                        <div className="text-[10px] text-slate-500">{r.classCode ?? '—'}</div>
                      </td>
                      <td className="td text-slate-300">
                        {r.title ?? r.headline}
                        <div className="text-[10px] text-slate-500">
                          {fmtDate(r.detectedAt)}{r.reporterName ? ` · ${r.reporterName}` : ''}
                        </div>
                      </td>
                      <td className="td">
                        {r.topicLabel && <Info>{r.topicLabel}</Info>}
                        {r.primaryLabel
                          ? <div className="mt-0.5"><Info>{r.primaryLabel}</Info></div>
                          : <div className="text-[10px] text-slate-600 mt-0.5">chưa rõ nguyên nhân</div>}
                      </td>
                      <td className="td text-xs text-slate-400 whitespace-nowrap">
                        {r.originKind === 'teacher_report' ? 'Giáo viên báo' : `Điểm · MT${r.attemptNo ?? '?'}`}
                      </td>
                      <td className="td text-xs text-slate-300">
                        {r.interventionCount > 0 ? `${r.interventionCount} việc` : '—'}
                        {r.nextDue && (
                          <div className="text-[10px]"><Han loai="cap-nhat-pa" han={r.nextDue} /></div>
                        )}
                      </td>
                      <td className="td whitespace-nowrap">
                        {/*
                          Dùng đúng BA TRẠNG THÁI của ba ô trên, không dùng trạng thái thô
                          trong database: một case có hai việc đã ghi mà cột này vẫn đề
                          "Chưa xử lý" thì người đọc chỉ có thể kết luận là số liệu sai.
                        */}
                        <Status kind={r.state === 'done' ? 'done' : r.state === 'no_plan' ? 'waiting' : 'idle'}>
                          {STATE_LABEL[r.state]}
                        </Status>
                        {r.sosLevel !== null && (
                          <div className="mt-0.5"><Level tone={sosTone(r.sosLevel)}>{sosLabel(r.sosLevel)}</Level></div>
                        )}
                        {/* PR-N1 A8: chỉ "Gấp" có nhãn màu; "Bình thường" không cần nói. */}
                        {r.urgency === 'urgent' && (
                          <div className="mt-0.5"><Nhan tone="bad">{URGENCY_LABEL.urgent}</Nhan></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      {/* Không có nút mở trang riêng: route `/hoc-thuat/case/:id` vẫn còn cho link sâu từ thông báo. */}
      {openCase !== null && <NganCase caseId={openCase} onClose={() => setOpenCase(null)} />}
    </div>
  );
}

/** Trang riêng của một vấn đề — chia sẻ đường dẫn được, mở từ đâu cũng về đúng bản ghi này. */
export function CaseRoutePage() {
  const { id } = useParams();
  const { session } = useSession();
  const coPhanTich = !!session?.nav?.analysis;
  return (
    <div className="max-w-[900px] space-y-3">
      <Link className="btn btn-sm btn-ghost" to={coPhanTich ? '/phan-tich' : '/'}>← {coPhanTich ? 'Phân tích' : 'Tổng quan'}</Link>
      <Card title="Vấn đề - Case">
        <CasePanel caseId={Number(id)} />
      </Card>
    </div>
  );
}

function QueueTile({ label, value, active, onClick, dim = false }: {
  label: string; value: number | undefined; active: boolean; onClick: () => void; dim?: boolean;
}) {
  return (
    <button onClick={onClick}
      /* "Đã xong" làm mờ chứ không giấu: vẫn tra lại được, nhưng không tranh chỗ với việc đang mở. */
      className={`text-left rounded-lg border p-3 transition-colors ${dim && !active ? 'opacity-50' : ''} ${
        active ? 'bg-[color:var(--accent-soft)]' : 'hover:bg-white/5'}`}
      style={{ borderColor: active ? 'var(--accent-line)' : 'var(--line)' }}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
      <div className="text-2xl tabular-nums text-slate-100 mt-1">{value ?? '—'}</div>
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
      <span className="flex flex-wrap gap-1">{children}</span>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`btn btn-sm ${active ? 'btn-primary' : ''}`} onClick={onClick}>{children}</button>
  );
}
