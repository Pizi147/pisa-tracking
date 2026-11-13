/**
 * BC-DOT-QL (chủ SP 06/11): QL / Admin quyết đợt Báo cáo PH nào cần báo cáo — mọi loại lớp (FT đợt tháng, lớp thường Progress / Final).
 *   · `bo`: "Không cần báo cáo đợt này" — đợt mất khỏi tab, việc Admin, "thiếu n em", Excel chi nhánh; bài đã viết GIỮ NGUYÊN (khôi phục là hiện lại);
 *   · `khoi-phuc`: xoá dòng bỏ (Hoàn tác của `bo`);
 *   · `them`: "+ Đợt báo cáo" bất chợt — tên ngắn tuỳ chọn, mở + hạn; bộ phần theo chương trình lớp; điểm tự điền = lượt gần nhất có điểm trước hạn (`diemGoc`);
 *   · `xoa` / `hoan-xoa`: xoá mềm đợt thêm (bài đã viết giữ, khôi phục được; Hoàn tác của `them` là `xoa`);
 *   · `sua` (LG-2): đổi tên / ngày mở / hạn MỘT đợt thêm (Hoàn tác = `sua` về giá trị cũ). Mã đợt (`them:{id}`) không đổi → bài đã viết giữ.
 * Áp một lớp hoặc nhiều lớp CÙNG chi nhánh một lần; máy chủ kiểm quyền từng lớp (`quyenBc(...).quyetDot`: QL · Quản trị · Admin, không TVV / GV).
 * Nhật ký mỗi lớp mỗi việc. Turso: ≈ 4 câu cho cả lô lớp (lớp, tuỳ chỉnh, tiến độ, ghi) + 1 nhật ký mỗi lớp (một câu).
 * LG-2 (chủ SP 14/11): ngày mở được ở tương lai — trước ngày đó đợt là "sắp mở" (`dsDotLop().sapMo`): chưa viết, chưa chip / việc; tới ngày tự mở.
 */
import { DS_JSON, db, theoLoJson, tx } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { type Principal } from '../permissions.ts';
import { writeAuditLo } from '../platform/audit.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, loi, nowIso, toInt } from '../util.ts';
import { classProgressMany } from './schedule.ts';
import { docLop, docTuyChinhDot, dotCuaLop, quyenBc, type LopBc } from './baoCaoPh.ts';
import { boPhanBc, nhanDotBc } from '../../../shared/domain/index.ts';

const TOI_DA_LOP = 50;
const TEN_TOI_DA = 40;
export type ViecDotBc = 'bo' | 'khoi-phuc' | 'them' | 'xoa' | 'hoan-xoa' | 'sua';
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

/** Ngày mở + hạn của đợt thêm (`them`, `sua`): ngày thật, hạn ≥ ngày mở. */
function ngayDot(body: any): { mo: string; han: string } {
  const mo = body?.mo, han = body?.han;
  if (!isIsoDate(mo) || !isIsoDate(han)) throw badRequest('Chọn ngày mở và hạn của đợt');
  if (han < mo) throw badRequest('Hạn phải sau hoặc cùng ngày mở');
  return { mo, han };
}

/** POST /bao-cao-ph/dot { viec, classIds | dotIds | dotId, ma?, ten?, mo?, han? }. */
export function doiDotBaoCaoPh(p: Principal, body: any) {
  const viec = body?.viec as ViecDotBc;
  if (!['bo', 'khoi-phuc', 'them', 'xoa', 'hoan-xoa', 'sua'].includes(viec)) throw badRequest('Việc không hợp lệ');
  if (viec === 'xoa' || viec === 'hoan-xoa') return xoaDotThem(p, dsSo(body?.dotIds, 500), viec === 'xoa');
  if (viec === 'sua') return suaDotThem(p, body);
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

  const tienDo = classProgressMany(lop.map((c) => c.id));   // FT cũng cần: tuần khai giảng (BC-PH-MOC)
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
  const { mo, han } = ngayDot(body);
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

/** LG-2: sửa tên / ngày mở / hạn một đợt thêm chưa xoá (đợt sắp mở hay đã mở). Một câu đọc + một ghi + một nhật ký. */
function suaDotThem(p: Principal, body: any) {
  const id = toInt(body?.dotId);
  const h = id ? db().prepare(`SELECT id, class_id, ten, mo, han FROM bao_cao_ph_dot WHERE id = ? AND loai = 'them' AND xoa_luc IS NULL`).get(id) as any : null;
  if (!h) throw badRequest('Không tìm thấy đợt');
  const [c] = lopQuyen(p, [h.class_id]);
  const { mo, han } = ngayDot(body);
  const ten = chuTuDo(body?.ten, 'Tên đợt', TEN_TOI_DA);
  tx(() => {
    db().prepare(`UPDATE bao_cao_ph_dot SET ten = ?, mo = ?, han = ? WHERE id = ?`).run(ten, mo, han, h.id);
    writeAuditLo([{ actorUserId: p.userId, action: 'bao_cao_ph.dot_sua', entityType: 'class', entityId: c.id, entityLabel: c.code,
      before: { dot: `them:${h.id}`, ten: h.ten, mo: h.mo, han: h.han }, after: { dot: `them:${h.id}`, ten, mo, han } }]);
  });
  return { lopDoi: [c.id], truoc: { ten: h.ten as string | null, mo: h.mo as string, han: h.han as string } };
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
