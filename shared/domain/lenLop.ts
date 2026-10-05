/**
 * LÊN LỚP, CHUYỂN LỚP — luật thuần dùng chung cho Lộ trình tiếp theo, Chuyển lớp một em, Chuyển tiếp cả lớp
 * (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.9, kế hoạch 2026-09-23-pr-lt-len-lop-chuyen-lop.md).
 */
import { NORMAL_LADDER } from './fasttrack.ts';
import type { ProgrammeCode } from './normal.ts';
import { kyHieuLop } from './tenLop.ts';

// ---------------------------------------------------------------- hướng (Q1, Q4, Q9)

/** PR-K26: `chua_quyet` thay hai hướng trùng nghĩa cũ `chua_ro` (bước 1) và `xep_sau` (bước 2) — migrate `prK26` đổi dữ liệu. */
export type Huong = 'len_lop' | 'fast_track' | 'hoc_lai' | 'bao_luu' | 'dung_hoc' | 'chua_quyet';

/** Bước 1 — Lộ trình tiếp theo (ghi cho từng em, chưa đổi lớp). Ngày xem lại của "Chưa quyết" tuỳ chọn. */
export const HUONG_TIEP: readonly Huong[] = ['len_lop', 'fast_track', 'hoc_lai', 'bao_luu', 'dung_hoc', 'chua_quyet'];
/** Bước 2 — Chuyển tiếp lớp (chốt thật): "Chưa quyết" bắt buộc lý do + ngày xem lại. */
export const HUONG_CHUYEN_TIEP: readonly Huong[] = HUONG_TIEP;

/** Form cũ đang mở còn gửi `chua_ro`/`xep_sau` → `chua_quyet`; giá trị hợp lệ giữ; còn lại null. */
export function chuanHoaHuong(x: string): Huong | null {
  if (x === 'chua_ro' || x === 'xep_sau') return 'chua_quyet';
  return (HUONG_TIEP as readonly string[]).includes(x) ? x as Huong : null;
}

/**
 * PR-K26: thứ tự hiện hướng theo gợi ý Cuối khoá (gợi ý KHÔNG lưu — Rulebook §20.6). `len` → Lên lớp đứng đầu; `hoc_lai` → Học lại;
 * 50–59% (`canQuanLy`) → cả hai. Không có gợi ý (chưa đủ điểm) → `dau` rỗng, danh sách như cũ. Hướng không có trong `cacHuong` (ELE không
 * có `len_lop`) bị bỏ khỏi `dau`.
 */
export function xepHuongTheoGoiY(
  cacHuong: readonly Huong[], goiY: { huong: 'hoc_lai' | 'len' | null; canQuanLy: boolean } | null | undefined,
): { dau: Huong[]; khac: Huong[] } {
  const muon: Huong[] = !goiY ? [] : goiY.canQuanLy ? ['len_lop', 'hoc_lai'] : goiY.huong === 'len' ? ['len_lop'] : goiY.huong === 'hoc_lai' ? ['hoc_lai'] : [];
  const dau = muon.filter((h) => cacHuong.includes(h));
  return { dau, khac: cacHuong.filter((h) => !dau.includes(h)) };
}

/** Lớp ELE không còn bậc Normal kế — bỏ "Lên lớp thường tiếp" khỏi lựa chọn. */
export function huongTiepKhaDung(ma: ProgrammeCode | null, tap: readonly Huong[] = HUONG_TIEP): Huong[] {
  return tap.filter((h) => h !== 'len_lop' || !!NORMAL_LADDER[ma as ProgrammeCode]);
}

