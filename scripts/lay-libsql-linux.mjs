/**
 * LẤY PHẦN NHỊ PHÂN LINUX CỦA libsql VÀO node_modules — chạy trước khi build để deploy (netlify.toml gọi).
 *
 * Vì sao: chủ sản phẩm deploy thủ công từ máy WINDOWS (`netlify deploy --build`), còn Netlify chạy LINUX. `npm install`
 * trên Windows chỉ tải `@libsql/win32-x64-msvc`; npm 11 bỏ qua gói tuỳ chọn khác hệ điều hành kể cả với `--force`, còn
 * `--os=linux` thì xoá mất bản Windows (đã thử 22/09). Nên tải đúng MỘT gói `@libsql/linux-x64-gnu`, cùng số bản với
 * `libsql`, KIỂM MÃ BĂM sha512 theo `package-lock.json`, rồi giải nén vào `node_modules/@libsql/linux-x64-gnu/`.
 * Bản Windows không bị đụng. `npm install` lần sau có thể dọn thư mục này đi — không sao, mỗi lần build lại lấy lại.
 */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const GOI = '@libsql/linux-x64-gnu';
const repo = process.cwd();
const docJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const banCan = docJson(path.join(repo, 'node_modules/libsql/package.json')).optionalDependencies?.[GOI];
if (!banCan) { console.error(`[libsql-linux] libsql không khai báo ${GOI} — dừng.`); process.exit(1); }
const dich = path.join(repo, 'node_modules', ...GOI.split('/'));

const daCo = () => {
  try { return docJson(path.join(dich, 'package.json')).version === banCan && fs.readdirSync(dich).some((f) => f.endsWith('.node')); }
  catch { return false; }
};
if (daCo()) { console.log(`[libsql-linux] Đã có ${GOI}@${banCan}.`); process.exit(0); }

const khoa = docJson(path.join(repo, 'package-lock.json')).packages?.[`node_modules/${GOI}`];
if (!khoa?.integrity?.startsWith('sha512-') || khoa.version !== banCan) {
  console.error(`[libsql-linux] package-lock.json không có mã băm sha512 cho ${GOI}@${banCan} — dừng, không tải thứ không kiểm được.`);
  process.exit(1);
}

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'libsql-linux-'));
try {
  /* `npm pack` tải đúng tệp .tgz từ registry đang cấu hình. Tên gói và số bản lấy từ package.json của libsql, không từ người dùng. */
  execSync(`npm pack ${GOI}@${banCan} --pack-destination "${tam}" --silent`, { stdio: ['ignore', 'ignore', 'inherit'] });
  const tgz = fs.readdirSync(tam).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error('npm pack không tạo ra tệp .tgz');
  const duLieu = fs.readFileSync(path.join(tam, tgz));
  const bam = 'sha512-' + crypto.createHash('sha512').update(duLieu).digest('base64');
  if (bam !== khoa.integrity) throw new Error(`Mã băm KHÔNG khớp package-lock.json — không dùng tệp này.\n  nhận:    ${bam}\n  kỳ vọng: ${khoa.integrity}`);

  /* Giải nén tar tối giản: mỗi mục = đầu 512 byte (tên ở 0..100, cỡ bát phân ở 124..136, loại ở 156) + nội dung làm tròn 512. */
  const tar = zlib.gunzipSync(duLieu);
  fs.rmSync(dich, { recursive: true, force: true });
  for (let i = 0; i + 512 <= tar.length;) {
    const dau = tar.subarray(i, i + 512);
    const ten = dau.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    if (!ten) break;
    const co = parseInt(dau.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim() || '0', 8);
    const loai = String.fromCharCode(dau[156] || 48);
    i += 512;
    if (loai === '0') {
      const tuongDoi = ten.replace(/^package\//, '');
      const ra = path.resolve(dich, tuongDoi);
      if (!ra.startsWith(dich + path.sep)) throw new Error(`Tên tệp lạ trong gói: ${ten}`);
      fs.mkdirSync(path.dirname(ra), { recursive: true });
      fs.writeFileSync(ra, tar.subarray(i, i + co));
    }
    i += Math.ceil(co / 512) * 512;
  }
  if (!daCo()) throw new Error('Giải nén xong nhưng không thấy tệp .node đúng số bản.');
  console.log(`[libsql-linux] Đã lấy ${GOI}@${banCan} (mã băm khớp package-lock.json).`);
} catch (e) {
  console.error(`[libsql-linux] HỎNG: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
} finally {
  try { fs.rmSync(tam, { recursive: true, force: true }); } catch { /* Windows còn giữ file — bỏ qua dọn dẹp */ }
}
