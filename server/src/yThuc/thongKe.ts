import { db } from '../db.ts';
import {
  KHOA_LOAI_XU_LY, PERMISSIONS, NHOM_TRANG_THAI_KHOA, THANG, khoaLoaiXuLy, khoaNhomTrangThai,
  type NhomViPhamKhoa, type TrangThaiViPhamKhoa,
} from '../../../shared/domain/index.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { badRequest, forbidden, isIsoDate, notFound } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { trangThaiYThuc } from './trangThai.ts';

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
  /* PR-YT4: `bien-phap-dang-chuan-bi` → `bien-phap-cho-duyet` (không còn "Đang chuẩn bị"); thêm `hv-theo-bac`. */
  'bien-phap-da-thuc-hien', 'bien-phap-cho-duyet', 'bien-phap-theo-loai', 'vi-pham-theo-nhom', 'hv-theo-bac',
] as const;

/** Khoá `byKind` của `hv-theo-bac`: bậc 0 (chưa bậc nào) … 6 (WL 3). */
export const KHOA_BAC = ['0', ...THANG.map((_, i) => String(i + 1))] as const;

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

/**
 * Q19 (P14) — lọc THÊM theo MỘT lớp, dùng chung cho Ý thức và Phối hợp. `classId` phải nằm trong phạm vi chi nhánh
 * đang xem (`statScope`) — hỏi lớp ngoài phạm vi thì TỪ CHỐI (403), không âm thầm bỏ qua bộ lọc.
 */
