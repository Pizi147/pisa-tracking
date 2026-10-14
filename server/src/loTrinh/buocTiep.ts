/**
 * BƯỚC TIẾP SAU THI THẬT (OV-8a, chủ SP 13/10) — lộ trình FT đã đóng có kết quả thi thật (đủ 4 kỹ năng / Không thi / kết quả cũ) → Quản lý chọn
 * (OV-12a, chủ SP 14/10: cả TVV của chi nhánh — `coQuyenBuocTiep`; CX / GV / Admin không):
 *  · Kết thúc — em vào Lưu trữ (em còn học thì Kết thúc học trước). · Học tiếp lộ trình mới — `hocLai` sang lớp mới (LT1 → LT2…).
 *  · Học lại — `hocLai` về lớp cũ / lớp khác; về lớp cũ thì lộ trình đã thi đóng hẳn (`completed`) để Học lại mở lộ trình MỚI ("thi xong là kết thúc lộ trình đó").
 * Mỗi lựa chọn MỘT giao dịch; đổi lựa chọn = hoàn tác đúng lựa chọn cũ (dữ liệu hoàn tác ở `buoc_tiep_json`) rồi làm cái mới. Luật Học lại / Kết thúc học không đổi.
 * "Hướng tiếp" của bản chụp mới nhất theo lựa chọn (một nguồn cho Tổng kết, Các lộ trình, Tổng kết lớp); hoàn tác trả lại hướng lúc đóng.
 * Việc QL "Chọn bước tiếp sau thi" (nhóm Vận hành): em đã Kết thúc học, chưa Lưu trữ, lộ trình mới nhất là lộ trình này, chưa chọn; hạn = ngày có kết quả + 7, đỏ không chặn.
 */
import { db, tx } from '../db.ts';
import { LUA_CHON_SAU_THI, NHAN_SAU_THI, PERMISSIONS, duongHoSoHocVien, goiYSauThi, huongTiep, tuanLich, type LuaChonSauThi } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { HttpError, addDays, badRequest, conflict, forbidden, notFound, nowIso } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { archiveStudent, coQuyenBuocTiep, hoanTacHocLai, hoanTacKetThuc, hocLai, setStudentStatus, unarchiveStudent } from '../students/students.ts';

/** Lộ trình FT có kết quả thi thật (cùng nghĩa `!canChoThiThat`): đủ 4 kỹ năng, "Không thi", hoặc kết quả CŨ (Overall / kết luận chọn tay). */
const CO_KET_QUA = `(c.thi_that_khong_thi = 1 OR (c.thi_that_l IS NOT NULL AND c.thi_that_r IS NOT NULL AND c.thi_that_w IS NOT NULL AND c.thi_that_s IS NOT NULL)
  OR c.outcome_score IS NOT NULL OR COALESCE(c.outcome, 'unknown') != 'unknown')`;
const BAN_CHUP_CUOI = 'b.cycle_id = c.id AND b.lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = c.id)';
/** Ngày có kết quả (nghiệp vụ): mốc Hành trình "Kết quả thi thật" mới nhất; em kết thúc học SAU đó thì tính từ ngày đóng. */
const NGAY_CO_KQ = `MAX(COALESCE((SELECT MAX(j.event_date) FROM journey_events j WHERE j.cycle_id = c.id AND j.event_type = 'cycle_outcome'), ''), COALESCE(c.ended_at, ''))`;

function docLoTrinh(cycleId: number) {
  return db().prepare(
    `SELECT c.*, ${CO_KET_QUA} AS co_kq, b.ly_do AS bc_ly_do, b.ket_luan AS bc_ket_luan, b.class_id AS bc_class_id,
            (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = c.student_id) AS seq_cuoi, u.full_name AS boi_ten
       FROM learning_cycles c LEFT JOIN ban_chup_lo_trinh b ON ${BAN_CHUP_CUOI} LEFT JOIN users u ON u.id = c.buoc_tiep_boi WHERE c.id = ?`,
  ).get(cycleId) as any;
}
/** Lộ trình có mục Bước tiếp: FT, đã đóng, không đóng vì chuyển lớp (em không đi thi), có kết quả — hoặc đã chọn (kết quả bị xoá sau vẫn hiện lựa chọn). */
const coMuc = (c: any) => !!c && !!c.route && c.status !== 'active' && c.bc_ly_do !== 'chuyen_lop' && (!!c.co_kq || !!c.buoc_tiep);

