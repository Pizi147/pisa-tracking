/**
 * TQ-SOS-CN (backlog GD-14, mockup ⑧ T3): ô "SOS 2–3" của bảng "Theo chi nhánh" (Tổng quan QT / CX) bấm được — bảng gửi kèm id em (`sos23Ids`, 0 câu thêm),
 * `/tong-quan/chi-nhanh/sos23` chỉ đọc đúng các em đó khi bấm. Kiểm: số panel = số ô bảng, thứ tự cố định (SOS 3 → 2 → id), quyền (QL chỉ chi nhánh mình,
 * id ngoài phạm vi bị bỏ).
 */
export async function runPrTqSosCnTests(t: any) {
  const { check, assert, assertThrows, conn, P } = t;
  console.log('\nTQ-SOS-CN · ô SOS 2–3 theo chi nhánh bấm được');
  const tqV5: any = await import('../worklist/tongQuanV5.ts');
  const bang: any = await import('../worklist/bangChiNhanh.ts');
  const { latestAttempts } = await import('../worklist/danhGia.ts');
  const { demoToday } = await import('../demoConfig.ts');

  check('TQ-SOS-CN (1) · Quản trị: mỗi chi nhánh + Toàn hệ thống — số panel = số ô bảng; em đều SOS ≥ 2; SOS 3 trước, rồi id', () => {
    let coEm = false;
    for (const ct of ['ft', 'thuong'] as const) {
      const d = tqV5.tongQuanV5(P.admin, { branchId: null, ct, ky: null });
      const hang = d.chiNhanh ?? [];
      assert(hang.length > 0, `${ct}: bảng chi nhánh rỗng`);
      for (const h of hang) {
        assert(h.sos23Ids.length === h.sos23, `${ct} · ${h.ten}: ${h.sos23Ids.length} id ≠ ô ${h.sos23}`);
        const r = bang.sos23ChiNhanh(P.admin, { branchId: h.id, ids: h.sos23Ids });
        assert(r.n === h.sos23 && r.rows.length === h.sos23, `${ct} · ${h.ten}: panel ${r.n} ≠ ô ${h.sos23}`);
        coEm ||= r.n > 0;
        const ev = latestAttempts(r.rows.map((x: any) => x.id), 'valid', demoToday());
        const muc = r.rows.map((x: any) => Math.min(3, ev.get(x.id)?.sosLevel ?? 0));
        assert(muc.every((m: number) => m >= 2), `${h.ten}: có em SOS < 2`);
        assert(r.rows.every((x: any, i: number) => x.sos?.muc === muc[i]), `${h.ten}: dòng thiếu / sai badge mức SOS (PTA rà #1710)`);
        for (let i = 1; i < muc.length; i++) assert(muc[i - 1] > muc[i] || (muc[i - 1] === muc[i] && r.rows[i - 1].id < r.rows[i].id), `${h.ten}: thứ tự sai ở dòng ${i}`);
      }
      const ids = [...new Set(hang.flatMap((h: any) => h.sos23Ids))];
      assert(bang.sos23ChiNhanh(P.admin, { branchId: null, ids }).n === ids.length, `${ct}: Toàn hệ thống`);
    }
    assert(coEm, 'seed phải có ít nhất một em SOS 2–3 để phép kiểm có nghĩa');
  });

  check('TQ-SOS-CN (2) · quyền: QL MB xem chi nhánh mình; chi nhánh khác → 403; id em chi nhánh khác (không nêu chi nhánh) bị bỏ; GVBM → 403', () => {
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id as number;
    const d = tqV5.tongQuanV5(P.admin, { branchId: null, ct: 'ft', ky: null });
    const cuaMb = d.chiNhanh.find((h: any) => h.id === mb);
    const khac = d.chiNhanh.find((h: any) => h.id !== mb && h.sos23Ids.length) ?? d.chiNhanh.find((h: any) => h.id !== mb);
    assert(bang.sos23ChiNhanh(P.mbManager, { branchId: mb, ids: cuaMb.sos23Ids }).n === cuaMb.sos23, 'QL MB không xem được em SOS 2–3 của MB');
    assertThrows(() => bang.sos23ChiNhanh(P.mbManager, { branchId: khac.id, ids: khac.sos23Ids }), /chi nhánh|quyền/, 'QL MB xem được chi nhánh khác');
    if (khac.sos23Ids.length) assert(bang.sos23ChiNhanh(P.mbManager, { branchId: null, ids: khac.sos23Ids }).n === 0, 'QL MB đọc được em chi nhánh khác qua ids');
    assertThrows(() => bang.sos23ChiNhanh(P.subjectTeacher, { branchId: mb, ids: cuaMb.sos23Ids }), /chi nhánh|quyền|Quản lý/, 'GVBM xem được panel SOS chi nhánh');
  });
}
