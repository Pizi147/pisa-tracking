import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, INTERVENTION_KIND_LABEL, issuesForTopic,
  interventionKindsFor, reasonNeedsText, nguoiThanhPayload, type CaseDismissReason, type NguoiChon, laKhac, kiemGhiRoKhac,
} from '@shared/domain/index.ts';

const invalidateCases = () => { invalidate('/cases'); invalidate('/students'); invalidate('/overview'); invalidate('/my-work'); };

/**
 * `XÁC ĐỊNH NGUYÊN NHÂN` (§7.5, S04) — mở đúng ô phân loại đang có trong form case (`issuesForTopic`,
 * dùng chung với QuickReport lúc tạo case) nhưng cho case ĐÃ TỒN TẠI, qua `PUT /cases/:id/issues`.
 */
export function CauseDeterminationPanel({ caseId, topic, currentCode, onClose, onDone }: {
  caseId: number; topic: string | null; currentCode: string | null; onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const [code, setCode] = useState(currentCode ?? '');
  /* "Khác" (T13): ô Ghi rõ ngay dưới, lưu ở `observation` (Q9). */
  const [ghiRo, setGhiRo] = useState('');
  const [busy, setBusy] = useState(false);
  const causes = topic ? issuesForTopic(topic) : [];
  /* K2-3 (điện thoại không có hover): câu Ghi rõ hiện ngay dưới ô từ lúc chọn Khác, không đợi rời ô — ba form nhỏ trong file này. */
  const loiGhiRo = laKhac(code) ? kiemGhiRoKhac(ghiRo) : null;

  const save = async () => {
    if (!code) { toast.push('error', 'Chọn phân loại vấn đề.'); return; }
    if (loiGhiRo) return;
    setBusy(true);
    try {
      await api.put(`/cases/${caseId}/issues`, { primaryCode: code, observation: laKhac(code) ? ghiRo.trim() : undefined });
      invalidateCases();
      toast.push('ok', 'Đã chọn nguyên nhân');
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg mt-1 p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      {causes.length === 0 ? (
        <p className="text-xs text-amber-200/90 m-0">Chủ đề này chưa có danh mục nguyên nhân để chọn.</p>
      ) : (
        <div className="flex gap-1 flex-wrap">
          {causes.map((i) => (
            <NutChon key={i.code} nho title={i.hint} chon={code === i.code} onClick={() => setCode(i.code)}>
              {i.label}
            </NutChon>
          ))}
        </div>
      )}
      <OKhac hien={laKhac(code)} value={ghiRo} onChange={setGhiRo} goiY="Ví dụ: Chưa quen dạng bài mới" loi={loiGhiRo} />
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        {causes.length > 0 && (
          <button type="button" className="btn btn-sm btn-primary" disabled={busy || !code || !!loiGhiRo} title={loiGhiRo ?? undefined} onClick={save}>Lưu</button>
        )}
      </div>
    </div>
  );
}

type Mode = null | 'confirm' | 'edit' | 'replace';

/**
 * PHƯƠNG ÁN ĐIỀN SẴN CHỜ XÁC NHẬN (§7.5, S04, S06) — ba nút `Xác nhận` · `Sửa` · `Thay`. `Xác nhận` chạy
 * ngay với nội dung điền sẵn; `Sửa` mở ô mô tả để chỉnh rồi xác nhận trong MỘT thao tác (PR-T); `Thay` đổi
 * hẳn loại phương án — kết thúc phương án điền sẵn, tạo phương án mới đã xác nhận.
 */
export function PresetPlanActions({ interventionId, description, followupDue, onDone }: {
  interventionId: number; description: string; followupDue: string | null; onDone?: () => void;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [desc, setDesc] = useState(description);
  const [due, setDue] = useState(followupDue ?? '');
  const [reason, setReason] = useState('');
  const catalogue = interventionKindsFor();
  const [kind, setKind] = useState<string>(catalogue.selfServe[0]);
  /* PA đề xuất "Khác" (T13): ô Tên đề xuất ngay dưới; máy chủ ghép vào mô tả (Q9). */
  const [ghiRo, setGhiRo] = useState('');
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });

  const confirmNow = async (patch: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      await api.post(`/interventions/${interventionId}/confirm`, patch);
      invalidateCases();
      toast.push('ok', 'Đã xác nhận phương án');
      setMode(null); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const replaceMissing = desc.trim().length < 8 ? 'Mô tả phương án mới cần ít nhất 8 ký tự.' : null;
  const loiGhiRo = kind === 'other_proposal' ? kiemGhiRoKhac(ghiRo) : null;

  const replace = async () => {
    if (replaceMissing || loiGhiRo) return;
    setBusy(true);
    try {
      await api.post(`/interventions/${interventionId}/replace`, {
        kind, description: desc, ...nguoiThanhPayload(nguoi), followupDue: due || undefined,
        ...(kind === 'other_proposal' ? { ghiRoKhac: ghiRo.trim() } : {}),
      });
      invalidateCases();
      toast.push('ok', 'Đã thay phương án');
      setMode(null); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  if (mode === null) {
    return (
      <span className="flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => confirmNow()}>Xác nhận</button>
        <button type="button" className="btn btn-sm" onClick={() => setMode('edit')}>Sửa</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('replace')}>Thay</button>
      </span>
    );
  }

  if (mode === 'edit') {
    return (
      <div className="rounded-lg mt-2 p-2.5 space-y-2 w-full" style={{ background: 'var(--surface-1)' }}>
        <textarea className="field w-full" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
          Dự kiến kết thúc
          <span className="w-[11.5rem]"><ONgay kieu="ngay" value={due} onChange={setDue} /></span>
        </label>
        <label className="block">
          <span className="block text-[11px] text-slate-400 mb-1">Lý do sửa (không bắt buộc)</span>
          <input className="field w-full" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="flex gap-1.5">
          <button type="button" className="btn btn-sm" onClick={() => setMode(null)} disabled={busy}>Huỷ</button>
          <button type="button" className="btn btn-sm btn-primary" disabled={busy}
            onClick={() => confirmNow({ description: desc, followupDue: due || null, reason: reason.trim() || undefined })}>
            Xác nhận
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg mt-2 p-2.5 space-y-2 w-full" style={{ background: 'var(--surface-1)' }}>
      <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
        <optgroup label="Bạn tự làm được">
          {catalogue.selfServe.map((k: string) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]}</option>)}
        </optgroup>
        <optgroup label="Cần Quản lý duyệt">
          {catalogue.proposals.map((k: string) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]}</option>)}
        </optgroup>
      </select>
      <OKhac hien={kind === 'other_proposal'} value={ghiRo} onChange={setGhiRo} nhan="Tên đề xuất" goiY="Ví dụ: Học kèm 1-1 với trợ giảng" loi={loiGhiRo} />
      <textarea className="field w-full" rows={2} placeholder="Mô tả phương án mới" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <ChonNguoi nhom="giao_vien" value={nguoi} onChange={setNguoi} />
      <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
        Dự kiến kết thúc
        <span className="w-[11.5rem]"><ONgay kieu="ngay" value={due} onChange={setDue} /></span>
      </label>
      {replaceMissing && <p className="text-xs text-amber-200/90 m-0">{replaceMissing}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={() => setMode(null)} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!replaceMissing || !!loiGhiRo} title={loiGhiRo ?? replaceMissing ?? undefined} onClick={replace}>Thay phương án</button>
      </div>
    </div>
  );
}

