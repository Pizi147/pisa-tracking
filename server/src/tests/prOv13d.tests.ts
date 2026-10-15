/**
 * PHÉP KIỂM OV-13d — Ý thức nhiều em cùng lúc ở mức lớp (đặc tả OV-13 §0 Q5, §3 dòng 5; mockup OV-13 mục 4).
 * Lô xử lý (bậc kế từng em, em cần QL bị loại, lỗi một em không làm hỏng em khác, chống gửi trùng) · Ghi nhận lô · Xác nhận cấp bậc lô
 * (bậc 0 "Chưa có xử lý vi phạm" thoát việc 14 ngày, em đã xử lý trên web khoá) · quyền (GVCN / QL đúng lớp được, GV khác 403).
 * Mọi nhóm chạy trong giao dịch cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13dTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, addDays, classId } = t;
  console.log('\nOV-13d · Ý thức nhiều em cùng lúc');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };

  const intake: any = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const lo: any = await import('../yThuc/lo.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const attachments: any = await import('../platform/attachments.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const LOP = 'MB FT 101';
  const cid = classId(LOP);
  const gvcn = P.coreTeacher;
  const gvbm = P.subjectTeacher;
  let seq = 0;
  const moiEm = (): number => {
    seq += 1;
    const ten = `OV13d ${seq} ${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, target: 7, email: `ov13d${seq}@demo.test`, dob: '2010-01-01' }], idempotencyKey: `ov13d-${ten}` } as any);
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    boLichTuTao(conn, get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id).id);
    return st.id as number;
  };
  const nVp = (sid: number, n: number): number[] => Array.from({ length: n }, (_, i) =>
    viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `Vi phạm OV13d ${i + 1}`, occurredOn: addDays(TODAY, -(i + 1)) }).violation.id as number);
  const soXuLy = (sid: number) => get(`SELECT COUNT(*) n FROM discipline_measures WHERE student_id = ? AND status = 'done'`, sid).n as number;
  const kq = (r: any, sid: number) => r.em.find((x: any) => x.studentId === sid);
  const MO_TA = 'Đã gửi Report cho phụ huynh qua Zalo, PH đã đọc.';

  await checkAsync('OV13d-1 · Lô xử lý: mỗi em tự lấy bậc kế (An → Report 1 · Bình khai Report 1 → Report 2); em có đề xuất chờ QL và em chưa bắt buộc bị loại kèm lý do; mô tả riêng thắng mô tả chung', () => thu(() => {
    const an = moiEm(), binh = moiEm(), chi = moiEm(), huy = moiEm();
    nVp(an, 3); nVp(binh, 3); const vChi = nVp(chi, 3); nVp(huy, 1);
    xu.khaiBac(gvcn, binh, { bac: 1, ghiChu: 'Report 1 trước khi dùng web' });
    const nhap = xu.deXuat(gvcn, chi, { kind: 'wl_3', violationIds: vChi, note: 'Em vi phạm nhiều lần, cần QL quyết' });
    attachments.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bb', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);

    const bang = lo.loYThucLop(gvcn, cid);
    const dong = (sid: number) => bang.em.find((x: any) => x.studentId === sid);
    assert(dong(an).xuLy.duoc && dong(an).keTiep.nhan === 'Report 1' && dong(binh).keTiep.nhan === 'Report 2', JSON.stringify([dong(an), dong(binh)]));
    assert(!dong(chi).xuLy.duoc && /chờ QL/.test(dong(chi).xuLy.lyDo.chu), JSON.stringify(dong(chi).xuLy));
    assert(!dong(huy).xuLy.duoc && /Ghi nhận/.test(dong(huy).xuLy.lyDo.chu) && dong(huy).ghiNhan.soMoi === 1, JSON.stringify(dong(huy)));

    const r = lo.loXuLy(gvcn, cid, {
      em: [{ studentId: an }, { studentId: binh, note: 'Đã gửi WL qua Zalo, bố em xác nhận đọc.' }, { studentId: chi }, { studentId: huy }],
      performedOn: TODAY, note: MO_TA, idempotencyKey: 'ov13d-1',
    });
    assert(kq(r, an).ok && kq(r, an).nhan === 'Report 1' && kq(r, binh).ok && kq(r, binh).nhan === 'Report 2', JSON.stringify(r));
    assert(!kq(r, chi).ok && /chờ QL/.test(kq(r, chi).loi.chu) && !kq(r, huy).ok && /Ghi nhận/.test(kq(r, huy).loi.chu), JSON.stringify(r));
    assert(get(`SELECT note FROM discipline_measures WHERE student_id = ? AND status = 'done'`, binh).note.startsWith('Đã gửi WL') &&
      get(`SELECT note FROM discipline_measures WHERE student_id = ? AND status = 'done'`, an).note === MO_TA, 'mô tả riêng / chung');
    assert(soXuLy(chi) === 0 && soXuLy(huy) === 0, 'em bị loại không có lần xử lý');
    assert(xu.yThucHocVien(gvcn, an).soBatBuoc === 0 && xu.yThucHocVien(gvcn, binh).bac === 2, 'hết bắt buộc · bậc mới');
  }));

  await checkAsync('OV13d-2 · Lỗi một em (bậc vừa đổi → 409) không làm hỏng em khác; gửi lại cùng khoá không tạo lần xử lý thứ hai', () => thu(() => {
    const an = moiEm(), binh = moiEm();
    nVp(an, 3); nVp(binh, 3);
    const body = { em: [{ studentId: an, bacDaThay: 0 }, { studentId: binh, bacDaThay: 3 }], performedOn: TODAY, note: MO_TA, idempotencyKey: 'ov13d-2' };
    const r = lo.loXuLy(gvcn, cid, body);
    assert(kq(r, an).ok && !kq(r, binh).ok && /Bậc đã đổi/.test(kq(r, binh).loi.chu), JSON.stringify(r));
    assert(soXuLy(an) === 1 && soXuLy(binh) === 0, 'em lỗi không ghi, em kia vẫn ghi');
    const r2 = lo.loXuLy(gvcn, cid, { ...body, em: [{ studentId: an, bacDaThay: 0 }] });
    assert(kq(r2, an).ok && soXuLy(an) === 1, `gửi trùng: ${JSON.stringify(r2)} · ${soXuLy(an)}`);
    assert(maLoi(() => lo.loXuLy(gvcn, cid, { ...body, note: 'ngắn' })) === 400, 'mô tả chung ngắn (không em nào có mô tả riêng) → 400');
    assert(maLoi(() => lo.loXuLy(gvcn, cid, { ...body, performedOn: addDays(TODAY, 1) })) === 400, 'ngày tương lai → 400');
  }));

  await checkAsync('OV13d-3 · Quyền: GVCN lớp + QL đúng chi nhánh làm được; GVBM / QL chi nhánh khác 403; em không thuộc lớp báo riêng', () => thu(() => {
    const an = moiEm(), binh = moiEm();
    nVp(an, 3); nVp(binh, 3);
    const body = (sid: number, k: string) => ({ em: [{ studentId: sid }], performedOn: TODAY, note: MO_TA, idempotencyKey: k });
    assert(maLoi(() => lo.loXuLy(gvbm, cid, body(an, 'a'))) === 403 && maLoi(() => lo.loYThucLop(gvbm, cid).em) !== 403, 'GVBM xử lý 403 (xem vẫn được)');
    assert(maLoi(() => lo.loXuLy(P.cpManager, cid, body(an, 'b'))) === 403, 'QL chi nhánh khác 403');
    assert(maLoi(() => lo.loGhiNhan(gvbm, cid, { studentIds: [an] })) === 403 && maLoi(() => lo.loCapBac(gvbm, cid, { em: [{ studentId: an, bac: 0 }] })) === 403, 'GVBM ghi nhận / cấp bậc 403');
    assert(kq(lo.loXuLy(gvcn, cid, body(an, 'c')), an).ok, 'GVCN');
    assert(kq(lo.loXuLy(P.mbManager, cid, body(binh, 'd')), binh).ok, 'QL MB');
    const khac = get(`SELECT e.student_id FROM enrollments e WHERE e.status = 'active' AND e.class_id != ? LIMIT 1`, cid).student_id;
    const r = lo.loXuLy(gvcn, cid, body(khac, 'e'));
    assert(!kq(r, khac).ok && /không học lớp/.test(kq(r, khac).loi.chu), JSON.stringify(r));
  }));

  await checkAsync('OV13d-4 · Ghi nhận lô: mọi vi phạm Mới của các em được ghi nhận; em bắt buộc bị loại; trả id để Hoàn tác', () => thu(() => {
    const huy = moiEm(), lan = moiEm(), an = moiEm();
    const vHuy = nVp(huy, 1); nVp(lan, 2); nVp(an, 3);
    const r = lo.loGhiNhan(gvcn, cid, { studentIds: [huy, lan, an] });
    assert(kq(r, huy).ok && kq(r, huy).ids.length === 1 && kq(r, lan).ok && kq(r, lan).ids.length === 2, JSON.stringify(r));
    assert(!kq(r, an).ok && /bắt buộc/.test(kq(r, an).loi.chu), 'em bắt buộc bị loại');
    assert(get('SELECT ghi_nhan_luc FROM violations WHERE id = ?', vHuy[0]).ghi_nhan_luc === TODAY, 'đã ghi nhận');
    const lai = lo.loGhiNhan(gvcn, cid, { studentIds: [huy, lan] });   // rà #408 (3): mất phản hồi → gửi lại
    assert(kq(lai, huy).ok && kq(lai, huy).ids.length === 1 && kq(lai, lan).ok, `gửi lại báo đã ghi nhận: ${JSON.stringify(lai)}`);
    xu.boGhiNhan(gvcn, huy, kq(r, huy).ids);
    assert(get('SELECT ghi_nhan_luc FROM violations WHERE id = ?', vHuy[0]).ghi_nhan_luc === null, 'Hoàn tác');
  }));

  await checkAsync('OV13d-5 · Xác nhận cấp bậc lô: bậc 0 "Chưa có xử lý vi phạm" lưu được và em thoát việc 14 ngày; em đã có xử lý trên web khoá (QL sửa được bậc đã khai)', () => thu(() => {
    const moi = moiEm(), cu = moiEm(), daXl = moiEm(), ql = moiEm();
    conn.prepare('UPDATE students SET created_at = ? WHERE id IN (?, ?, ?, ?)').run(`${addDays(TODAY, -2)}T08:00:00.000Z`, moi, cu, daXl, ql);
    const viec = () => (mywork.myWork(gvcn).items as any[]).find((i) => i.group === 'khai_bac' && i.classId === cid);
    assert(viec()?.emIds?.includes(moi), 'trước: em mới nằm trong việc khai bậc');
    const v = nVp(daXl, 1);
    xu.xacNhanXuLy(gvcn, daXl, { violationIds: v, performedOn: TODAY, note: MO_TA });
    xu.khaiBac(gvcn, ql, { bac: 2, ghiChu: 'Report 2 tháng 8' });
    xu.xacNhanXuLy(gvcn, ql, { violationIds: nVp(ql, 1), performedOn: TODAY, note: MO_TA });

    const bang = lo.loYThucLop(gvcn, cid);
    const dong = (sid: number) => bang.em.find((x: any) => x.studentId === sid);
    assert(dong(moi).capBac.duoc && dong(moi).capBac.khai === null, JSON.stringify(dong(moi)));
    assert(!dong(daXl).capBac.duoc && !dong(ql).capBac.duoc && /QL/.test(dong(ql).capBac.lyDo.chu), 'GVCN: em đã xử lý trên web khoá');
    assert(lo.loYThucLop(P.mbManager, cid).em.find((x: any) => x.studentId === ql).capBac.duoc, 'QL thấy mở (em đã khai)');

    const r = lo.loCapBac(gvcn, cid, { em: [{ studentId: moi, bac: 0 }, { studentId: cu, bac: 3 }, { studentId: daXl, bac: 1 }] });
    assert(kq(r, moi).ok && kq(r, cu).ok && !kq(r, daXl).ok, JSON.stringify(r));
    assert(get('SELECT bac FROM y_thuc_khai_bac WHERE student_id = ?', moi).bac === 0 && xu.yThucHocVien(gvcn, cu).keTiep.nhan === 'Report 4 + Meeting CX/GĐCN', 'bậc 0 / bậc 3 lưu');
    assert(!viec()?.emIds?.includes(moi) && !viec()?.emIds?.includes(cu), 'sau: hai em thoát việc 14 ngày');
    assert(xu.yThucHocVien(gvcn, moi).keTiep.nhan === 'Report 1', 'bậc 0 → lần kế Report 1');
    assert(!kq(lo.loCapBac(gvcn, cid, { em: [{ studentId: ql, bac: 4 }] }), ql).ok, 'GVCN không sửa em đã xử lý');
    assert(kq(lo.loCapBac(P.mbManager, cid, { em: [{ studentId: ql, bac: 4 }] }), ql).ok && get('SELECT bac FROM y_thuc_khai_bac WHERE student_id = ?', ql).bac === 4, 'QL sửa được');
    /* rà #408 (4): em Tạm dừng không khai mới (như khaiDuoc) */
    const td = moiEm();
    studentsSvc.setStudentStatus(P.admin, td, 'inactive', TODAY, 'Tạm dừng thử cấp bậc lô');
    const dTd = lo.loYThucLop(gvcn, cid).em.find((x: any) => x.studentId === td);
    assert(!dTd || (!dTd.capBac.duoc && /Tạm dừng/.test(dTd.capBac.lyDo.chu)), JSON.stringify(dTd));
    assert(!kq(lo.loCapBac(gvcn, cid, { em: [{ studentId: td, bac: 0 }] }), td).ok, 'em Tạm dừng không lưu');
    assert(maLoi(() => lo.loCapBac(gvcn, cid, { em: [{ studentId: moi, bac: 9 }] })) === 400 || !kq(lo.loCapBac(gvcn, cid, { em: [{ studentId: moi, bac: 9 }] }), moi).ok, 'bậc ngoài 0–6 bị từ chối');
  }));

  /* Rà planning #408: lô chạy trên Netlify (~7,5 s, Turso ~20–50 ms/câu) — khoá số câu SQL mỗi em để một lời gọi web (≤ 4 em xử lý · ≤ 12 em cấp bậc) vừa giờ. */
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');
  const dem = (fn: () => unknown) => { const truoc = soCauSql(); fn(); return soCauSql() - truoc; };
  await checkAsync('OV13d-6 · Tốc độ: Xác nhận xử lý ≤ 16 câu / em (lô 4 em, mỗi em 3 vi phạm) · Xác nhận cấp bậc ≤ 6 câu / em (lô 12 em)', () => thu(() => {
    const ems = Array.from({ length: 4 }, () => moiEm());
    for (const sid of ems) nVp(sid, 3);
    const nXl = dem(() => { const r = lo.loXuLy(gvcn, cid, { em: ems.map((studentId) => ({ studentId })), performedOn: TODAY, note: MO_TA, idempotencyKey: 'ov13d-6' }); assert(r.em.every((x: any) => x.ok), JSON.stringify(r)); });
    const moi = Array.from({ length: 12 }, () => moiEm());
    const nCb = dem(() => { const r = lo.loCapBac(gvcn, cid, { em: moi.map((studentId) => ({ studentId, bac: 0 })) }); assert(r.em.every((x: any) => x.ok), JSON.stringify(r)); });
    console.log(`      đo: xử lý ${nXl} câu / 4 em = ${(nXl / 4).toFixed(1)} · cấp bậc ${nCb} câu / 12 em = ${(nCb / 12).toFixed(1)}`);
    assert(nXl / 4 <= 16, `xử lý ${(nXl / 4).toFixed(1)} câu / em`);
    assert(nCb / 12 <= 6, `cấp bậc ${(nCb / 12).toFixed(1)} câu / em`);
  }));
}
