import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NhanLich } from '../../ui/Nhan.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { PanelSauThi } from '../congViec/PanelSauThi.tsx';
import {
  CotGhi, CotLich, CotMt, CotTarget, CotViec, ChuLop, DaiMo, HopLich, NutMo, TenEm, canLam, laHop, laMenuLich,
  type Hanh, type Hang, type HangHien, type LuuBody,
} from './HangLichThi.tsx';
import {
  datKv, dsThangLichThi, nhanThang, thangTrongKhoang, nhanThangDuKien, shortDate, thangKeTiep, tuanLich, xepLichThiTheoLop,
  type NguCanhDs, type ThaoTacLichThi, type LichThi,
} from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type Trang = { thang: string[]; rows: Hang[] };

/** `?thang=` của trang → khoảng [từ, đến]; mặc định tháng này → tháng sau (V4 khung 3: 09/2026 → 10/2026). */
export function khoangThang(thangUrl: string | null, homNay: string): [string, string] {
  const d = dsThangLichThi(thangUrl);
  return d.length ? [d[0], d[d.length - 1]] : [homNay.slice(0, 7), thangKeTiep(homNay)];
}

/** MỘT chip lịch thi thật cho Học viên & Lớp (cột Lịch thi + góc Lịch thi): Thi 17/09 · Đã thi · Chưa chốt · 09/2026 · Dự kiến 10/2026 · Chưa có lịch. */
export function ChipLichThi({ l, them }: { l: LichThi | null | undefined; them?: string }) {
  const { homNay } = useNgayNghiepVu();
  if (!l || l.trangThai === 'chua-co') return <NhanLich loai="chua">{t('Chưa có lịch')}</NhanLich>;
  const sau = them ? ` · ${them}` : '';
  if (l.trangThai === 'da-chot-ngay') return <NhanLich loai="co">{t('Thi {ngay}', { ngay: shortDate(l.ngay, homNay) })}{sau}</NhanLich>;
  if (l.trangThai === 'da-thi') return <NhanLich loai="da-thi">{t('Đã thi {ngay}', { ngay: shortDate(l.ngay, homNay) })}{sau}</NhanLich>;
  const moc = l.tuan ? tuanLich(l.tuan, homNay) : nhanThang(l.thang!);
  return l.trangThai === 'chua-chot-ngay'
    ? <NhanLich loai="du-kien">{t('Chưa chốt · {moc}', { moc })}</NhanLich>
    : <NhanLich loai="du-kien">{nhanThangDuKien(l.thang!)}</NhanLich>;
}

/** Overall so với kỳ vọng → ký hiệu của `ODiem` (vượt / bằng / dưới). */
export const kqOverall = (ovr: number | null | undefined, kv: number | null | undefined) =>
  ovr == null || kv == null ? null : ovr > kv ? 'vuot' as const : ovr === kv ? 'bang' as const : 'duoi' as const;

/* B7 (chủ SP 08/11): thông tin em dồn trái cạnh tên (MT gần nhất · Target); Lịch thi · Việc tiếp ("Đặt lịch ▾") · Ghi chú · ⌄ dồn mép phải —
   Target là cột giãn (nhận phần dư), các cột việc cố định nên luôn sát phải. */
const COT_LICH: CotBang[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 200 },
  { key: 'mt', nhan: t('MT gần nhất'), kieu: 'chu', rong: 110 },
  { key: 'target', nhan: 'Target', kieu: 'chu', linhHoat: true },
  { key: 'lich', nhan: t('Lịch thi'), kieu: 'chu', rong: 230 },
  { key: 'viec', nhan: t('Việc tiếp'), kieu: 'viec', rong: 240 },
  { key: 'ghi', nhan: t('Ghi chú'), kieu: 'chu', rong: 220 },
  { key: 'mo', nhan: '', kieu: 'nut', rong: 56 },
];
const [C_TEN, C_MT, C_TARGET, C_LICH, C_VIEC, C_GHI, C_MO] = COT_LICH;
/** Hàng công cụ: lọc TVV — "-" = em chưa có TVV. */
const TVV_CHUA = '-';
const SELECT_GON = 'field h-8 w-auto !py-0 text-sm max-sm:min-h-[44px] max-sm:w-full';
const HOAN_TAC_MS = 10_000;

