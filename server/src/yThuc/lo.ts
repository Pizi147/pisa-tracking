/**
 * Ý THỨC NHIỀU EM CÙNG LÚC Ở MỨC LỚP (OV-13d — đặc tả OV-13 §0 Q5, §3 dòng 5; mockup OV-13 mục 4).
 *
 * Tab Ý thức của lớp và dòng gộp Ý thức ở Công việc chọn nhiều em → ba hành động:
 *   Xác nhận xử lý chung   ngày · người · mô tả chung (sửa riêng từng em được); mỗi em tự lấy bậc kế (máy chủ tính). Em chưa bắt buộc / có đề
 *                          xuất chờ QL bị loại kèm lý do — cùng luật việc `yt_xu_ly` ở Công việc (`soBatBuoc > 0 && !coChoDuyet`).
 *   Ghi nhận               mọi vi phạm Mới (kể cả Mới quá hạn) của em; em đang bắt buộc xử lý không Ghi nhận được (V4-2).
 *   Xác nhận cấp bậc       bậc 0 "Chưa có xử lý vi phạm" … WL 2; N70 (chủ SP 24/11): em CHƯA khai lưu là áp ngay; em ĐÃ khai — Head / Quản trị áp ngay,
 *                          GVCN thành yêu cầu chờ Head duyệt từng em (`guiSuaKhai`, kết quả `guiDuyet` + `ycId`; Hoàn tác lô = rút thẻ).
 *
 * Mỗi em đi qua ĐÚNG phần ghi của hàm một em (`luuXuLy` · `luuGhiNhan` · `luuKhai` / `luuSuaKhai`): mỗi em một giao dịch, luật tính lại trong
 * giao dịch, giữ khoá chống gửi trùng (khoá lô + `:{em}`) và `bacDaThay`; lỗi em nào báo riêng em đó, em khác vẫn lưu.
 * Rà #408 (Netlify ~7,5 s, Turso ~20–50 ms/câu): quyền xét theo LỚP một lần, trạng thái các em đọc một lượt, ngày nghiệp vụ đọc một lần,
 * không đọc lại lần xử lý vừa ghi — xử lý ~12 câu / em, cấp bậc ~5 câu / em (phép kiểm OV13d-6 khoá); web chia lô ≤ 4 / ≤ 12 em mỗi lời gọi.
 */
import { db, tx } from '../db.ts';
import {
  BAC_0_NHAN, PERMISSIONS, VIOLATION_CATEGORY_LABEL, kindCuaBac, macDinhTick, ngayTheoGioVN, nhanLoaiXuLy,
  type NhomEm, type ViolationCategory,
} from '../../../shared/domain/index.ts';
import { kem, type ChuKhoa } from '../../../shared/i18n/index.ts';
import { can, duyetYThuc, require_, type Principal } from '../permissions.ts';
import { HttpError, badRequest, canXacNhan, forbidden, loi, notFound, todayInBusinessTz } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { requireViewClass } from './access.ts';
import { emCuaLop, trangThaiYThuc, type EmYThuc } from './trangThai.ts';
import { MANAGE_MESSAGE, guiSuaKhai, khoiPhucSuaKhai, kiemKhai, luuGhiNhan, luuKhai, luuSuaKhai, luuXuLy, moTa, ngayThucHien, nguoiThucHien } from './xuLy.ts';
import { rutYeuCau } from '../duyet/yeuCau.ts';
import { KEY_TAKEN_MESSAGE } from './access.ts';

/** Một lô tối đa — một lớp đông nhất ~40 em; chặn thân request quá lớn. */
const LO_TOI_DA = 200;

