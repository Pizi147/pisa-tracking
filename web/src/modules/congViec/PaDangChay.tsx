import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { caseTopicLabel, duongHoSoHocVien, kyGhiKetQua, type PaDangChay } from '@shared/domain/index.ts';
import { dich, dichDu, t } from '@shared/i18n/index.ts';
import { useNhapPaMoi, type NhapPaMoi } from '../../lib/nhapPa.ts';
import { ChipHan } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { COT_VIEC, DaiNhom, IconNhom, NET_CAY } from './DanhSachViec.tsx';

/**
 * TU2-4 (TU8, TU9, TU17 — mockup Ⓣ1 D1–D5): khối "PA đang chạy" dưới nhóm "Kết quả PA" ở Công việc của GV — MỌI PA người xem giữ việc Kết quả, đang chạy,
 * CHƯA tới hạn (máy chủ `paDangChay` của `/my-work`, đã nạp — 0 request thêm). KHÔNG phải việc: không vào "n việc", badge tab / menu, chuông.
 * Gom theo lớp: lớp ≥ 2 PA = dòng lớp "MB FT 101 · PA đang chạy" + nút "n PA ▾" mở khay em (bấm dòng lớp = lưới); lớp 1 PA = "Lớp · tên PA" + thẻ em.
 * Bấm em / nhãn nháp / "Ghi nháp" = form Ghi kết quả PA (Lưu nháp cạnh Lưu). Lưu nháp xong nhãn nháp đổi ngay tại chỗ (`nhapPa.ts`).
 * ponytail: dòng việc giả (`viecTuPa`) dựng từ `paDangChay` để dùng lại panel Case / lưới có sẵn — thêm trường vào `PaDangChay` nếu panel cần nhiều hơn.
 */
type Nhom = { khoa: string; classId: number | null; lop: string | null; ds: PaDangChay[] };

/** Việc "Ghi kết quả PA" dựng từ một PA chưa tới hạn (cùng khoá `action:{id}` với việc thật khi PA tới hạn). */
export const viecTuPa = (x: PaDangChay, uid: number | null): WorkItem => ({
  key: `action:${x.paId}`, group: 'ghi_ket_qua_pa', urgency: 'normal', studentId: x.studentId, studentName: x.studentName,
  classId: x.classId, classCode: x.classCode, attemptId: null, attemptNo: null, caseId: x.caseId, level: null,
  reason: x.tenPa, actionLabel: t('Ghi kết quả PA'), href: duongHoSoHocVien(x.studentId, { caseId: x.caseId, paId: x.paId, viec: 'ghi-ket-qua' }),
  tieuDe: t('Ghi kết quả PA'), ownerId: uid, owner: null, mine: true, due: x.han, statusLabel: t('Chờ kết quả'), contextLabel: x.dot, count: null, paId: x.paId,
  ghiNhanh: false,   // lưới tự quyết từ PA (`ghiNhanhDuoc` + PA Tutor), không từ cờ này
});
/** Dòng gộp cả lớp (≥ 2 PA) → lưới Ghi kết quả PA; khoá riêng (`pdc-lop:`) để không trùng dòng gộp thật của máy chủ. */
export const viecTuLop = (g: Nhom, uid: number | null): WorkItem => ({
  ...viecTuPa(g.ds[0], uid), key: `pdc-lop:${g.classId}`, paId: null, studentId: null, studentName: `${t('Lớp')} ${g.lop ?? ''}`, tieuDe: t('Ghi kết quả PA'),
  due: g.ds.map((x) => x.han).sort()[0],
  con: g.ds.map((x) => ({ ...viecTuPa(x, uid), conTen: x.studentName, conPhu: '' })),
});

