/**
 * PHÉP KIỂM GÓI R1 (rà 24/11 `docs/superpowers/specs/2026-11-24-ra-chan-cung/bao-cao.md` mục 1 — hổng logic máy chủ). Mỗi phép chạy câu SQL mới thật
 * (libsql thiếu tham số gắn NULL im lặng — phép kiểm bắt kết quả, không đọc nguồn). Mọi ghi trong BEGIN … ROLLBACK.
 *   L1  chủ Case hết vai / bị xoá = "chưa có người": caseChuaCoNguoi, Công việc `owner:`, lọc noOwner, tên "(đã nghỉ)", phân công lại gán người mới + lịch sử
 */
export async function runPrR1Tests(t: any) {
  const { check, assert, conn, P } = t;
  console.log('\nGÓI R1 · hổng logic máy chủ');
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const owner: any = await import('../cases/owner.ts');
  const cases: any = await import('../cases/cases.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { HV_DANG_HOC_SQL, CASE_SAU_THI_SQL } = await import('../students/tamDung.ts');

  check('L1 · chủ Case gỡ hết vai → Case "chưa có người" (Tổng quan = Công việc = lọc), tên "(đã nghỉ)"; phân công lại → người theo luật, lịch sử ghi người cũ', () => thu(() => {
    /* Case mở, không tạm, em đang học, không sau thi; chủ là GV môn (không phải GVCN) của lớp có GVCN khác. */
    const c = one(`SELECT sc.id, sc.owner_user_id AS chu, COALESCE(a.class_id, cur.class_id) AS lop, s.id AS sid FROM sos_cases sc
        LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id) AND ${HV_DANG_HOC_SQL('s')}
        JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
       WHERE sc.status != 'done' AND sc.tam = 0 AND sc.owner_user_id IS NOT NULL AND NOT ${CASE_SAU_THI_SQL('sc', 's.id')}
         AND NOT EXISTS (SELECT 1 FROM teacher_assignments t WHERE t.class_id = COALESCE(a.class_id, cur.class_id) AND t.user_id = sc.owner_user_id AND t.is_core = 1)
         AND EXISTS (SELECT 1 FROM teacher_assignments t WHERE t.class_id = COALESCE(a.class_id, cur.class_id) AND t.status = 'active' AND t.is_core = 1)
       ORDER BY sc.id LIMIT 1`);
    assert(c, 'seed thiếu Case có chủ là GV môn');
    const coTrong = () => owner.caseChuaCoNguoi(P.admin, null).some((r: any) => r.id === c.id);
    const viec = () => (myWork(P.admin, { nguoi: "tat-ca" } as any).items ?? []).some((i: any) => i.key === `owner:${c.id}`);
    xoaNho();
    assert(!coTrong() && !viec(), 'Case có chủ còn làm đã nằm trong "chưa có người"');
    accounts.setRoles(P.admin, c.chu, []);   // gỡ hết vai — `donGiaoHetHieuLuc` không đụng Case (không luật mới)
    xoaNho();
    assert(one('SELECT owner_user_id AS o FROM sos_cases WHERE id = ?', c.id).o === c.chu, 'gỡ vai không được tự đổi chủ Case');
    assert(coTrong(), 'caseChuaCoNguoi bỏ sót Case chủ đã gỡ vai');
    assert(viec(), 'Công việc thiếu dòng owner: của Case chủ đã gỡ vai');
    const ds = cases.listCases(P.admin, { noOwner: true, studentId: c.sid });
    const dong = ds.rows.find((r: any) => r.id === c.id);
    assert(dong, 'lọc noOwner bỏ sót Case');
    assert(/ \(đã nghỉ\)$/.test(dong.ownerName ?? ''), `tên chủ không có "(đã nghỉ)": ${dong.ownerName}`);
    /* Phân công lớp gọi `ganChuCaseThieu` — người cũ còn phân công đang chạy thì đóng trước (như xoá tài khoản). */
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE user_id = ? AND status = 'active'`).run(c.chu);
    xoaNho();
    const n = owner.ganChuCaseThieu({ classId: c.lop, actorId: P.admin.userId, luc: '2026-11-24T03:00:00.000Z' });
    const moi = one('SELECT owner_user_id AS o FROM sos_cases WHERE id = ?', c.id).o;
    assert(n >= 1 && moi !== null && moi !== c.chu, `chưa gán người mới (n=${n}, chủ=${moi})`);
    const ls = one(`SELECT old_value, new_value FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id' ORDER BY id DESC LIMIT 1`, c.id);
    assert(ls?.old_value === String(c.chu) && ls?.new_value === String(moi), `lịch sử: ${JSON.stringify(ls)}`);
    xoaNho();
    assert(!coTrong(), 'Case đã có người mới vẫn ở "chưa có người"');
  }));
}