export type EmLo = {
  studentId: number; ten: string; nhom: NhomEm | null;
  bac: number; bacNhan: string | null; keTiep: { nhan: string; bac: number };
  xuLy: { duoc: boolean; lyDo: ChuKhoa | null; soViPham: number; tomTat: string };
  ghiNhan: { duoc: boolean; lyDo: ChuKhoa | null; soMoi: number };
  /** `khai`: bậc đã khai của chuỗi (0 = "Chưa có xử lý vi phạm"), null = chưa khai. N70 `cho`: yêu cầu sửa bậc đang chờ Head (bậc xin · hạn duyệt). */
  capBac: { duoc: boolean; lyDo: ChuKhoa | null; khai: number | null; luc: string | null; cho: { id: number; bac: number; han: string | null } | null };
};
export type BangLo = { classId: number; classCode: string; canManage: boolean; laQl: boolean; em: EmLo[] };
/** `truoc` / `bac` (Xác nhận cấp bậc): bậc khai trước khi lưu (null = chưa khai) và bậc vừa lưu — web giữ để Hoàn tác cả lô. */
export type BacKhai = { bac: number; thang: string | null; ghiChu: string };
/** N70 `guiDuyet` + `ycId`: em đã khai, GVCN sửa → KHÔNG áp, đã gửi Head duyệt (Hoàn tác = rút thẻ `ycId`). */
export type KqEm = { studentId: number; ten: string; ok: boolean; loi?: ChuKhoa; nhan?: string; ids?: number[]; truoc?: BacKhai | null; bac?: number; guiDuyet?: true; ycId?: number;
  /** Lần gửi này GHI ĐÈ một thẻ đang chờ từ trước → Hoàn tác khôi phục nội dung thẻ cũ (máy chủ giữ), không rút. */ ghiDe?: true };

