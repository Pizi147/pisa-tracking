import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { skillLabel } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BranchFilter } from '../../ui/Filters.tsx';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import {
  DUONG_TAB_TEST, WORK_SCOPES, WORK_SCOPE_HINT, WORK_SCOPE_LABEL, ngay, tuanLich,
  type MucCanCham, type WorkScope,
} from '@shared/domain/index.ts';

/**
 * TEST › CẦN CHẤM — mockup 05a2 phương án A.
 *
 * Ba mục cố định theo hạn: Quá hạn · Tuần này · Sắp tới. Hạn nằm ở TÊN MỤC nên dòng không cần nhãn hạn nữa; mỗi dòng
 * chỉ còn: lớp + đợt · kỹ năng · còn bao nhiêu bài · một nút Chấm. Bấm Chấm mở thẳng lưới đúng lớp, đúng đợt.
 */

/** Trả lời của `GET /cham/can-cham` (`canChamList` ở server/src/cham/canCham.ts). */
type LuiLich = {
  kyNang: string; hv: string[];
  tuTuan: string | null; sangTuan: string | null; tuTuanStart: string | null; sangTuanStart: string | null;
};
type Dong = {
  key: string; classId: number; classCode: string; mode: 'ielts_band' | 'ratio';
  kind: string; attemptNo: number | null; dotLabel: string;
  kyNang: string[]; kyNangLabel: string;
  conBai: number; soHv: number; han: string | null;
  luiLich: LuiLich | null; daBatDau: boolean; href: string;
};
type Nhom = { muc: MucCanCham; nhan: string; han: string | null; dong: Dong[] };
type CanCham = { scopeEmpty: boolean; lop: { id: number; code: string } | null; nhom: Nhom[]; tong: number };

/** Tên thứ đầy đủ (THUAT_NGU g13-032: "Thứ Tư"; chỗ chật mới dùng T4). */
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const thuCua = (iso: string) => THU[new Date(`${iso.slice(0, 10)}T00:00:00Z`).getUTCDay()] ?? '';

/** Màu tên mục như mockup: Quá hạn đỏ, Tuần này vàng, Sắp tới chữ phụ. */
const MAU_MUC: Record<MucCanCham, string> = {
  'qua-han': 'text-rose-300',
  'tuan-nay': 'text-amber-200',
  'sap-toi': 'text-slate-400',
};

/**
 * DÒNG PHỤ — đúng một dòng (G-3). Có lùi lịch thật (Q15, chủ sản phẩm chốt) thì ghi kỹ năng bị lùi + ai bị lùi, tuần
 * cũ/mới để trong tooltip; không có thì chỉ là các kỹ năng còn nợ (viết tắt, tooltip tên đầy đủ — G-7).
 */
function dongPhu(d: Dong, homNay: string): { chu: string; goiY: string } {
  const tatCa = d.kyNang.map(skillLabel).join(', ');
  const l = d.luiLich;
  if (!l) return { chu: d.kyNangLabel, goiY: tatCa };
  const kn = skillLabel(l.kyNang);
  const chu = l.hv.length === 1 ? `${kn} · lùi lịch của ${l.hv[0]}` : `${kn} · lùi lịch · ${l.hv.length} HV`;
  const tu = l.tuTuanStart ? ` từ ${tuanLich(l.tuTuanStart, homNay)}` : '';
  const sang = l.sangTuanStart ? ` sang ${tuanLich(l.sangTuanStart, homNay)}` : '';
  const dong = [`Lùi lịch${tu}${sang}`];
  if (l.hv.length > 1) dong.push(`Học viên: ${l.hv.join(', ')}`);
  if (d.kyNang.length > 1) dong.push(`Còn nợ: ${tatCa}`);
  return { chu, goiY: dong.join('\n') };
}

