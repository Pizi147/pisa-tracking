import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import {
  MEASURE_KINDS, MEASURE_KIND_LABEL, chiaThemViPham, thanPatchPhuongAn, type MeasureKind, type NguoiChon,
  type PatchPhuongAnGoc, type ViolationState,
} from '@shared/domain/index.ts';
import { fmtDate } from '../../lib/format.ts';
import { ChiTietViPham } from './ChiTietViPham.tsx';

type KindRow = { kind: MeasureKind; label: string; available: boolean; reason: string | null };
type ViolationRow = { id: number; occurredOn: string; description: string; categoryLabel: string; state: ViolationState; stateLabel: string };
type MeasureDetail = {
  id: number; studentId: number; studentName: string; kind: string; customName: string | null;
  ownerUserId: number | null; ownerName: string | null; note: string | null;
  createdAt: string; canManage: boolean; attachmentCount: number;
  violations: { id: number }[];
};

/**
 * PANEL `PHƯƠNG ÁN XỬ LÝ` ĐANG CHUẨN BỊ (YT-2, YT-3, mockup 09c khối phải) — sửa loại/phụ trách/nội dung/danh sách vi
 * phạm TẠI CHỖ, một lần Lưu (Q1/Q2). Sửa một vi phạm bên trong: đóng panel này → mở form Sửa → xong quay lại đúng đây
 * (Q3, xử lý ở `usePanelYThuc`). Danh sách vi phạm có thay đổi CHƯA LƯU thì khoá Sửa/Xoá của từng vi phạm.
 */
