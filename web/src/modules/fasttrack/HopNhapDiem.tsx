/**
 * HỘP NHẬP ĐIỂM MT (OV-4b, mockup overhaul-1 §3) — MỘT hộp cho MỌI chỗ nhập điểm Mock, gồm MT0: lưới lớp (Điểm theo lớp, hồ sơ lớp,
 * Lịch Test nhúng, `/nhap-diem`), màn điện thoại một kỹ năng, hồ sơ lượt MT, Lộ trình. Thay khung 4 tiêu chí trượt phải, khung sửa dưới
 * dải ô lớn và ô gõ thẳng L/R.
 *
 *   ODiemMt      Ô điểm là NÚT: L/R "4.5" + dòng "14 câu", W/S "5.0", ô trống = khung rỗng (OV-15b), ô vắng "Vắng → W3 OCT". Bấm → hộp neo ngay ô.
 *   HopNhapDiem  Đầu "Reading · MT2" / "{em} · {lớp} · {W2 OCT}"; con trỏ đứng sẵn ở ô điểm; chân ⋯ · Vắng · Lưu · bài tiếp › (GD-3, mockup v21 K2b:
 *                ⋯ = Lưu · đóng · Khôi phục điểm · Bỏ vắng). Không có bài kế: "Lưu" ở lại ("✓ Đã lưu" · Đóng); "Lưu · bài tiếp ›" (Enter) sang bài còn thiếu kế; hết →
 *                "Đã xong phần của bạn" + Lớp tiếp / Việc tiếp / Đóng. Esc đóng. < 640 px: tấm trượt từ dưới.
 *
 * Luật dùng lại, không luật thứ hai: `rawPatchFrom` / `criteriaPatchFrom` dựng lệnh ("-" = Vắng; W / S: 4 tiêu chí HOẶC ô Band, không cả hai — BAND-THANG), lưu qua
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
import { lazyHop } from '../../ui/lazyHop.tsx';
import { OKhongHoc } from '../../ui/ODiem.tsx';
import { ChipDaHuy } from '../../ui/Nhan.tsx';
import { useContext, useState, type ReactNode } from 'react';
import { OHaiTang, OTrongPanel } from '../../ui/LuoiTrongPanel.tsx';
import { CHU_O_THIEU, chuDoiVang, demNguocSuaDau, laChamCheo, lyDoHuy, ngay, type NguoiChon } from '@shared/domain/index.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { useApi } from '../../lib/useApi.ts';
import { DongThoiGianLuot } from './DongThoiGianLuot.tsx';
import { LichSuGap } from '../../ui/LichSuThayDoi.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { DauKetQua, lopKq } from '../../ui/BieuTuong.tsx';
import { lyDoChiDoc, suaDuoc, type Cell, type SaveOpts, type SavePatch } from './ScoreEntry.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import type { NguonDich } from '../../ui/ChuDich.tsx';

/** Ngữ cảnh đầu hộp + dòng phụ: em · lớp · lượt ("MT2" / "MT0"), kỳ vọng (L/R), MT0 = một ô Band. */
export type NguCanhHop = {
  tenHv: string; lop: string | null; luot: string; kyVong?: number | null; mt0?: boolean;
  /** Band của task Writing còn lại (ô W1 ↔ W2) — dòng "Task 2 chưa có". */
  bandTaskKia?: number | null;
  /** UI-LICH-TUAN: lượt của ô — có thì ô đã có điểm hiện "Lịch sử" (ai nhập / sửa, lúc nào) ngay trong hộp. */
  attemptId?: number;
  /** L4 (13/11): lượt KHÔNG chấm chéo (Progress / Final…) — "Người chấm" S chọn được mọi nhân viên. Mặc định (lưới FT: Mock, MT0) = chấm chéo, chỉ GV có kỹ năng S — cùng nhóm máy chủ (`gvChamHopLe`) và nút "GV chấm S" đầu cột. */
  khongCheo?: boolean;
  /** AUDIT-1611 A1-16: lượt MT cũ — GVCN / QL nhập được mọi kỹ năng (T22); ô không phải kỹ năng mình dạy thì hộp ghi "Bạn nhập hộ". */
  mtCu?: boolean;
};

