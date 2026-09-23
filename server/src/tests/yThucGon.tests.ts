/**
 * PHÉP KIỂM PR-YT2 · Task 1: luật thuần `shared/domain/yThucGon.ts` — đếm lần sửa, nhãn lịch sử, cảnh báo trùng, chia
 * thêm vi phạm, patch PA chỉ gửi phần đổi, khoảng ngày, bộ lọc phụ, chu kỳ hiện tại, khoá nhóm×trạng thái.
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-yt2-y-thuc-gon.md (Task 1, bảng Q1–Q19).
 *
 * Harness do `run.ts` sở hữu và truyền vào, file này không tự mở database — chỉ kiểm luật thuần, không cần `conn`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runYThucGonTests(t: YThucTestKit) {
  const { check, assert } = t;
  const domain: any = await import('../../../shared/domain/index.ts');

  console.log('\nPR-YT2 · 1. Luật thuần (shared/domain/yThucGon.ts)');

  check('PR-YT2 · demLanSua: hai lần sửa, lần đầu đổi 2 trường → 2; dòng measure không tính', () => {
    const history = [
      { id: 1, field: 'description', oldValue: 'a', newValue: 'b', actorUserId: 9, actorName: 'GV', createdAt: '2026-09-01T00:00:00Z' },
      { id: 2, field: 'category', oldValue: 'homework', newValue: 'attendance', actorUserId: 9, actorName: 'GV', createdAt: '2026-09-01T00:00:00Z' },
      { id: 3, field: 'measure', oldValue: null, newValue: '5', actorUserId: 9, actorName: 'GV', createdAt: '2026-09-02T00:00:00Z' },
      { id: 4, field: 'skill', oldValue: null, newValue: 'writing', actorUserId: 7, actorName: 'GV2', createdAt: '2026-09-03T00:00:00Z' },
    ];
    assert(domain.demLanSua(history) === 2, `phải 2, được ${domain.demLanSua(history)}`);
  });

  check('PR-YT2 · nhanLichSuViPham: nhãn nhóm/môn/ngày', () => {
    const category = domain.nhanLichSuViPham({ id: 1, field: 'category', oldValue: 'homework', newValue: 'attendance', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(category.truong === 'Nhóm' && category.cu === 'BTVN' && category.moi === 'Chuyên cần', `category: ${JSON.stringify(category)}`);

    const skill = domain.nhanLichSuViPham({ id: 2, field: 'skill', oldValue: null, newValue: 'writing1', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(skill.truong === 'Môn' && skill.cu === '—' && skill.moi === 'Writing Task 1', `skill: ${JSON.stringify(skill)}`);

    const ngayRow = domain.nhanLichSuViPham(
      { id: 3, field: 'occurred_on', oldValue: '2026-09-01', newValue: '2026-09-05', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' },
      '2026-09-23',
    );
    assert(ngayRow.truong === 'Ngày xảy ra' && ngayRow.cu === '01/09' && ngayRow.moi === '05/09', `ngay: ${JSON.stringify(ngayRow)}`);
    const ngayKhongHomNay = domain.nhanLichSuViPham({ id: 3, field: 'occurred_on', oldValue: '2026-09-01', newValue: '2026-09-05', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(ngayKhongHomNay.moi === '05/09/2026', `không homNay → đầy đủ: ${JSON.stringify(ngayKhongHomNay)}`);
  });

  check('PR-YT2 · nhanLichSuViPham: dòng measure gắn/bỏ khỏi phương án', () => {
    const gan = domain.nhanLichSuViPham({ id: 4, field: 'measure', oldValue: null, newValue: '9', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(gan.truong === '' && gan.moi === 'Gắn vào phương án', `gan: ${JSON.stringify(gan)}`);

    const bo = domain.nhanLichSuViPham({ id: 5, field: 'measure', oldValue: '9', newValue: null, actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' });
    assert(bo.truong === '' && bo.moi === 'Bỏ khỏi phương án', `bo: ${JSON.stringify(bo)}`);
  });

  check('PR-YT2 · cauCanhBaoTrung: 1 dòng và 2 dòng, chưa xử lý và có dòng đã xử lý', () => {
    const mot = domain.cauCanhBaoTrung([{ category: 'homework', occurredOn: '2026-09-05', state: 'unhandled' }], '2026-09-23');
    assert(mot === 'Đã có 1 vi phạm BTVN ngày 05/09 chưa xử lý', `1 dòng: ${mot}`);

    const hai = domain.cauCanhBaoTrung([
      { category: 'homework', occurredOn: '2026-09-05', state: 'unhandled' },
      { category: 'homework', occurredOn: '2026-09-05', state: 'preparing' },
    ], '2026-09-23');
    assert(hai === 'Đã có 2 vi phạm BTVN ngày 05/09', `2 dòng có xử lý: ${hai}`);

    assert(domain.cauCanhBaoTrung([]) === null, 'rỗng → null');
  });

  check('PR-YT2 · chiaThemViPham: chỉ vi phạm ngoài tập đang chọn, chia chưa/đã xử lý, mới nhất trước', () => {
    const tatCa = [
      { id: 1, state: 'unhandled', occurredOn: '2026-09-01' },
      { id: 2, state: 'unhandled', occurredOn: '2026-09-03' },
      { id: 3, state: 'preparing', occurredOn: '2026-09-02' },
      { id: 4, state: 'handled', occurredOn: '2026-09-04' },
    ];
    const { chuaXuLy, daXuLy } = domain.chiaThemViPham(tatCa, new Set([3]));
    assert(chuaXuLy.map((v: any) => v.id).join(',') === '2,1', `chuaXuLy mới nhất trước: ${chuaXuLy.map((v: any) => v.id)}`);
    assert(daXuLy.map((v: any) => v.id).join(',') === '4', `daXuLy không gồm #3 (đang chọn): ${daXuLy.map((v: any) => v.id)}`);
  });

  check('PR-YT2 · thanPatchPhuongAn: không đổi → null; đảo thứ tự tập → null; thêm một vi phạm → chỉ violationIds', () => {
    const goc = { kind: 'talk_short', customName: null, note: 'ghi chú', ownerUserId: 9, violationIds: [1, 2, 3] };
    assert(domain.thanPatchPhuongAn(goc, { kind: 'talk_short', note: 'ghi chú', violationIds: [1, 2, 3] }) === null, 'không đổi → null');
    assert(domain.thanPatchPhuongAn(goc, { violationIds: [3, 1, 2] }) === null, 'đảo thứ tự tập → null');
    const themMoi = domain.thanPatchPhuongAn(goc, { violationIds: [1, 2, 3, 4] });
    assert(JSON.stringify(themMoi) === JSON.stringify({ violationIds: [1, 2, 3, 4] }), `chỉ violationIds: ${JSON.stringify(themMoi)}`);
    const doiLoai = domain.thanPatchPhuongAn(goc, { kind: 'warning_1' });
    assert(JSON.stringify(doiLoai) === JSON.stringify({ kind: 'warning_1' }), `chỉ kind: ${JSON.stringify(doiLoai)}`);
  });

  check("PR-YT2 · tuNgayTheoKhoang('2026-09-23','30') = '2026-08-24'; '7' và 'all'", () => {
    assert(domain.tuNgayTheoKhoang('2026-09-23', '30') === '2026-08-24', domain.tuNgayTheoKhoang('2026-09-23', '30'));
    assert(domain.tuNgayTheoKhoang('2026-09-23', '7') === '2026-09-16', domain.tuNgayTheoKhoang('2026-09-23', '7'));
    assert(domain.tuNgayTheoKhoang('2026-09-23', 'all') === null, 'all → null');
  });

  check('PR-YT2 · hopBoLocPhu: ba bộ lọc (bỏ tat-ca) trên dòng học viên', () => {
    const hv = { coChuaXuLy: true, coPaDangChuanBi: false, canhBao: false };
    assert(domain.hopBoLocPhu('tat-ca', hv) === true, 'tat-ca HV');
    assert(domain.hopBoLocPhu('chua-xu-ly', hv) === true, 'chua-xu-ly HV true');
    assert(domain.hopBoLocPhu('co-pa-dang-chuan-bi', hv) === false, 'co-pa-dang-chuan-bi HV false');
    assert(domain.hopBoLocPhu('qua-5-ngay', hv) === false, 'qua-5-ngay HV false');
  });

  check('PR-YT2 · hopBoLocPhu: ba bộ lọc (bỏ tat-ca) trên dòng vi phạm', () => {
    const vp = { state: 'preparing', ageLabel: '' };
    assert(domain.hopBoLocPhu('tat-ca', vp) === true, 'tat-ca vp');
    assert(domain.hopBoLocPhu('chua-xu-ly', vp) === false, 'chua-xu-ly vp false');
    assert(domain.hopBoLocPhu('co-pa-dang-chuan-bi', vp) === true, 'co-pa-dang-chuan-bi vp true');
    assert(domain.hopBoLocPhu('qua-5-ngay', vp) === false, 'qua-5-ngay vp false (ageLabel rỗng)');
    assert(domain.hopBoLocPhu('qua-5-ngay', { state: 'unhandled', ageLabel: '⚠9n' }) === true, 'qua-5-ngay vp true khi có ageLabel');
  });

  check('PR-YT2 · trongChuKyHienTai: FT so cycleId, lớp thường so classId', () => {
    assert(domain.trongChuKyHienTai({ cycleId: 5, classId: 10 }, { cycleId: 5, classId: 11 }) === true, 'FT cùng cycleId → true dù classId khác');
    assert(domain.trongChuKyHienTai({ cycleId: 6, classId: 10 }, { cycleId: 5, classId: 10 }) === false, 'FT khác cycleId → false');
    assert(domain.trongChuKyHienTai({ cycleId: null, classId: 20 }, { cycleId: null, classId: 20 }) === true, 'lớp thường cùng classId → true');
    assert(domain.trongChuKyHienTai({ cycleId: null, classId: 21 }, { cycleId: null, classId: 20 }) === false, 'lớp thường khác classId → false');
  });

  check('PR-YT2 · NHOM_TRANG_THAI_KHOA đủ 24 khoá, không trùng', () => {
    assert(domain.NHOM_TRANG_THAI_KHOA.length === 24, `phải 24, được ${domain.NHOM_TRANG_THAI_KHOA.length}`);
    assert(new Set(domain.NHOM_TRANG_THAI_KHOA).size === 24, 'không trùng khoá');
    assert(domain.khoaNhomTrangThai('homework', 'unhandled') === 'homework:unhandled', domain.khoaNhomTrangThai('homework', 'unhandled'));
    assert(domain.NHOM_TRANG_THAI_KHOA.includes('tat-ca:tat-ca'), 'có khoá tat-ca:tat-ca');
  });
}
