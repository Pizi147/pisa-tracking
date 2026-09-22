/**
 * HỌC VIÊN & LỚP + HỒ SƠ LỚP — luật hiển thị thuần (PR-Qa; đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §2, §3.6, §3.7, §4).
 *
 * Mọi quyết định "hiện chữ gì, hiện mấy cái, xếp thế nào" của hai màn nằm ở đây để kiểm được bằng harness máy chủ (web không có bộ
 * kiểm thử). Component React chỉ vẽ.
 */
import { ENTRY_SKILL_LABEL, type EntrySkill } from './skills.ts';
import { REGULAR_SKILL_LABEL, skillShort } from './normal.ts';
import { deadlineView } from './display.ts';
import { tuanKhoa, tuanLich } from './hienThiNgay.ts';
import { CLASS_PHASE_LABEL, type ClassPhase } from './fasttrack.ts';

// ---------------------------------------------------------------- chung

/** Dòng phụ tối đa ~60 ký tự (G-3). Dài hơn thì cắt và thêm "…" — đủ câu nằm ở tooltip của ô. */
export const DONG_PHU_TOI_DA = 60;
export function catDongPhu(s: string): string {
  return s.length <= DONG_PHU_TOI_DA ? s : `${s.slice(0, DONG_PHU_TOI_DA - 1)}…`;
}

/** Mã học viên viết gọn 6 số, chữ mờ (§3.6). Mã không có chữ số thì giữ nguyên. */
export function maHocVienNgan(ma: string | null | undefined): string {
  const so = (ma ?? '').replace(/\D/g, '');
  return so ? so.slice(-6).padStart(6, '0') : (ma ?? '');
}

/** Tên đầy đủ của một kỹ năng/môn — tooltip của chữ viết tắt (G-7). */
export function tenKyNang(k: string): string {
  return ENTRY_SKILL_LABEL[k as EntrySkill] ?? REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL] ?? k;
}

export function laVaiQuanLy(roles: readonly string[] | null | undefined): boolean {
  return (roles ?? []).some((r) => r === 'system_admin' || r === 'manager');
}

// ---------------------------------------------------------------- chip lọc (§3.6, Q4)

export const LOC_HOC_VIEN = ['tat-ca', 'sos', 'case_working', 'case_no_plan', 'case_overdue', 'thieu_tt'] as const;
export type LocHocVien = (typeof LOC_HOC_VIEN)[number];
export const LOC_HOC_VIEN_NHAN: Record<LocHocVien, { nhan: string; goiY: string; can: string | null }> = {
  'tat-ca': { nhan: 'Tất cả', goiY: 'Mọi học viên đang học trong các lớp đang hiện.', can: null },
  sos: { nhan: 'Đang SOS', goiY: 'Kết quả Test gần nhất ở mức SOS 1, 2 hoặc 3.', can: 'case.view' },
  case_working: { nhan: 'Có Case đang xử lý', goiY: 'Có Case đã có PA học thuật và đang theo dõi.', can: 'case.view' },
  case_no_plan: { nhan: 'Case thiếu PA học thuật', goiY: 'Có Case đang mở mà chưa có PA học thuật.', can: 'case.view' },
  case_overdue: { nhan: 'Case quá hạn cập nhật', goiY: 'Có Case đã qua hạn cập nhật kết quả mà chưa ai ghi.', can: 'case.view' },
  thieu_tt: { nhan: 'Thiếu thông tin', goiY: 'Hồ sơ còn thiếu thông tin cần để xếp lịch và theo dõi.', can: null },
};

export type DocLoc = { loc: LocHocVien } | { chuyenDen: string };
/** Khoá `view=` trên URL — giữ khoá cũ để link đã lưu, BranchPulse, WeeklyBoard, signals.ts vẫn mở đúng chip. */
export function docThamSoLoc(view: string | null | undefined): DocLoc {
  if (view === 'sos' || view === 'sos_open') return { loc: 'sos' };
  if (view === 'case_working' || view === 'case_no_plan' || view === 'case_overdue' || view === 'thieu_tt') return { loc: view };
  if (view === 'missing_scores') return { chuyenDen: '/test/can-cham' };
  return { loc: 'tat-ca' };
}

