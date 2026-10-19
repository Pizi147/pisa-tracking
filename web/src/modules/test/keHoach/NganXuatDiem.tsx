import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../../lib/api.ts';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { Hang2, Khoi, KhungPanel, Truong } from '../../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../../ui/loiForm.tsx';
import { ONgay } from '../../../ui/ONgay.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { BoLocDoan } from '../../../ui/ui.tsx';
import { COT_NHAN_XET, COT_XUAT_DIEM, mondayOfDate, type NoiDungXuatDiem } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { taiXlsx, type SheetXuat } from './taiXlsx.ts';
import type { LopKH } from './kieu.ts';

type PhamVi = 'tuan' | 'lop-mt' | 'lop-tuan';
type KetQua = { sheets: SheetXuat[]; tenTep: string; dem: { luot: number; hocVien: number }; boLoc: string };
const SO_MT = Array.from({ length: 10 }, (_, i) => i + 1);

/**
 * NGĂN "XUẤT ĐIỂM TEST" (OV-15c — mockup 6 khung 9, cùng mẫu panel Xuất danh sách): Nội dung `Điểm + nhận xét` / `Chỉ điểm`; Phạm vi `Theo tuần`
 * (mọi lớp FT thi trong một tuần) · `Theo lớp (nhiều MT)` · `Lớp + khoảng tuần`. Một hàng một lượt; em học 2 lớp trong kỳ ghi "A → B". Lớp / tuần đang
 * xem làm mặc định. Đếm lượt bằng chính `POST /ke-hoach-test/xuat-diem` (xem trước, 400 ms) nên số trên nút = số hàng của tệp.
 */
