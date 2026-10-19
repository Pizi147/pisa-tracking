import { useId, type ReactNode } from 'react';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Khoi, Truong } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { useLoiForm } from '../../ui/loiForm.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import {
  GOI_Y_MO_TA_PA, INTERVENTION_KIND_LABEL,
  coNguoiDay, coSoBuoi, interventionKindsFor, khacNguoi, kiemGhiRoKhac, nguoiMacDinh, nhanNguoiDay, nhatKyPa,
  type GiaTriPa, type KetQuaNhatKy, type LoiTruong, type PaNhatKy,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * MỘT FORM PA (PR-PA §8, mockup pa-dong-bo mục 3–7) — Thêm PA · Sửa PA · Thay PA · Xác nhận PA · Điều chỉnh dùng chung khối này:
 * "Phương án" (Loại · Nội dung · Số buổi) + "Người và thời gian" (Người dạy / Người thực hiện · Ngày bắt đầu do nơi gọi đưa vào).
 * Ô hiện theo Loại (`coSoBuoi`, `coNguoiDay`, `nhanNguoiDay`); đổi Loại giữ chữ Nội dung. Không có ô Người theo dõi.
 * Luật thuần (giá trị, lỗi, thân gửi) ở `shared/domain/paDongBo.ts`: `paMoi`, `loiFormPa`, `paPayload`, `thanSuaPa`.
 */

const tenLoai = (k: string) => INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL] ?? k;

