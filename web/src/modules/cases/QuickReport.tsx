import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field, SectionNote } from '../../ui/ui.tsx';
import {
  BEHAVIOUR_TOPICS, BEHAVIOUR_TOPIC_LABEL, ENTRY_SKILLS, ENTRY_SKILL_LABEL,
  THREAD_TRACKS, THREAD_TRACK_LABEL, URGENCY_LEVELS, URGENCY_LABEL, issuesForTopic, DEFAULT_URGENCY,
} from '@shared/domain/index.ts';

/**
 * BÁO NHANH MỘT VẤN ĐỀ.
 *
 * Giáo viên thấy vấn đề trên lớp từ nhiều tuần trước khi có điểm Mock. Trước đây không có
 * chỗ nào để nói ra, nên đến khi hệ thống "biết" thì đã muộn hai tháng.
 *
 * TỐI THIỂU CHỈ CẦN MỘT CÂU và MỘT CHỖ CẤT. Nguyên nhân cụ thể, mức độ gấp, ghi chú đều là
 * tuỳ chọn — bắt điền đủ thì giáo viên bỏ qua, và một form không ai điền thì không có dữ
 * liệu nào cả.
 *
 * Nhưng đầu mục và chủ đề thì BẮT BUỘC: không có chúng, vấn đề rơi vào "chưa phân loại" và
 * biến mất khỏi mọi bảng tổng hợp theo kỹ năng — đúng thứ vòng 3 sinh ra để sửa. Đổi lại,
 * chọn chúng chỉ mất hai lần bấm và không cần suy nghĩ: em vướng kỹ năng nào, hay là chuyện
 * ý thức.
 */
