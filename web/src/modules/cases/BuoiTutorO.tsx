import { Truong } from '../../ui/KhungPanel.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { IconDat, IconKhong } from '../../ui/BieuTuong.tsx';
import type { useLoiForm } from '../../ui/loiForm.tsx';
import { CHU_TOI_THIEU_CASE, TIEU_CHI_TUTOR, type BuoiTutor, type LoiTruong, type NguoiChon } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** TU2-3: trần chữ Nội dung của một dòng Tutor trên web (máy chủ giữ ≤ 1000 cho dữ liệu cũ). */
export const TRAN_NOI_DUNG_TUTOR = 300;

/**
 * MỘT DÒNG TUTOR của Kết quả PA Tutor (TU3, TU5, TU6 — mockup Ⓣ1 A2, A6, A8): Tutor * (GV · tutor · tên gõ tay) · Nội dung * (n / 300) · khối
 * "Về tutor {tên} · tuỳ chọn" (3 nút Có / Không, bấm lại = bỏ; "Cả 3 Có"; "Đánh giá thêm" gập) CHỈ khi dòng có tên Tutor. `nhieu`: có từ 2 dòng — dòng là
 * một thẻ, ô "Buổi" nhỏ đứng đầu (tổng các dòng = đã học). Khoá lỗi: `buoi-{i}-tutor` · `buoi-{i}-nx` · `buoi-{i}-so`.
 */
export function DongTutorO({ i, b, dat, paId, lf, loi, nhieu, onBo, loiTong }: {
  i: number; b: BuoiTutor; dat: (p: Partial<BuoiTutor>) => void; paId: number;
  lf: ReturnType<typeof useLoiForm>; loi: readonly LoiTruong[];
  nhieu: boolean; onBo?: () => void;
  /** Tổng số buổi các dòng ≠ đã học — viền đỏ ô "Buổi" (câu lỗi ở ô đã học). */
  loiTong: boolean;
}) {
  const k = (x: string) => `buoi-${i}-${x}`;
  const ten = b.tutor.trim();
  const nguoi: NguoiChon | null = !ten ? null
    : b.tutorId || b.gvId ? { kieu: 'tai_khoan', id: b.tutorId ?? -(b.gvId as number), ten: b.tutor } : { kieu: 'ngoai', ten: b.tutor, phu: t('tên gõ tay') };
  const loiSo = lf.loiCua(loi, k('so'));
  const oTutor = (
    <Truong nhan={t('Tutor')} batBuoc as="div" loi={lf.loiCua(loi, k('tutor'))}>
      <div className="max-w-[440px]">
        <ChonNguoi nhom="nhan_vien" tutor={{ paId, chi: true }} choToi={false} value={nguoi} ariaLabel={nhieu ? t('Tutor dòng {n}', { n: i + 1 }) : t('Tutor')}
          placeholder={t('Tìm GV, tutor…')} id={lf.oId(k('tutor'))} onBlur={lf.roi(k('tutor'))} invalid={!!lf.loiCua(loi, k('tutor'))}
          /* TU4: dòng GV gửi `gvId` (máy chủ tìm / tạo dòng danh bạ của GV); tutor → `tutorId`; "Dùng tên" → chỉ tên. Hình thức thôi hỏi (R1.10). */
          onChange={(v, tu) => dat(tu?.loai === 'gv' && tu.gvId
            ? { gvId: tu.gvId, tutorId: null, tutor: tu.ten, hinhThuc: null }
            : v?.kieu === 'tai_khoan' ? { tutorId: v.id, gvId: null, tutor: v.ten, hinhThuc: null }
            : { tutorId: null, gvId: null, tutor: v && v.kieu === 'ngoai' ? v.ten : '', hinhThuc: null })} />
      </div>
      {/* Lần ghi cũ có Hình thức: dữ liệu chỉ đọc (R1.10 — ô Hình thức đã bỏ). */}
      {b.hinhThuc && <span className="mt-1 block text-xs text-slate-400">{b.hinhThuc === 'online' ? 'Online' : 'Offline'} · {t('ghi cũ')}</span>}
    </Truong>
  );
  const nd = b.nhanXet.trim().length;
  const than = (
    <>
      {nhieu ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5">
          <Truong nhan={t('Buổi')} loi={loiSo}>
            <input className={`field h-9 w-14 text-center tabular-nums ${loiTong && !loiSo ? '!border-late ring-1 ring-late/40' : ''}`} inputMode="numeric" maxLength={2}
              {...lf.o(loi, k('so'))} aria-invalid={loiTong || !!loiSo || undefined} value={b.soBuoi == null ? '' : String(b.soBuoi)}
              onChange={(e) => { const x = e.target.value.replace(/\D/g, ''); dat({ soBuoi: x ? Number(x) : null }); }} />
          </Truong>
          {oTutor}
          {onBo ? <button type="button" className="btn btn-ghost mt-5 min-h-[44px] font-semibold text-[color:var(--accent)] sm:min-h-[36px]" onClick={onBo}>{t('Bỏ dòng')}</button> : <span />}
        </div>
      ) : oTutor}
      <Truong nhan={t('Nội dung')} batBuoc loi={lf.loiCua(loi, k('nx'))} dem={{ co: nd, can: CHU_TOI_THIEU_CASE, toiDa: TRAN_NOI_DUNG_TUTOR }}>
        <textarea className="field w-full" rows={2} maxLength={Math.max(TRAN_NOI_DUNG_TUTOR, b.nhanXet.length)} {...lf.o(loi, k('nx'))} value={b.nhanXet}
          onChange={(e) => dat({ nhanXet: e.target.value })} placeholder={t('Em học được gì, còn yếu gì')} />
      </Truong>
      {ten && <BaNut i={i} b={b} ten={ten} dat={dat} />}
    </>
  );
  return nhieu
    ? <div className="flex flex-col gap-3 rounded-[10px] border p-3" style={{ borderColor: loiTong ? 'rgb(var(--bad-line-rgb))' : 'var(--line-strong)' }}>{than}</div>
    : <div className="flex flex-col gap-5">{than}</div>;
}

