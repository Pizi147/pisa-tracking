/**
 * KHÔI PHỤC (PR-Z2) — chép một bản sao lưu (.sqlite của `npm run sao-luu`) vào một database RỖNG (thường là database
 * Turso MỚI TẠO). Điểm chạy lệnh: `runKhoiPhuc.ts`. Hướng dẫn: TRIEN_KHAI.md mục 11.2.
 *
 * AN TOÀN DỮ LIỆU:
 *   1. Đích có BẤT KỲ dòng nào → từ chối (đúng chốt `bangCoDuLieu` của init-ban-chinh). Đích có bảng (kể cả rỗng) → từ chối:
 *      cấu trúc lấy từ CHÍNH bản sao lưu, nên đích phải hoàn toàn trống. Không có đường nào ghi vào database đã có dữ liệu.
 *   2. Bản sao lưu phải toàn vẹn và có người dùng. File sao lưu chỉ được ĐỌC.
 *   3. Mọi thứ trong MỘT giao dịch: tạo bảng → chép dữ liệu theo thứ tự khoá ngoại (cha trước con) → chỉ mục/trigger →
 *      kiểm số dòng từng bảng + kiểm khoá ngoại → mới chốt. Hỏng ở bất kỳ đâu → cuộn lại, đích vẫn trống.
 * Khoá ngoại TẮT trong lúc chép (5 bảng tự tham chiếu — `users`, `classes`… — có dòng trỏ tới dòng tạo sau), rồi KIỂM LẠI
 * bằng `PRAGMA foreign_key_check` trước khi chốt: bản khôi phục có thêm vi phạm nào so với bản sao lưu là cuộn lại.
 */
import { bangCoDuLieu } from './initBanChinh.ts';
import { BANG_KHONG_CHEP_DONG, KHONG_NOI_BO, chenDong, demDong, docBang, docCauTruc, tenSql } from './saoLuu.ts';

/**
 * Thứ tự chép: bảng cha trước bảng con theo khoá ngoại. Bỏ qua tự tham chiếu; gặp vòng khoá ngoại thì lấy bảng đầu tiên còn
 * lại (khoá ngoại tắt trong lúc chép và được kiểm lại trước khi chốt, nên vòng không làm hỏng khôi phục). Chỉ đọc.
 */
export function thuTuKhoaNgoai(nguon: any, bang: string[]): string[] {
  const thuong = (s: string) => s.toLowerCase();
  const tap = new Set(bang.map(thuong));
  const cha = new Map(bang.map((b) => [b, new Set(
    (nguon.prepare(`PRAGMA foreign_key_list(${tenSql(b)})`).all() as { table: string }[])
      .map((k) => thuong(k.table)).filter((t) => t !== thuong(b) && tap.has(t)),
  )]));
  const ra: string[] = [];
  const daXong = new Set<string>();
  while (ra.length < bang.length) {
    const san = bang.filter((b) => !daXong.has(thuong(b)) && [...cha.get(b)!].every((c) => daXong.has(c)));
    for (const b of san.length ? san : [bang.find((x) => !daXong.has(thuong(x)))!]) {
      ra.push(b);
      daXong.add(thuong(b));
    }
  }
  return ra;
}

export function khoiPhuc(nguon: any, dich: any, o: { moiLan?: number } = {}): { bang: number; dong: number } {
  /* 1. Đích hoàn toàn trống — kiểm TRƯỚC mọi thứ. */
  const coDuLieu = bangCoDuLieu(dich);
  if (coDuLieu) throw new Error(`Database đích đã có dữ liệu (bảng ${coDuLieu}) — khoi-phuc chỉ ghi vào database RỖNG. Không làm gì cả.`);
  const coBang = dich.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND ${KHONG_NOI_BO} LIMIT 1`).get() as { name: string } | undefined;
  if (coBang) throw new Error(`Database đích đã có bảng (${coBang.name}) — khoi-phuc cần một database MỚI TẠO, hoàn toàn trống. Không làm gì cả.`);

  /* 2. Bản sao lưu dùng được. */
  const toanVen = (nguon.prepare('PRAGMA integrity_check').get() as { integrity_check?: string } | undefined)?.integrity_check;
  if (toanVen !== 'ok') throw new Error(`File sao lưu hỏng (integrity_check: ${toanVen}). Không làm gì cả.`);
  const coUsers = !!nguon.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  if (!(coUsers && demDong(nguon, 'users') > 0)) throw new Error('File không phải bản sao lưu dùng được: không có người dùng nào. Không làm gì cả.');
  const { bang, conLai } = docCauTruc(nguon);
  const thuTu = thuTuKhoaNgoai(nguon, bang.map((b) => b.name));
  const viPhamNguon = (nguon.prepare('PRAGMA foreign_key_check').all() as unknown[]).length;

  /* 3. Một giao dịch. `foreign_keys` không đổi được bên trong giao dịch — đặt trước, trả lại sau. */
  dich.pragma('foreign_keys = OFF');
  try {
    return dich.transaction(() => {
      for (const b of bang) dich.exec(b.sql);
      let dong = 0;
      for (const ten of thuTu) {
        /* Bảng mã đăng nhập: không bao giờ khôi phục dòng nào, kể cả từ bản sao lưu kiểu cũ còn chứa phiên. */
        const d = BANG_KHONG_CHEP_DONG.has(ten) ? { cot: [], dong: [] } : docBang(nguon, ten);
        chenDong(dich, ten, d.cot, d.dong, o.moiLan ?? 100);
        const daGhi = demDong(dich, ten);
        if (daGhi !== d.dong.length) throw new Error(`Bảng ${ten}: bản sao lưu có ${d.dong.length} dòng nhưng đã ghi ${daGhi}.`);
        dong += d.dong.length;
      }
      for (const x of conLai) dich.exec(x.sql);
      const viPham = (dich.prepare('PRAGMA foreign_key_check').all() as unknown[]).length;
      if (viPham > viPhamNguon) throw new Error(`Bản khôi phục có ${viPham} vi phạm khoá ngoại (bản sao lưu có ${viPhamNguon}) — cuộn lại.`);
      return { bang: bang.length, dong };
    })();
  } finally {
    dich.pragma('foreign_keys = ON');
  }
}
