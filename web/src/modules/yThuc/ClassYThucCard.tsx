import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Alert, Card, Empty, ErrorState, Info, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { DongThoiGian } from '../../ui/DongThoiGian.tsx';
import { fmtDate, studentStatusLabel } from '../../lib/format.ts';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, demTheoNhomViPham, type ViolationCategory,
  BO_LOC_PHU, hopBoLocPhu, tuNgayTheoKhoang, type BoLocPhu,
} from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { usePanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';

type ViolationView = {
  id: number; studentId: number; category: string; categoryLabel: string; skill: string | null; skillLabel: string | null;
  occurredOn: string; description: string; reportedBy: number; reportedByName: string | null; ageDays: number; ageLabel: string;
  state: string; stateLabel: string;
};
type MeasureDetail = {
  id: number; studentId: number; studentName: string; kindLabel: string; statusLabel: string; status: string;
  violationCount: number; createdAt: string; performedOn: string | null;
  violations?: ViolationView[];
};
type Board = {
  classId: number; canManage: boolean; canRecord: boolean;
  warning: { activeCount: number; message: string };
  unhandled: {
    studentCount: number;
    students: Array<{ studentId: number; studentName: string; count: number; oldestAgeDays: number; warningActive: boolean; violations: ViolationView[] }>;
  };
  preparing: MeasureDetail[];
  history: { total: number; latest: MeasureDetail[] };
  /** YT-14: chỉ ba trường cần cho một dòng chữ (Task 2 — không còn `MeasureDetail` đầy đủ). */
  recentByStudent: Record<number, Array<{ id: number; kindLabel: string; performedOn: string | null }>>;
};

const BO_LOC_PHU_LABEL: Record<BoLocPhu, string> = {
  'tat-ca': 'Tất cả', 'chua-xu-ly': 'Chưa xử lý', 'co-pa-dang-chuan-bi': 'Có PA đang chuẩn bị', 'qua-5-ngay': '> 5 ngày',
};
const KHOANG_LABEL: Record<'7' | '30' | 'all', string> = { '7': '7 ngày', '30': '30 ngày', all: 'Tất cả thời gian' };

/**
 * `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ LỚP — theo prototype v3 `thiet-ke/tham-khao/ho-so-lop-v3.html` (spec PR-HV §4.5, A7);
 * kế hoạch PR-YT2 Task 6: mở PA để sửa (YT-2/3), dòng vi phạm mở tại chỗ (YT-1), Theo thời gian đủ mọi trạng thái
 * (YT-6), bốn chip bộ lọc phụ (YT-12, Q13), Gần đây mở đúng PA (YT-11), Vi phạm gần đây gộp cả PA đang chuẩn bị (YT-7).
 *
 * GVCN nhìn THEO HỌC VIÊN trước (nguyên tắc §7, g2-006). Mặc định Theo học viên, KHÔNG nhớ lựa chọn (Q-V3-7): mỗi lần
 * mở lại trang lớp, component này mount lại từ đầu nên tự về đúng mặc định.
 */
export function ClassYThucCard({ classId }: { classId: number }) {
  const { homNay } = useNgayNghiepVu();
  const board = useApi<Board>(`/classes/${classId}/y-thuc`);
  const [sub, setSub] = useState<'violations' | 'coordination'>('violations');
  const [includeDone, setIncludeDone] = useState(false);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(
    `/classes/${classId}/phoi-hop-sos${includeDone ? '?includeDone=1' : ''}`, [includeDone],
  );
  const roster = useApi<any[]>(`/classes/${classId}/roster`);

  const [mode, setMode] = useState<'byStudent' | 'byTime'>('byStudent');
  const [category, setCategory] = useState<string | null>(null);
  const [boLocPhu, setBoLocPhu] = useState<BoLocPhu>('tat-ca');
  const [khoang, setKhoang] = useState<'7' | '30' | 'all'>('30');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [ticked, setTicked] = useState<Map<number, Set<number>>>(new Map());
  /** YT-1/YT-13: một dòng vi phạm mở tại chỗ tại mọi thời điểm — dùng chung cho cả hai chế độ. */
  const [moViPhamId, setMoViPhamId] = useState<number | null>(null);

  const tuNgay = tuNgayTheoKhoang(homNay, khoang);
  const byTime = useApi<{ rows: ViolationView[] }>(
    mode === 'byTime' ? `/classes/${classId}/violations${tuNgay ? `?from=${tuNgay}` : ''}` : null,
    [mode, classId, tuNgay],
  );

  const { mo, moPhuongAn, panels } = usePanelYThuc({
    canManage: !!board.data?.canManage,
    onDone: board.reload,
    roster: (roster.data ?? []).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null })),
  });

  const tickOf = (studentId: number) => ticked.get(studentId) ?? new Set<number>();
  const toggleTick = (studentId: number, violationId: number) => {
    setTicked((m) => {
      const next = new Map(m);
      const set = new Set(next.get(studentId) ?? []);
      if (set.has(violationId)) set.delete(violationId); else set.add(violationId);
      next.set(studentId, set);
      return next;
    });
  };
  const clearTick = (studentId: number) => setTicked((m) => { const n = new Map(m); n.delete(studentId); return n; });

  /**
   * K3-2/K3-3: một em chỉ hiện ở một nhóm nếu có VI PHẠM (chưa xử lý, hoặc đã gom vào phương án Đang
   * chuẩn bị — K2-2) thuộc đúng nhóm đó; bộ lọc "Tất cả" luôn hiện đủ. Q13 (YT-12): bốn chip bộ lọc phụ
   * lọc THÊM trên tập này, ở máy khách, không request thêm.
   */
  const rowsForCategory = (cat: string | null, boLoc: BoLocPhu) => {
    const unhandledByStudent = new Map((board.data?.unhandled.students ?? []).map((s) => [s.studentId, s]));
    const preparingByStudent = new Map<number, MeasureDetail[]>();
    (board.data?.preparing ?? []).forEach((m) => {
      const arr = preparingByStudent.get(m.studentId) ?? [];
      arr.push(m);
      preparingByStudent.set(m.studentId, arr);
    });
    const studentIds = new Set([...unhandledByStudent.keys(), ...preparingByStudent.keys()]);
    const rows: Array<{ studentId: number; studentName: string; count: number; oldestAgeDays: number; warningActive: boolean; violations: ViolationView[]; preps: MeasureDetail[] }> = [];
    for (const studentId of studentIds) {
      const s = unhandledByStudent.get(studentId);
      const ms = preparingByStudent.get(studentId) ?? [];
      const violations = s ? (cat ? s.violations.filter((v) => v.category === cat) : s.violations) : [];
      const hasPreparingInCat = cat ? ms.some((m) => (m.violations ?? []).some((v) => v.category === cat)) : ms.length > 0;
      if (violations.length === 0 && !hasPreparingInCat) continue;
      const row = {
        studentId, studentName: s?.studentName ?? ms[0].studentName,
        count: s?.count ?? 0, oldestAgeDays: s?.oldestAgeDays ?? 0, warningActive: s?.warningActive ?? false,
        violations, preps: ms,
      };
      if (!hopBoLocPhu(boLoc, { coChuaXuLy: violations.length > 0, coPaDangChuanBi: ms.length > 0, canhBao: row.warningActive })) continue;
      rows.push(row);
    }
    return rows;
  };

  const students = useMemo(() => rowsForCategory(category, boLocPhu).sort((a, b) => (
    Number(b.warningActive) - Number(a.warningActive)
    || b.violations.length - a.violations.length
    || a.studentName.localeCompare(b.studentName, 'vi')
  )), [board.data, category, boLocPhu]);
  /* K3-3: số trên tab con = đúng số dòng hiện ở bộ lọc "Tất cả" (không tính bốn chip phụ), bất kể nhóm đang chọn. */
  const allCount = useMemo(() => rowsForCategory(null, 'tat-ca').length, [board.data]);

  /* YT-6: mọi vi phạm (mọi trạng thái) của HV đang học ở lớp trong khoảng thời gian — lọc nhóm và bốn chip phụ ở máy khách. */
  const timeline = useMemo(() => {
    const rows = byTime.data?.rows ?? [];
    const byCategory = category ? rows.filter((v) => v.category === category) : rows;
    return byCategory.filter((v) => hopBoLocPhu(boLocPhu, { state: v.state as any, ageLabel: v.ageLabel }))
      .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.id - a.id);
  }, [byTime.data, category, boLocPhu]);

  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;
  if (board.loading || !board.data) return <Card title="Ý thức & Phối hợp"><Skeleton rows={4} /></Card>;

  const d = board.data;
  const rosterById = new Map<number, any>((roster.data ?? []).map((r: any) => [r.id, r]));

  /* YT-7: "Vi phạm gần đây" gộp CHƯA XỬ LÝ + vi phạm đang nằm trong PA đang chuẩn bị của em — không request thêm. */
  const vpGanDay = (s: { studentId: number; violations: ViolationView[]; preps: MeasureDetail[] }) => {
    const chuaXuLy = s.violations.map((v) => ({ v, dangChuanBi: null as { id: number; kindLabel: string } | null }));
    const dangChuanBi = s.preps.flatMap((m) => (m.violations ?? []).map((v) => ({ v, dangChuanBi: { id: m.id, kindLabel: m.kindLabel } })));
    return [...chuaXuLy, ...dangChuanBi].sort((a, b) => b.v.occurredOn.localeCompare(a.v.occurredOn) || b.v.id - a.v.id);
  };

  const chiTietCuaDong = (v: ViolationView) => (
    <ChiTietViPham violationId={v.id} canManage={d.canManage}
      onSua={(vv) => mo({ loai: 'sua', v: vv })}
      onDaXoa={() => { setMoViPhamId(null); board.reload(); }}
      onMoPhuongAn={moPhuongAn} />
  );

  return (
    <Card title="Ý thức & Phối hợp"
      action={d.canRecord ? <button className="btn btn-sm btn-primary" onClick={() => mo({ loai: 'ghi', studentId: 0 })}>+ Ghi nhận vi phạm</button> : undefined}
      bodyClass="p-0">
      {d.warning.message && (
        <div className="px-4 pt-3"><Alert tone="warn">{d.warning.message.replace(/^⚠\s*/, '')}</Alert></div>
      )}

      <div className="px-4 pt-3">
        <HangTab cap="con" ariaLabel="Ý thức & Phối hợp của lớp" value={sub} onChange={setSub}
          tabs={[
            { key: 'violations', label: 'Vi phạm & xử lý', so: allCount },
            { key: 'coordination', label: 'Phối hợp SOS', so: coord.data?.pendingCount ?? 0 },
          ]} />
      </div>

      {sub === 'violations' && (
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <button className={`btn btn-sm ${!category ? 'btn-primary' : ''}`} onClick={() => setCategory(null)}>Tất cả</button>
              {VIOLATION_CATEGORIES.map((c) => (
                <button key={c} className={`btn btn-sm ${category === c ? 'btn-primary' : ''}`} onClick={() => setCategory(c)}>
                  {VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button className={`btn btn-sm ${mode === 'byStudent' ? 'btn-primary' : ''}`} onClick={() => setMode('byStudent')}>Theo học viên</button>
              <button className={`btn btn-sm ${mode === 'byTime' ? 'btn-primary' : ''}`} onClick={() => setMode('byTime')}>Theo thời gian</button>
            </div>
          </div>

          {/* YT-12 (Q13): bốn chip bộ lọc phụ, áp cho cả hai chế độ. */}
          <div className="flex flex-wrap gap-1">
            {BO_LOC_PHU.map((b) => (
              <button key={b} className={`btn btn-sm ${boLocPhu === b ? 'btn-primary' : ''}`}
                title={b === 'qua-5-ngay' ? 'Vi phạm chưa xử lý quá 5 ngày' : undefined}
                onClick={() => setBoLocPhu(b)}>
                {BO_LOC_PHU_LABEL[b]}
              </button>
            ))}
          </div>

          {mode === 'byTime' && (
            <div className="flex flex-wrap gap-1">
              {(['7', '30', 'all'] as const).map((k) => (
                <button key={k} className={`btn btn-sm ${khoang === k ? 'btn-primary' : ''}`} onClick={() => setKhoang(k)}>
                  {KHOANG_LABEL[k]}
                </button>
              ))}
            </div>
          )}

          {mode === 'byStudent' ? (
            students.length === 0 ? <Empty title="Không còn vi phạm nào chưa xử lý." /> : (
              <ul className="list-none p-0 m-0 space-y-1.5">
                {students.map((s) => {
                  const r = rosterById.get(s.studentId);
                  const dem = demTheoNhomViPham(s.violations);
                  const mo_ = expanded.has(s.studentId);
                  const ticks = tickOf(s.studentId);
                  const recent = d.recentByStudent[s.studentId] ?? [];
                  return (
                    <li key={s.studentId} className="rounded-lg border" style={{ borderColor: 'var(--line)' }}>
                      {/* Đầu dòng là MỘT nút; nút Mở/Đóng bên trong chỉ là chữ (span) — không có nút lồng nút. */}
                      <button type="button" aria-expanded={mo_}
                        onClick={() => setExpanded((set) => {
                          const next = new Set(set); if (next.has(s.studentId)) next.delete(s.studentId); else next.add(s.studentId); return next;
                        })}
                        className="w-full text-left appearance-none bg-transparent border-0 cursor-pointer row-hover">
                        <span className="grid gap-x-3 gap-y-1 items-center px-3 py-2.5 grid-cols-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,12rem)_auto]">
                          <span className="col-span-2 md:col-span-1 min-w-0">
                            <span className="block text-sm font-semibold text-slate-100">{s.studentName}</span>
                            <span className="block text-[11px] text-slate-500">
                              {[r?.studentCode, r ? studentStatusLabel(r.status).toLowerCase() : null].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-100">{s.violations.length} vi phạm</span>
                            <span className="block text-[11px] text-slate-500">{dem.nhom.map((g) => `${g.n} ${g.label}`).join(' · ')}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block">
                              {s.warningActive
                                ? <Alert tone="warn">cũ nhất {s.oldestAgeDays} ngày</Alert>
                                : <span className="text-xs text-slate-500">Không có cảnh báo</span>}
                            </span>
                            {/* YT-7 dòng HV: một PA → tên loại; nhiều PA → đếm. */}
                            {s.preps.length > 0 && (
                              <span className="block text-[11px] text-slate-500 mt-0.5">
                                {s.preps.length === 1 ? `PA: ${s.preps[0].kindLabel}` : `${s.preps.length} PA đang chuẩn bị`}
                              </span>
                            )}
                          </span>
                          <span className="justify-self-end">
                            <span className="btn btn-sm" aria-hidden>{mo_ ? 'Đóng' : 'Mở'}</span>
                          </span>
                        </span>
                      </button>

                      {mo_ && (
                        <div className="px-3 pb-3 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--line)' }}>
                            <p className="text-[11px] uppercase tracking-wide text-slate-500 m-0 mb-1.5">Vi phạm gần đây</p>
                            <DongThoiGian bien="gon" coCotChon={d.canManage}
                              muc={vpGanDay(s).map(({ v, dangChuanBi }) => ({
                                key: `v${v.id}`, ngay: v.occurredOn,
                                chon: d.canManage && !dangChuanBi
                                  ? { checked: ticks.has(v.id), onChange: () => toggleTick(s.studentId, v.id), nhanDoc: `Chọn vi phạm ${fmtDate(v.occurredOn)}` }
                                  : null,
                                tieuDe: v.description,
                                dongPhu: dangChuanBi
                                  ? `Đang chuẩn bị · ${dangChuanBi.kindLabel}`
                                  : [v.skillLabel, v.reportedByName, v.ageLabel ? `⚠ đã ${v.ageDays} ngày` : null].filter(Boolean).join(' · '),
                                cuoi: <Info>{v.categoryLabel}</Info>,
                                mo: moViPhamId === v.id,
                                onMo: () => setMoViPhamId((cur) => (cur === v.id ? null : v.id)),
                                chiTiet: chiTietCuaDong(v),
                              }))}
                              rong={<p className="text-xs text-slate-500 m-0">Không có vi phạm ở nhóm này.</p>} />
                            {d.canManage && ticks.size > 0 && (
                              <button type="button" className="btn btn-sm btn-primary mt-2"
                                onClick={() => mo({
                                  loai: 'tao-pa', studentId: s.studentId, studentName: s.studentName,
                                  violations: s.violations.filter((v) => ticks.has(v.id)).map((v) => ({ id: v.id, occurredOn: v.occurredOn, categoryLabel: v.categoryLabel, description: v.description })),
                                })}>
                                Tạo phương án từ {ticks.size} vi phạm
                              </button>
                            )}
                          </div>
                          <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--line)' }}>
                            <p className="text-[11px] uppercase tracking-wide text-slate-500 m-0 mb-1.5">Xử lý</p>
                            {s.preps.length === 0 ? (
                              <>
                                <p className="text-xs text-slate-500 m-0">Chưa có phương án đang chuẩn bị</p>
                                {d.canManage && s.violations.length > 0 && (
                                  <button type="button" className="btn btn-sm btn-primary mt-2"
                                    onClick={() => mo({
                                      loai: 'tao-pa', studentId: s.studentId, studentName: s.studentName,
                                      violations: (ticks.size > 0 ? s.violations.filter((v) => ticks.has(v.id)) : s.violations)
                                        .map((v) => ({ id: v.id, occurredOn: v.occurredOn, categoryLabel: v.categoryLabel, description: v.description })),
                                    })}>
                                    Tạo phương án
                                  </button>
                                )}
                              </>
                            ) : (
                              <ul className="list-none p-0 m-0 space-y-2">
                                {s.preps.map((m) => (
                                  <li key={m.id}>
                                    <span className="block text-sm font-medium text-slate-100">{m.kindLabel}</span>
                                    <span className="block text-[11px] text-slate-500">Đang chuẩn bị · {m.violationCount} vi phạm</span>
                                    <span className="block mt-1">
                                      <button type="button" className={`btn btn-sm ${d.canManage ? 'btn-primary' : ''}`} onClick={() => moPhuongAn(m)}>
                                        {d.canManage ? 'Mở phương án' : 'Xem'}
                                      </button>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {/* YT-11: mỗi tên PA gần đây là nút chữ mở đúng PA đó (chỉ đọc). */}
                            <p className="text-xs text-slate-500 m-0 mt-2">
                              Gần đây:{' '}
                              {recent.length === 0 ? '—' : recent.map((m, i) => (
                                <span key={m.id}>
                                  {i > 0 && ', '}
                                  <button type="button" className="text-sky-300 hover:underline" onClick={() => mo({ loai: 'xem-pa', id: m.id })}>
                                    {m.kindLabel}
                                  </button>
                                </span>
                              ))}
                            </p>
                            <Link className="link text-xs block mt-2" to={`/hoc-vien/${s.studentId}?tab=y-thuc`}>Hồ sơ học viên →</Link>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <DongThoiGian bien="day-du"
              muc={timeline.map((v) => ({
                key: `v${v.id}`, ngay: v.occurredOn,
                cot2: <span className="text-sm text-slate-200">{rosterById.get(v.studentId)?.fullName ?? `#${v.studentId}`}</span>,
                tieuDe: v.description,
                dongPhu: [v.reportedByName, v.stateLabel].filter(Boolean).join(' · '),
                cuoi: <Info>{v.categoryLabel}</Info>,
                mo: moViPhamId === v.id,
                onMo: () => setMoViPhamId((cur) => (cur === v.id ? null : v.id)),
                chiTiet: chiTietCuaDong(v),
              }))}
              rong={<Empty title="Không có vi phạm nào trong khoảng này." />} />
          )}
        </div>
      )}

      {sub === 'coordination' && (
        <div className="p-4 space-y-3">
          <div className="flex justify-end">
            <button className="btn btn-sm btn-ghost" onClick={() => setIncludeDone((v) => !v)}>
              {includeDone ? 'Chỉ hiện lượt chưa xong' : 'Hiện cả lượt đã xong'}
            </button>
          </div>
          <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="hocVien" onChanged={() => { coord.reload(); }} />
        </div>
      )}

      {panels}
    </Card>
  );
}
