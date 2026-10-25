import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { LichSuThayDoi } from '../../ui/LichSuThayDoi.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { CanLam, KhoiDaLuu, NutChu, TrangThaiLuu, dauViec, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { KhoiDung, PanelLoTrinhMoi, type GiaTriDung } from './PanelLoTrinhMoi.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CHU_DA_XONG, HUONG_SAU_THI, NHAN_HUONG_SAU_THI, NHAN_SAU_THI, ngay, thuNgay, tuanLich, type HuongSauThi, type LuaChonSauThi } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { HopGiaHan } from './HopGiaHan.tsx';

/** `GET /cycles/:id/buoc-tiep` (máy chủ `trangThaiBuocTiep`). */
export type TrangThaiBuocTiep = {
  chon: LuaChonSauThi | null; luc: string | null; boi: string | null; coTheChon: boolean;
  /** P7: gợi ý hướng (Đạt Target → Tạm dừng/ Kết thúc học; chưa đạt / Không thi → Lộ trình mới). */
  goiY?: HuongSauThi | null;
  daXong: string; han: string; hen: string | null; henLop: string | null; lopNay: { id: number; code: string } | null; target: string; ngayThi: string | null;
  studentId: number; cycleId: number; ketLuan: string | null; hoanTacDuoc: boolean;
  /** OV-13q: hạn đã gia hạn · nút Gia hạn. */
  daGiaHan: boolean; coTheGiaHan: boolean;
};
type Chon = HuongSauThi;

const LAM_MOI = ['/students', '/classes', '/hoc-vien-lop', '/cases', '/lo-trinh', '/my-work', '/cycles', '/tong-quan'];
const lamMoi = () => LAM_MOI.forEach((k) => invalidate(k));
const gio = () => new Date().toTimeString().slice(0, 5);

