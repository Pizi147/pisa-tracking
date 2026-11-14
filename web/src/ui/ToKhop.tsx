import { boDau } from '@shared/huongDan/kieu.ts';

/**
 * UI-CON-LAI k1: tô chữ khớp (không dấu, không hoa thường) bằng màu hồng nhận diện — chuỗi dựng sẵn NFC nên mỗi ký tự bỏ dấu vẫn là một ký tự.
 * GD-5: khớp bỏ qua dấu cách như bộ lọc (`locNguoiChon`: "ft101" ra "MB FT 101") — tô từ ký tự khớp đầu tới ký tự khớp cuối.
 */
export function ToKhop({ chu, q }: { chu: string; q: string }) {
  const kim = boDau(q).toLowerCase().replace(/\s+/g, '');
  const ky = [...chu];
  /* Chuỗi NFD (dấu tách rời) làm lệch vị trí → không tô, vẫn hiện tên. */
  if (!kim || ky.map((c) => boDau(c)).join('').length !== ky.length) return <>{chu}</>;
  const viTri: number[] = [];   // chỉ số trong `ky` của từng ký tự không phải dấu cách
  let rom = '';
  ky.forEach((c, i) => { if (!/\s/.test(c)) { viTri.push(i); rom += boDau(c).toLowerCase(); } });
  const i = rom.indexOf(kim);
  if (i < 0) return <>{chu}</>;
  const dau = viTri[i], cuoi = viTri[i + kim.length - 1] + 1;
  return <>{ky.slice(0, dau).join('')}<mark className="tim-khop">{ky.slice(dau, cuoi).join('')}</mark>{ky.slice(cuoi).join('')}</>;
}
