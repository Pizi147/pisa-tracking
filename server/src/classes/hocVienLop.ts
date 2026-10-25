/**
 * TRANG HỌC VIÊN & LỚP (PR-Qa, đặc tả §3.6) — một request cho cả trang: các lớp trong phạm vi đang chọn, số đếm của từng chip lọc,
 * và cờ lọc của từng học viên để web lọc tại chỗ (lọc xong lớp nào không còn em thì ẩn).
 *
 * Danh sách lớp đi qua ĐÚNG `listClassSummaries`; phần thêm ở đây: phạm vi "Lớp tôi dạy", GVCN, số Case đang mở, tuần kết thúc khoá,
 * cờ nút theo quyền, và cờ lọc của học viên (Case: cùng `listCases`; SOS: cùng `standingFor`; thiếu thông tin: cùng `missingForStudent`).
 */
import { db, theoLo } from '../db.ts';
import {
  ENTRY_SKILLS, LUOT_MT_TINH_SQL, LUOT_MT_XONG_SQL, MOC_KE_TIEP_SQL, PERMISSIONS, chiNhanhMacDinh, chuanHoaMaLop, coMocTiepTheo, coMocTiepTheoThuong, demLoc, mondayOfDate, phamViCoThe, phamViMacDinh,
  laVaiQuanLy, kyNangLoc, ketQuaLoc, nhomCaseEm, trangThaiLichThi, type HangHv, type LichThi, type LocHocVien, type PhamVi, type ThemEm, type KetQuaVao,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { bangLop, can, editableSkills, scopeFor, type Principal } from '../permissions.ts';
import { listClassSummaries, lopTrongPhamVi, type ClassSummary } from './classes.ts';
import { classProgressMany, lichMtCua, missingForStudent } from './schedule.ts';
import { standingFor, type Standing } from '../students/standing.ts';
import { diemCuaLuot } from '../fasttrack/attempts.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { luotTheoLoTrinh, luotTruocCoOverall } from '../fasttrack/overallLuot.ts';
import { listCases, type MappedCase } from '../cases/cases.ts';
import { chiTietCaseMo } from '../cases/caseLop.ts';
import { allProgrammes } from '../normal/regular.ts';
import { danhSachLuuTru } from './luuTru.ts';
import { nhapDiemTheoEm, viecHocVienTheoLop } from './dongHocVien.ts';
import { loTrinhChoKetQuaThi } from '../loTrinh/thiThat.ts';

export type LopHocVienLop = ClassSummary & {
  gvcn: { id: number; name: string } | null;
  soCaseMo: number;
  /** B4: yêu cầu đang chờ Quản lý duyệt của lớp (chỉ người duyệt được ở lớp đó, người khác 0) và số em có việc đã quá hạn — badge `cho-duyet` / `qua-han`. */
  soChoDuyet: number; soEmQuaHan: number;
  /** Thứ Hai của tuần học cuối — lớp thường; FT null. */
  tuanKetThuc: string | null;
  viewer: {
    coTheSuaHocVien: boolean; coTheThemHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean; coTheChuyenTiep: boolean;
    /** OV-10b: ⋯ dòng của Admin / TVV / CX — Sửa thông tin (`student.edit_info`), Tạm dừng / Kết quả thi thật (`student.edit_more`). */
    coTheSuaThongTin: boolean; coTheSuaThem: boolean;
  };
};

export type TrangHocVienLop = {
  rows: LopHocVienLop[];
  scopeEmpty: boolean;
  phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
  dem: Record<LocHocVien, number>;
  /** `khung`: Fast Track hay lớp thường của em — công tắc `Tất cả · Fast Track · Lớp thường` đếm chip bằng `demLoc(hocVien, khung)`. */
  hocVien: { id: number; classId: number; loc: LocHocVien[]; khung: 'ft' | 'thuong'; ten: string; ma: string; thieu?: string[]; ketThuc?: true; them?: ThemEm; hang?: HangHv;
    /** UI-HV-LOP (khu d): TVV của em + lịch thi thật (`trangThaiLichThi`, cùng hàm góc Lịch thi) — cột Học viên / Lịch thi, chip "Thi tháng này". */
    tvv?: string | null; lich?: LichThi;
    nhapDiem?: { kind: string; attemptNo: number; dot: string | null } }[];
  /** Người xem có tạo được lớp MỚI ở chi nhánh nào không — không gắn với lớp đã tồn tại nào (điểm a rà soát cuối). */
  coTheTaoLop: boolean;
  /** HL-14: "+ Học viên" đầu trang — có lớp trong phạm vi thêm được học viên, KHÔNG phụ thuộc ô tìm (tìm không ra em là lúc cần thêm). */
  coTheThemHocVien: boolean;
  /** Số ở mục ⋯ "Lưu trữ" đầu trang (PR-LT, Q16) — cùng phạm vi, cùng hàm với `/hoc-vien-lop/luu-tru` (khớp G-10 theo cấu tạo). */
  demLuuTru: { lop: number; hv: number };
};

const demRong = (): Record<LocHocVien, number> => demLoc([], 'tat-ca');

/** Phạm vi đang dùng của trang (Lớp tôi dạy · Chi nhánh · Toàn hệ thống) + chi nhánh đang xem — dùng chung cho `/hoc-vien-lop` và `/hoc-vien-lop/ids`. */
export function phamViTrang(p: Principal, f: { branchId?: number | null; phamVi?: string | null; cnNho?: number | null }, today: string) {
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const phanCong = p.assignments.filter((a) => a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today));
  /* PR-OV2a: lớp có em mình phụ trách tư vấn (chỉ vai TVV được gán em) — rỗng thì không có lựa chọn "HV của tôi". */
  const lopCuaToi = new Set(!p.roleKeys.includes('consultant') ? [] : (conn.prepare(
    `SELECT DISTINCT e.class_id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE s.consultant_user_id = ? AND s.archived_at IS NULL`,
  ).all(p.userId) as any[]).map((r) => r.class_id as number));
  const coThe = phamViCoThe({
    dayLop: phanCong.length > 0, capChiNhanh: scope.branchIds.length > 0,
    toanHeThong: scope.all, soChiNhanh: scope.branchIds.length, cuaToi: lopCuaToi.size > 0,
  });
  /* Chi nhánh người xem CÓ THỂ THẤY — dùng lại cho cả "chọn chi nhánh đang xem" (dưới) lẫn "+ Lớp mới" (điểm a rà soát cuối). */
  const duocXemChiNhanh = scope.all
    ? (conn.prepare(`SELECT id FROM branches WHERE status = 'active' ORDER BY id`).all() as any[]).map((r) => r.id as number)
    : scope.branchIds;
  /* Link cũ `/hoc-vien?branchId=` (bảng chi nhánh, báo cáo tuần) không ghi phạm vi → coi là xem MỘT chi nhánh. */
  const muon = f.phamVi ?? (f.branchId && coThe.includes('chi-nhanh') ? 'chi-nhanh' : null);
  const dangDung: PhamVi = (coThe as string[]).includes(muon ?? '') ? (muon as PhamVi) : phamViMacDinh(coThe, p.roleKeys.some((k) => k === 'manager' || k === 'system_admin'));
  let chiNhanh: number | null = null;
  if (dangDung === 'chi-nhanh') {
    /* PR-NV (T9): link `branchId` → lần chọn trước (`cnNho`, web nhớ; ngoài phạm vi thì bỏ, không 403) → gợi ý theo vai → chi nhánh đầu.
       Màn này không có "Tất cả" trong ô chi nhánh. `cnNho` không đổi Phạm vi (khác `branchId`, dòng `muon`). */
    const hopLe = (b: number | null | undefined): b is number => !!b && duocXemChiNhanh.includes(b);
    const goiY = goiYChiNhanh(p, today);
    chiNhanh = hopLe(f.branchId) ? f.branchId : hopLe(f.cnNho) ? f.cnNho : hopLe(goiY) ? goiY : duocXemChiNhanh[0] ?? null;
  }
  return { coThe, dangDung, chiNhanh, phanCong, lopCuaToi };
}

