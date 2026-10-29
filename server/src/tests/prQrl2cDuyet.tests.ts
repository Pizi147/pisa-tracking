/**
 * Q-RL2c (Duyet) — Huỷ quyết định ở Chờ duyệt cho loại đảo bằng bản ghi (`dao` ở loaiYeuCau.ts): Đề xuất sửa Target / lộ trình, Không cần theo dõi,
 * Ý thức (Duyệt + Từ chối), Từ chối Đề xuất chuyển lớp. Mỗi loại: quyết → huỷ → mọi bảng nghiệp vụ y hệt; đã đổi sau → 409 không đổi gì;
 * QL ngoài phạm vi 403; huỷ lần hai 409; Dời lịch Test (lich_thi) vẫn không huỷ được. Mọi phép chạy trong giao dịch cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrQrl2cDuyetTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, addDays, classId } = t;
  const yc: any = await import('../duyet/yeuCau.ts');
  const dxs: any = await import('../duyet/deXuatSua.ts');
  const intake: any = await import('../classes/intake.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const att: any = await import('../platform/attachments.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  console.log('\nQ-RL2c DUYET · Huỷ quyết định (đảo bằng bản ghi)');

  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); } };
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const chuLoi = (fn: () => unknown): string => { try { fn(); return ''; } catch (e: any) { return String(e?.message ?? e); } };

  /**
   * Ảnh mọi bảng nghiệp vụ (bỏ nhật ký / chuông / bản ghi đảo / thùng rác / cấu hình — chỉ ghi thêm). Thẻ Báo QL (`bao_len_*`) do quét-khi-đọc tự tạo / đóng
   * theo trạng thái sống, không phải quyết định — không so; quét chạy trước mỗi ảnh để dữ liệu của phép kiểm khác không lọt vào.
   */
  const BO = new Set(['audit_logs', 'notifications', 'ghi_dao', 'thung_rac', 'demo_config', 'sqlite_sequence']);
  const anh = () => Object.fromEntries((hang(`SELECT name FROM sqlite_master WHERE type = 'table'`) as any[])
    .filter((x) => !BO.has(x.name)).map((x) => [x.name, JSON.stringify(hang(`SELECT * FROM ${x.name}${x.name === 'yeu_cau_duyet' ? ` WHERE loai NOT LIKE 'bao_len%'` : ''}`)
      .map((r) => JSON.stringify(r)).sort())]));
  const lech = (a: Record<string, string>, b: Record<string, string>) => Object.keys(a).filter((k) => a[k] !== b[k]);
  const QL = P.mbManager;
  const QL_KHAC = P.cpManager;   // QL chi nhánh khác — ngoài phạm vi thẻ MB
  const gvcn = P.coreTeacher;
  const daXuLy = (id: number) => yc.hopChoDuyet(QL, { xem: 'da-xu-ly' }).the.find((x: any) => x.id === id);

  let seq = 0;
  const moiEm = (): number => {
    seq += 1;
    const ten = `QRL2C-D ${seq} ${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `qrl2c-d-${ten}` } as any);
    return mot('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  };

  /** Chung cho mọi loại: quyết (trả cờ coTheHuy) → ảnh khớp sau huỷ; huỷ lần hai 409; QL ngoài phạm vi 403. */
  const quyetRoiHuy = (id: number, quyet: () => any, ten: string) => {
    yc.quetYeuCau();
    const truoc = anh();
    const kq = quyet();
    assert(kq.coTheHuy === true, `${ten}: cờ coTheHuy sau quyết định`);
    assert(daXuLy(id)?.coTheHuy === true, `${ten}: Đã xử lý hiện Huỷ quyết định`);
    assert(maLoi(() => yc.huyQuyetDinh(QL_KHAC, id)) === 403, `${ten}: QL ngoài phạm vi 403`);
    yc.huyQuyetDinh(QL, id);
    const l = lech(truoc, anh());
    assert(!l.length, `${ten}: bảng lệch sau huỷ: ${l.join(', ')}`);
    assert(mot('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', id).trang_thai === 'cho', `${ten}: thẻ về chờ`);
    assert(maLoi(() => yc.huyQuyetDinh(QL, id)) === 409, `${ten}: huỷ lần hai 409`);
  };
  /** Đã đổi sau quyết định → 409, không đảo gì; cờ coTheHuy tắt. */
  const doiSauThi409 = (id: number, doi: () => void, ten: string) => {
    doi();
    assert(daXuLy(id)?.coTheHuy !== true, `${ten}: đã đổi sau → không hiện Huỷ quyết định`);
    const truoc = anh();
    assert(maLoi(() => yc.huyQuyetDinh(QL, id)) === 409, `${ten}: đã đổi sau → 409`);
    assert(!lech(truoc, anh()).length, `${ten}: 409 không đổi gì`);
  };

  // ------------------------------------------------------------------ Đề xuất sửa Target / lộ trình
  check('QRL2cD-1 · Đề xuất sửa Target: Duyệt (Target, lượt Mock, bản ghi đổi Target, Hành trình) → Huỷ: mọi bảng y hệt; quyết lại được', () => thu(() => {
    const sid = moiEm();
    const { id } = dxs.guiDeXuatSua(gvcn, sid, { truong: 'target', moi: 7.5, lyDo: 'PH muốn mục tiêu cao hơn' });
    quyetRoiHuy(id, () => yc.duyetYeuCau(QL, id), 'Target duyệt');
    yc.duyetYeuCau(QL, id);
    assert(mot(`SELECT target_score FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid).target_score === 7.5, 'quyết lại sau huỷ');
    doiSauThi409(id, () => conn.prepare(`UPDATE learning_cycles SET note = 'sửa sau' WHERE student_id = ? AND status = 'active'`).run(sid), 'Target');
  }));
  check('QRL2cD-2 · Đề xuất sửa lộ trình Duyệt + Đề xuất sửa (khác) Từ chối → Huỷ: y hệt', () => thu(() => {
    const sid = moiEm();
    const lt = mot(`SELECT code FROM routes WHERE code != (SELECT COALESCE(route, '') FROM learning_cycles WHERE student_id = ? AND status = 'active') AND status = 'active' LIMIT 1`, sid)?.code;
    if (lt) {
      const { id } = dxs.guiDeXuatSua(gvcn, sid, { truong: 'lo-trinh', moi: lt, lyDo: 'Đổi lộ trình theo kết quả MT' });
      quyetRoiHuy(id, () => yc.duyetYeuCau(QL, id), 'lộ trình duyệt');
    }
    const { id: id2 } = dxs.guiDeXuatSua(gvcn, sid, { truong: 'khac', moi: 'Sửa ngày sinh', lyDo: 'Nhập sai' });
    quyetRoiHuy(id2, () => yc.tuChoiYeuCau(QL, id2, 'Cần giấy tờ'), 'sửa khác từ chối');
  }));

  // ------------------------------------------------------------------ Không cần theo dõi
  const theKtd = (): any => {
    for (const c of hang(`SELECT sc.id, sc.owner_user_id FROM sos_cases sc JOIN students s ON s.id = sc.student_id WHERE sc.status != 'done' AND sc.owner_user_id IS NOT NULL
        AND s.branch_id = (SELECT id FROM branches WHERE code = 'MB') ORDER BY sc.id`)) {
      const co = mot(`SELECT * FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND doi_tuong_id = ? AND trang_thai = 'cho'`, c.id);
      if (co) return co;
      try { sosAuto.guiKhongTheoDoi(loadPrincipal(c.owner_user_id), c.id, { reasonCode: 'single_incident' }); } catch { continue; }
      return mot(`SELECT * FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND doi_tuong_id = ? AND trang_thai = 'cho'`, c.id);
    }
    return null;
  };
  check('QRL2cD-3 · Không cần theo dõi Duyệt (Case đóng, PA huỷ, mốc, lịch sử, Hành trình, Báo PH) → Huỷ: y hệt; Case đổi sau → 409', () => thu(() => {
    const the = theKtd();
    assert(the, 'không dựng được thẻ Không cần theo dõi');
    quyetRoiHuy(the.id, () => yc.duyetYeuCau(QL, the.id), 'KTD duyệt');
    yc.duyetYeuCau(QL, the.id);
    assert(mot('SELECT status FROM sos_cases WHERE id = ?', the.doi_tuong_id).status === 'done', 'duyệt lại đóng Case');
    doiSauThi409(the.id, () => conn.prepare(`UPDATE sos_cases SET outcome_note = 'sửa sau' WHERE id = ?`).run(the.doi_tuong_id), 'KTD');
  }));
  check('QRL2cD-4 · Không cần theo dõi Từ chối (hạn mới, mốc) → Huỷ: y hệt', () => thu(() => {
    const the = theKtd();
    assert(the, 'không dựng được thẻ Không cần theo dõi');
    quyetRoiHuy(the.id, () => yc.tuChoiYeuCau(QL, the.id, 'Em cần theo dõi thêm'), 'KTD từ chối');
  }));

  // ------------------------------------------------------------------ Ý thức
  const guiWl3 = (): { measureId: number; id: number } => {
    const sid = moiEm();
    const ids = [1, 2, 3].map((i) => viol.recordViolation(P.subjectTeacher, { studentId: sid, category: 'homework', ten: `Vi phạm QRL2c ${i}`, occurredOn: addDays(TODAY, -i) }).violation.id);
    const nhap = xu.deXuat(gvcn, sid, { kind: 'wl_3', violationIds: ids, note: 'Em vi phạm nhiều lần, cần QL quyết' });
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    return { measureId: nhap.id, id: mot(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`, nhap.id).id };
  };
  check('QRL2cD-5 · Ý thức Duyệt (lần xử lý → đã duyệt) → Huỷ: y hệt; lần xử lý đổi sau → 409', () => thu(() => {
    const { measureId, id } = guiWl3();
    quyetRoiHuy(id, () => yc.duyetYeuCau(QL, id), 'YT duyệt');
    yc.duyetYeuCau(QL, id);
    doiSauThi409(id, () => conn.prepare(`UPDATE discipline_measures SET note = 'sửa sau' WHERE id = ?`).run(measureId), 'YT duyệt');
  }));
  check('QRL2cD-6 · Ý thức Từ chối (lần xử lý, việc Báo PH, hạn chốt vi phạm) → Huỷ: y hệt, thẻ về chờ', () => thu(() => {
    const { id } = guiWl3();
    quyetRoiHuy(id, () => yc.tuChoiYeuCau(QL, id, 'Chưa đủ căn cứ'), 'YT từ chối');
  }));

  // ------------------------------------------------------------------ Từ chối loại khác + lich_thi
  check('QRL2cD-7 · Từ chối Đề xuất chuyển lớp → Huỷ: y hệt; Duyệt chuyển lớp không qua đường này (huỷ lệnh riêng)', () => thu(() => {
    const sid = moiEm();
    const { id } = lenh.guiDeXuatChuyenLop(gvcn, sid, { lyDo: 'Em theo không kịp lớp' });
    quyetRoiHuy(id, () => yc.tuChoiYeuCau(QL, id, 'Chờ thêm một MT'), 'chuyển lớp từ chối');
  }));
  check('QRL2cD-8 · Dời lịch Test lần 2 (lich_thi) vẫn không huỷ quyết định được', () => thu(() => {
    const khac = mot(`SELECT id FROM yeu_cau_duyet WHERE loai = 'lich_thi' LIMIT 1`);
    if (!khac) return;
    conn.prepare(`UPDATE yeu_cau_duyet SET trang_thai = 'duyet', xu_ly_luc = ? WHERE id = ?`).run(yc.mocNghiepVu(), khac.id);
    assert(chuLoi(() => yc.huyQuyetDinh(P.admin, khac.id)) === 'Loại yêu cầu này không huỷ quyết định được.', 'lich_thi');
  }));
}
