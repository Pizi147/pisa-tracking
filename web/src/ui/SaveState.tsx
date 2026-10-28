import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { capNhatLuuO, tomTatLuuDong, type TrangThaiLuuO } from '@shared/domain/index.ts';
import { ChuLuu } from './KhuonViec.tsx';
import { t } from '@shared/i18n/index.ts';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** NEN-PANEL: cùng chữ + ký hiệu với chân panel (`ChuLuu`) — bản gọn cho hàng lưới. "Đã lưu" là việc xong, xám (mục 2.2). */
export function SaveIndicator({ status, error, onRetry }: { status: SaveStatus; error?: string; onRetry?: () => void }) {
  if (status === 'idle') return null;
  if (status !== 'error') return <span className="text-[13px]"><ChuLuu tt={status === 'saving' ? 'dang' : 'da'} /></span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <ChuLuu tt="loi" loi={error} gon />
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>{t('Thử lại')}</button>}
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
 * BÁO "CÒN Ô ĐANG LƯU / LƯU HỎNG" LÊN TRÊN (PR-DL): bảng điểm theo lượt chặn đổi lượt khi còn ô đang gửi (hộp hỏi) hoặc ô
 * lưu hỏng, để không bỏ mất điểm đã gõ. Hai số báo CÙNG lúc nên nơi nghe không thấy khoảnh khắc "hết đang lưu mà chưa
 * báo lỗi". Ngoài bảng đó (không có Provider) thì không làm gì.
 */
export const BaoDangLuuContext = createContext<((khoa: string, dangLuu: boolean, soLoi: number) => void) | null>(null);

/**
 * HỘP LÝ DO SỬA ĐIỂM ĐANG MỞ = MỘT Ô CHƯA LƯU (PR-DL fix 2): báo CHỈ qua `BaoDangLuuContext` (bảng điểm theo lượt chặn đổi lượt),
 * không qua `BaoLuuContext` — lưới cũ không hiện thêm "n ô chưa lưu". Gọi trong hộp (chỉ gắn khi hộp mở). `dangGui`: hộp đang gửi
 * lệnh sửa → báo "đang lưu" (bấm đổi lượt ra câu "Còn ô đang lưu…"), không phải "chưa lưu". `chuaLuu` (OV-4b hộp nhập điểm): chỉ
 * báo "chưa lưu" khi hộp có chữ đã gõ.
 */
export function useBaoHopLyDoMo(dangGui: boolean, chuaLuu = true) {
  useBaoDangLuu(`hop-ly-do:${useId()}`, dangGui, dangGui || !chuaLuu ? 0 : 1);
}

/** Báo một khoá lên `BaoDangLuuContext`; gỡ thì báo hết. */
function useBaoDangLuu(khoa: string, dang: boolean, loi: number) {
  const bao = useContext(BaoDangLuuContext);
  useEffect(() => { bao?.(khoa, dang, loi); }, [bao, khoa, dang, loi]);
  useEffect(() => () => { bao?.(khoa, false, 0); }, [bao, khoa]);
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
  /* C9 (PR-HSM): ô gõ sai (chưa gửi được gì) cũng là "ô chưa lưu" của dòng — nhưng không có lệnh để "Lưu lại". */
  const [loiNhapO, setLoiNhapO] = useState<Record<string, string>>({});
  const boLoi = (k: string) => setLoi((x) => { if (!(k in x)) return x; const n = { ...x }; delete n[k]; return n; });
  const tong = tomTatLuuDong(Object.values(o));
  const soLoiNhap = Object.keys(loiNhapO).filter((k) => o[k] !== 'loi').length;
  const soLoi = tong.soLoi + soLoiNhap;
  useBaoLuu(khoaBao, soLoi);
  useBaoDangLuu(khoaBao, Object.values(o).includes('dang-luu'), soLoi);
  return {
    o, loi, hong, soLoi,
    /** Có ô lỗi GỬI (mạng/5xx) — chỉ lúc đó dòng mới có "Lưu lại"; lỗi nhập thì sửa ngay tại ô. */
    coGuiLai: tong.soLoi > 0,
    loiNhap: (k: string, cau: string | null) => setLoiNhapO((x) => {
      if ((x[k] ?? null) === cau) return x;
      const n = { ...x };
      if (cau) n[k] = cau; else delete n[k];
      return n;
    }),
    status: (tong.tt === 'loi' ? 'error' : tong.tt === 'dang-luu' ? 'saving' : tong.tt === 'da-luu' ? 'saved' : 'idle') as SaveStatus,
    lastError: Object.values(loi)[0] ?? Object.values(loiNhapO)[0],
    batDau: (k: string) => setO((x) => capNhatLuuO(x, k, 'bat-dau')),
    thanhCong: (k: string) => { hong.current.delete(k); boLoi(k); setO((x) => capNhatLuuO(x, k, 'thanh-cong')); },
    hongO: (k: string, body: B, cau: string) => {
      hong.current.set(k, body); setLoi((x) => ({ ...x, [k]: cau })); setO((x) => capNhatLuuO(x, k, 'loi'));
    },
    bo: (k: string) => { hong.current.delete(k); boLoi(k); setO((x) => capNhatLuuO(x, k, 'bo')); },
  };
}

