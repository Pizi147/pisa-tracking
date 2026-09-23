import { rateView } from '@shared/domain/index.ts';
import { Info } from './ui.tsx';

/**
 * PHẦN TRĂM KHÔNG BAO GIỜ ĐỨNG MỘT MÌNH (HE_GIAO_DIEN §6, rule book §11).
 *
 *   <TyLe n={12} N={18} nhan="PA có cải thiện" />   →   12/18 PA có cải thiện (67%)
 *
 *   · `n/N` đứng trước, phần trăm trong ngoặc đứng sau.
 *   · N = 0 → `Chưa có dữ liệu`. KHÔNG bao giờ vẽ `0%`.
 *   · N < 5 → nhãn `mẫu nhỏ`.
 *   · Số vô lý (n > N, số âm) → báo `Số liệu không hợp lệ` thay vì vẽ một phần trăm nghe hợp lý.
 *
 * CỐ Ý KHÔNG NHẬN prop kiểu "tốt nhất" hay "xếp hạng": một tỷ lệ chỉ là một tỷ lệ, và xếp hạng
 * giáo viên/đơn vị bằng nó (nhất là với mẫu nhỏ) là điều rule book §11 cấm. Mẫu số theo đúng
 * định nghĩa ở `thiet-ke/HOP_DONG_SO_LIEU.md` — "Chưa đủ dữ liệu" không nằm trong N.
 */
export function TyLe({ n, N, nhan }: { n: number; N: number; nhan?: string }) {
  const v = rateView(n, N);
  if (v.kind === 'no-data') return <span className="text-xs text-slate-500">Chưa có dữ liệu</span>;
  if (v.kind === 'invalid') return <span className="text-xs text-bad">Số liệu không hợp lệ</span>;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
      <span>
        <span className="text-slate-100">{v.n}/{v.N}</span>
        {nhan && <span className="text-slate-300"> {nhan}</span>}
        <span className="text-slate-400"> ({v.percent}%)</span>
      </span>
      {v.smallSample && <Info title="Ít hơn 5 mẫu — chưa đủ để so sánh">mẫu nhỏ</Info>}
    </span>
  );
}
