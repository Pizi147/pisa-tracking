/** PHÉP KIỂM PR-S6F-b — sửa sau rà đợt 6 lượt 1, phần giao diện / chữ / tốc độ (kế hoạch 2026-10-01-pr-s6f-sua-sau-ra-dot-6, nhãn [S6F-b]). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');

export async function runPrS6fBTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-S6F-b · Sửa sau rà đợt 6 — giao diện, chữ, tốc độ');

  // ------------------------------------------------------------------ Task 5 · Phân tích — chữ và link (D8)
  check('S6F-b (5) · nhãn tab Tổng hợp theo khung: lớp thường "Test", FT "Test + SOS" (OV-15e, C28); góc khác như cũ', () => {
    assert(d.nhanGocNhin('tong-hop', 'thuong') === 'Test', d.nhanGocNhin('tong-hop', 'thuong'));
    assert(d.nhanGocNhin('tong-hop', 'ft') === 'Test + SOS', d.nhanGocNhin('tong-hop', 'ft'));
    for (const g of d.GOC_NHIN) if (g !== 'tong-hop') assert(d.nhanGocNhin(g, 'thuong') === d.GOC_NHIN_LABEL[g], g);
  });

  check('S6F-b (5) · Excel Tổng hợp khung Lớp thường: dòng 1 và tên file không có "SOS"; FT giữ', () => {
    const kq = (ct: string) => ({ theo: 'lop', ct, cot: [], hang: [], tong: {}, scopeEmpty: false });
    const dau = (ct: string) => String(d.bangXuatTongHop(kq(ct), new Set(), 'MB')[0][0]);
    assert(!dau('thuong').includes('SOS') && dau('thuong').startsWith('Test · '), dau('thuong'));
    assert(dau('ft').startsWith('Test + SOS'), dau('ft'));
    const tsx = doc('web/src/modules/phanTich/TongHopTestSos.tsx');
    assert(/ct === 'thuong' \? 'tong-hop-test' : 'tong-hop-test-sos'/.test(tsx), 'tên file Excel theo khung');
  });

  check('S6F-b (5) · OV-15e: tu/den là khoảng chung — rời góc "Giáo viên" GIỮ tu/den; vào Hiệu quả PA từ góc khác vẫn giữ tu/den', () => {
    for (const g of ['tong-hop', 'bao-cao', 'hieu-qua-pa', 'y-thuc']) {
      const x = d.thamSoXoaKhiDoiGoc(g, 'giao-vien') as string[];
      assert(!['tu', 'den', 'kieu'].some((k) => x.includes(k)), `${g}: ${x}`);
    }
    assert(!d.thamSoXoaKhiDoiGoc('hieu-qua-pa', 'tong-hop').includes('tu'), 'vào Hiệu quả PA từ Tổng hợp: giữ tu');
    assert(d.thamSoXoaKhiDoiGoc('giao-vien', 'hieu-qua-pa').includes('gv'), 'rời Hiệu quả PA: dọn gv/tu/den như cũ');
    const tsx = doc('web/src/modules/phanTich/PhanTich.tsx');
    assert(/thamSoXoaKhiDoiGoc\(k, goc\)/.test(tsx), 'PhanTich truyền góc đang đứng');
  });

  check('S6F-b (5) · link Hiệu quả PA ở hồ sơ GV mang đúng khung: GV chỉ dạy lớp thường → ct=thuong; có FT → ct=ft', () => {
    const u = d.duongHieuQuaPaGv(1, 7, [{ khung: 'thuong' }, { khung: 'thuong' }]) as string;
    assert(u.includes('ct=thuong') && u.includes('goc=hieu-qua-pa') && u.includes('cn=1') && u.includes('gv=7'), u);
    assert((d.duongHieuQuaPaGv(1, 7, [{ khung: 'thuong' }, { khung: 'ft' }]) as string).includes('ct=ft'), 'có FT');
    assert(/duongHieuQuaPaGv\(/.test(doc('web/src/modules/giaoVien/HoSoGiaoVienPage.tsx')), 'trang hồ sơ GV gọi hàm chung');
  });

  check('S6F-b (5) · chip "Bàn giao" của GVBM mở thẳng môn (&mon=mã môn); panel Chấm điểm: hai ô ngày 12 px', () => {
    const tsx = doc('web/src/modules/giaoVien/HoSoGiaoVienPage.tsx');
    assert(/viec=ban-giao\$\{b\.maMon \? `&mon=\$\{b\.maMon\}` : ''\}/.test(tsx), 'chip Bàn giao thiếu &mon=');
    assert(/maMon: v\.mon/.test(doc('server/src/giaoVien/hoSo.ts')), 'chipBanGiao mang mã môn đầu còn thiếu');
    const pt = doc('web/src/modules/phanTich/PhanTichGiaoVien.tsx');
    assert(/<td className="td whitespace-nowrap text-right text-xs tabular-nums">\{ngay\(r\.han, homNay\)\}/.test(pt), 'ô Hạn nhập 12 px');
    assert(/<td className="td whitespace-nowrap text-right text-xs tabular-nums">\s*\{r\.nhapDau \?/.test(pt), 'ô Lần nhập đầu 12 px');
  });

  await runTask6(t, d);
  await runTask7(t, d);
  await runTask8(t, d);
  await runTask9(t, d);
  await runTask13(t, d);
  await runTask12(t);
}

async function runTask12(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P } = t;
  const { signalsFor } = await import('../worklist/signals.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const demTruyVan = (fn: () => void): number => {
    let n = 0;
    const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };

  // ------------------------------------------------------------------ Task 12 · tốc độ — trang đầu, tín hiệu, route chết (D14, D16)
  check('S6F-b (12) · D14: useApi gộp GET ĐANG BAY cùng đường dẫn (xoá khi xong / khi invalidate); badge GV đọc /my-work (summary.overdue), không còn /my-work/dem', () => {
    const u = doc('web/src/lib/useApi.ts');
    assert(/const dangBay = new Map<string, Promise<unknown>>\(\)/.test(u) && /dangBay\.delete\(/.test(u), 'useApi chưa gộp GET đang bay');
    const app = doc('web/src/App.tsx');
    assert(/useApi<[^>]*>\([^;]*'\/my-work'/.test(app) && /summary\??\.overdue/.test(app) && !app.includes('/my-work/dem'), 'App: badge GV');
    assert(!doc('server/src/routes/index.ts').includes("'/my-work/dem'"), 'route /my-work/dem còn');
  });

  check('S6F-b (12) · dải Chờ duyệt (Tổng quan QL) báo lỗi thay vì biến mất', () => {
    assert(/export function DaiChoDuyet[\s\S]{0,400}if \(error\) return <ErrorState/.test(doc('web/src/modules/worklist/KhoiCanXuLy.tsx')), 'DaiChoDuyet nuốt lỗi');
  });

  check('S6F-b (12) · /signals: mỗi chỉ số gọi metricSet MỘT lần (không theo chi nhánh) — HAI ĐƯỜNG: số mỗi chi nhánh = metricSet(id, {branchId}).n; số câu không tăng khi thêm 2 chi nhánh có lớp', () => {
    const s = signalsFor(P.admin, {});
    for (const x of s.filter((y) => y.metricId)) {
      const n = metricsSvc.metricSet(P.admin, x.metricId, { branchId: x.branchId }).n;
      assert(x.count === n, `${x.kind} chi nhánh ${x.branchId}: ${x.count} ≠ ${n}`);
    }
    assert(s.some((y) => y.metricId), 'bộ demo phải có tín hiệu từ sổ chỉ số');
    const n0 = demTruyVan(() => signalsFor(P.admin, {}));
    const NOW = `${TODAY}T00:00:00Z`;
    const them = ['S6A', 'S6B'].map((code) => {
      const b = Number(conn.prepare(`INSERT INTO branches (code, name, created_at) VALUES (?, ?, ?)`).run(code, `Chi nhánh ${code}`, NOW).lastInsertRowid);
      const c = Number(conn.prepare(`INSERT INTO classes (code, branch_id, kind, is_fast_track, status, created_at) VALUES (?, ?, 'FT', 1, 'active', ?)`).run(`${code} FT 1`, b, NOW).lastInsertRowid);
      return { b, c };
    });
    try {
      const n1 = demTruyVan(() => signalsFor(P.admin, {}));
      assert(n1 === n0, `số câu ${n0} → ${n1} khi thêm 2 chi nhánh`);
    } finally {
      for (const x of them) { conn.prepare('DELETE FROM classes WHERE id = ?').run(x.c); conn.prepare('DELETE FROM branches WHERE id = ?').run(x.b); }
    }
  });

  check('S6F-b (12) · D16: route chết GET /cases/queues + caseQueueCounts đã xoá; GET /cases (StudentManagePanel gọi) giữ', () => {
    const r = doc('server/src/routes/index.ts');
    assert(!r.includes("'/cases/queues'") && !('caseQueueCounts' in casesSvc), 'còn /cases/queues');
    /* PR-TK: ngăn "Kết quả thi thật" thay "Kết luận lộ trình" nên StudentManagePanel không còn gọi `/cases?studentId=`; route vẫn giữ (API công khai). */
    assert(r.includes("api.get('/cases', requireAuth"), 'GET /cases phải giữ');
  });
}

