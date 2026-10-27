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
}
