/**
 * PHÉP KIỂM HEAD (chủ SP 18/11 "Đổi 'Quản Lý' thành 'Head'"): vai máy chủ `manager` hiện là "Head" ở MỌI chữ người dùng thấy.
 * Khoá `manager`, cột DB, tên biến, chú thích giữ nguyên. "quản lý" là động từ / tên khu chức năng (Việc quản lý, Quản lý thời gian…) không đổi.
 * Phép soi nguồn theo mẫu donMa (đọc tệp, bỏ chú thích).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as people from '../../../shared/domain/people.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const tepDeQuy = (rel: string): string[] => fs.readdirSync(path.join(REPO, rel), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? (e.name === 'node_modules' ? [] : tepDeQuy(`${rel}/${e.name}`)) : /\.tsx?$/.test(e.name) ? [`${rel}/${e.name}`] : []));
// "Quản lý" không phải vai: tên khu chức năng / động từ.
const KHONG_PHAI_VAI = /Quản lý (thời gian|danh sách tutor)|[Qq]uản lý học vụ/g;

export async function runPrHeadTests(t: any) {
  const { check, assert } = t;
  console.log('\nHEAD · vai manager hiện là "Head"');

  check('HEAD-1 · ROLE_LABEL.manager = "Head"; Head tutor vẫn là vai riêng', () => {
    assert(people.ROLE_LABEL.manager === 'Head', `ROLE_LABEL.manager = ${people.ROLE_LABEL.manager}`);
    assert(people.ROLE_LABEL.head_tutor === 'Head tutor', `ROLE_LABEL.head_tutor = ${people.ROLE_LABEL.head_tutor}`);
  });

  check('HEAD-2 · quét web / shared / máy chủ: không còn chữ "Quản lý" / "QL" chỉ vai trong mã (không tính chú thích, tests, migrate)', () => {
    const tep = ['web/src', 'shared', 'server/src'].flatMap(tepDeQuy).filter((f) => !/server\/src\/(tests|migrate)\//.test(f));
    const sot: string[] = [];
    for (const f of tep) {
      const s = boChuThich(fs.readFileSync(path.join(REPO, f), 'utf8')).replace(KHONG_PHAI_VAI, '');
      for (const m of s.matchAll(/Quản lý|\bQL\b/g)) {
        const dong = s.slice(0, m.index).split('\n').length;
        // 'QL' đứng riêng một chuỗi là giá trị mã, không phải chữ hiển thị — không có sau khi đổi; báo hết.
        sot.push(`${f}:${dong}`);
      }
    }
    assert(sot.length === 0, `còn ${sot.length} chỗ: ${sot.slice(0, 8).join(' · ')}`);
  });
}
