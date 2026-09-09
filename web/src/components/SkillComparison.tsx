import { useState } from 'react';
import { api, invalidate } from '../lib/api.ts';
import { useApi } from '../lib/useApi.ts';
import { ENTRY_SKILL_LABEL, type EntrySkill } from '@shared/domain.ts';
import { fmtBand, fmtDate } from '../lib/format.ts';
import { Empty, SectionNote, Skeleton } from './ui.tsx';
import { useToast } from './Toast.tsx';

type Side = { band: number; on: string | null; raw: number | null; criteria: (number | null)[] | null };
type Row = {
  skill: EntrySkill;
  estimate: (Side & { by: string | null }) | null;
  mock: (Side & { attemptNo: number; source: string }) | null;
  delta: number | null;
};

const RAW_SKILLS: EntrySkill[] = ['listening', 'reading'];
const CRITERIA_LABEL: Record<string, string[]> = {
  writing1: ['TA', 'CC', 'LR', 'GRA'],
  writing2: ['TR', 'CC', 'LR', 'GRA'],
  speaking: ['FC', 'LR', 'GRA', 'P'],
};

/**
 * Δ chỉ là KHOẢNG CÁCH giữa hai con số, KHÔNG phải một lời khen hay một cảnh báo.
 *
 * Điểm Mock và Đánh giá GV là hai thứ khác hẳn nhau: một bên là kết quả một bài làm trong
 * một buổi, một bên là nhận định của giáo viên qua cả quá trình dạy. Bên nào cao hơn cũng
 * KHÔNG tự nó là tốt hay xấu — nên tuyệt đối không tô màu tốt/xấu theo dấu của phép trừ.
 *
 * Chỉ dùng sắc trung tính, đủ để mắt bắt được chỗ hai số lệch nhau nhiều.
 */
function deltaStyle(d: number): { cls: string; hint: string } {
  if (d === 0) return { cls: 'text-slate-500', hint: 'Hai con số bằng nhau' };
  const far = Math.abs(d) >= 1;
  return {
    cls: far ? 'text-slate-100' : 'text-slate-300',
    hint: `Hai con số lệch nhau ${Math.abs(d)} band — chỉ là khoảng cách, không phải đánh giá tốt hay xấu`,
  };
}

function detailText(skill: EntrySkill, s: Side | null): string | null {
  if (!s) return null;
  if (s.raw !== null) return `${s.raw}/40 câu đúng`;
  if (s.criteria?.every((c) => c !== null)) {
    const labels = CRITERIA_LABEL[skill] ?? ['1', '2', '3', '4'];
    return s.criteria.map((c, i) => `${labels[i]} ${c}`).join(' · ');
  }
  return null;
}

/**
 * MỘT bảng cho cả điểm Mock và Đánh giá GV, không phải hai bảng rời.
 *
 * Hai bảng riêng khiến người đọc phải tự ghép từng dòng trong đầu, mà việc thật lúc nào
 * cũng là so hai con số ấy. Gộp lại thì vẫn phân biệt được đâu là kết quả bài thi và đâu
 * là nhận định của giáo viên — hai cột, hai nguồn, ghi rõ ngày.
 *
 * Bấm vào một ô điểm sẽ mở căn cứ: số câu đúng, hoặc bốn tiêu chí.
 */
