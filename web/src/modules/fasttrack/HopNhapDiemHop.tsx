/**
 * TD-WEB-2: THÂN HỘP nhập điểm MT + khung hộp + hộp nhận xét lớp thường — mảnh JS riêng, tải khi mở hộp thật (`lazyHop` ở `HopNhapDiem.tsx`).
 * Ô điểm (`ODiemMt`) và nút "Nhận xét" ở lại `HopNhapDiem.tsx`; luật / ngữ cảnh dùng chung nhập lại từ đó. Mô tả hộp: đầu `HopNhapDiem.tsx`.
 */
import { LOP_DA_LUU } from '../../ui/KhuonViec.tsx';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CAU_THIEU_NHAN_XET, CHU_THAO_TAC, LOI_SO_CAU, LOI_SO_CAU_KHOANG, NHAN_XET_TOI_DA, TRAN_CHU, bandTuSoCau, caHaiKieu, canNhomNguyenNhan, criteriaPatchFrom, kiemTieuChi, LOI_MOT_KIEU, ngay, rawPatchFrom, roundToHalf, soKyVong, thieuNhanXetMt, tieuChiNganCua, tuanLich, type BangQuyDoi, type NguoiChon } from '@shared/domain/index.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useGiuFocus } from '../../ui/giuFocus.ts';
import { DemChu } from '../../ui/KhungPanel.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { MuiTenKyVong } from '../../ui/BieuTuong.tsx';
import { useBaoHopLyDoMo } from '../../ui/SaveState.tsx';
import { cungGvCham, gvChamPayload, gvChamThanhChon } from '../cham/GvCham.tsx';
import { ChonNhom, viDuNhanXet } from './NhanXet.tsx';
import {
  bandBanDau, chanDau, coDiemChinhThuc, type SavePatch} from './ScoreEntry.tsx';
