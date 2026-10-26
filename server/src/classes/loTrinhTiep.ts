import { chenNhieuDong, db, tx } from '../db.ts';
import { HV_DANG_HOC_SQL, dongHocVien } from '../students/tamDung.ts';
import {
  ghepMucTieu, tachMucTieu, type MucTieuLenh,
  CAU_LIEN_TUC, NORMAL_LADDER, PERMISSIONS, canLopDich, laLienTuc, maHocLai, chuanHoaHuong, kiemDongChuyenTiep, nhanHuong, nhanTiepTheo, soSanhLop, tuanHopLe,
  type Huong, type HuongLenh, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { badRequest, conflict, forbidden, isIsoDate, notFound, nowIso, loi } from '../util.ts';
import { writeAudit } from '../platform/audit.ts';
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
const CHI_QL = 'Chỉ Quản lý ghi lộ trình tiếp theo.';
/** Lộ trình tiếp theo chỉ của lớp thường CÓ SỐ TUẦN — không FT, không lớp liên tục (OV-6b2: PET, KET…). */
const coLoTrinhTiep = (c: { is_fast_track?: number | null; moc_lap?: number | null }) => !c.is_fast_track && !laLienTuc(c);

function enrollmentDangHoc(studentId: number): any {
  return db()
    .prepare(
      `SELECT e.*, c.code, c.programme_code, c.is_fast_track, c.branch_id, c.moc_lap FROM enrollments e
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
  const laLopThuong = coLoTrinhTiep(enr);
  const maKe = laLopThuong ? (NORMAL_LADDER[ma as ProgrammeCode] ?? null) : null;
  const banGhi = banGhiRowToView(
    conn.prepare('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(studentId, enr.class_id),
  );
  /* OV-3b: GVCN thôi ghi Hướng — chỉ Quản lý (`coTheRaLenh`). */
  const coTheGhi = laLopThuong && coTheRaLenh(p, enr.class_id);

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
  if (ghiChu && ghiChu.length > GHI_CHU_TOI_DA) throw loi(400, 'Ghi chú tối đa {GHI_CHU_TOI_DA} ký tự.', { GHI_CHU_TOI_DA });

  const lopDuKienId = input.lopDuKienId || null;
  if (lopDuKienId) {
    const lop = lopDuKien.get(lopDuKienId);
    if (!lop || (lop.branch_id !== enr.branch_id && lopDuKienId !== lopCu)) throw badRequest('Không tìm thấy lớp dự kiến.');
    const maKe = NORMAL_LADDER[(enr.programme_code ?? null) as ProgrammeCode] ?? null;
    if (huong === 'len_lop' && (lop.is_fast_track || lop.programme_code !== maKe)) throw badRequest('Lớp dự kiến phải là chương trình kế tiếp.');
    if (huong === 'hoc_lai' && (lop.is_fast_track || !maHocLai(enr.programme_code as ProgrammeCode).includes(lop.programme_code))) {
      throw badRequest('Lớp dự kiến phải cùng hoặc thấp hơn chương trình đang học để học lại.');
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
 * (ra lệnh lại / migrate không nhân đôi). OV-3b: chỉ Quản lý ghi — `huong_gvcn` giữ để đọc lịch sử, không ghi nữa.
 */
function ghiCacDong(p: Principal, dongs: readonly DongGhi[], tuLenh?: ReadonlyMap<number, { huong: Huong; cuaGvcn: boolean }>): void {
  const now = nowIso();
  const homNay = demoToday();
  const giu = (cot: string) => tuLenh ? `COALESCE(excluded.${cot}, lo_trinh_tiep_theo.${cot})` : `excluded.${cot}`;
  chenNhieuDong(
    `INSERT INTO lo_trinh_tiep_theo
       (student_id, class_id, huong, lop_du_kien_id, muc_tieu, thang_thi, ghi_chu, ngay_xem_lai, updated_by, created_at, updated_at)`,
    dongs.map((d) => [d.studentId, d.classId, d.huong, d.lopDuKienId, d.mucTieu, d.thangThi, d.ghiChu, d.ngayXemLai, p.userId, now, now]),
    ` ON CONFLICT(student_id, class_id) DO UPDATE SET
       huong = excluded.huong, lop_du_kien_id = excluded.lop_du_kien_id, muc_tieu = ${giu('muc_tieu')},
       thang_thi = ${giu('thang_thi')}, ghi_chu = ${giu('ghi_chu')}, ngay_xem_lai = ${giu('ngay_xem_lai')}, da_ap_dung_luc = NULL,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
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
function chanQlDaQuyet(classId: number, dongs: readonly DongGhi[], ten?: (sid: number) => string): void {
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
    const doiTarget = l?.huong === 'fast_track' && (l.muc_tieu ?? null) !== d.mucTieu && (l.muc_tieu_ltt ?? null) !== d.mucTieu;   // OV-9: lệnh KCK giữ số
    if (l && (l.huong !== d.huong || doiTarget)) {
      throw loi(409, '{x}Quản lý đã quyết.', { x: ten ? `${ten(d.studentId)}: ` : '' }, { studentId: d.studentId });
    }
  }
}

/** PUT /students/:id/lo-trinh-tiep (STUDENT_EDIT ở lớp đang học). */
export function ghiLoTrinhTiep(p: Principal, studentId: number, input: GhiVao) {
  const conn = db();
  const s = conn.prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const enr = enrollmentDangHoc(studentId);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  if (!coTheRaLenh(p, enr.class_id)) throw forbidden(CHI_QL);
  if (enr.is_fast_track) throw badRequest('Lộ trình tiếp theo chỉ áp dụng cho lớp thường.');
  if (laLienTuc(enr)) throw badRequest(CAU_LIEN_TUC.loTrinhTiep);
  const cu = conn.prepare('SELECT ngay_xem_lai, lop_du_kien_id FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(studentId, enr.class_id) as any;
  const dong = kiemDong(studentId, enr, input, docLopDuKien([input.lopDuKienId]), cu?.ngay_xem_lai ?? null, cu?.lop_du_kien_id ?? null);
  tx(() => { chanQlDaQuyet(enr.class_id, [dong]); ghiCacDong(p, [dong]); });
  return layLoTrinhTiep(p, studentId);
}

/** Ghi cả lớp tối đa 60 em một lần (T3 — lớp đông nhất demo 32). */
export const GHI_CA_LOP_TOI_DA = 60;

function lopThuongCua(classId: number): any {
  const cls = db().prepare('SELECT id, code, programme_code, is_fast_track, branch_id, moc_lap FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  if (cls.is_fast_track) throw badRequest('Lộ trình tiếp theo chỉ áp dụng cho lớp thường.');
  if (laLienTuc(cls)) throw badRequest(CAU_LIEN_TUC.loTrinhTiep);
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
    coTheGhi: coTheRaLenh(p, classId),
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
  if (!coTheRaLenh(p, classId)) throw forbidden(CHI_QL);
  const items = body?.items;
  if (!Array.isArray(items) || !items.length) throw badRequest('Chưa có em nào để lưu.');
  if (items.length > GHI_CA_LOP_TOI_DA) throw loi(400, 'Mỗi lần lưu tối đa {GHI_CA_LOP_TOI_DA} em.', { GHI_CA_LOP_TOI_DA });
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
    if (thay.has(sid)) throw loi(400, '{x}: trùng dòng.', { x: em.get(sid).full_name }, { studentId: sid });
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
  tx(() => { chanQlDaQuyet(classId, dongs, (sid) => em.get(sid).full_name); ghiCacDong(p, dongs); });
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
  tiepTheo: string | null; chiXem: boolean;
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
      tiepTheo: null, chiXem: true,
      quyen: {
        ghiLoTrinhTiep: false, chuyenLop: false, deXuatChuyenLop: false, tamDung: false, quayLai: false, ketThuc: false, luuTru: false,
        boLuuTru: can(p, PERMISSIONS.CYCLE_EDIT, { studentId }),
        hocLai: can(p, PERMISSIONS.CYCLE_EDIT, { studentId }),   // PR-LUI-b: đã lưu trữ ⇒ chắc chắn đã kết thúc học
      },
    };
  }

  let tiepTheo: string | null = null;
  let laLopThuong = false;
  if (current) {
    const cls = conn.prepare('SELECT programme_code, is_fast_track, moc_lap FROM classes WHERE id = ?').get(current.class_id) as any;
    laLopThuong = !!cls && coLoTrinhTiep(cls);
    if (laLopThuong) {
      const banGhi = conn
        .prepare('SELECT huong FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?')
        .get(studentId, current.class_id) as any;
      tiepTheo = nhanTiepTheo(banGhi ? { huong: banGhi.huong as Huong } : null, (cls?.programme_code ?? null) as ProgrammeCode | null);
    }
  }

  const coTheChuyenLop = !!current && can(p, PERMISSIONS.STUDENT_EDIT, { classId: current.class_id });
  const suaTrangThai = can(p, PERMISSIONS.STUDENT_EDIT, { studentId }) || can(p, PERMISSIONS.STUDENT_EDIT_MORE, { studentId });
  return {
    tiepTheo, chiXem: false,
    quyen: {
      /* OV-3b: mở hộp Lộ trình của em ở bảng lớp — chỉ Quản lý (`coTheRaLenh`). */
      ghiLoTrinhTiep: laLopThuong && coTheRaLenh(p, current.class_id),
      /* PR-CT: Quản lý ra lệnh (`Chuyển lớp…`); GVCN đề xuất (`Đề xuất chuyển lớp…`). */
      chuyenLop: !!current && coTheRaLenh(p, current.class_id),
      deXuatChuyenLop: coTheChuyenLop && !coTheRaLenh(p, current.class_id),
      /* OV-8b: TVV / CX (`student.edit_more`) cũng Tạm dừng / Quay lại / Thôi học. */
      tamDung: suaTrangThai,
      quayLai: suaTrangThai,
      ketThuc: suaTrangThai,
      luuTru: can(p, PERMISSIONS.CYCLE_EDIT, { studentId }) && s?.status === 'finished',
      boLuuTru: false,
      hocLai: can(p, PERMISSIONS.CYCLE_EDIT, { studentId }) && s?.status === 'finished',   // PR-LUI-b
    },
  };
}

// ==================================================================== OV-3b: NHÁP lộ trình (chỉ Quản lý)

/** Hướng của nháp = hướng của quyết định Cuối khoá (không có "Chưa quyết"). */
const HUONG_NHAP: readonly HuongLenh[] = ['len_lop', 'hoc_lai', 'fast_track', 'bao_luu', 'dung_hoc'];
export type NhapLoTrinh = {
  huong: HuongLenh; lopDichId: number | null; tuan: string | null; mucTieu: MucTieuLenh | null; ngayXemLai: string | null; ghiChu: string | null;
};
export const nhapRowToView = (r: any): NhapLoTrinh => ({
  huong: r.huong, lopDichId: r.lop_dich_id ?? null, tuan: r.tuan ?? null, mucTieu: ghepMucTieu(r.muc_tieu, r.khong_cam_ket),
  ngayXemLai: r.ngay_xem_lai ?? null, ghiChu: r.ghi_chu ?? null,
});
const CHI_QL_NHAP = 'Chỉ Quản lý lưu nháp lộ trình.';

/**
 * PUT /classes/:id/lo-trinh-nhap — QL / Quản trị (`coTheRaLenh`) lưu nháp nhiều em (≤ 60). Nháp KHÔNG ghi `lo_trinh_tiep_theo`, không lệnh, không MT0,
 * không việc, không chuông; chỉ người ra lệnh được đọc (`transitionPlan`). Lô lỗi một phần: dòng sai vào `failed` kèm lý do, dòng đúng vẫn lưu.
 * Nháp được thiếu (hướng chưa có lớp / tuần) — đủ hay chưa do lúc Chốt (`raLenh`) kiểm. Một câu em + một câu lệnh + một câu lớp đích + một câu ghi.
 */
export function luuNhap(p: Principal, classId: number, body: { items?: unknown }): { ok: number[]; failed: { studentId: number; message: string }[] } {
  const conn = db();
  const cls = lopThuongCua(classId);
  if (!coTheRaLenh(p, classId)) throw forbidden(CHI_QL_NHAP);
  const items = body?.items;
  if (!Array.isArray(items) || !items.length) throw badRequest('Chưa có em nào để lưu.');
  if (items.length > GHI_CA_LOP_TOI_DA) throw loi(400, 'Mỗi lần lưu tối đa {GHI_CA_LOP_TOI_DA} em.', { GHI_CA_LOP_TOI_DA });
  const em = new Set((conn.prepare(
    `SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
  ).all(classId) as any[]).map((r) => r.id as number));
  const daChot = new Set((conn.prepare(`SELECT student_id FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai = 'cho'`).all(classId) as any[])
    .map((r) => r.student_id as number));
  const ids = [...new Set((items as any[]).map((it) => Number(it?.toClassId)).filter((x) => Number.isInteger(x) && x > 0 && x !== classId))];
  const dich = new Map(ids.length ? (conn.prepare(
    `SELECT id, programme_code, is_fast_track FROM classes WHERE status = 'active' AND id IN (${ids.map(() => '?').join(',')})`,
  ).all(...ids) as any[]).map((r) => [r.id as number, r]) : []);
  const homNay = demoToday();
  const maTu = (cls.programme_code ?? null) as ProgrammeCode | null;
  const failed: { studentId: number; message: string }[] = [];
  const hang: unknown[][] = [];
  const thay = new Set<number>();
  for (const it of items as any[]) {
    const sid = Number(it?.studentId);
    const loi = (message: string) => { failed.push({ studentId: Number.isInteger(sid) ? sid : 0, message }); };
    if (!Number.isInteger(sid) || !em.has(sid)) { loi('Học viên không thuộc lớp này.'); continue; }
    if (thay.has(sid)) { loi('Trùng dòng.'); continue; }
    thay.add(sid);
    if (daChot.has(sid)) { loi('Đã chốt — sửa ở ô Lộ trình.'); continue; }
    const huong = String(it?.huong ?? '') as HuongLenh;
    if (!HUONG_NHAP.includes(huong)) { loi('Chọn hướng cho em.'); continue; }
    const toId = canLopDich(huong) && it?.toClassId ? Number(it.toClassId) : null;
    const lop = toId ? dich.get(toId) : null;
    if (toId && !lop) { loi('Lớp chuyển đến không hợp lệ.'); continue; }
    if (lop) {
      const lech = kiemDongChuyenTiep({ huong: huong as Huong, toClassId: toId, toClass: { ma: lop.programme_code ?? null, ft: !!lop.is_fast_track }, mucTieu: 5 }, { maTu });
      if (lech) { loi(`${lech}.`); continue; }
    }
    const tuan = it?.tuan || null;
    if (tuan && !tuanHopLe(tuan, homNay)) { loi('Tuần bắt đầu phải là hôm nay hoặc từ tuần sau trở đi.'); continue; }
    /* OV-9: "6.5 KCK" = Target + dấu KCK; "KCK" = dấu, chưa có Target. */
    const tg = huong === 'fast_track' && it?.mucTieu !== null && it?.mucTieu !== undefined && it?.mucTieu !== '' ? tachMucTieu(it.mucTieu) : null;
    const kck = !!tg?.kck;
    const mucTieu = tg?.target ?? null;
    if (mucTieu !== null && (!Number.isFinite(mucTieu) || mucTieu < 0 || mucTieu > 9 || Math.round(mucTieu * 2) !== mucTieu * 2)) { loi('Target phải từ 0 đến 9, bước 0,5.'); continue; }
    const ngayXemLai = huong === 'bao_luu' ? it?.ngayXemLai || null : null;
    if (ngayXemLai && !isIsoDate(ngayXemLai)) { loi('Tuần xem lại không hợp lệ.'); continue; }
    const ghiChu = typeof it?.ghiChu === 'string' ? it.ghiChu.trim() || null : null;
    if (ghiChu && ghiChu.length > GHI_CHU_TOI_DA) { loi(`Ghi chú tối đa ${GHI_CHU_TOI_DA} ký tự.`); continue; }
    hang.push([sid, classId, huong, toId, tuan, mucTieu, kck ? 1 : 0, ngayXemLai, ghiChu, p.userId, nowIso()]);
  }
  if (hang.length) {
    tx(() => {
      chenNhieuDong(
        'INSERT INTO lo_trinh_nhap (student_id, class_id, huong, lop_dich_id, tuan, muc_tieu, khong_cam_ket, ngay_xem_lai, ghi_chu, sua_boi, sua_luc)',
        hang,
        ` ON CONFLICT(student_id, class_id) DO UPDATE SET huong = excluded.huong, lop_dich_id = excluded.lop_dich_id, tuan = excluded.tuan,
           muc_tieu = excluded.muc_tieu, khong_cam_ket = excluded.khong_cam_ket, ngay_xem_lai = excluded.ngay_xem_lai, ghi_chu = excluded.ghi_chu,
           sua_boi = excluded.sua_boi, sua_luc = excluded.sua_luc`,
      );
      writeAudit({ actorUserId: p.userId, action: 'lo_trinh.nhap', entityType: 'class', entityId: classId, entityLabel: cls.code, after: { soEm: hang.length } });
    });
  }
  return { ok: hang.map((h) => h[0] as number), failed };
}

/** DELETE /classes/:id/lo-trinh-nhap/:studentId — Xoá nháp của một em (chỉ Quản lý). Không có nháp → vẫn ok (bấm hai lần không lỗi). */
export function xoaNhap(p: Principal, classId: number, studentId: number): { ok: true } {
  lopThuongCua(classId);
  if (!coTheRaLenh(p, classId)) throw forbidden(CHI_QL_NHAP);
  db().prepare('DELETE FROM lo_trinh_nhap WHERE class_id = ? AND student_id = ?').run(classId, studentId);
  return { ok: true };
}
