import type { ReactNode } from 'react';
import { Han } from '../../ui/Han.tsx';
import { CHU_CHUYEN_LOP, ngay, tuanLich, type DaiHocVien, type DaiLop } from '@shared/domain/index.ts';

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
export function DaiLopChuyen({ dai, homNay, onChuyenTiep, onBanGiao }: {
  dai: DaiLop | null; homNay: string | null;
  onChuyenTiep: () => void;
  /** Mở panel Bàn giao: `lop` = lớp NGUỒN (mặc định lớp đang xem), `mon` = mở bảng GVBM của môn đó. */
  onBanGiao: (o: { lop?: number; mon?: string }) => void;
}) {
  if (!dai) return null;
  const kt = dai.ketThucKhoa;
  const v = dai.viewer;
  const h = homNay ?? '';
  return (
    <div className="space-y-2">
      {dai.chuaChuyenDuoc && (
        <Dai nhan="Chưa chuyển được" do
          nut={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={onChuyenTiep}>{CHU_CHUYEN_LOP.sua}</button>}>
          <b className="tabular-nums text-slate-100">{dai.chuaChuyenDuoc.n} em</b> · {dai.chuaChuyenDuoc.loi.replace(/\.$/, '')} · chọn tuần hoặc lớp chuyển đến mới, hoặc huỷ quyết định
        </Dai>
      )}
      {kt && (
        <Dai nhan="Kết thúc khoá" do={kt.do}
          nut={v.coTheRaLenh ? <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={onChuyenTiep}>Chuyển tiếp lớp…</button> : undefined}>
          {v.coTheRaLenh ? (
            <>
              {kt.tuanCuoiKhoa ? `Cuối khoá xong tuần ${tuanLich(kt.tuanCuoiKhoa, h)} · ` : ''}
              <b className="tabular-nums text-slate-100">{kt.soChuaLenh} em</b> chưa có quyết định chuyển lớp · lớp kế tiếp nên bắt đầu {tuanLich(kt.tuanGoiY, h)}
            </>
          ) : <>Chờ Quản lý quyết định chuyển lớp · <b className="tabular-nums text-slate-100">{kt.soChuaLenh} em</b></>}
        </Dai>
      )}
      {dai.banGiao && (v.laGvcn || v.xacNhanDuoc) && (
        <Dai nhan="Bàn giao" nut={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onBanGiao({})}>Mở phiếu</button>}>
          <b className="tabular-nums text-slate-100">{dai.banGiao.daXacNhan}/{dai.banGiao.tong} em</b> đã xác nhận{dai.banGiao.hanGvcn && <> · <Han loai="viec-van-hanh" han={dai.banGiao.hanGvcn} /></>}
        </Dai>
      )}
      {dai.banGiao && !v.laGvcn && !v.xacNhanDuoc && v.coTheRaLenh && (
        <Dai nhan="Bàn giao" nut={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onBanGiao({})}>Xem</button>}>
          GVCN đang bàn giao · <b className="tabular-nums text-slate-100">{dai.banGiao.daXacNhan}/{dai.banGiao.tong} em</b> đã xác nhận{dai.banGiao.hanGvcn && <> · <Han loai="viec-van-hanh" han={dai.banGiao.hanGvcn} /></>}
        </Dai>
      )}
      {dai.banGiaoMon.map((m) => (
        <Dai key={m.mon} nhan={`Bàn giao môn ${m.monNgan}`} nut={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onBanGiao({ mon: m.mon })}>Ghi bàn giao</button>}>
          <b className="tabular-nums text-slate-100">{m.daGhi}/{m.tong} em</b>{m.han && <> · <Han loai="viec-van-hanh" han={m.han} /></>}
        </Dai>
      ))}
      {dai.sapNhan && (
        <Dai nhan="Sắp nhận"
          nut={dai.sapNhan.daXacNhan > 0 ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onBanGiao({ lop: dai.sapNhan!.tuLop[0].id })}>Xem</button> : undefined}>
          <b className="tabular-nums text-slate-100">{dai.sapNhan.n} em</b> từ {dai.sapNhan.tuLop.map((l) => l.code).join(', ')} vào lớp từ {tuanLich(dai.sapNhan.tuan, h)} · bàn giao {dai.sapNhan.daXacNhan}/{dai.sapNhan.n} đã xác nhận
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
    dai.nut.includes('ban-giao') ? nutBtn('ban-giao', 'Bàn giao') : null,
    dai.nut.includes('ban-giao-mon') && dai.mon ? nutBtn('ban-giao-mon', `Bàn giao môn ${dai.mon.ngan}`) : null,
    dai.nut.includes('huy-lenh') ? nutBtn('huy-lenh', CHU_CHUYEN_LOP.huy) : null,
    dai.nut.includes('doc-ban-giao') ? nutBtn('doc-ban-giao', 'Đọc bàn giao') : null,
  ].filter(Boolean);
  const dich = dai.lopDich ? `Sang ${dai.lopDich.code}` : dai.huong === 'bao_luu' ? 'Tạm dừng học (bảo lưu)' : 'Rời lớp';
  return (
    <div className="space-y-1">
      <Dai nhan={dai.loai === 'sap' ? CHU_CHUYEN_LOP.sapChuyen(tuanLich(dai.tuan, h)) : 'Đã chuyển'} nut={nut.length ? <>{nut}</> : undefined}>
        {dai.loai === 'sap' ? (
          <>
            {dich} · quyết định của {dai.nguoiRaLenh ?? 'Quản lý'}
            {bg && <> · Bàn giao: {bg.daXacNhan ? 'GVCN đã xác nhận' : `đã có ${bg.daGhi}/${bg.soMon} môn`}{!bg.daXacNhan && bg.hanGvcn && <> · <Han loai="viec-van-hanh" han={bg.hanGvcn} /></>}</>}
          </>
        ) : (
          <>
            Từ {dai.lopNguon.code} tuần {tuanLich(dai.tuan, h)}
            {bg?.daXacNhan && <> · bàn giao của {bg.nguoiXacNhan ?? 'GVCN'}, xác nhận {ngay(bg.ngayXacNhan, h)}</>}
            {bg && !bg.daXacNhan && <> · GVCN chưa xác nhận bàn giao</>}
          </>
        )}
      </Dai>
      {dai.loi && <p role="alert" className="m-0 text-[12px] text-late">Chưa chuyển được: {dai.loi.replace(/\.$/, '')} — sửa quyết định sang tuần mới hoặc huỷ quyết định.</p>}
    </div>
  );
}

/** Nhãn nhỏ cạnh tên em trong tuần đầu ở lớp mới (mockup 20 — H). Viền mảnh, chữ xám: thông tin, không phải cảnh báo. */
export function MoiVao() {
  return (
    <span className="ml-1.5 inline-flex items-center whitespace-nowrap rounded border border-muted-line px-[5px] align-middle text-[11.5px] font-normal leading-4 text-muted">mới vào</span>
  );
}
