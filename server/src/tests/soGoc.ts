/**
 * TRANG-LON · PHÉP SO BẢN CHỤP GỐC (TL-VIEC, TL-HVL, TL-TQ): tái cấu trúc đọc mà không giữ được đường cũ song song → chụp kết quả trên `origin/main`
 * (worktree tạm, cùng seed) rồi so trên nhánh. `PISA_CHUP_GOC=<thư mục>` ghi `<thư mục>/<ten>.json`; `PISA_SO_GOC=<thư mục>` so từng khoá, lỗi in khoá đầu
 * tiên khác + 300 ký tự hai bên; không biến → log "bỏ qua (không có gốc)" và qua (check đầy đủ vẫn chạy phép kiểm cũ của các hàm).
 */
import fs from 'node:fs';
import path from 'node:path';

export function chupHoacSo(ten: string, tinh: () => Record<string, unknown>): void {
  const chup = process.env.PISA_CHUP_GOC, so = process.env.PISA_SO_GOC;
  if (!chup && !so) { console.log(`    ${ten}: bỏ qua (không có gốc)`); return; }
  const moi = Object.fromEntries(Object.entries(tinh()).map(([k, v]) => [k, JSON.stringify(v)]));
  if (chup) {
    fs.mkdirSync(chup, { recursive: true });
    fs.writeFileSync(path.join(chup, `${ten}.json`), JSON.stringify(moi));
    console.log(`    ${ten}: chụp ${Object.keys(moi).length} khoá`);
    return;
  }
  const goc = JSON.parse(fs.readFileSync(path.join(so!, `${ten}.json`), 'utf8')) as Record<string, string>;
  const khoa = [...new Set([...Object.keys(goc), ...Object.keys(moi)])];
  for (const k of khoa) {
    const a = goc[k] ?? '(thiếu ở gốc)', b = moi[k] ?? '(thiếu ở nhánh)';
    if (a === b) continue;
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    const doan = (s: string) => s.slice(Math.max(0, i - 300), i + 300);
    throw new Error(`khoá ${k} khác ở ký tự ${i}\n  GỐC: ${doan(a)}\n  MỚI: ${doan(b)}`);
  }
  console.log(`    ${ten}: ${khoa.length} khoá, 0 khác`);
}
