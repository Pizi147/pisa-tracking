import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useBaoDangSua } from '../../ui/KhungPanel.tsx';
import { NhanTrangThai, NutChon } from '../../ui/ui.tsx';
import { DongDiem } from '../../ui/SoLieu.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useSession } from '../../lib/session.tsx';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, LOAI_NGUOI_XIN_SUA, deadlineView, kiemGhiRoKhac, laVaiQuanLy, nhanTrangThaiYc, reasonNeedsText,
  type TheYeuCauDto, type TruongDeXuat,
  kyThiCuaChuongTrinh,
} from '@shared/domain/index.ts';
import { ChuyenLopPanel } from '../students/ChuyenLopPanel.tsx';
import { DeXuatSuaPanel } from './DeXuatSuaPanel.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * MỘT THẺ YÊU CẦU (PR-DUYET, mockup M8, đặc tả §7.6) — MỘT khuôn cho hộp Chờ duyệt, Yêu cầu của tôi, Ngăn Case (`gon`) và hồ sơ HV
 * (PR-VAI). Hàng 1: nhãn phân loại (cùng bề rộng) · việc · học viên · lớp. Hàng 2–3: ai xin, lý do (tối đa 2 dòng, "Xem thêm").
 * "Nếu duyệt: …" chữ phụ. Cột phải: hạn duyệt là TẦNG 1 (đỏ khi quá hạn) rồi nút theo kiểu thẻ.
 *
 * Từ chối / Trả lời / ghi chú khi Duyệt / chọn tuần (Lịch thi) mở ô NGAY TRONG THẺ, bắt buộc ≥ 3 ký tự; Esc đóng và trả focus về nút,
 * Enter gửi. Quyết định không hoàn tác (Q15). Thẻ đã bị người khác xử lý → máy chủ trả 400 → báo và làm mới danh sách.
 * OV-7a: NGƯỜI GỬI thẻ còn chờ (loại `LOAI_NGUOI_XIN_SUA`) có `Sửa…` (Đề xuất sửa / chuyển lớp mở lại đúng panel cũ điền sẵn; Không cần theo dõi,
 * Ý thức sửa ngay trong thẻ) và `Rút` (thẻ đóng, không chuông). Quản lý sửa được câu trả lời Xin ý kiến (`Sửa trả lời…`).
 */
type O = { loai: 'tu-choi' | 'tra-loi' | 'ghi-chu' | 'tuan' | 'sua' | 'sua-tra-loi' | 'rut' } | null;

