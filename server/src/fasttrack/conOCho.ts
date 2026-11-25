import { DS_JSON, THAM_SO_TOI_DA, db, theoLo } from '../db.ts';
import { writeAuditLo } from '../platform/audit.ts';
import { O_FT_XONG_SQL } from '../../../shared/domain/index.ts';
import { ghiSoLuot, ghiSoTheoLop } from '../phanTich/soNghiaVu.ts';

/**
 * TD7b — CỜ "CÒN Ô CHỜ ĐIỂM" của lượt: `assessment_attempts.o_cho_tu`.
 *
 * = `week_start` SỚM NHẤT trong các ô đang chờ điểm của lượt; NULL = lượt không còn ô nào chờ. Ô chờ = ô của bộ kỹ năng chưa có điểm
 * (chương trình chấm tỷ lệ — lớp của lượt, lượt không lớp theo lộ trình (`maCtCuaLuot`): môn của chương trình, có điểm = `raw_score`; còn lại — FT, MT0: L R W1 W2 S, có điểm = `band`
 * — `O_FT_XONG_SQL`; LUAT-NX-MT: thiếu nhận xét chỉ nhắc, không giữ ô chờ;
 * dấu "-" vẫn là chưa có điểm, vì dời "-" phải còn hiện) VÀ có thể đang chờ: dòng lịch của môn `required = 1`, không huỷ / vắng, có tuần;
 * thiếu dòng lịch của môn → dự phòng của `skillScheduleOf` (bắt buộc, tuần của lượt).
 *
 * Câu đọc hỏi "lượt có ô chờ mà tuần thi đã tới" bằng `a.o_cho_tu <= hôm nay` (`CON_O_SQL`) — chỉ mục một phần `idx_attempt_o_cho` —
 * thay cho hai câu con tương quan trên điểm + lịch của MỌI lượt. Cờ KHÔNG chứa hôm nay, trạng thái lượt (`cancelled`), lớp active,
 * học viên — những điều kiện đó vẫn nằm ở câu đọc.
 *
 * Cờ là tập cha an toàn của ô nợ / ô cần chấm: lệch về phía "còn" chỉ tốn dòng đọc, lệch về phía "hết" là MẤT việc nhập điểm. Vì vậy
 * `DEFAULT ''` (= luôn được đọc, chưa tính) và MỌI đường ghi điểm / lịch / lớp gọi `capNhatConOCho*` ở cuối giao dịch của nó.
 */

/* P8 (N13): `o` = ô nhập (FT) — task Writing không học (`bo_task`) không chờ điểm. */
const TUAN_O = (mon: string, o?: string) => `COALESCE(
    (SELECT MIN(kp.week_start) FROM attempt_skills k JOIN report_periods kp ON kp.id = k.planned_period_id
      WHERE k.attempt_id = a.id AND k.skill = ${mon} AND k.required = 1 AND k.sit_status NOT IN ('cancelled', 'absent')${o ? ` AND k.bo_task IS NOT ${o}` : ''}),
    CASE WHEN NOT EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.skill = ${mon})
         THEN (SELECT pr.week_start FROM report_periods pr WHERE pr.id = a.planned_period_id) END)`;

/** LUOT-KHONG-LOP-2: chương trình CHẤM của lượt — cùng luật `maCtCuaLuot` (lớp của lượt; lượt không lớp theo chương trình lộ trình). */
const MA_CT_LUOT = `(CASE WHEN a.class_id IS NOT NULL THEN (SELECT c.programme_code FROM classes c WHERE c.id = a.class_id)
  ELSE (SELECT cy.programme_code FROM learning_cycles cy WHERE cy.id = a.cycle_id) END)`;

