/**
 * VIEC-NHO-2 (08/10, mockup `thiet-ke/mockup-viec-sau-deploy-2026-10-08.html` phần 1, 2, 4):
 *  1. Công việc › Hỗ trợ học viên › "Của GV (nhắc)": "Nhắc tất cả (n)" — `POST /my-work/nhac-nhieu` dùng lõi `nhacViecNhieu` (PR-NV).
 *  2. Chờ duyệt: nhóm Trạng thái đứng đầu, nhóm Loại giữ chỗ và mờ khi ở Nhắc việc (phương án A).
 *  4. "GV chấm S": điện thoại thành hàng rõ dưới chip; Điểm theo lớp (xem theo MT) cũng có, nhớ theo lớp × MT.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrViecNho2Tests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const nv: any = await import('../worklist/nhacViec.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  console.log('\nVIEC-NHO-2 · Nhắc tất cả ở "Của GV", lọc Chờ duyệt đứng yên, GV chấm S');

  /* ---------------------------------------------------------------- 1. Nhắc tất cả (domain) */
  check('VN2-1a · lapNhacTatCa: chỉ việc có nút Nhắc chưa nhắc hôm nay; bỏ qua đếm riêng; GV nhiều việc trước; trần 50', () => {
    const v = (key: string, ownerId: number | null, owner: string | null, daNhacLuc: string | null = null) =>
      ({ key, owner, nhac: ownerId ? { ownerId, daNhacLuc } : null });
    const ds = [v('a', 1, 'An'), v('b', 2, 'Bình'), v('c', 2, 'Bình'), v('d', 3, 'Chi', '2026-09-14T02:00:00Z'), v('e', null, null), v('f', 2, 'Bình')];
    const r = d.lapNhacTatCa(ds);
    assert(r.gui.map((x: any) => x.key).join() === 'a,b,c,f', `gửi: ${r.gui.map((x: any) => x.key)}`);
    assert(r.boQua === 1, `bỏ qua: ${r.boQua}`);
    assert(JSON.stringify(r.gv) === JSON.stringify([{ ownerId: 2, ten: 'Bình', so: 3 }, { ownerId: 1, ten: 'An', so: 1 }]), `gv: ${JSON.stringify(r.gv)}`);
    const nhieu = Array.from({ length: 60 }, (_, i) => v(`k${i}`, 1 + (i % 7), `GV ${1 + (i % 7)}`));
    const r2 = d.lapNhacTatCa(nhieu);
    assert(r2.tong === 60 && r2.gui.length === d.TRAN_HANG_LOAT && r2.gv.reduce((s: number, g: any) => s + g.so, 0) === 50, `trần: ${r2.tong}/${r2.gui.length}`);
  });

  /* ---------------------------------------------------------------- 1. Nhắc tất cả (máy chủ, qua HTTP thật) */
  const httpApp = createApp().listen(0);
  /* Giữa hai lượt gọi có `myWork()` đồng bộ của QL (vài giây): quá 5 s giữ kết nối mặc định thì máy chủ đóng đúng lúc fetch kế tiếp ghi → ECONNRESET. */
  httpApp.keepAliveTimeout = 120_000;
  const port = (httpApp.address() as any).port as number;
  const goi = async (userId: number, url: string, body: unknown) => {
    const res = await fetch(`http://127.0.0.1:${port}/api${url}`, {
      method: 'POST', headers: { 'content-type': 'application/json', cookie: `pisa_demo_session=${createSession(userId)}` }, body: JSON.stringify(body),
    });
    let json: any = null;
    try { json = await res.json(); } catch { /* không thân */ }
    return { status: res.status, json };
  };
  const homNay = `nhac:%:${TODAY}`;
  const xoaNhac = () => conn.prepare(`DELETE FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).run(homNay);
  const soNhac = () => (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind = 'nhac_viec' AND dedup_key LIKE ?`).get(homNay) as any).n as number;
  /** Việc "Của GV" của một QL, có nút Nhắc (chưa nhắc hôm nay sau `xoaNhac`). */
  const viecCuaGv = (q: any) => (mywork.myWork(q, { nguoi: 'tat-ca' }).items as any[]).filter((it) => it.nhac);

  try {
    await checkAsync('VN2-1b · POST /my-work/nhac-nhieu (QL): mọi việc của ≥ 2 GV nhắc một lần, đúng chuông; gọi lại cùng ngày → moi=false, không thêm chuông', async () => {
      xoaNhac();
      const ds = viecCuaGv(P.mbManager);
      const lo = d.lapNhacTatCa(ds).gui.slice(0, 12);
      assert(new Set(lo.map((x: any) => x.nhac.ownerId)).size >= 2, `cần việc của ≥ 2 GV: ${lo.length}`);
      const viec = lo.map((x: any) => ({ key: x.key, ownerId: x.nhac.ownerId }));
      const r = await goi(P.mbManager.userId, '/my-work/nhac-nhieu', { viec });
      assert(r.status === 200, `${r.status} ${JSON.stringify(r.json)}`);
      assert(r.json.loi.length === 0 && r.json.ok.length === viec.length && r.json.ok.every((x: any) => x.moi && x.daNhacLuc), JSON.stringify(r.json).slice(0, 400));
      for (const x of viec) {
        const tb = conn.prepare(`SELECT id FROM notifications WHERE user_id = ? AND dedup_key = ?`).get(x.ownerId, `nhac:${x.key}:${TODAY}`);
        assert(tb, `thiếu chuông ${x.ownerId} ${x.key}`);
      }
      const khoa = (x: any) => `${x.ownerId}|${x.key}`;
      assert(r.json.ok.map(khoa).sort().join() === viec.map(khoa).sort().join(), 'ok phải mang đúng key + ownerId đã gửi');
      const n = soNhac();
      const r2 = await goi(P.mbManager.userId, '/my-work/nhac-nhieu', { viec });
      assert(r2.status === 200 && r2.json.ok.length === viec.length && r2.json.ok.every((x: any) => !x.moi), JSON.stringify(r2.json).slice(0, 300));
      assert(soNhac() === n, 'nhắc lại cùng ngày không được thêm chuông');
    });

    await checkAsync('VN2-1c · quyền và dữ liệu nhập: GV → 403; rỗng / 51 việc / dòng hỏng → 400; khoá bịa → lỗi 404 riêng dòng đó; QL chi nhánh khác → lỗi 403 từng dòng', async () => {
      xoaNhac();
      const ds = viecCuaGv(P.mbManager);
      const mot = { key: ds[0].key, ownerId: ds[0].nhac.ownerId };
      const gv = await goi(mot.ownerId, '/my-work/nhac-nhieu', { viec: [mot] });
      assert(gv.status === 403, `GV: ${gv.status}`);
      for (const viec of [[], Array.from({ length: 51 }, (_, i) => ({ key: `score:x${i}`, ownerId: mot.ownerId })), [{ key: '', ownerId: 1 }], [{ key: 'a', ownerId: 'x' }], 'abc', [null]]) {
        const r = await goi(P.mbManager.userId, '/my-work/nhac-nhieu', { viec });
        assert(r.status === 400, `${JSON.stringify(viec).slice(0, 40)} → ${r.status}`);
      }
      const r = await goi(P.mbManager.userId, '/my-work/nhac-nhieu', { viec: [mot, { key: 'score:bia-khong-ton-tai', ownerId: mot.ownerId }] });
      assert(r.status === 200 && r.json.ok.length === 1 && r.json.loi.length === 1 && r.json.loi[0].ma === 404 && r.json.loi[0].key === 'score:bia-khong-ton-tai', JSON.stringify(r.json));
      xoaNhac();
      const cp = await goi(P.cpManager.userId, '/my-work/nhac-nhieu', { viec: [mot] });
      assert(cp.status === 200 && cp.json.ok.length === 0 && cp.json.loi[0]?.ma === 403, `QL CP: ${cp.status} ${JSON.stringify(cp.json)}`);
      assert(soNhac() === 0, 'QL chi nhánh khác không được gửi chuông');
    });

    check(`VN2-1d · Nhắc tất cả ${d.TRAN_HANG_LOAT} việc "Của GV" (Quản trị, toàn hệ thống) ≤ ${TRAN_GHI_LO.nhacTatCaCuaGv} câu SQL`, () => {
      xoaNhac();
      const lo = d.lapNhacTatCa(viecCuaGv(P.admin)).gui;
      const soGv = new Set(lo.map((x: any) => x.nhac.ownerId)).size;
      const a = soCauSql();
      const r = nv.nhacViecLo(P.admin, lo.map((x: any) => ({ key: x.key, ownerId: x.nhac.ownerId })));
      const n = soCauSql() - a;
      console.log('VN2-1d số câu', JSON.stringify({ viec: lo.length, soGv, n, ok: r.ok.length, loi: r.loi.length }));
      assert(lo.length >= 20 && soGv >= 3, `cần lô lớn: ${lo.length} việc / ${soGv} GV`);
      /* PR-PA (Task 3): việc Kết quả giao người giữ việc, người đó luôn thấy dòng → không còn 404 "mồ côi". */
      assert(r.loi.length === 0 && r.ok.length === lo.length, `lỗi: ${JSON.stringify(r.loi.slice(0, 3))}`);
      assert(n <= TRAN_GHI_LO.nhacTatCaCuaGv, `${n} câu > trần ${TRAN_GHI_LO.nhacTatCaCuaGv}`);
    });
  } finally {
    xoaNhac();
    httpApp.close();
  }

  check('VN2-1e · Công việc › Của GV: nút "Nhắc tất cả" hỏi lại bằng ConfirmDialog, gọi /my-work/nhac-nhieu, đếm bằng lapNhacTatCa', () => {
    const s = doc('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(/lapNhacTatCa\(/.test(s) && /\/my-work\/nhac-nhieu/.test(s) && /<ConfirmDialog/.test(s), 'HoTroHocVienTab chưa có Nhắc tất cả');
    assert(/Nhắc tất cả \(/.test(s) && /việc · \$\{/.test(s), 'chữ nút / tiêu đề hộp chưa đúng mockup');
  });

  /* ---------------------------------------------------------------- 2. Chờ duyệt: hàng lọc đứng yên */
  check('VN2-2 · Chờ duyệt: nhóm Trạng thái đứng trước nhóm Loại; nhóm Loại không bị gỡ khi ở Nhắc việc (mờ, không bấm)', () => {
    const s = doc('web/src/modules/duyet/HopChoDuyet.tsx');
    const tt = s.indexOf('ariaLabel="Trạng thái"'), loai = s.indexOf('ariaLabel="Loại yêu cầu"');
    assert(tt > 0 && loai > tt, 'Trạng thái phải đứng trước Loại');
    assert(!/xem !== 'de-biet' && \(\s*<BoLocDoan ariaLabel="Loại yêu cầu"/.test(s), 'nhóm Loại vẫn bị gỡ ở Nhắc việc');
    assert(/Nhắc việc không chia loại/.test(s), 'thiếu chữ rê chuột của nhóm mờ');
  });

  /* ---------------------------------------------------------------- 4. GV chấm S */
  check('VN2-4a · dotGvCham: có tuần → id tuần (khoá cũ giữ nguyên); xem theo MT (không tuần, một MT) → "mt{n}"; trộn MT → null', () => {
    assert(d.dotGvCham(12, [3, 3]) === '12', `tuần: ${d.dotGvCham(12, [3, 3])}`);
    assert(d.dotGvCham(null, [3, 3]) === 'mt3', `MT: ${d.dotGvCham(null, [3, 3])}`);
    assert(d.dotGvCham(null, [0]) === 'mt0', 'MT0');
    assert(d.dotGvCham(null, [2, 3]) === null && d.dotGvCham(null, []) === null, 'trộn / rỗng');
  });
  check('VN2-4b · lưới FT và màn điện thoại dùng dotGvCham (không còn đòi data.period); điện thoại là hàng "GV chấm S" có viền', () => {
    const luoi = doc('web/src/modules/cham/LuoiFT.tsx'), mot = doc('web/src/modules/cham/MotKyNang.tsx');
    for (const [ten, s] of [['LuoiFT', luoi], ['MotKyNang', mot]]) {
      assert(/dotGvCham\(/.test(s) && !/useGvChamCot\(data\.classId, data\.period\?\.id\)/.test(s), `${ten} còn nhớ theo tuần`);
    }
    assert(/<NutGvCham hang /.test(mot), 'MotKyNang chưa dùng hàng "GV chấm S"');
  });
}
