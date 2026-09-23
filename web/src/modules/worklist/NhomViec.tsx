import { type ReactNode, useState } from 'react';
import { Link, type NavigateFunction } from 'react-router-dom';
import { Nhan } from '../../ui/Nhan.tsx';
import { KhoiNhom } from '../../ui/HangNhom.tsx';
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
        const phu = (g.quaHan > 0 || g.homNay > 0 || choDuyet > 0) ? (
          <span className="flex flex-wrap items-center gap-x-2">
            {g.quaHan > 0 && <span className="font-bold text-late">⚠ {g.quaHan} quá hạn</span>}
            {g.homNay > 0 && <span className="font-semibold text-soon">{g.homNay} hôm nay</span>}
            {choDuyet > 0 && <span>{choDuyet} chờ bạn duyệt</span>}
          </span>
        ) : null;
        return (
          <KhoiNhom key={g.key} id={`nhom-${g.key}`} mo={dangMo} onMo={() => setMo((s) => ({ ...s, [g.key]: !dangMo }))}
            nhan={g.label} tieuDe={g.label} dem={g.n} phu={phu}>
            {g.key === 'y-thuc' ? (
              <ul className="list-none m-0 p-0 pb-2">
                {nhac.map((l, i) => (
                  <li key={`${l.classId}-${i}`} className="py-1.5 pr-3">
                    <Link to={`/hoc-vien/lop/${l.classId}`} className="block no-underline text-xs text-slate-300 leading-snug hover:text-slate-100">
                      <Nhan tone="muted">Nhắc</Nhan> {l.text}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
                  {g.items.slice(0, soHienNhom).map((it) => (
                    <li key={it.key}><DongViec it={it} onOpen={onOpen} nutPhu={nutPhu?.(it)} /></li>
                  ))}
                </ul>
                {g.items.length > soHienNhom && (
                  <div className="py-2 pr-3">
                    <button type="button" className="btn btn-sm" onClick={() => setThem((s) => ({ ...s, [g.key]: (s[g.key] ?? 0) + soHien }))}>
                      Xem thêm {Math.min(soHien, g.items.length - soHienNhom)} việc
                    </button>
                  </div>
                )}
              </>
            )}
          </KhoiNhom>
        );
      })}
    </div>
  );
}
