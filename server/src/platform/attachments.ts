import path from 'node:path';
import crypto from 'node:crypto';
import { DB_PATH, ROOT, db, laDbTuXa } from '../db.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_BYTES, ATTACHMENT_MIME_BY_EXT, PERMISSIONS } from '../../../shared/domain/index.ts';
import { require_, type Principal } from '../permissions.ts';
import { caseAccess } from '../cases/cases.ts';
import { coordinationOwner, measureOwner, violationOwner } from '../yThuc/access.ts';
import { writeAudit } from './audit.ts';
import { ghiNhanViecNenKhoTep, khoTepHienTai } from './khoTep.ts';

/**
 * KHO TỆP VÀ LIÊN KẾT DÙNG CHUNG (thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md §4.5, PR-N N5).
 *
 * Trước đây hệ thống KHÔNG có bảng nào lưu tệp hay liên kết, nên CASE-04 (bằng chứng cho case) chưa thể làm, và các
 * luật bắt buộc Thư cảnh cáo / Đình chỉ học phải có tệp không có chỗ để tựa. Dựng MỘT bảng cho cả bốn chỗ cần —
 * case học thuật · phương án · vi phạm · biện pháp — vì làm riêng bốn lần là bốn lần sai khác nhau.
 *
 * BA LUẬT, áp ở mọi chỗ dùng:
 *   (a) LỖI TẢI TỆP KHÔNG LÀM MẤT NỘI DUNG ĐANG NHẬP. Tải tệp là MỘT request riêng (module này không nhận và không sinh
 *       ra nội dung nào khác); giao diện giữ form nguyên và hiện lỗi tại dòng tệp.
 *   (b) QUYỀN XEM TỆP = QUYỀN XEM BẢN GHI CHỦ. Mọi đường — danh sách, tải, xoá — đều đi qua `ownerAccess`; không có đường
 *       tải nào bỏ qua kiểm quyền, và tệp không bao giờ được phục vụ như một đường dẫn tĩnh.
 *   (c) XOÁ TỆP CÓ AUDIT: ghi ai xoá, xoá cái gì, của bản ghi nào — không phải một dấu X im lặng.
 *
 * AN TOÀN TỆP: chỉ nhận một danh sách đuôi tệp cố định (không HTML/SVG/tập lệnh — thứ chạy được trong trình duyệt),
 * tối đa 4 MB, lưu dưới TÊN NGẪU NHIÊN (tên người dùng chỉ là nhãn hiển thị, không bao giờ thành đường dẫn), và luôn
 * phục vụ dạng tải về. Liên kết chỉ nhận http/https — không `javascript:`, `data:`, `file:`.
 */

export const OWNER_TYPES = ['sos_case', 'case_intervention', 'violation', 'discipline_measure', 'sos_coordination_action', 'unit_report'] as const;
export type AttachmentOwnerType = (typeof OWNER_TYPES)[number];

/** Dung lượng và đuôi tệp được nhận nằm ở `shared/domain/attachments.ts` — giao diện đọc cùng danh sách. */
export const MAX_FILE_BYTES = ATTACHMENT_MAX_BYTES;
const ALLOWED_EXT = ATTACHMENT_MIME_BY_EXT;
export const ALLOWED_EXTENSIONS = ATTACHMENT_EXTENSIONS;

/** Nơi lưu tệp trên ổ đĩa: cạnh file database (`data/uploads/`, đã nằm trong .gitignore). Database ở Turso thì
 *  dùng `data/uploads/` của dự án — ổ đĩa chỉ dùng cho máy dev; bản chính cất tệp ở Netlify Blobs (Task 4). */
export function uploadsDir(): string {
  if (process.env.PISA_UPLOADS) return process.env.PISA_UPLOADS;
  return laDbTuXa() ? path.join(ROOT, 'data', 'uploads') : path.join(path.dirname(DB_PATH), 'uploads');
}

// ---------------------------------------------------------------- nơi chủ và quyền

type OwnerAccess = { requireView: (p: Principal) => void; requireEdit: (p: Principal) => void };

/**
 * QUYỀN CỦA TỪNG LOẠI BẢN GHI CHỦ — một nơi. Loại nào chưa có nơi chủ thì bị từ chối rõ ràng chứ không lặng lẽ
 * nhận một tệp không ai kiểm quyền được. Vi phạm và biện pháp xử lý (PR-J, 21/09/2026) đã có nơi chủ; quyền xem/sửa của
 * chúng do chính module Ý thức quyết định (`server/src/yThuc/access.ts`).
 */
