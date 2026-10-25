/**
 * PHÉP KIỂM SV-LOP (V5 `08` mục 6 dòng SV-LOP, T12, T13, C19, R3a):
 *   (1) Đánh giá đầu ra lớp thường CHỈ khi bài Final đủ điểm — trước đó "cho-final"; đủ thì Đạt / Chưa đạt theo % tổng và ngưỡng lớp; lớp FT không có (luật hiện có);
 *   (2) việc theo em của hồ sơ lớp = từng việc của `/my-work` (cùng nguồn), nhiều việc một em, việc của người xem trước; ngoài phạm vi 403; TVV chỉ nhóm TVV;
 *   (3) W1, W2 trả riêng ở dòng em (cột điểm + từng mốc).
 * 5 điểm nợ rà #526 (S Ex) nằm ở `prSvSExpert.tests.ts` (SSEX-8…12).
 */
export async function runPrSvLopTests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const classes: any = await import('../classes/classes.ts');
  const { viecTheoEmCuaLop } = await import('../classes/viecTheoEm.ts');
  const { cuoiKhoaTheoHocVien } = await import('../normal/cuoiKhoa.ts');
  const { danhGiaDauRa } = await import('../../../shared/domain/index.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSV-LOP · Đánh giá đầu ra chờ Final · việc theo em từ /my-work · W1 / W2 riêng');

  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };

  check('SVLOP-1 (R3a, T12) · danhGiaDauRa: chưa đủ Final → cho-final (không Đạt tạm); đủ → Đạt khi % ≥ ngưỡng lớp', () => {
    const cf = danhGiaDauRa({ du: false, tyLe: 0.9, scored: 3, required: 4, nguong: 0.7 });
    assert(cf.trangThai === 'cho-final' && cf.tyLe === null && cf.scored === 3, JSON.stringify(cf));
    assert(danhGiaDauRa(null).trangThai === 'cho-final', 'không có bài Final → cho-final');
    assert(danhGiaDauRa({ du: true, tyLe: 0.7, scored: 4, required: 4, nguong: 0.7 }).trangThai === 'dat', '70 % = ngưỡng → Đạt');
    assert(danhGiaDauRa({ du: true, tyLe: 0.6999, scored: 4, required: 4, nguong: 0.7 }).trangThai === 'chua-dat', 'chưa làm tròn: 69,99 % → Chưa đạt');
    assert(danhGiaDauRa({ du: true, tyLe: 0.65, scored: 4, required: 4, nguong: 0.6 }).trangThai === 'dat', 'ngưỡng riêng của lớp');
  });

  check('SVLOP-2 (R3a, T12) · bảng lớp thường: mọi em có dauRa khớp bài Final (MB FOU 12 có em "Chờ Final" + em đủ Final); lớp FT dauRa null', () => {
    const thay = new Set<string>();
    for (const code of ['MB FOU 12', 'MB FOU 21', 'MB FOU 22']) {
      const id = classId(code);
      const ck = cuoiKhoaTheoHocVien(id);
      for (const r of classes.classRoster(P.admin, id) as any[]) {
        const e = ck.get(r.id);
        const mong = danhGiaDauRa(e);
        assert(JSON.stringify(r.dauRa) === JSON.stringify(mong), `${code} · ${r.fullName}: ${JSON.stringify(r.dauRa)} ≠ ${JSON.stringify(mong)}`);
        if (!e?.du) assert(r.dauRa.trangThai === 'cho-final', `${r.fullName} chưa đủ Final mà ${r.dauRa.trangThai}`);
        thay.add(r.dauRa.trangThai);
      }
    }
    assert(thay.has('cho-final') && (thay.has('dat') || thay.has('chua-dat')), `seed cần cả hai trạng thái: ${[...thay]}`);
    assert((classes.classRoster(P.admin, classId('MB FT 101')) as any[]).every((r) => r.dauRa === null), 'lớp FT không có dauRa');
  });

  const LOP = classId('MB FT 101');
  const emLop = new Set((conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`).all(LOP) as any[]).map((r) => r.student_id));
  const cungNguon = (theoEm: Record<number, any[]>, items: any[]) => {
    const tu = Object.values(theoEm).flat().map((v) => v.key).sort();
    const goc = items.filter((it) => it.studentId !== null && emLop.has(it.studentId) && (it.classId === null || it.classId === LOP)).map((it) => it.key).sort();
    return JSON.stringify(tu) === JSON.stringify(goc);
  };

  check('SVLOP-3 (C19) · QL: việc theo em = từng việc của /my-work "Tất cả" (cùng khoá), chỉ em đang học lớp; việc của người xem đứng trước', () => {
    const { theoEm } = viecTheoEmCuaLop(P.mbManager, LOP);
    const w = mywork.myWork(P.mbManager, { branchId: conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(LOP).branch_id, nguoi: 'tat-ca' });
    assert(cungNguon(theoEm, w.items), 'khác tập việc của /my-work');
    for (const [sid, ds] of Object.entries(theoEm)) {
      assert(emLop.has(Number(sid)), `em ${sid} không học lớp`);
      const dauKhongPhai = ds.findIndex((v: any) => !v.mine);
      assert(dauKhongPhai === -1 || ds.slice(dauKhongPhai).every((v: any) => !v.mine), `em ${sid}: việc của người xem không đứng trước`);
      assert(ds.every((v: any) => v.tieuDe && 'due' in v && 'owner' in v && !('con' in v)), `em ${sid}: thiếu ô việc`);
    }
    assert(Object.values(theoEm).some((ds) => ds.length >= 2), 'seed MB FT 101 cần một em ≥ 2 việc (hiện đủ từng việc, C19)');
  });

  check('SVLOP-4 (C19 → P11 VIEC-DUNG-VAI) · GV: chỉ việc của mình (= dòng mine của /my-work GV), không việc GV khác', () => {
    const cn = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(LOP).branch_id;
    for (const gv of [P.coreTeacher, P.sTeacher, P.w1Teacher]) {
      const { theoEm } = viecTheoEmCuaLop(gv, LOP);
      const tatCa = new Set(Object.values(theoEm).flat().map((v: any) => v.key));
      const goc = mywork.myWork(gv, { branchId: cn }).items.filter((it: any) => it.mine && it.studentId !== null && emLop.has(it.studentId) && (it.classId === null || it.classId === LOP));
      assert(goc.every((it: any) => tatCa.has(it.key)), `${gv.fullName}: thiếu việc của /my-work`);
      assert(Object.values(theoEm).flat().filter((v: any) => v.mine).every((v: any) => goc.some((it: any) => it.key === v.key)), `${gv.fullName}: việc "của tôi" không từ /my-work của GV`);
      for (const [sid, ds] of Object.entries(theoEm)) {
        const k = ds.findIndex((v: any) => !v.mine);
        assert(k === -1 || ds.slice(k).every((v: any) => !v.mine && v.owner), `${gv.fullName} · em ${sid}: việc người khác phải sau + có tên`);
        assert(new Set(ds.map((v: any) => v.key)).size === ds.length, 'không trùng việc');
      }
    }
    const ql = viecTheoEmCuaLop(P.mbManager, LOP).theoEm;
    const gvcn = viecTheoEmCuaLop(P.coreTeacher, LOP).theoEm;
    assert(Object.values(gvcn).flat().every((v: any) => Object.values(ql).flat().some((x: any) => x.key === v.key)), 'việc GV thấy ⊂ việc QL thấy (cùng nguồn /my-work)');
    assert(maLoi(() => viecTheoEmCuaLop(P.cpManager, LOP)) === 403, 'QL CP → 403');
    conn.exec('BEGIN IMMEDIATE');
    try {
      xoaNho();
      const tvv = loadPrincipal(accounts.createAccount(P.admin, { email: `svlop.tvv${accounts.EMAIL_SUFFIX}`, password: 'matkhau-svlop', fullName: 'Thử SVLOP TVV', roles: [{ role: 'consultant', branches: ['MB'] }] }).userId);
      const nhom = new Set(Object.values(viecTheoEmCuaLop(tvv, LOP).theoEm).flat().map((v: any) => v.group));
      assert([...nhom].every((g) => mywork.NHOM_VIEC_TVV.has(g)), `TVV thấy nhóm ngoài TVV: ${[...nhom]}`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('SVLOP-5 (T13) · bảng lớp FT: W1, W2 trả riêng (cột điểm + từng mốc), không gộp vào một ô W', () => {
    const rows = classes.classRoster(P.admin, LOP) as any[];
    const co = rows.filter((r) => r.timeline.some((t: any) => t.bands && ('writing1' in t.bands || 'writing2' in t.bands)));
    assert(co.length > 0, 'seed MB FT 101 cần em có điểm W');
    for (const r of rows) assert(r.scores && 'writing1' in r.scores && 'writing2' in r.scores, `${r.fullName}: thiếu ô W1 / W2`);
    assert(co.some((r) => r.scores.writing1.now !== null && r.scores.writing2.now !== null), 'có em hiện cả W1 và W2');
  });
}
