import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { NhanLich } from '../../ui/Nhan.tsx';
import { Skeleton } from '../../ui/ui.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { IconNhom } from './DanhSachViec.tsx';
import { lamTaiCho } from './lamTaiCho.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NHOM_CV_TVV, NHOM_CV_TVV_LABEL, duongHoSoHocVien, nhomViecTvvCua, type NhomViecTvv } from '@shared/domain/index.ts';
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

/** [XM-9] Tình trạng — ba loại, theo trạng thái (lời 40): Thi dd/mm (ngày đã chốt trong tháng) · Đã thi · chờ KQ · SOS n (em đang học). */
function tinhTrangCua(e: EmTvv, homNay: string) {
  const thi = e.thi && 'ngay' in e.thi && e.thi.ngay.slice(0, 7) === homNay.slice(0, 7) ? e.thi.ngay : null;
  if (!thi && !e.choKq && !e.sos) return null;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {thi && <NhanLich loai="co">{t('Thi {ngay}', { ngay: `${thi.slice(8, 10)}/${thi.slice(5, 7)}` })}</NhanLich>}
      {e.choKq && <NhanLich loai="da-thi">{t('Đã thi · chờ KQ')}</NhanLich>}
      {!!e.sos && <ChipSos muc={e.sos} hienKyNang={false} tinh />}
    </span>
  );
}

const COT = 'grid grid-cols-[160px_84px_150px_minmax(0,1fr)] items-center gap-x-3 px-4';

