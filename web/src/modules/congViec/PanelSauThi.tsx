import { useRef, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChuLuu, LOP_DA_LUU, NutDongPanel, dauViec, type TtLuu } from '../../ui/KhuonViec.tsx';
import { LichSuThayDoi, NutLichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { CuoiThan } from './KhungViecChung.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { Nhan, NhanKq, NhanLich } from '../../ui/Nhan.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { OTuanDay } from '../../ui/TuanDayGv.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { laBand } from '../students/StudentPlanPanel.tsx';
import { PanelBuocTiep, useKhoiPhucThiThat, type TrangThaiBuocTiep } from '../students/PanelBuocTiep.tsx';
import { HopGiaHan } from '../students/HopGiaHan.tsx';
import { HanBam } from '../../ui/HanBam.tsx';
import { HUONG_SAU_THI, NHAN_HUONG_SAU_THI, NHAN_SAU_THI, chuGradeKyThi, ketQuaKyThi, ketQuaThiThat, kiemDiemKyThi, kyThiCuaChuongTrinh, ngay, quyCheChotNgayThi, quyCheDungHoc, quyCheKqThiThat, shortDate, luuRoiTiep, thangKe, type HuongSauThi } from '@shared/domain/index.ts';
import { HOC_TIEP_TRONG, KhoiDung, KhoiHocTiep, PanelLoTrinhMoi, loiHocTiep, thanHocTiep, type GiaTriDung, type GiaTriHocTiep } from '../students/PanelLoTrinhMoi.tsx';
import { t } from '@shared/i18n/index.ts';
import { LuaChonRadio } from './PanelBaoPhTvv.tsx';
import { gioVnNay } from './gioVn.ts';
import { DongLanTruoc, diemBanDau, layLaiBanDau, type KyNangThi } from '../students/diemLanTruoc.tsx';

const KN = ['l', 'r', 'w', 's'] as const;
type Diem = Record<(typeof KN)[number], string>;
const so = (v: number | null | undefined) => (v === null || v === undefined ? '' : fmtBand(v));
const soNguyen = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));
const LAM_MOI = ['/students', '/classes', '/hoc-vien-lop', '/lo-trinh', '/my-work', '/work', '/cycles', '/tong-quan'];
type Chon = HuongSauThi;
/** Lộ trình đã có kết quả thi thật (đủ 4 kỹ năng hoặc Không thi). */
/** Ngày thi: KQ đã ghi, không thì ngày thi đã chốt (exam_date dạng ngày). */
const ngayThiCua = (c: any): string | null => c.thi_that_ngay ?? (c.exam_date && /^\d{4}-\d{2}-\d{2}$/.test(c.exam_date) ? c.exam_date : null);
const coKqCua = (c: any) => !!c && (!!c.thi_that_khong_thi || KN.every((k) => c[`thi_that_${k}`] !== null && c[`thi_that_${k}`] !== undefined));

/**
 * SAU THI (UI-CV-TVV, mockup `thiet-ke/v5/tvv.html` panelSau; C16, T09, N6) — MỘT panel hai bước cho việc "Cập nhật KQ thi thật" và "Chọn bước tiếp":
 *  ① Kết quả thi thật L R W S (Overall máy tính) LƯU RIÊNG — chưa cần chọn bước tiếp; "Không thi" vẫn có (đường sẵn có).
 *  ② Bước tiếp mở sau khi có điểm; hạn = ngày có KQ + 7 (máy chủ). P7 (N12) + N51: ba hướng — Tạm dừng / Kết thúc học (hộp N11 tại chỗ, ô "Có thể quay lại học" tắt sẵn) ·
 *     Học tiếp (`KhoiHocTiep` tại chỗ: chọn là xong, Target / Lớp tuỳ chọn) · Lộ trình mới (nội dung panel đổi thành `PanelLoTrinhMoi`, ‹ Sau thi).
 * SAU-THI-GON (RA đề xuất 15): bản DUY NHẤT ghi KQ thi thật — Công việc, Lịch thi, hồ sơ HV (`quayLai`), Tổng kết; thay `KetQuaThiThatPanel` (ngày thi, lưu thiếu kỹ năng,
 * Hoàn tác sau lưu, Khôi phục ở Lịch sử, Tuần dạy, KET / PET thang Cambridge không Bước tiếp). Đã chọn bước tiếp từ trước → `PanelBuocTiep` (Đổi · Huỷ hẹn · Quay lại học).
 */
