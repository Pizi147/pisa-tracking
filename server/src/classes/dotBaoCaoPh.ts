/**
 * BC-DOT-QL (chủ SP 06/11): QL / Admin quyết đợt Báo cáo PH nào cần báo cáo — mọi loại lớp (FT đợt tháng, lớp thường Progress / Final).
 *   · `bo`: "Không cần báo cáo đợt này" — đợt mất khỏi tab, việc Admin, "thiếu n em", Excel chi nhánh; bài đã viết GIỮ NGUYÊN (khôi phục là hiện lại);
 *   · `khoi-phuc`: xoá dòng bỏ (Hoàn tác của `bo`);
 *   · `them`: "+ Đợt báo cáo" bất chợt — tên ngắn tuỳ chọn, mở + hạn; bộ phần theo chương trình lớp; điểm tự điền = lượt gần nhất có điểm trước hạn (`diemGoc`);
 *   · `xoa` / `hoan-xoa`: xoá mềm đợt thêm (bài đã viết giữ, khôi phục được; Hoàn tác của `them` là `xoa`).
 * Áp một lớp hoặc nhiều lớp CÙNG chi nhánh một lần; máy chủ kiểm quyền từng lớp (`quyenBc(...).quyetDot`: QL · Quản trị · Admin, không TVV / GV).
 * Nhật ký mỗi lớp mỗi việc. Turso: ≈ 4 câu cho cả lô lớp (lớp, tuỳ chỉnh, tiến độ, ghi) + 1 nhật ký mỗi lớp (một câu).
 * ponytail: đợt thêm chỉ mở từ hôm nay trở về trước (đợt tương lai không hiện tới ngày mở — thêm khi QL cần hẹn trước).
 */
import { DS_JSON, db, theoLoJson, tx } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { type Principal } from '../permissions.ts';
import { writeAuditLo } from '../platform/audit.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, loi, nowIso, toInt } from '../util.ts';
import { classProgressMany } from './schedule.ts';
import { docLop, docTuyChinhDot, dotCuaLop, lopFt, quyenBc, type LopBc } from './baoCaoPh.ts';
import { boPhanBc, nhanDotBc } from '../../../shared/domain/index.ts';

const TOI_DA_LOP = 50;
const TEN_TOI_DA = 40;
export type ViecDotBc = 'bo' | 'khoi-phuc' | 'them' | 'xoa' | 'hoan-xoa';
const MA_DOT_TINH = /^(thang:\d{4}-\d{2}|(progress|final):\d{4}-\d{2}-\d{2})$/;

const dsSo = (v: unknown, toiDa: number): number[] => {
  const ds = [...new Set((Array.isArray(v) ? v : []).map(toInt).filter((n): n is number => !!n && n > 0))];
  if (!ds.length) throw badRequest('Chọn ít nhất một lớp');
  if (ds.length > toiDa) throw loi(400, 'Tối đa {n} lớp một lần', { n: toiDa });
  return ds;
};

/** Các lớp: người gọi có quyền quyết đợt ở TỪNG lớp, cùng chi nhánh (hộp "nhiều lớp" chỉ chọn trong một chi nhánh). */
function lopQuyen(p: Principal, ids: readonly number[]): LopBc[] {
  const lop = ids.map((id) => docLop(id));
  for (const c of lop) if (!quyenBc(p, c).quyetDot) throw forbidden('Chỉ Quản lý, Quản trị, Admin của chi nhánh quyết đợt báo cáo PH.');
  if (new Set(lop.map((c) => c.branch_id)).size > 1) throw badRequest('Chỉ chọn các lớp cùng một chi nhánh');
  return lop;
}

