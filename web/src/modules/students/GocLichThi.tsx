import { useThamSoUrl } from '../../lib/quayLai.ts';
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NhanLich } from '../../ui/Nhan.tsx';
import { Bang, OBang, type CotBang } from '../../ui/Bang.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChonLoc } from '../../ui/PeoplePicker.tsx';
import { useSession } from '../../lib/session.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { PanelSauThi } from '../congViec/PanelSauThi.tsx';
import {
  CotGhi, CotLich, CotMt, CotSos, CotTarget, ChuLop, DaiMo, HopLich, NutMo, TenEm, laHop, locThiCua,
  type Hanh, type Hang, type HangHien, type LocThi, type LuuBody,
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

/* GD-13b (mockup v21 ⑥ K4, lời 37 / 38): Học viên · Lịch thi (MỘT dòng) · Target · MT gần nhất · SOS · Ghi chú · ⌄ — không nhãn nhóm, không cột việc / Lộ trình. Ghi chú giãn. */
const COT_LICH: CotBang[] = [
  { key: 'ten', nhan: t('Học viên'), kieu: 'ten', rong: 230 },
  { key: 'lich', nhan: t('Lịch thi'), kieu: 'chu', rong: 280 },
  { key: 'target', nhan: 'Target', kieu: 'chu', rong: 100 },
  { key: 'mt', nhan: t('MT gần nhất'), kieu: 'chu', rong: 160 },
  { key: 'sos', nhan: 'SOS', kieu: 'chu', rong: 180 },
  { key: 'ghi', nhan: t('Ghi chú'), kieu: 'chu', linhHoat: true },
  { key: 'mo', nhan: '', kieu: 'nut', rong: 52 },
];
const [C_TEN, C_LICH, C_TARGET, C_MT, C_SOS, C_GHI, C_MO] = COT_LICH;
/** Hàng công cụ: lọc TVV — "-" = em chưa có TVV. */
const TVV_CHUA = '-';
const HOAN_TAC_MS = 10_000;
/** Đoạn lọc trạng thái thi ([XM-1], lời 37). */
const LOC_THI: { key: LocThi | null; nhan: () => string }[] = [
  { key: null, nhan: () => t('Tất cả') }, { key: 'chua-chot', nhan: () => t('Chưa chốt ngày') }, { key: 'da-chot', nhan: () => t('Đã chốt') },
  { key: 'cho-kq', nhan: () => t('Chờ KQ') }, { key: 'co-kq', nhan: () => t('Có KQ') },
];

/** Hợp dữ liệu mới tải với hàng đang hiện: giữ việc làm tại chỗ (`tt`, `doiSang`) — em vừa dời tháng ra khỏi khoảng đang xem vẫn ở lại tới khi rời trang. */
const hopNhat = (cu: readonly HangHien[], moi: readonly Hang[]): HangHien[] => {
  const giu = new Map(cu.map((r) => [r.studentId, r]));
  const ra: HangHien[] = moi.map((r) => ({ ...r, doiSang: giu.get(r.studentId)?.doiSang ?? null, tt: giu.get(r.studentId)?.tt }));
  for (const c of cu) if (c.doiSang && !moi.some((m) => m.studentId === c.studentId)) ra.push(c);
  return ra;
};

/** Cái cần PUT để trả về như trước khi lưu (Hoàn tác, XM-2): chỉ ghi chú → ghi chú cũ; lịch: ngày cũ · tháng cũ · chưa có lịch → `boLich`; kèm ghi chú cũ nếu lần lưu có đổi ghi chú. */
const bodyHoanTac = (r: HangHien, da: LuuBody): LuuBody => {
  if (!da.ketLuan && !da.boLich) return { ghiChu: r.luu?.ghiChu ?? '' };   // chỉ sửa ghi chú → chỉ trả ghi chú cũ, không đụng lịch
  const lich: LuuBody = r.coNgay && r.lichThi.ngay ? { ketLuan: 'chot-ngay', ngay: r.lichThi.ngay }
    : r.lichThi.thang ? { ketLuan: 'chuyen-thang', thang: r.lichThi.thang } : { boLich: true };
  return { ...lich, ...(da.ghiChu !== undefined ? { ghiChu: r.luu?.ghiChu ?? '' } : {}), ...(da.noiThi !== undefined ? { noiThi: r.noiThi ?? '' } : {}) };   // LICH-THI-NOI-THI: Hoàn tác trả cả nơi thi cũ
};

/**
 * HỌC VIÊN & LỚP › LỊCH THI (GD-13b — mockup v21 ⑥ K4 · K5 · K8b, lời 35 / 37 / 38 / 40 / 42): tab THÔNG TIN. Hàng lọc: Tìm · Mọi lớp · Mọi TVV · Tháng thi [từ] → [đến] ·
 * phải: trạng thái thi (Tất cả · Chưa chốt ngày · Đã chốt · Chờ KQ · Có KQ). MỘT danh sách xếp theo LỚP (dải nhóm lớp), trong lớp thi sớm → muộn, Xong cuối.
 * Người có quyền bấm thẳng giá trị lịch thi để sửa (hộp dưới hàng) hoặc làm việc Sau thi (panel CÓ SẴN). Lưu ngay (`PUT /hoc-vien-lop/lich-thi/:cycleId`, có nhật ký);
 * lưu xong chỉ sửa hàng đó tại chỗ — không xếp lại, không biến khỏi bộ lọc đang xem. `duongGoc`: đuôi truy vấn của trang. Khoảng tháng trên URL (`thang=từ,đến`).
 */
export function GocLichThi({ duongGoc, thangUrl, onDoiThang, onIds, ds, locTren, locLop, dangLocLop, loc, onMoCase }: {
  duongGoc: string; thangUrl: string | null; onDoiThang: (thang: string[]) => void;
  /** Bộ lọc Lớp / khung của trang (cùng `trongLoc` của các góc khác) — chủ SP 29/10: chọn CP FT 116 mà còn em CP FT 130 là lỗi. */
  loc?: (classId: number, ft: boolean) => boolean;
  /** Em đang hiện — nút Xuất đầu trang lấy đúng danh sách này. */
  onIds?: (ids: number[]) => void;
  ds?: NguCanhDs;
  /** Ô Tìm + ô Mọi lớp của trang, đặt đầu hàng lọc của góc (375: Mọi lớp vào nút "Lọc" như tab Tất cả — B26). */
  locTren?: ReactNode; locLop?: ReactNode; dangLocLop?: boolean;
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
  /* LICH-THI-NOI-THI (Việc để sau GD-13b): lọc trạng thái thi + Mọi TVV trên URL (replace) — Quay lại / F5 giữ bộ lọc; `tvv` cùng khoá với tab Tất cả. */
  const [locThiUrl, datLocThi] = useThamSoUrl('locThi', '');
  const locThi: LocThi | null = (['chua-chot', 'da-chot', 'cho-kq', 'co-kq'] as const).find((k) => k === locThiUrl) ?? null;
  const setLocThi = (k: LocThi | null) => datLocThi(k ?? '');
  const [suaGhi, setSuaGhi] = useState<number | null>(null);
  const [tvv, setTvv] = useThamSoUrl('tvv', '');
  const [moLoc, setMoLoc] = useState(false);
  const hen = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => () => { hen.current.forEach(clearTimeout); }, []);

  /* Luật 5b: lưu xong chỉ sửa hàng đó tại chỗ — hàng không nhảy chỗ giữa buổi họp. Thứ tự chốt lúc tập em đổi (tải khoảng mới, em mới vào). */
  const idsKey = rows.map((r) => r.studentId).sort((a, b) => a - b).join(',');
  const thuTu = useMemo(() => new Map(xepLichThiTheoLop(rows).map((r, i) => [r.studentId, i])), [idsKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const trongPham = rows.filter((r) => (!loc || loc(r.classId, !r.thuong)) && (!tvv || (tvv === TVV_CHUA ? !r.tvv : r.tvv === tvv)));
  const soLoc = (k: LocThi | null) => (k ? trongPham.filter((r) => locThiCua(r) === k).length : trongPham.length);
  /* Hàng vừa đổi trạng thái (vd chốt ngày khi đang lọc "Chưa chốt ngày") ở lại tới khi đổi bộ lọc — không biến mất giữa lúc làm. */
  const daHien = useRef(new Set<number>());
  const hien = trongPham.filter((r) => !locThi || locThiCua(r) === locThi || daHien.current.has(r.studentId))
    .sort((a, b) => (thuTu.get(a.studentId) ?? 0) - (thuTu.get(b.studentId) ?? 0));
  useEffect(() => { for (const r of hien) daHien.current.add(r.studentId); });
  const chonLoc = (k: LocThi | null) => { daHien.current = new Set(); setLocThi(k); };
  const hienKey = hien.map((r) => r.studentId).join(',');
  useEffect(() => { onIds?.(hien.map((r) => r.studentId)); }, [hienKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const dsTvv = useMemo(() => [...new Set(rows.map((r) => r.tvv).filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'vi')), [rows]);
  const coChuaTvv = rows.some((r) => !r.tvv);
  const toi = useSession().session?.user?.fullName ?? null;
  /* Dải nhóm lớp: mã lớp · số em — đếm từ dữ liệu đã nạp. */
  const dauLop = useMemo(() => {
    const m = new Map<number, { lop: string; classId: number; n: number }>();
    const dau = new Map<number, number>();
    for (const r of hien) {
      const x = m.get(r.classId) ?? { lop: r.classCode, classId: r.classId, n: 0 };
      x.n += 1; m.set(r.classId, x);
      if (!dau.has(r.classId)) dau.set(r.classId, r.studentId);
    }
    return new Map([...dau].map(([lop, id]) => [id, m.get(lop)!]));
  }, [hienKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  const sua = (id: number, f: (r: HangHien) => HangHien) => setRows((x) => x.map((r) => (r.studentId === id ? f(r) : r)));
  const xoaTtSau = (id: number) => {
    const h = setTimeout(() => { hen.current.delete(h); sua(id, (x) => (x.tt?.kieu === 'xong' ? { ...x, tt: undefined } : x)); }, HOAN_TAC_MS);
    hen.current.add(h);
  };
  /** Lưu MỘT kết luận / ghi chú; lỗi thì giữ hộp đang mở (chữ đang gõ còn nguyên) và cho Thử lại. Lưu → "✓ Đã lưu · Hoàn tác" 10 giây (PUT lại giá trị cũ). */
  const luu = (r: HangHien, body: LuuBody, hoanTac = false) => {
    if (!r.cycleId) return;
    sua(r.studentId, (x) => ({ ...x, tt: { kieu: 'luu' } }));
    api.put<Partial<Hang>>(`/hoc-vien-lop/lich-thi/${r.cycleId}`, body)
      .then((kq) => {
        /* Làm mới các trang khác nhưng KHÔNG đường của chính góc này — tải lại làm em vừa dời tháng biến mất khỏi danh sách. */
        invalidate('/hoc-vien-lop?'); invalidate('/hoc-vien-lop/theo-vai'); invalidate('/hoc-vien-lop/em'); invalidate('/students');
        const doi = !hoanTac && body.ketLuan === 'chuyen-thang' && body.thang && !thang.includes(body.thang) ? { sang: body.thang, truoc: r.lichThi.thang } : null;
        const huy = !hoanTac ? () => luu({ ...r, ...kq, luu: kq.luu ?? r.luu } as HangHien, bodyHoanTac(r, body), true) : undefined;
        /* Nhật ký vừa thêm dòng: số "Lịch sử · n" chưa biết → mở thì đọc đủ (một lần), không tải lại danh sách. */
        sua(r.studentId, (x) => ({ ...x, ...kq, lsCu: true, doiSang: doi, tt: { kieu: 'xong', hoanTac: huy } }));
        if (body.ketLuan || body.boLich) setHop(null);
        xoaTtSau(r.studentId);
      })
      .catch((e: any) => sua(r.studentId, (x) => ({ ...x, tt: { kieu: 'loi', loi: e?.message ?? t('Không lưu được'), lai: () => luu(r, body, hoanTac) } })));
  };
  const doiMo = (id: number) => setMo((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  /** B7 (chủ SP 08/11): bấm thanh (dòng / thẻ) mở dải thông tin HV — trừ khi bấm vào link, nút, ô nhập, menu, hộp (việc riêng của chúng). Bàn phím: nút ⌄ của dòng. */
  const bamDong = (id: number) => (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button, input, select, textarea, label, [role="menu"], [role="dialog"], .lt-hop, .lt-dai')) return;
    if (window.getSelection()?.toString()) return;   // đang bôi chữ để chép — không mở / thu
    doiMo(id);
  };
  /** Việc lịch → hộp dưới hàng (bấm lại = đóng); Ghi KQ · Bước tiếp · Sửa KQ → panel Sau thi có sẵn. */
  const bam = (r: HangHien, nut: ThaoTacLichThi) => {
    if (laHop(nut)) { setPanel(null); setHop(hop?.id === r.studentId ? null : { id: r.studentId, nut }); return; }
    if (r.cycleId) { setHop(null); setPanel({ id: r.studentId, cycleId: r.cycleId, ten: r.ten, lop: r.classCode, nut }); }
  };
  const hanh: Hanh = { hop, panel, bam, suaGhi: setSuaGhi, moCase: onMoCase, ds };
  const khoang = `${nhanThang(tu)} → ${nhanThang(den)}`;
  const oGhi = (r: HangHien, the?: boolean) => (
    <CotGhi r={r} khoa={!r.coTheSua || r.tt?.kieu === 'luu'} hienNhan={the} sua={suaGhi === r.studentId}
      onSua={(b) => setSuaGhi(b ? r.studentId : null)} onLuu={(ghiChu) => luu(r, { ghiChu })} />
  );

  const dongBang = (r: HangHien) => {
    const dau = dauLop.get(r.studentId);
    const dangMo = mo.has(r.studentId);
    const hopMo = hop?.id === r.studentId ? hop.nut : null;
    return (
      <Fragment>
        {dau && <tr className="lt-lop"><td colSpan={COT_LICH.length}><ChuLop {...dau} /></td></tr>}
        <tr className={`lt-h ${dangMo || hopMo ? 'lt-mo' : ''}`} onClick={bamDong(r.studentId)}>
          <OBang c={C_TEN}><TenEm r={r} ds={ds} /></OBang>
          <OBang c={C_LICH}><CotLich r={r} hanh={hanh} /></OBang>
          <OBang c={C_TARGET}><CotTarget r={r} /></OBang>
          <OBang c={C_MT}><CotMt r={r} /></OBang>
          <OBang c={C_SOS}><CotSos r={r} /></OBang>
          <OBang c={C_GHI}>{oGhi(r)}</OBang>
          <OBang c={C_MO}><NutMo r={r} mo={dangMo} onMo={() => doiMo(r.studentId)} /></OBang>
        </tr>
        {hopMo && <tr className="lt-r-hop"><td colSpan={COT_LICH.length}><HopLich key={hopMo} r={r} nut={hopMo} onHuy={() => setHop(null)} onLuu={(b) => luu(r, b)} /></td></tr>}
        {dangMo && <tr className="lt-r-dai"><td colSpan={COT_LICH.length}><DaiMo r={r} hanh={hanh} /></td></tr>}
      </Fragment>
    );
  };

  /* 375 (mockup K8b): mỗi em một thẻ — tên · ⌄ / dòng lịch thi (bấm để sửa) / Target · MT gần nhất · SOS; ghi chú chỉ khi có; hộp sửa xếp dọc. */
  const the = (r: HangHien) => {
    const dau = dauLop.get(r.studentId);
    const dangMo = mo.has(r.studentId);
    const hopMo = hop?.id === r.studentId ? hop.nut : null;
    const st = r.standing;
    const dat = st?.overall != null ? datKv(st.overall, st.expectation, r.kck) : null;
    return (
      <Fragment key={r.studentId}>
        {dau && <li className="lt-lop"><ChuLop {...dau} /></li>}
        <li className={dangMo || hopMo ? 'lt-mo' : ''} onClick={bamDong(r.studentId)}>
          <div className="lt-the-1"><TenEm r={r} ds={ds} /><NutMo r={r} mo={dangMo} onMo={() => doiMo(r.studentId)} /></div>
          <div className="lt-the-lich"><CotLich r={r} hanh={hanh} /></div>
          {hopMo && <HopLich key={hopMo} r={r} nut={hopMo} the onHuy={() => setHop(null)} onLuu={(b) => luu(r, b)} />}
          {!hopMo && <div className="lt-the-diem">
            <span>Target <b className="tabular-nums"><CotTarget r={r} /></b></span>
            {st?.overall != null && <span>{st.attemptLabel} <span className={`lt-diem ${dat === true ? 'dat' : dat === false ? 'duoi' : ''}`}>{st.overall.toFixed(1)}</span></span>}
            {!!st?.sosLevel && st.sosLevel > 0 && <CotSos r={r} />}
          </div>}
          {oGhi(r, true)}
          {dangMo && <DaiMo r={r} hanh={hanh} />}
        </li>
      </Fragment>
    );
  };

  const oThang = (v: string, ten: string, f: (m: string) => void) => <ONgay kieu="thang" gon value={v} ariaLabel={ten} onChange={(m) => m && f(m.slice(0, 7))} />;
  const oTu = oThang(tu, t('Từ tháng'), (m) => onDoiThang(m > den ? [m, m] : [m, den]));
  const oDen = oThang(den, t('Đến tháng'), (m) => onDoiThang(m < tu ? [m, m] : [tu, m]));
  /* Số 0 không bấm (như chip lọc tab Tất cả) — trừ đoạn đang chọn. */
  const doan = (
    <span className="doan lt-loc-thi" role="group" aria-label={t('Trạng thái thi')}>
      {LOC_THI.map((x) => {
        const n = soLoc(x.key);
        return <button key={x.key ?? 'tat-ca'} type="button" aria-pressed={locThi === x.key} disabled={n === 0 && locThi !== x.key} onClick={() => chonLoc(x.key)}>{x.nhan()}<b className="tabular-nums">{n}</b></button>;
      })}
    </span>
  );
  const locTvv = (dsTvv.length > 0 || coChuaTvv) && (
    /* GD-5 (R5.2 #53, `10` mục B): ô lọc có tìm — "Tôi" (khi là TVV) lên trước, rồi TVV chi nhánh, "Chưa có TVV" cuối. */
    <ChonLoc className="lt-o-loc w-[176px] max-sm:w-[calc(50%-4px)]" ariaLabel={t('TVV')} tatCa={t('Mọi TVV')} placeholder={t('Gõ tên TVV…')} value={tvv} onChange={setTvv}
      ds={[...dsTvv.filter((x) => x === toi).map((x) => ({ gt: x, ten: x, nhom: t('Tôi') })),
        ...dsTvv.filter((x) => x !== toi).map((x) => ({ gt: x, ten: x, ...(toi && dsTvv.includes(toi) ? { nhom: t('TVV chi nhánh') } : {}) })),
        ...(coChuaTvv ? [{ gt: TVV_CHUA, ten: t('Chưa có TVV') }] : [])]} />
  );
  /* 375: số bộ lọc đang bật trên nút "Lọc" (lớp · TVV · trạng thái thi). */
  const soDangLoc = Number(!!dangLocLop) + Number(!!tvv) + Number(!!locThi);
  const tenLoc = LOC_THI.find((x) => x.key === locThi)?.nhan();

  return (
    <div className="card overflow-hidden !p-0">
      {/* GD-13a / ⑥ R6.2: MỘT thứ tự hàng lọc mọi tab — Tìm · Mọi lớp · Mọi TVV · lọc riêng của tab · phải. */}
      <div className="loc-hvl flex flex-wrap items-center gap-2 border-b p-3" style={{ borderColor: 'var(--line)' }} data-hd="hvl-lich-thi">
        {locTren}
        {dienThoai && (
          <button type="button" className={`btn btn-sm min-h-[44px] ${moLoc || soDangLoc ? 'nut-loc-dang' : ''}`} aria-expanded={moLoc} onClick={() => setMoLoc(!moLoc)}>
            {soDangLoc ? `${t('Lọc')} · ${soDangLoc}` : t('Lọc')}
          </button>
        )}
        {(!dienThoai || moLoc) && <>
          {locLop}
          {locTvv}
          <span className="flex items-center gap-2 max-sm:w-full max-sm:[&>span]:min-w-0 max-sm:[&>span]:flex-1">
            <span className="text-[13px] font-medium text-faint max-sm:hidden">{t('Tháng thi')}</span>
            <span className="w-[134px]">{oTu}</span><span aria-hidden className="text-faint max-sm:!flex-none">→</span><span className="w-[134px]">{oDen}</span>
          </span>
          {data && <span className="ml-auto max-sm:ml-0 max-sm:w-full max-sm:overflow-x-auto">{doan}</span>}
        </>}
      </div>
      {error && <div className="p-3"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></div>}
      {loading && !data && <div className="p-3"><Skeleton rows={5} /></div>}
      {data && hien.length === 0 && (
        <Card>
          <div className="lt-rong">
            {locThi && trongPham.length > 0
              ? <><span className="lt-rong-t">{t('Không em nào “{loc}” trong {khoang}.', { loc: tenLoc ?? '', khoang })}</span>
                <button type="button" className="btn btn-sm nut-nho" onClick={() => chonLoc(null)}>{t('Xem tất cả · {n}', { n: trongPham.length })}</button></>
              : <span className="lt-rong-t">{t('Không có HV có lịch thi trong {khoang}.', { khoang })}</span>}
          </div>
        </Card>
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
