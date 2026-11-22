/**
 * PHÉP KIỂM S4-LUAT phần 3 (chủ SP 20/11 — `docs/superpowers/specs/2026-11-19-ra-sau-tutor/s4-giam-buoc.md`):
 *   Đề xuất 2 (hỏi một lần mỗi phiếu) đã bỏ theo N64: bàn giao không còn hỏi "vẫn làm thay" (PTA rà #1983) — `apiNho` / `quenXacNhan` gỡ.
 *   N56 ① → N64 (chủ SP 22/11): mở việc của GV khác làm thay được → vào thẳng form, không nút "Làm thay" / "Chỉ xem"; không quyền → tóm tắt.
 *     Nút dòng = tên hành động như chủ việc (không "Làm thay" / "Nhập hộ").
 */
import fs from 'node:fs';

export async function runPrS4LamThayTests(t: any) {
  const { checkAsync, check, assert } = t;
  const api: any = await import('../../../web/src/lib/api.ts');
  console.log('\nS4-LUAT · đề xuất 2 hỏi một lần mỗi phiếu · N56 ① làm thay vào thẳng form');

  /* N64 (PTA rà #1983): bàn giao không còn hỏi → bỏ `apiNho` / `quenXacNhan` (mã chết); `api` thường vẫn hỏi mỗi câu `canXacNhan` như cũ. */
  await checkAsync('S4 · api thường: mỗi lần 409 canXacNhan hỏi một lần rồi gửi lại kèm mã', async () => {
    const MA = 'Câu hỏi thử của phép kiểm';
    const goc = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      const da = String(((init?.headers ?? {}) as Record<string, string>)['x-xac-nhan'] ?? '').split(',').map(decodeURIComponent).includes(MA);
      return da ? { ok: true, status: 200, text: async () => '{"ok":true}' } as Response
        : { ok: false, status: 409, text: async () => JSON.stringify({ error: MA, details: { canXacNhan: true, ma: MA } }) } as Response;
    }) as typeof fetch;
    let hoi = 0;
    const bo = api.datHoiXacNhan(async () => { hoi += 1; return true; });
    try {
      await api.api.put('/x', {}); await api.api.put('/x', {});
      assert(hoi === 2 && !('apiNho' in api) && !('quenXacNhan' in api), `api thường hỏi mỗi lần: ${hoi}`);
    } finally { bo(); globalThis.fetch = goc; }
  });

  check('S4 · hai panel bàn giao không còn apiNho / quenXacNhan / chú thích "vẫn làm thay"', () => {
    for (const f of ['BanGiaoGvPanel.tsx', 'BanGiaoPanel.tsx']) {
      const s = fs.readFileSync(`web/src/modules/classes/${f}`, 'utf8');
      assert(!/apiNho|quenXacNhan|apiPhieu|vẫn làm thay/.test(s), f);
    }
  });

  check('S4 N64 · HoTroHocVienTab: làm thay được → form ngay (khoaPanel chỉ khi không quyền); không nút "Làm thay" / "Chỉ xem"; nút dòng = tên hành động', () => {
    const s = fs.readFileSync('web/src/modules/congViec/HoTroHocVienTab.tsx', 'utf8');
    assert(s.includes('const khoaPanel = theoDoiChon && !moThang && !coLamThay;'), 'khoaPanel');
    assert(s.includes('const dangLamThay = theoDoiChon && coLamThay;'), 'dangLamThay');
    assert(!/onLamThay|onThoi|setChiXem|t\('Làm thay'\)}<\/button>|t\('Chỉ xem'\)}<\/button>/.test(s), 'không còn nút Làm thay / Chỉ xem');
    const ds = fs.readFileSync('web/src/modules/congViec/DanhSachViec.tsx', 'utf8');
    assert(!/t\('Nhập hộ'\)|t\('Làm thay'\)/.test(ds), 'DanhSachViec: nút dòng không "Làm thay" / "Nhập hộ"');
    /* PTA rà #1880: dải làm thay ở đầu panel (ngoài vùng cuộn, 375 dính) — không nằm trong `dai` (đầu thân cuộn). */
    const kp = fs.readFileSync('web/src/ui/KhungPanel.tsx', 'utf8');
    assert(s.includes('daiLamThay: dangLamThay ? <DaiLamThay') && !/dai: [^\n]*DaiLamThay/.test(s), 'HoTroHocVienTab: dải qua daiLamThay');
    assert(/\(daiRieng \?\? cvNgoai\?\.daiLamThay\) && \([\s\S]{0,40}<div className="shrink-0 [^"]*max-sm:sticky max-sm:-top-4/.test(kp) && kp.indexOf('(daiRieng ?? cvNgoai?.daiLamThay) &&') < kp.indexOf('{tabs && <div'), 'KhungPanel: dải ngoài vùng cuộn, trước thân');
    /* N64 (PTA 22/11): bàn giao không hỏi "Head vẫn làm thay?" — panel hiện dải "Đang giao cho …" qua `daiLamThay`. */
    for (const f of ['server/src/classes/banGiao.ts', 'server/src/classes/banGiaoGv.ts']) assert(!/canXacNhan/.test(fs.readFileSync(f, 'utf8')), `${f}: không còn hộp hỏi làm thay`);
    for (const f of ['BanGiaoGvPanel.tsx', 'BanGiaoPanel.tsx']) assert(/daiLamThay=\{(!laMon && )?dto\.nguoiXem\.lamThay\?\.ten .*<DaiLamThay>\{chuDangGiao\(/.test(fs.readFileSync(`web/src/modules/classes/${f}`, 'utf8')), `${f}: dải Đang giao cho …`);
    /* PTA rà #1983: việc "Bàn giao môn X" (GVBM) không dải "Đang giao cho {GVCN}" — giữ dải chung "Bạn đang làm thay {GVBM}". */
    assert(/laMon=\{!!mon\}/.test(fs.readFileSync('web/src/modules/classes/BanGiaoPanel.tsx', 'utf8')), 'BanGiaoPanel: ban_giao_mon không dải GVCN');
  });
}
