/**
 * HỘP NHẬP ĐIỂM MT (OV-4b, mockup overhaul-1 §3) — MỘT hộp cho MỌI chỗ nhập điểm Mock, gồm MT0: lưới lớp (Điểm theo lớp, hồ sơ lớp,
 * Lịch Test nhúng, `/nhap-diem`), màn điện thoại một kỹ năng, hồ sơ lượt MT, Lộ trình. Thay khung 4 tiêu chí trượt phải, khung sửa dưới
 * dải ô lớn và ô gõ thẳng L/R.
 *
 *   ODiemMt      Ô điểm là NÚT: L/R "14 · 4.5", W/S "5.0", ô trống "Nhập", ô vắng "Vắng → W3 OCT". Bấm → hộp neo ngay ô.
 *   HopNhapDiem  Đầu "Reading · MT2" / "{em} · {lớp} · {W2 OCT}"; con trỏ đứng sẵn ở ô điểm; chân Vắng · Lưu · Lưu · em tiếp ›.
 *                Enter = "Lưu · em tiếp ›" (trang một em: Lưu). Esc đóng. < 640 px: tấm trượt từ dưới.
 *
 * Luật dùng lại, không luật thứ hai: `rawPatchFrom` / `criteriaPatchFrom` dựng lệnh ("-" = Vắng, T10 band nhập thẳng), lưu qua
 * `useSaveScore` với `nem` — lỗi máy chủ hiện TRONG hộp, chữ đã gõ giữ nguyên; chỉ đóng / sang em kế khi máy chủ đã trả về.
 * Sửa ô đã có điểm: thêm ô "Lý do sửa (tuỳ chọn)" (RB-5, T7 — như `SuaDiemCoLyDo`). Ô đang Vắng (`daChot`): "Vắng lần n · đã dời
 * sang …", Bỏ vắng (quyền OV-1b do máy chủ tính: `goDuoc`), Lưu điểm.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  LOI_SO_CAU, LOI_SO_CAU_KHOANG, NHAN_XET_TOI_DA, bandTuSoCau, criteriaPatchFrom, demNguocSuaDau, ngay, rawPatchFrom, tieuChiNganCua, tuanLich,
  type NguoiChon,
} from '@shared/domain/index.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { useSession } from '../../lib/session.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useGiuFocus } from '../../ui/giuFocus.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useBaoHopLyDoMo } from '../../ui/SaveState.tsx';
import { cungGvCham, gvChamPayload, gvChamThanhChon } from '../cham/GvCham.tsx';
import {
  bandBanDau, chanDau, coDau, coDiemChinhThuc, lockedByNoShow, lyDoChiDoc, suaDuoc, type Cell, type SaveOpts, type SavePatch,
} from './ScoreEntry.tsx';

/** Ngữ cảnh đầu hộp + dòng phụ: em · lớp · lượt ("MT2" / "MT0"), kỳ vọng (L/R), MT0 = một ô Band. */
export type NguCanhHop = {
  tenHv: string; lop: string | null; luot: string; kyVong?: number | null; mt0?: boolean;
  /** Band của task Writing còn lại (ô W1 ↔ W2) — dòng "Task 2 chưa có". */
  bandTaskKia?: number | null;
};

/** Đầu hộp của trang một lượt (hồ sơ MT, Lộ trình — `GET /attempts/:id`): em · lớp · MT{n}; MT0 một ô Band. */
export const nguCanhChiTiet = (d: { student: { name: string }; classCode: string | null; kind: string; attemptNo: number; result?: any }) => ({
  tenHv: d.student.name, lop: d.classCode, luot: d.kind === 'mt0' ? 'MT0' : `MT${d.attemptNo}`,
  kyVong: d.result?.expectation ?? null, mt0: d.kind === 'mt0',
});

