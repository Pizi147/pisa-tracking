/**
 * Ô CHỌN TUTOR (TU-a, đặc tả Tutor mục 4, 5, 6) — `GET /tutors/chon?q=&paId=` (mỗi buổi của Ghi kết quả PA Tutor) hoặc `?q=&gop=1` (hộp Gộp tên gõ tay). Máy chủ tự suy lớp
 * (lớp của Case — `loadCase().class_id`), kỹ năng PA (topic Case) và quyền: `paId` → như ghi kết quả PA (`kiemQuyenPa`). N54 (19/11): PA Tutor thôi có ô "Người dạy" →
 * bỏ `studentId` / `classId` (S6: không còn nơi gọi).
 * Trả tối đa 20 dòng: gợi ý (nơi dạy = chi nhánh lớp + có kỹ năng PA) → GV → tutor; bỏ tutor có kết luận mới nhất "Ngừng hợp tác"; SĐT chỉ 3 số cuối.
 * TU4 (TU2-1, chủ SP 19/11): ô Tutor gồm cả GV — chưa gõ: GV có vai ở chi nhánh lớp; gõ: mọi GV đang làm việc (MỘT câu). Dòng `loai: 'gv'` + `gvId`, không có SĐT;
 * tutor đã gắn GV (`tutors.user_id`) chỉ hiện một lần, dưới nhóm GV (`id` = dòng danh bạ đó). GV chưa có dòng danh bạ: `id` = −gvId (web cũ gửi `tutorId` âm — máy chủ đổi về `gvId`).
 * `nhomGoiY`: tiêu đề nhóm gợi ý ("Monbay · L"). `dienSan` (chỉ `paId`): tutor của lần ghi gần nhất (dòng Tutor cuối).
 */
import { db } from '../db.ts';
import { forbidden, notFound, normalizeName } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { PERMISSIONS, knTutorCuaKyNang, hinhThucTuSuy, knTutorCuaTopic, type HinhThuc } from '../../../shared/domain/index.ts';
import { kiemQuyenPa, loadCase } from '../cases/cases.ts';
import { kiemQuyenDanhBa } from './trang.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';

export type TutorChon = { id: number; ten: string; noiDay: string | null; kyNang: string; sdtDuoi: string | null; goiY: boolean; hinhThuc: HinhThuc | null;
  loai: 'gv' | 'tutor'; gvId?: number };
export type DienSanTutor = { tutorId: number | null; ten: string; hinhThuc: HinhThuc | null };

const TOI_DA = 20;

