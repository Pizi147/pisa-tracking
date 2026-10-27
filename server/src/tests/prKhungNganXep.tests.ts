/**
 * PHÉP KIỂM M6 · 6b-1 KHUNG-NGAN-XEP (kế hoạch `docs/superpowers/plans/2026-10-27-m6-code.md`, mockup `thiet-ke/v7/panel-pilot.html` khu K + "Quay lại",
 * bảng kê `docs/superpowers/specs/2026-10-27-panel-inventory.md` lỗi 1, 3, 7, 8, 10 + mục 0.2 ý 2):
 *  · chuỗi view `?panel=` đọc an toàn (URL là dữ liệu ngoài), view Case ↔ một đoạn;
 *  · ‹ = lùi một view: mục do app push → history.back(); link sâu / F5 không state → thay URL bằng view cha; ✕ lùi đúng số mục panel đã push;
 *  · Ngăn Case: view việc mở TỪ Case thì ‹ về Case (không nhảy cóc về danh sách), view đầu thì ‹ về nơi mở;
 *  · khung: "‹ {view trước}" cùng hàng ✕, nhãn loại không đoán "VIỆC"; `OSo` chặn nổi bọt; `DanhSachNguon` giữ tiêu đề nơi gọi.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';

export async function runPrKhungNganXepTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nM6 · 6b-1 KHUNG-NGAN-XEP — ngăn xếp view ?panel=, ‹ lùi một view, Back trình duyệt, khung chung');

  check('6b-1 · docXem: "a.b-1" → [a, b-1]; rỗng / đoạn lạ / quá dài → [] (URL là dữ liệu ngoài)', () => {
    assert(JSON.stringify(d.docXem('them-pa')) === '["them-pa"]', JSON.stringify(d.docXem('them-pa')));
    assert(JSON.stringify(d.docXem('case.ghi-ket-qua-55')) === '["case","ghi-ket-qua-55"]', 'hai đoạn');
    assert(d.docXem(Array(20).fill('a').join('.')).length === 20, 'chuỗi 20 view (sâu thật) bị bỏ');
    for (const x of [null, undefined, '', '.', 'a..b', 'A', 'a b', 'a/b', '<x>', Array(21).fill('a').join('.'), 'a'.repeat(41)]) {
      assert(d.docXem(x).length === 0, `nhận đoạn lạ: ${String(x)}`);
    }
  });

  check('6b-1 · maView ↔ viewTuMa: mọi view Case qua lại một đoạn; view cần id mà thiếu id / loại lạ → null', () => {
    const ds = [{ loai: 'case' }, { loai: 'them-pa' }, { loai: 'hoan-thanh' }, { loai: 'xac-nhan' }, { loai: 'ghi-nhan-xet' }, { loai: 'xac-nhan-s' }, { loai: 'sua' },
      { loai: 'ghi-ket-qua', paId: 55 }, { loai: 'xac-nhan-pa', paId: 7 }, { loai: 'sua-pa', paId: 9 }, { loai: 'sua-ket-qua', followupId: 31 }];
    for (const v of ds) {
      const ma = d.maView(v);
      assert(d.docXem(ma).length === 1, `đoạn không hợp lệ: ${ma}`);
      assert(JSON.stringify(d.viewTuMa(ma)) === JSON.stringify(v), `${ma} → ${JSON.stringify(d.viewTuMa(ma))}`);
    }
    assert(d.maView({ loai: 'ghi-ket-qua', paId: 55 }) === 'ghi-ket-qua-55', d.maView({ loai: 'ghi-ket-qua', paId: 55 }));
    assert(d.maView({ loai: 'them-pa', paId: 55 }) === 'them-pa', 'view không cần id vẫn gắn id');
    assert(d.maView({ loai: 'ghi-ket-qua' }) === 'case', 'view cần id mà thiếu id không về Case');
    for (const x of ['ghi-ket-qua', 'xac-nhan-pa', 'sua-ket-qua', 'case-3', 'nhap-diem', 'xoa', '']) assert(d.viewTuMa(x) === null, `nhận ${x}`);
  });

  check('6b-1 · ‹ / Back: mục do app push (state.xem = độ dài chuỗi) → history.back(); link sâu, F5 không state, replace → thay URL bằng view cha', () => {
    assert(d.luiBangBack({ xem: 2 }, 2) === true, 'mục push đúng độ dài');
    assert(d.luiBangBack({ xem: 1 }, 2) === false, 'mục đã bị replace (độ dài khác) mà vẫn back');
    for (const st of [null, undefined, {}, { veCha: true }, 'x']) assert(d.luiBangBack(st, 1) === false, `back khi không có mục cha: ${JSON.stringify(st)}`);
  });

  check('6b-1 · ✕: lùi đúng số mục panel đã push (mở số + mỗi view); mở bằng link sâu → 0 (thay URL, không rời app)', () => {
    assert(d.soMucPanel({ panelSau: 3 }) === 3, 'ba mục');
    for (const st of [null, undefined, {}, { panelSau: 0 }, { panelSau: -2 }, { panelSau: 1.5 }, { panelSau: '2' }, { panelSau: 99 }]) {
      assert(d.soMucPanel(st) === 0, `nhận ${JSON.stringify(st)}`);
    }
  });

  check('6b-1 · URL: mở panel số + vào view sâu = push (Back lùi một view); ‹ dùng luiBangBack; ✕ dùng soMucPanel', () => {
    const q = docSach('web/src/lib/quayLai.ts');
    const moSo = q.slice(q.indexOf('export function useMoSoLieu'), q.indexOf('export function useTapUrl'));
    assert(/panelSau/.test(moSo) && !/setSp\(\s*\(q\)[\s\S]*replace: true \}\)\]/.test(moSo), 'useMoSoLieu vẫn ghi bằng replace');
    assert(/soMucPanel\(/.test(moSo) && /navigate\(-/.test(moSo), 'đóng panel số không lùi số mục đã push');
    const xem = q.slice(q.indexOf('export function useXem'));
    assert(/luiBangBack\(/.test(xem) && /navigate\(-1\)/.test(xem), 'useXem: ‹ không history.back()');
    assert(!/'xem'/.test(q) && /get\('panel'\)/.test(q), 'chuỗi view dùng ?panel= — đụng tham số tab của Chờ duyệt (?panel=da-xu-ly|de-biet)');
    const ts = q.slice(q.indexOf('export function useThamSoUrl'), q.indexOf('export function useMoSoLieu'));
    assert(/state:/.test(ts), 'useThamSoUrl replace làm mất dấu state của mục (‹ sau đó không back được)');
  });

  check('6b-1 · Ngăn Case: không còn `veNguon ?? Case` cho mọi view; ngăn xếp useXem; view đầu ‹ về nơi mở, view mở từ Case ‹ về Case', () => {
    const n = docSach('web/src/modules/students/NganCase.tsx');
    assert(!/quayLai:\s*veNguon\s*\?\?/.test(n), 'còn quayLai = veNguon ?? Case (nhảy cóc)');
    assert(/useXem\(/.test(n), 'NganCase không dùng ngăn xếp view');
    assert(!/useState<ViewCase>/.test(n), 'view Case còn là state rời (không theo ngăn xếp)');
    assert(/maHien === 'xac-nhan'/.test(n.slice(n.indexOf('const tuDong'), n.indexOf('const tuDong') + 300)), 'dòng "Xác nhận Case" trong panel số không còn tự sang Xác nhận S / Ghi nhận xét');
    const l = docSach('web/src/modules/worklist/LamDongSoLieu.tsx');
    assert(!/veNguon=/.test(l), 'LamDongSoLieu còn nối veNguon bằng tay');
    const s = docSach('web/src/ui/SoLieu.tsx');
    const nds = s.slice(s.indexOf('export function NganDanhSach'), s.indexOf('export function DanhSachSoLieu'));
    assert(/useXem\(/.test(nds) && /XemCha\.Provider/.test(nds), 'NganDanhSach không dựng chuỗi ?panel= cho việc của dòng');
    assert(!/useState<DongSoLieu \| null>/.test(nds), 'việc của dòng còn là state (F5 mất chuỗi)');
    assert(/useRef<DongSoLieu \| null>/.test(nds) && /!r\.xong/.test(nds), 'panel việc tắt giữa "✓ Đã lưu" khi máy chủ trả dòng không còn việc; Forward mở lại việc đã xong');
  });

  check('6b-1 · khung: "‹ {view trước}" cùng hàng ✕ (không dòng "← …" riêng); ‹ chỉ hỏi khi chữ không có nháp', () => {
    const k = docSach('web/src/ui/KhungPanel.tsx');
    assert(!/←\s*\{quayLai\.nhan\}/.test(k), 'còn dòng "← {quayLai.nhan}" riêng dưới đầu');
    assert(/‹/.test(k) && /aria-label=\{t\('Quay lại \{x\}'/.test(k), 'đầu panel không có nút ‹ {view trước}');
    const veLai = k.slice(k.indexOf('const veLai'), k.indexOf('const dauCv'));
    /* 6c: + chữ chỉ trong state của panel không chân (`daSua`) / form con (`useBaoDangSua`) — vẫn không tính nháp. */
    assert(/if \(chan\?\.daSua(?: \|\| daSuaRieng \|\| conSua)?\) setHoi/.test(veLai), '‹ vẫn hỏi cả khi chữ đã ở nháp, hoặc bỏ hỏi khi nơi gọi tự hỏi (tuHoi chỉ cho ✕ / Esc / nền)');
  });

  check('6b-1 · nhãn loại không đoán "VIỆC" theo `dau`: panel việc khai qua dauViec / loai; panel chỉ đọc không mang nhãn VIỆC', () => {
    const k = docSach('web/src/ui/KhungPanel.tsx');
    assert(!/dau \? t\('VIỆC'\)/.test(k), 'khung còn đoán "VIỆC" khi có dau');
    assert(/dau\?\.loai/.test(k), 'khung không đọc nhãn loại từ dau');
    assert(/loai: t\('VIỆC'\)/.test(docSach('web/src/ui/KhuonViec.tsx')), 'dauViec không khai nhãn VIỆC');
    for (const f of ['web/src/ui/LichSuThayDoi.tsx', 'web/src/modules/huongDan/NutHuongDan.tsx', 'web/src/modules/students/PanelMotEm.tsx']) {
      assert(!/dauViec\(/.test(docSach(f)), `${f} chỉ đọc mà dùng dauViec (nhãn VIỆC)`);
    }
    for (const f of ['web/src/modules/congViec/PanelChamSpeaking.tsx', 'web/src/modules/yThuc/LoYThucPanel.tsx']) {
      assert(/loai: t\('VIỆC'\)/.test(docSach(f)), `${f} là panel việc mà mất nhãn VIỆC`);
    }
  });

  check('6b-1 · OSo chặn nổi bọt (nút + panel qua portal) — hàng bấm được không ăn cú bấm; DanhSachNguon giữ tiêu đề nơi gọi', () => {
    const o = docSach('web/src/ui/OSo.tsx');
    assert(/onClick=\{\(e\) => e\.stopPropagation\(\)\}/.test(o), 'OSo không chặn click nổi lên hàng');
    assert(/onKeyDown=\{\(e\) => \{ if \(e\.key === 'Enter' \|\| e\.key === ' '\) e\.stopPropagation\(\); \}\}/.test(o), 'OSo không chặn Enter / Space nổi lên hàng');
    assert(!/data\?\.tieuDe \?\? tieuDe/.test(o), 'DanhSachNguon còn thay tiêu đề nơi gọi bằng tiêu đề máy chủ');
  });
}
