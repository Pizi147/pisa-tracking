/**
 * LUẬT HIỂN THỊ THUẦN CỦA HỒ SƠ HỌC VIÊN (PR-HV, spec 2026-09-22) — giao diện chỉ vẽ.
 *
 * Cùng cách với `display.ts` + `<KetQuaDot>` (PR-E): luật nằm ở một chỗ, kiểm được bằng harness máy chủ
 * (`server/src/tests/hoSoHocVien.tests.ts`), React không có luật riêng để sai khác đi.
 *
 *   tab từ địa chỉ `?tab=`            → `parseHoSoTab`        (Task 2)
 *   ô "Kết quả Test gần nhất"         → `ketQuaTestGanNhat`   (Task 3)
 *   đếm vi phạm theo nhóm             → `demTheoNhomViPham`   (Task 4)
 *   tiến độ Case, việc tiếp của PA    → `tienDoCase`, `viecTiepPhuongAn` (Task 6)
 */
import { ATTEMPT_SKILL_UNITS, CHUA_CO_HAN, deadlineView, type DeadlineKind } from './display.ts';
import { NHAN_TRANG_THAI } from './trangThai.ts';
import { ngay, tuanLich } from './hienThiNgay.ts';
import { nhanLichThi, type LichThi } from './lichThiOv15f.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, type ViolationCategory } from './yThuc.ts';
import { moiNhatTruoc, nhanBaiThuong } from './normal.ts';
import { dich, ghepChu, kem, t, type ChuKhoa } from '../i18n/index.ts';

// ====================================================================== ba tab (D2, A6)

export const HO_SO_TABS = ['hoc-thuat', 'y-thuc', 'hanh-trinh'] as const;
export type HoSoTab = (typeof HO_SO_TABS)[number];
export const HO_SO_TAB_LABEL: Record<HoSoTab, string> = {
  'hoc-thuat': t('Học thuật'), 'y-thuc': t('Ý thức & Phối hợp'), 'hanh-trinh': t('Lộ trình & lớp'),
};
/** Giá trị lạ, rỗng hay thiếu → 'hoc-thuat' (tab mặc định). Không nhớ bằng localStorage (A6). */
export function parseHoSoTab(v: string | null | undefined): HoSoTab {
  return (HO_SO_TABS as readonly string[]).includes(v ?? '') ? (v as HoSoTab) : 'hoc-thuat';
}

// ====================================================================== ô số nhỏ của tab Ý thức (A3)

/**
 * Đếm vi phạm theo nhóm, ĐÚNG thứ tự `VIOLATION_CATEGORIES`, bỏ nhóm có 0 (A3). `tong` đếm mọi dòng — kể cả mã nhóm lạ
 * (dữ liệu cũ) — để ô "Vi phạm" không ít hơn số dòng người dùng thấy.
 */
export function demTheoNhomViPham(vs: readonly { category: string }[]): {
  tong: number; nhom: { category: string; label: string; n: number }[];
} {
  const dem = new Map<string, number>();
  for (const v of vs) dem.set(v.category, (dem.get(v.category) ?? 0) + 1);
  return {
    tong: vs.length,
    nhom: VIOLATION_CATEGORIES
      .map((c) => ({ category: c, label: VIOLATION_CATEGORY_LABEL[c as ViolationCategory], n: dem.get(c) ?? 0 }))
      .filter((g) => g.n > 0),
  };
}

// ====================================================================== thẻ Case và khối phương án (Q8)

/** Một phương án học thuật như thẻ Case trả về (`Plan` ở `SkillBoard.tsx`) — chỉ các trường luật này cần. */
export type PhuongAnTomTat = {
  status: string; lastOutcome: string | null; preset: boolean; confirmedAt: string | null;
  pendingApproval: boolean; approvalDue: string | null;
  actionDue: string | null; actionOverdue: boolean; completedOn: string | null;
  /** PR-SOS: PA theo quy chế chờ xác nhận (Q28-3) · lần ghi tới là "Ghi kết quả cuối" (T22). */
  choXacNhan?: boolean; lanCuoi?: boolean;
  /** A10: lý do đóng (`superseded` = PA bị PA khác thay) — PA bị thay không trông như "Đã kết thúc". */
  closedReason?: string | null;
};
export const dangChay = (p: { status: string }) => p.status === 'planned' || p.status === 'started';

