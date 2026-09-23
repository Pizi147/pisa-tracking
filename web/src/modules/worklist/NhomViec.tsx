import { type ReactNode, useState } from 'react';
import { Link, type NavigateFunction } from 'react-router-dom';
import { Status } from '../../ui/ui.tsx';
import { type NhomViecXem } from '@shared/domain/index.ts';
import { DongViec, type WorkItem } from './WorkList.tsx';

/**
 * KHỐI NHÓM VIỆC — tách từ `ViecCuaToi.tsx` (PR-Ra) để dùng chung với Hỗ trợ học viên: bốn
 * nhóm cố định, mỗi nhóm gập/mở, nhóm có việc quá hạn tự mở sẵn. Tổng quan giữ đúng hành vi cũ
 * (`soHien = 5`); Hỗ trợ học viên gọi với `soHien = 10` và có thể ép mở hết khi đang lọc.
 */
export function NhomViec({ nhom, nhac, soHien, moHet, onOpen, nutPhu }: {
  nhom: NhomViecXem<WorkItem>[];
  nhac: { classId: number; text: string }[];
  soHien: number;
  /** Ép mở hết mọi nhóm — dùng khi đang lọc nhanh/loại việc, kết quả đã ít thì không cần gập nữa. */
  moHet?: boolean;
  onOpen: NavigateFunction | ((href: string) => void);
  /** Nút phụ đứng cạnh nhãn việc, ví dụ Nhắc/Duyệt (Hỗ trợ học viên). */
  nutPhu?: (it: WorkItem) => ReactNode;
}) {
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [them, setThem] = useState<Record<string, number>>({});
  return (
    <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
      {nhom.map((g) => {
        const dangMo = moHet || (mo[g.key] ?? g.moSan);
        const soHienNhom = soHien + (them[g.key] ?? 0);
        /* Nhóm có dòng "chờ bạn duyệt" (Q6) — nói thẳng ngay ở đầu nhóm, không bắt mở ra mới biết. */
        const choDuyet = g.items.filter((it) => it.duyet).length;
        return (
          <section key={g.key}>
            <button type="button" aria-expanded={dangMo} aria-controls={`nhom-${g.key}`}
              className="w-full appearance-none bg-transparent border-0 px-4 py-2.5 flex items-center gap-2 text-left cursor-pointer hover:bg-white/5"
              onClick={() => setMo((s) => ({ ...s, [g.key]: !dangMo }))}>
              <span className="text-slate-500" aria-hidden>{dangMo ? '▾' : '▸'}</span>
              <span className="text-sm font-semibold text-slate-100">{g.label}</span>
              <span className="tabular-nums text-xs text-slate-300 rounded-full px-1.5" style={{ background: 'var(--surface-2)' }}>{g.n}</span>
              {(g.quaHan > 0 || g.homNay > 0 || choDuyet > 0) && (
                <span className="text-[11px] text-slate-500">
                  {[g.quaHan ? `${g.quaHan} quá hạn` : null, g.homNay ? `${g.homNay} hạn hôm nay` : null,
                    choDuyet ? `${choDuyet} chờ bạn duyệt` : null].filter(Boolean).join(' · ')}
                </span>
              )}
            </button>
            {dangMo && g.key === 'y-thuc' && (
              <ul id={`nhom-${g.key}`} className="list-none m-0 p-0 pb-2">
                {nhac.map((l, i) => (
                  <li key={`${l.classId}-${i}`} className="px-4 py-1.5">
                    <Link to={`/hoc-vien/lop/${l.classId}`} className="block no-underline text-xs text-slate-300 leading-snug hover:text-slate-100">
                      <Status kind="idle">Nhắc</Status> {l.text}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {dangMo && g.key !== 'y-thuc' && (
              <>
                <ul id={`nhom-${g.key}`} className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
                  {g.items.slice(0, soHienNhom).map((it) => (
                    <li key={it.key}><DongViec it={it} onOpen={onOpen} nutPhu={nutPhu?.(it)} /></li>
                  ))}
                </ul>
                {g.items.length > soHienNhom && (
                  <div className="px-4 py-2">
                    <button type="button" className="btn btn-sm" onClick={() => setThem((s) => ({ ...s, [g.key]: (s[g.key] ?? 0) + soHien }))}>
                      Xem thêm {Math.min(soHien, g.items.length - soHienNhom)} việc
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
