import Database from 'libsql';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cauHinhDb, choPhepSeedTurso, coCoBanChinh } from './moiTruong.ts';
import { chanGiaoDichNeuSapHetGio, conLaiMs, KHONG_MO_GIAO_DICH_KHI_CON_MS } from './platform/hanGio.ts';
import { demCau, xoaNho } from './platform/nguCanhRequest.ts';
import { HttpError } from './util.ts';

/*
 * libsql gắn thêm `_metadata: { duration }` vào MỖI dòng `.get()` trả về (better-sqlite3 thì không). Khoá này lọt
 * ra JSON của API và làm hỏng mọi phép so dòng. Vá một lần ở đây thay vì sửa 686 chỗ gọi.
 */
{
  const tam = new Database(':memory:');
  const proto = Object.getPrototypeOf(tam.prepare('SELECT 1')) as Record<'get' | 'all' | 'run' | 'iterate', (...a: unknown[]) => unknown>;
  tam.close();
  /*
   * Cùng chỗ vá: libsql hiểu ĐÚNG MỘT tham số `null` (`.get(null)`) là "đối tượng tham số có tên" và ném
   * "failed to downcast any to object"; better-sqlite3 thì gắn NULL. Mã có hàng trăm chỗ gọi một tham số, chỗ nào giá trị
   * lỡ là null sẽ thành lỗi 500 — đưa về đúng hành vi cũ bằng cách bọc thành mảng tham số `[null]`.
   */
  /*
   * PR-XOA-b: THAM SỐ ĐẶT TÊN BỊ CẤM. libsql nối Turso qua mạng lặng lẽ BỎ QUA `{ s: 1 }` cho `@s`/`:s`/`$s` — câu chạy như tham số
   * NULL (đo trên DB thử 24/09: "Xoá học viên" luôn "Không tìm thấy"). File cục bộ thì nhận, nên phép kiểm không bao giờ thấy.
   * Ném ngay ở mọi nơi để lỗi lộ ra từ máy dev; dùng `?` hoặc `?1`, `?2` (lặp lại được trong cùng câu).
   */
  const motNull = (args: unknown[]) => {
    if (args.length === 1 && args[0] !== null && typeof args[0] === 'object' && Object.getPrototypeOf(args[0]) === Object.prototype) {
      throw new Error('Không dùng tham số đặt tên ({ … } cho @x/:x/$x) — Turso bỏ qua chúng. Dùng ? hoặc ?1, ?2.');
    }
    return args.length === 1 && args[0] === null ? [[null]] : args;
  };
  /*
   * PR-TD: đếm câu SQL cho `run`/`iterate` (đọc thân bài ở nguCanhRequest.ts) — KHÔNG đếm `all`: trong libsql,
   * `all()` tự gọi lại `iterate()` (node_modules/libsql/index.js:400-403), đếm cả hai là đếm đôi cùng một câu.
   * `run` xoá bộ nhớ TRƯỚC khi chạy: mọi lệnh ghi trong một request GET phải làm mất bộ nhớ đã tích luỹ, vì dữ
   * liệu vừa đổi có thể ảnh hưởng bất kỳ tra cứu nào đã nhớ trước đó.
   */
  for (const ten of ['all', 'run', 'iterate'] as const) {
    const goc = proto[ten];
    if (ten === 'all') {
      proto[ten] = function (this: unknown, ...args: unknown[]) { return goc.apply(this, motNull(args)); };
      continue;
    }
    proto[ten] = function (this: unknown, ...args: unknown[]) {
      if (ten === 'run') xoaNho();
      /* Z2c-d: ghi lẻ NGOÀI giao dịch (mốc dùng phiên, lần thử đăng nhập…) gặp khoá của người khác thì chờ như tx(). */
      const out = ten === 'run' && !instance?.inTransaction
        ? choKhoaGhi(() => goc.apply(this, motNull(args)))
        : goc.apply(this, motNull(args));
      demCau();
      return out;
    };
  }
  const getGoc = proto.get;
  proto.get = function (this: unknown, ...args: unknown[]) {
    const row = getGoc.apply(this, motNull(args));
    demCau();
    if (row && typeof row === 'object' && '_metadata' in row) delete (row as Record<string, unknown>)._metadata;
    return row;
  };
}
/*
 * CẢNH BÁO cho mọi mã sau này — với libsql:
 *   - KHÔNG truyền MỘT `Buffer` làm tham số duy nhất (`.run(buf)`): tiến trình Node chết hẳn (Rust panic). Luôn bọc:
 *     `.run(buf, x)` hoặc tham số có tên.
 *   - `pluck().get()` và `pragma(x, { simple: true })` trả đối tượng thay vì giá trị — hiện mã không dùng, đừng bắt đầu dùng.
 */

