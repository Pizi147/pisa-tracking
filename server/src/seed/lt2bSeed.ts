/**
 * BỘ DEMO PR-LT2b (K5 §6 D10–D13) — lớp thường · Cuối khoá. Đi qua CHÍNH các hàm dịch vụ (thêm HV → xếp bài Cuối khoá → nhập điểm →
 * Kết luận lên FT → Chuyển tiếp lớp → Case + PA Bổ trợ miễn phí + Mini Test → ghi Mini Test); không dựng bằng SQL trừ tên lớp.
 * Hai lớp MỚI cuối mảng `CLASSES`: MB BE 04 (khai giảng 29/06 — Cuối khoá tuần 10 = W1 SEP) và MB ELE 02 (07/09 — lớp đích, tuần 2/10).
 *
 *  D10  BE 04  · bốn em Cuối khoá ở bốn dải: Hồ Thu Trang 45% → Học lại (đã chuyển sang MB BE 03: việc Báo PH qua TVV cho Quản lý);
 *                Đặng Minh Khôi 55% → Quản lý cân nhắc (chưa chuyển); Vương Bảo Ngọc 64% → đã lên ELE 02: Case + PA Bổ trợ miễn phí, Mini Test CHƯA ghi;
 *                Tạ Đức Huy 78% → Pass (chưa chuyển).
 *  D11  BE 04  · Lâm Khánh Vy 64% đã lên ELE 02, Mini Test 58% → Case còn mở + thẻ Báo lên cho Quản lý.
 *  D12  Pre FOU 03 · Ninh Gia Bảo 52% → Quản lý cho lên MB FOU 15: Case "Cuối khoá Pre FOU · Tổng hợp không đạt", 4 buổi · 2 tuần.
 *  D13  BE 04  · hai em 75% lên Fast Track: Chu Nhật Minh "Không đạt · Trung tâm (Reading)" → Case FT + PA Tutor 10 buổi; Kiều Thảo Nhi "Không đạt · Học sinh" → không Case.
 */
import { loadPrincipal } from '../permissions.ts';
import { commitIntake } from '../classes/intake.ts';
import { applyTransition } from '../classes/transition.ts';
import { planRegularTests, saveRegularScore } from '../normal/regular.ts';
import { updateResult } from '../cases/cases.ts';
import type { BuildCtx } from './build.ts';

