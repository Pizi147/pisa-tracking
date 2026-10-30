import { Fragment, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bang, OBang, type CotBang } from '../../../ui/Bang.tsx';
import { cotLop, nhomLopPc, tenMon, type LopPc } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Phần vẽ theo dòng do góc cấp (trạng thái nháp / lưu / lỗi nằm ở `GocPhanCongGv`). */
export type VeDongPc = {
  o: (l: LopPc, khoa: string, hang: number, cot: number) => ReactNode;
  phu: (l: LopPc) => ReactNode;
  cuoi: (l: LopPc) => ReactNode;
  lop: (l: LopPc) => string;
  loiHang: (l: LopPc) => ReactNode;
  onPhim: (l: LopPc, e: KeyboardEvent) => void;
};

/**
 * BẢNG LỚP 1440 (mockup v9 khu 1): dải nhóm "Fast Track · n lớp" / "Lớp thường · n lớp" → nhóm con theo chương trình (tiêu đề cột riêng) → dòng lớp.
 * Cột Lớp 200 px · GVCN 184 px · cột nút dòng 120 px ở MỌI nhóm (trừ chỉ xem) → GVCN thẳng hàng giữa các nhóm (chủ SP 31/10) · cột môn chia đều phần còn lại.
 * GVCN luôn cột cuối, nền `surface-2` cả cột + vạch nhấn trái (`data-tinh`, chủ SP 30/10). `tong` = số lớp của cả chi nhánh theo nhóm (dòng lọc
 * không đổi số nhóm — mockup). Phím ← ↑ → ↓ đi giữa ô (`data-o`), Enter / Space mở, Ctrl + Enter lưu dòng.
 */
export function BangLopPc({ lop, tong, chiXem, ve, duoiThe }: {
  lop: LopPc[]; tong: LopPc[]; chiXem: boolean; ve: VeDongPc; duoiThe?: ReactNode;
}) {
  const n = nhomLopPc(lop);
  const nt = nhomLopPc(tong);
  /* Số dòng trước mỗi nhóm — chỉ số hàng của phím mũi tên (`data-o`) liền mạch qua các nhóm. */
  const thuTu = [...n.ft, ...n.thuong.flatMap((g) => g.lop)];
  const bang = (ds: LopPc[], ten: string) => {
    const mau = cotLop(ds[0]).filter(Boolean);
    /* Không chừa cột môn trống (nhóm 4 kỹ năng); cột nút luôn có để cột không thụt ra thụt vào khi một dòng vào nháp (chủ SP 31/10). */
    const soMon = Math.max(1, mau.length);
    const coLuu = !chiXem;
    const cot: CotBang[] = [
      { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 200 },
      ...Array.from({ length: soMon }, (_, i): CotBang => ({ key: `m${i}`, nhan: mau[i]?.nhan ?? '', kieu: 'chu', goiY: mau[i] ? tenMon(ds[0].ct, mau[i]!.khoa) : undefined })),
      { key: 'gvcn', nhan: t('GVCN'), kieu: 'chu', tinh: true },
      ...(coLuu ? [{ key: 'luu', nhan: '', kieu: 'nut', rong: 120 } as CotBang] : []),
    ];
    return (
      <div className={`pc-bang ${coLuu ? 'co-luu' : ''}`}>
        <Bang ten={ten} cot={cot} hang={ds} khoa={(l) => l.id} khung={false} the375={false}
          hangRieng={(l) => {
            const h = thuTu.indexOf(l);
            const mon = cotLop(l).filter(Boolean);
            return (
              <Fragment key={l.id}>
                <tr className={ve.lop(l)} onKeyDown={(e) => ve.onPhim(l, e)}>
                  <OBang c={cot[0]} className="pc-lop">
                    <Link to={`/hoc-vien/lop/${l.id}`} className="ten-ho-so khong-mui pc-ten-lop">{l.code}</Link>
                    {ve.phu(l)}
                  </OBang>
                  {mon.length === 0
                    ? <OBang c={cot[1]} colSpan={soMon} className="pc-khong-mon">{t('Không chia môn — GVCN dạy luôn')}</OBang>
                    : cot.slice(1, 1 + soMon).map((c, i) => <OBang key={c.key} c={c}>{mon[i] ? ve.o(l, mon[i]!.khoa, h, i) : null}</OBang>)}
                  <OBang c={cot[1 + soMon]}>{ve.o(l, 'gvcn', h, 5)}</OBang>
                  {coLuu && <OBang c={cot[2 + soMon]}>{ve.cuoi(l)}</OBang>}
                </tr>
                {ve.loiHang(l) && (
                  <tr className="pc-loi-hang"><td colSpan={cot.length}><div role="alert" className="bao">{ve.loiHang(l)}</div></td></tr>
                )}
              </Fragment>
            );
          }} />
      </div>
    );
  };
  return (
    <>
      {n.ft.length > 0 && (
        <>
          <div className="pc-nhom-1">Fast Track <span className="pc-dem-n">{t('{n} lớp', { n: nt.ft.length })}</span></div>
          {bang(n.ft, 'Fast Track')}
        </>
      )}
      {n.thuong.length > 0 && (
        <>
          <div className="pc-nhom-1">{t('Lớp thường')} <span className="pc-dem-n">{t('{n} lớp', { n: tong.filter((l) => !l.ft).length })}</span></div>
          {n.thuong.map((g) => (
            <Fragment key={g.ct}>
              <div className="pc-nhom-2">{g.ten} <span className="ma-ct">{g.ct === 'PREFOU' ? 'Pre FOU' : g.ct}</span>
                <span className="pc-dem-n">{t('{n} lớp', { n: nt.thuong.find((x) => x.ct === g.ct)?.lop.length ?? g.lop.length })}</span></div>
              {bang(g.lop, `${g.ten}`)}
            </Fragment>
          ))}
        </>
      )}
      {duoiThe}
    </>
  );
}