export type TrangThaiBuocTiep = { chon: LuaChonSauThi | null; luc: string | null; boi: string | null; goiY: LuaChonSauThi | null; coTheChon: boolean };

/** Mục "Bước tiếp" của ngăn Tổng kết — null khi lộ trình không có mục. `coTheChon` = `coQuyenBuocTiep` (QL / TVV của chi nhánh), máy chủ kiểm lại khi chọn. */
export function trangThaiBuocTiep(p: Principal, cycleId: number): TrangThaiBuocTiep | null {
  const c = docLoTrinh(cycleId);
  if (!coMuc(c)) return null;
  return {
    chon: (c.buoc_tiep ?? null) as LuaChonSauThi | null, luc: c.buoc_tiep_luc ?? null, boi: c.boi_ten ?? null,
    goiY: goiYSauThi({ khongThi: !!c.thi_that_khong_thi, ketLuan: c.bc_ket_luan ?? c.outcome ?? null }),
    coTheChon: coQuyenBuocTiep(p, c.student_id),
  };
}

export type ChonBuocTiepVao = { chon?: unknown; lopMoiId?: unknown; mucTieu?: number | string | null; thangThi?: string | null; date?: string; lyDo?: unknown; moLaiLop?: boolean };

const CHI_QL = 'Chỉ Quản lý hoặc TVV của chi nhánh chọn được bước tiếp sau thi.';

/**
 * Người LÀM các hàm một em bên dưới (Kết thúc học, Lưu trữ, Học lại và hoàn tác — vốn đòi `cycle.edit` / `class.edit` / `student.edit`). Quản lý: chính họ. TVV (đã qua
 * `coQuyenBuocTiep`): cấp TẠM đúng các quyền đó, phạm vi chi nhánh của vai TVV, CHỈ trong lần gọi Bước tiếp này — TVV không có đường Học lại / chuyển lớp / xếp lớp / Case chung
 * (các đường đó vẫn kiểm quyền thật của người gọi). Nhật ký ghi đúng người bấm.
 */
function nguoiLam(p: Principal, studentId: number): Principal {
  if (can(p, PERMISSIONS.CYCLE_EDIT, { studentId })) return p;
  const g = p.grants.find((x) => x.roleKey === 'consultant' && can({ ...p, grants: [x] }, PERMISSIONS.STUDENT_EDIT_MORE, { studentId }))!;
  const quyen = new Set<string>([PERMISSIONS.CYCLE_EDIT, PERMISSIONS.CLASS_EDIT, PERMISSIONS.STUDENT_EDIT, PERMISSIONS.STUDENT_EDIT_MORE]);
  return { ...p, grants: [...p.grants, { ...g, id: -1, roleKey: 'buoc_tiep', roleName: 'Bước tiếp sau thi', permissions: quyen }] };
}
type GhiBuocTiep = { ketThucHoc?: boolean; luuTru?: boolean; dongHan?: boolean; huongCu?: string | null };
/** Bản chụp mới nhất của lộ trình (hai tham số: cycle_id, cycle_id). */
const BAN_CHUP_MOI = 'cycle_id = ? AND lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = ?)';

/** Hoàn tác đúng lựa chọn đang có (trong giao dịch của nơi gọi). Vướng (Học lại đã có điểm / em đã đổi trạng thái) → 409 nói rõ. */
function hoanTac(p: Principal, c: any) {
  const g = JSON.parse(c.buoc_tiep_json ?? '{}') as GhiBuocTiep;
  try {
    if (c.buoc_tiep === 'ket_thuc') {
      if (g.ketThucHoc) hoanTacKetThuc(p, c.student_id);
      else if (g.luuTru) unarchiveStudent(p, c.student_id);
    } else {
      hoanTacHocLai(p, c.student_id);
      if (g.dongHan) db().prepare(`UPDATE learning_cycles SET status = 'abandoned' WHERE id = ? AND status = 'completed'`).run(c.id);
      if (g.ketThucHoc) hoanTacKetThuc(p, c.student_id);   // OV-11d: em còn ghi danh lúc chọn → trả về đang học như trước
    }
  } catch (e) {
    if (e instanceof HttpError && e.status === 409) {
      throw conflict(`Không đổi được "${NHAN_SAU_THI[c.buoc_tiep as LuaChonSauThi]}": ${e.message} Giữ lựa chọn cũ, hoặc đổi ở hồ sơ học viên (Chuyển lớp / Kết thúc học).`);
    }
    throw e;
  }
  if (g.huongCu !== undefined) db().prepare(`UPDATE ban_chup_lo_trinh SET huong_tiep = ? WHERE ${BAN_CHUP_MOI}`).run(g.huongCu, c.id, c.id);
  db().prepare('UPDATE learning_cycles SET buoc_tiep = NULL, buoc_tiep_luc = NULL, buoc_tiep_boi = NULL, buoc_tiep_json = NULL WHERE id = ?').run(c.id);
}

