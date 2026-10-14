import { Link } from 'react-router-dom';
import type { ViecTiepTheo } from '@shared/domain/index.ts';
import { QuaHan } from './Nhan.tsx';

/**
 * MỘT VIỆC Ở CỘT "VIỆC TIẾP THEO" (PR-UX3, B-2/B-3): chữ việc không khung, sau đó hoặc "⚠ quá hạn 3 ngày" đỏ (quá hạn; PR-N1 A6
 * luôn đủ chữ, không dạng gọn) hoặc "· hết T2 14/09" mờ. Câu đầy đủ ở tooltip. Không badge — việc là chữ, badge dành cho trạng thái.
 * `den` (B8): có thì chữ việc là liên kết tới nơi làm việc đó (Ngăn Case, lưới nhập điểm, tab Ý thức); hạn vẫn là chữ mờ bên cạnh.
 * `onBam`: thay cho `den` khi việc mở ngay tại chỗ (Cần hỗ trợ mở Ngăn Case không rời trang lớp).
 */
export function ViecTiep({ v, den, onBam }: { v: ViecTiepTheo; den?: string | null; onBam?: () => void }) {
  /*
   * PR-S4F #13: max-w-full — trong cột flex `items-start` (Theo dõi, Việc tiếp theo) phần tử rộng theo chữ nên chữ lấn lề ô.
   * PR-KHUNG G3: chữ chạy liền (khối thường, không flex, không cắt dòng) — chật thì xuống dòng, không mất chữ; cụm hạn
   * `nowrap` là chữ trong dòng nên chật thì cả cụm xuống dòng. Câu đủ vẫn ở title. Dấu cách THƯỜNG (không &nbsp;) giữa "⚠ quá hạn n ngày" và việc:
   * &nbsp; cấm ngắt dòng trước liên kết inline-block nên liên kết tràn ô ở 375 px (rà #235, đo bằng do-khung).
   */
  return (
    <span className="block max-w-full text-xs text-slate-200 sm:line-clamp-2" title={v.title}>
      {v.quaHanNgay !== null && <><span className="whitespace-nowrap"><QuaHan ngay={v.quaHanNgay} /></span>{' '}</>}
      <span className="break-words">
        {onBam ? <button type="button" className="link cursor-pointer border-0 bg-transparent p-0 text-left text-xs" onClick={onBam}>{giuMaTuan(v.viec)}</button>
          : den ? <Link to={den} className="link">{giuMaTuan(v.viec)}</Link> : giuMaTuan(v.viec)}
      </span>
      {v.quaHanNgay === null && v.han ? <span className="whitespace-nowrap text-slate-500">&nbsp;· {v.han}</span> : null}
    </span>
  );
}

/** CA2-8: mã tuần "W2 SEP" là một khối đọc — dấu cách không ngắt (U+00A0), không gãy "W2 / SEP". */
const giuMaTuan = (chu: string) => chu.replace(/\b(W\d) ([A-Z]{3})\b/g, '$1\u00a0$2');

/** Tối đa 2 việc, phần còn lại gom "+n việc" (tooltip liệt kê). */
export function DanhSachViecTiep({ viec, den }: { viec: readonly ViecTiepTheo[]; den?: (v: ViecTiepTheo) => string | null }) {
  if (viec.length === 0) return <span className="text-slate-600">—</span>;
  return (
    <span className="flex flex-col items-start gap-0.5">
      {viec.slice(0, 2).map((v) => <ViecTiep key={v.viec} v={v} den={den?.(v)} />)}
      {viec.length > 2 && (
        <span className="text-xs text-slate-400" title={viec.slice(2).map((v) => v.title).join(' · ')}>+{viec.length - 2} việc</span>
      )}
    </span>
  );
}
