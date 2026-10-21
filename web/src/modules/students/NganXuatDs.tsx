import { useState } from 'react';
import { api } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { Khoi, KhungPanel } from '../../ui/KhungPanel.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { taiXlsx, type SheetXuat } from '../test/keHoach/taiXlsx.ts';
import { COT_THEO_MAU, COT_XUAT_DS, MAU_XUAT_DS, cotXuatDs, type KhoaCotXuatDs, type MauXuatDs } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type KetQua = { sheets: SheetXuat[]; tenTep: string; dem: { hocVien: number } };
type Nho = { mau: MauXuatDs; cot: KhoaCotXuatDs[] | null };

const khoaNho = (uid: number | null) => `pisa.xuat-ds:${uid ?? 0}`;
function docNho(uid: number | null): Nho {
  try {
    const j = JSON.parse(localStorage.getItem(khoaNho(uid)) ?? 'null');
    return { mau: MAU_XUAT_DS.includes(j?.mau) ? j.mau : 'co-ban', cot: Array.isArray(j?.cot) ? j.cot : null };
  } catch { return { mau: 'co-ban', cot: null }; }
}

/** Mô tả ngắn của từng mẫu (mockup 5 khung "Tùy chọn xuất"). */
const MO_TA_T = (m: MauXuatDs) => ({ 'co-ban': t('Tên học sinh · Gmail · Lớp · Cơ sở'), 'theo-doi-sos': t('11 cột · mặc định khi đang lọc SOS'),
  'ket-qua-thi': t('Loại Test / MT · tuần Test kèm năm · điểm · Đạt / Chưa đạt / Chưa đủ điểm') })[m];
const TEN_MAU: Record<MauXuatDs, string> = { 'co-ban': t('Danh sách cơ bản'), 'theo-doi-sos': t('Theo dõi SOS'), 'ket-qua-thi': t('Kết quả Test') };

/**
 * NGĂN "XUẤT EXCEL DANH SÁCH HỌC VIÊN" (OV-15f, C31 — mockup 5 khung "Tùy chọn xuất"): phạm vi (toàn bộ đang lọc / đã chọn) · mẫu cột · chọn cột.
 * Nhận ĐÚNG danh sách em trang đang hiện (`ids`, `daChon`) + chữ bộ lọc (`boLoc`, vào sheet "Thông tin xuất"); máy chủ kiểm quyền từng em.
 * Nhớ mẫu / cột lần gần nhất (máy này). `macDinh` đặt sẵn mẫu / cột của nơi gọi (Lịch thi: cột Kết luận + Ghi chú). Bộ lọc giữ khi lỗi / sau khi tải.
 */
