import { db, tx } from '../db.ts';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, kiemTenViPham, tachTenMoTa, LO_GHI_VI_PHAM, VI_PHAM_TOI_DA_DONG,
  VIOLATION_SKILLS, XU_LY_STATUS_LABEL, nhanLoaiXuLy, tenMon,
  type ViolationCategory, type TrangThaiVp,
} from '../../../shared/domain/index.ts';
import { chotHanXuLy, trangThaiYThuc, type EmYThuc } from './trangThai.ts';
import { xoaNho } from '../platform/nguCanhRequest.ts';
import { baoKhiGhiViPham, dangBatBuoc, laGvcnDangHoc } from './xuLy.ts';
import type { Principal } from '../permissions.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { currentCycle } from '../fasttrack/cycles.ts';
import { purgeAttachmentsOf, xoaTepSauGiaoDich } from '../platform/attachments.ts';
import {
  EDIT_VIOLATION_MESSAGE, KEY_TAKEN_MESSAGE, activeClassOf, canEditViolation, requireRecordViolation, requireViewClass, requireViewStudent,
} from './access.ts';

/**
 * VI PHẠM — MỖI SỰ VIỆC MỘT DÒNG ĐỘC LẬP (đặc tả §4.1 và §5.1–§5.2, nguồn mục 13–16).
 *
 * Vi phạm KHÔNG phải case: không đợt, không hạn, không mức độ, không người phụ trách. Ghi một vi phạm không sinh
 * biện pháp, Case, tín hiệu, việc hay thông báo (V08) — nó chỉ xuất hiện trong hồ sơ học viên để GVCN theo dõi.
 *
 * TRẠNG THÁI KHÔNG ĐƯỢC LƯU Ở ĐÂY (PR-YT4): sáu nhãn §5.4 (`Mới · Đã ghi nhận · Cần xử lý · Quá hạn · Chờ QL duyệt · Đã xử lý`) đọc qua
 * MỘT cửa `trangThaiYThuc()` (trangThai.ts). Cột `ghi_nhan_luc` chỉ ghi việc GVCN đã xem; nhãn vẫn do luật quyết.
 *
 * GHI SAI THÌ SỬA HOẶC XOÁ THẲNG (rulebook v3, V11′–V14′ — thay "đánh dấu không chính xác" của PR-J): không còn trạng thái `Không còn hiệu lực`.
 * Các cột `valid`/`invalid_*` của bảng `violations` NGỪNG DÙNG (giữ trong schema để `migrate` an toàn; mọi dòng cũ `valid = 0` đã được xoá khi nâng cấp).
 */

export type ViolationView = {
  id: number;
  studentId: number; studentName: string; studentCode: string;
  classId: number | null; classCode: string | null; cycleId: number | null;
  category: ViolationCategory; categoryLabel: string;
  skill: string | null; skillLabel: string | null;
  occurredOn: string; reportedOn: string;
  reportedBy: number; reportedByName: string | null;
  /** PR-LUI-a: `ten` = dòng chính (Vi phạm, ≤ 60); `moTa` = Mô tả (có thể rỗng). `description` giữ chữ thô cho nơi gọi cũ. */
  ten: string; moTa: string;
  description: string;
  /** Nhãn §5.4 — từ `trangThaiYThuc()`, không tính riêng. */
  trangThai: TrangThaiVp; nhanTrangThai: string;
  /** Hạn (Mới: ghi nhận/xử lý; bắt buộc: xử lý) và số ngày quá hạn — null khi không có. */
  han: string | null; quaHanNgay: number | null;
  /** Quá hạn vì bắt buộc chưa xử lý (`xu-ly`) hay vì chưa ai xem (`xem`) — chỉ `xem` còn Ghi nhận được (V4-2). */
  lyDoQuaHan: 'xu-ly' | 'xem' | null;
  ghiNhanLuc: string | null; ghiNhanBoiName: string | null;
  createdAt: string; updatedAt: string | null;
};

const SELECT = `
  SELECT v.*, s.full_name AS student_name, s.student_code, c.code AS class_code, c.programme_code AS class_ct,
         ru.full_name AS reported_by_name, gu.full_name AS ghi_nhan_boi_name
    FROM violations v
    JOIN students s ON s.id = v.student_id
    LEFT JOIN classes c ON c.id = v.class_id
    LEFT JOIN users ru ON ru.id = v.reported_by
    LEFT JOIN users gu ON gu.id = v.ghi_nhan_boi`;

