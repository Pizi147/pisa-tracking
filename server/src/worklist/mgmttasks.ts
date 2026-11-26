import { DS_JSON, db, laTrungKhoa, theoKhoaGui, tx } from '../db.ts';
import {
  PERMISSIONS, TASK_PROGRESS, TASK_PROGRESS_CLOSED, TASK_PROGRESS_LABEL,
  TASK_PROGRESS_NEEDS_REASON, chuanHangMuc, chuanKhoaGui, facetVanHanh, laHangMucCv, locVanHanh,
  type DongVanHanh, type HangSo, type TaskGroup, type TaskProgress, type TrangThaiLoc,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, canXacNhan, chuTuDo, conflict, diffDays, forbidden, isIsoDate, notFound, nowIso, padCode, loi } from '../util.ts';
import { can, scopeFor, type Principal, type Scope } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { ensurePeriod } from '../platform/week.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';
import { caseAccess } from '../cases/cases.ts';
import { CN_VH, HOAT_DONG_O, baoTheoDoi, docLoai, docViec, ghiLan, laNguoiTheoDoi, themTheoDoiDong, xemGiaoViec, type SuKien } from './giaoViec.ts';
import { GhiDao, daoLai, luuGhiDao, type BanGhiDao } from '../platform/ghiDao.ts';
import { BoChup, ghiThungRac } from '../platform/thungRac.ts';

/**
 * TIẾN ĐỘ CÔNG VIỆC — công việc quản lý vận hành (mục 8).
 *
 * KHÔNG phải Case của học viên, và cố ý không có tầng "phương án xử lý": Quản lý tạo việc,
 * giao việc, cập nhật tiến độ. Thêm một quy trình xin duyệt vào đây là biến một cuốn sổ tay
 * thành một thủ tục hành chính.
 *
 * BỐN QUYẾT ĐỊNH VỀ MÔ HÌNH:
 *
 * 1. MỘT CÔNG VIỆC = MỘT ĐỊNH DANH, XUYÊN NHIỀU TUẦN (mục 8.4). Không nhân bản mỗi tuần
 *    một bản sao. Tuần chỉ dùng để LỌC các lần cập nhật — và mỗi lần cập nhật là một dòng
 *    riêng có người, có thời điểm, có ghi chú. (VH-1: việc LẶP LẠI là ngoại lệ có chủ ý —
 *    mỗi kỳ một bản mới, trỏ việc gốc.)
 * 2. CÔNG VIỆC CON CHỈ MỘT TẦNG (mục 8.6). Cây nhiều tầng nghe thì linh hoạt, nhưng đọc
 *    một bảng lồng bốn tầng thì không ai biết việc nào của ai.
 * 3. TẠM NGƯNG KHÁC DỪNG HẲN (mục 8.5). Tạm ngưng là còn sống, tiếp tục được bất kỳ lúc
 *    nào; dừng hẳn là đã quyết định không làm. Cả hai bắt buộc ghi lý do (PR-Ra: Tạm ngưng
 *    còn bắt buộc thêm người cần hỗ trợ + ngày xem lại — Q10).
 * 4. LIÊN KẾT CASE LÀ CĂN CỨ, KHÔNG PHẢI ĐIỀU KHIỂN (mục 8.7). Hoàn thành việc quản lý
 *    KHÔNG đóng Case nào, và cũng không tự tạo phương án cho em nào.
 *
 * VH-1 (N59, chủ SP 20/11): Head · Quản trị · CX (theo chi nhánh) tạo / giao · nhóm tự đặt (`task_groups`) · nhiều người theo dõi qua khung chung
 * (`viec_theo_doi` loai 'van_hanh', `giaoViec.ts`) · chuông "Cập nhật" (giao / đổi người · đổi hạn · tiến độ · xong / dừng) · người phụ trách sửa hạn,
 * lý do tuỳ chọn · lặp lại hằng tuần / tháng (bản mới tạo trong hàm đêm `doi-chieu-so`) · tệp đính kèm (`attachments` owner 'task').
 */

export type TaskFilter = {
  branchId?: number | null;
  group?: string | null;
  /** VH-1: lọc nhóm tự đặt — id nhóm, hoặc `'none'` = Không phân loại. */
  groupId?: number | 'none' | null;
  /**
   * PR-Ra: `undefined` = TẤT CẢ (giữ nghĩa cũ — `listMgmtTasks(p, {})` của các phép kiểm trước
   * PR-Ra không được đổi ý). `'mo'` = chưa khép (mặc định GIAO DIỆN, route tự điền khi thiếu).
   * `'tat-ca'` = tường minh tất cả. Ngoài ra nhận đúng một trong năm trạng thái cụ thể.
   */
  progress?: string | null;
  /** PR-Ra: một trong bốn hàng số (Q8), hoặc `'tat-ca'`. */
  hang?: string | null;
  assigneeUserId?: number | null;
  /** Tuần cập nhật — lọc theo các lần cập nhật, không lọc theo ngày tạo công việc. */
  periodId?: number | null;
  /** VH-1: chỉ đếm (Tổng quan QL) — bỏ hai câu người theo dõi + hàng nhóm. */
  chiDem?: boolean;
};

/**
 * PR-UXF-a Q16 (G-10): hạn gốc + số lần DỜI từ lịch sử `due_date` (sắp theo id tăng). Dòng `old` null = lần ĐẶT hạn đầu — không phải dời.
 * `hanGoc` = hạn đặt đầu tiên (`old` của dòng dời đầu, hoặc `new` của dòng đặt); chỉ có khi đã dời ít nhất một lần.
 */
export function hanGocCua(hist: readonly { old: string | null; new: string | null; reason: string | null }[]):
  { hanGoc: string | null; lyDoDoiHan: string | null; soLanDoiHan: number } {
  const doi = hist.filter((h) => h.old !== null);
  if (!doi.length) return { hanGoc: null, lyDoDoiHan: null, soLanDoiHan: 0 };
  return { hanGoc: hist[0].old ?? hist[0].new, lyDoDoiHan: doi[doi.length - 1].reason, soLanDoiHan: doi.length };
}

/** VH-1: principal chỉ còn grant CX — CX quản lý việc Vận hành theo `work.view` của grant CX (N59), không mở `meeting.edit` cho CX ở chỗ khác. */
const chiCx = (p: Principal): Principal => ({ ...p, grants: p.grants.filter((g) => g.roleKey === 'cx') });
/** VH-1 (N59): Head (`meeting.edit`) · Quản trị (`admin.config`) · CX trong phạm vi grant. */
export function quanLyVanHanh(p: Principal, ctx: { branchId: number | null; anyScope?: boolean }): boolean {
  return can(p, PERMISSIONS.MEETING_EDIT, ctx) || can(p, PERMISSIONS.ADMIN_CONFIG, ctx) || can(chiCx(p), PERMISSIONS.WORK_VIEW, ctx);
}

/** Toàn bộ tab chỉ dành cho Quản trị hệ thống, Quản lý chi nhánh (mục 8.3) và CX (VH-1, N59). */
export function canSeeBoard(p: Principal): boolean {
  return quanLyVanHanh(p, { branchId: null, anyScope: true });
}

/** Chi nhánh của bảng Vận hành: `meeting.edit` ∪ `work.view` của grant CX. */
function phamVi(p: Principal): Scope {
  const a = scopeFor(p, PERMISSIONS.MEETING_EDIT);
  const b = scopeFor(chiCx(p), PERMISSIONS.WORK_VIEW);
  const all = a.all || b.all || scopeFor(p, PERMISSIONS.ADMIN_CONFIG).all;
  const branchIds = [...new Set([...a.branchIds, ...b.branchIds])];
  return { all, branchIds, classIds: [], none: !all && !branchIds.length };
}

/**
 * `canSeeBoard` chỉ hỏi "có vai trò Quản lý/Quản trị KHÔNG, bất kỳ chi nhánh nào" — đúng cho
 * việc mở TAB (mục 8.3), nhưng dùng làm cửa chặn một VIỆC CỤ THỂ thì rò: Quản lý chi nhánh A
 * qua được cửa này rồi xem/sửa được việc của chi nhánh B (lỗ đã có trên `main`, không phải PR
 * này sinh ra, nhưng PR đang chạm đúng những đường này nên sửa luôn). Ràng đúng theo CHI NHÁNH
 * CỦA VIỆC — như `createMgmtTask`/`editMgmtTask` (PATCH) đã làm: việc "Toàn hệ thống"
 * (`branch_id IS NULL`) thì `anyScope`, việc có chi nhánh thì phải đúng chi nhánh đó.
 */
function coQuyenViec(p: Principal, t: { branch_id: number | null }): boolean {
  /* Luật main: việc Toàn hệ thống — Head (và CX, N59) mọi chi nhánh sửa được (`anyScope`). PTA rà lần 2 rút quyết định "chỉ grant toàn hệ thống". */
  return quanLyVanHanh(p, { branchId: t.branch_id ?? null, anyScope: !t.branch_id });
}
/** Xem như quản lý: việc của chi nhánh trong phạm vi, hoặc việc Toàn hệ thống (Head / CX mọi chi nhánh đọc được — bảng Vận hành vẫn liệt kê). */
const xemQuanLy = coQuyenViec;

const closed = (pr: string) => (TASK_PROGRESS_CLOSED as readonly string[]).includes(pr);

/** Tối đa hai tên, phần còn lại gộp "và n việc khác" (Q11) — dòng phụ ở giao diện không được dài vô hạn. */
function tenViecConMo(titles: string[]): string {
  const shown = titles.slice(0, 2).map((t) => `"${t}"`);
  const rest = titles.length - shown.length;
  return shown.join(', ') + (rest > 0 ? ` và ${rest} việc khác` : '');
}

// ---------------------------------------------------------------- nhóm tự đặt (VH-1)

export type NhomViec = { id: number; ten: string; thuTu: number; an: boolean; branchId: number | null; khoa: string | null; coTheSua: boolean };
const NHOM_COT = 'id, ten, thu_tu, an, branch_id, khoa';
/** C-5 (N63 ⑧): 4 nhóm Vận hành khởi đầu (có `khoa`) chỉ Quản trị sửa; nhóm khác theo quản lý Vận hành của chi nhánh. */
const suaDuocNhom = (p: Principal, g: { khoa?: string | null; branch_id?: number | null }) =>
  g.khoa ? can(p, PERMISSIONS.ADMIN_CONFIG, { branchId: null }) : quanLyVanHanh(p, { branchId: g.branch_id ?? null });
const nhomRa = (p: Principal) => (g: any): NhomViec => ({
  id: g.id, ten: g.ten, thuTu: g.thu_tu, an: !!g.an, branchId: g.branch_id ?? null, khoa: g.khoa ?? null,
  coTheSua: suaDuocNhom(p, g),
});

/**
 * Nhóm của bảng / ô chọn: dùng chung + của các chi nhánh trong phạm vi (`branchId` có → chỉ dùng chung + chi nhánh đó). MỘT câu.
 * Ẩn vẫn trả (`an`) — hộp Nhóm công việc hiện "Hiện"; ô chọn tạo việc tự bỏ nhóm ẩn.
 */
export function listNhom(p: Principal, branchId?: number | null): { rows: NhomViec[] } {
  if (!canSeeBoard(p)) throw forbidden('Chỉ Head, Quản trị hoặc CX xem được nhóm công việc.');
  const sc = phamVi(p);
  const cn = branchId ? [branchId] : sc.all ? null : sc.branchIds;
  if (branchId && !sc.all && !sc.branchIds.includes(branchId)) return { rows: [] };   // ngoài phạm vi: rỗng (như danh sách việc)
  return { rows: docNhom(p, cn) };
}
/** Nhóm dùng chung + của các chi nhánh `cn` (null = mọi chi nhánh) — MỘT câu, sắp theo thứ tự. */
const docNhom = (p: Principal, cn: number[] | null): NhomViec[] =>
  (db().prepare(`SELECT ${NHOM_COT} FROM task_groups WHERE branch_id IS NULL${cn ? ` OR branch_id IN (${DS_JSON})` : ' OR 1'} ORDER BY thu_tu, id`)
    .all(...(cn ? [JSON.stringify(cn)] : [])) as any[]).map(nhomRa(p));

const tenNhom = (v: unknown) => {
  const s = chuTuDo(v, 'Tên nhóm', 60);
  if (!s) throw badRequest('Nhóm phải có tên.');
  return s;
};
/** Trùng tên trong cùng ô chọn: nhóm chi nhánh so với nhóm cùng chi nhánh + nhóm dùng chung; nhóm dùng chung so với mọi nhóm. */
const trungTen = (ten: string, branchId: number | null, boId: number | null) =>
  !!db().prepare(`SELECT 1 FROM task_groups WHERE lower(ten) = lower(?) AND (branch_id IS ? OR branch_id IS NULL OR ? IS NULL) AND id IS NOT ?`).get(ten, branchId, branchId, boId);

export function taoNhom(p: Principal, input: { ten?: unknown; branchId?: number | null }): { rows: NhomViec[] } {
  const branchId = input.branchId ?? null;
  if (!quanLyVanHanh(p, { branchId })) throw forbidden(branchId ? 'Chỉ Head, Quản trị hoặc CX của chi nhánh tạo được nhóm.' : 'Nhóm dùng chung chỉ người có quyền toàn hệ thống tạo được — chọn chi nhánh.');
  if (branchId !== null && !db().prepare('SELECT 1 FROM branches WHERE id = ?').get(branchId)) throw badRequest('Chi nhánh không hợp lệ.');
  const ten = tenNhom(input.ten);
  if (trungTen(ten, branchId, null)) throw badRequest('Đã có nhóm cùng tên.');
  tx(() => {
    const id = Number(db().prepare(`INSERT INTO task_groups (ten, thu_tu, an, branch_id, tao_boi, tao_luc)
        VALUES (?, (SELECT COALESCE(MAX(thu_tu), 0) + 1 FROM task_groups), 0, ?, ?, ?)`).run(ten, branchId, p.userId, nowIso()).lastInsertRowid);
    writeAudit({ actorUserId: p.userId, action: 'task_group.create', entityType: 'task_group', entityId: id, entityLabel: ten, after: { branchId } });
  });
  return listNhom(p, branchId);
}

