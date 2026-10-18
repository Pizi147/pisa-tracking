import { Fragment, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useTapUrl } from '../../lib/quayLai.ts';
import { useSession } from '../../lib/session.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, Empty, ErrorState, SCORE_CHIP, Skeleton, Th } from '../../ui/ui.tsx';
import { CHIP_VUONG } from '../../ui/Nhan.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { HangCon, HangNhom } from '../../ui/HangNhom.tsx';
import { DINH_TRAI, SoO as SoLieuO } from './dungChung.tsx';
import { NganXuatMt } from '../test/NganXuatMt.tsx';
import { t } from '@shared/i18n/index.ts';
import {
  CHUONG_TRINH_LABEL, GOI_Y_XU_LY, KHOANG_LABEL, KHOANG_MAC_DINH, THEO_DONG, THEO_DONG_COT_DAU, THEO_DONG_DANH_TU, THEO_DONG_LABEL,
  NHAN_NHOM_CON, addDaysIso, bangXuatTongHop, cotSoLieu, cotTheoDuLieu, cotTongHopFor, mauOKetQua, mondayOfDate, ngay, nhomCotNhanNgan, oKhongApDung,
  type ChuongTrinh, type CotTongHop, type DongTongHop, type Khoang, type MauOKetQua, type NhomCot, type TheoDong, type TongHopKetQua,
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

/** Chú giải màu ở đầu bảng: ô màu nhỏ + chữ (PR-HK1 H5: chú giải, không bấm được — nên không mang kiểu chip/nút); tooltip là chú giải cột. */
const CHU_GIAI: { khoa: string; nhan: string; chip: keyof typeof SCORE_CHIP }[] = [
  { khoa: 'dat', nhan: 'Đạt', chip: 'emerald' }, { khoa: 'sos1', nhan: 'SOS 1', chip: 'sos1' },
  { khoa: 'sos2', nhan: 'SOS 2', chip: 'sos2' }, { khoa: 'sos3', nhan: 'SOS 3', chip: 'sos3' },   // chữ thật lấy từ cột theo ct (khung thường: n môn trượt)
];

/** Tuần con của "Theo tuần" mở theo lớp; "Theo lớp" mở theo đợt; "Theo đợt"/"Theo chi nhánh" mở theo lớp. */
const NHAN_MO_CON: Record<TheoDong, string> = { tuan: 'Mở theo lớp', lop: 'Mở theo đợt', dot: 'Mở theo lớp', cn: 'Mở theo lớp' };

export function TongHopTestSos({ branchId, ct, tg, classId }: {
  branchId: number | null; ct: ChuongTrinh; tg: Khoang; classId: number | null;
}) {
  const { session } = useSession();
  const demoDate = useNgayNghiepVu().homNay || null;
  const [params, setParams] = useSearchParams();
  const theo: TheoDong = (THEO_DONG as readonly string[]).includes(params.get('theo') ?? '') ? (params.get('theo') as TheoDong) : 'tuan';
  const setTheo = (v: TheoDong) => {
    const next = new URLSearchParams(params);
    if (v === 'tuan') next.delete('theo'); else next.set('theo', v);
    setParams(next, { replace: false });
  };
  /* PR-OV5b: hàng đang mở nằm trên URL (`?mo-hang=`) — Quay lại từ hồ sơ về đúng tuần đang mở. */
  const [open, setOpen] = useTapUrl('mo-hang');
  const [cotHien, setCotHien] = useState<Set<NhomCot>>(() => docCotHien());
  const [moXuat, setMoXuat] = useState(false);
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
  if (tg !== KHOANG_MAC_DINH) qs.set('tg', String(tg));
  if (classId) qs.set('lop', String(classId));
  qs.set('theo', theo);
  const query = qs.toString();
  const { data, loading, error, reload } = useApi<TongHopKetQua>(`/phan-tich/tong-hop?${query}`, [query]);

  useEffect(() => {
    if (!data || data.theo !== theo || daMoSan.current === theo) return;
    daMoSan.current = theo;
    /* PR-OV1a (7.2): theo tuần mở sẵn tuần TRƯỚC (tuần này còn đang chấm) — hàng có dòng con mới nhất không phải tuần này. */
    const dau = data.theo === 'tuan' ? data.hang.find((h) => h.con?.length && !h.tuanNay) ?? data.hang[0] : data.hang[0];
    if (dau?.con?.length) setOpen(new Set([dau.khoa]));
  }, [data, theo]);

  const allCols = cotTheoDuLieu(cotTongHopFor(ct), data?.tongCoDot);   // OV-11h: nhóm Checkpoint chỉ khi bảng có PET / KET
  const cols = allCols.filter((c) => cotHien.has(c.nhom));
  /*
   * Tầng đầu đề trên: FT theo nhóm cột (Kết quả · Dưới kỳ vọng · Xử lý). Lớp thường (PR-Pb2-a, P4) theo nhóm con — Giữa khoá (theo môn) ·
   * Cuối khoá (% tổng) · Mini Test; cột Kết quả đứng riêng (Bài, Chưa đủ điểm) chiếm cả hai tầng.
   */
  const laThuong = ct === 'thuong';
  const khoaNhom = (c: CotTongHop) => (laThuong && c.nhom === 'ket-qua' ? c.nhomCon ?? `don:${c.khoa}` : c.nhom);
  const nhomChay: { khoa: string; nhan: string; cols: CotTongHop[] }[] = [];
  for (const c of cols) {
    const k = khoaNhom(c);
    const last = nhomChay[nhomChay.length - 1];
    if (last && last.khoa === k) last.cols.push(c);
    else nhomChay.push({ khoa: k, nhan: c.nhomCon && laThuong ? NHAN_NHOM_CON[c.nhomCon] : nhomCotNhanNgan(c.nhom, ct), cols: [c] });
  }
  const donCot = (k: string) => k.startsWith('don:');
  /** Bề rộng cột (px, bảng cố định bề ngang): nhóm Xử lý 96 (OV-12d: ba cột, "Đang xử lý" một dòng) · Kết quả 68 · kỹ năng 60. */
  const rongCot = (c: CotTongHop) => (c.nhom === 'xu-ly' ? 96 : c.nhom === 'ket-qua' ? 68 : 60);

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
      branchName ?? 'Tất cả chi nhánh', CHUONG_TRINH_LABEL[ct], KHOANG_LABEL[tg],
      className, `dữ liệu đến ${ngay(demoDate)}`,
    ].filter(Boolean).join(' · ');
    const aoa = bangXuatTongHop(data, cotHien, moTa);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tổng hợp');
    const ten = ngay(demoDate).split('/').join('-');
    XLSX.writeFile(wb, `${ct === 'thuong' ? 'tong-hop-test' : 'tong-hop-test-sos'}-${ten}.xlsx`);   // D8: lớp thường không chữ SOS
  }

  /** Một SỐ bấm được: `nguon` = `/phan-tich/tong-hop/o` cùng khoá dòng + khoá cột số liệu → số = số dòng khi bấm (G-10). Ô 0: "0" xám, không bấm. */
  const soBam = (row: DongTongHop, col: CotTongHop) => {
    const v = row.o[col.khoa] ?? 0;
    if (v <= 0) return <span className="tabular-nums text-faint">0</span>;
    const nguon = `/phan-tich/tong-hop/o?${query}&khoa=${encodeURIComponent(row.khoa)}&cot=${encodeURIComponent(col.khoa)}`;
    return <SoLieuO giaTri={v} nguon={nguon} tieuDe={`${col.nhomCon ? `${NHAN_NHOM_CON[col.nhomCon]} · ` : ''}${col.nhan(ct)} · ${row.nhan}`} />;
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
    return <span className={`${CHIP_VUONG} min-w-[28px] justify-center ${MAU_O[mau]}`}>{soBam(row, col)}</span>;
  };

  /* PR-HK2 (Q1): ba nút ngoài (Cột hiện ▾, Xuất bảng này, Xuất kết quả từng lượt) gom vào MỘT menu ⋯. */
  const khongXuat = !data || data.hang.length === 0 || !demoDate;
  const mucMenu: MucMenu[] = [
    { key: 'cot-hien', nhan: 'Cột hiện', tieuDe: true, onChon: () => {} },
    ...NHOM_MAC_DINH.map((n) => ({ key: n, nhan: nhomCotNhanNgan(n, ct), chon: cotHien.has(n), onChon: () => toggleCotHien(n) })),
    { key: 'xuat', nhan: '⤓ Xuất bảng này', keTruoc: true, onChon: xuatExcel, tat: khongXuat, title: khongXuat ? 'Chưa có dữ liệu để xuất' : undefined },
    ...(session?.nav?.xuatMt ? [{ key: 'xuat-mt', nhan: 'Xuất kết quả từng lượt', onChon: () => setMoXuat(true) }] : []),
  ];

  const oSo = (row: DongTongHop) => cols.map((c) => <td key={c.khoa} className="whitespace-nowrap px-3 text-right tabular-nums">{oCell(row, c)}</td>);
  const tenDong = (row: DongTongHop) => (
    <span className="block min-w-0">
      <span className="block truncate max-sm:whitespace-normal">{row.nhan}</span>
      {row.phu && <span className="block truncate text-xs font-normal text-slate-500 max-sm:whitespace-normal" title={row.phu}>{row.phu}</span>}
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
      <td><span className="block truncate max-sm:whitespace-normal">{row.nhan}</span></td>
      {oSo(row)}
    </HangCon>
  );

  return (
    <>
    <Card
      bodyClass="p-0"
      action={
        <div className="flex flex-wrap items-center gap-2 p-3 pb-0">
          <div role="radiogroup" aria-label="Cách xếp dòng" className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
            {THEO_DONG.filter((k) => k !== 'cn' || !anCotChiNhanh).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={theo === k} onClick={() => setTheo(k)}
                className={`px-3 py-1 text-xs border-0 cursor-pointer max-sm:min-h-10 ${theo === k ? 'bg-doing-bg text-doing font-semibold' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
                {THEO_DONG_LABEL[k]}
              </button>
            ))}
          </div>
          {!laThuong && <span className="flex flex-wrap items-center gap-x-3 gap-y-1" role="group" aria-label="Chú giải màu kết quả">
            {CHU_GIAI.map((g) => (
              <span key={g.khoa} title={allCols.find((c) => c.khoa === g.khoa)?.goiY}
                className="inline-flex items-center gap-1 text-xs text-slate-400">
                <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-sm border ${SCORE_CHIP[g.chip]}`} />
                {allCols.find((c) => c.khoa === g.khoa)?.nhan(ct) ?? g.nhan}
              </span>
            ))}
          </span>}
          <span className="flex-1" />
          <MenuDong nhan="Cột hiện và xuất bảng" muc={mucMenu} />
        </div>
      }>
      {error ? <div className="p-4"><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></div>
        : loading || !data ? <div className="p-4"><Skeleton rows={8} /></div>
        : data.scopeEmpty ? <div className="p-4"><Empty title="Bạn chưa được cấp phạm vi nào" /></div>
        : data.hang.length === 0 ? <div className="p-4"><Empty title={`Chưa có lượt nào có điểm trong ${KHOANG_LABEL[tg]}`} /></div>
        : (
          <div className="table-scroll bang-dinh bang-dinh-1440">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                {/* PR-HK2: bảng đủ cột (FT 17 · lớp thường 18) vừa 1440 (≤ 1398 px) — đầu cột hai dòng; ô "HV - Case" rộng hơn. Điện thoại: cột Tuần đứng yên nhỏ lại, nhường chỗ cho số. */}
                {/* OV-14b: lớp thường 22 cột — cột đầu 158 px để cả bảng ≤ 1398 px (208 thì 1469/1440, trang trượt ngang). */}
                <col className={`${ct === 'thuong' ? 'w-[158px]' : 'w-[208px]'} max-sm:w-[132px]`} />
                {cols.map((c) => <col key={c.khoa} style={{ width: rongCot(c) }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} className="th sticky-col text-left align-bottom">{THEO_DONG_COT_DAU[theo]}</th>
                  {nhomChay.map((g, i) => (donCot(g.khoa)
                    ? <th key={g.khoa} rowSpan={2} title={g.cols[0].goiY} className={`th text-right align-bottom whitespace-normal leading-tight ${i > 0 ? 'border-l' : ''}`} style={{ borderColor: 'var(--line-strong)' }}>{g.cols[0].nhan(ct)}</th>
                    : (
                      <th key={g.khoa + i} colSpan={g.cols.length} className={`th text-center ${i > 0 ? 'border-l' : ''}`} style={{ borderColor: 'var(--line-strong)' }}>
                        {g.nhan}
                        {/* OV-12d: MỘT ⓘ chung cho nhóm Xử lý (mockup 2 phần 6) thay chú giải từng cột. */}
                        {g.khoa === 'xu-ly' && <span className="ml-1 cursor-help normal-case tracking-normal text-slate-500" tabIndex={0} title={GOI_Y_XU_LY} aria-label={`${t('Cách tính nhóm Xử lý')}: ${GOI_Y_XU_LY}`}>ⓘ</span>}
                      </th>
                    )))}
                </tr>
                <tr>
                  {cols.filter((c) => !donCot(khoaNhom(c))).map((c) => (
                    <Th key={c.khoa} align="right" hint={c.goiY} className="whitespace-normal align-bottom leading-tight">
                      {c.nhan(ct)}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.hang.map((r) => (
                  <Fragment key={r.khoa}>
                    {dongLon(r)}
                    {open.has(r.khoa) && r.con?.map((c) => dongCon(c))}
                  </Fragment>
                ))}
                <tr className="border-t" style={{ borderColor: 'var(--line-strong)' }}>
                  <td className="td sticky-col font-semibold text-slate-200 sm:whitespace-nowrap">
                    Tổng {data.hang.length} {THEO_DONG_DANH_TU[theo]}
                  </td>
                  {cols.map((c) => (
                    <td key={c.khoa} className="td whitespace-nowrap text-right tabular-nums font-semibold">{oCell({ khoa: 'tong', nhan: 'Tổng', o: data.tong, coDot: data.tongCoDot }, c)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
    </Card>
    {moXuat && demoDate && (
      <NganXuatMt khung={ct === 'thuong' ? 'thuong' : 'ft'} chiNhanh={branchId} lop={classId ? { id: classId, ma: className ?? `#${classId}` } : null}
        thoiGianMacDinh={{ kieu: 'tuan', tu: addDaysIso(mondayOfDate(demoDate), -7 * (tg - 1)), den: mondayOfDate(demoDate) }} onDong={() => setMoXuat(false)} />
    )}
    </>
  );
}
