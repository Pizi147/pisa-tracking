/**
 * PHÉP KIỂM 6c-1 PANEL-AP (kế hoạch `docs/superpowers/plans/2026-10-28-6c-panel-ap.md`, bảng kê `docs/superpowers/specs/2026-10-27-panel-inventory.md`):
 *  ① lỗi 5 — panel còn chữ / lựa chọn chưa lưu: ✕ / Esc / nền hỏi một lần (`chan.daSua`, `daSua`, `useBaoDangSua`);
 *  ② lỗi 6 — lỗi tải hiện `ErrorState` + Thử lại, không như rỗng / quay mãi;
 *  ③ lỗi 9 — không panel chồng panel;
 *  ⑥ nợ 6b — `luotChu` theo mã lượt, gỡ `GET /tong-quan/ql/tre`, lưới Nhập hộ gọn, "·" đầu dòng ở 375.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const W = 'web/src/modules/';

export async function runPr6cPanelApTests(t: { check: (ten: string, f: () => void) => void; assert: (c: unknown, m: string) => void }) {
  const { check, assert } = t;
  console.log('\n6c-1 PANEL-AP — chống mất chữ, lỗi tải ≠ rỗng, không panel chồng, nợ 6b');

  check('6c ① KhungPanel: form trong con báo qua useBaoDangSua; panel không chân có prop daSua; cả hai vào cùng đường hỏi', () => {
    const s = doc('web/src/ui/KhungPanel.tsx');
    assert(/export function useBaoDangSua\(co: boolean\)/.test(s), 'thiếu useBaoDangSua');
    assert(s.includes('!!chan?.daSua || !!daSuaRieng || conSua ||'), 'daSua chưa gộp prop + báo từ con');
    assert(s.includes('<BaoSuaPanel.Provider value={baoSua}>{children}</BaoSuaPanel.Provider>'), 'thân panel chưa cấp BaoSuaPanel');
  });

  check('6c ① mỗi panel trong bảng kê lỗi 5 báo "đang sửa"', () => {
    const can: [string, RegExp][] = [
      ['classes/ThongTinLopPanel.tsx', /useBaoDangSua\(dangSua && daDoi\)/],
      ['classes/BanGiaoPanel.tsx', /daSua: daSuaNx/],
      ['classes/ClassCreatePanel.tsx', /daSua: so !== locSoLop/],
      ['test/keHoach/NganXepLichMt.tsx', /daSua: Object\.keys\(rieng\)/],
      ['test/keHoach/XepTheoHocVien.tsx', /daSua: soThayDoi > 0/],
      ['test/keHoach/NganXepHangLoat.tsx', /daSua: daChinh/],
      ['test/keHoach/HopKyNang.tsx', /if \(daSua \|\| doiGhi\) setHoiDong\(true\)/],
      ['congViec/PanelSauThi.tsx', /daSua: !!chon \|\| !!ghiChu\.trim\(\)/],
      ['worklist/MeetingPage.tsx', /daSua=\{!chiDoc && /],
      ['worklist/MgmtTasksPage.tsx', /daSua: title !== task\.title/],
      ['duyet/TheYeuCau.tsx', /useBaoDangSua\(!!o && /],
      ['students/KetLuanKhoa.tsx', /daSua: nn !== /],
      ['yThuc/KhaiBacPanel.tsx', /daSua: !daLuu && \(bac !== /],
      ['yThuc/DaThucHienPanel.tsx', /daSua: !daLuu && !!ghiChu\.trim\(\)/],
      ['yThuc/XemXuLyPanel.tsx', /daSua: sua \|\| !!tt/],
      ['yThuc/RecordViolationPanel.tsx', /daSua: editing && violation\n/],
    ];
    const thieu = can.filter(([f, re]) => !re.test(doc(W + f).replace(/\r\n/g, '\n'))).map(([f]) => f);
    assert(thieu.length === 0, `chưa báo đang sửa: ${thieu.join(', ')}`);
  });

  check('6c ② lỗi tải có ErrorState / dòng "Không tải được" + Thử lại (không như rỗng, không "Đang tải…" mãi)', () => {
    const can: [string, RegExp][] = [
      ['students/StudentPlanPanel.tsx', /cycle\.error \? <ErrorState[^]*sugg\.error \? <ErrorState/],
      ['students/HangLichMt.tsx', /if \(ct\.error\) return <ErrorState/],
      ['students/DauHoSo.tsx', /<LoiTaiNho /],
      ['platform/Header.tsx', /notifications\.error \? <LoiTaiNho /],
      ['worklist/SignalList.tsx', /if \(error\) return <Card[^\n]*<ErrorState/],
      ['yThuc/XacNhanXuLyPanel.tsx', /<ErrorState message=\{loiTai\.message\}/],
      ['yThuc/KhaiBacPanel.tsx', /<ErrorState message=\{loiTai\.message\}/],
      ['yThuc/DaThucHienPanel.tsx', /<ErrorState message=\{loiTai\.message\}/],
      ['yThuc/ChiTietViPham.tsx', /if \(loiTai\) return <ErrorState/],
    ];
    const thieu = can.filter(([f, re]) => !re.test(doc(W + f).replace(/\r\n/g, '\n'))).map(([f]) => f);
    assert(thieu.length === 0, `lỗi tải còn hiện như rỗng: ${thieu.join(', ')}`);
    assert(/export function LoiTaiNho\(/.test(doc('web/src/ui/ui.tsx')), 'thiếu dòng lỗi tải gọn LoiTaiNho');
  });

  check('6c ② Tài khoản / Chương trình: chỉ nói "chỉ dành cho Quản trị" khi máy chủ trả 403; lỗi mạng → ErrorState + Thử lại', () => {
    for (const f of ['platform/AccountsAdmin.tsx', 'platform/CatalogAdmin.tsx']) {
      const s = doc(W + f);
      assert(/\.status !== 403/.test(s) && /<ErrorState /.test(s), `${f}: lỗi mạng vẫn báo thiếu quyền`);
    }
  });

  check('6c ③ không panel chồng panel: Gia hạn = hộp nhỏ; Sửa công việc = view kế (‹ về việc, ✕ đóng cả panel)', () => {
    const gh = doc(W + 'students/HopGiaHan.tsx');
    assert(!/<KhungPanel/.test(gh) && /<Modal open onClose=\{dong\}/.test(gh), 'Gia hạn vẫn là KhungPanel đè');
    const mg = doc(W + 'worklist/MgmtTasksPage.tsx');
    assert(/if \(data && editing\) return <SuaViec /.test(mg), 'Sửa việc chưa thay view');
    assert(/tieuDe="Sửa công việc" hocVien=\{task\.title\} rong="rong" quayLai=\{\{ nhan: task\.title, onClick: onClose \}\} onDong=\{dongCa\}/.test(mg), 'Sửa việc còn longTrong / thiếu ‹');
  });

  check('6c ⑥ Nhập hộ gọn (#641 XM-2): không cột Kết quả, không nút "Cả lớp"; "·" không đứng đầu dòng 2 đầu panel (XM-3)', () => {
    const pv = doc(W + 'congViec/PanelViec.tsx');
    assert(/nutCaLop=\{!chiEmViec\} anKetQua=\{chiEmViec\}/.test(pv), 'PanelNhapDiem chưa gọn khi chiEmViec');
    assert(/kq: !anKetQua/.test(doc(W + 'cham/LuoiFT.tsx')), 'LuoiFT chưa ẩn được cột Kết quả');
    const kp = doc('web/src/ui/KhungPanel.tsx');
    assert(/overflow-x-clip[^\n]*\n\s*<p className="m-0 -ml-5 flex flex-wrap/.test(kp.replace(/\r\n/g, '\n')) && /inline-block w-5 text-center/.test(kp), 'dòng 2 đầu panel vẫn có thể "·" đầu dòng');
  });

  check('6c ⑥ gỡ GET /tong-quan/ql/tre + oTreCham (web không còn gọi); gvTre: luotChu lấy từ mã lượt, không cắt chuỗi contextLabel', () => {
    assert(!doc('server/src/routes/index.ts').includes("'/tong-quan/ql/tre'"), 'route cũ còn');
    assert(!/export function oTreCham/.test(doc('server/src/worklist/tongQuanQl.ts')), 'oTreCham còn');
    const g = doc('server/src/worklist/gvTre.ts');
    assert(!/contextLabel[^\n]*\.replace\(/.test(g) && /luotChu: chuLuot\(it\.luot\)/.test(g) && /luotChu: nhanMaLuot\(m\)/.test(g), 'luotChu chưa theo mã lượt ở cả hai vai');
  });

  check('6c ⑥ (#644 XM-4): view Case mở từ việc không lặp ô ghi nhanh / Xác nhận PA / Kết quả của chính PA đó', () => {
    assert(/viecBanDau=\{\{ loai: 'case' \}\} paViec=\{p\.it\.paId \?\? null\}/.test(doc(W + 'congViec/PanelViec.tsx')), 'PanelViec chưa truyền paViec');
    const nc = doc(W + 'students/NganCase.tsx');
    assert(/paViec=\{paViec\}/.test(nc) && /if \(paViec !== null && v\?\.paId === paViec\) return undefined;/.test(nc), 'NganCase chưa chặn nút chính / thẻ PA');
    const cp = doc(W + 'cases/CasePanel.tsx');
    assert(/anViec=\{iv\.id === paViec\}/.test(cp) && /nutXacNhan = !anXacNhan && !anViec/.test(cp) && /nutKetQua = !anViec/.test(cp) && /ghiDuoc = !anViec/.test(cp), 'thẻ PA còn lặp thao tác');
  });

  const { conn } = t as any;
  if (!conn) return;   // chạy riêng phép kiểm đọc nguồn (không DB)
  const { gvTre } = await import('../worklist/gvTre.ts');
  const { treCham } = await import('../worklist/tongQuanQl.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  check('6c ⑥ gvTre (Admin + QL): mọi dòng có lượt → luotChu = nhanMaLuot(docMaLuot(luot))', () => {
    const id = (sql: string) => (conn.prepare(sql).get() as any)?.id as number | undefined;
    const ads = (conn.prepare(`SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'office_admin'`).all() as any[]).map((r) => r.id as number);
    const ql = id(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'branch_manager' ORDER BY ur.user_id LIMIT 1`);
    let n = 0;
    const kiem = (r: any) => { for (const g of r.nhom) for (const x of g.dong) if (x.luot) { n++; assert(x.luotChu === d.nhanMaLuot(d.docMaLuot(x.luot)), `${x.luot}: "${x.luotChu}"`); } };
    for (const ad of ads) kiem(gvTre(loadPrincipal(ad), {}));
    if (ql) {
      const p = loadPrincipal(ql);
      for (const ct of ['ft', 'thuong'] as const) for (const g of treCham(p, null, ct).dong) kiem(gvTre(p, { ct, gv: g.khoa }));
    }
    assert(n > 0 || !ads.length, 'seed không có dòng GV trễ nào để kiểm');
  });

  /* ---------------------------------------------------------------- 6c-2 ④ Bỏ: mã chết theo bảng kê mục 3 (0 nơi gọi) */
  check('6c-2 ④ Bỏ: ô số SoLieu, NutMoDanhSach, BangGiaoVienChiNhanh, tham số kqMacDinh / trongPanel của BangMock', () => {
    assert(!/export function SoLieu\(/.test(doc('web/src/ui/SoLieu.tsx')), 'ô số SoLieu còn');
    assert(!/NutMoDanhSach/.test(doc(W + 'phanTich/dungChung.tsx')), 'NutMoDanhSach còn');
    assert(!fs.existsSync(path.join(ROOT, W + 'giaoVien/BangGiaoVienChiNhanh.tsx')), 'BangGiaoVienChiNhanh còn');
    assert(/export function BangMock\(\{ pv \}: \{ pv: PhamViPhanTich \}\)/.test(doc(W + 'phanTich/KetQuaThi.tsx')), 'BangMock còn tham số chết');
  });

  /* ---------------------------------------------------------------- 6c-2 ⑤ (#632 XM-1): dòng danh sách Case có điểm lượt mở Case */
  const { rowsFor } = await import('../worklist/metrics.ts');
  check('6c-2 ⑤ rowsFor(case): diem = mốc mở / lặp Case gần nhất có band (điểm, kỳ vọng, MT n); Case không mốc điểm → null; một câu cho cả lô', () => {
    const ids = (conn.prepare(`SELECT id FROM sos_cases ORDER BY id LIMIT 60`).all() as any[]).map((r) => r.id as number);
    const moc = new Map<number, any>();
    for (const m of conn.prepare(`SELECT case_id, attempt_no, band, expectation FROM case_milestones WHERE kind IN ('opened', 'repeat') AND band IS NOT NULL ORDER BY occurred_on, id`).all() as any[]) moc.set(m.case_id, m);
    let co = 0, khong = 0;
    for (const r of rowsFor('case', ids) as any[]) {
      const m = moc.get(r.id);
      if (!m) { khong++; assert(r.diemCase == null, `Case ${r.id} không mốc điểm mà có diem`); continue; }
      co++;
      assert(r.diemCase && r.diemCase.so === Number(m.band) && r.diemCase.kyVong === (m.expectation == null ? null : Number(m.expectation)) && (!m.attempt_no || !!r.diemCase.luot),
        `Case ${r.id}: ${JSON.stringify(r.diemCase)} ≠ mốc ${JSON.stringify(m)}`);
    }
    assert(co > 0, 'seed không có Case nào có mốc điểm');
    assert(/FROM case_milestones m LEFT JOIN assessment_attempts a ON a\.id = m\.attempt_id\s+WHERE m\.case_id IN \(\$\{ph\}\)/.test(doc('server/src/worklist/metrics.ts')), 'điểm phải đọc theo lô (IN), không mỗi dòng một câu');
  });
}
