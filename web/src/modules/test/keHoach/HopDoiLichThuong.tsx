import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { Drawer } from '../../../ui/Drawer.tsx';
import { WeekPicker } from '../../../ui/Filters.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { skillLabel, skillShort } from '../../../lib/format.ts';
import { REGULAR_SKILLS, tuanLich } from '@shared/domain/index.ts';

type Dong = { studentId: number; ten: string; tu: string | null; den: string | null; loi: string | null; giu: string | null };

/**
 * ĐỔI LỊCH LỚP THƯỜNG — MỘT hộp cho cả hai lối vào (Q11): bấm ô môn (cả lớp, môn đã chọn sẵn) và nút "Dời một môn"
 * (trống, tự chọn môn + học viên). Xem trước gọi `/ke-hoach-test/thuong/doi-lich` với `xemTruoc:true`.
 */
export function HopDoiLichThuong({ classId, classCode, kind, nhan, skillMacDinh, onClose, onSaved }: {
  classId: number; classCode: string; kind: 'progress' | 'final'; nhan: string; skillMacDinh?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const [skill, setSkill] = useState(skillMacDinh ?? REGULAR_SKILLS[0]);
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [chonHv, setChonHv] = useState(false);
  const [ticked, setTicked] = useState<Set<number> | null>(null); // null = cả lớp
  const [force, setForce] = useState(false);
  const [dong, setDong] = useState<Dong[] | null>(null);
  const [dangXem, setDangXem] = useState(false);
  const [busy, setBusy] = useState(false);
  const soDangXem = useRef(0);

  useEffect(() => {
    setDong(null);
    if (!periodId) return;
    const seq = ++soDangXem.current;
    setDangXem(true);
    const timer = setTimeout(() => {
      api.post<{ dong: Dong[]; daLuu: number }>('/ke-hoach-test/thuong/doi-lich', {
        classId, kind, skill, periodId, studentIds: ticked ? [...ticked] : undefined, force, xemTruoc: true,
      })
        .then((r) => { if (seq === soDangXem.current) { setDong(r.dong); setDangXem(false); } })
        .catch(() => { if (seq === soDangXem.current) setDangXem(false); });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, kind, skill, periodId, ticked, force]);

  const moi = (dong ?? []).filter((d) => !d.giu && !d.loi);
  const giu = (dong ?? []).filter((d) => d.giu);
  const loi = (dong ?? []).filter((d) => d.loi);

  const luu = async () => {
    if (!periodId || busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ dong: Dong[]; daLuu: number }>('/ke-hoach-test/thuong/doi-lich', {
        classId, kind, skill, periodId, studentIds: ticked ? [...ticked] : undefined, force, xemTruoc: false,
      });
      invalidate('/ke-hoach-test'); invalidate('/cham');
      const conLoi = r.dong.filter((d) => d.loi);
      toast.push(r.daLuu > 0 ? 'ok' : 'error', `Đã đổi lịch cho ${r.daLuu} em${conLoi.length ? `, còn ${conLoi.length} em lỗi` : ''}.`);
      onSaved();
      if (!conLoi.length) { onClose(); return; }
      setTicked(new Set(conLoi.map((d) => d.studentId)));
      setDong(r.dong);
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không lưu được — thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-sm" title={`Đổi lịch · ${classCode} · ${nhan}`}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" onClick={() => void luu()} disabled={busy || !periodId || moi.length === 0}>
            {busy ? 'Đang lưu…' : `Lưu lịch cho ${moi.length} em`}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <span className="label">Môn</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {REGULAR_SKILLS.map((s) => (
              <button key={s} type="button" className={`btn btn-sm ${skill === s ? 'btn-primary' : ''}`}
                onClick={() => setSkill(s)} title={skillLabel(s)}>{skillShort(s)}</button>
            ))}
          </div>
        </div>

        <WeekPicker periodId={periodId} onPeriod={setPeriodId} label="Tuần mới" scope="planning" />

        <div>
          <span className="label">Học viên</span>
          <div className="mt-1">
            <button type="button" className="btn btn-sm" onClick={() => setChonHv((v) => !v)}>
              {ticked === null ? `Cả lớp` : `Chọn học viên… (${ticked.size} em)`}
            </button>
          </div>
          {chonHv && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto surface-2 rounded-lg p-2">
              {(dong ?? []).map((d) => (
                <label key={d.studentId} className="flex items-center gap-2 py-1 text-sm text-slate-200">
                  <input type="checkbox" className="accent-sky-400"
                    checked={ticked ? ticked.has(d.studentId) : true}
                    onChange={(e) => setTicked((s) => {
                      const n = new Set(s ?? (dong ?? []).map((x) => x.studentId));
                      if (e.target.checked) n.add(d.studentId); else n.delete(d.studentId);
                      return n;
                    })} />
                  {d.ten}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="label">Xem trước</span>
          {dangXem ? (
            <div className="text-xs text-slate-500 mt-1">Đang tính…</div>
          ) : !dong ? (
            <div className="text-xs text-slate-500 mt-1">Chọn tuần để xem trước.</div>
          ) : (
            <div className="space-y-1 mt-1">
              {moi.length > 0 && (
                <div className="text-xs text-slate-300">
                  {moi.length} em {moi[0].tu ? tuanLich(moi[0].tu) : '—'} → {periodId ? tuanLich(moi[0].den) : ''}
                </div>
              )}
              {giu.length > 0 && <div className="text-xs text-slate-500">{giu.length} em giữ nguyên (đã có điểm).</div>}
              {loi.length > 0 && (
                <div className="space-y-1 border-t pt-1" style={{ borderColor: 'var(--line)' }}>
                  {loi.map((d) => <div key={d.studentId} className="text-xs text-rose-300">{d.ten}: {d.loi}</div>)}
                </div>
              )}
              {(dong ?? []).length > 0 && (
                <label className="flex items-center gap-2 text-xs text-amber-200 mt-1">
                  <input type="checkbox" className="accent-sky-400" checked={force}
                    onChange={(e) => setForce(e.target.checked)} />
                  Vẫn xếp dù có cảnh báo
                </label>
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
