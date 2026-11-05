/**
 * BÀN GIAO ĐỔI GV (PR-B, đặc tả 2026-10-30-phan-cong-gv-design.md mục 2.7, 2b). Lần lưu phân công (`luuPhanCong`) có cặp A → B (ô tích "Tạo việc
 * bàn giao") → việc của A: mỗi em một góp ý mỗi cột (kỹ năng / GVCN), hạn 5 ngày từ khi tạo. Cùng (lớp, A, hiệu lực) đang mở → MỘT việc nhiều cột.
 * Đổi tiếp trước khi A xong (B → C) → cột đổi người nhận; về lại A → cột huỷ. A đã nghỉ → GVCN lớp viết; chính GVCN nghỉ → QL chi nhánh.
 * Ba bảng riêng (`migrate/prBanGiaoGv.ts`) — không đụng `ban_giao_mon` của chuyển lớp.
 */
import { DS_JSON, db, theoLoJson, tx } from '../db.ts';
import {
  PERMISSIONS, hanBanGiaoGv, laCapBanGiao, nguoiVietBanGiao, nhanCotBg, tenMon,
  type PhieuBanGiaoGvDto, type SlotPhanCong, type TuDien,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { can, type Principal } from '../permissions.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import type { GhiDao } from '../platform/ghiDao.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { badRequest, chuTuDo, conflict, forbidden, loi, notFound, nowIso } from '../util.ts';
import { tuDienTheoLo } from './banGiao.ts';
import { coTheRaLenh } from './quyenChuyenLop.ts';
import { phanLoaiNguoi } from './phanCongGv.ts';

const inHang = (n: number) => Array.from({ length: n }, () => '?').join(',');

export type DoiBg = { id: number; khoa: string; nguoiCu: number | null; nguoiMoi: number | null; hieuLuc: string; taoBanGiao: boolean };

/** Hạn việc: 5 ngày tính cả ngày tạo; hiệu lực "Từ tuần" sau → tính từ hiệu lực (PTA 30/10: không quá hạn trước khi đổi người). */
const hanViec = (hieuLuc: string, h = demoToday()) => { return hanBanGiaoGv(hieuLuc > h ? hieuLuc : h); };

/** Việc hết cột đang mở → `huy` (góp ý đã viết giữ làm lịch sử). */
function dongViecHetCot(ids: readonly number[], g: GhiDao) {
  if (!ids.length) return;
  const dk = `id IN (${inHang(ids.length)}) AND trang_thai = 'mo' AND NOT EXISTS (SELECT 1 FROM ban_giao_gv_mon m WHERE m.ban_giao_id = ban_giao_gv.id AND m.trang_thai = 'mo')`;
  g.sua('ban_giao_gv', dk, ...ids);
  db().prepare(`UPDATE ban_giao_gv SET trang_thai = 'huy' WHERE ${dk}`).run(...ids);
}

/**
 * ĐỒNG BỘ VIỆC BÀN GIAO với các dòng đổi vừa chèn của MỘT lớp — gọi trong tx của `luuPhanCong`, sau khi chèn `doi_phan_cong`, trước khi áp.
 * `thay` = id lịch chờ vừa huỷ vì lần đổi sau (cùng ô). Mọi dòng sửa được `g` chụp (Hoàn tác); dòng thêm do nơi gọi theo dõi. Trả số việc mới.
 * ① cột trỏ lịch chờ vừa bị thay → theo lần đổi mới cùng ô của cùng GV cũ (A → C), không có thì huỷ.
 * ② người nhận của cột bị đổi tiếp NGAY (B → C) → cột đổi người nhận; B → A (về lại) hoặc B → Chưa có → cột huỷ.
 * ③ cặp A → B còn lại có ô tích → thêm cột vào việc đang mở (lớp, A, hiệu lực), không có thì tạo việc.
 */
export function dongBoViecBanGiao(p: Principal, o: { classId: number; ct: string | null; slotsTruoc: readonly SlotPhanCong[]; doi: DoiBg[]; thay?: readonly number[];
  duocXep?: ReadonlyMap<number, 'nghi' | 'ngoai-cn' | null>;
  /** Lưu nhiều lớp: ngày nghiệp vụ + cột / việc đang mở của lớp, đã đọc MỘT lần cho cả lô (`docBanGiaoLo`). */
  san?: { homNay: string; cot: readonly any[]; viecMo: readonly { id: number; nguoi_cu: number; hieu_luc: string }[] } }, g: GhiDao): number {
  const conn = db();
  const homNay = o.san?.homNay ?? demoToday();
  const cot = o.san?.cot ?? conn.prepare(
    `SELECT m.id, m.ban_giao_id, m.mon, m.nguoi_moi, m.doi_id, b.nguoi_cu AS bg_cu, b.hieu_luc AS bg_hl FROM ban_giao_gv_mon m JOIN ban_giao_gv b ON b.id = m.ban_giao_id
      WHERE b.class_id = ? AND b.trang_thai = 'mo' AND m.trang_thai = 'mo'`,
  ).all(o.classId) as any[];
  const daDung = new Set<number>();
  const viecCham = new Set<number>();
  const doiCot = (c: any, d: DoiBg | null) => {
    g.sua('ban_giao_gv_mon', 'id = ?', c.id);
    if (d) conn.prepare(`UPDATE ban_giao_gv_mon SET nguoi_moi = ?, doi_id = ? WHERE id = ?`).run(d.nguoiMoi, d.id, c.id);
    else conn.prepare(`UPDATE ban_giao_gv_mon SET trang_thai = 'huy' WHERE id = ?`).run(c.id);
    viecCham.add(c.ban_giao_id);
  };
  for (const c of cot) {
    if (o.thay?.includes(c.doi_id)) {
      const d = o.doi.find((x) => x.khoa === c.mon && x.nguoiCu === c.bg_cu);
      if (d) daDung.add(d.id);
      doiCot(c, d && laCapBanGiao(d) && d.taoBanGiao ? d : null);
      /* Lịch bị thay bằng lịch khác tuần → việc theo hiệu lực (và hạn) của lịch mới. */
      if (d && d.hieuLuc !== c.bg_hl) {
        g.sua('ban_giao_gv', 'id = ?', c.ban_giao_id);
        conn.prepare(`UPDATE ban_giao_gv SET hieu_luc = ?, han = ? WHERE id = ?`).run(d.hieuLuc, hanViec(d.hieuLuc, homNay), c.ban_giao_id);
      }
      continue;
    }
    /* ponytail: chỉ đổi tiếp NGAY mới đổi người nhận; B → C từ tuần sau giữ B tới khi áp (huỷ lịch đó không phải dò ngược cột). */
    const d = o.doi.find((x) => x.khoa === c.mon && x.nguoiCu === c.nguoi_moi && x.hieuLuc <= homNay);
    if (!d) continue;
    daDung.add(d.id);
    doiCot(c, d.nguoiMoi !== null && d.nguoiMoi !== c.bg_cu ? d : null);
  }
  dongViecHetCot([...viecCham], g);

  /* B vừa nhận lớp (cột đang mở trỏ B) không có gì để bàn giao — không tạo việc B → C. */
  const nhanCot = new Set(cot.map((c) => `${c.mon}|${c.nguoi_moi}`));
  const cap = o.doi.filter((d) => laCapBanGiao(d) && d.taoBanGiao && !daDung.has(d.id) && !nhanCot.has(`${d.khoa}|${d.nguoiCu}`));
  if (!cap.length) return 0;

  /* Ai viết: GV cũ đã nghỉ → GVCN (GVCN của bức tranh TRƯỚC lần lưu); người không có trong bản đồ ứng viên chi nhánh → phân loại một câu. */
  const gvcn = o.slotsTruoc.find((s) => s.isCore)?.userId ?? null;
  const ids = [...new Set([...cap.map((d) => d.nguoiCu!), ...(gvcn !== null ? [gvcn] : [])])];
  const phanLoai = phanLoaiNguoi(ids.filter((id) => !o.duocXep?.has(id)));
  const nghi = (id: number) => (o.duocXep?.has(id) ? o.duocXep.get(id) : phanLoai.get(id)?.loai) === 'nghi';

  const luc = nowIso();
  let moi = 0;
  const nhom = new Map<string, DoiBg[]>();
  for (const d of cap) nhom.set(`${d.nguoiCu}|${d.hieuLuc}`, [...(nhom.get(`${d.nguoiCu}|${d.hieuLuc}`) ?? []), d]);
  for (const ds of nhom.values()) {
    const { nguoiCu, hieuLuc } = ds[0];
    /* Việc đã đọc sẵn chỉ dùng được khi chưa có việc nào của lớp bị đóng (`dongViecHetCot`) trong lần này. */
    let bg = (o.san && !viecCham.size
      ? o.san.viecMo.filter((v) => v.nguoi_cu === nguoiCu && v.hieu_luc === hieuLuc).sort((a, b) => b.id - a.id)[0]
      : conn.prepare(`SELECT id FROM ban_giao_gv WHERE class_id = ? AND nguoi_cu = ? AND hieu_luc = ? AND trang_thai = 'mo' ORDER BY id DESC LIMIT 1`)
        .get(o.classId, nguoiCu, hieuLuc) as any)?.id as number | undefined;
    if (!bg) {
      const viet = nguoiVietBanGiao({ cuNghi: nghi(nguoiCu!), nguoiCu: nguoiCu!, gvcn, gvcnNghi: gvcn !== null && nghi(gvcn) });
      bg = Number(conn.prepare(
        `INSERT INTO ban_giao_gv (class_id, nguoi_cu, nguoi_lam, hieu_luc, han, trang_thai, tao_luc, tao_boi) VALUES (?,?,?,?,?, 'mo', ?, ?)`,
      ).run(o.classId, nguoiCu, viet.id, hieuLuc, hanViec(hieuLuc, homNay), luc, p.userId).lastInsertRowid);
      moi += 1;
    }
    for (const d of ds) {
      conn.prepare(`INSERT INTO ban_giao_gv_mon (ban_giao_id, mon, nguoi_moi, doi_id, trang_thai) VALUES (?,?,?,?, 'mo')`).run(bg, d.khoa, d.nguoiMoi, d.id);
    }
  }
  return moi;
}

/** Lưu nhiều lớp: cột đang mở + việc đang mở của các lớp — hai câu cho cả lô (thay vì hai câu mỗi lớp). */
export function docBanGiaoLo(classIds: readonly number[]) {
  const conn = db();
  const lop = inHang(classIds.length);
  const cot = new Map<number, any[]>(classIds.map((id) => [id, []]));
  const viecMo = new Map<number, { id: number; nguoi_cu: number; hieu_luc: string }[]>(classIds.map((id) => [id, []]));
  for (const r of conn.prepare(
    `SELECT m.id, m.ban_giao_id, m.mon, m.nguoi_moi, m.doi_id, b.nguoi_cu AS bg_cu, b.hieu_luc AS bg_hl, b.class_id FROM ban_giao_gv_mon m JOIN ban_giao_gv b ON b.id = m.ban_giao_id
      WHERE b.class_id IN (${lop}) AND b.trang_thai = 'mo' AND m.trang_thai = 'mo'`,
  ).all(...classIds) as any[]) cot.get(r.class_id)!.push(r);
  for (const r of conn.prepare(`SELECT id, class_id, nguoi_cu, hieu_luc FROM ban_giao_gv WHERE class_id IN (${lop}) AND trang_thai = 'mo'`).all(...classIds) as any[]) viecMo.get(r.class_id)!.push(r);
  return { cot, viecMo };
}

/** HUỶ LỊCH ĐỔI → cột trỏ các dòng đó huỷ, việc hết cột huỷ (Hoàn tác Huỷ lịch đổi mở lại — `g` chụp). */
export function huyViecTheoDoi(doiIds: readonly number[], g: GhiDao): void {
  if (!doiIds.length) return;
  const conn = db();
  const dk = `trang_thai = 'mo' AND doi_id IN (${inHang(doiIds.length)})`;
  const bg = [...new Set((conn.prepare(`SELECT ban_giao_id FROM ban_giao_gv_mon WHERE ${dk}`).all(...doiIds) as any[]).map((r) => r.ban_giao_id as number))];
  if (!bg.length) return;
  g.sua('ban_giao_gv_mon', dk, ...doiIds);
  conn.prepare(`UPDATE ban_giao_gv_mon SET trang_thai = 'huy' WHERE ${dk}`).run(...doiIds);
  dongViecHetCot(bg, g);
}

/** ĐỔI MỐC lịch chờ → việc trỏ các dòng đó đổi hiệu lực + hạn theo mốc mới. */
export function doiMocViecTheoDoi(doiIds: readonly number[], hieuLuc: string, g: GhiDao): void {
  if (!doiIds.length) return;
  const dk = `trang_thai = 'mo' AND id IN (SELECT ban_giao_id FROM ban_giao_gv_mon WHERE trang_thai = 'mo' AND doi_id IN (${inHang(doiIds.length)}))`;
  g.sua('ban_giao_gv', dk, ...doiIds);
  db().prepare(`UPDATE ban_giao_gv SET hieu_luc = ?, han = ? WHERE ${dk}`).run(hieuLuc, hanViec(hieuLuc), ...doiIds);
}

/**
 * Hoàn tác lần lưu phân công được không (phần việc bàn giao): chặn khi việc vừa tạo đã có góp ý, khi cột vừa THÊM vào việc có sẵn đã có góp ý
 * (cùng việc + cột), hoặc khi việc vừa tạo đã có cột của lần lưu sau trỏ vào (xoá việc sẽ gãy khoá ngoại). Không xoá chữ người khác vừa viết.
 */
export function hoanTacViecDuoc(bgIds: readonly number[], cotIds: readonly number[]): boolean {
  const conn = db();
  if (bgIds.length && conn.prepare(`SELECT 1 FROM ban_giao_gv_em WHERE ban_giao_id IN (${inHang(bgIds.length)}) LIMIT 1`).get(...bgIds)) return false;
  if (cotIds.length && conn.prepare(
    `SELECT 1 FROM ban_giao_gv_mon m JOIN ban_giao_gv_em e ON e.ban_giao_id = m.ban_giao_id AND e.mon = m.mon WHERE m.id IN (${inHang(cotIds.length)}) LIMIT 1`,
  ).get(...cotIds)) return false;
  return !bgIds.length || !conn.prepare(
    `SELECT 1 FROM ban_giao_gv_mon WHERE ban_giao_id IN (${inHang(bgIds.length)})${cotIds.length ? ` AND id NOT IN (${inHang(cotIds.length)})` : ''} LIMIT 1`,
  ).get(...bgIds, ...cotIds);
}

// ==================================================================== phiếu

function docViec(id: number): any {
  const b = db().prepare(
    `SELECT b.*, c.code, c.programme_code AS ct, c.branch_id, uc.full_name AS ten_cu, ux.full_name AS ten_xong
       FROM ban_giao_gv b JOIN classes c ON c.id = b.class_id JOIN users uc ON uc.id = b.nguoi_cu LEFT JOIN users ux ON ux.id = b.xong_boi WHERE b.id = ?`,
  ).get(id) as any;
  if (!b) throw notFound('Không tìm thấy việc bàn giao');
  return b;
}

/** Quyền trên một việc: người viết (`nguoi_lam`); QL lớp điền thay khi việc không có người viết hoặc quá hạn; sau xác nhận người viết / QL vẫn sửa góp ý. */
function quyenViec(p: Principal, b: any) {
  const ql = coTheRaLenh(p, b.class_id);
  const laNguoiLam = b.nguoi_lam === p.userId;
  const thay = ql && !laNguoiLam && (b.nguoi_lam === null || demoToday() > b.han || b.trang_thai === 'xong');
  const viet = b.trang_thai !== 'huy' && (laNguoiLam || thay);
  return { ql, laNguoiLam, thay, viet, xacNhan: viet && b.trang_thai === 'mo' };
}

/** Em đang học lớp (lúc đọc) — một câu. */
function emDangHoc(classId: number): { id: number; ten: string }[] {
  return (db().prepare(
    `SELECT s.id, s.full_name FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')} ORDER BY s.full_name, s.id`,
  ).all(classId) as any[]).map((r) => ({ id: r.id as number, ten: r.full_name as string }));
}

/** Em của phiếu: đã xác nhận → đúng các em trong bản chụp (phiếu không đổi theo ghi danh sau đó); chưa → em đang học. */
function emCuaPhieu(b: any): { ds: { id: number; ten: string }[]; chup: Record<string, TuDien> | null } {
  if (!b.tu_dien) return { ds: emDangHoc(b.class_id), chup: null };
  const chup = JSON.parse(b.tu_dien) as Record<string, TuDien>;
  const ids = Object.keys(chup).map(Number);
  const ten = new Map<number, string>();
  theoLoJson(ids, (json) => {
    for (const r of db().prepare(`SELECT id, full_name FROM students WHERE id IN (${DS_JSON})`).all(json) as any[]) ten.set(r.id, r.full_name);
  });
  return { ds: ids.map((id) => ({ id, ten: ten.get(id) ?? '' })).sort((a, c) => a.ten.localeCompare(c.ten, 'vi')), chup };
}

/** ĐỌC PHIẾU (`GET /ban-giao-gv/:id`). Trước xác nhận: người viết + QL (+ GV cũ); sau: ai xem được học viên lớp đó. Số câu không theo số em. */
export function phieuBanGiaoGv(p: Principal, id: number): PhieuBanGiaoGvDto {
  const b = docViec(id);
  const q = quyenViec(p, b);
  /* GV cũ chỉ đọc việc CÒN MỞ của mình — việc huỷ không có bản chụp, đọc sẽ lộ dữ liệu em hiện tại (rà sâu #731). */
  const doc = q.viet || q.ql || (b.nguoi_cu === p.userId && b.trang_thai === 'mo') || (b.trang_thai === 'xong' && can(p, PERMISSIONS.STUDENT_VIEW, { classId: b.class_id }));
  if (!doc) throw forbidden('Bạn không có quyền đọc bàn giao này.');
  const conn = db();
  const ct = (b.ct ?? null) as string | null;
  const cot = (conn.prepare(
    `SELECT m.mon, m.nguoi_moi, u.full_name FROM ban_giao_gv_mon m JOIN users u ON u.id = m.nguoi_moi WHERE m.ban_giao_id = ? AND m.trang_thai = 'mo' ORDER BY m.mon = 'gvcn', m.id`,
  ).all(id) as any[]).map((r) => ({ mon: r.mon as string, nhan: nhanCotBg(ct, r.mon), ten: r.mon === 'gvcn' ? 'Chủ nhiệm' : tenMon(ct, r.mon), nguoiMoi: { id: r.nguoi_moi as number, ten: r.full_name as string } }));
  const { ds, chup } = emCuaPhieu(b);
  const tuDien = chup ? null : tuDienTheoLo({ id: b.class_id, ct }, ds.map((e) => ({ id: e.id, student_id: e.id, lop_dich_id: null })));
  const gop = new Map<string, any>();
  for (const r of conn.prepare(
    `SELECT e.student_id, e.mon, e.noi_dung, e.dien_thay, e.ghi_luc, u.full_name FROM ban_giao_gv_em e JOIN users u ON u.id = e.nguoi_ghi WHERE e.ban_giao_id = ?`,
  ).all(id) as any[]) gop.set(`${r.student_id}|${r.mon}`, r);
  return {
    id, lop: { id: b.class_id, code: b.code, ct }, nguoiCu: { id: b.nguoi_cu, ten: b.ten_cu }, cot, han: b.han, hieuLuc: b.hieu_luc, trangThai: b.trang_thai,
    homNay: demoToday(), nhanXetChung: b.nhan_xet_chung ?? null,
    xacNhan: b.xong_luc ? { boi: b.ten_xong ?? '', luc: b.xong_luc, thay: !!b.xong_thay } : null,
    em: ds.map((e) => ({
      studentId: e.id, ten: e.ten, tuDien: chup ? chup[String(e.id)] ?? null : tuDien!.get(e.id) ?? null,
      gopY: Object.fromEntries(cot.map((c) => {
        const r = gop.get(`${e.id}|${c.mon}`);
        return [c.mon, r ? { noiDung: r.noi_dung, nguoiGhi: r.full_name, ghiLuc: r.ghi_luc, dienThay: !!r.dien_thay } : null];
      })),
    })),
    nguoiXem: { viet: q.viet, xacNhan: q.xacNhan, thay: q.viet && !q.laNguoiLam },
  };
}

/** GÓP Ý một em một cột (`PUT /ban-giao-gv/:id/gop-y`) — lưu khi rời ô; không để trống (không độ dài tối thiểu), ≤ 1000 ký tự. */
export function ghiGopYGv(p: Principal, id: number, body: { studentId?: unknown; mon?: unknown; noiDung?: unknown }): void {
  const b = docViec(id);
  const q = quyenViec(p, b);
  if (!q.viet) throw forbidden(b.trang_thai === 'huy' ? 'Việc bàn giao đã huỷ.' : 'Chỉ người được giao viết bàn giao (Quản lý điền thay khi quá hạn).');
  const mon = String(body?.mon ?? '');
  const sid = Number(body?.studentId);
  const conn = db();
  if (!conn.prepare(`SELECT 1 FROM ban_giao_gv_mon WHERE ban_giao_id = ? AND mon = ? AND trang_thai = 'mo'`).get(id, mon)) throw badRequest('Cột này không có trong việc bàn giao.');
  if (!emCuaPhieu(b).ds.some((e) => e.id === sid)) throw badRequest('Học viên không thuộc phiếu bàn giao này.');
  const chu = chuTuDo(body?.noiDung, 'Góp ý', 1000);
  if (!chu) throw badRequest('Viết góp ý cho em này.');
  tx(() => {
    const cu = conn.prepare(`SELECT noi_dung FROM ban_giao_gv_em WHERE ban_giao_id = ? AND student_id = ? AND mon = ?`).get(id, sid, mon) as any;
    conn.prepare(
      `INSERT INTO ban_giao_gv_em (ban_giao_id, student_id, mon, noi_dung, nguoi_ghi, dien_thay, ghi_luc) VALUES (?,?,?,?,?,?,?)
       ON CONFLICT (ban_giao_id, student_id, mon) DO UPDATE SET noi_dung = excluded.noi_dung, nguoi_ghi = excluded.nguoi_ghi, dien_thay = excluded.dien_thay, ghi_luc = excluded.ghi_luc`,
    ).run(id, sid, mon, chu, p.userId, q.laNguoiLam ? 0 : 1, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'ban_giao_gv.gop_y', entityType: 'student', entityId: sid,
      before: cu ? { banGiaoId: id, mon, noiDung: cu.noi_dung } : undefined, after: { banGiaoId: id, mon, noiDung: chu, dienThay: !q.laNguoiLam } });
  });
}

