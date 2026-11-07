import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Field, Forbidden, Info, Skeleton } from '../../ui/ui.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { dsLoi, type LoiTruong } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type ChiNhanh = { id: number; code: string; status: string; name: string; diaChi: string | null; soDienThoai: string | null };
type LienHe = Pick<ChiNhanh, 'name' | 'diaChi' | 'soDienThoai'>;
const COT: CotBang[] = [
  { key: 'ma', nhan: t('Mã'), kieu: 'so', rong: 64 }, { key: 'ten', nhan: t('Tên'), kieu: 'ten', rong: 160 }, { key: 'dc', nhan: t('Địa chỉ'), kieu: 'chu' },
  { key: 'sdt', nhan: t('Số điện thoại'), kieu: 'tuan', rong: 150 }, { key: 'sua', nhan: '', kieu: 'nut', rong: 72 },
];

/**
 * QUẢN TRỊ › CHI NHÁNH (CHI-NHANH-LIEN-HE, chủ SP 07/11) — tên hiển thị, địa chỉ, SĐT của từng cơ sở: in ở đầu tệp Báo cáo PH gửi phụ huynh.
 * Bảng (`Bang`, < 640 px thành thẻ) + panel sửa. Lưu xong có Hoàn tác (gửi lại giá trị cũ); nhật ký ghi trước / sau. Mã không sửa.
 */
export function ChiNhanhAdmin() {
  const { data, loading, error, reload } = useApi<ChiNhanh[]>('/admin/chi-nhanh');
  const [sua, setSua] = useState<ChiNhanh | null>(null);
  const toast = useToast();
  if (error && error.status === 403) return <Forbidden message={t('Phần này chỉ dành cho Quản trị hệ thống.')} />;
  if (error) return <Card title={t('Chi nhánh')}><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>;

  /** Lưu một chi nhánh; `hoanTac` = đang trả giá trị cũ (không hiện Hoàn tác lần nữa). */
  const gui = async (b: ChiNhanh, v: LienHe, hoanTac = false) => {
    const r = await api.put<{ truoc: LienHe }>(`/admin/chi-nhanh/${b.id}`, v);
    invalidate('/ref/branches');
    reload();
    if (hoanTac) { toast.push('ok', t('Đã hoàn tác')); return; }
    toast.hoanTac(t('Đã lưu chi nhánh {ma}', { ma: b.code }), () => {
      gui(b, r.truoc, true).catch((e) => toast.push('error', (e as Error).message));
    }, { key: `chi-nhanh:${b.id}` });
  };
  const chu = (v: string | null) => v?.trim() ? v : <span className="text-slate-500">{t('Chưa có')}</span>;

  return (
    <>
      {loading || !data ? <Card><Skeleton rows={5} /></Card> : (
        <Bang ten={t('Chi nhánh')} cot={COT} hang={data} khoa={(b) => b.id} onHang={setSua} dangMo={(b) => sua?.id === b.id}
          oCua={(b, c) => {
            /* AUDIT-UI C11: chi nhánh ngừng = chữ `text-faint` + nhãn "ngừng dùng", không opacity (chữ còn 2,1 : 1 ở chế độ sáng). */
            if (c.key === 'ma') return <b className={b.status === 'active' ? 'text-slate-100' : 'text-faint'}>{b.code}</b>;
            if (c.key === 'ten') return b.status === 'active' ? b.name : <span className="text-faint">{b.name}<span className="ml-1.5"><Info pending>{t('ngừng dùng')}</Info></span></span>;
            if (c.key === 'dc') return chu(b.diaChi);
            if (c.key === 'sdt') return <span className="tabular-nums">{chu(b.soDienThoai)}</span>;
            return <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setSua(b); }}>{t('Sửa')}</button>;
          }} />
      )}
      {sua && <SuaChiNhanh key={sua.id} cn={sua} onClose={() => setSua(null)} onLuu={async (v) => { await gui(sua, v); setSua(null); }} />}
    </>
  );
}

const NHAN_O: Record<string, string> = { ten: t('Tên') };

function SuaChiNhanh({ cn, onClose, onLuu }: { cn: ChiNhanh; onClose: () => void; onLuu: (v: LienHe) => Promise<void> }) {
  const toast = useToast();
  const [f, setF] = useState({ name: cn.name, diaChi: cn.diaChi ?? '', soDienThoai: cn.soDienThoai ?? '' });
  const [goc] = useState(() => JSON.stringify(f));
  const [busy, setBusy] = useState(false);
  const [loiMay, setLoiMay] = useState<LoiTruong | null>(null);
  const lf = useLoiForm();
  const doi = (patch: Partial<typeof f>) => { setLoiMay(null); setF({ ...f, ...patch }); };
  const loi: LoiTruong[] = [...dsLoi([{ khoa: 'ten', nhan: t('Tên'), toiThieu: 1 }], { ten: f.name.trim() })];
  if (loiMay) loi.push(loiMay);
  const luu = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try { await onLuu(f); } catch (e) {
      const o = e instanceof ApiError ? (e.details?.o as string | undefined) : undefined;
      if (o && NHAN_O[o]) setLoiMay({ khoa: o, nhan: NHAN_O[o], lyDo: (e as Error).message });
      else toast.push('error', (e as Error).message);
    } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe={`${cn.code} · ${cn.name}`} onDong={onClose}
      ngCanh={<span className="text-xs text-slate-400">{t('In ở đầu tệp Báo cáo PH của lớp thuộc chi nhánh này')}</span>}
      chan={{
        daSua: JSON.stringify(f) !== goc, huy: { onClick: onClose, disabled: busy }, conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{busy ? t('Đang lưu…') : t('Lưu')}</button>,
      }}>
      <div className="space-y-4 pt-3">
        <Field label={t('Tên')} required loi={lf.loiCua(loi, 'ten')}>
          <input className="field w-full" maxLength={80} {...lf.o(loi, 'ten')} value={f.name} onChange={(e) => doi({ name: e.target.value })} />
        </Field>
        <Field label={t('Địa chỉ')}>
          <textarea className="field w-full" rows={2} maxLength={300} value={f.diaChi} onChange={(e) => doi({ diaChi: e.target.value })} />
        </Field>
        <Field label={t('Số điện thoại')}>
          <input className="field w-full sm:w-64 tabular-nums" maxLength={60} inputMode="tel" value={f.soDienThoai} onChange={(e) => doi({ soDienThoai: e.target.value })} />
        </Field>
      </div>
    </KhungPanel>
  );
}
