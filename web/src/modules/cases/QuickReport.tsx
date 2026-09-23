import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Modal } from '../../ui/Drawer.tsx';
import { Field } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { ComponentsField, componentsPayload } from './ChiTietKyNang.tsx';
import {
  ENTRY_SKILL_LABEL, URGENCY_LEVELS, URGENCY_LABEL, issuesForTopic, DEFAULT_URGENCY,
  CASE_OUTCOMES, CASE_OUTCOME_LABEL, REGULAR_SKILL_LABEL,
  categoryOf, componentsFor, componentsAreCounts,
  nguoiThanhPayload, nguoiThieu, type NguoiChon,
} from '@shared/domain/index.ts';

type DaLuu = { id: number; tieuDe: string; gop: boolean; canEdit: boolean };
type BfAction = { description: string; nguoi: NguoiChon; fromDate: string; toDate: string };

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
  signal?: { id: number; skill: string | null; label: string; kind?: 'normal' | 'ft'; scoreText?: string | null; contextLabel?: string | null } | null;
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

  /* F-1 (mục 4.8): sau khi lưu, panel KHÔNG đóng — chuyển sang bước "Đã lưu" + khối Bằng chứng. */
  const [daLuu, setDaLuu] = useState<DaLuu | null>(null);

  /* NHẬP BÙ (mục 10.3) — chỉ dùng khi mode === 'backfill'. */
  const [bfFrom, setBfFrom] = useState('');
  const [bfTo, setBfTo] = useState('');
  const [bfActions, setBfActions] = useState<BfAction[]>([
    { description: '', nguoi: { kieu: 'toi' }, fromDate: '', toDate: '' },
  ]);
  const [bfErrors, setBfErrors] = useState<Record<number, string>>({});
  const [bfOutcome, setBfOutcome] = useState<string>('');
  const [bfNote, setBfNote] = useState('');
  const [bfMetrics, setBfMetrics] = useState<Record<string, { score: string; total: string }>>({});
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

  /* Mở lại hộp thoại cho một lần báo mới thì bước "Đã lưu" của lần trước không còn ý nghĩa. */
  useEffect(() => { if (open) setDaLuu(null); }, [open]);

  /*
   * F07 — KỸ NĂNG THEO ĐÚNG CHƯƠNG TRÌNH EM ĐANG HỌC.
   *
   * Mở từ tín hiệu thì đã biết chắc chắn kỹ năng (chỉ đúng môn của tín hiệu). Còn lại (hồ sơ
   * học viên, trang lớp) hỏi máy chủ: lớp thường bốn ô L·R·W·S, Fast Track năm ô L·R·W1·W2·S
   * (Q8) — form không tự đoán chương trình.
   */
  const chuDe = useApi<{ ratio: boolean; topics: string[] }>(
    open && studentId && !signal ? `/students/${studentId}/case-topics${cycleId ? `?cycleId=${cycleId}` : ''}` : null,
    [open, studentId, cycleId, signal],
  );
  const topics: readonly string[] = signal?.skill ? [signal.skill] : (chuDe.data?.topics ?? []);
  const topicsKey = topics.join('|');
  /* Đổi học viên (trang lớp): bộ kỹ năng đổi theo — kỹ năng/phân loại cũ không còn hợp lệ thì bỏ, không giữ lại một lựa chọn sai chương trình. */
  useEffect(() => {
    if (topic && !topics.includes(topic)) { setTopic(''); setPrimaryCode(''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicsKey]);

  const topicLabel = (k: string) => ENTRY_SKILL_LABEL[k as keyof typeof ENTRY_SKILL_LABEL]
    ?? REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL] ?? k;
  const causes = topic ? issuesForTopic(topic) : [];

  const reset = () => {
    setSummary(''); setUrgency(DEFAULT_URGENCY); setTopic('');
    setTitle(''); setPrimaryCode(''); setDetectedAt(''); setMore(false); setDup(null);
    setMode('now'); setBfFrom(''); setBfTo('');
    setBfActions([{ description: '', nguoi: { kieu: 'toi' }, fromDate: '', toDate: '' }]);
    setBfErrors({}); setBfOutcome(''); setBfNote(''); setBfMetrics({}); setBfDup(null);
    setDaLuu(null);
  };

  /*
   * BƯỚC "ĐÃ LƯU" DÙNG CHUNG cho ✕ / Esc / bấm nền của Modal VÀ nút Xong (Q7):
   *   · Đã lưu → panel đóng THẬT SỰ, và onDone chỉ chạy lúc này (nơi gọi đóng panel trong onDone).
   *   · Chưa lưu → đóng như trước, không có gì để báo lại.
   */
  const dong = () => {
    if (daLuu) {
      const id = daLuu.id;
      reset();
      onClose();
      onDone?.(id);
    } else {
      onClose();
    }
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
      setDup(null);
      setDaLuu({ id: res.id, tieuDe: res.title, gop: !!extra.mergeIntoExisting, canEdit: !!res.viewer?.canEdit });
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
    if (title.trim().length < 6) { toast.push('error', 'Đặt tên cho case.'); return; }
    if (summary.trim().length < 15) {
      toast.push('error', 'Mô tả cụ thể hơn: em sai ở đâu, sai như thế nào.'); return;
    }
    if (!topic) {
      toast.push('error', 'Chọn kỹ năng em đang vướng.');
      return;
    }
    if (!primaryCode) { toast.push('error', 'Chọn phân loại vấn đề.'); return; }
    if (primaryCode.endsWith('.other') && summary.trim().length < 30) {
      toast.push('error', 'Chọn "Khác" thì mô tả phải nói rõ vấn đề cụ thể là gì.'); return;
    }
    await send();
  };

  const sendBackfill = async (extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const category = categoryOf(topic);
      const res = await api.post<any>('/cases/backfill', {
        studentId, cycleId: cycleId ?? undefined,
        topic, primaryCode: primaryCode || undefined,
        title: title.trim() || null, summary,
        fromDate: bfFrom, toDate: bfTo,
        actions: bfActions.map((a) => ({
          description: a.description.trim(), ...nguoiThanhPayload(a.nguoi),
          fromDate: a.fromDate, toDate: a.toDate,
        })),
        outcome: bfOutcome, note: bfNote,
        /* S5 — điểm giáo viên tự chấm theo kỹ năng, luôn TUỲ CHỌN. */
        metrics: componentsPayload(category, bfMetrics, componentsAreCounts(category)),
        ...extra,
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', 'Đã ghi lại Case đã xong');
      setBfDup(null);
      setDaLuu({ id: res.id, tieuDe: res.title, gop: false, canEdit: !!res.viewer?.canEdit });
    } catch (e: any) {
      const d = e?.details?.duplicateBackfill;
      if (d) { setBfDup(d); return; }
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };

  const submitBackfill = async () => {
    if (title.trim().length < 6) { toast.push('error', 'Đặt tên cho case.'); return; }
    if (summary.trim().length < 15) {
      toast.push('error', 'Mô tả cụ thể hơn: khi đó em vướng gì.'); return;
    }
    if (!topic) {
      toast.push('error', 'Chọn kỹ năng.');
      return;
    }
    if (!primaryCode) { toast.push('error', 'Chọn phân loại vấn đề.'); return; }
    if (primaryCode.endsWith('.other') && summary.trim().length < 30) {
      toast.push('error', 'Chọn "Khác" thì mô tả phải nói rõ vấn đề cụ thể là gì.'); return;
    }
    if (!bfFrom || !bfTo) { toast.push('error', 'Ghi từ ngày nào đến ngày nào.'); return; }
    if (bfFrom > bfTo) { toast.push('error', 'Ngày bắt đầu phải trước ngày kết thúc.'); return; }

    /*
     * F-3 (§22.4): mỗi thẻ kiểm RIÊNG, lỗi hiện NGAY DƯỚI thẻ đó — không đẩy lệch thẻ khác
     * bằng một toast chung chung "có dòng sai". Thẻ chưa gõ gì (mô tả rỗng) thì bỏ qua, không kiểm.
     */
    const filled = bfActions.filter((a) => a.description.trim());
    if (!filled.length) { toast.push('error', 'Ghi ít nhất một dòng "đã làm gì".'); return; }
    const errors: Record<number, string> = {};
    bfActions.forEach((a, i) => {
      if (!a.description.trim()) return;
      if (a.description.trim().length < 3) { errors[i] = 'Phải nói rõ đã làm gì.'; return; }
      const thieu = nguoiThieu(a.nguoi, true);
      if (thieu) { errors[i] = thieu; return; }
      if (!a.fromDate || !a.toDate) { errors[i] = 'Cần từ ngày → đến ngày.'; return; }
      if (a.fromDate > a.toDate) { errors[i] = 'Ngày bắt đầu phải trước ngày kết thúc.'; return; }
    });
    if (Object.keys(errors).length) { setBfErrors(errors); return; }
    setBfErrors({});
    if (!bfOutcome) { toast.push('error', 'Chọn kết quả cuối.'); return; }
    if (bfNote.trim().length < 10) { toast.push('error', 'Ghi chú kết luận — ít nhất 10 ký tự.'); return; }
    setBfActions(filled);
    await sendBackfill();
  };

  const category = categoryOf(topic);
  const bfComponents = componentsFor(category, chuDe.data?.ratio ? 'ratio' : 'band');
  const bfCounts = componentsAreCounts(category);

  return (
    <Modal open={open} onClose={dong}
      width={mode === 'backfill' ? 'max-w-xl' : undefined}
      title={signal?.kind === 'normal'
        ? `Tạo Case · ${signal.label}${studentName ? ` · ${studentName}` : ''}`
        : signal
          ? `Xác minh tín hiệu ${signal.label}${studentName ? ` · ${studentName}` : ''}`
          : (studentName ? `+ Case · ${studentName}` : '+ Case')}
      footer={
        daLuu ? (
          <button className="btn btn-primary" onClick={dong}>Xong</button>
        ) : (
          <>
            <button className="btn" onClick={dong}>Huỷ</button>
            {mode === 'now'
              ? <button className="btn btn-primary" disabled={busy || !studentId} onClick={submit}>Ghi nhận</button>
              : <button className="btn btn-primary" disabled={busy || !studentId} onClick={submitBackfill}>Ghi lại Case đã xong</button>}
          </>
        )
      }>
      {daLuu ? (
        /*
         * F-1 (mục 4.8): bước "Đã lưu" — panel không đóng, hiện dấu ✓ rồi khối Bằng chứng của
         * CHÍNH Case vừa tạo, để đính kèm ngay tại chỗ thay vì phải mở lại case sau.
         */
        <div className="space-y-3">
          <p className="text-sm text-slate-400 m-0">
            {daLuu.gop ? <>✓ Đã ghi vào Case đang có «{daLuu.tieuDe}»</> : <>✓ Đã lưu Case «{daLuu.tieuDe}»</>}
          </p>
          {daLuu.canEdit ? (
            <BangChung ownerType="sos_case" ownerId={daLuu.id} canEdit={daLuu.canEdit} tieuDe="Bằng chứng" />
          ) : (
            /* GVCN mở Case môn mình không dạy (vd Writing) — không đính kèm được ở đây; nói rõ ai sẽ thêm, không vẽ khối trống. */
            <p className="text-xs text-slate-500 m-0">
              Bạn không có quyền đính kèm cho Case môn này — GV dạy môn đó hoặc Quản lý sẽ thêm bằng chứng.
            </p>
          )}
        </div>
      ) : (
      <div className="space-y-3">
        {/*
          HAI TAB (mục 10.3): "Đang gặp vấn đề" (đường thường) và "Đã xong từ trước" (nhập
          bù). Không hiện khi mở từ một tín hiệu — xác minh tín hiệu luôn là chuyện đang xảy
          ra, không phải chuyện đã xong từ lâu.
        */}
        {!signal && (
          <div className="flex gap-1.5 items-center flex-wrap">
            <button type="button" className={`btn btn-sm ${mode === 'now' ? 'btn-primary' : ''}`}
              onClick={() => setMode('now')}>
              Đang gặp vấn đề
            </button>
            <span className="text-slate-500 text-xs cursor-help" aria-label="Không tạo bài đánh giá, không có mức SOS."
              title="Không tạo bài đánh giá, không có mức SOS.">ⓘ</span>
            <button type="button" className={`btn btn-sm ${mode === 'backfill' ? 'btn-primary' : ''}`}
              onClick={() => setMode('backfill')}>
              Đã xong từ trước
            </button>
            <span className="text-slate-500 text-xs cursor-help"
              aria-label="Nhập bù không có hạn, không tính vào tỷ lệ hiệu quả — đây là trí nhớ, không phải phương án đang chạy."
              title="Nhập bù không có hạn, không tính vào tỷ lệ hiệu quả — đây là trí nhớ, không phải phương án đang chạy.">ⓘ</span>
          </div>
        )}

        {/* ĐIỂM CỦA TÍN HIỆU — phần máy biết chắc, hiện ra để người dạy khỏi mở bài lên dò. */}
        {signal?.scoreText && (
          <p className="m-0 text-xs text-slate-400">
            Điểm: <span className="text-slate-200">{signal.contextLabel ?? signal.label}</span>{' '}
            <span className="tabular-nums text-rose-200">{signal.scoreText}</span>
          </p>
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

        {/* F-1: người dùng biết trước — ảnh/tệp/liên kết KHÔNG có ở đây, mà thêm ngay sau khi lưu. */}
        <p className="text-[11px] text-slate-500 m-0">Ảnh, tệp, liên kết: thêm ngay sau khi lưu.</p>

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

          F07: bộ kỹ năng theo đúng chương trình em đang học — hỏi máy chủ (`case-topics`) thay
          vì luôn giả định năm ô Fast Track, để lớp thường mở được Case Writing (`writing`).
        */}
        <Field label="Kỹ năng nào" required>
          {!studentId ? (
            <p className="text-xs text-slate-500 m-0">Chọn học viên trước.</p>
          ) : !signal && chuDe.loading && !chuDe.data ? (
            <p className="text-xs text-slate-500 m-0">Đang tải…</p>
          ) : (
            <div className="flex gap-1 flex-wrap">
              {topics.map((k) => (
                <button key={k} type="button"
                  className={`btn btn-sm ${topic === k ? 'btn-primary' : ''}`}
                  onClick={() => { setTopic(k); setPrimaryCode(''); }}>
                  {topicLabel(k)}
                </button>
              ))}
            </div>
          )}
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

        {/*
          TAB "ĐÃ XONG TỪ TRƯỚC" (mục 10.3) — chỗ DUY NHẤT được nhập ngày quá khứ, Không có ô "Mức độ": việc đã xong rồi thì không còn gì
          để mà gấp.
        */}
        {mode === 'backfill' && (
          <>
            <Field label="Khoảng thời gian" required
              hint="Khoảng thời gian vấn đề thật sự diễn ra, không phải hôm nay.">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[11px] text-slate-500 block">Từ ngày</span>
                  <input type="date" className="field" value={bfFrom} onChange={(e) => setBfFrom(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500 block">Đến ngày</span>
                  <input type="date" className="field" value={bfTo} onChange={(e) => setBfTo(e.target.value)} />
                </label>
              </div>
            </Field>

            {/*
              F-3 (§22.4): mỗi thẻ ba dòng cố định — mô tả, người thực hiện (ChonNguoi), khoảng
              ngày. Lỗi hiện NGAY DƯỚI thẻ của chính nó, không đẩy lệch các thẻ khác.
            */}
            <Field label="Phương án đã áp dụng" required hint="Mỗi thẻ một phương án: mô tả, người thực hiện, từ ngày → đến ngày.">
              <div className="space-y-2">
                {bfActions.map((a, i) => (
                  <div key={i} className="surface-2 rounded-lg p-2.5 space-y-1.5">
                    {bfActions.length > 1 && (
                      <div className="flex justify-end">
                        <button type="button" className="btn btn-sm btn-ghost"
                          onClick={() => setBfActions(bfActions.filter((_, j) => j !== i))}>
                          Xoá
                        </button>
                      </div>
                    )}
                    <input className="field" placeholder="Phương án đã áp dụng (ví dụ: tutor Listening mỗi tuần)"
                      value={a.description}
                      onChange={(e) => setBfActions(bfActions.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                    <ChonNguoi nhom="giao_vien" studentId={studentId} value={a.nguoi}
                      onChange={(v) => setBfActions(bfActions.map((x, j) => j === i ? { ...x, nguoi: v ?? { kieu: 'toi' } } : x))} />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[11px] text-slate-500 block">Từ ngày</span>
                        <input type="date" className="field" value={a.fromDate}
                          onChange={(e) => setBfActions(bfActions.map((x, j) => j === i ? { ...x, fromDate: e.target.value } : x))} />
                      </label>
                      <label className="block">
                        <span className="text-[11px] text-slate-500 block">Đến ngày</span>
                        <input type="date" className="field" value={a.toDate}
                          onChange={(e) => setBfActions(bfActions.map((x, j) => j === i ? { ...x, toDate: e.target.value } : x))} />
                      </label>
                    </div>
                    {bfErrors[i] && <p className="text-[11px] text-rose-300 m-0">{bfErrors[i]}</p>}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-ghost"
                  onClick={() => setBfActions([...bfActions, { description: '', nguoi: { kieu: 'toi' }, fromDate: '', toDate: '' }])}>
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

            {/* S5 — điểm giáo viên tự chấm theo đúng kỹ năng của case, luôn TUỲ CHỌN. */}
            {bfComponents.length > 0 && (
              <ComponentsField label={topicLabel(topic)} components={bfComponents} counts={bfCounts}
                value={bfMetrics} onChange={setBfMetrics}
                buttonLabel="+ Điểm chi tiết theo kỹ năng (không bắt buộc)" />
            )}

            <Field label="Ghi chú" required hint="Ngày quá khứ không tự chứng minh hiệu quả — nói rõ vì sao kết luận vậy.">
              <textarea className="field" rows={2} value={bfNote} onChange={(e) => setBfNote(e.target.value)} />
            </Field>

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
      )}

      {/*
        POP-UP CẢNH BÁO CASE TRÙNG — đè lên form, không thay thế form.

        Người dùng vẫn thấy chữ mình vừa gõ ở phía sau, nên chọn xong là hiểu mình vừa quyết
        định gì. Nút trái là vế MẶC ĐỊNH vì nó đúng trong đa số trường hợp; vế phải hợp lệ
        nhưng phải là quyết định có ý thức.
      */}
      {dup && !daLuu && (
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
