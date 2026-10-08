import { chenNhieuDong, db, tx } from '../db.ts';
import { HV_DANG_HOC_SQL, dongHocVien } from '../students/tamDung.ts';
import {
  NORMAL_LADDER, PERMISSIONS, chuanHoaHuong, nhanHuong, nhanTiepTheo, soSanhLop, trongHaiTuanCuoi,
  type Huong, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { badRequest, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { classProgress } from './schedule.ts';
import { standingFor } from '../students/standing.ts';
import { coTheRaLenh } from './quyenChuyenLop.ts';
import { cuoiKhoaTheoHocVien } from '../normal/cuoiKhoa.ts';
import { dongBoMt0, mt0TheoHocVien } from '../fasttrack/mt0.ts';

/**
 * LỘ TRÌNH TIẾP THEO (PR-LT, Q1, §3.9.1) — dự định của một em SAU lớp đang học, ghi trước khi
 * thật sự chuyển (`luatLoTrinh.ts` mới là nơi CHUYỂN thật). Chỉ áp dụng lớp thường.
 */

type LopDuKien = { id: number; code: string; ma: ProgrammeCode | null; ft: boolean };
type BanGhiLoTrinh = {
  huong: Huong; lopDuKienId: number | null; mucTieu: number | null; thangThi: string | null; ghiChu: string | null;
  /** PR-K26: hẹn xem lại của "Chưa quyết" — tuỳ chọn ở bước này, bắt buộc ở Chuyển tiếp lớp. */
  ngayXemLai: string | null;
  /** PR-LCb: Hướng GVCN đề xuất (cột "Gợi ý · GVCN") — quyết định của Quản lý không ghi đè; null = GVCN chưa ghi. */
  huongGvcn: Huong | null;
};

function enrollmentDangHoc(studentId: number): any {
  return db()
    .prepare(
      `SELECT e.*, c.code, c.programme_code, c.is_fast_track, c.branch_id FROM enrollments e
         JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = ? AND e.status = 'active' LIMIT 1`,
    )
    .get(studentId) as any;
}

function banGhiRowToView(row: any): BanGhiLoTrinh | null {
  if (!row) return null;
  return {
    huong: row.huong as Huong, lopDuKienId: row.lop_du_kien_id ?? null,
    mucTieu: row.muc_tieu ?? null, thangThi: row.thang_thi ?? null, ghiChu: row.ghi_chu ?? null, ngayXemLai: row.ngay_xem_lai ?? null,
    huongGvcn: (row.huong_gvcn ?? null) as Huong | null,
  };
}

/** GET /students/:id/lo-trinh-tiep (STUDENT_VIEW). */
export function layLoTrinhTiep(p: Principal, studentId: number) {
  const conn = db();
  const s = conn.prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');

  const enr = enrollmentDangHoc(studentId);
  if (!enr) return { lop: null, banGhi: null, lopDuKien: [] as LopDuKien[], coTheGhi: false, ketQua: null, cuoiKhoa: null, mt0: null };

  const ma = (enr.programme_code ?? null) as ProgrammeCode | null;
  const laLopThuong = !enr.is_fast_track;
  const maKe = laLopThuong ? (NORMAL_LADDER[ma as ProgrammeCode] ?? null) : null;
  const banGhi = banGhiRowToView(
    conn.prepare('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(studentId, enr.class_id),
  );
  const coTheGhi = laLopThuong && can(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id });

  const lopDuKien: LopDuKien[] = laLopThuong
    ? (conn
      .prepare(
        `SELECT id, code, programme_code, is_fast_track FROM classes
          WHERE branch_id = ? AND status = 'active' AND id != ?
            AND (programme_code = ? OR programme_code = ? OR is_fast_track = 1)
          ORDER BY code`,
      )
      .all(enr.branch_id, enr.class_id, maKe, ma) as any[])
      .sort((a, b) => soSanhLop({ code: a.code }, { code: b.code }))
      .map((r) => ({ id: r.id, code: r.code, ma: r.programme_code ?? null, ft: !!r.is_fast_track }))
    : [];

  return {
    lop: { id: enr.class_id, code: enr.code, ma, maKe, laLopThuong, dangHoc: true },
    banGhi, lopDuKien, coTheGhi,
    /** B9: kết quả gần nhất của em — đầu panel Lộ trình tiếp theo hiện chính + hai dòng (`ketQuaGanNhat`). */
    ketQua: standingFor([studentId]).get(studentId) ?? null,
    /** PR-LT2b (K2-26): dòng dữ kiện đầu panel — % Cuối khoá, môn trượt, hướng gợi ý (không lưu). */
    cuoiKhoa: laLopThuong ? cuoiKhoaTheoHocVien(enr.class_id, [studentId]).get(studentId) ?? null : null,
    /** PR-MT0: dòng phụ `MT0 · W4 OCT` dưới lựa chọn Lên FT. */
    mt0: mt0TheoHocVien([studentId]).get(studentId) ?? null,
  };
}

type GhiVao = {
  huong: string; lopDuKienId?: number | null; mucTieu?: number | null; thangThi?: string | null; ghiChu?: string | null; ngayXemLai?: string | null;
};
/** Lớp đang học của em — đủ cho luật kiểm (chương trình, chi nhánh). */
type LopNguon = { class_id: number; programme_code: string | null; branch_id: number };
type DongGhi = {
  studentId: number; classId: number; ma: ProgrammeCode | null; huong: Huong; lopDuKienId: number | null; mucTieu: number | null;
  thangThi: string | null; ghiChu: string | null; ngayXemLai: string | null;
};
const GHI_CHU_TOI_DA = 500;

/** Lớp dự kiến theo id — MỘT câu cho cả lô. */
function docLopDuKien(ids: readonly (number | null | undefined)[]): Map<number, any> {
  const cac = [...new Set(ids.filter((x): x is number => Number.isInteger(x) && (x as number) > 0))];
  if (!cac.length) return new Map();
  return new Map((db().prepare(
    `SELECT id, programme_code, is_fast_track, branch_id FROM classes WHERE id IN (${cac.map(() => '?').join(',')})`,
  ).all(...cac) as any[]).map((r) => [r.id as number, r]));
}

/**
 * KIỂM một dòng (PR-K26) — không đọc DB: lớp dự kiến đã đọc sẵn (`lopDuKien`). `ngayCu`: ngày xem lại đang lưu — giữ nguyên thì được
 * dù đã qua (dữ liệu cũ), đổi sang ngày mới thì phải từ hôm nay trở đi. Ghi một em và ghi cả lớp dùng chung.
 * PR-LCb: `lopCu` = lớp dự kiến đang lưu — giữ nguyên thì không kiểm "cùng chi nhánh" (quyết định của QL có thể chuyển sang lớp chi nhánh khác).
 */
function kiemDong(studentId: number, enr: LopNguon, input: GhiVao, lopDuKien: Map<number, any>, ngayCu: string | null, lopCu: number | null = null): DongGhi {
  /* Form cũ đang mở còn gửi `chua_ro`/`xep_sau` → `chua_quyet`, không báo lỗi. */
  const huong = chuanHoaHuong(String(input.huong ?? ''));
  if (!huong) throw badRequest('Hướng không hợp lệ.');
  const ngayXemLai = huong === 'chua_quyet' ? (input.ngayXemLai || null) : null;
  if (ngayXemLai && !isIsoDate(ngayXemLai)) throw badRequest('Ngày xem lại không hợp lệ.');
  if (ngayXemLai && ngayXemLai !== ngayCu && ngayXemLai < demoToday()) throw badRequest('Ngày xem lại phải từ hôm nay trở đi.');
  const mucTieu = input.mucTieu ?? null;
  if (mucTieu !== null && (typeof mucTieu !== 'number' || mucTieu < 0 || mucTieu > 9 || Math.round(mucTieu * 2) !== mucTieu * 2)) {
    throw badRequest('Target phải từ 0 đến 9, bước 0,5.');
  }
  const ghiChu = typeof input.ghiChu === 'string' ? input.ghiChu.trim() || null : null;
  if (ghiChu && ghiChu.length > GHI_CHU_TOI_DA) throw badRequest(`Ghi chú tối đa ${GHI_CHU_TOI_DA} ký tự.`);

  const lopDuKienId = input.lopDuKienId || null;
  if (lopDuKienId) {
    const lop = lopDuKien.get(lopDuKienId);
    if (!lop || (lop.branch_id !== enr.branch_id && lopDuKienId !== lopCu)) throw badRequest('Không tìm thấy lớp dự kiến.');
    const maKe = NORMAL_LADDER[(enr.programme_code ?? null) as ProgrammeCode] ?? null;
    if (huong === 'len_lop' && (lop.is_fast_track || lop.programme_code !== maKe)) throw badRequest('Lớp dự kiến phải là chương trình kế tiếp.');
    if (huong === 'hoc_lai' && (lop.is_fast_track || lop.programme_code !== enr.programme_code)) {
      throw badRequest('Lớp dự kiến phải cùng chương trình để học lại.');
    }
    if (huong === 'fast_track' && !lop.is_fast_track) throw badRequest('Lớp dự kiến phải là Fast Track.');
  }
  return {
    studentId, classId: enr.class_id, ma: (enr.programme_code ?? null) as ProgrammeCode | null, huong, lopDuKienId, mucTieu,
    thangThi: input.thangThi ?? null, ghiChu, ngayXemLai,
  };
}

/**
 * GHI theo lô: bản ghi + hành trình + nhật ký — ba câu cho cả lô (Turso: không N câu trong một giao dịch). Gọi trong `tx`.
 * `tuLenh` (PR-LCa, LCa-1): ghi theo quyết định của Quản lý — map em → Hướng LTT trước đó (không có dòng → không có khoá) + hướng đó có
 * phải của GVCN không (R9: đã là quyết định `cho` của QL thì không). Khi đó Target, ghi chú, tháng thi, ngày xem lại trống thì GIỮ cái đã
 * lưu (chủ sản phẩm 08/10: lệnh hướng khác không xoá Target GVCN ghi; thay R7), và chỉ em ĐỔI hướng mới có dòng Hành trình "QL quyết: …"
 * (ra lệnh lại / migrate không nhân đôi).
 * PR-LCb: `daQuyet` = em đã có quyết định `cho` (từ `chanQlDaQuyet`). Đường KHÔNG từ lệnh, người ghi KHÔNG ra lệnh được (GVCN) → `huong_gvcn`
 * = Hướng ghi, trừ em đã có quyết định (GVCN chỉ sửa ghi chú). Đường từ lệnh không có cột này (migrate PR-LC chạy trước khi cột có) và
 * "Lưu hướng" của Quản lý giữ nguyên `huong_gvcn`. Rà cuối m1: GVCN gửi lại ĐÚNG Hướng đang lưu (vd của QL, chỉ sửa ghi chú) → giữ `huong_gvcn`
 * cũ (vế SET đọc dòng cũ), không biến Hướng của QL thành đề xuất GVCN.
 */
function ghiCacDong(p: Principal, dongs: readonly DongGhi[], tuLenh?: ReadonlyMap<number, { huong: Huong; cuaGvcn: boolean }>, daQuyet?: ReadonlySet<number>): void {
  const now = nowIso();
  const homNay = demoToday();
  const giu = (cot: string) => tuLenh ? `COALESCE(excluded.${cot}, lo_trinh_tiep_theo.${cot})` : `excluded.${cot}`;
  const raLenhDuoc = new Map<number, boolean>();
  const laGvcn = (classId: number) => {
    if (!raLenhDuoc.has(classId)) raLenhDuoc.set(classId, coTheRaLenh(p, classId));
    return !raLenhDuoc.get(classId);
  };
  const gvcn = (d: DongGhi) => (laGvcn(d.classId) && !daQuyet?.has(d.studentId) ? d.huong : null);
  chenNhieuDong(
    `INSERT INTO lo_trinh_tiep_theo
       (student_id, class_id, huong, lop_du_kien_id, muc_tieu, thang_thi, ghi_chu, ngay_xem_lai, updated_by, created_at, updated_at${tuLenh ? '' : ', huong_gvcn'})`,
    dongs.map((d) => [d.studentId, d.classId, d.huong, d.lopDuKienId, d.mucTieu, d.thangThi, d.ghiChu, d.ngayXemLai, p.userId, now, now,
      ...(tuLenh ? [] : [gvcn(d)])]),
    ` ON CONFLICT(student_id, class_id) DO UPDATE SET
       huong = excluded.huong, lop_du_kien_id = excluded.lop_du_kien_id, muc_tieu = ${giu('muc_tieu')},
       thang_thi = ${giu('thang_thi')}, ghi_chu = ${giu('ghi_chu')}, ngay_xem_lai = ${giu('ngay_xem_lai')}, da_ap_dung_luc = NULL,
       ${tuLenh ? '' : `huong_gvcn = CASE WHEN excluded.huong = lo_trinh_tiep_theo.huong THEN lo_trinh_tiep_theo.huong_gvcn
         ELSE COALESCE(excluded.huong_gvcn, lo_trinh_tiep_theo.huong_gvcn) END, `}updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
  );
  const nhan = (d: DongGhi, h: Huong) => nhanHuong(h, { ma: d.ma, maKe: NORMAL_LADDER[d.ma as ProgrammeCode] ?? null });
  const nhatKy = tuLenh ? dongs.filter((d) => tuLenh.get(d.studentId)?.huong !== d.huong) : dongs;
  chenNhieuDong(
    'INSERT INTO journey_events (student_id, event_type, event_date, title, created_by, created_at)',
    nhatKy.map((d) => {
      const cu = tuLenh?.get(d.studentId);
      const title = !tuLenh ? `Ghi lộ trình tiếp theo: ${nhan(d, d.huong)}` : `QL quyết: ${nhan(d, d.huong)}${cu?.cuaGvcn ? ` (GVCN: ${nhan(d, cu.huong)})` : ''}`;
      return [d.studentId, 'next_step', homNay, title, p.userId, now];
    }),
  );
  chenNhieuDong(
    'INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, after_json, created_at)',
    dongs.map((d) => [p.userId, 'student.next_step', 'student', d.studentId, JSON.stringify({
      huong: d.huong, lopDuKienId: d.lopDuKienId, mucTieu: d.mucTieu, thangThi: d.thangThi, ngayXemLai: d.ngayXemLai,
    }), now]),
  );
  /* PR-MT0: Lên FT (FOU/BE/ELE) tạo / mở lại MT0 tuần Final; rời Lên FT huỷ MT0 chưa điểm — cùng giao dịch, theo lô. */
  dongBoMt0(p.userId, dongs);
}

/**
 * PR-LCa (LCa-1): Quản lý ra / sửa quyết định Cuối khoá → Lộ trình tiếp theo theo ĐÚNG quyết định (hướng, lớp dự kiến = lớp chuyển đến,
 * Target, ngày xem lại của Bảo lưu; trống / KCK → giữ cái đã lưu) + MT0 ngay (`dongBoMt0` qua `ghiCacDong`). `huongCu`: Hướng LTT trước đó (nơi gọi đã đọc theo lô); `cuLaQl`: hướng
 * đó đã là quyết định `cho` của lớp này (R9 — Hành trình không ghi "(GVCN: …)"). Gọi trong `tx`.
 */
export function dongBoTuLenh(p: Principal, hang: readonly {
  studentId: number; classId: number; ma: ProgrammeCode | null; huong: Huong; lopDuKienId: number | null; mucTieu: number | null;
  ngayXemLai: string | null; huongCu: Huong | null; cuLaQl: boolean;
}[]): void {
  if (!hang.length) return;
  ghiCacDong(p, hang.map((h) => ({
    studentId: h.studentId, classId: h.classId, ma: h.ma, huong: h.huong, lopDuKienId: h.lopDuKienId, mucTieu: h.mucTieu,
    thangThi: null, ghiChu: null, ngayXemLai: h.ngayXemLai,
  })), new Map(hang.filter((h) => h.huongCu).map((h) => [h.studentId, { huong: h.huongCu!, cuaGvcn: !h.cuLaQl }])));
}

/**
 * PR-LCa (QM2, R2): em đã có quyết định Cuối khoá `cho` ở lớp này → không ai đổi Hướng ở Lộ trình tiếp theo (409, không lưu dòng nào);
 * cùng Hướng (sửa ghi chú) được. R8 + R11: không ai (GVCN hay Quản lý) đổi Target khác Target của quyết định Lên FT (KCK = trống); gửi lại
 * đúng Target đó được. Quản lý đổi Hướng / Target bằng cách sửa quyết định. MỘT câu cho cả lô. `ten`: có → lỗi nêu tên em (ghi cả lớp).
 */
function chanQlDaQuyet(classId: number, dongs: readonly DongGhi[], ten?: (sid: number) => string): Set<number> {
  const lenh = new Map((db().prepare(
    `SELECT l.student_id, l.huong, l.muc_tieu, l.khong_cam_ket, t.muc_tieu AS muc_tieu_ltt FROM lenh_chuyen_lop l
       LEFT JOIN lo_trinh_tiep_theo t ON t.student_id = l.student_id AND t.class_id = l.lop_nguon_id
      WHERE l.lop_nguon_id = ? AND l.boi_canh = 'cuoi-khoa' AND l.trang_thai = 'cho'`,
  ).all(classId) as any[]).map((r) => [r.student_id as number, r]));
  for (const d of dongs) {
    const l = lenh.get(d.studentId);
    /*
     * Target chỉ so khi quyết định là Lên FT — lệnh đổi sang hướng khác có thể còn Target cũ. Gửi lại Target đang lưu ở LTT được: lệnh KCK
     * không xoá Target đã ghi (I3), ghi lại ghi chú không bị chặn.
     */
    const doiTarget = l?.huong === 'fast_track' && (l.khong_cam_ket ? null : l.muc_tieu ?? null) !== d.mucTieu && (l.muc_tieu_ltt ?? null) !== d.mucTieu;
    if (l && (l.huong !== d.huong || doiTarget)) {
      throw conflict(`${ten ? `${ten(d.studentId)}: ` : ''}Quản lý đã quyết.`, { studentId: d.studentId });
    }
  }
  /* PR-LCb: em đã có quyết định → `ghiCacDong` giữ `huong_gvcn` cũ. */
  return new Set(lenh.keys());
}

/** PUT /students/:id/lo-trinh-tiep (STUDENT_EDIT ở lớp đang học). */
export function ghiLoTrinhTiep(p: Principal, studentId: number, input: GhiVao) {
  const conn = db();
  const s = conn.prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const enr = enrollmentDangHoc(studentId);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id }, 'Bạn không có quyền ghi lộ trình tiếp theo cho học viên này.');
  if (enr.is_fast_track) throw badRequest('Lộ trình tiếp theo chỉ áp dụng cho lớp thường.');
  const cu = conn.prepare('SELECT ngay_xem_lai, lop_du_kien_id FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(studentId, enr.class_id) as any;
  const dong = kiemDong(studentId, enr, input, docLopDuKien([input.lopDuKienId]), cu?.ngay_xem_lai ?? null, cu?.lop_du_kien_id ?? null);
  tx(() => ghiCacDong(p, [dong], undefined, chanQlDaQuyet(enr.class_id, [dong])));
  return layLoTrinhTiep(p, studentId);
}

/** Ghi cả lớp tối đa 60 em một lần (T3 — lớp đông nhất demo 32). */
export const GHI_CA_LOP_TOI_DA = 60;

function lopThuongCua(classId: number): any {
  const cls = db().prepare('SELECT id, code, programme_code, is_fast_track, branch_id FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  if (cls.is_fast_track) throw badRequest('Lộ trình tiếp theo chỉ áp dụng cho lớp thường.');
  return cls;
}

/**
 * GET /classes/:id/lo-trinh-tiep (PR-K26) — bảng "Ghi lộ trình tiếp theo cả lớp": mỗi em đang học một dòng (tên, % Cuối khoá + gợi ý,
 * bản ghi hiện tại). Số câu SQL không tăng theo số em (đọc theo lô).
 */
export function layLoTrinhTiepCaLop(p: Principal, classId: number) {
  const conn = db();
  const cls = lopThuongCua(classId);
  require_(p, PERMISSIONS.STUDENT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const ma = (cls.programme_code ?? null) as ProgrammeCode | null;
  const maKe = NORMAL_LADDER[ma as ProgrammeCode] ?? null;
  const em = conn.prepare(
    `SELECT s.id, s.full_name, s.student_code FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
  ).all(classId) as any[];
  em.sort((a, b) => String(a.full_name).localeCompare(String(b.full_name), 'vi'));
  const sids = em.map((r) => r.id as number);
  const ck = sids.length ? cuoiKhoaTheoHocVien(classId, sids) : new Map();
  const banGhi = tiepTheoTheoHocVien([classId]);
  const mt0 = mt0TheoHocVien(sids);
  return {
    /** PR-MT0: `tuanFinal` cho thanh đầu `{lớp} · {n} em · Final W4 OCT`. */
    lop: { id: classId, code: cls.code as string, ma, maKe, tuanFinal: classProgress(classId).finalWeekStart ?? null },
    coTheGhi: can(p, PERMISSIONS.STUDENT_EDIT, { classId }),
    toiDa: GHI_CA_LOP_TOI_DA,
    hocVien: em.map((r) => ({
      id: r.id as number, ten: r.full_name as string, ma: r.student_code as string,
      cuoiKhoa: ck.get(r.id) ?? null, banGhi: banGhi.get(r.id) ?? null, mt0: mt0.get(r.id) ?? null,
    })),
  };
}

/**
 * PUT /classes/:id/lo-trinh-tiep (PR-K26) — ghi nhiều em trong MỘT giao dịch: một dòng sai thì không lưu dòng nào, lỗi nêu tên em và
 * `details.studentId` để web chỉ đúng dòng. Cùng quyền với ghi một em (STUDENT_EDIT theo lớp). Dòng giữ nguyên HƯỚNG đã lưu thì giữ cả
 * chi tiết đã lưu (lớp dự kiến, Target, tháng thi, ngày xem lại) — bảng chỉ sửa hướng + ghi chú, không được xoá mất chi tiết.
 */
export function ghiLoTrinhTiepCaLop(p: Principal, classId: number, body: { items?: unknown }): { daLuu: number } {
  const conn = db();
  lopThuongCua(classId);
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId }, 'Bạn không có quyền ghi lộ trình tiếp theo cho lớp này.');
  const items = body?.items;
  if (!Array.isArray(items) || !items.length) throw badRequest('Chưa có em nào để lưu.');
  if (items.length > GHI_CA_LOP_TOI_DA) throw badRequest(`Mỗi lần lưu tối đa ${GHI_CA_LOP_TOI_DA} em.`);
  const em = new Map((conn.prepare(
    `SELECT s.id, s.full_name, e.class_id, c.programme_code, c.branch_id FROM enrollments e
       JOIN students s ON s.id = e.student_id JOIN classes c ON c.id = e.class_id
      WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
  ).all(classId) as any[]).map((r) => [r.id as number, r]));
  const daCo = tiepTheoTheoHocVien([classId]);
  const thay = new Set<number>();
  for (const it of items as any[]) {
    const sid = Number(it?.studentId);
    if (!Number.isInteger(sid) || !em.has(sid)) throw badRequest('Có học viên không đang học lớp này.', { studentId: Number.isInteger(sid) ? sid : null });
    if (thay.has(sid)) throw badRequest(`${em.get(sid).full_name}: trùng dòng.`, { studentId: sid });
    thay.add(sid);
    /* R5: Target trên bảng cả lớp ("Lưu hướng" của Quản lý) — chỉ người sửa được lộ trình học (cycle.edit). */
    if (it && 'mucTieu' in it && !can(p, PERMISSIONS.CYCLE_EDIT, { classId })) throw forbidden('Chỉ Quản lý sửa Target.', { studentId: sid });
  }
  /* Dòng giữ nguyên hướng đã lưu thì giữ chi tiết đã lưu (bảng không có ô lớp dự kiến, Target, ngày xem lại). */
  const vao = (items as any[]).map((it) => {
    const sid = Number(it.studentId);
    const cu = daCo.get(sid);
    const giu = cu && cu.huong === chuanHoaHuong(String(it.huong ?? '')) ? cu : null;
    const input: GhiVao = {
      huong: String(it.huong ?? ''), ghiChu: typeof it.ghiChu === 'string' ? it.ghiChu : null,
      lopDuKienId: giu?.lopDuKienId ?? null, mucTieu: 'mucTieu' in it ? it.mucTieu : giu?.mucTieu ?? null, thangThi: giu?.thangThi ?? null, ngayXemLai: giu?.ngayXemLai ?? null,
    };
    return { sid, cu, input };
  });
  const lopDuKien = docLopDuKien(vao.map((v) => v.input.lopDuKienId));
  /* Kiểm HẾT trước khi ghi: một dòng sai → 400 có tên em + `studentId`, không câu ghi nào chạy. */
  const dongs = vao.map(({ sid, cu, input }) => {
    try { return kiemDong(sid, em.get(sid), input, lopDuKien, cu?.ngayXemLai ?? null, cu?.lopDuKienId ?? null); }
    catch (e: any) { throw badRequest(`${em.get(sid).full_name}: ${e.message}`, { studentId: sid }); }
  });
  tx(() => ghiCacDong(p, dongs, undefined, chanQlDaQuyet(classId, dongs, (sid) => em.get(sid).full_name)));
  return { daLuu: items.length };
}

/** Đọc theo lô: bản ghi Lộ trình tiếp theo của mọi em CÒN ĐANG HỌC các lớp `classIds` — một câu. */
export function tiepTheoTheoHocVien(classIds: number[]): Map<number, BanGhiLoTrinh> {
  const out = new Map<number, BanGhiLoTrinh>();
  if (!classIds.length) return out;
  const conn = db();
  const ph = classIds.map(() => '?').join(',');
  for (const r of conn
    .prepare(`SELECT * FROM lo_trinh_tiep_theo WHERE class_id IN (${ph})`)
    .all(...classIds) as any[]) {
    out.set(r.student_id, banGhiRowToView(r)!);
  }
  return out;
}

/**
 * Khối `lopHoc` ở cuối `studentProfile` (Task 3, `profile.ts`) — dòng dưới tên, nhắc chưa có
 * lộ trình, và cờ quyền của mọi nút ⋮ Hồ sơ HV liên quan tới lớp học (Q2, Q22).
 */
export function lopHocCua(p: Principal, studentId: number, current: any): {
  tiepTheo: string | null; nhacLoTrinh: boolean; chiXem: boolean;
  quyen: {
    ghiLoTrinhTiep: boolean; chuyenLop: boolean; deXuatChuyenLop: boolean; tamDung: boolean; quayLai: boolean;
    ketThuc: boolean; luuTru: boolean; boLuuTru: boolean; hocLai: boolean;
  };
} {
  const conn = db();
  const s = dongHocVien(studentId);
  const chiXem = !!s?.archived_at;
  if (chiXem) {
    return {
      tiepTheo: null, nhacLoTrinh: false, chiXem: true,
      quyen: {
        ghiLoTrinhTiep: false, chuyenLop: false, deXuatChuyenLop: false, tamDung: false, quayLai: false, ketThuc: false, luuTru: false,
        boLuuTru: can(p, PERMISSIONS.PLAN_WEEK, { studentId }),
        hocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId }),   // PR-LUI-b: đã lưu trữ ⇒ chắc chắn đã kết thúc học
      },
    };
  }

  let tiepTheo: string | null = null;
  let nhacLoTrinh = false;
  let laLopThuong = false;
  if (current) {
    const cls = conn.prepare('SELECT programme_code, is_fast_track FROM classes WHERE id = ?').get(current.class_id) as any;
    laLopThuong = !cls?.is_fast_track;
    if (laLopThuong) {
      const banGhi = conn
        .prepare('SELECT huong, ngay_xem_lai FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?')
        .get(studentId, current.class_id) as any;
      tiepTheo = nhanTiepTheo(banGhi ? { huong: banGhi.huong as Huong } : null, (cls?.programme_code ?? null) as ProgrammeCode | null);
      const pr = classProgress(current.class_id);
      /* PR-K26: "Chưa quyết" KHÔNG hẹn ngày vẫn được nhắc (như `chua_ro` cũ); có hẹn ngày thì không (như `xep_sau` cũ). */
      nhacLoTrinh = trongHaiTuanCuoi(pr.currentWeek, pr.totalWeeks, pr.phase) && (!banGhi || (banGhi.huong === 'chua_quyet' && !banGhi.ngay_xem_lai));
    }
  }

  const coTheChuyenLop = !!current && can(p, PERMISSIONS.STUDENT_EDIT, { classId: current.class_id });
  return {
    tiepTheo, nhacLoTrinh, chiXem: false,
    quyen: {
      ghiLoTrinhTiep: laLopThuong && coTheChuyenLop,
      /* PR-CT: Quản lý ra lệnh (`Chuyển lớp…`); GVCN đề xuất (`Đề xuất chuyển lớp…`). */
      chuyenLop: !!current && coTheRaLenh(p, current.class_id),
      deXuatChuyenLop: coTheChuyenLop && !coTheRaLenh(p, current.class_id),
      tamDung: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
      quayLai: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
      ketThuc: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
      luuTru: can(p, PERMISSIONS.PLAN_WEEK, { studentId }) && s?.status === 'finished',
      boLuuTru: false,
      hocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId }) && s?.status === 'finished',   // PR-LUI-b
    },
  };
}
