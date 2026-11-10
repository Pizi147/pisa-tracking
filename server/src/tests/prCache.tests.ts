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

    await checkAsync('GIAM-COMPUTE · badge `chiNghe`: khối khác tải cùng đường → nhận bản đó (0 lời gọi thêm); phản hồi bị vô hiệu giữa chừng → không nhận', async () => {
      batDau();
      const nhan: unknown[] = [];
      const go = ua.ngheBanMoi('/my-work', (d) => nhan.push(d));
      try {
        const p = ua.taiVaNho('/my-work');
        tra('/my-work', { v: 1 });
        await p;
        assert(JSON.stringify(nhan) === JSON.stringify([{ v: 1 }]) && soGoi('/my-work') === 0, `nhận: ${JSON.stringify(nhan)}`);
        const cu = ua.taiVaNho('/my-work');
        api.invalidate('/my-work');
        tra('/my-work', { v: 'cu' });
        await cu;
        assert(nhan.length === 1, 'bản bị vô hiệu giữa chừng vẫn tới badge');
      } finally { go(); }
      ua.taiTruoc('/my-work');
      tra('/my-work', { v: 2 });
      await xong();
      assert(nhan.length === 1, 'đã gỡ mà vẫn nhận');
    });

    await checkAsync('GIAM-COMPUTE · lưu ô điểm: lưới đã tự tải lại SAU lần ghi → hẹn vô hiệu gộp 1,5 s không tải lại lần hai; dùng chung lời gọi bắt đầu TRƯỚC lần ghi → vẫn tải lại', async () => {
      batDau();
      const nghe: [string | null, number | undefined][] = [];
      const go = api.onInvalidate((p: string | null, luc?: number) => { nghe.push([p, luc]); });
      const lam = () => {
        const log = { data: [] as unknown[] };
        return { log, b: {
          latest: { current: 0 }, currentPath: { current: null as string | null }, coDuLieu: { current: false }, banTu: { current: 0 },
          setData: (d: unknown) => log.data.push(d), setFetching: () => {}, setError: () => {}, reload: () => {},
        } };
      };
      try {
        /* (1) ghi → gộp → lưới tự tải lại (lời gọi mới) → hẹn tới: bỏ qua. */
        const truocGhi = Date.now();
        api.invalidateGop('/classes');
        const a = lam();
        ua.batDauTai('/classes/3/cham', a.b);
        tra('/classes/3/cham', { v: 1 });
        await xong(); await xong();
        api.xaGop();
        const [p1, luc1] = nghe.at(-1)!;
        assert(p1 === '/classes' && luc1 !== undefined && luc1 >= truocGhi, `xaGop phải truyền lúc ghi: ${JSON.stringify(nghe)}`);
        assert(a.b.banTu.current >= luc1!, `banTu ${a.b.banTu.current} < lúc ghi ${luc1}`);
        assert(!ua.canTaiLaiKhiVoHieu('/classes/3/cham', p1, luc1, a.b.banTu.current), 'lưới vừa tải sau lần ghi vẫn bị tải lại');
        assert(ua.canTaiLaiKhiVoHieu('/classes/3/cham?periodId=4', p1, luc1, 0), 'lưới khác chưa tải lại phải tải lại');
        assert(ua.canTaiLaiKhiVoHieu('/classes/3/cham', '/classes', undefined, a.b.banTu.current), 'invalidate thường (không gộp) phải tải lại như cũ');
        assert(ua.canTaiLaiKhiVoHieu('/x', null, undefined, Date.now() + 1e6), 'vô hiệu toàn bộ phải tải lại');
        /* (2) khối khác bắt đầu tải TRƯỚC lần ghi; lưới tự tải lại dùng chung lời gọi đó → banTu = lúc lời gọi thật → vẫn tải lại. */
        batDau();
        ua.taiTruoc('/classes/3/cham');
        await new Promise((r) => setTimeout(r, 5));
        api.invalidateGop('/classes');
        const b2 = lam();
        ua.batDauTai('/classes/3/cham', b2.b);
        assert(soGoi('/classes/3/cham') === 1, 'phải dùng chung lời gọi đang bay');
        tra('/classes/3/cham', { v: 'truoc-ghi' });
        await xong(); await xong();
        api.xaGop();
        const [p2, luc2] = nghe.at(-1)!;
        assert(ua.canTaiLaiKhiVoHieu('/classes/3/cham', p2, luc2, b2.b.banTu.current), `bản bắt đầu trước lần ghi bị coi là mới (banTu ${b2.b.banTu.current}, ghi ${luc2})`);
      } finally { go(); }
    });

    await checkAsync('GIAM-COMPUTE · badge henTaiLaiKhiCu: cũ → tải lại MỘT lần sau hạn; bản mới về trước hạn → không; đổi trang → ngay; tab ẩn → chờ tới lúc hiện', async () => {
      const ngu = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let n = 0;
      const h = ua.henTaiLaiKhiCu(() => { n += 1; }, 40);
      h.cu(); h.cu();
      await ngu(70);
      assert(n === 1, `sau hạn: ${n} lần`);
      h.coBan(); h.cu(); h.coBan();
      await ngu(70);
      assert(n === 1, `bản mới về trước hạn vẫn tải lại: ${n}`);
      h.doiTrang();
      assert(n === 1, 'đổi trang khi không cũ vẫn tải lại');
      h.cu(); h.doiTrang();
      assert(n === 2, 'đổi trang khi cũ phải tải lại ngay');
      await ngu(70);
      assert(n === 2, 'đổi trang rồi mà hẹn cũ vẫn chạy');
      /* Tab ẩn: tới hạn không tải; hiện lại → tải một lần. */
      const goc = (globalThis as any).document;
      const nghe = new Set<() => void>();
      const docGia = { hidden: true, addEventListener: (_: string, f: () => void) => nghe.add(f), removeEventListener: (_: string, f: () => void) => nghe.delete(f) };
      (globalThis as any).document = docGia;
      try {
        h.coBan(); h.cu();
        await ngu(70);
        assert(n === 2 && nghe.size === 1, `tab ẩn vẫn tải (${n}) hoặc không chờ hiện (${nghe.size})`);
        docGia.hidden = false;
        [...nghe].forEach((f) => f());
        assert(n === 3 && nghe.size === 0, `hiện lại: ${n} lần, còn ${nghe.size} người nghe`);
      } finally { (globalThis as any).document = goc; h.huy(); }
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
    await checkAsync('HOTFIX-3 (4, 5) · lỗi thân HTML (504 Netlify) → "Lỗi 504 — thử lại", không in HTML; đã có dữ liệu mà tải lại lỗi → giữ dữ liệu, không ErrorState', async () => {
      globalThis.fetch = (async () => ({ ok: false, status: 504, text: async () => '<!doctype html><html><body>Gateway Timeout</body></html>' } as Response)) as typeof fetch;
      let e: any = null;
      try { await api.api.get('/hotfix3/html'); } catch (x) { e = x; }
      assert(e?.status === 504 && e.message === 'Lỗi 504 — thử lại', `câu lỗi: ${e?.message}`);
      assert(ua.loiCanHien({ co: 1 }, e) === null, 'đã có dữ liệu vẫn trả error → trang thay lưới bằng ErrorState');
      assert(ua.loiCanHien(null, e) === e, 'chưa có dữ liệu phải trả error');
    });
  } finally {
    globalThis.fetch = goc;
    api.invalidateAll();
  }
}
