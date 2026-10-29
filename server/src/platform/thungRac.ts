import { db, tx } from '../db.ts';
import { conflict, notFound, nowIso } from '../util.ts';
import { writeAudit } from './audit.ts';
import { xoaTepSauGiaoDich } from './attachments.ts';

/**
 * THÙNG RÁC (Q-RL2, chủ SP 29/10 N24 ② — "không khoá cứng": Hoàn tác ngắn + khôi phục được + lịch sử).
 * Xoá vẫn xoá như cũ (mọi câu đọc không đổi), nhưng TRONG CÙNG giao dịch `BoChup` chụp nguyên các dòng sắp mất (cả dòng con bị `ON DELETE CASCADE` /
 * `SET NULL` kéo theo), cột sắp bị NULL, dòng sắp bị sửa (thẻ Chờ duyệt tự đóng, chuông) và dòng mới sinh ra (chuông "Tự đóng") vào `thung_rac.du_lieu`.
 * Khôi phục chèn lại theo thứ tự ngược (cha trước con): id cũ còn trống thì giữ, đã có dòng mới dùng (SQLite cấp lại id lớn nhất) thì cấp id MỚI và
 * ánh xạ mọi khoá trỏ tới nó — khoá ngoại thật lẫn liên kết mềm (tệp, chuông, Hành trình, thẻ Chờ duyệt). Bản ghi CHA ngoài thùng rác (Case của PA,
 * học viên của vi phạm, chủ của tệp) mang dấu nhận diện lúc xoá; khôi phục so lại — khác (id đã thuộc bản ghi khác) / mất → 409, không gắn nhầm.
 * Tệp trong kho giữ `GIU_NGAY` ngày rồi `donThungRac` (cron) xoá hẳn.
 */
export const GIU_NGAY = 30;
export type LoaiRac = 'case' | 'pa' | 'vi_pham' | 'tep';

type Dong = Record<string, unknown>;
type Ban =
  | { k: 'xoa'; bang: string; dong: Dong[] }
  | { k: 'null'; bang: string; cot: string[]; dong: Dong[] }
  | { k: 'sua'; bang: string; dong: Dong[] }
  | { k: 'tao'; bang: string; dong: Dong[] };
/** Bản ghi cha NGOÀI thùng rác mà mục trỏ tới — dấu = cột nhận diện lúc xoá (`created_at`, `student_id`). */
export type Goc = { bang: string; id: number; dau: string };
export type DuLieuRac = { ban: Ban[]; tep: string[]; goc?: Goc[] };

// ---------------------------------------------------------------- lược đồ (nhớ theo kết nối)
type Fk = { con: string; cot: string; cha: string; den: string; khi: string };
const fkTheoKetNoi = new WeakMap<object, Fk[]>();
function moiFk(conn: any): Fk[] {
  let ds = fkTheoKetNoi.get(conn);
  if (!ds) {
    ds = (conn.prepare(`SELECT m.name AS con, p."from" AS cot, p."table" AS cha, p."to" AS den, p.on_delete AS khi
        FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) p WHERE m.type = 'table'`).all() as any[])
      .map((r) => ({ con: r.con, cot: r.cot, cha: r.cha, den: r.den ?? 'id', khi: r.khi }));
    fkTheoKetNoi.set(conn, ds);
  }
  return ds;
}
/** Con bị kéo theo khi xoá dòng của `cha` (CASCADE / SET NULL). */
const fkCon = (conn: any, cha: string) => moiFk(conn).filter((f) => f.cha === cha && (f.khi === 'CASCADE' || f.khi === 'SET NULL'));
/** Mọi khoá ngoại của bảng `con` (cột → bảng cha). */
const fkCua = (conn: any, con: string) => moiFk(conn).filter((f) => f.con === con);
const pkTheoKetNoi = new WeakMap<object, Map<string, string | null>>();
/** Cột khoá chính số nguyên đơn (bí danh rowid) của bảng, không có → null (bảng khoá ghép). */
function pkCua(conn: any, bang: string): string | null {
  let m = pkTheoKetNoi.get(conn);
  if (!m) pkTheoKetNoi.set(conn, m = new Map());
  if (!m.has(bang)) {
    const pk = (conn.prepare('SELECT name, type FROM pragma_table_info(?) WHERE pk > 0').all(bang) as any[]);
    m.set(bang, pk.length === 1 && /^INTEGER$/i.test(pk[0].type) ? pk[0].name : null);
  }
  return m.get(bang)!;
}

