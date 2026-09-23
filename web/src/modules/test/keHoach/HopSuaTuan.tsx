import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { Modal } from '../../../ui/Drawer.tsx';
import { WeekPicker, resolveWeek, usePeriodWindow } from '../../../ui/Filters.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { addDaysStr } from '../../../lib/format.ts';
import { tuanLich } from '@shared/domain/index.ts';

type KiemNhom = {
  blockers: string[]; warnings: string[]; seDoi: string[];
  giuNguyen: Array<{ skill: string; vi: string }>;
};

const TEN_NHOM: Record<'rlw' | 's', string> = { rlw: 'RLW', s: 'Speaking' };
const TEN_KY_NANG: Record<string, string> = {
  listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking',
};

/**
 * SỬA LỊCH MỘT EM (R10, mockup 05b "Sửa lịch · Bùi Thảo Vy · MT3 · RLW") — cùng một hộp cho hai việc:
 *
 *   mode="sua"      Ô đã có lịch — bấm ô mở đúng nhóm (RLW hoặc S), một `WeekPicker`, xem trước qua
 *                    `/ke-hoach-test/nhom/kiem` rồi lưu qua `/ke-hoach-test/nhom`.
 *   mode="xep-moi"   Ô "+ xếp" — hai `WeekPicker` (RLW, S) + ô tick "cùng tuần RLW" (Q7, mặc định BỎ TICK,
 *                    S tự đặt tuần sau RLW cho tới khi người dùng tự sửa), lưu qua `/ke-hoach-test/xep-moi`.
 */
export function HopSuaTuan(props: {
  onClose: () => void; onSaved: () => void;
} & (
  | { mode: 'sua'; attemptId: number; nhom: 'rlw' | 's'; ten: string; attemptNo: number }
  | { mode: 'xep-moi'; studentId: number; ten: string; attemptNo: number }
)) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (props.mode === 'sua') return <HopSua {...props} toast={toast} busy={busy} setBusy={setBusy} />;
  return <HopXepMoi {...props} toast={toast} busy={busy} setBusy={setBusy} />;
}

