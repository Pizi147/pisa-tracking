/**
 * PHÉP KIỂM PR-Form: chọn người (F-2), lưu trước đính kèm sau (F-1), bằng chứng (G-9), chủ đề Case theo
 * chương trình (F07), nhập bù (F-3, S5).
 * Đặc tả: docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md §1, §2, §3.13, §3.11, §6, §7 dòng Form.
 * Kế hoạch: docs/superpowers/plans/2026-09-23-pr-form-chon-nguoi.md (bảng Q1–Q13).
 *
 * Harness do `run.ts` sở hữu và truyền vào, file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runFormTests(t: YThucTestKit) {
  const { check, assert } = t;
  const domain: any = await import('../../../shared/domain/index.ts');

  // ================================================================== 1. Luật thuần chọn người, bằng chứng, chủ đề Case

  console.log('\nPR-Form · 1. Luật thuần dùng chung (shared/domain)');

  check('PR-Form · nguoiThanhPayload: bốn dạng + null', () => {
    assert(JSON.stringify(domain.nguoiThanhPayload(null)) === '{}', 'null → {}');
    assert(JSON.stringify(domain.nguoiThanhPayload({ kieu: 'toi' })) === '{"performerSelf":true}', 'toi');
    assert(
      JSON.stringify(domain.nguoiThanhPayload({ kieu: 'tai_khoan', id: 9, ten: 'Cô Lan' })) === '{"performerUserId":9}',
      'tai_khoan chỉ gửi id',
    );
    assert(
      JSON.stringify(domain.nguoiThanhPayload({ kieu: 'ngoai', ten: '  Tutor ngoài Minh  ' }))
        === '{"performerName":"Tutor ngoài Minh"}',
      'ngoai gửi tên đã trim',
    );
  });

  check('PR-Form · nguoiThanhPayloadYThuc: toi gửi không gì cả (K2-6d)', () => {
    assert(JSON.stringify(domain.nguoiThanhPayloadYThuc(null)) === '{}', 'null → {}');
    assert(JSON.stringify(domain.nguoiThanhPayloadYThuc({ kieu: 'toi' })) === '{}', 'toi → {}');
    assert(
      JSON.stringify(domain.nguoiThanhPayloadYThuc({ kieu: 'tai_khoan', id: 5, ten: 'GV' })) === '{"performedBy":5}',
      'tai_khoan → performedBy',
    );
    assert(
      JSON.stringify(domain.nguoiThanhPayloadYThuc({ kieu: 'ngoai', ten: 'Phụ huynh' })) === '{"performerName":"Phụ huynh"}',
      'ngoai → performerName',
    );
  });

  check('PR-Form · nguoiThieu: ba trường hợp', () => {
    assert(domain.nguoiThieu(null, true) === 'Chọn người thực hiện.', 'thiếu + bắt buộc');
    assert(domain.nguoiThieu(null, false) === null, 'thiếu + không bắt buộc → null');
    assert(
      domain.nguoiThieu({ kieu: 'ngoai', ten: 'A' }, true) === 'Gõ tên người ngoài (ít nhất 2 ký tự).',
      'người ngoài tên quá ngắn',
    );
    assert(domain.nguoiThieu({ kieu: 'ngoai', ten: 'An' }, true) === null, 'người ngoài tên đủ dài → null');
    assert(domain.nguoiThieu({ kieu: 'toi' }, true) === null, 'đã chọn Tôi → null');
  });

  check('PR-Form · tenAnhDan: đúng mẫu, đúng đuôi theo mime, giờ Việt Nam', () => {
    const now = new Date('2026-09-23T07:05:00.000Z'); // 14:05 giờ VN
    assert(domain.tenAnhDan(now, 'image/png') === 'anh-chup-23-09-1405.png', `png: ${domain.tenAnhDan(now, 'image/png')}`);
    assert(domain.tenAnhDan(now, 'image/jpeg') === 'anh-chup-23-09-1405.jpg', 'jpg');
    assert(domain.tenAnhDan(now, 'image/webp') === 'anh-chup-23-09-1405.webp', 'webp');
    assert(domain.tenAnhDan(now, 'image/gif') === 'anh-chup-23-09-1405.gif', 'gif');
    assert(domain.tenAnhDan(now, 'application/octet-stream') === 'anh-chup-23-09-1405.png', 'mime lạ → png');
  });

  check('PR-Form · laLienKet: đúng/sai', () => {
    assert(domain.laLienKet('https://drive.google.com/abc') === true, 'https hợp lệ');
    assert(domain.laLienKet('http://example.com/x') === true, 'http hợp lệ');
    assert(domain.laLienKet('https://a.com/x có khoảng trắng') === false, 'có khoảng trắng');
    assert(domain.laLienKet('ftp://a.com/x') === false, 'giao thức ftp không tính');
    assert(domain.laLienKet('https://a.com/x\nhttps://b.com/y') === false, 'hai dòng');
  });

  check('PR-Form · caseTopicsFor: lớp thường 4 môn có writing, không writing1', () => {
    const topics = domain.caseTopicsFor(true);
    assert(topics.length === 4, `4 môn: ${topics.length}`);
    assert(topics.includes('writing') && !topics.includes('writing1'), 'writing, không writing1/writing2');
    assert(JSON.stringify(topics) === JSON.stringify(['listening', 'reading', 'writing', 'speaking']), 'đúng thứ tự L R W S');
    const ft = domain.caseTopicsFor(false);
    assert(JSON.stringify(ft) === JSON.stringify(['listening', 'reading', 'writing1', 'writing2', 'speaking']), 'FT năm ô');
  });
}
