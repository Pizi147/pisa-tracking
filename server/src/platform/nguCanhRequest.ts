import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * NGỮ CẢNH REQUEST (PR-TD, tốc độ trên Turso). Turso trả lời qua mạng (~20–50 ms mỗi câu) — các trang tổng quan
 * gọi hàng trăm câu lặp lại cùng một tra cứu (chi nhánh của một lớp, ngày nghiệp vụ, danh sách Case…) trong một
 * request. Kho này giữ (a) bộ nhớ tạm cho những tra cứu đó và (b) bộ đếm câu SQL.
 *
 * GET: bộ nhớ đầy đủ (`coNho()` = true — các hàm chọn đường đọc theo lô / cả bảng lớp đã nhớ). Có một lệnh `run()` (ghi) trong một request GET (ví dụ
 * `ensurePeriod`, cập nhật phiên) thì xoá sạch bộ nhớ ngay — đơn giản hơn nhiều so với theo dõi bảng nào vừa đổi,
 * và đúng: dữ liệu vừa ghi có thể ảnh hưởng bất kỳ tra cứu nào đã nhớ trước đó.
 * TD-GHI (chủ SP 18/11): request GHI mở bộ nhớ HẸP — `nho()` vẫn tắt, `coNho()` vẫn false (đường SQL giữ nguyên như trước); chỉ (a) `nhoTheoId`
 * (luôn trả bản chép) giữ tới câu ghi kế tiếp — mọi `run`, câu `RETURNING`, mọi `exec` trừ SAVEPOINT / RELEASE xoá sạch; (b) `nhoTheoBang` giữ tới
 * câu ghi vào chính bảng nguồn (lưu điểm hỏi lộ trình ×15, phân công lớp ×9…).
 *
 * KHÔNG import db.ts ở đây — db.ts import file này để gọi demCau()/xoaNho() (giống platform/hanGio.ts).
 */

type Kho = {
  /** null = không mở bộ nhớ (ngoài request: `voiXacNhan` không kho). */
  nho: Map<string, unknown> | null;
  /** TD-GHI: request ghi — `nho` chỉ phục vụ `nhoTheoId`, sống tới câu ghi kế tiếp; `nho()` tắt, `coNho()` = false (xem đầu tệp). */
  ghi?: boolean;
  /** TD-GHI: kho ngoài của `trongBoNho` mở trong request ghi — câu ghi bên trong cũng xoá nhớ của kho ngoài. */
  cha?: Kho;
  /** TD-GHI: `nhoTheoBang` của request ghi — khoá → bảng nguồn + giá trị; câu ghi nhắc tới bảng nguồn thì quên khoá đó. */
  theoBang?: Map<string, { bang: readonly string[]; giaTri: unknown }>;
  /** n = số câu SQL, dong = số dòng các câu trả về (TD2-0: `[cham]` in cả hai); top = 3 câu đọc nhiều dòng nhất (TD3-0). */
  dem: Dem;
  /** TL-NEN: mốc chung đọc kèm câu phiên (`MocHeThong`, platform/mocHeThong.ts) — không có = không có phiên. */
  moc?: unknown;
  /** TL-NEN: request này đã ghi DB (sau bước kiểm phiên) → không dùng nhớ tiến trình của bảng tham chiếu nữa. */
  coGhi?: boolean;
  /** Bộ nhớ MỘT request cho giá trị chỉ đổi qua đúng một hàm có tên (xem `nhoCaRequest`) — mở cho MỌI request, kể cả ghi; `xoaNho` KHÔNG xoá. */
  rieng?: Map<string, unknown>;
  /** RKC (chủ SP 07/11 "không chặn cứng"): các câu hỏi người dùng đã đồng ý (header `x-xac-nhan`, mã câu) — xem `canXacNhan` (util.ts). '*' = mọi câu (phép kiểm). */
  xacNhan?: ReadonlySet<string> | '*';
};

/**
 * TD3-0: `top` gộp theo câu (`sql` = 80 ký tự đầu, gộp khoảng trắng; không lưu tham số) — câu chạy nhiều lần (theo lô, theo em) cộng dồn,
 * vì câu đọc nhiều dòng thường là câu lặp. `theoCau` chỉ giữ số dòng theo câu của MỘT request.
 */
/** `ghi`: số lần `run` / `exec` (TURSO-LOG-1311: bộ thử lại mất kết nối biết request đã ghi chưa — app.ts `thuLaiKhiMatKetNoi`). */
export type Dem = { n: number; dong: number; ghi: number; top: Array<{ sql: string; dong: number }>; theoCau: Map<string, number> };
const demMoi = (): Dem => ({ n: 0, dong: 0, ghi: 0, top: [], theoCau: new Map() });

const kho = new AsyncLocalStorage<Kho>();

/** Tổng câu SQL từ lúc tiến trình khởi động — dùng cho phép kiểm ĐO (chênh lệch trước/sau một đoạn mã). */
let tongCau = 0;
/** Tổng dòng SQL trả về từ lúc tiến trình khởi động (TD2-0) — phép kiểm ĐO trừ trước/sau như `tongCau`. */
let tongDong = 0;