/** POST /bao-cao-ph/dot { viec, classIds | dotIds, ma?, ten?, mo?, han? }. */
export function doiDotBaoCaoPh(p: Principal, body: any) {
  const viec = body?.viec as ViecDotBc;
  if (!['bo', 'khoi-phuc', 'them', 'xoa', 'hoan-xoa'].includes(viec)) throw badRequest('Việc không hợp lệ');
  if (viec === 'xoa' || viec === 'hoan-xoa') return xoaDotThem(p, dsSo(body?.dotIds, 500), viec === 'xoa');
  const lop = lopQuyen(p, dsSo(body?.classIds, TOI_DA_LOP));
  const homNay = demoToday();
  const luc = nowIso();

  if (viec === 'khoi-phuc') {
    const ma = String(body?.ma ?? '');
    const co: number[] = [];
    theoLoJson(lop.map((c) => c.id), (json) => {
      for (const r of db().prepare(`SELECT class_id FROM bao_cao_ph_dot WHERE loai = 'bo' AND ma = ? AND class_id IN (${DS_JSON})`).all(ma, json) as any[]) co.push(r.class_id);
    });
    if (!co.length) throw badRequest('Đợt này đang được báo cáo');
    tx(() => {
      theoLoJson(co, (json) => db().prepare(`DELETE FROM bao_cao_ph_dot WHERE loai = 'bo' AND ma = ? AND class_id IN (${DS_JSON})`).run(ma, json));
      writeAuditLo(lop.filter((c) => co.includes(c.id)).map((c) => ({ actorUserId: p.userId, action: 'bao_cao_ph.dot_khoi_phuc', entityType: 'class', entityId: c.id,
        entityLabel: c.code, after: { dot: ma } })));
    });
    return { lopDoi: co, boQua: lop.length - co.length };
  }

  const tienDo = classProgressMany(lop.filter((c) => !lopFt(c)).map((c) => c.id));
  if (viec === 'bo') {
    const ma = String(body?.ma ?? '');
    if (!MA_DOT_TINH.test(ma)) throw badRequest('Đợt không hợp lệ');
    const tuyChinh = docTuyChinhDot(lop.map((c) => c.id));
    const ap = lop.flatMap((c) => { const d = dotCuaLop(c, homNay, tienDo, tuyChinh)?.ds.find((x) => x.ma === ma); return d ? [{ c, d }] : []; });
    if (!ap.length) throw badRequest('Đợt báo cáo không có ở lớp này');
    tx(() => {
      const ghi = db().prepare(`INSERT OR IGNORE INTO bao_cao_ph_dot (class_id, ma, loai, mo, han, nguoi, luc) VALUES (?, ?, 'bo', ?, ?, ?, ?)`);
      for (const { c, d } of ap) ghi.run(c.id, ma, d.mo, d.han, p.userId, luc);
      writeAuditLo(ap.map(({ c, d }) => ({ actorUserId: p.userId, action: 'bao_cao_ph.dot_bo', entityType: 'class', entityId: c.id, entityLabel: c.code,
        after: { dot: ma, nhan: nhanDotBc(d, homNay) } })));
    });
    return { lopDoi: ap.map((x) => x.c.id), boQua: lop.length - ap.length };
  }

  /* them */
  const mo = body?.mo, han = body?.han;
  if (!isIsoDate(mo) || !isIsoDate(han)) throw badRequest('Chọn ngày mở và hạn của đợt');
  if (mo > homNay) throw badRequest('Đợt mở từ hôm nay trở về trước');
  if (han < mo) throw badRequest('Hạn phải sau hoặc cùng ngày mở');
  const ten = chuTuDo(body?.ten, 'Tên đợt', TEN_TOI_DA);
  const ap = lop.filter((c) => boPhanBc(c.programme_code ?? c.kind));
  if (!ap.length) throw badRequest('Chương trình của lớp chưa có mẫu báo cáo PH');
  const dotIds: number[] = [];
  tx(() => {
    const ghi = db().prepare(`INSERT INTO bao_cao_ph_dot (class_id, loai, ten, mo, han, nguoi, luc) VALUES (?, 'them', ?, ?, ?, ?, ?)`);
    for (const c of ap) dotIds.push(Number(ghi.run(c.id, ten, mo, han, p.userId, luc).lastInsertRowid));
    writeAuditLo(ap.map((c, i) => ({ actorUserId: p.userId, action: 'bao_cao_ph.dot_them', entityType: 'class', entityId: c.id, entityLabel: c.code,
      after: { dot: `them:${dotIds[i]}`, ten, mo, han } })));
  });
  return { lopDoi: ap.map((c) => c.id), dotIds, ma: ap.map((c, i) => ({ classId: c.id, ma: `them:${dotIds[i]}` })), boQua: lop.length - ap.length };
}

/** Xoá mềm / khôi phục đợt thêm: bài đã viết (`bao_cao_ph`) không bị đụng. */
function xoaDotThem(p: Principal, dotIds: number[], xoa: boolean) {
  const hang: any[] = [];
  theoLoJson(dotIds, (json) => hang.push(...db().prepare(`SELECT id, class_id, ten, mo, han FROM bao_cao_ph_dot WHERE loai = 'them' AND id IN (${DS_JSON})`).all(json)));
  if (!hang.length) throw badRequest('Không tìm thấy đợt');
  const lop = lopQuyen(p, [...new Set(hang.map((h) => h.class_id as number))]);
  const ma = new Map(lop.map((c) => [c.id, c]));
  tx(() => {
    const luc = xoa ? nowIso() : null;
    theoLoJson(hang.map((h) => h.id as number), (json) => db().prepare(`UPDATE bao_cao_ph_dot SET xoa_luc = ? WHERE id IN (${DS_JSON})`).run(luc, json));
    writeAuditLo(hang.map((h) => ({ actorUserId: p.userId, action: xoa ? 'bao_cao_ph.dot_xoa' : 'bao_cao_ph.dot_hoan_xoa', entityType: 'class', entityId: h.class_id,
      entityLabel: ma.get(h.class_id)!.code, after: { dot: `them:${h.id}`, ten: h.ten } })));
  });
  return { lopDoi: [...ma.keys()] };
}
