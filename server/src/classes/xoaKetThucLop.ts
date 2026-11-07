/**
 * ⋮ HỒ SƠ LỚP › XOÁ LỚP / KẾT THÚC LỚP / MỞ LẠI LỚP (PR-UX3, chủ sản phẩm chốt 24/09; PR-LUI-b 06/10). Cả ba: Quản lý của lớp (`class.edit`) hoặc Quản trị
 * (OV-12a, chủ SP 14/10: Quản lý xoá được lớp TRỐNG — trước đây chỉ Quản trị) — Quản lý mở lại nhầm thì kết thúc lại được. Kiểm ở MÁY CHỦ
 * (giáo viên gọi API đều nhận 403, không chỉ bị ẩn nút).
 *
 *   Xoá lớp      chỉ lớp CHƯA có dữ liệu nào: chưa học viên nào từng ghi danh, chưa lượt Test / điểm, chưa vi phạm hay phương án xử lý,
 *                chưa công việc, tín hiệu, ước lượng, lộ trình tiếp theo gắn lớp, và không lớp nào học tiếp từ nó. Xoá hẳn trong MỘT
 *                giao dịch (phân công GV, kỹ năng lớp, dòng lớp) + `audit_logs`. Phải gõ lại đúng mã lớp.
 *   Kết thúc lớp cho lớp đã có dữ liệu: còn học viên đang học thì CHẶN; không còn ai thì `status = 'finished'`, `finished_at` = hôm nay
 *                (cùng luật lớp tự kết thúc của PR-LT), lớp vào khu Lưu trữ (chỉ xem) + `audit_logs`.
 */
import { db, tx } from '../db.ts';
import { CHU_CHUYEN_LOP, PERMISSIONS, tuanLich } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, badRequest, canXacNhan, chuTuDo, loi, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { emChuaCoLenh, huyNhieuLenh } from './lenhChuyen.ts';
import { quetMoiNgay } from '../platform/mocHeThong.ts';

const CHI_QL_LOP = 'Chỉ Quản lý của lớp này hoặc Quản trị hệ thống mới kết thúc hoặc mở lại được lớp.';

/** Bảng có cột `class_id` mà một dòng ở đó nghĩa là "lớp đã có dữ liệu" (`teacher_assignments`, `class_skills` là cấu hình, không tính). */
const BANG_DU_LIEU: [string, string][] = [
  ['assessment_attempts', 'lượt Test'], ['case_signals', 'Case chờ xác nhận nguyên nhân'], ['teacher_estimates', 'ước lượng của giáo viên'],
  ['tasks', 'công việc'], ['violations', 'vi phạm'], ['discipline_measures', 'lần xử lý vi phạm'],
];

function docLop(classId: number) {
  const c = db().prepare(
    `SELECT c.id, c.code, c.status, c.finished_at, c.is_fast_track, b.name AS branch_name
       FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`,
  ).get(classId) as { id: number; code: string; status: string; finished_at: string | null; is_fast_track: number; branch_name: string } | undefined;
  if (!c) throw notFound('Không tìm thấy lớp');
  return c;
}

