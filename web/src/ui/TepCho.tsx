import { useRef, useState } from 'react';
import { ApiError, api } from '../lib/api.ts';
import { ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_BYTES, LO_GHI_VI_PHAM, chiaLo, laLienKet, tenAnhDan } from '@shared/domain/index.ts';

/**
 * TỆP CHỜ TRONG FORM (PR-LUI-a1) — bằng chứng chọn NGAY khi ghi (Ghi vi phạm, Tạo Case), chưa tải lên: tệp chỉ đi khi bấm Lưu,
 * SAU khi bản ghi đã có id (`taiTepCho`) — luật (a) của `attachments.ts` (lỗi tải tệp không làm mất nội dung) giữ nguyên.
 * `✕` bỏ khỏi danh sách (chưa tải nên không hỏi). Tệp sai loại / quá lớn báo ngay tại dòng, như `BangChung`.
 */
export type TepChoMuc = (
  | { key: number; kind: 'file'; file: File }
  | { key: number; kind: 'link'; url: string; ten: string }
) & {
  /** Lỗi tại dòng: chọn sai (trước khi Lưu) hoặc tải lỗi (sau khi Lưu, có `Thử lại`). */
  loi?: string;
  /** Lỗi do MÁY CHỦ / mạng sau khi Lưu (khác lỗi chọn tệp): dòng này có `Thử lại`. */
  daGui?: boolean;
  /** Đã tải xong — không tải lại khi `Thử lại` các dòng khác. */
  xong?: boolean;
  /** Id dòng tệp ĐÃ tải lên bản ghi đầu: thử lại chỉ còn bước chép sang bản ghi khác (không tải hai lần). */
  tuId?: number;
};

