/**
 * KẾT QUẢ MT ĐÃ CẤT — nơi sở hữu DUY NHẤT của bảng `ket_qua_huy`. Hai loại bản cất (`loai`):
 *  · 'doi_vuot' (PR-MTa T2, đặc tả 05/10): dời MT1 muộn hơn MT2 đã có điểm → điểm MT2 CHUYỂN NGUYÊN DÒNG sang đây (kèm lịch kỹ năng cũ).
 *    PR-MTGON (luật 1, 08/10): dời vượt nay bị CHẶN — không sinh bản mới; bản cũ còn treo Khôi phục bằng "Khôi phục kết quả" (lượt chưa huỷ)
 *    hoặc cùng "Khôi phục lượt" (lượt đã huỷ — ca MT4 Nguyễn Minh Ngọc, PR-OV4a).
 *  · 'huy_luot' (PR-OV4a, đặc tả OV 3.4): Huỷ cả lượt MT → MỌI dòng điểm + nguyên dòng lịch kỹ năng + dòng lượt + danh sách đã đóng cất ở đây.
 * Mọi màn đọc `assessment_scores` (SOS, báo cáo, Phân tích, Xuất Excel, Điểm theo lớp) vì thế tự không tính điểm đã cất mà không phải sửa;
 * xếp lại lượt (`hoiSinhLuot`) KHÔNG bỏ bản cất.
 */
