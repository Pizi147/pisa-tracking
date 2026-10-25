/**
 * P14 DICH (N19, spec 3.11): chữ GV nhập + nút "Dịch" khi ngôn ngữ chữ ≠ ngôn ngữ giao diện (đoán ở trình duyệt, không gọi AI).
 * Chỉ gửi (bảng, id, cột, đích) — máy chủ tự đọc chữ và kiểm quyền. Không đổi chữ gốc: bản dịch chỉ hiện tại chỗ, kèm "Xem bản gốc".
 * Lỗi / hết lượt → giữ bản gốc + câu lỗi + "Thử lại". Máy chủ tắt dịch (`session.dichBat`) → chỉ in chữ, không nút.
 */
import { useState } from 'react';
import { canDich } from '@shared/domain/index.ts';
import { NGON_NGU, t } from '@shared/i18n/index.ts';
import { api } from '../lib/api.ts';
import { useSession } from '../lib/session.tsx';

export type NguonDich = { bang: string; id: number; cot: string; kyNang?: string };

/** Bản dịch đã có trong phiên trang — khoá gồm cả chữ gốc: sửa chữ thì dịch lại. */
const daDich = new Map<string, string>();
const khoaCua = (n: NguonDich, chu: string) => JSON.stringify([n.bang, n.id, n.cot, n.kyNang ?? '', NGON_NGU, chu]);

const NUT = 'link ml-1.5 inline-flex min-h-[44px] appearance-none items-center border-0 bg-transparent p-0 align-baseline text-xs sm:min-h-0';

/** `anGoc`: chỗ đã có chữ gốc ngay cạnh (ô nhập) — chỉ in nút, và bản dịch khi đã dịch. */
export function ChuDich({ chu, nguon, anGoc = false }: { chu: string | null | undefined; nguon: NguonDich | null | undefined; anGoc?: boolean }) {
  const { session } = useSession();
  const goc = chu ?? '';
  const khoa = nguon ? khoaCua(nguon, goc) : '';
  const [xemDich, setXemDich] = useState(false);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [, veLai] = useState(0);

  if (!nguon || !session?.dichBat || !canDich(goc, NGON_NGU)) return anGoc ? null : <>{goc}</>;
  const ban = daDich.get(khoa);

  const goi = async () => {
    if (ban) { setXemDich(true); return; }
    setDang(true); setLoi(null);
    try {
      const r = await api.post<{ banDich: string }>('/dich', { ...nguon, den: NGON_NGU });
      daDich.set(khoa, r.banDich);
      setXemDich(true); veLai((x) => x + 1);
    } catch (e) {
      setLoi((e as Error).message || t('Chưa dịch được. Bản gốc vẫn giữ — thử lại sau.'));
    } finally { setDang(false); }
  };

  const hienDich = xemDich && !!ban;
  return (
    <>
      {(!anGoc || hienDich) && <span lang={hienDich ? NGON_NGU : undefined} title={hienDich ? t('Bản dịch tự động') : undefined}>{hienDich ? ban : goc}</span>}
      <span aria-live="polite" className="whitespace-nowrap">
        {hienDich ? (
          <button type="button" className={NUT} onClick={() => setXemDich(false)}>{t('Xem bản gốc')}</button>
        ) : dang ? (
          <button type="button" className={NUT} disabled aria-busy="true">{t('Đang dịch…')}</button>
        ) : loi ? (
          <>
            <span role="alert" className="ml-1.5 whitespace-normal text-xs text-bad">{loi}</span>
            <button type="button" className={NUT} onClick={goi}>{t('Thử lại')}</button>
          </>
        ) : (
          <button type="button" className={NUT} onClick={goi}>{t('Dịch')}</button>
        )}
      </span>
    </>
  );
}
