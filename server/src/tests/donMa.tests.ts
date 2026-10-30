/**
 * PHÉP KIỂM DON-MA (`docs/superpowers/plans/2026-10-30-don.md`, PR DON-MA): mã chết + gộp mã không đổi màn.
 *   Task 2 xoá vi phạm một hàm · Task 3 một lối mở việc Vận hành · Task 4 `moveableSkills` / 403 theo mã / `boKetQuaChoMiniTest` theo lô.
 * Phép soi nguồn theo mẫu prS4f (đọc tệp, bỏ chú thích).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(REPO, rel), 'utf8'));
const dem = (re: RegExp, s: string) => (s.match(re) ?? []).length;
const tepTrong = (rel: string): string[] => fs.readdirSync(path.join(REPO, rel)).filter((f) => /\.tsx?$/.test(f)).map((f) => `${rel}/${f}`);

export async function runDonMaTests(t: any) {
  const { check, checkAsync, assert, conn } = t;
  console.log('\nDON-MA · mã chết + gộp mã không đổi màn');

  check('DON-MA · xoá vi phạm: api.del(\'/violations/ chỉ xuất hiện một lần trong web/src/modules/yThuc', () => {
    const n = tepTrong('web/src/modules/yThuc').reduce((s, f) => s + dem(/api\.del(?:<[^>]*>)?\(\s*[`'"]\/violations\//g, doc(f)), 0);
    assert(n === 1, `api.del('/violations/…') xuất hiện ${n} lần (cần đúng 1: xoaViPham)`);
    assert(/export async function xoaViPham\(/.test(doc('web/src/modules/yThuc/DeleteViolationConfirm.tsx')), 'thiếu xoaViPham ở DeleteViolationConfirm.tsx');
    assert(/xoaViPham\(/.test(doc('web/src/modules/yThuc/ChiTietViPham.tsx')), 'ChiTietViPham chưa gọi xoaViPham');
  });

  check('DON-MA · href việc Vận hành: chỉ số (QL) = /cong-viec/van-hanh?open=<id>, myWork (người được giao) = /cong-viec?viec=mgmt:<id>, không còn mo-viec', () => {
    for (const f of ['server/src/worklist/metrics.ts', 'server/src/worklist/mywork.ts']) {
      const s = doc(f);
      assert(!/mo-viec/.test(s), `${f} còn mo-viec`);
    }
    assert(/\/cong-viec\/van-hanh\?open=\$\{r\.id\}/.test(doc('server/src/worklist/metrics.ts')), 'metrics: href chưa là van-hanh?open=<id>');
    assert(/\/cong-viec\?viec=mgmt:\$\{t\.id\}/.test(doc('server/src/worklist/mywork.ts')), 'myWork: href chưa là viec=mgmt:<id>');
  });

  check('DON-MA · web: lối cũ ?mo-viec= (chuông đã lưu) chuyển hướng sang ?viec=mgmt:<id>, không còn panel phủ trang NganViecVanHanh ở Công việc', () => {
    const cv = doc('web/src/modules/congViec/CongViecPage.tsx');
    const ht = doc('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(/viec=mgmt:/.test(cv) && !/\?mo-viec=\$/.test(cv), 'CongViecPage: ?open= chưa đổi sang viec=mgmt:');
    assert(/params\.get\('mo-viec'\)/.test(cv) && /tabs\.includes\('van-hanh'\)\) return <Navigate[^>]*van-hanh'\]\}\?open=/.test(cv), 'mo-viec cũ: người có bảng Vận hành chưa được chuyển tới van-hanh?open=');
    assert(!/NganViecVanHanh/.test(ht), 'HoTroHocVienTab còn NganViecVanHanh phủ trang cho mo-viec');
  });

  await checkAsync('DON-MA · hồ sơ Mock không còn trường moveableSkills (máy chủ + kiểu web)', async () => {
    const { P } = t;
    const att: any = await import('../fasttrack/attempts.ts');
    const a = conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id IS NOT NULL LIMIT 1`).get() as any;
    assert(a, 'seed không có lượt có lớp');
    const det = att.attemptDetail(P.admin, a.id);
    assert(!('moveableSkills' in det.viewer), 'attemptDetail.viewer còn moveableSkills');
    assert(!/moveableSkills/.test(doc('server/src/fasttrack/attempts.ts')), 'attempts.ts còn moveableSkills');
    assert(!/moveableSkills/.test(doc('web/src/modules/fasttrack/MockDetailPage.tsx')), 'MockDetailPage.tsx còn moveableSkills');
  });

  await checkAsync('DON-MA · boKetQuaChoMiniTest 950 lượt (giả) không vượt 900 tham số (json_each như S5) và vẫn đúng', async () => {
    const ck: any = await import('../normal/cuoiKhoa.ts');
    const hamSrc = /export function boKetQuaChoMiniTest[\s\S]*?\n}\n/.exec(doc('server/src/normal/cuoiKhoa.ts'))?.[0] ?? '';
    assert(/json_each|DS_JSON|theoLoJson/.test(hamSrc) && !/map\(\(\) => '\?'\)/.test(hamSrc), 'boKetQuaChoMiniTest còn IN (?,?,…) theo số nhóm');
    const hoc = conn.prepare(`SELECT a.student_id AS sid, a.id AS aid, c.id AS cid FROM assessment_attempts a JOIN learning_cycles c ON c.student_id = a.student_id LIMIT 1`).get() as any;
    assert(hoc, 'seed không có em có lộ trình');
    conn.prepare(`DELETE FROM mini_test WHERE student_id = ? AND tu_attempt_id = ?`).run(hoc.sid, hoc.aid);
    conn.prepare(`INSERT INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han) VALUES (?,?,?,?,?,?,?)`)
      .run(hoc.sid, hoc.cid, hoc.aid, 'zz_donma', 4, '2026-09-20', '2026-09-30');
    const mot = (nhom: string) => ({ kind: 'bo_tro_mien_phi', nhom_bo_tro: nhom, followup_due: '2026-09-01', action_due: null });
    const rows = [...Array.from({ length: 949 }, (_, i) => mot(`g${i}`)), mot('zz_donma')];
    const bo = ck.boKetQuaChoMiniTest(rows, '2026-09-10');
    assert(bo(rows[949]) === true, 'nhóm có Mini Test chờ phải bỏ dòng Kết quả PA');
    assert(rows.slice(0, 949).every((r) => bo(r) === false), 'nhóm không có Mini Test chờ không được bỏ');
  });

  check('DON-MA · 403/404 nhận theo e.status, không theo câu chữ (api.ts không còn tập câu lỗi; ErrorState nhận status)', () => {
    const api = doc('web/src/lib/api.ts');
    assert(!/cauLoi403|laCauLoi403|cauLoi404|laCauLoi404/.test(api), 'api.ts còn tập câu lỗi 403 / 404');
    const ui = doc('web/src/ui/ui.tsx');
    assert(!/laCauLoi40[34]/.test(ui), 'ui.tsx còn laCauLoi40x');
    assert(/status === 403/.test(ui) && /status === 404/.test(ui), 'ErrorState chưa đọc status 403 / 404');
    const goi = tepTrong('web/src/modules/cases').concat(tepTrong('web/src/modules/yThuc'), tepTrong('web/src/modules/fasttrack'))
      .flatMap((f) => doc(f).match(/<ErrorState message=\{[A-Za-z0-9_.]+\.message\}[^>]*>/g) ?? []);
    assert(goi.length > 0 && goi.every((g) => /status=\{/.test(g)), `ErrorState truyền e.message mà không truyền status: ${goi.filter((g) => !/status=\{/.test(g)).join(' | ')}`);
  });
}
