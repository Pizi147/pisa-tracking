import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { addDaysIso, ngay, tuanLich, type LoiTruong } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** `POST /bao-cao-ph/dot` — khớp `doiDotBaoCaoPh` của máy chủ. */
type KetQua = { lopDoi: number[]; boQua: number; dotIds?: number[]; ma?: { classId: number; ma: string }[]; truoc?: { ten: string | null; mo: string; han: string } };
type LopCho = { id: number; ma: string; ft: boolean; ct: string };

export const lamMoiBaoCaoPh = () => { for (const k of ['/classes', '/my-work', '/hoc-vien-lop']) invalidate(k); };
export const guiDotBc = (body: Record<string, unknown>) => api.post<KetQua>('/bao-cao-ph/dot', body);

/**
 * BC-DOT-QL (chủ SP 06/11): hộp của QL / Quản trị / Admin ở tab Báo cáo PH — "Không báo cáo đợt này" hoặc "Đợt báo cáo mới" (bất chợt).
 * Áp lớp này; "Thêm lớp" áp luôn các lớp CÙNG chi nhánh (máy chủ bỏ qua lớp không có đợt đó và nói số lớp bỏ qua). Xong có Hoàn tác (toast).
 * LG-2 (chủ SP 14/11): "Mở từ" chọn được ngày tương lai (đợt "sắp mở"); `kieu === 'sua'` sửa tên / ngày một đợt thêm của lớp này.
 */
