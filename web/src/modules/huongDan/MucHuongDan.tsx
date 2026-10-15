import { useCallback, useId, useState } from 'react';
import { useSession } from '../../lib/session.tsx';
import { api } from '../../lib/api.ts';
import { ChuDam } from '../../ui/ui.tsx';
import { HUONG_DAN, vaiCoNoiDung, vaiHdCua, type ChiChoToi, type MucHd } from '@shared/huongDan/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Nút "Chỉ cho tôi" (mockup `.nut-chi`): viền nhấn, chữ nhấn; 44 px trên điện thoại. */
const NUT_CHI = 'inline-flex min-h-[44px] items-center rounded-[.4rem] border border-[color:var(--accent-line)] bg-transparent px-3 text-[12.5px] font-semibold text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] sm:min-h-[32px] print:hidden';

/** Một mục hướng dẫn: tên + khi nào + bước + Chỉ cho tôi. Gập / mở; in thì luôn mở (`print:block`). */
export function MucHuongDan({ muc, moSan = false, onChi }: { muc: MucHd; moSan?: boolean; onChi: (c: ChiChoToi) => void }) {
  const [mo, setMo] = useState(moSan);
  const id = useId();
  return (
    /* `data-muc`: kịch bản do-khung tìm mục theo id (không theo chữ — chạy được cả EN). */
    <div className="card flex flex-col gap-2.5 px-4 py-3.5 break-inside-avoid" data-muc={muc.id}>
      <button type="button" aria-expanded={mo} aria-controls={id} onClick={() => setMo(!mo)}
        className="flex min-h-[32px] w-full appearance-none flex-wrap items-center gap-x-2.5 gap-y-0.5 border-0 bg-transparent p-0 text-left cursor-pointer max-sm:min-h-[44px]">
        <span className="min-w-0 flex-1 text-[15px] font-bold text-slate-100">{t(muc.ten)}</span>
        {muc.khi && <span className="whitespace-nowrap text-xs text-slate-500">{t(muc.khi)}</span>}
        <svg aria-hidden viewBox="0 0 8 8" width="9" height="9" className={`shrink-0 text-slate-400 transition-transform print:hidden ${mo ? '-rotate-90' : 'rotate-90'}`}>
          <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id={id} className={`flex flex-col gap-2.5 ${mo ? '' : 'hidden print:flex'}`}>
        <ol className="m-0 flex flex-col gap-1 pl-5 text-[13.5px] leading-normal text-slate-300 [&_strong]:font-semibold [&_strong]:text-slate-100">
          {muc.buoc.map((b) => <li key={b}><ChuDam chu={t(b)} /></li>)}
        </ol>
        {muc.chi && <div><button type="button" className={`${NUT_CHI} max-sm:w-full max-sm:justify-center`} onClick={() => onChi(muc.chi!)}>{t('Chỉ cho tôi')}</button></div>}
      </div>
    </div>
  );
}

/** Vai đang đăng nhập (theo góc nhìn) → hướng dẫn có nội dung (HD-b lấp các vai còn lại; trước đó QL / TVV… đọc bản GV). */
export function useVaiHd() {
  const { session } = useSession();
  const cuaToi = vaiHdCua(session?.roles ?? []);
  return { cuaToi, coNoiDung: !!HUONG_DAN[cuaToi], macDinh: vaiCoNoiDung(cuaToi) };
}

/** Ghi "đã mở Hướng dẫn" một lần cho tài khoản (dải Mới dùng PISA? không hiện lại). Trả false khi lưu lỗi. */
export function useDaXemHd() {
  const { session, reload } = useSession();
  const chuaXem = !!session?.authenticated && session.daXemHuongDan === false;
  return {
    chuaXem,
    ghi: useCallback(async () => {
      try { await api.patch('/me/profile', { daXemHuongDan: true }); await reload(); return true; } catch { return false; }
    }, [reload]),
  };
}
