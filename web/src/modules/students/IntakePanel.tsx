import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { Outcome, SectionNote } from '../../ui/ui.tsx';


type Row = {
  fullName?: string; classCode?: string; dob?: string;
  baselineScore?: number | string | null;
  target?: number | string | null;
  /* Vẫn nhận được nếu bảng dán có các cột cũ, nhưng lưới nhập tay không bày ra nữa. */
  examMonth?: string; route?: string; consultant?: string; mockWeeks?: string[];
};
type PreviewRow = Row & {
  row: number; classId: number | null;
  duplicates: { id: number; studentCode: string; fullName: string; dob: string | null }[];
  issues: { row: number; field: string; message: string }[];
};

/**
 * NĂM CỘT, KHÔNG HƠN — owner chốt 13/09/2026 (mục 7.4).
 *
 * Ba cột bỏ đi và lý do: lộ trình suy từ chính lớp em vào; kỳ thi IELTS lúc nhập chưa ai
 * biết; tư vấn viên không đổi được quyết định nào trong phần mềm này. Bảng dán có các cột
 * đó thì hệ thống vẫn đọc — chỉ là không bắt ai gõ tay nữa.
 */
const COLUMNS: { key: keyof Row; label: string; width: string; hint?: string }[] = [
  { key: 'fullName', label: 'Họ và tên', width: 'w-48' },
  { key: 'classCode', label: 'Lớp', width: 'w-32' },
  { key: 'dob', label: 'Ngày sinh', width: 'w-28' },
  { key: 'baselineScore', label: 'Điểm đầu vào', width: 'w-28', hint: 'Ưu tiên OVR. Bỏ trống được, bổ sung sau.' },
  { key: 'target', label: 'Target', width: 'w-20' },
];

