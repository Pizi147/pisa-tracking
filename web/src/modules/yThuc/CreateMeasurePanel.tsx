import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { KHAC_TOI_THIEU, MEASURE_KINDS, MEASURE_KIND_LABEL, dsLoi, kiemGhiRoKhac, ngay, type MeasureKind, type NguoiChon } from '@shared/domain/index.ts';

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
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind('talk_short'); setCustomName(''); setNote(''); setOwner(null); lf.datLai();
    setPicked(new Set(violations.map((v) => v.id)));
  }, [open]);

  const list = violations.filter((v) => picked.has(v.id));
  const availability = kinds.data?.rows ?? [];
  const isLocked = (k: string) => availability.find((r) => r.kind === k)?.available === false;
  const lockReason = (k: string) => availability.find((r) => r.kind === k)?.reason ?? null;
  const loi = dsLoi(kind === 'other' ? [{ khoa: 'ghi-ro', nhan: 'Tên phương án', toiThieu: KHAC_TOI_THIEU }] : [], { 'ghi-ro': customName });
  if (!list.length) loi.unshift({ khoa: 'vi-pham', nhan: 'Vi phạm', lyDo: 'Cần ít nhất một vi phạm' });
  const thieu = loi.map((l) => l.nhan);

  const create = async (confirmNow: boolean) => {
    lf.bam();
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
        conThieu: lf.conThieu(loi),
        phu: <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => create(false)}>Lưu nháp</button>,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => create(true)}>Đã làm luôn</button>,
      }}>
      <Khoi tieuDe="Phương án"
        luat="Lưu nháp: việc cần vài ngày (Report, Thư cảnh cáo). Đã làm luôn: việc vừa làm tại chỗ. Loại xếp từ nhẹ đến nặng; chọn thẳng loại nào cũng được.">
        <Hang2>
          <div>
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
            <OKhac hien={kind === 'other'} value={customName} onChange={setCustomName} nhan="Tên phương án"
              goiY="Ví dụ: Viết bản cam kết"
              id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(customName) : null} />
          </div>
          <Truong nhan="Phụ trách" as="div">
            <ChonNguoi nhom="nhan_vien" choNgoai={false} value={owner} onChange={setOwner} macDinhTrong="Mặc định: GVCN của lớp" />
          </Truong>
        </Hang2>
        <Truong nhan="Ghi chú" tuyChon>
          <textarea className="field w-full" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>

      <Khoi tieuDe={`Vi phạm được gom · ${list.length}`}>
        {list.length === 0 ? (
          <p {...lf.o(loi, 'vi-pham')} tabIndex={-1} className={`m-0 text-xs outline-none ${lf.loiCua(loi, 'vi-pham') ? 'text-late' : 'text-slate-500'}`}>
            Không còn vi phạm nào được chọn{lf.loiCua(loi, 'vi-pham') ? ' — cần ít nhất một vi phạm' : '.'}
          </p>
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
