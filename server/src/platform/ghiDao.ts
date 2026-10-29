import { db } from '../db.ts';
import { conflict, nowIso } from '../util.ts';

/**
 * GHI ĐỂ ĐẢO (Q-RL2c, N24 ② "không khoá cứng") — thao tác ĐỔI TRẠNG THÁI (Kết thúc PA, Bỏ việc Báo PH / Phối hợp SOS, Duyệt / Từ chối ở Chờ duyệt)
 * chụp các dòng nó SỬA (trước + sau) và các dòng nó THÊM (sau) vào `ghi_dao` cùng giao dịch. Đảo = trả dòng sửa về "trước", xoá dòng thêm — CHỈ khi
 * mọi dòng hiện tại còn y như "sau" (không ai đổi tiếp, không id bị dùng lại); khác / mất → 409 nói rõ, không đảo nửa chừng.
 * Quyền kiểm ở nơi gọi, theo bản ghi HIỆN TẠI (như thao tác gốc).
 */
type Dong = Record<string, unknown>;
type Muc = { k: 'sua' | 'tao'; bang: string; truoc: Dong[]; sau: Dong[] };

export class GhiDao {
  muc: Muc[] = [];
  constructor(private conn: any) {}
  /** Chụp NGUYÊN dòng sắp bị sửa (gọi TRƯỚC thao tác). */
  sua(bang: string, dieuKien: string, ...args: unknown[]): void {
    const truoc = this.conn.prepare(`SELECT rowid AS __r, * FROM ${bang} WHERE ${dieuKien}`).all(...args) as Dong[];
    if (truoc.length) this.muc.push({ k: 'sua', bang, truoc, sau: [] });
  }
  /** Chạy `fn`; dòng MỚI xuất hiện trong `bang WHERE dieuKien` ghi là "thêm" (đảo xoá đi). */
  theoDoi<T>(bang: string, dieuKien: string, args: unknown[], fn: () => T): T {
    const co = new Set((this.conn.prepare(`SELECT rowid AS r FROM ${bang} WHERE ${dieuKien}`).all(...args) as any[]).map((x) => x.r));
    const kq = fn();
    const moi = (this.conn.prepare(`SELECT rowid AS __r FROM ${bang} WHERE ${dieuKien}`).all(...args) as Dong[]).filter((x) => !co.has(x.__r));
    if (moi.length) this.muc.push({ k: 'tao', bang, truoc: moi, sau: [] });
    return kq;
  }
  /** Chụp trạng thái SAU thao tác của mọi dòng đã ghi (gọi SAU thao tác, trước khi lưu). */
  chot(): void {
    /* PC-GV-A: một câu mỗi mục (lô ≤ 500 rowid) thay vì một câu mỗi dòng — lưu phân công nhiều lớp chụp hàng chục dòng. */
    for (const m of this.muc) {
      const co = new Map<unknown, Dong>();
      for (let i = 0; i < m.truoc.length; i += 500) {
        const lo = m.truoc.slice(i, i + 500).map((d) => d.__r);
        for (const r of this.conn.prepare(`SELECT rowid AS __r, * FROM ${m.bang} WHERE rowid IN (${lo.map(() => '?').join(',')})`).all(...lo) as Dong[]) co.set(r.__r, r);
      }
      m.sau = m.truoc.map((d) => co.get(d.__r) ?? { __r: d.__r, __mat: 1 });
    }
  }
  /** PC-GV-A: bỏ dòng "sửa" của `bang` mà thao tác KHÔNG đổi (chụp rộng trước khi biết dòng nào bị ghi) — Hoàn tác không bị chặn bởi dòng không liên quan. */
  boKhongDoi(bang: string): void {
    for (const m of this.muc) {
      if (m.k !== 'sua' || m.bang !== bang) continue;
      m.truoc = m.truoc.filter((d) => JSON.stringify(d) !== JSON.stringify(this.conn.prepare(`SELECT rowid AS __r, * FROM ${bang} WHERE rowid = ?`).get(d.__r)));
    }
    this.muc = this.muc.filter((m) => m.truoc.length);
  }
  /** Có ghi gì không (thao tác không đổi dòng nào thì khỏi lưu). */
  get rong() { return !this.muc.length; }
}

