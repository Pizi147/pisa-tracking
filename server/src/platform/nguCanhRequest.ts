import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * NGỮ CẢNH REQUEST (PR-TD, tốc độ trên Turso). Turso trả lời qua mạng (~20–50 ms mỗi câu) — các trang tổng quan
 * gọi hàng trăm câu lặp lại cùng một tra cứu (chi nhánh của một lớp, ngày nghiệp vụ, danh sách Case…) trong một
 * request. Kho này giữ (a) bộ nhớ tạm cho những tra cứu đó và (b) bộ đếm câu SQL.
 *
 * CHỈ bật bộ nhớ cho GET: các trang đọc là nơi bị lặp; request ghi ít và không phải chỗ chậm, thêm bộ nhớ cho ghi chỉ
 * thêm rủi ro đọc phải giá trị cũ ngay sau khi vừa ghi. Có một lệnh `run()` (ghi) trong một request GET (ví dụ
 * `ensurePeriod`, cập nhật phiên) thì xoá sạch bộ nhớ ngay — đơn giản hơn nhiều so với theo dõi bảng nào vừa đổi,
 * và đúng: dữ liệu vừa ghi có thể ảnh hưởng bất kỳ tra cứu nào đã nhớ trước đó.
 *
 * KHÔNG import db.ts ở đây — db.ts import file này để gọi demCau()/xoaNho() (giống platform/hanGio.ts).
 */

type Kho = {
  /** null = không mở bộ nhớ cho request này (không phải GET). */
  nho: Map<string, unknown> | null;
  dem: { n: number };
};

const kho = new AsyncLocalStorage<Kho>();

/** Tổng câu SQL từ lúc tiến trình khởi động — dùng cho phép kiểm ĐO (chênh lệch trước/sau một đoạn mã). */
let tongCau = 0;

export function chayTrongRequest<T>(method: string, fn: () => T): T {
  return kho.run({ nho: method === 'GET' ? new Map() : null, dem: { n: 0 } }, fn);
}

/**
 * Đóng băng một tầng trước khi nhớ (chỉ khi `PISA_DONG_BANG_NHO=1`, dùng trong phép kiểm ĐO): lộ ngay chỗ nơi gọi lỡ
 * sửa giá trị dùng chung (`push`, gán thuộc tính, `sort` tại chỗ…) — sửa sẽ ném lỗi thay vì âm thầm làm hỏng request
 * khác dùng chung bộ nhớ. Chỉ một tầng: mảng → freeze mảng + freeze từng phần tử là object thường; object thường →
 * freeze chính nó. `Map`/`Set` làm giá trị nhớ: `Object.freeze` không ném lỗi nhưng KHÔNG chặn được `.set()/.add()` —
 * đây là giới hạn đã biết, không có cách nào đóng băng nội dung một Map bằng JS thuần.
 */
function dongBangMotTang<T>(giaTri: T): T {
  if (Array.isArray(giaTri)) {
    for (const phanTu of giaTri) {
      if (phanTu && typeof phanTu === 'object') Object.freeze(phanTu);
    }
    Object.freeze(giaTri);
  } else if (giaTri && typeof giaTri === 'object') {
    Object.freeze(giaTri);
  }
  return giaTri;
}

/** Đọc qua bộ nhớ: có kho và đang mở bộ nhớ (GET) → tính một lần rồi nhớ; ngoài ra → tính thẳng, không nhớ. */
export function nho<T>(khoa: string, tinh: () => T): T {
  const s = kho.getStore();
  if (!s || s.nho === null) return tinh();
  if (s.nho.has(khoa)) return s.nho.get(khoa) as T;
  let giaTri = tinh();
  if (process.env.PISA_DONG_BANG_NHO === '1') giaTri = dongBangMotTang(giaTri);
  s.nho.set(khoa, giaTri);
  return giaTri;
}

/** Đặt thẳng một giá trị vào bộ nhớ (dùng khi nạp trước theo lô — `napTruocPhamVi`). Không có bộ nhớ → bỏ qua. */
export function datNho<T>(khoa: string, giaTri: T): void {
  const s = kho.getStore();
  if (!s || s.nho === null) return;
  s.nho.set(khoa, process.env.PISA_DONG_BANG_NHO === '1' ? dongBangMotTang(giaTri) : giaTri);
}

/** Đang có bộ nhớ mở không (request GET, hoặc bên trong `trongBoNho`)? */
export function coNho(): boolean {
  const s = kho.getStore();
  return !!s && s.nho !== null;
}

/** Xoá sạch bộ nhớ hiện có (không đóng kho — bộ đếm câu vẫn tiếp tục cộng dồn cho request). */
export function xoaNho(): void {
  const s = kho.getStore();
  s?.nho?.clear();
}

/**
 * Mở một bộ nhớ TẠM cho riêng lời gọi của `fn`, dùng khi một hàm đọc nặng (`listCases`) muốn tự nhớ trong lượt gọi
 * của mình dù được gọi NGOÀI một request GET (phép kiểm gọi thẳng hàm, lệnh ops, hàm định kỳ). Đã có bộ nhớ (đang
 * trong một request GET, hoặc lồng trong một `trongBoNho` khác) → dùng lại kho đó, không mở thêm. Dùng chung `dem`
 * với kho ngoài (nếu có) để câu SQL chạy trong bộ nhớ tạm không lọt khỏi bộ đếm của request đang chạy.
 */
export function trongBoNho<T>(fn: () => T): T {
  const s = kho.getStore();
  if (s && s.nho !== null) return fn();
  return kho.run({ nho: new Map(), dem: s?.dem ?? { n: 0 } }, fn);
}

/** Gọi mỗi lần chạy một câu SQL thật (`get`/`run`/`iterate` — KHÔNG gọi cho `all`, xem chú thích ở db.ts). */
export function demCau(): void {
  const s = kho.getStore();
  if (s) s.dem.n++;
  tongCau++;
}

/** Tổng câu SQL từ lúc tiến trình khởi động (không riêng một request) — phép kiểm ĐO tự trừ trước/sau. */
export function soCauSql(): number {
  return tongCau;
}

/** Bộ đếm của request đang chạy (tham chiếu sống — đọc `.n` sau khi request xong), hoặc null nếu không trong request. */
export function demHienTai(): { n: number } | null {
  return kho.getStore()?.dem ?? null;
}
