/**
 * FIX-DTL-OMT (07/10):
 *  - Lỗi 1: Test › Điểm theo lớp, bấm tên em "cũ" → `GET /attempts/:id` 500 trên bản chính ("reading 'startsWith'", mã ece85960).
 *    `scoreHistoryOf` là câu UNION ALL có cột `l.action` không đặt tên — Turso trả tên cột khác libsql file → `l.action` undefined.
 *  - Lỗi 2: lưới FT Kế hoạch Test — "chờ" của MT cũ xám y hệt "chưa xếp" (trái C2: chờ = tím); chip bị cắt chữ.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Mọi tệp .ts máy chủ (trừ phép kiểm / migrate / seed). */
function tepMayChu(dir = path.join(ROOT, 'server', 'src')): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ['tests', 'migrate', 'seed'].includes(e.name) ? [] : tepMayChu(p);
    return e.name.endsWith('.ts') ? [p] : [];
  });
}

/**
 * Mọi chuỗi mẫu (`...`) trong mã nguồn, bỏ qua chú thích và chuỗi thường; `${...}` thay bằng `?` (chuỗi mẫu lồng bên trong trả riêng).
 * Regex cũ "từ dấu ` tới dấu `" ghép nhầm dấu ` trong chú thích nên bỏ sót câu thật (VIEC-NHO 2: `trangThai.ts`, `attempts.ts`).
 */
function chuoiMau(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  const mau = () => {   // src[i] là dấu ` mở
    let t = '';
    for (i++; i < src.length && src[i] !== '`'; i++) {
      if (src[i] === '\\') { t += src[i] + src[++i]; continue; }
      if (src[i] === '$' && src[i + 1] === '{') { t += '?'; i += 2; ma(1); i--; continue; }
      t += src[i];
    }
    out.push(t);
  };
  /** Đọc mã tới khi `}` hạ độ sâu về 0 (sau `${`) hoặc hết tệp. */
  const ma = (sau: number) => {
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 1; }
      else if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); i = e < 0 ? src.length : e; }
      else if (c === "'" || c === '"') { for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++; }
      else if (c === '`') mau();
      else if (c === '{') sau++;
      else if (c === '}' && --sau === 0) { i++; return; }
    }
  };
  ma(Infinity);
  return out;
}

/** Lùi từ `k` tìm từ khoá `tu` ở CÙNG độ sâu ngoặc; gặp '(' chưa đóng thì dừng. Trả vị trí, -1 nếu không thấy, -2 nếu ra khỏi ngoặc. */
function lui(sql: string, k: number, tu: string): number {
  let sau = 0;
  for (; k >= 0; k--) {
    const c = sql[k];
    if (c === ')') sau++;
    else if (c === '(') { if (--sau < 0) return -2; }
    else if (sau === 0 && new RegExp(`^${tu}\\b`, 'i').test(sql.slice(k, k + tu.length + 1)) && !/\w/.test(sql[k - 1] ?? '')) return k;
  }
  return -1;
}

/** Tách theo dấu phẩy ở độ sâu 0 trong đoạn [tu, het). */
function tachPhay(sql: string, tu: number, het: number): string[] {
  const out: string[] = [];
  let sau = 0;
  for (let k = tu; k < het; k++) {
    const c = sql[k];
    if (c === '(') sau++;
    else if (c === ')') sau--;
    else if (c === ',' && sau === 0) { out.push(sql.slice(tu, k).trim()); tu = k + 1; }
  }
  out.push(sql.slice(tu, het).trim());
  return out;
}

/**
 * Cột vế ĐẦU của mỗi câu gộp UNION ở mức ngoài cùng — cột mà mã đọc theo tên (`r.id`, `r.action`). Bỏ: UNION trong câu con
 * (`COUNT(*) FROM (… UNION …)`, `IN (… UNION …)` — tên cột không ai đọc) và `INSERT … SELECT … UNION` (cột theo vị trí).
 */
function cotVeDauUnion(sql: string): string[][] {
  if (/^\s*INSERT\b/i.test(sql)) return [];
  const ra: string[][] = [];
  for (const m of sql.matchAll(/\bUNION\b/gi)) {
    const dau = lui(sql, m.index! - 1, 'SELECT');
    if (dau < 0 || lui(sql, dau - 1, 'UNION') !== -1) continue;   // trong câu con (-2), hoặc là vế 2, 3… (≥ 0)
    let sau = 0, het = dau + 6;
    for (; het < sql.length; het++) {
      const c = sql[het];
      if (c === '(') sau++;
      else if (c === ')') sau--;
      else if (sau === 0 && /^\sFROM\s/i.test(sql.slice(het, het + 6))) break;
    }
    ra.push(tachPhay(sql, dau + 6, het).map((x) => x.replace(/^DISTINCT\s+/i, '')));
  }
  return ra;
}

/** Cột thiếu tên: không có `AS ten` và không phải hằng (số, chuỗi, NULL, `?` — hằng chỉ dùng để biết "có dòng"). */
const thieuTen = (cot: string) => !/\sAS\s+\w+$/i.test(cot) && !/^(\d+|'[^']*'|NULL|\?)$/i.test(cot);

