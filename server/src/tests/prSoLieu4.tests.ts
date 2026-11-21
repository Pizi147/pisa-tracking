/**
 * PHÉP KIỂM GÓI 7 SO-LIEU-4 (AUDIT-2111, N63) — mỗi mục so HAI đường cùng một số:
 *  · B2-08: ô "Chờ chấm · n việc" của QL ở hồ sơ lớp (`soChoChamLop`) = số dòng tab Chấm điểm của lớp ở Công việc › Tất cả (`myWork` tat-ca).
 *  · B2-10: "Nhập điểm MT cũ" (`lich-su:{lớp}`) của GVCN ở Công việc có ở thanh việc hồ sơ HV của MỌI em trong `emIds` (cùng khoá).
 *  · TVV cũ (sau #1948): vai TVV chuyển sang chi nhánh khác → `/my-work` không còn việc TVV / Báo PH của em chi nhánh cũ; TVV hiện tại vẫn còn, badge = Σ dòng.
 *  · B2-07 / B2-03 (hàm chung): `badgeTab` đếm cần làm ngay, `n` = tổng dòng; `badgeLop` ô Chờ chấm theo việc khi có `soViecChoCham`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSoLieu4Tests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t as any;
  console.log('\nSO-LIEU-4 · số liệu cùng nguồn (AUDIT-2111 gói 7)');
  const d: any = await import('../../../shared/domain/index.ts');
  const { myWork, nhanNhomViec } = await import('../worklist/mywork.ts');
  const { viecTheoEmCuaLop } = await import('../classes/viecTheoEm.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const lop = classId('MB FT 101');

  check('B2-08 · ô "Chờ chấm · n việc" (QL) = số dòng tab Chấm điểm của lớp ở Công việc › Tất cả; GV không có số này', () => {
    xoaNho();
    const so = viecTheoEmCuaLop(P.mbManager, lop, { chiToi: true }).soChoChamLop;
    xoaNho();
    const w = ((myWork(P.mbManager, { nguoi: 'tat-ca' }) as any).items as any[])
      .filter((it) => it.classId === lop && !d.laViecChamCheo(it) && d.tabCuaViec(it) === 'cham-diem');
    const dich = d.demDongViec(d.gopViecTheoLop(w, nhanNhomViec)).n;
    assert(so === dich && (so ?? 0) > 0, `hồ sơ lớp ${so} ↔ Công việc ${dich}`);
    assert(viecTheoEmCuaLop(P.coreTeacher, lop, { chiToi: true }).soChoChamLop === null, 'GV: null (ô giữ số bài)');
    const b = d.badgeLop({ vai: 'ql', needsPlacement: false, canXepLop: 0, missingSkills: [], soBaiChoCham: 65, soViecChoCham: 16, needScoresTitle: null, phase: 'running', missingCount: 0 });
    const cham = [...b.hien, ...b.an].find((x: any) => x.key === 'cham');
    assert(cham?.so === 16 && /16 việc/.test(cham.nhan), `nhãn ${cham?.nhan}`);
    const b0 = d.badgeLop({ vai: 'ql', needsPlacement: false, canXepLop: 0, missingSkills: [], soBaiChoCham: 65, soViecChoCham: 0, needScoresTitle: null, phase: 'running', missingCount: 0 });
    assert(![...b0.hien, ...b0.an].some((x: any) => x.key === 'cham'), '0 việc → không ô');
  });

  check('B2-10 · "Nhập điểm MT cũ" của GVCN: Công việc ↔ thanh việc hồ sơ HV từng em (cùng khoá lich-su:{lớp})', () => {
    xoaNho();
    const ds = ((myWork(P.coreTeacher) as any).items as any[]).filter((it) => String(it.key).startsWith('lich-su:') && it.mine);
    assert(ds.length > 0, 'seed có việc MT cũ của GVCN');
    let soEm = 0;
    for (const it of ds) for (const sid of it.emIds as number[]) {
      xoaNho();
      const hs: any = studentProfile(P.coreTeacher, sid);
      const cuaBan = (hs.dauHoSo?.viec?.cuaBan ?? []) as any[];
      assert(cuaBan.some((x) => x.key === it.key), `em ${sid}: thiếu ${it.key} ở hồ sơ HV`);
      soEm++;
    }
    /* Người không là GVCN (GVBM của lớp) không có việc này ở hồ sơ HV — như Công việc. */
    const sid = (ds[0].emIds as number[])[0];
    xoaNho();
    const bm: any = studentProfile(P.subjectTeacher, sid);
    assert(!((bm.dauHoSo?.viec?.cuaBan ?? []) as any[]).some((x) => String(x.key).startsWith('lich-su:')), 'GVBM không giữ việc MT cũ');
    assert(soEm > 0, 'đã so ít nhất một em');
  });

  check('TVV cũ (đổi chi nhánh) · /my-work không còn việc TVV / Báo PH của em chi nhánh cũ; TVV hiện tại giữ nguyên; badge = Σ dòng', () => {
    const r = mot(`SELECT s.consultant_user_id AS tvv FROM viec_bao_ph v JOIN students s ON s.id = v.student_id
      WHERE v.trang_thai = 'mo' AND v.phu_trach_id IS NULL AND s.consultant_user_id IS NOT NULL ORDER BY v.id LIMIT 1`);
    assert(r?.tvv, 'seed có Báo PH mở của một TVV');
    xoaNho();
    const tvv = loadPrincipal(r.tvv);
    const truoc = myWork(tvv) as any;
    const cuaToi = (truoc.items as any[]).filter((it) => it.mine);
    assert(cuaToi.length > 0, 'TVV hiện tại có việc');
    const khac = mot(`SELECT id FROM branches WHERE id NOT IN (${tvv.grants.map((g: any) => g.branchId ?? 0).join(',') || 0}) ORDER BY id LIMIT 1`).id as number;
    const cu = { ...tvv, grants: tvv.grants.map((g: any) => (g.roleKey === 'consultant' ? { ...g, branchId: khac } : g)) };
    xoaNho();
    const sau = myWork(cu as any) as any;
    const conLai = ((sau.items ?? []) as any[]).filter((it) => it.mine && it.studentId !== null);
    const emCu = new Set(cuaToi.filter((it) => it.studentId !== null).map((it) => it.studentId));
    assert(!conLai.some((it) => emCu.has(it.studentId) && (it.group === 'bao_ph_yt' || it.group === 'missing_data' || it.group === 'bo_sung_ho_so')),
      `TVV cũ còn: ${conLai.filter((it) => emCu.has(it.studentId)).map((it) => it.key).join(', ')}`);
    assert((sau.summary?.total ?? 0) < (truoc.summary?.total ?? 0), `badge giảm: ${truoc.summary?.total} → ${sau.summary?.total}`);
    xoaNho();
    assert((myWork(tvv) as any).summary.total === truoc.summary.total, 'TVV hiện tại: số không đổi');
  });

  check('B2-07 / B2-03 · badgeTab: số = cần làm ngay, n = tổng dòng (rê chuột "m quá hạn trong n việc")', () => {
    const b = d.badgeTab([{ urgency: 'overdue' }, { urgency: 'normal' }, { urgency: 'normal' }, { urgency: 'today' }, { urgency: 'normal' }]);
    assert(b.so === 2 && b.n === 5 && b.quaHan === 1 && b.homNay === 1, JSON.stringify(b));
    const bai = d.demBai([{ soBai: 10, baiQuaHan: 7, urgency: 'overdue' }, { soBai: 8, baiQuaHan: 5, urgency: 'overdue' }]);
    assert(bai.n === 18 && bai.quaHan === 12, JSON.stringify(bai));
  });
}