/** NHẬN XÉT CHUNG cả lớp (`PUT /ban-giao-gv/:id/nhan-xet`) — tuỳ chọn; rỗng = xoá. */
export function ghiNhanXetChungGv(p: Principal, id: number, chu: unknown): void {
  const b = docViec(id);
  if (!quyenViec(p, b).viet) throw forbidden('Chỉ người được giao viết bàn giao (Quản lý điền thay khi quá hạn).');
  const nx = chuTuDo(chu, 'Nhận xét chung', 2000);
  db().prepare('UPDATE ban_giao_gv SET nhan_xet_chung = ? WHERE id = ?').run(nx, id);
  writeAudit({ actorUserId: p.userId, action: 'ban_giao_gv.nhan_xet', entityType: 'class', entityId: b.class_id,
    before: { banGiaoId: id, nhanXetChung: b.nhan_xet_chung }, after: { banGiaoId: id, nhanXetChung: nx } });
}

/** XÁC NHẬN (`POST /ban-giao-gv/:id/xac-nhan`): mọi em × mọi cột có góp ý; chụp tự điền; báo mỗi GV mới một lần. */
export function xacNhanBanGiaoGv(p: Principal, id: number): void {
  const b = docViec(id);
  const q = quyenViec(p, b);
  if (b.trang_thai !== 'mo') throw conflict(b.trang_thai === 'xong' ? 'Bàn giao đã được xác nhận.' : 'Việc bàn giao đã huỷ.');
  if (!q.xacNhan) throw forbidden('Chỉ người được giao viết bàn giao (Quản lý xác nhận thay khi quá hạn).');
  const conn = db();
  const cot = conn.prepare(`SELECT mon, nguoi_moi FROM ban_giao_gv_mon WHERE ban_giao_id = ? AND trang_thai = 'mo'`).all(id) as any[];
  const em = emDangHoc(b.class_id);
  const co = new Set((conn.prepare(`SELECT student_id, mon FROM ban_giao_gv_em WHERE ban_giao_id = ?`).all(id) as any[]).map((r) => `${r.student_id}|${r.mon}`));
  const thieu = em.filter((e) => cot.some((c) => !co.has(`${e.id}|${c.mon}`))).length;
  if (thieu) throw loi(400, 'Còn {n} em thiếu góp ý.', { n: thieu });
  const td = tuDienTheoLo({ id: b.class_id, ct: b.ct ?? null }, em.map((e) => ({ id: e.id, student_id: e.id, lop_dich_id: null })));
  tx(() => {
    const luc = nowIso();
    const r = conn.prepare(`UPDATE ban_giao_gv SET trang_thai = 'xong', tu_dien = ?, xong_luc = ?, xong_boi = ?, xong_thay = ? WHERE id = ? AND trang_thai = 'mo'`)
      .run(JSON.stringify(Object.fromEntries(em.map((e) => [e.id, td.get(e.id) ?? null]))), luc, p.userId, q.laNguoiLam ? 0 : 1, id);
    if (!r.changes) throw conflict('Bàn giao vừa được xác nhận.');
    const nhan = cot.map((c) => nhanCotBg(b.ct ?? null, c.mon)).join(', ');
    for (const u of new Set(cot.map((c) => c.nguoi_moi as number))) {
      if (u === p.userId) continue;
      notify({ userId: u, kind: 'ban_giao_gv', title: `Đã có bàn giao ${b.code} · ${nhan}`, body: `Từ ${b.ten_cu}`,
        entityType: 'class', entityId: b.class_id, dedupKey: `ban_giao_gv:${id}`, duong: `/hoc-vien/lop/${b.class_id}?viec=ban-giao-gv&id=${id}` });
    }
    writeAudit({ actorUserId: p.userId, action: 'ban_giao_gv.xac_nhan', entityType: 'class', entityId: b.class_id, after: { banGiaoId: id, thay: !q.laNguoiLam, soEm: em.length } });
  });
}

