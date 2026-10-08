/**
 * GỘP VIỆC THEO LỚP (PR-GOP, đặc tả 2026-10-08 §5, §7 Q1; mockup cuối khoá 2 phần 4).
 *
 * MỘT DÒNG = MỘT LỚP × MỘT LOẠI VIỆC × MỘT NGƯỜI GIỮ VIỆC. Bên trong là danh sách em (`con`), mỗi em giữ nguyên dòng việc cũ (khoá, nút,
 * hạn riêng) — làm xong em nào em đó rời danh sách. Hạn dòng = hạn sớm nhất; có em quá hạn → dòng quá hạn. Lớp chỉ còn một việc → dòng
 * như cũ. Cùng một hàm cho máy chủ (badge / summary đếm dòng, Nhắc tra khoá dòng) và giao diện.
 *
 * Giữ từng dòng: Case SOS Fast Track (Xác nhận nguyên nhân · Xác nhận PA · Thêm PA ở lớp FT — mỗi Case một quyết định riêng), việc không
 * gắn lớp. Khác người giữ việc thì không gộp: mỗi dòng một nút Nhắc cho đúng một người. Thẻ Chờ duyệt không phải dòng việc (hộp riêng).
 */

export type ViecGopDuoc = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal'; due: string | null;
  studentId: number | null; studentName: string; classId: number | null; classCode: string | null;
  khung?: 'ft' | 'thuong' | null; ownerId: number | null;
  tieuDe: string; contextLabel: string | null; count: number | null; href: string; actionLabel: string;
  /** Case sinh từ SOS (`origin_kind = 'mock'`, Case từ kết quả Test) — khác Case GV / QL tự tạo, chuyển cấp, khai bù. */
  caseSos?: boolean;
};
/** Một em (một việc) trong dòng gộp: `conTen` đậm, `conPhu` mờ — mockup phần 4 ("Lý Minh Châu" / "Reading · MT2"). */
export type ConGop<T> = T & { conTen: string; conPhu: string };
export type DongGop<T> = T & { con: ConGop<T>[] };

/** Case SOS Fast Track: mỗi Case giữ một dòng (§7 Q1) — chỉ Case sinh từ SOS; Case GV tự tạo gộp như việc khác (chủ sản phẩm 08/10). */
const GIU_TUNG_DONG_FT = new Set(['cause', 'xac_nhan_pa', 'no_plan']);

export const khoaDongGop = (group: string, classId: number, ownerId: number | null) => `gop:${group}:${classId}:u${ownerId ?? 0}`;
/** Nhóm của khoá dòng gộp (`gop:{nhóm}:{lớp}:u{người}`); khoá khác → null. */
export const nhomCuaKhoaGop = (key: string): string | null => (key.startsWith('gop:') ? key.split(':')[1] ?? null : null);

const gopDuoc = (it: ViecGopDuoc) => it.classId !== null && !(it.khung === 'ft' && it.caseSos && GIU_TUNG_DONG_FT.has(it.group));
/** Khoá dòng gộp mà việc này thuộc về; việc giữ từng dòng → null. Nhắc dùng để tìm lại việc khi dòng gộp chỉ còn một việc. */
export const khoaGopCua = (it: ViecGopDuoc): string | null => (gopDuoc(it) ? khoaDongGop(it.group, it.classId!, it.ownerId) : null);
const nang = (u: ViecGopDuoc['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
const sapViec = (a: ViecGopDuoc, b: ViecGopDuoc) =>
  nang(a.urgency) - nang(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.studentName.localeCompare(b.studentName, 'vi');

/** Bỏ nhãn loại việc đứng đầu và tên em khỏi tiêu đề → phần riêng của em ("Kết quả PA Reading" → "Reading"). */
function phanRieng(it: ViecGopDuoc, nhanLoai: string): string {
  const s = it.tieuDe.startsWith(nhanLoai) ? it.tieuDe.slice(nhanLoai.length) : it.tieuDe;
  const ten = it.studentId !== null ? it.studentName : null;
  return s.split('·').map((x) => x.trim())
    .map((x) => (ten && x.startsWith(`${ten} `) ? x.slice(ten.length).trim() : x))
    .filter((x) => x && x !== ten).join(' · ');
}

function conCua<T extends ViecGopDuoc>(it: T, nhanLoai: string): ConGop<T> {
  const rieng = phanRieng(it, nhanLoai);
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
    if (!k || !nhom || nhom.length < 2) { out.push(it); continue; }
    if (daDat.has(k)) continue;
    daDat.add(k);
    const nhanLoai = nhan(it.group);
    const con = [...nhom].sort(sapViec).map((x) => conCua(x, nhanLoai));
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
      tieuDe: `${nhanLoai} · ${it.classCode ?? ''} · ${nhom.length} ${donVi}`,
      contextLabel: quaHan ? `${quaHan} ${donVi} quá hạn` : chung.length === 1 ? chung[0] : null,
      count: nhom.length, actionLabel: `${nhom.length} ${donVi}`,
      reason: `${nhom.length} ${donVi}`,
      href: href.length === 1 ? href[0] : '/cong-viec?khung=tat-ca',
      con,
    } as unknown as DongGop<T>;
    out.push(dong);
  }
  return out.map((x, i) => ({ x, i })).sort((a, b) => nang(a.x.urgency) - nang(b.x.urgency)
    || (a.x.due && b.x.due ? a.x.due.localeCompare(b.x.due) : a.x.due ? -1 : b.x.due ? 1 : 0) || a.i - b.i).map((x) => x.x);
}
