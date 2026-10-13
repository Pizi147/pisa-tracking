/**
 * GỘP VIỆC THEO LỚP (PR-GOP, đặc tả 2026-10-08 §5, §7 Q1; mockup cuối khoá 2 phần 4).
 *
 * MỘT DÒNG = MỘT LỚP × MỘT LOẠI VIỆC × MỘT NGƯỜI GIỮ VIỆC. Bên trong là danh sách em (`con`), mỗi em giữ nguyên dòng việc cũ (khoá, nút,
 * hạn riêng) — làm xong em nào em đó rời danh sách. Hạn dòng = hạn sớm nhất; có em quá hạn → dòng quá hạn. Lớp chỉ còn một việc → dòng
 * như cũ. Cùng một hàm cho máy chủ (badge / summary đếm dòng, Nhắc tra khoá dòng) và giao diện.
 *
 * Giữ từng dòng: Case SOS Fast Track (Xác nhận PA · Thêm PA ở lớp FT — mỗi Case một quyết định riêng), việc không gắn lớp. Khác người
 * giữ việc thì không gộp: mỗi dòng một nút Nhắc cho đúng một người. Thẻ Chờ duyệt không phải dòng việc (hộp riêng).
 *
 * OV-5a (đặc tả OV mục 4, mockup M1 §1): Xác nhận nguyên nhân gom theo LỚP + KỸ NĂNG + LƯỢT (`gopThem`) — cả lớp FT — và một em vẫn là dòng
 * gộp, để khoá dòng không đổi khi panel xác nhận bớt em ("còn 1 em").
 */

export type ViecGopDuoc = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal'; due: string | null;
  studentId: number | null; studentName: string; classId: number | null; classCode: string | null;
  khung?: 'ft' | 'thuong' | null; ownerId: number | null;
  tieuDe: string; contextLabel: string | null; count: number | null; href: string; actionLabel: string;
  /** PR-DON: phần riêng của việc khi nằm trong dòng gộp (kỹ năng, bài, việc cụ thể) — dòng phụ của em; dòng đã gom sẵn: tên việc. Không có → dòng phụ chỉ là `contextLabel`. */
  phu?: string | null;
  /** Case sinh từ SOS (`origin_kind = 'mock'`, Case từ kết quả Test) — khác Case GV / QL tự tạo, chuyển cấp, khai bù. */
  caseSos?: boolean;
  /** OV-5a: phần thêm của khoá gộp (Xác nhận nguyên nhân: `{bài}{số}:{kỹ năng}`). Có thì gộp kể cả một việc; tiêu đề `{loại} · {phu}`. */
  gopThem?: string | null;
};
/** Một em (một việc) trong dòng gộp: `conTen` đậm, `conPhu` mờ — mockup phần 4 ("Lý Minh Châu" / "Reading · MT2"). */
export type ConGop<T> = T & { conTen: string; conPhu: string };
export type DongGop<T> = T & { con: ConGop<T>[] };

/** Case SOS Fast Track: mỗi Case giữ một dòng (§7 Q1) — chỉ Case sinh từ SOS; Case GV tự tạo gộp như việc khác (chủ sản phẩm 08/10). */
const GIU_TUNG_DONG_FT = new Set(['xac_nhan_pa', 'no_plan']);

export const khoaDongGop = (group: string, classId: number, ownerId: number | null, them?: string | null) =>
  `gop:${group}:${classId}:u${ownerId ?? 0}${them ? `:${them}` : ''}`;
/** Nhóm của khoá dòng gộp (`gop:{nhóm}:{lớp}:u{người}`); khoá khác → null. */
export const nhomCuaKhoaGop = (key: string): string | null => (key.startsWith('gop:') ? key.split(':')[1] ?? null : null);

