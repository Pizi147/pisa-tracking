import { chenNhieuDong, db, theoLo, tx } from '../db.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import {
  KHOI_PHUC_LENH_GIO, LO_HANG_LOAT_EM, laLienTuc, NHAN_XET_TOI_THIEU, PERMISSIONS, coPhieu, canLopDich, hanBanGiaoLenh, khacGoiY, mocLoTrinh, kiemDongChuyenTiep, kiemDongLenh, targetLenFt, tuanHopLe, tuanLich,
  type DemChotLoTrinh, type Huong, type HuongLenh, type MucTieuLenh, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { HttpError, badRequest, chuTuDo, conflict, forbidden, notFound, nowIso } from '../util.ts';
import { can, loadPrincipal, require_, type Principal } from '../permissions.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { reviseTarget } from '../fasttrack/cycles.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { taoYeuCau } from '../duyet/yeuCau.ts';
import { applyTransition } from './transition.ts';
import { apDungMotDong, dongLopNeuHet, huongChuyenMotEm, lopDichHopLe, nguoiNhanGoiY } from './luatLoTrinh.ts';
import { coTheRaLenh } from './quyenChuyenLop.ts';
import { classProgressMany, mocKetKhoa } from './schedule.ts';
import { cuoiKhoaTheoHocVien, dongBoCheTaiFinal } from '../normal/cuoiKhoa.ts';
import { dongBoTuLenh } from './loTrinhTiep.ts';

/**
 * LỆNH CHUYỂN LỚP do QUẢN LÝ quyết (PR-CT, §3.1f Q30-1): em nào · lớp chuyển đến nào · tuần bắt đầu (Thứ Hai, từ tuần sau trở đi).
 * Task 3: ra / sửa / huỷ quyết định. Tới Thứ Hai tuần bắt đầu mới thi hành (Task 4), bằng đúng luật lộ trình đang có.
 */

export type DongLenhVao = {
  studentId: number; huong: HuongLenh; toClassId?: number | null; tuan?: string | null;
  mucTieu?: MucTieuLenh | null; ngayThi?: string | null; lyDo?: string | null; ngayXemLai?: string | null;
};
export type BoiCanhLenh = 'cuoi-khoa' | 'giua-khoa';

/** Hướng nào dùng được ở bối cảnh nào (Q3, Q4): hết khoá lớp thường dùng len_lop/hoc_lai; giữa khoá (một em, FT) dùng chuyen_lop. */
const HUONG_THEO_BOI_CANH: Record<BoiCanhLenh, readonly HuongLenh[]> = {
  'cuoi-khoa': ['len_lop', 'hoc_lai', 'fast_track', 'bao_luu', 'dung_hoc'],
  'giua-khoa': ['chuyen_lop', 'fast_track', 'bao_luu', 'dung_hoc'],
};

const CUNG_LOP_CHI_NHANH = 'Chỉ Quản lý chi nhánh của lớp này mới ra quyết định chuyển lớp.';

