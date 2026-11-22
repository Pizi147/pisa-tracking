import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { DauQuaHan, NhanLich } from '../../ui/Nhan.tsx';
import { Skeleton } from '../../ui/ui.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { IconNhom } from './DanhSachViec.tsx';
import { lamTaiCho } from './lamTaiCho.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NHOM_CV_TVV, NHOM_CV_TVV_LABEL, duongHoSoHocVien, nhomViecTvvCua, type NhomViecTvv, ngay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Em của TVV (`GET /tong-quan/tvv/em`, máy chủ `hvCuaToi.ts` `EmTvv`). */
export type EmTvv = {
  id: number; ten: string; status: 'active' | 'inactive' | 'finished'; lop: { id: number; ma: string }[];
  thi?: { ngay: string } | { tuan: string } | { thang: string }; sos?: number; choKq?: true; choBuocTiep?: true;
};

type Chip = { nhom: NhomViecTvv; so: number; quaHan: boolean; dau: WorkItem | null };
type Dong = { em: EmTvv; chip: Chip[]; tinhTrang: boolean };

const nang = (u: WorkItem['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
const xepHan = (a: WorkItem, b: WorkItem) => nang(a.urgency) - nang(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999');

/**
 * Dựng dòng "HV của tôi" — dữ liệu ĐÃ NẠP (`/tong-quan/tvv/em` + `/my-work`), không request thêm ([XM-13]). Chip theo NHÓM việc TVV, cùng thứ tự tab
 * (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ — [XM-5]); số = số việc của em trong nhóm; quá hạn đỏ (V22: chỉ màu). "Bổ sung hồ sơ" là một dòng
 * tổng nhiều em (`emIds`) — chip không số, đổi trang sang hồ sơ em ([XM-4]). Xếp: em có việc (hạn sớm nhất trước) → em chỉ có tình trạng → còn lại.
 */
export function dungHvCuaToi(em: readonly EmTvv[], viec: readonly WorkItem[], homNay: string): Dong[] {
  const la = viec.flatMap((x) => (x.con?.length ? x.con : [x]));
  const ds = em.map((e): Dong => {
    const chip: Chip[] = [];
    for (const nhom of NHOM_CV_TVV) {
      if (nhom === 'bo-sung') {
        if (la.some((x) => x.group === 'bo_sung_ho_so' && (x.emIds ?? []).includes(e.id))) chip.push({ nhom, so: 0, quaHan: false, dau: null });
        continue;
      }
      const cua = la.filter((x) => x.studentId === e.id && x.group !== 'bo_sung_ho_so' && nhomViecTvvCua(x.group) === nhom).sort(xepHan);
      if (cua.length) chip.push({ nhom, so: cua.length, quaHan: cua.some((x) => x.urgency === 'overdue'), dau: cua[0] });
    }
    return { em: e, chip, tinhTrang: !!tinhTrangCua(e, homNay) };
  });
  const hanSom = (d: Dong) => d.chip.map((c) => c.dau).filter((x): x is WorkItem => !!x).sort(xepHan)[0];
  const hang = (d: Dong) => (d.chip.length ? 0 : d.tinhTrang ? 1 : 2);
  return ds.sort((a, b) => hang(a) - hang(b) || (hang(a) === 0 ? xepHanNull(hanSom(a), hanSom(b)) : 0) || a.em.ten.localeCompare(b.em.ten, 'vi'));
}
const xepHanNull = (a: WorkItem | undefined, b: WorkItem | undefined) => (a && b ? xepHan(a, b) : a ? -1 : b ? 1 : 0);

/** [XM-9] Tình trạng — NHẸ HƠN PR-2a (v23 ③ vòng 3): MỘT chip / em, ưu tiên SOS → Đã thi · chờ KQ → Thi dd/mm/yyyy (ngày đã chốt trong tháng). */
function tinhTrangCua(e: EmTvv, homNay: string) {
  const thi = e.thi && 'ngay' in e.thi && e.thi.ngay.slice(0, 7) === homNay.slice(0, 7) ? e.thi.ngay : null;
  if (e.sos) return <ChipSos muc={e.sos} hienKyNang={false} tinh />;
  if (e.choKq) return <NhanLich loai="da-thi">{t('Đã thi · chờ KQ')}</NhanLich>;
  if (thi) return <NhanLich loai="co">{t('Thi {ngay}', { ngay: ngay(thi) })}</NhanLich>;
  return null;
}

const COT = 'grid grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-x-3 px-4';

/**
 * HV CỦA TÔI — khung phải trang Công việc của TVV khi chưa chọn việc (GD-8; NHẸ HƠN PR-2a mockup v23 ③ vòng 3: NHÓM THEO LỚP).
 * Hàng nhóm "MB FOU 12 · 12 em" (nền nhạt) · em: tên (link hồ sơ) · MỘT chip trạng thái · số việc (đỏ + ⚠ khi quá hạn; bấm = mở việc gấp nhất của em tại chỗ).
 * Em học nhiều lớp đứng ở lớp đầu. Em không việc, không tình trạng gập "n em khác" ([XM-3]). "Tìm em" lọc tại máy. 375 cùng kiểu, số cao 44.
 */
export function HvCuaToi({ em, viec, onMo, dangTai, loi }: {
  em: readonly EmTvv[] | undefined; viec: readonly WorkItem[]; onMo: (x: WorkItem) => void; dangTai: boolean; loi: React.ReactNode;
}) {
  const { homNay } = useNgayNghiepVu();
  const [tim, setTim] = useState('');
  const [moKhac, setMoKhac] = useState(false);
  const dong = useMemo(() => dungHvCuaToi(em ?? [], viec, homNay), [em, viec, homNay]);
  const q = tim.trim().toLocaleLowerCase('vi');
  const khop = q ? dong.filter((d) => d.em.ten.toLocaleLowerCase('vi').includes(q)) : null;
  const chinh = khop ?? dong.filter((d) => d.chip.length || d.tinhTrang);
  const khac = khop ? [] : dong.filter((d) => !d.chip.length && !d.tinhTrang);
  /* Sĩ số nhóm = mọi em của TVV ở lớp đó (cả em gập ở "n em khác"). */
  const siSo = useMemo(() => {
    const m = new Map<number, number>();
    for (const d of dong) { const id = d.em.lop[0]?.id ?? 0; m.set(id, (m.get(id) ?? 0) + 1); }
    return m;
  }, [dong]);
  return (
    <section className="card overflow-clip p-0" aria-labelledby="hv-cua-toi" data-hd="cv-hv-cua-toi">
      <div className="flex min-h-[48px] flex-wrap items-center gap-2 border-b border-l-[3px] pl-[13px] pr-2 bg-[color:var(--surface-2)] max-sm:py-2"
        style={{ borderBottomColor: 'var(--line)', borderLeftColor: 'var(--accent)' }}>
        <h2 id="hv-cua-toi" className="m-0 flex items-baseline gap-2 text-[16px] font-bold leading-snug">
          <span className="text-[color:var(--text)]">{t('HV của tôi')}</span>
          {!!em?.length && <span className="text-[13px] font-medium tabular-nums text-dim">{t('{n} em', { n: em.length })}</span>}
        </h2>
        {!!em?.length && (
          <label className="ml-auto flex h-[34px] w-[200px] items-center gap-1.5 rounded-lg border px-2.5 text-faint focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)] max-sm:ml-0 max-sm:h-11 max-sm:w-full"
            style={{ borderColor: 'var(--o-nhap-vien)', background: 'var(--o-nhap-nen)' }}>
            <IconNhom k="tim" />
            <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder={t('Tìm em')} aria-label={t('Tìm em')} autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[color:var(--text)] outline-none placeholder:text-faint max-sm:text-base" />
          </label>
        )}
      </div>
      {loi ? <div className="p-4">{loi}</div>
        : dangTai ? <div className="p-4"><Skeleton rows={5} /></div>
          : !em?.length ? <p className="m-0 px-4 py-6 text-[14px] text-dim">{t('Chưa có học viên nào do bạn phụ trách.')}</p>
            : <>
              {khop && !khop.length ? <p className="m-0 px-4 py-5 text-[14px] text-dim">{t('Không thấy em nào khớp.')}</p>
                : <>
                  <div className={`${COT} min-h-[30px] border-b text-xs font-semibold text-faint`} style={{ borderColor: 'var(--line)' }} aria-hidden>
                    <span>{t('Học viên')}</span><span>{t('Trạng thái')}</span><span className="text-right">{t('Việc')}</span>
                  </div>
                  <NhomLop ds={chinh} siSo={siSo} homNay={homNay} onMo={onMo} />
                </>}
              {khac.length > 0 && (
                <>
                  <button type="button" aria-expanded={moKhac} onClick={() => setMoKhac((x) => !x)}
                    className="flex min-h-[44px] w-full appearance-none items-center gap-2 border-0 border-t bg-transparent px-4 text-left text-sm font-semibold text-dim hover:text-[color:var(--text)]"
                    style={{ borderColor: 'var(--line-strong)' }}>
                    <IconGap mo={moKhac} />{t('{n} em khác', { n: khac.length })}
                  </button>
                  {moKhac && <div className="border-t" style={{ borderColor: 'var(--line)' }}><NhomLop ds={khac} siSo={siSo} homNay={homNay} onMo={onMo} nhat /></div>}
                </>
              )}
            </>}
    </section>
  );
}

/** Nhóm theo lớp đầu của em — thứ tự nhóm = thứ tự em gấp nhất (danh sách đã xếp hạn). */
function NhomLop({ ds, siSo, homNay, onMo, nhat = false }: {
  ds: readonly Dong[]; siSo: ReadonlyMap<number, number>; homNay: string; onMo: (x: WorkItem) => void; nhat?: boolean;
}) {
  const nhom = new Map<number, { id: number; ma: string; em: Dong[] }>();
  for (const d of ds) {
    const l = d.em.lop[0] ?? { id: 0, ma: '—' };
    (nhom.get(l.id) ?? nhom.set(l.id, { id: l.id, ma: l.ma, em: [] }).get(l.id)!).em.push(d);
  }
  return (
    <ul className="m-0 list-none p-0">
      {[...nhom.values()].map((g, gi) => (
        <li key={g.id} className={gi ? 'border-t' : ''} style={{ borderColor: 'var(--line-strong)' }}>
          <div className="flex min-h-[34px] items-center gap-1.5 bg-[color:var(--surface-2)] px-4 text-[13px]">
            {g.id ? <Link to={`/hoc-vien/lop/${g.id}`} className="font-bold !text-[color:var(--text)] no-underline hover:underline">{g.ma}</Link> : <b>{g.ma}</b>}
            <span className="text-dim">· {t('{n} em', { n: siSo.get(g.id) ?? g.em.length })}</span>
          </div>
          <ul className="m-0 list-none p-0">{g.em.map((d) => <DongEm key={d.em.id} d={d} homNay={homNay} onMo={onMo} nhat={nhat} />)}</ul>
        </li>
      ))}
    </ul>
  );
}

function DongEm({ d, homNay, onMo, nhat = false }: { d: Dong; homNay: string; onMo: (x: WorkItem) => void; nhat?: boolean }) {
  const e = d.em;
  const so = d.chip.reduce((n, c) => n + (c.dau ? c.so : 0), 0);
  const quaHan = d.chip.some((c) => c.quaHan);
  const dau = d.chip.map((c) => c.dau).filter((x): x is WorkItem => !!x).sort(xepHan)[0] ?? null;
  const boSung = d.chip.some((c) => !c.dau);
  const chu = d.chip.map((c) => (c.dau ? `${NHOM_CV_TVV_LABEL[c.nhom]} · ${c.so}` : NHOM_CV_TVV_LABEL[c.nhom])).join(', ');
  /* v23 ③: số việc là CHỮ SỐ (không ô) — đỏ + ⚠ khi quá hạn; vẫn là nút (bấm mở việc), vùng bấm 44 ở 375. */
  const lopSo = `inline-flex h-7 min-w-[32px] items-center justify-end gap-0.5 rounded-md border-0 bg-transparent px-1 text-[13px] font-semibold tabular-nums no-underline hover:bg-[color:var(--accent-soft)] max-sm:h-11 max-sm:min-w-[44px] ${quaHan
    ? 'text-late' : '!text-[color:var(--text)]'}`;
  const vien = undefined;
  return (
    <li className={`${COT} min-h-[44px] border-t py-1`} style={{ borderColor: 'var(--line)' }}>
      <Link to={duongHoSoHocVien(e.id)} className={`ten-hv min-w-0 text-[14px] leading-normal no-underline hover:!text-[color:var(--accent)] hover:underline ${nhat ? 'font-medium !text-[color:var(--text-dim)]' : 'font-semibold !text-[color:var(--text)]'}`}>{e.ten}</Link>
      <span className="min-w-0 empty:hidden">{tinhTrangCua(e, homNay)}</span>
      <span className="col-start-3 flex justify-end">
        {dau ? (
          <button type="button" onClick={() => onMo(dau)} className={lopSo} style={vien} title={chu}
            aria-label={`${quaHan ? `${t('Quá hạn')}: ` : ''}${chu} · ${e.ten}`}>{quaHan && <DauQuaHan />}{so}{!lamTaiCho(dau) && <span aria-hidden>›</span>}</button>
        ) : boSung ? (
          /* [XM-4] Bổ sung hồ sơ: một dòng tổng nhiều em — sang hồ sơ em (`?viec=bo-sung` mở sẵn panel). */
          <Link to={duongHoSoHocVien(e.id, { viec: 'bo-sung' })} className={lopSo} style={vien} title={chu} aria-label={`${chu} · ${e.ten}`}>›</Link>
        ) : <span className="pr-1 text-faint" aria-hidden>—</span>}
      </span>
    </li>
  );
}
