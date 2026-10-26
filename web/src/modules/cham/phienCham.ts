import { useRef, useState } from 'react';
import { baiKeTiep, type ViTriO } from '@shared/domain/index.ts';
import type { KetThucHop } from '../fasttrack/HopNhapDiem.tsx';

/** Nút của nơi gọi khi hết phần người xem ở lưới: "Lớp tiếp: {mã} ›" / "Việc tiếp ›"; null → "Đóng". */
export type OnHet = () => KetThucHop['nut'];

/**
 * PHIÊN CHẤM LIỀN MẠCH (R1-LUU-TIEP, thiết kế 26/10 mục 4.1 luật 5–7) — một phiên = từ lúc mở hộp đầu tiên tới khi đóng hộp (X / Esc / bấm ngoài):
 * ẢNH CHỤP thứ tự hàng lúc mở (lọc / tải lại không làm lệch bài kế), các bài đã lưu trong phiên (dữ liệu có thể chưa kịp tải lại → không mở lại),
 * trạng thái hết. Dùng chung lưới FT, màn một kỹ năng, Speaking chéo, trang một em.
 */
export function usePhienCham() {
  const thuTu = useRef<number[] | null>(null);
  const daLuu = useRef(new Set<string>());
  const [het, setHet] = useState(false);
  const khoa = (v: ViTriO) => `${v.khoa}:${v.kyNang}`;
  const ke = (hienTai: ViTriO, conThieu: (v: ViTriO) => boolean, kyNangToi: readonly string[], ds: () => number[]) =>
    baiKeTiep(thuTu.current ?? ds(), (v) => !daLuu.current.has(khoa(v)) && conThieu(v), hienTai, kyNangToi);
  return {
    het,
    /** Mở một hộp: chụp thứ tự hàng nếu phiên chưa có. */
    mo: (ds: () => number[]) => { thuTu.current ??= ds(); setHet(false); },
    dong: () => { thuTu.current = null; daLuu.current.clear(); setHet(false); },
    ke,
    /** "Lưu · bài tiếp": ghi bài vừa lưu, trả ô kế; hết → trạng thái hết (hộp ở lại trên ô hiện tại). */
    tiep: (hienTai: ViTriO, daLuuO: boolean, conThieu: (v: ViTriO) => boolean, kyNangToi: readonly string[], ds: () => number[]) => {
      if (daLuuO) daLuu.current.add(khoa(hienTai));
      const k = ke(hienTai, conThieu, kyNangToi, ds);
      if (!k) setHet(true);
      return k;
    },
    soDaLuu: () => daLuu.current.size,
  };
}
