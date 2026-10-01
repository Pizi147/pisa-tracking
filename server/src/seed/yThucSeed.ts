import type { ViolationCategory } from '../../../shared/domain/index.ts';
import { hanDuyetMacDinh } from '../../../shared/domain/index.ts';
import { loadPrincipal } from '../permissions.ts';
import { commitIntake } from '../classes/intake.ts';
import { apDungMotDong } from '../classes/luatLoTrinh.ts';
import { daThucHien, deXuat, guiDeXuat } from '../yThuc/xuLy.ts';
import { duyetYeuCau, tuChoiYeuCau } from '../duyet/yeuCau.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * BỘ DEMO Ý THỨC v4 (PR-YT4, đặc tả 27/09 §10 D14 · D15 · H5) — ngày demo 14/09/2026 (Thứ Hai). Xem `DEMO.md` mục "Ý thức".
 *
 * Lớp `MB FT 101` của GVCN Trần Ngọc Hà, trừ khi ghi khác:
 *   (a) Trần Thu Hà      2 vi phạm đã Ghi nhận → không việc
 *   (b) Lê Quang Huy     3 vi phạm 08–10/09, ghi 10/09 → Cần xử lý, hạn hôm nay
 *   (c) Phạm Bảo Ngọc    3 vi phạm ghi 07–09/09 → Quá hạn 1 ngày, thẻ Báo lên
 *   (d) Vũ Hải Đăng      1 vi phạm cô Trang ghi 04/09, chưa ai xem → Quá hạn · chưa xem, thẻ Báo lên
 *   (e) Nguyễn Minh An   Report 1 → Report 2 → WL 1 → bậc kế Report 4 + Meeting CX/GĐCN; một vi phạm Mới
 *   (f) Lương Gia Bảo    khai bậc 5 + 3 vi phạm → đề xuất WL 3 chờ QL
 *   (g) Kiều Minh Đức    đề xuất Đình chỉ bị từ chối → vi phạm về Cần xử lý
 *   (i) Tô Ngọc Hân      HS cũ khai bậc 2 (H5) → Xác nhận xử lý · WL 1
 *   (j) Quách Thành Nam  3 vi phạm 31/08–02/09, chuyển sang MB FT 102 ngày 12/09 → vẫn Cần xử lý, hạn 16/09 (M-08)
 *   (k) Mạc Tuấn Kiệt    khai WL 1 → Report 4 + Meeting → WL 2 → bậc kế WL 3 · cần QL
 *   (l) Nguyễn Bảo Trâm  lớp thường HD FOU 05 → HD BE 21, khoá trước có Report 1 → bậc kế Report 2 (một chuỗi — Q-C)
 *   (m) Hà Phương Linh   Meeting CX/GĐCN QL duyệt + Đã thực hiện → Đã xử lý, bậc giữ Report 1 (M-11)
 * Thêm: Đặng Thu Vân (BC, QL nhập hộ + vi phạm Mới quá hạn) · Ngô Hải Yến (CP) · Trần Hải Kiên (HD, sang FT thì chuỗi thang mới).
 *
 * Vi phạm, lần xử lý thang đã xong và khai bậc GHI THẲNG xuống bảng (cần ngày quá khứ). Đề xuất QL duyệt đi qua CHÍNH hàm dịch vụ
 * (`deXuat` → `guiDeXuat` → `duyetYeuCau` / `tuChoiYeuCau` → `daThucHien`) rồi chỉnh ngày bằng SQL như `duyetSeed.ts`. Chuyển lớp
 * (j) qua `apDungMotDong`. Báo lên do lần `quetYeuCau` của `duyetSeed.ts` tự sinh. Vi phạm do chính GVCN lớp ghi → tự Đã ghi nhận (Q5).
 *
 * Ba luật cứng kiểm lúc dựng: (1) không gì sau ngày demo, (2) lần xử lý đã xong không chứa vi phạm xảy ra SAU ngày thực hiện,
 * (3) mỗi vi phạm trong lần xử lý phải tồn tại.
 */

type VSeed = {
  key: string;
  on: string;
  category: ViolationCategory;
  skill?: string | null;
  /** Mã giáo viên ghi. */
  by: string;
  text: string;
  /** Ngày ghi lên web nếu khác ngày xảy ra — hạn 5 ngày tính từ đây (Q4). */
  reportedOn?: string;
  /** GVCN bấm Ghi nhận ngày này (vi phạm của GV khác). */
  ghiNhan?: string;
  /** Xoá sau khi ghi — đúng như `deleteViolation`: dòng + dòng nối + lịch sử, một dòng `audit_logs`. */
  deleted?: { by: string; on: string };
};

