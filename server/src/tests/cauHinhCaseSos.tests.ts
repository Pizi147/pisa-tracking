/**
 * PHÉP KIỂM CAU-HINH-CASE-SOS (chủ SP 11/11) — Quản trị sửa nhóm nguyên nhân / nhóm PA / việc theo mốc SOS; đổi chỉ áp cho cái sinh sau.
 * Đặc tả `docs/superpowers/specs/2026-11-11-cau-hinh-case-sos-design.md`, kế hoạch `docs/superpowers/plans/2026-11-11-cau-hinh-case-sos.md`.
 * Mỗi phép kiểm ghi DB thì cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runCauHinhCaseSosTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const dm: any = await import('../../../shared/domain/index.ts');
  const svc: any = await import('../platform/cauHinhCaseSos.ts');
  const mig: any = await import('../migrate/prCauHinhCaseSos.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); svc.quenNhoCauHinh(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const sao = (x: unknown) => JSON.parse(JSON.stringify(x));
  /** Bản nguyên nhân đang dùng + một nhóm mới "Nghe từ khoá" ở Listening FT (trước "Khác"). */
  const themNghe = () => {
    const d = sao(dm.cauHinh('nguyen_nhan').du_lieu);
    d.ft.listening.splice(d.ft.listening.length - 1, 0, { ma: '', ten: 'Nghe từ khoá' });
    return d;
  };
  console.log('\nCAU-HINH-CASE-SOS · cấu hình Case & SOS (bản gốc = hằng số cũ, phiên bản, chỉ áp cho cái sinh sau)');

  check('CHCS-GOC · bản gốc ra đúng hằng số cũ: nhóm nguyên nhân mọi kỹ năng × chương trình, 18 ô FT × (PA, việc) + RF, kiểm hợp lệ', () => {
    const cu = (topic: string, ct: string | null) => dm.ISSUE_TAXONOMY.find((b: any) => b.key === dm.nhanhPhanLoai(topic, ct))?.items ?? [];
    for (const ct of [null, 'FT', 'FOU', 'BE', 'ELE', 'PREFOU', 'KET']) {
      for (const topic of ['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking', 'pronunciation', 'tong_hop', 'prep_writing']) {
        const a = dm.issuesForTopic(topic, ct).map((i: any) => `${i.code}=${i.label}=${i.hint ?? ''}`).join('|');
        const b = cu(topic, ct).map((i: any) => `${i.code}=${i.label}=${i.hint ?? ''}`).join('|');
        assert(a === b, `${topic} × ${ct}: ${a} ≠ ${b}`);
      }
    }
    for (const b of dm.ISSUE_TAXONOMY) for (const i of b.items) {
      assert(dm.issueLabel(i.code) === i.label && dm.issueBranchOf(i.code) === b.key, `nhãn / nhánh ${i.code}`);
    }
    assert(dm.issueLabel('ma.la') === 'ma.la' && dm.issueBranchOf('ma.la') === null, 'mã lạ → chính mã, nhánh null');
    for (let n = 1; n <= 7; n++) for (const route of [null, 'LT1', 'RF']) for (const s of [1, 2, 3]) {
      const hangPa = route === 'RF' ? Math.max(3, n) : n;
      const r = dm.DEFAULT_ACADEMIC_SUPPORT[Math.min(hangPa, 5)][s];
      const pa = dm.academicSupportFor(n, s, route);
      assert(pa.kind === r.kind && pa.span === r.span, `PA MT${n} ${route} SOS ${s}`);
      const hangV = route === 'RF' ? Math.max(4, n) : n;
      const v = dm.DEFAULT_SOS_COORDINATION[Math.min(hangV, 4)][s].join(',');
      assert(dm.sosCoordinationFor(n, s, route).join(',') === v, `việc MT${n} ${route} SOS ${s}: ${dm.sosCoordinationFor(n, s, route)} ≠ ${v}`);
    }
    assert(dm.academicSupportFor(1, 1).description === 'Tự học · 1 tháng' && dm.academicSupportFor(2, 3).description === 'Tutor · đến MT3'
      && dm.academicSupportFor(3, 1).description === 'Tutor · đến lúc thi', 'mô tả PA quy chế giữ chữ cũ');
    for (const k of Object.keys(dm.NHAN_LOAI_PA_GOC)) assert(dm.INTERVENTION_KIND_LABEL[k] === dm.NHAN_LOAI_PA_GOC[k], `nhãn PA ${k}`);
    for (const k of dm.COORDINATION_KINDS) assert(dm.COORDINATION_KIND_LABEL[k] === dm.NHAN_VIEC_GOC[k], `nhãn việc ${k}`);
    const kinds = dm.interventionKindsFor();
    assert(kinds.selfServe.join() === dm.SELF_SERVE_KINDS.join() && kinds.proposals.join() === dm.ACADEMIC_PROPOSAL_KINDS.join(), 'hai họ PA giữ thứ tự');
    assert(dm.isProposalKind('extra_support') && dm.isProposalKind('other_proposal') && dm.isProposalKind('reschedule_mt') && !dm.isProposalKind('tutor'), 'isProposalKind');
    assert(dm.hanPhoiHop('cx_meeting_student', '2026-11-02T03:00:00Z') === '2026-11-07' && dm.hanPhoiHop('talk_family', '2026-11-02T03:00:00Z') === null
      && dm.hanPhoiHop('cx_meeting_family', '2026-11-02T03:00:00Z', '2026-11-20') === '2026-11-20', 'hạn Meeting CX 5 ngày, việc khác không hạn, hạn chọn thắng');
    assert(dm.toiThieuGhiChu('cx_meeting_family') === 10 && dm.toiThieuGhiChu('talk_student') === 0, 'ghi chú tối thiểu');
    const ai = dm.aiLamViec({ kind: 'talk_family', pb_moc: null });
    assert(ai.aiLam === 'gvcn' && ai.buocTvv === null, 'bản gốc: GVCN, không bước TVV');
    for (const l of dm.LOAI_CAU_HINH) assert(dm.kiemCauHinh(l, dm.cauHinhGoc()[l]).length === 0, `bản gốc ${l} hợp lệ: ${JSON.stringify(dm.kiemCauHinh(l, dm.cauHinhGoc()[l]))}`);
    assert(dm.benCua(null) === 'ft' && dm.benCua('FT') === 'ft' && dm.benCua('FOU') === 'thuong' && dm.benCua('KET') === 'thuong', 'benCua');
  });

  check('CHCS-KIEM · kiểm cấu hình: tên trùng, "Khác" bị ẩn / không cuối, xoá mục đã có, đổi cờ PA cố định, ô trỏ việc ẩn, số ngoài khoảng', () => {
    const goc = () => JSON.parse(JSON.stringify(dm.cauHinhGoc()));
    const g1 = goc().nguyen_nhan; g1.ft.listening[1].ten = ' từ  VỰNG / ngữ pháp ';
    assert(dm.kiemCauHinh('nguyen_nhan', g1).some((l: any) => /Trùng tên/.test(l.loi) && l.duong === 'ft.listening[1].ten'), 'trùng tên (bỏ khoảng trắng, hoa thường)');
    const g2 = goc().nguyen_nhan; g2.ft.reading.at(-1).an = true;
    assert(dm.kiemCauHinh('nguyen_nhan', g2).some((l: any) => /"Khác"/.test(l.loi)), 'Khác không ẩn được');
    const g3 = goc().nguyen_nhan; g3.thuong.gv.splice(0, 1);
    assert(dm.kiemCauHinh('nguyen_nhan', g3).some((l: any) => /chỉ ẩn được/.test(l.loi)), 'xoá nhóm đã có → lỗi');
    const g4 = goc().phuong_an; g4.muc.find((m: any) => m.ma === 'tutor').nhom = 'can_ql_duyet';
    assert(dm.kiemCauHinh('phuong_an', g4).some((l: any) => /cách chạy cố định/.test(l.loi)), 'Tutor không đổi nhóm');
    const g5 = goc().moc_sos; g5.viec.find((v: any) => v.ma === 'talk_student').an = true;
    assert(dm.kiemCauHinh('moc_sos', g5).some((l: any) => /đang ẩn/.test(l.loi) && l.duong === 'ft.mt1.1'), 'ô trỏ việc ẩn');
    const g6 = goc().moc_sos; g6.thuong.khongDatKyVong.tutor = 0; g6.viec[0].hanNgay = 99;
    const l6 = dm.kiemCauHinh('moc_sos', g6);
    assert(l6.some((l: any) => l.duong === 'thuong.khongDatKyVong.tutor') && l6.some((l: any) => l.duong === 'viec[0].hanNgay'), 'số ngoài khoảng');
    const g7 = goc().nguyen_nhan; g7.ft.listening.splice(4, 0, { ma: 'student.listening.m1', ten: 'Nghe từ khoá' });
    assert(dm.kiemCauHinh('nguyen_nhan', g7).length === 0, 'thêm nhóm mới trước "Khác" hợp lệ');
    const d7 = dm.thayDoi('nguyen_nhan', dm.cauHinhGoc().nguyen_nhan, g7);
    assert(d7.length === 1 && d7[0].viec === 'them' && /Nghe từ khoá/.test(d7[0].muc), `thayDoi: ${JSON.stringify(d7)}`);
  });

  check('CHCS-MIG · migrate: tạo bảng + 3 trigger, chạy lặp không làm gì; ghi bảng tăng mốc tham chiếu; dòng loại khác không đổi bản nguyên nhân', () => thu(() => {
    const coCot = (b: string, c: string) => all(`PRAGMA table_info(${b})`).some((x: any) => x.name === c);
    assert(coCot('case_interventions', 'pb_loai') && coCot('sos_coordination_actions', 'pb_moc'), 'schema.sql có 2 cột');
    conn.exec('DROP TABLE cau_hinh_phien_ban');
    const a: string[] = [];
    mig.migratePrCauHinhCaseSos(conn, a);
    assert(a.length === 1 && /cau_hinh_phien_ban/.test(a[0]) && all(`SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'tg_tc_cau_hinh_phien_ban_%'`).length === 3,
      `tạo bảng + trigger: ${JSON.stringify(a)}`);
    assert(!all('SELECT 1 FROM cau_hinh_phien_ban').length, 'không chèn dòng: bảng rỗng = bản gốc');
    const b: string[] = [];
    mig.migratePrCauHinhCaseSos(conn, b);
    assert(!b.length, 'chạy lặp không làm gì');
    const so = () => one(`SELECT so FROM moc_he_thong WHERE khoa = 'tham-chieu'`)?.so;
    const truoc = so();
    conn.prepare(`INSERT INTO cau_hinh_phien_ban (id, loai, du_lieu, tao_luc) VALUES (5, 'han_mac_dinh', '{}', 'x')`).run();
    assert(so() === truoc + 1, 'ghi bảng cấu hình tăng mốc tham chiếu');
    assert(dm.cauHinh('nguyen_nhan').id === 0, 'dòng loại khác không đổi bản nguyên nhân (vẫn bản gốc)');
  }));

  check('CHCS-QUYEN · Quản trị sửa; Quản lý xem, lưu 403; GV xem 403; lưu bị chặn không ghi dòng', () => thu(() => {
    const x = svc.xemCauHinh(P.admin);
    assert(x.suaDuoc && x.nguyen_nhan.id === 0 && x.moc_sos.du_lieu.ft.mt3['3'].viec.includes('cx_meeting_family') && Array.isArray(x.nhatKy), 'QT xem bản gốc');
    assert(svc.xemCauHinh(P.mbManager).suaDuoc === false, 'QL xem, không sửa');
    assert(loi(() => svc.xemCauHinh(P.lrTeacher))?.status === 403, 'GV xem → 403');
    assert(loi(() => svc.luuCauHinh(P.mbManager, 'nguyen_nhan', { duLieu: themNghe(), tuPhienBan: 0 }))?.status === 403, 'QL lưu → 403');
    assert(loi(() => svc.luuCauHinh(P.admin, 'khac', { duLieu: {}, tuPhienBan: 0 }))?.status === 400, 'loại lạ → 400');
    assert(!all('SELECT 1 FROM cau_hinh_phien_ban').length, 'lưu bị chặn không ghi');
  }));

  check('CHCS-LUU · thêm nhóm: cấp mã m1, chỉ bên FT, id ≥ 2, nhật ký + audit; giống hệt không thêm bản; 409; Hoàn tác về bản gốc; mã không dùng lại', () => thu(() => {
    const r = svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: themNghe(), tuPhienBan: 0 });
    const id = r.nguyen_nhan.id;
    assert(r.truoc === 0 && id >= 2, `phiên bản mới ${id}`);
    assert(dm.issuesForTopic('listening', 'FT').some((i: any) => i.code === 'student.listening.m1' && i.label === 'Nghe từ khoá'), 'FT có nhóm mới, mã cấp tự động');
    assert(!dm.issuesForTopic('listening', 'BE').some((i: any) => i.code === 'student.listening.m1'), 'lớp thường không có');
    assert(r.nhatKy[0].id === id && r.nhatKy[0].thayDoi[0].viec === 'them' && r.nhatKy[0].nguoi, `nhật ký: ${JSON.stringify(r.nhatKy[0])}`);
    assert(one(`SELECT action FROM audit_logs WHERE entity_type = 'cau_hinh_phien_ban' AND entity_id = ?`, id)?.action === 'cau_hinh_case_sos.sua', 'audit');
    const lai = svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: r.nguyen_nhan.du_lieu, tuPhienBan: id });
    assert(lai.nguyen_nhan.id === id && all('SELECT 1 FROM cau_hinh_phien_ban').length === 1, 'giống hệt → không thêm bản');
    assert(loi(() => svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: themNghe(), tuPhienBan: 0 }))?.status === 409, 'sửa từ bản cũ → 409');
    assert(loi(() => svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: themNghe() }))?.status === 400, 'thiếu tuPhienBan → 400');
    const ht = svc.luuCauHinh(P.admin, 'nguyen_nhan', { khoiPhucTu: 0, tuPhienBan: id });
    assert(ht.truoc === id && ht.nguyen_nhan.id > id && !dm.issuesForTopic('listening', 'FT').some((i: any) => i.code === 'student.listening.m1'), 'Hoàn tác: mục chưa dùng biến mất');
    assert(ht.nhatKy[0].khoiPhucTu === 0, 'nhật ký ghi khôi phục');
    const r2 = svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: themNghe(), tuPhienBan: ht.nguyen_nhan.id });
    assert(dm.issuesForTopic('listening', 'FT').some((i: any) => i.code === 'student.listening.m2'), `mã không dùng lại (m2): ${r2.nguyen_nhan.du_lieu.ft.listening.map((m: any) => m.ma)}`);
  }));

  check('CHCS-XOA · bỏ mục đã có Case dùng: lưu thẳng 400; Hoàn tác giữ lại ở dạng ẩn; mục gốc không bỏ được', () => thu(() => {
    const r = svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: themNghe(), tuPhienBan: 0 });
    const ca = one('SELECT id FROM sos_cases ORDER BY id LIMIT 1')?.id;
    conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, taxonomy_version, skill, created_at) VALUES (?, 'secondary', 'student.listening.m1', ?, 'listening', 'x')`).run(ca, r.nguyen_nhan.id);
    const bo = sao(r.nguyen_nhan.du_lieu); bo.ft.listening = bo.ft.listening.filter((m: any) => m.ma !== 'student.listening.m1');
    const e = loi(() => svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: bo, tuPhienBan: r.nguyen_nhan.id }));
    assert(e?.status === 400 && /chỉ ẩn được/.test(e.message), `xoá mục đang dùng: ${e?.status} ${e?.message}`);
    const ht = svc.luuCauHinh(P.admin, 'nguyen_nhan', { khoiPhucTu: 0, tuPhienBan: r.nguyen_nhan.id });
    const m = ht.nguyen_nhan.du_lieu.ft.listening.find((x: any) => x.ma === 'student.listening.m1');
    assert(m?.an === true && dm.issueLabel('student.listening.m1') === 'Nghe từ khoá', 'Hoàn tác giữ nhóm đang dùng ở dạng ẩn, nhãn còn');
    assert(!dm.issuesForTopic('listening', 'FT').some((i: any) => i.code === 'student.listening.m1')
      && dm.issuesForTopic('listening', 'FT', { giu: ['student.listening.m1'] }).some((i: any) => i.code === 'student.listening.m1' && i.an), 'ẩn: không ở ô chọn, còn khi giữ');
    const goc = sao(dm.cauHinhGoc().phuong_an); goc.muc = goc.muc.filter((x: any) => x.ma !== 'teaching_adjust');
    assert(loi(() => svc.luuCauHinh(P.admin, 'phuong_an', { duLieu: goc, tuPhienBan: 0 }))?.status === 400, 'mục gốc không bỏ được');
  }));

  /* ---- Task 4: Case / PA đọc cấu hình ---- */
  const cases: any = await import('../cases/cases.ts');
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const LOP = t.classId('MB FT 101');
  const mb = mot(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  let so = 0;
  const moiEm = (): number => {
    const tag = `CHCS-${++so}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mb, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`).run(sid, LOP, now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`).run(sid, now);
    return sid;
  };
  const taoCase = (sid: number, code: string) => cases.reportIssue(P.lrTeacher, {
    studentId: sid, topic: 'listening', title: `Nghe sót số liệu ${so}`, summary: 'Section 1–2 sai 6/20 câu điền số, nhầm 15 và 50.',
    primaryCode: code, idempotencyKey: `chcs-case-${so}`,
  }).id as number;
  const anMuc = (ma: string) => {
    const d = sao(dm.cauHinh('nguyen_nhan').du_lieu);
    for (const b of ['ft', 'thuong']) for (const ds of Object.values(d[b]) as any[]) for (const m of ds) if (m.ma === ma) m.an = true;
    return svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: d, tuPhienBan: dm.cauHinh('nguyen_nhan').id });
  };

  check('CHCS-AN · nhóm ẩn: không ở ô chọn, tạo Case với nhóm đó 400; Case cũ đang gắn → sửa Case giữ nhóm 200; Case ghi phiên bản nhóm lúc chọn', () => thu(() => {
    const ma = 'student.listening.focus';
    const cu = taoCase(moiEm(), ma);
    assert(mot('SELECT taxonomy_version v FROM case_issues WHERE case_id = ?', cu).v === 1, 'bản gốc: taxonomy_version = 1 như dữ liệu cũ');
    const r = anMuc(ma);
    assert(!dm.issuesForTopic('listening', 'FT').some((i: any) => i.code === ma), 'ô chọn không còn');
    const e = loi(() => taoCase(moiEm(), ma));
    assert(e?.status === 400, `tạo Case với nhóm ẩn → 400, có ${e?.status} ${e?.message}`);
    cases.suaCase(P.lrTeacher, cu, { primaryCode: ma, summary: 'Section 1–2 sai 7/20 câu điền số, nhầm 15 và 50 — thêm 1 câu.' });
    assert(mot(`SELECT taxonomy_code c FROM case_issues WHERE case_id = ? AND role = 'primary'`, cu).c === ma, 'Case cũ giữ nhóm đã ẩn');
    const moi = taoCase(moiEm(), 'student.listening.language');
    assert(mot('SELECT taxonomy_version v FROM case_issues WHERE case_id = ?', moi).v === r.nguyen_nhan.id, 'Case mới ghi phiên bản đang dùng');
  }));

  check('CHCS-PA · PA mới "cần QL duyệt" → chờ QL như Đề xuất; cờ "Đếm số buổi" → có Số buổi; PA ẩn không thêm được; đổi tên Tutor đổi nhãn; PA ghi phiên bản', () => thu(() => {
    const d = sao(dm.cauHinh('phuong_an').du_lieu);
    const k = d.muc.findIndex((m: any) => m.ma === 'other_proposal');
    d.muc.splice(k, 0, { ma: '', ten: 'Học kèm 1–1', nhom: 'can_ql_duyet', nguoiDay: true, soBuoi: true });
    d.muc.find((m: any) => m.ma === 'tutor').ten = 'Học Tutor 1 kèm 1';
    d.muc.find((m: any) => m.ma === 'extra_homework').an = true;
    const r = svc.luuCauHinh(P.admin, 'phuong_an', { duLieu: d, tuPhienBan: 0 });
    assert(dm.isProposalKind('pa.m1') && dm.coSoBuoi('pa.m1') && dm.nhanNguoiDay('pa.m1') === 'Người dạy', 'cờ PA mới');
    assert(dm.INTERVENTION_KIND_LABEL.tutor === 'Học Tutor 1 kèm 1' && dm.tenLoaiPa('tutor', null) === 'Học Tutor', 'đổi tên: hiện tên mới, bản gốc giữ tên cũ');
    const kinds = dm.interventionKindsFor();
    assert(kinds.proposals.includes('pa.m1') && !kinds.selfServe.includes('extra_homework'), `danh sách chọn: ${JSON.stringify(kinds)}`);
    const c = taoCase(moiEm(), 'student.listening.language');
    const iv = cases.recordIntervention(P.lrTeacher, c, { kind: 'pa.m1', description: 'Học kèm 1–1 với GV Listening 2 buổi/tuần', status: 'planned', soBuoi: 4 });
    const pa = iv.interventions.find((x: any) => x.kind === 'pa.m1');
    const dong = mot('SELECT needs_approval, so_buoi, pb_loai FROM case_interventions WHERE id = ?', pa.id);
    assert(dong.needs_approval === 1 && dong.so_buoi === 4 && dong.pb_loai === r.phuong_an.id, `PA mới: ${JSON.stringify(dong)}`);
    const e = loi(() => cases.recordIntervention(P.lrTeacher, c, { kind: 'extra_homework', description: 'Thêm 2 đề Listening mỗi tuần', status: 'started', startedDate: t.TODAY, performerSelf: true }));
    assert(e?.status === 400, `PA ẩn → 400, có ${e?.status}`);
  }));

  /* ---- Task 5: mốc SOS theo bản của lượt ---- */
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const luotMock = () => all(`SELECT id, student_id, attempt_no FROM assessment_attempts WHERE kind = 'mock' AND status != 'cancelled' ORDER BY id LIMIT 2`);
  const viecCuaLuot = (id: number) => all(`SELECT kind, status, pb_moc FROM sos_coordination_actions WHERE attempt_id = ? AND preset = 1 ORDER BY kind`, id);
  const doiMoc = (f: (d: any) => void) => {
    const d = sao(dm.cauHinh('moc_sos').du_lieu);
    f(d);
    return svc.luuCauHinh(P.admin, 'moc_sos', { duLieu: d, tuPhienBan: dm.cauHinh('moc_sos').id });
  };

  check('CHCS-MOC · đổi ô MT1 · SOS 1: lượt mới theo ô mới + ghi pb_moc; lượt sinh trước GIỮ bản cũ khi điểm sửa (việc chờ không bị rút — XM-2)', () => thu(() => {
    const [a, b] = luotMock().map((r: any) => ({ ...r, attempt_no: 1, cycle_id: null }));
    conn.prepare('DELETE FROM sos_coordination_actions WHERE attempt_id IN (?, ?)').run(a.id, b.id);
    phoiHop.syncSosCoordination(a, 1);
    assert(viecCuaLuot(a.id).map((r: any) => `${r.kind}:${r.pb_moc}`).join() === 'talk_family:null,talk_student:null', `lượt A bản gốc: ${JSON.stringify(viecCuaLuot(a.id))}`);
    const r = doiMoc((d) => { d.ft.mt1['1'].viec = ['talk_family']; });
    phoiHop.syncSosCoordination(a, 1);
    assert(viecCuaLuot(a.id).filter((x: any) => x.status === 'pending').length === 2, 'lượt A giữ cả 2 việc (bản của lượt = gốc)');
    phoiHop.syncSosCoordination(b, 1);
    const vb = viecCuaLuot(b.id);
    assert(vb.length === 1 && vb[0].kind === 'talk_family' && vb[0].pb_moc === r.moc_sos.id, `lượt B theo ô mới: ${JSON.stringify(vb)}`);
    assert(dm.academicSupportFor(1, 1, null, r.moc_sos.id).kind === 'self_study' && dm.sosCoordinationFor(1, 1, null, null).length === 2, 'tra theo bản');
  }));

  check('CHCS-HAN · đổi hạn Meeting CX 5 → 7, ghi chú tối thiểu 10 → 20, thêm bước TVV: việc mới theo bản mới, việc cũ giữ bản cũ', () => thu(() => {
    const r = doiMoc((d) => {
      const v = d.viec.find((x: any) => x.ma === 'cx_meeting_student');
      v.hanNgay = 7; v.toiThieu = 20; v.buocTvv = { hanNgay: 5, toiThieu: 10 };
    });
    const id = r.moc_sos.id;
    assert(dm.hanPhoiHop('cx_meeting_student', '2026-11-02T03:00:00Z', null, id) === '2026-11-09' && dm.hanPhoiHop('cx_meeting_student', '2026-11-02T03:00:00Z', null, null) === '2026-11-07', 'hạn theo bản');
    assert(dm.toiThieuGhiChu('cx_meeting_student', id) === 20 && dm.toiThieuGhiChu('cx_meeting_student', null) === 10, 'ghi chú tối thiểu theo bản');
    const ai = dm.aiLamViec({ kind: 'cx_meeting_student', pb_moc: id });
    assert(ai.aiLam === 'gvcn' && ai.buocTvv?.hanNgay === 5, `aiLamViec: ${JSON.stringify(ai)}`);
    const e = loi(() => doiMoc((d) => { d.viec.find((x: any) => x.ma === 'talk_student').an = true; }));
    assert(e?.status === 400 && /đang ẩn/.test(e.message), 'ẩn việc đang nằm trong ô mốc → 400');
  }));

  check('CHCS-THUONG · lớp thường: Bổ trợ BE / ELE 1 → 2 buổi / tuần, Final 60–69 % 1 → 2 tuần, Tutor 10 → 12, việc Final < 50 % thêm Trao đổi với gia đình', () => thu(() => {
    assert(dm.boTroGiuaKhoa('BE').buoiMoiTuan === 1 && dm.boTroGiuaKhoa('FOU').buoiMoiTuan === 2, 'bản gốc');
    doiMoc((d) => { d.thuong.progress.beEle = 2; d.thuong.final6069.tuan = 2; d.thuong.khongDatKyVong.tutor = 12; d.thuong.finalDuoi50.viec = ['bao_ph_tvv', 'talk_family']; });
    assert(dm.boTroGiuaKhoa('ELE').buoiMoiTuan === 2 && /Bổ trợ 2 buổi\/tuần/.test(dm.moTaBoTro('BE', 'listening')), 'Bổ trợ Giữa khoá theo số mới');
    assert(dm.mocThuong().khongDatKyVong.tutor === 12, 'Tutor');
    const goiY = { dai: 'duoi_50', baoPhTvv: true } as any;
    assert(dm.viecKhiChot('hoc_lai', goiY).join() === 'bao_ph_tvv,talk_family' && dm.coBaoPhKhiChot('hoc_lai', goiY), 'việc Final < 50 %');
    assert(dm.viecKhiChot('tam_dung', goiY).length === 0, 'Tạm dừng không qua Cuối khoá');
  }));

  check('CHCS-TEN-CASE · đổi tên nhóm: Case cũ (chọn trước khi đổi) giữ tên lúc chọn, Case mới tên mới; Phân tích dùng tên đang dùng', () => thu(() => {
    const ma = 'student.listening.technique';
    const cu = taoCase(moiEm(), ma);
    const d = sao(dm.cauHinh('nguyen_nhan').du_lieu);
    d.ft.listening.find((m: any) => m.ma === ma).ten = 'Chiến thuật làm bài';
    svc.luuCauHinh(P.admin, 'nguyen_nhan', { duLieu: d, tuPhienBan: dm.cauHinh('nguyen_nhan').id });
    const moi = taoCase(moiEm(), ma);
    const ten = (id: number) => cases.caseDetail(P.lrTeacher, id).issues.find((i: any) => i.role === 'primary')?.label;
    assert(ten(cu) === 'Tư duy và kỹ năng làm bài' && ten(moi) === 'Chiến thuật làm bài', `Case cũ ${ten(cu)} · Case mới ${ten(moi)}`);
    assert(dm.issueLabel(ma) === 'Chiến thuật làm bài', 'không phiên bản → tên đang dùng');
  }));
}
