import { useState } from 'react';
import { KhungTrongCot } from '../../ui/KhungPanel.tsx';
import { xepCase, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import { NganCase } from './NganCase.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** Mở một Case trong cột (Việc của tôi, chart): `n` đổi → khối Case dựng lại đúng view (`viec`) / cuộn tới PA (`paId`). */
export type MoCot = { caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'them-pa' | 'xac-nhan' | 'xac-nhan-pa'; n: number };

/**
 * CASE & PHƯƠNG ÁN — cột phải dưới Hành trình (UI-HO-SO-HV-2, mockup M5; bố cục Case A của M6 6b-2): mọi Case của kỹ năng đang chọn (Overall = mọi Case),
 * mở trước đóng sau, mỗi Case là Ngăn Case đặt THẲNG trong cột (`KhungTrongCot`) — đầu Case → PA → Kết luận → Lịch sử gập → Bằng chứng; Thêm PA / Ghi kết quả
 * / Mô tả Case… mở NGAY TRONG khối đó (không panel), lưu xong tự về Case, thẻ PA viền nhấn + "✓ … · Hoàn tác" (V20). Việc ít dùng (Sửa, Đổi người…, ⋯ PA)
 * giữ như Ngăn Case. Không quyền: một câu "ai làm được" (Case A). Huỷ / ‹ / Esc ở form về view Case.
 */
export function CotCaseHv({ rows, tenKn, mo, hocVien, lop, onReport, onChanged }: {
  rows: SkillBoardRow[]; tenKn: string; mo: MoCot | null; hocVien: string; lop?: string | null;
  onReport?: (category: string) => void; onChanged: () => void;
}) {
  /* Huỷ form trong một khối → dựng lại khối đó ở view Case (chuỗi view của Ngăn Case là cục bộ). */
  const [lai, setLai] = useState<Record<number, number>>({});
  /* Lần mở (`mo.n`) đã đóng — dựng lại không mở form lần nữa. */
  const [daDong, setDaDong] = useState<Record<number, number>>({});
  const ds = xepCase(rows.flatMap((r) => r.cases));
  const mot = rows.length === 1 ? rows[0] : null;
  return (
    <section className="card flex min-w-0 flex-col" aria-label={t('Case & phương án · {kn}', { kn: tenKn })}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 className="m-0 text-[15px] font-bold text-slate-100">{t('Case & phương án · {kn}', { kn: tenKn })}</h2>
      </div>
      {!ds.length ? (
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 text-[14px] text-slate-400">
          {t('Không có Case {kn}.', { kn: tenKn })}
          {mot && onReport && <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => onReport(mot.category)}>{t('+ Case cho {label}', { label: dich(mot.label) })}</button>}
        </p>
      ) : ds.map((c) => {
        const day = mo?.caseId === c.id && daDong[c.id] !== mo.n ? mo : null;
        return (
          <div key={c.id} id={`case-${c.id}`} className="border-b last:border-b-0" style={{ borderColor: 'var(--line-strong)' }}>
            <KhungTrongCot.Provider value>
              <NganCase key={`${c.id}:${day?.n ?? 0}:${lai[c.id] ?? 0}`} caseId={c.id} paId={day?.paId} viec={day?.viec} hocVien={hocVien} lop={lop}
                onClose={() => { if (day) setDaDong((x) => ({ ...x, [c.id]: day.n })); setLai((x) => ({ ...x, [c.id]: (x[c.id] ?? 0) + 1 })); }} onChanged={onChanged} />
            </KhungTrongCot.Provider>
          </div>
        );
      })}
    </section>
  );
}
