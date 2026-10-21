/**
 * HỘP NHẬP ĐIỂM MT (OV-4b, mockup overhaul-1 §3) — MỘT hộp cho MỌI chỗ nhập điểm Mock, gồm MT0: lưới lớp (Điểm theo lớp, hồ sơ lớp,
 * Lịch Test nhúng, `/nhap-diem`), màn điện thoại một kỹ năng, hồ sơ lượt MT, Lộ trình. Thay khung 4 tiêu chí trượt phải, khung sửa dưới
 * dải ô lớn và ô gõ thẳng L/R.
 *
 *   ODiemMt      Ô điểm là NÚT: L/R "4.5" + dòng "14 câu", W/S "5.0", ô trống = khung rỗng (OV-15b), ô vắng "Vắng → W3 OCT". Bấm → hộp neo ngay ô.
 *   HopNhapDiem  Đầu "Reading · MT2" / "{em} · {lớp} · {W2 OCT}"; con trỏ đứng sẵn ở ô điểm; chân Vắng · Lưu · Lưu · em tiếp ›.
 *                Enter = "Lưu · em tiếp ›" (trang một em: Lưu). Esc đóng. < 640 px: tấm trượt từ dưới.
 *
 * Luật dùng lại, không luật thứ hai: `rawPatchFrom` / `criteriaPatchFrom` dựng lệnh ("-" = Vắng; Band nhập thẳng chỉ MT cũ / MT0 — OV-4c), lưu qua
 * `useSaveScore` với `nem` — lỗi máy chủ hiện TRONG hộp, chữ đã gõ giữ nguyên; chỉ đóng / sang em kế khi máy chủ đã trả về.
 * Sửa ô đã có điểm: thêm ô "Lý do sửa (tuỳ chọn)" (RB-5, T7 — như `SuaDiemCoLyDo`). Ô đang Vắng (`daChot`): "Vắng lần n · đã dời
 * sang …", Bỏ vắng (quyền OV-1b do máy chủ tính: `goDuoc`), Lưu điểm.
 * OV-11a: ô đã dời vì vắng chỉ là ô Vắng ở lưới TUẦN GỐC (`tuanXem` ≠ tuần thi); ở tuần thi bù là ô thường + dòng "vắng lần 1 · dời từ …"
 * (nút Vắng = lần 2). Nút Vắng sau tuần thi / MT cũ ghi "Không dự thi" (`chuNutVang`). Đóng khi đã gõ: hỏi ngay chân hộp (Bỏ · Gõ tiếp).
 * OV-12b (chủ SP 14/10, mockup ov12-1 §1–2): MT (không MT0 / MT cũ) — "Nhận xét *" bắt buộc khi ô sẽ có điểm (≥ 10 ký tự); band dưới kỳ vọng →
 * hàng chip "Nhóm nguyên nhân *" (số thứ tự, 1 = chính); thiếu → Lưu tắt + một dòng lý do; Enter nhảy tới chỗ thiếu. "Kỳ vọng MT{n}" ở mọi kỹ năng.
 * Ô đã có điểm mà thiếu (dữ liệu trước luật): chữ "thiếu nhận xét" / "thiếu nhóm nguyên nhân" dưới số (không vẽ ✓ "đủ" — trùng dấu "đã lưu" của ô).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  CAU_THIEU_NHAN_XET, CHU_O_THIEU, LOI_SO_CAU, LOI_SO_CAU_KHOANG, NHAN_XET_TOI_DA, bandTuSoCau, canNhomNguyenNhan, chuNutVang, criteriaPatchFrom,
  demNguocSuaDau, ngay, rawPatchFrom, soKyVong, thieuNhanXetMt, tieuChiNganCua, tuanLich, type NguoiChon,
} from '@shared/domain/index.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { useSession } from '../../lib/session.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useGiuFocus } from '../../ui/giuFocus.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { DauKetQua, MuiTenKyVong } from '../../ui/BieuTuong.tsx';
import { useBaoHopLyDoMo } from '../../ui/SaveState.tsx';
import { cungGvCham, gvChamPayload, gvChamThanhChon } from '../cham/GvCham.tsx';
import { ChonNhom } from './NhanXet.tsx';
import {
  bandBanDau, chanDau, coDiemChinhThuc, lockedByNoShow, lyDoChiDoc, suaDuoc, type Cell, type SaveOpts, type SavePatch,
} from './ScoreEntry.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';

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
  /** Thứ Hai của tuần lưới đang xem (null: nơi không theo tuần — hồ sơ MT, Điểm theo lớp theo lượt). */
  tuanXem?: string | null;
};

