/**
 * PHÉP KIỂM HOTFIX-MO-KHOA (chủ SP 07/11 — plan.md mục 4 "07/11 — KHẨN: MỞ MỌI CHẶN CỨNG"). Bản chính (Turso) tạo bảng ghi cột `action` / `key` thành
 * `ACTION` / `KEY` (đo trên bản chép 07/11 và 17/10) → khoá dòng viết hoa, `r.action` = undefined → mọi Hoàn tác trạng thái (Kết thúc / Tạm dừng / Học lại) 409
 * "Không còn hoàn tác được", nên Đổi bước tiếp luôn hỏng. Phép kiểm dựng lại đúng lược đồ đó (đổi tên cột TRONG giao dịch, cuộn lại sau).
 * Luật mới: Đổi luôn làm được — hoàn tác chính xác không được thì đi THẲNG từ trạng thái hiện tại; Hoàn tác không trả chính xác được → câu ngắn chỉ nút Đổi.
 */
export async function runPrHotfixMoKhoaTests(t: { check: any; assert: any; assertThrows: any; conn: any; P: any; TODAY: string }) {
  const { check, assert, assertThrows, conn, P, TODAY } = t;
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const bt: any = await import('../loTrinh/buocTiep.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { mondayOf } = await import('../platform/week.ts');
  console.log('\nHOTFIX-MO-KHOA — Đổi bước tiếp / Hoàn tác / sửa thi thật không chặn cứng (lược đồ bản chính ACTION / KEY)');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /** Lược đồ bản chính: 6 cột viết hoa (PRAGMA table_info bản chép 07/11). */
  const HOA: [string, string][] = [['audit_logs', 'action'], ['attempt_schedule_history', 'action'], ['roles', 'key'], ['permissions', 'key'], ['user_prefs', 'key'], ['demo_config', 'key']];
  const thu = <T>(fn: () => T, banChinh = true): T => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      if (banChinh) for (const [b, c] of HOA) conn.exec(`ALTER TABLE ${b} RENAME COLUMN ${c} TO "${c.toUpperCase()}"`);
      xoaNho(); return fn();
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const QL = P.mbManager;
  const dem = (sid: number) => ({
    lt: get('SELECT COUNT(*) n FROM learning_cycles WHERE student_id = ?', sid).n as number,
    gd: get('SELECT COUNT(*) n FROM enrollments WHERE student_id = ?', sid).n as number,
  });
  const em = (sid: number) => get('SELECT status, archived_at FROM students WHERE id = ?', sid);
  const tuanSau = new Date(Date.parse(mondayOf(TODAY)) + 7 * 864e5).toISOString().slice(0, 10);
  const emThiTruot = () => {
    const r = get(`SELECT s.id AS sid, cy.id AS cy, e.class_id FROM students s
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.is_fast_track = 1
        JOIN branches b ON b.id = c.branch_id AND b.code = 'MB'
        JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active' AND cy.route IS NOT NULL
          AND cy.seq = (SELECT MAX(seq) FROM learning_cycles x WHERE x.student_id = s.id)
       WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`);
    assert(r, 'seed cần em FT MB đang học');
    conn.prepare('UPDATE learning_cycles SET target_score = 7, khong_cam_ket = 0 WHERE id = ?').run(r.cy);
    thiThat.datKetQuaThiThat(QL, r.cy, { ngayThi: TODAY, l: 6, r: 6, w: 6, s: 6 });
    xoaNho();
    return r as { sid: number; cy: number; class_id: number };
  };

  check('HMK-1 · lược đồ bản chính: dòng đọc ra có khoá `action` / `key` thường (cả `SELECT *`, cả `AS action`)', () => thu(() => {
    const r = get(`SELECT action FROM audit_logs ORDER BY id DESC LIMIT 1`);
    const r2 = get(`SELECT * FROM roles LIMIT 1`);
    assert(r && typeof r.action === 'string' && !('ACTION' in r), `audit_logs: ${JSON.stringify(r)}`);
    assert(r2 && typeof r2.key === 'string' && !('KEY' in r2), `roles: ${JSON.stringify(r2)}`);
  }));

  check('HMK-2 · ca bản chính: Kết thúc học (lưu trữ) → Đổi sang Lộ trình mới Khác "RF bù buổi chính" Hẹn tuần sau → lưu được, không lộ trình / ghi danh thừa', () => thu(() => {
    const x = emThiTruot();
    bt.chonBuocTiep(QL, x.cy, { chon: 'ket_thuc' });
    const goc = dem(x.sid);
    assert(em(x.sid).status === 'finished' && em(x.sid).archived_at, 'tiền đề Kết thúc + lưu trữ');
    assert(!('lyDoKhongDoi' in bt.trangThaiBuocTiep(QL, x.cy)), 'nút Đổi không còn trạng thái khoá');
    const r = bt.chonBuocTiep(QL, x.cy, { chon: 'lo_trinh_moi', route: 'KHAC', routeTen: 'RF bù buổi chính', batDau: tuanSau });
    assert(r.chon === 'lo_trinh_moi' && r.hen === tuanSau, `đổi: ${JSON.stringify({ chon: r.chon, hen: r.hen })}`);
    assert(JSON.stringify(dem(x.sid)) === JSON.stringify(goc), `thừa: ${JSON.stringify({ goc, nay: dem(x.sid) })}`);
    const h = bt.boChonBuocTiep(QL, x.cy);
    assert(h.chon === 'ket_thuc' && em(x.sid).status === 'finished' && em(x.sid).archived_at, `Hoàn tác về Kết thúc: ${h.chon} ${JSON.stringify(em(x.sid))}`);
  }));

  check('HMK-3 · lược đồ bản chính: mọi cặp Đổi (Kết thúc · Tạm dừng · Lộ trình mới ngay · Lộ trình mới hẹn) lưu được, đúng trạng thái em, không thừa', () => thu(() => {
    const LC: Record<string, any> = {
      ket_thuc: { chon: 'ket_thuc' }, tam_dung: { chon: 'tam_dung' }, moi_ngay: { chon: 'lo_trinh_moi' },
      moi_hen: { chon: 'lo_trinh_moi', route: 'KHAC', routeTen: 'RF bù', batDau: tuanSau },
    };
    const x = emThiTruot();
    const goc = dem(x.sid);
    const loi: string[] = [];
    for (const a of Object.keys(LC)) for (const b of Object.keys(LC)) {
      if (a === b) continue;
      conn.exec('SAVEPOINT cap');
      try {
        bt.chonBuocTiep(QL, x.cy, LC[a]);
        const r = bt.chonBuocTiep(QL, x.cy, LC[b]);
        const s = em(x.sid);
        const n = dem(x.sid);
        const mongLt = goc.lt + (b === 'moi_ngay' ? 1 : 0);
        const dungEm = b === 'ket_thuc' ? s.status === 'finished' && !!s.archived_at : b === 'tam_dung' ? s.status === 'inactive' && !!s.archived_at
          : b === 'moi_ngay' ? s.status === 'active' && !s.archived_at : true;
        if (r.chon !== LC[b].chon || !dungEm || n.lt !== mongLt || n.gd !== goc.gd) loi.push(`${a}→${b}: ${JSON.stringify({ chon: r.chon, s, n, mongLt })}`);
      } catch (e: any) { loi.push(`${a}→${b}: ${e.status} ${e.message}`); }
      conn.exec('ROLLBACK TO cap'); conn.exec('RELEASE cap'); xoaNho();
    }
    assert(loi.length === 0, loi.join('\n'));
  }));

  check('HMK-4 · hoàn tác chính xác không được (lộ trình mới đã có điểm) → Đổi đi THẲNG: Kết thúc / Tạm dừng lưu được, không lộ trình thừa', () => thu(() => {
    const x = emThiTruot();
    bt.chonBuocTiep(QL, x.cy, { chon: 'lo_trinh_moi' });
    const moi = get('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1', x.sid).id;
    assert(moi !== x.cy, 'tiền đề lộ trình mới');
    conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = (SELECT id FROM assessment_attempts WHERE cycle_id = ? LIMIT 1)`).run(moi);
    const goc = dem(x.sid);
    for (const chon of ['ket_thuc', 'tam_dung']) {
      const r = bt.chonBuocTiep(QL, x.cy, { chon });
      assert(r.chon === chon, `${chon}: ${r.chon}`);
      assert(JSON.stringify(dem(x.sid)) === JSON.stringify(goc), `${chon} thừa: ${JSON.stringify({ goc, nay: dem(x.sid) })}`);
      assert(em(x.sid).status === (chon === 'ket_thuc' ? 'finished' : 'inactive') && em(x.sid).archived_at, `${chon} em: ${JSON.stringify(em(x.sid))}`);
    }
    /* Quay lại Lộ trình mới từ Tạm dừng: đường Quay lại học, không mở lộ trình thứ ba. */
    const r = bt.chonBuocTiep(QL, x.cy, { chon: 'lo_trinh_moi' });
    assert(r.chon === 'lo_trinh_moi' && em(x.sid).status === 'active' && dem(x.sid).lt <= goc.lt + 1, `về Lộ trình mới: ${JSON.stringify({ em: em(x.sid), n: dem(x.sid), goc })}`);
  }, false));

  check('HMK-5 · Hoàn tác không trả chính xác được → 409 MỘT câu ngắn chỉ nút "Đổi" (không câu chặn dài)', () => thu(() => {
    const x = emThiTruot();
    bt.chonBuocTiep(QL, x.cy, { chon: 'lo_trinh_moi' });
    const moi = get('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1', x.sid).id;
    conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = (SELECT id FROM assessment_attempts WHERE cycle_id = ? LIMIT 1)`).run(moi);
    assertThrows(() => bt.boChonBuocTiep(QL, x.cy), /^(?!.*Không còn hoàn tác)(?=.*Đổi).{0,120}$/, 'Hoàn tác vướng');
  }, false));

  check('HMK-6 · sửa điểm thi thật lộ trình đóng vì chuyển lớp: lưu được + ghi nhật ký', () => thu(() => {
    const x = emThiTruot();
    conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE id = ?`).run(TODAY, x.cy);
    conn.prepare(`INSERT INTO ban_chup_lo_trinh (cycle_id, student_id, lan, ly_do, dong_ngay, nguon, so_luot, created_at)
      VALUES (?, ?, (SELECT COALESCE(MAX(lan), 0) + 1 FROM ban_chup_lo_trinh WHERE cycle_id = ?), 'chuyen_lop', ?, 'luc_dong', 0, ?)`).run(x.cy, x.sid, x.cy, TODAY, TODAY);
    const r = thiThat.datKetQuaThiThat(QL, x.cy, { l: 7, r: 7, w: 7, s: 7 });
    assert(r.thi_that_l === 7 && r.khoiPhucId, `sửa: ${JSON.stringify({ l: r.thi_that_l, id: r.khoiPhucId })}`);
  }, false));
}
