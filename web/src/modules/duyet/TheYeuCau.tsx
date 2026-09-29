import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { fmtTime } from '../../lib/format.ts';
import { useToast } from '../../ui/Toast.tsx';
import { NhanTrangThai } from '../../ui/ui.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useSession } from '../../lib/session.tsx';
import { deadlineView, nhanTrangThaiYc, type TheYeuCauDto } from '@shared/domain/index.ts';

/**
 * MỘT THẺ YÊU CẦU (PR-DUYET, mockup M8, đặc tả §7.6) — MỘT khuôn cho hộp Chờ duyệt, Yêu cầu của tôi, Ngăn Case (`gon`) và hồ sơ HV
 * (PR-VAI). Hàng 1: nhãn phân loại (cùng bề rộng) · việc · học viên · lớp. Hàng 2–3: ai xin, lý do (tối đa 2 dòng, "Xem thêm").
 * "Nếu duyệt: …" chữ phụ. Cột phải: hạn duyệt là TẦNG 1 (đỏ khi quá hạn) rồi nút theo kiểu thẻ.
 *
 * Từ chối / Trả lời / ghi chú khi Duyệt / chọn tuần (Lịch thi) mở ô NGAY TRONG THẺ, bắt buộc ≥ 3 ký tự; Esc đóng và trả focus về nút,
 * Enter gửi. Quyết định không hoàn tác (Q15). Thẻ đã bị người khác xử lý → máy chủ trả 400 → báo và làm mới danh sách.
 */
type O = { loai: 'tu-choi' | 'tra-loi' | 'ghi-chu' | 'tuan' } | null;
const TOI_THIEU = 3;

