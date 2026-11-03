/**
 * PHÉP KIỂM PR-MTb — luật máy chủ cho panel "Xếp lịch Mock Test" (đặc tả 2026-10-05: T13b "MT mới" + tick kỹ năng, T6 hạn chấm,
 * T20 menu "Dời lịch" cho kỹ năng đã có điểm). Task 1 của kế hoạch PR-MTb; các Task web thêm phép kiểm vào cuối file này.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

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
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `PRMTB Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
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
    // PR-MTGON (luật 5) thay "MT cũ chặn": MT cũ xếp đè được như lượt thường, không tự sang MT kế.
    for (const ep of [false, true]) {
      const v5 = d.viecXepMt([{ no: 1, huy: false, lichSu: true, kn: chua() }, { no: 2, huy: false, lichSu: false, kn: chua() }], 1, [L(1), L(2)], ep) as any;
      assert(v5.loai === 'doi' && v5.no === 1, `ep=${ep}: ${JSON.stringify(v5)}`);
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
    // Dời thường (không cảnh báo): xanh. PR-MTGON: dời vượt bị chặn ở máy chủ — không còn dòng "vượt" vàng.
    const doi: any = { studentId: 5, ten: 'E', hanhDong: 'doi', viec: 'doi', attemptNo: 1, loi: null,
      bai: KN.map((k) => ({ skill: k, tu: '2026-10-05', den: '2026-11-09', ghiChu: 'doi', cau: null })) };
    const v = d.nhanSeXep(doi, null);
    assert(v.tone === 'ok' && v.chu === 'MT1 · W2 NOV', JSON.stringify(v));
    // MT cũ tạo mới: vàng, chữ phụ "cũ".
    const cu: any = { ...tao, lichSu: true };
    const cc = d.nhanSeXep(cu, null);
    assert(cc.tone === 'soon' && cc.phu === '· cũ', JSON.stringify(cc));
    // Đã đủ, giữ nguyên (không có gì để xếp): vàng, có chữ và tooltip.
    const giu: any = { studentId: 6, ten: 'F', hanhDong: 'giu', viec: 'da-du', attemptNo: 1, loi: null, coDiem: ['listening'], bai: [] };
    const gg = d.nhanSeXep(giu, null);
    assert(gg.tone === 'soon' && gg.chu.length > 0 && /thi lại/.test(gg.title), JSON.stringify(gg));
    const n = d.demSeXep([tao, xepNot, trung, loi, loi, doi]);
    assert(n.ok === 2 && n.soon === 2 && n.bad === 2, JSON.stringify(n));
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
  // ------------------------------------------------------------------ Task 2: luật + component Ô MT, nhãn "cũ"
  console.log('\nPR-MTb · Ô MT dùng chung (oMt), nhãn "cũ"');
  const H = '2026-10-05';                       // thứ Hai = W2 OCT (tuần này)
  const TUAN = { qua: '2026-09-21', vua: '2026-09-28', nay: '2026-10-05', toi: '2026-10-12', xa: '2026-10-26' };
  const okKn = (trangThai: string, tuan: string | null, o: Record<string, unknown> = {}) => ({
    trangThai, tuan, periodId: null, doiTu: null, batBuoc: trangThai !== 'khong-yeu-cau', khoa: null, sit: null,
    tuanKetThuc: tuan ? t.addDays(tuan, 6) : null, choDuyet: trangThai === 'cho-duyet', hanCham: null, ...o,
  });
  /** Bốn kỹ năng cùng trạng thái, `sua` đổi riêng từng kỹ năng. */
  const bonKn = (tt: string, tuan: string | null, sua: Record<string, any> = {}) => Object.fromEntries(KN.map((k) => [k, { ...okKn(tt, tuan), ...(sua[k] ?? {}) }]));
  const luot = (kn: any, o: Record<string, unknown> = {}) => ({ so: 2, attemptId: 7, kn, cu: false, ...o });
  const xongKn = (tuan = '2026-09-14', sua: Record<string, any> = {}) => bonKn('xong', tuan, sua);
  const vaoRa = (v: any, kieu: string, chu: string, cu = false) => {
    const r = d.oMt(v, H);
    assert(r.kieu === kieu && r.chu === chu && r.cu === cu, `mong ${kieu}/${chu}/${cu}, ra ${JSON.stringify(r)}`);
    return r;
  };

  // Mỗi dòng mockup phần 3 (trừ "Đang chọn" và MT0)
  check('MTb (T2 · PR-OMT C2–C5) · oMt: mười một dòng mockup bản 2, homNay 2026-10-05 — `MT2 · tuần` + MỘT chữ việc; xong / cũ không chữ', () => {
    vaoRa(luot({}, { attemptId: null, so: 3 }), 'chua-lich', 'chưa xếp');   // C5: chưa có đợt = chưa xếp, một kiểu
    vaoRa(luot(bonKn('chua-xep', null)), 'chua-lich', 'chưa xếp');
    vaoRa(luot(bonKn('da-xep', TUAN.toi)), 'co-lich', 'W3 OCT');
    vaoRa(luot(bonKn('da-xep', TUAN.nay)), 'dang-thi', 'W2 OCT');   // đang thi: tuần + chấm tròn (OMt.tsx), không chữ "tuần này"
    vaoRa(luot(bonKn('xong', '2026-09-14', {
      listening: { trangThai: 'da-xep', tuan: TUAN.vua, tuanKetThuc: '2026-10-04', hanCham: '2026-10-07' },
      reading: { trangThai: 'da-xep', tuan: TUAN.vua, tuanKetThuc: '2026-10-04', hanCham: '2026-10-07' },
    })), 'cho-cham', 'W1 OCT · chờ L R');
    const het = { tuanKetThuc: '2026-10-04', hanCham: '2026-10-07' };
    vaoRa(luot(bonKn('da-xep', TUAN.vua, { listening: het, reading: het, writing: het, speaking: het })), 'cho-cham', 'W1 OCT · chờ');   // đủ bốn kỹ năng: không liệt kê
    vaoRa(luot(xongKn('2026-09-14', { writing: { trangThai: 'da-xep', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', hanCham: '2026-09-30' } })), 'tre-cham', 'W4 SEP · trễ W');
    vaoRa(luot(xongKn('2026-09-14', { speaking: { trangThai: 'vang', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', sit: 'absent' } })), 'con-viec', 'W4 SEP · vắng S');
    vaoRa(luot(xongKn()), 'xong', 'W3 SEP');   // C3: xanh, KHÔNG chữ "xong"
    vaoRa(luot(xongKn('2026-09-14', { speaking: { trangThai: 'khong-yeu-cau', batBuoc: false, tuan: null } })), 'xong', 'W3 SEP');   // C3: không "✓ 3/4"
    vaoRa(luot(xongKn('2026-09-14', { speaking: { trangThai: 'da-huy', tuan: TUAN.qua, sit: 'cancelled', huyVang: true } })), 'con-viec', 'W4 SEP · huỷ S');
    // C4: Quản lý chốt "Không mock lại" → kỹ năng bỏ khỏi đợt (batBuoc false) → đủ phần còn lại xong thì xanh, không chữ.
    vaoRa(luot(xongKn('2026-09-14', { speaking: { trangThai: 'khong-yeu-cau', batBuoc: false, sit: 'cancelled', huyVang: true, tuan: TUAN.qua } })), 'xong', 'W3 SEP');
    vaoRa(luot(xongKn(), { so: 1, cu: true }), 'xong', 'W3 SEP', true);   // C3: MT cũ xong = chỉ màu, không chữ "cũ"
  });

  check('MTb (PR-OMT C2/C3) · oMt: `doc` cho người đọc màn hình đọc đủ trạng thái (màu không có chữ)', () => {
    const doc = (v: any) => d.oMt(v, H).doc;
    assert(doc(luot(xongKn())) === 'MT2, xong, W3 SEP', doc(luot(xongKn())));
    assert(doc(luot(bonKn('da-xep', TUAN.nay))) === 'MT2, đang làm bài, W2 OCT', 'đang thi');
    assert(doc(luot(bonKn('da-xep', TUAN.toi))) === 'MT2, có lịch, W3 OCT', 'có lịch');
    assert(doc(luot({}, { attemptId: null, so: 3 })) === 'MT3, chưa xếp', 'chưa xếp');
    assert(doc(luot(xongKn('2026-09-14', { writing: { trangThai: 'da-xep', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', hanCham: '2026-09-30' } }))) === 'MT2, W4 SEP, trễ chấm W', 'trễ');
    assert(doc(luot(xongKn('2026-09-14', { speaking: { trangThai: 'vang', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', sit: 'absent' } }))) === 'MT2, W4 SEP, vắng S', 'vắng');
  });

  check('MTb (T2) · oMt: trễ chấm đứng trước vắng; hanCham null → chờ, không bao giờ trễ', () => {
    vaoRa(luot(xongKn('2026-09-14', {
      listening: { trangThai: 'da-xep', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', hanCham: '2026-09-30' },
      speaking: { trangThai: 'vang', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', sit: 'absent' },
    })), 'tre-cham', 'W4 SEP · trễ L');
    const trePhu = d.oMt(luot(xongKn('2026-09-14', { writing: { trangThai: 'da-xep', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', hanCham: '2026-09-30' } })), H);
    assert(trePhu.title.split('\n')[2] === 'Writing: W4 SEP · trễ chấm · hạn 30/09', trePhu.title);
    const kn = xongKn('2026-09-14', { writing: { trangThai: 'da-xep', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', hanCham: null } });
    vaoRa(luot(kn), 'cho-cham', 'W4 SEP · chờ W');
    // hôm nay đúng hạn chấm: chưa trễ
    vaoRa(luot(xongKn('2026-09-14', { writing: { trangThai: 'da-xep', tuan: TUAN.vua, tuanKetThuc: '2026-10-04', hanCham: H } })), 'cho-cham', 'W1 OCT · chờ W');
  });

  check('MTb (T2) · oMt: chờ Quản lý duyệt dời = "vắng S" + tooltip; vắng đứng trước đã huỷ; tuần sớm nhất; tên môn theo chương trình', () => {
    const cd = d.oMt(luot(xongKn('2026-09-14', { speaking: { trangThai: 'cho-duyet', tuan: TUAN.qua, sit: 'absent', choDuyet: true } })), H);
    assert(cd.kieu === 'con-viec' && cd.viec === 'vắng S' && /Speaking: .*chờ Quản lý duyệt/.test(cd.title), JSON.stringify(cd));
    vaoRa(luot(xongKn('2026-09-14', {
      speaking: { trangThai: 'da-huy', tuan: TUAN.qua, sit: 'cancelled', huyVang: true },
      reading: { trangThai: 'vang', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', sit: 'absent' },
    })), 'con-viec', 'W4 SEP · vắng R');
    vaoRa(luot(bonKn('da-xep', TUAN.xa, { speaking: { tuan: TUAN.toi, tuanKetThuc: '2026-10-18' } })), 'co-lich', 'W3 OCT');
    const fou = d.oMt(luot(xongKn('2026-09-14', { writing: { trangThai: 'vang', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', sit: 'absent' } })), H, 'FOU');
    assert(fou.viec === 'vắng G+V', JSON.stringify(fou));
  });

  check('MTb (T2) · oMt: tooltip một dòng mỗi kỹ năng; MT cũ không ghi chữ "cũ" (SV-NX-CASE N8)', () => {
    const r = d.oMt(luot(xongKn('2026-09-14', { speaking: { trangThai: 'chua-xep', tuan: null, tuanKetThuc: null } })), H);
    const dong = r.title.split('\n');
    assert(dong.length === 4 && dong[0] === 'Listening: W3 SEP · xong' && dong[3] === 'Speaking: chưa xếp', JSON.stringify(dong));
    const cu = d.oMt(luot(xongKn(), { cu: true }), H).title.split('\n');
    assert(cu.every((x: string) => !/cũ/.test(x)), JSON.stringify(cu));
    assert(d.oMt(luot({}, { attemptId: null }), H).title === 'Chưa có đợt', 'chưa có đợt có tooltip');
  });

  check('MTb (T2) · oKyNangTuLich: hàng lịch hồ sơ Mock → OKyNang cho đầu trang', () => {
    const lich = (o: Record<string, unknown> = {}) => ({ skill: 'speaking', required: true, periodId: 1, weekStart: TUAN.qua, weekEnd: '2026-09-27', sitStatus: 'scheduled',
      scored: false, pendingMove: null, absenceMoveCount: 0, deadline: '2026-09-30', doiTu: null, huyVang: false, ...o });
    assert(d.oKyNangTuLich(lich({ scored: true })).trangThai === 'xong', 'xong');
    assert(d.oKyNangTuLich(lich({ sitStatus: 'absent' })).trangThai === 'vang', 'vắng');
    assert(d.oKyNangTuLich(lich({ sitStatus: 'absent', pendingMove: { id: 1 } })).trangThai === 'cho-duyet', 'chờ duyệt');
    const huy = d.oKyNangTuLich(lich({ sitStatus: 'cancelled', huyVang: true }));
    assert(huy.trangThai === 'da-huy' && huy.huyVang === true, 'huỷ vì vắng');
    assert(d.oKyNangTuLich(lich({ required: false })).trangThai === 'khong-yeu-cau', 'không yêu cầu');
    const x = d.oKyNangTuLich(lich());
    assert(x.tuan === TUAN.qua && x.tuanKetThuc === '2026-09-27' && x.hanCham === '2026-09-30', JSON.stringify(x));
  });

  // ------------------------------------------------------------------ quét nguồn Task 2
  check('MTb (T2) · quét nguồn: không còn ChipLichSu / chữ "lịch sử" trên nhãn; OMt.tsx không hex; hai nơi gọi import OMt', () => {
    const duyet = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .flatMap((e) => e.isDirectory() ? duyet(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);
    for (const f of duyet('web/src')) {
      const s = nguon(f);
      assert(!/ChipLichSu/.test(s), `${f} còn ChipLichSu`);
      assert(!/>\s*lịch sử\s*</.test(s), `${f} còn nhãn "lịch sử"`);
    }
    const o = nguon('web/src/ui/OMt.tsx');
    assert(!/#[0-9a-fA-F]{3,8}\b/.test(o), 'OMt.tsx có mã hex');
    assert(/export function OMt\b/.test(o) && !/NhanCu/.test(o), 'OMt.tsx thiếu OMt / còn NhanCu (SV-NX-CASE N8 bỏ)');
    /* HSL-FT (M4 khung A, chủ SP 27/10): hồ sơ lượt bỏ ô MT đầu trang — trùng ô chọn lượt "MT2 · W2 SEP" + bảng kỹ năng. */
    assert(/import \{[^}]*\bOMt\b[^}]*\} from '[^']*ui\/OMt\.tsx'/.test(nguon('web/src/modules/students/HangLichMt.tsx')), 'HangLichMt chưa import OMt');
    assert(/<OMt\b/.test(nguon('web/src/modules/students/HangLichMt.tsx')), 'chưa vẽ <OMt');
    assert(!/>MT\{h\.attemptNo\}</.test(nguon('web/src/modules/students/HangLichMt.tsx')), 'HangLichMt còn chữ MT{n} thuần');
  });

  // ------------------------------------------------------------------ quét nguồn Task 4
  check('MTb (T4) · MenuDong: mục mờ (tat/title, aria-disabled, không gọi onChon), luonHien vẽ nút khi mọi mục tat', () => {
    const m = nguon('web/src/ui/MenuDong.tsx');
    assert(/tat\?: boolean/.test(m) && /title\?: string/.test(m), 'MucMenu thiếu tat / title');
    assert(/aria-disabled/.test(m), 'thiếu aria-disabled');
    assert(/luonHien/.test(m), 'thiếu luonHien');
    assert(!/if \(!muc\.length\) return null/.test(m), 'còn if (!muc.length) return null không điều kiện luonHien');
    assert(/!muc\.length && !luonHien/.test(m), 'không có điều kiện luonHien khi rỗng');
    assert(/if \(m\.tat\)/.test(m), 'onClick không chặn mục tat');
    assert(/text-slate-500/.test(m), 'mục mờ chưa dùng text-slate-500');
    assert(/title=\{m\.title\}/.test(m), 'mục không đặt title');
  });

  // ------------------------------------------------------------------ Task 6 — popup dời vượt (mockup phần 4)
  /* PR-MTGON (luật 1, 08/10) bỏ Task 6: dời vượt nay bị CHẶN ở mọi cổng, không còn popup / chip huỷ kết quả — xem MTG-1b, MTG-1d. */
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');

  check('MTb (T3) · quét nguồn: panel Xếp lịch Mock Test vẽ theo mockup phần 1, không còn giao diện cũ', () => {
    const p = nguon('web/src/modules/test/keHoach/NganXepLichMt.tsx');
    for (const c of ['MT mới', 'Lịch riêng ▸', 'Tuần và kỹ năng', "t('Sẽ xếp')", "t('Cần xem')", "t('Không xếp được')", '⇆ cuộn ngang', 'Chọn tất cả',
      'kyNang', 'attemptNo: dot', '<OMt', 'nhanSeXep(', 'demSeXep(', 'aria-pressed', 'min-w-[960px]', 'indeterminate', 'Tuần đã qua',
      'force: true']) {
      assert(p.includes(c), `NganXepLichMt thiếu ${c}`);
    }
    for (const c of ['Xem trước: ', 'luôn ở trên', 'Vẫn xếp bài có cảnh báo', 'LY_DO_TOI_THIEU', 'DauMt', 'innerWidth < 640', 'chuSeXep(', 'Học viên ·']) {
      assert(!p.includes(c), `NganXepLichMt còn ${c}`);
    }
    assert(/disabled=\{[^}]*kyChon\.length/.test(p), 'nút chính phải mờ khi bỏ hết kỹ năng (disabled theo kyChon.length)');
    assert(/sticky/.test(p) && /left-\[80px\]/.test(p), 'cột chọn + Học viên phải dính');
    assert(!/#[0-9a-fA-F]{3,8}\b/.test(p), 'panel không có hex');
  });

  // ------------------------------------------------------------------ Task 5 — hộp một đợt (mockup phần 2)
  console.log('\nPR-MTb · Hộp một đợt (menuHopKyNang, chip trạng thái dòng, điểm dòng)');
  const QL_TT = { nhapDiem: true, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false };
  const duoc = (tt: any, moi = false, q: any = QL_TT) => d.menuHopKyNang(tt, q, moi);
  const dsDuoc = (tt: any, moi = false) => duoc(tt, moi).map((m: any) => m.duoc);

  check('MTb (T5) · menuHopKyNang: luôn 5 mục đúng thứ tự, nhãn mockup, viSao ≤ 6 từ khi mờ', () => {
    for (const tt of ['khong-yeu-cau', 'chua-xep', 'chua-toi-tuan', 'dang-thi', 'co-diem', 'vang', 'cho-duyet', 'da-huy', 'lich-su', 'huy-vang']) {
      for (const moi of [false, true]) {
        const m = duoc(tt, moi);
        assert(JSON.stringify(m.map((x: any) => x.muc)) === '["doi-tuan","doi-han","bao-vang","huy-diem","nhat-ky"]', `${tt}/${moi}: ${JSON.stringify(m)}`);
        for (const x of m) {
          assert(x.duoc ? x.viSao === null : typeof x.viSao === 'string' && x.viSao.split(/\s+/).length <= 6, `${tt}/${moi}/${x.muc}: ${JSON.stringify(x)}`);
        }
      }
    }
    assert(JSON.stringify(Object.values(d.CHU_MUC_HOP)) === '["Đổi tuần","Dời hạn chấm","Vắng","Huỷ điểm","Nhật ký"]', JSON.stringify(d.CHU_MUC_HOP));
  });

  check('MTb (T5) · menuHopKyNang: (a) chưa tới tuần thi — Đổi tuần + Nhật ký sáng, "Dời hạn chấm" MỜ theo luật máy chủ (lệch mockup)', () => {
    assert(JSON.stringify(dsDuoc('chua-toi-tuan')) === '[true,false,false,false,true]', JSON.stringify(dsDuoc('chua-toi-tuan')));
    const m = duoc('chua-toi-tuan');
    assert(m[1].viSao === 'Chưa tới tuần Test' && m[2].viSao === 'Chưa tới tuần Test' && m[3].viSao === 'Chưa có điểm', JSON.stringify(m));
  });

  check('MTb (T5) · menuHopKyNang: (b) đã có điểm (T20) — Đổi tuần SÁNG cho Quản lý, Huỷ điểm sáng; Dời hạn / Báo vắng mờ "Đã có điểm"', () => {
    const m = duoc('co-diem');
    assert(JSON.stringify(m.map((x: any) => x.duoc)) === '[true,false,false,true,true]', JSON.stringify(m));
    assert(m[1].viSao === 'Đã có điểm' && m[2].viSao === 'Đã có điểm', JSON.stringify(m));
    assert(!duoc('co-diem', false, { ...QL_TT, quanLy: false, gvcn: true })[0].duoc, 'không phải Quản lý thì Đổi tuần mờ');
  });

  check('MTb (T5) · menuHopKyNang: (c) vắng → Đổi tuần = Xếp lại bài vắng; đã huỷ / huỷ vì vắng 2 lần → Khôi phục (chỉ Quản lý)', () => {
    assert(duoc('vang')[0].duoc && duoc('vang')[0].thay === 'xep-lai', JSON.stringify(duoc('vang')[0]));
    assert(duoc('da-huy')[0].duoc && duoc('da-huy')[0].thay === 'khoi-phuc', JSON.stringify(duoc('da-huy')[0]));
    assert(duoc('huy-vang')[0].duoc && duoc('huy-vang')[0].thay === 'khoi-phuc', JSON.stringify(duoc('huy-vang')[0]));
    assert(!duoc('huy-vang', false, { ...QL_TT, quanLy: false, gvcn: true })[0].duoc, 'GVCN không khôi phục');
    assert(duoc('dang-thi')[0].thay === undefined && duoc('chua-xep')[0].thay === undefined, 'đổi tuần thường không có thay');
  });

  check('MTb (T5) · menuHopKyNang: (d) đợt chưa tạo — chỉ Đổi tuần sáng, còn lại "Đợt chưa tạo"; đang thi: Dời hạn + Báo vắng sáng', () => {
    const m = duoc('chua-xep', true);
    assert(JSON.stringify(m.map((x: any) => x.duoc)) === '[true,false,false,false,false]', JSON.stringify(m));
    assert(m.slice(1).every((x: any) => x.viSao === 'Đợt chưa tạo'), JSON.stringify(m));
    assert(JSON.stringify(dsDuoc('dang-thi')) === '[true,true,true,false,true]', JSON.stringify(dsDuoc('dang-thi')));
    assert(duoc('dang-thi')[3].viSao === 'Chưa có điểm', 'huỷ điểm mờ khi chưa có điểm');
  });

  check('MTb (T5) · menuHopKyNang: MT cũ chưa điểm — Quản lý vẫn đổi tuần được (giữ PR-LM D3 / T20); chờ duyệt dời thì mờ', () => {
    assert(duoc('lich-su')[0].duoc, JSON.stringify(duoc('lich-su')[0]));
    assert(!duoc('cho-duyet')[0].duoc && duoc('cho-duyet')[0].viSao === 'Chờ duyệt', JSON.stringify(duoc('cho-duyet')[0]));
  });

  check('MTb (T5) · chipDongKyNang: trễ chấm / chờ chấm / vắng / huỷ / chưa xếp; tuần này, có lịch, xong → không chip', () => {
    const o = (tt: string, tuan: string | null, x: Record<string, unknown> = {}) => okKn(tt, tuan, x) as any;
    const chip = (kn: any) => d.chipDongKyNang(kn, H);
    assert(JSON.stringify(chip(o('da-xep', TUAN.qua, { hanCham: '2026-09-30' }))) === '{"chu":"trễ chấm","tone":"bad"}', JSON.stringify(chip(o('da-xep', TUAN.qua, { hanCham: '2026-09-30' }))));
    assert(JSON.stringify(chip(o('da-xep', TUAN.vua, { hanCham: '2026-10-07' }))) === '{"chu":"chờ chấm","tone":"muted"}', 'chờ chấm');
    assert(JSON.stringify(chip(o('vang', TUAN.qua, { sit: 'absent' }))) === '{"chu":"vắng","tone":"soon"}', 'vắng');
    assert(JSON.stringify(chip(o('cho-duyet', TUAN.qua, { sit: 'absent', choDuyet: true }))) === '{"chu":"vắng","tone":"soon"}', 'chờ duyệt dời = vắng');
    assert(JSON.stringify(chip(o('da-huy', TUAN.qua, { sit: 'cancelled' }))) === '{"chu":"huỷ · QL từ chối dời","tone":"soon"}', 'huỷ (UI-CHAM-TEST: kèm lý do — §21.4 T5)');
    assert(JSON.stringify(chip(o('da-huy', TUAN.qua, { sit: 'cancelled', huyVang: true }))) === '{"chu":"huỷ · vắng 2 lần","tone":"soon"}', 'huỷ vì vắng 2 lần');
    assert(JSON.stringify(chip(o('chua-xep', null))) === '{"chu":"chưa xếp","tone":"muted"}', 'chưa xếp');
    assert(chip(o('da-xep', TUAN.nay)) === null && chip(o('da-xep', TUAN.toi)) === null && chip(o('xong', TUAN.vua)) === null, 'không chip');
    assert(chip(o('khong-yeu-cau', null, { batBuoc: false })) === null, 'không yêu cầu');
  });

  check('MTb (T5) · luoiFT trả diem của kỹ năng đã có điểm (FT: band 1 số lẻ, Writing W1 / W2; chưa điểm: không có)', () => {
    const a = emMoi();
    const lay = () => keHoach.luoiFT(QL, LOP, TODAY).hang.find((h: any) => h.studentId === a.sid).dot[1].kn;
    assert(KN.every((k) => lay()[k].diem === undefined), 'chưa điểm không có diem');
    for (const [s, b] of [['listening', 6.5], ['reading', 6], ['writing1', 5.5], ['writing2', 6.5], ['speaking', 7]] as const) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)`).run(a.m1, s, b, TODAY);
    }
    const kn = lay();
    assert(kn.listening.diem === '6.5' && kn.reading.diem === '6.0' && kn.writing.diem === '5.5 / 6.5' && kn.speaking.diem === '7.0', JSON.stringify(kn));
    assert(kn.listening.khoa === 'đã có điểm', 'khoa');
  });

  check('MTb (T5) · quét nguồn: HopKyNang vẽ theo mockup phần 2 (Tuần chung, ⋯ luôn hiện, Nhật ký; PR-MTGON bỏ popup dời vượt); không còn ô lý do BẮT BUỘC (PR-VN3: chỉ còn ô Lý do tuỳ chọn) + câu trung tính', () => {
    const h = nguon('web/src/modules/test/keHoach/HopKyNang.tsx');
    for (const c of ['Tuần chung', 'luonHien', 'menuHopKyNang', 'NganLichSuBai', 'chipDongKyNang', 'CHU_MUC_HOP', 'Huỷ thay đổi', 'Vẫn xếp vào tuần này',
      'Tuần đã qua', 'tuanDaSo', 'tat: !m.duoc', 'Chặn: ']) {
      assert(h.includes(c), `HopKyNang thiếu ${c}`);
    }
    for (const c of ['LY_DO_TOI_THIEU', 'Lý do bỏ', 'Lý do dời', 'Lý do sửa tuần', 'không trùng đợt khác', 'Chưa đổi gì', 'lyDoBo: bo.length']) {
      assert(!h.includes(c), `HopKyNang còn ${c}`);
    }
    assert(/toiThieu/.test(h) === false, 'hộp chỉ Quản lý dùng: không khoá tuần đã qua');
    assert(!/["'`]#[0-9a-fA-F]{3,8}\b/.test(h), 'hộp không có hex');   // chỉ chuỗi ("#fff"); "#212" trong chú thích là số PR
    assert(/lyDoBo: null/.test(h), 'lyDoBo phải gửi null');
    const n = nguon('web/src/modules/cham/NganLichSuBai.tsx');
    assert(/startsWith\('writing'\)/.test(n), 'NganLichSuBai: điểm W lọc theo writing1|writing2');
  });

  // ------------------------------------------------------------------ Task 7 — lý do tuỳ chọn + tuần đã qua cho Quản lý (web)
  console.log('\nPR-MTb · T7 lý do tuỳ chọn trừ 3 chỗ bắt buộc; Quản lý xếp tuần đã qua');

  check('MTb (T7) · khoá phép máy chủ: GVCN dời tuần đã qua → chặn; QL dời MT chưa thi về tuần cũ → lưu; từ chối bắt lý do, huỷ lượt / huỷ điểm không (PR-MTGON)', () => {
    const a = emMoi([0, 4, 8]);
    const e = loiCua(() => skillSch.setSkillWeek(P.coreTeacher, a.m1, 'listening', tuan(-1).id, {}));
    assert(e.status === 400 || e.status === 403, `GVCN: ${e.status} ${e.message}`);
    skillSch.setSkillWeek(QL, a.m1, 'listening', tuan(-1).id, {});
    assert((conn.prepare(`SELECT planned_period_id p FROM attempt_skills WHERE attempt_id = ? AND skill = 'listening'`).get(a.m1) as any).p === tuan(-1).id, 'QL chưa dời');
    assert(d.kiemLyDoThaoTac('tu-choi', '') && !d.kiemLyDoThaoTac('huy-luot', '') && !d.kiemLyDoThaoTac('huy-diem', ''), 'luật chung (huỷ lượt tuỳ chọn — PR-MTGON)');
  });

  check('MTb (T7) · quét nguồn: web/src không còn LY_DO_TOI_THIEU / kiemLyDo( (trừ DeXuatSuaPanel) / bộ đếm ở ô lý do tuỳ chọn', () => {
    const duyet = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .flatMap((f) => (f.isDirectory() ? duyet(`${dir}/${f.name}`) : /\.tsx?$/.test(f.name) ? [`${dir}/${f.name}`] : []));
    for (const f of duyet('web/src')) {
      if (f.endsWith('DeXuatSuaPanel.tsx')) continue;
      const s = nguon(f);
      assert(!/LY_DO_TOI_THIEU/.test(s) && !/\bkiemLyDo\(/.test(s), `${f} còn hằng / hàm lý do cũ`);
      assert(!/dem=\{\{ co: (lyDo|reason)\b/.test(s), `${f} còn bộ đếm ở ô lý do`);
    }
  });

  check('MTb (T7) · quét nguồn: HopThaoTacMt có prop quanLy, kiểm tuần đã qua chỉ khi không phải QL, chip "Tuần đã qua"; ba nơi gọi truyền quanLy', () => {
    const h = nguon('web/src/modules/fasttrack/HopThaoTacMt.tsx');
    assert(/quanLy: boolean/.test(h) && !/tuanDaBatDau/.test(h), 'prop quanLy / bỏ tuanDaBatDau');
    assert(/const batBuoc = canLyDo\(tt?\)/.test(h), 'batBuoc = canLyDo(t)');
    assert(/tuanNay = homNay && !quanLy && (!gvcnCu && )?tt? !== 'khoi-phuc'/.test(h), 'tuanNay chỉ khi không phải Quản lý (GVCN dời MT cũ: chủ SP 28/10)');
    for (const c of ['kiemTuanXep', 'CAU_TUAN_DA_QUA', "t('Tuần đã qua')}</Nhan>", 'tone="soon"']) assert(h.includes(c), `HopThaoTacMt thiếu ${c}`);
    assert(!/dem=/.test(h), 'ô lý do tuỳ chọn không có bộ đếm');
    assert(/quanLy=\{d\.viewer\.canPlanWeek\}/.test(nguon('web/src/modules/fasttrack/MockDetailPage.tsx')), 'hồ sơ Mock');
    assert(/quanLy/.test(nguon('web/src/modules/test/keHoach/HopKyNang.tsx').split('<HopThaoTacMt')[1] ?? ''), 'HopKyNang');
    assert(/quanLy=\{sheet\.canPlan\}/.test(nguon('web/src/modules/cham/LuoiThuong.tsx')), 'lưới lớp thường');
  });

  check('MTb (T7) · quét nguồn: hồ sơ Mock — huỷ lượt bắt lý do bằng hàm chung; dời / hạn / vắng tuỳ chọn, câu giải thích chuyển vào title; từ chối bắt lý do', () => {
    const m = nguon('web/src/modules/fasttrack/MockDetailPage.tsx');
    assert(!/kiemLyDoThaoTac\('huy-luot'/.test(m) && !/Lý do huỷ \(bắt buộc\)/.test(m), 'CancelDialog: lý do tuỳ chọn (PR-MTGON)');
    /* PR-HOP1: WeekModal bỏ — dời cả đợt đi hộp một đợt `HopKyNang` (chip "Tuần đã qua", Quản lý chọn tuần đã qua). */
    assert(!/WeekModal/.test(m) && /\{t\('Tuần đã qua'\)\}<\/Nhan>/.test(nguon('web/src/modules/test/keHoach/HopKyNang.tsx')), 'WeekModal');
    const han = m.slice(m.indexOf('function DeadlineModal'), m.indexOf('function AbsenceMoveModal'));
    assert(!/<SectionNote>/.test(han), 'DeadlineModal: câu giải thích chuyển vào title');
    const vang = m.slice(m.indexOf('function AbsenceMoveModal'), m.indexOf('function TraLoiDeNghiModal'));
    assert(/<Truong nhan=\{t\('Lý do'\)\} tuyChon>/.test(vang), 'AbsenceMoveModal: lý do tuỳ chọn');
    const the = nguon('web/src/modules/duyet/TheYeuCau.tsx');
    assert(/o\.loai === 'tu-choi'/.test(the) && /Chưa điền/.test(the), 'từ chối thẻ Xin dời bắt lý do');
  });

  check('MTb (T7) · quét nguồn: ScoreEntry bỏ cụm "phải ghi lý do" ở tooltip; "Dời lịch" cho kỹ năng đã có điểm chỉ Quản lý (thaoTacKyNang)', () => {
    const se = nguon('web/src/modules/fasttrack/ScoreEntry.tsx');
    assert(!/phải ghi lý do/.test(se) && !/đã có điểm nên phải/.test(se), 'ScoreEntry còn câu bắt lý do');
    const ql = { nhapDiem: true, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false };
    assert(d.thaoTacKyNang('co-diem', ql).menu.includes('doi-lich'), 'QL');
    assert(!d.thaoTacKyNang('co-diem', { ...ql, quanLy: false }).menu.includes('doi-lich'), 'GVBM');
  });

  // ------------------------------------------------------------------ Task 8 — nhập band (T10), Xin dời / Không mock lại (T3), Khôi phục kết quả (T2)
  console.log('\nPR-MTb · T8 nhập band · Xin dời / Không mock lại · Khôi phục kết quả');
  const absence: any = await import('../fasttrack/absence.ts');
  const ketQuaHuy: any = await import('../fasttrack/ketQuaHuy.ts');

  check('MTb (T10) · rawPatchFrom: "6.5"/"b6"/"6.0" = band; "32" = số câu; "6" = số câu; "b6.3"/"10.5"/"6,5"/"abc" không gửi; "-" và "" như cũ', () => {
    const o = { noShow: null };
    const j = (s: string, c: any = o) => JSON.stringify(d.rawPatchFrom(s, c));
    assert(j('6.5') === '{"band":6.5}', j('6.5'));
    assert(j('b6') === '{"band":6}' && j('B6') === '{"band":6}' && j('6.0') === '{"band":6}', 'b6 / 6.0');
    assert(j('32') === '{"rawScore":32}' && j('6') === '{"rawScore":6}', 'raw');
    for (const x of ['b6.3', '10.5', '6,5', 'abc', '--', '7.25']) assert(d.rawPatchFrom(x, o) === null, `${x} phải null`);
    assert(j('-') === '{"noShow":true}' && j('') === '{"rawScore":null}', '- / trống');
    assert(j('', { noShow: { state: 'khong-co-bai' } }) === '{"noShow":false}', 'trống gỡ dấu');
    /* PR-MTb sau rà thay: LOI_TIEU_CHI không còn nhắc band / b6 (ô tiêu chí chỉ nhận số; band có ô riêng). */
    assert(typeof d.LOI_SO_CAU === 'string' && /band/.test(d.LOI_SO_CAU), 'câu lỗi nhắc band');
  });

  check('MTb (T10; OV-4c: bandThang = MT cũ / MT0) · criteriaPatchFrom: band một mình → {band}, preview = band; band + tiêu chí → null + lỗi; band sai → null; không band → như cũ', () => {
    const o = { noShow: null };
    const a = d.criteriaPatchFrom(['', '', '', ''], o, '6.5', true);
    assert(a.patch?.band === 6.5 && a.preview === 6.5 && !('criteria' in a.patch), JSON.stringify(a));
    assert(d.criteriaPatchFrom(['', '', '', ''], o, 'b7', true).patch?.band === 7, 'b7');
    const b = d.criteriaPatchFrom(['6', '6', '', ''], o, '6.5', true);
    assert(b.patch === null && b.loi === 'Điền band hoặc tiêu chí', JSON.stringify(b));
    assert(d.criteriaPatchFrom(['-', '', '', ''], o, '6.5', true).patch === null, '"-" cùng band');
    for (const x of ['6.3', '10', 'abc', '-1']) assert(d.criteriaPatchFrom(['', '', '', ''], o, x, true).patch === null, `band ${x}`);
    const c = d.criteriaPatchFrom(['6', '6', '6', '7'], o);
    assert(c.patch?.criteria?.length === 4 && c.preview === 6.5 && c.loi === null, JSON.stringify(c));
    assert(d.criteriaPatchFrom(['', '', '', ''], { noShow: { state: 'khong-co-bai' } }).patch?.noShow === false, 'gỡ dấu');
    assert(d.criteriaPatchFrom(['6', 'x', '', ''], o).patch === null, 'tiêu chí hỏng');
  });

  check('MTb (T10, A8) · máy chủ: GV L/R {band: 6.5} → band 6.5, raw_score null; gửi band cùng tiêu chí → 400', () => {
    const a = emMoi([0, 4, 8]);
    attemptsSvc.saveScore(P.lrTeacher, a.m1, 'listening', { band: 6.5 });
    const r = conn.prepare(`SELECT band, raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(a.m1) as any;
    assert(r.band === 6.5 && r.raw_score === null, JSON.stringify(r));
    const e = loiCua(() => attemptsSvc.saveScore(QL, a.m1, 'writing1', { band: 6, criteria: [6, 6, null, null] }));
    assert(e.status === 400, `${e.status} ${e.message}`);
  });

  /** Em có S vắng một lần rồi vắng lần 2 → `huyVang`. */
  const emHuyVang = () => {
    const a = emMoi([0, 4, 8]);
    conn.prepare(`UPDATE attempt_skills SET absence_move_count = 1 WHERE attempt_id = ? AND skill = 'speaking'`).run(a.m1);
    absence.baoVang(P.coreTeacher, a.m1, 'speaking', '');
    return a;
  };
  const soDeNghi = (aid: number) => (conn.prepare(`SELECT COUNT(*) n FROM skill_move_requests WHERE attempt_id = ? AND status = 'pending'`).get(aid) as any).n as number;

  check('MTb (T3, A6) · máy chủ: kỹ năng huyVang — GVBM / GVCN xin-doi → 403; QL xin-doi → một đề nghị pending; nút theo vai', () => {
    const a = emHuyVang();
    assert((conn.prepare(`SELECT huy_vang FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`).get(a.m1) as any)?.huy_vang === 1, 'chưa huyVang');
    assert(loiCua(() => absence.xinDoi(P.subjectTeacher, a.m1, 'speaking')).status === 403, 'GVBM');
    assert(loiCua(() => absence.xinDoi(P.coreTeacher, a.m1, 'speaking')).status === 403, 'GVCN');
    absence.xinDoi(P.mbManager, a.m1, 'speaking', { lyDo: '' });
    assert(soDeNghi(a.m1) === 1, 'đề nghị');
    const gvcn = { nhapDiem: false, quanLy: false, gvcn: true, laFt: true, dotHoanTat: false };
    assert(d.thaoTacKyNang('huy-vang', gvcn).chinh === null, 'GVCN không còn Xin dời');
    assert(d.thaoTacKyNang('huy-vang', { ...gvcn, quanLy: true, gvcn: false }).menu.includes('khong-mock-lai'), 'QL có Không mock lại');
    assert(!d.thaoTacKyNang('huy-vang', { ...gvcn, gvcn: false }).chinh, 'GVBM không có nút chính');
  });

  // PR-MTGON: dời vượt không còn tạo ket_qua_huy — dựng dữ liệu cũ thẳng vào bảng.
  check('MTb (T2, A6b) · máy chủ: lượt có kết quả đã huỷ (dữ liệu cũ) có ketQuaHuy (soDiem), GVCN khôi phục → 403', () => {
    const a = emMoi();
    conn.prepare(`INSERT INTO ket_qua_huy (attempt_id, vuot_boi_attempt_id, diem_json, lich_json, so_diem, ly_do, huy_boi, huy_luc)
      VALUES (?, ?, '[]', '[]', 4, 'x', ?, ?)`).run(a.m2, a.m1, QL.userId, `${TODAY}T08:00:00.000Z`);
    const kq = attemptsSvc.attemptDetail(QL, a.m2).ketQuaHuy;
    assert(kq && kq.soDiem > 0, JSON.stringify(kq));
    assert(loiCua(() => ketQuaHuy.khoiPhucKetQua(P.coreTeacher, a.m2)).status === 403, 'GVCN');
  });

  check('MTb (T10) · quét nguồn: hộp nhập điểm (OV-4b, một hộp thay 3 hộp tiêu chí) có ô "Band"; rawPatchFrom / criteriaPatchFrom ở shared', () => {
    const se = nguon('web/src/modules/fasttrack/ScoreEntry.tsx');
    const hop = nguon('web/src/modules/fasttrack/HopNhapDiem.tsx');
    assert(/>Band<\/span>/.test(hop) && /inputMode="decimal"/.test(hop) && /bandText/.test(hop) && /criteriaPatchFrom\(vals, cell, bandText, cell\.bandThang\)/.test(hop), 'hộp nhập điểm thiếu ô Band');
    assert(/band\?: number \| null/.test(se) && !/export function rawPatchFrom/.test(se), 'SavePatch.band / chuyển rawPatchFrom');
    const cd = nguon('shared/domain/chamDiem.ts');
    assert(/export function rawPatchFrom/.test(cd) && /export function criteriaPatchFrom/.test(cd) && /docONhapLR\(/.test(cd), 'chamDiem.ts');
  });

  check('MTb (T3, T2) · quét nguồn: HopThaoTacMt có khong-mock-lai (không còn xin-doi), bỏ vế "từ lần 2 Quản lý duyệt"; hồ sơ Mock + hàng Lộ trình có "Khôi phục kết quả"', () => {
    const h = nguon('web/src/modules/fasttrack/HopThaoTacMt.tsx');
    assert(!h.includes("'xin-doi'"), 'còn nút xin-doi');
    for (const c of ["'khong-mock-lai'", '/khong-mock-lai', 'huyVang']) assert(h.includes(c), `HopThaoTacMt thiếu ${c}`);
    const m = nguon('web/src/modules/fasttrack/MockDetailPage.tsx');
    assert(m.includes('Khôi phục kết quả') && m.includes('HopKhoiPhucKetQua') && m.includes('ketQuaHuy'), 'MockDetailPage');
    assert(/khoi-phuc-ket-qua/.test(nguon('web/src/modules/test/keHoach/HopKhoiPhucKetQua.tsx')), 'hộp khôi phục gọi đường A6b');
    const hl = nguon('web/src/modules/students/HangLichMt.tsx');
    assert(/HopKhoiPhucKetQua/.test(hl) && /Khôi phục kết quả/.test(hl), 'HangLichMt');
    const duyet = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .flatMap((f) => (f.isDirectory() ? duyet(`${dir}/${f.name}`) : /\.tsx?$/.test(f.name) ? [`${dir}/${f.name}`] : []));
    for (const f of [...duyet('web/src'), ...duyet('shared')]) assert(!/từ lần 2 Quản lý duyệt/.test(nguon(f)), `${f} còn câu luật cũ`);
  });

  // ------------------------------------------------------------------ Task 9 — lưới Kế hoạch Test FT dùng Ô MT (Q1 = A)
  check('MTb (T9) · quét nguồn (KHT-GON, mockup #659): lưới vẽ ODotGon theo oGon (mở hộp, kyNangDau null); MT kế tiếp "Xếp MTn", MT sau nữa "–"; cột 180 / 250', () => {
    const l = nguon('web/src/modules/test/keHoach/LuoiKeHoach.tsx');
    assert(/<ODotGon\b/.test(l) && /oGon\(dot\.kn, homNay, ct\)/.test(l), 'LuoiKeHoach chưa vẽ ODotGon theo oGon');
    assert(/kyNangDau: null/.test(l) && /Xếp MT trước rồi mới tới/.test(l) && /attemptNo === \(h as HangFT\)\.soKeTiep/.test(l), 'thiếu mở hộp / chỉ MT kế tiếp có nút xếp');
    assert(/loai === 'ft' \? 190 : 220/.test(l), 'rongDot FT 190, lớp thường 220 (U05 mockup V11)');
    const c = nguon('web/src/modules/test/keHoach/ChipKyNang.tsx');
    assert(!/#[0-9a-fA-F]{3,8}\b/.test(c) && !/duongDotTest|NhanCu/.test(c), 'ô gọn: màu token, không liên kết thẳng');
  });

  /* Rà code #MTb: ô L/R chỉ có band — mở "Sửa điểm" rồi Lưu không được đổi thành xoá điểm (giá trị đầu giữ band, như RawScoreInput). */
  check('MTb (T10) · hộp nhập điểm L/R: giá trị đầu của ô band-only là band (6.5), Lưu giữ nguyên band — không thành rawScore null', () => {
    const ed = nguon('web/src/modules/fasttrack/HopNhapDiem.tsx');
    assert(/cell\.rawScore !== null \? String\(cell\.rawScore\) : cell\.band !== null \? fmtBand\(cell\.band\)/.test(ed), 'giá trị đầu thiếu band');
    const cell: any = { skill: 'listening', rawScore: null, band: 6.5, criteria: [null, null, null, null], noShow: false };
    assert(JSON.stringify(d.rawPatchFrom('6.5', cell)) === JSON.stringify({ band: 6.5 }), 'đọc lại "6.5" phải là band 6.5');
    assert(JSON.stringify(d.rawPatchFrom('6.0', cell)) === JSON.stringify({ band: 6 }), 'đọc lại "6.0" phải là band 6');
  });

  // ------------------------------------------------------------------ Sau rà độc lập (06/10) — Đợt 1
  console.log('\nPR-MTb · Sau rà độc lập: khôi phục rút đề nghị dời, MT cũ "-", màu ô, câu máy chủ');

  check('MTb sau rà (I1) · Khôi phục kỹ năng huỷ vắng RÚT đề nghị dời đang chờ — quá hạn quét không huỷ lại', () => {
    const a = emHuyVang();
    const r = absence.xinDoi(P.mbManager, a.m1, 'speaking', { lyDo: '' });
    assert(soDeNghi(a.m1) === 1, 'tiền đề: có đề nghị chờ');
    conn.prepare('UPDATE skill_move_requests SET decide_by = ? WHERE id = ?').run(t.addDays(TODAY, -1), r.requestId);
    absence.restoreCancelledSkill(QL, a.m1, 'speaking', tuan(2).id);
    assert(soDeNghi(a.m1) === 0, 'đề nghị còn pending sau khôi phục');
    assert((conn.prepare('SELECT status FROM skill_move_requests WHERE id = ?').get(r.requestId) as any).status === 'withdrawn', 'phải là withdrawn');
    absence.sweepExpiredMoves();
    const k = conn.prepare(`SELECT sit_status, huy_vang FROM attempt_skills WHERE attempt_id = ? AND skill = 'speaking'`).get(a.m1) as any;
    assert(k.sit_status === 'scheduled' && k.huy_vang === 0, `kỹ năng bị huỷ lại: ${JSON.stringify(k)}`);
  });

  check('MTb sau rà (I1) · trangThaiTT: huyVang + đề nghị chờ → cho-duyet (QL: Trả lời đề nghị, không Khôi phục + Không mock lại song song)', () => {
    const o = { batBuoc: true, tuanBatDau: '2026-09-07', coDiem: false, sit: 'cancelled', lichSu: false, homNay: '2026-09-16', huyVang: true };
    assert(d.trangThaiTT({ ...o, choDuyet: true }) === 'cho-duyet', 'huyVang + choDuyet');
    assert(d.trangThaiTT({ ...o, choDuyet: false }) === 'huy-vang', 'huyVang không đề nghị');
    assert(d.trangThaiTT({ ...o, choDuyet: true, huyVang: false }) === 'da-huy', 'huỷ thường vẫn da-huy');
    const ql = { nhapDiem: true, quanLy: true, gvcn: false, laFt: true, dotHoanTat: false };
    assert(d.thaoTacKyNang('cho-duyet', ql).chinh === 'tra-loi-de-nghi', 'QL');
    assert(d.thaoTacKyNang('cho-duyet', { ...ql, quanLy: false, gvcn: true }).chinh === null, 'GVCN hết nút');
    const m = d.menuHopKyNang('cho-duyet', ql, false);
    assert(m.every((x: any) => x.thay === undefined), 'menu hộp không đưa Khôi phục');
    // Ô MT vẫn "huỷ S" (một kỹ năng bắt buộc = đủ cả đợt: chữ `huỷ`), tooltip nói chờ Quản lý duyệt.
    const s: any = { trangThai: 'da-huy', tuan: '2026-09-07', periodId: 1, doiTu: null, batBuoc: true, khoa: null, sit: 'cancelled', tuanKetThuc: '2026-09-13', choDuyet: true, huyVang: true, hanCham: null };
    const r = d.oMt({ so: 1, attemptId: 1, kn: { speaking: s }, cu: false }, '2026-09-16');
    assert(r.kieu === 'con-viec' && r.viec === 'huỷ' && r.tuan === 'W2 SEP' && /chờ Quản lý duyệt/.test(r.title), JSON.stringify(r));
    assert(d.chipDongKyNang(s, '2026-09-16')?.chu === 'huỷ · vắng 2 lần', 'chip');
  });

  /** MT cũ: L R W có điểm, S ghi "-" (không dự thi, `no_show_cu`). */
  const mtCuKhongS = () => {
    const a = emMoi([-4, 4, 8]);
    conn.prepare(`UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?`).run(a.m1);
    for (const [s, b] of [['listening', 6], ['reading', 6], ['writing1', 6], ['writing2', 6]] as const) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, raw_score, nhap_dau_ngay) VALUES (?,?,?,?,?)`).run(a.m1, s, b, null, TODAY);
    }
    attemptsSvc.saveScore(QL, a.m1, 'speaking', { noShow: true });
    return a;
  };
  check('MTb sau rà (I2) · MT cũ có S "-": luoiFT trả khongDuThi cho S (không cho L/R/W), ô MT xong (xanh, không chữ việc)', () => {
    const a = mtCuKhongS();
    assert((conn.prepare(`SELECT no_show_cu c FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`).get(a.m1) as any).c === 1, 'tiền đề no_show_cu');
    const kn = keHoach.luoiFT(QL, LOP, TODAY).hang.find((h: any) => h.studentId === a.sid).dot[1].kn;
    assert(kn.speaking.khongDuThi === true, JSON.stringify(kn.speaking));
    assert(!kn.listening.khongDuThi && !kn.reading.khongDuThi && !kn.writing.khongDuThi, 'L/R/W không được có cờ');
    const r = d.oMt({ so: 1, attemptId: a.m1, kn, cu: true }, TODAY);
    assert(r.kieu === 'xong' && r.viec === null, JSON.stringify(r));
  });

  check('MTb sau rà (I2) · luật thuần: khongDuThi = không yêu cầu (xanh, không "3/4"); oKyNangTuLich + khongDuThiTuO đọc từ ô hồ sơ Mock MT cũ', () => {
    const xong: any = { trangThai: 'xong', tuan: '2026-09-07', periodId: 1, doiTu: null, batBuoc: true, khoa: 'đã có điểm', sit: 'scheduled', tuanKetThuc: '2026-09-13', choDuyet: false, hanCham: null };
    const kn = { listening: xong, reading: xong, writing: xong, speaking: { ...xong, trangThai: 'da-xep', khoa: null, khongDuThi: true } };
    const r = d.oMt({ so: 1, attemptId: 1, kn, cu: true }, '2026-10-06');
    assert(r.kieu === 'xong' && r.chu === 'W2 SEP', JSON.stringify(r));
    assert(/Speaking: .*đã huỷ/.test(r.title), r.title);   // LUAT-34: "-" ở MT cũ (cu) = Đã huỷ
    const lich = { required: true, periodId: 1, weekStart: '2026-09-07', weekEnd: '2026-09-13', sitStatus: 'scheduled', scored: false, pendingMove: null, absenceMoveCount: 0, deadline: null, doiTu: null };
    assert((d as any).oKyNangTuLich(lich, true).khongDuThi === true && !(d as any).oKyNangTuLich(lich).khongDuThi, 'oKyNangTuLich');
    const cell = (assessedSkill: string, state: string | null, band: number | null = null) => ({ assessedSkill, band, rawScore: null, noShow: state ? { state } : null });
    assert((d as any).khongDuThiTuO([cell('speaking', 'khong-du-thi')], 'speaking', true) === true, 'S "-"');
    /* OV-11a (CA3-5): mọi lượt — "-" nhập bù sau tuần thi cũng là Không dự thi; vắng đã chốt (`daChot`) thì không. */
    assert((d as any).khongDuThiTuO([{ ...cell('speaking', 'khong-du-thi'), daChot: { lan: 1 } }], 'speaking', false) === false, 'vắng đã chốt');
    assert((d as any).khongDuThiTuO([cell('writing', 'khong-du-thi'), cell('writing', null, 6)], 'writing', true) === false, 'W1 "-" W2 có điểm');
    assert((d as any).khongDuThiTuO([cell('writing', 'khong-du-thi'), cell('writing', 'khong-du-thi')], 'writing', true) === true, 'W1 W2 "-"');
    assert((d as any).khongDuThiTuO([], 'speaking', true) === false, 'không có ô');
  });

  check('MTb sau rà (3, 4) · màu ô "xong" = token ok (xanh lá); MT cũ chưa điểm = kiểu "cho-cham-cu", chữ "chờ" (màu như mọi "chờ" — FIX-DTL, C2; OV-15a xám)', () => {
    const o = nguon('web/src/ui/OMt.tsx');
    assert(/xong: 'border-transparent bg-ok-bg text-ok'/.test(o), 'xong chưa dùng ok');
    assert(/'cho-cham-cu': '[^']*bg-muted-bg[^']*text-muted'/.test(o), 'cho-cham-cu chưa cùng màu "chờ" (C2)');
    const het: any = { trangThai: 'da-xep', tuan: '2026-09-07', periodId: 1, doiTu: null, batBuoc: true, khoa: null, sit: 'scheduled', tuanKetThuc: '2026-09-13', choDuyet: false, hanCham: null };
    const cu = d.oMt({ so: 1, attemptId: 1, kn: { listening: het }, cu: true }, '2026-10-06');
    assert((cu.kieu as string) === 'cho-cham-cu' && cu.viec === 'chờ' && cu.cu === true, JSON.stringify(cu));
    assert(d.oMt({ so: 1, attemptId: 1, kn: { listening: het }, cu: false }, '2026-10-06').kieu === 'cho-cham', 'MT thường vẫn cho-cham');
    assert(d.chipDongKyNang(het, '2026-10-06')?.chu === 'chờ chấm', 'chip dòng');
  });

  check('MTb sau rà (6) · 3 câu máy chủ "Chỉ Quản lý sửa được điểm" không còn bắt "kèm lý do" (T7/T22)', () => {
    for (const f of ['server/src/fasttrack/attempts.ts', 'server/src/normal/regular.ts']) {
      assert(!/nhờ Quản lý hiệu chỉnh, kèm lý do/.test(nguon(f)), `${f} còn câu cũ`);
    }
  });

  check('MTb sau rà (minor) · LOI_TIEU_CHI không nhắc "b6"; lịch sử có nhãn skill_cancelled_absence; dòng đề nghị dời khi huyVang không nói "quá hạn thì huỷ"', () => {
    assert(!/b6/.test(d.LOI_TIEU_CHI), d.LOI_TIEU_CHI);
    assert(/skill_cancelled_absence: \{ chu: t\('Huỷ do vắng 2 lần'\)/.test(nguon('web/src/modules/fasttrack/DongThoiGianLuot.tsx')), 'nhãn lịch sử');
    const m = nguon('web/src/modules/fasttrack/MockDetailPage.tsx');
    assert(/r\.huyVang \? '' : (?:t\()?', quá hạn thì huỷ kỹ năng'/.test(m), 'dòng đề nghị dời chưa phân biệt huyVang');
  });
  // ------------------------------------------------------------------ sau rà độc lập — đợt 2 (giao diện)
  check('MTb sau rà đợt 2 (1) · đầu hộp một đợt: tên là Link tới `duongDotTest` khi đã có đợt (đóng hộp khi bấm), đợt mới là chữ', () => {
    const h = nguon('web/src/modules/test/keHoach/HopKyNang.tsx');
    assert(/import \{ Link\b[^}]*\} from 'react-router-dom'/.test(h) && /duongDotTest/.test(h), 'thiếu Link / duongDotTest');
    assert(/attemptId !== null\s*\?\s*<Link to=\{duongDotTest\(\{ id: attemptId,[^}]*classId \}, null\)\} onClick=\{onClose\}/.test(h), 'tên chưa là Link đóng hộp');
    const tieuDe = h.slice(h.indexOf('<Link to={duongDotTest'), h.indexOf('</Link>') + 120);
    assert(/className="ten-ho-so flex min-h-\[44px\] items-center sm:min-h-0"/.test(tieuDe), 'Link chưa 44px ở 375');
    assert(/<span className="block truncate">\{tieuDe\}<\/span>/.test(tieuDe), 'đợt mới phải là chữ');
  });

  check('MTb sau rà đợt 2 (2) · panel Xếp lịch: số em / bài và danh sách GỬI chỉ gồm em đang thấy (ẩn bởi Tìm / chip lọc thì không đếm, không gửi)', () => {
    const n = nguon('web/src/modules/test/keHoach/NganXepLichMt.tsx');
    assert(/const daChonThay = hienThi\.filter\(\(h\) => dangTick\(h\.studentId\)\)/.test(n), 'thiếu daChonThay từ hienThi');
    assert(/const dongChon = daChonThay\.map/.test(n), 'số trên nút phải theo daChonThay');
    assert(/const ids = daChonThay\.filter\(\(h\) => h\.classId === id\)\.map/.test(n), 'danh sách gửi phải theo daChonThay');
    assert(!/hangs\.filter\(\(h\) => dangTick/.test(n) && !/hangs\.filter\(\(h\) => h\.classId === id && dangTick/.test(n), 'còn đếm / gửi em đang ẩn');
    assert(/const dem = demSeXep\(trongLoc\./.test(n) && /const tickDuoc = hienThi\.filter/.test(n), 'chip đếm theo tìm/lớp; Chọn tất cả theo hienThi');
  });

  check('MTb sau rà đợt 2 (3) · ô MT "đang chọn" (PR-OMT: không còn chữ ✓ trong chữ trạng thái): luôn đúng MỘT dấu ✓, vẫn đảo màu + aria-label "đang chọn"', () => {
    const o = nguon('web/src/ui/OMt.tsx');
    /* OV-11a (CA3-2): ô "xong" cũng có ✓ — vẫn MỘT phần tử ✓ duy nhất (đang chọn hoặc xong), không bao giờ hai. */
    assert(/\{\(chon \|\| \(!huy && r\.kieu === 'xong'\)\) && <span aria-hidden>✓<\/span>\}/.test(o)
      && (o.match(/<span aria-hidden>✓<\/span>/g) ?? []).length === 1 && !/startsWith\('✓'\)/.test(o), 'dấu ✓ đang chọn: đúng một dấu');
    assert(/chon \? MAU_CHON/.test(o) && /chon \? t\('đang chọn'\)|chon \? 'đang chọn'|!!chon\)/.test(o), 'mất dấu đang chọn');
  });

  check('MTb sau rà đợt 2 (4) · dòng "xếp nốt": ô đợt sẽ xếp tô "đang chọn" và giữ chữ trạng thái (mockup: "2 vắng S"); chữ tuần chỉ cho tạo / dời', () => {
    const n = nguon('web/src/modules/test/keHoach/NganXepLichMt.tsx');
    assert(/const seXep = !!d && \(d\.hanhDong === 'tao' \|\| d\.hanhDong === 'doi'\)/.test(n), 'seXep');
    assert(/const laDich = n === dich && seXep/.test(n) && /chon=\{laDich\} chuChon=\{laDich \? chuTuan : undefined\}/.test(n), 'ô đợt đích chưa chon');
    assert(/d\.viec === 'tao' \|\| d\.viec === 'doi'/.test(n), 'chuTuan chỉ tạo / dời');
    assert(/xếp nốt.*giữ chữ trạng thái/.test(n), 'ghi chú xếp nốt');
  });

  /* OV-4b: dải ô lớn mở hộp nhập điểm — hộp dựng mới mỗi lần mở (key theo bài), giá trị đầu đọc lúc mở; lưu xong hộp đóng. */
  check('MTb sau rà đợt 2 (5) · ODiemLon: hộp KHÔNG remount theo band nền (key theo bài nhập, không theo band)', () => {
    const o = nguon('web/src/modules/fasttrack/ODiemLon.tsx');
    assert(!/key=\{`[^`]*band/.test(o), 'key còn theo band');
    assert(/<HopNhapDiem key=\{oMo\.skill\}/.test(o), 'key chỉ theo bài nhập');
  });

  check('MTb sau rà đợt 2 (7) · chip dòng của hộp một đợt: MT cũ chưa điểm = "chờ chấm" TÍM như MT thường (FIX-DTL, C2); hộp truyền `lichSu`', () => {
    const het: any = { trangThai: 'da-xep', tuan: '2026-09-07', periodId: 1, doiTu: null, batBuoc: true, khoa: null, sit: 'scheduled', tuanKetThuc: '2026-09-13', choDuyet: false, hanCham: null };
    const cu = (d as any).chipDongKyNang(het, '2026-10-06', null, true);
    assert(cu?.chu === 'chờ chấm' && cu.tone === 'muted', JSON.stringify(cu));
    const thuong = (d as any).chipDongKyNang(het, '2026-10-06', null, false);
    assert(thuong?.chu === 'chờ chấm' && thuong.tone === 'muted', JSON.stringify(thuong));
    assert((d as any).chipDongKyNang(het, '2026-10-06')?.tone === 'muted', 'mặc định không phải MT cũ');
    const h = nguon('web/src/modules/test/keHoach/HopKyNang.tsx');
    assert(/chipDongKyNang\(o, homNay, ct, lichSu\)/.test(h) && /lichSu=\{lichSu\}/.test(h), 'hộp chưa truyền lichSu');
    assert(/!\(chip\.chu === t\('chưa xếp'\) && d\.weekStart\)/.test(h), 'chip "chờ chấm" bị ẩn cùng chip "chưa xếp"');
  });

  check('MTb sau rà đợt 2 (6) · nút ⋯: vùng bấm ở điện thoại đủ 44px (after theo mép trong viền 1px: 28 - 2 + 2 × 9) — hồ sơ Mock và Lộ trình dùng chung MenuDong', () => {
    const m = nguon('web/src/ui/MenuDong.tsx');
    assert(/h-7 min-w-7/.test(m) && /after:absolute after:-inset-\[9px\] after:content-\[''\] sm:after:hidden/.test(m), 'MenuDong: after phải -inset-[9px] (28 - 2 + 18 = 44)');
    assert(!/after:-inset-2 /.test(m), 'còn -inset-2 (42px)');
    for (const f of ['web/src/modules/fasttrack/MockDetailPage.tsx', 'web/src/modules/students/HangLichMt.tsx']) assert(/<MenuDong /.test(nguon(f)), `${f} không dùng MenuDong`);
  });

  // ------------------------------------------------------------------ PR-OMT: ô MT gọn + lưới FT G1 + panel toàn màn
  console.log('\nPR-OMT · Ô MT gọn (C1–C7)');
  check('PR-OMT (C6) · nhomKyNang: cả đợt cùng tuần + cùng trạng thái = MỘT nhóm; tách tuần / khác trạng thái = nhiều nhóm; xong hết = một nhóm xanh', () => {
    const g = (kn: any, cu = false) => d.nhomKyNang(kn, H, null, cu);
    const mot = g(bonKn('da-xep', TUAN.toi));
    assert(mot.length === 1 && mot[0].ten === 'L R W S' && mot[0].tuan === 'W3 OCT' && mot[0].viec === null && mot[0].kieu === 'co-lich', JSON.stringify(mot));
    // S vắng, ba kỹ năng còn lại xong cùng tuần → hai chip: `L R W · W4 SEP` (xong) + `S · vắng · W4 SEP`
    const hai = g(xongKn('2026-09-21', { speaking: { trangThai: 'vang', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', sit: 'absent' } }));
    assert(hai.length === 2 && hai[0].ten === 'L R W' && hai[0].kieu === 'xong' && hai[1].ten === 'S' && hai[1].viec === 'vắng' && hai[1].kieu === 'con-viec', JSON.stringify(hai));
    // W trễ, còn lại xong cùng tuần: nhóm trễ tách riêng; chữ `trễ`
    const tre = g(xongKn('2026-09-21', { writing: { trangThai: 'da-xep', tuan: TUAN.qua, tuanKetThuc: '2026-09-27', hanCham: '2026-09-30' } }));
    assert(tre.length === 2 && tre[1].ten === 'W' && tre[1].viec === 'trễ' && tre[1].kieu === 'tre-cham', JSON.stringify(tre));
    // Tách tuần (cùng trạng thái có lịch): S sang tuần khác → hai nhóm, mỗi nhóm một tuần
    const tuanKhac = g(bonKn('da-xep', TUAN.xa, { speaking: { tuan: TUAN.toi, tuanKetThuc: '2026-10-18' } }));
    assert(tuanKhac.length === 2 && tuanKhac[0].ten === 'L R W' && tuanKhac[0].tuan === 'W5 OCT' && tuanKhac[1].ten === 'S' && tuanKhac[1].tuan === 'W3 OCT', JSON.stringify(tuanKhac));
    // Xong hết (kể cả kỹ năng "không yêu cầu" bỏ đi): MỘT nhóm xanh, tuần muộn nhất, không chữ việc
    const xong = g(xongKn('2026-09-14', { speaking: { tuan: '2026-09-21' }, writing: { trangThai: 'khong-yeu-cau', batBuoc: false, tuan: null } }));
    assert(xong.length === 1 && xong[0].ten === 'L R S' && xong[0].kieu === 'xong' && xong[0].tuan === 'W4 SEP' && xong[0].viec === null, JSON.stringify(xong));
    // Chưa xếp: chip `chưa xếp` (không tuần), MT cũ chưa điểm: `chờ` (tím, C2)
    const chua = g(bonKn('chua-xep', null));
    assert(chua.length === 1 && chua[0].kieu === 'chua-lich' && chua[0].tuan === null, JSON.stringify(chua));
    const het = { tuanKetThuc: '2026-10-04', hanCham: null };
    const cho = g(bonKn('da-xep', TUAN.vua, { listening: het, reading: het, writing: het, speaking: het }), true);
    assert(cho.length === 1 && cho[0].kieu === 'cho-cham-cu' && cho[0].viec === 'chờ', JSON.stringify(cho));
    assert(g({}).length === 0, 'không kỹ năng → không nhóm');
  });

  check('PR-OMT (C2, C3) · quét nguồn: OMt.tsx cỡ chip vuông 20px / 11,5px, không nhãn "cũ" (SV-NX-CASE N8: cả nơi khác), không hex, chấm đang thi', () => {
    const o = nguon('web/src/ui/OMt.tsx');
    assert(/h-5 /.test(o) && /text-\[12px\]/.test(o) && /rounded-md/.test(o), 'cỡ chip 20 / 12 (NEN-TYPO-MAU: tối thiểu 12) / góc 6');
    assert(!/NhanCu/.test(o), 'ô MT không còn nhãn cũ');
    assert(/r\.kieu === 'dang-thi' && <span aria-hidden/.test(o) && /r\.doc/.test(o), 'chấm đang thi + aria-label từ doc');
    assert(!/#[0-9a-fA-F]{3,8}\b/.test(o), 'OMt.tsx có mã hex');
    assert(/MT\{v\.so\}/.test(o), 'mẫu `MT2 · tuần` (có chữ MT)');
    for (const f of ['web/src/modules/cham/LuoiFT.tsx', 'web/src/modules/cham/MotKyNang.tsx', 'web/src/modules/classes/BangHoSoLop.tsx', 'web/src/modules/students/StudentDetailPage.tsx']) {
      assert(!/NhanCu/.test(nguon(f)), `${f}: SV-NX-CASE (N8) bỏ nhãn "cũ"`);
    }
  });

  check('PR-OMT (C1, C6) · quét nguồn: panel Xếp lịch MT toàn màn, cột Mock Test không xuống dòng ở sm+; lưới FT vẽ ChipDotFT (đợt có lịch) + OMt (chưa có đợt), cột hẹp', () => {
    const p = nguon('web/src/modules/test/keHoach/NganXepLichMt.tsx');
    assert(/<KhungPanel tieuDe=\{t\('Xếp lịch Mock Test'\)\} rong="toan"/.test(p), 'panel rong="toan"');
    assert(/sm:flex-nowrap/.test(p) && /sm:w-\[300px\]/.test(p), 'Mock Test nowrap, cột Sẽ xếp 300px');
    const l = nguon('web/src/modules/test/keHoach/LuoiKeHoach.tsx');
    assert(/<ODotGon\b/.test(l) && /dot\.attemptId !== null/.test(l), 'lưới: ODotGon cho đợt đã có (KHT-GON)');
    assert(/loai === 'ft' \? 190 : 220/.test(l), 'cột đợt FT 190 (U05 mockup V11)');
    const c = nguon('web/src/modules/test/keHoach/ChipKyNang.tsx');
    assert(/export function ODotGon\b/.test(c) && /o-kh-tre/.test(c) && /o-kh-dang/.test(c) && !/#[0-9a-fA-F]{3,8}\b/.test(c), 'ODotGon: viền ô theo trạng thái (U05), màu token');
  });

}