/** Số học viên từng ghi danh / đang học và những thứ đang gắn lớp — một lần đếm cho cả hai việc. */
export function tinhTrangLop(classId: number) {
  const conn = db();
  const dem = (sql: string, ...a: unknown[]) => (conn.prepare(sql).get(...a) as { n: number }).n;
  const soTungGhiDanh = dem('SELECT COUNT(*) n FROM enrollments WHERE class_id = ?', classId);
  const soDangHoc = dem(`SELECT COUNT(*) n FROM enrollments WHERE class_id = ? AND status = 'active'`, classId);
  /* PR-LUI-b: quyết định chuyển lớp CHƯA thi hành mà lớp này là lớp ĐẾN ("Sắp nhận n em") — kết thúc lớp sẽ làm chúng hỏng. */
  const soSapNhan = dem(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE lop_dich_id = ? AND trang_thai = 'cho'`, classId);
  const gan: string[] = [];
  for (const [bang, nhan] of BANG_DU_LIEU) {
    const n = dem(`SELECT COUNT(*) n FROM ${bang} WHERE class_id = ?`, classId);
    if (n > 0) gan.push(`${n} ${nhan}`);
  }
  const nLoTrinh = dem('SELECT COUNT(*) n FROM lo_trinh_tiep_theo WHERE class_id = ? OR lop_du_kien_id = ?', classId, classId);
  if (nLoTrinh > 0) gan.push(`${nLoTrinh} lộ trình tiếp theo`);
  const nLenh = dem('SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE lop_nguon_id = ? OR lop_dich_id = ?', classId, classId);
  if (nLenh > 0) gan.push(`${nLenh} quyết định chuyển lớp`);
  const nHocTiep = dem('SELECT COUNT(*) n FROM classes WHERE previous_class_id = ?', classId);
  if (nHocTiep > 0) gan.push(`${nHocTiep} lớp học tiếp từ lớp này`);
  /* PR-LT2b (K2-35): việc còn treo — KHÔNG chặn Kết thúc lớp, chỉ nói ra: Mini Test của em từ lớp này chưa ghi. */
  const nMiniTest = dem(`SELECT COUNT(*) n FROM mini_test m JOIN assessment_attempts a ON a.id = m.tu_attempt_id WHERE a.class_id = ? AND m.ty_le IS NULL`, classId);
  /* K2-35: quyết định chuyển lớp CHƯA tới tuần chuyển — nói ra cùng chỗ (chữ chuyển lớp một nguồn `CHU_CHUYEN_LOP`, tuần là mã tuần). */
  const cho = conn.prepare(`SELECT COUNT(*) n, MIN(tuan_bat_dau) tu FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai = 'cho'`).get(classId) as { n: number; tu: string | null };
  const treo = [
    nMiniTest > 0 ? `${nMiniTest} Mini Test chưa ghi` : null,
    cho.n > 0 && cho.tu ? `${CHU_CHUYEN_LOP.sapChuyen(tuanLich(cho.tu, demoToday()))} (${cho.n} em)` : null,
  ].filter(Boolean);
  return { soTungGhiDanh, soDangHoc, soSapNhan, gan, coDuLieu: soTungGhiDanh > 0 || gan.length > 0, conTreo: treo.length ? `Còn treo: ${treo.join(' · ')}` : null };
}

/**
 * Câu chặn Kết thúc lớp khi còn em đang học — nói đúng việc phải làm theo loại lớp (K2-35): FT chuyển từng em; lớp thường (CA2-4) đếm em chưa chốt
 * Lộ trình tiếp theo cùng hàm badge "n HV chưa chốt lộ trình" (`emChuaCoLenh`), đã chốt hết thì chỉ còn chờ tới tuần chuyển.
 */
function lyDoConEm(c: { id: number; is_fast_track: number }, soDangHoc: number): string {
  if (c.is_fast_track) return `Còn ${soDangHoc} học viên đang học — chuyển lớp từng em hoặc chuyển nhiều em trước.`;
  const chuaChot = emChuaCoLenh([c.id]).get(c.id)?.length ?? 0;
  return chuaChot > 0 ? `Còn ${chuaChot} em chưa chốt Lộ trình tiếp theo.` : `Còn ${soDangHoc} em chờ tới tuần chuyển lớp.`;
}

const lyDoSapNhan = (n: number) => `Còn ${n} quyết định chuyển lớp ĐẾN lớp này — huỷ hoặc đổi lớp đến trước.`;

/** GET /classes/:id/xoa-ket-thuc — cho panel biết nên hiện nút nào và vì sao. Quản lý của lớp hoặc Quản trị (OV-12a: cả hai xoá được lớp trống). */
export function xemXoaKetThuc(p: Principal, classId: number) {
  require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_LOP);
  const c = docLop(classId);
  const t = tinhTrangLop(classId);
  const daKetThuc = c.status === 'finished';
  return {
    id: c.id, ma: c.code, chiNhanh: c.branch_name, daKetThuc,
    soDangHoc: t.soDangHoc, soTungGhiDanh: t.soTungGhiDanh, coDuLieu: t.coDuLieu, dangGan: t.gan, conTreo: t.conTreo,
    /** Xoá: chỉ lớp trống hẳn (đã kiểm `class.edit` ở trên). Kết thúc: lớp còn hoạt động và không còn học viên đang học. */
    coTheXoa: !t.coDuLieu,
    /* RKC-4a: còn quyết định chuyển ĐẾN → vẫn Kết thúc được (máy chủ hỏi rồi huỷ các quyết định đó, khôi phục được ở Chuyển lớp). */
    coTheKetThuc: !daKetThuc && t.soDangHoc === 0,
    lyDoChanKetThuc: daKetThuc ? 'Lớp đã kết thúc.' : t.soDangHoc > 0 ? lyDoConEm(c, t.soDangHoc) : null,
    soSapNhan: t.soSapNhan,
  };
}

/** POST /classes/:id/xoa { maLop } — xoá hẳn lớp còn trống. Quản lý của lớp hoặc Quản trị (OV-12a). */
export function xoaLop(p: Principal, classId: number, input: { maLop?: unknown }) {
  require_(p, PERMISSIONS.CLASS_EDIT, { classId }, 'Chỉ Quản lý của lớp này hoặc Quản trị hệ thống mới xoá được lớp.');
  const c = docLop(classId);
  const t = tinhTrangLop(classId);
  if (t.coDuLieu) throw badRequest('Lớp đã có dữ liệu — dùng Kết thúc lớp.');
  if (String(input.maLop ?? '').trim() !== c.code) throw badRequest('Gõ lại đúng mã lớp để xác nhận xoá.');
  const conn = db();
  tx(() => {
    /* PR-B: việc bàn giao đổi GV của lớp trống (trỏ `doi_phan_cong`) — xoá trước. */
    conn.prepare('DELETE FROM ban_giao_gv_em WHERE ban_giao_id IN (SELECT id FROM ban_giao_gv WHERE class_id = ?)').run(classId);
    conn.prepare('DELETE FROM ban_giao_gv_mon WHERE ban_giao_id IN (SELECT id FROM ban_giao_gv WHERE class_id = ?)').run(classId);
    conn.prepare('DELETE FROM ban_giao_gv WHERE class_id = ?').run(classId);
    conn.prepare('DELETE FROM doi_phan_cong WHERE class_id = ?').run(classId);   // PC-GV-A: lịch / lần đổi phân công của lớp trống
    conn.prepare('DELETE FROM teacher_assignments WHERE class_id = ?').run(classId);
    conn.prepare('DELETE FROM class_skills WHERE class_id = ?').run(classId);
    conn.prepare('DELETE FROM ghi_chu_lich_thi WHERE class_id = ?').run(classId);   // OV-15c: ghi chú lớp của lớp trống
    conn.prepare('DELETE FROM bao_cao_ph_dot WHERE class_id = ?').run(classId);   // BC-DOT-QL: đợt báo cáo PH bỏ / thêm của lớp trống (cấu hình)
    conn.prepare('DELETE FROM classes WHERE id = ?').run(classId);
    writeAudit({
      actorUserId: p.userId, action: 'class.delete', entityType: 'class', entityId: classId, entityLabel: c.code,
      before: { code: c.code, branch: c.branch_name, status: c.status }, after: null,
    });
  });
  return { ok: true, ma: c.code };
}

/**
 * POST /classes/:id/ket-thuc — kết thúc lớp không còn học viên đang học; lớp vào khu Lưu trữ. Quản lý của lớp hoặc Quản trị.
 * `p = null`: HỆ THỐNG (LOP-TRONG `dongLopTrong`) — không kiểm quyền, nhật ký người làm "Hệ thống" + `lyDo`.
 */
export function ketThucLop(p: Principal | null, classId: number, o: { lyDo?: string } = {}) {
  if (p) require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_LOP);
  const c = docLop(classId);
  if (c.status === 'finished') throw badRequest('Lớp đã kết thúc.');
  const t = tinhTrangLop(classId);
  if (t.soDangHoc > 0) {
    throw badRequest(lyDoConEm(c, t.soDangHoc));
  }
  /* RKC-4a (chủ SP 07/11; trước: "huỷ hoặc đổi lớp đến trước"): người làm được hỏi MỘT câu nêu số quyết định đến, đồng ý = huỷ cùng giao dịch (lý do ghi
     rõ, Khôi phục ở Chuyển lớp). Hệ thống (`p = null`, lớp trống) không hỏi — giữ chặn. */
  if (t.soSapNhan > 0 && !p) throw badRequest(lyDoSapNhan(t.soSapNhan));
  if (t.soSapNhan > 0) canXacNhan('Còn {n} quyết định chuyển ĐẾN lớp này — huỷ các quyết định đó rồi kết thúc lớp?', { n: t.soSapNhan }, 'Huỷ và kết thúc lớp');
  const ngay = demoToday();
  const conn = db();
  tx(() => {
    if (p && t.soSapNhan > 0) {
      const ids = (conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE lop_dich_id = ? AND trang_thai = 'cho'`).all(classId) as any[]).map((r) => r.id as number);
      const r = huyNhieuLenh(p, ids, `Lớp ${c.code} kết thúc`);
      if (r.failed.length) throw loi(400, '{x} — huỷ quyết định đó ở Chuyển lớp rồi kết thúc lớp.', { x: r.failed[0].message });
    }
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(ngay, classId);
    writeAudit({
      actorUserId: p?.userId ?? null, action: 'class.finished', entityType: 'class', entityId: classId, entityLabel: c.code,
      before: { status: c.status }, after: { status: 'finished', on: ngay, ...(o.lyDo ? { lyDo: o.lyDo } : {}) },
    });
  });
  return { ok: true, ma: c.code, finishedAt: ngay };
}

