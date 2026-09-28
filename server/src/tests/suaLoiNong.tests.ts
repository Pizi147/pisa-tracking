/** PHÉP KIỂM PR-N1 — sửa lỗi nóng + sửa sai sự thật (kế hoạch 2026-09-28). Harness do run.ts truyền vào. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

/* Chạy từ `dist-server/server/src/tests/` → lên 3 cấp là `dist-server/`, thêm một cấp là gốc repo. */
const REPO = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), '..');
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const docSach = (rel: string) => boChuThich(fs.readFileSync(path.join(REPO, rel), 'utf8'));

export async function runSuaLoiNongTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-N1 · Sửa lỗi nóng + sửa sai sự thật');

  check('N1 (0) · REPO trỏ đúng gốc worktree (đọc được mã nguồn cho các phép kiểm soi mã)', () => {
    assert(fs.existsSync(path.join(REPO, 'package.json')) && fs.existsSync(path.join(REPO, 'shared/domain/cases.ts')), `REPO = ${REPO}`);
    assert(/export function weeklyUpdateDue/.test(docSach('shared/domain/cases.ts')), 'docSach không đọc được cases.ts');
  });

  check('N1 (1) · weeklyUpdateDue: kết quả tuần T2→CN ghi trước hết Thứ Hai tuần sau (R-PA1)', () => {
    const ca: [string, string][] = [['2026-09-21', '2026-09-28'], ['2026-09-24', '2026-09-28'],
      ['2026-09-27', '2026-09-28'], ['2026-09-28', '2026-10-05']];
    for (const [tu, han] of ca) assert(d.weeklyUpdateDue(tu) === han, `${tu} → ${d.weeklyUpdateDue(tu)} (cần ${han})`);
    assert(new Date('2026-09-28T00:00:00Z').getUTCDay() === 1, '28/09/2026 phải là Thứ Hai');
  });
  check('N1 (1) · planEndDefault giữ Chủ nhật tuần tiếp theo (dự kiến kết thúc không phải hạn)', () => {
    assert(d.planEndDefault('2026-09-16') === '2026-09-27', d.planEndDefault('2026-09-16'));
    assert(d.planEndDefault('2026-09-20') === '2026-09-27', d.planEndDefault('2026-09-20'));
  });
  check('N1 (1) · hanTheoNgay tính cả ngày đầu; planDueDate/signalVerifyDue không đổi kết quả (K5-20)', () => {
    assert(d.hanTheoNgay('2026-09-14', 5) === '2026-09-18' && d.hanTheoNgay('2026-09-14', 1) === '2026-09-14', 'hanTheoNgay');
    assert(d.planDueDate('2026-09-14', 'urgent') === '2026-09-16' && d.signalVerifyDue('2026-09-14') === '2026-09-16', 'hạn 3 ngày');
    assert(d.HAN_DUYET_NGAY === 5, 'HAN_DUYET_NGAY');
  });
  check('N1 (1) · deadlineView cap-nhat-pa: "Ghi kết quả tuần W4 SEP · hạn hết T2 28/09" (R-PA3)', () => {
    const v = d.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-28', today: '2026-09-24' });
    assert(v.viec === 'Ghi kết quả tuần W4 SEP' && v.han === 'hạn hết T2 28/09' && v.tone === 'waiting', JSON.stringify(v));
    assert(d.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-28', today: '2026-09-28' }).homNay, 'đúng Thứ Hai là hôm nay');
    assert(d.deadlineView({ kind: 'cap-nhat-pa', due: '2026-09-28', today: '2026-09-30' }).quaHan === 'quá hạn 2 ngày', 'quá hạn');
    assert(!/CN|Chủ nhật/.test(v.text), v.text);
  });
  check('N1 (1) · nhanTuanGhiKetQua: một tuần / ghi bù nhiều tuần (K3-17)', () => {
    assert(d.nhanTuanGhiKetQua('2026-09-28', '2026-09-28').tieuDe === 'Kết quả tuần W4 SEP', 'một tuần');
    const bu = d.nhanTuanGhiKetQua('2026-09-14', '2026-09-29');
    assert(bu.tieuDe === 'Kết quả W2–W4 SEP (ghi bù 3 tuần)' && bu.soTuan === 3, JSON.stringify(bu));
    assert(d.nhanTuanGhiKetQua(null, '2026-09-29').tieuDe === 'Kết quả tuần này', 'không hạn');
  });
  check('N1 (1) · chữ luật PA không còn "Chủ nhật" (K3 §4c #3)', () => {
    assert(!/Chủ nhật/.test(d.PLAN_DECISION_HINT.keep) && !/Chủ nhật/.test(d.cycleDeadlineHint()), 'còn Chủ nhật');
  });
  check('N1 (1) · sosPlanEndDate "1 tháng" vẫn là Chủ nhật (dự kiến kết thúc, không theo hạn Thứ Hai)', () => {
    assert(d.sosPlanEndDate('one_month', { createdOn: '2026-09-21' }) === '2026-10-25', d.sosPlanEndDate('one_month', { createdOn: '2026-09-21' }));
    assert(d.sosPlanEndDate('one_month', { createdOn: '2026-09-25' }) === '2026-11-01', d.sosPlanEndDate('one_month', { createdOn: '2026-09-25' }));
  });
}
