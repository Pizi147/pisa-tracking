/**
 * KHUNG 4 KHU VỰC (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.1, mockup 01 phương án A).
 *
 * Máy chủ trả bộ cờ `NavQuyen` (server/src/platform/nav.ts); giao diện chỉ đọc cờ + các hàm ở đây. Khu vực hay tab không
 * có quyền thì bỏ hẳn, không hiện ô khoá. Quyền thật vẫn do API chặn.
 */
export type KhuVuc = 'tong-quan' | 'hoc-vien' | 'test' | 'cong-viec';
export type TabTest = 'can-cham' | 'lich' | 'ke-hoach';
export type TabCongViec = 'ho-tro' | 'van-hanh' | 'bao-cao';
export type TabTongQuan = 'tong-quan' | 'phan-tich';

export type NavQuyen = {
  overview: boolean; students: boolean; admin: boolean;
  /** Tab Phân tích của Tổng quan. */
  analysis: boolean;
  test: boolean; testGrade: boolean; testSchedule: boolean; testPlan: boolean;
  work: boolean; workSupport: boolean; workOps: boolean; workReports: boolean;
  /** Cờ cũ — giữ để mã chưa chuyển vẫn chạy; PR sau bỏ dần. */
  mocks: boolean; meeting: boolean; academic: boolean; mgmtTasks: boolean;
};

export const NAV_RONG: NavQuyen = {
  overview: true, students: false, admin: false, analysis: false,
  test: false, testGrade: false, testSchedule: false, testPlan: false,
  work: false, workSupport: false, workOps: false, workReports: false,
  mocks: false, meeting: false, academic: false, mgmtTasks: false,
};

export type KhuVucMuc = { key: KhuVuc; to: string; label: string; labelNgan: string };

export const KHU_VUC: readonly KhuVucMuc[] = [
  { key: 'tong-quan', to: '/', label: 'Tổng quan', labelNgan: 'Tổng quan' },
  { key: 'hoc-vien', to: '/hoc-vien', label: 'Học viên & Lớp', labelNgan: 'Học viên' },
  { key: 'test', to: '/test', label: 'Test', labelNgan: 'Test' },
  { key: 'cong-viec', to: '/cong-viec', label: 'Công việc', labelNgan: 'Công việc' },
];

const HIEN: Record<KhuVuc, (n: NavQuyen) => boolean> = {
  'tong-quan': (n) => n.overview,
  'hoc-vien': (n) => n.students,
  test: (n) => n.test,
  'cong-viec': (n) => n.work,
};

export function khuVucHienThi(nav: NavQuyen): KhuVucMuc[] {
  return KHU_VUC.filter((k) => HIEN[k.key](nav));
}

const thuoc = (p: string, goc: string) => p === goc || p.startsWith(`${goc}/`);

/** Khu vực chứa đường dẫn này — để tô sáng đúng mục. Trang ngoài 4 khu (Quản trị, Hồ sơ cá nhân) → null. */
export function khuVucCuaDuong(pathname: string): KhuVuc | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (p === '/' || thuoc(p, '/phan-tich') || thuoc(p, '/hoc-thuat')) return 'tong-quan';
  if (thuoc(p, '/hoc-vien')) return 'hoc-vien';
  if (['/test', '/nhap-diem', '/bang-diem-thuong', '/mock-test'].some((g) => thuoc(p, g))) return 'test';
  if (thuoc(p, '/cong-viec')) return 'cong-viec';
  return null;
}

// ---------------------------------------------------------------- Test

const TAB_TEST: readonly TabTest[] = ['can-cham', 'lich', 'ke-hoach'];
export const TAB_TEST_LABEL: Record<TabTest, string> = { 'can-cham': 'Cần chấm', lich: 'Lịch Test', 'ke-hoach': 'Kế hoạch Test' };
export const DUONG_TAB_TEST: Record<TabTest, string> = { 'can-cham': '/test/can-cham', lich: '/test/lich', 'ke-hoach': '/test/ke-hoach' };
const HIEN_TEST: Record<TabTest, (n: NavQuyen) => boolean> = {
  'can-cham': (n) => n.testGrade, lich: (n) => n.testSchedule, 'ke-hoach': (n) => n.testPlan,
};

export function tabTestHienThi(nav: NavQuyen): TabTest[] {
  return nav.test ? TAB_TEST.filter((k) => HIEN_TEST[k](nav)) : [];
}
export function tabTestTuDuong(seg: string | undefined): TabTest | null {
  return (TAB_TEST as readonly string[]).includes(seg ?? '') ? (seg as TabTest) : null;
}
/**
 * O2b: người xếp lịch (Quản lý, Quản trị) mở vào Lịch Test; giáo viên mở vào Cần chấm.
 * Tab mặc định luôn là một tab người đó thấy được.
 */
export function tabTestMacDinh(nav: NavQuyen): TabTest | null {
  const tabs = tabTestHienThi(nav);
  const muon: TabTest = nav.testPlan ? 'lich' : 'can-cham';
  return tabs.includes(muon) ? muon : tabs[0] ?? null;
}

// ---------------------------------------------------------------- Công việc

const TAB_CONG_VIEC: readonly TabCongViec[] = ['ho-tro', 'van-hanh', 'bao-cao'];
export const TAB_CONG_VIEC_LABEL: Record<TabCongViec, string> = {
  'ho-tro': 'Hỗ trợ học viên', 'van-hanh': 'Vận hành', 'bao-cao': 'Báo cáo đơn vị',
};
export const DUONG_TAB_CONG_VIEC: Record<TabCongViec, string> = {
  'ho-tro': '/cong-viec', 'van-hanh': '/cong-viec/van-hanh', 'bao-cao': '/cong-viec/bao-cao',
};
const HIEN_CONG_VIEC: Record<TabCongViec, (n: NavQuyen) => boolean> = {
  'ho-tro': (n) => n.workSupport, 'van-hanh': (n) => n.workOps, 'bao-cao': (n) => n.workReports,
};

export function tabCongViecHienThi(nav: NavQuyen): TabCongViec[] {
  return nav.work ? TAB_CONG_VIEC.filter((k) => HIEN_CONG_VIEC[k](nav)) : [];
}
/** Không có đoạn sau `/cong-viec` = tab 1. Đoạn lạ → null (trang tự chuyển về tab đầu). */
export function tabCongViecTuDuong(seg: string | undefined): TabCongViec | null {
  if (!seg) return 'ho-tro';
  return seg === 'van-hanh' || seg === 'bao-cao' ? seg : null;
}

// ---------------------------------------------------------------- Tổng quan

export const TAB_TONG_QUAN_LABEL: Record<TabTongQuan, string> = { 'tong-quan': 'Tổng quan', 'phan-tich': 'Phân tích' };
