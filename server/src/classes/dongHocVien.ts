/**
 * PHẦN BỔ SUNG CHO DÒNG HỌC VIÊN CỦA LỚP (PR-Qa) — nhãn cảnh báo Ý thức 5 ngày (YT-8), các Case đang mở dùng dựng "Việc tiếp theo".
 * Tách khỏi classes.ts để không vòng import; mỗi thứ MỘT lần cho cả lớp, không hỏi từng em.
 *
 * (PR-Qa 17, sửa theo rà soát planning): số "Case đang mở" của lớp — trước ở đây qua một hàm dựng riêng — nay tính thẳng bằng
 * `listCases(p, { classId })` tại nơi dùng (`classes.ts`, `hocVienLop.ts`), vì hàm cũ tự viết một câu SQL enrollment→class
 * riêng rồi gọi `listCases(p, {})` KHÔNG lọc phạm vi gì để lấy Case — quét mọi Case trong hệ thống, chậm hàng chục giây
 * trên Turso. Xem `.superpowers/sdd/2026-09-22-pr-qa-hoc-vien-lop/task-17-planning-fix-report.md`.
 */
import { ATTEMPT_KIND_SHORT, PERMISSIONS, bacHoacNgoaiThang, soThuTuLuot, nhomCuaLoai, viecTiepCuaEm, type AttemptKind, type CaseViec, type NhanYThucEm, type ViecTiepTheo } from '../../../shared/domain/index.ts';
import { DS_JSON, db } from '../db.ts';
import { activeAt, can, isCoreTeacherOf, type Principal } from '../permissions.ts';
import { emCoBaoPhChuaLam } from '../yThuc/phoiHop.ts';
import { emConMiniTest, nguoiGhiMiniTest } from '../normal/cuoiKhoa.ts';
import { emCuaLop, nhanNhomEm, trangThaiYThuc } from '../yThuc/trangThai.ts';
import type { MappedCase } from '../cases/cases.ts';
import { chiTietCaseMo, type CaseChiTiet } from '../cases/caseLop.ts';
import { quetYeuCau } from '../duyet/yeuCau.ts';
import { listAttempts } from '../fasttrack/attempts.ts';

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

/** `thuTu`: lượt còn nợ SỚM NHẤT (kind + số) — ⋯ dòng em mở panel Nhập điểm lớp đúng lượt (UI-HV-LOP). */
export type NhapDiemViec = { kyNang: string[]; dot: string | null; quaHan: boolean; han: string | null; thuTu: { kind: string; attempt_no: number } | null };

/**
 * PR-UXF-a VN29: việc NHẬP ĐIỂM của CHÍNH người xem theo em — MỘT luật cho cột "Việc tiếp theo" của bảng lớp, chip Cần làm / Quá hạn
 * và badge "n HV quá hạn việc" (Học viên & Lớp, đầu hồ sơ lớp). Nguồn = `myPendingDetail` của `listAttempts` (cùng hàng đợi nhập điểm của trang Công việc),
 * chỉ lớp người xem có việc nhập điểm (không có → rỗng, không câu SQL nào), chỉ em đang học (T65), chỉ lượt ở lớp em ĐANG học (`lopCua`).
 */