function lopCua(classId: number): { id: number; code: string } {
  const cls = db().prepare('SELECT id, code FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  return cls;
}

function hvCua(ids: readonly number[]): Map<number, { full_name: string; student_code: string }> {
  const out = new Map<number, { full_name: string; student_code: string }>();
  for (let i = 0; i < ids.length; i += 400) {
    const lo = ids.slice(i, i + 400);
    for (const r of db().prepare(`SELECT id, full_name, student_code FROM students WHERE id IN (${lo.map(() => '?').join(',')})`).all(...lo) as any[]) out.set(r.id, r);
  }
  return out;
}

/** Vi phạm đưa vào lần xử lý — đúng tick mặc định của panel một em (`macDinhTick`). */
const viPhamXuLy = (em: EmYThuc, homNay: string) =>
  macDinhTick(em.dsViPham.map((v) => ({ id: v.id, t: em.viPham.get(v.id)!.t, occurredOn: v.occurredOn })), homNay).tick;
/** Vi phạm Mới chưa ai ghi nhận (kể cả Mới quá hạn) — đúng nút Ghi nhận của từng vi phạm. */
const viPhamMoi = (em: EmYThuc) => [...em.viPham].filter(([, t]) => t.t === 'moi' || (t.t === 'qua_han' && t.lyDoQuaHan === 'xem')).map(([id]) => id);

function lyDoXuLy(em: EmYThuc): ChuKhoa | null {
  if (em.coChoDuyet) {
    const cho = em.xuLy.filter((m) => m.status === 'cho_duyet').sort((a, b) => b.id - a.id)[0];
    return kem('có đề xuất {nhan} chờ Head duyệt', { nhan: cho ? nhanLoaiXuLy(cho.kind, cho.customName) : '' });
  }
  if (em.soBatBuoc === 0) return em.soMoi > 0 ? kem('chưa bắt buộc — dùng Ghi nhận') : kem('không có vi phạm bắt buộc xử lý');
  return null;
}
/** RKC-3b: `vuot` = Quản lý (vượt luật bắt buộc xử lý — lô hỏi một câu trước). */
function lyDoGhiNhan(em: EmYThuc, vuot = false): ChuKhoa | null {
  if (em.soBatBuoc > 0) return vuot ? null : kem('đang bắt buộc xử lý — dùng Xác nhận xử lý (Head Ghi nhận được)');
  return viPhamMoi(em).length ? null : kem('không có vi phạm Mới');
}
/** N66 (chủ SP 24/11): khai / sửa mọi lúc, cả khi chuỗi đã có xử lý trên web — chỉ chặn em chưa có lộ trình. RKC-3a: em Tạm dừng khai được. */
function lyDoCapBac(em: EmYThuc): ChuKhoa | null {
  return em.chuoi.length ? null : kem('chưa có lộ trình');
}

const tomTat = (em: EmYThuc, ids: readonly number[]) => {
  const dem = new Map<string, number>();
  for (const v of em.dsViPham) if (ids.includes(v.id)) dem.set(v.category, (dem.get(v.category) ?? 0) + 1);
  return [...dem].sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${VIOLATION_CATEGORY_LABEL[k as ViolationCategory] ?? k}${n > 1 ? ` ×${n}` : ''}`).join(' · ');
};

/** Bảng chọn nhiều của tab Ý thức lớp: MỌI em đang học (kể cả em chưa có vi phạm — để Xác nhận cấp bậc), theo tên. */
export function loYThucLop(p: Principal, classId: number): BangLo {
  const cls = lopCua(classId);
  requireViewClass(p, classId);
  const homNay = demoToday();
  const ids = emCuaLop(classId);
  const trang = trangThaiYThuc(ids, homNay);
  const hv = hvCua(ids);
  const laQl = duyetYThuc(p, { classId });
  const em: EmLo[] = ids.map((sid) => {
    const e = trang.get(sid)!;
    const tick = viPhamXuLy(e, homNay);
    const lx = lyDoXuLy(e); const lg = lyDoGhiNhan(e, laQl); const lc = lyDoCapBac(e);
    return {
      studentId: sid, ten: hv.get(sid)?.full_name ?? '', nhom: e.nhom,
      bac: e.bac, bacNhan: e.bac > 0 ? nhanLoaiXuLy(kindCuaBac(e.bac)) : null,
      keTiep: { nhan: nhanLoaiXuLy(e.keTiep.kind), bac: e.keTiep.bac },
      xuLy: { duoc: !lx, lyDo: lx, soViPham: tick.length, tomTat: tomTat(e, tick) },
      ghiNhan: { duoc: !lg, lyDo: lg, soMoi: viPhamMoi(e).length },
      capBac: { duoc: !lc, lyDo: lc, khai: e.khai ? e.khai.bac : null, luc: e.khai ? e.khai.luc : null,
        cho: e.khai?.cho ? { id: e.khai.cho.id, bac: e.khai.cho.bac, han: e.khai.cho.han } : null },
    };
  }).sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  return { classId, classCode: cls.code, canManage: can(p, PERMISSIONS.DISCIPLINE_MANAGE, { classId }), laQl, em };
}

/**
 * Khung chung của ba hành động: lớp có thật, quyền xử lý Ý thức của LỚP — MỘT lần (GV khác 403 cả lô), danh sách em sạch, em đang học lớp này
 * (ghi danh `active`, đúng lớp em đang học như `activeClassOf` / `lopId`), trạng thái + ngày nghiệp vụ đọc một lượt.
 */
function chuanBi(p: Principal, classId: number, studentIds: unknown[]) {
  const cls = lopCua(classId);
  require_(p, PERMISSIONS.DISCIPLINE_MANAGE, { classId }, MANAGE_MESSAGE);
  const ids = [...new Set(studentIds.map(Number).filter((x) => Number.isInteger(x) && x > 0))];
  if (!ids.length) throw badRequest('Chọn ít nhất một em.');
  if (ids.length > LO_TOI_DA) throw loi(400, 'Một lần tối đa {n} em.', { n: LO_TOI_DA });
  const homNay = demoToday();
  const trongLop = new Set((db().prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' AND student_id IN (${ids.map(() => '?').join(',')})`)
    .all(classId, ...ids) as any[]).map((r) => r.student_id as number));
  return { cls, ids, homNay, trongLop, hv: hvCua(ids), trang: trangThaiYThuc(ids, homNay), laQl: duyetYThuc(p, { classId }) };
}
type Lo = ReturnType<typeof chuanBi>;
type HvLo = { full_name: string; student_code: string };