import { t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { khoRoiNhap } from '../../ui/chanRoiNhap.tsx';
import { ChuDich, type NguonDich } from '../../ui/ChuDich.tsx';
import { laLR, lucNgan, lyDoHuyO, LichSuO, O_NGUOI_CHAM, oVangCua, type HopProps } from './HopNhapDiem.tsx';

export function HopNhapDiem({ cell, anchor, ctx, onSave, onDong, onTiep, nhanTiep = null, tiepEm = false, ketThuc = null, gvMacDinh = null, tuanXem = null }: HopProps) {
  const { homNay } = useNgayNghiepVu();
  const { session } = useSession();
  const motO = laLR(cell.skill) || !!ctx.mt0;     // một ô: số câu (L/R) hoặc Band (MT0)
  const theoBand = !!ctx.mt0;
  const vang = oVangCua(cell, tuanXem);
  /* OV-11a (TE-2): tuần thi bù — ô thường, dấu "-" tuần gốc chỉ còn là dòng "vắng lần 1 · dời từ …" (+ Bỏ vắng). */
  const thiBu = !!cell.daChot?.doiSang && !vang;
  const nhapDuoc = cell.canEdit;
  const laS = cell.skill === 'speaking';
  const laW = cell.skill === 'writing1' || cell.skill === 'writing2';
  const tc = tieuChiNganCua(cell.skill) ?? [];

  const [t0] = useState(() => {
    if (vang) return '';
    /* "-" sẵn trong ô chỉ khi là dấu của CHÍNH tuần thi (`chanDau`) — dấu tuần gốc ở tuần thi bù thì ô trống: gõ "-" là lệnh mới (TE-2). */
    if (theoBand) return cell.band !== null ? fmtBand(cell.band) : chanDau(cell) ? '-' : '';
    return cell.rawScore !== null ? String(cell.rawScore) : cell.band !== null ? fmtBand(cell.band) : chanDau(cell) ? '-' : '';
  });
  const [vals0] = useState<string[]>(() => (vang || motO ? ['', '', '', '']
    : chanDau(cell) && cell.criteria.every((v) => v === null) ? ['-', '', '', ''] : cell.criteria.map((v) => (v === null ? '' : String(v)))));
  /* BAND-THANG: W1 / W2 / S ở mọi lượt — 4 tiêu chí (Band tự tính, hiện mờ trong ô Band) HOẶC chỉ ô Band; ô cũ chỉ có band thì ô Band mang sẵn band đó. */
  const [band0] = useState(() => (vang || motO ? '' : bandBanDau(cell)));
  const [tho, setT] = useState(t0);
  const [vals, setVals] = useState(vals0);
  const [bandText, setBandText] = useState(band0);
  const [nx, setNx] = useState(cell.nhanXet ?? '');
  const nhom0 = cell.nhomNguyenNhan ?? [];
  const [nhom, setNhom] = useState<string[]>(nhom0);
  const gvCu = gvChamThanhChon(cell.gvCham);
  const gv0 = gvCu ?? gvMacDinh;
  const [gv, setGv] = useState<NguoiChon | null>(gv0);
  const [lyDo, setLyDo] = useState('');
  /* "Đang lưu…" chỉ ở nút đã bấm; khoá chống bấm đôi là ref (state chưa kịp vẽ lại khi Enter lặp). */
  const [dangLuu, setDangLuu] = useState<null | 'luu' | 'tiep' | 'khac'>(null);
  const busy = dangLuu !== null;
  const dangGui = useRef(false);
  const [loi, setLoi] = useState<{ cau: string; o: number | null } | null>(null);
  const oNguoiChamRef = useRef<HTMLDivElement>(null);
  const luoiRef = useRef<HTMLDivElement>(null);
  /* V12: "Lưu" ở lại — ảnh chữ lúc lưu xong; chữ còn y nguyên = "✓ Đã lưu" (gõ tiếp là chưa lưu). */
  const [luuAnh, setLuuAnh] = useState<string | null>(null);
  const loiRef = useRef<HTMLDivElement>(null);
  const nutHetRef = useRef<HTMLButtonElement>(null);

  const bangQd = useApi<BangQuyDoi>('/ref/bang-quy-doi').data;
  /* Lệnh điểm từ chữ đang gõ — cùng hàm với mọi nơi nhập. `o` = ô sai (0..3 tiêu chí / ô một, 4 = Band) để tô đỏ. */
  const diem = (() => {
    if (motO) {
      const doi = tho.trim() !== t0.trim();
      if (theoBand) {
        const s = tho.trim();
        if (s === '-') return { doi, patch: { noShow: true } as SavePatch, loi: null, o: null, preview: null };
        if (s === '') return { doi, patch: (chanDau(cell) ? { noShow: false } : { band: null }) as SavePatch, loi: null, o: null, preview: null };
        const r = criteriaPatchFrom(['', '', '', ''], cell, s);   // MT0: một ô Band, nhập thẳng
        return { doi, patch: r.patch as SavePatch | null, loi: r.loi, o: r.patch ? null : 0, preview: r.preview };
      }
      const p = rawPatchFrom(tho, cell) as SavePatch | null;
      if (!p) return { doi, patch: null, loi: LOI_SO_CAU, o: 0, preview: null };
      if (p.rawScore != null) {
        /* BAND-QUY-DOI: xem trước theo bảng ĐANG DÙNG (cùng hàm máy chủ); bảng chưa tải xong thì chưa hiện band — máy chủ vẫn tính khi lưu. */
        if (!Number.isInteger(p.rawScore) || p.rawScore < 0 || p.rawScore > 40) return { doi, patch: null, loi: LOI_SO_CAU_KHOANG, o: 0, preview: null };
        return { doi, patch: p, loi: null, o: null, preview: bangQd ? bandTuSoCau(bangQd, cell.skill as 'listening' | 'reading', p.rawScore) : null };
      }
      return { doi, patch: p, loi: null, o: null, preview: p.band ?? null };
    }
    const doi = vals.some((v, i) => v.trim() !== vals0[i].trim()) || bandText.trim() !== band0.trim();
    const r = criteriaPatchFrom(vals, cell, bandText);
    const sai = vals.findIndex((v) => { const s = v.trim(); return s !== '' && s !== '-' && kiemTieuChi(Number(s)) !== null; });
    return { doi, patch: r.patch as SavePatch | null, loi: r.loi, o: r.patch ? null : sai >= 0 ? sai : 4, preview: r.preview };
  })();
  /* Ô vắng: xoá trắng ô "Em có làm bài?" không phải lệnh gì — Bỏ vắng là nút riêng; gõ "-" ở đó báo ngay (không nuốt, không đóng hộp). */
  const doiDiem = diem.doi && !(vang && diem.patch && 'noShow' in diem.patch);
  /* BAND-THANG: gõ cả tiêu chí lẫn Band → đỏ cả năm ô + chữ nhỏ ngay khi gõ; không lưu, chữ giữ; xoá một phía là hết đỏ. */
  const haiKieu = !motO && caHaiKieu(vals, bandText);
  const dauLai = vang && diem.doi && diem.patch?.noShow === true;
  const doiNx = nx.trim() !== (cell.nhanXet ?? '').trim();
  const doiGv = laS && !cungGvCham(gv, gv0, session?.user?.id);
  /* OV-12b: trạng thái SAU khi lưu (điểm đang gõ hoặc điểm cũ) — một luật với máy chủ (`thieuNhanXetMt`). */
  const kv = theoBand ? null : ctx.kyVong ?? cell.kyVong ?? null;
  const bandSau = doiDiem ? (diem.patch && !('noShow' in diem.patch) ? diem.preview : null) : cell.band;
  const coDiemSau = doiDiem ? bandSau !== null : coDiemChinhThuc(cell);
  const nenCo = !!cell.nenCoNhanXet && !theoBand;
  const canNhom = !!cell.coNhom && !theoBand && coDiemSau && canNhomNguyenNhan(bandSau, kv);   // SV-NX-CASE: chip ở mọi MT, nhắc chỉ MT mới nhất
  const doiNhom = canNhom && nhom.join() !== nhom0.join();
  const thieu = nhapDuoc ? thieuNhanXetMt({ nenCo, coDiem: coDiemSau, band: bandSau, kyVong: kv, nhanXet: nx, nhom }) : null;
  const anh = JSON.stringify([tho, vals, bandText, nx, nhom, gv, lyDo]);
  const daLuu = luuAnh === anh;
  const daGo = !daLuu && !ketThuc && (doiDiem || doiNx || doiGv || doiNhom || lyDo.trim() !== '');
  const hoiLyDo = !daLuu && coDiemChinhThuc(cell) && doiDiem && !!diem.patch && !('noShow' in diem.patch);
  const nhanVang = nhapDuoc && !vang && !chanDau(cell) && !doiDiem;   // NHAP-DIEM-b: ô đã có điểm vẫn ghi vắng — máy chủ cất điểm (không hỏi), toast Hoàn tác = Khôi phục
  /* KIEM-TAY-1011 (3): ô "Không dự thi" (MT0 / MT cũ) — "Bỏ vắng" ở chân hộp như ô vắng đã chốt (cùng lệnh gỡ "-" của máy chủ). */
  const boKhongDuThi = nhapDuoc && !vang && cell.noShow?.state === 'khong-du-thi' && !doiDiem;
  /* Hộp có chữ đã gõ chưa gửi = một ô chưa lưu (bảng điểm theo lượt chặn đổi lượt — như hộp lý do cũ). */
  useBaoHopLyDoMo(busy, daGo);
  /* Luật 2: lỗi → focus ô sai (lỗi máy chủ không chỉ ô: ô điểm đầu). */
  useEffect(() => {
    if (loi?.o === O_NGUOI_CHAM) { oNguoiChamRef.current?.querySelector<HTMLElement>('input, button')?.focus(); return; }
    if (loi) loiRef.current?.closest('[role="dialog"]')?.querySelector<HTMLElement>('[aria-invalid="true"], input:not([disabled]), textarea:not([disabled])')?.focus();
  }, [loi]);
  /* AUDIT-1611 B3-08: QL / Admin nhập hộ S chấm chéo, chưa có GV chấm → mở hộp là con trỏ ở ô Người chấm (luật 2.4 giữ nguyên, chỉ chỉ đường sớm). */
  const canChonGv = laS && !ctx.khongCheo && !session?.gvS && (!gv || gv.kieu === 'toi');
  useEffect(() => {
    if (!canChonGv || !nhapDuoc) return undefined;
    const id = requestAnimationFrame(() => oNguoiChamRef.current?.querySelector<HTMLElement>('input, button')?.focus());
    return () => cancelAnimationFrame(id);
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  /* Vừa lưu / hết: nút chính nhận focus — Enter đi tiếp (nút cũ vừa biến mất, focus không rơi ra ngoài hộp). */
  useEffect(() => { if (ketThuc || daLuu) nutHetRef.current?.focus(); }, [!!ketThuc, daLuu]);   // eslint-disable-line react-hooks/exhaustive-deps

  const gui = async (lenh: SavePatch[], sau: () => void, nut: 'luu' | 'tiep' | 'khac') => {
    if (dangGui.current) return;
    dangGui.current = true;
    setDangLuu(nut); setLoi(null);
    try {
      for (const l of lenh) {
        const r = await onSave(l, { nem: true });
        /* Lệnh cùng ô đang chạy (Lưu lại ở ô + Enter): không phải lỗi — nói rõ, chữ giữ, bấm lại sau. */
        if (r === 'trung') { setLoi({ cau: t('Ô này đang lưu — chờ một chút rồi bấm lại.'), o: null }); return; }
        if (!r) throw new Error(t('Không lưu được — thử lại.'));
      }
    } catch (e: any) {
      setLoi({ cau: e?.message ?? t('Không lưu được — thử lại.'), o: null });
      return;
    } finally {
      dangGui.current = false;
      setDangLuu(null);
    }
    setLuuAnh(anh);
    sau();
  };

  /** `dong`: "Lưu · đóng" của ⋯ (GD-3) — lưu xong đóng hộp. */
  const luu = (tiep: boolean, dong = false) => {
    if (haiKieu) { luoiRef.current?.querySelector<HTMLElement>('input')?.focus(); return; }
    if (dauLai) { setLoi({ cau: t('Đã ghi vắng — muốn gỡ thì bấm Bỏ vắng.'), o: 0 }); return; }
    if (doiDiem && !diem.patch) { setLoi({ cau: diem.loi ?? LOI_SO_CAU, o: diem.o }); return; }
    /* N35: nhận xét MT ≤ 500 khi đã sửa (thành mô tả Case) — báo tại hộp, không gửi, chữ giữ. */
    if (doiNx && nx.trim().length > TRAN_CHU.nhanXetMt) { setLoi({ cau: `${t('Nhận xét')}: ${t('Tối đa {toiDa} ký tự (đang có {n})', { toiDa: TRAN_CHU.nhanXetMt, n: nx.trim().length })}`, o: 0 }); return; }
    const them: SavePatch = {};
    if (doiNx) them.nhanXet = nx.trim() || null;
    if (doiNhom) them.nhomNguyenNhan = nhom;
    const coDiemMoi = doiDiem && !!diem.patch && ('criteria' in diem.patch || 'band' in diem.patch || 'rawScore' in diem.patch);
    /* 2.4: S chấm chéo có điểm mới mà chưa có GV chấm hợp lệ — người không phải GV Speaking phải chọn (máy chủ cũng chặn); chữ giữ. */
    if (coDiemMoi && canChonGv) {
      setLoi({ cau: t('Chọn "GV chấm" trước khi lưu — bạn không phải GV Speaking nên không ghi bạn là người chấm.'), o: O_NGUOI_CHAM }); return;
    }
    if (laS && (doiGv || (coDiemMoi && !cungGvCham(gv, gvCu, session?.user?.id)))) them.gvCham = gvChamPayload(gv);
    const lenh: SavePatch[] = [];
    if (doiDiem && diem.patch) {
      const p: SavePatch = { ...diem.patch, ...(hoiLyDo && lyDo.trim() ? { lyDo: lyDo.trim() } : {}) };
      /* "-" là lệnh, không mang nhận xét (máy chủ bỏ qua ở nhánh đó) → nhận xét / người chấm gửi lệnh sau. */
      if ('noShow' in p) { lenh.push(p); if (Object.keys(them).length) lenh.push(them); } else lenh.push({ ...p, ...them });
    } else if (Object.keys(them).length) lenh.push(them);
    if (!lenh.length) {
      /* Luật 3 — không đổi gì: ô còn trống → ở lại, nhắc; bài đã xong → "Lưu · bài tiếp" sang ngay (không gọi máy chủ), "Lưu" ở lại. */
      if (vang) onDong();
      else if (!coDiemChinhThuc(cell) && !cell.noShow) setLoi({ cau: t('Ô còn trống — nhập điểm hoặc Vắng'), o: 0 });
      else if (tiep && onTiep) onTiep(false);
      else if (dong) onDong();
      else setLuuAnh(anh);
      return;
    }
    /* Ô vắng ("Lưu điểm · đóng" — tên nói đúng hành vi, V12): đóng sau lưu như cũ. V12: "Lưu" ở lại; "Lưu · bài tiếp ›" chỉ chuyển khi máy chủ đã nhận. */
    if (vang) void gui(lenh, onDong, 'luu');
    else void gui(lenh, tiep && onTiep ? () => onTiep(true) : dong ? onDong : () => undefined, tiep ? 'tiep' : 'luu');
  };

  /* CA3-8: đã gõ thì `KhungHop` hỏi ngay chân hộp ("Bỏ điểm Listening · {em}?" · Bỏ · Gõ tiếp) — không hộp trình duyệt. */
  const dong = () => { if (!busy) onDong(); };

  /* Nút chính (Enter): hết → nút của nơi gọi; vừa lưu → "Bài tiếp ›"; còn lại "Lưu · bài tiếp ›" (không có bài kế / ô vắng: Lưu). */
  const chinh = () => {
    if (ketThuc) (ketThuc.nut?.onClick ?? onDong)();
    else if (daLuu) (onTiep ? onTiep(true) : onDong());
    else luu(!vang && !!onTiep);
  };
  const phim = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.keyCode === 229) return;   // đang gõ chữ Việt (IME)
    const el = e.target as HTMLElement;
    if (el.tagName === 'BUTTON') return;                      // Enter trên nút = chính nút đó
    if (el.tagName === 'TEXTAREA' && !(e.ctrlKey || e.metaKey)) return;   // ô nhận xét: Enter xuống dòng, Ctrl / Cmd + Enter = nút chính
    if (el.closest('[data-chon-nguoi]')) return;
    if (el.closest('[data-chip-nhom]')) return;   // chip nhóm: Enter bấm chính chip
    e.preventDefault();
    chinh();
  };

  const oSo = (extra: string) => `field text-center tabular-nums ${extra}`;
  /* Ô sai: viền + vòng đỏ, kể cả khi đang focus (vòng focus nhấn của `.field` không che màu lỗi). */
  const stSai = (sai: boolean) => (sai ? { borderColor: 'rgb(var(--bad-rgb))', boxShadow: '0 0 0 3px rgb(var(--bad-rgb) / 0.25)' } : undefined);
  const tuan = cell.weekStart ? tuanLich(cell.weekStart, homNay) : null;
  const kvHien = !vang ? kv : null;   // OV-12b: "Kỳ vọng MT{n}" ở cả W1 / W2 / S
  const nTask = cell.skill === 'writing1' ? 1 : 2;
  /* Cùng công thức `writingBand` máy chủ (W1 + W2 × 2) / 3, làm tròn 0.5 — chỉ để xem trước trong hộp. */
  const wSau = laW && bandSau !== null && ctx.bandTaskKia != null
    ? roundToHalf(nTask === 1 ? (bandSau + ctx.bandTaskKia * 2) / 3 : (ctx.bandTaskKia + bandSau * 2) / 3) : null;

  /* OV-14c: S đã có điểm của NGƯỜI KHÁC — nói ai / lúc nào trước khi ghi đè (hai GV cùng chấm chéo một em). */
  const nguoiKhac = laS && coDiemChinhThuc(cell) && !!cell.enteredByName && cell.enteredById != null && cell.enteredById !== session?.user?.id;
  const than = (
    <>
      {ctx.attemptId && coDiemChinhThuc(cell) && <LichSuO attemptId={ctx.attemptId} skill={cell.skill} />}
      {nguoiKhac && (
        <div role="note" className="rounded-lg border border-muted-line bg-muted-bg px-3 py-2 text-[13px] text-slate-200">
          {t('Đã chấm bởi {ten} lúc {luc}', { ten: cell.enteredByName!, luc: cell.enteredAt ? lucNgan(cell.enteredAt, homNay) : '—' })}
        </div>
      )}
      {vang && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-muted-line bg-muted-bg px-3 py-2.5 text-[13px] text-slate-200">
          {/* CA3-3: ô huỷ một trạng thái — "Đã huỷ phần thi · vắng 2 lần", không "Vắng lần 1". */}
          {cell.progress === 'cancelled'
            ? <span><b className="text-muted">{t('Đã huỷ')}</b>{lyDoHuyO(cell) && <> · {lyDoHuyO(cell)}</>}</span>
            : <span><b className="text-muted">{t('Vắng lần')}{' '}{Math.max(1, cell.daChot!.lan)}</b>
              {cell.daChot!.doiSang && <>{' '}{t('· đã dời sang')}{' '}<span className="tabular-nums">{cell.daChot!.doiSang}</span></>}</span>}
          {cell.daChot!.ghiLuc && <span className="text-slate-400">Ghi {ngay(cell.daChot!.ghiLuc, homNay)}{cell.daChot!.ghiBoi ? t(' bởi {ghiBoi}', { ghiBoi: cell.daChot!.ghiBoi }) : ''}</span>}
        </div>
      )}
      {thiBu && (
        <div className="flex min-h-[28px] items-center gap-2 text-xs text-slate-400">
          <span>{t('vắng lần')}{' '}{Math.max(1, cell.daChot!.lan)}{' '}{t('· dời từ')}{' '}<span className="tabular-nums">{cell.daChot!.tuTuan}</span></span>
          {cell.daChot!.goDuoc && (
            <button type="button" className="btn btn-sm btn-ghost ml-auto max-sm:min-h-[44px]" disabled={busy}
              onClick={() => void gui([{ noShow: false }], onDong, 'khac')}>{t('Bỏ vắng')}</button>
          )}
        </div>
      )}
      {(!vang || nhapDuoc) && (motO ? (
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="text-xs font-medium text-slate-300" htmlFor="hop-diem-o">
              {vang ? t('Em có làm bài? Số câu đúng') : theoBand ? 'Band' : t('Số câu đúng')}
            </label>
            <input id="hop-diem-o" className={oSo('w-16 max-sm:h-11 max-sm:text-base')} style={stSai(loi?.o === 0)} inputMode="decimal" value={tho}
              aria-invalid={loi?.o === 0 || undefined} disabled={busy}
              onChange={(e) => { setT(e.target.value); setLoi(null); }} />
            {!theoBand && <span className="text-xs tabular-nums text-slate-500">/ 40</span>}
            {!theoBand && !vang && (
              <span className="ml-auto inline-flex items-center gap-1 text-sm text-slate-400">Band <b className="tabular-nums text-slate-100">{diem.patch && 'noShow' in diem.patch ? '-' : fmtBand(diem.preview)}</b>
                <MuiTenKyVong kq={soKyVong(bandSau, kvHien)} /></span>
            )}
          </div>
          <DongKyVong luot={ctx.luot} kv={kvHien} />
        </div>
      ) : (
        <div>
          {vang && <div className="mb-1.5 text-xs font-medium text-slate-300">{t('Em có làm bài?')}</div>}
          <div ref={luoiRef} className="grid grid-cols-[repeat(4,minmax(0,1fr))_4rem] items-end gap-1.5">
            {tc.map((n) => <span key={n} className="text-center text-xs font-medium text-slate-400">{n}</span>)}
            <span className="text-center text-xs font-medium text-slate-400">Band</span>
            {tc.map((n, i) => (
              <input key={n} className={oSo('w-full px-1 max-sm:h-11 max-sm:text-base')} style={stSai(loi?.o === i || haiKieu)} inputMode="numeric"
                value={vals[i] ?? ''} aria-label={`${skillLabel(cell.skill)} — ${n}`} aria-invalid={loi?.o === i || haiKieu || undefined} aria-describedby={haiKieu ? 'hop-diem-hai-kieu' : undefined} disabled={busy}
                onChange={(e) => { setVals((v) => v.map((x, j) => (j === i ? e.target.value : x))); setLoi(null); }} />
            ))}
            {/* Ô Band luôn gõ được; gõ 4 tiêu chí thì Band tự tính hiện MỜ trong ô (placeholder), gõ Band thì tiêu chí để trống. */}
            <span className="relative">
              <input className={oSo('w-full px-1 font-bold max-sm:h-11 max-sm:text-base placeholder:text-slate-300')} style={stSai(loi?.o === 4 || haiKieu)} inputMode="decimal" value={bandText}
                placeholder={diem.patch && 'noShow' in diem.patch ? '-' : diem.preview === null ? '' : fmtBand(diem.preview)}
                aria-label={`${skillLabel(cell.skill)} — band`} aria-invalid={loi?.o === 4 || haiKieu || undefined} aria-describedby={haiKieu ? 'hop-diem-hai-kieu' : undefined} disabled={busy}
                onChange={(e) => { setBandText(e.target.value); setLoi(null); }} />
              {/* Mũi tên kỳ vọng nằm TRONG ô (không đẩy ô Band lệch hàng với 4 tiêu chí). */}
              <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2"><MuiTenKyVong kq={soKyVong(bandSau, kvHien)} /></span>
            </span>
          </div>
          {haiKieu && <p id="hop-diem-hai-kieu" role="alert" className="mt-1 text-xs text-bad">{LOI_MOT_KIEU}</p>}
          {!vang && !laW && <DongKyVong luot={ctx.luot} kv={kvHien} />}
          {/* GD-4d (dòng 40b, ⑤ E2): W chỉ một dòng xem trước "Task 1 6.0 → Writing 6.0 · kỳ vọng 5.5" — công thức vào ⓘ (bỏ chú thích tĩnh). */}
          {laW && !vang && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs tabular-nums text-slate-500">
              <span className="inline-flex items-center gap-1">
                {ctx.bandTaskKia == null ? t('Task {x} chưa có', { x: 3 - nTask })
                  : `Task ${3 - nTask} ${fmtBand(ctx.bandTaskKia)} → Writing ${wSau === null ? '—' : fmtBand(wSau)}`}
                {kvHien !== null && <>{' · '}{t('kỳ vọng {kv}', { kv: fmtBand(kvHien) })}{ctx.bandTaskKia != null && <MuiTenKyVong kq={soKyVong(wSau, kvHien)} />}</>}
              </span>
              <NutLuat label={t('Cách tính Writing')}>{t('Band Writing = (Task 1 + Task 2 × 2) / 3, khi đủ hai task.')}</NutLuat>
            </div>
          )}
        </div>
      ))}
      {laS && !vang && nhapDuoc && (
        <div className="flex items-center gap-2" data-chon-nguoi ref={oNguoiChamRef}>
          <span className="shrink-0 text-xs font-medium text-slate-300">{t('Người chấm')}{canChonGv && <span aria-hidden className="text-bad"> *</span>}</span>
          <div className="min-w-0 flex-1 rounded-md" style={stSai(loi?.o === O_NGUOI_CHAM)}>
            <ChonNguoi value={gv} onChange={setGv} nhom={ctx.khongCheo ? 'nhan_vien' : 'gv_speaking'} choNgoai macDinhTrong={t('Chưa chọn')} ariaLabel={t('Người chấm Speaking')} disabled={busy} />
          </div>
        </div>
      )}
      {(!vang || (nenCo && coDiemSau)) && nhapDuoc && (
        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-slate-300">
            <span>{laW ? t('Nhận xét Task {nTask}', { nTask }) : t('Nhận xét')}</span>
            <DemChu n={nx.trim().length} toiDa={TRAN_CHU.nhanXetMt} />
          </span>
          <textarea className="field w-full text-sm" rows={2} value={nx} disabled={busy}
            placeholder={viDuNhanXet(cell.skill)} onChange={(e) => setNx(e.target.value)} />
        </label>
      )}
      {/* OV-13k: nhận xét riêng của GV phụ trách Speaking lớp — chỉ đọc ở hộp chấm (GV phụ trách ghi ở hồ sơ MT). */}
      {laS && cell.nhanXetPhuTrach && (
        <div className="text-[13px]">
          <span className="block text-xs font-medium text-slate-300">{t('Nhận xét GV phụ trách')}{cell.nhanXetPhuTrach.ten ? ` · ${cell.nhanXetPhuTrach.ten}` : ''}</span>
          <p className="m-0 mt-1 whitespace-pre-wrap break-words text-slate-200"><ChuDich chu={cell.nhanXetPhuTrach.chu} nguon={ctx.attemptId ? { bang: 'assessment_scores', id: ctx.attemptId, cot: 'nhan_xet_phu_trach', kyNang: 'speaking' } : null} /></p>
        </div>
      )}
      {canNhom && nhapDuoc && (
        <div>
          <span id="hop-nhom-nn" className="mb-1.5 block text-xs font-medium text-slate-300">{t('Nhóm nguyên nhân')}</span>
          <ChonNhom skill={cell.skill} value={nhom} onChange={setNhom} disabled={busy} nhanId="hop-nhom-nn" />
        </div>
      )}
      {hoiLyDo && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-300">{t('Lý do sửa (tuỳ chọn)')}</span>
          <input className="field w-full text-sm" value={lyDo} placeholder={t('Ví dụ: chấm lại bài, nhập nhầm cột')} disabled={busy}
            onChange={(e) => setLyDo(e.target.value)} />
        </label>
      )}
      {loi && (
        <div ref={loiRef} role="alert" className="rounded-lg border border-bad-line bg-bad-bg px-3 py-2.5 text-[13px] text-slate-200">
          <b className="text-bad">{t('Chưa lưu:')}</b> {loi.cau}
        </div>
      )}
    </>
  );

  const nut = 'btn btn-sm max-sm:min-h-[44px]';
  const dangLuuChu = t('Đang lưu…');
  const chan = ketThuc ? (
    <>
      <span className="flex-1" />
      <button ref={nutHetRef} type="button" className={`${nut} btn-primary`} onClick={ketThuc.nut?.onClick ?? onDong}>{ketThuc.nut?.nhan ?? t('Đóng')}</button>
    </>
  ) : vang ? (
    <>
      {/* Chủ SP 14/11 (rà #1563): ô đang Vắng — cùng dáng chân: ⋯ (Bỏ vắng khi gỡ được) · nút chính "Lưu điểm · đóng". */}
      {cell.daChot!.goDuoc && (
        <MenuDong canhTrai lopNut={`${nut} w-9 justify-center px-0`}
          muc={[{ key: 'bo-vang', nhan: t('Bỏ vắng'), tat: busy, title: busy ? dangLuuChu : undefined, onChon: () => void gui([{ noShow: false }], onDong, 'khac') }]} />
      )}
      <span className="flex-1" />
      <LyDoThieu thieu={thieu} />
      {nhapDuoc && <button type="button" className={`${nut} btn-primary`} disabled={busy} onClick={() => luu(false)}>{busy ? dangLuuChu : t('Lưu điểm · đóng')}</button>}
    </>
  ) : (
    <>
      {onTiep && nhanTiep && <span className="ten-hv basis-full text-xs text-slate-400">{t('Tiếp: {x}', { x: nhanTiep })}</span>}
      {/* GD-3 HOP-NHAP-GON (mockup v21 K2b): ngoài chỉ ⋯ · Vắng · nút chính; ⋯ = Lưu · đóng (thay "Lưu" ở lại khi có bài kế) · Khôi phục điểm · Bỏ vắng
          (hai mục sau chỉ khi ô ở trạng thái đó). Không có bài kế: "Lưu" vẫn là nút chính như cũ. */}
      {!daLuu && (
        <MenuDong canhTrai lopNut={`${nut} w-9 justify-center px-0`} muc={[
          ...(onTiep ? [{ key: 'luu-dong', nhan: t('Lưu · đóng'), tat: busy, title: busy ? dangLuuChu : undefined, onChon: () => luu(false, true) }] : []),
          ...(cell.diemHuy ? [{ key: 'khoi-phuc', nhan: CHU_THAO_TAC['khoi-phuc-diem'], tat: busy, title: busy ? dangLuuChu : undefined, onChon: () => void gui([{ khoiPhuc: true }], onDong, 'khac') }] : []),
          ...(boKhongDuThi ? [{ key: 'bo-vang', nhan: t('Bỏ vắng'), tat: busy, title: busy ? dangLuuChu : undefined, onChon: () => void gui([{ noShow: false }], onDong, 'khac') }] : []),
        ]} />
      )}
      {nhanVang && !daLuu && (
        /* LUAT-34: một chữ "Vắng" — hậu quả (dời / thẻ QL / huỷ) nói ở thông báo sau khi ghi, kèm Hoàn tác 10 giây. Vắng kết thúc ô → sang bài tiếp. */
        <button type="button" className={nut} disabled={busy} onClick={() => void gui([{ noShow: true }], onTiep ? () => onTiep(true, true) : onDong, 'khac')}>
          {dangLuu === 'khac' ? dangLuuChu : t('Vắng')}
        </button>
      )}
      <span className="flex-1" />
      <LyDoThieu thieu={thieu} />
      {daLuu ? (
        <>
          <span role="status" className={`text-[13px] font-semibold ${LOP_DA_LUU}`}>{t('✓ Đã lưu')}</span>
          {onTiep
            ? <button ref={nutHetRef} type="button" className={`${nut} btn-primary`} onClick={() => onTiep(true)}>{tiepEm ? t('Em tiếp ›') : t('Bài tiếp ›')}</button>
            : <button ref={nutHetRef} type="button" className={nut} onClick={onDong}>{t('Đóng')}</button>}
        </>
      ) : (
        <>
          {!onTiep && <button type="button" className={`${nut} btn-primary`} disabled={busy} onClick={() => luu(false)}>{dangLuu === 'luu' ? dangLuuChu : t('Lưu')}</button>}
          {onTiep && <button type="button" className={`${nut} btn-primary`} disabled={busy} onClick={() => luu(true)}>{dangLuu === 'tiep' ? dangLuuChu : tiepEm ? t('Lưu · em tiếp ›') : t('Lưu · bài tiếp ›')}</button>}
        </>
      )}
    </>
  );

  const ten = `${skillLabel(cell.skill)} · ${ctx.luot}`;
  /* QC-Q82 ở MT cũ: phân công đã có trong phiên (0 request); tên GV phụ trách ô không có ở lưới → chỉ nói "Bạn nhập hộ". */
  const nhapHo = !!ctx.mtCu && !session?.assignments?.some((a) => a.classCode === ctx.lop && (a.skill === cell.skill || a.skill === cell.assessedSkill));
  return (
    <KhungHop anchor={anchor} ten={ten} phu={<>{[ctx.tenHv, ctx.lop].filter(Boolean).join(' · ')}{tuan && <> · <span className="tabular-nums">{tuan}</span></>}{nhapHo && <> · <b className="font-semibold text-soon">{t('Bạn nhập hộ')}</b></>}</>}
      nhanHop={`${ten} · ${ctx.tenHv}`} daGo={daGo} cauBo={t('Bỏ điểm {skillLabel} · {tenHv}?', { skillLabel: skillLabel(cell.skill), tenHv: ctx.tenHv })} onDong={dong} onKeyDown={phim} chan={chan}>
      {ketThuc
        ? <p role="status" className="m-0 text-sm text-slate-200">{t('Đã xong phần của bạn · {phamVi}: đã lưu {n} bài', { phamVi: ketThuc.phamVi, n: ketThuc.daLuu })}</p>
        : than}
    </KhungHop>
  );
}