export function NganXuatDiem({ branchId, lopFt, lopDau, onDong }: { branchId: number | null; lopFt: LopKH[]; lopDau: number | null; onDong: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const thuHai = homNay ? mondayOfDate(homNay) : '';
  const [noiDung, setNoiDung] = useState<NoiDungXuatDiem>('diem-nhan-xet');
  const [phamVi, setPhamVi] = useState<PhamVi>(lopDau ? 'lop-mt' : 'tuan');
  const [lop, setLop] = useState<number | null>(lopDau ?? lopFt[0]?.id ?? null);
  const [mt, setMt] = useState<[number, number]>([1, 4]);
  const [tuan, setTuan] = useState<[string, string]>([thuHai, thuHai]);
  const [kq, setKq] = useState<{ khoa: string; r: KetQua } | null>(null);
  const [loi, setLoi] = useState<{ khoa: string; cau: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const body = useMemo(() => ({
    branchId, noiDung, classIds: phamVi === 'tuan' || !lop ? [] : [lop],
    ...(phamVi === 'lop-mt' ? { mtTu: mt[0], mtDen: mt[1] } : { tuanTu: tuan[0], tuanDen: phamVi === 'tuan' ? tuan[0] : tuan[1] }),
  }), [branchId, noiDung, phamVi, lop, mt, tuan]);
  const khoa = JSON.stringify(body);
  const loiNhap = phamVi !== 'tuan' && !lop ? t('Chọn lớp.')
    : phamVi === 'lop-mt' && mt[0] > mt[1] ? t('MT đầu phải trước MT cuối.')
      : phamVi !== 'lop-mt' && (!tuan[0] || (phamVi === 'lop-tuan' && (!tuan[1] || tuan[0] > tuan[1]))) ? t('Chọn tuần hợp lệ.') : null;

  /* Lỗi phạm vi hiện ngay khi xảy ra, qua `useLoiForm` như mọi form KhungPanel. */
  const lf = useLoiForm();
  useEffect(() => { if (loiNhap) lf.roi('pham-vi')(); }, [loiNhap]);   // eslint-disable-line react-hooks/exhaustive-deps
  const loiPhamVi = lf.loiCua(loiNhap ? [{ khoa: 'pham-vi', nhan: t('Phạm vi'), lyDo: loiNhap }] : [], 'pham-vi');

  useEffect(() => {
    if (loiNhap) return undefined;
    const s = ++seq.current;
    const h = setTimeout(() => {
      api.post<KetQua>('/ke-hoach-test/xuat-diem', { ...body, xemTruoc: true })
        .then((r) => { if (s === seq.current) { setKq({ khoa, r }); setLoi(null); } })
        .catch((e) => { if (s === seq.current) setLoi({ khoa, cau: e.message ?? t('Không xem trước được.') }); });
    }, 400);
    return () => clearTimeout(h);
  }, [khoa, loiNhap]);   // eslint-disable-line react-hooks/exhaustive-deps

  const hienTai = kq?.khoa === khoa ? kq.r : null;
  const loiMay = loi?.khoa === khoa ? loi.cau : null;
  const cot = [...COT_XUAT_DIEM, ...(noiDung === 'diem-nhan-xet' ? COT_NHAN_XET : [])];
  const xuat = async () => {
    if (busy || !hienTai?.dem.luot) return;
    setBusy(true);
    try {
      const r = await api.post<KetQua>('/ke-hoach-test/xuat-diem', body);
      await taiXlsx(r.sheets, r.tenTep);
      toast.push('ok', t('Đã xuất {n} lượt — tệp {tep}', { n: r.dem.luot, tep: r.tenTep }));
      onDong();
    } catch (e: any) {
      toast.push('error', e.message ?? t('Không xuất được tệp.'));
    } finally {
      setBusy(false);
    }
  };
  const chonLop = (
    <Truong nhan={t('Lớp')}>
      <select className="field w-full" value={lop ?? ''} onChange={(e) => setLop(Number(e.target.value) || null)}>
        {lopFt.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
      </select>
    </Truong>
  );
  const chonMt = (i: 0 | 1, nhan: string) => (
    <Truong nhan={nhan}>
      <select className="field w-full" value={mt[i]} onChange={(e) => setMt((m) => (i === 0 ? [Number(e.target.value), m[1]] : [m[0], Number(e.target.value)]))}>
        {SO_MT.map((n) => <option key={n} value={n}>MT{n}</option>)}
      </select>
    </Truong>
  );

  return (
    <KhungPanel tieuDe={t('Xuất điểm Test')} onDong={onDong}
      chan={{
        huy: { onClick: onDong },
        phu: hienTai ? <span className="hidden min-w-0 truncate text-xs text-slate-400 sm:inline" title={hienTai.tenTep}>{hienTai.tenTep}</span> : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={!hienTai?.dem.luot || busy || !!loiNhap} onClick={() => void xuat()}>
          {busy ? t('Đang xuất…') : hienTai ? t('Xuất Excel · {n} lượt', { n: hienTai.dem.luot }) : t('Xuất Excel')}</button>,
      }}>
      <Khoi tieuDe={t('Nội dung')}>
        <BoLocDoan<NoiDungXuatDiem> ariaLabel={t('Nội dung')} value={noiDung} onChange={setNoiDung}
          muc={[{ key: 'diem-nhan-xet', nhan: t('Điểm + nhận xét') }, { key: 'chi-diem', nhan: t('Chỉ điểm') }]} />
      </Khoi>
      <Khoi tieuDe={t('Phạm vi')}>
        <BoLocDoan<PhamVi> ariaLabel={t('Phạm vi')} value={phamVi} onChange={setPhamVi}
          muc={[{ key: 'tuan', nhan: t('Theo tuần') }, { key: 'lop-mt', nhan: t('Theo lớp (nhiều MT)') }, { key: 'lop-tuan', nhan: t('Lớp + khoảng tuần') }]} />
        {phamVi === 'tuan' && (
          <Truong nhan={t('Tuần')}><ONgay kieu="tuan" value={tuan[0]} onChange={(v) => setTuan([v, v])} /></Truong>
        )}
        {phamVi === 'lop-mt' && (<>{chonLop}<Hang2>{chonMt(0, t('Từ MT'))}{chonMt(1, t('Đến MT'))}</Hang2></>)}
        {phamVi === 'lop-tuan' && (
          <>
            {chonLop}
            <Hang2>
              <Truong nhan={t('Từ tuần')}><ONgay kieu="tuan" value={tuan[0]} onChange={(v) => setTuan((x) => [v, x[1]])} /></Truong>
              <Truong nhan={t('Đến tuần')}><ONgay kieu="tuan" value={tuan[1]} onChange={(v) => setTuan((x) => [x[0], v])} /></Truong>
            </Hang2>
          </>
        )}
        {loiPhamVi && <p role="alert" id={lf.oId('pham-vi')} className="m-0 text-xs text-late">{loiPhamVi}</p>}
      </Khoi>
      <Khoi tieuDe={t('Xem trước cột · {n} cột', { n: cot.length })}>
        <p className="m-0 text-xs leading-relaxed text-slate-300">{cot.join(' · ')}</p>
        {noiDung === 'chi-diem' && <p className="m-0 text-xs text-slate-400">{t('“Chỉ điểm” bỏ 2 cột nhận xét.')}</p>}
        <p className="m-0 text-xs text-slate-400" aria-live="polite">
          {loiMay ? <span className="text-bad">{loiMay}</span>
            : hienTai ? `${hienTai.boLoc} · ${t('Kèm sheet “Thông tin xuất”')}` : loiNhap ? '' : t('Đang tính…')}
        </p>
        {hienTai?.dem.luot === 0 && <p className="m-0 text-xs text-slate-400">{t('Không có lượt nào khớp — đổi phạm vi.')}</p>}
      </Khoi>
    </KhungPanel>
  );
}
