import { useMemo, useState } from 'react';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from './Toast.tsx';
import { Modal } from './Drawer.tsx';
import { Field, SectionNote } from './ui.tsx';
import { ISSUE_CONTEXTS, ISSUE_TAXONOMY, URGENCY_LEVELS, URGENCY_LABEL } from '@shared/domain.ts';

/**
 * BÁO NHANH MỘT VẤN ĐỀ.
 *
 * Giáo viên thấy vấn đề trên lớp từ nhiều tuần trước khi có điểm Mock. Trước đây không có
 * chỗ nào để nói ra, nên đến khi hệ thống "biết" thì đã muộn hai tháng.
 *
 * TỐI THIỂU CHỈ CẦN MỘT CÂU. Phân loại, mức độ gấp, hoàn cảnh đều là tuỳ chọn — bắt điền
 * đủ thì giáo viên bỏ qua, và một form không ai điền thì không có dữ liệu nào cả.
 */
export function QuickReport({ open, onClose, studentId, studentName, cycleId, onDone }: {
  open: boolean; onClose: () => void;
  studentId: number; studentName?: string; cycleId?: number | null;
  onDone?: (caseId: number) => void;
}) {
  const toast = useToast();
  const [summary, setSummary] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [branchKey, setBranchKey] = useState('');
  const [primaryCode, setPrimaryCode] = useState('');
  const [contextCodes, setContextCodes] = useState<string[]>([]);
  const [detectedAt, setDetectedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);

  /*
   * Khoá chống trùng sinh MỘT LẦN cho mỗi lần mở hộp thoại. Bấm hai lần, mạng chập chờn
   * rồi thử lại — tất cả cùng một khoá nên chỉ tạo đúng một vấn đề.
   */
  const idempotencyKey = useMemo(
    () => `report:${studentId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    [studentId, open],
  );

  const branch = ISSUE_TAXONOMY.find((b) => b.key === branchKey) ?? null;

  const reset = () => {
    setSummary(''); setUrgency('normal'); setBranchKey(''); setPrimaryCode('');
    setContextCodes([]); setDetectedAt(''); setMore(false);
  };

  const submit = async () => {
    if (!summary.trim()) { toast.push('error', 'Hãy mô tả vấn đề trong một câu.'); return; }
    setBusy(true);
    try {
      const res = await api.post<any>('/cases/report', {
        studentId, cycleId: cycleId ?? undefined, summary, urgency,
        primaryCode: primaryCode || undefined,
        skill: branch?.skill ?? undefined,
        contextCodes: contextCodes.length ? contextCodes : undefined,
        detectedAt: detectedAt || undefined,
        idempotencyKey,
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', 'Đã ghi nhận vấn đề');
      reset(); onClose(); onDone?.(res.id);
    } catch (e: any) {
      // Lỗi giữ nguyên nội dung đang gõ để người dùng thử lại, không bắt gõ lại từ đầu.
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose}
      title={studentName ? `Ghi nhận vấn đề · ${studentName}` : 'Ghi nhận vấn đề'}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>Ghi nhận</button>
        </>
      }>
      <div className="space-y-3">
        <Field label="Chuyện gì đang xảy ra" required
          hint="Một câu là đủ. Những mục còn lại đều có thể bỏ trống.">
          <textarea className="field" rows={3} value={summary} autoFocus
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Ba tuần nay em không làm bài nghe ở nhà, trên lớp cũng ít tập trung." />
        </Field>

        <Field label="Mức độ" hint="Đây là nhận định của người báo, KHÔNG phải mức SOS tính từ điểm.">
          <div className="flex gap-1 flex-wrap">
            {URGENCY_LEVELS.map((u) => (
              <button key={u} type="button"
                className={`btn btn-sm ${urgency === u ? 'btn-primary' : ''}`}
                onClick={() => setUrgency(u)}>
                {URGENCY_LABEL[u]}
              </button>
            ))}
          </div>
        </Field>

        {!more && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMore(true)}>
            + Phân loại và hoàn cảnh (không bắt buộc)
          </button>
        )}

        {more && (
          <>
            <Field label="Thuộc nhóm nào">
              <select className="field" value={branchKey}
                onChange={(e) => { setBranchKey(e.target.value); setPrimaryCode(''); }}>
                <option value="">Chưa phân loại</option>
                {ISSUE_TAXONOMY.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.group === 'student' ? 'Học sinh' : b.group === 'teacher' ? 'Quá trình dạy' : 'Chương trình'} · {b.label}
                  </option>
                ))}
              </select>
            </Field>
            {branch && (
              <Field label="Cụ thể hơn">
                <select className="field" value={primaryCode} onChange={(e) => setPrimaryCode(e.target.value)}>
                  <option value="">Chưa chọn</option>
                  {branch.items.map((i) => <option key={i.code} value={i.code}>{i.label}</option>)}
                </select>
              </Field>
            )}
            <Field label="Hoàn cảnh kèm theo"
              hint="Ghi chú thêm, KHÔNG phải nguyên nhân đã được xác minh.">
              <div className="flex gap-1 flex-wrap">
                {ISSUE_CONTEXTS.map((c) => (
                  <button key={c.code} type="button"
                    className={`btn btn-sm ${contextCodes.includes(c.code) ? 'btn-primary' : ''}`}
                    onClick={() => setContextCodes((prev) =>
                      prev.includes(c.code) ? prev.filter((x) => x !== c.code) : [...prev, c.code])}>
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Bắt đầu để ý từ ngày" hint="Bỏ trống thì lấy hôm nay.">
              <input type="date" className="field" value={detectedAt} onChange={(e) => setDetectedAt(e.target.value)} />
            </Field>
          </>
        )}

        <SectionNote>
          Ghi nhận này KHÔNG tạo ra một bài đánh giá và cũng không có mức SOS — SOS là số kỹ
          năng dưới kỳ vọng ở một bài cụ thể, ở đây chưa có bài nào.
        </SectionNote>
      </div>
    </Modal>
  );
}