type HopProps = {
  cell: Cell; anchor: HTMLElement; ctx: NguCanhHop;
  onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean>;
  onDong: () => void;
  /** Có em kế (lưới, danh sách) → nút "Lưu · em tiếp ›" + Enter đi em kế; không có (trang một em) → chỉ "Lưu". */
  onTiep?: () => void;
  /** Speaking: người chấm mặc định của cột (lớp × tuần) khi ô chưa có. */
  gvMacDinh?: NguoiChon | null;
};

const laLR = (s: string) => s === 'listening' || s === 'reading';

/** Chữ trên nút ô điểm (lưới, danh sách). */
function chuO(c: Cell) {
  if (c.progress === 'cancelled') return laLR(c.skill) ? 'Đã huỷ phần thi' : 'Đã huỷ';
  if (c.daChot?.doiSang) return `Vắng → ${c.daChot.doiSang}`;
  if (coDau(c)) return '-';
  if (c.rawScore !== null) return <>{c.rawScore} <span className="text-xs text-slate-500">· {fmtBand(c.band)}</span></>;
  if (c.band !== null) return fmtBand(c.band);
  return null;
}

/**
 * DÒNG NHỎ DƯỚI Ô ĐANG MANG "-" CHƯA CHỐT (DS02, Q17, C41): còn cửa sổ sửa thì đếm ngược bằng chữ xám; câu đầy đủ ở tooltip.
 * Điện thoại xuống dòng, không cắt.
 */
function DongDau({ cell }: { cell: Cell }) {
  const { homNay } = useNgayNghiepVu();
  if (!cell.noShow || cell.daChot) return null;
  const dem = cell.noShow.state === 'khong-co-bai' ? demNguocSuaDau(cell.noShow.editableUntil ?? null, homNay) : null;
  return (
    <span className="block max-w-[6rem] truncate text-xs leading-tight text-slate-400 max-sm:max-w-none max-sm:whitespace-normal max-sm:text-right" title={cell.noShow.text}>
      {dem ?? cell.noShow.text}
    </span>
  );
}

/**
 * KIỂU Ô theo mockup duyệt 11/10 (`.od.vang` · `.od.trong` · `.od.huy`): vắng tím chờ, trống "Nhập" viền đứt màu nhấn, huỷ viền chấm mờ.
 * Ô vắng hai dòng ("Vắng" / "→ W3 SEP") để vừa cột 104 px của lưới (bảng `table-layout: fixed`).
 */
const KIEU_O = {
  vang: 'flex-col !gap-0 leading-tight border-[color:rgb(var(--wait-line-rgb))] text-[color:rgb(var(--wait-rgb))]',
  trong: 'justify-center border-dashed text-[color:var(--accent)]',
  huy: 'border-dotted text-slate-500',
} as const;

/**
 * Ô ĐIỂM MT: nút mở hộp; ô không mở được là chữ (E5: không viền, không mờ) có câu "vì sao" ở tooltip.
 * `mo` do nơi gọi giữ (lưới / danh sách: một hộp một lúc, "em tiếp" chuyển sang dòng kế).
 */
