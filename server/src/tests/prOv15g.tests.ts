/**
 * PHÉP KIỂM OV-15g — LỊCH SỬ THAY ĐỔI (C22), gọi QUA HTTP như bản chính: một đường đọc `GET /lich-su?loai=&id=&loc=&tiep=`.
 *  · mỗi đối tượng (lớp: thông tin · tiến độ · phân công; góp ý tuần; nhập HV hàng loạt; thi thật; ô điểm FT; HV + lịch thi) có ca ghi → đọc
 *    ra MỘT mục {luc, nguoi, nguon, lyDo, truong[{ten, cu, moi}]}; lưu lại nguyên giá trị → không thêm mục.
 *  · lô = một mục (mở ra từng HV); quyền đọc = quyền xem đối tượng (403 / 404 / 400); phân trang con trỏ không trùng không sót;
 *    "Lịch sử bắt đầu ghi từ" khi đối tượng có trước mốc ghi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

type Truong = { ten: string; cu: string | null; moi: string | null; doiTuong?: string | null };
type Muc = { id: number | string; luc: string; nguoi: string; nguon: string | null; lyDo: string | null; truong: Truong[] };
type Trang = { dong: Muc[]; tiep: number | null; nhom: { key: string; nhan: string }[]; batDau: string | null };

export async function runPrOv15gTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, P, TODAY } = t;
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const classesSvc: any = await import('../classes/classes.ts');
  const schedule: any = await import('../classes/schedule.ts');
  console.log('\nOV-15g · Lịch sử thay đổi');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const QL = P.mbManager.userId as number;
  const tenQl = one('SELECT full_name n FROM users WHERE id = ?', QL).n as string;
  const lop = one(`SELECT id FROM classes WHERE code = 'MB FT 101'`).id as number;
  /** Nhật ký góp ý tuần cũ (ghi đã khoá — R1-NO-NHO, D14): cùng dạng `gop_y_tuan.ghi` đường ghi cũ để Lịch sử đọc. */
  const { writeAudit } = await import('../platform/audit.ts');
  const { tuanLich } = await import('../../../shared/domain/index.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const gopYCu = (sid: number, nhan: string, cu: string | null, moi: string) => writeAudit({
    actorUserId: QL, action: 'gop_y_tuan.ghi', entityType: 'student', entityId: sid,
    entityLabel: `MB FT 101 · ${tuanLich(mondayOf(TODAY), TODAY)} · ${nhan}`, before: cu === null ? null : { noiDung: cu }, after: { noiDung: moi },
  });
  const lopThuong = one(`SELECT id FROM classes WHERE code = 'MB FOU 12'`).id as number;

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const phien = new Map<number, string>();
  const goi = async (userId: number, url: string, method = 'GET', body?: unknown) => {
    if (!phien.has(userId)) {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
    }
    xoaNho();
    const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers: { 'content-type': 'application/json', cookie: phien.get(userId)! },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: r.status, json: await r.json().catch(() => null) as any };
  };
  const ghi = async (userId: number, url: string, method: string, body: unknown) => {
    const r = await goi(userId, url, method, body);
    assert(r.status === 200, `${method} ${url}: ${r.status} ${JSON.stringify(r.json)?.slice(0, 300)}`);
    return r.json;
  };
  const ls = async (loai: string, id: number, q = '', userId = QL): Promise<Trang> => {
    const r = await goi(userId, `/lich-su?loai=${loai}&id=${id}${q}`);
    assert(r.status === 200, `lịch sử ${loai} ${id}${q}: ${r.status} ${JSON.stringify(r.json)?.slice(0, 300)}`);
    return r.json as Trang;
  };
  const truong = (m: Muc | undefined, ten: string) => m?.truong.find((x) => x.ten === ten);

  try {
    await checkAsync('OV15g-1 · Thông tin lớp: QL sửa ghi chú → MỘT mục "Ghi chú: cũ → mới", người = QL; lưu lại nguyên → không thêm mục', async () => {
      const truoc = (await ls('lop', lop)).dong.length;
      await ghi(QL, `/classes/${lop}/thong-tin`, 'PATCH', { note: 'Lớp sáng thứ 7 · OV15g' });
      const r = await ls('lop', lop);
      assert(r.dong.length === truoc + 1, `thêm đúng một mục: ${truoc} → ${r.dong.length}`);
      const d = r.dong[0];
      assert(d.nguoi === tenQl && truong(d, 'Ghi chú')?.moi === 'Lớp sáng thứ 7 · OV15g', JSON.stringify(d));
      await ghi(QL, `/classes/${lop}/thong-tin`, 'PATCH', { note: 'Lớp sáng thứ 7 · OV15g' });
      assert((await ls('lop', lop)).dong.length === truoc + 1, 'lưu lại nguyên giá trị không thêm mục');
    });

    await checkAsync('OV15g-2 · Tiến độ lớp: đổi tuần Final → mục nhóm "tien-do" (cũ → mới), ghi trong giao dịch; lưu lại nguyên → không thêm nhật ký', async () => {
      /* Mốc hiện tại (phép kiểm trước có thể đã dời): Final mới = Final cũ ± 1, vẫn sau Progress và trong khoá. */
      const pr = schedule.classProgress(lopThuong) as { progressWeek: number | null; finalWeek: number; totalWeeks: number | null };
      const moi = pr.finalWeek + 1 <= (pr.totalWeeks ?? pr.finalWeek + 1) ? pr.finalWeek + 1 : pr.finalWeek - 1;
      assert(moi > (pr.progressWeek ?? 0), `không còn tuần Final hợp lệ: ${JSON.stringify(pr)}`);
      await ghi(QL, `/classes/${lopThuong}/progress`, 'PATCH', { finalWeek: moi });
      const r = await ls('lop', lopThuong, '&loc=tien-do');
      const f = truong(r.dong[0], 'Tuần Final Test');
      assert(f && f.moi === `tuần ${moi}` && f.cu !== f.moi, JSON.stringify(r.dong[0]));
      assert(r.nhom.some((x) => x.key === 'phan-cong') && r.nhom.some((x) => x.key === 'tien-do'), JSON.stringify(r.nhom));
      assert(!(await ls('lop', lopThuong, '&loc=phan-cong')).dong.some((x) => truong(x, 'Tuần Final Test')), 'lọc phân công không có tuần Final');
      const soNk = () => one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'class.progress' AND entity_id = ?`, lopThuong).n as number;
      const n0 = soNk();
      await ghi(QL, `/classes/${lopThuong}/progress`, 'PATCH', { finalWeek: moi });
      assert(soNk() === n0, `lưu lại nguyên không ghi nhật ký: ${n0} → ${soNk()}`);
    });

    await checkAsync('OV15g-3 · Phân công: đổi GV một ô → mục nhóm "phan-cong" "Listening: tên cũ → tên mới"; loai=phan-cong cùng mục', async () => {
      /* Một người mỗi ô (phép kiểm trước có thể để lại hai dòng cùng môn) — bức tranh gửi phải hợp lệ. */
      const cu = all(`SELECT user_id userId, skill, is_core isCore FROM teacher_assignments WHERE class_id = ? AND status = 'active' ORDER BY id`, lop)
        .map((x) => ({ userId: x.userId, skill: x.skill, isCore: x.isCore === 1 }))
        .filter((x, i, ds) => ds.findIndex((y) => y.isCore === x.isCore && (x.isCore || y.skill === x.skill)) === i);
      const o = cu.find((x) => x.skill === 'listening')!;
      const branch = one('SELECT branch_id b FROM classes WHERE id = ?', lop).b;
      const ung = (classesSvc.teacherCandidatesBranch(branch, lop) as any[]).find((u) => u.id !== o.userId && !cu.some((x) => x.userId === u.id));
      assert(o && ung, 'thiếu GV để đổi');
      await ghi(QL, `/classes/${lop}/teachers`, 'PUT', { slots: cu.map((x) => (x === o ? { ...x, userId: ung.id } : x)) });
      const ten = (id: number) => one('SELECT full_name n FROM users WHERE id = ?', id).n;
      const r = await ls('lop', lop, '&loc=phan-cong');
      const f = r.dong[0]?.truong.find((x) => x.ten.startsWith('Listening'));
      assert(f && f.cu === ten(o.userId) && f.moi === ten(ung.id), JSON.stringify(r.dong[0]));
      const r2 = await ls('phan-cong', lop);
      assert(r2.dong[0]?.id === r.dong[0].id, 'loai=phan-cong cùng mục');
      await ghi(QL, `/classes/${lop}/teachers`, 'PUT', { slots: cu });   // trả lại như cũ cho phép kiểm sau
    });

    const them = await ghi(QL, '/intake/commit', 'POST', { classId: lop, idempotencyKey: `ov15g-${Date.now()}`, rows: [
      { fullName: 'OV15g Em A', email: 'a.ov15g@demo.test', dob: '2010-01-01', target: 7 },
      { fullName: 'OV15g Em B', email: 'b.ov15g@demo.test', dob: '2010-02-02', target: 6.5 },
    ] });
    const [a, b] = them.studentIds as number[];

    await checkAsync('OV15g-4 · Nhập HV hàng loạt: một lô 2 em = MỘT mục, mở ra từng em (tên HV), nguồn có tên lớp', async () => {
      const r = await ls('nhap-hv', lop);
      const d = r.dong[0];
      assert(d && d.truong.length === 2 && d.nguon?.includes('MB FT 101'), JSON.stringify(d));
      assert(d.truong.map((x) => x.doiTuong ?? x.ten).sort().join('|') === 'OV15g Em A|OV15g Em B', JSON.stringify(d.truong));
    });

    await checkAsync('OV15g-5 · Góp ý tuần (nhật ký cũ): ghi rồi sửa dài → mục mới nhất "cũ → mới" đủ chữ (không cắt), có tên HV', async () => {
      const dai = 'Em nghe tốt phần 1, cần luyện thêm dạng bản đồ và điền bảng; về nhà làm lại hai đề Cambridge 18 và ghi lại từ sai vào sổ từ vựng.';
      assert(dai.length > 120, 'chữ dài > 120');
      gopYCu(a, 'Listening', null, 'Ngắn');
      gopYCu(a, 'Listening', 'Ngắn', dai);
      const r = await ls('gop-y', lop);
      const f = r.dong[0]?.truong[0];
      assert(f && f.cu === 'Ngắn' && f.moi === dai && (f.doiTuong ?? f.ten).includes('OV15g Em A'), JSON.stringify(r.dong[0]));
    });

    await checkAsync('OV15g-6 · Phân trang: 22 lần sửa góp ý → trang 20 + "tiep"; trang sau nối tiếp, không trùng không sót', async () => {
      for (let i = 0; i < 22; i += 1) gopYCu(b, 'Reading', i ? `Lần ${i - 1}` : null, `Lần ${i}`);
      const p1 = await ls('gop-y', lop);
      assert(p1.dong.length === 20 && p1.tiep !== null, `trang 1: ${p1.dong.length} · tiep ${p1.tiep}`);
      const p2 = await ls('gop-y', lop, `&tiep=${p1.tiep}`);
      const ids = [...p1.dong, ...p2.dong].map((x) => String(x.id));
      assert(new Set(ids).size === ids.length && p2.dong.length >= 3, `trùng hoặc thiếu: ${p2.dong.length}`);
      assert(p2.dong.some((x) => x.truong[0]?.moi === 'Lần 0'), 'trang 2 có lần sửa đầu');
    });

    const cy = one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, a).id as number;
    await checkAsync('OV15g-7 · Thi thật: nhập điểm + ghi chú → mục "L: trống → 6.0 …", "Ghi chú"; lưu lại nguyên → không thêm mục', async () => {
      await ghi(QL, `/cycles/${cy}/outcome`, 'PUT', { ngayThi: TODAY, l: 6, r: 6.5, w: 6, s: 6, ghiChu: 'Thi ở IDP' });
      const r = await ls('thi-that', cy);
      const d = r.dong[0];
      assert(truong(d, 'L')?.cu === null && truong(d, 'L')?.moi === '6.0' && truong(d, 'Ghi chú')?.moi === 'Thi ở IDP', JSON.stringify(d));
      const n = r.dong.length;
      await ghi(QL, `/cycles/${cy}/outcome`, 'PUT', { ngayThi: TODAY, l: 6, r: 6.5, w: 6, s: 6, ghiChu: 'Thi ở IDP' });
      assert((await ls('thi-that', cy)).dong.length === n, 'lưu lại nguyên không thêm mục');
    });

    await checkAsync('OV15g-8 · Hồ sơ HV: loai=hv như Lịch sử sửa (OV-13j) + ghi chú lịch thi (OV-15f) hiện thành trường', async () => {
      const cu = await goi(QL, `/students/${a}/lich-su-sua`);
      const r = await ls('hv', a);
      assert(r.dong.length === cu.json.dong.length, `hv ${r.dong.length} ≠ lich-su-sua ${cu.json.dong.length}`);
      await ghi(QL, `/hoc-vien-lop/lich-thi/${cy}`, 'PUT', { ghiChu: 'Chờ em xác nhận ngày' });
      const d = (await ls('hv', a)).dong[0];
      assert(truong(d, 'Ghi chú lịch Test')?.moi === 'Chờ em xác nhận ngày', JSON.stringify(d));
    });

    await checkAsync('OV15g-9 · Ô điểm FT: nhận xét dài + GV chấm S → mục đủ chữ nhận xét và "GV chấm: … → …"', async () => {
      const luot = one(`SELECT a.id FROM assessment_attempts a JOIN assessment_scores s ON s.attempt_id = a.id AND s.skill = 'speaking' AND s.band IS NOT NULL
                         WHERE a.class_id = ? AND a.status != 'cancelled' ORDER BY a.id DESC LIMIT 1`, lop).id as number;
      const nx = 'Phát âm rõ, trả lời đủ ý Part 2 nhưng còn ngập ngừng khi chuyển ý; Part 3 cần thêm ví dụ thực tế và mở rộng câu trả lời hơn nữa nhé.';
      await ghi(QL, `/attempts/${luot}/scores/speaking`, 'PUT', { nhanXet: nx, gvCham: { performerName: 'GV Ngoài OV15g' } });
      const r = await ls('o', luot);
      const ds = r.dong[0]?.truong ?? [];
      assert(ds.some((x) => x.moi === nx), `nhận xét đủ chữ: ${JSON.stringify(ds)}`);
      assert(ds.some((x) => x.ten.includes('GV chấm') && x.moi === 'GV Ngoài OV15g'), `GV chấm: ${JSON.stringify(ds)}`);
    });

    await checkAsync('OV15g-10 · Quyền: GV lớp khác / QL chi nhánh khác 403; loại sai 400; đối tượng không có 404; GVBM xem lịch sử HV 403', async () => {
      const ngoai = one(`SELECT ta.user_id id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
                          WHERE c.branch_id != (SELECT branch_id FROM classes WHERE id = ?) AND ta.status = 'active'
                            AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?) LIMIT 1`, lop, lop).id as number;
      for (const [u, loai, id] of [[ngoai, 'lop', lop], [P.cpManager.userId, 'lop', lop], [P.cpManager.userId, 'gop-y', lop], [P.cpManager.userId, 'thi-that', cy],
        [P.cpManager.userId, 'nhap-hv', lop]] as [number, string, number][]) {
        const r = await goi(u, `/lich-su?loai=${loai}&id=${id}`);
        assert(r.status === 403, `${u} ${loai}: ${r.status}`);
      }
      assert((await goi(QL, `/lich-su?loai=abc&id=${lop}`)).status === 400, 'loại sai 400');
      assert((await goi(QL, `/lich-su?loai=lop`)).status === 400, 'thiếu id 400');
      assert((await goi(QL, `/lich-su?loai=lop&id=999999`)).status === 404, 'lớp không có 404');
      assert((await goi(P.subjectTeacher.userId, `/lich-su?loai=hv&id=${a}`)).status === 403, 'GVBM xem HV 403');
    });

    await checkAsync('OV15g-11 · "Lịch sử bắt đầu ghi từ": lớp có từ trước mốc ghi → trang cuối trả `batDau`; ô điểm cũng vậy (OV-15i1 ý 9)', async () => {
      const r = await ls('lop', lop);
      assert(r.tiep === null && /^\d{4}-\d{2}-\d{2}$/.test(r.batDau ?? ''), `batDau: ${r.batDau}`);
      const luot = one(`SELECT id FROM assessment_attempts WHERE class_id = ? ORDER BY id LIMIT 1`, lop).id as number;
      assert(/^\d{4}-\d{2}-\d{2}$/.test((await ls('o', luot)).batDau ?? ''), 'ô điểm có trước mốc → báo mốc (OV-15i1)');
    });
  } finally {
    may.close();
  }
}
