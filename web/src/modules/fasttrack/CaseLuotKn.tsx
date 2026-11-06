import { useState } from 'react';
import { KhungTrongCot } from '../../ui/KhungPanel.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { NhanTrangThai } from '../../ui/ui.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { skillShort } from '../../lib/format.ts';
import { NganCase } from '../students/NganCase.tsx';
import { TenCase, type CaseCard, type MoCase } from '../cases/SkillBoard.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * CASE & PHƯƠNG ÁN CỦA MỘT KỸ NĂNG trong vùng mở của hồ sơ lượt Test (CASE-PA-UI b, ghi chú v16 mục 8 "Test · lượt"): CÙNG mẫu với khối Case hồ sơ HV (mockup i1) —
 * mỗi Case một dòng tóm tắt (kỹ năng · tên + SOS · trạng thái · ▾), mở ra là CÙNG thân panel Case (`NganCase` trong khung cột): sửa tại chỗ, thẻ PA mở tại chỗ,
 * Thêm PA / Ghi kết quả / Xoá ngay trong khung. Chỉ Case đang mở mới gọi `/cases/:id`; một Case duy nhất người xem làm được thì mở sẵn.
 * `form` (Case đang cần Thêm PA — "Còn lại › Thêm PA") mở Case đó với thẻ "PA mới" sẵn.
 */
export function CaseLuotKn({ cards, form, onForm, onDoi }: {
  cards: CaseCard[]; studentId: number; chiDoc: boolean;
  form: number | null; onForm: (caseId: number | null) => void;
  /** Giữ chữ ký nơi gọi — panel Case nổi vẫn mở từ chỗ khác của trang lượt. */
  onMoCase: (caseId: number, o?: MoCase) => void;
  /** Sau lưu / hoàn tác: tải lại trang lượt + bảng Case. */
  onDoi: () => void;
}) {
  const [tay, setTay] = useState<Record<number, boolean>>({});
  if (!cards.length) return <p className="m-0 text-xs text-slate-400">{t('Không có Case')}</p>;
  return (
    <div className="mt-2 flex flex-col">
      {cards.map((c) => {
        const xong = c.status === 'done' || c.trangThaiV4.t === 'da-huy';
        const moRa = form === c.id || (tay[c.id] ?? (!xong && cards.length === 1 && !!c.canEdit));
        const bat = () => { setTay((x) => ({ ...x, [c.id]: !moRa })); if (moRa && form === c.id) onForm(null); };
        return (
          <div key={c.id} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
            <div className="grid min-h-[52px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-2.5 py-1.5">
              <span className="the-kn">{c.topic ? skillShort(c.topic) : 'C'}</span>
              <button type="button" aria-expanded={moRa} onClick={bat} className="grid min-h-[44px] min-w-0 appearance-none gap-0.5 border-0 bg-transparent p-0 text-left">
                <b className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-slate-100"><TenCase c={c} luot={c.luot} kn={c.topic} />{c.sosLevel ? <ChipSos muc={c.sosLevel} hienKyNang={false} tinh /> : null}</b>
                <span className="text-[13px] text-dim">{dich(c.viecTiep?.chu ?? c.trangThaiV4.chu)}</span>
              </button>
              <span className="flex items-center gap-2">
                {xong && <NhanTrangThai t={c.trangThaiV4.t} chu={dich(c.trangThaiV4.chu)} />}
                <button type="button" className="mui-pa" aria-label={moRa ? t('Gập Case') : t('Mở Case')} aria-expanded={moRa} onClick={bat}><IconGap mo={moRa} /></button>
              </span>
            </div>
            {moRa && (
              <div className="cs-mo">
                <KhungTrongCot.Provider value>
                  <NganCase key={`${c.id}:${form === c.id ? 'them' : ''}`} caseId={c.id} viec={form === c.id ? 'them-pa' : undefined}
                    onClose={() => onForm(null)} onChanged={onDoi} />
                </KhungTrongCot.Provider>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