/** Liên kết mềm (không FK): cột loại → bảng đích. Giá trị lạ → không ánh xạ. */
const LOAI_BANG: Record<string, string> = {
  sos_case: 'sos_cases', case_intervention: 'case_interventions', intervention: 'case_interventions', violation: 'violations',
  discipline_measure: 'discipline_measures', sos_coordination_action: 'sos_coordination_actions', assessment_attempt: 'assessment_attempts',
  attempt: 'assessment_attempts', student: 'students', case_signal: 'case_signals', skill_move_requests: 'skill_move_requests', yeu_cau_duyet: 'yeu_cau_duyet',
};
const MEM: Record<string, { loai: string; id: string; bang: (v: unknown) => string | null }> = {
  attachments: { loai: 'owner_type', id: 'owner_id', bang: (v) => LOAI_BANG[String(v)] ?? null },
  notifications: { loai: 'entity_type', id: 'entity_id', bang: (v) => LOAI_BANG[String(v)] ?? null },
  journey_events: { loai: 'ref_table', id: 'ref_id', bang: (v) => (typeof v === 'string' ? v : null) },
  yeu_cau_duyet: { loai: 'doi_tuong_loai', id: 'doi_tuong_id', bang: (v) => LOAI_BANG[String(v)] ?? null },
};
/** Bảng đích của liên kết mềm từ `owner_type` (tệp) — dùng ở khôi phục tệp / quyền. */
export const bangCuaLoai = (loai: string): string | null => LOAI_BANG[loai] ?? null;

export class BoChup {
  ban: Ban[] = [];
  tep: string[] = [];
  goc: Goc[] = [];
  constructor(private conn: any) {}

