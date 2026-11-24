import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { OTuanDay } from '../../ui/TuanDayGv.tsx';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { fmtBand } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { lopKq } from '../../ui/BieuTuong.tsx';
import { ODiem } from '../../ui/ODiem.tsx';
import { NhanKq } from '../../ui/Nhan.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { PhanTrang, usePhanTrang } from '../../ui/PhanTrang.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { DaiChiSo, DauThe, NutXemToanBo, NutXuat, SoO as OSo, VaoHangLoc, thamSoLoc, type PhamViPhanTich } from './dungChung.tsx';
import { ngayX, ptX, soX, xuatBaoCao } from './xuatV2.ts';
import { OSapThiSos, type SapThiSosSo } from './SapThiSos.tsx';
import type { MauXlsx, OXlsx } from '../../lib/xlsxDep.ts';
import {
  mucThi, ngay, nhanKhoang, soSanhDiem,
  type DongGvThiWeb, type DongThiThat, type KetQuaThiThatKq, type KnThiThat, type MucThi, type ThongKeThiThatWeb,
} from '@shared/domain/index.ts';

/**
 * THI THẬT (PR-4, chủ SP 05/11 — mockup v13 C1–C7; thay tab "Kết quả Test / Thi": bỏ phần Mock — Test + SOS đã có bảng điểm theo lượt; Excel Mock ở ⋯ Test + SOS).
 * Một GET `/phan-tich/thi-that`: danh sách (giữ như cũ: nhóm lớp, Bước tiếp chỉ đọc, phân trang, Xuất Excel) + thống kê `thongKeThiThat`
 * (một hàm với Phân tích GV, hồ sơ GV): Tổng · Từng kỹ năng (so Target overall) · Theo GV (QL / QT / CX — máy chủ trả null cho vai khác).
 * Mọi số bấm → panel bảng `/phan-tich/thi-that/o` (kiểu 'thi-that', số = số dòng). Màu: Exceed xanh lá · Đạt xanh dương · Fail đỏ (`lopKq`).
 */
/** Link chữ thường (U08-6): rê / focus mới báo. */
const LINK_CHU = 'rounded-sm text-[color:var(--text)] no-underline hover:text-[color:var(--accent)] hover:underline hover:underline-offset-[3px] focus-visible:text-[color:var(--accent)] focus-visible:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]';
type TabThiThat = KetQuaThiThatKq & { thongKe: ThongKeThiThatWeb; chuaCoKq: number; /** GD-12b-a: ô Sắp thi · còn SOS (hiện tại). */ sapThi?: SapThiSosSo };
const KN4: readonly KnThiThat[] = ['l', 'r', 'w', 's'];
const MUC: readonly MucThi[] = ['exceed', 'dat', 'fail'];
const NHAN_MUC: Record<MucThi, string> = { exceed: t('Vượt'), dat: t('Đạt'), fail: t('Chưa đạt') };   // V2 (XM-1): Vượt · Đạt · Chưa đạt
const MAU_MUC: Record<MucThi, string> = { exceed: lopKq('vuot'), dat: lopKq('bang'), fail: lopKq('duoi') };
const NHAN_KN: Record<string, string> = { l: 'L', r: 'R', w: 'W', w1: 'W1', w2: 'W2', s: 'S' };
const pt = (a: number, b: number) => (b > 0 ? Math.round((a * 100) / b) : 0);
const THE_HV = 'grid gap-1 rounded-xl border px-3 py-2.5';
const nenThe = { background: 'var(--surface)', borderColor: 'var(--line)' };
const oLop = (lopMa: string | null, classId: number | null) => (lopMa && classId
  ? <Link to={`/hoc-vien/lop/${classId}`} className={`${LINK_CHU} !text-dim`}>{lopMa}</Link> : <span className="text-dim">{lopMa ?? '—'}</span>);
const thiLai = (kn: string[]) => t('thi lại {kn}', { kn: kn.join(' · ') });
/** Target số + KCK của một dòng danh sách (`target` "6.0" / "6.0 KCK" / "—"). */
const targetCua = (r: DongThiThat) => ({ v: Number.parseFloat(r.target), kck: /KCK/.test(r.target) });
/** Mức của một lần thi (OVR so Target) — null: Không thi, KCK, chưa có Target / OVR. */
const mucDong = (r: DongThiThat): MucThi | null => {
  const tg = targetCua(r);
  return r.khongThi || tg.kck || Number.isNaN(tg.v) || r.ovr === null ? null : mucThi(r.ovr, tg.v);
};
/** V2 (đặc tả 5.3): em KCK / WL 2 giữ trong danh sách, chip cạnh mức (mức theo Target nếu có — như ô "Tổng thể"). */
const CHIP_KCK = 'inline-flex h-[22px] items-center whitespace-nowrap rounded border px-[7px] text-xs font-semibold';
const chipKck = (r: DongThiThat) => (r.wl2 ? <span className={`${CHIP_KCK} border-soon-line bg-soon-bg text-soon`}>WL 2</span>
  : r.kck ? <span className={`${CHIP_KCK} text-dim`} style={{ borderColor: 'var(--line-strong)' }}>KCK</span> : null);