/**
 * TURSO-LOG-1311 (chủ SP 13/11 "Không tính nữa"): MT LỊCH SỬ (nhập bù) ở chương trình chấm band — cùng vế loại của `CON_O_SQL` (chỉ lịch sử ở chương trình tỷ lệ
 * khác FT còn tính) — KHÔNG còn ô chờ: ô của chúng là `lich_su`, không bao giờ chờ chấm. Trước cờ vẫn ghi ô trống → câu đọc đi qua chỉ mục cờ rồi mới loại
 * (bản chép 07/11: 646 / 1 206 lượt mang cờ). Chương trình không rõ (NULL) loại như `CON_O_SQL`. Cờ nay phụ thuộc `lich_su`: mọi chỗ đổi `lich_su` tính lại cờ;
 * DB cũ: bước TD7b của migrate (`prTd7b.ts`) thấy cờ lệch → tính lại mọi lượt (bản chép 07/11: 648 lượt).
 */
const LICH_SU_KHONG_CHO = `a.lich_su = 1 AND COALESCE(${MA_CT_LUOT} IN (SELECT pg.code FROM programmes pg WHERE pg.scoring_mode = 'ratio' AND pg.code != 'FT'), 0) = 0`;

/** SUA-N71 (P2-6): lượt đã giữ bộ môn cũ (`bo_mon` — MON-CT-1311, như `docBoMonLuot`) chờ điểm theo BỘ ĐÓ, không theo `programme_skills` hiện tại: bỏ môn khỏi
 *  chương trình không làm mất ô chưa chấm của môn cũ. */
const CO_BO_MON = `(CASE WHEN json_valid(a.bo_mon) THEN json_type(a.bo_mon) = 'array' AND json_array_length(a.bo_mon) > 0 ELSE 0 END)`;

/** Biểu thức tính cờ cho dòng `a` của `assessment_attempts` (dùng trong UPDATE … AS a / SELECT … AS a). */
export const O_CHO_TU_SQL = `(CASE
  WHEN ${LICH_SU_KHONG_CHO} THEN NULL
  WHEN a.kind != 'mt0' AND (SELECT pg.scoring_mode FROM programmes pg WHERE pg.code = ${MA_CT_LUOT}) = 'ratio'
  THEN (SELECT MIN(${TUAN_O('ps.skill')}) FROM (
          SELECT j.value AS skill FROM json_each(CASE WHEN ${CO_BO_MON} THEN a.bo_mon ELSE '[]' END) j
          UNION ALL SELECT p2.skill FROM programme_skills p2 WHERE p2.programme_code = ${MA_CT_LUOT} AND NOT ${CO_BO_MON}) ps
         WHERE NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = ps.skill AND sc.raw_score IS NOT NULL))
  ELSE (SELECT MIN(${TUAN_O('e.kn', 'e.o')}) FROM (
          SELECT 'listening' AS o, 'listening' AS kn UNION ALL SELECT 'reading', 'reading' UNION ALL SELECT 'writing1', 'writing'
          UNION ALL SELECT 'writing2', 'writing' UNION ALL SELECT 'speaking', 'speaking') e
         WHERE NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = e.o AND ${O_FT_XONG_SQL('sc', 'a')}))
  END)`;

/** MỘT chỗ ghi cờ. `dieuKien` chọn lượt (alias `a`); chỉ ghi dòng thật sự đổi — không viết lại dòng đã đúng. */
function capNhat(conn: any, dieuKien: string, args: readonly unknown[]): void {
  conn.prepare(`UPDATE assessment_attempts AS a SET o_cho_tu = ${O_CHO_TU_SQL} WHERE ${dieuKien} AND a.o_cho_tu IS NOT ${O_CHO_TU_SQL}`).run(...args);
}

