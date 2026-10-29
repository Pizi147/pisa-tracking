import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useTapUrl } from '../../lib/quayLai.ts';
import { useSession } from '../../lib/session.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, Empty, ErrorState, SCORE_CHIP, Skeleton, Th } from '../../ui/ui.tsx';
import { CHIP_VUONG } from '../../ui/Nhan.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { DaiChiSo, DauThe, DINH_TRAI, OChon, SoO as OSo, VaoHangLoc, type ChiSo } from './dungChung.tsx';
import { NganXuatMt } from '../test/NganXuatMt.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { t } from '@shared/i18n/index.ts';
import {
  CHUONG_TRINH_LABEL, GOI_Y_XU_LY, THEO_DONG, THEO_DONG_COT_DAU, THEO_DONG_DANH_TU,
  NHAN_NHOM_CON, bangXuatTongHop, cotSoLieu, cotTheoDuLieu, cotTongHopFor, mauOKetQua, mondayOfDate, ngay, nhanKhoang, nhomCotLabel, nhomCotNhanNgan, oKhongApDung,
  type ChuongTrinh, type CotTongHop, type DongTongHop, type KhoangNgay, type MauOKetQua, type NhomCot, type TheoDong, type TongHopKetQua,
} from '@shared/domain/index.ts';

const KHOA_LUU_COT_HIEN = 'pisa.phan-tich.tong-hop.cot-hien';
const NHOM_MAC_DINH: readonly NhomCot[] = ['ket-qua', 'ky-nang', 'xu-ly'];

function docCotHien(): Set<NhomCot> {
  try {
    const raw = localStorage.getItem(KHOA_LUU_COT_HIEN);
    if (!raw) return new Set(NHOM_MAC_DINH);
    const arr = (JSON.parse(raw) as string[]).filter((x): x is NhomCot => (NHOM_MAC_DINH as readonly string[]).includes(x));
    return arr.length ? new Set(arr) : new Set(NHOM_MAC_DINH);
  } catch { return new Set(NHOM_MAC_DINH); }
}
function luuCotHien(s: Set<NhomCot>) {
  try { localStorage.setItem(KHOA_LUU_COT_HIEN, JSON.stringify([...s])); } catch { /* lỗi thì hiện đủ ba nhóm, không chặn */ }
}

/** Cột cần chú ý — chỉ đổi màu chữ (G-4: không badge). Thiếu điểm xám đậm (PR-HK2: thay cột Tạm thời cũ). */
const MAU_COT: Partial<Record<string, string>> = { chuaDu: 'text-muted' };

/**
 * MÀU Ô KẾT QUẢ TEST (N-1b, Q23; PR-HK2 Q1): số Đạt / SOS 1–3 là BADGE VUÔNG (`CHIP_VUONG`, dáng chip SOS: chữ + nền nhạt + viền) khi có số —
 * Đạt xanh lá · SOS 1 vàng · SOS 2 cam · SOS 3 đỏ (cùng `SCORE_CHIP`, không màu mới); ô 0 xám `text-faint`, không badge.
 * Màu đặt trên MỘT `<span>` trong ô (CSS hàng lớn/hàng con đã tô nền cho `<td>`).
 */
const MAU_O: Record<MauOKetQua, string> = {
  dat: SCORE_CHIP.emerald, sos1: SCORE_CHIP.sos1, sos2: SCORE_CHIP.sos2, sos3: SCORE_CHIP.sos3, xam: 'text-faint',
};
/** V8-PT: số trong chip Đạt / SOS không gạch chân, mang màu chip (chip đã là ô bấm — mockup `.chip-so`). */
const SO_TRONG_CHIP = '!no-underline !text-inherit !font-semibold';
const CHIP_SO = `${CHIP_VUONG} min-w-[30px] justify-center text-[13px]`;

