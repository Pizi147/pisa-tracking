/** PHÉP KIỂM PR-KIEM-DU-LIEU-MT — `kiem-du-lieu-mt` thấy đúng 1 ca mỗi loại trên DB demo, không báo nhầm em sạch, và CHỈ ĐỌC. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

export async function runPrKiemDuLieuMtTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const audit: any = await import('../platform/audit.ts');
  const { kiemDuLieuMt } = await import('../ops/kiemDuLieuMt.ts');
  console.log('\nPR-KIEM-DU-LIEU-MT · Kiểm dữ liệu Mock Test (chỉ đọc)');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n));
  let dem = 0;
  /** Em mới ở MB FT 101: MT1 (T+1), MT2 (T+4), MT3 (T+8) — lịch nhất quán, lượt và kỹ năng cùng tuần. */
  const emMoi = () => {
    const r = intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: `KDLMT Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: 'hv@demo.test' }] });
    const ds = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY attempt_no`).all(r.studentIds[0]) as any[];
    const m = ds.map((x) => x.id as number);
    [1, 4, 8].forEach((w, i) => datTuan(m[i], w));
    return { m1: m[0], m2: m[1], m3: m[2] };
  };
  const datTuan = (id: number, w: number) => {
    skillSch.ensureSkillRows(id);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(w).id, id);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual' WHERE id = ?`).run(tuan(w).id, id);
  };
  const huy = (id: number, luc: string) => conn.prepare(
    `INSERT INTO ket_qua_huy (attempt_id, vuot_boi_attempt_id, diem_json, lich_json, so_diem, ly_do, huy_luc) VALUES (?, NULL, '[]', '[]', 0, 'x', ?)`).run(id, luc);

  check('KDLMT · mỗi loại 1 ca dựng trên DB demo được phát hiện đúng, em sạch không bị báo, tìm hai lần ra cùng kết quả', () => {
    const truoc = new Set(kiemDuLieuMt(conn).map((d) => `${d.nhom}:${d.luotId}`));   // DB demo đã có ca lệch từ các phép kiểm trước — chỉ xét phần MỚI
    const sach = emMoi();
    const xac = emMoi();
    conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ?`).run(xac.m2);                     // loại 1
    const dao = emMoi(); datTuan(dao.m2, 0);                                                                                  // loại 2 (ngược: MT2 T+0 < MT1 T+1)
    const trung = emMoi(); datTuan(trung.m2, 1);                                                                              // loại 2 (trùng tuần MT1)
    const moCoi = emMoi();                                                                                                    // loại 3
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancelled_at = ? WHERE id = ?`).run(`${TODAY}T08:00:00.000Z`, moCoi.m2);
    huy(moCoi.m2, `${TODAY}T08:00:00.000Z`);
    huy(moCoi.m3, '2000-01-01T00:00:00.000Z');                                                                                // lượt tạo sau lúc huỷ
    const mat = emMoi();                                                                                                      // loại 4
    audit.writeAudit({ actorUserId: P.mbManager.userId, action: 'score.huy_vuot', entityType: 'assessment_attempt', entityId: mat.m2, entityLabel: 'listening', before: {}, after: {} });
    const lech = emMoi();                                                                                                     // loại 5
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?`).run(tuan(2).id, lech.m2);

    const tat = kiemDuLieuMt(conn);
    const ra = tat.filter((d) => !truoc.has(`${d.nhom}:${d.luotId}`));
    const ids = (n: number) => ra.filter((d) => d.nhom === n).map((d) => d.luotId);
    assert(ids(1).includes(xac.m2) && ids(1).length === 1, `loại 1: ${ids(1)}`);
    assert(ids(2).includes(dao.m2) && ids(2).includes(trung.m2) && ids(2).length === 2, `loại 2: ${ids(2)}`);
    assert(/Trùng tuần/.test(ra.find((d) => d.luotId === trung.m2)!.vanDe) && /Tuần ngược/.test(ra.find((d) => d.luotId === dao.m2)!.vanDe), 'nhãn trùng / ngược');
    assert(ids(3).includes(moCoi.m2) && ids(3).includes(moCoi.m3) && ids(3).length === 2, `loại 3: ${ids(3)}`);
    assert(ids(4).length === 1 && ids(4)[0] === mat.m2, `loại 4: ${ids(4)}`);
    assert(ids(5).includes(lech.m2) && !ids(5).includes(xac.m2), `loại 5: ${ids(5)}`);
    const bi = new Set(ra.map((d) => d.luotId));
    assert(![sach.m1, sach.m2, sach.m3].some((x) => bi.has(x)), 'em sạch bị báo nhầm');
    assert(ra.every((d) => d.hocVien && d.ma && d.lop && d.mt), 'dòng thiếu tên / mã / lớp / MT');
    assert(JSON.stringify(kiemDuLieuMt(conn)) === JSON.stringify(tat), 'hai lần chạy khác nhau');
  });

  check('KDLMT · kiemDuLieuMt.ts (bỏ chú thích) không có .run( / .exec( / INSERT / UPDATE / DELETE; package.json có lệnh', () => {
    const nguon = fs.readFileSync(path.join(ROOT, 'server/src/ops/kiemDuLieuMt.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const cam = ['.run(', '.exec(', 'INSERT', 'UPDATE', 'DELETE', 'PRAGMA'].filter((x) => nguon.includes(x));
    assert(!cam.length, `lệnh chỉ đọc có câu ghi: ${cam.join(', ')}`);
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    assert(/ops\/kiemDuLieuMt\.js$/.test(pkg.scripts?.['kiem-du-lieu-mt'] ?? ''), 'package.json thiếu kiem-du-lieu-mt');
  });
}
