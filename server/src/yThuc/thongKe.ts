import { db } from '../db.ts';
import { MEASURE_KINDS, PERMISSIONS, type MeasureKind } from '../../../shared/domain/index.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { badRequest, forbidden, isIsoDate } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { warningsFor } from './canhBao.ts';

/**
 * TÁM CHỈ SỐ Ý THỨC — mỗi chỉ số MỘT hàm trả về TẬP ID (thiet-ke/HOP_DONG_SO_LIEU.md §5, đặc tả §8).
 *
 * Số là độ dài của tập; danh sách khi bấm số là CHÍNH tập đó, qua CÙNG hàm và CÙNG quyền — không có đường đếm riêng. Bốn luật nền
 * của hợp đồng áp nguyên: phạm vi rỗng trả rỗng · không cộng số học viên qua nhiều nơi · ba loại thời gian không trộn · drill-down
 * cùng quyền với số tổng.
 *
 *   BA ĐƠN VỊ KHÔNG BAO GIỜ CỘNG VÀO NHAU: vi phạm · học viên · biện pháp. Một Report gom năm vi phạm là MỘT biện pháp (B16) và
 *   là năm vi phạm — hai con số đúng, hai câu hỏi khác nhau.
 *
 *   VI PHẠM BỊ XOÁ (rulebook v3, V11′–V14′) không còn tồn tại nên mọi số tự cập nhật; chỉ số `vi-pham-khong-hieu-luc` đã bỏ cùng trạng thái đó.
 *
 *   Ý THỨC NẰM HOÀN TOÀN NGOÀI MỌI BẢNG HIỆU QUẢ HỖ TRỢ: không hàm nào ở đây đọc `case_followups`, kết quả phương án hay
 *   `dung-han-cap-nhat`, và không hàm nào của bảng hiệu quả đọc bảng ở đây. Gia đình đã nhận report không chứng minh em tiến bộ.
 *
 * Thời gian: `vi-pham-tong` · `hv-co-vi-pham` đếm theo NGÀY XẢY RA (không theo ngày ghi nhận — GV nhớ ra
 * muộn không làm sự việc xảy ra muộn) và theo lớp GHI LÚC ĐÓ; hai biện pháp đã thực hiện đếm theo NGÀY THỰC HIỆN. Các chỉ số
 * hiện trạng không nhận kỳ.
 */

export const YTHUC_METRIC_IDS = [
  'vi-pham-tong', 'vi-pham-chua-xu-ly', 'hv-co-vi-pham', 'hv-can-xu-ly',
  'bien-phap-da-thuc-hien', 'bien-phap-dang-chuan-bi', 'bien-phap-theo-loai',
] as const;

export const isYThucMetric = (id: string): boolean => (YTHUC_METRIC_IDS as readonly string[]).includes(id);

/**
 * Phạm vi xem THỐNG KÊ Ý THỨC: chỉ Quản lý (chi nhánh của họ) và Quản trị (tất cả) — GVBM và GVCN xem trong phạm vi lớp qua bảng
 * của lớp, không xem thống kê cả chi nhánh (đặc tả §6). Hỏi chi nhánh NGOÀI phạm vi thì TỪ CHỐI, không âm thầm trả tập rút gọn.
 */
export function statScope(p: Principal, branchId: number | null): { none: boolean; branchIds: number[] | null } {
  const sc = scopeFor(p, PERMISSIONS.DISCIPLINE_STATS);
  if (sc.none) return { none: true, branchIds: [] };
  if (branchId) {
    if (!sc.all && !sc.branchIds.includes(branchId)) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
    return { none: false, branchIds: [branchId] };
  }
  return { none: false, branchIds: sc.all ? null : sc.branchIds };
}

export const branchSql = (col: string, branchIds: number[] | null): { sql: string; args: number[] } =>
  branchIds === null ? { sql: '1 = 1', args: [] } : { sql: `${col} IN (${branchIds.map(() => '?').join(',') || 'NULL'})`, args: branchIds };

/** Chi nhánh của lớp học viên ĐANG học — dùng cho chỉ số HIỆN TRẠNG (em chuyển chi nhánh thì hiện trạng sang nơi mới). */
const NOW_BRANCH = `(SELECT c2.branch_id FROM enrollments e2 JOIN classes c2 ON c2.id = e2.class_id
                      WHERE e2.student_id = v.student_id AND e2.status = 'active' ORDER BY e2.id DESC LIMIT 1)`;

function checkPeriod(from: string | null | undefined, to: string | null | undefined) {
  if (from && !isIsoDate(from)) throw badRequest('Ngày bắt đầu kỳ không hợp lệ.');
  if (to && !isIsoDate(to)) throw badRequest('Ngày kết thúc kỳ không hợp lệ.');
}