type NguCanhNhan = { ma: ProgrammeCode | null; maKe: ProgrammeCode | null; ngayXemLai?: string | null };
/** PR-K26: tên bậc hiện trên màn ("Pre FOU"), không mã thô ("PREFOU"). */
const ten = (x: ProgrammeCode | null | undefined) => (x ? kyHieuLop(x, null) ?? x : '—');
function nhan(h: Huong, ctx: NguCanhNhan, ngan: boolean): string {
  const ma = ten(ctx.ma);
  const maKe = ten(ctx.maKe ?? NORMAL_LADDER[ctx.ma as ProgrammeCode]);
  switch (h) {
    case 'len_lop': return ngan ? `Lên ${maKe}` : `Lên lớp thường tiếp (${maKe})`;
    case 'fast_track': return 'Lên FT';
    case 'hoc_lai': return `Học lại ${ma}`;
    case 'bao_luu': return 'Tạm dừng học (bảo lưu)';
    case 'dung_hoc': return 'Dừng học hẳn';
    case 'chua_quyet': return ngan && ctx.ngayXemLai ? `Chưa quyết · xem lại ${ctx.ngayXemLai.slice(8, 10)}/${ctx.ngayXemLai.slice(5, 7)}` : 'Chưa quyết';
  }
}

/** Nhãn đầy đủ cho form (mockup 11-1): "Lên lớp thường tiếp (BE)", "Lên FT", … */
export function nhanHuong(h: Huong, ctx: { ma: ProgrammeCode | null; maKe: ProgrammeCode | null }): string {
  return nhan(h, ctx, false);
}
/** Nhãn ngắn cho bảng: "Lên BE", "Lên FT", "Chưa quyết · xem lại 28/09" (có ngày xem lại), … */
export function nhanHuongNgan(h: Huong, ctx: NguCanhNhan): string {
  return nhan(h, ctx, true);
}

/**
 * Chữ ngắn "tiếp theo: …" cho cột Khoá và dòng dưới tên Hồ sơ HV.
 * `chua_quyet`/không có bản ghi → `null` (Q4 — không tắt nhắc, vẫn tính là chưa có lộ trình).
 */
export function nhanTiepTheo(banGhi: { huong: Huong } | null | undefined, ma: ProgrammeCode | null): string | null {
  if (!banGhi) return null;
  switch (banGhi.huong) {
    case 'len_lop': return NORMAL_LADDER[ma as ProgrammeCode] ? ten(NORMAL_LADDER[ma as ProgrammeCode]) : null;
    case 'fast_track': return 'Fast Track';
    case 'hoc_lai': return ma ? `học lại ${ten(ma)}` : null;
    case 'bao_luu': return 'tạm dừng học (bảo lưu)';
    case 'dung_hoc': return 'dừng học hẳn';
    default: return null; // chua_quyet
  }
}

// ---------------------------------------------------------------- luật lộ trình — MỘT CHỖ (Task 4, §3.9)

/** `lt`: lộ trình của lớp (FT) — thiếu (dữ liệu cũ) thì FT → FT giữ như cũ (Q7). */
export type LoaiLop = { ma: ProgrammeCode | null; ft: boolean; lt?: string | null };
export type EndKind = 'len_lop' | 'hoc_lai' | 'sang_ft' | 'chuyen_lop' | 'bao_luu' | 'dung_hoc' | 'ket_thuc';
export type LuatDoiLop = {
  khoa: 'giu' | 'dong-mo';            // giữ lộ trình/khoá đang chạy, hay đóng ('completed') rồi mở cái mới
  dongCase: 'ft' | 'normal' | null;   // tham số `to` của closeCasesOnProgrammeSwitch; null = Case đi theo em
  canMucTieu: boolean;                // sang FT: Target (bắt buộc khi chuyển thật), tháng thi (không bắt buộc)
  endKind: EndKind;                   // ghi vào enrollments.end_kind của dòng cũ → "Kết thúc vì"
};
export function luatDoiLop(tu: LoaiLop, den: LoaiLop, boiCanh: 'giua-khoa' | 'cuoi-khoa'): LuatDoiLop {
  if (tu.ft && den.ft) {   // K2-17, M-20: khác lộ trình = mở lộ trình mới, Case đi theo em
    return tu.lt && den.lt && tu.lt !== den.lt
      ? { khoa: 'dong-mo', dongCase: null, canMucTieu: false, endKind: 'chuyen_lop' }
      : { khoa: 'giu', dongCase: null, canMucTieu: false, endKind: 'chuyen_lop' };
  }
  if (tu.ft) return { khoa: 'dong-mo', dongCase: 'normal', canMucTieu: false, endKind: 'chuyen_lop' };   // Q10
  if (den.ft) return { khoa: 'dong-mo', dongCase: 'ft', canMucTieu: true, endKind: 'sang_ft' };          // S17
  if (boiCanh === 'cuoi-khoa') {
    return { khoa: 'dong-mo', dongCase: null, canMucTieu: false, endKind: den.ma === tu.ma ? 'hoc_lai' : 'len_lop' };
  }
  if (den.ma === tu.ma) return { khoa: 'giu', dongCase: null, canMucTieu: false, endKind: 'chuyen_lop' };
  return { khoa: 'dong-mo', dongCase: null, canMucTieu: false, endKind: 'chuyen_lop' };                   // Q11
}

