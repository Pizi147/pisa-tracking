/**
 * GỘP VIỆC THEO LỚP (PR-GOP, đặc tả 2026-10-08 §5, §7 Q1; mockup cuối khoá 2 phần 4).
 *
 * MỘT DÒNG = MỘT LỚP × MỘT LOẠI VIỆC × MỘT NGƯỜI GIỮ VIỆC. Bên trong là danh sách em (`con`), mỗi em giữ nguyên dòng việc cũ (khoá, nút,
 * hạn riêng) — làm xong em nào em đó rời danh sách. Hạn dòng = hạn sớm nhất; có em quá hạn → dòng quá hạn. Lớp chỉ còn một việc → dòng
 * như cũ. Cùng một hàm cho máy chủ (badge / summary đếm dòng, Nhắc tra khoá dòng) và giao diện.
 *
 * Giữ từng dòng: Case SOS Fast Track (Xác nhận PA · Thêm PA ở lớp FT — mỗi Case một quyết định riêng), việc không gắn lớp. Khác người
 * giữ việc thì không gộp: mỗi dòng một nút Nhắc cho đúng một người. Thẻ Chờ duyệt không phải dòng việc (hộp riêng).
 * OV-12c: bỏ gom Xác nhận nguyên nhân theo kỹ năng + lượt (OV-5a) — Case MT lấy nguyên nhân từ nhận xét (không còn việc đó).
 * OV-13c (chủ SP 15/10, Q4): Case SOS FT — Xác nhận PA, Ghi nhận xét — gộp theo lớp + TUẦN THI + MỨC SOS (không cần cùng MT); Thêm PA vẫn từng
 * dòng. Nhập điểm gộp theo TUẦN THI qua mọi lớp của cùng người giữ việc (lưới Lịch Test) — mỗi em con là một lớp của tuần đó.
 */
import { tuanLich } from './hienThiNgay.ts';


export type ViecGopDuoc = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal'; due: string | null;
  studentId: number | null; studentName: string; classId: number | null; classCode: string | null;
  khung?: 'ft' | 'thuong' | null; ownerId: number | null;
  tieuDe: string; contextLabel: string | null; count: number | null; href: string; actionLabel: string;
  /** PR-DON: phần riêng của việc khi nằm trong dòng gộp (kỹ năng, bài, việc cụ thể) — dòng phụ của em; dòng đã gom sẵn: tên việc. Không có → dòng phụ chỉ là `contextLabel`. */
  phu?: string | null;
  /** Case sinh từ SOS (`origin_kind = 'mock'`, Case từ kết quả Test) — khác Case GV / QL tự tạo, chuyển cấp, khai bù. */
  caseSos?: boolean;
  /** Nhập điểm: số bài (kỹ năng × em) — OV-11c: dòng gộp Nhập điểm một đơn vị "bài". */
  soBai?: number;
  /** OV-13c: thứ Hai tuần thi (Case SOS FT, Nhập điểm) · mức SOS 1/2/3 của Case. */
  tuanThi?: string | null; sos?: number | null;
};
/** Một em (một việc) trong dòng gộp: `conTen` đậm, `conPhu` mờ — mockup phần 4 ("Lý Minh Châu" / "Reading · MT2"). */
export type ConGop<T> = T & { conTen: string; conPhu: string };
export type DongGop<T> = T & { con: ConGop<T>[] };

/** Case SOS Fast Track: mỗi Case giữ một dòng (§7 Q1) — chỉ Case sinh từ SOS; Case GV tự tạo gộp như việc khác (chủ sản phẩm 08/10). */
/* OV-12c: Ghi nhận xét (Case MT cũ) như trước OV-5a — mỗi Case một dòng; Xác nhận Case lớp thường gộp theo lớp, mở từng em. */
const GIU_TUNG_DONG_FT = new Set(['no_plan']);
/** OV-13c (Q4): Case SOS FT gộp theo lớp + tuần thi + mức SOS. */
const GOP_TUAN_SOS = new Set(['ghi_nhan_xet', 'xac_nhan_pa']);
const laChamCheo = (it: ViecGopDuoc) => it.key.endsWith('|cc');   // khoá Nhập điểm Speaking chấm chéo (T18, `mywork.ts`)

export const khoaDongGop = (group: string, classId: number, ownerId: number | null) => `gop:${group}:${classId}:u${ownerId ?? 0}`;
/** Nhóm của khoá dòng gộp (`gop:{nhóm}:{lớp}:u{người}`); khoá khác → null. */
export const nhomCuaKhoaGop = (key: string): string | null => (key.startsWith('gop:') ? key.split(':')[1] ?? null : null);

