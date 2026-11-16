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
import { demoToday } from '../demoConfig.ts';
import { boiCanhTheoLop, dongTuBody, raLenh } from './lenhChuyen.ts';

const LOAI = 'lenh.chuyen_ngay';
const q = (n: number) => Array.from({ length: n }, () => '?').join(',');

/**
 * Bảng cha trước bảng con (đảo xoá dòng thêm theo thứ tự ngược — con trước cha). `lopIds` = lớp nguồn + lớp đích (lớp thường hết em thì tự kết thúc).
 * DUONG-LUI-2 (P1-09): nhận MỘT em hoặc cả lô em (chốt cả lớp Cuối khoá "Ngay hôm nay").
 */
export function dongDaoChuyenNgay(sidVao: number | readonly number[], lopIds: readonly number[]): DongDao[] {
  const sids = typeof sidVao === 'number' ? [sidVao] : [...sidVao];
  const em = `IN (${q(sids.length)})`, lop = `IN (${q(lopIds.length)})`;
  const caseEm = `case_id IN (SELECT id FROM sos_cases WHERE student_id ${em})`;
  const luotEm = `attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id ${em})`;
  return [
    { bang: 'students', dk: `id ${em}`, args: sids, k: 'sua' },
    { bang: 'classes', dk: `id ${lop}`, args: [...lopIds], k: 'sua' },
    { bang: 'enrollments', dk: `student_id ${em}`, args: sids, k: 'ca' },
    { bang: 'learning_cycles', dk: `student_id ${em}`, args: sids, k: 'ca' },
    { bang: 'lo_trinh_tiep_theo', dk: `student_id ${em}`, args: sids, k: 'ca' },
    /* Chốt Cuối khoá lớp thường xoá nháp của em (`raLenh`). */
    { bang: 'lo_trinh_nhap', dk: `student_id ${em}`, args: sids, k: 'ca' },
    { bang: 'assessment_attempts', dk: `student_id ${em}`, args: sids, k: 'ca' },
    { bang: 'attempt_skills', dk: luotEm, args: sids, k: 'ca' },
    { bang: 'attempt_schedule_history', dk: luotEm, args: sids, k: 'them' },
    { bang: 'sos_cases', dk: `student_id ${em}`, args: sids, k: 'ca' },
    { bang: 'case_interventions', dk: caseEm, args: sids, k: 'ca' },
    { bang: 'case_milestones', dk: caseEm, args: sids, k: 'them' },
    { bang: 'sos_case_history', dk: caseEm, args: sids, k: 'them' },
    { bang: 'case_signals', dk: `student_id ${em}`, args: sids, k: 'ca' },
    { bang: 'lenh_chuyen_lop', dk: `student_id ${em}`, args: sids, k: 'ca' },
    { bang: 'ban_giao_mon', dk: `lenh_id IN (SELECT id FROM lenh_chuyen_lop WHERE student_id ${em})`, args: sids, k: 'ca' },
    { bang: 'ban_chup_lo_trinh', dk: `student_id ${em}`, args: sids, k: 'them' },
    { bang: 'ban_chup_luot', dk: `ban_chup_id IN (SELECT id FROM ban_chup_lo_trinh WHERE student_id ${em})`, args: sids, k: 'them' },
    { bang: 'nghia_vu', dk: `hoc_vien ${em}`, args: sids, k: 'ca' },
    /* Nhật ký dời hạn khi chuyển lớp: `viec_id` là Case (hạn xác nhận / thêm PA) hoặc PA (hạn kết quả) — bản chép thật 07/11 có cả hai. */
    { bang: 'viec_han_lan', dk: `loai LIKE 'chuyen_lop:%' AND (viec_id IN (SELECT id FROM sos_cases WHERE student_id ${em}) OR viec_id IN (SELECT id FROM case_interventions WHERE ${caseEm}))`, args: [...sids, ...sids], k: 'them' },
    { bang: 'journey_events', dk: `student_id ${em}`, args: sids, k: 'them' },
    /* Chuông của lần chuyển (vào lớp, giao Case) — Hoàn tác thì gỡ, không để GV lớp mới thấy em "đã chuyển vào". */
    { bang: 'notifications', dk: `(entity_type = 'student' AND entity_id ${em}) OR (entity_type = 'sos_case' AND entity_id IN (SELECT id FROM sos_cases WHERE student_id ${em}))`, args: [...sids, ...sids], k: 'them' },
    /* Chuông cấp lớp "Sắp nhận / Đã nhận n em" (`thongBaoSapNhan` — đếm lại, sửa tại chỗ theo khoá) — Hoàn tác trả về như trước, GVCN lớp mới không thấy em "đã nhận". */
    { bang: 'notifications', dk: `entity_type = 'class' AND entity_id ${lop}`, args: [...lopIds], k: 'ca' },
  ];
}

/** Bản ghi Hoàn tác gắn với: một em (`students`, Chuyển lớp một em) hoặc lớp nguồn (`classes`, chốt Cuối khoá cả lớp). */
type DoiTuong = { bang: 'students' | 'classes'; id: number };

