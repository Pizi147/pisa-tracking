/**
 * PHÉP KIỂM RKC-1a (chủ SP 07/11 "KHÔNG BAO GIỜ CHẶN CỨNG"): điểm Test — hỏi xác nhận thay chặn (`canXacNhan` → 409 `{ canXacNhan }`, web gửi lại
 * `x-xac-nhan` = mã câu đã đồng ý); ô vắng nhập được (đổi về "đã làm bài"); lượt huỷ: QL hỏi rồi khôi phục, GV chỉ đường; em Lưu trữ sửa điểm được; khôi phục điểm cũ
 * đè điểm mới (cất); báo vắng ô có điểm (huỷ điểm, cất). Bảng: docs/ra-khoa-cung/bang.md.
 */
export async function runRkcDiemTests(t: any) {
  const { check, assert } = t;
  if (!t.conn) return;
  const { conn, P, classId } = t;
  const util: any = await import('../util.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const kqh: any = await import('../fasttrack/ketQuaHuy.ts');
  const absence: any = await import('../fasttrack/absence.ts');
  const perm: any = await import('../permissions.ts');
  const { setConfig, getConfig } = await import('../demoConfig.ts');
  const { xoaNho, voiXacNhan, daXacNhan, chayTrongRequest, docXacNhan } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /* Hôm nay T3 15/09/2026 (không khoá cuối tuần N15); tuần thi W3 SEP (14/09) đã tới. */
  const T3 = '2026-09-15', NAY = '2026-09-14';
  const datNgay = (n: string) => { setConfig('demo_date', n); xoaNho(); };
  const thu = <T>(fn: () => T): T => {
    const cu = getConfig('demo_date');
    conn.exec('BEGIN IMMEDIATE');
    try { datNgay(T3); return fn(); } finally { conn.exec('ROLLBACK'); datNgay(cu); }
  };
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const hoi = (e: any) => e?.status === 409 && e.details?.canXacNhan === true;
  const MB_FT = classId('MB FT 101');
  const QL = P.mbManager;
  const gvL = perm.loadPrincipal(get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' ORDER BY id LIMIT 1`, MB_FT).user_id);
  let seq = 0;
  const luot = () => {
    const ten = `RKC HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `rkc-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const id = svc.createAttempt(P.admin, { studentId: sid, cycleId: cy, attemptNo: 1, periodId: week.ensurePeriod(NAY).id }).id as number;
    ss.ensureSkillRows(id);
    xoaNho();
    return { id, sid };
  };
  const diem = (id: number, k: string) => get('SELECT raw_score, band, no_show_period_id FROM assessment_scores WHERE attempt_id = ? AND skill = ?', id, k);

  console.log('\nRKC-1a — điểm Test: hỏi xác nhận thay chặn cứng');

  check('RKC-0 · canXacNhan: chưa đồng ý → 409 { canXacNhan, ma, nut }; đồng ý ĐÚNG mã câu → qua, câu khác vẫn hỏi; voiXacNhan → mọi câu; xong thì tắt', () => {
    const A = 'Ô này đã có điểm — huỷ điểm (khôi phục lại được) rồi ghi vắng?', B = '{nhan} đã huỷ — khôi phục {nhan} rồi làm tiếp?';
    const e = loiCua(() => util.canXacNhan(A, undefined, 'Huỷ điểm, ghi vắng'));
    assert(hoi(e) && e.details.ma === A && e.details.nut === 'Huỷ điểm, ghi vắng', `phải 409 hỏi: ${e?.status} ${JSON.stringify(e?.details)}`);
    chayTrongRequest('PUT', () => {
      util.canXacNhan(A);
      assert(hoi(loiCua(() => util.canXacNhan(B, { nhan: 'MT2' }))), 'đồng ý A không được cho qua B');
    }, docXacNhan(encodeURIComponent(A)));
    assert(hoi(loiCua(() => chayTrongRequest('PUT', () => util.canXacNhan(A), docXacNhan('1')))), '"1" không phải đồng ý');
    voiXacNhan(() => { assert(daXacNhan(B), 'voiXacNhan: mọi câu'); util.canXacNhan(A); });
    assert(!daXacNhan(A), 'ra ngoài phải tắt');
  });

  check('RKC-1 · ô ĐANG VẮNG: nhập điểm → 409 hỏi (không đổi gì); xác nhận → kỹ năng "đã làm bài" + điểm lưu + nhật ký lịch', () => thu(() => {
    const { id } = luot();
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = 'listening'`).run(id);
    xoaNho();
    const e = loiCua(() => svc.saveScore(QL, id, 'listening', { rawScore: 30 }, T3));
    assert(hoi(e) && !diem(id, 'listening')?.raw_score, `chưa xác nhận: ${e?.status} ${e?.message}`);
    voiXacNhan(() => svc.saveScore(QL, id, 'listening', { rawScore: 30 }, T3));
    assert(diem(id, 'listening').raw_score === 30, 'điểm phải lưu');
    assert(get(`SELECT sit_status FROM attempt_skills WHERE attempt_id = ? AND skill = 'listening'`, id).sit_status === 'sat', 'phải về đã làm bài');
    assert(get(`SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id = ? AND action = 'skill_sit_status' AND new_value = 'sat'`, id).n >= 1, 'thiếu nhật ký lịch');
  }));

  check('RKC-2 · LƯỢT ĐÃ HUỶ: GV (không khôi phục được) → 400 chỉ đường; QL → 409 hỏi; xác nhận → lượt khôi phục + điểm lưu', () => thu(() => {
    const { id } = luot();
    svc.huyLuot(QL, id, { lyDo: 'Thử RKC' });
    xoaNho();
    const eGv = loiCua(() => svc.saveScore(gvL, id, 'listening', { rawScore: 28 }, T3));
    assert(eGv?.status === 400 && /nhờ Quản lý khôi phục/.test(eGv.message), `GV: ${eGv?.status} ${eGv?.message}`);
    const eQl = loiCua(() => svc.saveScore(QL, id, 'listening', { rawScore: 28 }, T3));
    assert(hoi(eQl) && get('SELECT status FROM assessment_attempts WHERE id = ?', id).status === 'cancelled', `QL chưa xác nhận: ${eQl?.status} ${eQl?.message}`);
    voiXacNhan(() => svc.saveScore(QL, id, 'listening', { rawScore: 28 }, T3));
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', id).status !== 'cancelled', 'lượt phải khôi phục');
    assert(diem(id, 'listening').raw_score === 28, 'điểm phải lưu');
  }));

  check('RKC-3 · em LƯU TRỮ (Kết thúc học) — mở Q-B1: GV đúng môn + QL nhập / sửa điểm được, không bắt Quay lại học', () => thu(() => {
    const { id, sid } = luot();
    conn.prepare(`UPDATE students SET status = 'finished', archived_at = ? WHERE id = ?`).run('2026-09-15T00:00:00.000Z', sid);
    xoaNho();
    svc.saveScore(gvL, id, 'listening', { rawScore: 31 }, T3);
    assert(diem(id, 'listening').raw_score === 31, 'GV phải lưu được');
    svc.saveScore(QL, id, 'listening', { rawScore: 32 }, T3);
    assert(diem(id, 'listening').raw_score === 32, 'QL phải sửa được');
  }));

  check('RKC-4 · Khôi phục điểm cũ khi ô đã có điểm mới: 409 hỏi; xác nhận → điểm cũ về, điểm mới được cất (còn khôi phục được)', () => thu(() => {
    const { id } = luot();
    svc.saveScore(QL, id, 'reading', { rawScore: 30 }, T3);
    svc.saveScore(QL, id, 'reading', { rawScore: null, criteria: [null, null, null, null] }, T3);
    svc.saveScore(QL, id, 'reading', { rawScore: 25 }, T3);
    /* Ô vừa có điểm mới thì bản cất cũ hết hiệu lực (T20b) — dựng lại bản mở như trước để thử luồng đè. */
    conn.prepare(`UPDATE ket_qua_huy SET khoi_phuc_luc = NULL WHERE attempt_id = ? AND loai = 'huy_diem'`).run(id);
    xoaNho();
    const e = loiCua(() => kqh.khoiPhucDiem(QL, id, 'reading', T3));
    assert(hoi(e) && diem(id, 'reading').raw_score === 25, `chưa xác nhận: ${e?.status} ${e?.message}`);
    voiXacNhan(() => kqh.khoiPhucDiem(QL, id, 'reading', T3));
    assert(diem(id, 'reading').raw_score === 30, `điểm cũ phải về: ${JSON.stringify(diem(id, 'reading'))}`);
    const mo = conn.prepare(`SELECT diem_json FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'huy_diem' AND khoi_phuc_luc IS NULL`).all(id) as any[];
    assert(mo.some((k) => JSON.parse(k.diem_json)[0]?.raw_score === 25), `điểm mới 25 phải được cất: ${JSON.stringify(mo)}`);
  }));

  check('RKC-5 · Báo vắng kỹ năng ĐÃ CÓ ĐIỂM: 409 hỏi (điểm giữ); xác nhận → huỷ điểm (cất) rồi ghi vắng', () => thu(() => {
    const { id } = luot();
    svc.saveScore(QL, id, 'listening', { rawScore: 30 }, T3);
    const e = loiCua(() => absence.baoVang(QL, id, 'listening', 'ốm', T3));
    assert(hoi(e) && diem(id, 'listening').raw_score === 30, `chưa xác nhận: ${e?.status} ${e?.message}`);
    voiXacNhan(() => absence.baoVang(QL, id, 'listening', 'ốm', T3));
    const d = diem(id, 'listening');
    assert(d.raw_score === null && d.no_show_period_id !== null, `sau xác nhận: ${JSON.stringify(d)}`);
    assert(get(`SELECT COUNT(*) n FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'huy_diem' AND khoi_phuc_luc IS NULL`, id).n === 1, 'điểm phải được cất');
  }));
}
