/** PHÉP KIỂM PR-DH — bảng Học viên & Lớp (Sắp tới, Dự kiến thi) và điều hướng hồ sơ (chủ sản phẩm 03/10, 04/10). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrDhTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-DH · Bảng Học viên & Lớp, điều hướng hồ sơ');
  const goc = { nhanLuot: null, tuanBatDau: null, kyVong: null, conLuotChuaXep: null, duKienThi: null, homNay: '2026-10-03', khung: 'ft' as const };
  const tuan = d.tuanLich('2026-10-12', '2026-10-03');   // phép khớp hàm thật, không đổi hàm cho khớp phép

  check('PR-DH (1) · chuSapToi: còn MT → "MT2 · <tuần> · 5.5"; kỳ vọng null → không số; số luôn một chữ số thập phân', () => {
    const c = (o: object) => d.chuSapToi({ ...goc, ...o });
    assert(c({ nhanLuot: 'MT2', tuanBatDau: '2026-10-12', kyVong: 5.5 }) === `MT2 · ${tuan} · 5.5`, String(c({ nhanLuot: 'MT2', tuanBatDau: '2026-10-12', kyVong: 5.5 })));
    assert(c({ nhanLuot: 'MT2', tuanBatDau: '2026-10-12', kyVong: null }) === `MT2 · ${tuan}`, 'không kỳ vọng');
    assert(c({ nhanLuot: 'MT3', tuanBatDau: '2026-10-12', kyVong: 6 }) === `MT3 · ${tuan} · 6.0`, 'một chữ số thập phân');
    assert(c({ nhanLuot: 'Progress Test', tuanBatDau: '2026-10-12', kyVong: 5.5, khung: 'thuong' }) === `Progress Test · ${tuan}`, 'lớp thường không hiện kỳ vọng');
  });

  check('PR-DH (1) · chuSapToi: còn lượt chưa xếp tuần → "MT2 · chưa xếp"; hết MT → "Thi thật · <dự kiến>"; lớp thường hết mốc → null', () => {
    const c = (o: object) => d.chuSapToi({ ...goc, ...o });
    assert(c({ conLuotChuaXep: 'MT2' }) === 'MT2 · chưa xếp', 'chưa xếp');
    assert(c({ duKienThi: { confidence: 'week', label: 'W2 DEC' } }) === 'Thi thật · W2 DEC', 'tuần');
    assert(c({ duKienThi: { confidence: 'month', label: 'DEC 2026' } }) === 'Thi thật · DEC 2026', 'tháng');
    assert(c({ duKienThi: { confidence: 'none', label: 'Chưa xác định' } }) === 'Thi thật · chưa có ngày', 'chưa có');
    assert(c({}) === 'Thi thật · chưa có ngày', 'không có dữ liệu thi');
    assert(c({ khung: 'thuong' }) === null, 'lớp thường hết mốc → null (giữ "—")');
  });

  check('PR-DH (9) · khoaLopThuong: em chưa có quyết định chuyển lớp luôn có chữ cờ, kể cả khi đã ghi lộ trình tiếp theo', () => {
    const g = { maChuongTrinh: 'FOU', tuanHienTai: 10, tongTuan: 10, tuanKetThuc: '2026-10-12', homNay: '2026-10-04' };
    const co = d.CHU_CHUYEN_LOP.chua.toLowerCase();
    const phu = (o: object) => d.khoaLopThuong({ ...g, tiepTheo: null, ...o }).phu ?? '';
    assert(phu({ nhacLoTrinh: true }).includes(co), 'chưa ghi lộ trình');
    assert(phu({ tiepTheo: 'BE', nhacLoTrinh: true }).includes(co), 'đã ghi lộ trình, chưa có quyết định');
    assert(/tiếp theo: BE/.test(phu({ tiepTheo: 'BE', nhacLoTrinh: true })), 'vẫn giữ lộ trình đã ghi');
    assert(!phu({ tiepTheo: 'BE', nhacLoTrinh: false }).includes(co), 'em đã có quyết định: không cờ');
    assert(phu({ choDuyetChuyen: true, nhacLoTrinh: false }).includes('chờ QL duyệt'), 'đề xuất đang chờ duyệt');
    assert(/^kết thúc /.test(phu({})), 'không cờ, không lộ trình: giữ "kết thúc …"');
  });

  check('PR-DH (3) · keBen: giữa / đầu / cuối / không có trong danh sách / danh sách một em', () => {
    const ds = [7, 3, 9, 1];
    assert(JSON.stringify(d.keBen(ds, 3)) === JSON.stringify({ truoc: 7, sau: 9, viTri: 2, tong: 4 }), JSON.stringify(d.keBen(ds, 3)));
    assert(JSON.stringify(d.keBen(ds, 7)) === JSON.stringify({ truoc: null, sau: 3, viTri: 1, tong: 4 }), 'đầu');
    assert(JSON.stringify(d.keBen(ds, 1)) === JSON.stringify({ truoc: 9, sau: null, viTri: 4, tong: 4 }), 'cuối');
    assert(d.keBen(ds, 42) === null && d.keBen([], 1) === null, 'không có');
    assert(JSON.stringify(d.keBen([5], 5)) === JSON.stringify({ truoc: null, sau: null, viTri: 1, tong: 1 }), 'một em');
  });

  check('PR-DH (3) · docNguCanhDs: chỉ nhận danh sách đúng dạng, đúng loại, có chứa id đang xem (dữ liệu từ sessionStorage/state là dữ liệu ngoài)', () => {
    const ok = { loai: 'hoc-vien', ids: [4, 8, 9], nhan: 'Học viên & Lớp' };
    assert(JSON.stringify(d.docNguCanhDs(ok, 'hoc-vien', 8)) === JSON.stringify(ok), 'hợp lệ');
    for (const [x, loai, id, vi] of [
      [ok, 'lop', 8, 'sai loại'], [ok, 'hoc-vien', 5, 'id không có trong ds'], [null, 'hoc-vien', 8, 'null'], ['x', 'hoc-vien', 8, 'chuỗi'],
      [{ ...ok, ids: '4,8' }, 'hoc-vien', 8, 'ids không phải mảng'], [{ ...ok, ids: [4, '8'] }, 'hoc-vien', 4, 'phần tử không phải số'],
      [{ ...ok, ids: [4, -1, 8] }, 'hoc-vien', 8, 'id âm'], [{ ...ok, nhan: 7 }, 'hoc-vien', 8, 'nhãn không phải chữ'],
    ] as const) assert(d.docNguCanhDs(x, loai, id) === null, `phải từ chối: ${vi}`);
  });

  check('PR-DH (3)(4) · hồ sơ HV và hồ sơ lớp dùng ThanhTruocSau; danh sách đi qua link tên em / tên lớp', () => {
    assert(/<ThanhTruocSau loai="hoc-vien"/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'hồ sơ HV');
    assert(/<ThanhTruocSau loai="lop"/.test(doc('web/src/modules/classes/DauTrangLop.tsx')), 'hồ sơ lớp (DH-4)');
    for (const f of ['students/BangHocVienLop', 'students/ClassRoster', 'classes/BangDiemLopThuong']) {
      assert(/to=\{`\/hoc-vien\/\$\{s\.id\}`\}[^>]*state=\{\{ ds \}\}/.test(doc(`web/src/modules/${f}.tsx`)), `${f}: link tên em phải mang state.ds`);
    }
    const sp = doc('web/src/modules/students/StudentsPage.tsx');
    assert(/state=\{\{ ds: dsLop \}\}/.test(sp) && /ds: dsLop/.test(sp), 'link Hồ sơ lớp mang danh sách lớp');
    const t = doc('web/src/ui/ThanhTruocSau.tsx');
    assert(/replace: true/.test(t) && /sessionStorage/.test(t) && /docNguCanhDs/.test(t) && /dsDuPhong/.test(t), 'replace + sessionStorage + kiểm dữ liệu ngoài + danh sách dự phòng');
  });

  check('PR-DH (7) · MissingBadge: popover vẽ bằng portal + fixed, lật lên được, đóng bằng Esc/cuộn, hết tooltip đè khi mở', () => {
    const m = doc('web/src/modules/students/MissingBadge.tsx').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    assert(/createPortal/.test(m) && /fixed/.test(m) && /getBoundingClientRect/.test(m) && /Escape/.test(m) && /aria-expanded/.test(m), 'portal + fixed + vị trí + Esc + aria-expanded');
    assert(!/absolute z-20/.test(m), 'không còn hộp absolute z-20 trong ô bảng');
    assert(/title=\{open \? undefined/.test(m), 'bỏ title khi đang mở');
    assert(/stopPropagation/.test(m), 'chặn nổi bọt qua portal');
  });

  check('PR-DH (11) · ViecTiep: chữ việc không cắt (PR-KHUNG G3: chạy liền, chật thì xuống dòng; HK2 C37: chỉ `sm:line-clamp-2`, < 640 px đủ chữ); title giữ câu đủ', () => {
    const v = doc('web/src/ui/ViecTiep.tsx').replace(/\/\*[\s\S]*?\*\//g, '');
    assert(/className="break-words"/.test(v) && !/truncate/.test(v) && !/(^|[\s"'`])line-clamp/.test(v) && /title=\{v\.title\}/.test(v), 'ViecTiep');
  });

  check('PR-DH (12) · J10: ô điểm chưa có dữ liệu chỉ gạch (title "Chưa có điểm"), thẻ gọn không "—" cạnh "chưa có điểm"', () => {
    const sb = doc('web/src/modules/cases/SkillBoard.tsx');
    assert(!/mt-0\.5">\s*chưa có dữ liệu/.test(sb) && /title="Chưa có điểm">—/.test(sb), 'ScoreCell');
    const tk = doc('web/src/modules/cases/TheKyNang.tsx');
    assert(/row\.band === null \? null/.test(tk) && /diem !== null &&/.test(tk), 'TheGon');
  });

  check('PR-DH (13) · khung toàn màn (KhungPanel, Modal/ConfirmDialog) có !mt-0 — không bị space-y của trang cha đẩy lệch xuống, lộ demo bar', () => {
    for (const f of ['web/src/ui/KhungPanel.tsx', 'web/src/ui/Drawer.tsx']) {
      assert(/fixed inset-0 !mt-0 /.test(doc(f)), `${f}: gốc fixed inset-0 phải có !mt-0`);
    }
  });

  check('PR-DH (2) · Học viên & Lớp: cả hai nhóm có cột "Dự kiến thi" (ExamPlanText ở bảng và thẻ), 8 cột khớp hàng lớp', () => {
    const sp = doc('web/src/modules/students/StudentsPage.tsx');
    assert(sp.includes("k === 'ft' ? 'Target' : 'Khoá', 'Dự kiến thi', 'Sắp tới', 'Case', 'Việc tiếp theo', ''"), 'tieuDeCot: Dự kiến thi sau Target/Khoá, không phân nhánh theo nhóm');
    assert(/colSpan=\{4\}/.test(sp) && /soCot=\{8\}/.test(sp) && (sp.match(/min-w-\[960px\]/g) ?? []).length === 2, 'hàng lớp 3+4+1 cột, bảng min-w 960');
    const bg = doc('web/src/modules/students/BangHocVienLop.tsx');
    assert((bg.match(/<ExamPlanText plan=\{s\.examPlan\}/g) ?? []).length === 2 && /chuSapToi\(/.test(bg), 'ExamPlanText ở bảng + thẻ, Sắp tới qua chuSapToi');
  });

  check('PR-DH (6) · bảng điểm lớp thường: cột Target + Dự kiến thi ở bảng và thẻ điện thoại, không so điểm', () => {
    const b = doc('web/src/modules/classes/BangDiemLopThuong.tsx');
    assert(/TargetText/.test(b) && /ExamPlanText/.test(b), 'dùng TargetText + ExamPlanText');
    assert(/>Target<\/th>/.test(b) && />Dự kiến thi<\/th>/.test(b), 'tiêu đề cột bảng');
    assert(/nhan: 'Target'/.test(b) && /nhan: 'Dự kiến thi'/.test(b), 'dòng thẻ điện thoại');
    assert(!/fmtBand|kyVong/.test(b), 'lớp thường chỉ theo dõi Target, không so với điểm');
  });

  await checkAsync('PR-DH (6) · roster lớp thường trả cycle.target + examPlan; em không có chu kỳ → cycle null, examPlan none, không lỗi', async () => {
    const cls: any = await import('../classes/classes.ts');
    const lop = t.classId('MB FOU 12');
    const rows = cls.classRoster(P.admin, lop) as any[];
    assert(rows.length > 0, 'lớp có học viên');
    for (const r of rows) {
      assert('cycle' in r && r.examPlan && ['none', 'month', 'week'].includes(r.examPlan.confidence), `${r.fullName}: ${JSON.stringify([r.cycle, r.examPlan])}`);
      if (r.cycle === null) assert(r.examPlan.confidence === 'none', 'không chu kỳ → none');
    }
  });

  await checkAsync('PR-DH (1) · standingFor: nextKyVong = kỳ vọng của lượt kế tiếp; bỏ tuần lượt đó thì hết kỳ vọng và nhanLuotChuaXep = nhãn lượt', async () => {
    const { standingFor } = await import('../students/standing.ts');
    const { expectationFor } = await import('../fasttrack/scoring.ts');
    const thuHai = d.mondayOfDate(TODAY);   // chỉ để lọc ứng viên; chọn cuối cùng dựa vào standingFor
    const ung = conn.prepare(
      `SELECT a.id, a.student_id AS sid, a.attempt_no AS no, a.planned_period_id AS pid, a.target_at_attempt AS tgt, cy.target_score AS ct, cy.route AS cr
         FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.status = 'planned' AND a.lich_su = 0 AND a.kind = 'mock' AND cy.status = 'active' AND cy.target_score IS NOT NULL AND cy.khong_cam_ket = 0 AND pr.week_start >= ?
        ORDER BY a.id`).all(thuHai) as any[];
    /* Lấy đúng em mà `standingFor` nói lượt kế tiếp là lượt này và em chưa có lượt nào bỏ tuần (cùng hàm `mocKeTiep`, không tự suy lại ngày). */
    const c = ung.find((r) => {
      const st = standingFor([r.sid]).get(r.sid)!;
      return st.nextAttemptNo === r.no && st.nhanLuotChuaXep === null;
    });
    assert(c, 'seed: cần một em FT có lượt MT kế tiếp đã xếp tuần và có Target');
    const truoc = standingFor([c.sid]).get(c.sid)!;
    assert(truoc.nextAttemptNo === c.no, `lượt kế tiếp ${truoc.nextAttemptNo} ≠ ${c.no}`);
    const mong = expectationFor(c.tgt ?? c.ct, c.no, c.cr);
    assert(mong !== null && truoc.nextKyVong === mong, `nextKyVong ${truoc.nextKyVong} ≠ ${mong}`);
    assert(truoc.nhanLuotChuaXep === null, 'đã xếp tuần thì không "chưa xếp"');
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = NULL WHERE id = ?`).run(c.id);
    try {
      const sau = standingFor([c.sid]).get(c.sid)!;
      assert(sau.nhanLuotChuaXep === `MT${c.no}`, `nhanLuotChuaXep ${sau.nhanLuotChuaXep}`);
      assert(sau.nextAttemptNo !== c.no, 'lượt bỏ tuần không còn là mốc kế tiếp');
    } finally {
      conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?`).run(c.pid, c.id);
    }
  });
}