export function FormPa({ v, dat, lf, loi, chonLoai, quyChe, toiThieu = 8, daDay = 0, ngay, luat, cuoi, phang, studentId, tienTo = '', batBuoc = false }: {
  v: GiaTriPa; dat: (p: Partial<GiaTriPa>) => void;
  lf: ReturnType<typeof useLoiForm>; loi: readonly LoiTruong[];
  /** Thêm PA / Thay PA: chọn Loại. Không có = Loại khoá (Sửa PA, Xác nhận PA); `phang` mà không chọn Loại (Điều chỉnh) = không có ô Loại. */
  chonLoai?: boolean;
  /** PA theo quy chế (khoá có chữ "theo quy chế"; không có Thay PA nên phụ nói mốc). */
  quyChe?: { mocChu: string | null } | null;
  toiThieu?: number;
  /** Số buổi đã dạy (Sửa PA): Số buổi không nhỏ hơn. */
  daDay?: number;
  /** Ô Ngày bắt đầu (`ChonNgayGan` hoặc `NgayKhoa`) hay ô thay nó; không có = Thay PA (PA mới chạy từ Ngày ghi). */
  ngay?: ReactNode;
  /** ⓘ của khối Phương án · dòng cuối khối Người và thời gian. */
  luat?: ReactNode; cuoi?: ReactNode;
  /** Trong khối con (Thay PA, Điều chỉnh): không chia khối. */
  phang?: boolean;
  studentId?: number | null;
  /** Khoá ô lỗi riêng (cùng `tienTo` của `loiFormPa`) khi form nằm trong panel khác — Thay PA trong Kết quả: 'moi-'. */
  tienTo?: string;
  /** OV-13b (Xác nhận PA): Tutor Số buổi * (cùng `loiFormPa({ batBuoc })`). Người dạy luôn tuỳ chọn (chủ SP 19/10). */
  batBuoc?: boolean;
}) {
  const k = (x: string) => tienTo + x;
  const kinds = interventionKindsFor();
  const nhanNguoi = nhanNguoiDay(v.kind);
  /* Đổi Loại: Nội dung giữ; người còn là mặc định của loại cũ thì đổi theo mặc định của loại mới. */
  const doiLoai = (k: string) => dat({ kind: k, ...(khacNguoi(v.nguoi, nguoiMacDinh(v.kind)) ? {} : { nguoi: nguoiMacDinh(k) }) });

  const loai = chonLoai ? (
    <div>
      <Truong nhan={t('Loại PA')} batBuoc>
        <select className="field w-full" value={v.kind} onChange={(e) => doiLoai(e.target.value)}>
          <optgroup label={t('Bạn tự làm được')}>
            {kinds.selfServe.map((k) => <option key={k} value={k}>{tenLoai(k)}</option>)}
          </optgroup>
          <optgroup label={t('Cần Quản lý duyệt')}>
            {kinds.proposals.map((k) => <option key={k} value={k}>{t('{tenLoai} · cần Quản lý duyệt', { tenLoai: tenLoai(k) })}</option>)}
          </optgroup>
        </select>
      </Truong>
      {/* PA đề xuất "Khác" (T13): ô Tên đề xuất ngay dưới; máy chủ ghép "{tên} — {mô tả}" (Q9). */}
      <OKhac hien={v.kind === 'other_proposal'} value={v.ghiRo} onChange={(x) => dat({ ghiRo: x })} nhan={t('Tên đề xuất')} goiY={t('Ví dụ: Học kèm 1-1 với Tutor')}
        id={lf.oId(k('ghi-ro'))} onBlur={lf.roi(k('ghi-ro'))} loi={lf.hien(k('ghi-ro')) ? kiemGhiRoKhac(v.ghiRo) : null} />
    </div>
  ) : phang ? null : (
    <OKhoa nhan={t('Loại PA')} chu={tenLoai(v.kind)} sau={quyChe ? t('theo quy chế') : undefined}
      phu={quyChe ? (quyChe.mocChu ? t('Kết thúc theo quy chế: {mocChu}', { mocChu: dich(quyChe.mocChu) }) : undefined) : t('Đổi loại: Kết quả › Thay PA')} />
  );

  const phuongAn = <>
    {loai}
    <Truong nhan={t('Nội dung')} batBuoc loi={lf.loiCua(loi, k('noi-dung'))} dem={{ co: v.description.trim().length, can: toiThieu }}>
      <textarea className="field w-full" rows={2} maxLength={2000} {...lf.o(loi, k('noi-dung'))} value={v.description}
        onChange={(e) => dat({ description: e.target.value })} placeholder={GOI_Y_MO_TA_PA} />
    </Truong>
    {coSoBuoi(v.kind) && (
      <Truong nhan={t('Số buổi')} tuyChon={!(batBuoc && v.kind === 'tutor')} batBuoc={batBuoc && v.kind === 'tutor'} loi={lf.loiCua(loi, k('so-buoi'))}
        phu={daDay > 0 ? t('Đã dạy {daDay} buổi — không nhỏ hơn {daDay}', { daDay }) : t('Có số buổi thì web đếm sau mỗi lần Kết quả')}>
        <input className="field w-24 tabular-nums" inputMode="numeric" maxLength={2} {...lf.o(loi, k('so-buoi'))} value={v.soBuoi}
          onChange={(e) => dat({ soBuoi: e.target.value })} placeholder="—" />
      </Truong>
    )}
  </>;

  const nguoi = coNguoiDay(v.kind) ? (
    <Truong nhan={nhanNguoi} tuyChon as="div" loi={lf.loiCua(loi, k('nguoi'))}
      phu={nhanNguoi === 'Người dạy' && !v.nguoi ? t('Chưa biết ai dạy thì để trống — ghi ở Kết quả từng tuần') : undefined}>
      {/* key: đổi nhãn (Người dạy ↔ Người thực hiện) thì ô vẽ lại đúng trạng thái trống / có tên. */}
      <ChonNguoi key={nhanNguoi} nhom="giao_vien" studentId={studentId} cungChiNhanh={v.kind === 'bo_tro'} value={v.nguoi} onChange={(x) => dat({ nguoi: x })}
        choTrong={t('Để trống')} placeholder={t('Chưa chọn · gõ tên để tìm')} ariaLabel={nhanNguoi}
        id={lf.oId(k('nguoi'))} onBlur={lf.roi(k('nguoi'))} invalid={!!lf.loiCua(loi, k('nguoi'))} />
    </Truong>
  ) : null;
  /* Ô người và Ngày bắt đầu mỗi ô một hàng: chữ phụ dưới Người dạy (mockup a1440) không bị cắt ở nửa cột. */
  const nguoiVaNgay = nguoi || ngay ? <>{nguoi}{ngay}</> : null;

  if (phang) return <div className="space-y-3">{phuongAn}{nguoiVaNgay}{cuoi}</div>;
  return <>
    <Khoi tieuDe={t('Phương án')} luat={luat}>{phuongAn}</Khoi>
    {(nguoiVaNgay || cuoi) && <Khoi tieuDe={t('Người và thời gian')}>{nguoiVaNgay}{cuoi}</Khoi>}
  </>;
}

