/**
 * BAOPH-0 (N72 ⑤ ⑥ C8, chủ SP 26/11) — ĐỔI DỮ LIỆU MỘT LẦN lúc deploy (khoá `demo_config`), hàm đổi chạy lại không đổi gì:
 *  ① Trao đổi gia đình / Báo PH kết quả Test (Progress · Final) đang Cần xử lý → việc TVV (`viec_bao_ph.phoi_hop_id`) + theo dõi mặc định (GVCN lớp em, Head, CX) — GVCN / Head thôi giữ.
 *  ② C8 — việc "Báo PH Meeting" (TVV, sau Meeting CX/GĐCN) còn mở: lượt đã có việc Trao đổi gia đình → "Đã bỏ" lý do `system_gop_trao_doi`; lượt có Trao đổi gia đình
 *     (GVCN đã xác nhận, chưa có việc TVV) → đổi thành việc Trao đổi gia đình (nguồn = dòng đó); lượt không có Trao đổi gia đình → giữ (lần báo PH duy nhất).
 *  ③ Head + CX theo dõi mọi việc Báo PH đang mở (`theoDoiVaiBaoPh`), người gửi Tình hình theo dõi việc Tình hình đang mở.
 * Nhật ký: MỘT dòng `audit_logs` (`migrate.baoph0`) giữ id từng nhóm → `khoiPhucBaoPh0` trả lại ① ② (việc chưa ai ghi thì gỡ; theo dõi ③ để nguyên — tự lành theo vai).
 */
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { VIEC_TVV_BAO_PH } from '../../../shared/domain/index.ts';
import { dongBoViecTvvLuot } from '../yThuc/baoPhTvv.ts';
import { LUOT_SAU_THI_SQL } from '../students/tamDung.ts';
import { donViec, theoDoiVaiBaoPh } from '../worklist/giaoViec.ts';

export const KHOA_BAOPH0 = 'pr_baoph0_da_chay';
const VIEC = 'migrate.baoph0';

export type KetQuaBaoPh0 = { taoViec: number[]; gop: number[]; chuyen: { viec: number; cu: number; moi: number; nhanCu: string }[]; theoDoi: number };

