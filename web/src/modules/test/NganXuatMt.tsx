import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, NutChon } from '../../ui/ui.tsx';
import {
  COT_FT_GON, COT_FT_THEM, DOT_XUAT_FT, DOT_XUAT_THUONG, bodyXuatMt, docBoLocXuatMt, mondayOfDate, nhanKhoaDot, queryXuatMt,
  type Cell, type KhungXuat, type ThoiGianXuat,
} from '@shared/domain/index.ts';
import type { LopKH } from './keHoach/kieu.ts';
import { TimLop } from './keHoach/TimLop.tsx';
import { NGON_NGU, dich, t } from '@shared/i18n/index.ts';

type PhamVi = {
  chiNhanh: { id: number; ten: string }[];
  lop: { id: number; ma: string; chiNhanhId: number; ft: boolean; daKetThuc: boolean; soHv: number }[];
};
type XemTruoc = { phamVi: PhamVi; dem: { luot: number; hocVien: number; lop: number }; dauDong: string[]; tenTep: string };
type Kieu = ThoiGianXuat['kieu'];

/** Độ rộng cột theo chữ dài nhất của tiêu đề và 200 dòng đầu — 8…40 ký tự. */
const doRong = (aoa: Cell[][]) => (aoa[0] ?? []).map((_, c) => ({
  wch: Math.min(40, Math.max(8, ...aoa.slice(0, 200).map((h) => String(h[c] ?? '').length + 2))),
}));

/**
 * NGĂN "XUẤT EXCEL" KẾT QUẢ TEST (M11 · YC-13.9 · T40) — mở từ Lịch Test, hồ sơ lớp ⋮ và Phân tích › Tổng hợp Test.
 * Ba bước trong một ngăn: Phạm vi (chi nhánh · lớp) → Thời gian (tuần · tháng · đợt) → Lượt và cột. Các điều kiện cộng dồn.
 * Xem trước gọi máy chủ sau 400 ms kể từ lần đổi lọc cuối; bấm Xuất gọi CÙNG bộ lọc nên số dòng tệp = số lượt xem trước.
 * Máy chủ trả mảng hai chiều, trình duyệt chỉ dựng `.xlsx` (thư viện nạp động — không vào gói chính).
 */