/** Đổi tên · ẩn / hiện · sắp ▲▼ (`doi` −1 / +1: đổi chỗ với nhóm kề CÙNG phạm vi — cùng chi nhánh hoặc cùng dùng chung). */
export function suaNhom(p: Principal, id: number, input: { ten?: unknown; an?: unknown; doi?: unknown; branchId?: number | null }): { rows: NhomViec[] } {
  const g = db().prepare(`SELECT ${NHOM_COT} FROM task_groups WHERE id = ?`).get(id) as any;
  if (!g) throw notFound('Không tìm thấy nhóm.');
  if (!suaDuocNhom(p, g)) throw forbidden(g.khoa ? 'Nhóm khởi đầu chỉ Quản trị sửa được.' : g.branch_id ? 'Chỉ Head, Quản trị hoặc CX của chi nhánh sửa được nhóm này.' : 'Nhóm dùng chung chỉ người có quyền toàn hệ thống sửa được.');
  tx(() => {
    const CHAM = 'Nhóm vừa được người khác sửa — mở lại hộp Nhóm để xem.';
    if (input.ten !== undefined) {
      const ten = tenNhom(input.ten);
      if (ten !== g.ten) {
        if (trungTen(ten, g.branch_id ?? null, id)) throw badRequest('Đã có nhóm cùng tên.');
        if (!db().prepare('UPDATE task_groups SET ten = ? WHERE id = ? AND ten = ?').run(ten, id, g.ten).changes) throw conflict(CHAM);
        writeAudit({ actorUserId: p.userId, action: 'task_group.rename', entityType: 'task_group', entityId: id, entityLabel: ten, before: { ten: g.ten }, after: { ten } });
      }
    }
    if (input.an !== undefined) {
      const an = input.an ? 1 : 0;
      if (an !== g.an) {
        db().prepare('UPDATE task_groups SET an = ? WHERE id = ?').run(an, id);
        writeAudit({ actorUserId: p.userId, action: an ? 'task_group.hide' : 'task_group.show', entityType: 'task_group', entityId: id, entityLabel: g.ten });
      }
    }
    if (input.doi !== undefined) {
      const huong = Number(input.doi);
      if (huong !== -1 && huong !== 1) throw badRequest('Hướng sắp không hợp lệ.');
      const ke = db().prepare(`SELECT id, thu_tu FROM task_groups WHERE branch_id IS ? AND id != ?
          AND (thu_tu ${huong < 0 ? '<' : '>'} ? OR (thu_tu = ? AND id ${huong < 0 ? '<' : '>'} ?))
          ORDER BY thu_tu ${huong < 0 ? 'DESC' : 'ASC'}, id ${huong < 0 ? 'DESC' : 'ASC'} LIMIT 1`).get(g.branch_id ?? null, id, g.thu_tu, g.thu_tu, id) as any;
      if (ke) {
        /* Cùng thứ tự (dữ liệu cũ) → tách ra trước khi đổi chỗ. */
        const [a, b] = ke.thu_tu === g.thu_tu ? (huong < 0 ? [g.thu_tu - 1, g.thu_tu] : [g.thu_tu + 1, g.thu_tu]) : [ke.thu_tu, g.thu_tu];
        if (!db().prepare('UPDATE task_groups SET thu_tu = ? WHERE id = ? AND thu_tu = ?').run(a, id, g.thu_tu).changes) throw conflict(CHAM);
        db().prepare('UPDATE task_groups SET thu_tu = ? WHERE id = ?').run(b, ke.id);
      }
    }
  });
  return listNhom(p, input.branchId ?? g.branch_id ?? null);
}

/**
 * Nhóm cho một việc: `groupId` (mới) hoặc `group` (khoá nhóm khởi đầu — web cũ trước VH-2). Không chọn = "Không phân loại" (null).
 * Nhóm phải dùng chung hoặc cùng chi nhánh của việc; nhóm ẨN không chọn được cho việc mới / đổi nhóm (việc cũ giữ — chỉ kiểm khi đổi).
 */
function nhomChoViec(input: { groupId?: unknown; group?: unknown }, branchId: number | null, cu: number | null = null): number | null | undefined {
  let id: number | null;
  if (input.groupId !== undefined) id = input.groupId === null || input.groupId === '' ? null : Number(input.groupId);
  else if (input.group !== undefined) {
    if (input.group === null || input.group === '') id = null;
    else {
      const r = db().prepare('SELECT id FROM task_groups WHERE khoa = ?').get(String(input.group)) as any;
      if (!r) throw badRequest('Nhóm không hợp lệ.');
      id = r.id;
    }
  } else return undefined;
  if (id === null || id === cu) return id;
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Nhóm không hợp lệ.');
  const g = db().prepare('SELECT branch_id, an FROM task_groups WHERE id = ?').get(id) as any;
  if (!g) throw badRequest('Không tìm thấy nhóm.');
  if (g.an) throw badRequest('Nhóm này đã ẩn — chọn nhóm khác hoặc Hiện lại nhóm.');
  if (g.branch_id != null && g.branch_id !== branchId) throw badRequest('Nhóm thuộc chi nhánh khác — chọn nhóm của chi nhánh việc hoặc nhóm dùng chung.');
  return id;
}

// ---------------------------------------------------------------- lặp lại (VH-1)

export type LapLai = { kieu: 'tuan' | 'thang'; ngay: number[] };
/** `{ kieu: 'tuan', ngay: [1,3] }` (thứ ISO, T2 = 1 … CN = 7) | `{ kieu: 'thang', ngay: [15] }` (ngày 1–31) | null = không lặp. */
export function docLap(v: unknown): LapLai | null {
  if (v == null || v === '') return null;
  const o = v as { kieu?: unknown; ngay?: unknown };
  const ngay = [...new Set((Array.isArray(o.ngay) ? o.ngay : [o.ngay]).map(Number))].sort((a, b) => a - b);
  if (o.kieu === 'tuan') {
    if (!ngay.length || ngay.some((n) => !Number.isInteger(n) || n < 1 || n > 7)) throw badRequest('Lặp hằng tuần: chọn ít nhất một thứ (T2 … CN).');
    return { kieu: 'tuan', ngay };
  }
  if (o.kieu === 'thang') {
    if (ngay.length !== 1 || !Number.isInteger(ngay[0]) || ngay[0] < 1 || ngay[0] > 31) throw badRequest('Lặp hằng tháng: gõ một ngày từ 1 đến 31.');
    return { kieu: 'thang', ngay };
  }
  throw badRequest('Kiểu lặp không hợp lệ (hằng tuần / hằng tháng).');
}
const lapCua = (r: { lap_kieu: string | null; lap_ngay: string | null }): LapLai | null =>
  r.lap_kieu ? { kieu: r.lap_kieu as LapLai['kieu'], ngay: String(r.lap_ngay ?? '').split(',').filter(Boolean).map(Number) } : null;

/** Thứ ISO của một ngày YYYY-MM-DD (T2 = 1 … CN = 7). */
const thuIso = (d: string) => ((new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
const cuoiThang = (d: string) => new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)), 0)).getUTCDate();
/**
 * Kỳ GẦN NHẤT ≤ `homNay` của một lịch lặp (hằng tháng ngày 31 → ngày cuối tháng ngắn). null khi 31 ngày gần nhất không có kỳ nào (không xảy ra với lịch hợp lệ).
 * ponytail: đêm hàm định kỳ lỗi bỏ lỡ HAI kỳ liền thì chỉ tạo kỳ gần nhất — đủ cho việc vận hành; muốn bù từng kỳ thì lặp từ `lap_ky` cũ.
 */
export function kyGanNhat(lap: LapLai, homNay: string): string | null {
  for (let i = 0; i <= 31; i++) {
    const d = addDays(homNay, -i);
    if (lap.kieu === 'tuan' ? lap.ngay.includes(thuIso(d)) : Number(d.slice(8, 10)) === Math.min(lap.ngay[0], cuoiThang(d))) return d;
  }
  return null;
}

/**
 * HÀM ĐÊM (`ops/doiChieuSo.ts`, MỘT lần mỗi đêm — lượt đầu; chạy lại không đổi): mỗi việc gốc còn lặp (chưa Dừng lặp, chưa Dừng hẳn) tới kỳ mới
 * (> kỳ của việc gốc và > `lap_tu`, chưa có bản kỳ đó) → bản mới kèm việc con (trạng thái mới, hạn = kỳ + khoảng hạn của bản gốc, người theo dõi chép theo).
 * Người phụ trách bản mới = người của BẢN GẦN NHẤT trong chuỗi nếu còn hiệu lực, không thì của việc gốc nếu còn hiệu lực, không thì "Chưa giao" (PTA mục 4).
 * Không tạo trùng: khoá duy nhất (`lap_goc_id`, `lap_ky`) + `ON CONFLICT DO NOTHING` — bản con trỏ việc con mẫu. Một việc gốc lỗi không chặn việc khác.
 * Đọc mỗi đêm: 1 câu việc gốc (chỉ mục một phần `idx_tasks_lap_mo`, dòng = số việc gốc còn lặp) + 1 câu bản đã có (chỉ khi có việc tới kỳ); ghi khi tới kỳ.
 */
export function taoViecLap(homNay = demoToday()): { goc: number; tao: number; loi: number } {
  const conn = db();
  const goc = (conn.prepare(`SELECT * FROM tasks INDEXED BY idx_tasks_lap_mo WHERE lap_kieu IS NOT NULL AND lap_dung_luc IS NULL`).all() as any[])
    .filter((g) => !g.parent_task_id && !g.lap_goc_id && g.progress !== 'stopped');
  const moc = (g: any) => [g.lap_ky ?? g.created_at.slice(0, 10), g.lap_tu ?? ''].sort().pop()!;
  const toiKy = goc.map((g) => ({ g, ky: kyGanNhat(lapCua(g)!, homNay) })).filter((x) => x.ky && x.ky > moc(x.g));
  if (!toiKy.length) return { goc: goc.length, tao: 0, loi: 0 };
  const co = new Set((conn.prepare(`SELECT t.lap_goc_id || ':' || t.lap_ky AS k FROM json_each(?) j
      JOIN tasks t ON t.lap_goc_id = json_extract(j.value, '$[0]') AND t.lap_ky = json_extract(j.value, '$[1]')`)
    .all(JSON.stringify(toiKy.map((x) => [x.g.id, x.ky]))) as any[]).map((r) => r.k as string));
  let tao = 0, loi = 0;
  /** Lớp liên quan của bản mới: lớp mẫu nếu còn hoạt động (và cùng chi nhánh), không thì bỏ. */
  const lopCon = (m: any): number | null => (m.class_id && (conn.prepare("SELECT 1 FROM classes WHERE id = ? AND status = 'active' AND (? IS NULL OR branch_id = ?)").get(m.class_id, m.branch_id ?? null, m.branch_id ?? null)) ? m.class_id : null);
  /** Người phụ trách của bản mới theo mẫu `m` (việc gốc / việc con mẫu). */
  const nguoiCua = (m: any): { uid: number | null; ten: string | null } => {
    const gan = conn.prepare('SELECT assignee_user_id FROM tasks WHERE lap_goc_id = ? ORDER BY lap_ky DESC LIMIT 1').get(m.id) as any;
    for (const r of [gan, m]) if (r?.assignee_user_id && laHieuLuc(r.assignee_user_id, m.branch_id ?? null)) return { uid: r.assignee_user_id, ten: null };
    return { uid: null, ten: m.assignee_user_id ? null : m.assignee_name ?? null };
  };
  for (const { g, ky } of toiKy) {
    if (co.has(`${g.id}:${ky}`)) continue;
    try {
      tx(() => {
        const banGoc = g.lap_ky ?? g.created_at.slice(0, 10);
        const chep = (m: any, parent: number | null): number | null => {
          const han = m.due_date ? addDays(ky!, diffDays(m.due_date, banGoc)) : null;
          const ng = nguoiCua(m);
          const r = conn.prepare(`INSERT INTO tasks (code, title, kind, task_type, group_id, parent_task_id, branch_id, assignee_user_id, assignee_name, due_date,
                progress, note, source_type, created_by, created_at, lap_goc_id, lap_ky, hang_muc, class_id)
              VALUES (?,?, 'branch_ops', ?,?,?,?,?,?,?, 'not_started', ?, 'lap', ?,?,?,?,?,?)
              ON CONFLICT(lap_goc_id, lap_ky) WHERE lap_goc_id IS NOT NULL DO NOTHING`)
            .run(nextCode(conn), m.title, m.task_type, parent ? g.group_id ?? null : m.group_id ?? null, parent, m.branch_id, ng.uid, ng.ten, han,
              m.note, m.created_by, nowIso(), m.id, ky, m.hang_muc ?? null, lopCon(m));
          if (!r.changes) return null;
          const id = Number(r.lastInsertRowid);
          /* VH-1b: học viên liên quan chép theo — chỉ em còn hợp lệ (chi nhánh / lớp của bản mới). */
          const hv = (conn.prepare('SELECT student_id FROM task_students WHERE task_id = ? AND case_id IS NULL').all(m.id) as any[]).map((x) => x.student_id as number);
          if (hv.length) { const giu = hvHopLe(hv, lopCon(m), m.branch_id ?? null); ghiHocVien(id, hv.filter((x) => giu.has(x))); }
          conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) SELECT 'van_hanh', ?, t.user_id, t.nguon, t.them_boi, ? FROM viec_theo_doi t
              WHERE t.loai = 'van_hanh' AND t.ref_id = ? AND ${HOAT_DONG_O('t.user_id', CN_VH('?'))} ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(id, nowIso(), m.id, m.branch_id);
          if (ng.uid) {
            notify({ userId: ng.uid, kind: 'giao_viec', title: `Việc lặp lại · ${m.title}`, body: han ? `Hạn ${han.slice(8, 10)}/${han.slice(5, 7)}` : null,
              dedupKey: `vh:lap:${id}`, duong: `/cong-viec?viec=mgmt:${id}`, han });
          }
          tao += 1;
          return id;
        };
        const moi = chep(g, null);
        if (moi === null) return;
        for (const c of conn.prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY id').all(g.id) as any[]) chep(c, moi);
        writeAudit({ actorUserId: null, action: 'mgmt_task.lap', entityType: 'task', entityId: moi, entityLabel: g.title, after: { goc: g.id, ky } });
      });
    } catch (e) {
      loi += 1;
      console.error('[viec-lap] không tạo được bản lặp', g.id, ky, e);
    }
  }
  return { goc: goc.length, tao, loi };
}