export type YThucMetricResult = { none: boolean; ids: number[]; byKind?: Record<string, number[]> };

export function yThucMetric(
  p: Principal, id: string,
  f: { branchId?: number | null; from?: string | null; to?: string | null; kind?: string | null } = {},
): YThucMetricResult {
  const scope = statScope(p, f.branchId ?? null);
  if (scope.none) return { none: true, ids: [] };
  checkPeriod(f.from, f.to);
  const today = demoToday();
  const all = (sql: string, ...args: unknown[]) => (db().prepare(sql).all(...args) as any[]).map((r) => r.id as number);
  const period = (col: string) => ({
    sql: `${f.from ? ` AND ${col} >= ?` : ''}${f.to ? ` AND ${col} <= ?` : ''}`,
    args: [...(f.from ? [f.from] : []), ...(f.to ? [f.to] : [])],
  });

  switch (id) {
    case 'vi-pham-tong': {
      const b = branchSql('c.branch_id', scope.branchIds), t = period('v.occurred_on');
      return { none: false, ids: all(
        `SELECT v.id FROM violations v LEFT JOIN classes c ON c.id = v.class_id
          WHERE ${b.sql}${t.sql} ORDER BY v.id`, ...b.args, ...t.args) };
    }
    case 'vi-pham-chua-xu-ly': {
      const b = branchSql(NOW_BRANCH, scope.branchIds);
      return { none: false, ids: all(
        `SELECT v.id FROM violations v
          WHERE ${b.sql}
            AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = v.id) ORDER BY v.id`, ...b.args) };
    }
    case 'hv-co-vi-pham': {
      const b = branchSql('c.branch_id', scope.branchIds), t = period('v.occurred_on');
      return { none: false, ids: all(
        `SELECT DISTINCT v.student_id AS id FROM violations v LEFT JOIN classes c ON c.id = v.class_id
          WHERE ${b.sql}${t.sql} ORDER BY v.student_id`, ...b.args, ...t.args) };
    }
    case 'hv-can-xu-ly': {
      /* Ứng viên: em đang học trong phạm vi có ít nhất một vi phạm chưa xử lý. Rồi hỏi CHÍNH hàm cảnh báo — không đếm riêng. */
      const b = branchSql(NOW_BRANCH, scope.branchIds);
      const candidates = all(
        `SELECT DISTINCT v.student_id AS id FROM violations v
          WHERE ${b.sql}
            AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = v.id) ORDER BY v.student_id`, ...b.args);
      const warned = warningsFor(candidates, today);
      return { none: false, ids: candidates.filter((s) => warned.get(s)?.active) };
    }
    case 'bien-phap-dang-chuan-bi': {
      const b = branchSql('c.branch_id', scope.branchIds);
      return { none: false, ids: all(
        `SELECT m.id FROM discipline_measures m LEFT JOIN classes c ON c.id = m.class_id
          WHERE m.status = 'preparing' AND ${b.sql} ORDER BY m.id`, ...b.args) };
    }
    case 'bien-phap-da-thuc-hien':
    case 'bien-phap-theo-loai': {
      if (id === 'bien-phap-theo-loai' && f.kind && !(MEASURE_KINDS as readonly string[]).includes(f.kind)) {
        throw badRequest('Loại biện pháp không hợp lệ.');
      }
      const b = branchSql('c.branch_id', scope.branchIds), t = period('m.performed_on');
      const rows = db()
        .prepare(
          `SELECT m.id, m.kind FROM discipline_measures m LEFT JOIN classes c ON c.id = m.class_id
            WHERE m.status = 'done' AND ${b.sql}${t.sql} ORDER BY m.id`,
        )
        .all(...b.args, ...t.args) as any[];
      if (id === 'bien-phap-da-thuc-hien') return { none: false, ids: rows.map((r) => r.id as number) };
      /* Chín loại, tách riêng ba thư cảnh cáo — không gộp. `ids` là hợp của các phần (hoặc đúng loại được lọc). */
      const byKind = Object.fromEntries(MEASURE_KINDS.map((k) => [k, [] as number[]])) as Record<MeasureKind, number[]>;
      for (const r of rows) byKind[r.kind as MeasureKind]?.push(r.id);
      const picked = f.kind ? { [f.kind]: byKind[f.kind as MeasureKind] } : byKind;
      return { none: false, byKind: picked as Record<string, number[]>, ids: Object.values(picked).flat().sort((x, y) => x - y) };
    }
    default:
      throw badRequest(`Không có chỉ số Ý thức "${id}".`);
  }
}