export function buildLt2bDemo(ctx: BuildCtx): { em: number } {
  const { conn } = ctx;
  const be04 = ctx.classId.get('MB BE 04'), ele02 = ctx.classId.get('MB ELE 02'), be03 = ctx.classId.get('MB BE 03');
  const pf03 = ctx.classId.get('MB Pre FOU 03'), fou15 = ctx.classId.get('MB FOU 15'), ft = ctx.classId.get('MB FT 101');
  if (!be04 || !ele02 || !be03 || !pf03 || !fou15 || !ft) return { em: 0 };
  const admin = loadPrincipal(ctx.adminId);
  const ql = loadPrincipal(ctx.userId.get('MGR_MB')!);
  /** Thêm em vào lớp, xếp bài Cuối khoá (đã qua tuần → đường Quản lý), nhập điểm /20 theo môn. */
  const dung = (classId: number, ten: string, diem: Record<string, number>, tong = 20) => {
    commitIntake(admin, { classId, rows: [{ fullName: ten, target: '-', email: 'hv@demo.test' }], idempotencyKey: `lt2b-demo-${ten}` } as any);
    const sid = (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
    planRegularTests(ql, classId, { studentIds: [sid], kinds: ['final'] });
    const cuoi = (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`).get(sid) as any).id as number;
    for (const [k, v] of Object.entries(diem)) saveRegularScore(admin, cuoi, k, { score: v, total: tong } as any);
    return sid;
  };
  const chuyen = (fromClassId: number, ngay: string, dongs: any[]) => {
    const r = applyTransition(ql, { fromClassId, effectiveDate: ngay, dongs }) as any;
    if (r.failed.length) throw new Error(`Demo LT2b: chuyển lỗi ${JSON.stringify(r.failed)}`);
  };
  const dat = { listening: 15, reading: 15, writing: 15, speaking: 15 };   // 75%

  // D10 · BE 04 — bốn dải
  const trang = dung(be04, 'Hồ Thu Trang', { listening: 9, reading: 9, writing: 9, speaking: 9 });               // 45%
  dung(be04, 'Đặng Minh Khôi', { listening: 11, reading: 11, writing: 11, speaking: 11 });                        // 55% — Quản lý cân nhắc, chưa chuyển
  const ngoc = dung(be04, 'Vương Bảo Ngọc', { listening: 17, reading: 17, writing: 8, speaking: 9 });           // 63,75%: trượt W, S
  dung(be04, 'Tạ Đức Huy', { listening: 16, reading: 16, writing: 15, speaking: 16 });                            // 78,75% Pass
  // D11 · một em 64% khác, Mini Test 58%
  const vy = dung(be04, 'Lâm Khánh Vy', { listening: 17, reading: 17, writing: 8, speaking: 9 });
  // D13 · hai em BE 75% lên FT — kết luận kỳ vọng đầu ra TRƯỚC khi chuyển
  const minh = dung(be04, 'Chu Nhật Minh', { ...dat, reading: 13 });                                             // trượt R (13/20 = 65%)
  const nhi = dung(be04, 'Kiều Thảo Nhi', dat);
  /*
   * PR-KV (§3): kết luận kỳ vọng đầu ra nay xét theo MT0 (`ghiKetLuanFt` đòi MT0 đủ điểm). Bộ demo không dựng MT0 cho hai em này (MT0 chèn tay
   * làm lệch lịch kỹ năng / nợ điểm của các bộ kiểm demo) → ghi thẳng kết luận như Quản lý đã lưu; thi hành chuyển lớp tạo Case như thật.
   */
  const ketLuan = conn.prepare(`INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ky_vong_dat, ky_vong_nguyen_nhan, ky_vong_mon, ky_vong_ghi_chu, updated_by, created_at, updated_at)
    VALUES (?,?, 'chua_quyet', 0, ?,?,?,?, '2026-09-04T09:00:00.000Z', '2026-09-04T09:00:00.000Z')
    ON CONFLICT(student_id, class_id) DO UPDATE SET ky_vong_dat = 0, ky_vong_nguyen_nhan = excluded.ky_vong_nguyen_nhan, ky_vong_mon = excluded.ky_vong_mon,
      ky_vong_ghi_chu = excluded.ky_vong_ghi_chu, updated_by = excluded.updated_by, updated_at = excluded.updated_at`);
  ketLuan.run(minh, be04, 'trung_tam', '["reading"]', null, ql.userId);
  ketLuan.run(nhi, be04, 'hoc_sinh', '["speaking"]', 'Em nghỉ nhiều — hẹn phụ huynh, tăng tự học 2 buổi mỗi tuần.', ql.userId);

  chuyen(be04, '2026-09-07', [
    { studentId: trang, huong: 'hoc_lai', toClassId: be03 },
    { studentId: ngoc, huong: 'len_lop', toClassId: ele02 },
    { studentId: vy, huong: 'len_lop', toClassId: ele02 },
    { studentId: minh, huong: 'fast_track', toClassId: ft, mucTieu: 6.5 },
    { studentId: nhi, huong: 'fast_track', toClassId: ft, mucTieu: 6.5 },
  ]);
  // D11 · ghi Mini Test 58% của Lâm Khánh Vy (người dạy bổ trợ = GVCN lớp ELE 02, mặc định khi chưa có GVBM đúng môn)
  const pa = (sid: number) => conn.prepare(
    `SELECT iv.id, iv.performer_user_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE sc.student_id = ? AND iv.kind = 'bo_tro_mien_phi' AND iv.status = 'started' ORDER BY iv.id LIMIT 1`).get(sid) as any;
  const paVy = pa(vy);
  updateResult(ql, paVy.id, {
    outcome: 'unchanged', note: 'Em làm Mini Test còn sai nhiều phần Writing và Speaking.', observedOn: '2026-09-14',
    miniTest: { tyLe: 58, ngay: '2026-09-13' },
    soBuoi: 1, nguoiDay: { performerUserId: paVy.performer_user_id },   // PR-PA (§8): PA có Số buổi (Mini Test) → Số buổi tuần này + Người dạy
  } as any);

  // D12 · Pre FOU 03 — một em 52%, Quản lý cho lên FOU 15
  const bao = dung(pf03, 'Ninh Gia Bảo', { tong_hop: 21 }, 40);   // 52,5%
  chuyen(pf03, '2026-09-14', [{ studentId: bao, huong: 'len_lop', toClassId: fou15 }]);
  return { em: 9 };
}
