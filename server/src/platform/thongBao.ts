import { db } from '../db.ts';
import { tenMon } from '../../../shared/domain/index.ts';
import { CO_THE_KHONG_THEO_DOI, LA_CASE_SOS, xuLyCaseMany } from '../cases/sosState.ts';
import { demoToday } from '../demoConfig.ts';
import { trangThaiYThuc } from '../yThuc/trangThai.ts';
import { loi } from '../util.ts';

/** Chuông trả tối đa bấy nhiêu dòng: MỌI dòng chưa đọc trước, rồi dòng mới nhất (PR-VAI-a Q18). */
export const THONG_BAO_TOI_DA = 50;

/**
 * THÔNG BÁO CỦA MỘT NGƯỜI (R8, PR-Qb) — thêm `student_id`/`attempt_id` bằng LEFT JOIN đúng bảng của
 * từng `entity_type`, để `duongThongBao` (`shared/domain/duongHoSo.ts`) dựng đúng đường dẫn mà không
 * phải đoán theo chữ. Không đổi schema, không đổi cột cũ (`entity_type`, `entity_id`, `read_at`,
 * `title`, `body`) — Header vẫn đọc y hệt.
 *
 * `skill_move_requests` không tự có `student_id`: phải đi qua `assessment_attempts` của chính lượt
 * mà yêu cầu dời lịch đó thuộc về.
 *
 * PR-VAI-a (Q18, Q21): cùng MỘT câu thêm tên em, môn của Case, lớp em đang học và `con_viec` — Case còn chờ nguyên nhân / thẻ còn chờ
 * người duyệt (1) hay đã xong (0) — để chuông xếp Cần làm / Để biết (`nhomThongBao`) và viết dòng "bấm tới đâu" (`noiDenThongBao`).
 * PR-S6F-a: Case chờ nguyên nhân = CÙNG luật `awaitingCauseCaseIds` (Case từ SOS, không có thẻ "Không cần theo dõi" chờ QL); thẻ Báo QL
 * như thẻ chờ duyệt; thẻ bị từ chối còn việc khi chưa có thẻ cùng loại, cùng người, cùng em / lớp gửi SAU nó (đã sửa gửi lại → Để biết).
 */
/** Case của đối tượng một thẻ duyệt — `sos_case` là chính Case, `intervention` là Case của PA; thẻ khác (Ý thức, lịch…) NULL. */
const CASE_CUA_THE = (y: string) => `(CASE ${y}.doi_tuong_loai WHEN 'sos_case' THEN ${y}.doi_tuong_id
  WHEN 'intervention' THEN (SELECT ci.case_id FROM case_interventions ci WHERE ci.id = ${y}.doi_tuong_id) END)`;

/** DON-LUONG K42a: dòng "Cần làm" ĐÃ ĐỌC bị dòng mới đẩy khỏi 50 dòng đầu — lấy thêm tối đa bấy nhiêu, xếp sau (thứ tự 50 dòng đầu giữ). */
export const CAN_LAM_DA_DOC_THEM = 20;
/** Loại thông báo có nhánh `con_viec` = 1 trong `thongBaoCua` (giữ khớp nhánh CASE; `case_signal` lọc theo `entity_type`). */
/**
 * CHUONG-V2 (XM-3): thông báo tự động cũ (đồng bộ đã bỏ — chuông đọc việc từ `/my-work` ở web). Dòng cũ còn trong DB không đọc nữa (lọc trong SQL).
 * ponytail: dòng cũ để nguyên trong bảng (vài dòng / người, đi chỉ mục user_id); xoá hẳn bằng migrate nếu muốn bảng gọn.
 */
const KIND_TU_DONG_CU = ['cham_qua_han', 'case_chua_chot_pa', 'chot_lo_trinh', 'bao_ph_xu_ly', 'xuat_bc_ph_qua_han'] as const;
const KIND_CAN_LAM = ['case_giao', 'phoi_hop', 'sos', 'sos_new', 'dang_ky', 'schedule_move',
  'duyet_moi', 'duyet_qua_han', 'bao_len', 'duyet_tu_choi', 'yt_da_duyet'] as const;