export function nhapDiemTheoEm(p: Principal, classIds: readonly number[], homNay: string, lopCua: (sid: number) => number | undefined): Map<number, NhapDiemViec> {
  /* Lớp người xem có VIỆC nhập điểm: đang được phân công, hoặc vai không phải giáo viên có SCORE_EDIT ở lớp (Quản trị) — như `mySkills`. */
  const day = new Set(p.assignments.filter((a) => activeAt(a, homNay)).map((a) => a.classId));
  const lop = [...new Set(classIds)].filter((id) => day.has(id) || can(p, PERMISSIONS.SCORE_EDIT, { classId: id }));
  const out = new Map<number, NhapDiemViec & { hanQua?: string | null }>();
  if (!lop.length) return out;
  for (const a of listAttempts(p, { classIds: lop, chiDangHoc: true, chiConO: true }).rows as any[]) {
    const cho = (a.myPendingDetail ?? []) as { skill: string; deadline: string | null; overdue: boolean }[];
    if (a.status === 'cancelled' || !cho.length || lopCua(a.studentId) !== a.classId) continue;
    const x = out.get(a.studentId) ?? { kyNang: [], dot: null, quaHan: false, han: null, thuTu: null, hanQua: null };
    for (const c of cho) {
      if (!x.kyNang.includes(c.skill)) x.kyNang.push(c.skill);
      if (c.overdue) x.quaHan = true;
      if (c.deadline && (!x.han || c.deadline < x.han)) x.han = c.deadline;
      if (c.overdue && c.deadline && (!x.hanQua || c.deadline < x.hanQua)) x.hanQua = c.deadline;
    }
    /* Đợt = lượt còn nợ SỚM NHẤT (như bảng lớp đọc timeline từ đầu). */
    const luot = { kind: a.kind as string, attempt_no: a.attemptNo as number };
    if (!x.thuTu || soThuTuLuot(luot, x.thuTu) < 0) { x.thuTu = luot; x.dot = a.kind === 'mock' ? `MT${a.attemptNo}` : ATTEMPT_KIND_SHORT[a.kind as AttemptKind] ?? a.kind; }
    out.set(a.studentId, x);
  }
  /* PR-S6F-a Q6: có ô quá hạn thì hạn hiện là hạn của ô quá hạn — hạn sớm của ô chưa quá hạn không làm em "trễ". */
  for (const x of out.values()) {
    if (x.hanQua) x.han = x.hanQua;
    delete x.hanQua;
  }
  return out;
}

export type ViecEm = { viec: ViecTiepTheo[]; choDuyet: boolean };
/**
 * SỐ LIỆU VIỆC THEO LỚP — MỘT hàm cho trang Học viên & Lớp (chip Cần làm / Chờ duyệt, badge `qua-han` / `cho-duyet` của hộp lớp) và
 * `classOverview` (badge đầu hồ sơ lớp): cùng em, cùng Case, cùng luật `viecTiepCuaEm` → hai màn không lệch (G-10).
 *
 * Số câu SQL cố định theo lô: `chiTietCaseMo` (4) + Ý thức (`trangThaiYThuc`, 3) + thẻ chờ duyệt (1). Case truyền vào là tập đã lọc quyền
 * (`listCases`); em không có trong `emTheoLop` bị bỏ. Nhập điểm: PR-UXF-a VN29 nhận `nhapDiemTheoEm` (cùng nguồn với bảng lớp).
 * Ý thức: chỉ lớp người xem có `STUDENT_VIEW` (cùng luật `canhBaoTheoHocVien`), bỏ em Tạm dừng (PR-S3F #12).
 * `soChoDuyet` chỉ với người duyệt được ở lớp đó (`REQUEST_APPROVE`); người khác 0.
 */