/**
 * PR-TD2-b: id lớp (+ cách chấm) của `/hoc-vien-lop` mặc định, cùng phạm vi và thứ tự — cho danh sách Trước/Sau của hồ sơ lớp mở bằng link.
 * Không nạp lượt/Case/học viên như trang đầy đủ (đường đó ~1,6 MB trên bản chính).
 */
export function idsHocVienLop(p: Principal): { rows: { id: number; scoringMode: string | null }[] } {
  const { dangDung, chiNhanh, phanCong } = phamViTrang(p, {}, demoToday());
  const lopToi = new Set(phanCong.map((a) => a.classId));
  const lops = (lopTrongPhamVi(p, chiNhanh ?? undefined) ?? []).filter((c) => dangDung !== 'toi' || lopToi.has(c.id));
  return { rows: lops.map((c) => ({ id: c.id as number, scoringMode: (c.scoring_mode ?? null) as string | null })) };
}

export function danhSachHocVienLop(
  p: Principal, f: { branchId?: number | null; q?: string | null; phamVi?: string | null; cnNho?: number | null; them?: boolean; chuaTvv?: boolean } = {},
): TrangHocVienLop {
  const today = demoToday();
  const conn = db();
  const { coThe, dangDung, chiNhanh, phanCong, lopCuaToi } = phamViTrang(p, f, today);
  /*
   * "+ LỚP MỚI" đầu trang: không gắn với lớp nào — PR-QU (B) kiểm `CLASS_CREATE` theo TỪNG chi nhánh đang hoạt động (không chỉ chi nhánh
   * người xem thấy được: GV được cấp riêng `class.create` ở một chi nhánh vẫn chỉ "thấy" lớp mình dạy).
   */
  const coTheTaoLop = chiNhanhTaoLop(p).length > 0;
  const phamVi = { coThe, dangDung, chiNhanh };
  const dl = danhSachLuuTru(p, {});
  const demLuuTru = { lop: dl.lop.length, hv: dl.hocVien.length };
  /* Đang tìm: hỏi theo mọi lớp trong phạm vi (không lọc tìm); không tìm thì đọc cờ của các hàng (dưới). */
  const themTheoPhamVi = (f.q ?? '').trim()
    ? (lopTrongPhamVi(p, chiNhanh ?? undefined) ?? []).some((c) => can(p, PERMISSIONS.STUDENT_ADD, { classId: c.id }))
    : null;

  const base = listClassSummaries(p, {
    branchId: chiNhanh ?? undefined,
    q: f.q ?? undefined,
    /* Phạm vi quyết luôn badge chấm bài: "Lớp tôi dạy" đếm phần mình phải chấm (Q12 — thay cặp nút Tôi / Tất cả). */
    scope: dangDung === 'toi' ? 'mine' : 'managed',
  });
  if (base.scopeEmpty) return { rows: [], scopeEmpty: true, phamVi, dem: demRong(), hocVien: [], coTheTaoLop, coTheThemHocVien: false, demLuuTru };
  const lopToi = new Set(phanCong.map((a) => a.classId));
  const lops = dangDung === 'toi' ? base.rows.filter((r) => lopToi.has(r.id))
    : dangDung === 'cua-toi' ? base.rows.filter((r) => lopCuaToi.has(r.id)) : base.rows;
  if (!lops.length) return { rows: [], scopeEmpty: false, phamVi, dem: demRong(), hocVien: [], coTheTaoLop, coTheThemHocVien: !!themTheoPhamVi, demLuuTru };

  const ids = lops.map((r) => r.id);
  const ph = ids.map(() => '?').join(',');

  const gvcn = new Map<number, { id: number; name: string }>();
  for (const r of conn.prepare(
    `SELECT ta.class_id, u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
      WHERE ta.class_id IN (${ph}) AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id`,
  ).all(...ids) as any[]) if (!gvcn.has(r.class_id)) gvcn.set(r.class_id, { id: r.id, name: r.full_name });

  /*
   * Học viên đang học, không tính em đã lưu trữ — đúng cách `studentCount` của lớp đếm (Q18).
   *
   * PR-Qa (17, sửa theo rà soát planning): dựng TRƯỚC bước tính Case — `hv` đã có sẵn `class_id`
   * HIỆN TẠI của từng em, dùng lại để gom Case về đúng lớp em đang học, thay vì tự viết thêm một
   * câu SQL enrollment→class riêng (như hàm dựng riêng cũ ở `dongHocVien.ts` từng làm).
   */
  const hv = conn.prepare(
    `SELECT e.class_id, s.id, s.full_name, s.normalized_name, s.student_code, s.dob, s.email, s.status,
            cy.id AS cycle_id, cy.start_period_id, cy.exam_month, cy.target_score, cy.khong_cam_ket, cy.baseline_attempt_id, cy.baseline_score,
            cy.route, cy.exam_period_id, cy.exam_date, cy.thi_that_ngay, erp.week_start AS exam_week_start, erp.code AS exam_week_code, tv.full_name AS tvv,
            c.lich_mt AS lop_lich_mt, c.route AS lop_route,
            (SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status = 'planned' AND a.kind != 'mt0') AS so_luot_ke_hoach,   /* PR-MT0: MT0 không đếm */
            EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.kind = 'final' AND a.status != 'cancelled') AS co_cuoi_khoa,
            /* K2-05: FT đếm theo luật mốc kế tiếp (lichMt.ts) — MT lịch sử / tuần đã qua không phải "mốc tiếp theo". */
            (SELECT COUNT(*) FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
              WHERE a.cycle_id = cy.id AND a.kind != 'mt0' AND ${MOC_KE_TIEP_SQL('a', 'rp')}) AS so_moc_ke_tiep,
            (SELECT COALESCE(MAX(a.attempt_no), 0) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status != 'cancelled' AND a.kind != 'mt0'
              AND (a.status != 'planned' OR a.planned_period_id IS NOT NULL)) AS mt_cuoi,   /* PR-LM: lượt đã huỷ lịch không phải "đã tới MT" */
            /* P2 MT-DEM: bộ đếm Lộ trình = lượt MT đã xong / đã tạo (lichMt.ts). */
            (SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND ${LUOT_MT_XONG_SQL('a')}) AS so_mt_xong,
            (SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND ${LUOT_MT_TINH_SQL('a')}) AS so_mt_tong
       FROM enrollments e
       JOIN classes c ON c.id = e.class_id
       JOIN students s ON s.id = e.student_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
       LEFT JOIN report_periods erp ON erp.id = cy.exam_period_id
       LEFT JOIN users tv ON tv.id = s.consultant_user_id
      WHERE e.class_id IN (${ph}) AND e.status = 'active' AND s.archived_at IS NULL${dangDung === 'cua-toi' ? ' AND s.consultant_user_id = ?' : ''}${f.chuaTvv ? ' AND s.consultant_user_id IS NULL' : ''}`,
  ).all(mondayOfDate(demoToday()), ...ids, ...(dangDung === 'cua-toi' ? [p.userId] : [])) as any[];
  const lopCuaHv = new Map<number, number>(hv.map((h) => [h.id as number, h.class_id as number]));

  /*
   * Case của cả lô, đọc MỘT LẦN CHO MỖI CHI NHÁNH thực sự xuất hiện trong `lops` — không phải một lần
   * cho TOÀN BỘ hệ thống (`listCases(p, {})` không lọc phạm vi gì từng khiến hàm dựng riêng cũ quét
   * mọi Case rồi gọi `can()` từng dòng, chậm hàng chục giây trên Turso), và không gọi lần thứ hai cho
   * cùng việc (bản cũ gọi riêng một lần cho số Case từng lớp, một lần khác cho cờ lọc từng học viên).
   * Khi đang xem MỘT chi nhánh (`chiNhanh` đã set), `lops` chỉ có đúng một branchId nên đây gọn lại
   * thành đúng MỘT lời gọi — y hệt hành vi cũ.
   */
  const chiNhanhCuaLops = [...new Set(lops.map((r) => r.branchId))];
  const allCases = chiNhanhCuaLops.flatMap((b) => listCases(p, { branchId: b }).rows);

  /* Số Case đang mở của mỗi lớp — tra lớp HIỆN TẠI của học viên qua `lopCuaHv`, chỉ tính em đang học. */
  const soCaseByClass = new Map<number, number>();
  for (const c of allCases) {
    if (c.status === 'done' || c.studentId === null) continue;
    const classId = lopCuaHv.get(c.studentId);
    if (classId === undefined) continue;
    soCaseByClass.set(classId, (soCaseByClass.get(classId) ?? 0) + 1);
  }

  const tienDo = classProgressMany(ids);
  /* Việc tiếp theo của em (chip Cần làm), yêu cầu chờ duyệt, em quá hạn theo lớp — MỘT hàm dùng chung với `classOverview`. */
  const emTheoLop = new Map<number, number[]>();
  /* PR-CT: lớp rỗng (em đã chuyển đi hết, GVCN còn phải xác nhận bàn giao) vẫn có thẻ Báo QL theo lớp → cũng nằm trong tập lớp để đếm. */
  for (const id of ids) emTheoLop.set(id, []);
  for (const h of hv) emTheoLop.set(h.class_id, [...(emTheoLop.get(h.class_id) ?? []), h.id as number]);
  const ndEm = nhapDiemTheoEm(p, ids, today, (sid) => lopCuaHv.get(sid));
  const vl = viecHocVienTheoLop(p, {
    emTheoLop, cases: allCases, homNay: today, chuongTrinhTheoLop: new Map(lops.map((r) => [r.id, r.programmeCode ?? null])),
    nhapDiemTheoEm: ndEm,
  });

  /*
   * KỸ NĂNG SỬA ĐƯỢC của từng lớp, đọc MỘT LẦN cho cả lô — cùng khuôn `classes.ts` dùng để dựng `mySkills`/`editableByClass`
   * (mục "Lớp FT và lớp thường có bộ kỹ năng khác nhau"). `editableSkills` tự gọi `can(p, SCORE_EDIT, {classId, skill})`
   * cho từng môn, kèm đường sửa hộ `SCORE_OVERRIDE` — nên "có nhập điểm được không" ở đây khớp đúng công thức
   * `viewer.canEnterScores` của `classOverview` (Task 6), không tự chế một logic quyền song song đọc thẳng `phanCong`.
   */
  const programmes = allProgrammes();
  const skillsByClass = new Map<number, string[]>();
  for (const r of lops) {
    const prog = r.programmeCode ? programmes.get(r.programmeCode) ?? null : null;
    skillsByClass.set(r.id, prog?.skills ?? [...ENTRY_SKILLS]);
  }

  const rows: LopHocVienLop[] = lops.map((r) => {
    const pr = tienDo.get(r.id);
    return {
      ...r,
      gvcn: gvcn.get(r.id) ?? null,
      soCaseMo: soCaseByClass.get(r.id) ?? 0,
      soChoDuyet: vl.soChoDuyet.get(r.id) ?? 0, soEmQuaHan: vl.soEmQuaHan.get(r.id) ?? 0,
      tuanKetThuc: pr?.startWeekStart && pr.totalWeeks ? addDays(pr.startWeekStart, (pr.totalWeeks - 1) * 7) : null,
      viewer: {
        coTheSuaHocVien: can(p, PERMISSIONS.STUDENT_EDIT, { classId: r.id }),
        /* OV-13p: "+ Học viên" theo `student.add` (TVV / CX có, không có `student.edit`). */
        coTheThemHocVien: can(p, PERMISSIONS.STUDENT_ADD, { classId: r.id }),
        coTheBaoCase: can(p, PERMISSIONS.SOS_REPORT, { classId: r.id }),
        coTheGhiViPham: can(p, PERMISSIONS.VIOLATION_RECORD, { classId: r.id }),
        coTheNhapDiem: editableSkills(p, r.id, skillsByClass.get(r.id) ?? [...ENTRY_SKILLS]).length > 0,
        /* PR-LT: badge "Hết khoá" bấm được — cùng luật với classOverview.viewer.coTheChuyenTiep (Q2). */
        coTheChuyenTiep: can(p, PERMISSIONS.CLASS_EDIT, { classId: r.id }),
        coTheSuaThongTin: can(p, PERMISSIONS.STUDENT_EDIT_INFO, { classId: r.id }),
        coTheSuaThem: can(p, PERMISSIONS.STUDENT_EDIT_MORE, { classId: r.id }),
      },
    };
  });

  /* Tìm theo tên/mã HỌC VIÊN thì chỉ em khớp được đếm và được hiện; tìm theo MÃ LỚP thì cả lớp. */
  const q = (f.q ?? '').trim();
  const ql = q.toLowerCase();
  const qMa = chuanHoaMaLop(q);
  const maLop = new Map(lops.map((r) => [r.id, chuanHoaMaLop(r.code)]));
  const khop = (h: any) => !q
    || (!!qMa && (maLop.get(h.class_id) ?? '').includes(qMa))
    || String(h.full_name ?? '').toLowerCase().includes(ql)
    || String(h.normalized_name ?? '').includes(ql)
    || String(h.student_code ?? '').toUpperCase().includes(q.toUpperCase());
  const hvKhop = hv.filter(khop);

  const standing = standingFor(hvKhop.map((h) => h.id));

  /* OV-15h2 (ý 3): nhãn Bộ lọc thêm — CHỈ khi web hỏi (`them=1`, người dùng mở Bộ lọc thêm): lần mở trang thường không thêm câu đọc. */
  const them = f.them ? nhanLocThem(hvKhop.map((h) => h.id as number), allCases, standing) : null;
  const laFt = new Map(lops.map((r) => [r.id, r.programmeCode === 'FT']));
  /* OV-14b: lọc "Đã thi · chờ kết quả" — cùng tập với chip TVV / CX (`hvCuaToi.ts`). */
  const daThi = new Set(loTrinhChoKetQuaThi(today).map((x) => x.c.student_id as number));
  const hang = hangHvFt(hvKhop.filter((h) => laFt.get(h.class_id)), standing, allCases, vl);
  const hocVien: TrangHocVienLop['hocVien'] = hvKhop.map((h) => {
    const loc: LocHocVien[] = ['tat-ca'];
    const ft = !!laFt.get(h.class_id);
    /* T58/K2-02: "Đang SOS" chỉ Fast Track — lớp thường có "SOS n" theo số môn trượt nhưng không phải cờ của chip này. */
    if (ft && (standing.get(h.id)?.sosLevel ?? 0) > 0) loc.push('sos');
    const v = vl.theoEm.get(h.id);
    if (v?.viec.some((x) => x.tone === 'danger' || x.tone === 'warn')) loc.push('can-lam');
    /* PR-S4F #4: cùng điều kiện với `soEmQuaHan` (viecHocVienTheoLop) — badge "n HV quá hạn việc" = số dòng khi bấm. */
    if (v?.viec.some((x) => x.tone === 'danger')) loc.push('qua-han');
    if (v?.choDuyet) loc.push('cho-duyet');
    const thieu = missingForStudent({
      cycle: h.cycle_id
        ? { start_period_id: h.start_period_id, exam_month: h.exam_month, target_score: h.target_score, khong_cam_ket: h.khong_cam_ket,
            baseline: h.baseline_attempt_id !== null || h.baseline_score !== null }
        : null,
      student: { dob: h.dob, email: h.email },
      isFastTrack: !!laFt.get(h.class_id),
      hasNextMilestone: h.status !== 'active' ? undefined
        : laFt.get(h.class_id)
          ? coMocTiepTheo({ coMoc: h.so_moc_ke_tiep > 0, soMt: lichMtCua({ lich_mt: h.lop_lich_mt, route: h.lop_route }, h.route).length, mtCuoi: h.mt_cuoi, coNgayThi: !!(h.exam_month || h.exam_period_id) })
          : coMocTiepTheoThuong({ soLuotKeHoach: h.so_luot_ke_hoach, coCuoiKhoa: !!h.co_cuoi_khoa }),
    });
    if (thieu.length) loc.push('thieu_tt');
    if (daThi.has(h.id)) loc.push('da-thi');
    /* OV-12f: tên + mã + ô thiếu — dòng "Thiếu thông tin" / "Chờ duyệt" của góc Cần làm (em không có việc ở Công việc vẫn có tên). */
    const nd = ndEm.get(h.id);
    return { id: h.id as number, classId: h.class_id as number, loc, khung: ft ? 'ft' as const : 'thuong' as const,
      ten: h.full_name as string, ma: (h.student_code ?? '') as string, ...(thieu.length ? { thieu: thieu.map((m) => m.label) } : {}),
      ...(them ? { them: them.get(h.id as number) } : {}), ...(ft && hang.has(h.id) ? { hang: hang.get(h.id) } : {}),
      tvv: h.tvv ?? null, lich: trangThaiLichThi(h, examPlanOf(h), today),
      /* UI-HV-LOP (XM-2): ⋯ dòng em có "Nhập điểm" chỉ khi người xem còn ô chờ nhập của em — lượt sớm nhất còn nợ (`nhapDiemTheoEm`, cùng nguồn Công việc). */
      ...(nd?.thuTu ? { nhapDiem: { kind: nd.thuTu.kind, attemptNo: nd.thuTu.attempt_no, dot: nd.dot } } : {}) };
  });
  /*
   * OV-11g (HL-19, Q11): em Kết thúc học chưa Lưu trữ — hiện mờ ở lớp CUỐI (cùng điều kiện `classRoster(…, kemKetThuc)`), chỉ trong "Tất cả":
   * không vào chip việc. "Tất cả" của QL = của CX cùng chi nhánh (`chipHocVien` lấy mọi em chưa lưu trữ).
   */
  const cuaToi = dangDung === 'cua-toi';
  for (const h of (conn.prepare(
    `SELECT e.class_id, s.id, s.full_name, s.normalized_name, s.student_code FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id IN (${ph}) AND e.status = 'completed' AND s.status = 'finished' AND s.archived_at IS NULL
        AND e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id)${cuaToi ? ' AND s.consultant_user_id = ?' : ''}`,
  ).all(...ids, ...(cuaToi ? [p.userId] : [])) as any[]).filter(khop)) {
    hocVien.push({ id: h.id as number, classId: h.class_id as number, loc: ['tat-ca'], khung: laFt.get(h.class_id) ? 'ft' : 'thuong', ten: h.full_name, ma: h.student_code ?? '', ketThuc: true });
  }

  const coTheThemHocVien = themTheoPhamVi ?? rows.some((r) => r.viewer.coTheThemHocVien);
  return { rows, scopeEmpty: false, phamVi, dem: demLoc(hocVien, 'tat-ca'), hocVien, coTheTaoLop, coTheThemHocVien, demLuuTru };
}

