import { db, theoLo } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { CO_DIEM_SQL, LUA_CHON_SAU_THI } from '../../../shared/domain/index.ts';

/** PR-Dọn (Task 9b): dòng `students` của một em, nhớ trong request GET — hồ sơ HV đọc ba lần (đầu hồ sơ, bảng kỹ năng, khối lớp học). */
export const dongHocVien = (id: number): any => nho(`hv:${id}`, () => db().prepare('SELECT * FROM students WHERE id = ?').get(id) ?? null);

/**
 * PR-S6F-a (Q2): MỘT điều kiện SQL "em ĐANG HỌC" cho nợ điểm và các số tính cho giáo viên — Tạm dừng, Kết thúc học, đã lưu trữ đều
 * không sinh nợ, không vào badge "n bài chờ chấm", Lịch Test, bảng Phân tích GV (Chấm điểm, Xử lý vi phạm). `s` là bí danh `students`.
 */
export const HV_DANG_HOC_SQL = (s: string) => `${s}.status = 'active' AND ${s}.archived_at IS NULL`;
/**
 * N71 (rà 25/11): em NGỪNG HỌC (Tạm dừng / Kết thúc học — cả hai vào Lưu trữ, `archived_at` = ngày dừng) vẫn nợ ô thi TRƯỚC ngày dừng tới khi chấm xong
 * (việc của GV lớp lúc thi — như `LOP_CON_VIEC_SQL`). `tuan` = biểu thức tuần thi (lượt: `o_cho_tu` — sớm nhất của các ô chờ). Ô thi từ ngày dừng: không nợ.
 * `kemTamDung`: thêm em Tạm dừng chưa lưu trữ (bảng điểm lớp — như `LUOT_HIEN_TAI_SQL`).
 */
export const HV_CON_NO_SQL = (s: string, tuan: string, kemTamDung = false) =>
  `(${HV_DANG_HOC_SQL(s)}${kemTamDung ? ` OR (${s}.status = 'inactive' AND ${s}.archived_at IS NULL)` : ''} OR NULLIF(${tuan}, '') < substr(${s}.archived_at, 1, 10))`;
/** Phần NGÀY DỪNG của `HV_CON_NO_SQL` cho MỘT ô có tuần thi `tuan` — lọc từng ô sau câu SQL (lượt còn ô chờ trước ngày dừng có thể còn ô thi sau ngày dừng).
 *  Em chưa lưu trữ: không lọc (câu SQL của nơi gọi đã chọn em). */
export const oConNoKhiDung = (archivedAt: string | null | undefined, tuan: string | null | undefined): boolean =>
  !archivedAt || (!!tuan && tuan.slice(0, 10) < String(archivedAt).slice(0, 10));

/**
 * Lỗi chủ SP 28/10: MỘT điều kiện SQL "LƯỢT HIỆN TẠI" cho mọi danh sách hiện tại (bảng điểm lớp, Lịch / Chấm / Kế hoạch Test, Công việc, Tổng quan…):
 *   · em đang học (`HV_DANG_HOC_SQL` — Kết thúc học, Lưu trữ ẩn hết; `kemTamDung`: bảng điểm lớp giữ em Tạm dừng CHƯA lưu trữ như cũ, PTA Plan 28/10);
 *     N71: TRỪ lượt còn ô chờ điểm từ trước ngày em dừng (`HV_CON_NO_SQL`) — vẫn là việc tới khi chấm xong;
 *   · lượt thuộc lộ trình MỚI NHẤT của em CÙNG LOẠI (học lại = mọi thứ reset; FT `route` có giá trị và khoá lớp thường `route IS NULL` chạy song song được);
 *   · lượt còn là kế hoạch (`LUOT_CON_KE_HOACH_SQL`: MT chưa làm của lộ trình đã có kết quả thi thật không còn).
 * Lượt cũ, em ngừng học chỉ còn ở hồ sơ HV, Lưu trữ, Báo cáo — không xoá / huỷ gì; quay lại học là hiện lại.
 * `a` bí danh `assessment_attempts`, `s` bí danh `students` (cùng em).
 */
export const LUOT_HIEN_TAI_SQL = (a: string, s: string, kemTamDung = false) =>
  `${HV_CON_NO_SQL(s, `${a}.o_cho_tu`, kemTamDung)} AND ${LUOT_LO_TRINH_CUOI_SQL(a)} AND ${LUOT_CON_KE_HOACH_SQL(a)}`;
/** Phần "lộ trình mới nhất" của `LUOT_HIEN_TAI_SQL` — cho câu đã lọc em đang học bằng ghi danh (LEFT JOIN lượt, không có `students`).
 *  Lượt bị thay khi em có lộ trình `seq` lớn hơn CÙNG LOẠI (FT / lớp thường — em học FT vẫn có thể có khoá lớp thường mở song song, `regular.ts`).
 *  LOP-CU (chủ SP 11/11): lượt khoá LỚP THƯỜNG cũ còn ô chờ điểm từ trước ngày khoá mới bắt đầu (`o_cho_tu` ≤ `started_at`) KHÔNG bị thay — Final /
 *  Progress chưa nhập vẫn là việc của GV lớp lúc thi tới khi nhập xong. Lượt xếp sau ngày đó, khoá FT cũ (học lại = reset) vẫn bị thay như trước.
 *  `chat`: chỉ lộ trình mới nhất, không ngoại lệ — nơi hỏi "bài của khoá hiện tại" (MT sắp tới, em chưa có bài ở Kế hoạch Test). */
