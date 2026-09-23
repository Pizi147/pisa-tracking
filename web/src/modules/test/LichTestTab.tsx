import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { skillLabel } from '../../lib/format.ts';
import { Card, Empty, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { BranchFilter, WeekPicker, resolveWeek, usePeriodWindow } from '../../ui/Filters.tsx';
import { tuanLich } from '@shared/domain/index.ts';

/** Trả lời của `GET /cham/lich-test` (`lichTest` ở server/src/cham/canCham.ts). */
type Dong = {
  key: string; dotLabel: string; kyNang: string[]; kyNangLabel: string;
  soHv: number; conBai: number; trangThai: string; href: string;
};
type Lop = { classId: number; classCode: string; mode: 'ielts_band' | 'ratio'; branchName: string; dong: Dong[] };
type LichTest = { scopeEmpty: boolean; lop: Lop[] };

/**
 * Màu chữ của cột Trạng thái chấm — chỉ màu chữ, không nền (G-4: ⚠ để dành cho quá hạn, ở đây không cần icon).
 * Chữ lấy nguyên từ máy chủ (`trangThaiChamLabel`), nên chỉ nhìn tiền tố để chọn màu.
 */
function mauTrangThai(s: string): string {
  if (s.startsWith('Quá hạn')) return 'text-rose-300';
  if (s === 'Đã chấm xong') return 'text-slate-400';
  if (s === 'Chưa tới hạn') return 'text-slate-500';
  return 'text-slate-200';
}

/**
 * TEST › LỊCH TEST — các lượt Test của MỘT tuần, mỗi lớp một thẻ (spec §3.5, mockup 05a §1).
 *
 * Mỗi dòng là một đợt + một môn của lớp đó trong tuần đang xem; bấm dòng mở thẳng lưới chấm đúng lớp (lớp FT mở đúng
 * tuần đang xem). Tuần lọc theo tuần của CHÍNH MÔN, nên đợt tách tuần chỉ hiện đúng môn thi tuần này.
 */
export function LichTestTab() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const [periodId, setPeriodId] = useState<number | null>(null);
  const win = usePeriodWindow(periodId);
  useEffect(() => {
    if (periodId !== null || !win.data?.length) return;
    const cur = win.data.find((p) => p.isAnchor);
    if (!cur) return;
    if (cur.id !== null) { setPeriodId(cur.id); return; }
    let cancelled = false;
    void resolveWeek(cur.weekStart).then((r) => { if (!cancelled) setPeriodId(r.id); });
    return () => { cancelled = true; };
  }, [win.data, periodId]);
  const weekStart = win.data?.find((p) => p.isAnchor)?.weekStart ?? null;

  const { data, loading, error, reload } = useApi<LichTest>(
    periodId ? `/cham/lich-test?periodId=${periodId}${branchId ? `&branchId=${branchId}` : ''}` : null,
  );
  const setBranch = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('branchId', String(id)); else next.delete('branchId');
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <WeekPicker periodId={periodId} onPeriod={setPeriodId} label="Tuần" />
        <div className="flex-1" />
        <BranchFilter branchId={branchId} onBranch={setBranch} />
      </div>

      {error ? (
        <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
      ) : loading || !periodId || !data ? (
        <Skeleton rows={6} />
      ) : data.scopeEmpty ? (
        <div className="card"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
      ) : data.lop.length === 0 ? (
        <div className="card">
          <Empty title="Tuần này không có lượt Test nào" hint="Đổi tuần ở trên, hoặc mở Kế hoạch Test để xếp lịch." />
        </div>
      ) : (
        <div className="space-y-3">
          {weekStart && (
            <h2 className="m-0 text-xs font-semibold text-slate-400 tabular-nums">
              <span className="uppercase tracking-wide">Tuần {tuanLich(weekStart, session?.demoDate)}</span>
              {' · '}{data.lop.length} lớp
            </h2>
          )}
          {data.lop.map((l) => (
            <Card key={l.classId} title={`${l.classCode} · ${l.branchName}`} bodyClass="p-0">
              {/* Bảng rộng cuộn NGANG TRONG THẺ, trang không cuộn ngang (G-11). */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 500 }}>
                  <colgroup>
                    <col style={{ width: 104 }} /><col /><col style={{ width: 76 }} /><col style={{ width: 172 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <Th>Đợt</Th>
                      <Th>Kỹ năng</Th>
                      <Th align="right" hint="Số học viên ngồi Test môn này trong tuần">Số HV</Th>
                      <Th>Trạng thái chấm</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.dong.map((d) => (
                      <tr key={d.key} className="row-hover cursor-pointer" onClick={() => navigate(d.href)}>
                        <td className="td whitespace-nowrap">
                          <Link className="link" to={d.href} onClick={(e) => e.stopPropagation()}
                            title={d.dotLabel.startsWith('MT') ? `Mock Test ${d.dotLabel.slice(2)} — mở lưới chấm` : 'Mở lưới chấm'}>
                            {d.dotLabel}
                          </Link>
                        </td>
                        <td className="td truncate text-slate-300" title={d.kyNang.map(skillLabel).join(', ')}>{d.kyNang.map(skillLabel).join(', ')}</td>
                        <td className="td text-right tabular-nums text-slate-300">{d.soHv}</td>
                        <td className={`td whitespace-nowrap tabular-nums ${mauTrangThai(d.trangThai)}`}>
                          {d.trangThai === 'Đã chấm xong' && <span className="mr-1 text-[11px]" aria-hidden>✓</span>}
                          {d.trangThai}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
