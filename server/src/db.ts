import Database from 'libsql';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cauHinhDb, choPhepSeedTurso, coCoBanChinh } from './moiTruong.ts';
import { chanGiaoDichNeuSapHetGio, conLaiMs, KHONG_MO_GIAO_DICH_KHI_CON_MS } from './platform/hanGio.ts';
import { demCau, demDong, xoaNho } from './platform/nguCanhRequest.ts';
import { HttpError } from './util.ts';

/** Câu SQL vừa prepare gần nhất — chỉ để ghi log khi giao dịch hỏng (gán trong khối vá `prepare` bên dưới). */
let sqlGanNhat = '';

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
      /* TD2-0: đếm dòng ở `all` (mọi `get` của câu dùng lại cũng đi qua đây) — chỉ cộng length. */
      proto[ten] = function (this: unknown, ...args: unknown[]) {
        const out = goc.apply(this, motNull(args));
        if (Array.isArray(out)) demDong(out.length);
        return out;
      };
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
  proto.get = function (this: { daLuu?: boolean; all(...a: unknown[]): unknown[] }, ...args: unknown[]) {
    /* PR-BN: `get()` của libsql trên statement DÙNG LẠI trả dòng của lần gọi TRƯỚC (tham số mới bị bỏ qua) — `all()` thì đúng. */
    const row = this.daLuu ? this.all(...args)[0] : getGoc.apply(this, motNull(args));
    if (!this.daLuu) { demCau(); demDong(row ? 1 : 0); }   // đường `all` đã đếm qua `iterate` / `all`
    if (row && typeof row === 'object' && '_metadata' in row) delete (row as Record<string, unknown>)._metadata;
    return row;
  };
  /*
   * PR-BN: `prepare()` của libsql 0.5.29 RÒ ~4,9 KB bộ nhớ native MỖI lần gọi và `gc()` không trả lại (đo: 100 000 lần → +480 MB).
   * Mã gọi `db().prepare(...)` ở mọi lần dùng; bộ phép kiểm gọi 6,8 triệu lần (chỉ ~9,5 nghìn câu SQL khác nhau) → RSS tới 6,7 GB.
   * Nhớ đối tượng Rust theo (kết nối, câu SQL). Mỗi lần `prepare` trả một lớp bọc JS MỚI: `pluck` nằm ở lớp bọc nên tự mới;
   * `raw`/`safeIntegers` nằm ở đối tượng Rust nên đặt lại về mặc định (saoLuu dùng `.safeIntegers(true)`). `get()` của câu dùng
   * lại sai (xem trên) nên đi đường `all()[0]` (cờ `daLuu`). Không dùng `.iterate()` ở mã máy chủ; `all()` chạy hết một lượt.
   * Tối đa TOI_DA_CAU câu mỗi kết nối, bỏ câu lâu chưa dùng nhất (SQL ghép động như INSERT nhiều dòng có thể muôn hình).
   */
  const TOI_DA_CAU = 1000;
  type Bao = { stmt: unknown; pluckMode: boolean; daLuu?: boolean; raw(b: boolean): void; safeIntegers(b: boolean): void };
  const boNho = new WeakMap<object, Map<string, Bao>>();
  const prepareGoc = Database.prototype.prepare;
  Database.prototype.prepare = function (this: object, sql: string) {
    let theoCau = boNho.get(this);
    if (!theoCau) boNho.set(this, theoCau = new Map());
    /*
     * Khoá thêm TRẠNG THÁI GIAO DỊCH. Trên libsql nối mạng (Hrana), câu GHI prepare NGOÀI giao dịch rồi chạy lại TRONG tx() phá giao dịch
     * đang mở (các câu sau ghi lẻ ngoài giao dịch, `RELEASE sp_1` báo "no such savepoint"). File cục bộ không bị nên `npm run check` không thấy.
     * Trong giao dịch không bao giờ dùng lại câu đã prepare ngoài giao dịch (và ngược lại).
     */
    sqlGanNhat = sql;
    const khoa = ((this as { inTransaction?: boolean }).inTransaction ? 'T|' : 'A|') + sql;
    const cu = theoCau.get(khoa);
    if (cu) {
      theoCau.delete(khoa);
      theoCau.set(khoa, cu);
      const moi = Object.create(Object.getPrototypeOf(cu)) as Bao;
      moi.stmt = cu.stmt;
      moi.pluckMode = false;
      moi.daLuu = true;
      /* libsql ném lỗi khi đặt chế độ trên câu không trả dữ liệu (PRAGMA, DDL) — câu như vậy cũng không thể đã bị đặt chế độ. */
      try { moi.raw(false); } catch { /* không trả dữ liệu */ }
      try { moi.safeIntegers(false); } catch { /* không trả dữ liệu */ }
      return moi;
    }
    const st = prepareGoc.call(this, sql) as unknown as Bao;
    st.daLuu = true;
    theoCau.set(khoa, st);
    if (theoCau.size > TOI_DA_CAU) theoCau.delete(theoCau.keys().next().value as string);
    return st;
  } as unknown as typeof Database.prototype.prepare;
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
 * MẤT KẾT NỐI TURSO (PR-Z2c-b; mở rộng 07/10; thêm STREAM_EXPIRED 08/10: luồng Hrana bỏ không quá ~10 s). Kết nối Turso giữ ở cấp module; phía Turso có lúc đã bỏ nó — câu kế tiếp hỏng với
 *   · `Hrana(Api("status=404 … stream not found: …"))` (bản nháp 23/09, log `mã 17476fd8`, 1/~900 lời gọi), hoặc
 *   · `Hrana(Http("connection closed before message completed"))` (bản chính 07/10, `mã fa58786a`, `fbb92cd0`: câu đầu tiên của
 *     request sau lúc rảnh), `fetch failed`, `ECONNRESET`.
 * Kết nối đó coi như chết: bỏ nó, lần gọi db() sau mở kết nối mới. Khi nào được chạy lại: xem thuLaiKhiMatKetNoi (app.ts).
 * migrate/run.ts dùng chung hàm này.
 */