/**
 * Cột 2 đầu thẻ case: `{n} PA · {k} có kết quả` + việc gần nhất có hạn (`tiep`). Chỉ xét PA ĐANG CHẠY; Case đã xong → không
 * có việc tiếp. Thứ tự: PA đang chạy ĐÃ QUÁ HẠN (sớm nhất) → PA chờ Quản lý → PA có hạn làm sớm
 * nhất → nghĩa vụ cập nhật hằng tuần của Case (chủ sản phẩm chốt 22/09: việc đã trễ nói trước việc đang chờ người khác).
 * Hạn DỰ KIẾN XONG (followupDue) KHÔNG phải hạn (F11) — không dùng.
 */
export function tienDoCase(plans: readonly PhuongAnTomTat[], c: { status: string; followUntil: string | null; followOverdue: boolean }): {
  coKetQua: number; tong: number; text: string;
  tiep: { text: string; due: string | null; overdue: boolean } | null;
} {
  const tong = plans.length;
  const coKetQua = plans.filter((p) => p.lastOutcome !== null).length;
  const text = tong === 0 ? t('Chưa có PA')
    : coKetQua === 0 ? t('{tong} PA · chưa có kết quả', { tong })
    : coKetQua === tong ? t('{tong} PA · đủ kết quả', { tong }) : t('{tong} PA · {n} có kết quả', { tong, n: coKetQua });
  let tiep: { text: string; due: string | null; overdue: boolean } | null = null;
  if (c.status !== 'done') {
    const chay = plans.filter(dangChay);
    const choDuyet = chay.find((p) => p.pendingApproval);
    const coHan = chay.filter((p) => p.actionDue).sort((a, b) => a.actionDue!.localeCompare(b.actionDue!))[0];
    const quaHanRoi = chay.filter((p) => p.actionDue && p.actionOverdue).sort((a, b) => a.actionDue!.localeCompare(b.actionDue!))[0];
    if (quaHanRoi) tiep = { text: t('Kết quả PA'), due: quaHanRoi.actionDue, overdue: true };
    else if (choDuyet) tiep = { text: t('Chờ Quản lý trả lời'), due: choDuyet.approvalDue, overdue: false };
    else if (coHan) tiep = { text: t('Kết quả PA'), due: coHan.actionDue, overdue: coHan.actionOverdue };
    else if (c.followUntil) tiep = { text: t('Kết quả PA'), due: c.followUntil, overdue: c.followOverdue };
  }
  return { coKetQua, tong, text, tiep };
}

/** Phần 3 ("Việc tiếp theo") của một khối phương án. */
export function viecTiepPhuongAn(p: PhuongAnTomTat): {
  loai: 'cho-duyet' | 'cho-xac-nhan' | 'ghi-cuoi' | 'ghi-ket-qua' | 'da-xong'; text: string; due: string | null; overdue: boolean;
} {
  if (p.pendingApproval) return { loai: 'cho-duyet', text: t('Chờ Quản lý trả lời'), due: p.approvalDue, overdue: false };
  /* PR-SOS: PA quy chế chờ xác nhận chưa chạy — việc là Xác nhận PA (hạn ở Case). Tuần chạm mốc → Ghi kết quả cuối. */
  if (p.choXacNhan) return { loai: 'cho-xac-nhan', text: t('Chờ xác nhận'), due: null, overdue: false };
  if (p.lanCuoi && dangChay(p)) return { loai: 'ghi-cuoi', text: t('Kết quả cuối'), due: p.actionDue, overdue: p.actionOverdue };
  if (dangChay(p)) return { loai: 'ghi-ket-qua', text: t('Kết quả PA'), due: p.actionDue, overdue: p.actionOverdue };
  return { loai: 'da-xong', text: p.closedReason === 'superseded' ? t('Được thay thế') : p.closedReason === 'doi_pa' ? t('Đã kết thúc · Đổi PA') : p.closedReason === 'ket_thuc_lo_trinh' ? t('Dừng — kết thúc lộ trình') : p.closedReason === 'khong_con_hoc_mon' ? t('Dừng — không còn học môn') : t('Đã kết thúc'), due: p.completedOn, overdue: false };
}

// ====================================================================== ô "Việc cần làm tiếp" (Q7)

/** Quá hạn = hạn ĐÃ QUA (trước hôm nay). Hạn đúng hôm nay thì chưa quá hạn; không có hạn thì không bao giờ quá hạn. */
export const quaHan = (due: string | null | undefined, today: string): boolean => !!due && due < today;

// ====================================================================== ô "Kết quả Test gần nhất" (Q7)