export const LUOT_LO_TRINH_CUOI_SQL = (a: string, chat = false) =>
  `NOT EXISTS (SELECT 1 FROM learning_cycles cyo JOIN learning_cycles cyn ON cyn.student_id = cyo.student_id AND cyn.seq > cyo.seq
     AND (cyn.route IS NULL) = (cyo.route IS NULL) WHERE cyo.id = ${a}.cycle_id${chat ? '' : `
     AND (cyo.route IS NOT NULL OR ${a}.o_cho_tu IS NULL OR ${a}.o_cho_tu > cyn.started_at)`})`;
/**
 * LOP-CU (chủ SP 11/11): lớp của lượt còn sinh việc nhập điểm — lớp đang học, HOẶC lớp đã kết thúc (em cuối chuyển đi) mà lượt còn ô chờ điểm từ
 * trước ngày kết thúc (`o_cho_tu` ≤ `finished_at`): việc thuộc GV lớp lúc thi tới khi nhập xong. Lượt xếp sau ngày kết thúc, lượt huỷ, ô "-"
 * (lọc ở `skillCells`) không kéo lại. `a` bí danh `assessment_attempts`, `c` bí danh `classes` của lượt.
 */
export const LOP_CON_VIEC_SQL = (a: string, c: string) => `(${c}.status = 'active' OR ${a}.o_cho_tu <= ${c}.finished_at)`;
/** Lộ trình FT có kết quả thi thật: đủ 4 kỹ năng, "Không thi", hoặc kết quả CŨ (Overall / kết luận chọn tay) — MỘT điều kiện với Bước tiếp
 *  (`loTrinh/buocTiep.ts` `CO_KET_QUA`, `coKetQuaThi`). `c` bí danh `learning_cycles`. */
export const CO_KET_QUA_THI_SQL = (c: string) => `(${c}.thi_that_khong_thi = 1 OR (${c}.thi_that_l IS NOT NULL AND ${c}.thi_that_r IS NOT NULL AND ${c}.thi_that_w IS NOT NULL AND ${c}.thi_that_s IS NOT NULL)
  OR ${c}.outcome_score IS NOT NULL OR COALESCE(${c}.outcome, 'unknown') != 'unknown')`;
/** Luật "thi thật là kết thúc" (PTA Plan 28/10): lộ trình FT có kết quả thi thật mà bước tiếp chưa chọn hoặc là dừng / lộ trình mới — MT chưa làm không còn
 *  là kế hoạch (`LUA_CHON_SAU_THI`: ket_thuc / tam_dung / lo_trinh_moi). Bước tiếp cũ học tiếp (`hoc_tiep`, `hoc_lai`) giữ MT. Không tự đóng lộ trình, không huỷ lượt. `cy` bí danh `learning_cycles`. */
export const DA_THI_THAT_SQL = (cy: string) =>
  `(${cy}.route IS NOT NULL AND ${CO_KET_QUA_THI_SQL(cy)} AND (${cy}.buoc_tiep IS NULL OR ${cy}.buoc_tiep IN (${LUA_CHON_SAU_THI.map((x) => `'${x}'`).join(', ')})))`;
/**
 * N46 (chủ SP 16/11, audit câu 1): việc Case / PA / Phối hợp SOS của lộ trình FT ĐÃ CÓ KQ thi thật (`DA_THI_THAT_SQL`) ẩn khỏi Công việc mọi vai — như em
 * Tạm dừng, không xoá, không đóng Case. Lộ trình mới: lộ trình cũ vẫn "đã thi thật" → việc cũ không hiện lại. Dời lịch thi (chưa có KQ) → việc giữ nguyên.
 * MỘT điều kiện cho Công việc, hồ sơ HV, Tổng quan (cùng câu). Lộ trình của Case: `sc.cycle_id` → lộ trình của lượt (`sc.attempt_id`) → lộ trình FT của em
 * ĐANG CHẠY lúc tạo Case (seq lớn nhất bắt đầu trước ngày tạo) — KHÔNG lấy "lộ trình mới nhất" (sau Lộ trình mới đó là lộ trình chưa thi → Case cũ hiện lại, rà #1788).
 * Lớp thường song song (lộ trình `route IS NULL`) không bị ẩn. `sc` bí danh `sos_cases`, `sid` cột id em.
 */
