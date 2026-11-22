/**
 * PHÉP KIỂM LT-DONG-GV (mockup v23 L1): Lịch Test trả `gvLop` — GV đang dạy của MỌI lớp trên trang (khối Quá hạn chấm + Test tuần này),
 * không chỉ lớp còn bài của GV khác (QL); GV xem cũng có. Phân công đã kết thúc (GV nghỉ) không hiện. Chạy câu SQL thật (xoá nhớ trước mỗi lần).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLtDongGvTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const week: any = await import('../platform/week.ts');
  const cham: any = await import('../cham/canCham.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLT-DONG-GV · dòng GV dưới mã lớp ở Lịch Test');

  const THU_TU = ['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking', 'tong_hop'];
  /** Kỳ vọng độc lập: mỗi môn người phân công đầu tiên (đang hiệu lực), môn theo L R W S, trùng tên một lần. */
  const mongDoi = (classId: number) => {
    const ds = conn.prepare(`SELECT ta.skill, u.full_name ten FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? AND ta.status = 'active' AND ta.skill IS NOT NULL AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        ORDER BY ta.id`).all(classId, TODAY, TODAY) as any[];
    const dau = new Map<string, string>();
    for (const r of ds) if (!dau.has(r.skill)) dau.set(r.skill, r.ten);
    const hang = (k: string) => THU_TU.indexOf(k) + 1 || 99;
    return [...new Set([...dau].sort((a, b) => hang(a[0]) - hang(b[0])).map((x) => x[1]))];
  };
  const xem = (p: any) => {
    xoaNho();
    const lt = cham.lichTest(p, week.ensurePeriod(week.mondayOf(TODAY)).id, null, TODAY, { phamVi: 'tat-ca' });
    return { lt, lop: [...new Set([...lt.lop, ...lt.no].map((x: any) => x.classId as number))] };
  };

  check('LTGV-1 · mọi lớp trên trang có GV đang dạy (QL, QT, GV) — cả lớp không còn bài của GV khác; thứ tự môn, trùng tên một lần', () => {
    let soLop = 0, khongConKhac = 0;
    for (const [vai, p] of [['QL', P.mbManager], ['QT', P.admin], ['GVCN', P.coreTeacher], ['GVBM', P.subjectTeacher]] as const) {
      const { lt, lop } = xem(p);
      for (const id of lop) {
        const mong = mongDoi(id);
        assert(JSON.stringify(lt.gvLop[id] ?? []) === JSON.stringify(mong), `${vai} lớp ${id}: ${JSON.stringify(lt.gvLop[id])} ≠ ${JSON.stringify(mong)}`);
        soLop++;
      }
      /* Trước LT-DONG-GV chỉ lớp có "Còn chờ" GV khác mới nạp phân công — hàng không có ai khác chờ vẫn phải có tên. */
      khongConKhac += (lt.lop as any[]).filter((x) => !Object.keys(x.gvMon).length && lt.gvLop[x.classId]?.length).length;
    }
    assert(soLop > 0, 'bộ demo phải có lớp trên Lịch Test');
    assert(khongConKhac > 0, 'phải có hàng không còn chờ GV khác mà vẫn có dòng GV');
  });

  check('LTGV-2 · GV nghỉ (phân công đã kết thúc) không hiện', () => {
    const { lt, lop } = xem(P.mbManager);
    const id = lop.find((x) => (lt.gvLop[x]?.length ?? 0) > 0)!;
    assert(id, 'cần một lớp có GV');
    const ten = lt.gvLop[id][0] as string;
    const ds = conn.prepare(`SELECT ta.id, ta.effective_to den FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? AND u.full_name = ? AND ta.status = 'active'`).all(id, ten) as any[];
    try {
      for (const r of ds) conn.prepare('UPDATE teacher_assignments SET effective_to = ? WHERE id = ?').run(addDays(TODAY, -1), r.id);
      const sau = xem(P.mbManager).lt.gvLop[id] ?? [];
      assert(!sau.includes(ten), `${ten} đã nghỉ ở lớp ${id} mà còn hiện: ${JSON.stringify(sau)}`);
    } finally {
      for (const r of ds) conn.prepare('UPDATE teacher_assignments SET effective_to = ? WHERE id = ?').run(r.den, r.id);
      xoaNho();
    }
  });
}