// ---------------------------------------------------------------- phạm vi (§3.6, Q3)

export const PHAM_VI = ['toi', 'chi-nhanh', 'tat-ca'] as const;
export type PhamVi = (typeof PHAM_VI)[number];
export const PHAM_VI_NHAN: Record<PhamVi, string> = { toi: 'Lớp tôi dạy', 'chi-nhanh': 'Chi nhánh', 'tat-ca': 'Tất cả' };

/** Chỉ lựa chọn có nghĩa: QL một chi nhánh thì "Tất cả" trùng "Chi nhánh" nên không có. */
export function phamViCoThe(i: { dayLop: boolean; capChiNhanh: boolean; toanHeThong: boolean; soChiNhanh: number }): PhamVi[] {
  const out: PhamVi[] = [];
  if (i.dayLop) out.push('toi');
  if (i.capChiNhanh || i.toanHeThong) out.push('chi-nhanh');
  if (i.toanHeThong || i.soChiNhanh > 1) out.push('tat-ca');
  return out.length ? out : ['tat-ca'];
}
export function phamViMacDinh(coThe: readonly PhamVi[]): PhamVi {
  if (coThe.includes('toi')) return 'toi';
  if (coThe.includes('tat-ca')) return 'tat-ca';
  return coThe[0] ?? 'tat-ca';
}

// ---------------------------------------------------------------- kết quả gần nhất (§3.6, 07c A, Q11)

/** Đúng các trường `Standing` (server/src/students/standing.ts) mà cột này đọc. */
export type KetQuaVao = {
  mode: 'ielts_band' | 'ratio' | null;
  attemptLabel: string | null;
  sosLevel: number | null; provisional: boolean;
  scored: number; required: number; failed: number | null;
  overall: number | null; expectation: number | null;
  belowSkills: { skill: string; band: number }[];
  failedSkills: { skill: string; score: number; total: number }[];
};
export type KetQuaHien = { chinh: string; thieu: string | null; dat: boolean; sos: string | null; phu: string | null };

const band1 = (n: number) => n.toFixed(1);

export function ketQuaGanNhat(k: KetQuaVao | null): KetQuaHien {
  if (!k || !k.attemptLabel) return { chinh: '—', thieu: null, dat: false, sos: null, phu: 'Chưa có kết quả' };
  const sos = k.sosLevel !== null && k.sosLevel > 0 ? `SOS ${k.sosLevel}${k.provisional ? ' · tạm thời' : ''}` : null;
  const dat = k.sosLevel === 0 && !k.provisional;
  if (k.mode === 'ratio') {
    const soDat = k.scored - (k.failed ?? 0);
    const chinh = k.scored < k.required ? `Đạt ${soDat}/${k.scored} môn đã chấm` : `Đạt ${soDat}/${k.required} môn`;
    const truot = k.failedSkills.map((f) => `${skillShort(f.skill)} ${f.score}/${f.total}`).join(', ');
    const phu = [k.attemptLabel, truot ? `chưa đạt ${truot}` : null,
      k.scored < k.required ? `còn ${k.required - k.scored} môn chưa có điểm` : null].filter(Boolean).join(' · ');
    return { chinh, thieu: null, dat: dat && k.scored === k.required, sos, phu: catDongPhu(phu) };
  }
  const chinh = k.overall !== null ? band1(k.overall) : '—';
  const thieu = k.overall !== null && k.expectation !== null && k.overall < k.expectation
    ? `Thiếu ${band1(k.expectation - k.overall)}` : null;
  const phu: string[] = [k.attemptLabel];
  if (k.expectation !== null) phu.push(`kỳ vọng ${band1(k.expectation)}`);
  if (k.scored < k.required) phu.push(`mới có ${k.scored}/${k.required} kỹ năng`);
  if (k.belowSkills.length) phu.push(`Thiếu ${k.belowSkills.map((b) => `${skillShort(b.skill)} ${band1(b.band)}`).join(', ')}`);
  return { chinh, thieu, dat, sos, phu: catDongPhu(phu.join(' · ')) };
}

