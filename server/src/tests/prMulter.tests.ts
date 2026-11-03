/**
 * PHÉP KIỂM MULTER (AUDIT-LOI, chủ SP 03/11 "Cho làm"): `multer` 1.4.5-lts.1 → 2.5.0. Gọi THẲNG `POST /api/attachments/file` qua HTTP (đường tải
 * tệp duy nhất của máy chủ — bằng chứng vi phạm / biện pháp / Case / PA): tệp hợp lệ tên tiếng Việt giữ đúng dấu; quá 4 MB → 413; sai đuôi → 400;
 * multipart hỏng, tên trường rỗng, hai tệp, ngắt giữa chừng → 400 / không treo — và máy chủ VẪN trả lời lần gọi sau (bản 1.x có thể sập tiến trình,
 * GHSA-4pg4 / -g5hg / -fjgf / -72gw…). Mọi ca lỗi: kho tệp không thêm gì (không để rác).
 */
import net from 'node:net';

export async function runPrMulterTests(t: any) {
  const { checkAsync, assert, conn, P } = t;
  const { createApp } = await import('../app.ts');
  const { datKhoTepChoKiemThu } = await import('../platform/khoTep.ts');
  console.log('\nMULTER · nâng 2.5.0 · đường tải tệp bằng chứng');

  const kho = new Map<string, Buffer>();
  datKhoTepChoKiemThu({ async ghi(k, d) { kho.set(k, d); }, async doc(k) { return kho.get(k) ?? null; }, async xoa(k) { kho.delete(k); } });
  const caseId = (conn.prepare('SELECT id FROM sos_cases ORDER BY id LIMIT 1').get() as { id: number }).id;
  const may = createApp().listen(0);
  const cong = (may.address() as net.AddressInfo).port;
  const goc = `http://127.0.0.1:${cong}/api`;
  try {
    const s = await fetch(`${goc}/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: P.mbManager.userId }) });
    const cookie = (s.headers.get('set-cookie') ?? '').split(';')[0];
    const form = (ten: string, du: Buffer | string, them?: (f: FormData) => void) => {
      const f = new FormData();
      f.append('ownerType', 'sos_case');
      f.append('ownerId', String(caseId));
      f.append('file', new Blob([du]), ten);
      them?.(f);
      return f;
    };
    const gui = (body: FormData | string, headers: Record<string, string> = {}) =>
      fetch(`${goc}/attachments/file`, { method: 'POST', headers: { cookie, ...headers }, body });
    const loiCua = async (r: Response) => ((await r.json()) as { error?: string; message?: string });
    const conSong = async () => { const r = await fetch(`${goc}/demo/session`, { headers: { cookie } }); assert(r.status === 200, `máy chủ không còn trả lời (${r.status})`); };

    await checkAsync('MULTER-1 · tệp hợp lệ, tên tiếng Việt → 200, giữ đúng dấu, kho thêm đúng một tệp', async () => {
      const truoc = kho.size;
      const r = await gui(form('biên bản họp phụ huynh.pdf', 'noi dung'));
      const row = (await r.json()) as { displayName: string };
      assert(r.status === 200, `phải 200 (${r.status} ${JSON.stringify(row)})`);
      assert(row.displayName === 'biên bản họp phụ huynh.pdf', `tên tệp mất dấu: ${row.displayName}`);
      assert(kho.size === truoc + 1, 'kho phải thêm đúng một tệp');
    });

    await checkAsync('MULTER-2 · quá 4 MB → 413 "Tệp quá lớn: tối đa 4 MB.", kho không thêm', async () => {
      const truoc = kho.size;
      const r = await gui(form('to.pdf', Buffer.alloc(4 * 1024 * 1024 + 1, 1)));
      assert(r.status === 413, `phải 413 (${r.status})`);
      const l = await loiCua(r);
      assert(JSON.stringify(l).includes('Tệp quá lớn: tối đa 4 MB.'), `câu lỗi sai: ${JSON.stringify(l)}`);
      assert(kho.size === truoc, 'tệp quá cỡ không được vào kho');
    });

    await checkAsync('MULTER-3 · sai đuôi (.exe) → 400, kho không thêm', async () => {
      const truoc = kho.size;
      const r = await gui(form('cai-dat.exe', 'MZ'));
      assert(r.status === 400, `phải 400 (${r.status})`);
      assert(kho.size === truoc, 'tệp sai đuôi không được vào kho');
    });

    await checkAsync('MULTER-4 · multipart hỏng / tên trường rỗng / hai tệp → 400 "Không đọc được tệp tải lên.", máy chủ vẫn sống, kho không thêm', async () => {
      const truoc = kho.size;
      const B = 'ranhgioi';
      const hong = `--${B}\r\nContent-Disposition: form-data; name="ownerType"\r\n\r\nsos_case\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="a.pdf"\r\n\r\nchua het`;
      const r1 = await gui(hong, { 'content-type': `multipart/form-data; boundary=${B}` });
      assert(r1.status === 400, `multipart cụt phải 400 (${r1.status})`);
      assert(JSON.stringify(await loiCua(r1)).includes('Không đọc được tệp tải lên.'), 'câu lỗi multipart cụt');
      await conSong();
      const rong = `--${B}\r\nContent-Disposition: form-data; name=""\r\n\r\nx\r\n--${B}--\r\n`;
      const r2 = await gui(rong, { 'content-type': `multipart/form-data; boundary=${B}` });
      assert(r2.status === 400, `tên trường rỗng phải 400 (${r2.status})`);
      await conSong();
      const r3 = await gui(form('a.pdf', 'a', (f) => f.append('file', new Blob(['b']), 'b.pdf')));
      assert(r3.status === 400, `hai tệp phải 400 (${r3.status})`);
      await conSong();
      assert(kho.size === truoc, 'ca lỗi không được để tệp trong kho');
    });

    await checkAsync('MULTER-5 · client ngắt giữa chừng → máy chủ không treo, lần gọi sau vẫn trả lời, kho không thêm', async () => {
      const truoc = kho.size;
      await new Promise<void>((xong) => {
        const sock = net.connect(cong, '127.0.0.1', () => {
          const B = 'cat';
          sock.write(`POST /api/attachments/file HTTP/1.1\r\nHost: 127.0.0.1\r\nCookie: ${cookie}\r\nContent-Type: multipart/form-data; boundary=${B}\r\nContent-Length: 100000\r\n\r\n`
            + `--${B}\r\nContent-Disposition: form-data; name="file"; filename="a.pdf"\r\n\r\n${'x'.repeat(500)}`);
          setTimeout(() => { sock.destroy(); xong(); }, 100);
        });
        sock.on('error', () => xong());
      });
      await new Promise((r) => setTimeout(r, 100));
      await conSong();
      assert(kho.size === truoc, 'tệp tải dở không được để trong kho');
    });
  } finally {
    may.close();
    datKhoTepChoKiemThu(null);
  }
}