/**
 * LỚP TRỐNG TỰ LƯU TRỮ (chủ SP 07/11, LOP-TRONG): lớp đang chạy, 0 em đang học, KHÔNG có kế hoạch nhận HV, liên tục `NGAY_LOP_TRONG` ngày → hệ thống
 * Kết thúc lớp (`ketThucLop`, cùng đường QL bấm) — lớp vào Lưu trữ, "Mở lại lớp" như cũ. "Kế hoạch nhận HV" = em Tạm dừng còn giữ chỗ (ghi danh `paused`)
 * · quyết định chuyển ĐẾN lớp đang chờ · Lộ trình tiếp theo dự kiến về lớp chưa áp dụng · hẹn bắt đầu Lộ trình mới về lớp (`buoc_tiep_hen`; không chọn lớp
 * khác = lớp cũ của em). Em mới xếp vào (dù chưa tới ngày học) là ghi danh `active` → lớp không trống. Lớp chưa từng có em (chờ khai giảng) không tự đóng.
 * "7 ngày" tính từ ngày em cuối rời lớp (`MAX(ended_at)`, không thêm cột), hoặc từ lần Mở lại lớp gần nhất nếu muộn hơn (mở lại không bị đóng ngay hôm sau).
 */
export const NGAY_LOP_TRONG = 7;
const LY_DO_LOP_TRONG = `Tự động — lớp trống ${NGAY_LOP_TRONG} ngày`;

