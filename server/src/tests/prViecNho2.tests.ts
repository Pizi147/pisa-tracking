/**
 * VIEC-NHO-2 (08/10, mockup `thiet-ke/mockup-viec-sau-deploy-2026-10-08.html` phần 1, 2, 4):
 *  1. (OV-12h bỏ hẳn Nhắc — phép kiểm Nhắc tất cả đã gỡ.)
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
  const mywork: any = await import('../worklist/mywork.ts');
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  console.log('\nVIEC-NHO-2 · Nhắc tất cả ở "Của GV", lọc Chờ duyệt đứng yên, GV chấm S');

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
  } finally {
    xoaNhac();
    httpApp.close();
  }

  /* ---------------------------------------------------------------- 2. Chờ duyệt: hàng lọc đứng yên */
  /* AUDIT-UI B6 (chủ SP 08/11, mockup `.hang-loc`): hộp duyệt là tab — MỘT hàng chip: loại phải quyết (đứng yên kể cả số 0) · vạch · Báo QL · Đã xử lý · Lớp ▾. */
  check('VN2-2 · Chờ bạn duyệt: hàng lọc đứng yên — chip loại luôn vẽ (cả ở Báo QL), rồi Báo QL, Đã xử lý · 30 ngày, Lớp', () => {
    const s = doc('web/src/modules/duyet/HopChoDuyet.tsx');
    const loai = s.indexOf('PHAN_LOAI_CAN_QUYET.map((k)'), bao = s.indexOf("{t('Báo QL')}"), xl = s.indexOf("{t('Đã xử lý · 30 ngày')}"), lop = s.indexOf("aria-label={t('Lọc theo lớp')}");
    assert(loai > 0 && loai < bao && bao < xl && xl < lop, 'thứ tự hàng lọc');
    assert(!/xem !== 'de-biet' && \(\s*\[\{ key: 'tat-ca'/.test(s), 'chip loại bị gỡ ở Báo QL');
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
