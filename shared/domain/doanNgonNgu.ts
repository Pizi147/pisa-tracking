/**
 * P14 DICH (N19, spec 3.11): ĐOÁN ngôn ngữ chữ GV nhập ở trình duyệt — không gọi AI. Chỉ để quyết có hiện nút "Dịch".
 *   có `đ` hoặc ≥ 5 % chữ cái có dấu → vi · không dấu mà ≥ 25 % từ là từ tiếng Anh quen → en · < 3 chữ cái / chỉ mã, số → null.
 * Tiếng Việt gõ không dấu → null (không nút): đoán sai thì tốn lượt dịch vô ích.
 */
export type NgonNguChu = 'vi' | 'en';

const TU_ANH = new Set(('the a an and or but is are was were be been has have had do does did not no to of in on at for with from by '
  + 'this that these those he she they it his her their them you we i my your our very more most good well better needs need '
  + 'should could would will can practice reading writing listening speaking skills skill student students class homework task tasks '
  + 'test score scores improve improved progress weak strong grammar vocabulary pronunciation fluency answer answers questions '
  + 'question still also only some many much time often always sometimes lack lacks makes make made mistakes errors').split(' '));

const coDau = (ch: string) => /[̀-ͯ]/.test(ch.normalize('NFD'));

export function doanNgonNgu(chu: string | null | undefined): NgonNguChu | null {
  const s = (chu ?? '').trim();
  const chuCai = s.match(/\p{L}/gu) ?? [];
  if (chuCai.length < 3) return null;
  if (/[đĐ]/.test(s)) return 'vi';
  if (chuCai.filter(coDau).length / chuCai.length >= 0.05) return 'vi';
  const tu = s.toLowerCase().match(/\p{L}+/gu) ?? [];
  const quen = tu.filter((w) => TU_ANH.has(w)).length;
  return quen > 0 && quen / tu.length >= 0.25 ? 'en' : null;
}

/** Hiện nút "Dịch" khi đoán được ngôn ngữ chữ và nó khác ngôn ngữ giao diện. */
export function canDich(chu: string | null | undefined, giaoDien: NgonNguChu): boolean {
  const ng = doanNgonNgu(chu);
  return ng !== null && ng !== giaoDien;
}
