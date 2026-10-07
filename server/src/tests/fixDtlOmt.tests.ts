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

/** Cột của vế SELECT đầu (tới FROM đầu tiên ở độ sâu 0), tách theo dấu phẩy ở độ sâu 0. */
function cotVeDau(sql: string): string[] {
  const i = sql.search(/\bSELECT\b/i);
  if (i < 0) return [];
  let sau = 0, j = i + 6;
  for (; j < sql.length; j++) {
    const c = sql[j];
    if (c === '(') sau++;
    else if (c === ')') sau--;
    else if (sau === 0 && /^\sFROM\s/i.test(sql.slice(j, j + 6))) break;
  }
  const out: string[] = [];
  let tu = i + 6; sau = 0;
  for (let k = tu; k < j; k++) {
    const c = sql[k];
    if (c === '(') sau++;
    else if (c === ')') sau--;
    else if (c === ',' && sau === 0) { out.push(sql.slice(tu, k).trim()); tu = k + 1; }
  }
  out.push(sql.slice(tu, j).trim());
  return out;
}

export async function runFixDtlOmtTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const attemptsMod: any = await import('../fasttrack/attempts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nFIX-DTL-OMT · hồ sơ Mock mở từ Điểm theo lớp; ô MT "chờ" ≠ "chưa xếp"');

  check('DTL1 · câu SQL gộp (UNION) ở máy chủ: cột `bang.cot` của vế đầu PHẢI có AS — Turso không đặt tên cột như libsql file', () => {
    const loi: string[] = [];
    for (const f of tepMayChu()) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/`([^`]*\bUNION\b[^`]*)`/g)) {
        for (const cot of cotVeDau(m[1])) if (/^\w+\.\w+$/.test(cot)) loi.push(`${path.relative(ROOT, f)}: ${cot}`);
      }
    }
    assert(loi.length === 0, `cột chưa đặt tên trong câu UNION:\n${loi.join('\n')}`);
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
    assert(d.chipDongKyNang(het, '2026-10-06', null, true)?.tone === 'wait', 'chip dòng MT cũ chờ phải tím');
  });

  check('DTL5 · lưới FT (ChipDotFT): chữ chip không bị cắt — không truncate, chip xuống dòng được (cao tối thiểu 20px)', () => {
    const c = doc('web/src/modules/test/keHoach/ChipKyNang.tsx');
    const ft = c.slice(c.indexOf('export function ChipDotFT'));
    assert(!/truncate/.test(ft), 'ChipDotFT còn truncate');
    assert(/min-h-5/.test(ft) && /flex-wrap/.test(ft) && !/(?<![\w-])h-5\b/.test(ft), 'chip FT chưa xuống dòng được');
  });
}