  /** Chụp các dòng `bang WHERE dieuKien` SẮP bị xoá (và con CASCADE / SET NULL của chúng) — không xoá. */
  chupXoa(bang: string, dieuKien: string, ...args: unknown[]): void {
    const dong = this.conn.prepare(`SELECT * FROM ${bang} WHERE ${dieuKien}`).all(...args) as Dong[];
    if (!dong.length) return;
    /* Con trước cha trong danh sách → khôi phục (đọc ngược) chèn cha trước con. */
    for (const fk of fkCon(this.conn, bang)) {
      const khoa = [...new Set(dong.map((d) => d[fk.den]).filter((v) => v != null))];
      if (!khoa.length) continue;
      const ph = khoa.map(() => '?').join(',');
      if (fk.khi === 'CASCADE') this.chupXoa(fk.con, `${fk.cot} IN (${ph})`, ...khoa);
      else this.chupNull(fk.con, [fk.cot], `${fk.cot} IN (${ph})`, ...khoa);
    }
    this.ban.push({ k: 'xoa', bang, dong });
  }
  /** Chụp giá trị cũ của các cột sắp bị đặt NULL. */
  chupNull(bang: string, cot: string[], dieuKien: string, ...args: unknown[]): void {
    const dong = this.conn.prepare(`SELECT rowid AS __r, ${cot.join(', ')} FROM ${bang} WHERE ${dieuKien}`).all(...args) as Dong[];
    if (dong.length) this.ban.push({ k: 'null', bang, cot, dong });
  }
  /** Chụp NGUYÊN dòng sắp bị sửa bởi bước đi kèm (thẻ Chờ duyệt tự đóng…) — khôi phục ghi lại y nguyên. */
  chupSua(bang: string, dieuKien: string, ...args: unknown[]): void {
    const dong = this.conn.prepare(`SELECT rowid AS __r, * FROM ${bang} WHERE ${dieuKien}`).all(...args) as Dong[];
    if (dong.length) this.ban.push({ k: 'sua', bang, dong });
  }
  /**
   * Bước đi kèm có thể SỬA hoặc THÊM dòng (`chotYeuCau` gửi / đổi chuông "Tự đóng"): chụp dòng đang có (sửa → trả lại), chạy `fn`, dòng mới sinh ra
   * ghi `tao` (khôi phục xoá đi).
   */
  theoDoi(bang: string, dieuKien: string, args: unknown[], fn: () => void): void {
    const truoc = new Set((this.conn.prepare(`SELECT rowid AS r FROM ${bang} WHERE ${dieuKien}`).all(...args) as any[]).map((x) => x.r));
    this.chupSua(bang, dieuKien, ...args);
    fn();
    const moi = (this.conn.prepare(`SELECT rowid AS __r FROM ${bang} WHERE ${dieuKien}`).all(...args) as Dong[]).filter((x) => !truoc.has(x.__r));
    if (moi.length) this.ban.push({ k: 'tao', bang, dong: moi });
  }
  /** Ghi dấu nhận diện bản ghi CHA ngoài thùng rác (khôi phục so lại — id có thể đã thuộc bản ghi khác). */
  ghiGoc(bang: string, id: number | null | undefined): void {
    if (id == null) return;
    const d = dauCua(this.conn, bang, id);
    if (d !== null) this.goc.push({ bang, id, dau: d });
  }
  /**
   * Chạy MỘT câu `DELETE FROM b WHERE …` hoặc `UPDATE b SET c = NULL[, d = NULL] WHERE …` (bộ câu xoá sẵn có) — chụp rồi chạy.
   * Bảng không có con CASCADE / SET NULL: xoá và chụp MỘT câu (`DELETE … RETURNING *` — Xoá học viên ~47 câu, Turso ~50–100 ms / câu, trần hàm 10 s);
   * bảng có con: chụp trước (con bị kéo theo không có trong RETURNING).
   */
  chay(sql: string, ...args: unknown[]): void {
    const x = /^\s*DELETE FROM (\w+) WHERE ([\s\S]+)$/i.exec(sql);
    if (x && !fkCon(this.conn, x[1]).length) {
      const dong = this.conn.prepare(`${sql} RETURNING *`).all(...args) as Dong[];
      if (dong.length) this.ban.push({ k: 'xoa', bang: x[1], dong });
      return;
    }
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

/** Dấu nhận diện một dòng: các cột ít đổi xác định "đúng bản ghi này" (thời điểm tạo + học viên). Không có dòng → null. */
function dauCua(conn: any, bang: string, id: number): string | null {
  const cot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).map((c) => c.name as string)
    .filter((c) => c === 'created_at' || c === 'student_id');
  const r = conn.prepare(`SELECT ${cot.length ? cot.join(', ') : '1 AS co'} FROM ${bang} WHERE ${pkCua(conn, bang) ?? 'rowid'} = ?`).get(id) as Dong | undefined;
  return r ? JSON.stringify(r) : null;
}

/** Ghi mục thùng rác (trong giao dịch của thao tác xoá). Trả id để web Hoàn tác. */
export function ghiThungRac(conn: any, o: {
  loai: LoaiRac; doiTuongId: number; nhan: string; hocVienId?: number | null; classId?: number | null; branchId?: number | null;
  nguoi: number | null; chup: BoChup;
}): number {
  return Number(conn.prepare(`INSERT INTO thung_rac (loai, doi_tuong_id, nhan, hoc_vien_id, class_id, branch_id, du_lieu, xoa_boi, xoa_luc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(o.loai, o.doiTuongId, o.nhan, o.hocVienId ?? null, o.classId ?? null, o.branchId ?? null,
    JSON.stringify({ ban: o.chup.ban, tep: o.chup.tep, goc: o.chup.goc } satisfies DuLieuRac), o.nguoi, nowIso()).lastInsertRowid);
}

/** Bảng lá có khoá chống lặp `dedup_key` — trùng khi khôi phục thì đổi khoá (không 409): dòng lịch sử / chuông, không phải luật nghiệp vụ. */
const LA_DEDUP = new Set(['journey_events', 'notifications']);
const THIEU_GOC = 'Không khôi phục được: mục gốc của nó đã không còn (vd Case hoặc học viên đã bị xoá) — khôi phục mục gốc trước.';
/** Bản ghi cha ngoài thùng rác còn đúng là bản ghi lúc xoá không (id có thể đã thuộc bản ghi khác). */
export function kiemGoc(conn: any, du: DuLieuRac): void {
  for (const g of du.goc ?? []) if (dauCua(conn, g.bang, g.id) !== g.dau) throw conflict(THIEU_GOC);
}

/**
 * Chèn / trả lại các bản chụp theo thứ tự ngược. Id cũ còn trống → giữ; đã có dòng khác → id MỚI + ánh xạ (khoá ngoại + liên kết mềm) cho mọi dòng
 * trả sau, kể cả dòng cùng bảng trỏ nhau (PA `superseded_by` PA mới hơn — sửa ở cuối lượt). Khoá ngoại kiểm ở CUỐI lượt (`defer_foreign_keys`).
 * Dòng cần trả (NULL / sửa) không còn → 409, giao dịch của nơi gọi lui hết. Trả bảng ánh xạ id (cũ → mới).
 */
function traLai(conn: any, ban: Ban[]): Map<string, Map<unknown, unknown>> {
  conn.pragma('defer_foreign_keys = ON');
  const anh = new Map<string, Map<unknown, unknown>>();
  const coTrongRac = new Map<string, Set<unknown>>();
  for (const b of ban) if (b.k === 'xoa') {
    const pk = pkCua(conn, b.bang);
    if (pk) for (const d of b.dong) (coTrongRac.get(b.bang) ?? coTrongRac.set(b.bang, new Set()).get(b.bang)!).add(d[pk]);
  }
  const doi = (bang: string | null, v: unknown) => (bang && anh.get(bang)?.has(v) ? anh.get(bang)!.get(v) : v);
  /** Giá trị trỏ dòng trong rác CHƯA trả (cùng bảng, mới hơn) → sửa ở cuối lượt. */
  const treo: { bang: string; rowid: unknown; cot: string; dich: string; v: unknown }[] = [];
  const doiDong = (bang: string, d: Dong): { dong: Dong; cho: { cot: string; dich: string; v: unknown }[] } => {
    const dong: Dong = { ...d };
    const cho: { cot: string; dich: string; v: unknown }[] = [];
    const xet = (cot: string, dich: string | null) => {
      const v = dong[cot];
      if (v == null || !dich) return;
      if (anh.get(dich)?.has(v)) dong[cot] = anh.get(dich)!.get(v);
      else if (coTrongRac.get(dich)?.has(v)) cho.push({ cot, dich, v });
    };
    for (const fk of fkCua(conn, bang)) if (fk.cot in dong) xet(fk.cot, fk.cha);
    const m = MEM[bang];
    if (m && m.id in dong) xet(m.id, m.bang(dong[m.loai]));
    return { dong, cho };
  };
  const capNhat = (bang: string, cot: string[], d: Dong, rowid: unknown) => {
    const r = conn.prepare(`UPDATE ${bang} SET ${cot.map((c) => `${c} = ?`).join(', ')} WHERE rowid = ?`).run(...cot.map((c) => d[c]), rowid);
    if (!r.changes) throw conflict(`Không khôi phục được: dòng liên quan (${bang}) đã thay đổi hoặc không còn — khôi phục mục liên quan trước.`);
  };

  for (const b of [...ban].reverse()) {
    for (const goc of b.dong) {
      const rowidCu = goc.__r;
      const { __r: _, ...d } = goc;
      if (b.k === 'tao') { conn.prepare(`DELETE FROM ${b.bang} WHERE rowid = ?`).run(doi(b.bang, rowidCu)); continue; }
      const { dong, cho } = doiDong(b.bang, d);
      if (b.k === 'xoa') {
        const pk = pkCua(conn, b.bang);
        if (pk && conn.prepare(`SELECT 1 FROM ${b.bang} WHERE ${pk} = ?`).get(dong[pk])) delete dong[pk];   // id cũ đã có dòng mới → id mới
        const cot = Object.keys(dong);
        const chen = () => conn.prepare(`INSERT INTO ${b.bang} (${cot.join(', ')}) VALUES (${cot.map(() => '?').join(', ')})`).run(...cot.map((c) => dong[c]));
        let r;
        try { r = chen(); } catch (e: any) {
          /* Hành trình / chuông: khoá chống lặp (thường kèm id của bản ghi) đã có dòng mới cùng khoá (bản ghi mới nhận lại id) → giữ dòng cũ với khoá riêng. */
          const trung = /UNIQUE/i.test(String(e?.message));
          if (trung && !(LA_DEDUP.has(b.bang) && typeof dong.dedup_key === 'string')) {
            throw conflict(`Không khôi phục được: đã có dữ liệu mới trùng với mục này (${b.bang} — vd Case đang mở cùng kỹ năng). Xử lý mục mới trước.`);
          }
          if (!trung) throw e;
          dong.dedup_key = `${dong.dedup_key}~kp${Date.now()}`;
          r = chen();
        }
        const rowid = r.lastInsertRowid;
        if (pk) (anh.get(b.bang) ?? anh.set(b.bang, new Map()).get(b.bang)!).set(d[pk], typeof d[pk] === 'bigint' ? rowid : Number(rowid));
        for (const c of cho) treo.push({ bang: b.bang, rowid, ...c });
      } else {
        const cot = b.k === 'null' ? b.cot : Object.keys(dong).filter((c) => c !== pkCua(conn, b.bang));
        const rowid = doi(b.bang, rowidCu);
        capNhat(b.bang, cot, dong, rowid);
        for (const c of cho) treo.push({ bang: b.bang, rowid, ...c });
      }
    }
  }
  for (const t of treo) conn.prepare(`UPDATE ${t.bang} SET ${t.cot} = ? WHERE rowid = ?`).run(doi(t.dich, t.v), t.rowid);
  for (const bang of new Set(ban.map((b) => b.bang))) {
    if ((conn.prepare('SELECT 1 FROM pragma_foreign_key_check(?) LIMIT 1').all(bang) as unknown[]).length) throw conflict(THIEU_GOC);
  }
  return anh;
}

export type MucRac = { id: number; loai: LoaiRac; doi_tuong_id: number; nhan: string; hoc_vien_id: number | null; class_id: number | null;
  branch_id: number | null; du_lieu: string; xoa_boi: number | null; xoa_luc: string; khoi_phuc_luc: string | null; het_han_luc: string | null };
export function docMucRac(id: number): MucRac {
  const m = db().prepare('SELECT * FROM thung_rac WHERE id = ?').get(id) as MucRac | undefined;
  if (!m) throw notFound('Không tìm thấy mục đã xoá.');
  return m;
}

/**
 * KHÔI PHỤC một mục (nơi gọi đã kiểm gốc + quyền). `sau` chạy trong cùng giao dịch để đồng bộ lại (trạng thái Case, hạn xử lý…), nhận bảng ánh xạ id.
 * Đã khôi phục / đã hết hạn → 409. Trả id mới của đối tượng chính (khác id cũ khi id cũ đã có dòng mới dùng).
 */
export function khoiPhucMuc(nguoi: number, m: MucRac, bangChinh: string, sau?: (conn: any, anh: Map<string, Map<unknown, unknown>>) => void): number {
  const conn = db();
  return tx(() => {
    const hienTai = conn.prepare('SELECT khoi_phuc_luc, het_han_luc FROM thung_rac WHERE id = ?').get(m.id) as any;
    if (hienTai?.khoi_phuc_luc) throw conflict('Mục này đã được khôi phục.');
    if (hienTai?.het_han_luc) throw conflict(`Mục này đã quá ${GIU_NGAY} ngày và đã xoá hẳn — không khôi phục được.`);
    const du = JSON.parse(m.du_lieu) as DuLieuRac;
    kiemGoc(conn, du);
    const anh = traLai(conn, du.ban);
    sau?.(conn, anh);
    const moiId = Number(anh.get(bangChinh)?.get(m.doi_tuong_id) ?? m.doi_tuong_id);
    conn.prepare('UPDATE thung_rac SET khoi_phuc_boi = ?, khoi_phuc_luc = ? WHERE id = ?').run(nguoi, nowIso(), m.id);
    writeAudit({ actorUserId: nguoi, action: `${m.loai}.restore`, entityType: m.loai, entityId: moiId, entityLabel: m.nhan,
      before: null, after: { thungRacId: m.id, idCu: m.doi_tuong_id } });
    return moiId;
  });
}

/** Khoá tệp còn nằm trong mục thùng rác CHƯA khôi phục / CHƯA hết hạn — không được xoá khỏi kho (tệp dùng chung `chepTep`). */
export function tepConTrongRac(urls: readonly string[]): Set<string> {
  if (!urls.length) return new Set();
  const ph = urls.map(() => '?').join(',');
  return new Set((db().prepare(`SELECT DISTINCT j.value AS url FROM thung_rac t, json_each(t.du_lieu, '$.tep') j
      WHERE t.khoi_phuc_luc IS NULL AND t.het_han_luc IS NULL AND j.value IN (${ph})`).all(...urls) as any[]).map((r) => r.url as string));
}

/**
 * Cron: mục quá `GIU_NGAY` ngày chưa khôi phục → xoá tệp trong kho (khi không dòng / mục rác nào khác còn dùng) + bỏ bản chụp (giữ dòng mục để
 * lịch sử). Nơi gọi chạy trên Netlify phải `await choViecNenKhoTep()` để việc xoá tệp xong trước khi hàm tắt. Trả số mục đã dọn.
 */
export function donThungRac(homNayIso = nowIso()): number {
  const conn = db();
  const moc = new Date(Date.parse(homNayIso) - GIU_NGAY * 86_400_000).toISOString();
  const ds = conn.prepare(`SELECT id, du_lieu FROM thung_rac WHERE khoi_phuc_luc IS NULL AND het_han_luc IS NULL AND xoa_luc < ?`).all(moc) as any[];
  for (const m of ds) {
    const tep = (JSON.parse(m.du_lieu) as DuLieuRac).tep ?? [];
    conn.prepare(`UPDATE thung_rac SET het_han_luc = ?, du_lieu = '{"ban":[],"tep":[]}' WHERE id = ?`).run(nowIso(), m.id);
    if (tep.length) xoaTepSauGiaoDich(tep);   // chỉ xoá tệp không còn dòng `attachments` / mục rác nào khác dùng
  }
  return ds.length;
}