/** Dựng lại việc từ khoá trên địa chỉ (F5 / link) — `action:{paId}` hoặc `pdc-lop:{lớp}`; không có trong `paDangChay` → null. */
export function viecPdcTheoKhoa(ds: readonly PaDangChay[], khoa: string, uid: number | null): WorkItem | null {
  if (khoa.startsWith('action:')) { const x = ds.find((y) => `action:${y.paId}` === khoa); return x ? viecTuPa(x, uid) : null; }
  if (!khoa.startsWith('pdc-lop:')) return null;
  const g = gomTheoLop(ds).find((y) => `pdc-lop:${y.classId}` === khoa && y.ds.length > 1);
  return g ? viecTuLop(g, uid) : null;
}

const KHOA_GAP = (uid: number | null) => `pisa.pa-dang-chay.gap.u${uid ?? ''}`;
const docGap = (uid: number | null): boolean | null => { try { const v = localStorage.getItem(KHOA_GAP(uid)); return v === null ? null : v === '1'; } catch { return null; } };
const nhoGap = (uid: number | null, gap: boolean) => { try { localStorage.setItem(KHOA_GAP(uid), gap ? '1' : '0'); } catch { /* không lưu được: lần sau về mặc định */ } };
const NGUONG_GAP = 10;

const gomTheoLop = (ds: readonly PaDangChay[]): Nhom[] => {
  const m = new Map<string, Nhom>();
  for (const x of ds) {
    const k = x.classId != null ? `l${x.classId}` : `p${x.paId}`;   // PA không gắn lớp: một nhóm riêng
    const g = m.get(k);
    if (g) g.ds.push(x); else m.set(k, { khoa: k, classId: x.classId, lop: x.classCode, ds: [x] });
  }
  return [...m.values()].sort((a, b) => a.ds[0].han.localeCompare(b.ds[0].han) || (a.lop ?? '').localeCompare(b.lop ?? '') || a.ds[0].paId - b.ds[0].paId);
};

const NUT_MA = 'btn btn-sm min-h-[44px] w-fit justify-self-end border-transparent bg-transparent px-2.5 text-[13px] font-semibold text-[color:var(--accent)] hover:border-[color:var(--line-strong)] focus-visible:border-[color:var(--line-strong)] sm:min-h-[30px]';
const NHAN_NHAP = 'inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-md border border-dashed bg-transparent px-2.5 text-[13px] font-semibold tabular-nums text-dim hover:bg-[color:var(--surface-2)] sm:h-[30px] sm:min-h-[30px]';

/** Nhãn nháp (XM-6: viền đứt xám, không vàng — vàng đã là "gần hạn") hoặc nút "Ghi nháp" không viền. */
function NutNhap({ x, nhap, onBam }: { x: PaDangChay; nhap: NhapPaMoi; onBam: () => void }) {
  const { ngan } = useNgayNghiepVu();
  if (!nhap) return <button type="button" className={NUT_MA} aria-label={t('Ghi nháp: {ten}', { ten: x.studentName })} onClick={(e) => { e.stopPropagation(); onBam(); }}>{t('Ghi nháp')}</button>;
  const d = new Date(nhap.luc);
  const ngay = Number.isNaN(d.getTime()) ? '' : ngan(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  const buoi = nhap.soBuoi != null ? `${nhap.soBuoi}${nhap.buoiDuKien != null ? ` / ${nhap.buoiDuKien}` : ''}` : '';
  const chu = [t('nháp'), buoi && ` ${buoi}`, ngay && ` · ${ngay}`].filter(Boolean).join('');
  return <button type="button" className={NHAN_NHAP} aria-label={t('Mở nháp: {ten}', { ten: x.studentName })} onClick={(e) => { e.stopPropagation(); onBam(); }}>{chu}</button>;
}

const nhanKn = (x: PaDangChay) => [x.topic ? dich(caseTopicLabel(x.topic)) : null, x.dot].filter(Boolean).join(' · ');
const THE = 'h-5 truncate rounded-md px-1.5 text-xs font-medium leading-5 text-dim';
const The = ({ c }: { c: string }) => <span className={THE} style={{ background: 'var(--surface-2)' }} title={c}>{c}</span>;
const DONG = `grid min-h-[44px] cursor-pointer items-center gap-x-3 gap-y-0.5 px-3.5 py-2.5 sm:min-h-[50px] sm:px-4 sm:py-1.5 ${COT_VIEC}`;
const O_HAN = 'max-sm:col-start-1 max-sm:row-start-2';
const O_NUT = 'max-sm:col-start-2 max-sm:row-span-2 max-sm:row-start-1 max-sm:self-center';

const Av = () => (
  <span aria-hidden className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]"><IconNhom k="ca-lop" /></span>
);
const TEN = 'min-w-0 appearance-none border-0 bg-transparent p-0 text-left text-[15px] font-medium leading-snug text-[color:var(--text)]';