// ---------------------------------------------------------------- cột Khoá lớp thường (§3.6, Q21)

export function khoaLopThuong(i: {
  maChuongTrinh: string | null; tuanHienTai: number | null; tongTuan: number | null;
  tuanKetThuc: string | null; tiepTheo: string | null; homNay: string;
}): { chinh: string; phu: string | null } {
  const ma = i.maChuongTrinh ?? '—';
  let tuan: string | null = null;
  if (i.tuanHienTai !== null && i.tuanHienTai < 1) tuan = 'chưa khai giảng';
  else if (i.tuanHienTai !== null && i.tongTuan) tuan = tuanKhoa(Math.min(i.tuanHienTai, i.tongTuan), i.tongTuan);
  const phu = i.tiepTheo ? `tiếp theo: ${i.tiepTheo}` : i.tuanKetThuc ? `kết thúc ${tuanLich(i.tuanKetThuc, i.homNay)}` : null;
  return { chinh: tuan ? `${ma} · ${tuan}` : ma, phu };
}

// ---------------------------------------------------------------- badge hộp lớp / đầu hồ sơ lớp (Q5, Q7)

export type BadgeLop = {
  key: 'het-khoa' | 'thieu-gv' | 'cham' | 'case' | 'chang' | 'thieu-tt'; nhan: string; tone: 'danger' | 'warn' | 'info';
};
const CHANG_THI = ['progress_soon', 'progress_week', 'final_soon', 'final_week'];

export function badgeLop(c: {
  needsPlacement: boolean; studentCount: number; missingSkills: readonly string[]; needScoresText: string | null;
  soCaseMo: number; phase: string; missingCount: number;
}): { hien: BadgeLop[]; an: BadgeLop[] } {
  const all: BadgeLop[] = [];
  if (c.needsPlacement) all.push({ key: 'het-khoa', nhan: `Hết khoá · ${c.studentCount} HV cần xếp lớp tiếp`, tone: 'danger' });
  if (c.missingSkills.length) all.push({ key: 'thieu-gv', nhan: `Thiếu GV ${c.missingSkills.map(skillShort).join(', ')}`, tone: 'warn' });
  if (c.needScoresText) all.push({ key: 'cham', nhan: c.needScoresText, tone: 'warn' });
  if (c.soCaseMo > 0) all.push({ key: 'case', nhan: `${c.soCaseMo} Case đang mở`, tone: 'danger' });
  if (CHANG_THI.includes(c.phase)) all.push({ key: 'chang', nhan: CLASS_PHASE_LABEL[c.phase as ClassPhase], tone: 'info' });
  if (c.missingCount > 0) all.push({ key: 'thieu-tt', nhan: `Thiếu ${c.missingCount} thông tin`, tone: 'warn' });
  return { hien: all.slice(0, 2), an: all.slice(2) };
}

// ---------------------------------------------------------------- dòng GV bộ môn (06c §1)

export type NhomGiaoVien = { id: number | null; ten: string; kyNang: string[]; nhan: string; title: string };
export function nhomGiaoVienBoMon(
  kyNangLop: readonly string[], phanCong: readonly { skill: string; id: number; name: string }[],
): NhomGiaoVien[] {
  const nhom: NhomGiaoVien[] = [];
  const theoKhoa = new Map<string, NhomGiaoVien>();
  for (const k of kyNangLop) {
    const pc = phanCong.find((x) => x.skill === k) ?? null;
    const khoa = pc ? `gv-${pc.id}` : 'chua';
    let g = theoKhoa.get(khoa);
    if (!g) {
      g = { id: pc?.id ?? null, ten: pc?.name ?? 'Chưa phân công', kyNang: [], nhan: '', title: '' };
      theoKhoa.set(khoa, g);
      nhom.push(g);
    }
    g.kyNang.push(k);
  }
  for (const g of nhom) {
    g.nhan = g.kyNang.map(skillShort).join(' · ');
    g.title = g.kyNang.map(tenKyNang).join(' · ');
  }
  return nhom;
}

