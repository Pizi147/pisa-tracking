/**
 * XM-VIEC-DUNG-HAN b (chủ SP 07/11, plan.md mục 4 "07/11 đêm" mục 6): VIỆC ĐÃ XONG của "Việc đúng hạn" — mọi loại `VIEC_CO_HAN` (trừ Kết quả PA, Chấm Test
 * đã có tập riêng) có HẠN trong kỳ và NGÀY XONG: xong ≤ hạn = đúng hạn (tử + mẫu), xong sau hạn = không đúng hạn (mẫu). Trước đây việc xong rời Công việc là
 * rời luôn số liệu (làm trễ còn làm % đẹp lên). Việc đã xong mà KHÔNG có ngày xong (dữ liệu cũ của Mô tả / Xác nhận Case) → không tính, như cũ.
 *
 * Ngày xong (đọc sẵn, trừ một cột mới):
 *   Xác nhận Case · Mô tả Case (cả Xác nhận Case S) — `sos_cases.mo_ta_luc` (migrate `prNgayXong0711`; Xác nhận Case cũ: mốc `xac_nhan_case`) · hạn `han_xac_nhan`
 *   Xác nhận PA — `confirmed_at` của PA quy chế · hạn `han_xac_nhan` (một Case một việc)
 *   Thêm PA — PA đầu tiên (`created_at`) của Case không có PA quy chế · hạn `hanThemPa`
 *   Ghi Mini Test — `ghi_luc` · `han`  ·  Báo PH — lần "đã báo" đầu (`viec_bao_ph_lan.ngay`) · `hanBaoPhHieuLuc` (không trượt theo Tạm dừng)
 *   Chọn bước tiếp — `buoc_tiep_luc` · `trangThaiSauThi`  ·  Bàn giao — `xac_nhan_luc` / `ban_giao_mon.ghi_luc` / `ban_giao_gv.xong_luc` · hạn của lệnh
 *   Xử lý vi phạm — `phan_hoi_ngay` · `han_xu_ly` (một lần phản hồi một việc)  ·  Phối hợp SOS — meeting CX `performed_on` · `hanPhoiHop`
 * Người giữ việc: như Công việc khi đọc lại được (chủ Case, GVCN / GVBM theo phân công lúc hạn, TVV của em, người giữ Mini Test); không ai giữ → không tính.
 * Lớp như Công việc: Case — lớp của lượt, không thì lớp đang học (`COT_CASE`); việc khác — lớp đang học. Đọc: 6 câu một chi nhánh mỗi request (nhớ theo chi nhánh + kỳ).
 * ponytail: Bàn giao môn sửa lại câu thì `ghi_luc` là lần sửa cuối; Báo PH bỏ trượt hạn theo Tạm dừng — thêm cột "xong lần đầu" nếu chủ SP báo lệch.
 */
import { db } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { LA_CASE_MT, LA_CASE_SOS } from '../cases/sosState.ts';
import { COT_SAU_THI, NGAY_CO_KQ } from '../loTrinh/cotSauThi.ts';
import { nguoiGiuMiniTest } from '../normal/cuoiKhoa.ts';
import { duongHoSoHocVien, hanBaoPhHieuLuc, hanPhoiHop, hanThemPa, laMeetingCx, ngayTheoGioVN, trangThaiSauThi, type ViecGopDuoc } from '../../../shared/domain/index.ts';

export type ViecXong = ViecGopDuoc & { xong: string; dung: boolean };
type Ky = { cn: number; khung: 'ft' | 'thuong'; tu: string; cuoi: string; homNay: string };

/** Lớp em đang học (ghi danh active mới nhất), không thì lớp của lượt — như `napPa` / Công việc. `hv` = cột em. */
const lopEm = (hv: string, luot: string) => `COALESCE((SELECT e.class_id FROM enrollments e WHERE e.student_id = ${hv} AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), ${luot})`;
/** Người có phân công ở lớp (GVCN `is_core` hoặc môn — Writing FT do GV W1 / W2 giữ, như `kyNangPhuTrach`) hiệu lực tại ngày. */
const gvLop = (lop: string, ngay: string, mon: string | null) => `(SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id = ${lop} AND ta.status IN ('active', 'ended')
  AND ${mon ? `(ta.skill = ${mon} OR (${mon} = 'writing' AND ta.skill IN ('writing1', 'writing2')))` : 'ta.is_core = 1'} AND ta.effective_from <= ${ngay} AND (ta.effective_to IS NULL OR ta.effective_to >= ${ngay}) ORDER BY ta.id DESC LIMIT 1)`;

