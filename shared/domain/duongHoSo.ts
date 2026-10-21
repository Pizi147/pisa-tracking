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
import type { NavQuyen } from './dieuHuong.ts';
import type { DeadlineKind } from './display.ts';
import { duongThe } from './yeuCauDuyet.ts';
import { t } from '../i18n/index.ts';

export type ThamSoHoSo = {
  tab?: HoSoTab;
  dot?: number;
  kn?: string;
  caseId?: number;
  paId?: number;
  giaiDoan?: 'thuong' | 'ft';
  loTrinh?: number;
  /** Việc mở sẵn trong ngăn Case: `ghi-ket-qua` (cần `caseId` + `paId`). PR-CT2: bỏ `ke-hoach` (Nộp kế hoạch bổ trợ) — liên kết cũ bỏ qua tham số. */
  viec?: 'ghi-ket-qua' | 'thi-that' | 'them-pa';   // OV-11c (TQ-5): Thêm PA mở thẳng Case
  /** Tab con của Ý thức & Phối hợp (PR-LT2a): `phoi-hop` — Việc Báo phụ huynh qua TVV mở thẳng thẻ Phối hợp. */
  sub?: 'phoi-hop';
  /** PR-UXF-b (Q10): hồ sơ cuộn tới một khối — `ket-luan-khoa` (hộp Kết luận khoá, `id="ket-luan-khoa"`). */
  muc?: 'ket-luan-khoa';
  /** PR-DL: mở sẵn panel Lộ trình (bảng điểm theo lượt → em chưa có lịch MT). */
  mo?: 'lo-trinh';
  /** PR-TK: mở sẵn ngăn "Tổng kết lộ trình" của lộ trình này (`?tong-ket=<cycleId>`). */
  tongKet?: number;
  /** OV-13m: mở sẵn panel "Bước tiếp" sau thi của lộ trình này (`?buoc-tiep=<cycleId>`) — việc Chọn bước tiếp, Các lộ trình. */
  buocTiep?: number;
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
  if (o.tongKet) q.set('tong-ket', String(o.tongKet));
  if (o.buocTiep) q.set('buoc-tiep', String(o.buocTiep));
  const s = q.toString();
  return `/hoc-vien/${studentId}${s ? `?${s}` : ''}`;
}

/**
 * PR-PA (§8): Ngăn Case đứng riêng `/hoc-thuat/case/{id}?pa=&viec=ghi-ket-qua` — cho người giữ việc Kết quả không xem được hồ sơ HV.
 * Cùng tên tham số với hồ sơ (`docThamSoHoSo` đọc được). Không có `viec` thì route cũ chuyển về hồ sơ như trước.
 */
export function duongCaseRieng(caseId: number, o: Pick<ThamSoHoSo, 'paId' | 'viec'> = {}): string {
  const q = new URLSearchParams();
  if (o.paId != null) q.set('pa', String(o.paId));
  if (o.viec) q.set('viec', o.viec);
  const s = q.toString();
  return `/hoc-thuat/case/${caseId}${s ? `?${s}` : ''}`;
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
  /* PR-MT0: MT0 mở hồ sơ Mock (chấm band), không bảng điểm lớp thường. */
  if (d.kind && d.kind !== 'mock' && d.kind !== 'mt0' && d.classId) return `/bang-diem-thuong/${d.classId}?kind=${d.kind}`;
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
  if (viec === 'ghi-ket-qua' || viec === 'thi-that' || viec === 'them-pa') o.viec = viec;
  if (get('sub') === 'phoi-hop') o.sub = 'phoi-hop';
  if (get('muc') === 'ket-luan-khoa') o.muc = 'ket-luan-khoa';
  if (get('mo') === 'lo-trinh') o.mo = 'lo-trinh';
  const tongKet = soNguyenDuong(get('tong-ket'));
  if (tongKet !== undefined) o.tongKet = tongKet;
  const buocTiep = soNguyenDuong(get('buoc-tiep'));
  if (buocTiep !== undefined) o.buocTiep = buocTiep;
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
  /** OV-11f (TQ-7): Case mà tín hiệu đã vào — chuông mở thẳng Case. */
  case_id?: number | null;
  /** SL1 (N1): hạn của việc mà dòng trỏ tới (thông báo tự động / Case giao lưu sẵn; thẻ duyệt, Case suy ra) — Cần làm sắp theo đây. */
  han?: string | null;
};

