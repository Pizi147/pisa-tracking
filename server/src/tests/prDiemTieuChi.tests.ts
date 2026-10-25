/**
 * PHÉP KIỂM P1 DIEM-TIEU-CHI (chủ SP 24/10, R4.4): tiêu chí W1 / W2 / S chỉ số nguyên 0–9 ở mọi đường nhập (hộp, Dán Excel, `saveScore`, lô);
 * band kỹ năng / Overall vẫn x.5; ô cũ có tiêu chí lẻ đọc được, gửi lại y nguyên không lỗi oan; lệnh chỉ đọc đếm ô cũ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrDiemTieuChiTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const d = await import('../../../shared/domain/chamDiem.ts');
  const dx = await import('../../../shared/domain/danExcel.ts');
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const intake: any = await import('../classes/intake.ts');
  const weekSvc: any = await import('../platform/week.ts');
  const { luuDiemLo } = await import('../cham/luuLo.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  const { demTieuChiLe } = await import('../ops/kiemTieuChiLe.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const L = d.LOI_TIEU_CHI_NGUYEN;

  check('DTC-1 · kiemTieuChi: số nguyên 0–9 / null hợp lệ; 6.5, -1, 10, NaN → câu số nguyên', () => {
    for (const v of [6, 0, 9, null]) assert(d.kiemTieuChi(v) === null, `${v} phải hợp lệ`);
    for (const v of [6.5, -1, 10, NaN]) assert(d.kiemTieuChi(v) === L, `${v} phải lỗi`);
  });

  check('DTC-2 · criteriaPatchFrom: 6.5 → lỗi số nguyên, không lệnh (xem trước vẫn có); 6 7 6 7 → band 6.5; "6,5" → lỗi', () => {
    const le = d.criteriaPatchFrom(['6', '6.5', '6', '6'], {});
    assert(le.loi === L && le.patch === null, JSON.stringify(le));
    assert(le.preview === 6, `xem trước ô cũ lẻ vẫn tính: ${le.preview}`);
    const ok = d.criteriaPatchFrom(['6', '7', '6', '7'], {});
    assert(ok.preview === 6.5 && ok.loi === null && JSON.stringify(ok.patch) === '{"criteria":[6,7,6,7]}', JSON.stringify(ok));
    const phay = d.criteriaPatchFrom(['6,5', '6', '6', '6'], {});
    assert(phay.loi !== null && phay.patch === null, JSON.stringify(phay));
    assert(/số nguyên/.test(d.LOI_TIEU_CHI), `LOI_TIEU_CHI nói số nguyên: ${d.LOI_TIEU_CHI}`);
    assert(JSON.stringify(d.criteriaPatchFrom(['-', '', '', ''], {}).patch) === '{"noShow":true}', '"-" vẫn là vắng');
    assert(JSON.stringify(d.criteriaPatchFrom(['', '', '', ''], {}).patch) === '{"criteria":[null,null,null,null]}', 'trống vẫn là xoá');
  });

  check('DTC-3 · xetODan: "6 6.5 6 6" → lỗi số nguyên; "6 7 6 7" → band 6.5; dán lại y nguyên ô cũ lẻ → bỏ qua', () => {
    const o = (criteria: (number | null)[], band: number | null): any => ({
      skill: 'writing1', required: true, canEdit: true, rawScore: null, band, criteria, bandThang: false,
    });
    const le = dx.xetODan({ diem: '6 6.5 6 6', nhanXet: '' }, o([null, null, null, null], null), 'cau');
    assert(le.loai === 'loi' && (le as any).loi === L, JSON.stringify(le));
    const phay = dx.xetODan({ diem: '6,5 6 6 6', nhanXet: '' }, o([null, null, null, null], null), 'cau');
    assert(phay.loai === 'loi' && (phay as any).loi === L, JSON.stringify(phay));
    const ok = dx.xetODan({ diem: '6 7 6 7', nhanXet: '' }, o([null, null, null, null], null), 'cau');
    assert(ok.loai === 'ghi' && ok.band === 6.5, JSON.stringify(ok));
    const cu = dx.xetODan({ diem: '6 6.5 6 6', nhanXet: '' }, o([6, 6.5, 6, 6], 6), 'cau');
    assert(cu.loai === 'bo', `ô cũ dán lại y nguyên: ${JSON.stringify(cu)}`);
    const cuNx = dx.xetODan({ diem: '6 6.5 6 6', nhanXet: 'Bố cục rõ, đủ ý' }, o([6, 6.5, 6, 6], 6), 'cau');
    assert(cuNx.loai === 'ghi' && JSON.stringify(cuNx.patch) === '{"nhanXet":"Bố cục rõ, đủ ý"}', `ô cũ + nhận xét mới chỉ gửi nhận xét: ${JSON.stringify(cuNx)}`);
  });

  const FT = classId('MB FT 101');
  const emFt = (ten: string) => {
    intake.commitIntake(P.admin, { classId: FT, rows: [{ fullName: `DTC ${ten}`, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `dtc-${ten}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', `DTC ${ten}`);
    const cy = get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, st.id);
    boLichTuTao(conn, cy.id);
    const a = luotThu(conn, attemptsSvc.createAttempt, P.admin, { chot: true, studentId: st.id, cycleId: cy.id, classId: FT, no: 1, periodId: weekSvc.ensurePeriod(weekSvc.mondayOf(t.TODAY)).id });
    return a.id as number;
  };
  const o = (aid: number, skill: string) => get('SELECT c1, c2, c3, c4, band FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, skill);

  check('DTC-4 · saveScore writing1: [6,6.5,6,6] → 400 câu số nguyên, ô không đổi; [6,7,6,7] → band 6.5', () => {
    const aid = emFt('Luu');
    const e = loiCua(() => attemptsSvc.saveScore(P.admin, aid, 'writing1', { criteria: [6, 6.5, 6, 6] }, t.TODAY));
    assert(e?.status === 400 && e.message === L, `${e?.status} ${e?.message}`);
    assert(!o(aid, 'writing1') || o(aid, 'writing1').c1 === null, 'ô không được ghi');
    attemptsSvc.saveScore(P.admin, aid, 'writing1', { criteria: [6, 7, 6, 7] }, t.TODAY);
    assert(o(aid, 'writing1').band === 6.5, `band ${o(aid, 'writing1').band}`);
  });

  check('DTC-5 · lô (Dán Excel): dòng có W1 lẻ báo lỗi, dòng khác lưu', () => {
    const a1 = emFt('Lo 1'), a2 = emFt('Lo 2');
    const kq: any = luuDiemLo(P.admin, { classId: FT, dong: [
      { attemptId: a1, o: [{ skill: 'writing1', criteria: [6, 6.5, 6, 6] }] },
      { attemptId: a2, o: [{ skill: 'writing1', criteria: [6, 7, 6, 7] }] },
    ] });
    assert(!kq.dong[0].ok && kq.dong[0].loi === L, JSON.stringify(kq.dong[0]));
    assert(kq.dong[1].ok && o(a2, 'writing1').band === 6.5, JSON.stringify(kq.dong[1]));
  });

  check('DTC-6 · ô cũ c2 = 6.5: lệnh không có criteria giữ nguyên; gửi lại y nguyên không lỗi; đổi một tiêu chí mà còn 6.5 → lỗi', () => {
    const aid = emFt('Cu');
    attemptsSvc.saveScore(P.admin, aid, 'speaking', { criteria: [6, 6, 6, 6] }, t.TODAY);
    conn.prepare(`UPDATE assessment_scores SET c2 = 6.5 WHERE attempt_id = ? AND skill = 'speaking'`).run(aid);
    attemptsSvc.saveScore(P.admin, aid, 'speaking', { note: 'Ghi chú P1' }, t.TODAY);
    const sau = o(aid, 'speaking');
    assert(sau.c1 === 6 && sau.c2 === 6.5 && sau.c3 === 6 && sau.c4 === 6, JSON.stringify(sau));
    assert(loiCua(() => attemptsSvc.saveScore(P.admin, aid, 'speaking', { criteria: [6, 6.5, 6, 6] }, t.TODAY)) === null, 'gửi lại y nguyên phải nhận');
    const e = loiCua(() => attemptsSvc.saveScore(P.admin, aid, 'speaking', { criteria: [7, 6.5, 6, 6], lyDo: 'Chấm lại P1' }, t.TODAY));
    assert(e?.status === 400 && e.message === L, `${e?.status} ${e?.message}`);
  });

  check('DTC-7 · demTieuChiLe: seed có ô lẻ → mảng không rỗng, soO > 0; chỉ đọc', () => {
    const truoc = get('SELECT COUNT(*) n, TOTAL(c1 + c2 + c3 + c4) s FROM assessment_scores');
    const ds = demTieuChiLe(conn);
    demTieuChiLe(conn);
    const sau = get('SELECT COUNT(*) n, TOTAL(c1 + c2 + c3 + c4) s FROM assessment_scores');
    assert(ds.length > 0 && ds.every((r) => r.soO > 0 && r.soLuot > 0 && ['writing1', 'writing2', 'speaking'].includes(r.kyNang)), JSON.stringify(ds));
    assert(truoc.n === sau.n && truoc.s === sau.s, 'DB phải giữ nguyên');
  });
}