/** Dừng lặp (`dung` true) / Hoàn tác Dừng lặp (false) — trên việc gốc (gọi từ bản nào cũng được). Bản đang mở giữ nguyên. */
export function dungLap(p: Principal, taskId: number, dung: boolean) {
  const t = docTask(taskId);
  const gocId = t.lap_goc_id && !t.parent_task_id ? t.lap_goc_id : t.id;
  const g = gocId === t.id ? t : docTask(gocId);
  if (!g.lap_kieu) throw badRequest('Việc này không lặp lại.');
  if (!coQuyenViec(p, g)) throw forbidden('Chỉ Head, Quản trị hoặc CX của chi nhánh dừng lặp được.');
  if (!!g.lap_dung_luc === dung) return mgmtTaskDetail(p, taskId);
  tx(() => {
    /* PTA mục 8: Hoàn tác Dừng lặp → kỳ kế tính từ hôm nay (`lap_tu` = hôm qua), không sinh bản cho kỳ đã qua lúc đang dừng. */
    if (!db().prepare(`UPDATE tasks SET lap_dung_luc = ?, lap_tu = CASE WHEN ? THEN lap_tu ELSE ? END WHERE id = ? AND lap_dung_luc IS ?`)
      .run(dung ? nowIso() : null, dung ? 1 : 0, addDays(demoToday(), -1), gocId, g.lap_dung_luc ?? null).changes) {
      throw conflict('Việc vừa được người khác sửa — mở lại để xem.');
    }
    db().prepare(`INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'lap_dung', ?, ?, ?, ?)`)
      .run(gocId, dung ? null : '1', dung ? '1' : null, p.userId, nowIso());
    writeAudit({ actorUserId: p.userId, action: dung ? 'mgmt_task.dung_lap' : 'mgmt_task.tiep_lap', entityType: 'task', entityId: gocId, entityLabel: g.title });
  });
  return mgmtTaskDetail(p, taskId);
}

// ---------------------------------------------------------------- đọc

/**
 * Bảng công việc quản lý (PR-Ra: viết lại theo "tải một lần, lọc bằng JS" — bốn câu SQL cố
 * định thay vì một câu chính + N câu đếm facet riêng từng cột):
 *   (1) dòng gốc trong phạm vi (chi nhánh + người phụ trách), kèm tên người, help_*, nhóm, lặp lại (của việc gốc), số tệp.
 *   (2) việc con của các dòng đó.
 *   (3) lần cập nhật mới nhất của các dòng đó.
 *   (4) lịch sử dời hạn (`task_history.field = 'due_date'`) của các dòng đó.
 *   (5) VH-1: người theo dõi của các dòng đó · (6) nhóm của phạm vi (hàng nhóm, kể cả nhóm chưa có việc).
 * Lọc nhóm/trạng thái/hàng số và tính facet đều chạy trong JS qua `shared/domain/congViec.ts`,
 * để LUẬT chỉ có một chỗ (dùng lại y hệt Task 2, đã kiểm riêng ở đó).
 */
export function listMgmtTasks(p: Principal, f: TaskFilter = {}) {
  if (!canSeeBoard(p)) return { rows: [], canEdit: false, scopeEmpty: true };
  const conn = db();
  const scope = phamVi(p);
  const today = demoToday();
  /* PTA rà #1929: lọc chi nhánh ngoài phạm vi → danh sách RỖNG (như main: người có vai khác ở chi nhánh đó, chỉ số Tổng quan không vỡ) — không đọc việc / nhóm chi nhánh đó. */
  const ngoai = !!f.branchId && !scope.all && !scope.branchIds.includes(f.branchId);

  const base: string[] = ['t.parent_task_id IS NULL', 't.cha_loai IS NULL', "t.kind = 'branch_ops'", ...(ngoai ? ['0'] : [])];   // 4.6: việc con của việc Ý thức không lên bảng Vận hành
  const baseParams: unknown[] = [];
  if (f.branchId) { base.push('t.branch_id = ?'); baseParams.push(f.branchId); }
  else if (!scope.all && scope.branchIds.length) {
    base.push(`(t.branch_id IS NULL OR t.branch_id IN (${scope.branchIds.map(() => '?').join(',')}))`);
    baseParams.push(...scope.branchIds);
  }
  if (f.assigneeUserId) { base.push('t.assignee_user_id = ?'); baseParams.push(f.assigneeUserId); }
  if (f.groupId === 'none') base.push('t.group_id IS NULL');
  else if (f.groupId) { base.push('t.group_id = ?'); baseParams.push(f.groupId); }
  /*
   * LỌC THEO TUẦN CẬP NHẬT: giữ những việc CÓ cập nhật trong tuần đó. Việc chưa xong mà tuần
   * đó không ai động vào thì VẪN HIỆN — đó chính là việc cần hỏi "tuần rồi sao không ai làm".
   */
  if (f.periodId) {
    base.push(`(EXISTS (SELECT 1 FROM task_updates u WHERE u.task_id = t.id AND u.period_id = ?)
                 OR t.progress NOT IN ('done','stopped'))`);
    baseParams.push(f.periodId);
  }

  // (1) dòng gốc
  const rows = conn
    .prepare(
      `SELECT t.*, b.name AS branch_name,
              COALESCE(a.full_name, t.assignee_name) AS assignee_name, t.assignee_name AS ten_ngoai,
              h.full_name AS help_user_name, g.khoa AS nhom_khoa, g.ten AS nhom_ten, g.thu_tu AS nhom_thu_tu, vc.code AS lop_code,
              COALESCE(t.lap_kieu, lg.lap_kieu) AS lap_kieu_hl, COALESCE(t.lap_ngay, lg.lap_ngay) AS lap_ngay_hl, COALESCE(t.lap_dung_luc, lg.lap_dung_luc) AS lap_dung_hl,
              (SELECT COUNT(*) FROM task_case_links l WHERE l.task_id = t.id) AS case_links,
              ${f.chiDem ? '0' : "(SELECT COUNT(*) FROM attachments f WHERE f.owner_type = 'task' AND f.owner_id = t.id)"} AS so_tep
         FROM tasks t
         LEFT JOIN branches b ON b.id = t.branch_id
         LEFT JOIN users a ON a.id = t.assignee_user_id
         LEFT JOIN users h ON h.id = t.help_user_id
         LEFT JOIN task_groups g ON g.id = t.group_id
         LEFT JOIN classes vc ON vc.id = t.class_id
         LEFT JOIN tasks lg ON lg.id = t.lap_goc_id
        WHERE ${base.join(' AND ')}
        ORDER BY (t.progress IN ('done','stopped')), t.due_date IS NULL, t.due_date, t.id DESC`,
    )
    .all(...baseParams) as any[];

  const ids = rows.map((r) => r.id);
  const ph = ids.length ? ids.map(() => '?').join(',') : null;

  // (2) việc con
  const childrenOf = new Map<number, any[]>();
  if (ph) {
    for (const c of conn
      .prepare(`SELECT parent_task_id, id, title, progress, due_date FROM tasks WHERE parent_task_id IN (${ph})`)
      .all(...ids) as any[]) {
      (childrenOf.get(c.parent_task_id) ?? childrenOf.set(c.parent_task_id, []).get(c.parent_task_id)!).push(c);
    }
  }

  // (3) lần cập nhật mới nhất
  const lastOf = new Map<number, any>();
  if (ph) {
    for (const u of conn
      .prepare(
        `SELECT u.*, us.full_name AS actor_name FROM task_updates u
           LEFT JOIN users us ON us.id = u.actor_user_id
          WHERE u.task_id IN (${ph}) ORDER BY u.updated_on DESC, u.id DESC`,
      )
      .all(...ids) as any[]) {
      if (!lastOf.has(u.task_id)) lastOf.set(u.task_id, u);
    }
  }

  // (4) lịch sử hạn (đặt hạn + dời hạn)
  const dueHistOf = new Map<number, { old_value: string; new_value: string; reason: string | null; created_at: string }[]>();
  if (ph) {
    for (const h of conn
      .prepare(
        `SELECT task_id, old_value, new_value, reason, created_at FROM task_history
          WHERE field = 'due_date' AND task_id IN (${ph}) ORDER BY task_id, id ASC`,
      )
      .all(...ids) as any[]) {
      (dueHistOf.get(h.task_id) ?? dueHistOf.set(h.task_id, []).get(h.task_id)!).push(h);
    }
  }

  // (5) người theo dõi (VH-1) — một câu cho cả bảng
  const theoDoiOf = new Map<number, { id: number; ten: string | null }[]>();
  if (ids.length && !f.chiDem) {
    for (const r of conn.prepare(`SELECT t.ref_id, t.user_id, u.full_name FROM viec_theo_doi t LEFT JOIN users u ON u.id = t.user_id
        WHERE t.loai = 'van_hanh' AND t.ref_id IN (${DS_JSON}) ORDER BY t.id`).all(JSON.stringify(ids)) as any[]) {
      (theoDoiOf.get(r.ref_id) ?? theoDoiOf.set(r.ref_id, []).get(r.ref_id)!).push({ id: r.user_id, ten: r.full_name ?? null });
    }
  }

  const withDomain = rows.map((r) => {
    const children = childrenOf.get(r.id) ?? [];
    return {
      raw: r,
      progress: r.progress as TaskProgress,
      due: r.due_date as string | null,
      reviewOn: r.review_on as string | null,
      completedAt: r.completed_at as string | null,
      subOpen: children.filter((c) => !closed(c.progress)).length,
      subTotal: children.length,
      group: r.nhom_khoa as TaskGroup,
      assigneeUserId: r.assignee_user_id as number | null,
    };
  });

  /* `undefined` (không truyền progress) = TẤT CẢ — giữ nghĩa cũ của `listMgmtTasks(p, {})`. */
  const filterOpts = {
    group: (f.group as TaskGroup) || undefined,
    progress: (f.progress as TrangThaiLoc) || 'tat-ca',
    hang: (f.hang as HangSo) || undefined,
  };
  const filtered = locVanHanh(withDomain as unknown as DongVanHanh[], filterOpts, today) as unknown as typeof withDomain;
  const facets = facetVanHanh(withDomain as unknown as DongVanHanh[], filterOpts, today);

  const rowsOut = filtered.map((w) => {
    const r = w.raw;
    const children = childrenOf.get(r.id) ?? [];
    const subDone = children.filter((c) => c.progress === 'done').length;
    const overdueChildren = children.filter((c) => !closed(c.progress) && c.due_date && c.due_date < today);
    const hist = dueHistOf.get(r.id) ?? [];
    const lu = lastOf.get(r.id);
    const td = theoDoiOf.get(r.id) ?? [];
    return {
      id: r.id, code: r.code, title: r.title,
      group: (r.nhom_khoa ?? null) as TaskGroup | null,
      /** VH-1: nhóm tự đặt (null = Không phân loại). */
      groupId: r.group_id ?? null, groupName: r.nhom_ten ?? null, groupOrder: r.nhom_thu_tu ?? null,
      /** VH-1b (N62): hạng mục chính thống (null = tab Vận hành) + lớp liên quan. */
      hangMuc: r.hang_muc ? chuanHangMuc(r.hang_muc) : null, classId: r.class_id ?? null, classCode: r.lop_code ?? null,   // A2-03: việc cũ `bao-ph-test` hiện như `bao-ph`
      taskType: r.task_type as string,
      /** Quyền sửa THẬT của dòng (PTA rà lần 2) — việc chi nhánh khác trong phạm vi đọc mà không sửa được thì false. */
      canEdit: coQuyenViec(p, r),
      branchId: r.branch_id, branchName: r.branch_name ?? 'Toàn hệ thống',
      assigneeUserId: r.assignee_user_id, assigneeName: r.assignee_name ?? null,
      /** PR-DUYET: người phụ trách là tên gõ tay, không phải tài khoản — hiện nhãn "ngoài hệ thống". */
      assigneeNgoai: !r.assignee_user_id && !!r.ten_ngoai,
      ...watcherCu(td, r.created_by),
      theoDoi: td,
      lap: r.lap_kieu_hl ? { ...lapCua({ lap_kieu: r.lap_kieu_hl, lap_ngay: r.lap_ngay_hl })!, dung: !!r.lap_dung_hl, gocId: r.lap_goc_id ?? r.id } : null,
      soTep: r.so_tep as number,
      due: r.due_date as string | null,
      progress: r.progress as TaskProgress,
      progressLabel: TASK_PROGRESS_LABEL[r.progress as TaskProgress] ?? r.progress,
      stopReason: r.stop_reason ?? null,
      reviewOn: r.review_on ?? null,
      helpUserId: r.help_user_id ?? null,
      helpName: r.help_user_name ?? r.help_name ?? null,
      /* QUÁ HẠN là THUỘC TÍNH của việc, không phải một bản ghi riêng (mục 2.2). */
      overdue: !closed(r.progress) && !!r.due_date && r.due_date < today,
      /* "2/4 việc con hoàn thành" — KHÔNG quy thành 50% khối lượng (mục 8.6). */
      subTotal: children.length,
      subDone,
      subOpen: w.subOpen,
      subOverdue: overdueChildren.length > 0,
      subOverdueCount: overdueChildren.length,
      subOverdueTitles: overdueChildren.slice(0, 2).map((c: any) => c.title as string),
      caseLinks: r.case_links as number,
      /* Q9: hạn ĐẦU TIÊN trước mọi lần dời, và lý do của lần dời GẦN NHẤT. PR-UXF-a Q16: lần ĐẶT hạn đầu không phải "dời". */
      ...hanGocCua(hist.map((h) => ({ old: h.old_value ?? null, new: h.new_value ?? null, reason: h.reason ?? null }))),
      lastUpdate: lu
        ? {
          on: lu.updated_on, progress: lu.progress,
          progressLabel: TASK_PROGRESS_LABEL[lu.progress as TaskProgress] ?? lu.progress,
          note: lu.note ?? null, by: lu.actor_name ?? null,
        }
        : null,
    };
  });

  // (6) nhóm của phạm vi — hàng nhóm của bảng (kể cả nhóm chưa có việc / đã ẩn còn việc), sắp theo thứ tự
  const cnNhom = f.branchId ? [f.branchId] : scope.all ? null : scope.branchIds;
  const nhom = f.chiDem || ngoai ? [] : docNhom(p, cnNhom);
  const demNhom = new Map<number | null, number>();
  for (const r of rowsOut) demNhom.set(r.groupId, (demNhom.get(r.groupId) ?? 0) + 1);

  return {
    canEdit: true,
    scopeEmpty: false,
    facets,
    /* Bốn câu hỏi chồng nhau có chủ ý (Q8) — KHÔNG phải một phép chia cộng bằng tổng. */
    hangSo: facets.hang,
    /** VH-1: hàng nhóm — `n` = số việc (sau lọc) trong nhóm; `khongPhanLoai` = số việc không nhóm (hàng cuối). */
    nhom: nhom.map((g) => ({ ...g, n: demNhom.get(g.id) ?? 0 })),
    khongPhanLoai: demNhom.get(null) ?? 0,
    rows: rowsOut,
  };
}