/** GVCN đang hiệu lực + (khi `ql`) mọi Quản lý của các chi nhánh — cho thông báo. Tối đa ba câu cho cả lô lớp (không hỏi lại theo lớp). */
export function nguoiNhanCuaLop(lopIds: readonly number[], chiNhanhQl: readonly number[] = []): Map<number, Set<number>> {
  const conn = db();
  const out = new Map<number, Set<number>>();
  const them = (k: number, u: number) => { if (!out.has(k)) out.set(k, new Set()); out.get(k)!.add(u); };
  theoLo([...new Set(lopIds)], (lo, ph) => {
    for (const r of conn.prepare(`SELECT class_id, user_id FROM teacher_assignments WHERE class_id IN (${ph}) AND is_core = 1 AND status = 'active'`).all(...lo) as any[]) {
      them(r.class_id, r.user_id);
    }
  });
  if (chiNhanhQl.length) {
    const ql = conn.prepare(`SELECT DISTINCT ur.user_id, ur.branch_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'manager' AND ur.status = 'active'`).all() as any[];
    const cnCua = new Map<number, number>();
    theoLo([...new Set(lopIds)], (lo, ph) => {
      for (const r of conn.prepare(`SELECT id, branch_id FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) cnCua.set(r.id, r.branch_id);
    });
    for (const lop of lopIds) {
      const cn = cnCua.get(lop);
      if (cn === undefined || !chiNhanhQl.includes(cn)) continue;
      for (const q of ql) if (q.branch_id === null || q.branch_id === cn) them(lop, q.user_id);
    }
  }
  return out;
}

/**
 * RA LỆNH cho nhiều em một lượt (panel cả lớp B/I và panel một em D đều gọi). Một tx: dòng lỗi vào `failed`, dòng đúng ghi THEO LÔ bằng một
 * câu upsert — em đã có lệnh `cho` thì SỬA lệnh đó, không lệnh thứ hai (Q7, chỉ mục duy nhất một phần).
 */
export function raLenh(p: Principal, v: {
  lopNguonId: number; boiCanh: BoiCanhLenh; tuanChung: string | null; dongs: DongLenhVao[]; tuYeuCauId?: number | null;
}): { ok: number[]; failed: { studentId: number; message: string }[] } {
  const conn = db();
  const nguon = conn.prepare('SELECT * FROM classes WHERE id = ?').get(v.lopNguonId) as any;
  if (!nguon) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.CLASS_EDIT, { classId: v.lopNguonId }, CUNG_LOP_CHI_NHANH);
  if (!Array.isArray(v.dongs) || !v.dongs.length) throw badRequest('Chưa chọn học viên nào để chuyển.');
  if (v.dongs.length > 500) throw badRequest('Tối đa 500 học viên một lần quyết định.');   // PR-Dọn (Q6, quét #16)
  for (const d of v.dongs) chuTuDo(d?.lyDo, 'Lý do', 2000);   // PR-Dọn (Q4, quét #24)

  return tx(() => {
    const homNay = demoToday();
    const nguonFt = !!nguon.is_fast_track;
    const maTu = (nguon.programme_code ?? null) as ProgrammeCode | null;
    /* Tập em hợp lệ = đúng em còn ghi danh `active` ở lớp NGUỒN (như `applyTransition`). */
    const hopLe = new Set((conn.prepare(
      `SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
    ).all(v.lopNguonId) as any[]).map((r) => r.id as number));
    const dongs = [...new Map(v.dongs.map((d) => [d.studentId, d])).values()];
    const daCo = new Map<number, any>();
    theoLo(dongs.map((d) => d.studentId), (lo, ph) => {
      for (const r of conn.prepare(
        `SELECT student_id, lop_nguon_id, lop_dich_id, tuan_bat_dau, huong FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND student_id IN (${ph})`,
      ).all(...lo) as any[]) daCo.set(r.student_id, r);
    });
    /* Lớp chuyển đến đọc THEO LÔ: đang hoạt động, khác lớp nguồn. */
    const dich = new Map<number, any>();
    theoLo([...new Set(dongs.map((d) => d.toClassId).filter((x): x is number => !!x))], (lo, ph) => {
      for (const c of conn.prepare(
        `SELECT id, code, programme_code, is_fast_track, branch_id FROM classes WHERE id IN (${ph}) AND status = 'active' AND id != ?`,
      ).all(...lo, v.lopNguonId) as any[]) dich.set(c.id, c);
    });

    /*
     * PR-UXF-a Q2 (P0 K2-25): "khác Hệ thống gợi ý" máy chủ TỰ tính từ luật Cuối khoá — một lần cho cả lô, không tin cờ của thân yêu cầu.
     * PR-S6F-a Q23: cả bối cảnh "giữa khoá" (panel một em) khi lớp nguồn là lớp thường đã tới Cuối khoá — em hết khoá vẫn có gợi ý.
     * Chỉ em hợp lệ của lớp nguồn vào `IN (…)` (thân yêu cầu có thể dài hơn 900 dòng).
     */
    const prNguon = nguonFt ? null : classProgressMany([v.lopNguonId]).get(v.lopNguonId);
    const tuCuoiKhoa = v.boiCanh === 'cuoi-khoa' || (!nguonFt && mocKetKhoa(prNguon, homNay).tuCuoiKhoa);
    /* OV-3b: hạn bàn giao — lớp FT 5 ngày; lớp thường Cuối khoá hết tuần Final và ≥ 2 ngày sau chốt; giữa khoá 2 / 3 ngày. */
    const hanMoi = hanBanGiaoLenh({ nguonFt, boiCanh: v.boiCanh, tuanFinal: prNguon?.finalWeekStart ?? null, ngay: homNay });
    const ck = tuCuoiKhoa ? cuoiKhoaTheoHocVien(v.lopNguonId, dongs.filter((d) => hopLe.has(d.studentId)).map((d) => d.studentId)) : null;
    /*
     * PR-LCa: lớp nguồn thường — Lộ trình tiếp theo ở lớp này (Target Lên FT LCa-2 + Hướng cũ cho đồng bộ LCa-1) và khoá lớp thường đang
     * chạy (Target / KCK, LCa-2) của em hợp lệ: một câu mỗi bảng cho cả lô.
     */
    const ltt = new Map<number, { huong: Huong; mucTieu: number | null; thangThi: string | null }>();
    const khoa = new Map<number, { target: number | null; kck: boolean }>();
    /* Khoá chỉ cần khi có dòng Lên FT chưa ghi Target. */
    const canKhoa = dongs.some((d) => d.huong === 'fast_track' && d.mucTieu == null);
    if (!nguonFt) {
      theoLo(dongs.filter((d) => hopLe.has(d.studentId)).map((d) => d.studentId), (lo, ph) => {
        for (const r of conn.prepare(
          `SELECT student_id, huong, muc_tieu, thang_thi FROM lo_trinh_tiep_theo WHERE class_id = ? AND student_id IN (${ph})`,
        ).all(v.lopNguonId, ...lo) as any[]) ltt.set(r.student_id, { huong: r.huong, mucTieu: r.muc_tieu ?? null, thangThi: r.thang_thi ?? null });
        if (canKhoa) for (const r of conn.prepare(
          `SELECT student_id, target_score, khong_cam_ket FROM learning_cycles WHERE status = 'active' AND route IS NULL AND student_id IN (${ph})`,
        ).all(...lo) as any[]) khoa.set(r.student_id, { target: r.target_score ?? null, kck: !!r.khong_cam_ket });
      });
    }

    const failed: { studentId: number; message: string }[] = [];
    const hang: any[] = [];
    const daSua = new Set<number>();
    /** OV-3b (mục 5): lệnh Cuối khoá lớp thường đã chốt bị đổi hướng / lớp chuyển đến → phiếu bàn giao cần làm lại. */
    const lamLai: number[] = [];
    for (let d of dongs) {
      const loi = (message: string) => { failed.push({ studentId: d.studentId, message }); };
      if (!hopLe.has(d.studentId)) { loi('Học viên không thuộc lớp này.'); continue; }
      if (!HUONG_THEO_BOI_CANH[v.boiCanh].includes(d.huong)) { loi('Hướng này không dùng được ở bối cảnh chuyển lớp này.'); continue; }
      const canDich = canLopDich(d.huong);
      const lopDich = canDich && d.toClassId ? dich.get(d.toClassId) ?? null : null;
      if (canDich && d.toClassId && !lopDich) { loi('Lớp chuyển đến không hợp lệ.'); continue; }
      const tuan = d.tuan ?? v.tuanChung;
      const cu = daCo.get(d.studentId);
      /* PR-S5F-a: lệnh còn `cho` luôn sửa được (kể cả đã tới tuần mà chưa chuyển được) — tuần mới vẫn phải từ tuần sau (`kiemDongLenh`). */
      if (cu && cu.lop_nguon_id !== v.lopNguonId) { loi('Em đã có quyết định chuyển lớp ở lớp khác.'); continue; }
      const khac = khacGoiY(d.huong, ck?.get(d.studentId)?.goiY);
      /* LCa-2 (Q2): Lên FT từ lớp thường không gửi Target → Target LTT → khoá (KCK giữ) — TRƯỚC khi kiểm; không có thì vẫn báo như cũ. */
      if (!nguonFt && d.huong === 'fast_track' && d.mucTieu == null) {
        d = { ...d, mucTieu: targetLenFt({ lt: ltt.get(d.studentId) ?? null, khoa: khoa.get(d.studentId) ?? null }) };
      }
      /* PR-LCb (§7): Lên FT không gửi Dự kiến thi → tháng thi ở LTT; không có thì để trống — thi hành giữ Dự kiến thi của khoá (`moLoTrinhMoi`). */
      if (!nguonFt && d.huong === 'fast_track' && !d.ngayThi && ltt.get(d.studentId)?.thangThi) d = { ...d, ngayThi: ltt.get(d.studentId)!.thangThi };
      const sai = kiemDongLenh({
        huong: d.huong, lopDichId: lopDich?.id ?? null, lopDichFt: !!lopDich?.is_fast_track, nguonFt, tuan: tuan ?? null, homNay,
        lyDo: d.lyDo ?? null, khacGoiY: khac, mucTieu: d.mucTieu ?? null, ngayXemLai: d.ngayXemLai ?? null,
      });
      if (sai) { loi(sai); continue; }
      if (v.boiCanh === 'cuoi-khoa' && (d.huong === 'len_lop' || d.huong === 'hoc_lai' || d.huong === 'fast_track')) {
        /* Hướng ↔ lớp chuyển đến: dùng lại luật cũ; Target/lý do đã kiểm ở trên nên đưa giá trị đã hợp lệ. */
        const lech = kiemDongChuyenTiep({
          huong: d.huong, toClassId: lopDich.id, toClass: { ma: (lopDich.programme_code ?? null) as ProgrammeCode | null, ft: !!lopDich.is_fast_track },
          mucTieu: 5,
        }, { maTu });
        if (lech) { loi(lech); continue; }
      } else if (d.huong === 'fast_track' && !lopDich.is_fast_track) { loi('Lớp chuyển đến phải là Fast Track'); continue; }
      const han = coPhieu(d.huong) ? hanMoi : null;
      const kck = d.mucTieu === 'KCK';
      if (cu) daSua.add(d.studentId);
      if (cu && v.boiCanh === 'cuoi-khoa' && !nguonFt && coPhieu(d.huong) && (cu.huong !== d.huong || (cu.lop_dich_id ?? null) !== (lopDich?.id ?? null))) lamLai.push(d.studentId);
      hang.push([
        d.studentId, v.lopNguonId, lopDich?.id ?? null, d.huong, v.boiCanh, tuan, kck || d.mucTieu == null ? null : d.mucTieu, kck ? 1 : 0,
        d.ngayThi ?? null, d.huong === 'bao_luu' ? d.ngayXemLai ?? null : null, (d.lyDo ?? '').trim() || null, khac ? 1 : 0,
        p.userId, homNay, v.tuYeuCauId ?? null, 'cho', han?.gvbm ?? null, han?.gvcn ?? null, nowIso(), nowIso(),
      ]);
    }

    if (hang.length) {
      chenNhieuDong(
        `INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, muc_tieu, khong_cam_ket, ngay_thi,
           ngay_xem_lai, ly_do, khac_goi_y, nguoi_ra_lenh, ngay_ra_lenh, tu_yeu_cau_id, trang_thai, han_gvbm, han_gvcn, tao_luc, sua_luc)`,
        hang,
        ` ON CONFLICT (student_id) WHERE trang_thai = 'cho' DO UPDATE SET
           lop_dich_id = excluded.lop_dich_id, huong = excluded.huong, boi_canh = excluded.boi_canh, tuan_bat_dau = excluded.tuan_bat_dau,
           muc_tieu = excluded.muc_tieu, khong_cam_ket = excluded.khong_cam_ket, ngay_thi = excluded.ngay_thi,
           ngay_xem_lai = excluded.ngay_xem_lai, ly_do = excluded.ly_do, khac_goi_y = excluded.khac_goi_y,
           nguoi_ra_lenh = excluded.nguoi_ra_lenh, tu_yeu_cau_id = COALESCE(excluded.tu_yeu_cau_id, lenh_chuyen_lop.tu_yeu_cau_id),
           han_gvbm = CASE WHEN excluded.han_gvbm IS NULL THEN NULL ELSE COALESCE(lenh_chuyen_lop.han_gvbm, excluded.han_gvbm) END,
           han_gvcn = CASE WHEN excluded.han_gvcn IS NULL THEN NULL ELSE COALESCE(lenh_chuyen_lop.han_gvcn, excluded.han_gvcn) END,
           loi = NULL, thu_ngay = NULL, sua_luc = excluded.sua_luc`,
      );
      const moi = hang.length - daSua.size;
      const theoHuong: Record<string, number> = {};
      for (const h of hang) theoHuong[h[3]] = (theoHuong[h[3]] ?? 0) + 1;
      if (moi) writeAudit({ actorUserId: p.userId, action: 'lenh_chuyen.tao', entityType: 'class', entityId: nguon.id, entityLabel: nguon.code, after: { soEm: moi, theoHuong, boiCanh: v.boiCanh } });
      if (daSua.size) writeAudit({ actorUserId: p.userId, action: 'lenh_chuyen.sua', entityType: 'class', entityId: nguon.id, entityLabel: nguon.code, after: { soEm: daSua.size } });
      thongBaoSapNhan(p, nguon, [...new Set(hang.map((h) => h[2]).filter(Boolean))] as number[], dich, homNay);
      /* OV-3b: chốt = xoá nháp của em đó, cùng giao dịch. */
      if (!nguonFt) theoLo(hang.map((h) => h[0] as number), (lo, ph) => conn.prepare(`DELETE FROM lo_trinh_nhap WHERE class_id = ? AND student_id IN (${ph})`).run(v.lopNguonId, ...lo));
      if (lamLai.length) phieuLamLai(p, nguon, lamLai, hanMoi);
      /* LCa-1 (Q1, R4): quyết định Cuối khoá lớp thường → Lộ trình tiếp theo theo quyết định + MT0 ngay, cùng giao dịch (sửa lệnh đi qua đây). */
      if (v.boiCanh === 'cuoi-khoa' && !nguonFt) {
        dongBoTuLenh(p, hang.map((h) => ({
          studentId: h[0], classId: v.lopNguonId, ma: maTu, huong: h[3] as Huong, lopDuKienId: h[2], mucTieu: h[6], ngayXemLai: h[9],
          huongCu: ltt.get(h[0])?.huong ?? null,
          /* R9: Hướng LTT cũ đã là quyết định `cho` của lớp này → của QL, không phải GVCN. */
          cuLaQl: daCo.get(h[0])?.lop_nguon_id === v.lopNguonId && daCo.get(h[0])?.huong === ltt.get(h[0])?.huong,
        })));
      }
      /* PR-CT2 (§8): quyết định Cuối khoá lớp thường (ra / sửa) → bổ trợ Final sinh ngay nếu đã đủ điểm, đổi hướng thì huỷ phần chưa ai đụng. Cùng giao dịch.
         Mọi bối cảnh: lệnh Giữa khoá ghi đè lệnh Cuối khoá đang chờ cũng phải huỷ bộ sinh sớm (hàm tự lọc lệnh `cuoi-khoa`). */
      if (!nguonFt) dongBoCheTaiFinal(p, v.lopNguonId, hang.map((h) => h[0] as number));
    }
    return { ok: hang.map((h) => h[0] as number), failed };
  });
}