export function chonTutor(p: Principal, o: { q?: string; paId?: number | null; gop?: boolean }): { ds: TutorChon[]; dienSan: DienSanTutor | null; nhomGoiY: string | null } {
  const conn = db();
  let lopId: number | null = null;
  let topic: string | null = null;
  let iv: any = null;
  /* TU2-5 (R2.9): ô chọn của hộp Gộp tên gõ tay (trang Tutor) — người sửa danh bạ (Quản trị, Head tutor, Head chi nhánh mình); không cần PA / học viên; có cả tutor "Ngừng hợp tác"
     (buổi cũ của người đã nghỉ vẫn gộp được). Không `lopId` → gợi ý GV theo chi nhánh đầu của Head (Quản trị / Head tutor: chỉ khi gõ). */
  const quyenGop = o.gop ? kiemQuyenDanhBa(p) : null;
  if (quyenGop) { /* không lớp, không PA */ } else if (o.paId) {
    iv = conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(o.paId);
    if (!iv) throw notFound('Không tìm thấy phương án.');
    const c = loadCase(iv.case_id);
    kiemQuyenPa(p, iv, c);
    lopId = c.class_id ?? null;
    topic = c.topic ?? null;
  } else {
    throw forbidden('Chọn tutor cần phương án.');
  }
  const lop = lopId ? conn.prepare('SELECT c.branch_id, b.name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?').get(lopId) as any : null;
  const cnLop: number | null = quyenGop ? (quyenGop.tatCa ? null : quyenGop.chiNhanh[0] ?? null) : lop?.branch_id ?? null;
  const kn = knTutorCuaTopic(topic);
  /* Tiêu đề nhóm gợi ý của ô chọn: "Monbay · L" (mockup mục 1). */
  const nhomGoiY = lop ? [lop.name, kn.join('/')].filter(Boolean).join(' · ') : null;
  /* Một câu: tutor + tên chi nhánh + kết luận mới nhất — mỗi tutor đọc đúng một nhận xét qua chỉ mục (tutor_id, luc), không quét cả bảng nhận xét. */
  const tatCa = conn.prepare(
    `SELECT t.id, COALESCE(gu.full_name, t.ten) AS ten, t.sdt, t.noi_day_branch_id, t.chi_online, t.ky_nang, t.user_id, b.name AS noi_day,
            (SELECT n.ket_luan FROM tutor_nhan_xet n WHERE n.tutor_id = t.id ORDER BY n.luc DESC, n.id DESC LIMIT 1) AS ket_luan
       FROM tutors t
       LEFT JOIN branches b ON b.id = t.noi_day_branch_id
       LEFT JOIN users gu ON gu.id = t.user_id`,
  ).all() as any[];
  const hang = quyenGop ? tatCa : tatCa.filter((r) => r.ket_luan !== 'ngung');
  const khopKn = (ky: string) => !kn.length || kn.some((k) => ky.split(',').includes(k));
  const thanh = (r: any): TutorChon => {
    const ky = String(r.ky_nang);
    return {
      id: r.id, ten: r.ten, noiDay: r.chi_online ? 'Chỉ online' : r.noi_day ?? null, kyNang: ky, sdtDuoi: r.sdt ? String(r.sdt).slice(-3) : null,
      goiY: cnLop != null && r.noi_day_branch_id === cnLop && khopKn(ky),
      hinhThuc: hinhThucTuSuy({ noiDayBranchId: r.noi_day_branch_id, chiOnline: r.chi_online }, cnLop), loai: 'tutor',
    };
  };
  const go = normalizeName(o.q ?? '');
  const so = (o.q ?? '').replace(/\D/g, '');
  /* Tìm theo số: người sửa danh sách (`tutor.manage`) tìm cả SĐT; người khác chỉ khớp ≤ 3 số CUỐI — gõ dần từng số không dò ra đủ SĐT (mục 12.5). */
  const quanLy = can(p, PERMISSIONS.TUTOR_MANAGE, { anyScope: true });
  const khopSo = (sdt: string | null) => !!so && !!sdt && (quanLy ? so.length >= 3 && sdt.includes(so) : so.length <= 3 && sdt.endsWith(so));
  /* TU4: GV — chưa gõ: có vai GV ở chi nhánh lớp (không có lớp: không gợi GV); gõ: mọi GV đang làm việc. Một câu (chi nhánh + kỹ năng hồ sơ gộp chuỗi). */
  const gv = go || cnLop != null ? (conn.prepare(
    `SELECT u.id, u.full_name,
            (SELECT GROUP_CONCAT(s.skill) FROM user_skills s WHERE s.user_id = u.id) AS kn,
            (SELECT GROUP_CONCAT(b.id || '|' || b.name, char(31)) FROM (SELECT DISTINCT ur2.branch_id FROM user_roles ur2 WHERE ur2.user_id = u.id AND ur2.status = 'active') x
               JOIN branches b ON b.id = x.branch_id) AS cn
       FROM users u
      WHERE u.status = 'active' AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
              WHERE ur.user_id = u.id AND ur.status = 'active' AND r.key = 'teacher'${go ? '' : ' AND ur.branch_id = ?'})`,
  ).all(...(go ? [] : [cnLop])) as any[]) : [];
  /* Dòng danh bạ đã gắn GV chỉ hiện ở nhóm GV (kết luận mới nhất "Ngừng hợp tác" → bỏ GV đó như tutor). */
  const cuaGv = new Map(tatCa.filter((r) => r.user_id != null).map((r) => [r.user_id as number, r]));
  const dsGv: TutorChon[] = gv.filter((u) => !go || normalizeName(u.full_name).includes(go)).flatMap((u): TutorChon[] => {
    const lk = cuaGv.get(u.id);
    if (lk?.ket_luan === 'ngung' && !quyenGop) return [];
    const cn = String(u.cn ?? '').split('\u001f').filter(Boolean).map((x) => { const [id, ...ten] = x.split('|'); return { id: Number(id), ten: ten.join('|') }; });
    if (quyenGop && !quyenGop.tatCa && !cn.some((x) => quyenGop.chiNhanh.includes(x.id))) return [];   // Head chỉ gộp vào GV chi nhánh mình (cùng luật `gopTen`)
    const noi = cn.find((x) => x.id === cnLop) ?? cn[0] ?? null;
    const ky = knTutorCuaKyNang(u.kn);
    return [{
      id: lk?.id ?? -u.id, ten: u.full_name, noiDay: noi?.ten ?? null, kyNang: ky, sdtDuoi: null,
      goiY: cnLop != null && noi?.id === cnLop && khopKn(ky), hinhThuc: hinhThucTuSuy({ noiDayBranchId: noi?.id ?? null, chiOnline: 0 }, cnLop), loai: 'gv', gvId: u.id,
    }];
  });
  const ds = [
    ...dsGv,
    ...hang.filter((r) => r.user_id == null && (!go || normalizeName(r.ten).includes(go) || khopSo(r.sdt))).map(thanh),
  ].sort((a, b) => Number(b.goiY) - Number(a.goiY) || Number(b.loai === 'gv') - Number(a.loai === 'gv') || a.ten.localeCompare(b.ten, 'vi'))
    .slice(0, TOI_DA);

  let dienSan: DienSanTutor | null = null;
  if (iv) {
    /* TU4: kỳ sau điền sẵn tutor của lần ghi gần nhất (dòng Tutor cuối). */
    const b = conn.prepare(`SELECT b.tutor_id, b.tutor_ten FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
        WHERE f.intervention_id = ? ORDER BY f.id DESC, b.buoi_so DESC LIMIT 1`).get(iv.id) as any;
    /* Rà #1862 · #1872 P2-15: dòng danh bạ của GV không còn hợp lệ (cùng `laNguoiHopLe` lúc lưu) không điền sẵn — lưu dưới tên đó sẽ bị chặn. Tên = tên tài khoản (T3). */
    const t = b?.tutor_id ? hang.find((r) => r.id === b.tutor_id && (r.user_id == null || laNguoiHopLe(r.user_id, 'giao_vien'))) : null;
    if (t) dienSan = { tutorId: t.id, ten: t.ten, hinhThuc: hinhThucTuSuy({ noiDayBranchId: t.noi_day_branch_id, chiOnline: t.chi_online }, cnLop) };
    else if (b && !b.tutor_id) dienSan = { tutorId: null, ten: b.tutor_ten, hinhThuc: null };
  }
  return { ds, dienSan, nhomGoiY };
}
