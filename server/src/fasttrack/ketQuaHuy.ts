/**
 * KẾT QUẢ MT ĐÃ HUỶ DO DỜI VƯỢT (PR-MTa T2, đặc tả 05/10) — nơi sở hữu DUY NHẤT của bảng `ket_qua_huy`.
 *
 * Dời MT1 muộn hơn MT2 đã có điểm: điểm MT2 không bị xoá mà CHUYỂN NGUYÊN DÒNG sang `ket_qua_huy` (kèm lịch kỹ năng cũ). Mọi màn đọc
 * `assessment_scores` (SOS, báo cáo, Phân tích, Xuất Excel, Điểm theo lớp) vì thế tự không tính MT2 mà không phải sửa; nhật ký giữ
 * từng ô (`score.huy_vuot`). Quản lý khôi phục = chép ngược, chặn khi ô đã có điểm mới hoặc khi lượt vượt vẫn đứng sau tuần cũ (Q2).
 *
 * PR-MTGON (luật 1, 08/10): dời vượt nay bị CHẶN — không còn sinh `ket_qua_huy` mới. Bảng chỉ còn giữ dữ liệu cũ để Khôi phục;
 * xếp lại một lượt đã huỷ (`hoiSinhLuot`) bỏ bản chưa khôi phục.
 */
import { db, theoLo, tx } from '../db.ts';
import { PERMISSIONS, nhanDot, tenMon, type KetQuaHuy } from '../../../shared/domain/index.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { assessedSkillOf } from './scoring.ts';
import { caseSinhRieng, refreshOutcome } from './attempts.ts';
import { checkSkillWeekMove, ensureSkillRows, logSchedule, recomputeCompletionWeek, tinhLaiMtCu } from './skillSchedule.ts';

const CO_DIEM = (s: any) => (s.band ?? null) !== null || (s.raw_score ?? null) !== null;

/**
 * Quản lý KHÔI PHỤC kết quả đã huỷ của một lượt (T2, Q2 = chặn). Lý do tuỳ chọn (T7). Chặn khi: không có kết quả đã huỷ · lượt đã huỷ ·
 * ô nào nay đã có điểm mới (không bao giờ ghi đè) · kỹ năng đã huỷ phần thi · tuần cũ vướng thứ tự đợt (lượt vượt vẫn đứng sau).
 * Ô nay chỉ có dấu "-" mới: KHÔNG đè — bỏ qua ô đó (và lịch của kỹ năng đó), nêu trong `cau` (rà #212). Kiểm và ghi trong MỘT tx.
 * Case đã đóng không mở lại; còn trượt thì SOS mới tự sinh qua `refreshOutcome`.
 */
