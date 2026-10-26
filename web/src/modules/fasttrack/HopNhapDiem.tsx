/**
 * HỘP NHẬP ĐIỂM MT (OV-4b, mockup overhaul-1 §3) — MỘT hộp cho MỌI chỗ nhập điểm Mock, gồm MT0: lưới lớp (Điểm theo lớp, hồ sơ lớp,
 * Lịch Test nhúng, `/nhap-diem`), màn điện thoại một kỹ năng, hồ sơ lượt MT, Lộ trình. Thay khung 4 tiêu chí trượt phải, khung sửa dưới
 * dải ô lớn và ô gõ thẳng L/R.
 *
 *   ODiemMt      Ô điểm là NÚT: L/R "4.5" + dòng "14 câu", W/S "5.0", ô trống = khung rỗng (OV-15b), ô vắng "Vắng → W3 OCT". Bấm → hộp neo ngay ô.
 *   HopNhapDiem  Đầu "Reading · MT2" / "{em} · {lớp} · {W2 OCT}"; con trỏ đứng sẵn ở ô điểm; chân Vắng · Lưu · Lưu · bài tiếp ›.
 *                R1-LUU-TIEP (V12 26/10): "Lưu" ở lại ("✓ Đã lưu" · Bài tiếp ›); "Lưu · bài tiếp ›" (Enter) sang bài còn thiếu kế; hết →
 *                "Đã xong phần của bạn" + Lớp tiếp / Việc tiếp / Đóng. Esc đóng. < 640 px: tấm trượt từ dưới.
 *
 * Luật dùng lại, không luật thứ hai: `rawPatchFrom` / `criteriaPatchFrom` dựng lệnh ("-" = Vắng; Band nhập thẳng chỉ MT cũ / MT0 — OV-4c), lưu qua
 * `useSaveScore` với `nem` — lỗi máy chủ hiện TRONG hộp, chữ đã gõ giữ nguyên; chỉ sang bài kế khi máy chủ đã trả về.
 * Sửa ô đã có điểm: thêm ô "Lý do sửa (tuỳ chọn)" (RB-5, T7 — như `SuaDiemCoLyDo`). Ô đang Vắng (`daChot`): "Vắng lần n · đã dời
 * sang …", Bỏ vắng (quyền OV-1b do máy chủ tính: `goDuoc`), Lưu điểm.
 * OV-11a: ô đã dời vì vắng chỉ là ô Vắng ở lưới TUẦN GỐC (`tuanXem` ≠ tuần thi); ở tuần thi bù là ô thường + dòng "vắng lần 1 · dời từ …"
 * (nút Vắng = lần 2). LUAT-34: nút luôn ghi "Vắng" (máy chủ quyết dời / thẻ / huỷ — `chuyenVang`); ô trống có điểm đã huỷ còn cất → "Khôi phục điểm".
 * Đóng khi đã gõ: hỏi ngay chân hộp (Bỏ · Gõ tiếp).
 * OV-12b → LUAT-NX-MT (chủ SP 22/10): MT (không MT0 / MT cũ) — "Nhận xét" NÊN có khi ô có điểm (≥ 10 ký tự); band dưới kỳ vọng → hàng chip
 * "Nhóm nguyên nhân" (số thứ tự, 1 = chính); thiếu → chỉ một dòng nhắc vàng trên nút, Lưu vẫn bấm được. "Kỳ vọng MT{n}" ở mọi kỹ năng.
 * Ô có điểm mà thiếu: chữ nhắc vàng "nên có nhận xét" / "nên chọn nguyên nhân" dưới số (không vẽ ✓ "đủ" — trùng dấu "đã lưu" của ô).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  CAU_THIEU_NHAN_XET, CHU_O_THIEU, CHU_THAO_TAC, LOI_SO_CAU, LOI_SO_CAU_KHOANG, NHAN_XET_TOI_DA, bandTuSoCau, canNhomNguyenNhan, criteriaPatchFrom, kiemTieuChi,
  chuDoiVang, demNguocSuaDau, lyDoHuy, ngay, rawPatchFrom, soKyVong, thieuNhanXetMt, tieuChiNganCua, tuanLich, type NguoiChon,
} from '@shared/domain/index.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { useSession } from '../../lib/session.tsx';
import { useApi } from '../../lib/useApi.ts';
import { DongThoiGianLuot } from './DongThoiGianLuot.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useGiuFocus } from '../../ui/giuFocus.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { DauKetQua, MuiTenKyVong, lopKq } from '../../ui/BieuTuong.tsx';
import { useBaoHopLyDoMo } from '../../ui/SaveState.tsx';
import { cungGvCham, gvChamPayload, gvChamThanhChon } from '../cham/GvCham.tsx';
import { ChonNhom, viDuNhanXet } from './NhanXet.tsx';
import {
  bandBanDau, chanDau, coDiemChinhThuc, lockedByNoShow, lyDoChiDoc, suaDuoc, type Cell, type SaveOpts, type SavePatch,
} from './ScoreEntry.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { useBamNgoai } from '../../ui/useBamNgoai.ts';
import { ChuDich, type NguonDich } from '../../ui/ChuDich.tsx';

/** Ngữ cảnh đầu hộp + dòng phụ: em · lớp · lượt ("MT2" / "MT0"), kỳ vọng (L/R), MT0 = một ô Band. */
export type NguCanhHop = {
  tenHv: string; lop: string | null; luot: string; kyVong?: number | null; mt0?: boolean;
  /** Band của task Writing còn lại (ô W1 ↔ W2) — dòng "Task 2 chưa có". */
  bandTaskKia?: number | null;
  /** UI-LICH-TUAN: lượt của ô — có thì ô đã có điểm hiện "Lịch sử" (ai nhập / sửa, lúc nào) ngay trong hộp. */
  attemptId?: number;
};

