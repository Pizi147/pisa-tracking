/**
 * PHÉP KIỂM PR-Qb — Hồ sơ học viên: Hành trình theo lịch, mở đúng đợt, chữ lớp thường
 * (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.8, plan `2026-09-23-pr-qb-ho-so-hoc-vien.md`).
 * Harness (`check`, `assert`, dữ liệu demo, tài khoản mẫu) do `run.ts` sở hữu và truyền vào — file này
 * không tự mở database.
 *
 * Task 1: luật thuần (`duongHoSo.ts`, `hanhTrinh.ts`) — không đụng database, không cần `conn`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import type { ThamSoHoSo } from '../../../shared/domain/duongHoSo.ts';

export async function runHanhTrinhTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Qb · Hồ sơ học viên: Hành trình theo lịch, mở đúng đợt, chữ lớp thường');

  // ==================================================================== Task 1 — duongHoSo.ts

  check('PR-Qb (1) · duongHoSoHocVien/docThamSoHoSo: dựng ↔ đọc khứ hồi', () => {
    const cases: ThamSoHoSo[] = [
      {},
      { dot: 5 },
      { dot: 5, kn: 'reading' },
      { caseId: 3 },
      { caseId: 3, paId: 9 },
      { loTrinh: 4, giaiDoan: 'ft' },
      { tab: 'y-thuc' },
      { tab: 'hanh-trinh', loTrinh: 2 },
    ];
    for (const o of cases) {
      const url = d.duongHoSoHocVien(12, o);
      const qs = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
      const params = new URLSearchParams(qs);
      const back = d.docThamSoHoSo((k) => params.get(k));
      const chuan = (v: object) => JSON.stringify(v, Object.keys(v).sort());
      assert(chuan(back) === chuan(o), `${JSON.stringify(o)} → ${url} → ${JSON.stringify(back)}`);
    }
  });

  check('PR-Qb (1) · duongHoSoHocVien: thứ tự tham số cố định, có dot/kn thì không ghi tab', () => {
    assert(d.duongHoSoHocVien(1) === '/hoc-vien/1', 'Không tham số thì không có dấu ?');
    assert(d.duongHoSoHocVien(1, { loTrinh: 2, tab: 'y-thuc', dot: 5, kn: 'reading', caseId: 3, paId: 9, giaiDoan: 'ft' })
      === '/hoc-vien/1?lo-trinh=2&dot=5&kn=reading&case=3&pa=9&giai-doan=ft', 'Có dot/kn thì bỏ tab, giữ đúng thứ tự còn lại');
    assert(d.duongHoSoHocVien(1, { tab: 'hoc-thuat' }) === '/hoc-vien/1', 'tab=hoc-thuat là mặc định, không ghi ra URL');
  });

  check('PR-Qb (1) · docThamSoHoSo: tham số sai dạng bị bỏ qua, không ném lỗi', () => {
    const get = (vals: Record<string, string>) => (k: string) => vals[k] ?? null;
    assert(JSON.stringify(d.docThamSoHoSo(get({ dot: '-3' }))) === '{}', 'dot âm bị bỏ');
    assert(JSON.stringify(d.docThamSoHoSo(get({ dot: '1.5' }))) === '{}', 'dot không nguyên bị bỏ');
    assert(JSON.stringify(d.docThamSoHoSo(get({ dot: '0' }))) === '{}', 'dot=0 bị bỏ (không nguyên dương)');
    assert(JSON.stringify(d.docThamSoHoSo(get({ kn: 'abc' }))) === '{}', 'kn lạ bị bỏ');
    assert(JSON.stringify(d.docThamSoHoSo(get({ 'giai-doan': 'x' }))) === '{}', 'giai-doan lạ bị bỏ');
    assert(JSON.stringify(d.docThamSoHoSo(get({ tab: 'khong-ton-tai' }))) === '{}', 'tab lạ bị bỏ');
    assert(d.docThamSoHoSo(get({ kn: 'writing1' })).kn === 'writing1', 'writing1/writing2 là kn hợp lệ');
  });

  check('PR-Qb (1) · duongThongBao: đủ 6 nhánh Q12 + loại lạ không điều hướng', () => {
    const base = { entity_id: 7, kind: null as string | null, student_id: 12 as number | null, attempt_id: null as number | null };
    assert(d.duongThongBao({ ...base, entity_type: 'sos_case' }) === '/hoc-vien/12?case=7', 'sos_case → hồ sơ + ngăn Case');
    assert(d.duongThongBao({ ...base, entity_type: 'case_signal' }) === '/hoc-vien/12', 'case_signal → hồ sơ (không mở ngăn)');
    assert(d.duongThongBao({ ...base, entity_type: 'assessment_attempt', kind: 'sos', attempt_id: 20 }) === '/hoc-vien/12?dot=20',
      'assessment_attempt kind sos → ?dot=');
    assert(d.duongThongBao({ ...base, entity_type: 'assessment_attempt', kind: 'schedule_move', attempt_id: 20 }) === '/mock-test/20',
      'assessment_attempt kind schedule_move → giữ /mock-test/{id}');
    assert(d.duongThongBao({ ...base, entity_type: 'skill_move_requests', attempt_id: 20 }) === '/mock-test/20',
      'skill_move_requests → /mock-test/{attemptId}');
    assert(d.duongThongBao({ ...base, entity_type: 'discipline_measure' }) === '/hoc-vien/12?tab=y-thuc',
      'discipline_measure → tab Ý thức');
    assert(d.duongThongBao({ ...base, entity_type: 'khong_ro' }) === null, 'Loại lạ → không điều hướng');
    assert(d.duongThongBao({ ...base, entity_type: 'sos_case', student_id: null }) === null, 'Thiếu học viên → không điều hướng');
  });

  // ==================================================================== Task 1 — hanhTrinh.ts: trục

  check('PR-Qb (1) · trucTuan: tháng 5 tuần ra W5, cột hôm nay đúng một cột, dauThang đúng đầu tháng', () => {
    const truc = d.trucTuan('2026-09-28', '2026-10-26', '2026-10-05');
    assert(truc.tuan.length === 5, `5 tuần: ${truc.tuan.length}`);
    assert(truc.tuan[4].nhan === 'W5', `Tuần cuối phải là W5: ${truc.tuan[4].nhan}`);
    assert(truc.tuan.filter((w) => w.homNay).length === 1 && truc.tuan[1].homNay, 'Đúng một cột hôm nay, đúng vị trí');
    assert(truc.thang.length === 1 && truc.thang[0].nhan === 'OCT' && truc.thang[0].so === 5, `Một tháng OCT span 5: ${JSON.stringify(truc.thang)}`);
  });

  check('PR-Qb (1) · trucTuan: vắt năm DEC→JAN không lặp tháng', () => {
    const truc = d.trucTuan('2026-12-14', '2027-01-11', '2026-12-22');
    assert(truc.thang.length === 2, `Hai tháng, không gộp/lặp: ${JSON.stringify(truc.thang)}`);
    assert(truc.thang[0].nhan === 'DEC' && truc.thang[0].tu === 0 && truc.thang[0].so === 3, `DEC span 3: ${JSON.stringify(truc.thang[0])}`);
    assert(truc.thang[1].nhan === 'JAN' && truc.thang[1].tu === 3 && truc.thang[1].so === 2, `JAN span 2: ${JSON.stringify(truc.thang[1])}`);
  });

  check('PR-Qb (1) · cotCua: kẹp trong [0, soTuan-1] khi ngày ngoài trục', () => {
    const truc = d.trucTuan('2026-09-28', '2026-10-26', '2026-10-05');
    assert(d.cotCua('2026-10-07', truc) === 1, 'Ngày trong tuần W2 → cột 1');
    assert(d.cotCua('2026-01-01', truc) === 0, 'Trước trục → kẹp về 0');
    assert(d.cotCua('2027-01-01', truc) === truc.tuan.length - 1, 'Sau trục → kẹp về cột cuối');
  });

  check('PR-Qb (1) · khoangTruc: 3 tháng của giai đoạn đang chạy và đã kết thúc', () => {
    const running = d.khoangTruc({ tu: '2026-01-05', den: null }, '2026-09-22', '3-thang');
    assert(running.den === '2026-09-28', `den = tuần sau tuần này: ${running.den}`);
    assert(running.tu === '2026-07-06', `tu = den − 12 tuần: ${running.tu}`);
    const ended = d.khoangTruc({ tu: '2026-01-05', den: '2026-06-01' }, '2026-09-22', '3-thang');
    assert(ended.den === '2026-06-01', `Giai đoạn đã kết thúc: den = tuần kết thúc giai đoạn: ${ended.den}`);
    assert(ended.tu === '2026-03-09', `tu = den − 12 tuần: ${ended.tu}`);
    const kep = d.khoangTruc({ tu: '2026-09-01', den: null }, '2026-09-22', '3-thang');
    assert(kep.tu === '2026-08-31', `tu không sớm hơn tuần bắt đầu giai đoạn: ${kep.tu}`);
    const caGiaiDoan = d.khoangTruc({ tu: '2026-01-05', den: null }, '2026-09-22', 'ca-giai-doan');
    assert(caGiaiDoan.tu === '2026-01-05' && caGiaiDoan.den === '2026-09-28', `Cả giai đoạn: ${JSON.stringify(caGiaiDoan)}`);
  });

  // ==================================================================== Task 1 — hanhTrinh.ts: tầng, badge, nhãn

  check('PR-Qb (1) · xepTang: 2 khối chồng → 0/1, 3 khối chồng → 0/1/2', () => {
    const hai = [{ id: 1, tu: '2026-01-05', den: '2026-02-02' }, { id: 2, tu: '2026-01-19', den: '2026-03-02' }];
    const t2 = d.xepTang(hai);
    assert(t2.get(1) === 0 && t2.get(2) === 1, `2 khối chồng: ${JSON.stringify([...t2])}`);
    const ba = [...hai, { id: 3, tu: '2026-01-26', den: '2026-03-16' }];
    const t3 = d.xepTang(ba);
    assert(t3.get(1) === 0 && t3.get(2) === 1 && t3.get(3) === 2, `3 khối chồng: ${JSON.stringify([...t3])}`);
  });

  check('PR-Qb (1) · xepTang: không chồng thì cùng tầng 0; chạm nhau cùng một tuần vẫn tính là chồng', () => {
    const khongChong = [{ id: 1, tu: '2026-01-05', den: '2026-01-19' }, { id: 2, tu: '2026-02-02', den: '2026-02-16' }];
    const t0 = d.xepTang(khongChong);
    assert(t0.get(1) === 0 && t0.get(2) === 0, `Không chồng → cùng tầng 0: ${JSON.stringify([...t0])}`);
    const chamTuan = [{ id: 1, tu: '2026-01-05', den: '2026-01-19' }, { id: 2, tu: '2026-01-19', den: '2026-02-02' }];
    const tCham = d.xepTang(chamTuan);
    assert(tCham.get(1) === 0 && tCham.get(2) === 1, `Chạm cùng tuần vẫn tính chồng: ${JSON.stringify([...tCham])}`);
  });

  check('PR-Qb (1) · xepTang: chuỗi supersededBy (noiTiepTu) giữ nguyên tầng', () => {
    const chuoi = [
      { id: 1, tu: '2026-01-05', den: '2026-02-02' },
      { id: 2, tu: '2026-02-02', den: '2026-03-02', noiTiepTu: 1 },
      { id: 3, tu: '2026-01-19', den: '2026-04-01' },
    ];
    const tang = d.xepTang(chuoi);
    assert(tang.get(1) === 0 && tang.get(2) === 0, `Chuỗi nối tiếp giữ tầng 0: ${JSON.stringify([...tang])}`);
    assert(tang.get(3) === 1, `Khối chồng với chuỗi phải xuống tầng khác: ${tang.get(3)}`);
  });

  check('PR-Qb (1) · nhanKhoiPa: đủ 6 nhánh (improved/partial/unchanged/worse/đã kết thúc/đang thực hiện)', () => {
    const ten = 'Reading';
    const improved = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: 'improved', followupOverdue: false });
    assert(improved.chu === 'Reading · ✓ Tiến bộ rõ', `improved: ${JSON.stringify(improved)}`);
    assert(improved.tone === 'ok', `improved tone: ${improved.tone}`);
    const partial = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: 'partial', followupOverdue: false });
    assert(partial.chu === 'Reading · ◐ Tiến bộ một phần', `partial: ${JSON.stringify(partial)}`);
    const unchanged = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: 'unchanged', followupOverdue: false });
    assert(unchanged.chu === 'Reading · ✗ Không tiến bộ', `unchanged: ${JSON.stringify(unchanged)}`);
    const worse = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: 'worse', followupOverdue: false });
    assert(worse.tone === 'bad', `worse tone: ${worse.tone}`);
    const daXong = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: null, followupOverdue: false });
    assert(daXong.chu === 'Reading · Đã kết thúc', `xong không kết quả: ${JSON.stringify(daXong)}`);
    const running = d.nhanKhoiPa({ ten, status: 'started', lastOutcome: null, followupOverdue: false });
    assert(running.chu === 'Reading · Đang thực hiện' && running.tone === 'run', `Đang chạy: ${JSON.stringify(running)}`);
    const late = d.nhanKhoiPa({ ten, status: 'planned', lastOutcome: null, followupOverdue: true });
    assert(late.tone === 'late' && late.chu.includes('Quá hạn cập nhật'), `Quá hạn cập nhật: ${JSON.stringify(late)}`);
  });

  check('PR-Qb (1) · trangThaiHop: đủ 5 nhánh Q6, n tuần làm tròn lên', () => {
    const homNay = '2026-09-22';
    const chuaCoPa = d.trangThaiHop({ caseMo: [{ mo: '2026-08-01', soPa: 0 }], coTungCase: true, diemCuoiChuaDat: null, xongGanNhat: null }, homNay);
    assert(chuaCoPa?.tone === 'warn' && chuaCoPa.chu.startsWith('Chưa có PA · '), `Chưa có PA: ${JSON.stringify(chuaCoPa)}`);
    const canHoTro = d.trangThaiHop({ caseMo: [{ mo: '2026-08-01', soPa: 2 }], coTungCase: true, diemCuoiChuaDat: true, xongGanNhat: null }, homNay);
    assert(canHoTro?.tone === 'danger' && canHoTro.chu.startsWith('Cần hỗ trợ · '), `Cần hỗ trợ: ${JSON.stringify(canHoTro)}`);
    const dangTheoDoi = d.trangThaiHop({ caseMo: [{ mo: '2026-08-01', soPa: 2 }], coTungCase: true, diemCuoiChuaDat: false, xongGanNhat: null }, homNay);
    assert(dangTheoDoi?.tone === 'warn' && dangTheoDoi.chu.startsWith('Đang theo dõi · '), `Đang theo dõi: ${JSON.stringify(dangTheoDoi)}`);
    const daOn = d.trangThaiHop({ caseMo: [], coTungCase: true, diemCuoiChuaDat: null, xongGanNhat: '2026-08-30' }, homNay);
    assert(daOn?.tone === 'ok' && daOn.chu === 'Đã ổn · xong 30/08', `Đã ổn: ${JSON.stringify(daOn)}`);
    const chuaTungCo = d.trangThaiHop({ caseMo: [], coTungCase: false, diemCuoiChuaDat: null, xongGanNhat: null }, homNay);
    assert(chuaTungCo === null, 'Chưa từng có Case → null (giao diện tự vẽ chữ mờ)');
    /* mo 01/08 → 22/09 = 52 ngày = 7.43 tuần → làm tròn lên 8 */
    assert(chuaCoPa?.chu === 'Chưa có PA · 8 tuần', `n tuần làm tròn lên: ${chuaCoPa?.chu}`);
  });

  check('PR-Qb (1) · chuoiDiem: FT band, lớp thường %, tối đa 5 mốc, thêm "?" khi còn chờ', () => {
    const ft = d.chuoiDiem([{ gt: 5.5, chuaDat: true }, { gt: 6, chuaDat: false }], 'ielts', true);
    assert(ft.length === 3 && ft[0].chu === '5.5' && ft[0].xau === true && ft[2].chu === '?' && ft[2].xau === false, `FT: ${JSON.stringify(ft)}`);
    const ratio = d.chuoiDiem([{ gt: 3, tong: 4, chuaDat: true }], 'ratio', false);
    assert(ratio[0].chu === '75%' && ratio[0].xau === true, `Lớp thường %: ${JSON.stringify(ratio)}`);
    const nhieu = d.chuoiDiem([1, 2, 3, 4, 5, 6].map((n) => ({ gt: n, chuaDat: false })), 'ielts', false);
    assert(nhieu.length === 5 && nhieu[0].chu === '2' && nhieu[4].chu === '6', `Tối đa 5 mốc cuối: ${JSON.stringify(nhieu)}`);
  });

  check('PR-Qb (1) · nhanGhim: FT có MT, lớp thường KHÔNG chứa chữ "MT"', () => {
    const mt1 = d.nhanGhim({ cheDo: 'ielts', attemptNo: 1, kind: 'mock', overall: 5.5, sosLevel: 0, soDat: null, soYeuCau: 4, soCoDiem: 4 });
    assert(mt1.ngan === 'MT1 · 5.5' && mt1.tone === 'ok', `MT đạt: ${JSON.stringify(mt1)}`);
    const mt2 = d.nhanGhim({ cheDo: 'ielts', attemptNo: 2, kind: 'mock', overall: 6, sosLevel: 1, soDat: null, soYeuCau: 4, soCoDiem: 4 });
    assert(mt2.ngan === 'MT2 · 6.0 · SOS 1' && mt2.tone === 'danger', `MT có SOS: ${JSON.stringify(mt2)}`);
    const mt3 = d.nhanGhim({ cheDo: 'ielts', attemptNo: 3, kind: 'mock', overall: null, sosLevel: null, soDat: null, soYeuCau: 4, soCoDiem: 2 });
    assert(mt3.ngan === 'MT3 · đang chấm' && mt3.tone === 'info', `MT đang chấm: ${JSON.stringify(mt3)}`);
    const mt4 = d.nhanGhim({ cheDo: 'ielts', attemptNo: 4, kind: 'mock', overall: null, sosLevel: null, soDat: null, soYeuCau: 4, soCoDiem: 0 });
    assert(mt4.ngan === 'MT4' && mt4.tone === 'muted', `MT chưa có điểm: ${JSON.stringify(mt4)}`);
    const giua = d.nhanGhim({ cheDo: 'ratio', attemptNo: 1, kind: 'progress', overall: null, sosLevel: null, soDat: 3, soYeuCau: 4, soCoDiem: 4 });
    assert(giua.ngan === 'Giữa' && giua.day === 'Giữa khoá · Đạt 3/4 môn' && giua.tone === 'danger', `Giữa khoá: ${JSON.stringify(giua)}`);
    const cuoi = d.nhanGhim({ cheDo: 'ratio', attemptNo: 1, kind: 'final', overall: null, sosLevel: null, soDat: 4, soYeuCau: 4, soCoDiem: 4 });
    assert(cuoi.ngan === 'Cuối' && cuoi.tone === 'ok', `Cuối khoá đạt: ${JSON.stringify(cuoi)}`);
    for (const r of [giua, cuoi]) assert(!r.ngan.includes('MT') && !r.day.includes('MT'), `Lớp thường không chứa MT: ${JSON.stringify(r)}`);
  });

  check('PR-Qb (1) · nhanGiaiDoan: giai đoạn đã xong có khoảng, đang chạy chỉ có "từ"', () => {
    const xong = d.nhanGiaiDoan({ loai: 'thuong', tu: '2026-06-08', den: '2026-09-25' }, '2026-09-22');
    assert(xong === 'Lớp thường · W2 JUN – W4 SEP', `Giai đoạn đã xong: ${xong}`);
    const dangChay = d.nhanGiaiDoan({ loai: 'ft', tu: '2026-10-05', den: null }, '2026-09-22');
    assert(dangChay === 'Fast Track · từ W2 OCT', `Giai đoạn đang chạy: ${dangChay}`);
  });

  // ==================================================================== Task 2 — máy chủ GET /students/:id/hanh-trinh

  const { conn, P, TODAY } = t;
  const { hanhTrinhHocVien } = await import('../students/hanhTrinh.ts');
  /* HV 1 (seed): FOU → BE → FT, Case Reading mở ở lộ trình BE. HV 40 (seed): FT LT1 → LT2. */
  const HV1 = 1;
  const HV40 = 40;

  check('PR-Qb (2) · HV1 (FOU→BE→FT): cacGiaiDoan có cả hai, mặc định giai đoạn của lộ trình đang chạy (ft)', () => {
    const r = hanhTrinhHocVien(P.admin, HV1, null);
    const loai = r.cacGiaiDoan.map((g: any) => g.loai).sort().join(',');
    assert(loai === 'ft,thuong', `Phải có cả hai giai đoạn: ${loai}`);
    assert(r.giaiDoan === 'ft', `Mặc định phải là giai đoạn của lộ trình đang xem (FT đang chạy): ${r.giaiDoan}`);
  });

  check('PR-Qb (2) · HV1 giai đoạn "thuong": 2 đoạn FOU→BE đúng thứ tự, 4 hộp L/R/W/S, không hộp nào có hạng mục Ý thức', () => {
    const r = hanhTrinhHocVien(P.admin, HV1, 'thuong');
    assert(r.doan.length === 2, `2 đoạn: ${JSON.stringify(r.doan)}`);
    assert(r.doan[0].tu < r.doan[1].tu, `Đúng thứ tự thời gian: ${JSON.stringify(r.doan)}`);
    assert(r.doan.every((x: any) => x.loai === 'khoa'), 'Lớp thường ghi đoạn "khoa"');
    const kyNang = r.hop.map((h: any) => h.kyNang);
    assert(kyNang.join(',') === 'listening,reading,writing,speaking', `4 hộp L/R/W/S: ${kyNang}`);
    const HANG_MUC_HOP_LE = new Set(['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking']);
    assert(kyNang.every((k: string) => HANG_MUC_HOP_LE.has(k)), 'Không hộp nào ngoài bộ kỹ năng (không Ý thức)');
  });

  check('PR-Qb (2) · HV1: Case Reading của lộ trình BE nằm ở hộp Reading của "thuong", không lộ sang "ft"', () => {
    const thuong = hanhTrinhHocVien(P.admin, HV1, 'thuong');
    const ft = hanhTrinhHocVien(P.admin, HV1, 'ft');
    const readingThuong = thuong.hop.find((h: any) => h.kyNang === 'reading')!;
    const readingFt = ft.hop.find((h: any) => h.kyNang === 'reading')!;
    const caseBe = conn.prepare(`SELECT id FROM sos_cases WHERE student_id = ? AND cycle_id = 2 AND category = 'reading'`).get(HV1) as any;
    assert(!!caseBe, 'Seed phải có Case Reading ở lộ trình BE (cycle_id=2) của HV1');
    assert(readingThuong.vanDe.some((v: any) => v.caseId === caseBe.id), 'Case của BE phải nằm ở hộp Reading của "thuong"');
    assert(!readingFt.vanDe.some((v: any) => v.caseId === caseBe.id), 'Case của BE KHÔNG được lộ sang hộp Reading của "ft"');
  });

  check('PR-Qb (2) · HV1 giai đoạn "ft": 5 hộp L/R/W1/W2/S', () => {
    const r = hanhTrinhHocVien(P.admin, HV1, 'ft');
    const kyNang = r.hop.map((h: any) => h.kyNang);
    assert(kyNang.join(',') === 'listening,reading,writing1,writing2,speaking', `5 hộp FT: ${kyNang}`);
  });

  check('PR-Qb (2) · HV40 (LT1→LT2): doan có 2 lộ trình, nhãn không rỗng', () => {
    const r = hanhTrinhHocVien(P.admin, HV40, null);
    assert(r.giaiDoan === 'ft', `HV40 chỉ có FT: ${r.giaiDoan}`);
    assert(r.doan.length === 2 && r.doan.every((x: any) => x.loai === 'lo-trinh'), `2 lộ trình: ${JSON.stringify(r.doan)}`);
    assert(r.doan.every((x: any) => x.nhan), 'Mỗi lộ trình phải có nhãn');
    assert(r.doan[0].tu < r.doan[1].tu, 'Đúng thứ tự thời gian');
  });

  check('PR-Qb (2) · Giáo viên/Quản lý ngoài phạm vi bị từ chối xem hành trình', () => {
    let threw = false;
    try { hanhTrinhHocVien(P.cpManager, HV1, null); } catch { threw = true; }
    assert(threw, 'QL chi nhánh CP không được xem hành trình của học viên chi nhánh MB');
  });

  check('PR-Qb (2) · xếp tầng: một Case có 2 phương án chồng thời gian ra đúng 2 tầng khi xếp bằng xepTang', () => {
    const caseBe = conn.prepare(`SELECT id FROM sos_cases WHERE student_id = ? AND cycle_id = 2 AND category = 'reading'`).get(HV1) as any;
    const now = new Date().toISOString();
    const ins = conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, status, planned_date, started_date, completed_date, created_at)
       VALUES (?, 'tutor', 'completed', ?, ?, ?, ?)`,
    );
    const iv1 = ins.run(caseBe.id, '2026-03-01', '2026-03-01', '2026-03-15', now).lastInsertRowid as number;
    const iv2 = ins.run(caseBe.id, '2026-03-08', '2026-03-08', '2026-03-22', now).lastInsertRowid as number;
    try {
      const r = hanhTrinhHocVien(P.admin, HV1, 'thuong');
      const vanDe = r.hop.find((h: any) => h.kyNang === 'reading')!.vanDe.find((v: any) => v.caseId === caseBe.id)!;
      const pa = vanDe.pa.filter((x: any) => x.id === iv1 || x.id === iv2);
      assert(pa.length === 2, `Phải thấy đủ 2 PA vừa chèn: ${JSON.stringify(vanDe.pa)}`);
      const tang = d.xepTang(pa);
      assert(new Set(tang.values()).size === 2, `2 PA chồng tuần (01-15/03 và 08-22/03) phải ra 2 tầng: ${JSON.stringify([...tang])}`);
    } finally {
      conn.prepare('DELETE FROM case_interventions WHERE id IN (?, ?)').run(iv1, iv2);
    }
  });

  check('PR-Qb (2) · số câu lệnh không tăng theo số Case (1 Case vs 3 Case chênh ≤ số đợt)', () => {
    const demTruyVan = (fn: () => void): number => {
      let n = 0;
      const orig = conn.prepare.bind(conn);
      (conn as any).prepare = (sql: string) => { n += 1; return orig(sql); };
      try { fn(); } finally { (conn as any).prepare = orig; }
      return n;
    };
    const soDot = conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = 2`).get() as any;
    const truoc = demTruyVan(() => { hanhTrinhHocVien(P.admin, HV1, 'thuong'); });
    const now = new Date().toISOString();
    const ins = conn.prepare(
      `INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at)
       VALUES (?, 2, 'writing', 'writing', 'teacher_report', 'open', 1, ?, ?)`,
    );
    const idsMoi = [ins.run(HV1, TODAY, now).lastInsertRowid, ins.run(HV1, TODAY, now).lastInsertRowid] as number[];
    try {
      const sau = demTruyVan(() => { hanhTrinhHocVien(P.admin, HV1, 'thuong'); });
      assert(sau <= truoc + soDot.n,
        `Thêm 2 Case (1→3) khiến số câu lệnh tăng từ ${truoc} lên ${sau} — chênh phải ≤ số đợt (${soDot.n}), nghi vấn quét theo Case (N+1)`);
    } finally {
      conn.prepare(`DELETE FROM sos_cases WHERE id IN (${idsMoi.map(() => '?').join(',')})`).run(...idsMoi);
    }
  });

  // ==================================================================== Task 3 — hồ sơ mở đúng đợt, khoá đang học, thông báo

  const { studentProfile } = await import('../students/profile.ts');
  const { thongBaoCua } = await import('../platform/thongBao.ts');

  check('PR-Qb (3) · R7: attemptId của lộ trình cũ chọn đúng lộ trình đó khi không có cycleId', () => {
    const prof = studentProfile(P.admin, HV1, undefined, 1); // attempt 1 thuộc cycle 1 (FOU) của HV1
    assert(prof.cycle?.id === 1, `attemptId=1 phải chọn cycle 1 (FOU): cycle=${prof.cycle?.id}`);
  });

  check('PR-Qb (3) · R7: attemptId thuộc học viên KHÁC bị bỏ qua, về lộ trình đang chạy', () => {
    const attemptCuaHocVienKhac = conn.prepare('SELECT id FROM assessment_attempts WHERE student_id != ? LIMIT 1').get(HV1) as any;
    const prof = studentProfile(P.admin, HV1, undefined, attemptCuaHocVienKhac.id);
    const macDinh = studentProfile(P.admin, HV1);
    assert(prof.cycle?.id === macDinh.cycle?.id, `Đợt của HV khác không được đổi lộ trình đang xem: ${prof.cycle?.id} ≠ ${macDinh.cycle?.id}`);
  });

  check('PR-Qb (3) · Q18: currentClass.khoa chỉ có ở lớp thường (mã đúng chương trình), FT là null', () => {
    const hocVienLopThuong = (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = (SELECT id FROM classes WHERE code = 'MB-FOU 12') AND status = 'active' LIMIT 1`).get() as any).student_id;
    const profLopThuong = studentProfile(P.admin, hocVienLopThuong);
    assert(profLopThuong.currentClass?.khoa?.ma === 'FOU', `Lớp thường phải có khoa.ma = FOU: ${JSON.stringify(profLopThuong.currentClass?.khoa)}`);
    const profFt = studentProfile(P.admin, HV1);
    assert(profFt.currentClass?.khoa === null, `FT không có khoá đang học: ${JSON.stringify(profFt.currentClass?.khoa)}`);
  });

  check('PR-Qb (3) · Q11: headline.next.category (khi có) thuộc đúng bộ hạng mục case', () => {
    const CATEGORY_HOP_LE = new Set<string>(d.CASE_CATEGORIES);
    for (const sid of [HV1, HV40]) {
      const prof = studentProfile(P.admin, sid);
      if (prof.headline.next) {
        assert(CATEGORY_HOP_LE.has(prof.headline.next.category), `category lạ: ${prof.headline.next.category}`);
      }
    }
  });

  check('PR-Qb (3) · Q8: sự kiện Ý thức (warning/wl) không còn trong episodes lẫn allEpisodes', () => {
    const now = new Date().toISOString();
    const id = conn.prepare(
      `INSERT INTO journey_events (student_id, event_type, event_date, title, created_at) VALUES (?, 'warning', ?, 'Cảnh báo thử', ?)`,
    ).run(HV1, TODAY, now).lastInsertRowid as number;
    try {
      const prof = studentProfile(P.admin, HV1);
      assert(!prof.episodes.some((e: any) => e.events.some((ev: any) => ev.id === id)), 'episodes không được chứa sự kiện Ý thức');
      assert(!prof.allEpisodes.some((e: any) => e.events.some((ev: any) => ev.id === id)), 'allEpisodes không được chứa sự kiện Ý thức');
    } finally {
      conn.prepare('DELETE FROM journey_events WHERE id = ?').run(id);
    }
  });

  check('PR-Qb (3) · thongBaoCua: mỗi loại thông báo trả đúng student_id/attempt_id, duongThongBao ra đúng đường', () => {
    const now = new Date().toISOString();
    const caseBe = conn.prepare(`SELECT id, student_id FROM sos_cases WHERE student_id = ? AND cycle_id = 2`).get(HV1) as any;
    const attempt = conn.prepare('SELECT id, student_id FROM assessment_attempts WHERE student_id = ? LIMIT 1').get(HV1) as any;
    const smr = conn.prepare('SELECT id, attempt_id FROM skill_move_requests LIMIT 1').get() as any;
    const measure = conn.prepare('SELECT id, student_id FROM discipline_measures LIMIT 1').get() as any;
    const ins = conn.prepare(
      `INSERT INTO notifications (user_id, kind, title, entity_type, entity_id, dedup_key, created_at) VALUES (?,?,?,?,?,?,?)`,
    );
    const ids: number[] = [];
    ids.push(ins.run(P.admin.userId, 'case', 'thử sos_case', 'sos_case', caseBe.id, `test-qb:sos_case:${caseBe.id}`, now).lastInsertRowid as number);
    ids.push(ins.run(P.admin.userId, 'sos', 'thử assessment_attempt', 'assessment_attempt', attempt.id, `test-qb:aa:${attempt.id}`, now).lastInsertRowid as number);
    ids.push(ins.run(P.admin.userId, 'discipline', 'thử discipline_measure', 'discipline_measure', measure.id, `test-qb:dm:${measure.id}`, now).lastInsertRowid as number);
    if (smr) ids.push(ins.run(P.admin.userId, 'schedule_move', 'thử skill_move_requests', 'skill_move_requests', smr.id, `test-qb:smr:${smr.id}`, now).lastInsertRowid as number);
    try {
      const rows = thongBaoCua(P.admin.userId);
      const sosCaseRow = rows.find((r: any) => r.id === ids[0]);
      assert(sosCaseRow?.student_id === caseBe.student_id, `sos_case student_id: ${sosCaseRow?.student_id}`);
      assert(d.duongThongBao(sosCaseRow) === `/hoc-vien/${caseBe.student_id}?case=${caseBe.id}`, `sos_case đường: ${d.duongThongBao(sosCaseRow)}`);
      const attemptRow = rows.find((r: any) => r.id === ids[1]);
      assert(attemptRow?.student_id === attempt.student_id && attemptRow?.attempt_id === attempt.id, `assessment_attempt: ${JSON.stringify(attemptRow)}`);
      const measureRow = rows.find((r: any) => r.id === ids[2]);
      assert(measureRow?.student_id === measure.student_id, `discipline_measure student_id: ${measureRow?.student_id}`);
      assert(d.duongThongBao(measureRow) === `/hoc-vien/${measure.student_id}?tab=y-thuc`, `discipline_measure đường: ${d.duongThongBao(measureRow)}`);
      if (smr) {
        const smrRow = rows.find((r: any) => r.id === ids[3]);
        assert(smrRow?.attempt_id === smr.attempt_id, `skill_move_requests attempt_id: ${smrRow?.attempt_id}`);
        assert(d.duongThongBao(smrRow) === `/mock-test/${smr.attempt_id}`, `skill_move_requests đường: ${d.duongThongBao(smrRow)}`);
      }
    } finally {
      conn.prepare(`DELETE FROM notifications WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
    }
  });
}
