import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import {
  MEASURE_REQUIRED_FIELDS, measureMissing, ngay, nguoiThanhPayloadYThuc, nguoiThieu, type MeasureKind, type NguoiChon,
} from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';

type MeasureDetail = {
  id: number; studentName: string; kind: string; kindLabel: string; customName: string | null;
  ownerName: string | null;
  violations: { id: number; occurredOn: string; categoryLabel: string }[];
  attachmentCount: number; canManage: boolean;
};

/**
 * PANEL `XÁC NHẬN ĐÃ THỰC HIỆN` (Y_THUC §7.5; PR-UX3 — cùng vỏ `KhungPanel`). Ô bắt buộc đổi theo loại PA (§5.4) — dùng ĐÚNG
 * `measureMissing` mà máy chủ dùng để từ chối, nên câu ở chân và câu từ chối của máy chủ không bao giờ nói hai điều khác nhau (B13).
 * Không hỏi tiến bộ, không mức kết quả (B15). Lỗi chỉ hiện SAU khi bấm nút chính.
 */
export function ConfirmMeasurePanel({ open, onClose, measureId, onDone }: {
  open: boolean; onClose: () => void; measureId: number | null; onDone?: () => void;
}) {
  const toast = useToast();
  const { homNay: today } = useNgayNghiepVu();
  const { data, reload } = useApi<MeasureDetail>(open && measureId ? `/measures/${measureId}` : null, [open, measureId]);
  const [performedOn, setPerformedOn] = useState(today);
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [note, setNote] = useState('');
  const [participants, setParticipants] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPerformedOn(today); setNguoi({ kieu: 'toi' }); setNote(''); setParticipants(''); lf.datLai();
  }, [open, measureId]);

  if (!open) return null;
  if (!data) return <KhungPanel tieuDe="Xác nhận đã thực hiện" onDong={onClose}><p className="mt-3 text-sm text-slate-400">Đang tải…</p></KhungPanel>;

  const spec = MEASURE_REQUIRED_FIELDS[data.kind as MeasureKind];
  const missing = measureMissing(data.kind as MeasureKind, {
    performedOn: performedOn || null, content: note, attachments: data.attachmentCount,
    customName: data.customName, performer: nguoiThieu(nguoi, true) === null,
  });

  const submit = async () => {
    lf.bam();
    if (missing || !measureId) return;
    setBusy(true);
    try {
      await api.post(`/measures/${measureId}/confirm`, {
        performedOn, ...nguoiThanhPayloadYThuc(nguoi),
        note: note.trim() || undefined, participants: participants.trim() || undefined,
      });
      invalidate('/measures'); invalidate('/violations'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', `Đã lưu. ${data.studentName}: ${data.violations.length} vi phạm chuyển sang Đã xử lý.`);
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Xác nhận đã thực hiện" hocVien={data.studentName} onDong={onClose}
      ngCanh={<span className="truncate">{data.kindLabel}{data.ownerName ? ` · phụ trách ${data.ownerName}` : ''}</span>}
      chan={{
        /* Câu chặn của máy chủ (measureMissing) có thể là tệp đính kèm, không phải một ô → nói thẳng câu đó ở chân. */
        conThieu: lf.daBam && missing ? [{ nhan: 'Xác nhận', lyDo: missing }] : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={submit}>Xác nhận</button>,
      }}>
      <Khoi tieuDe="Đã thực hiện">
        <Hang2>
          <Truong nhan="Ngày thực hiện" batBuoc>
            <ChonNgayGan value={performedOn} onChange={setPerformedOn} soNgay={30} />
          </Truong>
          <Truong nhan="Người thực hiện" as="div">
            <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} />
          </Truong>
        </Hang2>
        {spec?.participants === 'optional' && (
          <Truong nhan="Người tham gia" tuyChon phu="Dùng cho CX / GĐCN meeting với HV / PH">
            <input className="field w-full" value={participants} onChange={(e) => setParticipants(e.target.value)} />
          </Truong>
        )}
        <Truong nhan="Lý do / nội dung" batBuoc>
          <textarea className="field w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>

      <Khoi tieuDe={spec?.attachment === 'required' ? 'Tệp hoặc liên kết · bắt buộc' : 'Tệp hoặc liên kết · không bắt buộc'}>
        <BangChung ownerType="discipline_measure" ownerId={data.id} canEdit={data.canManage} tieuDe="" onChanged={reload} />
      </Khoi>

      <Khoi tieuDe={`Vi phạm được xử lý · ${data.violations.length}`}>
        <p className="m-0 text-xs text-slate-400">
          {data.violations.map((v) => `${ngay(v.occurredOn, today)} ${v.categoryLabel}`).join(' · ')}
        </p>
      </Khoi>
    </KhungPanel>
  );
}
