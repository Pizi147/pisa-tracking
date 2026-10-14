/**
 * PHÉP KIỂM PR-OV7b — Sửa sau khi lưu (2/2): Case · PA.
 * Sửa lần ghi Kết quả PA gần nhất = đảo hệ quả lần cũ rồi chạy hệ quả lần mới (MỘT giao dịch): so ảnh chụp DB của em "ghi cũ → sửa" với em
 * "chỉ ghi lần mới" (dựng giống hệt, cùng giao dịch). Sửa chữ không đảo gì. Chặn đúng câu khi không đảo được. Người ghi + QL; GV khác 403.
 * Sửa "Xem lại sau hỗ trợ"; GV đã hoàn thành Case Mở lại được. Mọi nhóm chạy trong giao dịch cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv7bTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, classId, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const { chenPa } = await import('../cases/taoPa.ts');
  const { soCauSql, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nPR-OV7b · Sửa sau khi lưu (2/2): Case · PA');

  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const loi = (fn: () => unknown): { status?: number; message: string } | null => { try { fn(); return null; } catch (e: any) { return { status: e?.status, message: String(e?.message ?? e) }; } };

  const GV = P.lrTeacher;
  const QL = P.mbManager;
  /* GV khác cùng lớp, xem được Case (GV Listening của bộ demo có thể kiêm GVCN — lọc theo id). */
  const GV_KHAC = [P.w1Teacher, P.subjectTeacher, P.coreTeacher].filter((x) => x && x.userId !== GV.userId);
  const LOP = classId('MB FT 101');
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  let so = 0;
  const em = (): number => {
    so += 1;
    const tag = `OV7b-${so}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  /** Case Listening báo tay + một PA Tự học đang chạy. */
  const caseVaPa = (sid: number) => {
    const caseId = cases.reportIssue(GV, {
      studentId: sid, topic: 'listening', title: 'Nghe sót số liệu', summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
      primaryCode: d.issuesForTopic('listening')[0].code, idempotencyKey: `ov7b-case-${sid}`,
    }).id as number;
    const r = cases.recordIntervention(GV, caseId, {
      kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày', status: 'started', startedDate: TODAY,
    });
    return { caseId, ivId: Math.max(...r.interventions.map((i: any) => i.id)) as number };
  };
  const NOTE = 'Đúng 15/20 câu điền số tuần này';
  const LUA_CHON: Record<string, Record<string, unknown>> = {
    keep: { decision: 'keep', outcome: 'partial', note: NOTE },
    end: { decision: 'end', outcome: 'improved', note: 'Em nghe số và tên riêng đúng hết' },
    adjust: { decision: 'adjust', outcome: 'unchanged', note: 'Vẫn sai số có hai chữ số', decisionNote: 'Đổi cách luyện',
      adjust: { description: 'Tự học Listening — nghe chép số liệu 20 phút mỗi ngày' } },
    replace: { decision: 'replace', outcome: 'worse', note: 'Sai nhiều hơn tuần trước', decisionNote: 'Tự học không hiệu quả',
      newPlan: { kind: 'extra_support', description: 'Học kèm 1-1 với Tutor 2 buổi/tuần' } },
    ask_manager: { decision: 'ask_manager', outcome: 'unchanged', note: 'Không tiến bộ sau hai tuần', decisionNote: 'Cần QL xếp tutor buổi tối cho em' },
  };
  const ghi = (ivId: number, k: string, p = GV) => cases.updateResult(p, ivId, LUA_CHON[k]);
  const fuMoi = (ivId: number) => get('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1', ivId);

  /** Ảnh chụp mọi thứ một lần ghi Kết quả có thể chạm của MỘT em — không id, không giờ ghi. */
  const chup = (sid: number) => {
    const cs = all('SELECT * FROM sos_cases WHERE student_id = ? ORDER BY id', sid);
    const ci = new Map(cs.map((c, i) => [c.id, i]));
    const ph = cs.map(() => '?').join(',') || 'NULL';
    const pas = all(`SELECT * FROM case_interventions WHERE case_id IN (${ph}) ORDER BY id`, ...cs.map((c) => c.id));
    const pi = new Map(pas.map((r, i) => [r.id, i]));
    const fus = all(`SELECT * FROM case_followups WHERE case_id IN (${ph}) ORDER BY id`, ...cs.map((c) => c.id));
    return JSON.stringify({
      case: cs.map((c) => [c.status, c.outcome, c.outcome_note, c.closed_at, c.closed_by]),
      pa: pas.map((r) => [ci.get(r.case_id), r.kind, r.description, r.status, r.cycle_no, r.cycle_started_on, r.action_due, r.started_date, r.completed_date,
        r.closed_reason, r.superseded_by == null ? null : pi.get(r.superseded_by), r.performer_user_id, r.performer_name, r.followup_due, r.so_buoi, r.approval_state]),
      fu: fus.map((f) => [pi.get(f.intervention_id), f.observed_on, f.observer_user_id, f.outcome, f.note, f.next_step, f.cycle_no, f.cycle_due, f.late,
        f.remaining_issue, f.decision_note, f.so_buoi]),
      rev: all(`SELECT * FROM case_intervention_revisions WHERE case_id IN (${ph}) ORDER BY id`, ...cs.map((c) => c.id))
        .map((r) => [pi.get(r.intervention_id), r.source, r.old_description, r.new_description, r.old_so_buoi, r.new_so_buoi, r.reason, r.effective_on]),
      the: all(`SELECT loai, ly_do, nguoi_xin FROM yeu_cau_duyet WHERE hoc_vien_id = ? AND trang_thai = 'cho' ORDER BY loai`, sid),
      hanhTrinh: all(`SELECT event_type, title, detail, event_date FROM journey_events WHERE student_id = ? AND ref_table IN ('case_followups', 'case_interventions')
        ORDER BY event_type, title, detail`, sid),
      mt: all('SELECT ty_le, ngay_lam FROM mini_test WHERE student_id = ?', sid),
    });
  };
  /** Hai em giống hệt: em A ghi `cu` rồi sửa thành `moi`; em B chỉ ghi `moi`. Trả hai ảnh chụp. */
  const soSanh = (dung: (sid: number) => { ivId: number }, cu: () => Record<string, unknown>, moi: () => Record<string, unknown>, p = GV) => {
    const a = em(); const pa = dung(a);
    cases.updateResult(GV, pa.ivId, cu());
    cases.suaKetQua(p, fuMoi(pa.ivId).id, moi());
    const b = em(); const pb = dung(b);
    cases.updateResult(GV, pb.ivId, moi());
    return [chup(a), chup(b)];
  };

  // ==================================================================== 1 · mỗi lựa chọn: ghi → sửa sang lựa chọn khác = như chỉ ghi lần mới
  const CAP: [string, string][] = [
    ['keep', 'end'], ['end', 'keep'], ['keep', 'adjust'], ['adjust', 'keep'], ['keep', 'replace'], ['replace', 'keep'],
    ['keep', 'ask_manager'], ['ask_manager', 'keep'], ['adjust', 'replace'], ['end', 'ask_manager'],
  ];
  for (const [cu, moi] of CAP) {
    check(`OV7b-1 · Kết quả PA: ghi "${cu}" → sửa sang "${moi}" = như chỉ ghi "${moi}" (PA · Case · revision · PA thay · thẻ · Hành trình)`, () => thu(() => {
      const [a, b] = soSanh(caseVaPa, () => LUA_CHON[cu], () => LUA_CHON[moi]);
      assert(a === b, `\nsửa : ${a}\nmới : ${b}`);
    }));
  }
  check('OV7b-1b · Quản lý sửa lần ghi của GV: như chỉ ghi lần mới, người ghi giữ là GV (GV còn sửa tiếp được)', () => thu(() => {
    const [a, b] = soSanh(caseVaPa, () => LUA_CHON.end, () => LUA_CHON.keep, QL);
    assert(a === b, `\nsửa : ${a}\nmới : ${b}`);
  }));
  check('OV7b-1c · Kết thúc → Sửa → Tiếp tục: PA chạy lại, hạn ghi mới; Thay PA → Sửa → Giữ nguyên: PA mới + thẻ Đề xuất PA biến mất, không chuông thêm cho QL', () => thu(() => {
    const s = em(); const { ivId } = caseVaPa(s);
    ghi(ivId, 'end');
    assert(get('SELECT status FROM case_interventions WHERE id = ?', ivId).status === 'completed', 'Kết thúc');
    cases.suaKetQua(GV, fuMoi(ivId).id, LUA_CHON.keep);
    const pa = get('SELECT * FROM case_interventions WHERE id = ?', ivId);
    assert(pa.status === 'started' && pa.cycle_no === 2 && pa.completed_date === null && pa.action_due === d.hanKe(TODAY, d.hanKyGhiKetQua(TODAY), TODAY), JSON.stringify(pa));
    const s2 = em(); const x = caseVaPa(s2);
    ghi(x.ivId, 'replace');
    const moiPa = get('SELECT superseded_by FROM case_interventions WHERE id = ?', x.ivId).superseded_by;
    assert(get(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE loai = 'de_xuat_pa' AND doi_tuong_id = ? AND trang_thai = 'cho'`, moiPa).n === 1, 'thẻ Đề xuất PA');
    const chuong = get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ?`, QL.userId).n;
    cases.suaKetQua(GV, fuMoi(x.ivId).id, LUA_CHON.keep);
    assert(!get('SELECT 1 FROM case_interventions WHERE id = ?', moiPa), 'PA thay thế phải bị xoá');
    assert(get(`SELECT COUNT(*) n FROM yeu_cau_duyet WHERE doi_tuong_id = ? AND trang_thai = 'cho'`, moiPa).n === 0, 'thẻ Đề xuất PA phải đóng');
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ?`, QL.userId).n === chuong, 'không chuông mới cho QL');
  }));
  check('OV7b-1d · Xin hỗ trợ QL → sửa câu hỏi + sửa lại Xin hỗ trợ: CÙNG một thẻ, chữ mới, không chuông thêm cho QL', () => thu(() => {
    const s = em(); const { ivId } = caseVaPa(s);
    ghi(ivId, 'ask_manager');
    const the = get(`SELECT * FROM yeu_cau_duyet WHERE loai = 'xin_y_kien' AND doi_tuong_id = ? AND trang_thai = 'cho'`, ivId);
    const chuong = get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ?`, QL.userId).n;
    cases.suaKetQua(GV, fuMoi(ivId).id, { ...LUA_CHON.ask_manager, outcome: 'worse', decisionNote: 'Cần QL gọi phụ huynh trong tuần' });
    const sau = all(`SELECT * FROM yeu_cau_duyet WHERE loai = 'xin_y_kien' AND doi_tuong_id = ? AND trang_thai = 'cho'`, ivId);
    assert(sau.length === 1 && sau[0].id === the.id && sau[0].ly_do === 'Cần QL gọi phụ huynh trong tuần', JSON.stringify(sau));
    assert(JSON.parse(sau[0].du_lieu).followupId === fuMoi(ivId).id, 'thẻ trỏ lần ghi mới');
    assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ?`, QL.userId).n === chuong, 'không chuông mới cho QL');
  }));

  // ==================================================================== 2 · nhóm bổ trợ · bổ trợ miễn phí (Mini Test)
  let soNhom = 0;
  /** Hai Case Final Test (L, R) cùng nhóm bổ trợ, PA quy chế đang chạy do GV dạy. `mien = true`: bổ trợ miễn phí, mốc đã qua (lần ghi cuối) + Mini Test. */
  const nhomBoTro = (mien: boolean) => (sid: number) => {
    const nhom = `ov7b:${++soNhom}:${sid}`;
    const cy = get(`SELECT id FROM learning_cycles WHERE student_id = ?`, sid).id;
    const now = new Date().toISOString();
    const ivs: number[] = [];
    for (const topic of ['listening', 'reading']) {
      const cid = Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, topic, category, origin_kind, status, title, detected_at, created_at)
        VALUES (?,?,?,?, 'chuyen_cap', 'in_progress', ?, ?, ?)`).run(sid, cy, topic, topic, `Final Test · ${topic}`, TODAY, now).lastInsertRowid);
      ivs.push(...chenPa(conn, [{
        caseId: cid, kind: mien ? 'bo_tro_mien_phi' : 'bo_tro', description: 'Bổ trợ 2 buổi/tuần', status: 'started', preset: true,
        confirmedAt: now, confirmedBy: GV.userId, performerUserId: GV.userId, nhomBoTro: nhom, mocQuyChe: mien ? 'mini_test' : 'den_cuoi_khoa',
        followupDue: mien ? addDays(TODAY, -1) : addDays(TODAY, 40), actionDue: d.hanKyGhiKetQua(TODAY), cycleStartedOn: TODAY, startedDate: TODAY,
      }]));
    }
    if (mien) {
      conn.prepare(`INSERT INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han) VALUES (?,?,?,?, 2, ?, ?)`)
        .run(sid, cy, get('SELECT MIN(id) id FROM assessment_attempts').id, nhom, TODAY, addDays(TODAY, 2));
    }
    return { ivId: ivs[0] };
  };
  const BT = {
    keep: { decision: 'keep', outcome: 'partial', note: 'Cả nhóm làm đủ bài tuần này' },
    adjust: { decision: 'adjust', outcome: 'unchanged', note: 'Chưa tiến bộ rõ ở dạng bài dài', decisionNote: 'Đổi nội dung',
      adjust: { description: 'Bổ trợ 2 buổi/tuần — tập trung bài đọc dài' } },
    ask: { decision: 'ask_manager', outcome: 'unchanged', note: 'Chưa tiến bộ rõ ở dạng bài dài', decisionNote: 'Cần QL xếp thêm phòng học buổi tối' },
  };
  const MT = (tyLe: number, outcome = 'improved') => ({ outcome, note: 'Hết mốc bổ trợ, em làm Mini Test', miniTest: { tyLe, ngay: TODAY } });
  for (const [ten, cu, moi] of [['keep → adjust', BT.keep, BT.adjust], ['adjust → ask', BT.adjust, BT.ask], ['ask → keep', BT.ask, BT.keep]] as const) {
    check(`OV7b-2 · nhóm bổ trợ: ${ten} — kết quả chép sang PA anh em đảo theo, = như chỉ ghi lần mới`, () => thu(() => {
      const [a, b] = soSanh(nhomBoTro(false), () => cu, () => moi);
      assert(a === b, `\nsửa : ${a}\nmới : ${b}`);
    }));
  }
  check('OV7b-2b · sửa từ dòng chép ở Case anh em = sửa cả nhóm (cùng kết quả như sửa từ dòng chính)', () => thu(() => {
    const a = em(); const pa = nhomBoTro(false)(a);
    cases.updateResult(GV, pa.ivId, BT.keep);
    const anhEm = get(`SELECT f.id FROM case_followups f JOIN case_interventions iv ON iv.id = f.intervention_id
      WHERE iv.nhom_bo_tro = (SELECT nhom_bo_tro FROM case_interventions WHERE id = ?) AND iv.id != ? ORDER BY f.id DESC LIMIT 1`, pa.ivId, pa.ivId).id;
    cases.suaKetQua(GV, anhEm, BT.ask);
    const b = em(); const pb = nhomBoTro(false)(b);
    cases.updateResult(GV, pb.ivId, BT.ask);
    assert(chup(a) === chup(b), `\nsửa : ${chup(a)}\nmới : ${chup(b)}`);
  }));
  for (const [cu, moi] of [[80, 50], [50, 80], [80, 90]] as const) {
    check(`OV7b-3 · bổ trợ miễn phí, Kết quả cuối + Mini Test ${cu}% → sửa ${moi}%: Case đóng / mở, thẻ Báo QL, Mini Test = như chỉ ghi ${moi}%`, () => thu(() => {
      const [a, b] = soSanh(nhomBoTro(true), () => MT(cu), () => MT(moi, 'partial'));
      assert(a === b, `\nsửa : ${a}\nmới : ${b}`);
    }));
  }

  // ==================================================================== 3 · sửa chữ: chỉ cập nhật dòng, không đảo gì
  check('OV7b-4 · sửa chữ (nhận xét, còn tồn) giữ lựa chọn: CÙNG dòng, PA / thẻ / Hành trình không đảo, nhật ký trước → sau', () => thu(() => {
    const s = em(); const { ivId } = caseVaPa(s);
    ghi(ivId, 'ask_manager');
    const f = fuMoi(ivId);
    const pa = get('SELECT * FROM case_interventions WHERE id = ?', ivId);
    const the = get(`SELECT id FROM yeu_cau_duyet WHERE doi_tuong_id = ? AND loai = 'xin_y_kien' AND trang_thai = 'cho'`, ivId).id;
    const ht = get(`SELECT id FROM journey_events WHERE ref_table = 'case_followups' AND ref_id = ?`, f.id).id;
    cases.suaKetQua(GV, f.id, { ...LUA_CHON.ask_manager, note: 'Không tiến bộ sau hai tuần, vẫn nhầm 15 và 50', remainingIssue: 'Số có hai chữ số' });
    const f2 = fuMoi(ivId);
    assert(f2.id === f.id && f2.note.endsWith('15 và 50') && f2.remaining_issue === 'Số có hai chữ số', JSON.stringify(f2));
    const pa2 = get('SELECT * FROM case_interventions WHERE id = ?', ivId);
    assert(pa2.cycle_no === pa.cycle_no && pa2.action_due === pa.action_due && pa2.status === pa.status, 'PA không đảo');
    assert(get(`SELECT id FROM yeu_cau_duyet WHERE doi_tuong_id = ? AND loai = 'xin_y_kien' AND trang_thai = 'cho'`, ivId).id === the, 'thẻ giữ nguyên');
    const ht2 = get(`SELECT id, detail FROM journey_events WHERE ref_table = 'case_followups' AND ref_id = ?`, f.id);
    assert(ht2.id === ht && ht2.detail.includes('15 và 50'), 'Hành trình cùng dòng, chữ mới');
    const nk = all(`SELECT before_json, after_json FROM audit_logs WHERE action = 'case.result.edit' AND entity_id = ?`, ivId);
    assert(nk.length === 1 && JSON.parse(nk[0].before_json).note === 'Không tiến bộ sau hai tuần' && JSON.parse(nk[0].after_json).note.endsWith('15 và 50'), JSON.stringify(nk));
  }));

  // ==================================================================== 4 · chặn + quyền
  check('OV7b-5 · chặn đúng câu: không phải lần gần nhất · PA thay thế đã có kết quả · QL đã trả lời câu hỏi · Case đã hoàn thành', () => thu(() => {
    const s = em(); const { ivId, caseId } = caseVaPa(s);
    ghi(ivId, 'keep');
    const dau = fuMoi(ivId).id;
    ghi(ivId, 'keep');
    let e = loi(() => cases.suaKetQua(GV, dau, LUA_CHON.end));
    assert(e?.status === 400 && /gần nhất/.test(e.message), JSON.stringify(e));
    /* PA thay thế đã có kết quả */
    const s2 = em(); const x = caseVaPa(s2);
    ghi(x.ivId, 'replace');
    const moiPa = get('SELECT superseded_by FROM case_interventions WHERE id = ?', x.ivId).superseded_by;
    cases.respondToPlan(QL, moiPa, { decision: 'approved' });
    e = loi(() => cases.suaKetQua(GV, fuMoi(x.ivId).id, LUA_CHON.keep));
    assert(e?.status === 400 && /Quản lý đã (duyệt|trả lời)/.test(e.message), JSON.stringify(e));
    cases.updateResult(GV, moiPa, LUA_CHON.keep);
    e = loi(() => cases.suaKetQua(GV, fuMoi(x.ivId).id, LUA_CHON.keep));
    assert(e?.status === 400 && /PA thay thế đã có kết quả/.test(e.message), JSON.stringify(e));
    /* QL đã trả lời Xin hỗ trợ */
    const s3 = em(); const y = caseVaPa(s3);
    ghi(y.ivId, 'ask_manager');
    const the = get(`SELECT id FROM yeu_cau_duyet WHERE doi_tuong_id = ? AND loai = 'xin_y_kien' AND trang_thai = 'cho'`, y.ivId).id;
    yc.chotYeuCau(conn, { loai: 'xin_y_kien', doiTuongLoai: 'intervention', doiTuongId: y.ivId }, 'da_tra_loi', { nguoiDuyet: QL.userId, traLoi: 'Đã xếp tutor tối thứ Tư' });
    void the;
    e = loi(() => cases.suaKetQua(GV, fuMoi(y.ivId).id, LUA_CHON.keep));
    assert(e?.status === 400 && /Quản lý đã trả lời/.test(e.message), JSON.stringify(e));
    /* Case đã hoàn thành → Mở lại trước */
    ghi(ivId, 'end');
    cases.closeCaseOutcome(GV, caseId, { outcome: 'much_better', note: 'MT3 Listening lên 6.0, không còn sai dạng điền số' });
    e = loi(() => cases.suaKetQua(GV, fuMoi(ivId).id, LUA_CHON.keep));
    assert(e?.status === 400 && /Mở lại/.test(e.message), JSON.stringify(e));
    /* GET điền sẵn nói đúng câu chặn, không ném */
    const mo = cases.moSuaKetQua(GV, fuMoi(x.ivId).id);
    assert(/PA thay thế đã có kết quả/.test(mo.chan ?? ''), JSON.stringify(mo.chan));
  }));
  check('OV7b-6 · quyền: người đã ghi + QL; GV khác cùng lớp, QL chi nhánh khác 403', () => thu(() => {
    const s = em(); const { ivId } = caseVaPa(s);
    ghi(ivId, 'keep');
    const f = fuMoi(ivId).id;
    for (const p of [...GV_KHAC, P.cpManager]) {
      const e = loi(() => cases.suaKetQua(p, f, LUA_CHON.end));
      assert(e?.status === 403, `${p.userId}: ${JSON.stringify(e)}`);
      assert(loi(() => cases.moSuaKetQua(p, f))?.status === 403, 'GET điền sẵn 403');
    }
    cases.suaKetQua(QL, f, LUA_CHON.end);
    assert(fuMoi(ivId).next_step === 'complete' && fuMoi(ivId).observer_user_id === GV.userId, 'QL sửa được, người ghi giữ GV');
  }));
  check('OV7b-7 · điền sẵn (GET): đúng lựa chọn cũ, PA như TRƯỚC lần ghi (đợt, hạn, nội dung trước Điều chỉnh), PA thay, Mini Test', () => thu(() => {
    const s = em(); const { ivId } = caseVaPa(s);
    ghi(ivId, 'adjust');
    let mo = cases.moSuaKetQua(GV, fuMoi(ivId).id);
    assert(mo.chan === null && mo.giaTri.decision === 'adjust' && mo.giaTri.outcome === 'unchanged' && mo.giaTri.decisionNote === 'Đổi cách luyện', JSON.stringify(mo.giaTri));
    assert(mo.pa.cycleNo === 1 && mo.pa.actionDue === d.hanKyGhiKetQua(TODAY) && mo.pa.description.startsWith('Tự học Listening — nghe chép 15'), JSON.stringify(mo.pa));
    assert(mo.giaTri.adjust?.description.includes('20 phút'), JSON.stringify(mo.giaTri.adjust));
    const s2 = em(); const x = caseVaPa(s2);
    ghi(x.ivId, 'replace');
    mo = cases.moSuaKetQua(GV, fuMoi(x.ivId).id);
    assert(mo.giaTri.decision === 'replace' && mo.giaTri.newPlan?.kind === 'extra_support', JSON.stringify(mo.giaTri.newPlan));
    const s3 = em(); const y = nhomBoTro(true)(s3);
    cases.updateResult(GV, y.ivId, MT(80));
    mo = cases.moSuaKetQua(GV, fuMoi(y.ivId).id);
    assert(mo.pa.lanCuoi === true && mo.giaTri.decision === null && mo.giaTri.miniTest?.tyLe === 80, JSON.stringify(mo));
  }));
  check('OV7b-8 · Ngăn Case: cờ `suaDuoc` chỉ ở lần ghi gần nhất của PA, cho người đã ghi + QL; Case đã hoàn thành không có', () => thu(() => {
    const s = em(); const { ivId, caseId } = caseVaPa(s);
    ghi(ivId, 'keep'); ghi(ivId, 'keep');
    const co = (p: any) => cases.caseDetail(p, caseId).followups.filter((f: any) => f.suaDuoc).map((f: any) => f.id);
    assert(JSON.stringify(co(GV)) === JSON.stringify([fuMoi(ivId).id]), JSON.stringify(co(GV)));
    assert(co(QL).length === 1 && GV_KHAC.every((x) => co(x).length === 0), 'QL có, GV khác không');
  }));

  // ==================================================================== 5 · Xem lại sau hỗ trợ
  check('OV7b-9 · sửa "Xem lại sau hỗ trợ" lần mới nhất: người ghi + QL, nhật ký trước → sau, Hành trình cùng dòng; lần cũ 400; GV khác 403', () => thu(() => {
    const s = em(); const { caseId, ivId } = caseVaPa(s);
    cases.recordFollowUp(GV, caseId, { interventionId: ivId, outcome: 'partial', note: 'Xem lại: em nghe số khá hơn' });
    const cu = get('SELECT * FROM case_followups WHERE case_id = ? AND next_step IS NULL ORDER BY id DESC LIMIT 1', caseId);
    cases.recordFollowUp(GV, caseId, { interventionId: ivId, outcome: 'improved', note: 'Xem lại lần hai: đúng hết số' });
    const moi = get('SELECT * FROM case_followups WHERE case_id = ? AND next_step IS NULL ORDER BY id DESC LIMIT 1', caseId);
    assert(loi(() => cases.suaXemLai(GV, cu.id, { outcome: 'worse', note: 'Sửa lần cũ' }))?.status === 400, 'lần cũ 400');
    assert(loi(() => cases.suaXemLai(P.w1Teacher, moi.id, { outcome: 'worse', note: 'Sửa của người khác' }))?.status === 403, 'GV khác 403');
    cases.suaXemLai(GV, moi.id, { outcome: 'unchanged', note: 'Xem lại lần hai: còn nhầm 15 và 50' });
    const sau = get('SELECT * FROM case_followups WHERE id = ?', moi.id);
    assert(sau.outcome === 'unchanged' && sau.note.endsWith('15 và 50'), JSON.stringify(sau));
    assert(get(`SELECT title FROM journey_events WHERE ref_table = 'case_followups' AND ref_id = ?`, moi.id).title.includes('unchanged'), 'Hành trình đổi chữ');
    const nk = all(`SELECT before_json, after_json FROM audit_logs WHERE action = 'case.followup.edit' AND entity_id = ?`, moi.id);
    assert(nk.length === 1 && JSON.parse(nk[0].before_json).outcome === 'improved' && JSON.parse(nk[0].after_json).outcome === 'unchanged', JSON.stringify(nk));
    cases.suaXemLai(QL, moi.id, { outcome: 'improved', note: 'QL sửa: đúng hết số' });
    assert(loi(() => cases.suaXemLai(GV, moi.id, { outcome: 'bogus', note: 'x' }))?.status === 400, 'kết quả sai 400');
    assert(cases.caseDetail(GV, caseId).followups.filter((f: any) => f.suaDuoc && f.nextStep === null).map((f: any) => f.id).join() === String(moi.id), 'cờ sửa đúng lần mới nhất');
  }));

  // ==================================================================== 6 · Mở lại Case: người đã hoàn thành (GV) như QL
  check('OV7b-10 · GV hoàn thành Case → chính GV Mở lại được (cờ `coTheMoLai`), GV khác 403; Mở lại xong sửa được Kết quả cuối', () => thu(() => {
    const s = em(); const { ivId, caseId } = caseVaPa(s);
    ghi(ivId, 'end');
    cases.closeCaseOutcome(GV, caseId, { outcome: 'much_better', note: 'MT3 Listening lên 6.0, không còn sai dạng điền số' });
    assert(cases.caseDetail(GV, caseId).viewer.coTheMoLai === true, 'GV đã đóng thấy Mở lại');
    assert(GV_KHAC.every((x) => cases.caseDetail(x, caseId).viewer.coTheMoLai === false), 'GV không đóng → không');
    assert(loi(() => cases.moLaiCase(P.w1Teacher, caseId))?.status === 403, 'GV khác 403');
    cases.moLaiCase(GV, caseId);
    assert(get('SELECT status FROM sos_cases WHERE id = ?', caseId).status !== 'done', 'đã mở lại');
    cases.suaKetQua(GV, fuMoi(ivId).id, LUA_CHON.keep);
    assert(get('SELECT status FROM case_interventions WHERE id = ?', ivId).status === 'started', 'PA chạy lại sau khi sửa Kết thúc → Giữ nguyên');
  }));

  // ==================================================================== 7 · trần câu SQL
  check(`OV7b-11 · trần câu SQL: sửa đảo (Kết thúc → Tiếp tục) ≤ ${TRAN_GHI_LO.suaKetQua}; sửa chữ ≤ ${TRAN_GHI_LO.suaKetQuaChu}; điền sẵn ≤ ${TRAN_GHI_LO.moSuaKetQua}`, () => thu(() => {
    const s = em(); const { ivId } = caseVaPa(s);
    ghi(ivId, 'end');
    const doCau = (fn: () => unknown) => { xoaNho(); const s0 = soCauSql(); fn(); return soCauSql() - s0; };
    const mo = doCau(() => cases.moSuaKetQua(GV, fuMoi(ivId).id));
    const dao = doCau(() => cases.suaKetQua(GV, fuMoi(ivId).id, LUA_CHON.keep));
    const chu = doCau(() => cases.suaKetQua(GV, fuMoi(ivId).id, { ...LUA_CHON.keep, note: 'Đúng 16/20 câu điền số tuần này' }));
    console.log(`    điền sẵn ${mo} · sửa đảo ${dao} · sửa chữ ${chu} câu`);
    assert(mo <= TRAN_GHI_LO.moSuaKetQua && dao <= TRAN_GHI_LO.suaKetQua && chu <= TRAN_GHI_LO.suaKetQuaChu, `${mo} / ${dao} / ${chu}`);
  }));
}
