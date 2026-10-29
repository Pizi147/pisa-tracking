import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { nhomLopPc, oDongPc, tenMonNgan, type ChonDongPc, type LopPc } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * THẺ LỚP < 1024 px (mockup v9 khu 1, 3 — 375; 768–1023 dùng cùng thẻ, lưới 2 cột từ 640): đầu thẻ mã lớp (link) + phụ + "Sửa"; người dạy
 * GOM THEO GV ("L · R · GVCN  Ms. Hà Hoàng", Pre FOU "GVCN · dạy luôn", "– Chưa có" vàng). "Sửa" → ô từng môn 44 px (một thẻ sửa một lúc),
 * chân thẻ Huỷ · Lưu chia đôi. CX: không "Sửa".
 */
export function TheLopPc({ lop, tong, chiXem, chon, ten, nghi, to, dangSua, phu, o, cuoi, lopThe, onSua }: {
  lop: LopPc[]; tong: LopPc[]; chiXem: boolean; chon: (l: LopPc) => ChonDongPc; ten: (id: number) => string; nghi: (id: number) => boolean;
  to: number | null; dangSua: number | null; phu: (l: LopPc) => ReactNode; o: (l: LopPc, khoa: string) => ReactNode;
  cuoi: (l: LopPc) => ReactNode; lopThe: (l: LopPc) => string; onSua: (l: LopPc) => void;
}) {
  const n = nhomLopPc(lop);
  const nt = nhomLopPc(tong);
  const nhan = (l: LopPc, k: string) => (k === 'gvcn' ? (oDongPc(l).length === 1 ? t('GVCN · dạy luôn') : t('GVCN')) : tenMonNgan(l.ct, k));
  const the = (l: LopPc) => {
    const c = chon(l);
    const sua = dangSua === l.id;
    /* Gom theo người: thứ tự ô môn rồi GVCN (mockup), ô trống mỗi ô một dòng. */
    const khoa = [...oDongPc(l).filter((k) => k !== 'gvcn'), 'gvcn'];
    const gom: { id: number | ''; nhan: string[] }[] = [];
    for (const k of khoa) {
      const id = c[k] ?? '';
      const x = id ? gom.find((g) => g.id === id) : undefined;
      if (x) x.nhan.push(nhan(l, k)); else gom.push({ id, nhan: [nhan(l, k)] });
    }
    return (
      <article key={l.id} className={`pc-the-lop ${lopThe(l)}`}>
        <div className="lop-dau">
          <Link to={`/hoc-vien/lop/${l.id}`} className="ten-ho-so khong-mui pc-ten-lop">{l.code}</Link>
          {phu(l)}
          {!chiXem && !sua && <button type="button" className="btn btn-sm" aria-label={t('Sửa phân công {lop}', { lop: l.code })} onClick={() => onSua(l)}>{t('Sửa')}</button>}
        </div>
        {sua ? (
          <div className="pc-luoi-sua">
            {khoa.map((k) => <Fragment key={k}><span className="nhan">{nhan(l, k)}</span><div className="min-w-0">{o(l, k)}</div></Fragment>)}
          </div>
        ) : (
          <dl className="pc-gv-ds">
            {gom.map((g, i) => {
              const laTo = g.id !== '' && g.id === to;
              return (
                <Fragment key={i}>
                  <dt className={laTo ? 'to' : ''}>{g.nhan.join(' · ')}</dt>
                  {g.id === '' ? <dd className="trong">– {t('Chưa có')}</dd>
                    : <dd className={`${laTo ? 'to' : ''} ${nghi(g.id) ? 'trong' : ''}`}>{ten(g.id)}{nghi(g.id) ? ` · ${t('đã nghỉ')}` : ''}</dd>}
                </Fragment>
              );
            })}
          </dl>
        )}
        {cuoi(l)}
      </article>
    );
  };
  return (
    <>
      {n.ft.length > 0 && (
        <>
          <div className="pc-nhom-1 gon">Fast Track <span className="pc-dem-n">{t('{n} lớp', { n: nt.ft.length })}</span></div>
          <div className="pc-ds-lop">{n.ft.map(the)}</div>
        </>
      )}
      {n.thuong.length > 0 && (
        <>
          <div className="pc-nhom-1 gon">{t('Lớp thường')} <span className="pc-dem-n">{t('{n} lớp', { n: tong.filter((l) => !l.ft).length })}</span></div>
          {n.thuong.map((g) => (
            <Fragment key={g.ct}>
              <div className="pc-nhom-2 gon">{g.ten} <span className="pc-dem-n">{t('{n} lớp', { n: nt.thuong.find((x) => x.ct === g.ct)?.lop.length ?? g.lop.length })}</span></div>
              <div className="pc-ds-lop">{g.lop.map(the)}</div>
            </Fragment>
          ))}
        </>
      )}
    </>
  );
}
