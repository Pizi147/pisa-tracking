/**
 * PHÉP KIỂM PANEL-RIENG (PANEL-V10 B5–B7 + backlog PANEL [XM]):
 *   R1 — panel một em: tên = link + chip SOS có số (không lặp kỹ năng) · hàng Lớp · Target · TVV · Thi · dòng điểm lượt mới nhất.
 *   R2 — "Cần bổ sung đánh giá" → "n PA chưa có kết quả ⓘ", panel số chung (`NganDanhSach`).
 *   R3 — Xét lại: "Khi lưu" một dòng + ⓘ (đủ 4 ý cũ trong ⓘ), dòng điểm Final dùng `DongDiem`.
 *   XM-1 — đầu panel số: số + đơn vị trên dòng tiêu đề, "Cách tính" là ⓘ (không còn `<details>` cuối panel).
 *   XM-2 — bài quá hạn: "Hà chấm" / "… chấm chéo"; bài không ai giữ → `chuaPhanCong` (web: "chưa phân công" + Phân công ›).
 * Thành phần web không chạy được ở đây → quét nguồn (như prPanelChung); phần máy chủ gọi thẳng hàm.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');

export async function runPrPanelRiengTests(t: YThucTestKit & { P: any; checkAsync: (n: string, f: () => Promise<void>) => Promise<void> }) {
  const { check, checkAsync, assert, conn, P } = t;
  console.log('\nPANEL-RIENG · panel một em · PA chưa có kết quả · Xét lại · đầu panel số · "Hà chấm"');
  const motEm = doc('web/src/modules/students/PanelMotEm.tsx');
  const canBoSung = doc('web/src/modules/cases/NeedsEvaluation.tsx');
  const hieuQua = doc('web/src/modules/phanTich/HieuQuaPa.tsx');
  const xetLai = doc('web/src/modules/classes/PanelXetLai.tsx');
  const solieu = doc('web/src/ui/SoLieu.tsx');
  const khung = doc('web/src/ui/KhungPanel.tsx');
  const gvTre = doc('web/src/modules/worklist/PanelGvTre.tsx');

  check('R1 · PanelMotEm: data.diem → DongDiem; ChipSos nhận soLieu + hienKyNang={false}; tên em là link hồ sơ; hàng Target · TVV · Thi', () => {
    assert(/<DongDiem d=\{data\.diem\}/.test(motEm), 'thiếu DongDiem của data.diem');
    assert(/<ChipSos[^>]*hienKyNang=\{false\}[^>]*soLieu=/.test(motEm.replace(/\n\s*/g, ' ')), 'ChipSos chưa nhận soLieu / hienKyNang={false}');
    assert(/tieu: \(/.test(motEm) && /to=\{duongHoSoHocVien\(studentId\)\}>\{ten\}<\/Link>/.test(motEm), 'tên em ở đầu panel chưa là link hồ sơ');
    assert(motEm.includes("['Target', data.em.target]") && motEm.includes("['TVV', data.em.tvv]") && motEm.includes('tachNhanLichThi('), 'thiếu hàng Lớp · Target · TVV · Thi');
  });

  await checkAsync('R1 · máy chủ panelMotEm: em.target = Target lộ trình mới nhất ("6.5" / "… KCK"), lichThi cùng hàm trangThaiLichThi', async () => {
    const { panelMotEm } = await import('../classes/hocVienSos.ts');
    const ds = conn.prepare(
      `SELECT c.student_id, c.target_score, c.khong_cam_ket FROM learning_cycles c
        WHERE c.id = (SELECT x.id FROM learning_cycles x WHERE x.student_id = c.student_id ORDER BY (x.status = 'active') DESC, x.seq DESC LIMIT 1)
        ORDER BY c.student_id LIMIT 6`,
    ).all() as any[];
    assert(ds.length > 0, 'demo phải có lộ trình');
    for (const r of ds) {
      const em = panelMotEm(P.admin, r.student_id).em;
      const mong = r.target_score != null ? `${Number(r.target_score).toFixed(1)}${r.khong_cam_ket ? ' KCK' : ''}` : r.khong_cam_ket ? 'KCK' : null;
      assert(em.target === mong, `em ${r.student_id}: target ${em.target} ≠ ${mong}`);
      assert(em.lichThi === null || em.lichThi.trangThai !== 'chua-co', `em ${r.student_id}: lichThi chua-co phải là null`);
    }
  });

  check('R2 · không còn "Cần bổ sung đánh giá" / "PA chờ kết quả" trong web; NeedsEvaluation dùng NganDanhSach + ⓘ', () => {
    const quet = (d: string): string[] => fs.readdirSync(path.join(REPO, d), { withFileTypes: true })
      .flatMap((f) => (f.isDirectory() ? quet(path.join(d, f.name)) : /\.tsx?$/.test(f.name) ? [path.join(d, f.name)] : []));
    const con = quet('web/src').filter((f) => /Cần bổ sung đánh giá|PA chờ kết quả/.test(doc(f)));
    assert(!con.length, `còn chữ cũ: ${con.join(', ')}`);
    assert(/<NganDanhSach /.test(canBoSung) && /<NutLuat /.test(canBoSung) && canBoSung.includes("t('{n} PA chưa có kết quả'"), 'NeedsEvaluation chưa theo B6');
    assert(/'PA chưa có kết quả'\), t\('Không tính vào bảng hiệu quả tới khi có kết quả'\)/.test(hieuQua), 'thẻ Chưa tính thiếu ⓘ ở dòng PA chưa có kết quả');
  });

  check('R3 · PanelXetLai: "Khi lưu, web sẽ" chỉ trong ⓘ (NutLuat); thẻ em dùng DongDiem Final; không còn ✗ đỏ tay cho Final', () => {
    const i = xetLai.indexOf("{t('Khi lưu, web sẽ')}</p>");
    assert(i > 0, 'mất 4 ý "Khi lưu, web sẽ"');
    const mo = xetLai.lastIndexOf('<NutLuat', i), dong = xetLai.indexOf('</NutLuat>', i);
    assert(mo > 0 && dong > i && xetLai.slice(mo, i).split('</NutLuat>').length === 1, '"Khi lưu, web sẽ" không nằm trong NutLuat');
    assert(/\{t\('Khi lưu:'\)\}<\/b>\s*<span className="min-w-0 flex-1">\{chuQuyet\(e, chon, lopChu, homNay\)\}/.test(xetLai), 'thiếu dòng tóm "Khi lưu: …" của em');
    assert(/<DongDiem d=\{diemFinal\(e\)\}/.test(xetLai), 'thẻ em chưa dùng DongDiem Final');
    assert(!/tyLe < 0\.7 \? 'text-bad'/.test(xetLai) && !/m\.dat \? '' : 'text-bad'/.test(xetLai), 'còn tô đỏ tay cho Final');
  });

  check('XM-1 · KhungPanel dau.tieu; NganDanhSach + PanelGvTre: số trên dòng tiêu đề, Cách tính là ⓘ (không <details>)', () => {
    assert(/tieu\?: ReactNode/.test(khung) && khung.includes('{dau.tieu ?? tieuDe}'), 'KhungPanel thiếu dau.tieu');
    for (const [ten, src] of [['NganDanhSach', solieu.slice(solieu.indexOf('export function NganDanhSach'), solieu.indexOf('export function DanhSachSoLieu'))], ['PanelGvTre', gvTre]] as const) {
      assert(/tieu: \(/.test(src) && /<NutLuat label=\{t\('Cách tính'\)\}>/.test(src), `${ten}: thiếu số / ⓘ trên dòng tiêu đề`);
      assert(!/<summary[^>]*>\{t\('Cách tính'\)\}<\/summary>/.test(src), `${ten}: còn <details> Cách tính`);
    }
  });

  await checkAsync('XM-2 · bài quá hạn: người giữ → "{tên} chấm" / "… chấm chéo"; không ai giữ → chuaPhanCong, web có "chưa phân công" + Phân công ›', async () => {
    const metrics: any = await import('../worklist/metrics.ts');
    const r = metrics.metricSet(P.admin, 'bai-qua-han-nhap-diem', {});
    const rows = metrics.metricResponse(r, true, P.admin).rows as any[];
    assert(rows.length > 0, 'demo phải có bài quá hạn');
    let coNguoi = 0;
    for (const row of rows) {
      const c = r.chiTiet.get(row.id);
      if (c?.nguoi.length) {
        coNguoi++;
        assert(c.chamCheo ? row.nguoi.endsWith('chấm chéo') : row.nguoi.endsWith(' chấm'), `bài ${row.id}: "${row.nguoi}"`);
        assert(!row.chuaPhanCong, `bài ${row.id}: có người mà chuaPhanCong`);
      } else if (c) assert(!!row.chuaPhanCong === !c.chamCheo, `bài ${row.id}: chuaPhanCong sai`);
    }
    assert(coNguoi > 0, 'demo phải có bài có người giữ');
    assert(solieu.includes("r.chuaPhanCong && !r.xong && t('chưa phân công')") && solieu.includes('?viec=phan-cong`'), 'web chưa vẽ "chưa phân công" + Phân công ›');
  });
}