export function PanelSauThi({ cycleId, em, lop, han, quayLai, onDong, onDaLam, onTiep, tenTiep }: {
  cycleId: number; em: { id: number; ten: string }; lop: string | null;
  /** R4 P3: chip hạn của dòng việc ở đầu panel (không request thêm). */
  han?: ReactNode;
  /** Mở trong ngăn hồ sơ (thay nội dung, dòng "← …") — không panel chồng. */
  quayLai?: { nhan: string; onClick: () => void };
  onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null; tenTiep?: string | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const hn = homNay ?? '';
  const cy = useApi<any>(`/cycles/${cycleId}`, [cycleId]);
  const bt = useApi<TrangThaiBuocTiep>(`/cycles/${cycleId}/buoc-tiep`, [cycleId]);
  /* P1-07 (A3-01 = B3-10): Học tiếp chuyển KQ vào lịch sử (máy chủ xoá cột thi thật của lộ trình) — panel giữ ẢNH CHỤP lúc lưu cho tới khi dữ liệu tải lại có KQ
     (Hoàn tác trả về), không vẽ lại thành "Đã thi · chờ KQ". */
  const [chup, setChup] = useState<any>(null);
  const c = chup && !coKqCua(cy.data) ? chup : cy.data;
  const [diem, setDiem] = useState<Diem | null>(null);
  const [ngayNhap, setNgayNhap] = useState('');
  const [layLai, setLayLai] = useState<KyNangThi[]>([]);   // THI-LAI-1-KN: ô lấy điểm KQ thi thật lần trước
  const [suaDiem, setSuaDiem] = useState(false);
  const [ttDiem, setTtDiem] = useState<TtLuu | null>(null);
  const [gioDiem, setGioDiem] = useState<string | null>(null);
  const [loiDiem, setLoiDiem] = useState<string | null>(null);
  const [chon, setChon] = useState<Chon | null>(null);
  const [dung, setDung] = useState<GiaTriDung>({ ngay: '', lyDo: '', quayLai: false });
  const [hocTiep, setHocTiep] = useState<GiaTriHocTiep>(HOC_TIEP_TRONG);
  const [ghiChu, setGhiChu] = useState('');
  const lfD = useLoiForm();
  const lf = useLoiForm();
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChot, setDaChot] = useState<{ gio: string; chu: string } | null>(null);
  const [lichSu, setLichSu] = useState(false);
  const [giaHan, setGiaHan] = useState(false);
  const [suaKq, setSuaKq] = useState(false);   // đã chọn bước tiếp từ trước → "Sửa" ở PanelBuocTiep về form này
  /* Lúc MỞ panel em đã có bước tiếp chưa — chốt / Hoàn tác ngay trong panel không đổi kiểu panel (bt cũ còn `chon` tới khi tải lại). */
  const [chonLucMo, setChonLucMo] = useState<boolean | null>(null);
  if (chonLucMo === null && (bt.data || (!bt.loading && !bt.error))) setChonLucMo(!!bt.data?.chon);
  /* Hoàn tác / Khôi phục bản trước — xong thì nạp lại ô từ dữ liệu MỚI (bản đang có lúc bấm = `napLai`). */
  const napLai = useRef<unknown>(null);
  const khoiPhuc = useKhoiPhucThiThat(cycleId, () => { napLai.current = cy.data ?? true; setChup(null); setSuaDiem(false); cy.reload(); bt.reload(); onDaLam(); });

  const tieuDe = t('Sau thi');
  /* P13 KET-PET: lộ trình KET / PET — điểm Cambridge (số nguyên trong thang), Overall · Grade · CEFR máy tính; không Bước tiếp. */
  const kt = c && !c.route ? kyThiCuaChuongTrinh(c.programme_code) : null;
  const coKq = coKqCua(c);
  const ngayThi = c ? ngayThiCua(c) : null;
  /* Nạp điểm đang lưu MỘT lần — tải lại nền không xoá chữ đang gõ. */
  const napDiem = (x: any) => {
    const k = !x.route ? kyThiCuaChuongTrinh(x.programme_code) : null;
    const ll = k ? [] : layLaiBanDau(x);
    setLayLai(ll); setDiem(diemBanDau(x, ll, k ? soNguyen : so));
    setNgayNhap(ngayThiCua(x) ?? '');
  };
  if (c && (!diem || (napLai.current && cy.data && cy.data !== napLai.current))) { napLai.current = null; napDiem(c); }
  const target: number | null = c?.target_score ?? null;
  const dau = dauViec({
    han, em, lop,
    ngCanh: c ? (
      <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {[kt && `${t('Thang')} ${kt.ten} ${kt.min}–${kt.max}`, ngayThi && (kt ? `${kt.ten} ${ngay(ngayThi, hn)}` : t('thi IELTS {ngay}', { ngay: ngay(ngayThi, hn) })), target !== null && `Target ${kt ? target : fmtBand(target)}`].filter(Boolean).join(' · ')}
        {/* DON-LUONG K14: đã chốt bước tiếp (kể cả vừa "Mở lộ trình" — đọc lại bước tiếp) → chip nói bước đã chọn, không còn "Chưa chốt". */}
        {coKq && bt.data?.chon ? <Nhan tone="ok">{t('Đã chọn: {chon}', { chon: NHAN_SAU_THI[bt.data.chon as keyof typeof NHAN_SAU_THI] })}</Nhan>
          : coKq && kt ? null
          : coKq ? <Nhan tone="doing">{t('Đã có kết quả · Chưa chốt bước tiếp')}</Nhan> : <NhanLich loai="da-thi">{t('Đã thi · chờ KQ')}</NhanLich>}
      </span>
    ) : null,
  });
  const rong = quayLai ? 'rong' as const : undefined;
  if (lichSu) return <LichSuThayDoi loai="thi-that" id={cycleId} dong2={[em.ten, lop]} quayLai={{ nhan: t('Sau thi'), onClick: () => setLichSu(false) }} onClose={onDong} khoiPhuc={khoiPhuc} />;
  const loiTai = cy.error ?? bt.error;
  if (loiTai) return <KhungPanel hd="sau-thi" tieuDe={tieuDe} dau={dau} quayLai={quayLai} rong={rong} onDong={onDong}><ErrorState message={loiTai.message} hint={loiTai.hint} status={loiTai.status} onRetry={() => { cy.reload(); bt.reload(); }} /></KhungPanel>;
  /* `buoc-tiep` trả null khi chưa có kết quả thi thật — bước 2 khoá. */
  if (!c || !diem || (bt.loading && !bt.data)) return <KhungPanel hd="sau-thi" tieuDe={tieuDe} dau={dau} quayLai={quayLai} rong={rong} onDong={onDong}><div className="pt-3"><Skeleton rows={6} /></div></KhungPanel>;
  const b = bt.data ?? { chon: null, han: null, coTheChon: false, hen: null, hoanTacDuoc: false, lopNay: null } as unknown as TrangThaiBuocTiep;

  /* Đã chọn bước tiếp từ trước (mở lại từ hồ sơ / Lịch thi) → khối trạng thái của `PanelBuocTiep`: Đổi · Huỷ hẹn · Hoàn tác · Quay lại học · Sửa KQ (về form này). */
  if (chonLucMo && !suaKq && !kt) {
    return <PanelBuocTiep cycleId={cycleId} hocVien={em} lop={lop} quayLai={quayLai} onTiep={onTiep}
      onSuaKetQua={() => { setSuaKq(true); setSuaDiem(true); }} onClose={onDong} onDone={() => { cy.reload(); bt.reload(); onDaLam(); }} />;
  }

  /* ① Kết quả thi thật */
  const moDiem = !coKq || suaDiem;
  const saiO = (s: string) => s.trim() !== '' && (kt ? !/^\d+$/.test(s.trim()) || !!kiemDiemKyThi(kt, Number(s)) : !laBand(s));
  const soO = (s: string) => (s.trim() === '' ? null : Number(s));
  const diemSo = { l: soO(diem.l), r: soO(diem.r), w: soO(diem.w), s: soO(diem.s) };
  const coSai = KN.some((k) => saiO(diem[k]));
  const kq = coSai || kt ? null : ketQuaThiThat({ ...diemSo, khongThi: false }, target);
  const kqKt = !coSai && kt ? ketQuaKyThi(kt, { thi_that_l: diemSo.l, thi_that_r: diemSo.r, thi_that_w: diemSo.w, thi_that_s: diemSo.s, thi_that_khong_thi: false, target_score: target }) : null;
  const guiDiem = async (than: object): Promise<boolean> => {
    setTtDiem('dang'); setLoiDiem(null);
    try {
      const r = await api.put<{ khoiPhucId?: number | null }>(`/cycles/${cycleId}/outcome`, than);
      LAM_MOI.forEach((k) => invalidate(k));
      setTtDiem('da'); setGioDiem(gioVnNay()); setSuaDiem(false); setSuaKq(false); setChup(null); cy.reload(); bt.reload(); onDaLam();
      /* SUA-LUU-TRU (việc 1): mỗi lần lưu có đổi → toast Hoàn tác (trả đúng bản trước; có người sửa sau thì máy chủ từ chối). */
      const id = r?.khoiPhucId ?? null;
      if (id) toast.hoanTac((than as { khongThi?: boolean }).khongThi ? t('Đã lưu · Không thi') : t('Đã lưu kết quả thi thật'), () => { khoiPhuc(id, true).catch((e: any) => toast.push('error', e?.message ?? t('Không lưu được'))); }, { key: `thi-that:${cycleId}` });
      return true;
    } catch (e: any) { setTtDiem('loi'); setLoiDiem(e?.message ?? null); return false; }
  };
  const loiNgay = ngayNhap !== '' && !!homNay && ngayNhap > homNay;
  const loiD = [
    ...KN.filter((k) => saiO(diem[k])).map((k) => ({ khoa: `diem-${k}`, nhan: k.toUpperCase(), lyDo: kt ? t('Số nguyên {min}–{max}', { min: kt.min, max: kt.max }) : t('0–9, bước 0.5') })),
    /* Lưu thiếu kỹ năng được (em báo dần) — trống cả bốn thì không có gì để lưu. */
    ...(KN.every((k) => diem[k].trim() === '') ? [{ khoa: 'diem-l', nhan: 'L', lyDo: t('Nhập điểm') }] : []),
    ...(loiNgay ? [{ khoa: 'ngay-thi', nhan: t('Ngày thi'), lyDo: t('Không sau hôm nay') }] : []),
  ];
  const luuDiem = async (): Promise<boolean> => {
    lfD.bam();
    if (loiD.length) return false;
    return guiDiem({ khongThi: false, ngayThi: ngayNhap || null, ...diemSo, ghiChu: c.outcome_note ?? '', layLai });
  };
  const trong = moDiem && c.thiTruoc && !kt ? KN.filter((k) => diem[k].trim() === '') : [];
  const layTrong = () => { setDiem({ ...diem, ...Object.fromEntries(trong.map((k) => [k, so(c.thiTruoc[k])])) }); setLayLai([...layLai, ...trong]); };
  const duBon = KN.every((k) => c[`thi_that_${k}`] !== null && c[`thi_that_${k}`] !== undefined);

  /* ② Bước tiếp */
  const daChonTruoc = !!b.chon;
  /* S4-GD (Tutor 20/11, đề xuất 4): đủ 4 điểm hợp lệ → Bước tiếp mở NGAY (không chờ bấm "Lưu điểm"); MỘT nút chân lưu cả hai. Chưa có KQ thì `buoc-tiep` còn null → chưa biết
     `coTheChon` (máy chủ kiểm lại khi chọn; lỗi báo tại bước 2). */
  const diemDu = !coSai && KN.every((k) => diem[k].trim() !== '') && !loiNgay;
  const sapChon = !kt && moDiem && diemDu && !daChonTruoc && !daChot && (!coKq || b.coTheChon);
  const khoaBuoc2 = moDiem ? !sapChon : !b.coTheChon || daChonTruoc || !!daChot;
  const loiB = !chon ? [{ khoa: 'chon', nhan: t('Bước tiếp'), lyDo: t('Chọn một bước') }] : chon === 'hoc_tiep' ? loiHocTiep(hocTiep, b) : [];
  const chuChot = chon === 'dung' ? (dung.quayLai ? NHAN_SAU_THI.tam_dung : NHAN_SAU_THI.ket_thuc) : chon === 'hoc_tiep' ? NHAN_SAU_THI.hoc_tiep : t('Chốt bước tiếp');
  const chot = async (): Promise<boolean> => {
    lf.bam();
    if (loiB.length) return false;
    setTt('dang'); setLoi(null);
    try {
      /* "Tạm dừng / Kết thúc học": ô bật → `tam_dung`, tắt → `ket_thuc` (máy chủ ghi như cũ). N51 Học tiếp: hai ô tuỳ chọn Target / Lớp. */
      await api.post(`/cycles/${cycleId}/buoc-tiep`, chon === 'hoc_tiep' ? { ...thanHocTiep(hocTiep), ghiChu: ghiChu.trim() || null }
        : { chon: dung.quayLai ? 'tam_dung' : 'ket_thuc', ghiChu: ghiChu.trim() || null, date: dung.ngay || undefined, lyDo: dung.lyDo.trim() || undefined });
      /* P1-07: Học tiếp — chụp KQ lúc lưu (vừa gộp "Lưu điểm · Học tiếp" thì lấy điểm vừa gõ). */
      if (chon === 'hoc_tiep') setChup(coKq ? c : { ...c, thi_that_khong_thi: 0, thi_that_l: diemSo.l, thi_that_r: diemSo.r, thi_that_w: diemSo.w, thi_that_s: diemSo.s, thi_that_ngay: ngayNhap || null, thi_that_nhap_luc: new Date().toISOString() });
      LAM_MOI.forEach((k) => invalidate(k));
      setTt(null); setDaChot({ gio: gioVnNay(), chu: chuChot }); bt.reload(); onDaLam();
      return true;
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); return false; }
  };
  const hoanTac = async () => {
    setTt('dang'); setLoi(null);
    /* Học tiếp: ảnh chụp giữ tới khi `/cycles/:id` tải lại có KQ (máy chủ trả về) — không chớp "chờ KQ". */
    try { await api.del(`/cycles/${cycleId}/buoc-tiep`); LAM_MOI.forEach((k) => invalidate(k)); setTt(null); setDaChot(null); cy.reload(); bt.reload(); onDaLam(); }
    catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); }
  };
  const nutTiep = onTiep && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{tenTiep ? t('Việc kế: {ten}', { ten: tenTiep }) : t('Việc tiếp ›')}</button>;
  const nutDong = nutTiep || <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>;
  /* B3-11: chọn Tạm dừng / Kết thúc HOẶC Học tiếp (giữ lớp, Target) ngay khi nhập điểm → một nút: lưu điểm rồi chốt. Lộ trình mới cần dữ liệu máy chủ chỉ có sau khi lưu
     điểm (lớp, Target gợi ý) → nút chỉ lưu điểm, lựa chọn giữ nguyên, panel mở Lộ trình mới ngay. */
  const gopChot = sapChon && (chon === 'dung' || chon === 'hoc_tiep');
  /* Hai lệnh sẵn có, theo thứ tự (PUT outcome → POST buoc-tiep). Điểm lỗi: báo ở bước 1, dừng — bước tiếp chưa gửi. Bước tiếp lỗi: báo ở chân, điểm đã lưu, chữ giữ nguyên, bấm lại chỉ chốt. */
  const luuCaHai = async () => { if ((await luuDiem()) && gopChot) await chot(); };
  const chan = daChot ? {
    huy: null, trai: <span role="status" className={`font-semibold ${LOP_DA_LUU}`}>✓ {t('Đã lưu {gio} · {chon}', { gio: daChot.gio, chon: daChot.chu })}</span>,
    phu: (b.hen || b.hoanTacDuoc) ? <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void hoanTac()}>{t('Hoàn tác')}</button> : null,
    chinh: nutDong,
  } : moDiem ? {
    huy: null,
    trai: tt === 'loi' ? <ChuLuu tt="loi" loi={loi} /> : ttDiem === 'dang' || tt === 'dang' ? <ChuLuu tt="dang" />
      : ttDiem === 'da' && gioDiem ? <ChuLuu tt="da" luc={gioDiem} />
      : !diemDu && !kt ? <span className="text-slate-400">{t('Nhập đủ điểm L R W S để chọn bước tiếp')}</span> : null,
    /* Chủ SP 21/11: chưa có KQ → "Không thi" cùng hàng, cùng cỡ nút chính (em không thi mới phát hiện chưa cập nhật — một bấm). */
    phu: !coKq && !kt ? <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={ttDiem === 'dang' || tt === 'dang'} onClick={() => void guiDiem({ khongThi: true })}>{t('Không thi')}</button> : null,
    chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={ttDiem === 'dang' || tt === 'dang'} onClick={() => void luuCaHai()}>{gopChot ? t('Lưu điểm · {chon}', { chon: chuChot }) : t('Lưu điểm')}</button>,
  } : kt ? {
    huy: null, trai: gioDiem ? <ChuLuu tt="da" luc={gioDiem} /> : null, chinh: nutDong,
  } : daChonTruoc || !b.coTheChon ? {
    huy: null, trai: <span className="text-slate-300">{b.chon ? t('Đã chọn: {chon}', { chon: NHAN_SAU_THI[b.chon] }) : t('Chờ Head / TVV chọn bước tiếp')}</span>,
    chinh: <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>,
  } : {
    huy: null, daSua: !!chon || !!ghiChu.trim(), conThieu: lf.conThieu(loiB),
    trai: tt === 'loi' ? <ChuLuu tt="loi" loi={loi} /> : tt === 'dang' ? <ChuLuu tt="dang" />
      : <span className="font-semibold text-soon">{t('Bước tiếp chưa chốt')}</span>,
    /* GD-18 (lời 36, dòng 40c ⓪): mở từ danh sách còn việc kế → "Đóng" · nút việc · "{việc} · việc tiếp ›" (chính); mở lẻ → nút việc (chính). */
    ...(onTiep ? {
      phu: <><NutDongPanel busy={tt === 'dang'} /><button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void chot()}>{chuChot}</button></>,
      chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luuRoiTiep(chot, onTiep)}>{t('{viec} · việc tiếp ›', { viec: chuChot })}</button>,
    } : {
      chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void chot()}>{chuChot}</button>,
    }),
  };
  if (chon === 'lo_trinh_moi' && !khoaBuoc2 && !moDiem) {
    return (
      <PanelLoTrinhMoi bt={b} hocVien={em} lop={lop} dau={dau} onClose={onDong} quayLai={{ nhan: t('Sau thi'), onClick: () => setChon(null) }}
        onSaved={() => { LAM_MOI.forEach((k) => invalidate(k)); setChon(null); setDaChot({ gio: gioVnNay(), chu: NHAN_SAU_THI.lo_trinh_moi }); cy.reload(); bt.reload(); onDaLam(); }} />
    );
  }

  const khongThiLuu = !!c.thi_that_khong_thi && !moDiem;
  return (
    <KhungPanel hd="sau-thi" tieuDe={tieuDe} dau={dau} quayLai={quayLai} rong={rong} onDong={onDong} chan={chan}
      quyChe={daChot ? null : moDiem && !gopChot ? quyCheKqThiThat() : !khoaBuoc2 && chon === 'dung' ? quyCheDungHoc(b.han ? shortDate(b.han, hn) : null) : null}>
      <div className="flex flex-col gap-4 pt-4">
        <Buoc so={coKq && !moDiem ? '✓' : '1'} xong={coKq && !moDiem} tieuDe={t('Kết quả thi thật')}
          phu={coKq && c.thi_that_nhap_luc ? t('lưu {ngay}', { ngay: shortDate(c.thi_that_nhap_luc, hn) }) : t('không hạn')}>
          {/* Ngày thi (KQTT cũ): sửa được khi nhập điểm; mặc định ngày thi đã chốt. */}
          {moDiem && (
            <Truong nhan={t('Ngày thi')} loi={lfD.loiCua(loiD, 'ngay-thi')}>
              <div className="max-w-[220px]"><ONgay kieu="ngay" toiDa={homNay} toiThieu={c.started_at?.slice(0, 10)} id={lfD.oId('ngay-thi')} invalid={!!lfD.loiCua(loiD, 'ngay-thi')} value={ngayNhap} onChange={setNgayNhap} /></div>
            </Truong>
          )}
          {khongThiLuu ? <p className="m-0 text-sm text-slate-200">{t('Không thi')}{c.outcome_note ? <span className="text-slate-400"> · {c.outcome_note}</span> : null}</p> : (
            <div className="grid grid-cols-5 gap-2 max-sm:grid-cols-4">
              {KN.map((k) => (
                <Truong key={k} nhan={k.toUpperCase()} loi={moDiem ? lfD.loiCua(loiD, `diem-${k}`) : null}>
                  <input className="field w-full text-center tabular-nums" inputMode={kt ? 'numeric' : 'decimal'} autoComplete="off" aria-label={t('Điểm {kn}', { kn: k.toUpperCase() })} readOnly={!moDiem}
                    {...(moDiem ? lfD.o(loiD, `diem-${k}`) : {})} value={diem[k]} onChange={(e) => { setDiem({ ...diem, [k]: e.target.value }); setLayLai(layLai.filter((x) => x !== k)); if (ttDiem === 'loi' || ttDiem === 'da') setTtDiem(null); }} />
                </Truong>
              ))}
              <div className="max-sm:col-span-4">
                <span className="mb-1.5 block text-xs font-semibold text-slate-400">Overall</span>
                <span className="flex h-10 items-center justify-center rounded-lg text-sm font-bold tabular-nums" style={{ background: 'var(--surface-2)' }} aria-label={t('Overall tự tính')}>
                  {kt ? (kqKt && !kqKt.khongThi && kqKt.tong != null ? kqKt.tong : '–')
                    : kq?.ovr != null ? <span className={kq.ketLuan === 'reached' ? 'text-kq-bang' : kq.ketLuan === 'not_reached' ? 'text-bad' : 'text-slate-100'}>{kq.ketLuan === 'reached' ? '✓ ' : ''}{fmtBand(kq.ovr)}</span> : '–'}
                </span>
              </div>
            </div>
          )}
          {!khongThiLuu && !kt && <DongLanTruoc truoc={c.thiTruoc} layLai={layLai} trong={trong} onLay={layTrong} />}
          <div className="flex flex-wrap items-center gap-2">
            {!moDiem && kq && (kq.ketLuan === 'reached' ? <NhanKq kq="dat">{t('Đạt Target {tg}', { tg: fmtBand(target) })}</NhanKq>
              : kq.ketLuan === 'not_reached' ? <NhanKq kq="chua-dat">{t('Chưa đạt Target {tg}', { tg: fmtBand(target) })}</NhanKq> : null)}
            {/* P13: Grade + CEFR tính từ Overall (không lưu) — "Grade B · B1". */}
            {kqKt && !kqKt.khongThi && kqKt.tong != null && <span className="text-[13px] tabular-nums text-slate-300">{chuGradeKyThi(kqKt)}</span>}
            {kqKt && !kqKt.khongThi && kqKt.dat !== null && <NhanKq kq={kqKt.dat ? 'dat' : 'chua-dat'}>{kqKt.dat ? t('Đạt Target') : t('Chưa đạt Target')}</NhanKq>}
            {/* TL-GV (v20, XM-4): đã lưu đủ 4 kỹ năng → "Tuần dạy" mở hộp tóm tắt 5 kỹ năng. */}
            {!moDiem && !kt && !c.thi_that_khong_thi && duBon && (
              <OTuanDay chu kn="ovr" cycleId={cycleId} ten={em.ten} target={c.thi_that_target ?? c.target_score ?? null}
                diem={{ l: c.thi_that_l, r: c.thi_that_r, w: c.thi_that_w, s: c.thi_that_s, ovr: c.outcome_score ?? null }}>{t('Tuần dạy')}</OTuanDay>
            )}
            {ttDiem === 'loi' && <span className="text-[13px]"><ChuLuu tt="loi" loi={loiDiem} /></span>}
            {ttDiem === 'dang' && <span className="text-[13px]"><ChuLuu tt="dang" /></span>}
            <span className="flex-1" />
            {moDiem ? (
              <>
                {coKq && !c.thi_that_khong_thi && !kt && <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" disabled={ttDiem === 'dang'} onClick={() => void guiDiem({ khongThi: true, ghiChu: c.outcome_note ?? '' })}>{t('Không thi')}</button>}
                {suaDiem && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => { setSuaDiem(false); setSuaKq(false); napDiem(c); }}>{t('Huỷ sửa')}</button>}
              </>
            ) : !chup && b.chon !== 'hoc_tiep' && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSuaDiem(true)}>{t('Sửa điểm')}</button>}
          </div>
        </Buoc>

        {!kt && (
          <Buoc so="2" tieuDe={t('Bước tiếp')} mo={!khoaBuoc2 || daChonTruoc || !!daChot} phu={coKq && b.han
              ? (coKq && !moDiem && !b.chon && !daChot && b.coTheGiaHan
                ? <HanBam ten={shortDate(b.han, hn)} onClick={() => setGiaHan(true)}>{t('hạn {ngay}', { ngay: shortDate(b.han, hn) })}</HanBam>
                : t('hạn {ngay}', { ngay: shortDate(b.han, hn) })) : null}>
            {/* Tiêu đề bước đã là "Bước tiếp" — nhóm nút không nhãn riêng; lỗi (sau khi bấm Chốt) ngay dưới. */}
            {/* PTA rà #1952: ba lựa chọn MỘT hàng (rộng theo chữ) khi panel ≥ 480 px, hẹp thì xếp dọc đều — không 2 + 1 lệch (container query, LuaChonRadio dùng chung). */}
            <div {...lf.o(loiB, 'chon')} tabIndex={-1} className="outline-none [container-type:inline-size] [&_[role=radiogroup]]:grid [&_[role=radiogroup]]:grid-cols-1 [@container(min-width:480px)]:[&_[role=radiogroup]]:flex [@container(min-width:480px)]:[&_[role=radiogroup]]:flex-nowrap">
              <LuaChonRadio khungRo ten={`bt-${cycleId}`} nhan={t('Bước tiếp')} value={daChot || daChonTruoc ? (b.chon ? (b.chon === 'tam_dung' || b.chon === 'ket_thuc' ? 'dung' : b.chon === 'hoc_tiep' ? 'hoc_tiep' : 'lo_trinh_moi') : chon) : chon} disabled={khoaBuoc2}
                muc={HUONG_SAU_THI.map((k) => [k, NHAN_HUONG_SAU_THI[k]] as const)} onChange={(k) => { setChon(k); if (tt === 'loi') setTt(null); }} />
              {lf.loiCua(loiB, 'chon') && <p role="alert" className="m-0 mt-1.5 text-[13px] text-bad">{lf.loiCua(loiB, 'chon')}</p>}
            </div>
            {chon === 'dung' && !khoaBuoc2 && <KhoiDung v={dung} onChange={setDung} loTrinh={c.route ?? null} disabled={tt === 'dang'} />}
            {chon === 'hoc_tiep' && !khoaBuoc2 && !moDiem && <KhoiHocTiep bt={b} v={hocTiep} onChange={setHocTiep} loTrinh={c.route ?? null} bamLuu={lf.daBam} disabled={tt === 'dang'} nen="var(--surface-2)" />}
            <Truong nhan={t('Ghi chú')}>
              <textarea className="field w-full" rows={3} maxLength={2000} autoComplete="off" disabled={khoaBuoc2} value={ghiChu} placeholder={t('Trao đổi với HV / PH')}
                onChange={(e) => setGhiChu(e.target.value)} />
            </Truong>
          </Buoc>
        )}
        {giaHan && b.han && <HopGiaHan x={{ cycleId, han: b.han, daGiaHan: b.daGiaHan }} hocVien={em.ten} lop={lop} onClose={() => setGiaHan(false)} onDone={() => { bt.reload(); onDaLam(); }} />}

        {/* GD-4c: "Lịch sử" mở panel Lịch sử thay nội dung. LPB-3 (PTA rà #2318): cùng dáng dòng gập "Lịch sử" (mockup L6a), nằm sau Việc con khi có khung việc. */}
        <CuoiThan><div className="[&>.nut-ls]:flex [&>.nut-ls>button]:min-h-[44px]"><NutLichSuGap so={null} mo={false} nhan={em.ten} onClick={() => setLichSu(true)} /></div></CuoiThan>
      </div>
    </KhungPanel>
  );
}