/** Chạy từng em, lỗi em nào giữ ở em đó. Em không còn học lớp này báo riêng (quyền đã xét theo lớp). */
function tungEm(c: Lo, fn: (sid: number, em: EmYThuc, hv: HvLo) => Omit<KqEm, 'studentId' | 'ten' | 'ok'>): KqEm[] {
  return c.ids.map((sid) => {
    const hv = c.hv.get(sid);
    const em = c.trang.get(sid)!;
    const ten = hv?.full_name ?? '';
    if (!hv || !c.trongLop.has(sid) || em.lopId !== c.cls.id) return { studentId: sid, ten, ok: false, loi: kem('Em không học lớp này') };
    try {
      return { studentId: sid, ten, ok: true, ...fn(sid, em, hv) };
    } catch (e: any) {
      if (e instanceof HttpError) return { studentId: sid, ten, ok: false, loi: { chu: e.message, khoa: e.khoa, bien: e.bien } };
      console.error('[y-thuc lô]', sid, e);
      return { studentId: sid, ten, ok: false, loi: kem('Lỗi máy chủ — chưa lưu em này, thử lại.') };
    }
  });
}
const loiEm = (lyDo: ChuKhoa) => Object.assign(badRequest(lyDo.chu), { khoa: lyDo.khoa, bien: lyDo.bien });

export function loXuLy(p: Principal, classId: number, v: {
  em?: unknown; performedOn?: unknown; performerUserId?: unknown; performerName?: unknown; note?: unknown; idempotencyKey?: unknown;
}): { em: KqEm[] } {
  const ds = (Array.isArray(v.em) ? v.em : []).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');
  const c = chuanBi(p, classId, ds.map((x) => x.studentId));
  const rieng = new Map(ds.map((x) => [Number(x.studentId), x]));
  /* Ngày · người · mô tả chung sai thì cả lô 400 (một chỗ sửa); mô tả chung chỉ bắt buộc khi còn em không có mô tả riêng. */
  const performedOn = ngayThucHien(v.performedOn);
  const nguoi = nguoiThucHien(p, v);
  const chung = String(v.note ?? '').trim();
  if (chung) moTa(chung);   // N56 ③: mô tả chung trống được — em không có mô tả riêng thì máy tự ghi "{BẬC} · {vi phạm}" (`luuXuLy`)
  const key = typeof v.idempotencyKey === 'string' && v.idempotencyKey.trim() ? v.idempotencyKey.trim().slice(0, 100) : null;
  const khoaEm = (sid: number) => (key ? `${key}:${sid}` : null);
  /* Gửi lại cùng khoá (mất phản hồi, Thử lại): em đã lưu trả lần cũ — không bị loại vì "không còn bắt buộc". Một câu cho cả lô. */
  const daGui = new Map<string, { student_id: number; created_by: number; kind: string }>();
  if (key) {
    const ks = c.ids.map((sid) => khoaEm(sid)!);
    for (const r of db().prepare(`SELECT idempotency_key AS k, student_id, created_by, kind FROM discipline_measures WHERE idempotency_key IN (${ks.map(() => '?').join(',')})`).all(...ks) as any[]) daGui.set(r.k, r);
  }
  return {
    em: tungEm(c, (sid, em, hv) => {
      const k = khoaEm(sid);
      const cu = k ? daGui.get(k) : undefined;
      if (cu) {
        if (cu.student_id !== sid || cu.created_by !== p.userId) throw badRequest(KEY_TAKEN_MESSAGE);
        return { nhan: nhanLoaiXuLy(cu.kind) };
      }
      const ld = lyDoXuLy(em);
      if (ld) throw loiEm(ld);
      const note = String(rieng.get(sid)?.note ?? '').trim();
      const m = luuXuLy(p, hv, sid, {
        violationIds: viPhamXuLy(em, c.homNay), performedOn, nguoi, note: note ? moTa(note) : chung, key: k, bacDaThay: rieng.get(sid)?.bacDaThay,
      }, c.homNay);
      return { nhan: nhanLoaiXuLy(m.kind) };
    }),
  };
}

