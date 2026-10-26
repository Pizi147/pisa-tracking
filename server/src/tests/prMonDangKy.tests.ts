/**
 * PHÉP KIỂM P8 MON-DANG-KY (plan.md 1.6 N13, N22 ④ — chỉ Fast Track; thiết kế 24/10 mục 3.4):
 *  · lộ trình FT có môn đăng ký L · R · W1 · W2 · S (NULL = đủ môn);
 *  · môn không học không thành việc / nợ / nhắc / SOS; Overall "Không đủ bộ môn"; chỉ W1 hoặc W2 → Writing = task đã học.
 */
export async function runPrMonDangKyTests(t: { check: any; checkAsync: any; assert: any; assertThrows: any; conn: any; P: any; TODAY: string; classId: (c: string) => number; addDays: any }) {
  const { check, assert, assertThrows, conn } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { migratePrMonDangKy } = await import('../migrate/prMonDangKy.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nP8 MON-DANG-KY — môn đăng ký L · R · W1 · W2 · S theo lộ trình FT');
  /** Chạy trong giao dịch rồi cuộn lại — phép kiểm không để dấu trên DB chung. */
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };

  // ------------------------------------------------------------------ Task 1: hàm thuần + dữ liệu
  check('MDK-1 · hàm thuần: NULL = đủ; chỉ W2 → bỏ task W1, không bỏ kỹ năng; bỏ W1 + W2 → Writing không học; rỗng / lạ → lỗi; chữ theo thứ tự L R W1 W2 S', () => {
    assert(d.laDuMon(null) && d.chuanMon(null).size === 5, 'NULL = đủ môn');
    const w2 = ['speaking', 'writing2', 'reading', 'listening'];
    assert(d.kyNangKhongHoc(w2).length === 0 && d.boTaskCua(w2) === 'writing1', 'chỉ W2: không bỏ kỹ năng, bỏ task W1');
    assert(d.boTaskCua(['writing1']) === 'writing2' && d.boTaskCua(null) === null, 'bỏ task W2 / đủ');
    assert(d.kyNangKhongHoc(['listening', 'reading', 'speaking']).join() === 'writing', 'bỏ cả W1 + W2 → Writing không học');
    assert(d.boTaskCua(['listening', 'reading', 'speaking']) === null, 'bỏ cả hai task: không đánh dấu task');
    assert(d.kyNangKhongHoc(['listening', 'reading', 'writing1', 'writing2']).join() === 'speaking', 'không học S');
    assert(d.monThieu(w2).join() === 'writing1', 'môn thiếu');
    assert(d.chuMon(w2) === 'L · R · W2 · S' && d.chuMon(null) === 'Đủ môn', `chữ: ${d.chuMon(w2)}`);
    assert(d.chuMon(JSON.stringify(w2)) === 'L · R · W2 · S', 'đọc được JSON từ DB');
    assertThrows(() => d.chuanMon([]), /ít nhất một môn/, 'rỗng → lỗi');
    assertThrows(() => d.chuanMon(['writing']), /không hợp lệ/, 'giá trị lạ → lỗi');
    assert(d.luuMon([...d.ENTRY_SKILLS]) === null, 'đủ 5 môn lưu NULL');
    assert(d.luuMon(w2) === JSON.stringify(['listening', 'reading', 'writing2', 'speaking']), `lưu theo thứ tự chuẩn: ${d.luuMon(w2)}`);
  });

  check('MDK-2 · migrate hai lần: lần hai không đổi; DB hiện có: mọi lộ trình NULL (đủ môn), mọi dòng lịch bo_task NULL', () => {
    thu(() => {
      conn.exec('ALTER TABLE learning_cycles DROP COLUMN mon_dang_ky');
      conn.exec('ALTER TABLE attempt_skills DROP COLUMN bo_task');
      const a1: string[] = []; migratePrMonDangKy(conn, a1);
      const a2: string[] = []; migratePrMonDangKy(conn, a2);
      assert(a1.length === 2 && a2.length === 0, `lần 1: ${a1.length}, lần 2: ${a2.length}`);
    });
    const a: string[] = []; migratePrMonDangKy(conn, a);
    assert(a.length === 0, 'schema.sql đã có cột');
  });
}
