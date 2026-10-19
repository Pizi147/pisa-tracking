/**
 * KHUNG 4 KHU VỰC (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.1, mockup 01 phương án A).
 *
 * Máy chủ trả bộ cờ `NavQuyen` (server/src/platform/nav.ts); giao diện chỉ đọc cờ + các hàm ở đây. Khu vực hay tab không
 * có quyền thì bỏ hẳn, không hiện ô khoá. Quyền thật vẫn do API chặn.
 */
import { laLoaiBoQuen } from './phanTich.ts';
import { t } from '../i18n/index.ts';

export type KhuVuc = 'tong-quan' | 'hoc-vien' | 'test' | 'phan-tich' | 'cong-viec';
export type TabTest = 'lich' | 'diem-lop' | 'ke-hoach';
export type TabCongViec = 'cho-duyet' | 'ho-tro' | 'yeu-cau' | 'van-hanh' | 'bao-cao';
export type TabTongQuan = 'tong-quan' | 'phan-tich';

export type NavQuyen = {
  overview: boolean; students: boolean; admin: boolean;
  /** Tab Phân tích của Tổng quan. */
  analysis: boolean;
  /** PR-OV2a: phần giáo viên (Phân tích › Theo giáo viên, hồ sơ GV khác) — CX, TVV không có. */
  phanTichGv: boolean;
  /** PR-OV2a: Tổng quan "Học viên của tôi" (vai TVV). */
  hvCuaToi: boolean;
  test: boolean; testGrade: boolean; testSchedule: boolean; testPlan: boolean;
  work: boolean; workSupport: boolean; workOps: boolean; workReports: boolean;
  /** PR-DUYET: hộp Chờ duyệt (`request.approve` — QL, Quản trị) · Yêu cầu của tôi (mọi người có việc học viên). */
  workApprove: boolean; workRequests: boolean;
  /** PR-OV2a: Công việc chỉ nhóm Chấm điểm + Nhắc (vai Admin). */
  workChamDiem: boolean;
  /** PR-XUAT: nút Xuất Excel kết quả Test — Quản lý/Quản trị theo phạm vi, GVCN lớp mình (không phải GVBM). */
  xuatMt: boolean;
};

export const NAV_RONG: NavQuyen = {
  overview: true, students: false, admin: false, analysis: false, phanTichGv: false, hvCuaToi: false,
  test: false, testGrade: false, testSchedule: false, testPlan: false,
  work: false, workSupport: false, workOps: false, workReports: false, workApprove: false, workRequests: false, workChamDiem: false,
  xuatMt: false,
};

export type KhuVucMuc = { key: KhuVuc; to: string; label: string; labelNgan: string };

export const KHU_VUC: readonly KhuVucMuc[] = [
  { key: 'tong-quan', to: '/', label: t('Tổng quan'), labelNgan: t('Tổng quan') },
  { key: 'hoc-vien', to: '/hoc-vien', label: t('Học viên & Lớp'), labelNgan: t('Học viên') },
  { key: 'test', to: '/test', label: t('Test'), labelNgan: t('Test') },
  /* OV-15e (plan §7): Phân tích là mục thanh trên (trước là tab của Tổng quan). */
  { key: 'phan-tich', to: '/phan-tich', label: t('Phân tích'), labelNgan: t('Phân tích') },
  { key: 'cong-viec', to: '/cong-viec', label: t('Công việc'), labelNgan: t('Công việc') },
];

const HIEN: Record<KhuVuc, (n: NavQuyen) => boolean> = {
  'tong-quan': (n) => n.overview,
  'hoc-vien': (n) => n.students,
  test: (n) => n.test,
  'phan-tich': (n) => n.analysis,
  'cong-viec': (n) => n.work,
};