export function NganXuatDs({ ids, daChon, phamDau, boLoc, macDinh, mauMacDinh, onDong }: {
  /** `daChon` có (kể cả rỗng) = nơi gọi có cột tick: hiện "Các HV đã chọn" (0 em → tắt). `phamDau`: phạm vi chọn sẵn (nút "Xuất các HV đã chọn" → `chon`). */
  ids: number[]; daChon?: number[]; phamDau?: 'loc' | 'chon'; boLoc: string; macDinh?: KhoaCotXuatDs[]; mauMacDinh?: MauXuatDs;
  onDong: () => void;
}) {
  const toast = useToast();
  const uid = useSession().session?.user?.id ?? null;
  const [nho] = useState(() => docNho(uid));
  const chonDs = daChon ?? [];
  const [pham, setPham] = useState<'loc' | 'chon'>(chonDs.length && phamDau !== 'loc' ? 'chon' : 'loc');
  const [mau, setMau] = useState<MauXuatDs>(mauMacDinh ?? nho.mau);
  const [cot, setCot] = useState<KhoaCotXuatDs[]>(() => macDinh ?? (mauMacDinh ? [...COT_THEO_MAU[mauMacDinh]] : nho.cot ?? [...COT_THEO_MAU[nho.mau]]));
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [xong, setXong] = useState<string | null>(null);
  const dsId = pham === 'chon' ? chonDs : ids;
  const chonMau = (m: MauXuatDs) => { setMau(m); setCot([...COT_THEO_MAU[m]]); setXong(null); };
  const batCot = (k: KhoaCotXuatDs) => { setCot((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k])); setXong(null); };
  const cotThuTu = cotXuatDs(mau, cot);

  const tai = async () => {
    if (busy || !dsId.length) return;
    setBusy(true); setLoi(null); setXong(null);
    try {
      const r = await api.post<KetQua>('/hoc-vien-lop/xuat', { ids: dsId, mau, cot: cotThuTu, boLoc, pham });
      await taiXlsx(r.sheets, r.tenTep);
      try { localStorage.setItem(khoaNho(uid), JSON.stringify({ mau, cot: cotThuTu })); } catch { /* không nhớ được thì lần sau chọn lại */ }
      const gio = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setXong(t('Đã tạo {tep} · {n} HV · {gio}', { tep: r.tenTep, n: r.dem.hocVien, gio }));
      toast.push('ok', t('Đã xuất {n} học viên — tệp {tep}', { n: r.dem.hocVien, tep: r.tenTep }));
    } catch (e: any) {
      setLoi(e.message ?? t('Chưa tạo được file.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KhungPanel tieuDe={t('Xuất Excel danh sách HV')} onDong={onDong}
      chan={{
        huy: { onClick: onDong, nhan: t('Đóng') },
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !dsId.length || !cotThuTu.length} onClick={() => void tai()}>
          {busy ? t('Đang tạo file…') : t('Xuất {n} HV', { n: dsId.length })}</button>,
      }}>
      <p className="m-0 pt-3 text-sm text-slate-200">{t('Đang lọc: {boLoc}', { boLoc })}</p>
      <Khoi tieuDe={t('Phạm vi')}>
        <div role="radiogroup" aria-label={t('Phạm vi')} className="space-y-1.5">
          <Chon dang={pham === 'loc'} onChon={() => setPham('loc')} nhan={t('Toàn bộ kết quả đang lọc — {n} HV', { n: ids.length })} phu={t('Đủ mọi trang, kể cả hàng chưa hiện')} />
          {daChon && <Chon dang={pham === 'chon'} tat={!chonDs.length} onChon={() => setPham('chon')} nhan={t('Các HV đã chọn — {n} HV', { n: chonDs.length })}
            phu={chonDs.length ? undefined : t('Tích hàng ở bảng để chọn')} />}
        </div>
      </Khoi>
      <Khoi tieuDe={t('Mẫu cột')}>
        <div role="radiogroup" aria-label={t('Mẫu cột')} className="space-y-1.5">
          {MAU_XUAT_DS.map((m) => <Chon key={m} dang={mau === m} onChon={() => chonMau(m)} nhan={TEN_MAU[m]} phu={MO_TA_T(m)} />)}
        </div>
      </Khoi>
      <Khoi tieuDe={`${t('Chọn cột')} · ${TEN_MAU[mau]}`}>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {(Object.keys(COT_XUAT_DS) as KhoaCotXuatDs[]).map((k) => (
            <label key={k} className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-200 sm:min-h-[28px]">
              <input type="checkbox" checked={cotThuTu.includes(k)} onChange={() => batCot(k)} />
              {k === 'diem' ? t('Điểm OVR · L · R · W1 · W2 · S') : k === 'gmail' || k === 'target' ? COT_XUAT_DS[k] : t(COT_XUAT_DS[k])}
            </label>
          ))}
        </div>
      </Khoi>
      <p className="m-0 pt-2 text-xs text-slate-400">{t('Kèm sheet "Thông tin xuất"')}</p>
      <div aria-live="polite" className="pt-2 text-sm">
        {busy && <p className="m-0 text-slate-300">{t('Đang tạo file · {n} HV…', { n: dsId.length })}</p>}
        {xong && <p className="m-0 text-slate-100">{xong}</p>}
        {loi && (
          <p role="alert" className="m-0 text-bad">
            {t('Chưa tạo được file.')} {loi} {t('Bộ lọc vẫn giữ.')} <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 sm:min-h-0" onClick={() => void tai()}>{t('Thử lại')}</button>
          </p>
        )}
        {!dsId.length && <p className="m-0 text-slate-400">{t('Không có học viên phù hợp để xuất. Bỏ bớt bộ lọc để thấy HV.')}</p>}
      </div>
    </KhungPanel>
  );
}

function Chon({ dang, onChon, nhan, phu, tat = false }: { dang: boolean; onChon: () => void; nhan: string; phu?: string; tat?: boolean }) {
  return (
    <label className={`flex min-h-[44px] items-start gap-2 rounded-lg border px-3 py-2 sm:min-h-0 ${tat ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${dang ? 'shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`} style={{ borderColor: 'var(--line)' }}>
      <input type="radio" className="mt-1" checked={dang} disabled={tat} onChange={onChon} />
      <span className="min-w-0"><span className="block text-sm text-slate-100">{nhan}</span>{phu && <span className="block text-xs text-slate-400">{phu}</span>}</span>
    </label>
  );
}
