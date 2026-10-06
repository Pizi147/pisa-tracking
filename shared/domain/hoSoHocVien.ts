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
import { chuTamDung } from './students.ts';
import { ngay, tuanLich } from './hienThiNgay.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, type ViolationCategory } from './yThuc.ts';

// ====================================================================== ba tab (D2, A6)

export const HO_SO_TABS = ['hoc-thuat', 'y-thuc', 'hanh-trinh'] as const;
export type HoSoTab = (typeof HO_SO_TABS)[number];
export const HO_SO_TAB_LABEL: Record<HoSoTab, string> = {
  'hoc-thuat': 'Học thuật', 'y-thuc': 'Ý thức & Phối hợp', 'hanh-trinh': 'Hành trình',
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
  const text = tong === 0 ? 'Chưa có PA'
    : coKetQua === 0 ? `${tong} PA · chưa có kết quả`
    : coKetQua === tong ? `${tong} PA · đủ kết quả` : `${tong} PA · ${coKetQua} có kết quả`;
  let tiep: { text: string; due: string | null; overdue: boolean } | null = null;
  if (c.status !== 'done') {
    const chay = plans.filter(dangChay);
    const choDuyet = chay.find((p) => p.pendingApproval);
    const coHan = chay.filter((p) => p.actionDue).sort((a, b) => a.actionDue!.localeCompare(b.actionDue!))[0];
    const quaHanRoi = chay.filter((p) => p.actionDue && p.actionOverdue).sort((a, b) => a.actionDue!.localeCompare(b.actionDue!))[0];
    if (quaHanRoi) tiep = { text: 'Ghi kết quả', due: quaHanRoi.actionDue, overdue: true };
    else if (choDuyet) tiep = { text: 'Chờ Quản lý trả lời', due: choDuyet.approvalDue, overdue: false };
    else if (coHan) tiep = { text: 'Ghi kết quả', due: coHan.actionDue, overdue: coHan.actionOverdue };
    else if (c.followUntil) tiep = { text: 'Ghi kết quả', due: c.followUntil, overdue: c.followOverdue };
  }
  return { coKetQua, tong, text, tiep };
}

