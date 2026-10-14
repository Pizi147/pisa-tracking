/**
 * PHÉP KIỂM PR-OV12h — luật nhỏ trước khi GV nước ngoài dùng (chủ SP 14/10):
 *   (1) BỎ Nhắc: route Nhắc → 404, `/my-work` không còn `nhac` trên dòng, web không còn gọi đường Nhắc;
 *   (2) Kết quả PA từng em: ghi kết quả một em không đổi PA em khác (kể cả mang cùng mã nhóm bổ trợ);
 *   (3) PA Tutor: "Số buổi kỳ này" n → bắt buộc n dòng [Tên tutor · Nhận xét buổi]; thiếu → 400; đủ → lưu đúng n dòng, hiện ở lịch sử;
 *   (4) Meeting CX / GĐCN (Phối hợp SOS): hạn 5 ngày từ lúc tạo — quá hạn ở `/my-work`, dòng Cần xử lý của QL; xác nhận cần ghi chú ≥ 10 ký tự.
 * Mỗi ca cuộn lại (`thu`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../db.ts';

export async function runPrOv12hTests(t: any) {
  const { check, checkAsync, assert, conn, P, TODAY, addDays, classId } = t;
  const cases: any = await import('../cases/cases.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  console.log('\nPR-OV12h · bỏ Nhắc · kết quả PA từng em · Tutor theo buổi · meeting CX hạn 5 ngày');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const GV = P.lrTeacher;
  const LOP = classId('MB FT 101');
  let seq = 0;
  const em = (): number => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at)
      VALUES (?,?,?, (SELECT branch_id FROM classes WHERE id = ?), 'active', ?)`).run(`PISA-OV12H-${seq}`, `Hoc vien OV12h ${seq}`, `hoc vien ov12h ${seq}`, LOP, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  const caseVaPa = (sid: number, pa: Record<string, unknown>) => {
    const caseId = cases.reportIssue(GV, {
      studentId: sid, topic: 'listening', title: 'Nghe sót số liệu', summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `ov12h-case-${sid}`,
    }).id as number;
    const r = cases.recordIntervention(GV, caseId, { status: 'started', startedDate: addDays(TODAY, -7), ...pa });
    return { caseId, ivId: Math.max(...r.interventions.map((i: any) => i.id)) as number };
  };

  // ------------------------------------------------------------------ (1) bỏ Nhắc
  const httpApp = createApp().listen(0);
  const port = (httpApp.address() as any).port as number;
  try {
    await checkAsync('OV12h-1a · route Nhắc (my-work/nhac, my-work/nhac-nhieu, yeu-cau/nhac-nhieu, lenh-chuyen/:id/nhac) → 404 với QL', async () => {
      for (const url of ['/my-work/nhac', '/my-work/nhac-nhieu', '/yeu-cau/nhac-nhieu', '/lenh-chuyen/1/nhac']) {
        const res = await fetch(`http://127.0.0.1:${port}/api${url}`, {
          method: 'POST', headers: { 'content-type': 'application/json', cookie: `pisa_demo_session=${createSession(P.mbManager.userId)}` },
          body: JSON.stringify({ key: 'score:1', ownerId: GV.userId, ids: [1], viec: [], mon: 'reading' }),
        });
        assert(res.status === 404, `${url}: ${res.status}`);
      }
    });
  } finally { httpApp.close(); }

  check('OV12h-1b · /my-work (QL · Của GV): không dòng nào mang `nhac`', () => {
    const w = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' });
    assert(w.items.length > 0, 'QL phải thấy việc của GV');
    assert(!w.items.some((it: any) => 'nhac' in it), 'còn trường nhac');
  });

  check('OV12h-1c · web: không còn gọi đường Nhắc, không còn nút "Nhắc tất cả"', () => {
    const tep: string[] = [];
    const duyet = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) duyet(p); else if (/\.tsx?$/.test(f)) tep.push(p); } };
    duyet(join(ROOT, 'web', 'src'));
    const sai = tep.filter((p) => /\/nhac['`"]|nhac-nhieu|Nhắc tất cả|Xem và nhắc/.test(readFileSync(p, 'utf8')));
    assert(!sai.length, `còn Nhắc ở: ${sai.map((p) => p.slice(ROOT.length)).join(', ')}`);
    assert(!d.CAN_XU_LY.some((x: any) => /nhắc/i.test(x.nut)), 'Tổng quan còn nút "Xem và nhắc"');
  });

  // ------------------------------------------------------------------ (2) kết quả PA từng em
  check('OV12h-2 · ghi kết quả PA em A không đổi PA em B (cùng mã nhóm bổ trợ, cùng lịch)', () => thu(() => {
    const a = caseVaPa(em(), { kind: 'self_study', description: 'Tự học nghe chép 15 phút mỗi ngày' });
    const b = caseVaPa(em(), { kind: 'self_study', description: 'Tự học nghe chép 15 phút mỗi ngày' });
    conn.prepare(`UPDATE case_interventions SET kind = 'bo_tro', nhom_bo_tro = 'gk:ov12h' WHERE id IN (?, ?)`).run(a.ivId, b.ivId);
    const truoc = get('SELECT status, action_due, cycle_no FROM case_interventions WHERE id = ?', b.ivId);
    cases.updateResult(P.mbManager, a.ivId, { decision: 'keep', outcome: 'partial', note: 'Em A đúng 15/20 câu điền số', observedOn: TODAY });
    const sau = get('SELECT status, action_due, cycle_no FROM case_interventions WHERE id = ?', b.ivId);
    assert(get('SELECT COUNT(*) n FROM case_followups WHERE intervention_id = ?', b.ivId).n === 0, 'em B nhận bản chép kết quả');
    assert(JSON.stringify(sau) === JSON.stringify(truoc), `PA em B đổi: ${JSON.stringify(truoc)} → ${JSON.stringify(sau)}`);
    assert(get('SELECT COUNT(*) n FROM case_followups WHERE intervention_id = ?', a.ivId).n === 1, 'em A phải có kết quả');
  }));

  // ------------------------------------------------------------------ (3) Tutor theo buổi
  check('OV12h-3 · Tutor: Số buổi kỳ này 2 → thiếu dòng / dòng trống → 400; đủ 2 dòng → lưu 2 dòng, hiện ở lịch sử, sửa thay dòng; 0 buổi → không dòng', () => thu(() => {
    const { caseId, ivId } = caseVaPa(em(), { kind: 'tutor', description: 'Tutor Listening 1-1', soBuoi: 6, performerName: 'Tutor ngoài' });
    const vao = (x: Record<string, unknown>) => ({ decision: 'keep', outcome: 'partial', note: 'Hai buổi tutor, đúng thêm 3 câu', observedOn: TODAY, soBuoi: 2, ...x });
    assert(maLoi(() => cases.updateResult(GV, ivId, vao({}))) === 400, 'không gửi dòng buổi phải 400');
    assert(maLoi(() => cases.updateResult(GV, ivId, vao({ buoi: [{ tutor: 'Ms Lan', nhanXet: 'Luyện số đếm, em tiến bộ' }] }))) === 400, 'thiếu một dòng phải 400');
    assert(maLoi(() => cases.updateResult(GV, ivId, vao({ buoi: [{ tutor: 'Ms Lan', nhanXet: 'Luyện số đếm' }, { tutor: ' ', nhanXet: 'Luyện bản đồ' }] }))) === 400, 'tên tutor trống phải 400');
    assert(maLoi(() => cases.updateResult(GV, ivId, vao({ buoi: [{ tutor: 'Ms Lan', nhanXet: 'Luyện số đếm' }, { tutor: 'Mr Nam', nhanXet: '' }] }))) === 400, 'nhận xét trống phải 400');
    assert(get('SELECT COUNT(*) n FROM case_followups WHERE intervention_id = ?', ivId).n === 0, 'lỗi mà vẫn ghi');
    cases.updateResult(GV, ivId, vao({ buoi: [{ tutor: 'Ms Lan', nhanXet: 'Luyện số đếm, em tiến bộ' }, { tutor: 'Mr Nam', nhanXet: 'Luyện bản đồ, còn sai hướng' }] }));
    const f = get('SELECT id FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', ivId);
    const dong = conn.prepare('SELECT buoi_so, tutor_ten, nhan_xet FROM case_followup_buoi WHERE followup_id = ? ORDER BY buoi_so').all(f.id) as any[];
    assert(dong.length === 2 && dong[0].tutor_ten === 'Ms Lan' && dong[1].buoi_so === 2 && dong[1].nhan_xet === 'Luyện bản đồ, còn sai hướng', `dòng: ${JSON.stringify(dong)}`);
    const ls = cases.caseDetail(GV, caseId).followups.find((x: any) => x.id === f.id);
    assert(ls?.buoi?.length === 2 && ls.buoi[1].tutor === 'Mr Nam', `lịch sử: ${JSON.stringify(ls?.buoi)}`);
    /* Sửa lần ghi (OV-7b, giữ lựa chọn = sửa chữ): thiếu dòng → 400; đủ → thay đúng 2 dòng. */
    assert(maLoi(() => cases.suaKetQua(GV, f.id, vao({ buoi: [{ tutor: 'Ms Lan', nhanXet: 'Sửa nhận xét buổi 1' }] }))) === 400, 'sửa thiếu dòng phải 400');
    cases.suaKetQua(GV, f.id, vao({ buoi: [{ tutor: 'Ms Lan', nhanXet: 'Sửa nhận xét buổi 1' }, { tutor: 'Mr Nam', nhanXet: 'Luyện bản đồ, còn sai hướng' }] }));
    const sau = conn.prepare('SELECT nhan_xet FROM case_followup_buoi WHERE followup_id = ? ORDER BY buoi_so').all(f.id) as any[];
    assert(sau.length === 2 && sau[0].nhan_xet === 'Sửa nhận xét buổi 1', `sau sửa: ${JSON.stringify(sau)}`);
    /* Kỳ 0 buổi (em nghỉ): không cần dòng. */
    cases.updateResult(GV, ivId, vao({ soBuoi: 0, note: 'Kỳ này em nghỉ, chưa học tutor' }));
  }));

  check('OV12h-3c · Tutor KHÔNG có Số buổi lúc tạo: vẫn bắt buộc Số buổi kỳ này + đủ dòng; lần ghi cũ (không số buổi) sửa chữ giữ như trước', () => thu(() => {
    const { ivId } = caseVaPa(em(), { kind: 'tutor', description: 'Tutor Listening 1-1', performerName: 'Tutor ngoài' });
    assert(get('SELECT so_buoi FROM case_interventions WHERE id = ?', ivId).so_buoi === null, 'PA phải không có Số buổi');
    const kq = { decision: 'keep', outcome: 'partial', note: 'Một buổi tutor, đúng thêm 2 câu', observedOn: TODAY };
    assert(maLoi(() => cases.updateResult(GV, ivId, kq)) === 400, 'không Số buổi kỳ này phải 400');
    assert(maLoi(() => cases.updateResult(GV, ivId, { ...kq, soBuoi: 1 })) === 400, 'thiếu dòng buổi phải 400');
    cases.updateResult(GV, ivId, { ...kq, soBuoi: 1, buoi: [{ tutor: 'Ms Lan', nhanXet: 'Luyện số đếm, còn nhầm 15 và 50' }] });
    const f = get('SELECT id, so_buoi FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', ivId);
    assert(f.so_buoi === 1 && get('SELECT COUNT(*) n FROM case_followup_buoi WHERE followup_id = ?', f.id).n === 1, `lần ghi: ${JSON.stringify(f)}`);
    /* Lần ghi CŨ (trước OV-12h: không số buổi, không dòng) — sửa chữ không hỏi số buổi / dòng. */
    conn.prepare('UPDATE case_followups SET so_buoi = NULL WHERE id = ?').run(f.id);
    conn.prepare('DELETE FROM case_followup_buoi WHERE followup_id = ?').run(f.id);
    cases.suaKetQua(GV, f.id, { ...kq, note: 'Sửa chữ lần ghi cũ, em tiến bộ phần số' });
    assert(get('SELECT note, so_buoi FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', ivId).note === 'Sửa chữ lần ghi cũ, em tiến bộ phần số', 'sửa lần ghi cũ phải lưu');
  }));

  check('OV12h-3b · PA không phải Tutor: không đòi dòng buổi', () => thu(() => {
    const { ivId } = caseVaPa(em(), { kind: 'self_study', description: 'Tự học nghe chép', soBuoi: 6 });
    cases.updateResult(GV, ivId, { decision: 'keep', outcome: 'partial', note: 'Tự học đều, đúng thêm 2 câu', observedOn: TODAY, soBuoi: 2 });
  }));

  // ------------------------------------------------------------------ (4) meeting CX hạn 5 ngày
  /** Em mới ở MB FT 101 + lượt MT1 + một việc meeting CX tạo `ngayTao` — không dựa vào dữ liệu seed (bộ kiểm khác đổi). Việc phối hợp khác của lớp bỏ đi. */
  const meeting = (ngayTao: string) => {
    const sid = em();
    const cy = get('SELECT id FROM learning_cycles WHERE student_id = ?', sid).id;
    const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?,?, 1, 'mock', ?, 'done', ?)`)
      .run(cy, sid, LOP, new Date().toISOString()).lastInsertRowid);
    conn.prepare('DELETE FROM sos_coordination_actions WHERE student_id IN (SELECT student_id FROM enrollments WHERE class_id = ?)').run(LOP);
    const id = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?,?, 'cx_meeting_student', 1, 'pending', ?)`)
      .run(aid, sid, `${ngayTao}T03:00:00.000Z`).lastInsertRowid);
    xoaNho();
    return { id, studentId: sid };
  };
  /** GVCN hiện tại của lớp (đọc lúc chạy — bộ kiểm trước có thể đổi phân công). */
  const gvcn = () => loadPrincipal(get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' ORDER BY id LIMIT 1`, LOP).user_id);
  const dongPhoiHop = (p: any, o: any = {}) => mywork.myWork(p, o).items.find((it: any) => it.key === `phoi_hop_sos:${LOP}`);

  check('OV12h-4a · meeting CX tạo 6 ngày trước → GVCN thấy Phối hợp SOS quá hạn (hạn = ngày tạo + 5), QL thấy ở Của GV', () => thu(() => {
    meeting(addDays(TODAY, -6));
    const it = dongPhoiHop(gvcn());
    assert(it, 'GVCN không thấy dòng Phối hợp SOS');
    assert(it.due === addDays(TODAY, -1) && it.urgency === 'overdue', `hạn/khẩn: ${it.due} ${it.urgency}`);
    const ql = dongPhoiHop(P.mbManager, { nguoi: 'tat-ca' });
    assert(ql?.urgency === 'overdue' && ql.ownerId === gvcn().userId, `QL Của GV: ${JSON.stringify(ql && { u: ql.urgency, o: ql.ownerId })}`);
    const m = metrics.metricSet(P.mbManager, 'phoi-hop-qua-han', {});
    assert(m.ids.length >= 1, `chỉ số phoi-hop-qua-han: ${m.ids.length}`);
  }));

  check('OV12h-4b · meeting CX tạo 2 ngày trước → có hạn, chưa quá hạn; việc phối hợp khác không có hạn', () => thu(() => {
    const { studentId } = meeting(addDays(TODAY, -2));
    const it = dongPhoiHop(gvcn());
    assert(it.due === addDays(TODAY, 3) && it.urgency !== 'overdue', `hạn/khẩn: ${it.due} ${it.urgency}`);
    const turns = phoiHop.coordinationOfStudent(gvcn(), studentId).rows;
    const a = turns.flatMap((x: any) => x.actions).find((x: any) => x.kind === 'cx_meeting_student');
    assert(a?.han === addDays(TODAY, 3) && a.quaHan === false, `hồ sơ HV: ${a?.han} ${a?.quaHan}`);
    conn.prepare(`UPDATE sos_coordination_actions SET kind = 'talk_student' WHERE id = ?`).run(a.id);
    xoaNho();
    assert(dongPhoiHop(gvcn()).due === null, 'việc không phải meeting CX vẫn có hạn');
  }));

  check('OV12h-4c · xác nhận meeting CX: ghi chú < 10 ký tự → 400; đủ → xong, hết quá hạn', () => thu(() => {
    const { id } = meeting(addDays(TODAY, -6));
    assert(maLoi(() => phoiHop.confirmCoordination(gvcn(), id, { performedOn: TODAY, note: 'Đã gặp' })) === 400, 'ghi chú ngắn phải 400');
    assert(maLoi(() => phoiHop.confirmCoordination(gvcn(), id, { performedOn: TODAY })) === 400, 'thiếu ghi chú phải 400');
    phoiHop.confirmCoordination(gvcn(), id, { performedOn: TODAY, note: 'Đã gặp em và CX, thống nhất lịch tutor' });
    xoaNho();
    assert(!dongPhoiHop(gvcn()), 'xong rồi vẫn còn việc');
    assert(metrics.metricSet(P.mbManager, 'phoi-hop-qua-han', {}).ids.length === 0, 'xong rồi vẫn báo quá hạn');
  }));
}
