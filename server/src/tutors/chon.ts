/**
 * Ô CHỌN TUTOR (TU-a, đặc tả Tutor mục 4, 5, 6) — `GET /tutors/chon?q=&paId=` (mỗi buổi của Ghi kết quả PA Tutor) hoặc `?q=&studentId=` (nhóm "Tutor"
 * của ô Người dạy khi Thêm / Sửa / Xác nhận PA Tutor). Máy chủ tự suy lớp (lớp của Case — `loadCase().class_id`; hoặc lớp em đang học), kỹ năng PA (topic
 * Case) và quyền: `paId` → như ghi kết quả PA (`kiemQuyenPa`); `studentId` → xem được em + có `sos.edit` (người thêm / sửa PA).
 * Trả tối đa 20 dòng, nhóm gợi ý (nơi dạy = chi nhánh lớp + có kỹ năng PA) trước; bỏ tutor có kết luận mới nhất "Ngừng hợp tác"; SĐT chỉ 3 số cuối.
 * `nhomGoiY`: tiêu đề nhóm gợi ý ("Monbay · L"). `dienSan` (chỉ `paId`): tutor buổi 1 — Người dạy của PA (tên ngoài) khớp đúng một tutor, không thì tutor buổi cuối của lần ghi trước.
 */
import { db } from '../db.ts';
import { forbidden, notFound, normalizeName } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { PERMISSIONS, hinhThucTuSuy, knTutorCuaTopic, type HinhThuc } from '../../../shared/domain/index.ts';
import { activeClassOf } from '../yThuc/access.ts';
import { kiemQuyenPa, loadCase } from '../cases/cases.ts';

export type TutorChon = { id: number; ten: string; noiDay: string | null; kyNang: string; sdtDuoi: string | null; goiY: boolean; hinhThuc: HinhThuc | null };
export type DienSanTutor = { tutorId: number | null; ten: string; hinhThuc: HinhThuc | null };

const TOI_DA = 20;

export function chonTutor(p: Principal, o: { q?: string; paId?: number | null; studentId?: number | null }): { ds: TutorChon[]; dienSan: DienSanTutor | null; nhomGoiY: string | null } {
  const conn = db();
  let lopId: number | null = null;
  let topic: string | null = null;
  let iv: any = null;
  if (o.paId) {
    iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(o.paId);
    if (!iv) throw notFound('Không tìm thấy phương án.');
    const c = loadCase(iv.case_id);
    kiemQuyenPa(p, iv, c);
    lopId = c.class_id ?? null;
    topic = c.topic ?? null;
  } else if (o.studentId) {
    require_(p, PERMISSIONS.STUDENT_VIEW, { studentId: o.studentId }, 'Bạn không có quyền xem học viên này.');
    if (!can(p, PERMISSIONS.SOS_EDIT, { anyScope: true })) throw forbidden('Bạn không chọn được tutor.');
    lopId = activeClassOf(o.studentId);
  } else {
    throw forbidden('Chọn tutor cần phương án hoặc học viên.');
  }
  const lop = lopId ? conn.prepare('SELECT c.branch_id, b.name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?').get(lopId) as any : null;
  const cnLop: number | null = lop?.branch_id ?? null;
  const kn = knTutorCuaTopic(topic);
  /* Tiêu đề nhóm gợi ý của ô chọn: "Monbay · L" (mockup mục 1). */
  const nhomGoiY = lop ? [lop.name, kn.join('/')].filter(Boolean).join(' · ') : null;
  /* Một câu: tutor + tên chi nhánh + kết luận mới nhất — mỗi tutor đọc đúng một nhận xét qua chỉ mục (tutor_id, luc), không quét cả bảng nhận xét. */
  const hang = (conn.prepare(
    `SELECT t.id, t.ten, t.sdt, t.noi_day_branch_id, t.chi_online, t.ky_nang, b.name AS noi_day,
            (SELECT n.ket_luan FROM tutor_nhan_xet n WHERE n.tutor_id = t.id ORDER BY n.luc DESC, n.id DESC LIMIT 1) AS ket_luan
       FROM tutors t
       LEFT JOIN branches b ON b.id = t.noi_day_branch_id`,
  ).all() as any[]).filter((r) => r.ket_luan !== 'ngung');
  const thanh = (r: any): TutorChon => {
    const ky = String(r.ky_nang);
    return {
      id: r.id, ten: r.ten, noiDay: r.chi_online ? 'Chỉ online' : r.noi_day ?? null, kyNang: ky, sdtDuoi: r.sdt ? String(r.sdt).slice(-3) : null,
      goiY: cnLop != null && r.noi_day_branch_id === cnLop && (!kn.length || kn.some((k) => ky.split(',').includes(k))),
      hinhThuc: hinhThucTuSuy({ noiDayBranchId: r.noi_day_branch_id, chiOnline: r.chi_online }, cnLop),
    };
  };
  const go = normalizeName(o.q ?? '');
  const so = (o.q ?? '').replace(/\D/g, '');
  /* Tìm theo số: người sửa danh sách (`tutor.manage`) tìm cả SĐT; người khác chỉ khớp ≤ 3 số CUỐI — gõ dần từng số không dò ra đủ SĐT (mục 12.5). */
  const quanLy = can(p, PERMISSIONS.TUTOR_MANAGE, { anyScope: true });
  const khopSo = (sdt: string | null) => !!so && !!sdt && (quanLy ? so.length >= 3 && sdt.includes(so) : so.length <= 3 && sdt.endsWith(so));
  const ds = hang
    .filter((r) => !go || normalizeName(r.ten).includes(go) || khopSo(r.sdt))
    .map(thanh)
    .sort((a, b) => Number(b.goiY) - Number(a.goiY) || a.ten.localeCompare(b.ten, 'vi'))
    .slice(0, TOI_DA);

  let dienSan: DienSanTutor | null = null;
  if (iv) {
    const khop = !iv.performer_user_id && iv.performer_name
      ? hang.filter((r) => normalizeName(r.ten) === normalizeName(iv.performer_name)) : [];
    const hinh = (r: any) => hinhThucTuSuy({ noiDayBranchId: r.noi_day_branch_id, chiOnline: r.chi_online }, cnLop);
    if (khop.length === 1) dienSan = { tutorId: khop[0].id, ten: khop[0].ten, hinhThuc: hinh(khop[0]) };
    else {
      const b = conn.prepare(`SELECT b.tutor_id, b.tutor_ten FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
          WHERE f.intervention_id = ? ORDER BY f.id DESC, b.buoi_so DESC LIMIT 1`).get(iv.id) as any;
      const t = b?.tutor_id ? hang.find((r) => r.id === b.tutor_id) : null;
      if (t) dienSan = { tutorId: t.id, ten: t.ten, hinhThuc: hinh(t) };
      else if (b) dienSan = { tutorId: null, ten: b.tutor_ten, hinhThuc: null };
    }
  }
  return { ds, dienSan, nhomGoiY };
}
