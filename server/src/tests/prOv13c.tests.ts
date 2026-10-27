/**
 * PHÉP KIỂM OV-13c (đặc tả OV-13 §0 Q4, §3 dòng 4; mockup OV-13 §3a) — Gom Công việc:
 *  · khoá gộp mới: Case SOS FT (Xác nhận PA, Ghi nhận xét) theo lớp + tuần thi + mức SOS (khác MT vẫn gộp, khác SOS / tuần tách); Thêm PA từng dòng;
 *    Nhập điểm theo tuần thi qua nhiều lớp; dòng "1 em" hai việc ghi "1 em · 2 việc".
 *  · Xác nhận PA cùng lúc: n PA xong, m PA lỗi báo riêng (giữ lại), quyền từng PA; người dạy chung không đè người đã có; ngày bắt đầu.
 *  · số trên dòng = số em trong dòng (panel đọc `con`) — cùng nguồn `/my-work`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13cTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const hanGio: any = await import('../platform/hanGio.ts');
  console.log('\nOV-13c · gom Công việc theo tuần + lớp + mức SOS · Xác nhận PA cùng lúc');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  /** PA quy chế đang chờ "Xác nhận PA" — đúng tập việc của Công việc (đã loại Case chờ "Không cần theo dõi"). */
  const choPa = () => (mywork.myWork(P.mbManager, { nguoi: 'tat-ca' }).items as any[]).filter((x) => x.group === 'xac_nhan_pa')
    .map((x) => ({ id: x.paId as number, kind: x.pa.kind as string, topic: all('SELECT topic FROM sos_cases WHERE id = ?', x.caseId)[0].topic as string }))
    .sort((a, b) => a.id - b.id);
  const nhan = (g: string) => ({ xac_nhan_pa: 'Xác nhận PA', ghi_nhan_xet: 'Mô tả Case', score: 'Nhập điểm', no_plan: 'Thêm PA' } as any)[g] ?? g;
  const v = (o: Record<string, unknown>) => ({
    key: 'xnpa:1', group: 'xac_nhan_pa', urgency: 'normal', due: '2026-09-18', studentId: 1, studentName: 'An', classId: 10, classCode: 'CP FT 139',
    khung: 'ft', ownerId: 7, tieuDe: 'Xác nhận PA · Reading · An', contextLabel: 'MT3', count: null, href: '/hoc-vien/1', actionLabel: 'Xác nhận PA',
    phu: 'Reading', caseSos: true, tuanThi: '2026-09-07', sos: 3, ...o,
  });

  check('OV13c-1 · Case SOS FT: cùng lớp + tuần thi + mức SOS (khác MT) → MỘT dòng; khác SOS / khác tuần → tách; Thêm PA vẫn từng dòng', () => {
    for (const group of ['xac_nhan_pa', 'ghi_nhan_xet']) {
      const g = d.gopViecTheoLop([v({ group, key: `${group}:1` }), v({ group, key: `${group}:2`, studentId: 2, contextLabel: 'MT2' })], nhan);
      assert(g.length === 1 && g[0].con.length === 2, `${group} cùng tuần + SOS, khác MT: phải gộp (${g.length} dòng)`);
      assert(g[0].tieuDe === `${nhan(group)} · CP FT 139 · 2 em` && g[0].contextLabel === 'MT2, MT3 · W2 SEP · SOS 3', `dòng: ${g[0].tieuDe} / ${g[0].contextLabel}`);
      assert(d.gopViecTheoLop([v({ group, key: 'a' }), v({ group, key: 'b', studentId: 2, sos: 1 })], nhan).length === 2, `${group} khác SOS: tách`);
      assert(d.gopViecTheoLop([v({ group, key: 'a' }), v({ group, key: 'b', studentId: 2, tuanThi: '2026-09-14' })], nhan).length === 2, `${group} khác tuần: tách`);
      assert(d.gopViecTheoLop([v({ group, key: 'a' }), v({ group, key: 'b', studentId: 2, classId: 11 })], nhan).length === 2, `${group} khác lớp: tách`);
    }
    assert(d.gopViecTheoLop([v({ group: 'no_plan', key: 'a' }), v({ group: 'no_plan', key: 'b', studentId: 2 })], nhan).length === 2, 'Thêm PA Case SOS FT: từng dòng');
  });

  check('OV13c-2 · dòng gộp một em hai việc: "1 em · 2 việc" (không mất số việc); số trên dòng = số em khác nhau trong dòng', () => {
    const g = d.gopViecTheoLop([v({ key: 'xnpa:1' }), v({ key: 'xnpa:2', phu: 'Listening' })], nhan);
    assert(g.length === 1 && g[0].actionLabel === '1 em · 2 việc' && g[0].tieuDe.endsWith('· 1 em · 2 việc'), `nhãn: ${g[0]?.actionLabel} / ${g[0]?.tieuDe}`);
    const h = d.gopViecTheoLop([v({ key: 'xnpa:1' }), v({ key: 'xnpa:2', studentId: 2 }), v({ key: 'xnpa:3', studentId: 3 })], nhan);
    assert(h[0].actionLabel === '3 em' && new Set(h[0].con.map((c: any) => c.studentId)).size === 3, `3 em: ${h[0].actionLabel}`);
  });

  check('OV13c-3 · Nhập điểm gom theo tuần thi qua nhiều lớp: "Nhập điểm · W2 SEP · n bài", con = từng lớp; khác tuần / chấm chéo không gộp theo tuần', () => {
    const s = (o: Record<string, unknown>) => v({ key: 'score:10|mock|p1|u7', group: 'score', studentId: null, studentName: 'Lớp CP FT 139', caseSos: undefined, sos: undefined,
      tieuDe: 'Nhập điểm Reading', phu: 'Reading', contextLabel: 'MT3 W2 SEP', soBai: 4, count: 4, ...o });
    const g = d.gopViecTheoLop([s({}), s({ key: 'score:11|mock|p1|u7', classId: 11, classCode: 'CP FT 140', soBai: 5 })], nhan);
    assert(g.length === 1 && g[0].tieuDe === 'Nhập điểm · W2 SEP · 9 bài' && g[0].contextLabel === '2 lớp' && g[0].classId === null, `dòng tuần: ${JSON.stringify(g.map((x: any) => [x.tieuDe, x.contextLabel, x.classId]))}`);
    assert(g[0].con.length === 2 && g[0].con.every((c: any) => c.conTen.startsWith(c.classCode)), `con theo lớp: ${g[0].con.map((c: any) => c.conTen)}`);
    assert(d.gopViecTheoLop([s({}), s({ key: 'score:11|mock|p2|u7', classId: 11, tuanThi: '2026-09-14' })], nhan).length === 2, 'khác tuần: hai dòng');
    assert(d.gopViecTheoLop([s({}), s({ key: 'score:11|mock|p1|u7', classId: 11, ownerId: 9 })], nhan).length === 2, 'khác người giữ: hai dòng');
    assert(d.khoaGopCua(s({ key: 'score:10|mock|p1|u0|cc', ownerId: null })) === 'gop:score:10:u0', 'chấm chéo: khoá lớp như cũ');
  });

  check('OV13c-4 · /my-work: Nhập điểm theo tuần thi (khoá có tuần, tuần trong dòng phụ); Case SOS FT cùng tuần + SOS → một dòng, số em trên dòng = số em trong dòng', () => thu(() => {
    const w = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' });
    const phang = (w.dong as any[]).flatMap((x) => x.con ?? [x]);
    const diem = phang.filter((x) => x.group === 'score' && x.tuanThi);
    assert(diem.length > 0 && diem.every((x) => /\|p\d+\|/.test(x.key) && x.contextLabel.endsWith(d.tuanLich(x.tuanThi))), `Nhập điểm theo tuần: ${diem.slice(0, 3).map((x) => `${x.key} ${x.contextLabel}`)}`);
    for (const r of (w.dong as any[]).filter((x) => x.con && x.group === 'score' && x.key.startsWith('gop:score:t'))) {
      const bai = r.con.reduce((n: number, c: any) => n + (c.soBai ?? 0), 0);
      assert(r.actionLabel === `${bai} bài`, `dòng ${r.key}: ${r.actionLabel} ≠ ${bai} bài`);
    }
    /* Hai PA chờ xác nhận cùng lớp + tuần thi: đặt cùng mức SOS → một dòng gộp. */
    const pa = phang.filter((x) => x.group === 'xac_nhan_pa' && x.tuanThi && x.ownerId !== null);
    const cap = pa.flatMap((a, i) => pa.slice(i + 1).filter((b) => b.classId === a.classId && b.tuanThi === a.tuanThi && b.ownerId === a.ownerId && b.studentId !== a.studentId).map((b) => [a, b]))[0];
    assert(cap, `cần hai PA chờ xác nhận cùng lớp + tuần + người: ${pa.map((x) => `${x.key} ${x.classId} ${x.tuanThi} ${x.ownerId}`)}`);
    conn.prepare('UPDATE sos_cases SET sos_level = 3 WHERE id IN (?, ?)').run(cap[0].caseId, cap[1].caseId);
    xoaNho();
    const w2 = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' });
    const dong = (w2.dong as any[]).find((x) => x.con?.some((c: any) => c.key === cap[0].key));
    assert(dong && dong.con.some((c: any) => c.key === cap[1].key) && dong.key.endsWith(':s3'), `một dòng gộp: ${dong?.key}`);
    assert(dong.actionLabel === `${new Set(dong.con.map((c: any) => c.studentId)).size} em` && dong.con.every((c: any) => c.pa?.kind), `số em / PA: ${dong.actionLabel}`);
  }));

  check('OV13c-5 · Xác nhận PA cùng lúc: n xong, PA lỗi báo riêng (quyền 403, không có 404, nội dung ngắn 400) mà PA khác vẫn xong; người dạy chung không đè; ngày bắt đầu', () => thu(() => {
    const cho = choPa().filter((x) => x.kind !== 'self_study');
    assert(cho.length >= 2, `cần ≥ 2 PA quy chế có Người dạy chờ xác nhận: ${cho.length}`);
    const [a, b] = cho;
    /* a: đã có người dạy riêng (GV L) → giữ; b: trống → nhận người chung. */
    conn.prepare('UPDATE case_interventions SET performer_user_id = ?, performer_name = NULL WHERE id = ?').run(P.lrTeacher.userId, a.id);
    conn.prepare('UPDATE case_interventions SET performer_user_id = NULL, performer_name = NULL WHERE id = ?').run(b.id);
    xoaNho();
    const batDau = addDays(TODAY, 3);
    const moTa = 'Hai buổi Tutor mỗi tuần, chữa đề Reading bấm giờ, Tutor gửi nhận xét.';
    const kq = sosAuto.xacNhanPaNhieu(P.mbManager, {
      chung: { soBuoi: 4, description: moTa, batDau, performerUserId: P.sTeacher.userId },
      ds: [{ id: a.id }, { id: b.id }, { id: 99999999 }, { id: 'x' }],
    });
    assert(JSON.stringify(kq.ok) === JSON.stringify([a.id, b.id]), `xong: ${JSON.stringify(kq)}`);
    assert(kq.loi.some((l: any) => l.id === 99999999 && l.ma === 404) && kq.loi.some((l: any) => l.id === 'x' && l.ma === 400), `lỗi riêng: ${JSON.stringify(kq.loi)}`);
    const sau = all(`SELECT id, performer_user_id, started_date, description, confirmed_by FROM case_interventions WHERE id IN (?, ?) ORDER BY id`, a.id, b.id);
    const pa = (id: number) => sau.find((x) => x.id === id);
    assert(pa(a.id).performer_user_id === P.lrTeacher.userId, `không đè người dạy đã có: ${pa(a.id).performer_user_id}`);
    assert(pa(b.id).performer_user_id === P.sTeacher.userId, `điền người chung cho PA trống: ${pa(b.id).performer_user_id}`);
    assert(sau.every((x) => x.started_date === batDau && x.description === moTa && x.confirmed_by === P.mbManager.userId), `ngày bắt đầu / nội dung: ${JSON.stringify(sau)}`);
  }));

  check('OV13c-6 · lô: nội dung riêng thắng chung; PA lỗi (nội dung ngắn) giữ lại, PA khác xong; GV không đúng kỹ năng → 403 riêng PA đó; lô rỗng / quá trần → 400', () => thu(() => {
    const cho = choPa();
    const khongL = cho.find((x) => x.topic !== 'listening')!;
    const coL = cho.find((x) => x.topic === 'listening')!;
    assert(khongL && coL, `cần PA Listening và PA kỹ năng khác: ${JSON.stringify(cho)}`);
    assertThrows(() => sosAuto.xacNhanPaQuyChe(P.mbManager, coL.id, { description: 'Nội dung đủ dài để xác nhận PA.', batDau: addDays(TODAY, 60) }), /tối đa 30 ngày/, 'ngày bắt đầu quá xa');
    assertThrows(() => sosAuto.xacNhanPaQuyChe(P.mbManager, coL.id, { description: 'Nội dung đủ dài để xác nhận PA.', batDau: addDays(TODAY, -8) }), /lùi tối đa 7 ngày/, 'lùi quá 7 ngày');
    const gv = sosAuto.xacNhanPaNhieu(P.lrTeacher, { chung: { soBuoi: 4, description: 'Nội dung chung đủ dài để xác nhận PA.' }, ds: [{ id: coL.id }, { id: khongL.id }] });
    assert(gv.ok.includes(coL.id) && gv.loi.some((l: any) => l.id === khongL.id && l.ma === 403), `quyền từng PA: ${JSON.stringify(gv)}`);
    const con = cho.filter((x) => x.id !== coL.id).slice(0, 2);
    if (con.length === 2) {
      const ql = sosAuto.xacNhanPaNhieu(P.mbManager, { chung: { soBuoi: 4, description: 'Nội dung chung đủ dài để xác nhận PA.' },
        ds: [{ id: con[0].id, description: 'Nội dung riêng của em này, đủ mười lăm ký tự.' }, { id: con[1].id, description: 'ngắn' }] });
      assert(ql.ok.length === 1 && ql.ok[0] === con[0].id && ql.loi[0]?.id === con[1].id && ql.loi[0].ma === 400, `PA lỗi giữ lại: ${JSON.stringify(ql)}`);
      assert(all('SELECT description FROM case_interventions WHERE id = ?', con[0].id)[0].description === 'Nội dung riêng của em này, đủ mười lăm ký tự.', 'nội dung riêng thắng');
      assert(all('SELECT confirmed_at FROM case_interventions WHERE id = ?', con[1].id)[0].confirmed_at === null, 'PA lỗi chưa xác nhận');
    }
    assertThrows(() => sosAuto.xacNhanPaNhieu(P.mbManager, { chung: {}, ds: [] }), /Chọn từ 1/, 'lô rỗng');
    assertThrows(() => sosAuto.xacNhanPaNhieu(P.mbManager, { ds: Array.from({ length: 51 }, (_, i) => ({ id: i + 1 })) }), /Chọn từ 1/, 'quá trần');
  }));

  check('OV13c-7 · (rà #412) gửi lại sau mạng chập: PA đã xác nhận → ✓ không lỗi; lùi 7 ngày: hạn kỳ Ghi kết quả đầu tiên không trước hôm nay', () => thu(() => {
    const [a] = choPa();
    assert(a, 'cần một PA chờ xác nhận');
    const than = { chung: { soBuoi: 4, description: 'Hai buổi mỗi tuần, chữa đề bấm giờ, GV gửi nhận xét.', batDau: addDays(TODAY, -7) }, ds: [{ id: a.id }] };
    const lan1 = sosAuto.xacNhanPaNhieu(P.mbManager, than);
    const lan2 = sosAuto.xacNhanPaNhieu(P.mbManager, than);
    assert(lan1.ok[0] === a.id && lan2.ok[0] === a.id && !lan2.loi.length, `gửi lại: ${JSON.stringify(lan2)}`);
    const iv = all('SELECT started_date, action_due FROM case_interventions WHERE id = ?', a.id)[0];
    assert(iv.started_date === addDays(TODAY, -7) && iv.action_due >= TODAY, `hạn kỳ đầu: ${JSON.stringify(iv)}`);
  }));

  check('OV13c-8 · (rà #412) còn < 4 s của lời gọi → không mở PA tiếp, trả `chuaLam` (web gửi tiếp); không PA nào bị ghi', () => thu(() => {
    const { chayVoiHan } = hanGio;
    const ds = choPa().slice(0, 2);
    assert(ds.length === 2, 'cần hai PA chờ xác nhận');
    const kq = chayVoiHan(Date.now() + 3_000, () => sosAuto.xacNhanPaNhieu(P.mbManager, { chung: { soBuoi: 4, description: 'Nội dung chung đủ dài để xác nhận PA.' }, ds: ds.map((x) => ({ id: x.id })) }));
    assert(!kq.ok.length && !kq.loi.length && JSON.stringify(kq.chuaLam) === JSON.stringify(ds.map((x) => x.id)), JSON.stringify(kq));
    assert(all(`SELECT 1 FROM case_interventions WHERE id IN (?, ?) AND confirmed_at IS NOT NULL`, ds[0].id, ds[1].id).length === 0, 'PA chưa làm bị ghi');
  }));

}
