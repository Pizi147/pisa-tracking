/**
 * PHẦN BỔ SUNG CHO DÒNG HỌC VIÊN CỦA LỚP (PR-Qa) — nhãn cảnh báo Ý thức 5 ngày (YT-8), các Case đang mở dùng dựng "Việc tiếp theo".
 * Tách khỏi classes.ts để không vòng import; mỗi thứ MỘT lần cho cả lớp, không hỏi từng em.
 *
 * (PR-Qa 17, sửa theo rà soát planning): số "Case đang mở" của lớp — trước ở đây qua một hàm dựng riêng — nay tính thẳng bằng
 * `listCases(p, { classId })` tại nơi dùng (`classes.ts`, `hocVienLop.ts`), vì hàm cũ tự viết một câu SQL enrollment→class
 * riêng rồi gọi `listCases(p, {})` KHÔNG lọc phạm vi gì để lấy Case — quét mọi Case trong hệ thống, chậm hàng chục giây
 * trên Turso. Xem `.superpowers/sdd/2026-09-22-pr-qa-hoc-vien-lop/task-17-planning-fix-report.md`.
 */
import { PERMISSIONS, viecTiepCuaEm, type CaseViec, type NhanYThucEm, type ViecTiepTheo } from '../../../shared/domain/index.ts';
import { db } from '../db.ts';
import { can, type Principal } from '../permissions.ts';
import { emCuaLop, nhanNhomEm, trangThaiYThuc } from '../yThuc/trangThai.ts';
import { listCases, type MappedCase } from '../cases/cases.ts';
import { chiTietCaseMo } from '../cases/caseLop.ts';
import { quetYeuCau } from '../duyet/yeuCau.ts';

/**
 * PR-YT4: nhãn Ý thức ở dòng em — `Quá hạn` / `Cần xử lý` (nhóm `qua_han` | `bat_buoc` của `trangThaiYThuc`), không còn "{n} vi phạm".
 * Người không được xem hồ sơ học viên của lớp thì không có nhãn — ẩn chứ không làm hỏng cả bảng.
 */
export function canhBaoTheoHocVien(p: Principal, classId: number): Map<number, NhanYThucEm> {
  const out = new Map<number, NhanYThucEm>();
  if (!can(p, PERMISSIONS.STUDENT_VIEW, { classId })) return out;
  for (const [id, em] of trangThaiYThuc(emCuaLop(classId))) {
    /* PR-S3F #12: em Tạm dừng không tính (T65) — cùng tập với chỉ số `hv-can-xu-ly` (ghi danh `active`), nên huy hiệu lớp và chỉ số không lệch. */
    if (em.tamDung) continue;
    const n = nhanNhomEm(em);
    if (n) out.set(id, n);
  }
  return out;
}

/** Số em cần hành động Ý thức (Quá hạn + Bắt buộc) của lớp — huy hiệu ⚠ của tab. */
export function soEmCanXuLyYThuc(p: Principal, classId: number): number {
  return canhBaoTheoHocVien(p, classId).size;
}

/**
 * Việc tiếp của Case chưa xong của từng em trong lớp (lớp em ĐANG học), theo đúng phạm vi người xem — cùng tập với `/cases?classId=`.
 * Đọc theo LÔ (`chiTietCaseMo`, số câu SQL cố định) — dùng `viecTiepCuaEm` dựng cột Việc tiếp theo / Theo dõi.
 */
export function caseViecTheoHocVien(p: Principal, classId: number): Map<number, CaseViec[]> {
  const out = new Map<number, CaseViec[]>();
  const mo = listCases(p, { classId }).rows.filter((c) => c.status !== 'done' && c.studentId !== null);
  const ct = chiTietCaseMo(mo);
  for (const c of mo) {
    const x = ct.get(c.id);
    if (!x) continue;
    out.set(x.studentId, [...(out.get(x.studentId) ?? []), { caseId: c.id, topic: c.topic, viecTiep: x.viecTiep }]);
  }
  return out;
}

export type ViecEm = { viec: ViecTiepTheo[]; choDuyet: boolean };
/**
 * SỐ LIỆU VIỆC THEO LỚP — MỘT hàm cho trang Học viên & Lớp (chip Cần làm / Chờ duyệt, badge `qua-han` / `cho-duyet` của hộp lớp) và
 * `classOverview` (badge đầu hồ sơ lớp): cùng em, cùng Case, cùng luật `viecTiepCuaEm` → hai màn không lệch (G-10).
 *
 * Số câu SQL cố định theo lô: `chiTietCaseMo` (4) + Ý thức (`trangThaiYThuc`, 3) + thẻ chờ duyệt (1). Case truyền vào là tập đã lọc quyền
 * (`listCases`); em không có trong `emTheoLop` bị bỏ. Nhập điểm KHÔNG tính ở đây (Q3: đã có badge "bài chờ chấm").
 * Ý thức: chỉ lớp người xem có `STUDENT_VIEW` (cùng luật `canhBaoTheoHocVien`), bỏ em Tạm dừng (PR-S3F #12).
 * `soChoDuyet` chỉ với người duyệt được ở lớp đó (`REQUEST_APPROVE`); người khác 0.
 */