/**
 * TRƯỜNG HÀNG HV (SV-SO3, `HangHv`) cho em Fast Track. MT gần nhất = lượt của `standing` với CHÍNH Overall / kỳ vọng / SOS của nó (cùng số cột Kết quả các màn);
 * tuần (theo `periodCode`) + 5 ô điểm (`diemCuaLuot` đã nạp ở `standingFor`); Xu hướng = `luotTruocCoOverall` (cùng hàm So lượt trước của Kết quả MT). Case / PA / Ý thức đọc từ
 * `viecHocVienTheoLop` đã chạy cho trang. Thêm: tuần (1 câu) + `luotTheoLoTrinh` (1 câu / lô, chỉ em có Xu hướng).
 */
function hangHvFt(hv: readonly any[], standing: Map<number, Standing>, allCases: readonly MappedCase[],
  vl: { hoTro: Map<number, { soPa: number; quaHan: boolean }>; bacYThuc: Map<number, string> }): Map<number, HangHv> {
  const out = new Map<number, HangHv>();
  if (!hv.length) return out;
  /* Chỉ lộ trình của em có Overall ở lượt ≥ MT1 — mới có Xu hướng (TD3-b: không đọc lượt của em không cần). */
  const theoCy = luotTheoLoTrinh(hv.map((h) => standing.get(h.id)).filter((st) => st?.overall != null && (st.attemptNo ?? 0) > 0).map((st) => st!.cycleId!).filter(Boolean));
  /* Tuần thi của lượt `standing` theo nhãn tuần (`periodCode` "W1 SEP 2026" kèm năm) — một câu, mỗi tuần một dòng. */
  const tuanCua = new Map<string, string>();
  theoLo([...new Set(hv.map((h) => standing.get(h.id)?.periodCode).filter((x): x is string => !!x))], (lo, ph) => {
    for (const r of db().prepare(`SELECT code, week_start FROM report_periods WHERE code IN (${ph})`).all(...lo) as any[]) tuanCua.set(r.code, r.week_start);
  });
  const diem = diemCuaLuot(hv.map((h) => standing.get(h.id)?.attemptId).filter((x): x is number => !!x));
  const soCase = new Map<number, number>();
  for (const c of allCases) if (c.status !== 'done' && c.studentId !== null) soCase.set(c.studentId, (soCase.get(c.studentId) ?? 0) + 1);
  for (const h of hv) {
    const st = standing.get(h.id);
    const ds = st?.cycleId ? theoCy.get(st.cycleId) : undefined;
    const coLuot = st?.attemptId != null && st.attemptNo != null;
    const truoc = coLuot && st!.overall !== null ? luotTruocCoOverall(ds, st!.attemptNo!) : null;
    const band = (k: string) => (coLuot ? diem.get(st!.attemptId!)?.find((r) => r.skill === k)?.band ?? null : null);
    const sos = st?.sosLevel && st.sosLevel > 0 ? st.sosLevel : null;
    out.set(h.id, {
      loTrinh: { mt: h.so_mt_xong ?? 0, soMt: h.so_mt_tong ?? 0,
        target: h.target_score ?? null, kck: !!h.khong_cam_ket },
      mtGan: coLuot ? { mt: st!.attemptNo!, tuan: st!.periodCode ? tuanCua.get(st!.periodCode) ?? null : null, ovr: st!.overall, kyVong: st!.expectation,
        kn: { L: band('listening'), R: band('reading'), W1: band('writing1'), W2: band('writing2'), S: band('speaking') } } : null,
      xuHuong: truoc ? { lech: st!.overall! - truoc.ovr, soMt: truoc.mt } : null,
      ke: st?.nextAttemptLabel ? { luot: st.nextAttemptLabel, kyVong: st.nextKyVong ?? null } : null,
      hoTro: { sos, kyNang: sos ? (st?.belowSkills ?? []).map((b) => b.skill) : [], soCase: soCase.get(h.id) ?? 0,
        soPa: vl.hoTro.get(h.id)?.soPa ?? 0, quaHan: vl.hoTro.get(h.id)?.quaHan ?? false },
      yThuc: vl.bacYThuc.get(h.id) ?? null,
    });
  }
  return out;
}

