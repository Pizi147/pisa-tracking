/** PHÉP KIỂM YT-GON (rà toàn bộ 11/11 #5 — G3-3): đề xuất chờ duyệt / bị QL từ chối KHÔNG phải lần xử lý — GVCN vẫn Khai cấp bậc được. */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrYtGonTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, classId } = t;
  console.log('\nYT-GON · Khai cấp bậc khi đề xuất chờ / bị từ chối');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const att: any = await import('../platform/attachments.ts');
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  let dem = 0;
  const moiEm = (): number => {
    const ten = `YTGON em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `ytgon-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    return st.id as number;
  };
  const vp = (sid: number): number => viol.recordViolation(gvbm, { studentId: sid, category: 'conduct', ten: 'Đánh nhau trong giờ', occurredOn: TODAY }).violation.id;
  const guiDinhChi = (sid: number, v: number): number => {
    const nhap = xu.deXuat(gvcn, sid, { kind: 'suspension', violationIds: [v], note: 'Đánh nhau, cần đình chỉ' });
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bien-ban', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    return nhap.id;
  };
  const theYc = (mid: number) => (conn.prepare("SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? ORDER BY id DESC").get(mid) as any).id as number;

  await checkAsync('GON-1 · đề xuất chờ QL duyệt: vẫn "Khai cấp bậc" được', () => thu(() => {
    const sid = moiEm(); const v = vp(sid);
    guiDinhChi(sid, v);
    const hs = xu.yThucHocVien(gvcn, sid);
    assert(hs.coTheKhai === true && hs.chuoi.soXuLy === 0, `coTheKhai ${hs.coTheKhai} soXuLy ${hs.chuoi.soXuLy}`);
  }));

  await checkAsync('GON-2 · QL từ chối đề xuất: GVCN Khai cấp bậc được, khai xong bậc đúng; khai còn Sửa được', () => thu(() => {
    const sid = moiEm(); const v = vp(sid);
    const mid = guiDinhChi(sid, v);
    yc.tuChoiYeuCau(ql, theYc(mid), 'Chưa đủ căn cứ đình chỉ');
    assert(xu.yThucHocVien(gvcn, sid).coTheKhai === true, 'sau từ chối phải khai được');
    xu.khaiBac(gvcn, sid, { bac: 2, ghiChu: 'Report 2 tháng 8 trước khi dùng web' });
    const hs = xu.yThucHocVien(gvcn, sid);
    assert(hs.bac === 2 && hs.khai?.coTheSua === true, `bac ${hs.bac} coTheSua ${hs.khai?.coTheSua}`);
  }));

  await checkAsync('GON-3 · có lần xử lý đã xong → không khai (giữ luật)', () => thu(() => {
    const sid = moiEm(); const v = vp(sid);
    xu.xacNhanXuLy(gvcn, sid, { violationIds: [v], performedOn: TODAY, performerName: 'Cô Hà', note: 'Đã gặp em và gửi Report 1' });
    assert(xu.yThucHocVien(gvcn, sid).coTheKhai === false, 'đã có lần xử lý');
  }));

  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const xuLy = (sid: number, ids: number[]) => xu.xacNhanXuLy(gvcn, sid, { violationIds: ids, performedOn: TODAY, performerName: 'Cô Hà', note: 'Gặp em sau giờ học, ký Report 1' });
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };

  await checkAsync('GON-4 · [XM 5] Hoàn tác ngay sau Xác nhận xử lý: lần xử lý + việc Báo PH xoá hẳn, vi phạm về Mới, bậc về 0, nhật ký measure_undo', () => thu(() => {
    const sid = moiEm(); const v = vp(sid);
    const m = xuLy(sid, [v]);
    assert(hang('SELECT 1 FROM viec_bao_ph WHERE measure_id = ?', m.id).length === 1, 'có việc Báo PH');
    xu.hoanTacXuLy(gvcn, m.id);
    const hs = xu.yThucHocVien(gvcn, sid);
    assert(hang('SELECT 1 FROM discipline_measures WHERE id = ?', m.id).length === 0 && hang('SELECT 1 FROM viec_bao_ph WHERE measure_id = ?', m.id).length === 0, 'xoá hẳn');
    assert(hs.bac === 0 && hs.viPham.find((x: any) => x.id === v)?.trangThai === 'moi', JSON.stringify({ bac: hs.bac, vp: hs.viPham.map((x: any) => x.trangThai) }));
    assert(hang("SELECT 1 FROM audit_logs WHERE action = 'discipline.measure_undo' AND entity_id = ?", m.id).length === 1, 'nhật ký');
  }));

  await checkAsync('GON-5 · [XM 5] Hoàn tác bị chặn: người khác · đã có lần sau · đã ghi Báo PH · quá 60 s → 400 (dùng Thu hồi)', () => thu(() => {
    const sid = moiEm(); const [a, b] = [vp(sid), vp(sid)];
    const m1 = xuLy(sid, [a]);
    assert(ma(() => xu.hoanTacXuLy(ql, m1.id)) === 400, 'QL không phải người vừa lưu');
    const m2 = xuLy(sid, [b]);
    assert(ma(() => xu.hoanTacXuLy(gvcn, m1.id)) === 400, 'đã có lần sau');
    bp.ghiKetQuaBaoPh(ql, { viecIds: [hang('SELECT id FROM viec_bao_ph WHERE measure_id = ?', m2.id)[0].id], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em' });
    assert(ma(() => xu.hoanTacXuLy(gvcn, m2.id)) === 400, 'đã ghi Báo PH');
    const sid2 = moiEm(); const m3 = xuLy(sid2, [vp(sid2)]);
    conn.prepare('UPDATE discipline_measures SET created_at = ? WHERE id = ?').run(new Date(Date.now() - 61_000).toISOString(), m3.id);
    assert(ma(() => xu.hoanTacXuLy(gvcn, m3.id)) === 400, 'quá 60 s');
  }));
}