export function ODiemMt({ cell, lon = false, mo, onMo, ...hop }: Omit<HopProps, 'anchor' | 'onDong'> & {
  lon?: boolean; mo: boolean; onMo: (mo: boolean) => void;
}) {
  const [neo, setNeo] = useState<HTMLButtonElement | null>(null);
  const chu = chuO(cell);
  if (!suaDuoc(cell)) {
    const vang = cell.sitStatus === 'absent' && cell.band === null && !cell.daChot;
    return (
      <span className="inline-flex flex-col items-end gap-0.5">
        <span className={`tabular-nums ${vang || cell.progress === 'cancelled' ? 'text-xs text-slate-500' : 'text-slate-300'} ${lon ? 'text-base' : ''}`}
          title={cell.noShow?.text ?? lyDoChiDoc(cell)}>
          {vang ? 'vắng' : chu ?? '—'}
        </span>
        <DongDau cell={cell} />
      </span>
    );
  }
  const kieu = cell.progress === 'cancelled' ? 'huy' : cell.daChot?.doiSang ? 'vang' : chu === null ? 'trong' : null;
  return (
    <span className="inline-flex max-w-full flex-col items-end gap-0.5">
      <button ref={setNeo} type="button" aria-expanded={mo} aria-haspopup="dialog"
        aria-label={`${skillLabel(cell.skill)} · ${hop.ctx.tenHv}: ${cell.rawScore !== null ? `${cell.rawScore} câu, band ${fmtBand(cell.band)}` : typeof chu === 'string' ? chu : 'Nhập'}`}
        className={`btn max-w-full tabular-nums ${lon ? 'min-h-[44px] min-w-[60px] justify-center text-base font-semibold' : 'btn-sm'} ${kieu ? KIEU_O[kieu] : ''} ${mo ? 'border-[color:var(--accent)]' : ''}`}
        title={cell.noShow?.text ?? `${skillLabel(cell.skill)} — bấm để nhập`}
        onClick={() => onMo(!mo)}>
        {kieu === 'vang' ? <><span>Vắng</span><span className="text-[11px]">→ {cell.daChot!.doiSang}</span></> : chu ?? 'Nhập'}
      </button>
      <DongDau cell={cell} />
      {mo && neo && <HopNhapDiem cell={cell} anchor={neo} onDong={() => onMo(false)} {...hop} />}
    </span>
  );
}