const EMPTY: Row = { fullName: '', classCode: '', dob: '', baselineScore: '', target: '' };

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
  const classes = useApi<any[]>('/ref/classes');
  /* Lộ trình đọc từ BẢNG, không từ hằng số: lộ trình Quản trị hệ thống vừa tạo phải chọn được ngay. */
  const routes = useApi<{ code: string }[]>('/ref/routes');
  const routeCodes = (routes.data ?? []).map((r) => r.code);
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY, classCode: defaultClass?.code ?? '' }]);
  const [dateFormat, setDateFormat] = useState<'dmy' | 'mdy' | 'iso'>('dmy');
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [skipRows, setSkipRows] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [pasteText, setPasteText] = useState('');
  // Khoá idempotency giữ nguyên trong suốt một lần nhập, nên bấm hai lần hoặc thử lại
  // sau lỗi mạng cũng không tạo thêm học viên.
  const idempotencyKey = useRef(`intake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const setCell = (i: number, key: keyof Row, v: string) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
    setPreview(null);
  };

  const handlePaste = async (text: string) => {
    if (!text.trim()) return;
    try {
      const r = await api.post<{ rows: Row[]; usedHeader: boolean }>('/intake/parse', { text });
      if (!r.rows.length) { toast.push('error', 'Không đọc được dòng nào từ nội dung đã dán.'); return; }
      setRows(r.rows.map((x) => ({ ...x, classCode: x.classCode || defaultClass?.code || '' })));
      setPreview(null);
      setPasteText('');
      toast.push('ok', `Đã đọc ${r.rows.length} dòng${r.usedHeader ? ' (có dòng tiêu đề)' : ''}.`);
    } catch (e: any) { toast.push('error', e.message); }
  };

  const runPreview = useCallback(async () => {
    try {
      const r = await api.post<{ rows: PreviewRow[] }>('/intake/preview', {
        rows, defaultClassId: defaultClass?.id ?? null, dateFormat,
      });
      setPreview(r.rows);
    } catch (e: any) { toast.push('error', e.message); }
  }, [rows, defaultClass?.id, dateFormat, toast]);

  /*
   * Xem trước chạy TỰ ĐỘNG chứ không đợi bấm nút: người nhập phải nhìn thấy dòng nào hỏng
   * ngay khi vừa dán hoặc vừa gõ xong, chứ không phải đến lúc bấm Thêm mới biết.
   */
  useEffect(() => {
    if (rows.every((r) => !r.fullName?.trim() && !r.classCode?.trim())) { setPreview(null); return; }
    const t = setTimeout(() => { void runPreview(); }, 400);
    return () => clearTimeout(t);
  }, [runPreview, rows]);

  const commit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ added: number; skipped: number; failed: any[] }>('/intake/commit', {
        rows, defaultClassId: defaultClass?.id ?? null, dateFormat,
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

  const blocking = useMemo(
    () => (preview ?? []).filter((r) => !skipRows.has(r.row)
      && r.issues.some((i) => !i.message.includes('Chưa có target'))).length,
    [preview, skipRows],
  );
  // Nhãn nút phải nói đúng số dòng SẼ được ghi, không đếm cả dòng hỏng và dòng đã bỏ qua.
  const willAdd = useMemo(() => {
    if (!preview) return rows.length - skipRows.size;
    return preview.filter((r) => !skipRows.has(r.row)
      && !r.issues.some((i) => !i.message.includes('Chưa có target'))).length;
  }, [preview, rows.length, skipRows]);

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-5xl"
      title={defaultClass ? `Thêm học viên vào ${defaultClass.code}` : 'Thêm học viên'}
      subtitle="Dán từ Excel/Google Sheets hoặc gõ thẳng vào lưới"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Đóng</button>
          <button className="btn btn-primary" onClick={commit} disabled={busy || willAdd === 0 || blocking > 0}>
            {busy ? 'Đang lưu…' : `Thêm ${willAdd} học viên`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="label">Dán vùng bảng từ Excel / Google Sheets</span>
            <textarea
              className="field font-mono text-xs"
              rows={3}
              placeholder={'Họ tên\tLớp\tNgày sinh\tLộ trình\tTarget\nNguyễn Văn A\tMB-FT 101\t12/05/2008\tLT1\t6.5'}
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
            <button className="btn btn-sm w-full justify-center" onClick={() => void handlePaste(pasteText)} disabled={!pasteText.trim()}>
              Đọc nội dung đã dán
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th w-10">#</th>
                {COLUMNS.map((c) => <th key={c.key} className="th">{c.label}</th>)}
                <th className="th w-16">Bỏ qua</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const pv = preview?.find((x) => x.row === i + 1);
                const skipped = skipRows.has(i + 1);
                return (
                  <tr key={i} className={skipped ? 'row-muted' : ''}>
                    <td className="td text-xs text-slate-500">{i + 1}</td>
                    {COLUMNS.map((c) => {
                      const issue = pv?.issues.find((x) => x.field === c.key);
                      return (
                        <td key={c.key} className="td">
                          {c.key === 'route' ? (
                            <select className="field" value={String(r.route ?? '')} disabled={skipped}
                              onChange={(e) => setCell(i, 'route', e.target.value)}>
                              <option value="">—</option>
                              {routeCodes.map((x) => <option key={x} value={x}>{x}</option>)}
                            </select>
                          ) : (
                            <input
                              className={`field ${c.width} ${issue ? 'border-rose-300/60' : ''}`}
                              value={String((r as any)[c.key] ?? '')}
                              disabled={skipped}
                              aria-label={`${c.label} dòng ${i + 1}`}
                              onChange={(e) => setCell(i, c.key, e.target.value)}
                            />
                          )}
                          {issue && <div className="text-[11px] text-rose-200 mt-0.5">{issue.message}</div>}
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
          <button className="btn btn-sm" onClick={() => setRows((rs) => [...rs, { ...EMPTY, classCode: defaultClass?.code ?? '' }])}>
            Thêm dòng
          </button>
          {rows.length > 1 && (
            <button className="btn btn-sm" onClick={() => { setRows((rs) => rs.slice(0, -1)); setPreview(null); }}>
              Bớt dòng cuối
            </button>
          )}
          {/*
            * Còn dòng lỗi thì KHOÁ nút Thêm, để không có dòng nào âm thầm biến mất khỏi lô nhập.
            * Nhưng phải gỡ được trong một lần bấm: dán 40 dòng mà 2 dòng sai thì không thể bắt
            * người nhập tick tay từng dòng.
            */}
          {preview && (blocking > 0 ? (
            <button
              className="btn btn-sm"
              onClick={() => setSkipRows((s) => {
                const next = new Set(s);
                preview.forEach((r) => {
                  if (r.issues.some((i) => !i.message.includes('Chưa có target'))) next.add(r.row);
                });
                return next;
              })}
            >
              Bỏ qua {blocking} dòng lỗi
            </button>
          ) : (
            <Outcome tone="ok" mark="✓">Không còn lỗi chặn</Outcome>
          ))}
        </div>

        {preview?.some((r) => r.duplicates.length) && (
          <div className="surface-2 rounded-lg p-3">
            <div className="label">Có thể trùng hồ sơ đã có</div>
            <ul className="text-xs space-y-1 list-none p-0 m-0">
              {preview.filter((r) => r.duplicates.length).map((r) => (
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
          Mã học viên do máy chủ sinh, giữ nguyên khi chuyển lớp hay học lại. Lộ trình có target thì tính
          được kỳ vọng; thiếu target vẫn thêm được, chỉ là chưa kết luận được SOS.
          <br />
          Tuần MT ở đây chỉ là <strong>đề xuất</strong>: chỉ trở thành kế hoạch khi người có quyền chốt tuần
          thực hiện, nên nhập hàng loạt không thành đường vượt quyền lập kế hoạch.
        </SectionNote>
      </div>
    </Drawer>
  );
}