/** Một lượt đánh giá như `studentProfile().attempts[]` trả về — chỉ các trường ô này cần. */
export type LuotTomTat = {
  id: number; attemptNo: number; kind: string; status: string; periodCode: string | null;
  weekStart: string | null;
  mode: string; scored: number; required: number; complete: boolean;
  /** OV-1c: lượt FT đã chốt (máy chủ, `AttemptResult.chot`). Thiếu (lớp thường) = theo `complete`. */
  chot?: boolean;
  overall: number | null; expectation: number | null; sosLevel: number | null;
  /** OV-9: em KCK dưới kỳ vọng (không SOS) — chip trung tính `DUOI_KY_VONG_KCK`. */
  kckDuoi?: boolean;
  /** Chỉ lớp thường — dùng để đếm số môn chưa đạt THẬT (`sosLevel` bị chặn trần ở 3, không dùng được khi trượt cả 4). */
  skills?: { outcome: string }[] | null;
  /** Chỉ lớp thường: % tổng (chưa làm tròn) — Cuối khoá đủ điểm thì ô ghi `66%` như hộp Kết luận khoá (PR-S5F-a). */
  tyLeTong?: number | null;
};
export type KetQuaTestGanNhat = {
  attemptId: number; nhan: string; coDiem: number; yeuCau: number;
  dat: boolean | null; sos: number | null;
  /** OV-9: em KCK dưới kỳ vọng — không SOS, chip trung tính "Dưới kỳ vọng · KCK". */
  kckDuoi: boolean;
  /** OV-1c: lượt đã chốt — chưa chốt thì SOS là số tạm ("tạm thời"). */
  chot: boolean;
  /** Chỉ lớp thường — số môn chưa đạt THẬT (không bị chặn trần như `sos`); FT luôn `null`. */
  soMonChuaDat: number | null;
  /** `<KetQuaDot>` chỉ nhận 1–4 kỹ năng (ATTEMPT_SKILL_UNITS); ngoài khoảng đó giao diện ghi `{có}/{cần} phần có điểm`. */
  dungKetQuaDot: boolean;
  /** PR-S5F-a (T58): Cuối khoá lớp thường đủ điểm → `66%` — CÙNG số với hộp Kết luận khoá (không "2/4 môn đạt"). */
  phanTram: number | null;
};

/**
 * Lượt SỐ LỚN NHẤT chưa huỷ và đã có ít nhất một điểm — tự sắp, không tin thứ tự vào. Không có → null.
 *
 *   Fast Track: nhãn `MT{n} · {tuần}`; "đạt" = đủ điểm và Overall ≥ kỳ vọng (thiếu một trong hai → null).
 *   Normal:     nhãn `Giữa khoá` / `Cuối khoá` (+ tuần); KHÔNG có Overall — "đạt" = đủ điểm và SOS 0
 *               (mọi phần đạt ngưỡng), chưa đủ điểm → null. Không bịa Overall (J3).
 */
export function ketQuaTestGanNhat(attempts: readonly LuotTomTat[], homNay?: string | null): KetQuaTestGanNhat | null {
  const a = [...attempts]
    .filter((x) => x.status !== 'cancelled' && x.scored > 0 && x.kind !== 'mt0')   // PR-MT0: không là kết quả gần nhất
    .sort((x, y) => moiNhatTruoc({ kind: x.kind, attempt_no: x.attemptNo }, { kind: y.kind, attempt_no: y.attemptNo }))[0];   // lớp thường theo loại
  if (!a) return null;
  const ratio = a.mode === 'ratio';
  const dau = ratio ? nhanBaiThuong(a.kind) : `MT${a.attemptNo}`;
  const nhan = a.weekStart ? `${dau} · ${tuanLich(a.weekStart, homNay)}` : dau;
  const dat = ratio
    ? (a.complete ? a.sosLevel === 0 : null)
    : (a.complete && a.overall !== null && a.expectation !== null ? a.overall >= a.expectation : null);
  const soMonChuaDat = ratio ? (a.skills ?? []).filter((s) => s.outcome === 'fail').length : null;
  return {
    attemptId: a.id, nhan, coDiem: a.scored, yeuCau: a.required, dat, sos: a.sosLevel, kckDuoi: !!a.kckDuoi, soMonChuaDat, chot: a.chot ?? a.complete,
    dungKetQuaDot: a.required >= 1 && a.required <= ATTEMPT_SKILL_UNITS,
    phanTram: ratio && a.kind === 'final' && a.complete && a.tyLeTong != null ? Math.round(a.tyLeTong * 100) : null,
  };
}

// ====================================================================== đầu hồ sơ "hiểu trong 30 giây" (PR-VAI-b Task 3, mockup 24)

/** Màu một mảnh: đỏ quá hạn · vàng bắt buộc / tạm dừng · cam SOS 2 (`late`) · tím chờ duyệt · xanh dương sắp chuyển (Q6). */
export type ToneManh = 'danger' | 'warn' | 'sos1' | 'sos2' | 'sos3' | 'wait' | 'accent' | null;
/** `khoa` + `bien` (PR-EN-c): câu do máy chủ dựng — web dịch bằng `dichChu`. */
export type ManhCau = ChuKhoa & { tone: ToneManh };