/** Tuần con của "Theo tuần" mở theo lớp; "Theo lớp" mở theo đợt; "Theo đợt"/"Theo chi nhánh" mở theo lớp. */
const NHAN_MO_CON: Record<TheoDong, string> = { tuan: 'Mở theo lớp', lop: 'Mở theo đợt', dot: 'Mở theo lớp', cn: 'Mở theo lớp' };
/** OV-15e (Q6b) → V8-PT: ô "Xếp theo" lên hàng lọc ("Theo tuần ▾"); cùng chữ là tiêu đề thẻ bảng. */
const NHAN_XEP: Record<TheoDong, string> = { tuan: t('Theo tuần'), lop: t('Theo lớp'), dot: t('Theo đợt Test'), cn: t('Theo chi nhánh') };
const demTheo = (theo: TheoDong, n: number) =>
  theo === 'tuan' ? t('{n} tuần', { n }) : theo === 'lop' ? t('{n} lớp', { n }) : theo === 'dot' ? t('{n} đợt', { n }) : t('{n} chi nhánh', { n });
/** Thẻ 375 (FT): Kết quả xếp lưới 3 × 2 như mockup — Lượt MT · Đạt · Thiếu điểm / SOS 1 · SOS 2 · SOS 3. */
const DAU_THE_KQ = ['luot', 'dat', 'chuaDu'];

