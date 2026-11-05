/**
 * PHÉP KIỂM DUYET-QL (PANEL-V10 khu C, mockup `thiet-ke/v10/panel-thong-tin.html` #cv): panel duyệt Công việc QL — chân Từ chối… / Duyệt dính,
 * "Lịch sử · n" tải khi mở, chip SOS ở "Chờ bạn duyệt", dòng điểm ở bối cảnh, dòng vừa duyệt giữ chỗ. Thành phần web → quét nguồn.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');   // Windows checkout CRLF
/** Thân một hàm (`function …` tới `}` đầu dòng). */
const than = (src: string, mo: string) => {
  const i = src.indexOf(mo);
  if (i < 0) return '';
  const het = src.indexOf('\n}\n', i);
  return src.slice(i, het < 0 ? undefined : het);
};

export async function runPrDuyetQlTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nDUYET-QL · panel duyệt Công việc QL');
  const hop = doc('web/src/modules/duyet/HopChoDuyet.tsx');
  const the = doc('web/src/modules/duyet/TheYeuCau.tsx');

  check('D1 · PanelDuyet truyền chan cho KhungPanel (huy null, trái "Tiếp: …"); TheYeuCau ở panel đưa nút quyết vào chân (portal), không vẽ trong thân', () => {
    const pd = than(hop, 'function PanelDuyet');
    assert(/<KhungPanel[\s\S]*chan=\{xong \? \{[\s\S]*\} : !cho \? undefined : \{/.test(pd) && pd.includes('chanEl={cho ? chanEl : undefined}'), 'PanelDuyet chưa truyền chan');
    assert(/huy: null/.test(pd) && pd.includes("t('Tiếp: {tieuDe}'"), 'chân thiếu huy: null / "Tiếp: …"');
    assert(/chanEl=\{/.test(pd), 'PanelDuyet chưa đưa chỗ chân cho TheYeuCau');
    assert(/createPortal\(o \? nutO : nutQuyet, chanEl\)/.test(the), 'TheYeuCau chưa đưa nút quyết vào chân');
    assert(/chanEl === undefined && nutQuyet/.test(the), 'TheYeuCau vẫn vẽ nút quyết trong thân khi có chân');
  });

  check('D1 · Lịch sử · n: chỉ tải /lich-su?loai=yeu-cau khi mở; ẩn khi 0', () => {
    const ls = than(hop, 'function LichSuYeuCau');
    assert(/useApi<[^>]*>\(mo \? `\/lich-su\?loai=yeu-cau&id=\$\{id\}` : null/.test(ls), `Lịch sử phải tải khi mở: ${ls.slice(0, 300)}`);
    assert(/if \(!n\) return null/.test(ls) && ls.includes('aria-expanded={mo}'), 'Lịch sử thiếu ẩn khi 0 / aria-expanded');
    assert(/<LichSuYeuCau id=\{yc\.id\} n=\{yc\.soLichSu/.test(hop), 'PanelDuyet chưa vẽ Lịch sử');
    /* Sửa nhỏ 05/11: quyết xong → n theo số máy chủ trả kèm; danh sách đang mở tải lại khi n đổi. */
    assert(the.includes('onXong(yc.id, xongChu, huyDuoc, kq?.soLichSu)') && hop.includes('soLichSu != null ? { ...y, soLichSu } : y'), 'panel kết quả chưa cộng Lịch sử');
    assert(ls.includes(': null, [mo, id, n]);'), 'danh sách đang mở chưa tải lại khi n đổi');
  });

  check('D1 · chip SOS ở Chờ bạn duyệt (y.sos) + đầu panel; dòng Điểm ở bối cảnh dùng DongDiem', () => {
    assert(/sos && <ChipSos muc=\{[^}]*sos\.muc\}/.test(than(hop, 'function CayDuyet')), 'CayDuyet chưa vẽ ChipSos theo sos');
    assert(/yc\.sos && <ChipSos/.test(than(hop, 'function PanelDuyet')), 'đầu panel chưa có ChipSos');
    assert(/panel && yc\.diemHv && [\s\S]{0,600}<DongDiem d=\{yc\.diemHv\}/.test(the), 'bối cảnh chưa có dòng Điểm');
  });

  check('D2 · dòng vừa duyệt giữ chỗ "✓ … · Hoàn tác" (cả Duyệt tại dòng và ở panel); panel sau Duyệt có chân "✓ Đã lưu · Yêu cầu tiếp ›"', () => {
    assert(/setGiu\(/.test(than(hop, 'export function HopChoDuyet')), 'chưa giữ chỗ dòng vừa làm');
    const dd = than(hop, 'function DongDuyet');
    assert(dd.includes('giu') && dd.includes("t('Hoàn tác')"), 'DongDuyet chưa vẽ dòng giữ chỗ + Hoàn tác');
    assert(hop.includes("t('✓ Đã lưu')") && hop.includes("t('Yêu cầu tiếp ›')"), 'panel sau Duyệt thiếu chân Đã lưu / Yêu cầu tiếp');
  });

  check('D1 · dòng Lịch sử không lộ mã máy (case.dismiss.request) — mã ngoài bảng riêng dùng nhãn nhật ký chung', () => {
    const f = than(doc('server/src/duyet/yeuCau.ts'), 'export function lichSuYeuCau');
    assert(f.includes('nhanHanhDongNhatKy(r.action)') && !/\[r\.action, r\.entity_label\]/.test(f), 'lichSuYeuCau còn trả mã thô');
  });
}
