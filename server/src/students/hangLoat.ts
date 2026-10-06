import { db, theoLo, tx } from '../db.ts';
import {
  LO_HANG_LOAT_EM, PERMISSIONS, TOI_DA_HANG_LOAT_EM, VIEC_HANG_LOAT,
  type DongXemTruoc, type KetQuaHangLoat, type ViecHangLoat, type XemTruocHangLoat,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { HttpError, badRequest, chuTuDo, forbidden } from '../util.ts';
import { can, napTruocPhamVi, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { chanGiaoDichNeuSapHetGio } from '../platform/hanGio.ts';
import { huyNhieuLenh, khoiPhucLenh } from '../classes/lenhChuyen.ts';
import { archiveStudent, hoanTacHocLai, hoanTacKetThuc, hocLai, setStudentStatus, unarchiveStudent } from './students.ts';

/**
 * LÀM NHIỀU HỌC VIÊN MỘT LẦN (PR-LUI-b, chủ sản phẩm 06/10) — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại · Huỷ chuyển lớp · Khôi phục chuyển lớp. CHỈ Quản lý /
 * Quản trị (`plan.week` của TỪNG học viên). Không có luật riêng: mỗi học viên đi qua đúng hàm một em (`setStudentStatus`, `archiveStudent`, `unarchiveStudent`,
 * `hocLai`, `huyNhieuLenh`, `khoiPhucLenh`). MỖI HỌC VIÊN MỘT GIAO DỊCH — lỗi một em (ngoài quyền, sai trạng thái, máy chủ sắp hết giờ) không cuộn lại các em đã xong; kết quả
 * trả `ok` + `failed` để web nói "Đã lưu n học viên · m học viên chưa lưu".
 * ponytail: không có "một giao dịch cho cả lô" — cố ý (lỗi giữa chừng phải giữ phần đã lưu); thêm khoá chống gửi trùng nếu cần: các việc đều lặp lại an toàn.
 */
const CHI_QL = 'Chỉ Quản lý mới làm được việc này cho nhiều học viên.';

function docViec(v: unknown): ViecHangLoat {
  if (!(VIEC_HANG_LOAT as readonly unknown[]).includes(v)) throw badRequest('Việc không hợp lệ.');
  return v as ViecHangLoat;
}
function docIds(v: unknown, toiDa: number): number[] {
  if (!Array.isArray(v) || !v.length) throw badRequest('Chưa chọn học viên nào.');
  const ids = [...new Set(v.map(Number))];
  if (ids.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Mã học viên không hợp lệ.');
  if (ids.length > toiDa) throw badRequest(`Tối đa ${toiDa} học viên một lần.`);
  return ids;
}

type Em = { s: any; lopCuoi: any | null; lenhCho: any | null; lenhHuy: any | null };

/** Em này có làm được `viec` không? Chữ = KHÔNG (lý do ngắn hiện ở màn xem trước và ở "chưa lưu"); `null` = làm được. */
function lyDoBo(p: Principal, viec: ViecHangLoat, e: Em): string | null {
  const { s, lopCuoi } = e;
  if (!can(p, PERMISSIONS.PLAN_WEEK, { studentId: s.id })) return 'Ngoài phạm vi của bạn.';
  switch (viec) {
    case 'ket-thuc': return s.status === 'finished' ? 'Đã kết thúc học' : null;
    case 'luu-tru': return s.status !== 'finished' ? 'Chưa kết thúc học' : s.archived_at ? 'Đã lưu trữ' : null;
    case 'bo-luu-tru': return s.archived_at ? null : 'Chưa lưu trữ';
    case 'hoc-lai': return s.status !== 'finished' ? 'Đang học' : lopCuoi?.status !== 'completed' ? 'Chưa có lớp để học lại' : null;
    case 'huy-lenh': return e.lenhCho ? null : 'Chưa có quyết định chuyển lớp';
    case 'khoi-phuc-lenh': return e.lenhHuy ? null : 'Không có quyết định vừa huỷ để khôi phục';
    case 'hoan-tac-ket-thuc': return s.status === 'finished' ? null : 'Không còn ở trạng thái kết thúc học';
    case 'hoan-tac-hoc-lai': return s.status === 'active' ? null : 'Không còn ở trạng thái đang học';
  }
}

function docEm(ids: number[]): Map<number, Em> {
  const conn = db();
  const kq = new Map<number, Em>();
  theoLo(ids, (lo, ph) => {
    for (const s of conn.prepare(`SELECT id, student_code, full_name, status, archived_at FROM students WHERE id IN (${ph})`).all(...lo) as any[]) {
      kq.set(s.id, { s, lopCuoi: null, lenhCho: null, lenhHuy: null });
    }
    /* Ghi danh MỚI NHẤT mỗi em (id lớn nhất đè) — cùng cách `hocLai` chọn dòng `completed` cuối. */
    for (const r of conn.prepare(
      `SELECT e.student_id, e.status, e.class_id, c.code, c.status AS class_status FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.student_id IN (${ph}) ORDER BY e.id`,
    ).all(...lo) as any[]) { const e = kq.get(r.student_id); if (e) e.lopCuoi = r; }
    for (const l of conn.prepare(`SELECT id, student_id, huong, lop_nguon_id FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND student_id IN (${ph})`).all(...lo) as any[]) {
      const e = kq.get(l.student_id); if (e) e.lenhCho = l;
    }
    /* Quyết định huỷ GẦN NHẤT của em (lệnh nào cũng được — `khoiPhucLenh` kiểm người huỷ, giờ, tuần, em còn ở lớp nguồn). */
    for (const l of conn.prepare(`SELECT id, student_id, huong, lop_nguon_id FROM lenh_chuyen_lop WHERE trang_thai = 'huy' AND student_id IN (${ph}) ORDER BY id`).all(...lo) as any[]) {
      const e = kq.get(l.student_id); if (e) e.lenhHuy = l;
    }
  });
  return kq;
}

/** POST /hang-loat-hoc-vien/xem-truoc — KHÔNG ghi gì. Mỗi học viên một dòng (`lyDoBo`) + số hệ quả của cả lô. */
export function xemTruoc(p: Principal, input: { viec?: unknown; studentIds?: unknown }): XemTruocHangLoat {
  const viec = docViec(input?.viec);
  const ids = docIds(input?.studentIds, TOI_DA_HANG_LOAT_EM);
  napTruocPhamVi(ids);
  const em = docEm(ids);
  /* Chỉ người có quyền ở ÍT NHẤT một học viên mới được xem trước (GVCN / GVBM → 403 cả lô, như `chay`); em ngoài phạm vi chỉ hiện "#id" — không lộ tên, mã, lớp. */
  const trongPhamVi = (id: number) => em.has(id) && can(p, PERMISSIONS.PLAN_WEEK, { studentId: id });
  if (!ids.some(trongPhamVi)) throw forbidden(CHI_QL);
  const rows: DongXemTruoc[] = ids.map((id) => {
    const e = em.get(id);
    if (!e) return { studentId: id, ten: `#${id}`, ma: '', lop: null, trangThai: 'dang-hoc', lyDoBo: 'Không tìm thấy học viên.' };
    if (!trongPhamVi(id)) return { studentId: id, ten: `#${id}`, ma: '', lop: null, trangThai: 'dang-hoc', lyDoBo: 'Ngoài phạm vi của bạn.' };
    const s = e.s;
    return {
      studentId: id, ten: s.full_name, ma: s.student_code, lop: e.lopCuoi?.code ?? null,
      trangThai: s.archived_at ? 'luu-tru' : s.status === 'finished' ? 'da-ket-thuc' : s.status === 'inactive' ? 'tam-dung' : 'dang-hoc',
      lyDoBo: lyDoBo(p, viec, e),
    };
  });
  const duoc = rows.filter((r) => !r.lyDoBo);
  const tong = { duoc: duoc.length, boQua: rows.length - duoc.length, caseDong: 0, paHuy: 0, lenhHuy: 0, lopMoLai: [] as string[], theoHuong: {} as Record<string, number> };
  if (viec === 'ket-thuc' && duoc.length) {
    const conn = db();
    theoLo(duoc.map((r) => r.studentId), (lo, ph) => {
      /* Cùng cách chọn Case của `closeCasesBySystem` (`systemClose.ts:67-73`): em của Case = `student_id` hoặc em của lượt Test gắn Case. */
      tong.caseDong += (conn.prepare(
        `SELECT COUNT(*) n FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done'`,
      ).get(...lo) as any).n;
      tong.paHuy += (conn.prepare(
        `SELECT COUNT(*) n FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done' AND iv.status IN ('planned', 'started')`,
      ).get(...lo) as any).n;
      /* Lệnh còn chờ của em đã rời lớp nguồn sẽ bị máy tự huỷ lúc thi hành (`lenhChuyen.ts` — "Em không còn học lớp nguồn"). */
      tong.lenhHuy += (conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND student_id IN (${ph})`).get(...lo) as any).n;
    });
  }
  if (viec === 'hoc-lai') {
    tong.lopMoLai = [...new Set(duoc.map((r) => em.get(r.studentId)!.lopCuoi).filter((l) => l?.class_status === 'finished').map((l) => l.code as string))];
  }
  if (viec === 'huy-lenh') {
    for (const r of duoc) { const h = em.get(r.studentId)!.lenhCho.huong as string; tong.theoHuong[h] = (tong.theoHuong[h] ?? 0) + 1; }
  }
  return { viec, rows, tong };
}

/** POST /hang-loat-hoc-vien — làm ≤ `LO_HANG_LOAT_EM` học viên. Trả `ok` (đã làm) và `failed` (em nào, vì sao chưa). */
export function chay(p: Principal, input: {
  viec?: unknown; studentIds?: unknown; lyDo?: unknown; date?: unknown; moLaiLop?: unknown; lopMoiId?: unknown;
}): KetQuaHangLoat {
  const viec = docViec(input?.viec);
  const ids = docIds(input?.studentIds, LO_HANG_LOAT_EM);
  const lyDo = chuTuDo(input.lyDo, 'Lý do', 2000);
  const date = typeof input.date === 'string' && input.date ? input.date : undefined;
  if (viec === 'ket-thuc' && !lyDo) throw badRequest('Ghi lý do kết thúc học.');
  if (viec === 'huy-lenh' && !lyDo) throw badRequest('Ghi lý do huỷ quyết định.');
  const lopMoiId = input.lopMoiId === undefined || input.lopMoiId === null ? null : Number(input.lopMoiId);
  if (lopMoiId !== null && (!Number.isInteger(lopMoiId) || lopMoiId <= 0)) throw badRequest('Lớp chuyển đến không hợp lệ.');
  /* Sang lớp Fast Track cần Target của từng em — làm từng em ở hồ sơ, không làm hàng loạt. */
  if (viec === 'hoc-lai' && lopMoiId !== null && (db().prepare('SELECT is_fast_track FROM classes WHERE id = ?').get(lopMoiId) as any)?.is_fast_track) throw badRequest('Học lại sang lớp Fast Track cần Target — làm từng học viên.');
  napTruocPhamVi(ids);
  const em = docEm(ids);
  /* Không học viên nào trong phạm vi người gọi → 403 cả lô (GVCN gọi thẳng API). */
  if (!ids.some((id) => em.has(id) && can(p, PERMISSIONS.PLAN_WEEK, { studentId: id }))) throw forbidden(CHI_QL);

  const kq: KetQuaHangLoat = { ok: [], failed: [] };
  const lyDoCua = (id: number): string | null => { const e = em.get(id); return e ? lyDoBo(p, viec, e) : 'Không tìm thấy học viên.'; };
  const lamDuoc: number[] = [];
  for (const id of ids) { const bo = lyDoCua(id); if (bo) kq.failed.push({ studentId: id, message: bo }); else lamDuoc.push(id); }

  if (viec === 'huy-lenh') {
    /* MỘT lần gọi cho cả lô: mỗi lệnh một giao dịch bên trong, nhưng chuông gom MỘT cái cho mỗi người nhận. */
    const theoLenh = new Map(lamDuoc.map((id) => [em.get(id)!.lenhCho.id as number, id]));
    const r = huyNhieuLenh(p, [...theoLenh.keys()], lyDo);
    kq.ok.push(...r.ok.map((lid) => theoLenh.get(lid)!));
    kq.failed.push(...r.failed.map((f) => ({ studentId: theoLenh.get(f.id) ?? f.studentId, message: f.message })));
  } else {
    for (const id of lamDuoc) {
      const e = em.get(id)!;
      try {
        tx(() => {
          chanGiaoDichNeuSapHetGio();   // sắp hết giờ → 503 "chưa lưu" cho em này (và các em sau)
          if (viec === 'ket-thuc') setStudentStatus(p, id, 'finished', date ?? demoToday(), lyDo ?? undefined);
          else if (viec === 'luu-tru') archiveStudent(p, id);
          else if (viec === 'bo-luu-tru') unarchiveStudent(p, id);
          else if (viec === 'hoc-lai') hocLai(p, id, { date, lyDo, moLaiLop: input.moLaiLop === true, lopMoiId });
          else if (viec === 'hoan-tac-ket-thuc') hoanTacKetThuc(p, id);
          else if (viec === 'hoan-tac-hoc-lai') hoanTacHocLai(p, id);
          else { const r = khoiPhucLenh(p, [e.lenhHuy.id]); if (r.failed.length) throw new HttpError(409, r.failed[0].message); }
        });
        kq.ok.push(id);
      } catch (err) {
        if (!(err instanceof HttpError)) throw err;
        kq.failed.push({ studentId: id, message: err.message });
      }
    }
  }
  if (kq.ok.length) {
    writeAudit({ actorUserId: p.userId, action: 'student.hang_loat', entityType: 'student', entityId: null,
      after: { viec, soEm: kq.ok.length, soLoi: kq.failed.length, studentIds: kq.ok, lyDo, date: date ?? null, lopMoiId } });
  }
  return kq;
}