/** Việc đã xong có hạn trong kỳ của MỘT chi nhánh, theo người giữ việc. `kemKhongLop`: lấy việc không gắn lớp (như `viecQuaHanMo`). */
export function viecDaXong(c: Ky, kemKhongLop = true): Map<number, ViecXong[]> {
  const ds = nho(`pt-gv:viec-xong:${c.cn}:${c.tu}:${c.cuoi}`, () => dungTap(c));
  const out = new Map<number, ViecXong[]>();
  for (const it of ds) {
    if (it.khung ? it.khung !== c.khung : !kemKhongLop) continue;
    (out.get(it.ownerId!) ?? out.set(it.ownerId!, []).get(it.ownerId!)!).push(it);
  }
  return out;
}

/**
 * Việc đã xong của một chi nhánh, hạn trong [tu, cuoi] — mọi khung. `kemThieuNgay` (sổ nghĩa vụ, spec 1.3): thêm Xác nhận / Mô tả Case ĐÃ có mô tả mà
 * KHÔNG có ngày xong (dữ liệu cũ) với `xong = ''` — "Việc đúng hạn" không gọi cờ này nên không đổi số.
 */
export function viecXongCn(c: Ky, kemThieuNgay = false): ViecXong[] {
  return dungTap(c, kemThieuNgay);
}

