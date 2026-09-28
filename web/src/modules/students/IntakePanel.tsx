import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { Field, Outcome, SectionNote, Th } from '../../ui/ui.tsx';
import { ngay } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';


type Row = {
  fullName?: string; dob?: string;
  baselineScore?: number | string | null;
  entryListening?: number | string | null;
  entryReading?: number | string | null;
  entryWriting?: number | string | null;
  entrySpeaking?: number | string | null;
  target?: number | string | null;
  startWeek?: string;
  /* Vẫn nhận được nếu bảng dán có cột cũ, nhưng lưới nhập tay không bày ra nữa. */
  classCode?: string; examMonth?: string; route?: string; consultant?: string;
};
type PreviewRow = Row & {
  row: number; classId: number | null;
  duplicates: { id: number; studentCode: string; fullName: string; dob: string | null }[];
  issues: { row: number; field: string; message: string }[];
};
type Preview = {
  rows: PreviewRow[];
  issues: { row: number; field: string; message: string }[];
  ratio: boolean; classCode: string | null; programme: string | null;
  defaultStartWeek?: string | null;
};

type Col = { key: keyof Row; label: string; width: string; hint?: string };

/**
 * BỘ CỘT THEO ĐÚNG CHƯƠNG TRÌNH CỦA LỚP (mục 12.1).
 *
 *   Fast Track  Họ tên · Ngày sinh · OVR · L · R · W · S · Target · Tuần bắt đầu
 *   Normal      Họ tên · Ngày sinh · OVR · Tuần bắt đầu
 *
 * KHÔNG bày trường Fast Track cho lớp Normal rồi bắt điền dấu '-'. Em lớp Foundation không
 * có target IELTS và không có band từng kỹ năng — hỏi là hỏi thừa, và một cột thừa thì luôn
 * có ai đó điền bừa cho xong.
 *
 * LỚP KHÔNG CÒN LÀ MỘT CỘT: nó chọn một lần ở đầu panel. Bản trước để lớp thành một ô lặp
 * lại ở từng dòng, nên một file bốn mươi dòng gõ sai mã lớp ở dòng ba mươi là mười em rơi
 * đi đâu không ai biết.
 */
const COMMON: Col[] = [
  { key: 'fullName', label: 'Họ và tên', width: 'w-44' },
  { key: 'dob', label: 'Ngày sinh', width: 'w-28' },
  { key: 'baselineScore', label: 'OVR đầu vào', width: 'w-24',
    hint: 'Con số trên phiếu điểm chính thức. Nhập độc lập với bốn môn — không phải trung bình cộng.' },
];
const FT_ONLY: Col[] = [
  { key: 'entryListening', label: 'L', width: 'w-16' },
  { key: 'entryReading', label: 'R', width: 'w-16' },
  { key: 'entryWriting', label: 'W', width: 'w-16', hint: 'Writing TỔNG trên phiếu điểm — không chia W1/W2.' },
  { key: 'entrySpeaking', label: 'S', width: 'w-16' },
  { key: 'target', label: 'Target', width: 'w-20' },
];
const WEEK_COL: Col = {
  key: 'startWeek', label: 'Tuần bắt đầu', width: 'w-32',
  hint: 'Bỏ trống thì dùng tuần mặc định chọn ở trên. Nhập ngày bất kỳ trong tuần cũng được.',
};
const columnsFor = (ratio: boolean): Col[] =>
  ratio ? [...COMMON, WEEK_COL] : [...COMMON, ...FT_ONLY, WEEK_COL];

const EMPTY: Row = { fullName: '', dob: '', baselineScore: '', target: '', startWeek: '' };

/**
 * Thêm nhiều học viên trong một lần.
 *
 * Dán thẳng vùng bảng từ Excel/Google Sheets, hoặc gõ trực tiếp vào lưới. Không bắt mở
 * một hộp thoại riêng cho từng em. Server soát lại từng dòng theo phạm vi quyền trước khi ghi.
 */
