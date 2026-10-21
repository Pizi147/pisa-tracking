/**
 * BÀI TRÊN LỚP (SV-BAI-LOP, V5 C11 / T18, mockup `thiet-ke/v5/ho-so-hv.html` khu "Bài trên lớp") — hồ sơ HV ghi điểm một bài trên lớp theo thang
 * của bài (7 / 10, 15 / 20…). Tuỳ chọn: không sinh việc, không nhắc, KHÔNG vào bảng điểm MT, Overall, chỉ số hay KPI (bảng riêng `bai_tren_lop`).
 *
 * QUYỀN (máy chủ, mỗi lần ghi / sửa / xoá): cùng cột với Góp ý tuần (`cotCua`) — GV dạy kỹ năng ở lớp → kỹ năng đó (FT W1 / W2 → W); GVCN → mọi kỹ năng;
 * Quản lý / Quản trị (`class.edit` của lớp) → mọi kỹ năng. Đọc = quyền xem hồ sơ HV (`student.view`). Lịch sử: `audit_logs` bai_tren_lop.*.
 */
import { db, tx } from '../db.ts';
import { BAI_LOP_NHAN_XET_TOI_DA, BAI_LOP_TEN_TOI_DA, BAI_LOP_THANG_TOI_DA, PERMISSIONS, tuanLich } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, notFound, nowIso, toInt } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { mondayOf } from '../platform/week.ts';
import { cotCua, docLop } from '../classes/gopYTuan.ts';

type Dong = { id: number; student_id: number; class_id: number; skill: string; ten_bai: string; diem: number; thang: number; tuan: string; nhan_xet: string | null };

const coLop = (sid: number, classId: number) =>
  !!db().prepare('SELECT 1 AS c FROM enrollments WHERE student_id = ? AND class_id = ? LIMIT 1').get(sid, classId);

/** Kỹ năng người xem ghi được ở lớp (rỗng = chỉ đọc). */
function kyNangGhi(p: Principal, classId: number, today: string) {
  const c = docLop(classId);
  return { c, cot: cotCua(p, c, today) };
}

/** GET /students/:id/bai-tren-lop — mọi bài của em (mới trước) + lớp của em và kỹ năng người xem ghi được (nút "+ Ghi bài trên lớp"). */
export function dsBaiTrenLop(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  const today = demoToday();
  const conn = db();
  const lopIds = (conn.prepare('SELECT DISTINCT class_id FROM enrollments WHERE student_id = ? ORDER BY class_id').all(studentId) as { class_id: number }[])
    .map((r) => r.class_id);
  const lop = lopIds.map((id) => {
    const { c, cot } = kyNangGhi(p, id, today);
    return { classId: id, code: c.code, kyNang: cot.filter((k) => k.ghiDuoc).map((k) => k.skill), nhan: Object.fromEntries(cot.map((k) => [k.skill, k.nhan])) };
  });
  const ghi = new Map(lop.map((l) => [l.classId, new Set(l.kyNang)]));
  const bai = (conn.prepare(
    `SELECT b.*, c.code AS lop, g.full_name AS ghi_ten, s.full_name AS sua_ten FROM bai_tren_lop b JOIN classes c ON c.id = b.class_id
       LEFT JOIN users g ON g.id = b.ghi_boi LEFT JOIN users s ON s.id = b.sua_boi
      WHERE b.student_id = ? ORDER BY b.tuan DESC, b.id DESC`,
  ).all(studentId) as any[]).map((r) => ({
    id: r.id as number, classId: r.class_id as number, lop: r.lop as string, skill: r.skill as string,
    tenBai: r.ten_bai as string, diem: r.diem as number, thang: r.thang as number,
    tuan: r.tuan as string, tuanMa: tuanLich(r.tuan, today), nhanXet: (r.nhan_xet ?? null) as string | null,
    ghiBoi: (r.ghi_ten ?? null) as string | null, ghiLuc: r.ghi_luc as string, suaBoi: (r.sua_ten ?? null) as string | null, suaLuc: (r.sua_luc ?? null) as string | null,
    sua: ghi.get(r.class_id)?.has(r.skill) ?? false,
  }));
  return { bai, lop: lop.map(({ nhan: _n, ...l }) => l) };
}

/** Đọc + kiểm thân yêu cầu (dùng cho thêm và sửa). Thang của bài, không quy đổi band. */
function docThan(body: Record<string, unknown>, today: string) {
  const tenBai = chuTuDo(body.tenBai ?? null, 'Tên bài', BAI_LOP_TEN_TOI_DA);
  if (!tenBai) throw badRequest('Thiếu tên bài.');
  const so = (v: unknown, ten: string) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw badRequest(`${ten} phải là số.`);
    return v;
  };
  const diem = so(body.diem, 'Điểm');
  const thang = so(body.thang, 'Thang điểm');
  if (thang <= 0 || thang > BAI_LOP_THANG_TOI_DA) throw badRequest(`Thang điểm phải lớn hơn 0 và không quá ${BAI_LOP_THANG_TOI_DA}.`);
  if (diem < 0 || diem > thang) throw badRequest(`Điểm phải từ 0 tới ${thang}.`);
  if (!isIsoDate(body.tuan)) throw badRequest('Tuần không hợp lệ.');
  const tuan = mondayOf(body.tuan);
  if (tuan > mondayOf(today)) throw badRequest('Chưa tới tuần này — chỉ ghi bài từ tuần này trở về trước.');
  const nhanXet = chuTuDo(body.nhanXet ?? null, 'Nhận xét', BAI_LOP_NHAN_XET_TOI_DA);
  if (typeof body.skill !== 'string') throw badRequest('Thiếu kỹ năng.');
  return { skill: body.skill, tenBai, diem, thang, tuan, nhanXet };
}

