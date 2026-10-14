/**
 * LẤY PHẦN NHỊ PHÂN LINUX CỦA libsql VÀO node_modules — bước đầu tiên của `npm run build`, nên `netlify deploy --build` tự chạy nó.
 *
 * Netlify Functions chạy Amazon Linux x86_64 dùng glibc → gói đúng là `@libsql/linux-x64-gnu` (KHÔNG phải musl, KHÔNG phải arm64).
 *
 * Vì sao: chủ sản phẩm deploy thủ công từ máy WINDOWS (`netlify deploy --build`), còn Netlify chạy LINUX. `npm install`
 * trên Windows chỉ tải `@libsql/win32-x64-msvc`; npm 11 bỏ qua gói tuỳ chọn khác hệ điều hành kể cả với `--force`, còn
 * `--os=linux` thì xoá mất bản Windows (đã thử 22/09). Nên tải đúng MỘT gói `@libsql/linux-x64-gnu`, cùng số bản với
 * `libsql`, KIỂM MÃ BĂM sha512 theo `package-lock.json`, rồi giải nén vào `node_modules/@libsql/linux-x64-gnu/`.
 * Không đụng `@libsql/win32-x64-msvc`, không chạy `npm install`/`uninstall` nào. `npm install` lần sau có thể dọn thư mục này đi — không sao, mỗi lần build lại lấy lại.
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
if (daCo()) { console.log(`[libsql-linux] ${GOI}@${banCan}: đã có, bỏ qua.`); process.exit(0); }

const khoa = docJson(path.join(repo, 'package-lock.json')).packages?.[`node_modules/${GOI}`];
if (!khoa?.integrity?.startsWith('sha512-') || khoa.version !== banCan) {
  console.error(`[libsql-linux] package-lock.json không có mã băm sha512 cho ${GOI}@${banCan} — dừng, không tải thứ không kiểm được.`);
  process.exit(1);
}

const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'libsql-linux-'));
try {
  /* `npm pack` tải đúng tệp .tgz từ registry npm. Tên gói và số bản lấy từ package.json của libsql, không từ người dùng. */
  const ra = execSync(`npm pack ${GOI}@${banCan} --pack-destination "${tam}" --json`, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
  /* `npm pack --json`: npm ≤ 10 trả mảng [{…}], npm 11 trả object { "<tên>": {…} } — nhận cả hai (bỏ chữ thừa trước JSON nếu có). */
  const dau = [ra.indexOf('['), ra.indexOf('{')].filter((i) => i >= 0);
  const thongTin = Object.values(JSON.parse(ra.slice(Math.min(...dau))))[0];
  const tgz = fs.readdirSync(tam).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error('npm pack không tạo ra tệp .tgz');
  const duLieu = fs.readFileSync(path.join(tam, tgz));
  /* KIỂM TOÀN VẸN HAI LẦN: `integrity` npm báo VÀ mã băm tự tính từ chính tệp vừa tải đều phải BẰNG package-lock.json. */
  const bam = 'sha512-' + crypto.createHash('sha512').update(duLieu).digest('base64');
  if (thongTin?.integrity !== khoa.integrity || bam !== khoa.integrity) {
    throw new Error(`Mã băm KHÔNG khớp package-lock.json — không chép gì vào node_modules.\n  npm báo:  ${thongTin?.integrity}\n  tự tính:  ${bam}\n  kỳ vọng: ${khoa.integrity}`);
  }

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
      const noiGhi = path.resolve(dich, tuongDoi);
      if (!noiGhi.startsWith(dich + path.sep)) throw new Error(`Tên tệp lạ trong gói: ${ten}`);
      fs.mkdirSync(path.dirname(noiGhi), { recursive: true });
      fs.writeFileSync(noiGhi, tar.subarray(i, i + co));
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