export function CanChamTab() {
  const [params, setParams] = useSearchParams();
  const { homNay } = useNgayNghiepVu();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const classId = params.get('classId') ? Number(params.get('classId')) : null;
  const raw = params.get('scope');
  const scope: WorkScope | null = (WORK_SCOPES as readonly string[]).includes(raw ?? '') ? (raw as WorkScope) : null;
  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  if (classId) qs.set('classId', String(classId));
  if (scope) qs.set('scope', scope);
  const q = qs.toString();
  const { data, loading, error, reload } = useApi<CanCham>(`/cham/can-cham${q ? `?${q}` : ''}`);

  const moLich = `${DUONG_TAB_TEST.lich}${branchId ? `?branchId=${branchId}` : ''}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <span className="flex flex-wrap gap-1">
          {WORK_SCOPES.map((s) => (
            <button key={s} type="button" title={WORK_SCOPE_HINT[s]}
              className={`btn btn-sm ${scope === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => set('scope', s)}>{WORK_SCOPE_LABEL[s]}</button>
          ))}
        </span>
        <div className="flex-1" />
        <BranchFilter branchId={branchId} onBranch={(id) => set('branchId', id ? String(id) : null)} />
      </div>

      {/* Q13: đang lọc ngầm theo lớp (đi vào từ dòng lớp) thì phải NÓI ra, và bỏ được bằng một cú bấm.
          Hiện theo tham số trên đường dẫn, không chờ máy chủ: mã lớp sai/cũ vẫn phải có ✕ để thoát. */}
      {classId !== null && (
        <span className="inline-flex items-center gap-1 rounded-full border pl-2.5 pr-0.5 py-0.5 text-xs text-slate-300"
          style={{ borderColor: 'var(--line-strong)' }}>
          Đang lọc: lớp {data?.lop?.code ?? `#${classId}`}
          <button type="button" className="btn btn-ghost btn-sm px-1.5 py-0" title="Bỏ lọc theo lớp"
            aria-label="Bỏ lọc theo lớp" onClick={() => set('classId', null)}>✕</button>
        </span>
      )}

      {error ? (
        <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
      ) : loading || !data ? (
        <Skeleton rows={5} />
      ) : data.scopeEmpty ? (
        <div className="card"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
      ) : data.nhom.every((n) => n.dong.length === 0) ? (
        <div className="card">
          <Empty title="Không còn bài nào cần chấm" hint="Lịch Test gần nhất ở tab Lịch Test."
            action={<Link className="btn btn-sm" to={moLich}>Mở Lịch Test</Link>} />
        </div>
      ) : (
        <div className="space-y-4">
          {data.nhom.map((n) => (
            <section key={n.muc} aria-label={n.nhan}>
              <h2 className={`m-0 mb-1.5 text-xs font-semibold tabular-nums ${MAU_MUC[n.muc]}`}>
                <span className="uppercase tracking-wide">{n.nhan}</span>
                {/* Quá hạn gộp nhiều hạn đã qua — một "hạn …" ở đầu nhóm sẽ sai với phần lớn các dòng. */}
                {n.muc !== 'qua-han' && n.han && <> · hạn {thuCua(n.han)} {ngay(n.han, homNay)}</>}
                {' · '}{n.dong.length}
              </h2>
              {n.dong.length > 0 && (
                <ul className="m-0 p-0 list-none space-y-1.5">
                  {n.dong.map((d) => {
                    const phu = dongPhu(d, homNay);
                    const ten = `${d.classCode} · ${d.dotLabel}`;
                    return (
                      <li key={d.key}
                        className="card grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[13rem_minmax(0,1fr)_6.5rem_6.5rem] items-center gap-x-3 gap-y-2 px-3 py-2.5">
                        {/* Màn hẹp: tên + dòng phụ chồng nhau ở hàng trên; từ sm trở lên tách thành hai cột thẳng hàng. */}
                        <div className="col-span-2 min-w-0 sm:contents">
                          <div className="font-semibold text-slate-100 truncate"
                            title={d.kind === 'mock' ? `${d.classCode} · Mock Test ${d.attemptNo ?? ''}` : ten}>{ten}</div>
                          <div className="text-xs text-slate-400 truncate" title={phu.goiY}>{phu.chu}</div>
                        </div>
                        <div className="text-sm text-slate-300 tabular-nums sm:text-right whitespace-nowrap"
                          title={`${d.soHv} học viên còn bài chưa nhập điểm`}>còn {d.conBai} bài</div>
                        <Link to={d.href}
                          className="btn btn-primary btn-sm justify-center min-h-11 sm:min-h-0 w-24 sm:w-full">
                          {d.daBatDau ? 'Chấm tiếp' : 'Chấm'}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
