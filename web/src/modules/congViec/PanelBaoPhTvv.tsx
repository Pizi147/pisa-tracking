import { useRef, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel, NUT_DONG, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { BoiCanh, ChuLuu, NutDongPanel, dauViec, type TtLuu } from '../../ui/KhuonViec.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { DsLichSu, LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { TheLoai, TienTrinh } from '../yThuc/BangLan.tsx';
import { BadgeViec } from '../yThuc/khoiYThuc.tsx';
import { DaiChoGvSua, DaiDaLam, DsViPhamBaoPh, HOAN_TAC_MS, KhoiTraLai, TheChoGv, guiTraLai, hoanTacTraLai, rutTraLai, type TraLaiMo, type ViPhamBaoPh } from '../yThuc/TraLai.tsx';
import { ChuDich } from '../../ui/ChuDich.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import {
  COORDINATION_REMOVE_REASON_LABEL, COORDINATION_USER_REMOVE_REASONS, bacDu, bacNgan, kiemGhiRoKhac, luuRoiTiep, quyCheBaoPhTvv, reasonNeedsText, shortDate, type KetQuaBaoPh,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { gioVnNay, lucVn } from './gioVn.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { DaiChiXem, DongTheoDoi, HopNho, KhoiGiaoViec, dongLichSuGiao, useGiaoViec } from './KhoiGiaoViec.tsx';
import { PhanMeeting, useMeeting } from './PanelMeeting.tsx';

/** `GET /y-thuc/bao-ph/:id` (máy chủ `xemViecBaoPh`). */
type ViecBaoPh = {
  id: number; studentId: number; ten: string; nhan: string; han: string; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string;
  lan: { ketQua: KetQuaBaoPh; nhan: string; ngay: string; ghiChu: string | null; nguoi: string | null; luc: string }[];
  lienHe: { ten: string | null; quanHe: string | null; sdt: string | null };
  coTheGhi: boolean; nhanXuLy: string | null;
  /** PHOI-HOP-V2: việc "Báo PH · Meeting CX/GĐCN" (sau GVCN xác nhận Meeting) — GV-2: panel hiện cả hai phần Meeting (mockup v22 G8b). */
  phoiHopId: number | null;
  /** TINH-HINH: việc "Báo PH · Tình hình học tập" (GV báo) — bối cảnh = người gửi + nội dung, không có vi phạm. */
  tinhHinhId?: number | null;
  /** Q-RL2c: việc người dùng đã bỏ, người xem có quyền → nút Khôi phục. */
  khoiPhucDuoc: boolean;
  boiCanh: { nguoiLuu: string | null; luuLuc: string | null; ngayLam?: string | null; lop: string | null; noiDung: string | null; viPham: ViPhamBaoPh[]; ghiChu: string | null; xuLyId?: number | null };
  thuHoiCho: { lyDo: string | null } | null;
  /** P1 G3-2: lần xử lý còn chờ QL duyệt → ô ② "Chờ QL duyệt" (không "✓" như đã chốt). */
  choQlDuyet: { han: string | null } | null;
  /** HAN-BAO-PH (N34): `han` = hạn hiệu lực; mặc định · đã chọn (null) · sửa được · mỗi lần đổi hạn. */
  hanMacDinh: string; hanChon: string | null; coTheSuaHan: boolean;
  lichSuHan: { cu: string | null; moi: string; macDinh: boolean; nguoi: string | null; luc: string }[];
  /** TL-1 / TL-2 (N61): "Chờ GV sửa" · yêu cầu trả lại đang mở (một vi phạm / cả lần) · người xem trả lại được (việc còn mở, phía TVV). */
  measureId: number | null; choGvSua?: boolean; traLai?: TraLaiMo[]; coTheTraLai?: boolean;
};

/** "0912 345 678" — chỉ để đọc; `tel:` giữ số gốc. */
const sdtDoc = (s: string) => s.replace(/\D/g, '').replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
const KHOA_BAO_PH = ['/my-work', '/tong-quan', '/students', '/y-thuc', '/classes'];
/** Q-RL2c: Hoàn tác (toast) / Khôi phục (chân panel) việc đã bỏ — cùng một lời gọi. */
const khoiPhucBaoPh = async (id: number) => {
  await api.post(`/y-thuc/bao-ph/${id}/khoi-phuc`);
  for (const k of KHOA_BAO_PH) invalidate(k);
};

/**
 * BÁO PH (UI-CV-TVV, mockup `thiet-ke/v5/tvv.html` panelBph; C15, T10, T15, T16, T21, T22) — TVV ghi kết quả báo phụ huynh sau lần xử lý vi phạm.
 * Bối cảnh chỉ đọc (lần xử lý · nội dung GVCN · PH + SĐT bấm gọi) · form 3 trường (Kết quả · Ngày · Ghi chú, nháp theo việc) · Lịch sử mọi lần ghi.
 * "Chưa liên hệ được" = một lần thử: việc vẫn mở, hạn giữ. Kết thúc ngoại lệ = ⋯ › Bỏ việc (lý do sẵn có). Lưu / Lưu · việc tiếp › — chỉ sang việc kế sau khi lưu xong.
 */
export function PanelBaoPhTvv({ it, onDong, onDaLam, onTiep, tenTiep, chiXem }: {
  it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null; tenTiep?: string | null;
  /** GV-2 (mockup v22 G5): mở từ tab "Đang theo dõi" — dải "Bạn đang theo dõi · chỉ xem · Bỏ theo dõi" (bỏ xong thì đóng panel). */
  chiXem?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const { data: v, error, reload } = useApi<ViecBaoPh>(`/y-thuc/bao-ph/${it.viecId}`, [it.viecId]);
  /* GV-2 (N58): khối Phụ trách · Hạn · Theo dõi đầu thân panel — một GET song song; Meeting: thêm hai phần (một GET, chỉ khi là việc Meeting). */
  const gv = useGiaoViec('bao_ph', it.viecId);
  const laMeeting = it.group === 'phoi_hop_tvv' || v?.phoiHopId != null;
  const meet = useMeeting(laMeeting ? v?.phoiHopId : null);
  const [kq, setKq] = useNhap<KetQuaBaoPh | ''>('kq', '');
  const [ngay, setNgay] = useNhap('ngay', hn);
  const [ghiChu, setGhiChu] = useNhap('ghi-chu', '');
  const xoaNhap = useXoaNhap();
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState<{ kq: KetQuaBaoPh; luc: string; lan: number } | null>(null);
  const [bo, setBo] = useState(false);
  const [dangKp, setDangKp] = useState(false);
  /* TL-2: dải "✓ Đã trả lại / Đã rút" + Hoàn tác 60 giây (T3a, T3c) · hộp "Trả lại cả lần xử lý" (T2b). */
  const [vua, setVua] = useState<{ chu: string; het: number; hoanTac: (() => Promise<void>) | null } | null>(null);
  const [hopCaLan, setHopCaLan] = useState(false);
  const toast = useToast();
  const lf = useLoiForm();
  /* X04 (audit 03/11): MỘT khoá cho mỗi ý định ghi — bấm Lưu lại sau lỗi mạng gửi cùng khoá (máy chủ đã lưu thì không ghi đôi); đổi nội dung → khoá mới. */
  const khoa = useRef<{ nd: string; k: string } | null>(null);

  const em = { id: it.studentId!, ten: it.studentName };
  const tieuDe = laMeeting ? t('Meeting CX/GĐCN') : it.contextLabel ? t('Báo PH · {bac}', { bac: it.contextLabel }) : t('Báo PH');
  const xong = v?.trangThai === 'xong' || daLuu?.kq === 'da_bao';
  /* NHẸ HƠN PR-2b (v23 P1 `.meta`, luật hạn): đầu panel ghi hạn "21/11/2026 · quá hạn n ngày" (chỗ DUY NHẤT trong panel có "quá hạn n ngày");
     khối Phụ trách · Hạn chỉ tô màu ngày. Hạn tạm dừng (chờ GV sửa) / việc đã đóng → không ghi. */
  /* TL-2 (N61, PTA chốt): Trả lại chỉ khi máy chủ cho (việc còn mở, phía TVV) + không đang chờ Head duyệt thu hồi + không mở từ tab theo dõi. */
  const traLaiDuoc = !!v?.coTheTraLai && !v.thuHoiCho && !chiXem;
  const dsMo = v?.traLai ?? [];
  const caLanMo = dsMo.find((y) => y.measureId != null) ?? null;
  const mucMenu = [
    ...(traLaiDuoc && !caLanMo && v?.measureId ? [{ key: 'tra-lai', nhan: t('Trả lại cả lần xử lý'), onChon: () => setHopCaLan(true) }] : []),
    ...(v?.coTheGhi && !bo ? [{ key: 'bo', nhan: t('Bỏ việc…'), onChon: () => setBo(true) }] : []),
  ];
  const dau = {
    ...dauViec({ em, lop: it.classCode, han: v && v.trangThai === 'mo' && !v.choGvSua ? <ChipHan chuThuong loai="viec-van-hanh" han={v.han} /> : null }),
    ghim: mucMenu.length ? <MenuDong nhan={t('Thao tác phụ')} muc={mucMenu} lopNut={NUT_DONG} /> : null,   // A3-16: ⋯ cạnh ✕, không rơi dòng · NHẸ HƠN: cùng ô 36 × 36 với ✕
  };
  if (chiXem) dau.loai = `${t('Đang theo dõi')} · ${laMeeting ? t('Meeting CX/GĐCN') : t('Báo PH')}`;   // mockup G5: "Đang theo dõi · Báo PH"
  /* T3a: thẻ "Chờ GV sửa" cạnh tiêu đề (chữ + nền, không chỉ màu). */
  if (v?.choGvSua && v.trangThai === 'mo') (dau as { tieu?: ReactNode }).tieu = <>{bacDu(tieuDe)}<TheChoGv /></>;   // cùng chữ khung tự vẽ (`bacDu`)
  if (error) return <KhungPanel hd="bao-ph" tieuDe={tieuDe} dau={dau} onDong={onDong}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></KhungPanel>;
  if (!v) return <KhungPanel hd="bao-ph" tieuDe={tieuDe} dau={dau} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>;

  const sua = !daLuu && v.coTheGhi;
  const daGo = sua && (!!kq || !!ghiChu.trim() || ngay !== hn);
  /* Y-THUC-V2 (chủ SP 11/11): một ô Nội dung cho mọi kết quả, bắt buộc (máy chủ cũng kiểm). */
  const loiO = [
    ...(!kq ? [{ khoa: 'kq', nhan: t('Kết quả'), lyDo: t('Chọn kết quả') }] : []),
    ...(!ghiChu.trim() ? [{ khoa: 'noi-dung', nhan: t('Nội dung'), lyDo: t('Ghi đã báo PH gì, PH nói gì') }] : []),
  ];
  const luu = async (): Promise<boolean> => {
    lf.bam();
    if (!kq || loiO.length) return false;
    setTt('dang'); setLoi(null);
    try {
      const nd = JSON.stringify([kq, ngay || hn, ghiChu.trim()]);
      if (khoa.current?.nd !== nd) khoa.current = { nd, k: crypto.randomUUID() };
      await api.post('/y-thuc/bao-ph/ghi', { viecIds: [v.id], ketQua: kq, ngay: ngay || hn, ghiChu: ghiChu.trim() || null, khoa: khoa.current.k });
      khoa.current = null;
      xoaNhap(); setTt(null);
      setDaLuu({ kq, luc: gioVnNay(), lan: v.lan.filter((l) => l.ketQua === 'chua_lien_he').length + 1 });
      for (const k of KHOA_BAO_PH) invalidate(k);
      reload(); gv.reload(); onDaLam();
      return true;
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); return false; }
  };
  const khoiPhuc = async () => {
    setDangKp(true);
    try { await khoiPhucBaoPh(v.id); toast.push('ok', t('Đã khôi phục')); reload(); onDaLam(); }
    catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setDangKp(false); }
  };
  const suaLai = () => { setKq(daLuu?.kq ?? ''); setDaLuu(null); };
  const nutTiep = onTiep && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{tenTiep ? t('Việc kế: {ten}', { ten: tenTiep }) : t('Việc tiếp ›')}</button>;
  const chan = daLuu ? {
    huy: null,
    trai: <span role="status" className="font-semibold text-done">✓ {daLuu.kq === 'da_bao'
      ? t('Đã lưu {gio} · Việc xong', { gio: daLuu.luc })
      : t('Đã lưu lần thử {n} · việc vẫn mở, hạn giữ {ngay}', { n: daLuu.lan, ngay: shortDate(v.han, hn) })}</span>,
    phu: daLuu.kq === 'da_bao' && v.coTheGhi ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={suaLai}>{t('Sửa')}</button>
      : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>,
    chinh: nutTiep || (daLuu.kq === 'da_bao' ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button> : null),
  } : sua ? {
    huy: null, daSua: daGo, conThieu: lf.conThieu(loiO),
    trai: tt === 'loi' ? <ChuLuu tt="loi" loi={loi} /> : tt === 'dang' ? <ChuLuu tt="dang" /> : daGo ? <ChuLuu tt="nhap" /> : null,
    /* Việc cuối (không còn việc kế): chỉ "Lưu" là nút chính. */
    /* GD-4b (lời 36, dòng 40c ⓪): "Đóng" · Lưu · "Lưu · việc tiếp ›"; 375 giữ "Lưu · Lưu · việc tiếp ›" (Đóng qua ✕ / ‹). Đóng đi đường ✕ (gõ dở thì hỏi bỏ chữ). */
    phu: <><NutDongPanel busy={tt === 'dang'} />{tt === 'loi' || !onTiep ? null : <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luu()}>{t('Lưu')}</button>}</>,
    chinh: tt === 'loi'
      ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()}>{t('Thử lại')}</button>
      : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void (onTiep ? luuRoiTiep(luu, onTiep) : luu())}>{onTiep ? t('Lưu · việc tiếp ›') : t('Lưu')}</button>,
  } : {
    huy: null, trai: <span className="text-slate-400">{v.nhanXuLy ?? (v.trangThai === 'xong' ? t('Việc đã xong · lịch sử giữ khi thu hồi') : v.trangThai === 'bo' ? t('Đã bỏ') : null)}</span>,
    phu: v.khoiPhucDuoc ? <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={dangKp} onClick={() => void khoiPhuc()}>{t('Khôi phục')}</button> : null,
    chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>,
  };

  const ph = v.lienHe;
  /* Lịch sử: lần liên hệ + lần đổi người / hạn / theo dõi (GV-2: khối giao việc — gồm cả lần đổi hạn) + phần Meeting, mới nhất trước. */
  const phan = laMeeting ? meet.phan ?? [] : [];
  const lichSu = [
    ...v.lan.map((l) => ({ luc: l.luc, tieu: l.nhan, nguoi: l.nguoi, phu: [l.ngay !== l.luc.slice(0, 10) ? t('ngày {ngay}', { ngay: shortDate(l.ngay, hn) }) : null, l.ghiChu].filter(Boolean) as string[] })),
    ...dongLichSuGiao(gv.g, hn, laMeeting ? t('Báo PH') : undefined),
    ...phan.flatMap((g) => dongLichSuGiao(g, hn, g.meeting?.ten)),
  ].sort((a, b) => b.luc.localeCompare(a.luc));
  const daiDoi = () => { for (const k of KHOA_BAO_PH) invalidate(k); reload(); onDaLam(); };
  /* TL-2: sau trả lại / rút / Hoàn tác — panel + khối giao việc (hạn tạm dừng / chạy lại) + danh sách đọc lại. */
  const sauTraLai = () => { reload(); gv.reload(); onDaLam(); };
  const traLai = async (body: { violationId: number } | { measureId: number }, lyDo: string) => {
    const r = await guiTraLai(body, lyDo);
    sauTraLai();
    const ten = r.phuTrach.map((x) => x.ten).filter(Boolean).join(', ') || t('GV');
    setVua({ chu: t('Đã trả lại cho {ten}', { ten }), het: Date.now() + HOAN_TAC_MS, hoanTac: async () => { await hoanTacTraLai(r.id); setVua(null); sauTraLai(); toast.push('ok', t('Đã hoàn tác')); } });
  };
  /* T3c: Rút một bấm + Hoàn tác (60 giây). Máy chủ không có "bỏ rút" → Hoàn tác = trả lại lần nữa cùng lý do.
     ponytail: đó là yêu cầu MỚI (hạn sửa tính từ hôm nay, lịch sử ghi rút rồi trả lại) — thêm đường bỏ rút ở máy chủ nếu chủ SP muốn giữ hạn cũ. */
  const rut = async (y: TraLaiMo) => {
    await rutTraLai(y.id);
    sauTraLai();
    setVua({ chu: t('Đã rút · hạn Báo PH {ngay} chạy lại', { ngay: shortDate(v.han, hn) }), het: Date.now() + HOAN_TAC_MS, hoanTac: async () => {
      await guiTraLai(y.violationId ? { violationId: y.violationId } : { measureId: y.measureId! }, y.lyDo); setVua(null); sauTraLai();
    } });
  };
  const khoi = gv.g && <KhoiGiaoViec g={gv.g} dat={gv.dat} reload={gv.reload} onDaDoi={daiDoi} gon={laMeeting} anTheoDoi={laMeeting} />;
  return (
    <KhungPanel hd="bao-ph" tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chan}
      quyChe={sua && !bo ? (v.choGvSua && v.trangThai === 'mo' ? { chu: t('Hạn tạm dừng khi chờ GV · GV gửi lại → hạn mới 5 ngày') } : quyCheBaoPhTvv(kq === 'chua_lien_he', v.han ? shortDate(v.han, hn) : null)) : null}>
      <div className="relative flex flex-col gap-4 pt-4">
        {chiXem && gv.g && <DaiChiXem g={gv.g} onBo={onDong} />}
        {vua && <DaiDaLam chu={vua.chu} het={vua.het} onHet={() => setVua(null)} onHoanTac={vua.hoanTac} />}
        {dsMo.map((y) => <DaiChoGvSua key={y.id} y={y} hn={hn} onRut={v.coTheTraLai && !chiXem ? () => rut(y) : null}
          moTa={y.measureId ? t('Cả lần xử lý') : t('1 vi phạm')} />)}
        {hopCaLan && v.measureId && (
          <HopNho nhan={t('Trả lại cả lần xử lý')} tren="top-4" onDong={() => setHopCaLan(false)}>
            <div className="grid">
              <div className="flex items-start gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <b className="text-[14px] font-bold">{t('Trả lại cả lần xử lý')}</b>
                  {/* ponytail: tên GVCN = người lưu lần xử lý (thường là GVCN hiện tại); người nhận thật theo luật hiện ở dải sau khi trả. */}
                  <span className="text-[13px] text-dim">{[bacNgan(v.nhan), v.ten, v.boiCanh.nguoiLuu && t('về GVCN {ten}', { ten: v.boiCanh.nguoiLuu })].filter(Boolean).join(' · ')}</span>
                </div>
                <button type="button" className={NUT_DONG} aria-label={t('Đóng')} onClick={() => setHopCaLan(false)}>✕</button>
              </div>
              <div className="px-4 py-3">
                <KhoiTraLai khoa={`ca-lan-${v.measureId}`} nhan={t('Lý do')} goiY={t('Ghi rõ cần GVCN sửa gì — PH sẽ hỏi')} veAi={null} hn={hn} onHuy={() => setHopCaLan(false)}
                  onGui={async (lyDo) => { await traLai({ measureId: v.measureId! }, lyDo); setHopCaLan(false); }} />
              </div>
            </div>
          </HopNho>
        )}
        {/* NHẸ HƠN PR-2b (chủ SP 22/11 mục 6.4): Theo dõi chung của việc Meeting lên đầu, trước các phần. */}
        {laMeeting && gv.g && meet.phan && <DongTheoDoi rieng ds={[...meet.phan, gv.g]} reload={() => { gv.reload(); meet.reload(); }}
          dat={(ds) => { meet.dat(ds.filter((x) => x.loai === 'meeting')); const b = ds.find((x) => x.loai === 'bao_ph'); if (b) gv.dat(b); }} />}
        {/* GV-2 (mockup v22 G1 / G8b): khối ba dòng ĐẦU thân panel. Meeting: hai phần (Xếp lịch họp · Kết quả meeting) trước, rồi phần "Báo PH" của TVV. */}
        {laMeeting ? <>
          {phan.map((g) => <PhanMeeting key={g.id} g={g} dat={(x) => meet.dat(phan.map((y) => (y.id === x.id ? x : y)))} reload={meet.reload} />)}
          <h3 className="m-0 -mb-1 flex items-center gap-2 text-[14px] font-bold">{t('Báo PH')}</h3>
          {khoi}
        </> : khoi}
        {v.thuHoiCho && (
          <div role="status" className="flex flex-col gap-1 rounded-lg border border-soon-line bg-soon-bg px-3.5 py-2.5 text-sm">
            <span><b className="text-slate-100">{t('GVCN đang xin thu hồi {nhan}', { nhan: v.nhan })}</b> · {t('chờ Head duyệt.')}</span>
            <span className="text-slate-300">{t('Lần báo PH của bạn vẫn giữ trong lịch sử. Bạn không cần làm gì.')}</span>
          </div>
        )}
        {/* TINH-HINH (mockup v20 C2): GV báo tình hình — đọc nội dung GV gửi trước khi báo PH. */}
        {(v.tinhHinhId != null || laMeeting) && (v.boiCanh.noiDung || v.boiCanh.nguoiLuu) && (
          <div className="grid gap-1.5 rounded-[10px] border px-4 py-3" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            <span className="flex flex-wrap items-center gap-2 text-[13px] text-slate-400">{!laMeeting && <TheLoai loai="th" />}
              {v.boiCanh.nguoiLuu && <b className="font-semibold text-slate-200">{v.boiCanh.nguoiLuu}</b>}{v.boiCanh.luuLuc && <span className="tabular-nums">{lucVn(v.boiCanh.luuLuc)}</span>}</span>
            <span className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-100">{v.boiCanh.noiDung}</span>
          </div>
        )}
        {/* Mockup K5b / K8d: dải ①②③ cùng thứ tự tab Ý thức — bước TVV là việc của người ghi. */}
        {v.tinhHinhId == null && !laMeeting && <TienTrinh nay={v.coTheGhi && v.trangThai === 'mo' ? 2 : null} buoc={[
          [t('{n} vi phạm', { n: v.boiCanh.viPham.length }), v.boiCanh.viPham.length ? `${shortDate(v.boiCanh.viPham[0].ngay, hn)} – ${shortDate(v.boiCanh.viPham[v.boiCanh.viPham.length - 1].ngay, hn)}` : null],
          v.choQlDuyet
            ? [<BadgeViec xuong tong="cho">{bacNgan(v.nhan)}</BadgeViec>, [t('Chờ Head duyệt'), v.choQlDuyet.han && t('Head trả lời trước {ngay}', { ngay: shortDate(v.choQlDuyet.han, hn) })].filter(Boolean).join(' · ')]
            : [<BadgeViec xuong tong="xong">{bacNgan(v.nhan)}</BadgeViec>, [v.boiCanh.nguoiLuu && t('GVCN {ten}', { ten: v.boiCanh.nguoiLuu }), v.boiCanh.ngayLam ? shortDate(v.boiCanh.ngayLam, hn) : v.boiCanh.luuLuc && lucVn(v.boiCanh.luuLuc)].filter(Boolean).join(' · ') || null],
          [<BadgeViec xuong tong={v.trangThai === 'xong' ? 'xong' : v.trangThai === 'bo' ? 'xam' : v.quaHan ? 'qua' : 'cho'}>{dich(v.nhanTrangThai)}</BadgeViec>, v.trangThai === 'mo' ? (gv.g?.tamDung ? t('hạn tạm dừng') : t('hạn {ngay}', { ngay: shortDate(v.han, hn) })) : null],   // A3-07: cùng nói hạn như khối Hạn (N61)
        ]} />}
        {/* TL-2 (mockup v22 T1 / T6b / T8b): vi phạm = dòng bấm được, chi tiết ngay dưới dòng + "Trả lại" (phía TVV). */}
        {v.boiCanh.viPham.length > 0 && <DsViPhamBaoPh viPham={v.boiCanh.viPham} mo={dsMo} coTheTraLai={traLaiDuoc && !caLanMo} hn={hn}
          onTraLai={(vid, lyDo) => traLai({ violationId: vid }, lyDo)} />}
        {/* UI-1 (mockup U10 K5): mỗi trường một hàng — không nối "a · b · c". */}
        <BoiCanh dong={[
          [t('Ghi chú GVCN'), v.tinhHinhId == null && !laMeeting && v.boiCanh.ghiChu ? <span className="font-normal">
            <ChuDich chu={v.boiCanh.ghiChu} nguon={v.boiCanh.xuLyId ? { bang: 'discipline_measures', id: v.boiCanh.xuLyId, cot: 'note' } : null} /></span> : null],
          [t('Phụ huynh'), ph.ten && `${ph.ten}${ph.quanHe ? ` (${ph.quanHe})` : ''}`],
          [t('Điện thoại'), ph.sdt && (
            <a className="btn btn-sm min-h-[44px] tabular-nums no-underline sm:min-h-[32px]" href={`tel:${ph.sdt.replace(/\D/g, '')}`} aria-label={t('Gọi {ten} {sdt}', { ten: ph.ten ?? t('phụ huynh'), sdt: sdtDoc(ph.sdt) })}>
              <span aria-hidden>📞</span> {sdtDoc(ph.sdt)}</a>
          )],
        ]} />
        {bo && <BoViec id={v.id} onDong={() => setBo(false)} onDaBo={() => {
          setBo(false); xoaNhap(); reload(); onDaLam();
          toast.hoanTac(t('Đã bỏ việc này'), () => {
            khoiPhucBaoPh(v.id).then(() => { reload(); onDaLam(); }, (e: any) => toast.push('error', e?.message ?? t('Không lưu được')));
          }, { key: `bao-ph-bo:${v.id}` });
        }} />}
        {sua && !bo && (
          <>
            <Truong nhan={t('Kết quả')} as="div" loi={lf.loiCua(loiO, 'kq')}>
              <div {...lf.o(loiO, 'kq')} data-hd="p-bao-ph-kq" tabIndex={-1} className="outline-none"><LuaChonRadio ten={`bao-ph-kq-${v.id}`} nhan={t('Kết quả')} value={kq || null} muc={[['da_bao', t('Đã báo PH')], ['chua_lien_he', t('Chưa liên hệ được')]]}
                onChange={(k) => { setKq(k); if (tt === 'loi') setTt(null); }} /></div>
            </Truong>
            <Truong nhan={t('Ngày')}><div className="max-w-[220px]"><ONgay kieu="ngay" value={ngay} onChange={setNgay} toiDa={hn} /></div></Truong>
            <Truong nhan={t('Nội dung')} batBuoc loi={lf.loiCua(loiO, 'noi-dung')}>
              <textarea className="field w-full" {...lf.o(loiO, 'noi-dung')} rows={4} maxLength={2000} autoComplete="off" value={ghiChu} placeholder={t('Đã báo PH gì, PH nói gì, hẹn gì')} onChange={(e) => setGhiChu(e.target.value)} />
            </Truong>
          </>
        )}
        {/* GD-4c (H4): một kiểu lịch sử — "Lịch sử · n"; chưa có lần ghi thì không vẽ (lời 40). Chủ SP 22/11 ý 12: luôn gập sẵn. */}
        <LichSuGap so={lichSu.length}>
          <DsLichSu dong={lichSu.map((l, i) => ({ key: i, gio: lucVn(l.luc), ai: l.nguoi, viec: l.tieu, phu: l.phu }))} />
        </LichSuGap>
      </div>
    </KhungPanel>
  );
}

