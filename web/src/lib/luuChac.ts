/** OV-14a (audit 17/10): lưu chắc chắn — hàm thuần, không React, để phép kiểm `prOv14a` gọi thẳng. */

/** Mỗi lần gọi hàm trả về là mở một lượt; nó trả hàm cho biết lượt đó còn là lượt MỚI NHẤT không — phản hồi cũ về sau thì bỏ (F04). */
export function taoLuot() {
  let n = 0;
  return () => { const m = ++n; return () => m === n; };
}

/** Khoá nháp một ô Góp ý: có NGƯỜI đăng nhập — máy dùng chung, người sau cùng tab không thấy (và không lưu dưới tên mình) chữ của người trước. */
export const khoaNhapO = (uid: number | undefined, classId: number, tuan: string, sid: number, skill: string) => `${uid ?? 0}:${classId}:${tuan}:${sid}:${skill}`;

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

/**
 * F01 (audit 03/11): các ô `taoOLuu` của MỘT phiếu (bàn giao): `xong()` chờ mọi lần lưu đang chạy — kể cả ô vừa gỡ khi đổi em / đóng panel;
 * `chuaLuu` giữ chữ của ô lưu lỗi theo khoá ô (mở lại ô đó thì chữ còn; Xác nhận phiếu không chạy bằng bản cũ). `doi`: báo nơi dùng vẽ lại.
 */
export function taoHangLuu(doi: () => void = () => {}) {
  const cho = new Set<Promise<unknown>>();
  const chuaLuu = new Map<string, string>();
  return {
    cho,
    chuaLuu,
    daBaoDong: false,
    async xong() { while (cho.size) await Promise.allSettled([...cho]); },
    /** Một ô của phiếu: như `taoOLuu`, thêm — lần lưu vào `cho`; lưu lỗi thì chữ vào `chuaLuu[khoa]`, lưu được / gõ về bản máy chủ thì bỏ. */
    o(khoa: string, daLuu: string, gui: (v: string | null) => Promise<string | null>, bao: (tt: TrangThaiO, lyDo: string) => void) {
      const x = taoOLuu(daLuu, gui, (tt, lyDo) => {
        const truoc = chuaLuu.has(khoa);
        if (tt === 'loi') chuaLuu.set(khoa, x.nhap()); else if (!x.chuaLuu()) chuaLuu.delete(khoa);
        if (truoc !== chuaLuu.has(khoa)) doi();
        bao(tt, lyDo);
      });
      return {
        ...x,
        luu: () => { const p = x.luu(); cho.add(p); void p.finally(() => cho.delete(p)); return p; },
        go: (v: string) => { x.go(v); if (chuaLuu.has(khoa)) chuaLuu.set(khoa, v); },
      };
    },
  };
}
export type HangLuu = ReturnType<typeof taoHangLuu>;

/**
 * Đóng phiếu sau khi lần lưu đang chạy xong; lần đó lỗi thì ở lại (chữ còn trong ô). `nut` (nút Đóng ở chân — không qua hộp hỏi của panel):
 * còn ô lỗi từ trước thì báo một lần, bấm lần nữa mới đóng. ✕ / Esc / nền: panel đã hỏi "Bỏ chữ, đóng" (`chan.daSua`).
 */
export function dongSauKhiLuu(hang: HangLuu, onClose: () => void, baoLoi: (n: number) => void, nut = false) {
  return async () => {
    const coCho = hang.cho.size > 0;
    await hang.xong();
    if (hang.chuaLuu.size && (coCho || (nut && !hang.daBaoDong))) { hang.daBaoDong = true; baoLoi(hang.chuaLuu.size); return; }
    onClose();
  };
}