export const END_KIND_LABEL: Record<EndKind, string> = {
  len_lop: 'Lên lớp', hoc_lai: 'Học lại', sang_ft: 'Lên FT', chuyen_lop: 'Chuyển lớp',
  bao_luu: 'Tạm dừng học (bảo lưu)', dung_hoc: 'Dừng học hẳn', ket_thuc: 'Kết thúc học',
};

/** "Kết thúc vì" của dòng lịch sử lớp (Q18). Dòng cũ không có `end_kind` thì suy từ `status` cũ. */
export function nhanKetThucVi(endKind: EndKind | null | undefined, status: string | null | undefined): string | null {
  if (endKind) return END_KIND_LABEL[endKind];
  if (status === 'transferred') return 'Chuyển lớp';
  if (status === 'completed') return 'Kết thúc học';
  if (status === 'paused') return 'Tạm dừng học';
  return null;
}

// ---------------------------------------------------------------- hai tuần cuối khoá (Q6)

/** `currentWeek >= totalWeeks - 1`, và luôn đúng khi lớp đã hết khoá (phase 'finished'). */
export function trongHaiTuanCuoi(tuanHienTai: number | null, tongTuan: number | null, phase: string): boolean {
  if (phase === 'finished') return true;
  if (tuanHienTai === null || tongTuan === null) return false;
  return tuanHienTai >= tongTuan - 1;
}

// ---------------------------------------------------------------- kiểm dòng Chuyển tiếp lớp (Task 5, Task 7)

export type DongChuyenTiep = {
  huong: Huong | null;
  toClassId?: number | null;
  toClass?: { ma: ProgrammeCode | null; ft: boolean } | null;   // lớp chuyển đến đã resolve từ toClassId
  mucTieu?: number | null;
  thangThi?: string | null;
  lyDo?: string | null;
  ngayXemLai?: string | null;
};

/** Câu lỗi đầu tiên tìm thấy, hoặc `null` khi dòng hợp lệ. Dùng cả ở máy chủ (Task 5) và web (Task 7, việc mờ nút). */
export function kiemDongChuyenTiep(dong: DongChuyenTiep, ctx: { maTu: ProgrammeCode | null }): string | null {
  if (!dong.huong) return 'Thiếu hướng';
  if (dong.huong === 'len_lop' || dong.huong === 'fast_track' || dong.huong === 'hoc_lai') {
    if (!dong.toClassId) return 'Thiếu lớp chuyển đến';
    if (dong.toClass) {
      if (dong.huong === 'len_lop' && (dong.toClass.ft || dong.toClass.ma !== NORMAL_LADDER[ctx.maTu as ProgrammeCode])) {
        return 'Lớp chuyển đến phải là chương trình kế tiếp';
      }
      if (dong.huong === 'hoc_lai' && (dong.toClass.ft || dong.toClass.ma !== ctx.maTu)) {
        return 'Lớp chuyển đến phải cùng chương trình để học lại';
      }
      if (dong.huong === 'fast_track' && !dong.toClass.ft) return 'Lớp chuyển đến phải là Fast Track';
    }
  }
  if (dong.huong === 'fast_track') {
    if (dong.mucTieu === null || dong.mucTieu === undefined) return 'Thiếu Target';
    if (dong.mucTieu < 0 || dong.mucTieu > 9 || Math.round(dong.mucTieu * 2) !== dong.mucTieu * 2) {
      return 'Target phải từ 0 đến 9, cách nhau 0.5';
    }
  }
  if (dong.huong === 'bao_luu' || dong.huong === 'chua_quyet') {
    if (!dong.lyDo) return 'Thiếu lý do';
    if (!dong.ngayXemLai) return 'Thiếu ngày xem lại';
  }
  if (dong.huong === 'dung_hoc' && !dong.lyDo) return 'Thiếu lý do';
  return null;
}

