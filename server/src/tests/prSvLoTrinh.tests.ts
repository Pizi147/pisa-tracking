/**
 * PHÉP KIỂM P7 SV-LO-TRINH (plan.md 1.6 N11, N12, N22 ⑤; thiết kế 24/10 mục 3.1–3.3, E1–E3, E9, E10):
 *  · một nút "Tạm dừng/ Kết thúc học" mọi nơi, cả hai vào Lưu trữ, Quay lại học từ Lưu trữ;
 *  · Bước tiếp sau thi còn 2 hướng; Lộ trình mới LT1 / LT2 / RF / Khác, đầu vào = KQ thi thật, Case / PA cũ đóng "Kết thúc lộ trình".
 */
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSvLoTrinhTests(t: { check: any; assert: any; conn: any; P: any; TODAY: string; classId: (c: string) => number; addDays: any }) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { migratePrSvLoTrinh } = await import('../migrate/prSvLoTrinh.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nP7 SV-LO-TRINH — một nút Tạm dừng/ Kết thúc học, Quay lại học, Bước tiếp 2 hướng, Lộ trình mới');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /** Chạy trong giao dịch rồi cuộn lại — phép kiểm không để dấu trên DB chung. */
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const keys = (ds: any[]) => ds.map((m) => m.key).join();

  // ------------------------------------------------------------------ Task 1: luật thuần
  const QL = { ghiLoTrinhTiep: false, chuyenLop: true, tamDung: true, quayLai: true, ketThuc: true, luuTru: true, boLuuTru: false, hocLai: true };
  check('SV-1 · menu ⋯: MỘT mục "Tạm dừng/ Kết thúc học" (đang học / tạm dừng); Quay lại học cho em tạm dừng hoặc đã kết thúc; không còn Lưu trữ / Bỏ lưu trữ / Học lại', () => {
    const dang = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: QL }, cycle: { ratio: false }, status: 'active' });
    assert(dang.slice(0, 3).map((m: any) => m.key).join() === 'info,chuyen-lop,tam-dung-ket-thuc', keys(dang));
    assert(dang.find((m: any) => m.key === 'tam-dung-ket-thuc').nhan === 'Tạm dừng/ Kết thúc học', 'đúng chữ chủ SP');
    for (const k of ['luu-tru', 'bo-luu-tru', 'hoc-lai', 'tam-dung-thoi-hoc']) assert(!keys(dang).split(',').includes(k), `còn ${k}`);
    assert(!keys(dang).includes('quay-lai'), 'đang học: không Quay lại học');
    const dung = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { chiXem: true, quyen: QL }, cycle: { ratio: false }, status: 'inactive' });
    assert(keys(dung).includes('tam-dung-ket-thuc') && keys(dung).includes('quay-lai'), `tạm dừng: ${keys(dung)}`);
    /* [ĐX] em tạm dừng (Lưu trữ) vẫn Sửa thông tin liên hệ — TVV gọi mời học lại. */
    assert(keys(dung).split(',')[0] === 'info' && !keys(dung).split(',').includes('lo-trinh') && !keys(dung).includes('outcome') && !keys(dung).includes('chuyen-lop'), `tạm dừng chỉ xem trừ 3 việc: ${keys(dung)}`);
    const xong = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { chiXem: true, quyen: { ...QL, tamDung: false, ketThuc: false } }, cycle: { ratio: false }, status: 'finished' });
    assert(keys(xong) === 'quay-lai,lich-su-sua', `kết thúc + lưu trữ: ${keys(xong)}`);
    assert(d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: { ...QL, hocLai: false } }, cycle: null, status: 'finished' }).every((m: any) => m.key !== 'quay-lai'), 'không quyền Học lại → không Quay lại học');
    assert(d.NHAN_VIEC_QUAN_LY['quay-lai'] === 'Quay lại học', 'nhãn Quay lại học');
    const vai = (status: string) => keys(d.mucDongTheoVai({ suaThongTin: true, suaThem: true, ft: true, status }));
    assert(vai('active') === 'info,tam-dung-ket-thuc,outcome', `⋯ theo vai: ${vai('active')}`);
    assert(d.coTheTamDungKetThuc(QL, 'active').tamDung && d.coTheTamDungKetThuc(QL, 'active').ketThuc, 'đang học: cả hai');
    assert(!d.coTheTamDungKetThuc(QL, 'inactive').tamDung && d.coTheTamDungKetThuc(QL, 'inactive').ketThuc, 'tạm dừng: chỉ Kết thúc học');
    assert(!d.coTheTamDungKetThuc(QL, 'finished').ketThuc, 'đã kết thúc: không');
  });

  check('SV-2 · Bước tiếp 2 hướng: goiYSauThi Đạt → "dung", chưa đạt / Không thi → Lộ trình mới, không Target → null; không trả hoc_lai (E9)', () => {
    assert(d.HUONG_SAU_THI.join() === 'dung,lo_trinh_moi', 'hai hướng trên web');
    assert(d.goiYSauThi({ khongThi: false, ketLuan: 'reached' }) === 'dung', 'Đạt');
    assert(d.goiYSauThi({ khongThi: false, ketLuan: 'not_reached' }) === 'lo_trinh_moi', 'Chưa đạt');
    assert(d.goiYSauThi({ khongThi: true, ketLuan: 'unknown' }) === 'lo_trinh_moi', 'Không thi');
    assert(d.goiYSauThi({ khongThi: false, ketLuan: 'unknown' }) === null, 'không Target');
    assert(d.NHAN_HUONG_SAU_THI.dung === 'Tạm dừng/ Kết thúc học' && d.NHAN_SAU_THI.ket_thuc === 'Kết thúc học', 'nhãn');
    /* dữ liệu cũ vẫn đọc được */
    assert(['hoc_tiep', 'hoc_lai', 'tam_dung', 'ket_thuc', 'lo_trinh_moi'].every((k) => typeof d.NHAN_SAU_THI[k] === 'string'), 'đủ nhãn dữ liệu cũ');
  });

  check('SV-3a · route Khác: ROUTES + ROUTE_NAME, tên hiển thị dùng route_ten; lý do đóng Case "Kết thúc lộ trình"', () => {
    assert(d.ROUTES.includes('KHAC') && d.ROUTE_NAME.KHAC === 'Khác', 'route KHAC');
    assert(d.tenRoute({ route: 'KHAC', route_ten: 'Luyện Speaking 1–1' }) === 'Luyện Speaking 1–1' && d.tenRoute({ route: 'KHAC' }) === 'Khác' && d.tenRoute({ route: 'LT2' }) === 'LT2', 'tên');
    assert(d.SYSTEM_CLOSE_REASON_LABEL.ket_thuc_lo_trinh === 'Kết thúc lộ trình', 'lý do Case');
  });

  check('SV-3b · migrate prSvLoTrinh: em Tạm dừng cũ → archived_at = ngày pause gần nhất (không có → updated_at / hôm nay); chạy hai lần không đổi thêm; cột route_ten, route KHAC (ngừng — không mở lớp)', () => thu(() => {
    const sid = get(`SELECT s.id FROM students s WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`).id;
    const sid2 = get(`SELECT s.id FROM students s WHERE s.status = 'active' AND s.archived_at IS NULL AND s.id != ? ORDER BY s.id LIMIT 1`, sid).id;
    conn.prepare(`UPDATE students SET status = 'inactive', archived_at = NULL WHERE id IN (?, ?)`).run(sid, sid2);
    conn.prepare(`INSERT INTO journey_events (student_id, event_type, event_date, title, created_at) VALUES (?, 'pause', '2026-08-03', 'Tạm dừng học', ?), (?, 'pause', '2026-09-01', 'Tạm dừng học', ?)`)
      .run(sid, TODAY, sid, TODAY);
    conn.prepare(`DELETE FROM journey_events WHERE student_id = ? AND event_type = 'pause'`).run(sid2);
    const lan1: string[] = [];
    migratePrSvLoTrinh(conn, lan1);
    assert(get('SELECT archived_at FROM students WHERE id = ?', sid).archived_at === '2026-09-01', 'ngày pause gần nhất');
    const a2 = get('SELECT archived_at FROM students WHERE id = ?', sid2).archived_at as string | null;
    assert(!!a2 && /^\d{4}-\d{2}-\d{2}$/.test(a2), `không có pause → có ngày: ${a2}`);
    assert(lan1.some((x) => /Tạm dừng/.test(x)), `lần 1 in dòng: ${lan1.join(' | ')}`);
    assert((conn.prepare('SELECT name FROM pragma_table_info(?)').all('learning_cycles') as any[]).some((c) => c.name === 'route_ten'), 'cột route_ten');
    const khac = get(`SELECT status FROM routes WHERE code = 'KHAC'`);
    assert(khac?.status === 'inactive', 'route KHAC ngừng (không chọn khi mở lớp)');
    const truoc = JSON.stringify(conn.prepare(`SELECT id, archived_at FROM students ORDER BY id`).all());
    const lan2: string[] = [];
    migratePrSvLoTrinh(conn, lan2);
    assert(lan2.length === 0 && JSON.stringify(conn.prepare(`SELECT id, archived_at FROM students ORDER BY id`).all()) === truoc, `lần 2 không đổi: ${lan2.join(' | ')}`);
  }));
}
