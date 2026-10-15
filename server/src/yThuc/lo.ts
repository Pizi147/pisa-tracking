/**
 * Ý THỨC NHIỀU EM CÙNG LÚC Ở MỨC LỚP (OV-13d — đặc tả OV-13 §0 Q5, §3 dòng 5; mockup OV-13 mục 4).
 *
 * Tab Ý thức của lớp và dòng gộp Ý thức ở Công việc chọn nhiều em → ba hành động:
 *   Xác nhận xử lý chung   ngày · người · mô tả chung (sửa riêng từng em được); mỗi em tự lấy bậc kế (máy chủ tính). Em chưa bắt buộc / có đề
 *                          xuất chờ QL bị loại kèm lý do — cùng luật việc `yt_xu_ly` ở Công việc (`soBatBuoc > 0 && !coChoDuyet`).
 *   Ghi nhận               mọi vi phạm Mới (kể cả Mới quá hạn) của em; em đang bắt buộc xử lý không Ghi nhận được (V4-2).
 *   Xác nhận cấp bậc       bậc 0 "Chưa có xử lý vi phạm" … WL 2; em đã có lần xử lý trên web khoá (chỉ QL sửa bậc đã khai — giữ luật).
 *
 * Mỗi em đi qua ĐÚNG phần ghi của hàm một em (`luuXuLy` · `luuGhiNhan` · `luuKhai` / `luuSuaKhai`): mỗi em một giao dịch, luật tính lại trong
 * giao dịch, giữ khoá chống gửi trùng (khoá lô + `:{em}`) và `bacDaThay`; lỗi em nào báo riêng em đó, em khác vẫn lưu.
 * Rà #408 (Netlify ~7,5 s, Turso ~20–50 ms/câu): quyền xét theo LỚP một lần, trạng thái các em đọc một lượt, ngày nghiệp vụ đọc một lần,
 * không đọc lại lần xử lý vừa ghi — xử lý ~12 câu / em, cấp bậc ~5 câu / em (phép kiểm OV13d-6 khoá); web chia lô ≤ 4 / ≤ 12 em mỗi lời gọi.
 */
import { db } from '../db.ts';
import {
  BAC_0_NHAN, PERMISSIONS, VIOLATION_CATEGORY_LABEL, kindCuaBac, macDinhTick, nhanLoaiXuLy,
  type NhomEm, type ViolationCategory,
} from '../../../shared/domain/index.ts';
import { kem, type ChuKhoa } from '../../../shared/i18n/index.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { HttpError, badRequest, loi, notFound } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { requireViewClass } from './access.ts';
import { emCuaLop, trangThaiYThuc, type EmYThuc } from './trangThai.ts';
import { MANAGE_MESSAGE, kiemKhai, luuGhiNhan, luuKhai, luuSuaKhai, luuXuLy, moTa, ngayThucHien, nguoiThucHien } from './xuLy.ts';
import { KEY_TAKEN_MESSAGE } from './access.ts';

/** Một lô tối đa — một lớp đông nhất ~40 em; chặn thân request quá lớn. */
const LO_TOI_DA = 200;