/**
 * CHUÔNG: CẦN LÀM / ĐỂ BIẾT (PR-VAI-a Q18, T76). Cần làm = trỏ tới việc/thẻ đang chờ CHÍNH người đọc; Để biết = tin một chiều. Loại lạ →
 * Để biết. Dòng Cần làm RỜI nhóm khi việc đã xong — biết được với Case (còn chờ nguyên nhân) và thẻ yêu cầu (còn `cho`): `con_viec = 0`.
 */
const LOAI_CAN_LAM = new Set([
  'nhac_viec', 'nhac_ban_giao', 'duyet_moi', 'duyet_qua_han', 'duyet_tu_choi', 'sos', 'sos_new', 'discipline', 'schedule_move', 'phoi_hop',
  'dang_ky', 'lenh_loi', 'overdue_score', 'overdue_task',   // SL1 (rà #502): 'ban_giao' "Đã có bàn giao" là tin → Để biết
  'bao_len',   // PR-S6F-a Q12: thẻ Báo QL đang chờ chính Quản lý quyết
  /* SL1 (A1-04, A7-05): ba thông báo tự động OV-15d thay "Nhắc" — chính là việc (máy chủ chỉ giữ khi việc còn). C23: Case tạo tay giao người khác phụ trách. */
  'cham_qua_han', 'case_chua_chot_pa', 'chot_lo_trinh', 'case_giao',
  /* SV-YT-TVV: việc Báo PH sau lưu xử lý vi phạm (một dòng mỗi việc; máy chủ báo `con_viec`). */
  'bao_ph_xu_ly',
]);
export function nhomThongBao(n: { kind: string | null; con_viec?: number | null; entity_type?: string | null; read_at?: string | null }): 'can-lam' | 'de-biet' {
  if (n.con_viec === 0) return 'de-biet';
  /* SL1 (rà #502): máy chủ không biết việc của dòng còn hay xong (`con_viec` trống) mà người đọc đã đọc → Để biết, để số chuông không chỉ tăng. */
  if (n.con_viec == null && n.read_at) return 'de-biet';
  /* SL1 (v4d): "SOS n · em · MTn" gửi GVCN (`notifyTeachers`, gắn lượt) là tin một chiều — không có việc nào để nó rời nhóm. */
  if (n.kind === 'sos' && n.entity_type === 'assessment_attempt') return 'de-biet';
  return LOAI_CAN_LAM.has(n.kind ?? '') ? 'can-lam' : 'de-biet';
}

/** Loại hạn (`Han`) của một dòng Cần làm — mỗi hạn một đồng hồ trong rule book (HE_GIAO_DIEN §4). */
export function loaiHanThongBao(n: { kind: string | null; entity_type?: string | null }): DeadlineKind {
  if (n.kind === 'cham_qua_han') return 'nhap-diem';
  if (n.kind === 'chot_lo_trinh') return 'chot-len-ft';
  if (n.kind === 'bao_ph_xu_ly') return 'xu-ly-vi-pham';
  if (n.entity_type === 'yeu_cau_duyet') return 'duyet';
  if (n.kind === 'sos' || n.kind === 'sos_new') return 'xac-minh-sos';
  return 'lap-pa';
}

/**
 * CHUÔNG N1 (SL1 — 05 mục 2.7, v4d): tách hai nhóm và đếm số trên nút. Cần làm = việc còn mở của chính người đọc (`nhomThongBao`), **một Case một
 * dòng** (Case đã có dòng việc thì bỏ dòng "Case chưa chốt PA quá hạn" — giữ dòng đầu theo hạn), sắp **theo hạn** (không hạn xuống cuối, rồi mới nhất);
 * Để biết = tin một chiều, giữ thứ tự máy chủ (chưa đọc trước). V5 SV-SO1 (brief 7): số trên nút = TIN CHƯA ĐỌC (cả hai nhóm, sau khi gộp một Case một dòng) —
 * khác số việc (badge Công việc đếm việc, `demViec`).
 * ponytail: N1 vẫn đọc nhật ký thông báo — việc không phát thông báo không vào chuông; M2 đổi sang đọc hàng đợi trang đầu (N2).
 */
export function dongChuong<T extends { id: number; kind: string | null; entity_type?: string | null; entity_id?: number | null; con_viec?: number | null; han?: string | null; read_at?: string | null }>(
  rows: readonly T[],
): { canLam: T[]; deBiet: T[]; soNut: number } {
  const canLam: T[] = [], deBiet: T[] = [];
  for (const n of rows) (nhomThongBao(n) === 'can-lam' ? canLam : deBiet).push(n);
  const xep = (a: T, b: T) => (a.han && b.han ? (a.han < b.han ? -1 : a.han > b.han ? 1 : 0) : a.han ? -1 : b.han ? 1 : 0) || b.id - a.id;
  canLam.sort((a, b) => Number(a.kind === 'case_chua_chot_pa') - Number(b.kind === 'case_chua_chot_pa') || xep(a, b));
  const daCo = new Set<number>();
  const motCase = canLam.filter((n) => {
    if (n.entity_type !== 'sos_case' || n.entity_id == null) return true;
    if (daCo.has(n.entity_id)) return false;
    daCo.add(n.entity_id);
    return true;
  }).sort(xep);
  return { canLam: motCase, deBiet, soNut: [...motCase, ...deBiet].filter((n) => !n.read_at).length };
}

