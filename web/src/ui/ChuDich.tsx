/**
 * P14 DICH (N19, spec 3.11): chữ GV nhập + nút "Dịch" khi ngôn ngữ chữ ≠ ngôn ngữ giao diện (đoán ở trình duyệt, không gọi AI).
 * Chỉ gửi (bảng, id, cột, đích) — máy chủ tự đọc chữ và kiểm quyền. Không đổi chữ gốc: bản dịch chỉ hiện tại chỗ, kèm "Xem bản gốc".
 * Lỗi / hết lượt → giữ bản gốc + câu lỗi + "Thử lại". Máy chủ tắt dịch (`session.dichBat`) → chỉ in chữ, không nút.
 * R1-DICH-2: đổi nguồn / chữ → đặt lại trạng thái, phản hồi về muộn bị bỏ; máy chủ trả `gocBam` — lệch chữ đang thấy thì không gắn bản dịch.
 */
import { useEffect, useRef, useState } from 'react';
import { canDich } from '@shared/domain/index.ts';
import { NGON_NGU, dichDu, t } from '@shared/i18n/index.ts';
import { api } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';

export type NguonDich = { bang: string; id: number; cot: string; kyNang?: string };

/** Bản dịch đã có trong phiên trang — khoá gồm cả chữ gốc: sửa chữ thì dịch lại. */
const daDich = new Map<string, string>();
const khoaCua = (n: NguonDich, chu: string) => JSON.stringify([n.bang, n.id, n.cot, n.kyNang ?? '', NGON_NGU, chu]);

/** Băm như máy chủ (`dich.ts`, `gocBam`): sha256 của chữ đã cắt khoảng trắng hai đầu, 16 ký tự hex đầu. */
async function bamChu(chu: string): Promise<string> {
  if (!crypto.subtle) return '';   // http qua IP LAN (không phải HTTPS / localhost): không băm được → bỏ bước so
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chu)));
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/* Vùng bấm ~44 px bằng `::after` (mẫu `DauTrangLop`) — không giãn dòng chữ đang đọc. */
const NUT = "link relative ml-1.5 appearance-none border-0 bg-transparent p-0 text-xs after:absolute after:-inset-x-2 after:-inset-y-3.5 after:content-['']";

/** `anGoc`: chỗ đã có chữ gốc ngay cạnh (ô nhập) — chỉ in nút, và bản dịch khi đã dịch. */
export function ChuDich({ chu, nguon, anGoc = false }: { chu: string | null | undefined; nguon: NguonDich | null | undefined; anGoc?: boolean }) {
  const { session } = useSession();
  const goc = chu ?? '';
  const khoa = nguon ? khoaCua(nguon, goc) : '';
  const [xemDich, setXemDich] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  /* Đổi Case / học viên / chữ trong cùng chỗ → không mang spinner, lỗi, bản dịch của chữ trước sang. */
  const khoaHienTai = useRef(khoa);
  useEffect(() => { khoaHienTai.current = khoa; setXemDich(false); setDang(false); setLoi(null); }, [khoa]);

  /* DON-CHU: chữ hệ thống sinh đã lưu (mô tả PA quy chế…) từ điển dịch trọn câu → in bản dịch, không cần nút Dịch. */
  const tuDien = dichDu(goc);
  if (tuDien !== goc || !nguon || !session?.dichBat || !canDich(goc, NGON_NGU)) return anGoc ? null : <>{tuDien}</>;
  const ban = daDich.get(khoa);

  const goi = async () => {
    if (ban) { setXemDich(true); return; }
    const k = khoa;
    setDang(true); setLoi(null);
    try {
      const [r, bam] = await Promise.all([api.post<{ banDich: string; gocBam: string }>('/dich', { ...nguon, den: NGON_NGU }), bamChu(goc.trim())]);
      if (khoaHienTai.current !== k) return;   // về muộn: chỗ này đã sang chữ khác
      if (bam && r.gocBam !== bam) { setLoi(t('Nội dung vừa đổi — tải lại trang để dịch.')); return; }
      daDich.set(k, r.banDich);
      setXemDich(true);
    } catch (e) {
      if (khoaHienTai.current === k) setLoi((e as Error).message || t('Chưa dịch được. Bản gốc vẫn giữ — thử lại sau.'));
    } finally { if (khoaHienTai.current === k) setDang(false); }
  };

  const hienDich = xemDich && !!ban;
  /* Lệch chữ: gọi lại cùng nguồn vẫn lệch tới khi trang có chữ mới → nói bước tiếp, không đưa nút lặp. */
  const lech = loi === t('Nội dung vừa đổi — tải lại trang để dịch.');
  return (
    <>
      {(!anGoc || hienDich) && <span lang={hienDich ? NGON_NGU : undefined} title={hienDich ? t('Bản dịch tự động') : undefined}>{hienDich ? ban : goc}</span>}
      {/* MỘT nút đổi nhãn qua các trạng thái — người dùng bàn phím không mất chỗ đứng (focus) khi bấm. */}
      <span aria-live="polite" className={loi && !dang ? 'mt-1 block text-xs' : 'whitespace-nowrap'}>
        {loi && !dang && !hienDich && <span role="alert" className="text-bad">{loi}</span>}
        {!lech && <button type="button" className={NUT} aria-disabled={dang || undefined} aria-busy={dang || undefined}
          onClick={dang ? undefined : hienDich ? () => setXemDich(false) : goi}>
          {hienDich ? t('Xem bản gốc') : dang ? t('Đang dịch…') : loi ? t('Thử lại') : t('Dịch')}
        </button>}
      </span>
    </>
  );
}