export function TheYeuCau({ yc, onXong, gon, laNguoiXin, chon, nhanManh, onThemPa }: {
  yc: TheYeuCauDto;
  /** Sau khi thẻ đã được quyết (hoặc phát hiện đã bị người khác xử lý) — nơi gọi làm mới danh sách. */
  onXong: (id: number) => void;
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
}) {
  const toast = useToast();
  const { homNay, ngan } = useNgayNghiepVu();
  const uid = useId();
  const [o, setO] = useState<O>(null);
  const [chu, setChu] = useState('');
  const [tuan, setTuan] = useState<string>(typeof yc.duLieu?.tuanDeNghi === 'string' ? (yc.duLieu.tuanDeNghi as string) : '');
  const [daBam, setDaBam] = useState(false);
  const [loiMay, setLoiMay] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [moHet, setMoHet] = useState(false);
  const [daNhac, setDaNhac] = useState<string | null>((yc.duLieu?.daNhacLuc as string | null) ?? null);
  const nutMo = useRef<HTMLButtonElement | null>(null);
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

  useEffect(() => { if (o && o.loai !== 'tuan') oNhap.current?.focus(); }, [o]);

  const moO = (loai: NonNullable<O>['loai'], nut: HTMLButtonElement) => {
    nutMo.current = nut; setO({ loai }); setChu(''); setDaBam(false); setLoiMay(null);
  };
  /* Đóng ô: nút gốc vẫn trong DOM (chỉ mờ khi ô mở) — đợi React bỏ `disabled` rồi mới trả focus. */
  const dongO = () => { setO(null); setLoiMay(null); setTimeout(() => nutMo.current?.focus(), 0); };

  const gui = async (duongDan: string, than: Record<string, unknown>, xongChu: string) => {
    if (busy) return;
    setBusy(true); setLoiMay(null);
    try {
      await api.post(duongDan, than);
      invalidate('/yeu-cau'); invalidate('/my-work'); invalidate('/cases'); invalidate('/tong-quan');
      toast.push('ok', xongChu);
      setO(null);
      onXong(yc.id);
    } catch (e: any) {
      /* Người khác đã xử lý / thẻ tự đóng: nói rõ rồi làm mới — không để người dùng bấm lại vào một thẻ đã chết. */
      if (e?.status === 400 && /đã được xử lý/.test(e.message ?? '')) { toast.push('error', e.message); onXong(yc.id); return; }
      /* Lỗi mạng (không phải câu của máy chủ): nói bằng tiếng Việt, chữ đang gõ giữ nguyên để bấm lại. */
      setLoiMay(e instanceof ApiError ? e.message : 'Mất kết nối, chưa lưu gì. Kiểm tra mạng rồi bấm lại — chữ bạn gõ vẫn còn.');
    } finally { setBusy(false); }
  };

  const canGhiChu = !!yc.duLieu?.canGhiChu;
  const duyet = (nut: HTMLButtonElement) => {
    if (yc.loai === 'lich_thi') return moO('tuan', nut);
    if (canGhiChu) return moO('ghi-chu', nut);
    void gui(`/yeu-cau/${yc.id}/duyet`, {}, `Đã duyệt: ${yc.tieuDe}`);
  };
  const guiO = () => {
    setDaBam(true);
    if (!o) return;
    if (o.loai === 'tuan') return void gui(`/yeu-cau/${yc.id}/duyet`, { duLieu: tuan ? { tuan } : undefined }, `Đã duyệt: ${yc.tieuDe}`);
    if (chu.trim().length < TOI_THIEU) return;
    if (o.loai === 'tu-choi') return void gui(`/yeu-cau/${yc.id}/tu-choi`, { lyDo: chu.trim() }, 'Đã từ chối — người gửi nhận lý do');
    if (o.loai === 'tra-loi') return void gui(`/yeu-cau/${yc.id}/tra-loi`, { traLoi: chu.trim() }, 'Đã trả lời — giáo viên nhận câu trả lời');
    void gui(`/yeu-cau/${yc.id}/duyet`, { ghiChu: chu.trim() }, `Đã duyệt: ${yc.tieuDe}`);
  };
  const phim = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dongO(); }
    if (e.key === 'Enter' && !e.shiftKey && o?.loai !== 'tuan') { e.preventDefault(); guiO(); }
  };
  const nhac = async () => {
    const khoa = yc.duLieu?.viecKey; const ownerId = yc.duLieu?.ownerId;
    if (busy || typeof khoa !== 'string' || typeof ownerId !== 'number') return;
    setBusy(true);
    try {
      const r = await api.post<{ daNhacLuc: string }>('/my-work/nhac', { key: khoa, ownerId });
      setDaNhac(r.daNhacLuc);
      toast.push('ok', `Đã nhắc ${yc.duLieu?.tenGv ?? 'giáo viên'}`);
    } catch (e: any) { toast.push('error', e instanceof ApiError ? e.message : 'Mất kết nối, chưa nhắc được. Thử lại sau.'); } finally { setBusy(false); }
  };

  const hanV = yc.hanDuyet ? deadlineView({ kind: 'duyet', due: yc.hanDuyet, today: homNay }) : null;
  const tang1 = !hanV ? null : hanV.tone === 'overdue' ? `Quá hạn ${hanV.daysOverdue} ngày` : hanV.homNay ? 'Hạn hôm nay' : hanV.con ? hanV.con[0].toUpperCase() + hanV.con.slice(1) : null;
  const tt = nhanTrangThaiYc(yc.trangThai, yc.tuDuyet);
  const nhanO = o?.loai === 'tu-choi' ? 'Lý do từ chối (người gửi sẽ đọc)' : o?.loai === 'tra-loi' ? 'Câu trả lời cho giáo viên' : 'Ghi chú việc đã xử lý ở màn gốc';
  /* Nút mở thêm một bước (chọn tuần / ghi chú) có dấu "…", như Từ chối… — Duyệt trơn là quyết ngay. */
  const duyetCoBuoc = yc.loai === 'lich_thi' || canGhiChu;
  const loiChu = daBam && o && o.loai !== 'tuan' && chu.trim().length < TOI_THIEU ? `Cần ít nhất ${TOI_THIEU} ký tự` : null;
  const moTaPhu = [!gon && yc.hocVien, !gon && yc.lop, yc.phu].filter(Boolean).join(' · ');

  return (
    <article id={`the-${yc.id}`} data-the-id={yc.id} aria-label={`${yc.nhanPhanLoai}: ${yc.tieuDe}`}
      className={`rounded-lg border p-3 transition-shadow ${nhanManh ? 'shadow-[0_0_0_2px_var(--accent-strong)]' : ''}`}
      style={{ borderColor: hanV?.tone === 'overdue' && cho ? 'rgb(var(--late-line-rgb))' : 'var(--line)', background: 'var(--surface)' }}>
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            {chon && (
              <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-teal-500" checked={chon.checked}
                onChange={(e) => chon.onChange(e.target.checked)} aria-label={`Chọn: ${yc.tieuDe}`} />
            )}
            {!gon && (
              <span className="w-24 shrink-0 truncate rounded border px-1.5 py-0.5 text-center text-[11px] font-semibold text-slate-300"
                style={{ borderColor: 'var(--line-strong)' }}>{yc.nhanPhanLoai}</span>
            )}
            <p className="m-0 min-w-0 text-sm leading-snug">
              <b className="font-semibold text-slate-100">{yc.tieuDe}</b>
              {moTaPhu && <span className="text-slate-400"> · {moTaPhu}</span>}
            </p>
          </div>
          <div className={`mt-1 text-[13px] leading-snug text-slate-300 ${gon ? '' : 'sm:pl-[6.5rem]'}`}>
            <div ref={khungDong} className={moHet ? '' : 'line-clamp-2'}>
              {yc.dong.map((d, i) => <p key={i} className="m-0">{d}</p>)}
            </div>
            {(biCat || moHet) && (
              <button type="button" className="mt-0.5 min-h-[44px] text-[12px] text-teal-300 hover:underline sm:min-h-0" onClick={() => setMoHet(!moHet)}
                aria-expanded={moHet}>{moHet ? 'Thu gọn' : 'Xem thêm'}</button>
            )}
            {yc.neuDuyet && cho && <p className="m-0 mt-1 text-[12px] text-slate-400">Nếu duyệt: {yc.neuDuyet}</p>}
            {!cho && <KetQua yc={yc} ngan={ngan} />}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:items-end sm:text-right">
          {cho ? (
            tang1 && (
              <div className="tabular-nums">
                <div className={`text-sm font-bold ${hanV!.tone === 'overdue' ? 'text-late' : hanV!.homNay ? 'text-soon' : 'text-slate-100'}`}>{tang1}</div>
                <div className="text-[12px] text-slate-400">{hanV!.han}</div>
              </div>
            )
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              <NhanTrangThai t={tt.t} />
              <span className="text-[12px] text-slate-400">{tt.chu}{yc.xuLyLuc ? ` · ${ngan(yc.xuLyLuc)}` : ''}</span>
            </div>
          )}
          {laNguoiXin && cho && <div><NhanTrangThai t="cho-duyet" /></div>}
          {tuDuyetDuoc && (
            <span className="text-[12px] text-wait" title="Bạn tự gửi yêu cầu này. Duyệt được — nhật ký ghi 'tự duyệt' và Quản trị được báo.">
              Bạn tự gửi · tự duyệt được
            </span>
          )}
          {(coNut || yc.mo) && (
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {coNut && yc.kieuNut === 'duyet-tu-choi' && <>
                <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !!o}
                  aria-expanded={o?.loai === 'tuan' || o?.loai === 'ghi-chu'}
                  onClick={(e) => duyet(e.currentTarget)}>{busy && !o ? 'Đang lưu…' : duyetCoBuoc ? 'Duyệt…' : 'Duyệt'}</button>
                <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy || !!o} aria-expanded={o?.loai === 'tu-choi'}
                  onClick={(e) => moO('tu-choi', e.currentTarget)}>Từ chối…</button>
              </>}
              {coNut && yc.kieuNut === 'tra-loi' && <>
                <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !!o} aria-expanded={o?.loai === 'tra-loi'}
                  onClick={(e) => moO('tra-loi', e.currentTarget)}>Trả lời…</button>
                {onThemPa && typeof yc.duLieu?.caseId === 'number' && (
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onThemPa(yc.duLieu!.caseId as number)}>
                    + Thêm PA
                  </button>
                )}
              </>}
              {coNut && yc.kieuNut === 'nhac' && (
                daNhac
                  ? <span className="self-center whitespace-nowrap text-[12px] text-slate-400">✓ Đã nhắc {fmtTime(daNhac)}</span>
                  : <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={nhac}>
                    Nhắc {typeof yc.duLieu?.tenGv === 'string' ? yc.duLieu.tenGv : 'GV'}
                  </button>
              )}
              {!gon && yc.mo && <Link to={yc.mo} className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0">Mở</Link>}
            </div>
          )}
        </div>
      </div>

      {o && (
        <div className="mt-2 space-y-1.5 border-t pt-2" style={{ borderColor: 'var(--line)' }} onKeyDown={phim}>
          {o.loai === 'tuan' ? (
            <div>
              <label className="mb-1 block text-[12px] text-slate-400" htmlFor={`${uid}-tuan`}>Tuần thi mới</label>
              <ONgay id={`${uid}-tuan`} kieu="tuan" value={tuan || null} onChange={setTuan} toiThieu={homNay} ariaLabel="Tuần thi mới" />
              <p className="m-0 mt-1 text-[11px] text-slate-400">Mặc định là tuần GV đề nghị. Tuần đã bắt đầu thì không chọn được.</p>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-[12px] text-slate-400" htmlFor={`${uid}-o`}>
                {nhanO} <span className="text-late">*</span>
              </label>
              <textarea ref={oNhap} id={`${uid}-o`} rows={2} className="field w-full" value={chu} aria-invalid={!!loiChu}
                aria-describedby={loiChu ? `${uid}-loi` : undefined} onChange={(e) => setChu(e.target.value)}
                placeholder={o.loai === 'ghi-chu' ? 'Ví dụ: Đã chuyển sang lớp MB FT 102' : undefined} />
              {loiChu && <p id={`${uid}-loi`} className="m-0 text-[12px] text-late">{loiChu}</p>}
            </div>
          )}
          {loiMay && <p role="alert" className="m-0 text-[12px] text-late">{loiMay}</p>}
          <div className="flex flex-wrap justify-end gap-1.5">
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={dongO} disabled={busy}>Thôi</button>
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={guiO} disabled={busy}>
              {busy ? 'Đang gửi…' : o.loai === 'tu-choi' ? 'Gửi từ chối' : o.loai === 'tra-loi' ? 'Gửi trả lời' : o.loai === 'tuan' ? 'Duyệt dời' : 'Duyệt'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/** Thẻ đã xử lý: ai quyết, lý do/câu trả lời, vì sao tự đóng. */
function KetQua({ yc, ngan }: { yc: TheYeuCauDto; ngan: (d: string | null | undefined) => string }) {
  const ai = yc.nguoiDuyet ? `${yc.nguoiDuyet}` : 'Quản lý';
  if (yc.trangThai === 'tu_choi') return <p className="m-0 mt-1 text-[12px] text-slate-400">{ai} từ chối{yc.xuLyLuc ? ` ${ngan(yc.xuLyLuc)}` : ''}: “{yc.lyDoTuChoi}”</p>;
  if (yc.trangThai === 'da_tra_loi') return <p className="m-0 mt-1 text-[12px] text-slate-400">{ai} trả lời: “{yc.traLoi}”</p>;
  if (yc.trangThai === 'tu_dong') return <p className="m-0 mt-1 text-[12px] text-slate-400">Tự đóng: {yc.lyDoDong}</p>;
  return yc.traLoi ? <p className="m-0 mt-1 text-[12px] text-slate-400">{ai}: “{yc.traLoi}”</p> : null;
}
