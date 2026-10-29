import { db, tx } from '../db.ts';
import { conflict, notFound, nowIso } from '../util.ts';
import { writeAudit } from './audit.ts';
import { xoaTepSauGiaoDich } from './attachments.ts';

/**
 * THÙNG RÁC (Q-RL2, chủ SP 29/10 N24 ② — "không khoá cứng": Hoàn tác ngắn + khôi phục được + lịch sử).
 * Xoá vẫn xoá như cũ (mọi câu đọc không đổi), nhưng TRONG CÙNG giao dịch, ngay trước mỗi câu xoá / đặt NULL, `BoChup` chụp nguyên các dòng sắp mất
 * (cả dòng con bị `ON DELETE CASCADE` / `SET NULL` kéo theo) vào `thung_rac.du_lieu`. Khôi phục chèn lại đúng id theo thứ tự ngược (cha trước con),
 * trả lại cột đã NULL và dòng đã sửa. Trùng id (dòng mới đã chiếm chỗ) hoặc thiếu cha (mục cha đã bị xoá) → báo lý do, không khôi phục nửa chừng.
 * Tệp trong kho giữ `GIU_NGAY` ngày rồi `donThungRac` (cron) xoá hẳn.
 */
export const GIU_NGAY = 30;
export type LoaiRac = 'case' | 'pa' | 'vi_pham' | 'tep';

type Ban =
  | { k: 'xoa'; bang: string; dong: Record<string, unknown>[] }
  | { k: 'null'; bang: string; cot: string[]; dong: Record<string, unknown>[] }
  | { k: 'sua'; bang: string; dong: Record<string, unknown>[] };
export type DuLieuRac = { ban: Ban[]; tep: string[] };

/** Khoá ngoại theo bảng cha: con nào bị CASCADE / SET NULL khi xoá dòng cha (đọc từ lược đồ, nhớ theo kết nối). */
type Fk = { con: string; tu: string; den: string; khi: string };
const fkTheoKetNoi = new WeakMap<object, Map<string, Fk[]>>();
function fkCua(conn: any, cha: string): Fk[] {
  let m = fkTheoKetNoi.get(conn);
  if (!m) {
    m = new Map();
    for (const r of conn.prepare(`SELECT m.name AS con, p."table" AS cha, p."from" AS tu, p."to" AS den, p.on_delete AS khi
        FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) p WHERE m.type = 'table'`).all() as any[]) {
      if (r.khi !== 'CASCADE' && r.khi !== 'SET NULL') continue;
      m.set(r.cha, [...(m.get(r.cha) ?? []), { con: r.con, tu: r.tu, den: r.den ?? 'id', khi: r.khi }]);
    }
    fkTheoKetNoi.set(conn, m);
  }
  return m.get(cha) ?? [];
}

export class BoChup {
  ban: Ban[] = [];
  tep: string[] = [];
  constructor(private conn: any) {}

