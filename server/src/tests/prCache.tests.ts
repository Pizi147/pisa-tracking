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
          /* Lưới ĐÃ gắn tự tải lại sau khi lưu (cùng đường) — hook mới gắn thì `xaGop(path)` xả gộp ngay (W1), không phải kịch bản này. */
          latest: { current: 0 }, currentPath: { current: '/classes/3/cham' as string | null }, coDuLieu: { current: true }, banTu: { current: 0 },
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

    await checkAsync('AUDIT-1611 BADGE-NHE · henTaiLaiKhiCu hetMs: đổi trang khi bản ≥ hạn → tải; quay lại tab sau ≥ hạn ẩn → tải; chuông mở (moiNeuCu) khi bản ≥ ms → tải', async () => {
      const ngu = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const goc = (globalThis as any).document;
      const nghe = new Set<() => void>();
      const docGia = { hidden: false, addEventListener: (_: string, f: () => void) => nghe.add(f), removeEventListener: (_: string, f: () => void) => nghe.delete(f) };
      (globalThis as any).document = docGia;
      let n = 0;
      const h = ua.henTaiLaiKhiCu(() => { n += 1; }, 1000, 40);
      try {
        h.doiTrang();
        assert(n === 0, 'bản mới mà đổi trang vẫn tải');
        await ngu(60);
        h.doiTrang();
        assert(n === 1, `bản ≥ hạn, đổi trang không tải (${n})`);
        h.coBan();
        h.moiNeuCu(10_000);
        assert(n === 1, 'chuông mở khi bản còn mới vẫn tải');
        await ngu(20); h.moiNeuCu(10);
        assert(n === 2, `chuông mở khi bản ≥ ms không tải (${n})`);
        h.coBan();
        docGia.hidden = true; [...nghe].forEach((f) => f());
        await ngu(60);
        docGia.hidden = false; [...nghe].forEach((f) => f());
        assert(n === 3, `quay lại tab sau ≥ hạn ẩn không tải (${n})`);
        docGia.hidden = true; [...nghe].forEach((f) => f()); docGia.hidden = false; [...nghe].forEach((f) => f());
        assert(n === 3, 'ẩn rất ngắn mà vẫn tải');
      } finally { h.huy(); assert(nghe.size === 0, 'huy() không gỡ người nghe visibilitychange'); (globalThis as any).document = goc; }
      assert(ua.MOI_MY_WORK_MS === 5 * 60_000, 'hạn dùng lại /my-work phải 5 phút');
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

    await checkAsync('S5 · invalidateDung: đúng đường + đường?…; không trúng em khác (/students/30) hay đường con; hook đúng đường tải lại', async () => {
      const k = api.khopTienTo;
      assert(k('/students/3', '/students/3$') && k('/students/3?cycleId=2', '/students/3$'), 'không khớp đúng đường / đường?…');
      assert(!k('/students/30', '/students/3$') && !k('/students/3/skill-board', '/students/3$'), 'trúng em khác / đường con');
      assert(k('/students/30', '/students/3') && k('/students/3/y-thuc', '/students'), 'tiền tố thường đổi nghĩa');
      assert(ua.canTaiLaiKhiVoHieu('/students/3?x=1', '/students/3$', undefined, 0) && !ua.canTaiLaiKhiVoHieu('/students/30', '/students/3$', undefined, 0), 'hook khớp sai');
      batDau();
      for (const p of ['/students/3', '/students/30', '/students/3/skill-board']) { ua.taiTruoc(p); tra(p, { p }); }
      await xong();
      api.invalidateDung('/students/3');
      for (const p of ['/students/3', '/students/30', '/students/3/skill-board']) ua.taiTruoc(p);
      assert(soGoi('/students/3') === 1 && soGoi('/students/30') === 0 && soGoi('/students/3/skill-board') === 0, 'invalidateDung xoá sai bản vừa xem');
      tra('/students/3', {});
      /* Lời gọi đang bay của em khác không bị bỏ (thế hệ theo đúng đường). */
      const y = ua.taiVaNho('/students/31');
      api.invalidateDung('/students/3');
      tra('/students/31', { y: 1 });
      assert((await y) !== null, 'phản hồi em khác bị bỏ');
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
    await checkAsync('TD-QUET · taiTruocGop: một lời gọi gộp cho nhiều đường; phần 200 → bản vừa xem của đường lẻ (0 lời gọi lẻ), phần lỗi → đường đó tự gọi lẻ; đường còn mới không vào bó', async () => {
      batDau();
      ua.taiTruocGop('/classes/7/ho-so', { overview: '/classes/7/overview', roster: '/classes/7/roster' });
      assert(soGoi('/classes/7/ho-so?phan=overview,roster') === 1 && soGoi('/classes/7/overview') === 0 && soGoi('/classes/7/roster') === 0, 'không gộp đúng một lời gọi');
      const dauOv = ua.taiVaNho('/classes/7/overview');   // khối gắn trong lúc bó đang bay: dùng chung lời gọi
      tra('/classes/7/ho-so?phan=overview,roster', { overview: { status: 200, data: { a: 1 } }, roster: { status: 403, error: 'Không có quyền' } });
      assert(JSON.stringify(await dauOv) === JSON.stringify({ d: { a: 1 } }), 'đường lẻ không nhận phần của nó');
      await xong();
      assert(soGoi('/classes/7/roster') === 1, 'phần lỗi phải tự gọi đường lẻ (lỗi hiện như cũ)');
      tra('/classes/7/roster', [{ id: 1 }]);
      assert(JSON.stringify(await ua.taiVaNho('/classes/7/roster')) === JSON.stringify({ d: [{ id: 1 }] }), 'đường lẻ của phần lỗi không nhận bản gọi lẻ');
      ua.taiTruocGop('/classes/7/ho-so', { overview: '/classes/7/overview' });
      assert(soGoi('/classes/7/ho-so?phan=overview') === 0 && soGoi('/classes/7/overview') === 0, 'đường còn mới vẫn vào bó / gọi lại');
    });
    await checkAsync('R3-T4 · gopKhiVoHieu: lưu xong vô hiệu `/classes` (nhiều lần) → các đường ĐANG GẮN tải lại bằng GET ho-so theo bó, đường không gắn / không bị vô hiệu (cases) không vào bó; dữ liệu mới về đúng đường lẻ', async () => {
      batDau();
      const go = [ua.ganDuong('/classes/7/overview'), ua.ganDuong('/classes/7/roster'), ua.ganDuong('/cases?classId=7')];
      const goGop = ua.gopKhiVoHieu('/classes/7/ho-so', [{ overview: '/classes/7/overview', roster: '/classes/7/roster' }, { xetLai: '/classes/7/xet-lai', cases: '/cases?classId=7' }]);
      try {
        api.invalidate('/classes'); api.invalidate('/classes/7/roster'); api.invalidate('/students');
        await Promise.resolve();
        assert(soGoi('/classes/7/ho-so?phan=overview,roster') === 1 && cho.length === 1, `lời gọi: ${cho.map((c) => c.url).join(' ')}`);
        const ov = ua.taiVaNho('/classes/7/overview');   // hook tải lại ở effect sau — dùng chung lời gọi gộp
        tra('/classes/7/ho-so?phan=overview,roster', { overview: { status: 200, data: { v: 'moi' } }, roster: { status: 200, data: [] } });
        assert(JSON.stringify(await ov) === JSON.stringify({ d: { v: 'moi' } }) && cho.length === 0, 'đường lẻ không nhận bản mới của bó');
        api.invalidate('/students');
        await Promise.resolve();
        assert(cho.length === 0, 'vô hiệu không trúng đường của bó vẫn gọi ho-so');
      } finally { goGop(); go.forEach((f) => f()); }
    });
    await checkAsync('R3-T3 · taiTruocGop tuy: phần 204 (máy chủ bỏ) mà không khối nào gắn → không gọi lẻ, không bản vừa xem; khối đang gắn → gọi lẻ như cũ', async () => {
      batDau();
      const go = ua.ganDuong('/classes/9/xet-lai');
      try {
        ua.taiTruocGop('/classes/9/ho-so', { xetLai: '/classes/9/xet-lai', viecCuaToi: '/classes/9/viec-theo-em?chi=toi', cases: '/cases?classId=9' }, true);
        assert(soGoi('/classes/9/ho-so?phan=xetLai,viecCuaToi,cases&tuy=1') === 1, `lời gọi: ${cho.map((c) => c.url).join(' ')}`);
        tra('/classes/9/ho-so?phan=xetLai,viecCuaToi,cases&tuy=1', { xetLai: { status: 204 }, viecCuaToi: { status: 204 }, cases: { status: 200, data: { rows: [] } } });
        await xong(); await xong();
        assert(soGoi('/classes/9/viec-theo-em?chi=toi') === 0 && soGoi('/classes/9/xet-lai') === 1, `gọi lẻ sai: ${cho.map((c) => c.url).join(' ')}`);
        ua.taiTruoc('/classes/9/viec-theo-em?chi=toi');
        assert(soGoi('/classes/9/viec-theo-em?chi=toi') === 1, 'phần bị bỏ vẫn có bản vừa xem');
        cho = [];
      } finally { go(); }
    });
    await checkAsync('R3-T5 · lamMoiYThucCua: thao tác Ý thức của lớp 7 / em 3 → bản vừa xem của y-thuc lớp 7, em 3, /my-work bị xoá (tải mới); lớp / em khác giữ nguyên', async () => {
      const kieu = await import('../../../web/src/modules/yThuc/kieu.ts');
      batDau();
      const ds = ['/classes/7/y-thuc', '/classes/7/viec-theo-em?chi=toi', '/classes/8/y-thuc', '/students/3', '/students/3/y-thuc', '/students/4/y-thuc', '/my-work', '/classes'];
      for (const p of ds) { ua.taiTruoc(p); tra(p, { p }); }
      await xong();
      kieu.lamMoiYThucCua({ classId: 7, studentIds: [3] });
      for (const p of ds) ua.taiTruoc(p);
      const moi = ds.filter((p) => soGoi(p) === 1);
      assert(JSON.stringify(moi) === JSON.stringify(['/classes/7/y-thuc', '/classes/7/viec-theo-em?chi=toi', '/students/3', '/students/3/y-thuc', '/my-work', '/classes']), `tải lại: ${moi.join(' ')}`);
      cho = [];
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