/**
 * Rà 25/11 (việc 2, N71 · Rulebook "việc theo người dạy lúc thi"): chuyển lớp GIỮ khoá (`luatLoTrinh` — FT → FT, lớp thường cùng mã) để lượt còn ô chờ từ tuần
 * thi TRƯỚC tuần chuyển ở lại lớp lúc thi. Lượt VỀ lớp em đang học CHỈ khi cờ mới (đã tính) còn ô chờ VÀ ô chờ sớm nhất từ tuần vào lớp hiện tại trở đi —
 * tức còn ô thi ở lớp mới, hết ô của lớp cũ. Cờ NULL (bài xong hẳn / ô cũ vắng, huỷ hết) hay MT lịch sử → giữ lớp lúc thi (PTA rà #2190 P1).
 * Mỗi lần đổi ghi nhật ký `attempt.doi_lop_tu_dong`. Một câu đọc mỗi lô (đổi thật: thêm câu ghi + nhật ký).
 * ponytail: chừng nào ô cũ còn chờ, ô tuần sau vẫn theo lớp cũ (lượt chỉ có một lớp); cần đúng từng ô ngay cả lúc đó thì phải ghi lớp theo ô.
 */
function veLopDangHoc(conn: any, ids: readonly number[]): void {
  const ve = conn.prepare(`SELECT a.id, a.class_id AS cu, e.class_id AS moi FROM assessment_attempts a
      JOIN enrollments e ON e.student_id = a.student_id AND e.status = 'active' AND e.class_id IS NOT a.class_id
     WHERE a.id IN (${DS_JSON}) AND a.status = 'planned' AND a.kind != 'mt0' AND a.lich_su = 0
       AND a.o_cho_tu IS NOT NULL AND a.o_cho_tu != '' AND a.o_cho_tu >= date(substr(e.started_at, 1, 10), '-6 days', 'weekday 1')
       AND EXISTS (SELECT 1 FROM learning_cycles cy WHERE cy.id = a.cycle_id AND cy.status = 'active')
       AND EXISTS (SELECT 1 FROM enrollments eo WHERE eo.student_id = a.student_id AND eo.class_id = a.class_id AND eo.status = 'transferred')
     ORDER BY a.id, e.id DESC`).all(JSON.stringify(ids)) as { id: number; cu: number; moi: number }[];
  const mot = [...new Map(ve.map((r) => [r.id, r])).values()];
  if (!mot.length) return;
  conn.prepare(`UPDATE assessment_attempts SET class_id = json_extract(j.value, '$[1]') FROM json_each(?) j WHERE assessment_attempts.id = json_extract(j.value, '$[0]')`)
    .run(JSON.stringify(mot.map((r) => [r.id, r.moi])));
  writeAuditLo(mot.map((r) => ({ actorUserId: null, action: 'attempt.doi_lop_tu_dong', entityType: 'assessment_attempt', entityId: r.id,
    before: { classId: r.cu }, after: { classId: r.moi, lyDo: 'Ô thi trước tuần chuyển lớp đã xong — ô từ tuần chuyển về lớp em đang học (N71)' } })));
}

/** Tính lại cờ của các lượt này. Gọi ở CUỐI giao dịch ghi điểm / lịch của lượt (trong `tx` của nơi gọi). */
export function capNhatConOCho(attemptIds: readonly (number | null | undefined)[]): void {
  const ids = [...new Set(attemptIds.filter((x): x is number => typeof x === 'number'))];
  theoLo(ids, (lo, ph) => capNhat(db(), `a.id IN (${ph})`, lo), THAM_SO_TOI_DA);
  if (ids.length) veLopDangHoc(db(), ids);
  /* SỔ NGHĨA VỤ: mọi đường ghi điểm / lịch / lượt đã bắt buộc gọi hàm này ở cuối giao dịch — ghi sổ cùng chỗ (spec 2.2). */
  ghiSoLuot(ids);
}

/** Mọi lượt của các lớp này — đổi mốc Progress / Final của lớp dời bài cả lớp. */
export function capNhatConOChoLop(classIds: readonly number[]): void {
  theoLo([...new Set(classIds)], (lo, ph) => capNhat(db(), `a.class_id IN (${ph})`, lo), THAM_SO_TOI_DA);
  for (const l of new Set(classIds)) ghiSoTheoLop(l);   // SỔ NGHĨA VỤ (một lô trước COMMIT)
}

