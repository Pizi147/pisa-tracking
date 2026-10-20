import { useEffect, useRef, type RefObject, type SyntheticEvent } from 'react';

/**
 * "BẤM RA NGOÀI THÌ ĐÓNG" — MỘT luật cho mọi hộp nổi / menu (KHUNG-LOI, tài liệu đánh giá 12.7; thay 15 bản tự viết).
 * Cú `mousedown` là "trong" khi đích nằm trong một `trong` (DOM), HOẶC sự kiện đi qua phần tử gắn `onMouseDownCapture` trả về — React đẩy sự kiện
 * theo CÂY REACT, nên bấm trong portal con (lịch `LichNho`, `MenuDong`, hộp chọn người) vẫn là "trong" dù nằm ngoài hộp trên cây DOM (V3B-09).
 * So bằng chính đối tượng sự kiện (không cờ tồn đọng). Chỉ nghe khi `mo`. Esc để từng nơi tự lo (mỗi nơi một luật lớp trên cùng).
 */
export function useBamNgoai(mo: boolean, onNgoai: (e: MouseEvent) => void, ...trong: RefObject<Element | null>[]) {
  const cb = useRef(onNgoai);
  cb.current = onNgoai;
  const quaCay = useRef<Event | null>(null);
  useEffect(() => {
    if (!mo) return undefined;
    const bam = (e: MouseEvent) => {
      if (quaCay.current === e) return;
      const t = e.target as Node;
      if (trong.some((r) => r.current?.contains(t))) return;   // RefObject ổn định: closure lần mở là đủ
      cb.current(e);
    };
    document.addEventListener('mousedown', bam);
    return () => document.removeEventListener('mousedown', bam);
  }, [mo]); // eslint-disable-line react-hooks/exhaustive-deps
  return { onMouseDownCapture: (e: SyntheticEvent) => { quaCay.current = e.nativeEvent; } };
}