  /** Chụp các dòng `bang WHERE dieuKien` SẮP bị xoá (và con CASCADE / SET NULL của chúng) — không xoá. */
  chupXoa(bang: string, dieuKien: string, ...args: unknown[]): void {
    const dong = this.conn.prepare(`SELECT * FROM ${bang} WHERE ${dieuKien}`).all(...args) as Record<string, unknown>[];
    if (!dong.length) return;
    /* Con trước cha trong danh sách → khôi phục (đọc ngược) chèn cha trước con. */
    for (const fk of fkCua(this.conn, bang)) {
      const khoa = [...new Set(dong.map((d) => d[fk.den]).filter((v) => v != null))];
      if (!khoa.length) continue;
      const ph = khoa.map(() => '?').join(',');
      if (fk.khi === 'CASCADE') this.chupXoa(fk.con, `${fk.tu} IN (${ph})`, ...khoa);
      else this.chupNull(fk.con, [fk.tu], `${fk.tu} IN (${ph})`, ...khoa);
    }
    this.ban.push({ k: 'xoa', bang, dong });
  }
  /** Chụp giá trị cũ của các cột sắp bị đặt NULL. */
  chupNull(bang: string, cot: string[], dieuKien: string, ...args: unknown[]): void {
    const dong = this.conn.prepare(`SELECT rowid AS __r, ${cot.join(', ')} FROM ${bang} WHERE ${dieuKien}`).all(...args) as Record<string, unknown>[];
    if (dong.length) this.ban.push({ k: 'null', bang, cot, dong });
  }
  /** Chụp NGUYÊN dòng sắp bị sửa bởi bước đi kèm (thẻ Chờ duyệt tự đóng, trạng thái Case…) — khôi phục ghi lại y nguyên. */
  chupSua(bang: string, dieuKien: string, ...args: unknown[]): void {
    const dong = this.conn.prepare(`SELECT rowid AS __r, * FROM ${bang} WHERE ${dieuKien}`).all(...args) as Record<string, unknown>[];
    if (dong.length) this.ban.push({ k: 'sua', bang, dong });
  }
  /**
   * Chạy MỘT câu `DELETE FROM b WHERE …` hoặc `UPDATE b SET c = NULL[, d = NULL] WHERE …` (bộ câu xoá sẵn có) — chụp trước rồi chạy.
   * Tham số dạng `?1` dùng lại được trong câu chụp (cùng câu WHERE).
   */
  chay(sql: string, ...args: unknown[]): void {
    const x = /^\s*DELETE FROM (\w+) WHERE ([\s\S]+)$/i.exec(sql);
    if (x) this.chupXoa(x[1], x[2], ...args);
    else {
      const u = /^\s*UPDATE (\w+) SET ([\s\S]+?) WHERE ([\s\S]+)$/i.exec(sql);
      const cot = u?.[2].split(',').map((s) => /^\s*(\w+)\s*=\s*NULL\s*$/i.exec(s)?.[1]);
      if (!u || !cot || cot.some((c) => !c)) throw new Error(`BoChup: câu không hỗ trợ — ${sql}`);
      this.chupNull(u[1], cot as string[], u[3], ...args);
    }
    this.conn.prepare(sql).run(...args);
  }
}