/** Lưu một bản ghi đảo (cùng giao dịch, NGAY SAU thao tác — tự chụp trạng thái sau). Trả id. */
export function luuGhiDao(conn: any, o: { loai: string; bang: string; id: number; nguoi: number | null; ghi: GhiDao }): number {
  o.ghi.chot();
  return Number(conn.prepare(`INSERT INTO ghi_dao (loai, bang, doi_tuong_id, du_lieu, nguoi, luc) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(o.loai, o.bang, o.id, JSON.stringify(o.ghi.muc), o.nguoi, nowIso()).lastInsertRowid);
}

export type BanGhiDao = { id: number; loai: string; bang: string; doi_tuong_id: number; du_lieu: string; nguoi: number | null; luc: string; dao_luc: string | null };
/** Bản ghi đảo MỚI NHẤT chưa đảo của một đối tượng + loại thao tác (null = không có). */
export function timGhiDao(conn: any, loai: string, bang: string, id: number): BanGhiDao | null {
  return (conn.prepare(`SELECT * FROM ghi_dao WHERE loai = ? AND bang = ? AND doi_tuong_id = ? AND dao_luc IS NULL ORDER BY id DESC LIMIT 1`)
    .get(loai, bang, id) as BanGhiDao | undefined) ?? null;
}

/** Cột thay đổi mà KHÔNG phải thay đổi nghiệp vụ — bỏ qua khi so "còn đúng sau": người nhận đọc chuông (`read_at`) không chặn Hoàn tác. */
const BO_QUA: Record<string, readonly string[]> = { notifications: ['read_at'] };
const boQua = (bang: string, d: Dong | undefined): Dong | undefined => {
  const cot = BO_QUA[bang];
  if (!d || !cot) return d;
  const x = { ...d };
  for (const c of cot) delete x[c];
  return x;
};
const KHAC = (bang: string) => `Không hoàn tác được: đã có thay đổi sau thao tác này (${bang}) — sửa trực tiếp ở màn đó.`;
const giongNhau = (a: Dong | undefined, b: Dong) => !!a && JSON.stringify(a) === JSON.stringify(b);

/**
 * ĐẢO một bản ghi (trong giao dịch của nơi gọi). Mọi dòng hiện tại phải còn đúng "sau" — kiểm HẾT trước khi ghi gì; rồi xoá dòng thêm, trả dòng sửa.
 * Mỗi câu ghi phải đổi đúng một dòng (changes = 0 → 409). Đánh dấu bản ghi đã đảo.
 */
export function daoLai(conn: any, g: BanGhiDao, nguoi: number): void {
  if (g.dao_luc) throw conflict('Thao tác này đã được hoàn tác.');
  const muc = JSON.parse(g.du_lieu) as Muc[];
  for (const m of muc) for (const s of m.sau) {
    if (s.__mat) throw conflict(KHAC(m.bang));   // dòng đã mất ngay lúc chốt (không đảo được)
    const hienTai = conn.prepare(`SELECT rowid AS __r, * FROM ${m.bang} WHERE rowid = ?`).get(s.__r) as Dong | undefined;
    if (!giongNhau(boQua(m.bang, hienTai), boQua(m.bang, s)!)) throw conflict(KHAC(m.bang));
  }
  for (const m of [...muc].reverse()) {
    for (const d of m.truoc) {
      if (m.k === 'tao') {
        if (!conn.prepare(`DELETE FROM ${m.bang} WHERE rowid = ?`).run(d.__r).changes) throw conflict(KHAC(m.bang));
      } else {
        const cot = Object.keys(d).filter((c) => c !== '__r');
        if (!conn.prepare(`UPDATE ${m.bang} SET ${cot.map((c) => `${c} = ?`).join(', ')} WHERE rowid = ?`).run(...cot.map((c) => d[c]), d.__r).changes) {
          throw conflict(KHAC(m.bang));
        }
      }
    }
  }
  conn.prepare('UPDATE ghi_dao SET dao_luc = ?, dao_boi = ? WHERE id = ? AND dao_luc IS NULL').run(nowIso(), nguoi, g.id);
}

/** Có thể đảo không (để web hiện nút): còn bản ghi + mọi dòng còn đúng "sau". Không ném. */
export function daoDuoc(g: BanGhiDao | null): boolean {
  if (!g || g.dao_luc) return false;
  const conn = db();
  return (JSON.parse(g.du_lieu) as Muc[]).every((m) => m.sau.every((s) => !s.__mat
    && giongNhau(boQua(m.bang, conn.prepare(`SELECT rowid AS __r, * FROM ${m.bang} WHERE rowid = ?`).get(s.__r) as Dong | undefined), boQua(m.bang, s)!)));
}

/** Giữ bản ghi đảo `GIU_NGAY_DAO` ngày (như thùng rác) — cron thứ Hai xoá bản ghi cũ hơn (đã đảo hay chưa); Huỷ quyết định vốn chỉ trong ngày. */
export const GIU_NGAY_DAO = 30;
export function donGhiDao(homNayIso = nowIso()): number {
  const moc = new Date(Date.parse(homNayIso) - GIU_NGAY_DAO * 86_400_000).toISOString();
  return db().prepare('DELETE FROM ghi_dao WHERE luc < ?').run(moc).changes as number;
}
