import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { TrangThaiLuu, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { NutMon } from '../../ui/NutMon.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ENTRY_SKILLS, ROUTE_KHAC, ROUTE_LO_TRINH_MOI, ROUTE_NAME, kiemLopLoTrinhMoi, lopChonLoTrinhMoi, thuNgay, tuanChonDuoc, tuanLich } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { KhoiKhiLuu } from './HopTamDungKetThuc.tsx';
import type { TrangThaiBuocTiep } from './PanelBuocTiep.tsx';

type LopDich = { id: number; code: string; ft: boolean; route: string | null; tenChuongTrinh: string | null; branchCode: string; siSo?: number };
type XemTruoc = { routeGoiY: string; route: string; loi: string | null; dong: string[]; lopGiu: { id: number; code: string } | null; monDangKy?: string[] | null };

/** Giá trị sau `ms` mili giây không đổi — ô Tên lộ trình gõ từng chữ không gọi xem trước mỗi chữ. */
function useChamLai<T>(v: T, ms = 400): T {
  const [g, setG] = useState(v);
  useEffect(() => { const h = setTimeout(() => setG(v), ms); return () => clearTimeout(h); }, [v, ms]);
  return g;
}

/** Hộp "Tạm dừng/ Kết thúc học" ngay trong panel Bước tiếp / Sau thi (k4 b): ô "Có thể quay lại học" TẮT sẵn vì vừa có KQ thi thật. */
export type GiaTriDung = { ngay: string; lyDo: string; quayLai: boolean };
export function KhoiDung({ v, onChange, loTrinh, disabled }: { v: GiaTriDung; onChange: (v: GiaTriDung) => void; loTrinh: string | null; disabled?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const dong = v.quayLai
    ? [t('Đưa em vào Lưu trữ · Tạm dừng'), t('Đóng lộ trình {lt} · KQ thi giữ ở hồ sơ', { lt: loTrinh ?? '' }), t('Quay lại học ở Lưu trữ mở Lộ trình mới')]
    : [t('Đưa em vào Lưu trữ · Kết thúc học'), t('Kết thúc lộ trình {lt} · KQ thi giữ ở hồ sơ', { lt: loTrinh ?? '' }), t('Việc Bước tiếp xong')];
  return (
    <div className="flex flex-col gap-3">
      <Truong nhan={t('Từ ngày')}><div className="max-w-[220px]"><ONgay kieu="ngay" value={v.ngay || null} onChange={(ngay) => onChange({ ...v, ngay })} toiDa={homNay ?? undefined} disabled={disabled} /></div></Truong>
      <Truong nhan={t('Lý do')} tuyChon>
        <input className="field w-full" maxLength={2000} autoComplete="off" value={v.lyDo} disabled={disabled} onChange={(e) => onChange({ ...v, lyDo: e.target.value })} />
      </Truong>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
        <input type="checkbox" className="h-4 w-4" checked={v.quayLai} disabled={disabled} onChange={(e) => onChange({ ...v, quayLai: e.target.checked })} />
        <b className="font-semibold text-slate-100">{t('Có thể quay lại học')}</b>
      </label>
      <KhoiKhiLuu dong={dong} vang={!v.quayLai} />
    </div>
  );
}

/**
 * LỘ TRÌNH MỚI (P7 SV-LO-TRINH, N12 — mockup V6 `lo-trinh-moi.html` k1–k3; P8: bước "2 Môn học" mặc định môn lộ trình cũ): một panel một luồng, thay nội dung panel Bước tiếp
 * (‹ Bước tiếp, không panel lồng panel). 1 Lộ trình LT1 · LT2 · RF · Khác (Tên bắt buộc) — LT kế tiếp chọn sẵn (LT1 → LT2) · 3 Target giữ + Sửa (Khác: không bắt buộc,
 * "Bỏ Target") · 4 Bắt đầu Ngay / Thứ Hai · 5 Lớp Giữ / Lớp khác (chỉ lớp đúng loại; lớp đang giữ sai loại → lỗi tại ô + nút tắt kèm lý do) · "Khi lưu, web sẽ" do
 * máy chủ tính (cùng hàm lúc lưu). Lỗi lưu giữ mọi lựa chọn + Thử lại.
 */
export function PanelLoTrinhMoi({ bt, hocVien, lop, quayLai, dau, onClose, onSaved }: {
  bt: TrangThaiBuocTiep; hocVien: { id: number; ten: string } | null; lop?: string | null;
  quayLai?: { nhan: string; onClick: () => void }; dau?: { han?: ReactNode; dong2: ReactNode[] };
  onClose: () => void; onSaved: (x: DaLuuPanel) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const [route, setRoute] = useState<string | null>(null);   // null = lộ trình gợi ý của máy chủ
  const [ten, setTen] = useState('');
  const [suaTg, setSuaTg] = useState(false);
  const [tg, setTg] = useState('');
  const [boTarget, setBoTarget] = useState(false);
  /* P8: undefined = môn của lộ trình cũ (máy chủ trả ở xem trước); chỉ gửi khi người dùng đổi. */
  const [mon, setMon] = useState<string[] | null | undefined>(undefined);
  const [batDau, setBatDau] = useState('ngay');
  const [lopKhac, setLopKhac] = useState(false);
  const [lopMoiId, setLopMoiId] = useState<number | null>(null);
  const [tt, setTt] = useState<'dang' | 'loi' | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [bamLuu, setBamLuu] = useState(false);
  const lf = useLoiForm();
  const tenCham = useChamLai(ten.trim());
  const tgMoi = suaTg && tg.trim() ? tg.trim().replace(',', '.') : null;
  const khac = route === ROUTE_KHAC;
  const q = new URLSearchParams({
    ...(route ? { route } : {}), ...(khac && tenCham ? { routeTen: tenCham } : {}), ...(khac && boTarget ? { boTarget: '1' } : {}),
    ...(lopKhac && lopMoiId ? { lopMoiId: String(lopMoiId) } : {}), ...(batDau !== 'ngay' ? { batDau } : {}), ...(tgMoi ? { mucTieu: tgMoi } : {}),
    ...(mon !== undefined ? { mon: (mon ?? ENTRY_SKILLS).join(',') } : {}),
  }).toString();
  const xem = useApi<XemTruoc>(`/cycles/${bt.cycleId}/lo-trinh-moi/xem-truoc${q ? `?${q}` : ''}`, [q]);
  const r = route ?? xem.data?.routeGoiY ?? null;
  const dsLop = useApi<{ lop: LopDich[] }>(lopKhac ? `/students/${bt.studentId}/hoc-lai/lop-dich` : null, [lopKhac, bt.studentId]);
  /* Lớp đúng loại lộ trình (luật chung `kiemLopLoTrinhMoi`) — tìm mã lớp đã chọn. Ô "Lớp khác" bày cả lớp FT sai loại, mờ + lý do (U4). */
  const lopDung = (dsLop.data?.lop ?? []).filter((l) => r && !kiemLopLoTrinhMoi(r, { code: l.code, ft: l.ft, route: l.route }));
  const loiTen = khac && !ten.trim() ? t('Ghi tên lộ trình "Khác".') : null;
  const loiMon = mon?.length === 0 ? t('Chọn ít nhất một môn.') : null;
  const loiLop = lopKhac && !lopMoiId ? t('Chọn lớp') : xem.data?.loi && !loiTen && !loiMon ? xem.data.loi : null;
  const lyDoTat = loiTen ?? loiMon ?? (loiLop ? (lopKhac ? t('Chọn lớp để lưu') : r === 'RF' ? t('Chọn lớp RF để lưu') : t('Chọn lớp đúng loại để lưu')) : null);
  const hen = batDau !== 'ngay' ? batDau : null;
  const tenLt = khac ? ten.trim() || t('Khác') : r ?? '';
  const nutChinh = hen ? t('Hẹn bắt đầu {tuan}', { tuan: tuanLich(hen, hn) }) : khac ? t('Mở lộ trình') : t('Mở lộ trình {lt}', { lt: r ?? '' });

  const loiO = [...(loiTen ? [{ khoa: 'ten', nhan: t('Tên lộ trình'), lyDo: loiTen }] : []), ...(lopKhac && !lopMoiId ? [{ khoa: 'lop', nhan: t('Lớp'), lyDo: t('Chọn lớp') }] : [])];
  const luu = async () => {
    setBamLuu(true); lf.bam();
    if (lyDoTat || !r) return;
    setTt('dang'); setLoi(null);
    try {
      await api.post(`/cycles/${bt.cycleId}/buoc-tiep`, {
        chon: 'lo_trinh_moi', route: r, batDau, ...(khac ? { routeTen: ten.trim(), boTarget } : {}), ...(lopKhac && lopMoiId ? { lopMoiId } : {}), ...(tgMoi ? { mucTieu: tgMoi } : {}),
        ...(mon !== undefined ? { monDangKy: mon } : {}),
      });
      setTt(null);
      const lopDich = lopKhac ? lopDung.find((l) => l.id === lopMoiId)?.code ?? null : xem.data?.lopGiu?.code ?? null;
      onSaved({
        chu: hen ? t('Đã hẹn {lt}', { lt: `FT ${tenLt}` }) : t('Đã mở {lt}', { lt: `FT ${tenLt}` }),
        phu: [hocVien?.ten, lopDich, hen ? t('bắt đầu {tuan}', { tuan: tuanLich(hen, hn) }) : null].filter(Boolean).join(' · ') || null,
        hoanTac: lopKhac && !hen ? undefined : () => api.del(`/cycles/${bt.cycleId}/buoc-tiep`).then(() => undefined),
      });
    } catch (e: any) { setTt('loi'); setLoi(e?.message ?? null); }
  };

  const buoc = (so: number, nhan: ReactNode, con: ReactNode) => (
    <section className="flex flex-col gap-2 border-b pb-3.5 last:border-b-0" style={{ borderColor: 'var(--line)' }} aria-label={typeof nhan === 'string' ? nhan : undefined}>
      <span className="flex items-baseline gap-2 text-[13px] font-semibold text-slate-300"><span className="tabular-nums text-slate-500">{so}</span>{nhan}</span>
      {con}
    </section>
  );
  /* Lớp đang giữ sai loại (máy chủ báo) → nút tắt NGAY kèm lý do (k2); thiếu tên / chưa chọn lớp → báo sau khi bấm. */
  const tat = !!(xem.data?.loi && !loiTen && !lopKhac) || !!loiMon || (bamLuu && !!lyDoTat);
  const nut = <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()} disabled={tt === 'dang' || tat}>{nutChinh}</button>;
  return (
    <KhungPanel tieuDe={t('Lộ trình mới')} dau={dau} quayLai={quayLai} onDong={onClose}
      chan={{
        daSua: true, chinh: nut, conThieu: lf.conThieu(loiO),
        trai: tat && lyDoTat ? <span className="text-[13px] text-slate-400">{lyDoTat}</span> : <TrangThaiLuu tt={tt ?? 'nhap'} loi={loi} onThuLai={() => void luu()} />,
      }}>
      <div className="flex flex-col gap-3.5 pt-3">
        {buoc(1, t('Lộ trình'), (
          <>
            <div role="radiogroup" aria-label={t('Lộ trình')} className="flex flex-wrap gap-1.5">
              {ROUTE_LO_TRINH_MOI.map((k) => <NutChon key={k} chon={r === k} className="max-sm:flex-1" onClick={() => { setRoute(k); setLopMoiId(null); }}>{k === ROUTE_KHAC ? ROUTE_NAME.KHAC : k}</NutChon>)}
            </div>
            {khac && (
              <Truong nhan={t('Tên lộ trình')} batBuoc loi={lf.loiCua(loiO, 'ten')}>
                <input className="field w-full" maxLength={80} autoComplete="off" {...lf.o(loiO, 'ten')} value={ten} placeholder={t('Ví dụ: Luyện Speaking 1–1')} onChange={(e) => setTen(e.target.value)} />
              </Truong>
            )}
          </>
        ))}
        {buoc(2, t('Môn học'), (
          <>
            <NutMon ariaLabel={t('Môn học')} value={mon !== undefined ? mon : xem.data?.monDangKy ?? null} onChange={setMon} />
            {loiMon && <p role="alert" className="m-0 text-[13px] text-bad">{loiMon}</p>}
          </>
        ))}
        {buoc(3, <>Target{khac && <span className="font-normal text-slate-500">{t('(không bắt buộc)')}</span>}</>, (
          <div className="flex flex-wrap items-center gap-2.5 text-[15px]">
            {suaTg
              ? <input className="field w-24 tabular-nums" inputMode="decimal" autoComplete="off" aria-label="Target" placeholder={bt.target || t('Ví dụ: 6.5')} value={tg} onChange={(e) => setTg(e.target.value)} />
              : <b className="tabular-nums text-slate-100">{boTarget ? '—' : bt.target || '—'}</b>}
            {!suaTg && !boTarget && bt.target && <span className="text-sm text-slate-500">{t('giữ')}</span>}
            {!suaTg && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" onClick={() => { setSuaTg(true); setBoTarget(false); setTg(bt.target); }}>{t('Sửa')}</button>}
            {khac && !boTarget && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" onClick={() => { setBoTarget(true); setSuaTg(false); }}>{t('Bỏ Target')}</button>}
          </div>
        ))}
        {buoc(4, t('Bắt đầu'), (
          <div className="flex flex-wrap items-center gap-1.5">
            <NutChon chon={batDau === 'ngay'} onClick={() => setBatDau('ngay')}>{t('Ngay bây giờ')}</NutChon>
            <NutChon chon={batDau !== 'ngay'} onClick={() => setBatDau(tuanChonDuoc(hn, 4)[0] ?? 'ngay')}>{t('Thứ Hai {ngay}', { ngay: thuNgay(tuanChonDuoc(hn, 4)[0] ?? hn, hn).replace(/^[^ ]+ /, '') })}</NutChon>
            {batDau !== 'ngay' && (
              <select className="field w-auto" aria-label={t('Tuần bắt đầu')} value={batDau} onChange={(e) => setBatDau(e.target.value)}>
                {tuanChonDuoc(hn, 4).map((m) => <option key={m} value={m}>{tuanLich(m, hn)} · {thuNgay(m, hn)}</option>)}
              </select>
            )}
          </div>
        ))}
        {buoc(5, t('Lớp'), (
          <>
            <div role="radiogroup" aria-label={t('Lớp')} className="flex flex-wrap gap-1.5">
              <NutChon chon={!lopKhac} onClick={() => setLopKhac(false)}>{t('Giữ {lop}', { lop: xem.data?.lopGiu?.code ?? bt.lopNay?.code ?? lop ?? '' })}</NutChon>
              <NutChon chon={lopKhac} onClick={() => setLopKhac(true)}>{t('Lớp khác')}</NutChon>
            </div>
            {lopKhac && (
              <ChonLop ariaLabel={t('Lớp khác')} value={lopMoiId} onChange={setLopMoiId} invalid={bamLuu && !lopMoiId}
                khongKhop={dsLop.data ? t('Không có lớp {lt} đang chạy', { lt: r === 'RF' ? 'RF' : khac ? 'FT' : 'LT' }) : t('Đang tải…')}
                ds={r ? lopChonLoTrinhMoi(r, dsLop.data?.lop ?? []) : []} />
            )}
            {loiLop && !(lopKhac && !lopMoiId && !bamLuu) && <p role="alert" className="m-0 text-[13px] text-bad">{loiLop}</p>}
          </>
        ))}
        <KhoiKhiLuu dong={xem.data?.dong ?? []} />
      </div>
    </KhungPanel>
  );
}