/** Web trước VH-2 đọc MỘT người theo dõi — người đầu tiên khác người tạo (người tạo tự theo dõi). ponytail: bỏ khi VH-2 đọc `theoDoi`. */
const watcherCu = (td: { id: number; ten: string | null }[], tao: number | null) => {
  const w = td.find((x) => x.id !== tao) ?? null;
  return { watcherUserId: w?.id ?? null, watcherName: w?.ten ?? null };
};

function docTask(taskId: number): any {
  const t = db().prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc.');
  return t;
}

/** Tài khoản đang hoạt động, có vai đang hiệu lực ở chi nhánh của việc (việc Toàn hệ thống: vai ở đâu cũng được). */
export const laHieuLuc = (uid: number, branchId: number | null) =>
  (db().prepare(`SELECT ${HOAT_DONG_O('?', CN_VH('?'))} AS ok`).get(uid, branchId) as any).ok === 1;

/** Người xem một việc: quản lý · người phụ trách · người tạo · người theo dõi (còn hiệu lực) · người phụ trách việc con. */
function quyenXem(p: Principal, t: any) {
  const quanLy = coQuyenViec(p, t);
  /* PTA mục 7: người phụ trách / người tạo chỉ còn quyền theo việc khi còn hoạt động + còn vai ở chi nhánh của việc. */
  const conVai = (t.assignee_user_id === p.userId || t.created_by === p.userId) && laHieuLuc(p.userId, t.branch_id ?? null);
  const phuTrach = conVai && t.assignee_user_id === p.userId;
  const nguoiTao = conVai && t.created_by === p.userId;
  const xem = quanLy || xemQuanLy(p, t) || phuTrach || nguoiTao || laNguoiTheoDoi('van_hanh', t.id, p.userId, t.branch_id ?? null)
    || (!!db().prepare('SELECT 1 FROM tasks WHERE parent_task_id = ? AND assignee_user_id = ?').get(t.id, p.userId) && laHieuLuc(p.userId, t.branch_id ?? null));
  return { quanLy, phuTrach, nguoiTao, xem };
}

/**
 * AU-2111 P1-01 (cổng khu Công việc, `routes/index.ts`): người gọi có quyền theo MỘT việc Vận hành — cùng `quyenXem` của chi tiết (người phụ trách / phụ trách
 * việc con / người theo dõi / người tạo, còn hoạt động + còn vai). Không có việc → false (cổng trả 403, không lộ id). Quyền ghi vẫn do hàm dịch vụ kiểm.
 */
export function coQuyenTheoViec(p: Principal, taskId: number): boolean {
  const t = db().prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  return !!t && quyenXem(p, t).xem;
}

/** Một công việc, kèm việc con, lịch sử cập nhật, lịch sử dời hạn, các Case làm căn cứ, người theo dõi, nhóm, lặp lại, tệp. */
export function mgmtTaskDetail(p: Principal, taskId: number) {
  const conn = db();
  const t = docTask(taskId);
  /*
   * NGƯỜI ĐƯỢC GIAO XEM ĐƯỢC VIỆC CỦA MÌNH, kể cả khi không thấy toàn bộ tab (mục 8.3).
   * Giao việc cho giáo viên rồi không cho họ mở ra xem là giao việc bằng miệng.
   */
  const q = quyenXem(p, t);
  if (!q.xem) throw forbidden('Công việc này không được giao cho bạn.');
  const coQuyen = q.quanLy;

  const subs = conn
    .prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY due_date IS NULL, due_date, id')
    .all(taskId) as any[];
  const td = conn.prepare(`SELECT t.user_id, t.nguon, u.full_name FROM viec_theo_doi t LEFT JOIN users u ON u.id = t.user_id
      WHERE t.loai = 'van_hanh' AND t.ref_id = ? ORDER BY t.id`).all(taskId) as any[];
  /* VH-2 (V3): lịch sử đổi người · nhóm · hạng mục · lặp (`task_history`, cùng câu với lịch sử hạn) + theo dõi (`viec_giao_lan`) — +1 câu. */
  const hist = conn.prepare(`SELECT h.*, us.full_name AS actor_name FROM task_history h LEFT JOIN users us ON us.id = h.actor_user_id
      WHERE h.task_id = ? ORDER BY h.id ASC`).all(taskId) as any[];
  const lanTd = conn.prepare(`SELECT l.truong, l.cu, l.moi, l.luc, u.full_name AS nguoi FROM viec_giao_lan l LEFT JOIN users u ON u.id = l.boi
      WHERE l.loai = 'van_hanh' AND l.ref_id = ? ORDER BY l.id`).all(taskId) as any[];
  const soNguoi = (v: unknown) => (v != null && /^\d+$/.test(String(v)) ? Number(v) : null);
  const ids = [...new Set([t.assignee_user_id, t.help_user_id, t.created_by, ...subs.map((x) => x.assignee_user_id),
    ...hist.filter((h) => h.field === 'assignee_user_id').flatMap((h) => [soNguoi(h.old_value), soNguoi(h.new_value)]),
    ...lanTd.flatMap((l) => [soNguoi(l.cu), soNguoi(l.moi)])].filter((x): x is number => !!x))];
  const names = new Map<number, string>((conn.prepare(`SELECT id, full_name FROM users WHERE id IN (${DS_JSON})`).all(JSON.stringify(ids)) as any[])
    .map((r) => [r.id, r.full_name]));
  const today = demoToday();
  const openSubs = subs.filter((x) => !closed(x.progress));
  const nhom = t.group_id ? conn.prepare(`SELECT id, ten, khoa FROM task_groups WHERE id = ?`).get(t.group_id) as any : null;
  const goc = t.lap_goc_id && !t.parent_task_id ? conn.prepare('SELECT id, branch_id, lap_kieu, lap_ngay, lap_dung_luc FROM tasks WHERE id = ?').get(t.lap_goc_id) as any : t;

  const dueHistory = hist.filter((h) => h.field === 'due_date').map((h) => ({
      old: h.old_value ?? null, new: h.new_value ?? null, reason: h.reason ?? null,
      by: names.get(h.actor_user_id) ?? h.actor_name ?? null, at: h.created_at,
    }));
  const theoDoi = td.map((x) => ({ id: x.user_id as number, ten: x.full_name ?? null, nguon: x.nguon as string }));
  const tenNg = (v: unknown) => { const n = soNguoi(v); return n ? names.get(n) ?? null : null; };
  /* Nhóm cũ / mới của lịch sử: tên nhóm (một câu, chỉ khi có lần đổi nhóm). */
  const nhomIds = [...new Set(hist.filter((h) => h.field === 'group_id').flatMap((h) => [soNguoi(h.old_value), soNguoi(h.new_value)]).filter((x): x is number => !!x))];
  const tenNhomLs = new Map<number, string>(nhomIds.length ? (conn.prepare(`SELECT id, ten FROM task_groups WHERE id IN (${DS_JSON})`).all(JSON.stringify(nhomIds)) as any[]).map((r) => [r.id, r.ten]) : []);
  const lichSu: { luc: string; truong: string; cu: string | null; moi: string | null; nguoi: string | null }[] = [
    { luc: t.created_at, truong: t.lap_goc_id ? 'tao_ban_lap' : 'giao', cu: null, moi: t.lap_goc_id ? t.lap_ky ?? null : names.get(t.assignee_user_id) ?? null,
      nguoi: t.lap_goc_id ? null : names.get(t.created_by) ?? null },
    ...hist.filter((h) => ['assignee_user_id', 'group_id', 'hang_muc', 'lap', 'lap_dung'].includes(h.field)).map((h) => ({
      luc: h.created_at, truong: h.field, nguoi: names.get(h.actor_user_id) ?? h.actor_name ?? null,
      cu: h.field === 'assignee_user_id' ? tenNg(h.old_value) : h.field === 'group_id' ? tenNhomLs.get(soNguoi(h.old_value) ?? 0) ?? null : h.old_value ?? null,
      moi: h.field === 'assignee_user_id' ? tenNg(h.new_value) : h.field === 'group_id' ? tenNhomLs.get(soNguoi(h.new_value) ?? 0) ?? null : h.new_value ?? null,
    })),
    ...lanTd.filter((l) => l.truong === 'theo_doi').map((l) => ({ luc: l.luc, truong: 'theo_doi', cu: tenNg(l.cu), moi: tenNg(l.moi), nguoi: l.nguoi ?? null })),
  ];

  return {
    id: t.id, code: t.code, title: t.title, note: t.note ?? null,
    /** VH-1 (PTA mục 9): gửi lại làm `phienBan` khi sửa / cập nhật — người khác đã sửa trước → 409. */
    updatedAt: t.updated_at ?? null,
    group: (nhom?.khoa ?? null) as TaskGroup | null,
    groupId: t.group_id ?? null, groupName: nhom?.ten ?? null,
    /** VH-1b (N62): hạng mục, lớp + học viên liên quan (`note` = Mô tả của việc tay). */
    /* Việc con theo hạng mục / lớp của việc cha — cùng luật `/my-work` (COALESCE). */
    ...(() => {
      const cha = t.parent_task_id ? conn.prepare('SELECT hang_muc, class_id FROM tasks WHERE id = ?').get(t.parent_task_id) as any : null;
      const lopId = t.class_id ?? cha?.class_id ?? null;
      const hm = (cha ? cha.hang_muc : t.hang_muc) ?? null;
      return { hangMuc: hm ? chuanHangMuc(hm) : null, classId: lopId,
        classCode: lopId ? (conn.prepare('SELECT code FROM classes WHERE id = ?').get(lopId) as any)?.code ?? null : null };
    })(),
    hocVien: conn.prepare('SELECT s.id, s.full_name AS ten FROM task_students x JOIN students s ON s.id = x.student_id WHERE x.task_id = ? ORDER BY s.full_name').all(taskId) as { id: number; ten: string }[],
    taskType: t.task_type,
    branchId: t.branch_id,
    parentTaskId: t.parent_task_id ?? null,
    assigneeUserId: t.assignee_user_id, assigneeName: names.get(t.assignee_user_id) ?? t.assignee_name ?? null,
    assigneeNgoai: !t.assignee_user_id && !!t.assignee_name,
    ...watcherCu(theoDoi, t.created_by),
    theoDoi,
    createdBy: t.created_by ?? null, createdByName: names.get(t.created_by) ?? null,
    due: t.due_date ?? null, progress: t.progress,
    progressLabel: TASK_PROGRESS_LABEL[t.progress as TaskProgress] ?? t.progress,
    stopReason: t.stop_reason ?? null, reviewOn: t.review_on ?? null,
    helpUserId: t.help_user_id ?? null,
    helpName: (t.help_user_id ? names.get(t.help_user_id) : null) ?? t.help_name ?? null,
    overdue: !closed(t.progress) && !!t.due_date && t.due_date < today,
    /* PR-UXF-a Q16 (G-10): chi tiết trả CÙNG `hanGoc` với danh sách (web đang đọc `data.hanGoc` mà trước đây không có). */
    ...hanGocCua(dueHistory),
    dueHistory,
    /** VH-2 (V3): giao / bản lặp · đổi người · nhóm · hạng mục · lặp · dừng lặp · theo dõi (tên đã đọc sẵn). */
    lichSu,
    /** VH-1: lặp lại của việc gốc (bản theo kỳ đọc việc gốc) — `ky` = kỳ của bản này. */
    lap: goc?.lap_kieu ? { ...lapCua(goc)!, dung: !!goc.lap_dung_luc, gocId: goc.id, ky: t.lap_ky ?? null } : null,
    tep: (conn.prepare(`SELECT a.id, a.kind, a.display_name, a.url, a.mime_type, a.size_bytes, a.uploaded_by, u.full_name AS uploader_name, a.created_at
        FROM attachments a LEFT JOIN users u ON u.id = a.uploaded_by WHERE a.owner_type = 'task' AND a.owner_id = ? ORDER BY a.id`).all(taskId) as any[])
      .map((a) => ({ id: a.id, kind: a.kind, displayName: a.display_name, href: a.kind === 'link' ? a.url : `/api/attachments/${a.id}/download`,
        mimeType: a.mime_type ?? null, sizeBytes: a.size_bytes ?? null, uploadedBy: a.uploaded_by, uploadedByName: a.uploader_name ?? null, createdAt: a.created_at })),
    openSubTitles: openSubs.map((x) => x.title as string),
    subtasks: subs.map((x) => ({
      id: x.id, title: x.title, due: x.due_date ?? null, progress: x.progress,
      progressLabel: TASK_PROGRESS_LABEL[x.progress as TaskProgress] ?? x.progress,
      assigneeUserId: x.assignee_user_id, assigneeName: names.get(x.assignee_user_id) ?? null,
      stopReason: x.stop_reason ?? null,
      overdue: !closed(x.progress) && !!x.due_date && x.due_date < today,
    })),
    updates: (conn
      .prepare(
        `SELECT u.*, us.full_name AS actor_name FROM task_updates u
           LEFT JOIN users us ON us.id = u.actor_user_id
          WHERE u.task_id = ? ORDER BY u.updated_on DESC, u.id DESC`,
      )
      .all(taskId) as any[]).map((u) => ({
        id: u.id, on: u.updated_on, progress: u.progress,
        progressLabel: TASK_PROGRESS_LABEL[u.progress as TaskProgress] ?? u.progress,
        note: u.note ?? null, by: u.actor_name ?? null,
      })),
    /* Case làm CĂN CỨ — chỉ để tra, không điều khiển gì (mục 8.7). */
    cases: conn
      .prepare(
        `SELECT sc.id, sc.title, s.full_name AS student_name
           FROM task_case_links l JOIN sos_cases sc ON sc.id = l.case_id
          LEFT JOIN students s ON s.id = sc.student_id
          WHERE l.task_id = ? ORDER BY sc.id`,
      )
      .all(taskId) as any[],
    viewer: {
      canEdit: coQuyen,
      canUpdate: coQuyen || q.phuTrach,
      /** VH-1 (N59): người phụ trách + người giao sửa hạn (lý do tuỳ chọn) và người theo dõi; Head / QT / CX sửa mọi thứ. */
      canSuaHan: !closed(t.progress) && (coQuyen || q.phuTrach || q.nguoiTao),
      canSuaTheoDoi: coQuyen || q.phuTrach || q.nguoiTao,
      canTep: coQuyen || q.phuTrach || q.nguoiTao,
      canDungLap: !!goc?.lap_kieu && coQuyenViec(p, goc),
      /** R2 C8: Xoá (Thùng rác) — chưa có cập nhật; cùng hàm với `xoaViec`. */
      canXoa: quyenXoaViec(p, t) && chanXoaViec(t) === null,
    },
  };
}