/**
 * LỊCH SỬ MỘT Ô ngay trong hộp (UI-LICH-TUAN, dieu-chinh-cuoi khu a: "R · MT3 · 14/09 10:12 Cô Hà · 5.0 → 5.5"): bấm mới tải `GET /attempts/:id`,
 * chỉ dòng của đúng kỹ năng — cùng dòng thời gian với hồ sơ MT (`DongThoiGianLuot`), không panel mới.
 */
export function LichSuO({ attemptId, skill }: { attemptId: number; skill: string }) {
  const [mo, setMo] = useState(false);
  const { data, error } = useApi<{ scoreHistory: any[] }>(mo ? `/attempts/${attemptId}` : null);
  const ds = data?.scoreHistory.filter((h) => h.skill === skill);
  /* GD-4c (H4): một kiểu lịch sử — gập "Lịch sử" (số hiện khi đã đọc), bấm mới tải như cũ. */
  return (
    <LichSuGap so={ds?.length || null} onMo={(m) => { if (m) setMo(true); }}>
      {error ? <p className="ls-rong text-bad">{error.message}</p>
        : !ds ? <p className="ls-rong">{t('Đang tải…')}</p>
          : <DongThoiGianLuot history={[]} scoreHistory={ds} gioiHan={5} />}
    </LichSuGap>
  );
}

/** Đầu hộp của trang một lượt (hồ sơ MT, Lộ trình — `GET /attempts/:id`): em · lớp · MT{n}; MT0 một ô Band. */
export const nguCanhChiTiet = (d: { student: { name: string }; classCode: string | null; kind: string; attemptNo: number; result?: any }) => ({
  tenHv: d.student.name, lop: d.classCode, luot: d.kind === 'mt0' ? 'MT0' : `MT${d.attemptNo}`,
  kyVong: d.result?.expectation ?? null, mt0: d.kind === 'mt0', khongCheo: !laChamCheo(d.kind, 'speaking'),
});

/** R1-LUU-TIEP: hết phần của người xem — thân hộp "Đã xong phần của bạn · {phamVi}: đã lưu n bài" + nút của nơi gọi (Lớp tiếp / Việc tiếp / Em tiếp) hoặc Đóng. */
export type KetThucHop = { phamVi: string; daLuu: number; nut: { nhan: string; onClick: () => void } | null };

export type HopProps = {
  cell: Cell; anchor: HTMLElement; ctx: NguCanhHop;
  /** `'trung'` = lệnh cùng ô đang chạy (`useSaveScore` › `inflight`) — không phải lỗi. */
  onSave: (patch: SavePatch, opts?: SaveOpts) => Promise<boolean | 'trung'>;
  onDong: () => void;
  /**
   * R1-LUU-TIEP (V12 bản 26/10): có bài kế → nút "Lưu · bài tiếp ›" + Enter; nơi gọi chọn bài còn thiếu kế (`baiKeTiep`) hoặc báo hết (`ketThuc`).
   * `daLuu` = hộp này vừa ghi (nơi gọi đếm "đã lưu n bài"). Không có → chỉ "Lưu".
   */
  /** `vang`: hộp vừa ghi "Vắng" — W1 / W2 vắng cả buổi, nơi gọi bỏ qua ô task kia khi tìm bài kế (rà 11/11 G1-06). */
  onTiep?: (daLuu: boolean, vang?: boolean) => void;
  /** Đích tiếp ("Reading · Minh Anh"; cùng kỹ năng chỉ tên) — dòng "Tiếp: …" ở chân hộp. */
  nhanTiep?: string | null;
  /** Đích tiếp là em khác (trang một em hết bài của lượt) → "Lưu · em tiếp ›" / "Em tiếp ›". */
  tiepEm?: boolean;
  ketThuc?: KetThucHop | null;
  /** Speaking: người chấm mặc định của cột (lớp × tuần) khi ô chưa có. */
  gvMacDinh?: NguoiChon | null;
  /** Thứ Hai của tuần lưới đang xem (null: nơi không theo tuần — hồ sơ MT, Điểm theo lớp theo lượt). */
  tuanXem?: string | null;
  /** Chủ SP 26/11: mục "Dời lịch" · "Huỷ điểm" của ⋯ đầu hộp — nơi gọi đưa việc làm được (`thaoTacKyNang`, cờ máy chủ); thiếu → mục ẩn. Vắng là của chính hộp. */
  thaoTac?: { doiLich?: () => void; huyDiem?: () => void };
};