/**
 * NHÃN BỘ LỌC THÊM của từng em (OV-15h2 ý 3) — cùng nguồn trang đã đọc: Case đang mở (`allCases` → `chiTietCaseMo`, trạng thái V4 + PA), kết quả gần nhất
 * (`standing`). Thêm: các câu của `chiTietCaseMo` cho Case ĐANG MỞ của các em trên trang + một câu tuần thi của lượt gần nhất (mỗi lô ≤ 900 lượt).
 */
function nhanLocThem(ids: readonly number[], allCases: readonly MappedCase[], standing: Map<number, unknown>): Map<number, ThemEm> {
  const co = new Set(ids);
  const mo = allCases.filter((c) => c.status !== 'done' && c.studentId !== null && co.has(c.studentId));
  const ct = chiTietCaseMo(mo);
  const caseEm = new Map<number, { k: string; pa: { xong: boolean }[] }[]>();
  for (const c of mo) {
    const x = ct.get(c.id);
    if (x) caseEm.set(c.studentId!, [...(caseEm.get(c.studentId!) ?? []), { k: x.trangThai.k, pa: x.pas }]);
  }
  const st = (id: number) => (standing.get(id) as KetQuaVao | undefined) ?? null;
  const luot = [...new Set(ids.map((id) => st(id)?.attemptId).filter((x): x is number => !!x))];
  const tuan = new Map<number, string>();
  theoLo(luot, (lo, ph) => {
    for (const r of db().prepare(
      `SELECT k.attempt_id, MIN(pr.week_start) AS tuan FROM attempt_skills k JOIN report_periods pr ON pr.id = k.planned_period_id
        WHERE k.attempt_id IN (${ph}) AND k.required = 1 AND k.sit_status != 'cancelled' GROUP BY k.attempt_id`).all(...lo) as any[]) tuan.set(r.attempt_id, String(r.tuan).slice(0, 10));
  });
  return new Map(ids.map((id) => {
    const s = st(id);
    return [id, { case: nhomCaseEm(caseEm.get(id) ?? []), kn: kyNangLoc(s), kq: ketQuaLoc(s), tuan: s?.attemptId ? tuan.get(s.attemptId) ?? null : null }];
  }));
}