/** Ngày bắt đầu KHOÁ (Xác nhận PA; Sửa PA đã có Kết quả): chữ mã tuần · ngày + phụ. Còn đổi được thì nơi gọi dùng `ChonNgayGan`. */
export function NgayKhoa({ chu, phu }: { chu: string; phu?: string }) {
  return <OKhoa nhan={t('Ngày bắt đầu')} chu={chu} phu={phu} />;
}

/**
 * Ô KHOÁ (Loại PA, Ngày bắt đầu): ô `readOnly` vào được vòng Tab, nhãn bọc ô (trình đọc nghe "Loại PA, Tutor, chỉ đọc"),
 * chữ phụ nối qua `aria-describedby`. Phụ vẽ ngoài `Truong` (cùng lớp chữ phụ của `Truong`) để không lẫn vào tên ô.
 */
export function OKhoa({ nhan, chu, phu, sau }: { nhan: string; chu: string; phu?: string; sau?: string }) {
  const idPhu = useId();
  return (
    <div>
      <Truong nhan={nhan}>
        <span className="relative block">
          <input readOnly aria-readonly className={`field w-full cursor-not-allowed truncate tabular-nums text-slate-300 ${sau ? 'pr-28' : 'pr-8'}`}
            value={chu} aria-describedby={phu ? idPhu : undefined} />
          <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center gap-1 text-xs text-slate-500"><KhoaNho />{sau}</span>
        </span>
      </Truong>
      {phu && <span id={idPhu} className="mt-1 block truncate text-xs text-slate-500">{phu}</span>}
    </div>
  );
}

/** Vạch buổi 120 × 6 (mockup `.vach`): chưa đủ màu nhấn · đủ xanh · vượt cam. Chữ bên cạnh đã nói số, nên vạch ẩn với trình đọc. */
export function VachBuoi({ da, tong, tt }: { da: number; tong: number; tt: 'chua' | 'du' | 'vuot' }) {
  const mau = tt === 'du' ? 'bg-ok' : tt === 'vuot' ? 'bg-late' : 'bg-[color:var(--accent)]';
  return (
    <span aria-hidden className="relative block h-1.5 w-[120px] shrink-0 overflow-hidden rounded-full" style={{ background: 'var(--line-strong)' }}>
      <i className={`absolute inset-y-0 left-0 rounded-full ${mau}`} style={{ width: `${Math.min(100, Math.round((da / tong) * 100))}%` }} />
    </span>
  );
}

/** Ổ khoá 12px nét 1.5 — PA theo quy chế, ô khoá (thay emoji: ký tự nhỏ không đồng nét với bộ biểu tượng). */
export function KhoaNho() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" className="shrink-0">
      <rect x="2.25" y="5.25" width="7.5" height="5.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 5.25V3.75a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * NHẬT KÝ PA (mockup §6) — MỘT khối dùng chung: Sửa PA, và dòng PA ở panel Case ("Nhật ký PA (n)", `soDongNhatKyPa`).
 * Mới nhất lên trên: "<b>06/10 · Phạm Thu Trang</b> · Kết quả W1 OCT · dạy 3 buổi". Luật dựng dòng ở `nhatKyPa` (shared).
 */
export function NhatKyPa({ pa, ketQua }: { pa: PaNhatKy; ketQua: readonly KetQuaNhatKy[] }) {
  const { homNay, ngan } = useNgayNghiepVu();
  return (
    <ol className="m-0 flex list-none flex-col gap-0.5 p-0 text-xs text-slate-500">
      {nhatKyPa(pa, ketQua, homNay).map((d) => (
        <li key={d.khoa} className="break-words"><b className="font-semibold text-slate-300 tabular-nums">{d.ngay ? ngan(d.ngay) : '—'} · {d.ai}</b> · {dich(d.chu)}</li>
      ))}
    </ol>
  );
}