/** Lượt mỗi lô khi tính lại cả bảng — mỗi câu UPDATE chạm ≤ chừng này lượt (Turso cắt câu quá nặng). */
const LUOT_MOI_LO = 2000;

/** Migrate / sửa chữa: tính lại cờ của MỌI lượt, chia lô theo id. `conn` = kết nối của nơi gọi (migrate truyền vào). */
export function capNhatConOChoTatCa(conn: any = db()): void {
  const max = (conn.prepare('SELECT COALESCE(MAX(id), 0) AS m FROM assessment_attempts').get() as any).m as number;
  for (let tu = 0; tu < max; tu += LUOT_MOI_LO) capNhat(conn, 'a.id > ? AND a.id <= ?', [tu, tu + LUOT_MOI_LO]);
}

/** Số lượt mà cờ đang lưu KHÁC giá trị tính lại (phải 0 sau mọi đường ghi) — migrate + phép kiểm. */
export function demLuotLechCo(conn: any = db()): number {
  return (conn.prepare(`SELECT COUNT(*) AS n FROM assessment_attempts a WHERE a.o_cho_tu IS NOT ${O_CHO_TU_SQL}`).get() as any).n as number;
}

/**
 * Lượt cờ lệch về phía "HẾT" — lưu NULL hoặc tuần muộn hơn thật, trong khi thật sự còn ô chờ: câu đọc bỏ sót lượt = MẤT việc nhập điểm. Lệch về phía "còn"
 * (lưu sớm hơn / ô đã hết) chỉ tốn dòng đọc; '' (chưa tính — lượt ghi thẳng SQL, dữ liệu mẫu) luôn được đọc nên cũng an toàn. Phải rỗng ở mọi lúc.
 */
export function luotLechNguyHiem(): number[] {
  return (db().prepare(`SELECT a.id FROM assessment_attempts a WHERE ${O_CHO_TU_SQL} IS NOT NULL AND (a.o_cho_tu IS NULL OR a.o_cho_tu > ${O_CHO_TU_SQL}) ORDER BY a.id`).all() as any[]).map((r) => r.id);
}

/**
 * `CON_O_SQL` TRƯỚC TD7b — hai câu con tương quan trên điểm + lịch (alias a = lượt, c = lớp LEFT JOIN, pr = tuần của lượt LEFT JOIN; bốn `?` = hôm nay).
 * KHÔNG dùng ở đường chạy: chỉ để phép kiểm TD7b chứng minh cờ mới ≡ cách tính cũ (100 %).
 */
const oChoDiemCu = (mon: string) => `(EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods kp ON kp.id = k.planned_period_id
      WHERE k.attempt_id = a.id AND k.skill = ${mon} AND k.required = 1 AND k.sit_status NOT IN ('cancelled', 'absent') AND kp.week_start <= ?)
    OR (NOT EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.skill = ${mon}) AND pr.week_start <= ?))`;
export const CON_O_SQL_TRUOC_TD7B = `a.status != 'cancelled' AND (CASE WHEN a.kind != 'mt0' AND (SELECT pg.scoring_mode FROM programmes pg WHERE pg.code = c.programme_code) = 'ratio'
  THEN EXISTS (SELECT 1 FROM programme_skills ps WHERE ps.programme_code = c.programme_code
    AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = ps.skill AND sc.raw_score IS NOT NULL)
    AND ${oChoDiemCu('ps.skill')})
  ELSE EXISTS (SELECT 1 FROM (SELECT 'listening' AS o, 'listening' AS kn UNION ALL SELECT 'reading' AS o, 'reading' AS kn
      UNION ALL SELECT 'writing1' AS o, 'writing' AS kn UNION ALL SELECT 'writing2' AS o, 'writing' AS kn
      UNION ALL SELECT 'speaking' AS o, 'speaking' AS kn) e
    WHERE NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id AND sc.skill = e.o AND ${O_FT_XONG_SQL('sc', 'a')})   -- cùng luật "xong" (O_FT_XONG_SQL)
      AND ${oChoDiemCu('e.kn')})
  END)`;
