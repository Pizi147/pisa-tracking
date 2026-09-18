import { useMemo, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { ASSESSED_SKILLS, ASSESSED_SKILL_LABEL, type AssessedSkill } from '@shared/domain/index.ts';
import { Drawer } from '../../ui/Drawer.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, Info, SectionNote, Skeleton, Th} from '../../ui/ui.tsx';

type AttemptState = { attemptNo: number; status: string; periodCode: string | null };

type NoPlan = {
  studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null; branchName: string | null;
  cycleId: number; route: string | null; target: number | null;
  nextAttemptNo: number; hasPending: boolean; canPlan: boolean;
  attempts: AttemptState[];
};

/** Bày sẵn bảy ô. Đa số em chỉ dùng ba ô đầu, nhưng em học kéo dài thì cần tới MT6, MT7. */
const SLOTS = [1, 2, 3, 4, 5, 6, 7];

/**
 * LÊN KẾ HOẠCH MT — thiết kế lại theo mục 10, sau khi owner báo ba lỗi.
 *
 * Ba lỗi cũ và cách sửa:
 *
 *   1. Không chuyển được tuần   → ô chọn tuần chưa chọn gì thì khoá cả hai mũi tên. Sửa ở
 *                                 `WeekPicker`: chưa chọn thì neo vào tuần hiện tại.
 *   2. Cửa sổ tuần chỉ mở 1 tuần → nay mở 30 tuần, đủ cho cả một khoá FT 24 tuần.
 *   3. Không nhập được tên      → nay có ô gõ tìm học viên, không cần chọn lớp trước.
 *
 * Và thay đổi lớn nhất về cách làm việc: CHỌN Ô MT RIÊNG CHO TỪNG EM rồi chốt chung một
 * tuần. Đúng ví dụ của owner — MT2 của Nguyễn A và MT4 của Nguyễn B xếp vào cùng một tuần.
 * Lượt đã làm xong thì KHÔNG chọn lại được: đó là lịch sử, không phải kế hoạch.
 */
export function MockPlanPanel({ classId, branchId, onClose, onDone }: {
  classId?: number | null; branchId?: number | null; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();

  /* Ba cách thu hẹp danh sách, dùng riêng hoặc dùng chung. */
  const [q, setQ] = useState('');
  const [pickedClass, setPickedClass] = useState<number | null>(classId ?? null);
  const [missingNo, setMissingNo] = useState<number | null>(null);
  const [all, setAll] = useState(false);

  const qs = new URLSearchParams();
  if (pickedClass) qs.set('classId', String(pickedClass));
  if (branchId) qs.set('branchId', String(branchId));
  if (all) qs.set('includePlanned', '1');
  if (q.trim()) { qs.set('q', q.trim()); qs.set('includePlanned', '1'); }
  if (missingNo) { qs.set('missingAttemptNo', String(missingNo)); qs.set('includePlanned', '1'); }

  const { data, loading, reload } = useApi<{ rows: NoPlan[]; total: number; noPlanCount: number }>(
    `/attempts/no-plan${qs.toString() ? `?${qs}` : ''}`, [qs.toString()],
  );
  /* Kế hoạch Test chỉ dành cho Fast Track (sổ MT-01) — Normal thi theo lịch lớp, không xếp lượt MT. */
  const classes = useApi<{ id: number; code: string }[]>('/ref/classes?fastTrackOnly=1');

  /** studentId → lượt MT đang chọn. Mỗi em một lượt riêng. */
  const [picks, setPicks] = useState<Map<number, number>>(new Map());
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [skills, setSkills] = useState<Set<AssessedSkill>>(new Set(ASSESSED_SKILLS));
  const [busy, setBusy] = useState(false);

  const rows = data?.rows ?? [];
  const chosen = useMemo(
    () => rows.filter((r) => r.canPlan && picks.has(r.studentId)),
    [rows, picks],
  );

  const pick = (r: NoPlan, no: number) => setPicks((m) => {
    const n = new Map(m);
    if (n.get(r.studentId) === no) n.delete(r.studentId); else n.set(r.studentId, no);
    return n;
  });

  const toggleSkill = (k: AssessedSkill) => setSkills((s) => {
    const n = new Set(s);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });

  /** Chọn nhanh cả danh sách vào cùng một lượt — đường đăng ký hàng loạt của mục 10. */
  const pickAll = (no: number) => setPicks(() => {
    const n = new Map<number, number>();
    for (const r of rows) {
      if (!r.canPlan) continue;
      if (r.attempts.some((a) => a.attemptNo === no)) continue;   // đã có lượt đó rồi
      n.set(r.studentId, no);
    }
    return n;
  });

  const save = async () => {
    if (!chosen.length || !periodId || !skills.size || busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ done: number; failed: { label?: string; message: string }[] }>(
        '/attempts/bulk-plan',
        {
          picks: chosen.map((c) => ({ studentId: c.studentId, attemptNo: picks.get(c.studentId) })),
          periodId,
          requiredSkills: [...skills],
        },
      );
      toast.push(r.done > 0 ? 'ok' : 'error',
        `Đã lên kế hoạch cho ${r.done} học viên${r.failed.length ? `, ${r.failed.length} em không tạo được` : ''}.`);
      for (const f of r.failed.slice(0, 3)) toast.push('error', `${f.label ?? ''}: ${f.message}`);
      invalidate('/attempts'); invalidate('/classes'); invalidate('/students');
      onDone?.();
      if (r.done > 0) onClose(); else { setPicks(new Map()); reload(); }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer
      open onClose={onClose} width="max-w-4xl"
      title="Kế hoạch Test"
      subtitle="Chọn lượt MT riêng cho từng em, rồi chốt chung một tuần"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
          <button className="btn btn-primary" onClick={save}
            disabled={busy || !chosen.length || !periodId || !skills.size}>
            {busy ? 'Đang lưu…'
              : chosen.length
              ? `Xếp ${chosen.length} em vào tuần này`
              : 'Chưa chọn em nào'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* ------------------------------------------------ 1. tuần chốt chung */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <WeekPicker periodId={periodId} onPeriod={setPeriodId} className="w-full"
              label="Tuần MT" scope="planning" />
            <p className="text-[11px] text-slate-500 mt-1">
              Các em xếp chung một tuần vẫn có thể ở những lượt MT khác nhau.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------ 2. kỹ năng yêu cầu */}
        <div>
          <span className="label">Kỹ năng lượt này yêu cầu</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {ASSESSED_SKILLS.map((k) => (
              <label key={k} className={`btn btn-sm ${skills.has(k) ? 'btn-primary' : ''}`}>
                <input type="checkbox" className="accent-sky-400 mr-1.5"
                  checked={skills.has(k)} onChange={() => toggleSkill(k)} />
                {ASSESSED_SKILL_LABEL[k]}
              </label>
            ))}
          </div>
          {skills.size === 0 && (
            <p className="text-xs text-rose-300 mt-1">
              Phải yêu cầu ít nhất một kỹ năng — một lượt không có kỹ năng nào thì không đánh giá được gì.
            </p>
          )}
        </div>

        {/* ------------------------------------------------ 3. tìm học viên */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="label">Tìm học viên</span>
            <input className="field w-full" value={q} placeholder="Gõ tên hoặc mã học viên"
              onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Lớp</span>
            <select className="field w-full" value={pickedClass ?? ''}
              onChange={(e) => setPickedClass(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Tất cả lớp trong phạm vi</option>
              {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Chỉ em chưa có</span>
            <select className="field w-full" value={missingNo ?? ''}
              onChange={(e) => setMissingNo(e.target.value ? Number(e.target.value) : null)}>
              <option value="">— không lọc —</option>
              {SLOTS.map((n) => <option key={n} value={n}>Chưa có MT{n}</option>)}
            </select>
          </label>
        </div>

        {/* ------------------------------------------------ 4. danh sách + chọn lượt */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span className="label">
              {q.trim() || missingNo || all ? 'Học viên trong phạm vi' : 'Học viên chưa có tuần MT tiếp theo'}
              {data?.noPlanCount ? ` · ${data.noPlanCount} em đang thiếu` : ''}
            </span>
            <span className="flex flex-wrap gap-1">
              {!q.trim() && !missingNo && (
                <button className="btn btn-sm" onClick={() => { setAll((v) => !v); setPicks(new Map()); }}>
                  {all ? 'Chỉ em chưa có tuần MT' : 'Xem cả lớp để xếp trước'}
                </button>
              )}
              {/*
                ĐĂNG KÝ HÀNG LOẠT MỘT LƯỢT — mục 10. Bấm "MT2 cho tất cả" là chọn MT2 cho
                mọi em trong danh sách chưa có lượt đó; em đã có thì bỏ qua, không ghi đè.
              */}
              {missingNo && (
                <button className="btn btn-sm" onClick={() => pickAll(missingNo)}>
                  Chọn MT{missingNo} cho tất cả
                </button>
              )}
              {picks.size > 0 && (
                <button className="btn btn-sm" onClick={() => setPicks(new Map())}>Bỏ chọn tất cả</button>
              )}
            </span>
          </div>

          {loading ? <Skeleton rows={5} /> : rows.length === 0 ? (
            <Empty
              title={q.trim() ? 'Không tìm thấy học viên nào' : 'Mọi học viên đều đã có tuần MT tiếp theo'}
              hint={q.trim() ? 'Thử gõ một phần tên hoặc mã học viên.'
                : 'Muốn xếp trước lượt sau cho cả lớp thì bấm "Xem cả lớp để xếp trước".'}
            />
          ) : (
            <div className="surface-2 rounded-lg overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '44rem' }}>
                <thead>
                  <tr>
                    <th className="th">Học viên</th>
                    <th className="th">Lớp</th>
                    <Th hint="Chọn MT khác nhau cho từng em rồi xếp chung vào một tuần. Lượt đã làm xong không chọn được.">Chọn lượt MT</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.studentId} className={`row-hover ${r.canPlan ? '' : 'row-muted'}`}>
                      <td className="td">
                        <div className="text-slate-100">{r.studentName}</div>
                        <div className="text-[11px] text-slate-500">
                          {r.studentCode}
                          {r.route ? ` · ${r.route}` : ''}
                          {r.target ? ` · Target ${r.target}` : ''}
                        </div>
                      </td>
                      <td className="td text-slate-300 whitespace-nowrap">{r.classCode ?? '—'}</td>
                      <td className="td">
                        <MockSlots row={r} picked={picks.get(r.studentId) ?? null}
                          onPick={(no) => pick(r, no)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <SectionNote>
            Ô <strong>xám đậm</strong> là lượt đã làm xong — không sửa lại được, vì đó là lịch sử
            chứ không phải kế hoạch. Ô <strong>viền xanh</strong> là lượt đã có tuần; chọn lại sẽ
            báo lỗi ở chính dòng đó chứ không huỷ cả lô.
          </SectionNote>
        </div>
      </div>
    </Drawer>
  );
}

/**
 * DÃY Ô MT1…MT7 CỦA MỘT EM.
 *
 * Ba trạng thái, ba hình dạng — người dùng phải phân biệt được trước khi bấm, không phải sau:
 *   đã xong    xám đậm, bấm không được   (lịch sử)
 *   đã xếp     viền xanh, có mã tuần      (kế hoạch đang có)
 *   còn trống  bấm được                   (chỗ xếp mới)
 */
function MockSlots({ row, picked, onPick }: {
  row: NoPlan; picked: number | null; onPick: (no: number) => void;
}) {
  const byNo = new Map(row.attempts.map((a) => [a.attemptNo, a]));
  return (
    <span className="flex flex-wrap gap-1">
      {SLOTS.map((no) => {
        const had = byNo.get(no);
        const done = had?.status === 'done';
        const active = picked === no;
        if (done) {
          return (
            <span key={no}
              className="inline-flex items-center rounded px-2 py-1 text-[11px] text-slate-500 cursor-not-allowed"
              style={{ background: 'var(--surface-2)' }}
              title={`MT${no} đã làm xong${had?.periodCode ? ` · ${had.periodCode}` : ''} — không sửa lại được`}>
              MT{no} ✓
            </span>
          );
        }
        return (
          <button
            key={no} type="button" disabled={!row.canPlan}
            className={`inline-flex items-center rounded px-2 py-1 text-[11px] border ${
              active ? 'border-transparent' : ''
            }`}
            style={active
              ? { background: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 600 }
              : had
              ? { borderColor: 'var(--accent-line)', color: 'var(--accent-strong)' }
              : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }}
            title={had ? `MT${no} đã xếp ở ${had.periodCode ?? 'một tuần'}` : `Xếp MT${no} cho em này`}
            onClick={() => onPick(no)}
          >
            MT{no}{had ? ' ·' : ''}
          </button>
        );
      })}
      {row.hasPending && !picked && (
        <Info>đã có lượt đang chờ</Info>
      )}
    </span>
  );
}