export function IntakePanel({ defaultClass, onClose, onDone }: {
  defaultClass: { id: number; code: string } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const classes = useApi<any[]>('/ref/classes');
  /*
   * LỚP CHỌN MỘT LẦN, Ở ĐẦU PANEL (mục 12.1). Mở từ hồ sơ lớp thì chọn sẵn đúng lớp đó.
   * Cả lô vào lớp này — đó là quyết định của cả lần nhập, không phải một ô lặp bốn mươi lần.
   */
  const [classId, setClassId] = useState<number | null>(defaultClass?.id ?? null);
  const [startWeek, setStartWeek] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY }]);
  const [dateFormat, setDateFormat] = useState<'dmy' | 'mdy' | 'iso'>('dmy');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [skipRows, setSkipRows] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [pasteText, setPasteText] = useState('');
  // Khoá idempotency giữ nguyên trong suốt một lần nhập, nên bấm hai lần hoặc thử lại
  // sau lỗi mạng cũng không tạo thêm học viên.
  const idempotencyKey = useRef(`intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const pv = preview;
  const ratio = !!pv?.ratio;
  const cols = columnsFor(ratio);
  const cls = (classes.data ?? []).find((c: any) => c.id === classId) ?? null;

  const setCell = (i: number, key: keyof Row, v: string) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
    setPreview(null);
  };

  const handlePaste = async (text: string) => {
    if (!text.trim()) return;
    try {
      const r = await api.post<{ rows: Row[]; usedHeader: boolean }>('/intake/parse', { text });
      if (!r.rows.length) { toast.push('error', 'Không đọc được dòng nào từ nội dung đã dán.'); return; }
      setRows(r.rows);
      setPreview(null);
      setPasteText('');
      toast.push('ok', `Đã đọc ${r.rows.length} dòng${r.usedHeader ? ' (có dòng tiêu đề)' : ''}.`);
    } catch (e: any) { toast.push('error', e.message); }
  };

  const runPreview = useCallback(async () => {
    if (!classId) { setPreview(null); return; }
    try {
      const r = await api.post<Preview>('/intake/preview', {
        rows, classId, defaultStartWeek: startWeek || null, dateFormat,
      });
      setPreview(r);
    } catch (e: any) { toast.push('error', e.message); }
  }, [rows, classId, startWeek, dateFormat, toast]);

  /*
   * Xem trước chạy TỰ ĐỘNG chứ không đợi bấm nút: người nhập phải nhìn thấy dòng nào hỏng
   * ngay khi vừa dán hoặc vừa gõ xong, chứ không phải đến lúc bấm Thêm mới biết.
   */
  useEffect(() => {
    const t = setTimeout(() => { void runPreview(); }, 400);
    return () => clearTimeout(t);
  }, [runPreview]);

  const commit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ added: number; skipped: number; failed: any[] }>('/intake/commit', {
        rows, classId, defaultStartWeek: startWeek || null, dateFormat,
        skipRows: [...skipRows], idempotencyKey: idempotencyKey.current,
      });
      toast.push(r.added > 0 ? 'ok' : 'info',
        `Đã thêm ${r.added} học viên${r.skipped ? `, bỏ qua ${r.skipped} dòng` : ''}.`);
      onDone();
      if (r.added > 0) onClose();
      else setPreview(null);
    } catch (e: any) {
      toast.push('error', e.message);        // giữ nguyên lưới đang nhập để thử lại
    } finally { setBusy(false); }
  };

  /* Cảnh báo KHÔNG chặn: thiếu target, trùng hồ sơ và cột lớp bị bỏ qua đều là tin, không phải lỗi. */
  const isWarning = (m: string) =>
    m.includes('Chưa có target') || m.includes('trùng hồ sơ') || m.includes('Bỏ qua cột lớp');
  const blocking = useMemo(
    () => (pv?.rows ?? []).filter((r) => !skipRows.has(r.row)
      && r.issues.some((i) => !isWarning(i.message))).length,
    [pv, skipRows],
  );
  // Nhãn nút phải nói đúng số dòng SẼ được ghi, không đếm cả dòng hỏng và dòng đã bỏ qua.
  const willAdd = useMemo(() => {
    if (!pv) return 0;
    return pv.rows.filter((r) => !skipRows.has(r.row)
      && !r.issues.some((i) => !isWarning(i.message))).length;
  }, [pv, skipRows]);

  return (
    <KhungPanel tieuDe="Thêm học viên" lop={cls?.code} rong="toan" onDong={onClose}
      ngCanh="Chọn lớp, rồi dán từ Excel/Google Sheets hoặc gõ thẳng vào lưới"
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={commit}
            disabled={busy || !classId || willAdd === 0 || blocking > 0}>
            {busy ? 'Đang lưu…' : willAdd > 0 ? `Thêm ${willAdd} học viên` : 'Thêm học viên'}
          </button>
        ),
      }}>
      <div className="space-y-4 pt-3">
        {/*
          LỚP VÀ TUẦN BẮT ĐẦU — hai quyết định của CẢ LÔ, đặt ở trên cùng (mục 12.1).
          Lớp quyết định bảng bên dưới có những cột nào, nên nó phải được chọn trước.
        */}
        <div className="surface-2 rounded-lg p-3 grid gap-3 sm:grid-cols-2">
          <Field label="Thêm vào lớp" required hint="Cột “Lớp” trong file dán sẽ bị bỏ qua.">
            <select className="field w-full" value={classId ?? ''}
              onChange={(e) => { setClassId(Number(e.target.value) || null); setPreview(null); }}>
              <option value="">Chọn lớp…</option>
              {(classes.data ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.code}{c.programme_name ? ` · ${c.programme_name}` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Tuần bắt đầu học"
            hint={pv?.defaultStartWeek
              ? `Đang dùng tuần bắt đầu ${ngay(pv.defaultStartWeek, homNay)}. Có thể chọn tuần bắt đầu riêng cho từng học viên.`
              : 'Bỏ trống thì lấy ngày bắt đầu của lớp. Có thể chọn tuần bắt đầu riêng cho từng học viên.'}>
            <ONgay kieu="tuan" value={startWeek} onChange={(v) => { setStartWeek(v); setPreview(null); }} />
          </Field>
          {pv && (
            <p className="text-xs text-slate-400 m-0 sm:col-span-2">
              {ratio
                ? `Lớp ${pv.classCode} học theo chương trình ${pv.programme ?? ''} — bảng dưới chỉ hỏi họ tên, `
                  + 'ngày sinh, OVR đầu vào và tuần bắt đầu. Lớp này không có target IELTS và không có band từng kỹ năng.'
                : `Lớp ${pv.classCode} là lớp Fast Track — bảng dưới hỏi thêm band đầu vào từng kỹ năng và target.`}
            </p>
          )}
          {!classId && (
            <p className="text-xs text-amber-200 m-0 sm:col-span-2">
              Chọn lớp trước thì bảng bên dưới mới biết phải hỏi những cột nào.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="label">Dán vùng bảng từ Excel / Google Sheets</span>
            <textarea
              className="field font-mono text-xs"
              rows={3}
              placeholder={ratio
                ? 'Họ tên\tNgày sinh\tOVR\nNguyễn Văn A\t12/05/2008\t5.0'
                : 'Họ tên\tNgày sinh\tOVR\tL\tR\tW\tS\tTarget\nNguyễn Văn A\t12/05/2008\t5.0\t5.5\t5.0\t4.5\t5.0\t6.5'}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text/plain');
                if (text.includes('\t') || text.includes('\n')) { e.preventDefault(); void handlePaste(text); }
              }}
            />
          </label>
          <div className="space-y-2">
            <label className="block">
              <span className="label">Định dạng ngày trong dữ liệu</span>
              <select className="field" value={dateFormat} onChange={(e) => { setDateFormat(e.target.value as any); setPreview(null); }}>
                <option value="dmy">Ngày/Tháng/Năm — 12/05/2008</option>
                <option value="mdy">Tháng/Ngày/Năm — 05/12/2008</option>
                <option value="iso">Năm-Tháng-Ngày — 2008-05-12</option>
              </select>
            </label>
            <button type="button" className="btn btn-sm min-h-[44px] w-full justify-center sm:min-h-0" onClick={() => void handlePaste(pasteText)} disabled={!pasteText.trim()}>
              Đọc nội dung đã dán
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th w-10">#</th>
                {cols.map((c) => (
                  <Th key={c.key} className={c.width} hint={c.hint}>{c.label}</Th>
                ))}
                <Th className="w-16" hint="Tick để không nhập dòng này. Dòng lỗi vẫn giữ lại để bạn sửa, không làm hỏng cả lô.">Bỏ qua</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rowPv = pv?.rows.find((x) => x.row === i + 1);
                const skipped = skipRows.has(i + 1);
                return (
                  <tr key={i} className={skipped ? 'row-muted' : ''}
                    data-needs-fix={!skipped && !!rowPv?.issues.some((x) => !isWarning(x.message)) ? 'true' : undefined}>
                    <td className="td text-xs tabular-nums text-slate-500">{i + 1}</td>
                    {cols.map((c) => {
                      const issue = rowPv?.issues.find((x) => x.field === c.key);
                      return (
                        <td key={c.key} className="td">
                          <input
                            className={`field ${c.width} ${issue && !isWarning(issue.message) ? 'border-rose-300/60' : ''}`}
                            value={String((r as any)[c.key] ?? '')}
                            disabled={skipped}
                            /* Ô tuần bỏ trống thì hiện tuần mặc định của cả lô, để không ai phải đoán.
                               G-6: không hiện ISO — ngay() đổi "2026-07-27" thành "27/07/2026". */
                            placeholder={c.key === 'startWeek'
                              ? (pv?.defaultStartWeek ? ngay(pv.defaultStartWeek, homNay) : '')
                              : undefined}
                            aria-label={`${c.label} dòng ${i + 1}`}
                            onChange={(e) => setCell(i, c.key, e.target.value)}
                          />
                          {issue && (
                            <div className={`text-[11px] mt-0.5 ${isWarning(issue.message) ? 'text-soon' : 'text-late'}`}>
                              {issue.message}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="td">
                      <input
                        type="checkbox"
                        checked={skipped}
                        aria-label={`Bỏ qua dòng ${i + 1}`}
                        onChange={(e) => setSkipRows((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.add(i + 1); else n.delete(i + 1);
                          return n;
                        })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setRows((rs) => [...rs, { ...EMPTY }])}>
            Thêm dòng
          </button>
          {rows.length > 1 && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => { setRows((rs) => rs.slice(0, -1)); setPreview(null); }}>
              Bớt dòng cuối
            </button>
          )}
          {/*
            * Còn dòng cần sửa thì KHOÁ nút Thêm, để không có dòng nào âm thầm biến mất khỏi lô nhập. Nút này đưa
            * người nhập tới dòng đầu tiên cần sửa — KHÔNG bỏ qua hàng loạt (bộ chữ: bỏ nút "Bỏ qua N dòng"). Muốn bỏ
            * một dòng thì tick ô "Bỏ qua dòng" của đúng dòng đó.
            */}
          {pv && (blocking > 0 ? (
            <button
              type="button" className="btn btn-sm min-h-[44px] sm:min-h-0"
              onClick={() => document.querySelector('[data-needs-fix="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              Xem {blocking} dòng cần sửa
            </button>
          ) : (
            <Outcome tone="ok" mark="✓">Không còn lỗi chặn</Outcome>
          ))}
        </div>

        {pv?.rows.some((r) => r.duplicates.length) && (
          <div className="surface-2 rounded-lg p-3">
            <div className="label">Có thể trùng hồ sơ đã có</div>
            <ul className="text-xs space-y-1 list-none p-0 m-0">
              {pv.rows.filter((r) => r.duplicates.length).map((r) => (
                <li key={r.row} className="text-slate-300">
                  Dòng {r.row} — {r.fullName}: giống {r.duplicates.map((d) => `${d.fullName} (${d.studentCode})`).join(', ')}
                </li>
              ))}
            </ul>
            <SectionNote>
              Trùng tên và ngày sinh chỉ là <strong>gợi ý</strong>. Hệ thống không tự gộp hồ sơ — bạn tự quyết
              bỏ qua dòng hay vẫn thêm mới.
            </SectionNote>
          </div>
        )}

        <SectionNote>
          Ô trống hoặc dấu <strong>“-”</strong> nghĩa là CHƯA CÓ THÔNG TIN, không phải 0 — bổ sung sau
          được. OVR đầu vào nhập độc lập với bốn môn: thiếu vài môn thì để trống đúng những môn thiếu,
          và có đủ bốn môn cũng không tính lại OVR.
          <br />
          Mã học viên do máy chủ sinh, giữ nguyên khi chuyển lớp hay học lại. Em đã có hồ sơ thì nên
          dùng <strong>ghi danh / chuyển lớp</strong> chứ đừng tạo mã mới — tạo mã mới là chẻ lịch sử của
          một đứa trẻ thành hai hồ sơ không ai nối lại được.
          <br />
          Đường nhập này <strong>không xếp lịch MT</strong>. Lịch thi là việc của Quản lý ở panel Lộ trình,
          nơi có đủ ràng buộc thứ tự đợt — nếu không, ô nhập danh sách thành một lối vòng quanh quyền
          xếp lịch.
        </SectionNote>
      </div>
    </KhungPanel>
  );
}