/**
 * PR-DUYET: người duyệt vào thẳng Công việc › Chờ duyệt; UX-2 (3, chủ SP 16/10): CHỈ khi đang có thẻ chờ duyệt (`soChoDuyet`, số badge của menu) —
 * không có thẻ (hoặc chưa đếm xong) thì vào Hỗ trợ học viên. `/cong-viec` vẫn là Việc học viên (link cũ không gãy).
 */
export function khuVucHienThi(nav: NavQuyen, soChoDuyet = 0): KhuVucMuc[] {
  return KHU_VUC.filter((k) => HIEN[k.key](nav))
    .map((k) => (k.key === 'cong-viec' && nav.workApprove && soChoDuyet > 0 ? { ...k, to: DUONG_TAB_CONG_VIEC['cho-duyet'] } : k));
}

const thuoc = (p: string, goc: string) => p === goc || p.startsWith(`${goc}/`);

/** Khu vực chứa đường dẫn này — để tô sáng đúng mục. Trang ngoài 4 khu (Quản trị, Hồ sơ cá nhân) → null. */
export function khuVucCuaDuong(pathname: string): KhuVuc | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (thuoc(p, '/phan-tich')) return 'phan-tich';
  if (p === '/' || thuoc(p, '/hoc-thuat')) return 'tong-quan';
  if (thuoc(p, '/hoc-vien')) return 'hoc-vien';
  if (['/test', '/nhap-diem', '/bang-diem-thuong', '/mock-test'].some((g) => thuoc(p, g))) return 'test';
  if (thuoc(p, '/cong-viec')) return 'cong-viec';
  return null;
}

// ---------------------------------------------------------------- Test

/** PR-DL (G4): "Điểm theo lớp" giữa Lịch Test và Kế hoạch Test, hiện theo `testGrade`. */
const TAB_TEST: readonly TabTest[] = ['lich', 'diem-lop', 'ke-hoach'];
export const TAB_TEST_LABEL: Record<TabTest, string> = { lich: t('Lịch Test / Chấm Test'), 'diem-lop': t('Điểm theo lớp'), 'ke-hoach': t('Kế hoạch Test') };
export const DUONG_TAB_TEST: Record<TabTest, string> = { lich: '/test/lich', 'diem-lop': '/test/diem-lop', 'ke-hoach': '/test/ke-hoach' };
/** PR-UX1 Q16: Cần chấm gộp vào Lịch Test — ai chấm được (`testGrade`) hay xếp được lịch (`testSchedule`) đều thấy. */
const HIEN_TEST: Record<TabTest, (n: NavQuyen) => boolean> = {
  lich: (n) => n.testSchedule || n.testGrade, 'diem-lop': (n) => n.testGrade, 'ke-hoach': (n) => n.testPlan,
};

export function tabTestHienThi(nav: NavQuyen): TabTest[] {
  return nav.test ? TAB_TEST.filter((k) => HIEN_TEST[k](nav)) : [];
}
export function tabTestTuDuong(seg: string | undefined): TabTest | null {
  return (TAB_TEST as readonly string[]).includes(seg ?? '') ? (seg as TabTest) : null;
}
/** PR-UX1: ai cũng mở Test vào Lịch Test (Cần chấm đã gộp vào đó). Tab mặc định luôn là một tab người đó thấy được. */
export function tabTestMacDinh(nav: NavQuyen): TabTest | null {
  const tabs = tabTestHienThi(nav);
  return tabs.includes('lich') ? 'lich' : tabs[0] ?? null;
}

/**
 * ĐƯỜNG DẪN LỊCH TEST (PR-UX1 Q11) — mọi lối vào "chấm điểm" dùng hàm này. Thứ tự tham số cố định để link so được
 * bằng chuỗi; tham số rỗng thì bỏ. `classId` → Lịch Test lọc đúng lớp và mở sẵn; `kn` → con trỏ vào ô trống đầu
 * của môn đó.
 */
