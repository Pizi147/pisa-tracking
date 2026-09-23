import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MEASURE_KINDS, MEASURE_KIND_LABEL, ngay, type MeasureKind, type NguoiChon } from '@shared/domain/index.ts';

type KindRow = { kind: MeasureKind; label: string; available: boolean; reason: string | null };

/**
 * PANEL `TẠO PA XỬ LÝ` (Y_THUC §7.4; PR-UX3 mockup 15 §7). GVCN/QL gom một hay nhiều vi phạm CỦA ĐÚNG MỘT học viên vào một PA.
 * `Loại` là MỘT `<select>` xếp nhẹ → nặng (chọn thẳng loại nào cũng được); chuỗi Thư cảnh cáo khoá đúng dòng, lý do ở `title` của dòng
 * đó — không có `[khoá]`, không radio dọc. Lỗi chỉ hiện SAU khi bấm (`Còn thiếu: …`).
 * Chân: `Huỷ | Lưu nháp | Đã làm luôn` (→ panel Xác nhận với PA vừa tạo, một mạch).
 */
export function CreateMeasurePanel({
  open, onClose, studentId, studentName, lop, violations, onDone, onConfirmNow,
}: {
  open: boolean; onClose: () => void;
  studentId: number; studentName: string;
  /** Mã lớp hiện ở đầu ngăn. */
  lop?: string | null;
  /** Vi phạm đang gom, đủ để hiện lại danh sách và bỏ bớt từng dòng. */
  violations: { id: number; occurredOn: string; categoryLabel: string; description: string }[];
  onDone?: () => void;
  /** Bấm "Đã làm luôn" → mở thẳng panel Xác nhận với PA vừa tạo (7.4 → 7.5 một mạch). */
  onConfirmNow?: (measureId: number) => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const kinds = useApi<{ rows: KindRow[] }>(open && studentId ? `/students/${studentId}/measure-kinds` : null, [open, studentId]);
  const [kind, setKind] = useState<string>('talk_short');
  const [customName, setCustomName] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<Set<number>>(new Set());
  /* YT-9: null = để trống, máy chủ tự điền GVCN của lớp như cũ. */
  const [owner, setOwner] = useState<NguoiChon | null>(null);
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind('talk_short'); setCustomName(''); setNote(''); setOwner(null); setDaBam(false);
    setPicked(new Set(violations.map((v) => v.id)));
  }, [open]);

  const list = violations.filter((v) => picked.has(v.id));
  const availability = kinds.data?.rows ?? [];
  const isLocked = (k: string) => availability.find((r) => r.kind === k)?.available === false;
  const lockReason = (k: string) => availability.find((r) => r.kind === k)?.reason ?? null;
  const thieu: string[] = [];
  if (!list.length) thieu.push('Vi phạm (cần ít nhất một)');
  if (kind === 'other' && !customName.trim()) thieu.push('Tên phương án');

  const create = async (confirmNow: boolean) => {
    setDaBam(true);
    if (thieu.length > 0) return;
    setBusy(true);
    try {
      const ownerUserId = owner?.kieu === 'toi' ? session?.user?.id : owner?.kieu === 'tai_khoan' ? owner.id : undefined;
      const m = await api.post<any>('/measures', {
        studentId, kind, customName: kind === 'other' ? customName.trim() : null,
        violationIds: list.map((v) => v.id), note: note.trim() || null,
        ownerUserId,
        idempotencyKey: `measure:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      });
      invalidate('/violations'); invalidate('/measures'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      if (confirmNow) {
        onClose(); onConfirmNow?.(m.id);
      } else {
        toast.push('ok', 'Đã lưu nháp — Đang chuẩn bị');
        onClose(); onDone?.();
      }
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  if (!open) return null;

  return (
    <KhungPanel tieuDe="Tạo PA xử lý" hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: daBam ? thieu : undefined,
        phu: <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => create(false)}>Lưu nháp</button>,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => create(true)}>Đã làm luôn</button>,
      }}>
      <Khoi tieuDe="Phương án"
        luat="Lưu nháp: việc cần vài ngày (Report, Thư cảnh cáo). Đã làm luôn: việc vừa làm tại chỗ. Loại xếp từ nhẹ đến nặng; chọn thẳng loại nào cũng được.">
        <Hang2>
          <Truong nhan="Loại" batBuoc>
            <select className="field w-full" value={kind} onChange={(e) => setKind(e.target.value)}
              title={isLocked(kind) ? lockReason(kind) ?? undefined : undefined}>
              {MEASURE_KINDS.map((k) => (
                <option key={k} value={k} disabled={isLocked(k)} title={isLocked(k) ? lockReason(k) ?? undefined : undefined}>
                  {MEASURE_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </Truong>
          <Truong nhan="Phụ trách" as="div">
            <ChonNguoi nhom="nhan_vien" choNgoai={false} value={owner} onChange={setOwner} macDinhTrong="Mặc định: GVCN của lớp" />
          </Truong>
        </Hang2>
        {kind === 'other' && (
          <Truong nhan="Tên phương án" batBuoc>
            <input className="field w-full" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </Truong>
        )}
        <Truong nhan="Ghi chú" tuyChon>
          <textarea className="field w-full" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>

      <Khoi tieuDe={`Vi phạm được gom · ${list.length}`}>
        {list.length === 0 ? (
          <p className="m-0 text-xs text-slate-500">Không còn vi phạm nào được chọn.</p>
        ) : (
          <ul className="m-0 list-none space-y-1.5 p-0">
            {list.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-200" title={v.description}>{v.description}</span>
                  <span className="block text-[11px] text-slate-500">{ngay(v.occurredOn, homNay)} · {v.categoryLabel}</span>
                </span>
                <button type="button" className="btn btn-sm btn-ghost"
                  onClick={() => setPicked((s) => { const n = new Set(s); n.delete(v.id); return n; })}>Bỏ</button>
              </li>
            ))}
          </ul>
        )}
      </Khoi>
    </KhungPanel>
  );
}
