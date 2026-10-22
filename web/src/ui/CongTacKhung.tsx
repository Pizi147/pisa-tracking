import { BoLocDoan } from './ui.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * CÔNG TẮC HAI KHUNG (MH4, K4-05, Q3, Q8) — `Fast Track · Lớp thường` (Test) hoặc `Tất cả · Fast Track · Lớp thường` (Công việc).
 * Một khung một bộ môn: không trộn môn hai khung (MH5). Nhớ theo máy VÀ theo người (localStorage, khoá `.u{userId}` — PR-S6F-b Q7: máy chung,
 * demo đổi vai; bọc try/catch — trang vẫn chạy khi không đọc được); tham số `loai` trên đường dẫn thắng (nơi gọi đọc URL trước `khungDaNho`).
 * Phạm vi người xem chỉ có một khung → không vẽ gì (UX-2: theo phạm vi, không theo dữ liệu trang; khung rỗng ghi "· 0").
 */
export type KhungLoc = 'ft' | 'thuong' | 'tat-ca';
type Trang = 'lich-test' | 'ke-hoach-test' | 'diem-theo-lop' | 'cong-viec' | 'hoc-vien-lop' | 'tong-quan' | 'phan-tich-gv';

/** Người đang đăng nhập — `SessionProvider` đặt mỗi khi phiên đổi; một chỗ cho mọi trang dùng công tắc. */
let nguoiDung: number | null = null;
/** PR-OV2a: bộ lọc nhớ THEO TỪNG VAI khi đổi góc nhìn — hậu tố `.v{vai}` cho mọi khoá nhớ theo người (khung, chi nhánh, Lịch Test). */
let hauToVai = '';
/** UX-2 (5): khung có lớp trong phạm vi người xem (phiên) — công tắc hiện theo đây, không theo dữ liệu trang. null = chưa biết (theo `dem`). */
let khungCuaPhamVi: { ft: boolean; thuong: boolean } | null = null;
export const datNguoiDungKhung = (id: number | null, gocNhin: string | null = null, khung: { ft: boolean; thuong: boolean } | null = null) => {
  nguoiDung = id; hauToVai = gocNhin ? `.v${gocNhin}` : ''; khungCuaPhamVi = khung;
};
/** Phạm vi người xem có cả hai khung — trang không được ép bỏ khung đang rỗng (công tắc vẫn hiện, ghi "· 0"). */
export const phamViCoHaiKhung = () => !!khungCuaPhamVi?.ft && !!khungCuaPhamVi.thuong;
export const hauToGocNhin = () => hauToVai;
const khoa = (trang: Trang) => `pisa.khung.${trang}${nguoiDung ? `.u${nguoiDung}` : ''}${hauToVai}`;
const hopLe = (v: unknown): v is KhungLoc => v === 'ft' || v === 'thuong' || v === 'tat-ca';

export function khungDaNho(trang: Trang): KhungLoc | null {
  try {
    const v = localStorage.getItem(khoa(trang));
    return hopLe(v) ? v : null;
  } catch { return null; }
}
export function nhoKhung(trang: Trang, k: KhungLoc) {
  try { localStorage.setItem(khoa(trang), k); } catch { /* không lưu được thì thôi — lần sau về mặc định */ }
}

export function CongTacKhung({ trang, value, onChange, dem, donVi = '', coTatCa = false, kieu = 'doan' }: {
  trang: Trang; value: KhungLoc; onChange: (k: KhungLoc) => void;
  /** Số hiện cạnh tên khung (lớp, việc…); khung có số 0 coi như không có dữ liệu. */
  dem?: Partial<Record<KhungLoc, number>>;
  /** Chữ sau số: `Fast Track · 3 lớp`. Trống = chỉ số. */
  donVi?: string;
  coTatCa?: boolean;
  /** `chon` = ô chọn "Loại lớp: …" (Học viên & Lớp, K1 — không có hai chữ "Tất cả" cạnh nhau); `chip` = chip rời (Lịch tuần V5, dieu-chinh-cuoi khu a); mặc định phân đoạn. */
  kieu?: 'doan' | 'chon' | 'chip';
}) {
  /* UX-2 (5): hiện theo lớp trong phạm vi người xem; chưa biết phạm vi thì theo dữ liệu đang xem như cũ. */
  const coDuLieu = khungCuaPhamVi ? (['ft', 'thuong'] as const).filter((k) => khungCuaPhamVi![k]) : (['ft', 'thuong'] as const).filter((k) => (dem?.[k] ?? 1) > 0);
  if (coDuLieu.length < 2) return null;
  const nhan = (ten: string, k: KhungLoc) => (dem?.[k] != null && donVi ? `${ten} · ${dem[k]} ${donVi}` : ten);
  if (kieu === 'chon') {
    const chu = (ten: string, k: KhungLoc) => (dem?.[k] != null ? `${ten} · ${dem[k]}${donVi ? ` ${donVi}` : ''}` : ten);
    return (
      <select className="field h-8 w-auto !py-0 text-xs max-sm:min-h-[44px] max-sm:w-full" aria-label={t('Loại lớp')} value={value}
        onChange={(e) => { const k = e.target.value as KhungLoc; nhoKhung(trang, k); onChange(k); }}>
        {coTatCa && <option value="tat-ca">{t('Loại lớp: {loai}', { loai: chu(t('Tất cả'), 'tat-ca') })}</option>}
        <option value="ft">{t('Loại lớp: {loai}', { loai: chu('Fast Track', 'ft') })}</option>
        <option value="thuong">{t('Loại lớp: {loai}', { loai: chu(t('Lớp thường'), 'thuong') })}</option>
      </select>
    );
  }
  if (kieu === 'chip') {
    const chu = (ten: string, k: KhungLoc) => (dem?.[k] != null && k !== 'tat-ca' ? `${ten} · ${dem[k]}` : ten);
    const muc: [KhungLoc, string][] = [...(coTatCa ? [['tat-ca', t('Tất cả')] as [KhungLoc, string]] : []), ['ft', 'Fast Track'], ['thuong', t('Lớp thường')]];
    return (
      <span className="inline-flex flex-wrap items-center gap-2" role="group" aria-label={t('Khung lớp')}>
        {muc.map(([k, ten]) => (
          <button key={k} type="button" aria-pressed={value === k} onClick={() => { nhoKhung(trang, k); onChange(k); }}
            className={`h-8 whitespace-nowrap rounded-full border px-3 text-[13px] font-semibold max-sm:h-11 ${value === k
              ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
              : 'border-[color:var(--line-strong)] bg-[color:var(--surface)] text-slate-300 hover:text-slate-100'}`}>
            {chu(ten, k)}
          </button>
        ))}
      </span>
    );
  }
  return (
    <BoLocDoan<KhungLoc> ariaLabel={t('Khung lớp')} value={value}
      onChange={(k) => { nhoKhung(trang, k); onChange(k); }}
      muc={[
        ...(coTatCa ? [{ key: 'tat-ca' as const, nhan: t('Tất cả'), so: donVi ? null : dem?.['tat-ca'] ?? null }] : []),
        { key: 'ft', nhan: nhan('Fast Track', 'ft'), so: donVi ? null : dem?.ft ?? null },
        { key: 'thuong', nhan: nhan(t('Lớp thường'), 'thuong'), so: donVi ? null : dem?.thuong ?? null },
      ]} />
  );
}
