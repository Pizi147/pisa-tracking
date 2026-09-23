import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field } from '../../ui/ui.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import type { NguoiChon } from '@shared/domain/index.ts';
import { NO_HANDOVER_NOTE, TRANSFER_REASONS, TRANSFER_REASON_LABEL } from '@shared/domain/index.ts';

type LopDich = { id: number; code: string; chiNhanhId: number; ma: string | null; ft: boolean; tenChuongTrinh: string | null; tuan: string | null; gvcn: string | null };
type LopDichData = { chiNhanh: { id: number; name: string }[]; lop: LopDich[] };
type CaseMo = { id: number; title: string | null; category: string | null; owner: string | null; seDong: boolean; goiY: { id: number; ten: string } | null };
type XemChuyenLopData = {
  hienTai: { lop: { id: number; code: string }; ma: string | null; ft: boolean; chiNhanhId: number };
  caseMo: CaseMo[];
  luat: { khoa: 'giu' | 'dong-mo'; dongCase: 'ft' | 'normal' | null; canMucTieu: boolean; endKind: string } | null;
  canLuuY: boolean; doiChiNhanh: boolean;
};

/**
 * CHUYỂN LỚP MỘT EM (mockup 11-3, §3.9.3, Q3 — mọi chi nhánh) — thay `TransferForm` cũ. Dùng
 * chung cho ⋯ dòng HV (panel riêng) và ⋮ Hồ sơ HV (`ChuyenLopForm` chèn thẳng vào
 * `StudentManagePanel`, không panel chồng panel).
 */