const noiVaK = (ds: readonly string[]): ChuKhoa => (ds.length < 2 ? { chu: ds.join('') } : kem('{dau} và {cuoi}', { dau: ds.slice(0, -1).join(', '), cuoi: ds[ds.length - 1] }));
const toneSos = (n: number): ToneManh => (n >= 3 ? 'sos3' : n === 2 ? 'sos2' : 'sos1');
/** Việc học thuật (mệnh đề 2) — Ý thức, Báo PH, Bàn giao không tính ở đây. */
const VIEC_HOC_THUAT = new Set(['nguyen-nhan', 'de-ra-pa', 'xac-nhan-pa', 'ghi-ket-qua', 'cho-duyet', 'mini-test']);

export type DauVaoCau = {
  /** Mệnh đề 0 — một trạng thái đặc biệt (máy chủ chọn theo thứ tự đã kết thúc › tạm dừng › sắp chuyển › KCK). */
  dacBiet: { loai: 'ket-thuc' } | { loai: 'tam-dung'; tu: string } | { loai: 'sap-chuyen'; lop: string; tuan: string } | { loai: 'kck' } | null;
  /** Đợt Test gần nhất. FT: `dau` = "MT1"; lớp thường: "Giữa khoá" / "Cuối khoá". `monTruot`: tên ngắn môn không đạt (lớp thường). */
  ketQua: {
    dau: string; ratio: boolean; sos: number | null; dat: boolean | null; overall: number | null; kck: boolean;
    /** OV-9: em KCK dưới kỳ vọng — mảnh trung tính "MT1 dưới kỳ vọng · KCK" (không SOS, không đỏ). */
    kckDuoi?: boolean;
    soDat: number; soMon: number; monTruot: string[]; phanTram: number | null;
    /** Số kỹ năng đã có điểm (FT). */
    coDiem?: number;
    /** OV-1c: lượt chưa chốt thì SOS chỉ là số tạm → câu phải ghi "tạm thời" (UX-G G1). Thiếu = theo `coDiem < soMon`. */
    chot?: boolean;
  } | null;
  /** Tên đầy đủ các kỹ năng có Case đang mở. */
  hoTro: string[];
  /** Mọi việc của em (cả của người xem lẫn người khác) — `dauHoSo.viec`. */
  viec: (ChuKhoa & { loai: string; kyNangTen: string | null; quaHanNgay: number | null })[];
  yThuc: { nhom: string | null; keTiep: string | null; han: string | null; quaHanNgay: number | null; deXuat: string | null } | null;
  homNay: string;
};

/**
 * CÂU TÓM TẮT máy viết (Q6, Q31-8, bảng luật mockup 24) — tối đa 3 mảnh, mệnh đề "ổn" bỏ:
 *   0 trạng thái đặc biệt · 1 kết quả gần nhất + kỹ năng đang hỗ trợ · 2 việc học thuật gấp nhất CỦA BẤT KỲ AI (quá hạn › chờ duyệt › chờ
 *   nguyên nhân) · 3 Ý thức (bắt buộc / quá hạn / chờ duyệt). Có mệnh đề 0 thì bỏ mệnh đề cuối. Không có gì → "<kết quả> · không có việc đang mở".
 * Lớp thường không bao giờ có chữ SOS.
 */