/**
 * LỊCH SỬ MỘT Ô ngay trong hộp (UI-LICH-TUAN, dieu-chinh-cuoi khu a: "R · MT3 · 14/09 10:12 Cô Hà · 5.0 → 5.5"): bấm mới tải `GET /attempts/:id`,
 * chỉ dòng của đúng kỹ năng — cùng dòng thời gian với hồ sơ MT (`DongThoiGianLuot`), không panel mới.
 */
function LichSuO({ attemptId, skill }: { attemptId: number; skill: string }) {
  const [mo, setMo] = useState(false);
  const { data, error } = useApi<{ scoreHistory: any[] }>(mo ? `/attempts/${attemptId}` : null);
  return (
    <div className="text-[13px]">
      <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px]" aria-expanded={mo} onClick={() => setMo((v) => !v)}>
        {mo ? t('Ẩn lịch sử') : t('Lịch sử')}
      </button>
      {mo && (error ? <p className="m-0 mt-1 text-bad">{error.message}</p>
        : !data ? <p className="m-0 mt-1 text-slate-500">{t('Đang tải…')}</p>
          : <div className="mt-1"><DongThoiGianLuot history={[]} scoreHistory={data.scoreHistory.filter((h) => h.skill === skill)} gioiHan={5} /></div>)}
    </div>
  );
}

/** Đầu hộp của trang một lượt (hồ sơ MT, Lộ trình — `GET /attempts/:id`): em · lớp · MT{n}; MT0 một ô Band. */
export const nguCanhChiTiet = (d: { student: { name: string }; classCode: string | null; kind: string; attemptNo: number; result?: any }) => ({
  tenHv: d.student.name, lop: d.classCode, luot: d.kind === 'mt0' ? 'MT0' : `MT${d.attemptNo}`,
  kyVong: d.result?.expectation ?? null, mt0: d.kind === 'mt0',
});

/** R1-LUU-TIEP: hết phần của người xem — thân hộp "Đã xong phần của bạn · {phamVi}: đã lưu n bài" + nút của nơi gọi (Lớp tiếp / Việc tiếp / Em tiếp) hoặc Đóng. */
export type KetThucHop = { phamVi: string; daLuu: number; nut: { nhan: string; onClick: () => void } | null };