/** POST /cycles/:id/buoc-tiep — chọn (hoặc đổi) bước tiếp. Một giao dịch: hoàn tác lựa chọn cũ → làm cái mới → ghi lựa chọn + mốc Hành trình + nhật ký. */
export function chonBuocTiep(p: Principal, cycleId: number, input: ChonBuocTiepVao) {
  const c0 = docLoTrinh(cycleId);
  if (!c0) throw notFound('Không tìm thấy lộ trình');
  if (!coQuyenBuocTiep(p, c0.student_id)) throw forbidden(CHI_QL);
  const q = nguoiLam(p, c0.student_id);
  const chon = input.chon as LuaChonSauThi;
  if (!(LUA_CHON_SAU_THI as readonly unknown[]).includes(chon)) throw badRequest('Bước tiếp không hợp lệ.');
  if (!coMuc(c0) || !c0.co_kq) throw badRequest('Lộ trình chưa có kết quả thi thật — nhập kết quả (hoặc Không thi) trước khi chọn bước tiếp.');
  const lopMoiId = input.lopMoiId ? Number(input.lopMoiId) : null;
  if (chon === 'hoc_tiep' && !lopMoiId) throw badRequest('Học tiếp lộ trình mới: chọn lớp.');
  /* OV-12a: TVV chỉ xếp sang lớp thuộc chi nhánh của mình (quyền tạm `nguoiLam` theo chi nhánh TVV); QL giữ luật cũ (Q3: không đòi quyền lớp mới). */
  if (lopMoiId && q !== p && !can(q, PERMISSIONS.CLASS_EDIT, { classId: lopMoiId })) throw forbidden('Lớp chuyển đến nằm ngoài chi nhánh của bạn.');
  const conn = db();
  const homNay = demoToday();
  return tx(() => {
    /* Đọc lại TRONG giao dịch: hai người bấm cùng lúc thì người sau hoàn tác đúng lựa chọn người trước vừa ghi. */
    const cu = docLoTrinh(cycleId);
    if (cu.buoc_tiep) hoanTac(q, cu);
    const c = docLoTrinh(cycleId);
    if (c.seq !== c.seq_cuoi) throw badRequest('Em đã có lộ trình sau lộ trình này — bước tiếp chọn ở lộ trình mới nhất.');
    const s = conn.prepare('SELECT status, archived_at FROM students WHERE id = ?').get(c.student_id) as any;
    const ghi: GhiBuocTiep = {};
    if (chon === 'ket_thuc') {
      if (s.status !== 'finished') { setStudentStatus(q, c.student_id, 'finished', homNay, 'Kết thúc sau thi'); ghi.ketThucHoc = true; }
      if (!(conn.prepare('SELECT archived_at FROM students WHERE id = ?').get(c.student_id) as any).archived_at) { archiveStudent(q, c.student_id); ghi.luuTru = true; }
    } else {
      /* OV-11d (HV-6): em còn ghi danh (lộ trình đã đóng — dữ liệu cũ / Kết luận lộ trình) → Kết thúc học rồi Học lại, cùng giao dịch (như nhánh Kết thúc). */
      if (s.status !== 'finished') {
        setStudentStatus(q, c.student_id, 'finished', typeof input.date === 'string' && input.date ? input.date : homNay, 'Kết thúc sau thi');
        ghi.ketThucHoc = true;
      }
      /* Về lớp cũ: lộ trình đã thi KHÔNG chạy tiếp → đóng hẳn trước, `hocLai` thấy không còn lộ trình để chạy tiếp thì mở lộ trình mới ở lớp cũ. */
      if (!lopMoiId) ghi.dongHan = conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id = ? AND status = 'abandoned'`).run(cycleId).changes > 0;
      hocLai(q, c.student_id, { date: input.date, lyDo: input.lyDo, moLaiLop: input.moLaiLop === true, lopMoiId, mucTieu: input.mucTieu ?? null, thangThi: input.thangThi ?? null });
    }
    const lopMoi = lopMoiId ? conn.prepare('SELECT code, route FROM classes WHERE id = ?').get(lopMoiId) as any : null;
    const lop = lopMoi?.code ?? null;
    const bc = conn.prepare(`SELECT huong_tiep FROM ban_chup_lo_trinh WHERE ${BAN_CHUP_MOI}`).get(cycleId, cycleId) as any;
    if (bc) {
      ghi.huongCu = bc.huong_tiep ?? null;
      const huong = chon === 'hoc_tiep' ? huongTiep('lo_trinh_moi', lopMoi?.route ?? null) : chon;
      conn.prepare(`UPDATE ban_chup_lo_trinh SET huong_tiep = ? WHERE ${BAN_CHUP_MOI}`).run(huong, cycleId, cycleId);
    }
    conn.prepare('UPDATE learning_cycles SET buoc_tiep = ?, buoc_tiep_luc = ?, buoc_tiep_boi = ?, buoc_tiep_json = ? WHERE id = ?')
      .run(chon, homNay, p.userId, JSON.stringify(ghi), cycleId);
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'buoc_tiep', eventDate: homNay, title: `Sau thi: ${NHAN_SAU_THI[chon]}`,
      detail: [lop ? `lớp ${lop}` : null, cu.buoc_tiep ? `đổi từ ${NHAN_SAU_THI[cu.buoc_tiep as LuaChonSauThi]}` : null].filter(Boolean).join(' · ') || null,
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId, dedupKey: `buoc_tiep:${cycleId}:${nowIso()}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'cycle.buoc_tiep', entityType: 'learning_cycle', entityId: cycleId,
      before: { chon: cu.buoc_tiep ?? null }, after: { chon, lopMoiId, ...ghi } });
    return trangThaiBuocTiep(p, cycleId);
  });
}