export function cauTomTat(i: DauVaoCau): ManhCau[] {
  const d = i.dacBiet;
  const k = i.ketQua;
  const hoTro = i.hoTro.length ? kem('đang hỗ trợ {ds}', { ds: noiVaK(i.hoTro) }) : null;

  const hoc = i.viec.filter((v) => VIEC_HOC_THUAT.has(v.loai));
  const quaHan = hoc.filter((v) => v.quaHanNgay !== null).sort((a, b) => b.quaHanNgay! - a.quaHanNgay!)[0];
  const choDuyet = hoc.find((v) => v.loai === 'cho-duyet');
  const choNn = hoc.find((v) => v.loai === 'nguyen-nhan');
  const kn = (v: { kyNangTen: string | null }) => (v.kyNangTen ? `${v.kyNangTen} ` : '');
  /* Phần đầu câu việc ("Ghi Mini Test · bổ trợ…" → "Ghi Mini Test"); câu không có " · " giữ khoá của nó. */
  const dauViec = (v: ChuKhoa): ChuKhoa => (v.chu.includes(' · ') ? { chu: v.chu.split(' · ')[0] } : { chu: v.chu, khoa: v.khoa, bien: v.bien });
  const m2: ManhCau | null = quaHan
    ? {
      ...(quaHan.loai === 'ghi-ket-qua' ? kem('PA {kn}quá hạn Kết quả {n} ngày', { kn: kn(quaHan), n: quaHan.quaHanNgay! })
        : quaHan.loai === 'nguyen-nhan' ? kem(quaHan.chu.startsWith('Mô tả Case') ? '{kn}quá hạn mô tả Case {n} ngày' : '{kn}quá hạn xác nhận Case {n} ngày', { kn: kn(quaHan), n: quaHan.quaHanNgay! })
        : quaHan.loai === 'xac-nhan-pa' ? kem('{kn}quá hạn xác nhận PA {n} ngày', { kn: kn(quaHan), n: quaHan.quaHanNgay! })
        : kem('{viec} quá hạn {n} ngày', { viec: dauViec(quaHan), n: quaHan.quaHanNgay! })),
      tone: 'danger',
    }
    : choDuyet ? { chu: choDuyet.chu, khoa: choDuyet.khoa, bien: choDuyet.bien, tone: 'wait' }
    : choNn ? { ...kem(choNn.chu.startsWith('Mô tả Case') ? '{kn}chờ mô tả Case' : '{kn}chờ xác nhận Case', { kn: kn(choNn) }), tone: 'warn' }
    : null;

  const y = i.yThuc;
  const m3: ManhCau | null = !y ? null
    : y.nhom === 'qua_han' ? {
      ...(y.keTiep
        ? (y.quaHanNgay ? kem('Ý thức: bắt buộc {ke}, quá hạn {n} ngày', { ke: y.keTiep, n: y.quaHanNgay }) : kem('Ý thức: bắt buộc {ke}, quá hạn', { ke: y.keTiep }))
        : (y.quaHanNgay ? kem('Ý thức: quá hạn {n} ngày', { n: y.quaHanNgay }) : { chu: 'Ý thức: quá hạn' })),
      tone: 'danger',
    }
    : y.nhom === 'bat_buoc' ? {
      ...(y.han ? kem('Ý thức: bắt buộc {ke}, hạn hết {han}', { ke: y.keTiep ?? 'xử lý', han: ngay(y.han, i.homNay) }) : kem('Ý thức: bắt buộc {ke}', { ke: y.keTiep ?? 'xử lý' })),
      tone: 'warn',
    }
    : y.nhom === 'cho_duyet' ? { ...(y.deXuat ? kem('Ý thức: đề xuất {de} chờ Quản lý', { de: y.deXuat }) : { chu: 'Ý thức: đề xuất chờ Quản lý' }), tone: 'wait' }
    : null;

  /* OV-11d (HV-22): nhãn "KCK · không tính SOS" không đẩy mất việc có hạn — đủ 3 mảnh khác thì bỏ nhãn, KCK nói ở mảnh kết quả. */
  const kckRieng = d?.loai === 'kck' && !(m2 && m3 && (k || hoTro));
  const m0: ManhCau | null = !d ? null
    : d.loai === 'ket-thuc' ? { chu: 'Đã kết thúc', tone: null }
    : d.loai === 'tam-dung' ? null   // OV-11d (CA2-12): dải Tạm dừng ngay dưới đã nói (ngày, lý do, nút Quay lại học) — câu không lặp
    : d.loai === 'sap-chuyen' ? { ...kem('Sắp chuyển {lop} từ {tuan}', { lop: d.lop, tuan: tuanLich(d.tuan, i.homNay) }), tone: 'accent' }
    : kckRieng ? { chu: 'KCK · không tính SOS', tone: null } : null;

  const voiHoTro = (dau: ChuKhoa): ChuKhoa => (hoTro ? ghepChu('{dau}: {hoTro}', { dau, hoTro }) : dau);
  let m1: ManhCau | null = null;
  if (!k) m1 = hoTro ? { ...hoTro, tone: null } : null;
  else if (k.ratio) {
    const dau = k.phanTram !== null ? { chu: `${k.dau} ${k.phanTram}%` } : kem('{dau} {dat}/{mon} môn đạt', { dau: k.dau, dat: k.soDat, mon: k.soMon });
    m1 = { ...(k.monTruot.length ? kem('{dau}: không đạt {ds}', { dau, ds: noiVaK(k.monTruot) }) : dau), tone: k.monTruot.length ? 'warn' : null };
  } else if (k.kck && k.kckDuoi) m1 = { ...voiHoTro(kem(kckRieng ? '{dau} dưới kỳ vọng' : '{dau} dưới kỳ vọng · KCK', { dau: k.dau })), tone: null };   // OV-9: không SOS, không màu; mảnh 0 đã nói KCK thì không lặp
  else if (k.kck && k.sos === null && !k.dat) m1 = { ...voiHoTro({ chu: k.overall !== null ? `${k.dau} OVR ${k.overall.toFixed(1)}` : k.dau }), tone: null };   // KCK chưa có Target (không kỳ vọng)
  else if (k.sos) {
    const tam = !(k.chot ?? (k.coDiem === undefined || k.coDiem >= k.soMon));
    m1 = { ...voiHoTro(tam ? kem('{dau} SOS {sos} tạm thời', { dau: k.dau, sos: k.sos }) : { chu: `${k.dau} SOS ${k.sos}` }), tone: toneSos(k.sos) };
  }
  else if (k.dat) m1 = { ...voiHoTro(kem('{dau} đạt kỳ vọng', { dau: k.dau })), tone: null };
  else m1 = { ...voiHoTro(kem('{dau} chưa đủ điểm', { dau: k.dau })), tone: null };

  const ds = [m0, m1, m2, m3].filter((x): x is ManhCau => !!x).slice(0, 3);
  if (!m2 && !m3 && !hoTro && ds.length < 3) ds.push({ chu: 'không có việc đang mở', tone: null });
  return !k && !m0 && ds.length === 1 ? [{ chu: 'Chưa có kết quả Test', tone: null }, ...ds] : ds;
}

