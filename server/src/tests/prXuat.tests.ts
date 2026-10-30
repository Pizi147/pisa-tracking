/** PHÉP KIỂM PR-XUAT — xuất Excel kết quả Test (T40, K4-35, K5-35, YC-13.9). Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrXuatTests(t: YThucTestKit) {
  const { check, checkAsync, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-XUAT · Xuất Excel kết quả Mock Test');

  // ------------------------------------------------------------------ khối 1: luật thuần
  check('PR-XUAT (1) · docBoLocXuatMt: câu lỗi tiếng Việt cho mọi tham số sai; bộ lọc sạch (bỏ trùng) cho mỗi kiểu thời gian', () => {
    const tuan = { tg: 'tuan', tu: '2026-09-07', den: '2026-09-28' };
    const sai = (o: Record<string, unknown>, re: RegExp) => {
      const r = d.docBoLocXuatMt(o);
      assert(typeof r === 'string' && re.test(r), `${JSON.stringify(o)} → ${JSON.stringify(r)}`);
    };
    sai({ tg: 'tuan', tu: '2026-09-28', den: '2026-09-07' }, /trước hoặc bằng/);
    sai({ tg: 'tuan', tu: '2026-09-08', den: '2026-09-28' }, /thứ Hai/);           // thứ Ba
    sai({ tg: 'tuan', tu: '2026-02-30', den: '2026-09-28' }, /thứ Hai/);           // ngày không tồn tại
    sai({ tg: 'thang', tu: '2026-13', den: '2026-12' }, /YYYY-MM/);
    sai({ tg: 'tuan', tu: '2026-01-05', den: '2028-01-10' }, /104 tuần/);           // 105 tuần
    sai({ tg: 'thang', tu: '2026-01', den: '2028-01' }, /24 tháng/);
    sai({ tg: 'dot', dot: 'mt:9' }, /MT1 đến MT8/);
    sai({ tg: 'dot', dot: 'giua' }, /MT1 đến MT8/);                                // Progress Test ở khung FT
    sai({ tg: 'dot', dot: 'mt:1', khung: 'thuong' }, /Progress Test, Checkpoint và Final Test/);
    sai({ tg: 'dot', dot: '' }, /ít nhất một đợt/);
    sai({ ...tuan, chiNhanh: 'abc' }, /Chi nhánh không hợp lệ/);
    sai({ ...tuan, lop: '-1' }, /Lớp không hợp lệ/);
    sai({ ...tuan, chiNhanh: Array.from({ length: 51 }, (_, i) => i + 1).join(',') }, /tối đa 50/);
    sai({ ...tuan, khung: 'x' }, /Khung/);
    sai({ ...tuan, cot: 'x' }, /Cột/);
    sai({}, /cách lọc thời gian/);

    const a = d.docBoLocXuatMt({ ...tuan, chiNhanh: '1,2,2', lop: [3, '3', 4], du: '1', cot: 'day-du' });
    assert(typeof a !== 'string' && a.chiNhanh.join() === '1,2' && a.lop.join() === '3,4' && a.chiDuDiem && a.cot === 'day-du'
      && a.khung === 'ft' && a.thoiGian.kieu === 'tuan', JSON.stringify(a));
    const b = d.docBoLocXuatMt({ tg: 'thang', tu: '2026-09', den: '2026-11' });
    assert(typeof b !== 'string' && b.thoiGian.kieu === 'thang' && !b.chiDuDiem && b.cot === 'gon', JSON.stringify(b));
    const c = d.docBoLocXuatMt({ tg: 'dot', dot: ['mt:1', 'mt:3', 'mt:1'] });
    assert(typeof c !== 'string' && c.thoiGian.kieu === 'dot' && c.thoiGian.dot.join() === 'mt:1,mt:3', JSON.stringify(c));
    const th = d.docBoLocXuatMt({ khung: 'thuong', tg: 'dot', dot: 'giua,cuoi' });
    assert(typeof th !== 'string' && th.khung === 'thuong', JSON.stringify(th));
    // bodyXuatMt → docBoLocXuatMt và queryXuatMt → docBoLocXuatMt trả lại đúng bộ lọc (web gửi, máy chủ đọc)
    const f = a as import('../../../shared/domain/xuatMt.ts').BoLocXuatMt;
    assert(JSON.stringify(d.docBoLocXuatMt(d.bodyXuatMt(f))) === JSON.stringify(f), 'vòng body');
    assert(JSON.stringify(d.docBoLocXuatMt(Object.fromEntries(new URLSearchParams(d.queryXuatMt(f))))) === JSON.stringify(f), 'vòng query');
  });

  const dong = (o: Partial<import('../../../shared/domain/xuatMt.ts').DongFT> = {}): import('../../../shared/domain/xuatMt.ts').DongFT => ({
    ten: 'Nguyễn Minh An', email: 'an.nguyen@gmail.com', chiNhanh: 'Monbay', lop: 'MB FT 101', loTrinh: 'Lộ trình A', mt: 3, tuan: 'W3 SEP 2026', tuanBd: '2026-09-14',
    l: 6, r: 6.5, w: null, s: null, overall: null, target: 7, kyVong: 6.5, sos: 2, trangThai: 'Thiếu điểm 2/4 · SOS tạm thời',
    w1: null, w2: null, tieuChi: { writing1: [null, null, null, null], writing2: [null, null, null, null], speaking: [null, null, null, null] },
    tuanKn: { listening: 'W3 SEP 2026', reading: 'W3 SEP 2026', writing: null, speaking: null }, nguoiNhap: 'Trần Ngọc Hà',
    nhanXet: { listening: null, reading: null, writing1: null, writing2: null, speaking: null }, nhom: null, gvChamS: null, nhanXetPhuTrachS: null, ...o,
  });

  check('PR-XUAT (1) · bangFT: 16 cột gọn đúng thứ tự T40; đầy đủ = 16 + COT_FT_THEM, 16 cột đầu không đổi', () => {
    const gon = d.bangFT([dong()], 'gon');
    assert(gon[0].join('|') === 'Tên|Email|Chi nhánh|Lớp|Lộ trình|MT|Tuần|L|R|W|S|Overall|Target|Kỳ vọng|SOS|Trạng thái lượt', gon[0].join('|'));
    assert(gon[0].length === 16 && gon[1].length === 16 && gon[1][5] === 'MT3', 'gọn 16 cột, MT là chữ MT3');
    const day = d.bangFT([dong()], 'day-du');
    assert(day[0].length === 16 + d.COT_FT_THEM.length && day[1].length === day[0].length, `đầy đủ ${day[0].length} cột`);
    assert(day[0].slice(0, 16).join() === gon[0].join() && day[1].slice(0, 16).join() === gon[1].join(), '16 cột đầu giữ vị trí');
    assert(day[0].includes('W2 TR') && day[0].includes('W1 TA') && day[0].includes('S FC') && day[0].at(-9) === 'Người nhập' && day[0].at(-1) === 'GV chấm S', 'tiêu chí T39, cột nhận xét ở cuối (OV-12b: 5 nhận xét + OV-13k Nhận xét GV phụ trách S + Nhóm + GV chấm S)');
  });

  check('PR-XUAT (1) · ô thiếu là null (không "—", không ""); điểm là number; KCK → Target "KCK", Kỳ vọng/SOS null', () => {
    const [, r] = d.bangFT([dong()], 'gon');
    assert(r[9] === null && r[10] === null && r[11] === null, `W/S/Overall thiếu phải null: ${JSON.stringify(r.slice(9, 12))}`);
    assert(typeof r[7] === 'number' && typeof r[8] === 'number' && r[7] === 6, 'L, R là số');
    assert(!r.some((x) => x === '—' || x === ''), 'không ô nào là "—" hay ""');
    const kck = d.bangFT([dong({ target: 'KCK', kyVong: null, sos: null })], 'gon')[1];
    assert(kck[12] === 'KCK' && kck[13] === null && kck[14] === null, JSON.stringify(kck.slice(12, 15)));
    const day = d.bangFT([dong()], 'day-du')[1];
    assert(day.slice(16).every((x) => x === null || typeof x === 'string' || typeof x === 'number'), 'đầy đủ chỉ chữ/số/null');
  });

  check('PR-XUAT (1) · trangThaiLuotXuat: đủ · thiếu · chưa có · lịch sử + thiếu · huỷ phần + tạm thời (KCK bỏ "SOS tạm thời")', () => {
    const b = { coDiem: 4, yeuCau: 4, du: true, lichSu: false, huyPhan: false, tamThoi: false, kck: false };
    assert(d.trangThaiLuotXuat(b) === 'Đủ điểm', 'đủ');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 2, du: false }) === 'Thiếu điểm 2/4', 'thiếu');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 0, du: false }) === 'Chưa có điểm', 'chưa có');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 2, du: false, lichSu: true }) === 'Thiếu điểm 2/4 · MT cũ', 'MT cũ');   // PR-MTa: "lịch sử" → "MT cũ"
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 3, yeuCau: 3, du: false, huyPhan: true, tamThoi: true }) === 'Thiếu điểm 3/3 · đã huỷ phần còn lại · SOS tạm thời', 'huỷ phần');
    assert(d.trangThaiLuotXuat({ ...b, coDiem: 2, du: false, tamThoi: true, kck: true }) === 'Thiếu điểm 2/4 · không cam kết', 'KCK');
  });

  check('PR-XUAT (1) · tenTepXuatMt chỉ [A-Za-z0-9_.-]; bỏ dấu; > 3 chi nhánh → "4-chi-nhanh"; không chọn → "tat-ca"; đợt liền → MT1-MT3', () => {
    const tg = { kieu: 'tuan' as const, tu: '2026-09-07', den: '2026-09-28' };
    const a = d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: ['Cầu Giấy'], lopMa: [], thoiGian: tg });
    assert(a === 'PISA-Tracking_MT_Cau-Giay_W2SEP-W1OCT.xlsx', a);   // 28/09/2026: thứ Năm của tuần đó là 01/10 → W1 OCT
    assert(/^[A-Za-z0-9_.-]+$/.test(a), 'ASCII');
    assert(d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: ['a', 'b', 'c', 'd'], lopMa: [], thoiGian: tg }).includes('_4-chi-nhanh_'), '4 chi nhánh');
    assert(d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: [], lopMa: [], thoiGian: tg }).includes('_tat-ca_'), 'tất cả');
    assert(d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: [], lopMa: ['MB FT 101'], thoiGian: { kieu: 'dot', dot: ['mt:3', 'mt:1', 'mt:2'] } })
      === 'PISA-Tracking_MT_MB-FT-101_MT1-MT3.xlsx', 'lớp + đợt');
    assert(d.tenTepXuatMt({ khung: 'thuong', chiNhanhTen: [], lopMa: [], thoiGian: { kieu: 'dot', dot: ['giua', 'cuoi'] } })
      === 'PISA-Tracking_Test-lop-thuong_tat-ca_Progress-Test-Final-Test.xlsx', 'lớp thường');
    assert(d.tenTepXuatMt({ khung: 'ft', chiNhanhTen: [], lopMa: [], thoiGian: { kieu: 'thang', tu: '2026-09', den: '2026-11' } })
      .endsWith('_2026-09-den-2026-11.xlsx'), 'tháng');
  });

  check('PR-XUAT (1) · dongXemTruoc theo mẫu M11; bangBoLoc + moTaBoLoc: đủ mục, lớp thường không nhắc SOS/Overall (T58)', () => {
    const x = d.dongXemTruoc(dong(), '2026-09-29');
    assert(x === 'Nguyễn Minh An · MB FT 101 · MT3 · W3 SEP · L 6.0 · R 6.5 · W — · S — · SOS 2 tạm thời', x);
    const f = d.docBoLocXuatMt({ tg: 'tuan', tu: '2026-09-07', den: '2026-09-28', cot: 'day-du' }) as import('../../../shared/domain/xuatMt.ts').BoLocXuatMt;
    const moTa = d.moTaBoLoc(f, { chiNhanh: ['Monbay'], lop: [] });
    const bl = d.bangBoLoc({ khung: 'ft', nguoiXuat: 'Nguyễn Khánh Vy', luc: '2026-09-29T03:05:00.000Z', moTa, soLuot: 312 });
    const chu = bl.map((r) => r.join(' | ')).join('\n');
    assert(bl[0].join() === 'Mục,Giá trị' && chu.includes('Lúc | 29/09/2026 10:05'), chu);
    assert(/Chi nhánh \| Monbay/.test(chu) && /Lớp \| Mọi lớp trong phạm vi/.test(chu) && /Thời gian \| Theo tuần: W2 SEP 2026 – W1 OCT 2026/.test(chu)
      && /Lượt \| Mọi lượt/.test(chu) && /Cột \| Cột đầy đủ/.test(chu) && /Số lượt \| 312/.test(chu), chu);
    assert(/tuần sớm nhất/.test(chu) && /SOS: 0 = đạt kỳ vọng/.test(chu) && /Ô trống = chưa có điểm/.test(chu), 'cách đọc FT');
    assert(bl.find((r) => r[0] === 'Số lượt')![1] === 312, 'số lượt là số');
    const th = d.bangBoLoc({ khung: 'thuong', nguoiXuat: 'A', luc: '2026-09-29T03:05:00.000Z', moTa, soLuot: 1 }).map((r) => r.join(' ')).join('\n');
    assert(!/SOS|Overall/.test(th), 'lớp thường không có chữ SOS/Overall');
  });

  await checkAsync('PR-XUAT (1) · Excel mở đúng dấu: dựng sổ bằng xlsx ở Node → đọc lại — tên sheet có dấu, ô chữ, ô số, ô thiếu không tồn tại', async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d.bangFT([dong()], 'gon')), 'Mock Test');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d.bangBoLoc({
      khung: 'ft', nguoiXuat: 'Nguyễn Khánh Vy', luc: '2026-09-29T03:05:00.000Z', moTa: [], soLuot: 1,
    })), 'Bộ lọc đã dùng');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const doc = XLSX.read(buf);
    assert(doc.SheetNames.join() === 'Mock Test,Bộ lọc đã dùng', doc.SheetNames.join());
    const ws = doc.Sheets['Mock Test'];
    assert(ws['A2'].v === 'Nguyễn Minh An' && ws['A2'].t === 's' && ws['B2'].v === 'an.nguyen@gmail.com', 'ô tên giữ dấu, cột 2 là email (OV-13f)');
    assert(ws['H2'].t === 'n' && ws['H2'].v === 6 && ws['I2'].t === 'n', 'điểm L, R là ô số');
    assert(ws['J2'] === undefined && ws['K2'] === undefined && ws['L2'] === undefined, 'W/S/Overall thiếu → không có ô (không phải chuỗi rỗng)');
    assert(doc.Sheets['Bộ lọc đã dùng']['B2'].v === 'Nguyễn Khánh Vy', 'sheet Bộ lọc giữ dấu');
  });

  await mayChu(t);
}

// ==================================================================== khối 2: máy chủ
async function mayChu(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const xm = await import('../phanTich/xuatMt.ts');
  const nguCanh = await import('../platform/nguCanhRequest.ts');
  const skillSchedule = await import('../fasttrack/skillSchedule.ts');
  const { ensurePeriod } = await import('../platform/week.ts');
  const { navOf } = await import('../platform/nav.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  type BoLoc = import('../../../shared/domain/xuatMt.ts').BoLocXuatMt;

  const TAT_CA_DOT = ['mt:1', 'mt:2', 'mt:3', 'mt:4', 'mt:5', 'mt:6', 'mt:7', 'mt:8'];
  const loc = (o: Record<string, unknown> = {}) => {
    const f = d.docBoLocXuatMt({ tg: 'dot', dot: TAT_CA_DOT.join(','), ...o });
    assert(typeof f !== 'string', String(f));
    return f as BoLoc;
  };
  const loi = (fn: () => unknown): any => { try { fn(); return null; } catch (e: any) { return e; } };
  const mb = conn.prepare(`SELECT id, name FROM branches WHERE code = 'MB'`).get() as { id: number; name: string };
  const bc = conn.prepare(`SELECT id FROM branches WHERE code = 'BC'`).get() as { id: number };
  const mbLop = classId('MB FT 101');
  const cpLop = classId('CP FT 110');
  const hang = (ds: { sheets: { aoa: (string | number | null)[][] }[] }) => ds.sheets[0].aoa.slice(1);

  check('PR-XUAT (2) · phạm vi theo vai: QL chỉ chi nhánh mình, Quản trị mọi chi nhánh, GVCN chỉ lớp mình; GVBM không xuất (K5-35)', () => {
    const q = xm.duLieuXuatMt(P.mbManager, loc());
    assert(hang(q).length > 0 && hang(q).every((r) => r[2] === mb.name), `QL MB: ${hang(q).length} dòng, chi nhánh ${[...new Set(hang(q).map((r) => r[2]))]}`);
    assert(loi(() => xm.duLieuXuatMt(P.mbManager, loc({ chiNhanh: String(bc.id) })))?.status === 403, 'QL MB hỏi BC phải 403');
    assert(loi(() => xm.duLieuXuatMt(P.mbManager, loc({ lop: String(cpLop) })))?.status === 403, 'QL MB hỏi lớp CP phải 403');
    const qt = xm.duLieuXuatMt(P.admin, loc());
    assert(new Set(hang(qt).map((r) => r[2])).size > 1 && qt.phamVi.chiNhanh.length >= 5, 'Quản trị thấy nhiều chi nhánh');

    const core = new Set(P.coreTeacher.assignments.filter((a) => a.isCore).map((a) => a.classId));
    const maCore = new Set((conn.prepare(`SELECT code FROM classes WHERE id IN (${[...core].map(() => '?').join(',')})`).all(...core) as any[]).map((r) => r.code));
    const gv = xm.duLieuXuatMt(P.coreTeacher, loc());
    assert(hang(gv).length > 0 && hang(gv).every((r) => maCore.has(String(r[3]))), `GVCN chỉ thấy lớp mình: ${[...new Set(hang(gv).map((r) => r[3]))]}`);
    assert(!core.has(cpLop) && loi(() => xm.duLieuXuatMt(P.coreTeacher, loc({ lop: String(cpLop) })))?.status === 403, 'GVCN hỏi lớp khác phải 403');
    assert(loi(() => xm.duLieuXuatMt(P.coreTeacher, loc({ chiNhanh: String(bc.id) })))?.status === 403, 'GVCN hỏi chi nhánh khác phải 403');

    /* GVBM: không có lớp chỉ dạy trong phạm vi xuất; nếu người đó kiêm GVCN lớp khác thì chỉ xuất được lớp GVCN đó. */
    const laGvcnKhac = P.subjectTeacher.assignments.some((a) => a.isCore);
    assert(!xm.phamViXuatMt(P.subjectTeacher).lopGvcn.includes(mbLop), 'GVBM không có MB FT 101 trong phạm vi xuất');
    assert(loi(() => xm.duLieuXuatMt(P.subjectTeacher, loc({ lop: String(mbLop) })))?.status === 403, 'GVBM hỏi lớp chỉ dạy phải 403');
    assert(navOf(P.subjectTeacher).xuatMt === laGvcnKhac, `cờ GVBM = ${navOf(P.subjectTeacher).xuatMt}`);
    if (!laGvcnKhac) {
      const e = loi(() => xm.duLieuXuatMt(P.subjectTeacher, loc()));
      assert(e?.status === 403 && /Quản lý, Quản trị và GVCN/.test(e.message), String(e?.message));
    }
    assert(navOf(P.coreTeacher).xuatMt && navOf(P.mbManager).xuatMt && navOf(P.admin).xuatMt, 'GVCN, QL, Quản trị có nút');
    /* GVBM thuần (không GVCN lớp nào — bộ demo: Phạm Thu Trang): không nút, mọi lời gọi 403 câu tiếng Việt. */
    const thuan = conn.prepare(`SELECT DISTINCT user_id AS id FROM teacher_assignments WHERE skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE is_core = 1) LIMIT 1`).get() as any;
    assert(thuan, 'demo thiếu GVBM thuần');
    const gvbm = loadPrincipal(thuan.id);
    assert(!navOf(gvbm).xuatMt && !xm.coPhamViXuat(xm.phamViXuatMt(gvbm)), 'GVBM thuần không có phạm vi xuất');
    const e403 = loi(() => xm.duLieuXuatMt(gvbm, loc()));
    assert(e403?.status === 403 && /Quản lý, Quản trị và GVCN/.test(e403.message), String(e403?.message));
  });

  check('PR-XUAT (2) · tuần của lượt = tuần SỚM NHẤT của kỹ năng phải thi, khác planned_period_id (tuần hoàn tất, muộn nhất) (K4-35b)', () => {
    const a = conn.prepare(
      `SELECT a.id, a.attempt_no, a.planned_period_id, st.email, st.full_name FROM assessment_attempts a JOIN students st ON st.id = a.student_id
        WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled'
          AND (SELECT COUNT(*) FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1) = 4 ORDER BY a.id LIMIT 1`,
    ).get(mbLop) as any;
    assert(a, 'demo thiếu lượt MB FT 101 đủ 4 kỹ năng bắt buộc');
    const goc = conn.prepare('SELECT id, planned_period_id FROM attempt_skills WHERE attempt_id = ?').all(a.id) as any[];
    const tuanX = d.mondayOfDate('2027-03-01'), tuanY = d.mondayOfDate('2027-03-08');
    try {
      const px = ensurePeriod(tuanX).id, py = ensurePeriod(tuanY).id;
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill != 'speaking'`).run(px, a.id);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id = ? AND skill = 'speaking'`).run(py, a.id);
      skillSchedule.recomputeCompletionWeek(a.id, null);
      assert((conn.prepare('SELECT planned_period_id AS p FROM assessment_attempts WHERE id = ?').get(a.id) as any).p === py, 'planned_period_id = tuần muộn nhất');
      const co = (f: BoLoc) => hang(xm.duLieuXuatMt(P.mbManager, f)).some((r) => r[0] === a.full_name && r[1] === a.email && r[5] === `MT${a.attempt_no}`);
      const theoTuan = (x: string, y: string) => loc({ tg: 'tuan', tu: x, den: y, lop: String(mbLop) });
      assert(co(theoTuan(tuanX, tuanX)), 'lọc tuần sớm nhất (X–X) phải CÓ lượt');
      assert(!co(theoTuan(tuanY, tuanY)), 'lọc tuần muộn nhất (Y–Y) phải KHÔNG có lượt');
      assert(co(theoTuan(tuanX, tuanY)), 'X–Y có lượt');
      assert(co(loc({ tg: 'thang', tu: '2027-03', den: '2027-03', lop: String(mbLop) })), 'theo tháng: tháng sở hữu của tuần sớm nhất');
    } finally {
      for (const g of goc) conn.prepare('UPDATE attempt_skills SET planned_period_id = ? WHERE id = ?').run(g.planned_period_id, g.id);
      conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(a.planned_period_id, a.id);
    }
  });

  check('PR-XUAT (2) · nghiệm thu YC-13.9: xem trước = số dòng tệp; đủ điểm giảm đúng; huỷ cả lượt không có; huỷ phần / lịch sử / KCK có nhãn', () => {
    const tuNay = d.mondayOfDate(TODAY);
    const f = loc({ chiNhanh: String(mb.id), tg: 'tuan', tu: addDays(tuNay, -7 * 26), den: addDays(tuNay, 7 * 26) });
    const xt = xm.xemTruoc(P.mbManager, f);
    const xuat = xm.xuatExcel(P.mbManager, f);
    assert(xt.dem.luot > 0 && xt.dem.luot === xuat.sheets[0].aoa.length - 1, `xem trước ${xt.dem.luot} ≠ tệp ${xuat.sheets[0].aoa.length - 1}`);
    assert(xt.dem.hocVien > 0 && xt.dem.lop > 0 && xt.dauDong.length === 5 && xt.tenTep === xuat.tenTep && xt.tenTep.endsWith('.xlsx'), JSON.stringify(xt));
    const du = xm.duLieuXuatMt(P.mbManager, { ...f, chiDuDiem: true });
    const thieu = hang(xuat).filter((r) => !String(r[15]).startsWith('Đủ điểm')).length;
    assert(thieu > 0 && du.dem.luot === xt.dem.luot - thieu, `đủ điểm ${du.dem.luot} = ${xt.dem.luot} − ${thieu}`);
    assert(hang(du).every((r) => String(r[15]).startsWith('Đủ điểm')), 'chỉ lượt đủ điểm');
    assert(xuat.sheets.at(-1)!.ten === 'Bộ lọc đã dùng' && xuat.sheets[0].ten === 'Mock Test', 'tên sheet');

    const tatCa = hang(xm.duLieuXuatMt(P.admin, loc()));
    const nhan = (s: string) => tatCa.filter((r) => String(r[15]).includes(s)).length;
    assert(nhan('đã huỷ phần còn lại') >= 1 && nhan(' · MT cũ') >= 1, `huỷ phần ${nhan('đã huỷ phần còn lại')}, MT cũ ${nhan(' · MT cũ')}`);   // PR-MTa: "MT cũ"
    const kck = tatCa.filter((r) => r[12] === 'KCK');
    assert(kck.length >= 1 && kck.every((r) => r[13] === null && r[14] === null), `KCK ${kck.length}: kỳ vọng/SOS phải trống`);
    /* Lượt huỷ cả lượt: không dòng nào của (học viên, MT) đó — trừ khi em có lượt MT cùng số được tạo lại (không bị huỷ). */
    for (const h of conn.prepare(
      `SELECT a.id, st.email, st.full_name, a.attempt_no FROM assessment_attempts a JOIN students st ON st.id = a.student_id WHERE a.status = 'cancelled' AND a.kind = 'mock'`,
    ).all() as any[]) {
      const taoLai = (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts a2 JOIN assessment_attempts a1 ON a1.student_id = a2.student_id AND a1.attempt_no = a2.attempt_no
        WHERE a1.id = ? AND a2.status != 'cancelled' AND a2.kind = 'mock'`).get(h.id) as any).n;
      assert(taoLai > 0 || !tatCa.some((r) => r[0] === h.full_name && r[1] === h.email && r[5] === `MT${h.attempt_no}`), `lượt huỷ ${h.email} MT${h.attempt_no} không được xuất`);
    }
  });

  check('PR-XUAT (2) · không N+1: số câu SQL của MB một tuần = MB mọi đợt và ≤ 8 (đo ghi Nhật ký)', () => {
    const tuan = (conn.prepare(
      `SELECT pr.week_start w FROM assessment_attempts a JOIN classes c ON c.id = a.class_id JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE c.branch_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY pr.week_start LIMIT 1`,
    ).get(mb.id) as any).w as string;
    const dem = (f: BoLoc) => { const n0 = nguCanh.soCauSql(); const r = xm.duLieuXuatMt(P.mbManager, f); return { n: nguCanh.soCauSql() - n0, luot: r.dem.luot }; };
    const mot = dem(loc({ chiNhanh: String(mb.id), tg: 'tuan', tu: tuan, den: tuan }));
    const nhieu = dem(loc({ chiNhanh: String(mb.id) }));
    assert(mot.luot > 0 && nhieu.luot > mot.luot, `một tuần ${mot.luot} lượt, mọi đợt ${nhieu.luot} lượt`);
    /* PANEL-MC: bảng bỏ môn cũ (`attempt_skill_skips`) chỉ hỏi khi có lượt CHƯA có lịch kỹ năng — 0 / 1 câu tuỳ dữ liệu, không theo số lượt (không N+1). */
    assert(Math.abs(mot.n - nhieu.n) <= 1 && nhieu.n <= 8, `một tuần ${mot.n} câu (${mot.luot} lượt) · mọi đợt ${nhieu.n} câu (${nhieu.luot} lượt)`);
    console.log(`    (đo) MB một tuần: ${mot.n} câu / ${mot.luot} lượt · MB MT1–MT8: ${nhieu.n} câu / ${nhieu.luot} lượt`);
  });

  check('PR-XUAT (2) · nhật ký: POST ghi đúng một dòng mt.xuat_excel; xem trước không ghi; nhãn tiếng Việt; chặn trần → 400', () => {
    const n = () => (conn.prepare(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'mt.xuat_excel'`).get() as any).n as number;
    const f = loc({ chiNhanh: String(mb.id) });
    const n0 = n();
    xm.xemTruoc(P.mbManager, f);
    assert(n() === n0, 'xem trước không ghi nhật ký');
    const r = xm.xuatExcel(P.mbManager, f);
    assert(n() === n0 + 1, 'POST ghi đúng một dòng');
    const dong = conn.prepare(`SELECT * FROM audit_logs WHERE action = 'mt.xuat_excel' ORDER BY id DESC LIMIT 1`).get() as any;
    assert(dong.actor_user_id === P.mbManager.userId && dong.entity_label.startsWith(`${r.dem.luot} lượt · `), dong.entity_label);
    assert(d.nhanHanhDongNhatKy('mt.xuat_excel') === 'Xuất Excel kết quả Test', 'nhãn nhật ký');
    const e = loi(() => xm.duLieuXuatMt(P.mbManager, f, 3));
    assert(e?.status === 400 && /^Quá 3 lượt/.test(e.message), String(e?.message));
  });

  // ------------------------------------------------------------------ khung Lớp thường (Task 3)
  const locThuong = (o: Record<string, unknown> = {}) => loc({ khung: 'thuong', dot: 'giua,cuoi', ...o });

  check('PR-XUAT (3) · lớp thường: sheet theo chương trình, tên môn MH3 (G+V, P), ô % là số, không chữ SOS (T58)', () => {
    const r = xm.duLieuXuatMt(P.normalCoreTeacher, locThuong({ cot: 'day-du' }));
    const ten = r.sheets.map((s) => s.ten);
    assert(ten.includes('FOU · Progress–Final Test') && ten.at(-1) === 'Bộ lọc đã dùng', ten.join('|'));   // GVCN này có thể còn lớp chương trình khác (bộ kiểm thêm lớp)
    const sheetFou = r.sheets.find((s) => s.ten === 'FOU · Progress–Final Test')!;
    const [tieuDe, ...dong] = sheetFou.aoa;
    for (const cot of ['Grammar + Vocabulary %', 'Pronunciation %', 'Listening %', '% tổng', 'Grammar + Vocabulary điểm', 'Pronunciation tổng', 'Tuần Pronunciation', 'Bài']) {
      assert(tieuDe.includes(cot), `thiếu cột "${cot}": ${tieuDe.join(' | ')}`);
    }
    assert(dong.length > 0 && r.dem.luot === r.sheets.slice(0, -1).reduce((n, sh) => n + sh.aoa.length - 1, 0), `${dong.length} dòng, đếm ${r.dem.luot}`);
    const iGv = tieuDe.indexOf('Grammar + Vocabulary %'), iD = tieuDe.indexOf('Grammar + Vocabulary điểm'), iT = tieuDe.indexOf('Grammar + Vocabulary tổng');
    const co = dong.filter((x) => x[iD] !== null);
    assert(co.length > 0 && co.every((x) => typeof x[iGv] === 'number' && x[iGv] === Math.round(((x[iD] as number) / (x[iT] as number)) * 1000) / 10), 'ô % là số = điểm/tổng làm tròn 1 chữ số');
    assert(dong.every((x) => x[4] === 'Progress Test' || x[4] === 'Final Test'), 'cột Bài');
    assert(!JSON.stringify(r.sheets).includes('SOS') && !JSON.stringify(r.sheets).includes('Overall'), 'không tiêu đề/ô nào chứa SOS hay Overall');
    assert(dong.some((x) => typeof x[tieuDe.indexOf('% tổng')] === 'number') && dong.some((x) => x[tieuDe.indexOf('% tổng')] === null), '% tổng: số khi đủ điểm, trống khi thiếu');
    assert(r.tenTep === 'PISA-Tracking_Test-lop-thuong_Monbay_Progress-Test-Final-Test.xlsx', r.tenTep);
  });

  /* R1-EN-2 Task 6 (spec 4.3): tệp theo ngôn ngữ người bấm — tiêu đề, tên sheet, chữ trạng thái EN; dữ liệu (tên em) giữ nguyên. */
  check('R1-EN-2 · xuất ngonNgu=en: hàng tiêu đề, tên sheet, Trạng thái lượt, sheet Bộ lọc tiếng Anh; tên em giữ nguyên', () => {
    const VIET = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    for (const [p, f] of [[P.mbManager, loc({ chiNhanh: String(mb.id), cot: 'day-du' })], [P.normalCoreTeacher, locThuong({ cot: 'day-du' })]] as const) {
      const vi = xm.xuatExcel(p, f);
      const en = xm.xuatExcel(p, f, undefined, 'en');
      assert(en.sheets.length === vi.sheets.length && en.tenTep === vi.tenTep, 'cùng số sheet, cùng tên tệp');
      for (const [i, s] of en.sheets.entries()) {
        const [dau, ...than] = s.aoa;
        assert(!VIET.test(s.ten) && !dau.some((c) => VIET.test(String(c ?? ''))), `sheet "${s.ten}": ${dau.join(' | ')}`);
        if (s.ten === 'Filters used') {
          assert(than.every((h) => !VIET.test(String(h[0]))), `cột Mục: ${than.map((h) => h[0]).join(' | ')}`);
          continue;
        }
        const iTt = dau.indexOf('Attempt status');
        assert(iTt >= 0 && than.every((h) => !VIET.test(String(h[iTt] ?? ''))), `Trạng thái lượt: ${than.map((h) => h[iTt]).slice(0, 5).join(' | ')}`);
        assert(JSON.stringify(than.map((h) => h[0])) === JSON.stringify(vi.sheets[i].aoa.slice(1).map((h) => h[0])), 'tên em giữ nguyên');
        const iN = dau.indexOf('Cause groups');   // PTA #599 (4): giá trị máy dựng của cột Nhóm nguyên nhân
        assert(iN < 0 || than.every((h) => !VIET.test(String(h[iN] ?? ''))), `Nhóm nguyên nhân: ${than.map((h) => h[iN]).filter(Boolean).slice(0, 3).join(' | ')}`);
      }
    }
    const goc = xm.xuatExcel(P.mbManager, loc({ chiNhanh: String(mb.id) }));
    assert(goc.sheets[0].aoa[0][0] === 'Tên' && goc.sheets.at(-1)!.ten === 'Bộ lọc đã dùng', 'mặc định vẫn tiếng Việt');
  });

  check('PR-XUAT (3) · khung thường + đợt MT → 400 câu tiếng Việt; GVCN lớp FT lọc lớp FT hỏi khung thường → 0 lượt, không lỗi; Pre FOU đúng một cột "Tổng hợp %"', () => {
    const sai = d.docBoLocXuatMt({ khung: 'thuong', tg: 'dot', dot: 'mt:1' });
    assert(typeof sai === 'string' && /Progress Test, Checkpoint và Final Test/.test(sai), String(sai));
    const rong = xm.duLieuXuatMt(P.coreTeacher, locThuong({ lop: String(mbLop) }));
    assert(rong.dem.luot === 0 && rong.sheets.map((s) => s.ten).join() === 'Bộ lọc đã dùng', `${rong.dem.luot} lượt, sheet ${rong.sheets.map((s) => s.ten)}`);
    const pf = xm.duLieuXuatMt(P.admin, locThuong());
    const sheetPf = pf.sheets.find((s) => s.ten.startsWith('Pre FOU · '));
    assert(sheetPf, `Pre FOU cần một sheet: ${pf.sheets.map((s) => s.ten)}`);
    const mon = sheetPf!.aoa[0].filter((c) => String(c).endsWith(' %') && c !== '% tổng');
    assert(mon.join() === 'Tổng hợp %', `Pre FOU: ${mon.join()}`);
    assert(pf.sheets.map((s) => s.ten).join() === [...pf.sheets.map((s) => s.ten)].filter((x) => x !== 'Bộ lọc đã dùng').sort().concat('Bộ lọc đã dùng').join(), 'sheet theo mã chương trình, Bộ lọc cuối');
    assert(!JSON.stringify(pf.sheets).includes('SOS'), 'không SOS');
  });

  check('PR-XUAT (8) · OV-12b: cột Nhận xét W1 · W2 (riêng) · Nhận xét S · GV chấm S: đúng chữ, null khi không có, cột gọn không có, không thêm câu SQL (YC-13.5)', () => {
    const a = conn.prepare(
      `SELECT a.id, a.attempt_no, st.email, st.full_name FROM assessment_attempts a JOIN students st ON st.id = a.student_id
        WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY a.id LIMIT 2`,
    ).all(mbLop) as any[];
    assert(a.length === 2, 'demo thiếu 2 lượt MB FT 101');
    /* Ghi thẳng 3 ô (không đi đường nghiệp vụ) và trả lại đúng như cũ khi xong. */
    const cu = new Map<string, any>();
    const ghi = (skill: string, comment: string | null, exName: string | null) => {
      const co = conn.prepare('SELECT id, comment, examiner_name, examiner_user_id FROM assessment_scores WHERE attempt_id = ? AND skill = ?').get(a[0].id, skill) as any;
      cu.set(skill, co ?? null);
      if (co) conn.prepare('UPDATE assessment_scores SET comment = ?, examiner_name = ?, examiner_user_id = NULL WHERE id = ?').run(comment, exName, co.id);
      else conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, comment, examiner_name) VALUES (?,?,?,?)').run(a[0].id, skill, comment, exName);
    };
    try {
      ghi('writing1', 'Thiếu ví dụ', null); ghi('writing2', 'Lạc đề một phần', null); ghi('speaking', 'Nói tự nhiên', 'Giám khảo ngoài');
      const f = (cot: 'gon' | 'day-du') => xm.duLieuXuatMt(P.mbManager, loc({ lop: String(mbLop), cot }));
      const n0 = nguCanh.soCauSql(); const r = f('day-du'); const nSql = nguCanh.soCauSql() - n0;
      const [tieuDe, ...dong] = r.sheets[0].aoa;
      const [iW, iW2, iS, iGv] = ['Nhận xét W1', 'Nhận xét W2', 'Nhận xét S', 'GV chấm S'].map((c) => tieuDe.indexOf(c));
      assert(iW > 0 && iW2 === iW + 1 && iS > iW2 && iGv > iS, `thiếu cột: ${tieuDe.slice(-8)}`);
      const co = dong.find((x) => x[0] === a[0].full_name && x[1] === a[0].email && x[5] === `MT${a[0].attempt_no}`)!;
      assert(co[iW] === 'Thiếu ví dụ' && co[iW2] === 'Lạc đề một phần' && co[iS] === 'Nói tự nhiên' && co[iGv] === 'Giám khảo ngoài', JSON.stringify([co[iW], co[iW2], co[iS], co[iGv]]));
      const khong = dong.find((x) => x[0] === a[1].full_name && x[1] === a[1].email && x[5] === `MT${a[1].attempt_no}`)!;
      assert(khong[iW] === null && khong[iS] === null && khong[iGv] === null, 'lượt không nhận xét → ô trống (null)');
      assert(!f('gon').sheets[0].aoa[0].some((c) => /Nhận xét|GV chấm/.test(String(c))), 'cột gọn không có 3 cột này');
      const n1 = nguCanh.soCauSql(); f('day-du'); const nSql2 = nguCanh.soCauSql() - n1;
      assert(nSql === nSql2 && nSql <= 8, `số câu SQL ${nSql} / ${nSql2} (phải ≤ 8, không thêm vì nhận xét)`);
    } finally {
      for (const [skill, co] of cu) {
        if (co) conn.prepare('UPDATE assessment_scores SET comment = ?, examiner_name = ?, examiner_user_id = ? WHERE id = ?').run(co.comment, co.examiner_name, co.examiner_user_id, co.id);
        else conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = ?').run(a[0].id, skill);
      }
    }
  });

  // ------------------------------------------------------------------ khối 3: giao diện (đọc nguồn)
  const fs = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const web = (f: string) => fs.readFileSync(pathMod.join(REPO, 'web/src', f), 'utf8');

  check('PR-XUAT (4) · tuanDauThangCua: tuần đầu của tháng sở hữu (T40 mặc định Lịch Test)', () => {
    assert(d.tuanDauThangCua('2026-09-28') === '2026-09-28', 'W1 OCT là tuần đầu của tháng 10');
    assert(d.tuanDauThangCua('2026-09-21') === '2026-08-31', 'W4 SEP → thứ Hai 31/08 (W1 SEP)');
    assert(d.tuanDauThangCua('2026-08-31') === '2026-08-31', 'đã là tuần đầu');
  });

  check('PR-XUAT (4) · thư viện xlsx chỉ nạp động (không `from \'xlsx\'` ở web/src); ngăn gọi hai đường xuất, không chữ < 12 px, không màu cứng', () => {
    const tep: string[] = [];
    const duyet = (dir: string) => {
      for (const e of fs.readdirSync(pathMod.join(REPO, 'web/src', dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) duyet(rel); else if (/\.tsx?$/.test(e.name)) tep.push(rel);
      }
    };
    duyet('.');
    const tinh = tep.filter((f) => /from\s+['"]xlsx['"]/.test(web(f)));
    assert(tinh.length === 0, `import tĩnh xlsx: ${tinh.join(', ')}`);
    assert(/import\('xlsx'\)/.test(web('modules/test/NganXuatMt.tsx')), 'NganXuatMt nạp động');
    const ngan = web('modules/test/NganXuatMt.tsx');
    assert(ngan.includes('/xuat-mt/xem-truoc') && ngan.includes("'/xuat-mt'"), 'gọi xem trước và xuất');
    assert(!/text-\[(?:9|10|11)(?:\.\d+)?px\]/.test(ngan), 'không chữ < 12 px (PR-SANG quét)');
    assert(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(ngan), 'không mã màu cứng (chỉ token)');
  });

  check('PR-XUAT (4) · ba chỗ mở ngăn: Lịch Test (nav.xuatMt), hồ sơ lớp ⋮ (xuat-mt), Phân tích › Tổng hợp Test (hai nút khác chữ)', () => {
    const lich = web('modules/test/LichTestTab.tsx');
    assert(lich.includes('nav?.xuatMt') && lich.includes('<NganXuatMt'), 'Lịch Test');
    const dau = web('modules/classes/DauTrangLop.tsx');
    assert(dau.includes('coTheXuatExcel') && dau.includes('nav?.xuatMt'), 'hồ sơ lớp ⋯');
    /* PR-OV3a: thứ tự ⋯ ở `menuHoSoLop` — Xuất Excel (nhóm Công cụ) sau Thông tin lớp, trước đường kẻ Xoá. */
    const mn = fs.readFileSync(pathMod.join(REPO, 'shared/domain/hocVienLop.ts'), 'utf8');
    assert(mn.indexOf("m('thong-tin'") < mn.indexOf("m('xuat-mt'") && mn.indexOf("m('xuat-mt'") < mn.indexOf("m('xoa-lop'"), 'mục ⋯ sau "Thông tin lớp", trước đường kẻ Xoá');
    assert(web('modules/classes/ClassOverviewPage.tsx').includes("viec === 'xuat-mt'"), 'trang hồ sơ lớp mở ngăn');
    const th = web('modules/phanTich/TongHopTestSos.tsx');
    assert(th.includes('⤓ Xuất bảng này') && th.includes('Xuất kết quả từng lượt') && th.includes('nav?.xuatMt') && !th.includes('⤓ Xuất Excel'), 'Tổng hợp Test (Q9)');
  });
}