export function loGhiNhan(p: Principal, classId: number, v: { studentIds?: unknown }): { em: KqEm[] } {
  const c = chuanBi(p, classId, Array.isArray(v.studentIds) ? v.studentIds : []);
  /* RKC-3b (PTA 07/11): Quản lý vượt luật bắt buộc xử lý cho cả lô — MỘT câu hỏi nêu số em. */
  const batBuoc = c.laQl ? c.ids.filter((sid) => c.trongLop.has(sid) && (c.trang.get(sid)?.soBatBuoc ?? 0) > 0).length : 0;
  if (batBuoc) canXacNhan('{n} em đang phải xử lý bắt buộc — vẫn chỉ Ghi nhận cả lô (bỏ qua luật xử lý)?', { n: batBuoc }, 'Vẫn ghi nhận');
  return {
    em: tungEm(c, (sid, em, hv) => {
      const moi = c.laQl && em.soBatBuoc > 0 ? [...em.viPham].filter(([, t]) => t.t === 'moi' || t.t === 'can_xu_ly' || t.t === 'qua_han').map(([id]) => id) : viPhamMoi(em);
      /* Gửi lại sau khi mất phản hồi: vi phạm đã ghi nhận hôm nay → báo đã ghi nhận (không báo lỗi "không có vi phạm Mới"). */
      if (!moi.length && em.soBatBuoc === 0) {
        const daCo = em.dsViPham.filter((x) => x.ghiNhanLuc === c.homNay && em.viPham.get(x.id)?.t === 'da_ghi_nhan').map((x) => x.id);
        if (daCo.length) return { ids: daCo };
      }
      const ld = lyDoGhiNhan(em, c.laQl);
      if (ld) throw loiEm(ld);
      /* Không đổi dòng nào (người khác vừa ghi nhận) → không trả id, để Hoàn tác không gỡ ghi nhận của người khác. */
      return { ids: luuGhiNhan(p, hv, sid, moi, c.homNay) ? moi : [] };
    }),
  };
}

/**
 * KHAI-BAC-LO (mockup `thiet-ke/v7/khai-bac-lo.html`, chủ SP 28/10): tháng + ghi chú CHUNG cho cả lô (tuỳ chọn; sai định dạng → cả lô 400, một
 * chỗ sửa). Bỏ trống: em đã khai giữ tháng / ghi chú cũ; em khai mới ghi chú tự điền "Xác nhận theo lớp …". Mỗi em trả `truoc` + `bac` để Hoàn tác.
 */
export function loCapBac(p: Principal, classId: number, v: { em?: unknown; thang?: unknown; ghiChu?: unknown }): { em: KqEm[] } {
  const ds = (Array.isArray(v.em) ? v.em : []).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');
  const c = chuanBi(p, classId, ds.map((x) => x.studentId));
  const chung = kiemKhai({ bac: 0, thang: v.thang, ghiChu: v.ghiChu });
  const theoEm = new Map(ds.map((x) => [Number(x.studentId), x]));
  return {
    em: tungEm(c, (sid, em, hv) => {
      const ld = lyDoCapBac(em);
      if (ld) throw loiEm(ld);
      const x = theoEm.get(sid)!;
      /* Tháng riêng từng em (web: em khai mới / người dùng đã chạm ô tháng) thắng tháng chung; không gửi → giữ tháng cũ của em đã khai. */
      const k = kiemKhai({
        bac: x.bac,
        thang: x.thang !== undefined ? x.thang : chung.thang ?? em.khai?.thang ?? null,
        ghiChu: chung.ghiChu || (em.khai ? em.khai.ghiChu : `Xác nhận theo lớp ${c.cls.code}`),
      });
      const truoc: BacKhai | null = em.khai ? { bac: em.khai.bac, thang: em.khai.thang, ghiChu: em.khai.ghiChu } : null;
      const nhan = k.bac > 0 ? nhanLoaiXuLy(kindCuaBac(k.bac)) : BAC_0_NHAN;
      /* N70 (chủ SP 24/11): em ĐÃ KHAI mà người lưu không phải người duyệt (GVCN) → gửi Head duyệt từng em, bậc cũ giữ; lý do = ghi chú chung (bắt buộc). */
      if (em.khai && !c.laQl) {
        const g = guiSuaKhai(p, hv, sid, { ...k, ghiChu: chung.ghiChu }, c.homNay);
        return { nhan, truoc, bac: k.bac, guiDuyet: true as const, ycId: g.yeuCauId, ...(g.ghiDe ? { ghiDe: true as const } : {}) };
      }
      if (em.khai) luuSuaKhai(p, hv, sid, k, c.homNay);
      else luuKhai(p, hv, sid, k, c.homNay);
      return { nhan, truoc, bac: k.bac };
    }),
  };
}

