/**
 * PHÂN CÔNG GV CÓ HIỆU LỰC (PC-GV-A, đặc tả 2026-10-30-phan-cong-gv-design.md mục 2b). MỌI lần đổi phân công (góc Phân công GV, hồ sơ lớp ›
 * Sửa thông tin, `PUT /classes/:id/teachers` cũ) đi qua `luuPhanCong`: nhiều lớp, một giao dịch. Mỗi ô đổi một dòng `doi_phan_cong`:
 * "Ngay hôm nay" → áp ngay (`da_ap`); "Từ tuần …" → `cho`, quét tới hạn như `lenh_chuyen_lop`. Không ghi `teacher_assignments` tương lai
 * (mọi câu `status = 'active'` sẽ thấy hai người một ô).
 */
import { db, tx } from '../db.ts';
import {
  ENTRY_SKILLS, MON_GOP, PERMISSIONS, apDoi, doiTheoO, moRongPhanCong, xemDen,
  type DoiO, type HieuLucVao, type SlotPhanCong,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { mondayOf, periodById } from '../platform/week.ts';
import { can, loadPrincipal, require_, type Principal } from '../permissions.ts';
import { notify, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { GhiDao, daoLai, luuGhiDao, timGhiDao, type BanGhiDao } from '../platform/ghiDao.ts';
import { HttpError, badRequest, conflict, forbidden, loi, notFound, nowIso } from '../util.ts';
import { programmeOfClass } from '../normal/regular.ts';
import { caseThieuChuLop, chonViecChuyen, chuyenViecKhiDoi } from '../cases/owner.ts';
import { docSlots, ghiPhanCong, kiemTruocPhanCong, phienBanPhanCong, teacherCandidatesBranch, type TeacherSlot } from './classes.ts';

export type LuuLopVao = { classId: number; slots: TeacherSlot[]; phienBan?: string; banGiao?: Record<string, boolean> };
export type KetQuaLuu = { lo: number | null; lop: { classId: number; cho: boolean; soO: number }[] };
/** Một lần lưu tối đa bấy nhiêu lớp (ca GV nghỉ nhiều lớp vẫn dư). */
const TOI_DA_LOP = 60;

type DongDoi = { id: number; khoa: string; nguoi_cu: number | null; nguoi_moi: number | null };
/** Người được xếp ở chi nhánh: ứng viên → null; người giữ ô mà không còn là ứng viên → 'nghi' | 'ngoai-cn'. */
export type DuocXep = Map<number, 'nghi' | 'ngoai-cn' | null>;

const inHang = (n: number) => Array.from({ length: n }, () => '?').join(',');
const slotCua = (r: any): SlotPhanCong => ({ userId: r.user_id, skill: r.skill ?? null, isCore: r.is_core === 1 });

/**
 * Người KHÔNG còn là ứng viên của chi nhánh mà vẫn giữ ô: `nghi` = tài khoản không còn hoạt động (xoá / khoá) hoặc hết mọi vai giảng dạy;
 * còn vai ở chi nhánh khác → `ngoai-cn`. Một câu cho cả tập.
 */
export function phanLoaiNguoi(ids: readonly number[]): Map<number, 'nghi' | 'ngoai-cn'> {
  const m = new Map<number, 'nghi' | 'ngoai-cn'>();
  if (!ids.length) return m;
  for (const r of db().prepare(
    `SELECT u.id, u.status, EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = u.id AND ur.status = 'active' AND r.key IN ('teacher', 'manager')) AS con_vai
       FROM users u WHERE u.id IN (${inHang(ids.length)})`,
  ).all(...ids) as any[]) m.set(r.id, r.status !== 'active' || !r.con_vai ? 'nghi' : 'ngoai-cn');
  for (const id of ids) if (!m.has(id)) m.set(id, 'nghi');
  return m;
}

/** Ứng viên của chi nhánh + người giữ ô không còn là ứng viên (đọc MỘT lần mỗi chi nhánh trong một lần lưu). */
function duocXepCua(nho: Map<number, DuocXep>, branchId: number, nguoiGiu: readonly number[]): DuocXep {
  let m = nho.get(branchId);
  if (!m) {
    m = new Map(teacherCandidatesBranch(branchId).map((u) => [u.id as number, null]));
    nho.set(branchId, m);
  }
  const thieu = [...new Set(nguoiGiu)].filter((id) => !m!.has(id));
  for (const [id, v] of phanLoaiNguoi(thieu)) m.set(id, v);
  return m;
}

/** Ngày hiệu lực: "Ngay hôm nay" → hôm nay; "Từ tuần …" → Thứ Hai tuần đó, phải sau tuần này. */
function ngayHieuLuc(h: HieuLucVao | undefined): { ngay: string; homNay: boolean } {
  const homNay = demoToday();
  if (!h || h.loai === 'hom-nay') return { ngay: homNay, homNay: true };
  if (h.loai !== 'tuan') throw badRequest('Hiệu lực không hợp lệ.');
  const tuan = Number.isInteger(Number(h.tuanId)) ? periodById(Number(h.tuanId)) : null;
  if (!tuan || tuan.week_start <= mondayOf(homNay)) throw badRequest('Chọn tuần sau tuần này hoặc Ngay hôm nay.');
  return { ngay: tuan.week_start as string, homNay: false };
}

/** Phân công đang chạy + dòng chờ đổi của các lớp — hai câu cho cả tập. */
function docHienTai(ids: readonly number[]) {
  const conn = db();
  const active = new Map<number, any[]>(ids.map((id) => [id, []]));
  const cho = new Map<number, any[]>(ids.map((id) => [id, []]));
  for (const r of conn.prepare(`SELECT id, class_id, user_id, skill, is_core FROM teacher_assignments WHERE status = 'active' AND class_id IN (${inHang(ids.length)})`).all(...ids) as any[]) active.get(r.class_id)!.push(r);
  for (const r of conn.prepare(`SELECT id, class_id, khoa FROM doi_phan_cong WHERE trang_thai = 'cho' AND class_id IN (${inHang(ids.length)})`).all(...ids) as any[]) cho.get(r.class_id)!.push(r);
  return { active, cho };
}

type LopChuan = { classId: number; code: string; branchId: number; ct: string | null; kyNang: string[]; full: boolean; doi: DoiO[]; vao: LuuLopVao };

/**
 * LƯU PHÂN CÔNG nhiều lớp (`POST /phan-cong/luu`). Quyền mỗi lớp như `setClassTeachers`: QL (`class.assign`) đổi mọi ô; GVCN
 * (`class.assign_subject`) chỉ ô bộ môn — chạm GVCN → 403. Kiểm TẤT CẢ lớp trước (phiên bản → 409 `details.classId`; luật → 400
 * `details.{classId, khoa}`), rồi MỘT giao dịch: kiểm lại phiên bản; ô có lịch đổi chờ → dòng cũ huỷ (thay bằng lần đổi sau); chèn dòng đổi;
 * hôm nay → áp ngay (`apDoiLop`); tuần sau → `cho`. Mọi dòng ghi chụp `ghi_dao` để Hoàn tác (`lo` = khoá).
 */
export function luuPhanCong(p: Principal, body: { lop?: unknown; hieuLuc?: HieuLucVao }): KetQuaLuu {
  const vao = Array.isArray(body?.lop) ? (body.lop as LuuLopVao[]) : null;
  if (!vao?.length) throw badRequest('Chưa có lớp nào để lưu.');
  if (vao.length > TOI_DA_LOP) throw loi(400, 'Mỗi lần lưu tối đa {n} lớp.', { n: TOI_DA_LOP });
  const ids = vao.map((l) => Number(l?.classId));
  if (ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) throw badRequest('Danh sách lớp không hợp lệ.');
  const { ngay, homNay } = ngayHieuLuc(body.hieuLuc);
  const conn = db();
  const cls = new Map((conn.prepare(`SELECT id, code, branch_id FROM classes WHERE id IN (${inHang(ids.length)})`).all(...ids) as any[]).map((c) => [c.id as number, c]));
  if (cls.size !== ids.length) throw notFound('Không tìm thấy lớp');

  const nhieu = vao.length > 1;
  const kiemPhienBan = (l: LuuLopVao, active: any[], cho: any[]) => {
    if (l.phienBan !== undefined && String(l.phienBan) !== phienBanPhanCong(active, cho)) {
      throw conflict(nhieu ? `${cls.get(l.classId).code}: Phân công lớp vừa đổi bởi người khác. Đã tải lại — chọn lại rồi lưu.`
        : 'Phân công lớp vừa đổi bởi người khác. Đã tải lại — chọn lại rồi lưu.', { classId: l.classId });
    }
  };
  /* Kiểm TẤT CẢ trước khi ghi: một lớp sai → không lớp nào được ghi. */
  const truoc = docHienTai(ids);
  const xepNho = new Map<number, DuocXep>();
  const lop: LopChuan[] = vao.map((l) => {
    const classId = Number(l.classId);
    const c = cls.get(classId);
    const full = can(p, PERMISSIONS.CLASS_ASSIGN, { classId });
    if (!full) require_(p, PERMISSIONS.CLASS_ASSIGN_SUBJECT, { classId, branchId: c.branch_id }, 'Chỉ Quản lý hoặc GVCN của lớp mới phân công giáo viên.');
    const prog = programmeOfClass(classId);
    const ct = prog?.code ?? null;
    const kyNang: string[] = prog?.skills ?? [...ENTRY_SKILLS];
    kiemPhienBan({ ...l, classId }, truoc.active.get(classId)!, truoc.cho.get(classId)!);
    /* Pre FOU: GVCN tự nhận ô môn duy nhất — đổi GVCN thì ô đó đổi theo (T56). */
    const slots = moRongPhanCong(ct, kyNang, docSlots(l.slots));
    const cu = truoc.active.get(classId)!.map(slotCua);
    const doi = doiTheoO(ct, kyNang, cu, slots);
    if (!full && doi.some((d) => d.khoa === 'gvcn')) throw forbidden('GVCN chỉ đổi được GV bộ môn. Đổi GVCN thì nhờ Quản lý chi nhánh.', { classId });
    /* Kiểm NGUYÊN bức tranh gửi lên (như cũ: hai người một môn, môn lạ → 400, không lặng lẽ bỏ). P13: môn gộp cũ đang có dòng là môn hợp lệ. */
    const monGopCo = [...new Set(cu.map((x) => x.skill).filter((k): k is string => !!k && Object.hasOwn(MON_GOP, k) && !kyNang.includes(k)))];
    try {
      kiemTruocPhanCong(classId, c.branch_id, ct, [...kyNang, ...monGopCo], slots, duocXepCua(xepNho, c.branch_id, slots.map((s) => s.userId)));
    } catch (e) {
      if (e instanceof HttpError && e.status === 400) {
        const khoa = (e.details as any)?.khoa ?? null;
        const x = new HttpError(400, nhieu ? `${c.code} · ${e.message}` : e.message, { classId, khoa });
        if (!nhieu) { x.khoa = e.khoa; x.bien = e.bien; }
        throw x;
      }
      throw e;
    }
    return { classId, code: c.code, branchId: c.branch_id, ct, kyNang, full, doi, vao: l };
  });

  return tx(() => {
    const sau = docHienTai(ids);
    for (const l of lop) kiemPhienBan(l.vao, sau.active.get(l.classId)!, sau.cho.get(l.classId)!);
    const g = new GhiDao(conn);
    const luc = nowIso();
    const moi: number[] = [];
    const kq = theoDoiMoi(g, ['doi_phan_cong', 'teacher_assignments', 'sos_case_history', 'notifications'], () => lop.map((l) => {
      const khoa = [...new Set(l.doi.map((d) => d.khoa))];
      if (khoa.length) {
        const dk = `class_id = ? AND trang_thai = 'cho' AND khoa IN (${inHang(khoa.length)})`;
        g.sua('doi_phan_cong', dk, l.classId, ...khoa);
        conn.prepare(`UPDATE doi_phan_cong SET trang_thai = 'huy', huy_luc = ?, huy_boi = ?, ly_do_huy = 'thay bằng lần đổi sau' WHERE ${dk}`)
          .run(luc, p.userId, l.classId, ...khoa);
      }
      const rows: DongDoi[] = l.doi.map((d) => {
        const taoBanGiao = d.nguoiCu !== null && d.nguoiMoi !== null && (l.vao.banGiao?.[d.khoa] ?? true) ? 1 : 0;
        const id = Number(conn.prepare(
          `INSERT INTO doi_phan_cong (lo, class_id, khoa, nguoi_cu, nguoi_moi, hieu_luc, trang_thai, tao_ban_giao, xem_den, tao_boi, tao_luc, ap_luc)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(moi[0] ?? null, l.classId, d.khoa, d.nguoiCu, d.nguoiMoi, ngay, homNay ? 'da_ap' : 'cho', taoBanGiao,
          homNay && d.nguoiCu !== null ? xemDen(ngay) : null, p.userId, luc, homNay ? luc : null).lastInsertRowid);
        moi.push(id);
        return { id, khoa: d.khoa, nguoi_cu: d.nguoiCu, nguoi_moi: d.nguoiMoi };
      });
      if (homNay) {
        /* Luôn áp ở "hôm nay" (kể cả không ô nào đổi) — đúng đường cũ: dòng môn gộp cũ hết việc thì kết thúc như mọi lần lưu. */
        const r = apDoiLop(p, l.classId, rows, ngay, { g, duocXep: xepNho.get(l.branchId), via: l.full ? 'quan_ly' : 'gvcn' });
        if (!l.full && (r.added || r.ended)) {
          for (const id of quanLyCuaChiNhanh(l.branchId)) {
            if (id === p.userId) continue;
            notify({ userId: id, kind: 'phan_cong_gvcn', title: `${p.fullName} (GVCN) đã đổi phân công GV bộ môn lớp ${l.code}`,
              entityType: 'class', entityId: l.classId, dedupKey: `phan_cong_gvcn:${l.classId}:${luc}`, duong: `/hoc-vien/lop/${l.classId}` });
          }
        }
      }
      return { classId: l.classId, cho: !homNay && rows.length > 0, soO: rows.length };
    }));
    const lo = moi[0] ?? null;
    if (lo !== null) {
      conn.prepare(`UPDATE doi_phan_cong SET lo = ? WHERE id = ?`).run(lo, lo);
      g.boKhongDoi('sos_cases');
      luuGhiDao(conn, { loai: 'phan_cong.luu', bang: 'doi_phan_cong', id: lo, nguoi: p.userId, ghi: g });
    }
    return { lo, lop: kq };
  });
}

/** Chụp dòng MỚI của các bảng (rowid > rowid lớn nhất lúc bắt đầu) — một lần cho cả thao tác. */
function theoDoiMoi<T>(g: GhiDao, bang: readonly string[], fn: () => T): T {
  if (!bang.length) return fn();
  const [dau, ...con] = bang;
  const max = (db().prepare(`SELECT COALESCE(MAX(rowid), 0) AS m FROM ${dau}`).get() as any).m as number;
  return g.theoDoi(dau, 'rowid > ?', [max], () => theoDoiMoi(g, con, fn));
}

/**
 * ÁP các dòng đổi của MỘT lớp — gọi TRONG tx (lưu hôm nay, lịch đổi tới hạn, Đổi mốc sang hôm nay). Bức tranh HIỆN TẠI → `apDoi` →
 * `moRongPhanCong` → kiểm ba luật + người xếp được → `ghiPhanCong`. Ném lỗi luật (nơi gọi quyết: lưu → 400; quét → giữ `cho` + lỗi).
 */
export function apDoiLop(p: Principal, classId: number, rows: DongDoi[], ngay: string,
  o: { g?: GhiDao; duocXep?: DuocXep; via?: string } = {}): { added: number; ended: number } {
  const conn = db();
  const c = conn.prepare('SELECT branch_id, code FROM classes WHERE id = ?').get(classId) as any;
  const prog = programmeOfClass(classId);
  const ct = prog?.code ?? null;
  const kyNang: string[] = prog?.skills ?? [...ENTRY_SKILLS];
  const cu = (conn.prepare(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`).all(classId) as any[]).map(slotCua);
  const doi: DoiO[] = rows.map((r) => ({ khoa: r.khoa, nguoiCu: r.nguoi_cu, nguoiMoi: r.nguoi_moi }));
  const slots = moRongPhanCong(ct, kyNang, apDoi(cu, doi, kyNang));
  kiemTruocPhanCong(classId, c.branch_id, ct, kyNang, slots, o.duocXep ?? duocXepCua(new Map(), c.branch_id, slots.map((s) => s.userId)));
  /* Case / PA của GV cũ ở ô đổi → GV mới (A3). Chụp ĐÚNG các dòng sẽ ghi (+ Case thiếu chủ `ghiPhanCong` có thể gán) trước khi ghi. */
  const conDay = (u: number) => new Set(slots.filter((s) => s.userId === u && !s.isCore && s.skill).map((s) => s.skill!));
  const chon = chonViecChuyen(classId, ct, doi, conDay);
  if (o.g) {
    const caseIds = [...new Set([...[...chon.values()].flatMap((v) => v.caseIds), ...caseThieuChuLop(classId)])];
    const paIds = [...chon.values()].flatMap((v) => v.paIds);
    if (caseIds.length) o.g.sua('sos_cases', `id IN (${inHang(caseIds.length)})`, ...caseIds);
    if (paIds.length) o.g.sua('case_interventions', `id IN (${inHang(paIds.length)})`, ...paIds);
    o.g.sua('teacher_assignments', `class_id = ? AND status = 'active'`, classId);
  }
  const chuyen = chuyenViecKhiDoi({ classId, ct, doi: rows.map((r, i) => ({ ...doi[i], id: r.id })), conDay, actorId: p.userId, luc: nowIso(), code: c.code, chon });
  const tom = (ds: SlotPhanCong[]) => ds.map((x) => `${x.isCore ? 'GVCN' : x.skill}:${x.userId}`).sort();
  return ghiPhanCong(p, classId, slots, ngay,
    { via: o.via ?? 'quan_ly', truoc: tom(cu), sau: tom(slots), doi: rows.map((r) => r.id), chuyen: Object.fromEntries(chuyen) });
}

/* ================= A4 · lịch đổi tới hạn · Đổi mốc · Huỷ lịch đổi · Hoàn tác ================= */

/** Mỗi lượt quét tối đa bấy nhiêu nhóm (lớp × hiệu lực) — lượt sau làm tiếp (như `lenh_chuyen_lop`). */
const NHOM_TOI_DA = 40;

/**
 * ÁP LỊCH ĐỔI TỚI HẠN — cron thứ Hai (`chotVangDinhKy`) + quét khi đọc (`quetDoiDenHan`). Một câu rẻ NGOÀI tx; mỗi nhóm (lớp, hiệu lực) một tx,
 * đọc lại TRONG tx (lượt song song đã áp → 0 dòng). Tác giả = người tạo lịch. Bức tranh lúc đó sai luật → không áp gì: giữ `cho`, ghi `loi`,
 * `thu_ngay` = hôm nay (không thử lại trong ngày), người tạo nhận MỘT thông báo.
 */
export function apDoiDenHan(homNay = demoToday()): { daAp: number; loi: number } {
  const kq = { daAp: 0, loi: 0 };
  const conn = db();
  const nhom = conn.prepare(
    `SELECT DISTINCT class_id, hieu_luc FROM doi_phan_cong
      WHERE trang_thai = 'cho' AND hieu_luc <= ? AND (thu_ngay IS NULL OR thu_ngay < ?) ORDER BY hieu_luc, class_id LIMIT ?`,
  ).all(homNay, homNay, NHOM_TOI_DA) as any[];   // ponytail: 40 nhóm/lượt, lượt quét sau làm tiếp
  for (const n of nhom) {
    try {
      tx(() => {
        const rows = conn.prepare(
          `SELECT * FROM doi_phan_cong WHERE trang_thai = 'cho' AND class_id = ? AND hieu_luc = ? AND (thu_ngay IS NULL OR thu_ngay < ?) ORDER BY id`,
        ).all(n.class_id, n.hieu_luc, homNay) as any[];
        if (!rows.length) return;
        const ids = rows.map((r) => r.id as number);
        const p = loadPrincipal(rows[0].tao_boi);
        try {
          tx(() => apDoiLop(p, n.class_id, rows, n.hieu_luc));
        } catch (e) {
          if (!(e instanceof HttpError)) throw e;
          conn.prepare(`UPDATE doi_phan_cong SET loi = ?, thu_ngay = ? WHERE id IN (${inHang(ids.length)})`).run(e.message.slice(0, 300), homNay, ...ids);
          const code = (conn.prepare('SELECT code FROM classes WHERE id = ?').get(n.class_id) as any)?.code ?? '';
          notify({ userId: rows[0].tao_boi, kind: 'phan_cong_loi', title: `Chưa đổi được phân công ${code}: ${e.message}`.slice(0, 300),
            entityType: 'class', entityId: n.class_id, dedupKey: `phan_cong_loi:${n.class_id}:${n.hieu_luc}:${homNay}`, duong: `/hoc-vien/lop/${n.class_id}` });
          kq.loi += 1;
          return;
        }
        conn.prepare(`UPDATE doi_phan_cong SET trang_thai = 'da_ap', ap_luc = ?, xem_den = CASE WHEN nguoi_cu IS NULL THEN NULL ELSE ? END, loi = NULL, thu_ngay = NULL
                       WHERE id IN (${inHang(ids.length)})`).run(nowIso(), xemDen(n.hieu_luc), ...ids);
        kq.daAp += ids.length;
      });
    } catch (e) {
      kq.loi += 1;
      console.error('[phan-cong] áp lịch đổi tới hạn', e);
    }
  }
  return kq;
}

/** Quét khi đọc: một lần mỗi request (`nho`). Lỗi không làm hỏng trang đang đọc. Gọi trong `quetLenhDenHan`. */
export function quetDoiDenHan(homNay = demoToday()): void {
  nho(`ap-doi-pc:${homNay}`, () => { try { apDoiDenHan(homNay); } catch (e) { console.error('[phan-cong] quét khi đọc', e); } return true; });
}

/** Quyền trên các dòng đổi (lịch chờ / một lần lưu): như lưu — QL mọi ô; GVCN chỉ ô bộ môn lớp mình. */
function kiemQuyenDong(p: Principal, rows: { class_id: number; khoa: string }[]) {
  for (const r of rows) {
    if (can(p, PERMISSIONS.CLASS_ASSIGN, { classId: r.class_id })) continue;
    if (r.khoa !== 'gvcn' && can(p, PERMISSIONS.CLASS_ASSIGN_SUBJECT, { classId: r.class_id })) continue;
    throw forbidden('Chỉ Quản lý (hoặc GVCN với ô bộ môn lớp mình) mới đổi được phân công này.', { classId: r.class_id });
  }
}

/** Dòng lịch chờ theo id — mọi id phải còn `cho` (người khác vừa áp / huỷ → 409). */
function dongCho(ids: unknown): any[] {
  const ds = Array.isArray(ids) ? ids.map(Number) : [];
  if (!ds.length || ds.some((id) => !Number.isInteger(id) || id <= 0) || ds.length > 200) throw badRequest('Danh sách lịch đổi không hợp lệ.');
  const rows = db().prepare(`SELECT * FROM doi_phan_cong WHERE trang_thai = 'cho' AND id IN (${inHang(ds.length)}) ORDER BY id`).all(...ds) as any[];
  if (rows.length !== new Set(ds).size) throw conflict('Lịch đổi vừa thay đổi — tải lại.');
  return rows;
}

/** ĐỔI MỐC lịch chờ: sang tuần khác, hoặc "Ngay hôm nay" → áp ngay (Case / PA chuyển). `dao` = khoá Hoàn tác. */
export function doiMocCho(p: Principal, ids: unknown, hieuLuc: HieuLucVao): { lo: number | null; dao: number } {
  kiemQuyenDong(p, dongCho(ids));
  const { ngay, homNay } = ngayHieuLuc(hieuLuc);
  const conn = db();
  return tx(() => {
    const rows = dongCho(ids);
    const g = new GhiDao(conn);
    const rid = rows.map((r) => r.id as number);
    const dk = `id IN (${inHang(rid.length)})`;
    g.sua('doi_phan_cong', dk, ...rid);
    if (homNay) {
      theoDoiMoi(g, ['teacher_assignments', 'sos_case_history', 'notifications'], () => {
        for (const classId of new Set(rows.map((r) => r.class_id as number))) apDoiLop(p, classId, rows.filter((r) => r.class_id === classId), ngay, { g });
      });
      conn.prepare(`UPDATE doi_phan_cong SET trang_thai = 'da_ap', hieu_luc = ?, ap_luc = ?, xem_den = CASE WHEN nguoi_cu IS NULL THEN NULL ELSE ? END, loi = NULL, thu_ngay = NULL
                     WHERE ${dk}`).run(ngay, nowIso(), xemDen(ngay), ...rid);
      g.boKhongDoi('sos_cases');
    } else {
      conn.prepare(`UPDATE doi_phan_cong SET hieu_luc = ?, loi = NULL, thu_ngay = NULL WHERE ${dk}`).run(ngay, ...rid);
    }
    const dao = luuGhiDao(conn, { loai: 'phan_cong.doi_moc', bang: 'doi_phan_cong', id: rid[0], nguoi: p.userId, ghi: g });
    return { lo: rows[0].lo ?? null, dao };
  });
}

/** HUỶ LỊCH ĐỔI (chưa tới hạn): dòng → `huy`. Hoàn tác được (`dao`). */
export function huyCho(p: Principal, ids: unknown): { dao: number } {
  kiemQuyenDong(p, dongCho(ids));
  const conn = db();
  return tx(() => {
    const rows = dongCho(ids);
    const rid = rows.map((r) => r.id as number);
    const dk = `id IN (${inHang(rid.length)})`;
    const g = new GhiDao(conn);
    g.sua('doi_phan_cong', dk, ...rid);
    conn.prepare(`UPDATE doi_phan_cong SET trang_thai = 'huy', huy_luc = ?, huy_boi = ?, ly_do_huy = 'Huỷ lịch đổi' WHERE ${dk}`).run(nowIso(), p.userId, ...rid);
    return { dao: luuGhiDao(conn, { loai: 'phan_cong.huy', bang: 'doi_phan_cong', id: rid[0], nguoi: p.userId, ghi: g }) };
  });
}

/**
 * HOÀN TÁC một lần lưu (`lo`) / Đổi mốc / Huỷ lịch đổi (`dao`): `daoLai` — mọi dòng còn y như sau thao tác, không thì 409 (không đảo nửa chừng).
 * Quyền như lưu trên MỌI lớp, mọi ô của bản ghi (theo dòng `doi_phan_cong` trong bản ghi).
 */
export function hoanTacLuu(p: Principal, o: { lo?: unknown; dao?: unknown }): void {
  const conn = db();
  tx(() => {
    const g: BanGhiDao | null = o.dao !== undefined && o.dao !== null
      ? (conn.prepare(`SELECT * FROM ghi_dao WHERE id = ? AND loai LIKE 'phan_cong.%'`).get(Number(o.dao)) as BanGhiDao | undefined) ?? null
      : timGhiDao(conn, 'phan_cong.luu', 'doi_phan_cong', Number(o.lo));
    if (!g) throw notFound('Không còn bản ghi để hoàn tác.');
    const muc = JSON.parse(g.du_lieu) as { k: string; bang: string; truoc: any[]; sau: any[] }[];
    const dong = muc.filter((m) => m.bang === 'doi_phan_cong').flatMap((m) => (m.k === 'tao' ? m.sau : m.truoc));
    if (!dong.length) throw notFound('Không còn bản ghi để hoàn tác.');
    kiemQuyenDong(p, dong);
    daoLai(conn, g, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'class.assign.hoan_tac', entityType: 'class', entityId: dong[0].class_id,
      after: { loai: g.loai, ghiDao: g.id, lop: [...new Set(dong.map((d) => d.class_id))] } });
  });
}