type Than = ReturnType<typeof docThan>;

/** Kỹ năng phải là cột của lớp; người ghi phải được ghi kỹ năng đó. */
function kiemGhi(p: Principal, classId: number, skill: string, today: string) {
  const { c, cot } = kyNangGhi(p, classId, today);
  const k = cot.find((x) => x.skill === skill);
  if (!k) throw badRequest('Kỹ năng không thuộc lớp này.');
  if (!k.ghiDuoc) throw forbidden(`Bạn không ghi được bài ${k.nhan} của lớp ${c.code} — chỉ GV dạy ${k.nhan}, GVCN hoặc Quản lý.`);
  return { c, nhan: k.nhan };
}

const tuDong = (d: Dong): Than => ({ skill: d.skill, tenBai: d.ten_bai, diem: d.diem, thang: d.thang, tuan: d.tuan, nhanXet: d.nhan_xet });
const anh = ({ skill: _s, ...t }: Than, nhan: string) => ({ kyNang: nhan, ...t });

/** POST /students/:id/bai-tren-lop { classId, skill, tenBai, diem, thang, tuan, nhanXet? } — thêm một bài. */
export function themBaiTrenLop(p: Principal, studentId: number, body: Record<string, unknown>) {
  const today = demoToday();
  const classId = toInt(body.classId);
  if (!classId) throw badRequest('Thiếu lớp.');
  const t = docThan(body, today);
  const { c, nhan } = kiemGhi(p, classId, t.skill, today);
  if (!coLop(studentId, classId)) throw badRequest('Học viên không học lớp này.');
  const luc = nowIso();
  return tx(() => {
    const id = Number(db().prepare(
      `INSERT INTO bai_tren_lop (student_id, class_id, skill, ten_bai, diem, thang, tuan, nhan_xet, ghi_boi, ghi_luc) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(studentId, classId, t.skill, t.tenBai, t.diem, t.thang, t.tuan, t.nhanXet, p.userId, luc).lastInsertRowid);
    writeAudit({
      actorUserId: p.userId, action: 'bai_tren_lop.them', entityType: 'student', entityId: studentId,
      entityLabel: `${c.code} · ${tuanLich(t.tuan, today)} · ${nhan}`, before: null, after: { id, ...anh(t, nhan) },
    });
    return { id, ghiBoi: p.fullName, ghiLuc: luc };
  });
}

function docBai(id: number): Dong {
  const r = db().prepare('SELECT id, student_id, class_id, skill, ten_bai, diem, thang, tuan, nhan_xet FROM bai_tren_lop WHERE id = ?').get(id) as Dong | undefined;
  if (!r) throw notFound('Không tìm thấy bài trên lớp.');
  return r;
}

/** PUT /bai-tren-lop/:id { skill, tenBai, diem, thang, tuan, nhanXet? } — sửa (lớp giữ nguyên); phải ghi được cả kỹ năng cũ lẫn mới. Lưu lại y nguyên = không ghi. */
export function suaBaiTrenLop(p: Principal, id: number, body: Record<string, unknown>) {
  const today = demoToday();
  const cu = docBai(id);
  const cuK = kiemGhi(p, cu.class_id, cu.skill, today);
  const t = docThan(body, today);
  const { c, nhan } = t.skill === cu.skill ? cuK : kiemGhi(p, cu.class_id, t.skill, today);
  const truoc = anh(tuDong(cu), cuK.nhan);
  const sau = anh(t, nhan);
  if (JSON.stringify(truoc) === JSON.stringify(sau)) return { id, doi: false };
  const luc = nowIso();
  return tx(() => {
    db().prepare('UPDATE bai_tren_lop SET skill = ?, ten_bai = ?, diem = ?, thang = ?, tuan = ?, nhan_xet = ?, sua_boi = ?, sua_luc = ? WHERE id = ?')
      .run(t.skill, t.tenBai, t.diem, t.thang, t.tuan, t.nhanXet, p.userId, luc, id);
    writeAudit({
      actorUserId: p.userId, action: 'bai_tren_lop.sua', entityType: 'student', entityId: cu.student_id,
      entityLabel: `${c.code} · ${tuanLich(t.tuan, today)} · ${nhan}`, before: { id, ...truoc }, after: { id, ...sau },
    });
    return { id, doi: true, suaBoi: p.fullName, suaLuc: luc };
  });
}

/** DELETE /bai-tren-lop/:id — xoá hẳn dòng; nhật ký giữ bản trước khi xoá. */
export function xoaBaiTrenLop(p: Principal, id: number) {
  const today = demoToday();
  const cu = docBai(id);
  const { c, nhan } = kiemGhi(p, cu.class_id, cu.skill, today);
  return tx(() => {
    db().prepare('DELETE FROM bai_tren_lop WHERE id = ?').run(id);
    writeAudit({
      actorUserId: p.userId, action: 'bai_tren_lop.xoa', entityType: 'student', entityId: cu.student_id,
      entityLabel: `${c.code} · ${tuanLich(cu.tuan, today)} · ${nhan}`, before: { id, ...anh(tuDong(cu), nhan) }, after: null,
    });
    return { id, xoa: true };
  });
}