/** Lần xử lý THANG đã xong (Xác nhận xử lý một bước — V4-9). */
type MSeed = {
  key: string;
  kind: 'report_1' | 'report_2' | 'wl_1' | 'report_4_meeting' | 'wl_2';
  performedOn: string;
  performer: string;
  /** Người bấm, nếu khác người thực hiện (QL nhập hộ). */
  createdBy?: string;
  note: string;
  violations: string[];
  evidence?: string[];
};

/** Đề xuất QL duyệt (V4-10) — đi qua hàm dịch vụ. */
type DSeed = {
  kind: 'wl_3' | 'meeting_cx' | 'suspension';
  violations: string[];
  note: string;
  evidence: string;
  guiOn: string;
  ket: { cho: true } | { tuChoi: string; lyDo: string } | { duyet: string; thucHien: string; ghiChu?: string };
};

type StudentYThuc = {
  /** Mã kịch bản (J01…) của học viên có sẵn, hoặc `moi` = thêm vào MB FT 101 qua `commitIntake`. */
  student?: string;
  moi?: { ten: string; target: number };
  khai?: { bac: number; thang: string | null; ghiChu: string; on: string };
  violations: VSeed[];
  measures?: MSeed[];
  deXuat?: DSeed;
  chuyen?: { lop: string; ngay: string; lyDo: string };
};

const LINK = (name: string) => ({ name, url: `https://drive.pisa.example/y-thuc/${encodeURIComponent(name)}` });
/** Thứ Hai 17/08 — tuần bắt đầu của các em thêm mới: MT1 LT1 (tuần 6) còn ở tương lai, không sinh MT lịch sử. */
const TUAN_VAO = '2026-08-17';

