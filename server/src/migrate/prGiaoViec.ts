import { theoDoiMacDinhMeeting, theoDoiVaiBaoPh } from '../worklist/giaoViec.ts';

/**
 * GV-1 (N58, chủ SP 20/11 — giao việc liên phòng ban), chạy lặp không đổi, khớp `schema.sql`:
 *   1. `phu_trach_id`, `giao_boi`, `giao_luc` trên viec_bao_ph · sos_coordination_actions · tinh_hinh_hoc_tap (NULL = theo luật — dữ liệu cũ giữ nguyên).
 *   2. Bảng viec_theo_doi (người theo dõi) · viec_giao_lan (lịch sử giao) · meeting_phan (Meeting CX / GĐCN: Xếp lịch họp, Kết quả meeting).
 *   3. Chỉ mục một phần `phu_trach_id IS NOT NULL` (việc giao cho tôi) — dòng cũ đều NULL nên không vào chỉ mục, câu cũ không đổi kế hoạch / thứ tự.
 *   4. ĐỔI DỮ LIỆU (chỉ thêm): Meeting CX / GĐCN đã xác nhận trước GV-1 mà việc Báo PH của TVV còn mở → sinh hai phần (chưa xong) để panel / Công việc có
 *      + người theo dõi mặc định của phần vừa sinh (GV-2).
 * Mỗi khối TỰ LÀNH: thiếu bảng HOẶC thiếu chỉ mục nào → chạy lại cả khối (`IF NOT EXISTS`). Bảng gốc chưa có (DB rất cũ ở lần đầu) → bỏ qua; lần sau làm nốt.
 */
const BANG_MOI = `
  CREATE TABLE IF NOT EXISTS viec_theo_doi (
    id INTEGER PRIMARY KEY, loai TEXT NOT NULL, ref_id INTEGER NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id),
    nguon TEXT NOT NULL DEFAULT 'tay', them_boi INTEGER REFERENCES users(id), luc TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_viec_theo_doi ON viec_theo_doi(loai, ref_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_viec_theo_doi_nguoi ON viec_theo_doi(user_id);
  CREATE TABLE IF NOT EXISTS viec_giao_lan (
    id INTEGER PRIMARY KEY, loai TEXT NOT NULL, ref_id INTEGER NOT NULL, truong TEXT NOT NULL, cu TEXT, moi TEXT,
    boi INTEGER REFERENCES users(id), luc TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_viec_giao_lan ON viec_giao_lan(loai, ref_id);`;
const TEN_BANG_MOI = ['viec_theo_doi', 'uq_viec_theo_doi', 'idx_viec_theo_doi_nguoi', 'viec_giao_lan', 'idx_viec_giao_lan'];

const MEETING = `
  CREATE TABLE IF NOT EXISTS meeting_phan (
    id INTEGER PRIMARY KEY,
    phoi_hop_id INTEGER NOT NULL REFERENCES sos_coordination_actions(id),
    phan TEXT NOT NULL,
    branch_id INTEGER,
    trang_thai TEXT NOT NULL DEFAULT 'mo',
    ngay_gio TEXT,
    ket_qua TEXT,
    xong_boi INTEGER REFERENCES users(id), xong_luc TEXT, nhap_ho_boi INTEGER REFERENCES users(id),
    han_chon TEXT,
    phu_trach_id INTEGER REFERENCES users(id), giao_boi INTEGER REFERENCES users(id), giao_luc TEXT,
    tao_luc TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_meeting_phan ON meeting_phan(phoi_hop_id, phan);
  CREATE INDEX IF NOT EXISTS idx_meeting_phan_mo ON meeting_phan(branch_id) WHERE trang_thai = 'mo';
  CREATE INDEX IF NOT EXISTS idx_meeting_phan_giao ON meeting_phan(phu_trach_id) WHERE phu_trach_id IS NOT NULL;`;
const TEN_MEETING = ['meeting_phan', 'uq_meeting_phan', 'idx_meeting_phan_mo', 'idx_meeting_phan_giao'];

/** Bảng có cột giao việc + tên chỉ mục một phần của nó. */
const BANG_VIEC: [string, string][] = [
  ['viec_bao_ph', 'idx_viec_bao_ph_giao'], ['sos_coordination_actions', 'idx_sca_giao'], ['tinh_hinh_hoc_tap', 'idx_tinh_hinh_giao'],
];

const co = (conn: any, ten: string) => !!conn.prepare(`SELECT 1 FROM sqlite_master WHERE name = ?`).get(ten);