export function PhuongAnPanel({ measureId, onClose, onDone, onXacNhan, onSuaViPham }: {
  measureId: number;
  onClose: () => void;
  onDone?: () => void;
  onXacNhan: (measureId: number) => void;
  onSuaViPham: (v: { id: number; studentId: number; category: string; skill: string | null; occurredOn: string; description: string }, measureId: number) => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const { data: d, reload } = useApi<MeasureDetail>(`/measures/${measureId}`, [measureId]);
  const kinds = useApi<{ rows: KindRow[] }>(d ? `/students/${d.studentId}/measure-kinds?excludeMeasureId=${measureId}` : null, [d?.studentId, measureId]);
  const allV = useApi<{ rows: ViolationRow[] }>(d ? `/students/${d.studentId}/violations` : null, [d?.studentId]);

  const [kind, setKind] = useState<string>('talk_short');
  const [customName, setCustomName] = useState('');
  const [note, setNote] = useState('');
  /* null = "không đổi" (Q1/Q2) — giữ nguyên phụ trách hiện có, không phải "bỏ trống". */
  const [owner, setOwner] = useState<NguoiChon | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [initedFor, setInitedFor] = useState<number | null>(null);
  const [xemDaXuLy, setXemDaXuLy] = useState(false);
  const [moChiTiet, setMoChiTiet] = useState<number | null>(null);
  const [hoiXoa, setHoiXoa] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (d && initedFor !== measureId) {
      setKind(d.kind); setCustomName(d.customName ?? ''); setNote(d.note ?? ''); setOwner(null);
      setPicked(new Set(d.violations.map((v) => v.id)));
      setXemDaXuLy(false); setMoChiTiet(null); setHoiXoa(false);
      setInitedFor(measureId);
    }
  }, [d, measureId, initedFor]);

  if (!d) return <Modal open onClose={onClose} title="Phương án xử lý"><p>Đang tải…</p></Modal>;

  const byId = new Map((allV.data?.rows ?? []).map((v) => [v.id, v]));
  const list = [...picked].map((id) => byId.get(id)).filter((v): v is ViolationRow => !!v)
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.id - a.id);
  const them = chiaThemViPham(allV.data?.rows ?? [], picked);
  const laDuyNhat = picked.size === 1;

  const goc: PatchPhuongAnGoc = {
    kind: d.kind, customName: d.customName ?? null, note: d.note ?? null, ownerUserId: d.ownerUserId ?? null,
    violationIds: d.violations.map((v) => v.id),
  };
  const ownerUserId = owner === null ? undefined : owner.kieu === 'toi' ? session?.user?.id : owner.kieu === 'tai_khoan' ? owner.id : undefined;
  const patch = thanPatchPhuongAn(goc, {
    kind, customName: kind === 'other' ? (customName.trim() || null) : null, note: note.trim() || null,
    ownerUserId, violationIds: [...picked],
  });
  const dirty = patch !== null;
  const choSuaXoa = !dirty && !laDuyNhat;

  const isLocked = (k: string) => (kinds.data?.rows ?? []).find((r) => r.kind === k)?.available === false;
  const lockReason = (k: string) => (kinds.data?.rows ?? []).find((r) => r.kind === k)?.reason ?? null;

  const toggle = (id: number) => {
    setPicked((s) => {
      if (s.size === 1 && s.has(id)) return s; // B02: PA phải còn ít nhất một vi phạm
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const ghiXongToast = () => {
    invalidate('/measures'); invalidate('/violations'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
    toast.push('ok', 'Đã lưu phương án');
  };

  const luu = async () => {
    if (!patch) return;
    setBusy(true);
    try { await api.patch(`/measures/${measureId}`, patch); ghiXongToast(); }
    catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  const xacNhan = async () => {
    setBusy(true);
    try {
      if (patch) { await api.patch(`/measures/${measureId}`, patch); ghiXongToast(); }
      onXacNhan(measureId);
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  const xoaPhuongAn = async () => {
    setBusy(true);
    try {
      await api.del(`/measures/${measureId}`);
      invalidate('/measures'); invalidate('/violations'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', 'Đã xoá phương án');
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  const rong = (v: ViolationRow) => `${v.description.slice(0, 60)}${v.description.length > 60 ? '…' : ''}`;

  return (
    <Modal open onClose={onClose} width="max-w-xl"
      title={<>Phương án xử lý <span className="text-xs font-normal text-amber-200/90">Đang chuẩn bị</span></>}
      footer={hoiXoa ? (
        <>
          <span className="text-sm text-amber-200/90 mr-auto">Xoá phương án này? Vi phạm quay về Chưa xử lý.</span>
          <button className="btn" disabled={busy} onClick={() => setHoiXoa(false)}>Huỷ</button>
          <button className="btn text-rose-200" disabled={busy} onClick={xoaPhuongAn}>Xoá</button>
        </>
      ) : (
        <>
          <button className="btn btn-ghost text-rose-200 mr-auto" onClick={() => setHoiXoa(true)}>Xoá</button>
          <button className="btn" onClick={onClose}>Đóng</button>
          <button className="btn" disabled={busy || !patch} title={!patch ? 'Chưa có gì thay đổi' : undefined} onClick={luu}>Lưu</button>
          <button className="btn btn-primary" disabled={busy} onClick={xacNhan}>Xác nhận đã thực hiện →</button>
        </>
      )}>
      <div className="space-y-3">
        <p className="text-xs text-slate-500 m-0">{d.studentName} · tạo {fmtDate(d.createdAt)}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="Loại">
            <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
              {MEASURE_KINDS.map((k) => (
                <option key={k} value={k} disabled={isLocked(k) && k !== d.kind}>
                  {MEASURE_KIND_LABEL[k]}{isLocked(k) && k !== d.kind ? ` — khoá: ${lockReason(k)}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phụ trách">
            <ChonNguoi nhom="nhan_vien" choNgoai={false} value={owner} onChange={setOwner} khongDoi={d.ownerName ?? 'chưa có'} />
          </Field>
        </div>

        {kind === 'other' && (
          <Field label="Tên phương án" required>
            <input className="field" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </Field>
        )}

        <Field label="Nội dung">
          <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <Field label={`Vi phạm · ${list.length}`} as="div">
          <ul className="list-none p-0 m-0 space-y-1">
            {list.map((v) => (
              <li key={v.id}>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked disabled={picked.size === 1}
                    title={picked.size === 1 ? 'Phương án cần ít nhất một vi phạm — không cần nữa thì Xoá phương án' : undefined}
                    onChange={() => toggle(v.id)} />
                  <span className="text-slate-500 text-xs tabular-nums">{fmtDate(v.occurredOn)}</span>
                  <button type="button" className="flex-1 min-w-0 text-left text-slate-200 hover:underline"
                    onClick={() => setMoChiTiet((cur) => (cur === v.id ? null : v.id))}>
                    {rong(v)}
                  </button>
                  <span className="text-[11px] text-slate-500 shrink-0">{v.categoryLabel}</span>
                </div>
                {moChiTiet === v.id && (
                  <div className="mt-1.5 ml-6 border-l pl-3" style={{ borderColor: 'var(--line)' }}>
                    <ChiTietViPham violationId={v.id} canManage={d.canManage} boQuaPhuongAnId={measureId} choSuaXoa={choSuaXoa}
                      onSua={(vv) => onSuaViPham({ ...vv }, measureId)}
                      onDaXoa={() => { setMoChiTiet(null); reload(); }}
                      onMoPhuongAn={() => {}} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Field>

        <Field label="Thêm vi phạm" as="div">
          {them.chuaXuLy.length === 0 && them.daXuLy.length === 0 ? (
            <p className="text-xs text-slate-500 m-0">Không còn vi phạm nào khác của em này.</p>
          ) : (
            <ul className="list-none p-0 m-0 space-y-1">
              {them.chuaXuLy.map((v) => (
                <li key={v.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={false} onChange={() => toggle(v.id)} />
                  <span className="text-slate-500 text-xs tabular-nums">{fmtDate(v.occurredOn)}</span>
                  <span className="flex-1 min-w-0 text-slate-300">{rong(v)}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">{v.categoryLabel}</span>
                </li>
              ))}
            </ul>
          )}
          {them.daXuLy.length > 0 && (
            <div className="mt-1.5">
              <button type="button" className="text-xs text-sky-300 hover:underline" aria-expanded={xemDaXuLy}
                onClick={() => setXemDaXuLy((v) => !v)}>
                Xem thêm {them.daXuLy.length} vi phạm (đã xử lý) ▾
              </button>
              {xemDaXuLy && (
                <ul className="list-none p-0 m-0 mt-1 space-y-1">
                  {them.daXuLy.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={false} onChange={() => toggle(v.id)} />
                      <span className="text-slate-500 text-xs tabular-nums">{fmtDate(v.occurredOn)}</span>
                      <div className="flex-1 min-w-0">
                        <span className="block text-slate-300">{rong(v)}</span>
                        <span className="block text-[11px] text-slate-500">{v.stateLabel}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0">{v.categoryLabel}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Field>

        <Field label={`Bằng chứng · ${d.attachmentCount}`} as="div">
          <BangChung ownerType="discipline_measure" ownerId={d.id} canEdit={d.canManage} tieuDe="" onChanged={reload} />
        </Field>
      </div>
    </Modal>
  );
}