/**
 * HV CỦA TÔI — khung phải trang Công việc của TVV khi chưa chọn việc (GD-8, mockup v21 ④ K1, R4.3; cùng dáng "Lớp của tôi" của GV).
 * Cột: Học viên (link hồ sơ) · Lớp · Trạng thái (mockup "Tình trạng" — S3: một khái niệm một tên) · Việc cần làm (nút-chip "{nhóm} · {số}" không biểu tượng, đỏ khi quá hạn; "›" khi đổi trang).
 * Bấm chip = việc đầu (hạn sớm nhất) của nhóm đó của em: mở panel tại chỗ (`onMo`). Em không việc, không tình trạng gập "n em khác" ([XM-3]).
 * Ô "Tìm em": lọc tại máy trên danh sách đã nạp (cả nhóm gập). 375: mỗi em một thẻ, chip cao 44.
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
  const vach = khop ? -1 : chinh.findIndex((d) => !d.chip.length);
  return (
    <section className="card overflow-clip p-0" aria-labelledby="hv-cua-toi" data-hd="cv-hv-cua-toi">
      <div className="flex min-h-[48px] flex-wrap items-center gap-2 border-b border-l-[3px] pl-[13px] pr-2 bg-[color:var(--surface-2)] max-sm:py-2"
        style={{ borderBottomColor: 'var(--line)', borderLeftColor: 'var(--accent)' }}>
        <h2 id="hv-cua-toi" className="m-0 flex items-center gap-2 text-[15px] font-bold leading-snug">
          <span className="text-[color:var(--accent)]"><IconNhom k="lop" /></span>
          <span className="text-[color:var(--text)]">{t('HV của tôi')}</span>
          {!!em?.length && <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold tabular-nums text-[color:var(--text)]"
            style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>{t('{n} em', { n: em.length })}</span>}
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
          : !em?.length ? <p className="m-0 px-4 py-6 text-[15px] text-dim">{t('Chưa có học viên nào do bạn phụ trách.')}</p>
            : <>
              <div className={`${COT} min-h-[34px] border-b text-xs font-semibold text-faint max-sm:hidden`} style={{ borderColor: 'var(--line)' }} aria-hidden>
                <span>{t('Học viên')}</span><span>{t('Lớp')}</span><span>{t('Trạng thái')}</span><span>{t('Việc cần làm')}</span>
              </div>
              {khop && !khop.length ? <p className="m-0 px-4 py-5 text-[15px] text-dim">{t('Không thấy em nào khớp.')}</p> : (
                <ul className="m-0 list-none p-0">
                  {chinh.map((d, i) => <DongEm key={d.em.id} d={d} dau={i === 0} ranh={i === vach && i > 0} homNay={homNay} onMo={onMo} />)}
                </ul>
              )}
              {khac.length > 0 && (
                <>
                  <button type="button" aria-expanded={moKhac} onClick={() => setMoKhac((x) => !x)}
                    className="flex min-h-[44px] w-full appearance-none items-center gap-2 border-0 border-t bg-transparent px-4 text-left text-sm font-semibold text-dim hover:text-[color:var(--text)]"
                    style={{ borderColor: 'var(--line-strong)' }}>
                    <IconGap mo={moKhac} />{t('{n} em khác', { n: khac.length })}
                  </button>
                  {moKhac && <ul className="m-0 list-none border-t p-0" style={{ borderColor: 'var(--line)' }}>
                    {khac.map((d, i) => <DongEm key={d.em.id} d={d} dau={i === 0} ranh={false} homNay={homNay} onMo={onMo} nhat />)}
                  </ul>}
                </>
              )}
            </>}
    </section>
  );
}

function DongEm({ d, dau, ranh, homNay, onMo, nhat = false }: { d: Dong; dau: boolean; ranh: boolean; homNay: string; onMo: (x: WorkItem) => void; nhat?: boolean }) {
  const e = d.em;
  return (
    <li className={`${COT} min-h-[52px] py-[7px] ${dau ? '' : 'border-t'} max-sm:flex max-sm:flex-col max-sm:items-start max-sm:gap-1.5 max-sm:py-3`}
      style={{ borderColor: ranh ? 'var(--line-strong)' : 'var(--line)' }}>
      <Link to={duongHoSoHocVien(e.id)} className={`min-w-0 max-w-full truncate text-[15px] leading-normal no-underline hover:!text-[color:var(--accent)] hover:underline ${nhat ? 'font-medium !text-[color:var(--text-dim)]' : 'font-semibold !text-[color:var(--text)]'}`}>{e.ten}</Link>
      <span className="truncate whitespace-nowrap text-[13px] text-dim">
        {e.lop.length ? e.lop.map((l, i) => <span key={l.id}>{i > 0 && ', '}<Link to={`/hoc-vien/lop/${l.id}`} className="!text-[color:var(--text-dim)] no-underline hover:underline">{l.ma}</Link></span>) : '—'}
      </span>
      <span className="min-w-0 max-sm:empty:hidden">{tinhTrangCua(e, homNay)}</span>
      <span className="flex flex-wrap gap-1.5 max-sm:w-full max-sm:empty:hidden">
        {d.chip.map((c) => {
          const nhan = NHOM_CV_TVV_LABEL[c.nhom];
          const lop = `inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-[13px] font-semibold no-underline max-sm:h-11 max-sm:px-3 max-sm:text-sm ${c.quaHan
            ? 'border-late-line bg-late-bg !text-late hover:brightness-110' : 'surface-2 !text-[color:var(--text)] hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]'}`;
          const vien = c.quaHan ? undefined : { borderColor: 'var(--line-strong)' };
          /* [XM-4] Bổ sung hồ sơ: một dòng tổng nhiều em — chip sang hồ sơ em (Sửa thông tin ở đầu hồ sơ của TVV), không số. */
          if (!c.dau) return <Link key={c.nhom} to={duongHoSoHocVien(e.id)} className={lop} style={vien} aria-label={`${nhan} · ${e.ten}`}>{nhan}<span aria-hidden> ›</span></Link>;
          return (
            <button key={c.nhom} type="button" onClick={() => onMo(c.dau!)} className={lop} style={vien}
              aria-label={`${c.quaHan ? `${t('Quá hạn')}: ` : ''}${nhan} · ${c.so} · ${e.ten}`}>
              {nhan} · <span className="tabular-nums">{c.so}</span>{!lamTaiCho(c.dau) && <span aria-hidden> ›</span>}
            </button>
          );
        })}
      </span>
    </li>
  );
}
