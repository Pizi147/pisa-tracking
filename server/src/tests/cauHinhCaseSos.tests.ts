/**
 * PHÉP KIỂM CAU-HINH-CASE-SOS (chủ SP 11/11) — Quản trị sửa nhóm nguyên nhân / nhóm PA / việc theo mốc SOS; đổi chỉ áp cho cái sinh sau.
 * Đặc tả `docs/superpowers/specs/2026-11-11-cau-hinh-case-sos-design.md`, kế hoạch `docs/superpowers/plans/2026-11-11-cau-hinh-case-sos.md`.
 * Mỗi phép kiểm ghi DB thì cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runCauHinhCaseSosTests(t: YThucTestKit) {
  const { check, assert } = t;
  const dm: any = await import('../../../shared/domain/index.ts');
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
}
