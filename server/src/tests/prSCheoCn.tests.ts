/**
 * PHÉP KIỂM S-CHEO-CN (chủ SP 16/11, sửa N7) — panel Chấm Speaking gom lớp → tuần + mục "Chi nhánh khác":
 *  · GV Speaking xem (hàng đợi `?cn=khac`) + LƯU ô S (Mock FT, MT0 lớp thường) lớp chi nhánh KHÁC; không L/R/W, không mở xem lớp / bảng chấm;
 *  · việc chi nhánh khác KHÔNG vào số việc "Chấm Speaking";
 *  · GV không có kỹ năng S: rỗng / 403; QL "Của GV" chỉ thấy chi nhánh trong quyền người xem.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';

/** Trần câu SQL `GET /my-work/cham-speaking?cn=khac` (GV Speaking MB, bộ demo: đo 13 câu, 110 dòng 16/11) — max(đo + 10, ⌈đo × 1,3⌉). */
export const TRAN_CHAM_SPEAKING_CN_KHAC = 23;

export async function runPrSCheoCnTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P, TODAY } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const perm: any = await import('../permissions.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { xoaNho, soCauSql, soDongSql } = await import('../platform/nguCanhRequest.ts');
  console.log('\nS-CHEO-CN · Chấm Speaking: lớp → tuần + mục "Chi nhánh khác" (GV Speaking chấm + lưu S chi nhánh khác)');
  (await import('../fasttrack/conOCho.ts')).capNhatConOChoTatCa();

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const tao = (tag: string, skills: string[]) => accounts.createAccount(P.admin, {
    email: `scheocn.${tag}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-scheocn', fullName: `Thử SCHEOCN ${tag}`, roles: [{ role: 'teacher', branches: ['MB'] }], skills,
  }).userId as number;
  const idS = tao('s', ['speaking']), idW = tao('w', ['writing1']);
  const gvS = () => perm.loadPrincipal(idS);
  const cnCua = (classId: number) => perm.bangLop().get(classId)?.branchId;

  check('SCN-1 · lopSChiNhanhKhac: GV S MB = lớp FT + lớp thường đang chạy ở chi nhánh ≠ MB; không quyền xem lớp đó; GV Writing / grant toàn hệ thống rỗng', () => {
    const ds = perm.lopSChiNhanhKhac(gvS(), TODAY) as number[];
    const ftNgoai = (conn.prepare('SELECT id FROM classes WHERE is_fast_track = 1 AND branch_id IS NOT NULL AND branch_id != ?').all(MB) as any[]).map((r) => r.id);
    assert(ftNgoai.length > 0 && ftNgoai.every((id) => ds.includes(id)), `thiếu lớp FT chi nhánh khác (${ds.length})`);
    assert(ds.every((id) => cnCua(id) !== MB), 'lọt lớp MB');
    assert(!perm.lopSChiNhanhKhac(perm.loadPrincipal(idW), TODAY).length, 'GV Writing có lớp chi nhánh khác');
    /* Quyền XEM giữ nguyên: Lịch Test / bảng chấm vẫn chỉ chi nhánh mình. */
    assert(!perm.coTheXemLuotCham(gvS(), { classId: ftNgoai[0] }) && !perm.lopFtChoGvSpeaking(gvS(), TODAY).includes(ftNgoai[0]), 'mở xem lớp chi nhánh khác');
    assert(perm.editableSkills(gvS(), ftNgoai[0], ['speaking', 'listening', 'writing1']).join() === 'speaking', 'sửa được: chỉ ô S');
    assert(perm.scoreEditPath(gvS(), ftNgoai[0], 'speaking') === 'assigned', 'đường ghi S');
  });

  check('SCN-2 · hàng đợi `cnKhac`: chỉ lớp chi nhánh khác, có tên chi nhánh; hàng đợi chính + việc Công việc KHÔNG cộng phần này', () => {
    const p = gvS();
    const chinh = svc.baiChamSpeaking(p, TODAY), khac = svc.baiChamSpeaking(p, TODAY, null, true);
    assert(khac.soBai > 0, 'dữ liệu demo: cần bài S chờ chấm ở chi nhánh khác');
    assert(khac.rows.every((r: any) => cnCua(r.classId) !== MB && r.branchName && r.cell.skill === 'speaking'), 'dòng chi nhánh khác sai');
    assert(khac.rows.filter((r: any) => r.cho).every((r: any) => r.cell.canEdit), 'bài chờ chi nhánh khác không sửa được');
    assert(chinh.rows.every((r: any) => cnCua(r.classId) === MB), 'hàng đợi chính lọt chi nhánh khác');
    const viec = ((mywork.myWork(p).dong ?? []) as any[]).find((x) => x.key === d.KHOA_CHAM_SPEAKING);
    assert(viec?.soBai === chinh.soBai, `việc Chấm Speaking ${viec?.soBai} ≠ hàng đợi chính ${chinh.soBai} (không cộng chi nhánh khác)`);
  });

  check('SCN-3 · GV S lưu ô S bài chi nhánh khác (người chấm = mình); L bị chặn; GV không S bị chặn 403', () => thu(() => {
    const r = svc.baiChamSpeaking(gvS(), TODAY, null, true).rows.find((x: any) => x.cho && x.cell.canEdit);
    assert(r, 'cần bài S chờ chấm chi nhánh khác');
    let ma = 0;
    try { svc.saveScore(perm.loadPrincipal(idW), r.attemptId, 'speaking', { criteria: [6, 6, 6, 6] }, TODAY); } catch (e: any) { ma = e.status ?? -1; }
    assert(ma === 403, `GV không S lưu S chi nhánh khác: ${ma}`);
    svc.saveScore(gvS(), r.attemptId, 'speaking', { criteria: [9, 9, 9, 9], nhanXet: 'Clear and fluent answers.' }, TODAY);
    const o = one(`SELECT band, entered_by, examiner_user_id FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, r.attemptId);
    assert(o?.band === 9 && o.entered_by === idS && o.examiner_user_id === idS, `ô S: ${JSON.stringify(o)}`);
    assertThrows(() => svc.saveScore(gvS(), r.attemptId, 'listening', { rawScore: 30 }, TODAY), /./, 'GV S nhập L chi nhánh khác');
  }));

  await checkAsync('SCN-4 · HTTP `?cn=khac`: GV S 200 + đo câu; GV Writing rỗng; QL "Của GV" không lộ chi nhánh ngoài quyền người xem; bảng chấm lớp khác vẫn 403', async () => {
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const goi = async (uid: number, url: string) => {
        const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(uid)}` } });
        return { status: res.status, json: await res.json().catch(() => null) as any };
      };
      const do_ = async (url: string) => {
        xoaNho();
        const c0 = soCauSql(), d0 = soDongSql();
        const r = await goi(idS, url);
        console.log(`      (đo: GV Speaking ${url} ${soCauSql() - c0} câu SQL, ${soDongSql() - d0} dòng đọc, ${r.json?.rows?.length} bài)`);
        return { r, cau: soCauSql() - c0, dong: soDongSql() - d0 };
      };
      await do_('/my-work/cham-speaking');
      const { r: s, cau, dong } = await do_('/my-work/cham-speaking?cn=khac');
      assert(dong <= 2000, `${dong} dòng đọc > 2 000 — báo PTA Plan`);
      assert(cau <= TRAN_CHAM_SPEAKING_CN_KHAC, `${cau} câu > trần ${TRAN_CHAM_SPEAKING_CN_KHAC}`);
      assert(s.status === 200 && s.json.rows.length > 0 && s.json.rows.every((r: any) => cnCua(r.classId) !== MB), `GV S: ${s.status}`);
      const w = await goi(idW, '/my-work/cham-speaking?cn=khac');
      assert(w.status === 200 && w.json.rows.length === 0, `GV Writing: ${w.status} ${w.json?.rows?.length}`);
      /* QL MB theo dõi GV S MB: phần chi nhánh khác lọc theo chi nhánh QL (MB) → không dòng nào ngoài MB. */
      const ql = await goi(P.mbManager.userId, `/my-work/cham-speaking?nguoi=${idS}&cn=khac`);
      const { pv } = mywork.gvDangXem(P.mbManager, idS);
      assert(ql.status === 200 && ql.json.rows.every((r: any) => !pv.branchIds || pv.branchIds.includes(cnCua(r.classId))), `QL Của GV lộ chi nhánh: ${ql.status}`);
      assert(!pv.branchIds || ql.json.rows.length === 0, 'QL MB thấy bài chi nhánh khác');
      const lop = s.json.rows[0].classId;
      const b = await goi(idS, `/classes/${lop}/diem-theo-luot/mt:1`);
      assert(b.status === 403, `bảng chấm lớp chi nhánh khác phải 403: ${b.status}`);
    } finally { may.close(); }
  });

  check('SCN-5 · web: panel gom lớp → tuần; "Chi nhánh khác" chỉ tải khi mở (`?cn=khac`), lưu ở đó không gọi onDaLam (không vào số việc)', () => {
    const f = docSach('web/src/modules/congViec/PanelChamSpeaking.tsx');
    assert(/useApi<DuLieu>\(moKhac \? duong\(true\) : null/.test(f), 'Chi nhánh khác tải lúc mở panel');
    assert(/cnKhac \? 'cn=khac'/.test(f), 'thiếu tham số cn=khac');
    assert(/const daLuuKhac = \(\) => \{ setSoLuu\(\(n\) => n \+ 1\); khac\.reload\(\); \};/.test(f), 'lưu chi nhánh khác gọi onDaLam');
    assert(/b\.moiNhat\.localeCompare\(a\.moiNhat\) \|\| soSanhLop/.test(f), 'lớp không xếp theo tuần gần nhất');
    assert(!/Tuần cũ hơn/.test(f), 'còn "Tuần cũ hơn" (đã bỏ — mỗi tuần là ngăn gập trong lớp)');
  });
}