/** OV-12b · OV-15a: "Kỳ vọng MT2 5.5" một lần — mọi kỹ năng (MT0 không kỳ vọng); trên / dưới là mũi tên cạnh band, không chữ "dưới 1.0". */
function DongKyVong({ luot, kv }: { luot: string; kv: number | null }) {
  if (kv === null) return null;
  return <div className="mt-1.5 text-xs tabular-nums text-slate-500">{t('Kỳ vọng {dot}', { dot: luot })}{' '}{fmtBand(kv)}</div>;
}

/** LUAT-NX-MT: dòng NHẮC (vàng) — nút vẫn bấm được. Chủ SP 25/11 (chữ bị bóp thành cột hẹp giữa các nút): có nhắc thì MỘT dòng riêng phía trên
 *  hàng nút ở mọi cỡ (`order-first`); chỗ trống `flex-1` của nơi gọi vẫn đẩy nút chính sang phải. */
function LyDoThieu({ thieu }: { thieu: ReturnType<typeof thieuNhanXetMt> }) {
  return (
    <span role="status" className={`min-w-0 text-right text-xs text-soon ${thieu ? 'order-first basis-full' : 'flex-1'}`}>
      {thieu ? CAU_THIEU_NHAN_XET[thieu] : ''}
    </span>
  );
}

