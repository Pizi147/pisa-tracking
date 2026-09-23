import { useEffect, useMemo, useRef, useState } from 'react';
import { api, invalidate } from '../../../lib/api.ts';
import { Drawer } from '../../../ui/Drawer.tsx';
import { WeekPicker, resolveWeek, usePeriodWindow } from '../../../ui/Filters.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { addDaysStr } from '../../../lib/format.ts';
import { tomTatXemTruoc, tuanLich } from '@shared/domain/index.ts';
import type { LuoiFTData } from './LuoiFT.tsx';

type DongHangLoat = {
  studentId: number; ten: string; hanhDong: 'tao' | 'doi' | 'giu' | 'loi';
  tu: { rlw: string | null; s: string | null }; den: { rlw: string | null; s: string | null };
  canhBao: string[]; loi: string | null;
};

/** MT{n} còn ít nhất một em CHƯA THI XONG cả RLW lẫn S (Q8) — suy trực tiếp từ lưới đã tải, không hỏi máy chủ lần nữa. */
export function dotConTheXep(data: LuoiFTData | null | undefined): number[] {
  if (!data) return [];
  return data.cot.filter((n) => data.hang.some((h) => {
    const d = h.dot[n];
    return !d || d.attemptId === null || d.rlw.trangThai !== 'xong' || d.s.trangThai !== 'xong';
  }));
}

/**
 * XẾP LỊCH HÀNG LOẠT — ngăn trượt bên phải, 5 bước trên MỘT màn (R9, phương án A đã chốt, mockup 05b (2)).
 *
 * Lưới lịch vẫn thấy bên trái (ngăn hẹp, không che hết màn). Bước 4 gọi `/ke-hoach-test/hang-loat` với
 * `xemTruoc:true` mỗi khi bước 1–3 đổi; bước 5 lưu, lỗi một phần (R9b) thì ngăn KHÔNG đóng, bước 2 chỉ còn các em lỗi.
 */
