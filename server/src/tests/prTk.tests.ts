/** PHÉP KIỂM PR-TK — Tổng kết lộ trình: luật thuần (TK-1), bản chụp (TK-2…TK-4), thi thật (TK-K, TK-L), đường đọc (TK-7). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrTkTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-TK · Tổng kết lộ trình');

  // ------------------------------------------------------------------ TK-1 · luật thuần
  check('TK-1 · nhãn lý do đóng đủ 8 khoá, chữ trùng END_KIND_LABEL', () => {
    assert(d.LY_DO_DONG.length === 8 && d.LY_DO_DONG.every((k: string) => typeof d.LY_DO_DONG_NHAN[k] === 'string'), 'đủ 8 khoá');
    for (const [lyDo, endKind] of [['len_lop', 'len_lop'], ['hoc_lai', 'hoc_lai'], ['sang_ft', 'sang_ft'], ['chuyen_lop', 'chuyen_lop'], ['ket_thuc', 'ket_thuc']]) {
      assert(d.LY_DO_DONG_NHAN[lyDo] === d.END_KIND_LABEL[endKind], `${lyDo}: ${d.LY_DO_DONG_NHAN[lyDo]} ≠ ${d.END_KIND_LABEL[endKind]}`);
    }
    assert(d.HUONG_TIEP_TK.every((k: string) => typeof d.HUONG_TIEP_TK_NHAN[k] === 'string'), 'nhãn hướng tiếp đủ');
  });
  check('TK-1 · huongTiep: mọi nhánh', () => {
    assert(d.huongTiep('lo_trinh_moi', 'LT2') === 'len_lt2', 'LT1 → LT2');
    assert(d.huongTiep('lo_trinh_moi', 'LT1') === 'lo_trinh_moi' && d.huongTiep('lo_trinh_moi', null) === 'lo_trinh_moi', 'RF → LT1 / thường');
    assert(d.huongTiep('sang_ft', 'LT1') === 'len_ft' && d.huongTiep('ket_thuc', null) === 'ket_thuc', 'sang_ft / ket_thuc');
    assert(d.huongTiep('hoc_lai', null) === 'hoc_lai' && d.huongTiep('len_lop', null) === 'len_lop' && d.huongTiep('chuyen_lop', null) === 'chuyen_lop', 'giữ nguyên');
    assert(d.huongTiep('sua_tay', null) === 'khong_ro' && d.huongTiep('khong_ro', null) === 'khong_ro', 'không rõ');
  });
  check('TK-1 · ketQuaThiThat: OVR máy tính, so Target; thiếu / không thi / sai điểm', () => {
    const o = { l: 7, r: 6.5, w: 6, s: 6.5, khongThi: false };
    const a = d.ketQuaThiThat(o, 6.5);
    assert(a.ovr === 6.5 && a.ketLuan === 'reached' && a.nhan === 'Đạt Target', JSON.stringify(a));
    const b = d.ketQuaThiThat(o, 7);
    assert(b.ketLuan === 'not_reached' && b.nhan === 'Chưa đạt Target', JSON.stringify(b));
    const c = d.ketQuaThiThat({ ...o, s: null }, 6.5);
    assert(c.ketLuan === 'unknown' && c.nhan === 'Chờ đủ 4 kỹ năng' && c.ovr === null, JSON.stringify(c));
    assert(d.ketQuaThiThat({ l: null, r: null, w: null, s: null, khongThi: false }, 6.5).nhan === 'Chờ kết quả thi thật', 'chưa nhập');
    assert(d.ketQuaThiThat({ ...o, khongThi: true }, 6.5).nhan === 'Không thi', 'không thi bỏ qua điểm');
    assert(d.ketQuaThiThat(o, null).nhan === 'Không có Target' && d.ketQuaThiThat(o, null).ovr === 6.5, 'không cam kết');
    for (const x of [9.5, -1, 6.3]) {
      let loi = false; try { d.ketQuaThiThat({ ...o, l: x }, 6.5); } catch { loi = true; }
      assert(loi, `điểm ${x} phải bị từ chối`);
    }
    assert(d.ketQuaThiThat({ l: 6, r: 6, w: 6, s: 6.5, khongThi: false }, 6).ovr === 6, '6.125 → 6.0');
    assert(d.ketQuaThiThat({ l: 6, r: 6, w: 6.5, s: 6.5, khongThi: false }, 6).ovr === 6.5, '6.25 → 6.5 (lên)');
    assert(d.ketQuaThiThat({ l: 6, r: 6, w: 6.5, s: 6.5, khongThi: false }, 6).ovr === 6.5, '6.25 → 6.5 (lên)');
  });
  check('TK-1 · canChoThiThat: chỉ FT chưa đủ 4 kỹ năng và không "Không thi"', () => {
    const x = { laFt: true, l: null, r: null, w: null, s: null, khongThi: false };
    assert(d.canChoThiThat(x) && d.canChoThiThat({ ...x, l: 6, r: 6, w: 6 }), 'chờ');
    assert(!d.canChoThiThat({ ...x, l: 6, r: 6, w: 6, s: 6 }) && !d.canChoThiThat({ ...x, khongThi: true }) && !d.canChoThiThat({ ...x, laFt: false }), 'hết chờ');
  });
  check('TK-1 · mocNhacThiThat: tháng / tuần / ngày thi / ngày đóng, hạn +4 tuần', () => {
    const m = d.mocNhacThiThat({ thangThi: '2026-09', tuanThi: null, ngayThi: null, ngayDong: null });
    assert(m.tu === '2026-10-05' && m.han === '2026-11-02', JSON.stringify(m));
    assert(d.mocNhacThiThat({ thangThi: '2026-09', tuanThi: '2026-09-21', ngayThi: null, ngayDong: null }).tu === '2026-09-28', 'tuần thi thắng tháng');
    assert(d.mocNhacThiThat({ thangThi: '2026-09', tuanThi: '2026-09-21', ngayThi: '2026-09-10', ngayDong: null }).tu === '2026-09-14', 'ngày thi thắng');
    assert(d.mocNhacThiThat({ thangThi: null, tuanThi: null, ngayThi: null, ngayDong: '2026-09-30' }).tu === '2026-10-05', 'theo ngày đóng');
    assert(d.mocNhacThiThat({ thangThi: null, tuanThi: null, ngayThi: null, ngayDong: null }) === null, 'không có gì → null');
  });
  check('TK-1 · luotDaiDien + khoangTuan', () => {
    assert(d.luotDaiDien([]) === null, 'rỗng');
    const ls = [{ attemptNo: 1, huy: false, overall: 5.5 }, { attemptNo: 2, huy: false, overall: 6 }, { attemptNo: 3, huy: true, overall: null }];
    assert(d.luotDaiDien(ls).attemptNo === 2, 'MT cuối có OVR, bỏ lượt huỷ');
    assert(d.luotDaiDien([ls[2]]).attemptNo === 3, 'không có OVR → MT cuối bất kỳ');
    assert(d.khoangTuan('2026-10-05', null, '2026-10-06') === 'W2 OCT – nay', d.khoangTuan('2026-10-05', null, '2026-10-06'));
    assert(d.khoangTuan(null, null, '2026-10-06') === '—' && /^W\d [A-Z]{3} – W\d [A-Z]{3}$/.test(d.khoangTuan('2026-06-08', '2026-07-20', '2026-10-06')), 'khoảng');
  });

  // ------------------------------------------------------------------ dựng sẵn
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  /** Chạy `fn` trong giao dịch rồi ROLLBACK — phép kiểm không để lại dữ liệu cho phép kiểm sau (bất biến ở cuối). */
  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const { ghiBanChup } = await import('../loTrinh/banChup.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const regular: any = await import('../normal/regular.ts');
  const cuoiKhoa: any = await import('../normal/cuoiKhoa.ts');
  const NGAY = t.TODAY;
  const banChup = (cycleId: number) => all('SELECT * FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan', cycleId);
  const luotCua = (bcId: number) => all('SELECT * FROM ban_chup_luot WHERE ban_chup_id = ? ORDER BY attempt_no, id', bcId);
  /** Lộ trình FT có ≥ `n` lượt, trong đó ≥ 1 lượt có điểm. */
  const ftNhieuLuot = (n: number) => get(
    `SELECT a.cycle_id AS id, c.student_id FROM assessment_attempts a JOIN learning_cycles c ON c.id = a.cycle_id
      WHERE c.route IS NOT NULL AND a.status != 'cancelled' AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.band IS NOT NULL)
      GROUP BY a.cycle_id HAVING COUNT(*) >= ? ORDER BY COUNT(*) DESC LIMIT 1`, n);

  // ------------------------------------------------------------------ TK-2 · bản chụp
  await checkAsync('TK-2 · FT nhiều lượt (có lượt huỷ, huỷ phần): đủ lượt × kỹ năng; SOS / kỳ vọng / OVR bằng đúng hồ sơ cùng lúc', () => thu(() => {
    const fx = ftNhieuLuot(3) ?? ftNhieuLuot(2);
    assert(fx, 'tiền đề: bộ demo có lộ trình FT ≥ 2 lượt có điểm');
    const luot = all('SELECT id, attempt_no FROM assessment_attempts WHERE cycle_id = ? ORDER BY attempt_no, id', fx.id);
    const huyCa = luot.at(-1).id; const huyPhan = luot[0].id;
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancel_reason = 'Thử' WHERE id = ?`).run(huyCa);
    conn.prepare(`UPDATE attempt_skills SET required = 0 WHERE attempt_id = ? AND skill = 'speaking'`).run(huyPhan);
    const [bcId] = ghiBanChup(conn, [fx.id], { lyDo: 'sua_tay', ngay: NGAY });
    const rows = luotCua(bcId);
    assert(rows.length === luot.length * 6, `${luot.length} lượt × (4 kỹ năng + W1 + W2) = ${luot.length * 6}, có ${rows.length}`);
    assert(rows.filter((r) => r.attempt_id === huyCa).every((r) => r.trang_thai === 'cancelled' && r.diem === null && r.ket_qua === 'huy' && r.huy_ly_do === 'Thử'), 'lượt huỷ: không điểm');
    assert(rows.filter((r) => r.attempt_id === huyPhan && r.ky_nang === 'speaking').every((r) => r.bat_buoc === 0 && r.bo_qua === 1), 'huỷ phần S: bỏ qua');
    const hs = (studentProfile(P.admin, fx.student_id, fx.id) as any).attempts;
    for (const a of hs.filter((x: any) => x.id !== huyCa)) {
      const r = rows.find((x) => x.attempt_id === a.id && x.ky_nang === 'listening');
      assert(r && r.ky_vong === a.expectation && r.overall === a.overall && r.sos === a.sosLevel, `MT${a.attemptNo}: ${JSON.stringify([r?.ky_vong, r?.overall, r?.sos])} ≠ ${JSON.stringify([a.expectation, a.overall, a.sosLevel])}`);
      for (const k of ['listening', 'reading', 'writing', 'speaking']) {
        assert(rows.find((x) => x.attempt_id === a.id && x.ky_nang === k).diem === (a.bands?.[k] ?? null), `MT${a.attemptNo} ${k}: điểm lệch hồ sơ`);
      }
    }
    assert(get('SELECT so_luot FROM ban_chup_lo_trinh WHERE id = ?', bcId).so_luot === luot.length, 'so_luot');
  }));
  await checkAsync('TK-2 · lớp thường (FOU…): môn theo chương trình; ty_le_tong / dải khớp cuoiKhoaTheoHocVien', () => thu(() => {
    const fx = get(`SELECT c.id, c.student_id, a.class_id, a.id AS aid FROM learning_cycles c JOIN assessment_attempts a ON a.cycle_id = c.id AND a.kind = 'final' AND a.status != 'cancelled'
                      JOIN enrollments e ON e.student_id = c.student_id AND e.class_id = a.class_id AND e.status = 'active'
                     WHERE c.route IS NULL AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.raw_score IS NOT NULL) LIMIT 1`);
    assert(fx, 'tiền đề: bộ demo có em lớp thường đã có điểm Cuối khoá');
    const prog = regular.programmeOfClass(fx.class_id);
    const [bcId] = ghiBanChup(conn, [fx.id], { lyDo: 'len_lop', ngay: NGAY });
    const bc = get('SELECT * FROM ban_chup_lo_trinh WHERE id = ?', bcId);
    assert(JSON.parse(bc.mon_json).join() === prog.skills.join() && bc.scoring_mode === 'ratio' && bc.programme_code === prog.code, `môn ${bc.mon_json}`);
    const ck = cuoiKhoa.cuoiKhoaTheoHocVien(fx.class_id, [fx.student_id]).get(fx.student_id);
    assert(ck.tyLe !== null && Math.abs(bc.ty_le_cuoi_khoa - ck.tyLe) < 1e-9, `${bc.ty_le_cuoi_khoa} ≠ ${ck.tyLe}`);
    assert(bc.dai_cuoi_khoa === d.daiCuoiKhoa(ck.tyLe) && bc.huong_tiep === 'len_lop' && bc.ket_luan === null, `${bc.dai_cuoi_khoa} ${bc.huong_tiep}`);
    const moLuot = luotCua(bcId).filter((r) => r.attempt_id === fx.aid);
    assert(moLuot.map((r) => r.ky_nang).join() === prog.skills.join() && moLuot.every((r) => r.ty_le_tong !== null), 'dòng kỹ năng của bài Cuối khoá');
  }));
  await checkAsync('TK-2 · ĐÓNG BĂNG: đổi route / Target / đầu vào / môn chương trình / target_at_attempt sau khi ghi → bản chụp không đổi', () => thu(() => {
    const fx = ftNhieuLuot(1);
    const [bcId] = ghiBanChup(conn, [fx.id], { lyDo: 'ket_thuc', ngay: NGAY });
    const anh = () => JSON.stringify([get('SELECT * FROM ban_chup_lo_trinh WHERE id = ?', bcId), luotCua(bcId)]);
    const truoc = anh();
    conn.prepare(`UPDATE learning_cycles SET route = CASE route WHEN 'RF' THEN 'LT1' ELSE 'RF' END, target_score = 9, baseline_score = 1, exam_month = '2031-01' WHERE id = ?`).run(fx.id);
    conn.prepare('UPDATE assessment_attempts SET target_at_attempt = 9 WHERE cycle_id = ?').run(fx.id);
    conn.prepare('DELETE FROM programme_skills WHERE rowid IN (SELECT rowid FROM programme_skills LIMIT 1)').run();
    assert(anh() === truoc, 'bản chụp lệch sau khi đổi hồ sơ');
  }));
  await checkAsync('TK-2 · lộ trình không có lượt: so_luot = 0, không dòng ban_chup_luot; gọi hai lần → lan 1 và 2', () => thu(() => {
    const sid = get('SELECT student_id FROM learning_cycles LIMIT 1').student_id;
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, started_at, status, created_at) VALUES (?, 99, ?, 'active', ?)`).run(sid, NGAY, new Date().toISOString()).lastInsertRowid);
    const [a] = ghiBanChup(conn, [cy], { lyDo: 'khong_ro', ngay: NGAY });
    const [b] = ghiBanChup(conn, [cy], { lyDo: 'sua_tay', ngay: NGAY });
    assert(get('SELECT so_luot, lan FROM ban_chup_lo_trinh WHERE id = ?', a).so_luot === 0 && luotCua(a).length === 0, 'rỗng');
    assert(banChup(cy).map((r) => r.lan).join() === '1,2' && b !== a, 'lan 1, 2');
  }));
}