/**
 * OV-3b (mục 5): đổi hướng / lớp chuyển đến của lệnh đã chốt → phiếu cần làm lại: bỏ xác nhận GVCN (giữ nhận xét chung), dòng môn GVBM đánh dấu
 * `lam_lai` (giữ chữ để điền sẵn), hạn tính lại; MỘT chuông "Cần làm" cho mỗi GV lớp nguồn (GVCN + GVBM) cho cả lần sửa. Gọi trong tx của `raLenh`.
 */
function phieuLamLai(p: Principal, nguon: any, sids: number[], han: { gvbm: string; gvcn: string }) {
  const conn = db();
  const luc = nowIso();
  theoLo(sids, (lo, ph) => {
    conn.prepare(
      `UPDATE lenh_chuyen_lop SET han_gvbm = ?, han_gvcn = ?, xac_nhan_boi = NULL, xac_nhan_luc = NULL, xac_nhan_thay = 0, tu_dien = NULL, sua_luc = ?
        WHERE trang_thai = 'cho' AND lop_nguon_id = ? AND student_id IN (${ph})`,
    ).run(han.gvbm, han.gvcn, luc, nguon.id, ...lo);
    conn.prepare(
      `UPDATE ban_giao_mon SET lam_lai = 1 WHERE lenh_id IN (SELECT id FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND lop_nguon_id = ? AND student_id IN (${ph}))`,
    ).run(nguon.id, ...lo);
  });
  const ten = sids.length === 1 ? (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(sids[0]) as any)?.full_name ?? 'học viên' : `${sids.length} em`;
  const gv = conn.prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active'`).all(nguon.id) as any[];
  for (const { user_id: userId } of gv) {
    if (userId === p.userId) continue;
    notify({
      userId, kind: 'lam_lai_ban_giao', title: `Cần làm lại bàn giao · ${ten} · ${nguon.code}`, body: 'Quản lý đổi lộ trình — phiếu cũ đã điền sẵn',
      entityType: 'class', entityId: nguon.id, dedupKey: `lam_lai_ban_giao:${nguon.id}:${luc}`, duong: `/hoc-vien/lop/${nguon.id}?viec=ban-giao`,
    });
  }
  writeAudit({ actorUserId: p.userId, action: 'ban_giao.lam_lai', entityType: 'class', entityId: nguon.id, entityLabel: nguon.code, after: { hocVien: sids } });
}

