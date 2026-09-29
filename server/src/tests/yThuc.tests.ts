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
import { boLichTuTao } from './luotThu.ts';
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
  const { yThucMetric } = await import('../yThuc/thongKe.ts');
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
    assert(JSON.stringify(domain.MEASURE_KINDS_V3) === JSON.stringify([
      'talk_short', 'meeting_student', 'family_report', 'warning_1', 'meeting_cx', 'warning_2', 'suspension', 'warning_3', 'other',
    ]), `Chín loại sai thứ tự: ${JSON.stringify(domain.MEASURE_KINDS_V3)}`);
    assert(domain.MEASURE_KIND_LABEL_V3.warning_1 === 'Thư cảnh cáo lần 1' && domain.MEASURE_KIND_LABEL_V3.meeting_cx === 'CX / GĐCN meeting với HV / PH'
      && domain.MEASURE_KIND_LABEL_V3.suspension === 'Đình chỉ học', 'Nhãn sai');
    for (const k of domain.MEASURE_KINDS_V3) assert(domain.MEASURE_KIND_LABEL_V3[k], `Loại ${k} thiếu nhãn`);
  });

  check('PR-J · J2 Hai trạng thái biện pháp (không có chờ duyệt) và bốn trạng thái hiển thị của vi phạm', () => {
    assert(JSON.stringify(domain.MEASURE_STATUSES_V3) === JSON.stringify(['preparing', 'done']), 'Chỉ có preparing và done (Y01: không có cửa duyệt)');
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
    const notify = domain.MEASURE_KINDS_V3.filter((k) => domain.measureNotifiesManager(k));
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
      'valid', 'invalid_reason', 'invalidated_by', 'invalidated_at', 'idempotency_key', 'created_at', 'updated_at',
      /* PR-YT4: Ghi nhận (V4-1) — trạng thái vẫn suy ra, không có cột status */ 'ghi_nhan_luc', 'ghi_nhan_boi'];
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
      'created_at', 'created_by', 'updated_at', /* PR-YT4: ngày QL duyệt / từ chối */ 'quyet_luc'];
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

  const CLASS = t.classId('MB FT 101');
  const one = (sql: string, ...args: unknown[]) => (conn.prepare(sql).get(...args) as any)?.n as number;
  /** Học viên mới, riêng cho từng phép kiểm, để số đếm của phép này không lẫn với phép khác. */
  const makeStudent = (name: string, classId = CLASS): { id: number; cycleId: number } => {
    intake.commitIntake(P.admin, { classId, rows: [{ fullName: `PJ ${name}`, target: 7, email: 'hv@demo.test' }], idempotencyKey: `pj-${name}` });
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(`PJ ${name}`) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    assert(st && cy, `Không dựng được học viên thử "${name}"`);
    boLichTuTao(conn, cy.id);   // PR-MT: em thử Ý thức không cần lịch MT tự tạo (luotThu.ts)
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

  check('PR-J · V08 (PR-YT4) Ghi vi phạm KHÔNG sinh biện pháp, case, tín hiệu, việc — chỉ MỘT thông báo cho GVCN mỗi ngày (V4-5)', () => {
    const st = makeStudent('V08');
    const count = () => ['discipline_measures', 'measure_violations', 'sos_cases', 'case_signals', 'tasks', 'case_interventions']
      .map((tb) => `${tb}=${one(`SELECT COUNT(*) n FROM ${tb}`)}`).join(' ');
    const before = count();
    record(gvbm, st.id, { occurredOn: addDays(TODAY, -8), description: 'Vi phạm cũ hơn năm ngày, vẫn không sinh gì' });
    record(gvbm, st.id, { category: 'attendance', description: 'Nghỉ không phép ba buổi liên tiếp' });
    assert(count() === before, `Ghi vi phạm đã sinh dữ liệu ở nơi khác:\n  trước: ${before}\n  sau:   ${count()}`);
    assert(one(`SELECT COUNT(*) n FROM notifications WHERE dedup_key LIKE ?`, `yt-%:${st.id}:%`) === 1, 'Một thông báo "Vi phạm mới" cho GVCN, không đôi');
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

  // ================================================================== PR-YT4: khối Biện pháp xử lý v3 (B01–B16, Y01) thay bằng khối 4–5 của prYt4.tests.ts

  const xuLySvc = await import('../yThuc/xuLy.ts');
  const attachmentsSvc = await import('../platform/attachments.ts');

  /** Ghi `n` vi phạm cho một học viên (khác ngày để không trùng), trả về danh sách id. */
  const violations = (studentId: number, n: number, extra: Record<string, unknown> = {}): number[] =>
    Array.from({ length: n }, (_, i) => vid(record(gvbm, studentId, {
      occurredOn: addDays(TODAY, -(i + 1)), description: `Vi phạm thứ ${i + 1} dùng cho phép kiểm xử lý`, ...extra,
    })));
  /** Một lần Xác nhận xử lý v4 (bậc tự điền — máy chủ quyết). */
  const xuLy = (who: Principal, studentId: number, ids: number[]) =>
    xuLySvc.xacNhanXuLy(who, studentId, { violationIds: ids, performedOn: addDays(TODAY, -1), performerName: 'Cô Thu (GVCN)', note: 'Đã gọi điện và gửi report cho gia đình' }) as any;
  const link = (who: Principal, measureId: number, name = 'Bằng chứng xử lý') =>
    attachmentsSvc.addLink(who, { ownerType: 'discipline_measure', ownerId: measureId, url: 'https://example.com/bang-chung', displayName: name });

  // PR-YT4: khối cảnh báo mềm 5 ngày (W01–W06) thay bằng khối 3 của prYt4.tests.ts (một cửa trạng thái, Quá hạn / Bắt buộc).

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
      'bien-phap-cho-duyet': ['bien-phap', 'hien-trang'], 'bien-phap-theo-loai': ['bien-phap', 'ket-qua-trong-ky'],
      /* PR-YT4 */ 'hv-theo-bac': ['hoc-vien', 'hien-trang'],
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
    const mResp = metricsSvc.metricResponse(ms(P.mbManager, 'bien-phap-da-thuc-hien', { branchId: mbId }), true) as any;
    assert(mResp.rows.length === mResp.ids.length && mResp.rows.every((r: any) => r.title && r.sub), 'Dòng của tập biện pháp cũng đủ tên và học viên');
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
    const m = xuLy(gvcn, st.id, [v]);   // PR-YT4: lần xử lý xong ngay (không còn Đang chuẩn bị)
    assertThrows(() => attachmentsSvc.addLink(gvbm, { ownerType: 'discipline_measure', ownerId: m.id, url: 'https://example.com/y', displayName: 'y' }), /quyền/, 'GVBM thêm được bằng chứng cho biện pháp');
    const file = link(gvcn, m.id, 'Ghi chú cuộc gặp') as any;
    assert((attachmentsSvc.listAttachments(gvbm, 'discipline_measure', m.id) as any[]).length === 1, 'GVBM đọc được bằng chứng của biện pháp');
    assert(link(gvcn, m.id, 'Bổ sung sau khi thực hiện').id > 0, 'Biện pháp đã thực hiện vẫn bổ sung được bằng chứng');
    await attachmentsSvc.removeAttachment(gvcn, file.id);
    assert(one("SELECT COUNT(*) n FROM audit_logs WHERE action = 'attachment.delete' AND entity_id = ?", file.id) === 1, 'Gỡ tệp của biện pháp có audit');
  });


  // ================================================================== PR-K3: rà soát sau PR-K2 (§7.1 "Gần đây" theo học viên, canRecord)

  console.log('\nPR-K3 · 14. Rà soát PR-K2: "Gần đây" theo từng học viên, canRecord của bảng ba khu vực (K3-1, K3-5)');

  const permsMod = await import('../permissions.ts');

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
  const gvbmXuLy = await call(gvbm, 'POST', `/students/${hs.id}/y-thuc/xu-ly`, { violationIds: hv, performedOn: TODAY, note: 'GVBM thử xác nhận xử lý' });
  const gvbmGhiNhan = await call(gvbm, 'POST', `/students/${hs.id}/y-thuc/ghi-nhan`, { violationIds: hv });
  const gvbmKhai = await call(gvbm, 'POST', `/students/${hs.id}/y-thuc/khai-bac`, { bac: 2, ghiChu: 'GVBM khai thử' });
  const gvbmDeXuat = await call(gvbm, 'POST', `/students/${hs.id}/y-thuc/de-xuat`, { kind: 'suspension', violationIds: hv, note: 'GVBM đề xuất thử đình chỉ' });
  const gvbmBoard = await call(gvbm, 'GET', `/classes/${CLASS}/y-thuc`);
  const gvcnBoard = await call(gvcn, 'GET', `/classes/${CLASS}/y-thuc`);
  const gvbmHv = await call(gvbm, 'GET', `/students/${hs.id}/y-thuc`);
  const r1 = await call(gvcn, 'POST', `/students/${hs.id}/y-thuc/xu-ly`, { violationIds: [hv[0]], performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã trao đổi với em và gia đình', bacDaThay: 0 });
  const r1Cu = await call(gvcn, 'POST', `/students/${hs.id}/y-thuc/xu-ly`, { violationIds: [hv[1]], performedOn: TODAY, note: 'Bấm từ panel cũ còn bậc 0', bacDaThay: 0 });
  const gvbmRead = await call(gvbm, 'GET', `/y-thuc/xu-ly/${r1.json?.id}`);
  const hs5 = makeStudent('HTTP WL3');
  const hv5 = violations(hs5.id, 2);
  const khai5 = await call(gvcn, 'POST', `/students/${hs5.id}/y-thuc/khai-bac`, { bac: 5, ghiChu: 'Đã WL 2 tháng 8 (giấy)' });
  const wl3XuLy = await call(gvcn, 'POST', `/students/${hs5.id}/y-thuc/xu-ly`, { violationIds: hv5, performedOn: TODAY, note: 'Thử xử lý WL 3 một bước' });
  const wl3Nhap = await call(gvcn, 'POST', `/students/${hs5.id}/y-thuc/de-xuat`, { kind: 'wl_3', violationIds: hv5, note: 'Đề xuất WL 3 sau WL 2' });
  const wl3GuiKhongTep = await call(gvcn, 'POST', `/y-thuc/xu-ly/${wl3Nhap.json?.id}/gui`);
  const wl3Link = await call(gvcn, 'POST', '/attachments/link', { ownerType: 'discipline_measure', ownerId: wl3Nhap.json?.id, url: 'https://example.com/wl3', displayName: 'Thư WL 3' });
  const wl3Gui = await call(gvcn, 'POST', `/y-thuc/xu-ly/${wl3Nhap.json?.id}/gui`);
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

  check('PR-J · #22 (PR-YT4) GVBM gọi thẳng API Ghi nhận · Xác nhận xử lý · Khai bậc · Đề xuất → 403; đọc tab lớp, tab HV, một lần xử lý thì được; chưa đăng nhập → 401', () => {
    assert(noAuth.status === 401, `Chưa đăng nhập: ${noAuth.status}`);
    for (const [name, r] of [['xác nhận xử lý', gvbmXuLy], ['ghi nhận', gvbmGhiNhan], ['khai bậc', gvbmKhai], ['đề xuất', gvbmDeXuat]] as const) {
      assert(r.status === 403, `GVBM ${name} qua HTTP phải bị 403, được ${r.status} ${JSON.stringify(r.json)}`);
    }
    assert(gvbmRead.status === 200 && gvbmRead.json?.id === r1.json?.id && gvbmRead.json?.canManage === false, 'GVBM đọc được lần xử lý của lớp mình dạy');
    assert(gvbmHv.status === 200 && gvbmHv.json?.canManage === false && gvbmHv.json?.canRecord === true, 'GVBM đọc tab Ý thức của HV');
    assert(gvbmBoard.status === 200 && gvbmBoard.json?.canManage === false && gvcnBoard.json?.canManage === true,
      'Tab Ý thức của lớp: GVBM đọc được nhưng canManage = false; GVCN = true');
    for (const k of ['nhom', 'dongThoiGian']) assert(k in (gvbmBoard.json ?? {}), `Tab Ý thức của lớp thiếu khung ${k} (M6)`);
  });

  check('PR-J · #5 (PR-YT4) Gọi thẳng HTTP: bậc do máy chủ quyết (Report 1), panel cũ → 409; khai bậc 5 → WL 3 không Xác nhận một bước được (400), đề xuất thiếu bằng chứng → 400, có liên kết → gửi được', () => {
    assert(r1.status === 200 && r1.json?.kind === 'report_1' && r1.json?.status === 'done', `Lần đầu: ${r1.status} ${JSON.stringify(r1.json)}`);
    assert(r1Cu.status === 409 && /Bậc đã đổi/.test(r1Cu.json?.error ?? ''), `Panel cũ: ${r1Cu.status} ${r1Cu.json?.error}`);
    assert(khai5.status === 200, `Khai bậc 5: ${khai5.status} ${khai5.json?.error}`);
    assert(wl3XuLy.status === 400 && /WL 3 — cần Đề xuất QL duyệt/.test(wl3XuLy.json?.error ?? ''), `WL 3 một bước: ${wl3XuLy.status} ${wl3XuLy.json?.error}`);
    assert(wl3Nhap.status === 200 && wl3GuiKhongTep.status === 400 && /đính kèm tệp hoặc liên kết/.test(wl3GuiKhongTep.json?.error ?? ''), `Gửi không tệp: ${wl3GuiKhongTep.status} ${wl3GuiKhongTep.json?.error}`);
    assert(wl3Link.status === 200 && wl3Gui.status === 200 && wl3Gui.json?.status === 'cho_duyet', `Có liên kết thì gửi được: ${wl3Gui.status} ${wl3Gui.json?.error}`);
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
    q(`INSERT INTO classes (id, code, branch_id, kind, status, created_at) VALUES (1, 'MB FT 1', 1, 'FT', 'active', ?)`, NOW);
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
    const st = conn.prepare("SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' WHERE e.class_id = ? LIMIT 1").get(t.classId('MB FT 101')) as any;
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
