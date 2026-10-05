/**
 * BẢNG ĐIỂM THEO LƯỢT CỦA CẢ LỚP (PR-DL, mockup `thiet-ke/mockup-diem-theo-lop-2026-10-04.html`) — dùng chung cho hồ sơ lớp
 * (khối thu gọn, `gon`) và trang Test › Điểm theo lớp. Mỗi lượt một bảng: FT `mt:N`, lớp thường `thuong:progress|final`.
 *
 * KHÔNG CÓ ĐƯỜNG GHI MỚI: bảng là `LuoiChamLop` (LuoiFT / LuoiThuong, màn hẹp MotKyNang) với dữ liệu `bangTheoLuot` — ô, bàn
 * phím, lưu từng ô, sửa ô có điểm hỏi lý do (override) y như lưới Nhập điểm. Không tự tạo lịch: em chưa có lịch lượt này là
 * hàng mờ cuối bảng, link sang panel Lộ trình của em.
 *
 * Đổi lượt khi còn ô đang lưu → hộp hỏi, đợi lưu xong mới chuyển; còn ô lưu hỏng / gõ sai → không chuyển (điểm đã gõ còn
 * nằm trong ô để "Lưu lại").
 */
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { BaoDangLuuContext } from '../../ui/SaveState.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import {
  chuOChuaLuu, dongPhuLuot, duongHoSoHocVien, hangThuongConTrong, oTrongLuotFt, tuanLich, type TomTatLuot,
} from '@shared/domain/index.ts';
import {
  LuoiChamLop, duongDiemTheoLuot, useManHinhHep, type BangTheoLuot, type DanhSachLuot,
} from './LuoiChamLop.tsx';
import type { HangMo } from './LuoiFT.tsx';