/** Lớp đủ điều kiện tự đóng tới `homNay` (một câu; chỉ lớp `active` không còn em `active`/`paused` mới đi tới các câu con). */
const SQL_LOP_TRONG = `
  SELECT c.id FROM classes c
   WHERE c.status = 'active'
     AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = c.id AND e.status IN ('active', 'paused'))
     AND (SELECT MAX(COALESCE(e.ended_at, e.started_at)) FROM enrollments e WHERE e.class_id = c.id) <= ?1
     AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.lop_dich_id = c.id AND l.trang_thai = 'cho')
     AND NOT EXISTS (SELECT 1 FROM lo_trinh_tiep_theo t WHERE t.lop_du_kien_id = c.id AND t.da_ap_dung_luc IS NULL)
     AND NOT EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.buoc_tiep = 'lo_trinh_moi' AND lc.buoc_tiep_hen IS NOT NULL
           AND (json_extract(lc.buoc_tiep_json, '$.lopMoiId') = c.id
             OR (json_extract(lc.buoc_tiep_json, '$.lopMoiId') IS NULL AND lc.student_id IN (SELECT e.student_id FROM enrollments e WHERE e.class_id = c.id))))
     AND NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.entity_type = 'class' AND a.action = 'class.reopened' AND a.entity_id = c.id AND substr(a.created_at, 1, 10) > ?1)
   ORDER BY c.id`;