/** Hợp dữ liệu mới tải với hàng đang hiện: giữ việc làm tại chỗ (`tt`, `doiSang`) — em vừa dời tháng ra khỏi khoảng đang xem vẫn ở lại tới khi rời trang. */
const hopNhat = (cu: readonly HangHien[], moi: readonly Hang[]): HangHien[] => {
  const giu = new Map(cu.map((r) => [r.studentId, r]));
  const ra: HangHien[] = moi.map((r) => ({ ...r, doiSang: giu.get(r.studentId)?.doiSang ?? null, tt: giu.get(r.studentId)?.tt }));
  for (const c of cu) if (c.doiSang && !moi.some((m) => m.studentId === c.studentId)) ra.push(c);
  return ra;
};

/** Cái cần PUT để trả lịch về như trước khi lưu (Hoàn tác, XM-2): ngày cũ · tháng cũ · chưa có lịch → `boLich`; kèm ghi chú cũ nếu lần lưu có đổi ghi chú. */
const bodyHoanTac = (r: HangHien, da: LuuBody): LuuBody => {
  const lich: LuuBody = r.coNgay && r.lichThi.ngay ? { ketLuan: 'chot-ngay', ngay: r.lichThi.ngay }
    : r.lichThi.thang ? { ketLuan: 'chuyen-thang', thang: r.lichThi.thang } : { boLich: true };
  return da.ghiChu !== undefined ? { ...lich, ghiChu: r.luu?.ghiChu ?? '' } : lich;
};

/**
 * HỌC VIÊN & LỚP › LỊCH THI (LICH-THI-UI — mockup `thiet-ke/v16/lich-thi.html` bản 3, chủ SP 06/11): Tháng thi [từ] → [đến] · Lớp · TVV · Cần làm | Tất cả;
 * MỘT danh sách xếp theo LỚP (dòng tiêu đề lớp), trong lớp thi sớm → muộn, Xong cuối; hàng: Học viên · Lịch thi (chữ trạng thái + dòng phụ) · Việc tiếp (một nút chính khi
 * việc đã tới lúc + chữ phụ) · MT gần nhất · Target · Ghi chú · mũi tên mở dải. Lưu ngay (`PUT /hoc-vien-lop/lich-thi/:cycleId`, có nhật ký); lưu xong chỉ sửa hàng đó tại chỗ — không xếp lại.
 * Ghi KQ / Bước tiếp / Sửa KQ mở panel Sau thi CÓ SẴN (như Công việc). `duongGoc`: đuôi truy vấn của trang (`?q=&phamVi=&branchId=`). Khoảng tháng trên URL (`thang=từ,đến`).
 */
