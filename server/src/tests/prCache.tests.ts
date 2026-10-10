/** PHÉP KIỂM PR-CACHE — F01 + F04: phản hồi bắt đầu TRƯỚC một lần xoá (đổi tài khoản / ghi) không được ghi vào bản vừa xem. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrCacheTests(t: YThucTestKit) {
  const { checkAsync, assert } = t;
  const api = await import('../../../web/src/lib/api.ts');
  const ua = await import('../../../web/src/lib/useApi.ts');
  console.log('\nPR-CACHE · Bản vừa xem không sống lại sau đổi tài khoản / ghi');

  /* fetch giả: mỗi lời gọi chờ tới khi phép kiểm tự trả — điều khiển thứ tự Promise. */
  const goc = globalThis.fetch;
  let cho: { url: string; tra: (body: unknown) => void }[] = [];
  globalThis.fetch = ((url: string) => new Promise((res) => {
    cho.push({ url, tra: (body) => res({ ok: true, status: 200, text: async () => JSON.stringify(body) } as Response) });
  })) as typeof fetch;
  const tra = (path: string, body: unknown) => {
    const i = cho.findIndex((c) => c.url === `/api${path}`);
    assert(i >= 0, `không có lời gọi đang chờ ${path}`);
    cho.splice(i, 1)[0].tra(body);
  };
  const soGoi = (path: string) => cho.filter((c) => c.url === `/api${path}`).length;
  const xong = () => new Promise((r) => setTimeout(r, 0));
  const batDau = () => { api.invalidateAll(); cho = []; };

  try {
    await checkAsync('PR-CACHE (F01) · tài khoản A đang tải → đổi tài khoản → phản hồi của A về: không vào bản vừa xem, B tải lại', async () => {
      batDau();
      const a = ua.taiVaNho('/cache/f01');
      api.invalidateAll();
      tra('/cache/f01', { cua: 'A' });
      assert((await a) === null, 'phản hồi của A vẫn được nhận');
      ua.taiTruoc('/cache/f01');
      assert(soGoi('/cache/f01') === 1, 'B dùng lại bản của A, không gọi máy chủ');
      tra('/cache/f01', { cua: 'B' });
      assert(JSON.stringify(await ua.taiVaNho('/cache/f01')) === JSON.stringify({ d: { cua: 'B' } }), 'B không nhận bản của B');
    });

    await checkAsync('PR-CACHE (F04) · tải trước → lưu → invalidate tiền tố → phản hồi cũ về: không sống lại bản cũ', async () => {
      batDau();
      ua.taiTruoc('/cases/9');
      api.invalidate('/cases');
      tra('/cases/9', { v: 'cu' });
      await xong();
      ua.taiTruoc('/cases/9');
      assert(soGoi('/cases/9') === 1, 'bản cũ được dùng lại 10 s, không gọi lại máy chủ');
      tra('/cases/9', { v: 'moi' });
      await xong();
    });

    await checkAsync('PR-CACHE · hai hook cùng đường dùng chung MỘT lời gọi, cả hai nhận dữ liệu; vào lại thì dùng bản vừa xem', async () => {
      batDau();
      const h1 = ua.taiVaNho('/cache/chung');
      const h2 = ua.taiVaNho('/cache/chung');
      assert(soGoi('/cache/chung') === 1, 'gọi máy chủ hai lần');
      tra('/cache/chung', { n: 1 });
      assert((await h1)?.d && (await h2)?.d, 'một hook không nhận dữ liệu');
      ua.taiTruoc('/cache/chung');
      assert(soGoi('/cache/chung') === 0, 'không dùng bản vừa xem');
    });

    await checkAsync('PR-CACHE · ghi trúng tiền tố KHÁC không làm mất phản hồi của đường không liên quan', async () => {
      batDau();
      const y = ua.taiVaNho('/cache/y');
      api.invalidate('/cache/x');
      tra('/cache/y', { y: 1 });
      assert((await y) !== null, 'phản hồi đường không liên quan bị bỏ');
      ua.taiTruoc('/cache/y');
      assert(soGoi('/cache/y') === 0, 'bản vừa xem của đường không liên quan bị bỏ');
    });

    await checkAsync('PR-CACHE · đường gần tĩnh (cachedGet): invalidate tiền tố lúc đang tải → không giữ bản cũ', async () => {
      batDau();
      const p = api.cachedGet('/ref/periods');
      api.invalidate('/ref');
      tra('/ref/periods', ['cu']);
      await p;
      const q = api.cachedGet('/ref/periods');
      assert(soGoi('/ref/periods') === 1, 'cachedGet giữ bản cũ sau invalidate');
      tra('/ref/periods', ['moi']);
      await q;
    });
  } finally {
    globalThis.fetch = goc;
    api.invalidateAll();
  }
}