// ---------------------------------------------------------------- menu ⋯ dòng học viên (§3.7, §4, Q1)

export type MucMenuDong = 'ho-so' | 'vi-pham' | 'case' | 'nhap-diem' | 'lo-trinh-tiep' | 'chuyen-lop';
export const MUC_MENU_DONG_NHAN: Record<MucMenuDong, string> = {
  'ho-so': 'Hồ sơ', 'vi-pham': '+ Ghi nhận vi phạm', case: '+ Case', 'nhap-diem': 'Nhập điểm',
  'lo-trinh-tiep': 'Lộ trình tiếp theo', 'chuyen-lop': 'Chuyển lớp',
};
/**
 * Hai mục thuộc PR-LT (đợt 5). Chưa có màn làm việc đúng luật §3.9 thì KHÔNG hiện (không để nút bấm không làm gì, không để GVCN
 * bấm ra lỗi quyền). PR-LT đổi hằng này thành `true` và gắn panel trong `web/src/modules/classes/thaoTacDongHocVien.tsx`.
 */
export const MENU_DONG_CHO_PR_LT = { loTrinhTiepTheo: false, chuyenLop: false } as const;

export function mucMenuDongHocVien(i: {
  laLopThuong: boolean; dangHoc: boolean; coTheGhiViPham: boolean; coTheBaoCase: boolean;
  coTheNhapDiem: boolean; coTheSuaHocVien: boolean; coTheChuyenLop: boolean;
}, bat: { loTrinhTiepTheo: boolean; chuyenLop: boolean } = MENU_DONG_CHO_PR_LT): MucMenuDong[] {
  const out: MucMenuDong[] = ['ho-so'];
  if (!i.dangHoc) return out;
  if (i.coTheGhiViPham) out.push('vi-pham');
  if (i.coTheBaoCase) out.push('case');
  if (i.coTheNhapDiem) out.push('nhap-diem');
  if (bat.loTrinhTiepTheo && i.laLopThuong && i.coTheSuaHocVien) out.push('lo-trinh-tiep');
  if (bat.chuyenLop && i.coTheChuyenLop) out.push('chuyen-lop');
  return out;
}

// ---------------------------------------------------------------- sắp xếp, lớp mở sẵn (§3.6, Q19)

export type SapXep = 'ten' | 'chu-y';
export type DongDeXep = { ten: string; quaHan: boolean; canhBao: boolean; sosLevel: number | null; soCaseMo: number };
export function diemChuY(r: DongDeXep): number {
  return (r.quaHan ? 1000 : 0) + (r.canhBao ? 500 : 0) + (r.sosLevel ?? 0) * 100 + r.soCaseMo;
}
export function sapXepHocVien<T extends DongDeXep>(rows: readonly T[], cach: SapXep): T[] {
  const theoTen = (a: T, b: T) => a.ten.localeCompare(b.ten, 'vi');
  return [...rows].sort(cach === 'ten' ? theoTen : (a, b) => diemChuY(b) - diemChuY(a) || theoTen(a, b));
}

export function lopMoSan(i: { thamSoOpen: number[] | null; lopHien: number[]; dangLoc: boolean }): number[] {
  if (i.thamSoOpen !== null) return i.thamSoOpen.filter((id) => i.lopHien.includes(id));
  return i.dangLoc ? i.lopHien.slice(0, 5) : i.lopHien.slice(0, 1);
}

// ---------------------------------------------------------------- việc tiếp theo (Q13)

export type CaseChoViec = {
  id?: number; topic: string | null; state: string; nextDue: string | null; dueOverdue: boolean; sosLevel?: number | null;
};
export type ViecTiepTheo = { nhan: string; tone: 'danger' | 'warn' | 'info' };

