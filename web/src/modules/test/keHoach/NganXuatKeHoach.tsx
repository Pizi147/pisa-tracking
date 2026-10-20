import { useEffect, useState } from 'react';
import { api } from '../../../lib/api.ts';
import { Khoi, KhungPanel } from '../../../ui/KhungPanel.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { Skeleton } from '../../../ui/ui.tsx';
import { t } from '@shared/i18n/index.ts';
import { taiXlsx, type SheetXuat } from './taiXlsx.ts';

type KetQua = { sheets: SheetXuat[]; tenTep: string; dem: { hocVien: number; lop: number }; boLoc: string };

/**
 * NGĂN "XUẤT EXCEL · KẾ HOẠCH TEST" (OV-15c, C17 — mockup 4 khung 4): phạm vi = bộ lọc đang xem (chi nhánh + các lớp FT đang hiện), 13 cột
 * `Gmail | Tên học sinh | Lớp | MT1…MT10`, ô MT là LỊCH THI (không phải điểm). Xem trước 4 hàng (cuộn ngang trong khung), sheet "Thông tin xuất".
 * Xem trước và tải gọi CÙNG `POST /ke-hoach-test/xuat` (tải mới ghi nhật ký) nên số hàng không lệch.
 */
export function NganXuatKeHoach({ branchId, classIds, chiXepLai = false, onDong }: { branchId: number | null; classIds: number[];
  /** SL1 (V3B-07 #4): chip "Chỉ cần xếp lại" đang bật — tệp cùng tập. */ chiXepLai?: boolean; onDong: () => void }) {
  const toast = useToast();
  const [kq, setKq] = useState<KetQua | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const body = { branchId, classIds, chiXepLai };
  useEffect(() => {
    api.post<KetQua>('/ke-hoach-test/xuat', { ...body, xemTruoc: true }).then(setKq).catch((e) => setLoi(e.message ?? t('Không xem trước được.')));
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const tai = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<KetQua>('/ke-hoach-test/xuat', body);
      await taiXlsx(r.sheets, r.tenTep);
      toast.push('ok', t('Đã xuất {n} học viên — tệp {tep}', { n: r.dem.hocVien, tep: r.tenTep }));
      onDong();
    } catch (e: any) {
      toast.push('error', e.message ?? t('Không xuất được tệp.'));
    } finally {
      setBusy(false);
    }
  };
  const bang = kq?.sheets[0]?.aoa ?? [];
  const thongTin = kq?.sheets[1]?.aoa ?? [];
  return (
    <KhungPanel tieuDe={t('Xuất Excel · Kế hoạch Test')} rong="rong" onDong={onDong}
      chan={{
        huy: { onClick: onDong },
        phu: kq ? <span className="hidden min-w-0 truncate text-xs text-slate-400 sm:inline" title={kq.tenTep}>{kq.tenTep}</span> : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={!kq || busy || kq.dem.hocVien === 0} onClick={() => void tai()}>
          {busy ? t('Đang xuất…') : t('Tải file .xlsx')}</button>,
      }}>
      {loi ? <p role="alert" className="m-0 py-3 text-sm text-bad">{loi}</p> : !kq ? <div className="py-3"><Skeleton rows={4} /></div> : (
        <>
          <p className="m-0 pt-3 text-sm text-slate-200">{t('Theo bộ lọc đang xem: {boLoc}', { boLoc: kq.boLoc })}</p>
          <Khoi tieuDe={t('Xem trước · sheet “Kế hoạch Test” ({n} / {tong} hàng)', { n: Math.min(4, bang.length - 1), tong: bang.length - 1 })}>
            {bang.length <= 1 ? <p className="m-0 text-xs text-slate-400">{t('Không có học viên nào — đổi bộ lọc.')}</p> : (
              <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--line)' }}>
                <table className="text-xs">
                  <thead><tr>{bang[0].map((c, i) => <th key={i} className="whitespace-nowrap px-2 py-1 text-left font-semibold text-slate-400">{c}</th>)}</tr></thead>
                  <tbody>
                    {bang.slice(1, 5).map((h, r) => (
                      <tr key={r} className="border-t" style={{ borderColor: 'var(--line)' }}>
                        {h.map((c, i) => <td key={i} className="whitespace-nowrap px-2 py-1 tabular-nums text-slate-200">{c ?? ''}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Khoi>
          <Khoi tieuDe={t('Sheet “Thông tin xuất”')}>
            <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
              {thongTin.map(([k, v], i) => (
                <div key={i} className="contents"><dt className="text-slate-400">{k}</dt><dd className="m-0 whitespace-pre-line text-slate-200">{v}</dd></div>
              ))}
            </dl>
          </Khoi>
        </>
      )}
    </KhungPanel>
  );
}