/** Ô "Học thuật" (K3-03, Q7): số = số Case MỞ của chính bảng kỹ năng; mỗi Case một dòng `W2 · Quá hạn · ghi kết quả`. */
export function oHocThuat(rows: readonly {
  short: string | null; label: string; category: string; missed: boolean | null;
  cases: readonly {
    status: string; trangThaiV4?: { t: string; k?: string; chu?: string } | null; viecTiep?: { chu: string } | null;
    plans?: readonly { actionOverdue?: boolean }[];
  }[];
}[], tamDungTu: string | null = null, homNay: string | null = null): { so: number; dong: { kn: string; nhan: string; nhanK?: ChuKhoa; t: string; viec: string | null; category: string }[]; phu: string | null } {
  const dong: { kn: string; nhan: string; nhanK?: ChuKhoa; t: string; viec: string | null; category: string }[] = [];
  let phu: string | null = null;
  for (const r of rows) {
    for (const c of r.cases.filter((x) => x.status !== 'done')) {
      const quaHanGhi = (c.plans ?? []).some((p) => p.actionOverdue);
      const t = quaHanGhi ? 'qua-han' : c.trangThaiV4?.t ?? 'dang-lam';
      const v = c.viecTiep?.chu ?? '';
      const viec = quaHanGhi || /^Kết quả/.test(v) ? 'kết quả'
        : v === 'Xác nhận Case' ? 'xác nhận Case' : v === 'Mô tả Case' ? 'mô tả Case'
        : /^Xác nhận PA/.test(v) ? 'xác nhận PA' : null;
      /* T65 + Q13 (UXF-b): em Tạm dừng — MỌI hạn dừng: "Quá hạn" và "Cần làm" đổi thành nhãn vàng "Tạm dừng từ dd/mm" (chỉ đổi chữ). */
      if (tamDungTu && (t === 'qua-han' || t === 'can-lam')) { const nhanK = kem('Tạm dừng từ {tu}', { tu: ngay(tamDungTu, homNay) }); dong.push({ kn: r.short ?? r.label, nhan: nhanK.chu, nhanK, t: 'tam-dung', viec: null, category: r.category }); }
      else if (c.trangThaiV4?.k === 'tam') dong.push({ kn: r.short ?? r.label, nhan: c.trangThaiV4.chu ?? '', t, viec: null, category: r.category });   // OV-13a: "Chờ chốt SOS"
      else dong.push({ kn: r.short ?? r.label, nhan: NHAN_TRANG_THAI[t] ?? NHAN_TRANG_THAI['dang-lam'], t, viec, category: r.category });
    }
  }
  /* Gấp lên trước: Quá hạn › Cần làm › Chờ duyệt › Đang làm (trong nhóm giữ thứ tự bảng). */
  const thuTu = ['qua-han', 'tam-dung', 'can-lam', 'cho-duyet', 'dang-lam'];
  dong.sort((a, b) => thuTu.indexOf(a.t) - thuTu.indexOf(b.t));
  /* OV-11d (HV-4, CA2-1): "đạt" chỉ khi MỌI hàng có điểm và đạt; chưa hàng nào có điểm → "chưa có điểm" (không nói đạt khi chưa thi). */
  if (!dong.length) {
    phu = rows.length && rows.every((r) => r.missed === false) ? 'mọi kỹ năng đạt'
      : rows.every((r) => r.missed === null) ? 'chưa có điểm' : 'Không có Case mở';
  }
  return { so: dong.length, dong, phu };
}