export function duongLichTest(o: { classId?: number | null; periodId?: number | null; kn?: string | null; branchId?: number | null } = {}) {
  const q = new URLSearchParams();
  if (o.branchId) q.set('cn', String(o.branchId));
  if (o.periodId) q.set('periodId', String(o.periodId));
  if (o.classId) q.set('classId', String(o.classId));
  if (o.kn) q.set('kn', o.kn);
  return voiThamSo(DUONG_TAB_TEST.lich, q);
}

// ---------------------------------------------------------------- Công việc

const TAB_CONG_VIEC: readonly TabCongViec[] = ['cho-duyet', 'ho-tro', 'yeu-cau', 'van-hanh', 'bao-cao'];
/** PR-DUYET (K1-29) đổi thành "Việc học viên"; PR-S3 (A-012, chủ sản phẩm 01/10) trả về "Hỗ trợ học viên". */
export const TAB_CONG_VIEC_LABEL: Record<TabCongViec, string> = {
  'cho-duyet': t('Chờ duyệt'), 'ho-tro': t('Hỗ trợ học viên'), 'yeu-cau': t('Yêu cầu của tôi'), 'van-hanh': t('Vận hành'), 'bao-cao': t('Báo cáo đơn vị'),
};
/** OV-10a: Admin (`workChamDiem`) chỉ có nhóm Chấm điểm + Nhắc — tab đầu ghi "Chấm điểm", không "Hỗ trợ học viên". */
export const nhanTabCongViec = (k: TabCongViec, nav: NavQuyen): string => (k === 'ho-tro' && nav.workChamDiem ? t('Chấm điểm') : TAB_CONG_VIEC_LABEL[k]);
export const DUONG_TAB_CONG_VIEC: Record<TabCongViec, string> = {
  'cho-duyet': '/cong-viec/cho-duyet', 'ho-tro': '/cong-viec', 'yeu-cau': '/cong-viec/yeu-cau',
  'van-hanh': '/cong-viec/van-hanh', 'bao-cao': '/cong-viec/bao-cao',
};
/** Người duyệt không có tab Yêu cầu của tôi (họ tự gửi thì tự duyệt ngay trong hộp, Q-D). */
const HIEN_CONG_VIEC: Record<TabCongViec, (n: NavQuyen) => boolean> = {
  'cho-duyet': (n) => n.workApprove, 'ho-tro': (n) => n.workSupport, 'yeu-cau': (n) => n.workRequests && !n.workApprove,
  'van-hanh': (n) => n.workOps, 'bao-cao': (n) => n.workReports,
};

export function tabCongViecHienThi(nav: NavQuyen): TabCongViec[] {
  return nav.work ? TAB_CONG_VIEC.filter((k) => HIEN_CONG_VIEC[k](nav)) : [];
}
/** Không có đoạn sau `/cong-viec` = tab 1. Đoạn lạ → null (trang tự chuyển về tab đầu). */
export function tabCongViecTuDuong(seg: string | undefined): TabCongViec | null {
  if (!seg) return 'ho-tro';
  return (TAB_CONG_VIEC as readonly string[]).includes(seg) && seg !== 'ho-tro' ? (seg as TabCongViec) : null;
}

// ---------------------------------------------------------------- Tổng quan

/** PR-VAI-a (K1-10, Q10): tab đầu đổi tên "Việc hôm nay" — không lặp chữ "Tổng quan" của menu. */
export const TAB_TONG_QUAN_LABEL: Record<TabTongQuan, string> = { 'tong-quan': t('Việc hôm nay'), 'phan-tich': t('Phân tích') };

// ---------------------------------------------------------------- Đường dẫn cũ

const voiThamSo = (path: string, q: URLSearchParams) => {
  const s = q.toString();
  return s ? `${path}?${s}` : path;
};

/**
 * PR-Pb2-a (Q4, T59, K1 §4b): Danh sách Case đã bỏ — tham số của nó đi THẲNG tới đích mới, một bước. Không có tham số cũ → null.
 *   `hang-doi=due`            → Công việc · Case học thuật quá hạn (giữ `cn`)
 *   `hang-doi=<bỏ quên>`      → Tổng quan (giữ `cn`, `ct`) — dòng Cần xử lý của nó đã gỡ (PR-VAI-a Q7)
 *   góc `danh-sach` / `hang-doi` khác / `tinh-hinh` / `ky-nang` → Vấn đề HV (giữ `cn`, `ct`)
 */