/**
 * Mã việc kế tiếp (PTA mục 3): số lớn nhất của mã `CV…` (MỘT câu theo chỉ mục UNIQUE `code`, thứ tự chữ) + 1, rồi dò tới mã chưa có — `COUNT(*) + 1` cũ trùng mã
 * ngay khi từng có dòng bị xoá. Thứ tự chữ sai khi vượt 9 999 (`CV10000` < `CV9999`) → vòng dò bù (mỗi bước một câu theo chỉ mục).
 */
export function nextCode(conn: any): string {
  const max = (conn.prepare("SELECT code FROM tasks WHERE code >= 'CV-0' AND code < 'CV-:' ORDER BY code DESC LIMIT 1").get() as any)?.code as string | undefined;
  let n = (max ? Number(max.slice(3)) || 0 : 0) + 1;   // mã thật `CV-0001` (`padCode`); ponytail: thứ tự chữ sai từ CV-10000 — vòng dò bù
  while (conn.prepare('SELECT 1 FROM tasks WHERE code = ?').get(padCode('CV', n, 4))) n += 1;
  return padCode('CV', n, 4);
}

/** ID gửi lên phải là một tài khoản nhân_vien (giáo viên/quản lý) đang hoạt động, nếu có gửi — người cần hỗ trợ (Tạm ngưng). */
function kiemNguoi(label: string, userId: number | null | undefined) {
  if (userId && !laNguoiHopLe(userId, 'nhan_vien')) throw loi(400, '{label} không hợp lệ.', { label });
}
/**
 * VH-1 (N59): người phụ trách / người theo dõi việc Vận hành = tài khoản đang hoạt động có vai (MỌI vai, kể cả BPXL) ở chi nhánh của việc;
 * việc Toàn hệ thống → vai ở đâu cũng được (GIAO-VIEC-CN, chủ SP 10/11).
 */
function kiemNguoiVh(label: string, userId: number | null | undefined, branchId: number | null) {
  if (!userId) return;
  if (!Number.isInteger(userId) || userId <= 0 || !laHieuLuc(userId, branchId)) {
    throw loi(400, '{label} phải là tài khoản đang hoạt động có vai ở chi nhánh của công việc — chọn lại người.', { label });
  }
}
const TRAN_THEO_DOI = 20;
/** Người theo dõi gửi lên: người MỚI phải hợp lệ (400); người đã theo dõi (`cu`) mà nay hết hiệu lực thì lọc bỏ, không từ chối cả danh sách. */
function docTheoDoi(v: unknown, branchId: number | null, cu: readonly number[] = []): number[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) throw badRequest('Danh sách người theo dõi không hợp lệ.');
  const ds = [...new Set(v.map(Number))];
  if (ds.length > TRAN_THEO_DOI) throw loi(400, 'Tối đa {n} người theo dõi.', { n: TRAN_THEO_DOI });
  return ds.filter((u) => {
    if (cu.includes(u)) return laHieuLuc(u, branchId);
    kiemNguoiVh('Người theo dõi', u, branchId);
    return true;
  });
}

/**
 * PR-DUYET (PR-NEN Q12, YC-10): người phụ trách NGOÀI hệ thống — tên gõ tay (ví dụ "Tổ chuyên môn"), CHỈ khi không chọn tài khoản.
 * Không nhận thông báo, không sinh dòng việc cho ai. Người theo dõi vẫn chỉ là tài khoản (NEN Q13).
 */
function tenNgoai(userId: number | null | undefined, ten: unknown): string | null {
  if (userId) return null;
  const s = typeof ten === 'string' ? ten.trim() : '';
  if (!s) return null;
  if (s.length < 2) throw badRequest('Tên người phụ trách ngoài hệ thống cần ít nhất 2 ký tự.');
  if (s.length > 80) throw badRequest('Tên người phụ trách ngoài hệ thống tối đa 80 ký tự.');
  return s;
}

/** VH-1 (PTA mục 9): `phienBan` = `updatedAt` client đang thấy; có gửi mà lệch → 409. */
/** Phiên bản mới của việc: luôn LỚN HƠN bản cũ — hai lần ghi trong cùng một ms (vd Hoàn tác ngay sau khi người khác sửa) vẫn ra hai phiên bản khác nhau. */
const lucMoi = (cu: string | null | undefined): string => {
  const ms = Date.parse(cu ?? '');
  return Number.isFinite(ms) && Date.now() <= ms ? new Date(ms + 1).toISOString() : nowIso();
};
function kiemPhienBan(t: any, phienBan: unknown) {
  if (phienBan !== undefined && (phienBan === '' ? null : phienBan ?? null) !== (t.updated_at ?? null)) throw conflict('Công việc vừa được người khác sửa — mở lại để xem.');
}

/** Tin "Cập nhật" của việc Vận hành (người phụ trách + người theo dõi còn hiệu lực, trừ người làm). */
const bao = (t: any, boi: number, suKien: SuKien, chiTiet: string | null, khoa: number) =>
  baoTheoDoi('van_hanh', t.id, boi, { suKien, tieuDe: t.title, chiTiet, khoa });
const ngayNgan = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : 'không hạn');

/** A2-10 (AUDIT-2111): Mô tả việc Vận hành cùng trần với Mô tả việc của khối N58 (`TRAN_MO_TA` giaoViec). */
const TRAN_MO_TA_VH = 500;
/** VH-1b (N62): hạng mục chính thống (`HANG_MUC_CV`) | null (tab Vận hành) | undefined (không gửi — giữ nguyên). */
function docHangMuc(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (!laHangMucCv(v)) throw badRequest('Hạng mục không hợp lệ — chọn một mục của Công việc hoặc để trống.');
  return chuanHangMuc(v);
}
const TRAN_HV_LIEN_QUAN = 50;
/** VH-2: loại việc — không gửi → undefined (giữ như cũ); giá trị lạ → 400. */
function loaiViec(v: unknown): 'in_period' | 'long_term' | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (v === 'in_period' || v === 'long_term') return v;
  throw badRequest('Loại việc không hợp lệ (Trong kỳ / Dài hạn).');
}
/** Học viên hợp lệ cho việc: ở chi nhánh của việc (lớp đang học, không có → hồ sơ; việc Toàn hệ thống: mọi chi nhánh) và nếu có lớp thì đang học lớp đó. MỘT câu. */
function hvHopLe(ds: readonly number[], lop: number | null, branchId: number | null): Set<number> {
  if (!ds.length) return new Set();
  const co = db().prepare(`SELECT s.id, COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND e.status = 'active'
      ORDER BY e.id DESC LIMIT 1), s.branch_id) AS b,
      ${lop !== null ? `EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.class_id = ? AND e.status = 'active')` : '1'} AS trong_lop
    FROM students s WHERE s.id IN (${DS_JSON})`).all(...(lop !== null ? [lop] : []), JSON.stringify(ds)) as any[];
  return new Set(co.filter((r) => (branchId === null || r.b === branchId) && r.trong_lop).map((r) => r.id as number));
}
/**
 * VH-1b (N62): lớp + học viên liên quan (tuỳ chọn) — lớp cùng chi nhánh của việc; học viên hợp lệ (`hvHopLe`); ≤ 50. PTA rà #1936 (2): lớp / học viên phải
 * nằm trong phạm vi XEM của người gọi ở MỌI trường hợp (kể cả việc Toàn hệ thống) — không lộ tên lớp / em chi nhánh khác. Không gửi cả hai → undefined.
 */