/** ponytail: 375 vẽ lại dòng (DongNho + dải lớp) thay vì một dòng co giãn — mockup D5 khác hẳn bố cục 1440; gộp khi có thêm màn dùng chung. */
/** 375: thẻ hai dòng — tên · hạn │ kỹ năng · PA · nhãn nháp (hai dòng đều cao ≥ 44). */
function DongNho({ k, chonDong, tren, duoi, han, nut, onBam }: { k: string; chonDong: boolean; tren: ReactNode; duoi: ReactNode; han: string; nut: ReactNode; onBam: () => void }) {
  return (
    <div data-hd="pdc-dong-nho" data-khoa={k} onClick={onBam} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-3.5 sm:hidden ${chonDong ? 'row-active' : 'bam'}`}>
      <span className="min-w-0 truncate text-[15px] text-[color:var(--text)]" title={typeof tren === 'string' ? tren : undefined}>{tren}</span>
      <span className="justify-self-end"><ChipHan vien loai="cap-nhat-pa" han={han} /></span>
      <span className="min-w-0 truncate text-[13px] text-dim" title={typeof duoi === 'string' ? duoi : undefined}>{duoi}</span>
      <span className="justify-self-end" onClick={(e) => e.stopPropagation()}>{nut}</span>
    </div>
  );
}

export function PaDangChayKhoi({ ds, uid, onMo, chon }: { ds: readonly PaDangChay[]; uid: number | null; onMo: (it: WorkItem) => void; chon: string | null }) {
  const [gap, setGap] = useState<boolean>(() => docGap(uid) ?? ds.length > NGUONG_GAP);
  const [moLop, setMoLop] = useState<ReadonlySet<string>>(new Set());
  const nhapMoi = useNhapPaMoi(ds);
  const { homNay, ngan } = useNgayNghiepVu();
  const nhom = useMemo(() => gomTheoLop(ds), [ds]);
  if (!ds.length) return null;   // không PA → không vẽ khối
  const nhapCua = (x: PaDangChay): NhapPaMoi => (nhapMoi.has(x.paId) ? nhapMoi.get(x.paId)! : x.nhap);
  const doiGap = () => { setGap((g) => { nhoGap(uid, !g); return !g; }); };
  const khay = (k: string) => setMoLop((s) => { const n = new Set(s); if (!n.delete(k)) n.add(k); return n; });
  const moPa = (x: PaDangChay) => onMo(viecTuPa(x, uid));
  return (
    <section data-muc="pa-dang-chay" className="card mt-3.5 overflow-clip p-0" aria-label={t('PA đang chạy')}>
      <DaiNhom k="pa-chay" nhan={t('PA đang chạy')} chip={t('{n} PA', { n: ds.length })} mo={!gap} onMo={doiGap} trungTinh chevPhai
        luat={<NutLuat label={t('Giải thích PA đang chạy')}>{t('PA bạn đang giữ, chưa tới hạn ghi kết quả. Tới hạn − 2 ngày PA chuyển lên nhóm Kết quả PA. Không tính vào số việc.')}</NutLuat>} />
      {!gap && (
        <ul className="m-0 list-none p-0">
          {nhom.map((g, i) => {
            const nhieu = g.ds.length > 1;
            const x0 = g.ds[0];
            const mo = moLop.has(g.khoa);
            const han = g.ds.map((x) => x.han).sort()[0];
            const ky = homNay ? kyGhiKetQua(han, homNay) : null;
            const key = nhieu ? `pdc-lop:${g.classId}` : `action:${x0.paId}`;
            const chonDong = chon === key;
            const tenDong = nhieu ? <><b className="font-semibold">{g.lop}</b> · {t('PA đang chạy')}</>
              : <>{g.lop ? <><b className="font-semibold">{g.lop}</b> · </> : null}{dichDu(x0.tenPa)}</>;
            return (
              <li key={g.khoa} className={i ? 'border-t' : ''} style={{ borderColor: 'var(--line)' }}>
                {/* 375 (mockup D5, R1.23): dải lớp cao 44 "MB FT 101 · 4 PA · hạn 24/11 ⌄" · thẻ hai dòng (tên · hạn │ kỹ năng · PA · nhãn nháp). */}
                {nhieu ? (
                  <div data-hd="pdc-dong-nho" data-khoa={key} className={`flex min-h-[44px] items-center gap-2 pl-3.5 pr-1 sm:hidden ${chonDong ? 'row-active' : ''}`}>
                    <button type="button" className="min-h-[44px] min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-left text-[15px] text-[color:var(--text)]" onClick={() => onMo(viecTuLop(g, uid))}>
                      <b className="font-semibold">{g.lop}</b> <span className="text-[13px] text-dim">· {t('{n} PA', { n: g.ds.length })} · {t('hạn {ngay}', { ngay: ngan(han) })}</span>
                    </button>
                    <button type="button" aria-expanded={mo} aria-label={t('{n} PA · {lop}', { n: g.ds.length, lop: g.lop ?? '' })} onClick={() => khay(g.khoa)}
                      className="inline-flex h-11 w-11 shrink-0 appearance-none items-center justify-center rounded-md border-0 bg-transparent text-dim">
                      <svg viewBox="0 0 16 16" aria-hidden className={`h-4 w-4 fill-none stroke-current motion-safe:transition-transform ${mo ? 'rotate-90' : ''}`} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5 10.5 8 6 12.5" /></svg></button>
                  </div>
                ) : (
                  <DongNho k={key} chonDong={chonDong} han={x0.han} onBam={() => moPa(x0)} nut={<NutNhap x={x0} nhap={nhapCua(x0)} onBam={() => moPa(x0)} />}
                    tren={<>{g.lop ? <b className="font-semibold">{g.lop} · </b> : null}{dichDu(x0.tenPa)}</>}
                    duoi={<><Link to={duongHoSoHocVien(x0.studentId)} onClick={(e) => e.stopPropagation()} className="text-dim no-underline hover:underline">{x0.studentName}</Link>{nhanKn(x0) ? ` · ${nhanKn(x0)}` : ''}</>} />
                )}
                <div data-hd="pdc-dong" data-khoa={key} className={`${DONG} max-sm:hidden ${chonDong ? 'row-active' : 'bam'}`}
                  onClick={() => (nhieu ? onMo(viecTuLop(g, uid)) : moPa(x0))}>
                  <span className="flex min-w-0 items-center gap-3 max-sm:items-start"><Av />
                    <span className="grid min-w-0 gap-0.5">
                      <button type="button" aria-current={chonDong ? 'true' : undefined} className={TEN}
                        onClick={(e) => { e.stopPropagation(); if (nhieu) onMo(viecTuLop(g, uid)); else moPa(x0); }}>{tenDong}</button>
                      <span className="flex min-w-0 flex-wrap items-center gap-[3px] sm:mt-[3px] sm:flex-nowrap sm:overflow-hidden">
                        {nhieu ? (ky && <The c={t('Kỳ {ky}', { ky })} />) : <>
                          <Link to={duongHoSoHocVien(x0.studentId)} onClick={(e) => e.stopPropagation()} className="rounded-md px-1.5 text-xs font-medium leading-5 text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" style={{ background: 'var(--surface-2)' }}>{x0.studentName}</Link>
                          {nhanKn(x0) && <The c={nhanKn(x0)} />}
                        </>}
                      </span>
                    </span></span>
                  <span className={`flex min-w-0 content-center justify-items-start text-[13px] leading-snug ${O_HAN}`}><ChipHan vien loai="cap-nhat-pa" han={han} /></span>
                  <span className={`flex flex-col items-stretch gap-1.5 ${O_NUT}`} onClick={(e) => e.stopPropagation()}>
                    {nhieu
                      ? <button type="button" className="btn btn-sm min-h-[44px] justify-center whitespace-nowrap px-2.5 text-[13px] font-semibold sm:h-[30px] sm:min-h-[30px]" aria-expanded={mo}
                        aria-label={t('{n} PA · {lop}', { n: g.ds.length, lop: g.lop ?? '' })} onClick={() => khay(g.khoa)}>{t('{n} PA', { n: g.ds.length })} <span aria-hidden className="ml-1 text-xs">{mo ? '▴' : '▾'}</span></button>
                      : <NutNhap x={x0} nhap={nhapCua(x0)} onBam={() => moPa(x0)} />}
                  </span>
                </div>
                {nhieu && mo && (
                  <ul className="m-0 list-none border-t border-dashed p-0 pb-1.5" style={{ borderColor: 'var(--line-strong)' }} aria-label={t('PA đang chạy · {lop}', { lop: g.lop ?? '' })}>
                    {g.ds.map((x, j) => {
                      const k2 = `action:${x.paId}`;
                      return (
                        <li key={x.paId} className={`${NET_CAY} max-sm:before:hidden max-sm:after:hidden ${j ? 'border-t' : ''}`} style={{ borderColor: 'var(--line)' }}>
                          <DongNho k={k2} chonDong={chon === k2} han={x.han} onBam={() => moPa(x)} nut={<NutNhap x={x} nhap={nhapCua(x)} onBam={() => moPa(x)} />}
                            tren={<Link to={duongHoSoHocVien(x.studentId)} onClick={(e) => e.stopPropagation()} className="ten-hv inline-flex min-h-[44px] items-center font-semibold text-[color:var(--text)] no-underline hover:underline">{x.studentName}</Link>}
                            duoi={[nhanKn(x), dichDu(x.tenPa)].filter(Boolean).join(' · ')} />
                          <div data-hd="pdc-em" data-khoa={k2} className={`${DONG} min-h-[48px] pl-8 max-sm:hidden sm:pl-8 ${chon === k2 ? 'row-active' : 'bam'}`} onClick={() => moPa(x)}>
                            <span className="grid min-w-0 gap-0.5">
                              <span className="flex min-w-0 items-baseline gap-2 text-[15px] leading-snug max-sm:items-center">
                                <Link to={duongHoSoHocVien(x.studentId)} onClick={(e) => e.stopPropagation()} className="shrink-0 font-semibold text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center">{x.studentName}</Link>
                                <span className="min-w-0 truncate font-normal text-dim max-sm:hidden">{dichDu(x.tenPa)}</span>
                              </span>
                              <span className="flex min-w-0 flex-wrap items-center gap-[3px] sm:mt-[3px]">{nhanKn(x) && <The c={nhanKn(x)} />}<span className="sm:hidden"><The c={dichDu(x.tenPa)} /></span></span>
                            </span>
                            <span className={`flex min-w-0 text-[13px] ${O_HAN}`}><ChipHan vien loai="cap-nhat-pa" han={x.han} /></span>
                            <span className={`flex flex-col items-stretch ${O_NUT}`} onClick={(e) => e.stopPropagation()}><NutNhap x={x} nhap={nhapCua(x)} onBam={() => moPa(x)} /></span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