function phanTichCu(q: URLSearchParams): string | null {
  const hangDoi = q.get('hang-doi');
  if (q.get('goc') !== 'danh-sach' && !hangDoi && !q.has('tinh-hinh') && !q.has('ky-nang')) return null;
  const giu = (khoa: readonly string[], dau: [string, string][] = []) => {
    const m = new URLSearchParams(dau);
    for (const k of khoa) { const v = q.get(k); if (v) m.set(k, v); }
    return m;
  };
  if (hangDoi === 'due') return voiThamSo('/cong-viec', giu(['cn'], [['nhom', 'case-hoc-thuat'], ['loc', 'qua-han'], ['nguoi', 'tat-ca']]));
  if (laLoaiBoQuen(hangDoi)) return voiThamSo('/', giu(['cn', 'ct']));
  return voiThamSo('/phan-tich', giu(['cn', 'ct'], [['goc', 'van-de']]));
}

/**
 * ĐƯỜNG DẪN CŨ → MỚI (O5, O7). Link đã lưu, link trong thông báo và link máy chủ sinh ra vẫn mở đúng chỗ.
 * Trả null khi đường dẫn đang dùng được. Mọi đích trả về đều không bị chuyển tiếp lần nữa (phép kiểm PR-O khẳng định).
 */
export function duongMoi(pathname: string, search: string): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  /* PR-UX1 Q12: Cần chấm đã gộp vào Lịch Test. Giữ `classId`, `kn`, `branchId`; `scope` không còn nghĩa (Lịch Test
     tự mở "Lớp tôi dạy" cho người có phân công). */
  if (p === '/test/can-cham') { q.delete('scope'); return voiThamSo(DUONG_TAB_TEST.lich, q); }
  if (p === '/tong-quan') return voiThamSo('/', q);
  if (p === '/' && q.has('tab')) {
    const tab = q.get('tab');
    q.delete('tab');
    return tab === 'tinh-hinh' ? phanTichCu(q) ?? voiThamSo('/phan-tich', q) : voiThamSo('/', q);
  }
  if (p === '/hoc-thuat') return phanTichCu(q) ?? voiThamSo('/phan-tich', q);
  if (p === '/phan-tich') return phanTichCu(q);
  if (p === '/tong-hop-tuan') {
    const cn = q.get('branchId');
    const moi = new URLSearchParams({ xem: 'tuan' });
    if (cn) moi.set('cn', cn);
    return voiThamSo('/phan-tich', moi);
  }
  if (p === '/tien-trinh' || p === '/hop-tuan') return voiThamSo('/cong-viec/bao-cao', q);
  if (p === '/tien-do-cong-viec') {
    const donVi = q.get('tab') === 'don-vi';
    q.delete('tab');
    const viec = q.get('viec');
    if (viec) { q.delete('viec'); if (!q.has('open')) q.set('open', viec); }
    return voiThamSo(donVi ? '/cong-viec/bao-cao' : '/cong-viec/van-hanh', q);
  }
  if (p === '/hoc-vien') {
    const view = q.get('view');
    if (view === 'my_scores' || view === 'no_plan') {
      q.delete('view');
      if (view === 'my_scores') q.delete('scope');
      return voiThamSo(view === 'my_scores' ? DUONG_TAB_TEST.lich : DUONG_TAB_TEST['ke-hoach'], q);
    }
    return null;
  }
  if (p === '/mock-test') return '/hoc-vien';
  const lop = /^\/mock-test\/lop\/([^/]+)$/.exec(p);
  if (lop) return voiThamSo(`/nhap-diem/${lop[1]}`, q);
  return null;
}
