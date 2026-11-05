import { useEffect, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { Khoi, KhungPanel } from '../../ui/KhungPanel.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { taiXlsx, type SheetXuat } from '../test/keHoach/taiXlsx.ts';
import { COT_THEO_MAU, COT_XUAT_DS, MAU_XUAT_DS, cotXuatDs, type KhoaCotXuatDs, type MauXuatDs } from '@shared/domain/index.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { t } from '@shared/i18n/index.ts';

type KetQua = { sheets: SheetXuat[]; tenTep: string; dem: { hocVien: number } };
type Nho = { mau: MauXuatDs; cot: KhoaCotXuatDs[] | null };
/** BAO-CAO-PH b: đếm trước của mẫu Báo cáo PH (`xemTruoc`). */
type DemBc = { ft: { lop: number; hocVien: number }; thuong: { lop: number; hocVien: number }; khongDot: string[]; emDu: number; tong: number };

const khoaNho = (uid: number | null) => `pisa.xuat-ds:${uid ?? 0}`;
function docNho(uid: number | null): Nho {
  try {
    const j = JSON.parse(localStorage.getItem(khoaNho(uid)) ?? 'null');
    return { mau: MAU_XUAT_DS.includes(j?.mau) ? j.mau : 'co-ban', cot: Array.isArray(j?.cot) ? j.cot : null };
  } catch { return { mau: 'co-ban', cot: null }; }
}

/**
 * NGĂN "XUẤT EXCEL DANH SÁCH HỌC VIÊN" (UI-HV-LOP, `dieu-chinh-cuoi.html` khu d — không cột tick): phạm vi (Bộ lọc hiện tại · Cả chi nhánh) · chọn cột.
 * Nhận ĐÚNG danh sách em trang đang hiện (`ids`) + chữ bộ lọc (`boLoc`, vào sheet "Thông tin xuất"); máy chủ kiểm quyền từng em.
 * Nhớ cột lần gần nhất (máy này). `macDinh` / `mauMacDinh` đặt sẵn cột của nơi gọi (Lịch thi: cột Kết luận + Ghi chú; Đang SOS: Theo dõi SOS).
 */
export function NganXuatDs({ ids, ca, boLoc, macDinh, mauMacDinh, onDong }: {
  /** `ca`: phạm vi rộng của trang (vd "Cả chi nhánh · 129") — có thì hiện lựa chọn thứ hai. */
  ids: number[]; ca?: { nhan: string; ids: number[] }; boLoc: string; macDinh?: KhoaCotXuatDs[]; mauMacDinh?: MauXuatDs;
  onDong: () => void;
}) {
  const toast = useToast();
  const uid = useSession().session?.user?.id ?? null;
  const [nho] = useState(() => docNho(uid));
  const [pham, setPham] = useState<'loc' | 'ca'>('loc');
  const mau: MauXuatDs = mauMacDinh ?? nho.mau;
  const [cot, setCot] = useState<KhoaCotXuatDs[]>(() => macDinh ?? (mauMacDinh ? [...COT_THEO_MAU[mauMacDinh]] : nho.cot ?? [...COT_THEO_MAU[nho.mau]]));
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [xong, setXong] = useState<string | null>(null);
  const dsId = pham === 'ca' && ca ? ca.ids : ids;
  /* BAO-CAO-PH b (mockup f1, ghi chú L1): khối Mẫu — "Danh sách" giữ nguyên ngăn cũ; "Báo cáo PH" thay khối Cột bằng ô Tháng + bảng đếm. */
  const [loai, setLoai] = useState<'ds' | 'bc'>('ds');
  const { homNay } = useNgayNghiepVu();
  const dsThang = Array.from({ length: 12 }, (_, i) => { const d = new Date(Date.UTC(Number(homNay.slice(0, 4)), Number(homNay.slice(5, 7)) - 1 - i, 1)); return d.toISOString().slice(0, 7); });
  const [thang, setThang] = useState(() => homNay.slice(0, 7));
  const [dem, setDem] = useState<DemBc | null>(null);
  useEffect(() => {
    if (loai !== 'bc' || !dsId.length) { setDem(null); return undefined; }
    let con = true;
    setDem(null);
    api.post<DemBc>('/hoc-vien-lop/xuat-bao-cao-ph', { ids: dsId, thang, xemTruoc: true }).then((r) => { if (con) setDem(r); }, (e) => { if (con) setLoi(e.message); });
    return () => { con = false; };
  }, [loai, thang, pham]);   // eslint-disable-line react-hooks/exhaustive-deps -- dsId theo pham
  const taiBc = async () => {
    if (busy || !dsId.length) return;
    setBusy(true); setLoi(null); setXong(null);
    try {
      const r = await api.post<KetQua & { khongDot: string[] }>('/hoc-vien-lop/xuat-bao-cao-ph', { ids: dsId, thang });
      await taiXlsx(r.sheets, r.tenTep);
      const gio = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setXong(t('Đã tạo {tep} · {n} HV · {gio}', { tep: r.tenTep, n: r.dem.hocVien, gio }));
      toast.push('ok', t('Đã xuất {n} học viên — tệp {tep}', { n: r.dem.hocVien, tep: r.tenTep }));
    } catch (e: any) {
      setLoi(e.message ?? t('Chưa tạo được file.'));
    } finally {
      setBusy(false);
    }
  };
  const nhanThang = (ym: string) => t('Tháng {m} · {y}', { m: Number(ym.slice(5, 7)), y: ym.slice(0, 4) });
  const soBc = dem ? dem.ft.hocVien + dem.thuong.hocVien : 0;
  const batCot = (k: KhoaCotXuatDs) => { setCot((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k])); setXong(null); };
  const cotThuTu = cotXuatDs(mau, cot);

  const tai = async () => {
    if (busy || !dsId.length) return;
    setBusy(true); setLoi(null); setXong(null);
    try {
      const r = await api.post<KetQua>('/hoc-vien-lop/xuat', { ids: dsId, mau, cot: cotThuTu, boLoc: pham === 'ca' && ca ? ca.nhan : boLoc, pham: 'loc' });
      await taiXlsx(r.sheets, r.tenTep);
      try { localStorage.setItem(khoaNho(uid), JSON.stringify({ mau, cot: cotThuTu })); } catch { /* không nhớ được thì lần sau chọn lại */ }
      const gio = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setXong(t('Đã tạo {tep} · {n} HV · {gio}', { tep: r.tenTep, n: r.dem.hocVien, gio }));
      toast.push('ok', t('Đã xuất {n} học viên — tệp {tep}', { n: r.dem.hocVien, tep: r.tenTep }));
    } catch (e: any) {
      setLoi(e.message ?? t('Chưa tạo được file.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KhungPanel tieuDe={t('Xuất Excel')} onDong={onDong}
      chan={{
        huy: { onClick: onDong, nhan: t('Đóng') },
        chinh: loai === 'bc'
          ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !dem || !soBc} onClick={() => void taiBc()}>
            {busy ? t('Đang tạo file…') : t('Xuất {n} HV', { n: soBc })}</button>
          : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !dsId.length || !cotThuTu.length} onClick={() => void tai()}>
          {busy ? t('Đang tạo file…') : t('Xuất {n} HV', { n: dsId.length })}</button>,
      }}>
      <p className="m-0 pt-3 text-sm text-slate-300">{t('Theo bộ lọc: {boLoc}', { boLoc })} · <b className="tabular-nums text-slate-100">{t('{n} HV', { n: ids.length })}</b></p>
      {/* Mẫu luôn có — "Danh sách" giữ mẫu theo góc trang (`mauMacDinh`) như cũ. */ (
        <Khoi tieuDe={t('Mẫu')}>
          <div role="radiogroup" aria-label={t('Mẫu')} className="flex flex-wrap gap-2">
            <Chon dang={loai === 'ds'} onChon={() => { setLoai('ds'); setXong(null); setLoi(null); }} nhan={t('Danh sách')} />
            <Chon dang={loai === 'bc'} onChon={() => { setLoai('bc'); setXong(null); setLoi(null); }} nhan={t('Báo cáo PH')} />
          </div>
        </Khoi>
      )}
      <Khoi tieuDe={t('Phạm vi')}>
        <div role="radiogroup" aria-label={t('Phạm vi')} className="flex flex-wrap gap-2">
          <Chon dang={pham === 'loc'} onChon={() => setPham('loc')} nhan={t('Bộ lọc hiện tại · {n}', { n: ids.length })} />
          {ca && <Chon dang={pham === 'ca'} onChon={() => setPham('ca')} nhan={`${ca.nhan} · ${ca.ids.length}`} />}
        </div>
      </Khoi>
      {loai === 'bc' ? (
        <Khoi tieuDe={t('Tháng')}>
          <select className="field min-h-[44px] w-full max-w-[240px] sm:min-h-0" aria-label={t('Tháng')} value={thang} onChange={(e) => { setThang(e.target.value); setXong(null); }}>
            {dsThang.map((m) => <option key={m} value={m}>{nhanThang(m)}</option>)}
          </select>
          <dl className="m-0 mt-3 text-sm">
            {[
              [t('Lớp FT · đợt {thang}', { thang: t('Tháng {m}', { m: Number(thang.slice(5, 7)) }) }), dem && t('{l} lớp · {n} HV', { l: dem.ft.lop, n: dem.ft.hocVien })],
              [t('Lớp thường · đợt có hạn trong tháng {m}', { m: Number(thang.slice(5, 7)) }), dem && t('{l} lớp · {n} HV', { l: dem.thuong.lop, n: dem.thuong.hocVien })],
              [<span key="k" className="inline-flex items-center gap-1">{t('Không có đợt')}{dem && dem.khongDot.length > 0 && <NutLuat label={t('Lớp không có đợt')}>{dem.khongDot.join(', ')}</NutLuat>}</span>,
                dem && t('{l} lớp', { l: dem.khongDot.length })],
              [t('Em đủ mọi phần'), dem && `${dem.emDu}/${dem.tong}`],
            ].map(([k, v], i) => (
              <div key={i} className="flex items-center justify-between gap-3 border-t py-2 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                <dt className="text-slate-300">{k}</dt><dd className="m-0 font-semibold tabular-nums text-slate-100">{v ?? '…'}</dd>
              </div>
            ))}
          </dl>
        </Khoi>
      ) : (
      <Khoi tieuDe={t('Cột')}>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {(Object.keys(COT_XUAT_DS) as KhoaCotXuatDs[]).map((k) => (
            <label key={k} className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-200 sm:min-h-[28px]">
              <input type="checkbox" checked={cotThuTu.includes(k)} onChange={() => batCot(k)} />
              {k === 'diem' ? t('Điểm OVR · L · R · W1 · W2 · S') : k === 'gmail' || k === 'target' ? COT_XUAT_DS[k] : t(COT_XUAT_DS[k])}
            </label>
          ))}
        </div>
      </Khoi>
      )}
      <p className="m-0 pt-2 text-xs text-slate-400">{t('Ghi vào nhật ký xuất')}</p>
      <div aria-live="polite" className="pt-2 text-sm">
        {busy && <p className="m-0 text-slate-300">{t('Đang tạo file · {n} HV…', { n: dsId.length })}</p>}
        {xong && <p className="m-0 text-slate-100">{xong}</p>}
        {loi && (
          <p role="alert" className="m-0 text-bad">
            {t('Chưa tạo được file.')} {loi} {t('Bộ lọc vẫn giữ.')} <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => void tai()}>{t('Thử lại')}</button>
          </p>
        )}
        {!dsId.length && <p className="m-0 text-slate-400">{t('Không có học viên phù hợp để xuất. Bỏ bớt bộ lọc để thấy HV.')}</p>}
      </div>
    </KhungPanel>
  );
}

function Chon({ dang, onChon, nhan }: { dang: boolean; onChon: () => void; nhan: string }) {
  return (
    <label className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-100 sm:min-h-0 ${dang ? 'shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`} style={{ borderColor: 'var(--line)' }}>
      <input type="radio" checked={dang} onChange={onChon} />{nhan}
    </label>
  );
}