export function NganXuatMt({ khung: khungDau, chiNhanh, lop, thoiGianMacDinh, onDong }: {
  khung: KhungXuat; chiNhanh?: number | null; lop?: { id: number; ma: string } | null;
  thoiGianMacDinh: ThoiGianXuat; onDong: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [khung, setKhung] = useState<KhungXuat>(khungDau);
  const [cn, setCn] = useState<number[]>(chiNhanh ? [chiNhanh] : []);
  const [lopChon, setLopChon] = useState<{ id: number; ma: string }[]>(lop ? [lop] : []);
  const [timLop, setTimLop] = useState('');

  const macDinhDot = (k: KhungXuat) => [...(k === 'ft' ? DOT_XUAT_FT : DOT_XUAT_THUONG)];
  const t0 = thoiGianMacDinh;
  const [kieu, setKieu] = useState<Kieu>(t0.kieu);
  const [tuan, setTuan] = useState(t0.kieu === 'tuan' ? { tu: t0.tu, den: t0.den } : { tu: mondayOfDate(homNay), den: mondayOfDate(homNay) });
  const [thang, setThang] = useState(t0.kieu === 'thang' ? { tu: t0.tu, den: t0.den } : { tu: homNay.slice(0, 7), den: homNay.slice(0, 7) });
  const [dot, setDot] = useState<string[]>(t0.kieu === 'dot' ? t0.dot : macDinhDot(khungDau));
  const [chiDu, setChiDu] = useState(false);
  const [cot, setCot] = useState<'gon' | 'day-du'>('gon');

  /* Bộ lọc phẳng đi qua CHÍNH `docBoLocXuatMt` của máy chủ — web kiểm trước chỉ để báo sớm. */
  const f = useMemo(() => docBoLocXuatMt({
    khung, chiNhanh: cn, lop: lopChon.map((l) => l.id), cot, du: chiDu ? 1 : 0, tg: kieu,
    ...(kieu === 'dot' ? { dot } : kieu === 'tuan' ? tuan : thang),
  }), [khung, cn, lopChon, cot, chiDu, kieu, dot, tuan, thang]);
  const loiNhap = typeof f === 'string' ? f : null;
  /* Lỗi thời gian hiện ngay khi xảy ra (đổi ô là kiểm lại), qua `useLoiForm` như mọi form KhungPanel. */
  const lf = useLoiForm();
  useEffect(() => { if (loiNhap) lf.roi('thoi-gian')(); }, [loiNhap]);   // eslint-disable-line react-hooks/exhaustive-deps
  const loiThoiGian = lf.loiCua(loiNhap ? [{ khoa: 'thoi-gian', nhan: t('Thời gian'), lyDo: dich(loiNhap) }] : [], 'thoi-gian');
  const khoa = typeof f === 'string' ? '' : JSON.stringify(f);

  const [phamVi, setPhamVi] = useState<PhamVi | null>(null);
  const [xt, setXt] = useState<{ khoa: string; r: XemTruoc } | null>(null);
  const [loiMayChu, setLoiMayChu] = useState<{ khoa: string; cau: string } | null>(null);
  const soXem = useRef(0);
  useEffect(() => {
    if (typeof f === 'string') return undefined;
    const seq = ++soXem.current;
    const h = setTimeout(() => {
      api.get<XemTruoc>(`/xuat-mt/xem-truoc?${queryXuatMt(f)}`).then((r) => {
        if (seq !== soXem.current) return;
        setPhamVi(r.phamVi); setXt({ khoa, r }); setLoiMayChu(null);
      }).catch((e) => {
        if (seq === soXem.current) setLoiMayChu({ khoa, cau: e.message ?? t('Không xem trước được.') });
      });
    }, 400);
    return () => clearTimeout(h);
  }, [khoa]);   // eslint-disable-line react-hooks/exhaustive-deps

  const xtHienTai = xt?.khoa === khoa ? xt.r : null;
  const loiXem = loiMayChu?.khoa === khoa ? loiMayChu.cau : null;
  const dangXem = !!khoa && !xtHienTai && !loiXem;
  const [dangXuat, setDangXuat] = useState(false);
  const xuatDuoc = !!xtHienTai && xtHienTai.dem.luot > 0 && !dangXuat;
  const xemGanNhat = xtHienTai ?? xt?.r ?? null;

  const doiKhung = (k: KhungXuat) => {
    setKhung(k);
    setDot(macDinhDot(k));
    /* Lớp đã chọn thuộc khung kia thì bỏ — mỗi lần xuất một khung. */
    setLopChon((ds) => ds.filter((l) => { const p = phamVi?.lop.find((x) => x.id === l.id); return !p || p.ft === (k === 'ft'); }));
  };
  const doiCn = (id: number) => setCn((ds) => (ds.includes(id) ? ds.filter((x) => x !== id) : [...ds, id]));
  const doiDot = (k: string) => setDot((ds) => {
    const goc = macDinhDot(khung);
    const moi = ds.includes(k) ? ds.filter((x) => x !== k) : [...ds, k];
    return goc.filter((x) => moi.includes(x));
  });

  const tenCn = (id: number) => phamVi?.chiNhanh.find((c) => c.id === id)?.ten ?? '';
  const lopGoiY: LopKH[] = (phamVi?.lop ?? [])
    .filter((l) => l.ft === (khung === 'ft') && (!cn.length || cn.includes(l.chiNhanhId)) && !lopChon.some((c) => c.id === l.id))
    .map((l) => ({
      id: l.id, code: l.ma, loai: l.ft ? 'ft' : 'thuong', chiNhanh: `${tenCn(l.chiNhanhId)}${l.daKetThuc ? ` · ${t('đã kết thúc')}` : ''}`,
      chuongTrinh: null, soHv: l.soHv, chuaCoLichTiep: 0, hvChuaCoLich: 0, tomTat: '', canXepLai: 0,
    }));
  const motLop = phamVi?.lop.length === 1 ? phamVi.lop[0] : null;
  const coFt = !phamVi || phamVi.lop.some((l) => l.ft);
  const coThuong = !phamVi || phamVi.lop.some((l) => !l.ft);

  const xuat = async () => {
    if (typeof f === 'string' || dangXuat) return;
    setDangXuat(true);
    try {
      const r = await api.post<{ sheets: { ten: string; aoa: Cell[][] }[]; tenTep: string; dem: { luot: number } }>('/xuat-mt', { ...bodyXuatMt(f), ngonNgu: NGON_NGU });
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      r.sheets.forEach((s, i) => {
        const ws = XLSX.utils.aoa_to_sheet(s.aoa);
        if (i < r.sheets.length - 1 && ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
        ws['!cols'] = doRong(s.aoa);
        XLSX.utils.book_append_sheet(wb, ws, s.ten);
      });
      XLSX.writeFile(wb, r.tenTep);
      toast.push('ok', t('Đã xuất {n} lượt — tệp {tep}', { n: r.dem.luot, tep: r.tenTep }));
    } catch (e: any) {
      toast.push('error', e.message ?? t('Không xuất được tệp.'));
    } finally {
      setDangXuat(false);
    }
  };

  const dongDem = xtHienTai
    ? [t('{n} lượt', { n: xtHienTai.dem.luot }), t('{n} học viên', { n: xtHienTai.dem.hocVien }), t('{n} lớp', { n: xtHienTai.dem.lop })].join(' · ')
    : dangXem ? t('Đang tính…') : '';
  const cotChu = khung === 'ft'
    ? [...COT_FT_GON, ...(cot === 'day-du' ? COT_FT_THEM : [])].map((c) => dich(c)).join(' · ')
    : `${t('Tên · Email · Chi nhánh · Lớp · Bài · Tuần · điểm % từng môn · % tổng · Trạng thái lượt')}${cot === 'day-du' ? ` · ${t('điểm, tổng và tuần từng môn · Người nhập')}` : ''}`;

  return (
    <KhungPanel tieuDe={t('Xuất kết quả Test')} onDong={onDong}
      chan={{
        huy: { onClick: onDong },
        phu: <span className="hidden min-w-0 truncate text-xs text-slate-400 sm:inline" title={xtHienTai?.tenTep}>{xtHienTai?.tenTep}</span>,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={!xuatDuoc} onClick={xuat}>
          {dangXuat ? t('Đang xuất…') : t('Xuất Excel')}</button>,
        dongTren: dongDem ? <div className="px-4 pt-2 text-xs font-semibold tabular-nums text-slate-200 sm:hidden">{dongDem}</div> : undefined,
      }}>
      {(coFt && coThuong) && (
        <div className="py-2">
          <BoLocDoan<KhungXuat> ariaLabel={t('Khung lớp')} value={khung} onChange={doiKhung}
            muc={[{ key: 'ft', nhan: 'Fast Track' }, { key: 'thuong', nhan: t('Lớp thường') }]} />
        </div>
      )}

      <Khoi tieuDe={t('Phạm vi')}>
        {!phamVi ? <p className="m-0 text-xs text-slate-400">{t('Đang tải phạm vi…')}</p> : (
          <>
            <Truong nhan={t('Chi nhánh')} as="div" phu={phamVi.chiNhanh.length > 1 && !cn.length ? t('Để trống: xuất mọi chi nhánh bạn được xem.') : undefined}>
              {phamVi.chiNhanh.length === 1
                ? <p className="m-0 text-sm text-slate-100">{phamVi.chiNhanh[0].ten}</p>
                : <div className="flex flex-wrap gap-1.5">
                  {phamVi.chiNhanh.map((c) => <NutChon key={c.id} nho chon={cn.includes(c.id)} onClick={() => doiCn(c.id)}>{c.ten}</NutChon>)}
                </div>}
            </Truong>
            <Truong nhan={t('Lớp')} as="div" phu={!lopChon.length && !motLop ? t('Để trống: xuất mọi lớp bạn được xem.') : undefined}>
              {motLop ? <p className="m-0 text-sm text-slate-100">{motLop.ma}</p> : (
                <div className="space-y-2 [&_.label]:sr-only">   {/* nhãn "Lớp" của ô tìm trùng nhãn của khối — chỉ để trình đọc màn hình */}
                  {lopChon.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lopChon.map((l) => (
                        <button key={l.id} type="button" title={t('Bỏ lớp {ma}', { ma: l.ma })} onClick={() => setLopChon((ds) => ds.filter((x) => x.id !== l.id))}
                          className="nut-loc nut-loc-dang">
                          {l.ma}<span aria-hidden>✕</span><span className="sr-only">{t('bỏ lớp')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <TimLop lop={lopGoiY} value={timLop} onChange={setTimLop}
                    onChon={(l) => { setLopChon((ds) => [...ds, { id: l.id, ma: l.code }]); setTimLop(''); }} />
                </div>
              )}
            </Truong>
          </>
        )}
      </Khoi>

      <Khoi tieuDe={t('Thời gian')}>
        <BoLocDoan<Kieu> ariaLabel={t('Cách lọc thời gian')} value={kieu} onChange={setKieu}
          muc={[{ key: 'tuan', nhan: t('Theo tuần') }, { key: 'thang', nhan: t('Theo tháng') }, { key: 'dot', nhan: t('Theo đợt') }]} />
        {kieu === 'tuan' && (
          <Hang2>
            <Truong nhan={t('Từ tuần')}><ONgay kieu="tuan" value={tuan.tu} onChange={(v) => setTuan((x) => ({ ...x, tu: v }))} /></Truong>
            <Truong nhan={t('Đến tuần')}><ONgay kieu="tuan" value={tuan.den} onChange={(v) => setTuan((x) => ({ ...x, den: v }))} /></Truong>
          </Hang2>
        )}
        {kieu === 'thang' && (
          <Hang2>
            <Truong nhan={t('Từ tháng')}><ONgay kieu="thang" value={thang.tu} onChange={(v) => setThang((x) => ({ ...x, tu: v }))} /></Truong>
            <Truong nhan={t('Đến tháng')}><ONgay kieu="thang" value={thang.den} onChange={(v) => setThang((x) => ({ ...x, den: v }))} /></Truong>
          </Hang2>
        )}
        {kieu === 'dot' && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Đợt')}>
            {macDinhDot(khung).map((k) => <NutChon key={k} nho chon={dot.includes(k)} onClick={() => doiDot(k)}>{nhanKhoaDot(k)}</NutChon>)}
          </div>
        )}
        <p className="m-0 text-xs text-slate-400">
          {kieu === 'dot' ? t('Lượt phải khớp cả chi nhánh, lớp và đợt đã chọn.') : t('Lượt phải khớp cả chi nhánh, lớp và thời gian đã chọn. Mỗi lượt tính vào tuần Test sớm nhất của nó.')}
        </p>
        {loiThoiGian && <p role="alert" id={lf.oId('thoi-gian')} className="m-0 text-xs text-late">{loiThoiGian}</p>}
      </Khoi>

      <Khoi tieuDe={t('Lượt và cột')}>
        <BoLocDoan<'moi' | 'du'> ariaLabel={t('Lượt')} value={chiDu ? 'du' : 'moi'} onChange={(k) => setChiDu(k === 'du')}
          muc={[{ key: 'moi', nhan: t('Mọi lượt') }, { key: 'du', nhan: t('Chỉ lượt đủ điểm') }]} />
        <BoLocDoan<'gon' | 'day-du'> ariaLabel={t('Cột')} value={cot} onChange={setCot}
          muc={[{ key: 'gon', nhan: t('Cột gọn') }, { key: 'day-du', nhan: t('Cột đầy đủ') }]} />
        <p className="m-0 text-xs leading-relaxed text-slate-400">
          {chiDu ? t('Chỉ lấy lượt đã có điểm mọi kỹ năng phải làm.') : t('Lấy cả lượt còn thiếu điểm — ô thiếu để trống.')} {t('Cột trong tệp: {cot}', { cot: cotChu })}
        </p>
      </Khoi>

      <Khoi tieuDe={t('Xem trước')}>
        {loiXem ? <p role="alert" className="m-0 text-xs text-late">{loiXem}</p> : loiNhap ? null : (
          <div aria-live="polite" className="space-y-1.5">
            <p className="m-0 text-sm font-bold tabular-nums text-slate-100">{dongDem || (xemGanNhat ? t('Đang tính…') : ' ')}</p>
            {xtHienTai && xtHienTai.dem.luot === 0
              ? <p className="m-0 text-xs text-slate-400">{t('Không có lượt nào khớp — mở rộng thời gian hoặc bỏ bớt chi nhánh, lớp.')}</p>
              : <ul className="m-0 list-none space-y-0.5 p-0" aria-label={t('Dòng đầu của tệp')}>
                {(xtHienTai ?? xemGanNhat)?.dauDong.map((d, i) => (
                  /* PR-S4F #12: xuống dòng thay vì cắt — đuôi "tạm thời" / trạng thái lượt không mất. */
                  <li key={i} className={`break-words text-[13px] ${xtHienTai ? 'text-slate-300' : 'text-slate-500'}`} title={d}>{d}</li>
                ))}
              </ul>}
          </div>
        )}
      </Khoi>
    </KhungPanel>
  );
}
