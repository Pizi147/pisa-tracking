/**
 * HOÀN TÁC "NGAY HÔM NAY" (#8, G4-14 — bản rà 11/11, chủ SP "Theo hết 10 đề xuất"; luật "không khoá cứng"): Quản lý chuyển một em sang lớp mới NGAY (lệnh thi hành
 * trong cùng lần lưu) → chụp mọi dòng của ĐÚNG em đó mà lần chuyển chạm (`ghi_dao`, như đổi lộ trình / Duyệt), Hoàn tác = trả em về y như trước lúc lưu
 * (lớp cũ, lộ trình, bài, Case / PA, sổ nghĩa vụ; lệnh vừa tạo mất). Ai / gì đã đổi tiếp sau đó → 409 nói rõ (không đảo nửa chừng).
 *
 *   bảng      đo trên seed (FT ↔ FT, FT → RF, thường ↔ thường, thường → FT, FT → thường): danh sách `dongDaoChuyenNgay` — phép kiểm so CẢ DB trước / sau
 *             Hoàn tác (trừ `audit_logs`, `ghi_dao`) để bảng mới bị sót là đỏ ngay.
 *   quyền     như ra lệnh: `class.edit` ở lớp nguồn (lớp em học trước khi chuyển).
 *   giữ       nhật ký (`audit_logs`) — Lịch sử sửa thấy cả lần chuyển lẫn lần Hoàn tác.
 */
import { db, tx } from '../db.ts';
import { forbidden, notFound } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { GhiDao, daoLai, luuGhiDao, type BanGhiDao } from '../platform/ghiDao.ts';
import { writeAudit } from '../platform/audit.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import type { DongDao } from '../duyet/loaiYeuCau.ts';

const LOAI = 'lenh.chuyen_ngay';
const CASE_EM = 'case_id IN (SELECT id FROM sos_cases WHERE student_id = ?)';
const LUOT_EM = 'attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = ?)';

/** Bảng cha trước bảng con (đảo xoá dòng thêm theo thứ tự ngược — con trước cha). `lopIds` = lớp nguồn + lớp đích (lớp thường hết em thì tự kết thúc). */
export function dongDaoChuyenNgay(sid: number, lopIds: readonly number[]): DongDao[] {
  return [
    { bang: 'students', dk: 'id = ?', args: [sid], k: 'sua' },
    { bang: 'classes', dk: `id IN (${lopIds.map(() => '?').join(',')})`, args: [...lopIds], k: 'sua' },
    { bang: 'enrollments', dk: 'student_id = ?', args: [sid], k: 'ca' },
    { bang: 'learning_cycles', dk: 'student_id = ?', args: [sid], k: 'ca' },
    { bang: 'lo_trinh_tiep_theo', dk: 'student_id = ?', args: [sid], k: 'ca' },
    { bang: 'assessment_attempts', dk: 'student_id = ?', args: [sid], k: 'ca' },
    { bang: 'attempt_skills', dk: LUOT_EM, args: [sid], k: 'ca' },
    { bang: 'attempt_schedule_history', dk: LUOT_EM, args: [sid], k: 'them' },
    { bang: 'sos_cases', dk: 'student_id = ?', args: [sid], k: 'ca' },
    { bang: 'case_interventions', dk: CASE_EM, args: [sid], k: 'ca' },
    { bang: 'case_milestones', dk: CASE_EM, args: [sid], k: 'them' },
    { bang: 'sos_case_history', dk: CASE_EM, args: [sid], k: 'them' },
    { bang: 'case_signals', dk: 'student_id = ?', args: [sid], k: 'ca' },
    { bang: 'lenh_chuyen_lop', dk: 'student_id = ?', args: [sid], k: 'ca' },
    { bang: 'ban_giao_mon', dk: 'lenh_id IN (SELECT id FROM lenh_chuyen_lop WHERE student_id = ?)', args: [sid], k: 'ca' },
    { bang: 'ban_chup_lo_trinh', dk: 'student_id = ?', args: [sid], k: 'them' },
    { bang: 'ban_chup_luot', dk: 'ban_chup_id IN (SELECT id FROM ban_chup_lo_trinh WHERE student_id = ?)', args: [sid], k: 'them' },
    { bang: 'nghia_vu', dk: 'hoc_vien = ?', args: [sid], k: 'ca' },
    /* Nhật ký dời hạn khi chuyển lớp: `viec_id` là Case (hạn xác nhận / thêm PA) hoặc PA (hạn kết quả) — bản chép thật 07/11 có cả hai. */
    { bang: 'viec_han_lan', dk: `loai LIKE 'chuyen_lop:%' AND (viec_id IN (SELECT id FROM sos_cases WHERE student_id = ?) OR viec_id IN (SELECT id FROM case_interventions WHERE ${CASE_EM}))`, args: [sid, sid], k: 'them' },
    { bang: 'journey_events', dk: 'student_id = ?', args: [sid], k: 'them' },
    /* Chuông của lần chuyển (vào lớp, giao Case) — Hoàn tác thì gỡ, không để GV lớp mới thấy em "đã chuyển vào". Chuông cấp lớp ("Sắp nhận n em") giữ. */
    { bang: 'notifications', dk: `(entity_type = 'student' AND entity_id = ?) OR (entity_type = 'sos_case' AND entity_id IN (SELECT id FROM sos_cases WHERE student_id = ?))`, args: [sid, sid], k: 'them' },
  ];
}

