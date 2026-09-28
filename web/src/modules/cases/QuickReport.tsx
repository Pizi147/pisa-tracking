import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { ChonTuan, NgayDoiDuoc } from '../../ui/ChonNgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BangChung } from '../../ui/BangChung.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { ComponentsField, componentsPayload } from './ChiTietKyNang.tsx';
import {
  ENTRY_SKILL_LABEL, URGENCY_LEVELS, URGENCY_LABEL, issuesForTopic, DEFAULT_URGENCY,
  CASE_OUTCOMES, CASE_OUTCOME_LABEL, REGULAR_SKILL_LABEL,
  categoryOf, componentsFor, componentsAreCounts,
  nguoiThanhPayload, nguoiThieu, skillShort, tuanLich, type NguoiChon,
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
  open, onClose, studentId, studentName, lop, cycleId, onDone, signal, students, onPickStudent,
}: {
  open: boolean; onClose: () => void;
  /** Mã lớp hiện ở đầu ngăn (`Tạo Case · Tên HV · MB FOU 12`); không có thì bỏ phần lớp. */
  lop?: string | null;
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
  /* Lỗi chỉ hiện SAU khi bấm nút chính (Q4): `Còn thiếu: …` ở chân. */
  const [daBam, setDaBam] = useState(false);
  /* Các dòng PA đã áp dụng đang mở để sửa (dòng còn trống luôn mở). */
  const [moSua, setMoSua] = useState<number[]>([]);
  const { homNay, ngan } = useNgayNghiepVu();

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
  /* Nút kỹ năng một hàng chia đều: viết tắt L R W W1 W2 S (tooltip là tên đầy đủ). */
  const topicShort = (k: string) => skillShort(k);
  const nguoiNhan = (n: NguoiChon | null) => (!n || n.kieu === 'toi' ? 'tôi' : n.ten);

  const reset = () => {
    setSummary(''); setUrgency(DEFAULT_URGENCY); setTopic('');
    setTitle(''); setPrimaryCode(''); setDetectedAt(''); setDup(null); setDaBam(false); setMoSua([]);
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

  /* Bấm nút chính: còn thiếu thì chỉ hiện `Còn thiếu: …` ở chân (không toast, không gửi). Đủ rồi mới gửi; máy chủ vẫn kiểm lại. */
  const submit = async () => {
    setDaBam(true);
    if (thieu.length > 0) return;
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
          fromDate: a.fromDate || bfFrom, toDate: a.toDate || bfTo,
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
    setDaBam(true);
    if (thieu.length > 0) return;
    /*
     * F-3 (§22.4): mỗi thẻ kiểm RIÊNG, lỗi hiện NGAY DƯỚI thẻ đó. Thẻ chưa gõ gì (mô tả rỗng) thì bỏ qua. Khoảng tuần của thẻ
     * mặc định là khoảng chung (Q7); ô người thực hiện phải đủ.
     */
    const filled = bfActions.filter((a) => a.description.trim());
    const errors: Record<number, string> = {};
    bfActions.forEach((a, i) => {
      if (!a.description.trim()) return;
      if (a.description.trim().length < 3) { errors[i] = 'Phải nói rõ đã làm gì.'; return; }
      const thieuNguoi = nguoiThieu(a.nguoi, true);
      if (thieuNguoi) { errors[i] = thieuNguoi; return; }
      const tu = a.fromDate || bfFrom;
      const den = a.toDate || bfTo;
      if (tu > den) { errors[i] = 'Từ tuần phải trước Đến tuần.'; return; }
    });
    if (Object.keys(errors).length) { setBfErrors(errors); setMoSua(Object.keys(errors).map(Number)); return; }
    setBfErrors({});
    setBfActions(filled);
    await sendBackfill();
  };

  const category = categoryOf(topic);
  const bfComponents = componentsFor(category, chuDe.data?.ratio ? 'ratio' : 'band');
  const bfCounts = componentsAreCounts(category);

  /* Gom NHÃN ô còn thiếu — hiện ở chân SAU khi bấm nút chính (Q4), không toast trước khi gửi. */
  const thieu: string[] = [];
  if (students && !studentId) thieu.push('Học viên');
  if (!topic) thieu.push('Kỹ năng');
  if (!primaryCode) thieu.push('Phân loại vấn đề');
  if (title.trim().length < 6) thieu.push('Tên Case');
  if (summary.trim().length < 15) thieu.push('Mô tả');
  else if (primaryCode.endsWith('.other') && summary.trim().length < 30) thieu.push('Mô tả rõ hơn (chọn "Khác")');
  if (mode === 'backfill') {
    if (!bfFrom) thieu.push('Từ tuần');
    if (!bfTo) thieu.push('Đến tuần');
    if (bfFrom && bfTo && bfFrom > bfTo) thieu.push('Đến tuần không trước Từ tuần');
    if (!bfActions.some((a) => a.description.trim())) thieu.push('Phương án đã áp dụng');
    if (!bfOutcome) thieu.push('Kết quả cuối');
    if (bfNote.trim().length < 10) thieu.push('Vì sao kết luận vậy');
  }

  if (!open) return null;

  const tieuDe = signal?.kind === 'normal' ? `Tạo Case ${signal.label}`
    : signal ? `Xác minh SOS ${signal.label}` : 'Tạo Case';
  const tenChon = (students ?? []).find((st) => st.id === studentId)?.name ?? studentName;
  const nhanTuan = (iso: string) => (iso ? tuanLich(iso, homNay) : '');

  /* ─────────────── bước "Đã lưu": không đóng — Bằng chứng của CHÍNH Case vừa tạo (F-1, §3.13), chân chỉ còn "Xong". */
  if (daLuu) {
    return (
      <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dong} chan={{ huy: { nhan: 'Xong', onClick: dong } }}>
        <Khoi tieuDe="Đã lưu">
          <p className="m-0 text-sm text-slate-200">
            {daLuu.gop ? <>✓ Đã ghi vào Case đang có «{daLuu.tieuDe}»</> : <>✓ Đã lưu Case «{daLuu.tieuDe}»</>}
          </p>
        </Khoi>
        <Khoi tieuDe="Bằng chứng">
          {daLuu.canEdit ? (
            <BangChung ownerType="sos_case" ownerId={daLuu.id} canEdit={daLuu.canEdit} tieuDe="" />
          ) : (
            /* GVCN mở Case môn mình không dạy — không đính kèm được ở đây; nói rõ ai sẽ thêm, không vẽ khối trống. */
            <p className="m-0 text-xs text-slate-500">Bạn không có quyền đính kèm cho Case môn này. GV dạy môn đó hoặc Quản lý sẽ thêm.</p>
          )}
        </Khoi>
      </KhungPanel>
    );
  }

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={tenChon} lop={lop} onDong={dong}
      /* Điểm của tín hiệu = phần máy biết chắc, hiện ở dòng ngữ cảnh (≤ 1 dòng) để khỏi mở bài lên dò. */
      ngCanh={signal?.scoreText ? (
        <span>Điểm {signal.contextLabel ?? signal.label}: <span className="tabular-nums text-late">{signal.scoreText}</span></span>
      ) : undefined}
      tabs={!signal ? (
        <HangTab cap="con" ariaLabel="Loại Case" value={mode} onChange={(k) => { setMode(k); setDaBam(false); }}
          tabs={[{ key: 'now', label: 'Đang gặp vấn đề' }, { key: 'backfill', label: 'Đã xong từ trước' }]} />
      ) : undefined}
      chan={{
        conThieu: daBam ? thieu : undefined,
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={mode === 'now' ? submit : submitBackfill}>
            {mode === 'now' ? 'Tạo Case' : 'Ghi lại Case đã xong'}
          </button>
        ),
      }}>
      <Khoi tieuDe="Vấn đề"
        luat={mode === 'backfill'
          ? 'Nhập bù không có hạn và không tính vào tỷ lệ hiệu quả: đây là trí nhớ, không phải PA đang chạy. Không tạo bài đánh giá, không có mức SOS.'
          : 'Hệ thống chỉ đọc được con số. Phần này là quan sát của bạn: em sai ở đâu, bài hay buổi nào.'}>
        {/* CHỌN HỌC VIÊN — chỉ khi mở từ trang lớp (mục 13.1); ở hồ sơ một em thì không hỏi lại. */}
        {students && (
          <Truong nhan="Học viên" batBuoc>
            <select className="field w-full" value={studentId || ''} onChange={(e) => onPickStudent?.(Number(e.target.value) || 0)}>
              <option value="">Chọn học viên</option>
              {students.map((st) => <option key={st.id} value={st.id}>{st.name}{st.code ? ` · ${st.code}` : ''}</option>)}
            </select>
          </Truong>
        )}

        {/* Kỹ năng BẮT BUỘC: không có nó, vấn đề rơi vào "chưa phân loại" và biến mất khỏi bảng tổng hợp theo kỹ năng. */}
        <Truong nhan="Kỹ năng" batBuoc as="div">
          {!studentId ? (
            <div className="grid grid-cols-4 gap-2 opacity-40" aria-hidden>
              {['L', 'R', 'W', 'S'].map((k) => <span key={k} className="btn justify-center">{k}</span>)}
            </div>
          ) : !signal && chuDe.loading && !chuDe.data ? (
            <div className="h-[34px] animate-pulse rounded-md" style={{ background: 'var(--surface-2)' }} />
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(topics.length, 1)}, minmax(0, 1fr))` }}>
              {topics.map((k) => (
                <button key={k} type="button" aria-pressed={topic === k} title={topicLabel(k)}
                  className={`btn min-h-[44px] justify-center px-1 sm:min-h-0 ${topic === k ? 'btn-primary' : ''}`}
                  onClick={() => { setTopic(k); setPrimaryCode(''); }}>
                  {topicShort(k)}
                </button>
              ))}
            </div>
          )}
        </Truong>

        {/* Phân loại BẮT BUỘC (máy chủ cần `primaryCode`): select ≥ 5 lựa chọn, gợi ý của lựa chọn nằm ở `title` (Q6). */}
        <Truong nhan="Phân loại vấn đề" batBuoc>
          <select className="field w-full" value={primaryCode} disabled={!topic}
            title={causes.find((i) => i.code === primaryCode)?.hint}
            onChange={(e) => setPrimaryCode(e.target.value)}>
            <option value="">{topic ? 'Chọn phân loại' : ''}</option>
            {causes.map((i) => <option key={i.code} value={i.code} title={i.hint}>{i.label}</option>)}
          </select>
        </Truong>

        {/* Nhập bù là chuyện ĐÃ XONG — không còn "mức độ" để xin. */}
        {mode === 'now' && (
          <Truong nhan="Mức độ" batBuoc phu="Nhận định của người báo, không phải mức SOS" as="div">
            <div className="grid grid-cols-2 gap-2">
              {URGENCY_LEVELS.map((u) => (
                <button key={u} type="button" aria-pressed={urgency === u}
                  className={`btn min-h-[44px] justify-center sm:min-h-0 ${urgency === u ? 'btn-primary' : ''}`} onClick={() => setUrgency(u)}>
                  {URGENCY_LABEL[u]}
                </button>
              ))}
            </div>
          </Truong>
        )}

        {/* TÊN CASE DO NGƯỜI TẠO ĐẶT (mục 7.3): Case tạo tay không có gì để suy, hệ thống không được tự gán "… dưới kỳ vọng". */}
        <Truong nhan="Tên Case" batBuoc>
          <input className="field w-full" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Reading — sai dạng True/False/Not Given" />
        </Truong>
        <Truong nhan="Mô tả và dẫn chứng" batBuoc phu="Sai ở đâu, bài hay buổi nào">
          <textarea className="field w-full" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder="Ví dụ: Giữa khoá sai 4/5 câu Not Given" />
        </Truong>
      </Khoi>

      {mode === 'now' && (
        <Khoi tieuDe="Theo dõi">
          <NgayDoiDuoc tien="Bắt đầu theo dõi" value={detectedAt || homNay} onChange={setDetectedAt} soNgay={30} />
        </Khoi>
      )}

      {/* TAB "ĐÃ XONG TỪ TRƯỚC" (mục 10.3) — chỗ DUY NHẤT được nhập thời gian quá khứ; tuần thay ngày (Q7). */}
      {mode === 'backfill' && (
        <>
          <Khoi tieuDe="Đã áp dụng">
            <Hang2>
              <Truong nhan="Từ tuần" batBuoc>
                <ChonTuan moc="dau" lui={26} toi={0} value={bfFrom} onChange={setBfFrom} chuaChon="Chọn tuần" />
              </Truong>
              <Truong nhan="Đến tuần" batBuoc>
                <ChonTuan moc="cuoi" lui={26} toi={0} value={bfTo} onChange={setBfTo} chuaChon="Chọn tuần" />
              </Truong>
            </Hang2>
            <div className="space-y-2">
              {bfActions.map((a, i) => {
                const dangSua = moSua.includes(i) || !a.description.trim();
                const tu = a.fromDate || bfFrom;
                const den = a.toDate || bfTo;
                const doiKhoang = (part: 'fromDate' | 'toDate') => (v: string) =>
                  setBfActions(bfActions.map((x, j) => (j === i ? { ...x, [part]: v } : x)));
                return (
                  <div key={i} className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--line)' }}>
                    {dangSua ? (
                      <div className="space-y-2">
                        <input className="field w-full" placeholder="Ví dụ: tutor Listening mỗi tuần" value={a.description}
                          onChange={(e) => setBfActions(bfActions.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                        <ChonNguoi nhom="giao_vien" studentId={studentId} value={a.nguoi}
                          onChange={(v) => setBfActions(bfActions.map((x, j) => (j === i ? { ...x, nguoi: v ?? { kieu: 'toi' } } : x)))} />
                        <Hang2>
                          <ChonTuan moc="dau" lui={26} toi={0} value={a.fromDate} onChange={doiKhoang('fromDate')} chuaChon="Từ tuần: như trên" ariaLabel="Từ tuần" />
                          <ChonTuan moc="cuoi" lui={26} toi={0} value={a.toDate} onChange={doiKhoang('toDate')} chuaChon="Đến tuần: như trên" ariaLabel="Đến tuần" />
                        </Hang2>
                        <span className="flex gap-2">
                          {a.description.trim() && (
                            <button type="button" className="btn btn-sm" onClick={() => setMoSua(moSua.filter((x) => x !== i))}>Xong</button>
                          )}
                          {bfActions.length > 1 && (
                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setBfActions(bfActions.filter((_, j) => j !== i))}>Xoá</button>
                          )}
                        </span>
                      </div>
                    ) : (
                      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 text-xs text-slate-300">
                        <span className="min-w-0 truncate text-slate-100" title={a.description}>{a.description}</span>
                        <span className="text-slate-500">· {nguoiNhan(a.nguoi)}</span>
                        {tu && den && <span className="text-slate-500">· {nhanTuan(tu)} → {nhanTuan(den)}</span>}
                        <button type="button" className="link appearance-none border-0 bg-transparent p-0" onClick={() => setMoSua([...moSua, i])}>Sửa</button>
                      </p>
                    )}
                    {bfErrors[i] && <p className="m-0 mt-1 text-[11px] text-late">{bfErrors[i]}</p>}
                  </div>
                );
              })}
              <button type="button" className="btn btn-sm btn-ghost"
                onClick={() => setBfActions([...bfActions, { description: '', nguoi: { kieu: 'toi' }, fromDate: '', toDate: '' }])}>
                + Thêm PA đã áp dụng
              </button>
            </div>
          </Khoi>

          <Khoi tieuDe="Kết quả">
            <Truong nhan="Kết quả cuối" batBuoc as="div">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CASE_OUTCOMES.map((o) => (
                  <button key={o} type="button" aria-pressed={bfOutcome === o}
                    className={`btn min-h-[44px] justify-center sm:min-h-0 ${bfOutcome === o ? 'btn-primary' : ''}`} onClick={() => setBfOutcome(o)}>
                    {CASE_OUTCOME_LABEL[o]}
                  </button>
                ))}
              </div>
            </Truong>
            {/* S5 — điểm giáo viên tự chấm theo đúng kỹ năng của Case, luôn TUỲ CHỌN. */}
            {bfComponents.length > 0 && (
              <ComponentsField label={topicLabel(topic)} components={bfComponents} counts={bfCounts}
                value={bfMetrics} onChange={setBfMetrics} buttonLabel="+ Điểm chi tiết theo kỹ năng" />
            )}
            <Truong nhan="Vì sao kết luận vậy" batBuoc>
              <textarea className="field w-full" rows={2} value={bfNote} onChange={(e) => setBfNote(e.target.value)}
                placeholder="Ví dụ: MT3 Listening lên 6.0" />
            </Truong>
          </Khoi>
        </>
      )}

      {/* F-1: người dùng biết trước — ảnh/tệp/liên kết KHÔNG có ở đây, mà thêm ngay sau khi lưu. */}
      <Khoi tieuDe="Bằng chứng">
        <p className="m-0 text-xs text-slate-500">Ảnh, tệp, liên kết — thêm được ngay sau khi tạo</p>
      </Khoi>

      {/* CẢNH BÁO CASE TRÙNG (mục 7.13) — MỘT khối vàng, hai nút, ngay trong thân; chữ vừa gõ vẫn còn. */}
      {mode === 'backfill' && bfDup && (
        <div className="mt-3.5 rounded-lg border p-3" style={{ borderColor: 'var(--soon-line)', background: 'var(--soon-bg)' }}>
          <p className="m-0 text-sm text-slate-100">
            Đã có Case nhập bù <strong>“{bfDup.title}”</strong> trùng khoảng {ngan(bfDup.from)} → {ngan(bfDup.to)}. Cùng một lần?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => sendBackfill({ confirmDuplicate: true })}>Lần khác, vẫn ghi riêng</button>
          </div>
        </div>
      )}
      {mode === 'now' && dup && (
        <div className="mt-3.5 rounded-lg border p-3" style={{ borderColor: 'var(--soon-line)', background: 'var(--soon-bg)' }}>
          <p className="m-0 text-sm text-slate-100">
            Đã có Case <strong>“{dup.title}”</strong> chưa xử lý xong ở {dup.categoryLabel}.
            <span className="text-slate-400"> Mở {ngan(dup.detectedAt)}{dup.interventionCount > 0 ? ` · ${dup.interventionCount} PA` : ' · chưa có PA'}.</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => send({ mergeIntoExisting: true })}>Ghi vào Case đang có</button>
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => send({ parallel: true })}>Vấn đề khác, mở Case riêng</button>
          </div>
        </div>
      )}
    </KhungPanel>
  );
}
