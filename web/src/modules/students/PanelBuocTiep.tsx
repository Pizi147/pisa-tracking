import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { CanLam, KhoiDaLuu, NutChu, TrangThaiLuu, dauViec, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { CHU_DA_XONG, LUA_CHON_SAU_THI, NHAN_SAU_THI, ngay, thuNgay, tuanChonDuoc, tuanLich, type LuaChonSauThi } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { HopGiaHan } from './HopGiaHan.tsx';

/** `GET /cycles/:id/buoc-tiep` (máy chủ `trangThaiBuocTiep`). */
export type TrangThaiBuocTiep = {
  chon: LuaChonSauThi | null; luc: string | null; boi: string | null; coTheChon: boolean;
  daXong: string; han: string; hen: string | null; henLop: string | null; lopNay: { id: number; code: string } | null; target: string; ngayThi: string | null;
  studentId: number; cycleId: number; ketLuan: string | null; hoanTacDuoc: boolean;
  /** OV-13q: hạn đã gia hạn · nút Gia hạn. */
  daGiaHan: boolean; coTheGiaHan: boolean;
};
type LopDich = { id: number; code: string; ft: boolean; route: string | null; tenChuongTrinh: string | null; gvcn: string | null; siSo?: number };
type Chon = (typeof LUA_CHON_SAU_THI)[number];

const LAM_MOI = ['/students', '/classes', '/hoc-vien-lop', '/cases', '/lo-trinh', '/my-work', '/cycles', '/tong-quan'];
const lamMoi = () => LAM_MOI.forEach((k) => invalidate(k));
const gio = () => new Date().toTimeString().slice(0, 5);

/**
 * BƯỚC TIẾP SAU THI (OV-13m, mockup `mockup-ov13-buoc-tiep-2026-10-15.html` §1–3) — panel v3: đầu "Bước tiếp · Hạn …", kết quả thi một dòng "✓ Đã xong · OVR … · Sửa",
 * MỘT khối Cần làm: ba lựa chọn (không chọn sẵn) Lộ trình mới [Lớp này / Lớp khác · Bắt đầu Ngay bây giờ / Thứ Hai] · Tạm dừng · Thôi học, Target giữ · Sửa,
 * "Khi lưu, web sẽ", nút chính đổi chữ theo lựa chọn. Đã chọn → khối trạng thái + Huỷ hẹn / Hoàn tác (Tạm dừng: Quay lại học = Lộ trình mới). GVCN / người
 * không chọn được: chỉ đọc. Dùng ở panel Kết quả thi thật (đổi tại chỗ), ngăn Tổng kết, hồ sơ (`?buoc-tiep=`), Công việc.
 */
export function PanelBuocTiep({ cycleId, hocVien, lop, quayLai, chonSan, onSuaKetQua, onClose, onDone, onTiep }: {
  cycleId: number; hocVien: { id: number; ten: string } | null; lop?: string | null;
  quayLai?: { nhan: string; onClick: () => void };
  /** Mở sẵn một lựa chọn — "Quay lại học" của em Tạm dừng sau thi mở sẵn Lộ trình mới. */
  chonSan?: Chon;
  /** "Sửa" ở dòng kết quả thi — về form Kết quả thi thật (nơi gọi). */
  onSuaKetQua?: () => void;
  onClose: () => void; onDone?: () => void; onTiep?: (() => void) | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data: bt, error, reload } = useApi<TrangThaiBuocTiep>(`/cycles/${cycleId}/buoc-tiep`, [cycleId]);
  const [doi, setDoi] = useState(!!chonSan);
  const [chon, setChon] = useState<Chon | null>(chonSan ?? null);
  const [lopKhac, setLopKhac] = useState(false);
  const [lopMoiId, setLopMoiId] = useState<number | ''>('');
  const [batDau, setBatDau] = useState('ngay');
  const [suaTg, setSuaTg] = useState(false);
  const [tg, setTg] = useState('');
  const [tt, setTt] = useState<'dang' | 'loi' | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState<{ x: DaLuuPanel; luc: string } | null>(null);
  const [giaHan, setGiaHan] = useState(false);
  const lf = useLoiForm();
  const moLop = !!bt?.coTheChon && chon === 'lo_trinh_moi' && lopKhac;
  const dsLop = useApi<{ lop: LopDich[] }>(moLop ? `/students/${bt!.studentId}/hoc-lai/lop-dich` : null, [moLop, bt?.studentId]);

  const tieuDe = t('Bước tiếp');
  const em = hocVien ?? (bt ? { id: bt.studentId, ten: '' } : null);
  const dau = dauViec({
    han: bt && !bt.chon && bt.coTheChon ? <ChipHan loai="sau-thi" han={bt.han} /> : null,
    em: em?.ten ? em : null, lop: lop ?? bt?.lopNay?.code ?? null, ngCanh: CHU_DA_XONG,
  });
  if (error) return <KhungPanel tieuDe={tieuDe} dau={dau} quayLai={quayLai} onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (!bt) return <KhungPanel tieuDe={tieuDe} dau={dau} quayLai={quayLai} onDong={onClose}><div className="pt-3"><Skeleton rows={4} /></div></KhungPanel>;

  const hn = homNay ?? '';
  const lopMoi = dsLop.data?.lop.find((l) => l.id === lopMoiId) ?? null;
  const hen = batDau !== 'ngay' ? batDau : null;
  const tuan = tuanLich(hen ?? hn, hn);
  const lopDich = lopKhac ? lopMoi?.code ?? null : bt.lopNay?.code ?? null;
  const tgMoi = suaTg && tg.trim() ? tg.trim().replace(',', '.') : null;
  const nutChinh = !chon ? t('Lưu bước tiếp') : chon === 'lo_trinh_moi' ? (hen ? t('Hẹn bắt đầu {tuan}', { tuan }) : t('Bắt đầu lộ trình mới')) : NHAN_SAU_THI[chon];
  const khiLuu: string[] = chon === 'ket_thuc' ? [t('Kết thúc học · em vào Lưu trữ'), t('Hoàn tác được ngay sau khi lưu')]
    : chon === 'tam_dung' ? [t('Đóng lộ trình · em Tạm dừng, mọi hạn dừng'), t('Sau này: hồ sơ › Quay lại học mở Lộ trình mới')]
      : chon !== 'lo_trinh_moi' || !lopDich ? []
        : hen ? [lopKhac ? t('Hẹn chuyển sang {lop} từ {tuan} · GV lớp cũ làm phiếu bàn giao', { lop: lopDich, tuan }) : t('Hẹn bắt đầu {tuan} ở {lop} · em chờ tới {ngay}', { tuan, lop: lopDich, ngay: thuNgay(hen, hn) }),
          t('Huỷ hẹn được tới lúc đó')]
          : [lopKhac ? t('Chuyển sang {lop} ngay · không hoàn tác', { lop: lopDich }) : t('Mở lộ trình mới ở {lop}', { lop: lopDich }), t('{tuan} = tuần 1 · lịch MT tự xếp theo tuần học', { tuan })];
  const loiO = [
    ...(!chon ? [{ khoa: 'chon', nhan: t('Bước tiếp'), lyDo: t('Chọn một bước') }] : []),
    ...(chon === 'lo_trinh_moi' && lopKhac && !lopMoiId ? [{ khoa: 'lop', nhan: t('Lớp khác'), lyDo: t('Chọn lớp') }] : []),
  ];
  const thieu = loiO.length > 0;

  const gui = async (fn: () => Promise<unknown>, x: DaLuuPanel) => {
    setTt('dang'); setLoi(null);
    try {
      await fn();
      lamMoi(); setTt(null); setDaLuu({ x, luc: gio() }); setDoi(false); reload(); onDone?.();
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); }
  };
  const boChon = () => api.del(`/cycles/${cycleId}/buoc-tiep`).then(() => { lamMoi(); reload(); onDone?.(); });
  const luu = () => {
    lf.bam();
    if (thieu || !chon) return;
    const than = chon === 'lo_trinh_moi' ? { chon, batDau, ...(lopKhac ? { lopMoiId } : {}), ...(tgMoi ? { mucTieu: tgMoi } : {}) } : { chon };
    const ten = em?.ten ?? '';
    const x: DaLuuPanel = chon === 'lo_trinh_moi'
      ? { chu: hen ? t('Đã hẹn Lộ trình mới') : t('Đã bắt đầu Lộ trình mới'), phu: [lopDich, hen ? t('bắt đầu {tuan}', { tuan }) : t('{tuan} = tuần 1', { tuan }), `Target ${tgMoi ?? bt.target}`].filter(Boolean).join(' · '),
        hoanTac: lopKhac && !hen ? undefined : boChon }
      : { chu: t('Đã chọn {chon}', { chon: NHAN_SAU_THI[chon] }), phu: ten || null, hoanTac: boChon };
    void gui(() => api.post(`/cycles/${cycleId}/buoc-tiep`, than), x);
  };
  const viecTiep = onTiep
    ? <button type="button" className="btn btn-primary btn-lg min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button>
    : <button type="button" className="btn btn-primary btn-lg min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button>;

  const dongKetQua = (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[13.5px]">
      <span className="font-semibold text-slate-100"><span className="text-ok">✓</span> {dich(bt.daXong)}</span>
      {bt.ngayThi && <span className="text-slate-400">· {t('thi {ngay}', { ngay: thuNgay(bt.ngayThi, hn) })}</span>}
      {!bt.chon && bt.daGiaHan && <span className="text-slate-400">· {t('đã gia hạn')}</span>}
      <span className="flex-1" />
      {/* OV-13q: Gia hạn — hộp nhỏ đè panel này (không đóng panel). */}
      {!bt.chon && bt.coTheGiaHan && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setGiaHan(true)}>{t('Gia hạn')}</button>}
      {onSuaKetQua && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={onSuaKetQua}>{t('Sửa')}</button>}
      {giaHan && <HopGiaHan x={{ cycleId, han: bt.han, daGiaHan: bt.daGiaHan }} hocVien={em?.ten || null} lop={lop ?? bt.lopNay?.code ?? null}
        onClose={() => setGiaHan(false)} onDone={() => { reload(); onDone?.(); }} />}
    </p>
  );

  if (daLuu) {
    return (
      <KhungPanel tieuDe={tieuDe} dau={dau} quayLai={quayLai} onDong={onClose}>
        <KhoiDaLuu x={daLuu.x} luc={daLuu.luc} nutChinh={viecTiep} onHoanTac={() => setDaLuu(null)} />
      </KhungPanel>
    );
  }

  /* Đã chọn (hoặc người xem không chọn được): khối trạng thái — Huỷ hẹn / Hoàn tác / Quay lại học. */
  if (!doi && (bt.chon || !bt.coTheChon)) {
    const chu = !bt.chon ? t('Chờ QL / TVV chọn bước tiếp')
      : bt.hen ? t('Hẹn bắt đầu {tuan} · {lop}', { tuan: tuanLich(bt.hen, hn), lop: bt.henLop ?? '—' })
        : t('Đã chọn: {chon}', { chon: NHAN_SAU_THI[bt.chon] });
    return (
      <KhungPanel tieuDe={tieuDe} dau={dau} quayLai={quayLai} onDong={onClose}
        chan={{ v3: true, dongTren: tt ? <TrangThaiLuu tt={tt} loi={loi} /> : undefined }}>
        {dongKetQua}
        <div className="mt-3 rounded-[10px] px-3 py-2.5 text-sm" style={{ background: 'var(--surface-2)' }}>
          <b className="font-semibold text-slate-100">{chu}</b>
          {bt.chon && <span className="text-slate-400">{bt.luc ? ` · ${ngay(bt.luc, hn)}` : ''}{bt.boi ? ` · ${bt.boi}` : ''}</span>}
        </div>
        {bt.chon && bt.coTheChon && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {bt.chon === 'tam_dung' && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => { setDoi(true); setChon('lo_trinh_moi'); }}>{t('Quay lại học')}</button>}
            {(bt.hen || bt.hoanTacDuoc) && (
              <NutChu onClick={() => { setTt('dang'); setLoi(null); boChon().then(() => setTt(null), (e: any) => { setTt('loi'); setLoi(e?.message ?? null); }); }} disabled={tt === 'dang'}>
                {bt.hen ? t('Huỷ hẹn') : t('Hoàn tác')}
              </NutChu>
            )}
          </div>
        )}
      </KhungPanel>
    );
  }

  const nut = <button type="button" className="btn btn-primary btn-lg min-h-[44px] sm:min-h-0" onClick={luu} disabled={tt === 'dang'}>{nutChinh}</button>;
  return (
    <KhungPanel tieuDe={tieuDe} dau={dau} quayLai={quayLai} onDong={onClose}
      chan={{ v3: true, daSua: !!chon && !chonSan, chinh: nut, conThieu: lf.conThieu(loiO), dongTren: <TrangThaiLuu tt={tt ?? (chon ? 'nhap' : null)} loi={loi} onThuLai={luu} /> }}>
      {dongKetQua}
      <div className="pt-3">
        <CanLam>
          <Truong nhan={t('Bước tiếp')} batBuoc as="div">
            <div role="group" aria-label={t('Bước tiếp')} {...lf.o(loiO, 'chon')} tabIndex={-1} className="flex flex-wrap gap-1.5 outline-none">
              {LUA_CHON_SAU_THI.map((k) => <NutChon key={k} chon={chon === k} className="max-sm:flex-1" onClick={() => setChon(k)}>{NHAN_SAU_THI[k]}</NutChon>)}
            </div>
          </Truong>
          {chon === 'lo_trinh_moi' && (
            <>
              <Truong nhan={t('Lớp')} as="div">
                <div role="group" aria-label={t('Lớp')} className="flex flex-wrap gap-1.5">
                  <NutChon chon={!lopKhac} onClick={() => setLopKhac(false)}>{t('Lớp này')}{bt.lopNay ? ` · ${bt.lopNay.code}` : ''}</NutChon>
                  <NutChon chon={lopKhac} onClick={() => setLopKhac(true)}>{t('Lớp khác')}</NutChon>
                </div>
                {lopKhac && (
                  <select className="field mt-2 w-full" aria-label={t('Lớp khác')} {...lf.o(loiO, 'lop')} value={lopMoiId} onChange={(e) => setLopMoiId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">{dsLop.data ? t('Chọn lớp') : t('Đang tải…')}</option>
                    {dsLop.data?.lop.map((l) => <option key={l.id} value={l.id}>{[l.code, l.ft ? `FT ${l.route ?? ''}`.trim() : l.tenChuongTrinh, l.siSo != null ? t('{n} em', { n: l.siSo }) : null].filter(Boolean).join(' · ')}</option>)}
                  </select>
                )}
              </Truong>
              <Truong nhan={t('Bắt đầu')}>
                <select className="field w-full sm:max-w-[16rem]" value={batDau} onChange={(e) => setBatDau(e.target.value)}>
                  <option value="ngay">{t('Ngay bây giờ')} · {tuanLich(hn, hn)}</option>
                  {tuanChonDuoc(hn, 4).map((m) => <option key={m} value={m}>{tuanLich(m, hn)} · {thuNgay(m, hn)}</option>)}
                </select>
              </Truong>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                {suaTg
                  ? <label className="flex items-center gap-2">Target <input className="field w-24 tabular-nums" inputMode="decimal" placeholder={bt.target || t('Ví dụ: 6.5')} aria-label="Target" value={tg} onChange={(e) => setTg(e.target.value)} /></label>
                  : <><span>Target <b className="tabular-nums text-slate-100">{bt.target || '—'}</b> <span className="text-slate-500">{t('giữ')}</span></span>
                    <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => { setSuaTg(true); setTg(bt.target); }}>{t('Sửa')}</button></>}
              </div>
            </>
          )}
          {khiLuu.length > 0 && (
            <div className="text-[13px]">
              <span className="text-xs font-semibold text-slate-400">{t('Khi lưu, web sẽ')}</span>
              <ul className="m-0 mt-1 list-disc space-y-0.5 pl-5 text-slate-200">{khiLuu.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          )}
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            {nut}{!chon && <span className="text-[13px] text-slate-400">{t('Chọn một bước')}</span>}
          </div>
        </CanLam>
      </div>
    </KhungPanel>
  );
}