export function QuickReport({
  open, onClose, studentId, studentName, cycleId, onDone, signal, students, onPickStudent,
}: {
  open: boolean; onClose: () => void;
  studentId: number; studentName?: string; cycleId?: number | null;
  onDone?: (caseId: number) => void;
  /**
   * MỞ TỪ TRANG LỚP (mục 13.1): chọn học viên ngay ở đầu form, rồi mọi thứ còn lại giữ
   * nguyên — cùng một form, cùng quy tắc, cùng quyền. Dựng một form thứ hai cho trang lớp
   * là cách chắc chắn nhất để hai chỗ dần khác nhau về luật.
   */
  students?: { id: number; name: string; code?: string | null }[];
  onPickStudent?: (id: number) => void;
  /**
   * TÍN HIỆU mà case này ra đời để trả lời (mục 6.2).
   *
   * Khi mở form từ một tín hiệu, đầu mục và kỹ năng được điền sẵn — đó là phần máy BIẾT
   * chắc. Tên và mô tả thì không: máy chỉ đọc được con số, còn vấn đề thật là gì thì người
   * dạy mới biết, và đó chính là lý do bước xác minh này tồn tại.
   */
  signal?: { id: number; track: string; skill: string | null; label: string } | null;
}) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [urgency, setUrgency] = useState<string>(DEFAULT_URGENCY);
  const [track, setTrack] = useState<string>('academic');
  const [topic, setTopic] = useState('');
  const [primaryCode, setPrimaryCode] = useState('');
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

  /* Mở từ một tín hiệu: điền sẵn đầu mục và kỹ năng, để người dạy chỉ còn phải viết nhận định. */
  useEffect(() => {
    if (!open || !signal) return;
    setTrack(signal.track);
    setTopic(signal.skill ?? '');
  }, [open, signal?.id]);

  const topics: readonly string[] = track === 'behaviour' ? BEHAVIOUR_TOPICS : ENTRY_SKILLS;
  const topicLabel = (k: string) => (track === 'behaviour'
    ? BEHAVIOUR_TOPIC_LABEL[k as keyof typeof BEHAVIOUR_TOPIC_LABEL]
    : ENTRY_SKILL_LABEL[k as keyof typeof ENTRY_SKILL_LABEL]) ?? k;
  /* Nhóm Ý thức CŨNG có bộ phân loại riêng — thiếu nó thì form tự chặn chính mình. */
  const causes = topic ? issuesForTopic(topic) : [];

  const reset = () => {
    setSummary(''); setUrgency(DEFAULT_URGENCY); setTrack('academic'); setTopic('');
    setTitle(''); setPrimaryCode(''); setDetectedAt(''); setMore(false); setDup(null);
  };

  /*
   * CẢNH BÁO CASE TRÙNG — mục 7.13.
   *
   * Máy chủ từ chối lần gửi đầu và trả về CHÍNH case đang vướng, nên pop-up dựng được ngay
   * mà không phải hỏi lại thêm một vòng mạng. Hai lựa chọn chỉ khác nhau đúng một cờ, và
   * nội dung người dùng vừa gõ được giữ nguyên ở cả hai đường — không bắt gõ lại.
   */
  const [dup, setDup] = useState<any | null>(null);

  const send = async (extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const res = await api.post<any>('/cases/report', {
        studentId, cycleId: cycleId ?? undefined, title: title.trim() || null, summary, urgency,
        track, topic,
        primaryCode: primaryCode || undefined,
        detectedAt: detectedAt || undefined,
        idempotencyKey,
        fromSignalId: signal?.id ?? undefined,
        ...extra,
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', extra.mergeIntoExisting ? 'Đã ghi vào case đang có' : 'Đã ghi nhận');
      reset(); setDup(null); onClose(); onDone?.(res.id);
    } catch (e: any) {
      const d = e?.details?.duplicateCase;
      if (d) { setDup(d); return; }
      // Lỗi giữ nguyên nội dung đang gõ để người dùng thử lại, không bắt gõ lại từ đầu.
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  const submit = async () => {
    /*
     * BỐN TRƯỜNG BẮT BUỘC (mục 6.3). Kiểm ngay ở đây chứ không chỉ chờ máy chủ báo lỗi:
     * người dùng đang gõ dở, nói cho họ biết thiếu gì trước khi bấm rẻ hơn nhiều.
     */
    if (title.trim().length < 6) { toast.push('error', 'Hãy đặt tên cho case.'); return; }
    if (summary.trim().length < 15) {
      toast.push('error', 'Hãy mô tả cụ thể hơn: em sai ở đâu, sai như thế nào.'); return;
    }
    if (!topic) {
      toast.push('error', track === 'behaviour'
        ? 'Hãy chọn nhóm ý thức.' : 'Hãy chọn kỹ năng em đang vướng.');
      return;
    }
    if (!primaryCode) { toast.push('error', 'Hãy chọn phân loại vấn đề.'); return; }
    if (primaryCode.endsWith('.other') && summary.trim().length < 30) {
      toast.push('error', 'Chọn "Khác" thì mô tả phải nói rõ vấn đề cụ thể là gì.'); return;
    }
    await send();
  };

  return (
    <Modal open={open} onClose={onClose}
      title={signal
        ? `Xác minh tín hiệu ${signal.label}${studentName ? ` · ${studentName}` : ''}`
        : (studentName ? `+ Case · ${studentName}` : '+ Case')}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={busy || !studentId} onClick={submit}>Ghi nhận</button>
        </>
      }>
      <div className="space-y-3">
        {/*
          CHỌN HỌC VIÊN — chỉ khi mở từ trang lớp (mục 13.1). Ở hồ sơ một em thì không hỏi
          lại: người dùng đã đứng sẵn trong hồ sơ của em đó rồi.
        */}
        {students && (
          <Field label="Học viên" required hint="Case thuộc về một em cụ thể trong lớp này.">
            <select className="field" value={studentId || ''}
              onChange={(e) => onPickStudent?.(Number(e.target.value) || 0)}>
              <option value="">Chọn học viên…</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>{st.name}{st.code ? ` · ${st.code}` : ''}</option>
              ))}
            </select>
          </Field>
        )}

        {/*
          TÊN CASE DO NGƯỜI TẠO ĐẶT (mục 7.3).
          Case sinh từ điểm có tên suy ra được ("MT2 - Reading dưới kỳ vọng"); case tạo tay
          thì không có gì để suy, và hệ thống KHÔNG được tự gán "… dưới kỳ vọng" cho nó.
        */}
        <Field label="Tên case" required
          hint="Một câu ngắn nói đúng vấn đề, để sau này nhìn danh sách là nhận ra ngay.">
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Reading — chưa xử lý được dạng True/False/Not Given" />
        </Field>

        {/*
          "MÔ TẢ VẤN ĐỀ + DẪN CHỨNG CỤ THỂ" — nhãn nói rõ đang xin HAI thứ.
          Một ô tên là "Mô tả" thì nhận được "em yếu Reading", và ba tuần sau không ai suy ra
          được đã quan sát thấy gì. Xin luôn dẫn chứng thì người viết nhớ kể ra bài nào, câu
          nào, buổi nào — đó mới là thứ người tiếp nhận case dùng được.
        */}
        <Field label="Mô tả vấn đề + dẫn chứng cụ thể" required
          hint="Em sai ở đâu, sai thế nào, và bạn thấy điều đó ở bài nào/buổi nào. Hệ thống chỉ đọc được con số — phần này là quan sát của bạn.">
          <textarea className="field" rows={3} value={summary} autoFocus
            onChange={(e) => setSummary(e.target.value)}
            placeholder="MT2 Reading: hết giờ khi còn hai câu cuối của Passage 3; dạng Not Given sai 4/5 câu. Buổi 12/08 chữa bài em cũng đoán chứ không tìm được căn cứ trong bài." />
        </Field>

        <Field label="Mức độ" required
          hint="Hai bậc, và mỗi bậc dẫn tới một hạn khác nhau. Đây là nhận định của người báo, KHÔNG phải mức SOS tính từ điểm.">
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

        {/*
          ĐẦU MỤC VÀ CHỦ ĐỀ LÀ BẮT BUỘC, nên để ngay đây chứ không giấu dưới "xem thêm":
          một vấn đề không có chỗ cất sẽ không bao giờ hiện lên bảng tổng hợp theo kỹ năng.
        */}
        <Field label="Thuộc nhóm nào" required>
          <div className="flex gap-1 flex-wrap">
            {THREAD_TRACKS.map((t) => (
              <button key={t} type="button"
                className={`btn btn-sm ${track === t ? 'btn-primary' : ''}`}
                onClick={() => { setTrack(t); setTopic(''); setPrimaryCode(''); }}>
                {THREAD_TRACK_LABEL[t]}
              </button>
            ))}
          </div>
        </Field>

        <Field label={track === 'behaviour' ? 'Về việc gì' : 'Kỹ năng nào'} required>
          <div className="flex gap-1 flex-wrap">
            {topics.map((k) => (
              <button key={k} type="button"
                className={`btn btn-sm ${topic === k ? 'btn-primary' : ''}`}
                onClick={() => { setTopic(k); setPrimaryCode(''); }}>
                {topicLabel(k)}
              </button>
            ))}
          </div>
        </Field>

        {/*
          PHÂN LOẠI LÀ BẮT BUỘC, nên nó nằm NGAY ĐÂY, không giấu dưới "xem thêm" (mục 6.3).
          Trước đây nó là ô "Vì sao" không bắt buộc với lựa chọn mặc định "Chưa rõ" — và
          "Chưa rõ" chính là thứ làm mọi bảng tổng hợp nguyên nhân trở nên vô dụng.
        */}
        {topic && (
          <Field label="Phân loại vấn đề" required
            hint="Căn cứ để sau này trả lời được: trung tâm mình hay vướng cái gì nhất.">
            <div className="flex gap-1 flex-wrap">
              {causes.map((i) => (
                <button key={i.code} type="button" title={i.hint}
                  className={`btn btn-sm ${primaryCode === i.code ? 'btn-primary' : ''}`}
                  onClick={() => setPrimaryCode(i.code)}>
                  {i.label}
                </button>
              ))}
            </div>
            {causes.find((i) => i.code === primaryCode)?.hint && (
              <p className="text-xs text-slate-500 mt-1 mb-0">
                {causes.find((i) => i.code === primaryCode)!.hint}
              </p>
            )}
            {primaryCode.endsWith('.other') && (
              <p className="text-xs text-amber-200 mt-1 mb-0">
                Chọn "Khác" thì mô tả phải nói rõ vấn đề cụ thể là gì.
              </p>
            )}
          </Field>
        )}

        {!more && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMore(true)}>
            + Theo dõi từ ngày khác hôm nay
          </button>
        )}

        {more && (
          <Field label="Theo dõi từ ngày" hint="Bỏ trống thì lấy hôm nay.">
            <input type="date" className="field" value={detectedAt} onChange={(e) => setDetectedAt(e.target.value)} />
          </Field>
        )}

        <SectionNote>
          Ghi nhận này KHÔNG tạo ra một bài đánh giá và cũng không có mức SOS — SOS là số kỹ
          năng dưới kỳ vọng ở một bài cụ thể, ở đây chưa có bài nào.
          {track === 'behaviour' && (
            <> Vấn đề <strong>Ý thức/Khác</strong> báo trong <strong>bốn ngày</strong> kể từ lúc
            mở một đợt sẽ được gộp vào chính đợt đó, và làm nó được nâng lên <strong>Gấp</strong> —
            hai người cùng thấy một chuyện trong bốn ngày là một tín hiệu mạnh hơn nhận định
            của riêng ai. Từ ngày thứ năm trở đi là một đợt mới.</>
          )}
        </SectionNote>
      </div>

      {/*
        POP-UP CẢNH BÁO CASE TRÙNG — đè lên form, không thay thế form.

        Người dùng vẫn thấy chữ mình vừa gõ ở phía sau, nên chọn xong là hiểu mình vừa quyết
        định gì. Nút trái là vế MẶC ĐỊNH vì nó đúng trong đa số trường hợp; vế phải hợp lệ
        nhưng phải là quyết định có ý thức.
      */}
      {dup && (
        <div className="mt-4 rounded-lg border p-3"
             style={{ borderColor: 'var(--warn)', background: 'rgba(240, 201, 135, 0.08)' }}>
          <p className="text-sm text-slate-100 m-0">
            Học viên này đang có case <strong>“{dup.title}”</strong> chưa xử lý xong
            ở hạng mục {dup.categoryLabel}.
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-2">
            Mở từ {dup.detectedAt}
            {dup.interventionCount > 0 ? ` · đã có ${dup.interventionCount} phương án` : ' · chưa có phương án nào'}.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary btn-sm" disabled={busy}
              onClick={() => send({ mergeIntoExisting: true })}>
              Ghi vào case đang có
            </button>
            <button className="btn btn-sm" disabled={busy}
              onClick={() => send({ parallel: true })}>
              Đây là vấn đề khác, mở case riêng
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
