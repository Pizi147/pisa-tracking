import type { ReactNode } from 'react';
import { rateView } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * PHẦN TRĂM KHÔNG BAO GIỜ ĐỨNG MỘT MÌNH (HE_GIAO_DIEN §6, rule book §11).
 *
 *   <TyLe n={12} N={18} nhan="PA có cải thiện" />   →   **67 %** 12/18 PA có cải thiện
 *
 *   · NEN-V5 (C03): phần trăm TO đứng trước, `n/N` + đơn vị ngay sau (cùng dòng); `lon` = % cỡ 28 và n/N xuống dòng dưới (ô tóm tắt).
 *   · N = 0 → `Chưa có dữ liệu`. KHÔNG bao giờ vẽ `0%`.
 *   · N < 5: chỉ số và % (chủ SP 22/10 bỏ chữ "mẫu nhỏ"; cờ `smallSample` vẫn có).
 *   · Số vô lý (n > N, số âm) → báo `Số liệu không hợp lệ` thay vì vẽ một phần trăm nghe hợp lý.
 *
 * CỐ Ý KHÔNG NHẬN prop kiểu "tốt nhất" hay "xếp hạng": một tỷ lệ chỉ là một tỷ lệ, và xếp hạng
 * giáo viên/đơn vị bằng nó (nhất là với mẫu nhỏ) là điều rule book §11 cấm. Mẫu số theo đúng
 * định nghĩa ở `thiet-ke/HOP_DONG_SO_LIEU.md` — "Chưa đủ dữ liệu" không nằm trong N.
 */
export function TyLe({ n, N, nhan, soN, lon }: {
  n: number; N: number; nhan?: string;
  /** PR-Pb2-a: thay chữ số `n` bằng một nút số bấm được (`OSo`) — giá trị vẫn là `n`. */
  soN?: ReactNode;
  /** Ô tóm tắt: % cỡ 28, n/N dòng dưới. */
  lon?: boolean;
}) {
  const v = rateView(n, N);
  if (v.kind === 'no-data') return <span className="text-xs text-slate-500">{t('Chưa có dữ liệu')}</span>;
  if (v.kind === 'invalid') return <span className="text-xs text-bad">{t('Số liệu không hợp lệ')}</span>;
  return (
    <span className={`inline-flex flex-wrap items-baseline tabular-nums ${lon ? 'flex-col gap-0.5' : 'gap-x-1.5'}`}>
      <b className={`font-bold text-slate-100 ${lon ? 'text-2xl' : ''}`}>{v.percent} %</b>
      <span className={lon ? 'text-xs text-slate-500' : 'text-slate-400'}>
        {soN ?? v.n}/{v.N}{nhan && <> {nhan}</>}
      </span>
    </span>
  );
}