export function viecHocVienTheoLop(p: Principal, o: {
  emTheoLop: ReadonlyMap<number, readonly number[]>; cases: readonly MappedCase[]; homNay: string;
  chuongTrinhTheoLop?: ReadonlyMap<number, string | null>;
  /** PR-UXF-a VN29: nhập điểm của người xem theo em (`nhapDiemTheoEm`) — dựng MỘT lần cho cả trang. */
  nhapDiemTheoEm?: ReadonlyMap<number, NhapDiemViec>;
}): {
  theoEm: Map<number, ViecEm>; soChoDuyet: Map<number, number>; soEmQuaHan: Map<number, number>;
  /** SV-SO3 (hàng HV, khu d): PA của các Case đang mở + có việc Case quá hạn · bậc Ý thức (`bacHoacNgoaiThang`) — từ chính các câu đã đọc ở đây. */
  hoTro: Map<number, { soPa: number; quaHan: boolean }>; bacYThuc: Map<number, string>;
  /** TL-HVL: chi tiết Case đang mở đã đọc ở đây — nhãn Bộ lọc thêm dùng lại, không đọc lại. */
  chiTiet: Map<number, CaseChiTiet>;
} {
  /* Một em có thể còn ghi danh `active` ở nhiều lớp (dữ liệu chuyển lớp dở) — đếm cho MỖI lớp em đang có mặt, việc của em tính một lần. */
  const lopCua = new Map<number, number[]>();
  for (const [lop, ds] of o.emTheoLop) for (const id of ds) if (!lopCua.get(id)?.includes(lop)) lopCua.set(id, [...(lopCua.get(id) ?? []), lop]);
  const emIds = [...lopCua.keys()];
  const mo = o.cases.filter((c) => c.status !== 'done' && c.studentId !== null && lopCua.has(c.studentId));
  const chiTiet = chiTietCaseMo(mo);
  const caseCua = new Map<number, CaseViec[]>();
  const hoTro = new Map<number, { soPa: number; quaHan: boolean }>();
  for (const c of mo) {
    const x = chiTiet.get(c.id);
    if (!x) continue;
    caseCua.set(x.studentId, [...(caseCua.get(x.studentId) ?? []), { caseId: c.id, topic: c.topic, viecTiep: x.viecTiep }]);
    const h = hoTro.get(x.studentId) ?? { soPa: 0, quaHan: false };
    hoTro.set(x.studentId, { soPa: h.soPa + x.pas.length, quaHan: h.quaHan || x.quaHan });
  }
  const lopXemDuoc = emIds.length ? [...o.emTheoLop.keys()].filter((l) => can(p, PERMISSIONS.STUDENT_VIEW, { classId: l })) : [];
  const yThuc = new Map<number, NhanYThucEm>();
  const bacYThuc = new Map<number, string>();
  for (const [id, em] of trangThaiYThuc(lopXemDuoc.flatMap((l) => o.emTheoLop.get(l) ?? []))) {
    const n = em.tamDung ? null : nhanNhomEm(em);
    if (n) yThuc.set(id, n);
    const bac = bacHoacNgoaiThang(em.bac, em.xuLy);
    if (bac) bacYThuc.set(id, bac);
  }
  /* PR-S4F #5: quét trước khi đếm, như mọi đường đọc hộp (K5-17) — không thì badge đếm thiếu thẻ Báo QL mà hộp (quét rồi) có. */
  quetYeuCau(o.homNay);
  /* Thẻ đang chờ Quản lý (`yeu_cau_duyet`): theo em (`hoc_vien_id`) hoặc theo lớp (`lop_id`) — MỘT câu, hai tham số JSON (S5; danh sách rỗng = không khớp). */
  const lopIds = [...o.emTheoLop.keys()];
  const the = new Map<number, { hv: number | null; lop: number | null }>();
  if (emIds.length || lopIds.length) {
    for (const r of db().prepare(`SELECT id, loai, hoc_vien_id, lop_id FROM yeu_cau_duyet WHERE trang_thai = 'cho'
        AND (hoc_vien_id IN (${DS_JSON}) OR lop_id IN (${DS_JSON}))`).all(JSON.stringify(emIds), JSON.stringify(lopIds)) as any[]) {
      /* PR-GVb (J5b): "chờ duyệt" chỉ thẻ QL phải quyết — Báo QL nằm ở tab Nhắc việc, không vào badge (cùng `nhomCuaLoai` của hộp). */
      if (nhomCuaLoai(r.loai) === 'de-biet') continue;
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
  const miniTestEm = emConMiniTest(emIds);   // PR-LT2b: Mini Test chưa ghi — MỘT câu
  const baoPhEm = emCoBaoPhChuaLam(emIds);   // PR-LT2a: việc Báo phụ huynh qua TVV (GVCN) — MỘT câu
  const theoEm = new Map<number, ViecEm>();
  const soEmQuaHan = new Map<number, number>();
  for (const [id, lops] of lopCua) {
    const viec = viecTiepCuaEm({
      nhapDiem: o.nhapDiemTheoEm?.get(id) ?? null, cases: caseCua.get(id) ?? [], yThuc: yThuc.get(id) ?? null, homNay: o.homNay, chuongTrinh: o.chuongTrinhTheoLop?.get(lops[0]) ?? null,
      baoPh: baoPhEm.has(id) && lops.some((l) => isCoreTeacherOf(p, l, o.homNay)),
      miniTest: lops.map((l) => nguoiGhiMiniTest(p, l, miniTestEm.get(id))).find(Boolean) ?? null,
    });
    theoEm.set(id, { viec, choDuyet: emChoDuyet.has(id) });
    if (viec.some((v) => v.tone === 'danger')) for (const lop of lops) soEmQuaHan.set(lop, (soEmQuaHan.get(lop) ?? 0) + 1);
  }
  return { theoEm, soChoDuyet, soEmQuaHan, hoTro, bacYThuc, chiTiet };
}