/** `em`: trạng thái Ý thức của học viên đó (nơi gọi theo lô truyền vào); thiếu thì tự hỏi cửa trạng thái cho riêng em. */
export function shapeViolation(r: any, em?: EmYThuc): ViolationView {
  const tm = tachTenMoTa(r.ten, r.description, r.category);
  const tt = (em ?? trangThaiYThuc([r.student_id]).get(r.student_id)!).viPham.get(r.id);
  return {
    id: r.id,
    studentId: r.student_id, studentName: r.student_name, studentCode: r.student_code,
    classId: r.class_id ?? null, classCode: r.class_code ?? null, cycleId: r.cycle_id ?? null,
    category: r.category, categoryLabel: VIOLATION_CATEGORY_LABEL[r.category as ViolationCategory] ?? r.category,
    /* MH2: tên môn theo chương trình lớp (FOU "Grammar + Vocabulary"). */
    skill: r.skill ?? null, skillLabel: r.skill ? tenMon(r.class_ct ?? null, r.skill) : null,
    occurredOn: r.occurred_on, reportedOn: r.reported_on,
    reportedBy: r.reported_by, reportedByName: r.reported_by_name ?? null,
    ten: tm.ten, moTa: tm.moTa, description: r.description,
    trangThai: tt?.t ?? 'moi', nhanTrangThai: tt?.nhan ?? 'Mới', han: tt?.han ?? null, quaHanNgay: tt?.quaHanNgay ?? null, lyDoQuaHan: tt?.lyDoQuaHan ?? null,
    ghiNhanLuc: r.ghi_nhan_luc ?? null, ghiNhanBoiName: r.ghi_nhan_boi_name ?? null,
    createdAt: r.created_at, updatedAt: r.updated_at ?? null,
  };
}

function loadRow(id: number): any {
  const r = db().prepare(`${SELECT} WHERE v.id = ?`).get(id);
  if (!r) throw notFound('Không tìm thấy vi phạm');
  return r;
}

export function loadViolation(id: number): ViolationView {
  return shapeViolation(loadRow(id));
}

/** Nhiều vi phạm theo mã, cũ trước mới sau. Mã không tồn tại thì bị bỏ qua — nơi gọi so độ dài để biết. */
export function violationsByIds(ids: number[]): ViolationView[] {
  const rows: any[] = [];
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    rows.push(...(db().prepare(`${SELECT} WHERE v.id IN (${chunk.map(() => '?').join(',')})`).all(...chunk) as any[]));
  }
  return shapeMany(rows).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id);
}

/** Mọi vi phạm của các em (mới nhất trước) — dòng thời gian tab Ý thức lớp / HV. Một câu mỗi lô 400 em + một lần hỏi cửa trạng thái. */
export function violationsOfStudents(studentIds: readonly number[]): ViolationView[] {
  const rows: any[] = [];
  for (let i = 0; i < studentIds.length; i += 400) {
    const chunk = studentIds.slice(i, i + 400);
    rows.push(...(db().prepare(`${SELECT} WHERE v.student_id IN (${chunk.map(() => '?').join(',')})`).all(...chunk) as any[]));
  }
  return shapeMany(rows).sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.id - a.id);
}

/** Dựng nhiều dòng: MỘT lần hỏi cửa trạng thái cho mọi em trong lô. */
export function shapeMany(rows: any[]): ViolationView[] {
  const em = trangThaiYThuc(rows.map((r) => r.student_id as number));
  return rows.map((r) => shapeViolation(r, em.get(r.student_id)));
}

function loadStudent(studentId: number): any {
  const s = db().prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!s) throw notFound('Không tìm thấy học viên');
  return s;
}

// ---------------------------------------------------------------- kiểm dữ liệu vào (V02–V05)

function checkCategory(category: unknown): ViolationCategory {
  if (typeof category !== 'string' || !(VIOLATION_CATEGORIES as readonly string[]).includes(category)) {
    throw badRequest(`Chọn nhóm vi phạm: ${VIOLATION_CATEGORIES.map((c) => VIOLATION_CATEGORY_LABEL[c]).join(' · ')}.`);
  }
  return category as ViolationCategory;
}

/**
 * PR-LUI-a: `Vi phạm` (ten, 3–60 ký tự, bắt buộc) + `Mô tả` (≤ 2000, không bắt buộc). Nơi gọi cũ chỉ gửi `description`: chữ ngắn thành Vi phạm,
 * chữ dài cắt ở chữ gần 60 (`tachTenMoTa`) — mô tả giữ nguyên.
 */
