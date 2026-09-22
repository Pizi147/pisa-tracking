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
  const { check, assert, conn, P } = t;
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

  // ================================================================== 2. Máy chủ: tìm người GET /ref/nguoi

  console.log('\nPR-Form · 2. GET /ref/nguoi — tìm người không dấu, ≥ 3 ký tự, gợi ý GV lớp của em');

  {
    const { createApp } = await import('../app.ts');
    const { createSession } = await import('../auth.ts');
    const intake = await import('../classes/intake.ts');
    const server = createApp().listen(0);
    const port = (server.address() as any).port as number;
    const call = async (who: { userId: number } | null, url: string) => {
      const headers: Record<string, string> = {};
      if (who) headers.cookie = `pisa_demo_session=${createSession(who.userId)}`;
      const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { headers });
      let json: any = null;
      try { json = await res.json(); } catch { /* không có thân */ }
      return { status: res.status, json };
    };

    const fouClassId = t.classId('MB-FOU 12');
    intake.commitIntake(P.admin, {
      classId: fouClassId, rows: [{ fullName: 'PR-Form Em Fou', target: 7 }],
      dateFormat: 'iso', idempotencyKey: 'pr-form-ref-nguoi-fou',
    });
    const fouStudent = conn.prepare(`SELECT id FROM students WHERE full_name = 'PR-Form Em Fou'`).get() as any;

    const noStudent = await call(P.w1Teacher, '/ref/nguoi?q=tr&nhom=giao_vien');
    const searchTeacher = await call(P.w1Teacher, '/ref/nguoi?q=tran+ngoc&nhom=giao_vien');
    const managerAsTeacher = await call(P.w1Teacher, '/ref/nguoi?q=khanh+vy&nhom=giao_vien');
    const managerAsStaff = await call(P.w1Teacher, '/ref/nguoi?q=khanh+vy&nhom=nhan_vien');
    const suggestFou = await call(P.w1Teacher, `/ref/nguoi?q=&nhom=giao_vien&studentId=${fouStudent.id}`);

    const lockedId = P.lrTeacher.userId;
    const lockedName = (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(lockedId) as any).full_name as string;
    const lockedQuery = encodeURIComponent(lockedName.split(' ').slice(-2).join(' '));
    let lockedResult: any;
    try {
      conn.prepare(`UPDATE users SET status = 'inactive' WHERE id = ?`).run(lockedId);
      lockedResult = await call(P.w1Teacher, `/ref/nguoi?q=${lockedQuery}&nhom=giao_vien`);
    } finally {
      conn.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).run(lockedId);
    }
    server.close();

    check('PR-Form · GV không có MEETING_VIEW vẫn gọi được /ref/nguoi (200)', () => {
      assert(searchTeacher.status === 200, `200: ${searchTeacher.status} ${JSON.stringify(searchTeacher.json)}`);
    });

    check('PR-Form · dưới 3 ký tự, không studentId → mảng rỗng', () => {
      assert(Array.isArray(noStudent.json) && noStudent.json.length === 0, `[]: ${JSON.stringify(noStudent.json)}`);
    });

    check('PR-Form · gõ không dấu "tran ngoc" tìm ra GV "Trần Ngọc Hà"', () => {
      const names = (searchTeacher.json ?? []).map((r: any) => r.name);
      assert(names.includes('Trần Ngọc Hà'), `Không thấy Trần Ngọc Hà trong: ${JSON.stringify(names)}`);
    });

    check('PR-Form · nhóm giao_vien không có Quản lý thuần; nhóm nhan_vien có', () => {
      const namesTeacherGroup = (managerAsTeacher.json ?? []).map((r: any) => r.name);
      const namesStaffGroup = (managerAsStaff.json ?? []).map((r: any) => r.name);
      assert(!namesTeacherGroup.includes('Nguyễn Khánh Vy'), `giao_vien không được có QL thuần: ${JSON.stringify(namesTeacherGroup)}`);
      assert(namesStaffGroup.includes('Nguyễn Khánh Vy'), `nhan_vien phải có QL: ${JSON.stringify(namesStaffGroup)}`);
    });

    check('PR-Form · tài khoản bị khoá (status inactive) không hiện trong kết quả tìm', () => {
      const names = (lockedResult.json ?? []).map((r: any) => r.name);
      assert(!names.includes(lockedName), `Tài khoản khoá không được hiện: ${lockedName} trong ${JSON.stringify(names)}`);
    });

    check('PR-Form · studentId của em lớp MB-FOU 12 + q rỗng → đúng các GV đang dạy lớp đó, cungLop = true', () => {
      const rows = suggestFou.json ?? [];
      assert(Array.isArray(rows) && rows.length > 0, `phải gợi ý ít nhất một GV: ${JSON.stringify(rows)}`);
      assert(rows.every((r: any) => r.cungLop === true), `mọi dòng gợi ý trước khi gõ phải cungLop=true: ${JSON.stringify(rows)}`);
      const names = rows.map((r: any) => r.name);
      assert(names.includes('Trần Ngọc Hà'), `GVCN MB-FOU 12 phải nằm trong gợi ý: ${JSON.stringify(names)}`);
    });
  }
}