/**
 * Hoàn tác chỉ cho lần lưu của CHÍNH người bấm, trong hôm nay (người ghi cuối dòng khai = người này, ngày ghi = hôm nay) — gửi giả `truoc: null`
 * không xoá được bậc người khác đã khai / bậc khai từ trước (rà KHAI-BAC-LO, bảo mật).
 */
function chiLanCuaMinh(p: Principal, sid: number, em: EmYThuc, homNay: string, xoa = false) {
  const r = db().prepare('SELECT khai_boi, khai_luc, sua_boi, sua_luc FROM y_thuc_khai_bac WHERE student_id = ? AND chuoi_cycle_id = ?').get(sid, em.khai?.cycleId ?? em.chuoi[0]) as any;
  /* N70: XOÁ dòng khai (về "chưa khai") chỉ khi dòng chưa từng được sửa — dòng đã qua Head duyệt / tự chốt không xoá rồi khai lại để né duyệt. */
  if (xoa && r?.sua_luc) throw badRequest('Bậc của em đã đổi sau lần lưu này — không hoàn tác em này.');
  const boi = r?.sua_boi ?? r?.khai_boi, luc: string | null = r?.sua_luc ?? r?.khai_luc ?? null;
  /* N66: lần lưu mới ghi giờ thật (`nowIso`) → so ngày VN với hôm nay thật; dòng cũ ghi ngày nghiệp vụ → so `homNay` như trước. */
  const homNayCuaLuc = luc && luc.length > 10 ? ngayTheoGioVN(luc) === todayInBusinessTz() : luc === homNay;
  if (!r || boi !== p.userId || !homNayCuaLuc) throw badRequest('Chỉ hoàn tác được lần lưu của chính bạn trong hôm nay.');
}

/**
 * Bản TRƯỚC lần sửa bậc gần nhất, do máy chủ ghi (`discipline.declare_level_edit`.before) — chỉ khi lần ghi dòng khai cuối của em là lần sửa của
 * CHÍNH `p` và đã ra đúng bậc `sau`; null = không có lần sửa nào của `p` để hoàn tác. Nhật ký cũ (trước 25/11, chỉ có bậc) → null: không đoán tháng / ghi chú.
 */
function banTruocCuaMinh(p: Principal, sid: number, sau: number): { bac: number; thang: string | null; ghiChu: string; cycleId: number } | null {
  const a = db().prepare(`SELECT actor_user_id, action, before_json, after_json FROM audit_logs WHERE entity_type = 'student' AND entity_id = ?
    AND action IN ('discipline.declare_level', 'discipline.declare_level_edit', 'discipline.declare_level_undo') ORDER BY id DESC LIMIT 1`).get(sid) as any;
  if (a?.action !== 'discipline.declare_level_edit' || a.actor_user_id !== p.userId) return null;
  const b = JSON.parse(a.before_json ?? 'null'), s = JSON.parse(a.after_json ?? 'null');
  if (s?.bac !== sau || typeof b?.bac !== 'number' || typeof b.ghiChu !== 'string' || typeof b.cycleId !== 'number') return null;
  return { bac: b.bac, thang: b.thang ?? null, ghiChu: b.ghiChu, cycleId: b.cycleId };
}