/** ⋯ › Bỏ việc (kết thúc ngoại lệ, `06` điểm 6): lý do bỏ sẵn có, "Khác" bắt ghi rõ. */
function BoViec({ id, onDong, onDaBo }: { id: number; onDong: () => void; onDaBo: () => void }) {
  const [lyDo, setLyDo] = useState('');
  const [chu, setChu] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const loiGhiRo = reasonNeedsText(lyDo) ? kiemGhiRoKhac(chu) : null;
  const gui = async () => {
    if (!lyDo || loiGhiRo) return;
    setBusy(true); setLoi(null);
    try {
      await api.post(`/y-thuc/bao-ph/${id}/bo`, { lyDo, lyDoKhac: reasonNeedsText(lyDo) ? chu.trim() : undefined });
      for (const k of KHOA_BAO_PH) invalidate(k);
      onDaBo();
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-2 rounded-lg p-3" style={{ background: 'var(--surface-2)' }} role="group" aria-label={t('Bỏ việc')}>
      <b className="text-sm text-slate-100">{t('Bỏ việc · chọn lý do')}</b>
      <div className="flex flex-wrap gap-1.5">
        {COORDINATION_USER_REMOVE_REASONS.map((r) => <NutChon key={r} nho chon={lyDo === r} onClick={() => setLyDo(r)}>{COORDINATION_REMOVE_REASON_LABEL[r]}</NutChon>)}
      </div>
      <OKhac hien={reasonNeedsText(lyDo)} value={chu} onChange={setChu} loi={loiGhiRo} />
      {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi}</p>}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onDong} disabled={busy}>{t('Ở lại')}</button>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !lyDo || !!loiGhiRo} onClick={() => void gui()}>{t('Bỏ việc này')}</button>
      </div>
    </div>
  );
}

