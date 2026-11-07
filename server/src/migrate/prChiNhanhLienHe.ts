/**
 * CHI-NHANH-LIEN-HE (chủ SP 07/11 — Báo cáo PH xuất PDF): cột `branches.dia_chi`, `branches.so_dien_thoai` (đầu tệp báo cáo gửi phụ huynh).
 * Điền mặc định theo mã chi nhánh khi ô còn NULL (chủ SP chọn 07/11; SĐT cơ sở khác để trống cho chủ SP điền ở Quản trị › Chi nhánh).
 * Chạy lặp được: cột có rồi thì không thêm; chỉ điền ô NULL → không đè giá trị đã sửa (kể cả đã xoá trắng = '').
 */
const MAC_DINH: Record<string, { diaChi: string; sdt?: string }> = {
  MB: { diaChi: 'A2-16-17 KĐT Monbay, Hạ Long, Quảng Ninh' },
  CP: { diaChi: 'Số 48 Tô Hiệu, Cẩm Phả, Quảng Ninh', sdt: '082.228.9288' },
  BC: { diaChi: 'B1-02-03 KĐT Hạ Long Marina, Bãi Cháy, Quảng Ninh' },
  UB: { diaChi: 'Việt Phúc Plaza, Số 412, Uông Bí, Quảng Ninh' },
  HD: { diaChi: 'Kiot 28 chợ Phú Yên, Số 5 Ngân Sơn, Lê Thanh Nghị, Hải Phòng' },
};

/** Điền mặc định vào ô NULL — dùng chung cho migrate và seed. Trả số ô đã điền. */
export function dienLienHeChiNhanh(conn: any): number {
  let n = 0;
  for (const [code, v] of Object.entries(MAC_DINH)) {
    n += conn.prepare('UPDATE branches SET dia_chi = ? WHERE code = ? AND dia_chi IS NULL').run(v.diaChi, code).changes;
    if (v.sdt) n += conn.prepare('UPDATE branches SET so_dien_thoai = ? WHERE code = ? AND so_dien_thoai IS NULL').run(v.sdt, code).changes;
  }
  return n;
}

export function migratePrChiNhanhLienHe(conn: any, applied: string[]) {
  const cot = new Set((conn.prepare(`SELECT name FROM pragma_table_info('branches')`).all() as any[]).map((c) => c.name));
  const them = ['dia_chi', 'so_dien_thoai'].filter((c) => !cot.has(c));
  for (const c of them) conn.exec(`ALTER TABLE branches ADD COLUMN ${c} TEXT`);
  /* Chỉ điền khi vừa thêm cột: ô NULL về sau là ý của Quản trị (chưa nhập), không điền lại mỗi lần chạy. */
  const n = them.length ? dienLienHeChiNhanh(conn) : 0;
  if (them.length) applied.push(`CHI-NHANH-LIEN-HE: cột branches.${them.join(', branches.')}${n ? `, điền ${n} ô mặc định theo mã chi nhánh` : ''}.`);
}
