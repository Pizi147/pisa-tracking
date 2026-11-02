import { useCallback, useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { useBlocker, useLocation, type BlockerFunction } from 'react-router-dom';
import { taoKhoRoiNhap, type KieuDi, type NguonNhap } from '@shared/domain/index.ts';
import { HopBoChu } from './Drawer.tsx';
import { t } from '@shared/i18n/index.ts';

/** CHAN-ROI-NHAP-2: một kho cả app — router chỉ giữ MỘT blocker, nên trang / panel ghi nguồn nháp vào đây, `ChanRoiNhapGoc` hỏi. */
export const khoRoiNhap = taoKhoRoiNhap();
/** Đổi tài khoản / đăng xuất / đổi góc nhìn: còn nháp thì hỏi TRƯỚC khi làm; `false` = người dùng Ở lại, không làm gì. */
export const quaRoiNhap = (viec: () => Promise<unknown>) => khoRoiNhap.xin(viec);

/**
 * CHAN-ROI-NHAP (luật không mất chữ đang gõ): trang còn nháp chưa lưu → link, menu, Back trong app hỏi MỘT lần; tải lại / đóng tab dùng hộp của trình duyệt.
 * `moTa` nêu đúng phần sẽ mất. `conTrong` = URL mới vẫn là chỗ giữ nháp (tìm, lọc trên URL) → đi thẳng; hàm phải ổn định (khai ngoài component).
 * Hộp vẽ ở gốc app (`ChanRoiNhapGoc`) — mọi nhánh giao diện của trang (lỗi, đang tải) đều trả lời được.
 */
export function useChanRoiNhap(co: boolean, moTa: string, conTrong: NguonNhap['conTrong']): void {
  const id = useId();
  /* Sửa tại chỗ khi số đếm đổi — không gỡ / ghi lại (nguồn ghi sau hỏi trước: panel mở đè phải giữ thứ tự). */
  const nguon = useRef<NguonNhap>({ moTa, conTrong });
  nguon.current.moTa = moTa;
  nguon.current.conTrong = conTrong;
  useEffect(() => {
    if (!co) return undefined;
    khoRoiNhap.dat(id, nguon.current);
    return () => khoRoiNhap.dat(id, null);
  }, [id, co]);
  useEffect(() => {
    if (!co) return undefined;
    const chan = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', chan);
    return () => window.removeEventListener('beforeunload', chan);
  }, [co]);
}

/** Bộ chặn DUY NHẤT của app (vẽ một lần trong App): link / Back sẽ làm mất nháp → hộp chung, hoặc hộp của chính panel đang sửa (không hỏi hai lần). */
export function ChanRoiNhapGoc() {
  useSyncExternalStore(khoRoiNhap.nghe, khoRoiNhap.phien);
  const tu = useLocation();
  const kieu = useRef<KieuDi>('PUSH');
  const giu = useBlocker(useCallback<BlockerFunction>(({ currentLocation, nextLocation, historyAction }) => {
    kieu.current = historyAction;
    return !!khoRoiNhap.giu(currentLocation, nextLocation, historyAction);
  }, []));
  const n = giu.state === 'blocked' ? khoRoiNhap.giu(tu, giu.location, kieu.current) : null;
  const xin = khoRoiNhap.dangXin();
  /* Lưu xong trong lúc hộp đang mở: không còn gì để mất → đi tiếp theo ý đã bấm. */
  useEffect(() => { if (giu.state === 'blocked' && !n) giu.proceed(); }, [giu, n]);
  /* Panel tự hỏi bằng hộp của nó — gọi một lần cho mỗi lần bị giữ. */
  const daGoi = useRef<NguonNhap | null>(null);
  useEffect(() => {
    const p = n?.hoi ? n : xin?.hoi ? xin : null;
    if (!p) { daGoi.current = null; return; }
    if (daGoi.current === p) return;
    daGoi.current = p;
    if (p === n) p.hoi!(() => giu.proceed?.(), () => giu.reset?.());
    else p.hoi!(() => khoRoiNhap.tra(true), () => khoRoiNhap.tra(false));
  }, [n, xin, giu]);
  const hop = n && !n.hoi ? { moTa: n.moTa, di: () => giu.proceed?.(), o: () => giu.reset?.() }
    : xin && !xin.hoi ? { moTa: xin.moTa, di: () => khoRoiNhap.tra(true), o: () => khoRoiNhap.tra(false) } : null;
  if (!hop) return null;
  return <HopBoChu tieuDe={t('Bỏ nháp chưa lưu?')} than={hop.moTa} nut={t('Bỏ nháp, rời đi')} onO={hop.o} onBo={hop.di} />;
}