export function khoiPhucKetQua(p: Principal, attemptId: number, o: { lyDo?: string | null } = {}): {
  ok: true; soDiem: number; boQua: string[]; cau: string | null;
} {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt kiểm tra');
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id, studentId: a.student_id }, 'Chỉ Quản lý mới khôi phục được kết quả MT.');
  const nhan = nhanDot(a.kind, a.attempt_no);
  const lyDo = o.lyDo?.trim() || null;
  return tx(() => {
    const kq = conn.prepare('SELECT * FROM ket_qua_huy WHERE attempt_id = ? AND khoi_phuc_luc IS NULL ORDER BY id DESC LIMIT 1').get(attemptId) as any;
    if (!kq) throw badRequest(`${nhan} không có kết quả đã huỷ.`);
    if (a.status === 'cancelled') throw badRequest(`${nhan} đã huỷ — mở lại lượt trước.`);
    const diemHuy = JSON.parse(kq.diem_json) as any[];
    const lichHuy = JSON.parse(kq.lich_json) as Array<{ skill: string; planned_period_id: number | null; sit_status: string; plan_source: string }>;
    const hienTai = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ?').all(attemptId) as any[];
    if (diemHuy.some((d) => hienTai.some((h) => h.skill === d.skill && CO_DIEM(h)))) throw badRequest(`${nhan} đã có điểm mới — không khôi phục được.`);
    const boQua = diemHuy.filter((d) => hienTai.some((h) => h.skill === d.skill && h.no_show_period_id != null)).map((d) => d.skill as string);
    const kyNangBoQua = new Set(boQua.map((k) => assessedSkillOf(k) as string));
    const diem = diemHuy.filter((d) => !kyNangBoQua.has(assessedSkillOf(d.skill)));
    const lich = lichHuy.filter((l) => !kyNangBoQua.has(l.skill));
    const rows = ensureSkillRows(attemptId);
    for (const l of lich) {
      const r = rows.find((x) => x.skill === l.skill);
      if (r?.sit_status === 'cancelled') throw badRequest(`${tenMon(null, l.skill)} của ${nhan} đã huỷ phần thi — không khôi phục được.`);
      if (!l.planned_period_id) continue;
      const pr = conn.prepare('SELECT week_start FROM report_periods WHERE id = ?').get(l.planned_period_id) as any;
      const c = checkSkillWeekMove({ attemptId, skill: l.skill, newWeekStart: pr.week_start });
      if (c.blockers.length) throw badRequest(`${c.blockers[0]} Dời lượt trước về trước rồi khôi phục.`);
    }
    const now = nowIso();
    for (const l of lich) {
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = ?, plan_source = 'manual', updated_at = ? WHERE attempt_id = ? AND skill = ?`)
        .run(l.planned_period_id, l.sit_status, now, attemptId, l.skill);
      logSchedule(attemptId, { action: 'skill_week_restored', field: l.skill, newValue: l.planned_period_id, reason: lyDo ?? 'Khôi phục kết quả', actor: p.userId });
    }
    for (const d of diem) {
      const cot = Object.keys(d).filter((k) => k !== 'id' && k !== 'attempt_id' && k !== 'skill');
      const co = hienTai.find((h) => h.skill === d.skill);
      if (co) conn.prepare(`UPDATE assessment_scores SET ${cot.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...cot.map((k) => d[k]), co.id);
      else conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, ${cot.join(', ')}) VALUES (?, ?, ${cot.map(() => '?').join(', ')})`)
        .run(attemptId, d.skill, ...cot.map((k) => d[k]));
      writeAudit({
        actorUserId: p.userId, action: 'score.khoi_phuc', entityType: 'assessment_attempt', entityId: attemptId, entityLabel: d.skill,
        before: null, after: { ...d, lyDo },
      });
    }
    conn.prepare('UPDATE ket_qua_huy SET khoi_phuc_boi = ?, khoi_phuc_luc = ?, ly_do_khoi_phuc = ? WHERE id = ?').run(p.userId, now, lyDo, kq.id);
    recomputeCompletionWeek(attemptId, p.userId);
    tinhLaiMtCu(attemptId, demoToday());
    refreshOutcome(p, attemptId);
    const soDiem = new Set(diem.filter(CO_DIEM).map((d) => assessedSkillOf(d.skill))).size;
    const cau = boQua.length ? `Giữ "-" ở ${[...kyNangBoQua].map((k) => tenMon(null, k)).join(', ')} — không khôi phục ô đó.` : null;
    return { ok: true as const, soDiem, boQua, cau };
  });
}

/** Kết quả đã huỷ CHƯA khôi phục, mới nhất mỗi lượt — một câu theo lô cho mọi lượt (không N+1). */
export function ketQuaHuyCua(attemptIds: readonly number[]): Map<number, KetQuaHuy> {
  const out = new Map<number, KetQuaHuy>();
  theoLo([...new Set(attemptIds)], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT k.id, k.attempt_id, k.huy_luc, k.ly_do, k.so_diem, u.full_name AS nguoi, v.kind AS v_kind, v.attempt_no AS v_no
         FROM ket_qua_huy k LEFT JOIN users u ON u.id = k.huy_boi LEFT JOIN assessment_attempts v ON v.id = k.vuot_boi_attempt_id
        WHERE k.attempt_id IN (${ph}) AND k.khoi_phuc_luc IS NULL ORDER BY k.id`).all(...lo) as any[]) {
      out.set(r.attempt_id, {
        id: r.id, attemptId: r.attempt_id, luc: r.huy_luc, lyDo: r.ly_do, nguoi: r.nguoi ?? null, soDiem: r.so_diem,
        vuotBoi: r.v_kind ? nhanDot(r.v_kind, r.v_no) : null,
      });
    }
  });
  return out;
}