/*
 * Thư mục chứa file mã này. Trên Netlify, hàm được gói thành CommonJS nên `import.meta.url` RỖNG (đã tái hiện
 * 22/09: sập ngay lúc nạp). Khi đó rơi về thư mục đang chạy — trên Netlify đường API không đọc file nào theo ROOT.
 * KHÔNG đặt tên biến là `__dirname`: bản gói ESM của Netlify tự khai báo tên đó.
 */
const THU_MUC_MA = import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd();

/**
 * Tìm thư mục gốc dự án bằng cách đi ngược lên tới nơi có package.json.
 * Không neo theo đường dẫn tương đối cố định vì mã có thể chạy từ server/src (lúc phát
 * triển) hoặc từ dist-server (sau khi biên dịch); cũng không neo theo thư mục đang đứng
 * vì người dùng có thể gõ lệnh từ chỗ khác.
 */
function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export const ROOT = findProjectRoot(THU_MUC_MA);
const CAU_HINH = cauHinhDb(process.env, path.join(ROOT, 'data', 'pisa-demo.sqlite'));
/**
 * Đường dẫn file khi chạy cục bộ; khi chạy Turso là URL (chỉ để in log, KHÔNG in token). Bỏ phần `?…`/`#…`: "chuỗi kết
 * nối" Turso có thể kèm `?authToken=…` — mọi lệnh đều in DB_PATH. Kết nối vẫn dùng URL gốc (`CAU_HINH.url`).
 */