export function TongHopTestSos({ branchId, ct, khoang, classId }: {
  branchId: number | null; ct: ChuongTrinh; khoang: KhoangNgay; classId: number | null;
}) {
  const nhanKy = nhanKhoang(khoang).chinh;
  const { session } = useSession();
  const demoDate = useNgayNghiepVu().homNay || null;
  const dienThoai = useDienThoai();
  const [params, setParams] = useSearchParams();
  const theo: TheoDong = (THEO_DONG as readonly string[]).includes(params.get('theo') ?? '') ? (params.get('theo') as TheoDong) : 'tuan';
  const setTheo = (v: TheoDong) => {
    const next = new URLSearchParams(params);
    if (v === 'tuan') next.delete('theo'); else next.set('theo', v);
    setParams(next, { replace: false });
  };
  /* V8-PT (D2): rỗng → một bấm sang "Toàn bộ" (cùng tham số khoảng chung với ô Thời gian). */
  const xemToanBo = () => {
    const next = new URLSearchParams(params);
    next.set('kieu', 'toan-bo'); next.delete('tu'); next.delete('den');
    setParams(next, { replace: false });
  };
  /* PR-OV5b: hàng đang mở nằm trên URL (`?mo-hang=`) — Quay lại từ hồ sơ về đúng tuần đang mở. */
  const [open, setOpen] = useTapUrl('mo-hang');
  const [cotHien, setCotHien] = useState<Set<NhomCot>>(() => docCotHien());
  const [moXuat, setMoXuat] = useState(false);
  const [moTong, setMoTong] = useState(false);
  /* Mặc định thu gọn; hàng lớn đầu tiên (theo tuần: tuần trước) mở sẵn, một lần cho mỗi cách xếp dòng. */
  const daMoSan = useRef<string | null>(open.size ? theo : null);   // URL đã có hàng mở (vừa quay lại) → không mở sẵn đè lên
  const theoTruoc = useRef(theo);
  useEffect(() => {
    if (theoTruoc.current === theo) return;
    theoTruoc.current = theo;
    setOpen(new Set()); daMoSan.current = null;
  }, [theo]); // eslint-disable-line react-hooks/exhaustive-deps

  const branches = useApi<any[]>('/ref/branches');
  const classes = useApi<any[]>(`/ref/classes${branchId ? `?branchId=${branchId}` : ''}`);
  const anCotChiNhanh = !!branchId || (branches.data?.length ?? 0) <= 1;

  const qs = new URLSearchParams();
  if (branchId) qs.set('branchId', String(branchId));
  qs.set('ct', ct);
  qs.set('kieu', khoang.kieu); qs.set('tu', khoang.tu); qs.set('den', khoang.den);
  if (classId) qs.set('lop', String(classId));
  qs.set('theo', theo);
  const query = qs.toString();
  const { data, loading, error, reload } = useApi<TongHopKetQua>(`/phan-tich/tong-hop?${query}`, [query]);
  const pt = usePhanTrang(data?.hang.length ?? 0, query, THEO_DONG_DANH_TU[theo]);

  useEffect(() => {
    if (!data || data.theo !== theo || daMoSan.current === theo) return;
    daMoSan.current = theo;
    if (dienThoai) return;   // V8-PT (C1): thẻ tuần 375 mặc định gập — "3 lớp ▾" mở khi cần
    /* PR-OV1a (7.2): theo tuần mở sẵn tuần TRƯỚC (tuần này còn đang chấm) — hàng có dòng con mới nhất không phải tuần này. */
    const dau = data.theo === 'tuan' ? data.hang.find((h) => h.con?.length && !h.tuanNay) ?? data.hang[0] : data.hang[0];
    if (dau?.con?.length) setOpen(new Set([dau.khoa]));
  }, [data, theo]); // eslint-disable-line react-hooks/exhaustive-deps

  const allCols = cotTheoDuLieu(cotTongHopFor(ct), data?.tongCoDot);   // OV-11h: nhóm Checkpoint chỉ khi bảng có PET / KET
  const cols = allCols.filter((c) => cotHien.has(c.nhom));
  /*
   * Tầng đầu đề trên: FT theo nhóm cột (Kết quả · Dưới kỳ vọng · HV · Xử lý). Lớp thường (PR-Pb2-a, P4) theo nhóm con — Giữa khoá (theo môn) ·
   * Cuối khoá (% tổng) · Mini Test; cột Kết quả đứng riêng (Bài, Chưa đủ điểm) chiếm cả hai tầng.
   */
  const laThuong = ct === 'thuong';
  const nhanNhom = (c: CotTongHop) => (c.nhomCon && laThuong ? NHAN_NHOM_CON[c.nhomCon]
    : c.nhom === 'ky-nang' && !laThuong ? t('Dưới kỳ vọng · HV') : nhomCotNhanNgan(c.nhom, ct));
  const khoaNhom = (c: CotTongHop) => (laThuong && c.nhom === 'ket-qua' ? c.nhomCon ?? `don:${c.khoa}` : c.nhom);
  const nhomChay: { khoa: string; nhan: string; cols: CotTongHop[] }[] = [];
  for (const c of cols) {
    const k = khoaNhom(c);
    const last = nhomChay[nhomChay.length - 1];
    if (last && last.khoa === k) last.cols.push(c);
    else nhomChay.push({ khoa: k, nhan: nhanNhom(c), cols: [c] });
  }
  const donCot = (k: string) => k.startsWith('don:');
  /** Cột đầu mỗi nhóm có vạch trái đậm (mockup `.ke-trai`) — ở cả đầu cột và thân bảng. */
  const dauNhom = new Set(nhomChay.map((g) => g.cols[0].khoa));
  const KE_TRAI = 'border-l border-[color:var(--line-strong)]';
  /** Bề rộng cột (px, bảng cố định bề ngang). FT theo mockup V8: Kết quả 84 · kỹ năng 62 · Xử lý 117. Lớp thường giữ 68 / 96 (22 cột ≤ 1398 px). */
  const rongCot = (c: CotTongHop) => (laThuong ? (c.nhom === 'xu-ly' ? 96 : 68) : c.nhom === 'xu-ly' ? 117 : c.nhom === 'ket-qua' ? 84 : 62);

  /* Thẻ 375: một khối mỗi nhóm (lớp thường: theo nhóm con; Bài + Thiếu điểm chung khối Kết quả). */
  const nhomThe: { nhan: string; cols: CotTongHop[] }[] = [];
  for (const c of cols) {
    const nhan = laThuong && c.nhom === 'ket-qua' && !c.nhomCon ? nhomCotNhanNgan('ket-qua', ct) : nhanNhom(c);
    const g = nhomThe.find((x) => x.nhan === nhan);
    if (g) g.cols.push(c); else nhomThe.push({ nhan, cols: [c] });
  }
  if (!laThuong) for (const g of nhomThe) g.cols.sort((a, b) => (DAU_THE_KQ.indexOf(a.khoa) + 1 || 9) - (DAU_THE_KQ.indexOf(b.khoa) + 1 || 9));

  const toggleCotHien = (nhom: NhomCot) => {
    const next = new Set(cotHien);
    if (next.has(nhom)) { if (next.size === 1) return; next.delete(nhom); } else next.add(nhom);
    setCotHien(next);
    luuCotHien(next);
  };

  const toggleOpen = (khoa: string) => {
    const next = new Set(open);
    if (next.has(khoa)) next.delete(khoa); else next.add(khoa);
    setOpen(next);
  };

  const branchName = branchId ? branches.data?.find((b) => b.id === branchId)?.name ?? null : null;
  const className = classId ? classes.data?.find((c) => c.id === classId)?.code ?? null : null;

  async function xuatExcel() {
    if (!data || !demoDate) return;
    const XLSX = await import('xlsx');
    const moTa = [
      branchName ?? 'Tất cả chi nhánh', CHUONG_TRINH_LABEL[ct], nhanKy,
      className, `dữ liệu đến ${ngay(demoDate)}`,
    ].filter(Boolean).join(' · ');
    const aoa = bangXuatTongHop(data, cotHien, moTa);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tổng hợp');
    const ten = ngay(demoDate).split('/').join('-');
    XLSX.writeFile(wb, `${ct === 'thuong' ? 'tong-hop-test' : 'tong-hop-test-sos'}-${ten}.xlsx`);   // D8: lớp thường không chữ SOS
  }

  /**
   * Một SỐ bấm được: `nguon` = `/phan-tich/tong-hop/o` cùng khoá dòng + khoá cột số liệu → số = số dòng khi bấm (G-10). Ô 0: "0" xám, không bấm.
   * `vung`: cùng số ở thẻ chỉ số và dòng Tổng → mỗi vùng một khoá panel (SL1). `lop` / `nhan`: số trong chip (không gạch) · chữ thay số ("SOS 1 · 2").
   */
  const soBam = (row: DongTongHop, col: CotTongHop, vung?: string, lop?: string, nhan?: string) => {
    const v = row.o[col.khoa] ?? 0;
    if (v <= 0) return <span className="tabular-nums text-faint">0</span>;
    const nguon = `/phan-tich/tong-hop/o?${query}&khoa=${encodeURIComponent(row.khoa)}&cot=${encodeURIComponent(col.khoa)}`;
    return <OSo giaTri={v} nguon={nguon} vung={vung} className={lop} nhan={nhan} tieuDe={`${col.nhomCon ? `${NHAN_NHOM_CON[col.nhomCon]} · ` : ''}${col.nhan(ct)} · ${row.nhan}`} />;
  };
  const oCell = (row: DongTongHop, col: CotTongHop) => {
    if (oKhongApDung(col, row.coDot)) return <span className="text-faint" title="Dòng này không có bài loại này">—</span>;
    /* Cột ghép "HV - Case" (PR-HK2 Q1): hai số, mỗi số một nguồn danh sách riêng; màu nhẹ theo token — HV xanh dương, Case xám, "-" mờ. */
    if (col.gop) {
      const [hv, cs] = cotSoLieu(ct).filter((c) => col.gop!.includes(c.khoa));
      return (
        <span title={`${row.o[hv.khoa] ?? 0} học viên · ${row.o[cs.khoa] ?? 0} Case`}>
          <span className="font-semibold text-doing">{soBam(row, hv)}</span> <span className="text-faint">-</span> <span className="text-muted">{soBam(row, cs)}</span>
        </span>
      );
    }
    const v = row.o[col.khoa] ?? 0;
    const mau = mauOKetQua(col.khoa, v);
    if (v <= 0) return soBam(row, col);
    /* OV-12d: Chờ duyệt kèm "⚠ n" quá hạn (PR-HK2: ⚠ đỏ cam, chữ đầy đủ ở title). */
    const quaHan = col.khoa === 'choDuyet' ? row.o.choDuyetQuaHan ?? 0 : 0;
    if (!mau) return <span className={MAU_COT[col.khoa] ?? ''}>{soBam(row, col)}{quaHan > 0 && <span className="ml-1 font-bold text-late" title={`${quaHan} quá hạn`}>⚠{quaHan}<span className="sr-only"> quá hạn</span></span>}</span>;
    return <span className={`${CHIP_SO} ${MAU_O[mau]}`}>{soBam(row, col, undefined, SO_TRONG_CHIP)}</span>;
  };

  /* PR-HK2 (Q1) → V8-PT: "Xuất Excel" thành nút riêng cuối hàng lọc; ⋯ giữ Cột hiện + Xuất kết quả từng lượt. 375: ⋯ gánh cả Xuất bảng này (mockup C1 chỉ có ⋯). */
  const khongXuat = !data || data.hang.length === 0 || !demoDate;
  const lyDoKhongXuat = khongXuat ? t('Chưa có dữ liệu để xuất') : undefined;
  const mucMenu: MucMenu[] = [
    { key: 'cot-hien', nhan: t('Cột hiện'), tieuDe: true, onChon: () => {} },
    ...NHOM_MAC_DINH.map((n) => ({ key: n, nhan: nhomCotNhanNgan(n, ct), chon: cotHien.has(n), onChon: () => toggleCotHien(n) })),
    ...(dienThoai ? [{ key: 'xuat', nhan: t('⤓ Xuất bảng này'), keTruoc: true, onChon: xuatExcel, tat: khongXuat, title: lyDoKhongXuat }] : []),
    ...(session?.nav?.xuatMt ? [{ key: 'xuat-mt', nhan: t('Xuất kết quả từng lượt'), keTruoc: !dienThoai, onChon: () => setMoXuat(true) }] : []),
  ];

  const oSo = (row: DongTongHop) => cols.map((c) => <td key={c.khoa} className={`whitespace-nowrap px-2.5 text-center tabular-nums ${dauNhom.has(c.khoa) ? KE_TRAI : ''}`}>{oCell(row, c)}</td>);
  /** Hàng lớn: tên + dòng phụ (khoảng ngày của tuần) cùng một dòng, chữ phụ mờ (mockup `.phu-o` inline). */
  const tenDong = (row: DongTongHop) => (
    <span className="block min-w-0 truncate">
      {row.nhan}
      {row.phu && <span className="ml-1.5 text-xs font-normal text-[color:var(--text-faint)]" title={row.phu}>{row.phu}</span>}
    </span>
  );

  /** Hàng lớn có con → `HangNhom` (mũi tên ▸/▾); hàng lớn không con → cùng dáng, ô mũi tên để trống 16px cho thẳng cột. */
  const dongLon = (row: DongTongHop) => {
    if (row.con?.length) {
      return (
        <HangNhom key={row.khoa} mo={open.has(row.khoa)} onMo={() => toggleOpen(row.khoa)} nhan={`${row.nhan} — ${NHAN_MO_CON[theo]}`}
          tieuDe={tenDong(row)} className={DINH_TRAI}>
          {oSo(row)}
        </HangNhom>
      );
    }
    return (
      <tr key={row.khoa} className={`hang-lon dong ${DINH_TRAI}`}>
        <td className="px-3"><span className="flex min-w-0 items-center gap-2"><span className="inline-block h-4 w-4 shrink-0" aria-hidden />{tenDong(row)}</span></td>
        {oSo(row)}
      </tr>
    );
  };
  const dongCon = (row: DongTongHop) => (
    <HangCon key={row.khoa} className={DINH_TRAI}>
      <td><span className="block truncate">{row.nhan}</span></td>
      {oSo(row)}
    </HangCon>
  );

  /* ---------------- 375 (mockup C1, C1b): bảng 14 cột → MỘT THẺ MỖI DÒNG, mỗi nhóm cột một lưới "nhãn trên · số dưới". */
  const phanThe = (row: DongTongHop, vach = true) => nhomThe.map((g) => (
    <div key={g.nhan} className={`px-3 pb-2.5 pt-2 ${vach ? 'border-t border-[color:var(--line)]' : ''}`}>
      <div className="mb-1 text-xs font-semibold text-[color:var(--text-faint)]">{g.nhan}</div>
      <div className="grid gap-x-2 gap-y-1.5" style={{ gridTemplateColumns: `repeat(${g.cols.length <= 5 ? g.cols.length : 3}, minmax(0, 1fr))` }}>
        {g.cols.map((c) => (
          <span key={c.khoa} className="grid min-w-0 gap-px">
            <span className="truncate text-xs font-medium text-[color:var(--text-dim)]">{c.nhan(ct)}</span>
            <span className="text-[15px] font-bold tabular-nums">{oCell(row, c)}</span>
          </span>
        ))}
      </div>
    </div>
  ));
  const THE = 'overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]';
  const DAU_THE = 'flex min-h-[44px] items-center gap-2 bg-[color:var(--hang-lon-bg)] px-3 py-2 font-bold';
  const theDong = (row: DongTongHop) => {
    const mo = open.has(row.khoa);
    return (
      <article key={row.khoa} className={THE}>
        <div className={DAU_THE}>
          <span className="min-w-0">{row.nhan}{row.phu && <span className="ml-1.5 text-[13px] font-normal text-[color:var(--text-faint)]">{row.phu}</span>}</span>
          {!!row.con?.length && (
            <button type="button" aria-expanded={mo} aria-label={`${row.nhan} — ${NHAN_MO_CON[theo]}`} onClick={() => toggleOpen(row.khoa)}
              className="-my-2 ml-auto inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-medium text-[color:var(--accent)]">
              {theo === 'lop' ? t('{n} đợt', { n: row.con.length }) : t('{n} lớp', { n: row.con.length })}<span aria-hidden>{mo ? '▴' : '▾'}</span>
            </button>
          )}
        </div>
        {phanThe(row)}
        {mo && row.con?.map((c) => (
          <section key={c.khoa} className="border-t border-[color:var(--line)] bg-[color:var(--hang-con-bg)]">
            <h3 className="m-0 px-3 pt-2 text-sm font-semibold text-[color:var(--hang-con-chu)]">{c.nhan}</h3>
            {phanThe(c, false)}
          </section>
        ))}
      </article>
    );
  };

  /* ---------------- thẻ chỉ số (G7: cùng số với dòng Tổng — cùng `data.tong`, cùng nguồn panel `khoa=tong`) */
  const tongDong: DongTongHop | null = data ? { khoa: 'tong', nhan: t('Tổng'), o: data.tong, coDot: data.tongCoDot } : null;
  const cotSo = (k: string) => cotSoLieu(ct).find((c) => c.khoa === k);
  const soTong = (k: string, lop?: string, nhan?: string) => {
    const c = cotSo(k);
    return tongDong && c ? soBam(tongDong, c, 'chi-so', lop, nhan) : null;
  };
  const tong = data?.tong ?? {};
  const luot = tong.luot ?? 0;
  const quaHanTong = tong.choDuyetQuaHan ?? 0;
  const chipSos = (['sos1', 'sos2', 'sos3'] as const).map((k): ReactNode => {
    const n = tong[k] ?? 0, nhan = `${cotSo(k)?.nhan(ct) ?? k} · ${n}`;
    return n > 0
      ? <span key={k} className={`${CHIP_VUONG} px-1.5 ${MAU_O[k]}`}>{soTong(k, SO_TRONG_CHIP, nhan)}</span>
      : <span key={k} className="text-xs font-medium text-[color:var(--text-faint)]">{nhan}</span>;
  });
  const chiSo: ChiSo[] = !data ? [] : [
    { ten: laThuong ? t('Bài kiểm tra') : t('Lượt MT'), ky: t('trong kỳ'), gt: soTong('luot'), mau: demTheo(theo, data.hang.length) },
    ...(laThuong ? [] : [
      { ten: t('Đạt'), gt: soTong('dat'), nho: luot ? `${Math.round(((tong.dat ?? 0) * 100) / luot)} %` : undefined, mau: t('trên {n} lượt', { n: luot }) },
      { ten: t('SOS'), rong2: true, gt: <span className="flex flex-wrap items-center gap-1.5 py-1">{chipSos}</span>,
        mau: t('{n} lượt', { n: (tong.sos1 ?? 0) + (tong.sos2 ?? 0) + (tong.sos3 ?? 0) }) },
    ]),
    { ten: t('Thiếu điểm'), gt: soTong('chuaDu'), mau: laThuong ? undefined : t('gồm SOS tạm') },
    { ten: t('Chưa chốt PA'), ky: t('hôm nay'), gt: soTong('choDuyet'),
      nho: quaHanTong > 0 ? <>⚠ {t('{n} quá hạn', { n: quaHanTong })}</> : undefined, mau: t('trên {n} Case', { n: tong.case ?? 0 }) },
  ];
  const SKEL_SO = Array.from({ length: laThuong ? 3 : 5 }, (): ChiSo => ({
    ten: <span className="skel inline-block h-3 w-1/2 align-middle" />, gt: <span className="skel mt-1.5 inline-block h-6 w-2/5" />,
  }));

  /* ⓘ Cách tính đầu thẻ (G9) — thay ⓘ trong `th` nhóm Xử lý và chú giải màu Đạt / SOS: chú giải từng cột (kỹ năng gộp một dòng) + nhóm Xử lý. */
  const kn = allCols.filter((c) => c.nhom === 'ky-nang');
  const cachTinh = (
    <dl className="m-0 space-y-1.5">
      {allCols.filter((c) => c.goiY && c.nhom === 'ket-qua').map((c) => (
        <div key={c.khoa}><dt className="inline font-semibold text-slate-200">{c.nhomCon ? `${NHAN_NHOM_CON[c.nhomCon]} · ` : ''}{c.nhan(ct)}: </dt><dd className="m-0 inline">{c.goiY}</dd></div>
      ))}
      {kn[0]?.goiY && (
        <div><dt className="inline font-semibold text-slate-200">{nhomCotLabel('ky-nang', ct)}: </dt><dd className="m-0 inline">{kn[0].goiY.slice(kn[0].goiY.indexOf('—') + 2)}</dd></div>
      )}
      <div><dt className="inline font-semibold text-slate-200">{t('Xử lý')}: </dt><dd className="m-0 inline">{GOI_Y_XU_LY}</dd></div>
    </dl>
  );

  const tongNhan = `${t('Tổng')} ${demTheo(theo, data?.hang.length ?? 0)}`;
  const coBang = !!data && !data.scopeEmpty && data.hang.length > 0;
  const rong = data && !coBang ? (
    data.scopeEmpty ? <Empty title={t('Bạn chưa được cấp phạm vi nào')} />
      : <Empty title={t('Chưa có lượt nào có điểm')} hint={khoang.kieu === 'toan-bo' ? undefined : t('trong {ky}', { ky: nhanKy })}
          action={khoang.kieu === 'toan-bo' ? undefined : <button type="button" className="btn btn-sm" onClick={xemToanBo}>{t('Xem Toàn bộ')}</button>} />
  ) : null;

  return (
    <>
    <VaoHangLoc o="giua">
      <OChon className="max-sm:w-[calc(50%-4px)]" value={theo} onChange={(e) => setTheo(e.target.value as TheoDong)} aria-label={t('Xếp theo')}>
        {THEO_DONG.filter((k) => k !== 'cn' || !anCotChiNhanh).map((k) => <option key={k} value={k}>{NHAN_XEP[k]}</option>)}
      </OChon>
    </VaoHangLoc>
    <VaoHangLoc o="phai">
      {!dienThoai && (
        <button type="button" className="btn h-9 text-sm font-semibold" onClick={xuatExcel} disabled={khongXuat} title={lyDoKhongXuat}>
          <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" /></svg>
          {t('Xuất Excel')}
        </button>
      )}
      <MenuDong nhan={t('Cột hiện · Xuất kết quả từng lượt')} muc={mucMenu} lopNut="btn h-9 min-w-9 justify-center px-0 text-sm font-semibold max-sm:h-11" />
    </VaoHangLoc>

    {error ? <Card bodyClass="p-0"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></Card>
      : loading || !data ? (
        <div className="space-y-3">
          <DaiChiSo ds={SKEL_SO} />
          <Card bodyClass="p-4"><Skeleton rows={dienThoai ? 4 : 8} /></Card>
        </div>
      )
      : !coBang ? <Card bodyClass="p-0">{rong}</Card>
      : (
        <div className="space-y-3">
          <DaiChiSo ds={chiSo} />
          {dienThoai ? (
            <div className="space-y-3">
              <div ref={pt.thanh.dauBang} />
              {pt.cat(data.hang).map(theDong)}
              <article className={THE}>
                <button type="button" aria-expanded={moTong} onClick={() => setMoTong((v) => !v)} className={`${DAU_THE} w-full cursor-pointer border-0 text-left text-[color:var(--text)]`}>
                  {tongNhan}
                  <span className="ml-auto text-[13px] font-medium">{laThuong ? t('{n} bài', { n: luot }) : t('{n} lượt', { n: luot })} <span aria-hidden>{moTong ? '▴' : '▾'}</span></span>
                </button>
                {moTong && tongDong && phanThe(tongDong)}
              </article>
              <PhanTrang {...pt.thanh} duoi />
            </div>
          ) : (
            <Card bodyClass="p-0">
              <DauThe ten={NHAN_XEP[theo]} dem={demTheo(theo, data.hang.length)}
                phu={`${laThuong ? t('{n} bài', { n: luot }) : t('{n} lượt MT', { n: luot })} · ${CHUONG_TRINH_LABEL[ct]}`} cachTinh={cachTinh} />
              {/* V8-PT: phân trang chỉ dưới bảng (bỏ lặp); neo đầu bảng giữ để lật ở thanh dưới cuộn về đây. */}
              <div ref={pt.thanh.dauBang} />
              <div className="table-scroll bang-dinh bang-dinh-1440">
                <table className="w-full text-[15px]" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    {/* PR-HK2 / OV-14b: lớp thường 22 cột — cột đầu 158 px để cả bảng ≤ 1398 px. FT theo mockup V8: 190 px. */}
                    <col className={ct === 'thuong' ? 'w-[158px]' : 'w-[190px]'} />
                    {cols.map((c) => <col key={c.khoa} style={{ width: rongCot(c) }} />)}
                  </colgroup>
                  <thead>
                    <tr>
                      <th rowSpan={2} className="th sticky-col text-left align-bottom">{THEO_DONG_COT_DAU[theo]}</th>
                      {nhomChay.map((g, i) => (donCot(g.khoa)
                        ? <th key={g.khoa} rowSpan={2} title={g.cols[0].goiY} className={`th text-center align-bottom whitespace-normal leading-tight ${KE_TRAI}`}>{g.cols[0].nhan(ct)}</th>
                        : <th key={g.khoa + i} colSpan={g.cols.length} className={`th h-[30px] py-0 text-center text-[color:var(--text)] ${KE_TRAI}`}>{g.nhan}</th>
                      ))}
                    </tr>
                    <tr>
                      {cols.filter((c) => !donCot(khoaNhom(c))).map((c) => (
                        <Th key={c.khoa} align="center" hint={c.goiY} className={`h-9 px-2.5 py-0 ${laThuong ? 'whitespace-normal align-bottom leading-tight' : 'whitespace-nowrap'} ${dauNhom.has(c.khoa) ? KE_TRAI : ''}`}>
                          {c.nhan(ct)}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pt.cat(data.hang).map((r) => (
                      <Fragment key={r.khoa}>
                        {dongLon(r)}
                        {open.has(r.khoa) && r.con?.map((c) => dongCon(c))}
                      </Fragment>
                    ))}
                    <tr className="border-t" style={{ borderColor: 'var(--line-strong)' }}>
                      <td className="td sticky-col font-bold text-[color:var(--text)] sm:whitespace-nowrap">{tongNhan}</td>
                      {cols.map((c) => (
                        <td key={c.khoa} className={`td whitespace-nowrap text-center tabular-nums font-bold ${dauNhom.has(c.khoa) ? KE_TRAI : ''}`}>{tongDong && oCell(tongDong, c)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-2"><PhanTrang {...pt.thanh} duoi /></div>
            </Card>
          )}
        </div>
      )}
    {moXuat && demoDate && (
      <NganXuatMt khung={ct === 'thuong' ? 'thuong' : 'ft'} chiNhanh={branchId} lop={classId ? { id: classId, ma: className ?? `#${classId}` } : null}
        thoiGianMacDinh={{ kieu: 'tuan', tu: mondayOfDate(khoang.tu), den: mondayOfDate(khoang.den) }} onDong={() => setMoXuat(false)} />
    )}
    </>
  );
}