/** Một bước của panel (mockup `.buoc`): khung viền, số / ✓ trong vòng tròn, tiêu đề + chữ phụ (+ `them`: nút chữ nhỏ cuối dòng); bước chưa mở thì mờ. */
function Buoc({ so, tieuDe, phu, them, xong, mo = true, children }: { so: string; tieuDe: string; phu?: ReactNode; them?: ReactNode; xong?: boolean; mo?: boolean; children: ReactNode }) {
  return (
    <section className={`flex flex-col gap-3 rounded-[10px] border p-4 ${mo ? '' : 'opacity-[.55]'}`} style={{ borderColor: 'var(--line)' }} aria-label={tieuDe}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span aria-hidden className={`inline-flex h-6 w-6 items-center justify-center self-center rounded-full text-xs font-bold ${xong ? 'bg-ok-bg text-ok' : 'text-[color:var(--accent)]'}`}
          style={xong ? undefined : { background: 'var(--accent-soft)' }}>{so}</span>
        <h3 className="m-0 text-[14px] font-bold text-slate-100">{tieuDe}</h3>
        {phu && <span className="text-xs text-slate-400">{phu}</span>}
        {them && <span className="ml-auto">{them}</span>}
      </div>
      {children}
    </section>
  );
}

/**
 * CHỐT NGÀY THI (UI-CV-TVV, mockup `tvv.html` panelChot; N6 — không hạn): em đã tới tháng dự kiến mà chưa có ngày thi. Chốt = Ngày thi (ngày đã qua chọn
 * được — em đã thi) hoặc Dời tháng dự kiến. Cùng đường lưu với Học viên & Lớp › Lịch thi (`PUT /hoc-vien-lop/lich-thi/:cycleId`, máy chủ kiểm quyền + ghi nhật ký).
 * DUONG-LUI-2 (B1-09): lưu xong ô vẫn sửa được — đổi ô thì chân về "Chốt ngày" (lưu lại = sửa, có lịch sử ở Lịch thi), không phải sang trang khác.
 */