/** Đóng các lớp trống đủ hạn; lỗi một lớp không chặn lớp khác. Trả id lớp đã đóng. */
export function dongLopTrong(homNay = demoToday()): number[] {
  const ids = (db().prepare(SQL_LOP_TRONG).all(addDays(homNay, -NGAY_LOP_TRONG)) as { id: number }[]).map((r) => r.id);
  const xong: number[] = [];
  for (const id of ids) {
    try { ketThucLop(null, id, { lyDo: LY_DO_LOP_TRONG }); xong.push(id); } catch (e) { console.error('[lop-trong]', id, e); }
  }
  return xong;
}

/** Lượt quét MỘT lần mỗi ngày nghiệp vụ (mốc `quet:lop-trong`): đã quét hôm nay → 0 câu. Gọi cùng lượt quét lệnh chuyển lớp (`quetLenhDenHan`). */
export function quetLopTrong(homNay = demoToday()): boolean {
  return quetMoiNgay('quet:lop-trong', homNay, () => { dongLopTrong(homNay); });
}

/**
 * MỞ LẠI LỚP ĐÃ KẾT THÚC (PR-LUI-b, chủ sản phẩm 06/10) — ngược của `ketThucLop`. Quản lý của lớp (`class.edit`) hoặc Quản trị. Học viên đã kết thúc học KHÔNG tự
 * quay lại (mỗi học viên Học lại riêng). Gọi được từ giao dịch khác (`hocLai` mở lớp cùng lúc — `tx` lồng = savepoint).
 * ponytail: lớp thường đã hết khoá mà mở lại khi chưa có học viên đang học thì `dongLopNeuHet` (luatLoTrinh.ts) có thể kết thúc lại ở lần đổi trạng thái / chuyển
 * lớp kế tiếp của một học viên trong lớp; Học lại một học viên vào lớp (ghi danh `active`) thì lớp ở lại.
 */
export function moLaiLop(p: Principal, classId: number, o: { lyDo?: unknown; /** OV-8b: lớp tự đóng vì việc đang được hoàn tác — nơi gọi đã kiểm quyền việc đó. */ heQua?: true } = {}) {
  if (!o.heQua) require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_LOP);
  const c = docLop(classId);
  if (c.status !== 'finished') throw badRequest('Lớp chưa kết thúc.');
  const lyDo = chuTuDo(o.lyDo, 'Lý do', 2000);
  const conn = db();
  tx(() => {
    conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ? AND status = 'finished'`).run(classId);
    writeAudit({
      actorUserId: p.userId, action: 'class.reopened', entityType: 'class', entityId: classId, entityLabel: c.code,
      before: { status: 'finished', finishedAt: c.finished_at }, after: { status: 'active', lyDo },
    });
  });
  return { ok: true, ma: c.code, finishedAt: c.finished_at as string | null };
}
