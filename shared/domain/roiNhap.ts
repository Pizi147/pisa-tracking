/**
 * KHO NGUỒN NHÁP (CHAN-ROI-NHAP-2, luật không mất chữ đang gõ) — thuần, không React. Router chỉ giữ MỘT blocker (cái đăng ký sau thắng), nên cả app
 * một bộ chặn (`ChanRoiNhapGoc`) hỏi kho này: trang / panel còn nháp chưa lưu ghi một nguồn (`dat`), gỡ khi lưu xong hoặc rời.
 *   - `giu(tu, den, kieu)`: nguồn sẽ mất nếu đi tới URL `den` (nguồn mở sau hỏi trước — panel đè trên trang). `conTrong` = URL mới vẫn giữ nháp;
 *     `kieu` = 'POP' khi Back / tiến của trình duyệt (panel coi là rời dù cùng trang), 'PUSH' / 'REPLACE' khi app tự đổi URL.
 *   - `xin(viec)`: đổi tài khoản / đăng xuất / đổi góc nhìn — đổi chủ thì MỌI nháp mất (kể cả nháp ở máy), nên hỏi TRƯỚC khi gọi máy chủ.
 *     Ở lại → không làm gì (trả `false`); Bỏ nháp → làm, điều hướng của chính việc đó không bị giữ lần nữa.
 */
import type { KieuDi } from './quayLai.ts';

type Url = { pathname: string; search: string };
export type NguonNhap = {
  moTa: string;
  conTrong: (tu: Url, den: Url, kieu: KieuDi) => boolean;
  /** Panel tự hỏi bằng hộp của nó (`KhungPanel`): `di` = bỏ chữ, đi tiếp; `o` = ở lại. Không có thì bộ chặn vẽ hộp chung với `moTa`. */
  hoi?: (di: () => void, o: () => void) => void;
};

export function taoKhoRoiNhap() {
  const nguon = new Map<string, NguonNhap>();
  const nghe = new Set<() => void>();
  let phien = 0;
  let qua = false;
  let cho: { nguon: NguonNhap; tra: (di: boolean) => void } | null = null;
  const bao = () => { phien++; nghe.forEach((f) => f()); };
  const sauCung = () => [...nguon.values()].pop() ?? null;
  return {
    dat(id: string, n: NguonNhap | null) { if (n) nguon.set(id, n); else nguon.delete(id); bao(); },
    giu(tu: Url, den: Url, kieu: KieuDi = 'PUSH'): NguonNhap | null { return qua ? null : [...nguon.values()].reverse().find((n) => !n.conTrong(tu, den, kieu)) ?? null; },
    async xin(viec: () => Promise<unknown>): Promise<boolean> {
      const n = sauCung();
      if (n && !(await new Promise<boolean>((tra) => { cho = { nguon: n, tra }; bao(); }))) return false;
      qua = true;
      try { await viec(); } finally { qua = false; }
      return true;
    },
    dangXin: (): NguonNhap | null => cho?.nguon ?? null,
    tra(di: boolean) { const c = cho; cho = null; bao(); c?.tra(di); },
    nghe(f: () => void) { nghe.add(f); return () => { nghe.delete(f); }; },
    phien: () => phien,
  };
}

const q = (u: Url) => new URLSearchParams(u.search);
/** Trang con Cuối khoá lớp thường (`?xem=cuoi-khoa`): bỏ / thêm `?em=` vẫn ở trong; đổi trang hay về hồ sơ lớp là rời. */
export function conTrongCuoiKhoa(tu: Url, den: Url): boolean {
  return tu.pathname === den.pathname && q(den).get('xem') === 'cuoi-khoa';
}
/** Lịch Test: tuần, chi nhánh, phạm vi, lớp quyết định dữ liệu lưới (đổi = lưới tải lại, ô lưu hỏng mất); mở hàng (`kn`, `loai`) thì không. */
export function conTrongLichTest(tu: Url, den: Url): boolean {
  const a = q(tu), b = q(den);
  return tu.pathname === den.pathname && ['periodId', 'cn', 'branchId', 'phamVi', 'classId'].every((k) => a.get(k) === b.get(k));
}
