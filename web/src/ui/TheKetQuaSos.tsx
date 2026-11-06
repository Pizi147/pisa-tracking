import { ODiem } from './ODiem.tsx';
import { chuDiem, chuTruotSos, datTheSos, mucDiem, nhanDocTheSos, type TheSosEm, type TheSosLuot } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * THẺ KẾT QUẢ SOS (chủ SP 06/11, Phối hợp SOS) — "MT2 · ✗ 5.5 / 6.0 · trượt L, W": lượt · Overall (✓ / ✗ + ba màu như `ODiem`) so kỳ vọng · kỹ năng trượt.
 * MỘT thẻ cho Công việc, thanh Việc của tôi hồ sơ lớp, thẻ Phối hợp ở hồ sơ lớp / hồ sơ HV (chữ từ `shared/domain/diemDong.ts`, dữ liệu máy chủ `theSosTuKetQua`).
 * Không chỉ bằng màu: ✓ / ✗ + chữ "trượt"; trình đọc màn đọc một câu (`nhanDocTheSos`). Chữ xuống dòng, không cắt "…".
 * `ten` = tên em đứng trước (dòng việc cả lớp); `anLuot` = dòng liền trên đã ghi lượt.
 */
export function TheKetQuaSos({ th, ten, anLuot = false }: { th: TheSosLuot; ten?: string; anLuot?: boolean }) {
  const pt = !!th.pt;
  const truot = chuTruotSos(th);
  /* Có tên em (dòng việc, cột hẹp): HAI dòng cố định — "tên · lượt" rồi "điểm · trượt"; không tên (thẻ Phối hợp): một hàng, thiếu chỗ thì ngắt giữa các khối. */
  const khoi = ten ? 'flex flex-wrap items-baseline gap-x-1.5' : 'contents';
  return (
    <span role="img" aria-label={[ten, nhanDocTheSos(th)].filter(Boolean).join(' — ')} data-the-sos=""
      className={`inline-flex min-w-0 ${ten ? 'flex-col gap-y-0.5' : 'flex-wrap items-baseline gap-x-1.5 gap-y-0.5'} text-[13px] leading-snug`}>
      <span aria-hidden className={khoi}>
        {ten && <b className="font-semibold text-slate-100">{ten}</b>}
        {!anLuot && <span className="inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium text-dim" style={{ background: 'var(--surface-2)' }}>{th.luot}</span>}
        {!ten && th.ovr != null && <Diem th={th} pt={pt} />}
        {!ten && truot && <span className="whitespace-nowrap font-medium text-dim">{truot}</span>}
        {!ten && th.tam && <span className="text-faint" title={t('Lượt chưa chốt điểm')}>{t('tạm')}</span>}
      </span>
      {ten && (
        <span aria-hidden className="flex flex-wrap items-baseline gap-x-1.5">
          {th.ovr != null && <Diem th={th} pt={pt} />}
          {truot && <span className="whitespace-nowrap font-medium text-dim">{truot}</span>}
          {th.tam && <span className="text-faint" title={t('Lượt chưa chốt điểm')}>{t('tạm')}</span>}
        </span>
      )}
    </span>
  );
}

/** "✗ 5.5 / 6.0" — Overall (✓ / ✗ + ba màu `ODiem`) so kỳ vọng; một khối không ngắt dòng. */
function Diem({ th, pt }: { th: TheSosLuot; pt: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
      <ODiem so={chuDiem(th.ovr!, pt)} kq={mucDiem(datTheSos(th), th.ovr, th.moc)} />
      {th.moc != null && <span className="tabular-nums text-dim" title={pt ? undefined : t('kỳ vọng {kv}', { kv: chuDiem(th.moc) })}>/ {chuDiem(th.moc, pt)}</span>}
    </span>
  );
}

/** Dòng việc Phối hợp SOS: mỗi lượt một thẻ có tên em; còn lượt chưa hiện → "+n lượt nữa" (panel việc mở thấy đủ). */
export function TheSosViec({ ds, tong, toiDa = ds.length }: { ds: readonly TheSosEm[]; tong: number | null; toiDa?: number }) {
  if (!ds.length) return null;
  const hien = ds.slice(0, toiDa);
  const nua = Math.max(0, (tong ?? ds.length) - hien.length);
  return (
    <span className="mt-1 flex min-w-0 flex-col gap-1.5" data-the-sos-viec="">
      {hien.map((x) => <TheKetQuaSos key={x.attemptId} th={x.the} ten={x.studentName} />)}
      {nua > 0 && <span className="text-xs text-dim">{t('+{n} lượt nữa', { n: nua })}</span>}
    </span>
  );
}