const nhanKyNang = (topic: string | null) => (topic ? skillShort(topic) : 'Case');

export function viecTiepTheoCua(i: {
  nhapDiem: { kyNang: string[]; dot: string | null; quaHan: boolean } | null;
  cases: readonly CaseChoViec[];
  homNay: string;
}): ViecTiepTheo[] {
  const out: ViecTiepTheo[] = [];
  if (i.nhapDiem && i.nhapDiem.kyNang.length) {
    out.push({
      nhan: `Nhập điểm ${i.nhapDiem.kyNang.map(skillShort).join(', ')}${i.nhapDiem.dot ? ` · ${i.nhapDiem.dot}` : ''}`,
      tone: i.nhapDiem.quaHan ? 'danger' : 'warn',
    });
  }
  for (const c of i.cases) {
    if (c.state === 'done') continue;
    if (c.state === 'no_plan') { out.push({ nhan: `Xác định nguyên nhân ${nhanKyNang(c.topic)}`, tone: 'warn' }); continue; }
    if (!c.nextDue) continue;
    /* Cùng câu với <Han loai="cap-nhat-pa"> (G-10): một hàm `deadlineView` cho mọi chỗ hiện hạn. */
    const v = deadlineView({ kind: 'cap-nhat-pa', due: c.nextDue, today: i.homNay });
    out.push({ nhan: `${nhanKyNang(c.topic)} · ${v.text}`, tone: v.tone === 'overdue' ? 'danger' : 'info' });
  }
  const hang = { danger: 0, warn: 1, info: 2 } as const;
  return out.map((v, idx) => ({ v, idx })).sort((a, b) => hang[a.v.tone] - hang[b.v.tone] || a.idx - b.idx).map((x) => x.v);
}

/** Case nói trước ở chế độ "Cần hỗ trợ": quá hạn cập nhật → chưa có PA học thuật → mức SOS cao. */
export function chonCaseChinh<T extends CaseChoViec>(ds: readonly T[]): T | null {
  const mo = ds.filter((c) => c.state !== 'done');
  if (!mo.length) return null;
  const hang = (c: T) => (c.dueOverdue ? 0 : c.state === 'no_plan' ? 1 : 2);
  return [...mo].sort((a, b) => hang(a) - hang(b) || (b.sosLevel ?? 0) - (a.sosLevel ?? 0) || (a.id ?? 0) - (b.id ?? 0))[0];
}

// ---------------------------------------------------------------- hồ sơ giáo viên (§3.12, Q2)

/** PR-GV (đợt 5) dựng trang `/giao-vien/:id` rồi đổi hằng này thành `true`. Trước đó tên GV là chữ thường — không link chết. */
export const CO_TRANG_HO_SO_GIAO_VIEN = false;
export function duongHoSoGiaoVien(
  gvId: number | null, nguoiXem: { userId: number; laQuanLy: boolean }, coTrang: boolean = CO_TRANG_HO_SO_GIAO_VIEN,
): string | null {
  if (!coTrang || gvId === null) return null;
  if (!nguoiXem.laQuanLy && nguoiXem.userId !== gvId) return null;
  return `/giao-vien/${gvId}`;
}

// ---------------------------------------------------------------- tab hồ sơ lớp (§3.7)

export const TAB_HO_SO_LOP = ['hoc-vien', 'y-thuc', 'phan-tich'] as const;
export type TabHoSoLop = (typeof TAB_HO_SO_LOP)[number];
export const TAB_HO_SO_LOP_NHAN: Record<TabHoSoLop, string> = {
  'hoc-vien': 'Học viên', 'y-thuc': 'Ý thức & Phối hợp', 'phan-tich': 'Phân tích lớp',
};
export function tabHoSoLop(s: string | null | undefined): TabHoSoLop {
  return (TAB_HO_SO_LOP as readonly string[]).includes(s ?? '') ? (s as TabHoSoLop) : 'hoc-vien';
}