/** Phần 3 ("Việc tiếp theo") của một khối phương án. */
export function viecTiepPhuongAn(p: PhuongAnTomTat): {
  loai: 'cho-duyet' | 'cho-xac-nhan' | 'ghi-cuoi' | 'ghi-ket-qua' | 'da-xong'; text: string; due: string | null; overdue: boolean;
} {
  if (p.pendingApproval) return { loai: 'cho-duyet', text: 'Chờ Quản lý trả lời', due: p.approvalDue, overdue: false };
  /* PR-SOS: PA quy chế chờ xác nhận chưa chạy — việc là Xác nhận PA (hạn ở Case). Tuần chạm mốc → Ghi kết quả cuối. */
  if (p.choXacNhan) return { loai: 'cho-xac-nhan', text: 'Chờ xác nhận', due: null, overdue: false };
  if (p.lanCuoi && dangChay(p)) return { loai: 'ghi-cuoi', text: 'Ghi kết quả cuối', due: p.actionDue, overdue: p.actionOverdue };
  if (dangChay(p)) return { loai: 'ghi-ket-qua', text: 'Ghi kết quả', due: p.actionDue, overdue: p.actionOverdue };
  return { loai: 'da-xong', text: p.closedReason === 'superseded' ? 'Được thay thế' : 'Đã kết thúc', due: p.completedOn, overdue: false };
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
  overall: number | null; expectation: number | null; sosLevel: number | null;
  /** Chỉ lớp thường — dùng để đếm số môn chưa đạt THẬT (`sosLevel` bị chặn trần ở 3, không dùng được khi trượt cả 4). */
  skills?: { outcome: string }[] | null;
  /** Chỉ lớp thường: % tổng (chưa làm tròn) — Cuối khoá đủ điểm thì ô ghi `66%` như hộp Kết luận khoá (PR-S5F-a). */
  tyLeTong?: number | null;
  /** M-14: `false` = MT lịch sử có tuần thi ngoài 4 tuần trước ngày tạo — không phải "hiện trạng". Thiếu = tính. */
  sinhViec?: boolean;
};
export type KetQuaTestGanNhat = {
  attemptId: number; nhan: string; coDiem: number; yeuCau: number;
  dat: boolean | null; sos: number | null;
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
    .filter((x) => x.status !== 'cancelled' && x.scored > 0 && x.sinhViec !== false && x.kind !== 'mt0')   // PR-MT0: không là kết quả gần nhất
    .sort((x, y) => y.attemptNo - x.attemptNo)[0];
  if (!a) return null;
  const ratio = a.mode === 'ratio';
  const dau = ratio ? (a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá') : `MT${a.attemptNo}`;
  const nhan = a.weekStart ? `${dau} · ${tuanLich(a.weekStart, homNay)}` : dau;
  const dat = ratio
    ? (a.complete ? a.sosLevel === 0 : null)
    : (a.complete && a.overall !== null && a.expectation !== null ? a.overall >= a.expectation : null);
  const soMonChuaDat = ratio ? (a.skills ?? []).filter((s) => s.outcome === 'fail').length : null;
  return {
    attemptId: a.id, nhan, coDiem: a.scored, yeuCau: a.required, dat, sos: a.sosLevel, soMonChuaDat,
    dungKetQuaDot: a.required >= 1 && a.required <= ATTEMPT_SKILL_UNITS,
    phanTram: ratio && a.kind === 'final' && a.complete && a.tyLeTong != null ? Math.round(a.tyLeTong * 100) : null,
  };
}

// ====================================================================== đầu hồ sơ "hiểu trong 30 giây" (PR-VAI-b Task 3, mockup 24)

/** Màu một mảnh: đỏ quá hạn · vàng bắt buộc / tạm dừng · cam SOS 2 (`late`) · tím chờ duyệt · xanh dương sắp chuyển (Q6). */
export type ToneManh = 'danger' | 'warn' | 'sos1' | 'sos2' | 'sos3' | 'wait' | 'accent' | null;
export type ManhCau = { chu: string; tone: ToneManh };

/** "A" · "A và B" · "A, B và C". */
export const noiVa = (ds: readonly string[]): string => (ds.length < 2 ? ds.join('') : `${ds.slice(0, -1).join(', ')} và ${ds[ds.length - 1]}`);
const toneSos = (n: number): ToneManh => (n >= 3 ? 'sos3' : n === 2 ? 'sos2' : 'sos1');
/** Việc học thuật (mệnh đề 2) — Ý thức, Báo PH, Bàn giao không tính ở đây. */
const VIEC_HOC_THUAT = new Set(['nguyen-nhan', 'de-ra-pa', 'xac-nhan-pa', 'ghi-ket-qua', 'ke-hoach', 'cho-duyet', 'mini-test']);

export type DauVaoCau = {
  /** Mệnh đề 0 — một trạng thái đặc biệt (máy chủ chọn theo thứ tự đã kết thúc › tạm dừng › sắp chuyển › KCK). */
  dacBiet: { loai: 'ket-thuc' } | { loai: 'tam-dung'; tu: string } | { loai: 'sap-chuyen'; lop: string; tuan: string } | { loai: 'kck' } | null;
  /** Đợt Test gần nhất. FT: `dau` = "MT1"; lớp thường: "Giữa khoá" / "Cuối khoá". `monTruot`: tên ngắn môn không đạt (lớp thường). */
  ketQua: {
    dau: string; ratio: boolean; sos: number | null; dat: boolean | null; overall: number | null; kck: boolean;
    soDat: number; soMon: number; monTruot: string[]; phanTram: number | null;
    /** Số kỹ năng đã có điểm (FT). Thiếu so với `soMon` thì SOS chỉ là số tạm → câu phải ghi "tạm thời" (UX-G G1). */
    coDiem?: number;
  } | null;
  /** Tên đầy đủ các kỹ năng có Case đang mở. */
  hoTro: string[];
  /** Mọi việc của em (cả của người xem lẫn người khác) — `dauHoSo.viec`. */
  viec: { loai: string; chu: string; kyNangTen: string | null; quaHanNgay: number | null }[];
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
  const m0: ManhCau | null = !d ? null
    : d.loai === 'ket-thuc' ? { chu: 'Đã kết thúc', tone: null }
    : d.loai === 'tam-dung' ? { chu: chuTamDung(ngay(d.tu, i.homNay), true), tone: 'warn' }
    : d.loai === 'sap-chuyen' ? { chu: `Sắp chuyển ${d.lop} từ ${tuanLich(d.tuan, i.homNay)}`, tone: 'accent' }
    : { chu: 'KCK · không đặt kỳ vọng MT, không SOS', tone: null };

  const k = i.ketQua;
  const hoTro = i.hoTro.length ? `đang hỗ trợ ${noiVa(i.hoTro)}` : null;
  const voiHoTro = (dau: string) => (hoTro ? `${dau}: ${hoTro}` : dau);
  let m1: ManhCau | null = null;
  if (!k) m1 = hoTro ? { chu: hoTro, tone: null } : null;
  else if (k.ratio) {
    const dau = k.phanTram !== null ? `${k.dau} ${k.phanTram}%` : `${k.dau} ${k.soDat}/${k.soMon} môn đạt`;
    m1 = { chu: k.monTruot.length ? `${dau}: không đạt ${noiVa(k.monTruot)}` : dau, tone: k.monTruot.length ? 'warn' : null };
  } else if (k.kck) m1 = { chu: voiHoTro(k.overall !== null ? `${k.dau} OVR ${k.overall.toFixed(1)}` : k.dau), tone: null };
  else if (k.sos) m1 = { chu: voiHoTro(`${k.dau} SOS ${k.sos}${k.coDiem !== undefined && k.coDiem < k.soMon ? ' tạm thời' : ''}`), tone: toneSos(k.sos) };
  else if (k.dat) m1 = { chu: voiHoTro(`${k.dau} đạt kỳ vọng`), tone: null };
  else m1 = { chu: voiHoTro(`${k.dau} chưa đủ điểm`), tone: null };

  const hoc = i.viec.filter((v) => VIEC_HOC_THUAT.has(v.loai));
  const quaHan = hoc.filter((v) => v.quaHanNgay !== null).sort((a, b) => b.quaHanNgay! - a.quaHanNgay!)[0];
  const choDuyet = hoc.find((v) => v.loai === 'cho-duyet');
  const choNn = hoc.find((v) => v.loai === 'nguyen-nhan');
  const kn = (v: { kyNangTen: string | null }) => (v.kyNangTen ? `${v.kyNangTen} ` : '');
  const m2: ManhCau | null = quaHan
    ? {
      chu: quaHan.loai === 'ghi-ket-qua' ? `PA ${kn(quaHan)}quá hạn ghi kết quả ${quaHan.quaHanNgay} ngày`
        : quaHan.loai === 'nguyen-nhan' ? `${kn(quaHan)}quá hạn xác nhận nguyên nhân ${quaHan.quaHanNgay} ngày`
        : quaHan.loai === 'xac-nhan-pa' ? `${kn(quaHan)}quá hạn xác nhận PA ${quaHan.quaHanNgay} ngày`
        : quaHan.loai === 'ke-hoach' ? `Kế hoạch bổ trợ quá hạn ${quaHan.quaHanNgay} ngày`
        : `${quaHan.chu.split(' · ')[0]} quá hạn ${quaHan.quaHanNgay} ngày`,
      tone: 'danger',
    }
    : choDuyet ? { chu: choDuyet.chu, tone: 'wait' }
    : choNn ? { chu: `${kn(choNn)}chờ xác nhận nguyên nhân`, tone: 'warn' }
    : null;

  const y = i.yThuc;
  const m3: ManhCau | null = !y ? null
    : y.nhom === 'qua_han' ? { chu: `Ý thức: ${y.keTiep ? `bắt buộc ${y.keTiep}, ` : ''}quá hạn${y.quaHanNgay ? ` ${y.quaHanNgay} ngày` : ''}`, tone: 'danger' }
    : y.nhom === 'bat_buoc' ? { chu: `Ý thức: bắt buộc ${y.keTiep ?? 'xử lý'}${y.han ? `, hạn hết ${ngay(y.han, i.homNay)}` : ''}`, tone: 'warn' }
    : y.nhom === 'cho_duyet' ? { chu: `Ý thức: ${y.deXuat ? `đề xuất ${y.deXuat}` : 'đề xuất'} chờ Quản lý`, tone: 'wait' }
    : null;

  const ds = [m0, m1, m2, m3].filter((x): x is ManhCau => !!x).slice(0, 3);
  if (!m2 && !m3 && !hoTro && ds.length < 3) ds.push({ chu: 'không có việc đang mở', tone: null });
  return !k && !m0 && ds.length === 1 ? [{ chu: 'Chưa có kết quả Test', tone: null }, ...ds] : ds;
}

/** Ô "Học thuật" (K3-03, Q7): số = số Case MỞ của chính bảng kỹ năng; mỗi Case một dòng `W2 · Quá hạn · ghi kết quả`. */
export function oHocThuat(rows: readonly {
  short: string | null; label: string; category: string; missed: boolean | null;
  cases: readonly {
    status: string; trangThaiV4?: { t: string } | null; viecTiep?: { chu: string } | null;
    plans?: readonly { actionOverdue?: boolean }[];
    boTro?: { nhom: string; chung: boolean; buoiMoiTuan: number; keHoach: { trangThai: string } | null } | null;
  }[];
}[], tamDungTu: string | null = null, homNay: string | null = null): { so: number; dong: { kn: string; nhan: string; t: string; viec: string | null; category: string }[]; phu: string | null } {
  const dong: { kn: string; nhan: string; t: string; viec: string | null; category: string }[] = [];
  const nhom = new Set<string>();
  let phu: string | null = null;
  for (const r of rows) {
    for (const c of r.cases.filter((x) => x.status !== 'done')) {
      const quaHanGhi = (c.plans ?? []).some((p) => p.actionOverdue);
      const t = quaHanGhi ? 'qua-han' : c.trangThaiV4?.t ?? 'dang-lam';
      const v = c.viecTiep?.chu ?? '';
      const viec = quaHanGhi || /^Ghi kết quả/.test(v) ? 'ghi kết quả'
        : v === 'Xác nhận nguyên nhân' ? 'nguyên nhân'
        : /^Xác nhận PA/.test(v) ? 'xác nhận PA'
        : /kế hoạch/.test(v) ? 'kế hoạch bổ trợ' : null;
      /* T65 + Q13 (UXF-b): em Tạm dừng — MỌI hạn dừng: "Quá hạn" và "Cần làm" đổi thành nhãn vàng "Tạm dừng từ dd/mm" (chỉ đổi chữ). */
      if (tamDungTu && (t === 'qua-han' || t === 'can-lam')) dong.push({ kn: r.short ?? r.label, nhan: chuTamDung(ngay(tamDungTu, homNay), true), t: 'tam-dung', viec: null, category: r.category });
      else dong.push({ kn: r.short ?? r.label, nhan: NHAN_TRANG_THAI[t] ?? NHAN_TRANG_THAI['dang-lam'], t, viec, category: r.category });
      const b = c.boTro;
      if (b && b.keHoach?.trangThai === 'cho' && !nhom.has(b.nhom)) {
        nhom.add(b.nhom);
        phu = `PA Bổ trợ${b.chung ? ' chung' : ''} · ${b.buoiMoiTuan} buổi/tuần · kế hoạch chờ Quản lý`;
      }
    }
  }
  /* Gấp lên trước: Quá hạn › Cần làm › Chờ duyệt › Đang làm (trong nhóm giữ thứ tự bảng). */
  const thuTu = ['qua-han', 'tam-dung', 'can-lam', 'cho-duyet', 'dang-lam'];
  dong.sort((a, b) => thuTu.indexOf(a.t) - thuTu.indexOf(b.t));
  if (!dong.length) phu = rows.some((r) => r.missed === true) ? 'Không có Case mở' : 'mọi kỹ năng đạt';
  return { so: dong.length, dong, phu };
}

/** Ô "Ý thức" (Q7): bậc đã xử lý + tình trạng vi phạm (một nguồn `trangThaiYThuc`). */
export function oYThuc(y: {
  bacTen: string | null; nhom: string | null; soBatBuoc: number; keTiep: string | null; han: string | null; quaHanNgay: number | null;
  deXuat: string | null; soMo: number; tamDung: boolean;
} | null, homNay: string | null = null): { tren: string | null; gt: string; phu: string; tone: 'danger' | 'warn' | 'wait' | null } {
  const tren = y?.bacTen ? 'bậc đã xử lý' : null;
  /* UX-G G5: chưa xử lý lần nào VÀ không có vi phạm mở → "Không có vi phạm" (không đọc như cảnh báo), dòng phụ bỏ vì lặp ý. */
  if (!y || (!y.bacTen && !y.soMo && !y.deXuat)) return { tren, gt: 'Không có vi phạm', phu: '', tone: null };
  const gt = y.bacTen ?? 'Chưa xử lý lần nào';
  const vp = `${y.soBatBuoc} vi phạm / 2 tuần → bắt buộc ${y.keTiep ?? 'xử lý'}`;
  if (y.nhom === 'qua_han' && !y.tamDung) return { tren, gt, phu: `${vp} · quá hạn${y.quaHanNgay ? ` ${y.quaHanNgay} ngày` : ''}`, tone: 'danger' };
  if (y.nhom === 'bat_buoc' && !y.tamDung) return { tren, gt, phu: `${vp}${y.han ? ` · hạn hết ${ngay(y.han, homNay)}` : ''}`, tone: 'warn' };
  if (y.nhom === 'cho_duyet') return { tren, gt, phu: `đề xuất ${y.deXuat ?? 'xử lý'} chờ Quản lý duyệt`, tone: 'wait' };
  if (y.soMo > 0) return { tren, gt, phu: `${y.soMo} vi phạm mở · ${y.tamDung ? 'hạn đang dừng' : 'chưa bắt buộc'}`, tone: null };
  return { tren, gt, phu: 'không có vi phạm mở', tone: null };
}

/** Ô "Sắp tới" (Q7): mốc kế tiếp — FT MT + kỳ vọng; lớp thường Giữa/Cuối khoá + xét lên; sau Cuối khoá chờ quyết định chuyển lớp; đã khép → kết luận. */
export function oSapToi(i: {
  ketLuan: string | null; sauCuoiKhoa: { tuanKetThuc: string | null } | null;
  next: { dau: string; attemptNo: number; tuan: string | null; kyVong: number | null; soPhan: number; final: boolean } | null;
  ratio: boolean; kck: boolean; bacKe: string | null; homNay: string;
  /** Em đang Tạm dừng (mockup 24 D1): mốc vẫn giữ, chữ phụ "giữ lịch · Quản lý dời nếu cần". */
  tamDung?: boolean;
}): { tren: string; gt: string; phu: string | null } {
  if (i.ketLuan) return { tren: 'lộ trình đã khép', gt: `Kết luận: ${i.ketLuan}`, phu: null };
  if (i.sauCuoiKhoa) {
    return { tren: 'sau Cuối khoá', gt: 'Chuyển lớp', phu: `chờ Quản lý quyết định${i.sauCuoiKhoa.tuanKetThuc ? ` · lớp kết thúc ${tuanLich(i.sauCuoiKhoa.tuanKetThuc, i.homNay)}` : ''}` };
  }
  const n = i.next;
  if (!n) return { tren: 'mốc kế tiếp', gt: 'Chưa có mốc', phu: 'chưa xếp lịch Test' };
  const gt = n.tuan ? `${n.dau} · ${tuanLich(n.tuan, i.homNay)}` : n.dau;
  if (i.tamDung) return { tren: 'mốc kế tiếp', gt, phu: 'giữ lịch · Quản lý dời nếu cần' };
  if (i.ratio) return { tren: 'mốc kế tiếp', gt, phu: `${n.soPhan} môn${n.final && i.bacKe ? ` · xét lên ${i.bacKe}` : ''}` };
  if (i.kck) return { tren: 'mốc kế tiếp', gt, phu: n.attemptNo > 1 ? `so với MT${n.attemptNo - 1}, không kỳ vọng` : 'không kỳ vọng' };
  return { tren: 'mốc kế tiếp', gt, phu: `${n.kyVong !== null ? `kỳ vọng ${n.kyVong.toFixed(1)} · ` : ''}${n.soPhan} phần` };
}

// ====================================================================== bảng kỹ năng: chữ của hàng PA và cột Việc tiếp (PR-VAI-b Task 6)

/** Khoảng PA nói MÃ TUẦN (Q19, Q30-6): `từ W3 SEP` · `W3 SEP → W1 OCT` (đã xong) — mốc quy chế nối sau (`· đến MT2 · W4 OCT`). */
export function chuKhoangPa(p: { startedOn: string | null; completedOn: string | null; mocChu?: string | null }, homNay: string): string | null {
  const dau = p.startedOn ? (p.completedOn ? `${tuanLich(p.startedOn, homNay)} → ${tuanLich(p.completedOn, homNay)}` : `từ ${tuanLich(p.startedOn, homNay)}`) : null;
  return [dau, p.mocChu || null].filter(Boolean).join(' · ') || null;
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
}[], homNay: string): { viec: string; han: string | null; quaHan: string | null; homNay: boolean; nguoi: string | null; title: string } | null {
  const c = cases.filter((x) => x.status !== 'done' && x.viecTiep)
    .sort((a, b) => (a.viecTiep!.han ?? '9999').localeCompare(b.viecTiep!.han ?? '9999'))[0];
  if (!c) return null;
  const v = c.viecTiep!;
  const d = v.loaiHan && v.han ? deadlineView({ kind: v.loaiHan, due: v.han, today: homNay }) : null;
  const nguoi = c.nguoiLam?.ten ?? null;
  return {
    viec: v.chu, han: d && d.han !== CHUA_CO_HAN ? d.han : null, quaHan: d?.quaHan ?? null, homNay: !!d?.homNay, nguoi,
    title: [d && d.han !== CHUA_CO_HAN ? d.text : v.chu, nguoi].filter(Boolean).join(' · '),
  };
}

/**
 * THẺ KỸ NĂNG TRÊN ĐIỆN THOẠI (UX-D3, mockup 24 E): kỹ năng có Case mở lên trước (Case quá hạn trước nữa), kỹ năng không Case mở và không
 * dưới kỳ vọng → thẻ gọn một dòng. Trong mỗi nhóm giữ thứ tự bảng.
 */
export function xepTheKyNang<R extends {
  missed: boolean | null;
  cases: readonly { status: string; trangThaiV4?: { t: string } | null; plans?: readonly { actionOverdue?: boolean }[] }[];
}>(rows: readonly R[]): { row: R; gon: boolean }[] {
  const bac = (r: R) => {
    const mo = r.cases.filter((c) => c.status !== 'done');
    if (mo.some((c) => c.trangThaiV4?.t === 'qua-han' || (c.plans ?? []).some((p) => p.actionOverdue))) return 0;
    return mo.length ? 1 : 2;
  };
  return rows.map((row, i) => ({ row, i, b: bac(row) }))
    .sort((a, b) => a.b - b.b || a.i - b.i)
    .map(({ row, b }) => ({ row, gon: b === 2 && row.missed !== true }));
}