/** Ghi mục thùng rác (trong giao dịch của thao tác xoá). Trả id để web Hoàn tác. */
export function ghiThungRac(conn: any, o: {
  loai: LoaiRac; doiTuongId: number; nhan: string; hocVienId?: number | null; classId?: number | null; branchId?: number | null;
  nguoi: number | null; chup: BoChup;
}): number {
  return Number(conn.prepare(`INSERT INTO thung_rac (loai, doi_tuong_id, nhan, hoc_vien_id, class_id, branch_id, du_lieu, xoa_boi, xoa_luc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(o.loai, o.doiTuongId, o.nhan, o.hocVienId ?? null, o.classId ?? null, o.branchId ?? null,
    JSON.stringify({ ban: o.chup.ban, tep: o.chup.tep } satisfies DuLieuRac), o.nguoi, nowIso()).lastInsertRowid);
}

/** Chèn / trả lại các bản chụp theo thứ tự ngược. Lỗi ràng buộc → câu tiếng Việt có lý do + bước tiếp (giao dịch của nơi gọi lui hết). */
function traLai(conn: any, ban: Ban[]): void {
  for (const b of [...ban].reverse()) {
    for (const d of b.dong) {
      try {
        if (b.k === 'xoa') {
          const cot = Object.keys(d);
          conn.prepare(`INSERT INTO ${b.bang} (${cot.join(', ')}) VALUES (${cot.map(() => '?').join(', ')})`).run(...cot.map((c) => d[c]));
        } else {
          const cot = (b.k === 'null' ? b.cot : Object.keys(d)).filter((c) => c !== '__r');
          conn.prepare(`UPDATE ${b.bang} SET ${cot.map((c) => `${c} = ?`).join(', ')} WHERE rowid = ?`).run(...cot.map((c) => d[c]), d.__r);
        }
      } catch (e: any) {
        const m = String(e?.message ?? e);
        if (/UNIQUE|PRIMARY KEY/i.test(m)) throw conflict(`Không khôi phục được: đã có dữ liệu mới dùng lại chỗ của mục này (${b.bang}). Tạo lại bằng tay nếu cần.`);
        if (/FOREIGN KEY/i.test(m)) throw conflict('Không khôi phục được: mục gốc của nó đã không còn (vd Case hoặc học viên đã bị xoá) — khôi phục mục gốc trước.');
        throw e;
      }
    }
  }
}

export type MucRac = { id: number; loai: LoaiRac; doi_tuong_id: number; nhan: string; hoc_vien_id: number | null; class_id: number | null;
  branch_id: number | null; du_lieu: string; xoa_boi: number | null; xoa_luc: string; khoi_phuc_luc: string | null; het_han_luc: string | null };
export function docMucRac(id: number): MucRac {
  const m = db().prepare('SELECT * FROM thung_rac WHERE id = ?').get(id) as MucRac | undefined;
  if (!m) throw notFound('Không tìm thấy mục đã xoá.');
  return m;
}

/**
 * KHÔI PHỤC một mục (nơi gọi đã kiểm quyền như thao tác gốc). `sau` chạy trong cùng giao dịch để đồng bộ lại (trạng thái Case, hạn xử lý…).
 * Đã khôi phục / đã hết hạn → 409.
 */
export function khoiPhucMuc(nguoi: number, m: MucRac, sau?: (conn: any) => void): void {
  const conn = db();
  tx(() => {
    const hienTai = conn.prepare('SELECT khoi_phuc_luc, het_han_luc FROM thung_rac WHERE id = ?').get(m.id) as any;
    if (hienTai?.khoi_phuc_luc) throw conflict('Mục này đã được khôi phục.');
    if (hienTai?.het_han_luc) throw conflict(`Mục này đã quá ${GIU_NGAY} ngày và đã xoá hẳn — không khôi phục được.`);
    traLai(conn, (JSON.parse(m.du_lieu) as DuLieuRac).ban);
    sau?.(conn);
    conn.prepare('UPDATE thung_rac SET khoi_phuc_boi = ?, khoi_phuc_luc = ? WHERE id = ?').run(nguoi, nowIso(), m.id);
    writeAudit({ actorUserId: nguoi, action: `${m.loai}.restore`, entityType: m.loai, entityId: m.doi_tuong_id, entityLabel: m.nhan,
      before: null, after: { thungRacId: m.id } });
  });
}

/**
 * Cron: mục quá `GIU_NGAY` ngày chưa khôi phục → xoá tệp trong kho (khi không dòng nào còn dùng) + bỏ bản chụp (giữ dòng mục để lịch sử).
 * Trả số mục đã dọn.
 */
export function donThungRac(homNayIso = nowIso()): number {
  const conn = db();
  const moc = new Date(Date.parse(homNayIso) - GIU_NGAY * 86_400_000).toISOString();
  const ds = conn.prepare(`SELECT id, du_lieu FROM thung_rac WHERE khoi_phuc_luc IS NULL AND het_han_luc IS NULL AND xoa_luc < ?`).all(moc) as any[];
  for (const m of ds) {
    const tep = (JSON.parse(m.du_lieu) as DuLieuRac).tep ?? [];
    conn.prepare(`UPDATE thung_rac SET het_han_luc = ?, du_lieu = '{"ban":[],"tep":[]}' WHERE id = ?`).run(nowIso(), m.id);
    if (tep.length) xoaTepSauGiaoDich(tep);   // chỉ xoá tệp không còn dòng `attachments` nào dùng
  }
  return ds.length;
}