/**
 * Chạy `fn` (ra lệnh "Ngay hôm nay" của MỘT em, trong giao dịch) có chụp để Hoàn tác. `daChuyen(kq)` = em đã sang lớp mới chưa — chưa (lệnh để tuần sau, lỗi) thì
 * không lưu bản chụp. Trả kết quả + `dao` (id bản ghi Hoàn tác) khi đã chuyển.
 */
export function chuyenNgayCoHoanTac<T>(p: Principal, sid: number, lopIds: readonly number[], fn: () => T, daChuyen: (kq: T) => boolean): T & { dao?: number } {
  const conn = db();
  return tx(() => {
    const g = new GhiDao(conn);
    const ds = dongDaoChuyenNgay(sid, lopIds);
    for (const d of ds) if (d.k !== 'them') g.sua(d.bang, d.dk, ...d.args);
    const kq = ds.filter((d) => d.k !== 'sua').reduce<() => T>((f, d) => () => g.theoDoi(d.bang, d.dk, d.args, f), fn)();
    if (!daChuyen(kq)) return kq as T & { dao?: number };
    for (const d of ds) if (d.k !== 'them') g.boKhongDoi(d.bang);
    return { ...kq, dao: luuGhiDao(conn, { loai: LOAI, bang: 'students', id: sid, nguoi: p.userId, ghi: g }) };
  });
}

/** POST /students/:id/hoan-tac-chuyen-ngay { dao } — trả em về lớp cũ y như trước lần chuyển ngay. Quyền: `class.edit` lớp nguồn (lớp ghi danh trước đó). */
export function hoanTacChuyenNgay(p: Principal, sid: number, daoId: unknown): { lopId: number | null } {
  const conn = db();
  const g = conn.prepare(`SELECT * FROM ghi_dao WHERE id = ? AND loai = ? AND bang = 'students' AND doi_tuong_id = ?`).get(Number(daoId), LOAI, sid) as BanGhiDao | undefined;
  if (!g) throw notFound('Không còn bản ghi để hoàn tác.');
  /* Lớp nguồn = ghi danh bị đóng ("transferred") trong bản chụp — quyền kiểm theo lớp em học TRƯỚC lần chuyển. */
  const muc = JSON.parse(g.du_lieu) as { bang: string; truoc: any[] }[];
  const lopNguon = (muc.find((m) => m.bang === 'enrollments')?.truoc ?? []).find((e) => e.status === 'active')?.class_id as number | undefined;
  if (!lopNguon || !can(p, PERMISSIONS.CLASS_EDIT, { classId: lopNguon })) throw forbidden('Chỉ Quản lý lớp cũ của em hoàn tác được lần chuyển này.');
  return tx(() => {
    /* Dòng thêm (lộ trình mới, lượt MT…) xoá trước, dòng sửa (ghi danh cũ, lượt đổi lớp…) trả sau — khoá ngoại kiểm lúc chốt giao dịch. */
    conn.pragma('defer_foreign_keys = ON');
    daoLai(conn, g, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: sid, after: { classId: lopNguon, _hoan: true, _nguon: 'Hoàn tác chuyển ngay' } });
    return { lopId: lopNguon };
  });
}
