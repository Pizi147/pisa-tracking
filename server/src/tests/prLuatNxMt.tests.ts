/**
 * PHÉP KIỂM LUAT-NX-MT (chủ SP 22/10, V5 `10-pta-ap-phan-hoi-cuoi.md` mục 7):
 *  1. S Ex không tính — chỉ hiện cạnh điểm S ở Hành trình;
 *  2. nhận xét MT không bắt buộc cứng: ô xong = có band, thiếu nhận xét / nhóm chỉ nhắc (không 400, không nợ / việc, dán Excel không lỗi dòng);
 *  3. xếp MT nới lỏng: giữa các MT không chặn thứ tự (nhắc `sauMt`); giữ số MT liền mạch, MT0 trước MT1;
 *  4. ghi chú vắng dưới ô điểm: "vắng W3 SEP" (tuần cũ) — một hàm `chuDoiVang`.
 * Mỗi ca cuộn lại (`thu`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const nguon = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrLuatNxMtTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const no: any = await import('../worklist/scoreDebt.ts');
  const sEx: any = await import('../cham/sExpert.ts');
  const ht: any = await import('../students/hanhTrinh.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLUAT-NX-MT · nhận xét chỉ nhắc · xếp MT nới lỏng · ghi chú vắng · S Ex ở Hành trình');

  const QL = P.mbManager;
  const LOP = classId('MB FT 101');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
  const KN = ['listening', 'reading', 'writing', 'speaking'];
  const bonKyNang = (n: number) => KN.map((skill) => ({ skill, periodId: tuan(n).id }));
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  let dem = 0;
  /** Em mới ở MB FT 101: MT1 (T+w1), MT2 (T+4), MT3 (T+8), chưa điểm, lịch Quản lý chốt. */
  const emMoi = (w1 = 1) => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `LNM Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, `thêm em: ${JSON.stringify(r.failed)}`);
    const sid = r.studentIds[0] as number;
    const ds = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY attempt_no`).all(sid) as any[];
    [w1, 4, 8].forEach((w, i) => {
      skillSch.ensureSkillRows(ds[i].id);
      conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual' WHERE id = ?`).run(tuan(w).id, ds[i].id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(w).id, ds[i].id);
    });
    xoaNho();
    return { sid, m1: ds[0].id as number, m2: ds[1].id as number, m3: ds[2].id as number };
  };
  const o = (attemptId: number, skill: string) => svc.attemptDetail(QL, attemptId).cells.find((c: any) => c.skill === skill);

  // ---------------------------------------------------------------- luật 2: nhận xét chỉ nhắc
  check('LNM-2a · MT thường: lưu điểm KHÔNG nhận xét → lưu (không 400); ô xong = có band, chỉ nhắc "ghi-nhan-xet"; không nợ điểm', () => thu(() => {
    const a = emMoi(0);
    svc.saveScore(QL, a.m1, 'listening', { rawScore: 30 }, TODAY);
    xoaNho();
    const l = o(a.m1, 'listening');
    assert(l.band !== null && l.xong === true && l.thieuNhanXet === 'ghi-nhan-xet', JSON.stringify({ band: l.band, xong: l.xong, t: l.thieuNhanXet }));
    const no1 = no.scoreDebtCells(P.admin, TODAY, null).filter((c: any) => c.attemptId === a.m1);
    assert(!no1.some((c: any) => c.skill === 'listening') && no1.some((c: any) => c.skill === 'reading'), 'L có band không nợ; R chưa điểm vẫn nợ');
    /* Ghi nhận xét đủ → hết nhắc; câu nhắc là chữ chủ SP chốt. */
    svc.saveScore(QL, a.m1, 'listening', { nhanXet: 'Nghe Part 3 còn chậm, điền bảng tốt.' }, TODAY);
    xoaNho();
    assert(o(a.m1, 'listening').thieuNhanXet === null, 'đủ nhận xét → hết nhắc');
    assert(d.CAU_THIEU_NHAN_XET['ghi-nhan-xet'] === 'Nên có nhận xét — dùng làm mô tả vấn đề trên Case', d.CAU_THIEU_NHAN_XET['ghi-nhan-xet']);
  }));

  check('LNM-2b · dưới kỳ vọng thiếu nhóm nguyên nhân → lưu; band giữ, chỉ nhắc "chon-nhom"; nhận xét quá dài vẫn 400 (giữ kiểm độ dài)', () => thu(() => {
    const a = emMoi(0);
    svc.saveScore(QL, a.m1, 'reading', { band: 3, nhanXet: 'Bỏ trống 6 câu cuối Passage 3.' }, TODAY);
    xoaNho();
    const r = o(a.m1, 'reading');
    assert(r.band === 3 && r.xong && r.thieuNhanXet === 'chon-nhom', JSON.stringify({ band: r.band, t: r.thieuNhanXet }));
    let loi: any = null;
    try { svc.saveScore(QL, a.m1, 'reading', { nhanXet: 'x'.repeat(d.NHAN_XET_TOI_DA + 1) }, TODAY); } catch (e) { loi = e; }
    assert(loi?.status === 400, `dài quá phải 400: ${loi?.status}`);
  }));

  check('LNM-2c · SQL "ô xong" = có band (O_FT_XONG_SQL): cờ o_cho_tu hết khi đủ band dù không nhận xét', () => thu(() => {
    const a = emMoi(0);
    for (const k of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band) VALUES (?, ?, 6)').run(a.m1, k);
    }
    const co: any = conn.prepare(`SELECT COUNT(*) n FROM assessment_scores sc JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE sc.attempt_id = ? AND ${d.O_FT_XONG_SQL('sc', 'a')}`).get(a.m1);
    assert(co.n === 5, `5 ô có band phải xong: ${co.n}`);
  }));

  // ---------------------------------------------------------------- luật 3: xếp MT nới lỏng
  check('LNM-3a · dời một kỹ năng MT2 sang SAU tuần đầu MT3 → lưu được; MT3 giữ lịch; ô Kế hoạch Test MT2 nhắc sauMt = 3, kỹ năng khác không', () => thu(() => {
    const a = emMoi();
    const t3 = conn.prepare('SELECT planned_period_id p FROM attempt_skills WHERE attempt_id = ? AND skill = ?').get(a.m3, 'listening') as any;
    keHoach.luuDot(QL, { attemptId: a.m2, kyNang: [{ skill: 'writing', periodId: tuan(9).id }] });
    xoaNho();
    const hang = keHoach.luoiFT(QL, LOP).hang.find((h: any) => h.studentId === a.sid);
    const kn2 = hang.dot[2].kn;
    assert(kn2.writing.sauMt === 3 && kn2.listening.sauMt === undefined, JSON.stringify({ w: kn2.writing.sauMt, l: kn2.listening.sauMt }));
    assert(!Object.values(hang.dot[3].kn).some((x: any) => x?.sauMt), 'MT cuối không có MT sau');
    const t3Sau = conn.prepare('SELECT planned_period_id p FROM attempt_skills WHERE attempt_id = ? AND skill = ?').get(a.m3, 'listening') as any;
    assert(t3Sau.p === t3.p, 'MT3 bị đổi lịch');
  }));

  check('LNM-3b · MT trùng tuần MT khác (luuDot) + MT4 mới trùng tuần MT3 (xepMoi) → lưu được; giữ luật thật: số MT liền mạch, MT0 trước MT1', () => thu(() => {
    const a = emMoi();
    keHoach.luuDot(QL, { attemptId: a.m3, kyNang: bonKyNang(4) });   // MT3 trùng tuần MT2
    const w8 = Object.fromEntries(KN.map((k) => [k, tuan(8).id]));
    const mt4 = keHoach.xepMoi(QL, { studentId: a.sid, attemptNo: 4, tuan: w8, force: true });
    assert(mt4?.id, 'MT4 phải tạo được');
    const ds = [1, 2, 3].map((n) => ({ attempt_no: n, status: 'planned', coDiem: false }));
    assert(!!d.kiemSoMtMoi(ds, 5) && d.kiemSoMtMoi(ds, 4) === null, 'số MT liền mạch');
    assert(!!d.kiemTuanMt0({ tuanMoi: '2026-10-12', tuanMuonNhat: null, tuanMt1: '2026-10-05' }), 'MT0 sau MT1 phải chặn');
  }));

  // ---------------------------------------------------------------- luật 4: ghi chú vắng
  check('LNM-4 · chuDoiVang: "vắng" + tuần CŨ (mã tuần / ngày ISO / mã có năm), không dời → null; ô điểm ba màn dùng chung hàm', () => {
    assert(d.chuDoiVang('W3 SEP', '2026-10-01') === 'vắng W3 SEP', d.chuDoiVang('W3 SEP', '2026-10-01'));
    assert(d.chuDoiVang('2026-09-14', '2026-10-01') === 'vắng W3 SEP' && d.chuDoiVang('W3 SEP 2026', '2026-10-01') === 'vắng W3 SEP', 'ISO / mã có năm');
    assert(d.chuDoiVang(null, '2026-10-01') === null, 'không dời');
    for (const f of ['web/src/modules/test/keHoach/ChipKyNang.tsx', 'web/src/modules/fasttrack/HopNhapDiem.tsx', 'web/src/modules/fasttrack/ODiemLon.tsx']) {
      assert(/chuDoiVang\(/.test(nguon(f)), `${f} chưa dùng chuDoiVang`);
    }
  });

  // ---------------------------------------------------------------- luật 1: S Ex
  check('LNM-1 · S Ex đã chấm hiện cạnh S ở Hành trình (hộp Speaking `sEx`), không vào chuỗi điểm S; hộp khác không có', () => thu(() => {
    const a = emMoi(0);
    sEx.themSEx(QL, { studentId: a.sid, tuan: tuanNay, diem: 7 });
    xoaNho();
    const h = ht.hanhTrinhHocVien(QL, a.sid, null);
    const s = h.hop.find((x: any) => x.kyNang === 'speaking');
    assert(s && JSON.stringify(s.sEx?.map((x: any) => x.diem)) === '[7]', JSON.stringify(s?.sEx));
    assert(!s.diem.some((m: any) => m.gt === 7 && !m.attemptId), 'S Ex lọt vào chuỗi điểm S');
    assert(h.hop.filter((x: any) => x.kyNang !== 'speaking').every((x: any) => !x.sEx), 'hộp khác có sEx');
  }));
}
