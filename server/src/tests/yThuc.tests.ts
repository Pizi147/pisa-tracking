/**
 * PHÉP KIỂM PR-J — mô hình Ý thức mới: Vi phạm và Biện pháp xử lý (21/09/2026).
 *
 * Tách khỏi `run.ts` vì `run.ts` đã gần một vạn dòng, và vì đây là MODULE THỨ CHÍN
 * (`server/src/yThuc/`, đặc tả §11) nên có chỗ kiểm riêng. Harness (`check`, `assert`, dữ liệu demo, các
 * tài khoản mẫu) vẫn do `run.ts` sở hữu và được truyền vào — file này không tự mở database.
 *
 * Mỗi mã luật V01–V14 · B01–B16 · W01–W06 của `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` có ít nhất một phép kiểm,
 * tên phép kiểm bắt đầu bằng mã luật để tìm được bằng tay.
 */
import type { Principal } from '../permissions.ts';

export type YThucTestKit = {
  check: (name: string, fn: () => void) => void;
  assert: (cond: unknown, msg: string) => void;
  assertThrows: (fn: () => unknown, match: RegExp, msg: string) => void;
  conn: any;
  TODAY: string;
  P: Record<string, Principal>;
  addDays: (date: string, n: number) => string;
  classId: (code: string) => number;
};