/**
 * NHÓM NÚT RADIO (mockup V5 `.lua-chon`, bảng mẫu mục 7): radio thật (↑ ↓ đổi), mục chọn viền + nền nhấn; `disabled` = bước chưa mở.
 * Dùng chung panel Báo PH (Kết quả) và Sau thi (Bước tiếp, Lớp).
 */
export function LuaChonRadio<K extends string>({ ten, nhan, muc, value, onChange, disabled, khungRo, deu }: {
  ten: string; nhan: string; muc: readonly (readonly [K, string])[]; value: K | null; onChange: (k: K) => void; disabled?: boolean;
  /** Chủ SP 18/11 (Bước tiếp #1839) "khung rõ": ô nền surface-2 + viền mạnh, ô đang chọn nền nhấn nhạt. Mặc định giữ kiểu cũ. */
  khungRo?: boolean;
  /** TL-2 (mockup v22 T4a `.cach.ba` / T8a): các ô đều bề ngang một hàng; < 640 px xếp dọc, mỗi ô ≥ 44 px. */
  deu?: boolean;
}) {
  return (
    <div className={deu ? 'grid gap-2 sm:auto-cols-fr sm:grid-flow-col' : 'flex flex-wrap gap-2'} role="radiogroup" aria-label={nhan}>
      {muc.map(([k, chu]) => (
        <label key={k} className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm max-sm:min-h-[44px] ${disabled ? 'cursor-default' : 'cursor-pointer'} ${value === k ? 'font-semibold text-[color:var(--accent)] shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`}
          style={value === k ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : khungRo ? { borderColor: 'var(--line-strong)', background: 'var(--surface-2)' } : { borderColor: 'var(--o-nhap-vien)' }}>
          <input type="radio" name={ten} checked={value === k} disabled={disabled} onChange={() => onChange(k)} className="accent-[color:var(--accent)]" />{chu}
        </label>
      ))}
    </div>
  );
}
