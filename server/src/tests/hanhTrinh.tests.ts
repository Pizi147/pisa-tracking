/**
 * PHÉP KIỂM PR-Qb — Hồ sơ học viên: Hành trình theo lịch, mở đúng đợt, chữ lớp thường
 * (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.8, plan `2026-09-23-pr-qb-ho-so-hoc-vien.md`).
 * Harness (`check`, `assert`, dữ liệu demo, tài khoản mẫu) do `run.ts` sở hữu và truyền vào — file này
 * không tự mở database.
 *
 * Task 1: luật thuần (`duongHoSo.ts`, `hanhTrinh.ts`) — không đụng database, không cần `conn`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import type { ThamSoHoSo } from '../../../shared/domain/duongHoSo.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

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

  check('PR-Qb · sửa sau rà #75 (2): giaoKhoangXem — hoàn toàn ngoài khoảng thì KHÔNG giao, giao một phần hoặc trọn thì có', () => {
    const khoang = { tu: '2026-09-28', den: '2026-10-26' };
    assert(d.giaoKhoangXem('2026-06-01', '2026-07-13', khoang) === false, 'Hoàn toàn trước khoảng → không giao');
    assert(d.giaoKhoangXem('2026-12-01', '2027-01-13', khoang) === false, 'Hoàn toàn sau khoảng → không giao');
    assert(d.giaoKhoangXem('2026-08-01', '2026-10-05', khoang) === true, 'Giao một phần ở đầu → có giao');
    assert(d.giaoKhoangXem('2026-10-19', '2026-12-01', khoang) === true, 'Giao một phần ở cuối → có giao');
    assert(d.giaoKhoangXem('2026-01-01', null, khoang) === true, 'Còn mở (den=null), bắt đầu trước khoảng → coi như chạy tới hết khoảng, có giao');
    assert(d.giaoKhoangXem('2027-01-01', null, khoang) === false, 'Còn mở nhưng bắt đầu SAU khi khoảng đã kết thúc → không giao');
    assert(d.giaoKhoangXem('2026-01-01', '2026-08-01', khoang) === false, 'Đã đóng, kết thúc trước khoảng → không giao');
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
    /* PR-UX5 (Q2): chữ trên khối chỉ còn `ten` + `dau`; câu đủ (kết quả, ngày) nằm ở `day`. */
    const improved = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: 'improved', followupOverdue: false });
    assert(improved.ten === 'Reading' && improved.dau === '✓' && improved.day === 'Reading · ✓ Tiến bộ rõ', `improved: ${JSON.stringify(improved)}`);
    assert(improved.tone === 'ok', `improved tone: ${improved.tone}`);
    const partial = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: 'partial', followupOverdue: false });
    assert(partial.dau === '◐' && partial.day === 'Reading · ◐ Tiến bộ một phần', `partial: ${JSON.stringify(partial)}`);
    const unchanged = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: 'unchanged', followupOverdue: false });
    assert(unchanged.dau === '✗' && unchanged.day === 'Reading · ✗ Không tiến bộ', `unchanged: ${JSON.stringify(unchanged)}`);
    const worse = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: 'worse', followupOverdue: false });
    assert(worse.tone === 'bad', `worse tone: ${worse.tone}`);
    const daXong = d.nhanKhoiPa({ ten, status: 'completed', lastOutcome: null, followupOverdue: false });
    assert(daXong.tone === 'done' && daXong.dau === '■' && daXong.day.includes('Đã kết thúc'), `xong không kết quả: ${JSON.stringify(daXong)}`);
    const running = d.nhanKhoiPa({ ten, status: 'started', lastOutcome: null, followupOverdue: false });
    assert(running.day === 'Reading · ▶ Đang thực hiện' && running.tone === 'run' && running.dau === '▶', `Đang chạy: ${JSON.stringify(running)}`);
    const late = d.nhanKhoiPa({ ten, status: 'planned', lastOutcome: null, followupOverdue: true });
    assert(late.tone === 'late' && late.dau === '⚠' && late.day.includes('Quá hạn cập nhật'), `Quá hạn cập nhật: ${JSON.stringify(late)}`);
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
    assert(nhieu.length === 5 && nhieu[0].chu === '2.0' && nhieu[4].chu === '6.0', `Tối đa 5 mốc cuối: ${JSON.stringify(nhieu)}`);
  });

  check('PR-Qb (1) · nhanGhim: FT có MT, lớp thường KHÔNG chứa chữ "MT"', () => {
    /* PR-UX5 (N-1b): `ngan`→`chu`, `tone`→`mau` (ok→dat, danger→sos1, info/muted→tam). */
    const mt1 = d.nhanGhim({ cheDo: 'ielts', attemptNo: 1, kind: 'mock', overall: 5.5, sosLevel: 0, soDat: null, soYeuCau: 4, soCoDiem: 4 });
    assert(mt1.chu.startsWith('MT1 · 5.5') && mt1.mau === 'dat', `MT đạt: ${JSON.stringify(mt1)}`);
    const mt2 = d.nhanGhim({ cheDo: 'ielts', attemptNo: 2, kind: 'mock', overall: 6, sosLevel: 1, soDat: null, soYeuCau: 4, soCoDiem: 4 });
    assert(mt2.chu === 'MT2 · 6.0 · SOS 1' && mt2.mau === 'sos1', `MT có SOS: ${JSON.stringify(mt2)}`);
    const mt3 = d.nhanGhim({ cheDo: 'ielts', attemptNo: 3, kind: 'mock', overall: null, sosLevel: null, soDat: null, soYeuCau: 4, soCoDiem: 2 });
    assert(mt3.chu === 'MT3 · đang chấm' && mt3.mau === 'tam', `MT đang chấm: ${JSON.stringify(mt3)}`);
    const mt4 = d.nhanGhim({ cheDo: 'ielts', attemptNo: 4, kind: 'mock', overall: null, sosLevel: null, soDat: null, soYeuCau: 4, soCoDiem: 0 });
    assert(mt4.chu === 'MT4' && mt4.mau === 'tam', `MT chưa có điểm: ${JSON.stringify(mt4)}`);
    const giua = d.nhanGhim({ cheDo: 'ratio', attemptNo: 1, kind: 'progress', overall: null, sosLevel: null, soDat: 3, soYeuCau: 4, soCoDiem: 4 });
    assert(giua.gon === 'Giữa' && giua.day.startsWith('Giữa khoá · Đạt 3/4 môn') && giua.mau === 'sos1', `Giữa khoá: ${JSON.stringify(giua)}`);
    const cuoi = d.nhanGhim({ cheDo: 'ratio', attemptNo: 1, kind: 'final', overall: null, sosLevel: null, soDat: 4, soYeuCau: 4, soCoDiem: 4 });
    assert(cuoi.gon === 'Cuối' && cuoi.mau === 'dat', `Cuối khoá đạt: ${JSON.stringify(cuoi)}`);
    for (const r of [giua, cuoi]) assert(!r.chu.includes('MT') && !r.gon.includes('MT') && !r.day.includes('MT'), `Lớp thường không chứa MT: ${JSON.stringify(r)}`);
  });

  check('PR-Qb (1) · nhanGiaiDoan: giai đoạn đã xong có khoảng, đang chạy chỉ có "từ"', () => {
    const xong = d.nhanGiaiDoan({ loai: 'thuong', tu: '2026-06-08', den: '2026-09-25' }, '2026-09-22');
    assert(xong === 'Lớp thường · W2 JUN – W4 SEP', `Giai đoạn đã xong: ${xong}`);
    const dangChay = d.nhanGiaiDoan({ loai: 'ft', tu: '2026-10-05', den: null }, '2026-09-22');
    assert(dangChay === 'Fast Track · từ W2 OCT', `Giai đoạn đang chạy: ${dangChay}`);
  });

  // ==================================================================== PR-UX5 (1) — luật thuần mới

  console.log('\nPR-UX5 · Hành trình: một lưới, điểm ▲▼, màu ghim N-1b');

  check('PR-UX5 (1) · lechDiem FT: ▲ ▼ = theo band một chữ số lẻ, dấu trừ là U+2212 (không phải "-")', () => {
    const len = d.lechDiem(5, 6, 'ielts');
    assert(len.dau === 'len' && len.chu === '▲+1.0', `Lên: ${JSON.stringify(len)}`);
    const xuong = d.lechDiem(6, 5.5, 'ielts');
    assert(xuong.dau === 'xuong' && xuong.chu === '▼−0.5', `Xuống: ${JSON.stringify(xuong)}`);
    assert(xuong.chu.includes('−') && !xuong.chu.includes('-'), 'Phải là dấu trừ U+2212, không phải gạch nối ASCII');
    const bang = d.lechDiem(5.5, 5.5, 'ielts');
    assert(bang.dau === 'bang' && bang.chu === '=', `Bằng: ${JSON.stringify(bang)}`);
  });

  check('PR-UX5 (1) · lechDiem lớp thường: chênh tính từ % ĐÃ LÀM TRÒN (13/20 → 14/19 = 65% → 74% = ▲+9)', () => {
    const r = d.lechDiem(65, 74, 'ratio');
    assert(r.chu === '▲+9', `Chênh %: ${JSON.stringify(r)}`);
    const m = d.chuoiDiem([{ gt: 13, tong: 20, chuaDat: true }, { gt: 14, tong: 19, chuaDat: false }], 'ratio', false);
    assert(m[0].chu === '65%' && m[1].chu === '74%' && m[1].lech?.chu === '▲+9', `Chuỗi: ${JSON.stringify(m)}`);
    assert(d.lechDiem(70, 63, 'ratio').chu === '▼−7', 'Xuống 7 điểm %');
  });

  check('PR-UX5 (1) · chuoiDiem FT: chữ 5.0, mốc xấu, title "dưới kỳ vọng 6.0", mũi tên giữa hai mốc', () => {
    const m = d.chuoiDiem([
      { gt: 5, chuaDat: true, attemptNo: 1, kind: 'mock', kyVong: 6 },
      { gt: 6, chuaDat: false, attemptNo: 2, kind: 'mock', kyVong: 6 },
      { gt: 5.5, chuaDat: true, attemptNo: 3, kind: 'mock', kyVong: 6 },
    ], 'ielts', false);
    assert(m[0].chu === '5.0' && m[0].xau && m[0].lech === null, `Mốc đầu: ${JSON.stringify(m[0])}`);
    assert(m[1].lech?.chu === '▲+1.0' && m[2].lech?.chu === '▼−0.5', `Mũi tên: ${JSON.stringify(m)}`);
    assert(m[2].title === 'MT3 · 5.5 · dưới kỳ vọng 6.0', `Title dưới kỳ vọng: ${m[2].title}`);
    assert(m[1].title === 'MT2 · 6.0 · kỳ vọng 6.0', `Title đạt: ${m[1].title}`);
    assert(d.chuoiDiem([{ gt: 6, chuaDat: false, attemptNo: 2, kind: 'mock' }], 'ielts', false)[0].title === 'MT2 · 6.0', 'Thiếu kyVong: chỉ MT + điểm');
  });

  check('PR-UX5 (1) · chuoiDiem lớp thường: title "Giữa khoá … ngưỡng 70%", KHÔNG chữ "kỳ vọng" / "MT" (Q1)', () => {
    const m = d.chuoiDiem([
      { gt: 13, tong: 20, chuaDat: true, attemptNo: 1, kind: 'progress', maLop: 'MB-FOU 03' },
      { gt: 16, tong: 20, chuaDat: false, attemptNo: 2, kind: 'final', maLop: 'MB-FOU 03' },
    ], 'ratio', false);
    assert(m[0].title === 'Giữa khoá MB-FOU 03 · 65% (13/20) · Chưa đạt — ngưỡng 70%', `Title: ${m[0].title}`);
    assert(m[1].title === 'Cuối khoá MB-FOU 03 · 80% (16/20) · Đạt', `Title đạt: ${m[1].title}`);
    for (const x of m) assert(!x.title.includes('kỳ vọng') && !x.title.includes('MT'), `Không "kỳ vọng"/"MT": ${x.title}`);
  });

  check('PR-UX5 (1) · chuoiDiem mốc "?": cho=true, không mũi tên, title "chưa chấm" (có/không dotCho)', () => {
    const m = d.chuoiDiem([{ gt: 6, chuaDat: false }], 'ielts', true, { dotCho: { cheDo: 'ielts', attemptNo: 4, kind: 'mock' } });
    const q = m[m.length - 1];
    assert(q.cho && q.chu === '?' && q.lech === null && q.title === 'MT4 · chưa chấm', `Mốc ?: ${JSON.stringify(q)}`);
    assert(d.chuoiDiem([], 'ielts', true)[0].title === 'Đợt sắp tới · chưa chấm', 'Không dotCho');
  });

  check('PR-UX5 (1) · chuoiDiem toiDa: 3 giữ 3 mốc cuối (tính cả "?"), mốc đầu lech=null, lech tính SAU khi cắt', () => {
    const diem = [4, 5, 6, 7, 8].map((n) => ({ gt: n, chuaDat: false }));
    const m3 = d.chuoiDiem(diem, 'ielts', false, { toiDa: 3 });
    assert(m3.map((x) => x.chu).join(',') === '6.0,7.0,8.0' && m3[0].lech === null, `3 mốc cuối: ${JSON.stringify(m3)}`);
    const m3q = d.chuoiDiem(diem, 'ielts', true, { toiDa: 3 });
    assert(m3q.length === 3 && m3q[2].cho && m3q[0].chu === '7.0' && m3q[0].lech === null, `2 điểm + "?": ${JSON.stringify(m3q)}`);
    assert(d.chuoiDiem(diem, 'ielts', false).length === 5, 'Mặc định 5 mốc');
  });

  check('PR-UX5 (1) · nhanGhim FT: 6 màu N-1b (Đạt · SOS 1/2/3 · thiếu điểm · chưa có kỳ vọng) + chữ + tooltip', () => {
    const base = { cheDo: 'ielts' as const, attemptNo: 1, kind: 'mock', overall: 5.5, soDat: null, soYeuCau: 4, soCoDiem: 4 };
    assert(d.nhanGhim({ ...base, sosLevel: 0 }).mau === 'dat', 'sos 0 → dat');
    const s1 = d.nhanGhim({ ...base, sosLevel: 1, tuan: '2026-07-06', kyNangChuaDat: ['reading'] });
    assert(s1.mau === 'sos1' && s1.chu === 'MT1 · 5.5 · SOS 1' && s1.gon === 'MT1 5.5', `SOS 1: ${JSON.stringify(s1)}`);
    assert(s1.day.includes('Reading dưới kỳ vọng') && s1.day.includes('W2 JUL') && s1.day.includes('Overall 5.5'), `Tooltip: ${s1.day}`);
    assert(d.nhanGhim({ ...base, sosLevel: 2 }).mau === 'sos2' && d.nhanGhim({ ...base, sosLevel: 3 }).mau === 'sos3', 'sos 2 / 3');
    assert(d.nhanGhim({ ...base, sosLevel: null, soCoDiem: 2 }).mau === 'tam', 'Thiếu điểm → tam');
    const chuaKy = d.nhanGhim({ ...base, sosLevel: null });
    assert(chuaKy.mau === 'tam' && chuaKy.day.includes('chưa có kỳ vọng'), `Chưa có kỳ vọng: ${JSON.stringify(chuaKy)}`);
  });

  check('PR-UX5 (1) · nhanGhim lớp thường: "Giữa · SOS 1" / "Cuối · Đạt" / "Cuối · tạm thời", không chữ "MT"', () => {
    const base = { cheDo: 'ratio' as const, attemptNo: 1, overall: null, soYeuCau: 4, maLop: 'MB-FOU 03' };
    const g = d.nhanGhim({ ...base, kind: 'progress', sosLevel: 1, soDat: 3, soCoDiem: 4 });
    assert(g.chu === 'Giữa · SOS 1' && g.mau === 'sos1' && g.day === 'Giữa khoá MB-FOU 03 · Đạt 3/4 môn · SOS 1', `Giữa: ${JSON.stringify(g)}`);
    const c = d.nhanGhim({ ...base, kind: 'final', sosLevel: 0, soDat: 4, soCoDiem: 4 });
    assert(c.chu === 'Cuối · Đạt' && c.mau === 'dat', `Cuối đạt: ${JSON.stringify(c)}`);
    const t = d.nhanGhim({ ...base, kind: 'final', sosLevel: 2, soDat: 2, soCoDiem: 3 });
    assert(t.chu === 'Cuối · tạm thời' && t.mau === 'tam' && t.day.includes('mới chấm 3/4 môn'), `Tạm thời: ${JSON.stringify(t)}`);
    const trong = d.nhanGhim({ ...base, kind: 'progress', sosLevel: null, soDat: null, soCoDiem: 0 });
    assert(trong.chu === 'Giữa' && trong.mau === 'tam', `Chưa điểm: ${JSON.stringify(trong)}`);
    for (const r of [g, c, t, trong]) assert(!/MT/.test(`${r.chu}${r.gon}${r.day}`), `Không "MT": ${JSON.stringify(r)}`);
  });

  check('PR-UX5 (1) · gomGhimTheoTuan: hai ngày khác nhau trong một tuần → 1 nhóm đúng thứ tự; khác tuần → 2 nhóm', () => {
    const cung = d.gomGhimTheoTuan([
      { tuan: '2026-07-09', attemptNo: 2, id: 'b' }, { tuan: '2026-07-07', attemptNo: 1, id: 'a' },
    ]);
    assert(cung.length === 1 && cung[0].tuan === '2026-07-06' && cung[0].ghim.map((g) => g.id).join('') === 'ab', `Cùng tuần: ${JSON.stringify(cung)}`);
    const khac = d.gomGhimTheoTuan([{ tuan: '2026-07-14', attemptNo: 2 }, { tuan: '2026-07-07', attemptNo: 1 }]);
    assert(khac.length === 2 && khac[0].tuan < khac[1].tuan, `Khác tuần: ${JSON.stringify(khac)}`);
  });

  check('PR-UX5 (1) · nhanKhoiPa: dấu/màu 7 nhánh, tên PA không chứa "·", tooltip quá hạn có số ngày và ngày dd/mm', () => {
    const co = { ten: 'Học tutor', followupOverdue: false, tu: '2026-09-14', den: null as string | null };
    const dem = (o: object) => d.nhanKhoiPa({ status: 'completed', lastOutcome: null, ...co, ...o } as any, '2026-09-23');
    const cacNhanh = [
      [{ lastOutcome: 'improved' }, '✓', 'ok'], [{ lastOutcome: 'partial' }, '◐', 'part'],
      [{ lastOutcome: 'unchanged' }, '✗', 'bad'], [{ lastOutcome: 'worse' }, '✗', 'bad'],
      [{}, '■', 'done'], [{ status: 'started' }, '▶', 'run'], [{ status: 'started', followupOverdue: true, soNgayQuaHan: 2 }, '⚠', 'late'],
    ] as const;
    for (const [o, dau, tone] of cacNhanh) {
      const n = dem(o);
      assert(n.dau === dau && n.tone === tone && !n.ten.includes('·'), `${JSON.stringify(o)} → ${JSON.stringify(n)}`);
    }
    const quaHan = dem({ status: 'started', followupOverdue: true, soNgayQuaHan: 2 });
    assert(quaHan.day === 'Học tutor · ▶ Đang thực hiện · ⚠ Quá hạn cập nhật 2 ngày · từ 14/09', `Quá hạn: ${quaHan.day}`);
    assert(dem({ status: 'started' }).day === 'Học tutor · ▶ Đang thực hiện · từ 14/09', 'Đang chạy');
    assert(dem({ den: '2026-09-20', lastOutcome: 'improved' }).day === 'Học tutor · ✓ Tiến bộ rõ · 14/09 → 20/09', 'Đã xong có kết quả');
    assert(dem({}).day.includes('■ Đã kết thúc, chưa ghi kết quả'), 'Đã kết thúc chưa ghi');
  });

  check('PR-UX5 (1) · denKhoiPa: PA đang chạy kết thúc ở tuần hôm nay; có den giữ den; PA sắp tới giữ ngày bắt đầu (Q4)', () => {
    assert(d.denKhoiPa({ tu: '2026-09-01', den: null }, '2026-09-23') === '2026-09-23', 'Đang chạy → hôm nay');
    assert(d.denKhoiPa({ tu: '2026-09-01', den: '2026-09-10' }, '2026-09-23') === '2026-09-10', 'Đã xong → den');
    assert(d.denKhoiPa({ tu: '2026-10-05', den: null }, '2026-09-23') === '2026-10-05', 'Chưa tới ngày → chính tu');
  });

  check('PR-UX5 (1) · trangThaiHop có `ngan` (phần trước " · ") cho cả 4 trạng thái', () => {
    const h = '2026-09-22';
    const ngan = (i: Parameters<typeof d.trangThaiHop>[0]) => d.trangThaiHop(i, h)?.ngan;
    assert(ngan({ caseMo: [{ mo: '2026-08-01', soPa: 0 }], coTungCase: true, diemCuoiChuaDat: null, xongGanNhat: null }) === 'Chưa có PA', 'Chưa có PA');
    assert(ngan({ caseMo: [{ mo: '2026-08-01', soPa: 1 }], coTungCase: true, diemCuoiChuaDat: true, xongGanNhat: null }) === 'Cần hỗ trợ', 'Cần hỗ trợ');
    assert(ngan({ caseMo: [{ mo: '2026-08-01', soPa: 1 }], coTungCase: true, diemCuoiChuaDat: false, xongGanNhat: null }) === 'Đang theo dõi', 'Đang theo dõi');
    assert(ngan({ caseMo: [], coTungCase: true, diemCuoiChuaDat: null, xongGanNhat: '2026-08-30' }) === 'Đã ổn', 'Đã ổn');
  });

  check('PR-UX5 (1) · dongPhuVanDe: 3 dạng, ngày dd/mm không năm khi cùng năm (G-6), ≤ 60 ký tự', () => {
    const h = '2026-09-23';
    assert(d.dongPhuVanDe({ mo: '2026-09-14', dong: null, soPa: 1 }, h) === 'từ 14/09 · 1 PA', 'Đang mở có PA');
    assert(d.dongPhuVanDe({ mo: '2026-09-18', dong: null, soPa: 0 }, h) === 'từ 18/09 · chưa có PA', 'Đang mở chưa PA');
    assert(d.dongPhuVanDe({ mo: '2026-07-12', dong: '2026-08-24', soPa: 2 }, h) === '12/07 → 24/08 · 2 PA', 'Đã đóng');
    assert(d.dongPhuVanDe({ mo: '2025-12-12', dong: '2026-01-24', soPa: 2 }, h).startsWith('12/12/2025'), 'Khác năm có năm');
  });

  check('PR-UX5 (1) · boCucHanhTrinh: 5 tình huống (gọn · 1440 ≥ 300 · 1920 → 320 · 700px → 148 · chuỗi dài 300 < cotTen ≤ 440)', () => {
    const gon = d.boCucHanhTrinh({ rong: 1440, soTuan: 13, xemGon: true, rongChuoi: 100, cheDo: 'ielts' });
    assert(gon.cotTen === 148 && gon.cotTuan === '40px' && gon.xuongDong && gon.toiDaMoc === 3, `Gọn: ${JSON.stringify(gon)}`);
    const r1440 = d.boCucHanhTrinh({ rong: 1440, soTuan: 13, xemGon: false, rongChuoi: 100, cheDo: 'ielts' });
    assert(r1440.cotTen === 300 && !r1440.xuongDong && r1440.toiDaMoc === 5 && r1440.cotTuan === 'minmax(48px, 1fr)', `1440: ${JSON.stringify(r1440)}`);
    assert(d.boCucHanhTrinh({ rong: 1920, soTuan: 21, xemGon: false, rongChuoi: 100, cheDo: 'ratio' }).cotTen === 320, '1920 → 320');
    const hep = d.boCucHanhTrinh({ rong: 700, soTuan: 13, xemGon: false, rongChuoi: 100, cheDo: 'ielts' });
    assert(hep.cotTen === 148 && hep.xuongDong && hep.cotTuan === 'minmax(48px, 1fr)' && hep.toiDaMoc === 3, `700px: ${JSON.stringify(hep)}`);
    const dai = d.boCucHanhTrinh({ rong: 1600, soTuan: 13, xemGon: false, rongChuoi: 230, cheDo: 'ielts' });
    assert(dai.cotTen > 300 && dai.cotTen <= 440, `Chuỗi dài: ${dai.cotTen}`);
    assert(d.boCucHanhTrinh({ rong: 1600, soTuan: 13, xemGon: false, rongChuoi: 900, cheDo: 'ielts' }).cotTen === 440, 'Kẹp trên 440');
  });

  check('PR-UX5 (1) · rongCotTuan + ngưỡng KHOI_PA_CO_TEN: 82×1 không tên, 82×2 có tên, 40×3 không tên', () => {
    const r = d.boCucHanhTrinh({ rong: 1440, soTuan: 13, xemGon: false, rongChuoi: 100, cheDo: 'ielts' });
    const w = d.rongCotTuan(r, 1440, 13);
    assert(Math.abs(w - 87.7) < 0.1, `(1440 − 300)/13 ≈ 87.7: ${w}`);
    const gon = d.boCucHanhTrinh({ rong: 375, soTuan: 13, xemGon: true, rongChuoi: 0, cheDo: 'ielts' });
    assert(d.rongCotTuan(gon, 375, 13) === 40, 'Xem gọn luôn 40');
    assert(82 * 1 < d.KHOI_PA_CO_TEN && 82 * 2 >= d.KHOI_PA_CO_TEN && 40 * 3 < d.KHOI_PA_CO_TEN, `Ngưỡng ${d.KHOI_PA_CO_TEN}`);
    assert(d.rongCotTuan(d.boCucHanhTrinh({ rong: 600, soTuan: 20, xemGon: false, rongChuoi: 0, cheDo: 'ielts' }), 600, 20) === 48, 'Không thấp hơn 48');
  });

  check('PR-UX5 (1) · xepHangLuoi: đúng ví dụ kế hoạch (không đoạn, 2 hộp) và ví dụ có đoạn (hangDoan 3, hangGhim 4)', () => {
    const a = d.xepHangLuoi({ coDoan: false, coGhim: true, hop: [{ soTangVanDe: [] }, { soTangVanDe: [2, 1] }] });
    assert(a.hangDoan === null && a.hangGhim === 3 && a.hangCuoi === 11, `Hàng: ${JSON.stringify(a)}`);
    assert(a.hop[0].dau === 5 && a.hop[0].khung.join() === '5,6' && a.hop[0].vanDe.length === 0 && a.hop[0].dongAn === null, `Hộp 0: ${JSON.stringify(a.hop[0])}`);
    assert(a.hop[1].dau === 7 && a.hop[1].khung.join() === '7,11' && JSON.stringify(a.hop[1].vanDe) === '[{"tu":8,"so":2},{"tu":10,"so":1}]', `Hộp 1: ${JSON.stringify(a.hop[1])}`);
    assert(a.mau === 'auto auto auto 10px minmax(42px, auto) 10px minmax(42px, auto) minmax(40px, auto) 30px minmax(40px, auto)', `Mẫu: ${a.mau}`);
    const b = d.xepHangLuoi({ coDoan: true, coGhim: true, hop: [{ soTangVanDe: [1], coDongAn: true }] });
    assert(b.hangDoan === 3 && b.hangGhim === 4 && b.hop[0].dau === 6 && b.hop[0].dongAn === 8 && b.hangCuoi === 9, `Có đoạn + dòng ẩn: ${JSON.stringify(b)}`);
    assert(d.xepHangLuoi({ coDoan: false, coGhim: false, hop: [] }).hangCuoi === 3, 'Lưới rỗng chỉ còn hai hàng trục');
  });

  check('PR-UX5 (1) · uocRongChuoi: tăng theo số mốc, có mũi tên thì rộng hơn, "?" cộng 16px', () => {
    const m2 = d.chuoiDiem([{ gt: 5, chuaDat: false }, { gt: 6, chuaDat: false }], 'ielts', false);
    const m1 = d.chuoiDiem([{ gt: 5, chuaDat: false }], 'ielts', false);
    assert(d.uocRongChuoi(m2) > d.uocRongChuoi(m1), 'Nhiều mốc rộng hơn');
    assert(d.uocRongChuoi(d.chuoiDiem([{ gt: 5, chuaDat: false }], 'ielts', true)) === Math.ceil(3 * 7.6 + 1 * 7.6 + 16), 'Mốc "?"');
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
    // Sửa sau rà #75 (7): đếm TRỌN tuần chứa `tu` và tuần chứa `den` — thiếu +1 thì mọi khoá đều báo ít hơn 1 tuần.
    for (const x of r.doan) {
      const soTuanKyVong = Math.max(1, Math.round((Date.parse(x.den) - Date.parse(x.tu)) / (7 * 86_400_000)) + 1);
      assert(x.nhan.endsWith(`${soTuanKyVong} tuần`), `Đoạn "${x.nhan}" phải đếm đủ +1 tuần (kỳ vọng ${soTuanKyVong} tuần)`);
    }
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

  // ==================================================================== PR-UX5 (2) — máy chủ thêm trường, không thêm câu SQL

  /* Đo trên DB seed sạch của `origin/main` (Task 0 kế hoạch PR-UX5): số `prepare` của hanhTrinhHocVien(admin, HV1, …). */
  const SO_CAU_FT = 31;
  const SO_CAU_THUONG = 33;

  check('PR-UX5 (2) · HV1 "ft": mỗi điểm có attemptNo/kind, ≥ 1 kyVong, chuaDat ⇔ gt < kyVong', () => {
    const r = hanhTrinhHocVien(P.admin, HV1, 'ft');
    const moc = r.hop.flatMap((h: any) => h.diem);
    assert(moc.length > 0, 'HV1 phải có điểm ở hộp Fast Track');
    assert(moc.every((x: any) => typeof x.attemptNo === 'number' && typeof x.kind === 'string'), 'Mọi điểm phải có attemptNo/kind');
    assert(moc.some((x: any) => x.kyVong != null), 'Có ít nhất một mốc đã biết kỳ vọng');
    for (const x of moc) if (x.kyVong != null) assert(x.chuaDat === (x.gt < x.kyVong), `chuaDat lệch kyVong: ${JSON.stringify(x)}`);
  });

  check('PR-UX5 (2) · HV1 "thuong": kyVong === null (ngưỡng ở shared), maLop là chuỗi khác rỗng', () => {
    const r = hanhTrinhHocVien(P.admin, HV1, 'thuong');
    const moc = r.hop.flatMap((h: any) => h.diem);
    assert(moc.length > 0, 'HV1 phải có điểm ở hộp lớp thường');
    assert(moc.every((x: any) => x.kyVong === null), 'Lớp thường không có kỳ vọng band');
    assert(moc.every((x: any) => typeof x.maLop === 'string' && x.maLop.length > 0), 'Mọi điểm lớp thường có mã lớp');
  });

  check('PR-UX5 (2) · ghim có kyNangChuaDat (mã thuộc ASSESSED_SKILLS) ở cả hai giai đoạn, và dotCho của hộp có "?"', () => {
    const hop = new Set<string>(d.ASSESSED_SKILLS);
    for (const gd of ['ft', 'thuong'] as const) {
      const r = hanhTrinhHocVien(P.admin, HV1, gd);
      assert(r.ghim.length > 0, `Giai đoạn ${gd} phải có ghim`);
      for (const g of r.ghim as any[]) {
        assert(Array.isArray(g.kyNangChuaDat) && g.kyNangChuaDat.every((k: string) => hop.has(k)), `kyNangChuaDat: ${JSON.stringify(g)}`);
        assert('maLop' in g && 'kyVong' in g, 'Ghim phải có maLop và kyVong');
      }
      for (const h of r.hop as any[]) assert(h.conCho ? h.dotCho && typeof h.dotCho.attemptNo === 'number' : h.dotCho === null, `dotCho ↔ conCho: ${h.kyNang}`);
    }
  });

  check('PR-UX5 (2) · hai đợt cùng tuần: ghim ra 2 phần tử cùng tuần và gomGhimTheoTuan gom thành 1 nhóm 2 ghim', () => {
    const r = hanhTrinhHocVien(P.admin, HV1, 'ft');
    const goc = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(r.ghim[0].attemptId) as any;
    const max = (conn.prepare('SELECT MAX(attempt_no) n FROM assessment_attempts WHERE cycle_id = ?').get(goc.cycle_id) as any).n;
    const id = conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'planned', ?)`,
    ).run(goc.cycle_id, goc.student_id, max + 1, goc.kind, goc.class_id, goc.planned_period_id, new Date().toISOString()).lastInsertRowid as number;
    try {
      const sau = hanhTrinhHocVien(P.admin, HV1, 'ft');
      const tuanGoc = d.mondayOfDate(r.ghim[0].tuan);
      const cungTuan = sau.ghim.filter((g: any) => d.mondayOfDate(g.tuan) === tuanGoc);
      assert(cungTuan.length === 2, `Hai đợt cùng tuần ${tuanGoc}: ${cungTuan.length}`);
      const nhom = d.gomGhimTheoTuan(sau.ghim).filter((n) => n.tuan === tuanGoc);
      assert(nhom.length === 1 && nhom[0].ghim.length === 2 && nhom[0].ghim[0].attemptNo < nhom[0].ghim[1].attemptNo, `Gom: ${JSON.stringify(nhom)}`);
    } finally {
      conn.prepare('DELETE FROM assessment_attempts WHERE id = ?').run(id);
    }
  });

  check('PR-UX5 (2) · PA quá hạn có soNgayQuaHan > 0 (khớp followupOverdue), PA không quá hạn có null', () => {
    const homNay = (hanhTrinhHocVien(P.admin, HV1, null) as any).homNay as string;
    const row = conn.prepare(
      `SELECT sc.student_id AS sid FROM case_interventions ci JOIN sos_cases sc ON sc.id = ci.case_id
        WHERE ci.status NOT IN ('completed', 'cancelled') AND ci.action_due IS NOT NULL AND ci.action_due < ? LIMIT 1`,
    ).get(homNay) as any;
    assert(row, 'Seed phải có một PA quá hạn cập nhật');
    let quaHan = 0;
    for (const gd of ['ft', 'thuong'] as const) {
      const r = hanhTrinhHocVien(P.admin, row.sid, gd);
      for (const h of r.hop as any[]) for (const v of h.vanDe) for (const pa of v.pa) {
        assert('soNgayQuaHan' in pa, 'Mọi PA phải có soNgayQuaHan');
        if (pa.followupOverdue) { quaHan += 1; assert(pa.soNgayQuaHan > 0, `PA quá hạn phải > 0 ngày: ${JSON.stringify(pa)}`); }
        else assert(pa.soNgayQuaHan === null, `PA không quá hạn phải null: ${JSON.stringify(pa)}`);
      }
    }
    assert(quaHan > 0, 'Phải thấy ít nhất một PA quá hạn trong hành trình của học viên đó');
  });

  check('PR-UX5 (2) · số câu lệnh không tăng so với mốc origin/main (FT ≤ 31, lớp thường ≤ 33)', () => {
    const demTruyVan = (fn: () => void): number => {
      let n = 0;
      const orig = conn.prepare.bind(conn);
      (conn as any).prepare = (sql: string) => { n += 1; return orig(sql); };
      try { fn(); } finally { (conn as any).prepare = orig; }
      return n;
    };
    const ft = demTruyVan(() => { hanhTrinhHocVien(P.admin, HV1, 'ft'); });
    const thuong = demTruyVan(() => { hanhTrinhHocVien(P.admin, HV1, 'thuong'); });
    assert(ft <= SO_CAU_FT, `Fast Track: ${ft} câu > mốc ${SO_CAU_FT}`);
    assert(thuong <= SO_CAU_THUONG, `Lớp thường: ${thuong} câu > mốc ${SO_CAU_THUONG}`);
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

  // ==================================================================== Task 4 — tab Hành trình (quét nguồn)

  const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

  check('PR-Qb (4) · JourneyTimeline.tsx không còn (thay bằng HanhTrinh.tsx)', () => {
    assert(!fs.existsSync(path.join(ROOT, 'web/src/modules/students/JourneyTimeline.tsx')), 'File cũ phải bị xoá');
  });

  check('PR-Qb (4) · HanhTrinh.tsx không chứa "dự kiến", SectionNote, weekCodeOf', () => {
    const src = doc('web/src/modules/students/HanhTrinh.tsx');
    assert(!src.includes('dự kiến'), 'Không vẽ đuôi "dự kiến" (Q4)');
    assert(!src.includes('SectionNote'), 'Không dùng SectionNote — chú thích một dòng thay thế');
    assert(!src.includes('weekCodeOf'), 'Trục dùng trucTuan/hanhTrinh.ts, không dùng weekCodeOf cũ');
  });

  check('PR-Qb (4) · StudentDetailPage.tsx không còn chữ "Các mốc đã qua" (đổi thành "Mốc học tập")', () => {
    assert(!doc('web/src/modules/students/StudentDetailPage.tsx').includes('Các mốc đã qua'), 'Chữ cũ phải hết');
    assert(doc('web/src/modules/students/HanhTrinh.tsx').includes('Mốc học tập'), 'Chữ mới phải có ở HanhTrinh.tsx');
  });

  // ==================================================================== Task 5 — R7/R8c (quét nguồn)

  check('PR-Qb (5) · StudentDetailPage.tsx gọi docThamSoHoSo để đọc tham số hồ sơ', () => {
    assert(doc('web/src/modules/students/StudentDetailPage.tsx').includes('docThamSoHoSo'), 'Phải gọi docThamSoHoSo');
  });

  check('PR-Qb (5) · StudentDetailPage.tsx không còn đọc lẻ params.get(\'lo-trinh\'|\'tab\')', () => {
    const src = doc('web/src/modules/students/StudentDetailPage.tsx');
    assert(!/params\.get\(['"]lo-trinh['"]\)/.test(src), 'Không còn đọc lẻ params.get(\'lo-trinh\')');
    assert(!/params\.get\(['"]tab['"]\)/.test(src), 'Không còn đọc lẻ params.get(\'tab\')');
  });

  // ==================================================================== Task 6 — đầu hồ sơ lớp thường, chữ §6, khối SOS

  check('PR-Qb (6) · Q17 attemptProgressView cheDo=ratio: đủ điểm đạt hết → "Đạt 4/4 môn", không chứa "kỳ vọng"', () => {
    const v = d.attemptProgressView({ scored: 4, required: 4, passed: true, sos: 0, cheDo: 'ratio' });
    assert(v.text === 'Đạt 4/4 môn', `Chữ: ${v.text}`);
    assert(!v.text.includes('kỳ vọng') && !v.overallText.includes('kỳ vọng'), `Không được có "kỳ vọng": ${v.text} / ${v.overallText}`);
    assert(v.passBadge === true, 'Đủ điểm và đạt hết phải có badge');
  });

  check('PR-Qb (6) · Q17 attemptProgressView cheDo=ratio: chưa đủ điểm → chứa "môn đã chấm"', () => {
    const v = d.attemptProgressView({ scored: 2, required: 4, passed: null, sos: 0, cheDo: 'ratio' });
    assert(v.text.includes('môn đã chấm'), `Chữ: ${v.text}`);
    assert(v.passBadge === false, 'Chưa đủ điểm không bao giờ có badge');
  });

  check('PR-Qb (6) · Q17 attemptProgressView: gọi cũ không cheDo → chữ FT không đổi', () => {
    const cu = d.attemptProgressView({ scored: 4, required: 4, passed: true, sos: 0 });
    assert(cu.text === 'Đã đủ điểm · Đạt kỳ vọng', `FT phải giữ nguyên chữ cũ: ${cu.text}`);
    const cu2 = d.attemptProgressView({ scored: 2, required: 4, passed: null, sos: null });
    assert(cu2.text === '2/4 kỹ năng có điểm', `FT chưa đủ điểm giữ nguyên chữ cũ: ${cu2.text}`);
  });

  // ==================================================================== Sửa sau rà PR #75 — Vấn đề 3

  check('PR-Qb · sửa sau rà #75 (3): trượt cả 4/4 môn → "Chưa đạt 4/4 môn", không lấy sosLevel (chặn trần 3) làm số môn', () => {
    // sosLevel thật sự chặn trần ở 3 (sosFromFailCount) dù trượt cả 4 môn — phải truyền soMonChuaDat riêng.
    const v = d.attemptProgressView({ scored: 4, required: 4, passed: false, sos: 3, cheDo: 'ratio', soMonChuaDat: 4 });
    assert(v.text === 'Chưa đạt 4/4 môn · SOS 3', `Chữ: ${v.text}`);
    assert(!v.text.includes('3/4'), `Không được lấy nhầm mức SOS 3 làm số môn: ${v.text}`);
  });

  check('PR-Qb · sửa sau rà #75 (3): thiếu soMonChuaDat → tạm lấy sos (không vỡ giao diện cũ)', () => {
    const v = d.attemptProgressView({ scored: 4, required: 4, passed: false, sos: 2, cheDo: 'ratio' });
    assert(v.text === 'Chưa đạt 2/4 môn · SOS 2', `Chữ: ${v.text}`);
  });

  check('PR-Qb (6) · StudentDetailPage.tsx không còn chữ cấm §6: "Số MT đánh lại", "Progress Test", "Final Test", "Lớp Normal", "Mở case"', () => {
    const src = doc('web/src/modules/students/StudentDetailPage.tsx');
    for (const cam of ['Số MT đánh lại', 'Progress Test', 'Final Test', 'Lớp Normal', 'Mở case']) {
      assert(!src.includes(cam), `Còn chữ cấm "${cam}"`);
    }
  });

  // ==================================================================== Task 7 — AN-9, R8a, R8b, thông báo (quét nguồn)

  check('PR-Qb (7) · StudentYThucSection.tsx nhận prop canhBao (AN-9 — một lần gọi /violation-warning)', () => {
    assert(doc('web/src/modules/yThuc/StudentYThucSection.tsx').includes('canhBao'), 'Phải có prop canhBao');
  });

  check('PR-Qb (7) · ClassRoster.tsx: nhãn đợt dùng duongHoSoHocVien, không còn tự dựng /mock-test/ ở đó', () => {
    const src = doc('web/src/modules/students/ClassRoster.tsx');
    assert(src.includes('duongHoSoHocVien'), 'Phải dùng duongHoSoHocVien');
    assert(!/to=\{h\.kind === 'mock' \? `\/mock-test\//.test(src), 'Không còn tự dựng /mock-test/ ở nhãn đợt');
  });

  check('PR-Qb (7) · Header.tsx dùng duongThongBao để điều hướng thông báo', () => {
    assert(doc('web/src/modules/platform/Header.tsx').includes('duongThongBao'), 'Phải gọi duongThongBao');
  });

  // ==================================================================== PR-UX5 (5) — ?dot= cuộn ổn định (quét nguồn)

  check('PR-UX5 (5) · cuonOnDinh.ts: có ResizeObserver, setTimeout (tối đa ms), trả hàm dọn', () => {
    const src = doc('web/src/lib/cuonOnDinh.ts');
    assert(src.includes('ResizeObserver'), 'Phải cuộn lại khi bảng phía trên đổi cỡ (ResizeObserver)');
    assert(src.includes('setTimeout'), 'Phải có hạn chót (setTimeout)');
    assert(/return \(\) =>/.test(src) && src.includes('removeEventListener'), 'Phải trả hàm dọn và gỡ sự kiện người dùng cuộn');
  });

  check('PR-UX5 (5) · StudentDetailPage.tsx gọi cuonOnDinh(, không còn requestAnimationFrame cuộn `dot-` một lần', () => {
    const src = doc('web/src/modules/students/StudentDetailPage.tsx');
    assert(src.includes('cuonOnDinh('), 'Phải gọi cuonOnDinh');
    assert(!src.includes('requestAnimationFrame(() => document.getElementById(`dot-'), 'Cách cuộn một lần cũ phải hết');
  });

  // ==================================================================== PR-UX5 (6) — HanhTrinh.tsx (quét nguồn)

  const boChuThich = (src: string): string => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');

  check('PR-UX5 (6) · HanhTrinh.tsx: không nền đặc pastel, không màu cũ, không đường điểm, không fmtDate', () => {
    const src = boChuThich(doc('web/src/modules/students/HanhTrinh.tsx'));
    for (const cam of ['toneBg', 'khoiPaBg', 'var(--danger)', 'var(--accent-ink)', 'text-slate-600', 'fmtDate', '<svg', '<polyline', '<path']) {
      assert(!src.includes(cam), `HanhTrinh.tsx còn "${cam}"`);
    }
  });

  check('PR-UX5 (6) · HanhTrinh.tsx: 40px chỉ đến từ boCucHanhTrinh (không ", 40px)" cứng trong mẫu cột)', () => {
    assert(!boChuThich(doc('web/src/modules/students/HanhTrinh.tsx')).includes(', 40px)'), 'Cột tuần 40px chỉ được đặt trong boCucHanhTrinh');
  });

  check('PR-UX5 (6) · HanhTrinh.tsx: giữ data-pa-id, công tắc role="switch", và gọi các luật thuần mới', () => {
    const src = boChuThich(doc('web/src/modules/students/HanhTrinh.tsx'));
    for (const can of ['data-pa-id', 'role="switch"', 'xepHangLuoi(', 'gomGhimTheoTuan(', 'denKhoiPa(', 'boCucHanhTrinh(']) {
      assert(src.includes(can), `HanhTrinh.tsx thiếu "${can}"`);
    }
  });

  check('PR-UX5 (6) · HanhTrinh.tsx: chỉ MỘT lưới CSS (một `grid` có gridTemplateColumns) — thành phần con không tự chia cột tuần', () => {
    const src = boChuThich(doc('web/src/modules/students/HanhTrinh.tsx'));
    const soLuoi = (src.match(/gridTemplateColumns:\s*`\$\{boCuc\.cotTen\}px/g) ?? []).length;
    assert(soLuoi === 1, `Phải đúng 1 lưới cột tuần: ${soLuoi}`);
    assert(!/colTemplate/.test(src), 'Không còn khuôn cột cố định cũ (colTemplate)');
  });
}