const LOI_MAT_KET_NOI = /stream not found|STREAM_EXPIRED|stream has expired|connection closed|Hrana\(Http|fetch failed|ECONNRESET/i;
/*
 * CHỈ lỗi do libsql ném: `SqliteError` (lỗi SQLite/Hrana đã đổi kiểu) hoặc `Error` thường (lỗi gốc của lớp native). `fetch failed` của
 * fetch Node — kho tệp Netlify Blobs (platform/khoTep.ts) — là `TypeError`: không phải Turso, không bỏ kết nối còn tốt, không thử lại (VIEC-NHO 6).
 */
export function laLoiMatKetNoiTurso(e: unknown): boolean {
  return e instanceof Error && (e.constructor === Error || e.name === 'SqliteError') && LOI_MAT_KET_NOI.test(e.message);
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
      /* PR-DEPLOY: lần nghỉ cuối cắt cho vừa hạn chờ — bỏ cuộc ĐÚNG ~CHO_KHOA_GHI_MS trên mọi máy (trước đây bỏ cuộc ở 4,6–5 s tuỳ tốc độ mỗi lần thử). */
      const nghi = Math.min(50 * 2 ** lan, 400, CHO_KHOA_GHI_MS - daCho);
      const con = conLaiMs();
      if (nghi <= 0 || (con !== null && con - nghi < KHONG_MO_GIAO_DICH_KHI_CON_MS)) {
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

/**
 * Sau fn() mà kết nối không còn trong giao dịch = giao dịch đã MẤT giữa chừng (phần ghi trước bị bỏ, phần sau có thể đã ghi lẻ).
 * Không được chạy tiếp như đã ghi thành công: ghi log rõ rồi ném — tx() cuộn lại phần còn được và báo lỗi.
 */
function giaoDichConKhong(conn: Database.Database, ten: string): void {
  if (conn.inTransaction) return;
  const cau = sqlGanNhat;
  console.error(`[tx] ${ten}: giao dịch đã mất giữa chừng (kết nối không còn trong giao dịch) — câu prepare gần nhất: ${cau.slice(0, 200)}`);
  throw new Error(`Giao dịch bị mất giữa chừng (${ten}), dữ liệu có thể chưa lưu đủ.`);
}

function logRollbackHong(ten: string, e: unknown): void {
  console.error(`[tx] ${ten}: cuộn lại/giải phóng hỏng: ${String((e as Error)?.message ?? e)} — câu prepare gần nhất: ${sqlGanNhat.slice(0, 200)}`);
}
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
      giaoDichConKhong(conn, 'giao dịch ngoài');
      conn.exec('COMMIT');
      return out;
    } catch (e) {
      /* Cuộn lại hỏng (mạng Turso đứt…) thì vẫn ném LỖI GỐC — nhưng không im lặng: ghi log. */
      try { if (conn.inTransaction) conn.exec('ROLLBACK'); } catch (e2) { logRollbackHong('giao dịch ngoài', e2); }
      xoaNho();   // PR-Dọn (Q7, quét #27): giá trị đã nhớ trong giao dịch có thể là dữ liệu vừa bị cuộn lại
      if (typeof e === 'object' && e !== null) loiTuGiaoDich.add(e);   // PR-Z2c-b: không thử lại
      throw e;
    }
  }
  const name = `sp_${++savepointDepth}`;
  conn.exec(`SAVEPOINT ${name}`);
  try {
    const out = fn();
    giaoDichConKhong(conn, name);
    conn.exec(`RELEASE ${name}`);
    return out;
  } catch (e) {
    /* Cuộn lại hỏng (mạng Turso đứt, savepoint đã mất…) thì vẫn ném LỖI GỐC — vòng ngoài sẽ cuộn lại cả giao dịch. */
    try { conn.exec(`ROLLBACK TO ${name}`); conn.exec(`RELEASE ${name}`); } catch (e2) { logRollbackHong(name, e2); }
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
 * PR-GVa (F01 = D13): KHOÁ GỬI mỗi lần mở form. Dòng `bang` của `nguoiCot = nguoiId` có khoá `khoa` → id, không có → null.
 * Khoá gắn người tạo: cùng mã từ người khác không trả dòng của người kia. `bang`/`nguoiCot` là hằng trong mã, không bao giờ từ thân yêu cầu.
 * Nơi gọi kiểm quyền và dữ liệu nhập TRƯỚC rồi mới tra khoá.
 */
export function theoKhoaGui(bang: 'tasks' | 'case_interventions' | 'case_followups', nguoiCot: string, nguoiId: number, khoa: string | null): number | null {
  if (!khoa) return null;
  return (db().prepare(`SELECT id FROM ${bang} WHERE ${nguoiCot} = ? AND idempotency_key = ?`).get(nguoiId, khoa) as any)?.id ?? null;
}

/** Lỗi do unique index khoá gửi (hai lần gửi đồng thời cùng khoá) — để nơi gọi đọc lại dòng đã có thay vì báo lỗi. */
export const laTrungKhoa = (e: unknown): boolean =>
  /UNIQUE constraint failed: \w+\.\w+, \w+\.idempotency_key/i.test(String((e as any)?.message ?? e));

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