export function TheYeuCau({ yc, onXong, gon, laNguoiXin, chon, nhanManh, onThemPa, panel, moSan, chanEl }: {
  yc: TheYeuCauDto;
  /** Sau khi thẻ đã được quyết (hoặc phát hiện đã bị người khác xử lý) — nơi gọi làm mới danh sách. `chu` = câu kết quả (chỉ khi chính người dùng vừa quyết).
   *  `huy` = máy chủ báo quyết định vừa rồi còn Huỷ được (Q-RL2c: cờ `coTheHuy` trả về sau Duyệt / Từ chối). */
  onXong: (id: number, chu?: string, huy?: boolean) => void;
  /** Bản gọn (Ngăn Case): không lặp học viên/lớp, không nút Mở. */
  gon?: boolean;
  /** Yêu cầu của tôi: không có nút quyết định. */
  laNguoiXin?: boolean;
  /** Ô chọn nhỏ đầu thẻ (duyệt hàng loạt). */
  chon?: { checked: boolean; onChange: (v: boolean) => void } | null;
  /** Viền nhấn 2 giây khi mở từ `?the=`. */
  nhanManh?: boolean;
  /** Xin ý kiến: "+ Thêm PA cho em" mở Thêm PA của Ngăn Case. */
  onThemPa?: (caseId: number) => void;
  /** UI-CON-LAI k3: nằm trong panel duyệt của Hộp duyệt — một cột, tiêu đề ở đầu panel, lý do đọc hết, "Nếu duyệt" thành khối hậu quả, nút ở cuối. */
  panel?: boolean;
  /** V8-CV: mở panel từ nút của dòng — Duyệt… (bước chọn tuần / ghi chú / lệnh chuyển lớp), Từ chối…, Trả lời… mở sẵn ô tương ứng. */
  moSan?: 'duyet' | 'tu-choi' | 'tra-loi';
  /** DUYET-QL (mockup v10 #cv): chân dính của panel duyệt — nút quyết (và nút gửi của ô đang mở) vẽ vào đây qua portal, thân chỉ còn nội dung.
   *  `undefined` = thẻ tự vẽ nút như cũ; `null` = chân chưa gắn (một khung hình). */
  chanEl?: HTMLElement | null;
}) {
  const toast = useToast();
  const { homNay, ngan } = useNgayNghiepVu();
  const uid = useId();
  const [o, setO] = useState<O>(null);
  const [chu, setChu] = useState('');
  /* 6c (lỗi 5): ô Từ chối / Trả lời / Sửa… đang gõ dở → panel chứa thẻ (Tổng quan "Chờ bạn duyệt") hỏi trước khi đóng. */
  useBaoDangSua(!!o && chu.trim() !== (o.loai === 'sua' ? (yc.lyDo ?? '').trim() : ''));
  const [tuan, setTuan] = useState<string>(typeof yc.duLieu?.tuanDeNghi === 'string' ? (yc.duLieu.tuanDeNghi as string) : '');
  const [daBam, setDaBam] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [moHet, setMoHet] = useState(!!panel);
  /* PR-CT: Duyệt thẻ Đề xuất chuyển lớp = mở panel ra lệnh điền sẵn (Quản lý sửa lớp, tuần rồi `Duyệt và quyết định`). */
  const [moChuyenLop, setMoChuyenLop] = useState(false);
  const nutMo = useRef<HTMLButtonElement | null>(null);
  const nutChu = useRef<string | null>(null);
  /* "Xem thêm" chỉ khi chữ THẬT SỰ bị cắt ở 2 dòng (đo, không đoán theo số ký tự). */
  const khungDong = useRef<HTMLDivElement | null>(null);
  const [biCat, setBiCat] = useState(false);
  useLayoutEffect(() => {
    const el = khungDong.current;
    if (el && !moHet) setBiCat(el.scrollHeight > el.clientHeight + 1);
  }, [yc.dong, moHet]);
  const oNhap = useRef<HTMLTextAreaElement | null>(null);
  const cho = yc.trangThai === 'cho';
  const coNut = cho && !laNguoiXin;
  /* Q-D: QL tự gửi thì tự duyệt được — nói trước khi bấm (nhật ký ghi "tự duyệt", Quản trị được báo). */
  const { session } = useSession();
  const tuDuyetDuoc = coNut && yc.kieuNut === 'duyet-tu-choi' && yc.nguoiXinId != null && yc.nguoiXinId === session?.user?.id;
  /* OV-7a: người gửi Sửa / Rút thẻ còn chờ; Quản lý sửa câu trả lời đã gửi. Máy chủ kiểm lại quyền. */
  const nguoiGuiSua = cho && yc.nguoiXinId != null && yc.nguoiXinId === session?.user?.id && LOAI_NGUOI_XIN_SUA.includes(yc.loai);
  /* N37: thẻ xin xoá Case / PA — người gửi chỉ Rút (lý do tuỳ chọn, không có gì để sửa). */
  const chiRut = cho && yc.nguoiXinId != null && yc.nguoiXinId === session?.user?.id && yc.loai === 'xin_xoa';
  const suaTraLoiDuoc = yc.trangThai === 'da_tra_loi' && !laNguoiXin && laVaiQuanLy(session?.roles);
  const [moPanelSua, setMoPanelSua] = useState(false);
  const [lyDoKtd, setLyDoKtd] = useState<string>('');

  useEffect(() => {
    if (!o || o.loai === 'tuan' || o.loai === 'rut') return;
    oNhap.current?.focus();
    /* DUYET-QL: chân dính che đáy thân — đưa ô vừa mở ra giữa vùng nhìn. */
    if (chanEl !== undefined) oNhap.current?.scrollIntoView({ block: 'center' });
  }, [o]);   // eslint-disable-line react-hooks/exhaustive-deps

  const moO = (loai: NonNullable<O>['loai'], nut: HTMLButtonElement, chuDau = '') => {
    nutMo.current = nut; nutChu.current = nut.textContent; setO({ loai }); setChu(chuDau); setDaBam(false); setLoiMay(null);
  };
  /* OV-7a: Sửa… — Đề xuất sửa / chuyển lớp mở lại đúng panel cũ; Không cần theo dõi / Ý thức sửa ngay trong thẻ (điền sẵn). */
  const moSua = (nut: HTMLButtonElement) => {
    if (yc.loai === 'sua_thong_tin' || yc.loai === 'de_xuat_chuyen_lop') return setMoPanelSua(true);
    if (yc.loai === 'khong_theo_doi') {
      setLyDoKtd(typeof yc.duLieu?.reasonCode === 'string' ? yc.duLieu.reasonCode : '');
      return moO('sua', nut, typeof yc.duLieu?.reasonText === 'string' ? yc.duLieu.reasonText : '');
    }
    moO('sua', nut, yc.lyDo ?? '');
  };
  const rut = (nut: HTMLButtonElement) => {
    /* Rút đề xuất Ý thức xoá cả tệp bằng chứng — hỏi một dòng; loại khác rút ngay (gửi lại được). */
    if (yc.loai === 'y_thuc') return moO('rut', nut);
    void gui(`/yeu-cau/${yc.id}/rut`, {}, t('Đã rút — Quản lý không còn thấy yêu cầu này'));
  };
  /* Đóng ô: nút gốc vẫn trong DOM (chỉ mờ khi ô mở) — đợi React bỏ `disabled` rồi mới trả focus. Nút gốc đã mất (thẻ đổi trạng thái / gỡ khỏi
     danh sách sau khi gửi) → nút đầu của thẻ này, hết thẻ thì nút đầu của thẻ còn lại trên trang: focus không rơi về <body> (TAB-A11Y). */
  const traFocus = () => setTimeout(() => {
    const nut = nutMo.current;
    if (nut?.isConnected && !nut.disabled) return nut.focus();
    /* Hộp Chờ duyệt: nút quyết ở chân panel (portal) dựng lại khi ô đóng → tìm lại đúng nút theo chữ, không có thì nút đầu. */
    const nut2 = Array.from((chanEl ?? document.getElementById(`the-${yc.id}`))?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []);
    (nut2.find((x) => x.textContent === nutChu.current) ?? nut2[0]
      ?? document.querySelector<HTMLElement>('[data-the-id] button:not(:disabled)'))?.focus();
  }, 0);
  const dongO = () => { setO(null); setLoiMay(null); traFocus(); };

  const gui = async (duongDan: string, than: Record<string, unknown>, xongChu: string, put = false) => {
    if (busy) return;
    setBusy(true); setLoiMay(null);
    try {
      const kq = put ? await api.put<{ coTheHuy?: boolean }>(duongDan, than) : await api.post<{ coTheHuy?: boolean }>(duongDan, than);
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan');
      /* UI-CON-LAI k3: quyết định CỦA CHÍNH MÌNH vừa bấm → Hoàn tác 5 s (đường "Huỷ quyết định" sẵn có — máy chủ kiểm lại quyền + trong ngày).
         Q-RL2c: theo cờ `coTheHuy` máy chủ trả về sau Duyệt / Từ chối (không danh sách loại cứng ở web). Sau 5 s: "Huỷ quyết định" ở Đã xử lý. */
      const huyDuoc = !!kq?.coTheHuy && /\/(duyet|tu-choi)$/.test(duongDan);
      if (huyDuoc) toast.hoanTac(xongChu, () => { void huy(); }, { key: `yc-${yc.id}` });
      else toast.push('ok', xongChu);
      setO(null);
      if (o) traFocus();
      onXong(yc.id, xongChu, huyDuoc);
    } catch (e: any) {
      /* Người khác đã xử lý / thẻ tự đóng: nói rõ rồi làm mới — không để người dùng bấm lại vào một thẻ đã chết. */
      if (e?.status === 400 && /đã được xử lý/.test(e.message ?? '')) { toast.push('error', e.message); onXong(yc.id); return; }
      /* Lỗi mạng (không phải câu của máy chủ): nói bằng tiếng Việt, chữ đang gõ giữ nguyên để bấm lại. */
      setLoiMay(e instanceof ApiError ? e.message : t('Mất kết nối, chưa lưu gì. Kiểm tra mạng rồi bấm lại — chữ bạn gõ vẫn còn.'));
    } finally { setBusy(false); }
  };

  const canGhiChu = !!yc.duLieu?.canGhiChu;
  const duyet = (nut: HTMLButtonElement) => {
    if (yc.duLieu?.moPanelChuyenLop) return setMoChuyenLop(true);
    if (yc.loai === 'lich_thi') return moO('tuan', nut);
    if (canGhiChu) return moO('ghi-chu', nut);
    void gui(`/yeu-cau/${yc.id}/duyet`, {}, t('Đã duyệt: {tieuDe}', { tieuDe: yc.tieuDe }));
  };
  const daMoSan = useRef(false);
  useEffect(() => {
    if (!moSan || daMoSan.current || !cho) return;
    daMoSan.current = true;
    if (moSan === 'tu-choi' || moSan === 'tra-loi') setO({ loai: moSan });
    else if (yc.duLieu?.moPanelChuyenLop) setMoChuyenLop(true);
    else if (yc.loai === 'lich_thi') setO({ loai: 'tuan' });
    else if (canGhiChu) setO({ loai: 'ghi-chu' });
  }, [moSan]);   // eslint-disable-line react-hooks/exhaustive-deps
  const guiO = () => {
    setDaBam(true);
    if (!o) return;
    if (o.loai === 'tuan') return void gui(`/yeu-cau/${yc.id}/duyet`, { duLieu: tuan ? { tuan } : undefined }, t('Đã duyệt: {tieuDe}', { tieuDe: yc.tieuDe }));
    if (o.loai === 'rut') return void gui(`/yeu-cau/${yc.id}/rut`, {}, t('Đã rút đề xuất'));
    if (o.loai === 'sua' && yc.loai === 'khong_theo_doi') {
      if (!lyDoKtd || (reasonNeedsText(lyDoKtd) && kiemGhiRoKhac(chu))) return;
      return void gui(`/yeu-cau/${yc.id}`, { reasonCode: lyDoKtd, reasonText: reasonNeedsText(lyDoKtd) ? chu.trim() : undefined }, t('Đã lưu yêu cầu'), true);
    }
    if (!chu.trim()) return;
    if (o.loai === 'sua') return void gui(`/yeu-cau/${yc.id}`, { note: chu.trim() }, t('Đã lưu đề xuất'), true);
    if (o.loai === 'sua-tra-loi') return void gui(`/yeu-cau/${yc.id}/sua-tra-loi`, { traLoi: chu.trim() }, t('Đã sửa câu trả lời — giáo viên được báo'));
    if (o.loai === 'tu-choi') return void gui(`/yeu-cau/${yc.id}/tu-choi`, { lyDo: chu.trim() }, t('Đã từ chối — người gửi nhận lý do'));
    if (o.loai === 'tra-loi') return void gui(`/yeu-cau/${yc.id}/tra-loi`, { traLoi: chu.trim() }, t('Đã trả lời — giáo viên nhận câu trả lời'));
    void gui(`/yeu-cau/${yc.id}/duyet`, { ghiChu: chu.trim() }, t('Đã duyệt: {tieuDe}', { tieuDe: yc.tieuDe }));
  };
  const phim = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dongO(); }
    if (e.key === 'Enter' && !e.shiftKey && o?.loai !== 'tuan' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); guiO(); }
  };
  /* PR-LUI-a2: Huỷ quyết định bấm nhầm (Đề xuất PA quyết hôm nay, PA chưa ghi kết quả) — thẻ về Chờ duyệt, PA về như lúc gửi. */
  /* Gọi từ nút ở thẻ hoặc từ toast Hoàn tác (thẻ có thể đã rời danh sách) — lỗi thì báo ở thẻ và qua toast. */
  async function huy() {
    setBusy(true); setLoiMay(null);
    try {
      await api.post(`/yeu-cau/${yc.id}/huy-quyet-dinh`);
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan');
      toast.push('ok', t('Đã huỷ quyết định · thẻ về Chờ duyệt'));
      onXong(yc.id);
    } catch (e: any) {
      const loi = e instanceof ApiError ? e.message : t('Mất kết nối, chưa huỷ được. Kiểm tra mạng rồi bấm lại.');
      setLoiMay(loi); toast.push('error', loi);
    } finally { setBusy(false); }
  }

  const hanV = yc.hanDuyet ? deadlineView({ kind: 'duyet', due: yc.hanDuyet, today: homNay }) : null;
  const tang1 = !hanV ? null : hanV.tone === 'overdue' ? t('Quá hạn · {daysOverdue} ngày', { daysOverdue: hanV.daysOverdue }) : hanV.homNay ? t('Hạn hôm nay') : hanV.con ? hanV.con[0].toUpperCase() + hanV.con.slice(1) : null;
  const tt = nhanTrangThaiYc(yc.trangThai, yc.tuDuyet);
  /* LUAT-5: thẻ Thu hồi — ô Sửa là "Lý do" (không tối thiểu ký tự, như Từ chối). */
  const thuHoi = yc.loai === 'thu_hoi_y_thuc';
  const nhanO = o?.loai === 'tu-choi' ? t('Lý do từ chối (người gửi sẽ đọc)') : o?.loai === 'tra-loi' || o?.loai === 'sua-tra-loi' ? t('Câu trả lời cho giáo viên')
    : o?.loai === 'sua' ? (thuHoi ? t('Lý do') : t('Mô tả đề xuất')) : t('Ghi chú việc đã xử lý ở màn gốc');
  const suaKtd = o?.loai === 'sua' && yc.loai === 'khong_theo_doi';
  /* Nút mở thêm một bước (chọn tuần / ghi chú) có dấu "…", như Từ chối… — Duyệt trơn là quyết ngay. */
  const duyetCoBuoc = yc.loai === 'lich_thi' || canGhiChu || !!yc.duLieu?.moPanelChuyenLop;
  const loiChu = !daBam || !o || o.loai === 'tuan' || o.loai === 'rut' ? null
    : suaKtd ? (!lyDoKtd ? t('Chọn một lý do') : reasonNeedsText(lyDoKtd) ? kiemGhiRoKhac(chu) : null)
    : !chu.trim() ? t('Chưa điền')   // T7 (PR-MTa): không tối thiểu ký tự
    : o.loai === 'sua' && !thuHoi && chu.trim().length < 10 ? t('Mô tả cần ít nhất 10 ký tự') : null;
  const moTaPhu = [!gon && yc.hocVien, !gon && yc.lop, yc.phu].filter(Boolean).join(' · ');
  /* DUYET-QL: ở chân panel thứ tự như mockup (Từ chối… · Duyệt chính bên phải); thẻ tự vẽ giữ Duyệt trước. */
  const btnChan = chanEl !== undefined ? 'btn min-h-[44px] sm:min-h-0' : 'btn btn-sm min-h-[44px] sm:min-h-0';
  const nutDuyet = (
    <button key="d" type="button" className={`${btnChan} btn-primary`} disabled={busy || !!o}
      aria-expanded={o?.loai === 'tuan' || o?.loai === 'ghi-chu'}
      onClick={(e) => duyet(e.currentTarget)}>{busy && !o ? t('Đang lưu…') : duyetCoBuoc ? t('Duyệt…') : t('Duyệt')}</button>
  );
  const nutTuChoi = (
    <button key="tc" type="button" className={btnChan} disabled={busy || !!o} aria-expanded={o?.loai === 'tu-choi'}
      onClick={(e) => moO('tu-choi', e.currentTarget)}>{t('Từ chối…')}</button>
  );
  const nutQuyet = !coNut ? null : yc.kieuNut === 'duyet-tu-choi' ? <>{chanEl !== undefined ? [nutTuChoi, nutDuyet] : [nutDuyet, nutTuChoi]}</> : yc.kieuNut !== 'tra-loi' ? null : <>
    {onThemPa && typeof yc.duLieu?.caseId === 'number' && chanEl !== undefined && (
      <button type="button" className={btnChan} onClick={() => onThemPa(yc.duLieu!.caseId as number)}>{t('+ Thêm PA')}</button>
    )}
    <button type="button" className={`${btnChan} btn-primary`} disabled={busy || !!o} aria-expanded={o?.loai === 'tra-loi'}
      onClick={(e) => moO('tra-loi', e.currentTarget)}>{t('Trả lời…')}</button>
    {onThemPa && typeof yc.duLieu?.caseId === 'number' && chanEl === undefined && (
      <button type="button" className={btnChan} onClick={() => onThemPa(yc.duLieu!.caseId as number)}>{t('+ Thêm PA')}</button>
    )}
  </>;
  const nutO = o && <>
    <button type="button" className={btnChan} onClick={dongO} disabled={busy}>{o.loai !== 'tuan' && o.loai !== 'rut' && chu.trim() ? t('Huỷ thay đổi') : t('Đóng')}</button>
    <button type="button" className={`${btnChan} ${o.loai === 'rut' ? 'btn-danger' : 'btn-primary'}`} onClick={guiO} disabled={busy}>
      {busy ? t('Đang gửi…') : o.loai === 'tu-choi' ? t('Gửi từ chối') : o.loai === 'tra-loi' ? t('Gửi trả lời') : o.loai === 'tuan' ? t('Trả lời đề nghị dời')
        : o.loai === 'rut' ? t('Rút đề xuất') : o.loai === 'sua' || o.loai === 'sua-tra-loi' ? t('Lưu') : t('Duyệt')}
    </button>
  </>;

  return (
    <article id={`the-${yc.id}`} data-the-id={yc.id} aria-label={`${dich(yc.nhanPhanLoai)}: ${dich(yc.tieuDe)}`}
      className={panel ? 'pt-3' : `rounded-lg border p-3 transition-shadow ${nhanManh ? 'shadow-[0_0_0_2px_var(--accent-strong)]' : ''}`}
      style={panel ? undefined : { borderColor: hanV?.tone === 'overdue' && cho ? 'rgb(var(--late-line-rgb))' : 'var(--line)', background: 'var(--surface)' }}>
      <div className={panel ? 'flex flex-col gap-3' : 'grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]'}>
        <div className="min-w-0">
          {!panel && <div className="flex items-start gap-2">
            {chon && (
              /* OV-11i (P2-3): bọc <label> — vùng chạm 44 × 44 ở điện thoại (`after:`, mẫu MenuDong), ô tích giữ 16 px. */
              <label className="relative mt-1 inline-flex shrink-0 cursor-pointer max-sm:after:absolute max-sm:after:left-1/2 max-sm:after:top-1/2 max-sm:after:h-11 max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2 max-sm:after:content-['']">
                <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" checked={chon.checked}
                  onChange={(e) => chon.onChange(e.target.checked)} aria-label={t('Chọn: {tieuDe}', { tieuDe: dich(yc.tieuDe) })} />
              </label>
            )}
            {!gon && (
              /* PR-HK1 H4: chip nền nhạt, không viền — viền xám làm nhãn trông như nút thao tác. */
              <span className="w-24 shrink-0 truncate rounded bg-muted-bg px-1.5 py-0.5 text-center text-[12px] font-semibold text-muted">{dich(yc.nhanPhanLoai)}</span>
            )}
            <p className="m-0 min-w-0 text-sm leading-snug">
              <b className="font-semibold text-slate-100">{dich(yc.tieuDe)}</b>
              {moTaPhu && <span className="text-slate-400"> · {dich(moTaPhu)}</span>}
            </p>
          </div>}
          <div className={`mt-1 text-[13px] leading-snug text-slate-300 ${gon || panel ? '' : 'sm:pl-[6.5rem]'}`}>
            <div ref={khungDong} className={panel ? 'rounded-lg bg-[color:var(--surface-2)] px-3 py-2.5' : moHet ? '' : 'line-clamp-2'}>
              {yc.dong.map((d, i) => <p key={i} className="m-0 whitespace-pre-line">{dich(d)}</p>)}
              {/* DUYET-QL: điểm lượt làm em vào SOS (`diemHv` máy chủ đã gắn — 0 câu thêm), cùng mẫu dòng điểm mọi panel. */}
              {panel && yc.diemHv && (
                <dl className="m-0 mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                  <dt className="pt-1.5 text-[13px] text-dim">{t('Điểm')}</dt><dd className="m-0 min-w-0"><DongDiem d={yc.diemHv} /></dd>
                </dl>
              )}
            </div>
            {(biCat || moHet) && !panel && (
              <button type="button" className="mt-0.5 min-h-[44px] text-[12px] text-[color:var(--accent-strong)] hover:underline sm:min-h-0" onClick={() => setMoHet(!moHet)}
                aria-expanded={moHet}>{moHet ? t('Thu gọn') : t('Xem thêm')}</button>
            )}
            {yc.neuDuyet && cho && (panel ? (
              /* k3: hậu quả nêu TRƯỚC khi bấm — khối vàng như mockup. */
              <div className="mt-3 rounded-lg border px-3 py-2.5 text-[13px]" style={{ borderColor: 'rgb(var(--soon-line-rgb))', background: 'rgb(var(--soon-bg-rgb))' }}>
                <b className="block font-semibold" style={{ color: 'rgb(var(--soon-rgb))' }}>{t('Sau khi duyệt:')}</b>
                <span className="text-slate-200">{dich(yc.neuDuyet)}</span>
              </div>
            ) : <p className="m-0 mt-1 text-[12px] text-slate-400">{t('Nếu duyệt: {neuDuyet}', { neuDuyet: dich(yc.neuDuyet) })}</p>)}
            {!cho && <KetQua yc={yc} ngan={ngan} />}
          </div>
        </div>

        <div className={`flex flex-col gap-1.5 ${panel ? 'items-end border-t pt-3 text-right' : 'sm:items-end sm:text-right'}`} style={panel ? { borderColor: 'var(--line)' } : undefined}>
          {cho ? (
            tang1 && !panel && (
              <div className="tabular-nums">
                <div className={`text-sm font-bold ${hanV!.tone === 'overdue' ? 'text-late' : hanV!.ganHan ? 'text-soon' : 'text-slate-100'}`}>{tang1}</div>
                <div className="text-[12px] text-slate-400">{hanV!.han}</div>
              </div>
            )
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              <NhanTrangThai t={tt.t} />
              <span className="text-[12px] text-slate-400">{dich(tt.chu)}{yc.xuLyLuc ? ` · ${ngan(yc.xuLyLuc)}` : ''}</span>
            </div>
          )}
          {laNguoiXin && cho && <div><NhanTrangThai t="cho-duyet" /></div>}
          {(nguoiGuiSua || chiRut) && (
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {nguoiGuiSua && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy || !!o} aria-expanded={o?.loai === 'sua' || moPanelSua}
                onClick={(e) => moSua(e.currentTarget)}>{t('Sửa…')}</button>}
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy || !!o} onClick={(e) => rut(e.currentTarget)}>
                {busy && !o ? t('Đang rút…') : t('Rút')}</button>
            </div>
          )}
          {suaTraLoiDuoc && (
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy || !!o} aria-expanded={o?.loai === 'sua-tra-loi'}
                onClick={(e) => moO('sua-tra-loi', e.currentTarget, yc.traLoi ?? '')}>{t('Sửa trả lời…')}</button>
            </div>
          )}
          {!cho && !laNguoiXin && yc.coTheHuy && (
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void huy()}>
                {busy ? t('Đang huỷ…') : t('Huỷ quyết định')}
              </button>
            </div>
          )}
          {tuDuyetDuoc && (
            <span className="text-[12px] text-muted" title={t('Bạn tự gửi yêu cầu này. Duyệt được — nhật ký ghi \'tự duyệt\' và Quản trị được báo.')}>
              {t('Bạn tự gửi · tự duyệt được')}
            </span>
          )}
          {(chanEl === undefined && nutQuyet || (!gon && yc.mo)) && (
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {chanEl === undefined && nutQuyet}
              {!gon && yc.mo && <Link to={yc.mo} className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0">{t('Mở ›')}</Link>}
            </div>
          )}
        </div>
      </div>

      {o && (
        <div className="mt-2 space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--line)' }} onKeyDown={phim}>
          {o.loai === 'rut' ? (
            <p className="m-0 text-[13px] text-slate-300">{t('Rút đề xuất này? Vi phạm về chưa xử lý, tệp bằng chứng bị xoá.')}</p>
          ) : suaKtd ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Lý do không cần theo dõi')}>
                {CASE_DISMISS_REASONS.map((r) => <NutChon key={r} nho chon={lyDoKtd === r} onClick={() => setLyDoKtd(r)}>{CASE_DISMISS_REASON_LABEL[r]}</NutChon>)}
              </div>
              <OKhac hien={reasonNeedsText(lyDoKtd)} value={chu} onChange={setChu} goiY={t('Ví dụ: Em ốm cả tuần Test')} loi={daBam ? loiChu : null} />
              {daBam && !lyDoKtd && <p className="m-0 text-[12px] text-late">{loiChu}</p>}
            </div>
          ) : o.loai === 'tuan' ? (
            <div>
              <label className="mb-1 block text-[12px] text-slate-400" htmlFor={`${uid}-tuan`}>{t('Tuần Test mới')}</label>
              <ONgay id={`${uid}-tuan`} kieu="tuan" value={tuan || null} onChange={setTuan} toiThieu={homNay} ariaLabel={t('Tuần Test mới')} />
              <p className="m-0 mt-1 text-xs text-slate-400">{t('Mặc định là tuần GV đề nghị. Tuần đã bắt đầu thì không chọn được.')}</p>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-[12px] text-slate-400" htmlFor={`${uid}-o`}>
                {nhanO} <span className="text-late">*</span>
              </label>
              <textarea ref={oNhap} id={`${uid}-o`} rows={2} className="field w-full" value={chu} aria-invalid={!!loiChu}
                aria-describedby={loiChu ? `${uid}-loi` : undefined} onChange={(e) => setChu(e.target.value)}
                placeholder={o.loai === 'ghi-chu' ? t('Ví dụ: Đã chuyển sang lớp MB FT 102') : undefined} />
              {loiChu && <p id={`${uid}-loi`} className="m-0 text-[12px] text-late">{loiChu}</p>}
            </div>
          )}
          {loiMay && <p role="alert" className="m-0 text-[12px] text-late">{loiMay}</p>}
          {chanEl === undefined && <div className="flex flex-wrap justify-end gap-1.5">{nutO}</div>}
        </div>
      )}
      {chanEl && createPortal(o ? nutO : nutQuyet, chanEl)}
      {!o && loiMay && <p role="alert" className="m-0 mt-2 text-[12px] text-late">{loiMay}</p>}
      {moPanelSua && yc.hocVienId != null && yc.loai === 'sua_thong_tin' && (
        <DeXuatSuaPanel studentId={yc.hocVienId} studentName={yc.hocVien ?? ''} lop={yc.lop}
          hienTai={{ kyThi: kyThiCuaChuongTrinh(yc.duLieu?.kyThi as string | undefined) }}
          sua={{ id: yc.id, truong: yc.duLieu?.truong as TruongDeXuat, moi: yc.duLieu?.moi == null ? '' : String(yc.duLieu.moi), lyDo: yc.lyDo ?? '' }}
          onClose={() => setMoPanelSua(false)} onDone={() => onXong(yc.id)} />
      )}
      {moPanelSua && yc.hocVienId != null && yc.loai === 'de_xuat_chuyen_lop' && (
        <ChuyenLopPanel open cheDo="de-xuat" studentId={yc.hocVienId} studentName={yc.hocVien ?? undefined} lop={yc.lop}
          duyet={{ id: yc.id, lopDichId: (yc.duLieu?.lopDichId as number | null) ?? null, tuan: (yc.duLieu?.tuan as string | null) ?? null, lyDo: yc.lyDo, resetBac: yc.duLieu?.resetBac === true }}
          onClose={() => setMoPanelSua(false)} onDone={() => onXong(yc.id)} />
      )}
      {moChuyenLop && yc.hocVienId != null && (
        <ChuyenLopPanel open cheDo="lenh" studentId={yc.hocVienId} studentName={yc.hocVien ?? undefined} lop={yc.lop}
          duyet={{ id: yc.id, lopDichId: (yc.duLieu?.lopDichId as number | null) ?? null, tuan: (yc.duLieu?.tuan as string | null) ?? null, lyDo: yc.lyDo, resetBac: yc.duLieu?.resetBac === true }}
          onClose={() => setMoChuyenLop(false)} onDone={() => onXong(yc.id, t('Đã duyệt: {tieuDe}', { tieuDe: yc.tieuDe }))} />
      )}
    </article>
  );
}

