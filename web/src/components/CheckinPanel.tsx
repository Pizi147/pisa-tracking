import { useState } from 'react';
import { api, invalidate } from '../lib/api.ts';
import { useApi } from '../lib/useApi.ts';
import { ENTRY_SKILL_LABEL, type EntrySkill } from '@shared/domain.ts';
import { fmtBand, fmtDate } from '../lib/format.ts';
import { Empty, Field, SectionNote, Skeleton } from './ui.tsx';
import { Modal } from './Drawer.tsx';
import { useToast } from './Toast.tsx';

type Row = {
  skill: EntrySkill;
  checkin: {
    band: number | null; on: string; by: string | null; basis: string | null;
    judgement: string | null; raw: number | null; criteria: (number | null)[] | null;
  } | null;
  official: {
    band: number; on: string | null; attemptNo: number; source: string;
    raw: number | null; criteria: (number | null)[] | null;
  } | null;
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
 * Điểm chính thức và ghi nhận của giáo viên là hai thứ khác hẳn nhau: một bên là kết quả
 * một bài làm trong một buổi, một bên là nhận định qua cả quá trình dạy. Bên nào cao hơn
 * cũng KHÔNG tự nó là tốt hay xấu — nên tuyệt đối không tô màu tốt/xấu theo dấu phép trừ.
 */
function deltaStyle(d: number): { cls: string; hint: string } {
  if (d === 0) return { cls: 'text-slate-500', hint: 'Hai con số bằng nhau' };
  const far = Math.abs(d) >= 1;
  return {
    cls: far ? 'text-slate-100' : 'text-slate-300',
    hint: `Hai con số lệch nhau ${Math.abs(d)} band — chỉ là khoảng cách, không phải đánh giá tốt hay xấu`,
  };
}

function detailText(skill: EntrySkill, raw: number | null, criteria: (number | null)[] | null): string | null {
  if (raw !== null) return `${raw}/40 câu đúng`;
  if (criteria?.every((c) => c !== null)) {
    const labels = CRITERIA_LABEL[skill] ?? ['1', '2', '3', '4'];
    return criteria.map((c, i) => `${labels[i]} ${c}`).join(' · ');
  }
  return null;
}

/**
 * MỘT bảng cho cả điểm chính thức và ghi nhận của giáo viên, không phải hai bảng rời.
 *
 * Điểm quan trọng nhất ở đây: ghi nhận KHÔNG BẮT BUỘC CÓ ĐIỂM. Phần lớn nhận xét trên lớp
 * là bằng lời — "Part 2 nói đủ thời gian, còn ngập ngừng khi đổi chủ đề". Những dòng ấy
 * hiện nguyên văn, không bị quy ra một con số để đem trừ.
 */
export function CheckinPanel({ studentId, cycleId, canEditSkills = [] }: {
  studentId: number; cycleId?: number | null; canEditSkills?: string[];
}) {
  const q = cycleId ? `?cycleId=${cycleId}` : '';
  const { data, loading, reload } = useApi<Row[]>(`/students/${studentId}/checkin-comparison${q}`, [cycleId]);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<EntrySkill | null>(null);

  if (loading) return <div className="p-4"><Skeleton rows={4} /></div>;
  if (!data) return null;

  const empty = data.every((c) => !c.checkin && !c.official);

  return (
    <>
      {empty ? (
        <div className="p-4"><Empty title="Chưa có ghi nhận hay điểm nào"
          hint="Giáo viên ghi nhận được bất kỳ lúc nào, không cần đợi đến kỳ Mock." /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Kỹ năng</th>
                <th className="th text-right">Điểm gần nhất</th>
                <th className="th">Giáo viên ghi nhận</th>
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
                        disabled={!c.official}
                        onClick={() => setOpen(rowOpen ? null : c.skill)}
                        title={c.official ? 'Xem căn cứ điểm' : undefined}
                      >
                        {fmtBand(c.official?.band ?? null)}
                      </button>
                      <div className="text-[10px] text-slate-500">
                        {c.official ? `${c.official.source}${c.official.on ? ` · ${fmtDate(c.official.on)}` : ''}` : '—'}
                      </div>
                      {rowOpen && c.official && detailText(c.skill, c.official.raw, c.official.criteria) && (
                        <div className="text-[10px] text-sky-200 mt-0.5">
                          {detailText(c.skill, c.official.raw, c.official.criteria)}
                        </div>
                      )}
                    </td>

                    <td className="td">
                      {c.checkin ? (
                        <>
                          {/*
                            Nhận định bằng lời hiện NGUYÊN VĂN. Đây thường là thứ hữu ích
                            nhất trên cả bảng — một con số 6.0 không nói được "mất điểm ở
                            TRUE/FALSE/NOT GIVEN".
                          */}
                          {c.checkin.judgement && (
                            <p className="text-sm text-slate-200 m-0">{c.checkin.judgement}</p>
                          )}
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {c.checkin.band !== null && (
                              <span className="tabular-nums text-slate-300 mr-1">
                                ước lượng {fmtBand(c.checkin.band)}
                                {c.checkin.basis === 'judgement' && ' (nhận định)'}
                              </span>
                            )}
                            {fmtDate(c.checkin.on)}{c.checkin.by ? ` · ${c.checkin.by}` : ''}
                          </div>
                          {rowOpen && detailText(c.skill, c.checkin.raw, c.checkin.criteria) && (
                            <div className="text-[10px] text-sky-200 mt-0.5">
                              {detailText(c.skill, c.checkin.raw, c.checkin.criteria)}
                            </div>
                          )}
                        </>
                      ) : <span className="text-slate-600">—</span>}
                    </td>

                    <td className={`td text-right tabular-nums font-medium ${d?.cls ?? 'text-slate-600'}`} title={d?.hint}>
                      {c.delta === null ? '—' : c.delta > 0 ? `+${c.delta}` : String(c.delta)}
                    </td>

                    <td className="td text-right">
                      {canEdit && (
                        <button className="btn btn-sm" onClick={() => setEditing(c.skill)}>Ghi nhận</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CheckinForm
          studentId={studentId} cycleId={cycleId} skill={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); invalidate('/students'); reload(); }}
        />
      )}

      <div className="p-3">
        <SectionNote>
          <strong>Δ chỉ là khoảng cách giữa hai con số</strong> (điểm chính thức − ghi nhận), không phải lời
          khen cũng không phải cảnh báo. Ghi nhận bằng lời không có Δ vì không có gì để trừ — và cũng không
          nên quy nó ra một con số chỉ để lấp ô trống. Hai cột có thể đến từ hai thời điểm khác nhau nên luôn
          kèm ngày; điểm từng kỹ năng có thể thuộc các lượt khác nhau và KHÔNG được ghép thành một Overall.
        </SectionNote>
      </div>
    </>
  );
}

/**
 * GHI NHẬN: nhận định bằng lời là đủ.
 *
 * Điểm ước lượng là TUỲ CHỌN và phải nói rõ dựa trên cái gì — có bài làm thật thì nhập
 * căn cứ như điểm chính thức, không có thì đánh dấu là nhận định. Không bịa số câu đúng
 * để một cảm nhận trông giống một phép đo.
 */
function CheckinForm({ studentId, cycleId, skill, onClose, onSaved }: {
  studentId: number; cycleId?: number | null; skill: EntrySkill;
  onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const isRaw = RAW_SKILLS.includes(skill);
  const [judgement, setJudgement] = useState('');
  const [withScore, setWithScore] = useState<'none' | 'judgement' | 'measured'>('none');
  const [band, setBand] = useState('');
  const [raw, setRaw] = useState('');
  const [criteria, setCriteria] = useState<string[]>(['', '', '', '']);
  const [observedOn, setObservedOn] = useState('');
  const [busy, setBusy] = useState(false);
  const labels = CRITERIA_LABEL[skill] ?? ['1', '2', '3', '4'];

  const save = async () => {
    setBusy(true);
    try {
      const body: any = { skill, judgement, observedOn: observedOn || undefined, cycleId: cycleId ?? undefined };
      if (withScore === 'judgement') { body.basis = 'judgement'; body.band = band === '' ? null : Number(band); }
      if (withScore === 'measured') {
        if (isRaw) { body.basis = 'raw'; body.raw = raw === '' ? null : Number(raw); }
        else { body.basis = 'criteria'; body.criteria = criteria.map((c) => (c === '' ? null : Number(c))); }
      }
      await api.post(`/students/${studentId}/checkins`, body);
      toast.push('ok', `Đã ghi nhận ${ENTRY_SKILL_LABEL[skill]}.`);
      onSaved();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Ghi nhận · ${ENTRY_SKILL_LABEL[skill]}`}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Nhận xét" hint="Một, hai câu về điều bạn quan sát được trên lớp.">
          <textarea className="field" rows={3} value={judgement} autoFocus
            onChange={(e) => setJudgement(e.target.value)}
            placeholder="Làm matching ổn, mất điểm ở TRUE/FALSE/NOT GIVEN." />
        </Field>

        <Field label="Có kèm điểm ước lượng không">
          <div className="flex gap-1 flex-wrap">
            <button type="button" className={`btn btn-sm ${withScore === 'none' ? 'btn-primary' : ''}`}
              onClick={() => setWithScore('none')}>Không, chỉ nhận xét</button>
            <button type="button" className={`btn btn-sm ${withScore === 'judgement' ? 'btn-primary' : ''}`}
              onClick={() => setWithScore('judgement')}>Ước chừng một band</button>
            <button type="button" className={`btn btn-sm ${withScore === 'measured' ? 'btn-primary' : ''}`}
              onClick={() => setWithScore('measured')}>
              {isRaw ? 'Có bài, nhập số câu đúng' : 'Có chấm bốn tiêu chí'}
            </button>
          </div>
        </Field>

        {withScore === 'judgement' && (
          <Field label="Band ước chừng" hint="Được đánh dấu là NHẬN ĐỊNH, không phải một phép đo.">
            <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
              value={band} onChange={(e) => setBand(e.target.value)} />
          </Field>
        )}

        {withScore === 'measured' && (isRaw ? (
          <Field label="Số câu đúng / 40">
            <input className="field max-w-[8rem]" type="number" min={0} max={40}
              value={raw} onChange={(e) => setRaw(e.target.value)} />
          </Field>
        ) : (
          <Field label="Bốn tiêu chí" hint="Band do hệ thống tính, đúng cùng công thức với điểm chính thức.">
            <div className="flex flex-wrap gap-2">
              {labels.map((l, i) => (
                <label key={l} className="block w-20">
                  <span className="label">{l}</span>
                  <input className="field" type="number" step="0.5" min={0} max={9} value={criteria[i]}
                    onChange={(e) => setCriteria((c) => c.map((x, j) => (j === i ? e.target.value : x)))} />
                </label>
              ))}
            </div>
          </Field>
        ))}

        <Field label="Ngày quan sát" hint="Bỏ trống thì lấy hôm nay. Ghi bù thì chọn đúng ngày hôm đó.">
          <input type="date" className="field" value={observedOn} onChange={(e) => setObservedOn(e.target.value)} />
        </Field>

        <SectionNote>
          Ghi nhận KHÔNG bao giờ ghi đè điểm chính thức, và ghi được bất kỳ lúc nào — không
          phụ thuộc tuần MT, hạn nhập điểm hay cửa sổ sửa báo cáo tuần.
        </SectionNote>
      </div>
    </Modal>
  );
}
