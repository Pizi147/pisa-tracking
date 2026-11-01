import { useContext, type ReactNode } from 'react';
import { NhanTrangThai, Outcome } from '../../ui/ui.tsx';
import { IconCanhBao } from '../../ui/BieuTuong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { DongXinYKien } from './DongXinYKien.tsx';
import {
  CHU_THEM_PA, CHUA_CO_HAN, OUTCOME_MARK, OUTCOME_TONE, chuKetQuaPa, chuKhoangPa, dangChay, deadlineView, tienDoCase,
} from '@shared/domain/index.ts';
import {
  NhanLoai, NhanTamDung, TamDungCtx, TenCase, chuBuoi, chuNguoi,
  type CaseCard, type MoCase, type Plan,
} from './SkillBoard.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** Nút động từ của việc tiếp (clarify: không "Xác nhận" trơn). */
const NUT_VIEC: Record<NonNullable<MoCase['viec']>, string> = {
  'xac-nhan': t('Xác nhận Case'), 'xac-nhan-pa': t('Xác nhận PA'), 'ghi-ket-qua': t('Kết quả'), 'them-pa': t('Thêm PA'),
};

/**
 * Khối Case + PA thụt (hồ sơ HV). HSL-FT dùng lại ở vùng mở của hồ sơ lượt: `themPa` = chỗ của việc "Thêm PA" (nút / form tại chỗ) thay câu việc
 * mặc định; `paMoi` = PA vừa thêm (viền nhấn + "✓ Vừa thêm · Hoàn tác" do nơi gọi vẽ).
 */