const chipMuc = (r: DongThiThat) => {
  if (r.khongThi) return <span className="text-xs text-muted">{t('Không thi')}</span>;
  const tg = targetCua(r);
  const m = Number.isNaN(tg.v) || r.ovr === null ? null : mucThi(r.ovr, tg.v);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {m ? <NhanKq kq={m === 'exceed' ? 'vuot' : m === 'dat' ? 'dat' : 'chua-dat'}>{NHAN_MUC[m]}</NhanKq> : !chipKck(r) && <span className="text-faint">—</span>}
      {chipKck(r)}
    </span>
  );
};

export function KetQuaThi(pv: PhamViPhanTich) {
  const { homNay } = useNgayNghiepVu();
  const dienThoai = useDienThoai();
  const query = thamSoLoc({ ...pv, ct: null });
  const { data, loading, error, reload } = useApi<TabThiThat>(`/phan-tich/thi-that?${query}`, [query]);
  const dsCn = useApi<{ id: number; name: string }[]>('/ref/branches');   // tên chi nhánh cho đầu tệp Excel (đường tĩnh, có bản nhớ)
  const rows = data?.rows ?? [];
  const pt_ = usePhanTrang(rows.length, query, t('HV'));
  const nguon = (o: string) => `/phan-tich/thi-that/o?${query}&o=${o}`;
  /** Số bấm được (0 mờ, không bấm) — màu nhóm khi là cột Exceed / Đạt / Fail. */
  const so = (n: number, o: string, tieuDe: string, mau = '', nhan?: string) => (n
    ? <OSo giaTri={n} nhan={nhan} nguon={nguon(o)} tieuDe={tieuDe} className={mau} vung="chi-so" />
    : <span className="font-medium text-faint">{nhan ?? 0}</span>);

  /* V2 (đặc tả 5.2): hai ô là CÔNG TẮC — "Đạt Target · trừ KCK" (mặc định) / "Tổng thể · gồm KCK"; thanh đổi theo ô. Không gọi lại máy chủ. */
  const [tongThe, setTongThe] = useState(false);
  /*
   * PR-5 Excel (đặc tả 7): Tổng (Đạt Target trừ KCK · Tổng thể gồm KCK · Không thi · KCK · Chưa có KQ) · Theo kỹ năng · Theo GV (QL, QT) ·
   * Danh sách = ĐỦ cột Excel Thi thật cũ (Học viên … Ngày chọn), Kết quả tô màu Vượt / Đạt / Chưa đạt. Không gọi thêm máy chủ.
   */
  const MAU_X: Record<MucThi, MauXlsx> = { exceed: 'vuot', dat: 'dat', fail: 'chua-dat' };
  async function xuatExcel() {
    if (!data) return;
    const tk = data.thongKe;
    const ba = (x: { exceed: number; dat: number; fail: number }, mau: number): OXlsx[] => MUC.flatMap((m) => [soX(x[m], MAU_X[m]), ptX(x[m], mau)]);
    const n3 = (x: { exceed: number; dat: number; fail: number }) => x.exceed + x.dat + x.fail;
    const tong: OXlsx[][] = tk ? [
      [t('Đạt Target · trừ KCK'), n3(tk.tong), ...ba(tk.tong, n3(tk.tong))],
      [t('Tổng thể · gồm KCK'), n3(tk.tong.tongThe), ...ba(tk.tong.tongThe, n3(tk.tong.tongThe))],
    ] : [];
    const khac: OXlsx[][] = tk ? [[t('Em thi'), tk.tong.thi], [t('Không thi'), tk.tong.khongThi], [t('KCK (gồm WL 2)'), tk.tong.kck], [`${t('Chưa có KQ')} · ${t('hiện tại')}`, data.chuaCoKq ?? 0]] : [];
    const dau3 = (dau: string): (string | null)[][] => [[dau, t('Em'), ...MUC.flatMap((m) => [NHAN_MUC[m], null])], [null, null, ...MUC.flatMap(() => [t('Số'), '%'])]];
    const danhSach: OXlsx[][] = rows.map((r) => {
      const m = mucDong(r);
      return [r.ten, r.lop ?? '', r.khongThi ? t('Không thi') : ngayX(r.ngayThi), r.thiLai ? thiLai(r.thiLai) : '', ...[r.l, r.r, r.w, r.s, r.ovr].map((b): OXlsx => (b == null ? '' : { v: b, dang: 'band' })), r.target ?? '',
        r.khongThi ? t('Không thi') : m ? { v: NHAN_MUC[m], mau: MAU_X[m] } : r.wl2 ? 'WL 2' : r.kck ? 'KCK' : '', r.buocTiepChu != null ? dich(r.buocTiepChu) : t('Chưa chọn'), r.nguoiChon ?? '', ngayX(r.ngayChon)];
    });
    xuatBaoCao({ bao: t('Thi thật'), cn: pv.branchId ? dsCn.data?.find((b) => b.id === pv.branchId)?.name ?? null : null, ct: 'ft', khoang: pv.khoang, homNay }, [
      ...(tk ? [
        { ten: t('Tổng'), coDinhCot: false, dau: dau3(t('Nhóm')), hang: tong },
        { ten: t('Không vào %'), coDinhCot: false, dau: [[t('Nhóm'), t('Em')]], hang: khac },
        { ten: t('Theo kỹ năng'), coDinhCot: false, dau: [[t('Kỹ năng'), t('HV'), ...MUC.flatMap((m) => [NHAN_MUC[m], null]), t('Điểm TB')], [null, null, ...MUC.flatMap(() => [t('Số'), '%']), null]],
          hang: KN4.map((k): OXlsx[] => { const x = tk.kyNang[k]; return [NHAN_KN[k], x.hv, ...ba(x, x.hv), x.tb == null ? '—' : { v: x.tb, dang: 'band' }]; }) },
        ...(tk.gv ? [{ ten: t('Theo GV'), dau: [[t('Giáo viên'), t('Kỹ năng'), t('HV'), ...MUC.flatMap((m) => [NHAN_MUC[m], null])], [null, null, null, ...MUC.flatMap(() => [t('Số'), '%'])]],
          hang: tk.gv.map((g): OXlsx[] => [g.ten, NHAN_KN[g.kn] ?? g.kn, g.hv, ...ba(g.so, g.hv)]) }] : []),
      ] : []),
      { ten: t('Danh sách'), dau: [[t('Học viên'), t('Lớp'), t('Ngày thi'), t('Thi lại'), 'L', 'R', 'W', 'S', 'OVR', 'Target', t('Kết quả'), t('Bước tiếp'), t('Người chọn'), t('Ngày chọn')]], hang: danhSach },
    ]);
  }

  const tk = data?.thongKe;
  /* GD-12b (⑨ C1, E2): ô Sắp thi · còn SOS — hiện tại, có cả khi kỳ đang chọn chưa có kết quả thi thật. */
  const dsCnTen = pv.branchId ? dsCn.data?.find((b) => b.id === pv.branchId)?.name ?? null : t('Tất cả chi nhánh');
  const oSapThi = data?.sapThi ? (
    <OSapThiSos so={data.sapThi} nguon={nguon}
      ngCanh={[dsCnTen, t('lịch thi {a} – {b}', { a: `T${Number(homNay.slice(5, 7))}`, b: `T${Number(data.sapThi.den.slice(5, 7))}` }), t('hiện tại')].filter(Boolean).join(' · ')} />
  ) : null;
  return (
    <>
      <VaoHangLoc o="phai">
        <NutXuat nhan={t('Xuất Excel')} tat={!rows.length} onClick={xuatExcel} />
      </VaoHangLoc>
      <div className="space-y-3">
        {error ? <Card bodyClass="p-4"><ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} /></Card>
          : loading || !data || !tk ? <Card bodyClass="p-4"><Skeleton rows={8} /></Card>
          : (
            <>
              {/* PTA rà #1681 (⑨ C1 / E2): một hàng ba cột cố định — thẻ kết quả (kỳ rỗng: câu ngắn TRONG khung) │ Không thi · Chưa có KQ │ Sắp thi · còn SOS. */}
              <div className={`grid items-stretch gap-3 ${oSapThi ? 'lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]'}`}>
                {rows.length ? <KhoiKetQua tk={tk} tongThe={tongThe} onTongThe={setTongThe} so={so} /> : (
                  <section className="flex min-w-0 flex-col gap-2 rounded-xl border px-4 pb-4 pt-3" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
                    <span className="text-[13px] font-medium text-[color:var(--text-dim)]">{t('Kết quả thi thật')}<i className="font-normal not-italic text-[color:var(--text-faint)]"> · {t('trong kỳ')}</i></span>
                    <p className="m-0 text-sm text-[color:var(--text-dim)]">{t('Chưa có kết quả thi thật nào trong {ky}', { ky: nhanKhoang(pv.khoang).chinh.replace(/ /g, ' ') })}</p>
                    <span><NutXemToanBo /></span>
                  </section>
                )}
                <DaiChiSo cot={1} ds={[
                  { ten: t('Không thi'), ky: t('trong kỳ'), gt: so(tk.tong.khongThi, 'tong:khong-thi', t('Không thi')), mau: t('không vào %') },
                  { ten: t('Chưa có KQ'), ky: t('hiện tại'), gt: data.chuaCoKq ? <OSo giaTri={data.chuaCoKq} nguon={`/tong-quan/chi-nhanh-v2/o?${query}&ct=ft&o=chua-co-kq`} tieuDe={t('Chưa có KQ')} vung="chi-so" className="text-soon" /> : <span className="font-medium text-faint">0</span>, mau: t('đã qua ngày thi') },
                ]} />
                {oSapThi}
              </div>
              {rows.length > 0 && (
                <>
              {tk.gv && !dienThoai
                ? <div className="grid items-start gap-3" style={{ gridTemplateColumns: 'minmax(0, 440px) minmax(0, 1fr)' }}><BangKyNang tk={tk} so={so} /><BangGv gv={tk.gv} so={so} /></div>
                : <><BangKyNang tk={tk} so={so} />{tk.gv && <BangGv gv={tk.gv} so={so} />}</>}
              <DanhSach rows={rows} homNay={homNay} pt={pt_} />
                </>
              )}
            </>
          )}
      </div>
    </>
  );
}