export function viecHocVienTheoLop(p: Principal, o: {
  emTheoLop: ReadonlyMap<number, readonly number[]>; cases: readonly MappedCase[]; homNay: string;
  chuongTrinhTheoLop?: ReadonlyMap<number, string | null>;
}): { theoEm: Map<number, ViecEm>; soChoDuyet: Map<number, number>; soEmQuaHan: Map<number, number> } {
  /* Một em có thể còn ghi danh `active` ở nhiều lớp (dữ liệu chuyển lớp dở) — đếm cho MỖI lớp em đang có mặt, việc của em tính một lần. */
  const lopCua = new Map<number, number[]>();
  for (const [lop, ds] of o.emTheoLop) for (const id of ds) if (!lopCua.get(id)?.includes(lop)) lopCua.set(id, [...(lopCua.get(id) ?? []), lop]);
  const emIds = [...lopCua.keys()];
  const mo = o.cases.filter((c) => c.status !== 'done' && c.studentId !== null && lopCua.has(c.studentId));
  const chiTiet = chiTietCaseMo(mo);
  const caseCua = new Map<number, CaseViec[]>();
  for (const c of mo) {
    const x = chiTiet.get(c.id);
    if (x) caseCua.set(x.studentId, [...(caseCua.get(x.studentId) ?? []), { caseId: c.id, topic: c.topic, viecTiep: x.viecTiep }]);
  }
  const lopXemDuoc = emIds.length ? [...o.emTheoLop.keys()].filter((l) => can(p, PERMISSIONS.STUDENT_VIEW, { classId: l })) : [];
  const yThuc = new Map<number, NhanYThucEm>();
  for (const [id, em] of trangThaiYThuc(lopXemDuoc.flatMap((l) => o.emTheoLop.get(l) ?? []))) {
    const n = em.tamDung ? null : nhanNhomEm(em);
    if (n) yThuc.set(id, n);
  }
  /* PR-S4F #5: quét trước khi đếm, như mọi đường đọc hộp (K5-17) — không thì badge đếm thiếu thẻ Báo lên mà hộp (quét rồi) có. */
  quetYeuCau(o.homNay);
  /* Thẻ đang chờ Quản lý (`yeu_cau_duyet`): theo em (`hoc_vien_id`) hoặc theo lớp (`lop_id`) — MỘT câu cho mỗi lô 400. */
  const chia = <T,>(a: readonly T[]) => Array.from({ length: Math.ceil(a.length / 400) }, (_, i) => a.slice(i * 400, i * 400 + 400));
  const nhomHv = chia(emIds); const nhomLop = chia([...o.emTheoLop.keys()]);
  const the = new Map<number, { hv: number | null; lop: number | null }>();
  for (let i = 0; i < Math.max(nhomHv.length, nhomLop.length); i++) {
    const hv = nhomHv[i] ?? []; const lp = nhomLop[i] ?? [];
    const dk = [hv.length ? `hoc_vien_id IN (${hv.map(() => '?').join(',')})` : '', lp.length ? `lop_id IN (${lp.map(() => '?').join(',')})` : ''].filter(Boolean).join(' OR ');
    for (const r of db().prepare(`SELECT id, hoc_vien_id, lop_id FROM yeu_cau_duyet WHERE trang_thai = 'cho' AND (${dk})`).all(...hv, ...lp) as any[]) {
      the.set(r.id, { hv: r.hoc_vien_id ?? null, lop: r.lop_id ?? null });
    }
  }
  const emChoDuyet = new Set<number>();
  const soChoDuyet = new Map<number, number>();
  for (const y of the.values()) {
    if (y.hv !== null) emChoDuyet.add(y.hv);
    const lop = y.lop ?? (y.hv !== null ? lopCua.get(y.hv)?.[0] : undefined);
    if (lop !== undefined && o.emTheoLop.has(lop) && can(p, PERMISSIONS.REQUEST_APPROVE, { classId: lop })) soChoDuyet.set(lop, (soChoDuyet.get(lop) ?? 0) + 1);
  }
  const theoEm = new Map<number, ViecEm>();
  const soEmQuaHan = new Map<number, number>();
  for (const [id, lops] of lopCua) {
    const viec = viecTiepCuaEm({ nhapDiem: null, cases: caseCua.get(id) ?? [], yThuc: yThuc.get(id) ?? null, homNay: o.homNay, chuongTrinh: o.chuongTrinhTheoLop?.get(lops[0]) ?? null });
    theoEm.set(id, { viec, choDuyet: emChoDuyet.has(id) });
    if (viec.some((v) => v.tone === 'danger')) for (const lop of lops) soEmQuaHan.set(lop, (soEmQuaHan.get(lop) ?? 0) + 1);
  }
  return { theoEm, soChoDuyet, soEmQuaHan };
}