function checkTenMoTa(input: { ten?: unknown; description?: unknown }): { ten: string; moTa: string } {
  const moTa = chuTuDo(input.description, 'Mô tả vi phạm', 2000) ?? '';
  const guiTen = input.ten !== undefined && input.ten !== null;
  const ten = guiTen ? String(input.ten).trim() : tachTenMoTa(null, moTa, '').ten;
  const loi = kiemTenViPham(ten);
  if (loi) throw badRequest(`Vi phạm: ${loi}.`);
  return { ten, moTa: !guiTen && moTa === ten ? '' : moTa };
}

function checkSkill(skill: unknown): string | null {
  if (skill === null || skill === undefined || skill === '') return null;
  if (typeof skill !== 'string' || !(VIOLATION_SKILLS as readonly string[]).includes(skill)) {
    throw badRequest('Môn không hợp lệ — chọn một môn của lớp hoặc để trống.');
  }
  return skill;
}

/** V03: mặc định hôm nay, cho chọn ngày quá khứ (GV nhớ ra sau), không cho ngày tương lai. */
function checkOccurredOn(value: unknown, today: string = demoToday()): string {
  if (value === undefined || value === null || value === '') return today;
  if (!isIsoDate(value)) throw badRequest('Ngày xảy ra không hợp lệ.');
  if (value > today) throw badRequest('Ngày xảy ra không được ở tương lai.');
  return value;
}

/**
 * V04: môn TỰ ĐIỀN theo phân công của giáo viên ở lớp đó. Dạy đúng một môn thì điền môn đó; dạy nhiều môn, hoặc không dạy
 * môn nào (GVCN thuần, Quản lý), thì để trống cho người ghi chọn — hệ thống không đoán.
 */
export function defaultSkillFor(p: Principal, classId: number | null, today: string = demoToday()): string | null {
  if (!classId) return null;
  const skills = new Set(
    p.assignments
      .filter((a) => a.classId === classId && a.skill && a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today))
      .map((a) => a.skill as string),
  );
  /* Pre FOU: GVCN giữ ô `tong_hop` — không phải môn vi phạm (K5-47), nên không tự điền. */
  const mot = skills.size === 1 ? [...skills][0] : null;
  return mot && (VIOLATION_SKILLS as readonly string[]).includes(mot) ? mot : null;
}

// ---------------------------------------------------------------- ghi (V01–V08)

/** V06 — CẢNH BÁO TRÙNG MỀM: cùng học viên, cùng nhóm, cùng ngày xảy ra. Chỉ trả bản đang có; KHÔNG chặn, KHÔNG gộp. */
export function similarViolations(
  p: Principal,
  q: { studentId: number; category: string; occurredOn?: string | null; excludeId?: number | null },
): ViolationView[] {
  loadStudent(q.studentId);
  requireViewStudent(p, q.studentId);
  const on = q.occurredOn || demoToday();
  return (db()
    .prepare(`${SELECT} WHERE v.student_id = ? AND v.category = ? AND v.occurred_on = ? AND v.id != ? ORDER BY v.id`)
    .all(q.studentId, q.category, on, q.excludeId ?? 0) as any[]).map((r) => shapeViolation(r));
}

/** Một dòng vi phạm đã kiểm (dùng cho cả ghi một em và ghi nhiều em). */
type DongDaKiem = { category: ViolationCategory; skill: string | null; occurredOn: string; ten: string; moTa: string };

/**
 * Phần ghi của MỘT vi phạm — gọi TRONG `tx` của nơi gọi. KHÔNG báo GVCN / chốt hạn: nơi gọi làm MỘT lần cho cả em (sau mọi dòng) vì hai việc đó
 * tính lại trạng thái Ý thức của em (nhiều câu SQL) — làm mỗi dòng thì 10 dòng vượt trần 10 s của Netlify.
 */