export async function runFixDtlOmtTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const attemptsMod: any = await import('../fasttrack/attempts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nFIX-DTL-OMT · hồ sơ Mock mở từ Điểm theo lớp; ô MT "chờ" ≠ "chưa xếp"');

  check('DTL1 · câu SQL gộp (UNION) ở máy chủ: MỌI cột vế đầu (cột trần `id`, `bang.cot`, biểu thức) PHẢI có AS — Turso không đặt tên cột như libsql file', () => {
    const loi: string[] = [];
    let soCau = 0;
    for (const f of tepMayChu()) {
      for (const sql of chuoiMau(fs.readFileSync(f, 'utf8'))) {
        for (const cot of cotVeDauUnion(sql)) {
          soCau++;
          for (const c of cot) if (thieuTen(c)) loi.push(`${path.relative(ROOT, f)}: ${c.replace(/\s+/g, ' ')}`);
        }
      }
    }
    assert(soCau >= 7, `bộ quét chỉ thấy ${soCau} câu UNION — hỏng bộ đọc chuỗi mẫu?`);
    assert(loi.length === 0, `cột chưa đặt tên trong câu UNION:\n${loi.join('\n')}`);
  });

  check('DTL1b · bộ quét DTL1 bắt cột trần / bang.cot / biểu thức thiếu AS; bỏ câu con, hằng, INSERT; đọc qua dấu ` trong chú thích', () => {
    const thieu = (sql: string) => cotVeDauUnion(sql).flat().filter(thieuTen).join('|');
    assert(thieu('SELECT 0 AS loai, id, m.kind, COUNT(*) FROM a UNION ALL SELECT 1, id, k, 2 FROM b') === 'id|m.kind|COUNT(*)', 'cột trần');
    assert(thieu('SELECT x AS x FROM a UNION ALL SELECT y FROM b UNION ALL SELECT z FROM c') === '', 'vế 2, 3 không cần AS');
    assert(thieu('SELECT COUNT(*) FROM (SELECT task_id FROM a UNION SELECT id FROM b)') === '', 'câu con');
    assert(thieu('SELECT 1 FROM a WHERE x = ? UNION ALL SELECT 1 FROM b') === '', 'hằng');
    assert(thieu('INSERT INTO t (a) SELECT x FROM a UNION ALL SELECT y FROM b') === '', 'INSERT');
    const ds = chuoiMau('/* `a` UNION `b` */ const q = `SELECT x FROM t WHERE i IN (${ph}) UNION SELECT y FROM u`; f(`${xs.map((v) => `n${v}`)}`);');
    assert(ds.length === 3 && ds[0] === 'SELECT x FROM t WHERE i IN (?) UNION SELECT y FROM u', JSON.stringify(ds));
  });

  check('DTL2 · scoreHistoryOf: lượt MT cũ có nhật ký "score.lich_su" → dòng lịch sử điểm đọc đủ (kind edit, kỹ năng)', () => {
    const r = conn.prepare(
      `SELECT l.entity_id AS id FROM audit_logs l JOIN assessment_attempts a ON a.id = l.entity_id
        WHERE l.entity_type = 'assessment_attempt' AND l.action = 'score.lich_su' AND l.created_at >= a.created_at LIMIT 1`,
    ).get() as any;
    assert(!!r, 'seed thiếu lượt MT cũ có nhật ký score.lich_su');
    const ls = attemptsMod.scoreHistoryOf(r.id);
    assert(ls.length > 0 && ls.every((x: any) => x.kind === 'edit' && typeof x.skill === 'string' && x.skill.length > 0), JSON.stringify(ls[0]));
    const det = attemptsMod.attemptDetail(P.admin, r.id);
    assert(det.lichSu === true && det.scoreHistory.length === ls.length, 'attemptDetail lượt MT cũ');
  });

  check('DTL3 · GET /attempts/:id của bài lớp thường bộ môn khác 4 kỹ năng IELTS (PREFOU tong_hop) không 500 — trả `kind` để màn chuyển sang bảng điểm lớp thường', () => {
    const r = conn.prepare(
      `SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
        WHERE c.programme_code = 'PREFOU' AND a.kind IN ('progress', 'final') LIMIT 1`,
    ).get() as any;
    assert(!!r, 'seed thiếu bài lớp PREFOU');
    const det = attemptsMod.attemptDetail(P.admin, r.id);
    assert(det.kind !== 'mock' && Array.isArray(det.skillSchedule), JSON.stringify({ kind: det.kind }));
  });

  check('DTL4 · C2: "chờ" luôn TÍM (wait), kể cả MT cũ chưa điểm — không trùng màu "chưa xếp" (xám)', () => {
    const o = doc('web/src/ui/OMt.tsx');
    const mau = (k: string) => new RegExp(`'?${k}'?: '([^']*)'`).exec(o)?.[1] ?? '';
    assert(/bg-wait-bg/.test(mau('cho-cham-cu')) && /text-wait/.test(mau('cho-cham-cu')), `cho-cham-cu: ${mau('cho-cham-cu')}`);
    assert(mau('cho-cham-cu') !== mau('chua-lich'), 'chờ (MT cũ) trùng màu chưa xếp');
    const het: any = { trangThai: 'da-xep', tuan: '2026-09-07', periodId: 1, doiTu: null, batBuoc: true, khoa: null, sit: 'scheduled', tuanKetThuc: '2026-09-13', choDuyet: false, hanCham: null };
    assert(d.chipDongKyNang(het, '2026-10-06', null, true)?.tone === 'muted', 'chip dòng MT cũ chờ: xám (OV-15a bỏ tím)');
  });

  check('DTL5 · lưới FT (ChipDotFT): chữ chip không bị cắt — không truncate, chip xuống dòng được (cao tối thiểu 20px)', () => {
    const c = doc('web/src/modules/test/keHoach/ChipKyNang.tsx');
    const ft = c.slice(c.indexOf('export function ChipDotFT'));
    assert(!/truncate/.test(ft), 'ChipDotFT còn truncate');
    assert(/min-h-5/.test(ft) && /flex-wrap/.test(ft) && !/(?<![\w-])h-5\b/.test(ft), 'chip FT chưa xuống dòng được');
  });
}