function dungTap(c: Ky, kemThieuNgay = false): ViecXong[] {
  const conn = db();
  const out: ViecXong[] = [];
  const trong = (han: string | null | undefined): han is string => !!han && han >= c.tu && han <= c.cuoi;
  const them = (r: { owner: number | null; han: string | null; xong: string | null; lop: number | null; ma: string | null; ft: number | null; hv?: number | null; ten?: string | null; daXong?: boolean },
    x: { key: string; group: string; tieuDe: string; href: string; caseSos?: boolean; sos?: number | null }) => {
    /* Ngày xong sau hôm nay nghiệp vụ (bản demo: dấu giờ máy đi trước ngày demo) — không tính. */
    if (!r.owner || r.owner <= 0 || !trong(r.han) || (r.xong ? r.xong > c.homNay : !(kemThieuNgay && r.daXong))) return;
    out.push({ ...x, urgency: 'normal', due: r.han, studentId: r.hv ?? null, studentName: r.ten ?? (r.ma ? `Lớp ${r.ma}` : ''), classId: r.lop, classCode: r.ma,
      khung: r.lop == null ? null : r.ft ? 'ft' : 'thuong', ownerId: r.owner, contextLabel: null, count: null, actionLabel: '', xong: r.xong ?? '', dung: !!r.xong && r.xong <= r.han });
  };
  const lopCua = (r: any) => ({ lop: r.lop ?? null, ma: r.ma ?? null, ft: r.ft ?? null, hv: r.hv ?? null, ten: r.ten ?? null });

  /* 1. Case: Xác nhận / Mô tả Case, Xác nhận PA, Thêm PA — một câu (Case của em chi nhánh: đi chỉ mục idx_student_branch). */
  for (const r of conn.prepare(
    `SELECT sc.id, sc.student_id AS hv, s.full_name AS ten, sc.owner_user_id AS owner, sc.han_xac_nhan, sc.detected_at, sc.created_at, sc.urgency, sc.sos_level, sc.kck, sc.han_them_pa,
            ${LA_CASE_SOS('sc')} AS sos, ${LA_CASE_MT('sc')} AS mt,
            COALESCE(sc.mo_ta_luc, (SELECT MIN(m.occurred_on) FROM case_milestones m WHERE m.case_id = sc.id AND m.kind = 'xac_nhan_case')) AS mo_ta,
            EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') AS co_mo_ta,
            (SELECT MAX(iv.confirmed_at) FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.preset = 1 AND iv.kind != 'bo_tro') AS xnpa,
            (SELECT MIN(iv.created_at) FROM case_interventions iv WHERE iv.case_id = sc.id) AS pa_dau,
            EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.preset = 1) AS co_qc,
            l.id AS lop, l.code AS ma, l.is_fast_track AS ft
       FROM sos_cases sc JOIN students s ON s.id = sc.student_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       JOIN classes l ON l.id = COALESCE(a.class_id, ${lopEm('sc.student_id', 'NULL')})   -- lớp của lượt trước, như COT_CASE của Công việc
      WHERE s.branch_id = ? AND l.branch_id = ? AND sc.owner_user_id IS NOT NULL
        AND (sc.han_xac_nhan BETWEEN ? AND ? OR sc.han_them_pa BETWEEN ? AND ? OR COALESCE(sc.detected_at, substr(sc.created_at, 1, 10)) BETWEEN date(?, '-7 day') AND ?)`,
  ).all(c.cn, c.cn, c.tu, c.cuoi, c.tu, c.cuoi, c.tu, c.cuoi) as any[]) {
    /* `caseSos` + mức SOS: dòng gộp như Công việc (Case SOS FT giữ từng dòng / gộp theo mức SOS). */
    const ca = { href: duongHoSoHocVien(r.hv, { caseId: r.id }), caseSos: !!r.sos, sos: r.sos_level ?? null };
    if (r.sos) {
      them({ ...lopCua(r), owner: r.owner, han: r.han_xac_nhan, xong: r.mo_ta ? String(r.mo_ta).slice(0, 10) : null, daXong: !!r.co_mo_ta },
        { ...ca, key: `${r.mt ? 'ghi_nhan_xet' : 'cause'}:${r.id}`, group: r.mt ? 'ghi_nhan_xet' : 'cause', tieuDe: r.mt ? 'Mô tả Case' : 'Xác nhận Case' });
      them({ ...lopCua(r), owner: r.owner, han: r.han_xac_nhan, xong: ngayTheoGioVN(r.xnpa) }, { ...ca, key: `xnpa-case:${r.id}`, group: 'xac_nhan_pa', tieuDe: 'Xác nhận PA' });
    }
    /* Case có PA quy chế không từng là việc "Thêm PA" (PA có sẵn từ lúc mở). */
    if (!r.co_qc) them({ ...lopCua(r), owner: r.owner, han: hanThemPa(r), xong: ngayTheoGioVN(r.pa_dau) }, { ...ca, key: `support:${r.id}`, group: 'no_plan', tieuDe: 'Thêm PA học thuật' });
  }

  /* 2. Ghi Mini Test — người giữ như Công việc (`nguoiGiuMiniTest`: GVCN lớp đang học, không có thì chủ Case). */
  const mini = conn.prepare(
    `SELECT m.id, m.student_id AS hv, s.full_name AS ten, m.han, m.ghi_luc, m.nhom_bo_tro, l.id AS lop, l.code AS ma, l.is_fast_track AS ft,
            (SELECT MIN(sc.owner_user_id) FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = m.nhom_bo_tro) AS chu
       FROM mini_test m JOIN students s ON s.id = m.student_id LEFT JOIN classes l ON l.id = ${lopEm('m.student_id', 'NULL')}
      WHERE s.branch_id = ? AND m.ty_le IS NOT NULL AND m.ghi_luc IS NOT NULL AND m.han BETWEEN ? AND ?`,
  ).all(c.cn, c.tu, c.cuoi) as any[];
  const giu = nguoiGiuMiniTest(mini.map((m) => ({ id: m.id, nhom: m.nhom_bo_tro, lop: m.lop ?? null, owner: m.chu ?? null })));
  for (const m of mini) them({ ...lopCua(m), owner: giu.get(m.id) ?? null, han: m.han, xong: ngayTheoGioVN(m.ghi_luc) },
    { key: `minitest:${m.id}`, group: 'mini_test', tieuDe: 'Ghi Mini Test', href: duongHoSoHocVien(m.hv) });

  /* 3. Báo PH (TVV của em) — lần "đã báo" đầu. */
  for (const r of conn.prepare(
    `SELECT v.id, v.student_id AS hv, s.full_name AS ten, s.consultant_user_id AS owner, v.han, v.han_chon, l.id AS lop, l.code AS ma, l.is_fast_track AS ft,
            (SELECT MIN(x.ngay) FROM viec_bao_ph_lan x WHERE x.viec_id = v.id AND x.ket_qua = 'da_bao') AS xong
       FROM viec_bao_ph v JOIN students s ON s.id = v.student_id LEFT JOIN classes l ON l.id = ${lopEm('v.student_id', 'NULL')}
      WHERE s.branch_id = ? AND v.trang_thai = 'xong' AND COALESCE(v.han_chon, v.han) BETWEEN ? AND ?`,
  ).all(c.cn, c.tu, c.cuoi) as any[]) {
    them({ ...lopCua(r), owner: r.owner, han: hanBaoPhHieuLuc(r.han, [], r.han_chon), xong: r.xong ? String(r.xong).slice(0, 10) : null },
      { key: `bao-ph:${r.id}`, group: 'bao_ph_yt', tieuDe: 'Báo PH', href: duongHoSoHocVien(r.hv, { tab: 'y-thuc' }) });
  }

  /* 4. Chọn bước tiếp (TVV của em) — hạn tính lại như lúc chờ (`buoc_tiep` = NULL). */
  for (const r of conn.prepare(
    `SELECT c.id, c.student_id AS hv, s.full_name AS ten, s.consultant_user_id AS owner, ${COT_SAU_THI}, ${NGAY_CO_KQ} AS ngay_kq_dau, c.buoc_tiep_luc,
            l.id AS lop, l.code AS ma, l.is_fast_track AS ft
       FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
       LEFT JOIN classes l ON l.id = ${lopEm('c.student_id', 'NULL')}
      WHERE s.branch_id = ? AND c.buoc_tiep IS NOT NULL AND c.buoc_tiep_luc >= date(?, '-60 day')`,
  ).all(c.cn, c.tu) as any[]) {
    const han = trangThaiSauThi({ ...r, buoc_tiep: null, ngay_kq: r.ngay_kq_dau }, c.homNay).han;
    them({ ...lopCua(r), owner: r.owner, han, xong: r.buoc_tiep_luc ? String(r.buoc_tiep_luc).slice(0, 10) : null },
      { key: `buoc_tiep:${r.id}`, group: 'buoc_tiep', tieuDe: 'Chọn bước tiếp', href: duongHoSoHocVien(r.hv, { buocTiep: r.id }) });
  }

  /* 5. Bàn giao — GVCN (lệnh) · GVBM (lệnh × môn) · đổi GV; lớp nguồn, người giữ theo phân công lúc hạn (như `viecBanGiao`).
   *    Câu Writing chung cũ (`mon = 'writing'`, trước tách W1 / W2) do GV tự ghi → tính cho người ghi, không cho GV W phân công sau cùng (chủ SP 07/11). */
  for (const r of conn.prepare(
    `SELECT 'gvcn' AS loai, k.id AS id, k.han_gvcn AS han, k.xac_nhan_luc AS xong, ${gvLop('k.lop_nguon_id', 'k.han_gvcn', null)} AS owner, l.id AS lop, l.code AS ma, l.is_fast_track AS ft
       FROM lenh_chuyen_lop k JOIN classes l ON l.id = k.lop_nguon_id
      WHERE l.branch_id = ? AND k.xac_nhan_luc IS NOT NULL AND k.han_gvcn BETWEEN ? AND ?
     UNION ALL
     SELECT 'gvbm', b.id, k.han_gvbm, b.ghi_luc, CASE WHEN b.mon = 'writing' AND b.dien_thay = 0 THEN b.nguoi_ghi ELSE ${gvLop('k.lop_nguon_id', 'k.han_gvbm', 'b.mon')} END, l.id, l.code, l.is_fast_track
       FROM ban_giao_mon b JOIN lenh_chuyen_lop k ON k.id = b.lenh_id JOIN classes l ON l.id = k.lop_nguon_id
      WHERE l.branch_id = ? AND b.lam_lai = 0 AND k.han_gvbm BETWEEN ? AND ?
     UNION ALL
     SELECT 'gv', g.id, g.han, g.xong_luc, g.nguoi_lam, l.id, l.code, l.is_fast_track
       FROM ban_giao_gv g JOIN classes l ON l.id = g.class_id
      WHERE l.branch_id = ? AND g.trang_thai = 'xong' AND g.han BETWEEN ? AND ?`,
  ).all(c.cn, c.tu, c.cuoi, c.cn, c.tu, c.cuoi, c.cn, c.tu, c.cuoi) as any[]) {
    them({ ...lopCua(r), hv: null, ten: null, owner: r.owner, han: r.han, xong: ngayTheoGioVN(r.xong) },
      { key: `ban-giao-xong:${r.loai}:${r.id}`, group: 'ban_giao', tieuDe: 'Bàn giao', href: `/hoc-vien/lop/${r.lop}` });
  }

  /* 6. Xử lý vi phạm bắt buộc (GVCN lớp lúc ghi, theo phân công lúc hạn) — một lần phản hồi (em × ngày phản hồi) một việc, hạn sớm nhất. */
  for (const r of conn.prepare(
    `SELECT v.student_id AS hv, s.full_name AS ten, v.phan_hoi_ngay AS xong, MIN(v.han_xu_ly) AS han, ${gvLop('v.class_id', 'v.phan_hoi_ngay', null)} AS owner,
            l.id AS lop, l.code AS ma, l.is_fast_track AS ft
       FROM violations v JOIN students s ON s.id = v.student_id JOIN classes l ON l.id = v.class_id
      WHERE l.branch_id = ? AND v.phan_hoi_ngay IS NOT NULL AND v.han_xu_ly BETWEEN ? AND ?
      GROUP BY v.student_id, v.phan_hoi_ngay, v.class_id`,
  ).all(c.cn, c.tu, c.cuoi) as any[]) {
    them({ ...lopCua(r), owner: r.owner, han: r.han, xong: String(r.xong).slice(0, 10) },
      { key: `yt-xong:${r.hv}:${r.xong}`, group: 'yt_xu_ly', tieuDe: 'Xử lý vi phạm', href: duongHoSoHocVien(r.hv, { tab: 'y-thuc' }) });
  }

  /* 7. Phối hợp SOS — chỉ meeting CX có hạn (`hanPhoiHop`); GVCN lớp em đang học. */
  for (const r of conn.prepare(
    `SELECT x.id, x.kind, x.created_at, x.han_chon, x.performed_on AS xong, l.id AS lop, l.code AS ma, l.is_fast_track AS ft,
            ${gvLop('l.id', 'x.performed_on', null)} AS owner
       FROM sos_coordination_actions x JOIN students s ON s.id = x.student_id LEFT JOIN assessment_attempts a ON a.id = x.attempt_id
       JOIN classes l ON l.id = ${lopEm('x.student_id', 'a.class_id')}
      WHERE s.branch_id = ? AND x.status = 'done' AND x.performed_on IS NOT NULL AND x.kind IN ('cx_meeting_student', 'cx_meeting_family')
        AND COALESCE(x.han_chon, substr(x.created_at, 1, 10)) BETWEEN date(?, '-10 day') AND ?`,
  ).all(c.cn, c.tu, c.cuoi) as any[]) {
    if (!laMeetingCx(r.kind)) continue;
    them({ ...lopCua(r), hv: null, ten: null, owner: r.owner, han: hanPhoiHop(r.kind, r.created_at, r.han_chon), xong: String(r.xong).slice(0, 10) },
      { key: `phoi-hop-xong:${r.id}`, group: 'phoi_hop_sos', tieuDe: 'Phối hợp SOS', href: `/hoc-vien/lop/${r.lop}?tab=y-thuc&sub=phoi-hop` });
  }
  return out;
}
