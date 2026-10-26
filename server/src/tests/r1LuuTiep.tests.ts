/** PHÉP KIỂM R1-LUU-TIEP — chọn bài còn thiếu kế tiếp (`baiKeTiep`, `conThieuFt`), ngữ cảnh danh sách 'luot'. Harness do `run.ts` truyền vào. */
import fs from 'node:fs';

type Kit = { check: (n: string, fn: () => void) => void; assert: (c: unknown, m: string) => void };

export async function runR1LuuTiepTests({ check, assert }: Kit) {
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nR1-LUU-TIEP · Lưu · bài tiếp');

  /* Ô giả: khoá × kỹ năng → ô; thiếu = conThieuFt. */
  const o = (x: Partial<Parameters<typeof d.conThieuFt>[0]> = {}) =>
    ({ required: true, canEdit: true, band: null, noShow: null, progress: 'due', ...x });
  const luoi = (m: Record<string, ReturnType<typeof o>>) => (v: { khoa: number; kyNang: string }) => {
    const c = m[`${v.khoa}:${v.kyNang}`];
    return !!c && d.conThieuFt(c);
  };
  const thuTu = [1, 2, 3, 4];
  const L = 'listening', R = 'reading';
  const ke = (m: Record<string, ReturnType<typeof o>>, khoa: number, kyNang: string, toi: string[] = [L, R], tt: number[] = thuTu) =>
    d.baiKeTiep(tt, luoi(m), { khoa, kyNang }, toi);
  const day = (khoa: number[], kn: string, x: Partial<ReturnType<typeof o>> = {}) => Object.fromEntries(khoa.map((k) => [`${k}:${kn}`, o(x)]));

  check('BT-1 · sau cùng cột', () => {
    const r = ke(day([1, 2, 3, 4], L), 2, L);
    assert(r?.khoa === 3 && r.kyNang === L, JSON.stringify(r));
  });
  check('BT-2 · hết phía sau → vòng lên phía trước', () => {
    const r = ke(day([1, 4], L), 4, L);
    assert(r?.khoa === 1 && r.kyNang === L, JSON.stringify(r));
  });
  check('BT-3 · hết L → ô R đầu tiên còn thiếu', () => {
    const r = ke({ ...day([2], L), ...day([3, 4], R) }, 2, L);
    assert(r?.khoa === 3 && r.kyNang === R, JSON.stringify(r));
  });
  check('BT-4 · bỏ ô đã có band', () => {
    const r = ke({ ...day([3], L, { band: 6 }), ...day([4], L) }, 2, L);
    assert(r?.khoa === 4, JSON.stringify(r));
  });
  check('BT-5 · bỏ môn không học / không quyền / "-" / vắng / huỷ / chưa tới tuần', () => {
    const m = {
      ...day([2], L, { required: false }), ...day([3], L, { canEdit: false }), ...day([4], L, { noShow: { state: 'khong-co-bai' } }),
      '5:listening': o({ progress: 'absent' }), '6:listening': o({ progress: 'cancelled' }), '7:listening': o({ progress: 'upcoming' }),
      '8:listening': o({ progress: 'sat' }),
    };
    const r = ke(m, 1, L, [L], [1, 2, 3, 4, 5, 6, 7, 8]);
    assert(r?.khoa === 8, JSON.stringify(r));
  });
  check('BT-6 · khoá rời dữ liệu (lọc) → bỏ qua, thứ tự còn lại giữ', () => {
    /* ảnh chụp 1..4; dữ liệu mới không còn hàng 3 → bỏ, sang 4 */
    const r = ke(day([1, 2, 4], L), 2, L);
    assert(r?.khoa === 4, JSON.stringify(r));
  });
  check('BT-7 · ô vừa có band ở dữ liệu mới → bỏ qua', () => {
    const m = day([1, 2, 3, 4], L);
    m['3:listening'] = o({ band: 5.5 });
    assert(ke(m, 2, L)?.khoa === 4, 'phải sang 4');
  });
  check('BT-8 · kyNangToi rỗng → chỉ cùng kỹ năng', () => {
    assert(ke({ ...day([3], R) }, 2, L, []) === null, 'không đổi kỹ năng');
    assert(ke({ ...day([1], L), ...day([3], R) }, 2, L, [])?.khoa === 1, 'vòng cùng cột');
  });
  check('BT-9 · hết mọi ô → null; không trả lại chính ô đang mở', () => {
    assert(ke({}, 2, L) === null, 'rỗng');
    assert(ke(day([2], L), 2, L) === null, 'chỉ còn chính nó');
  });
  check('BT-10 · conThieuFt khớp oTrongFt + điều kiện tuần / chờ duyệt dời', () => {
    assert(d.conThieuFt(o()) && d.conThieuFt(o({ progress: 'sat' })), 'due / sat là thiếu');
    for (const p of ['upcoming', 'not_scheduled', 'reschedule_pending', 'absent', 'cancelled', 'scored']) {
      assert(!d.conThieuFt(o({ progress: p })), p);
    }
  });
  check('BT-12 · MT lịch sử (nhập bù, chưa band, sửa được) là còn thiếu — "Lưu · bài tiếp" sang em kế, không báo hết sớm', () => {
    assert(d.conThieuFt(o({ progress: 'lich_su' })), 'lich_su chưa band phải là thiếu');
    assert(!d.conThieuFt(o({ progress: 'lich_su', band: 6 })), 'lich_su có band thì xong');
    const r = ke(day([1, 2, 3], L, { progress: 'lich_su' }), 1, L);
    assert(r?.khoa === 2, JSON.stringify(r));
  });
  check('BT-11 · docNguCanhDs nhận loại "luot"', () => {
    const ds = d.docNguCanhDs({ loai: 'luot', ids: [5, 6], nhan: 'MB FT 101' }, 'luot', 6);
    assert(ds?.loai === 'luot' && ds.ids.join() === '5,6', JSON.stringify(ds));
    assert(d.docNguCanhDs({ loai: 'luot', ids: [5, 6], nhan: 'x' }, 'hoc-vien', 6) === null, 'khác loại → null');
  });
  check('HOP · nút tiếp mặc định "Lưu · bài tiếp ›"; "Lưu · em tiếp ›" chỉ ở trang một em (tiepEm)', () => {
    const src = fs.readFileSync('web/src/modules/fasttrack/HopNhapDiem.tsx', 'utf8');
    const em = src.split("t('Lưu · em tiếp ›')").length - 1;
    assert(em === src.split("tiepEm ? t('Lưu · em tiếp ›')").length - 1, 'còn "Lưu · em tiếp ›" ngoài nhánh tiepEm');
    assert(src.includes("t('Lưu · bài tiếp ›')"), 'thiếu "Lưu · bài tiếp ›"');
  });
}