export function thongBaoCua(userId: number) {
  /* Một mẫu câu cho cả hai lượt đọc (50 dòng đầu · dòng Cần làm đã đọc bị đẩy ra) — `con_viec` cùng một luật. */
  const cau = (trong: string, duoi: string) => `SELECT x.*, s.full_name AS ten_hv,
              (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
                WHERE e.student_id = x.student_id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS lop
         FROM (
           SELECT n.*,
                  COALESCE(sc.student_id, cs.student_id, aa.student_id, aa2.student_id, dm.student_id, ycd.hoc_vien_id,
                           CASE WHEN n.entity_type = 'student' THEN n.entity_id END,
                           CASE WHEN n.entity_type = 'viec_bao_ph' THEN (SELECT vb.student_id FROM viec_bao_ph vb WHERE vb.id = n.entity_id) END) AS student_id,
                  CASE WHEN n.entity_type = 'assessment_attempt' THEN n.entity_id ELSE smr.attempt_id END AS attempt_id,
                  COALESCE(sc.category, sc.topic) AS mon_goc, cy.programme_code AS ct, cs.case_id, ycd.han_duyet AS han_the,
                  CASE
                    /* SL1 (C23): Case tạo tay giao người phụ trách — còn việc tới khi Case có PA (hoặc đã đóng). */
                    /* RA-LUONG-19: chỉ người ĐANG phụ trách còn việc — đổi người phụ trách thì chuông của người cũ thành "Để biết" (giữ lịch sử). */
                    WHEN n.kind = 'case_giao' THEN CASE WHEN sc.status != 'done' AND sc.owner_user_id = n.user_id
                      AND NOT EXISTS (SELECT 1 FROM case_interventions ci WHERE ci.case_id = sc.id AND ci.status != 'cancelled') THEN 1 ELSE 0 END
                    /* OV-11f (TQ-7): tín hiệu đã vào Case / đã rút → việc xong (Case có chuông riêng). P1 rà 11/11 G5-05: tín hiệu pending cũng KHÔNG còn việc —
                       hàng chờ "Xác minh" đã bỏ (cases/signals.ts), Công việc không đọc tín hiệu chờ → luôn Để biết. Báo PH kết quả Test: còn khi việc phối hợp của lượt chưa làm. */
                    WHEN n.entity_type = 'case_signal' THEN 0
                    WHEN n.entity_type = 'assessment_attempt' AND n.kind = 'phoi_hop' THEN
                      CASE WHEN EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = aa.id AND x.kind = 'bao_ph_tvv' AND x.status = 'pending') THEN 1 ELSE 0 END
                    WHEN n.entity_type = 'sos_case' AND n.kind IN ('sos', 'sos_new') THEN
                      CASE WHEN sc.status != 'done' AND ${LA_CASE_SOS('sc')} AND NOT ${CO_THE_KHONG_THEO_DOI('sc')}
                                AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') THEN 1 ELSE 0 END
                    /* SL1 (rà #502): đăng ký còn việc khi tài khoản còn chờ duyệt; đề nghị dời lịch còn việc khi còn chờ. */
                    /* #6 (rà 11/11 G3-7): QL đã duyệt đề xuất Ý thức → GVCN còn việc tới khi ghi "Đã thực hiện" (hoặc lần xử lý đổi khác). */
                    WHEN n.kind = 'yt_da_duyet' THEN CASE WHEN dm.status = 'da_duyet' THEN 1 ELSE 0 END
                    WHEN n.kind = 'dang_ky' AND n.entity_type = 'user' THEN CASE WHEN uu.approval_state = 'pending' THEN 1 ELSE 0 END
                    WHEN n.kind = 'schedule_move' AND n.entity_type = 'skill_move_requests' THEN CASE WHEN smr.status = 'pending' THEN 1 ELSE 0 END
                    WHEN n.entity_type = 'yeu_cau_duyet' AND n.kind IN ('duyet_moi', 'duyet_qua_han', 'bao_len') THEN
                      CASE WHEN ycd.trang_thai = 'cho' THEN 1 ELSE 0 END
                    WHEN n.entity_type = 'yeu_cau_duyet' AND n.kind = 'duyet_tu_choi' THEN
                      CASE WHEN ycd.trang_thai = 'tu_choi' AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y2
                             WHERE y2.id > ycd.id AND y2.loai = ycd.loai AND y2.nguoi_xin IS ycd.nguoi_xin
                               AND y2.hoc_vien_id IS ycd.hoc_vien_id AND y2.lop_id IS ycd.lop_id
                               /* PR-Dọn: thẻ gắn Case phải cùng CASE (thẻ cho Case B không xoá việc của thẻ bị từ chối ở Case A); thẻ
                                  không gắn Case (Ý thức…) gửi lại là một đối tượng mới, nên vẫn so theo em như cũ.
                                  ponytail: nối thẻ cũ → thẻ mới bằng cột riêng nếu sau này có luồng gửi lại khác đối tượng. */
                               AND ${CASE_CUA_THE('y2')} IS ${CASE_CUA_THE('ycd')}) THEN 1 ELSE 0 END
                  END AS con_viec
             FROM notifications n
             LEFT JOIN sos_cases sc ON n.entity_type = 'sos_case' AND sc.id = n.entity_id
             LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
             LEFT JOIN case_signals cs ON n.entity_type = 'case_signal' AND cs.id = n.entity_id
             LEFT JOIN assessment_attempts aa ON n.entity_type = 'assessment_attempt' AND aa.id = n.entity_id
             LEFT JOIN skill_move_requests smr ON n.entity_type = 'skill_move_requests' AND smr.id = n.entity_id
             LEFT JOIN assessment_attempts aa2 ON aa2.id = smr.attempt_id
             LEFT JOIN discipline_measures dm ON n.entity_type = 'discipline_measure' AND dm.id = n.entity_id
             LEFT JOIN yeu_cau_duyet ycd ON n.entity_type = 'yeu_cau_duyet' AND ycd.id = n.entity_id
             LEFT JOIN users uu ON n.kind = 'dang_ky' AND n.entity_type = 'user' AND uu.id = n.entity_id
            WHERE n.user_id = ? AND n.kind NOT IN (${KIND_TU_DONG_CU.map((k) => `'${k}'`).join(', ')}) ${trong}
         ) x
         LEFT JOIN students s ON s.id = x.student_id
        WHERE s.status IS NOT 'finished'   -- NGHI-HOC-LUU-TRU (chủ SP 05/11): em đã nghỉ học không hiện ở chuông; Học lại thì hiện lại
        ${duoi}`;
  const rows = db().prepare(cau('', `ORDER BY (x.read_at IS NULL) DESC, x.id DESC LIMIT ${THONG_BAO_TOI_DA}`)).all(userId) as any[];
  /*
   * K42a: trang đầu đầy → dòng Cần làm ĐÃ ĐỌC ngoài trang (một câu, chỉ khi đầy). Lọc ở WHERE BÊN TRONG (rà sâu #742): chỉ dòng đã đọc cũ hơn dòng
   * đã đọc cũ nhất của trang, chỉ loại có thể còn việc (`KIND_CAN_LAM`) — không quét lại mọi thông báo. Ý thức (`con_viec` tính ở dưới) không vào lượt này.
   */
  if (rows.length >= THONG_BAO_TOI_DA) {
    const daDoc = rows.filter((r) => r.read_at).map((r) => r.id as number);
    const moc = daDoc.length ? Math.min(...daDoc) : Number.MAX_SAFE_INTEGER;
    rows.push(...db().prepare(cau(
      `AND n.read_at IS NOT NULL AND n.id < ? AND n.kind IN (${KIND_CAN_LAM.map((k) => `'${k}'`).join(', ')})`,
      `AND x.con_viec = 1 ORDER BY x.id DESC LIMIT ${CAN_LAM_DA_DOC_THEM}`,
    )).all(userId, moc) as any[]);
  }
  /* SL1 (N1): hạn của dòng — lưu sẵn (tự động, Case giao) → hạn thẻ duyệt → hạn việc tiếp của Case (`xuLyCaseMany`, một câu mỗi lô). */
  const caseCan = [...new Set(rows.filter((r) => !r.han && r.entity_type === 'sos_case').map((r) => r.entity_id as number))];
  const xl = caseCan.length ? xuLyCaseMany(caseCan, demoToday()) : null;
  /* SL1 (rà #502): "Cần xử lý / Vi phạm mới" (Ý thức) còn việc khi em còn vi phạm mới hoặc bắt buộc xử lý chưa gửi — CÙNG `trangThaiYThuc` của Công việc. */
  const emYt = [...new Set(rows.filter((r) => r.kind === 'discipline' && r.entity_type === 'student').map((r) => r.entity_id as number))];
  const yt = emYt.length ? trangThaiYThuc(emYt, demoToday()) : null;
  for (const r of rows) {
    r.mon = r.mon_goc ? tenMon(r.ct ?? null, r.mon_goc) : null;
    if (yt && r.kind === 'discipline' && r.entity_type === 'student') {
      const em = yt.get(r.entity_id);
      r.con_viec = em && !em.tamDung && ((em.soBatBuoc > 0 && !em.coChoDuyet) || em.soMoi > 0) ? 1 : 0;
    }
    r.han = r.han ?? r.han_the ?? (r.entity_type === 'sos_case' ? xl?.get(r.entity_id)?.han ?? null : null);
    delete r.mon_goc; delete r.ct; delete r.han_the;
  }
  return rows;
}

/** DON-LUONG A6: "Đánh dấu đã đọc" nhiều dòng — MỘT câu `json_each`, chỉ dòng của CHÍNH người gọi (id người khác bỏ qua, không báo lỗi lộ). */
export const DOC_NHIEU_TOI_DA = 200;
export function docNhieu(userId: number, vao: unknown, ngay: string): number {
  const ids = Array.isArray(vao) ? vao.map(Number) : null;
  if (!ids?.length || ids.length > DOC_NHIEU_TOI_DA || ids.some((n) => !Number.isInteger(n) || n <= 0)) {
    throw loi(400, 'Danh sách thông báo không hợp lệ (tối đa {n} dòng).', { n: DOC_NHIEU_TOI_DA });
  }
  return Number(db().prepare(`UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL AND id IN (SELECT value FROM json_each(?))`)
    .run(ngay, userId, JSON.stringify(ids)).changes ?? 0);
}

/** "Đọc hết" (Q18): MỘT câu — chỉ tắt chấm chưa đọc của CHÍNH người gọi, không xoá dòng. Trả số dòng đã đánh dấu. */
export function docHet(userId: number, ngay: string): number {
  return Number(db().prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(ngay, userId).changes ?? 0);
}
