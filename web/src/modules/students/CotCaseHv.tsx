import { useState } from 'react';
import { KhungTrongCot } from '../../ui/KhungPanel.tsx';
import { xepCase, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import { NganCase } from './NganCase.tsx';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { NhanTrangThai } from '../../ui/ui.tsx';
import { IconCanhBao, IconGap } from '../../ui/BieuTuong.tsx';
import { useSession } from '../../lib/session.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand } from '../../lib/format.ts';
import { deadlineView, type DeadlineKind } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Mở một Case trong cột (Việc của tôi, chart): `n` đổi → khối Case dựng lại đúng view (`viec`) / cuộn tới PA (`paId`). */
export type MoCot = { caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'them-pa' | 'xac-nhan' | 'xac-nhan-pa'; n: number };

type CaseCard = SkillBoardRow['cases'][number];
type Dong = { c: CaseCard; r: SkillBoardRow };
const dong = (c: CaseCard) => c.status === 'done' || c.trangThaiV4.t === 'da-huy';

/** Việc tiếp của Case → nút ở dòng tóm tắt (chỉ khi người xem là người làm) + view mở trong Case. */
function nutViec(c: CaseCard): { chu: string; viec: MoCot['viec']; paId?: number } | null {
  const v = c.viecTiep;
  if (!v) return null;
  if (v.loaiHan === 'cap-nhat-pa' && v.paId) return { chu: v.chu.startsWith('Kết quả cuối') ? t('Ghi kết quả cuối') : t('Ghi kết quả PA'), viec: 'ghi-ket-qua', paId: v.paId };
  if (v.loaiHan === 'lap-pa') return { chu: t('+ Thêm PA'), viec: 'them-pa' };
  if (v.chu.startsWith('Xác nhận PA') && v.paId) return { chu: t('Xác nhận PA'), viec: 'xac-nhan-pa', paId: v.paId };
  if (v.chu === 'Xác nhận Case' || v.chu === 'Mô tả Case') return { chu: dich(v.chu), viec: 'xac-nhan' };
  return null;
}

/**
 * CASE & PHƯƠNG ÁN — cột phải hồ sơ HV (U02, mockup `thiet-ke/audit-0311/u02-ho-so-hv.html`, UA-Q1 / N33 ①): mỗi Case MỘT dòng tóm tắt (thẻ kỹ năng · tên · SOS ·
 * hạn | thẻ điểm MT · PA · phụ trách) đọc từ bảng kỹ năng đã nạp — không gọi thêm. Xếp: việc của người xem → quá hạn → còn lại; Case của người xem (hoặc Case duy nhất)
 * mở sẵn, bấm dòng mở / gập, mở nhiều được; Case đã đóng / huỷ gập "n Case đã đóng". Case mở = Ngăn Case đặt THẲNG trong cột (`KhungTrongCot`, giữ mọi thao tác)
 * — chỉ Case đang mở mới gọi `/cases/:id`. Nút việc của người xem ở dòng tóm tắt (một việc một chỗ).
 */
export function CotCaseHv({ rows, tenKn, mo, hocVien, lop, onReport, onChanged }: {
  rows: SkillBoardRow[]; tenKn: string; mo: MoCot | null; hocVien: string; lop?: string | null;
  onReport?: (category: string) => void; onChanged: () => void;
}) {
  const toi = useSession().session?.user?.id ?? null;
  const { homNay } = useNgayNghiepVu();
  /* Huỷ form trong một khối → dựng lại khối đó ở view Case (chuỗi view của Ngăn Case là cục bộ). */
  const [lai, setLai] = useState<Record<number, number>>({});
  /* Lần mở (`mo.n`) đã đóng — dựng lại không mở form lần nữa. */
  const [daDong, setDaDong] = useState<Record<number, number>>({});
  /* Bấm dòng: mở / gập do tay (thắng mặc định). Nút việc ở dòng: mở Case thẳng view việc. */
  const [tay, setTay] = useState<Record<number, boolean>>({});
  const [viecDong, setViecDong] = useState<MoCot | null>(null);
  const [moDong, setMoDong] = useState(false);
  const theoCase = new Map(rows.flatMap((r) => r.cases.map((c) => [c.id, r] as const)));
  const cuaToi = (c: CaseCard) => !!toi && c.nguoiLam?.id === toi && !!c.viecTiep;
  const thu = (c: CaseCard) => (cuaToi(c) ? 0 : c.trangThaiV4.t === 'qua-han' ? 1 : 2);
  const tat = xepCase(rows.flatMap((r) => r.cases));
  const dangMo: Dong[] = tat.filter((c) => !dong(c)).sort((a, b) => thu(a) - thu(b)).map((c) => ({ c, r: theoCase.get(c.id)! }));
  const daDongDs: Dong[] = tat.filter(dong).map((c) => ({ c, r: theoCase.get(c.id)! }));
  /* Case duy nhất mở sẵn chỉ với người làm được việc ở Case (vai xem TVV / CX: không Case nào mở sẵn — U02 dòng 15). */
  const moSan = (c: CaseCard) => cuaToi(c) || (dangMo.length === 1 && c.canEdit);
  const mot = rows.length === 1 ? rows[0] : null;
  const yeuCau = viecDong ?? mo;

  const veDong = ({ c, r }: Dong) => {
    const ep = yeuCau?.caseId === c.id && daDong[c.id] !== yeuCau.n ? yeuCau : null;
    const moRa = !!ep || (tay[c.id] ?? (!dong(c) && moSan(c)));
    const nut = cuaToi(c) ? nutViec(c) : null;
    const v = c.viecTiep;
    const han = !dong(c) && v?.han && v.loaiHan && homNay ? deadlineView({ kind: v.loaiHan as DeadlineKind, due: v.han, today: homNay }) : null;
    const mt = c.tenSos?.mt ?? c.attempts[0]?.attemptNo ?? null;
    const diem = mt != null ? r.points.find((x) => x.attemptNo === mt) : undefined;
    const pa = c.plans.find((x) => x.status === 'started' || x.status === 'planned') ?? null;
    const bat = () => setTay((x) => ({ ...x, [c.id]: !moRa }));
    return (
      <div key={c.id} id={`case-${c.id}`} className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
        <div className={`grid grid-cols-[34px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 px-4 py-3 sm:grid-cols-[40px_minmax(0,1fr)_auto] ${moRa ? 'bg-[color:var(--surface-2)] shadow-[inset_3px_0_0_var(--accent)]' : 'hover:bg-[color:var(--accent-soft)]'} ${dong(c) ? 'opacity-[.85]' : ''}`}>
          <span className="the-kn">{r.short}</span>
          <button type="button" aria-expanded={moRa} onClick={bat}
            className="flex min-h-[44px] min-w-0 appearance-none flex-wrap items-center gap-2 border-0 bg-transparent p-0 text-left text-[15px] font-semibold text-slate-100 sm:min-h-0">
            {c.tenSos ? dich(r.label) : c.title}
            {c.sosLevel ? <ChipSos muc={c.sosLevel} hienKyNang={false} tinh /> : null}
          </button>
          <span className="col-start-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex-col sm:items-end">
            <span className="flex items-center gap-2.5">
              {dong(c) ? <NhanTrangThai t={c.trangThaiV4.t} chu={dich(c.trangThaiV4.chu)} />
                : han ? <span title={han.text} className={`inline-flex items-center gap-1 whitespace-nowrap text-[13px] tabular-nums ${han.quaHan ? 'font-bold text-bad' : han.ganHan ? 'font-semibold text-slate-100' : 'text-slate-400'}`}>
                  {han.quaHan && <IconCanhBao />}{han.han}</span> : null}
              <button type="button" tabIndex={-1} aria-label={moRa ? t('Gập Case') : t('Mở Case')} aria-expanded={moRa} onClick={bat}
                className="inline-flex min-h-[44px] min-w-[44px] appearance-none items-center justify-center border-0 bg-transparent p-0 text-slate-400 sm:min-h-6 sm:min-w-6"><IconGap mo={moRa} /></button>
            </span>
            {nut && (
              <button type="button" className="btn btn-sm btn-primary max-sm:min-h-[44px] whitespace-normal"
                onClick={() => { setTay((x) => ({ ...x, [c.id]: true })); setViecDong({ caseId: c.id, paId: nut.paId, viec: nut.viec, n: Date.now() }); }}>{nut.chu}</button>
            )}
          </span>
          {/* 375: thẻ phụ chỉ khi Case mở (mockup `.dt .cs .tags`). */}
          <span className={`col-start-2 flex-wrap items-center gap-1.5 ${moRa ? 'flex' : 'hidden sm:flex'}`}>
            {diem && (
              <span className="the-phu tabular-nums">{`MT${mt}`}
                <b className={diem.passed === false || (diem.expectation != null && diem.band < diem.expectation) ? 'text-bad' : 'text-ok'}>
                  {diem.expectation != null && diem.band < diem.expectation ? '✗' : '✓'} {fmtBand(diem.band)}</b>
                {diem.expectation != null && <>/ {fmtBand(diem.expectation)}</>}
              </span>
            )}
            {pa ? <span className="the-phu min-w-0"><span className="truncate">{`PA ${pa.name}`}</span> · {dich(pa.statusLabel).toLowerCase()}</span>
              : !dong(c) && <span className="the-phu">{t('Chưa có PA')}</span>}
            {c.nguoiLam?.ten && !dong(c) && <span className="the-phu nhat">{t('phụ trách:')} <b>{c.nguoiLam.id && c.nguoiLam.id === toi ? t('Bạn') : c.nguoiLam.id ? c.nguoiLam.ten : dich(c.nguoiLam.ten)}</b></span>}
          </span>
        </div>
        {moRa && (
          <div className="border-t bg-[color:var(--surface-2)] pb-1 sm:pl-[52px]" style={{ borderColor: 'var(--line)' }}>
            <KhungTrongCot.Provider value>
              <NganCase key={`${c.id}:${ep?.n ?? 0}:${lai[c.id] ?? 0}`} caseId={c.id} paId={ep?.paId} viec={ep?.viec} hocVien={hocVien} lop={lop} anViecChinh={!!nut}
                onClose={() => { if (ep) setDaDong((x) => ({ ...x, [c.id]: ep.n })); setLai((x) => ({ ...x, [c.id]: (x[c.id] ?? 0) + 1 })); }} onChanged={onChanged} />
            </KhungTrongCot.Provider>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="card flex min-w-0 flex-col overflow-hidden" aria-label={t('Case & phương án · {kn}', { kn: tenKn })}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 className="m-0 text-[17px] font-bold text-slate-100">{mot ? t('Case & phương án · {kn}', { kn: tenKn }) : t('Case & phương án')}</h2>
        {dangMo.length > 0 && <span className="the-phu"><b>{dangMo.length}</b> {t('đang mở')}</span>}
      </div>
      {!dangMo.length && !daDongDs.length ? (
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 text-[14px] text-slate-400">
          {t('Không có Case {kn}.', { kn: tenKn })}
          {mot && onReport && <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => onReport(mot.category)}>{t('+ Case cho {label}', { label: dich(mot.label) })}</button>}
        </p>
      ) : (
        <>
          {dangMo.length > 0 ? <div>{dangMo.map(veDong)}</div> : (
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-[14px] text-slate-400">
              {t('Không có Case {kn} đang mở.', { kn: tenKn })}
              {mot && onReport && <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => onReport(mot.category)}>{t('+ Case cho {label}', { label: dich(mot.label) })}</button>}
            </p>
          )}
          {daDongDs.length > 0 && (
            <>
              <button type="button" aria-expanded={moDong} onClick={() => setMoDong(!moDong)}
                className="flex min-h-[44px] w-full appearance-none items-center gap-2 border-0 border-t bg-transparent px-4 py-3 text-left text-[14px] font-semibold text-slate-400 hover:text-slate-200"
                style={{ borderColor: 'var(--line-strong)' }}>
                <IconGap mo={moDong} />{t('{n} Case đã đóng', { n: daDongDs.length })}
              </button>
              {(moDong || daDongDs.some((x) => x.c.id === yeuCau?.caseId)) && <div className="border-t" style={{ borderColor: 'var(--line)' }}>{daDongDs.map(veDong)}</div>}
            </>
          )}
        </>
      )}
    </section>
  );
}
