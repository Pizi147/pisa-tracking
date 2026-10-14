/**
 * PR-EN — HAI TIẾNG KHÔNG THƯ VIỆN (chủ SP 07/10). `t('chữ Việt', { biến })`: trang tiếng Việt → chính chữ đó; tiếng Anh → `EN[chữ]`.
 * Ngôn ngữ của trang = `<html lang>`: script nội dòng ở `index.html` đặt nó từ `localStorage` (`NGON_NGU_KHOA`) TRƯỚC khi nạp mã,
 * nên hằng nhãn tính lúc nạp mô-đun đã đúng tiếng. Đổi tiếng = lưu + tải lại trang. Máy chủ không có `document` → luôn chữ Việt.
 */
import { EN, type Bien, type ChuKhoa, type Dich } from './en.ts';

export type { Bien, ChuKhoa };
export type NgonNgu = 'vi' | 'en';
/** Mọi chữ Việt đã có bản Anh. */
export type Khoa = keyof typeof EN;

/** Khoá `localStorage` (cạnh `CHE_DO_KHOA` = 'pisa-giao-dien'). Cùng chữ trong script của `index.html`. */
export const NGON_NGU_KHOA = 'pisa-ngon-ngu';
export const laNgonNgu = (v: unknown): v is NgonNgu => v === 'vi' || v === 'en';

export const NGON_NGU: NgonNgu = (globalThis as { document?: { documentElement?: { lang?: string } } }).document?.documentElement?.lang === 'en' ? 'en' : 'vi';

const BANG = EN as Record<string, Dich>;
/** Biến → chữ: `ChuKhoa` dịch theo khoá của nó; ở EN, chữ Việt có trong từ điển (vd tên ô "Họ tên" máy chủ gửi kèm lỗi) cũng được dịch. */
const giaTri = (nn: NgonNgu, v: Bien[string]): string | number => (v && typeof v === 'object' ? dichSang(nn, v.khoa ?? v.chu, v.bien)
  : nn === 'en' && typeof v === 'string' && typeof BANG[v] === 'string' ? BANG[v] as string : v);
const thay = (s: string, bien?: Bien) => (bien ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in bien ? String(bien[k]) : m)) : s);

/** Chữ `vi` (chữ Việt, có thể kèm `{biến}`) ở tiếng `nn`. Chữ chưa có bản Anh → chữ Việt (không vỡ). */
export function dichSang(nn: NgonNgu, vi: string, bien?: Bien): string {
  const b = bien && Object.fromEntries(Object.entries(bien).map(([k, v]) => [k, giaTri(nn, v)])) as Record<string, string | number>;
  if (nn !== 'en') return thay(vi, b);
  const e = BANG[vi];
  if (typeof e === 'function') return e(b ?? {});
  return thay(e ?? vi, b);
}

/** Chữ theo tiếng của trang — `khoa` phải có bản Anh (tsc kiểm). */
export const t = (khoa: Khoa, bien?: Bien): string => dichSang(NGON_NGU, khoa, bien);

/**
 * PR-EN-c: chữ máy chủ đã ghép sẵn, không kèm khoá ("hạn hết T3 29/09", "Nhập điểm L, R · MT2") — so với các mẫu `{biến}` của từ điển
 * (mẫu nhiều chữ cố định thử trước), phần biến bắt được dịch tiếp (lồng ≤ 3 tầng). Không khớp → null. Chỉ dùng cho chữ giao diện máy chủ gửi,
 * KHÔNG cho tên / chữ người gõ. ponytail: quét tuần tự mọi mẫu (vài trăm) + nhớ kết quả; chậm thì lập chỉ mục theo chữ cố định đầu mẫu.
 */
let MAU: { khoa: string; ten: string[]; re: RegExp }[] | null = null;
const DA_DICH = new Map<string, string | null>();
const coDinh = (k: string) => k.replace(/\{\w+\}/g, '');
const BIEN_SO = /^(n|a|b|c|so|soKy|pt|dat|tong|co|can|required|scored|con|du|sos|kv|seq|toiDa|soEm|soCase)$/;
function theoMau(vi: string, tang: number): string | null {
  if (tang > 3) return null;
  if (DA_DICH.has(vi)) return DA_DICH.get(vi)!;
  MAU ??= Object.keys(BANG)
    .filter((k) => /\{\w+\}/.test(k) && !/\}\{/.test(k) && /\p{L}{2}/u.test(coDinh(k)))   // hai biến liền nhau: không tách được
    .sort((a, b) => coDinh(b).length - coDinh(a).length)
    .map((k) => ({ khoa: k, ten: [...k.matchAll(/\{(\w+)\}/g)].map((m) => m[1]), re: new RegExp(`^${k.split(/\{\w+\}/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('((?:(?! · ).)+?)')}$`) }));   // biến không vượt qua " · ": câu ghép thì dịch từng mảnh
  let ra: string | null = null;
  for (const m of MAU) {
    const r = m.re.exec(vi);
    if (!r) continue;
    /* Biến đếm ({n}, {a}, {so}…) phải bắt được SỐ — chặn "Tiến bộ một phần" khớp nhầm mẫu "{n} phần". */
    if (m.ten.some((ten, i) => BIEN_SO.test(ten) && !/^[\d.,–-]+$/.test(r[i + 1]))) continue;
    const b: Record<string, string> = {};
    m.ten.forEach((ten, i) => { const g = r[i + 1]; b[ten] = typeof BANG[g] === 'string' ? BANG[g] as string : theoMau(g, tang + 1) ?? g; });
    ra = dichSang('en', m.khoa, b);
    break;
  }
  /* Câu ghép bằng " · " ("Xử lý vi phạm · hạn 16/09 · quá hạn 3 ngày"): dịch từng mảnh. */
  if (ra === null && vi.includes(' · ')) {
    const manh = vi.split(' · ').map((p) => (typeof BANG[p] === 'string' ? BANG[p] as string : theoMau(p, tang + 1)));
    if (manh.some((p) => p !== null)) ra = manh.map((p, i) => p ?? vi.split(' · ')[i]).join(' · ');
  }
  DA_DICH.set(vi, ra);
  return ra;
}

/** Chữ đến từ máy chủ / dữ liệu (không biết trước): có bản Anh thì dịch (đúng chữ, rồi theo mẫu), không thì giữ nguyên chữ Việt. */
export const dich = (vi: string, bien?: Bien): string =>
  NGON_NGU === 'en' && !bien && !(vi in BANG) ? theoMau(vi, 0) ?? vi : dichSang(NGON_NGU, vi, bien);
/** Như `dich` nhưng chọn tiếng (phép kiểm). */
export const dichMau = (nn: NgonNgu, vi: string): string => (nn === 'en' && !(vi in BANG) ? theoMau(vi, 0) ?? vi : dichSang(nn, vi));

/** PR-EN-c: chữ máy chủ dựng có biến — câu Việt + khoá + biến (máy chủ luôn Việt; web dịch bằng `dichChu`). */
export const kem = (khoa: Khoa, bien?: Bien): ChuKhoa => ({ chu: dichSang('vi', khoa, bien), khoa, bien });
/** Chữ máy chủ gửi (`{ chu, khoa?, bien? }`) theo tiếng của trang. */
export const dichChu = (x: ChuKhoa): string => dich(x.khoa ?? x.chu, x.bien);
/** Mẫu chỉ có biến + dấu câu ("{dau}: {hoTro}") — không cần từ điển; biến vẫn được dịch. */
export const ghepChu = (mau: string, bien: Bien): ChuKhoa => ({ chu: dichSang('vi', mau, bien), khoa: mau, bien });