const gopDuoc = (it: ViecGopDuoc) => it.classId !== null && !(it.khung === 'ft' && it.caseSos && GIU_TUNG_DONG_FT.has(it.group));
/** Khoá dòng gộp mà việc này thuộc về; việc giữ từng dòng → null. Nhắc dùng để tìm lại việc khi dòng gộp chỉ còn một việc. */
export const khoaGopCua = (it: ViecGopDuoc): string | null => (gopDuoc(it) ? khoaDongGop(it.group, it.classId!, it.ownerId, it.gopThem) : null);
/** PR-DON: các khoá cùng chỉ một (nhóm) việc — khoá gửi, khoá dòng, khoá gộp của việc lẻ, khoá từng em của dòng gộp. Nhắc qua khoá nào cũng tính một lần/ngày. */
export function khoaCungViec(row: (ViecGopDuoc & { con?: readonly { key: string }[] }) | undefined, key: string): string[] {
  if (!row) return [key];
  return [...new Set([key, row.key, ...(row.con ? row.con.map((c) => c.key) : [khoaGopCua(row)])].filter((k): k is string => !!k))];
}
const nang = (u: ViecGopDuoc['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
const sapViec = (a: ViecGopDuoc, b: ViecGopDuoc) =>
  nang(a.urgency) - nang(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.studentName.localeCompare(b.studentName, 'vi');

function conCua<T extends ViecGopDuoc>(it: T): ConGop<T> {
  const rieng = it.phu ?? '';
  if (it.studentId !== null) {
    const phu = [...new Set([rieng, it.contextLabel].filter((x): x is string => !!x))];
    return { ...it, conTen: it.studentName, conPhu: phu.join(' · ') };
  }
  /* Dòng đã gom sẵn (Nhập điểm theo bài, Thiếu dữ liệu): tên = việc + bài, phụ = số em. */
  return { ...it, conTen: [rieng || it.tieuDe, it.contextLabel].filter(Boolean).join(' · '), conPhu: it.count !== null && it.count > 1 ? `${it.count} HV` : '' };
}

/**
 * `items` phẳng (mỗi phần tử một việc) → dòng hiển thị. Dòng gộp đứng ở chỗ việc đầu tiên của nó, rồi mọi dòng sắp lại theo hạn
 * (quá hạn → hôm nay → hạn gần → không hạn), thứ tự ổn định. `nhan(group)` = tên loại việc (`GROUP_META`).
 */
export function gopViecTheoLop<T extends ViecGopDuoc>(items: readonly T[], nhan: (group: string) => string): (T | DongGop<T>)[] {
  const theoKhoa = new Map<string, T[]>();
  for (const it of items) {
    const k = khoaGopCua(it);
    if (!k) continue;
    (theoKhoa.get(k) ?? theoKhoa.set(k, []).get(k)!).push(it);
  }
  const daDat = new Set<string>();
  const out: (T | DongGop<T>)[] = [];
  for (const it of items) {
    const k = khoaGopCua(it);
    const nhom = k ? theoKhoa.get(k)! : null;
    if (!k || !nhom || (nhom.length < 2 && !it.gopThem)) { out.push(it); continue; }
    if (daDat.has(k)) continue;
    daDat.add(k);
    const nhanLoai = nhan(it.group);
    const con = [...nhom].sort(sapViec).map((x) => conCua(x));
    const dau = con[0];
    /* "n em" chỉ khi mỗi việc là một em khác nhau; một em hai PA, hay dòng đã gom sẵn → "n việc". */
    const theoEm = nhom.every((x) => x.studentId !== null) && new Set(nhom.map((x) => x.studentId)).size === nhom.length;
    const donVi = theoEm ? 'em' : 'việc';
    const quaHan = nhom.filter((x) => x.urgency === 'overdue').length;
    const due = nhom.map((x) => x.due).filter((x): x is string => !!x).sort()[0] ?? null;
    const chung = [...new Set(nhom.map((x) => x.contextLabel))];
    const href = [...new Set(nhom.map((x) => x.href))];
    const dong = {
      ...it,
      key: k, urgency: dau.urgency, due,
      studentId: null, studentName: `Lớp ${it.classCode ?? ''}`.trim(),
      attemptId: null, attemptNo: null, caseId: null, level: null, nhac: undefined,
      /* OV-5a: dòng gom theo kỹ năng + lượt — tiêu đề nói kỹ năng; lượt luôn chung (khoá có lượt), hạn ở cột riêng. */
      tieuDe: it.gopThem ? `${nhanLoai} · ${it.phu ?? ''}` : `${nhanLoai} · ${it.classCode ?? ''} · ${nhom.length} ${donVi}`,
      contextLabel: it.gopThem ? it.contextLabel : quaHan ? `${quaHan} ${donVi} quá hạn` : chung.length === 1 ? chung[0] : null,
      count: nhom.length, actionLabel: `${nhom.length} ${donVi}`,
      reason: `${nhom.length} ${donVi}`,
      /* OV-5a: dòng gom kỹ năng + lượt làm cả nhóm ở panel Công việc — chuông Nhắc / Tổng quan mở đúng dòng (`viec=` khoá dòng). */
      href: it.gopThem ? `/cong-viec?viec=${encodeURIComponent(k)}` : href.length === 1 ? href[0] : '/cong-viec?khung=tat-ca',
      con,
    } as unknown as DongGop<T>;
    out.push(dong);
  }
  return out.map((x, i) => ({ x, i })).sort((a, b) => nang(a.x.urgency) - nang(b.x.urgency)
    || (a.x.due && b.x.due ? a.x.due.localeCompare(b.x.due) : a.x.due ? -1 : b.x.due ? 1 : 0) || a.i - b.i).map((x) => x.x);
}