export const CASE_SAU_THI_SQL = (sc: string, sid: string) => `EXISTS (SELECT 1 FROM learning_cycles cyx WHERE ${DA_THI_THAT_SQL('cyx')} AND cyx.id = COALESCE(${sc}.cycle_id,
  (SELECT ax.cycle_id FROM assessment_attempts ax WHERE ax.id = ${sc}.attempt_id),
  (SELECT cyz.id FROM learning_cycles cyz WHERE cyz.student_id = ${sid} AND cyz.route IS NOT NULL AND substr(cyz.started_at, 1, 10) <= substr(${sc}.created_at, 1, 10)
    ORDER BY cyz.seq DESC LIMIT 1)))`;
/** N46: như `CASE_SAU_THI_SQL` cho việc gắn LƯỢT (Phối hợp SOS) — lộ trình của lượt đã có KQ thi thật. `a` bí danh `assessment_attempts`. */
export const LUOT_SAU_THI_SQL = (a: string) => `EXISTS (SELECT 1 FROM learning_cycles cyx WHERE cyx.id = ${a}.cycle_id AND ${DA_THI_THAT_SQL('cyx')})`;
/** NGHI-HOC-LUU-TRU (chủ SP 05/11): lượt vào tệp Excel — lượt CHƯA THI (planned, chưa có điểm) chỉ của em đang học (như màn Kế hoạch Test);
 *  lượt đã thi luôn giữ (lịch sử thật). Một nguồn cho Xuất điểm Test và Xuất kết quả Test. `a` bí danh `assessment_attempts`, `s` bí danh `students`. */
export const LUOT_XUAT_SQL = (a: string, s: string) => `(${a}.status != 'planned' OR ${CO_DIEM_SQL(a)} OR (${HV_DANG_HOC_SQL(s)}))`;
/** Phần "còn là kế hoạch" của `LUOT_HIEN_TAI_SQL`: lượt chưa làm (planned, chưa có điểm) của lộ trình đã thi thật thì không còn — MT đã làm giữ. */
export const LUOT_CON_KE_HOACH_SQL = (a: string) =>
  `(${a}.status != 'planned' OR NOT EXISTS (SELECT 1 FROM learning_cycles cyt WHERE cyt.id = ${a}.cycle_id AND ${DA_THI_THAT_SQL('cyt')}) OR ${CO_DIEM_SQL(a)})`;

export type KhoangTamDung = { tu: string; den: string | null; lyDo: string | null; boiId: number | null };

/**
 * KHOẢNG TẠM DỪNG của nhiều em — MỘT câu (≤ 900 em) trên nhật ký `pause`/`resume` (`setStudentStatus`), ghép cặp theo ngày.
 * Em chưa từng Tạm dừng thì không có khoá. Khoảng đang dừng có `den: null`. Cùng thân với PR-UXF-a (giao kèo đếm tuần học FT, Q1).
 */
export function khoangTamDung(ids: readonly number[]): Record<number, KhoangTamDung[]> {
  const kq: Record<number, KhoangTamDung[]> = {};
  theoLo([...new Set(ids)], (lo, ph) => {
    const rows = db().prepare(
      `SELECT student_id, event_type, event_date, detail, created_by FROM journey_events
        WHERE event_type IN ('pause', 'resume') AND student_id IN (${ph}) ORDER BY student_id, event_date, id`,
    ).all(...lo) as any[];
    for (const r of rows) ghepKhoang((kq[r.student_id] ??= []), r);
  });
  for (const k of Object.keys(kq)) if (!kq[Number(k)].length) delete kq[Number(k)];
  return kq;
}
/** Ghép một sự kiện (đã xếp theo ngày, id) vào các khoảng của một em — một luật cho `khoangTamDung` và `khoangTuSuKien`. */
function ghepKhoang(ds: KhoangTamDung[], r: { event_type: string; event_date: string; detail?: string | null; created_by?: number | null }) {
  const cuoi = ds.at(-1);
  if (r.event_type === 'pause') {
    if (!cuoi || cuoi.den !== null) ds.push({ tu: r.event_date, den: null, lyDo: r.detail ?? null, boiId: r.created_by ?? null });
  } else if (cuoi && cuoi.den === null) cuoi.den = r.event_date;
}

/**
 * R1-L2 (rà 24/11): sự kiện Tạm dừng / Quay lại của em `sid` (biểu thức SQL) thành MỘT cột JSON trong câu đang đọc — hạn Báo PH ở danh sách (Đang theo dõi,
 * panel Phối hợp, Phân tích) tính cùng khoảng với panel (`khoangTamDung`) mà không thêm câu. Đọc lại bằng `khoangTuSuKien`.
 */
export const SU_KIEN_TAM_DUNG_SQL = (sid: string) =>
  `(SELECT json_group_array(json_array(j_.event_date, j_.id, j_.event_type)) FROM journey_events j_ WHERE j_.event_type IN ('pause', 'resume') AND j_.student_id = ${sid})`;
export function khoangTuSuKien(json: string | null | undefined): KhoangTamDung[] {
  const ds: KhoangTamDung[] = [];
  const ev = (json ? JSON.parse(json) : []) as [string, number, string][];
  ev.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]));   // như ORDER BY event_date, id của `khoangTamDung`
  for (const [ngay, , loai] of ev) ghepKhoang(ds, { event_type: loai, event_date: ngay });
  return ds;
}
