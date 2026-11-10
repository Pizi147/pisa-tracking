/**
 * P1-CASE (rà toàn bộ 11/11, chủ SP "sửa lỗi P1 luôn"): G2-01 xoá Case trong khối Case hồ sơ HV mất dải Hoàn tác — danh sách tải lại gỡ Ngăn Case
 * đang giữ dải (`NganCase` → `CotCaseHv`). Sửa: cột Case giữ dải "Đã xoá … Hoàn tác" ở đúng chỗ dòng Case; sau khi xoá không tải lại chính Case (404).
 * Luồng React không chạy được ở đây — phép kiểm đọc nguồn giữ đường nối; bấm thử thật + ảnh trước | sau ở PR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runPrP1CaseTests(t: any) {
  const { check, assert } = t;
  console.log('\nP1-CASE · xoá Case ở hồ sơ HV giữ Hoàn tác');
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const nguon = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');

  check('G2-01 · cột Case hồ sơ HV giữ dải Đã xoá (DaiDaXoa) khi danh sách tải lại; Ngăn Case trao dải cho nơi gọi', () => {
    const cot = nguon('web/src/modules/students/CotCaseHv.tsx'), ngan = nguon('web/src/modules/students/NganCase.tsx');
    assert(/<DaiDaXoa\b/.test(cot), 'CotCaseHv vẽ DaiDaXoa');
    assert(/<NganCase\b[\s\S]*?onDaXoa=\{\(x\) => setVuaXoa/.test(cot), 'CotCaseHv truyền onDaXoa cho NganCase');
    assert(/onDaXoa\?: \(x: DaXoaCase\) => void/.test(ngan) && /if \(onDaXoa\) onDaXoa\(x\)/.test(ngan), 'NganCase nhận onDaXoa, gọi thay vì tự giữ dải');
  });

  check('G2-01 · Xoá Case xong không tải lại /cases/:id của chính Case vừa xoá (404) — chỉ danh sách /cases?', () => {
    const p = nguon('web/src/modules/cases/CasePanel.tsx');
    assert(/invalidate\(daXoa \? '\/cases\?' : '\/cases'\)/.test(p) && /lamMoi\(true\)/.test(p), 'XoaCase: lamMoi(true) chỉ vô hiệu /cases?');
  });
}
