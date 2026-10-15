import type { ReactNode } from 'react';
import { Han } from '../../ui/Han.tsx';
import { CHU_CHUYEN_LOP, mondayOfDate, ngay, thuNgay, tuanLich, type DaiHocVien, type DaiLop } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * CÁC DẢI CHUYỂN LỚP / BÀN GIAO (PR-CT, mockup 20 — A · E · H). Mỗi dải MỘT dòng chữ + tối đa MỘT nút chính; chữ tuần là mã tuần (`W2 OCT`), ngày chỉ ở hạn cụ thể
 * và nhật ký. Nút hiện theo QUYỀN do máy chủ trả (`viewer`, `nut`) — web không tự đoán vai. Dải đỏ = đã vào tuần kết thúc mà còn em chưa có lệnh (token `late`).
 */
function Dai({ nhan, do: doHan, children, nut }: { nhan: string; do?: boolean; children: ReactNode; nut?: ReactNode }) {
  return (
    <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2 text-sm ${
      doHan ? 'border-late-line bg-late-bg' : ''}`} style={doHan ? undefined : { borderColor: 'var(--line)', background: 'var(--surface-2, transparent)' }}>
      <span className={`shrink-0 font-bold ${doHan ? 'text-late' : 'text-slate-100'}`}>{nhan}</span>
      {/* Dưới sm (375 px): chữ một dòng riêng, nút xuống dưới — không ép ba cột dồn chữ (PR-S5F-a, mockup 20). */}
      <span className="min-w-0 basis-full text-slate-300 sm:basis-0 sm:flex-1">{children}</span>
      {nut && <span className="flex shrink-0 flex-wrap items-center gap-1.5">{nut}</span>}
    </div>
  );
}

/** Hồ sơ lớp, dải ngay dưới đầu trang: A (nguồn — Kết thúc khoá / Bàn giao) và H (đích — Sắp nhận). */
export function DaiLopChuyen({ dai, homNay, onChuyenTiep, onBanGiao, anLoTrinh = false }: {
  dai: DaiLop | null; homNay: string | null;
  /** CA2-6: đang ở cách xem "Lộ trình tiếp theo" thì không nhắc lại dải mở chính chỗ đó. */
  anLoTrinh?: boolean;
  onChuyenTiep: () => void;
  /** Mở panel Bàn giao: `lop` = lớp NGUỒN (mặc định lớp đang xem), `mon` = mở bảng GVBM của môn đó. */
  onBanGiao: (o: { lop?: number; mon?: string }) => void;
}) {
  if (!dai) return null;
  const lt = dai.loTrinh;
  const v = dai.viewer;
  const h = homNay ?? '';
  return (
    <div className="space-y-2">
      {dai.chuaChuyenDuoc && (
        <Dai nhan={t('Chưa chuyển được')} do
          nut={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onChuyenTiep}>{dich(CHU_CHUYEN_LOP.sua)}</button>}>
          <b className="tabular-nums text-slate-100">{t('{n} em', { n: dai.chuaChuyenDuoc.n })}</b> · {dich(dai.chuaChuyenDuoc.loi.replace(/\.$/, ''))} · {t('chọn tuần hoặc lớp chuyển đến mới, hoặc huỷ quyết định')}
        </Dai>
      )}
      {lt && !anLoTrinh && (
        /* HL-5 · CA2-6: hạn chốt bằng `<Han>` (quá hạn có ⚠ + chữ, không chỉ màu) như dải Bàn giao. */
        <Dai nhan={t('Lộ trình tiếp theo')} do={lt.do}
          nut={<button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={onChuyenTiep}>{v.coTheRaLenh ? t('Chốt lộ trình') : t('Xem')}</button>}>
          <b className="tabular-nums text-slate-100">{t('{a}/{b} em', { a: lt.daChot, b: lt.tong })}</b> {t('đã chốt')}{lt.hanChot && <> · <Han loai="viec-van-hanh" han={lt.hanChot} /></>}
        </Dai>
      )}
      {dai.banGiao && (v.laGvcn || v.xacNhanDuoc) && (
        <Dai nhan={t('Bàn giao')} nut={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onBanGiao({})}>{t('Mở phiếu')}</button>}>
          <b className="tabular-nums text-slate-100">{t('{a}/{b} em', { a: dai.banGiao.daXacNhan, b: dai.banGiao.tong })}</b> {t('đã xác nhận')}{dai.banGiao.hanGvcn && <> · <Han loai="viec-van-hanh" han={dai.banGiao.hanGvcn} /></>}
        </Dai>
      )}
      {dai.banGiao && !v.laGvcn && !v.xacNhanDuoc && v.coTheRaLenh && (
        <Dai nhan={t('Bàn giao')} nut={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onBanGiao({})}>{t('Xem')}</button>}>
          {t('GVCN đang bàn giao')} · <b className="tabular-nums text-slate-100">{t('{a}/{b} em', { a: dai.banGiao.daXacNhan, b: dai.banGiao.tong })}</b> {t('đã xác nhận')}{dai.banGiao.hanGvcn && <> · <Han loai="viec-van-hanh" han={dai.banGiao.hanGvcn} /></>}
        </Dai>
      )}
      {dai.banGiaoMon.map((m) => (
        <Dai key={m.mon} nhan={t('Bàn giao môn {mon}', { mon: m.monNgan })} nut={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onBanGiao({ mon: m.mon })}>{t('Ghi bàn giao')}</button>}>
          <b className="tabular-nums text-slate-100">{t('{a}/{b} em', { a: m.daGhi, b: m.tong })}</b>{m.han && <> · <Han loai="viec-van-hanh" han={m.han} /></>}
        </Dai>
      ))}
      {dai.sapNhan && (
        <Dai nhan={t('Sắp nhận')}
          nut={dai.sapNhan.daXacNhan > 0 ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onBanGiao({ lop: dai.sapNhan!.tuLop[0].id })}>{t('Xem')}</button> : undefined}>
          <b className="tabular-nums text-slate-100">{t('{n} em', { n: dai.sapNhan.n })}</b> {t('từ {lop} vào lớp từ {tuan} · bàn giao {a}/{b} đã xác nhận', { lop: dai.sapNhan.tuLop.map((l) => l.code).join(', '), tuan: tuanLich(dai.sapNhan.tuan, h), a: dai.sapNhan.daXacNhan, b: dai.sapNhan.n })}
        </Dai>
      )}
    </div>
  );
}

/** Hồ sơ học viên, ngay dưới dòng thông tin đầu trang: E — "Sắp chuyển" (từ lúc có lệnh) hoặc "Đã chuyển" (14 ngày sau khi chuyển). */
export function DaiHocVienChuyen({ dai, homNay, onLam }: {
  dai: DaiHocVien | null; homNay: string | null; onLam: (viec: DaiHocVien['nut'][number]) => void;
}) {
  if (!dai) return null;
  const h = homNay ?? '';
  const bg = dai.banGiao;
  const nutBtn = (k: DaiHocVien['nut'][number], nhan: string) => (
    <button key={k} type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onLam(k)}>{nhan}</button>
  );
  const nut = [
    dai.nut.includes('ban-giao') ? nutBtn('ban-giao', t('Bàn giao')) : null,
    dai.nut.includes('ban-giao-mon') && dai.mon ? nutBtn('ban-giao-mon', t('Bàn giao môn {mon}', { mon: dai.mon.ngan })) : null,
    dai.nut.includes('huy-lenh') ? nutBtn('huy-lenh', dich(CHU_CHUYEN_LOP.huy)) : null,
    dai.nut.includes('doc-ban-giao') ? nutBtn('doc-ban-giao', t('Đọc bàn giao')) : null,
  ].filter(Boolean);
  if (dai.loai === 'cho-duyet') {
    return (
      <Dai nhan={dich(CHU_CHUYEN_LOP.choDuyetDeXuat)}>
        {dai.lopDich ? t('Sang {lop}', { lop: dai.lopDich.code }) : t('Chưa chọn lớp chuyển đến')}{dai.tuan && ` · ${t('từ {tuan}', { tuan: tuanLich(dai.tuan, h) })}`} · {t('đề xuất của {ai}', { ai: dai.nguoiRaLenh ?? t('GVCN') })}
      </Dai>
    );
  }
  const lopDen = dai.lopDich ? t('Sang {lop}', { lop: dai.lopDich.code }) : dai.huong === 'bao_luu' ? t('Tạm dừng học (bảo lưu)') : t('Rời lớp');
  return (
    <div className="space-y-1">
      <Dai nhan={dai.loai === 'sap' ? dich(CHU_CHUYEN_LOP.sapChuyen(tuanLich(dai.tuan, h))) : t('Đã chuyển')} nut={nut.length ? <>{nut}</> : undefined}>
        {dai.loai === 'sap' ? (
          <>
            {lopDen} · {t('quyết định của {ai}', { ai: dai.nguoiRaLenh ?? t('Quản lý') })}
            {bg && <> · {t('Bàn giao:')} {bg.daXacNhan ? t('GVCN đã xác nhận') : t('đã có {a}/{b} môn', { a: bg.daGhi, b: bg.soMon })}{!bg.daXacNhan && bg.hanGvcn && <> · <Han loai="viec-van-hanh" han={bg.hanGvcn} /></>}</>}
          </>
        ) : (
          <>
            {/* OV-13l: chuyển "Ngay hôm nay" (giữa tuần) → ghi ngày chuyển, không mã tuần. */}
            {dai.tuan && mondayOfDate(dai.tuan) !== dai.tuan ? t('Từ {lop} · {ngay}', { lop: dai.lopNguon.code, ngay: thuNgay(dai.tuan, h) })
              : t('Từ {lop} tuần {tuan}', { lop: dai.lopNguon.code, tuan: tuanLich(dai.tuan, h) })}
            {bg?.daXacNhan && <> · {t('bàn giao của {ai}, xác nhận {ngay}', { ai: bg.nguoiXacNhan ?? t('GVCN'), ngay: ngay(bg.ngayXacNhan, h) })}</>}
            {bg && !bg.daXacNhan && <> · {t('GVCN chưa xác nhận bàn giao')}</>}
          </>
        )}
      </Dai>
      {dai.loi && <p role="alert" className="m-0 text-[12px] text-late">{t('Chưa chuyển được: {loi} — sửa quyết định sang tuần mới hoặc huỷ quyết định.', { loi: dich(dai.loi.replace(/\.$/, '')) })}</p>}
    </div>
  );
}

/** Nhãn nhỏ cạnh tên em trong tuần đầu ở lớp mới (mockup 20 — H). Viền mảnh, chữ xám: thông tin, không phải cảnh báo. */
export function MoiVao() {
  return (
    <span className="ml-1.5 inline-flex items-center whitespace-nowrap rounded border border-muted-line px-[5px] align-middle text-[11.5px] font-normal leading-4 text-muted">{t('mới vào')}</span>
  );
}
