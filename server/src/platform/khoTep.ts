/**
 * KHO TỆP — nơi cất nội dung tệp bằng chứng. Bảng `attachments` giữ metadata + `url` (= khoá trong kho).
 * Máy dev: ổ đĩa `data/uploads/` như trước. Bản chính: Netlify Blobs (Netlify Functions không có ổ đĩa giữ lâu).
 */
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH, laDbTuXa } from '../db.ts';
import { laBanChinh, tenMayChuDb } from '../moiTruong.ts';

/**
 * TÊN KHO TỆP ĐI THEO DATABASE (PR-Z2 22/09). Kho Netlify Blobs dùng chung cả site cho MỌI loại deploy — bản nháp nối
 * database thử mà ghi vào cùng kho với bản chính thì tệp thử lẫn vào tệp thật. Nên mỗi database một kho:
 * `bang-chung-<phần đầu tên máy chủ>`, ví dụ `bang-chung-pisatracking-demo-pizi147`. Không có Turso (máy dev) → kho cục bộ.
 * Không truyền `url` = database đang nối. Lệnh sao lưu dùng đúng hàm này để tải đúng kho.
 * Netlify giới hạn tên kho 64 byte, không có `/` — phần đầu tên máy chủ chỉ có chữ thường, số, gạch ngang.
 */
export function tenKhoTep(url: string | null = laDbTuXa() ? DB_PATH : null): string {
  const dau = url ? tenMayChuDb(url).split('.')[0] : '';
  return dau ? `bang-chung-${dau}`.slice(0, 64) : 'bang-chung-cuc-bo';
}

export interface KhoTep {
  ghi(khoa: string, duLieu: Buffer, mime: string): Promise<void>;
  doc(khoa: string): Promise<Buffer | null>;
  xoa(khoa: string): Promise<void>;
}

export function khoTepODia(thuMuc: string): KhoTep {
  const duongDan = (khoa: string) => {
    const abs = path.resolve(thuMuc, khoa);
    if (!abs.startsWith(path.resolve(thuMuc) + path.sep)) throw new Error('Khoá tệp không hợp lệ.');
    return abs;
  };
  return {
    async ghi(khoa, duLieu) { const p = duongDan(khoa); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, duLieu); },
    async doc(khoa) { const p = duongDan(khoa); return fs.existsSync(p) ? fs.readFileSync(p) : null; },
    async xoa(khoa) { fs.rmSync(duongDan(khoa), { force: true }); },
  };
}

export function khoTepNetlify(): KhoTep {
  return {
    async ghi(khoa, duLieu, mime) {
      const { getStore } = await import('@netlify/blobs');
      /* Kiểu của @netlify/blobs 11.1.0 chỉ nhận string | ArrayBuffer | Blob — đưa đúng một ArrayBuffer vừa khít nội dung. */
      await getStore(tenKhoTep()).set(khoa, new Uint8Array(duLieu).buffer, { metadata: { mime } });
    },
    async doc(khoa) {
      const { getStore } = await import('@netlify/blobs');
      const ab = await getStore(tenKhoTep()).get(khoa, { type: 'arrayBuffer' });
      return ab ? Buffer.from(ab) : null;
    },
    async xoa(khoa) {
      const { getStore } = await import('@netlify/blobs');
      await getStore(tenKhoTep()).delete(khoa);
    },
  };
}

let khoKiemThu: KhoTep | null = null;
export function datKhoTepChoKiemThu(k: KhoTep | null) { khoKiemThu = k; }

let khoODiaMacDinh: KhoTep | null = null;
export function khoTepHienTai(thuMucODia?: string): KhoTep {
  if (khoKiemThu) return khoKiemThu;
  if (laBanChinh()) return khoTepNetlify();
  if (!khoODiaMacDinh) khoODiaMacDinh = khoTepODia(thuMucODia ?? path.resolve('data', 'uploads'));
  return khoODiaMacDinh;
}

/*
 * VIỆC NỀN CỦA KHO TỆP. Xoá tệp sau giao dịch (`xoaTepSauGiaoDich`) không được `await` vì nơi gọi là hàm đồng bộ. Trên
 * Netlify, tiến trình bị ĐÓNG BĂNG ngay khi trả lời xong — lời hứa chưa xong sẽ không bao giờ chạy, tệp nằm lại trong kho.
 * Nên ghi các lời hứa vào đây, và `netlify/functions/api.ts` chờ hết trước khi trả lời. Máy dev (ổ đĩa) xoá xong tức thì.
 */
const viecNen = new Set<Promise<unknown>>();
export function ghiNhanViecNenKhoTep(p: Promise<unknown>): void {
  viecNen.add(p);
  void p.finally(() => viecNen.delete(p));
}
export async function choViecNenKhoTep(): Promise<void> {
  while (viecNen.size) await Promise.allSettled([...viecNen]);
}