async function runTask13(t: YThucTestKit, d: any) {
  const { check, assert } = t;
  const quet = (thuMuc: string, loai: RegExp, bo: RegExp = /\/tests\//): string[] => {
    const out: string[] = [];
    const di = (p: string) => {
      for (const ten of fs.readdirSync(path.join(REPO, p))) {
        const rel = `${p}/${ten}`;
        if (fs.statSync(path.join(REPO, rel)).isDirectory()) di(rel);
        else if (loai.test(ten) && !bo.test(rel)) out.push(rel);
      }
    };
    di(thuMuc);
    return out;
  };

  // ------------------------------------------------------------------ Task 13 · chữ, 12 px, sắp lớp, "ca tối" (D9, D15)
  check('S6F-b (13) · D9: <Han> 12 px ở mọi nơi (không text-[11px]); người phụ trách ở dòng phụ việc là span text-xs', () => {
    assert(!doc('web/src/ui/Han.tsx').includes('text-[11px]'), 'Han.tsx còn 11 px');
    assert(/<span className="text-xs[^"]*">\{nguoi\}<\/span>/.test(doc('web/src/modules/worklist/WorkList.tsx')) && /const nguoi = it\.owner \?\? /.test(doc('web/src/modules/worklist/WorkList.tsx')), 'WorkList: người phụ trách chưa ở span text-xs');
  });

  check('S6F-b (13) · D15: không còn chữ "ca tối" / "buổi tối" ở web/src, seed, shared (ngoài phép kiểm)', () => {
    const coChu = [...quet('web/src', /\.(tsx?|css)$/), ...quet('server/src/seed', /\.ts$/), ...quet('shared', /\.ts$/)]
      .filter((f) => /ca tối|buổi tối/i.test(doc(f)));
    assert(!coChu.length, coChu.join(', '));
  });

  check('S6F-b (13) · "Lớp đang dạy" ở hồ sơ GV sắp theo soSanhLop (MB FT 9 trước MB FT 10)', () => {
    assert(/lop\.sort\(\(a, b\) => \(a\.khung === b\.khung \? soSanhLop\(\{ code: a\.ma \}, \{ code: b\.ma \}\)/.test(doc('server/src/giaoVien/hoSo.ts')), 'hoSo.ts lopCuaGv còn sắp theo chữ');
    assert(d.soSanhLop({ code: 'MB FT 9' }, { code: 'MB FT 10' }) < 0, 'soSanhLop');
  });

  check('S6F-b (13) · "Cách tính": bấm chỉ MỞ (đóng bằng Esc / rời chuột / mất focus) — không đảo trạng thái', () => {
    const s = doc('web/src/ui/SoLieu.tsx');
    assert(!s.includes('setHowTo(!howTo)') && /onClick=\{\(\) => setHowTo\(true\)\}/.test(s), 'SoLieu: onClick còn đảo howTo');
  });

  check('S6F-b (13) · chữ theo mockup 24 D1 / 26: ghim chương "Progress Test · 3/4 môn"; chân "Lên FT + bổ trợ S"; chú giải "dự kiến"; ô Sắp tới em Tạm dừng "giữ lịch · Quản lý dời nếu cần"', () => {
    const g = d.nhanGhim({ cheDo: 'ratio', attemptNo: 1, kind: 'progress', overall: null, sosLevel: 1, soDat: 3, soYeuCau: 4, soCoDiem: 4 });
    assert(g.chuong === 'Progress Test · 3/4 môn' && g.chu === 'Progress · 3/4 môn đạt', JSON.stringify(g));
    assert(/nhanGhim\([^)]*\)[\s\S]{0,700}nh\.chuong \?\? nh\.chu/.test(doc('web/src/modules/students/ChuongLop.tsx')), 'ChuongLop dùng nhãn chương');
    assert(d.chuLen({ ft: true, ct: null }, { soBuoi: 4, soTuan: 2, theoMon: true, mon: ['speaking'] }, 'BE') === 'Lên FT + bổ trợ S', d.chuLen({ ft: true, ct: null }, { soBuoi: 4, soTuan: 2, theoMon: true, mon: ['speaking'] }, 'BE'));
    assert(d.chuLen({ ft: false, ct: 'BE' }, null, 'FOU') === 'Lên BE' && d.chuLen(null, null, 'FOU') === 'Lên lớp sau', 'không bổ trợ');
    const hj = doc('web/src/modules/students/HanhTrinh.tsx');
    assert(!hj.includes("'đợt Test chưa có điểm'") && /'dự kiến'/.test(hj), 'chú giải mục 8');
    const o = d.oSapToi({ ketLuan: null, sauCuoiKhoa: null, next: { dau: 'MT3', attemptNo: 3, tuan: '2026-10-19', kyVong: 6, soPhan: 4, final: false }, ratio: false, kck: false, bacKe: null, homNay: '2026-09-14', tamDung: true });
    assert(o.gt === 'MT3 · W4 OCT' && o.phu === 'giữ lịch · Quản lý dời nếu cần', JSON.stringify(o));
  });
}

async function runTask9(t: YThucTestKit, d: any) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const tq: any = await import('../worklist/tongQuan.ts');
  const hoSoGv: any = await import('../giaoVien/hoSo.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const { scoreDebtCells } = await import('../worklist/scoreDebt.ts');
  const { lopChoChotLoTrinh } = await import('../classes/lenhChuyen.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mb = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;

  // ------------------------------------------------------------------ Task 9 · Tổng quan / Công việc — số và link (D7, D10, D13)
  check('S6F-b (9) · D10 HAI ĐƯỜNG: Lớp tôi dạy "Bài quá hạn" / "Bài chờ chấm" đếm BÀI (baiId) = số dòng khi bấm = cột cùng tên ở hồ sơ GV (cùng lớp)', () => {
    let so = 0;
    /*
     * GV dạy môn ở MB FT 101 + GVCN lớp thường MB FOU 12 (đủ hai khung). Mỗi ô gọi lại `scoreDebtCells` (nặng — sau các phép kiểm trước GV có
     * hàng chục lớp, lặp mọi lớp làm Node hết bộ nhớ): mỗi cặp (GV, khung) so 1 lớp có bài + 1 lớp không bài.
     */
    for (const [gv, ct] of [[P.lrTeacher.userId, 'ft'], [P.normalCoreTeacher.userId, 'thuong']] as const) {
      const p = loadPrincipal(gv);
      {
        const rows = tq.lopToiDay(p, { ct }).rows as any[];
        for (const h of [...rows.filter((x) => x.baiCho > 0).slice(0, 1), ...rows.filter((x) => x.baiCho === 0).slice(0, 1)]) {
          for (const [cot, cotGv, n] of [['bai-qua-han', 'qua-han', h.baiQuaHan], ['bai-cho', 'chua-nhap', h.baiCho]] as const) {
            const o = tq.oLopToiDay(p, { ct, classId: h.classId, cot });
            const g = hoSoGv.oHoSoGv(p, gv, { cot: cotGv, lop: h.classId });
            assert(typeof n === 'number' && o.n === n && o.rows.length === n && g.n === n, `GV ${gv} ${h.code} ${cot}: ô ${n} · bấm ${o.n} · hồ sơ GV ${g.n}`);
            so += n;
          }
        }
      }
    }
    assert(so > 0, 'bộ demo phải có bài chờ chấm ở Lớp tôi dạy');
    assert(!/useApi[^\n]*'\/my-work'/.test(doc('web/src/modules/worklist/LopToiDay.tsx')) && !('baiChoChamTheoLop' in d), 'Lớp tôi dạy không còn đếm từ /my-work');
  });

  check('S6F-b (9) · D13: link từ Tổng quan sang Công việc mang khung=tat-ca (Xem hết, Tất cả việc, Xem và nhắc)', () => {
    const v = doc('web/src/modules/worklist/ViecCuaToi.tsx');
    assert(/to="\/cong-viec\?loc=den-het-tuan&khung=tat-ca"/.test(v) && /to="\/cong-viec\?khung=tat-ca"/.test(v), 'ViecCuaToi: hai link thiếu khung=tat-ca');
    const den = (tq.tongQuanQuanLy(P.mbManager, {}).canXuLy as any[]).filter((x) => !x.cuaNguoiXem && x.den !== null).map((x) => x.den as string);   // UX-2: den null = mở panel danh sách
    assert(den.length && den.every((u) => u.includes('khung=tat-ca')), JSON.stringify(den));
  });

  check('S6F-b (9) · D7: khung đã nhớ theo NGƯỜI (khoá .u{userId}); Lớp tôi dạy: khung đã nhớ không có lớp → khung mặc định của GV', () => {
    assert(/\.u\$\{/.test(doc('web/src/ui/CongTacKhung.tsx')) && /datNguoiDungKhung\(/.test(doc('web/src/lib/session.tsx')), 'khoá nhớ khung theo người');
    assert(d.khungLopToiDay('thuong', true, false) === 'ft' && d.khungLopToiDay('ft', false, true) === 'thuong', 'khung nhớ 0 lớp → mặc định');
    assert(d.khungLopToiDay('thuong', true, true) === 'thuong' && d.khungLopToiDay(null, true, true) === 'ft' && d.khungLopToiDay(null, false, true) === 'thuong', 'giữ khung nhớ hợp lệ');
    assert(/khungLopToiDay\(/.test(doc('web/src/modules/worklist/LopToiDay.tsx')), 'LopToiDay gọi khungLopToiDay');
  });

  check('S6F-b (9) · Q6 vế m: lớp thiếu GV môn có bài quá hạn → "m bài chưa có người chấm" = Σ hàng "Chưa phân công" bảng GV (FT + lớp thường); chú thích ponytail cũ đã xoá', () => {
    const o = scoreDebtCells(P.mbManager, TODAY, [mb]).find((x) => x.overdue && x.userId);
    assert(o, 'bộ demo phải có bài quá hạn có người chấm ở MB');
    const ids = all(`SELECT id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active'`, o!.classId, o!.skill).map((r) => r.id as number);
    assert(ids.length, `không có phân công ${o!.skill} lớp ${o!.classId}`);
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
    try {
      const dong = (tq.tongQuanQuanLy(P.mbManager, { branchId: mb }).canXuLy as any[]).find((x) => x.metricId === 'lop-thieu-gv-mon');
      const m = (['ft', 'thuong'] as const).reduce((s, ct) => s + (hoSoGv.bangGvChiNhanh(P.mbManager, { cn: mb, ct }).chuaPhanCong?.quaHan ?? 0), 0);
      /* OV-11f (TQ-13): vế "bài chưa có người chấm" là chỉ số bấm được `bai-qua-han-chua-phan-cong`. */
      assert(m > 0 && dong?.kem?.some((x: any) => x.metricId === 'bai-qua-han-chua-phan-cong' && x.n === m), `kem: ${JSON.stringify(dong?.kem)} · bảng GV: ${m}`);
    } finally { conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); }
    assert(!doc('server/src/worklist/tongQuan.ts').includes('chờ hàng "Chưa phân công"'), 'chú thích ponytail cũ');
  });

  /* PR-LCb: dòng "em chưa có quyết định chuyển lớp" gộp vào "lớp cần Chốt lộ trình" — cùng ý: hạn đã qua → Quá hạn (HK2 J3). */
  check('S6F-b (9) · "lớp cần Chốt lộ trình": có lớp đã qua hạn (CN trước tuần Final) → Quá hạn; hạn = hạn sớm nhất (HK2 J3)', () => {
    const lop = lopChoChotLoTrinh(P.mbManager, null, TODAY) as any[];
    const han = lop.map((l) => l.han).filter(Boolean).sort()[0] as string | undefined;
    const dong = (tq.tongQuanQuanLy(P.mbManager, {}).canXuLy as any[]).find((x) => x.metricId === 'lop-chua-chot-len-ft');
    assert(dong && han, 'bộ demo phải có lớp thường tới hạn Chốt lộ trình còn em chưa có quyết định');
    assert(han! < TODAY, `bộ demo: hạn ${han} phải đã qua`);
    assert(dong.trangThai === 'qua-han' && dong.han?.ngay === han && dong.han?.loai === 'chot-len-ft', JSON.stringify({ t: dong.trangThai, han: dong.han }));
  });

  check('S6F-b (9) · bảng GV chi nhánh: không hàng GV nhưng có "Chưa phân công" → không Empty (Σ = ô)', () => {
    assert(/if \(!data\.hang\.length && !data\.chuaPhanCong\) return <Empty/.test(doc('web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx')), 'BangGiaoVienChiNhanh Empty');
  });

  check('S6F-b (9) · Q21 ghi bù đúng Thứ Hai: PA hạn 24/08, ghi 07/09 → 3 nghĩa vụ (2 trễ, 1 đúng) = "ghi bù 3 tuần"', () => {
    const caseId = get(`SELECT id FROM sos_cases WHERE status != 'done' ORDER BY id LIMIT 1`).id as number;
    const NOW = `${TODAY}T00:00:00Z`;
    const iv = Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, description, status, action_due, cycle_no, created_at) VALUES (?, 'tutor', 'S6F-b PA', 'started', '2026-09-28', 1, ?)`).run(caseId, NOW).lastInsertRowid);
    try {
      const truoc = metricsSvc.metricSet(P.admin, 'dung-han-cap-nhat', {});
      conn.prepare(`INSERT INTO case_followups (case_id, intervention_id, observed_on, outcome, cycle_no, cycle_due, late, created_at) VALUES (?, ?, '2026-09-08', 'partial', 1, '2026-08-11', 1, ?)`).run(caseId, iv, NOW);   // OV-12a: kỳ 14 ngày, hạn Thứ Ba
      const r = metricsSvc.metricSet(P.admin, 'dung-han-cap-nhat', {});
      const cua = (r.ids as number[]).filter((id) => !(truoc.ids as number[]).includes(id) && metricsSvc.parseObligation(id).interventionId === iv);
      const dung = cua.filter((id) => (r.numeratorIds as number[]).includes(id)).length;
      assert(cua.length === 3 && dung === 1, `${cua.length} nghĩa vụ, ${dung} đúng`);
      assert(/ghi bù 3 kỳ/.test(d.nhanTuanGhiKetQua('2026-08-11', '2026-09-08').tieuDe), d.nhanTuanGhiKetQua('2026-08-11', '2026-09-08').tieuDe);
    } finally {
      conn.prepare('DELETE FROM case_followups WHERE intervention_id = ?').run(iv);
      conn.prepare('DELETE FROM case_interventions WHERE id = ?').run(iv);
    }
  });
}

async function runTask8(t: YThucTestKit, d: any) {
  const { check, assert, conn, TODAY, P, addDays, classId, seedMax } = t;
  const { studentProfile } = await import('../students/profile.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { emConMiniTest } = await import('../normal/cuoiKhoa.ts');
  const { reportIssue, skillSupportBoard } = await import('../cases/cases.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const hs = (p: any, sid: number) => (studentProfile(p, sid) as any).dauHoSo;
  const viecCua = (p: any, sid: number) => hs(p, sid).viec as { cuaBan: any[]; nguoiKhac: any[] };
  const gvcnCua = (sid: number) => get(`SELECT ta.user_id id FROM enrollments e JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
      WHERE e.student_id = ? AND e.status = 'active' ORDER BY ta.id LIMIT 1`, sid)?.id as number | undefined;

  // ------------------------------------------------------------------ Task 8 · hồ sơ HV — mọi việc của em (D5)
  check('S6F-b (8) · HAI ĐƯỜNG "Thêm PA" (Q5): Case tay chưa PA → việc support:{caseId} ở hồ sơ của người phụ trách = việc ở Công việc (cùng khoá, cùng hạn); GV khác thấy ở "việc người khác"; quá hạn → câu tóm tắt nêu', () => {
    const sid = get(`SELECT e.student_id id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.class_id = ? AND e.status = 'active' AND s.status = 'active' AND s.id <= ? ORDER BY s.id DESC LIMIT 1`,
      classId('MB FT 101'), seedMax.students).id as number;
    const c = reportIssue(P.w2Teacher, { studentId: sid, title: 'Reading: chưa nối được logic đoạn', summary: 'Đọc hiểu sai logic đoạn văn — S6F-b', topic: 'reading', primaryCode: 'student.reading.logic', urgency: 'attention' }) as any;
    const caseId = Number(c.id ?? c.caseId ?? c);
    const owner = get('SELECT owner_user_id u FROM sos_cases WHERE id = ?', caseId).u as number;
    assert(owner, 'Case tay phải có người phụ trách');
    const po = loadPrincipal(owner);
    const key = `support:${caseId}`;
    const x = viecCua(po, sid).cuaBan.find((v) => v.key === key);
    const it = (myWork(po, {}) as any).items.find((i: any) => i.key === key);
    assert(x && x.loai === 'de-ra-pa' && x.nguoi.id === owner && /^Thêm PA/.test(x.chu), `hồ sơ: ${JSON.stringify(viecCua(po, sid).cuaBan.map((v) => v.key))}`);
    assert(it && it.studentId === sid && it.due === x.han, `Công việc: ${JSON.stringify(it && { due: it.due })} ≠ hạn ${x?.han}`);
    const gvcn = gvcnCua(sid)!;
    if (gvcn !== owner) {
      const v = viecCua(loadPrincipal(gvcn), sid);
      assert(!v.cuaBan.some((y) => y.key === key) && v.nguoiKhac.some((y) => y.key === key && y.nguoi.id === owner), 'GVCN: việc của người khác kèm tên');
    }
    conn.prepare('UPDATE sos_cases SET detected_at = ? WHERE id = ?').run(addDays(TODAY, -15), caseId);
    const cau = (hs(po, sid).tomTat as { chu: string }[]).map((m) => m.chu).join(' · ');
    assert(/Thêm PA.*quá hạn/.test(cau), `câu tóm tắt: ${cau}`);
    conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE id = ?`).run(caseId);
  });

  check('S6F-b (8) · HAI ĐƯỜNG Ý thức (Q5): việc "Ghi nhận vi phạm mới" (yt_xem) và "Ghi Đã thực hiện" (yt_thuc_hien) của GVCN ở Công việc = ở hồ sơ em (cùng khoá, cùng người làm, cùng hạn)', () => {
    let so = 0;
    const gvcns = all(`SELECT DISTINCT user_id id FROM teacher_assignments WHERE is_core = 1 AND status = 'active' ORDER BY user_id`).map((r) => r.id as number);
    for (const g of gvcns) {
      const p = loadPrincipal(g);
      for (const it of (myWork(p, {}) as any).items.filter((i: any) => i.mine && (i.group === 'yt_xem' || i.group === 'yt_thuc_hien'))) {
        const x = viecCua(p, it.studentId).cuaBan.find((y) => y.key === it.key);
        assert(x && x.nguoi.id === it.ownerId && x.han === it.due, `GV ${g} ${it.key}: hồ sơ ${JSON.stringify(x && { id: x.nguoi.id, han: x.han })} ≠ Công việc ${it.ownerId}/${it.due}`);
        so++;
      }
    }
    assert(so > 0, 'bộ demo phải có việc yt_xem / yt_thuc_hien của GVCN');
  });

  check('S6F-b (8) · Mini Test: người làm ở hồ sơ = Công việc (PR-CT2: người giữ việc `nguoiGiuMiniTest` — GVCN lớp đang học / chủ Case, không còn Người dạy)', () => {
    let so = 0;
    for (const m of all(`SELECT id, student_id FROM mini_test WHERE ty_le IS NULL`)) {
      const gv = emConMiniTest([m.student_id]).get(m.student_id)?.gv;
      if (!gv) continue;
      const x = viecCua(P.admin, m.student_id);
      const v = [...x.cuaBan, ...x.nguoiKhac].find((y) => y.key === `minitest:${m.id}`);
      assert(v && v.nguoi.id === gv, `minitest:${m.id} người làm ${v?.nguoi.id} ≠ ${gv}`);
      so++;
    }
    assert(so > 0, 'bộ demo phải có Mini Test chờ ghi có người giữ việc');
  });

  check('S6F-b (8) · ô Kết quả gần nhất: mỗi kỹ năng dưới kỳ vọng mang attemptId của CHÍNH hàng kỹ năng (bandAttemptId); web liên kết theo attemptId của hàng', () => {
    let so = 0;
    for (const r of all(`SELECT e.student_id id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE c.is_fast_track = 1 AND e.status = 'active' AND e.student_id <= ? LIMIT 30`, seedMax.students)) {
      const duoi = hs(P.admin, r.id).o?.ketQua?.duoi ?? [];
      if (!duoi.length) continue;
      const rows = (skillSupportBoard(P.admin, r.id) as any).rows;
      for (const x of duoi) {
        const row = rows.find((y: any) => y.category === x.kn);
        assert(x.attemptId && x.attemptId === row?.bandAttemptId, `em ${r.id} ${x.kn}: ${x.attemptId} ≠ ${row?.bandAttemptId}`);
        so++;
      }
    }
    assert(so > 0, 'bộ demo phải có em FT dưới kỳ vọng');
    assert(/kyNangHref=\{\(kn, attemptId\) =>/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'StudentDetailPage: liên kết theo attemptId của hàng');
  });

  check('S6F-b (8) · hồ sơ HV không tự ghép `/mock-test/${…}` (StudentPlanPanel, IntakePanel → duongDotTest + Link); dải chờ duyệt có "+ Thêm PA"; hàng PA không lặp "chưa có lịch"', () => {
    for (const f of ['web/src/modules/students/HangLichMt.tsx', 'web/src/modules/students/IntakePanel.tsx']) {   // PR-LM: link hồ sơ MT chuyển từ StudentPlanPanel sang HangLichMt
      const s = doc(f);
      assert(!s.includes('`/mock-test/${') && /duongDotTest\(/.test(s), `${f}: còn tự ghép /mock-test/`);
    }
    assert(/<TheYeuCau.{0,120}onThemPa=\{onThemPa\}/.test(doc('web/src/modules/students/DauHoSo.tsx')), 'DauHoSo: dải chờ duyệt thiếu onThemPa');
    assert(!/chuaLich && <span className="text-soon"> · chưa có lịch<\/span>/.test(doc('web/src/modules/cases/SkillBoard.tsx')), 'hàng PA lặp "chưa có lịch"');
  });

  check('S6F-b (8) · hồ sơ HV lớp thường có bài Final Test đã xếp lịch: tuần "Final Test" ở đầu hồ sơ = tuần bài Final Test (ô Sắp tới)', () => {
    const r = get(`SELECT a.student_id id, pr.week_start w FROM assessment_attempts a JOIN report_periods pr ON pr.id = a.planned_period_id
        JOIN classes c ON c.id = a.class_id JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = c.id AND e.status = 'active'
       WHERE a.kind = 'final' AND a.status != 'cancelled' AND c.is_fast_track = 0 AND a.student_id <= ? ORDER BY a.student_id LIMIT 1`, seedMax.students);
    assert(r, 'bộ demo phải có bài Final Test đã xếp tuần');
    const tt = hs(P.admin, r.id).thongTin;
    assert(tt.thiDuKien?.nhan === 'Final Test' && tt.thiDuKien.gt === d.tuanLich(r.w, TODAY), `${JSON.stringify(tt.thiDuKien)} ≠ ${d.tuanLich(r.w, TODAY)}`);
  });
}

async function runTask7(t: YThucTestKit, d: any) {
  const { check, assert, conn, TODAY, P, addDays, seedMax } = t;
  const { hanhTrinhHocVien } = await import('../students/hanhTrinh.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const week: any = await import('../platform/week.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const run = (sql: string, ...a: unknown[]) => conn.prepare(sql).run(...a);
  const thu2 = d.mondayOfDate(TODAY) as string;
  const w = (n: number) => addDays(thu2, n * 7);
  const NOW = `${TODAY}T00:00:00Z`;
  const demTruyVan = (fn: () => void): number => {
    let n = 0;
    const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  const em = get(`SELECT s.id, cy.id cy, cy.start_period_id sp, e.id enr, e.class_id lop FROM enrollments e JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
     WHERE e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL AND c.is_fast_track = 1 AND c.status = 'active' AND s.id <= ?
       AND NOT EXISTS (SELECT 1 FROM journey_events j WHERE j.student_id = s.id AND j.event_type IN ('pause', 'resume'))
       AND (SELECT COUNT(*) FROM enrollments e2 WHERE e2.student_id = s.id) = 1
       AND (SELECT COUNT(*) FROM learning_cycles c2 WHERE c2.student_id = s.id AND c2.status = 'active') = 1
     ORDER BY s.id DESC LIMIT 1`, seedMax.students);
  const nhatKy = (sid: number, ev: [string, string][]) => ev.map(([loai, ngay]) => Number(run(
    `INSERT INTO journey_events (student_id, event_type, event_date, title, created_by, created_at) VALUES (?, ?, ?, 'x', ?, ?)`,
    sid, loai, ngay, P.mbManager.userId, NOW).lastInsertRowid));
  const xoaNhatKy = (ids: number[]) => run(`DELETE FROM journey_events WHERE id IN (${ids.map(() => '?').join(',')})`, ...ids);
  const datBatDau = (batDau: string | null) => run('UPDATE learning_cycles SET start_period_id = ? WHERE id = ?', batDau ? week.ensurePeriod(batDau).id : em.sp, em.cy);

  // ------------------------------------------------------------------ Task 7 · Hành trình
  check('S6F-b (7) · em Tạm dừng (ghi danh paused): chương lớp hiện tại vẫn ĐANG HỌC, không chân "Tạm dừng học (bảo lưu)"; tuần học = tuanHocTai = đầu hồ sơ ("tuần học 14 · đang dừng")', () => {
    assert(em, 'bộ demo phải có em FT một ghi danh');
    datBatDau(w(-15));
    run(`UPDATE students SET status = 'inactive' WHERE id = ?`, em.id);
    run(`UPDATE enrollments SET status = 'paused', end_kind = 'bao_luu' WHERE id = ?`, em.enr);
    const ids = nhatKy(em.id, [['pause', addDays(TODAY, -1)]]);
    try {
      const c = (hanhTrinhHocVien(P.admin, em.id, null) as any).chuong.find((x: any) => x.enrollmentId === em.enr);
      const hs = (studentProfile(P.admin, em.id) as any).dauHoSo.thongTin.tuanHoc;
      assert(c && c.dangHoc === true && !c.ra, `chương: ${JSON.stringify({ dangHoc: c?.dangHoc, ra: c?.ra })}`);
      assert(c.tuanHoc && c.tuanHoc.tu === 14 && c.tuanHoc.den === null && c.tuanHoc.dangDung === true, `tuần chương: ${JSON.stringify(c.tuanHoc)}`);
      assert(hs.tuan === c.tuanHoc.tu && hs.dangDung === c.tuanHoc.dangDung, `đầu hồ sơ ${JSON.stringify(hs)} ≠ chương`);
    } finally {
      xoaNhatKy(ids);
      run(`UPDATE enrollments SET status = 'active', end_kind = NULL WHERE id = ?`, em.enr);
      run(`UPDATE students SET status = 'active' WHERE id = ?`, em.id);
      datBatDau(null);
    }
  });

  check('S6F-b (7) · chương cũ rời lớp trong tuần dừng → "den" = tuần học cuối TRƯỚC tuần dừng (không null)', () => {
    datBatDau(w(-15));
    const lopKhac = get(`SELECT id FROM classes WHERE is_fast_track = 1 AND id != ? ORDER BY id LIMIT 1`, em.lop).id;
    const cu = Number(run(`INSERT INTO enrollments (student_id, class_id, status, started_at, ended_at, created_at) VALUES (?, ?, 'transferred', ?, ?, ?)`,
      em.id, lopKhac, w(-30), addDays(w(-3), 3), NOW).lastInsertRowid);
    const ids = nhatKy(em.id, [['pause', addDays(w(-4), 1)], ['resume', w(-2)]]);
    try {
      const c = (hanhTrinhHocVien(P.admin, em.id, null) as any).chuong.find((x: any) => x.enrollmentId === cu);
      assert(c?.tuanHoc?.den === d.tuanHocFt(w(-15), w(-5), []) && c.tuanHoc.den === 11, `den: ${JSON.stringify(c?.tuanHoc)}`);
    } finally { xoaNhatKy(ids); run('DELETE FROM enrollments WHERE id = ?', cu); datBatDau(null); }
  });

  check('S6F-b (7) · Tạm dừng và Quay lại cùng tuần (T2 20/07 → CN 26/07) → không có khoảng dừng để vẽ (trục, chương)', () => {
    const ids = nhatKy(em.id, [['pause', '2026-07-20'], ['resume', '2026-07-26']]);
    try {
      const h: any = hanhTrinhHocVien(P.admin, em.id, null);
      assert(!h.tamDung.some((k: any) => k.tu === '2026-07-20'), `trục: ${JSON.stringify(h.tamDung)}`);
      assert(h.chuong.every((c: any) => !c.tamDung.some((k: any) => k.tu === '2026-07-20')), 'chương');
    } finally { xoaNhatKy(ids); }
  });

  check('S6F-b (7) · mốc điểm mang kind + classId từ máy chủ; lượt lớp thường → /bang-diem-thuong/ (kể cả chưa xếp tuần); web duongMoc đọc mốc, không tra ghim', () => {
    const th = get(`SELECT e.student_id id FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN students s ON s.id = e.student_id
       WHERE c.is_fast_track = 0 AND e.status = 'active' AND s.id <= ? AND EXISTS (SELECT 1 FROM assessment_attempts a JOIN assessment_scores sc ON sc.attempt_id = a.id WHERE a.class_id = c.id AND a.student_id = s.id)
       ORDER BY s.id LIMIT 1`, seedMax.students);
    assert(th, 'bộ demo phải có em lớp thường đã có điểm');
    const h: any = hanhTrinhHocVien(P.admin, th.id, 'thuong');
    const diem = h.hop.flatMap((x: any) => x.diem);
    assert(diem.length && diem.every((m: any) => m.classId && m.kind), `mốc thiếu kind/classId: ${JSON.stringify(diem.slice(0, 2))}`);
    const moc = d.chuoiDiem(h.hop.find((x: any) => x.diem.length).diem, 'ratio', false);
    assert(moc.every((m: any) => m.classId && m.kind) && d.duongDotTest({ id: moc[0].attemptId, kind: moc[0].kind, classId: moc[0].classId }, 'listening').startsWith('/bang-diem-thuong/'), JSON.stringify(moc[0]));
    const tsx = doc('web/src/modules/students/HanhTrinh.tsx');
    assert(/duongDotTest\(\{ id: m\.attemptId, kind: m\.kind \?\? null, classId: m\.classId \?\? null \}/.test(tsx) && !/ghim\.find\(\(x\) => x\.attemptId === attemptId\)/.test(tsx), 'duongMoc đọc kind/classId của mốc');
  });

  check('S6F-b (7) · số câu hanhTrinhHocVien không tăng theo số lộ trình thiếu programme_code (3 lộ trình cũ NULL)', () => {
    const n0 = demTruyVan(() => hanhTrinhHocVien(P.admin, em.id, null));
    const maxSeq = get('SELECT MAX(seq) m FROM learning_cycles WHERE student_id = ?', em.id).m as number;
    const ids = [1, 2, 3].map((k) => Number(run(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, ended_at, status, created_at) VALUES (?, ?, NULL, NULL, ?, ?, 'completed', ?)`,
      em.id, maxSeq + k, `2025-0${k}-01`, `2025-0${k}-20`, NOW).lastInsertRowid));
    try {
      const n1 = demTruyVan(() => hanhTrinhHocVien(P.admin, em.id, null));
      assert(n1 === n0, `số câu ${n0} → ${n1}`);
    } finally { run(`DELETE FROM learning_cycles WHERE id IN (?, ?, ?)`, ...ids); }
  });

  check('S6F-b (7) · khung chương cuộn tới chương đang học khi gắn (scrollLeft = scrollWidth)', () => {
    assert(/scrollLeft = [a-z.]*scrollWidth/i.test(doc('web/src/modules/students/ChuongLop.tsx')), 'ChuongLop chưa tự cuộn');
  });
}

async function runTask6(t: YThucTestKit, d: any) {
  const { check, assert, assertThrows, conn, TODAY, P, addDays, seedMax } = t;
  const { studentProfile } = await import('../students/profile.ts');
  const { xemChuyenLop } = await import('../classes/luatLoTrinh.ts');
  const { transitionPlan } = await import('../classes/transition.ts');
  const { setStudentStatus } = await import('../students/students.ts');
  const week: any = await import('../platform/week.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu2 = d.mondayOfDate(TODAY) as string;
  const w = (n: number) => addDays(thu2, n * 7);

  // ------------------------------------------------------------------ Task 6 · Tạm dừng nhất quán (D17)
  check('S6F-b (6) · tuanHocTai: trong khoảng dừng → tuần học cuối TRƯỚC tuần dừng + dangDung; dừng ngay tuần đầu → { null, true }; trước tuần bắt đầu → null; không dừng → như tuanHocFt', () => {
    const js = (x: unknown) => JSON.stringify(x);
    const dang = [{ tu: addDays(w(-1), 2), den: null }];
    assert(js(d.tuanHocTai(w(-15), TODAY, dang)) === js({ tuan: 14, dangDung: true }), js(d.tuanHocTai(w(-15), TODAY, dang)));
    assert(js(d.tuanHocTai(w(-15), TODAY, [])) === js({ tuan: 16, dangDung: false }), 'không dừng');
    assert(js(d.tuanHocTai(w(-1), TODAY, dang)) === js({ tuan: null, dangDung: true }), 'dừng ngay tuần đầu');
    assert(d.tuanHocTai(w(1), TODAY, []) === null, 'trước tuần bắt đầu');
    assert(js(d.tuanHocTai(w(-15), TODAY, [{ tu: w(-4), den: w(-2) }])) === js({ tuan: 14, dangDung: false }), 'dừng 2 tuần đã quay lại');
    assert(d.chuTuanHoc(14, null, true) === 'tuần học 14 · đang dừng' && d.chuTuanHoc(null, null, true) === 'đang dừng', d.chuTuanHoc(14, null, true));
    assert(d.chuTuanHoc(3, 8) === 'tuần học 3/8' && d.chuTuanHoc(9, null) === 'tuần học 9', 'chữ cũ giữ');
  });

  /* Em FT "sạch" của bộ demo; phép kiểm đặt lộ trình bắt đầu 15 tuần trước tuần này (tuần này = tuần học 16), ghi Tạm dừng hôm qua (Chủ nhật — tuần trước). */
  const em = get(`SELECT s.id, cy.id cy, cy.start_period_id sp, e.class_id lop FROM enrollments e JOIN students s ON s.id = e.student_id
      JOIN classes c ON c.id = e.class_id JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
     WHERE e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL AND c.is_fast_track = 1 AND c.status = 'active' AND s.id <= ?
       AND NOT EXISTS (SELECT 1 FROM journey_events j WHERE j.student_id = s.id AND j.event_type IN ('pause', 'resume'))
       AND e.id = (SELECT MAX(e2.id) FROM enrollments e2 WHERE e2.student_id = s.id AND e2.status = 'active')
       AND (SELECT COUNT(*) FROM enrollments e3 WHERE e3.student_id = s.id AND e3.status IN ('active', 'paused')) = 1
       AND (SELECT COUNT(*) FROM learning_cycles c2 WHERE c2.student_id = s.id AND c2.status = 'active') = 1
     ORDER BY s.id LIMIT 1`, seedMax.students);
  const datBatDau = (batDau: string | null) =>
    conn.prepare('UPDATE learning_cycles SET start_period_id = ? WHERE id = ?').run(batDau ? week.ensurePeriod(batDau).id : em.sp, em.cy);
  const voiDung = (ngay: string, batDau: string, fn: () => void) => {
    datBatDau(batDau);
    const id = Number(conn.prepare(`INSERT INTO journey_events (student_id, event_type, event_date, title, created_by, created_at) VALUES (?, 'pause', ?, 'Tạm dừng học', ?, ?)`)
      .run(em.id, ngay, P.mbManager.userId, `${TODAY}T00:00:00Z`).lastInsertRowid);
    try { fn(); } finally { conn.prepare('DELETE FROM journey_events WHERE id = ?').run(id); datBatDau(null); }
  };
  /* Ba nơi cùng gọi `tuanHocTai`. Panel Chuyển lớp chỉ mở cho ghi danh `active` — phép kiểm ghi Tạm dừng vào nhật ký (khoảng dừng) mà giữ ghi danh, để ba đường cùng soi được. */
  const baNoi = (): Record<string, any> => ({
    hoSo: (studentProfile(P.admin, em.id) as any).dauHoSo.thongTin.tuanHoc,
    motEm: (xemChuyenLop(P.mbManager, em.id) as any).hienTai.tuanHoc,
    caLop: (transitionPlan(P.mbManager, em.lop) as any).students.find((s: any) => s.id === em.id)?.tuanHoc,
  });

  check('S6F-b (6) · ba nơi (đầu hồ sơ, panel Chuyển lớp một em, panel cả lớp) CÙNG { tuan: 14, dangDung: true } khi em đang dừng; chữ "tuần học 14 · đang dừng"', () => {
    assert(em, 'bộ demo phải có em FT sạch');
    datBatDau(w(-15));
    try { assert((studentProfile(P.admin, em.id) as any).dauHoSo.thongTin.tuanHoc?.tuan === 16, `tiền đề em ${em.id}: ${JSON.stringify((studentProfile(P.admin, em.id) as any).dauHoSo.thongTin)}`); } finally { datBatDau(null); }
    voiDung(addDays(TODAY, -1), w(-15), () => {
      for (const [noi, v] of Object.entries(baNoi())) {
        assert(v && v.tuan === 14 && v.dangDung === true && v.tong === null, `${noi}: ${JSON.stringify(v)}`);
        assert(d.chuTuanHoc(v.tuan, v.tong, v.dangDung) === 'tuần học 14 · đang dừng', noi);
      }
    });
  });

  check('S6F-b (6) · dừng ngay tuần đầu → ba nơi đều "đang dừng" (không mất dòng); em không dừng → { tuan: 16, dangDung: false } như cũ', () => {
    voiDung(TODAY, thu2, () => {
      for (const [noi, v] of Object.entries(baNoi())) assert(v && v.tuan === null && v.dangDung === true, `${noi}: ${JSON.stringify(v)}`);
    });
    datBatDau(w(-15));
    try {
      for (const [noi, v] of Object.entries(baNoi())) assert(v && v.tuan === 16 && v.dangDung === false, `${noi}: ${JSON.stringify(v)}`);
    } finally { datBatDau(null); }
  });

  check('S6F-b (6) · web: ba nơi hiện chữ qua chuTuanHoc(…, dangDung); Ngăn Case, hàng Case/PA bảng kỹ năng, thẻ PA Ngăn Case: em Tạm dừng → mọi hạn thành nhãn Tạm dừng', () => {
    for (const f of ['web/src/modules/students/DauHoSo.tsx', 'web/src/modules/students/ChuyenLopPanel.tsx', 'web/src/modules/classes/TransitionPanel.tsx']) {
      assert(/chuTuanHoc\([^)]*\.dangDung\)/.test(doc(f)), `${f}: chưa truyền dangDung`);
    }
    const ngan = doc('web/src/modules/students/NganCase.tsx');
    assert(/data\.tamDungTu && data\.trangThaiV4\.t === 'qua-han'[\s\S]{0,40}<NhanTamDung tu=\{data\.tamDungTu\}/.test(ngan), 'Ngăn Case: nhãn đầu panel Tạm dừng thay Quá hạn');
    assert(/!data\.tamDungTu && canDong && !conPaChay/.test(ngan), 'Ngăn Case: hạn báo kết quả ẩn khi Tạm dừng');
    const sb = doc('web/src/modules/cases/SkillBoard.tsx');
    assert(/tt\.han && !daXong && \(tamDung/.test(sb), 'hàng Case: mọi hạn → Tạm dừng');
    assert(/phu=\{tamDung && han \? <NhanTamDung/.test(sb), 'hàng PA: mọi hạn → Tạm dừng');
    /* PR-PA Task 6: chân dòng PA tính cờ `hienHan` một lần. */
    const cpPa = doc('web/src/modules/cases/CasePanel.tsx');
    assert(/const hienHan = !!hanGhi && !choDuyet;/.test(cpPa) && /hienHan && hanGhi && \(data\.tamDungTu \? <NhanTamDung/.test(cpPa), 'thẻ PA Ngăn Case: mọi hạn → Tạm dừng');
  });

  check('S6F-b (6) · ngày Tạm dừng trước lần Quay lại gần nhất → 400 (khoangTamDung không ghép sai cặp)', () => {
    const ids = [['pause', addDays(TODAY, -13)], ['resume', addDays(TODAY, -7)]].map(([loai, ngay]) => Number(conn.prepare(
      `INSERT INTO journey_events (student_id, event_type, event_date, title, created_by, created_at) VALUES (?, ?, ?, 'x', ?, ?)`,
    ).run(em.id, loai, ngay, P.mbManager.userId, `${TODAY}T00:00:00Z`).lastInsertRowid));
    try {
      const r = addDays(TODAY, -7);
      assertThrows(() => setStudentStatus(P.mbManager, em.id, 'inactive', addDays(TODAY, -9)),
        new RegExp(`trước lần quay lại học gần nhất \\(${r.slice(8, 10)}/${r.slice(5, 7)}\\)`), 'Tạm dừng lùi trước Quay lại');
      assert(get('SELECT status FROM students WHERE id = ?', em.id).status === 'active', 'bị chặn thì không đổi gì');
    } finally { conn.prepare(`DELETE FROM journey_events WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); }
  });
}
