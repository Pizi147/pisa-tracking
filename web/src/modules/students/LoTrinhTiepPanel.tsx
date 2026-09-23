import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field } from '../../ui/ui.tsx';
import { HUONG_TIEP, huongTiepKhaDung, nhanHuong, type Huong } from '@shared/domain/index.ts';

type LoTrinhTiepData = {
  lop: { id: number; code: string; ma: string | null; maKe: string | null; laLopThuong: boolean; dangHoc: boolean } | null;
  banGhi: { huong: Huong; lopDuKienId: number | null; mucTieu: number | null; thangThi: string | null; ghiChu: string | null } | null;
  lopDuKien: { id: number; code: string; ma: string | null; ft: boolean }[];
  coTheGhi: boolean;
};

/**
 * LỘ TRÌNH TIẾP THEO (mockup 11-1, §3.9.1) — dự định cho một em SAU lớp đang học, ghi trước
 * khi thật sự chuyển. Chỉ áp dụng lớp thường. Dùng chung cho ⋯ dòng HV (panel riêng ở đây) và
 * ⋮ Hồ sơ HV (`LoTrinhTiepForm` chèn thẳng vào `StudentManagePanel`, không panel chồng panel).
 */
export function LoTrinhTiepForm({ studentId, onDone }: { studentId: number; onDone?: () => void }) {
  const toast = useToast();
  const info = useApi<LoTrinhTiepData>(`/students/${studentId}/lo-trinh-tiep`, [studentId]);
  const [huong, setHuong] = useState<Huong | ''>('');
  const [lopDuKienId, setLopDuKienId] = useState<number | ''>('');
  const [mucTieu, setMucTieu] = useState('');
  const [thangThi, setThangThi] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const bg = info.data?.banGhi;
    setHuong(bg?.huong ?? '');
    setLopDuKienId(bg?.lopDuKienId ?? '');
    setMucTieu(bg?.mucTieu != null ? String(bg.mucTieu) : '');
    setThangThi(bg?.thangThi ?? '');
    setGhiChu(bg?.ghiChu ?? '');
  }, [info.data]);

  if (info.loading) return <p className="text-sm text-slate-500">Đang tải…</p>;
  const data = info.data;
  if (!data?.lop) return <p className="text-sm text-slate-500">Học viên không đang học lớp nào.</p>;
  if (!data.lop.laLopThuong) return <p className="text-sm text-slate-500">Lộ trình tiếp theo chỉ áp dụng cho lớp thường.</p>;

  const cacHuong = huongTiepKhaDung(data.lop.ma as any);
  const lopHopLe = data.lopDuKien.filter((l) => (
    huong === 'fast_track' ? l.ft
      : huong === 'hoc_lai' ? !l.ft && l.ma === data.lop!.ma
      : !l.ft && l.ma === data.lop!.maKe
  ));

  const submit = async () => {
    if (!huong) { toast.push('error', 'Chọn một hướng.'); return; }
    setBusy(true);
    try {
      await api.put(`/students/${studentId}/lo-trinh-tiep`, {
        huong, lopDuKienId: lopDuKienId || null,
        mucTieu: huong === 'fast_track' && mucTieu ? Number(mucTieu) : null,
        thangThi: huong === 'fast_track' && thangThi ? thangThi : null,
        ghiChu: ghiChu || null,
      });
      invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/my-work');
      toast.push('ok', 'Đã ghi lộ trình tiếp theo');
      onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  if (!data.coTheGhi) return <p className="text-sm text-slate-500">Bạn không có quyền ghi lộ trình tiếp theo cho học viên này.</p>;

  return (
    <div className="space-y-3">
      <Field label="Hướng tiếp theo" required>
        <div className="flex flex-wrap gap-1.5">
          {cacHuong.map((h) => (
            <button key={h} type="button"
              className={`btn btn-sm ${huong === h ? 'btn-primary' : ''}`}
              onClick={() => { setHuong(h); setLopDuKienId(''); }}>
              {nhanHuong(h, { ma: data.lop!.ma as any, maKe: data.lop!.maKe as any })}
            </button>
          ))}
        </div>
      </Field>
      {huong && (
        <Field label="Lớp dự kiến" hint="Không bắt buộc — chưa biết thì để trống.">
          <select className="field" value={lopDuKienId} onChange={(e) => setLopDuKienId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Chưa chọn</option>
            {lopHopLe.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
          </select>
        </Field>
      )}
      {huong === 'fast_track' && (
        <>
          <Field label="Mục tiêu band" hint="Điền sau cũng được.">
            <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
              value={mucTieu} onChange={(e) => setMucTieu(e.target.value)} />
          </Field>
          <Field label="Tháng dự kiến thi">
            <input className="field max-w-[10rem]" type="month" value={thangThi} onChange={(e) => setThangThi(e.target.value)} />
          </Field>
        </>
      )}
      <Field label="Ghi chú">
        <textarea className="field" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
      </Field>
      <p className="text-xs text-slate-500 m-0">Chỉ là dự định, chưa đổi lớp.</p>
      <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
    </div>
  );
}

export function LoTrinhTiepPanel({ open, onClose, studentId, studentName, onDone }: {
  open: boolean; onClose: () => void; studentId: number; studentName?: string; onDone?: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={`Lộ trình tiếp theo${studentName ? ` · ${studentName}` : ''}`}>
      <LoTrinhTiepForm studentId={studentId} onDone={() => { onDone?.(); onClose(); }} />
    </Modal>
  );
}
