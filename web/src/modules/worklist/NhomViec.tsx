import { type ReactNode, useState } from 'react';
import { KhoiNhom } from '../../ui/HangNhom.tsx';
import { type NhomViecXem } from '@shared/domain/index.ts';
import { DongViec, type WorkItem } from './WorkList.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * KHỐI NHÓM VIỆC — tách từ `ViecCuaToi.tsx` (PR-Ra) để dùng chung với Hỗ trợ học viên: bốn
 * nhóm cố định, mỗi nhóm gập/mở, nhóm có việc quá hạn tự mở sẵn. Tổng quan giữ đúng hành vi cũ
 * (`soHien = 5`); Hỗ trợ học viên gọi với `soHien = 10` và có thể ép mở hết khi đang lọc.
 */
export function NhomViec({ nhom, soHien, moHet, onOpen, nutPhu, chon, xong, moTrang, moRong, moCaDong }: {
  nhom: NhomViecXem<WorkItem>[];
  soHien: number;
  /** Ép mở hết mọi nhóm — dùng khi đang lọc nhanh/loại việc, kết quả đã ít thì không cần gập nữa. */
  moHet?: boolean;
  /** OV-5a: bấm một việc → panel phải (Công việc tại chỗ); dòng kiểu gọn (`DongViec gon`). */
  onOpen: (it: WorkItem) => void;
  /** OV-5a: việc đang mở ở panel · việc vừa xong (mờ + gạch, giữ chỗ). */
  chon?: string | null; xong?: ReadonlySet<string>;
  /** OV-5a: việc mở trang khác thay vì panel (dấu ↗). */
  moTrang?: (it: WorkItem) => boolean;
  /** OV-13c: dòng gộp mở panel cả dòng (`DongViec moCaDong`). */
  moCaDong?: (it: WorkItem) => boolean;
  /** Nút phụ đứng cạnh nhãn việc, ví dụ Nhắc (Hỗ trợ học viên). Duyệt nằm ở hộp Chờ duyệt (PR-DUYET, K1-32). */
  nutPhu?: (it: WorkItem) => ReactNode;
  /** OV-13b: phần mở NGAY DƯỚI dòng (ghi nhanh Kết quả PA, dòng "✓ Đã lưu") — `null` = không. */
  moRong?: (it: WorkItem) => ReactNode;
}) {
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [them, setThem] = useState<Record<string, number>>({});
  return (
    <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
      {nhom.map((g) => {
        const dangMo = moHet || (mo[g.key] ?? (g.moSan || nhom.length === 1));   // OV-11c (CV-17g): chỉ một nhóm thì mở sẵn
        const soHienNhom = soHien + (them[g.key] ?? 0);
        const phu = (g.quaHan > 0 || g.homNay > 0) ? (
          <span className="flex flex-wrap items-center gap-x-2">
            {g.quaHan > 0 && <span className="font-bold text-late">{t('⚠ {quaHan} quá hạn', { quaHan: g.quaHan })}</span>}
            {g.homNay > 0 && <span className="font-semibold text-soon">{t('{homNay} hôm nay', { homNay: g.homNay })}</span>}
          </span>
        ) : null;
        return (
          <KhoiNhom key={g.key} id={`nhom-${g.key}`} mo={dangMo} onMo={() => setMo((s) => ({ ...s, [g.key]: !dangMo }))}
            nhan={dich(g.label)} tieuDe={dich(g.label)} dem={g.n} phu={phu}>
            {/* PR-YT4: nhóm Ý thức có việc thật (`yt_*`, có hạn). PR-VAI-a: Phối hợp SOS là việc `phoi_hop_sos` — hết dòng nhắc mềm. */}
            {(
              <>
                <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
                  {g.items.slice(0, soHienNhom).map((it) => (
                    /* OV-11c: "Của GV" có thể có hai GV cùng một việc Bàn giao môn (W1, W2) — khoá vẽ kèm người giữ việc. */
                    <li key={`${it.key}|${it.ownerId ?? ''}`}><DongViec gon it={it} onOpen={onOpen} nutPhu={nutPhu?.(it)} chon={chon} xong={xong} moTrang={!it.con && !!moTrang?.(it)} conMoTrang={moTrang} moRong={moRong} moCaDong={moCaDong} /></li>
                  ))}
                </ul>
                {g.items.length > soHienNhom && (
                  <div className="py-2 pr-3">
                    <button type="button" className="btn btn-sm" onClick={() => setThem((s) => ({ ...s, [g.key]: (s[g.key] ?? 0) + soHien }))}>
                      {t('Xem thêm')}{' '}{Math.min(soHien, g.items.length - soHienNhom)}{' '}{t('việc')}
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
