/**
 * PR-EN — HAI TIẾNG KHÔNG THƯ VIỆN (chủ SP 07/10). `t('chữ Việt', { biến })`: trang tiếng Việt → chính chữ đó; tiếng Anh → `EN[chữ]`.
 * Ngôn ngữ của trang = `<html lang>`: script nội dòng ở `index.html` đặt nó từ `localStorage` (`NGON_NGU_KHOA`) TRƯỚC khi nạp mã,
 * nên hằng nhãn tính lúc nạp mô-đun đã đúng tiếng. Đổi tiếng = lưu + tải lại trang. Máy chủ không có `document` → luôn chữ Việt.
 */
import { EN, KHOA_CHI_T, type Bien, type ChuKhoa, type Dich } from './en.ts';

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
  : nn === 'en' && typeof v === 'string' && typeof BANG[v] === 'string' ? BANG[v] as string : v ?? String(v));   // null / undefined in như `${x}` cũ
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
 * Chữ đến từ máy chủ / dữ liệu (không biết trước): có bản Anh thì dịch, không thì giữ nguyên chữ Việt.
 * PR-EN đợt b: chữ máy chủ ghép sẵn ("Nhập điểm L, R · MB FT 101 · 27 bài") dịch bằng MẪU — chính các khoá có `{biến}` của từ điển —
 * nên máy chủ không phải gửi khoá riêng, thông báo đã lưu cũng dịch được. Chưa khớp mẫu nào → chữ Việt (không vỡ).
 */
export const dich = (vi: string, bien?: Bien): string => (NGON_NGU === 'en' && !bien ? dichTho(vi) : dichSang(NGON_NGU, vi, bien));
/** Như `dich` nhưng chọn tiếng (phép kiểm). */
export const dichMau = (nn: NgonNgu, vi: string): string => (nn === 'en' ? dichTho(vi) : dichSang(nn, vi));

/** PR-EN-c: chữ máy chủ dựng có biến — câu Việt + khoá + biến (máy chủ luôn Việt; web dịch bằng `dichChu`). */
export const kem = (khoa: Khoa, bien?: Bien): ChuKhoa => ({ chu: dichSang('vi', khoa, bien), khoa, bien });
/** Chữ máy chủ gửi (`{ chu, khoa?, bien? }`) theo tiếng của trang: có khoá → dịch theo khoá; không → như `dich` (đúng chữ, rồi theo mẫu). */
export const dichChu = (x: ChuKhoa): string => dich(x.khoa ?? x.chu, x.bien);
/** Mẫu chỉ có biến + dấu câu ("{dau}: {hoTro}") — không cần từ điển; biến vẫn được dịch. */
export const ghepChu = (mau: string, bien: Bien): ChuKhoa => ({ chu: dichSang('vi', mau, bien), khoa: mau, bien });

type Mau = { re: RegExp; khoa: string; ten: string[] };
let dsMau: Mau[] | null = null;
const daDich = new Map<string, string>();
const DAU = 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
const RE_DAU = new RegExp(`[${DAU}]`, 'i');
const chuCoDinh = (k: string) => k.replace(/\{\w+\}/g, '').replace(/[^\p{L}]/gu, '');
/**
 * Khoá có biến → biểu thức khớp nguyên câu; phần chữ dài khớp trước. Bỏ khoá chỉ toàn biến / phần chữ < 2 chữ cái và khoá có hai biến liền
 * nhau (`{a}{b}` không biết cắt ở đâu) — câu đó rơi xuống tách đoạn. Biến không chứa dấu "·" (không khớp nhầm cả câu ghép).
 * Khoá phần chữ < 4 chữ cái ("Bỏ {ten}"), hay mở đầu bằng biến mà < 6 ("{n} em", "{n} ngày") chỉ nhận biến KHÔNG dấu (số, mã) — không thì chữ người gõ
 * kết thúc bằng "… của lớp" / "… cùng ngày" khớp nhầm "{n} lớp" / "{n} ngày". Biến tên số / ngày / mã (`BIEN_SO`) cũng vậy.
 */
/** Tên biến mang số / ngày / mã tuần / mã lớp — chỉ khớp chữ không dấu ("Ghi nhận {dm}" không nuốt "Ghi nhận từ buổi học…" người gõ). */
const BIEN_SO = /^(n|size|length|count|ngay|ngan|dm|day|han|pt|tw2?|r|b|ma\w*|so[A-Z]\w*|tuan\w*|code\d?|classCode|lop|\w+No|lan\w*|phanTram|quaHan\w*|homNay|daCham|tong|fmtDate|shortDate|a|c|so|dat|co|can|required|scored|con|du|sos|kv|seq|toiDa)$/;
function mau(): Mau[] {
  return dsMau ??= Object.keys(BANG).filter((k) => k.includes('{') && !k.includes('}{') && chuCoDinh(k).length >= 2 && !KHOA_CHI_T.has(k))
    .sort((a, b) => chuCoDinh(b).length - chuCoDinh(a).length)
    .map((khoa) => {
      const ten: string[] = [];
      const chu = chuCoDinh(khoa).length;
      const ngan = chu < 4 || (chu < 6 && khoa.startsWith('{'));
      const nguon = khoa.split(/(\{\w+\})/).map((p) => {
        const m = /^\{(\w+)\}$/.exec(p);
        if (!m) return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        ten.push(m[1]);
        return ngan || BIEN_SO.test(m[1]) ? `((?:(?! — )[^·${DAU}${DAU.toUpperCase()}])+?)` : '([^·]+?)';
      }).join('');
      return { re: new RegExp(`^${nguon}$`, 's'), khoa, ten };
    });
}
function theoMau(s: string): string | null {
  for (const m of mau()) {
    const r = m.re.exec(s);
    if (!r) continue;
    const b: Bien = {};
    /* Biến dịch đệ quy, giữ khoảng trắng hai đầu ("Thêm PA học thuật{kn}" bắt " Tổng hợp"). */
    m.ten.forEach((n, i) => { b[n] = r[i + 1].replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, a: string, g: string, c: string) => a + dichTho(g) + c); });
    return dichSang('en', m.khoa, b);
  }
  return null;
}
/** Câu ghép bởi dấu ngăn: dịch từng đoạn (đoạn là tên, mã, chữ người gõ thì giữ). */
const tach = (s: string, ngan: string) => (s.includes(ngan) ? s.split(ngan).map(dichTho).join(ngan) : null);
/** Tiếng Anh (một bộ dịch chung cho EN-b + EN-c) của một chữ Việt bất kỳ: đúng khoá → mẫu cả câu → từng đoạn tách bởi " · ", rồi " — ". Không khớp gì → giữ (tên, mã, chữ người gõ). */
function dichTho(s: string): string {
  if (!s) return s;
  const e = BANG[s];
  if (typeof e === 'string') return e;
  const co = daDich.get(s);
  if (co !== undefined) return co;
  const ra = typeof e === 'function' ? e({}) : theoMau(s) ?? tach(s, ' · ') ?? (RE_DAU.test(s) ? tach(s, ' — ') : null) ?? s;
  daDich.set(s, ra);
  return ra;
}