/** Ô "Ý thức" (Q7): bậc đã xử lý + tình trạng vi phạm (một nguồn `trangThaiYThuc`). */
export function oYThuc(y: {
  bacTen: string | null; nhom: string | null; soBatBuoc: number; keTiep: string | null; han: string | null; quaHanNgay: number | null;
  deXuat: string | null; soMo: number; tamDung: boolean;
} | null, homNay: string | null = null): { tren: string | null; gt: string; phu: string; phuK?: ChuKhoa; tone: 'danger' | 'warn' | 'wait' | null } {
  const tren = y?.bacTen ? 'bậc đã xử lý' : null;
  /* UX-G G5: chưa xử lý lần nào VÀ không có vi phạm mở → "Không có vi phạm" (không đọc như cảnh báo), dòng phụ bỏ vì lặp ý. */
  if (!y || (!y.bacTen && !y.soMo && !y.deXuat)) return { tren, gt: 'Không có vi phạm', phu: '', tone: null };
  const gt = y.bacTen ?? 'Chưa xử lý lần nào';
  const vp = kem('{n} vi phạm / 2 tuần → bắt buộc {ke}', { n: y.soBatBuoc, ke: y.keTiep ?? 'xử lý' });
  const k = (phuK: ChuKhoa, tone: 'danger' | 'warn' | 'wait' | null) => ({ tren, gt, phu: phuK.chu, phuK, tone });
  if (y.nhom === 'qua_han' && !y.tamDung) return k(y.quaHanNgay ? kem('{vp} · quá hạn {n} ngày', { vp, n: y.quaHanNgay }) : kem('{vp} · quá hạn', { vp }), 'danger');
  if (y.nhom === 'bat_buoc' && !y.tamDung) return k(y.han ? kem('{vp} · hạn hết {han}', { vp, han: ngay(y.han, homNay) }) : vp, 'warn');
  if (y.nhom === 'cho_duyet') return k(kem('đề xuất {de} chờ Quản lý duyệt', { de: y.deXuat ?? 'xử lý' }), 'wait');
  if (y.soMo > 0) return k(kem(y.tamDung ? '{n} vi phạm mở · hạn đang dừng' : '{n} vi phạm mở · chưa bắt buộc', { n: y.soMo }), null);
  return { tren, gt, phu: 'không có vi phạm mở', tone: null };
}

/** Ô "Sắp tới" (Q7): mốc kế tiếp — FT MT + kỳ vọng; lớp thường Giữa/Cuối khoá + xét lên; sau Cuối khoá chờ quyết định chuyển lớp; đã khép → kết luận. */
export function oSapToi(i: {
  ketLuan: string | null; sauCuoiKhoa: { tuanKetThuc: string | null } | null;
  next: { dau: string; attemptNo: number; tuan: string | null; kyVong: number | null; soPhan: number; final: boolean } | null;
  ratio: boolean; kck: boolean; bacKe: string | null; homNay: string;
  /** Em đang Tạm dừng (mockup 24 D1): mốc vẫn giữ, chữ phụ "giữ lịch · Quản lý dời nếu cần". */
  tamDung?: boolean;
  /** LT-SV: lịch thi thật (`trangThaiLichThi`, chỉ FT) — ngày thi sớm hơn MT kế thì ô là kỳ thi; không MT kế mà "chưa chốt ngày" thì nói điều đó. */
  thi?: LichThi | null;
}): { tren: string; gt: string; gtK?: ChuKhoa; phu: string | null; phuK?: ChuKhoa; thi?: boolean } {
  if (i.ketLuan) { const gtK = kem('Kết luận: {kl}', { kl: i.ketLuan }); return { tren: 'lộ trình đã khép', gt: gtK.chu, gtK, phu: null }; }
  if (i.sauCuoiKhoa) {
    const phuK = i.sauCuoiKhoa.tuanKetThuc ? kem('chờ Quản lý quyết định · lớp kết thúc {tuan}', { tuan: tuanLich(i.sauCuoiKhoa.tuanKetThuc, i.homNay) }) : { chu: 'chờ Quản lý quyết định' };
    return { tren: 'sau Final Test', gt: 'Chuyển lớp', phu: phuK.chu, phuK };
  }
  const n = i.next;
  const l = i.thi;
  if (l && ((l.trangThai === 'da-chot-ngay' && (!n?.tuan || (l.ngay as string) < n.tuan)) || (!n && l.trangThai === 'chua-chot-ngay'))) {
    return { tren: 'mốc kế tiếp', gt: nhanLichThi(l, i.homNay), phu: n ? `${n.dau}${n.tuan ? ` · ${tuanLich(n.tuan, i.homNay)}` : ''}` : null, thi: true };
  }
  if (!n) return { tren: 'mốc kế tiếp', gt: 'Chưa có mốc', phu: 'chưa xếp lịch Test' };
  const gt = n.tuan ? `${n.dau} · ${tuanLich(n.tuan, i.homNay)}` : n.dau;
  if (i.tamDung) return { tren: 'mốc kế tiếp', gt, phu: 'giữ lịch · Quản lý dời nếu cần' };
  const phu = (phuK: ChuKhoa) => ({ tren: 'mốc kế tiếp', gt, phu: phuK.chu, phuK });
  if (i.ratio) return phu(n.final && i.bacKe ? kem('{n} môn · xét lên {bac}', { n: n.soPhan, bac: i.bacKe }) : kem('{n} môn', { n: n.soPhan }));
  if (i.kck && n.kyVong === null) return phu(n.attemptNo > 1 ? kem('so với MT{so}, không kỳ vọng', { so: n.attemptNo - 1 }) : { chu: 'không kỳ vọng' });   // OV-9: KCK chưa có Target
  return phu(n.kyVong !== null ? kem('kỳ vọng {kv} · {n} phần', { kv: n.kyVong.toFixed(1), n: n.soPhan }) : kem('{n} phần', { n: n.soPhan }));
}

