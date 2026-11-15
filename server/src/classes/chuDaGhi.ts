import { DS_JSON, db } from '../db.ts';
import { type Principal } from '../permissions.ts';
import { badRequest, forbidden, isIsoDate } from '../util.ts';
import { chonDot, docLop, napChung, quyenBc } from './baoCaoPh.ts';
import { addDaysIso, dotTruoc, nhanDot, type ChuDaGhi, type ChuDaGhiEm, type DuLieuChuDaGhi } from '../../../shared/domain/index.ts';

/** Khoảng đọc tối đa — một đợt tháng / Progress + bàn giao cả khoá ngắn; chặn đọc cả lịch sử. */
const TOI_DA_NGAY = 120;

/**
 * Khoảng của "Bạn đã ghi" theo đợt Báo cáo PH (GD-20a): FT "tháng này" = từ ngày 1 tháng của đợt tới hạn đợt; lớp thường / đợt thêm "đợt này" = từ ngày mở
 * đợt trước (không có: hạn − 120 ngày) tới hạn đợt. Luôn ≤ 120 ngày.
 */
function khoangDot(p: Principal, classId: number, dotMa: string): { tu: string; den: string } {
  const { ds, homNay } = napChung(p, classId);
  const d = chonDot(ds, dotMa, homNay);
  const tu = d.loai === 'thang' ? `${d.mo.slice(0, 8)}01` : dotTruoc(d, ds)?.mo ?? addDaysIso(d.han, -TOI_DA_NGAY);
  return { tu: [tu, addDaysIso(d.han, -TOI_DA_NGAY)].sort().at(-1)!, den: d.han };
}

/**
 * LG-13 (H1, H2 — overhaul V6 đợt 4): "Bạn đã ghi" của CẢ LỚP (kiểu `ChuDaGhi` ở `shared/domain/chuDaGhi.ts`) — gợi ý cho ô chữ Báo cáo PH / bàn giao (web chỉ gọi khi mở panel viết, MỘT lần cho lớp).
 * Khoảng: `?dot=` (đợt Báo cáo PH, `khoangDot`) hoặc `?tu=&den=` (bàn giao: 30 ngày gần nhất) — trả lại `khoang` đã dùng.
 * Theo em × kỹ năng: nhận xét bài Test theo ngày nghiệp vụ có điểm (`nhap_dau_ngay`; Speaking chấm chéo: nhận xét của GV phụ trách trước) · kết quả PA (Tiến triển) · mô tả Case đang mở (không theo khoảng).
 * Phần Chung: vi phạm + xử lý đã thực hiện + Tình hình học tập. Chỉ em đang học trong lớp; em / kỹ năng không có gì → không có khoá. Mới nhất trước.
 * Quyền = xem Báo cáo PH của lớp (`quyenBc().xem`: QL · QT · Admin · TVV chi nhánh lớp + GV có phân công lớp).
 * Turso: 4 câu (em · nhận xét · Case + kết quả PA · vi phạm + xử lý + tình hình), mỗi câu theo danh sách em của lớp (chỉ mục theo em).
 */