type HopProps = {
  cell: Cell; anchor: HTMLElement; ctx: NguCanhHop;
  /** `'trung'` = lệnh cùng ô đang chạy (`useSaveScore` › `inflight`) — không phải lỗi. */
  onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean | 'trung'>;
  onDong: () => void;
  /**
   * R1-LUU-TIEP (V12 bản 26/10): có bài kế → nút "Lưu · bài tiếp ›" + Enter; nơi gọi chọn bài còn thiếu kế (`baiKeTiep`) hoặc báo hết (`ketThuc`).
   * `daLuu` = hộp này vừa ghi (nơi gọi đếm "đã lưu n bài"). Không có → chỉ "Lưu".
   */
  onTiep?: (daLuu: boolean) => void;
  /** Đích tiếp ("Reading · Minh Anh"; cùng kỹ năng chỉ tên) — dòng "Tiếp: …" ở chân hộp. */
  nhanTiep?: string | null;
  /** Đích tiếp là em khác (trang một em hết bài của lượt) → "Lưu · em tiếp ›" / "Em tiếp ›". */
  tiepEm?: boolean;
  ketThuc?: KetThucHop | null;
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
/** Lý do "Đã huỷ" của ô (Rulebook §21.4 T5) — chỉ ô huỷ do "-" (có `daChot`): lần ≥ 2 = vắng 2 lần, còn lại Quản lý từ chối / không duyệt dời. */
const lyDoHuyO = (c: Cell) => (c.daChot ? lyDoHuy({ huyVang: c.daChot.lan >= 2, sit: c.sitStatus }) : null);

export const oVangCua = (c: Cell, tuanXem?: string | null) =>
  !!c.daChot && (!c.daChot.doiSang || (!!tuanXem && !!c.weekStart && c.weekStart !== tuanXem));

/**
 * CHỮ TRÊN Ô ĐIỂM (lưới, danh sách) — đọc được khi bỏ màu (CA3-2): ô đã chốt ghi CHỮ hai dòng theo mẫu ô Vắng; "-" chỉ còn là dấu chưa
 * chốt (Writing mới một task); ô chỉ đọc không có gì: một ký tự "—". `doc` = câu cho trình đọc màn hình.
 */
function hienO(c: Cell, vangGoc: boolean): { chu: ReactNode; phu?: string; doc: string; kieu: keyof typeof KIEU_O | null } {
  /* BANG-1: chữ thứ hai thành dòng phụ dưới ô (ô giữ 32 px, hàng 64). */
  const hai = (a: string, b: string) => ({ chu: a, phu: b });
  if (c.progress === 'cancelled') {
    const ly = lyDoHuyO(c);   // Rulebook §21.4 T5: "Đã huỷ" kèm lý do
    return { ...(ly ? hai(t('Đã huỷ'), ly) : { chu: t('Đã huỷ') }), doc: ly ? `${t('Đã huỷ')} · ${ly}` : t('Đã huỷ'), kieu: 'huy' };
  }
  if (vangGoc && c.daChot?.doiSang) return { ...hai(t('Vắng'), `→ ${c.daChot.doiSang}`), doc: t('Vắng, đã dời sang {doiSang}', { doiSang: c.daChot.doiSang }), kieu: 'vang' };
  if (c.daChot && !c.daChot.doiSang && c.sitStatus === 'absent') return { ...hai(t('Vắng'), t('chờ QL')), doc: t('Vắng, chờ Quản lý xếp lại'), kieu: 'vang' };
  if (c.noShow?.state === 'khong-du-thi') return { ...hai(t('Vắng'), t('không dời')), doc: t('Vắng'), kieu: 'chot' };
  /* LUAT-34: "-" ở MT cũ = Đã huỷ ngay (cả "Không dự thi" cũ ở MT cũ) — bấm ô gỡ "-" / nhập điểm như ô "-" khác. */
  if (c.noShow?.state === 'da-huy') return { ...hai(t('Đã huỷ'), lyDoHuy({ mtCu: true })!), doc: c.noShow.text, kieu: 'chot' };
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
 * thi bù — "vắng W3 SEP" (tuần cũ). Xuống dòng, không cắt (CA3-2).
 */
function DongDau({ cell, thiBu = false }: { cell: Cell; thiBu?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  /* LUAT-NX-MT: ô tuần thi bù — "vắng W3 SEP" (tuần cũ, `chuDoiVang` chung mọi ô điểm); lần vắng ở tooltip. */
  if (thiBu && cell.daChot) {
    return <span className="block text-xs leading-4 text-slate-400" data-phu-odiem="" title={`${t('vắng lần')} ${Math.max(1, cell.daChot.lan)}`}>{chuDoiVang(cell.daChot.tuTuan, homNay)}</span>;
  }
  if (cell.noShow?.state !== 'khong-co-bai' || cell.daChot) return null;
  const dem = demNguocSuaDau(cell.noShow.editableUntil ?? null, homNay);
  return (
    <span className="block text-xs leading-4 text-slate-400 max-sm:text-right" data-phu-odiem="" title={dich(cell.noShow.text)}>
      {dem ?? cell.noShow.text}
    </span>
  );
}

/**
 * KIỂU Ô theo mockup duyệt 11/10 (`.od.vang` · `.od.trong` · `.od.huy`): vắng tím chờ, trống "Nhập" viền đứt màu nhấn, huỷ viền chấm mờ.
 * Ô vắng hai dòng ("Vắng" / "→ W3 SEP") để vừa cột 104 px của lưới (bảng `table-layout: fixed`).
 */
const KIEU_O = {
  vang: 'border-[color:rgb(var(--muted-line-rgb))] text-[13px] text-[color:rgb(var(--muted-rgb))]',
  trong: 'border-dashed border-[color:var(--accent)]',
  huy: 'border-dotted text-slate-500',
  /* OV-11a (CA3-2): Không dự thi — hai dòng chữ như ô Vắng, màu trung tính (trạng thái cuối, không phải việc). */
  chot: 'text-[13px] text-slate-400',
} as const;

/** UI-CON-LAI (chủ SP 24/10): MT nên có nhận xét mà còn thiếu → viền ô vàng, KHÔNG chữ dưới điểm; câu nhắc ở tooltip + tên đọc màn, chi tiết trong hộp. */
export const VIEN_THIEU_NX = '!border-[color:rgb(var(--soon-rgb))]';

/**
 * Ô ĐIỂM MT: nút mở hộp; ô không mở được là chữ (E5: không viền, không mờ) có câu "vì sao" ở tooltip.
 * `mo` do nơi gọi giữ (lưới / danh sách: một hộp một lúc, "em tiếp" chuyển sang dòng kế).
 */
/** Số câu đúng (L / R) — dòng phụ dưới band ở lưới (mockup 2: "7.0 ✓" / "30 câu"). */
function SoCau({ cell }: { cell: Cell }) {
  if (cell.rawScore === null || cell.band === null) return null;
  return <span className="block text-[12px] leading-4 text-slate-500 tabular-nums" data-phu-odiem="">{t('{rawScore} câu', { rawScore: cell.rawScore })}</span>;
}

export function ODiemMt({ cell, lon = false, mo, onMo, dauKq = null, ...hop }: Omit<HopProps, 'anchor' | 'onDong'> & {
  lon?: boolean; mo: boolean; onMo: (mo: boolean) => void;
  /** Giữ cho nơi gọi cũ — BANG-1: mọi ô kỹ năng cùng một dáng (số 15 / 700). */
  chinh?: boolean;
  /** ✓ / ✗ so kỳ vọng ĐỨNG TRƯỚC band — chỉ lưới có cột Kỳ vọng (04 mục 7: W1 / W2 cũng có). */
  dauKq?: 'vuot' | 'bang' | 'duoi' | null;
}) {
  const [neo, setNeo] = useState<HTMLButtonElement | null>(null);
  const vangGoc = oVangCua(cell, hop.tuanXem);
  const h = hienO(cell, vangGoc);
  const kq = dauKq && cell.band !== null && !h.kieu ? dauKq : null;
  /* BANG-0 (`ODiem`): chỗ ký hiệu giữ khi ô có số mà không ký hiệu (số thẳng cột). */
  const kyHieu = cell.band !== null && !h.kieu ? <span className="inline-block w-[14px] shrink-0 text-center" aria-hidden>{kq && <DauKetQua kq={kq} />}</span> : null;
  const so = <span className={`${h.kieu ? '' : `text-[15px] font-bold ${lopKq(kq)}`}`}>{h.chu}</span>;
  /* MỘT dòng phụ (04 mục 7): vắng lần n / đếm ngược "-" > chữ thứ hai của ô > n câu (thiếu nhận xét = viền vàng, không chữ). */
  const thiBu = !!cell.daChot?.doiSang && !vangGoc;
  const coDongDau = (thiBu && !!cell.daChot) || (cell.noShow?.state === 'khong-co-bai' && !cell.daChot);
  const phu = coDongDau ? <DongDau cell={cell} thiBu={thiBu} />
    /* NEN-SUA (nợ #544): ô đã có điểm ở tuần thi bù giữ "vắng W3 SEP" (thay "n câu"). */
    : cell.doiTu ? <span className="block text-xs leading-4 text-slate-400" data-phu-odiem="">{chuDoiVang(cell.doiTu)}</span>
    : h.phu ? <span className="block text-xs leading-4 text-slate-400" data-phu-odiem="">{h.phu}</span>
    : <SoCau cell={cell} />;
  if (!suaDuoc(cell)) {
    const vang = cell.sitStatus === 'absent' && cell.band === null && !cell.daChot;
    return (
      <span className="inline-flex flex-col items-center">
        <span className={`inline-flex items-baseline gap-1 tabular-nums ${vang || h.kieu ? 'text-xs text-slate-500' : ''} ${lon ? 'text-base' : ''}`}
          title={cell.noShow?.text ?? lyDoChiDoc(cell)}>
          {/* OV-15b: ô của người khác chưa có điểm = trống (không "—"). */}
          {vang ? t('Vắng') : h.kieu === 'trong' ? <span className="sr-only">{t('Chưa có')}</span> : <>{kyHieu}{so}</>}
        </span>
        {phu}
      </span>
    );
  }
  return (
    <span className="inline-flex max-w-full flex-col items-center">
      <button ref={setNeo} type="button" aria-expanded={mo} aria-haspopup="dialog"
        aria-label={`${skillLabel(cell.skill)} · ${hop.ctx.tenHv}: ${h.doc}${cell.thieuNhanXet ? `, ${CHU_O_THIEU[cell.thieuNhanXet]}` : ''}`}
        className={`o-sua inline-flex max-w-full items-center justify-center gap-1 tabular-nums ${lon ? 'min-h-[44px] min-w-[60px] text-base font-semibold' : 'h-8 min-w-16 px-1.5'} ${h.kieu ? KIEU_O[h.kieu] : ''} ${mo ? '!border-[color:var(--accent)]' : cell.thieuNhanXet ? VIEN_THIEU_NX : ''}`}
        title={cell.noShow?.text ?? (cell.thieuNhanXet ? CHU_O_THIEU[cell.thieuNhanXet] : t('{skillLabel} — bấm để nhập', { skillLabel: skillLabel(cell.skill) }))}
        onClick={() => onMo(!mo)}>
        {kyHieu}{h.kieu === 'trong' ? <span className="text-transparent" aria-hidden>0</span> : so}
      </button>
      {phu}
      {mo && neo && <HopNhapDiem cell={cell} anchor={neo} onDong={() => onMo(false)} {...hop} />}
    </span>
  );
}

export function HopNhapDiem({ cell, anchor, ctx, onSave, onDong, onTiep, nhanTiep = null, tiepEm = false, ketThuc = null, gvMacDinh = null, tuanXem = null }: HopProps) {
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
  const gvCu = gvChamThanhChon(cell.gvCham);
  const gv0 = gvCu ?? gvMacDinh;
  const [gv, setGv] = useState<NguoiChon | null>(gv0);
  const [lyDo, setLyDo] = useState('');
  /* "Đang lưu…" chỉ ở nút đã bấm; khoá chống bấm đôi là ref (state chưa kịp vẽ lại khi Enter lặp). */
  const [dangLuu, setDangLuu] = useState<null | 'luu' | 'tiep' | 'khac'>(null);
  const busy = dangLuu !== null;
  const dangGui = useRef(false);
  const [loi, setLoi] = useState<{ cau: string; o: number | null } | null>(null);
  /* V12: "Lưu" ở lại — ảnh chữ lúc lưu xong; chữ còn y nguyên = "✓ Đã lưu" (gõ tiếp là chưa lưu). */
  const [luuAnh, setLuuAnh] = useState<string | null>(null);
  const loiRef = useRef<HTMLDivElement>(null);
  const nutHetRef = useRef<HTMLButtonElement>(null);

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
    const sai = vals.findIndex((v) => { const s = v.trim(); return s !== '' && s !== '-' && kiemTieuChi(Number(s)) !== null; });
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
  const nenCo = !!cell.nenCoNhanXet && !theoBand;
  const canNhom = !!cell.coNhom && !theoBand && coDiemSau && canNhomNguyenNhan(bandSau, kv);   // SV-NX-CASE: chip ở mọi MT, nhắc chỉ MT mới nhất
  const doiNhom = canNhom && nhom.join() !== nhom0.join();
  const thieu = nhapDuoc ? thieuNhanXetMt({ nenCo, coDiem: coDiemSau, band: bandSau, kyVong: kv, nhanXet: nx, nhom }) : null;
  const anh = JSON.stringify([tho, vals, bandText, nx, nhom, gv, lyDo]);
  const daLuu = luuAnh === anh;
  const daGo = !daLuu && !ketThuc && (doiDiem || doiNx || doiGv || doiNhom || lyDo.trim() !== '');
  const hoiLyDo = !daLuu && coDiemChinhThuc(cell) && doiDiem && !!diem.patch && !('noShow' in diem.patch);
  const nhanVang = nhapDuoc && !vang && !coDiemChinhThuc(cell) && !chanDau(cell) && !doiDiem && !cell.khongVang;
  /* Hộp có chữ đã gõ chưa gửi = một ô chưa lưu (bảng điểm theo lượt chặn đổi lượt — như hộp lý do cũ). */
  useBaoHopLyDoMo(busy, daGo);
  /* Luật 2: lỗi → focus ô sai (lỗi máy chủ không chỉ ô: ô điểm đầu). */
  useEffect(() => {
    if (loi) loiRef.current?.closest('[role="dialog"]')?.querySelector<HTMLElement>('[aria-invalid="true"], input:not([disabled]), textarea:not([disabled])')?.focus();
  }, [loi]);
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

  const luu = (tiep: boolean) => {
    if (dauLai) { setLoi({ cau: t('Đã ghi vắng — muốn gỡ thì bấm Bỏ vắng.'), o: 0 }); return; }
    /* Rà #410: ô không nhận "-" (lớp đã kết thúc — cờ máy chủ `khongVang`): báo tại hộp, không gửi. */
    if (cell.khongVang && doiDiem && diem.patch?.noShow === true) { setLoi({ cau: dich(cell.khongVang), o: 0 }); return; }
    if (doiDiem && !diem.patch) { setLoi({ cau: diem.loi ?? LOI_SO_CAU, o: diem.o }); return; }
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
    if (!lenh.length) {
      /* Luật 3 — không đổi gì: ô còn trống → ở lại, nhắc; bài đã xong → "Lưu · bài tiếp" sang ngay (không gọi máy chủ), "Lưu" ở lại. */
      if (vang) onDong();
      else if (!coDiemChinhThuc(cell) && !cell.noShow) setLoi({ cau: t('Ô còn trống — nhập điểm hoặc Vắng'), o: 0 });
      else if (tiep && onTiep) onTiep(false);
      else setLuuAnh(anh);
      return;
    }
    /* Ô vắng ("Lưu điểm · đóng" — tên nói đúng hành vi, V12): đóng sau lưu như cũ. V12: "Lưu" ở lại; "Lưu · bài tiếp ›" chỉ chuyển khi máy chủ đã nhận. */
    if (vang) void gui(lenh, onDong, 'luu');
    else void gui(lenh, tiep && onTiep ? () => onTiep(true) : () => undefined, tiep ? 'tiep' : 'luu');
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
  const coTieuChi = vals.some((v) => v.trim() !== '');

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
          <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_4rem] items-end gap-1.5">
            {tc.map((n) => <span key={n} className="text-center text-xs font-semibold text-slate-400">{n}</span>)}
            <span className="text-center text-xs font-semibold text-slate-400">Band</span>
            {tc.map((n, i) => (
              <input key={n} className={oSo('w-full px-1 max-sm:h-11 max-sm:text-base')} style={stSai(loi?.o === i)} inputMode="numeric"
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
      {(!vang || (nenCo && coDiemSau)) && nhapDuoc && (
        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between text-xs font-medium text-slate-300">
            <span>{laW ? t('Nhận xét Task {nTask}', { nTask }) : t('Nhận xét')}</span>
            {nx.length > 800 && <span className={`tabular-nums ${nx.length >= NHAN_XET_TOI_DA ? 'text-bad' : 'text-slate-500'}`}>{nx.length}/{NHAN_XET_TOI_DA}</span>}
          </span>
          <textarea className="field w-full text-sm" rows={2} maxLength={NHAN_XET_TOI_DA} value={nx} disabled={busy}
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
      {cell.daChot!.goDuoc && (
        <button type="button" className={nut} disabled={busy} onClick={() => void gui([{ noShow: false }], onDong, 'khac')}>{t('Bỏ vắng')}</button>
      )}
      <LyDoThieu thieu={thieu} />
      {nhapDuoc && <button type="button" className={`${nut} btn-primary`} disabled={busy} onClick={() => luu(false)}>{busy ? dangLuuChu : t('Lưu điểm · đóng')}</button>}
    </>
  ) : (
    <>
      {onTiep && nhanTiep && <span className="basis-full truncate text-xs text-slate-400" title={nhanTiep}>{t('Tiếp: {x}', { x: nhanTiep })}</span>}
      {cell.diemHuy && !daLuu && (
        <button type="button" className={`${nut} btn-ghost`} disabled={busy} onClick={() => void gui([{ khoiPhuc: true }], onDong, 'khac')}>{dangLuu === 'khac' ? dangLuuChu : CHU_THAO_TAC['khoi-phuc-diem']}</button>
      )}
      {nhanVang && !daLuu && (
        /* LUAT-34: một chữ "Vắng" — hậu quả (dời / thẻ QL / huỷ) nói ở thông báo sau khi ghi, kèm Hoàn tác 10 giây. Vắng kết thúc ô → sang bài tiếp. */
        <button type="button" className={`${nut} btn-ghost`} disabled={busy} onClick={() => void gui([{ noShow: true }], onTiep ? () => onTiep(true) : onDong, 'khac')}>
          {dangLuu === 'khac' ? dangLuuChu : t('Vắng')}
        </button>
      )}
      <LyDoThieu thieu={thieu} />
      {daLuu ? (
        <>
          <span role="status" className="text-[13px] font-semibold text-done">{t('✓ Đã lưu')}</span>
          {onTiep
            ? <button ref={nutHetRef} type="button" className={`${nut} btn-primary`} onClick={() => onTiep(true)}>{tiepEm ? t('Em tiếp ›') : t('Bài tiếp ›')}</button>
            : <button ref={nutHetRef} type="button" className={nut} onClick={onDong}>{t('Đóng')}</button>}
        </>
      ) : (
        <>
          <button type="button" className={onTiep ? nut : `${nut} btn-primary`} disabled={busy} onClick={() => luu(false)}>{dangLuu === 'luu' ? dangLuuChu : t('Lưu')}</button>
          {onTiep && <button type="button" className={`${nut} btn-primary`} disabled={busy} onClick={() => luu(true)}>{dangLuu === 'tiep' ? dangLuuChu : tiepEm ? t('Lưu · em tiếp ›') : t('Lưu · bài tiếp ›')}</button>}
        </>
      )}
    </>
  );

  const ten = `${skillLabel(cell.skill)} · ${ctx.luot}`;
  return (
    <KhungHop anchor={anchor} ten={ten} phu={<>{[ctx.tenHv, ctx.lop].filter(Boolean).join(' · ')}{tuan && <> · <span className="tabular-nums">{tuan}</span></>}</>}
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

/** LUAT-NX-MT: dòng NHẮC (vàng) ngay trước nút — nút vẫn bấm được (375: dòng riêng phía trên). Chỗ trống đẩy nút sang phải khi đủ. */
function LyDoThieu({ thieu }: { thieu: ReturnType<typeof thieuNhanXetMt> }) {
  return (
    <>
      <span role="status" className={`min-w-0 flex-1 text-right text-xs text-soon ${thieu ? 'max-sm:basis-full' : ''}`}>
        {thieu ? CAU_THIEU_NHAN_XET[thieu] : ''}
      </span>
      {thieu && <span aria-hidden className="flex-1 sm:hidden" />}
    </>
  );
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
    else {
      /* R1-PHAN-CAP-TEST: đã gõ → cú bấm ra ngoài không làm gì (vd thu lớp chứa ô — mất chữ); hỏi Bỏ · Gõ tiếp như Esc. */
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
export function NutNhanXet({ tenMon, phu, giaTri, lon = false, onLuu, nguon = null }: {
  tenMon: string; phu: string; giaTri: string | null; lon?: boolean;
  /** P14 DICH: ô của nhận xét (lượt × môn) — hộp có nút "Dịch" cho nhận xét đã lưu. */
  nguon?: NguonDich | null;
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
      {mo && neo && <HopNhanXetThuong anchor={neo} tenMon={tenMon} phu={phu} giaTri={giaTri} nguon={nguon} onLuu={onLuu} onDong={() => setMo(false)} />}
    </>
  );
}

function HopNhanXetThuong({ anchor, tenMon, phu, giaTri, nguon, onLuu, onDong }: {
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