const laLR = (s: string) => s === 'listening' || s === 'reading';
/** "18/10 14:05" — ngày (như `ngay`) + giờ máy người xem. */
const lucNgan = (iso: string, homNay: string) => `${ngay(iso, homNay)} ${new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

/**
 * OV-11a (TE-2/TE-3): ô mở hộp ở chế độ VẮNG (dòng "Vắng lần n", không nút Vắng) khi dấu "-" đã chốt là của CHÍNH tuần thi (vắng chờ
 * Quản lý, huỷ phần thi), hoặc bài đã dời và đang xem ở lưới TUẦN GỐC. Ở tuần thi bù / nơi không theo tuần: ô thường.
 */
export const oVangCua = (c: Cell, tuanXem?: string | null) =>
  !!c.daChot && (!c.daChot.doiSang || (!!tuanXem && !!c.weekStart && c.weekStart !== tuanXem));

/**
 * CHỮ TRÊN Ô ĐIỂM (lưới, danh sách) — đọc được khi bỏ màu (CA3-2): ô đã chốt ghi CHỮ hai dòng theo mẫu ô Vắng; "-" chỉ còn là dấu chưa
 * chốt (Writing mới một task); ô chỉ đọc không có gì: một ký tự "—". `doc` = câu cho trình đọc màn hình.
 */
function hienO(c: Cell, vangGoc: boolean): { chu: ReactNode; doc: string; kieu: keyof typeof KIEU_O | null } {
  const hai = (a: string, b: string) => <><span>{a}</span><span className="text-[12px]">{b}</span></>;
  if (c.progress === 'cancelled') return { chu: t('Đã huỷ'), doc: t('Đã huỷ phần thi'), kieu: 'huy' };
  if (vangGoc && c.daChot?.doiSang) return { chu: hai(t('Vắng'), `→ ${c.daChot.doiSang}`), doc: t('Vắng, đã dời sang {doiSang}', { doiSang: c.daChot.doiSang }), kieu: 'vang' };
  if (c.daChot && !c.daChot.doiSang && c.sitStatus === 'absent') return { chu: hai(t('Vắng'), t('chờ QL')), doc: t('Vắng, chờ Quản lý xếp lại'), kieu: 'vang' };
  if (c.noShow?.state === 'khong-du-thi') return { chu: hai(t('Không'), t('dự thi')), doc: t('Không dự thi'), kieu: 'chot' };
  if (c.noShow) return { chu: '-', doc: c.noShow.text, kieu: null };
  /* OV-15b (mockup 2 · 6): band trước, số câu là dòng phụ dưới ô (`SoCau`). */
  if (c.rawScore !== null) {
    return { chu: c.band !== null ? fmtBand(c.band) : String(c.rawScore), doc: t('{rawScore} câu, band {fmtBand}', { rawScore: c.rawScore, fmtBand: fmtBand(c.band) }), kieu: null };
  }
  if (c.band !== null) return { chu: fmtBand(c.band), doc: `band ${fmtBand(c.band)}`, kieu: null };
  /* OV-15b (mục 1, ô "cần nhập"): khung rỗng — chữ "Nhập" chỉ còn cho trình đọc màn hình. */
  return { chu: null, doc: t('Nhập'), kieu: 'trong' };
}

/**
 * DÒNG NHỎ DƯỚI Ô: dấu "-" chưa chốt (DS02, Q17, C41) — còn cửa sổ sửa thì đếm ngược bằng chữ xám, câu đầy đủ ở tooltip; OV-11a: ô tuần
 * thi bù — "vắng lần 1". Xuống dòng, không cắt (CA3-2).
 */
function DongDau({ cell, thiBu = false }: { cell: Cell; thiBu?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  if (thiBu && cell.daChot) return <span className="block text-xs leading-tight text-slate-400">{t('vắng lần')}{' '}{Math.max(1, cell.daChot.lan)}</span>;
  if (cell.noShow?.state !== 'khong-co-bai' || cell.daChot) return null;
  const dem = demNguocSuaDau(cell.noShow.editableUntil ?? null, homNay);
  return (
    <span className="block text-xs leading-tight text-slate-400 max-sm:text-right" title={dich(cell.noShow.text)}>
      {dem ?? cell.noShow.text}
    </span>
  );
}

/**
 * KIỂU Ô theo mockup duyệt 11/10 (`.od.vang` · `.od.trong` · `.od.huy`): vắng tím chờ, trống "Nhập" viền đứt màu nhấn, huỷ viền chấm mờ.
 * Ô vắng hai dòng ("Vắng" / "→ W3 SEP") để vừa cột 104 px của lưới (bảng `table-layout: fixed`).
 */
const KIEU_O = {
  vang: 'flex-col !gap-0 leading-tight border-[color:rgb(var(--muted-line-rgb))] text-[color:rgb(var(--muted-rgb))]',
  trong: 'min-w-[3rem] min-h-[28px] justify-center border-dashed border-[color:var(--accent)]',
  huy: 'border-dotted text-slate-500',
  /* OV-11a (CA3-2): Không dự thi — hai dòng chữ như ô Vắng, màu trung tính (trạng thái cuối, không phải việc). */
  chot: 'flex-col !gap-0 leading-tight text-slate-400',
} as const;

/** OV-12b: chữ thiếu ngay dưới ô (nút giữ cỡ cũ — hàng lưới không cao thêm). */
function ChuThieu({ cell }: { cell: Cell }) {
  if (!cell.thieuNhanXet) return null;
  /* "thiếu nhận xét" vừa cột 104 px một dòng; "thiếu nhóm nguyên nhân" dài hơn → xuống dòng. */
  return (
    <span className={`block text-right text-xs font-semibold leading-tight text-soon ${cell.thieuNhanXet === 'chon-nhom' ? '' : 'whitespace-nowrap'}`}>
      {CHU_O_THIEU[cell.thieuNhanXet]}
    </span>
  );
}

/**
 * Ô ĐIỂM MT: nút mở hộp; ô không mở được là chữ (E5: không viền, không mờ) có câu "vì sao" ở tooltip.
 * `mo` do nơi gọi giữ (lưới / danh sách: một hộp một lúc, "em tiếp" chuyển sang dòng kế).
 */
/** Số câu đúng (L / R) — dòng phụ dưới band ở lưới (mockup 2: "7.0 ✓" / "30 câu"). */
function SoCau({ cell }: { cell: Cell }) {
  if (cell.rawScore === null || cell.band === null) return null;
  return <span className="block text-right text-[12px] leading-tight text-slate-500 tabular-nums">{t('{rawScore} câu', { rawScore: cell.rawScore })}</span>;
}

export function ODiemMt({ cell, lon = false, mo, onMo, chinh = false, dauKq = null, ...hop }: Omit<HopProps, 'anchor' | 'onDong'> & {
  lon?: boolean; mo: boolean; onMo: (mo: boolean) => void;
  /** OV-15b: ô kỹ năng chính (L · R · S) — band đậm; W1 / W2 là ô nhập thường. */
  chinh?: boolean;
  /** OV-15b (6b): ✓ / ✗ so kỳ vọng cạnh band — chỉ lưới có cột Kỳ vọng. */
  dauKq?: 'vuot' | 'bang' | 'duoi' | null;
}) {
  const [neo, setNeo] = useState<HTMLButtonElement | null>(null);
  const vangGoc = oVangCua(cell, hop.tuanXem);
  const h = hienO(cell, vangGoc);
  if (!suaDuoc(cell)) {
    const vang = cell.sitStatus === 'absent' && cell.band === null && !cell.daChot;
    const hai = h.kieu === 'chot' || h.kieu === 'vang';
    return (
      <span className="inline-flex flex-col items-end gap-0.5">
        <span className={`tabular-nums ${hai ? 'inline-flex flex-col items-end leading-tight' : 'inline-flex items-center gap-1'} ${vang || hai || cell.progress === 'cancelled' ? 'text-xs text-slate-500' : 'text-slate-300'} ${chinh && !h.kieu ? 'font-bold text-slate-100' : ''} ${lon ? 'text-base' : ''}`}
          title={cell.noShow?.text ?? lyDoChiDoc(cell)}>
          {/* OV-15b: ô của người khác chưa có điểm = trống (không "—"). */}
          {vang ? t('Vắng') : h.kieu === 'trong' ? <span className="sr-only">{t('Chưa có')}</span> : h.chu}
          {dauKq && cell.band !== null && <DauKetQua kq={dauKq} />}
        </span>
        <SoCau cell={cell} />
        <ChuThieu cell={cell} />
        <DongDau cell={cell} />
      </span>
    );
  }
  return (
    <span className="inline-flex max-w-full flex-col items-end gap-0.5">
      <button ref={setNeo} type="button" aria-expanded={mo} aria-haspopup="dialog"
        aria-label={`${skillLabel(cell.skill)} · ${hop.ctx.tenHv}: ${h.doc}${cell.thieuNhanXet ? `, ${CHU_O_THIEU[cell.thieuNhanXet]}` : ''}`}
        className={`btn max-w-full tabular-nums ${lon ? 'min-h-[44px] min-w-[60px] justify-center text-base font-semibold' : 'btn-sm'} ${h.kieu ? KIEU_O[h.kieu] : ''} ${chinh && !h.kieu ? 'font-bold text-[13px]' : ''} ${mo ? 'border-[color:var(--accent)]' : ''}`}
        title={cell.noShow?.text ?? t('{skillLabel} — bấm để nhập', { skillLabel: skillLabel(cell.skill) })}
        onClick={() => onMo(!mo)}>
        {h.chu}
        {dauKq && cell.band !== null && <DauKetQua kq={dauKq} />}
      </button>
      <SoCau cell={cell} />
      <ChuThieu cell={cell} />
      <DongDau cell={cell} thiBu={!!cell.daChot?.doiSang && !vangGoc} />
      {mo && neo && <HopNhapDiem cell={cell} anchor={neo} onDong={() => onMo(false)} {...hop} />}
    </span>
  );
}

export function HopNhapDiem({ cell, anchor, ctx, onSave, onDong, onTiep, gvMacDinh = null, tuanXem = null }: HopProps) {
  const { homNay } = useNgayNghiepVu();
  const { session } = useSession();
  const motO = laLR(cell.skill) || !!ctx.mt0;     // một ô: số câu (L/R) hoặc Band (MT0)
  const theoBand = !!ctx.mt0;
  const vang = oVangCua(cell, tuanXem);
  /* OV-11a (TE-2): tuần thi bù — ô thường, dấu "-" tuần gốc chỉ còn là dòng "vắng lần 1 · dời từ …" (+ Bỏ vắng). */
  const thiBu = !!cell.daChot?.doiSang && !vang;
  const nhapDuoc = cell.canEdit && !lockedByNoShow(cell);
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
  /* OV-4c: ô Band chỉ là ô nhập khi máy chủ cho nhập thẳng (`bandThang`: MT cũ); lượt thường Band tự tính — ô chỉ đọc, `bandText` luôn trống. */
  const [band0] = useState(() => (vang || motO || !cell.bandThang ? '' : bandBanDau(cell)));
  const [tho, setT] = useState(t0);
  const [vals, setVals] = useState(vals0);
  const [bandText, setBandText] = useState(band0);
  const [nx, setNx] = useState(cell.nhanXet ?? '');
  const nhom0 = cell.nhomNguyenNhan ?? [];
  const [nhom, setNhom] = useState<string[]>(nhom0);
  const nxRef = useRef<HTMLTextAreaElement>(null);
  const nhomRef = useRef<HTMLDivElement>(null);
  const gvCu = gvChamThanhChon(cell.gvCham);
  const gv0 = gvCu ?? gvMacDinh;
  const [gv, setGv] = useState<NguoiChon | null>(gv0);
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<{ cau: string; o: number | null } | null>(null);

  /* Lệnh điểm từ chữ đang gõ — cùng hàm với mọi nơi nhập. `o` = ô sai (0..3 tiêu chí / ô một, 4 = Band) để tô đỏ. */
  const diem = (() => {
    if (motO) {
      const doi = tho.trim() !== t0.trim();
      if (theoBand) {
        const s = tho.trim();
        if (s === '-') return { doi, patch: { noShow: true } as SavePatch, loi: null, o: null, preview: null };
        if (s === '') return { doi, patch: (chanDau(cell) ? { noShow: false } : { band: null }) as SavePatch, loi: null, o: null, preview: null };
        const r = criteriaPatchFrom(['', '', '', ''], cell, s, true);   // MT0: một ô Band, nhập thẳng
        return { doi, patch: r.patch as SavePatch | null, loi: r.loi, o: r.patch ? null : 0, preview: r.preview };
      }
      const p = rawPatchFrom(tho, cell) as SavePatch | null;
      if (!p) return { doi, patch: null, loi: LOI_SO_CAU, o: 0, preview: null };
      if (p.rawScore != null) {
        const b = bandTuSoCau(cell.skill as 'listening' | 'reading', p.rawScore);
        return b === null ? { doi, patch: null, loi: LOI_SO_CAU_KHOANG, o: 0, preview: null } : { doi, patch: p, loi: null, o: null, preview: b };
      }
      return { doi, patch: p, loi: null, o: null, preview: p.band ?? null };
    }
    const doi = vals.some((v, i) => v.trim() !== vals0[i].trim()) || bandText.trim() !== band0.trim();
    const r = criteriaPatchFrom(vals, cell, bandText, cell.bandThang);
    const sai = vals.findIndex((v) => { const s = v.trim(); return s !== '' && s !== '-' && !Number.isFinite(Number(s)); });
    return { doi, patch: r.patch as SavePatch | null, loi: r.loi, o: r.patch ? null : sai >= 0 ? sai : 4, preview: r.preview };
  })();
  /* Ô vắng: xoá trắng ô "Em có làm bài?" không phải lệnh gì — Bỏ vắng là nút riêng; gõ "-" ở đó báo ngay (không nuốt, không đóng hộp). */
  const doiDiem = diem.doi && !(vang && diem.patch && 'noShow' in diem.patch);
  const dauLai = vang && diem.doi && diem.patch?.noShow === true;
  const doiNx = nx.trim() !== (cell.nhanXet ?? '').trim();
  const doiGv = laS && !cungGvCham(gv, gv0, session?.user?.id);
  /* OV-12b: trạng thái SAU khi lưu (điểm đang gõ hoặc điểm cũ) — một luật với máy chủ (`thieuNhanXetMt`). */
  const kv = theoBand ? null : ctx.kyVong ?? cell.kyVong ?? null;
  const bandSau = doiDiem ? (diem.patch && !('noShow' in diem.patch) ? diem.preview : null) : cell.band;
  const coDiemSau = doiDiem ? bandSau !== null : coDiemChinhThuc(cell);
  const batBuoc = !!cell.batBuocNhanXet && !theoBand;
  const canNhom = batBuoc && coDiemSau && canNhomNguyenNhan(bandSau, kv);
  const doiNhom = canNhom && nhom.join() !== nhom0.join();
  const thieu = nhapDuoc ? thieuNhanXetMt({ batBuoc, coDiem: coDiemSau, band: bandSau, kyVong: kv, nhanXet: nx, nhom }) : null;
  const daGo = doiDiem || doiNx || doiGv || doiNhom || lyDo.trim() !== '';
  const hoiLyDo = coDiemChinhThuc(cell) && doiDiem && !!diem.patch && !('noShow' in diem.patch);
  const nhanVang = nhapDuoc && !vang && !coDiemChinhThuc(cell) && !chanDau(cell) && !doiDiem && !cell.khongVang;
  /* Hộp có chữ đã gõ chưa gửi = một ô chưa lưu (bảng điểm theo lượt chặn đổi lượt — như hộp lý do cũ). */
  useBaoHopLyDoMo(busy, daGo);

  const gui = async (lenh: SavePatch[], sau: () => void) => {
    if (busy) return;
    setBusy(true); setLoi(null);
    try {
      for (const l of lenh) if (!(await onSave(l, { nem: true }))) throw new Error(t('Không lưu được — thử lại.'));
    } catch (e: any) {
      setLoi({ cau: e?.message ?? t('Không lưu được — thử lại.'), o: null });
      setBusy(false);
      return;
    }
    setBusy(false);
    sau();
  };

  const luu = (tiep: boolean) => {
    if (dauLai) { setLoi({ cau: t('Đã ghi vắng — muốn gỡ thì bấm Bỏ vắng.'), o: 0 }); return; }
    /* Rà #410: ô không nhận "-" (lớp đã kết thúc — cờ máy chủ `khongVang`): báo tại hộp, không gửi. */
    if (cell.khongVang && doiDiem && diem.patch?.noShow === true) { setLoi({ cau: dich(cell.khongVang), o: 0 }); return; }
    if (doiDiem && !diem.patch) { setLoi({ cau: diem.loi ?? LOI_SO_CAU, o: diem.o }); return; }
    /* OV-12b: thiếu → không gửi; con trỏ tới đúng chỗ thiếu (nút Lưu đã tắt, đây là đường Enter / Ctrl+Enter). */
    if (thieu) {
      if (thieu === 'chon-nhom') nhomRef.current?.querySelector<HTMLElement>('button')?.focus();
      else nxRef.current?.focus();
      return;
    }
    const them: SavePatch = {};
    if (doiNx) them.nhanXet = nx.trim() || null;
    if (doiNhom) them.nhomNguyenNhan = nhom;
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

  /* CA3-8: đã gõ thì `KhungHop` hỏi ngay chân hộp ("Bỏ điểm Listening · {em}?" · Bỏ · Gõ tiếp) — không hộp trình duyệt. */
  const dong = () => { if (!busy) onDong(); };

  const phim = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    const laNx = (e.target as HTMLElement).tagName === 'TEXTAREA';
    if (laNx && !(e.ctrlKey || e.metaKey)) return;          // ô nhận xét: Enter xuống dòng, Ctrl+Enter lưu
    if ((e.target as HTMLElement).closest('[data-chon-nguoi]')) return;
    if ((e.target as HTMLElement).closest('[data-chip-nhom]')) return;   // chip nhóm: Enter bấm chính chip
    e.preventDefault();
    luu(!vang);
  };

  const oSo = (extra: string) => `field text-center tabular-nums ${extra}`;
  /* Ô sai: viền + vòng đỏ, kể cả khi đang focus (vòng focus nhấn của `.field` không che màu lỗi). */
  const stSai = (sai: boolean) => (sai ? { borderColor: 'rgb(var(--bad-rgb))', boxShadow: '0 0 0 3px rgb(var(--bad-rgb) / 0.25)' } : undefined);
  const tuan = cell.weekStart ? tuanLich(cell.weekStart, homNay) : null;
  const kvHien = !vang ? kv : null;   // OV-12b: "Kỳ vọng MT{n}" ở cả W1 / W2 / S
  const nTask = cell.skill === 'writing1' ? 1 : 2;
  const coTieuChi = vals.some((v) => v.trim() !== '');

  /* OV-14c: S đã có điểm của NGƯỜI KHÁC — nói ai / lúc nào trước khi ghi đè (hai GV cùng chấm chéo một em). */
  const nguoiKhac = laS && coDiemChinhThuc(cell) && !!cell.enteredByName && cell.enteredById != null && cell.enteredById !== session?.user?.id;
  const than = (
    <>
      {nguoiKhac && (
        <div role="note" className="rounded-lg border border-muted-line bg-muted-bg px-3 py-2 text-[13px] text-slate-200">
          {t('Đã chấm bởi {ten} lúc {luc}', { ten: cell.enteredByName!, luc: cell.enteredAt ? lucNgan(cell.enteredAt, homNay) : '—' })}
        </div>
      )}
      {vang && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-muted-line bg-muted-bg px-3 py-2.5 text-[13px] text-slate-200">
          {/* CA3-3: ô huỷ một trạng thái — "Đã huỷ phần thi · vắng 2 lần", không "Vắng lần 1". */}
          {cell.progress === 'cancelled'
            ? <span><b className="text-muted">{t('Đã huỷ phần thi')}</b>{' '}{t('· vắng')}{' '}{Math.max(2, cell.daChot!.lan)}{' '}{t('lần')}</span>
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
              onClick={() => void gui([{ noShow: false }], onDong)}>{t('Bỏ vắng')}</button>
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
          <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_4rem] items-end gap-1.5">
            {tc.map((n) => <span key={n} className="text-center text-xs font-semibold text-slate-400">{n}</span>)}
            <span className="text-center text-xs font-semibold text-slate-400">Band</span>
            {tc.map((n, i) => (
              <input key={n} className={oSo('w-full px-1 max-sm:h-11 max-sm:text-base')} style={stSai(loi?.o === i)} inputMode="decimal"
                value={vals[i] ?? ''} aria-label={`${skillLabel(cell.skill)} — ${n}`} aria-invalid={loi?.o === i || undefined} disabled={busy}
                onChange={(e) => { setVals((v) => v.map((x, j) => (j === i ? e.target.value : x))); setLoi(null); }} />
            ))}
            {coTieuChi || !cell.bandThang ? (
              <output className="inline-flex items-center justify-center gap-1 self-center text-base font-bold tabular-nums text-slate-100" aria-label={`${skillLabel(cell.skill)} — band`}>
                {diem.patch && 'noShow' in diem.patch ? '-' : fmtBand(coTieuChi ? diem.preview : cell.band)}<MuiTenKyVong kq={soKyVong(bandSau, kvHien)} />
              </output>
            ) : (
              <input className={oSo('w-full px-1 max-sm:h-11 max-sm:text-base')} style={stSai(loi?.o === 4)} inputMode="decimal" value={bandText}
                aria-label={`${skillLabel(cell.skill)} — band`} aria-invalid={loi?.o === 4 || undefined} disabled={busy}
                onChange={(e) => { setBandText(e.target.value); setLoi(null); }} />
            )}
          </div>
          {!vang && <DongKyVong luot={ctx.luot} kv={kvHien} />}
          {laW && !vang && (
            <div className="mt-1.5 text-xs text-slate-500">
              {ctx.bandTaskKia == null ? t('Task {x} chưa có · ', { x: 3 - nTask }) : ''}{t('Writing = (Task 1 + Task 2 × 2) / 3 khi đủ hai task')}
            </div>
          )}
        </div>
      ))}
      {laS && !vang && nhapDuoc && (
        <div className="flex items-center gap-2" data-chon-nguoi>
          <span className="shrink-0 text-xs font-medium text-slate-300">{t('Người chấm')}</span>
          <div className="min-w-0 flex-1">
            <ChonNguoi value={gv} onChange={setGv} nhom="nhan_vien" choNgoai macDinhTrong={t('Chưa chọn')} ariaLabel={t('Người chấm Speaking')} disabled={busy} />
          </div>
        </div>
      )}
      {(!vang || (batBuoc && coDiemSau)) && nhapDuoc && (
        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-slate-300">
            <span>{laW ? t('Nhận xét Task {nTask}', { nTask }) : t('Nhận xét')}{batBuoc && <span aria-hidden className="text-bad"> *</span>}</span>
            {nx.length > 800 && <span className={`tabular-nums ${nx.length >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{nx.length}/{NHAN_XET_TOI_DA}</span>}
          </span>
          <textarea ref={nxRef} className="field w-full text-sm" rows={2} maxLength={NHAN_XET_TOI_DA} value={nx} disabled={busy}
            aria-required={batBuoc && coDiemSau ? true : undefined} onChange={(e) => setNx(e.target.value)} />
        </label>
      )}
      {/* OV-13k: nhận xét riêng của GV phụ trách Speaking lớp — chỉ đọc ở hộp chấm (GV phụ trách ghi ở hồ sơ MT). */}
      {laS && cell.nhanXetPhuTrach && (
        <div className="text-[13px]">
          <span className="block text-xs font-medium text-slate-300">{t('Nhận xét GV phụ trách')}{cell.nhanXetPhuTrach.ten ? ` · ${cell.nhanXetPhuTrach.ten}` : ''}</span>
          <p className="m-0 mt-1 whitespace-pre-wrap break-words text-slate-200">{cell.nhanXetPhuTrach.chu}</p>
        </div>
      )}
      {canNhom && nhapDuoc && (
        <div ref={nhomRef}>
          <span id="hop-nhom-nn" className="mb-1.5 block text-xs font-medium text-slate-300">{t('Nhóm nguyên nhân')}<span aria-hidden className="text-bad"> *</span></span>
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
        <div role="alert" className="rounded-lg border border-bad-line bg-bad-bg px-3 py-2.5 text-[13px] text-slate-200">
          <b className="text-bad">{t('Chưa lưu:')}</b> {loi.cau}
        </div>
      )}
    </>
  );

  const nut = 'btn btn-sm max-sm:min-h-[44px]';
  const chan = vang ? (
    <>
      {cell.daChot!.goDuoc && (
        <button type="button" className={nut} disabled={busy} onClick={() => void gui([{ noShow: false }], onDong)}>{t('Bỏ vắng')}</button>
      )}
      <LyDoThieu thieu={thieu} />
      {nhapDuoc && <button type="button" className={`${nut} btn-primary`} disabled={busy || !!thieu} onClick={() => luu(false)}>{busy ? t('Đang lưu…') : t('Lưu điểm')}</button>}
    </>
  ) : (
    <>
      {nhanVang && (
        /* CA3-1: sau tuần thi / MT cũ nút nói đúng hậu quả — "Không dự thi" (không dời). */
        <button type="button" className={`${nut} btn-ghost`} disabled={busy} onClick={() => void gui([{ noShow: true }], onTiep ?? onDong)}>
          {chuNutVang({ weekStart: cell.weekStart, lichSu: cell.progress === 'lich_su', homNay })}
        </button>
      )}
      <LyDoThieu thieu={thieu} />
      <button type="button" className={onTiep ? nut : `${nut} btn-primary`} disabled={busy || !!thieu} onClick={() => luu(false)}>{busy && !onTiep ? t('Đang lưu…') : t('Lưu')}</button>
      {onTiep && <button type="button" className={`${nut} btn-primary`} disabled={busy || !!thieu} onClick={() => luu(true)}>{busy ? t('Đang lưu…') : t('Lưu · em tiếp ›')}</button>}
    </>
  );

  const ten = `${skillLabel(cell.skill)} · ${ctx.luot}`;
  return (
    <KhungHop anchor={anchor} ten={ten} phu={<>{[ctx.tenHv, ctx.lop].filter(Boolean).join(' · ')}{tuan && <> · <span className="tabular-nums">{tuan}</span></>}</>}
      nhanHop={`${ten} · ${ctx.tenHv}`} daGo={daGo} cauBo={t('Bỏ điểm {skillLabel} · {tenHv}?', { skillLabel: skillLabel(cell.skill), tenHv: ctx.tenHv })} onDong={dong} onKeyDown={phim} chan={chan}>
      {than}
    </KhungHop>
  );
}