/**
 * Khung cuộn gần nhất mà cuộn nó THẬT làm ô `o` di chuyển. Dừng ở phần tử `position: fixed` (panel việc): khung cuộn phía trên nó
 * (vd `<main>` của danh sách Công việc) không dời ô — cuộn nó thì `dat()` không bao giờ đủ chỗ, sự kiện cuộn gọi lại `dat()` →
 * danh sách bên trái cuộn qua lại không ngừng (chủ SP 25/11).
 */
export function khungCuonCuaO(o: HTMLElement): HTMLElement | null {
  for (let m = o.parentElement; m; m = m.parentElement) {
    const s = getComputedStyle(m);
    if (m.scrollHeight > m.clientHeight && /auto|scroll/.test(s.overflowY)) return m;
    if (s.position === 'fixed') return null;
  }
  return null;
}

/**
 * KHUNG HỘP NHỎ NEO Ô (đầu · thân · chân) — dùng chung cho hộp nhập điểm MT và hộp nhận xét lớp thường. Neo dưới ô, kẹp trong màn,
 * hết chỗ thì lật lên (như `HopKyNang`); < 640 px → tấm trượt từ dưới. Mở: con trỏ vào ô nhập đầu; Tab vòng trong hộp; đóng trả focus
 * về ô. Esc / bấm ra ngoài → `onDong` (bấm ra ngoài khi đã gõ thì giữ hộp, chặn cú bấm đó, hỏi Bỏ · Gõ tiếp — không mất chữ). Esc khi đã gõ (CA3-8): chân hộp thành câu
 * `cauBo` + Bỏ · Gõ tiếp (không hộp thứ hai); Esc lần nữa = Gõ tiếp.
 */