export function chuDaGhiLop(p: Principal, classId: number, q: { tu?: unknown; den?: unknown; dot?: unknown }): DuLieuChuDaGhi {
  const c = docLop(classId);
  if (!quyenBc(p, c).xem) throw forbidden('Lớp này nằm ngoài phạm vi bạn được xem.');
  const { tu, den } = typeof q.dot === 'string' && q.dot ? khoangDot(p, classId, q.dot) : { tu: q.tu, den: q.den };
  if (!isIsoDate(tu) || !isIsoDate(den) || tu > den || den > addDaysIso(tu, TOI_DA_NGAY)) throw badRequest('Khoảng ngày không hợp lệ.');
  const khoang = { tu, den };
  const conn = db();
  const ids = (conn.prepare(`SELECT DISTINCT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id`).all(classId) as any[]).map((r) => r.student_id as number);
  if (!ids.length) return { khoang, em: [] };
  const json = JSON.stringify(ids);
  const theoEm = new Map<number, ChuDaGhiEm>();
  const em = (id: number) => theoEm.get(id) ?? (theoEm.set(id, { id, kyNang: {}, chung: [] }).get(id)!);
  const them = (id: number, kn: string | null, x: ChuDaGhi) => {
    if (!x.chu) return;
    if (!kn) { em(id).chung.push(x); return; }
    (em(id).kyNang[kn] ??= []).push(x);
  };
  const gon = (s: unknown) => String(s ?? '').trim();
  const nguoi = (r: any) => ({ nguoiId: r.nguoi_id ?? null, nguoi: r.nguoi ?? null });
  const so = (x: number) => String(Number(x));
  /* Người ghi nhận xét: GV phụ trách S (nhận xét riêng) trước, rồi người chấm, rồi người nhập. */
  const NGUOI_NX = `CASE WHEN NULLIF(TRIM(s.nhan_xet_phu_trach), '') IS NOT NULL THEN s.nhan_xet_phu_trach_by ELSE COALESCE(s.examiner_user_id, s.entered_by) END`;

  for (const r of conn.prepare(
    `SELECT a.student_id AS student_id, s.skill AS skill, a.kind AS kind, a.attempt_no AS attempt_no, rp.week_start AS tuan, s.band AS band, s.raw_score AS raw, s.raw_total AS tong,
            COALESCE(NULLIF(TRIM(s.nhan_xet_phu_trach), ''), s.comment) AS chu, s.nhap_dau_ngay AS ngay, ${NGUOI_NX} AS nguoi_id, u.full_name AS nguoi
       FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id
       LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
       LEFT JOIN users u ON u.id = ${NGUOI_NX}
      WHERE a.student_id IN (${DS_JSON}) AND a.status != 'cancelled'
        AND COALESCE(NULLIF(TRIM(s.nhan_xet_phu_trach), ''), NULLIF(TRIM(s.comment), '')) IS NOT NULL
        AND s.nhap_dau_ngay BETWEEN ? AND ?
      ORDER BY ngay DESC, s.id DESC`,
  ).all(json, tu, den) as any[]) {
    them(r.student_id, r.skill, { loai: 'nx-mt', ngay: r.ngay, chu: gon(r.chu), tuan: r.tuan ?? null, luot: nhanDot(r.kind, r.attempt_no ?? null),
      diem: r.band != null ? so(r.band) : r.raw != null && r.tong ? `${so(r.raw)}/${so(r.tong)}` : null, ...nguoi(r) });
  }

  /* Mô tả Case đang mở (bàn giao cần dù viết từ trước khoảng) + Tiến triển của lần ghi kết quả PA trong khoảng — một câu. */
  for (const r of conn.prepare(
    `SELECT sc.student_id AS student_id, sc.topic AS topic, 'case' AS loai, substr(COALESCE(sc.detected_at, sc.created_at), 1, 10) AS ngay, sc.summary AS chu, sc.id AS k,
            NULL AS pa_kind, NULL AS pa_mo_ta, NULL AS tien_trien, sc.reported_by AS nguoi_id, u.full_name AS nguoi
       FROM sos_cases sc LEFT JOIN users u ON u.id = sc.reported_by
      WHERE sc.student_id IN (${DS_JSON}) AND sc.status != 'done' AND sc.tam = 0 AND NULLIF(TRIM(sc.summary), '') IS NOT NULL
     UNION ALL
     SELECT sc.student_id, sc.topic, 'kq-pa', f.observed_on, f.note, f.id, iv.kind, iv.description, f.outcome, f.observer_user_id, u.full_name
       FROM sos_cases sc JOIN case_followups f ON f.case_id = sc.id LEFT JOIN case_interventions iv ON iv.id = f.intervention_id LEFT JOIN users u ON u.id = f.observer_user_id
      WHERE sc.student_id IN (${DS_JSON}) AND NULLIF(TRIM(f.note), '') IS NOT NULL AND f.observed_on BETWEEN ? AND ?
     ORDER BY ngay DESC, k DESC`,
  ).all(json, json, tu, den) as any[]) {
    them(r.student_id, r.topic === 'tong_hop' ? null : r.topic, { loai: r.loai, ngay: r.ngay, chu: gon(r.chu),
      ...(r.loai === 'kq-pa' ? { pa: r.pa_kind ? { kind: r.pa_kind, moTa: gon(r.pa_mo_ta) || null } : null, tienTrien: r.tien_trien ?? null } : {}), ...nguoi(r) });
  }

  /* Phần Chung: vi phạm (kể cả "Chỉ nhắc nhở") + lần xử lý đã thực hiện + Tình hình học tập (GV báo TVV, GVCN trả lời TVV; bỏ bản đã rút) — một câu. */
  const TH_NGAY = `substr(CASE WHEN th.chieu = 'gv_tvv' THEN th.tao_luc ELSE th.tra_loi_luc END, 1, 10)`;
  const TH_NGUOI = `CASE WHEN th.chieu = 'gv_tvv' THEN th.nguoi_gui ELSE th.tra_loi_boi END`;
  for (const r of conn.prepare(
    `SELECT v.student_id AS student_id, 'vi-pham' AS loai, v.occurred_on AS ngay, v.ten AS ten, v.description AS chu, NULL AS kind, v.id AS k, v.reported_by AS nguoi_id, u.full_name AS nguoi
       FROM violations v LEFT JOIN users u ON u.id = v.reported_by
      WHERE v.student_id IN (${DS_JSON}) AND v.occurred_on BETWEEN ? AND ?
     UNION ALL
     SELECT m.student_id, 'xu-ly', m.performed_on, m.custom_name, m.note, m.kind, m.id, COALESCE(m.performed_by, m.confirmed_by), u.full_name
       FROM discipline_measures m LEFT JOIN users u ON u.id = COALESCE(m.performed_by, m.confirmed_by)
      WHERE m.student_id IN (${DS_JSON}) AND m.status = 'done' AND m.performed_on BETWEEN ? AND ?
     UNION ALL
     SELECT th.student_id, 'tinh-hinh', ${TH_NGAY}, NULL, CASE WHEN th.chieu = 'gv_tvv' THEN th.noi_dung ELSE th.tra_loi END, th.chieu, th.id, ${TH_NGUOI}, u.full_name
       FROM tinh_hinh_hoc_tap th LEFT JOIN users u ON u.id = ${TH_NGUOI}
      WHERE th.student_id IN (${DS_JSON}) AND th.trang_thai != 'rut' AND ${TH_NGAY} BETWEEN ? AND ?
     ORDER BY ngay DESC, k DESC`,
  ).all(json, tu, den, json, tu, den, json, tu, den) as any[]) {
    const x = { ngay: r.ngay, ...nguoi(r) };
    if (r.loai === 'vi-pham') them(r.student_id, null, { loai: 'vi-pham', ...x, chu: [gon(r.ten), gon(r.chu)].filter(Boolean).join(' — ') });
    else if (r.loai === 'xu-ly') them(r.student_id, null, { loai: 'xu-ly', ...x, chu: gon(r.chu), xuLy: { kind: r.kind, ten: gon(r.ten) || null } });
    else them(r.student_id, null, { loai: 'tinh-hinh', ...x, chu: gon(r.chu) });
  }
  return { khoang, em: [...theoEm.values()].sort((a, b) => a.id - b.id) };
}
