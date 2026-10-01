/**
 * ĐƯỜNG DẪN HỒ SƠ HỌC VIÊN — MỘT quy ước duy nhất cho mọi nơi tạo link tới `/hoc-vien/:id` (R7, Q10,
 * plan.md §12.5 "một quy ước duy nhất"). Máy chủ (thông báo) và giao diện (mọi nút, bảng, thẻ) đọc/ghi
 * cùng bộ tham số qua các hàm ở đây — không có hai chỗ tự chế hai cái tên tham số khác nhau.
 *
 *   dựng đường dẫn hồ sơ HV     `duongHoSoHocVien`
 *   đọc tham số từ URL          `docThamSoHoSo`
 *   đường dẫn của một thông báo `duongThongBao`
 */
import type { HoSoTab } from './hoSoHocVien.ts';
import { duongThe } from './yeuCauDuyet.ts';

export type ThamSoHoSo = {
  tab?: HoSoTab;
  dot?: number;
  kn?: string;
  caseId?: number;
  paId?: number;
  giaiDoan?: 'thuong' | 'ft';
  loTrinh?: number;
  /** Việc mở sẵn trong ngăn Case: `ghi-ket-qua` (cần `caseId` + `paId`) · `ke-hoach` (Nộp kế hoạch bổ trợ — cần `caseId`, PR-LT2a). */
  viec?: 'ghi-ket-qua' | 'ke-hoach';
  /** Tab con của Ý thức & Phối hợp (PR-LT2a): `phoi-hop` — Việc Báo phụ huynh qua TVV mở thẳng thẻ Phối hợp. */
  sub?: 'phoi-hop';
};

const KY_NANG_HOP_LE = ['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking'];

/**
 * Dựng `/hoc-vien/{id}` + query — thứ tự tham số CỐ ĐỊNH `lo-trinh, tab, dot, kn, case, pa, giai-doan, viec`
 * để mọi chỗ sinh ra cùng một chuỗi cho cùng một trạng thái (dễ so sánh, dễ kiểm).
 *
 * `tab` chỉ ghi khi khác mặc định ('hoc-thuat') VÀ không có `dot`/`kn` — có một trong hai thì trang luôn
 * mở ở tab Học thuật (Q10), ghi thêm `tab` chỉ gây rối.
 */
export function duongHoSoHocVien(studentId: number, o: ThamSoHoSo = {}): string {
  const q = new URLSearchParams();
  if (o.loTrinh) q.set('lo-trinh', String(o.loTrinh));
  if (o.tab && o.tab !== 'hoc-thuat' && o.dot == null && o.kn == null) q.set('tab', o.tab);
  if (o.dot != null) q.set('dot', String(o.dot));
  if (o.kn) q.set('kn', o.kn);
  if (o.caseId != null) q.set('case', String(o.caseId));
  if (o.paId != null) q.set('pa', String(o.paId));
  if (o.giaiDoan) q.set('giai-doan', o.giaiDoan);
  if (o.viec) q.set('viec', o.viec);
  if (o.sub) q.set('sub', o.sub);
  const s = q.toString();
  return `/hoc-vien/${studentId}${s ? `?${s}` : ''}`;
}

/** PR-Pb2-a (Q5): link một Case — có em → hồ sơ HV mở Ngăn Case; không em → trang Case riêng (`/hoc-thuat/case/:id` vẫn còn cho trường hợp này). */
export const duongCase = (studentId: number | null | undefined, caseId: number): string =>
  (studentId ? duongHoSoHocVien(studentId, { caseId }) : `/hoc-thuat/case/${caseId}`);

const soNguyenDuong = (v: string | null): number | undefined => {
  if (v == null || !/^[1-9]\d*$/.test(v)) return undefined;
  return Number(v);
};

