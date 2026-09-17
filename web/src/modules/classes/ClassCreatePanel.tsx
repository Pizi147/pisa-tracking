import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { Drawer } from '../../ui/Drawer.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Field, Info, SectionNote } from '../../ui/ui.tsx';
import { PROGRAMME_TEMPLATES, skillShort } from '@shared/domain/index.ts';

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
  /* Lộ trình đọc từ BẢNG, không từ hằng số — Quản trị hệ thống thêm lộ trình là nó hiện ngay ở đây. */
  const routes = useApi<{ code: string; name: string }[]>('/ref/routes');

  const [branchId, setBranchId] = useState<number | null>(null);
  const [isFt, setIsFt] = useState(true);
  const [programme, setProgramme] = useState<'FOU' | 'BE' | 'ELE'>('FOU');
  const [route, setRoute] = useState<string>('LT1');
  const [suffix, setSuffix] = useState('');
  const [startPeriodId, setStartPeriodId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  /*
   * PHÂN CÔNG NGAY TRONG CÙNG PANEL (mục 12.2).
   *
   * Tách một lớp ra rồi mới đi tìm người dạy là cách chắc chắn nhất để có những lớp không
   * ai phụ trách nằm im vài tuần — và case của các em đó không có chủ. Nên hỏi luôn ở đây,
   * lúc người tạo lớp còn đang nghĩ về nó.
   */
  const teachers = useApi<{ id: number; name: string; classCount: number }[]>(
    branchId ? `/ref/teachers?branchId=${branchId}` : '/ref/teachers', [branchId],
  );
  const [core, setCore] = useState<number[]>([]);
  const [bySkill, setBySkill] = useState<Record<string, number[]>>({});

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
        isFastTrack: isFt,
        skills: [...tpl.skills],
        startPeriodId,
      });
      /*
       * Phân công gửi ngay sau khi lớp có mã. Lớp vẫn tạo được nếu bước này hỏng — mất phân
       * công thì sửa lại ở trang lớp, còn mất lớp thì người dùng phải gõ lại từ đầu.
       */
      const slots = [
        ...core.map((userId) => ({ userId, skill: null, isCore: true })),
        ...Object.entries(bySkill).flatMap(([skill, ids]) =>
          ids.map((userId) => ({ userId, skill, isCore: false }))),
      ];
      if (slots.length) {
        try {
          await api.put(`/classes/${r.id}/teachers`, { slots });
        } catch (e: any) {
          toast.push('error', `Đã tạo lớp ${code} nhưng chưa lưu được phân công: ${e.message}`);
        }
      }
      invalidate('/classes'); invalidate('/ref/classes'); invalidate('/my-work');
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
              onClick={() => setIsFt(true)}>Fast Track (FT)</button>
            <button type="button" className={`btn btn-sm ${!isFt ? 'btn-primary' : ''}`}
              onClick={() => setIsFt(false)}>Normal</button>
          </div>
        </Field>

        {isFt ? (
          <Field label="Lộ trình" required hint="Lớp FT chỉ cần đánh số; lộ trình quyết định target của các em.">
            <div className="flex flex-wrap gap-2">
              {(routes.data ?? []).map((r) => (
                <button key={r.code} type="button" className={`btn btn-sm ${route === r.code ? 'btn-primary' : ''}`}
                  title={r.name} onClick={() => setRoute(r.code)}>{r.code}</button>
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
            {tpl.skills.map((sk) => <Info key={sk}>{skillShort(sk)}</Info>)}
          </div>
          {!isFt && (
            <p className="text-xs text-slate-400 mt-2 mb-0">
              {tpl.weeks} tuần · Progress Test tuần {tpl.checkpoints.find((c) => c.kind === 'progress')?.studyWeek}
              {' · '}Final Test tuần {tpl.checkpoints.find((c) => c.kind === 'final')?.studyWeek}
            </p>
          )}
        </div>

        {/* ------------------------------------------- PHÂN CÔNG GIÁO VIÊN (mục 12.2) */}
        <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--line)' }}>
          <span className="label m-0">Phân công giáo viên</span>
          <TeacherPick label="GVCN" hint="Người nhận case và theo dõi cả lớp."
            picked={core} onPick={setCore} options={teachers.data ?? []} />
          {/*
            MÔN PHẢI HỢP CHƯƠNG TRÌNH: lớp Fast Track có W1/W2 chấm riêng, lớp Normal chỉ có
            một môn Writing. Bày sai bộ môn là mời phân công một người vào một môn lớp không dạy.
          */}
          {tpl.skills.map((sk) => (
            <TeacherPick key={sk} label={skillShort(sk)}
              picked={bySkill[sk] ?? []}
              onPick={(ids) => setBySkill((m) => ({ ...m, [sk]: ids }))}
              options={teachers.data ?? []} />
          ))}
          {/*
            THIẾU PHÂN CÔNG PHẢI RÕ, KHÔNG GÁN BỪA (mục 12.2). Nói thẳng còn thiếu chỗ nào,
            và vẫn cho tạo lớp — ép đủ ngay là mời người dùng gán bừa một cái tên cho xong.
          */}
          {(() => {
            const missing = [
              ...(core.length ? [] : ['GVCN']),
              ...tpl.skills.filter((sk) => !(bySkill[sk] ?? []).length).map((sk) => skillShort(sk)),
            ];
            return missing.length ? (
              <p className="text-xs text-amber-200 m-0">
                Chưa phân công: {missing.join(', ')}. Vẫn tạo được lớp — bổ sung sau ở trang lớp.
                {!core.length && ' Lớp chưa có GVCN thì case của các em chưa có người nhận.'}
              </p>
            ) : (
              <p className="text-xs text-slate-500 m-0">Đã phân công đủ GVCN và các môn.</p>
            );
          })()}
          <SectionNote>
            Một người nhận nhiều vai hoặc nhiều môn là bình thường, và một môn có hai người dạy
            cũng vậy. Hệ thống không tự gán ai vào đâu.
          </SectionNote>
        </div>

        <SectionNote>
          Tạo lớp xong thì thêm học viên bằng panel “Thêm học viên” — panel đó sẽ chọn sẵn lớp này.
        </SectionNote>
      </div>
    </Drawer>
  );
}

/**
 * MỘT DÒNG PHÂN CÔNG: một vai hoặc một môn, và NHIỀU người nếu cần.
 *
 * Ô chọn một-người sẽ âm thầm đá mất người thứ hai — trong dữ liệu thật đã có lớp hai người
 * cùng dạy một môn, và lỗi kiểu đó chỉ lộ ra khi ai đó không nhập được điểm.
 */
function TeacherPick({ label, hint, picked, onPick, options }: {
  label: string; hint?: string;
  picked: number[];
  onPick: (ids: number[]) => void;
  options: { id: number; name: string; classCount: number }[];
}) {
  const nameOf = (id: number) => options.find((o) => o.id === id)?.name ?? `#${id}`;
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 border-b last:border-0"
         style={{ borderColor: 'var(--line)' }}>
      <span className="text-sm text-slate-200 min-w-[6rem]">{label}</span>
      {hint && <span className="text-[11px] text-slate-500 w-full sm:w-auto">{hint}</span>}
      {picked.map((id) => (
        <span key={id} className="inline-flex items-center gap-1">
          <Info>{nameOf(id)}</Info>
          <button type="button" className="text-slate-500 hover:text-rose-200 text-xs leading-none px-1"
            title="Bỏ phân công" onClick={() => onPick(picked.filter((x) => x !== id))}>×</button>
        </span>
      ))}
      <select className="field w-auto text-xs py-1" value=""
        onChange={(e) => {
          const id = Number(e.target.value);
          if (id && !picked.includes(id)) onPick([...picked, id]);
          e.currentTarget.value = '';
        }}>
        <option value="">+ Thêm giáo viên</option>
        {options.filter((o) => !picked.includes(o.id)).map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}{o.classCount ? ` · ${o.classCount} lớp` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
