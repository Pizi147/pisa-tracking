import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../../../lib/api.ts';
import { Khoi, KhungPanel, Truong } from '../../../ui/KhungPanel.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { Skeleton } from '../../../ui/ui.tsx';
import { t } from '@shared/i18n/index.ts';
import { taiXlsx, type SheetXuat } from './taiXlsx.ts';
import { TimLop } from './TimLop.tsx';
import type { LopKH } from './kieu.ts';

type LopCo = { id: number; ma: string; chiNhanh: string; soHv: number };
type KetQua = { sheets: SheetXuat[]; tenTep: string; dem: { hocVien: number; lop: number }; boLoc: string; chiNhanh?: string; lopCo?: LopCo[] };

/**
 * TAB "LỊCH TEST" CỦA NGĂN XUẤT EXCEL (G1-08; trước: ngăn "Xuất Excel · Kế hoạch Test" OV-15c, C17 — mockup 4 khung 4): phạm vi = bộ lọc đang xem
 * (chi nhánh + các lớp FT đang hiện), thu hẹp được ngay trong ngăn (`lopCo` từ chính câu phạm vi của xem trước). 13 cột `Gmail | Tên học sinh | Lớp | MT1…MT10`,
 * ô MT là LỊCH THI (không phải điểm). Xem trước 4 hàng, sheet "Thông tin xuất". Xem trước và tải gọi CÙNG `POST /ke-hoach-test/xuat` (tải mới ghi nhật ký).
 */
export function NganXuatKeHoach({ branchId, classIds, chiXepLai = false, tieuDe = t('Xuất Excel'), tabs, vungTab, onDong }: { branchId: number | null; classIds: number[];
  /** SL1 (V3B-07 #4): chip "Chỉ cần xếp lại" đang bật — tệp cùng tập. */ chiXepLai?: boolean;
  tieuDe?: string; tabs?: ReactNode; vungTab?: { id: string; nhan: string }; onDong: () => void }) {
  const toast = useToast();
  const [chon, setChon] = useState<{ id: number; ma: string }[]>([]);   // rỗng = theo bộ lọc đang xem
  const [tim, setTim] = useState('');
  const [kq, setKq] = useState<KetQua | null>(null);
  const [lopCo, setLopCo] = useState<LopCo[]>([]);
  const [loi, setLoi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const body = { branchId, classIds: chon.length ? chon.map((l) => l.id) : classIds, chiXepLai };
  const khoa = JSON.stringify(body);
  useEffect(() => {
    let con = true;
    setKq(null); setLoi(null);
    api.post<KetQua>('/ke-hoach-test/xuat', { ...body, xemTruoc: true })
      .then((r) => { if (con) { setKq(r); if (r.lopCo) setLopCo(r.lopCo); } })
      .catch((e) => { if (con) setLoi(e.message ?? t('Không xem trước được.')); });
    return () => { con = false; };
  }, [khoa]);   // eslint-disable-line react-hooks/exhaustive-deps

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
  const goiY: LopKH[] = lopCo.filter((l) => !chon.some((c) => c.id === l.id)).map((l) => ({
    id: l.id, code: l.ma, loai: 'ft', chiNhanh: l.chiNhanh, chuongTrinh: null, soHv: l.soHv, chuaCoLichTiep: 0, hvChuaCoLich: 0, tomTat: '', canXepLai: 0,
  }));
  const bang = kq?.sheets[0]?.aoa ?? [];
  const thongTin = kq?.sheets[1]?.aoa ?? [];
  return (
    <KhungPanel hd="xuat-excel" tieuDe={tieuDe} tabs={tabs} vungTab={vungTab} onDong={onDong}
      chan={{
        huy: { onClick: onDong },
        trai: kq ? <span className="min-w-0 truncate text-xs text-slate-400" title={kq.tenTep}>{kq.tenTep}</span> : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={!kq || busy || kq.dem.hocVien === 0} onClick={() => void tai()}>
          {busy ? t('Đang xuất…') : kq ? t('Xuất Excel · {n} HV', { n: kq.dem.hocVien }) : t('Xuất Excel')}</button>,
      }}>
      <Khoi tieuDe={t('Phạm vi')}>
        <Truong nhan={t('Khung lớp')} as="div"><p className="m-0 text-sm text-slate-100">Fast Track</p></Truong>
        <Truong nhan={t('Chi nhánh')} as="div"><p className="m-0 text-sm text-slate-100">{kq?.chiNhanh ?? (lopCo.length ? [...new Set(lopCo.map((l) => l.chiNhanh))].join(', ') : '…')}</p></Truong>
        <Truong nhan={t('Lớp')} as="div">
          <div className="space-y-2 [&_.label]:sr-only">
            {chon.length ? (
              <div className="flex flex-wrap gap-1.5">
                {chon.map((l) => (
                  <button key={l.id} type="button" title={t('Bỏ lớp {ma}', { ma: l.ma })} onClick={() => setChon((ds) => ds.filter((x) => x.id !== l.id))} className="nut-loc nut-loc-dang">
                    {l.ma}<span aria-hidden>✕</span><span className="sr-only">{t('bỏ lớp')}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="m-0 text-sm text-slate-100">
                {classIds.length ? t('Các lớp Fast Track đang hiện') : t('Mọi lớp Fast Track')}
                {kq && <span className="tabular-nums text-slate-400"> · {t('{n} lớp', { n: kq.dem.lop })} · {t('{n} HV', { n: kq.dem.hocVien })}</span>}
              </p>
            )}
            <TimLop lop={goiY} value={tim} onChange={setTim} placeholder={t('Thu hẹp: tìm lớp FT…')}
              onChon={(l) => { setChon((ds) => [...ds, { id: l.id, ma: l.code }]); setTim(''); }} />
          </div>
        </Truong>
      </Khoi>
      {loi ? <p role="alert" className="m-0 py-3 text-sm text-bad">{loi}</p> : !kq ? <div className="py-3"><Skeleton rows={4} /></div> : (
        <>
          <Khoi tieuDe={t('Xem trước · sheet “Kế hoạch Test” ({n} / {tong} hàng)', { n: Math.min(4, bang.length - 1), tong: bang.length - 1 })}
            luat={t('Ô MT1…MT10 là tuần thi (lịch), không phải điểm.')}>
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
