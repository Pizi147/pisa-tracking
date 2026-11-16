import { Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
import { lazyTai } from '../lib/taiLaiManh.ts';
import { t } from '@shared/i18n/index.ts';

/*
 * TD-NGUOI-2: HỘP / PANEL MỞ BẰNG THAO TÁC nằm ở mảnh riêng — trang lớp / hồ sơ HV không phải tải chúng trước khi hiện (đo 17/11: ~40 % mảnh JS của trang).
 * Nạp sẵn ngầm khi mạng yên (`napHopSan`, cùng lúc nạp sẵn các trang — App.tsx) nên lần bấm đầu thường đã có mảnh; chưa có thì `ChoHop`.
 * Nơi dùng giữ nguyên JSX + props: `const X = lazyHop(() => import('./X.tsx').then((m) => m.X))`.
 */
const cho: (() => Promise<unknown>)[] = [];
let daYen = false;

/** Mạng đã yên (App): nạp mọi hộp đã đăng ký; hộp đăng ký sau đó (mảnh trang nạp sẵn) nạp ngay. */
export function napHopSan(): void {
  daYen = true;
  cho.splice(0).forEach((nap) => { nap().catch(() => { /* lỗi mảnh: `lazyTai` lo khi mở thật */ }); });
}

/** `dong`: hộp dựng sẵn ở trạng thái đóng (mặc định `open === false`; vd StudentManagePanel `viec == null`). */
export function lazyHop<C extends ComponentType<any>>(nap: () => Promise<C>, dong: (p: Record<string, unknown>) => boolean = (p) => p.open === false): C {
  const Hop = lazyTai(() => nap().then((c) => ({ default: c as ComponentType<Record<string, unknown>> })));
  if (daYen) nap().catch(() => {}); else cho.push(nap);
  function VoHop(props: Record<string, unknown>) {
    /* Hộp dựng sẵn ở trạng thái đóng (QuickReport `open`…): chưa mở lần nào thì không tải; đã mở thì giữ như cũ (state của hộp còn nguyên khi đóng). */
    const daMo = useRef(false);
    if (dong(props) && !daMo.current) return null;
    daMo.current = true;
    return <Suspense fallback={<ChoHop />}><Hop {...props} /></Suspense>;
  }
  return VoHop as unknown as C;
}

/** Đang tải mảnh hộp: lớp phủ trong suốt chặn bấm đúp; quá 300 ms mới hiện thẻ "Đang tải…" (mạng nhanh không nháy). */
function ChoHop() {
  const [hien, setHien] = useState(false);
  useEffect(() => { const h = setTimeout(() => setHien(true), 300); return () => clearTimeout(h); }, []);
  return (
    <div className="fixed inset-0 z-[80] cursor-progress" role="status" aria-busy="true" aria-label={t('Đang tải')}>
      {hien && <div className="absolute inset-0 flex items-center justify-center">
        <div className="card px-4 py-3 text-sm text-slate-300">{t('Đang tải…')}</div>
      </div>}
    </div>
  );
}