/** Dòng xanh "bấm tới đâu" (Q21): đọc từ CHÍNH đường `duongThongBao` sẽ mở — không đoán theo chữ. `null` = không điều hướng. */
export function noiDenThongBao(n: ThongBaoRow): string | null {
  const den = duongThongBao(n);
  if (!den) return null;
  const [path, q = ''] = den.split('?');
  const p = new URLSearchParams(q);
  const hv = n.ten_hv ?? t('học viên');
  if (/^\/hoc-vien\/lop\/\d+/.test(path)) return `${n.lop ? t('Lớp {lop}', { lop: n.lop }) : t('Lớp')}${p.get('tab') === 'y-thuc' ? t(' › Ý thức') : ''}`;
  if (/^\/hoc-vien\/\d+/.test(path)) {
    if (p.get('case')) return t('Hồ sơ {hv} › Case{x}', { hv, x: n.mon ? ` ${n.mon}` : '' });
    if (p.get('tab') === 'y-thuc') return t('Hồ sơ {hv} › Ý thức', { hv });
    return t('Hồ sơ {hv}', { hv });
  }
  if (path.startsWith('/cong-viec/yeu-cau')) return t('Công việc › Yêu cầu của tôi');
  if (path.startsWith('/cong-viec/cho-duyet')) return t('Công việc › Chờ duyệt');
  if (path.startsWith('/cong-viec')) return t('Công việc');
  if (path.startsWith('/mock-test/')) return t('Test › Lượt thi{x}', { x: n.ten_hv ? t(' của {ten_hv}', { ten_hv: n.ten_hv }) : '' });
  if (path.startsWith('/test')) return t('Test › Lịch Test / Chấm Test');
  if (path.startsWith('/quan-tri')) return t('Quản trị › Tài khoản');
  return null;
}

/**
 * OV-11f (CA1-2, Q9): thông báo MỞ ĐƯỢC ở vai đang chọn — đường của nó vào khu mà quyền điều hướng (`nav`) của vai cho vào (App đưa khu không có
 * quyền về `/`). Ở Góc nhìn khác vai gốc, chuông chỉ hiện thông báo mở được; không bao giờ đánh dấu đọc một thông báo không mở được.
 * Không điều hướng / hồ sơ / lớp (máy chủ tự chặn) → mở được.
 */
export function moDuocThongBao(n: ThongBaoRow, nav: Partial<Pick<NavQuyen, 'work' | 'workApprove' | 'workOps' | 'workReports' | 'workRequests' | 'admin' | 'test' | 'analysis'>>): boolean {
  const path = (duongThongBao(n) ?? '').split('?')[0];
  if (path.startsWith('/cong-viec/cho-duyet')) return !!nav.workApprove;
  if (path.startsWith('/cong-viec/yeu-cau')) return !!nav.workRequests;
  if (path.startsWith('/cong-viec/van-hanh')) return !!nav.workOps;
  if (path.startsWith('/cong-viec/bao-cao')) return !!nav.workReports;
  if (path.startsWith('/cong-viec')) return !!nav.work;
  if (path.startsWith('/quan-tri')) return !!nav.admin;
  if (path.startsWith('/test')) return !!nav.test;
  if (path.startsWith('/phan-tich')) return !!nav.analysis;
  return true;
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
      return n.student_id != null ? duongHoSoHocVien(n.student_id, n.case_id ? { caseId: n.case_id } : undefined) : null;
    case 'assessment_attempt':
      if (n.kind === 'sos') {
        return n.student_id != null ? duongHoSoHocVien(n.student_id, { dot: n.attempt_id ?? n.entity_id }) : null;
      }
      if (n.kind === 'schedule_move' || n.kind === 'tu_doi_lich' || n.kind === 'huy_vang') return duongDotTest({ id: n.attempt_id ?? n.entity_id });
      /* OV-11f (TQ-6): Báo phụ huynh qua TVV — chỗ làm là thẻ Phối hợp trong hồ sơ em. */
      if (n.kind === 'phoi_hop') return n.student_id != null ? duongHoSoHocVien(n.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }) : null;
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
