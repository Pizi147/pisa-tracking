import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { capNhatLuuO, tomTatLuuDong, type TrangThaiLuuO } from '@shared/domain/index.ts';
import { Alert, Status } from './ui.tsx';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function SaveIndicator({ status, error, onRetry }: { status: SaveStatus; error?: string; onRetry?: () => void }) {
  if (status === 'idle') return null;
  if (status === 'saving') return <Status kind="doing">Đang lưu…</Status>;
  /* "Đã lưu" là việc xong, không phải điểm tốt — nên xám, không xanh lá (mục 2.2). */
  if (status === 'saved') return <Status kind="done">Đã lưu</Status>;
  return (
    <span className="inline-flex items-center gap-1">
      <Alert title={error}>Lưu lỗi</Alert>
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>Thử lại</button>}
    </span>
  );
}

/**
 * BÁO "n Ô CHƯA LƯU" LÊN TRÊN (PR-UX1): mỗi dòng của lưới chấm báo số ô đang lỗi lưu của nó; lưới cộng lại để đầu trang
 * và hàng lớp ở Lịch Test nói "n ô chưa lưu" cho tới khi hết. Ngoài lưới (không có Provider) thì không làm gì.
 */
export const BaoLuuContext = createContext<((khoa: string, soLoi: number) => void) | null>(null);

export function useBaoLuu(khoa: string, soLoi: number) {
  const bao = useContext(BaoLuuContext);
  useEffect(() => { bao?.(khoa, soLoi); }, [bao, khoa, soLoi]);
  useEffect(() => () => { bao?.(khoa, 0); }, [bao, khoa]);
}

/**
 * TRẠNG THÁI LƯU THEO TỪNG Ô của MỘT dòng (luật ở `capNhatLuuO` / `tomTatLuuDong`). Dùng chung cho `useSaveScore` (FT) và
 * `useLuuThuong` (lớp thường). Ô lỗi giữ lại đúng lệnh đã gửi (`hong`) để "Lưu lại" gửi lại y nguyên; giá trị đã gõ vẫn
 * nằm trong ô vì ô chỉ bỏ bản nháp khi lưu THÀNH CÔNG.
 */
export function useTrangThaiLuuO<B>(khoaBao: string) {
  const [o, setO] = useState<Record<string, TrangThaiLuuO>>({});
  const [loi, setLoi] = useState<Record<string, string>>({});
  const hong = useRef(new Map<string, B>());
  const boLoi = (k: string) => setLoi((x) => { if (!(k in x)) return x; const n = { ...x }; delete n[k]; return n; });
  const tong = tomTatLuuDong(Object.values(o));
  useBaoLuu(khoaBao, tong.soLoi);
  return {
    o, loi, hong, soLoi: tong.soLoi,
    status: (tong.tt === 'loi' ? 'error' : tong.tt === 'dang-luu' ? 'saving' : tong.tt === 'da-luu' ? 'saved' : 'idle') as SaveStatus,
    lastError: Object.values(loi)[0],
    batDau: (k: string) => setO((x) => capNhatLuuO(x, k, 'bat-dau')),
    thanhCong: (k: string) => { hong.current.delete(k); boLoi(k); setO((x) => capNhatLuuO(x, k, 'thanh-cong')); },
    hongO: (k: string, body: B, cau: string) => {
      hong.current.set(k, body); setLoi((x) => ({ ...x, [k]: cau })); setO((x) => capNhatLuuO(x, k, 'loi'));
    },
    bo: (k: string) => { hong.current.delete(k); boLoi(k); setO((x) => capNhatLuuO(x, k, 'bo')); },
  };
}
