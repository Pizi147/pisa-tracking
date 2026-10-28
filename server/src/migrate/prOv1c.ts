/**
 * PR-OV1c: CASE SOS MT CŨ THEO LUẬT CHỐT (đặc tả OV 3.2) — ĐỔI DỮ LIỆU, chạy lặp được (lần hai không còn Case nào khớp). Chạy cùng lần deploy cuối OV.
 * Chỉ lượt Mock FT chưa huỷ có Case đang mở nối với tín hiệu của lượt:
 *
 *   A. Lượt CHƯA CHỐT (`AttemptResult.chot`): Case chính lượt đó mở (luật cũ: sinh từ điểm đầu tiên) mà CHƯA AI ĐỤNG (`CASE_CHUA_DUNG`) → hệ
 *      thống đóng "Chờ chốt SOS", tín hiệu của lượt thu hồi, Phối hợp còn chờ bỏ — lúc lượt chốt máy tạo lại theo luật mới (hạn từ ngày chốt).
 *      Case đã có người làm → giữ, không in.
 *   B. Lượt ĐÃ CHỐT mà Overall ≥ kỳ vọng (mức 0, còn kỹ năng dưới) → xoá SOS như lúc chạy (`xoaSosOverallDat`): chưa ai đụng → đóng "Overall đạt";
 *      đã có người làm → giữ + mốc "Overall đã đạt" (in khi mốc chưa có).
 *
 * OV-12c: giữ luật OV-1c nguyên bản (`CASE_CHUA_DUNG_OV1C`, đóng chứ không xoá) — chạy lại trên DB đã dọn không đổi gì.
 * In từng Case: em · mã · lớp · lượt · Case · việc. `kiemTruocOv1c` = CÙNG danh sách mà KHÔNG ghi gì (phép kiểm OV13a-10 dùng để soát ca dựng).
 */
import { CASE_CATEGORY_LABEL, SYSTEM_CLOSE_REASON_LABEL, type CaseCategory } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { nowIso } from '../util.ts';
import { entryBandsOf, resultOf, scoresOf } from '../fasttrack/attempts.ts';
import { failingEntrySkills } from '../fasttrack/scoring.ts';
import { scoringModeOf } from '../fasttrack/skillSchedule.ts';
import { CASE_CHUA_DUNG_OV1C, caseXoaSos, xoaSosOverallDat } from '../cases/sos.ts';
import { isFastTrackMock } from '../cases/sosAuto.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { syncSosCoordination } from '../yThuc/phoiHop.ts';

export type DongOv1c = {
  attemptId: number; caseId: number; hocVien: string; ma: string; lop: string; luot: string; case: string;
  viec: 'Đóng · Chờ chốt SOS' | 'Đóng · Overall đạt' | 'Giữ · ghi mốc Overall đã đạt';
};

type KeHoach = { a: any; loai: 'A' | 'B'; dong: number[]; giu: number[]; failing: string[]; result: any };

/** Đọc mọi lượt cần dọn — CHỈ `SELECT`. */
function lapKeHoach(conn: any): KeHoach[] {
  const luot = conn.prepare(
    `SELECT DISTINCT a.*, st.full_name, st.student_code, c.code AS lop FROM case_signals g
       JOIN sos_cases sc ON sc.id = g.case_id AND sc.status != 'done'
       JOIN assessment_attempts a ON a.id = g.attempt_id AND a.kind = 'mock' AND a.status != 'cancelled'
       JOIN students st ON st.id = a.student_id LEFT JOIN classes c ON c.id = a.class_id
      WHERE g.status = 'linked' ORDER BY a.id`,
  ).all() as any[];
  const ra: KeHoach[] = [];
  for (const a of luot) {
    if (!isFastTrackMock(a, scoringModeOf(a))) continue;
    const result = resultOf(a);
    if (!result.chot) {
      const dong = (conn.prepare(`SELECT sc.id FROM sos_cases sc WHERE sc.student_id = ? AND ${CASE_CHUA_DUNG_OV1C('sc', '?')} ORDER BY sc.id`)
        .all(a.student_id, a.id) as any[]).map((r) => r.id as number);
      if (dong.length) ra.push({ a, loai: 'A', dong, giu: [], failing: [], result });
      continue;
    }
    if (result.sosLevel !== 0) continue;
    const failing = failingEntrySkills(result.expectation, entryBandsOf(scoresOf(a.id)), result.boQua) as string[];
    if (!failing.length) continue;
    const { dong, giu } = caseXoaSos(a.id, failing, CASE_CHUA_DUNG_OV1C);
    const giuMoi = giu.filter((id) => !conn.prepare('SELECT 1 FROM case_milestones WHERE dedup_key = ?').get(`mt:${a.id}:${id}:overall_dat`));
    if (dong.length || giuMoi.length) ra.push({ a, loai: 'B', dong, giu: giuMoi, failing, result });
  }
  return ra;
}