export type EmLo = {
  studentId: number; ten: string; nhom: NhomEm | null;
  bac: number; bacNhan: string | null; keTiep: { nhan: string; bac: number };
  xuLy: { duoc: boolean; lyDo: ChuKhoa | null; soViPham: number; tomTat: string };
  ghiNhan: { duoc: boolean; lyDo: ChuKhoa | null; soMoi: number };
  /** `khai`: bậc đã khai của chuỗi (0 = "Chưa có xử lý vi phạm"), null = chưa khai. */
  capBac: { duoc: boolean; lyDo: ChuKhoa | null; khai: number | null };
};
export type BangLo = { classId: number; classCode: string; canManage: boolean; laQl: boolean; em: EmLo[] };
export type KqEm = { studentId: number; ten: string; ok: boolean; loi?: ChuKhoa; nhan?: string; ids?: number[] };

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
    return kem('có đề xuất {nhan} chờ QL duyệt', { nhan: cho ? nhanLoaiXuLy(cho.kind, cho.customName) : '' });
  }
  if (em.soBatBuoc === 0) return em.soMoi > 0 ? kem('chưa bắt buộc — dùng Ghi nhận') : kem('không có vi phạm bắt buộc xử lý');
  return null;
}
function lyDoGhiNhan(em: EmYThuc): ChuKhoa | null {
  if (em.soBatBuoc > 0) return kem('đang bắt buộc xử lý — dùng Xác nhận xử lý');
  return viPhamMoi(em).length ? null : kem('không có vi phạm Mới');
}
function lyDoCapBac(em: EmYThuc, laQl: boolean): ChuKhoa | null {
  if (!em.chuoi.length) return kem('chưa có lộ trình');
  if (em.khai) return laQl || em.khai.coTheSua ? null : kem('đã có xử lý · chỉ QL sửa');
  if (em.soXuLyChuoi > 0) return kem('đã có xử lý trên web');
  return em.tamDung ? kem('em đang Tạm dừng') : null;   // như `khaiDuoc` (xuLy.ts) — em Tạm dừng không khai mới
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
  const laQl = can(p, PERMISSIONS.REQUEST_APPROVE, { classId });
  const em: EmLo[] = ids.map((sid) => {
    const e = trang.get(sid)!;
    const tick = viPhamXuLy(e, homNay);
    const lx = lyDoXuLy(e); const lg = lyDoGhiNhan(e); const lc = lyDoCapBac(e, laQl);
    return {
      studentId: sid, ten: hv.get(sid)?.full_name ?? '', nhom: e.nhom,
      bac: e.bac, bacNhan: e.bac > 0 ? nhanLoaiXuLy(kindCuaBac(e.bac)) : null,
      keTiep: { nhan: nhanLoaiXuLy(e.keTiep.kind), bac: e.keTiep.bac },
      xuLy: { duoc: !lx, lyDo: lx, soViPham: tick.length, tomTat: tomTat(e, tick) },
      ghiNhan: { duoc: !lg, lyDo: lg, soMoi: viPhamMoi(e).length },
      capBac: { duoc: !lc, lyDo: lc, khai: e.khai ? e.khai.bac : null },
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
  return { cls, ids, homNay, trongLop, hv: hvCua(ids), trang: trangThaiYThuc(ids, homNay), laQl: can(p, PERMISSIONS.REQUEST_APPROVE, { classId }) };
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
  if (c.ids.some((sid) => !String(rieng.get(sid)?.note ?? '').trim())) moTa(chung);
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
  return {
    em: tungEm(c, (sid, em, hv) => {
      const moi = viPhamMoi(em);
      /* Gửi lại sau khi mất phản hồi: vi phạm đã ghi nhận hôm nay → báo đã ghi nhận (không báo lỗi "không có vi phạm Mới"). */
      if (!moi.length && em.soBatBuoc === 0) {
        const daCo = em.dsViPham.filter((x) => x.ghiNhanLuc === c.homNay && em.viPham.get(x.id)?.t === 'da_ghi_nhan').map((x) => x.id);
        if (daCo.length) return { ids: daCo };
      }
      const ld = lyDoGhiNhan(em);
      if (ld) throw loiEm(ld);
      /* Không đổi dòng nào (người khác vừa ghi nhận) → không trả id, để Hoàn tác không gỡ ghi nhận của người khác. */
      return { ids: luuGhiNhan(p, hv, sid, moi, c.homNay) ? moi : [] };
    }),
  };
}

export function loCapBac(p: Principal, classId: number, v: { em?: unknown }): { em: KqEm[] } {
  const ds = (Array.isArray(v.em) ? v.em : []).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');
  const c = chuanBi(p, classId, ds.map((x) => x.studentId));
  const bacCua = new Map(ds.map((x) => [Number(x.studentId), x.bac]));
  return {
    em: tungEm(c, (sid, em, hv) => {
      const ld = lyDoCapBac(em, c.laQl);
      if (ld) throw loiEm(ld);
      /* Bảng không có ô ghi chú (mockup mục 4): ghi chú tự điền nơi xác nhận; sửa bậc đã khai giữ tháng + ghi chú cũ. */
      const k = kiemKhai(em.khai ? { bac: bacCua.get(sid), thang: em.khai.thang, ghiChu: em.khai.ghiChu } : { bac: bacCua.get(sid), ghiChu: `Xác nhận theo lớp ${c.cls.code}` });
      if (em.khai) luuSuaKhai(p, hv, sid, k, c.laQl, c.homNay);
      else luuKhai(p, hv, sid, k, c.homNay);
      return { nhan: k.bac > 0 ? nhanLoaiXuLy(kindCuaBac(k.bac)) : BAC_0_NHAN };
    }),
  };
}