// ====================================================================== bảng kỹ năng: chữ của hàng PA và cột Việc tiếp (PR-VAI-b Task 6)

/** Khoảng PA nói MÃ TUẦN (Q19, Q30-6): `từ W3 SEP` · `W3 SEP → W1 OCT` (đã xong) — mốc quy chế nối sau (`· đến MT2 · W4 OCT`). */
export function chuKhoangPa(p: { startedOn: string | null; completedOn: string | null; mocChu?: string | null }, homNay: string): string | null {
  const dau = p.startedOn ? (p.completedOn ? `${tuanLich(p.startedOn, homNay)} → ${tuanLich(p.completedOn, homNay)}` : t('từ {tuan}', { tuan: tuanLich(p.startedOn, homNay) })) : null;
  return [dau, p.mocChu ? dich(p.mocChu) : null].filter(Boolean).join(' · ') || null;   // mocChu máy chủ dựng (chữ Việt) → tiếng của trang
}

/** Kết quả gần nhất của PA: `Tiến bộ một phần · W3 SEP` (tuần của lần ghi, không dd/mm). */
export function chuKetQuaPa(nhan: string | null, ngay: string | null, homNay: string): string | null {
  if (!nhan) return null;
  return ngay ? `${nhan} · ${tuanLich(ngay, homNay)}` : nhan;
}

/**
 * VIỆC TIẾP của một hàng kỹ năng (K3-07, Q3): việc của Case đang mở có hạn sớm nhất + NGƯỜI LÀM (`nguoiLam` máy chủ tính một chỗ).
 * Dòng phụ: `hạn hết 02/10 · Đỗ Thanh Tùng` · quá hạn: `quaHan` = "quá hạn 3 ngày" (giao diện thêm ⚠ SVG, đỏ).
 */
export function viecTiepHang(cases: readonly {
  status: string; viecTiep?: { chu: string; loaiHan: DeadlineKind | null; han: string | null } | null; nguoiLam?: { id: number | null; ten: string | null } | null;
}[], homNay: string): { viec: string; han: string | null; quaHan: string | null; homNay: boolean; ganHan: boolean; nguoi: string | null; title: string } | null {
  const c = cases.filter((x) => x.status !== 'done' && x.viecTiep)
    .sort((a, b) => (a.viecTiep!.han ?? '9999').localeCompare(b.viecTiep!.han ?? '9999'))[0];
  if (!c) return null;
  const v = c.viecTiep!;
  const d = v.loaiHan && v.han ? deadlineView({ kind: v.loaiHan, due: v.han, today: homNay }) : null;
  const nguoi = c.nguoiLam?.ten ?? null;
  return {
    viec: v.chu, han: d && d.han !== CHUA_CO_HAN ? d.han : null, quaHan: d?.quaHan ?? null, homNay: !!d?.homNay, ganHan: !!d?.ganHan, nguoi,
    title: [d && d.han !== CHUA_CO_HAN ? d.text : v.chu, nguoi].filter(Boolean).join(' · '),
  };
}
