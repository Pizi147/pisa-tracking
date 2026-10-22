/**
 * PHÉP KIỂM UI-CV-TVV (08 mục 6 dòng 5, R1; 03 mục 3 "CẦN QUYỀN" 1 — TVV có Công việc chỉ việc của mình; mockup `thiet-ke/v5/tvv.html`).
 * Mục gọi HTTP (UICV-2, 3) ghi dữ liệu thật (máy chủ cuộn lại giao dịch bỏ dở của lần gọi trước) — em / TVV tên riêng "UICV", chạy cuối bộ kiểm;
 * mục khác chạy trong giao dịch rồi cuộn lại.
 */
import { emailThu } from '../seed/emailThu.ts';

export async function runPrUiCvTvvTests(t: any) {
  const { check, checkAsync, assert, conn, P, classId, TODAY } = t;
  console.log('\nUI-CV-TVV · Công việc của TVV (menu, /my-work chỉ việc TVV, dòng từng em, bối cảnh Báo PH)');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const { navOf } = await import('../platform/nav.ts');
  const { NHOM_VIEC_TVV } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const gvcn = P.coreTeacher;
  const LOP = 'MB FT 101';
  let dem = 0;
  const tvvMoi = () => {
    dem += 1;
    const uid = accounts.createAccount(P.admin, { email: `uicv.tvv${dem}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-uicv', fullName: `TVV UICV ${dem}`, roles: [{ role: 'consultant', branches: ['MB'] }] }).userId as number;
    return loadPrincipal(uid);
  };
  const moiEm = (tvv: any): number => {
    const ten = `UICV em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId(LOP), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `uicv-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, st.id);
    return st.id as number;
  };
  /** GVCN lưu xử lý 3 vi phạm "Đi học muộn" → một việc Báo PH (id). */
  const xuLy = (sid: number): { viecId: number; measureId: number } => {
    const ids = [1, 2, 3].map((i) => viol.recordViolation(gvcn, { studentId: sid, category: 'attendance', ten: 'Đi học muộn', occurredOn: `2026-09-0${i + 6}` }).violation.id as number);
    xu.xacNhanXuLy(gvcn, sid, { violationIds: ids, performedOn: TODAY, performerName: 'Cô Thu', note: 'Nhắc nhở lần 1' });
    const v = conn.prepare('SELECT id, measure_id FROM viec_bao_ph WHERE student_id = ? ORDER BY id DESC').get(sid) as any;
    return { viecId: v.id, measureId: v.measure_id };
  };

  const httpApp = createApp().listen(0);
  const port = (httpApp.address() as any).port as number;
  const goi = async (userId: number, url: string) => {
    const res = await fetch(`http://127.0.0.1:${port}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(userId)}` } });
    return { status: res.status, json: await res.json().catch(() => null) as any };
  };

  try {
    await checkAsync('UICV-1 · TVV có menu Công việc (work + workSupport), không Chấm điểm / duyệt / Test; GV, QL không đổi', () => thu(() => {
      const n = navOf(tvvMoi());
      assert(n.work && n.workSupport && !n.workApprove && !n.workOps && !n.workRequests && !n.test, JSON.stringify(n));
      const g = navOf(gvcn), q = navOf(P.mbManager);
      assert(g.work && g.workSupport && !g.workApprove && q.work && q.workApprove, 'GV / QL giữ cờ cũ');
    }));

    await checkAsync('UICV-2 · TVV GET /my-work: 200, chỉ nhóm việc TVV, chỉ em của mình; ?nguoi=tat-ca / id GV, /my-work/cham-speaking, /mgmt-tasks → 403', async () => {
      const a = tvvMoi(), b = tvvMoi();
      const emA = moiEm(a), emB = moiEm(b);
      xuLy(emA); xuLy(emB);
      xoaNho();
      const r = await goi(a.userId, '/my-work');
      assert(r.status === 200, `status ${r.status}`);
      const viec = (r.json.dong as any[]).flatMap((d) => d.con ?? [d]);
      assert(viec.length > 0 && viec.every((x) => NHOM_VIEC_TVV.has(x.group)), 'chỉ nhóm TVV: ' + viec.map((x) => x.group).join(','));
      assert(viec.some((x) => x.group === 'bao_ph_yt' && x.studentId === emA) && !viec.some((x) => x.studentId === emB), 'chỉ việc em của TVV này');
      for (const url of ['/my-work?nguoi=tat-ca', `/my-work?nguoi=${gvcn.userId}`, '/my-work/cham-speaking', '/mgmt-tasks']) {
        const x = await goi(a.userId, url);
        assert(x.status === 403, `${url}: ${x.status}`);
      }
    });

    await checkAsync('UICV-3 · Báo PH hai em cùng lớp = HAI dòng (không gộp lớp); dòng mang viecId + số lần "Chưa liên hệ được"', async () => {
      const a = tvvMoi();
      const e1 = moiEm(a), e2 = moiEm(a);
      const v1 = xuLy(e1); xuLy(e2);
      bp.ghiKetQuaBaoPh(a, { viecIds: [v1.viecId], ketQua: 'chua_lien_he', ngay: TODAY, ghiChu: 'Không nghe máy' });
      xoaNho();
      const dong = ((await goi(a.userId, '/my-work')).json.dong as any[]).filter((x) => x.group === 'bao_ph_yt');
      assert(dong.length === 2 && dong.every((x) => !x.con && x.viecId), 'hai dòng lẻ: ' + JSON.stringify(dong.map((x) => x.key)));
      const d1 = dong.find((x) => x.studentId === e1);
      assert(d1.soLanThu === 1 && d1.statusLabel === 'Chưa liên hệ được' && d1.actionLabel === 'Ghi báo PH', JSON.stringify(d1));
    });

    await checkAsync('UICV-4 · Xem việc Báo PH: bối cảnh lần xử lý (GVCN lưu · lớp · vi phạm + ghi chú); GVCN xin thu hồi → thuHoiCho, lịch sử báo giữ', () => thu(() => {
      const a = tvvMoi();
      const em = moiEm(a);
      const v = xuLy(em);
      bp.ghiKetQuaBaoPh(a, { viecIds: [v.viecId], ketQua: 'da_bao', ngay: TODAY, ghiChu: 'Mẹ em đã nghe' });
      const x = bp.xemViecBaoPh(a, v.viecId);
      assert(x.boiCanh.nguoiLuu === gvcn.fullName && x.boiCanh.lop === LOP && !!x.boiCanh.luuLuc, JSON.stringify(x.boiCanh));
      assert(x.boiCanh.noiDung === 'Đi học muộn (07/09, 08/09, 09/09). Nhắc nhở lần 1', x.boiCanh.noiDung);
      assert(x.thuHoiCho === null, 'chưa xin thu hồi');
      xu.thuHoiXuLy(gvcn, v.measureId, { lyDo: 'Nhầm ngày' });
      const y = bp.xemViecBaoPh(a, v.viecId);
      assert(y.thuHoiCho?.lyDo === 'Nhầm ngày' && y.trangThai === 'xong' && y.lan.length === 1, JSON.stringify({ t: y.thuHoiCho, tt: y.trangThai }));
    }));
    await checkAsync('UICV-5 · Sau thi ②: ghi chú bước tiếp lưu cùng lựa chọn (buoc_tiep_json + nhật ký); > 2000 ký tự → 400, không ghi', () => thu(() => {
      const em = moiEm(tvvMoi());
      const cy = (conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(em) as any).id as number;
      thiThat.datKetQuaThiThat(P.admin, cy, { ngayThi: TODAY, l: 7, r: 6.5, w: 6, s: 6.5 });
      let ma: number | null = null;
      try { buocTiep.chonBuocTiep(P.mbManager, cy, { chon: 'tam_dung', ghiChu: 'x'.repeat(2001) }); } catch (e: any) { ma = e?.status ?? -1; }
      assert(ma === 400 && !(conn.prepare('SELECT buoc_tiep FROM learning_cycles WHERE id = ?').get(cy) as any).buoc_tiep, `quá dài: ${ma}`);
      buocTiep.chonBuocTiep(P.mbManager, cy, { chon: 'tam_dung', ghiChu: '  Mẹ em xin nghỉ 1 tháng  ' });
      const r = conn.prepare('SELECT buoc_tiep, buoc_tiep_json FROM learning_cycles WHERE id = ?').get(cy) as any;
      assert(r.buoc_tiep === 'tam_dung' && JSON.parse(r.buoc_tiep_json).ghiChu === 'Mẹ em xin nghỉ 1 tháng', r.buoc_tiep_json);
      const nk = conn.prepare(`SELECT after_json FROM audit_logs WHERE action = 'cycle.buoc_tiep' AND entity_id = ? ORDER BY id DESC`).get(cy) as any;
      assert(nk && JSON.parse(nk.after_json).ghiChu === 'Mẹ em xin nghỉ 1 tháng', 'nhật ký có ghi chú');
    }));
  } finally {
    httpApp.close();
  }
  void check;
}
