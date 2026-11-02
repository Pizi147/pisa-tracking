import { useCallback, useEffect, type ReactNode } from 'react';
import { useBlocker, type BlockerFunction, type Location } from 'react-router-dom';
import { HopBoChu } from './Drawer.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * CHAN-ROI-NHAP (luật không mất chữ đang gõ): trang còn nháp chưa lưu → link, menu, Back trong app hỏi MỘT lần; tải lại / đóng tab dùng hộp của trình duyệt.
 * `moTa` nêu đúng phần sẽ mất. `conTrong` = URL mới vẫn là chỗ giữ nháp (tìm, lọc trên URL) → đi thẳng; hàm phải ổn định (khai ngoài component).
 * Trả hộp hỏi — nơi gọi vẽ ở MỌI nhánh giao diện khi còn nháp (không có hộp thì điều hướng bị giữ mà không ai trả lời).
 */
export function useChanRoiNhap(co: boolean, moTa: string, conTrong: (tu: Location, den: Location) => boolean): ReactNode {
  const giu = useBlocker(useCallback<BlockerFunction>(({ currentLocation, nextLocation }) => co && !conTrong(currentLocation, nextLocation), [co, conTrong]));
  useEffect(() => {
    if (!co) return undefined;
    const chan = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', chan);
    return () => window.removeEventListener('beforeunload', chan);
  }, [co]);
  /* Lưu xong trong lúc hộp đang mở: không còn gì để mất → đi tiếp theo ý đã bấm. */
  useEffect(() => { if (!co && giu.state === 'blocked') giu.proceed(); }, [co, giu]);
  if (!co || giu.state !== 'blocked') return null;
  return <HopBoChu tieuDe={t('Bỏ nháp chưa lưu?')} than={moTa} nut={t('Bỏ nháp, rời đi')} onO={() => giu.reset()} onBo={() => giu.proceed()} />;
}