/**
 * KHAI-BAC-LO · Hoàn tác cả lô: trả mỗi em về bậc trước máy chủ đã ghi (`banTruocCuaMinh`; không có = xoá dòng khai vừa tạo) — CHỈ khi bậc khai hiện tại vẫn là `bac` vừa lưu (người khác đổi
 * sau đó thì em đó báo riêng, không đè). Quyền như khai / sửa: lớp một lần (`chuanBi`); xoá dòng khai (về "chưa khai") khi chuỗi chưa có lần xử lý
 * trên web, trừ QL. Nhật ký từng em (`discipline.declare_level_undo`).
 */
export function loHoanTacCapBac(p: Principal, classId: number, v: { em?: unknown }): { em: KqEm[] } {
  const ds = (Array.isArray(v.em) ? v.em : []).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');
  const c = chuanBi(p, classId, ds.map((x) => x.studentId));
  const theoEm = new Map(ds.map((x) => [Number(x.studentId), x]));
  return {
    em: tungEm(c, (sid, em, hv) => {
      const x = theoEm.get(sid)!;
      /* N70: em vừa GỬI Head duyệt → Hoàn tác = Rút đúng thẻ đang chờ của em (thẻ của chính người bấm — `rutYeuCau` kiểm). */
      if (x.ycId != null) {
        if (em.khai?.cho?.id !== Number(x.ycId)) throw badRequest('Yêu cầu sửa bậc của em không còn chờ Head — không hoàn tác em này.');
        /* PTA rà #2058: lô GHI ĐÈ thẻ gửi từ trước → trả nội dung cũ (thẻ vẫn chờ); thẻ lô vừa tạo → rút. */
        if (!khoiPhucSuaKhai(p, sid, em.khai.cho.id)) rutYeuCau(p, em.khai.cho.id);
        return { nhan: '' };
      }
      const sau = Number(x.bac);
      if (!em.khai || em.khai.bac !== sau) throw badRequest('Bậc của em đã đổi sau lần lưu này — không hoàn tác em này.');
      /* Rà Hoàn tác 25/11: bậc trước lấy từ nhật ký MÁY CHỦ ghi lúc sửa (`truoc` web gửi bỏ qua) — lần ghi cuối là lần sửa của chính người bấm
         thì về bản trước đó; không thì chỉ còn đường xoá dòng vừa khai (dưới), `chiLanCuaMinh` chặn mọi trường hợp khác. Đọc + ghi cùng giao dịch. */
      const tr = tx(() => {
        const b = banTruocCuaMinh(p, sid, sau);
        if (!b) return null;
        /* N70: "về bậc trước" là SỬA bậc đã khai — chỉ người áp thẳng được (Head / Quản trị); GVCN không có lần sửa thẳng nào để hoàn tác. */
        if (!c.laQl) throw forbidden('Sửa bậc đã khai cần Head duyệt — không hoàn tác em này.');
        luuSuaKhai(p, hv, sid, kiemKhai(b, true), c.homNay, { bacCu: sau, cycleId: b.cycleId, hoanTac: (e) => chiLanCuaMinh(p, sid, e, c.homNay) });
        return b;
      });
      if (tr) return { nhan: tr.bac > 0 ? nhanLoaiXuLy(kindCuaBac(tr.bac)) : BAC_0_NHAN };
      tx(() => {
        const lai = trangThaiYThuc([sid], c.homNay).get(sid)!;
        if (!lai.khai || lai.khai.bac !== sau) throw badRequest('Bậc của em đã đổi sau lần lưu này — không hoàn tác em này.');
        chiLanCuaMinh(p, sid, lai, c.homNay, true);
        db().prepare('DELETE FROM y_thuc_khai_bac WHERE student_id = ? AND chuoi_cycle_id = ?').run(sid, lai.khai.cycleId);
        writeAudit({ actorUserId: p.userId, action: 'discipline.declare_level_undo', entityType: 'student', entityId: sid,
          entityLabel: `${hv.student_code} · hoàn tác cấp bậc`, before: { bac: sau }, after: null });
      });
      return { nhan: '' };
    }),
  };
}