/**
 * Chạy `fn` (ra lệnh "Ngay hôm nay", trong giao dịch) có chụp để Hoàn tác. `daChuyen(kq)` = đã có em sang lớp mới chưa — chưa (lệnh để tuần sau, lỗi) thì
 * không lưu bản chụp. Trả kết quả + `dao` (id bản ghi Hoàn tác) khi đã chuyển. `sids` = em của lần lưu (một em hoặc một lô Cuối khoá).
 */
export function chuyenNgayCoHoanTac<T>(p: Principal, sids: number | readonly number[], lopIds: readonly number[], fn: () => T, daChuyen: (kq: T) => boolean,
  doi: DoiTuong = { bang: 'students', id: typeof sids === 'number' ? sids : sids[0] }): T & { dao?: number } {
  const conn = db();
  return tx(() => {
    const g = new GhiDao(conn);
    const ds = dongDaoChuyenNgay(sids, [...new Set(lopIds)]);
    for (const d of ds) if (d.k !== 'them') g.sua(d.bang, d.dk, ...d.args);
    const kq = ds.filter((d) => d.k !== 'sua').reduce<() => T>((f, d) => () => g.theoDoi(d.bang, d.dk, d.args, f), fn)();
    if (!daChuyen(kq)) return kq as T & { dao?: number };
    for (const d of ds) if (d.k !== 'them') g.boKhongDoi(d.bang);
    return { ...kq, dao: luuGhiDao(conn, { loai: LOAI, bang: doi.bang, id: doi.id, nguoi: p.userId, ghi: g }) };
  });
}

/**
 * POST /classes/:id/transition — chốt cả lớp (trang Cuối khoá). DUONG-LUI-2 (P1-09): có dòng "Ngay hôm nay" → chụp cả lô để Hoàn tác (như Chuyển lớp
 * một em #8), web không hỏi lại trước khi chốt; chỉ tuần sau → lệnh chờ như cũ (Huỷ quyết định).
 */
export function chotCaLop(p: Principal, lopId: number, b: { tuanChung?: string | null; dongs?: unknown }) {
  const dongs = Array.isArray(b.dongs) ? b.dongs.map(dongTuBody) : [];
  const ra = () => raLenh(p, { lopNguonId: lopId, boiCanh: boiCanhTheoLop(lopId), tuanChung: b.tuanChung ?? null, caLop: true, dongs });
  const homNay = demoToday();
  if (!dongs.some((d) => (d.tuan ?? b.tuanChung) === homNay)) return ra();
  const lopIds = [lopId, ...dongs.map((d) => d.toClassId).filter((x): x is number => Number.isInteger(x) && x! > 0)];
  return chuyenNgayCoHoanTac(p, dongs.map((d) => d.studentId).filter(Number.isInteger), lopIds, ra, (x) => x.daChuyen.length > 0, { bang: 'classes', id: lopId });
}

/**
 * POST /students/:id/hoan-tac-chuyen-ngay { dao } (một em) · POST /classes/:id/hoan-tac-chuyen-ngay { dao } (chốt Cuối khoá cả lớp) — trả em về lớp cũ y như
 * trước lần chuyển ngay. Quyền: `class.edit` lớp nguồn (lớp ghi danh trước đó).
 */
export function hoanTacChuyenNgay(p: Principal, sid: number, daoId: unknown, bang: DoiTuong['bang'] = 'students'): { lopId: number | null } {
  const conn = db();
  const g = conn.prepare(`SELECT * FROM ghi_dao WHERE id = ? AND loai = ? AND bang = ? AND doi_tuong_id = ?`).get(Number(daoId), LOAI, bang, sid) as BanGhiDao | undefined;
  if (!g) throw notFound('Không còn bản ghi để hoàn tác.');
  /* Lớp nguồn = ghi danh bị đóng ("transferred") trong bản chụp — quyền kiểm theo lớp em học TRƯỚC lần chuyển. */
  const muc = JSON.parse(g.du_lieu) as { bang: string; truoc: any[] }[];
  const ghiDanh = (muc.find((m) => m.bang === 'enrollments')?.truoc ?? []).filter((e) => e.status === 'active');
  const lopNguon = ghiDanh[0]?.class_id as number | undefined;
  if (!lopNguon || !can(p, PERMISSIONS.CLASS_EDIT, { classId: lopNguon })) throw forbidden('Chỉ Quản lý lớp cũ của em hoàn tác được lần chuyển này.');
  return tx(() => {
    /* Dòng thêm (lộ trình mới, lượt MT…) xoá trước, dòng sửa (ghi danh cũ, lượt đổi lớp…) trả sau — khoá ngoại kiểm lúc chốt giao dịch. */
    conn.pragma('defer_foreign_keys = ON');
    daoLai(conn, g, p.userId);
    /* Lịch sử sửa của TỪNG em thấy lần Hoàn tác (cả lô Cuối khoá). */
    for (const em of new Set(ghiDanh.map((e) => e.student_id as number))) {
      writeAudit({ actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: em, after: { classId: lopNguon, _hoan: true, _nguon: 'Hoàn tác chuyển ngay' } });
    }
    return { lopId: lopNguon };
  });
}
