/**
 * BẢNG ĐIỂM THEO LƯỢT CỦA CẢ LỚP (PR-DL, mockup `thiet-ke/mockup-diem-theo-lop-2026-10-04.html`) — dùng chung cho hồ sơ lớp
 * (khối thu gọn, `gon`) và trang Test › Điểm theo lớp. Mỗi lượt một bảng: FT `mt:N`, lớp thường `thuong:progress|final|mt0`.
 *
 * KHÔNG CÓ ĐƯỜNG GHI MỚI: bảng là `LuoiChamLop` (LuoiFT / LuoiThuong, màn hẹp MotKyNang) với dữ liệu `bangTheoLuot` — ô, bàn
 * phím, lưu từng ô, sửa ô có điểm hỏi lý do (override) y như lưới Nhập điểm. Không tự tạo lịch: em chưa có lịch lượt này là
 * hàng mờ cuối bảng, link sang panel Lộ trình của em.
 *
 * Đổi lượt khi còn ô đang lưu → hộp hỏi, đợi lưu xong mới chuyển; còn ô lưu hỏng / gõ sai → không chuyển (điểm đã gõ còn
 * nằm trong ô để "Lưu lại").
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BaoDangLuuContext } from '../../ui/SaveState.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import {
  ENTRY_SKILLS, HOI_DOI_LUOT_RONG, buocHoiDoiLuot, cauChanDoiLuot, dongPhuLuot, duongHoSoHocVien, hangThuongConTrong, oTrongLuotFt,
  yeuCauDoiLuot, type HoiDoiLuot, type TomTatLuot,
} from '@shared/domain/index.ts';
import {
  LuoiChamLop, duongDiemTheoLuot, useManHinhHep, type BangTheoLuot, type DanhSachLuot,
} from './LuoiChamLop.tsx';
import type { HangMo } from './LuoiFT.tsx';
import { DongThiContext } from './DongThi.tsx';
import { skillShort } from '../../lib/format.ts';
import { dich, t } from '@shared/i18n/index.ts';

const KHOA_CHI_O_TRONG = 'pisa.diem-theo-lop.chi-o-trong';
function docChiOTrong(): boolean {
  try { return localStorage.getItem(KHOA_CHI_O_TRONG) === '1'; } catch { return false; }
}
function ghiChiOTrong(v: boolean) {
  try { localStorage.setItem(KHOA_CHI_O_TRONG, v ? '1' : '0'); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
}

/**
 * Cổng chặn rời bảng cho nút NGOÀI bảng (Test › Điểm theo lớp: đổi lớp) — đi CÙNG đường chặn với đổi lượt: `roi(lam)` rời ô đang gõ,
 * khung sau mới xét `yeuCauDoiLuot`; còn ô đang lưu → hộp hỏi, còn ô chưa lưu → chặn. `giu` gắn vào `onMouseDown` của nút ngoài để
 * mousedown không tới `document` (hộp lý do sửa điểm đóng khi bấm ra ngoài = huỷ).
 */
export type CongRoi = { roi: (lam: () => void) => void; giu: (e: MouseEvent) => void };
/** Mã đích "ra ngoài bảng" trong luồng hỏi đổi lượt — không bao giờ trùng mã lượt (`docMaLuot`). */
const DICH_NGOAI = 'ngoai';