export function ChuyenLopForm({ studentId, onDone }: { studentId: number; onDone?: () => void }) {
  const toast = useToast();
  const { session } = useSession();
  const lopDich = useApi<LopDichData>(`/chuyen-lop/lop-dich?studentId=${studentId}`, [studentId]);
  const [chiNhanhId, setChiNhanhId] = useState<number | null>(null);
  const [toClassId, setToClassId] = useState<number | null>(null);
  const xem = useApi<XemChuyenLopData>(
    toClassId ? `/students/${studentId}/chuyen-lop?toClassId=${toClassId}` : `/students/${studentId}/chuyen-lop`,
    [studentId, toClassId],
  );
  const [ngay, setNgay] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [luuY, setLuuY] = useState('');
  const [noNote, setNoNote] = useState(false);
  const [mucTieu, setMucTieu] = useState('');
  const [thangThi, setThangThi] = useState('');
  const [nguoiNhan, setNguoiNhan] = useState<Record<number, NguoiChon | null>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (chiNhanhId === null && xem.data) setChiNhanhId(xem.data.hienTai.chiNhanhId);
  }, [xem.data, chiNhanhId]);

  const lopCuaChiNhanh = useMemo(
    () => (lopDich.data?.lop ?? []).filter((l) => l.chiNhanhId === chiNhanhId),
    [lopDich.data, chiNhanhId],
  );

  const caseMo = xem.data?.caseMo ?? [];
  const canLuuY = xem.data?.canLuuY ?? true;
  const luat = xem.data?.luat ?? null;

  const nguoiChonToId = (v: NguoiChon | null): number | null => {
    if (!v) return null;
    if (v.kieu === 'tai_khoan') return v.id;
    if (v.kieu === 'toi') return session?.user?.id ?? null;
    return null;
  };

  const submit = async () => {
    if (!toClassId) { toast.push('error', 'Cần chọn lớp đích.'); return; }
    if (!reasonCode) { toast.push('error', 'Chọn lý do chuyển lớp.'); return; }
    if (luat?.canMucTieu && !mucTieu) { toast.push('error', 'Chuyển sang Fast Track cần Mục tiêu band.'); return; }
    setBusy(true);
    try {
      const nguoiNhanPayload: Record<number, number> = {};
      for (const c of caseMo) {
        const id = nguoiChonToId(nguoiNhan[c.id] ?? (c.goiY ? { kieu: 'tai_khoan', id: c.goiY.id, ten: c.goiY.ten } : null));
        if (id) nguoiNhanPayload[c.id] = id;
      }
      await api.post(`/students/${studentId}/transfer`, {
        toClassId, effectiveDate: ngay || undefined,
        reasonCode, reasonNote: reasonNote || undefined,
        handoverNote: luuY || undefined, noHandoverNote: noNote,
        nguoiNhan: Object.keys(nguoiNhanPayload).length ? nguoiNhanPayload : undefined,
        mucTieu: mucTieu ? Number(mucTieu) : undefined, thangThi: thangThi || undefined,
      });
      invalidate('/students'); invalidate('/attempts'); invalidate('/overview'); invalidate('/cases'); invalidate('/classes');
      toast.push('ok', 'Đã chuyển lớp');
      onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  if (lopDich.loading) return <p className="text-sm text-slate-500">Đang tải…</p>;

  return (
    <div className="space-y-3">
      <Field label="Chi nhánh" required hint="Mọi chi nhánh đang hoạt động — chọn khác chi nhánh hiện tại vẫn chuyển được.">
        <select className="field" value={chiNhanhId ?? ''}
          onChange={(e) => { setChiNhanhId(Number(e.target.value)); setToClassId(null); }}>
          {(lopDich.data?.chiNhanh ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </Field>
      {chiNhanhId !== null && chiNhanhId !== xem.data?.hienTai.chiNhanhId && (
        <p className="text-xs text-amber-200 m-0">Quản lý chi nhánh và GVCN lớp mới sẽ nhận thông báo.</p>
      )}
      <Field label="Lớp" required>
        <select className="field" value={toClassId ?? ''} onChange={(e) => setToClassId(Number(e.target.value) || null)}>
          <option value="">Chọn lớp…</option>
          {lopCuaChiNhanh.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code}{l.tuan ? ` · ${l.tuan}` : ''} · GVCN {l.gvcn ?? 'chưa có'}
              {l.tenChuongTrinh ? ` · ${l.tenChuongTrinh}` : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ngày hiệu lực">
        <input type="date" className="field" value={ngay} onChange={(e) => setNgay(e.target.value)} />
      </Field>
      <Field label="Lý do" required>
        <div className="flex flex-wrap gap-1.5">
          {TRANSFER_REASONS.map((r) => (
            <button key={r} type="button" className={`btn btn-sm ${reasonCode === r ? 'btn-primary' : ''}`}
              onClick={() => setReasonCode(r)}>{TRANSFER_REASON_LABEL[r]}</button>
          ))}
        </div>
      </Field>
      {reasonCode === 'khac' && (
        <Field label="Ghi rõ lý do" required>
          <input className="field" value={reasonNote} onChange={(e) => setReasonNote(e.target.value)} />
        </Field>
      )}

      {luat?.canMucTieu && (
        <>
          <Field label="Mục tiêu band" required>
            <input className="field max-w-[8rem]" type="number" step="0.5" min={0} max={9}
              value={mucTieu} onChange={(e) => setMucTieu(e.target.value)} />
          </Field>
          <Field label="Tháng dự kiến thi">
            <input type="month" className="field max-w-[10rem]" value={thangThi} onChange={(e) => setThangThi(e.target.value)} />
          </Field>
        </>
      )}
      {luat?.khoa === 'dong-mo' && (
        <p className="text-xs text-slate-400 m-0">
          Lớp mới khác chương trình: máy đóng khoá cũ và mở {luat.dongCase === 'ft' ? 'lộ trình Fast Track' : 'khoá mới'}.
        </p>
      )}

      {caseMo.length > 0 && (
        <div className="surface-2 rounded-lg p-3 space-y-2">
          <span className="label m-0">Case đang mở ({caseMo.length})</span>
          {caseMo.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                <span className="text-slate-100">{c.title ?? c.category}</span>
                {c.seDong && <span className="text-amber-200">→ tự đóng “Chuyển sang Fast Track”</span>}
              </div>
              {!c.seDong && (
                <ChonNguoi
                  value={nguoiNhan[c.id] ?? (c.goiY ? { kieu: 'tai_khoan', id: c.goiY.id, ten: c.goiY.ten } : null)}
                  onChange={(v) => setNguoiNhan((prev) => ({ ...prev, [c.id]: v }))}
                  nhom="giao_vien" choNgoai={false}
                  macDinhTrong={c.owner ? `Giữ nguyên: ${c.owner}` : 'Chưa có người phụ trách'}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {!canLuuY ? (
        <Field label="Lưu ý bàn giao" required>
          <textarea className="field" rows={2} value={luuY} onChange={(e) => setLuuY(e.target.value)}
            placeholder="Em còn Case dở — ghi lưu ý để người nhận biết em đang dở gì." />
        </Field>
      ) : (
        <div className="space-y-2">
          <Field label="Lưu ý bàn giao" required={!noNote}>
            <textarea className="field" rows={2} value={luuY} disabled={noNote} onChange={(e) => setLuuY(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={noNote} onChange={(e) => setNoNote(e.target.checked)} />
            {NO_HANDOVER_NOTE}
          </label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Đang chuyển…' : 'Chuyển lớp'}</button>
      </div>
    </div>
  );
}

export function ChuyenLopPanel({ open, onClose, studentId, studentName, onDone }: {
  open: boolean; onClose: () => void; studentId: number; studentName?: string; onDone?: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={`Chuyển lớp${studentName ? ` · ${studentName}` : ''}`}>
      <ChuyenLopForm studentId={studentId} onDone={() => { onDone?.(); onClose(); }} />
    </Modal>
  );
}