export function HopDotBaoCaoPh({ kieu, lopId, lopMa, chiNhanh, ft, dot, sua, onClose, onDone }: {
  kieu: 'bo' | 'them' | 'sua'; lopId: number; lopMa: string; chiNhanh: number; ft: boolean;
  /** `kieu === 'bo'`: đợt đang xem. */
  dot?: { ma: string; nhan: string };
  /** `kieu === 'sua'`: đợt thêm đang sửa. */
  sua?: { id: number; ma: string; nhan: string; ten: string | null; mo: string; han: string };
  onClose: () => void;
  /** `ma` = mã đợt vừa thêm của lớp này (để mở ngay) hoặc `null` (về đợt mặc định); `undefined` = chỉ tải lại. */
  onDone: (ma?: string | null) => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [them, setThem] = useState<number[]>([]);
  const [ten, setTen] = useState(sua?.ten ?? '');
  const [mo, setMo] = useState(sua?.mo ?? '');
  const [han, setHan] = useState(sua?.han ?? '');
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const moHien = mo || homNay;
  const hanHien = han || (moHien ? addDaysIso(moHien, 6) : '');
  const ds = useApi<{ rows: LopCho[] }>(kieu === 'sua' ? null : `/bao-cao-ph/lop?branchId=${chiNhanh}`, [chiNhanh, kieu]);
  /* Đợt tháng chỉ có ở lớp FT; đợt tuần của lớp thường có thể trùng tuần ở lớp khác — máy chủ bỏ qua lớp không có. */
  const choThem = (ds.data?.rows ?? []).filter((l) => l.id !== lopId && !them.includes(l.id) && (kieu === 'them' || (dot?.ma.startsWith('thang:') ? l.ft : !l.ft)));
  const classIds = [lopId, ...them];

  const luu = async () => {
    setBusy(true);
    try {
      if (kieu === 'bo') {
        const r = await guiDotBc({ viec: 'bo', classIds, ma: dot!.ma });
        lamMoiBaoCaoPh();
        toast.hoanTac(t('Đã bỏ đợt {dot} · {n} lớp', { dot: dich(dot!.nhan), n: r.lopDoi.length }) + (r.boQua ? ` · ${t('{n} lớp không có đợt này', { n: r.boQua })}` : ''), async () => {
          try { await guiDotBc({ viec: 'khoi-phuc', classIds: r.lopDoi, ma: dot!.ma }); lamMoiBaoCaoPh(); toast.push('ok', t('Đã hoàn tác')); onDone(dot!.ma); } catch (e: any) { toast.push('error', e.message); }
        }, { key: `bc-dot:${lopId}` });
        onDone(null);
      } else if (kieu === 'sua') {
        const r = await guiDotBc({ viec: 'sua', dotId: sua!.id, ten: ten.trim() || undefined, mo: moHien, han: hanHien });
        lamMoiBaoCaoPh();
        const cu = r.truoc!;
        toast.hoanTac(t('Đã sửa đợt {dot}', { dot: ten.trim() || dich(sua!.nhan) }), async () => {
          try { await guiDotBc({ viec: 'sua', dotId: sua!.id, ten: cu.ten ?? undefined, mo: cu.mo, han: cu.han }); lamMoiBaoCaoPh(); toast.push('ok', t('Đã hoàn tác')); onDone(sua!.ma); } catch (e: any) { toast.push('error', e.message); }
        }, { key: `bc-dot:${lopId}` });
        onDone(sua!.ma);
      } else {
        const r = await guiDotBc({ viec: 'them', classIds, ten: ten.trim() || undefined, mo: moHien, han: hanHien });
        lamMoiBaoCaoPh();
        toast.hoanTac(moHien > homNay ? t('Đã hẹn đợt báo cáo · mở {ngay} · {n} lớp', { ngay: ngay(moHien, homNay), n: r.lopDoi.length })
          : t('Đã thêm đợt báo cáo · {n} lớp', { n: r.lopDoi.length }), async () => {
          try { await guiDotBc({ viec: 'xoa', dotIds: r.dotIds }); lamMoiBaoCaoPh(); toast.push('ok', t('Đã hoàn tác')); onDone(null); } catch (e: any) { toast.push('error', e.message); }
        }, { key: `bc-dot:${lopId}` });
        onDone(r.ma?.find((x) => x.classId === lopId)?.ma ?? null);
      }
      onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const loi: LoiTruong[] = kieu !== 'bo' && (!moHien || !hanHien || hanHien < moHien) ? [{ khoa: 'han', nhan: t('Hạn'), lyDo: t('Hạn phải sau hoặc cùng ngày mở') }] : [];
  return (
    <KhungPanel tieuDe={kieu === 'bo' ? t('Không báo cáo đợt này') : kieu === 'sua' ? t('Sửa đợt') : t('Đợt báo cáo mới')} lop={lopMa} rong="hep" onDong={onClose}
      chan={{ daSua: kieu === 'sua' ? ten !== (sua!.ten ?? '') || mo !== sua!.mo || han !== sua!.han : them.length > 0 || !!ten.trim() || !!mo || !!han, conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] font-semibold sm:min-h-0" disabled={busy} onClick={() => { if (loi.length) lf.bam(); else void luu(); }}>
          {kieu === 'bo' ? t('Bỏ đợt này') : kieu === 'sua' ? t('Lưu') : t('Thêm đợt')}</button> }}>
      {kieu === 'bo' ? (
        <Khoi tieuDe={dich(dot!.nhan)}>
          <p className="m-0 text-sm text-slate-300">{t('Đợt này ẩn khỏi tab, việc Admin "Xuất báo cáo PH" và file Excel chi nhánh. Bài đã viết giữ nguyên; Khôi phục lúc nào cũng được.')}</p>
        </Khoi>
      ) : (
        <Khoi tieuDe={t('Đợt')}>
          <Truong nhan={t('Tên đợt')} tuyChon>
            <input className="field w-full" name="ten-dot" autoComplete="off" maxLength={40} value={ten} placeholder={moHien ? t('Đợt {tuan}', { tuan: tuanLich(moHien, homNay) }) : ''} onChange={(e) => setTen(e.target.value)} />
          </Truong>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Truong nhan={t('Mở từ')} batBuoc><ONgay kieu="ngay" value={moHien} onChange={setMo} ariaLabel={t('Mở từ')} /></Truong>
            <Truong nhan={t('Hạn')} batBuoc loi={lf.loiCua(loi, 'han')}><ONgay kieu="ngay" value={hanHien} onChange={setHan} toiThieu={moHien} ariaLabel={t('Hạn')} id={lf.oId('han')} onBlur={lf.roi('han')} invalid={!!lf.loiCua(loi, 'han')} /></Truong>
          </div>
          <p className="m-0 text-[13px] text-slate-400">{ft ? t('Điểm tự điền: Mock gần nhất có điểm trước hạn.') : t('Điểm tự điền: Progress / Final gần nhất có điểm trước hạn.')}</p>
        </Khoi>
      )}
      {kieu !== 'sua' && <Khoi tieuDe={t('Áp cho lớp')}>
        <div role="group" aria-label={t('Lớp đã chọn')} className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex h-7 items-center rounded border px-2 text-xs font-semibold text-slate-100" style={{ borderColor: 'var(--line-strong)' }}>{lopMa}</span>
          {them.map((id) => {
            const l = ds.data?.rows.find((x) => x.id === id);
            return (
              <span key={id} className="inline-flex h-7 items-center gap-1 rounded border px-2 text-xs text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>
                {l?.ma ?? id}
                <button type="button" className="btn btn-sm btn-ghost relative -mr-1 min-h-[28px] min-w-[28px] justify-center px-0 max-sm:after:absolute max-sm:after:-inset-2 max-sm:after:content-['']"
                  aria-label={t('Bỏ lớp {ma}', { ma: l?.ma ?? id })} onClick={() => setThem((s) => s.filter((x) => x !== id))}>✕</button>
              </span>
            );
          })}
          {choThem.length > 0 && (
            <ChonLop className="w-44 max-sm:w-full" ariaLabel={t('Thêm lớp')} value={null} placeholder={t('+ lớp')}
              onChange={(id) => { if (id) setThem((s) => [...s, id]); }} ds={choThem.map((l) => ({ id: l.id, ma: l.ma, phu: l.ct }))} />
          )}
        </div>
        <p className="m-0 text-[13px] text-slate-400">{t('Chỉ lớp cùng chi nhánh.')}</p>
      </Khoi>}
    </KhungPanel>
  );
}