const KHOA_CHI_O_TRONG = 'pisa.diem-theo-lop.chi-o-trong';
function docChiOTrong(): boolean {
  try { return localStorage.getItem(KHOA_CHI_O_TRONG) === '1'; } catch { return false; }
}
function ghiChiOTrong(v: boolean) {
  try { localStorage.setItem(KHOA_CHI_O_TRONG, v ? '1' : '0'); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
}

export function DiemTheoLop({ classId, luotBanDau, gon = false }: { classId: number; luotBanDau?: string; gon?: boolean }) {
  const ds = useApi<DanhSachLuot>(duongDiemTheoLuot(classId), [classId]);
  const [chon, setChon] = useState<string | null>(luotBanDau ?? null);
  const dsLuot = ds.data?.luot ?? [];
  const luot = chon && dsLuot.some((l) => l.ma === chon) ? chon : ds.data?.macDinh ?? null;
  const bang = useApi<BangTheoLuot>(luot ? duongDiemTheoLuot(classId, luot) : null, [classId, luot]);

  const [chiOTrong, setChiOTrong] = useState(docChiOTrong);

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

  /* Hộp hỏi: `hoi` = lượt muốn sang; `cho` = đã bấm "Đợi rồi chuyển". */
  const [hoi, setHoi] = useState<string | null>(null);
  const [cho, setCho] = useState(false);
  const sang = (ma: string) => { setChon(ma); setHoi(null); setCho(false); };
  const doiLuot = (ma: string) => {
    if (ma === luot) return;
    if (dangLuu || soLoi) { setHoi(ma); setCho(false); return; }
    sang(ma);
  };
  /* Lưu xong hết → sang lượt đã bấm; lưu hỏng → ở lại, hộp nói số ô chưa lưu. */
  useEffect(() => {
    if (!hoi || dangLuu) return;
    if (soLoi) setCho(false);
    else sang(hoi);
  }, [hoi, dangLuu, soLoi]);

  const hep = useManHinhHep();
  const vi = dsLuot.findIndex((l) => l.ma === luot);
  const truoc = vi > 0 ? dsLuot[vi - 1] : null;
  const sau = vi >= 0 && vi < dsLuot.length - 1 ? dsLuot[vi + 1] : null;
  const dangXem: TomTatLuot | null = vi >= 0 ? dsLuot[vi] : null;

  const b = bang.data;
  const chiAttempt = useMemo(() => {
    if (!chiOTrong || !b) return null;
    const ids = b.ft
      ? b.ft.rows.filter((r) => r.cells.some(oTrongLuotFt)).map((r) => r.attemptId)
      : (b.thuong?.rows ?? []).filter(hangThuongConTrong).map((r) => r.attemptId);
    return new Set(ids);
  }, [chiOTrong, b]);
  const hangMo = useMemo<HangMo[]>(() => (b?.chuaCoLich ?? []).map((h) => ({
    studentId: h.studentId, ten: h.fullName, ma: h.studentCode,
    chu: <>Chưa có lịch {b!.luot.nhan} — <Link className="link" to={duongHoSoHocVien(h.studentId, { mo: 'lo-trinh' })}>xếp ở panel Lộ trình</Link></>,
  })), [b]);

  const phimTab = (e: KeyboardEvent<HTMLDivElement>) => {
    const toi = e.key === 'ArrowLeft' ? truoc : e.key === 'ArrowRight' ? sau : null;
    if (!toi) return;
    e.preventDefault();
    doiLuot(toi.ma);
    requestAnimationFrame(() => document.getElementById(`luot-${classId}-${toi.ma}`)?.focus());
  };

  let noiDung;
  if (ds.error) noiDung = <ErrorState message={ds.error.message} hint={ds.error.hint} onRetry={ds.reload} />;
  else if (ds.loading || !ds.data) noiDung = <Skeleton rows={6} />;
  else if (!dsLuot.length) {
    noiDung = <Empty title="Lớp chưa có lượt Test nào. Xếp lịch ở Kế hoạch Test." />;
  } else {
    noiDung = (
      <div className="flex flex-col gap-3">
        {hep ? (
          /* 375: một hàng "‹ MT1 · MT2 · W3 JUL · MT3 ›" thay thanh tab — không cuộn ngang. */
          <div className="flex items-center gap-2">
            <NutBen luot={truoc} huong="truoc" onChon={doiLuot} />
            <div className="flex-1 min-w-0 text-center" aria-live="polite">
              <div className="font-semibold truncate">
                {dangXem?.nhan}{dangXem?.tuanStart ? <span className="tabular-nums"> · {tuanLich(dangXem.tuanStart)}</span> : null}
              </div>
            </div>
            <NutBen luot={sau} huong="sau" onChon={doiLuot} />
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div role="tablist" aria-label="Lượt Test" className="flex flex-wrap gap-1.5 flex-1 min-w-0" onKeyDown={phimTab}>
              {dsLuot.map((l) => {
                const on = l.ma === luot;
                return (
                  <button key={l.ma} id={`luot-${classId}-${l.ma}`} type="button" role="tab" aria-selected={on}
                    aria-controls={`bang-${classId}`} tabIndex={on ? 0 : -1} onClick={() => doiLuot(l.ma)}
                    className={`flex flex-col items-start min-w-[104px] px-3 py-1.5 rounded-lg border text-left leading-tight ${
                      on ? 'bg-[color:var(--accent-soft)] border-[color:var(--accent-line)]'
                        : 'border-[color:var(--line-strong)] hover:bg-[color:var(--surface-2)]'}`}>
                    <span className={`font-semibold text-sm ${on ? 'text-[color:var(--accent-strong)]' : 'text-slate-200'}`}>
                      {l.nhan}{l.lichSu ? ' · lịch sử' : ''}
                    </span>
                    <span className="text-[11.5px] text-slate-500 tabular-nums">{dongPhuLuot(l)}</span>
                  </button>
                );
              })}
            </div>
            <NutBen luot={truoc} huong="truoc" onChon={doiLuot} chiMuiTen />
            <NutBen luot={sau} huong="sau" onChon={doiLuot} chiMuiTen />
          </div>
        )}

        {hoi && (
          <div role="alertdialog" aria-label="Đổi lượt" className="surface-2 rounded-md px-3 py-2 text-sm flex flex-wrap items-center gap-2">
            {dangLuu ? (
              <>
                <span className="flex-1 min-w-0">Còn ô đang lưu. Đợi lưu xong rồi chuyển?</span>
                <button type="button" className="btn btn-sm btn-primary" disabled={cho} onClick={() => setCho(true)}>
                  {cho ? 'Đang lưu…' : 'Đợi rồi chuyển'}
                </button>
              </>
            ) : (
              <span className="flex-1 min-w-0 text-bad">{chuOChuaLuu(soLoi || 1)}. Bấm "Lưu lại" ở ô đó rồi mới chuyển lượt.</span>
            )}
            <button type="button" className="btn btn-sm" onClick={() => { setHoi(null); setCho(false); }}>Ở lại</button>
          </div>
        )}

        <label className="inline-flex items-center gap-2 text-sm self-start min-h-[44px] sm:min-h-0 cursor-pointer">
          <input type="checkbox" checked={chiOTrong}
            onChange={(e) => { setChiOTrong(e.target.checked); ghiChiOTrong(e.target.checked); }} />
          Chỉ ô còn trống
        </label>

        {dangXem?.lichSu && (
          <div className="surface-2 rounded-md px-3 py-2 text-sm text-slate-300">
            {dangXem.nhan} là lượt lịch sử (trước khi lớp dùng web): nhập bù điểm, không nhận dấu "-".
          </div>
        )}

        <div id={`bang-${classId}`} role="tabpanel" aria-label={dangXem?.nhan}>
          {bang.error ? <ErrorState message={bang.error.message} hint={bang.error.hint} onRetry={bang.reload} />
            : !b ? <Skeleton rows={6} />
              : chiAttempt && chiAttempt.size === 0 && !hangMo.length
                ? <Empty title="Lượt này không còn ô trống." hint='Bỏ chọn "Chỉ ô còn trống" để xem cả bảng.' />
                : (
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
                    <BaoDangLuuContext.Provider value={baoLuu}>
                      <LuoiChamLop data={b} kind={null} onReload={bang.reload} gon datConTro={false}
                        chiAttempt={chiAttempt} hangMo={hangMo} />
                    </BaoDangLuuContext.Provider>
                  </div>
                )}
        </div>
      </div>
    );
  }
  return gon ? noiDung : <Card>{noiDung}</Card>;
}

/** Nút ‹ / › sang lượt trước / sau. `chiMuiTen` (máy tính, cạnh thanh tab): chỉ mũi tên; màn hẹp: "‹ MT1" / "MT3 ›". */
function NutBen({ luot, huong, onChon, chiMuiTen = false }: {
  luot: TomTatLuot | null; huong: 'truoc' | 'sau'; onChon: (ma: string) => void; chiMuiTen?: boolean;
}) {
  const ten = huong === 'truoc' ? 'Lượt trước' : 'Lượt sau';
  const chu = chiMuiTen || !luot ? (huong === 'truoc' ? '‹' : '›') : huong === 'truoc' ? `‹ ${luot.nhan}` : `${luot.nhan} ›`;
  return (
    <button type="button" className={`btn btn-ghost min-h-[44px] min-w-[44px] justify-center ${!luot && !chiMuiTen ? 'invisible' : ''}`}
      disabled={!luot} aria-label={luot ? `${ten}: ${luot.nhan}` : ten} onClick={() => luot && onChon(luot.ma)}>
      {chu}
    </button>
  );
}