/** Q18: MỘT thông báo "Sắp nhận" mỗi lớp chuyển đến — GVCN lớp chuyển đến + Quản lý chi nhánh đích nếu khác chi nhánh. Đếm lại từ bảng nên ra lệnh thêm cùng ngày chỉ cập nhật số. */
function thongBaoSapNhan(p: Principal, nguon: any, lopDichIds: number[], dich: Map<number, any>, homNay: string) {
  if (!lopDichIds.length) return;
  const conn = db();
  const dem = new Map<number, { n: number; tuan: string }>();
  theoLo(lopDichIds, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT lop_dich_id, COUNT(*) AS n, MIN(tuan_bat_dau) AS tuan FROM lenh_chuyen_lop
        WHERE lop_nguon_id = ? AND trang_thai = 'cho' AND lop_dich_id IN (${ph}) GROUP BY lop_dich_id`,
    ).all(nguon.id, ...lo) as any[]) dem.set(r.lop_dich_id, { n: r.n, tuan: r.tuan });
  });
  const khacChiNhanh = lopDichIds.filter((id) => dich.get(id)?.branch_id !== nguon.branch_id);
  const nhan = nguoiNhanCuaLop(lopDichIds, [...new Set(khacChiNhanh.map((id) => dich.get(id).branch_id as number))]);
  for (const id of lopDichIds) {
    const x = dem.get(id);
    if (!x) continue;
    for (const userId of nhan.get(id) ?? []) {
      if (userId === p.userId) continue;
      notify({
        userId, kind: 'sap_nhan', title: `Sắp nhận ${x.n} em vào lớp ${dich.get(id).code}`,
        body: `Từ ${nguon.code} · vào lớp từ ${tuanLich(x.tuan, homNay)}`,
        entityType: 'class', entityId: id, dedupKey: `sap_nhan:${id}:${nguon.id}:${homNay}`, duong: `/hoc-vien/lop/${id}`,
      });
    }
  }
}

function docLenh(id: number): any {
  const l = db().prepare('SELECT * FROM lenh_chuyen_lop WHERE id = ?').get(id) as any;
  if (!l) throw notFound('Không tìm thấy quyết định chuyển lớp');
  return l;
}

/**
 * Q6 + PR-S5F-a: sửa / huỷ khi lệnh còn `cho`. Lệnh đã tới tuần mà còn `cho` là lệnh CHƯA chuyển được (lớp chuyển đến bị kết thúc, lệch luật…) —
 * Quản lý phải huỷ được hoặc sửa sang tuần mới, không để kẹt. Lệnh không còn `cho` → 409 (vừa thi hành / đã huỷ).
 */
function kiemConSuaDuoc(l: any) {
  if (l.trang_thai !== 'cho') throw conflict(l.trang_thai === 'huy' ? 'Quyết định chuyển lớp đã được huỷ.' : 'Quyết định chuyển lớp vừa được thi hành.');
}

export function suaLenh(p: Principal, id: number, v: Partial<DongLenhVao>): void {
  const l = docLenh(id);
  require_(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id }, CUNG_LOP_CHI_NHANH);
  kiemConSuaDuoc(l);
  const gop: DongLenhVao = {
    studentId: l.student_id, huong: (v.huong ?? l.huong) as HuongLenh, toClassId: v.toClassId !== undefined ? v.toClassId : l.lop_dich_id,
    tuan: v.tuan ?? l.tuan_bat_dau, mucTieu: v.mucTieu !== undefined ? v.mucTieu : l.khong_cam_ket ? 'KCK' : l.muc_tieu,
    ngayThi: v.ngayThi !== undefined ? v.ngayThi : l.ngay_thi, lyDo: v.lyDo !== undefined ? v.lyDo : l.ly_do,
    ngayXemLai: v.ngayXemLai !== undefined ? v.ngayXemLai : l.ngay_xem_lai,
  };
  const r = raLenh(p, { lopNguonId: l.lop_nguon_id, boiCanh: l.boi_canh, tuanChung: null, dongs: [gop] });
  if (r.failed.length) throw badRequest(r.failed[0].message);
}

/** Huỷ MỘT lệnh còn `cho` trong giao dịch đang mở — không kiểm quyền, không gửi chuông (nơi gọi lo). */
function huyMotLenh(p: Principal, l: any, why: string): void {
  const conn = db();
  const r = conn.prepare(
    `UPDATE lenh_chuyen_lop SET trang_thai = 'huy', huy_boi = ?, huy_luc = ?, ly_do_huy = ?, sua_luc = ? WHERE id = ? AND trang_thai = 'cho'`,
  ).run(p.userId, nowIso(), why, nowIso(), l.id);
  if (!r.changes) throw conflict('Quyết định chuyển lớp vừa được thi hành hoặc đã huỷ.');
  if (l.boi_canh === 'cuoi-khoa') dongBoCheTaiFinal(p, l.lop_nguon_id, [l.student_id]);   // PR-CT2 (§8): không còn quyết định → huỷ bổ trợ Final chưa ai đụng
  const hv = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(l.student_id) as any;
  writeAudit({ actorUserId: p.userId, action: 'lenh_chuyen.huy', entityType: 'student', entityId: l.student_id, entityLabel: hv?.full_name ?? null, before: { huong: l.huong, tuan: l.tuan_bat_dau }, after: { lyDo: why } });
}

export function huyLenh(p: Principal, id: number, lyDo: string): void {
  const l = docLenh(id);
  require_(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id }, CUNG_LOP_CHI_NHANH);
  const why = String(lyDo ?? '').trim();
  if (!why) throw badRequest('Ghi lý do huỷ quyết định.');
  kiemConSuaDuoc(l);
  tx(() => {
    const conn = db();
    huyMotLenh(p, l, why);
    const hv = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(l.student_id) as any;
    const ma = new Map((conn.prepare('SELECT id, code FROM classes WHERE id IN (?, ?)').all(l.lop_nguon_id, l.lop_dich_id ?? l.lop_nguon_id) as any[]).map((r) => [r.id as number, r.code as string]));
    const nhan = nguoiNhanCuaLop([l.lop_nguon_id, ...(l.lop_dich_id ? [l.lop_dich_id] : [])]);
    const tatCa = new Set([...(nhan.get(l.lop_nguon_id) ?? []), ...(l.lop_dich_id ? nhan.get(l.lop_dich_id) ?? [] : [])]);
    for (const userId of tatCa) {
      if (userId === p.userId) continue;
      notify({
        userId, kind: 'huy_lenh', title: `Đã huỷ quyết định chuyển lớp · ${hv?.full_name ?? 'học viên'}`,
        body: `${ma.get(l.lop_nguon_id)}${l.lop_dich_id ? ` → ${ma.get(l.lop_dich_id)}` : ''} · ${why}`,
        entityType: 'student', entityId: l.student_id, dedupKey: `huy_lenh:${id}`,
      });
    }
  });
}

export type KetQuaLenhNhieu = { ok: number[]; failed: { id: number; studentId: number; message: string }[] };

function docDanhSachLenh(v: unknown): number[] {
  if (!Array.isArray(v) || !v.length) throw badRequest('Chưa chọn quyết định nào.');
  const ds = [...new Set(v.map(Number))];
  if (ds.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Mã quyết định không hợp lệ.');
  if (ds.length > LO_HANG_LOAT_EM) throw badRequest(`Tối đa ${LO_HANG_LOAT_EM} quyết định một lần.`);
  return ds;
}

/**
 * HUỶ NHIỀU QUYẾT ĐỊNH CHUYỂN LỚP MỘT LẦN (PR-LUI-b) — một lý do chung (bắt buộc, không tối thiểu ký tự — PR-MTa T7), mỗi lệnh một giao dịch, lệnh lỗi vào `failed`.
 * Chuông: MỘT cho mỗi người nhận và mỗi lớp nguồn ("Đã huỷ n quyết định chuyển lớp · MB FT 101"), không một chuông mỗi học viên. ≤ `LO_HANG_LOAT_EM` lệnh một lần ghi.
 * Không lệnh nào trong phạm vi người gọi → 403 cả lô.
 */
export function huyNhieuLenh(p: Principal, ids: unknown, lyDo: unknown): KetQuaLenhNhieu {
  const ds = docDanhSachLenh(ids);
  const why = String(lyDo ?? '').trim();
  if (!why) throw badRequest('Ghi lý do huỷ quyết định.');
  const kq: KetQuaLenhNhieu = { ok: [], failed: [] };
  const daHuy: any[] = [];
  let ngoaiQuyen = 0;
  for (const id of ds) {
    let l: any = null;
    try {
      l = docLenh(id);
      if (!can(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id })) { ngoaiQuyen += 1; throw forbidden(CUNG_LOP_CHI_NHANH); }
      kiemConSuaDuoc(l);
      tx(() => huyMotLenh(p, l, why));
      kq.ok.push(id); daHuy.push(l);
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      kq.failed.push({ id, studentId: l?.student_id ?? 0, message: e.message });
    }
  }
  if (ngoaiQuyen === ds.length) throw forbidden(CUNG_LOP_CHI_NHANH);
  guiChuongHuyNhieu(p, daHuy, why);
  return kq;
}

/** Một chuông / người nhận / lớp nguồn. `dedupKey` theo lệnh đầu của nhóm: gọi lại cùng lô không nhân chuông. */
function guiChuongHuyNhieu(p: Principal, ds: any[], why: string) {
  if (!ds.length) return;
  const conn = db();
  const theoNguon = new Map<number, any[]>();
  for (const l of ds) { if (!theoNguon.has(l.lop_nguon_id)) theoNguon.set(l.lop_nguon_id, []); theoNguon.get(l.lop_nguon_id)!.push(l); }
  const lopIds = [...new Set(ds.flatMap((l) => [l.lop_nguon_id, ...(l.lop_dich_id ? [l.lop_dich_id] : [])]))];
  const nhan = nguoiNhanCuaLop(lopIds);
  const ma = new Map<number, string>();
  theoLo(lopIds, (lo, ph) => { for (const r of conn.prepare(`SELECT id, code FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) ma.set(r.id, r.code); });
  for (const [nguonId, nhom] of theoNguon) {
    const tatCa = new Set([...(nhan.get(nguonId) ?? []), ...nhom.flatMap((l) => (l.lop_dich_id ? [...(nhan.get(l.lop_dich_id) ?? [])] : []))]);
    for (const userId of tatCa) {
      if (userId === p.userId) continue;
      notify({
        userId, kind: 'huy_lenh', title: `Đã huỷ ${nhom.length} quyết định chuyển lớp · ${ma.get(nguonId)}`, body: why,
        entityType: 'class', entityId: nguonId, dedupKey: `huy_lenh_lo:${nhom[0].id}`, duong: `/hoc-vien/lop/${nguonId}`,
      });
    }
  }
}

/**
 * KHÔI PHỤC QUYẾT ĐỊNH CHUYỂN LỚP VỪA HUỶ (nút Hoàn tác của huỷ nhiều quyết định). Chỉ lệnh do NGƯỜI huỷ (`huy_boi` có), trong `KHOI_PHUC_LENH_GIO` giờ, học viên còn ghi danh
 * `active` ở lớp nguồn, chưa có lệnh `cho` khác, tuần bắt đầu còn ở tương lai, lớp chuyển đến còn hoạt động. Đưa về `cho`, xoá dấu huỷ.
 */
