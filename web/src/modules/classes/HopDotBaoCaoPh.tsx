import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { addDaysIso, tuanLich, type LoiTruong } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** `POST /bao-cao-ph/dot` — khớp `doiDotBaoCaoPh` của máy chủ. */
type KetQua = { lopDoi: number[]; boQua: number; dotIds?: number[]; ma?: { classId: number; ma: string }[]; cu?: { ten: string | null; mo: string; han: string } };
type LopCho = { id: number; ma: string; ft: boolean; ct: string };
export type KieuHopDot = 'bo' | 'them' | 'sua' | 'xoa' | 'khoi-phuc';
/** Đợt đang xem: đợt đang dùng, hoặc đợt ngoài danh sách (`kieu`: đã bỏ · sắp mở · đã xoá). `ten` / `mo` / `han` của đợt thêm. */
export type DotHop = { ma: string; nhan: string; kieu?: 'bo' | 'sap' | 'xoa'; ten?: string | null; mo?: string; han?: string };

export const lamMoiBaoCaoPh = () => { for (const k of ['/classes', '/my-work', '/hoc-vien-lop']) invalidate(k); };
export const guiDotBc = (body: Record<string, unknown>) => api.post<KetQua>('/bao-cao-ph/dot', body);

/**
 * BC-DOT-QL (chủ SP 06/11): hộp của QL / Quản trị / Admin ở tab Báo cáo PH — Không báo cáo · Đợt mới (bất chợt) · Sửa · Xoá · Khôi phục.
 * Áp lớp này; "Thêm lớp" áp luôn các lớp CÙNG chi nhánh (máy chủ bỏ qua lớp không có đợt đó và nói số lớp bỏ qua). Xong luôn có Hoàn tác (toast);
 * đợt bỏ / đã xoá còn trong ô chọn đợt để Khôi phục về sau.
 */
