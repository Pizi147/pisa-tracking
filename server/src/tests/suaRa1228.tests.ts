/**
 * PHÉP KIỂM SUA-RA-1228 (chủ SP 07/11, "Giao nhóm A" từ bản rà ngoài #1228) — phần chạy được ngoài trình duyệt:
 *  F01 · Việc đã xong "Báo PH" lọc theo HẠN HIỆU LỰC (hạn chọn) — không theo hạn gốc
 *  F05 · Đóng / Esc hộp xác nhận (409 canXacNhan) = `ApiError.huy`, không phải lỗi; 409 xung đột thật KHÔNG bị nuốt
 *  F08 · Nhận xét Tutor: `coSua` (người ghi, mọi lúc) tách `coXoa` (thêm trong 24 giờ) — LUAT-34
 * F02–F04, F06, F07, 8.3 là hành vi của React trong trang → bấm thử trên dev server (mô tả PR).
 */
export async function runSuaRa1228Tests(t: any) {
  const { check, checkAsync, assert, conn, P } = t;
  const vx: any = await import('../phanTich/viecDaXong.ts');
  const tr: any = await import('../tutors/trang.ts');
  const api = await import('../../../web/src/lib/api.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nSUA-RA-1228 · F01 Báo PH hạn chọn · F05 huỷ hộp xác nhận · F08 coSua / coXoa');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };

  // ---------------------------------------------------------------- F01
  check('F01 · Báo PH xong: hạn gốc 20/09 hoặc 01/12, hạn chọn 05/11 → tháng 11 có tính (đúng hạn); bỏ hạn chọn → về hạn gốc, không tính tháng 11', () => thu(() => {
    const s = one(`SELECT s.id, s.branch_id cn FROM students s WHERE s.consultant_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active') LIMIT 1`);
    const ky = (khung: 'ft' | 'thuong') => ({ cn: s.cn, khung, tu: '2026-11-01', cuoi: '2026-11-30', homNay: '2026-11-07' });
    const co = (id: number) => vx.viecXongCn(ky('ft')).find((x: any) => x.key === `bao-ph:${id}`);   // PR-3: viecDaXong (theo người, theo khung) bỏ — viecXongCn mọi khung
    for (const hanGoc of ['2026-09-20', '2026-12-01']) {
      const id = Number(run(`INSERT INTO viec_bao_ph (student_id, nhan, han, han_chon, trang_thai, tao_luc) VALUES (?,?,?,?,?,?)`, s.id, 'x', hanGoc, '2026-11-05', 'xong', '2026-09-01T00:00:00.000Z').lastInsertRowid);
      run(`INSERT INTO viec_bao_ph_lan (viec_id, ket_qua, ngay, ghi_luc) VALUES (?,?,?,?)`, id, 'da_bao', '2026-11-04', '2026-11-04T03:00:00.000Z');
      xoaNho();
      const x = co(id);
      assert(!!x && x.due === '2026-11-05' && x.dung === true, `hạn gốc ${hanGoc} + hạn chọn 05/11: ${JSON.stringify(x)}`);
      run('UPDATE viec_bao_ph SET han_chon = NULL WHERE id = ?', id);
      xoaNho();
      assert(!co(id), `bỏ hạn chọn (hạn gốc ${hanGoc}) không còn thuộc tháng 11`);
    }
  }));

  // ---------------------------------------------------------------- F05
  await checkAsync('F05 · Đóng hộp xác nhận → ApiError.huy + câu trung tính; 409 xung đột thật (không canXacNhan) vẫn là lỗi; đồng ý → gửi lại', async () => {
    const goc = globalThis.fetch;
    const tra409 = (details: any) => (async () => ({ ok: false, status: 409, text: async () => JSON.stringify({ error: 'Bạn muốn làm tiếp?', details }) } as Response)) as typeof fetch;
    try {
      globalThis.fetch = tra409({ canXacNhan: true, ma: 'm1' });
      const bo = api.datHoiXacNhan(async () => false);
      let e: any = null;
      try { await api.api.post('/f05/huy', {}); } catch (x) { e = x; }
      assert(e instanceof api.ApiError && e.huy === true && e.message === api.cauHuy(), `Đóng hộp: ${e?.huy} ${e?.message}`);
      bo();
      globalThis.fetch = tra409(undefined);
      const bo2 = api.datHoiXacNhan(async () => false);
      e = null;
      try { await api.api.post('/f05/xungdot', {}); } catch (x) { e = x; }
      assert(e instanceof api.ApiError && !e.huy && e.status === 409 && e.message === 'Bạn muốn làm tiếp?', `xung đột thật bị nuốt: ${e?.huy} ${e?.message}`);
      bo2();
      let lan = 0;
      globalThis.fetch = (async (_u: any, o: any) => {
        lan++;
        return o?.headers?.['x-xac-nhan'] ? { ok: true, status: 200, text: async () => '{"ok":true}' } : { ok: false, status: 409, text: async () => JSON.stringify({ error: 'Hỏi', details: { canXacNhan: true, ma: 'm2' } }) };
      }) as any;
      const bo3 = api.datHoiXacNhan(async () => true);
      const kq: any = await api.api.post('/f05/dongy', {});
      bo3();
      assert(kq.ok === true && lan === 2, `đồng ý phải gửi lại đúng 1 lần: ${lan}`);
    } finally { globalThis.fetch = goc; }
  });

  // ---------------------------------------------------------------- F08
  check('F08 · nhận xét Tutor: người ghi sửa mọi lúc, xoá chỉ trong 24 giờ; người khác không sửa / xoá', () => thu(() => {
    const HT = loadPrincipal(one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'head_tutor' LIMIT 1`).id);
    const tutor = Number(run(`INSERT INTO tutors (ten, noi_day_branch_id, chi_online, ky_nang, created_at) VALUES (?,?,?,?,?)`, 'Thử F08', one(`SELECT id FROM branches LIMIT 1`).id, 0, 'L,R', '2026-09-01T00:00:00.000Z').lastInsertRowid);
    const ghi = (nguoi: number, luc: string) => run(`INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, nguoi_id, luc) VALUES (?,?,?,?,?)`, tutor, 'can_cai_thien', 'Nhận xét thử đủ dài', nguoi, luc);
    const gio = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
    ghi(HT.userId, gio(2)); ghi(HT.userId, gio(48)); ghi(P.admin.userId, gio(1));
    const ds = tr.panelTutor(HT, tutor, { tu: '2026-01-05', den: '2026-12-27' }).nhanXet as any[];
    const moi = ds.filter((n) => n.nguoi === one('SELECT full_name FROM users WHERE id = ?', HT.userId).full_name);
    const nM = moi.find((n) => Date.now() - new Date(n.luc).getTime() < 24 * 3600_000)!;
    const nC = moi.find((n) => Date.now() - new Date(n.luc).getTime() >= 24 * 3600_000)!;
    assert(nM.coSua && nM.coXoa, `bản trong 24 giờ: ${JSON.stringify([nM.coSua, nM.coXoa])}`);
    assert(nC.coSua === true && nC.coXoa === false, `bản quá 24 giờ phải sửa được, không xoá: ${JSON.stringify([nC.coSua, nC.coXoa])}`);
    assert(ds.filter((n) => !moi.includes(n)).every((n) => !n.coSua && !n.coXoa), 'nhận xét của người khác không được sửa / xoá');
  }));
}
