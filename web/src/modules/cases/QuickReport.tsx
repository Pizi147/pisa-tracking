import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field, SectionNote } from '../../ui/ui.tsx';
import {
  ENTRY_SKILLS, ENTRY_SKILL_LABEL, URGENCY_LEVELS, URGENCY_LABEL, issuesForTopic, DEFAULT_URGENCY,
  CASE_OUTCOMES, CASE_OUTCOME_LABEL,
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
 * Nhưng kỹ năng thì BẮT BUỘC: không có nó, vấn đề rơi vào "chưa phân loại" và biến mất khỏi
 * mọi bảng tổng hợp theo kỹ năng — đúng thứ vòng 3 sinh ra để sửa. Đổi lại, chọn nó chỉ mất
 * một lần bấm: em vướng kỹ năng nào.
 *
 * Từ 21/09/2026 form này CHỈ dành cho vấn đề học thuật. Chuyện ý thức (BTVN, chuyên cần, thái
 * độ…) là Vi phạm — có form riêng ở phần Ý thức, không đi qua cửa case.
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
  signal?: { id: number; skill: string | null; label: string } | null;
}) {
  const toast = useToast();
  /*
   * HAI TAB (mục 10.3): "Đang gặp vấn đề" (đường thường) và "Đã xong từ trước" (nhập bù).
   * Cùng bốn trường đầu (nhóm/kỹ năng/phân loại/mô tả) — chỉ khác NHỮNG GÌ hỏi thêm sau đó,
   * nên dùng chung state của bốn trường đó thay vì dựng một bộ state thứ hai.
   */
  const [mode, setMode] = useState<'now' | 'backfill'>('now');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [urgency, setUrgency] = useState<string>(DEFAULT_URGENCY);
  const [topic, setTopic] = useState('');
  const [primaryCode, setPrimaryCode] = useState('');
  const [detectedAt, setDetectedAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);

  /* NHẬP BÙ (mục 10.3) — chỉ dùng khi mode === 'backfill'. */
  const [bfFrom, setBfFrom] = useState('');
  const [bfTo, setBfTo] = useState('');
  const [bfActions, setBfActions] = useState<{ description: string; performerName: string; fromDate: string; toDate: string }[]>([
    { description: '', performerName: '', fromDate: '', toDate: '' },
  ]);
  const [bfOutcome, setBfOutcome] = useState<string>('');
  const [bfNote, setBfNote] = useState('');
  const [bfDup, setBfDup] = useState<any | null>(null);

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
    setTopic(signal.skill ?? '');
  }, [open, signal?.id]);

  const topics: readonly string[] = ENTRY_SKILLS;
  const topicLabel = (k: string) => ENTRY_SKILL_LABEL[k as keyof typeof ENTRY_SKILL_LABEL] ?? k;
  const causes = topic ? issuesForTopic(topic) : [];

  const reset = () => {
    setSummary(''); setUrgency(DEFAULT_URGENCY); setTopic('');
    setTitle(''); setPrimaryCode(''); setDetectedAt(''); setMore(false); setDup(null);
    setMode('now'); setBfFrom(''); setBfTo('');
    setBfActions([{ description: '', performerName: '', fromDate: '', toDate: '' }]);
    setBfOutcome(''); setBfNote(''); setBfDup(null);
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
        topic,
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
      toast.push('error', 'Hãy chọn kỹ năng em đang vướng.');
      return;
    }
    if (!primaryCode) { toast.push('error', 'Hãy chọn phân loại vấn đề.'); return; }
    if (primaryCode.endsWith('.other') && summary.trim().length < 30) {
      toast.push('error', 'Chọn "Khác" thì mô tả phải nói rõ vấn đề cụ thể là gì.'); return;
    }
    await send();
  };

  const sendBackfill = async (extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const res = await api.post<any>('/cases/backfill', {
        studentId, cycleId: cycleId ?? undefined,
        topic, primaryCode: primaryCode || undefined,
        title: title.trim() || null, summary,
        fromDate: bfFrom, toDate: bfTo,
        actions: bfActions.map((a) => ({
          description: a.description.trim(), performerName: a.performerName.trim(),
          fromDate: a.fromDate, toDate: a.toDate,
        })),
        outcome: bfOutcome, note: bfNote,
        ...extra,
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', 'Đã ghi lại case đã xong');
      reset(); onClose(); onDone?.(res.id);
    } catch (e: any) {
      const d = e?.details?.duplicateBackfill;
      if (d) { setBfDup(d); return; }
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  const submitBackfill = async () => {
    if (title.trim().length < 6) { toast.push('error', 'Hãy đặt tên cho case.'); return; }
    if (summary.trim().length < 15) {
      toast.push('error', 'Hãy mô tả cụ thể hơn: khi đó em vướng gì.'); return;
    }
    if (!topic) {
      toast.push('error', 'Hãy chọn kỹ năng.');
      return;
    }
    if (!primaryCode) { toast.push('error', 'Hãy chọn phân loại vấn đề.'); return; }
    if (primaryCode.endsWith('.other') && summary.trim().length < 30) {
      toast.push('error', 'Chọn "Khác" thì mô tả phải nói rõ vấn đề cụ thể là gì.'); return;
    }
    if (!bfFrom || !bfTo) { toast.push('error', 'Hãy ghi từ ngày nào đến ngày nào.'); return; }
    if (bfFrom > bfTo) { toast.push('error', 'Ngày bắt đầu phải trước ngày kết thúc.'); return; }
    const rows = bfActions.filter((a) => a.description.trim() || a.performerName.trim());
    if (!rows.length) { toast.push('error', 'Ghi ít nhất một dòng "đã làm gì".'); return; }
    for (const a of rows) {
      if (a.description.trim().length < 3) { toast.push('error', 'Mỗi dòng "đã làm gì" phải nói rõ đã làm gì.'); return; }
      if (!a.performerName.trim()) { toast.push('error', 'Mỗi dòng "đã làm gì" phải ghi người làm.'); return; }
      if (!a.fromDate || !a.toDate) { toast.push('error', 'Mỗi dòng "đã làm gì" phải có từ ngày → đến ngày.'); return; }
      if (a.fromDate > a.toDate) { toast.push('error', 'Một dòng "đã làm gì" có ngày bắt đầu sau ngày kết thúc.'); return; }
    }
    if (!bfOutcome) { toast.push('error', 'Hãy chọn kết quả cuối.'); return; }
    if (bfNote.trim().length < 10) { toast.push('error', 'Hãy ghi chú kết luận — ít nhất 10 ký tự.'); return; }
    setBfActions(rows);
    await sendBackfill();
  };

  return (
    <Modal open={open} onClose={onClose}
      title={signal
        ? `Xác minh tín hiệu ${signal.label}${studentName ? ` · ${studentName}` : ''}`
        : (studentName ? `+ Case · ${studentName}` : '+ Case')}
      footer={
        <>
          <button className="btn" onClick={onClose}>Huỷ</button>
          {mode === 'now'
            ? <button className="btn btn-primary" disabled={busy || !studentId} onClick={submit}>Ghi nhận</button>
            : <button className="btn btn-primary" disabled={busy || !studentId} onClick={submitBackfill}>Ghi lại case đã xong</button>}
        </>
      }>
      <div className="space-y-3">
        {/*
          HAI TAB (mục 10.3): "Đang gặp vấn đề" (đường thường) và "Đã xong từ trước" (nhập
          bù). Không hiện khi mở từ một tín hiệu — xác minh tín hiệu luôn là chuyện đang xảy
          ra, không phải chuyện đã xong từ lâu.
        */}
        {!signal && (
          <div className="flex gap-1">
            <button type="button" className={`btn btn-sm ${mode === 'now' ? 'btn-primary' : ''}`}
              onClick={() => setMode('now')}>
              Đang gặp vấn đề
            </button>
            <button type="button" className={`btn btn-sm ${mode === 'backfill' ? 'btn-primary' : ''}`}
              onClick={() => setMode('backfill')}>
              Đã xong từ trước
            </button>
          </div>
        )}

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

        {/* Nhập bù là chuyện ĐÃ XONG — không còn "mức độ gấp" để mà xin. */}
        {mode === 'now' && (
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
        )}

        {/*
          KỸ NĂNG LÀ BẮT BUỘC, nên để ngay đây chứ không giấu dưới "xem thêm": một vấn đề không
          có chỗ cất sẽ không bao giờ hiện lên bảng tổng hợp theo kỹ năng.
        */}
        <Field label="Kỹ năng nào" required>
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

        {mode === 'now' && !more && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMore(true)}>
            + Theo dõi từ ngày khác hôm nay
          </button>
        )}

        {mode === 'now' && more && (
          <Field label="Theo dõi từ ngày" hint="Bỏ trống thì lấy hôm nay.">
            <input type="date" className="field" value={detectedAt} onChange={(e) => setDetectedAt(e.target.value)} />
          </Field>
        )}

        {mode === 'now' && (
          <SectionNote>
            Ghi nhận này KHÔNG tạo ra một bài đánh giá và cũng không có mức SOS — SOS là số kỹ
            năng dưới kỳ vọng ở một bài cụ thể, ở đây chưa có bài nào.
          </SectionNote>
        )}

        {/*
          TAB "ĐÃ XONG TỪ TRƯỚC" (mục 10.3) — chỗ DUY NHẤT được nhập ngày quá khứ, Không có ô "Mức độ": việc đã xong rồi thì không còn gì
          để mà gấp.
        */}
        {mode === 'backfill' && (
          <>
            <Field label="Từ ngày → đến ngày" required
              hint="Khoảng thời gian vấn đề thật sự diễn ra, không phải hôm nay.">
              <div className="flex items-center gap-2">
                <input type="date" className="field" value={bfFrom} onChange={(e) => setBfFrom(e.target.value)} />
                <span className="text-slate-500">→</span>
                <input type="date" className="field" value={bfTo} onChange={(e) => setBfTo(e.target.value)} />
              </div>
            </Field>

            <Field label="Phương án đã áp dụng" required hint="Mỗi dòng một phương án: tên phương án, người thực hiện, từ ngày → đến ngày.">
              <div className="space-y-2">
                {bfActions.map((a, i) => (
                  <div key={i} className="surface-2 rounded-lg p-2 space-y-1.5">
                    <input className="field" placeholder="Phương án đã áp dụng (ví dụ: tutor Listening mỗi tuần)"
                      value={a.description}
                      onChange={(e) => setBfActions(bfActions.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <input className="field max-w-[10rem]" placeholder="Người thực hiện"
                        value={a.performerName}
                        onChange={(e) => setBfActions(bfActions.map((x, j) => j === i ? { ...x, performerName: e.target.value } : x))} />
                      <input type="date" className="field max-w-[9rem]" value={a.fromDate}
                        onChange={(e) => setBfActions(bfActions.map((x, j) => j === i ? { ...x, fromDate: e.target.value } : x))} />
                      <span className="text-slate-500">→</span>
                      <input type="date" className="field max-w-[9rem]" value={a.toDate}
                        onChange={(e) => setBfActions(bfActions.map((x, j) => j === i ? { ...x, toDate: e.target.value } : x))} />
                      {bfActions.length > 1 && (
                        <button type="button" className="btn btn-sm btn-ghost"
                          onClick={() => setBfActions(bfActions.filter((_, j) => j !== i))}>
                          Bỏ dòng
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-ghost"
                  onClick={() => setBfActions([...bfActions, { description: '', performerName: '', fromDate: '', toDate: '' }])}>
                  + Thêm phương án
                </button>
              </div>
            </Field>

            <Field label="Kết quả cuối" required>
              <div className="flex gap-1 flex-wrap">
                {CASE_OUTCOMES.map((o) => (
                  <button key={o} type="button"
                    className={`btn btn-sm ${bfOutcome === o ? 'btn-primary' : ''}`}
                    onClick={() => setBfOutcome(o)}>
                    {CASE_OUTCOME_LABEL[o]}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Ghi chú" required hint="Ngày quá khứ không tự chứng minh hiệu quả — nói rõ vì sao kết luận vậy.">
              <textarea className="field" rows={2} value={bfNote} onChange={(e) => setBfNote(e.target.value)} />
            </Field>

            <SectionNote>
              Case nhập bù sẽ hiện nhãn <strong>"nhập bù"</strong> ngay trên thẻ case, không có
              hạn cập nhật hay hạn báo kết quả nào, và không tính vào tỷ lệ hiệu quả hỗ trợ —
              đây là trí nhớ, không phải một phương án đang chạy.
            </SectionNote>

            {bfDup && (
              <div className="mt-2 rounded-lg border p-3"
                   style={{ borderColor: 'var(--warn)', background: 'rgba(240, 201, 135, 0.08)' }}>
                <p className="text-sm text-slate-100 m-0">
                  Học viên này đã có một case nhập bù <strong>"{bfDup.title}"</strong> trùng
                  khoảng {bfDup.from} → {bfDup.to}. Có phải cùng một lần không?
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button className="btn btn-sm" disabled={busy}
                    onClick={() => sendBackfill({ confirmDuplicate: true })}>
                    Đây là lần khác, vẫn ghi riêng
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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