/** Đổi — không khoá (phép kiểm gọi thẳng). */
export function doiBaoPh0(conn: any): KetQuaBaoPh0 {
  const demTd = () => (conn.prepare(`SELECT COUNT(*) AS n FROM viec_theo_doi WHERE loai = 'bao_ph'`).get() as any).n as number;
  const td0 = demTd();
  /* ① lượt có nguồn TVV đang Cần xử lý mà chưa có việc TVV. */
  const luot = (conn.prepare(`SELECT DISTINCT x.attempt_id AS id FROM sos_coordination_actions x WHERE x.status = 'pending' AND x.kind IN (SELECT value FROM json_each(?))
      AND NOT EXISTS (SELECT 1 FROM viec_bao_ph v WHERE v.phoi_hop_id = x.id) ORDER BY 1`).all(JSON.stringify(VIEC_TVV_BAO_PH)) as any[]).map((r) => r.id as number);
  const taoViec: number[] = [];
  for (let i = 0; i < luot.length; i += 200) taoViec.push(...dongBoViecTvvLuot(luot.slice(i, i + 200), null, { khongGopMeeting: true }));   // ② gộp + ghi nhật ký
  /* ② việc Báo PH Meeting còn mở. */
  const gop: number[] = [], chuyen: KetQuaBaoPh0['chuyen'] = [];
  for (const r of conn.prepare(`SELECT v.id, v.nhan, v.phoi_hop_id AS ph, t.id AS td, tv.id AS td_viec, (SELECT COUNT(*) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id) AS so_lan,
      /* N78: lượt còn sống mà GVCN còn việc chờ (bước đầu chưa xong) */
      (EXISTS (SELECT 1 FROM sos_coordination_actions g JOIN assessment_attempts ga ON ga.id = g.attempt_id AND ga.status != 'cancelled' AND NOT ${LUOT_SAU_THI_SQL('ga')}
        WHERE g.attempt_id = m.attempt_id AND g.status = 'pending' AND g.kind NOT IN ('talk_family', 'bao_ph_tvv'))) AS cho_dau FROM viec_bao_ph v
      JOIN sos_coordination_actions m ON m.id = v.phoi_hop_id AND m.kind IN ('cx_meeting_student', 'cx_meeting_family')
      LEFT JOIN sos_coordination_actions t ON t.id = (SELECT MIN(t2.id) FROM sos_coordination_actions t2 WHERE t2.attempt_id = m.attempt_id AND t2.kind = 'talk_family' AND t2.status != 'removed')
      LEFT JOIN viec_bao_ph tv ON tv.phoi_hop_id = t.id
     WHERE v.trang_thai = 'mo' ORDER BY v.id`).all() as any[]) {
    if (!r.td) continue;
    /* N78 (rà #2295 P1): Trao đổi gia đình còn chờ mà CHƯA có việc TVV (GVCN chưa xác nhận bước đầu) → giữ Báo PH Meeting — `dongBoViecTvvLuot` gộp khi việc Trao đổi
       gia đình sinh. Báo PH Meeting đã ghi một lần → giữ. */
    if ((!r.td_viec && r.cho_dau && conn.prepare(`SELECT status FROM sos_coordination_actions WHERE id = ?`).get(r.td)?.status === 'pending') || r.so_lan) continue;
    /* Rà #2233 P1-5 + vòng 2 P1-A: lượt đã có Trao đổi gia đình (có việc TVV; đã xong → GVCN đã báo; lượt huỷ / sau thi thật → không còn việc)
       → việc Báo PH Meeting GỘP — không ghi đè nguồn GVCN, không tạo việc ẩn còn mở. `chuyen` giữ cho nhật ký cũ (khôi phục). */
    conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = 'system_gop_trao_doi', bo_boi = NULL, bo_luc = ? WHERE id = ? AND trang_thai = 'mo'`).run(nowIso(), r.id);
    gop.push(r.id);
  }
  /* ③ người gửi Tình hình (việc đang mở) + Head / CX mọi việc Báo PH đang mở. */
  conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) SELECT 'bao_ph', v.id, t.nguoi_gui, 'tay', t.nguoi_gui, ?
      FROM viec_bao_ph v JOIN tinh_hinh_hoc_tap t ON t.id = v.tinh_hinh_id WHERE v.trang_thai = 'mo' ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(nowIso());
  theoDoiVaiBaoPh();
  return { taoViec, gop, chuyen, theoDoi: demTd() - td0 };   // chênh số dòng theo dõi Báo PH (① + ③)
}

/** Khôi phục theo nhật ký: ② trả lại (gộp → mở; chuyển → nguồn Meeting cũ) · ① việc chưa ai ghi thì gỡ (nguồn vẫn Cần xử lý như trước). Nhật ký đổi `…_khoi_phuc`. */
export function khoiPhucBaoPh0(conn: any): number {
  let n = 0;
  for (const h of conn.prepare(`SELECT id AS id, after_json AS sau FROM audit_logs WHERE action = '${VIEC}' ORDER BY id DESC`).all() as any[]) {
    const k = JSON.parse(h.sau) as KetQuaBaoPh0;
    for (const id of k.gop) n += conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_luc = NULL WHERE id = ? AND trang_thai = 'bo' AND bo_ly_do = 'system_gop_trao_doi'`).run(id).changes;
    for (const c of k.chuyen) n += conn.prepare('UPDATE viec_bao_ph SET phoi_hop_id = ?, nhan = ? WHERE id = ? AND phoi_hop_id = ?').run(c.cu, c.nhanCu, c.viec, c.moi).changes;
    const go = (conn.prepare(`SELECT id FROM viec_bao_ph WHERE id IN (SELECT value FROM json_each(?)) AND NOT EXISTS (SELECT 1 FROM viec_bao_ph_lan l WHERE l.viec_id = viec_bao_ph.id)`)
      .all(JSON.stringify(k.taoViec)) as any[]).map((r) => r.id as number);
    donViec('bao_ph', go);
    if (go.length) n += conn.prepare('DELETE FROM viec_bao_ph WHERE id IN (SELECT value FROM json_each(?))').run(JSON.stringify(go)).changes;
    conn.prepare(`UPDATE audit_logs SET action = '${VIEC}_khoi_phuc' WHERE id = ?`).run(h.id);
  }
  return n;
}