export function chayTrongRequest<T>(method: string, fn: () => T, xacNhan?: ReadonlySet<string>): T {
  return kho.run({ nho: new Map(), ghi: method !== 'GET', dem: demMoi(), xacNhan }, fn);
}

/**
 * RKC: header `x-xac-nhan` = các mã câu đã đồng ý (`encodeURIComponent`, nối ","). MỖI câu hỏi phải được đồng ý riêng — đồng ý câu A không cho qua
 * hậu quả B phát sinh sau (B → 409 lần nữa, web hỏi tiếp). Hỏng mã → bỏ qua (coi như chưa đồng ý).
 */
export function docXacNhan(h: unknown): ReadonlySet<string> | undefined {
  if (typeof h !== 'string' || !h) return undefined;
  const out = new Set<string>();
  for (const m of h.split(',')) { try { out.add(decodeURIComponent(m)); } catch { /* mã hỏng */ } }
  return out;
}

/** RKC: người dùng đã đồng ý câu `ma` trong request hiện tại? Ngoài request → false. */
export function daXacNhan(ma: string): boolean {
  const x = kho.getStore()?.xacNhan;
  return x === '*' || !!x?.has(ma);
}

/** RKC: chạy `fn` như mọi câu hỏi ĐÃ được đồng ý (phép kiểm gọi thẳng hàm). Giữ kho ngoài nếu có. */
export function voiXacNhan<T>(fn: () => T): T {
  const s = kho.getStore();
  return kho.run(s ? { ...s, xacNhan: '*' } : { nho: null, dem: demMoi(), xacNhan: '*' }, fn);
}

/** db.ts gọi ở mỗi `run` / `exec`: request đang chạy đã ghi DB (TL-NEN — bảng tham chiếu có thể vừa đổi, xem `nhoThamChieu`). */
export function daGhiDb(): void {
  const s = kho.getStore();
  if (s) { s.coGhi = true; s.dem.ghi++; }
}

/** TURSO-LOG-1311: câu GHI chạy qua `all()` / `get()` (`… RETURNING`) — chỉ đếm cho bộ thử lại; KHÔNG đặt `coGhi` (mocHeThong cố ý giữ nhớ bảng tham chiếu). */
export function demGhi(): void {
  const s = kho.getStore();
  if (s) s.dem.ghi++;
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
  if (!s || s.nho === null || s.ghi) return tinh();   // TD-GHI: request ghi không nhớ giá trị dùng chung (nơi gọi có thể sửa tại chỗ)
  if (s.nho.has(khoa)) return s.nho.get(khoa) as T;
  let giaTri = tinh();
  if (process.env.PISA_DONG_BANG_NHO === '1') giaTri = dongBangMotTang(giaTri);
  s.nho.set(khoa, giaTri);
  return giaTri;
}

/**
 * Nhớ MỘT request cho giá trị cấu hình ít đổi, đọc ở cả request GHI (nơi `nho` không mở): công tắc "Mở sửa lịch Test" được hỏi mỗi lần kiểm
 * khoá cuối tuần — ghi hàng loạt hỏi từng em thì tốn một câu mỗi em. CHỈ dùng cho giá trị có MỘT nơi duy nhất đổi nó, và nơi đó gọi
 * `quenNhoCaRequest(khoa)` ngay sau khi ghi (ghi từ request khác không ảnh hưởng — request đang chạy chấp nhận thấy bản lúc nó bắt đầu hỏi).
 * Ngoài request (phép kiểm gọi thẳng hàm, lệnh ops) → tính thẳng, không nhớ.
 */
export function nhoCaRequest<T>(khoa: string, tinh: () => T): T {
  const s = kho.getStore();
  if (!s) return tinh();
  const m = (s.rieng ??= new Map());
  if (m.has(khoa)) return m.get(khoa) as T;
  const v = tinh();
  m.set(khoa, v);
  return v;
}
export function quenNhoCaRequest(khoa: string): void {
  kho.getStore()?.rieng?.delete(khoa);
}

/**
 * TD-GHI (chủ SP 18/11): như `nho`, nhưng ở request GHI giá trị sống qua các câu ghi KHÔNG ghi vào bảng nguồn `bang` — lưu điểm hỏi lộ trình (`learning_cycles`)
 * ×15, phân công lớp ×9 xen giữa ~50 câu ghi vào bảng điểm / Case. Câu ghi (`run`, `RETURNING`) có bảng ĐÍCH (INSERT / REPLACE INTO, UPDATE, DELETE FROM)
 * là một bảng nguồn → quên khoá; không đọc được bảng đích, hoặc `exec` (BEGIN / COMMIT / ROLLBACK / DDL, trừ SAVEPOINT / RELEASE) → quên hết.
 * `bang` phải liệt kê ĐỦ mọi bảng `tinh` đọc. Trigger ghi sang bảng khác thì ở đây không thấy: trigger hiện có chỉ ghi `attempt_skills`, `sos_cases`,
 * `moc_he_thong` → KHÔNG dùng hàm này cho giá trị đọc từ ba bảng đó. GET / `trongBoNho` / ngoài request → đúng như `nho`.
 * Giá trị dùng chung trong request — nơi gọi KHÔNG sửa tại chỗ.
 */