/** `KHÔNG CẦN THEO DÕI` (S05, Q-V3-4) — ba lý do chọn nhanh tại chỗ; chỉ `Khác` cần ô chữ. */
export function DismissCaseForm({ caseId, onClose, onDone }: { caseId: number; onClose: () => void; onDone?: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const loiGhiRo = reasonNeedsText(reason) ? kiemGhiRoKhac(text) : null;
  const missing = !reason ? 'Chọn một lý do.' : null;

  const save = async () => {
    if (missing || loiGhiRo) return;
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/dismiss`, { reasonCode: reason, reasonText: reasonNeedsText(reason) ? text.trim() : undefined });
      invalidateCases();
      toast.push('ok', 'Case đã đóng — Không cần theo dõi');
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg mt-2 p-2.5 space-y-2" style={{ background: 'var(--surface-1)' }}>
      <div className="flex flex-wrap gap-1.5">
        {CASE_DISMISS_REASONS.map((r) => (
          <NutChon key={r} nho chon={reason === r} onClick={() => setReason(r)}>
            {CASE_DISMISS_REASON_LABEL[r as CaseDismissReason]}
          </NutChon>
        ))}
      </div>
      <OKhac hien={reasonNeedsText(reason)} value={text} onChange={setText} goiY="Ví dụ: Em nghỉ ốm cả tuần thi" loi={loiGhiRo} />
      {missing && <p className="text-xs text-amber-200/90 m-0">{missing}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-sm btn-danger" disabled={busy || !!missing || !!loiGhiRo} title={missing ?? loiGhiRo ?? undefined} onClick={save}>Không cần theo dõi</button>
      </div>
    </div>
  );
}
