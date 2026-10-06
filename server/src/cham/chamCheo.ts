/**
 * CHUÔNG "SPEAKING QUÁ HẠN CHẤM" (PR-LT3 T18, D3). Speaking của Mock Test không có GV mặc định (ai dạy Speaking cùng chi nhánh cũng chấm
 * được), nên quá hạn KHÔNG tính nợ / trễ cho ai — chỉ BÁO cho GVBM Speaking + GVCN của lớp để nhờ người chấm.
 *
 * Ô cần báo: cùng tập Nợ điểm (`scoreDebtCells` — em đang học, lớp đang mở, chưa điểm, không "-") có cờ `chamCheo` và rơi vào khối 1
 * "Test quá hạn chấm" (`khoiCham` — cùng luật Lịch Test). Một chuông / lớp / MT / tuần thi / người (`dedupKey`); chạy lại không gửi trùng.
 * ponytail: chỉ chạy trong lượt quét thứ Hai (`chotVangDinhKy`) — ô vào khối 1 giữa tuần (hạn riêng) nhận chuông thứ Hai kế.
 */
import { db, theoLo } from '../db.ts';
import { CHAM_CHEO, khoiCham, tuanLich } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';
import { notify } from '../platform/audit.ts';
import { weekInfo } from '../platform/week.ts';
import { phanCongDangHieuLuc, scoreDebtCells } from '../worklist/scoreDebt.ts';

/** Người đọc của lượt quét — `scoreDebtCells` không dùng quyền người xem cho ô S Mock (cờ nợ không phụ thuộc người xem). */
const HE_THONG: Principal = { userId: 0, code: 'he-thong', fullName: 'Hệ thống', title: null, grants: [], roleKeys: [], assignments: [] };

export function baoChamCheoQuaHan(homNay: string): number {
  const cells = scoreDebtCells(HE_THONG, homNay, null).filter((c) => c.chamCheo && c.overdue);
  if (!cells.length) return 0;
  const conn = db();
  const tuanHomNay = weekInfo(homNay).weekStart;
  type Nhom = { classId: number; code: string; attemptNo: number; periodId: number; weekStart: string; soBai: number };
  const nhom = new Map<string, Nhom>();
  theoLo([...new Set(cells.map((c) => c.attemptId))], (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT a.id, a.class_id, a.attempt_no, c.code, k.planned_period_id, rp.week_start FROM assessment_attempts a
         JOIN classes c ON c.id = a.class_id
         JOIN attempt_skills k ON k.attempt_id = a.id AND k.skill = 'speaking'
         JOIN report_periods rp ON rp.id = k.planned_period_id
        WHERE a.id IN (${ph})`,
    ).all(...lo) as any[]) {
      if (khoiCham({ tuanThi: r.week_start, tuanHomNay, quaHan: true }) !== 'qua-han') continue;
      const key = `${r.class_id}:${r.attempt_no}:${r.planned_period_id}`;
      const n = nhom.get(key) ?? nhom.set(key, {
        classId: r.class_id, code: r.code, attemptNo: r.attempt_no, periodId: r.planned_period_id, weekStart: r.week_start, soBai: 0,
      }).get(key)!;
      n.soBai += 1;
    }
  });
  if (!nhom.size) return 0;

  const lopIds = [...new Set([...nhom.values()].map((n) => n.classId))];
  const gvS = phanCongDangHieuLuc(lopIds, homNay);
  const gvcn = new Map<number, Set<number>>();
  theoLo(lopIds, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT class_id, user_id FROM teacher_assignments WHERE class_id IN (${ph}) AND is_core = 1 AND status = 'active'
          AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`,
    ).all(...lo, homNay, homNay) as any[]) (gvcn.get(r.class_id) ?? gvcn.set(r.class_id, new Set()).get(r.class_id)!).add(r.user_id);
  });

  let ghi = 0;
  for (const n of nhom.values()) {
    const nguoi = new Set(gvcn.get(n.classId) ?? []);
    const s = gvS.get(`${n.classId}|speaking`);
    if (s) nguoi.add(s.userId);
    for (const userId of nguoi) {
      notify({
        userId, kind: 'cham_cheo_qua_han', title: `Speaking MT${n.attemptNo} quá hạn chấm`,
        body: `${n.code} · ${tuanLich(n.weekStart, homNay)} · ${n.soBai} bài · ${CHAM_CHEO}`,
        entityType: 'class', entityId: n.classId, dedupKey: `chamcheo:${n.classId}:${n.attemptNo}:${n.periodId}`,
        duong: `/test/lich?classId=${n.classId}&kn=speaking`,
      });
      ghi += 1;
    }
  }
  return ghi;
}