export function PanelChotNgayThi({ cycleId, em, lop, duKien, thangDuKien = null, onDong, onDaLam, onTiep, tenTiep }: {
  cycleId: number; em: { id: number; ten: string }; lop: string | null; duKien: string | null; thangDuKien?: string | null;
  onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null; tenTiep?: string | null;
}) {
  const [kieu, setKieu] = useState<'ngay' | 'thang'>('ngay');
  const [ngayThi, setNgayThi] = useState('');
  const [thang, setThang] = useState('');
  const [tt, setTt] = useState<TtLuu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState<{ gio: string; kieu: 'ngay' | 'thang'; gia: string } | null>(null);
  const lfC = useLoiForm();
  /* S4-GD (đề xuất 13): "Dời tháng dự kiến" điền sẵn THÁNG KẾ của tháng dự kiến (`thangDuKien` = yyyy-mm thô từ máy chủ). */
  const thangMacDinh = thangDuKien ? thangKe(thangDuKien) : '';
  const gia = kieu === 'ngay' ? ngayThi : thang;
  /* Đang hiện "Đã lưu" khi ô còn y như lần lưu; sửa ô → về trạng thái lưu. */
  const xong = daLuu && daLuu.kieu === kieu && daLuu.gia === gia ? daLuu.gio : null;
  const loiC = gia ? [] : [{ khoa: kieu, nhan: kieu === 'ngay' ? t('Ngày thi') : t('Tháng thi'), lyDo: kieu === 'ngay' ? t('Chọn ngày thi') : t('Chọn tháng thi') }];
  const luu = async (): Promise<boolean> => {
    lfC.bam();
    if (loiC.length) return false;
    setTt('dang'); setLoi(null);
    try {
      await api.put(`/hoc-vien-lop/lich-thi/${cycleId}`, kieu === 'ngay' ? { ketLuan: 'chot-ngay', ngay: ngayThi } : { ketLuan: 'chuyen-thang', thang });
      LAM_MOI.forEach((k) => invalidate(k));
      setTt(null); setDaLuu({ gio: gioVnNay(), kieu, gia }); onDaLam();
      return true;
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); return false; }
  };
  const nutTiep = onTiep && <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{tenTiep ? t('Việc kế: {ten}', { ten: tenTiep }) : t('Việc tiếp ›')}</button>;
  return (
    <KhungPanel hd="chot-ngay-thi" tieuDe={t('Chốt ngày thi')} onDong={onDong} quyChe={xong ? null : quyCheChotNgayThi(kieu === 'thang')}
      dau={dauViec({ em, lop, ngCanh: duKien ? <span className="inline-flex items-center gap-1.5"><NhanLich loai="du-kien">{duKien}</NhanLich></span> : null })}
      chan={xong ? { huy: null, trai: <span role="status" className={`font-semibold ${LOP_DA_LUU}`}>✓ {t('Đã lưu {gio} · Việc xong', { gio: xong })}</span>,
        chinh: nutTiep || <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button> }
        : { huy: null, daSua: kieu === 'ngay' ? !!ngayThi : !!thang && thang !== thangMacDinh, conThieu: lfC.conThieu(loiC), trai: tt || gia ? <ChuLuu tt={tt ?? 'nhap'} loi={loi} /> : null,
          /* GD-18 (lời 36): còn việc kế → "Đóng" · Chốt ngày · "Chốt ngày · việc tiếp ›" (chính). */
          ...(onTiep && tt !== 'loi' ? {
            phu: <><NutDongPanel busy={tt === 'dang'} /><button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luu()}>{t('Chốt ngày')}</button></>,
            chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luuRoiTiep(luu, onTiep)}>{t('Chốt ngày · việc tiếp ›')}</button>,
          } : {
            chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={tt === 'dang'} onClick={() => void luu()}>{tt === 'loi' ? t('Thử lại') : t('Chốt ngày')}</button>,
          }) }}>
      <div className="flex flex-col gap-4 pt-4">
        <Truong nhan={t('Chốt')} as="div">
          <LuaChonRadio ten={`chot-${cycleId}`} nhan={t('Chốt')} value={kieu} disabled={tt === 'dang'} onChange={(k) => { setKieu(k); if (k === 'thang' && !thang) setThang(thangMacDinh); }}
            muc={[['ngay', t('Ngày thi')], ['thang', t('Dời tháng dự kiến')]]} />
        </Truong>
        {kieu === 'ngay'
          ? <Truong nhan={t('Ngày thi')} loi={lfC.loiCua(loiC, 'ngay')}><div className="max-w-[220px]"><ONgay kieu="ngay" id={lfC.oId('ngay')} invalid={!!lfC.loiCua(loiC, 'ngay')} value={ngayThi} onChange={setNgayThi} disabled={tt === 'dang'} /></div></Truong>
          : <Truong nhan={t('Tháng thi')} loi={lfC.loiCua(loiC, 'thang')}><div className="max-w-[220px]"><ONgay kieu="thang" id={lfC.oId('thang')} invalid={!!lfC.loiCua(loiC, 'thang')} value={thang} onChange={setThang} disabled={tt === 'dang'} /></div></Truong>}
      </div>
    </KhungPanel>
  );
}
