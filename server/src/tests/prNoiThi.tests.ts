/**
 * LICH-THI-NOI-THI (Việc để sau GD-13b, mockup ⑥ K4 "Nơi thi IDP / BC"): cột `learning_cycles.noi_thi` + lưu qua `PUT /hoc-vien-lop/lich-thi/:cycleId`
 * (cùng quyền sửa ngày thi, kiểm độ dài, nhật ký trong dòng `lich_thi.luu`, Hoàn tác = PUT lại giá trị cũ), danh sách đọc chung câu cũ.
 */
export async function runPrNoiThiTests(t: any) {
  const { check, assert, assertThrows, conn, P } = t;
  console.log('\nLICH-THI-NOI-THI · nơi thi ở tab Lịch thi');
  const lt: any = await import('../classes/lichThi.ts');
  const mig: any = await import('../migrate/prNoiThi.ts');
  const Database = (await import('libsql')).default as any;
  const MB = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id as number;
  const cy = (conn.prepare(`SELECT cy.id FROM learning_cycles cy JOIN students s ON s.id = cy.student_id
    WHERE cy.status = 'active' AND s.branch_id = ? AND s.archived_at IS NULL ORDER BY cy.id LIMIT 1`).get(MB) as any).id as number;
  const noiThi = () => (conn.prepare('SELECT noi_thi FROM learning_cycles WHERE id = ?').get(cy) as any).noi_thi as string | null;
  const nhatKy = () => conn.prepare(`SELECT after_json, before_json FROM audit_logs WHERE entity_type = 'lich_thi' AND entity_id = ? AND action = 'lich_thi.luu' ORDER BY id DESC LIMIT 1`).get(cy) as any;

  check('NOI-THI (1) · QL lưu nơi thi (chỉ nơi thi, không kết luận) → cột + hàng trả về + nhật ký; khoảng trắng gộp; "" = bỏ; Hoàn tác về giá trị cũ', () => {
    const r = lt.luuLichThi(P.mbManager, cy, { noiThi: '  IDP   Hà Nội ' });
    assert(r.noiThi === 'IDP Hà Nội' && noiThi() === 'IDP Hà Nội', JSON.stringify(r.noiThi));
    const nk = nhatKy();
    assert(JSON.parse(nk.after_json).noiThi === 'IDP Hà Nội' && JSON.parse(nk.before_json).noiThi === null, nk.after_json);
    lt.luuLichThi(P.mbManager, cy, { noiThi: 'BC' });
    const ls = lt.lichSuLichThi([cy], 3).get(cy) ?? [];
    assert(ls[0]?.noiThi === 'BC', JSON.stringify(ls[0]));
    lt.luuLichThi(P.mbManager, cy, { noiThi: 'IDP Hà Nội' });   // Hoàn tác: PUT lại giá trị cũ
    assert(noiThi() === 'IDP Hà Nội', 'Hoàn tác');
    lt.luuLichThi(P.mbManager, cy, { noiThi: '' });
    assert(noiThi() === null, 'bỏ nơi thi');
  });

  check('NOI-THI (2) · kiểm: quá 40 ký tự → 400; QL chi nhánh khác → 403 (cùng quyền sửa ngày thi); dữ liệu không đổi', () => {
    assertThrows(() => lt.luuLichThi(P.mbManager, cy, { noiThi: 'x'.repeat(41) }), /tối đa/, 'không chặn nơi thi quá dài');
    assertThrows(() => lt.luuLichThi(P.cpManager, cy, { noiThi: 'IDP' }), /quyền/, 'QL CP sửa được lịch thi em MB');
    assert(noiThi() === null, 'dữ liệu bị đổi khi lỗi');
  });

  check('NOI-THI (3) · migrate prNoiThi: thêm đúng cột noi_thi TEXT NULL như schema.sql; chạy lần hai không làm gì', () => {
    const tam = new Database(':memory:');
    tam.exec('CREATE TABLE learning_cycles (id INTEGER PRIMARY KEY)');
    const ap: string[] = [];
    mig.themCotPrNoiThi(tam, ap); mig.themCotPrNoiThi(tam, ap);
    assert(ap.length === 1, JSON.stringify(ap));
    const cot = (c: any) => c.prepare(`SELECT name, type, "notnull" AS nn, dflt_value AS dv FROM pragma_table_info('learning_cycles') WHERE name = 'noi_thi'`).all().map((x: any) => `${x.name}:${x.type}:${x.nn}:${x.dv}`).join(',');
    assert(cot(tam) === cot(conn) && cot(conn) === 'noi_thi:TEXT:0:null', `${cot(tam)} ≠ ${cot(conn)}`);
    tam.close();
  });
}