function ghiMotViPham(p: Principal, student: any, classId: number, cycleId: number | null, today: string, dong: DongDaKiem, key: string | null, laGvcn: boolean): number {
  const info = db()
    .prepare(
      `INSERT INTO violations (student_id, cycle_id, class_id, category, skill, occurred_on, reported_on, reported_by,
                               ten, description, idempotency_key, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(student.id, cycleId, classId, dong.category, dong.skill, dong.occurredOn, today, p.userId, dong.ten, dong.moTa, key, nowIso());
  const newId = Number(info.lastInsertRowid);
  /*
   * Q5 (Câu 1 = A): GVCN lớp đang học tự ghi → tự "Đã ghi nhận" (vẫn đếm vào luật ≥ 3). PR-S3F #6: LUÔN đặt dấu, kể cả khi chính lần ghi này là
   * vi phạm thứ 3 — `trangThaiViPham` vẫn cho "Cần xử lý" thắng (M-10), nhưng xoá bớt một vi phạm khác thì vi phạm của GVCN không được hiện "Mới".
   */
  if (laGvcn) {
    db().prepare('UPDATE violations SET ghi_nhan_luc = ?, ghi_nhan_boi = ? WHERE id = ?').run(today, p.userId, newId);
  }
  writeAudit({
    actorUserId: p.userId, action: 'violation.record', entityType: 'violation', entityId: newId,
    entityLabel: `${student.student_code} · ${VIOLATION_CATEGORY_LABEL[dong.category]}`,
    after: { category: dong.category, skill: dong.skill, occurredOn: dong.occurredOn, ten: dong.ten, description: dong.moTa },
  });
  return newId;
}

/** V07: khoá đã dùng → chỉ phát lại cho đúng người ghi và đúng học viên; khoá của bản ghi khác mà trả về là lộ vi phạm của em ngoài phạm vi. */
function daGhiTheoKhoa(p: Principal, studentId: number, seen: any): number | null {
  if (!seen) return null;
  if (seen.student_id !== studentId || seen.reported_by !== p.userId) throw badRequest(KEY_TAKEN_MESSAGE);
  return seen.id;
}

export function recordViolation(p: Principal, input: {
  studentId: number;
  category?: string;
  /** Mô tả (không bắt buộc). Nơi gọi cũ không gửi `ten` thì chữ này tự thành Vi phạm (ngắn) — xem `checkTenMoTa`. */
  description?: string;
  ten?: string | null;
  occurredOn?: string | null;
  /** `undefined` = tự điền theo phân công (V04); `null` hoặc rỗng = người ghi chủ động để trống. */
  skill?: string | null;
  idempotencyKey?: string | null;
}): { violation: ViolationView; similar: ViolationView[] } {
  const student = loadStudent(input.studentId);
  requireRecordViolation(p, input.studentId);
  const classId = activeClassOf(input.studentId);
  if (!classId) {
    throw badRequest('Học viên này chưa xếp lớp hoặc không còn đang học — chưa ghi được vi phạm.');
  }

  const key = input.idempotencyKey?.trim() || null;
  if (key) {
    /* V07: gửi lại cùng một request (bấm hai lần, thử lại sau lỗi mạng) không tạo dòng thứ hai và không ghi audit thêm. */
    const cu = daGhiTheoKhoa(p, input.studentId, db().prepare('SELECT id, student_id, reported_by FROM violations WHERE idempotency_key = ?').get(key));
    if (cu) return { violation: loadViolation(cu), similar: [] };
  }

  const category = checkCategory(input.category);
  const { ten, moTa } = checkTenMoTa(input);
  const occurredOn = checkOccurredOn(input.occurredOn);
  const skill = input.skill === undefined ? defaultSkillFor(p, classId) : checkSkill(input.skill);

  /* Tính bản trùng TRƯỚC khi ghi để không tự thấy chính mình. */
  const similar = similarViolations(p, { studentId: input.studentId, category, occurredOn });
  const truocBatBuoc = dangBatBuoc(input.studentId);
  const laGvcn = laGvcnDangHoc(p, input.studentId);

  const id = tx(() => {
    const newId = ghiMotViPham(p, student, classId, currentCycle(input.studentId)?.id ?? null, demoToday(), { category, skill, occurredOn, ten, moTa }, key, laGvcn);
    baoKhiGhiViPham(p, input.studentId, newId, category, truocBatBuoc);
    chotHanXuLy([input.studentId]);
    return newId;
  });
  return { violation: loadViolation(id), similar };
}

export type DongViPhamVao = { category?: string; skill?: string | null; occurredOn?: string | null; ten?: string | null; moTa?: string };

/**
 * GHI NHIỀU (PR-LUI-a1, chủ sản phẩm 06/10): một học viên nhiều dòng, HOẶC nhiều học viên một dòng. ≤ `LO_GHI_VI_PHAM` em mỗi request (web chia lô);
 * mỗi em MỘT giao dịch, lỗi một em không cuộn lại em khác. Nội dung sai (khuôn, nhóm, Vi phạm, ngày, môn) → 400 TRƯỚC khi ghi gì.
 * Gửi lại cùng `idempotencyKey`: mỗi dòng có khoá `{key}:{em}:{i}` nên không thêm dòng, trả lại đúng id.
 * Ít câu SQL (trần 10 s Netlify × ~35 ms/câu): học viên, khoá gửi, trạng thái Ý thức đọc MỘT lần theo lô; báo GVCN + chốt hạn một lần sau khi ghi cả lô.
 */
export function recordViolations(p: Principal, input: {
  studentIds: number[]; lines: DongViPhamVao[]; moTaRieng?: Record<string, string> | null; idempotencyKey: string;
}): { ok: { studentId: number; ids: number[] }[]; loi: { studentId: number; loi: string; ma: number }[] } {
  const ids = Array.isArray(input.studentIds) ? input.studentIds : [];
  if (!ids.length || ids.length > LO_GHI_VI_PHAM || new Set(ids).size !== ids.length || !ids.every((x) => Number.isInteger(x) && x > 0)) {
    throw badRequest(`Chọn từ 1 đến ${LO_GHI_VI_PHAM} học viên mỗi lần gửi.`);
  }
  const lines = Array.isArray(input.lines) ? input.lines : [];
  if (!lines.length || lines.length > VI_PHAM_TOI_DA_DONG) throw badRequest(`Mỗi học viên ghi từ 1 đến ${VI_PHAM_TOI_DA_DONG} vi phạm.`);
  if (!lines.every((l) => l && typeof l === 'object')) throw badRequest('Vi phạm: dòng không hợp lệ.');
  if (ids.length > 1 && lines.length > 1) throw badRequest('Chọn nhiều học viên thì ghi một vi phạm.');
  const key = String(input.idempotencyKey ?? '').trim();
  if (key.length < 8 || key.length > 80) throw badRequest('Thiếu khoá gửi (idempotencyKey).');
  const today = demoToday();
  const dong = lines.map((l) => ({
    category: checkCategory(l.category), occurredOn: checkOccurredOn(l.occurredOn, today),
    ...checkTenMoTa({ ten: l.ten ?? '', description: l.moTa }),
    /* Môn: kiểm TRƯỚC khi ghi gì; `undefined` = tự điền theo phân công của từng em. */
    skill: l.skill === undefined ? undefined : checkSkill(l.skill),
  }));
  /* Mô tả riêng từng em chỉ có nghĩa khi MỘT dòng chung cho nhiều em — một em nhiều dòng thì bỏ qua (khỏi đè mọi dòng). */
  const rieng = lines.length === 1 ? input.moTaRieng ?? {} : {};
  const moTaRieng = new Map<number, string>();
  for (const sid of ids) {
    const r = rieng[String(sid)];
    if (r !== undefined && String(r).trim()) moTaRieng.set(sid, chuTuDo(r, 'Mô tả riêng', 2000) ?? '');
  }

  /* Đọc theo lô một lần: học viên, khoá đã dùng, trạng thái Ý thức TRƯỚC khi ghi. */
  const hang = (n: number) => Array.from({ length: n }, () => '?').join(',');
  const students = new Map((db().prepare(`SELECT * FROM students WHERE id IN (${hang(ids.length)})`).all(...ids) as any[]).map((r) => [r.id as number, r]));
  const khoa = (sid: number, i: number) => `${key}:${sid}:${i}`;
  const tatCaKhoa = ids.flatMap((sid) => dong.map((_, i) => khoa(sid, i)));
  const daCo = new Map((db().prepare(`SELECT id, student_id, reported_by, idempotency_key FROM violations WHERE idempotency_key IN (${hang(tatCaKhoa.length)})`)
    .all(...tatCaKhoa) as any[]).map((r) => [r.idempotency_key as string, r]));
  const truoc = trangThaiYThuc(ids);

  const ok: { studentId: number; ids: number[] }[] = [];
  const loi: { studentId: number; loi: string; ma: number }[] = [];
  const viec: { sid: number; lastId: number; category: ViolationCategory; truocBatBuoc: boolean }[] = [];
  for (const sid of ids) {
    try {
      const student = students.get(sid);
      if (!student) throw notFound('Không tìm thấy học viên');
      requireRecordViolation(p, sid);
      const classId = activeClassOf(sid);
      if (!classId) throw badRequest('Học viên này chưa xếp lớp hoặc không còn đang học — chưa ghi được vi phạm.');
      const cu = dong.map((_, i) => daGhiTheoKhoa(p, sid, daCo.get(khoa(sid, i))));
      if (cu.every((x) => x !== null)) { ok.push({ studentId: sid, ids: cu as number[] }); continue; }
      const emT = truoc.get(sid)!;
      const laGvcn = laGvcnDangHoc(p, sid, emT);
      const cycleId = currentCycle(sid)?.id ?? null;
      const moi = tx(() => dong.map((dg, i) => cu[i] ?? ghiMotViPham(p, student, classId, cycleId, today, {
        category: dg.category, occurredOn: dg.occurredOn, ten: dg.ten, moTa: moTaRieng.get(sid) ?? dg.moTa,
        skill: dg.skill === undefined ? defaultSkillFor(p, classId, today) : dg.skill,
      }, khoa(sid, i), laGvcn)));
      ok.push({ studentId: sid, ids: moi });
      const dongMoi = cu.map((x, i) => (x === null ? i : -1)).filter((i) => i >= 0);
      viec.push({ sid, lastId: moi[dongMoi[dongMoi.length - 1]], category: dong[dongMoi[dongMoi.length - 1]].category, truocBatBuoc: dangBatBuoc(sid, emT) });
    } catch (e: any) {
      loi.push({ studentId: sid, loi: String(e?.message ?? 'Không lưu được.'), ma: Number(e?.status) || 500 });
    }
  }
  /* Sau cả lô: MỘT lần tính lại trạng thái các em vừa ghi → báo GVCN (dedup mỗi em mỗi ngày) + chốt hạn xử lý. */
  if (viec.length) {
    xoaNho();
    const sau = trangThaiYThuc(viec.map((v) => v.sid));
    for (const v of viec) baoKhiGhiViPham(p, v.sid, v.lastId, v.category, v.truocBatBuoc, sau.get(v.sid));
    chotHanXuLy(viec.map((v) => v.sid), { trang: sau });
  }
  return { ok, loi };
}

// ---------------------------------------------------------------- sửa và xoá (V09–V10, V11′–V14′)

function addHistory(violationId: number, field: string, oldValue: string | null, newValue: string | null,
  actor: number | null, reason: string | null = null) {
  db()
    .prepare(
      `INSERT INTO violation_history (violation_id, field, old_value, new_value, reason, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .run(violationId, field, oldValue, newValue, reason, actor, nowIso());
}

/**
 * Ghi vào NHẬT KÝ SỬA VI PHẠM một lần thay đổi liên quan tới biện pháp (thêm hoặc bỏ vi phạm khỏi biện pháp). Đặc tả §10
 * tình huống 8: bỏ một vi phạm khỏi biện pháp `preparing` để lại một dòng lịch sử. Giá trị là mã biện pháp; `field = 'measure'`.
 */
export function noteMeasureChange(violationId: number, oldMeasureId: number | null, newMeasureId: number | null, actor: number | null) {
  addHistory(violationId, 'measure', oldMeasureId === null ? null : String(oldMeasureId), newMeasureId === null ? null : String(newMeasureId), actor);
}

/**
 * V09 — sửa mô tả · nhóm · môn · ngày xảy ra. Mỗi trường ĐỔI ghi một dòng lịch sử (cũ → mới); không đổi gì thì không ghi.
 * V10 — người sửa: người ghi (vi phạm của chính mình), GVCN của lớp, Quản lý trong phạm vi.
 */
export function editViolation(p: Principal, id: number, patch: {
  ten?: string | null; description?: string; category?: string; skill?: string | null; occurredOn?: string | null;
}): ViolationView {
  const row = loadRow(id);
  requireViewStudent(p, row.student_id);
  if (!canEditViolation(p, row)) throw forbidden(EDIT_VIOLATION_MESSAGE);

  const category = patch.category === undefined ? (row.category as ViolationCategory) : checkCategory(patch.category);
  /* Form sửa gửi lại cả `ten` + `description`. Nội dung không đổi so với cái đang HIỆN (đã tách khi đọc) thì giữ nguyên cột, để vi phạm cũ
     vẫn đổi được ngày / môn mà không bị bắt viết lại. */
  const cur = tachTenMoTa(row.ten, row.description, row.category);
  let ten: string | null = row.ten ?? null;
  let moTa: string = row.description;
  if ((patch.ten !== undefined && patch.ten !== null) || patch.description !== undefined) {
    const kq = checkTenMoTa({ ten: patch.ten ?? cur.ten, description: patch.description ?? cur.moTa });
    if (kq.ten !== cur.ten || kq.moTa !== cur.moTa) { ten = kq.ten; moTa = kq.moTa; }
  }
  const skill = patch.skill === undefined ? row.skill : checkSkill(patch.skill);
  const occurredOn = patch.occurredOn === undefined ? row.occurred_on : checkOccurredOn(patch.occurredOn);

  const changes: Array<[string, string | null, string | null]> = [];
  if (ten !== (row.ten ?? null)) changes.push(['ten', row.ten ?? cur.ten, ten]);
  if (moTa !== row.description) changes.push(['description', row.description, moTa]);
  if (category !== row.category) changes.push(['category', row.category, category]);
  if ((skill ?? null) !== (row.skill ?? null)) changes.push(['skill', row.skill ?? null, skill ?? null]);
  if (occurredOn !== row.occurred_on) changes.push(['occurred_on', row.occurred_on, occurredOn]);
  if (!changes.length) return shapeViolation(row);

  tx(() => {
    db()
      .prepare('UPDATE violations SET ten = ?, description = ?, category = ?, skill = ?, occurred_on = ?, updated_at = ? WHERE id = ?')
      .run(ten, moTa, category, skill ?? null, occurredOn, nowIso(), id);
    for (const [field, from, to] of changes) addHistory(id, field, from, to, p.userId);
    chotHanXuLy([row.student_id]);
    writeAudit({
      actorUserId: p.userId, action: 'violation.edit', entityType: 'violation', entityId: id,
      entityLabel: `${row.student_code} · ${VIOLATION_CATEGORY_LABEL[category]}`,
      before: Object.fromEntries(changes.map(([f, from]) => [f, from])),
      after: Object.fromEntries(changes.map(([f, , to]) => [f, to])),
    });
  });
  return loadViolation(id);
}

/**
 * V11′–V14′ — XOÁ THẲNG (rulebook v3, thay "đánh dấu không chính xác" của PR-J). Không lý do, không hộp thoại nhập chữ: giao diện chỉ hỏi một dòng
 * `Xoá vi phạm này? Nó sẽ bị gỡ khỏi {n} biện pháp.`
 *
 *   V11′  không còn trạng thái `Không còn hiệu lực`.
 *   V12′  xoá được ở mọi nơi — kể cả vi phạm đang nằm trong biện pháp ĐÃ THỰC HIỆN.
 *   V13′  xoá dòng `violations`, các dòng `measure_violations`, lịch sử sửa và tệp gắn với nó; mọi số liệu tự cập nhật (không có gì lưu sẵn để lệch);
 *         ghi MỘT dòng `audit_logs` (ai · lúc nào · nội dung đã xoá) — chỉ để truy vết, không hiện trên giao diện.
 *   V14′  biện pháp ĐÃ THỰC HIỆN mất hết vi phạm do xoá vẫn được giữ (việc đã làm thật), hiện `0 vi phạm`: số của biện pháp luôn là số ĐANG GẮN.
 *   V10   người xoá: người ghi (của mình) · GVCN của lớp · Quản lý trong phạm vi — cùng quyền với sửa.
 *
 * Trả về số biện pháp đã bị gỡ vi phạm (để giao diện nói "đã gỡ khỏi n biện pháp").
 */
export function deleteViolation(p: Principal, id: number): { ok: true; removedFromMeasures: number } {
  const row = loadRow(id);
  requireViewStudent(p, row.student_id);
  if (!canEditViolation(p, row)) throw forbidden(EDIT_VIOLATION_MESSAGE);

  /* V4-12 (PR-YT4): không còn "Đang chuẩn bị" nên không chặn gì. Xoá vi phạm trong lần xử lý đã xong: lần xử lý còn, số vi phạm giảm,
     bậc KHÔNG lùi (bậc đọc từ `kind` của lần xử lý). */
  /* Tệp trong kho chỉ xoá SAU KHI giao dịch chốt — giao dịch lui thì dòng còn mà tệp mất là không hoàn tác được. */
  const khoaTep: string[] = [];
  const result = tx(() => {
    const measureIds = (db().prepare('SELECT measure_id FROM measure_violations WHERE violation_id = ? ORDER BY measure_id').all(id) as any[])
      .map((r) => r.measure_id as number);
    const files = purgeAttachmentsOf('violation', id, p.userId, khoaTep);
    db().prepare('DELETE FROM measure_violations WHERE violation_id = ?').run(id);
    db().prepare('DELETE FROM violation_history WHERE violation_id = ?').run(id);
    db().prepare('DELETE FROM violations WHERE id = ?').run(id);
    chotHanXuLy([row.student_id]);
    writeAudit({
      actorUserId: p.userId, action: 'violation.delete', entityType: 'violation', entityId: id,
      entityLabel: `${row.student_code} · ${VIOLATION_CATEGORY_LABEL[row.category as ViolationCategory]}`,
      before: {
        studentId: row.student_id, studentCode: row.student_code, classId: row.class_id ?? null, category: row.category, skill: row.skill ?? null,
        occurredOn: row.occurred_on, reportedOn: row.reported_on, reportedBy: row.reported_by, ten: row.ten ?? null, description: row.description,
        measureIds, attachments: files,
      },
    });
    return { ok: true as const, removedFromMeasures: measureIds.length };
  });
  xoaTepSauGiaoDich(khoaTep);
  return result;
}

// ---------------------------------------------------------------- đọc

export type ViolationFilter = {
  studentId?: number | null;
  /** Nhật ký vi phạm GHI Ở LỚP NÀY (cột `class_id` lúc ghi). Khác với bảng Ý thức của lớp, nơi vấn đề chưa xử lý đi theo học viên sang lớp mới. */
  classId?: number | null;
  /** YT-6 "Theo thời gian" — HV ĐANG HỌC ở lớp này, MỌI trạng thái (không phải "ghi ở lớp lúc đó" như `classId`). */
  activeInClassId?: number | null;
  trangThai?: TrangThaiVp | null;
  category?: string | null;
  from?: string | null;
  to?: string | null;
};

/**
 * Danh sách vi phạm theo học viên hoặc theo lớp. Mặc định trả CẢ vi phạm đã hết hiệu lực (V14: chúng vẫn nằm trong lịch sử,
 * gạch ngang kèm lý do); người gọi lọc bằng `state`.
 */
export function listViolations(p: Principal, f: ViolationFilter): { rows: ViolationView[] } {
  const classId = f.classId ?? f.activeInClassId ?? null;
  if (!f.studentId && !classId) throw badRequest('Cần chọn học viên hoặc lớp để xem danh sách vi phạm.');
  if (f.studentId) {
    loadStudent(f.studentId);
    requireViewStudent(p, f.studentId);
  } else {
    const cls = db().prepare('SELECT id FROM classes WHERE id = ?').get(classId) as any;
    if (!cls) throw notFound('Không tìm thấy lớp');
    requireViewClass(p, classId!);
  }
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.studentId) { where.push('v.student_id = ?'); args.push(f.studentId); }
  if (f.classId) { where.push('v.class_id = ?'); args.push(f.classId); }
  if (f.activeInClassId) { where.push(`v.student_id IN (SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active')`); args.push(f.activeInClassId); }
  if (f.category) { where.push('v.category = ?'); args.push(f.category); }
  if (f.from) { where.push('v.occurred_on >= ?'); args.push(f.from); }
  if (f.to) { where.push('v.occurred_on <= ?'); args.push(f.to); }
  const rows = shapeMany(db()
    .prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY v.occurred_on DESC, v.id DESC`)
    .all(...args) as any[]);
  return { rows: f.trangThai ? rows.filter((r) => r.trangThai === f.trangThai) : rows };
}

export type ViolationDetail = ViolationView & {
  attachmentCount: number;
  canEdit: boolean;
  /** Các biện pháp liên quan (nguồn mục 32) — "Đã xử lý" KHÔNG có nghĩa là xóa hay ẩn khỏi lịch sử. */
  measures: Array<{
    id: number; kind: string; kindLabel: string; status: string; statusLabel: string;
    performedOn: string | null; createdAt: string;
  }>;
  history: Array<{
    id: number; field: string; oldValue: string | null; newValue: string | null; reason: string | null;
    actorUserId: number | null; actorName: string | null; createdAt: string;
  }>;
};

export function violationDetail(p: Principal, id: number): ViolationDetail {
  const row = loadRow(id);
  requireViewStudent(p, row.student_id);
  const v = shapeViolation(row);
  const measures = (db()
    .prepare(
      `SELECT m.id, m.kind, m.custom_name, m.status, m.performed_on, m.created_at
         FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
        WHERE mv.violation_id = ? AND m.status != 'nhap' ORDER BY COALESCE(m.performed_on, m.created_at), m.id`,   // PR-S3F #12: nháp đề xuất chưa phải lần xử lý
    )
    .all(id) as any[]).map((m) => ({
      id: m.id, kind: m.kind, kindLabel: nhanLoaiXuLy(m.kind, m.custom_name),
      status: m.status, statusLabel: (XU_LY_STATUS_LABEL as Record<string, string>)[m.status] ?? m.status,
      performedOn: m.performed_on ?? null, createdAt: m.created_at,
    }));
  const history = (db()
    .prepare(
      `SELECT h.*, u.full_name AS actor_name FROM violation_history h LEFT JOIN users u ON u.id = h.actor_user_id
        WHERE h.violation_id = ? ORDER BY h.id`,
    )
    .all(id) as any[]).map((h) => ({
      id: h.id, field: h.field, oldValue: h.old_value ?? null, newValue: h.new_value ?? null, reason: h.reason ?? null,
      actorUserId: h.actor_user_id ?? null, actorName: h.actor_name ?? null, createdAt: h.created_at,
    }));
  const attachmentCount = (db()
    .prepare("SELECT COUNT(*) n FROM attachments WHERE owner_type = 'violation' AND owner_id = ?")
    .get(id) as any).n as number;
  return { ...v, attachmentCount, canEdit: canEditViolation(p, row), measures, history };
}