function docLienQuan(p: Principal, classId: unknown, studentIds: unknown, branchId: number | null,
  /** PTA rà lần 2 #1936 (3): lớp / HV ĐANG CÓ của việc (chi nhánh + lớp không đổi) — gửi lại không kiểm lại (em đã chuyển lớp vẫn giữ tới khi người dùng bỏ). */
  daCo?: { classId: number | null; studentIds: readonly number[] }): { classId: number | null; studentIds: number[] } | undefined {
  if (classId === undefined && studentIds === undefined) return undefined;
  const lop = classId == null || classId === '' ? null : Number(classId);
  if (lop !== null && !(daCo && lop === daCo.classId)) {
    if (!Number.isInteger(lop) || lop <= 0) throw badRequest('Lớp không hợp lệ.');
    const c = db().prepare('SELECT branch_id FROM classes WHERE id = ?').get(lop) as any;
    if (!c || !can(p, PERMISSIONS.STUDENT_VIEW, { classId: lop })) throw badRequest('Không tìm thấy lớp.');
    if (branchId !== null && c.branch_id !== branchId) throw badRequest('Lớp thuộc chi nhánh khác — chọn lớp của chi nhánh việc.');
  }
  if (studentIds !== undefined && studentIds !== null && !Array.isArray(studentIds)) throw badRequest('Danh sách học viên không hợp lệ.');
  const ds = [...new Set(((studentIds as unknown[] | null | undefined) ?? []).map(Number))];
  if (ds.length > TRAN_HV_LIEN_QUAN) throw loi(400, 'Tối đa {n} học viên liên quan.', { n: TRAN_HV_LIEN_QUAN });
  if (ds.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Danh sách học viên không hợp lệ.');
  const moi = daCo && lop === daCo.classId ? ds.filter((x) => !daCo.studentIds.includes(x)) : ds;
  const hopLe = hvHopLe(moi, lop, branchId);
  if (moi.some((x) => !hopLe.has(x) || !can(p, PERMISSIONS.STUDENT_VIEW, { studentId: x }))) throw badRequest('Có học viên không thuộc chi nhánh / lớp của việc — chọn lại.');
  return { classId: lop, studentIds: ds };
}
/** Thay tập học viên liên quan của việc (`task_students`, case_id NULL — không sinh Case / PA nào). */
function ghiHocVien(taskId: number, ds: readonly number[]) {
  db().prepare(`DELETE FROM task_students WHERE task_id = ? AND case_id IS NULL AND student_id NOT IN (${DS_JSON})`).run(taskId, JSON.stringify(ds));
  for (const sid of ds) db().prepare('INSERT OR IGNORE INTO task_students (task_id, student_id, created_at) VALUES (?,?,?)').run(taskId, sid, nowIso());
}

export function createMgmtTask(p: Principal, input: {
  title: string; group?: string | null; groupId?: number | null; branchId?: number | null;
  assigneeUserId?: number | null; watcherUserId?: number | null;
  /** VH-1: nhiều người theo dõi (người tạo tự vào). */
  theoDoiIds?: number[];
  /** Tên người phụ trách ngoài hệ thống — chỉ khi không có `assigneeUserId`. */
  assigneeName?: string | null;
  due?: string | null; note?: string | null;
  parentTaskId?: number | null;
  caseIds?: number[];
  /** PR-Ra (R6): tạo từ ô báo cáo đơn vị — tự nối vào `unit_report_task_links`. */
  unitReportId?: number | null;
  /** PR-GVa (F01 = D13): mã của MỘT lần mở form — gửi lại cùng mã trả việc đã có. */
  idempotencyKey?: string | null;
  /** VH-1: lặp lại (chỉ việc gốc). */
  lap?: unknown;
  /** VH-1b (N62): hạng mục chính thống (`HANG_MUC_CV`) · lớp · học viên liên quan (tuỳ chọn). Web cũ không gửi → như trước. */
  hangMuc?: unknown; classId?: unknown; studentIds?: unknown;
  /** VH-2 (V2): Trong kỳ (`in_period`) │ Dài hạn (`long_term`, mặc định — như trước). Việc con theo việc cha. */
  taskType?: unknown;
  /** BAOPH-0 (N72 ⑥, 4.6): việc con của một việc Ý thức / Phối hợp / Báo PH (`LOAI_GIAO` × id) — thay `parentTaskId`; chi nhánh = chi nhánh của em. */
  chaLoai?: unknown; chaId?: unknown;
}) {
  if (!canSeeBoard(p)) throw forbidden('Chỉ Head, Quản trị hoặc CX mới tạo được công việc vận hành.');
  /* PR-Dọn (Q4, quét #24): chữ tự do có kiểu và trần. */
  const title = chuTuDo(input.title, 'Tên công việc', 200) ?? '';
  chuTuDo(input.note, 'Mô tả việc', TRAN_MO_TA_VH);
  if (!title) throw badRequest('Công việc phải có tên.');
  if (input.due && !isIsoDate(input.due)) throw badRequest('Hạn không hợp lệ.');
  const assigneeName = tenNgoai(input.assigneeUserId, input.assigneeName);

  const conn = db();
  let parent: any = null;
  /* 4.6: việc cha là việc Ý thức (đọc + quyền xem theo khối giao việc); một tầng — không kèm việc cha Vận hành, không lặp. */
  const cha = input.chaLoai == null || input.chaLoai === '' ? null : (() => {
    if (input.parentTaskId) throw badRequest('Việc con chỉ có một tầng.');
    const loai = docLoai(input.chaLoai), id = Number(input.chaId);
    xemGiaoViec(p, loai, id);
    const v = docViec(loai, id);
    if (!v.mo) throw badRequest('Việc cha đã kết thúc — không thêm việc con.');   // rà #2233 P2-2
    return { loai, id, branchId: v.branchId };
  })();
  if (input.parentTaskId) {
    parent = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(input.parentTaskId) as any;
    if (!parent) throw notFound('Không tìm thấy công việc cha.');
    /* MỘT TẦNG (mục 8.6): việc con của một việc con là chỗ bảng bắt đầu không đọc được nữa. */
    if (parent.parent_task_id) throw badRequest('Việc con chỉ có một tầng.');
    /* PR-Dọn (quét #5b): việc con chỉ gắn vào việc cha mình quản lý được — không tạo việc con ở chi nhánh khác. */
    if (!coQuyenViec(p, parent)) throw forbidden('Bạn không quản lý công việc cha này.');
  }

  /*
   * PTA rà lần 2 (1): ô Chi nhánh của web mặc định "Toàn hệ thống" (null) — người quản đúng MỘT chi nhánh gửi null → việc của chi nhánh đó (không thành Toàn hệ thống
   * do vô ý); người quản nhiều chi nhánh / toàn hệ thống gửi null → giữ Toàn hệ thống như main.
   */
  const pv = phamVi(p);
  const taskBranchId = cha ? cha.branchId : input.branchId ?? parent?.branch_id ?? (!pv.all && pv.branchIds.length === 1 ? pv.branchIds[0] : null);
  if (!quanLyVanHanh(p, { branchId: taskBranchId })) throw forbidden('Chỉ Head, Quản trị hoặc CX mới tạo được công việc vận hành.');
  kiemNguoiVh('Người phụ trách', input.assigneeUserId, taskBranchId);
  const theoDoi = [...(docTheoDoi(input.theoDoiIds, taskBranchId) ?? []), ...(input.watcherUserId ? [input.watcherUserId] : [])];
  kiemNguoiVh('Người theo dõi', input.watcherUserId, taskBranchId);
  const groupId = parent ? parent.group_id ?? null : nhomChoViec(input, taskBranchId) ?? null;
  const hangMuc = parent ? null : docHangMuc(input.hangMuc) ?? null;
  const lienQuan = docLienQuan(p, input.classId, input.studentIds, taskBranchId);
  const lap = parent || cha ? null : docLap(input.lap);
  if (parent && input.lap != null && input.lap !== '') throw badRequest('Việc con lặp theo việc cha — đặt lặp lại ở việc cha.');
  /*
   * PR-Dọn (quét #5a): Case làm căn cứ — tối đa 50, mỗi Case phải tồn tại và người tạo XEM được (chi tiết việc hiện tên Case + tên HV;
   * gắn Case chi nhánh khác là lộ tên HV chi nhánh đó cho mọi người xem việc).
   */
  if (input.caseIds !== undefined && !Array.isArray(input.caseIds)) throw badRequest('Danh sách Case không hợp lệ.');
  if ((input.caseIds?.length ?? 0) > 50) throw badRequest('Gắn tối đa 50 Case cho một công việc.');
  const caseIds = [...new Set(input.caseIds ?? [])];
  for (const caseId of caseIds) {
    if (!Number.isInteger(caseId) || caseId <= 0) throw badRequest('Mã Case không hợp lệ.');
    caseAccess(caseId).requireView(p, 'Có Case nằm ngoài phạm vi bạn được xem.');
  }
  let sourceType = 'manual';
  let sourceUnitReportId: number | null = null;
  if (input.unitReportId) {
    const ur = conn
      .prepare(
        `SELECT ur.id, ru.branch_id AS unit_branch_id, ru.kind AS unit_kind
           FROM unit_reports ur JOIN reporting_units ru ON ru.id = ur.reporting_unit_id
          WHERE ur.id = ?`,
      )
      .get(input.unitReportId) as any;
    if (!ur) throw notFound('Không tìm thấy họp đơn vị.');
    /* Đơn vị Tutor không có chi nhánh — việc nối vào phải là việc "Toàn hệ thống" (branch_id NULL). */
    const wantBranch = ur.unit_kind === 'department' ? null : ur.unit_branch_id;
    if (taskBranchId !== wantBranch) throw badRequest('Việc phải cùng chi nhánh với đơn vị báo cáo.');
    sourceType = 'unit_report';
    sourceUnitReportId = input.unitReportId;
  }

  /*
   * PR-GVa (F01 = D13): bấm đúp / thử lại sau lỗi mạng gửi lại CÙNG khoá của lần mở form → trả việc đã có. Mọi kiểm quyền và kiểm dữ liệu
   * ở trên chạy TRƯỚC khi tra khoá. Không khoá thì luôn là việc mới (không còn gộp theo tiêu đề trong 10 giây — từng nuốt group/note/watcher).
   */
  const khoa = chuanKhoaGui(input.idempotencyKey);
  const taoMoi = () => tx(() => {
    const cu = theoKhoaGui('tasks', 'created_by', p.userId, khoa);
    if (cu) return mgmtTaskDetail(p, cu);
    const info = conn
      .prepare(
        `INSERT INTO tasks (code, title, kind, task_type, group_id, parent_task_id,
                            branch_id, assignee_user_id, assignee_name, due_date,
                            progress, note, source_type, source_unit_report_id, created_by, created_at, idempotency_key,
                            lap_kieu, lap_ngay, lap_ky, hang_muc, class_id, cha_loai, cha_id)
         VALUES (?,?, 'branch_ops', ?, ?,?,?,?,?,?, 'not_started', ?,?,?,?,?,?, ?,?,?,?,?,?,?)`,
      )
      .run(nextCode(conn), title, parent?.task_type ?? loaiViec(input.taskType) ?? 'long_term', groupId, input.parentTaskId ?? null,
           taskBranchId,
           input.assigneeUserId ?? null, assigneeName,
           input.due ?? null, (input.note ?? '').trim() || null, sourceType, sourceUnitReportId, p.userId, nowIso(), khoa,
           lap?.kieu ?? null, lap ? lap.ngay.join(',') : null, lap ? demoToday() : null, hangMuc, lienQuan?.classId ?? null, cha?.loai ?? null, cha?.id ?? null);
    const id = Number(info.lastInsertRowid);

    for (const caseId of caseIds) {
      conn.prepare('INSERT OR IGNORE INTO task_case_links (task_id, case_id, created_at) VALUES (?,?,?)')
        .run(id, caseId, nowIso());
    }
    if (sourceUnitReportId) {
      conn.prepare(
        `INSERT OR IGNORE INTO unit_report_task_links (unit_report_id, task_id, created_by, created_at) VALUES (?,?,?,?)`,
      ).run(sourceUnitReportId, id, p.userId, nowIso());
    }
    /* VH-1 (N58/N59): người tạo tự theo dõi + người theo dõi đã chọn (người phụ trách không cần theo dõi chính việc mình). */
    if (lienQuan) ghiHocVien(id, lienQuan.studentIds);
    themTheoDoiDong('van_hanh', id, [p.userId, ...theoDoi].filter((u) => u !== input.assigneeUserId), 'tay', p.userId, taskBranchId);
    const aid = writeAudit({
      actorUserId: p.userId, action: 'mgmt_task.create', entityType: 'task', entityId: id,
      entityLabel: title,
    });
    if (input.assigneeUserId) bao({ id, title }, p.userId, 'giao', `Được giao cho ${tenCua(input.assigneeUserId)} · hạn ${ngayNgan(input.due ?? null)}`, aid);
    return mgmtTaskDetail(p, id);
  });
  try { return taoMoi(); }
  catch (e) {
    /* Hai lần gửi đồng thời cùng khoá: lần thua vấp unique index → trả việc lần thắng đã ghi. */
    const cu = laTrungKhoa(e) ? theoKhoaGui('tasks', 'created_by', p.userId, khoa) : null;
    if (cu) return mgmtTaskDetail(p, cu);
    throw e;
  }
}

const tenCua = (uid: number | null) => (uid ? (db().prepare('SELECT full_name FROM users WHERE id = ?').get(uid) as any)?.full_name ?? '' : 'chưa giao');

/**
 * GHI MỘT LẦN CẬP NHẬT — đây là cách DUY NHẤT trạng thái công việc đổi.
 *
 * Không có đường nào sửa thẳng `progress` mà không để lại dấu vết: một bảng tiến độ mà không
 * biết ai đổi lúc nào thì đến cuối quý không ai dựng lại được chuyện gì đã xảy ra.
 */
export function updateMgmtTask(p: Principal, taskId: number, input: {
  progress: string; note?: string | null; reason?: string | null;
  on?: string | null; reviewOn?: string | null;
  /** PR-Ra Q10: người cần hỗ trợ khi Tạm ngưng — một tài khoản (nhóm nhân_vien) hoặc người ngoài. */
  helpUserId?: number | null; helpName?: string | null;
  /** VH-1 (PTA mục 9): `updatedAt` lúc mở panel — lệch → 409 (web cũ không gửi: như cũ). */
  phienBan?: string | null;
}) {
  const conn = db();
  const t = docTask(taskId);
  kiemPhienBan(t, input.phienBan);

  /* Người được giao cập nhật được việc của mình; người THEO DÕI thì không (mục 8.3). */
  const isAssignee = t.assignee_user_id === p.userId && laHieuLuc(p.userId, t.branch_id ?? null);   // PTA mục 7
  if (!coQuyenViec(p, t) && !isAssignee) {
    throw forbidden('Chỉ người được giao, Head, Quản trị hoặc CX mới cập nhật được công việc này.');
  }
  if (!(TASK_PROGRESS as readonly string[]).includes(input.progress)) {
    throw badRequest('Trạng thái không hợp lệ.');
  }
  const needReason = (TASK_PROGRESS_NEEDS_REASON as readonly string[]).includes(input.progress);
  const reason = chuTuDo(input.reason, 'Lý do', 2000) ?? '';   // PR-Dọn (Q4, quét #24)
  chuTuDo(input.note, 'Ghi chú', 2000);
  if (needReason && !reason) {
    throw badRequest(
      `"${TASK_PROGRESS_LABEL[input.progress as TaskProgress]}" phải ghi lý do — `
      + 'một việc tự nhiên im lặng mà không ai biết vì sao là thứ vài tháng sau không ai giải thích được.',
    );
  }
  const on = input.on ?? demoToday();
  if (!isIsoDate(on)) throw badRequest('Ngày cập nhật không hợp lệ.');
  if (on > demoToday()) throw badRequest('Không ghi được ngày cập nhật ở tương lai.');

  /* PR-Ra Q10: TẠM NGƯNG bắt buộc BA Ý — lý do (đã kiểm ở trên), người cần hỗ trợ, ngày xem lại. */
  let helpUserId: number | null = null;
  let helpName: string | null = null;
  if (input.progress === 'paused') {
    helpUserId = input.helpUserId ?? null;
    helpName = chuTuDo(input.helpName, 'Cần ai hỗ trợ', 120);
    if (!helpUserId && !helpName) throw badRequest('Tạm ngưng phải ghi cần ai hỗ trợ.');
    if (helpUserId) {
      kiemNguoi('Người cần hỗ trợ', helpUserId);
      helpName = null;   // một trong hai — có tài khoản thì không lưu thêm tên gõ tay.
    }
    if (!input.reviewOn || !isIsoDate(input.reviewOn) || input.reviewOn < on) {
      throw badRequest('Tạm ngưng phải có ngày xem lại (từ ngày cập nhật trở đi).');
    }
  }

  /*
   * HOÀN THÀNH và DỪNG HẲN việc CHA đều cần việc con đã khép lại trước (mục 8.6, Q11) — đánh
   * dấu cha xong hoặc dừng hẳn trong khi con còn dở là nói dối bảng tiến độ, và con sẽ treo
   * mãi ở "Việc cần làm" của người được giao mà không ai còn nhớ tới cha của nó nữa.
   */
  let khepCon = false;
  if ((input.progress === 'done' || input.progress === 'stopped') && !t.parent_task_id) {
    const openSubs = conn
      .prepare(`SELECT title FROM tasks WHERE parent_task_id = ? AND progress NOT IN ('done','stopped') ORDER BY id`)
      .all(taskId) as any[];
    /* RKC-3b (chủ SP 07/11 "không chặn cứng"): hỏi MỘT câu nêu việc con; đồng ý = khép luôn việc con cùng tiến độ (nhật ký từng việc con). */
    if (openSubs.length > 0) {
      canXacNhan('Còn {n} việc con chưa khép ({ds}) — khép luôn các việc con rồi lưu?', { n: openSubs.length, ds: tenViecConMo(openSubs.map((s) => s.title)) }, 'Khép cả việc con');
      khepCon = true;
    }
  }

  return tx(() => {
    const before = t.progress;
    /* VH-1: so-và-đổi theo lần sửa đã đọc — hai người lưu cùng lúc: người sau 409. */
    if (!conn
      .prepare(
        `UPDATE tasks SET progress = ?, stop_reason = ?, review_on = ?,
                help_user_id = ?, help_name = ?, completed_at = ?, updated_at = ? WHERE id = ? AND updated_at IS ?`,
      )
      .run(input.progress, needReason ? reason : null,
           input.progress === 'paused' ? (input.reviewOn ?? null) : null,
           input.progress === 'paused' ? helpUserId : null,
           input.progress === 'paused' ? helpName : null,
           input.progress === 'done' ? on : null, lucMoi(t.updated_at), taskId, t.updated_at ?? null).changes) {
      throw conflict('Công việc vừa được người khác cập nhật — mở lại để xem.');
    }
    const note = [reason || null, (input.note ?? '').trim() || null].filter(Boolean).join(' — ') || null;
    const uid = Number(conn
      .prepare(
        `INSERT INTO task_updates (task_id, period_id, progress, note, actor_user_id, updated_on, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      )
      .run(taskId, ensurePeriod(on).id, input.progress, note, p.userId, on, nowIso()).lastInsertRowid);
    conn
      .prepare(
        `INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at)
         VALUES (?, 'progress', ?, ?, ?, ?)`,
      )
      .run(taskId, before, input.progress, p.userId, nowIso());
    /* RKC-3b: khép luôn việc con còn mở cùng tiến độ của việc cha (đã hỏi) — mỗi việc con một dòng tiến độ + lịch sử. */
    if (khepCon) {
      for (const s of conn.prepare(`SELECT id, title, progress, updated_at FROM tasks WHERE parent_task_id = ? AND progress NOT IN ('done','stopped')`).all(taskId) as any[]) {
        conn.prepare(`UPDATE tasks SET progress = ?, stop_reason = ?, completed_at = ?, updated_at = ? WHERE id = ?`)
          .run(input.progress, input.progress === 'stopped' ? (reason || 'Việc cha dừng hẳn') : null, input.progress === 'done' ? on : null, lucMoi(s.updated_at), s.id);
        conn.prepare(`INSERT INTO task_updates (task_id, period_id, progress, note, actor_user_id, updated_on, created_at) VALUES (?,?,?,?,?,?,?)`)
          .run(s.id, ensurePeriod(on).id, input.progress, 'Khép cùng việc cha', p.userId, on, nowIso());
        conn.prepare(`INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?, 'progress', ?, ?, ?, ?)`)
          .run(s.id, s.progress, input.progress, p.userId, nowIso());
        bao(s, p.userId, input.progress === 'done' ? 'xong' : 'dung', 'Khép cùng việc cha', uid);   // PTA (nhỏ): người phụ trách việc con biết
      }
    }
    /* VH-1 (N59): chuông "Cập nhật" — xong / dừng hẳn / tiến độ. */
    const suKien: SuKien = input.progress === 'done' ? 'xong' : input.progress === 'stopped' ? 'dung' : 'tien_do';
    bao(t, p.userId, suKien, [TASK_PROGRESS_LABEL[input.progress as TaskProgress], note].filter(Boolean).join(' · '), uid);
    return mgmtTaskDetail(p, taskId);
  });
}

/**
 * Sửa phần mô tả của một công việc: tên, người, hạn, nhóm, người theo dõi, lặp lại. Không đụng vào tiến độ.
 * VH-1 (N59): Head / Quản trị / CX sửa mọi trường; người phụ trách + người giao (người tạo) chỉ HẠN (lý do tuỳ chọn) và NGƯỜI THEO DÕI.
 */
export function editMgmtTask(p: Principal, taskId: number, patch: {
  title?: string; group?: string | null; groupId?: number | null; branchId?: number | null;
  assigneeUserId?: number | null; watcherUserId?: number | null;
  assigneeName?: string | null;
  due?: string | null; note?: string | null;
  /** Lý do dời hạn — TUỲ CHỌN (VH-1: Head cũng không còn bắt), tối đa 200 ký tự, ghi vào lịch sử hạn. */
  lyDoDoiHan?: string | null;
  /** VH-1: thay cả danh sách người theo dõi. */
  theoDoiIds?: number[];
  /** VH-1: đặt / đổi / bỏ (null) lặp lại — chỉ việc gốc. */
  lap?: unknown;
  /** VH-1 (PTA mục 9): `updatedAt` lúc mở form — lệch → 409. */
  phienBan?: string | null;
  /** VH-1b (N62): hạng mục (null = tab Vận hành) · lớp · học viên liên quan (thay cả danh sách). */
  hangMuc?: unknown; classId?: unknown; studentIds?: unknown;
  /** VH-2: Trong kỳ │ Dài hạn (chỉ việc gốc; Head / Quản trị / CX). */
  taskType?: unknown;
  /** A2-04 / A2-09: `true` = Hoàn tác lần đổi người gần nhất (panel, 10 giây) — đảo bản ghi, không đổi lần nữa. Web cũ gửi lại người cũ: vẫn chạy như trước. */
  hoanTacGiao?: unknown;
}) {
  const conn = db();
  const t = docTask(taskId);
  kiemPhienBan(t, patch.phienBan);
  if (patch.hoanTacGiao === true) return hoanTacGiaoVh(p, t);
  const quanLy = coQuyenViec(p, t);
  if (!quanLy) {
    const duoc = (t.assignee_user_id === p.userId || t.created_by === p.userId) && laHieuLuc(p.userId, t.branch_id ?? null);   // PTA mục 7
    const ngoai = Object.keys(patch).filter((k) => !['due', 'lyDoDoiHan', 'theoDoiIds', 'phienBan'].includes(k) && (patch as any)[k] !== undefined);
    if (!duoc || ngoai.length) throw forbidden(duoc ? 'Người phụ trách chỉ sửa được hạn và người theo dõi.' : 'Chỉ Head, Quản trị hoặc CX mới sửa được công việc vận hành.');
  }

  const sets: string[] = [];
  const params: unknown[] = [];
  const put = (col: string, v: unknown) => { sets.push(`${col} = ?`); params.push(v); };
  const historyRows: { field: string; oldValue: string | null; newValue: string | null; reason: string | null }[] = [];

  const loai = t.parent_task_id ? undefined : loaiViec(patch.taskType);
  if (loai !== undefined && loai !== t.task_type) put('task_type', loai);
  if (patch.title !== undefined) {
    const v = chuTuDo(patch.title, 'Tên công việc', 200) ?? '';
    if (!v) throw badRequest('Công việc phải có tên.');
    put('title', v);
  }
  /* PTA mục 5: đổi chi nhánh — kiểu số / null, phải quản lý được ở chi nhánh MỚI; nhóm riêng của chi nhánh cũ → "Không phân loại"; việc con theo cha. */
  if (patch.branchId !== undefined && patch.branchId !== null && (!Number.isInteger(patch.branchId) || (patch.branchId as number) <= 0)) throw badRequest('Chi nhánh không hợp lệ.');
  const cnMoi: number | null = patch.branchId !== undefined ? patch.branchId ?? null : t.branch_id ?? null;
  const doiCn = cnMoi !== (t.branch_id ?? null);
  if (doiCn) {
    if (t.parent_task_id) throw badRequest('Việc con theo chi nhánh của việc cha.');
    if (cnMoi !== null && !conn.prepare('SELECT 1 FROM branches WHERE id = ?').get(cnMoi)) throw badRequest('Chi nhánh không hợp lệ.');
    if (!quanLyVanHanh(p, { branchId: cnMoi, anyScope: cnMoi === null })) throw forbidden('Bạn không quản lý chi nhánh mới của công việc.');
    put('branch_id', cnMoi);
    /* Người phụ trách không có vai ở chi nhánh mới (và không gửi người mới) → "Chưa giao" + lịch sử. */
    if (patch.assigneeUserId === undefined && t.assignee_user_id && !laHieuLuc(t.assignee_user_id, cnMoi)) patch = { ...patch, assigneeUserId: null };
  }
  /*
   * Web cũ (trước VH-2) luôn gửi `group` = khoá nhóm đang thấy, mặc định 'curriculum' khi việc không có khoá (Không phân loại / nhóm tự đặt) — gửi đúng giá trị
   * mặc định đó = KHÔNG đổi nhóm. ponytail: web cũ không chuyển được việc không khoá sang "Giáo trình"; hết khi VH-2 gửi `groupId`.
   */
  const khoaCu = t.group_id ? (conn.prepare('SELECT khoa, branch_id FROM task_groups WHERE id = ?').get(t.group_id) as any) : null;
  const nhomVao = patch.groupId === undefined && patch.group !== undefined && patch.group === (khoaCu?.khoa ?? 'curriculum') ? { ...patch, group: undefined } : patch;
  let groupId = t.parent_task_id ? undefined : nhomChoViec(nhomVao, cnMoi, t.group_id ?? null);
  if (doiCn && groupId === undefined && khoaCu?.branch_id != null && khoaCu.branch_id !== cnMoi) groupId = null;
  if (groupId !== undefined && groupId !== (t.group_id ?? null)) {
    historyRows.push({ field: 'group_id', oldValue: t.group_id ? String(t.group_id) : null, newValue: groupId ? String(groupId) : null, reason: null });
    put('group_id', groupId);
  }
  /* GIAO-VIEC-CN: chỉ kiểm chi nhánh khi người hoặc chi nhánh ĐỔI — việc cũ đã giao ngoài chi nhánh vẫn sửa tên / hạn được (form gửi lại người cũ). */
  let doiNguoi = false;
  if (patch.assigneeUserId !== undefined) {
    if (doiCn || (patch.assigneeUserId ?? null) !== (t.assignee_user_id ?? null)) kiemNguoiVh('Người phụ trách', patch.assigneeUserId, cnMoi);
    if ((patch.assigneeUserId ?? null) !== (t.assignee_user_id ?? null)) {
      doiNguoi = true;
      historyRows.push({
        field: 'assignee_user_id', oldValue: t.assignee_user_id ? String(t.assignee_user_id) : null,
        newValue: patch.assigneeUserId ? String(patch.assigneeUserId) : null, reason: null,
      });
    }
    put('assignee_user_id', patch.assigneeUserId ?? null);
  }
  if (patch.assigneeUserId !== undefined || patch.assigneeName !== undefined) {
    const uid = patch.assigneeUserId !== undefined ? patch.assigneeUserId : t.assignee_user_id;
    const ten = tenNgoai(uid, patch.assigneeName !== undefined ? patch.assigneeName : t.assignee_name);
    if ((ten ?? null) !== (t.assignee_name ?? null)) {
      historyRows.push({ field: 'assignee_name', oldValue: t.assignee_name ?? null, newValue: ten, reason: null });
    }
    put('assignee_name', ten);
  }
  let doiHan = false;
  if (patch.due !== undefined) {
    if (patch.due && !isIsoDate(patch.due)) throw badRequest('Hạn không hợp lệ.');
    if (!quanLy && closed(t.progress)) throw badRequest('Việc đã khép — không sửa hạn.');
    /*
     * VH-1 (N59, chủ SP 20/11): lý do dời hạn TUỲ CHỌN cho mọi người (trước PR-Ra Q9: bắt buộc) — lịch sử hạn giữ như cũ (hạn gốc, số lần dời).
     * Quá hạn vẫn tính theo hạn HIỆN TẠI. ĐỔI HẠN CHA KHÔNG DỜI HẠN CON (mục 8.6).
     */
    const ly = chuTuDo(patch.lyDoDoiHan, 'Lý do dời hạn', 200);
    if ((patch.due ?? null) !== (t.due_date ?? null)) {
      doiHan = true;
      historyRows.push({ field: 'due_date', oldValue: t.due_date ?? null, newValue: patch.due ?? null, reason: t.due_date ? ly : null });
    }
    put('due_date', patch.due ?? null);
  }
  /* A2-10: trần 500 chỉ khi chữ đổi — mô tả cũ dài (trần cũ 2000) gửi lại nguyên vẫn lưu được (N35). */
  if (patch.note !== undefined) { const nt = typeof patch.note === 'string' ? patch.note.trim() || null : patch.note; chuTuDo(patch.note, 'Mô tả việc', nt === (t.note ?? null) ? 2000 : TRAN_MO_TA_VH); put('note', (patch.note ?? '').trim() || null); }
  /* VH-1b (N62): hạng mục (việc gốc; việc con theo cha) · lớp / học viên liên quan. Chuyển chi nhánh: lớp chi nhánh cũ bỏ. */
  /* PTA rà #1936 (6): chỉ việc Vận hành — việc "Giao GV theo lớp + kỹ năng" (teacher_task) giữ lớp / em / Case của luồng đó. */
  if (t.kind !== 'branch_ops' && (patch.hangMuc !== undefined || patch.classId !== undefined || patch.studentIds !== undefined)) {
    throw badRequest('Chỉ việc Vận hành có hạng mục / lớp / học viên liên quan.');
  }
  const hangMuc = t.parent_task_id ? undefined : docHangMuc(patch.hangMuc);
  if (hangMuc !== undefined && hangMuc !== (t.hang_muc ?? null)) {
    put('hang_muc', hangMuc);
    historyRows.push({ field: 'hang_muc', oldValue: t.hang_muc ?? null, newValue: hangMuc, reason: null });
  }
  /* PTA rà lần 2 #1936 (1): chỉ việc Vận hành có lớp / HV liên quan — việc "Giao GV theo lớp + kỹ năng" đổi chi nhánh giữ nguyên lớp + em như trước. */
  const laVh = t.kind === 'branch_ops';
  /* Lớp cũ còn hợp lệ ở chi nhánh mới? (việc Toàn hệ thống: giữ). */
  const lopCu: number | null = laVh && t.class_id && doiCn && cnMoi !== null && (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(t.class_id) as any)?.branch_id !== cnMoi ? null : t.class_id ?? null;
  const cuHv = laVh ? (conn.prepare('SELECT student_id FROM task_students WHERE task_id = ? AND case_id IS NULL').all(taskId) as any[]).map((r) => r.student_id as number) : [];
  const lopGui = patch.classId !== undefined ? (patch.classId == null || patch.classId === '' ? null : Number(patch.classId)) : lopCu;
  const lienQuan = patch.classId !== undefined || patch.studentIds !== undefined
    ? docLienQuan(p, lopGui, patch.studentIds ?? [], cnMoi, !doiCn && lopGui === (t.class_id ?? null) ? { classId: t.class_id ?? null, studentIds: cuHv } : undefined) : undefined;
  const lopMoi = lienQuan ? lienQuan.classId : lopCu;
  /* PTA rà #1936 (5): học viên liên quan — gửi danh sách thì thay; đổi chi nhánh / lớp mà không gửi → bỏ em không còn hợp lệ (không lộ tên em chi nhánh cũ). */
  let hvMoi: number[] | undefined = patch.studentIds !== undefined ? lienQuan!.studentIds : undefined;
  if (laVh && hvMoi === undefined && (doiCn || lopMoi !== (t.class_id ?? null))) {
    const giu = hvHopLe(cuHv, lopMoi, cnMoi);
    if (cuHv.some((x) => !giu.has(x))) hvMoi = cuHv.filter((x) => giu.has(x));
  }
  if (lopMoi !== (t.class_id ?? null)) {
    put('class_id', lopMoi);
    historyRows.push({ field: 'class_id', oldValue: t.class_id ? String(t.class_id) : null, newValue: lopMoi ? String(lopMoi) : null, reason: null });
  }
  let lap: LapLai | null | undefined;
  if (patch.lap !== undefined) {
    if (t.parent_task_id || t.lap_goc_id) throw badRequest('Chỉ đặt lặp lại ở việc gốc.');
    lap = docLap(patch.lap);
  }
  /* PATCH mang `lap` y như đang có → không đổi gì (không bỏ Dừng lặp, không ghi lịch sử). */
  if (patch.lap !== undefined && (lap ? `${lap.kieu}:${lap.ngay.join(',')}` : null) !== (t.lap_kieu ? `${t.lap_kieu}:${t.lap_ngay}` : null)) {
    put('lap_kieu', lap?.kieu ?? null); put('lap_ngay', lap ? lap.ngay.join(',') : null);
    if (lap && !t.lap_ky) put('lap_ky', demoToday());
    /* PTA mục 8: đổi lịch / bật lại → kỳ kế tính từ hôm nay (không sinh bản cho kỳ đã qua). */
    if (lap) { put('lap_dung_luc', null); put('lap_tu', addDays(demoToday(), -1)); }
    historyRows.push({ field: 'lap', oldValue: t.lap_kieu ? `${t.lap_kieu}:${t.lap_ngay}` : null, newValue: lap ? `${lap.kieu}:${lap.ngay.join(',')}` : null, reason: null });
  }
  const tdCu = (conn.prepare(`SELECT user_id FROM viec_theo_doi WHERE loai = 'van_hanh' AND ref_id = ? ORDER BY id`).all(taskId) as any[]).map((r) => r.user_id as number);
  let theoDoi = docTheoDoi(patch.theoDoiIds, cnMoi, tdCu);
  /*
   * Web cũ (trước VH-2) luôn gửi MỘT `watcherUserId` (id | null) = người đang thấy (`watcherCu`) — không gửi `theoDoiIds` thì THAY đúng người đó
   * (null = bỏ), giữ những người theo dõi khác.
   */
  if (theoDoi === undefined && 'watcherUserId' in patch) {
    const cu = tdCu.find((u) => u !== t.created_by) ?? null;
    const moi = patch.watcherUserId ? Number(patch.watcherUserId) : null;
    if (moi !== cu) {
      if (moi && !tdCu.includes(moi)) kiemNguoiVh('Người theo dõi', moi, cnMoi);
      theoDoi = [...tdCu.filter((u) => u !== cu), ...(moi && !tdCu.includes(moi) ? [moi] : [])];
    }
  }
  const doiHv = hvMoi !== undefined;
  if (!sets.length && theoDoi === undefined && !doiHv) return mgmtTaskDetail(p, taskId);

  /* A2-04 / A2-09: đổi người ghi bản đảo — dòng việc (trước) + người theo dõi / tin "Cập nhật" vừa thêm; Hoàn tác trả đúng như trước, gỡ tin. */
  /* Chỉ lần đổi CHỈ người phụ trách (hộp Đổi người ở panel) — form Sửa đổi nhiều trường không có Hoàn tác này. */
  const chiDoiNguoi = doiNguoi && Object.entries(patch).every(([k, v]) => v === undefined || ['assigneeUserId', 'assigneeName', 'phienBan'].includes(k));
  const dao = chiDoiNguoi ? new GhiDao(conn) : null;
  return tx(() => {
    if (!dao) return ghiSua(null);
    /* Tin "Cập nhật" của việc: khoảng khoá `gv:van_hanh:{id}:…` theo chỉ mục `dedup_key` (không quét bảng). */
    const kq = dao.theoDoi('viec_theo_doi', `loai = 'van_hanh' AND ref_id = ?`, [taskId], () => dao.theoDoi('viec_giao_lan', `loai = 'van_hanh' AND ref_id = ?`, [taskId], () =>
      dao.theoDoi('notifications', 'dedup_key >= ? AND dedup_key < ?', [`gv:van_hanh:${taskId}:`, `gv:van_hanh:${taskId};`], () => ghiSua(dao))));
    luuGhiDao(conn, { loai: LOAI_DAO_GIAO, bang: 'tasks', id: taskId, nguoi: p.userId, ghi: dao });
    return kq;
  });
  function ghiSua(dao: GhiDao | null) {
    const luc = lucMoi(t.updated_at);
    dao?.sua('tasks', 'id = ?', taskId);
    if (sets.length) {
      sets.push('updated_at = ?'); params.push(luc, taskId, t.updated_at ?? null);
      /* VH-1: so-và-đổi theo lần sửa đã đọc — hai người sửa cùng lúc: người sau 409. */
      if (!conn.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND updated_at IS ?`).run(...params).changes) {
        throw conflict('Công việc vừa được người khác sửa — mở lại để xem.');
      }
    }
    for (const h of historyRows) {
      conn.prepare(
        `INSERT INTO task_history (task_id, field, old_value, new_value, reason, actor_user_id, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      ).run(taskId, h.field, h.oldValue, h.newValue, h.reason, p.userId, luc);
    }
    if (doiHv) ghiHocVien(taskId, hvMoi!);
    /* Nhóm / chi nhánh của việc con theo việc cha. */
    if (!t.parent_task_id && (doiCn || (groupId !== undefined && groupId !== (t.group_id ?? null)))) {
      conn.prepare('UPDATE tasks SET group_id = ?, branch_id = ? WHERE parent_task_id = ?').run(groupId !== undefined ? groupId : t.group_id ?? null, cnMoi, taskId);
      /* PTA rà lần 2 #1936 (2): việc con ở chi nhánh mới — lớp / HV riêng của việc con không còn hợp lệ thì bỏ (không lộ mã lớp / tên em chi nhánh cũ). */
      if (doiCn && laVh && cnMoi !== null) {
        for (const c of conn.prepare(`SELECT t.id, t.class_id, c.branch_id AS lop_cn FROM tasks t LEFT JOIN classes c ON c.id = t.class_id WHERE t.parent_task_id = ?`).all(taskId) as any[]) {
          const lop = c.class_id && c.lop_cn === cnMoi ? c.class_id : null;
          if (lop !== (c.class_id ?? null)) conn.prepare('UPDATE tasks SET class_id = NULL WHERE id = ?').run(c.id);
          const hv = (conn.prepare('SELECT student_id FROM task_students WHERE task_id = ? AND case_id IS NULL').all(c.id) as any[]).map((r) => r.student_id as number);
          const giu = hvHopLe(hv, lop, cnMoi);
          if (hv.some((x) => !giu.has(x))) ghiHocVien(c.id, hv.filter((x) => giu.has(x)));
        }
      }
    }
    /* Người theo dõi: thay cả danh sách (bớt / thêm có lịch sử `viec_giao_lan`). */
    if (theoDoi !== undefined) {
      const ds = theoDoi;
      for (const u of tdCu.filter((u) => !ds.includes(u))) {
        conn.prepare(`DELETE FROM viec_theo_doi WHERE loai = 'van_hanh' AND ref_id = ? AND user_id = ?`).run(taskId, u);
        ghiLan('van_hanh', taskId, 'theo_doi', u, null, p.userId);
      }
      for (const u of ds.filter((u) => !tdCu.includes(u))) if (themTheoDoiDong('van_hanh', taskId, [u], 'tay', p.userId, cnMoi)) ghiLan('van_hanh', taskId, 'theo_doi', null, u, p.userId);
    }
    const aid = writeAudit({ actorUserId: p.userId, action: 'mgmt_task.edit', entityType: 'task', entityId: taskId, entityLabel: t.title,
      before: { assignee: t.assignee_user_id, due: t.due_date, group: t.group_id }, after: { assignee: patch.assigneeUserId, due: patch.due, group: groupId } });
    if (doiNguoi) {
      const moi = patch.assigneeUserId ?? null;
      /* N58: người giao + người phụ trách trước theo dõi tiếp (người trước nhận tin "chuyển sang …" qua dòng theo dõi). */
      themTheoDoiDong('van_hanh', taskId, [p.userId, t.assignee_user_id].filter((u) => u && u !== moi), 'tay', p.userId, cnMoi);
      bao({ ...t, title: patch.title ?? t.title }, p.userId, 'giao', `Phụ trách: ${tenCua(moi)}`, aid);
    }
    if (doiHan) bao({ ...t, title: patch.title ?? t.title }, p.userId, 'han', `Hạn mới: ${ngayNgan(patch.due ?? null)}`, aid);
    return mgmtTaskDetail(p, taskId);
  }
}

const LOAI_DAO_GIAO = 'van_hanh.giao';
const HOAN_TAC_GIAO_MS = 60_000;
/**
 * A2-04 / A2-09 (AUDIT-2111): Hoàn tác "Đổi người" (panel) = ĐẢO lần đổi gần nhất, không phải đổi lần nữa: người phụ trách + người theo dõi về đúng như trước
 * (người phụ trách cũ không bị thêm vào Theo dõi) · tin "Đổi người phụ trách" vừa gửi gỡ đi (kết quả không đổi → không tin). Sau đó đã có thay đổi → 409.
 */
function hoanTacGiaoVh(p: Principal, t: any) {
  /* Rà PTA #1954 (4): chỉ lần đổi GẦN NHẤT (đã hoàn tác thì thôi — không đảo tiếp chuỗi lần cũ hơn), của chính người đổi còn hiệu lực, trong 60 giây. */
  const g = db().prepare(`SELECT * FROM ghi_dao WHERE loai = ? AND bang = 'tasks' AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`).get(LOAI_DAO_GIAO, t.id) as BanGhiDao | undefined;
  if (!g || g.dao_luc) throw conflict('Không có lần đổi người phụ trách nào để hoàn tác.');
  if (g.nguoi !== p.userId || !coQuyenViec(p, t) || !laHieuLuc(p.userId, t.branch_id ?? null)) throw forbidden('Chỉ người vừa đổi người phụ trách hoàn tác được.');
  if (Date.now() - Date.parse(g.luc) > HOAN_TAC_GIAO_MS) throw badRequest('Quá thời gian Hoàn tác — đổi lại người phụ trách bằng nút Đổi.');
  return tx(() => {
    daoLai(db(), g, p.userId);
    const sau = docTask(t.id);
    db().prepare(`INSERT INTO task_history (task_id, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?)`)
      .run(t.id, 'assignee_user_id', t.assignee_user_id ? String(t.assignee_user_id) : null, sau.assignee_user_id ? String(sau.assignee_user_id) : null, null, p.userId, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'mgmt_task.hoan_tac_giao', entityType: 'task', entityId: t.id, entityLabel: t.title,
      before: { assignee: t.assignee_user_id }, after: { assignee: sau.assignee_user_id } });
    return mgmtTaskDetail(p, t.id);
  });
}

/** VH-1 (7): quyền tệp đính kèm của việc — xem = người xem được việc; thêm / xoá = người phụ trách · người tạo · Head / Quản trị / CX của chi nhánh. */
export function taskOwnerAccess(taskId: number) {
  const t = docTask(taskId);
  return {
    requireView: (p: Principal) => { if (!quyenXem(p, t).xem) throw forbidden('Công việc này nằm ngoài phạm vi bạn được xem.'); },
    requireEdit: (p: Principal) => {
      const q = quyenXem(p, t);
      if (!q.quanLy && !q.phuTrach && !q.nguoiTao) throw forbidden('Chỉ người phụ trách, người giao, Head, Quản trị hoặc CX thêm / xoá được tệp của công việc.');
    },
  };
}


/**
 * R2 C8 (rà 24/11 — giao nhầm việc chỉ "Dừng hẳn" + lý do, nằm bảng mãi): XOÁ việc vận hành CHƯA CÓ CẬP NHẬT (không `task_updates`, chưa bắt đầu, không việc con,
 * không việc lặp sinh từ nó, không em có PA sinh từ việc) — xoá mềm vào Thùng rác (N28, Khôi phục 30 ngày); web: Hoàn tác ngay sau khi giao + nút Xoá ở panel.
 * Quyền: người tạo (còn hiệu lực ở chi nhánh) · Head / Quản trị / CX của chi nhánh — kiểm TRƯỚC khi ghi. Đã có cập nhật → 400 nói bước tiếp (Dừng hẳn).
 */
export function quyenXoaViec(p: Principal, t: any): boolean {
  return !!t && (coQuyenViec(p, t) || (t.created_by === p.userId && laHieuLuc(p.userId, t.branch_id ?? null)));
}
export const LY_DO_KHONG_XOA_VIEC = 'Việc đã có cập nhật — dùng Dừng hẳn.';
/** Lý do không xoá được (null = xoá được) — panel ẩn nút Xoá theo cùng hàm. */
export function chanXoaViec(t: any): string | null {
  const conn = db();
  if (t.progress !== 'not_started') return LY_DO_KHONG_XOA_VIEC;
  const co = conn.prepare(`SELECT (SELECT COUNT(*) FROM task_updates WHERE task_id = ?1) AS cn, (SELECT COUNT(*) FROM tasks WHERE parent_task_id = ?1 OR lap_goc_id = ?1) AS con,
      (SELECT COUNT(*) FROM task_students WHERE task_id = ?1 AND intervention_id IS NOT NULL) AS pa`).get(t.id) as any;
  if (co.cn) return LY_DO_KHONG_XOA_VIEC;
  if (co.con) return 'Việc có việc con / việc lặp — xoá việc con trước, hoặc Dừng hẳn.';
  if (co.pa) return 'Việc đã sinh PA cho học viên — dùng Dừng hẳn.';
  return null;
}
export function xoaViec(p: Principal, taskId: number): { ok: true; thungRacId: number } {
  const t = docTask(taskId);
  if (!quyenXoaViec(p, t)) throw forbidden('Chỉ người giao hoặc Head của chi nhánh xoá được việc này.');
  const conn = db();
  const chup = new BoChup(conn);
  return tx(() => {
    const chan = chanXoaViec(docTask(taskId));   // đọc lại trong giao dịch: người phụ trách vừa cập nhật thì không xoá
    if (chan) throw badRequest(chan);
    const v = `loai = 'van_hanh' AND ref_id = ?`;
    for (const sql of [
      'DELETE FROM task_followers WHERE task_id = ?', 'DELETE FROM task_history WHERE task_id = ?', 'DELETE FROM task_students WHERE task_id = ?',
      'DELETE FROM task_case_links WHERE task_id = ?', 'DELETE FROM unit_report_task_links WHERE task_id = ?',
      `DELETE FROM viec_theo_doi WHERE ${v}`, `DELETE FROM viec_giao_lan WHERE ${v}`, `DELETE FROM viec_mo_ta WHERE ${v}`,
      `DELETE FROM viec_han_lan WHERE loai = 'van_hanh' AND viec_id = ?`, `DELETE FROM ghi_dao WHERE bang = 'tasks' AND doi_tuong_id = ?`,
      `DELETE FROM notifications WHERE entity_type = 'task' AND entity_id = ?`, `DELETE FROM attachments WHERE owner_type = 'task' AND owner_id = ?`,
      'DELETE FROM tasks WHERE id = ?',
    ]) chup.chay(sql, taskId);
    const thungRacId = ghiThungRac(conn, { loai: 'viec', doiTuongId: taskId, nhan: `Việc ${t.code} · ${t.title}`, branchId: t.branch_id ?? null, nguoi: p.userId, chup });
    writeAudit({ actorUserId: p.userId, action: 'mgmt_task.xoa', entityType: 'task', entityId: taskId, entityLabel: t.title, before: { code: t.code, title: t.title }, after: { thungRacId } });
    return { ok: true as const, thungRacId };
  });
}