function ownerAccess(ownerType: string, ownerId: number): OwnerAccess {
  if (!(OWNER_TYPES as readonly string[]).includes(ownerType)) throw badRequest(`Loại bản ghi "${ownerType}" không hợp lệ.`);
  if (!Number.isInteger(ownerId) || ownerId <= 0) throw badRequest('Bản ghi chủ không hợp lệ.');
  if (ownerType === 'sos_case') return caseOwner(ownerId);
  if (ownerType === 'case_intervention') {
    const iv = db().prepare('SELECT case_id FROM case_interventions WHERE id = ?').get(ownerId) as any;
    if (!iv) throw notFound('Không tìm thấy phương án');
    return caseOwner(iv.case_id);
  }
  if (ownerType === 'violation') return violationOwner(ownerId);
  if (ownerType === 'discipline_measure') return measureOwner(ownerId);
  if (ownerType === 'sos_coordination_action') return coordinationOwner(ownerId);
  if (ownerType === 'unit_report') return unitReportOwner(ownerId);
  throw badRequest(`Loại bản ghi "${ownerType}" chưa hỗ trợ đính kèm.`);
}

/** Báo cáo đơn vị (PR-Ra, Q15): xem = MEETING_VIEW của chi nhánh đơn vị; sửa (thêm/xoá bằng chứng) = MEETING_EDIT. */
function unitReportOwner(unitReportId: number): OwnerAccess {
  const row = db()
    .prepare(
      `SELECT ru.branch_id FROM unit_reports ur JOIN reporting_units ru ON ru.id = ur.reporting_unit_id WHERE ur.id = ?`,
    )
    .get(unitReportId) as any;
  if (!row) throw notFound('Không tìm thấy báo cáo đơn vị');
  const ctx = { branchId: row.branch_id, anyScope: row.branch_id === null };
  return {
    requireView: (p) => require_(p, PERMISSIONS.MEETING_VIEW, ctx, 'Bản ghi này nằm ngoài phạm vi bạn được xem.'),
    requireEdit: (p) => require_(p, PERMISSIONS.MEETING_EDIT, ctx, 'Bạn không có quyền đính kèm hoặc gỡ bằng chứng của báo cáo này.'),
  };
}

/** Case học thuật: xem = quyền xem case; thêm/xoá = quyền SỬA case (đúng môn — AUTH-01/C02). Phương án dùng lại của case chứa nó. */
function caseOwner(caseId: number): OwnerAccess {
  const a = caseAccess(caseId);
  return {
    requireView: (p) => a.requireView(p, 'Bản ghi này nằm ngoài phạm vi bạn được xem.'),
    requireEdit: (p) => a.requireEdit(p, 'Bạn không có quyền đính kèm hoặc gỡ bằng chứng của bản ghi này.'),
  };
}

// ---------------------------------------------------------------- đọc

export type AttachmentRow = {
  id: number;
  ownerType: string;
  ownerId: number;
  kind: 'file' | 'link';
  displayName: string;
  /** Liên kết: URL đầy đủ. Tệp: đường tải CÓ KIỂM QUYỀN — không bao giờ là đường dẫn lưu trên máy chủ. */
  href: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedBy: number;
  uploadedByName: string | null;
  createdAt: string;
};

function shape(r: any): AttachmentRow {
  return {
    id: r.id, ownerType: r.owner_type, ownerId: r.owner_id, kind: r.kind,
    displayName: r.display_name,
    href: r.kind === 'link' ? r.url : `/api/attachments/${r.id}/download`,
    mimeType: r.mime_type ?? null, sizeBytes: r.size_bytes ?? null,
    uploadedBy: r.uploaded_by, uploadedByName: r.uploader_name ?? null, createdAt: r.created_at,
  };
}

const SELECT = `SELECT a.*, u.full_name AS uploader_name FROM attachments a LEFT JOIN users u ON u.id = a.uploaded_by`;

export function listAttachments(p: Principal, ownerType: string, ownerId: number): AttachmentRow[] {
  ownerAccess(ownerType, ownerId).requireView(p);
  return (db().prepare(`${SELECT} WHERE a.owner_type = ? AND a.owner_id = ? ORDER BY a.id`).all(ownerType, ownerId) as any[]).map(shape);
}

