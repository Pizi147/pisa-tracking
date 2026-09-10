import { useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from './Toast.tsx';
import { Modal } from './Drawer.tsx';
import { Card, Field, SectionNote, Skeleton, Task } from './ui.tsx';
import { fmtDate } from '../lib/format.ts';
import { CONTACT_KINDS, CONTACT_KIND_SHORT, type ContactKind } from '@shared/domain.ts';

/**
 * LIÊN HỆ VỚI HỌC SINH VÀ PHỤ HUYNH.
 *
 * Cố tình rất mỏng: không duyệt, không hẹn xem lại, không ô kết quả. Hai việc này chỉ cần
 * xác nhận đã diễn ra — bắt người ta báo cáo "kết quả chuyên môn" của một cuộc gọi cho phụ
 * huynh là thêm một ô mà ai cũng điền cho có.
 *
 * Đặt Ở ĐẦU khối vấn đề chứ không lẫn vào danh sách phương án: khi một em vừa có SOS, việc
 * đầu tiên phải làm là báo cho em và cho gia đình, trước cả khi bàn tới tutor hay tự học.
 */

type Contact = {
  id: number; kind: ContactKind; label: string;
  attemptId: number | null; attemptNo: number | null;
  dueDate: string | null; doneOn: string | null; doneByName: string | null;
  note: string | null; auto: boolean; overdue: boolean;
};

export function ContactPanel({ studentId, canEdit }: { studentId: number; canEdit: boolean }) {
  const { data, loading, reload } = useApi<Contact[]>(`/students/${studentId}/contacts`);
  const [done, setDone] = useState<Contact | null>(null);
  const [add, setAdd] = useState(false);

  if (loading) return <Card title="Liên hệ"><Skeleton rows={2} /></Card>;
  const rows = data ?? [];
  const pending = rows.filter((r) => !r.doneOn);

  return (
    <Card
      title={<span className="flex flex-wrap items-baseline gap-2">
        Liên hệ với học sinh và phụ huynh
        {pending.length > 0 && <span className="text-slate-500 font-normal">({pending.length} chưa xong)</span>}
      </span>}
      action={canEdit ? <button className="btn btn-sm" onClick={() => setAdd(true)}>+ Ghi một lần trao đổi</button> : undefined}
      bodyClass="p-0">
      {rows.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-400 m-0">
          Chưa có lần trao đổi nào được ghi.
        </p>
      ) : (
        <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
          {rows.slice(0, 8).map((c) => (
            <li key={c.id} className="px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-100">{CONTACT_KIND_SHORT[c.kind] ?? c.label}</span>
                  {c.attemptNo && <span className="text-[11px] text-slate-500">sau MT{c.attemptNo}</span>}
                  {c.overdue && <Task tone="danger">Quá hạn trao đổi</Task>}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  {c.doneOn
                    ? `Đã trao đổi ${fmtDate(c.doneOn)}${c.doneByName ? ` · ${c.doneByName}` : ''}`
                    : c.dueDate ? `Hạn ${fmtDate(c.dueDate)}` : 'Chưa có hạn'}
                  {c.note && ` — ${c.note}`}
                </span>
              </span>
              {!c.doneOn && canEdit && (
                <button className="btn btn-sm" onClick={() => setDone(c)}>Đã trao đổi</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <SectionNote>
        Hai việc này <strong>không phải phương án hỗ trợ</strong>: chúng không tạo ra can thiệp
        học thuật nào, nên không cần duyệt và không có kết quả chuyên môn để ghi — chỉ cần biết
        đã trao đổi hay chưa.
      </SectionNote>

      <DoneDialog contact={done} onClose={() => setDone(null)} onDone={reload} />
      <AddDialog open={add} onClose={() => setAdd(false)} studentId={studentId} onDone={reload} />
    </Card>
  );
}

function DoneDialog({ contact, onClose, onDone }: {
  contact: Contact | null; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [doneOn, setDoneOn] = useState('');
  const [note, setNote] = useState('');
  const [performerName, setPerformerName] = useState('');
  const [busy, setBusy] = useState(false);
  if (!contact) return null;

  return (
    <Modal open onClose={onClose} title={CONTACT_KIND_SHORT[contact.kind] ?? contact.label}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await api.post(`/contacts/${contact.id}/done`, {
                doneOn: doneOn || undefined, note, performerName: performerName || undefined,
              });
              invalidate('/students'); invalidate('/my-work');
              toast.push('ok', 'Đã ghi lại'); onDone(); onClose();
            } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
          }}>Lưu</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Ngày trao đổi" hint="Bỏ trống thì lấy hôm nay. Không nhận ngày ở tương lai.">
          <input type="date" className="field" value={doneOn} onChange={(e) => setDoneOn(e.target.value)} />
        </Field>
        <Field label="Người thực hiện"
          hint="Bỏ trống nếu chính bạn làm. CS hay người ngoài hệ thống thì ghi tên họ.">
          <input className="field" value={performerName} onChange={(e) => setPerformerName(e.target.value)}
            placeholder="Chị Hương (CS)" />
        </Field>
        <Field label="Ghi chú">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="PH nắm được tình hình, xin đổi sang ca sáng" />
        </Field>
      </div>
    </Modal>
  );
}

function AddDialog({ open, onClose, studentId, onDone }: {
  open: boolean; onClose: () => void; studentId: number; onDone: () => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState<string>('talk_parent');
  const [doneOn, setDoneOn] = useState('');
  const [note, setNote] = useState('');
  const [performerName, setPerformerName] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Ghi một lần trao đổi"
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await api.post(`/students/${studentId}/contacts`, {
                kind, doneOn: doneOn || undefined, note, performerName: performerName || undefined,
              });
              invalidate('/students');
              toast.push('ok', 'Đã ghi lại'); onDone(); onClose(); setNote('');
            } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
          }}>Lưu</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Trao đổi với ai">
          <div className="flex gap-1 flex-wrap">
            {CONTACT_KINDS.map((k) => (
              <button key={k} type="button" className={`btn btn-sm ${kind === k ? 'btn-primary' : ''}`}
                onClick={() => setKind(k)}>{CONTACT_KIND_SHORT[k]}</button>
            ))}
          </div>
        </Field>
        <Field label="Ngày trao đổi"><input type="date" className="field" value={doneOn} onChange={(e) => setDoneOn(e.target.value)} /></Field>
        <Field label="Người thực hiện" hint="Bỏ trống nếu chính bạn làm.">
          <input className="field" value={performerName} onChange={(e) => setPerformerName(e.target.value)} />
        </Field>
        <Field label="Ghi chú"><input className="field" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <SectionNote>
          Lần trao đổi bạn tự ghi thì <strong>không có hạn</strong>, nên không bao giờ bị coi là quá hạn.
          Chỉ hai việc hệ thống sinh ra khi có SOS mới có hạn.
        </SectionNote>
      </div>
    </Modal>
  );
}