const gopDuoc = (it: ViecGopDuoc) => it.classId !== null && !(it.khung === 'ft' && it.caseSos && GIU_TUNG_DONG_FT.has(it.group));
/** Dòng Nhập điểm gộp theo tuần thi qua nhiều lớp (OV-13c). */
const theoTuanThi = (it: ViecGopDuoc) => it.group === 'score' && !!it.tuanThi && !laChamCheo(it);
/** Khoá dòng gộp mà việc này thuộc về; việc giữ từng dòng → null. Giao diện dùng để giữ việc vừa xong trong dòng gộp của nó. */
export function khoaGopCua(it: ViecGopDuoc): string | null {
  if (!gopDuoc(it)) return null;
  if (theoTuanThi(it)) return `gop:score:t${it.tuanThi}:u${it.ownerId ?? 0}:${it.khung ?? ''}`;
  const k = khoaDongGop(it.group, it.classId!, it.ownerId);
  return it.khung === 'ft' && it.caseSos && GOP_TUAN_SOS.has(it.group) ? `${k}:t${it.tuanThi ?? ''}:s${it.sos ?? 0}` : k;
}
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
  const phu = it.group === 'score' && it.soBai ? `${it.soBai} bài` : it.count !== null && it.count > 1 ? `${it.count} HV` : '';
  return { ...it, conTen: [rieng || it.tieuDe, it.contextLabel].filter(Boolean).join(' · '), conPhu: phu };
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
    const con = [...nhom].sort(sapViec).map((x) => conCua(x));
    const dau = con[0];
    /*
     * OV-11c (TE-4, CV-17): MỘT đơn vị mỗi dòng — Nhập điểm đếm "bài" (kỹ năng × em); việc theo em đếm em KHÁC NHAU (một em hai PA vẫn "1 em");
     * còn lại (dòng đã gom sẵn) "việc".
     */
    const laBai = it.group === 'score';
    const theoEm = !laBai && nhom.every((x) => x.studentId !== null);
    const donVi = laBai ? 'bài' : theoEm ? 'em' : 'việc';
    const dem = (ds: readonly T[]) => (laBai ? ds.reduce((n, x) => n + (x.soBai ?? x.count ?? 1), 0) : theoEm ? new Set(ds.map((x) => x.studentId)).size : ds.length);
    const so = dem(nhom);
    /* Plan mục 4: một em hai việc (hai PA) — "1 em · 2 việc", không mất số việc. */
    const chuSo = theoEm && nhom.length > so ? `${so} em · ${nhom.length} việc` : `${so} ${donVi}`;
    const quaHan = dem(nhom.filter((x) => x.urgency === 'overdue'));
    const due = nhom.map((x) => x.due).filter((x): x is string => !!x).sort()[0] ?? null;
    const chung = [...new Set(nhom.map((x) => x.contextLabel))];
    const href = [...new Set(nhom.map((x) => x.href))];
    const chuQuaHan = quaHan ? `${quaHan} ${donVi} quá hạn` : null;
    /* OV-13c: dòng tuần thi (Nhập điểm nhiều lớp) · dòng Case SOS (lượt · tuần · mức SOS). */
    const tuan = theoTuanThi(it) ? tuanLich(it.tuanThi) : null;
    const lop = [...new Set(nhom.map((x) => x.classId))];
    const sos = it.khung === 'ft' && it.caseSos && GOP_TUAN_SOS.has(it.group) ? it : null;
    const dong = {
      ...it,
      key: k, urgency: dau.urgency, due,
      studentId: null, studentName: tuan ?? `Lớp ${it.classCode ?? ''}`.trim(),
      ...(tuan && lop.length > 1 ? { classId: null, classCode: null } : {}),
      attemptId: null, attemptNo: null, caseId: null, level: null, nhac: undefined,
      tieuDe: `${nhanLoai} · ${tuan ?? it.classCode ?? ''} · ${chuSo}`,
      contextLabel: tuan
        ? [chuQuaHan, lop.length > 1 ? `${lop.length} lớp` : it.classCode].filter(Boolean).join(' · ')
        : sos
          ? [chuQuaHan ?? chung.filter(Boolean).sort().join(', '), sos.tuanThi ? tuanLich(sos.tuanThi) : null, sos.sos ? `SOS ${sos.sos}` : null].filter(Boolean).join(' · ')
          : chuQuaHan ?? (chung.length === 1 ? chung[0] : null),
      count: nhom.length, actionLabel: chuSo,
      reason: chuSo,
      href: href.length === 1 ? href[0] : '/cong-viec?khung=tat-ca',
      con: tuan ? con.map((c) => ({ ...c, conTen: [c.classCode, c.conTen].filter(Boolean).join(' · ') })) : con,
    } as unknown as DongGop<T>;
    out.push(dong);
  }
  return out.map((x, i) => ({ x, i })).sort((a, b) => nang(a.x.urgency) - nang(b.x.urgency)
    || (a.x.due && b.x.due ? a.x.due.localeCompare(b.x.due) : a.x.due ? -1 : b.x.due ? 1 : 0) || a.i - b.i).map((x) => x.x);
}