/**
 * BƯỚC TIẾP SAU THI (OV-13m, mockup `mockup-ov13-buoc-tiep-2026-10-15.html` §1–3) — panel v3: đầu "Bước tiếp · Hạn …", kết quả thi một dòng "✓ Đã xong · OVR … · Sửa",
 * P7 (N12, mockup V6 `trang-thai-hv.html` k4): HAI nút lớn không chọn sẵn — "Tạm dừng/ Kết thúc học" (hộp N11 ngay trong panel, ô "Có thể quay lại học"
 * tắt sẵn) · "Lộ trình mới" (nội dung panel đổi thành `PanelLoTrinhMoi`, ‹ Bước tiếp). Gia hạn 1 tuần, Lịch sử, Hoàn tác, Huỷ hẹn giữ. Đã chọn → khối trạng thái + Huỷ hẹn / Hoàn tác (Tạm dừng: Quay lại học = Lộ trình mới). GVCN / người
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
  const [dung, setDung] = useState<GiaTriDung>({ ngay: '', lyDo: '', quayLai: false });
  const [tt, setTt] = useState<'dang' | 'loi' | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState<{ x: DaLuuPanel; luc: string } | null>(null);
  const [giaHan, setGiaHan] = useState(false);
  const [lichSu, setLichSu] = useState(false);   // OV-15g: Lịch sử thay nội dung panel, ← Bước tiếp

  const tieuDe = t('Bước tiếp');
  const em = hocVien ?? (bt ? { id: bt.studentId, ten: '' } : null);
  const dau = dauViec({
    han: bt && !bt.chon && bt.coTheChon ? <ChipHan loai="sau-thi" han={bt.han} /> : null,
    em: em?.ten ? em : null, lop: lop ?? bt?.lopNay?.code ?? null, ngCanh: CHU_DA_XONG,
  });
  if (lichSu) {
    return <LichSuThayDoi loai="thi-that" id={cycleId} dong2={[em?.ten || null, lop ?? bt?.lopNay?.code ?? null]} quayLai={{ nhan: tieuDe, onClick: () => setLichSu(false) }} onClose={onClose} />;
  }
  if (error) return <KhungPanel tieuDe={tieuDe} dau={dau} quayLai={quayLai} onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (!bt) return <KhungPanel tieuDe={tieuDe} dau={dau} quayLai={quayLai} onDong={onClose}><div className="pt-3"><Skeleton rows={4} /></div></KhungPanel>;

  const hn = homNay ?? '';
  const gui = async (fn: () => Promise<unknown>, x: DaLuuPanel) => {
    setTt('dang'); setLoi(null);
    try {
      await fn();
      lamMoi(); setTt(null); setDaLuu({ x, luc: gio() }); setDoi(false); reload(); onDone?.();
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); }
  };
  const boChon = () => api.del(`/cycles/${cycleId}/buoc-tiep`).then(() => { lamMoi(); reload(); onDone?.(); });
  /* "Tạm dừng/ Kết thúc học": ô bật → `tam_dung`, tắt → `ket_thuc` (máy chủ ghi như cũ), ngày + lý do của hộp. */
  const luuDung = () => {
    const chonMay: LuaChonSauThi = dung.quayLai ? 'tam_dung' : 'ket_thuc';
    void gui(() => api.post(`/cycles/${cycleId}/buoc-tiep`, { chon: chonMay, date: dung.ngay || undefined, lyDo: dung.lyDo.trim() || undefined }),
      { chu: t('Đã chọn {chon}', { chon: NHAN_SAU_THI[chonMay] }), phu: t('em đã vào Lưu trữ'), hoanTac: boChon });
  };
  const viecTiep = onTiep
    ? <button type="button" className="btn btn-primary btn-lg min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button>
    : <button type="button" className="btn btn-primary btn-lg min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button>;

  const dongKetQua = (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[14px]">
      <span className="font-semibold text-slate-100"><span className="text-ok">✓</span> {dich(bt.daXong)}</span>
      {bt.ngayThi && <span className="text-slate-400">· {t('thi {ngay}', { ngay: thuNgay(bt.ngayThi, hn) })}</span>}
      {!bt.chon && bt.daGiaHan && <span className="text-slate-400">· {t('đã gia hạn')}</span>}
      <span className="flex-1" />
      {/* OV-13q: Gia hạn — hộp nhỏ đè panel này (không đóng panel). */}
      {!bt.chon && bt.coTheGiaHan && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setGiaHan(true)}>{t('Gia hạn')}</button>}
      {onSuaKetQua && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={onSuaKetQua}>{t('Sửa')}</button>}
      <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => setLichSu(true)}>{t('Lịch sử')}</button>
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

  if (chon === 'lo_trinh_moi') {
    return (
      <PanelLoTrinhMoi bt={bt} hocVien={em?.ten ? em : null} lop={lop} dau={dau} onClose={onClose}
        quayLai={{ nhan: tieuDe, onClick: () => setChon(null) }}
        onSaved={(x) => { lamMoi(); setDaLuu({ x: { ...x, hoanTac: x.hoanTac ? () => (x.hoanTac as () => Promise<void>)().then(() => { lamMoi(); reload(); onDone?.(); }) : undefined }, luc: gio() }); setDoi(false); reload(); onDone?.(); }} />
    );
  }
  const nut = chon === 'dung'
    ? <button type="button" className="btn btn-primary btn-lg min-h-[44px] sm:min-h-0" onClick={luuDung} disabled={tt === 'dang'}>{dung.quayLai ? NHAN_SAU_THI.tam_dung : NHAN_SAU_THI.ket_thuc}</button>
    : undefined;
  return (
    <KhungPanel tieuDe={tieuDe} dau={dau} quayLai={quayLai} onDong={onClose}
      chan={{ v3: true, daSua: chon === 'dung', chinh: nut, dongTren: chon ? <TrangThaiLuu tt={tt ?? 'nhap'} loi={loi} onThuLai={luuDung} /> : undefined }}>
      {dongKetQua}
      <div className="pt-3">
        <CanLam>
          <div role="group" aria-label={tieuDe} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {HUONG_SAU_THI.map((k) => (
              <button key={k} type="button" aria-pressed={chon === k} onClick={() => setChon(k)}
                className={`flex min-h-[44px] flex-col gap-0.5 rounded-[10px] border px-3.5 py-3 text-left text-[15px] font-bold ${chon === k ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : 'border-[color:var(--line)] text-slate-100 hover:border-[color:var(--accent)]'}`}>
                {NHAN_HUONG_SAU_THI[k]}
                <span className="text-[13px] font-normal text-slate-400">
                  {k === 'dung' ? t('Em vào Lưu trữ') : t('LT1 · LT2 · RF · Khác')}{bt.goiY === k ? ` · ${t('gợi ý')}` : ''}
                </span>
              </button>
            ))}
          </div>
          {chon === 'dung' && <KhoiDung v={dung} onChange={setDung} loTrinh={null} disabled={tt === 'dang'} />}
          {chon === 'dung' && <div className="hidden flex-wrap items-center gap-2 sm:flex">{nut}</div>}
        </CanLam>
      </div>
    </KhungPanel>
  );
}