export const DB_PATH = CAU_HINH.kieu === 'file' ? CAU_HINH.duongDan : CAU_HINH.url.split(/[?#]/)[0];
export const SCHEMA_PATH = path.join(ROOT, 'server', 'src', 'schema.sql');
export function laDbTuXa(): boolean { return CAU_HINH.kieu === 'turso'; }

let instance: Database.Database | null = null;

export function db(): Database.Database {
  if (!instance) {
    if (CAU_HINH.kieu === 'turso') {
      /* Kiểu của libsql thiếu `authToken` (TS2353) dù thư viện có đọc nó lúc chạy — ép kiểu, đã thử 22/09. */
      instance = new Database(CAU_HINH.url, { authToken: CAU_HINH.authToken } as Database.Options);
    } else {
      fs.mkdirSync(path.dirname(CAU_HINH.duongDan), { recursive: true });
      instance = new Database(CAU_HINH.duongDan);
      instance.pragma('journal_mode = WAL');   // WAL chỉ có nghĩa với file cục bộ
    }
    instance.pragma('foreign_keys = ON');
  }
  return instance;
}

export function closeDb() {
  if (instance) {
    try { instance.close(); } catch { /* đã đóng */ }
    instance = null;
  }
}

/*
 * MẤT LUỒNG TURSO (PR-Z2c-b). Kết nối Turso giữ ở cấp module; phía Turso có lúc đã đóng "luồng" (stream) mà kết nối đang
 * dùng — câu kế tiếp hỏng với `Hrana(Api("status=404 … stream not found: …"))` (bản nháp 23/09, log `mã 17476fd8`, 1/~900
 * lời gọi). Kết nối đó coi như chết: bỏ nó, lần gọi db() sau mở kết nối mới. Chỉ request GET được chạy lại (app.ts).
 */
export function laLoiMatLuongTurso(e: unknown): boolean {
  return e instanceof Error && /stream not found/i.test(e.message);
}

/** Lỗi ném ra từ bên trong tx() — kể cả savepoint lồng. Bộ thử lại bỏ qua các lỗi này: giao dịch có thể đã ghi dở. */
const loiTuGiaoDich = new WeakSet<object>();
export function loiTrongGiaoDich(e: unknown): boolean {
  return typeof e === 'object' && e !== null && loiTuGiaoDich.has(e);
}

/**
 * Bỏ kết nối hiện tại để lần gọi db() sau mở kết nối MỚI. KHÔNG đóng kết nối cũ: mã đang chạy có thể còn giữ tham chiếu tới nó
 * (một biến `conn`); kết nối Turso đã chết thì đóng cũng không được gì, bộ dọn rác của Node tự giải phóng.
 */
export function moLaiKetNoi(): void {
  instance = null;
  savepointDepth = 0;
}

/** CHỈ phép kiểm: đặt lại đúng kết nối harness đang giữ, sau khi một phép kiểm làm máy chủ mở kết nối mới (PR-Z2c-b). */
export function datKetNoiChoPhepKiem(c: Database.Database): void {
  instance = c;
}

export function isInitialised(): boolean {
  if (!laDbTuXa() && !fs.existsSync(DB_PATH)) return false;
  const row = db()
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='students'")
    .get();
  return !!row;
}

/**
 * Xoá và tạo lại toàn bộ schema NGAY TRONG file hiện tại.
 *
 * Cố tình không xoá file: nếu người dùng chạy `npm run seed` trong lúc `npm run dev`
 * đang chạy, tiến trình API vẫn giữ kết nối tới file cũ và sẽ phục vụ dữ liệu cũ.
 * Dựng lại tại chỗ giúp API thấy ngay dữ liệu mới mà không cần khởi động lại.
 */
/**
 * CHỐT CHẶN XOÁ SẠCH DATABASE Ở TURSO — nằm ngay trong hàm xoá, nên che MỌI nơi gọi (lệnh seed, bộ phép kiểm, mã sau này).
 * Ngoại lệ duy nhất là database THỬ: `PISA_CHO_PHEP_SEED_TURSO` phải bằng ĐÚNG TÊN MÁY CHỦ trong URL (không phải một
 * đoạn chữ — `turso.io` hay một ký tự sẽ khớp mọi database), không bao giờ khi `BAN_CHINH=1`, và không bao giờ với tên
 * máy chủ kiểu bản chính (luật ở `choPhepSeedTurso`).
 */
export function tuChoiXoaSachNeuTuXa(): void {
  if (CAU_HINH.kieu !== 'turso') return;
  /* Cờ TƯỜNG MINH, không phải laBanChinh(): có Turso thì laBanChinh() luôn đúng — dùng nó ở đây là khoá luôn database thử. */
  if (!coCoBanChinh() && choPhepSeedTurso(CAU_HINH.url, process.env.PISA_CHO_PHEP_SEED_TURSO)) return;
  throw new Error('TỪ CHỐI: đang trỏ tới Turso. Lệnh này XOÁ SẠCH database và chỉ dùng cho máy dev.\n'
    + 'Muốn seed database THỬ: đặt PISA_CHO_PHEP_SEED_TURSO bằng NGUYÊN tên máy chủ, ví dụ pisatracking-demo-xxx.turso.io');
}

export function recreateSchema() {
  tuChoiXoaSachNeuTuXa();
  const conn = db();
  conn.pragma('foreign_keys = OFF');
  const tables = conn
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  const indexes = conn
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  conn.transaction(() => {
    for (const i of indexes) conn.exec(`DROP INDEX IF EXISTS "${i.name}"`);
    for (const t of tables) conn.exec(`DROP TABLE IF EXISTS "${t.name}"`);
  })();
  conn.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  conn.pragma('foreign_keys = ON');
}

/*
 * GHI ĐỒNG THỜI (PR-Z2c-d). Bản chính 24/09 (log `mã 77e7df8f`): gõ điểm L rồi Tab sang R → hai lần lưu gần như cùng lúc trên
 * hai bản hàm Netlify. Giao dịch mở bằng BEGIN thường chỉ xin khoá ghi ở câu GHI đầu tiên; lúc đó bên kia đang giữ khoá và
 * SQLite trả SQLITE_BUSY NGAY (không chờ được khi nâng từ đọc lên ghi) → giáo viên mất điểm vừa gõ.
 * Nay giao dịch ngoài mở bằng BEGIN IMMEDIATE: xin khoá ghi TRƯỚC mọi câu. Turso tự chờ khoá ở câu này (đo trên DB thử 24/09);
 * file cục bộ thì không chờ (libsql không đặt busy_timeout) — nên vẫn tự thử lại ở đây, nghỉ ngắn dần dài, tối đa
 * CHO_KHOA_GHI_MS và không quá hạn của lời gọi (AN-5). Thử lại an toàn: câu bị BUSY chưa ghi gì, fn chưa chạy.
 */
export const CHO_KHOA_GHI_MS = 5_000;
/**
 * Z2c-e: trên Turso chính câu BEGIN IMMEDIATE có thể nằm chờ khoá phía sqld. Có khoá rồi mà lời gọi còn ít hơn chừng này thì
 * không chạy fn (bị Netlify cắt giữa giao dịch là giữ khoá tới khi Turso tự huỷ) — cuộn lại, trả "đang bận".
 */
export const CON_TOI_THIEU_SAU_KHOA_MS = 1_500;

export function laLoiBan(e: unknown): boolean {
  const x = e as { code?: unknown; message?: unknown } | null;
  return !!x && (x.code === 'SQLITE_BUSY' || /SQLITE_BUSY|database is locked/i.test(String(x.message ?? '')));
}

const O_NGU = new Int32Array(new SharedArrayBuffer(4));
/** Nghỉ đồng bộ — libsql chạy đồng bộ nên cả lời gọi vốn đã chặn; một bản hàm Netlify chỉ phục vụ một lời gọi mỗi lúc. */
function ngu(ms: number): void { Atomics.wait(O_NGU, 0, 0, ms); }

function choKhoaGhi<T>(lam: () => T): T {
  const batDau = Date.now();
  for (let lan = 0; ; lan++) {
    try {
      const out = lam();
      if (lan > 0) console.warn(`[turso] chờ khoá ghi ${Date.now() - batDau} ms (${lan} lần bận) rồi ghi được`);
      return out;
    } catch (e) {
      if (!laLoiBan(e)) throw e;
      const daCho = Date.now() - batDau;
      const nghi = Math.min(50 * 2 ** lan, 400);
      const con = conLaiMs();
      if (daCho + nghi > CHO_KHOA_GHI_MS || (con !== null && con - nghi < KHONG_MO_GIAO_DICH_KHI_CON_MS)) {
        console.warn(`[turso] database bận quá ${daCho} ms (${lan + 1} lần) — trả "máy chủ đang bận", chưa ghi gì`);
        throw new HttpError(503, 'Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.');
      }
      ngu(nghi);
    }
  }
}

/*
 * GIAO DỊCH LỒNG. `better-sqlite3` tự biến giao dịch lồng thành SAVEPOINT; `libsql` thì báo lỗi
 * "cannot start a transaction within a transaction". Làm lại đúng hành vi cũ: vòng ngoài là giao dịch
 * thật, vòng trong là savepoint — lỗi ở vòng trong chỉ cuộn lại phần của nó rồi ném tiếp lên.
 */
let savepointDepth = 0;
/** Chạy fn trong một transaction; mọi mutation nhiều bảng phải đi qua đây. */
export function tx<T>(fn: () => T): T {
  const conn = db();
  if (!conn.inTransaction) {
    /* AN-5: giao dịch NGOÀI chỉ mở khi lời gọi còn đủ giờ; savepoint bên trong một giao dịch đã mở thì không hỏi lại. */
    chanGiaoDichNeuSapHetGio();
    choKhoaGhi(() => conn.exec('BEGIN IMMEDIATE'));   // Z2c-d: xin khoá ghi trước mọi câu (xem trên)
    const con = conLaiMs();
    if (con !== null && con < CON_TOI_THIEU_SAU_KHOA_MS) {
      try { conn.exec('ROLLBACK'); } catch { /* không có gì để giữ */ }
      console.warn(`[turso] có khoá ghi nhưng lời gọi chỉ còn ${con} ms — cuộn lại, chưa ghi gì`);
      throw new HttpError(503, 'Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.');
    }
    try {
      const out = fn();
      conn.exec('COMMIT');
      return out;
    } catch (e) {
      /* Cuộn lại hỏng (mạng Turso đứt…) thì vẫn ném LỖI GỐC. */
      try { if (conn.inTransaction) conn.exec('ROLLBACK'); } catch { /* giữ lỗi gốc */ }
      xoaNho();   // PR-Dọn (Q7, quét #27): giá trị đã nhớ trong giao dịch có thể là dữ liệu vừa bị cuộn lại
      if (typeof e === 'object' && e !== null) loiTuGiaoDich.add(e);   // PR-Z2c-b: không thử lại
      throw e;
    }
  }
  const name = `sp_${++savepointDepth}`;
  conn.exec(`SAVEPOINT ${name}`);
  try {
    const out = fn();
    conn.exec(`RELEASE ${name}`);
    return out;
  } catch (e) {
    /* Cuộn lại hỏng (mạng Turso đứt, savepoint đã mất…) thì vẫn ném LỖI GỐC — vòng ngoài sẽ cuộn lại cả giao dịch. */
    try { conn.exec(`ROLLBACK TO ${name}`); conn.exec(`RELEASE ${name}`); } catch { /* giữ lỗi gốc */ }
    xoaNho();   // PR-Dọn (Q7, quét #27)
    if (typeof e === 'object' && e !== null) loiTuGiaoDich.add(e);
    throw e;
  } finally {
    savepointDepth--;
  }
}

/**
 * PR-TOC: GHI/ĐỌC THEO LÔ. Trên Turso mỗi câu là một lượt mạng (20–50 ms), nên đường ghi nhiều em không được lặp câu theo từng
 * em. Trần 900 tham số một câu (SQLite cũ 999) — cùng cỡ lô với `loadBundle`. Chỉ tham số theo VỊ TRÍ (`?`), xem chỗ vá ở trên.
 */
export const THAM_SO_TOI_DA = 900;

/** Chia `ds` thành lô ≤ `co` phần tử, gọi `fn(lo, '?,?,…')` — chuỗi `?` đúng số phần tử của lô, để đặt vào `IN (…)`. */
export function theoLo<T>(ds: readonly T[], fn: (lo: T[], ph: string) => void, co = THAM_SO_TOI_DA): void {
  for (let i = 0; i < ds.length; i += co) {
    const lo = ds.slice(i, i + co);
    fn(lo, lo.map(() => '?').join(','));
  }
}

/**
 * PR-Dọn (quét #26): CHỐNG BẤM ĐÚP cho bảng CHƯA có cột `idempotency_key` — dòng khớp `khop` (cùng người, cùng đối tượng, cùng nội
 * dung; `IS ?` nên NULL khớp NULL) có `created_at` trong `giay` giây gần nhất → trả id của nó để nơi gọi trả lại bản đã có.
 * `bang` và tên cột chỉ do mã truyền vào (hằng), không bao giờ từ thân yêu cầu.
 * ponytail: chặn trùng 10 giây theo trạng thái; thêm cột khoá `idempotency_key` cho PA, followup, việc khi có migrate sau deploy.
 */
export function vuaGhi(bang: string, khop: Record<string, unknown>, giay = 10): number | null {
  const cot = Object.keys(khop);
  const tu = new Date(Date.now() - giay * 1000).toISOString();
  return (db().prepare(`SELECT id FROM ${bang} WHERE ${cot.map((c) => `${c} IS ?`).join(' AND ')} AND created_at >= ? ORDER BY id DESC LIMIT 1`)
    .get(...Object.values(khop), tu) as any)?.id ?? null;
}

/** `INSERT INTO t (a, b, …)` + `VALUES (?,?,…),(…)` + `duoi` nhiều dòng một câu, chia lô theo trần tham số. Mọi dòng cùng số cột. */
export function chenNhieuDong(dau: string, dong: readonly unknown[][], duoi = ''): void {
  if (!dong.length) return;
  const cot = dong[0].length;
  const mot = `(${Array(cot).fill('?').join(',')})`;
  theoLo(dong, (lo) => {
    db().prepare(`${dau} VALUES ${lo.map(() => mot).join(',')}${duoi}`).run(...lo.flat());
  }, Math.max(1, Math.floor(THAM_SO_TOI_DA / cot)));
}

/**
 * AN-5: đầu mỗi lời gọi API, nếu kết nối còn một giao dịch bỏ dở (lần gọi trước trên cùng bản hàm bị cắt) thì cuộn lại. Không mở
 * kết nối mới nếu chưa có (`instance` rỗng → không có gì để dọn, không tốn lượt mạng). Trả true khi đã dọn.
 */
export function donGiaoDichTreo(): boolean {
  if (!instance || !instance.inTransaction) return false;
  try { instance.exec('ROLLBACK'); } catch { /* kết nối đã hỏng — giao dịch cũng mất theo */ }
  savepointDepth = 0;
  return true;
}