type So = (n: number, o: string, tieuDe: string, mau?: string, nhan?: string) => ReactNode;
/** ⑨ C1: hộp số trên, % mờ dưới (Từng kỹ năng · Theo GV). */
const SO_TREN_PT = 'inline-grid justify-items-center gap-0.5 [&>span:last-child]:text-xs [&>span:last-child]:tabular-nums [&>span:last-child]:text-[color:var(--text-faint)]';

/** Từng kỹ năng (C1): KN · HV · Exceed · Đạt · Fail (số + % mờ dưới) · Điểm TB — điểm kỹ năng so Target overall. */
function BangKyNang({ tk, so }: { tk: ThongKeThiThatWeb; so: So }) {
  const dienThoai = useDienThoai();
  return (
    <Card bodyClass="p-0">
      <DauThe ten={t('Từng kỹ năng')} phu={dienThoai ? undefined : t('so Target overall')}
        cachTinh={<>
          <p className="m-0">{t('Điểm kỹ năng so Target overall của HV: trên = Vượt · bằng = Đạt · dưới = Chưa đạt.')}</p>
          <p className="m-0 mt-1">{t('Thi lại một kỹ năng: chỉ kỹ năng thi lần này. KCK (gồm WL 2) không vào %.')}</p>
        </>} />
      <table className="w-full" style={{ tableLayout: 'fixed' }}>
        <colgroup><col style={{ width: dienThoai ? 40 : 66 }} /><col /><col /><col /><col /><col /></colgroup>
        <thead><tr>
          <th className="th">{dienThoai ? 'KN' : t('Kỹ năng')}</th><th className="th text-center">HV</th>
          {MUC.map((m) => <th key={m} className="th text-center">{NHAN_MUC[m]}</th>)}
          <th className="th text-center">{dienThoai ? 'TB' : t('Điểm TB')}</th>
        </tr></thead>
        <tbody>
          {KN4.map((k) => {
            const x = tk.kyNang[k];
            return (
              <tr key={k} className="[&>td]:h-12 [&>td]:py-1">
                <td className="td font-bold">{NHAN_KN[k]}</td>
                <td className="td text-center">{so(x.hv, `kn:${k}:hv`, `HV · ${NHAN_KN[k]}`)}</td>
                {MUC.map((m) => (
                  <td key={m} className="td text-center leading-tight">
                    {/* PT-b (mockup v19 khung 4a): hộp số em + % mờ cùng dòng, thẳng cột. */}
                    {/* PTA rà #1681 (⑨ C1): % mờ DƯỚI hộp số (bảng hẹp 430 px — cùng dòng thì tràn). */}
                    {x[m] > 0 ? <span className={SO_TREN_PT}>{so(x[m], `kn:${k}:${m}`, `${NHAN_MUC[m]} · ${NHAN_KN[k]}`, MAU_MUC[m])}<span>{pt(x[m], x.hv)} %</span></span>
                      : so(x[m], `kn:${k}:${m}`, `${NHAN_MUC[m]} · ${NHAN_KN[k]}`, MAU_MUC[m])}
                  </td>
                ))}
                <td className="td text-center tabular-nums">{x.tb === null ? <span className="text-faint">—</span> : fmtBand(x.tb)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

const cachTinhGv = (
  <>
    <p className="m-0">{t('Mỗi GV đếm em mình từng dạy kỹ năng đó có KQ trong kỳ, trừ KCK. Một em có thể tính cho nhiều GV.')}</p>
    <p className="m-0 mt-1">{t('Điểm kỹ năng GV dạy so Target: trên = Vượt · bằng = Đạt · dưới = Chưa đạt.')}</p>
    <p className="m-0 mt-1">{t('W1 / W2: cùng band W thi thật. GV có Chưa đạt cao trước.')}</p>
  </>
);
/** V2 (đặc tả 11): một nhóm của dòng GV — SỐ EM là chữ chính; PT-b (mockup v19 khung 4a): % mờ cùng dòng (`.cap-so`); bấm → em của nhóm (số = số dòng). */
const oPct = (g: DongGvThiWeb, m: MucThi, so: So) => {
  const o = so(g.so[m], `gv:${g.userId}:${g.kn}:${m}`, `${g.ten} · ${NHAN_KN[g.kn]} · ${NHAN_MUC[m]}`, MAU_MUC[m]);
  return g.so[m] > 0 ? <span className={SO_TREN_PT}>{o}<span>{g[m]} %</span></span> : o;
};

/**
 * Theo GV (chủ SP 24/11, mockup v24 A1 / A3-3): xếp KỸ NĂNG → GV; mỗi kỹ năng chỉ hiện 2 GV có tổng tuần dạy nhiều nhất (bằng nhau → theo thứ tự hiện có); GV còn lại
 * gập sau "+ n GV" của CHÍNH kỹ năng đó, bấm mở tại chỗ ("Thu gọn" ở cuối nhóm). Không ngưỡng, số liệu từng ô không đổi. Không cột Tuần dạy (% tuần dạy chỉ ở hộp / panel từng em).
 * Cột: Kỹ năng (≥ 640) · Giáo viên · HV · Vượt · Đạt · Chưa đạt · Điểm TB — năm cột số rộng BẰNG NHAU, số căn giữa (NH9). 375: đầu nhóm là tên kỹ năng, GV + "TB x" dưới tên.
 */
const TOI_DA_GV_KN = 2;
const nomTong = (gv: DongGvThiWeb[]) => new Set(gv.map((g) => g.userId)).size;
function useGvKn(gv: DongGvThiWeb[]) {
  const [mo, setMo] = useState<ReadonlySet<string>>(() => new Set());
  const nhom = useMemo(() => {
    const ds: { kn: string; hang: DongGvThiWeb[] }[] = [];
    for (const g of gv) { const cu = ds.find((x) => x.kn === g.kn); if (cu) cu.hang.push(g); else ds.push({ kn: g.kn, hang: [g] }); }
    const thuTu = ['l', 'r', 'w', 'w1', 'w2', 's'];   // thứ tự kỹ năng cố định (như "Từng kỹ năng"), không theo thứ tự GV
    return ds.sort((a, b) => thuTu.indexOf(a.kn) - thuTu.indexOf(b.kn)).map((n) => ({ kn: n.kn, hang: [...n.hang].sort((a, b) => b.tuan - a.tuan) }));
  }, [gv]);
  const doi = (kn: string) => setMo((m) => { const n = new Set(m); if (n.has(kn)) n.delete(kn); else n.add(kn); return n; });
  return { nhom, mo, doi };
}

function BangGv({ gv, so }: { gv: DongGvThiWeb[]; so: So }) {
  const dienThoai = useDienThoai();
  const { nhom, mo, doi } = useGvKn(gv);
  /* Cột số 5 × bằng nhau (mockup A1: 5 × 128 trong thẻ 940; A3-2: 3 × 48 + HV 48 + cột cuối 64 gồm lề phải). */
  const soCot = dienThoai ? 4 : 5;
  return (
    <Card bodyClass="p-0">
      <DauThe ten={t('Theo GV')} dem={t('{n} GV', { n: nomTong(gv) })} phu={dienThoai ? undefined : `${t('trừ KCK')} · ${t('mỗi kỹ năng {n} GV dạy nhiều tuần nhất', { n: TOI_DA_GV_KN })}`} cachTinh={cachTinhGv} />
      {!nhom.length ? <p className="m-0 p-4 text-sm text-dim">{t('Chưa có phân công kỹ năng cho HV thi trong khoảng này.')}</p> : (
        <div className="table-scroll">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>{dienThoai ? <col style={{ width: 133 }} /> : <><col style={{ width: 76 }} /><col style={{ width: 220 }} /></>}{Array.from({ length: soCot }, (_, i) => <col key={i} />)}</colgroup>
            <thead><tr>
              {!dienThoai && <th className="th">{t('Kỹ năng')}</th>}<th className="th">{t('Giáo viên')}</th><th className="th text-center">HV</th>
              {MUC.map((m) => <th key={m} className="th text-center">{NHAN_MUC[m]}</th>)}
              {!dienThoai && <th className="th text-center">{t('Điểm TB')}</th>}
            </tr></thead>
            {nhom.map((n, i) => {
              const du = mo.has(n.kn), hien = du ? n.hang : n.hang.slice(0, TOI_DA_GV_KN), an = n.hang.length - hien.length;
              return (
                <tbody key={n.kn} style={i > 0 ? { borderTop: '1px solid var(--line-strong)' } : undefined}>
                  {dienThoai && <tr><th colSpan={soCot + 1} scope="rowgroup" className="td bg-[color:var(--surface-2)] text-left text-[13px] font-bold">{NHAN_KN[n.kn]}</th></tr>}
                  {hien.map((g, j) => (
                    <tr key={g.userId} className="[&>td]:h-12 [&>td]:py-1">
                      {!dienThoai && <td className="td font-bold">{j === 0 ? NHAN_KN[n.kn] : ''}</td>}
                      <td className="td"><span className="font-semibold">{g.ten}</span>{dienThoai && <span className="block text-[13px] text-dim">TB {g.tb === null ? '—' : fmtBand(g.tb)}</span>}</td>
                      <td className="td text-center">{so(g.hv, `gv:${g.userId}:${g.kn}:hv`, `HV · ${g.ten} · ${NHAN_KN[g.kn]}`)}</td>
                      {MUC.map((m) => <td key={m} className="td text-center">{oPct(g, m, so)}</td>)}
                      {!dienThoai && <td className="td text-center tabular-nums">{g.tb === null ? '—' : fmtBand(g.tb)}</td>}
                    </tr>
                  ))}
                  {n.hang.length > TOI_DA_GV_KN && (
                    <tr><td colSpan={soCot + (dienThoai ? 1 : 2)} className="p-0">
                      <button type="button" onClick={() => doi(n.kn)} aria-expanded={du} className="link w-full border-0 bg-transparent px-4 py-2.5 text-left text-[13px] max-sm:min-h-[44px]">
                        {du ? t('Thu gọn') : t('+ {n} GV', { n: an })}</button>
                    </td></tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </Card>
  );
}

/** Danh sách kết quả thi thật (giữ như cũ: nhóm lớp, Bước tiếp chỉ đọc, phân trang). Cột L R W S · OVR · Target (C1); ô so Target; kỹ năng lấy lại mờ "↺". */
function DanhSach({ rows, homNay, pt: phan }: { rows: DongThiThat[]; homNay: string; pt: ReturnType<typeof usePhanTrang> }) {
  const dienThoai = useDienThoai();
  const hien = phan.cat(rows);
  const nhom = [...new Set(hien.map((r) => r.lop ?? ''))];
  const diem0 = (r: DongThiThat, k: KnThiThat | 'ovr') => {
    const v = k === 'ovr' ? r.ovr : r[k];
    if (v === null) return <span className="text-faint">—</span>;
    if (k !== 'ovr' && r.thiLai && !r.thiLai.includes(k.toUpperCase())) return <span className="tabular-nums text-faint" title={t('lấy từ lần thi trước')}><span aria-hidden>↺ </span><span className="sr-only">{t('lấy từ lần thi trước')} </span>{fmtBand(v)}</span>;
    const tg = targetCua(r);
    return <ODiem so={fmtBand(v)} kq={tg.kck || Number.isNaN(tg.v) ? null : soSanhDiem(v, tg.v)} nhan={k === 'ovr' ? 'OVR' : NHAN_KN[k]} />;
  };  /* TL-GV (v20): điểm kỹ năng = ô hộp → hộp Tuần dạy (GV · số tuần · %); OVR có đủ L R W S cạnh → chữ thường. */
  const diem = (r: DongThiThat, k: KnThiThat | 'ovr') => {
    if (k === 'ovr' || r[k] === null) return diem0(r, k);
    const tg = targetCua(r);
    return <OTuanDay kn={k} cycleId={r.cycleId} ten={r.ten} target={tg.kck || Number.isNaN(tg.v) ? null : tg.v} nhan={`${NHAN_KN[k]} ${fmtBand(r[k])}`}
      diem={{ l: r.l, r: r.r, w: r.w, s: r.s, ovr: r.ovr }}>{diem0(r, k)}</OTuanDay>;
  };

  const buocTiep = (r: DongThiThat) => (
    <span className={r.buocTiep ? '' : 'text-faint'}>
      {r.buocTiepChu != null ? dich(r.buocTiepChu) : t('Chưa chọn')}
      {r.buocTiepPhu && <span className="block text-xs text-faint">{r.buocTiepPhu}</span>}
    </span>
  );
  const ketQua = (r: DongThiThat) => <span className="inline-flex flex-col items-start gap-0.5">{chipMuc(r)}{r.thiLai && <span className="text-xs text-dim">{thiLai(r.thiLai)}</span>}</span>;
  const dau = (
    <DauThe ten={t('Danh sách kết quả')} dem={t('{n} HV', { n: rows.length })} phu={t('theo lớp → ngày thi')}
      cachTinh={<>
        <p className="m-0">{t('OVR so Target lúc nhập kết quả: trên = Vượt · bằng = Đạt · dưới = Chưa đạt. KCK (gồm WL 2) giữ trong danh sách, có chip; không vào % chính.')}</p>
        <p className="m-0 mt-1">{t('Bước tiếp chọn ở Sau thi (Công việc TVV / hồ sơ HV); ở đây chỉ xem.')}</p>
      </>} />
  );
  if (dienThoai) return (
    <div className="space-y-2">
      {dau}
      <div ref={phan.thanh.dauBang} />
      {hien.map((r) => (
        <div key={r.cycleId} className={THE_HV} style={nenThe}>
          <div className="flex items-center gap-2">
            <Link to={`/hoc-vien/${r.studentId}`} className={`ten-hv min-w-0 text-[14px] font-semibold ${LINK_CHU}`}>{r.ten}</Link>
            <span className="ml-auto shrink-0">{chipMuc(r)}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-dim">
            <span>{oLop(r.lop, r.classId)}</span><span>{r.khongThi ? t('Không thi') : `${t('thi')} ${ngay(r.ngayThi, homNay).slice(0, 5)}`}{r.thiLai && ` · ${thiLai(r.thiLai)}`}</span>
            <span className="tabular-nums">OVR <b className="text-[color:var(--text)]">{fmtBand(r.ovr)}</b></span><span className="tabular-nums">Target {r.target}</span>
          </div>
          {!r.khongThi && <div className="flex flex-wrap gap-x-3 text-sm font-medium">{KN4.map((k) => <span key={k} className="inline-flex items-center gap-1">{NHAN_KN[k]} {diem(r, k)}</span>)}</div>}
          <div className="text-[13px] text-dim">{t('Bước tiếp')}: {buocTiep(r)}</div>
        </div>
      ))}
      <div className="empty:hidden"><PhanTrang {...phan.thanh} duoi /></div>
    </div>
  );
  return (
    <Card bodyClass="p-0">{dau}<div ref={phan.thanh.dauBang} />
      <div className="table-scroll bang-dinh">
        <table className="w-full" style={{ tableLayout: 'fixed', minWidth: 1000 }}>
          <colgroup>
            <col style={{ width: '20%' }} /><col style={{ width: '7%' }} />
            {KN4.map((k) => <col key={k} style={{ width: '6.5%' }} />)}
            <col style={{ width: '6.5%' }} /><col style={{ width: '6.5%' }} /><col style={{ width: '17%' }} /><col style={{ width: '17%' }} />
          </colgroup>
          <thead><tr>
            <th className="th sticky-col">{t('Học viên')}</th><th className="th">{t('Ngày thi')}</th>
            {KN4.map((k) => <th key={k} className="th text-center">{NHAN_KN[k]}</th>)}
            <th className="th text-center">OVR</th><th className="th text-center">Target</th>
            <th className="th">{t('Kết quả')}</th><th className="th">{t('Bước tiếp')}</th>
          </tr></thead>
          <tbody>
            {nhom.map((lop) => {
              const ds = hien.filter((r) => (r.lop ?? '') === lop);
              const cuaLop = rows.filter((r) => (r.lop ?? '') === lop);
              return (
                <Fragment key={lop}>
                  <tr className="hang-lon"><td colSpan={10} className="px-3 py-1.5">
                    {lop && cuaLop[0]?.classId ? <Link to={`/hoc-vien/lop/${cuaLop[0].classId}`} className={LINK_CHU}>{lop}</Link> : lop || '—'} <span className="ml-1 text-[13px] font-normal text-dim">{t('{n} HV', { n: new Set(cuaLop.map((r) => r.studentId)).size })}</span>
                  </td></tr>
                  {ds.map((r) => (
                    <tr key={r.cycleId} className="row-hover [&>td]:h-11">
                      <td className="td sticky-col"><Link to={`/hoc-vien/${r.studentId}`} className={`text-[14px] font-semibold ${LINK_CHU}`}>{r.ten}</Link></td>
                      <td className="td text-dim tabular-nums">{r.khongThi ? '—' : ngay(r.ngayThi, homNay).slice(0, 5)}</td>
                      {KN4.map((k) => <td key={k} className="td text-center">{diem(r, k)}</td>)}
                      <td className="td text-center">{diem(r, 'ovr')}</td>
                      <td className="td text-center tabular-nums text-dim">{r.target}</td>
                      <td className="td">{ketQua(r)}</td>
                      <td className="td">{buocTiep(r)}</td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t px-3 empty:hidden" style={{ borderColor: 'var(--line)' }}><PhanTrang {...phan.thanh} duoi /></div>
    </Card>
  );
}

/**
 * KHỐI "KẾT QUẢ THI THẬT" (V2, đặc tả 5.2, mockup #1400 C1 / C2): hai ô công tắc (`aria-pressed`, dáng tab chọn — không gạch như ô số) + thanh
 * Vượt · Đạt · Chưa đạt theo ô đang chọn; mỗi đoạn bấm MỘT lần → panel đoạn đó (Tổng thể: `tt-<mức>`, gồm KCK). Hai % luôn hiện.
 */
type Dem3 = { vuot: number; dat: number; chua: number };
function KhoiKetQua({ tk, tongThe, onTongThe, so }: { tk: ThongKeThiThatWeb; tongThe: boolean; onTongThe: (v: boolean) => void; so: So }) {
  const dienThoai = useDienThoai();
  const tru: Dem3 = { vuot: tk.tong.exceed, dat: tk.tong.dat, chua: tk.tong.fail };
  const gom: Dem3 = { vuot: tk.tong.tongThe.exceed, dat: tk.tong.tongThe.dat, chua: tk.tong.tongThe.fail };
  const mau = (x: Dem3) => x.vuot + x.dat + x.chua;
  const o = (dang: boolean, ten: string, x: Dem3, chu: string, to: boolean, bam: () => void) => (
    <button type="button" aria-pressed={dang} onClick={bam}
      className={`grid content-start gap-0.5 rounded-xl px-3.5 pb-3 pt-2.5 text-left ${dang ? 'border-2 border-[color:var(--accent)] bg-[color:var(--accent-soft)]' : 'border border-[color:var(--line-strong)] bg-[color:var(--surface-2)] hover:border-[color:var(--o-nhap-vien)]'}`}>
      <span className={`flex items-center gap-2 text-sm font-semibold ${dang ? 'text-[color:var(--text)]' : 'text-dim'}`}>
        {ten}
        <span className={`ml-auto inline-flex h-5 items-center rounded px-2 text-xs font-semibold ${dang ? 'border border-[color:var(--accent)] text-[color:var(--accent)]' : 'border border-[color:var(--o-nhap-vien)] text-dim'}`}>
          {dang ? (dienThoai ? '✓' : t('✓ đang xem')) : (dienThoai ? '○' : t('Xem'))}
        </span>
      </span>
      <span className={`font-bold leading-tight tabular-nums ${to ? 'text-[40px] max-sm:text-[26px]' : 'text-[26px] max-sm:text-[20px]'}`}>{mau(x) ? `${pt(x.vuot + x.dat, mau(x))} %` : '—'}</span>
      <span className="text-[13px] text-dim">{mau(x) ? <><b className="font-semibold tabular-nums text-[color:var(--text)]">{x.vuot + x.dat}/{mau(x)}</b> {t('em')} · {chu}</> : t('chưa em nào có KQ')}</span>
    </button>
  );
  const x = tongThe ? gom : tru;
  const tong = mau(x);
  const doan = [
    ['vuot', 'exceed', t('Vượt'), '✓', 'border-ok-line bg-ok-bg', lopKq('vuot')],
    ['dat', 'dat', t('Đạt'), '✓', 'border-[color:var(--line-strong)] bg-[color:var(--accent-soft)]', lopKq('bang')],
    ['chua', 'fail', t('Chưa đạt'), '✗', 'border-bad-line bg-bad-bg', lopKq('duoi')],
  ] as const;
  const ky = tongThe ? t('gồm KCK') : t('trừ KCK');
  return (
    <section className="card grid gap-2.5 px-4 pb-4 pt-3">
      <div className="flex items-center gap-2 text-[13px] font-medium text-dim">
        {t('Kết quả thi thật')} <i className="not-italic text-faint">· {t('trong kỳ')}</i>
        <span className="ml-auto"><NutLuat label={t('Cách tính')} phai>{t('KCK gồm em không cam kết Target và em đã nhận WL 2. Em không có Target không tính vào %.')}</NutLuat></span>
      </div>
      <div role="group" aria-label={t('Cách tính thanh kết quả')} className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-2.5">
        {o(!tongThe, t('Đạt Target'), tru, t('trừ KCK'), true, () => onTongThe(false))}
        {o(tongThe, t('Tổng thể'), gom, t('gồm KCK'), false, () => onTongThe(true))}
      </div>
      {tong > 0 && (
        <div className="flex h-11 gap-0.5 max-sm:h-[52px]" role="group" aria-label={`${t('Vượt')} · ${t('Đạt')} · ${t('Chưa đạt')} · ${ky}`}>
          {doan.filter(([k]) => x[k] > 0).map(([k, o2, nhan, dau, nen, chu], i, arr) => (
            <span key={k} style={{ flex: `${x[k]} 1 0` }}
              className={`flex min-w-fit items-center justify-center gap-1.5 border px-2 text-sm font-semibold max-sm:flex-col max-sm:gap-0 max-sm:px-0.5 max-sm:text-xs ${nen} ${chu} ${i === 0 ? 'rounded-l-lg' : ''} ${i === arr.length - 1 ? 'rounded-r-lg' : ''}`}>
              <span className="whitespace-nowrap max-sm:order-2">{dau} {nhan}</span>
              <b className="text-[16px] max-sm:order-1">{so(x[k], tongThe ? `tong:tt-${o2}` : `tong:${o2}`, `${nhan} · ${ky}`, chu)}</b>
              <span className="text-xs font-medium tabular-nums opacity-85 max-sm:hidden">{pt(x[k], tong)} %</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