export function migratePrGiaoViec(conn: any, applied: string[]) {
  if (!co(conn, 'users')) return;
  if (TEN_BANG_MOI.some((t) => !co(conn, t))) {
    conn.exec(BANG_MOI);
    applied.push('GV-1: bảng viec_theo_doi (người theo dõi việc) + viec_giao_lan (lịch sử giao việc) + chỉ mục.');
  }
  for (const [bang, chiMuc] of BANG_VIEC) {
    if (!co(conn, bang)) continue;
    const cot = new Set((conn.prepare(`SELECT name FROM pragma_table_info(?)`).all(bang) as any[]).map((c) => c.name as string));
    const thieu = ['phu_trach_id', 'giao_boi', 'giao_luc'].filter((c) => !cot.has(c));
    if (thieu.length) {
      if (thieu.includes('phu_trach_id')) conn.exec(`ALTER TABLE ${bang} ADD COLUMN phu_trach_id INTEGER REFERENCES users(id)`);
      if (thieu.includes('giao_boi')) conn.exec(`ALTER TABLE ${bang} ADD COLUMN giao_boi INTEGER REFERENCES users(id)`);
      if (thieu.includes('giao_luc')) conn.exec(`ALTER TABLE ${bang} ADD COLUMN giao_luc TEXT`);
      applied.push(`GV-1: thêm ${bang}.${thieu.join(', ')} (người được giao; NULL = theo luật).`);
    }
    if (!co(conn, chiMuc)) {
      conn.exec(`CREATE INDEX IF NOT EXISTS ${chiMuc} ON ${bang}(phu_trach_id) WHERE phu_trach_id IS NOT NULL`);
      applied.push(`GV-1: chỉ mục một phần ${chiMuc} (việc giao cho tôi).`);
    }
  }
  if (!co(conn, 'sos_coordination_actions')) return;
  if (TEN_MEETING.some((t) => !co(conn, t))) {
    conn.exec(MEETING);
    applied.push('GV-1: bảng meeting_phan (Meeting CX / GĐCN: Xếp lịch họp · Kết quả meeting) + chỉ mục.');
  }
  /* 4. Meeting đã xác nhận trước GV-1, việc Báo PH của TVV còn mở, chưa có hai phần → sinh (chi nhánh của em như lúc sinh việc mới). Chạy lặp: ON CONFLICT bỏ qua. */
  if (co(conn, 'viec_bao_ph') && co(conn, 'students')) {
    const luc = new Date().toISOString();
    const n = conn.prepare(
      `INSERT INTO meeting_phan (phoi_hop_id, phan, branch_id, trang_thai, tao_luc)
       SELECT x.id, ph.phan, COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND e.status = 'active'
                ORDER BY e.id DESC LIMIT 1), s.branch_id), 'mo', ?
         FROM sos_coordination_actions x JOIN viec_bao_ph v ON v.phoi_hop_id = x.id AND v.trang_thai = 'mo' JOIN students s ON s.id = x.student_id
         CROSS JOIN (SELECT 'xep_lich' AS phan UNION ALL SELECT 'ket_qua') ph
        WHERE x.status = 'done' AND x.kind IN ('cx_meeting_student', 'cx_meeting_family')
       ON CONFLICT(phoi_hop_id, phan) DO NOTHING`,
    ).run(luc).changes;
    /* GV-2: phần vừa sinh bù chưa có người theo dõi mặc định (TVV · GVCN · Head, như Meeting mới — `theoDoiMacDinhMeeting`). Chạy lặp: chỉ phần sinh ở lần này. */
    if (n) for (const r of conn.prepare(`SELECT DISTINCT mp.phoi_hop_id AS ph, x.student_id AS sid, v.id AS bp FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id
        LEFT JOIN viec_bao_ph v ON v.phoi_hop_id = mp.phoi_hop_id WHERE mp.tao_luc = ?`).all(luc) as any[]) theoDoiMacDinhMeeting(r.ph, r.sid, r.bp ?? null);
    if (n) applied.push(`GV-1: sinh ${n} phần Meeting CX / GĐCN (Xếp lịch họp · Kết quả meeting) cho Meeting đã xác nhận, Báo PH của TVV còn mở.`);
  }
  /* N67 (chủ SP 24/11, PTA 24/11 "có bù"): Meeting đã có Kết quả meeting xong mà Xếp lịch họp còn mở → Xếp lịch tự xong (`xong_boi` NULL, `xong_luc` = lúc Kết quả xong)
     + lịch sử `tu_xong` (người NULL = hệ thống), như ghi Kết quả sau N67. ĐỔI DỮ LIỆU, chạy lặp không đổi (lần sau không còn dòng `mo` khớp). */
  if (co(conn, 'meeting_phan') && co(conn, 'viec_giao_lan')) {
    const ds = conn.prepare(
      `UPDATE meeting_phan SET trang_thai = 'xong', xong_boi = NULL, nhap_ho_boi = NULL,
              xong_luc = (SELECT k.xong_luc FROM meeting_phan k WHERE k.phoi_hop_id = meeting_phan.phoi_hop_id AND k.phan = 'ket_qua')
        WHERE phan = 'xep_lich' AND trang_thai = 'mo'
          AND EXISTS (SELECT 1 FROM meeting_phan k WHERE k.phoi_hop_id = meeting_phan.phoi_hop_id AND k.phan = 'ket_qua' AND k.trang_thai = 'xong')
       RETURNING id, xong_luc`,
    ).all() as { id: number; xong_luc: string | null }[];
    const ghi = conn.prepare(`INSERT INTO viec_giao_lan (loai, ref_id, truong, cu, moi, boi, luc) VALUES ('meeting', ?, 'tu_xong', NULL, NULL, NULL, ?)`);
    const luc = new Date().toISOString();
    for (const r of ds) ghi.run(r.id, r.xong_luc ?? luc);
    if (ds.length) applied.push(`N67: ${ds.length} phần Xếp lịch họp tự xong theo Kết quả meeting đã xong (dữ liệu trước N67).`);
  }
  /* TD-HEAD-CX (chủ SP 21/11): Báo PH vi phạm ĐANG MỞ thêm bù Head + CX chi nhánh em theo dõi (bỏ dòng hết điều kiện). Tự lành — chạy lại chỉ đổi khi vai / dữ liệu đổi;
     người đã bỏ theo dõi không bị thêm lại. */
  if (co(conn, 'viec_bao_ph') && co(conn, 'viec_theo_doi') && co(conn, 'viec_giao_lan')) {
    const n = theoDoiVaiBaoPh();
    if (n) applied.push(`TD-HEAD-CX: ${n} dòng người theo dõi Head / CX của Báo PH vi phạm (thêm bù việc đang mở / bỏ dòng hết vai / dọn việc đóng quá 7 ngày).`);
  }
}