export function khoiPhucLenh(p: Principal, ids: unknown): KetQuaLenhNhieu {
  const ds = docDanhSachLenh(ids);
  const conn = db();
  const kq: KetQuaLenhNhieu = { ok: [], failed: [] };
  const homNay = demoToday();
  const khoi: any[] = [];
  let ngoaiQuyen = 0;
  for (const id of ds) {
    let l: any = null;
    try {
      l = docLenh(id);
      if (!can(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id })) { ngoaiQuyen += 1; throw forbidden(CUNG_LOP_CHI_NHANH); }
      if (l.trang_thai === 'cho') throw conflict('Quyết định đã ở trạng thái chờ.');
      if (l.trang_thai !== 'huy') throw conflict('Quyết định đã thi hành — không khôi phục được.');
      if (!l.huy_boi) throw conflict('Quyết định do hệ thống huỷ — không khôi phục được.');
      if (Date.now() - Date.parse(String(l.huy_luc)) > KHOI_PHUC_LENH_GIO * 3600_000) throw conflict(`Đã quá ${KHOI_PHUC_LENH_GIO} giờ — ra quyết định mới.`);
      if (l.tuan_bat_dau <= homNay) throw conflict('Tuần bắt đầu đã tới — ra quyết định mới.');
      tx(() => {
        if (conn.prepare(`SELECT 1 FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(l.student_id)) throw conflict('Học viên đã có quyết định chuyển lớp khác.');
        if (!conn.prepare(`SELECT 1 FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`).get(l.student_id, l.lop_nguon_id)) throw conflict('Học viên không còn học lớp nguồn.');
        if (l.lop_dich_id && !conn.prepare(`SELECT 1 FROM classes WHERE id = ? AND status = 'active'`).get(l.lop_dich_id)) throw conflict('Lớp chuyển đến đã kết thúc.');
        conn.prepare(
          `UPDATE lenh_chuyen_lop SET trang_thai = 'cho', huy_boi = NULL, huy_luc = NULL, ly_do_huy = NULL, thu_ngay = NULL, loi = NULL, sua_luc = ?
            WHERE id = ? AND trang_thai = 'huy'`,
        ).run(nowIso(), id);
        /*
         * PR-LCa (I1): quyết định Cuối khoá lớp thường chờ lại → Lộ trình tiếp theo + MT0 theo quyết định như `raLenh` (bất biến lệnh chờ ⇒
         * LTT cùng Hướng). Hướng LTT khác là do ghi SAU khi huỷ — của GVCN (`cuLaQl: false`). Mỗi lệnh một giao dịch nên đọc theo lệnh.
         */
        const nguonThuong = l.boi_canh === 'cuoi-khoa' ? conn.prepare(
          `SELECT c.programme_code, t.huong FROM classes c LEFT JOIN lo_trinh_tiep_theo t ON t.class_id = c.id AND t.student_id = ?
            WHERE c.id = ? AND c.is_fast_track = 0`,
        ).get(l.student_id, l.lop_nguon_id) as any : null;
        if (nguonThuong) {
          dongBoTuLenh(p, [{
            studentId: l.student_id, classId: l.lop_nguon_id, ma: (nguonThuong.programme_code ?? null) as ProgrammeCode | null, huong: l.huong as Huong,
            lopDuKienId: l.lop_dich_id ?? null, mucTieu: l.khong_cam_ket ? null : l.muc_tieu ?? null, ngayXemLai: l.ngay_xem_lai ?? null,
            huongCu: (nguonThuong.huong ?? null) as Huong | null, cuLaQl: false,
          }]);
          dongBoCheTaiFinal(p, l.lop_nguon_id, [l.student_id]);   // PR-CT2 (§8): quyết định chờ lại → bổ trợ Final như lúc ra lệnh
        }
        writeAudit({ actorUserId: p.userId, action: 'lenh_chuyen.khoi_phuc', entityType: 'student', entityId: l.student_id, before: { trangThai: 'huy' }, after: { huong: l.huong, tuan: l.tuan_bat_dau } });
      });
      kq.ok.push(id); khoi.push(l);
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      kq.failed.push({ id, studentId: l?.student_id ?? 0, message: e.message });
    }
  }
  if (ngoaiQuyen === ds.length) throw forbidden(CUNG_LOP_CHI_NHANH);
  /* Số "Sắp nhận" của lớp chuyển đến đếm lại từ bảng (`thongBaoSapNhan`) — cập nhật chuông cùng ngày. */
  const theoNguon = new Map<number, any[]>();
  for (const l of khoi) { if (!theoNguon.has(l.lop_nguon_id)) theoNguon.set(l.lop_nguon_id, []); theoNguon.get(l.lop_nguon_id)!.push(l); }
  for (const [nguonId, nhom] of theoNguon) {
    const nguon = conn.prepare('SELECT * FROM classes WHERE id = ?').get(nguonId) as any;
    const dich = new Map<number, any>();
    for (const l of nhom) if (l.lop_dich_id) dich.set(l.lop_dich_id, conn.prepare('SELECT id, code, programme_code, is_fast_track, branch_id FROM classes WHERE id = ?').get(l.lop_dich_id));
    thongBaoSapNhan(p, nguon, [...dich.keys()], dich, homNay);
  }
  return kq;
}

// ---------------------------------------------------------------- ranh giới API

const soHoacKck = (v: unknown): MucTieuLenh | null => (v === 'KCK' ? 'KCK' : v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);

/** Dòng từ web/API (kiểu lỏng) → `DongLenhVao`. Web cũ còn gửi `thangThi` → `ngayThi`. */
export function dongTuBody(x: any): DongLenhVao {
  return {
    studentId: Number(x?.studentId), huong: String(x?.huong ?? '') as HuongLenh, toClassId: x?.toClassId ? Number(x.toClassId) : null,
    tuan: x?.tuan ?? null, mucTieu: soHoacKck(x?.mucTieu), ngayThi: x?.ngayThi ?? x?.thangThi ?? null,
    lyDo: x?.lyDo ?? null, ngayXemLai: x?.ngayXemLai ?? null,
  };
}

/** Q4: panel cả lớp — lớp thường hết khoá (`cuoi-khoa`, thi hành theo lô), lớp FT giữa khoá (thi hành từng em). */
export function boiCanhTheoLop(lopId: number): BoiCanhLenh {
  const c = db().prepare('SELECT is_fast_track, moc_lap FROM classes WHERE id = ?').get(lopId) as any;
  if (!c) throw notFound('Không tìm thấy lớp');
  return c.is_fast_track || laLienTuc(c) ? 'giua-khoa' : 'cuoi-khoa';   // OV-6b2: lớp liên tục không có Cuối khoá — chuyển từng em như FT
}

/** PATCH: chỉ những khoá có trong thân yêu cầu mới ghi đè (khoá vắng = giữ giá trị cũ của lệnh). */
export function suaTuBody(b: any): Partial<DongLenhVao> {
  const d = dongTuBody(b ?? {});
  const v: Record<string, unknown> = {};
  for (const k of ['huong', 'toClassId', 'tuan', 'mucTieu', 'ngayThi', 'lyDo', 'ngayXemLai'] as const) if (b && k in b) v[k] = d[k];
  return v as Partial<DongLenhVao>;
}

// ==================================================================== THI HÀNH đúng Thứ Hai tuần bắt đầu (Task 4)

/** Q22: mỗi lượt tối đa 40 nhóm (lớp nguồn × tuần × bối cảnh); phần còn lại lượt quét sau làm. Lời gọi Netlify có hạn giờ. */
export const NHOM_TOI_DA = 40;
/** Placeholder cho Target KCK: `apDungMotDong`/`applyTransition` chỉ nhận số, KCK đặt ngay sau ở `datKck` (Q29-1) — số tạm không ra Hành trình. */
const TARGET_TAM = 5;

type KetQuaThiHanh = { daChuyen: number; huy: number; loi: number };

/**
 * Cron Thứ Hai (cùng chot-vang) + quét khi đọc (`quetLenhDenHan`). Chạy 2 lần liền → lần 2 không làm gì: đọc lệnh TRONG tx sau BEGIN IMMEDIATE,
 * đánh dấu `da_chuyen` TRƯỚC khi chuyển, mỗi nhóm một tx. Ngày hiệu lực luôn là Thứ Hai của lệnh, kể cả khi quét muộn (Q5).
 * PR-S5F-a: lệnh lỗi (`thu_ngay` = hôm nay) chỉ thử lại MỘT lần mỗi ngày hoặc khi Quản lý sửa (xoá `thu_ngay`) — đọc trang không ghi DB lặp lại,
 * nhóm lỗi không chiếm chỗ của nhóm khác trong 40 nhóm/lượt. Nhật ký chỉ ghi khi có em được chuyển hoặc lệnh bị huỷ.
 */
export function thiHanhLenhDenHan(homNay = demoToday()): KetQuaThiHanh {
  const kq: KetQuaThiHanh = { daChuyen: 0, huy: 0, loi: 0 };
  const conn = db();
  /* Một câu rẻ NGOÀI tx: đường đọc không xin khoá ghi khi không có gì đến hạn. */
  const nhom = conn.prepare(
    `SELECT DISTINCT lop_nguon_id, tuan_bat_dau, boi_canh FROM lenh_chuyen_lop
      WHERE trang_thai = 'cho' AND tuan_bat_dau <= ? AND (thu_ngay IS NULL OR thu_ngay < ?) ORDER BY tuan_bat_dau, lop_nguon_id LIMIT ?`,
  ).all(homNay, homNay, NHOM_TOI_DA) as any[];   // ponytail: 40 nhóm/lượt (Q22), lượt quét sau làm tiếp
  for (const g of nhom) {
    try {
      tx(() => {
        /* ĐỌC LẠI trong tx: lượt song song đã làm xong thì ở đây ra 0 dòng. */
        const ds = conn.prepare(
          `SELECT l.*, e.id AS enr_id FROM lenh_chuyen_lop l
             LEFT JOIN enrollments e ON e.student_id = l.student_id AND e.class_id = l.lop_nguon_id AND e.status = 'active'
            WHERE l.trang_thai = 'cho' AND l.lop_nguon_id = ? AND l.tuan_bat_dau = ? AND l.boi_canh = ? AND (l.thu_ngay IS NULL OR l.thu_ngay < ?)`,
        ).all(g.lop_nguon_id, g.tuan_bat_dau, g.boi_canh, homNay) as any[];
        if (!ds.length) return;
        const mat = ds.filter((l) => !l.enr_id), con = ds.filter((l) => l.enr_id);
        if (mat.length) { huyHeThong(mat, 'Em không còn học lớp nguồn lúc thi hành'); kq.huy += mat.length; }   // Q8
        if (!con.length) return;
        danhDau(con.map((l) => l.id as number), nowIso());
        const p = loadPrincipal(con[0].nguoi_ra_lenh);   // người ra lệnh = tác giả nhật ký
        const loiDong = g.boi_canh === 'cuoi-khoa' ? thiHanhCuoiKhoa(p, g, con) : thiHanhGiuaKhoa(p, g, con);
        if (loiDong.length) traVeCho(loiDong, homNay);   // Q8: lệnh lỗi luật về 'cho' + cột loi — không chặn em khác
        kq.daChuyen += con.length - loiDong.length;
        if (con.length > loiDong.length || mat.length) writeAudit({
          actorUserId: con[0].nguoi_ra_lenh, action: 'lenh_chuyen.thi_hanh', entityType: 'class', entityId: g.lop_nguon_id,
          after: { tuan: g.tuan_bat_dau, boiCanh: g.boi_canh, daChuyen: con.length - loiDong.length, loi: loiDong.length, huy: mat.length },
        });
        thongBaoNguoiRaLenh([
          ...mat.map((l) => ({ l, vi: 'huy' as const, msg: 'Em không còn học lớp nguồn lúc thi hành' })),
          ...loiDong.map((x) => ({ l: con.find((c) => c.id === x.id)!, vi: 'loi' as const, msg: x.loi })),
        ]);
      });
    } catch (e) {
      kq.loi += 1;
      ghiLoiNhom(g, e, homNay);   // UPDATE loi ngoài tx đã cuộn lại
    }
  }
  return kq;
}

/** Quét khi đọc: một lần mỗi request GET (`nho`) — thêm 1 câu khi không có gì đến hạn. Lỗi thi hành không làm hỏng trang đang đọc. */
export function quetLenhDenHan(homNay = demoToday()): void {
  nho(`thi-hanh-lenh:${homNay}`, () => { try { thiHanhLenhDenHan(homNay); } catch (e) { console.error('[chuyen-lop] quét khi đọc', e); } return true; });
}

const inHang = (ids: readonly number[]) => ids.map(() => '?').join(',');

function huyHeThong(mat: any[], lyDo: string) {
  const ids = mat.map((l) => l.id as number);
  db().prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy', huy_luc = ?, ly_do_huy = ?, sua_luc = ? WHERE trang_thai = 'cho' AND id IN (${inHang(ids)})`)
    .run(nowIso(), lyDo, nowIso(), ...ids);
}

/** Đánh dấu TRƯỚC khi chuyển; `AND trang_thai = 'cho'` để lượt song song không đánh dấu lần hai. */
function danhDau(ids: readonly number[], luc: string) {
  db().prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'da_chuyen', thi_hanh_luc = ?, loi = NULL WHERE trang_thai = 'cho' AND id IN (${inHang(ids)})`).run(luc, ...ids);
}

function traVeCho(loi: { id: number; loi: string }[], homNay: string) {
  const conn = db();
  for (const x of loi) conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'cho', thi_hanh_luc = NULL, loi = ?, thu_ngay = ? WHERE id = ?`).run(x.loi, homNay, x.id);
}

function ghiLoiNhom(g: any, e: unknown, homNay: string) {
  const msg = String((e as any)?.message ?? e).slice(0, 300);
  console.error('[chuyen-lop]', g.lop_nguon_id, g.tuan_bat_dau, msg);
  try {
    db().prepare(`UPDATE lenh_chuyen_lop SET loi = ?, thu_ngay = ? WHERE trang_thai = 'cho' AND lop_nguon_id = ? AND tuan_bat_dau = ? AND boi_canh = ?`)
      .run(msg, homNay, g.lop_nguon_id, g.tuan_bat_dau, g.boi_canh);
  } catch { /* kết nối hỏng: lượt quét sau thử lại */ }
}

/** Người ra lệnh biết lệnh nào bị huỷ / chưa chuyển được (dedup theo lệnh: quét lại không nhắc lần hai). */
function thongBaoNguoiRaLenh(ds: { l: any; vi: 'huy' | 'loi'; msg: string }[]) {
  if (!ds.length) return;
  const ten = new Map<number, string>();
  theoLo([...new Set(ds.map((x) => x.l.student_id as number))], (lo, ph) => {
    for (const r of db().prepare(`SELECT id, full_name FROM students WHERE id IN (${ph})`).all(...lo) as any[]) ten.set(r.id, r.full_name);
  });
  for (const { l, vi, msg } of ds) {
    notify({
      userId: l.nguoi_ra_lenh, kind: vi === 'huy' ? 'huy_lenh' : 'lenh_loi',
      title: vi === 'huy' ? `Đã huỷ quyết định chuyển lớp · ${ten.get(l.student_id) ?? 'học viên'}` : `Chưa chuyển được · ${ten.get(l.student_id) ?? 'học viên'}`,
      body: msg, entityType: 'student', entityId: l.student_id, dedupKey: `lenh_${vi}:${l.id}`,
    });
  }
}

const soTuKck = (l: any): number | null => (l.khong_cam_ket ? TARGET_TAM : l.muc_tieu ?? null);

/**
 * Sau khi chuyển: em có lệnh KCK thì đặt Target = KCK. Lộ trình VỪA MỞ bởi lệnh (bắt đầu đúng Thứ Hai của lệnh, còn số tạm) → ghi thẳng, không có
 * sự kiện "Đổi Target 5 → KCK" (số tạm không phải Target thật). Lộ trình giữ nguyên (FT → FT cùng lộ trình) → đường sửa target có Hành trình.
 * Không kiểm quyền lại: lệnh đã được kiểm lúc ra — người ra lệnh mất vai sau đó không được làm cả nhóm cuộn lại. Một câu đọc cho cả lô.
 */
function datKck(p: Principal, ds: any[]) {
  const kck = ds.filter((l) => l.khong_cam_ket);
  if (!kck.length) return;
  const conn = db();
  const cyc = new Map<number, any>();
  theoLo(kck.map((l) => l.student_id as number), (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, student_id, started_at, target_score, khong_cam_ket FROM learning_cycles WHERE status = 'active' AND student_id IN (${ph})`).all(...lo) as any[]) cyc.set(r.student_id, r);
  });
  const moi: number[] = [];
  for (const l of kck) {
    const c = cyc.get(l.student_id);
    if (!c || c.khong_cam_ket) continue;
    if (c.started_at === l.tuan_bat_dau && c.target_score === TARGET_TAM) moi.push(c.id);
    else reviseTarget(p, c.id, { newTarget: 'KCK', effectiveFrom: l.tuan_bat_dau, reason: 'Không cam kết (quyết định chuyển lớp)' }, { daDuyet: true });
  }
  theoLo(moi, (lo, ph) => {
    conn.prepare(`UPDATE learning_cycles SET target_score = NULL, khong_cam_ket = 1 WHERE id IN (${ph})`).run(...lo);
    conn.prepare(`UPDATE assessment_attempts SET target_at_attempt = NULL WHERE cycle_id IN (${ph})`).run(...lo);   // lộ trình vừa mở: chưa có điểm
  });
}

/** Lớp thường hết khoá: cả nhóm qua MỘT `applyTransition` (theo lô, luật cũ nguyên vẹn, `daDuyet`). Trả các lệnh bị luật từ chối. */
function thiHanhCuoiKhoa(p: Principal, g: any, con: any[]): { id: number; loi: string }[] {
  const byStudent = new Map(con.map((l) => [l.student_id as number, l]));
  const r = applyTransition(p, {
    fromClassId: g.lop_nguon_id, effectiveDate: g.tuan_bat_dau,
    dongs: con.map((l) => ({
      studentId: l.student_id, huong: l.huong, toClassId: l.lop_dich_id, mucTieu: soTuKck(l), thangThi: l.ngay_thi, lyDo: l.ly_do, ngayXemLai: l.ngay_xem_lai,
    })),
  }, { daDuyet: true });
  const hong = new Set<number>(r.failed.map((f: any) => f.studentId));
  datKck(p, con.filter((l) => !hong.has(l.student_id)));
  /* PR-LCa (LCa-3): KCK đi qua `applyTransition` bằng số tạm — Lộ trình tiếp theo giữ Target thật (KCK = trống). */
  theoLo(con.filter((l) => l.khong_cam_ket && !hong.has(l.student_id)).map((l) => l.student_id as number), (lo, ph) => {
    db().prepare(`UPDATE lo_trinh_tiep_theo SET muc_tieu = NULL WHERE class_id = ? AND student_id IN (${ph})`).run(g.lop_nguon_id, ...lo);
  });
  return r.failed.map((f: any) => ({ id: byStudent.get(f.studentId)!.id as number, loi: f.message as string }));
}

/**
 * Giữa khoá (một em, FT gộp/tách lớp): từng em qua `apDungMotDong` — ngoại lệ per-em được phép như S17 (hiếm). Tạm dừng học (bảo lưu) / Dừng học hẳn qua
 * `applyTransition` cho cả nhóm (cùng luật, cùng lô). Mỗi em một savepoint nên em lỗi không kéo em khác.
 */
function thiHanhGiuaKhoa(p: Principal, g: any, con: any[]): { id: number; loi: string }[] {
  const conn = db();
  const loi: { id: number; loi: string }[] = [];
  const roi = con.filter((l) => l.huong === 'chuyen_lop' || l.huong === 'fast_track');
  const khac = con.filter((l) => !roi.includes(l));
  if (khac.length) {
    const byStudent = new Map(khac.map((l) => [l.student_id as number, l]));
    const r = applyTransition(p, {
      fromClassId: g.lop_nguon_id, effectiveDate: g.tuan_bat_dau,
      dongs: khac.map((l) => ({ studentId: l.student_id, huong: l.huong, lyDo: l.ly_do, ngayXemLai: l.ngay_xem_lai })),
    }, { daDuyet: true });
    for (const f of r.failed) loi.push({ id: byStudent.get(f.studentId)!.id, loi: f.message });
  }
  if (roi.length) {
    const caseMo = new Map<number, { id: number; category: string | null }[]>();
    theoLo(roi.map((l) => l.student_id as number), (lo, ph) => {
      for (const c of conn.prepare(`SELECT id, student_id, category FROM sos_cases WHERE status != 'done' AND student_id IN (${ph})`).all(...lo) as any[]) {
        caseMo.set(c.student_id, [...(caseMo.get(c.student_id) ?? []), { id: c.id, category: c.category }]);
      }
    });
    const xong: any[] = [];
    for (const l of roi) {
      try {
        const goiY = nguoiNhanGoiY(caseMo.get(l.student_id) ?? [], l.lop_dich_id);
        const nguoiNhan: Record<number, number> = {};
        for (const [caseId, u] of goiY) if (u) nguoiNhan[caseId] = u.id;   // bỏ giá trị null (giữ người cũ)
        tx(() => {
          if (!lopDichHopLe(l.lop_dich_id, g.lop_nguon_id)) throw badRequest('Lớp chuyển đến không hợp lệ.');
          apDungMotDong(p, {
            sid: l.student_id, toClassId: l.lop_dich_id, ngay: g.tuan_bat_dau, lyDo: l.ly_do, mucTieu: soTuKck(l), thangThi: l.ngay_thi,
            nguoiNhan, boiCanh: 'giua-khoa',
          });
        });
        xong.push(l);
      } catch (e) {
        loi.push({ id: l.id, loi: String((e as any)?.message ?? e).slice(0, 300) });
      }
    }
    datKck(p, xong);
    const nguon = conn.prepare('SELECT is_fast_track FROM classes WHERE id = ?').get(g.lop_nguon_id) as any;
    if (xong.length && !nguon?.is_fast_track) dongLopNeuHet([g.lop_nguon_id], g.tuan_bat_dau);   // Q21: lớp FT không tự kết thúc
  }
  return loi;
}

// ==================================================================== đếm, đề xuất chuyển lớp (Task 6)

/** Em `active` CHƯA CÓ quyết định chuyển lớp đang chờ của mỗi lớp (chưa quyết = chưa có lệnh, Q3/Q30-4). Em đã có ĐỀ XUẤT chờ Quản lý duyệt không tính (đã có thẻ ở Chờ duyệt). Một câu cho cả lô lớp. */
export function emChuaCoLenh(classIds: readonly number[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  theoLo([...classIds], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${ph}) AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}
          AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho')
          AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.trang_thai = 'cho' AND y.loai = 'de_xuat_chuyen_lop' AND y.doi_tuong_loai = 'student:chuyen-lop' AND y.doi_tuong_id = e.student_id)
        ORDER BY e.class_id, e.student_id`,
    ).all(...lo) as any[]) (out.get(r.class_id) ?? out.set(r.class_id, []).get(r.class_id)!).push(r.student_id);
  });
  return out;
}
/** Em (trong `sids`) có đề xuất chuyển lớp CÒN CHỜ Quản lý duyệt — cột Khoá của danh sách lớp. */
export function emChoDuyetChuyenLop(sids: readonly number[]): Set<number> {
  const out = new Set<number>();
  theoLo([...sids], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT doi_tuong_id AS id FROM yeu_cau_duyet WHERE trang_thai = 'cho' AND loai = 'de_xuat_chuyen_lop' AND doi_tuong_loai = 'student:chuyen-lop' AND doi_tuong_id IN (${ph})`,
    ).all(...lo) as any[]) out.add(r.id);
  });
  return out;
}
/** Số em của `emChuaCoLenh` — một luật (PR-VAI-a), hàm cũ giữ chữ ký. */
export function demChuaCoLenh(classIds: readonly number[]): Map<number, number> {
  return new Map([...emChuaCoLenh(classIds)].map(([id, ds]) => [id, ds.length]));
}

/**
 * VIỆC QUẢN LÝ "Chốt lộ trình · {lớp}" (PR-LCb, đặc tả 08/10 §1 — thay "Chốt lên FT" + "Chuyển tiếp lớp"). MỘT luật cho việc của `myWork`,
 * chỉ số `lop-chua-chot-len-ft` và dòng Cần xử lý. Mọi lớp thường đang mở (Pre FOU, FOU, BE, ELE) người xem sửa được (`class.edit`);
 * OV-3b: hiện từ thứ Hai tuần Final − 2, hạn = Chủ nhật tuần Final − 2 (`mocLoTrinh`, theo `final_week_override`); KHÔNG hết hạn — quá hạn đỏ,
 * không chặn gì. Lớp không có tuần Final mà đã hết khoá → vẫn có việc, `han = null`. Xong khi MỌI em đang học có quyết định chuyển lớp đang chờ
 * (Chốt = ra lệnh); em chỉ có đề xuất GVCN chờ duyệt vẫn là chưa xong (đếm riêng); `deXuat` = em có nháp. Một câu lớp + tiến độ lớp + một câu em theo lô.
 * `lopId`: chỉ một lớp (thanh nhắc ở hồ sơ lớp).
 */
export type ChotLoTrinh = DemChotLoTrinh & { classId: number; code: string; han: string | null };

export function lopChoChotLoTrinh(p: Principal, branchId: number | null, today: string, lopId?: number): ChotLoTrinh[] {
  /* Tổng quan gọi hai lần (chỉ số + dòng Cần xử lý) — nhớ trong request. */
  return nho(`chot-lo-trinh:${p.userId}:${branchId ?? ''}:${today}:${lopId ?? ''}`, () => tinhLopChoChotLoTrinh(p, branchId, today, lopId));
}

function tinhLopChoChotLoTrinh(p: Principal, branchId: number | null, today: string, lopId?: number): ChotLoTrinh[] {
  const conn = db();
  const lop = conn.prepare(
    `SELECT c.id, c.code FROM classes c
      WHERE c.status = 'active' AND c.is_fast_track = 0${branchId ? ' AND c.branch_id = ?' : ''}${lopId ? ' AND c.id = ?' : ''}`,
  ).all(...(branchId ? [branchId] : []), ...(lopId ? [lopId] : [])) as any[];
  const tienDo = classProgressMany(lop.map((c) => c.id as number));
  const toi = lop.flatMap((c) => {
    const pr = tienDo.get(c.id);
    /* Chương trình theo `classProgress` (programme_code, lớp cũ NULL thì theo `kind`) — như việc `placement` cũ. */
    /* Lớp thường CÓ SỐ TUẦN (mọi mã, cả mã Quản trị tạo); lớp liên tục (PET, KET — OV-6b2) không có Chốt lộ trình. */
    if (!pr || pr.programmeCode === 'FT' || !pr.totalWeeks) return [];
    const moc = pr.finalWeekStart ? mocLoTrinh(pr.finalWeekStart) : null;
    const han = moc?.hanChot ?? null;
    const den = moc ? today >= moc.nhacTu : mocKetKhoa(pr, today).hetKhoa;
    return den && can(p, PERMISSIONS.CLASS_EDIT, { classId: c.id }) ? [{ classId: c.id as number, code: c.code as string, han }] : [];
  });
  if (!toi.length) return [];
  const dem = new Map<number, DemChotLoTrinh>();
  theoLo(toi.map((x) => x.classId), (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT x.class_id, COUNT(*) AS tong, SUM(NOT x.co_lenh) AS chua_lenh, SUM(NOT x.co_lenh AND x.cho_duyet) AS cho_duyet,
              SUM(NOT x.co_lenh AND NOT x.cho_duyet AND x.co_huong) AS de_xuat
         FROM (SELECT e.class_id,
                      EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = e.student_id AND l.trang_thai = 'cho') AS co_lenh,
                      EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.trang_thai = 'cho' AND y.loai = 'de_xuat_chuyen_lop'
                                AND y.doi_tuong_loai = 'student:chuyen-lop' AND y.doi_tuong_id = e.student_id) AS cho_duyet,
                      EXISTS (SELECT 1 FROM lo_trinh_nhap n WHERE n.student_id = e.student_id AND n.class_id = e.class_id) AS co_huong
                 FROM enrollments e JOIN students s ON s.id = e.student_id
                WHERE e.status = 'active' AND e.class_id IN (${ph}) AND ${HV_DANG_HOC_SQL('s')}) x
        GROUP BY x.class_id`,
    ).all(...lo) as any[]) {
      const chuaLenh = Number(r.chua_lenh), choDuyet = Number(r.cho_duyet), deXuat = Number(r.de_xuat);
      dem.set(r.class_id, { tong: Number(r.tong), chuaLenh, choDuyet, deXuat, chuaHuong: chuaLenh - choDuyet - deXuat });
    }
  });
  return toi.flatMap((x) => { const d = dem.get(x.classId); return d?.chuaLenh ? [{ ...x, ...d }] : []; });
}