function KhungHop({ anchor, ten, phu, nhanHop, daGo, cauBo, onDong, onKeyDown, chan, children }: {
  anchor: HTMLElement; ten: string; phu: ReactNode; nhanHop: string; daGo: boolean; cauBo: string; onDong: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void; chan: ReactNode; children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const goTiepRef = useRef<HTMLButtonElement>(null);
  const [hoi, setHoi] = useState(false);
  useEffect(() => { if (hoi) goTiepRef.current?.focus(); }, [hoi]);
  /* CHAN-ROI-NHAP-2: đã gõ mà Back / tiến của trình duyệt hay đổi tài khoản → bộ chặn gốc hỏi bằng CHÍNH chân hộp này (Bỏ · Gõ tiếp).
     Bấm link / nút ngoài hộp thì `useBamNgoai` dưới đã chặn cú bấm và hỏi như cũ. */
  const roi = useRef<{ di: () => void; o: () => void } | null>(null);
  const daBo = useRef(false);
  const idRoi = useId();
  useEffect(() => {
    if (!daGo) return undefined;
    khoRoiNhap.dat(idRoi, { moTa: cauBo, conTrong: (a, b, kieu) => daBo.current || (kieu !== 'POP' && a.pathname === b.pathname),
      hoi: (di, o) => { roi.current = { di, o }; setHoi(true); } });
    return () => khoRoiNhap.dat(idRoi, null);
  }, [idRoi, daGo, cauBo]);
  const bo = () => { const r = roi.current; roi.current = null; daBo.current = true; onDong(); r?.di(); };
  const goTiep = () => {
    roi.current?.o(); roi.current = null;
    setHoi(false);
    box.current?.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled])')?.focus();
  };
  useGiuFocus(box);
  const dienThoai = typeof window !== 'undefined' && window.innerWidth < 640;
  /* Hotfix 19/10: vị trí ghi thẳng vào style, KHÔNG qua state — setState trong layout effect chạy mỗi lần vẽ, gặp setPos của sự kiện cuộn
     đang chờ (ưu tiên thấp hơn) thì React tính lại từ state gốc mãi → "Maximum update depth" → trang lỗi khi gõ ô L/R. */
  const dat = () => {
    if (dienThoai || !box.current) return;
    const b = box.current;
    /* RA-GD-0711c: hộp nằm TRONG vùng nội dung — mép trên = mép trên <main> (dưới thanh trên), không đè ô tìm / tài khoản.
       Dưới đủ chỗ → dưới; trên đủ → trên; không bên nào đủ (ô ở giữa màn thấp) → cuộn khung chứa ô vừa đủ để hộp nằm dưới (hoặc trên);
       không cuộn được nữa mới thu hộp vừa chỗ + tự cuộn. */
    const cuon = b.scrollTop;   // đo lại mỗi lần vẽ (gõ phím) — giữ chỗ cuộn trong hộp
    b.style.maxHeight = '';
    b.style.overflowY = '';
    const rong = b.offsetWidth, cao = b.offsetHeight;
    const tren = Math.max(8, (document.getElementById('noi-dung')?.getBoundingClientRect().top ?? 0) + 4), day = window.innerHeight - 8;
    let r = anchor.getBoundingClientRect();
    if (cao > day - (r.bottom + 4) && cao > r.top - 4 - tren) {
      const m = khungCuonCuaO(anchor);
      const xuong = r.bottom + 4 + cao - day, len = tren - (r.top - 4 - cao);
      if (m && xuong <= m.scrollHeight - m.clientHeight - m.scrollTop) m.scrollTop += xuong;
      else if (m && len <= m.scrollTop) m.scrollTop -= len;
      r = anchor.getBoundingClientRect();
    }
    const choDuoi = day - (r.bottom + 4), choTren = r.top - 4 - tren;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - rong - 8);
    let top: number;
    if (cao <= choDuoi) top = r.bottom + 4;
    else if (cao <= choTren) top = r.top - 4 - cao;
    else {
      const duoi = choDuoi >= choTren;
      b.style.maxHeight = `${Math.max(160, duoi ? choDuoi : choTren)}px`;
      b.style.overflowY = 'auto';
      top = duoi ? r.bottom + 4 : tren;
      b.scrollTop = cuon;
    }
    b.style.top = `${top}px`;
    b.style.left = `${left}px`;
  };
  /* CA3-7: ô lên giữa vùng cuộn — hộp em kế neo dưới, ô vừa lưu phía trên vẫn thấy. */
  useLayoutEffect(() => { if (!dienThoai) anchor.scrollIntoView({ block: 'center', inline: 'nearest' }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { dat(); });   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const o = box.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([disabled]), textarea:not([disabled])');
    o?.focus({ preventScroll: true });
    o?.select();
  }, []);
  const moi = useRef({ daGo, onDong, hoi });
  moi.current = { daGo, onDong, hoi };
  const neo = useRef<Element>(anchor);
  neo.current = anchor;
  /* Hộp / menu / danh sách nổi khác (kể cả không phải con React của hộp) vẫn không tính là ngoài — giữ luật cũ. */
  useBamNgoai(true, (e) => {
    if ((e.target as HTMLElement).closest('[role="dialog"], [role="menu"], [role="listbox"]')) return;
    if (!moi.current.daGo) moi.current.onDong();
    else {
      /* R1-PHAN-CAP-TEST: đã gõ → cú bấm ra ngoài không làm gì (vd thu lớp chứa ô — mất chữ; focus không sang nút đó, <select> không mở);
         hỏi Bỏ · Gõ tiếp như Esc. */
      e.preventDefault();
      const chan = (ev: Event) => { if (!box.current?.contains(ev.target as Node)) { ev.stopPropagation(); ev.preventDefault(); } };
      document.addEventListener('click', chan, { capture: true, once: true });
      setTimeout(() => document.removeEventListener('click', chan, true), 1000);   // kéo chuột ra ngoài không thành click → gỡ chặn
      setHoi(true);
    }
  }, box, neo);
  useEffect(() => {
    /* Esc chỉ đóng lớp trên cùng: hộp chọn người mở trong hộp tự đóng trước (`defaultPrevented`). Đã gõ → hỏi ở chân hộp. */
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      if (moi.current.hoi) goTiep();
      else if (moi.current.daGo) setHoi(true);
      else moi.current.onDong();
    };
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', dat);
    window.addEventListener('scroll', dat, true);
    return () => {
      document.removeEventListener('keydown', esc);
      window.removeEventListener('resize', dat); window.removeEventListener('scroll', dat, true);
    };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <>
      {dienThoai && <div className="fixed inset-0 z-[59] bg-black/60" aria-hidden onClick={() => { if (daGo) setHoi(true); else onDong(); }} />}
      <div ref={box} role="dialog" aria-label={nhanHop} tabIndex={-1} onKeyDown={(e) => { if (!hoi) onKeyDown(e); }}
        className={`z-[60] border outline-none ${dienThoai
          ? 'fixed inset-x-0 flex flex-col rounded-t-2xl'
          : 'fixed w-[min(440px,calc(100vw-32px))] rounded-xl shadow-2xl'   /* GD-3: = mockup v21 `.hop` 440 */}`}
        /* Rà 25/11 (việc 8, lời GV): điện thoại — tấm bám NGAY TRÊN bàn phím ảo (`--ban-phim`, `useBanPhim` ở App), cao vừa phần màn còn thấy; đầu + chân
           cố định, CHỈ thân cuộn → ô đang gõ và nút Lưu luôn thấy (trước: `bottom-0 max-h-85vh` nằm dưới bàn phím). */
        style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)',
          ...(dienThoai ? { bottom: 'var(--ban-phim, 0px)', maxHeight: 'min(85dvh, calc(100dvh - var(--ban-phim, 0px) - 8px))' } : {}) }}>
        {dienThoai && <div aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />}
        <div className="flex shrink-0 items-start gap-2 border-b pb-2.5 pl-4 pr-3 pt-3" style={{ borderColor: 'var(--line)' }}>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-slate-100">{ten}</div>
            <div className="ten-hv mt-0.5 text-[13px] text-slate-400">{phu}</div>
          </div>
          {/* GD-3 (mockup v21 K2b): ✕ ở đầu hộp — cùng đường với Esc (đã gõ thì hỏi bỏ chữ ở chân). */}
          <button type="button" aria-label={t('Đóng')} className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-md border-0 bg-transparent text-[16px] text-slate-400 hover:text-slate-100 max-sm:h-11 max-sm:w-11"
            onClick={() => { if (daGo) setHoi(true); else onDong(); }}>✕</button>
        </div>
        <div className={`flex flex-col gap-2.5 px-4 py-3 ${dienThoai ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : ''}`}>{children}</div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t px-4 pb-3 pt-2.5" style={{ borderColor: 'var(--line)' }}>
          {hoi ? (
            <>
              <span role="alert" className="min-w-0 flex-1 text-[13px] text-slate-200">{cauBo}</span>
              <button type="button" className="btn btn-sm btn-danger max-sm:min-h-[44px]" onClick={bo}>{t('Bỏ')}</button>
              <button ref={goTiepRef} type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={goTiep}>{t('Gõ tiếp')}</button>
            </>
          ) : chan}
        </div>
      </div>
    </>,
    document.body,
  );
}

