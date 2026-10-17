/**
 * PHÉP KIỂM OV-14a (audit 17/10) — lưu chắc chắn, không mất chữ:
 *  F01 · ô Góp ý: gõ thêm khi đang lưu → chữ mới không bị ghi đè, lưu tiếp; chỉ "Đã lưu" khi chữ đang có = chữ máy chủ nhận
 *  F03 · lưu Góp ý xong → quên bản vừa xem mọi đường `/classes/{id}/gop-y` (có / không `?tuan=`)
 *  F04 · phản hồi xem trước cũ về sau không đè bản mới
 *  F05 · Sửa cả lớp: dòng đổi email cho nhau vào CÙNG lô; nhóm > lô thì xem trước báo
 *  F06 · useApi: đường A → null, phản hồi A về sau không đặt lại dữ liệu
 *  F09 · tải nền gặp 401 → báo hết phiên (tải lại phiên), không toast "Chưa tải lại được"
 *  F10 · HTTP 200 mà thân không phải JSON → lỗi, không trả HTML như dữ liệu
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv14aTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, addDays } = t;
  const api = await import('../../../web/src/lib/api.ts');
  const ua: any = await import('../../../web/src/lib/useApi.ts');
  const lc: any = await import('../../../web/src/lib/luuChac.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const scl: any = await import('../classes/suaCaLop.ts');
  console.log('\nOV-14a · Lưu chắc chắn, không mất chữ');

  const xong = () => new Promise((r) => setTimeout(r, 0));
  /** Lời hứa tự trả bằng tay — điều khiển thứ tự phản hồi. */
  const hua = <T,>() => { let tra!: (v: T) => void; const p = new Promise<T>((r) => { tra = r; }); return { p, tra }; };

  await checkAsync('OV-14a F01 · gõ B khi đang lưu A (rời ô lần 2): A về → không báo xong, lưu tiếp B; cuối cùng "Đã lưu" với chữ B', async () => {
    const gui: { v: string | null; h: ReturnType<typeof hua<string | null>> }[] = [];
    const tt: string[] = [];
    const o = lc.taoOLuu('', (v: string | null) => { const h = hua<string | null>(); gui.push({ v, h }); return h.p; }, (x: string) => tt.push(x));
    o.go('A');
    const p1 = o.luu();
    o.go('AB');
    void o.luu();
    assert(gui.length === 1, `gửi chồng ${gui.length} lần`);
    gui[0].h.tra(null);
    await xong();
    assert(!tt.includes('xong'), `báo xong khi chữ đang có (AB) chưa lưu: ${tt}`);
    assert(gui.length === 2 && gui[1].v === 'AB', `không lưu tiếp bản mới: ${JSON.stringify(gui.map((g) => g.v))}`);
    gui[1].h.tra(null);
    await p1;
    await xong();
    assert(tt[tt.length - 1] === 'xong' && !o.chuaLuu() && o.nhap() === 'AB', `cuối: ${tt} · ${o.nhap()}`);
  });

  await checkAsync('OV-14a F01 · gõ B khi đang lưu A (chưa rời ô): A về → giữ B, còn "chưa lưu"; bản máy chủ A về không ghi đè B', async () => {
    let h = hua<string | null>();
    const tt: string[] = [];
    const o = lc.taoOLuu('', () => h.p, (x: string) => tt.push(x));
    o.go('A');
    const p = o.luu();
    o.go('AB');
    h.tra(null);
    await p;
    assert(o.chuaLuu() && o.nhap() === 'AB' && tt[tt.length - 1] !== 'xong', `${o.nhap()} · ${tt}`);
    assert(o.nhanGoc('A') === null && o.nhap() === 'AB', 'bản máy chủ ghi đè chữ đang gõ');
    h = hua<string | null>();
    const p2 = o.luu();
    h.tra('');
    await p2;
    assert(tt[tt.length - 1] === 'loi' && o.chuaLuu() && o.nhap() === 'AB', `lỗi mạng: ${tt} · ${o.nhap()}`);
  });

  check('OV-14a F01 · chưa gõ gì: bản máy chủ mới thì nhận', () => {
    const o = lc.taoOLuu('cu', async () => null, () => {});
    assert(o.nhanGoc('moi') === 'moi' && o.nhap() === 'moi' && !o.chuaLuu(), 'không nhận bản máy chủ khi chưa gõ');
  });
  await checkAsync('OV-14a F01 · lưu "A" xong, gõ thêm dấu cách → bản máy chủ "A" về không cắt chữ đang gõ', async () => {
    const o = lc.taoOLuu('', async () => null, () => {});
    o.go('A');
    await o.luu();
    o.go('A ');
    assert(o.nhanGoc('A') === null && o.nhap() === 'A ', `chữ bị cắt: "${o.nhap()}"`);
  });

  check('OV-14a F04 · hai lần xem trước, phản hồi lần 1 về SAU lần 2 → bị bỏ', () => {
    const bat = lc.taoLuot();
    const lan1 = bat();
    const lan2 = bat();
    assert(!lan1() && lan2(), 'phản hồi cũ vẫn được nhận');
  });

  /* fetch giả chờ tay (như prCache). */
  const goc = globalThis.fetch;
  let cho: { url: string; tra: (r: Partial<Response>) => void }[] = [];
  globalThis.fetch = ((url: string) => new Promise((res) => { cho.push({ url, tra: (r) => res(r as Response) }); })) as typeof fetch;
  const traJson = (path: string, body: unknown, status = 200) => {
    const i = cho.findIndex((c) => c.url === `/api${path}`);
    assert(i >= 0, `không có lời gọi đang chờ ${path}`);
    cho.splice(i, 1)[0].tra({ ok: status < 400, status, text: async () => JSON.stringify(body) });
  };
  const soGoi = (path: string) => cho.filter((c) => c.url === `/api${path}`).length;
  const bo = () => {
    const log = { data: [] as unknown[], err: [] as unknown[], reload: 0 };
    return { log, b: {
      latest: { current: 0 }, currentPath: { current: null as string | null }, coDuLieu: { current: false },
      setData: (d: unknown) => log.data.push(d), setFetching: () => {}, setError: (e: unknown) => log.err.push(e), reload: () => { log.reload += 1; },
    } };
  };

  try {
    await checkAsync('OV-14a F06 · useApi đường A → null: phản hồi A về sau không đặt lại dữ liệu', async () => {
      api.invalidateAll(); cho = [];
      const { log, b } = bo();
      ua.batDauTai('/ov14a/a', b);
      ua.batDauTai(null, b);
      traJson('/ov14a/a', { v: 'A' });
      await xong(); await xong();
      assert(!log.data.some((d: any) => d?.v === 'A'), `dữ liệu A sống lại: ${JSON.stringify(log.data)}`);
    });

    await checkAsync('OV-14a F09 · tải nền gặp 401 → báo hết phiên, không toast "Chưa tải lại được"; 403 vẫn như cũ', async () => {
      api.invalidateAll(); cho = [];
      let het = 0, toast = 0;
      const bo1 = ua.onHetPhien(() => { het += 1; });
      const bo2 = ua.onLoiTaiLai(() => { toast += 1; });
      try {
        const x = bo(); x.b.coDuLieu.current = true;
        ua.batDauTai('/ov14a/401', x.b);
        traJson('/ov14a/401', { error: 'Chưa đăng nhập.' }, 401);
        await xong(); await xong();
        assert(het === 1 && toast === 0, `401: hết phiên ${het}, toast ${toast}`);
        const y = bo(); y.b.coDuLieu.current = true;
        ua.batDauTai('/ov14a/403', y.b);
        traJson('/ov14a/403', { error: 'Không có quyền.' }, 403);
        await xong(); await xong();
        assert(het === 1 && toast === 1, `403: hết phiên ${het}, toast ${toast}`);
      } finally { bo1(); bo2(); }
    });

    await checkAsync('OV-14a F03 · quên bản vừa xem Góp ý của lớp (có / không ?tuan=) → vào lại gọi máy chủ; đường khác giữ', async () => {
      api.invalidateAll(); cho = [];
      const ds = ['/classes/77/gop-y', '/classes/77/gop-y?tuan=2026-09-07', '/classes/77/roster'];
      const p = ds.map((d) => ua.taiVaNho(d));
      ds.forEach((d) => traJson(d, { d }));
      await Promise.all(p);
      ua.quenBanXem('/classes/77/gop-y');
      ds.forEach((d) => ua.taiTruoc(d));
      assert(soGoi(ds[0]) === 1 && soGoi(ds[1]) === 1, 'bản cũ của Góp ý vẫn được dùng');
      assert(soGoi(ds[2]) === 0, 'xoá nhầm đường khác');
      cho = [];
    });

    await checkAsync('OV-14a F10 · HTTP 200 thân HTML → lỗi an toàn (không HTML); 204 rỗng vẫn trả null', async () => {
      globalThis.fetch = (async () => ({ ok: true, status: 200, text: async () => '<!doctype html><html><body>index</body></html>' } as Response)) as typeof fetch;
      let e: any = null, kq: any = 'chua';
      try { kq = await api.api.get('/ov14a/html200'); } catch (x) { e = x; }
      assert(e instanceof api.ApiError && !/</.test(e.message), `HTML200: kq ${JSON.stringify(kq)} · lỗi ${e?.message}`);
      globalThis.fetch = (async () => ({ ok: true, status: 204, text: async () => '' } as Response)) as typeof fetch;
      assert((await api.api.del('/ov14a/204')) === null, '204 rỗng không trả null');
    });
  } finally {
    globalThis.fetch = goc;
    api.invalidateAll();
  }

  /* ---------------- F05 · Sửa cả lớp: lô theo email ---------------- */
  check('OV-14a F05 · 9 dòng, dòng 1 ↔ dòng 9 đổi email cho nhau → cùng một lô; mỗi lô ≤ 8; nhóm 9 em vòng quanh → báo', () => {
    const cu = new Map<number, string>(Array.from({ length: 9 }, (_, i) => [i + 1, `e${i + 1}@x.vn`]));
    const rows = Array.from({ length: 9 }, (_, i) => ({ studentId: i + 1, fullName: `Em ${i + 1}` })) as any[];
    rows[0].email = 'e9@x.vn';
    rows[8].email = 'E1@x.vn';
    const { lo, qua } = dm.chiaLoSuaCaLop(rows, (sid: number) => cu.get(sid) ?? null);
    assert(lo.every((l: any[]) => l.length <= dm.LO_LUU_SUA_CA_LOP), `lô quá cỡ: ${lo.map((l: any[]) => l.length)}`);
    assert(lo.some((l: any[]) => l.some((r: any) => r.studentId === 1) && l.some((r: any) => r.studentId === 9)), `1 và 9 khác lô: ${JSON.stringify(lo.map((l: any[]) => l.map((r: any) => r.studentId)))}`);
    assert(lo.flat().length === 9 && !qua.length, 'mất / thừa dòng');
    /* Vòng 9 em: em i lấy email em i+1. */
    const vong = Array.from({ length: 9 }, (_, i) => ({ studentId: i + 1, email: `e${(i + 1) % 9 + 1}@x.vn` }));
    assert(dm.chiaLoSuaCaLop(vong, (sid: number) => cu.get(sid) ?? null).qua.length === 9, 'vòng 9 em không báo');
  });

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a)[0] as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const start = addDays(week.mondayOf(TODAY), -14);
  const lop = intake.createClass(P.admin, { code: 'MB OV14A', branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
  const ids = intake.commitIntake(P.admin, { classId: lop, idempotencyKey: 'ov14a-9',
    rows: Array.from({ length: 9 }, (_, i) => ({ fullName: `Ov Mười Bốn ${i + 1}`, email: `ov14a.${i + 1}@pisa.vn`, target: 6.5 })) }).studentIds as number[];

  check('OV-14a F05 · qua máy chủ: 9 em đổi email vòng quanh → xem trước báo lỗi ô Email từng em (giới hạn một lần lưu)', () => {
    const rows = ids.map((id, i) => ({ studentId: id, email: `ov14a.${(i + 1) % 9 + 1}@pisa.vn` }));
    const xt = scl.xemTruocSuaCaLop(P.admin, lop, { rows });
    assert(xt.rows.every((x: any) => x.issues.some((i: any) => i.field === 'email' && i.muc === 'loi' && /tối đa 8/.test(i.message))), JSON.stringify(xt.rows.map((x: any) => x.issues)));
  });
  check('OV-14a F05 · qua máy chủ: 9 em, em đầu ↔ em cuối đổi email, 7 em đổi tên → xem trước đạt, lưu theo lô đạt', () => {
    const rows: any[] = ids.map((id, i) => ({ studentId: id, fullName: `Ov Mười Bốn ${i + 1} mới` }));
    rows[0].email = 'ov14a.9@pisa.vn';
    rows[8].email = 'ov14a.1@pisa.vn';
    const xt = scl.xemTruocSuaCaLop(P.admin, lop, { rows });
    assert(xt.rows.every((x: any) => !x.issues.some((i: any) => i.muc === 'loi')), JSON.stringify(xt.rows.filter((x: any) => x.issues.length)));
    const emailCu = new Map(ids.map((id, i) => [id, `ov14a.${i + 1}@pisa.vn`]));
    const { lo } = dm.chiaLoSuaCaLop(rows, (sid: number) => emailCu.get(sid) ?? null);
    lo.forEach((l: any[], i: number) => scl.luuSuaCaLop(P.admin, lop, { rows: l, idempotencyKey: `ov14a-lo-${i}` }));
    const e = (id: number) => one('SELECT email FROM students WHERE id = ?', id).email;
    assert(e(ids[0]) === 'ov14a.9@pisa.vn' && e(ids[8]) === 'ov14a.1@pisa.vn', `${e(ids[0])} · ${e(ids[8])}`);
  });

}
