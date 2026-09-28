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
  checkAsync: (name: string, fn: () => Promise<void>) => Promise<void>;
  assert: (cond: unknown, msg: string) => void;
  assertThrows: (fn: () => unknown, match: RegExp, msg: string) => void;
  conn: any;
  TODAY: string;
  P: Record<string, Principal>;
  addDays: (date: string, n: number) => string;
  classId: (code: string) => number;
  /** Id lớn nhất của từng bảng ngay sau khi dựng bộ demo — để phép kiểm soi dữ liệu demo không lẫn dữ liệu do chính các phép kiểm tạo ra. */
  seedMax: Record<string, number>;
};

export async function runYThucTests(t: YThucTestKit) {
  const { check, assert } = t;
  const domain = await import('../../../shared/domain/index.ts');

  {
  // ================================================================== J10 — bộ demo: MƯỜI TÁM tình huống của đặc tả §10

  console.log('\nPR-J · 0. Bộ demo Ý thức — đủ 18 tình huống của đặc tả §10 (soi vào chính dữ liệu demo, không phải luật)');

  const { conn, TODAY } = t;
  const { warningsFor } = await import('../yThuc/canhBao.ts');
  const { yThucMetric } = await import('../yThuc/thongKe.ts');
  const { measureKindAvailability } = await import('../yThuc/measures.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const VMAX = t.seedMax.violations, MMAX = t.seedMax.discipline_measures;
  const rows = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /** Học viên của bộ demo theo TÊN — phép kiểm hỏng ngay nếu tên trùng hoặc không có, thay vì soi nhầm em khác. */
  const demoStudent = (name: string): number => {
    const r = rows('SELECT id FROM students WHERE full_name = ?', name);
    assert(r.length === 1, `Bộ demo phải có đúng một học viên tên "${name}", đang có ${r.length}`);
    return r[0].id;
  };
  const AN = demoStudent('Nguyễn Minh An'), HA = demoStudent('Trần Thu Hà'), HUY = demoStudent('Lê Quang Huy'),
    NGOC = demoStudent('Phạm Bảo Ngọc'), VAN = demoStudent('Đặng Thu Vân'), YEN = demoStudent('Ngô Hải Yến'),
    KIEN = demoStudent('Trần Hải Kiên');
  const seedViolations = (sid: number) => rows('SELECT * FROM violations WHERE student_id = ? AND id <= ? ORDER BY occurred_on, id', sid, VMAX);
  const seedMeasures = (sid: number) => rows('SELECT * FROM discipline_measures WHERE student_id = ? AND id <= ? ORDER BY created_at, id', sid, MMAX);
  const linksOf = (measureId: number) => rows('SELECT violation_id FROM measure_violations WHERE measure_id = ?', measureId).map((r) => r.violation_id as number);

  check('PR-J · DEMO Bộ demo không có gì sau ngày demo; biện pháp đã thực hiện không chứa vi phạm xảy ra SAU ngày thực hiện; mọi liên kết trỏ đúng một học viên', () => {
    assert(VMAX > 0 && MMAX > 0, 'Bộ demo chưa có vi phạm hoặc biện pháp nào');
    const future = one(
      `SELECT (SELECT COUNT(*) FROM violations WHERE occurred_on > ? OR reported_on > ? OR substr(created_at,1,10) > ?)
            + (SELECT COUNT(*) FROM discipline_measures WHERE substr(created_at,1,10) > ? OR COALESCE(performed_on,'') > ?) AS n`, TODAY, TODAY, TODAY, TODAY, TODAY).n;
    assert(future === 0, `${future} dòng Ý thức trong bộ demo nằm sau ngày demo ${TODAY}`);
    const late = rows(
      `SELECT dm.id FROM discipline_measures dm JOIN measure_violations mv ON mv.measure_id = dm.id JOIN violations v ON v.id = mv.violation_id
        WHERE dm.status = 'done' AND v.occurred_on > dm.performed_on AND dm.id <= ?`, MMAX);
    assert(late.length === 0, `Biện pháp ${late[0]?.id} đã thực hiện mà chứa vi phạm xảy ra sau ngày thực hiện`);
    const cross = rows(
      `SELECT dm.id FROM discipline_measures dm JOIN measure_violations mv ON mv.measure_id = dm.id JOIN violations v ON v.id = mv.violation_id
        WHERE v.student_id != dm.student_id AND dm.id <= ?`, MMAX);
    assert(cross.length === 0, 'Có biện pháp chứa vi phạm của học viên khác (B02)');
  });

  check('PR-J · DEMO #1 + #2 (v3) Vi phạm là mặc định; đúng hai vi phạm đã bị XOÁ và mỗi cái còn đúng MỘT dòng audit giữ nội dung đã xoá; cái của cô Hà mang nội dung "Không nộp bài Reading"', () => {
    const del = rows(`SELECT * FROM audit_logs WHERE action = 'violation.delete' AND entity_label LIKE 'Bộ demo · %'`);
    assert(del.length === 2, `Đúng hai vi phạm đã xoá trong bộ demo, đang có ${del.length}`);
    for (const a of del) {
      const b = JSON.parse(a.before_json);
      assert(a.actor_user_id && b.description && b.studentId && Array.isArray(b.measureIds), `Audit xoá thiếu người/nội dung: ${a.before_json}`);
      assert(!rows('SELECT id FROM violations WHERE id = ?', a.entity_id).length && !rows('SELECT 1 FROM measure_violations WHERE violation_id = ?', a.entity_id).length, `Vi phạm ${a.entity_id} đã xoá mà còn dòng`);
    }
    const g = del.find((a) => JSON.parse(a.before_json).studentId === HA);
    assert(g && /Không nộp bài Reading/.test(JSON.parse(g.before_json).description), 'Vi phạm đã xoá của Trần Thu Hà phải là "Không nộp bài Reading tuần này"');
    assert(rows('SELECT id FROM violations WHERE id <= ?', VMAX).length > 20, 'Phần lớn vi phạm còn nguyên');
  });

  check('PR-J · DEMO #3 + #4 Nguyễn Minh An có vi phạm của bốn giáo viên khác nhau và ba nhóm khác nhau (BTVN · Chuyên cần · Thái độ)', () => {
    const v = seedViolations(AN);
    assert(new Set(v.map((x) => x.reported_by)).size >= 4, `Cần vi phạm của ít nhất 4 giáo viên, có ${new Set(v.map((x) => x.reported_by)).size}`);
    const cats = new Set(v.map((x) => x.category));
    for (const c of ['homework', 'attendance', 'conduct']) assert(cats.has(c), `Thiếu nhóm ${c}`);
    /* Không có "đợt": bốn giáo viên báo cùng tuần vẫn là bốn dòng độc lập. */
    assert(v.length >= 7, 'Các vi phạm phải là dòng riêng, không gộp');
  });

  check('PR-J · DEMO #5 Một Report gia đình gom ĐÚNG 5 vi phạm khác nhóm, khác môn, khác giáo viên, khác ngày (Lê Quang Huy)', () => {
    const report = seedMeasures(HUY).find((m) => m.kind === 'family_report' && m.status === 'done');
    assert(report, 'Lê Quang Huy phải có một Report cho gia đình đã thực hiện');
    const ids = linksOf(report.id);
    assert(ids.length === 5, `Report phải gom đúng 5 vi phạm, đang ${ids.length}`);
    const vs = rows(`SELECT * FROM violations WHERE id IN (${ids.join(',')})`);
    assert(new Set(vs.map((v) => v.category)).size >= 3, 'Năm vi phạm phải thuộc ít nhất ba nhóm');
    assert(new Set(vs.map((v) => v.skill ?? '-')).size >= 3, 'Năm vi phạm phải thuộc ít nhất ba môn');
    assert(new Set(vs.map((v) => v.reported_by)).size >= 3, 'Năm vi phạm phải do ít nhất ba giáo viên ghi');
    assert(new Set(vs.map((v) => v.occurred_on)).size === 5, 'Năm vi phạm phải ở năm ngày khác nhau');
    assert(linksOf(report.id).length === 5, `Số vi phạm ĐANG GẮN của Report phải là 5, đang ${linksOf(report.id).length}`);
  });

  check('PR-J · DEMO #6 Sáu vi phạm của Lê Quang Huy đi vào cả ba biện pháp: Meeting với học viên, Report gia đình và Thư cảnh cáo lần 1', () => {
    const ms = seedMeasures(HUY);
    const meet = ms.find((m) => m.kind === 'meeting_student'), fam = ms.find((m) => m.kind === 'family_report'), w1 = ms.find((m) => m.kind === 'warning_1');
    assert(meet && fam && w1, 'Thiếu một trong ba biện pháp');
    const sixIds = linksOf(meet.id);
    assert(sixIds.length === 6, `Meeting phải chứa 6 vi phạm, đang ${sixIds.length}`);
    assert(sixIds.every((id) => linksOf(w1.id).includes(id)), 'Thư cảnh cáo lần 1 phải chứa cả sáu vi phạm đó');
    assert(sixIds.filter((id) => linksOf(fam.id).includes(id)).length === 5, 'Report chứa năm trong sáu vi phạm đó');
  });

  check('PR-J · DEMO #7 Biện pháp Đang chuẩn bị được thêm vi phạm SAU khi tạo: liên kết có ngày muộn hơn ngày tạo và vi phạm mang dòng lịch sử (Nguyễn Minh An)', () => {
    const m = seedMeasures(AN).find((x) => x.status === 'preparing' && x.kind === 'family_report');
    assert(m, 'Nguyễn Minh An phải có một Report gia đình đang chuẩn bị');
    const late = rows('SELECT * FROM measure_violations WHERE measure_id = ? AND substr(added_at,1,10) > substr(?,1,10)', m.id, m.created_at);
    assert(late.length === 1, `Đúng một vi phạm được thêm sau lúc tạo, đang ${late.length}`);
    assert(rows(`SELECT * FROM violation_history WHERE violation_id = ? AND field = 'measure' AND new_value = ?`, late[0].violation_id, String(m.id)).length === 1,
      'Việc thêm vào biện pháp phải có dòng lịch sử ở vi phạm');
    assert(m.confirmed_at === null && m.performed_on === null, 'Biện pháp đang chuẩn bị chưa được có ngày thực hiện hay người xác nhận');
  });

  check('PR-J · DEMO #8 Vi phạm bị bỏ khỏi biện pháp: có dòng lịch sử thêm rồi bỏ, và nó quay lại Chưa xử lý (Trần Thu Hà)', () => {
    const back = seedViolations(HA).filter((v) => !rows('SELECT 1 FROM measure_violations WHERE violation_id = ?', v.id).length)
      .find((v) => rows(`SELECT * FROM violation_history WHERE violation_id = ? AND field = 'measure'`, v.id).length === 2);
    assert(back, 'Trần Thu Hà phải có một vi phạm đã được thêm rồi bỏ khỏi biện pháp');
    const h = rows(`SELECT * FROM violation_history WHERE violation_id = ? AND field = 'measure' ORDER BY id`, back.id);
    assert(h[0].old_value === null && h[0].new_value && h[1].old_value === h[0].new_value && h[1].new_value === null, 'Dòng lịch sử phải là thêm (∅ → biện pháp) rồi bỏ (biện pháp → ∅)');
    assert(yThucMetric(loadPrincipal(1), 'vi-pham-chua-xu-ly').ids.includes(back.id), 'Vi phạm đã bỏ khỏi biện pháp phải tính lại là Chưa xử lý');
  });

  check('PR-J · DEMO #9 Thư cảnh cáo 1 → 2 → 3 đúng thứ tự, ba ngày khác nhau, mỗi thư có tệp đính kèm (Phạm Bảo Ngọc)', () => {
    const w = seedMeasures(NGOC).filter((m) => /^warning_[123]$/.test(m.kind) && m.status === 'done');
    assert(w.map((m) => m.kind).join() === 'warning_1,warning_2,warning_3', `Ba thư đúng thứ tự, đang ${w.map((m) => m.kind).join()}`);
    assert(new Set(w.map((m) => m.performed_on)).size === 3 && w[0].performed_on < w[1].performed_on && w[1].performed_on < w[2].performed_on, 'Ba thư phải ở ba ngày tăng dần');
    for (const m of w) {
      assert(one(`SELECT COUNT(*) n FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ?`, m.id).n >= 1, `Thư ${m.kind} thiếu tệp đính kèm (B06)`);
    }
    assert(new Set(w.map((m) => m.cycle_id)).size === 1, 'Ba thư cùng một lộ trình');
  });

  check('PR-J · DEMO #10 Ít nhất ba em có cảnh báo quá 5 ngày, cái cũ nhất 6–9 ngày; đúng 5 ngày thì chưa cảnh báo; câu cảnh báo đúng số', () => {
    const w = warningsFor([AN, HA, HUY, NGOC, VAN, YEN, KIEN], TODAY);
    const active = [AN, VAN, YEN].filter((s) => w.get(s)?.active);
    assert(active.length === 3, `Nguyễn Minh An, Đặng Thu Vân, Ngô Hải Yến phải đang có cảnh báo; có ${active.length}`);
    assert(w.get(AN)!.oldestAgeDays === 9 && w.get(AN)!.count === 4 && w.get(AN)!.message === 'Chưa xử lý 4 vi phạm · cũ nhất 9 ngày', `An: ${w.get(AN)!.message}`);
    assert(w.get(VAN)!.oldestAgeDays === 8, `Vân phải 8 ngày, đang ${w.get(VAN)!.oldestAgeDays}`);
    assert(w.get(YEN)!.oldestAgeDays === 6, `Yến phải 6 ngày, đang ${w.get(YEN)!.oldestAgeDays}`);
    for (const s of [HA, KIEN]) assert(w.get(s)!.oldestAgeDays === 5 && !w.get(s)!.active, 'Vi phạm chưa xử lý đúng 5 ngày thì CHƯA cảnh báo (ngưỡng là quá 5 ngày)');
    for (const s of [HUY, NGOC]) assert(!w.get(s)!.active, 'Em đã xử lý hết thì không cảnh báo');
    /* Hàm chỉ số hv-can-xu-ly là CÙNG hàm cảnh báo. */
    const stat = yThucMetric(loadPrincipal(1), 'hv-can-xu-ly').ids;
    for (const s of [AN, VAN, YEN]) assert(stat.includes(s), `hv-can-xu-ly thiếu em ${s}`);
  });

  check('PR-J · DEMO #11 + #12 + #13 + #14 + #15 Case học thuật giữ nguyên: mức Bình thường và mức Gấp; SOS chỉ ghi nhận có LÝ DO; SOS gắn vào case đang mở; GV tạo case trực tiếp không có tín hiệu', () => {
    assert(one(`SELECT COUNT(*) n FROM sos_cases WHERE urgency = 'attention' AND id <= ?`, t.seedMax.sos_cases).n > 0, '#11 Không có case học thuật mức Bình thường');
    assert(one(`SELECT COUNT(*) n FROM sos_cases WHERE urgency = 'urgent' AND origin_kind = 'teacher_report' AND id <= ?`, t.seedMax.sos_cases).n > 0, '#12 Không có case học thuật mức Gấp');
    const noted = rows(`SELECT resolution_note FROM case_signals WHERE status = 'noted'`);
    assert(noted.length > 0 && noted.every((s) => s.resolution_note && s.resolution_note.trim().length > 0), '#13 Mọi tín hiệu "ghi nhận, không tạo case" phải kèm lý do');
    const linked = rows(`SELECT sg.case_id, sc.status FROM case_signals sg JOIN sos_cases sc ON sc.id = sg.case_id WHERE sg.status = 'linked'`);
    assert(linked.some((s) => s.status !== 'done'), '#14 Không có tín hiệu nào gắn vào case đang mở');
    const direct = rows(`SELECT sc.id FROM sos_cases sc WHERE sc.origin_kind = 'teacher_report' AND sc.id <= ? AND NOT EXISTS (SELECT 1 FROM case_signals sg WHERE sg.case_id = sc.id)`, t.seedMax.sos_cases);
    assert(direct.length > 0, '#15 Không có case học thuật do GV tạo trực tiếp (không qua tín hiệu)');
  });

  check('PR-J · DEMO #16 (v3) Vi phạm bị XOÁ sau khi các biện pháp đã thực hiện: biện pháp giữ nguyên với số vi phạm ĐANG GẮN, có một dòng audit ghi các biện pháp bị gỡ (Lê Quang Huy)', () => {
    const meet = seedMeasures(HUY).find((m) => m.kind === 'meeting_student');
    const report = seedMeasures(HUY).find((m) => m.kind === 'family_report' && m.status === 'done');
    const del = rows(`SELECT * FROM audit_logs WHERE action = 'violation.delete' AND before_json LIKE ?`, `%"studentId":${HUY},%`);
    assert(del.length === 1 && meet.status === 'done', 'Phải có đúng một vi phạm của Huy đã bị xoá, nằm trong biện pháp đã thực hiện');
    const b = JSON.parse(del[0].before_json);
    assert(b.measureIds.includes(meet.id) && b.measureIds.includes(report.id) && del[0].created_at.slice(0, 10) > meet.performed_on, 'Vi phạm bị xoá SAU khi biện pháp đã thực hiện, và audit ghi các biện pháp bị gỡ');
    assert(linksOf(meet.id).length === 6 && linksOf(report.id).length === 5, `Số vi phạm đang gắn: ${linksOf(meet.id).length} / ${linksOf(report.id).length}`);
  });

  check('PR-J · DEMO #17 Một vi phạm nằm trong HAI biện pháp ở HAI thời điểm khác nhau — nhiều–nhiều thật (Lê Quang Huy)', () => {
    const shared = rows(
      `SELECT mv.violation_id, COUNT(DISTINCT dm.id) n, COUNT(DISTINCT dm.performed_on) days FROM measure_violations mv JOIN discipline_measures dm ON dm.id = mv.measure_id
        WHERE dm.student_id = ? AND dm.id <= ? GROUP BY mv.violation_id HAVING n >= 2 AND days >= 2`, HUY, MMAX);
    assert(shared.length >= 1, 'Phải có vi phạm nằm trong ít nhất hai biện pháp thực hiện ở hai ngày khác nhau');
    assert(shared.some((r) => r.n >= 2 && r.days >= 2 && one('SELECT COUNT(DISTINCT measure_id) n FROM measure_violations WHERE violation_id = ?', r.violation_id).n === r.n), 'Liên kết phải đọc được từ phía vi phạm');
  });

  check('PR-J · DEMO #18 Em chuyển lộ trình sau khi đã có Thư cảnh cáo lần 2: chuỗi reset — lần 1 chọn lại được, lần 2 khóa (Trần Hải Kiên)', () => {
    const ms = seedMeasures(KIEN).filter((m) => /^warning_[123]$/.test(m.kind));
    assert(ms.map((m) => m.kind).join() === 'warning_1,warning_2', `Kiên phải có thư 1 và 2 ở lộ trình cũ, đang ${ms.map((m) => m.kind).join()}`);
    const cur = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, KIEN).id;
    assert(ms.every((m) => m.cycle_id !== cur), 'Hai thư phải thuộc lộ trình CŨ, không phải lộ trình đang học');
    assert(one('SELECT status FROM learning_cycles WHERE id = ?', ms[0].cycle_id).status === 'completed', 'Lộ trình cũ đã khép');
    const av = Object.fromEntries(measureKindAvailability(loadPrincipal(1), KIEN).map((k: any) => [k.kind, k]));
    assert(av.warning_1.available, 'Sang lộ trình mới thì Thư cảnh cáo lần 1 chọn lại được');
    assert(!av.warning_2.available && av.warning_2.reason, 'Lần 2 vẫn khóa kèm lý do tại dòng');
    assert(!av.warning_3.available, 'Lần 3 vẫn khóa');
  });
  }

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
    assert(domain.MEASURE_KIND_LABEL.warning_1 === 'Thư cảnh cáo lần 1' && domain.MEASURE_KIND_LABEL.meeting_cx === 'CX / GĐCN meeting với HV / PH'
      && domain.MEASURE_KIND_LABEL.suspension === 'Đình chỉ học', 'Nhãn sai');
    for (const k of domain.MEASURE_KINDS) assert(domain.MEASURE_KIND_LABEL[k], `Loại ${k} thiếu nhãn`);
  });

  check('PR-J · J2 Hai trạng thái biện pháp (không có chờ duyệt) và bốn trạng thái hiển thị của vi phạm', () => {
    assert(JSON.stringify(domain.MEASURE_STATUSES) === JSON.stringify(['preparing', 'done']), 'Chỉ có preparing và done (Y01: không có cửa duyệt)');
    assert(domain.MEASURE_STATUS_LABEL.preparing === 'Đang chuẩn bị' && domain.MEASURE_STATUS_LABEL.done === 'Đã thực hiện', 'Nhãn trạng thái biện pháp');
    assert(JSON.stringify(domain.VIOLATION_STATE_LABEL) === JSON.stringify({
      unhandled: 'Chưa xử lý', preparing: 'Đang chuẩn bị xử lý', handled: 'Đã xử lý',
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
    assert(need('other') === 'Cần ghi tên phương án xử lý', 'Loại Khác phải có tên');
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
    assert(six.message === 'Chưa xử lý 4 vi phạm · cũ nhất 6 ngày', `Câu cảnh báo sai: ${six.message}`);
    assert(domain.violationAgeLabel(9) === '9 ngày' && domain.violationAgeLabel(2) === '', 'W06: tuổi ⚠9n cạnh từng vi phạm quá 5 ngày');
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

  check('PR-NEN · V05 (bản T13) Nhóm `Khác` cần ô Ghi rõ ≥ 3 ký tự, ghép vào đầu mô tả; nhóm khác thì 10 là đủ', () => {
    const st = makeStudent('V05');
    assertThrows(() => record(gvbm, st.id, { category: 'other', description: 'Không mang sách buổi 12' }), /Ghi rõ "Khác" là gì/, 'Khác không ghi rõ');
    assertThrows(() => record(gvbm, st.id, { category: 'other', description: 'Không mang sách buổi 12', ghiRoKhac: 'ab' }), /ít nhất 3 ký tự/, 'Ghi rõ 2 ký tự');
    const ok = record(gvbm, st.id, { category: 'other', description: 'Không mang sách buổi 12', ghiRoKhac: 'Quên sách' });
    assert(ok.violation.category === 'other', 'Khác có ghi rõ ≥ 3 ký tự phải được nhận');
    assert(ok.violation.description === 'Quên sách — Không mang sách buổi 12', `Ghép ghi rõ vào mô tả: ${ok.violation.description}`);
    /* Sửa lại mô tả đã có tiền tố mà không gửi ghiRoKhac: tiền tố đủ làm chữ "Khác", không ghép hai lần. */
    const sua = viol.editViolation(gvbm, ok.violation.id, { description: 'Quên sách — Không mang sách buổi 12 và 13' }) as any;
    assert(sua.description === 'Quên sách — Không mang sách buổi 12 và 13', `Sửa không ghép hai lần: ${sua.description}`);
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
    viol.deleteViolation(P.mbManager, vid(first));
    viol.deleteViolation(P.mbManager, vid(second));
    assert((viol.similarViolations(gvbm, { studentId: st.id, category: 'homework', occurredOn: TODAY }) as any[]).length === 0, 'Vi phạm đã xoá không tính là trùng');
  });

  check('PR-J · V07 Gửi lại cùng một request (idempotency_key) không tạo dòng thứ hai', () => {
    const st = makeStudent('V07');
    const a = record(gvbm, st.id, { idempotencyKey: 'pj-v07-key' });
    /* Đếm audit TRƯỚC và SAU lần gửi lại: mã vi phạm có thể tái dùng sau khi một vi phạm cao nhất bị xoá (V13′) nên không đếm theo mã một mình. */
    const auditOf = () => one("SELECT COUNT(*) n FROM audit_logs WHERE action = 'violation.record' AND entity_id = ?", vid(a));
    const auditBefore = auditOf();
    const b = record(gvbm, st.id, { idempotencyKey: 'pj-v07-key' });
    assert(vid(a) === vid(b), 'Cùng khoá phải trả về cùng vi phạm');
    assert(one('SELECT COUNT(*) n FROM violations WHERE student_id = ?', st.id) === 1, 'Chỉ một dòng');
    assert(auditOf() === auditBefore, 'Thử lại không ghi audit thêm');
  });

  check('PR-J · V07 (rà soát) Khoá gửi lại chỉ phát lại cho ĐÚNG người, ĐÚNG học viên — dùng khoá của bản ghi khác thì bị từ chối, không lộ vi phạm của em khác', () => {
    const a = makeStudent('V07 khóa A'), b = makeStudent('V07 khóa B');
    const first = record(gvbm, a.id, { idempotencyKey: 'pj-v07-scope' });
    assertThrows(() => record(gvbm, b.id, { idempotencyKey: 'pj-v07-scope' }), /khoá|đã dùng/i, 'Cùng khoá cho học viên khác phải bị từ chối');
    assertThrows(() => record(gvbm2, a.id, { idempotencyKey: 'pj-v07-scope' }), /khoá|đã dùng/i, 'Người khác dùng khoá của người ghi phải bị từ chối');
    assert(one('SELECT COUNT(*) n FROM violations WHERE student_id = ?', b.id) === 0, 'Bị từ chối mà vẫn ghi vi phạm cho em B');
    assert(vid(record(gvbm, a.id, { idempotencyKey: 'pj-v07-scope' })) === vid(first), 'Người ghi gửi lại đúng khoá cho đúng em vẫn phải nhận lại bản cũ');
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

  console.log('\nPR-J · 4. Sửa vi phạm (V09–V10) — phần xoá (V11′–V14′) do PR-T thay, xem sosV3.tests.ts');

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
    assertThrows(() => viol.editViolation(gvbm, v, { category: 'other' }), /Ghi rõ "Khác"/, 'Đổi sang Khác mà không ghi rõ Khác là gì');
    assertThrows(() => viol.editViolation(gvbm, v, { occurredOn: addDays(TODAY, 3) }), /tương lai/, 'Đổi sang ngày tương lai');
    assertThrows(() => viol.editViolation(gvbm, v, { occurredOn: '2026-99-99' }), /Ngày xảy ra/, 'Đổi sang ngày sai định dạng');
    const again = viol.editViolation(gvbm, v, { description: 'Mô tả sửa lần ba, vẫn hợp lệ' }) as any;
    assert(again.id === v && again.description === 'Mô tả sửa lần ba, vẫn hợp lệ', 'Sửa phải trả về bản ghi mới');
  });

  check('PR-NEN · V09 vi phạm "Khác" CŨ (mô tả không có tiền tố Ghi rõ) vẫn đổi được ngày/môn khi form gửi lại nguyên nhóm + mô tả', () => {
    const st = makeStudent('V09K');
    const v = vid(record(gvbm, st.id, { description: 'Mô tả cũ không có tiền tố' }));
    conn.prepare(`UPDATE violations SET category = 'other' WHERE id = ?`).run(v); // dữ liệu trước T13: Khác không có Ghi rõ
    const sua = viol.editViolation(gvbm, v, {
      category: 'other', description: 'Mô tả cũ không có tiền tố', occurredOn: addDays(TODAY, -1), skill: 'reading',
    }) as any;
    assert(sua.description === 'Mô tả cũ không có tiền tố' && sua.category === 'other', `Mô tả/nhóm phải giữ nguyên: ${JSON.stringify(sua)}`);
    const row = conn.prepare('SELECT occurred_on, skill FROM violations WHERE id = ?').get(v) as any;
    assert(row.occurred_on === addDays(TODAY, -1) && row.skill === 'reading', `Ngày/môn phải đổi: ${JSON.stringify(row)}`);
    assertThrows(() => viol.editViolation(gvbm, v, { category: 'other', description: 'Mô tả cũ đã sửa lại khác đi' }), /Ghi rõ "Khác"/, 'Đổi mô tả của Khác cũ thì phải ghi rõ');
  });

  check('PR-J · V10 Ai sửa hoặc xoá được: người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi — GV khác không sửa được vi phạm đồng nghiệp', () => {
    const st = makeStudent('V10');
    const v = vid(record(gvbm, st.id, { description: 'Vi phạm do GV Writing 1 ghi' }));
    assertThrows(() => viol.editViolation(gvbm2, v, { description: 'GV Writing 2 sửa hộ đồng nghiệp' }), /không có quyền|người ghi|chủ nhiệm/, 'Đồng nghiệp sửa được vi phạm của người khác');
    assertThrows(() => viol.deleteViolation(gvbm2, v), /không có quyền|người ghi|chủ nhiệm/, 'Đồng nghiệp xoá được vi phạm của người khác');
    assertThrows(() => viol.editViolation(outsider, v, { description: 'Người ngoài lớp sửa' }), /phạm vi|quyền/, 'Giáo viên ngoài lớp sửa được');
    assertThrows(() => viol.editViolation(P.cpManager, v, { description: 'Quản lý chi nhánh khác sửa' }), /phạm vi|quyền/, 'Quản lý chi nhánh khác sửa được');
    viol.editViolation(gvbm, v, { description: 'Người ghi tự sửa lỗi của chính mình' });
    viol.editViolation(gvcn, v, { description: 'GVCN của lớp sửa vi phạm của GVBM' });
    viol.editViolation(P.mbManager, v, { description: 'Quản lý trong phạm vi sửa vi phạm' });
    viol.editViolation(P.admin, v, { description: 'Quản trị hệ thống sửa vi phạm' });
    const other = vid(record(gvbm2, st.id, { description: 'Vi phạm do GV Writing 2 ghi' }));
    viol.deleteViolation(gvcn, other);
    const mine = vid(record(gvbm, st.id, { description: 'Vi phạm của mình ghi nhầm em', category: 'conduct' }));
    viol.deleteViolation(gvbm, mine);
    assert(one('SELECT COUNT(*) n FROM violations WHERE id IN (?, ?)', other, mine) === 0, 'Cả hai phải đã bị xoá');
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

  check('PR-J · B01 (rà soát) Khoá gửi lại của biện pháp cũng chỉ phát lại đúng người, đúng học viên', () => {
    const a = makeStudent('B01 khóa A'), b = makeStudent('B01 khóa B');
    const va = record(gvbm, a.id), vb = record(gvbm, b.id);
    const first = meas.createMeasure(gvcn, { studentId: a.id, kind: 'talk_short', violationIds: [vid(va)], idempotencyKey: 'pj-b01-scope' });
    assertThrows(() => meas.createMeasure(gvcn, { studentId: b.id, kind: 'talk_short', violationIds: [vid(vb)], idempotencyKey: 'pj-b01-scope' }), /khoá|đã dùng/i, 'Cùng khoá cho học viên khác phải bị từ chối');
    assertThrows(() => meas.createMeasure(P.mbManager, { studentId: a.id, kind: 'talk_short', violationIds: [vid(va)], idempotencyKey: 'pj-b01-scope' }), /khoá|đã dùng/i, 'Người khác dùng khoá phải bị từ chối');
    assert(meas.createMeasure(gvcn, { studentId: a.id, kind: 'talk_short', violationIds: [vid(va)], idempotencyKey: 'pj-b01-scope' }).id === first.id, 'Đúng người, đúng em gửi lại thì nhận lại bản cũ');
  });

  check('PR-J · B02 Một biện pháp có ÍT NHẤT MỘT vi phạm và của ĐÚNG MỘT học viên; vi phạm đã xoá không còn để gom', () => {
    const a = makeStudent('B02 A'), b = makeStudent('B02 B');
    const va = violations(a.id, 2), vb = violations(b.id, 1);
    assertThrows(() => mk(gvcn, a.id, 'talk_short', []), /ít nhất một vi phạm/, 'Biện pháp không có vi phạm nào');
    assertThrows(() => mk(gvcn, a.id, 'talk_short', [va[0], vb[0]]), /một học viên/, 'Gom vi phạm của hai em');
    assertThrows(() => mk(gvcn, a.id, 'talk_short', [999999]), /Không tìm thấy/, 'Vi phạm không tồn tại');
    viol.deleteViolation(gvcn, va[1]);
    assertThrows(() => mk(gvcn, a.id, 'talk_short', [va[1]]), /Không tìm thấy/, 'Gom vi phạm đã xoá');
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
    assertThrows(() => mk(gvcn, st.id, 'severe', ids), /loại phương án/i, 'Loại lạ');
    assertThrows(() => mk(gvcn, st.id, 'other', ids), /tên phương án/i, 'Loại Khác mà không có tên');
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
    assertThrows(() => meas.updateMeasure(gvcn, m.id, { kind: 'other', customName: '' }), /tên phương án/, 'Khác mà xóa tên');
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
    /*
     * K2-6d (PR-Form, Q9): thiếu người thực hiện KHÔNG còn báo lỗi — máy chủ tự lấy người đang xác nhận.
     * Dùng một biện pháp KHÁC (`talk2`) để không tiêu thụ mất `talk`, thứ các dòng dưới còn cần dùng tiếp.
     */
    const talk2 = mk(gvcn, st.id, 'talk_short', ids);
    const noPerformer = meas.confirmMeasure(gvcn, talk2.id, { performedOn: TODAY, note: 'Gặp em cuối buổi' } as any) as any;
    assert(
      noPerformer.status === 'done' && noPerformer.performedBy === gvcn.userId,
      `K2-6d: thiếu người thì performed_by = người xác nhận: ${JSON.stringify(noPerformer)}`,
    );
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

  check('PR-J · B16 (v3) Report gia đình gom 5 vi phạm là MỘT biện pháp; số vi phạm của biện pháp là số ĐANG GẮN — xoá một vi phạm sau đó thì số giảm theo (V14′)', () => {
    const st = makeStudent('B16');
    const five = violations(st.id, 5);
    const m = mk(gvcn, st.id, 'family_report', five);
    assert(m.violationCount === 5, 'Chưa xác nhận: đã hiện số đang gắn');
    const done = confirm(gvcn, m.id);
    assert(one('SELECT COUNT(*) n FROM discipline_measures WHERE student_id = ? AND status = ?', st.id, 'done') === 1, 'Một Report gom 5 vi phạm là MỘT biện pháp');
    assert(done.violationCount === 5 && done.violations.length === 5, 'Số đang gắn phải là 5');
    assert((conn.prepare('SELECT violation_count_at_confirm v FROM discipline_measures WHERE id = ?').get(m.id) as any).v === null, 'Cột ảnh chụp cũ không còn được ghi');
    viol.deleteViolation(gvcn, five[2]);
    const after = meas.measureDetail(gvcn, m.id) as any;
    assert(after.violationCount === 4 && after.violations.length === 4 && after.status === 'done', `Số đang gắn phải giảm: ${after.violationCount}`);
    assert(one("SELECT COUNT(*) n FROM measure_violations WHERE measure_id = ? AND violation_id = ?", m.id, five[2]) === 0, 'Dòng nối đã gỡ');
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
    assert(w.message === 'Chưa xử lý 4 vi phạm · cũ nhất 9 ngày', `Câu cảnh báo sai: ${w.message}`);
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

  check('PR-J · W04 (v3) Vi phạm đã xoá không còn trong tập cần xử lý — xoá cái cũ nhất thì cảnh báo đổi theo cái cũ nhất còn lại', () => {
    const s = withUnhandled('W04', [10, 4, 3]);
    assert((warn.studentWarning(gvcn, s.id) as any).oldestAgeDays === 10, 'Trước khi hủy');
    viol.deleteViolation(gvcn, s.ids[0]);
    const w = warn.studentWarning(gvcn, s.id) as any;
    assert(w.count === 2 && w.active === false && w.oldestAgeDays === 4, `Xoá vi phạm cũ nhất: còn 2, cũ nhất 4 ngày, hết cảnh báo: ${JSON.stringify(w)}`);
    const only = withUnhandled('W04 chỉ một', [20]);
    viol.deleteViolation(gvcn, only.ids[0]);
    assert((warn.studentWarning(gvcn, only.id) as any).count === 0, 'Chỉ có một vi phạm và nó đã xoá: không còn gì cần xử lý');
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
    assert(board.message === '2 học viên có vi phạm chưa xử lý quá 5 ngày', `Câu đầu tab sai: ${board.message}`);
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
    assert(by(s.ids[0]).ageLabel === '9 ngày' && by(s.ids[1]).ageLabel === '6 ngày' && by(s.ids[2]).ageLabel === '', `Nhãn tuổi sai: ${rows.map((r) => r.ageLabel).join(' | ')}`);
    mk(gvcn, s.id, 'talk_short', [s.ids[0]]);
    assert(by(s.ids[0]).ageLabel === '9 ngày' && (viol.listViolations(gvcn, { studentId: s.id }) as any).rows.find((r: any) => r.id === s.ids[0]).ageLabel === '',
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

  check('PR-J · J6 Sổ chỉ số có đủ bảy chỉ số Ý thức (v3 bỏ `vi-pham-khong-hieu-luc`) đúng đơn vị và loại thời gian; không còn "Tái diễn Ý thức"; ba đơn vị (vi phạm · học viên · biện pháp) khác nhau', () => {
    const want: Record<string, [string, string]> = {
      'vi-pham-tong': ['vi-pham', 'phat-sinh-trong-ky'], 'vi-pham-chua-xu-ly': ['vi-pham', 'hien-trang'],
      'hv-co-vi-pham': ['hoc-vien', 'phat-sinh-trong-ky'],
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

  check('PR-J · J6 `vi-pham-tong`: đếm theo NGÀY XẢY RA không theo ngày ghi nhận; vi phạm đã xoá không còn trong tập', () => {
    const st = makeStudent('J6 tổng');
    const old = vid(record(gvbm, st.id, { occurredOn: addDays(TODAY, -40), description: 'Vi phạm xảy ra từ 40 ngày trước, mới ghi hôm nay' }));
    const recent = vid(record(gvbm, st.id, { occurredOn: addDays(TODAY, -2), category: 'attendance', description: 'Vi phạm mới xảy ra hai ngày trước' }));
    const bad = vid(record(gvbm, st.id, { occurredOn: addDays(TODAY, -1), category: 'conduct', description: 'Vi phạm sẽ bị xoá ngay sau đó' }));
    viol.deleteViolation(gvcn, bad);
    const week = ms(P.mbManager, 'vi-pham-tong', { branchId: mbId, from: addDays(TODAY, -7), to: TODAY });
    assert(week.ids.includes(recent) && !week.ids.includes(old) && !week.ids.includes(bad), 'Kỳ 7 ngày: có vi phạm mới, KHÔNG có vi phạm 40 ngày trước dù ghi hôm nay, KHÔNG có vi phạm đã xoá');
    const all = ms(P.mbManager, 'vi-pham-tong', { branchId: mbId });
    assert(all.ids.includes(old) && all.ids.includes(recent) && !all.ids.includes(bad), 'Không giới hạn kỳ: có cả hai, vẫn không có vi phạm đã xoá');
    assert(all.n === all.ids.length && all.unit === 'vi-pham', 'Số phải là độ dài của tập ID và có đơn vị vi phạm');
    const truth = ids(`SELECT v.id FROM violations v JOIN classes c ON c.id = v.class_id WHERE c.branch_id = ? ORDER BY v.id`, mbId);
    assert(JSON.stringify([...all.ids].sort((a: number, b: number) => a - b)) === JSON.stringify(truth), 'Tập ID phải bằng sự thật độc lập dựng bằng SQL');
  });

  check('PR-J · J6 `vi-pham-chua-xu-ly`: không nằm trong biện pháp nào (kể cả đang chuẩn bị); vi phạm đã xoá không còn', () => {
    const st = makeStudent('J6 chưa xử lý');
    const [a, b, c, d] = violations(st.id, 4);
    viol.deleteViolation(gvcn, d);
    const before = ms(P.mbManager, 'vi-pham-chua-xu-ly', { branchId: mbId });
    assert([a, b, c].every((x) => before.ids.includes(x)) && !before.ids.includes(d), 'Ba vi phạm chưa xử lý, vi phạm đã xoá thì không');
    const m = mk(gvcn, st.id, 'talk_short', [a, b]);
    const mid = ms(P.mbManager, 'vi-pham-chua-xu-ly', { branchId: mbId });
    assert(!mid.ids.includes(a) && !mid.ids.includes(b) && mid.ids.includes(c), 'Vào biện pháp đang chuẩn bị là ra khỏi tập chưa xử lý (W03)');
    meas.removeViolation(gvcn, m.id, b);
    assert(ms(P.mbManager, 'vi-pham-chua-xu-ly', { branchId: mbId }).ids.includes(b), 'Bỏ ra khỏi biện pháp thì quay lại');
    const truth = ids(`SELECT v.id FROM violations v WHERE ${NOW_BRANCH} = ?
                          AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = v.id) ORDER BY v.id`, mbId);
    const now = ms(P.mbManager, 'vi-pham-chua-xu-ly', { branchId: mbId });
    assert(JSON.stringify([...now.ids].sort((x: number, y: number) => x - y)) === JSON.stringify(truth), 'Tập ID phải bằng sự thật độc lập');
    assert(now.n === now.ids.length, 'Số = độ dài tập');
  });

  check('PR-J · J6 `hv-co-vi-pham`: đếm DUY NHẤT học viên có vi phạm — em có ba vi phạm vẫn là MỘT học viên; em chỉ có vi phạm đã xoá thì không', () => {
    const many = makeStudent('J6 nhiều'), onlyBad = makeStudent('J6 chỉ xoá');
    violations(many.id, 3);
    const [x] = violations(onlyBad.id, 1);
    viol.deleteViolation(gvcn, x);
    const r = ms(P.mbManager, 'hv-co-vi-pham', { branchId: mbId });
    assert(r.ids.filter((id: number) => id === many.id).length === 1 && r.ids.includes(many.id), 'Em có ba vi phạm xuất hiện đúng một lần');
    assert(!r.ids.includes(onlyBad.id), 'Em chỉ có vi phạm đã xoá không được đếm');
    assert(r.unit === 'hoc-vien' && r.n === r.ids.length && new Set(r.ids).size === r.ids.length, 'Đơn vị học viên, số = độ dài tập, không trùng');
    const truth = ids(`SELECT DISTINCT v.student_id AS id FROM violations v JOIN classes c ON c.id = v.class_id WHERE c.branch_id = ? ORDER BY v.student_id`, mbId);
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
        WHERE ${NOW_BRANCH} = ? AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = v.id)
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

  await t.checkAsync('PR-J · J8 Kho tệp có nơi chủ cho vi phạm và biện pháp: quyền xem = quyền xem học viên, quyền thêm/gỡ = quyền sửa bản ghi chủ (B10: biện pháp đã thực hiện vẫn bổ sung được)', async () => {
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
    await attachmentsSvc.removeAttachment(gvbm, own.id);
    /* Biện pháp: GVBM đọc được, không thêm được; GVCN thêm được kể cả khi đã thực hiện. */
    const m = mk(gvcn, st.id, 'talk_short', [v]);
    assertThrows(() => attachmentsSvc.addLink(gvbm, { ownerType: 'discipline_measure', ownerId: m.id, url: 'https://example.com/y', displayName: 'y' }), /quyền/, 'GVBM thêm được bằng chứng cho biện pháp');
    const file = link(gvcn, m.id, 'Ghi chú cuộc gặp') as any;
    assert((attachmentsSvc.listAttachments(gvbm, 'discipline_measure', m.id) as any[]).length === 1, 'GVBM đọc được bằng chứng của biện pháp');
    confirm(gvcn, m.id);
    assert(link(gvcn, m.id, 'Bổ sung sau khi thực hiện').id > 0, 'Biện pháp đã thực hiện vẫn bổ sung được bằng chứng');
    await attachmentsSvc.removeAttachment(gvcn, file.id);
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
    assert(rowA.violations.map((v: any) => v.ageLabel).join() === '9 ngày,6 ngày,', `Tuổi cạnh từng vi phạm (W06): ${rowA.violations.map((v: any) => v.ageLabel).join()}`);
    assert(bd.warning.activeCount === 2 && bd.warning.message === '2 học viên có vi phạm chưa xử lý quá 5 ngày', `Đầu tab: ${bd.warning.message}`);
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

  check('PR-J · W05 (chủ sản phẩm chốt 21/09) Vấn đề Ý thức ĐI THEO HỌC VIÊN sang lớp mới: vi phạm chưa xử lý và biện pháp đang chuẩn bị hiện ở tab lớp mới, cảnh báo giữ nguyên số ngày', () => {
    const st = makeStudent('mang sang lớp mới');
    viol.recordViolation(gvbm, { studentId: st.id, category: 'homework', description: 'Không nộp bài Writing Task 2 tuần trước', occurredOn: addDays(TODAY, -8) } as any) as any;
    const kept = viol.recordViolation(gvbm, { studentId: st.id, category: 'attendance', description: 'Nghỉ một buổi không xin phép', occurredOn: addDays(TODAY, -2) } as any) as any;
    const prep = meas.createMeasure(gvcn, { studentId: st.id, kind: 'talk_short', violationIds: [kept.violation.id] });
    /* Em chuyển sang lớp khác cùng chi nhánh: ghi danh cũ đóng, ghi danh mới mở. */
    const newCls = t.classId('MB-FT 102');
    conn.prepare("UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND status = 'active'").run(TODAY, st.id);
    conn.prepare("INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?, ?, 'active', ?, ?)").run(st.id, newCls, TODAY, TODAY + 'T00:00:00.000Z');
    const gvcnNew = loadPrincipal((conn.prepare("SELECT user_id AS id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1").get(newCls) as any).id);
    const b = board.classViolationBoard(gvcnNew, newCls) as any;
    const row = b.unhandled.students.find((s: any) => s.studentId === st.id);
    assert(row && row.count === 1 && row.oldestAgeDays === 8 && row.warningActive, `Vi phạm cũ chưa xử lý phải hiện ở lớp mới với đủ 8 ngày: ${JSON.stringify(row)}`);
    assert(b.preparing.some((m: any) => m.id === prep.id), 'Biện pháp đang chuẩn bị tạo ở lớp cũ phải hiện ở lớp mới — GVCN mới xử lý tiếp được');
    const w = (warn.classWarning(gvcnNew, newCls) as any).students.find((s: any) => s.studentId === st.id);
    assert(w && w.active && w.count === 1, 'Cảnh báo của lớp mới phải tính cả vi phạm ghi ở lớp cũ');
    assert((meas.confirmMeasure(gvcnNew, prep.id, { performedOn: TODAY, performerName: 'GVCN mới', note: 'Trao đổi với em sau khi chuyển lớp.' } as any) as any).status === 'done', 'GVCN lớp mới xác nhận được biện pháp còn dở');
  });

  // ================================================================== PR-K3: rà soát sau PR-K2 (§7.1 "Gần đây" theo học viên, canRecord)

  console.log('\nPR-K3 · 14. Rà soát PR-K2: "Gần đây" theo từng học viên, canRecord của bảng ba khu vực (K3-1, K3-5)');

  const permsMod = await import('../permissions.ts');

  check('PR-K3 · K3-1 (§7.1) Bảng ba khu vực trả recentByStudent: tối đa 3 biện pháp MỚI NHẤT của TỪNG học viên, không phải của cả lớp', () => {
    const cls = makeClassForWarnings('MB-FT PK31');
    const who = loadPrincipal(cls.gvcn);
    const a = makeStudent('K31 A', cls.id);
    const b = makeStudent('K31 B', cls.id);
    /* A: một biện pháp cũ đã thực hiện. */
    const va = vid(record(who, a.id, { occurredOn: addDays(TODAY, -20), description: 'Vi phạm cũ của A dùng để tạo biện pháp thử' }));
    confirm(who, mk(who, a.id, 'talk_short', [va]).id, { performedOn: addDays(TODAY, -19) });
    /* B: bốn biện pháp, đều MỚI hơn biện pháp của A. */
    for (let i = 0; i < 4; i += 1) {
      const vb = vid(record(who, b.id, { occurredOn: addDays(TODAY, -10 - i), description: `Vi phạm thứ ${i + 1} của B dùng để tạo biện pháp thử` }));
      confirm(who, mk(who, b.id, 'talk_short', [vb]).id, { performedOn: addDays(TODAY, -i) });
    }
    const bd = board.classViolationBoard(who, cls.id) as any;
    assert(Array.isArray(bd.recentByStudent[a.id]) && bd.recentByStudent[a.id].length === 1,
      `recentByStudent[A] phải có đúng 1 phần tử: ${JSON.stringify(bd.recentByStudent[a.id])}`);
    assert(Array.isArray(bd.recentByStudent[b.id]) && bd.recentByStudent[b.id].length === 3,
      `recentByStudent[B] phải có đúng 3 phần tử (giới hạn tối đa), có ${bd.recentByStudent[b.id]?.length}`);
    assert(bd.recentByStudent[b.id][0].performedOn >= bd.recentByStudent[b.id][2].performedOn, 'Mới nhất đứng trước trong recentByStudent[B]');
    assert(bd.history.latest.length === 3 && bd.history.total === 5, 'history cũ (của cả lớp) vẫn giữ nguyên hành vi cũ, không bị đụng');
  });

  check('PR-K3 · K3-5 canRecord của bảng ba khu vực: GVBM dạy lớp trái môn → true; giáo viên không dạy lớp thì máy chủ từ chối cả quyền ghi vi phạm (không riêng gì bảng); Quản lý cùng chi nhánh → true, chi nhánh khác thì không đọc được bảng', () => {
    const cls = makeClassForWarnings('MB-FT PK35');
    conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, 'writing1', 0, 'active', '2026-01-01', ?)`)
      .run(cls.id, gvbm.userId, new Date().toISOString());
    const bdGvbm = board.classViolationBoard(loadPrincipal(gvbm.userId), cls.id) as any;
    assert(bdGvbm.canRecord === true, 'GVBM dạy lớp (trái môn, chỉ Writing 1) vẫn ghi vi phạm được — Ý thức không theo C02');
    assert(permsMod.can(loadPrincipal(gvbm.userId), domain.PERMISSIONS.VIOLATION_RECORD, { classId: cls.id }) === true, 'Khớp đúng quyền violation.record mà máy chủ dùng để tính canRecord');
    /* gvbm2 không có phân công nào ở lớp mới này (chỉ dạy lớp CLASS = MB-FT 101) — không đọc được bảng, đồng nghĩa không ghi vi phạm được ở lớp này. */
    assertThrows(() => board.classViolationBoard(gvbm2, cls.id), /phạm vi|quyền/, 'Giáo viên không dạy lớp vẫn đọc được bảng (và do đó vẫn có canRecord)');
    assert(permsMod.can(gvbm2, domain.PERMISSIONS.VIOLATION_RECORD, { classId: cls.id }) === false, 'Giáo viên không dạy lớp không có quyền violation.record ở lớp đó');
    const bdMb = board.classViolationBoard(P.mbManager, cls.id) as any;
    assert(bdMb.canRecord === true, 'Quản lý trong phạm vi ghi vi phạm được (đúng quyền violation.record hiện có)');
    assertThrows(() => board.classViolationBoard(P.cpManager, cls.id), /phạm vi|quyền/, 'Quản lý chi nhánh khác đọc được bảng');
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

  // ================================================================== J9 — gỡ mô hình Case Ý thức: nâng cấp database cũ

  console.log('\nPR-J · 12. Gỡ mô hình Case Ý thức (J9) — nâng cấp database cũ');

  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod = await import('../migrate.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const LEGACY = 'behav' + 'iour'; // giá trị cũ của cột track — chỉ để dựng dữ liệu cũ trong phép kiểm

  /** Dựng một database THỜI CASE Ý THỨC: schema hiện tại + các cột/bảng của mô hình đã bỏ + dữ liệu cũ. */
  const legacyDatabase = (opts: { file?: string } = {}) => {
    /* `file`: dựng trên schema THẬT của thời trước PR-J (tệp chụp ở `scripts/fixtures/`, ngoài server/src để lệnh quét mô hình cũ không bắt nó), không phải schema mới cộng ALTER. */
    const m = new SqliteDb(opts.file ?? ':memory:');
    if (opts.file) m.exec(fsMod.readFileSync(pathMod.join(REPO, 'scripts/fixtures/schema-truoc-pr-j.sql'), 'utf8'));
    else m.exec(fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8'));
    if (!opts.file) m.exec(`
      ALTER TABLE sos_cases ADD COLUMN track TEXT NOT NULL DEFAULT 'academic';
      ALTER TABLE sos_cases ADD COLUMN episode_no INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE sos_cases ADD COLUMN merge_until TEXT;
      ALTER TABLE sos_cases ADD COLUMN urgency_raised_at TEXT;
      ALTER TABLE case_signals ADD COLUMN track TEXT NOT NULL DEFAULT 'academic';
      ALTER TABLE tasks ADD COLUMN track TEXT;
      CREATE TABLE case_reports (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL REFERENCES sos_cases(id), reported_by INTEGER REFERENCES users(id),
        source_skill TEXT, source_attempt_id INTEGER, reported_on TEXT NOT NULL, observed_on TEXT, summary TEXT NOT NULL,
        idempotency_key TEXT UNIQUE, created_at TEXT NOT NULL);
      DROP TABLE measure_violations; DROP TABLE discipline_measures; DROP TABLE violation_history; DROP TABLE violations;
    `);
    const NOW = '2026-09-10T00:00:00.000Z';
    const q = (sql: string, ...a: unknown[]) => Number(m.prepare(sql).run(...a).lastInsertRowid);
    q(`INSERT INTO branches (code, name, created_at) VALUES ('MB', 'Monbay', ?)`, '2026-09-10T00:00:00.000Z');
    for (const [i, n] of [[1, 'Quản trị'], [2, 'Cô Hà']] as const) {
      q(`INSERT INTO users (id, code, full_name, email, title, password_hash, password_salt, status, created_at) VALUES (?,?,?,?,?,?,?,?,?)`, i, `NV${i}`, n, `u${i}@x.vn`, 'GV', 'h', 's', 'active', NOW);
    }
    q(`INSERT INTO classes (id, code, branch_id, kind, status, created_at) VALUES (1, 'MB-FT 1', 1, 'FT', 'active', ?)`, NOW);
    for (const i of [1, 2]) {
      q(`INSERT INTO students (id, student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?,1,'active',?)`, i, `PISA${i}`, `Em ${i}`, `em ${i}`, NOW);
      q(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,1,'active','2026-08-01',?)`, i, NOW);
      q(`INSERT INTO learning_cycles (id, student_id, seq, started_at, status, created_at) VALUES (?,?,1,'2026-08-01','active',?)`, i, i, NOW);
    }
    const legacyCase = (student: number, topic: string, origin: string, summary: string | null, track = LEGACY) =>
      q(`INSERT INTO sos_cases (student_id, cycle_id, track, topic, category, origin_kind, detected_at, reported_by, summary, status, created_at)
         VALUES (?,?,?,?,?,?, '2026-09-01', 2, ?, 'open', ?)`, student, student, track, topic, track === 'academic' ? 'reading' : LEGACY, origin, summary, NOW);
    const A = legacyCase(1, 'participation', 'teacher_report', 'Nói chuyện riêng');
    const B = legacyCase(2, 'other', 'mock', null);
    const C = legacyCase(1, 'homework', 'teacher_report', 'Thiếu BTVN nhiều lần trong tháng');
    const D = legacyCase(2, 'reading', 'teacher_report', 'Reading yếu phần True/False', 'academic');
    const rep = (caseId: number, by: number, skill: string | null, on: string, obs: string | null, text: string) =>
      q(`INSERT INTO case_reports (case_id, reported_by, source_skill, reported_on, observed_on, summary, created_at) VALUES (?,?,?,?,?,?,?)`, caseId, by, skill, on, obs, text, NOW);
    rep(A, 2, 'writing1', '2026-09-01', '2026-08-30', 'Nói chuyện riêng trong giờ Writing');
    rep(A, 1, null, '2026-09-03', null, 'Nói chuyện riêng trong giờ chủ nhiệm');
    const iv = (caseId: number, kind: string, status: string, done: string | null, note: string) =>
      q(`INSERT INTO case_interventions (case_id, kind, description, status, completed_date, performer_name, recorded_by, created_at) VALUES (?,?,?,?,?,?,?,?)`, caseId, kind, note, status, done, kind === 'talk_student' ? 'Cô Hà' : null, 2, NOW);
    iv(A, 'talk_student', 'completed', '2026-09-02', 'Gặp em cuối buổi');
    iv(A, 'talk_parent', 'completed', '2026-09-03', 'Gọi cho mẹ');
    const letter = iv(A, 'warning_letter', 'completed', '2026-09-04', 'Gửi thư cảnh cáo');
    /* Tệp bằng chứng đã đính ở PR-N: thư cảnh cáo cũ có tệp, và cả case cũng có một liên kết. */
    const att = (ownerType: string, ownerId: number, name: string) =>
      q(`INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, uploaded_by, created_at) VALUES (?,?,'link','https://drive.example/x',?,2,?)`, ownerType, ownerId, name, NOW);
    att('case_intervention', letter, 'Thư cảnh cáo cũ.pdf');
    att('sos_case', A, 'Biên bản của case.pdf');
    att('sos_case', B, 'Của case không có vi phạm nào.pdf');
    iv(A, 'meeting_cx', 'planned', null, 'Hẹn CX gặp phụ huynh');
    iv(A, 'talk_parent', 'cancelled', null, 'Đã huỷ');
    const dIv = iv(D, 'tutor', 'started', null, 'Học tutor Reading');
    q(`INSERT INTO case_signals (student_id, cycle_id, attempt_id, class_id, track, skill, category, detected_on, raised_on, verify_due, status, dedup_key, created_at)
       VALUES (2, 2, NULL, 1, 'academic', 'reading', 'reading', '2026-09-01', '2026-09-01', '2026-09-03', 'pending', 'k1', ?)`, NOW);
    q(`INSERT INTO case_signals (student_id, cycle_id, attempt_id, class_id, track, skill, category, detected_on, raised_on, verify_due, status, dedup_key, created_at)
       VALUES (2, 2, NULL, 1, ?, NULL, ?, '2026-09-01', '2026-09-01', '2026-09-03', 'pending', 'k2', ?)`, LEGACY, LEGACY, NOW);
    q(`INSERT INTO tasks (code, task_type, kind, class_id, track, topic, title, progress, created_at) VALUES ('CV1','in_period','teacher_task',1,?, 'homework','Giao việc nhắc BTVN','not_started',?)`, LEGACY, NOW);
    return { m, ids: { A, B, C, D, dIv, letter } };
  };

  check('PR-J · J9 Nâng cấp database cũ: báo cáo của case Ý thức thành vi phạm (Tham gia trên lớp → Thái độ / hành vi), việc trao đổi thành biện pháp, case cũ được gỡ sạch, case học thuật còn nguyên', () => {
    const { m, ids: I } = legacyDatabase();
    const applied: string[] = [];
    migrateMod.migrateYThuc(m, applied);
    migrateMod.migrateLegacyDisciplineCases(m, applied);
    const all = (sql: string, ...a: unknown[]) => m.prepare(sql).all(...a) as any[];

    const viols = all('SELECT * FROM violations ORDER BY id');
    assert(viols.length === 3, `2 báo cáo + 1 case chưa có báo cáo nào = 3 vi phạm, có ${viols.length}`);
    const fromA = viols.filter((v) => v.description.startsWith('Nói chuyện riêng'));
    assert(fromA.length === 2 && fromA.every((v) => v.category === 'conduct' && v.valid === 1 && v.student_id === 1), 'Hai báo cáo của case A: nhóm participation → conduct');
    assert(fromA.find((v) => v.description.includes('Writing')).skill === 'writing1' && fromA.find((v) => v.description.includes('Writing')).occurred_on === '2026-08-30',
      'Môn và ngày xảy ra (observed_on) được giữ');
    assert(fromA.find((v) => v.description.includes('chủ nhiệm')).skill === null && fromA.find((v) => v.description.includes('chủ nhiệm')).occurred_on === '2026-09-03', 'Không có observed_on thì lấy ngày báo');
    const fromC = viols.find((v) => v.description.startsWith('Thiếu BTVN'));
    assert(fromC && fromC.category === 'homework' && fromC.occurred_on === '2026-09-01', 'Case chưa có dòng báo cáo nào thì sinh một vi phạm từ chính mô tả của case');

    const measures = all('SELECT * FROM discipline_measures WHERE student_id = 1 ORDER BY id');
    assert(measures.length === 4, `4 biện pháp (đã huỷ thì bỏ), có ${measures.length}: ${measures.map((x) => x.kind).join()}`);
    const byKind = Object.fromEntries(measures.map((x) => [x.custom_name === 'Thư cảnh cáo (dữ liệu cũ)' ? 'warning_old' : x.kind, x]));
    assert(byKind.meeting_student.status === 'done' && byKind.meeting_student.performed_on === '2026-09-02' && byKind.meeting_student.performer_name === 'Cô Hà', 'talk_student → meeting_student đã thực hiện, giữ ngày và người');
    assert(byKind.family_report.status === 'done' && byKind.family_report.performed_on === '2026-09-03' && byKind.family_report.violation_count_at_confirm === 2, 'talk_parent → family_report; ảnh chụp = 2 vi phạm');
    assert(byKind.warning_old.kind === 'other' && byKind.warning_old.status === 'done', 'Thư cảnh cáo cũ không có lần thứ mấy → loại Khác, KHÔNG phá chuỗi 1→2→3');
    assert(byKind.meeting_cx.status === 'preparing' && byKind.meeting_cx.performed_on === null, 'Việc chưa xong → đang chuẩn bị');
    assert(all('SELECT * FROM discipline_measures WHERE kind IN (\'warning_1\',\'warning_2\',\'warning_3\')').length === 0, 'Không tự bịa Thư cảnh cáo lần 1/2/3');
    for (const ms of measures) assert(all('SELECT * FROM measure_violations WHERE measure_id = ?', ms.id).length === 2, `Biện pháp ${ms.id} phải liên kết cả hai vi phạm của case`);
    assert(all('SELECT * FROM measure_violations WHERE violation_id = ?', fromC.id).length === 0, 'Vi phạm của case C không có biện pháp → chưa xử lý');

    assert(all('SELECT id FROM sos_cases WHERE id IN (?,?,?)', I.A, I.B, I.C).length === 0, 'Case Ý thức cũ phải được gỡ hết');
    assert(all('SELECT id FROM sos_cases WHERE id = ?', I.D).length === 1 && all('SELECT id FROM case_interventions WHERE id = ?', I.dIv).length === 1, 'Case học thuật và phương án của nó còn nguyên');
    assert(all('SELECT * FROM case_interventions WHERE case_id IN (?,?,?)', I.A, I.B, I.C).length === 0, 'Phương án của case Ý thức cũ đã chuyển thành biện pháp nên được gỡ');
    /* Tệp bằng chứng KHÔNG được mất theo: tệp của phương án đi theo biện pháp nó thành; tệp của case đi theo biện pháp đầu tiên của case. */
    const letterMeasure = all("SELECT id FROM discipline_measures WHERE custom_name = 'Thư cảnh cáo (dữ liệu cũ)'")[0];
    const firstMeasure = all('SELECT MIN(id) id FROM discipline_measures WHERE student_id = 1')[0];
    const keep = all("SELECT owner_type, owner_id, display_name FROM attachments WHERE owner_type = 'discipline_measure' ORDER BY id");
    assert(keep.some((a) => a.display_name === 'Thư cảnh cáo cũ.pdf' && a.owner_id === letterMeasure.id), 'Tệp của thư cảnh cáo cũ phải chuyển sang đúng biện pháp "Thư cảnh cáo (dữ liệu cũ)"');
    assert(keep.some((a) => a.display_name === 'Biên bản của case.pdf' && a.owner_id === firstMeasure.id), 'Tệp của case cũ phải chuyển sang biện pháp đầu tiên của case');
    assert(!all("SELECT * FROM attachments WHERE owner_type IN ('sos_case','case_intervention') AND owner_id IN (?,?,?,?)", I.A, I.B, I.C, I.letter).length, 'Không còn tệp nào trỏ vào case hoặc phương án đã gỡ');
    assert(all('SELECT * FROM case_signals').length === 1 && all('SELECT skill FROM case_signals')[0].skill === 'reading', 'Tín hiệu Ý thức cũ gỡ, tín hiệu học thuật còn');
    assert(all('SELECT topic FROM tasks WHERE code = \'CV1\'')[0].topic === null, 'Việc giao GV theo nhóm ý thức: bỏ chủ đề (không còn là kỹ năng)');

    for (const [table, col] of [['sos_cases', 'track'], ['sos_cases', 'episode_no'], ['sos_cases', 'merge_until'], ['sos_cases', 'urgency_raised_at'], ['case_signals', 'track'], ['tasks', 'track']]) {
      assert(!all(`PRAGMA table_info(${table})`).some((c) => c.name === col), `Cột ${table}.${col} phải được gỡ`);
    }
    assert(!all(`SELECT name FROM sqlite_master WHERE type='table' AND name = 'case_reports'`).length, 'Bảng case_reports phải được gỡ');
    assert(applied.some((x) => /vi phạm/.test(x)), 'Phải báo đã chuyển bao nhiêu vi phạm và biện pháp');
  });

  check('PR-J · J9 Nâng cấp chạy lặp lại không đổi gì (idempotent), và không dựng lại cột/bảng của mô hình đã bỏ; database mới dựng từ schema.sql thì không phải làm gì', () => {
    const { m } = legacyDatabase();
    const applied: string[] = [];
    migrateMod.migrateYThuc(m, applied);
    migrateMod.migrateLegacyDisciplineCases(m, applied);
    const snap = () => JSON.stringify(['violations', 'discipline_measures', 'measure_violations', 'sos_cases', 'case_interventions'].map((t) => (m.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as any).n));
    const before = snap();
    const again: string[] = [];
    migrateMod.migrateYThuc(m, again);
    migrateMod.migrateLegacyDisciplineCases(m, again);
    assert(again.length === 0 && snap() === before, `Chạy lần hai phải không đổi gì: ${again.join(' | ')}`);
    /* Database mới dựng từ schema.sql: không có gì để nâng cấp. */
    const fresh = new SqliteDb(':memory:');
    fresh.exec(fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8'));
    const none: string[] = [];
    migrateMod.migrateYThuc(fresh, none);
    migrateMod.migrateLegacyDisciplineCases(fresh, none);
    assert(none.length === 0, `Database mới không được có gì để nâng cấp: ${none.join(' | ')}`);
  });

  check('PR-J · J9 Chạy trọn `migrate()` trên database đã ở mô hình mới không dựng lại cột `track`, `episode_no`, `merge_until` hay bảng `case_reports` của mô hình đã bỏ', () => {
    const before = migrateMod.migrate();
    void before;
    const cols = (tb: string) => (conn.prepare(`PRAGMA table_info(${tb})`).all() as any[]).map((c) => c.name as string);
    for (const [tb, col] of [['sos_cases', 'track'], ['sos_cases', 'episode_no'], ['sos_cases', 'merge_until'], ['sos_cases', 'urgency_raised_at'], ['case_signals', 'track'], ['tasks', 'track']]) {
      assert(!cols(tb).includes(col), `migrate() đã dựng lại cột ${tb}.${col}`);
    }
    assert(!conn.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = 'case_reports'`).get(), 'migrate() đã dựng lại bảng case_reports');
    const second = migrateMod.migrate();
    assert(!second.applied.some((x) => /Ý thức|vi phạm|biện pháp/.test(x)), `Chạy lần hai không được áp lại bước Ý thức: ${second.applied.join(' | ')}`);
  });

  const osMod = await import('node:os');
  const cp = await import('node:child_process');

  check('PR-J · J9 Nâng cấp một database THẬT của thời trước PR-J (schema gốc + dữ liệu cũ) bằng chính lệnh `migrate`: có sao lưu, tệp bằng chứng đi theo, chạy lần hai không đổi gì', () => {
    const dir = fsMod.mkdtempSync(pathMod.join(osMod.tmpdir(), 'pj-legacy-'));
    const file = pathMod.join(dir, 'legacy.sqlite');
    const { m } = legacyDatabase({ file });
    m.pragma('journal_mode = DELETE');
    m.close();
    const run = () => cp.execFileSync(process.execPath, [pathMod.join(REPO, 'dist-server/server/src/migrate/run.js')], {
      env: { ...process.env, PISA_DB: file }, encoding: 'utf8',
    }) as string;
    const first = run();
    assert(/đã sao lưu sang/.test(first) && fsMod.existsSync(file + '.truoc-pr-j.bak'), 'Phải sao lưu database TRƯỚC khi xoá mô hình cũ');
    assert(/Chuyển mô hình Case Ý thức/.test(first), `Lần một phải chuyển mô hình: ${first.slice(-400)}`);
    const after = new SqliteDb(file, { readonly: true });
    const n = (sql: string) => (after.prepare(sql).get() as any).n as number;
    assert(n('SELECT COUNT(*) n FROM violations') === 3 && n('SELECT COUNT(*) n FROM discipline_measures') === 4, 'Phải ra 3 vi phạm và 4 biện pháp từ dữ liệu cũ');
    assert(n("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'discipline_measure'") === 2, 'Hai tệp bằng chứng phải đi theo biện pháp');
    assert(!(after.prepare('PRAGMA table_info(sos_cases)').all() as any[]).some((c) => c.name === 'track'), 'Cột track phải được gỡ');
    assert(n('SELECT COUNT(*) n FROM sos_cases') === 1, 'Chỉ còn lại case học thuật');
    assert((after.pragma('foreign_key_check') as unknown[]).length === 0, 'Không được để lại khoá ngoại treo');
    after.close();
    const second = run();
    assert(!/Chuyển mô hình|Thêm bốn bảng|sao lưu/.test(second), `Lần hai không được làm lại bước Ý thức: ${second.slice(-300)}`);
    try { fsMod.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows còn giữ file — bỏ qua dọn dẹp */ }
  });

  // ================================================================== J9 — mô hình cũ ĐÃ BIẾN MẤT khỏi mã, không chỉ khỏi giao diện

  console.log('\nPR-J · 13. Mô hình Case Ý thức đã gỡ hẳn khỏi mã nguồn và tài liệu (J9, J11)');

  const walk = (dir: string, out: string[] = []): string[] => {
    for (const e of fsMod.readdirSync(dir, { withFileTypes: true })) {
      const p = pathMod.join(dir, e.name);
      if (e.isDirectory()) walk(p, out); else if (/\.(ts|tsx|sql)$/.test(e.name)) out.push(p);
    }
    return out;
  };
  const DATE = /\b\d{2}\/\d{2}\/\d{4}\b/;

  check('PR-J · J9 Mã của mô hình cũ trong server/src và shared chỉ còn chú thích LỊCH SỬ CÓ GHI NGÀY; bảng `case_reports` chỉ còn nhắc ở bước nâng cấp', () => {
    const files = [...walk(pathMod.join(REPO, 'server/src')), ...walk(pathMod.join(REPO, 'shared'))];
    assert(files.length > 50, 'Quét được quá ít tệp — đường dẫn sai');
    const bad: string[] = [];
    for (const f of files) {
      const rel = pathMod.relative(REPO, f).replace(/\\/g, '/');
      const lines = fsMod.readFileSync(f, 'utf8').split(/\r?\n/);
      lines.forEach((line, i) => {
        if (line.includes(LEGACY)) {
          const around = lines.slice(Math.max(0, i - 2), i + 3).join('\n');
          if (!DATE.test(around)) bad.push(`${rel}:${i + 1}`);
        }
        if (/case_reports/.test(line) && !/^server\/src\/(migrate|tests\/)/.test(rel)) bad.push(`${rel}:${i + 1} (case_reports)`);
      });
    }
    assert(bad.length === 0, `Còn dấu vết mô hình cũ không có ghi chú ngày: ${bad.slice(0, 8).join(' · ')}`);
  });

  const casesSvc = await import('../cases/cases.ts');
  const classesSvcJ = await import('../classes/classes.ts');
  const signalsJ = await import('../cases/signals.ts');
  const regularJ = await import('../normal/regular.ts');

  check('PR-J · J9 Không còn hằng số, hàm nào của mô hình cũ được xuất ra: nhóm ý thức, cửa sổ gộp, kết quả ý thức, bảng ý thức của lớp, chu kỳ theo đầu mục', () => {
    for (const [name, mod] of [['shared/domain', domain], ['cases', casesSvc], ['classes', classesSvcJ], ['signals', signalsJ], ['normal', regularJ]] as const) {
      const hit = Object.keys(mod).filter((k) => /behav/i.test(k));
      assert(hit.length === 0, `${name} còn xuất ${hit.join(', ')}`);
    }
    const cyc = (domain as any).cycleDeadline as (d: string, extra?: unknown) => string;
    assert(cyc.length === 1, `cycleDeadline nay chỉ có một tham số (không còn phân theo đầu mục), đang có ${cyc.length}`);
    const cols = (tb: string) => (conn.prepare(`PRAGMA table_info(${tb})`).all() as any[]).map((c) => c.name as string);
    assert(!cols('sos_cases').includes('track') && !cols('case_signals').includes('track'), 'Còn cột đầu mục ở case hoặc tín hiệu');
  });

  check('PR-J · J9 Máy chủ TỪ CHỐI báo case với chủ đề Ý thức cũ (BTVN · Chuyên cần · Tham gia) — Ý thức nay là vi phạm, không đi qua cửa case', () => {
    const st = conn.prepare("SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' WHERE e.class_id = ? LIMIT 1").get(t.classId('MB-FT 101')) as any;
    const before = (conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n;
    for (const topic of ['homework', 'attendance', 'participation']) {
      let threw = false;
      try {
        casesSvc.reportIssue(t.P.admin, {
          studentId: st.id, topic, parallel: true, title: `Thử ${topic}`, summary: 'Báo case bằng chủ đề của Ý thức cũ, phải bị từ chối.',
        } as any);
      } catch { threw = true; }
      assert(threw, `Báo case chủ đề "${topic}" vẫn được nhận`);
    }
    assert((conn.prepare('SELECT COUNT(*) n FROM sos_cases').get() as any).n === before, 'Báo bị từ chối mà vẫn để lại một case');
  });

  check('PR-J · J9 Hằng số C03 và C04 CÒN nguyên giá trị nhưng ghi rõ HẾT HIỆU LỰC 21/09/2026 kèm lý do — không xóa, không rải luật ở chỗ khác', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'shared/domain/policy.ts'), 'utf8');
    for (const name of ['C03_CUA_SO_GOP_CASE_Y_THUC_NGAY', 'C04_BAO_CAO_MOI_SAU_KHI_DONG']) {
      const at = src.indexOf(`export const ${name}`);
      assert(at > 0, `Đã xóa hằng số ${name}`);
      const before = src.slice(Math.max(0, at - 900), at);
      assert(/HẾT HIỆU LỰC 21\/09\/2026/.test(before) && /LÝ DO HẾT HIỆU LỰC/.test(before), `${name} phải có chú thích "HẾT HIỆU LỰC 21/09/2026" kèm lý do ngay phía trên`);
    }
    assert((domain as any).C03_CUA_SO_GOP_CASE_Y_THUC_NGAY === 3 && (domain as any).C04_BAO_CAO_MOI_SAU_KHI_DONG === 'doi-moi-lien-ket', 'Giá trị hằng số đã bị đổi');
    /* C02 vẫn CÒN hiệu lực và KHÔNG áp cho Ý thức — kiểm ở phần quyền, ở đây chỉ chắn việc bị xóa nhầm. */
    assert((domain as any).C02_GVCN_XU_LY_CASE_TRAI_MON === 'gvcn-dung-mon', 'C02 phải còn nguyên');
  });

  check('PR-J · J11 Bảng `sos_cases`, `case_interventions` còn nguyên (không đổi tên, không xóa); `violations` KHÔNG bị gộp vào `sos_cases`', () => {
    for (const tb of ['sos_cases', 'case_interventions', 'violations', 'discipline_measures', 'measure_violations', 'violation_history', 'attachments']) {
      assert(conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tb), `Thiếu bảng ${tb}`);
    }
    const sosCols = (conn.prepare('PRAGMA table_info(sos_cases)').all() as any[]).map((c) => c.name as string);
    assert(!sosCols.includes('valid') && !sosCols.includes('invalid_reason'), 'Cột của vi phạm bị nhét vào sos_cases');
  });

  check('PR-J · J11 Hai tệp DEMO_SCENARIOS.md và DEMO_ASSUMPTIONS.md đã thay bằng MỘT tệp DEMO.md; không tài liệu nào còn trỏ tới hai tệp cũ', () => {
    assert(fsMod.existsSync(pathMod.join(REPO, 'DEMO.md')), 'Thiếu DEMO.md');
    for (const old of ['DEMO_SCENARIOS.md', 'DEMO_ASSUMPTIONS.md']) assert(!fsMod.existsSync(pathMod.join(REPO, old)), `${old} vẫn còn`);
    const docs = ['README.md', 'CODE_MAP.md', 'plan.md'];
    for (const d of docs) {
      const p = pathMod.join(REPO, d);
      if (!fsMod.existsSync(p)) continue;
      const txt = fsMod.readFileSync(p, 'utf8');
      assert(!/DEMO_SCENARIOS|DEMO_ASSUMPTIONS/.test(txt), `${d} còn nhắc tới tệp demo cũ`);
    }
    const demo = fsMod.readFileSync(pathMod.join(REPO, 'DEMO.md'), 'utf8');
    for (let i = 1; i <= 18; i++) assert(new RegExp(`(^|\\n)\\s*\\|\\s*${i}\\s*\\|`).test(demo), `DEMO.md thiếu dòng của tình huống ${i}`);
  });
}