export function HopNhanXetThuong({ anchor, tenMon, phu, giaTri, nguon, onLuu, onDong }: {
  anchor: HTMLElement; tenMon: string; phu: string; giaTri: string | null; nguon: NguonDich | null;
  onLuu: (v: string | null) => Promise<boolean>; onDong: () => void;
}) {
  const [nx, setNx] = useState(giaTri ?? '');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const daGo = nx.trim() !== (giaTri ?? '').trim();
  useBaoHopLyDoMo(busy, daGo);
  const luu = async () => {
    if (busy) return;
    if (!daGo) { onDong(); return; }
    setBusy(true); setLoi(null);
    try {
      if (!(await onLuu(nx.trim() || null))) throw new Error(t('Không lưu được — thử lại.'));
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được — thử lại.')); setBusy(false); return; }
    setBusy(false);
    onDong();
  };
  const dong = () => { if (!busy) onDong(); };
  return (
    <KhungHop anchor={anchor} ten={t('Nhận xét · {tenMon}', { tenMon })} phu={phu} nhanHop={t('Nhận xét · {tenMon} · {phu}', { tenMon, phu })} daGo={daGo} onDong={dong}
      /* `phu` luôn bắt đầu bằng tên em (lưới lớp thường, màn một kỹ năng). */
      cauBo={t('Bỏ nhận xét {tenMon} · {x}?', { tenMon, x: phu.split(' · ')[0] })}
      onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void luu(); } }}
      chan={<><span className="flex-1" /><button type="button" className="btn btn-sm btn-primary max-sm:min-h-[44px]" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu · đóng')}</button></>}>
      <label className="block">
        <span className="sr-only">{t('Nhận xét')}</span>
        <textarea className="field w-full text-sm" rows={3} maxLength={NHAN_XET_TOI_DA} value={nx} disabled={busy} onChange={(e) => setNx(e.target.value)} />
      </label>
      {/* P14 DICH: dịch nhận xét ĐÃ LƯU (chưa gõ đổi) — bản dịch chỉ hiện ở đây, không vào ô. */}
      {!daGo && giaTri && <p className="m-0 whitespace-pre-wrap break-words text-[13px] text-slate-300"><ChuDich chu={giaTri} nguon={nguon} anGoc /></p>}
      {nx.length > 800 && <span className={`self-end text-xs tabular-nums ${nx.length >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{nx.length}/{NHAN_XET_TOI_DA}</span>}
      {loi && (
        <div role="alert" className="rounded-lg border border-bad-line bg-bad-bg px-3 py-2.5 text-[13px] text-slate-200">
          <b className="text-bad">{t('Chưa lưu:')}</b> {loi}
        </div>
      )}
    </KhungHop>
  );
}