/** Đọc ngược `ThamSoHoSo` từ URL — tham số sai dạng bị BỎ QUA (không ném lỗi, khớp round-trip với hàm dựng). */
export function docThamSoHoSo(get: (k: string) => string | null): ThamSoHoSo {
  const o: ThamSoHoSo = {};
  const tab = get('tab');
  if (tab === 'hoc-thuat' || tab === 'y-thuc' || tab === 'hanh-trinh') o.tab = tab;
  const dot = soNguyenDuong(get('dot'));
  if (dot !== undefined) o.dot = dot;
  const kn = get('kn');
  if (kn && KY_NANG_HOP_LE.includes(kn)) o.kn = kn;
  const caseId = soNguyenDuong(get('case'));
  if (caseId !== undefined) o.caseId = caseId;
  const paId = soNguyenDuong(get('pa'));
  if (paId !== undefined) o.paId = paId;
  const gd = get('giai-doan');
  if (gd === 'thuong' || gd === 'ft') o.giaiDoan = gd;
  const loTrinh = soNguyenDuong(get('lo-trinh'));
  if (loTrinh !== undefined) o.loTrinh = loTrinh;
  const viec = get('viec');
  if (viec === 'ghi-ket-qua' || viec === 'ke-hoach') o.viec = viec;
  if (get('sub') === 'phoi-hop') o.sub = 'phoi-hop';
  return o;
}

export type ThongBaoRow = {
  entity_type: string;
  entity_id: number;
  kind: string | null;
  student_id: number | null;
  attempt_id: number | null;
  /** PR-DUYET: đường mở riêng lưu cùng thông báo (Nhắc). */
  duong?: string | null;
};

/**
 * ĐƯỜNG DẪN CỦA MỘT THÔNG BÁO (R8, Q12) — mỗi loại về đúng chỗ LÀM ĐƯỢC VIỆC của nó, không phải chỗ có
 * chữ giống tên. Tra không ra (loại lạ, thiếu học viên) → `null`, chuông không điều hướng chứ không đoán.
 */
export function duongThongBao(n: ThongBaoRow): string | null {
  /* Thông báo mang đường riêng (Nhắc; PR-YT4: Ý thức trỏ tab Ý thức của em `?mo=xu-ly`) — đường đó thắng. */
  if (n.duong) return n.duong;
  switch (n.entity_type) {
    case 'sos_case':
      return n.student_id != null ? duongHoSoHocVien(n.student_id, { caseId: n.entity_id }) : null;
    case 'case_signal':
      return n.student_id != null ? duongHoSoHocVien(n.student_id) : null;
    case 'assessment_attempt':
      if (n.kind === 'sos') {
        return n.student_id != null ? duongHoSoHocVien(n.student_id, { dot: n.attempt_id ?? n.entity_id }) : null;
      }
      if (n.kind === 'schedule_move') return `/mock-test/${n.attempt_id ?? n.entity_id}`;
      return null;
    case 'skill_move_requests':
      return n.attempt_id != null ? `/mock-test/${n.attempt_id}` : null;
    case 'discipline_measure':
      return n.student_id != null ? duongHoSoHocVien(n.student_id, { tab: 'y-thuc' }) : null;
    /* PR-DUYET (K1-41): đăng ký tài khoản mới → Quản trị (tab mặc định là Tài khoản, khối Đăng ký chờ duyệt). */
    case 'user':
      return n.kind === 'dang_ky' ? '/quan-tri' : null;
    /* PR-DUYET (K5-13): chuông chỉ TRỎ thẻ — người xin về Yêu cầu của tôi, người duyệt về hộp Chờ duyệt. */
    case 'yeu_cau_duyet':
      return duongThe(n.entity_id, n.kind === 'duyet_ket_qua' ? 'nguoi-xin' : 'duyet');
    /* PR-Ra Q5: người được Nhắc bấm chuông thì về thẳng danh sách có dòng vừa được nhắc. */
    case 'nhac_viec':
      return n.duong ?? '/cong-viec';
    /* PR-LT, Q21: thông báo chuyển lớp — entity_id CHÍNH LÀ studentId (không phải student_id riêng). */
    case 'student':
      return duongHoSoHocVien(n.entity_id);
    default:
      return null;
  }
}