export function SkillComparison({ studentId, canEditSkills = [] }: {
  studentId: number; canEditSkills?: string[];
}) {
  const { data, loading, reload } = useApi<Row[]>(`/students/${studentId}/estimate-comparison`);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<EntrySkill | null>(null);

  if (loading) return <div className="p-4"><Skeleton rows={4} /></div>;
  if (!data || data.every((c) => !c.estimate && !c.mock)) {
    return <Empty title="Chưa có Đánh giá GV hay điểm Mock nào để so sánh" />;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Kỹ năng</th>
              <th className="th text-right">Mock gần nhất</th>
              <th className="th text-right">Đánh giá GV</th>
              <th className="th text-right">Δ</th>
              <th className="th w-24"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => {
              const d = c.delta === null ? null : deltaStyle(c.delta);
              const rowOpen = open === c.skill;
              const canEdit = canEditSkills.includes(c.skill);
              return (
                <tr key={c.skill} className="row-hover align-top">
                  <td className="td text-slate-200 whitespace-nowrap">{ENTRY_SKILL_LABEL[c.skill]}</td>

                  <td className="td text-right">
                    <button
                      className="appearance-none bg-transparent border-0 p-0 tabular-nums text-slate-100 disabled:text-slate-600"
                      disabled={!c.mock}
                      onClick={() => setOpen(rowOpen ? null : c.skill)}
                      title={c.mock ? 'Xem căn cứ điểm' : undefined}
                    >
                      {fmtBand(c.mock?.band ?? null)}
                    </button>
                    <div className="text-[10px] text-slate-500">
                      {c.mock ? `${c.mock.source}${c.mock.on ? ` · ${fmtDate(c.mock.on)}` : ''}` : '—'}
                    </div>
                    {rowOpen && detailText(c.skill, c.mock) && (
                      <div className="text-[10px] text-sky-200 mt-0.5">{detailText(c.skill, c.mock)}</div>
                    )}
                  </td>

                  <td className="td text-right">
                    <button
                      className="appearance-none bg-transparent border-0 p-0 tabular-nums text-slate-100 disabled:text-slate-600"
                      disabled={!c.estimate}
                      onClick={() => setOpen(rowOpen ? null : c.skill)}
                      title={c.estimate ? 'Xem căn cứ đánh giá' : undefined}
                    >
                      {fmtBand(c.estimate?.band ?? null)}
                    </button>
                    <div className="text-[10px] text-slate-500">
                      {c.estimate
                        ? `${fmtDate(c.estimate.on!)}${c.estimate.by ? ` · ${c.estimate.by}` : ''}`
                        : '—'}
                    </div>
                    {rowOpen && detailText(c.skill, c.estimate) && (
                      <div className="text-[10px] text-sky-200 mt-0.5">{detailText(c.skill, c.estimate)}</div>
                    )}
                  </td>

                  <td className={`td text-right tabular-nums font-medium ${d?.cls ?? 'text-slate-600'}`} title={d?.hint}>
                    {c.delta === null ? '—' : c.delta > 0 ? `+${c.delta}` : String(c.delta)}
                  </td>

                  <td className="td text-right">
                    {canEdit && (
                      <button className="btn btn-sm" onClick={() => setEditing(c.skill)}>
                        {c.estimate ? 'Cập nhật' : 'Đánh giá'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <EstimateForm
          studentId={studentId} skill={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); invalidate('/students'); reload(); }}
        />
      )}

      <div className="p-3">
        <SectionNote>
          <strong>Δ chỉ là khoảng cách giữa hai con số</strong> (Mock − Đánh giá GV), không phải lời khen cũng
          không phải cảnh báo. Đây là hai thứ khác hẳn nhau: một bên là kết quả một bài làm trong một buổi,
          một bên là nhận định của giáo viên qua cả quá trình dạy — bên nào cao hơn cũng không tự nó nói lên
          điều gì. Hai cột có thể đến từ hai thời điểm khác nhau nên luôn kèm ngày; điểm Mock từng kỹ năng có
          thể thuộc các lượt khác nhau, và các ô này KHÔNG được ghép thành một bài Mock hay một Overall chung.
        </SectionNote>
      </div>
    </>
  );
}

/**
 * Nhập Đánh giá GV GIỐNG HỆT nhập điểm Mock: L/R nhập số câu đúng, W/S nhập bốn tiêu chí.
 * Band do hệ thống tính — nhờ vậy hai cột nằm cùng một thang và Δ mới có nghĩa.
 */
function EstimateForm({ studentId, skill, onClose, onSaved }: {
  studentId: number; skill: EntrySkill; onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const isRaw = RAW_SKILLS.includes(skill);
  const [raw, setRaw] = useState('');
  const [criteria, setCriteria] = useState<string[]>(['', '', '', '']);
  const [busy, setBusy] = useState(false);
  const labels = CRITERIA_LABEL[skill] ?? ['1', '2', '3', '4'];

  const save = async () => {
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/estimates`, isRaw
        ? { skill, raw: raw === '' ? null : Number(raw) }
        : { skill, criteria: criteria.map((c) => (c === '' ? null : Number(c))) });
      toast.push('ok', `Đã cập nhật Đánh giá GV cho ${ENTRY_SKILL_LABEL[skill]}.`);
      onSaved();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="px-4 pb-4">
      <div className="surface-2 rounded-lg p-3 space-y-2">
        <div className="text-xs text-slate-300">
          Đánh giá GV · <strong>{ENTRY_SKILL_LABEL[skill]}</strong>
          <span className="text-slate-500"> — cập nhật được bất kỳ lúc nào, không phụ thuộc tuần MT</span>
        </div>
        {isRaw ? (
          <label className="block max-w-[12rem]">
            <span className="label">Số câu đúng / 40</span>
            <input
              className="field" type="number" min={0} max={40} value={raw} autoFocus
              onChange={(e) => setRaw(e.target.value)}
            />
          </label>
        ) : (
          <div className="flex flex-wrap gap-2">
            {labels.map((l, i) => (
              <label key={l} className="block w-20">
                <span className="label">{l}</span>
                <input
                  className="field" type="number" step="0.5" min={0} max={9} value={criteria[i]}
                  autoFocus={i === 0}
                  onChange={(e) => setCriteria((c) => c.map((x, j) => (j === i ? e.target.value : x)))}
                />
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu đánh giá'}
          </button>
          <button className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        </div>
        <p className="text-[11px] text-slate-500">
          Band do hệ thống tính từ căn cứ, đúng cùng công thức với điểm Mock. Mỗi lần lưu ghi thêm một dòng
          nên lịch sử đánh giá vẫn còn.
        </p>
      </div>
    </div>
  );
}