export function HopNhapDiem({ cell, anchor, ctx, onSave, onDong, onTiep, gvMacDinh = null }: HopProps) {
  const { homNay } = useNgayNghiepVu();
  const { session } = useSession();
  const motO = laLR(cell.skill) || !!ctx.mt0;     // một ô: số câu (L/R) hoặc Band (MT0)
  const theoBand = !!ctx.mt0;
  const vang = !!cell.daChot;
  const nhapDuoc = cell.canEdit && !lockedByNoShow(cell);
  const laS = cell.skill === 'speaking';
  const laW = cell.skill === 'writing1' || cell.skill === 'writing2';
  const tc = tieuChiNganCua(cell.skill) ?? [];

  const [t0] = useState(() => {
    if (vang) return '';
    if (theoBand) return cell.band !== null ? fmtBand(cell.band) : coDau(cell) ? '-' : '';
    return cell.rawScore !== null ? String(cell.rawScore) : cell.band !== null ? fmtBand(cell.band) : coDau(cell) ? '-' : '';
  });
  const [vals0] = useState<string[]>(() => (vang || motO ? ['', '', '', '']
    : coDau(cell) && cell.criteria.every((v) => v === null) ? ['-', '', '', ''] : cell.criteria.map((v) => (v === null ? '' : String(v)))));
  const [band0] = useState(() => (vang || motO ? '' : bandBanDau(cell)));
  const [t, setT] = useState(t0);
  const [vals, setVals] = useState(vals0);
  const [bandText, setBandText] = useState(band0);
  const [nx, setNx] = useState(cell.nhanXet ?? '');
  const gvCu = gvChamThanhChon(cell.gvCham);
  const gv0 = gvCu ?? gvMacDinh;
  const [gv, setGv] = useState<NguoiChon | null>(gv0);
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<{ cau: string; o: number | null } | null>(null);

  /* Lệnh điểm từ chữ đang gõ — cùng hàm với mọi nơi nhập. `o` = ô sai (0..3 tiêu chí / ô một, 4 = Band) để tô đỏ. */
  const diem = (() => {
    if (motO) {
      const doi = t.trim() !== t0.trim();
      if (theoBand) {
        const s = t.trim();
        if (s === '-') return { doi, patch: { noShow: true } as SavePatch, loi: null, o: null, preview: null };
        if (s === '') return { doi, patch: (coDau(cell) ? { noShow: false } : { band: null }) as SavePatch, loi: null, o: null, preview: null };
        const r = criteriaPatchFrom(['', '', '', ''], cell, s);
        return { doi, patch: r.patch as SavePatch | null, loi: r.loi, o: r.patch ? null : 0, preview: r.preview };
      }
      const p = rawPatchFrom(t, cell) as SavePatch | null;
      if (!p) return { doi, patch: null, loi: LOI_SO_CAU, o: 0, preview: null };
      if (p.rawScore != null) {
        const b = bandTuSoCau(cell.skill as 'listening' | 'reading', p.rawScore);
        return b === null ? { doi, patch: null, loi: LOI_SO_CAU_KHOANG, o: 0, preview: null } : { doi, patch: p, loi: null, o: null, preview: b };
      }
      return { doi, patch: p, loi: null, o: null, preview: p.band ?? null };
    }
    const doi = vals.some((v, i) => v.trim() !== vals0[i].trim()) || bandText.trim() !== band0.trim();
    const r = criteriaPatchFrom(vals, cell, bandText);
    const sai = vals.findIndex((v) => { const s = v.trim(); return s !== '' && s !== '-' && !Number.isFinite(Number(s)); });
    return { doi, patch: r.patch as SavePatch | null, loi: r.loi, o: r.patch ? null : sai >= 0 ? sai : 4, preview: r.preview };
  })();
  /* Ô vắng: xoá trắng ô "Em có làm bài?" không phải lệnh gì — Bỏ vắng là nút riêng. */
  const doiDiem = diem.doi && !(vang && diem.patch && 'noShow' in diem.patch);
  const doiNx = nx.trim() !== (cell.nhanXet ?? '').trim();
  const doiGv = laS && !cungGvCham(gv, gv0, session?.user?.id);
  const daGo = doiDiem || doiNx || doiGv || lyDo.trim() !== '';
  const hoiLyDo = coDiemChinhThuc(cell) && doiDiem && !!diem.patch && !('noShow' in diem.patch);
  const nhanVang = nhapDuoc && !vang && !coDiemChinhThuc(cell) && !chanDau(cell) && !doiDiem;
  /* Hộp có chữ đã gõ chưa gửi = một ô chưa lưu (bảng điểm theo lượt chặn đổi lượt — như hộp lý do cũ). */
  useBaoHopLyDoMo(busy, daGo);

  const gui = async (lenh: SavePatch[], sau: () => void) => {
    if (busy) return;
    setBusy(true); setLoi(null);
    try {
      for (const l of lenh) if (!(await onSave(l, { nem: true }))) throw new Error('Không lưu được — thử lại.');
    } catch (e: any) {
      setLoi({ cau: e?.message ?? 'Không lưu được — thử lại.', o: null });
      setBusy(false);
      return;
    }
    setBusy(false);
    sau();
  };

  const luu = (tiep: boolean) => {
    if (doiDiem && !diem.patch) { setLoi({ cau: diem.loi ?? LOI_SO_CAU, o: diem.o }); return; }
    const them: SavePatch = {};
    if (doiNx) them.nhanXet = nx.trim() || null;
    const coDiemMoi = doiDiem && !!diem.patch && ('criteria' in diem.patch || 'band' in diem.patch || 'rawScore' in diem.patch);
    if (laS && (doiGv || (coDiemMoi && !cungGvCham(gv, gvCu, session?.user?.id)))) them.gvCham = gvChamPayload(gv);
    const lenh: SavePatch[] = [];
    if (doiDiem && diem.patch) {
      const p: SavePatch = { ...diem.patch, ...(hoiLyDo && lyDo.trim() ? { lyDo: lyDo.trim() } : {}) };
      /* "-" là lệnh, không mang nhận xét (máy chủ bỏ qua ở nhánh đó) → nhận xét / người chấm gửi lệnh sau. */
      if ('noShow' in p) { lenh.push(p); if (Object.keys(them).length) lenh.push(them); } else lenh.push({ ...p, ...them });
    } else if (Object.keys(them).length) lenh.push(them);
    const sau = tiep && onTiep ? onTiep : onDong;
    if (!lenh.length) { sau(); return; }
    void gui(lenh, sau);
  };

  const dong = () => {
    if (busy) return;
    if (daGo && !window.confirm('Bỏ các giá trị đã gõ?')) return;
    onDong();
  };

  const phim = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    const laNx = (e.target as HTMLElement).tagName === 'TEXTAREA';
    if (laNx && !(e.ctrlKey || e.metaKey)) return;          // ô nhận xét: Enter xuống dòng, Ctrl+Enter lưu
    if ((e.target as HTMLElement).closest('[data-chon-nguoi]')) return;
    e.preventDefault();
    luu(!vang);
  };

  const oSo = (extra: string) => `field text-center tabular-nums ${extra}`;
  /* Ô sai: viền + vòng đỏ, kể cả khi đang focus (vòng focus nhấn của `.field` không che màu lỗi). */
  const stSai = (sai: boolean) => (sai ? { borderColor: 'rgb(var(--bad-rgb))', boxShadow: '0 0 0 3px rgb(var(--bad-rgb) / 0.25)' } : undefined);
  const tuan = cell.weekStart ? tuanLich(cell.weekStart, homNay) : null;
  const kv = laLR(cell.skill) && !theoBand && !vang ? ctx.kyVong ?? null : null;
  const nTask = cell.skill === 'writing1' ? 1 : 2;
  const coTieuChi = vals.some((v) => v.trim() !== '');

  const than = (
    <>
      {vang && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-wait-line bg-wait-bg px-3 py-2.5 text-[13px] text-slate-200">
          <span><b className="text-wait">Vắng lần {Math.max(1, cell.daChot!.lan)}</b>
            {cell.daChot!.doiSang && <> · đã dời sang <span className="tabular-nums">{cell.daChot!.doiSang}</span></>}</span>
          {cell.daChot!.ghiLuc && <span className="text-slate-400">Ghi {ngay(cell.daChot!.ghiLuc, homNay)}{cell.daChot!.ghiBoi ? ` bởi ${cell.daChot!.ghiBoi}` : ''}</span>}
        </div>
      )}
      {(!vang || nhapDuoc) && (motO ? (
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="text-xs font-medium text-slate-300" htmlFor="hop-diem-o">
              {vang ? 'Em có làm bài? Số câu đúng' : theoBand ? 'Band' : 'Số câu đúng'}
            </label>
            <input id="hop-diem-o" className={oSo('w-16 max-sm:h-11 max-sm:text-base')} style={stSai(loi?.o === 0)} inputMode="decimal" value={t}
              aria-invalid={loi?.o === 0 || undefined} disabled={busy}
              onChange={(e) => { setT(e.target.value); setLoi(null); }} />
            {!theoBand && <span className="text-xs tabular-nums text-slate-500">/ 40</span>}
            {!theoBand && !vang && (
              <span className="ml-auto text-sm text-slate-400">Band <b className="tabular-nums text-slate-100">{diem.patch && 'noShow' in diem.patch ? '-' : fmtBand(diem.preview)}</b></span>
            )}
          </div>
          {kv !== null && (
            <div className="mt-1.5 text-xs tabular-nums text-slate-500">
              Kỳ vọng {ctx.luot}: {fmtBand(kv)}
              {diem.preview !== null && diem.preview < kv && <> · <span className="text-bad">dưới {fmtBand(kv - diem.preview)}</span></>}
            </div>
          )}
        </div>
      ) : (
        <div>
          {vang && <div className="mb-1.5 text-xs font-medium text-slate-300">Em có làm bài?</div>}
          <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_4rem] items-end gap-1.5">
            {tc.map((n) => <span key={n} className="text-center text-xs font-semibold text-slate-400">{n}</span>)}
            <span className="text-center text-xs font-semibold text-slate-400">Band</span>
            {tc.map((n, i) => (
              <input key={n} className={oSo('w-full px-1 max-sm:h-11 max-sm:text-base')} style={stSai(loi?.o === i)} inputMode="decimal"
                value={vals[i] ?? ''} aria-label={`${skillLabel(cell.skill)} — ${n}`} aria-invalid={loi?.o === i || undefined} disabled={busy}
                onChange={(e) => { setVals((v) => v.map((x, j) => (j === i ? e.target.value : x))); setLoi(null); }} />
            ))}
            {coTieuChi ? (
              <b className="self-center text-center text-base tabular-nums text-slate-100" aria-live="polite">{diem.patch && 'noShow' in diem.patch ? '-' : fmtBand(diem.preview)}</b>
            ) : (
              <input className={oSo('w-full px-1 max-sm:h-11 max-sm:text-base')} style={stSai(loi?.o === 4)} inputMode="decimal" value={bandText}
                aria-label={`${skillLabel(cell.skill)} — band`} aria-invalid={loi?.o === 4 || undefined} disabled={busy}
                onChange={(e) => { setBandText(e.target.value); setLoi(null); }} />
            )}
          </div>
          {laW && !vang && (
            <div className="mt-1.5 text-xs text-slate-500">
              {ctx.bandTaskKia == null ? `Task ${3 - nTask} chưa có · ` : ''}Writing = (Task 1 + Task 2 × 2) / 3 khi đủ hai task
            </div>
          )}
        </div>
      ))}
      {laS && !vang && nhapDuoc && (
        <div className="flex items-center gap-2" data-chon-nguoi>
          <span className="shrink-0 text-xs font-medium text-slate-300">Người chấm</span>
          <div className="min-w-0 flex-1">
            <ChonNguoi value={gv} onChange={setGv} nhom="nhan_vien" choNgoai macDinhTrong="Chưa chọn" ariaLabel="Người chấm Speaking" disabled={busy} />
          </div>
        </div>
      )}
      {!vang && nhapDuoc && (
        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-slate-300">
            <span>{laW ? `Nhận xét Task ${nTask}` : 'Nhận xét'}</span>
            {nx.length > 800 && <span className={`tabular-nums ${nx.length >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{nx.length}/{NHAN_XET_TOI_DA}</span>}
          </span>
          <textarea className="field w-full text-sm" rows={2} maxLength={NHAN_XET_TOI_DA} value={nx} disabled={busy}
            onChange={(e) => setNx(e.target.value)} />
        </label>
      )}
      {hoiLyDo && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-300">Lý do sửa (tuỳ chọn)</span>
          <input className="field w-full text-sm" value={lyDo} placeholder="Ví dụ: chấm lại bài, nhập nhầm cột" disabled={busy}
            onChange={(e) => setLyDo(e.target.value)} />
        </label>
      )}
      {loi && (
        <div role="alert" className="rounded-lg border border-bad-line bg-bad-bg px-3 py-2.5 text-[13px] text-slate-200">
          <b className="text-bad">Chưa lưu:</b> {loi.cau}
        </div>
      )}
    </>
  );

  const nut = 'btn btn-sm max-sm:min-h-[44px]';
  const chan = vang ? (
    <>
      {cell.daChot!.goDuoc && (
        <button type="button" className={nut} disabled={busy} onClick={() => void gui([{ noShow: false }], onDong)}>Bỏ vắng</button>
      )}
      <span className="flex-1" />
      {nhapDuoc && <button type="button" className={`${nut} btn-primary`} disabled={busy} onClick={() => luu(false)}>{busy ? 'Đang lưu…' : 'Lưu điểm'}</button>}
    </>
  ) : (
    <>
      {nhanVang && (
        <button type="button" className={`${nut} btn-ghost`} disabled={busy} onClick={() => void gui([{ noShow: true }], onTiep ?? onDong)}>Vắng</button>
      )}
      <span className="flex-1" />
      <button type="button" className={onTiep ? nut : `${nut} btn-primary`} disabled={busy} onClick={() => luu(false)}>{busy && !onTiep ? 'Đang lưu…' : 'Lưu'}</button>
      {onTiep && <button type="button" className={`${nut} btn-primary`} disabled={busy} onClick={() => luu(true)}>{busy ? 'Đang lưu…' : 'Lưu · em tiếp ›'}</button>}
    </>
  );

  const ten = `${skillLabel(cell.skill)} · ${ctx.luot}`;
  return (
    <KhungHop anchor={anchor} ten={ten} phu={<>{[ctx.tenHv, ctx.lop].filter(Boolean).join(' · ')}{tuan && <> · <span className="tabular-nums">{tuan}</span></>}</>}
      nhanHop={`${ten} · ${ctx.tenHv}`} daGo={daGo} onDong={dong} onKeyDown={phim} chan={chan}>
      {than}
    </KhungHop>
  );
}

/**
 * KHUNG HỘP NHỎ NEO Ô (đầu · thân · chân) — dùng chung cho hộp nhập điểm MT và hộp nhận xét lớp thường. Neo dưới ô, kẹp trong màn,
 * hết chỗ thì lật lên (như `HopKyNang`); < 640 px → tấm trượt từ dưới. Mở: con trỏ vào ô nhập đầu; Tab vòng trong hộp; đóng trả focus
 * về ô. Esc / bấm ra ngoài → `onDong` (bấm ra ngoài khi đã gõ thì giữ hộp — không mất chữ).
 */
function KhungHop({ anchor, ten, phu, nhanHop, daGo, onDong, onKeyDown, chan, children }: {
  anchor: HTMLElement; ten: string; phu: ReactNode; nhanHop: string; daGo: boolean; onDong: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void; chan: ReactNode; children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  useGiuFocus(box);
  const dienThoai = typeof window !== 'undefined' && window.innerWidth < 640;
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const dat = () => {
    if (dienThoai || !box.current) return;
    const r = anchor.getBoundingClientRect();
    const rong = box.current.offsetWidth, cao = box.current.offsetHeight;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - rong - 8);
    const top = r.bottom + 4 + cao > window.innerHeight - 8 ? Math.max(8, r.top - cao - 4) : r.bottom + 4;
    setPos((p) => (p && p.top === top && p.left === left ? p : { top, left }));
  };
  useLayoutEffect(() => { if (!dienThoai) anchor.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { dat(); });   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const o = box.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([disabled]), textarea:not([disabled])');
    o?.focus({ preventScroll: true });
    o?.select();
  }, []);
  const moi = useRef({ daGo, onDong });
  moi.current = { daGo, onDong };
  useEffect(() => {
    const away = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (box.current?.contains(el) || anchor.contains(el) || el.closest('[role="dialog"], [role="menu"], [role="listbox"]')) return;
      if (!moi.current.daGo) moi.current.onDong();
    };
    /* Esc chỉ đóng lớp trên cùng: hộp chọn người mở trong hộp tự đóng trước (`defaultPrevented`). */
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); moi.current.onDong(); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', dat);
    window.addEventListener('scroll', dat, true);
    return () => {
      document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc);
      window.removeEventListener('resize', dat); window.removeEventListener('scroll', dat, true);
    };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <>
      {dienThoai && <div className="fixed inset-0 z-[59] bg-black/60" aria-hidden onClick={() => { if (!daGo) onDong(); }} />}
      <div ref={box} role="dialog" aria-label={nhanHop} tabIndex={-1} onKeyDown={onKeyDown}
        className={`z-[60] border outline-none ${dienThoai
          ? 'fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl'
          : 'fixed w-[min(400px,calc(100vw-32px))] rounded-xl shadow-2xl'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)', ...(dienThoai ? {} : { top: pos?.top ?? 0, left: pos?.left ?? 0, opacity: pos ? 1 : 0 }) }}>
        {dienThoai && <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />}
        <div className="border-b px-3.5 pb-2 pt-3" style={{ borderColor: 'var(--line)' }}>
          <div className="text-[15px] font-extrabold text-slate-100">{ten}</div>
          <div className="mt-0.5 truncate text-xs text-slate-400" title={nhanHop}>{phu}</div>
        </div>
        <div className="flex flex-col gap-3 px-3.5 py-3">{children}</div>
        <div className="flex flex-wrap items-center gap-2 border-t px-3.5 py-2.5" style={{ borderColor: 'var(--line)' }}>{chan}</div>
      </div>
    </>,
    document.body,
  );
}

/**
 * NÚT "NHẬN XÉT" CỦA LỚP THƯỜNG (OV-4b, chốt HD2): ô điểm lớp thường giữ gõ thẳng đúng/tổng; nút nhỏ cạnh ô mở hộp chỉ có ô Nhận xét,
 * lưu riêng (`PUT /regular/attempts/:id/scores/:skill { nhanXet }`, cùng quyền nhập điểm môn đó). Đã có nhận xét → chữ màu nhấn.
 */
export function NutNhanXet({ tenMon, phu, giaTri, lon = false, onLuu }: {
  tenMon: string; phu: string; giaTri: string | null; lon?: boolean;
  /** Ném lỗi khi máy chủ từ chối — hộp hiện câu lỗi, giữ chữ đã gõ. */
  onLuu: (v: string | null) => Promise<boolean>;
}) {
  const [neo, setNeo] = useState<HTMLButtonElement | null>(null);
  const [mo, setMo] = useState(false);
  return (
    <>
      <button ref={setNeo} type="button" aria-haspopup="dialog" aria-expanded={mo} title={giaTri ?? undefined}
        aria-label={`Nhận xét · ${tenMon} · ${phu}`}
        className={`btn btn-sm btn-ghost shrink-0 px-1.5 text-xs ${lon ? 'min-h-[44px]' : ''} ${giaTri ? 'text-[color:var(--accent-strong)]' : 'text-slate-400'}`}
        onClick={() => setMo((m) => !m)}>Nhận xét</button>
      {mo && neo && <HopNhanXetThuong anchor={neo} tenMon={tenMon} phu={phu} giaTri={giaTri} onLuu={onLuu} onDong={() => setMo(false)} />}
    </>
  );
}

function HopNhanXetThuong({ anchor, tenMon, phu, giaTri, onLuu, onDong }: {
  anchor: HTMLElement; tenMon: string; phu: string; giaTri: string | null;
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
      if (!(await onLuu(nx.trim() || null))) throw new Error('Không lưu được — thử lại.');
    } catch (e: any) { setLoi(e?.message ?? 'Không lưu được — thử lại.'); setBusy(false); return; }
    setBusy(false);
    onDong();
  };
  const dong = () => { if (!busy && (!daGo || window.confirm('Bỏ các giá trị đã gõ?'))) onDong(); };
  return (
    <KhungHop anchor={anchor} ten={`Nhận xét · ${tenMon}`} phu={phu} nhanHop={`Nhận xét · ${tenMon} · ${phu}`} daGo={daGo} onDong={dong}
      onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void luu(); } }}
      chan={<><span className="flex-1" /><button type="button" className="btn btn-sm btn-primary max-sm:min-h-[44px]" disabled={busy} onClick={() => void luu()}>{busy ? 'Đang lưu…' : 'Lưu'}</button></>}>
      <label className="block">
        <span className="sr-only">Nhận xét</span>
        <textarea className="field w-full text-sm" rows={3} maxLength={NHAN_XET_TOI_DA} value={nx} disabled={busy} onChange={(e) => setNx(e.target.value)} />
      </label>
      {nx.length > 800 && <span className={`self-end text-xs tabular-nums ${nx.length >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{nx.length}/{NHAN_XET_TOI_DA}</span>}
      {loi && (
        <div role="alert" className="rounded-lg border border-bad-line bg-bad-bg px-3 py-2.5 text-[13px] text-slate-200">
          <b className="text-bad">Chưa lưu:</b> {loi}
        </div>
      )}
    </KhungHop>
  );
}