/** PR-QU (B): chi nhánh đang hoạt động mà người này tạo lớp được (`class.create` phủ chi nhánh đó). */
export function chiNhanhTaoLop(p: Principal): number[] {
  return (db().prepare(`SELECT id FROM branches WHERE status = 'active' ORDER BY id`).all() as any[])
    .map((r) => r.id as number).filter((b) => can(p, PERMISSIONS.CLASS_CREATE, { branchId: b }));
}

/**
 * PR-NV (T9): chi nhánh mặc định gợi ý cho Quản lý / Quản trị — vai Quản lý ở chi nhánh nào (nhiều → nơi dạy nhiều lớp hơn), không thì
 * chi nhánh có nhiều lớp mình dạy / chủ nhiệm nhất. Vai khác (GV dạy hai chi nhánh giữ "Tất cả") hoặc không chọn được → null.
 */
export function goiYChiNhanh(p: Principal, homNay: string): number | null {
  if (!laVaiQuanLy(p.roleKeys)) return null;
  const quanLy = [...new Set(p.grants.filter((g) => g.roleKey === 'manager' && g.branchId !== null).map((g) => g.branchId as number))];
  const lop = bangLop();
  const lopDay = [...new Set(p.assignments
    .filter((a) => a.effectiveFrom <= homNay && (!a.effectiveTo || a.effectiveTo >= homNay)).map((a) => a.classId))]
    .map((id) => lop.get(id)?.branchId).filter((b): b is number => typeof b === 'number');
  return chiNhanhMacDinh({ daChon: null, quanLy, lopDay, cuoi: null });
}
