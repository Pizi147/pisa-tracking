import { useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { Drawer } from './Drawer.tsx';
import { WeekPicker } from './Filters.tsx';
import { useToast } from './Toast.tsx';
import { Field, Pill, SectionNote } from './ui.tsx';
import { PROGRAMME_TEMPLATES, ROUTES, skillShort } from '@shared/domain.ts';

type Branch = { id: number; code: string; name: string };

/**
 * TẠO LỚP MỚI — mục 7.4.
 *
 * Hai loại lớp, và đó là lựa chọn ĐẦU TIÊN vì mọi ô sau đều đổi theo:
 *
 *   FT      chỉ cần đánh số, kèm lộ trình LT1 hay LT2
 *   Normal  phải chọn FOU / BE / ELE — số tuần và mốc kiểm tra đi kèm theo đó
 *
 * Mã lớp luôn bắt đầu bằng mã chi nhánh, nên panel tự ghép sẵn tiền tố và người dùng chỉ gõ
 * phần đuôi. Bắt gõ cả "MB-FT 101" là bắt nhớ một quy ước mà máy đã biết.
 */
export function ClassCreatePanel({ onClose, onDone }: {
  onClose: () => void; onDone?: (classId: number) => void;
}) {
  const toast = useToast();
  const branches = useApi<Branch[]>('/ref/branches');

  const [branchId, setBranchId] = useState<number | null>(null);
  const [isFt, setIsFt] = useState(true);
  const [programme, setProgramme] = useState<'FOU' | 'BE' | 'ELE'>('FOU');
  const [route, setRoute] = useState<string>('LT1');
  const [suffix, setSuffix] = useState('');
  const [startPeriodId, setStartPeriodId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const list = branches.data ?? [];
  const branch = list.find((b) => b.id === branchId) ?? null;
  const tpl = isFt ? PROGRAMME_TEMPLATES.FT : PROGRAMME_TEMPLATES[programme];

  /* Mã lớp ghép sẵn: "MB-" + "FT 101" hoặc "MB-" + "BE 02". */
  const prefix = branch ? `${branch.code}-` : '';
  const body = suffix.trim();
  const code = `${prefix}${body}`;

  const save = async () => {
    if (!branchId) { toast.push('error', 'Hãy chọn chi nhánh.'); return; }
    if (!body) { toast.push('error', 'Hãy đặt tên lớp.'); return; }
    setBusy(true);
    try {
      const r = await api.post<{ id: number }>('/classes', {
        code,
        branchId,
        kind: isFt ? 'FT' : programme,
        route: isFt ? route : null,
        isFulltime: isFt,
        skills: [...tpl.skills],
        startPeriodId,
      });
      invalidate('/classes'); invalidate('/ref/classes');
      toast.push('ok', `Đã tạo lớp ${code}`);
      onDone?.(r.id);
      onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer
      open onClose={onClose} width="max-w-xl"
      title="Tạo lớp mới"
      subtitle="Lớp đã có rồi thì không cần tạo — chọn thẳng lớp đó để thêm học viên"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" onClick={save} disabled={busy || !branchId || !body}>
            Tạo lớp
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Chi nhánh" required>
          <select className="field w-full" value={branchId ?? ''}
            onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">— Chọn chi nhánh —</option>
            {list.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
          </select>
        </Field>

        {/* Loại lớp đứng TRƯỚC mọi ô khác, vì các ô sau đều đổi theo nó. */}
        <Field label="Loại lớp" required>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`btn btn-sm ${isFt ? 'btn-primary' : ''}`}
              onClick={() => setIsFt(true)}>Fulltime IELTS (FT)</button>
            <button type="button" className={`btn btn-sm ${!isFt ? 'btn-primary' : ''}`}
              onClick={() => setIsFt(false)}>Normal</button>
          </div>
        </Field>

        {isFt ? (
          <Field label="Lộ trình" required hint="Lớp FT chỉ cần đánh số; lộ trình quyết định target của các em.">
            <div className="flex flex-wrap gap-2">
              {ROUTES.map((r) => (
                <button key={r} type="button" className={`btn btn-sm ${route === r ? 'btn-primary' : ''}`}
                  onClick={() => setRoute(r)}>{r}</button>
              ))}
            </div>
          </Field>
        ) : (
          <Field label="Chương trình" required hint="Số tuần và hai mốc kiểm tra đi kèm theo chương trình.">
            <div className="flex flex-wrap gap-2">
              {(['FOU', 'BE', 'ELE'] as const).map((c) => (
                <button key={c} type="button" className={`btn btn-sm ${programme === c ? 'btn-primary' : ''}`}
                  onClick={() => setProgramme(c)}>
                  {PROGRAMME_TEMPLATES[c].name} ({c})
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Tên lớp" required
          hint={branch ? `Mã chi nhánh "${branch.code}-" đã có sẵn, chỉ gõ phần còn lại.` : 'Chọn chi nhánh trước.'}>
          <div className="flex items-stretch gap-1">
            <span className="field w-20 flex items-center text-slate-400 justify-center">{prefix || '—'}</span>
            <input className="field flex-1" value={suffix} placeholder={isFt ? 'FT 101' : `${programme} 02`}
              onChange={(e) => setSuffix(e.target.value)} />
          </div>
          {body && <p className="text-xs text-slate-400 mt-1 mb-0">Lớp sẽ là <strong>{code}</strong></p>}
        </Field>

        <Field label="Tuần khai giảng"
          hint={isFt
            ? 'Với lớp FT đây chỉ là thông tin tham khảo — lịch MT đi theo từng em.'
            : 'Bắt buộc với lớp Normal: hai mốc Progress và Final Test đếm từ tuần này.'}>
          <WeekPicker periodId={startPeriodId} label={null} scope="planning"
            onPeriod={setStartPeriodId} className="w-full" />
        </Field>

        {/* Cho thấy TRƯỚC những gì đi kèm lựa chọn, để không ai phải tạo xong mới biết. */}
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
          <p className="text-xs text-slate-400 m-0 mb-1.5">Lớp này sẽ có:</p>
          <div className="flex flex-wrap gap-1.5">
            {tpl.skills.map((sk) => <Pill key={sk} tone="info">{skillShort(sk)}</Pill>)}
          </div>
          {!isFt && (
            <p className="text-xs text-slate-400 mt-2 mb-0">
              {tpl.weeks} tuần · Progress Test tuần {tpl.checkpoints.find((c) => c.kind === 'progress')?.studyWeek}
              {' · '}Final Test tuần {tpl.checkpoints.find((c) => c.kind === 'final')?.studyWeek}
            </p>
          )}
        </div>

        <SectionNote>
          Tạo lớp xong thì thêm học viên bằng panel “Thêm học viên”, và phân công giáo viên ở
          trang lớp. Cả hai việc đó làm sau được, lớp không cần đủ ngay từ đầu.
        </SectionNote>
      </div>
    </Drawer>
  );
}
