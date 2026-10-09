import { BoLocDoan } from './ui.tsx';

/**
 * CÔNG TẮC HAI KHUNG (MH4, K4-05, Q3, Q8) — `Fast Track · Lớp thường` (Test) hoặc `Tất cả · Fast Track · Lớp thường` (Công việc).
 * Một khung một bộ môn: không trộn môn hai khung (MH5). Nhớ theo máy VÀ theo người (localStorage, khoá `.u{userId}` — PR-S6F-b Q7: máy chung,
 * demo đổi vai; bọc try/catch — trang vẫn chạy khi không đọc được); tham số `loai` trên đường dẫn thắng (nơi gọi đọc URL trước `khungDaNho`).
 * Chỉ một khung có dữ liệu → không vẽ gì.
 */
export type KhungLoc = 'ft' | 'thuong' | 'tat-ca';
type Trang = 'lich-test' | 'ke-hoach-test' | 'diem-theo-lop' | 'cong-viec' | 'hoc-vien-lop' | 'tong-quan' | 'phan-tich-gv';

/** Người đang đăng nhập — `SessionProvider` đặt mỗi khi phiên đổi; một chỗ cho mọi trang dùng công tắc. */
let nguoiDung: number | null = null;
export const datNguoiDungKhung = (id: number | null) => { nguoiDung = id; };
const khoa = (trang: Trang) => `pisa.khung.${trang}${nguoiDung ? `.u${nguoiDung}` : ''}`;
const hopLe = (v: unknown): v is KhungLoc => v === 'ft' || v === 'thuong' || v === 'tat-ca';

export function khungDaNho(trang: Trang): KhungLoc | null {
  try {
    const v = localStorage.getItem(khoa(trang));
    return hopLe(v) ? v : null;
  } catch { return null; }
}
function nhoKhung(trang: Trang, k: KhungLoc) {
  try { localStorage.setItem(khoa(trang), k); } catch { /* không lưu được thì thôi — lần sau về mặc định */ }
}

export function CongTacKhung({ trang, value, onChange, dem, donVi = '', coTatCa = false, kieu = 'doan' }: {
  trang: Trang; value: KhungLoc; onChange: (k: KhungLoc) => void;
  /** Số hiện cạnh tên khung (lớp, việc…); khung có số 0 coi như không có dữ liệu. */
  dem?: Partial<Record<KhungLoc, number>>;
  /** Chữ sau số: `Fast Track · 3 lớp`. Trống = chỉ số. */
  donVi?: string;
  coTatCa?: boolean;
  /** `chon` = ô chọn "Loại lớp: …" (Học viên & Lớp, K1 — không có hai chữ "Tất cả" cạnh nhau); mặc định phân đoạn như các trang Test. */
  kieu?: 'doan' | 'chon';
}) {
  const coDuLieu = (['ft', 'thuong'] as const).filter((k) => (dem?.[k] ?? 1) > 0);
  if (coDuLieu.length < 2) return null;
  const nhan = (ten: string, k: KhungLoc) => (dem?.[k] != null && donVi ? `${ten} · ${dem[k]} ${donVi}` : ten);
  if (kieu === 'chon') {
    const chu = (ten: string, k: KhungLoc) => (dem?.[k] != null ? `${ten} · ${dem[k]}${donVi ? ` ${donVi}` : ''}` : ten);
    return (
      <select className="field h-8 w-auto !py-0 text-xs max-sm:min-h-[44px] max-sm:w-full" aria-label="Loại lớp" value={value}
        onChange={(e) => { const k = e.target.value as KhungLoc; nhoKhung(trang, k); onChange(k); }}>
        {coTatCa && <option value="tat-ca">Loại lớp: {chu('Tất cả', 'tat-ca')}</option>}
        <option value="ft">Loại lớp: {chu('Fast Track', 'ft')}</option>
        <option value="thuong">Loại lớp: {chu('Lớp thường', 'thuong')}</option>
      </select>
    );
  }
  return (
    <BoLocDoan<KhungLoc> ariaLabel="Khung lớp" value={value}
      onChange={(k) => { nhoKhung(trang, k); onChange(k); }}
      muc={[
        ...(coTatCa ? [{ key: 'tat-ca' as const, nhan: 'Tất cả', so: donVi ? null : dem?.['tat-ca'] ?? null }] : []),
        { key: 'ft', nhan: nhan('Fast Track', 'ft'), so: donVi ? null : dem?.ft ?? null },
        { key: 'thuong', nhan: nhan('Lớp thường', 'thuong'), so: donVi ? null : dem?.thuong ?? null },
      ]} />
  );
}