/**
 * GVCN lớp em đang học gửi "Đề xuất chuyển lớp…" (Q14): thẻ Thông tin HV, 5 ngày. Lớp muốn tới và tuần là TUỲ CHỌN (Quản lý sửa được trước khi duyệt).
 * Quản lý duyệt = ra lệnh (`apDungDeXuatChuyenLop` chạy trong tx của hộp).
 */
export function guiDeXuatChuyenLop(p: Principal, sid: number, v: { toClassId?: number | null; tuan?: string | null; lyDo?: unknown }) {
  const conn = db();
  const { hv, enr, lyDo, toClassId, tuan } = kiemDeXuatChuyenLop(p, sid, v);
  return tx(() => {
    const id = taoYeuCau(conn, {
      loai: 'de_xuat_chuyen_lop', doiTuongLoai: 'student:chuyen-lop', doiTuongId: sid, hocVienId: sid, lopId: enr.class_id,
      nguoiXin: p.userId, lyDo, duLieu: { lopDichId: toClassId, tuan },
    });
    if (id === null) throw badRequest('Đã có một đề xuất chuyển lớp của em đang chờ Quản lý.');
    writeAudit({ actorUserId: p.userId, action: 'request.create', entityType: 'yeu_cau_duyet', entityId: id, entityLabel: `Đề xuất chuyển lớp · ${hv.full_name}`, after: { toClassId, tuan, lyDo } });
    return { ok: true, id };
  });
}