function HopSua({ attemptId, nhom, ten, attemptNo, onClose, onSaved, toast, busy, setBusy }: {
  attemptId: number; nhom: 'rlw' | 's'; ten: string; attemptNo: number;
  onClose: () => void; onSaved: () => void;
  toast: ReturnType<typeof useToast>; busy: boolean; setBusy: (b: boolean) => void;
}) {
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [kiem, setKiem] = useState<KiemNhom | null>(null);
  const [force, setForce] = useState(false);
  const [reason, setReason] = useState('');
  const soDangKiem = useRef(0);

  useEffect(() => {
    if (!periodId) { setKiem(null); return; }
    setForce(false);
    const seq = ++soDangKiem.current;
    api.post<KiemNhom>('/ke-hoach-test/nhom/kiem', { attemptId, nhom, periodId })
      .then((r) => { if (seq === soDangKiem.current) setKiem(r); })
      .catch(() => { if (seq === soDangKiem.current) setKiem(null); });
  }, [attemptId, nhom, periodId]);

  const luu = async () => {
    if (!periodId || busy) return;
    setBusy(true);
    try {
      await api.post('/ke-hoach-test/nhom', { attemptId, nhom, periodId, force, reason: reason.trim() || null });
      toast.push('ok', 'Đã lưu lịch.');
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      onSaved(); onClose();
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không lưu được — thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const coChan = !!kiem?.blockers.length;
  const coCanhBao = !kiem?.blockers.length && !!kiem?.warnings.length;
  const nhomKhac = nhom === 'rlw' ? 's' : 'rlw';
  const giuKhac = kiem?.giuNguyen.filter((g) => g.skill !== nhomKhac) ?? [];

  return (
    <Modal open onClose={onClose} width="max-w-sm"
      title={`Sửa lịch · ${ten} · MT${attemptNo} · ${TEN_NHOM[nhom]}`}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" onClick={() => void luu()} disabled={busy || !periodId || coChan}>
            {busy ? 'Đang lưu…' : coCanhBao && !force ? 'Vẫn xếp vào tuần này' : 'Lưu'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <WeekPicker periodId={periodId} onPeriod={setPeriodId} label="Tuần" scope="planning" />

        {periodId && kiem && (
          <div className={`text-xs leading-relaxed ${coChan ? 'text-rose-300' : coCanhBao ? 'text-amber-200' : 'text-slate-400'}`}>
            {coChan ? kiem.blockers.join(' ')
              : coCanhBao ? (
                <>
                  {kiem.warnings.join(' ')}{' '}
                  <button type="button" className="underline" onClick={() => setForce(true)}>
                    Vẫn xếp vào tuần này
                  </button>
                </>
              ) : `Không trùng tuần MT kề.`}
          </div>
        )}
        {giuKhac.length > 0 && (
          <div className="text-xs text-slate-500">
            {giuKhac.map((g) => `Giữ ${TEN_KY_NANG[g.skill] ?? g.skill} — ${g.vi}.`).join(' ')}
          </div>
        )}

        <label className="block">
          <span className="label">Lý do (không bắt buộc)</span>
          <input className="field w-full" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Vì sao đổi tuần…" />
        </label>
      </div>
    </Modal>
  );
}

function HopXepMoi({ studentId, ten, attemptNo, onClose, onSaved, toast, busy, setBusy }: {
  studentId: number; ten: string; attemptNo: number;
  onClose: () => void; onSaved: () => void;
  toast: ReturnType<typeof useToast>; busy: boolean; setBusy: (b: boolean) => void;
}) {
  const [rlwPeriodId, setRlwPeriodId] = useState<number | null>(null);
  const [sPeriodId, setSPeriodId] = useState<number | null>(null);
  const [cungTuan, setCungTuan] = useState(false);
  const [canhBao, setCanhBao] = useState<string | null>(null);
  const rlwWin = usePeriodWindow(rlwPeriodId, 'planning');
  const rlwWeek = rlwWin.data?.find((p) => p.isAnchor)?.weekStart ?? null;

  /* S mặc định tuần SAU RLW (Q7) — mỗi lần RLW đổi (và chưa tick "cùng tuần") thì đặt lại S. */
  useEffect(() => {
    if (!rlwWeek) return;
    if (cungTuan) { setSPeriodId(rlwPeriodId); return; }
    let cancelled = false;
    void resolveWeek(addDaysStr(rlwWeek, 7)).then((r) => { if (!cancelled) setSPeriodId(r.id); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rlwWeek, cungTuan]);
  /* Đổi tuần lại thì cảnh báo cũ (nếu có) không còn đúng — hỏi lại từ đầu. */
  useEffect(() => { setCanhBao(null); }, [rlwPeriodId, sPeriodId, cungTuan]);

  const luu = async (force = false) => {
    if (!rlwPeriodId || busy) return;
    setBusy(true);
    try {
      await api.post('/ke-hoach-test/xep-moi', {
        studentId, attemptNo, rlwPeriodId, sPeriodId: cungTuan ? rlwPeriodId : sPeriodId, force,
      });
      toast.push('ok', 'Đã xếp lịch mới.');
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      onSaved(); onClose();
    } catch (e: any) {
      const msg = e.message ?? 'Không xếp được — thử lại.';
      /* CẢNH BÁO (cách một tuần) khác BLOCKER (trùng/vượt tuần) — máy chủ đòi `force` mới cho qua cảnh báo,
       * nên giữ hộp mở và đổi nút thành "Vẫn xếp vào tuần này" thay vì chỉ báo lỗi rồi thôi. */
      if (!force && /Xác nhận lại/.test(msg)) setCanhBao(msg);
      else toast.push('error', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} width="max-w-sm"
      title={`Xếp lịch mới · ${ten} · MT${attemptNo}`}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" onClick={() => void luu(!!canhBao)} disabled={busy || !rlwPeriodId}>
            {busy ? 'Đang lưu…' : canhBao ? 'Vẫn xếp vào tuần này' : 'Lưu'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <WeekPicker periodId={rlwPeriodId} onPeriod={setRlwPeriodId} label="Tuần RLW" scope="planning" />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" className="accent-sky-400" checked={cungTuan}
            onChange={(e) => setCungTuan(e.target.checked)} />
          cùng tuần RLW
        </label>
        {!cungTuan && (
          <WeekPicker periodId={sPeriodId} onPeriod={setSPeriodId} label="Tuần Speaking" scope="planning" />
        )}
        {rlwWeek && (
          <p className="text-[11px] text-slate-500">
            RLW {tuanLich(rlwWeek)}{!cungTuan && sPeriodId ? ' · Speaking tuần sau (đã tự đặt, sửa được ở trên).' : ''}
          </p>
        )}
        {canhBao && <p className="text-xs text-amber-200">{canhBao}</p>}
      </div>
    </Modal>
  );
}