export function KhoiCase({ c, onMoCase, themPa, paMoi }: {
  c: CaseCard; onMoCase: (caseId: number, o?: MoCase) => void;
  themPa?: ReactNode; paMoi?: { id: number; bao: ReactNode } | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const tamDung = useContext(TamDungCtx);
  const tt = c.trangThaiV4;
  const td = tienDoCase(c.plans, c);
  const v = c.viecTiep;
  const han = v?.loaiHan && v.han ? deadlineView({ kind: v.loaiHan, due: v.han, today: homNay }) : null;
  const viecMo: MoCase | undefined = !v ? undefined
    : v.chu === 'Xác nhận Case' || v.chu === 'Mô tả Case' ? { viec: 'xac-nhan' }   // OV-12c: Ngăn Case mở đúng khối theo trạng thái
    : v.chu.startsWith('Xác nhận PA') ? { viec: 'xac-nhan-pa', paId: v.paId }
    : v.loaiHan === 'cap-nhat-pa' ? { viec: 'ghi-ket-qua', paId: v.paId } : undefined;
  return (
    <div className="mt-2 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
      <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-slate-100">
        <NhanLoai loai="Case" /><span className="min-w-0 truncate max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words"><TenCase c={c} luot={c.luot} kn={c.topic} /></span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-slate-400">
        {tamDung && tt.t === 'qua-han' ? <NhanTamDung tu={tamDung} /> : <NhanTrangThai t={tt.t} title={dich(tt.chu)} chu={tt.k === 'tam' ? dich(tt.chu) : undefined} />}
        {tt.k !== 'tam' && <span>{tt.k === 'dang-lam' ? td.text : dich(tt.chu)}</span>}
        {/* OV-13a: Case tạm không có việc tiếp — vẫn mở được để xem / sửa. */}
        {tt.k === 'tam' && <button type="button" className="btn ml-auto min-h-[44px]" onClick={() => onMoCase(c.id)}>{t('Mở Case')}</button>}
      </div>
      {c.plans.filter(dangChay).map((p) => <KhoiPa key={p.id} p={p} c={c} onMoCase={onMoCase} bao={paMoi?.id === p.id ? paMoi.bao : undefined} />)}
      {themPa && v?.chu === CHU_THEM_PA ? <div className="mt-2">{themPa}</div> : v && (
        <div className="mt-2 flex flex-col gap-1.5">
          <span className="text-[12px] text-slate-200">
            {/* Ghi kết quả: dạng ngắn theo tuần ("Ghi kết quả tuần W4 SEP") — tên PA đã ở khối PA ngay trên. */}
            {v.loaiHan === 'cap-nhat-pa' && han ? han.viec : dich(v.chu)}
            {/* Em Tạm dừng: mọi hạn đang dừng → nhãn vàng thay hạn (cùng luật DongHan ở bảng). */}
            {tamDung && han ? <> <NhanTamDung tu={tamDung} /></> : <>
              {/* OV-11d (CA2-9): chữ hạn cùng luật bảng máy tính (`DongHan`): quá hạn ⚠ · hôm nay · hạn hết dd/mm. */}
              {han?.quaHan ? <span className="inline-flex items-center gap-1 font-semibold text-bad"> · <IconCanhBao />{han.quaHan}</span>
                : han?.homNay ? <span className="font-semibold text-soon"> {t('· hôm nay')}</span>
                : han && han.han !== CHUA_CO_HAN && <span className={han.ganHan ? 'font-semibold text-soon' : 'text-slate-400'}> · {han.han}</span>}
            </>}
          </span>
          {viecMo && (viecMo.viec === 'ghi-ket-qua' ? !!c.plans.find((p) => p.id === viecMo.paId)?.ghiDuoc : v.chu === 'Xác nhận Case' ? c.coTheXacNhanCase : c.canEdit)
            ? <button type="button" className="btn btn-primary min-h-[44px] w-full sm:min-h-0 sm:w-auto sm:self-start" onClick={() => onMoCase(c.id, viecMo)}>{v.chu.startsWith('Kết quả cuối') ? t('Kết quả cuối') : v.chu === 'Mô tả Case' ? t('Mô tả Case') : NUT_VIEC[viecMo.viec!]}</button>
            : (
              <span className="flex items-center justify-between gap-2 text-[12px] text-slate-400">
                <span className="min-w-0 truncate">{c.nguoiLam?.ten ? t('Việc của {ten}', { ten: c.nguoiLam.ten }) : t('Việc của người khác')}</span>
                <button type="button" className="btn min-h-[44px]" onClick={() => onMoCase(c.id)}>{t('Mở Case')}</button>
              </span>
            )}
        </div>
      )}
    </div>
  );
}

/** Khối PA: thụt vào, nền `surface-2`, đường nối từ Case (khối đặc), `người · đến MT2 · W4 OCT`, kết quả gần nhất. */
function KhoiPa({ p, c, onMoCase, bao }: { p: Plan; c: CaseCard; onMoCase: (caseId: number, o?: MoCase) => void; bao?: ReactNode }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const khoang = chuKhoangPa({ startedOn: null, completedOn: null, mocChu: p.mocChu }, homNay);
  return (
    <div className={`relative ml-3 mt-2 rounded-lg bg-[color:var(--surface-2)] px-2.5 py-2 pl-3 ${bao ? 'ring-1 ring-[color:var(--accent-strong)]' : ''}`}>
      <span aria-hidden className="absolute -left-3 top-0 h-4 w-3 rounded-bl-md border-b-[1.5px] border-l-[1.5px]" style={{ borderColor: 'var(--line-strong)' }} />
      <button type="button" onClick={() => onMoCase(c.id, { paId: p.id })} className="flex w-full min-w-0 items-center gap-1.5 border-0 bg-transparent p-0 text-left text-[13px] font-semibold text-slate-100">
        <NhanLoai loai="PA" /><span className="min-w-0 truncate max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words">{p.name}</span>
      </button>
      <div className="mt-0.5 truncate text-[12px] text-slate-400 max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words">{[chuNguoi(p), khoang, chuBuoi(p)].filter(Boolean).join(' · ')}</div>
      <DongXinYKien x={p.xinYKien} ngan={ngan} />
      {p.lastOutcomeLabel && (
        <div className="mt-1">
          <Outcome tone={OUTCOME_TONE[p.lastOutcome ?? ''] ?? 'muted'} mark={OUTCOME_MARK[p.lastOutcome ?? '']}>{chuKetQuaPa(p.lastOutcomeLabel, p.lastOutcomeOn, homNay)}</Outcome>
        </div>
      )}
      {bao}
    </div>
  );
}
