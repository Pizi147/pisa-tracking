/**
 * OV6-DOC-CHON (PTA Overhaul 14/11, chủ SP 06/11 "luôn tối ưu dòng đọc"): ô chọn / ô tìm đọc ít hơn, kết quả người dùng thấy như cũ.
 *  - `/students?q&gioiHan=n` (ô tìm thanh trên): LIMIT trong SQL — trước đọc mọi em khớp (mỗi em ~5 câu con) rồi web cắt còn 6.
 *  - `/classes?gon=1` (ô Lớp của Giao việc): chỉ mã lớp + sĩ số, cùng phạm vi + thứ tự `/classes` — không đếm Case / ô điểm từng lớp.
 */
export async function runPrOv6DocChonTests(t: any) {
  const { check, assert, P } = t;
  const students: any = await import('../students/students.ts');
  const classes: any = await import('../classes/classes.ts');
  const { xoaNho, soCauSql, soDongSql } = await import('../platform/nguCanhRequest.ts');
  const PHAM_VI = { QL: P.mbManager, QT: P.admin, GVCN: P.coreTeacher, GVBM: P.subjectTeacher } as Record<string, any>;
  const doDem = <T>(f: () => T) => { xoaNho(); const c = soCauSql(), d = soDongSql(); const r = f(); return { r, cau: soCauSql() - c, dong: soDongSql() - d }; };

  check('OV6-DOC-CHON · /students?q&gioiHan=6 trả đúng 6 dòng đầu của bản không giới hạn, ít câu hơn (mọi vai)', () => {
    const sai: string[] = [];
    for (const [vai, p] of Object.entries(PHAM_VI)) {
      const du = doDem(() => students.listStudents(p, { q: 'ng' }).rows as any[]);
      const cat = doDem(() => students.listStudents(p, { q: 'ng', gioiHan: 6 }).rows as any[]);
      const gon = doDem(() => students.listStudents(p, { q: 'ng', gioiHan: 6, gon: true }).rows as any[]);
      if (du.r.length <= 6) { sai.push(`${vai}: bộ demo chỉ ${du.r.length} em khớp "ng" — phép kiểm vô nghĩa`); continue; }
      if (JSON.stringify(cat.r) !== JSON.stringify(du.r.slice(0, 6))) sai.push(`${vai}: 6 dòng khác 6 dòng đầu bản đủ`);
      /* `gon`: đúng các trường ô tìm thanh trên đọc (Header.tsx `SearchHit`) + id lớp / chi nhánh, giá trị trùng bản đủ. */
      const TRUONG = ['id', 'studentCode', 'fullName', 'email', 'status', 'archived', 'classId', 'classCode', 'branchName', 'openCase'];
      const chon = (r: any) => Object.fromEntries(TRUONG.map((k) => [k, r[k]]));
      if (JSON.stringify(gon.r) !== JSON.stringify(du.r.slice(0, 6).map(chon))) sai.push(`${vai}: gon khác trường bản đủ`);
      if (!(gon.cau < cat.cau && cat.cau < du.cau)) sai.push(`${vai}: ${du.cau} → ${cat.cau} → ${gon.cau} câu`);
      console.log(`    ${vai} /students?q=ng: ${du.cau} câu / ${du.dong} dòng → gioiHan=6: ${cat.cau} / ${cat.dong} → + gon: ${gon.cau} / ${gon.dong}`);
    }
    /* needAttention lọc SAU khi dựng dòng — không cắt trong SQL (giới hạn bỏ qua). */
    const ca = students.listStudents(P.mbManager, { needAttention: true }).rows.length;
    if (students.listStudents(P.mbManager, { needAttention: true, gioiHan: 1 }).rows.length !== ca) sai.push('needAttention bị cắt');
    assert(!sai.length, sai.join(' · '));
  });

  check('OV6-DOC-CHON · lopGon = id, mã, sĩ số của /classes (cùng phạm vi, cùng thứ tự), ít câu + dòng hơn (mọi vai, có chi nhánh)', () => {
    const sai: string[] = [];
    const mb = (t.conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
    for (const [vai, p] of Object.entries(PHAM_VI)) {
      for (const branchId of [undefined, mb]) {
        const du = doDem(() => (classes.listClassSummaries(p, { branchId }).rows as any[]).map((c) => ({ id: c.id, code: c.code, studentCount: c.studentCount })));
        const gon = doDem(() => classes.lopGon(p, branchId).rows as any[]);
        if (!du.r.length) sai.push(`${vai}: không có lớp`);
        if (JSON.stringify(gon.r) !== JSON.stringify(du.r)) sai.push(`${vai} cn=${branchId ?? '-'}: khác /classes`);
        if (gon.cau >= du.cau || gon.dong >= du.dong) sai.push(`${vai}: ${du.cau}/${du.dong} → ${gon.cau}/${gon.dong}`);
        if (!branchId) console.log(`    ${vai} /classes: ${du.cau} câu / ${du.dong} dòng → gon=1: ${gon.cau} câu / ${gon.dong} dòng`);
      }
    }
    assert(!sai.length, sai.join(' · '));
  });
}