const ACCEPT = ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(',');
export const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1).replace('.', ',')} MB`);

/** Lỗi chọn tệp xảy ra ở máy người dùng (cùng luật `BangChung`): loại tệp, 4 MB. */
function loiChonTep(file: File): string | undefined {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (!ATTACHMENT_EXTENSIONS.includes(ext)) return `Không nhận loại tệp này. Chỉ nhận: ${ATTACHMENT_EXTENSIONS.join(', ')}.`;
  if (file.size > ATTACHMENT_MAX_BYTES) return 'Tệp quá lớn: tối đa 4 MB.';
  return undefined;
}

const tenHienThi = (m: TepChoMuc) => (m.kind === 'file' ? m.file.name : m.ten || m.url);
const tenMien = (url: string) => { try { return new URL(url).host; } catch { return url; } };

export function TepCho({ value, onChange, khoa, onThuLai }: {
  value: TepChoMuc[]; onChange: (v: TepChoMuc[]) => void;
  /** Đang lưu / đã khoá: ẩn nút thêm và ✕. */
  khoa?: boolean;
  /** Có thì dòng lỗi (sau Lưu) hiện `Thử lại`; bấm → nơi gọi tải lại các dòng chưa xong. */
  onThuLai?: () => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [ten, setTen] = useState('');
  const [loiLink, setLoiLink] = useState<string | null>(null);
  const [keo, setKeo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const seq = useRef(Math.max(0, ...value.map((v) => v.key)));

  const them = (files: Iterable<File> | null) => {
    if (!files) return;
    const moi: TepChoMuc[] = Array.from(files).map((file) => ({ key: (seq.current += 1), kind: 'file', file, loi: loiChonTep(file) }));
    if (moi.length) onChange([...value, ...moi]);
    if (fileRef.current) fileRef.current.value = '';
  };
  const bo = (key: number) => onChange(value.filter((v) => v.key !== key));

  const luuLink = () => {
    const u = url.trim();
    if (!laLienKet(u)) { setLoiLink('Cần địa chỉ đầy đủ, bắt đầu bằng http:// hoặc https://'); return; }
    onChange([...value, { key: (seq.current += 1), kind: 'link', url: u, ten: ten.trim() }]);
    setUrl(''); setTen(''); setLinkOpen(false); setLoiLink(null);
  };

  /** Ctrl+V: ảnh dán vào khối này thành tệp (đặt tên có ngày giờ); chữ là liên kết thì mở ô liên kết, điền sẵn. */
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (khoa || (e.target as HTMLElement).closest('input, textarea')) return;
    const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'))
      .map((f) => (!f.name || f.name === 'image.png' ? new File([f], tenAnhDan(new Date(), f.type), { type: f.type }) : f));
    if (files.length) { e.preventDefault(); them(files); return; }
    const text = e.clipboardData.getData('text/plain');
    if (text && laLienKet(text)) { e.preventDefault(); setLinkOpen(true); setUrl(text.trim()); }
  };

  return (
    <div
      className="rounded-lg border border-dashed px-2.5 py-2" tabIndex={0} aria-label="Bằng chứng — dán ảnh, kéo thả tệp" data-tep-cho
      style={{ borderColor: keo ? 'var(--line-strong)' : 'var(--line)' }}
      onPaste={onPaste}
      onDragOver={(e) => { if (khoa) return; e.preventDefault(); setKeo(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeo(false); }}
      onDrop={(e) => { if (khoa) return; e.preventDefault(); setKeo(false); them(e.dataTransfer.files); }}
    >
      {value.length > 0 && (
        <ul className="m-0 list-none space-y-1.5 p-0">
          {value.map((m) => (
            <li key={m.key} className="text-xs text-slate-300" data-tep-state={m.xong ? 'xong' : m.loi ? 'loi' : 'cho'}>
              <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                <span aria-hidden>{m.kind === 'file' ? '📎' : '🔗'}</span>
                <span className="min-w-0 break-all">{tenHienThi(m)}</span>
                <span className="text-slate-500">{m.kind === 'file' ? fmtSize(m.file.size) : tenMien(m.url)}</span>
                {m.xong && <span className="text-ok">Đã tải</span>}
                {m.loi && <span className="text-bad" role="alert">{m.loi}</span>}
                {m.loi && m.daGui && onThuLai && <button type="button" className="btn btn-sm btn-ghost" onClick={onThuLai}>Thử lại</button>}
                {!khoa && !m.xong && (
                  <button type="button" className="appearance-none cursor-pointer border-0 bg-transparent p-0 text-slate-500 hover:text-bad max-sm:grid max-sm:min-h-[44px] max-sm:min-w-[44px] max-sm:place-items-center" aria-label={`Bỏ ${tenHienThi(m)}`} onClick={() => bo(m.key)}>✕</button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!khoa && (
        <div className={`flex flex-wrap items-center gap-1.5${value.length ? ' mt-2' : ''}`}>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => fileRef.current?.click()}>+ Đính kèm tệp</button>
          <button type="button" className="btn btn-sm btn-ghost" aria-expanded={linkOpen} onClick={() => setLinkOpen((o) => !o)}>+ Thêm liên kết</button>
          <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" aria-label="Bằng chứng — chọn tệp" onChange={(e) => them(e.target.files)} />
        </div>
      )}

      {!khoa && linkOpen && (
        <div className="mt-2 grid items-end gap-1.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
          <label className="block">
            <span className="block text-xs text-slate-500">Địa chỉ liên kết</span>
            <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
          </label>
          <label className="block">
            <span className="block text-xs text-slate-500">Tên hiển thị (không bắt buộc)</span>
            <input className="field" value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Ví dụ: Nhóm lớp" />
          </label>
          <span className="flex gap-1.5">
            <button type="button" className="btn btn-sm btn-primary" disabled={!url.trim()} onClick={luuLink}>Thêm</button>
            <button type="button" className="btn btn-sm" onClick={() => { setLinkOpen(false); setLoiLink(null); }}>Đóng</button>
          </span>
          {loiLink && <p className="m-0 text-xs text-bad sm:col-span-3" role="alert">{loiLink}</p>}
        </div>
      )}
    </div>
  );
}

const formTep = (ownerType: string, ownerId: number, file: File) => {
  const form = new FormData();
  form.append('ownerType', ownerType); form.append('ownerId', String(ownerId)); form.append('file', file);
  return form;
};

/**
 * Tải các mục chờ lên SAU KHI bản ghi đã có id. Tệp đi vào bản ghi đầu (`ownerIds[0]`), rồi `/attachments/chep` thêm DÒNG cho các bản ghi còn lại
 * (cùng một tệp trong kho, không tải N lần). Mục đã `xong` bỏ qua; mục lỗi giữ `loi` + `tuId` (nếu đã tải được) để thử lại đúng chỗ dở.
 * Trả danh sách mới — nơi gọi `onChange` lại. Mục lỗi chọn (loi trước khi Lưu) không được gửi: nơi gọi chặn Lưu khi còn mục như vậy.
 */
export async function taiTepCho(ds: TepChoMuc[], o: { ownerType: string; ownerIds: number[] }): Promise<TepChoMuc[]> {
  const [dau, ...con] = o.ownerIds;
  const ra: TepChoMuc[] = [];
  for (const m of ds) {
    if (m.xong) { ra.push(m); continue; }
    let tuId = m.tuId;
    try {
      if (tuId === undefined) {
        const row = m.kind === 'file'
          ? await api.upload<{ id: number }>('/attachments/file', formTep(o.ownerType, dau, m.file))
          : await api.post<{ id: number }>('/attachments/link', { ownerType: o.ownerType, ownerId: dau, url: m.url, displayName: m.ten || null });
        tuId = row.id;
      }
      /* Chép theo lô (máy chủ nhận ≤ LO_GHI_VI_PHAM bản ghi mỗi request, và bỏ qua bản ghi đã có → thử lại sau lỗi giữa chừng không nhân đôi). */
      for (const lo of chiaLo(con, LO_GHI_VI_PHAM)) await api.post('/attachments/chep', { tuId, ownerType: o.ownerType, ownerIds: lo });
      ra.push({ ...m, xong: true, daGui: undefined, loi: undefined, tuId });
    } catch (e) {
      ra.push({ ...m, daGui: true, tuId, loi: e instanceof ApiError ? e.message : 'Không tải được tệp — kiểm tra kết nối rồi thử lại.' });
    }
  }
  return ra;
}