/** Thẻ đã xử lý: ai quyết, lý do/câu trả lời, vì sao tự đóng. */
function KetQua({ yc, ngan }: { yc: TheYeuCauDto; ngan: (d: string | null | undefined) => string }) {
  const ai = yc.nguoiDuyet ? `${yc.nguoiDuyet}` : t('Quản lý');
  /* PR-BV: thẻ đã quyết mà sau đó "-" bị xoá — giữ quyết định, thêm "vắng đã gỡ" (`lyDoDong`). */
  const goVang = yc.lyDoDong && yc.trangThai !== 'tu_dong' ? ` · ${yc.lyDoDong}` : '';
  if (yc.trangThai === 'tu_choi') return <p className="m-0 mt-1 text-[12px] text-slate-400">{t('{ai} từ chối', { ai })}{yc.xuLyLuc ? ` ${ngan(yc.xuLyLuc)}` : ''}: “{yc.lyDoTuChoi}”{goVang}</p>;
  if (yc.trangThai === 'da_tra_loi') return <p className="m-0 mt-1 text-[12px] text-slate-400">{t('{ai} trả lời: “{traLoi}”', { ai, traLoi: yc.traLoi })}</p>;
  if (yc.trangThai === 'tu_dong') return <p className="m-0 mt-1 text-[12px] text-slate-400">{t('Tự đóng: {lyDoDong}', { lyDoDong: yc.lyDoDong })}</p>;
  if (!yc.traLoi) return goVang ? <p className="m-0 mt-1 text-[12px] text-slate-400">{t('{ai} đã duyệt{goVang}', { ai, goVang })}</p> : null;
  return <p className="m-0 mt-1 text-[12px] text-slate-400">{ai}: “{yc.traLoi}”{goVang}</p>;
}