export function nhoTheoBang<T>(bang: readonly string[], khoa: string, tinh: () => T): T {
  const s = kho.getStore();
  if (!s?.ghi) return nho(khoa, tinh);
  const m = (s.theoBang ??= new Map());
  const cu = m.get(khoa);
  if (cu) return cu.giaTri as T;
  let giaTri = tinh();
  if (process.env.PISA_DONG_BANG_NHO === '1') giaTri = dongBangMotTang(giaTri);
  m.set(khoa, { bang, giaTri });
  return giaTri;
}

/** Bảng đích của MỘT câu ghi (câu đầu tiên khớp — CTE của SQLite không chứa câu ghi; upsert `DO UPDATE` cùng bảng với INSERT). null = không đọc được. */
const DICH_GHI = /\b(?:INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO|UPDATE(?:\s+OR\s+\w+)?|DELETE\s+FROM)\s+(?:["`[]?\w+["`\]]?\.)?["`[]?(\w+)/i;   // `main.x` → x
export const bangDichGhi = (sql: string): string | null => DICH_GHI.exec(sql)?.[1]?.toLowerCase() ?? null;

/** db.ts gọi ở mỗi câu ghi: `sql` = câu ghi (quên khoá có bảng đích trong `bang`); null = quên hết (`exec`). Cả kho ngoài của `trongBoNho`. */
export function quenTheoBang(sql: string | null | undefined): void {
  let dich: string | null | undefined;
  for (let s = kho.getStore(); s; s = s.cha) {
    if (!s.theoBang?.size) continue;
    if (dich === undefined) dich = sql ? bangDichGhi(sql) : null;
    if (!dich) { s.theoBang.clear(); continue; }
    for (const [k, v] of s.theoBang) if (v.bang.includes(dich)) s.theoBang.delete(k);
  }
}

/** Đặt thẳng một giá trị vào bộ nhớ (dùng khi nạp trước theo lô — `napTruocPhamVi`). Không có bộ nhớ → bỏ qua. */
export function datNho<T>(khoa: string, giaTri: T): void {
  const s = kho.getStore();
  if (!s || s.nho === null || s.ghi) return;   // TD-GHI: request ghi — `nho()` không đọc, chỉ `nhoTheoId` dùng bộ nhớ (`datNhoVao`)
  datNhoVao(s.nho, khoa, giaTri);
}
function datNhoVao(m: Map<string, unknown>, khoa: string, giaTri: unknown): void {
  m.set(khoa, process.env.PISA_DONG_BANG_NHO === '1' ? dongBangMotTang(giaTri) : giaTri);
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
    for (const id of thieu) datNhoVao(s.nho, tienTo + id, moi.get(id) ?? []);
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
  return !!s && s.nho !== null && !s.ghi;
}

/** Khoá này đã có giá trị nhớ chưa? Dùng để bỏ bớt phần tử đã nạp khi nạp trước theo lô (`napTruocPhamVi`). */
export function coKhoa(khoa: string): boolean {
  const s = kho.getStore();
  return !!s && s.nho !== null && !s.ghi && s.nho.has(khoa);
}

/** Xoá sạch bộ nhớ hiện có (không đóng kho — bộ đếm câu vẫn tiếp tục cộng dồn cho request) — cả kho ngoài của `trongBoNho` (TD-GHI). */
export function xoaNho(): void {
  for (let s = kho.getStore(); s; s = s.cha) s.nho?.clear();
}

/** TD-GHI: câu ghi không qua `run` (`RETURNING` qua `all` / `get`, `exec` trừ SAVEPOINT / RELEASE) — xoá nhớ nếu đang trong request ghi. GET giữ như cũ. */
export function xoaNhoNeuRequestGhi(): void {
  for (let s = kho.getStore(); s; s = s.cha) if (s.ghi) { xoaNho(); return; }
}

/**
 * Mở một bộ nhớ TẠM cho riêng lời gọi của `fn`, dùng khi một hàm đọc nặng (`listCases`) muốn tự nhớ trong lượt gọi
 * của mình dù được gọi NGOÀI một request GET (phép kiểm gọi thẳng hàm, lệnh ops, hàm định kỳ). Đã có bộ nhớ (đang
 * trong một request GET, hoặc lồng trong một `trongBoNho` khác) → dùng lại kho đó, không mở thêm. Dùng chung `dem`
 * với kho ngoài (nếu có) để câu SQL chạy trong bộ nhớ tạm không lọt khỏi bộ đếm của request đang chạy.
 */
export function trongBoNho<T>(fn: () => T): T {
  const s = kho.getStore();
  if (s && s.nho !== null && !s.ghi) return fn();
  return kho.run({ nho: new Map(), dem: s?.dem ?? demMoi(), moc: s?.moc, coGhi: s?.coGhi, cha: s }, fn);   // TL-NEN: giữ mốc phiên — quét vẫn theo mốc
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