import { db, theoLo, tx } from '../db.ts';
import { PERMISSIONS, nhanDot, tenMon, type KetQuaHuy } from '../../../shared/domain/index.ts';
import type { ChupCaseDong } from '../cases/systemClose.ts';
import { badRequest, forbidden, notFound, nowIso } from '../util.ts';
import { require_, scoreEditPath, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { assessedSkillOf, entrySkillsOf } from './scoring.ts';
import { refreshOutcome, saveScore } from './attempts.ts';
import { checkSkillWeekMove, ensureSkillRows, logSchedule, recomputeCompletionWeek, scoringModeOf, tinhLaiMtCu } from './skillSchedule.ts';
import { saveRegularScore } from '../normal/regular.ts';
import { nho } from '../platform/nguCanhRequest.ts';

/*
 * LUAT-34 (Luật 3 — T20, T20b, T18): loại bản cất thứ ba 'huy_diem' — MỘT Ô vừa mất hết điểm (Huỷ điểm, xoá tay, Bỏ khỏi đợt; Thi lại thì không):
 * `diem_json` = [nguyên dòng điểm trước khi huỷ]. Chỉ bản MỚI NHẤT của ô còn mở; ô nhập điểm mới / Thi lại thì đóng (`ly_do_khoi_phuc` ghi vì sao).
 * ponytail: đóng / tìm bản theo ô bằng đọc `diem_json` các bản mở của lượt (ít dòng); nhiều thì thêm cột `skill` + chỉ mục khi có migrate.
 */
const banMoCuaO = (conn: any, attemptId: number, skills: readonly string[]) =>
  (conn.prepare(`SELECT * FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'huy_diem' AND khoi_phuc_luc IS NULL ORDER BY id DESC`).all(attemptId) as any[])
    .map((k) => ({ k, d: (JSON.parse(k.diem_json) as any[])[0] }))
    .filter((x) => skills.includes(x.d?.skill));

/** Ô (có điểm) vừa mất hết điểm → cất nguyên dòng; bản cũ của ô đóng. Gọi trong tx của `saveScore` / `saveRegularScore`, TRƯỚC câu ghi. */
export function catDiemO(conn: any, o: { attemptId: number; row: any; actor: number | null; lyDo: string | null }) {
  dongBanCat(conn, o.attemptId, o.row.skill, 'Có lần huỷ điểm mới');
  conn.prepare(`INSERT INTO ket_qua_huy (attempt_id, diem_json, lich_json, so_diem, ly_do, huy_boi, huy_luc, loai) VALUES (?, ?, '[]', 1, ?, ?, ?, 'huy_diem')`)
    .run(o.attemptId, JSON.stringify([o.row]), o.lyDo || 'Huỷ điểm', o.actor, nowIso());
}

/** Bản cất mở của ô hết hiệu lực (ô vừa có điểm mới / Thi lại). */
export function dongBanCat(conn: any, attemptId: number, skill: string, lyDo: string) {
  for (const { k } of banMoCuaO(conn, attemptId, [skill])) {
    conn.prepare('UPDATE ket_qua_huy SET khoi_phuc_luc = ?, ly_do_khoi_phuc = ? WHERE id = ?').run(nowIso(), lyDo, k.id);
  }
}

/** Ô còn bản cất mở (`${attemptId}:${ô}`) — một câu cho cả request (bảng điểm vẽ nhiều ô). */
export function diemHuyMo(): Set<string> {
  return nho('diem-huy-mo', () => new Set((db().prepare(`SELECT attempt_id, diem_json FROM ket_qua_huy WHERE loai = 'huy_diem' AND khoi_phuc_luc IS NULL`)
    .all() as any[]).map((k) => `${k.attempt_id}:${(JSON.parse(k.diem_json) as any[])[0]?.skill}`)));
}

/**
 * KHÔI PHỤC ĐIỂM (T20b) — một bấm, người sửa được ô (quyền / tuần thi / lớp kết thúc / nhật ký / Case tính lại đều qua đúng `saveScore` hoặc
 * `saveRegularScore`). Mock: mọi ô của kỹ năng (W1 + W2) có bản mở. Ô đã có điểm mới → 400 (không bao giờ đè). Nhật ký `score.khoi_phuc`.
 */
export function khoiPhucDiem(p: Principal, attemptId: number, skill: string, today: string = demoToday()): { ok: true; o: string[] } {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt kiểm tra');
  const thuong = scoringModeOf(a) === 'ratio';
  /* Quyền trước (rà #503 c): người không sửa được ô không được biết ô có điểm huỷ hay không. Lưu bên dưới vẫn kiểm đủ (lớp kết thúc, tuần thi…). */
  if (!a.class_id || !scoreEditPath(p, a.class_id, skill, { lich_su: a.lich_su ?? 0 })) throw forbidden('Bạn không sửa được ô điểm này.');
  const ban = banMoCuaO(conn, attemptId, thuong ? [skill] : entrySkillsOf(assessedSkillOf(skill)));
  if (!ban.length) throw badRequest(`${tenMon(null, skill)} không có điểm đã huỷ để khôi phục.`);
  const lyDo = 'Khôi phục điểm';
  return tx(() => {
    for (const { k, d } of ban) {
      const hien = conn.prepare('SELECT band, raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(attemptId, d.skill) as any;
      if (hien && (hien.band != null || hien.raw_score != null)) throw badRequest(`${tenMon(null, d.skill)} đã có điểm mới — không khôi phục điểm cũ.`);
      if (thuong) saveRegularScore(p, attemptId, d.skill, { score: d.raw_score, total: d.raw_total, lyDo }, today);
      else {
        const tieuChi = [d.c1, d.c2, d.c3, d.c4];
        saveScore(p, attemptId, d.skill, tieuChi.some((v) => v != null) ? { criteria: tieuChi, lyDo }
          : d.raw_score != null ? { rawScore: d.raw_score, rawTotal: d.raw_total, lyDo } : { band: d.band, lyDo }, today);
      }
      /* Rà #503 (2): khôi phục không phải lần nhập mới — trả người nhập, lúc nhập, ngày nhập đầu như bản cất (không tính chấm trễ, không dời mốc Đủ điểm). */
      conn.prepare('UPDATE assessment_scores SET entered_by = ?, entered_at = ?, nhap_dau_ngay = ? WHERE attempt_id = ? AND skill = ?')
        .run(d.entered_by ?? null, d.entered_at ?? null, d.nhap_dau_ngay ?? null, attemptId, d.skill);
      conn.prepare('UPDATE ket_qua_huy SET khoi_phuc_luc = ?, khoi_phuc_boi = ?, ly_do_khoi_phuc = ? WHERE id = ?').run(nowIso(), p.userId, lyDo, k.id);
      writeAudit({
        actorUserId: p.userId, action: 'score.khoi_phuc', entityType: 'assessment_attempt', entityId: attemptId, entityLabel: d.skill,
        before: null, after: { ...d, lyDo },
      });
    }
    return { ok: true as const, o: ban.map((x) => x.d.skill as string) };
  });
}

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
  require_(p, PERMISSIONS.ATTEMPT_CANCEL, { classId: a.class_id, studentId: a.student_id }, 'Chỉ Quản lý mới khôi phục được kết quả MT.');
  const nhan = nhanDot(a.kind, a.attempt_no);
  const lyDo = o.lyDo?.trim() || null;
  return tx(() => {
    const kq = conn.prepare(`SELECT * FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'doi_vuot' AND khoi_phuc_luc IS NULL ORDER BY id DESC LIMIT 1`).get(attemptId) as any;
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
      if (r?.sit_status === 'cancelled') throw badRequest(`${tenMon(null, l.skill)} của ${nhan} đã huỷ — không khôi phục được.`);
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
    ghiDiemCat(p, attemptId, diem, hienTai, lyDo);
    conn.prepare('UPDATE ket_qua_huy SET khoi_phuc_boi = ?, khoi_phuc_luc = ?, ly_do_khoi_phuc = ? WHERE id = ?').run(p.userId, now, lyDo, kq.id);
    recomputeCompletionWeek(attemptId, p.userId);
    tinhLaiMtCu(attemptId, demoToday());
    refreshOutcome(p, attemptId);
    const soDiem = new Set(diem.filter(CO_DIEM).map((d) => assessedSkillOf(d.skill))).size;
    const cau = boQua.length ? `Giữ "-" ở ${[...kyNangBoQua].map((k) => tenMon(null, k)).join(', ')} — không khôi phục ô đó.` : null;
    return { ok: true as const, soDiem, boQua, cau };
  });
}

/** Kết quả đã huỷ do DỜI VƯỢT (`doi_vuot`) CHƯA khôi phục, mới nhất mỗi lượt — một câu theo lô cho mọi lượt (không N+1). */
export function ketQuaHuyCua(attemptIds: readonly number[]): Map<number, KetQuaHuy> {
  const out = new Map<number, KetQuaHuy>();
  theoLo([...new Set(attemptIds)], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT k.id, k.attempt_id, k.huy_luc, k.ly_do, k.so_diem, u.full_name AS nguoi, v.kind AS v_kind, v.attempt_no AS v_no
         FROM ket_qua_huy k LEFT JOIN users u ON u.id = k.huy_boi LEFT JOIN assessment_attempts v ON v.id = k.vuot_boi_attempt_id
        WHERE k.attempt_id IN (${ph}) AND k.loai = 'doi_vuot' AND k.khoi_phuc_luc IS NULL ORDER BY k.id`).all(...lo) as any[]) {
      out.set(r.attempt_id, {
        id: r.id, attemptId: r.attempt_id, luc: r.huy_luc, lyDo: r.ly_do, nguoi: r.nguoi ?? null, soDiem: r.so_diem,
        vuotBoi: r.v_kind ? nhanDot(r.v_kind, r.v_no) : null,
      });
    }
  });
  return out;
}

/** Ghi lại điểm đã cất vào ô (cập nhật dòng cùng kỹ năng nếu còn, không thì chèn) — nhật ký `score.khoi_phuc` từng ô. Gọi trong tx. */
function ghiDiemCat(p: Principal, attemptId: number, diem: any[], hienTai: any[], lyDo: string | null) {
  const conn = db();
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
}

// ---------------------------------------------------------------- PR-OV4a: Huỷ cả lượt giữ điểm ẩn + Khôi phục lượt

/** Những gì MỘT lần Huỷ cả lượt đã đóng + dòng lượt trước huỷ — đủ để Khôi phục đưa về đúng như cũ. */
export type DongHuyLuot = {
  luot: Record<string, unknown>; case: ChupCaseDong[]; pa: { id: number; status: string }[]; phoiHop: number[]; tinHieu: number[];
  /**
   * OV-11e (PT-4): yêu cầu duyệt đang chờ của Case / PA vừa đóng — trong lúc lượt huỷ, mọi đường đọc (`quetYeuCau`) đóng chúng thành `tu_dong`
   * ("Case đã đóng"); Khôi phục trả về "cho". Bản cất cũ (trước OV-11e) không có trường này.
   */
  yeuCau?: number[];
};

/** Id yêu cầu duyệt còn chờ gắn với các Case / PA (`sos_case` / `intervention`) — cất cùng bản huỷ lượt. Gọi trong tx của `huyLuot`. */
export function yeuCauChoCua(caseIds: number[], paIds: number[]): number[] {
  if (!caseIds.length && !paIds.length) return [];
  const ph = (n: number) => (n ? Array(n).fill('?').join(',') : 'NULL');
  return (db().prepare(
    `SELECT id FROM yeu_cau_duyet WHERE trang_thai = 'cho'
        AND ((doi_tuong_loai = 'sos_case' AND doi_tuong_id IN (${ph(caseIds.length)})) OR (doi_tuong_loai = 'intervention' AND doi_tuong_id IN (${ph(paIds.length)})))
      ORDER BY id`,
  ).all(...caseIds, ...paIds) as any[]).map((r) => r.id as number);
}

/**
 * OV-11e (PT-4): Khôi phục lượt trả các yêu cầu đã cất về "cho" — chỉ thẻ hệ thống tự đóng (`tu_dong`) mà Case / PA của nó đã mở lại; thẻ người
 * đã duyệt / từ chối giữ nguyên. Gọi trong tx của `reopenAttempt`, SAU khi mở lại Case / PA. Trả số thẻ trả về.
 */
export function traYeuCauCat(ids: readonly number[]): number {
  const conn = db();
  let n = 0;
  for (const id of ids) {
    /* Đã có thẻ "cho" khác cùng loại + đối tượng (`ux_ycd_dang_cho`) thì bỏ qua — không lỗi giữa Khôi phục. */
    const doi = conn.prepare(
      `UPDATE yeu_cau_duyet SET trang_thai = 'cho', nguoi_duyet = NULL, ly_do_dong = NULL, tu_duyet = 0, xu_ly_luc = NULL
        WHERE id = ? AND trang_thai = 'tu_dong'
          AND ((doi_tuong_loai = 'sos_case' AND EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.id = doi_tuong_id AND sc.status != 'done'))
            OR (doi_tuong_loai = 'intervention' AND EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.id = doi_tuong_id AND iv.status IN ('planned', 'started'))))
          AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y2 WHERE y2.trang_thai = 'cho' AND y2.loai = yeu_cau_duyet.loai
            AND y2.doi_tuong_loai = yeu_cau_duyet.doi_tuong_loai AND y2.doi_tuong_id = yeu_cau_duyet.doi_tuong_id)`,
    ).run(id).changes as number;
    /* Chuông "Tự đóng" của thẻ vừa trả về không còn đúng — bỏ (thẻ lại chờ như trước khi huỷ lượt). */
    if (doi) conn.prepare('DELETE FROM notifications WHERE dedup_key = ?').run(`duyet_ket_qua:${id}`);
    n += doi;
  }
  return n;
}

/**
 * CẤT lượt sắp huỷ: MỌI dòng điểm (kể cả dấu "-") chuyển sang bản cất `huy_luot` cùng nguyên dòng lịch kỹ năng và `dong`. Dòng điểm XOÁ khỏi
 * `assessment_scores` (số MT dùng lại được — `soMtKeTiep`). Không nhật ký từng ô: ô không đổi giá trị, chỉ ẩn; nhật ký `attempt.cancel` ghi số ô.
 * Gọi trong tx của `huyLuot`.
 */
export function catHuyLuot(p: Principal, attemptId: number, lyDo: string, dong: DongHuyLuot): number {
  const conn = db();
  const diem = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? ORDER BY id').all(attemptId) as any[];
  const lich = conn.prepare('SELECT * FROM attempt_skills WHERE attempt_id = ? ORDER BY id').all(attemptId) as any[];
  const soDiem = diem.filter(CO_DIEM).length;
  conn.prepare(`INSERT INTO ket_qua_huy (attempt_id, vuot_boi_attempt_id, diem_json, lich_json, so_diem, ly_do, huy_boi, huy_luc, loai, dong_json)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'huy_luot', ?)`)
    .run(attemptId, JSON.stringify(diem), JSON.stringify(lich), soDiem, lyDo, p.userId, nowIso(), JSON.stringify(dong));
  if (diem.length) conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(attemptId);
  return soDiem;
}

/** Một bản Huỷ cả lượt còn khôi phục được (hộp Khôi phục: "huỷ {ngày} bởi {người} · n điểm"). */
export type BanHuyLuot = {
  id: number; luc: string; nguoi: string | null; lyDo: string; soDiem: number; tuan: string | null; soCase: number; soPa: number; soPhoiHop: number;
};

/** Bản Huỷ cả lượt CHƯA khôi phục của một lượt, mới nhất trước. */
export function banHuyLuotCua(attemptId: number): BanHuyLuot[] {
  return (db().prepare(
    `SELECT k.*, u.full_name AS nguoi FROM ket_qua_huy k LEFT JOIN users u ON u.id = k.huy_boi
      WHERE k.attempt_id = ? AND k.loai = 'huy_luot' AND k.khoi_phuc_luc IS NULL ORDER BY k.id DESC`).all(attemptId) as any[]).map((k) => {
    const dong = JSON.parse(k.dong_json ?? '{}') as Partial<DongHuyLuot>;
    const pid = (dong.luot?.planned_period_id ?? null) as number | null;
    const tuan = pid ? (db().prepare('SELECT week_start FROM report_periods WHERE id = ?').get(pid) as any)?.week_start ?? null : null;
    return {
      id: k.id, luc: k.huy_luc, nguoi: k.nguoi ?? null, lyDo: k.ly_do, soDiem: k.so_diem, tuan,
      soCase: dong.case?.length ?? 0, soPa: (dong.pa?.length ?? 0) + (dong.case ?? []).reduce((n, c) => n + c.pa.length, 0), soPhoiHop: dong.phoiHop?.length ?? 0,
    };
  });
}

/**
 * ĐƯA BẢN CẤT `huy_luot` VỀ: dòng lượt (trạng thái, lớp, tuần, Target, MT cũ, hạn riêng, lúc tạo), NGUYÊN dòng lịch kỹ năng, mọi dòng điểm; đánh dấu
 * bản đã khôi phục. Ô điểm hiện có điểm (không thể ở lượt huỷ theo luồng mới) → 400, không đè. Case / PA / Phối hợp do `reopenAttempt` mở lại.
 * Gọi trong tx của `reopenAttempt`.
 */
export function traBanHuyLuot(p: Principal, attemptId: number, banId: number, lyDo: string): { dong: DongHuyLuot; soDiem: number } {
  const conn = db();
  const k = conn.prepare(`SELECT * FROM ket_qua_huy WHERE id = ? AND attempt_id = ? AND loai = 'huy_luot' AND khoi_phuc_luc IS NULL`).get(banId, attemptId) as any;
  if (!k) throw badRequest('Bản huỷ này đã khôi phục hoặc không còn.');
  const hienTai = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ?').all(attemptId) as any[];
  if (hienTai.some(CO_DIEM)) throw badRequest('Lượt này đang có điểm — không khôi phục đè lên được.');
  const dong = JSON.parse(k.dong_json) as DongHuyLuot;
  const L = dong.luot as any;
  const now = nowIso();
  conn.prepare(
    `UPDATE assessment_attempts SET status = ?, cancel_reason = NULL, cancelled_at = NULL, class_id = ?, planned_period_id = ?, plan_source = ?,
            target_at_attempt = ?, note = ?, lich_su = ?, created_at = ?, deadline_override = ?, deadline_override_by = ?, deadline_override_at = ?,
            deadline_override_reason = ?, updated_at = ? WHERE id = ?`,
  ).run(L.status, L.class_id, L.planned_period_id, L.plan_source, L.target_at_attempt, L.note, L.lich_su, L.created_at, L.deadline_override,
    L.deadline_override_by, L.deadline_override_at, L.deadline_override_reason, now, attemptId);
  conn.prepare('DELETE FROM attempt_skills WHERE attempt_id = ?').run(attemptId);
  chenLai('attempt_skills', JSON.parse(k.lich_json));
  if (hienTai.length) conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(attemptId);   // chỉ dấu "-" của lần xếp lại (đã kiểm không điểm)
  const diem = JSON.parse(k.diem_json) as any[];
  chenLai('assessment_scores', diem);
  for (const d of diem.filter(CO_DIEM)) {
    writeAudit({ actorUserId: p.userId, action: 'score.khoi_phuc', entityType: 'assessment_attempt', entityId: attemptId, entityLabel: d.skill, before: null, after: { ...d, lyDo } });
  }
  conn.prepare('UPDATE ket_qua_huy SET khoi_phuc_boi = ?, khoi_phuc_luc = ?, ly_do_khoi_phuc = ? WHERE id = ?').run(p.userId, now, lyDo, k.id);
  return { dong, soDiem: k.so_diem };
}

/**
 * Bản cất `doi_vuot` còn treo của lượt (ca MT4 Nguyễn Minh Ngọc) đi cùng Khôi phục lượt: điểm vào ô CÒN TRỐNG (không đè điểm / dấu "-"), lịch kỹ năng
 * của ô đó về tuần cũ (trừ kỹ năng đã huỷ phần thi) — KHÔNG chặn theo thứ tự đợt: `reopenAttempt` kiểm sau và đưa về Chưa xếp nếu vướng. Trả số ô.
 */
export function traBanDoiVuot(p: Principal, attemptId: number, lyDo: string): number {
  const conn = db();
  let n = 0;
  for (const k of conn.prepare(`SELECT * FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'doi_vuot' AND khoi_phuc_luc IS NULL ORDER BY id`).all(attemptId) as any[]) {
    const hienTai = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ?').all(attemptId) as any[];
    const vuong = new Set(hienTai.filter((h) => CO_DIEM(h) || h.no_show_period_id != null).map((h) => assessedSkillOf(h.skill) as string));
    const diem = (JSON.parse(k.diem_json) as any[]).filter((d) => !vuong.has(assessedSkillOf(d.skill)));
    const rows = ensureSkillRows(attemptId);
    for (const l of JSON.parse(k.lich_json) as Array<{ skill: string; planned_period_id: number | null; sit_status: string }>) {
      if (vuong.has(l.skill) || rows.find((r) => r.skill === l.skill)?.sit_status === 'cancelled') continue;
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = ?, plan_source = 'manual', updated_at = ? WHERE attempt_id = ? AND skill = ?`)
        .run(l.planned_period_id, l.sit_status, nowIso(), attemptId, l.skill);
      logSchedule(attemptId, { action: 'skill_week_restored', field: l.skill, newValue: l.planned_period_id, reason: lyDo, actor: p.userId });
    }
    ghiDiemCat(p, attemptId, diem, hienTai, lyDo);
    n += diem.filter(CO_DIEM).length;
    conn.prepare('UPDATE ket_qua_huy SET khoi_phuc_boi = ?, khoi_phuc_luc = ?, ly_do_khoi_phuc = ? WHERE id = ?').run(p.userId, nowIso(), lyDo, k.id);
  }
  return n;
}

/** Chép lại NGUYÊN dòng đã cất (trừ `id`): cột của lúc cất; cột thêm sau này lấy mặc định. Vài dòng mỗi lượt (≤ 5 ô, 4 kỹ năng). */
function chenLai(bang: 'assessment_scores' | 'attempt_skills', rows: any[]) {
  for (const d of rows) {
    const cot = Object.keys(d).filter((k) => k !== 'id');
    db().prepare(`INSERT INTO ${bang} (${cot.join(', ')}) VALUES (${cot.map(() => '?').join(', ')})`).run(...cot.map((k) => d[k]));
  }
}
