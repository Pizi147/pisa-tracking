/**
 * PHÉP KIỂM PR-MTb — luật máy chủ cho panel "Xếp lịch Mock Test" (đặc tả 2026-10-05: T13b "MT mới" + tick kỹ năng, T6 hạn chấm,
 * T20 menu "Dời lịch" cho kỹ năng đã có điểm). Task 1 của kế hoạch PR-MTb; các Task web thêm phép kiểm vào cuối file này.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const nguon = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrMtbTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  console.log('\nPR-MTb · Máy chủ + luật panel (MT mới, đúng đợt, tick kỹ năng, hạn chấm)');

  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const LOP_THUONG = classId('MB FOU 12');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
  const bon = (n: number) => ({ listening: tuan(n).id, reading: tuan(n).id, writing: tuan(n).id, speaking: tuan(n).id });
  const KN = ['listening', 'reading', 'writing', 'speaking'] as const;
  /** Bắt lỗi đã ném (status, message). */
  const loiCua = (fn: () => unknown): any => {
    try { fn(); } catch (e) { return e; }
    assert(false, 'mong có lỗi mà không có');
  };

  let dem = 0;
  /** Em mới ở MB FT 101: MT1, MT2, MT3 ở tuần `w` (mặc định T+1, T+6, T+9), chưa điểm — mẫu `emMoi` của prMta. */
  const emMoi = (w: [number, number, number] = [1, 6, 9]) => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `PRMTB Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: 'hv@demo.test' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    const sid = r.studentIds[0] as number;
    const ds = conn.prepare(`SELECT a.id FROM assessment_attempts a WHERE a.student_id = ? AND a.status != 'cancelled' ORDER BY a.attempt_no`).all(sid) as any[];
    w.forEach((n, i) => {
      skillSch.ensureSkillRows(ds[i].id);
      conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual', lich_su = 0 WHERE id = ?`).run(tuan(n).id, ds[i].id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(n).id, ds[i].id);
    });
    return { sid, m1: ds[0].id as number, m2: ds[1].id as number, m3: ds[2].id as number };
  };
  const diemDu = (aid: number) => {
    for (const s of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, raw_score, nhap_dau_ngay) VALUES (?,?,?,?,?)`).run(aid, s, 6, 30, TODAY);
    }
  };
  const huy = (...ids: number[]) => { for (const id of ids) conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(id); };
  /** Em có MT1 đã xong (đủ điểm), không còn MT2/MT3. */
  const emMt1Xong = () => { const a = emMoi(); diemDu(a.m1); huy(a.m2, a.m3); return a; };
  /** Em có MT1 xong + MT2 CHƯA có tuần (lượt đã huỷ lịch), không MT3. */
  const emMt2ChuaTuan = () => {
    const a = emMoi(); diemDu(a.m1); huy(a.m3);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = NULL WHERE id = ?`).run(a.m2);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = NULL WHERE attempt_id = ?`).run(a.m2);
    return a;
  };
  const kyNangRow = (aid: number, skill: string) => conn.prepare(
    `SELECT k.required, k.planned_period_id, p.week_start FROM attempt_skills k LEFT JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = ?`).get(aid, skill) as any;
  const luotSo = (sid: number, no: number) => conn.prepare(
    `SELECT * FROM assessment_attempts WHERE student_id = ? AND attempt_no = ? AND status != 'cancelled'`).get(sid, no) as any;
  const dongCua = (r: any, sid: number) => r.dong.find((x: any) => x.studentId === sid);
  const demLuot = () => (conn.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n as number;

  // ------------------------------------------------------------------ luật thuần
  const L = (attempt_no: number, status = 'planned', coDiem = false) => ({ attempt_no, status, coDiem });
  const kn = (o: Record<string, any> = {}) => (['listening', 'reading', 'writing', 'speaking'] as const).map((skill) => ({
    skill, batBuoc: true, coDiem: true, daThi: true, huyPhan: false, choDuyet: false, coTuan: true, ...o,
  }));
  const chua = () => kn({ coDiem: false, daThi: false });

  check('MTb (1) · viecXepMt không tự sang đợt khác (T13b): đủ → "MT{n} đã xong." / ép → da-du · dở → xep-not · chưa thi → doi · MT cũ → chặn', () => {
    const so = [L(1, 'completed', true), L(2)];
    const ds: any[] = [{ no: 1, huy: false, lichSu: false, kn: kn() }, { no: 2, huy: false, lichSu: false, kn: chua() }];
    const v1 = d.viecXepMt(ds, 1, so) as any;
    assert(v1.loai === 'chan' && v1.no === 1 && v1.cau === 'MT1 đã xong.', JSON.stringify(v1));
    const v2 = d.viecXepMt(ds, 1, so, true) as any;
    assert(v2.loai === 'da-du' && v2.no === 1 && v2.coDiem.length === 4, JSON.stringify(v2));
    const v3 = d.viecXepMt(ds, 2, so) as any;
    assert(v3.loai === 'doi' && v3.no === 2, JSON.stringify(v3));
    const v4 = d.viecXepMt([ds[0], { no: 2, huy: false, lichSu: false, kn: kn({}).map((k, i) => (i < 2 ? k : { ...k, coDiem: false, daThi: false })) }], 2, so) as any;
    assert(v4.loai === 'xep-not' && v4.kyNang.join() === 'writing,speaking', JSON.stringify(v4));
    // MT cũ: chặn dù có hay không có `ep`, không tự sang MT kế.
    for (const ep of [false, true]) {
      const v5 = d.viecXepMt([{ no: 1, huy: false, lichSu: true, kn: chua() }, { no: 2, huy: false, lichSu: false, kn: chua() }], 1, [L(1), L(2)], ep) as any;
      assert(v5.loai === 'chan' && v5.no === 1 && v5.cau === 'MT1 là MT cũ — nhập điểm bù.', `ep=${ep}: ${JSON.stringify(v5)}`);
    }
    // MT chưa có: tạo (số kế tiếp) — vẫn đúng như cũ; chưa có MT1 mà chọn MT3 → câu của kiemSoMtMoi.
    const v6 = d.viecXepMt([ds[0]], 2, [L(1, 'completed', true)]) as any;
    assert(v6.loai === 'tao' && v6.no === 2, JSON.stringify(v6));
    const v7 = d.viecXepMt([ds[0]], 3, [L(1, 'completed', true)]) as any;
    assert(v7.loai === 'chan' && v7.cau === d.kiemSoMtMoi([L(1, 'completed', true)], 3), JSON.stringify(v7));
    // Chọn quá MT8 → "Đã đủ MT8".
    const v8 = d.viecXepMt([], 9, []) as any;
    assert(v8.loai === 'chan' && /Đã đủ MT8/.test(v8.cau), JSON.stringify(v8));
  });

  check('MTb (1) · dotMtMoi: đợt nhỏ nhất chưa có lịch, không có thì số kế tiếp', () => {
    const xong = { huy: false, lichSu: false, kn: kn() };
    const coLich = { huy: false, lichSu: false, kn: chua() };
    const chuaLich = { huy: false, lichSu: false, kn: kn({ coDiem: false, daThi: false, coTuan: false }) };
    // MT1 xong, MT2 có lịch, MT3 chưa có tuần → 3
    assert(d.dotMtMoi([{ no: 1, ...xong }, { no: 2, ...coLich }, { no: 3, ...chuaLich }], [L(1, 'completed', true), L(2), L(3)]) === 3, 'MT3 chưa có tuần');
    // MT1 xong, MT2 có lịch, không có MT3 → 3 (tạo)
    assert(d.dotMtMoi([{ no: 1, ...xong }, { no: 2, ...coLich }], [L(1, 'completed', true), L(2)]) === 3, 'tạo MT3');
    // MT1 chưa có tuần → 1 (dù MT2 cũng chưa có)
    assert(d.dotMtMoi([{ no: 1, ...chuaLich }, { no: 2, ...chuaLich }], [L(1), L(2)]) === 1, 'MT1 chưa có tuần');
    // Chưa có lượt nào → 1
    assert(d.dotMtMoi([], []) === 1, 'chưa có lượt');
    // Lượt đã huỷ không tính; MT cũ không chọn được ("nhập điểm bù") nên bị bỏ qua
    assert(d.dotMtMoi([{ no: 1, ...xong }, { no: 2, huy: true, lichSu: false, kn: chua().map((k) => ({ ...k, coTuan: false })) }], [L(1, 'completed', true), L(2, 'cancelled')]) === 2, 'MT2 huỷ → dùng lại số 2');
    assert(d.dotMtMoi([{ no: 1, huy: false, lichSu: true, kn: kn({ coDiem: false, daThi: false, coTuan: false }) }], [L(1)]) === 2, 'MT cũ bị bỏ qua');
  });

  check('MTb (1) · nhanSeXep một dòng 3 màu (mockup phần 1) + demSeXep', () => {
    const bai = (skill: string, den: string, ghiChu: string, cau: string | null = null) => ({ skill, tu: null, den, ghiChu, cau });
    const W1 = '2026-09-28';
    const tao: any = { studentId: 1, ten: 'A', hanhDong: 'tao', viec: 'tao', attemptNo: 3, loi: null, bai: KN.map((k) => bai(k, W1, 'moi')) };
    const a = d.nhanSeXep(tao, null);
    assert(a.tone === 'ok' && a.chu === 'MT3 · W1 OCT' && a.phu === null, JSON.stringify(a));
    const xepNot: any = { studentId: 2, ten: 'B', hanhDong: 'doi', viec: 'xep-not', attemptNo: 2, loi: null,
      bai: [bai('listening', W1, 'giu'), bai('reading', W1, 'giu'), bai('writing', W1, 'giu'), bai('speaking', W1, 'doi')] };
    const b = d.nhanSeXep(xepNot, null);
    assert(b.tone === 'soon' && b.chu === 'MT2 · S · W1 OCT' && b.phu === null, JSON.stringify(b));
    const trung: any = { studentId: 3, ten: 'C', hanhDong: 'tao', viec: 'tao', attemptNo: 3, loi: null,
      bai: KN.map((k) => bai(k, W1, 'canh-bao', 'Trùng tuần W1 OCT với MT2 (L R W S). Hai lượt không thi cùng một tuần.')) };
    const c = d.nhanSeXep(trung, null);
    assert(c.tone === 'soon' && c.chu === 'MT3 · W1 OCT' && c.phu === '· trùng MT2' && /Trùng tuần/.test(c.title), JSON.stringify(c));
    // Cảnh báo khác (không phải trùng) vẫn vàng, không có chữ phụ.
    const gan: any = { ...trung, bai: KN.map((k) => bai(k, W1, 'canh-bao', 'Chỉ cách MT2 đúng một tuần.')) };
    const g = d.nhanSeXep(gan, null);
    assert(g.tone === 'soon' && g.phu === null && /một tuần/.test(g.title), JSON.stringify(g));
    const loi: any = { studentId: 4, ten: 'D', hanhDong: 'loi', viec: 'chan', attemptNo: 1, loi: 'MT1 đã xong.', bai: [] };
    const e = d.nhanSeXep(loi, null);
    assert(e.tone === 'bad' && e.chu === 'Không xếp được' && e.phu === null && e.title === 'MT1 đã xong.', JSON.stringify(e));
    // Dời vượt: tone vàng, tooltip có hệ quả.
    const vuot: any = { studentId: 5, ten: 'E', hanhDong: 'doi', viec: 'doi', attemptNo: 1, loi: null,
      bai: KN.map((k) => ({ skill: k, tu: '2026-10-05', den: '2026-11-09', ghiChu: 'doi', cau: null })),
      seHuyLich: [{ attemptId: 9, nhan: 'MT2', tuan: '2026-10-19', soDiem: 4, soCase: 1 }] };
    const v = d.nhanSeXep(vuot, null);
    assert(v.tone === 'soon' && v.chu === 'MT1 · W2 NOV' && /MT2: huỷ 4 điểm/.test(v.title), JSON.stringify(v));
    // Dời thường (không cảnh báo, không vượt): xanh.
    const doi: any = { ...vuot, seHuyLich: undefined };
    assert(d.nhanSeXep(doi, null).tone === 'ok', 'dời thường');
    // MT cũ tạo mới: vàng, chữ phụ "cũ".
    const cu: any = { ...tao, lichSu: true };
    const cc = d.nhanSeXep(cu, null);
    assert(cc.tone === 'soon' && cc.phu === '· cũ', JSON.stringify(cc));
    // Đã đủ, giữ nguyên (không có gì để xếp): vàng, có chữ và tooltip.
    const giu: any = { studentId: 6, ten: 'F', hanhDong: 'giu', viec: 'da-du', attemptNo: 1, loi: null, coDiem: ['listening'], bai: [] };
    const gg = d.nhanSeXep(giu, null);
    assert(gg.tone === 'soon' && gg.chu.length > 0 && /thi lại/.test(gg.title), JSON.stringify(gg));
    const n = d.demSeXep([tao, xepNot, trung, loi, loi, vuot]);
    assert(n.ok === 1 && n.soon === 3 && n.bad === 2, JSON.stringify(n));
    assert(JSON.stringify(d.demSeXep([])) === JSON.stringify({ ok: 0, soon: 0, bad: 0 }), 'rỗng');
  });

  // ------------------------------------------------------------------ DB
  check('MTb (2) · xepHangLoat attemptNo "moi": mỗi em đúng MT riêng (MT2 chưa tuần → dời · không có MT2 → tạo), xem trước không ghi', () => {
    const a = emMt2ChuaTuan();
    const b = emMt1Xong();
    const truoc = demLuot();
    const r = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 'moi', studentIds: [a.sid, b.sid], tuan: bon(3), xemTruoc: true }, TODAY);
    const da = dongCua(r, a.sid), db = dongCua(r, b.sid);
    assert(da.attemptNo === 2 && da.hanhDong === 'doi' && !da.loi, JSON.stringify(da));
    assert(db.attemptNo === 2 && db.hanhDong === 'tao' && !db.loi, JSON.stringify(db));
    assert(demLuot() === truoc, 'xem trước đã ghi');
    const luu = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 'moi', studentIds: [a.sid, b.sid], tuan: bon(3), force: true }, TODAY);
    assert(luu.daLuu === 2, JSON.stringify(luu.dong));
    assert(kyNangRow(a.m2, 'speaking').planned_period_id === tuan(3).id, 'MT2 của A nhận tuần mới');
    assert(luotSo(b.sid, 2)?.planned_period_id === tuan(3).id, 'MT2 của B được tạo');
    const au = conn.prepare(`SELECT entity_label FROM audit_logs WHERE action = 'ke_hoach.hang_loat' ORDER BY id DESC LIMIT 1`).get() as any;
    assert(au?.entity_label === 'MT mới', `nhãn audit: ${au?.entity_label}`);
  });

  check('MTb (2) · attemptNo: 1 cho em MT1 đã xong → dòng lỗi "MT1 đã xong."; em khác không bị ảnh hưởng', () => {
    const xong = emMt1Xong();
    const dang = emMoi();        // MT1 ở T+1 chưa điểm, MT2 ở T+6
    const r = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 1, studentIds: [xong.sid, dang.sid], tuan: bon(3), xemTruoc: true }, TODAY);
    const dx = dongCua(r, xong.sid), dd = dongCua(r, dang.sid);
    assert(dx.hanhDong === 'loi' && dx.loi === 'MT1 đã xong.' && dx.attemptNo === 1, JSON.stringify(dx));
    assert(dd.hanhDong === 'doi' && dd.attemptNo === 1 && !dd.loi, JSON.stringify(dd));
    const luu = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 1, studentIds: [xong.sid, dang.sid], tuan: bon(3), force: true }, TODAY);
    assert(luu.daLuu === 1 && kyNangRow(dang.m1, 'listening').planned_period_id === tuan(3).id, JSON.stringify(luu.dong));
    assert(luotSo(xong.sid, 2) === undefined, 'không được tự tạo MT2 cho em đã xong MT1');
  });

  check('MTb (2) · kyNang tick: đợt TẠO MỚI → kỹ năng bỏ tick có required = 0; đợt ĐÃ CÓ → kỹ năng bỏ tick giữ nguyên lịch', () => {
    const b = emMt1Xong();
    const luu = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 'moi', studentIds: [b.sid], tuan: bon(3), kyNang: ['listening', 'reading', 'writing'], force: true }, TODAY);
    assert(luu.daLuu === 1, JSON.stringify(luu.dong));
    const m2 = luotSo(b.sid, 2);
    assert(kyNangRow(m2.id, 'speaking').required === 0, 'speaking phải bỏ khỏi đợt mới');
    for (const k of ['listening', 'reading', 'writing']) {
      const r = kyNangRow(m2.id, k);
      assert(r.required === 1 && r.planned_period_id === tuan(3).id, `${k}: ${JSON.stringify(r)}`);
    }
    // Đợt có sẵn: MT1 ở T+1, chỉ tick L → L dời, S giữ nguyên tuần và vẫn bắt buộc.
    const c = emMoi();
    const xt = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 1, studentIds: [c.sid], tuan: bon(3), kyNang: ['listening'], xemTruoc: true }, TODAY);
    assert(dongCua(xt, c.sid).bai.length === 1 && dongCua(xt, c.sid).bai[0].skill === 'listening', JSON.stringify(dongCua(xt, c.sid).bai));
    const l2 = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 1, studentIds: [c.sid], tuan: bon(3), kyNang: ['listening'], force: true }, TODAY);
    assert(l2.daLuu === 1, JSON.stringify(l2.dong));
    assert(kyNangRow(c.m1, 'listening').planned_period_id === tuan(3).id, 'L đã dời');
    const s = kyNangRow(c.m1, 'speaking');
    assert(s.required === 1 && s.planned_period_id === tuan(1).id, `S phải giữ nguyên: ${JSON.stringify(s)}`);
    // Thiếu `kyNang` = cả 4 kỹ năng.
    const e = emMt1Xong();
    keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 'moi', studentIds: [e.sid], tuan: bon(3), force: true }, TODAY);
    assert(KN.every((k) => kyNangRow(luotSo(e.sid, 2).id, k).required === 1), 'thiếu kyNang = đủ 4');
  });

  check('MTb (2) · kyNang rỗng / attemptNo rác → 400; lớp thường không nhận "moi"; route nhận attemptNo "moi" và kyNang', () => {
    const a = emMt1Xong();
    const x = { classId: LOP, studentIds: [a.sid], tuan: bon(3), xemTruoc: true };
    const e1 = loiCua(() => keHoach.xepHangLoat(QL, { ...x, attemptNo: 'moi', kyNang: [] }, TODAY));
    assert(e1.status === 400 && e1.message === 'Chưa chọn kỹ năng nào.', `${e1.status} ${e1.message}`);
    const e2 = loiCua(() => keHoach.xepHangLoat(QL, { ...x, attemptNo: 'x' }, TODAY));
    assert(e2.status === 400, `attemptNo rác: ${e2.status} ${e2.message}`);
    const e3 = loiCua(() => keHoach.xepHangLoat(QL, { ...x, classId: LOP_THUONG, attemptNo: 'moi' }, TODAY));
    assert(e3.status === 400 && /lớp thường/.test(e3.message), `${e3.status} ${e3.message}`);
    const src = nguon('server/src/routes/index.ts');
    const i = src.indexOf("api.post('/ke-hoach-test/hang-loat'");
    const khoi = src.slice(i, src.indexOf('}));', i));
    assert(/'moi'/.test(khoi) && /kyNang/.test(khoi), 'route hang-loat thiếu attemptNo "moi" / kyNang');
  });

  check('MTb (2) · luoiFT trả hanCham = thứ Tư tuần kế tuần thi; null khi MT cũ (lichSu)', () => {
    const a = emMoi();
    const lay = () => keHoach.luoiFT(QL, LOP, TODAY).hang.find((h: any) => h.studentId === a.sid).dot[1].kn;
    const han = t.addDays(tuan(1).weekStart, 9);
    assert(new Date(`${han}T00:00:00Z`).getUTCDay() === 3, 'phải là thứ Tư');
    assert(KN.every((k) => lay()[k].hanCham === han), JSON.stringify(lay()));
    conn.prepare(`UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?`).run(a.m1);
    assert(KN.every((k) => lay()[k].hanCham === null), `lichSu: ${JSON.stringify(lay())}`);
    conn.prepare(`UPDATE assessment_attempts SET lich_su = 0 WHERE id = ?`).run(a.m1);
    // Kỹ năng không bắt buộc / đã huỷ phần thi → null.
    conn.prepare(`UPDATE attempt_skills SET required = 0 WHERE attempt_id = ? AND skill = 'speaking'`).run(a.m1);
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ? AND skill = 'reading'`).run(a.m1);
    assert(lay().speaking.hanCham === null && lay().reading.hanCham === null && lay().listening.hanCham === han, JSON.stringify(lay()));
    // Hạn riêng của kỹ năng (Dời hạn chấm) được tính.
    conn.prepare(`UPDATE attempt_skills SET deadline_override = ? WHERE attempt_id = ? AND skill = 'listening'`).run(t.addDays(han, 3), a.m1);
    assert(lay().listening.hanCham === t.addDays(han, 3), 'hạn riêng');
  });

  check('MTb (2) · "moi": em đã đủ MT8 / chưa có lộ trình → dòng đỏ, em khác vẫn xếp được (Review Focus 5)', () => {
    const day = emMoi();
    for (let n = 4; n <= 8; n++) {
      const cy = (conn.prepare('SELECT cycle_id c FROM assessment_attempts WHERE id = ?').get(day.m1) as any).c;
      const id = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
        VALUES (?,?,?, 'mock', ?, ?, 'planned', ?)`).run(cy, day.sid, n, LOP, tuan(9 + n).id, new Date().toISOString()).lastInsertRowid);
      skillSch.ensureSkillRows(id);
    }
    const khong = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at)
      VALUES (?,?,?,(SELECT branch_id FROM classes WHERE id = ?), 'active', ?)`).run(`PISA-MTB-${++dem}`, `PRMTB Không lộ trình ${dem}`, `prmtb khong lo trinh ${dem}`, LOP, new Date().toISOString()).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(khong, LOP, tuanNay, new Date().toISOString());
    const tot = emMt1Xong();
    const r = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 'moi', studentIds: [day.sid, khong, tot.sid], tuan: bon(3), xemTruoc: true }, TODAY);
    const dd = dongCua(r, day.sid), dk = dongCua(r, khong), dt = dongCua(r, tot.sid);
    assert(dd.hanhDong === 'loi' && /Đã đủ MT8/.test(dd.loi), JSON.stringify(dd));
    assert(dk.hanhDong === 'loi' && /chưa có lộ trình/.test(dk.loi), JSON.stringify(dk));
    assert(dt.hanhDong === 'tao' && dt.attemptNo === 2, JSON.stringify(dt));
    assert(d.nhanSeXep(dd, null).tone === 'bad' && d.nhanSeXep(dk, null).tone === 'bad', 'cả hai dòng đỏ');
    const luu = keHoach.xepHangLoat(QL, { classId: LOP, attemptNo: 'moi', studentIds: [day.sid, khong, tot.sid], tuan: bon(3), force: true }, TODAY);
    assert(luu.daLuu === 1 && luotSo(tot.sid, 2), 'em khác vẫn lưu');
  });

  // ------------------------------------------------------------------ menu kỹ năng đã có điểm (Task 0 mục 6a)
  check('MTb (1) · thaoTacKyNang("co-diem"): Quản lý có "Dời lịch" (≤ 3 mục); GVCN / GVBM không', () => {
    const q = { nhapDiem: true, quanLy: false, gvcn: false, laFt: true, dotHoanTat: false };
    for (const m of [0, 1, 2, 3]) {
      const qq = { ...q, gvcn: !!(m & 1), nhapDiem: !!(m & 2) };
      assert(!d.thaoTacKyNang('co-diem', qq).menu.includes('doi-lich'), `không phải QL (${m}) không được có doi-lich`);
    }
    const ql = d.thaoTacKyNang('co-diem', { ...q, quanLy: true });
    assert(ql.menu.includes('doi-lich') && ql.menu.includes('huy-diem') && ql.menu.length <= 3 && ql.chinh === 'sua-diem', JSON.stringify(ql));
    const qlHoanTat = d.thaoTacKyNang('co-diem', { ...q, quanLy: true, nhapDiem: false, dotHoanTat: true });
    assert(qlHoanTat.menu.includes('doi-lich'), JSON.stringify(qlHoanTat));
    assert(JSON.stringify(d.thaoTacKyNang('co-diem', { ...q, gvcn: true }).menu) === '["huy-diem"]', 'GVCN giữ menu cũ');
  });
}
