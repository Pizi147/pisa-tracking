/**
 * PHÉP KIỂM PR-TD2-b+c — Trước/Sau không tải cả danh sách; web bớt request trùng và waterfall.
 * (b) Đường nhẹ cho danh sách dự phòng phải trả ĐÚNG tập + thứ tự của đường nặng cũ (`/hoc-vien-lop`, roster).
 * (c) Luật nguồn phía web (không chạy được React ở đây): `/yeu-cau/dem` không gọi lại mỗi lần đổi trang, tải trước hồ sơ lớp, v.v.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrTd2bcTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { danhSachHocVienLop, idsHocVienLop } = await import('../classes/hocVienLop.ts');
  const { classRoster, rosterIds } = await import('../classes/classes.ts');
  const REPO = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const nguon = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
  console.log('\nPR-TD2-b+c · Trước/Sau nhẹ, bớt request trùng');

  const vai = Object.entries(P as Record<string, any>);

  check('TD2-b · /hoc-vien-lop/ids = (id, scoringMode) của /hoc-vien-lop mặc định, cùng thứ tự — mọi vai', () => {
    for (const [ten, p] of vai) {
      const nang = danhSachHocVienLop(p).rows.map((r) => ({ id: r.id, scoringMode: r.scoringMode ?? null }));
      const nhe = idsHocVienLop(p).rows;
      assert(JSON.stringify(nhe) === JSON.stringify(nang), `${ten}: ${JSON.stringify(nhe)} ≠ ${JSON.stringify(nang)}`);
    }
  });

  check('TD2-b · roster?chiId=1 = (id, fullName, archived) của roster đầy đủ, cùng thứ tự, cùng luật quyền — lớp đang học và lớp đã kết thúc', () => {
    const lops = (conn.prepare(`SELECT id FROM classes ORDER BY status = 'finished' DESC, id`).all() as any[]).map((r) => r.id as number);
    const ketThuc = (conn.prepare(`SELECT id FROM classes WHERE status = 'finished' LIMIT 1`).get() as any)?.id;
    let soLanSo = 0;
    for (const [ten, p] of vai) {
      for (const cid of [...lops.slice(0, 4), ...(ketThuc ? [ketThuc] : [])]) {
        let loiNang: any = null; let loiNhe: any = null; let nang: any[] = []; let nhe: any[] = [];
        try { nang = classRoster(p, cid).map((r: any) => ({ id: r.id, fullName: r.fullName, archived: r.archived })); } catch (e) { loiNang = e; }
        try { nhe = rosterIds(p, cid); } catch (e) { loiNhe = e; }
        assert((loiNang?.status ?? 0) === (loiNhe?.status ?? 0), `${ten} lớp ${cid}: lỗi khác nhau ${loiNang?.status} / ${loiNhe?.status}`);
        assert(JSON.stringify(nhe) === JSON.stringify(nang), `${ten} lớp ${cid}: ${JSON.stringify(nhe).slice(0, 200)}`);
        if (!loiNang) soLanSo += 1;
      }
    }
    assert(soLanSo > 5, `quá ít lần so: ${soLanSo}`);
  });

  check('TD2-b · web: danh sách dự phòng Trước/Sau dùng đường nhẹ (không /hoc-vien-lop đầy đủ, không roster đầy đủ)', () => {
    const lop = nguon('web/src/modules/classes/DauTrangLop.tsx');
    assert(lop.includes(`'/hoc-vien-lop/ids'`) && !/api\.get<[^>]*>\('\/hoc-vien-lop'\)/.test(lop), 'DauTrangLop còn gọi /hoc-vien-lop');
    const hv = nguon('web/src/modules/students/StudentDetailPage.tsx');
    assert(hv.includes('/roster?chiId=1`') && !/\/roster`\)/.test(hv), 'StudentDetailPage còn gọi roster đầy đủ');
  });

  check('TD2-c · web: /yeu-cau/dem không gọi lại mỗi lần đổi trang (bản cũ > 60 s mới gọi)', () => {
    const app = nguon('web/src/App.tsx');
    assert(!/'\/yeu-cau\/dem'[^\n]*\[location\.pathname\]/.test(app), 'App.tsx còn deps [location.pathname] cho /yeu-cau/dem');
    assert(/60_000/.test(app), 'thiếu ngưỡng 60 s');
  });

  check('TD2-c · web: tải trước song song ở hồ sơ lớp; skill-board không chờ hồ sơ HV; /ref tĩnh dùng cachedGet; useApi dùng lại bản vừa tải', () => {
    const lop = nguon('web/src/modules/classes/ClassOverviewPage.tsx');
    assert(/taiTruoc\(`\/classes\/\$\{classId\}\/roster`\)/.test(lop) && /taiTruoc\(duongDiemTheoLuot\(/.test(lop), 'ClassOverviewPage chưa tải trước roster + diem-theo-luot');
    const hv = nguon('web/src/modules/students/StudentDetailPage.tsx');
    assert(hv.includes('`/students/${id}/skill-board`'), 'skill-board vẫn phải chờ /students/:id');
    const ua = nguon('web/src/lib/useApi.ts');
    assert(/export function taiTruoc/.test(ua) && /cachedGet/.test(ua) && /'\/ref\/branches'/.test(ua) && /'\/ref\/periods'/.test(ua), 'useApi.ts thiếu taiTruoc / cachedGet cho /ref');
    assert(/MOI_MS/.test(ua), 'useApi chưa dùng lại bản vừa tải khi mới gắn (Case route gọi /cases/:id hai lần)');
  });

  check('TD2-c · đổi tài khoản lúc đang tải: taiTruoc và cachedGet chỉ lưu khi epoch không đổi (không lộ dữ liệu tài khoản cũ)', () => {
    const than = (f: string, dau: string) => { const s = nguon(f).replace(/\r\n/g, '\n'); const i = s.indexOf(dau); return s.slice(i, s.indexOf('\n}\n', i)); };
    const tt = than('web/src/lib/useApi.ts', 'export function taiTruoc');
    assert(/const e = currentEpoch\(\);[\s\S]*getChung\(path\)[\s\S]*currentEpoch\(\) === e[\s\S]*nhoBanXem/.test(tt), `taiTruoc: ${tt}`);
    const cg = than('web/src/lib/api.ts', 'export async function cachedGet');
    assert(/const e = cacheEpoch;[\s\S]*await api\.get[\s\S]*if \(cacheEpoch === e\) cache\.set\(path, \{ epoch: e,/.test(cg), `cachedGet: ${cg}`);
  });
}
