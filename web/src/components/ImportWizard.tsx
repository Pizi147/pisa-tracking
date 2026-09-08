import { useMemo, useRef, useState } from 'react';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from './Toast.tsx';
import { Drawer } from './Drawer.tsx';
import { Empty, Field, Pill, SectionNote } from './ui.tsx';
import { fmtDate } from '../lib/format.ts';

type Step = 'file' | 'sheet' | 'mapping' | 'preview' | 'duplicates' | 'summary';

const STEP_LABEL: Record<Step, string> = {
  file: '1. Chọn tệp', sheet: '2. Chọn sheet', mapping: '3. Ghép cột',
  preview: '4. Kiểm tra & lỗi', duplicates: '5. Xử lý trùng', summary: '6. Kết quả',
};

/** Luồng import: chọn tệp → sheet → ghép cột → kiểm tra → xử lý trùng → xác nhận → tổng kết. */
export function ImportWizard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [step, setStep] = useState<Step>('file');
  const [parsed, setParsed] = useState<any>(null);
  const [sheetName, setSheetName] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<any>(null);
  const [decisions, setDecisions] = useState<Record<number, { decision: string; linkStudentId?: number | null }>>({});
  const [summary, setSummary] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  // Token cố định cho cả phiên: bấm nhiều lần cũng chỉ commit một lần.
  const tokenRef = useRef(`imp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);

  const sheet = useMemo(() => parsed?.sheets.find((s: any) => s.name === sheetName), [parsed, sheetName]);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.upload<any>('/import/parse', form);
      setParsed(res);
      setFileName(res.fileName);
      const first = res.sheets[0];
      setSheetName(first?.name ?? '');
      setMapping(res.suggestions.find((s: any) => s.sheet === first?.name)?.mapping ?? {});
      setStep(res.sheets.length > 1 ? 'sheet' : 'mapping');
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  const validate = async () => {
    setBusy(true);
    try {
      const res = await api.post<any>('/import/validate', { rows: sheet.rows, mapping });
      setValidation(res);
      const d: Record<number, any> = {};
      for (const r of res.rows) d[r.rowIndex] = { decision: r.decision, linkStudentId: r.linkStudentId };
      setDecisions(d);
      setStep('preview');
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  const commit = async () => {
    setBusy(true);
    try {
      const res = await api.post<any>('/import/commit', {
        token: tokenRef.current, fileName, rows: sheet.rows, mapping,
        decisions: Object.entries(decisions).map(([rowIndex, d]) => ({ rowIndex: Number(rowIndex), ...d })),
      });
      setSummary(res);
      setStep('summary');
      invalidate('/students'); invalidate('/dashboard'); invalidate('/classes');
      if (res.alreadyCommitted) toast.push('info', 'Phiên nhập này đã được ghi trước đó — không tạo dữ liệu trùng.');
      else toast.push('ok', `Đã nhập: tạo mới ${res.created}, liên kết ${res.linked}, bỏ qua ${res.skipped}.`);
    } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
    finally { setBusy(false); }
  };

  const duplicateRows = (validation?.rows ?? []).filter((r: any) => r.duplicates.length > 0 && !r.errors.length);
  const errorRows = (validation?.rows ?? []).filter((r: any) => r.errors.length > 0);
  const willCreate = Object.values(decisions).filter((d) => d.decision === 'create').length;
  const willLink = Object.values(decisions).filter((d) => d.decision === 'link').length;
  const willSkip = Object.values(decisions).filter((d) => d.decision === 'skip').length;

  return (
    <Drawer open onClose={onClose} width="max-w-5xl"
      title="Nhập học viên từ Excel/CSV"
      subtitle={Object.values(STEP_LABEL).join('  ›  ')}
      footer={
        step === 'summary'
          ? <button className="btn btn-primary" onClick={onDone}>Đóng và làm mới danh sách</button>
          : (
            <>
              <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
              {step === 'sheet' && <button className="btn btn-primary" onClick={() => setStep('mapping')}>Tiếp tục</button>}
              {step === 'mapping' && <button className="btn btn-primary" disabled={busy} onClick={validate}>Kiểm tra dữ liệu</button>}
              {step === 'preview' && (
                <button className="btn btn-primary" onClick={() => setStep(duplicateRows.length ? 'duplicates' : 'preview')}
                  disabled={busy}>
                  {duplicateRows.length ? `Xử lý ${duplicateRows.length} dòng trùng` : 'Tiếp tục'}
                </button>
              )}
              {(step === 'preview' && !duplicateRows.length) || step === 'duplicates' ? (
                <button className="btn btn-primary" disabled={busy} onClick={commit}>
                  {busy ? 'Đang nhập…' : `Xác nhận nhập (${willCreate} tạo mới, ${willLink} liên kết, ${willSkip} bỏ qua)`}
                </button>
              ) : null}
            </>
          )
      }>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {(Object.keys(STEP_LABEL) as Step[]).map((s) => (
            <Pill key={s} tone={step === s ? 'ok' : 'neutral'}>{STEP_LABEL[s]}</Pill>
          ))}
        </div>

        {step === 'file' && (
          <div className="space-y-4">
            <div className="card p-4">
              <Field label="Chọn tệp .xlsx hoặc .csv" required>
                <input type="file" accept=".xlsx,.xls,.csv" className="field" disabled={busy}
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </Field>
              {busy && <div className="text-xs text-slate-400 mt-2">Đang đọc tệp…</div>}
            </div>
            <div className="card p-4">
              <div className="label">Tệp mẫu</div>
              <p className="text-xs text-slate-400 mb-2">
                Tải tệp mẫu để đúng định dạng, hoặc tệp mẫu có lỗi cố ý để thử luồng báo lỗi.
              </p>
              <div className="flex gap-2">
                <a className="btn btn-sm" href="/api/import/sample?kind=clean">Tải tệp mẫu chuẩn</a>
                <a className="btn btn-sm" href="/api/import/sample?kind=errors">Tải tệp mẫu có lỗi</a>
              </div>
            </div>
            <SectionNote>
              Cột tối thiểu: <strong>Lớp, Họ tên, Ngày sinh</strong>. Tuỳ chọn: Target, Tư vấn viên, Skill đăng ký.
              Ngày sinh nhập dạng dd/mm/yyyy; hệ thống không tự đoán các định dạng mơ hồ.
            </SectionNote>
          </div>
        )}

        {step === 'sheet' && (
          <div className="space-y-2">
            <div className="label">Chọn sheet cần nhập</div>
            {parsed.sheets.map((s: any) => (
              <button key={s.name}
                className={`w-full text-left card p-3 hover:border-teal-500/40 ${sheetName === s.name ? 'border-teal-500/60' : ''}`}
                onClick={() => {
                  setSheetName(s.name);
                  setMapping(parsed.suggestions.find((x: any) => x.sheet === s.name)?.mapping ?? {});
                }}>
                <div className="text-slate-100">{s.name}</div>
                <div className="text-xs text-slate-500">{s.rowCount} dòng · {s.headers.length} cột</div>
              </button>
            ))}
          </div>
        )}

        {step === 'mapping' && sheet && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              Sheet <strong className="text-slate-200">{sheet.name}</strong> · {sheet.rowCount} dòng.
              Hệ thống đã đoán sẵn cột, bạn kiểm tra và sửa nếu cần.
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {parsed.fields.map((f: any) => (
                <Field key={f.key} label={f.label} required={f.required} hint={f.hint}>
                  <select className="field" value={mapping[f.key] ?? ''} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}>
                    <option value="">— Không dùng —</option>
                    {sheet.headers.map((h: string) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </Field>
              ))}
            </div>
            <div className="card p-3 overflow-x-auto">
              <div className="label mb-2">Xem trước 5 dòng đầu</div>
              <table className="w-full text-xs">
                <thead><tr>{sheet.headers.map((h: string) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {sheet.rows.slice(0, 5).map((r: any, i: number) => (
                    <tr key={i}>{sheet.headers.map((h: string) => <td key={h} className="td text-slate-300">{String(r[h] ?? '')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'preview' && validation && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="card p-3"><div className="label">Tổng dòng</div><div className="text-xl text-slate-100">{validation.summary.total}</div></div>
              <div className="card p-3"><div className="label">Hợp lệ</div><div className="text-xl text-teal-300">{validation.summary.valid}</div></div>
              <div className="card p-3"><div className="label">Có lỗi</div><div className="text-xl text-red-300">{validation.summary.errors}</div></div>
              <div className="card p-3"><div className="label">Nghi trùng</div><div className="text-xl text-amber-300">{validation.summary.duplicates}</div></div>
            </div>

            {errorRows.length > 0 && (
              <div className="card p-0 overflow-x-auto">
                <div className="px-4 py-2 border-b text-sm text-red-300" style={{ borderColor: 'var(--line)' }}>
                  Dòng có lỗi — các dòng này sẽ bị bỏ qua
                </div>
                <table className="w-full text-sm">
                  <thead><tr><th className="th">Dòng</th><th className="th">Họ tên</th><th className="th">Lớp</th><th className="th">Lỗi</th></tr></thead>
                  <tbody>
                    {errorRows.map((r: any) => (
                      <tr key={r.rowIndex} className="row-hover">
                        <td className="td tabular-nums">{r.rowIndex + 2}</td>
                        <td className="td text-slate-300">{r.value.fullName || <span className="text-slate-600 italic">trống</span>}</td>
                        <td className="td text-slate-400">{r.value.className}</td>
                        <td className="td text-xs text-red-300">{r.errors.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="card p-0 overflow-x-auto">
              <div className="px-4 py-2 border-b text-sm text-slate-200" style={{ borderColor: 'var(--line)' }}>Dòng hợp lệ</div>
              <table className="w-full text-sm">
                <thead><tr><th className="th">Dòng</th><th className="th">Họ tên</th><th className="th">Ngày sinh</th><th className="th">Lớp</th><th className="th">Target</th><th className="th">Skill</th><th className="th">Ghi chú</th></tr></thead>
                <tbody>
                  {validation.rows.filter((r: any) => !r.errors.length).map((r: any) => (
                    <tr key={r.rowIndex} className="row-hover">
                      <td className="td tabular-nums">{r.rowIndex + 2}</td>
                      <td className="td text-slate-100">{r.value.fullName}</td>
                      <td className="td text-slate-300">{fmtDate(r.value.dob)}</td>
                      <td className="td text-slate-300">{r.value.className}</td>
                      <td className="td tabular-nums">{r.value.targetBand ?? '—'}</td>
                      <td className="td text-xs text-slate-400">{r.value.skills ? r.value.skills.join(', ') : 'Tất cả skill của lớp'}</td>
                      <td className="td text-xs">
                        {r.duplicates.length > 0 && <Pill tone="warn">Nghi trùng {r.duplicates.length} hồ sơ</Pill>}
                        {r.warnings.map((w: string, i: number) => <div key={i} className="text-amber-300/80">{w}</div>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SectionNote>
              Ngày sinh hiển thị dd/mm/yyyy nhưng được lưu ở định dạng ngày chuẩn. Dòng lỗi được bỏ qua rõ ràng, không nhập âm thầm.
            </SectionNote>
          </div>
        )}

        {step === 'duplicates' && (
          <div className="space-y-3">
            <div className="card p-3 text-xs text-slate-400">
              Hệ thống chỉ <strong className="text-slate-200">gợi ý</strong> các hồ sơ giống nhau, không bao giờ tự gộp.
              Bạn quyết định từng dòng: tạo học viên mới, liên kết vào hồ sơ đã có (chỉ thêm lần học mới, không ghi đè lịch sử),
              hoặc bỏ qua.
            </div>
            {duplicateRows.map((r: any) => (
              <div key={r.rowIndex} className="card p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="text-slate-100 font-medium">{r.value.fullName}</span>
                    <span className="text-xs text-slate-500 ml-2">Dòng {r.rowIndex + 2} · {fmtDate(r.value.dob)} · lớp {r.value.className}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mb-2">Hồ sơ đã có trùng khớp:</div>
                <ul className="space-y-1 mb-3">
                  {r.duplicates.map((d: any) => (
                    <li key={d.studentId} className="text-sm flex items-center gap-2">
                      <input type="radio" name={`dup-${r.rowIndex}`}
                        checked={decisions[r.rowIndex]?.decision === 'link' && decisions[r.rowIndex]?.linkStudentId === d.studentId}
                        onChange={() => setDecisions((s) => ({ ...s, [r.rowIndex]: { decision: 'link', linkStudentId: d.studentId } }))} />
                      <span className="text-slate-200">{d.fullName}</span>
                      <span className="text-xs text-slate-500">{d.studentCode} · {fmtDate(d.dob)}</span>
                      <span className="text-[11px] text-amber-300">Khớp: {d.matchOn.join(', ')}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-sm text-slate-300">
                    <input type="radio" name={`dup-${r.rowIndex}`} checked={decisions[r.rowIndex]?.decision === 'create'}
                      onChange={() => setDecisions((s) => ({ ...s, [r.rowIndex]: { decision: 'create', linkStudentId: null } }))} />
                    Tạo học viên riêng (là người khác)
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-slate-300">
                    <input type="radio" name={`dup-${r.rowIndex}`} checked={decisions[r.rowIndex]?.decision === 'skip'}
                      onChange={() => setDecisions((s) => ({ ...s, [r.rowIndex]: { decision: 'skip', linkStudentId: null } }))} />
                    Bỏ qua dòng này
                  </label>
                </div>
              </div>
            ))}
            {duplicateRows.length === 0 && <Empty title="Không có dòng nào nghi trùng" />}
          </div>
        )}

        {step === 'summary' && summary && (
          <div className="space-y-3">
            {summary.alreadyCommitted && (
              <div className="card p-3 border-amber-500/30 text-amber-300 text-sm">
                Phiên nhập này đã được ghi trước đó. Kết quả hiển thị lại từ lần ghi đầu tiên — không tạo dữ liệu trùng.
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div className="card p-3"><div className="label">Tạo mới</div><div className="text-2xl text-teal-300">{summary.created}</div></div>
              <div className="card p-3"><div className="label">Liên kết hồ sơ có sẵn</div><div className="text-2xl text-sky-300">{summary.linked}</div></div>
              <div className="card p-3"><div className="label">Bỏ qua</div><div className="text-2xl text-slate-300">{summary.skipped}</div></div>
            </div>
            {summary.createdRows?.length > 0 && (
              <div className="card p-0">
                <div className="px-4 py-2 border-b text-sm text-slate-200" style={{ borderColor: 'var(--line)' }}>Học viên được tạo</div>
                <table className="w-full text-sm">
                  <thead><tr><th className="th">Mã HV</th><th className="th">Họ tên</th></tr></thead>
                  <tbody>{summary.createdRows.map((r: any) => (
                    <tr key={r.studentId} className="row-hover"><td className="td text-teal-300">{r.studentCode}</td><td className="td text-slate-200">{r.name}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {summary.skippedRows?.length > 0 && (
              <div className="card p-0">
                <div className="px-4 py-2 border-b text-sm text-slate-200" style={{ borderColor: 'var(--line)' }}>Dòng bị bỏ qua</div>
                <table className="w-full text-sm">
                  <thead><tr><th className="th">Dòng</th><th className="th">Họ tên</th><th className="th">Lý do</th></tr></thead>
                  <tbody>{summary.skippedRows.map((r: any, i: number) => (
                    <tr key={i} className="row-hover"><td className="td tabular-nums">{r.rowIndex + 2}</td>
                      <td className="td text-slate-300">{r.name || '—'}</td><td className="td text-xs text-slate-400">{r.reason}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