export async function runYThucTests(t: YThucTestKit) {
  const { check, assert } = t;
  const domain = await import('../../../shared/domain/index.ts');

  console.log('\nPR-J · 1. Từ vựng thuần của Ý thức (shared/domain/yThuc.ts)');

  check('PR-J · J2 Năm nhóm vi phạm đúng thứ tự bày ra, bỏ `Tham gia trên lớp` (Y04)', () => {
    assert(JSON.stringify(domain.VIOLATION_CATEGORIES) === JSON.stringify(['attendance', 'homework', 'conduct', 'classroom', 'other']),
      `Năm nhóm sai: ${JSON.stringify(domain.VIOLATION_CATEGORIES)}`);
    const labels = domain.VIOLATION_CATEGORIES.map((c) => domain.VIOLATION_CATEGORY_LABEL[c]);
    assert(JSON.stringify(labels) === JSON.stringify(['Chuyên cần', 'BTVN', 'Thái độ / hành vi', 'Kỷ luật lớp học', 'Khác']),
      `Nhãn năm nhóm sai: ${JSON.stringify(labels)}`);
    assert(!labels.some((l) => /Tham gia/.test(l)), 'Nhóm "Tham gia trên lớp" đã bỏ');
    /* Dữ liệu cũ nhóm `participation` đổi sang `Thái độ / hành vi`. */
    assert(domain.legacyTopicToViolationCategory('participation') === 'conduct', 'participation phải đổi sang conduct');
    assert(domain.legacyTopicToViolationCategory('homework') === 'homework' && domain.legacyTopicToViolationCategory('attendance') === 'attendance'
      && domain.legacyTopicToViolationCategory('other') === 'other', 'Ba nhóm còn lại giữ nguyên');
  });

  check('PR-J · J2 Chín loại biện pháp xếp nhẹ đến nặng, mỗi loại có nhãn (nguồn mục 18)', () => {
    assert(JSON.stringify(domain.MEASURE_KINDS) === JSON.stringify([
      'talk_short', 'meeting_student', 'family_report', 'warning_1', 'meeting_cx', 'warning_2', 'suspension', 'warning_3', 'other',
    ]), `Chín loại sai thứ tự: ${JSON.stringify(domain.MEASURE_KINDS)}`);
    assert(domain.MEASURE_KIND_LABEL.warning_1 === 'Thư cảnh cáo lần 1' && domain.MEASURE_KIND_LABEL.meeting_cx === 'CX / GĐCN meeting với HS / PH'
      && domain.MEASURE_KIND_LABEL.suspension === 'Đình chỉ học', 'Nhãn sai');
    for (const k of domain.MEASURE_KINDS) assert(domain.MEASURE_KIND_LABEL[k], `Loại ${k} thiếu nhãn`);
  });

  check('PR-J · J2 Hai trạng thái biện pháp (không có chờ duyệt) và bốn trạng thái hiển thị của vi phạm', () => {
    assert(JSON.stringify(domain.MEASURE_STATUSES) === JSON.stringify(['preparing', 'done']), 'Chỉ có preparing và done (Y01: không có cửa duyệt)');
    assert(domain.MEASURE_STATUS_LABEL.preparing === 'Đang chuẩn bị' && domain.MEASURE_STATUS_LABEL.done === 'Đã thực hiện', 'Nhãn trạng thái biện pháp');
    assert(JSON.stringify(domain.VIOLATION_STATE_LABEL) === JSON.stringify({
      unhandled: 'Chưa xử lý', preparing: 'Đang chuẩn bị xử lý', handled: 'Đã xử lý', invalid: 'Không còn hiệu lực',
    }), `Nhãn trạng thái vi phạm sai: ${JSON.stringify(domain.VIOLATION_STATE_LABEL)}`);
  });

  check('PR-J · J2 Y01 và Y02 là hằng số có tên, đúng lời chốt 21/09/2026', () => {
    assert(domain.Y01_AI_XAC_NHAN_BIEN_PHAP_NANG === 'gvcn-tu-lam', 'Y01: GVCN tự làm hết');
    assert(domain.Y02_PHAM_VI_CHUOI_THU_CANH_CAO === 'theo-lo-trinh', 'Y02: chuỗi thư cảnh cáo theo lộ trình');
    assert(domain.CANH_BAO_NGAY === 5, 'Cảnh báo 5 ngày');
  });

  check('PR-J · J2 Bảng ô bắt buộc theo loại biện pháp đúng mục 5.4 (B13)', () => {
    const need = (k: string, f: Partial<{ performedOn: string | null; content: string; attachments: number; customName: string }> = {}) =>
      domain.measureMissing(k as any, { performedOn: '2026-09-10', content: 'nội dung', attachments: 0, customName: '', ...f });
    for (const k of ['talk_short', 'meeting_student', 'family_report', 'meeting_cx']) {
      assert(need(k) === null, `${k} chỉ cần ngày và nội dung, thiếu gì: ${need(k)}`);
    }
    for (const k of ['warning_1', 'warning_2', 'warning_3']) {
      assert(need(k) === 'Cần đính kèm tệp hoặc liên kết thư cảnh cáo', `${k} thiếu tệp phải nói: ${need(k)}`);
      assert(need(k, { attachments: 1 }) === null, `${k} có tệp thì đủ`);
    }
    assert(/tệp hoặc liên kết/.test(need('suspension') ?? ''), 'Đình chỉ học bắt buộc tệp hoặc liên kết');
    assert(need('suspension', { attachments: 2 }) === null, 'Đình chỉ có tệp thì đủ');
    assert(need('other') === 'Cần ghi tên biện pháp', 'Loại Khác phải có tên');
    assert(need('other', { customName: 'Gặp riêng cả nhà' }) === null, 'Loại Khác có tên thì đủ');
    assert(need('talk_short', { performedOn: null }) === 'Cần chọn ngày thực hiện', `Thiếu ngày: ${need('talk_short', { performedOn: null })}`);
    assert(need('talk_short', { content: '  ' }) === 'Cần ghi nội dung hoặc ghi chú', `Thiếu nội dung: ${need('talk_short', { content: '  ' })}`);
    assert(domain.MEASURE_REQUIRED_FIELDS.meeting_cx.participants === 'optional', 'CX/GĐCN meeting có ô người tham gia tùy chọn');
    assert(domain.MEASURE_REQUIRED_FIELDS.talk_short.attachment === 'optional', 'Trao đổi ngắn: tệp tùy chọn');
  });

  check('PR-J · J2 Chuỗi Thư cảnh cáo: lần 2 cần lần 1, lần 3 cần lần 2, các loại khác không cần gì (B05/B06)', () => {
    assert(JSON.stringify(domain.WARNING_CHAIN) === JSON.stringify(['warning_1', 'warning_2', 'warning_3']), 'Chuỗi ba thư');
    assert(domain.warningPrerequisite('warning_1') === null, 'Lần 1 không cần gì');
    assert(domain.warningPrerequisite('warning_2') === 'warning_1', 'Lần 2 cần lần 1');
    assert(domain.warningPrerequisite('warning_3') === 'warning_2', 'Lần 3 cần lần 2');
    for (const k of ['talk_short', 'meeting_student', 'family_report', 'meeting_cx', 'suspension', 'other']) {
      assert(domain.warningPrerequisite(k as any) === null, `${k} đi thẳng được — không có thứ tự bắt buộc (B05)`);
    }
    const notify = domain.MEASURE_KINDS.filter((k) => domain.measureNotifiesManager(k));
    assert(notify.join() === 'warning_1,warning_2,suspension,warning_3', `Chỉ ba thư cảnh cáo và đình chỉ học báo Quản lý (Y01), thực tế: ${notify.join()}`);
  });

  check('PR-J · W01 Câu cảnh báo 5 ngày đúng chữ của nguồn; bật khi cũ nhất QUÁ 5 ngày (không phải bằng 5)', () => {
    const today = '2026-09-21';
    const w = (dates: string[]) => domain.violationWarning(dates, today);
    assert(w([]).active === false && w([]).count === 0, 'Không có vi phạm chưa xử lý thì không cảnh báo');
    assert(w(['2026-09-16']).active === false, 'Đúng 5 ngày: chưa quá 5 ngày');
    const six = w(['2026-09-15', '2026-09-20', '2026-09-21', '2026-09-17']);
    assert(six.active && six.count === 4 && six.oldestAgeDays === 6 && six.oldestOn === '2026-09-15', `Sai: ${JSON.stringify(six)}`);
    assert(six.message === '⚠ 4 vi phạm chưa được xử lý — vi phạm cũ nhất: 6 ngày trước', `Câu cảnh báo sai: ${six.message}`);
    assert(domain.violationAgeLabel(9) === '⚠9n' && domain.violationAgeLabel(2) === '', 'W06: tuổi ⚠9n cạnh từng vi phạm quá 5 ngày');
  });
  console.log('\nPR-J · 2. Bốn bảng mới (J1)');

  const colsOf = (table: string) => (t.conn.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name as string);
  const indexesOf = (table: string) => (t.conn.prepare(`PRAGMA index_list(${table})`).all() as any[]).map((i) => i.name as string);

  check('PR-J · J1 Bảng violations đúng cột của đặc tả §4.1 — và KHÔNG có severity · status · due_date · episode_no · urgency', () => {
    const cols = colsOf('violations');
    const want = ['id', 'student_id', 'cycle_id', 'class_id', 'category', 'skill', 'occurred_on', 'reported_on', 'reported_by', 'description',
      'valid', 'invalid_reason', 'invalidated_by', 'invalidated_at', 'idempotency_key', 'created_at', 'updated_at'];
    assert(JSON.stringify(cols) === JSON.stringify(want), `Cột violations sai: ${cols.join(', ')}`);
    for (const banned of ['severity', 'status', 'due_date', 'episode_no', 'urgency']) {
      assert(!cols.includes(banned), `violations không được có cột ${banned} (quyết định của đặc tả §4.1, không phải thiếu sót)`);
    }
    for (const ix of ['idx_violation_student', 'idx_violation_class', 'idx_violation_valid']) {
      assert(indexesOf('violations').includes(ix), `Thiếu chỉ mục ${ix}`);
    }
  });

  check('PR-J · J1 Bảng discipline_measures đúng cột §4.2 — hai trạng thái, không có cột duyệt', () => {
    const cols = colsOf('discipline_measures');
    const want = ['id', 'student_id', 'cycle_id', 'class_id', 'kind', 'custom_name', 'status', 'owner_user_id', 'note', 'performed_on',
      'performed_by', 'performer_name', 'participants', 'confirmed_by', 'confirmed_at', 'violation_count_at_confirm', 'idempotency_key',
      'created_at', 'created_by', 'updated_at'];
    assert(JSON.stringify(cols) === JSON.stringify(want), `Cột discipline_measures sai: ${cols.join(', ')}`);
    assert(!cols.some((c) => /approv|pending/.test(c)), 'Y01: không có cột duyệt');
    for (const ix of ['idx_measure_student', 'idx_measure_class', 'idx_measure_preparing']) {
      assert(indexesOf('discipline_measures').includes(ix), `Thiếu chỉ mục ${ix}`);
    }
  });

  check('PR-J · J1 measure_violations là bảng nối NHIỀU–NHIỀU: khoá chính (biện pháp, vi phạm), không nhét khoá ngoại vào bảng nào khác', () => {
    const cols = colsOf('measure_violations');
    assert(JSON.stringify(cols) === JSON.stringify(['measure_id', 'violation_id', 'added_by', 'added_at']), `Cột sai: ${cols.join(', ')}`);
    const pk = (t.conn.prepare('PRAGMA table_info(measure_violations)').all() as any[]).filter((c) => c.pk > 0).map((c) => c.name);
    assert(pk.join() === 'measure_id,violation_id', `Khoá chính sai: ${pk.join()}`);
    assert(indexesOf('measure_violations').includes('idx_mv_violation'), 'Thiếu chỉ mục theo vi phạm');
    assert(!colsOf('violations').includes('measure_id') && !colsOf('discipline_measures').includes('violation_id'),
      'Một vi phạm gắn nhiều biện pháp, một biện pháp chứa nhiều vi phạm: không có khoá ngoại ở hai bảng chính');
  });

  check('PR-J · J1 violation_history đúng cột §4.4', () => {
    const cols = colsOf('violation_history');
    assert(JSON.stringify(cols) === JSON.stringify(['id', 'violation_id', 'field', 'old_value', 'new_value', 'reason', 'actor_user_id', 'created_at']),
      `Cột sai: ${cols.join(', ')}`);
    assert(indexesOf('violation_history').includes('idx_vh_violation'), 'Thiếu chỉ mục');
  });

  // ================================================================== dữ liệu và tài khoản dùng chung cho các phép kiểm dưới

  const { assertThrows, conn, P, TODAY, addDays } = t;
  const intake = await import('../classes/intake.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const viol = await import('../yThuc/violations.ts');

  const CLASS = t.classId('MB-FT 101');
  const one = (sql: string, ...args: unknown[]) => (conn.prepare(sql).get(...args) as any)?.n as number;
  /** Học viên mới, riêng cho từng phép kiểm, để số đếm của phép này không lẫn với phép khác. */
  const makeStudent = (name: string, classId = CLASS): { id: number; cycleId: number } => {
    intake.commitIntake(P.admin, { classId, rows: [{ fullName: `PJ ${name}`, target: 7 }], dateFormat: 'iso', idempotencyKey: `pj-${name}` });
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(`PJ ${name}`) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    assert(st && cy, `Không dựng được học viên thử "${name}"`);
    return { id: st.id, cycleId: cy.id };
  };
  /** Giáo viên KHÔNG có phân công nào ở lớp thử — kiểm "ngoài phạm vi". */
  const outsider = loadPrincipal((conn.prepare(
    `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND ur.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active')
      ORDER BY ur.user_id LIMIT 1`).get(CLASS) as any).id);
  const gvbm = P.w1Teacher;       // dạy Writing 1 ở lớp thử, không chủ nhiệm
  const gvbm2 = P.w2Teacher;      // đồng nghiệp: dạy Writing 2
  const gvcn = P.coreTeacher;     // chủ nhiệm lớp thử
  const record = (who: Principal, studentId: number, extra: Record<string, unknown> = {}) =>
    viol.recordViolation(who, { studentId, category: 'homework', description: 'Không nộp bài Writing Task 2 buổi này', ...extra } as any) as any;
  const vid = (r: any) => r.violation.id as number;

  console.log('\nPR-J · 3. Ghi vi phạm (V01–V08)');

  check('PR-J · V01 Mọi giáo viên dạy lớp ghi được vi phạm cho học viên của lớp — không cần em có SOS; ngoài lớp thì không', () => {
    const st = makeStudent('V01');
    assert(!one('SELECT COUNT(*) n FROM case_signals WHERE student_id = ?', st.id) && !one('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?', st.id),
      'Học viên thử phải chưa có SOS hay case nào');
    for (const [name, who] of [['GVBM', gvbm], ['GVBM khác', gvbm2], ['GVCN', gvcn], ['Quản lý MB', P.mbManager], ['Quản trị', P.admin]] as const) {
      const r = record(who, st.id, { description: `${name} ghi một vi phạm hợp lệ` });
      assert(r.violation.id > 0 && r.violation.studentId === st.id && r.violation.reportedBy === who.userId, `${name} không ghi được vi phạm`);
    }
    assertThrows(() => record(outsider, st.id), /phạm vi|quyền/, 'Giáo viên không dạy lớp này ghi được vi phạm');
    assertThrows(() => record(P.cpManager, st.id), /phạm vi|quyền/, 'Quản lý chi nhánh khác ghi được vi phạm');
    assertThrows(() => record(gvbm, 999999), /Không tìm thấy/, 'Ghi cho học viên không tồn tại');
    /* Học viên đã rời lớp thì không còn "học viên của lớp". */
    const gone = makeStudent('V01 đã nghỉ');
    conn.prepare("UPDATE enrollments SET status = 'completed' WHERE student_id = ?").run(gone.id);
    assertThrows(() => record(gvbm, gone.id), /chưa xếp lớp|đang học/, 'Ghi vi phạm cho em không còn học ở lớp nào');
  });

  check('PR-J · V02 Bắt buộc học viên · nhóm · mô tả từ 10 ký tự; môn và tệp là tùy chọn', () => {
    const st = makeStudent('V02');
    assertThrows(() => record(gvbm, st.id, { category: undefined }), /nhóm/i, 'Thiếu nhóm');
    assertThrows(() => record(gvbm, st.id, { category: 'participation' }), /nhóm/i, 'Nhóm Tham gia trên lớp đã bỏ (Y04)');
    assertThrows(() => record(gvbm, st.id, { category: 'severe' }), /nhóm/i, 'Nhóm lạ');
    assertThrows(() => record(gvbm, st.id, { description: 'ngắn quá' }), /10 ký tự/, 'Mô tả 8 ký tự');
    assertThrows(() => record(gvbm, st.id, { description: '         x         ' }), /10 ký tự/, 'Mô tả toàn khoảng trắng');
    const exact = record(gvbm, st.id, { description: '1234567890' });
    assert(exact.violation.description === '1234567890', 'Đúng 10 ký tự phải được nhận');
    for (const c of ['attendance', 'homework', 'conduct', 'classroom']) {
      assert(record(gvbm, st.id, { category: c, description: `Vi phạm nhóm ${c} hợp lệ`, occurredOn: addDays(TODAY, -3) }).violation.category === c, `Nhóm ${c} không nhận`);
    }
    assertThrows(() => record(gvbm, st.id, { skill: 'kungfu' }), /môn/i, 'Môn lạ');
  });

  check('PR-J · V03 Ngày xảy ra mặc định hôm nay, cho chọn ngày quá khứ, KHÔNG cho ngày tương lai; ngày ghi nhận là ngày hệ thống', () => {
    const st = makeStudent('V03');
    const today = record(gvbm, st.id).violation;
    assert(today.occurredOn === TODAY && today.reportedOn === TODAY, `Mặc định phải là hôm nay: ${today.occurredOn}/${today.reportedOn}`);
    const past = record(gvbm, st.id, { occurredOn: addDays(TODAY, -4), description: 'GV nhớ ra vi phạm từ mấy hôm trước' }).violation;
    assert(past.occurredOn === addDays(TODAY, -4) && past.reportedOn === TODAY, 'Ngày xảy ra ≠ ngày ghi nhận (GV nhớ ra muộn)');
    assertThrows(() => record(gvbm, st.id, { occurredOn: addDays(TODAY, 1) }), /tương lai/, 'Ngày mai');
    assertThrows(() => record(gvbm, st.id, { occurredOn: '2026-13-45' }), /Ngày xảy ra/, 'Ngày không hợp lệ');
  });

  check('PR-J · V04 Môn tự điền theo phân công của GV ở lớp đó; dạy nhiều môn thì để trống; bỏ trống rõ ràng thì giữ trống; sửa được', () => {
    const st = makeStudent('V04');
    assert(record(gvbm, st.id).violation.skill === 'writing1', 'GV chỉ dạy Writing 1 → tự điền writing1');
    assert(record(gvbm, st.id, { skill: 'speaking' }).violation.skill === 'speaking', 'GV sửa sang môn khác được');
    assert(record(gvbm, st.id, { skill: null }).violation.skill === null, 'GV chủ động bỏ trống thì phải trống');
    assert(record(P.mbManager, st.id).violation.skill === null, 'Quản lý không dạy môn nào → để trống');
    /* GV dạy hai môn ở lớp này: hệ thống không đoán. */
    const extra = Number(conn.prepare(
      `INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at)
       VALUES (?, ?, 'speaking', 0, 'active', '2026-01-01', ?)`).run(CLASS, gvbm.userId, new Date().toISOString()).lastInsertRowid);
    try {
      const two = loadPrincipal(gvbm.userId);
      assert(record(two, st.id).violation.skill === null, 'GV dạy hai môn ở lớp này → để trống cho GV chọn');
    } finally { conn.prepare('DELETE FROM teacher_assignments WHERE id = ?').run(extra); }
  });

  check('PR-J · V05 Nhóm `Khác` thì mô tả phải từ 30 ký tự; nhóm khác thì 10 là đủ', () => {
    const st = makeStudent('V05');
    assertThrows(() => record(gvbm, st.id, { category: 'other', description: 'Em có chuyện gì đó lạ lắm.' }), /30 ký tự/, 'Khác với 26 ký tự');
    const ok = record(gvbm, st.id, { category: 'other', description: 'Em mang điện thoại vào phòng thi thử và sử dụng.' });
    assert(ok.violation.category === 'other', 'Khác với ≥ 30 ký tự phải được nhận');
    assert(record(gvbm, st.id, { category: 'attendance', description: 'Đi muộn 20 phút' }).violation.id > 0, 'Nhóm thường: 10 ký tự là đủ');
  });

  check('PR-J · V06 Cảnh báo trùng MỀM: cùng học viên · nhóm · ngày → trả bản đang có, KHÔNG chặn, KHÔNG tự gộp', () => {
    const st = makeStudent('V06');
    const first = record(gvcn, st.id, { category: 'homework', description: 'Không nộp bài về nhà lần đầu' });
    assert(first.similar.length === 0, 'Vi phạm đầu tiên thì không có gì trùng');
    const probe = viol.similarViolations(gvbm, { studentId: st.id, category: 'homework', occurredOn: TODAY }) as any[];
    assert(probe.length === 1 && probe[0].id === vid(first) && probe[0].reportedByName, `Phải trả về đúng bản ghi đang có kèm tên GV ghi: ${JSON.stringify(probe)}`);
    const second = record(gvbm, st.id, { category: 'homework', description: 'Không nộp bài về nhà — GV khác cũng thấy' });
    assert(second.violation.id !== vid(first), 'Cảnh báo mềm KHÔNG được chặn: vẫn phải tạo dòng thứ hai');
    assert(second.similar.length === 1 && second.similar[0].id === vid(first), 'Kết quả ghi phải kèm bản trùng để form hiện "Xem vi phạm đó"');
    assert(one('SELECT COUNT(*) n FROM violations WHERE student_id = ?', st.id) === 2, 'Không tự gộp, không tự xoá');
    assert((viol.similarViolations(gvbm, { studentId: st.id, category: 'conduct', occurredOn: TODAY }) as any[]).length === 0, 'Khác nhóm thì không trùng');
    assert((viol.similarViolations(gvbm, { studentId: st.id, category: 'homework', occurredOn: addDays(TODAY, -1) }) as any[]).length === 0, 'Khác ngày thì không trùng');
    viol.invalidateViolation(P.mbManager, vid(first), 'Em đã nộp, tôi bỏ sót');
    viol.invalidateViolation(P.mbManager, vid(second), 'Ghi nhầm em');
    assert((viol.similarViolations(gvbm, { studentId: st.id, category: 'homework', occurredOn: TODAY }) as any[]).length === 0, 'Vi phạm đã hết hiệu lực không tính là trùng');
  });

  check('PR-J · V07 Gửi lại cùng một request (idempotency_key) không tạo dòng thứ hai', () => {
    const st = makeStudent('V07');
    const a = record(gvbm, st.id, { idempotencyKey: 'pj-v07-key' });
    const b = record(gvbm, st.id, { idempotencyKey: 'pj-v07-key' });
    assert(vid(a) === vid(b), 'Cùng khoá phải trả về cùng vi phạm');
    assert(one('SELECT COUNT(*) n FROM violations WHERE student_id = ?', st.id) === 1, 'Chỉ một dòng');
    assert(one("SELECT COUNT(*) n FROM audit_logs WHERE action = 'violation.record' AND entity_id = ?", vid(a)) === 1, 'Thử lại không ghi audit thêm');
  });

  check('PR-J · V08 Ghi vi phạm KHÔNG sinh biện pháp, case, tín hiệu, việc hay thông báo — và không đặt hạn nào', () => {
    const st = makeStudent('V08');
    const count = () => ['discipline_measures', 'measure_violations', 'sos_cases', 'case_signals', 'tasks', 'notifications', 'case_interventions']
      .map((tb) => `${tb}=${one(`SELECT COUNT(*) n FROM ${tb}`)}`).join(' ');
    const before = count();
    record(gvbm, st.id, { occurredOn: addDays(TODAY, -8), description: 'Vi phạm cũ hơn năm ngày, vẫn không sinh gì' });
    record(gvbm, st.id, { category: 'attendance', description: 'Nghỉ không phép ba buổi liên tiếp' });
    assert(count() === before, `Ghi vi phạm đã sinh dữ liệu ở nơi khác:\n  trước: ${before}\n  sau:   ${count()}`);
  });

  console.log('\nPR-J · 4. Sửa và đánh dấu không chính xác (V09–V14)');

  check('PR-J · V09 Sửa mô tả · nhóm · môn · ngày xảy ra; mỗi trường đổi ghi MỘT dòng lịch sử (cũ → mới); giữ luật V02–V05', () => {
    const st = makeStudent('V09');
    const v = vid(record(gvbm, st.id, { description: 'Mô tả ban đầu của vi phạm' }));
    viol.editViolation(gvbm, v, { description: 'Mô tả đã sửa cho rõ hơn', category: 'attendance', skill: 'reading', occurredOn: addDays(TODAY, -2) });
    const row = conn.prepare('SELECT * FROM violations WHERE id = ?').get(v) as any;
    assert(row.description === 'Mô tả đã sửa cho rõ hơn' && row.category === 'attendance' && row.skill === 'reading' && row.occurred_on === addDays(TODAY, -2), 'Giá trị mới chưa lưu');
    const hist = conn.prepare('SELECT field, old_value, new_value FROM violation_history WHERE violation_id = ? ORDER BY id').all(v) as any[];
    const by = Object.fromEntries(hist.map((h) => [h.field, h]));
    assert(hist.length === 4 && by.description.old_value === 'Mô tả ban đầu của vi phạm' && by.description.new_value === 'Mô tả đã sửa cho rõ hơn'
      && by.category.old_value === 'homework' && by.category.new_value === 'attendance'
      && by.skill.old_value === 'writing1' && by.skill.new_value === 'reading' && by.occurred_on.new_value === addDays(TODAY, -2),
      `Lịch sử sai: ${JSON.stringify(hist)}`);
    viol.editViolation(gvbm, v, { description: 'Mô tả đã sửa cho rõ hơn' });
    assert(one('SELECT COUNT(*) n FROM violation_history WHERE violation_id = ?', v) === 4, 'Không đổi gì thì không ghi lịch sử');
    assertThrows(() => viol.editViolation(gvbm, v, { description: 'ngắn' }), /10 ký tự/, 'Sửa xuống dưới 10 ký tự');
    assertThrows(() => viol.editViolation(gvbm, v, { category: 'other' }), /30 ký tự/, 'Đổi sang Khác mà mô tả dưới 30 ký tự');
    assertThrows(() => viol.editViolation(gvbm, v, { occurredOn: addDays(TODAY, 3) }), /tương lai/, 'Đổi sang ngày tương lai');
    assertThrows(() => viol.editViolation(gvbm, v, { occurredOn: '2026-99-99' }), /Ngày xảy ra/, 'Đổi sang ngày sai định dạng');
    const again = viol.editViolation(gvbm, v, { description: 'Mô tả sửa lần ba, vẫn hợp lệ' }) as any;
    assert(again.id === v && again.description === 'Mô tả sửa lần ba, vẫn hợp lệ', 'Sửa phải trả về bản ghi mới');
  });

  check('PR-J · V10 Ai sửa hoặc hủy được: người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi — GV khác không sửa được vi phạm đồng nghiệp', () => {
    const st = makeStudent('V10');
    const v = vid(record(gvbm, st.id, { description: 'Vi phạm do GV Writing 1 ghi' }));
    assertThrows(() => viol.editViolation(gvbm2, v, { description: 'GV Writing 2 sửa hộ đồng nghiệp' }), /không có quyền|người ghi|chủ nhiệm/, 'Đồng nghiệp sửa được vi phạm của người khác');
    assertThrows(() => viol.invalidateViolation(gvbm2, v, 'Không thích'), /không có quyền|người ghi|chủ nhiệm/, 'Đồng nghiệp hủy được vi phạm của người khác');
    assertThrows(() => viol.editViolation(outsider, v, { description: 'Người ngoài lớp sửa' }), /phạm vi|quyền/, 'Giáo viên ngoài lớp sửa được');
    assertThrows(() => viol.editViolation(P.cpManager, v, { description: 'Quản lý chi nhánh khác sửa' }), /phạm vi|quyền/, 'Quản lý chi nhánh khác sửa được');
    viol.editViolation(gvbm, v, { description: 'Người ghi tự sửa lỗi của chính mình' });
    viol.editViolation(gvcn, v, { description: 'GVCN của lớp sửa vi phạm của GVBM' });
    viol.editViolation(P.mbManager, v, { description: 'Quản lý trong phạm vi sửa vi phạm' });
    viol.editViolation(P.admin, v, { description: 'Quản trị hệ thống sửa vi phạm' });
    const other = vid(record(gvbm2, st.id, { description: 'Vi phạm do GV Writing 2 ghi' }));
    viol.invalidateViolation(gvcn, other, 'GVCN xác minh: ghi nhầm em');
    const mine = vid(record(gvbm, st.id, { description: 'Vi phạm của mình ghi nhầm em', category: 'conduct' }));
    viol.invalidateViolation(gvbm, mine, 'Tôi ghi nhầm — đây là em khác');
    assert(one('SELECT COUNT(*) n FROM violations WHERE id IN (?, ?) AND valid = 0', other, mine) === 2, 'Cả hai phải đã bị đánh dấu không chính xác');
  });

  check('PR-J · V11 `Đánh dấu không chính xác` BẮT BUỘC có lý do, ghi người/ngày/lịch sử, KHÔNG xóa vật lý bao giờ', () => {
    const st = makeStudent('V11');
    const v = vid(record(gvbm, st.id, { description: 'Không nộp bài, nhưng em đã nộp' }));
    assertThrows(() => viol.invalidateViolation(gvbm, v, ''), /lý do/, 'Không lý do');
    assertThrows(() => viol.invalidateViolation(gvbm, v, '   '), /lý do/, 'Lý do toàn khoảng trắng');
    assert(one('SELECT valid n FROM violations WHERE id = ?', v) === 1, 'Bị từ chối thì vi phạm phải còn hiệu lực');
    viol.invalidateViolation(gvbm, v, 'Em đã nộp, tôi bỏ sót');
    const row = conn.prepare('SELECT * FROM violations WHERE id = ?').get(v) as any;
    assert(row && row.valid === 0 && row.invalid_reason === 'Em đã nộp, tôi bỏ sót' && row.invalidated_by === gvbm.userId && String(row.invalidated_at).startsWith(TODAY.slice(0, 4)),
      `Dữ liệu hủy sai: ${JSON.stringify(row)}`);
    const h = conn.prepare("SELECT * FROM violation_history WHERE violation_id = ? AND field = 'valid'").all(v) as any[];
    assert(h.length === 1 && h[0].old_value === '1' && h[0].new_value === '0' && h[0].reason === 'Em đã nộp, tôi bỏ sót' && h[0].actor_user_id === gvbm.userId,
      `Lịch sử hủy sai: ${JSON.stringify(h)}`);
    assertThrows(() => viol.invalidateViolation(gvbm, v, 'Hủy lần hai'), /đã không còn hiệu lực/, 'Hủy hai lần');
    assertThrows(() => viol.editViolation(gvbm, v, { description: 'Sửa vi phạm đã hủy rồi' }), /không còn hiệu lực/, 'Sửa vi phạm đã hủy');
    assert(!(viol as any).deleteViolation, 'Không có đường xóa vi phạm');
    assert(one("SELECT COUNT(*) n FROM audit_logs WHERE action = 'violation.invalidate' AND entity_id = ?", v) === 1, 'Hủy phải có audit');
  });

  check('PR-J · V14 Vi phạm hết hiệu lực VẪN hiện trong lịch sử của học viên: gạch ngang, kèm lý do, đúng trạng thái `Không còn hiệu lực`', () => {
    const st = makeStudent('V14');
    const good = vid(record(gvbm, st.id, { description: 'Vi phạm còn hiệu lực', occurredOn: addDays(TODAY, -2) }));
    const bad = vid(record(gvbm, st.id, { description: 'Vi phạm sẽ bị hủy sau đó', occurredOn: addDays(TODAY, -1) }));
    viol.invalidateViolation(gvcn, bad, 'Em đã nộp, tôi bỏ sót');
    const list = (viol.listViolations(gvcn, { studentId: st.id }) as any).rows as any[];
    assert(list.length === 2, `Lịch sử phải giữ cả hai dòng, có ${list.length}`);
    const g = list.find((r) => r.id === good), b = list.find((r) => r.id === bad);
    assert(g.state === 'unhandled' && g.stateLabel === 'Chưa xử lý', `Trạng thái dòng còn hiệu lực: ${g.state}`);
    assert(b.state === 'invalid' && b.stateLabel === 'Không còn hiệu lực' && b.invalidReason === 'Em đã nộp, tôi bỏ sót' && b.valid === false && b.invalidatedByName,
      `Dòng đã hủy phải mang lý do và người hủy: ${JSON.stringify(b)}`);
    const detail = viol.violationDetail(gvbm, bad) as any;
    assert(detail.history.some((h: any) => h.field === 'valid' && h.reason === 'Em đã nộp, tôi bỏ sót'), 'Chi tiết phải có dòng lịch sử hủy');
    assertThrows(() => viol.listViolations(outsider, { studentId: st.id }), /phạm vi|quyền/, 'Người ngoài lớp xem được lịch sử');
  });

  // ================================================================== Biện pháp xử lý (B01–B16)

  const meas = await import('../yThuc/measures.ts');
  const attachmentsSvc = await import('../platform/attachments.ts');
  const cyclesSvc = await import('../fasttrack/cycles.ts');

  /** Ghi `n` vi phạm cho một học viên (khác ngày để không trùng), trả về danh sách id. */
  const violations = (studentId: number, n: number, extra: Record<string, unknown> = {}): number[] =>
    Array.from({ length: n }, (_, i) => vid(record(gvbm, studentId, {
      occurredOn: addDays(TODAY, -(i + 1)), description: `Vi phạm thứ ${i + 1} dùng cho phép kiểm biện pháp`, ...extra,
    })));
  const mk = (who: Principal, studentId: number, kind: string, ids: number[], extra: Record<string, unknown> = {}) =>
    meas.createMeasure(who, { studentId, kind, violationIds: ids, ...extra } as any) as any;
  const link = (who: Principal, measureId: number, name = 'Thư cảnh cáo đã ký') =>
    attachmentsSvc.addLink(who, { ownerType: 'discipline_measure', ownerId: measureId, url: 'https://example.com/thu-canh-cao', displayName: name });
  const confirm = (who: Principal, measureId: number, extra: Record<string, unknown> = {}) =>
    meas.confirmMeasure(who, measureId, { performedOn: addDays(TODAY, -1), performerName: 'Cô Thu (GVCN)', note: 'Đã gọi điện và gửi thư cho gia đình', ...extra } as any) as any;
  const stateOf = (v: number) => (viol.loadViolation(v) as any).state as string;

  console.log('\nPR-J · 5. Tạo và sửa biện pháp (B01–B05, B09–B12)');

  check('PR-J · B01 Chỉ GVCN của lớp và Quản lý trong phạm vi tạo được biện pháp — GVBM đọc được nhưng KHÔNG tạo (máy chủ từ chối, không chỉ ẩn nút)', () => {
    const st = makeStudent('B01');
    const ids = violations(st.id, 2);
    for (const [name, who] of [['GVBM', gvbm], ['GVBM khác', gvbm2], ['GV ngoài lớp', outsider], ['Quản lý CP', P.cpManager]] as const) {
      assertThrows(() => mk(who, st.id, 'talk_short', ids), /quyền|chủ nhiệm|phạm vi/, `${name} tạo được biện pháp`);
    }
    for (const [name, who] of [['GVCN', gvcn], ['Quản lý MB', P.mbManager], ['Quản trị', P.admin]] as const) {
      const m = mk(who, st.id, 'talk_short', ids, { idempotencyKey: `pj-b01-${name}` });
      assert(m.id > 0 && m.status === 'preparing' && m.createdBy === who.userId, `${name} không tạo được biện pháp`);
    }
    const m = mk(gvcn, st.id, 'talk_short', ids);
    assert(meas.measureDetail(gvbm, m.id).id === m.id, 'GVBM dạy lớp phải ĐỌC được biện pháp');
    assertThrows(() => meas.measureDetail(outsider, m.id), /phạm vi|quyền/, 'Giáo viên ngoài lớp đọc được biện pháp');
    assertThrows(() => meas.updateMeasure(gvbm, m.id, { note: 'GVBM sửa ghi chú' }), /quyền|chủ nhiệm/, 'GVBM sửa được biện pháp');
    assertThrows(() => meas.deleteMeasure(gvbm, m.id), /quyền|chủ nhiệm/, 'GVBM xóa được biện pháp');
    assertThrows(() => meas.confirmMeasure(gvbm, m.id, { performedOn: TODAY, performerName: 'x', note: 'nội dung' } as any), /quyền|chủ nhiệm/, 'GVBM xác nhận được biện pháp');
    assertThrows(() => meas.addViolations(gvbm, m.id, violations(st.id, 1)), /quyền|chủ nhiệm/, 'GVBM thêm vi phạm vào biện pháp');
  });

  check('PR-J · B02 Một biện pháp có ÍT NHẤT MỘT vi phạm và của ĐÚNG MỘT học viên; vi phạm đã hủy không gom được', () => {
    const a = makeStudent('B02 A'), b = makeStudent('B02 B');
    const va = violations(a.id, 2), vb = violations(b.id, 1);
    assertThrows(() => mk(gvcn, a.id, 'talk_short', []), /ít nhất một vi phạm/, 'Biện pháp không có vi phạm nào');
    assertThrows(() => mk(gvcn, a.id, 'talk_short', [va[0], vb[0]]), /một học viên/, 'Gom vi phạm của hai em');
    assertThrows(() => mk(gvcn, a.id, 'talk_short', [999999]), /Không tìm thấy/, 'Vi phạm không tồn tại');
    viol.invalidateViolation(gvcn, va[1], 'Ghi nhầm em');
    assertThrows(() => mk(gvcn, a.id, 'talk_short', [va[1]]), /không còn hiệu lực/, 'Gom vi phạm đã hủy');
    const m = mk(gvcn, a.id, 'talk_short', [va[0], va[0]]);
    assert(m.violations.length === 1, 'Trùng id trong danh sách thì chỉ tính một');
    const extra = violations(b.id, 1);
    assertThrows(() => meas.addViolations(gvcn, m.id, extra), /một học viên/, 'Thêm vi phạm của em khác vào biện pháp đang chuẩn bị');
  });

  check('PR-J · B03 Vi phạm gom vào một biện pháp KHÔNG cần cùng nhóm, cùng môn, cùng GV ghi, cùng ngày (nguồn mục 22)', () => {
    const st = makeStudent('B03');
    const mixed = [
      vid(record(gvbm, st.id, { category: 'homework', skill: 'writing1', occurredOn: addDays(TODAY, -6), description: 'Thiếu BTVN Writing Task 1 tuần này' })),
      vid(record(gvbm2, st.id, { category: 'homework', skill: 'writing2', occurredOn: addDays(TODAY, -5), description: 'Thiếu BTVN Writing Task 2 tuần này' })),
      vid(record(gvcn, st.id, { category: 'attendance', skill: null, occurredOn: addDays(TODAY, -3), description: 'Đi muộn 20 phút ở buổi Speaking' })),
      vid(record(P.mbManager, st.id, { category: 'conduct', skill: null, occurredOn: addDays(TODAY, -1), description: 'Nói chuyện riêng trong giờ học' })),
    ];
    const m = mk(gvcn, st.id, 'family_report', mixed);
    assert(m.violations.length === 4, 'Bốn vi phạm khác nhóm, khác môn, khác GV, khác ngày phải vào chung một biện pháp');
    assert(new Set(m.violations.map((v: any) => v.category)).size === 3 && new Set(m.violations.map((v: any) => v.reportedBy)).size === 4, 'Dữ liệu thử phải thật sự khác nhau');
  });

  check('PR-J · B04 Một nhóm vi phạm gắn vào NHIỀU biện pháp cùng lúc, và một vi phạm còn nằm trong biện pháp cũ; mở vi phạm thấy CẢ ba', () => {
    const st = makeStudent('B04');
    const six = violations(st.id, 6);
    const oldOne = mk(gvcn, st.id, 'meeting_student', [six[0]]);
    confirm(gvcn, oldOne.id, { performedOn: addDays(TODAY, -9), note: 'Đã gặp em từ tháng trước' });
    const meeting = mk(gvcn, st.id, 'meeting_student', six);
    const report = mk(gvcn, st.id, 'family_report', six);
    const letter = mk(gvcn, st.id, 'warning_1', six);
    assert([meeting, report, letter].every((m) => m.violations.length === 6), 'Cả ba biện pháp phải chứa đủ sáu vi phạm');
    const d = viol.violationDetail(gvcn, six[0]) as any;
    assert(d.measures.length === 4, `Vi phạm đầu phải thấy CẢ bốn biện pháp liên quan (một đã làm từ trước), thấy ${d.measures.length}`);
    assert(d.measures.filter((x: any) => x.status === 'done').length === 1 && d.measures.filter((x: any) => x.status === 'preparing').length === 3, 'Một đã thực hiện, ba đang chuẩn bị');
    assert(stateOf(six[0]) === 'handled' && stateOf(six[1]) === 'preparing', 'Trạng thái suy từ bảng nối: nằm trong biện pháp đã thực hiện → Đã xử lý; chỉ nằm trong biện pháp đang chuẩn bị → Đang chuẩn bị xử lý');
    assert(one('SELECT COUNT(*) n FROM measure_violations WHERE violation_id = ?', six[1]) === 3, 'Bảng nối nhiều–nhiều: một vi phạm, ba dòng nối');
  });

  check('PR-J · B05 Không có thứ tự xử lý bắt buộc: đi thẳng tới biện pháp nặng là hợp lệ', () => {
    const st = makeStudent('B05');
    const ids = violations(st.id, 1);
    assert(mk(gvcn, st.id, 'suspension', ids).kind === 'suspension', 'Đình chỉ học ngay, không cần trao đổi hay meeting trước');
    assert(mk(gvcn, st.id, 'family_report', ids).kind === 'family_report', 'Report gia đình ngay');
    assert(mk(gvcn, st.id, 'meeting_cx', ids).kind === 'meeting_cx', 'CX/GĐCN meeting ngay');
    assert(mk(gvcn, st.id, 'talk_short', ids).kind === 'talk_short', 'Trao đổi ngắn cũng được, sau biện pháp nặng');
    assertThrows(() => mk(gvcn, st.id, 'severe', ids), /loại biện pháp/i, 'Loại lạ');
    assertThrows(() => mk(gvcn, st.id, 'other', ids), /tên biện pháp/i, 'Loại Khác mà không có tên');
    assert(mk(gvcn, st.id, 'other', ids, { customName: 'Họp riêng với ban giám hiệu' }).kindLabel === 'Họp riêng với ban giám hiệu', 'Loại Khác hiện tên do GVCN đặt');
  });

  check('PR-J · B09 Khi Đang chuẩn bị: thêm · bỏ vi phạm, đổi loại, sửa ghi chú, đổi người phụ trách — KHÔNG có hạn nào; bỏ vi phạm để lại lịch sử và vi phạm quay về Chưa xử lý', () => {
    const st = makeStudent('B09');
    const ids = violations(st.id, 4);
    const m = mk(gvcn, st.id, 'family_report', ids.slice(0, 2), { note: 'Ghi chú ban đầu' });
    assert(!('dueDate' in m) && !('due_date' in m) && !Object.keys(m).some((k) => /due|deadline|overdue/i.test(k)), 'Biện pháp không có hạn nào');
    assert(stateOf(ids[0]) === 'preparing' && stateOf(ids[3]) === 'unhandled', 'Trước khi thêm');
    meas.addViolations(gvcn, m.id, [ids[2], ids[3]]);
    assert(meas.measureDetail(gvcn, m.id).violations.length === 4 && stateOf(ids[3]) === 'preparing', 'Thêm vi phạm mới vào biện pháp đang chuẩn bị (10.7): vi phạm rời Chưa xử lý');
    meas.removeViolation(gvcn, m.id, ids[3]);
    assert(meas.measureDetail(gvcn, m.id).violations.length === 3 && stateOf(ids[3]) === 'unhandled', 'Bỏ vi phạm ra: quay về Chưa xử lý');
    const hist = conn.prepare("SELECT old_value, new_value FROM violation_history WHERE violation_id = ? AND field = 'measure' ORDER BY id").all(ids[3]) as any[];
    assert(hist.length === 2 && hist[0].new_value === String(m.id) && hist[1].old_value === String(m.id), `Thêm rồi bỏ phải để lại hai dòng lịch sử: ${JSON.stringify(hist)}`);
    assertThrows(() => meas.removeViolation(gvcn, m.id, ids[3]), /không nằm trong/, 'Bỏ vi phạm không nằm trong biện pháp');
    const mid = meas.updateMeasure(gvcn, m.id, { kind: 'meeting_student', note: 'Đổi ý: gặp em trước', ownerUserId: P.mbManager.userId }) as any;
    assert(mid.kind === 'meeting_student' && mid.note === 'Đổi ý: gặp em trước' && mid.ownerUserId === P.mbManager.userId, 'Đổi loại, ghi chú, người phụ trách');
    meas.removeViolation(gvcn, m.id, ids[1]);
    meas.removeViolation(gvcn, m.id, ids[2]);
    assert(meas.measureDetail(gvcn, m.id).violations.length === 1, 'Còn đúng một vi phạm');
    assertThrows(() => meas.removeViolation(gvcn, m.id, ids[0]), /ít nhất một vi phạm/, 'Bỏ vi phạm cuối cùng thì biện pháp không còn vi phạm nào');
  });

  check('PR-J · B10 Khi Đã thực hiện: KHÓA danh sách vi phạm và loại; vẫn sửa ghi chú và bổ sung tệp (có audit) — đó là bổ sung bằng chứng, không viết lại phạm vi', () => {
    const st = makeStudent('B10');
    const ids = violations(st.id, 3);
    const m = mk(gvcn, st.id, 'family_report', ids);
    const done = confirm(gvcn, m.id);
    assert(done.status === 'done', 'Đã xác nhận');
    const extra = violations(st.id, 1)[0];
    assertThrows(() => meas.addViolations(gvcn, m.id, [extra]), /đã thực hiện|khóa/, 'Thêm vi phạm vào biện pháp đã thực hiện');
    assertThrows(() => meas.removeViolation(gvcn, m.id, ids[0]), /đã thực hiện|khóa|B14/, 'Gỡ vi phạm khỏi biện pháp đã thực hiện phải bị từ chối ở máy chủ');
    assertThrows(() => meas.updateMeasure(gvcn, m.id, { kind: 'talk_short' }), /đã thực hiện|khóa/, 'Đổi loại biện pháp đã thực hiện');
    assert(meas.measureDetail(gvcn, m.id).violations.length === 3, 'Danh sách vi phạm không đổi');
    const noted = meas.updateMeasure(gvcn, m.id, { note: 'Bổ sung: phụ huynh đã xác nhận qua Zalo' }) as any;
    assert(noted.note === 'Bổ sung: phụ huynh đã xác nhận qua Zalo', 'Vẫn sửa được ghi chú');
    assert(one("SELECT COUNT(*) n FROM audit_logs WHERE action = 'measure.note' AND entity_id = ?", m.id) >= 1, 'Sửa ghi chú sau khi đã thực hiện phải có audit');
    assert(link(gvcn, m.id, 'Ảnh chụp tin nhắn').id > 0, 'Vẫn bổ sung được tệp/liên kết');
  });

  check('PR-J · B11 Đổi loại biện pháp khi Đang chuẩn bị phải KIỂM LẠI luật chuỗi Thư cảnh cáo với loại mới', () => {
    const st = makeStudent('B11');
    const ids = violations(st.id, 2);
    const m = mk(gvcn, st.id, 'family_report', ids);
    assertThrows(() => meas.updateMeasure(gvcn, m.id, { kind: 'warning_2' }), /Thư cảnh cáo lần 1/, 'Đổi sang lần 2 khi chưa có lần 1');
    assertThrows(() => meas.updateMeasure(gvcn, m.id, { kind: 'warning_3' }), /Thư cảnh cáo lần 2/, 'Đổi sang lần 3 khi chưa có lần 2');
    assert((meas.updateMeasure(gvcn, m.id, { kind: 'warning_1' }) as any).kind === 'warning_1', 'Đổi sang lần 1 thì được');
    assert((meas.updateMeasure(gvcn, m.id, { kind: 'other', customName: 'Thư nhắc nhở nội bộ' }) as any).kindLabel === 'Thư nhắc nhở nội bộ', 'Đổi sang Khác kèm tên');
    assertThrows(() => meas.updateMeasure(gvcn, m.id, { kind: 'other', customName: '' }), /tên biện pháp/, 'Khác mà xóa tên');
  });

  check('PR-J · B12 Xóa biện pháp: chỉ khi Đang chuẩn bị, do GVCN · Quản lý · Quản trị; vi phạm quay về Chưa xử lý, tệp đi theo, có audit; Đã thực hiện không xóa được', () => {
    const st = makeStudent('B12');
    const ids = violations(st.id, 2);
    const m = mk(gvcn, st.id, 'family_report', ids);
    link(gvcn, m.id, 'Bản nháp Report');
    assert(stateOf(ids[0]) === 'preparing', 'Đang nằm trong biện pháp');
    meas.deleteMeasure(P.mbManager, m.id);
    assert(one('SELECT COUNT(*) n FROM discipline_measures WHERE id = ?', m.id) === 0 && one('SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ?', m.id) === 0, 'Biện pháp và dòng nối phải mất');
    assert(stateOf(ids[0]) === 'unhandled' && stateOf(ids[1]) === 'unhandled', 'Vi phạm quay về Chưa xử lý');
    assert(one("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ?", m.id) === 0, 'Tệp của biện pháp bị xóa đi theo');
    assert(one("SELECT COUNT(*) n FROM audit_logs WHERE action = 'measure.delete' AND entity_id = ?", m.id) === 1, 'Xóa phải có audit');
    assert(one("SELECT COUNT(*) n FROM violation_history WHERE violation_id = ? AND field = 'measure' AND old_value = ?", ids[0], String(m.id)) === 1, 'Vi phạm ghi lại việc rời biện pháp');
    assertThrows(() => meas.deleteMeasure(gvcn, m.id), /Không tìm thấy/, 'Xóa hai lần');
    const m2 = mk(gvcn, st.id, 'talk_short', ids);
    confirm(gvcn, m2.id);
    assertThrows(() => meas.deleteMeasure(P.admin, m2.id), /đã thực hiện/, 'Xóa biện pháp đã thực hiện (kể cả Quản trị)');
    assert(one('SELECT COUNT(*) n FROM discipline_measures WHERE id = ?', m2.id) === 1, 'Biện pháp đã thực hiện còn nguyên');
  });

  console.log('\nPR-J · 6. Chuỗi Thư cảnh cáo (B06–B08, Y02)');

  check('PR-J · B06 Chuỗi Thư cảnh cáo kiểm Ở MÁY CHỦ: lần 2 cần lần 1 ĐÃ THỰC HIỆN, lần 3 cần lần 2 — cả lúc tạo lẫn lúc xác nhận; mở khóa từng bước', () => {
    const st = makeStudent('B06');
    const ids = violations(st.id, 3);
    const avail = (k: string) => (meas.measureKindAvailability(gvcn, st.id) as any[]).find((x) => x.kind === k);
    assert(avail('warning_1').available && !avail('warning_2').available && !avail('warning_3').available, 'Ban đầu: chỉ lần 1 chọn được');
    assert(/Thư cảnh cáo lần 1/.test(avail('warning_2').reason) && /Thư cảnh cáo lần 2/.test(avail('warning_3').reason), `Khóa phải nói lý do ngay tại dòng: ${avail('warning_2').reason} / ${avail('warning_3').reason}`);
    assert(['talk_short', 'meeting_student', 'family_report', 'meeting_cx', 'suspension', 'other'].every((k) => avail(k).available), 'Sáu loại còn lại không bị khóa');
    assertThrows(() => mk(gvcn, st.id, 'warning_2', ids), /Thư cảnh cáo lần 1/, 'Tạo lần 2 khi chưa có lần 1');
    assertThrows(() => mk(gvcn, st.id, 'warning_3', ids), /Thư cảnh cáo lần 2/, 'Tạo lần 3 khi chưa có lần 2');
    assertThrows(() => mk(P.admin, st.id, 'warning_2', ids), /Thư cảnh cáo lần 1/, 'Quản trị cũng không được vượt chuỗi');
    const w1 = mk(gvcn, st.id, 'warning_1', ids);
    assertThrows(() => mk(gvcn, st.id, 'warning_2', ids), /Thư cảnh cáo lần 1/, 'Lần 1 mới ở trạng thái Đang chuẩn bị thì chưa đủ điều kiện cho lần 2');
    link(gvcn, w1.id);
    confirm(gvcn, w1.id);
    assert(avail('warning_2').available && !avail('warning_3').available, 'Lần 1 đã thực hiện: lần 2 mở khóa, lần 3 vẫn khóa');
    const w2 = mk(gvcn, st.id, 'warning_2', ids);
    assertThrows(() => mk(gvcn, st.id, 'warning_3', ids), /Thư cảnh cáo lần 2/, 'Lần 2 mới ở trạng thái Đang chuẩn bị thì chưa đủ điều kiện cho lần 3');
    link(gvcn, w2.id);
    confirm(gvcn, w2.id);
    assert(avail('warning_3').available, 'Lần 2 đã thực hiện: lần 3 mở khóa');
    assert(mk(gvcn, st.id, 'warning_3', ids).kind === 'warning_3', 'Tạo lần 3');
  });

  check('PR-J · B06 Chuỗi kiểm cả lúc XÁC NHẬN: lần 1 bị xóa/đổi trước khi lần 2 xác nhận thì lần 2 không xác nhận được (gọi thẳng máy chủ, không qua nút)', () => {
    const st = makeStudent('B06 xác nhận');
    const ids = violations(st.id, 2);
    const w1 = mk(gvcn, st.id, 'warning_1', ids);
    link(gvcn, w1.id);
    confirm(gvcn, w1.id);
    const w2 = mk(gvcn, st.id, 'warning_2', ids);
    link(gvcn, w2.id);
    /* Cố ý phá điều kiện ở tầng dữ liệu để chứng minh xác nhận tự kiểm lại chứ không tin lúc tạo. */
    conn.prepare("UPDATE discipline_measures SET status = 'preparing' WHERE id = ?").run(w1.id);
    assertThrows(() => confirm(gvcn, w2.id), /Thư cảnh cáo lần 1/, 'Xác nhận lần 2 khi lần 1 không còn ở trạng thái đã thực hiện');
    conn.prepare("UPDATE discipline_measures SET status = 'done' WHERE id = ?").run(w1.id);
    assert(confirm(gvcn, w2.id).status === 'done', 'Điều kiện đủ thì xác nhận được');
  });

  check('PR-J · B07 + Y02 Chuỗi reset khi em sang LỘ TRÌNH MỚI: lần 1 chọn lại được, lần 2 khóa (đặc tả §10 tình huống 18)', () => {
    const st = makeStudent('B07');
    const ids = violations(st.id, 2);
    const w1 = mk(gvcn, st.id, 'warning_1', ids); link(gvcn, w1.id); confirm(gvcn, w1.id);
    const w2 = mk(gvcn, st.id, 'warning_2', ids); link(gvcn, w2.id); confirm(gvcn, w2.id);
    const avail = (k: string) => (meas.measureKindAvailability(gvcn, st.id) as any[]).find((x) => x.kind === k);
    assert(avail('warning_3').available && !avail('warning_1').available, 'Trong lộ trình cũ: lần 1 đã dùng, lần 3 mở');
    cyclesSvc.createCycle(P.admin, { studentId: st.id, route: 'LT2', targetScore: 7.5, startedAt: TODAY });
    assert(avail('warning_1').available, 'Lộ trình mới: lần 1 chọn lại được');
    assert(!avail('warning_2').available && !avail('warning_3').available, 'Lộ trình mới: lần 2 và lần 3 khóa');
    assertThrows(() => mk(gvcn, st.id, 'warning_2', ids), /Thư cảnh cáo lần 1/, 'Lộ trình mới: lần 2 bị máy chủ từ chối');
    const again = mk(gvcn, st.id, 'warning_1', violations(st.id, 1));
    assert(again.kind === 'warning_1' && again.cycleId !== w1.cycleId, 'Lần 1 của lộ trình mới gắn với lộ trình mới');
    assert(one("SELECT COUNT(*) n FROM discipline_measures WHERE student_id = ? AND kind = 'warning_2' AND status = 'done'", st.id) === 1, 'Thư lần 2 của lộ trình cũ còn nguyên trong lịch sử');
  });

  check('PR-J · B08 Cùng một lộ trình chỉ có TỐI ĐA một lần 1, một lần 2, một lần 3 — muốn gửi thư thứ tư thì dùng `Khác` kèm tên', () => {
    const st = makeStudent('B08');
    const ids = violations(st.id, 2);
    const w1 = mk(gvcn, st.id, 'warning_1', ids);
    assertThrows(() => mk(gvcn, st.id, 'warning_1', ids), /Khác/, 'Hai lần 1 khi lần 1 còn đang chuẩn bị');
    link(gvcn, w1.id); confirm(gvcn, w1.id);
    assertThrows(() => mk(gvcn, st.id, 'warning_1', ids), /Khác/, 'Hai lần 1 khi lần 1 đã thực hiện');
    const w2 = mk(gvcn, st.id, 'warning_2', ids); link(gvcn, w2.id); confirm(gvcn, w2.id);
    const w3 = mk(gvcn, st.id, 'warning_3', ids); link(gvcn, w3.id); confirm(gvcn, w3.id);
    assertThrows(() => mk(gvcn, st.id, 'warning_3', ids), /Khác/, 'Thư thứ tư bằng lần 3');
    assert(mk(gvcn, st.id, 'other', ids, { customName: 'Thư cảnh cáo bổ sung lần 4' }).kind === 'other', 'Dùng Khác kèm tên thì được');
    const avail = (meas.measureKindAvailability(gvcn, st.id) as any[]);
    assert(avail.filter((x) => /^warning_/.test(x.kind)).every((x) => !x.available && /Khác|đã có/.test(x.reason)), 'Cả ba thư đều khóa và nói vì sao');
  });

  console.log('\nPR-J · 7. Xác nhận đã thực hiện (B13–B16, Y01, V13)');

  check('PR-J · B13 Xác nhận bắt buộc ngày · người thực hiện · nội dung; tệp hoặc liên kết BẮT BUỘC với ba Thư cảnh cáo và Đình chỉ học; câu thiếu-gì khớp giao diện', () => {
    const st = makeStudent('B13');
    const ids = violations(st.id, 2);
    const talk = mk(gvcn, st.id, 'talk_short', ids);
    assertThrows(() => meas.confirmMeasure(gvcn, talk.id, { performerName: 'Cô Thu', note: 'Gặp em cuối buổi' } as any), /Cần chọn ngày thực hiện/, 'Thiếu ngày');
    assertThrows(() => meas.confirmMeasure(gvcn, talk.id, { performedOn: TODAY, note: 'Gặp em cuối buổi' } as any), /người thực hiện/, 'Thiếu người thực hiện');
    assertThrows(() => meas.confirmMeasure(gvcn, talk.id, { performedOn: TODAY, performerName: 'Cô Thu' } as any), /Cần ghi nội dung hoặc ghi chú/, 'Thiếu nội dung');
    const ok = meas.confirmMeasure(gvcn, talk.id, { performedOn: TODAY, performerName: 'Cô Thu', note: 'Gặp em cuối buổi' } as any) as any;
    assert(ok.status === 'done' && ok.performedOn === TODAY && ok.performerName === 'Cô Thu' && ok.confirmedBy === gvcn.userId && ok.confirmedAt, `Chưa lưu đủ thông tin thực tế: ${JSON.stringify(ok)}`);
    assert(ok.attachmentCount === 0, 'Trao đổi ngắn: không cần tệp (nguồn mục 28)');
    /* Người thực hiện là một tài khoản trong hệ thống. */
    const byUser = mk(gvcn, st.id, 'meeting_student', ids);
    const doneUser = confirm(gvcn, byUser.id, { performerName: undefined, performedBy: gvbm.userId }) as any;
    assert(doneUser.performedBy === gvbm.userId && doneUser.performedByName, 'Người thực hiện là một tài khoản');
    for (const kind of ['warning_1', 'suspension']) {
      const s2 = makeStudent(`B13 ${kind}`);
      const v2 = violations(s2.id, 1);
      const m = mk(gvcn, s2.id, kind, v2);
      assert(/tệp hoặc liên kết/.test(m.evidenceHint ?? ''), `${kind}: biện pháp còn Đang chuẩn bị phải nói TRƯỚC cần tệp gì (đặc tả 7.3 điểm 6): ${m.evidenceHint}`);
      assertThrows(() => confirm(gvcn, m.id), /tệp hoặc liên kết/, `${kind} thiếu tệp mà xác nhận được`);
      link(gvcn, m.id);
      assert(confirm(gvcn, m.id).status === 'done', `${kind} có liên kết thì xác nhận được`);
    }
    const s3 = makeStudent('B13 khác'); const v3 = violations(s3.id, 1);
    assertThrows(() => confirm(gvcn, mk(gvcn, s3.id, 'other', v3, { customName: 'Gặp riêng cả nhà' }).id, { performedOn: '' }), /ngày thực hiện/, 'Loại Khác vẫn cần ngày');
    const cx = mk(gvcn, s3.id, 'meeting_cx', v3);
    assert(confirm(gvcn, cx.id, { participants: 'GĐCN Lan, phụ huynh' }).participants === 'GĐCN Lan, phụ huynh', 'CX/GĐCN meeting lưu người tham gia');
  });

  check('PR-J · B14 Ngày thực hiện cho chọn quá khứ (việc làm rồi mới vào ghi), KHÔNG cho ngày tương lai', () => {
    const st = makeStudent('B14');
    const ids = violations(st.id, 1);
    const m = mk(gvcn, st.id, 'talk_short', ids);
    assertThrows(() => confirm(gvcn, m.id, { performedOn: addDays(TODAY, 1) }), /tương lai/, 'Ngày mai');
    assertThrows(() => confirm(gvcn, m.id, { performedOn: '2026-02-30x' }), /ngày thực hiện/i, 'Ngày sai định dạng');
    assert(confirm(gvcn, m.id, { performedOn: addDays(TODAY, -20) }).performedOn === addDays(TODAY, -20), 'Ngày quá khứ xa vẫn được');
    assertThrows(() => confirm(gvcn, m.id), /đã thực hiện/, 'Xác nhận hai lần');
  });

  check('PR-J · B15 Xác nhận KHÔNG hỏi tiến bộ, không có mức kết quả, không mở vòng theo dõi hành vi — không sinh case, phương án, theo dõi hay việc', () => {
    const st = makeStudent('B15');
    const ids = violations(st.id, 3);
    const m = mk(gvcn, st.id, 'family_report', ids);
    const cols = (conn.prepare('PRAGMA table_info(discipline_measures)').all() as any[]).map((c) => c.name).join(' ');
    assert(!/outcome|progress|improv|result|follow/i.test(cols), `Bảng biện pháp không được có cột kết quả/tiến bộ: ${cols}`);
    const count = () => ['sos_cases', 'case_interventions', 'case_followups', 'case_signals', 'tasks'].map((tb) => `${tb}=${one(`SELECT COUNT(*) n FROM ${tb}`)}`).join(' ');
    const before = count();
    const done = confirm(gvcn, m.id) as any;
    assert(!Object.keys(done).some((k) => /outcome|progress|improv|followUp|result/i.test(k)), `Kết quả trả về không được có ô tiến bộ: ${Object.keys(done).join(',')}`);
    assert(count() === before, `Xác nhận biện pháp đã mở vòng theo dõi:\n  trước: ${before}\n  sau:   ${count()}`);
  });

  check('PR-J · B16 Report gia đình gom 5 vi phạm là MỘT biện pháp; số vi phạm lúc xác nhận là ẢNH CHỤP (5), hủy một vi phạm sau đó KHÔNG đổi số này (V13)', () => {
    const st = makeStudent('B16');
    const five = violations(st.id, 5);
    const m = mk(gvcn, st.id, 'family_report', five);
    assert(m.violationCountAtConfirm === null, 'Chưa xác nhận thì chưa có ảnh chụp');
    const done = confirm(gvcn, m.id);
    assert(one('SELECT COUNT(*) n FROM discipline_measures WHERE student_id = ? AND status = ?', st.id, 'done') === 1, 'Một Report gom 5 vi phạm là MỘT biện pháp');
    assert(done.violationCountAtConfirm === 5 && (conn.prepare('SELECT violation_count_at_confirm v FROM discipline_measures WHERE id = ?').get(m.id) as any).v === 5, 'Ảnh chụp phải là 5');
    viol.invalidateViolation(gvcn, five[2], 'Em đã nộp, tôi bỏ sót');
    assert(stateOf(five[2]) === 'invalid', 'Vi phạm đã bị hủy');
    const after = meas.measureDetail(gvcn, m.id) as any;
    assert(after.violationCountAtConfirm === 5, `Ảnh chụp KHÔNG được đổi khi một vi phạm bị hủy: ${after.violationCountAtConfirm}`);
    assert(after.violations.length === 5 && after.invalidViolationCount === 1, 'Không gỡ khỏi bảng nối (V13): danh sách vẫn 5, trong đó 1 không chính xác');
    assert(after.invalidNote === '1 trong 5 vi phạm của biện pháp này sau đó được xác định là không chính xác.', `Dòng lưu ý V13 sai: ${after.invalidNote}`);
    assert(one("SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ? AND violation_id = ?", m.id, five[2]) === 1, 'Dòng nối còn nguyên');
    assert((meas.measureDetail(gvcn, confirm(gvcn, mk(gvcn, st.id, 'talk_short', [five[0]]).id).id) as any).invalidNote === null, 'Không có vi phạm hủy thì không có dòng lưu ý');
  });

  check('PR-J · B16 Xác nhận không được nếu biện pháp còn chứa vi phạm đã hủy — phải bỏ ra trước, để ảnh chụp đếm đúng những vi phạm thật', () => {
    const st = makeStudent('B16 hủy trước');
    const ids = violations(st.id, 3);
    const m = mk(gvcn, st.id, 'family_report', ids);
    viol.invalidateViolation(gvcn, ids[1], 'Ghi nhầm em');
    assertThrows(() => confirm(gvcn, m.id), /không còn hiệu lực/, 'Xác nhận khi có vi phạm đã hủy');
    meas.removeViolation(gvcn, m.id, ids[1]);
    assert(confirm(gvcn, m.id).violationCountAtConfirm === 2, 'Sau khi bỏ vi phạm đã hủy, ảnh chụp đếm đúng 2');
  });

  check('PR-J · Y01 GVCN tự xác nhận MỌI loại, kể cả nặng — không có bước Quản lý duyệt; Quản lý nhận THÔNG BÁO khi Thư cảnh cáo hoặc Đình chỉ học được xác nhận', () => {
    const st = makeStudent('Y01');
    const ids = violations(st.id, 2);
    const notified = (measureId: number) => (conn.prepare(
      `SELECT user_id FROM notifications WHERE entity_type = 'discipline_measure' AND entity_id = ?`).all(measureId) as any[]).map((r) => r.user_id as number);
    const sus = mk(gvcn, st.id, 'suspension', ids);
    link(gvcn, sus.id, 'Quyết định đình chỉ');
    assert(notified(sus.id).length === 0, 'Chưa xác nhận thì chưa báo ai');
    assert(confirm(gvcn, sus.id).status === 'done', 'GVCN tự xác nhận Đình chỉ học, không cần ai duyệt');
    const to = notified(sus.id);
    assert(to.includes(P.mbManager.userId) && to.includes(P.admin.userId) && !to.includes(gvcn.userId) && !to.includes(P.cpManager.userId),
      `Thông báo phải tới Quản lý MB và Quản trị, không tới người xác nhận và không tới chi nhánh khác: ${to.join()}`);
    const w1 = mk(gvcn, st.id, 'warning_1', ids); link(gvcn, w1.id); confirm(gvcn, w1.id);
    assert(notified(w1.id).includes(P.mbManager.userId), 'Thư cảnh cáo lần 1 cũng báo Quản lý');
    for (const kind of ['talk_short', 'meeting_student', 'family_report', 'meeting_cx']) {
      const m = mk(gvcn, st.id, kind, ids);
      confirm(gvcn, m.id);
      assert(notified(m.id).length === 0, `${kind}: không báo Quản lý`);
    }
    assert(!('approvalState' in (meas.measureDetail(gvcn, sus.id) as any)) && !(conn.prepare('PRAGMA table_info(discipline_measures)').all() as any[]).some((c) => /approv/.test(c.name)), 'Không có trạng thái duyệt');
    /* Quản lý tự xác nhận thì không báo chính mình. */
    const s2 = makeStudent('Y01 QL'); const v2 = violations(s2.id, 1);
    const susQl = mk(P.mbManager, s2.id, 'suspension', v2); link(P.mbManager, susQl.id);
    confirm(P.mbManager, susQl.id);
    assert(!notified(susQl.id).includes(P.mbManager.userId) && notified(susQl.id).includes(P.admin.userId), 'Người xác nhận không tự nhận thông báo');
  });

  check('PR-J · V13 Hủy vi phạm đã nằm trong biện pháp Đã thực hiện: hủy được, biện pháp giữ nguyên; danh sách khóa vẫn khóa; thống kê vi phạm loại nó ra', () => {
    const st = makeStudent('V13');
    const ids = violations(st.id, 2);
    const m = mk(gvcn, st.id, 'family_report', ids);
    confirm(gvcn, m.id);
    viol.invalidateViolation(gvcn, ids[0], 'Em đã nộp, tôi bỏ sót');
    const d = viol.violationDetail(gvcn, ids[0]) as any;
    assert(d.state === 'invalid' && d.measures.length === 1 && d.measures[0].status === 'done', 'Vi phạm đã hủy vẫn thấy biện pháp đã làm với nó');
    assert((meas.measureDetail(gvcn, m.id) as any).status === 'done', 'Biện pháp giữ nguyên trạng thái');
  });

  // ================================================================== Cảnh báo 5 ngày (W01–W06)

  const warn = await import('../yThuc/canhBao.ts');

  /** Một học viên có `n` vi phạm chưa xử lý, cũ nhất cách hôm nay `oldestDays` ngày (các cái còn lại xen kẽ). */
  const withUnhandled = (name: string, ages: number[]): { id: number; ids: number[] } => {
    const st = makeStudent(name);
    const ids = ages.map((age, i) => vid(record(gvbm, st.id, {
      occurredOn: addDays(TODAY, -age), category: i % 2 ? 'attendance' : 'homework', description: `Vi phạm cách đây ${age} ngày, dùng cho cảnh báo`,
    })));
    return { id: st.id, ids };
  };

  /** Lớp riêng cho phép kiểm W05 để số đếm không lẫn với dữ liệu của lớp khác. GVCN của lớp là `outsider` (giáo viên MB không dạy MB-FT 101). */
  const makeClassForWarnings = (code = 'MB-FT PJW05') => {
    const mbId = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id as number;
    const c = intake.createClass(P.admin, { code, branchId: mbId, kind: 'FT', isFastTrack: true, startDate: '2026-08-03' }) as any;
    conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, NULL, 1, 'active', '2026-01-01', ?)`)
      .run(c.id, outsider.userId, new Date().toISOString());
    return { id: c.id as number, gvcn: outsider.userId };
  };
  const withUnhandledIn = (cls: { id: number; gvcn: number }, name: string, ages: number[]): { id: number; ids: number[] } => {
    const st = makeStudent(name, cls.id);
    const who = loadPrincipal(cls.gvcn);
    const ids = ages.map((age, i) => vid(record(who, st.id, {
      occurredOn: addDays(TODAY, -age), category: i % 2 ? 'attendance' : 'homework', description: `Vi phạm cách đây ${age} ngày, dùng cho cảnh báo`,
    })));
    return { id: st.id, ids };
  };

  console.log('\nPR-J · 8. Cảnh báo 5 ngày (W01–W06)');

  check('PR-J · W01 Em có 4 vi phạm chưa xử lý, cũ nhất 9 ngày → câu cảnh báo ĐÚNG số 4 và 9; đúng 5 ngày thì chưa cảnh báo', () => {
    const s = withUnhandled('W01', [9, 7, 6, 1]);
    const w = warn.studentWarning(gvcn, s.id) as any;
    assert(w.active && w.count === 4 && w.oldestAgeDays === 9 && w.oldestOn === addDays(TODAY, -9), `Cảnh báo sai: ${JSON.stringify(w)}`);
    assert(w.message === '⚠ 4 vi phạm chưa được xử lý — vi phạm cũ nhất: 9 ngày trước', `Câu cảnh báo sai: ${w.message}`);
    const five = withUnhandled('W01 đúng năm', [5, 2]);
    assert((warn.studentWarning(gvcn, five.id) as any).active === false, 'Đúng 5 ngày thì chưa cảnh báo (phải QUÁ 5 ngày)');
    const six = withUnhandled('W01 sáu', [6]);
    assert((warn.studentWarning(gvcn, six.id) as any).active === true, '6 ngày thì cảnh báo');
    assert((warn.studentWarning(gvcn, makeStudent('W01 sạch').id) as any).active === false, 'Không có vi phạm nào thì không cảnh báo');
  });

  check('PR-J · W02 Cảnh báo KHÔNG tự tạo case, biện pháp, việc, hạn hay thông báo — chỉ để nhắc, không tính là quá hạn của ai', () => {
    const s = withUnhandled('W02', [12, 9, 8]);
    const count = () => ['sos_cases', 'discipline_measures', 'tasks', 'notifications', 'case_signals'].map((tb) => `${tb}=${one(`SELECT COUNT(*) n FROM ${tb}`)}`).join(' ');
    const before = count();
    for (let i = 0; i < 3; i += 1) { warn.studentWarning(gvcn, s.id); warn.classWarning(gvcn, CLASS); warn.myWarningLines(gvcn); }
    assert(count() === before, `Xem cảnh báo đã sinh dữ liệu:\n  trước: ${before}\n  sau:   ${count()}`);
    const w = warn.studentWarning(gvcn, s.id) as any;
    assert(!Object.keys(w).some((k) => /due|deadline|overdue|late/i.test(k)), `Cảnh báo không được có hạn/quá hạn: ${Object.keys(w).join(',')}`);
    assert(!/quá hạn|trễ hạn/i.test(w.message), 'Câu cảnh báo không nói "quá hạn" — nguồn mục 30');
  });

  check('PR-J · W03 Vi phạm đã nằm trong biện pháp Đang chuẩn bị RA KHỎI tập cần xử lý — cảnh báo tắt ngay, chưa cần xác nhận (đặc tả nghiệm thu 17)', () => {
    const s = withUnhandled('W03', [9, 8, 7, 6]);
    assert((warn.studentWarning(gvcn, s.id) as any).count === 4, 'Trước khi gom: 4');
    const m = mk(gvcn, s.id, 'family_report', s.ids);
    const w = warn.studentWarning(gvcn, s.id) as any;
    assert(w.active === false && w.count === 0, `Gom cả bốn vào biện pháp đang chuẩn bị thì cảnh báo tắt ngay: ${JSON.stringify(w)}`);
    assert(m.status === 'preparing', 'Biện pháp chưa xác nhận');
    /* Bỏ một vi phạm ra: nó quay lại tập cần xử lý, và cảnh báo hiện lại nếu nó đã quá 5 ngày. */
    meas.removeViolation(gvcn, m.id, s.ids[0]);
    const back = warn.studentWarning(gvcn, s.id) as any;
    assert(back.active && back.count === 1 && back.oldestAgeDays === 9, `Bỏ vi phạm ra thì cảnh báo hiện lại: ${JSON.stringify(back)}`);
    /* Gom một phần: chỉ vi phạm còn lại (mới, dưới 5 ngày) thì không cảnh báo. */
    const s2 = withUnhandled('W03 một phần', [9, 8, 2]);
    mk(gvcn, s2.id, 'talk_short', s2.ids.slice(0, 2));
    assert((warn.studentWarning(gvcn, s2.id) as any).active === false, 'Còn lại vi phạm 2 ngày tuổi: không cảnh báo');
  });

  check('PR-J · W04 Vi phạm không còn hiệu lực KHÔNG BAO GIỜ vào tập cần xử lý (V12) — hủy cái cũ nhất thì cảnh báo đổi theo cái cũ nhất còn lại', () => {
    const s = withUnhandled('W04', [10, 4, 3]);
    assert((warn.studentWarning(gvcn, s.id) as any).oldestAgeDays === 10, 'Trước khi hủy');
    viol.invalidateViolation(gvcn, s.ids[0], 'Em đã nộp, tôi bỏ sót');
    const w = warn.studentWarning(gvcn, s.id) as any;
    assert(w.count === 2 && w.active === false && w.oldestAgeDays === 4, `Hủy vi phạm cũ nhất: còn 2, cũ nhất 4 ngày, hết cảnh báo: ${JSON.stringify(w)}`);
    const only = withUnhandled('W04 chỉ một', [20]);
    viol.invalidateViolation(gvcn, only.ids[0], 'Ghi nhầm em');
    assert((warn.studentWarning(gvcn, only.id) as any).count === 0, 'Chỉ có một vi phạm và nó đã hủy: không còn gì cần xử lý');
  });

  check('PR-J · W05 Cảnh báo hiện ở BA nơi — đầu tab Ý thức của lớp · dòng học viên trong danh sách lớp · Việc cần làm của GVCN — và cả ba gọi CÙNG MỘT hàm nên khớp nhau', () => {
    const cls = makeClassForWarnings();
    const a = withUnhandledIn(cls, 'W05 A', [9, 7, 6, 1]);
    const b = withUnhandledIn(cls, 'W05 B', [8]);
    withUnhandledIn(cls, 'W05 C', [3]);
    const gvcnOfCls = loadPrincipal(cls.gvcn);

    /* (1) Đầu tab Ý thức của lớp. */
    const board = warn.classWarning(gvcnOfCls, cls.id) as any;
    assert(board.activeCount === 2 && board.students.length === 2, `Tab Ý thức: 2 học viên quá 5 ngày, thấy ${board.activeCount}`);
    assert(board.message === '⚠ 2 học viên có vi phạm chưa xử lý quá 5 ngày', `Câu đầu tab sai: ${board.message}`);
    const rowA = board.students.find((x: any) => x.studentId === a.id);
    assert(rowA.count === 4 && rowA.oldestAgeDays === 9, 'Học viên A: 4 vi phạm, cũ nhất 9 ngày');
    /* (2) Nhãn nhỏ ở dòng học viên: cùng dữ liệu, không tính lại. */
    const rows = warn.rosterWarnings(gvcnOfCls, cls.id) as Map<number, any>;
    assert(rows.get(a.id).message === rowA.message && rows.get(b.id).active && !rows.has(-1), 'Dòng danh sách lớp phải mang đúng câu của học viên đó');
    /* (3) Một dòng trong Việc cần làm của GVCN. */
    const lines = warn.myWarningLines(gvcnOfCls) as any[];
    const mine = lines.find((l) => l.classId === cls.id);
    assert(mine && mine.studentCount === 2 && /2 học viên có vi phạm chưa xử lý quá 5 ngày/.test(mine.text), `Dòng Việc cần làm: ${JSON.stringify(mine)}`);
    assert(lines.every((l) => !/quá hạn/.test(l.text)), 'Không tô như quá hạn');
    /* Giáo viên bộ môn không dạy lớp này thì không có dòng nhắc việc của lớp này. */
    assert(!(warn.myWarningLines(gvbm) as any[]).some((l) => l.classId === cls.id), 'Giáo viên không dạy lớp này không nhận dòng nhắc của lớp');
    /* (4) Hồ sơ học viên cũng cùng hàm. */
    assert((warn.studentWarning(gvcnOfCls, a.id) as any).message === rowA.message, 'Hồ sơ học viên khớp tab lớp');
    assertThrows(() => warn.classWarning(gvbm, cls.id), /phạm vi|quyền/, 'Giáo viên ngoài lớp xem cảnh báo của lớp');
  });

  check('PR-J · W06 Tuổi `⚠9n` hiện cạnh TỪNG vi phạm chưa xử lý quá 5 ngày — không chỉ ở dòng tổng; vi phạm đã xử lý hoặc còn mới thì không', () => {
    const s = withUnhandled('W06', [9, 6, 2]);
    const rows = (viol.listViolations(gvcn, { studentId: s.id }) as any).rows as any[];
    const by = (id: number) => rows.find((r) => r.id === id);
    assert(by(s.ids[0]).ageLabel === '⚠9n' && by(s.ids[1]).ageLabel === '⚠6n' && by(s.ids[2]).ageLabel === '', `Nhãn tuổi sai: ${rows.map((r) => r.ageLabel).join(' | ')}`);
    mk(gvcn, s.id, 'talk_short', [s.ids[0]]);
    assert(by(s.ids[0]).ageLabel === '⚠9n' && (viol.listViolations(gvcn, { studentId: s.id }) as any).rows.find((r: any) => r.id === s.ids[0]).ageLabel === '',
      'Vi phạm vào biện pháp rồi thì không còn nhãn tuổi');
  });

  // ================================================================== Tám chỉ số Ý thức (J6, HOP_DONG_SO_LIEU §5)

  const metricsSvc = await import('../worklist/metrics.ts');
  const mbId = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id as number;
  const cpId = (conn.prepare("SELECT id FROM branches WHERE code = 'CP'").get() as any).id as number;
  const ms = (who: Principal, id: string, f: Record<string, unknown> = {}) => metricsSvc.metricSet(who, id, f as any) as any;
  const ids = (sql: string, ...args: unknown[]) => (conn.prepare(sql).all(...args) as any[]).map((r) => r.id as number);
  /** Lớp ĐANG HỌC của học viên — dùng cho chỉ số hiện trạng; chỉ số theo kỳ dùng lớp GHI LÚC ĐÓ. */
  const NOW_BRANCH = `(SELECT c2.branch_id FROM enrollments e2 JOIN classes c2 ON c2.id = e2.class_id
                        WHERE e2.student_id = v.student_id AND e2.status = 'active' ORDER BY e2.id DESC LIMIT 1)`;

  console.log('\nPR-J · 9. Tám chỉ số Ý thức (J6) — mỗi chỉ số MỘT hàm trả tập ID');

  check('PR-J · J6 Sổ chỉ số có đủ tám chỉ số Ý thức đúng đơn vị và loại thời gian; không còn "Tái diễn Ý thức"; ba đơn vị (vi phạm · học viên · biện pháp) khác nhau', () => {
    const want: Record<string, [string, string]> = {
      'vi-pham-tong': ['vi-pham', 'phat-sinh-trong-ky'], 'vi-pham-chua-xu-ly': ['vi-pham', 'hien-trang'],
      'vi-pham-khong-hieu-luc': ['vi-pham', 'phat-sinh-trong-ky'], 'hv-co-vi-pham': ['hoc-vien', 'phat-sinh-trong-ky'],
      'hv-can-xu-ly': ['hoc-vien', 'hien-trang'], 'bien-phap-da-thuc-hien': ['bien-phap', 'ket-qua-trong-ky'],
      'bien-phap-dang-chuan-bi': ['bien-phap', 'hien-trang'], 'bien-phap-theo-loai': ['bien-phap', 'ket-qua-trong-ky'],
    };
    for (const [id, [unit, time]] of Object.entries(want)) {
      const m = domain.metricById(id) as any;
      assert(m, `Sổ thiếu chỉ số ${id}`);
      assert(m.donVi === unit && m.thoiGian === time, `${id}: đơn vị/thời gian sai (${m.donVi}/${m.thoiGian})`);
      for (const f of ['ten', 'cauHoi', 'tapDuDieuKien', 'khuTrung', 'drilldown']) assert(String(m[f] ?? '').trim(), `${id} thiếu trường ${f}`);
      assert(metricsSvc.LISTED_METRICS.includes(id), `${id} phải có hàm tập ID`);
    }
    assert(!(domain.METRICS as readonly any[]).some((m) => /tái diễn/i.test(m.ten)), 'Chỉ số "Tái diễn Ý thức" đã hết hiệu lực');
    assert(new Set(['vi-pham', 'hoc-vien', 'bien-phap'].map((u) => domain.METRIC_UNIT_LABEL[u as keyof typeof domain.METRIC_UNIT_LABEL])).size === 3, 'Ba đơn vị phải có nhãn riêng');
  });

  check('PR-J · J6 `vi-pham-tong`: vi phạm còn hiệu lực, đếm theo NGÀY XẢY RA không theo ngày ghi nhận; vi phạm đã hủy đứng ngoài (V12)', () => {
    const st = makeStudent('J6 tổng');
    const old = vid(record(gvbm, st.id, { occurredOn: addDays(TODAY, -40), description: 'Vi phạm xảy ra từ 40 ngày trước, mới ghi hôm nay' }));
    const recent = vid(record(gvbm, st.id, { occurredOn: addDays(TODAY, -2), category: 'attendance', description: 'Vi phạm mới xảy ra hai ngày trước' }));
    const bad = vid(record(gvbm, st.id, { occurredOn: addDays(TODAY, -1), category: 'conduct', description: 'Vi phạm sẽ bị hủy ngay sau đó' }));
    viol.invalidateViolation(gvcn, bad, 'Ghi nhầm em');
    const week = ms(P.mbManager, 'vi-pham-tong', { branchId: mbId, from: addDays(TODAY, -7), to: TODAY });
    assert(week.ids.includes(recent) && !week.ids.includes(old) && !week.ids.includes(bad), 'Kỳ 7 ngày: có vi phạm mới, KHÔNG có vi phạm 40 ngày trước dù ghi hôm nay, KHÔNG có vi phạm đã hủy');
    const all = ms(P.mbManager, 'vi-pham-tong', { branchId: mbId });
    assert(all.ids.includes(old) && all.ids.includes(recent) && !all.ids.includes(bad), 'Không giới hạn kỳ: có cả hai, vẫn không có vi phạm đã hủy');
    assert(all.n === all.ids.length && all.unit === 'vi-pham', 'Số phải là độ dài của tập ID và có đơn vị vi phạm');
    const truth = ids(`SELECT v.id FROM violations v JOIN classes c ON c.id = v.class_id WHERE c.branch_id = ? AND v.valid = 1 ORDER BY v.id`, mbId);
    assert(JSON.stringify([...all.ids].sort((a: number, b: number) => a - b)) === JSON.stringify(truth), 'Tập ID phải bằng sự thật độc lập dựng bằng SQL');
  });

  check('PR-J · J6 `vi-pham-chua-xu-ly`: còn hiệu lực VÀ không nằm trong biện pháp nào (kể cả đang chuẩn bị); vi phạm đã hủy đứng ngoài', () => {
    const st = makeStudent('J6 chưa xử lý');
    const [a, b, c, d] = violations(st.id, 4);
    viol.invalidateViolation(gvcn, d, 'Ghi nhầm em');
    const before = ms(P.mbManager, 'vi-pham-chua-xu-ly', { branchId: mbId });
    assert([a, b, c].every((x) => before.ids.includes(x)) && !before.ids.includes(d), 'Ba vi phạm còn hiệu lực chưa xử lý, vi phạm đã hủy thì không');
    const m = mk(gvcn, st.id, 'talk_short', [a, b]);
    const mid = ms(P.mbManager, 'vi-pham-chua-xu-ly', { branchId: mbId });
    assert(!mid.ids.includes(a) && !mid.ids.includes(b) && mid.ids.includes(c), 'Vào biện pháp đang chuẩn bị là ra khỏi tập chưa xử lý (W03)');
    meas.removeViolation(gvcn, m.id, b);
    assert(ms(P.mbManager, 'vi-pham-chua-xu-ly', { branchId: mbId }).ids.includes(b), 'Bỏ ra khỏi biện pháp thì quay lại');
    const truth = ids(`SELECT v.id FROM violations v WHERE v.valid = 1 AND ${NOW_BRANCH} = ?
                          AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = v.id) ORDER BY v.id`, mbId);
    const now = ms(P.mbManager, 'vi-pham-chua-xu-ly', { branchId: mbId });
    assert(JSON.stringify([...now.ids].sort((x: number, y: number) => x - y)) === JSON.stringify(truth), 'Tập ID phải bằng sự thật độc lập');
    assert(now.n === now.ids.length, 'Số = độ dài tập');
  });

  check('PR-J · J6 `vi-pham-khong-hieu-luc` đứng RIÊNG, không trừ vào `vi-pham-tong`; ba tập tổng · chưa xử lý · không hiệu lực không giao nhau khi so với tổng', () => {
    const st = makeStudent('J6 hủy');
    const [a, b] = violations(st.id, 2);
    viol.invalidateViolation(gvcn, b, 'Em đã nộp, tôi bỏ sót');
    const bad = ms(P.mbManager, 'vi-pham-khong-hieu-luc', { branchId: mbId });
    const good = ms(P.mbManager, 'vi-pham-tong', { branchId: mbId });
    assert(bad.ids.includes(b) && !bad.ids.includes(a), 'Chỉ vi phạm đã hủy nằm ở đây');
    assert(!good.ids.some((x: number) => bad.ids.includes(x)), 'Hai tập không giao nhau: hủy không "trừ" vào tổng, nó đứng riêng');
    const truth = ids(`SELECT v.id FROM violations v JOIN classes c ON c.id = v.class_id WHERE c.branch_id = ? AND v.valid = 0 ORDER BY v.id`, mbId);
    assert(JSON.stringify([...bad.ids].sort((x: number, y: number) => x - y)) === JSON.stringify(truth), 'Tập ID phải bằng sự thật độc lập');
  });

  check('PR-J · J6 `hv-co-vi-pham`: đếm DUY NHẤT học viên có vi phạm còn hiệu lực — em có ba vi phạm vẫn là MỘT học viên; em chỉ có vi phạm đã hủy thì không', () => {
    const many = makeStudent('J6 nhiều'), onlyBad = makeStudent('J6 chỉ hủy');
    violations(many.id, 3);
    const [x] = violations(onlyBad.id, 1);
    viol.invalidateViolation(gvcn, x, 'Ghi nhầm em');
    const r = ms(P.mbManager, 'hv-co-vi-pham', { branchId: mbId });
    assert(r.ids.filter((id: number) => id === many.id).length === 1 && r.ids.includes(many.id), 'Em có ba vi phạm xuất hiện đúng một lần');
    assert(!r.ids.includes(onlyBad.id), 'Em chỉ có vi phạm đã hủy không được đếm');
    assert(r.unit === 'hoc-vien' && r.n === r.ids.length && new Set(r.ids).size === r.ids.length, 'Đơn vị học viên, số = độ dài tập, không trùng');
    const truth = ids(`SELECT DISTINCT v.student_id AS id FROM violations v JOIN classes c ON c.id = v.class_id WHERE c.branch_id = ? AND v.valid = 1 ORDER BY v.student_id`, mbId);
    assert(JSON.stringify([...r.ids].sort((a: number, b: number) => a - b)) === JSON.stringify(truth), 'Tập ID phải bằng sự thật độc lập');
    const vp = ms(P.mbManager, 'vi-pham-tong', { branchId: mbId });
    assert(vp.n > r.n, 'Số vi phạm và số học viên là hai đơn vị khác nhau, không bằng nhau');
  });

  check('PR-J · J6 `hv-can-xu-ly` = những em đang có cảnh báo 5 ngày — CÙNG hàm với cảnh báo, không đếm riêng', () => {
    const late = withUnhandled('J6 cần xử lý', [9, 2]);
    const young = withUnhandled('J6 còn mới', [3]);
    const r = ms(P.mbManager, 'hv-can-xu-ly', { branchId: mbId });
    assert(r.ids.includes(late.id) && !r.ids.includes(young.id), 'Em có vi phạm cũ nhất 9 ngày thì cần xử lý, em chỉ có vi phạm 3 ngày thì chưa');
    const truth = ids(`SELECT s AS id FROM (SELECT v.student_id AS s, MIN(v.occurred_on) AS oldest FROM violations v
        WHERE v.valid = 1 AND ${NOW_BRANCH} = ? AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = v.id)
        GROUP BY v.student_id) WHERE julianday(?) - julianday(oldest) > 5 ORDER BY s`, mbId, TODAY);
    assert(JSON.stringify([...r.ids].sort((a: number, b: number) => a - b)) === JSON.stringify(truth), 'Tập ID phải bằng sự thật độc lập');
    for (const id of r.ids) assert((warn.studentWarning(P.mbManager, id) as any).active, `Học viên ${id} trong tập mà cảnh báo lại tắt — hai nơi đếm khác nhau`);
    mk(gvcn, late.id, 'family_report', late.ids);
    assert(!ms(P.mbManager, 'hv-can-xu-ly', { branchId: mbId }).ids.includes(late.id), 'Gom hết vào biện pháp thì ra khỏi tập cần xử lý');
  });

  check('PR-J · J6 `bien-phap-da-thuc-hien` đếm BIỆN PHÁP theo ngày thực hiện — một Report gom 5 vi phạm là MỘT (B16); `bien-phap-dang-chuan-bi` không có "quá hạn"', () => {
    const st = makeStudent('J6 biện pháp');
    const five = violations(st.id, 5);
    const report = mk(gvcn, st.id, 'family_report', five);
    assert(ms(P.mbManager, 'bien-phap-dang-chuan-bi', { branchId: mbId }).ids.includes(report.id), 'Còn Đang chuẩn bị');
    assert(!ms(P.mbManager, 'bien-phap-da-thuc-hien', { branchId: mbId }).ids.includes(report.id), 'Chưa thực hiện thì chưa vào tập đã thực hiện');
    confirm(gvcn, report.id, { performedOn: addDays(TODAY, -3) });
    const done = ms(P.mbManager, 'bien-phap-da-thuc-hien', { branchId: mbId });
    assert(done.ids.filter((x: number) => x === report.id).length === 1 && done.unit === 'bien-phap', 'Report gom 5 vi phạm chỉ là MỘT biện pháp trong tập');
    assert(!ms(P.mbManager, 'bien-phap-dang-chuan-bi', { branchId: mbId }).ids.includes(report.id), 'Đã thực hiện thì rời tập đang chuẩn bị');
    const inRange = ms(P.mbManager, 'bien-phap-da-thuc-hien', { branchId: mbId, from: addDays(TODAY, -4), to: addDays(TODAY, -2) });
    const outRange = ms(P.mbManager, 'bien-phap-da-thuc-hien', { branchId: mbId, from: addDays(TODAY, -1), to: TODAY });
    assert(inRange.ids.includes(report.id) && !outRange.ids.includes(report.id), 'Đếm theo NGÀY THỰC HIỆN (3 ngày trước), không theo ngày bấm xác nhận (hôm nay)');
    const truth = ids(`SELECT m.id FROM discipline_measures m JOIN classes c ON c.id = m.class_id WHERE c.branch_id = ? AND m.status = 'done' ORDER BY m.id`, mbId);
    assert(JSON.stringify([...done.ids].sort((a: number, b: number) => a - b)) === JSON.stringify(truth), 'Tập ID phải bằng sự thật độc lập');
    const prep = ms(P.mbManager, 'bien-phap-dang-chuan-bi', { branchId: mbId });
    const truthPrep = ids(`SELECT m.id FROM discipline_measures m JOIN classes c ON c.id = m.class_id WHERE c.branch_id = ? AND m.status = 'preparing' ORDER BY m.id`, mbId);
    assert(JSON.stringify([...prep.ids].sort((a: number, b: number) => a - b)) === JSON.stringify(truthPrep), 'Tập đang chuẩn bị phải bằng sự thật độc lập');
    assert(/không có hạn/i.test((domain.metricById('bien-phap-dang-chuan-bi') as any).tapDuDieuKien), 'Định nghĩa phải nói rõ biện pháp đang chuẩn bị không có hạn nên không có "quá hạn"');
  });

  check('PR-J · J6 `bien-phap-theo-loai`: chín loại, tách riêng ba thư cảnh cáo; lọc `kind` ra đúng loại; các phần cộng lại đúng bằng tập tổng', () => {
    const st = makeStudent('J6 theo loại');
    const v = violations(st.id, 2);
    const w1 = mk(gvcn, st.id, 'warning_1', v); link(gvcn, w1.id); confirm(gvcn, w1.id);
    const w2 = mk(gvcn, st.id, 'warning_2', v); link(gvcn, w2.id); confirm(gvcn, w2.id);
    const fr = mk(gvcn, st.id, 'family_report', v); confirm(gvcn, fr.id);
    const all = ms(P.mbManager, 'bien-phap-theo-loai', { branchId: mbId });
    assert(Object.keys(all.byKind).join() === domain.MEASURE_KINDS.join(), `Phải có đủ chín loại theo thứ tự: ${Object.keys(all.byKind).join()}`);
    assert(all.byKind.warning_1.includes(w1.id) && all.byKind.warning_2.includes(w2.id) && !all.byKind.warning_1.includes(w2.id), 'Ba thư cảnh cáo tách riêng, không gộp');
    const sum = (Object.values(all.byKind) as number[][]).reduce((s, x) => s + x.length, 0);
    assert(sum === all.ids.length && all.n === all.ids.length, `Các phần cộng lại (${sum}) phải bằng tập tổng (${all.ids.length})`);
    const only = ms(P.mbManager, 'bien-phap-theo-loai', { branchId: mbId, kind: 'warning_2' });
    assert(only.ids.includes(w2.id) && only.ids.every((id: number) => (conn.prepare('SELECT kind FROM discipline_measures WHERE id = ?').get(id) as any).kind === 'warning_2'), 'Lọc kind=warning_2');
    assertThrows(() => ms(P.mbManager, 'bien-phap-theo-loai', { kind: 'severe' }), /loại/i, 'Loại lạ');
    assert(!all.ids.includes(mk(gvcn, st.id, 'talk_short', v).id), 'Biện pháp đang chuẩn bị không vào tập đã thực hiện theo loại');
  });

  check('PR-J · J6 Quyền: Quản lý chỉ thấy chi nhánh mình (hỏi chi nhánh khác bị từ chối), Quản trị thấy tất cả, GVBM và GVCN không xem thống kê chi nhánh (số 0, có nhãn) — drill-down cùng quyền với số tổng', () => {
    const st = makeStudent('J6 quyền');
    const [v] = violations(st.id, 1);
    for (const id of ['vi-pham-tong', 'vi-pham-chua-xu-ly', 'hv-co-vi-pham']) {
      const mb = ms(P.mbManager, id), cp = ms(P.cpManager, id);
      const own = id === 'hv-co-vi-pham' ? st.id : v;
      assert(mb.ids.includes(own) && !cp.ids.includes(own), `${id}: dữ liệu chi nhánh MB không được lẫn vào Quản lý CP`);
      assertThrows(() => ms(P.cpManager, id, { branchId: mbId }), /phạm vi/, `${id}: Quản lý CP hỏi chi nhánh MB phải bị từ chối chứ không trả tập rút gọn`);
      assert(ms(P.admin, id).ids.includes(own), `${id}: Quản trị thấy toàn hệ thống`);
      assert(ms(P.admin, id, { branchId: cpId }).ids.every((x: number) => !mb.ids.includes(x)), `${id}: lọc chi nhánh CP không chứa dữ liệu MB`);
      for (const [name, who] of [['GVBM', gvbm], ['GVCN', gvcn]] as const) {
        const r = ms(who, id);
        assert(r.ids.length === 0 && r.n === 0 && r.empty === true && r.note === 'Không có dữ liệu trong phạm vi', `${name} không có quyền xem thống kê chi nhánh — phải là rỗng có nhãn, không phải toàn hệ thống: ${JSON.stringify({ n: r.n, empty: r.empty, note: r.note })}`);
      }
    }
    const resp = metricsSvc.metricResponse(ms(P.mbManager, 'vi-pham-tong', { branchId: mbId }), true) as any;
    assert(resp.n === resp.ids.length && resp.rows.length === resp.ids.length && resp.rows.every((r: any) => r.title && r.href.startsWith('/hoc-vien/')),
      'Panel danh sách: số = độ dài tập = số dòng, mỗi dòng có tên và đường dẫn');
    const mResp = metricsSvc.metricResponse(ms(P.mbManager, 'bien-phap-dang-chuan-bi', { branchId: mbId }), true) as any;
    assert(mResp.rows.length === mResp.ids.length && mResp.rows.every((r: any) => r.title && r.sub), 'Dòng của tập biện pháp cũng đủ tên và học viên');
  });

  check('PR-J · J6 Ý thức nằm HOÀN TOÀN NGOÀI mọi bảng hiệu quả hỗ trợ: tạo và xác nhận biện pháp không đổi `pa-co-ket-qua`, `ty-le-co-cai-thien`, `dung-han-cap-nhat` (đặc tả nghiệm thu 19)', () => {
    const snap = () => ['pa-co-ket-qua', 'ty-le-co-cai-thien', 'dung-han-cap-nhat', 'case-mo', 'hv-co-case-mo', 'pa-can-cap-nhat']
      .map((id) => { const r = ms(P.admin, id); return `${id}=${JSON.stringify([r.ids, r.numeratorIds ?? null, r.denominatorIds ?? null])}`; }).join('\n');
    const before = snap();
    const st = makeStudent('J6 ngoài hiệu quả');
    const v = violations(st.id, 3);
    const m = mk(gvcn, st.id, 'family_report', v); confirm(gvcn, m.id);
    const s = mk(gvcn, st.id, 'suspension', v); link(gvcn, s.id); confirm(gvcn, s.id);
    assert(snap() === before, 'Biện pháp Ý thức đã chui vào một chỉ số học thuật');
    assert(!(domain.metricById('ty-le-co-cai-thien') as any).tapDuDieuKien.toLowerCase().includes('biện pháp'), 'Định nghĩa tỷ lệ cải thiện không nhắc biện pháp');
  });

  // ================================================================== Kho tệp cho vi phạm và biện pháp, ba khu vực của lớp

  console.log('\nPR-J · 10. Bằng chứng của vi phạm và biện pháp; ba khu vực của lớp (J8)');

  check('PR-J · J8 Kho tệp có nơi chủ cho vi phạm và biện pháp: quyền xem = quyền xem học viên, quyền thêm/gỡ = quyền sửa bản ghi chủ (B10: biện pháp đã thực hiện vẫn bổ sung được)', () => {
    const st = makeStudent('J8 tệp');
    const [v] = violations(st.id, 1);
    /* Vi phạm: người ghi và GVCN thêm được; đồng nghiệp chỉ xem. */
    const own = attachmentsSvc.addLink(gvbm, { ownerType: 'violation', ownerId: v, url: 'https://example.com/anh-chup', displayName: 'Ảnh chụp lớp' }) as any;
    assert(own.id > 0, 'Người ghi thêm được bằng chứng cho vi phạm của mình');
    assert((attachmentsSvc.listAttachments(gvbm2, 'violation', v) as any[]).length === 1, 'Đồng nghiệp dạy lớp xem được bằng chứng');
    assertThrows(() => attachmentsSvc.addLink(gvbm2, { ownerType: 'violation', ownerId: v, url: 'https://example.com/x', displayName: 'x' }), /quyền/, 'Đồng nghiệp thêm được bằng chứng vào vi phạm của người khác');
    assertThrows(() => attachmentsSvc.listAttachments(outsider, 'violation', v), /phạm vi|quyền/, 'Giáo viên ngoài lớp xem được bằng chứng');
    assertThrows(() => attachmentsSvc.listAttachments(P.cpManager, 'violation', v), /phạm vi|quyền/, 'Quản lý chi nhánh khác xem được bằng chứng');
    assert(attachmentsSvc.addLink(gvcn, { ownerType: 'violation', ownerId: v, url: 'https://example.com/gvcn', displayName: 'GVCN bổ sung' }).id > 0, 'GVCN thêm được');
    assert((viol.violationDetail(gvbm, v) as any).attachmentCount === 2, 'Chi tiết vi phạm đếm đúng tệp');
    attachmentsSvc.removeAttachment(gvbm, own.id);
    /* Biện pháp: GVBM đọc được, không thêm được; GVCN thêm được kể cả khi đã thực hiện. */
    const m = mk(gvcn, st.id, 'talk_short', [v]);
    assertThrows(() => attachmentsSvc.addLink(gvbm, { ownerType: 'discipline_measure', ownerId: m.id, url: 'https://example.com/y', displayName: 'y' }), /quyền/, 'GVBM thêm được bằng chứng cho biện pháp');
    const file = link(gvcn, m.id, 'Ghi chú cuộc gặp') as any;
    assert((attachmentsSvc.listAttachments(gvbm, 'discipline_measure', m.id) as any[]).length === 1, 'GVBM đọc được bằng chứng của biện pháp');
    confirm(gvcn, m.id);
    assert(link(gvcn, m.id, 'Bổ sung sau khi thực hiện').id > 0, 'Biện pháp đã thực hiện vẫn bổ sung được bằng chứng');
    attachmentsSvc.removeAttachment(gvcn, file.id);
    assert(one("SELECT COUNT(*) n FROM audit_logs WHERE action = 'attachment.delete' AND entity_id = ?", file.id) === 1, 'Gỡ tệp của biện pháp có audit');
  });

  const board = await import('../yThuc/board.ts');

  check('PR-J · J9 Ba khu vực của lớp (Y03): vi phạm chưa xử lý gom theo HỌC VIÊN kèm tuổi, biện pháp đang chuẩn bị đủ, lịch sử chỉ 3 dòng; GVBM đọc được nhưng không có quyền tạo', () => {
    const cls = makeClassForWarnings('MB-FT PJBRD');
    const who = loadPrincipal(cls.gvcn);
    const a = withUnhandledIn(cls, 'BRD A', [9, 6, 1]);
    const b = withUnhandledIn(cls, 'BRD B', [2]);
    const c = withUnhandledIn(cls, 'BRD C', [8, 7]);
    const empty = makeStudent('BRD D', cls.id);
    const { classViolationBoard } = board;
    const bd = classViolationBoard(who, cls.id) as any;
    assert(bd.classCode === 'MB-FT PJBRD' && bd.canManage === true, 'GVCN của lớp có quyền xử lý');
    assert(bd.unhandled.total === 6 && bd.unhandled.studentCount === 3, `6 vi phạm của 3 học viên (hai đơn vị khác nhau, không cộng): ${bd.unhandled.total}/${bd.unhandled.studentCount}`);
    assert(bd.unhandled.students.map((s: any) => s.studentId).join() === [a.id, c.id, b.id].join(), 'Học viên xếp theo vi phạm cũ nhất trước (9 ngày, 8 ngày, 2 ngày)');
    assert(!bd.unhandled.students.some((s: any) => s.studentId === empty.id), 'Học viên không có vi phạm không xuất hiện');
    const rowA = bd.unhandled.students[0];
    assert(rowA.count === 3 && rowA.oldestAgeDays === 9 && rowA.warningActive && rowA.violations.length === 3, 'Học viên A: 3 vi phạm, cũ nhất 9 ngày, có cảnh báo');
    assert(rowA.violations.map((v: any) => v.ageLabel).join() === '⚠9n,⚠6n,', `Tuổi cạnh từng vi phạm (W06): ${rowA.violations.map((v: any) => v.ageLabel).join()}`);
    assert(bd.warning.activeCount === 2 && bd.warning.message === '⚠ 2 học viên có vi phạm chưa xử lý quá 5 ngày', `Đầu tab: ${bd.warning.message}`);
    assert(JSON.stringify(bd.warning.activeCount) === JSON.stringify((warn.classWarning(who, cls.id) as any).activeCount), 'Khớp cảnh báo 5 ngày (cùng hàm)');
    /* Tạo biện pháp cho A: các vi phạm ra khỏi khu 1, biện pháp vào khu 2. */
    const m = mk(who, a.id, 'family_report', a.ids.slice(0, 2));
    const after = classViolationBoard(who, cls.id) as any;
    assert(after.unhandled.total === 4 && after.preparing.length === 1 && after.preparing[0].id === m.id, 'Khu 1 giảm, khu 2 có biện pháp');
    assert(after.preparing[0].violations.length === 2, 'Khu 2 kèm danh sách vi phạm');
    /* Lịch sử: chỉ ba dòng gần nhất, có tổng. */
    for (let i = 0; i < 4; i += 1) {
      const vi = vid(record(who, b.id, { occurredOn: addDays(TODAY, -3 - i), description: `Vi phạm thứ ${i + 1} đã được xử lý bằng trao đổi ngắn` }));
      confirm(who, mk(who, b.id, 'talk_short', [vi]).id, { performedOn: addDays(TODAY, -i) });
    }
    const hist = classViolationBoard(who, cls.id) as any;
    assert(hist.history.total === 4 && hist.history.latest.length === 3, `Lịch sử: tổng 4, hiện 3 dòng gần nhất — có ${hist.history.total}/${hist.history.latest.length}`);
    assert(hist.history.latest[0].performedOn >= hist.history.latest[2].performedOn, 'Gần nhất trước');
    /* GVBM không dạy lớp thì không đọc được; giáo viên dạy lớp đọc được nhưng không có quyền tạo. */
    assertThrows(() => classViolationBoard(gvbm, cls.id), /phạm vi|quyền/, 'Giáo viên không dạy lớp đọc được bảng');
    conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, 'writing1', 0, 'active', '2026-01-01', ?)`)
      .run(cls.id, gvbm.userId, new Date().toISOString());
    const asGvbm = classViolationBoard(loadPrincipal(gvbm.userId), cls.id) as any;
    assert(asGvbm.canManage === false && asGvbm.unhandled.total === after.unhandled.total && asGvbm.preparing.length === 1,
      'GVBM dạy lớp thấy đủ ba khu vực nhưng canManage = false (không có nút Tạo biện pháp)');
    assert((classViolationBoard(P.mbManager, cls.id) as any).canManage === true && (classViolationBoard(P.admin, cls.id) as any).canManage === true, 'Quản lý và Quản trị xử lý được');
    assertThrows(() => classViolationBoard(P.cpManager, cls.id), /phạm vi|quyền/, 'Quản lý chi nhánh khác đọc được bảng');
  });

  // ================================================================== Gọi thẳng đường HTTP (nghiệm thu 5, 22)

  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const server = createApp().listen(0);
  const port = (server.address() as any).port as number;
  const call = async (who: Principal | null, method: string, url: string, body?: unknown) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (who) headers.cookie = `pisa_demo_session=${createSession(who.userId)}`;
    const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    let json: any = null;
    try { json = await res.json(); } catch { /* không có thân */ }
    return { status: res.status, json };
  };

  const hs = makeStudent('HTTP');
  const hv = violations(hs.id, 3);
  const noAuth = await call(null, 'GET', `/classes/${CLASS}/y-thuc`);
  const gvbmCreate = await call(gvbm, 'POST', '/measures', { studentId: hs.id, kind: 'talk_short', violationIds: hv });
  const gvbmBoard = await call(gvbm, 'GET', `/classes/${CLASS}/y-thuc`);
  const gvcnBoard = await call(gvcn, 'GET', `/classes/${CLASS}/y-thuc`);
  const chain2 = await call(gvcn, 'POST', '/measures', { studentId: hs.id, kind: 'warning_2', violationIds: hv });
  const chain3 = await call(gvcn, 'POST', '/measures', { studentId: hs.id, kind: 'warning_3', violationIds: hv });
  const w1 = await call(gvcn, 'POST', '/measures', { studentId: hs.id, kind: 'warning_1', violationIds: hv });
  const w1NoFile = await call(gvcn, 'POST', `/measures/${w1.json?.id}/confirm`, { performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gửi thư' });
  const w1Link = await call(gvcn, 'POST', '/attachments/link', { ownerType: 'discipline_measure', ownerId: w1.json?.id, url: 'https://example.com/thu', displayName: 'Thư lần 1' });
  const w1Done = await call(gvcn, 'POST', `/measures/${w1.json?.id}/confirm`, { performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gửi thư' });
  const chain2Ok = await call(gvcn, 'POST', '/measures', { studentId: hs.id, kind: 'warning_2', violationIds: hv });
  const chain3Still = await call(gvcn, 'POST', '/measures', { studentId: hs.id, kind: 'warning_3', violationIds: hv });
  const gvbmDelete = await call(gvbm, 'DELETE', `/measures/${chain2Ok.json?.id}`);
  const gvbmPatch = await call(gvbm, 'PATCH', `/measures/${chain2Ok.json?.id}`, { note: 'GVBM sửa ghi chú' });
  const gvbmAdd = await call(gvbm, 'POST', `/measures/${chain2Ok.json?.id}/violations`, { violationIds: hv });
  const gvbmConfirm = await call(gvbm, 'POST', `/measures/${chain2Ok.json?.id}/confirm`, { performedOn: TODAY, performerName: 'x', note: 'nội dung' });
  const gvbmRead = await call(gvbm, 'GET', `/measures/${chain2Ok.json?.id}`);
  const kinds = await call(gvbm, 'GET', `/students/${hs.id}/measure-kinds`);
  const vPost = await call(gvbm, 'POST', '/violations', { studentId: hs.id, category: 'attendance', description: 'Đi muộn 15 phút buổi sáng', idempotencyKey: 'pj-http-1' });
  const vPostAgain = await call(gvbm, 'POST', '/violations', { studentId: hs.id, category: 'attendance', description: 'Đi muộn 15 phút buổi sáng', idempotencyKey: 'pj-http-1' });
  const vOutsider = await call(outsider, 'POST', '/violations', { studentId: hs.id, category: 'attendance', description: 'Người ngoài lớp ghi vi phạm' });
  const vPeer = await call(gvbm2, 'PATCH', `/violations/${vPost.json?.violation?.id}`, { description: 'Đồng nghiệp sửa vi phạm của người khác' });
  const vSimilar = await call(gvbm2, 'GET', `/violations/similar?studentId=${hs.id}&category=attendance&occurredOn=${TODAY}`);
  const statCp = await call(P.cpManager, 'GET', `/metrics/vi-pham-tong?branchId=${mbId}`);
  const statGvbm = await call(gvbm, 'GET', '/metrics/vi-pham-tong?rows=1');
  const statMb = await call(P.mbManager, 'GET', `/metrics/vi-pham-tong?rows=1&branchId=${mbId}`);
  server.close();

  console.log('\nPR-J · 11. Gọi thẳng đường HTTP — máy chủ từ chối, không chỉ ẩn nút');

  check('PR-J · #22 GVBM gọi thẳng API tạo · sửa · thêm vi phạm · xác nhận · xóa biện pháp → máy chủ từ chối (403); đọc thì được; chưa đăng nhập → 401', () => {
    assert(noAuth.status === 401, `Chưa đăng nhập: ${noAuth.status}`);
    assert(gvbmCreate.status === 403, `GVBM tạo biện pháp qua HTTP phải bị 403, được ${gvbmCreate.status} ${JSON.stringify(gvbmCreate.json)}`);
    for (const [name, r] of [['sửa', gvbmPatch], ['thêm vi phạm', gvbmAdd], ['xác nhận', gvbmConfirm], ['xóa', gvbmDelete]] as const) {
      assert(r.status === 403, `GVBM ${name} biện pháp qua HTTP phải bị 403, được ${r.status}`);
    }
    assert(gvbmRead.status === 200 && gvbmRead.json?.id === chain2Ok.json?.id, 'GVBM đọc được biện pháp của lớp mình dạy');
    assert(kinds.status === 200 && (kinds.json?.rows ?? []).length === 9, 'GVBM đọc được danh sách chín loại kèm dòng khóa');
    assert(gvbmBoard.status === 200 && gvbmBoard.json?.canManage === false && gvcnBoard.json?.canManage === true,
      'Bảng ba khu vực của lớp: GVBM đọc được nhưng canManage = false; GVCN = true');
    for (const k of ['warning', 'unhandled', 'preparing', 'history']) assert(k in (gvbmBoard.json ?? {}), `Bảng của lớp thiếu khu vực ${k}`);
  });

  check('PR-J · #5 + B06 Gọi thẳng HTTP: Thư cảnh cáo lần 2 khi chưa có lần 1 → 400 và nói vì sao; lần 3 khi chưa có lần 2 → 400; xác nhận thư không đính tệp → 400; xong từng bước thì mở khóa', () => {
    assert(chain2.status === 400 && /Thư cảnh cáo lần 1/.test(chain2.json?.error ?? ''), `Lần 2 khi chưa có lần 1: ${chain2.status} ${chain2.json?.error}`);
    assert(chain3.status === 400 && /Thư cảnh cáo lần 2/.test(chain3.json?.error ?? ''), `Lần 3 khi chưa có lần 2: ${chain3.status} ${chain3.json?.error}`);
    assert(w1.status === 200 && w1.json?.status === 'preparing' && w1.json?.kind === 'warning_1', `Tạo lần 1: ${w1.status}`);
    assert(w1NoFile.status === 400 && w1NoFile.json?.error === 'Cần đính kèm tệp hoặc liên kết thư cảnh cáo', `Xác nhận thư không tệp: ${w1NoFile.status} ${w1NoFile.json?.error}`);
    assert(w1Link.status === 200 && w1Done.status === 200 && w1Done.json?.status === 'done', `Có liên kết thì xác nhận được: ${w1Done.status} ${w1Done.json?.error}`);
    assert(chain2Ok.status === 200 && chain2Ok.json?.kind === 'warning_2', `Lần 1 đã thực hiện → tạo được lần 2: ${chain2Ok.status} ${chain2Ok.json?.error}`);
    assert(chain3Still.status === 400 && /Thư cảnh cáo lần 2/.test(chain3Still.json?.error ?? ''), 'Lần 2 mới ở Đang chuẩn bị thì lần 3 vẫn khóa');
  });

  check('PR-J · J8 Đường HTTP ghi vi phạm: gửi lại cùng khoá không tạo dòng thứ hai (V07); người ngoài lớp 403; đồng nghiệp sửa vi phạm của người khác 403; cảnh báo trùng trả bản đang có', () => {
    assert(vPost.status === 200 && vPost.json?.violation?.id > 0 && Array.isArray(vPost.json?.similar), `Ghi vi phạm: ${vPost.status} ${JSON.stringify(vPost.json)}`);
    assert(vPostAgain.json?.violation?.id === vPost.json?.violation?.id, 'Cùng khoá idempotency phải ra cùng vi phạm');
    assert(vOutsider.status === 403, `Người ngoài lớp ghi vi phạm: ${vOutsider.status}`);
    assert(vPeer.status === 403, `Đồng nghiệp sửa vi phạm của người khác: ${vPeer.status}`);
    assert(vSimilar.status === 200 && (vSimilar.json?.rows ?? []).some((r: any) => r.id === vPost.json?.violation?.id), 'Cảnh báo trùng trả về vi phạm đang có');
  });

  check('PR-J · J8 Đường HTTP thống kê: Quản lý CP hỏi chi nhánh MB → 403 (không trả tập rút gọn); GVBM không có thống kê chi nhánh → rỗng có nhãn; Quản lý MB có dòng bấm được', () => {
    assert(statCp.status === 403, `Quản lý CP hỏi chi nhánh MB: ${statCp.status}`);
    assert(statGvbm.status === 200 && statGvbm.json?.n === 0 && statGvbm.json?.empty === true && statGvbm.json?.note === 'Không có dữ liệu trong phạm vi', `GVBM: ${JSON.stringify(statGvbm.json)}`);
    assert(statMb.status === 200 && statMb.json?.n === statMb.json?.ids?.length && statMb.json?.rows?.length === statMb.json?.n && statMb.json?.n > 0, 'Quản lý MB: số = độ dài tập = số dòng');
  });
}
