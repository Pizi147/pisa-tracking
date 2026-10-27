/**
 * PHÉP KIỂM SV-BAI-LOP — Bài trên lớp (V5 C11, T18; 08-ke-hoach-trien-khai mục 5):
 *   (1) T18: GV ghi bài thang /10 → bảng riêng, KHÔNG thêm điểm MT, việc hay thông báo; đọc lại ở hồ sơ HV;
 *   (2) kiểm dữ liệu: điểm 0..thang, thang > 0, tên bài bắt buộc, tuần không tương lai, kỹ năng của lớp, em học lớp;
 *   (3) quyền: GV dạy kỹ năng → kỹ năng đó; GVCN / QL mọi kỹ năng; QL chi nhánh khác, TVV ghi → 403; đọc theo quyền xem HV;
 *   (4) sửa / xoá có lịch sử (`/lich-su?loai=bai-lop`), lưu y nguyên không ghi; (5) xoá HV xoá bài; migrate chạy lặp được. Mỗi ca cuộn lại.
 */
export async function runPrSvBaiLopTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const bai: any = await import('../students/baiTrenLop.ts');
  const xoaHV: any = await import('../students/xoaHocVien.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { lichSu } = await import('../platform/lichSu.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { migratePrSvBaiLop } = await import('../migrate/prSvBaiLop.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const { addDays } = await import('../util.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSV-BAI-LOP · Bài trên lớp: T18 · kiểm dữ liệu · quyền · sửa / xoá có lịch sử · xoá HV · migrate');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const LOP = classId('MB FT 101');
  const LOP_THUONG = classId('MB FOU 12');
  const tuan = mondayOf(demoToday());
  const em = (lop = LOP) => get(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`, lop).student_id as number;
  const mau = (o: Record<string, unknown> = {}) => ({ classId: LOP, skill: 'writing', tenBai: 'Task 1 line graph', diem: 7, thang: 10, tuan, nhanXet: 'Thiếu overview.', ...o });   // SV-BAI-LOP-2: nhận xét bắt buộc
  const dem = () => ['assessment_scores', 'tasks', 'notifications'].map((b) => get(`SELECT COUNT(*) AS n FROM ${b}`).n).join();
  let seq = 0;
  const taoNguoi = (role: string, branches: string[]) => {
    seq += 1;
    return loadPrincipal(accounts.createAccount(P.admin, { email: `svbl.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-svbl', fullName: `Thử SVBL ${seq}`, roles: [{ role, branches }] }).userId as number);
  };

  check('SVBL-1 · T18: GV W1 ghi bài W 7/10 → bảng bai_tren_lop, đọc lại ở hồ sơ HV; không thêm điểm MT, việc, thông báo', () => thu(() => {
    const sid = em();
    const truoc = dem();
    const r = bai.themBaiTrenLop(P.w1Teacher, sid, mau({ tenBai: '  Task 1 line graph  ', tuan: addDays(tuan, 2), nhanXet: 'Thiếu overview.' }));
    assert(r.id && r.ghiBoi === P.w1Teacher.fullName, `trả về ${JSON.stringify(r)}`);
    assert(dem() === truoc, `điểm MT / việc / thông báo đổi: ${truoc} → ${dem()}`);
    const ds = bai.dsBaiTrenLop(P.mbManager, sid);
    const b = ds.bai.find((x: any) => x.id === r.id);
    assert(b && b.tenBai === 'Task 1 line graph' && b.diem === 7 && b.thang === 10 && b.tuan === tuan && /^W\d [A-Z]{3}$/.test(b.tuanMa)
      && b.nhanXet === 'Thiếu overview.' && b.ghiBoi === P.w1Teacher.fullName && b.sua === true && b.lop === 'MB FT 101', `bài ${JSON.stringify(b)}`);
    assert(ds.lop.some((l: any) => l.classId === LOP && l.kyNang.join() === 'listening,reading,writing,speaking'), `lớp QL ${JSON.stringify(ds.lop)}`);
    assert(get(`SELECT action FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? ORDER BY id DESC LIMIT 1`, sid).action === 'bai_tren_lop.them', 'nhật ký them');
    assert(bai.themBaiTrenLop(P.w1Teacher, sid, mau({ diem: 6.5 })).id, 'điểm lẻ 6.5 / 10 được');
  }));

  check('SVBL-2 · kiểm dữ liệu: điểm > thang, âm, chữ; thang 0; tên > 120; tuần tương lai; kỹ năng ngoài lớp; em không học lớp → 400', () => thu(() => {
    const sid = em();
    const sai: [string, Record<string, unknown>, number?][] = [
      ['điểm > thang', { diem: 11 }], ['điểm âm', { diem: -1 }], ['điểm chữ', { diem: '7' }], ['thang 0', { thang: 0 }],
      ['tên 121', { tenBai: 'x'.repeat(121) }], ['tuần tương lai', { tuan: addDays(tuan, 7) }],
      ['tuần sai', { tuan: '14/09' }], ['kỹ năng W1', { skill: 'writing1' }], ['nhận xét 501', { nhanXet: 'x'.repeat(501) }], ['thiếu lớp', { classId: null }],
    ];
    for (const [ten, o] of sai) assert(maLoi(() => bai.themBaiTrenLop(P.mbManager, sid, mau(o))) === 400, `${ten} → 400`);
    assert(maLoi(() => bai.themBaiTrenLop(P.mbManager, em(LOP_THUONG), mau())) === 400, 'em không học lớp → 400');
    assert(!get('SELECT 1 AS c FROM bai_tren_lop WHERE student_id = ?', sid), 'không dòng nào lọt');
  }));

  check('SVBL-3 · quyền: GV W1 chỉ W (L 403); GVCN mọi kỹ năng; QL chi nhánh khác 403; TVV đọc được, ghi 403; lớp thường GVCN ghi', () => thu(() => {
    const sid = em();
    assert(maLoi(() => bai.themBaiTrenLop(P.w1Teacher, sid, mau({ skill: 'listening' }))) === 403, 'GV W1 ghi L → 403');
    for (const k of ['listening', 'reading', 'writing', 'speaking']) bai.themBaiTrenLop(P.coreTeacher, sid, mau({ skill: k }));
    assert(maLoi(() => bai.themBaiTrenLop(P.cpManager, sid, mau())) === 403, 'QL chi nhánh khác → 403');
    assert(maLoi(() => bai.dsBaiTrenLop(P.cpManager, sid)) === 403, 'QL chi nhánh khác đọc → 403');
    const TVV = taoNguoi('consultant', ['MB']);
    const ds = bai.dsBaiTrenLop(TVV, sid);
    assert(ds.bai.length === 4 && ds.bai.every((x: any) => !x.sua) && ds.lop.every((l: any) => !l.kyNang.length), `TVV chỉ đọc ${JSON.stringify(ds.lop)}`);
    assert(maLoi(() => bai.themBaiTrenLop(TVV, sid, mau())) === 403, 'TVV ghi → 403');
    const w1 = bai.dsBaiTrenLop(P.w1Teacher, sid).bai as any[];
    assert(w1.filter((x) => x.sua).map((x) => x.skill).join() === 'writing', `GV W1 sửa được ${w1.map((x) => `${x.skill}:${x.sua}`)}`);
    const sidT = em(LOP_THUONG);
    const kn = bai.dsBaiTrenLop(P.normalCoreTeacher, sidT).lop.find((l: any) => l.classId === LOP_THUONG).kyNang[0];
    assert(bai.themBaiTrenLop(P.normalCoreTeacher, sidT, mau({ classId: LOP_THUONG, skill: kn })).id, `GVCN lớp thường ghi ${kn}`);
  }));

  check('SVBL-4 · sửa / xoá: có lịch sử cũ → mới; lưu y nguyên không ghi; GV W1 sửa / xoá bài L → 403; /lich-su?loai=bai-lop mới trước', () => thu(() => {
    const sid = em();
    const { id } = bai.themBaiTrenLop(P.w1Teacher, sid, mau());
    const nk = () => get(`SELECT COUNT(*) AS n FROM audit_logs WHERE action LIKE 'bai_tren_lop.%' AND entity_id = ?`, sid).n;
    assert(bai.suaBaiTrenLop(P.w1Teacher, id, mau()).doi === false && nk() === 1, 'lưu y nguyên không ghi nhật ký');
    const r = bai.suaBaiTrenLop(P.w1Teacher, id, mau({ diem: 8, nhanXet: 'Đã có overview.' }));
    assert(r.doi && get('SELECT diem, sua_boi FROM bai_tren_lop WHERE id = ?', id).sua_boi === P.w1Teacher.userId, 'sửa lưu người sửa');
    assert(maLoi(() => bai.suaBaiTrenLop(P.w1Teacher, id, mau({ skill: 'listening' }))) === 403, 'GV W1 đổi sang L → 403');
    const { id: idL } = bai.themBaiTrenLop(P.coreTeacher, sid, mau({ skill: 'listening' }));
    assert(maLoi(() => bai.suaBaiTrenLop(P.w1Teacher, idL, mau({ skill: 'listening' }))) === 403, 'GV W1 sửa bài L → 403');
    assert(maLoi(() => bai.xoaBaiTrenLop(P.w1Teacher, idL)) === 403, 'GV W1 xoá bài L → 403');
    assert(maLoi(() => bai.suaBaiTrenLop(P.w1Teacher, 987654, mau())) === 404, 'không có bài → 404');
    bai.xoaBaiTrenLop(P.w1Teacher, id);
    assert(!get('SELECT 1 AS c FROM bai_tren_lop WHERE id = ?', id), 'xoá hẳn dòng');
    const ls = lichSu(P.mbManager, { loai: 'bai-lop', id: sid });
    const tom = ls.dong.map((d: any) => d.truong.map((x: any) => `${x.ten}:${x.cu ?? '∅'}>${x.moi ?? '∅'}`).join('|'));
    assert(ls.dong.length === 4, `4 mục (thêm W, sửa, thêm L, xoá) ${JSON.stringify(tom)}`);
    assert(tom[0].includes('Điểm:8 / 10>∅') && tom[2].includes('Điểm:7 / 10>8 / 10') && tom[2].includes('Nhận xét:Thiếu overview.>Đã có overview.'), `cũ → mới ${JSON.stringify(tom)}`);
    assert(ls.dong[2].truong.every((x: any) => x.doiTuong.startsWith('MB FT 101 · ') && x.doiTuong.endsWith('Task 1 line graph')), 'đối tượng = lớp · tuần · kỹ năng · tên bài');
    assert(maLoi(() => lichSu(P.cpManager, { loai: 'bai-lop', id: sid })) === 403, 'lịch sử ngoài phạm vi → 403');
  }));

  check('SVBL-5 · xoá học viên xoá bài trên lớp của em', () => thu(() => {
    const sid = em();
    bai.themBaiTrenLop(P.mbManager, sid, mau());
    assert(xoaHV.BANG_CUA_HOC_VIEN.includes('bai_tren_lop'), 'có trong BANG_CUA_HOC_VIEN');
    for (const q of xoaHV.CAU_XOA_HOC_VIEN) if (!q.sql.startsWith('SELECT')) conn.prepare(q.sql).run(sid);
    assert(!get('SELECT 1 AS c FROM bai_tren_lop WHERE student_id = ?', sid), 'dòng của em đã xoá');
  }));
  const { default: Database } = await import('libsql');
  check('SVBL-6 · migrate prSvBaiLop chạy lặp được: thiếu bảng thì tạo, lần hai không làm gì', () => {
    /* DB riêng trong bộ nhớ: bảng của DB thử có câu lệnh nhớ sẵn (db.ts) nên không DROP được. */
    const moi = new Database(':memory:');
    try {
      const a: string[] = []; migratePrSvBaiLop(moi, a);
      const b: string[] = []; migratePrSvBaiLop(moi, b);
      assert(a.length === 1 && b.length === 0 && moi.prepare(`SELECT 1 AS c FROM sqlite_master WHERE name = 'bai_tren_lop'`).get(), `migrate ${a} / ${b}`);
    } finally { moi.close(); }
  });
}
