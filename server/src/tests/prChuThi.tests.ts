/**
 * PHÉP KIỂM CHU-THI (Rulebook §21.4) — "Thi" chỉ dành cho kỳ thi thật; Test (MT, Progress, Final…) dùng "Test" / "làm bài".
 *  CT-1 chữ hiện ra trong tệp Test không còn cụm "thi" cũ (tuần / phần / dời lịch / đổi lịch / ghi chú lịch / dự / đợt / lượt / bài thi).
 *  Danh sách miễn = tệp thi thật, CHỈ ĐƯỢC GIẢM. Khoá mã / cột SQL / đường dẫn không quét (chỉ chữ hiện ra — `quetFile`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const THU_MUC = ['web/src/modules/test', 'web/src/modules/cham', 'web/src/modules/fasttrack', 'web/src/modules/congViec', 'web/src/modules/duyet',
  'shared/domain', 'shared/huongDan', 'server/src/fasttrack', 'server/src/keHoach', 'server/src/worklist', 'server/src/duyet', 'server/src/normal'];
/** Tệp thi thật (giữ chữ "thi") — chỉ được bớt. */
const MIEN = new Set(['shared/domain/tongKetLoTrinh.ts', 'shared/domain/lichThiOv15f.ts', 'shared/huongDan/tvv.ts', 'shared/huongDan/cx.ts']);
const CU = /(tuần|phần|dời lịch|đổi lịch|ghi chú lịch|dự|đợt|lượt|bài) thi(?!\p{L})/iu;

export async function runPrChuThiTests(t: any) {
  const { checkAsync, assert } = t;
  console.log('\nCHU-THI · Thi = thi thật, Test = làm bài');
  const { quetFile } = await import(pathToFileURL(path.join(GOC, 'scripts/quet-chu.mjs')).href);
  const tep: string[] = [];
  const duyet = (d: string) => {
    for (const e of fs.readdirSync(path.join(GOC, d), { withFileTypes: true })) {
      const rel = `${d}/${e.name}`;
      if (e.isDirectory()) duyet(rel);
      else if (/\.tsx?$/.test(e.name) && !/\.d\.ts$/.test(e.name) && !MIEN.has(rel)) tep.push(rel);
    }
  };
  THU_MUC.forEach(duyet);

  await checkAsync('CT-1 · tệp Test không còn chữ "thi" cũ cho Test (Rulebook §21.4)', async () => {
    const ra: any[] = [];
    for (const f of tep) quetFile(path.join(GOC, f), f, 'ct', ra);
    const sot = ra.filter((r) => CU.test(r.text));
    assert(sot.length === 0, `${sot.length} chỗ: ` + sot.slice(0, 8).map((r) => `${r.file}:${r.line} "${r.text.slice(0, 60)}"`).join(' · '));
  });
}
