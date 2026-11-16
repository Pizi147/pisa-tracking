import { caseCategoryLabel, caseTopicLabel } from './cases.ts';
import { tenMon, tenMonNgan } from './normal.ts';

/**
 * GD-21 (chủ SP 15/11): ĐỀ MỤC CASE chỉ hiện khi GV ĐÃ SỬA tên — hàm thuần, 0 câu.
 * Máy chủ sinh tên Case ở nhiều dạng (`caseTitle`, `caseTitleOf`, `tenCaseSos`, `tenCaseThuong`, phần giữa `{kỹ năng} không đạt`):
 * "[MT2] Reading không đạt [SOS 3]", "[Progress Test] Writing Progress Test chưa đạt [SOS 3]", "MT2 - Reading dưới kỳ vọng", "Reading"…
 * Có thể được LƯU vào `title` (xác nhận Case lưu phần giữa mặc định). So sau khi BỎ: mọi "[…]" (MTn, SOS n, KCK, Progress / Final Test), tiền tố "MTn - " /
 * "Progress Test - " / "Final Test - ", chữ "Progress Test" / "Final Test" chen giữa, đuôi "không đạt" / "chưa đạt" / "dưới kỳ vọng" — còn lại đúng tên môn
 * (dài · ngắn · theo chương trình · nhãn nhóm Case) thì là tên tự sinh. Khác → GV tự đặt.
 */
const chuan = (s: string) => s
  .replace(/\[[^\]]*\]/g, ' ')
  .replace(/\b(?:MT\d+|Progress Test|Final Test|Mock Test)\s*-\s*/gi, ' ')
  .replace(/\b(?:Progress Test|Final Test|Mock Test)\b/gi, ' ')
  .replace(/\s+(?:không đạt|chưa đạt|dưới kỳ vọng)\s*$/i, '')
  .replace(/\s+/g, ' ').trim().toLowerCase();

export function deMucRieng(c: { title?: string | null; mon?: string | null; topic?: string | null; ct?: string | null }): string | null {
  const own = (c.title ?? '').trim();
  if (!own) return null;
  const mon = c.mon ?? c.topic ?? '';
  /* Tên môn ngắn của lớp thường (FOU "G+V", Pre FOU "Tổng hợp"): Case Progress gắn mã môn khác (dữ liệu thật có `writing` ↔ "G+V không đạt"). */
  const mac = new Set<string>(['g+v', 'grammar + vocabulary', 'tổng hợp']);
  /* Case Writing chung: tên tự sinh có thể mang tên task ("Writing Task 2 không đạt") — phép kiểm GD-21 (prPilotCase) đòi null. */
  const mons = mon === 'writing' ? ['writing', 'writing1', 'writing2'] : [mon];
  for (const ct of [c.ct ?? null, null]) for (const m of mons) for (const ten of [tenMon(ct, m), tenMonNgan(ct, m), caseTopicLabel(m, ct), caseCategoryLabel(m)]) mac.add(chuan(ten));
  const g = chuan(own);
  /* một chữ cái = mã kỹ năng ngắn ("P không đạt" — Case Progress lớp BE, dữ liệu thật) */
  return !g || g.length === 1 || mac.has(g) ? null : own;
}