// ==================================================================== việc (Công việc) — ≤ 3 câu cho mọi việc

export type ViecBanGiaoGv = { id: number; userId: number | null; lopId: number; code: string; monNgan: string[]; nguoiMoi: string; du: number; tong: number; han: string; emIds: number[] };

/**
 * Việc bàn giao đổi GV đang mở: của MỘT người (`nguoi_lam = userId`, kèm việc không người viết — nơi gọi lọc QL bằng `can`), hoặc mọi người
 * (`userId` null); `ids` = chỉ các việc này (hộp Chờ đổi). Ba câu cho mọi việc: việc × cột · em đang học các lớp · góp ý đã có.
 */
export function viecBanGiaoGv(userId: number | null, branchId?: number | null, ids?: readonly number[]): ViecBanGiaoGv[] {
  const conn = db();
  const dk = [`b.trang_thai = 'mo'`, ...(userId !== null ? ['(b.nguoi_lam = ? OR b.nguoi_lam IS NULL)'] : []), ...(branchId ? ['c.branch_id = ?'] : []),
    ...(ids ? [`b.id IN (${DS_JSON})`] : [])];
  const rows = conn.prepare(
    `SELECT b.id, b.class_id, b.nguoi_lam, b.han, c.code, c.programme_code AS ct, m.mon, u.full_name AS moi
       FROM ban_giao_gv b JOIN classes c ON c.id = b.class_id
       JOIN ban_giao_gv_mon m ON m.ban_giao_id = b.id AND m.trang_thai = 'mo' JOIN users u ON u.id = m.nguoi_moi
      WHERE ${dk.join(' AND ')} ORDER BY b.han, b.id, m.mon = 'gvcn', m.id`,
  ).all(...[userId, branchId].filter((x) => x !== null && x !== undefined), ...(ids ? [JSON.stringify(ids)] : [])) as any[];
  if (!rows.length) return [];
  const viec = new Map<number, { r: any; cot: string[]; moi: string[] }>();
  for (const r of rows) {
    const v = viec.get(r.id) ?? { r, cot: [], moi: [] };
    v.cot.push(r.mon);
    if (!v.moi.includes(r.moi)) v.moi.push(r.moi);
    viec.set(r.id, v);
  }
  const em = new Map<number, number[]>();
  theoLoJson([...new Set(rows.map((r) => r.class_id as number))], (json) => {
    for (const r of conn.prepare(
      `SELECT e.class_id, s.id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id IN (${DS_JSON}) AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
    ).all(json) as any[]) em.set(r.class_id, [...(em.get(r.class_id) ?? []), r.id]);
  });
  const co = new Set<string>();
  theoLoJson([...viec.keys()], (json) => {
    for (const r of conn.prepare(`SELECT ban_giao_id, student_id, mon FROM ban_giao_gv_em WHERE ban_giao_id IN (${DS_JSON})`).all(json) as any[]) co.add(`${r.ban_giao_id}|${r.student_id}|${r.mon}`);
  });
  return [...viec.values()].map(({ r, cot, moi }) => {
    const ds = em.get(r.class_id) ?? [];
    return {
      id: r.id, userId: r.nguoi_lam ?? null, lopId: r.class_id, code: r.code, monNgan: cot.map((m) => nhanCotBg(r.ct ?? null, m)), nguoiMoi: moi.join(', '),
      du: ds.filter((s) => cot.every((m) => co.has(`${r.id}|${s}|${m}`))).length, tong: ds.length, han: r.han, emIds: ds,
    };
  });
}