function dongCua(conn: any, k: KeHoach): DongOv1c[] {
  const ten = (id: number) => {
    const c = conn.prepare('SELECT category, topic FROM sos_cases WHERE id = ?').get(id) as any;
    return CASE_CATEGORY_LABEL[(c?.category ?? c?.topic) as CaseCategory] ?? c?.category ?? '?';
  };
  const chung = { attemptId: k.a.id as number, hocVien: k.a.full_name, ma: k.a.student_code, lop: k.a.lop ?? '—', luot: `MT${k.a.attempt_no}` };
  return [
    ...k.dong.map((id) => ({ ...chung, caseId: id, case: ten(id), viec: k.loai === 'A' ? 'Đóng · Chờ chốt SOS' as const : 'Đóng · Overall đạt' as const })),
    ...k.giu.map((id) => ({ ...chung, caseId: id, case: ten(id), viec: 'Giữ · ghi mốc Overall đã đạt' as const })),
  ];
}

export function kiemTruocOv1c(conn: any): DongOv1c[] {
  return lapKeHoach(conn).flatMap((k) => dongCua(conn, k));
}

export function migratePrOv1c(conn: any, applied: string[], today: string = demoToday()): DongOv1c[] {
  const ra: DongOv1c[] = [];
  for (const k of lapKeHoach(conn)) {
    ra.push(...dongCua(conn, k));   // tên Case đọc TRƯỚC khi đóng
    if (k.loai === 'B') {
      xoaSosOverallDat(null, k.a, k.result, k.failing, true);
      syncSosCoordination(k.a, 0);
      continue;
    }
    closeCasesBySystem({ actorUserId: null, studentId: k.a.student_id, reason: 'cho_chot_sos', on: today, caseIds: k.dong });
    conn.prepare(
      `UPDATE case_signals SET status = 'withdrawn', withdrawn_reason = ?, updated_at = ?
        WHERE attempt_id = ? AND status = 'linked' AND case_id IN (${k.dong.map(() => '?').join(',')})`,
    ).run(SYSTEM_CLOSE_REASON_LABEL.cho_chot_sos, nowIso(), k.a.id, ...k.dong);
    /* Phối hợp điền sẵn chưa làm của lượt: bỏ như khi mức SOS đổi — lúc chốt `syncSosCoordination` hồi lại đúng dòng này. */
    conn.prepare(
      `UPDATE sos_coordination_actions SET status = 'removed', remove_reason_code = 'system_sos_changed', removed_by = NULL, removed_at = ?, updated_at = ?
        WHERE attempt_id = ? AND preset = 1 AND status = 'pending'`,
    ).run(nowIso(), nowIso(), k.a.id);
  }
  if (ra.length) {
    applied.push(`PR-OV1c: ${ra.length} Case SOS MT theo luật chốt:`);
    for (const d of ra) applied.push(`  ${d.hocVien} · ${d.ma} · ${d.lop} · ${d.luot} · ${d.case}: ${d.viec}`);
  }
  return ra;
}
