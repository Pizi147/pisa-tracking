import { useState } from 'react';
import { KhungTrongCot } from '../../ui/KhungPanel.tsx';
import { xepCase, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import { NganCase, type DaXoaCase } from './NganCase.tsx';
import { DaiDaXoa } from '../cases/TaiCho.tsx';
import { invalidate } from '../../lib/api.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { NhanTrangThai } from '../../ui/ui.tsx';
import { IconCanhBao, IconGap, IconNguoi } from '../../ui/BieuTuong.tsx';
import { useSession } from '../../lib/session.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { deadlineView, type DeadlineKind } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Mở một Case trong cột (Việc của tôi, chart): `n` đổi → khối Case dựng lại đúng view (`viec`) / cuộn tới PA (`paId`). */
export type MoCot = { caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'them-pa' | 'xac-nhan' | 'xac-nhan-pa'; n: number };

type CaseCard = SkillBoardRow['cases'][number];
type Dong = { c: CaseCard; r: SkillBoardRow };
const dong = (c: CaseCard) => c.status === 'done' || c.trangThaiV4.t === 'da-huy';

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
  const [moDong, setMoDong] = useState(false);
  /* P1 G2-01: Case vừa xoá — dải "Đã xoá … Hoàn tác" giữ ĐÚNG chỗ dòng Case (`i`) 10 giây dù danh sách đã tải lại (Case rời `rows`), như Xoá PA / panel Case. */
  const [vuaXoa, setVuaXoa] = useState<{ id: number; i: number; x: DaXoaCase }[]>([]);
  const boXoa = (id: number) => setVuaXoa((ds) => ds.filter((v) => v.id !== id));
  const daXoaIds = new Set(vuaXoa.map((v) => v.id));
  const theoCase = new Map(rows.flatMap((r) => r.cases.map((c) => [c.id, r] as const)));
  const cuaToi = (c: CaseCard) => !!toi && c.nguoiLam?.id === toi && !!c.viecTiep;
  const thu = (c: CaseCard) => (cuaToi(c) ? 0 : c.trangThaiV4.t === 'qua-han' ? 1 : 2);
  const tat = xepCase(rows.flatMap((r) => r.cases)).filter((c) => !daXoaIds.has(c.id));
  const dangMo: Dong[] = tat.filter((c) => !dong(c)).sort((a, b) => thu(a) - thu(b)).map((c) => ({ c, r: theoCase.get(c.id)! }));
  const daDongDs: Dong[] = tat.filter(dong).map((c) => ({ c, r: theoCase.get(c.id)! }));
  /* Case duy nhất mở sẵn chỉ với người làm được việc ở Case (vai xem TVV / CX: không Case nào mở sẵn — U02 dòng 15). */
  const moSan = (c: CaseCard) => cuaToi(c) || (dangMo.length === 1 && c.canEdit);
  const mot = rows.length === 1 ? rows[0] : null;
  const yeuCau = mo;

  const veDong = ({ c, r }: Dong) => {
    const ep = yeuCau?.caseId === c.id && daDong[c.id] !== yeuCau.n ? yeuCau : null;
    const moRa = !!ep || (tay[c.id] ?? (!dong(c) && moSan(c)));
    const v = c.viecTiep;
    const han = !dong(c) && v?.han && v.loaiHan && homNay ? deadlineView({ kind: v.loaiHan as DeadlineKind, due: v.han, today: homNay }) : null;
    const pa = c.plans.find((x) => x.status === 'started' || x.status === 'planned') ?? null;
    const bat = () => setTay((x) => ({ ...x, [c.id]: !moRa }));
    /* B12 (mockup audit-ui 08/11, M10): tách trường — trạng thái = viên · PA = chữ mờ · người = chữ mờ + biểu tượng · hạn = cột phải. Bỏ tình trạng PA
       ("đã lên kế hoạch") vì trạng thái Case đã nói (rê chuột vẫn đọc được). Khung ≥ 640 px: mỗi trường một cột; hẹp hơn: dòng 2 gói lại. */
    const nguoi = !dong(c) && c.nguoiLam?.ten ? (c.nguoiLam.id && c.nguoiLam.id === toi ? t('bạn') : c.nguoiLam.id ? c.nguoiLam.ten : dich(c.nguoiLam.ten)) : null;
    const chuHan = dong(c) ? <NhanTrangThai t={c.trangThaiV4.t} chu={dich(c.trangThaiV4.chu)} />
      : han ? <span title={han.text} className={`inline-flex items-center gap-1 whitespace-nowrap text-[13px] tabular-nums ${han.quaHan ? 'font-bold text-bad' : han.ganHan ? 'font-semibold text-slate-100' : 'text-slate-400'}`}>
        {han.quaHan && <IconCanhBao />}{han.han}</span> : null;
    /* #3 (G2-04): mọi PA đã khép mà Case chưa xong → "n PA xong · chờ Hoàn thành" (không phải "Chưa có PA"). */
    const chuPa = pa ? `PA ${pa.name}` : dong(c) ? null : c.plans.length ? t('{n} PA xong · chờ Hoàn thành', { n: c.plans.length }) : t('Chưa có PA');
    return (
      <div key={c.id} id={`case-${c.id}`} className="border-t px-4 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
        <div className={`grid min-h-[52px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-2.5 py-1.5 [@container(min-width:640px)]:grid-cols-[34px_140px_minmax(0,1fr)_150px_76px_24px] [@container(min-width:640px)]:gap-x-3 ${dong(c) ? 'opacity-[.85]' : ''}`}>
          <span className="the-kn">{r.short}</span>
          <button type="button" aria-expanded={moRa} onClick={bat}
            className={`flex min-h-[44px] min-w-0 appearance-none flex-wrap items-center gap-x-2 gap-y-0.5 border-0 bg-transparent p-0 text-left [@container(min-width:640px)]:col-span-3 [@container(min-width:640px)]:grid [@container(min-width:640px)]:grid-cols-subgrid`}>
            <b className="flex basis-full flex-wrap items-center gap-2 text-[15px] font-semibold text-slate-100">{c.tenSos ? dich(r.label) : c.title}{c.sosLevel ? <ChipSos muc={c.sosLevel} hienKyNang={false} tinh /> : null}</b>
            {(!dong(c) || chuPa) && (
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                {!dong(c) && <NhanTrangThai t={c.trangThaiV4.t} chu={dich(c.trangThaiV4.chu)} />}
                {chuPa && <span className="min-w-0 text-[13px] text-dim" title={pa ? `PA ${pa.name} · ${dich(pa.statusLabel).toLowerCase()}` : undefined}>{chuPa}</span>}
              </span>
            )}
            {nguoi && <span className="inline-flex min-w-0 items-center gap-1 text-[13px] text-dim"><IconNguoi /><span className="truncate" title={nguoi}>{nguoi}</span></span>}
            {/* Khung hẹp (375): hạn đi cùng dòng chi tiết để tên + SOS có đủ chỗ; khung rộng: cột hạn riêng bên phải. */}
            {chuHan && <span className="[@container(min-width:640px)]:hidden">{chuHan}</span>}
          </button>
          <span className={`flex items-center gap-2 [@container(min-width:640px)]:contents`}>
            <span className="hidden [@container(min-width:640px)]:inline-flex">{chuHan}</span>
            <button type="button" className="mui-pa" aria-label={moRa ? t('Gập Case') : t('Mở Case')} aria-expanded={moRa} onClick={bat}><IconGap mo={moRa} /></button>
          </span>
        </div>
        {moRa && (
          <div className="cs-mo">
            <KhungTrongCot.Provider value>
              <NganCase key={`${c.id}:${ep?.n ?? 0}:${lai[c.id] ?? 0}`} caseId={c.id} paId={ep?.paId} viec={ep?.viec} hocVien={hocVien} lop={lop}
                onClose={() => { if (ep) setDaDong((x) => ({ ...x, [c.id]: ep.n })); setLai((x) => ({ ...x, [c.id]: (x[c.id] ?? 0) + 1 })); }} onChanged={onChanged}
                onDaXoa={(x) => setVuaXoa((ds) => [...ds, { id: c.id, i: Math.max(0, dangMo.findIndex((d) => d.c.id === c.id)), x }])} />
            </KhungTrongCot.Provider>
          </div>
        )}
      </div>
    );
  };

  const daiXoa = (v: (typeof vuaXoa)[number]) => (
    <div key={`xoa-${v.id}`} className="border-t px-4 py-3 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
      <DaiDaXoa chu={<>{t('Đã xoá Case')} <b>{v.x.ten}</b>{v.x.soPa ? ` ${t('cùng {n} PA', { n: v.x.soPa })}` : ''}</>} thungRacId={v.x.thungRacId}
        onKhoiPhuc={() => { boXoa(v.id); invalidate('/my-work'); onChanged(); }} onHet={() => boXoa(v.id)}
        phu={t('Việc của Case này cũng rời danh sách.')} />
    </div>
  );
  const hangMo = dangMo.map(veDong);
  for (const v of [...vuaXoa].sort((a, b) => a.i - b.i)) hangMo.splice(Math.min(v.i, hangMo.length), 0, daiXoa(v));
  return (
    <section className="card flex min-w-0 flex-col overflow-hidden [container-type:inline-size]" aria-label={t('Case & phương án · {kn}', { kn: tenKn })}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <h2 className="m-0 text-[17px] font-bold text-slate-100">{mot ? t('Case & phương án · {kn}', { kn: tenKn }) : t('Case & phương án')}</h2>
        {dangMo.length > 0 && <span className="the-phu"><b>{dangMo.length}</b> {t('đang mở')}</span>}
      </div>
      {!dangMo.length && vuaXoa.length > 0 && <div>{vuaXoa.map(daiXoa)}</div>}
      {!dangMo.length && !daDongDs.length ? (
        <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 text-[14px] text-slate-400">
          {t('Không có Case {kn}.', { kn: tenKn })}
          {mot && onReport && <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => onReport(mot.category)}>{t('+ Case cho {label}', { label: dich(mot.label) })}</button>}
        </p>
      ) : (
        <>
          {dangMo.length > 0 ? <div>{hangMo}</div> : (
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
