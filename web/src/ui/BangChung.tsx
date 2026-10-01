import { useRef, useState } from 'react';
import { ApiError, api, invalidate } from '../lib/api.ts';
import { useApi } from '../lib/useApi.ts';
import { fmtDate } from '../lib/format.ts';
import { ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_BYTES, CHU_KHOI_BANG_CHUNG, laLienKet, tenAnhDan } from '@shared/domain/index.ts';

type Row = {
  id: number; kind: 'file' | 'link'; displayName: string; href: string;
  sizeBytes: number | null; uploadedByName: string | null; createdAt: string;
};

/** Một lần tải tệp ĐANG CHỜ hoặc BỊ LỖI. Giữ cả tệp để bấm "Thử lại" mà không phải chọn lại. */
type Upload = { key: number; file: File; state: 'uploading' | 'error'; message?: string };

const fmtSize = (n: number | null) => (n === null ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`);
const ACCEPT = ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(',');

/**
 * KHỐI "BẰNG CHỨNG" DÙNG CHUNG (PR-N N6, thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md §4.5) — một khối cho mọi chỗ cần tệp hoặc
 * liên kết: Case học thuật, phương án, và (PR-J) vi phạm, biện pháp xử lý.
 *
 *   + Đính kèm tệp   |   + Thêm liên kết   →   danh sách: tên đọc được · người tải · ngày
 *
 * BA LUẬT (đặc tả §4.5):
 *   1. LỖI TẢI TỆP KHÔNG LÀM MẤT NỘI DUNG ĐANG NHẬP. Khối này chỉ giữ trạng thái CỦA MÌNH và tải tệp bằng một request
 *      riêng — không nằm trong form nào, không gửi kèm ô nào, không làm cha vẽ lại. Lỗi hiện ngay tại dòng tệp đó, kèm
 *      "Thử lại"; mô tả người dùng đang gõ ở ô bên cạnh còn nguyên.
 *   2. Quyền xem tệp là quyền xem bản ghi chủ — máy chủ kiểm ở mọi đường; nút ở đây chỉ ẩn cho gọn mắt.
 *   3. Gỡ tệp là hành động có xác nhận và có audit, không phải một dấu X im lặng.
 */
export function BangChung({ ownerType, ownerId, canEdit, tieuDe = 'Bằng chứng', onChanged }: {
  ownerType: 'sos_case' | 'case_intervention' | 'violation' | 'discipline_measure' | 'sos_coordination_action' | 'unit_report';
  ownerId: number;
  /** Được thêm/gỡ không (máy chủ vẫn kiểm lại). */
  canEdit: boolean;
  /** Rỗng = KHÔNG vẽ dòng tiêu đề (nơi cha đã có nhãn "Bằng chứng (n)" — PR-HV). */
  tieuDe?: string;
  /** Gọi sau khi thêm/gỡ thành công — nơi cha cập nhật số đếm của mình (PR-HV). */
  onChanged?: () => void;
}) {
  const { data, loading, error, reload } = useApi<{ rows: Row[] }>(
    `/attachments?ownerType=${ownerType}&ownerId=${ownerId}`, [ownerType, ownerId],
  );
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const patchUpload = (key: number, p: Partial<Upload>) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...p } : u)));

  const send = async (key: number, file: File) => {
    patchUpload(key, { state: 'uploading', message: undefined });
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
    /* Báo lỗi SỚM ở máy người dùng cho hai lỗi chắc chắn — khỏi gửi cả tệp rồi mới bị từ chối. */
    if (!ATTACHMENT_EXTENSIONS.includes(ext)) {
      patchUpload(key, { state: 'error', message: `Không nhận loại tệp này. Chỉ nhận: ${ATTACHMENT_EXTENSIONS.join(', ')}.` });
      return;
    }
    if (file.size > ATTACHMENT_MAX_BYTES) { patchUpload(key, { state: 'error', message: 'Tệp quá lớn: tối đa 4 MB.' }); return; }
    try {
      const form = new FormData();
      form.append('ownerType', ownerType);
      form.append('ownerId', String(ownerId));
      form.append('file', file);
      await api.upload('/attachments/file', form);
      setUploads((list) => list.filter((u) => u.key !== key));
      invalidate('/attachments');
      onChanged?.();
    } catch (e) {
      patchUpload(key, { state: 'error', message: e instanceof ApiError ? e.message : 'Không tải được tệp — kiểm tra kết nối rồi thử lại.' });
    }
  };

  /** Bắt đầu tải một tệp — dùng chung cho chọn tệp, kéo thả, và dán ảnh (Ctrl+V). */
  const upload1 = (file: File) => {
    const key = (seq.current += 1);
    setUploads((list) => [...list, { key, file, state: 'uploading' }]);
    void send(key, file);
  };

  /** Chọn tệp / kéo thả: tải MỌI tệp, không chỉ tệp đầu (G-9). */
  const pick = (files: FileList | Iterable<File> | null) => {
    if (!files) return;
    const list = Array.from(files);
    if (!list.length) return;
    for (const f of list) upload1(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  /** Ảnh dán từ clipboard không có tên rõ nghĩa ("image.png" mặc định của trình duyệt) → đặt tên có ngày giờ. */
  const renameIfPastedImage = (file: File): File => {
    if (!file.type.startsWith('image/')) return file;
    if (file.name && file.name !== 'image.png') return file;
    return new File([file], tenAnhDan(new Date(), file.type), { type: file.type });
  };

  /**
   * Q11: chỉ bắt Ctrl+V khi khối này (hay con của nó) đang được chọn — không bắt dán toàn trang, và không cướp việc dán
   * chữ bình thường vào hai ô "Địa chỉ liên kết" / "Tên hiển thị" bên dưới.
   */
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    if ((e.target as HTMLElement).closest('input, textarea')) return;
    const fromFiles = Array.from(e.clipboardData.files);
    const fromItems = fromFiles.length ? [] : Array.from(e.clipboardData.items)
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter((f): f is File => !!f);
    const files = fromFiles.length ? fromFiles : fromItems;
    if (files.length) {
      e.preventDefault();
      for (const f of files) upload1(renameIfPastedImage(f));
      return;
    }
    /* Không có tệp mà chữ dán là một liên kết → mở ô liên kết, điền sẵn (không tự lưu). Chữ thường → bỏ qua, không preventDefault. */
    const text = e.clipboardData.getData('text/plain');
    if (text && laLienKet(text)) {
      e.preventDefault();
      setLinkOpen(true);
      setUrl(text.trim());
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    setIsDragging(false);
    pick(e.dataTransfer.files);
  };

  const saveLink = async () => {
    setLinkBusy(true); setLinkError(null);
    try {
      await api.post('/attachments/link', { ownerType, ownerId, url: url.trim(), displayName: name.trim() || null });
      setUrl(''); setName(''); setLinkOpen(false);
      invalidate('/attachments');
      onChanged?.();
    } catch (e) {
      setLinkError(e instanceof ApiError ? e.message : 'Không lưu được liên kết — thử lại.');
    } finally { setLinkBusy(false); }
  };

  const remove = async (id: number) => {
    setRowError(null);
    try { await api.del(`/attachments/${id}`); setConfirmId(null); invalidate('/attachments'); onChanged?.(); }
    catch (e) { setRowError({ id, message: e instanceof ApiError ? e.message : 'Không gỡ được — thử lại.' }); }
  };

  const rows = data?.rows ?? [];

  return (
    <div
      className={`rounded-lg border px-2.5 py-2${canEdit ? ' border-dashed' : ''}`}
      style={{ borderColor: isDragging ? 'var(--line-strong)' : 'var(--line)' }}
      data-bang-chung={`${ownerType}:${ownerId}`}
      tabIndex={0}
      aria-label="Bằng chứng — dán ảnh, kéo thả tệp"
      onPaste={onPaste}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {tieuDe ? (
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            {tieuDe}{rows.length > 0 && <> · {rows.length}</>}
          </span>
        ) : <span />}
        {canEdit && (
          <span className="flex flex-wrap items-center gap-1.5">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => fileRef.current?.click()}>+ Đính kèm tệp</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLinkOpen((o) => !o)} aria-expanded={linkOpen}>+ Thêm liên kết</button>
            <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" aria-label={`${tieuDe || 'Bằng chứng'} — chọn tệp`}
              onChange={(e) => pick(e.target.files)} />
          </span>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-bad m-0 mt-1.5">
          Không tải được danh sách bằng chứng. <button type="button" className="link appearance-none bg-transparent border-0 p-0 cursor-pointer" onClick={reload}>Tải lại</button>
        </p>
      )}
      {loading && !data && <p className="text-[11px] text-slate-500 m-0 mt-1.5">Đang tải…</p>}
      {data && rows.length === 0 && uploads.length === 0 && !linkOpen && (
        <p className="text-[11px] text-slate-500 m-0 mt-1.5">
          {canEdit ? CHU_KHOI_BANG_CHUNG : 'Chưa có bằng chứng nào.'}
        </p>
      )}

      <ul className="list-none p-0 m-0 mt-1.5 space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="text-xs text-slate-300">
            <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
              <span aria-hidden>{r.kind === 'file' ? '📎' : '🔗'}</span>
              {r.kind === 'link'
                ? <a className="link" href={r.href} target="_blank" rel="noopener noreferrer">{r.displayName}</a>
                : <a className="link" href={r.href} download>{r.displayName}</a>}
              <span className="text-slate-500">
                {[r.kind === 'file' ? fmtSize(r.sizeBytes) : 'liên kết', r.uploadedByName, fmtDate(r.createdAt)].filter(Boolean).join(' · ')}
              </span>
              {canEdit && confirmId !== r.id && (
                <button type="button" className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-slate-500 hover:text-bad"
                  onClick={() => { setConfirmId(r.id); setRowError(null); }} aria-label={`Gỡ ${r.displayName}`}>Gỡ</button>
              )}
              {confirmId === r.id && (
                <span className="inline-flex items-center gap-1.5 text-soon">
                  Gỡ “{r.displayName}”? Việc này được ghi lại.
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => void remove(r.id)}>Gỡ</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmId(null)}>Không</button>
                </span>
              )}
            </span>
            {rowError?.id === r.id && <span className="block text-[11px] text-bad">{rowError.message}</span>}
          </li>
        ))}

        {/* MỖI LẦN TẢI MỘT DÒNG RIÊNG: đang tải / bị lỗi + Thử lại. Lỗi nằm ở ĐÂY, không ở đầu trang, không ở form. */}
        {uploads.map((u) => (
          <li key={u.key} className="text-xs" data-upload-state={u.state}>
            <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
              <span aria-hidden>📎</span>
              <span className="text-slate-300">{u.file.name}</span>
              <span className="text-slate-500">{fmtSize(u.file.size)}</span>
              {u.state === 'uploading' && <span className="text-doing">Đang tải…</span>}
              {u.state === 'error' && (
                <>
                  <span className="text-bad" role="alert">{u.message}</span>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => void send(u.key, u.file)}>Thử lại</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setUploads((l) => l.filter((x) => x.key !== u.key))}>Bỏ</button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>

      {canEdit && linkOpen && (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] items-end">
          <label className="block">
            <span className="text-[11px] text-slate-500 block">Địa chỉ liên kết</span>
            <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-500 block">Tên hiển thị (không bắt buộc)</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Bài viết tuần 3" />
          </label>
          <span className="flex gap-1.5">
            <button type="button" className="btn btn-sm btn-primary" disabled={linkBusy || !url.trim()} onClick={() => void saveLink()}>
              {linkBusy ? 'Đang lưu…' : 'Lưu'}
            </button>
            <button type="button" className="btn btn-sm" disabled={linkBusy} onClick={() => { setLinkOpen(false); setLinkError(null); }}>Đóng</button>
          </span>
          {linkError && <p className="text-[11px] text-bad m-0 sm:col-span-3" role="alert">{linkError}</p>}
        </div>
      )}
    </div>
  );
}
