import fs from 'node:fs';
import path from 'node:path';

/**
 * PHÉP SO BẢN CHỤP GỐC (TRANG-LON — TL-VIEC, TL-HVL, TL-TQ). `PISA_CHUP_GOC=<thư mục>` → ghi `<thư mục>/<ten>.json`; `PISA_SO_GOC=<thư mục>` → so từng khoá,
 * lỗi in khoá đầu tiên khác + 300 ký tự hai bên; không biến → log "bỏ qua (không có gốc)" và qua (check đầy đủ vẫn chạy phép kiểm cũ của các hàm).
 * Chụp trên `origin/main` (cùng seed), so trên nhánh — tái cấu trúc không giữ được đường cũ song song để so bằng cờ.
 */
export function chupHoacSo(ten: string, tinh: () => Record<string, unknown>): void {
  const chup = process.env.PISA_CHUP_GOC, so = process.env.PISA_SO_GOC;
  if (!chup && !so) { console.log(`   ${ten}: bỏ qua (không có gốc)`); return; }
  const moi = Object.fromEntries(Object.entries(tinh()).map(([k, v]) => [k, JSON.stringify(v)]));
  if (chup) {
    fs.mkdirSync(chup, { recursive: true });
    fs.writeFileSync(path.join(chup, `${ten}.json`), JSON.stringify(moi, null, 0));
    console.log(`   ${ten}: đã chụp ${Object.keys(moi).length} khoá`);
    return;
  }
  const goc = JSON.parse(fs.readFileSync(path.join(so!, `${ten}.json`), 'utf8')) as Record<string, string>;
  for (const k of new Set([...Object.keys(goc), ...Object.keys(moi)])) {
    const a = goc[k] ?? '(không có)', b = moi[k] ?? '(không có)';
    if (a === b) continue;
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    const c = (s: string) => s.slice(Math.max(0, i - 300), i + 300);
    throw new Error(`${ten} khác ở khoá "${k}" (ký tự ${i}):\n  gốc: ${c(a)}\n  mới: ${c(b)}`);
  }
  console.log(`   ${ten}: ${Object.keys(moi).length} khoá, 0 khác`);
}