export function checkClassInScope(classId: number, branchIds: number[] | null): void {
  const cls = db().prepare('SELECT branch_id FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  if (branchIds !== null && !branchIds.includes(cls.branch_id)) throw forbidden('Lớp này nằm ngoài phạm vi bạn được xem.');
}

/** Chỉ số theo lớp GHI (`v.class_id`/`m.class_id`/`a.class_id`) — không lọc gì khi không hỏi theo lớp. */
export const classSql = (col: string, classId: number | null | undefined): { sql: string; args: number[] } =>
  classId ? { sql: `${col} = ?`, args: [classId] } : { sql: '1 = 1', args: [] };

/** Chỉ số HIỆN TRẠNG (`vi-pham-chua-xu-ly`, `hv-can-xu-ly`): học viên ĐANG HỌC ở lớp — không phải "ghi ở lớp lúc đó". */
const activeInClassSql = (classId: number | null | undefined): { sql: string; args: number[] } =>
  classId
    ? { sql: `v.student_id IN (SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active')`, args: [classId] }
    : { sql: '1 = 1', args: [] };

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
  f: { branchId?: number | null; from?: string | null; to?: string | null; kind?: string | null; classId?: number | null } = {},
): YThucMetricResult {
  const scope = statScope(p, f.branchId ?? null);
  if (scope.none) return { none: true, ids: [] };
  if (f.classId) checkClassInScope(f.classId, scope.branchIds);
  checkPeriod(f.from, f.to);
  const today = demoToday();
  const all = (sql: string, ...args: unknown[]) => (db().prepare(sql).all(...args) as any[]).map((r) => r.id as number);
  const period = (col: string) => ({
    sql: `${f.from ? ` AND ${col} >= ?` : ''}${f.to ? ` AND ${col} <= ?` : ''}`,
    args: [...(f.from ? [f.from] : []), ...(f.to ? [f.to] : [])],
  });

  switch (id) {
    case 'vi-pham-tong': {
      const b = branchSql('c.branch_id', scope.branchIds), t = period('v.occurred_on'), cl = classSql('v.class_id', f.classId);
      return { none: false, ids: all(
        `SELECT v.id FROM violations v LEFT JOIN classes c ON c.id = v.class_id
          WHERE ${b.sql}${t.sql} AND ${cl.sql} ORDER BY v.id`, ...b.args, ...t.args, ...cl.args) };
    }
    case 'vi-pham-chua-xu-ly': {
      /* PR-YT4 (K1-26): Mới + Cần xử lý + Quá hạn — "Đã ghi nhận" KHÔNG tính (GVCN đã xem, không cần biện pháp). Nhãn do cửa trạng thái. */
      const b = branchSql(NOW_BRANCH, scope.branchIds), ac = activeInClassSql(f.classId);
      const rows = db().prepare(
        `SELECT v.id, v.student_id FROM violations v
          WHERE ${b.sql} AND ${ac.sql}
            AND NOT EXISTS (SELECT 1 FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
                             WHERE mv.violation_id = v.id AND m.status IN ('done', 'cho_duyet', 'da_duyet')) ORDER BY v.id`,
      ).all(...b.args, ...ac.args) as any[];
      const trang = trangThaiYThuc(rows.map((r) => r.student_id as number), today);
      const MO: ReadonlySet<string> = new Set(['moi', 'can_xu_ly', 'qua_han']);
      return { none: false, ids: rows.filter((r) => MO.has(trang.get(r.student_id)?.viPham.get(r.id)?.t ?? '')).map((r) => r.id as number) };
    }
    case 'hv-co-vi-pham': {
      const b = branchSql('c.branch_id', scope.branchIds), t = period('v.occurred_on'), cl = classSql('v.class_id', f.classId);
      return { none: false, ids: all(
        `SELECT DISTINCT v.student_id AS id FROM violations v LEFT JOIN classes c ON c.id = v.class_id
          WHERE ${b.sql}${t.sql} AND ${cl.sql} ORDER BY v.student_id`, ...b.args, ...t.args, ...cl.args) };
    }
    case 'hv-can-xu-ly': {
      /* PR-YT4: em thuộc nhóm Quá hạn hoặc Bắt buộc xử lý (K1-26). SQL chỉ lọc ứng viên (em đang học trong phạm vi có vi phạm chưa
         đóng hoặc đề xuất đã duyệt); nhóm do CHÍNH cửa trạng thái quyết — không đếm riêng. */
      const b = branchSql(NOW_BRANCH, scope.branchIds), ac = activeInClassSql(f.classId);
      const candidates = all(
        `SELECT DISTINCT v.student_id AS id FROM violations v
          WHERE ${b.sql} AND ${ac.sql}
            AND NOT EXISTS (SELECT 1 FROM measure_violations mv JOIN discipline_measures m ON m.id = mv.measure_id
                             WHERE mv.violation_id = v.id AND m.status IN ('done', 'cho_duyet', 'da_duyet'))
         UNION SELECT DISTINCT v.student_id FROM discipline_measures v WHERE v.status = 'da_duyet' AND ${b.sql} AND ${ac.sql}
         ORDER BY 1`, ...b.args, ...ac.args, ...b.args, ...ac.args);
      const trang = trangThaiYThuc(candidates, today);
      return { none: false, ids: candidates.filter((s) => { const n = trang.get(s)?.nhom; return n === 'qua_han' || n === 'bat_buoc'; }) };
    }
    case 'bien-phap-cho-duyet': {
      /* PR-YT4: đề xuất đang chờ QL (thẻ `y_thuc`). byKind theo loại — cùng cách `bien-phap-theo-loai`. */
      if (f.kind && !(KHOA_LOAI_XU_LY as readonly string[]).includes(f.kind)) throw badRequest('Loại lần xử lý không hợp lệ.');
      const b = branchSql('c.branch_id', scope.branchIds), cl = classSql('m.class_id', f.classId);
      const rows = db()
        .prepare(
          `SELECT m.id, m.kind FROM discipline_measures m LEFT JOIN classes c ON c.id = m.class_id
            WHERE m.status = 'cho_duyet' AND ${b.sql} AND ${cl.sql} ORDER BY m.id`,
        )
        .all(...b.args, ...cl.args) as any[];
      const byKind = Object.fromEntries(KHOA_LOAI_XU_LY.map((k) => [k, [] as number[]])) as Record<string, number[]>;
      for (const r of rows) byKind[khoaLoaiXuLy(r.kind)].push(r.id);
      const picked = f.kind ? { [f.kind]: byKind[f.kind] } : byKind;
      return { none: false, byKind: picked as Record<string, number[]>, ids: Object.values(picked).flat().sort((x, y) => x - y) };
    }
    case 'bien-phap-da-thuc-hien':
    case 'bien-phap-theo-loai': {
      if (id === 'bien-phap-theo-loai' && f.kind && !(KHOA_LOAI_XU_LY as readonly string[]).includes(f.kind)) {
        throw badRequest('Loại lần xử lý không hợp lệ.');
      }
      const b = branchSql('c.branch_id', scope.branchIds), t = period('m.performed_on'), cl = classSql('m.class_id', f.classId);
      const rows = db()
        .prepare(
          `SELECT m.id, m.kind FROM discipline_measures m LEFT JOIN classes c ON c.id = m.class_id
            WHERE m.status = 'done' AND ${b.sql}${t.sql} AND ${cl.sql} ORDER BY m.id`,
        )
        .all(...b.args, ...t.args, ...cl.args) as any[];
      if (id === 'bien-phap-da-thuc-hien') return { none: false, ids: rows.map((r) => r.id as number) };
      /* Chín loại, tách riêng ba thư cảnh cáo — không gộp. `ids` là hợp của các phần (hoặc đúng loại được lọc). */
      const byKind = Object.fromEntries(KHOA_LOAI_XU_LY.map((k) => [k, [] as number[]])) as Record<string, number[]>;
      for (const r of rows) byKind[khoaLoaiXuLy(r.kind)].push(r.id);
      const picked = f.kind ? { [f.kind]: byKind[f.kind] } : byKind;
      return { none: false, byKind: picked as Record<string, number[]>, ids: Object.values(picked).flat().sort((x, y) => x - y) };
    }
    case 'vi-pham-theo-nhom': {
      /*
       * P13 (Q17), PR-YT4 — MỘT câu SQL: đúng điều kiện của `vi-pham-tong` (phạm vi, kỳ, lớp); trạng thái TÍNH ĐẾN HÔM NAY đọc từ CỬA
       * TRẠNG THÁI (`trangThaiYThuc`, sáu nhãn §5.4) — không suy lại ở SQL. `byKind` đủ 42 khoá `{nhom}:{trangThai}`; mỗi vi phạm rơi vào
       * đúng một trạng thái riêng và cả ba khoá gộp, nên hợp các khoá luôn khớp `vi-pham-tong`.
       */
      if (f.kind && !(NHOM_TRANG_THAI_KHOA as readonly string[]).includes(f.kind)) throw badRequest('Khoá nhóm × trạng thái không hợp lệ.');
      const b = branchSql('c.branch_id', scope.branchIds), t = period('v.occurred_on'), cl = classSql('v.class_id', f.classId);
      const rows = db()
        .prepare(
          `SELECT v.id, v.category, v.student_id
             FROM violations v LEFT JOIN classes c ON c.id = v.class_id
            WHERE ${b.sql}${t.sql} AND ${cl.sql} ORDER BY v.id`,
        )
        .all(...b.args, ...t.args, ...cl.args) as any[];
      const byKind = Object.fromEntries(NHOM_TRANG_THAI_KHOA.map((k) => [k, [] as number[]])) as Record<string, number[]>;
      const trang = trangThaiYThuc(rows.map((r) => r.student_id as number), today);
      for (const r of rows) {
        const trangThai = (trang.get(r.student_id)?.viPham.get(r.id)?.t ?? 'moi') as TrangThaiViPhamKhoa;
        const nhom = r.category as NhomViPhamKhoa;
        byKind[khoaNhomTrangThai(nhom, trangThai)].push(r.id);
        byKind[khoaNhomTrangThai(nhom, 'tat-ca')].push(r.id);
        byKind[khoaNhomTrangThai('tat-ca', trangThai)].push(r.id);
        byKind[khoaNhomTrangThai('tat-ca', 'tat-ca')].push(r.id);
      }
      if (f.kind) return { none: false, byKind: { [f.kind]: byKind[f.kind] }, ids: byKind[f.kind] };
      return { none: false, byKind, ids: rows.map((r) => r.id as number) };
    }
    case 'hv-theo-bac': {
      /* PR-YT4: em ĐANG HỌC trong phạm vi, chia theo bậc hiện tại trên thang (0 = chưa bậc nào … 6 = WL 3) — bậc của cửa trạng thái. */
      if (f.kind && !(KHOA_BAC as readonly string[]).includes(f.kind)) throw badRequest('Bậc không hợp lệ (0–6).');
      const b = branchSql('c.branch_id', scope.branchIds), cl = classSql('e.class_id', f.classId);
      const ids = all(
        `SELECT DISTINCT e.student_id AS id FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN students s ON s.id = e.student_id
          WHERE e.status = 'active' AND s.archived_at IS NULL AND ${b.sql} AND ${cl.sql} ORDER BY e.student_id`, ...b.args, ...cl.args);
      const trang = trangThaiYThuc(ids, today);
      const byKind = Object.fromEntries(KHOA_BAC.map((k) => [k, [] as number[]])) as Record<string, number[]>;
      for (const id of ids) byKind[String(trang.get(id)?.bac ?? 0)].push(id);
      const picked = f.kind ? { [f.kind]: byKind[f.kind] } : byKind;
      return { none: false, byKind: picked, ids: Object.values(picked).flat().sort((x, y) => x - y) };
    }
    default:
      throw badRequest(`Không có chỉ số Ý thức "${id}".`);
  }
}