/** Kiểm đề xuất chuyển lớp — dùng chung lúc gửi và lúc người gửi Sửa thẻ còn chờ (OV-7a): cùng quyền, cùng luật lớp / tuần / lý do. */
export function kiemDeXuatChuyenLop(p: Principal, sid: number, v: { toClassId?: unknown; tuan?: unknown; lyDo?: unknown }) {
  const conn = db();
  const hv = conn.prepare('SELECT id, full_name, status, archived_at FROM students WHERE id = ?').get(sid) as any;
  if (!hv) throw notFound('Không tìm thấy học viên');
  const enr = conn.prepare(`SELECT e.class_id FROM enrollments e WHERE e.student_id = ? AND e.status = 'active' LIMIT 1`).get(sid) as any;
  if (!enr || hv.status !== 'active' || hv.archived_at) throw badRequest('Học viên không đang học lớp nào — không đề xuất chuyển lớp được.');
  /* GVCN của lớp em đang học (`student.edit` ở lớp với vai Giáo viên đã siết về GVCN); Quản lý cũng gửi được → tự duyệt (Q-D). */
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id }, 'Chỉ GVCN lớp em đang học mới gửi được đề xuất chuyển lớp.');
  const lyDo = chuTuDo(v.lyDo, 'Lý do', 2000) ?? '';   // rà Dọn-a P2 (Q4): kiểu + trần, không cắt ngầm
  if (!lyDo) throw badRequest('Ghi lý do để Quản lý có căn cứ duyệt.');   // T7 (PR-MTa): không tối thiểu ký tự
  const toClassId = v.toClassId ? Number(v.toClassId) : null;
  if (toClassId && !lopDichHopLe(toClassId, enr.class_id)) throw badRequest('Lớp chuyển đến không hợp lệ.');
  const tuan = typeof v.tuan === 'string' && v.tuan ? v.tuan : null;
  if (tuan && !tuanHopLe(tuan, demoToday())) throw badRequest('Từ tuần phải là Thứ Hai của tuần sau trở đi.');
  /* Lệnh CHƯA chuyển được (có lỗi) không chặn đề xuất — Quản lý duyệt thì chính lệnh đó được sửa theo đề xuất (cùng lớp nguồn). */
  if (conn.prepare(`SELECT 1 FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho' AND loi IS NULL`).get(sid)) throw badRequest('Em đã có quyết định chuyển lớp đang chờ.');
  return { hv, enr, lyDo, toClassId, tuan };
}

