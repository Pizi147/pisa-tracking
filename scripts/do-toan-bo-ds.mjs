// TD-QUET (17/11): lập danh sách đo (vai thật × mọi GET) cho do-ban-chep.mjs — DUONG_DO (chỗ thay → id thật bản chép 12/11, chi nhánh CP) + GET chưa có trong DUONG_DO. Cách dùng: docs/superpowers/specs/2026-11-17-toc-do/do-toan-bo.md mục 1.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
const [dbPath, out] = process.argv.slice(2);
const { DUONG_DO } = await import(pathToFileURL('dist-server/server/src/tests/tocDoDuong.js').href);
const c = new DatabaseSync(dbPath, { readOnly: true });
const g = (sql, ...a) => { const r = c.prepare(sql).get(...a); return r ? Object.values(r)[0] : null; };
const al = (sql, ...a) => c.prepare(sql).all(...a).map((r) => Object.values(r)[0]);
const CN = 3, LOP_FT = 12, LOP_THUONG = 18, LOP_BE = 33, LOP_PET = 88, LOP_KT = 6, HV = 62;
const ID = {
  lopFT: LOP_FT, lopThuong: LOP_THUONG, lopBe: LOP_BE, lopPet: LOP_PET, lopKetThuc: LOP_KT, hv: HV, cn: CN, gv: 29,
  case: g(`SELECT id FROM sos_cases WHERE student_id = ? ORDER BY id DESC LIMIT 1`, HV),
  loTrinhHv: g(`SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY id DESC LIMIT 1`, HV),
  luotHv: g(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? ORDER BY id LIMIT 1`, HV, LOP_FT),
  luotThuong: g(`SELECT id FROM assessment_attempts WHERE class_id = ? AND kind = 'progress' AND status != 'cancelled' ORDER BY id LIMIT 1`, LOP_THUONG),
  loTrinhDong: g(`SELECT b.cycle_id FROM ban_chup_lo_trinh b JOIN students s ON s.id = b.student_id WHERE s.branch_id = ? ORDER BY b.cycle_id DESC LIMIT 1`, CN),
  loTrinhThi: g(`SELECT c.id FROM learning_cycles c JOIN students s ON s.id = c.student_id WHERE s.branch_id = ? AND c.route IS NOT NULL AND c.exam_date IS NOT NULL ORDER BY c.id DESC LIMIT 1`, CN),
  lenhBg: g(`SELECT l.id FROM lenh_chuyen_lop l JOIN classes c ON c.id = l.lop_nguon_id WHERE c.branch_id = ? AND l.xac_nhan_luc IS NOT NULL AND l.trang_thai != 'huy' AND l.huong != 'dung_hoc' ORDER BY l.id DESC LIMIT 1`, CN),
  bgGv: g(`SELECT b.id FROM ban_giao_gv b JOIN classes c ON c.id = b.class_id WHERE c.branch_id = ? ORDER BY b.id DESC LIMIT 1`, CN) ?? g(`SELECT id FROM ban_giao_gv ORDER BY id DESC LIMIT 1`),
  ycPa: g(`SELECT id FROM yeu_cau_duyet WHERE doi_tuong_loai = 'intervention' AND chi_nhanh_id = ? ORDER BY id DESC LIMIT 1`, CN),
  paTutor: g(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id JOIN students s ON s.id = sc.student_id WHERE s.branch_id = ? AND iv.kind = 'tutor' ORDER BY iv.id DESC LIMIT 1`, CN),
  paLuoi: al(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active' AND e.class_id = ? WHERE iv.status IN ('planned','started') ORDER BY iv.id LIMIT 20`, LOP_FT).join(','),
  sos23: al(`SELECT DISTINCT sc.student_id FROM sos_cases sc JOIN students s ON s.id = sc.student_id WHERE s.branch_id = ? AND sc.status != 'closed' ORDER BY 1 LIMIT 30`, CN).join(','),
};
const thay = (u) => u.replace(/\{([a-zA-Z0-9]+)\}/g, (m, k) => (k in ID ? String(ID[k]) : m));
/* vai DUONG_DO → tài khoản thật chi nhánh CP (3). QL có hai: 1 CN (59) + 5 CN (33). GV Speaking (43) đi theo GVBM. */
const NGUOI = { QL: [['QL1', 59], ['QL5', 33]], GVCN: [['GVCN', 29]], GVBM: [['GVBM', 27], ['GVS', 43]], GVCN_THUONG: [['GVCN_TH', 30]],
  QT: [['QT', 6]], ADMIN: [['ADMIN', 75]], TVV: [['TVV', 68]], CX: [['CX', 72]] };
const theoNguoi = new Map();
const them = (ten, uid, url) => { const k = `${ten}|${uid}`; if (!theoNguoi.has(k)) theoNguoi.set(k, new Set()); theoNguoi.get(k).add(url); };
for (const d of DUONG_DO) for (const v of d.vai) for (const [ten, uid] of NGUOI[v] ?? []) them(ten, uid, thay(d.url));   // vai mới chưa có tài khoản đo (Head, BPXL…): bỏ qua
/* GET chưa có trong DUONG_DO — tham số như web gọi. Đo bằng mọi vai (403 vẫn ghi). */
const vl = g(`SELECT id FROM violations WHERE student_id = ? ORDER BY id DESC LIMIT 1`, HV) ?? g(`SELECT v.id FROM violations v JOIN students s ON s.id = v.student_id WHERE s.branch_id = ? ORDER BY v.id DESC LIMIT 1`, CN);
const dm = g(`SELECT id FROM discipline_measures ORDER BY id DESC LIMIT 1`);
const fu = g(`SELECT f.id FROM case_followups f JOIN sos_cases sc ON sc.id = f.case_id JOIN students s ON s.id = sc.student_id WHERE s.branch_id = ? ORDER BY f.id DESC LIMIT 1`, CN);
const yb = g(`SELECT id FROM y_thuc_khai_bac ORDER BY id DESC LIMIT 1`);
const mt = g(`SELECT id FROM tasks ORDER BY id DESC LIMIT 1`);
const att = g(`SELECT id FROM attachments ORDER BY id DESC LIMIT 1`);
const THEM = ['/api/health', '/demo/accounts', '/demo/config', '/ref/period-window', '/ref/people', '/ref/users', '/ref/teachers', `/ref/teachers?branchId=${CN}`,
  `/attempts?studentId=${HV}`, `/attempts/${ID.luotHv}`, '/meeting/tutor-rollup?periodId=51', `/classes/${LOP_FT}/issue-board/needs-evaluation?category=academic`,
  `/attachments?ownerType=sos_case&ownerId=${ID.case}`, `/attachments/${att}/download`, `/students/${HV}/violations`, `/violations/similar?studentId=${HV}&category=hoc_tap`,
  `/violations/${vl}`, `/y-thuc/xu-ly/${dm}`, `/y-thuc/bao-ph/${yb}`, `/regular/classes/${LOP_THUONG}/sheet`, '/ref/programmes', `/students/${HV}/cycles`,
  `/cycles/${ID.loTrinhHv}/han-sau-thi`, `/cycles/${ID.loTrinhHv}/lo-trinh-moi/xem-truoc`, `/classes/${LOP_FT}/xet-lai`, '/tim/giao-vien?q=ng',
  `/followups/${fu}/sua`, `/students/${HV}/case-topics`, `/students/${HV}/handover`, `/students/${HV}/quay-lai`, `/mgmt-tasks/${mt}`,
  '/admin/permissions/matrix', '/auth/branches', '/auth/info', '/me/profile', `/admin/accounts/29/xoa`, '/ref/routes', '/admin/routes',
  '/admin/programmes', '/admin/chi-nhanh', '/ref/bang-quy-doi', '/admin/bang-quy-doi'];
for (const v of Object.values(NGUOI)) for (const [ten, uid] of v) for (const u of THEM) them(ten, uid, u);
const GOC = { QL1: 'manager', QL5: 'manager', QT: 'system_admin', ADMIN: 'office_admin', TVV: 'consultant', CX: 'cx' };
const ds = [...theoNguoi].map(([k, urls]) => { const [ten, uid] = k.split('|'); return { ten, user: Number(uid), ...(GOC[ten] ? { goc: GOC[ten] } : {}), urls: [...urls] }; });
fs.writeFileSync(out, JSON.stringify(ds, null, 1));
console.log(JSON.stringify(ID)); console.log(ds.map((d) => `${d.ten}:${d.urls.length}`).join(' '), '=', ds.reduce((s, d) => s + d.urls.length, 0));
