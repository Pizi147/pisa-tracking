import { Hang2, Truong } from '../../ui/KhungPanel.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { BoLocDoan } from '../../ui/ui.tsx';
import { IconDat, IconKhong } from '../../ui/BieuTuong.tsx';
import type { useLoiForm } from '../../ui/loiForm.tsx';
import { TIEU_CHI_TUTOR, type BuoiTutor, type HinhThuc, type LoiTruong, type NguoiChon } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * MỘT BUỔI CỦA KẾT QUẢ PA TUTOR (TU-a, đặc tả Tutor mục 5, mockup tutor-1 §1 + §7): Tutor * (danh sách + "Tutor khác") · Hình thức (tự suy, bấm đổi) ·
 * Nhận xét buổi * · "Tutor buổi này *" 3 ô Có · Không (+ "Cả 3 Có") · khối gập "Đánh giá tutor · tuỳ chọn" (sao 1–5, bấm lại = bỏ; Nhận xét về tutor).
 * Khoá lỗi: `buoi-{i}-tutor` · `buoi-{i}-nx` · `buoi-{i}-{chuanBi|taiLieu|feedbackGv}` (cùng `CapNhatTuan`). `cu3`: lần ghi trước TU-a — 3 ô không bắt buộc.
 */
export function BuoiTutorO({ i, b, dat, paId, lf, loi, cu3 }: {
  i: number; b: BuoiTutor | undefined; dat: (p: Partial<BuoiTutor>) => void; paId: number;
  lf: ReturnType<typeof useLoiForm>; loi: readonly LoiTruong[]; cu3: boolean;
}) {
  const k = (x: string) => `buoi-${i}-${x}`;
  const nguoi: NguoiChon | null = !b?.tutor.trim() ? null
    : b.tutorId ? { kieu: 'tai_khoan', id: b.tutorId, ten: b.tutor } : { kieu: 'ngoai', ten: b.tutor, phu: t('Tutor khác') };
  return (
    <div className="space-y-3">
      <span className="block text-[13px] font-bold text-slate-200">{t('Buổi {n}', { n: i + 1 })}</span>
      <Hang2>
        <Truong nhan={t('Tutor')} batBuoc as="div" loi={lf.loiCua(loi, k('tutor'))}>
          <ChonNguoi nhom="nhan_vien" tutor={{ paId, chi: true }} choToi={false} value={nguoi} ariaLabel={t('Tutor buổi {n}', { n: i + 1 })}
            placeholder={t('Gõ tên tutor để tìm')} id={lf.oId(k('tutor'))} onBlur={lf.roi(k('tutor'))} invalid={!!lf.loiCua(loi, k('tutor'))}
            onChange={(v, tutor) => dat(v?.kieu === 'tai_khoan'
              ? { tutorId: v.id, tutor: v.ten, hinhThuc: tutor?.hinhThuc ?? null }
              : { tutorId: null, tutor: v && v.kieu === 'ngoai' ? v.ten : '', hinhThuc: null })} />
        </Truong>
        <Truong nhan={t('Hình thức')} as="div">
          <BoLocDoan ariaLabel={t('Hình thức buổi {n}', { n: i + 1 })} value={(b?.hinhThuc ?? '') as HinhThuc}
            muc={[{ key: 'offline', nhan: 'Offline' }, { key: 'online', nhan: 'Online' }]} onChange={(h) => dat({ hinhThuc: h })} />
        </Truong>
      </Hang2>
      <Truong nhan={t('Nhận xét buổi')} batBuoc loi={lf.loiCua(loi, k('nx'))}>
        <textarea className="field w-full" rows={2} maxLength={1000} {...lf.o(loi, k('nx'))} value={b?.nhanXet ?? ''}
          onChange={(e) => dat({ nhanXet: e.target.value })} placeholder={t('Ví dụ: luyện số đếm, còn nhầm 15 và 50')} />
      </Truong>
      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex-1 text-[13px] font-semibold text-slate-300">
            {t('Tutor buổi này')}{!cu3 && <><span aria-hidden className="text-bad"> *</span><span className="sr-only"> {t('(bắt buộc)')}</span></>}
          </span>
          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => dat({ chuanBi: true, taiLieu: true, feedbackGv: true })}>{t('Cả 3 Có')}</button>
        </div>
        <div className="space-y-2.5">
          {TIEU_CHI_TUTOR.map(({ k: o, nhan }) => {
            const loiO = lf.loiCua(loi, k(o));
            const gt = b?.[o] ?? null;
            return (
              <div key={o} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 max-sm:flex-col max-sm:items-stretch">
                <span className="min-w-0 flex-1 text-[13px] text-slate-200">{nhan}
                  {loiO && <span className="ml-2 text-xs text-late">{loiO}</span>}</span>
                <div {...lf.o(loi, k(o))} tabIndex={-1} role="group" aria-label={nhan}
                  className={`inline-flex shrink-0 overflow-hidden rounded-lg border outline-none max-sm:w-full ${loiO ? 'border-late' : ''}`}
                  style={loiO ? undefined : { borderColor: 'var(--line-strong)' }}>
                  {([true, false] as const).map((co) => (
                    <button key={String(co)} type="button" aria-pressed={gt === co} onClick={() => dat({ [o]: co })}
                      className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 px-3 text-xs font-semibold max-sm:flex-1 sm:min-h-[32px] ${co ? '' : 'border-l'} ${
                        gt === co ? 'bg-[color:var(--accent-soft)] text-slate-100 shadow-[inset_0_0_0_1px_var(--accent)]' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}
                      style={{ borderColor: 'var(--line)' }}>
                      <span aria-hidden className={co ? 'text-ok' : 'text-bad'}>{co ? <IconDat /> : <IconKhong />}</span>{co ? t('Có') : t('Không')}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Mặc định gập; Sửa kết quả có sẵn đánh giá / nhận xét về tutor thì mở. `<details>` giữ chữ khi gập (ô vẫn trong DOM). */}
      <details className="group rounded-lg border px-3 py-2" style={{ borderColor: 'var(--line)' }} open={b?.danhGia != null || !!b?.nhanXetTutor || undefined}>
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[13px] font-semibold text-slate-300 min-h-[32px] flex items-center gap-1.5 max-sm:min-h-[44px]">
          <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span>{t('Đánh giá tutor')}
          <span className="font-normal text-slate-500">· {t('tuỳ chọn')}</span>
        </summary>
        <div className="mt-2 space-y-3 pb-1">
          <Truong nhan={t('Đánh giá')} as="div">
            <div className="flex items-center gap-0.5" role="group" aria-label={t('Đánh giá buổi {n}', { n: i + 1 })}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" aria-label={`${s}/5`} aria-pressed={b?.danhGia === s}
                  onClick={() => dat({ danhGia: b?.danhGia === s ? null : s })}
                  className="grid h-11 w-11 place-items-center rounded-md bg-transparent sm:h-8 sm:w-8 hover:bg-white/5">
                  <Sao day={(b?.danhGia ?? 0) >= s} />
                </button>
              ))}
              {b?.danhGia != null && <span className="ml-2 text-xs tabular-nums text-slate-400">{b.danhGia}/5</span>}
            </div>
          </Truong>
          <Truong nhan={t('Nhận xét về tutor')}>
            <textarea className="field w-full" rows={2} maxLength={1000} value={b?.nhanXetTutor ?? ''} onChange={(e) => dat({ nhanXetTutor: e.target.value })} />
          </Truong>
        </div>
      </details>
    </div>
  );
}

function Sao({ day, nho }: { day: boolean; nho?: boolean }) {
  const c = nho ? 12 : 18;
  return (
    <svg aria-hidden width={c} height={c} viewBox="0 0 20 20" fill={day ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      className={day ? 'text-soon' : 'text-slate-500'}>
      <path d="m10 2.8 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7Z" />
    </svg>
  );
}

/**
 * Một buổi ở lịch sử Case / Ngăn Case (mockup tutor-1 §8): "Buổi n · tutor" + hình thức + 3 dấu ✓ / ✗ kèm chữ + sao (nếu có) · nhận xét buổi ·
 * nhận xét về tutor (nếu có). Lần ghi trước TU-a (3 ô trống): chỉ tên + nhận xét như cũ.
 */
export function DongBuoiTutor({ b, i }: { b: BuoiTutor; i: number }) {
  return (
    <li className="break-words">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span>{t('Buổi {x} · {tutor}:', { x: i + 1, tutor: b.tutor })}</span>
        {b.hinhThuc && <span className="rounded border px-1 text-[11px] text-slate-400" style={{ borderColor: 'var(--line)' }}>{b.hinhThuc === 'online' ? 'Online' : 'Offline'}</span>}
        {TIEU_CHI_TUTOR.map(({ k, ngan }) => b[k] == null ? null : (
          <span key={k} className="inline-flex items-center gap-0.5">
            <span aria-hidden className={b[k] ? 'text-ok' : 'text-bad'}>{b[k] ? <IconDat /> : <IconKhong />}</span>
            <span className={b[k] ? 'text-slate-400' : 'text-slate-200'}>{ngan}</span>
            <span className="sr-only">{b[k] ? t('Có') : t('Không')}</span>
          </span>
        ))}
        {b.danhGia != null && <span className="inline-flex items-center gap-0.5 tabular-nums"><Sao day nho />{b.danhGia}/5</span>}
      </span>
      <span className="block text-slate-300">{b.nhanXet}</span>
      {b.nhanXetTutor && <span className="block text-slate-400">{t('Về tutor: {nx}', { nx: b.nhanXetTutor })}</span>}
    </li>
  );
}