/** DELETE /cycles/:id/buoc-tiep — Hoàn tác lựa chọn (về "chờ chọn"). */
export function boChonBuocTiep(p: Principal, cycleId: number) {
  const c = docLoTrinh(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!coQuyenBuocTiep(p, c.student_id)) throw forbidden(CHI_QL);
  if (!c.buoc_tiep) return trangThaiBuocTiep(p, cycleId);
  return tx(() => {
    hoanTac(nguoiLam(p, c.student_id), c);
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'buoc_tiep', eventDate: demoToday(), title: `Sau thi: hoàn tác ${NHAN_SAU_THI[c.buoc_tiep as LuaChonSauThi]}`,
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId, dedupKey: `buoc_tiep:${cycleId}:${nowIso()}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'cycle.buoc_tiep', entityType: 'learning_cycle', entityId: cycleId, before: { chon: c.buoc_tiep }, after: { chon: null } });
    return trangThaiBuocTiep(p, cycleId);
  });
}

/**
 * OV-11d (HV-6) — KIỂM TRƯỚC DEPLOY, CHỈ ĐỌC: em có lộ trình FT mới nhất ĐÃ ĐÓNG mà còn ghi danh (đang học / tạm dừng), chưa Kết thúc học, chưa Lưu trữ —
 * những em Bước tiếp sẽ cho Kết thúc học + Học lại cùng giao dịch. Một câu `SELECT` (chạy được thẳng trên bản chính).
 */
export const SQL_DONG_CON_GHI_DANH = `SELECT s.id, s.student_code, s.full_name, c.code AS lop, cy.id AS cycle_id, cy.route, cy.status AS cycle_status
  FROM students s
  JOIN learning_cycles cy ON cy.student_id = s.id AND cy.route IS NOT NULL AND cy.status IN ('completed', 'abandoned')
   AND cy.seq = (SELECT MAX(x.seq) FROM learning_cycles x WHERE x.student_id = s.id)
  JOIN enrollments e ON e.id = (SELECT MAX(e2.id) FROM enrollments e2 WHERE e2.student_id = s.id AND e2.status IN ('active', 'paused'))
  JOIN classes c ON c.id = e.class_id
 WHERE s.status != 'finished' AND s.archived_at IS NULL
 ORDER BY c.code, s.full_name`;
export const emDongConGhiDanh = (conn: any): any[] => conn.prepare(SQL_DONG_CON_GHI_DANH).all() as any[];

// ------------------------------------------------------------------ việc QL "Chọn bước tiếp sau thi"
/** Lộ trình chờ chọn bước tiếp (chưa lọc quyền) — một nguồn cho việc QL / TVV (`viecBuocTiep`) và ô "Chờ chọn bước tiếp" ở Tổng quan TVV / CX (OV-10c). */
/** Hạn chọn bước tiếp = ngày có kết quả thi + 7 — việc Công việc và góc Cần làm của TVV (OV-12f) cùng hàm. */
export const hanBuocTiep = (c: { ngay_kq: unknown }, today: string): string => addDays(String(c.ngay_kq).slice(0, 10) || today, 7);

export function choBuocTiep(): any[] {
  return db().prepare(
    `SELECT c.id, c.student_id, s.full_name AS ten, c.thi_that_khong_thi, c.outcome, b.ket_luan, b.class_id, b.class_code, b.branch_id, ${NGAY_CO_KQ} AS ngay_kq
       FROM learning_cycles c JOIN students s ON s.id = c.student_id JOIN ban_chup_lo_trinh b ON ${BAN_CHUP_CUOI}
      WHERE c.route IS NOT NULL AND c.status != 'active' AND c.buoc_tiep IS NULL AND s.status = 'finished' AND s.archived_at IS NULL
        AND b.ly_do != 'chuyen_lop' AND ${CO_KET_QUA}
        AND c.seq = (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = c.student_id)`,
  ).all() as any[];
}

/**
 * Một dòng mỗi lộ trình chờ chọn. Ai thấy: người chọn được (`coQuyenBuocTiep` — Quản lý / Quản trị / TVV của chi nhánh), là việc của chính họ. Một câu cho cả tập;
 * quyền hỏi theo em (tập nhỏ: em đã kết thúc, chưa Lưu trữ, có kết quả). Lớp = lớp cuối trong bản chụp (gộp dòng theo lớp như việc khác).
 */
export function viecBuocTiep(p: Principal, f: { today: string; branchId: number | null; studentId?: number }): any[] {
  const ds = choBuocTiep();
  const out: any[] = [];
  for (const c of ds) {
    if ((f.branchId && c.branch_id && c.branch_id !== f.branchId) || (f.studentId && c.student_id !== f.studentId)) continue;
    if (!coQuyenBuocTiep(p, c.student_id)) continue;
    const han = hanBuocTiep(c, f.today);
    const goiY = goiYSauThi({ khongThi: !!c.thi_that_khong_thi, ketLuan: c.ket_luan ?? c.outcome ?? null });
    const kq = c.thi_that_khong_thi ? 'Không thi' : c.ket_luan === 'reached' ? 'Đạt Target' : c.ket_luan === 'not_reached' ? 'Chưa đạt Target' : 'Có kết quả thi';
    out.push({
      key: `buoc_tiep:${c.id}`, group: 'buoc_tiep', urgency: f.today > han ? 'overdue' : 'normal',
      studentId: c.student_id, studentName: c.ten, classId: c.class_id ?? null, classCode: c.class_code ?? null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: kq, count: null,
      reason: [c.class_code ?? null, kq, goiY ? `gợi ý ${NHAN_SAU_THI[goiY]}` : null].filter(Boolean).join(' · '),
      tieuDe: `Chọn bước tiếp sau thi · ${c.ten}`, phu: goiY ? `Gợi ý: ${NHAN_SAU_THI[goiY]}` : null, actionLabel: 'Chọn',
      href: duongHoSoHocVien(c.student_id, { tongKet: c.id }), ownerId: null, owner: null, mine: true,
      due: han, statusLabel: `hạn ${tuanLich(han, f.today)}`,
    });
  }
  return out;
}
