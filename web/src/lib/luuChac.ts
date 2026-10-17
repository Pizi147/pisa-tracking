/** OV-14a (audit 17/10): lưu chắc chắn — hàm thuần, không React, để phép kiểm `prOv14a` gọi thẳng. */

/** Mỗi `bat()` mở một lượt; hàm trả về cho biết lượt đó còn là lượt MỚI NHẤT không — phản hồi của lượt cũ về sau thì bỏ (F04). */
export function taoLuot() {
  let n = 0;
  return { bat: () => { const m = ++n; return () => m === n; } };
}

export type TrangThaiO = 'idle' | 'dang' | 'xong' | 'loi';

/**
 * Một ô chữ lưu khi rời ô (F01): không bao giờ hai lần gửi cùng lúc; gõ thêm khi đang gửi thì chữ mới KHÔNG bị ghi đè, và lần lưu được
 * yêu cầu trong lúc gửi chạy tiếp ngay sau (xếp lượt). Chỉ báo `xong` khi chữ đang có = chữ máy chủ đã nhận.
 * `gui` trả `null` = đã lưu; chuỗi = lỗi ('' = lỗi mạng, chữ khác = lý do máy chủ).
 */
export function taoOLuu(daLuu: string, gui: (v: string | null) => Promise<string | null>, bao: (tt: TrangThaiO, lyDo: string) => void) {
  let nhap = daLuu;
  let tt: TrangThaiO = 'idle';
  let dang: Promise<void> | null = null;
  let xepLuot = false;
  const dat = (x: TrangThaiO, lyDo = '') => { tt = x; bao(x, lyDo); };
  const khac = () => nhap.trim() !== daLuu.trim();
  const luu = (): Promise<void> => {
    if (dang) { xepLuot = true; return dang; }
    if (!khac()) { if (tt === 'loi') dat('idle'); return Promise.resolve(); }
    const v = nhap.trim();
    dat('dang');
    dang = gui(v || null).catch(() => '').then((loi) => {
      dang = null;
      const lai = xepLuot;
      xepLuot = false;
      if (loi !== null) return dat('loi', loi);
      daLuu = v;
      if (!khac()) return dat('xong');
      if (lai) return luu();
      dat('idle');
    });
    return dang;
  };
  return {
    luu,
    go: (v: string) => { nhap = v; if (tt !== 'dang') dat('idle'); },
    nhap: () => nhap,
    chuaLuu: khac,
    /** Bản máy chủ mới (tải lại / vừa lưu): chưa gõ gì thì nhận và trả chữ mới cho ô; đang gõ dở thì giữ chữ, trả `null`. */
    nhanGoc: (v: string): string | null => {
      const sach = nhap === daLuu;
      daLuu = v;
      if (!sach) return null;
      nhap = v;
      return v;
    },
  };
}
