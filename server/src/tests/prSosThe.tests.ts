/**
 * PHÉP KIỂM PHOI-HOP-SOS-INFO (chủ SP 06/11): thẻ kết quả SOS (lượt · Overall so kỳ vọng · kỹ năng trượt) CÙNG MỘT nguồn ở Công việc, hồ sơ lớp, hồ sơ HV.
 *   S1 — hàm chữ dùng chung (`nhanDocTheSos`, `chuTruotSos`): ✗ + kỳ vọng + "trượt L, W"; đạt không ✗; lớp thường ghi %.
 *   S2 — dòng việc `phoi_hop_sos` (`/my-work`) mang thẻ GIỐNG HỆT thẻ của chính lượt đó ở tab Phối hợp lớp và hồ sơ HV (ba đường); tối đa 3 thẻ, `count` giữ số lượt.
 *   S3 — luật Turso: thẻ cho cả tập lớp không thêm câu theo lớp / em (số câu `dongPhoiHopLop` một lớp ≈ mọi lớp).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSosTheTests(t: YThucTestKit & { P: any }) {
  const { check, assert, conn, P } = t;
  console.log('\nPHOI-HOP-SOS-INFO · thẻ kết quả SOS ba nơi cùng nguồn');
  const d: any = await import('../../../shared/domain/index.ts');
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { chayTrongRequest, soCauSql } = await import('../platform/nguCanhRequest.ts');

  check('S1 · nhanDocTheSos / chuTruotSos: hụt có ✗ + kỳ vọng + kỹ năng trượt; đạt không ✗; lớp thường %', () => {
    const hut = { luot: 'MT2', ovr: 5.5, moc: 6, truot: ['L', 'W'], tam: false };
    const c = d.nhanDocTheSos(hut);
    assert(c.includes('MT2') && c.includes('✗ 5.5') && c.includes('6.0') && c.includes('trượt L, W'), `câu hụt: "${c}"`);
    assert(d.datTheSos(hut) === false && d.chuTruotSos(hut) === 'trượt L, W', 'hụt');
    const dat = d.nhanDocTheSos({ luot: 'MT3', ovr: 6.5, moc: 6, truot: [], tam: false });
    assert(dat.includes('✓ 6.5') && !dat.includes('✗') && !dat.includes('trượt'), `câu đạt: "${dat}"`);
    const chua = d.nhanDocTheSos({ luot: 'MT2', ovr: null, moc: 6, truot: ['R'], tam: true });
    assert(!/\d\.\d/.test(chua.replace('MT2', '')) && chua.includes('trượt R'), `chưa đủ bốn kỹ năng không dựng Overall: "${chua}"`);
    const thuong = d.nhanDocTheSos({ luot: 'Giữa khoá', ovr: 43, moc: 70, pt: true, truot: ['G+V'], tam: false });
    assert(thuong.includes('43 %') && thuong.includes('70 %') && thuong.includes('trượt G+V'), `lớp thường: "${thuong}"`);
  });

  check('S2 · PHOI-HOP-V2 (chủ SP 11/11: ô việc không điểm): dòng Phối hợp SOS (/my-work) không mang thẻ; thẻ của tab lớp = hồ sơ HV', () => {
    let soThe = 0;
    for (const gv of [P.coreTeacher, P.mbManager, P.admin]) {
      for (const it0 of (mywork.myWork(gv, gv === P.coreTeacher ? {} : { nguoi: 'tat-ca' }).items as any[]).filter((i) => i.group === 'phoi_hop_sos')) {
        assert(!('theSos' in it0) && Array.isArray(it0.emTen) && it0.emTen.length === Math.min(it0.count, 3), `lớp ${it0.classCode}: dòng còn thẻ / thiếu tên em`);
        const it = { ...it0, theSos: phoiHop.coordinationOfClass(gv, it0.classId).rows.filter((r: any) => it0.emIds.includes(r.studentId)).slice(0, 3) };
        const lop = new Map<number, any>(phoiHop.coordinationOfClass(gv, it.classId).rows.map((r: any) => [r.attemptId, r]));
        for (const x of it.theSos as any[]) {
          soThe++;
          const r = lop.get(x.attemptId);
          assert(r && r.studentId === x.studentId && r.studentName === x.studentName, `lượt ${x.attemptId} không có ở tab Phối hợp lớp`);
          assert(JSON.stringify(r.the) === JSON.stringify(x.the), `lớp ${it.classCode} lượt ${x.attemptId}: thẻ Công việc ${JSON.stringify(x.the)} ≠ tab lớp ${JSON.stringify(r.the)}`);
          const hv = phoiHop.coordinationOfStudent(gv, x.studentId).rows.find((r2: any) => r2.attemptId === x.attemptId);
          assert(hv && JSON.stringify(hv.the) === JSON.stringify(x.the), `lượt ${x.attemptId}: hồ sơ HV khác thẻ Công việc`);
          assert(x.the.truot.every((k: string) => typeof k === 'string' && k.length > 0) && d.nhanDocTheSos(x.the).includes(x.the.luot), 'thẻ có lượt + kỹ năng chữ');
        }
      }
    }
    assert(soThe > 0, 'bộ demo phải có dòng Phối hợp SOS có thẻ');
  });

  check('S3 · luật Turso: thẻ cả tập lớp không thêm câu theo lớp / em', () => {
    const lopCoLuot = [...new Set((phoiHop.dongPhoiHopLop((conn.prepare(`SELECT id FROM classes WHERE status = 'active'`).all() as any[]).map((r) => r.id)) as any[]).map((l) => l.classId))] as number[];
    assert(lopCoLuot.length > 0, 'phải có lớp còn lượt');
    const cau = (ids: number[]) => chayTrongRequest('GET', () => { const a = soCauSql(); phoiHop.dongPhoiHopLop(ids); return soCauSql() - a; });
    const mot = cau([lopCoLuot[0]]), tatCa = cau((conn.prepare(`SELECT id FROM classes WHERE status = 'active'`).all() as any[]).map((r) => r.id));
    assert(tatCa <= mot + 2, `${tatCa} câu cho mọi lớp so ${mot} câu cho một lớp — thẻ đang đọc theo lớp / em`);
  });
}
