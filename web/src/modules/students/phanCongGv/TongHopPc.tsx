import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bang, OBang, type CotBang } from '../../../ui/Bang.tsx';
import { NutLuat } from '../../../ui/NutLuat.tsx';
import { hangTongHop, type DemGv, type GvPc, type HangTongHopPc } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Số "cũ → mới" khi nháp đổi số (màu nhấn); bằng nhau → một số, 0 xám. */
export function SoCuMoi({ cu, moi }: { cu: number; moi: number }) {
  if (cu !== moi) return <span className="pc-so-nhap">{cu} → {moi}</span>;
  return cu ? <>{cu}</> : <span className="pc-so0">0</span>;
}

type XepPc = 'tong' | 'ft' | 'th' | 'ten';
const CACH_DEM = 'Bấm tên GV để tô các ô của GV đó ở bảng lớp. Cách đếm: mỗi môn của một lớp là 1 — W1, W2 tính riêng; dạy L và R một lớp = 2. Lớp Pre FOU: GVCN dạy luôn = 1. Đếm người đang dạy hôm nay — ô chờ đổi tính từ tuần hiệu lực.';

/**
 * HAI BẢNG TỔNG HỢP (mockup v9 khu 1–2): Giảng dạy (số môn đang dạy) · GVCN (số lớp chủ nhiệm), cột GV · FT · Lớp thường · Tổng + dòng Tổng.
 * Một nguồn: `demPhanCong` của bảng lớp đã lưu (`dem`) và tính cả nháp (`demNhap`) — khác nhau thì ô hiện "cũ → mới". Tên GV = nút bật tô
 * (`aria-pressed`); "Xếp: Tổng ▾" ngoài tiêu đề bảng (G9). 375: 6 / 4 dòng đầu + "Xem đủ n GV".
 */
export function TongHopPc({ dem, demNhap, gv, to, onTo, gon }: {
  dem: Map<number, DemGv>; demNhap: Map<number, DemGv>; gv: GvPc[]; to: number | null; onTo: (id: number | null) => void; gon: boolean;
}) {
  return (
    <div className="pc-hai-tong">
      <BangTong loai="day" dem={dem} demNhap={demNhap} gv={gv} to={to} onTo={onTo} toiDa={gon ? 6 : null} />
      <BangTong loai="cn" dem={dem} demNhap={demNhap} gv={gv} to={to} onTo={onTo} toiDa={gon ? 4 : null} />
    </div>
  );
}

