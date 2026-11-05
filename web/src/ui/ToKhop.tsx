import { boDau } from '@shared/huongDan/index.ts';

/** UI-CON-LAI k1: tô chữ khớp (không dấu, không hoa thường) bằng màu hồng nhận diện — chuỗi dựng sẵn NFC nên mỗi ký tự bỏ dấu vẫn là một ký tự. */
export function ToKhop({ chu, q }: { chu: string; q: string }) {
  const kim = boDau(q.trim()).toLowerCase();
  const ky = [...chu];
  const rom = ky.map((c) => boDau(c).toLowerCase()).join('');
  /* Chuỗi NFD (dấu tách rời) làm lệch vị trí → không tô, vẫn hiện tên. */
  const i = kim && rom.length === ky.length ? rom.indexOf(kim) : -1;
  if (i < 0) return <>{chu}</>;
  return <>{ky.slice(0, i).join('')}<mark className="tim-khop">{ky.slice(i, i + kim.length).join('')}</mark>{ky.slice(i + kim.length).join('')}</>;
}

