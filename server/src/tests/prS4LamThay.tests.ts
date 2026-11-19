/**
 * PHÉP KIỂM S4-LUAT phần 3 (chủ SP 20/11 — `docs/superpowers/specs/2026-11-19-ra-sau-tutor/s4-giam-buoc.md`):
 *   Đề xuất 2: Head điền thay bàn giao — câu hỏi "vẫn làm thay" hỏi MỘT lần cho cả phiếu đang mở (`apiNho`), đóng phiếu (`quenXacNhan`) thì hỏi lại;
 *     mỗi lần gửi vẫn mang mã đã đồng ý (máy chủ kiểm từng lần) · `api` thường vẫn hỏi từng lần như cũ.
 *   N56 ①: Head mở việc của GV khác làm thay được → vào thẳng form (không bước "Làm thay"); "Chỉ xem" về tóm tắt; không quyền → tóm tắt.
 */
import fs from 'node:fs';

export async function runPrS4LamThayTests(t: any) {
  const { checkAsync, check, assert } = t;
  const api: any = await import('../../../web/src/lib/api.ts');
  console.log('\nS4-LUAT · đề xuất 2 hỏi một lần mỗi phiếu · N56 ① làm thay vào thẳng form');

  await checkAsync('S4 đề xuất 2 · phiếu 5 em × 2 môn: 10 lần lưu (song song) = đúng 1 hộp hỏi; đóng phiếu mở lại → hỏi lại; api thường hỏi mỗi lần', async () => {
    const MA = 'Người được giao còn hạn bàn giao — Head vẫn điền thay?';
    const goc = globalThis.fetch;
    let guiMa = 0;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      const h = (init?.headers ?? {}) as Record<string, string>;
      const da = String(h['x-xac-nhan'] ?? '').split(',').map(decodeURIComponent).includes(MA);
      if (da) guiMa += 1;
      return da ? { ok: true, status: 200, text: async () => '{"ok":true}' } as Response
        : { ok: false, status: 409, text: async () => JSON.stringify({ error: MA, details: { canXacNhan: true, ma: MA } }) } as Response;
    }) as typeof fetch;
    let hoi = 0;
    const bo = api.datHoiXacNhan(async () => { hoi += 1; await new Promise((r) => setTimeout(r, 5)); return true; });
    try {
      const p = api.apiNho('ban-giao-gv-thu');
      await Promise.all(Array.from({ length: 10 }, (_, i) => p.put(`/ban-giao-gv/1/gop-y`, { studentId: Math.floor(i / 2), mon: i % 2 ? 'reading' : 'listening', noiDung: 'Em nghe tốt' })));
      assert(hoi === 1 && guiMa === 10, `một phiếu: ${hoi} hộp hỏi, ${guiMa} lần gửi kèm mã`);
      await p.post('/ban-giao-gv/1/xac-nhan', {});
      assert(hoi === 1, `Xác nhận cùng phiếu không hỏi lại: ${hoi}`);
      api.quenXacNhan('ban-giao-gv-thu');
      await p.put('/ban-giao-gv/1/gop-y', {});
      assert(hoi === 2, `đóng phiếu mở lại phải hỏi lại: ${hoi}`);
      await api.api.put('/x', {}); await api.api.put('/x', {});
      assert(hoi === 4, `api thường hỏi mỗi lần: ${hoi}`);
    } finally { bo(); globalThis.fetch = goc; api.quenXacNhan('ban-giao-gv-thu'); }
  });

  check('S4 đề xuất 2 · hai panel bàn giao gửi qua apiNho (không còn api.put / api.post) và quên khi đóng', () => {
    for (const [f, k] of [['BanGiaoGvPanel.tsx', 'ban-giao-gv'], ['BanGiaoPanel.tsx', 'ban-giao']]) {
      const s = fs.readFileSync(`web/src/modules/classes/${f}`, 'utf8');
      assert(s.includes(`const apiPhieu = apiNho('${k}');`) && s.includes(`useEffect(() => () => quenXacNhan('${k}'), []);`) && !/\bapi\.(put|post)\b/.test(s), f);
    }
  });

  check('S4 N56 ① · HoTroHocVienTab: làm thay được → form ngay (khoaPanel chỉ khi không quyền / Chỉ xem); "Chỉ xem" về tóm tắt, "Làm thay" mở lại form', () => {
    const s = fs.readFileSync('web/src/modules/congViec/HoTroHocVienTab.tsx', 'utf8');
    assert(/const khoaPanel = theoDoiChon && !moThang && \(!coLamThay \|\| chiXem === chon\?\.key\);/.test(s), 'khoaPanel');
    assert(/const dangLamThay = theoDoiChon && coLamThay && \(moThang \|\| chiXem !== chon\?\.key\);/.test(s), 'dangLamThay');
    assert(s.includes('onThoi={moThang ? null : () => boChuRoi(() => setChiXem(chon.key))}') && s.includes('onLamThay={() => setChiXem(null)}'), 'Chỉ xem ↔ Làm thay');
  });
}