export function migratePrBaoPh0(conn: any, applied: string[]) {
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'viec_bao_ph'").get()) return;
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_BAOPH0)) return;
  const k = doiBaoPh0(conn);
  if (!k.taoViec.length && !k.gop.length && !k.chuyen.length && !k.theoDoi) return;   // DB mới / đã đúng: không ghi gì (chạy lại vẫn không đổi)
  conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at) VALUES (NULL, '${VIEC}', 'viec_bao_ph', NULL, 'migrate', NULL, ?, ?)`)
    .run(JSON.stringify(k), nowIso());
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_BAOPH0, demoToday(), nowIso());
  applied.push(`BAOPH-0: ${k.taoViec.length} việc TVV mới (Trao đổi gia đình / Báo PH kết quả Test), ${k.gop.length} Báo PH Meeting gộp vào Trao đổi gia đình, `
    + `${k.chuyen.length} đổi thành Trao đổi gia đình, ${k.theoDoi >= 0 ? '+' : ''}${k.theoDoi} dòng theo dõi Báo PH (khôi phục: khoiPhucBaoPh0).`);
}

/** 4.6 (khung việc base): CHỈ THÊM — bảng `viec_xu_ly`, cột giao việc của `discipline_measures`, cột việc cha của `tasks`. Khớp `schema.sql`; chạy lặp không làm gì. */
export function themCotPrBaoPh0(conn: any, applied: string[]) {
  const cot = (bang: string) => new Set((conn.prepare(`SELECT name FROM pragma_table_info('${bang}')`).all() as any[]).map((c) => c.name as string));
  const dm = cot('discipline_measures'), tk = cot('tasks');
  if (!dm.size || !tk.size) return;
  let doi = false;
  for (const [c, k] of [['phu_trach_id', 'INTEGER REFERENCES users(id)'], ['giao_boi', 'INTEGER REFERENCES users(id)'], ['giao_luc', 'TEXT'], ['han_chon', 'TEXT']]) {
    if (!dm.has(c)) { conn.exec(`ALTER TABLE discipline_measures ADD COLUMN ${c} ${k}`); doi = true; }
  }
  for (const c of ['cha_loai TEXT', 'cha_id INTEGER']) if (!tk.has(c.split(' ')[0])) { conn.exec(`ALTER TABLE tasks ADD COLUMN ${c}`); doi = true; }
  if (!conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'viec_xu_ly'").get()) {
    conn.exec(`CREATE TABLE viec_xu_ly (
  id INTEGER PRIMARY KEY REFERENCES students(id), student_id INTEGER NOT NULL REFERENCES students(id), trang_thai TEXT NOT NULL DEFAULT 'mo',
  han_chon TEXT, phu_trach_id INTEGER REFERENCES users(id), giao_boi INTEGER REFERENCES users(id), giao_luc TEXT, tao_luc TEXT NOT NULL
)`);
    doi = true;
  }
  conn.exec('CREATE INDEX IF NOT EXISTS idx_viec_xu_ly_giao ON viec_xu_ly(phu_trach_id) WHERE phu_trach_id IS NOT NULL');
  conn.exec('CREATE INDEX IF NOT EXISTS idx_dm_giao ON discipline_measures(phu_trach_id) WHERE phu_trach_id IS NOT NULL');
  conn.exec('CREATE INDEX IF NOT EXISTS idx_task_cha ON tasks(cha_loai, cha_id) WHERE cha_loai IS NOT NULL');
  if (doi) applied.push('BAOPH-0: thêm viec_xu_ly, discipline_measures.(phu_trach_id, giao_boi, giao_luc, han_chon), tasks.(cha_loai, cha_id) — giao việc Xử lý vi phạm / Đã thực hiện, việc con.');
}