/** OV-12b · OV-15a: "Kỳ vọng MT2 5.5" một lần — mọi kỹ năng (MT0 không kỳ vọng); trên / dưới là mũi tên cạnh band, không chữ "dưới 1.0". */
function DongKyVong({ luot, kv }: { luot: string; kv: number | null }) {
  if (kv === null) return null;
  return <div className="mt-1.5 text-xs tabular-nums text-slate-500">{t('Kỳ vọng {dot}', { dot: luot })}{' '}{fmtBand(kv)}</div>;
}

/** OV-12b: lý do nút Lưu tắt — một dòng ngay trước nút (375: dòng riêng phía trên). Chỗ trống đẩy nút sang phải khi đủ. */
function LyDoThieu({ thieu }: { thieu: ReturnType<typeof thieuNhanXetMt> }) {
  return (
    <>
      <span role="status" className={`min-w-0 flex-1 text-right text-xs text-slate-400 ${thieu ? 'max-sm:basis-full' : ''}`}>
        {thieu ? CAU_THIEU_NHAN_XET[thieu] : ''}
      </span>
      {thieu && <span aria-hidden className="flex-1 sm:hidden" />}
    </>
  );
}

/**
 * KHUNG HỘP NHỎ NEO Ô (đầu · thân · chân) — dùng chung cho hộp nhập điểm MT và hộp nhận xét lớp thường. Neo dưới ô, kẹp trong màn,
 * hết chỗ thì lật lên (như `HopKyNang`); < 640 px → tấm trượt từ dưới. Mở: con trỏ vào ô nhập đầu; Tab vòng trong hộp; đóng trả focus
 * về ô. Esc / bấm ra ngoài → `onDong` (bấm ra ngoài khi đã gõ thì giữ hộp — không mất chữ). Esc khi đã gõ (CA3-8): chân hộp thành câu
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
  const goTiep = () => {
    setHoi(false);
    box.current?.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled])')?.focus();
  };
  useGiuFocus(box);
  const dienThoai = typeof window !== 'undefined' && window.innerWidth < 640;
  /* Hotfix 19/10: vị trí ghi thẳng vào style, KHÔNG qua state — setState trong layout effect chạy mỗi lần vẽ, gặp setPos của sự kiện cuộn
     đang chờ (ưu tiên thấp hơn) thì React tính lại từ state gốc mãi → "Maximum update depth" → trang lỗi khi gõ ô L/R. */
  const dat = () => {
    if (dienThoai || !box.current) return;
    const r = anchor.getBoundingClientRect();
    const rong = box.current.offsetWidth, cao = box.current.offsetHeight;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - rong - 8);
    const top = r.bottom + 4 + cao > window.innerHeight - 8 ? Math.max(8, r.top - cao - 4) : r.bottom + 4;
    box.current.style.top = `${top}px`;
    box.current.style.left = `${left}px`;
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
          ? 'fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl'
          : 'fixed w-[min(400px,calc(100vw-32px))] rounded-xl shadow-2xl'}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)' }}>
        {dienThoai && <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />}
        <div className="border-b px-3.5 pb-2 pt-3" style={{ borderColor: 'var(--line)' }}>
          <div className="text-[15px] font-extrabold text-slate-100">{ten}</div>
          <div className="mt-0.5 truncate text-xs text-slate-400" title={nhanHop}>{phu}</div>
        </div>
        <div className="flex flex-col gap-3 px-3.5 py-3">{children}</div>
        <div className="flex flex-wrap items-center gap-2 border-t px-3.5 py-2.5" style={{ borderColor: 'var(--line)' }}>
          {hoi ? (
            <>
              <span role="alert" className="min-w-0 flex-1 text-[13px] text-slate-200">{cauBo}</span>
              <button type="button" className="btn btn-sm btn-danger max-sm:min-h-[44px]" onClick={onDong}>{t('Bỏ')}</button>
              <button ref={goTiepRef} type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={goTiep}>{t('Gõ tiếp')}</button>
            </>
          ) : chan}
        </div>
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
        aria-label={t('Nhận xét · {tenMon} · {phu}', { tenMon, phu })}
        className={`btn btn-sm btn-ghost shrink-0 px-1.5 text-xs ${lon ? 'min-h-[44px]' : ''} ${giaTri ? 'text-[color:var(--accent-strong)]' : 'text-slate-400'}`}
        onClick={() => setMo((m) => !m)}>{t('Nhận xét')}</button>
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
      chan={<><span className="flex-1" /><button type="button" className="btn btn-sm btn-primary max-sm:min-h-[44px]" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button></>}>
      <label className="block">
        <span className="sr-only">{t('Nhận xét')}</span>
        <textarea className="field w-full text-sm" rows={3} maxLength={NHAN_XET_TOI_DA} value={nx} disabled={busy} onChange={(e) => setNx(e.target.value)} />
      </label>
      {nx.length > 800 && <span className={`self-end text-xs tabular-nums ${nx.length >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{nx.length}/{NHAN_XET_TOI_DA}</span>}
      {loi && (
        <div role="alert" className="rounded-lg border border-bad-line bg-bad-bg px-3 py-2.5 text-[13px] text-slate-200">
          <b className="text-bad">{t('Chưa lưu:')}</b> {loi}
        </div>
      )}
    </KhungHop>
  );
}