/** Số bằng chứng của nhiều bản ghi cùng loại — để danh sách vẽ "2 tệp" mà không hỏi từng bản ghi. Không lộ nội dung. */
export function countAttachments(ownerType: AttachmentOwnerType, ownerIds: number[]): Map<number, number> {
  const out = new Map<number, number>();
  for (let i = 0; i < ownerIds.length; i += 400) {
    const chunk = ownerIds.slice(i, i + 400);
    for (const r of db()
      .prepare(`SELECT owner_id, COUNT(*) n FROM attachments WHERE owner_type = ? AND owner_id IN (${chunk.map(() => '?').join(',')}) GROUP BY owner_id`)
      .all(ownerType, ...chunk) as any[]) out.set(r.owner_id, r.n);
  }
  return out;
}

// ---------------------------------------------------------------- thêm

const cleanName = (s: string) => s.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 200);

function insert(p: Principal, ownerType: string, ownerId: number, o: {
  kind: 'file' | 'link'; url: string; displayName: string; mimeType: string | null; sizeBytes: number | null;
}): AttachmentRow {
  const info = db()
    .prepare(
      `INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, mime_type, size_bytes, uploaded_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(ownerType, ownerId, o.kind, o.url, o.displayName, o.mimeType, o.sizeBytes, p.userId, nowIso());
  const id = Number(info.lastInsertRowid);
  writeAudit({
    actorUserId: p.userId, action: 'attachment.add', entityType: 'attachment', entityId: id, entityLabel: o.displayName,
    after: { ownerType, ownerId, kind: o.kind, sizeBytes: o.sizeBytes },
  });
  return shape(db().prepare(`${SELECT} WHERE a.id = ?`).get(id));
}

export function addLink(p: Principal, input: { ownerType: string; ownerId: number; url: string; displayName?: string | null }): AttachmentRow {
  ownerAccess(input.ownerType, input.ownerId).requireEdit(p);
  let u: URL;
  try { u = new URL(String(input.url ?? '').trim()); } catch { throw badRequest('Liên kết không hợp lệ — cần một địa chỉ đầy đủ bắt đầu bằng http:// hoặc https://.'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw badRequest('Chỉ nhận liên kết http:// hoặc https://.');
  if (String(input.url).length > 2000) throw badRequest('Liên kết quá dài.');
  const name = cleanName(input.displayName ?? '') || u.hostname;
  return insert(p, input.ownerType, input.ownerId, { kind: 'link', url: u.toString(), displayName: name, mimeType: null, sizeBytes: null });
}

export async function addFile(p: Principal, input: {
  ownerType: string; ownerId: number; fileName: string; data: Buffer; mimeType?: string | null; displayName?: string | null;
}): Promise<AttachmentRow> {
  ownerAccess(input.ownerType, input.ownerId).requireEdit(p);
  const original = path.basename(String(input.fileName ?? '').replace(/\\/g, '/'));
  const ext = path.extname(original).slice(1).toLowerCase();
  if (!ext || !(ext in ALLOWED_EXT) || original !== String(input.fileName ?? '').replace(/\\/g, '/')) {
    throw badRequest(`Không nhận loại tệp này. Chỉ nhận: ${ALLOWED_EXTENSIONS.join(', ')}.`);
  }
  if (!input.data || input.data.length === 0) throw badRequest('Tệp rỗng — chưa có gì để lưu.');
  if (input.data.length > MAX_FILE_BYTES) throw badRequest('Tệp quá lớn: tối đa 4 MB.');
  const stored = `${crypto.randomUUID()}.${ext}`;
  /* Khoá trong kho = đúng giá trị cột `url` của dòng tệp. */
  const khoa = `${input.ownerType}/${stored}`;
  const kho = khoTepHienTai(uploadsDir());
  await kho.ghi(khoa, input.data, ALLOWED_EXT[ext]);
  try {
    return insert(p, input.ownerType, input.ownerId, {
      kind: 'file', url: khoa,
      displayName: cleanName(input.displayName ?? '') || cleanName(original),
      mimeType: ALLOWED_EXT[ext], sizeBytes: input.data.length,
    });
  } catch (e) {
    /* Không để tệp mồ côi khi ghi bảng lỗi; dọn lỗi thì thôi — lỗi GHI BẢNG mới là lỗi cần báo lên. */
    try { await kho.xoa(khoa); } catch (e2) { console.error('[kho tệp] không xoá được', khoa, e2); }
    throw e;
  }
}

// ---------------------------------------------------------------- tải và xoá

function load(id: number) {
  const r = db().prepare(`${SELECT} WHERE a.id = ?`).get(id) as any;
  if (!r) throw notFound('Không tìm thấy tệp hoặc liên kết');
  return r;
}

/** Đường tải: KIỂM QUYỀN XEM bản ghi chủ trước khi trả bất cứ thứ gì. */
export async function openAttachment(p: Principal, id: number): Promise<
  | { kind: 'file'; duLieu: Buffer; downloadName: string; mimeType: string }
  | { kind: 'link'; url: string }> {
  const r = load(id);
  ownerAccess(r.owner_type, r.owner_id).requireView(p);
  if (r.kind === 'link') return { kind: 'link', url: r.url };
  /* Tên lưu do máy chủ sinh; kho ổ đĩa vẫn tự khoá: khoá phải nằm trong thư mục tải lên (xem `khoTepODia`). */
  const duLieu = await khoTepHienTai(uploadsDir()).doc(r.url);
  if (!duLieu) throw notFound('Tệp không còn trên máy chủ');
  return { kind: 'file', duLieu, downloadName: r.display_name, mimeType: r.mime_type ?? 'application/octet-stream' };
}

/**
 * XOÁ TỆP TRONG KHO SAU KHI GIAO DỊCH ĐÃ CHỐT. Không chờ (không `await`) và không ném: nơi gọi là hàm đồng bộ chạy
 * ngay sau `tx(...)`. Với kho ổ đĩa, lệnh xoá chạy xong ngay trong lượt gọi này (thân hàm async chạy đồng bộ tới
 * lần `await` đầu tiên) — nên hành vi máy dev và các phép kiểm cũ giữ nguyên. Với Netlify Blobs, xoá lỗi thì còn
 * một tệp mồ côi: vô hại ở quy mô này, dòng `attachments` đã xoá và đã có audit.
 */
export function xoaTepSauGiaoDich(khoaTep: string[]): void {
  const kho = khoTepHienTai(uploadsDir());
  for (const k of khoaTep) {
    ghiNhanViecNenKhoTep(kho.xoa(k).catch((e) => console.error('[kho tệp] không xoá được', k, e)));
  }
}

/**
 * XOÁ MỌI TỆP CỦA MỘT BẢN GHI CHỦ khi chính bản ghi chủ bị xoá (ví dụ xoá biện pháp Đang chuẩn bị). Không kiểm quyền ở đây — nơi
 * gọi đã kiểm quyền xoá bản ghi chủ; nhưng MỖI tệp vẫn có một dòng audit, vì xoá tệp không bao giờ được im lặng. Trả về số tệp.
 */
export function purgeAttachmentsOf(
  ownerType: AttachmentOwnerType, ownerId: number, actorUserId: number | null,
  /**
   * Có truyền mảng này thì KHÔNG xoá tệp trong kho ngay mà chỉ ghi KHOÁ TỆP TRONG KHO (cột `url`) vào đó — nơi gọi xoá SAU KHI giao dịch chốt. Xoá tệp trong giao dịch rồi giao dịch
   * lui thì mất tệp mà dòng vẫn còn (không hoàn tác được trong kho).
   */
  deferredFiles?: string[],
): number {
  const rows = db().prepare('SELECT * FROM attachments WHERE owner_type = ? AND owner_id = ?').all(ownerType, ownerId) as any[];
  for (const r of rows) {
    db().prepare('DELETE FROM attachments WHERE id = ?').run(r.id);
    if (r.kind === 'file') { if (deferredFiles) deferredFiles.push(r.url); else xoaTepSauGiaoDich([r.url]); }
    writeAudit({
      actorUserId, action: 'attachment.delete', entityType: 'attachment', entityId: r.id, entityLabel: r.display_name,
      before: { ownerType, ownerId, kind: r.kind, sizeBytes: r.size_bytes, uploadedBy: r.uploaded_by, reason: 'bản ghi chủ bị xoá' },
    });
  }
  return rows.length;
}

export async function removeAttachment(p: Principal, id: number): Promise<void> {
  const r = load(id);
  ownerAccess(r.owner_type, r.owner_id).requireEdit(p);
  db().prepare('DELETE FROM attachments WHERE id = ?').run(id);
  writeAudit({
    actorUserId: p.userId, action: 'attachment.delete', entityType: 'attachment', entityId: id, entityLabel: r.display_name,
    before: { ownerType: r.owner_type, ownerId: r.owner_id, kind: r.kind, sizeBytes: r.size_bytes, uploadedBy: r.uploaded_by },
  });
  /* Dòng bảng + audit TRƯỚC, tệp trong kho SAU; xoá tệp lỗi thì chỉ còn một tệp mồ côi — không ném. */
  if (r.kind === 'file') {
    try { await khoTepHienTai(uploadsDir()).xoa(r.url); } catch (e) { console.error('[kho tệp] không xoá được', r.url, e); }
  }
}