export function NganXepHangLoat({ classId, classCode, luoi, onClose, onDone }: {
  classId: number; classCode: string; luoi: LuoiFTData | null | undefined;
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const dots = useMemo(() => dotConTheXep(luoi), [luoi]);
  const [attemptNo, setAttemptNo] = useState<number | null>(dots[0] ?? null);
  useEffect(() => { if (attemptNo === null && dots.length) setAttemptNo(dots[0]); }, [dots, attemptNo]);

  const emChuaXong = useMemo(() => {
    if (!luoi || attemptNo === null) return [];
    return luoi.hang.filter((h) => {
      const d = h.dot[attemptNo];
      return !d || d.attemptId === null || d.rlw.trangThai !== 'xong' || d.s.trangThai !== 'xong';
    });
  }, [luoi, attemptNo]);

  const [ticked, setTicked] = useState<Set<number>>(new Set());
  useEffect(() => { setTicked(new Set(emChuaXong.map((h) => h.studentId))); }, [emChuaXong]);

  const [rlwPeriodId, setRlwPeriodId] = useState<number | null>(null);
  const [sPeriodId, setSPeriodId] = useState<number | null>(null);
  const [cungTuan, setCungTuan] = useState(false);
  const rlwWin = usePeriodWindow(rlwPeriodId, 'planning');
  const rlwWeek = rlwWin.data?.find((p) => p.isAnchor)?.weekStart ?? null;
  useEffect(() => {
    if (!rlwWeek) return;
    if (cungTuan) { setSPeriodId(rlwPeriodId); return; }
    let cancelled = false;
    void resolveWeek(addDaysStr(rlwWeek, 7)).then((r) => { if (!cancelled) setSPeriodId(r.id); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rlwWeek, cungTuan]);

  const [force, setForce] = useState(false);
  const [dong, setDong] = useState<DongHangLoat[] | null>(null);
  const [dangXem, setDangXem] = useState(false);
  const [busy, setBusy] = useState(false);
  const soDangXem = useRef(0);

  const studentIds = [...ticked];

  useEffect(() => {
    setDong(null);
    if (!attemptNo || !rlwPeriodId || !studentIds.length) return;
    const seq = ++soDangXem.current;
    setDangXem(true);
    const timer = setTimeout(() => {
      api.post<{ dong: DongHangLoat[]; daLuu: number }>('/ke-hoach-test/hang-loat', {
        classId, attemptNo, studentIds, rlwPeriodId, sPeriodId: cungTuan ? rlwPeriodId : sPeriodId,
        force, xemTruoc: true,
      })
        .then((r) => { if (seq === soDangXem.current) { setDong(r.dong); setDangXem(false); } })
        .catch(() => { if (seq === soDangXem.current) setDangXem(false); });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, attemptNo, rlwPeriodId, sPeriodId, cungTuan, force, studentIds.join(',')]);

  const tomTat = useMemo(() => (dong ? tomTatXemTruoc(dong, (d) => (d ? tuanLich(d) : '—')) : []), [dong]);
  const dongLoi = (dong ?? []).filter((d) => d.hanhDong === 'loi');
  const soLuu = (dong ?? []).filter((d) => d.hanhDong === 'tao' || d.hanhDong === 'doi').length;

  const luu = async () => {
    if (!attemptNo || !rlwPeriodId || !studentIds.length || busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ dong: DongHangLoat[]; daLuu: number }>('/ke-hoach-test/hang-loat', {
        classId, attemptNo, studentIds, rlwPeriodId, sPeriodId: cungTuan ? rlwPeriodId : sPeriodId,
        force, xemTruoc: false,
      });
      invalidate('/ke-hoach-test'); invalidate('/attempts'); invalidate('/cham');
      const conLoi = r.dong.filter((d) => d.hanhDong === 'loi');
      toast.push(r.daLuu > 0 ? 'ok' : 'error', `Đã xếp ${r.daLuu} em${conLoi.length ? `, còn ${conLoi.length} em lỗi` : ''}.`);
      onDone();
      if (!conLoi.length) { onClose(); return; }
      /* R9b: giữ ngăn, chỉ còn các em lỗi được tick sẵn để sửa tuần rồi lưu lại. */
      setTicked(new Set(conLoi.map((d) => d.studentId)));
      setDong(r.dong);
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không lưu được — thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-md"
      title={`Xếp lịch hàng loạt · ${classCode}`}
      footer={
        <>
          <button className="btn min-h-[44px]" onClick={onClose} disabled={busy}>Đóng</button>
          <button className="btn btn-primary min-h-[44px]" onClick={() => void luu()}
            disabled={busy || !attemptNo || !rlwPeriodId || soLuu === 0}>
            {busy ? 'Đang lưu…' : `Lưu lịch cho ${soLuu} em`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 1. Đợt */}
        <Buoc so={1} nhan="Đợt">
          <div className="flex flex-wrap gap-1.5">
            {dots.map((n) => (
              <button key={n} type="button"
                className={`btn min-h-[44px] ${attemptNo === n ? 'btn-primary' : ''}`}
                onClick={() => setAttemptNo(n)}>MT{n}</button>
            ))}
            {!dots.length && <span className="text-xs text-slate-500">Lớp đã xong mọi đợt.</span>}
          </div>
        </Buoc>

        {/* 2. Học viên */}
        <Buoc so={2} nhan={`Học viên · ${ticked.size}/${emChuaXong.length} đã chọn`}>
          <div className="space-y-1 max-h-48 overflow-y-auto surface-2 rounded-lg p-2">
            {emChuaXong.map((h) => {
              const d = h.dot[attemptNo ?? -1];
              const daCoLich = d?.attemptId && (d.rlw.tuan || d.s.tuan);
              return (
                <label key={h.studentId} className="flex items-center gap-2 py-1 min-h-[44px] text-sm text-slate-200">
                  <input type="checkbox" className="accent-sky-400" checked={ticked.has(h.studentId)}
                    onChange={(e) => setTicked((s) => {
                      const n = new Set(s);
                      if (e.target.checked) n.add(h.studentId); else n.delete(h.studentId);
                      return n;
                    })} />
                  <span className="flex-1 truncate">{h.ten}</span>
                  {daCoLich && (
                    <span className="text-[11px] text-slate-500 shrink-0">
                      đã có · {tuanLich(d.rlw.tuan ?? d.s.tuan)}
                    </span>
                  )}
                </label>
              );
            })}
            {!emChuaXong.length && <span className="text-xs text-slate-500">Không có em nào để xếp.</span>}
          </div>
        </Buoc>

        {/* 3. Tuần */}
        <Buoc so={3} nhan="Tuần">
          <div className="space-y-2">
            <WeekPicker periodId={rlwPeriodId} onPeriod={setRlwPeriodId} label="RLW" scope="planning" />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="accent-sky-400" checked={cungTuan}
                onChange={(e) => setCungTuan(e.target.checked)} />
              cùng tuần RLW
            </label>
            {!cungTuan && <WeekPicker periodId={sPeriodId} onPeriod={setSPeriodId} label="S" scope="planning" />}
          </div>
        </Buoc>

        {/* 4. Xem trước */}
        <Buoc so={4} nhan="Xem trước">
          {dangXem ? (
            <div className="text-xs text-slate-500">Đang tính…</div>
          ) : !dong ? (
            <div className="text-xs text-slate-500">Chọn đợt, học viên và tuần để xem trước.</div>
          ) : (
            <div className="space-y-2">
              {tomTat.map((c, i) => <div key={i} className="text-xs text-slate-300">{c}</div>)}
              {dongLoi.length > 0 && (
                <div className="space-y-1 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                  {dongLoi.map((d) => (
                    <div key={d.studentId} className="text-xs text-rose-300">{d.ten}: {d.loi}</div>
                  ))}
                </div>
              )}
              {dong.some((d) => d.canhBao.length > 0) && (
                <label className="flex items-center gap-2 text-xs text-amber-200">
                  <input type="checkbox" className="accent-sky-400" checked={force}
                    onChange={(e) => setForce(e.target.checked)} />
                  Vẫn xếp các em có cảnh báo
                </label>
              )}
            </div>
          )}
        </Buoc>

        {/* 5. Lưu */}
        <Buoc so={5} nhan="Lưu">
          <span className="text-xs text-slate-500">{soLuu} em sẽ được lưu.</span>
        </Buoc>
      </div>
    </Drawer>
  );
}

function Buoc({ so, nhan, children }: { so: number; nhan: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: '22px 1fr' }}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>{so}</span>
      <div>
        <div className="text-sm font-semibold text-slate-200 mb-1">{nhan}</div>
        {children}
      </div>
    </div>
  );
}