export function HopDotBaoCaoPh({ kieu, lopId, lopMa, chiNhanh, ft, dot, onClose, onDone }: {
  kieu: KieuHopDot; lopId: number; lopMa: string; chiNhanh: number; ft: boolean;
  dot?: DotHop;
  onClose: () => void;
  /** `ma` = đợt nên mở sau việc này; `null` = đợt mặc định; `undefined` = chỉ tải lại. */
  onDone: (ma?: string | null) => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const suaDot = kieu === 'them' || kieu === 'sua';
  const [them, setThem] = useState<number[]>([]);
  const [ten, setTen] = useState(dot?.ten ?? '');
  const [mo, setMo] = useState(kieu === 'sua' ? dot?.mo ?? '' : '');
  const [han, setHan] = useState(kieu === 'sua' ? dot?.han ?? '' : '');
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const moHien = mo || homNay;
  const hanHien = han || (moHien ? addDaysIso(moHien, 6) : '');
  const ds = useApi<{ rows: LopCho[] }>(`/bao-cao-ph/lop?branchId=${chiNhanh}`, [chiNhanh]);
  /* Đợt tính từ lịch: tháng chỉ có ở lớp FT; tuần của lớp thường trùng khi cùng tuần thi — máy chủ bỏ qua lớp không có. Đợt thêm: máy chủ khớp theo tên / mở / hạn. */
  const theoMaTinh = (kieu === 'bo' || (kieu === 'khoi-phuc' && dot?.kieu === 'bo')) && !!dot;
  const choThem = (ds.data?.rows ?? []).filter((l) => l.id !== lopId && !them.includes(l.id) && (!theoMaTinh || (dot!.ma.startsWith('thang:') ? l.ft : !l.ft)));
  const classIds = [lopId, ...them];
  const dotId = dot?.ma.startsWith('them:') ? Number(dot.ma.slice(5)) : 0;
  const nhan = dot ? dich(dot.nhan) : '';
  const dem = (r: KetQua) => t('{n} lớp', { n: r.lopDoi.length }) + (r.boQua ? ` · ${t('{n} lớp không có đợt này', { n: r.boQua })}` : '');

  /** Báo xong: toast Hoàn tác (`lui` làm ngược; `moLai` = đợt mở khi Hoàn tác), rồi mở `mo`. */
  const xong = (thongBao: string, lui: () => Promise<unknown>, moLai: string | null, mo_: string | null | undefined) => {
    lamMoiBaoCaoPh();
    toast.hoanTac(thongBao, async () => {
      try { await lui(); lamMoiBaoCaoPh(); toast.push('ok', t('Đã hoàn tác')); onDone(moLai); } catch (e: any) { toast.push('error', e.message); }
    }, { key: `bc-dot:${lopId}` });
    onDone(mo_);
  };
  const maCuaLop = (r: KetQua) => r.ma?.find((x) => x.classId === lopId)?.ma ?? null;

  const luu = async () => {
    setBusy(true);
    try {
      if (kieu === 'bo') {
        const r = await guiDotBc({ viec: 'bo', classIds, ma: dot!.ma });
        xong(t('Đã bỏ đợt {dot} · {n}', { dot: nhan, n: dem(r) }), () => guiDotBc({ viec: 'khoi-phuc', classIds: r.lopDoi, ma: dot!.ma }), dot!.ma, null);
      } else if (kieu === 'khoi-phuc' && dot!.kieu === 'bo') {
        const r = await guiDotBc({ viec: 'khoi-phuc', classIds, ma: dot!.ma });
        xong(t('Đã khôi phục đợt {dot} · {n}', { dot: nhan, n: dem(r) }), () => guiDotBc({ viec: 'bo', classIds: r.lopDoi, ma: dot!.ma }), null, dot!.ma);
      } else if (kieu === 'khoi-phuc') {
        const r = await guiDotBc({ viec: 'hoan-xoa', dotId, classIds });
        xong(t('Đã khôi phục đợt {dot} · {n}', { dot: nhan, n: dem(r) }), () => guiDotBc({ viec: 'xoa', dotIds: r.dotIds }), null, maCuaLop(r));
      } else if (kieu === 'xoa') {
        const r = await guiDotBc({ viec: 'xoa', dotId, classIds });
        xong(t('Đã xoá đợt {dot} · {n}', { dot: nhan, n: dem(r) }), () => guiDotBc({ viec: 'hoan-xoa', dotIds: r.dotIds }), dot!.ma, null);
      } else if (kieu === 'sua') {
        const r = await guiDotBc({ viec: 'sua', dotId, classIds, ten: ten.trim() || undefined, mo: moHien, han: hanHien });
        xong(t('Đã sửa đợt {dot} · {n}', { dot: nhan, n: dem(r) }), () => guiDotBc({ viec: 'sua', dotIds: r.dotIds, ten: r.cu?.ten ?? '', mo: r.cu?.mo, han: r.cu?.han }), dot!.ma, dot!.ma);
      } else {
        const r = await guiDotBc({ viec: 'them', classIds, ten: ten.trim() || undefined, mo: moHien, han: hanHien });
        xong(t('Đã thêm đợt báo cáo · {n}', { n: dem(r) }), () => guiDotBc({ viec: 'xoa', dotIds: r.dotIds }), null, maCuaLop(r));
      }
      onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  const loi: LoiTruong[] = suaDot && (!moHien || !hanHien || hanHien < moHien) ? [{ khoa: 'han', nhan: t('Hạn'), lyDo: t('Hạn phải sau hoặc cùng ngày mở') }] : [];
  const tieuDe = { bo: t('Không báo cáo đợt này'), them: t('Đợt báo cáo mới'), sua: t('Sửa đợt'), xoa: t('Xoá đợt'), 'khoi-phuc': t('Khôi phục đợt') }[kieu];
  const nutChinh = { bo: t('Bỏ đợt này'), them: t('Thêm đợt'), sua: t('Lưu'), xoa: t('Xoá đợt'), 'khoi-phuc': t('Khôi phục') }[kieu];
  const loiGiai = {
    bo: t('Đợt này ẩn khỏi tab, việc Admin "Xuất báo cáo PH" và file Excel chi nhánh. Bài đã viết giữ nguyên; Khôi phục lúc nào cũng được.'),
    xoa: t('Đợt này ẩn khỏi tab, việc Admin và file Excel chi nhánh. Bài đã viết giữ nguyên; khôi phục ở mục "Đã xoá" của ô chọn đợt.'),
    'khoi-phuc': t('Đợt này hiện lại ở tab, việc Admin và file Excel chi nhánh.'),
  } as Partial<Record<KieuHopDot, string>>;
  return (
    <KhungPanel tieuDe={tieuDe} lop={lopMa} rong="hep" onDong={onClose}
      chan={{ daSua: them.length > 0 || (suaDot && (!!ten.trim() || !!mo || !!han) && kieu === 'them') || (kieu === 'sua' && (ten !== (dot?.ten ?? '') || moHien !== dot?.mo || hanHien !== dot?.han)),
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] font-semibold sm:min-h-0" disabled={busy} onClick={() => { if (loi.length) lf.bam(); else void luu(); }}>{nutChinh}</button> }}>
      {suaDot ? (
        <Khoi tieuDe={kieu === 'sua' ? nhan : t('Đợt')}>
          <Truong nhan={t('Tên đợt')} tuyChon>
            <input className="field w-full" name="ten-dot" autoComplete="off" maxLength={40} value={ten}
              placeholder={moHien ? t('Đợt {tuan}', { tuan: tuanLich(moHien, homNay) }) : ''} onChange={(e) => setTen(e.target.value)} />
          </Truong>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Truong nhan={t('Mở từ')} batBuoc><ONgay kieu="ngay" value={moHien} onChange={setMo} ariaLabel={t('Mở từ')} /></Truong>
            <Truong nhan={t('Hạn')} batBuoc loi={lf.loiCua(loi, 'han')}>
              <ONgay kieu="ngay" value={hanHien} onChange={setHan} toiThieu={moHien} ariaLabel={t('Hạn')} id={lf.oId('han')} onBlur={lf.roi('han')} invalid={!!lf.loiCua(loi, 'han')} />
            </Truong>
          </div>
          <p className="m-0 text-[13px] text-slate-400">{moHien > homNay && <>{t('Mở sau hôm nay: đợt hiện cho giáo viên từ ngày mở (xem ở mục "Sắp mở").')} </>}{ft ? t('Điểm tự điền: Mock gần nhất có điểm trước hạn.') : t('Điểm tự điền: Progress / Final gần nhất có điểm trước hạn.')}</p>
        </Khoi>
      ) : (
        <Khoi tieuDe={nhan}>
          <p className="m-0 text-sm text-slate-300">{loiGiai[kieu]}</p>
        </Khoi>
      )}
      <Khoi tieuDe={t('Áp cho lớp')}>
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
            <ChonLop noi className="w-44 max-sm:w-full" ariaLabel={t('Thêm lớp')} value={null} placeholder={t('+ lớp')}
              onChange={(id) => { if (id) setThem((s) => [...s, id]); }} ds={choThem.map((l) => ({ id: l.id, ma: l.ma, phu: l.ct }))} />
          )}
        </div>
        <p className="m-0 text-[13px] text-slate-400">{t('Chỉ lớp cùng chi nhánh.')}</p>
      </Khoi>
    </KhungPanel>
  );
}
