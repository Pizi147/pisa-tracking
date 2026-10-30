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
  /** n = số câu SQL, dong = số dòng các câu trả về (TD2-0: `[cham]` in cả hai); top = 3 câu đọc nhiều dòng nhất (TD3-0). */
  dem: Dem;
  /** TL-NEN: mốc chung đọc kèm câu phiên (`MocHeThong`, platform/mocHeThong.ts) — không có = không có phiên. */
  moc?: unknown;
  /** TL-NEN: request này đã ghi DB (sau bước kiểm phiên) → không dùng nhớ tiến trình của bảng tham chiếu nữa. */
  coGhi?: boolean;
};

/**
 * TD3-0: `top` gộp theo câu (`sql` = 80 ký tự đầu, gộp khoảng trắng; không lưu tham số) — câu chạy nhiều lần (theo lô, theo em) cộng dồn,
 * vì câu đọc nhiều dòng thường là câu lặp. `theoCau` chỉ giữ số dòng theo câu của MỘT request.
 */
export type Dem = { n: number; dong: number; top: Array<{ sql: string; dong: number }>; theoCau: Map<string, number> };
const demMoi = (): Dem => ({ n: 0, dong: 0, top: [], theoCau: new Map() });

const kho = new AsyncLocalStorage<Kho>();

/** Tổng câu SQL từ lúc tiến trình khởi động — dùng cho phép kiểm ĐO (chênh lệch trước/sau một đoạn mã). */
let tongCau = 0;
/** Tổng dòng SQL trả về từ lúc tiến trình khởi động (TD2-0) — phép kiểm ĐO trừ trước/sau như `tongCau`. */
let tongDong = 0;

export function chayTrongRequest<T>(method: string, fn: () => T): T {
  return kho.run({ nho: method === 'GET' ? new Map() : null, dem: demMoi() }, fn);
}

/** db.ts gọi ở mỗi `run` / `exec`: request đang chạy đã ghi DB (TL-NEN — bảng tham chiếu có thể vừa đổi, xem `nhoThamChieu`). */
export function daGhiDb(): void {
  const s = kho.getStore();
  if (s) s.coGhi = true;
}

/** Đặt mốc chung của request (`resolveSession`, SAU ghi mốc dùng phiên — ghi đó không chạm bảng tham chiếu). Không có kho → bỏ qua. */
export function datMoc(m: unknown): void {
  const s = kho.getStore();
  if (!s) return;
  s.moc = m;
  s.coGhi = false;
}

/** Mốc chung của request hiện tại (undefined = ngoài request hoặc không có phiên). */
export function layMoc(): unknown {
  return kho.getStore()?.moc;
}

/** Request hiện tại đã ghi DB từ lúc đặt mốc chưa? */
export function coGhiTrongRequest(): boolean {
  return !!kho.getStore()?.coGhi;
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

/**
 * TD2-a: đọc NHIỀU id theo lô nhưng nhớ THEO TỪNG ID (`${tienTo}${id}`) — các màn danh sách gọi lại cùng tập lượt 2–3 lần mỗi request
 * (`loadSkillRows`, câu điểm của `loadBundle`). Chỉ hỏi `doc` với id chưa nhớ; id không có dòng nhớ `[]`. Không có bộ nhớ → gọi thẳng
 * `doc(ids)` như cũ. Có bộ nhớ → Map MỚI (chỉ id có dòng, theo thứ tự `ids`), mảng và từng dòng chép nông: nơi gọi sửa tại chỗ không
 * làm hỏng bộ nhớ dùng chung.
 */
export function nhoTheoId<T extends object>(tienTo: string, ids: number[], doc: (thieu: number[]) => Map<number, T[]>): Map<number, T[]> {
  const s = kho.getStore();
  if (!s || s.nho === null) return doc(ids);
  const thieu = [...new Set(ids)].filter((id) => !s.nho!.has(tienTo + id));
  if (thieu.length) {
    const moi = doc(thieu);
    for (const id of thieu) datNho(tienTo + id, moi.get(id) ?? []);
  }
  const out = new Map<number, T[]>();
  for (const id of ids) {
    const rows = s.nho.get(tienTo + id) as T[];
    if (rows.length && !out.has(id)) out.set(id, rows.map((r) => ({ ...r })));
  }
  return out;
}

/** Đang có bộ nhớ mở không (request GET, hoặc bên trong `trongBoNho`)? */
export function coNho(): boolean {
  const s = kho.getStore();
  return !!s && s.nho !== null;
}

/** Khoá này đã có giá trị nhớ chưa? Dùng để bỏ bớt phần tử đã nạp khi nạp trước theo lô (`napTruocPhamVi`). */
export function coKhoa(khoa: string): boolean {
  const s = kho.getStore();
  return !!s && s.nho !== null && s.nho.has(khoa);
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
  return kho.run({ nho: new Map(), dem: s?.dem ?? demMoi(), moc: s?.moc, coGhi: s?.coGhi }, fn);   // TL-NEN: giữ mốc phiên — quét vẫn theo mốc
}

/** Gọi mỗi lần chạy một câu SQL thật (`get`/`run`/`iterate` — KHÔNG gọi cho `all`, xem chú thích ở db.ts). */
export function demCau(): void {
  const s = kho.getStore();
  if (s) s.dem.n++;
  tongCau++;
}

/** Gọi với số dòng một câu SQL trả về (`all` → length, `get` → 0/1; chỉ cộng, không JSON hoá — TD2-0) và câu đó (TD3-0, top 3). */
export function demDong(k: number, sql: string): void {
  tongDong += k;
  const s = kho.getStore();
  if (!s) return;
  const d = s.dem;
  d.dong += k;
  if (!k) return;
  const cau = sql.replace(/\s+/g, ' ').trim().slice(0, 80);
  const tong = (d.theoCau.get(cau) ?? 0) + k;
  d.theoCau.set(cau, tong);
  const cu = d.top.find((c) => c.sql === cau);
  if (cu) cu.dong = tong;
  else if (d.top.length < 3 || tong > d.top[2].dong) d.top.splice(2, 1, { sql: cau, dong: tong });
  d.top.sort((a, b) => b.dong - a.dong);
}

/** `top` dạng một dòng cho log `[cham]`/`[sql]`: ` · top: <dòng> <sql> | …` (rỗng nếu không có). */
export function topLog(dem: Dem | undefined): string {
  return dem?.top.length ? ` · top: ${dem.top.map((c) => `${c.dong} ${c.sql}`).join(' | ')}` : '';
}

/** Tổng dòng SQL trả về từ lúc tiến trình khởi động — phép kiểm ĐO tự trừ trước/sau. */
export function soDongSql(): number {
  return tongDong;
}

/** Tổng câu SQL từ lúc tiến trình khởi động (không riêng một request) — phép kiểm ĐO tự trừ trước/sau. */
export function soCauSql(): number {
  return tongCau;
}

/** Bộ đếm của request đang chạy (tham chiếu sống — đọc `.n` sau khi request xong), hoặc null nếu không trong request. */
export function demHienTai(): Dem | null {
  return kho.getStore()?.dem ?? null;
}
