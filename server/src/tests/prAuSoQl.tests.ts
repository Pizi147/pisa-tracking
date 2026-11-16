/**
 * AUDIT-1611 gói 2 SO-QL (AU-SO): số của QL cùng nguồn — P1-05 (hồ sơ GV mở đúng kỳ + khung trang nguồn), P1-06 (ô "Case chưa có PA" = ngoặc
 * "Chưa có PA" của panel, em đang học), P1-07 (ô hồ sơ lớp của QL → Công việc lọc lớp), P1-08 (Ý thức: "Chưa xử lý" hiện tại ở thẻ / lớp / HV), B2-09.
 */
import fs from 'node:fs';

export async function runPrAuSoQlTests(t: any) {
  const { check, assert, assertThrows, conn, P } = t;
  console.log('\nAU-SO gói 2 · SO-QL');
  const d: any = await import('../../../shared/domain/index.ts');
  const g: any = await import('../phanTich/giaoVien.ts');
  const tq: any = await import('../worklist/tongQuanV5.ts');
  const bc: any = await import('../worklist/bangChiNhanh.ts');
  const yt: any = await import('../phanTich/yThucPhanTich.ts');
  const { chayTrongRequest, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const ql = P.mbManager;
  const gio = (fn: () => any) => { xoaNho(); return chayTrongRequest('GET', fn); };

  check('AUSO-1 · P1-05: hồ sơ GV cùng kỳ + khung với dòng bảng GV Tổng quan → cùng Việc / Chấm; link mang tu / den (thứ Hai) + ct; ct lạ → 400', () => {
    assert(d.duongHoSoGv(7, { tu: '2026-08-31', den: '2026-09-13' }, 'ft') === '/giao-vien/7?tu=2026-08-31&den=2026-09-07&ct=ft', d.duongHoSoGv(7, { tu: '2026-08-31', den: '2026-09-13' }, 'ft'));
    assert(d.duongHoSoGv(7, null, 'tat-ca') === '/giao-vien/7', 'không kỳ, ct lạ → đường trơn');
    const so = (o: any) => (o?.k === 'so' ? `${o.dung}/${o.tong}` : o?.k);
    let soGv = 0;
    gio(() => {
      const v = tq.tongQuanV5(ql, { ct: 'ft' });
      const tu = d.mondayOfDate(v.ky.tu), den = d.mondayOfDate(v.ky.den);
      const pt = g.phanTichGiaoVien(ql, { cn: v.branchId, ct: 'ft', tu, den, v2: true });
      for (const h of pt.hang.filter((x: any) => x.id > 0 && x.viecDungHan?.k === 'so').slice(0, 4)) {
        const cs = g.chiSoHoSoGv(ql, h.id, { tu, den, ct: 'ft' });
        assert(so(cs.viecDungHan) === so(h.viecDungHan) && so(cs.diemDungHan) === so(h.chamDiem),
          `GV ${h.id}: hồ sơ ${so(cs.viecDungHan)} · ${so(cs.diemDungHan)} ≠ bảng ${so(h.viecDungHan)} · ${so(h.chamDiem)}`);
        const o = g.oChiSoHoSoGv(ql, h.id, { tu, den, ct: 'ft', cot: 'viec-dung-han' });
        assert(o.n === (h.viecDungHan.tong ?? 0), `GV ${h.id}: panel Việc ${o.n} ≠ ${h.viecDungHan.tong}`);
        soGv++;
      }
    });
    assert(soGv > 0, 'seed phải có GV có số Việc ở Tổng quan');
    assertThrows(() => gio(() => g.chiSoHoSoGv(ql, 7, { ct: 'abc' })), /Chương trình không hợp lệ/, 'ct lạ → 400');
  });

  check('AUSO-2 · P1-06: ô "Case chưa có PA" = ngoặc "Chưa có PA" của panel (không nhóm paXong) = Σ cột lớp; có PA = mở − chưa có PA; em Tạm dừng không đếm', () => {
    const doc = () => gio(() => {
      const v = tq.tongQuanV5(ql, { ct: 'ft' });
      const o = bc.oBangChiNhanh(ql, { branchId: v.branchId, ct: 'ft', cot: 'caseChuaChot', khoa: 'tong' });
      return { v, o };
    });
    const { v, o } = doc();
    assert(v.casePa.chuaPa === o.n && o.rows.every((r: any) => d.buocCuaDong({ nhom: r.nhom }) !== 'cho-ket-qua-cuoi'),
      `ô ${v.casePa.chuaPa} · panel ${o.n} · nhóm ${JSON.stringify(o.rows.map((r: any) => r.nhom))}`);
    assert(v.casePa.coPa === v.casePa.mo - v.casePa.chuaPa, JSON.stringify(v.casePa));
    const sumLop = (v.lop ?? []).reduce((n: number, l: any) => n + l.caseChuaPa, 0);
    assert(sumLop <= v.casePa.chuaPa && sumLop > 0, `Σ lớp ${sumLop} / ô ${v.casePa.chuaPa}`);
    const caseId = o.rows[0]?.id;
    const em = caseId && (conn.prepare('SELECT student_id AS id, (SELECT status FROM students WHERE id = student_id) AS st FROM sos_cases WHERE id = ?').get(caseId) as any);
    assert(em, 'cần một Case chưa có PA');
    const soCaseEm = o.rows.filter((r: any) => (conn.prepare('SELECT student_id FROM sos_cases WHERE id = ?').get(r.id) as any).student_id === em.id).length;
    conn.prepare(`UPDATE students SET status = 'paused' WHERE id = ?`).run(em.id);
    try {
      const sau = doc();
      assert(sau.v.casePa.chuaPa === v.casePa.chuaPa - soCaseEm && sau.o.n === sau.v.casePa.chuaPa,
        `em ${em.id} Tạm dừng: ô ${v.casePa.chuaPa} → ${sau.v.casePa.chuaPa} (bớt ${soCaseEm}), panel ${sau.o.n}`);
    } finally { conn.prepare('UPDATE students SET status = ? WHERE id = ?').run(em.st, em.id); xoaNho(); }
  });

  check('AUSO-3 · P1-07 + B2-09: ô hồ sơ lớp của QL → Công việc lọc lớp (`lop=`); Công việc lọc theo `lop`; Lịch Test đếm lớp có bài', () => {
    const doc = (f: string) => fs.readFileSync(f, 'utf8');
    const dt = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(/cong-viec\?nguoi=tat-ca&khung=tat-ca&loc=qua-han&lop=\$\{data\.id\}/.test(dt) && /nhom=cham-diem&lop=\$\{data\.id\}/.test(dt), 'DauTrangLop: ô QL chưa dẫn Công việc lọc lớp');
    const cv = doc('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(/const lopLoc = Number\(params\.get\('lop'\)\)/.test(cv) && /&& cuaLopLoc\(it\)\)/.test(cv), 'Công việc chưa lọc theo lop');
    assert(/const soLop = no\.filter\(\(d\) => conCua\(d\) > 0\)\.length/.test(doc('web/src/modules/test/lichTest/KhoiNo.tsx')), 'KhoiNo: n lớp đếm cả lớp 0 bài');
  });

  check('AUSO-4 · P1-08: Ý thức — thẻ "Chưa xử lý" = Σ cột lớp = panel tổng; mọi vi phạm chưa xử lý của bảng HV nằm trong tập đó', () => {
    gio(() => {
      const f = { branchId: 1, from: '2026-08-31', to: '2026-09-13' };
      const r = yt.yThucPhanTich(ql, f);
      const the = (r.lop ?? []).reduce((n: number, x: any) => n + x.chuaXuLy, 0);
      const tong = yt.oYThucPhanTich(ql, { ...f, dong: 'tong', cot: 'chua-xu-ly' });
      assert(tong.n === the && the > 0, `thẻ ${the} ≠ panel tổng ${tong.n}`);
      const tap = new Set(tong.rows.map((x: any) => x.id));
      for (const h of r.hvCanChuY) {
        if (!h.chuaXuLy) continue;
        const o = yt.oYThucPhanTich(ql, { ...f, dong: `hv:${h.studentId}`, cot: 'chua-xu-ly' });
        assert(o.rows.every((x: any) => tap.has(x.id)), `${h.ten}: vi phạm chưa xử lý ngoài thẻ (${o.rows.map((x: any) => x.id)})`);
      }
    });
  });
}