/** Khối "Về tutor {tên} · tuỳ chọn" (TU5): 3 nút Có / Không — bấm lại nút đang chọn = bỏ chọn; ✓ / ✗ chỉ ở nút đang chọn; "Đánh giá thêm" gập. */
function BaNut({ i, b, ten, dat }: { i: number; b: BuoiTutor; ten: string; dat: (p: Partial<BuoiTutor>) => void }) {
  return (
    <div className="rounded-[10px] border" style={{ borderColor: 'var(--line)' }}>
      <div className="flex min-h-[40px] items-center gap-2 border-b py-1 pl-3.5 pr-2 text-[13px] font-semibold text-slate-300" style={{ borderColor: 'var(--line)' }}>
        <span className="min-w-0 flex-1">{t('Về tutor')} <b className="font-semibold text-slate-100">{ten}</b> <span className="font-normal text-slate-500">· {t('tuỳ chọn')}</span></span>
        <button type="button" className="btn btn-ghost min-h-[44px] px-2 font-semibold text-[color:var(--accent)] sm:min-h-[32px]"
          onClick={() => dat({ chuanBi: true, taiLieu: true, feedbackGv: true })}>{t('Cả 3 Có')}</button>
      </div>
      {TIEU_CHI_TUTOR.map(({ k: o, nhan }, j) => {
        const gt = b[o] ?? null;
        return (
          <div key={o} className={`flex min-h-[46px] items-center gap-3 py-1.5 pl-3.5 pr-2 text-sm text-slate-200 max-sm:flex-col max-sm:items-stretch max-sm:gap-1.5 max-sm:pr-3.5 ${j ? 'border-t' : ''}`}
            style={{ borderColor: 'var(--line)' }}>
            <span className="min-w-0 flex-1">{nhan}</span>
            <div role="group" aria-label={nhan} className="inline-flex shrink-0 overflow-hidden rounded-lg border max-sm:w-full" style={{ borderColor: 'var(--line-strong)' }}>
              {([true, false] as const).map((co) => {
                const on = gt === co;
                return (
                  <button key={String(co)} type="button" aria-pressed={on} onClick={() => dat({ [o]: on ? null : co })}
                    className={`inline-flex h-11 items-center justify-center gap-1.5 text-[13px] max-sm:flex-1 sm:h-8 sm:w-[86px] ${co ? '' : 'border-l'} ${on
                      ? (co ? 'font-bold text-ok' : 'font-bold text-bad') : 'bg-transparent font-medium text-slate-400 hover:text-slate-200'}`}
                    style={{ borderColor: 'var(--line-strong)', ...(on ? { background: `rgb(var(--${co ? 'ok' : 'bad'}-bg-rgb))`, boxShadow: `inset 0 0 0 1px rgb(var(--${co ? 'ok' : 'bad'}-line-rgb))` } : {}) }}>
                    {on && <span aria-hidden>{co ? <IconDat /> : <IconKhong />}</span>}{co ? t('Có') : t('Không')}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Gập mặc định; có đánh giá / nhận xét về tutor (Sửa) thì mở. `<details>` giữ chữ khi gập (ô vẫn trong DOM). */}
      <details className="group border-t" style={{ borderColor: 'var(--line)' }} open={b.danhGia != null || !!b.nhanXetTutor || undefined}>
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-3.5 text-[13px] font-semibold text-slate-300 sm:min-h-[42px] [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span>{t('Đánh giá thêm')}
          <span className="font-normal text-slate-500">· {t('sao, nhận xét về tutor')}</span>
          {b.danhGia != null && <span className="ml-auto text-xs font-semibold tabular-nums text-slate-400">{b.danhGia} / 5</span>}
        </summary>
        <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-1">
          <div className="flex items-center gap-3" role="group" aria-label={t('Đánh giá tutor dòng {n}', { n: i + 1 })}>
            <span className="w-[88px] shrink-0 text-[13px] font-semibold text-slate-300">{t('Đánh giá')}</span>
            <span className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" aria-label={`${s}/5`} aria-pressed={b.danhGia === s}
                  onClick={() => dat({ danhGia: b.danhGia === s ? null : s })}
                  className="grid h-11 w-11 place-items-center rounded-md bg-transparent sm:h-8 sm:w-8 bam">
                  <Sao day={(b.danhGia ?? 0) >= s} />
                </button>
              ))}
            </span>
          </div>
          <Truong nhan={t('Nhận xét về tutor')}>
            <textarea className="field w-full" rows={2} maxLength={1000} value={b.nhanXetTutor ?? ''} onChange={(e) => dat({ nhanXetTutor: e.target.value })} />
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
 * Một dòng Tutor ở lịch sử Case / Ngăn Case (mockup Ⓣ1 C1, R1.16): "{tutor} · {n buổi}: nội dung" (số buổi chỉ khi lần ghi có > 1 dòng) + 3 dấu ✓ / ✗ kèm chữ
 * CHỈ khi có trả lời + sao (nếu có) · nhận xét về tutor. `cu` (lần ghi trước TU2, không có "b"): "Buổi n · tutor [Offline]" như cũ.
 */
export function DongBuoiTutor({ b, i, nhieu, cu }: { b: BuoiTutor; i: number; nhieu: boolean; cu: boolean }) {
  return (
    <li className="break-words">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span>
          <b className="font-semibold text-slate-200">
            {cu ? t('Buổi {x} · {tutor}', { x: i + 1, tutor: b.tutor }) : nhieu ? t('{tutor} · {n} buổi', { tutor: b.tutor, n: b.soBuoi ?? 1 }) : b.tutor}
          </b>
          {cu && b.hinhThuc && <span className="ml-1.5 rounded border px-1 text-[12px] text-slate-400" style={{ borderColor: 'var(--line)' }}>{b.hinhThuc === 'online' ? 'Online' : 'Offline'}</span>}
          : <span className="text-slate-300">{b.nhanXet}</span>
        </span>
      </span>
      {(TIEU_CHI_TUTOR.some(({ k }) => b[k] != null) || b.danhGia != null) && (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {TIEU_CHI_TUTOR.map(({ k, ngan }) => b[k] == null ? null : (
            <span key={k} className={`inline-flex items-center gap-0.5 ${b[k] ? 'text-ok' : 'text-bad'}`}>
              <span aria-hidden>{b[k] ? <IconDat /> : <IconKhong />}</span>{ngan}
              <span className="sr-only">: {b[k] ? t('Có') : t('Không')}</span>
            </span>
          ))}
          {b.danhGia != null && <span className="inline-flex items-center gap-0.5 tabular-nums"><Sao day nho />{b.danhGia} / 5</span>}
        </span>
      )}
      {b.nhanXetTutor && <span className="block text-slate-400">{t('Về tutor: {nx}', { nx: b.nhanXetTutor })}</span>}
    </li>
  );
}