/* TD-WEB-2: thân hộp + hộp nhận xét ở mảnh riêng (`HopNhapDiemHop.tsx`) — lưới / trang lớp không tải ~560 dòng hộp trước khi bấm ô. Nơi dùng giữ nguyên JSX + props. */
export const HopNhapDiem = lazyHop(() => import('./HopNhapDiemHop.tsx').then((m) => m.HopNhapDiem));
export const HopNhanXetThuong = lazyHop(() => import('./HopNhapDiemHop.tsx').then((m) => m.HopNhanXetThuong));

/** AUDIT-1611 B3-08: chỉ số lỗi của ô Người chấm (khác ô điểm 0–4). */
export const O_NGUOI_CHAM = 9;
export const laLR = (s: string) => s === 'listening' || s === 'reading';
/** "18/10 14:05" — ngày (như `ngay`) + giờ máy người xem. */
export const lucNgan = (iso: string, homNay: string) => `${ngay(iso, homNay)} ${new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

/**
 * OV-11a (TE-2/TE-3): ô mở hộp ở chế độ VẮNG (dòng "Vắng lần n", không nút Vắng) khi dấu "-" đã chốt là của CHÍNH tuần thi (vắng chờ
 * Quản lý, huỷ phần thi), hoặc bài đã dời và đang xem ở lưới TUẦN GỐC. Ở tuần thi bù / nơi không theo tuần: ô thường.
 */
/** Lý do "Đã huỷ" của ô (Rulebook §21.4 T5) — chỉ ô huỷ do "-" (có `daChot`): lần ≥ 2 = vắng 2 lần, còn lại Quản lý từ chối / không duyệt dời. */
export const lyDoHuyO = (c: Cell) => (c.daChot ? lyDoHuy({ huyVang: c.daChot.lan >= 2, sit: c.sitStatus }) : null);

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
    /* SUA-2211-B (chủ SP 22/11 ý 11): MỘT dòng — chip "Đã huỷ" giữa ô, cùng hàng ô khác; lý do ở title / tên đọc màn (không dòng chữ dưới ô). */
    return { chu: t('Đã huỷ'), doc: ly ? `${t('Đã huỷ')} · ${ly}` : t('Đã huỷ'), kieu: 'huy' };
  }
  if (vangGoc && c.daChot?.doiSang) return { ...hai(t('Vắng'), `→ ${c.daChot.doiSang}`), doc: t('Vắng, đã dời sang {doiSang}', { doiSang: c.daChot.doiSang }), kieu: 'vang' };
  if (c.daChot && !c.daChot.doiSang && c.sitStatus === 'absent') return { ...hai(t('Vắng'), t('chưa dời')), doc: t('Vắng, chưa dời'), kieu: 'vang' };
  /* N38 L3: "-" ở MT cũ của kỹ năng (≥ 2 tuần) = Không dự thi — bấm ô gỡ "-" / nhập điểm như ô "-" khác. */
  if (c.noShow?.state === 'khong-du-thi') return { ...hai(t('Vắng'), t('không dự thi')), doc: t('Không dự thi'), kieu: 'chot' };
  if (c.noShow) return { chu: '-', doc: c.noShow.text, kieu: null };
  /* OV-15b (mockup 2 · 6): band trước, số câu là dòng phụ dưới ô (`SoCau`). */
  if (c.rawScore !== null) {
    /* Chủ SP 25/11: L / R MỘT dòng "6.5 · 29/40" (band tô màu trước, số câu đúng / 40 chữ trắng sau), không dòng "29 câu" dưới ô — phần số câu vẽ ở `ODiemMt` (panel việc: hai tầng "21 câu" dưới band — chủ SP 26/11). */
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
  /* LUAT-NX-MT: ô tuần thi bù — "vắng W3 SEP" (tuần cũ, `chuDoiVang` chung mọi ô điểm); lần vắng ở tooltip. R1-EN-2b: một dòng, mượn đệm ô ("absent W2 SEP" dài hơn 72 px). */
  if (thiBu && cell.daChot) {
    return <span className="-mx-2 block whitespace-nowrap text-xs leading-4 text-slate-400" data-phu-odiem="" title={`${t('vắng lần')} ${Math.max(1, cell.daChot.lan)}`}>{chuDoiVang(cell.daChot.tuTuan, homNay)}</span>;
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
  huy: '!border-muted-line bg-muted-bg text-xs font-semibold text-muted',   // SUA-2211-B: cùng dáng `ChipDaHuy`
  /* OV-11a (CA3-2): Không dự thi — hai dòng chữ như ô Vắng, màu trung tính (trạng thái cuối, không phải việc). */
  chot: 'text-[13px] text-slate-400',
} as const;

/** UI-CON-LAI (chủ SP 24/10): MT nên có nhận xét mà còn thiếu → viền ô vàng, KHÔNG chữ dưới điểm; câu nhắc ở tooltip + tên đọc màn, chi tiết trong hộp. */
export const VIEN_THIEU_NX = '!border-[color:rgb(var(--soon-rgb))]';

/**
 * Ô ĐIỂM MT: nút mở hộp; ô không mở được là chữ (E5: không viền, không mờ) có câu "vì sao" ở tooltip.
 * `mo` do nơi gọi giữ (lưới / danh sách: một hộp một lúc, "em tiếp" chuyển sang dòng kế).
 */
/** DON-HINH B6: chữ "vắng W2 SEP" của ô (đúng hai đường dòng phụ của `ODiemMt`) — để hàng gộp một lần (`gopVangHang`). */
export function chuVangO(c: Cell, tuanXem: string | null | undefined, homNay: string | null): string | null {
  if (c.daChot) return c.daChot.doiSang && !oVangCua(c, tuanXem) ? chuDoiVang(c.daChot.tuTuan, homNay) : null;
  return c.noShow?.state === 'khong-co-bai' ? null : chuDoiVang(c.doiTu);
}

export function ODiemMt({ cell, lon = false, mo, onMo, dauKq = null, anVang = false, ...hop }: Omit<HopProps, 'anchor' | 'onDong'> & {
  lon?: boolean; mo: boolean; onMo: (mo: boolean) => void;
  /** DON-HINH B6: hàng đã ghi "vắng W2 SEP" một lần — ô không lặp. */
  anVang?: boolean;
  /** Giữ cho nơi gọi cũ — BANG-1: mọi ô kỹ năng cùng một dáng (số 15 / 700). */
  chinh?: boolean;
  /** ✓ / ✗ so kỳ vọng ĐỨNG TRƯỚC band — chỉ lưới có cột Kỳ vọng (04 mục 7: W1 / W2 cũng có). */
  dauKq?: 'vuot' | 'bang' | 'duoi' | null;
}) {
  const [neo, setNeo] = useState<HTMLButtonElement | null>(null);
  const trongPanel = useContext(OTrongPanel);
  const haiTangNgoai = useContext(OHaiTang);
  const haiTang = trongPanel || haiTangNgoai;
  const vangGoc = oVangCua(cell, hop.tuanXem);
  if (cell.khongHoc) return <OKhongHoc nhan={skillLabel(cell.skill)} />;   // P8: môn em không học — không phải nút
  const h = hienO(cell, vangGoc);
  const kq = dauKq && cell.band !== null && !h.kieu ? dauKq : null;
  /* BANG-0 (`ODiem`): chỗ ký hiệu giữ khi ô có số mà không ký hiệu (số thẳng cột). */
  const kyHieu = cell.band !== null && !h.kieu ? <span className="inline-block w-[14px] shrink-0 text-center" aria-hidden>{kq ? <DauKetQua kq={kq} /> : ' '}</span> : null;   /* LECH-BANG: chỗ trống giữ một khoảng trắng — span rỗng làm đường cơ sở ô (nút flex) tụt về giữa nút, lệch số 4,7 px */
  const soCau = !h.kieu && cell.rawScore !== null && cell.band !== null ? <span className="ml-1 text-[13px] font-medium text-[color:var(--text)]">· {cell.rawScore}/40</span> : null;
  const so = <span className="whitespace-nowrap"><span className={`${h.kieu ? '' : `text-[14px] font-bold ${lopKq(kq)}`}`}>{h.chu}</span>{soCau}</span>;
  /* MỘT dòng phụ (04 mục 7): vắng lần n / đếm ngược "-" > chữ thứ hai của ô > n câu (thiếu nhận xét = viền vàng, không chữ). */
  const thiBu = !!cell.daChot?.doiSang && !vangGoc;
  const coDongDau = (thiBu && !!cell.daChot) || (cell.noShow?.state === 'khong-co-bai' && !cell.daChot);
  const phu = coDongDau && !(anVang && thiBu) ? <DongDau cell={cell} thiBu={thiBu} />
    /* NEN-SUA (nợ #544): ô đã có điểm ở tuần thi bù giữ "vắng W3 SEP" (thay "n câu"). */
    : cell.doiTu && !anVang ? <span className="-mx-2 block whitespace-nowrap text-xs leading-4 text-slate-400" data-phu-odiem="">{chuDoiVang(cell.doiTu)}</span>
    : h.phu ? <span className="block text-xs leading-4 text-slate-400" data-phu-odiem="">{h.phu}</span>
    : null;
  if (!suaDuoc(cell)) {
    const vang = cell.sitStatus === 'absent' && cell.band === null && !cell.daChot;
    return (
      <span className="inline-flex flex-col items-center">
        <span className={`inline-flex items-baseline gap-1 tabular-nums ${vang || h.kieu ? 'text-xs text-slate-500' : ''} ${lon ? 'text-base' : ''}`}
          title={h.kieu === 'huy' ? h.doc : cell.noShow?.text ?? lyDoChiDoc(cell)}>
          {/* OV-15b: ô của người khác chưa có điểm = trống (không "—"). */}
          {vang ? t('Vắng') : h.kieu === 'huy' ? <ChipDaHuy ly={lyDoHuyO(cell)} /> : h.kieu === 'trong' ? <span className="sr-only">{t('Chưa có')}</span> : <>{kyHieu}{so}</>}
        </span>
        {phu}
      </span>
    );
  }
  const nhanO = `${skillLabel(cell.skill)} · ${hop.ctx.tenHv}: ${h.doc}${cell.thieuNhanXet ? `, ${CHU_O_THIEU[cell.thieuNhanXet]}` : ''}`;
  const tieuDeO = h.kieu === 'huy' ? h.doc : cell.noShow?.text ?? (cell.thieuNhanXet ? CHU_O_THIEU[cell.thieuNhanXet] : t('{skillLabel} — bấm để nhập', { skillLabel: skillLabel(cell.skill) }));
  if (haiTang) {
    /* Chủ SP 26/11 (#2196, ảnh mẫu = mockup v24 P2 `.lc .od`): ô 68 × 44 HAI TẦNG — band 14 / 700 (✓ / ✗ khi lưới có Kỳ vọng) trên, MỘT dòng phụ 12
       dưới: vắng / "→ W4 SEP" nếu có, không thì "21 câu". Dạng ngang "6.5 · 29/40" (#2173) chỉ ở Lịch Test tuần (nhánh dưới). */
    const cau = !h.kieu && cell.rawScore !== null && cell.band !== null
      ? <span className="block text-xs leading-4 text-[color:var(--text-dim)]" data-phu-odiem="">{t('{rawScore} câu', { rawScore: cell.rawScore })}</span> : null;
    return (
      <span className="inline-flex max-w-full">
        <button ref={setNeo} type="button" aria-expanded={mo} aria-haspopup="dialog" aria-label={nhanO} title={tieuDeO} onClick={() => onMo(!mo)}
          className={`o-sua grid h-11 ${trongPanel ? 'w-[68px] max-w-full' : 'min-w-[68px] max-w-full px-1.5 [&_[data-phu-odiem]]:whitespace-nowrap'} place-content-center justify-items-center leading-[1.15] tabular-nums [&_[data-phu-odiem]]:!mx-0 ${h.kieu && h.kieu !== 'trong' ? KIEU_O[h.kieu] : ''} ${mo ? '!border-[color:var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]' : cell.thieuNhanXet ? VIEN_THIEU_NX : ''}`}>
          {/* Chủ SP 14/11: số CĂN GIỮA ô — không chừa chỗ ký hiệu khi ô không có ✓ / ✗. */}
          <span className="inline-flex items-baseline whitespace-nowrap">{kq && kyHieu}{h.kieu === 'trong' ? <span className="text-transparent" aria-hidden>0</span>
            : <span className={h.kieu ? '' : `text-[14px] font-bold ${lopKq(kq)}`}>{h.chu}</span>}</span>
          {h.kieu === 'trong' ? null : phu ?? cau}
        </button>
        {mo && neo && <HopNhapDiem cell={cell} anchor={neo} onDong={() => onMo(false)} {...hop} />}
      </span>
    );
  }
  return (
    <span className="inline-flex max-w-full flex-col items-center">
      <button ref={setNeo} type="button" aria-expanded={mo} aria-haspopup="dialog"
        aria-label={`${skillLabel(cell.skill)} · ${hop.ctx.tenHv}: ${h.doc}${cell.thieuNhanXet ? `, ${CHU_O_THIEU[cell.thieuNhanXet]}` : ''}`}
        className={`o-sua inline-flex max-w-full items-center justify-center gap-1 tabular-nums ${lon ? 'min-h-[44px] min-w-[60px] text-base font-semibold' : 'h-8 min-w-16 px-1.5'} ${h.kieu ? KIEU_O[h.kieu] : ''} ${mo ? '!border-[color:var(--accent)]' : cell.thieuNhanXet ? VIEN_THIEU_NX : ''}`}
        title={tieuDeO}
        onClick={() => onMo(!mo)}>
        {kyHieu}{h.kieu === 'trong' ? <span className="text-transparent" aria-hidden>0</span> : so}
      </button>
      {phu}
      {mo && neo && <HopNhapDiem cell={cell} anchor={neo} onDong={() => onMo(false)} {...hop} />}
    </span>
  );
}

/**
 * NÚT "NHẬN XÉT" CỦA LỚP THƯỜNG (OV-4b, chốt HD2): ô điểm lớp thường giữ gõ thẳng đúng/tổng; nút nhỏ cạnh ô mở hộp chỉ có ô Nhận xét,
 * lưu riêng (`PUT /regular/attempts/:id/scores/:skill { nhanXet }`, cùng quyền nhập điểm môn đó). Đã có nhận xét → chữ màu nhấn.
 */
export function NutNhanXet({ tenMon, phu, giaTri, lon = false, dau = false, onLuu, nguon = null }: {
  tenMon: string; phu: string; giaTri: string | null; lon?: boolean;
  /** G1-11 (lưới gọn trong panel): đã có nhận xét → "● Nhận xét" đậm — khác chưa có không chỉ bằng màu. */
  dau?: boolean;
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
        className={`btn btn-sm btn-ghost shrink-0 text-xs ${lon ? 'min-h-[44px] px-1.5' : 'px-1'} ${giaTri ? `text-[color:var(--accent-strong)]${dau ? ' font-bold' : ''}` : 'text-slate-400'}`}
        onClick={() => setMo((m) => !m)}>{dau && giaTri && <span aria-hidden className="mr-0.5">•</span>}{t('Nhận xét')}</button>
      {mo && neo && <HopNhanXetThuong anchor={neo} tenMon={tenMon} phu={phu} giaTri={giaTri} nguon={nguon} onLuu={onLuu} onDong={() => setMo(false)} />}
    </>
  );
}
