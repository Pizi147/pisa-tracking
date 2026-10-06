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
  /** PR-UXF-b (Q10): hồ sơ cuộn tới một khối — `ket-luan-khoa` (hộp Kết luận khoá, `id="ket-luan-khoa"`). */
  muc?: 'ket-luan-khoa';
  /** PR-DL: mở sẵn panel Lộ trình (bảng điểm theo lượt → em chưa có lịch MT). */
  mo?: 'lo-trinh';
};

const KY_NANG_HOP_LE = ['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking'];

/**
 * Dựng `/hoc-vien/{id}` + query — thứ tự tham số CỐ ĐỊNH `lo-trinh, tab, dot, kn, Case, pa, giai-doan, viec`
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
  if (o.muc) q.set('muc', o.muc);
  if (o.mo) q.set('mo', o.mo);
  const s = q.toString();
  return `/hoc-vien/${studentId}${s ? `?${s}` : ''}`;
}

/** PR-Pb2-a (Q5) → PR-Dọn: link một Case luôn là hồ sơ HV mở Ngăn Case — mọi Case đều có học viên (khoá ở Dọn-a 8b). */
export const duongCase = (studentId: number, caseId: number): string => duongHoSoHocVien(studentId, { caseId });

const soNguyenDuong = (v: string | null): number | undefined => {
  if (v == null || !/^[1-9]\d*$/.test(v)) return undefined;
  return Number(v);
};

/**
 * G5 / E.4 (PR-VAI-b Q24): MỘT đường tới kết quả một đợt Test của em. FT → hồ sơ Mock `/mock-test/{id}` (+ `?kn=` để cuộn tới kỹ năng);
 * lớp thường → bảng điểm lớp thường như cũ (BỎ `kn` — bảng đó chưa có ô kỹ năng để cuộn). Không ai tự ghép `/mock-test/`.
 * Quyền không đổi: hồ sơ Mock tự kiểm quyền như cũ (`kn` chỉ là chỗ cuộn).
 */
export function duongDotTest(d: { id: number; kind?: string | null; classId?: number | null }, kn?: string | null): string {
  if (d.kind && d.kind !== 'mock' && d.classId) return `/bang-diem-thuong/${d.classId}?kind=${d.kind}`;
  const k = kn && KY_NANG_HOP_LE.includes(kn) ? kn : null;
  return `/mock-test/${d.id}${k ? `?kn=${k}` : ''}`;
}

/** `kn` trên URL hồ sơ Mock → ô lớn: writing1/writing2/writing → 'writing'; lạ → null. */
export function docKnMock(kn: string | null | undefined): 'listening' | 'reading' | 'writing' | 'speaking' | null {
  if (kn === 'writing' || kn === 'writing1' || kn === 'writing2') return 'writing';
  return kn === 'listening' || kn === 'reading' || kn === 'speaking' ? kn : null;
}

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
  if (get('muc') === 'ket-luan-khoa') o.muc = 'ket-luan-khoa';
  if (get('mo') === 'lo-trinh') o.mo = 'lo-trinh';
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
  /** PR-VAI-a (Q18, Q21): tên em, môn của Case, lớp em đang học; `con_viec` 1/0 = việc còn chờ / đã xong (Case chờ nguyên nhân, thẻ `cho`). */
  ten_hv?: string | null; mon?: string | null; lop?: string | null; con_viec?: number | null;
};

/**
 * CHUÔNG: CẦN LÀM / ĐỂ BIẾT (PR-VAI-a Q18, T76). Cần làm = trỏ tới việc/thẻ đang chờ CHÍNH người đọc; Để biết = tin một chiều. Loại lạ →
 * Để biết. Dòng Cần làm RỜI nhóm khi việc đã xong — biết được với Case (còn chờ nguyên nhân) và thẻ yêu cầu (còn `cho`): `con_viec = 0`.
 */
const LOAI_CAN_LAM = new Set([
  'nhac_viec', 'nhac_ban_giao', 'duyet_moi', 'duyet_qua_han', 'duyet_tu_choi', 'sos', 'sos_new', 'discipline', 'schedule_move', 'phoi_hop',
  'dang_ky', 'lenh_loi', 'ban_giao', 'overdue_score', 'overdue_task',
  'bao_len',   // PR-S6F-a Q12: thẻ Báo QL đang chờ chính Quản lý quyết
]);
export function nhomThongBao(n: { kind: string | null; con_viec?: number | null }): 'can-lam' | 'de-biet' {
  if (n.con_viec === 0) return 'de-biet';
  return LOAI_CAN_LAM.has(n.kind ?? '') ? 'can-lam' : 'de-biet';
}

/** Dòng xanh "bấm tới đâu" (Q21): đọc từ CHÍNH đường `duongThongBao` sẽ mở — không đoán theo chữ. `null` = không điều hướng. */
export function noiDenThongBao(n: ThongBaoRow): string | null {
  const den = duongThongBao(n);
  if (!den) return null;
  const [path, q = ''] = den.split('?');
  const p = new URLSearchParams(q);
  const hv = n.ten_hv ?? 'học viên';
  if (/^\/hoc-vien\/lop\/\d+/.test(path)) return `${n.lop ? `Lớp ${n.lop}` : 'Lớp'}${p.get('tab') === 'y-thuc' ? ' › Ý thức' : ''}`;
  if (/^\/hoc-vien\/\d+/.test(path)) {
    if (p.get('case')) return `Hồ sơ ${hv} › Case${n.mon ? ` ${n.mon}` : ''}`;
    if (p.get('tab') === 'y-thuc') return `Hồ sơ ${hv} › Ý thức`;
    return `Hồ sơ ${hv}`;
  }
  if (path.startsWith('/cong-viec/yeu-cau')) return 'Công việc › Yêu cầu của tôi';
  if (path.startsWith('/cong-viec/cho-duyet')) return 'Công việc › Chờ duyệt';
  if (path.startsWith('/cong-viec')) return 'Công việc';
  if (path.startsWith('/mock-test/')) return `Test › Lượt thi${n.ten_hv ? ` của ${n.ten_hv}` : ''}`;
  if (path.startsWith('/test')) return 'Test › Lịch Test';
  if (path.startsWith('/quan-tri')) return 'Quản trị › Tài khoản';
  return null;
}

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
      if (n.kind === 'schedule_move' || n.kind === 'tu_doi_lich' || n.kind === 'huy_vang') return duongDotTest({ id: n.attempt_id ?? n.entity_id });
      return null;
    case 'skill_move_requests':
      return n.attempt_id != null ? duongDotTest({ id: n.attempt_id }) : null;
    case 'discipline_measure':
      return n.student_id != null ? duongHoSoHocVien(n.student_id, { tab: 'y-thuc' }) : null;
    /* PR-DUYET (K1-41): đăng ký tài khoản mới → Quản trị (tab mặc định là Tài khoản, khối Đăng ký chờ duyệt). */
    case 'user':
      return n.kind === 'dang_ky' ? '/quan-tri' : null;
    /* PR-DUYET (K5-13): chuông chỉ TRỎ thẻ — người xin về Yêu cầu của tôi, người duyệt về hộp Chờ duyệt. */
    case 'yeu_cau_duyet':
      return duongThe(n.entity_id, n.kind === 'duyet_ket_qua' || n.kind === 'duyet_tu_choi' ? 'nguoi-xin' : n.kind === 'bao_len' ? 'de-biet' : 'duyet');
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