export function GocLichThi({ duongGoc, thangUrl, onDoiThang, onIds, ds, locTren, loc, onMoCase }: {
  duongGoc: string; thangUrl: string | null; onDoiThang: (thang: string[]) => void;
  /** Bộ lọc Lớp / khung của trang (cùng `trongLoc` của các góc khác) — chủ SP 29/10: chọn CP FT 116 mà còn em CP FT 130 là lỗi. */
  loc?: (classId: number, ft: boolean) => boolean;
  /** Em đang hiện — nút Xuất đầu trang lấy đúng danh sách này. */
  onIds?: (ids: number[]) => void;
  ds?: NguCanhDs;
  /** Ô lọc chung của trang (tìm, lớp …) đặt trong dải lọc của góc. */
  locTren?: ReactNode;
  /** Tên kỹ năng ở "Hỗ trợ đang mở" bấm → panel Case của em (lối mở sẵn có của trang). */
  onMoCase?: (studentId: number, caseId: number) => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const dienThoai = useDienThoai();
  const [tu, den] = khoangThang(thangUrl, homNay);
  const thang = useMemo(() => thangTrongKhoang(tu, den), [tu, den]);
  const duong = `/hoc-vien-lop/lich-thi${duongGoc}${duongGoc.includes('?') ? '&' : '?'}thang=${thang.join(',')}`;
  const { data, loading, error, reload, cu } = useApi<Trang>(duong, [duong], { giuCu: true });
  const [rows, setRows] = useState<HangHien[]>([]);
  const duongDa = useRef(duong);
  useEffect(() => {
    const cungKhoang = duongDa.current === duong;
    duongDa.current = duong;
    setRows((x) => hopNhat(cungKhoang ? x : [], data?.rows ?? []));
  }, [data]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [mo, setMo] = useState<Set<number>>(new Set());
  const [hop, setHop] = useState<Hanh['hop']>(null);
  const [panel, setPanel] = useState<{ id: number; cycleId: number; ten: string; lop: string; nut: ThaoTacLichThi } | null>(null);
  const [chiCan, setChiCan] = useState(false);
  const [tvv, setTvv] = useState('');
  const hen = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => () => { hen.current.forEach(clearTimeout); }, []);

  /* Luật 5b: lưu xong chỉ sửa hàng đó tại chỗ — hàng không nhảy chỗ giữa buổi họp. Thứ tự chốt lúc tập em đổi (tải khoảng mới, em mới vào). */
  const idsKey = rows.map((r) => r.studentId).sort((a, b) => a - b).join(',');
  const thuTu = useMemo(() => new Map(xepLichThiTheoLop(rows).map((r, i) => [r.studentId, i])), [idsKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const trongPham = rows.filter((r) => (!loc || loc(r.classId, !r.thuong)) && (!tvv || (tvv === TVV_CHUA ? !r.tvv : r.tvv === tvv)));
  const soCan = trongPham.filter(canLam).length;
  /* "Cần làm": hàng vừa làm xong ở lại tới khi đổi bộ lọc / khoảng (không biến mất giữa lúc đang làm). */
  const daTungCan = useRef(new Set<number>());
  useEffect(() => { for (const r of rows) if (canLam(r)) daTungCan.current.add(r.studentId); }, [rows]);
  const hien = trongPham.filter((r) => !chiCan || canLam(r) || daTungCan.current.has(r.studentId)).sort((a, b) => (thuTu.get(a.studentId) ?? 0) - (thuTu.get(b.studentId) ?? 0));
  const hienKey = hien.map((r) => r.studentId).join(',');
  useEffect(() => { onIds?.(hien.map((r) => r.studentId)); }, [hienKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const dsTvv = useMemo(() => [...new Set(rows.map((r) => r.tvv).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'vi')), [rows]);
  const coChuaTvv = rows.some((r) => !r.tvv);
  /* Dòng tiêu đề lớp: số em · số cần làm · ⚠ quá hạn — đếm cùng hàm với hàng, dữ liệu đã nạp. */
  const dauLop = useMemo(() => {
    const m = new Map<number, { lop: string; n: number; can: number; qua: number }>();
    const dau = new Map<number, number>();
    for (const r of hien) {
      const x = m.get(r.classId) ?? { lop: r.classCode, n: 0, can: 0, qua: 0 };
      x.n += 1; if (canLam(r)) { x.can += 1; if (r.sauThi.quaHan) x.qua += 1; }
      m.set(r.classId, x);
      if (!dau.has(r.classId)) dau.set(r.classId, r.studentId);
    }
    return new Map([...dau].map(([lop, id]) => [id, m.get(lop)!]));
  }, [hienKey, rows]);   // eslint-disable-line react-hooks/exhaustive-deps

  const sua = (id: number, f: (r: HangHien) => HangHien) => setRows((x) => x.map((r) => (r.studentId === id ? f(r) : r)));
  const xoaTtSau = (id: number) => {
    const h = setTimeout(() => { hen.current.delete(h); sua(id, (x) => (x.tt?.kieu === 'xong' ? { ...x, tt: undefined } : x)); }, HOAN_TAC_MS);
    hen.current.add(h);
  };
  /** Lưu MỘT kết luận + ghi chú; lỗi thì giữ hộp đang mở (chữ đang gõ còn nguyên) và cho Thử lại. Lưu lịch → "✓ Đã lưu · Hoàn tác" 10 giây (PUT lại giá trị cũ). */
  const luu = (r: HangHien, body: LuuBody, hoanTac = false) => {
    if (!r.cycleId) return;
    sua(r.studentId, (x) => ({ ...x, tt: { kieu: 'luu' } }));
    api.put<Partial<Hang>>(`/hoc-vien-lop/lich-thi/${r.cycleId}`, body)
      .then((kq) => {
        /* Làm mới các trang khác nhưng KHÔNG đường của chính góc này — tải lại làm em vừa dời tháng biến mất khỏi danh sách. */
        invalidate('/hoc-vien-lop?'); invalidate('/hoc-vien-lop/theo-vai'); invalidate('/hoc-vien-lop/em'); invalidate('/students');
        const doi = !hoanTac && body.ketLuan === 'chuyen-thang' && body.thang && !thang.includes(body.thang) ? { sang: body.thang, truoc: r.lichThi.thang } : null;
        const huy = !hoanTac && (body.ketLuan || body.boLich) ? () => luu({ ...r, ...kq, luu: kq.luu ?? r.luu } as HangHien, bodyHoanTac(r, body), true) : undefined;
        sua(r.studentId, (x) => ({ ...x, ...kq, doiSang: doi, tt: { kieu: 'xong', hoanTac: huy } }));
        if (body.ketLuan || body.boLich) setHop(null);
        xoaTtSau(r.studentId);
      })
      .catch((e: any) => sua(r.studentId, (x) => ({ ...x, tt: { kieu: 'loi', loi: e?.message ?? t('Không lưu được'), lai: () => luu(r, body, hoanTac) } })));
  };
  const doiMo = (id: number) => setMo((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  /** B7 (chủ SP 08/11): bấm thanh (dòng / thẻ) mở dải thông tin HV — trừ khi bấm vào link, nút, ô nhập, menu (việc riêng của chúng). Bàn phím: nút ⌄ của dòng. */
  const bamDong = (id: number) => (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button, input, select, textarea, label, [role="menu"]')) return;
    if (window.getSelection()?.toString()) return;   // đang bôi chữ để chép — không mở / thu
    doiMo(id);
  };
  /** Chốt / Sửa ngày · Đặt / Dời tháng → hộp dưới hàng; Ghi KQ · Bước tiếp · Sửa KQ → panel Sau thi có sẵn (XM-1). */
  const bam = (r: HangHien, nut: ThaoTacLichThi) => {
    if (laHop(nut)) { setPanel(null); setHop(hop?.id === r.studentId && hop.nut === nut ? null : { id: r.studentId, nut }); return; }
    if (r.cycleId) { setHop(null); setPanel({ id: r.studentId, cycleId: r.cycleId, ten: r.ten, lop: r.classCode, nut }); }
  };
  const hanh: Hanh = { hop, panel, mo, bam, doiMo, huyHop: () => setHop(null), luu: (r, b) => luu(r, b), moCase: onMoCase, ds };
  const khoang = `${nhanThang(tu)} → ${nhanThang(den)}`;

  const dongBang = (r: HangHien) => {
    const dau = dauLop.get(r.studentId);
    const khoa = !r.coTheSua || r.tt?.kieu === 'luu';
    const dangMo = mo.has(r.studentId);
    const hopMo = hop?.id === r.studentId ? hop.nut : null;
    return (
      <Fragment>
        {dau && <tr className="lt-lop"><td colSpan={COT_LICH.length}><ChuLop {...dau} /></td></tr>}
        <tr className={`lt-h ${dangMo || hopMo ? 'lt-mo' : ''}`} onClick={bamDong(r.studentId)}>
          <OBang c={C_TEN}><TenEm r={r} ds={ds} /></OBang>
          <OBang c={C_MT}><CotMt r={r} /></OBang>
          <OBang c={C_TARGET}><CotTarget r={r} /></OBang>
          <OBang c={C_LICH}><CotLich r={r} /></OBang>
          <OBang c={C_VIEC}><CotViec r={r} hanh={hanh} /></OBang>
          <OBang c={C_GHI}><CotGhi r={r} khoa={khoa} onLuu={(ghiChu) => luu(r, { ghiChu })} /></OBang>
          <OBang c={C_MO}><NutMo r={r} mo={dangMo} onMo={() => doiMo(r.studentId)} /></OBang>
        </tr>
        {hopMo && <tr className="lt-r-hop"><td colSpan={COT_LICH.length}><HopLich r={r} nut={hopMo} onHuy={() => setHop(null)} onLuu={(b) => luu(r, b)} /></td></tr>}
        {dangMo && <tr className="lt-r-dai"><td colSpan={COT_LICH.length}><DaiMo r={r} hanh={hanh} /></td></tr>}
      </Fragment>
    );
  };

  const the = (r: HangHien) => {
    const dau = dauLop.get(r.studentId);
    const khoa = !r.coTheSua || r.tt?.kieu === 'luu';
    const dangMo = mo.has(r.studentId);
    const hopMo = hop?.id === r.studentId ? hop.nut : null;
    const st = r.standing;
    return (
      <Fragment key={r.studentId}>
        {dau && <li className="lt-lop"><ChuLop {...dau} /></li>}
        <li className={dangMo || hopMo ? 'lt-mo' : ''} onClick={bamDong(r.studentId)}>
          {/* B7 (mockup 375): "Đặt lịch ▾" ở hàng tên, cạnh ⌄. */}
          <div className="lt-the-1"><TenEm r={r} ds={ds} />{!hopMo && laMenuLich(r) && <CotViec r={r} hanh={hanh} the />}<NutMo r={r} mo={dangMo} onMo={() => doiMo(r.studentId)} /></div>
          {(st?.overall != null || r.target != null) && (
            <div className="lt-the-diem">
              {st?.overall != null && <span>{st.attemptLabel} <span className={`lt-diem ${datKv(st.overall, st.expectation, r.kck) === true ? 'dat' : datKv(st.overall, st.expectation, r.kck) === false ? 'duoi' : ''}`}>{st.overall.toFixed(1)}</span></span>}
              <span>Target <b className="tabular-nums"><CotTarget r={r} /></b></span>
            </div>
          )}
          <CotLich r={r} />
          <CotGhi r={r} khoa={khoa} hienNhan onLuu={(ghiChu) => luu(r, { ghiChu })} />
          {hopMo ? <HopLich r={r} nut={hopMo} the onHuy={() => setHop(null)} onLuu={(b) => luu(r, b)} /> : !laMenuLich(r) && <CotViec r={r} hanh={hanh} the />}
          {dangMo && <DaiMo r={r} hanh={hanh} />}
        </li>
      </Fragment>
    );
  };

  const oThang = (v: string, ten: string, f: (m: string) => void) => <ONgay kieu="thang" gon value={v} ariaLabel={ten} onChange={(m) => m && f(m.slice(0, 7))} />;
  const oTu = oThang(tu, t('Từ tháng'), (m) => onDoiThang(m > den ? [m, m] : [m, den]));
  const oDen = oThang(den, t('Đến tháng'), (m) => onDoiThang(m < tu ? [m, m] : [tu, m]));
  const doan = (
    <span className="doan" role="group" aria-label={t('Hiện')}>
      <button type="button" aria-pressed={chiCan} onClick={() => { daTungCan.current = new Set(); setChiCan(true); }}>{t('Cần làm')}<b className="tabular-nums">{soCan}</b></button>
      <button type="button" aria-pressed={!chiCan} onClick={() => setChiCan(false)}>{t('Tất cả')}<b className="tabular-nums">{trongPham.length}</b></button>
    </span>
  );
  const locTvv = (dsTvv.length > 0 || coChuaTvv) && (
    <select className={SELECT_GON} aria-label={t('TVV')} value={tvv} onChange={(e) => setTvv(e.target.value)}>
      <option value="">{t('Mọi TVV')}</option>
      {dsTvv.map((x) => <option key={x} value={x}>{x}</option>)}
      {coChuaTvv && <option value={TVV_CHUA}>{t('Chưa có TVV')}</option>}
    </select>
  );

  return (
    <div className="card overflow-hidden !p-0">
      <div className="flex flex-wrap items-center gap-2 border-b p-3 max-sm:gap-2" style={{ borderColor: 'var(--line)' }} data-hd="hvl-lich-thi">
        <span className="text-[13px] font-medium text-slate-400 max-sm:hidden">{t('Tháng thi')}</span>
        <span className="flex items-center gap-2 max-sm:w-full max-sm:[&>span]:min-w-0 max-sm:[&>span]:flex-1">
          <span className="w-[150px]">{oTu}</span><span aria-hidden className="text-slate-400 max-sm:!flex-none">→</span><span className="w-[150px]">{oDen}</span>
        </span>
        {locTren}
        {locTvv}
        {data && <span className="ml-auto max-sm:ml-0 max-sm:w-full max-sm:[&>.doan]:w-full">{doan}</span>}
      </div>
      {error && <div className="p-3"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>}
      {loading && !data && <div className="p-3"><Skeleton rows={5} /></div>}
      {data && hien.length === 0 && (
        chiCan && trongPham.length > 0
          ? (
            <Card>
              <div className="lt-rong">
                <span className="lt-rong-t">✓ {t('Hết việc lịch thi trong {khoang}', { khoang })}</span>
                <span className="lt-rong-p">{t('Không em nào chờ chốt ngày, ghi KQ hay chọn bước tiếp. Em chưa có lịch xem ở "Tất cả".')}</span>
                <button type="button" className="btn" onClick={() => setChiCan(false)}>{t('Xem tất cả · {n}', { n: trongPham.length })}</button>
              </div>
            </Card>
          )
          : (
            <Card>
              <div className="lt-rong">
                <span className="lt-rong-t">{t('Không có HV có lịch thi trong {khoang}.', { khoang })}</span>
                <span className="lt-rong-p">{t('Em chưa có lịch luôn ở danh sách này; hiện không còn em nào. Đổi khoảng tháng ở trên để xem tháng khác.')}</span>
              </div>
            </Card>
          )
      )}
      {data && hien.length > 0 && (
        <div className={`lt-bang ${cu ? 'dang-tai-lai' : ''}`} aria-busy={cu || undefined}>
          {dienThoai
            ? <ul className="lt-the" aria-label={t('Lịch thi')}>{hien.map(the)}</ul>
            : <Bang ten={t('Lịch thi')} cot={COT_LICH} hang={hien} khoa={(r) => r.studentId} khung={false} the375={false} dinh hangRieng={dongBang} />}
        </div>
      )}
      {panel && (
        <PanelSauThi key={panel.cycleId} cycleId={panel.cycleId} em={{ id: panel.id, ten: panel.ten }} lop={panel.lop} onDong={() => setPanel(null)} onDaLam={() => undefined} onTiep={null} />
      )}
    </div>
  );
}