/** `khiDuyet` của thẻ Đề xuất chuyển lớp: `duLieu` là ô của panel D do Quản lý sửa (lớp chuyển đến, tuần, Target…) → RA LỆNH (`tu_yeu_cau_id`). */
export function apDungDeXuatChuyenLop(p: Principal, yc: { id: number; hoc_vien_id: number | null; ly_do: string | null }, duLieu: unknown): void {
  const d = (duLieu ?? {}) as { lopDichId?: unknown; tuan?: unknown; lyDo?: unknown; mucTieu?: unknown; ngayThi?: unknown };
  if (!yc.hoc_vien_id) throw badRequest('Thẻ không có học viên.');
  const conn = db();
  const enr = conn.prepare(
    `SELECT e.class_id, c.is_fast_track, c.programme_code FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status = 'active' LIMIT 1`,
  ).get(yc.hoc_vien_id) as any;
  if (!enr) throw badRequest('Em không còn học lớp nào.');
  const lopDich = Number(d.lopDichId);
  if (!lopDich) throw badRequest('Chọn lớp chuyển đến trước khi duyệt.');
  const dich = lopDichHopLe(lopDich, enr.class_id);
  if (!dich) throw badRequest('Lớp chuyển đến không hợp lệ.');
  /*
   * PR-S5F-a (planning chốt): lớp thường đã tới Cuối khoá → hướng CUỐI KHOÁ (lên lớp / học lại / FT) như panel cả lớp, cùng luật lớp chuyển đến.
   * PR-LCa (planning 08/10): từ tuần Final (cùng mốc `tuCuoiKhoa` của raLenh / Chuyển tiếp lớp), không đợi hết khoá — Lên FT duyệt lúc này
   * đi đường cuối khoá (đồng bộ Lộ trình tiếp theo + MT0). PR-CL (B1): MỘT luật với `/transfer` (`huongChuyenMotEm`).
   */
  const { boiCanh, huong } = huongChuyenMotEm(enr, dich);
  const r = raLenh(p, {
    lopNguonId: enr.class_id, boiCanh, tuanChung: null, tuYeuCauId: yc.id,
    dongs: [{
      studentId: yc.hoc_vien_id, huong, toClassId: lopDich,
      tuan: typeof d.tuan === 'string' ? d.tuan : null, mucTieu: soHoacKck(d.mucTieu), ngayThi: typeof d.ngayThi === 'string' ? d.ngayThi : null,
      lyDo: typeof d.lyDo === 'string' && d.lyDo.trim() ? d.lyDo : yc.ly_do,
    }],
  });
  if (r.failed.length) throw badRequest(r.failed[0].message);
}