export const Y_THUC_SEEDS: StudentYThuc[] = [
  /* ============================================================ (a) Trần Thu Hà — hai vi phạm của GVBM, cô Hà đã Ghi nhận; một vi phạm đã xoá (audit) */
  {
    student: 'J02',
    violations: [
      { key: 'a1', on: '2026-09-03', category: 'homework', skill: 'writing2', by: 'T_LINH', text: 'Không nộp bài Writing Task 2 tuần 14', ghiNhan: '2026-09-04' },
      { key: 'a2', on: '2026-09-11', category: 'attendance', skill: 'speaking', by: 'T_TRANG', text: 'Đi muộn 15 phút buổi Speaking', ghiNhan: '2026-09-11' },
      {
        key: 'a3', on: '2026-09-10', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading tuần này',
        deleted: { by: 'T_HA', on: '2026-09-11' },
      },
    ],
  },

  /* ============================================================ (b) Lê Quang Huy — ba vi phạm 08–10/09, cùng ghi ngày 10/09 → Cần xử lý, hạn 14/09 */
  {
    student: 'J03',
    violations: [
      { key: 'b1', on: '2026-09-08', reportedOn: '2026-09-10', category: 'homework', skill: 'writing1', by: 'T_KHOA', text: 'Không nộp bài Writing Task 1 buổi 08/09' },
      { key: 'b2', on: '2026-09-09', reportedOn: '2026-09-10', category: 'classroom', skill: 'writing2', by: 'T_LINH', text: 'Ra ngoài giữa giờ không xin phép' },
      { key: 'b3', on: '2026-09-10', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ buổi sáng không báo trước' },
    ],
  },

  /* ============================================================ (c) Phạm Bảo Ngọc — Report 1 tháng 8; ba vi phạm ghi 07–09/09 → Quá hạn 1 ngày */
  {
    student: 'J08',
    violations: [
      { key: 'c1', on: '2026-08-03', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading hai tuần liền' },
      { key: 'c2', on: '2026-08-05', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ hai buổi không báo trước' },
      { key: 'c3', on: '2026-08-06', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Nói chuyện riêng liên tục, không nghe nhắc nhở' },
      { key: 'c4', on: '2026-09-07', category: 'homework', skill: 'listening', by: 'T_HA', text: 'Bỏ bài Listening, lần thứ ba trong tháng' },
      { key: 'c5', on: '2026-09-08', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Dùng điện thoại trong giờ Writing sau khi đã nhắc' },
      { key: 'c6', on: '2026-09-09', category: 'classroom', skill: 'writing2', by: 'T_LINH', text: 'Rời chỗ đi lại trong giờ, nhắc hai lần' },
    ],
    measures: [
      { key: 'cm1', kind: 'report_1', performedOn: '2026-08-07', performer: 'T_HA', note: 'Gửi Report 1 cho phụ huynh qua Zalo, mẹ em đã đọc.', violations: ['c1', 'c2', 'c3'] },
    ],
  },

  /* ============================================================ (d) Vũ Hải Đăng — một vi phạm cô Trang ghi 04/09, chưa ai xem → Quá hạn · chưa xem */
  {
    student: 'S01',
    violations: [
      { key: 'd1', on: '2026-09-04', category: 'attendance', skill: 'speaking', by: 'T_TRANG', text: 'Vắng buổi Speaking không xin phép' },
    ],
  },

  /* ============================================================ (e) Nguyễn Minh An — Report 1 → Report 2 → WL 1; một vi phạm Mới */
  {
    student: 'J01',
    violations: [
      { key: 'e1', on: '2026-06-22', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading tuần 4' },
      { key: 'e2', on: '2026-06-23', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ một buổi không xin phép' },
      { key: 'e3', on: '2026-06-25', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Nói chuyện riêng trong giờ Writing, đã nhắc hai lần' },
      { key: 'e4', on: '2026-07-20', category: 'homework', skill: 'writing2', by: 'T_LINH', text: 'Không nộp bài Writing Task 2 tuần 8' },
      { key: 'e5', on: '2026-07-21', category: 'attendance', skill: 'speaking', by: 'T_TRANG', text: 'Đi muộn 20 phút buổi Speaking' },
      { key: 'e6', on: '2026-07-23', category: 'homework', skill: 'listening', by: 'T_HA', text: 'Thiếu bài Listening tuần 8' },
      { key: 'e7', on: '2026-08-31', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading tuần cuối tháng 8' },
      { key: 'e8', on: '2026-09-01', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ một buổi, gia đình chưa liên lạc' },
      { key: 'e9', on: '2026-09-03', category: 'conduct', skill: 'writing2', by: 'T_LINH', text: 'Dùng điện thoại trong giờ Writing, nhắc hai lần vẫn tiếp tục' },
      { key: 'e10', on: '2026-09-12', category: 'homework', skill: 'writing1', by: 'T_KHOA', text: 'Không nộp bài Writing Task 1 buổi 12/09' },
    ],
    measures: [
      { key: 'em1', kind: 'report_1', performedOn: '2026-06-26', performer: 'T_HA', note: 'Gửi Report 1 cho phụ huynh, mẹ em đã đọc.', violations: ['e1', 'e2', 'e3'] },
      { key: 'em2', kind: 'report_2', performedOn: '2026-07-24', performer: 'T_HA', note: 'Gọi mẹ em báo tình hình bỏ bài, gia đình đồng ý nhắc em.', violations: ['e4', 'e5', 'e6'] },
      {
        key: 'em3', kind: 'wl_1', performedOn: '2026-09-04', performer: 'T_HA', note: 'Gửi Warning Letter 1, phụ huynh ký nhận.',
        violations: ['e7', 'e8', 'e9'], evidence: ['WL 1 — Nguyễn Minh An.pdf'],
      },
    ],
  },

  /* ============================================================ (f) Lương Gia Bảo — khai bậc 5 (WL 2) + 3 vi phạm → đề xuất WL 3 chờ QL */
  {
    moi: { ten: 'Lương Gia Bảo', target: 6.5 },
    khai: { bac: 5, thang: '2026-07', ghiChu: 'WL 2 tháng 7 ở lớp cũ, QL Vy ký', on: '2026-08-17' },
    violations: [
      { key: 'f1', on: '2026-09-07', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ hai buổi liền không báo' },
      { key: 'f2', on: '2026-09-08', category: 'conduct', skill: 'speaking', by: 'T_TRANG', text: 'Cãi lại giáo viên trong giờ Speaking' },
      { key: 'f3', on: '2026-09-09', category: 'homework', skill: 'writing1', by: 'T_KHOA', text: 'Không nộp bài Writing Task 1 ba buổi liền' },
    ],
    deXuat: {
      kind: 'wl_3', violations: ['f1', 'f2', 'f3'], guiOn: '2026-09-11', ket: { cho: true },
      note: 'Em đã qua WL 2 ở lớp cũ, nay tiếp tục nghỉ và cãi lại GV — đề xuất WL 3.', evidence: 'Biên bản buổi Speaking 08-09 — Lương Gia Bảo.pdf',
    },
  },

  /* ============================================================ (g) Kiều Minh Đức — đề xuất Đình chỉ bị QL từ chối → vi phạm về Cần xử lý */
  {
    moi: { ten: 'Kiều Minh Đức', target: 6.0 },
    violations: [
      { key: 'g1', on: '2026-09-09', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Xô đẩy bạn trong giờ nghỉ, bạn bị trầy tay' },
      { key: 'g2', on: '2026-09-10', category: 'conduct', skill: 'speaking', by: 'T_TRANG', text: 'Quay video bạn trong giờ học và đăng lên nhóm lớp' },
    ],
    deXuat: {
      kind: 'suspension', violations: ['g1', 'g2'], guiOn: '2026-09-10',
      ket: { tuChoi: '2026-09-12', lyDo: 'Chưa đủ căn cứ đình chỉ — xử lý theo thang (Report 1) và mời PH gặp GVCN.' },
      note: 'Hai vi phạm nghiêm trọng liên tiếp, ảnh hưởng bạn cùng lớp — đề xuất đình chỉ 3 buổi.', evidence: 'Tường trình của bạn cùng lớp — Kiều Minh Đức.pdf',
    },
  },

  /* ============================================================ (i) Tô Ngọc Hân — HS cũ đã bị Report 2 trước khi dùng web (H5) */
  {
    moi: { ten: 'Tô Ngọc Hân', target: 6.5 },
    khai: { bac: 2, thang: '2026-08', ghiChu: 'Report 2 tháng 8, cô Hà gửi PH', on: '2026-08-18' },
    violations: [
      { key: 'i1', on: '2026-09-11', category: 'homework', skill: 'writing2', by: 'T_LINH', text: 'Không nộp bài Writing Task 2 tuần này', ghiNhan: '2026-09-11' },
    ],
  },

  /* ============================================================ (j) Quách Thành Nam — bắt buộc xử lý rồi chuyển sang MB FT 102 (D15, M-08) */
  {
    moi: { ten: 'Quách Thành Nam', target: 6.5 },
    violations: [
      { key: 'j1', on: '2026-08-31', category: 'homework', skill: 'writing1', by: 'T_KHOA', text: 'Không nộp bài Writing Task 1 buổi 31/08' },
      { key: 'j2', on: '2026-09-01', category: 'classroom', skill: 'writing2', by: 'T_LINH', text: 'Dùng điện thoại trong giờ Writing' },
      { key: 'j3', on: '2026-09-02', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ buổi sáng không báo trước' },
    ],
    chuyen: { lop: 'MB FT 102', ngay: '2026-09-12', lyDo: 'Chuyển sang lớp LT2 theo nguyện vọng gia đình' },
  },

  /* ============================================================ (k) Mạc Tuấn Kiệt — khai WL 1 → Report 4 + Meeting → WL 2; một vi phạm Mới */
  {
    moi: { ten: 'Mạc Tuấn Kiệt', target: 6.0 },
    khai: { bac: 3, thang: '2026-07', ghiChu: 'WL 1 tháng 7 ở lớp cũ', on: '2026-08-17' },
    violations: [
      { key: 'k1', on: '2026-08-24', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ hai buổi đầu tuần không báo' },
      { key: 'k2', on: '2026-08-25', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading tuần 2' },
      { key: 'k3', on: '2026-08-27', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Ngủ trong giờ Writing, gọi không dậy' },
      { key: 'k4', on: '2026-09-02', category: 'attendance', skill: 'speaking', by: 'T_TRANG', text: 'Vắng buổi Speaking không xin phép' },
      { key: 'k5', on: '2026-09-03', category: 'homework', skill: 'writing2', by: 'T_LINH', text: 'Không nộp bài Writing Task 2 hai tuần liền' },
      { key: 'k6', on: '2026-09-07', category: 'classroom', skill: 'reading', by: 'T_HA', text: 'Rời lớp giữa giờ không xin phép' },
      { key: 'k7', on: '2026-09-12', category: 'homework', skill: 'writing1', by: 'T_KHOA', text: 'Không nộp bài Writing Task 1 buổi 12/09' },
    ],
    measures: [
      { key: 'km1', kind: 'report_4_meeting', performedOn: '2026-08-28', performer: 'T_HA', note: 'Gửi Report 4, gặp em cùng CX sau giờ học.', violations: ['k1', 'k2', 'k3'] },
      {
        key: 'km2', kind: 'wl_2', performedOn: '2026-09-09', performer: 'T_HA', note: 'Gửi Warning Letter 2, bố em ký nhận tại trung tâm.',
        violations: ['k4', 'k5', 'k6'], evidence: ['WL 2 — Mạc Tuấn Kiệt.pdf'],
      },
    ],
  },

  /* ============================================================ (m) Hà Phương Linh — Report 1; Meeting CX/GĐCN QL duyệt + Đã thực hiện → bậc giữ */
  {
    moi: { ten: 'Hà Phương Linh', target: 6.5 },
    violations: [
      { key: 'm1', on: '2026-08-17', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading tuần 1' },
      { key: 'm2', on: '2026-08-18', category: 'attendance', skill: null, by: 'T_HA', text: 'Đi muộn 30 phút buổi sáng' },
      { key: 'm3', on: '2026-08-20', category: 'homework', skill: 'writing2', by: 'T_LINH', text: 'Không nộp bài Writing Task 2 tuần 1' },
      { key: 'm4', on: '2026-09-01', category: 'conduct', skill: 'speaking', by: 'T_TRANG', text: 'Nói lời thiếu tôn trọng với bạn trong giờ Speaking' },
      { key: 'm5', on: '2026-09-02', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Bỏ về giữa giờ Writing sau khi bị nhắc' },
    ],
    measures: [
      { key: 'mm1', kind: 'report_1', performedOn: '2026-08-21', performer: 'T_HA', note: 'Gửi Report 1 cho phụ huynh qua Zalo.', violations: ['m1', 'm2', 'm3'] },
    ],
    deXuat: {
      kind: 'meeting_cx', violations: ['m4', 'm5'], guiOn: '2026-09-02', ket: { duyet: '2026-09-04', thucHien: '2026-09-08', ghiChu: 'Em hứa xin lỗi bạn trước lớp.' },
      note: 'Hai lần thiếu tôn trọng trong một tuần — mời PH gặp CX và GĐCN.', evidence: 'Ghi chú buổi Speaking 01-09 — Hà Phương Linh.pdf',
    },
  },

  /* ============================================================ (l) Nguyễn Bảo Trâm — lớp thường, khoá FOU có Report 1 → lên BE vẫn cùng chuỗi */
  {
    student: 'S16',
    violations: [
      { key: 'l1', on: '2026-07-06', category: 'homework', skill: 'reading', by: 'T_YEN', text: 'Không nộp bài Reading tuần 6' },
      { key: 'l2', on: '2026-07-07', category: 'attendance', skill: null, by: 'T_YEN', text: 'Nghỉ một buổi không xin phép' },
      { key: 'l3', on: '2026-07-09', category: 'homework', skill: 'writing', by: 'T_DUNG', text: 'Không nộp bài Writing tuần 6' },
    ],
    measures: [
      { key: 'lm1', kind: 'report_1', performedOn: '2026-07-10', performer: 'T_YEN', note: 'Gửi Report 1 cho phụ huynh cuối tuần 6.', violations: ['l1', 'l2', 'l3'] },
    ],
  },

  /* ============================================================ Đặng Thu Vân (BC) — Report 1 do QL nhập hộ; một vi phạm Mới quá hạn */
  {
    student: 'J11',
    violations: [
      { key: 'v1', on: '2026-08-10', category: 'attendance', skill: null, by: 'T_QUAN', text: 'Nghỉ ba buổi liên tiếp không báo, buổi thứ nhất' },
      { key: 'v2', on: '2026-08-11', category: 'attendance', skill: null, by: 'T_QUAN', text: 'Nghỉ buổi thứ hai liên tiếp, gia đình không liên lạc' },
      { key: 'v3', on: '2026-08-12', category: 'attendance', skill: 'writing1', by: 'T_HAN', text: 'Nghỉ buổi thứ ba liên tiếp, bài Writing chưa có ai thu' },
      { key: 'v4', on: '2026-09-06', category: 'attendance', skill: 'writing1', by: 'T_HAN', text: 'Nghỉ hai buổi đầu tuần, gia đình chưa liên lạc' },
    ],
    measures: [
      {
        /* NGƯỜI NHẬP HỘ KHÁC NGƯỜI THỰC HIỆN: Quản lý ghi lại việc cô Quân đã gọi phụ huynh. */
        key: 'vm1', kind: 'report_1', performedOn: '2026-08-13', performer: 'T_QUAN', createdBy: 'MGR_BC',
        note: 'Gọi phụ huynh trao đổi về lịch đi học; gia đình xin giữ nguyên lịch tới khi chuyển nhà xong.', violations: ['v1', 'v2', 'v3'],
      },
    ],
  },

  /* ============================================================ Ngô Hải Yến (CP) — hai GV cùng ghi BTVN; một cái GVCN tự ghi (Q5), một cái còn Mới */
  {
    student: 'S12',
    violations: [
      { key: 'y1', on: '2026-08-24', category: 'conduct', skill: null, by: 'T_DUNG', text: 'Ngồi im cả buổi, gọi mới nói và chỉ trả lời một câu ngắn', ghiNhan: '2026-08-25' },
      { key: 'y2', on: '2026-09-08', category: 'homework', skill: 'reading', by: 'T_NAM', text: 'Ba buổi Reading liên tiếp em không nộp bài về nhà, hỏi thì nói quên vở' },
      { key: 'y3', on: '2026-09-11', category: 'homework', skill: 'writing2', by: 'T_DUNG', text: 'Không nộp bài Writing Task 2, em nói tối qua bận việc nhà' },
    ],
  },

  /* ============================================================ Trần Hải Kiên (HD) — Report 1, 2 ở lớp BE; sang FT là chuỗi thang MỚI (T27) */
  {
    student: 'J09',
    violations: [
      { key: 'h1', on: '2026-08-05', category: 'attendance', skill: null, by: 'T_YEN', text: 'Nghỉ hai buổi đầu tuần, không báo trước' },
      { key: 'h2', on: '2026-08-06', category: 'conduct', skill: 'speaking', by: 'T_YEN', text: 'Gần như không nói trong giờ Speaking, không hợp tác làm việc cặp' },
      { key: 'h3', on: '2026-08-06', category: 'homework', skill: 'writing', by: 'T_DUNG', text: 'Chưa nộp bài Writing của tuần đầu tiên' },
      { key: 'h4', on: '2026-08-07', category: 'homework', skill: 'reading', by: 'T_YEN', text: 'Không nộp bài Reading tuần đầu' },
      { key: 'h5', on: '2026-09-09', category: 'attendance', skill: null, by: 'T_YEN', text: 'Đi muộn 25 phút buổi sáng, lớp Fast Track mới' },
    ],
    measures: [
      { key: 'hm1', kind: 'report_1', performedOn: '2026-08-06', performer: 'T_YEN', note: 'Gửi Report 1 về việc nghỉ học không báo.', violations: ['h1', 'h2', 'h3'] },
      { key: 'hm2', kind: 'report_2', performedOn: '2026-08-08', performer: 'T_YEN', note: 'Gọi phụ huynh báo em chưa nộp bài tuần đầu.', violations: ['h4'] },
    ],
  },
];

/**
 * DỰNG — gọi SAU khi đặt ngày demo (đề xuất đi qua hàm dịch vụ đọc `demoToday()`) và TRƯỚC `buildDuyetDemo` (lần `quetYeuCau` của nó
 * sinh thẻ Báo lên Ý thức).
 */
export function buildYThuc(ctx: BuildCtx) {
  const { conn } = ctx;
  const admin = loadPrincipal(ctx.adminId);
  const userOf = (code: string): number => {
    const id = ctx.userId.get(code);
    if (!id) throw new Error(`Bộ demo Ý thức nhắc tới người không có: ${code}`);
    return id;
  };
  const stamp = (date: string, time: string) => `${date}T${time}.000Z`;
  const notFuture = (date: string, what: string) => {
    if (date > DEMO_DATE) throw new Error(`Bộ demo Ý thức: ${what} ở ngày ${date}, sau ngày demo ${DEMO_DATE}`);
    return date;
  };
  const cycleAt = (sid: number, on: string): number | null => {
    const r = (conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? AND started_at <= ? ORDER BY started_at DESC, id DESC LIMIT 1').get(sid, on)
      ?? conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY id LIMIT 1').get(sid)) as any;
    return r?.id ?? null;
  };
  const classAt = (sid: number, on: string): number | null => {
    const r = (conn.prepare(
      `SELECT class_id FROM enrollments WHERE student_id = ? AND started_at <= ? AND (ended_at IS NULL OR ended_at >= ?)
        ORDER BY started_at DESC, id DESC LIMIT 1`).get(sid, on, on)
      ?? conn.prepare('SELECT class_id FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(sid)) as any;
    return r?.class_id ?? null;
  };
  const gvcnAt = (classId: number | null, on: string): number | null => (classId == null ? null : (conn.prepare(
    `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)
      ORDER BY id DESC LIMIT 1`).get(classId, on, on) as any)?.user_id ?? null);

  const insertViolation = conn.prepare(
    `INSERT INTO violations (student_id, cycle_id, class_id, category, skill, occurred_on, reported_on, reported_by, description, created_at, ghi_nhan_luc, ghi_nhan_boi)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const insertAudit = conn.prepare(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at) VALUES (?,?,?,?,?,?,?,?)`,
  );
  const insertHistory = conn.prepare(
    `INSERT INTO violation_history (violation_id, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?)`,
  );
  const insertMeasure = conn.prepare(
    `INSERT INTO discipline_measures (student_id, cycle_id, class_id, kind, status, owner_user_id, note, performed_on, performed_by,
                                      confirmed_by, confirmed_at, created_at, created_by, updated_at)
     VALUES (?,?,?,?, 'done', ?,?,?,?,?,?,?,?,?)`,
  );
  const link = conn.prepare('INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
  const attach = conn.prepare(
    `INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, mime_type, size_bytes, uploaded_by, created_at)
     VALUES ('discipline_measure', ?, 'link', ?, ?, NULL, NULL, ?, ?)`,
  );

  const counts = { violations: 0, deleted: 0, measures: 0, done: 0, deXuat: 0, khai: 0, links: 0, attachments: 0, hocVienMoi: 0 };
  const ft101 = ctx.classId.get('MB FT 101');
  const ha = loadPrincipal(userOf('T_HA'));
  const vy = loadPrincipal(userOf('MGR_MB'));

  for (const s of Y_THUC_SEEDS) {
    let sid: number | undefined;
    if (s.moi) {
      if (!ft101) continue;
      commitIntake(admin, { classId: ft101, rows: [{ fullName: s.moi.ten, target: s.moi.target, startWeek: TUAN_VAO, email: 'hv@demo.test' }],
        idempotencyKey: `ythuc-demo-${s.moi.ten}` } as any);
      sid = (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(s.moi.ten) as any)?.id;
      counts.hocVienMoi += 1;
    } else {
      sid = ctx.studentIdByCode?.get(s.student!);
    }
    if (!sid) throw new Error(`Bộ demo Ý thức nhắc tới học viên không có trong kịch bản: ${s.student ?? s.moi?.ten}`);

    if (s.khai) {
      const cy = cycleAt(sid, s.khai.on)!;
      conn.prepare(`INSERT INTO y_thuc_khai_bac (student_id, chuoi_cycle_id, bac, thang, ghi_chu, khai_boi, khai_luc) VALUES (?,?,?,?,?,?,?)`)
        .run(sid, cy, s.khai.bac, s.khai.thang, s.khai.ghiChu, userOf('T_HA'), notFuture(s.khai.on, 'khai bậc'));
      counts.khai += 1;
    }

    const vid = new Map<string, number>();
    const vOn = new Map<string, string>();
    for (const v of s.violations) {
      const reportedOn = notFuture(v.reportedOn ?? v.on, `vi phạm ${v.key}`);
      const by = userOf(v.by);
      const lop = classAt(sid, v.on);
      /* Q5: vi phạm do chính GVCN lớp ghi → tự Đã ghi nhận ngay ngày ghi. */
      const ghiNhan = v.ghiNhan ? { on: notFuture(v.ghiNhan, `ghi nhận ${v.key}`), by: gvcnAt(lop, v.ghiNhan) }
        : gvcnAt(lop, reportedOn) === by ? { on: reportedOn, by } : null;
      const info = insertViolation.run(
        sid, cycleAt(sid, v.on), lop, v.category, v.skill ?? null, notFuture(v.on, `vi phạm ${v.key}`), reportedOn, by, v.text,
        stamp(reportedOn, '08:00:00'), ghiNhan?.on ?? null, ghiNhan?.by ?? null,
      );
      vid.set(v.key, Number(info.lastInsertRowid));
      vOn.set(v.key, v.on);
      counts.violations += 1;
    }
    const idOf = (key: string, what: string) => {
      const id = vid.get(key);
      if (!id) throw new Error(`Bộ demo Ý thức: ${what} nhắc tới vi phạm không có: ${key}`);
      return id;
    };

    for (const m of s.measures ?? []) {
      const on = notFuture(m.performedOn, `lần xử lý ${m.key}`);
      const createdBy = userOf(m.createdBy ?? m.performer);
      const performer = userOf(m.performer);
      const mid = Number(insertMeasure.run(
        sid, cycleAt(sid, on), classAt(sid, on), m.kind, performer, m.note, on, performer, createdBy, stamp(on, '17:00:00'),
        stamp(on, '16:00:00'), createdBy, stamp(on, '17:00:00'),
      ).lastInsertRowid);
      counts.measures += 1;
      counts.done += 1;
      for (const key of m.violations) {
        const id = idOf(key, `lần xử lý ${m.key}`);
        if (vOn.get(key)! > on) throw new Error(`Bộ demo Ý thức: lần xử lý ${m.key} thực hiện ${on} nhưng chứa vi phạm ${key} xảy ra sau đó (${vOn.get(key)})`);
        link.run(mid, id, createdBy, stamp(on, '16:00:00'));
        insertHistory.run(id, 'measure', null, String(mid), null, createdBy, stamp(on, '16:00:00'));
        counts.links += 1;
      }
      for (const ten of m.evidence ?? []) {
        const e = LINK(ten);
        attach.run(mid, e.url, e.name, performer, stamp(on, '16:30:00'));
        counts.attachments += 1;
      }
    }

    /*
     * ĐỀ XUẤT QL DUYỆT — qua hàm dịch vụ (nháp → bằng chứng → gửi → QL quyết → Đã thực hiện), rồi đưa mọi mốc về đúng ngày kịch bản
     * (hàm dịch vụ đóng dấu giờ thật / ngày demo).
     */
    const d = s.deXuat;
    if (d) {
      const gui = notFuture(d.guiOn, 'gửi đề xuất');
      const nhap = deXuat(ha, sid, { kind: d.kind, violationIds: d.violations.map((k) => idOf(k, 'đề xuất')), note: d.note });
      const e = LINK(d.evidence);
      attach.run(nhap.id, e.url, e.name, ha.userId, stamp(gui, '09:00:00'));
      counts.attachments += 1;
      guiDeXuat(ha, nhap.id);
      const the = (conn.prepare(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ?`).get(nhap.id) as any).id as number;
      conn.prepare('UPDATE yeu_cau_duyet SET tao_luc = ?, han_duyet = ? WHERE id = ?').run(stamp(gui, '09:05:00'), hanDuyetMacDinh('y_thuc', gui), the);
      conn.prepare('UPDATE discipline_measures SET created_at = ?, updated_at = ? WHERE id = ?').run(stamp(gui, '09:00:00'), stamp(gui, '09:05:00'), nhap.id);
      conn.prepare('UPDATE measure_violations SET added_at = ? WHERE measure_id = ?').run(stamp(gui, '09:00:00'), nhap.id);
      if ('tuChoi' in d.ket) {
        const on = notFuture(d.ket.tuChoi, 'QL từ chối');
        tuChoiYeuCau(vy, the, d.ket.lyDo);
        conn.prepare('UPDATE yeu_cau_duyet SET xu_ly_luc = ? WHERE id = ?').run(stamp(on, '10:00:00'), the);
        conn.prepare('UPDATE discipline_measures SET quyet_luc = ?, updated_at = ? WHERE id = ?').run(on, stamp(on, '10:00:00'), nhap.id);
      } else if ('duyet' in d.ket) {
        const on = notFuture(d.ket.duyet, 'QL duyệt');
        const lam = notFuture(d.ket.thucHien, 'đã thực hiện');
        duyetYeuCau(vy, the, {});
        conn.prepare('UPDATE yeu_cau_duyet SET xu_ly_luc = ? WHERE id = ?').run(stamp(on, '10:00:00'), the);
        conn.prepare('UPDATE discipline_measures SET quyet_luc = ?, updated_at = ? WHERE id = ?').run(on, stamp(on, '10:00:00'), nhap.id);
        daThucHien(ha, nhap.id, { performedOn: lam, note: d.ket.ghiChu });
        conn.prepare('UPDATE discipline_measures SET confirmed_at = ?, updated_at = ? WHERE id = ?').run(stamp(lam, '17:00:00'), stamp(lam, '17:00:00'), nhap.id);
      }
      counts.measures += 1;
      counts.deXuat += 1;
      counts.links += d.violations.length;
    }

    if (s.chuyen) {
      const to = ctx.classId.get(s.chuyen.lop);
      if (!to) throw new Error(`Bộ demo Ý thức: không có lớp ${s.chuyen.lop}`);
      apDungMotDong(admin, { sid, toClassId: to, ngay: notFuture(s.chuyen.ngay, 'chuyển lớp'), lyDo: s.chuyen.lyDo, boiCanh: 'giua-khoa' });
    }

    /* XOÁ SAU CÙNG (V13′): như `deleteViolation` — gỡ dòng nối và lịch sử, xoá dòng, MỘT dòng audit giữ nội dung đã xoá. */
    for (const v of s.violations) {
      if (!v.deleted) continue;
      const id = vid.get(v.key)!;
      const measureIds = (conn.prepare('SELECT measure_id FROM measure_violations WHERE violation_id = ? ORDER BY measure_id').all(id) as any[]).map((r) => r.measure_id);
      const at = stamp(notFuture(v.deleted.on, `xoá ${v.key}`), '10:00:00');
      conn.prepare('DELETE FROM measure_violations WHERE violation_id = ?').run(id);
      conn.prepare('DELETE FROM violation_history WHERE violation_id = ?').run(id);
      conn.prepare('DELETE FROM violations WHERE id = ?').run(id);
      insertAudit.run(userOf(v.deleted.by), 'violation.delete', 'violation', id, `Bộ demo · ${v.key}`, JSON.stringify({
        studentId: sid, category: v.category, skill: v.skill ?? null, occurredOn: v.on, reportedBy: userOf(v.by), description: v.text, measureIds,
      }), null, at);
      vid.delete(v.key);
      counts.violations -= 1;
      counts.deleted += 1;
    }
  }
  return counts;
}