export function DiemTheoLop({ classId, luotBanDau, locBanDau, gon = false, congRoi, onDaLuu, onLuot, chonMon = false }: {
  classId: number; luotBanDau?: string; gon?: boolean; congRoi?: MutableRefObject<CongRoi | null>;
  /** OV-15b (mục 5, mockup 2 khung 4): panel Nhập điểm lớp — hàng chọn môn "Tất cả · L · R · W1 · W2 · S" lọc cột lưới. */
  chonMon?: boolean;
  /** OV-11e (TE-8): vào từ link (`?trong=`) — `trong` bật sẵn "Chỉ ô còn trống"; `cu` ("MT cũ chưa nhập") lọc thêm hàng MT cũ ở lượt mở đầu. */
  locBanDau?: 'trong' | 'cu';
  /** Vừa lưu một ô (Test › Điểm theo lớp: gộp tải lại số ô trống của danh sách lớp). */
  onDaLuu?: () => void;
  /** PR-OV5b: lượt đang xem đổi — Test › Điểm theo lớp ghi `?luot=` để Quay lại từ hồ sơ về đúng lượt. */
  onLuot?: (ma: string, nhan: string) => void;
}) {
  const ds = useApi<DanhSachLuot>(duongDiemTheoLuot(classId), [classId]);
  const [chon, setChon] = useState<string | null>(luotBanDau ?? null);
  const dsLuot = ds.data?.luot ?? [];
  const luot = chon && dsLuot.some((l) => l.ma === chon) ? chon : ds.data?.macDinh ?? null;
  /* Chốt lượt mở ban đầu MỘT lần, theo bản tải mới (không theo bản vừa xem): lưu ô cuối của lượt mặc định làm `macDinh` đổi —
     bảng không được tự nhảy (bỏ qua đường chặn → mất điểm đang gõ, hộp lý do). Sau đó chỉ người dùng đổi lượt, qua `sang`. */
  useEffect(() => { if (luot && luot !== chon && !ds.refreshing) setChon(luot); }, [luot, chon, ds.refreshing]);
  const bang = useApi<BangTheoLuot>(luot ? duongDiemTheoLuot(classId, luot) : null, [classId, luot]);
  const nhanLuot = dsLuot.find((l) => l.ma === luot)?.nhan;
  useEffect(() => { if (luot && nhanLuot) onLuot?.(luot, nhanLuot); }, [luot, nhanLuot]); // eslint-disable-line react-hooks/exhaustive-deps

  const [chiOTrong, setChiOTrong] = useState(() => !!locBanDau || docChiOTrong());
  const [mon, setMon] = useState<string | null>(null);
  const [chiCu, setChiCu] = useState(locBanDau === 'cu');
  /* "MT cũ" chỉ áp ở lượt của link; bỏ tích ô thì về như thường. */
  const locCu = chiOTrong && chiCu && luot === luotBanDau;

  /* Mỗi dòng của lưới báo: còn ô đang gửi không, mấy ô hỏng/gõ sai (`useTrangThaiLuuO`). */
  const [luu, setLuu] = useState<Record<string, { dang: boolean; loi: number }>>({});
  const baoLuu = useCallback((khoa: string, dang: boolean, loi: number) => setLuu((x) => {
    const cu = x[khoa];
    if ((cu?.dang ?? false) === dang && (cu?.loi ?? 0) === loi) return x;
    const moi = { ...x };
    if (dang || loi) moi[khoa] = { dang, loi }; else delete moi[khoa];
    return moi;
  }), []);
  const dangLuu = Object.values(luu).some((v) => v.dang);
  const soLoi = Object.values(luu).reduce((n, v) => n + v.loi, 0);
  /* Phần của `soLoi` là hộp lý do sửa điểm đang mở (khoá `hop-ly-do:` của `useBaoHopLyDoMo`) — câu chặn gọi đúng nút. */
  const soHopLyDo = Object.entries(luu).reduce((n, [k, v]) => (k.startsWith('hop-ly-do:') ? n + v.loi : n), 0);

  /* Hộp hỏi đổi lượt — luật ở `yeuCauDoiLuot` / `buocHoiDoiLuot` (shared). Hộp lý do sửa điểm đang mở cũng tính là ô chưa lưu. */
  const [h, setH] = useState<HoiDoiLuot>(HOI_DOI_LUOT_RONG);
  const [xet, setXet] = useState<{ ma: string; focus: boolean } | null>(null);
  const [doiLop, setDoiLop] = useState(false);   // lần đổi gần nhất là đổi lớp (đích ngoài) — chỉ để chọn chữ "lớp" / "lượt"
  /* `focus` (←/→ trên thanh tab): chỉ dời focus sang tab đích khi đã thật sự chuyển. */
  const dichNgoai = useRef<(() => void) | null>(null);
  const sang = (ma: string, focus = false) => {
    if (ma === DICH_NGOAI) { dichNgoai.current?.(); return; }
    setChon(ma);
    if (focus) requestAnimationFrame(() => document.getElementById(`luot-${classId}-${ma}`)?.focus());
  };
  const doiLuot = (ma: string, focus = false) => {
    if (ma === luot) return;
    /* Điện thoại (iOS Safari giữ focus ở ô khi bấm nút): rời ô đang gõ để ô lưu như khi rời ô, rồi khung sau mới xét. */
    const dang = document.activeElement;
    if (dang instanceof HTMLElement && !(dang instanceof HTMLButtonElement)) dang.blur();
    requestAnimationFrame(() => setXet({ ma, focus }));
  };
  useEffect(() => {
    if (!xet) return;
    setXet(null);
    setDoiLop(xet.ma === DICH_NGOAI);
    const r = yeuCauDoiLuot(xet.ma, dangLuu, soLoi);
    setH(r.h);
    if (r.sang) sang(r.sang, xet.focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ xét một lần cho mỗi lần bấm đổi lượt
  }, [xet]);
  useEffect(() => {
    const r = buocHoiDoiLuot(h, dangLuu, soLoi);
    if (r.h !== h) setH(r.h);
    if (r.sang) sang(r.sang);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `sang` chỉ đặt state
  }, [h, dangLuu, soLoi]);
  /* Bấm thanh lượt khi còn ô chưa lưu: không để mousedown tới `document` — hộp lý do sửa điểm (đóng khi bấm ra ngoài = huỷ)
     giữ nguyên giá trị đang gõ, và đổi lượt bị chặn. */
  const giuHopLyDo = (e: MouseEvent) => { if (soLoi) e.stopPropagation(); };
  useEffect(() => {
    if (congRoi) congRoi.current = { roi: (lam) => { dichNgoai.current = lam; doiLuot(DICH_NGOAI); }, giu: giuHopLyDo };
  });

  const hep = useManHinhHep();
  const vi = dsLuot.findIndex((l) => l.ma === luot);
  const truoc = vi > 0 ? dsLuot[vi - 1] : null;
  const sau = vi >= 0 && vi < dsLuot.length - 1 ? dsLuot[vi + 1] : null;
  const dangXem: TomTatLuot | null = vi >= 0 ? dsLuot[vi] : null;

  const b = bang.data;
  /* Lưu xong một ô: tải lại bảng này + báo trang cha (Test › Điểm theo lớp gộp tải lại danh sách lớp). */
  const daLuuO = () => { bang.reload(); onDaLuu?.(); };
  const chiAttempt = useMemo(() => {
    if (!chiOTrong || !b) return null;
    const ids = b.ft
      ? b.ft.rows.filter((r) => r.cells.some(oTrongLuotFt) && (!locCu || r.lichSu)).map((r) => r.attemptId)
      : (b.thuong?.rows ?? []).filter(hangThuongConTrong).map((r) => r.attemptId);
    return new Set(ids);
  }, [chiOTrong, locCu, b]);
  /* "MT cũ" chỉ hàng MT cũ — em chưa có lịch lượt này không phải việc nhập bù. */
  const hangMo = useMemo<HangMo[]>(() => (locCu ? [] : b?.chuaCoLich ?? []).map((h) => ({
    studentId: h.studentId, ten: h.fullName,
    chu: <>{t('Chưa có lịch {nhan} —', { nhan: b!.luot.nhan })}{' '}<Link className="link" to={duongHoSoHocVien(h.studentId, { mo: 'lo-trinh' })}>{t('xếp ở panel Lộ trình')}</Link></>,
  })), [b, locCu]);

  const phimTab = (e: KeyboardEvent<HTMLDivElement>) => {
    const toi = e.key === 'ArrowLeft' ? truoc : e.key === 'ArrowRight' ? sau : null;
    if (!toi) return;
    e.preventDefault();
    doiLuot(toi.ma, true);
  };

  let noiDung;
  if (ds.error && !ds.data) noiDung = <ErrorState message={ds.error.message} hint={ds.error.hint} onRetry={ds.reload} />;
  else if (ds.loading || !ds.data) noiDung = <Skeleton rows={6} />;
  else if (!dsLuot.length) {
    noiDung = <Empty title={t('Lớp chưa có lượt Test nào. Xếp lịch ở Kế hoạch Test.')} />;
  } else {
    noiDung = (
      <div className="flex flex-col gap-3">
        {ds.error && <LoiTaiLai message={ds.error.message} onRetry={ds.reload} />}
        {hep ? (
          /* 375: một hàng "‹ MT1 · MT2 · W3 JUL · MT3 ›" thay thanh tab — không cuộn ngang. */
          <div className="flex items-center gap-2" onMouseDown={giuHopLyDo}>
            <NutBen luot={truoc} huong="truoc" onChon={doiLuot} />
            <div className="flex-1 min-w-0 text-center" aria-live="polite">
              <div className="font-semibold truncate">
                {dangXem?.nhan}
              </div>
            </div>
            <NutBen luot={sau} huong="sau" onChon={doiLuot} />
          </div>
        ) : (
          <div className="flex items-start gap-2" onMouseDown={giuHopLyDo}>
            <div role="tablist" aria-label={t('Lượt Test')} className="flex flex-wrap gap-1.5 flex-1 min-w-0" onKeyDown={phimTab}>
              {dsLuot.map((l) => {
                const on = l.ma === luot;
                return (
                  <button key={l.ma} id={`luot-${classId}-${l.ma}`} type="button" role="tab" aria-selected={on}
                    aria-controls={`bang-${classId}`} tabIndex={on ? 0 : -1} onClick={() => doiLuot(l.ma)}
                    className={`flex flex-col items-start min-w-[104px] px-3 py-1.5 rounded-lg border text-left leading-tight ${
                      on ? 'bg-[color:var(--accent-soft)] border-[color:var(--accent-line)]'
                        : 'border-[color:var(--line-strong)] hover:bg-[color:var(--surface-2)]'}`}>
                    <span className={`font-semibold text-sm ${on ? 'text-[color:var(--accent-strong)]' : 'text-slate-200'}`}>
                      {dich(l.nhan)}{l.lichSu ? t(' · cũ') : ''}
                    </span>
                    {/* Tab chọn: --text-dim trên --accent-soft (tối 5,07:1 · sáng 6,75:1); --text-faint chỉ 4,10:1 ở tối. */}
                    <span className={`text-[11.5px] tabular-nums ${on ? 'text-slate-400' : 'text-slate-500'}`}>{dongPhuLuot(l)}</span>
                  </button>
                );
              })}
            </div>
            <NutBen luot={truoc} huong="truoc" onChon={doiLuot} chiMuiTen />
            <NutBen luot={sau} huong="sau" onChon={doiLuot} chiMuiTen />
          </div>
        )}

        {(h.hoi || h.chan) && (
          <div role="alert" onMouseDown={giuHopLyDo} className="surface-2 rounded-md px-3 py-2 text-sm flex flex-wrap items-center gap-2">
            {h.hoi && dangLuu ? (
              <>
                <span className="flex-1 min-w-0">{t('Còn ô đang lưu. Đợi lưu xong rồi chuyển?')}</span>
                <button type="button" className="btn btn-sm btn-primary" disabled={h.cho} onClick={() => setH({ ...h, cho: true })}>
                  {h.cho ? t('Đang lưu…') : t('Đợi rồi chuyển')}
                </button>
              </>
            ) : (
              <span className="flex-1 min-w-0 text-bad">{cauChanDoiLuot(soLoi, soHopLyDo, doiLop ? 'lop' : 'luot')}</span>
            )}
            <button type="button" className="btn btn-sm" onClick={() => setH(HOI_DOI_LUOT_RONG)}>{t('Ở lại')}</button>
          </div>
        )}

        {chonMon && b && <ChonMon b={b} mon={mon} onMon={setMon} />}

        <label className="inline-flex items-center gap-2 text-sm self-start min-h-[44px] sm:min-h-0 cursor-pointer">
          <input type="checkbox" checked={chiOTrong}
            onChange={(e) => { setChiOTrong(e.target.checked); ghiChiOTrong(e.target.checked); if (!e.target.checked) setChiCu(false); }} />
          {locCu ? t('Chỉ ô còn trống · MT cũ') : t('Chỉ ô còn trống')}
        </label>

        {dangXem?.lichSu && (
          <div className="surface-2 rounded-md px-3 py-2 text-sm text-slate-300">
            {t('{nhan} là MT cũ: nhập bù điểm; "-" là em không dự thi.', { nhan: dangXem.nhan })}
          </div>
        )}

        <div id={`bang-${classId}`} role="tabpanel" aria-label={dangXem?.nhan}>
          {bang.error && b && <LoiTaiLai message={bang.error.message} onRetry={bang.reload} />}
          {bang.error && !b ? <ErrorState message={bang.error.message} hint={bang.error.hint} onRetry={bang.reload} />
            : !b ? <Skeleton rows={6} />
              : chiAttempt && chiAttempt.size === 0 && !hangMo.length
                ? <Empty title={t('Lượt này không còn ô trống.')} hint={t('Bỏ chọn "Chỉ ô còn trống" để xem cả bảng.')} />
                : (
                  <div className="rounded-lg border overflow-clip" style={{ borderColor: 'var(--line)' }}>
                    <BaoDangLuuContext.Provider value={baoLuu}>
                      <DongThiContext.Provider value>
                        <LuoiChamLop data={b} kind={null} onReload={daLuuO} gon datConTro={false}
                          chiAttempt={chiAttempt} hangMo={hangMo} anNutTao chiCot={mon ? [mon] : null} nutCaLop={false} />
                      </DongThiContext.Provider>
                    </BaoDangLuuContext.Provider>
                  </div>
                )}
        </div>
      </div>
    );
  }
  /* Màn hẹp: bỏ khung + đệm của card ngoài (bảng đã có khung riêng) — tên HV đỡ bị cắt ở 375. */
  return gon ? noiDung : <Card className="max-md:border-0 max-md:bg-transparent" bodyClass="md:p-4">{noiDung}</Card>;
}

/** Hàng chọn môn của panel Nhập điểm lớp: FT theo 5 cột nhập, lớp thường theo môn của chương trình. "Tất cả" = đủ cột. */
function ChonMon({ b, mon, onMon }: { b: BangTheoLuot; mon: string | null; onMon: (m: string | null) => void }) {
  const ds: { k: string | null; nhan: string }[] = [
    { k: null, nhan: t('Tất cả') },
    ...(b.ft ? ENTRY_SKILLS.map((k) => ({ k, nhan: skillShort(k) }))
      : (b.thuong?.programme.skills ?? []).map((k) => ({ k, nhan: b.thuong!.monNgan?.[k] ?? b.thuong!.skillLabels[k] ?? k }))),
  ];
  return (
    <div role="group" aria-label={t('Môn')} className="flex flex-wrap gap-1.5">
      {ds.map((x) => (
        <button key={x.k ?? 'tat-ca'} type="button" aria-pressed={mon === x.k} onClick={() => onMon(x.k)}
          className={`btn btn-sm min-h-[44px] sm:min-h-0 ${mon === x.k ? 'border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : ''}`}>
          {x.nhan}
        </button>
      ))}
    </div>
  );
}

/** Tải lại nền lỗi khi ĐÃ có dữ liệu: dòng nhỏ + "Thử lại" — không thay lưới bằng ErrorState (gỡ ô đang giữ giá trị gõ). */
function LoiTaiLai({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-bad">
      <span className="min-w-0">{message}</span>
      <button type="button" className="btn btn-sm" onClick={onRetry}>{t('Thử lại')}</button>
    </div>
  );
}

/** Nút ‹ / › sang lượt trước / sau. `chiMuiTen` (máy tính, cạnh thanh tab): chỉ mũi tên; màn hẹp: "‹ MT1" / "MT3 ›". */
function NutBen({ luot, huong, onChon, chiMuiTen = false }: {
  luot: TomTatLuot | null; huong: 'truoc' | 'sau'; onChon: (ma: string) => void; chiMuiTen?: boolean;
}) {
  const ten = huong === 'truoc' ? t('Lượt trước') : t('Lượt sau');
  const chu = chiMuiTen || !luot ? (huong === 'truoc' ? '‹' : '›') : huong === 'truoc' ? `‹ ${dich(luot.nhan)}` : `${luot.nhan} ›`;
  return (
    <button type="button" className={`btn btn-ghost min-h-[44px] min-w-[44px] justify-center ${!luot && !chiMuiTen ? 'invisible' : ''}`}
      disabled={!luot} aria-label={luot ? `${ten}: ${dich(luot.nhan)}` : ten} onClick={() => luot && onChon(luot.ma)}>
      {chu}
    </button>
  );
}
