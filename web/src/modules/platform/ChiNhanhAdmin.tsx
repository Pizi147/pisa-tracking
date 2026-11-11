import { useRef } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Forbidden, Info, Skeleton } from '../../ui/ui.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { OSuaTaiCho } from '../../ui/OSuaTaiCho.tsx';
import { useSession } from '../../lib/session.tsx';
import { NhatKyMuc } from './NhatKyChung.tsx';
import { t } from '@shared/i18n/index.ts';

type ChiNhanh = { id: number; code: string; status: string; name: string; diaChi: string | null; soDienThoai: string | null };
type LienHe = Pick<ChiNhanh, 'name' | 'diaChi' | 'soDienThoai'>;
type KhoaCn = keyof LienHe;
const COT: CotBang[] = [
  { key: 'ma', nhan: t('Mã'), kieu: 'so', rong: 64 }, { key: 'ten', nhan: t('Tên'), kieu: 'ten', rong: 180 }, { key: 'dc', nhan: t('Địa chỉ'), kieu: 'chu' },
  { key: 'sdt', nhan: t('Số điện thoại'), kieu: 'tuan', rong: 190 },
];

/**
 * QUẢN TRỊ › CHI NHÁNH (CHI-NHANH-LIEN-HE, chủ SP 07/11) — tên hiển thị, địa chỉ, SĐT của từng cơ sở: in ở đầu tệp Báo cáo PH gửi phụ huynh.
 * QTV2-CAU-HINH (chủ SP 11/11): mỗi ô SỬA TẠI CHỖ (`OSuaTaiCho` — thay panel Sửa), lưu xong có Hoàn tác (gửi lại giá trị cũ máy chủ trả); nhật ký
 * cột phải; Quản lý chỉ xem. Mã không sửa. Đơn vị báo cáo: một dòng chỉ xem (chuyển từ tab Quyền & nhật ký).
 */
export function ChiNhanhAdmin() {
  const { data, loading, error, reload } = useApi<ChiNhanh[]>('/admin/chi-nhanh');
  const donVi = useApi<{ id: number; name: string; kind: string }[]>('/admin/don-vi');
  const quanTri = !!useSession().session?.nav?.admin;
  const toast = useToast();
  /* N04: bản máy chủ vừa báo xung đột theo ô (`{id}:{ô}`) — lần Lưu sau so với bản này. */
  const coSo = useRef<Record<string, string | null>>({});
  if (error && error.status === 403) return <Forbidden message={t('Phần này chỉ dành cho Quản trị hệ thống.')} />;
  if (error) return <Card title={t('Chi nhánh')}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>;

  /*
   * N04 (SUA-RA-1311): mỗi lần lưu gửi ĐÚNG một ô + `cu` = giá trị ô lúc bắt đầu sửa (máy chủ so trong giao dịch — người khác vừa sửa ô đó thì 409,
   * chữ đang gõ giữ, câu báo nói ai sửa thành gì). Bấm Lưu lần nữa sau 409 = thay có chủ ý: `coSo` nhớ bản máy chủ vừa báo làm `cu` mới.
   * Hoàn tác gửi giá trị cũ với `cu` = giá trị vừa lưu → không đè bản mới hơn của người khác.
   */
  const gui = async (b: ChiNhanh, k: KhoaCn, v: string, cu: string | null, hoanTac = false) => {
    const khoa = `${b.id}:${k}`;
    let r: { truoc: Partial<LienHe>; doi: KhoaCn[] };
    try {
      r = await api.put(`/admin/chi-nhanh/${b.id}`, { [k]: v, cu: { [k]: (khoa in coSo.current ? coSo.current[khoa] : cu) ?? '' } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.details?.truong === k) { coSo.current[khoa] = e.details.hien ?? null; reload(); }
      throw e;
    }
    delete coSo.current[khoa];
    invalidate('/ref/branches'); invalidate('/admin/nhat-ky');
    reload();
    if (hoanTac) { toast.push('ok', t('Đã hoàn tác')); return; }
    if (!r.doi.length) return;
    toast.hoanTac(t('Đã lưu chi nhánh {ma}', { ma: b.code }), () => {
      gui(b, k, r.truoc[k] ?? '', v, true).catch((e) => toast.push('error', e instanceof ApiError && e.status === 409 && e.details?.truong === k
        ? t('Chưa hoàn tác: {ma} đã được sửa thành “{hien}” sau lần lưu của bạn — giữ bản đó.', { ma: b.code, hien: e.details.hien ?? t('trống') })
        : (e as Error).message));
    }, { key: `chi-nhanh:${b.id}:${k}` });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-3">
        {loading || !data ? <Card><Skeleton rows={5} /></Card> : (
          <Bang ten={t('Chi nhánh')} cot={COT} hang={data} khoa={(b) => b.id}
            oCua={(b, c) => {
              /* AUDIT-UI C11: chi nhánh ngừng = chữ `text-faint` + nhãn "ngừng dùng", không opacity. */
              if (c.key === 'ma') return <b className={b.status === 'active' ? 'text-slate-100' : 'text-faint'}>{b.code}</b>;
              if (c.key === 'ten') return (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <OSuaTaiCho giaTri={b.name} nhan={`${t('Tên')} ${b.code}`} toiDa={80} chiXem={!quanTri} onLuu={(v, cu) => gui(b, 'name', v, cu)} />
                  {b.status !== 'active' && <Info pending>{t('ngừng dùng')}</Info>}
                </span>
              );
              if (c.key === 'dc') return <OSuaTaiCho giaTri={b.diaChi} nhan={`${t('Địa chỉ')} ${b.code}`} chiXem={!quanTri} trong={t('+ Địa chỉ')} onLuu={(v, cu) => gui(b, 'diaChi', v, cu)} />;
              return <span className="tabular-nums"><OSuaTaiCho giaTri={b.soDienThoai} nhan={`${t('Số điện thoại')} ${b.code}`} toiDa={60} rong="w-40" chiXem={!quanTri} trong={t('+ SĐT')} onLuu={(v, cu) => gui(b, 'soDienThoai', v, cu)} /></span>;
            }} />
        )}
        {donVi.data && donVi.data.length > 0 && (
          <p className="m-0 flex flex-wrap items-center gap-1 text-sm text-slate-400">{t('Đơn vị báo cáo')}: <span className="text-slate-200">{donVi.data.map((d) => d.name).join(' · ')}</span></p>
        )}
      </div>
      <NhatKyMuc muc="chi-nhanh" quanTri={quanTri} />
    </div>
  );
}