function BangTong({ loai, dem, demNhap, gv, to, onTo, toiDa }: {
  loai: 'day' | 'cn'; dem: Map<number, DemGv>; demNhap: Map<number, DemGv>; gv: GvPc[]; to: number | null; onTo: (id: number | null) => void; toiDa: number | null;
}) {
  const [xep, setXep] = useState<XepPc>('tong');
  const [du, setDu] = useState(false);
  const rows = hangTongHop(demNhap, gv, loai, xep);
  const cu = new Map(hangTongHop(dem, gv, loai, 'ten').map((r) => [r.id, r]));
  const hien = toiDa && !du ? rows.slice(0, toiDa) : rows;
  const tieu = loai === 'day' ? t('Giảng dạy') : t('GVCN');
  const cot: CotBang[] = [
    { key: 'gv', nhan: t('GV'), kieu: 'ten', linhHoat: true },   // co giãn + cắt "…": bảng 375 vừa 343 px, không cuộn ngang
    { key: 'ft', nhan: 'FT', kieu: 'so', rong: toiDa ? 48 : 92 },
    { key: 'th', nhan: t('Lớp thường'), kieu: 'so', rong: toiDa ? 86 : 120 },
    { key: 'tong', nhan: t('Tổng'), kieu: 'so', rong: toiDa ? 52 : 92 },
  ];
  const so = (r: HangTongHopPc, k: 'a' | 'b' | 'tong') => <SoCuMoi cu={cu.get(r.id)?.[k] ?? 0} moi={r[k]} />;
  const tongCot = (k: 'a' | 'b' | 'tong') => [...cu.values()].reduce((n, r) => n + r[k], 0);
  const tongMoi = (k: 'a' | 'b' | 'tong') => rows.reduce((n, r) => n + r[k], 0);
  return (
    <section className="card pc-the-tong" aria-label={tieu}>
      <div className="pc-the-dau">
        <h2>{tieu}</h2>
        <span className="phu">{loai === 'day' ? t('số môn đang dạy') : t('số lớp chủ nhiệm')}</span>
        <NutLuat label={t('Cách đếm')}>{loai === 'day' ? t(CACH_DEM) : t('Bấm tên GV để tô các lớp GV đó chủ nhiệm. Đếm GVCN hôm nay — ô chờ đổi tính từ tuần hiệu lực.')}</NutLuat>
        <span className="phai">
          <select className="pc-xep" aria-label={t('Xếp theo')} value={xep} onChange={(e) => setXep(e.target.value as XepPc)}>
            <option value="tong">{t('Xếp: Tổng')}</option>
            <option value="ft">{t('Xếp: FT')}</option>
            <option value="th">{t('Xếp: Lớp thường')}</option>
            <option value="ten">{t('Xếp: Tên')}</option>
          </select>
        </span>
      </div>
      <div className="pc-bang-tong">
        <Bang ten={tieu} cot={cot} hang={hien} khoa={(r) => r.id} khung={false} the375={false} lopHang={(r) => (r.id === to ? 'dang-to' : '')}
          oCua={(r, c) => (c.key === 'gv'
            ? <>
                <button type="button" className="pc-nut-gv" aria-pressed={r.id === to} title={t('Tô các ô của GV này')} onClick={() => onTo(r.id === to ? null : r.id)}>{r.ten}</button>
                {r.nghi && <span className="pc-nhan-nghi">{t('đã nghỉ')}</span>}
              </>
            : so(r, c.key === 'ft' ? 'a' : c.key === 'th' ? 'b' : 'tong'))}
          cuoi={!toiDa || du ? (
            <tr className="pc-tong-chan">
              <OBang c={cot[0]}>{t('Tổng')}</OBang>
              <OBang c={cot[1]}><SoCuMoi cu={tongCot('a')} moi={tongMoi('a')} /></OBang>
              <OBang c={cot[2]}><SoCuMoi cu={tongCot('b')} moi={tongMoi('b')} /></OBang>
              <OBang c={cot[3]}><SoCuMoi cu={tongCot('tong')} moi={tongMoi('tong')} /></OBang>
            </tr>
          ) : undefined} />
      </div>
      {toiDa && rows.length > toiDa && (
        <div className="pc-xem-du"><button type="button" className="btn btn-sm btn-ghost" onClick={() => setDu((v) => !v)}>{du ? t('Thu gọn') : t('Xem đủ {n} GV', { n: rows.length })}</button></div>
      )}
    </section>
  );
}

/**
 * DẢI "ĐANG TÔ" (mockup v9 khu 2): đầu bảng lớp — số môn · số lớp GVCN · số lớp (cùng hàm đếm với tổng hợp, "cũ → mới" khi có nháp) +
 * "Chỉ hiện n lớp" (= điền ô tìm bằng tên GV) · "Hồ sơ GV ›" (chỉ khi mở được) · "✕ Bỏ tô". 375: dính đầu danh sách.
 */
export function DaiToPc({ g, dem, demNhap, soLop, hoSo, gon, onChiHien, onBo }: {
  g: GvPc; dem: DemGv | undefined; demNhap: DemGv | undefined; soLop: number; hoSo: string | null; gon: boolean; onChiHien: () => void; onBo: () => void;
}) {
  const a = dem ?? { ft: 0, th: 0, cnFt: 0, cnTh: 0 };
  const b = demNhap ?? { ft: 0, th: 0, cnFt: 0, cnTh: 0 };
  const coNhap = a.ft + a.th !== b.ft + b.th || a.cnFt + a.cnTh !== b.cnFt + b.cnTh;
  return (
    <div className={`pc-dai-to ${gon ? 'gon' : ''}`} role="status">
      <span className="cham" aria-hidden="true" />
      <span>{t('Đang tô')} <b>{g.ten}</b> · {t('dạy')} <SoCuMoi cu={a.ft + a.th} moi={b.ft + b.th} />{gon ? '' : ` ${t('môn')}`} · {t('GVCN')} <SoCuMoi cu={a.cnFt + a.cnTh} moi={b.cnFt + b.cnTh} />{gon ? '' : ` ${t('lớp')}`}
        {coNhap ? <span className="phu"> {t('(tính cả nháp)')}</span> : !gon && <> · {t('ở {n} lớp', { n: soLop })}</>}</span>
      <span className="phai">
        <button type="button" className="btn btn-sm" onClick={onChiHien}>{t('Chỉ hiện {n} lớp', { n: soLop })}</button>
        {hoSo && !gon && <Link className="pc-lk" to={hoSo}>{t('Hồ sơ GV ›')}</Link>}
        <button type="button" className="btn btn-sm btn-ghost" aria-label={t('Bỏ tô')} onClick={onBo}>✕ {t('Bỏ tô')}</button>
      </span>
    </div>
  );
}