// ---------------------------------------------------------------- tóm tắt bước Xác nhận (Q19)

export type DongTomTat = {
  huong: Huong;
  toClassCode?: string | null;    // mã lớp chuyển đến (kể cả lớp mới) — len_lop, hoc_lai, fast_track
  mucTieu?: number | null;
  caseCount?: number;             // Case đang mở của em ở chương trình đang học
  caseWillClose?: boolean;        // Case sẽ bị hệ thống tự đóng (sang FT — S17)
  baiChuaLam?: number;            // lượt Giữa/Cuối khoá `planned` của khoá đang đóng
};

export function tomTatChuyenTiep(dongs: readonly DongTomTat[]): {
  theoLop: { ma: string; n: number }[];
  sangFt: number;
  khongChuyen: { bao_luu: number; dung_hoc: number; chua_quyet: number };
  caseDiTheo: number;
  caseDong: number;
  baiChuaLam: number;
  cau: string[];
} {
  const theoLopMap = new Map<string, number>();
  let sangFt = 0;
  const khongChuyen = { bao_luu: 0, dung_hoc: 0, chua_quyet: 0 };
  let caseDiTheo = 0;
  let caseDong = 0;
  let baiChuaLam = 0;
  const cauLen: { ma: string; n: number }[] = [];
  const cauHocLai: { ma: string; n: number }[] = [];
  const cauFt: { ma: string; n: number; mucTieu: number | null }[] = [];

  for (const d of dongs) {
    baiChuaLam += d.baiChuaLam ?? 0;
    if (d.caseWillClose) caseDong += d.caseCount ?? 0; else caseDiTheo += d.caseCount ?? 0;
    if (d.huong === 'len_lop' || d.huong === 'hoc_lai') {
      const ma = d.toClassCode ?? '—';
      theoLopMap.set(ma, (theoLopMap.get(ma) ?? 0) + 1);
      const nhom = d.huong === 'len_lop' ? cauLen : cauHocLai;
      const hien = nhom.find((x) => x.ma === ma);
      if (hien) hien.n += 1; else nhom.push({ ma, n: 1 });
    } else if (d.huong === 'fast_track') {
      sangFt += 1;
      const ma = d.toClassCode ?? '—';
      const hien = cauFt.find((x) => x.ma === ma);
      if (hien) { hien.n += 1; hien.mucTieu = hien.mucTieu === d.mucTieu ? hien.mucTieu : null; }
      else cauFt.push({ ma, n: 1, mucTieu: d.mucTieu ?? null });
    } else if (d.huong === 'bao_luu' || d.huong === 'dung_hoc' || d.huong === 'chua_quyet') {
      khongChuyen[d.huong] += 1;
    }
  }

  const cau: string[] = [];
  for (const x of cauLen) cau.push(`${x.n} em lên ${x.ma}`);
  for (const x of cauHocLai) cau.push(`${x.n} em học lại ${x.ma}`);
  for (const x of cauFt) {
    const chiTiet = x.n === 1 && x.mucTieu !== null ? ` (mở lộ trình FT, Target ${x.mucTieu})` : ' (mở lộ trình FT)';
    cau.push(`${x.n} em sang ${x.ma}${chiTiet}`);
  }
  if (khongChuyen.bao_luu) cau.push(`${khongChuyen.bao_luu} em tạm dừng học (bảo lưu)`);
  if (khongChuyen.dung_hoc) cau.push(`${khongChuyen.dung_hoc} em dừng học hẳn`);
  if (khongChuyen.chua_quyet) cau.push(`${khongChuyen.chua_quyet} em chưa quyết`);

  return {
    theoLop: [...theoLopMap.entries()].map(([ma, n]) => ({ ma, n })),
    sangFt, khongChuyen, caseDiTheo, caseDong, baiChuaLam, cau,
  };
}
