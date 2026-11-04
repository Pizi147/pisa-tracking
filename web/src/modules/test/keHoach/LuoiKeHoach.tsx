import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty } from '../../../ui/ui.tsx';
import { duongDotTest, duongHoSoHocVien, type KyNangKH } from '@shared/domain/index.ts';
import { OMt } from '../../../ui/OMt.tsx';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { fmtDateTime } from '../../../lib/format.ts';
import { NutXepO, ODotGon, OHuy, OTrong } from './ChipKyNang.tsx';
import { HopKyNang } from './HopKyNang.tsx';
import { HopKhoiPhucMt } from './HopKhoiPhucKetQua.tsx';
import { GhiChuTaiCho } from './GhiChuLichThi.tsx';
import { HopSEx } from './HopSEx.tsx';
import { Menu } from '../../../ui/Menu.tsx';
import { ODiem } from '../../../ui/ODiem.tsx';
import { useDienThoai } from '../../../ui/TheDong.tsx';
import { kqOverall } from '../../students/GocLichThi.tsx';
import { fmtBand } from '../../../lib/format.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { MT_TOI_DA, oGon, tuanLich } from '@shared/domain/index.ts';
import {
  dotCuaEm, emXongDot, khoaBaiThuong, khoaDot, nhanDot,
  type DongSEx, type DotChon, type DotFT, type HangFT, type HangThuong, type KnO, type LuoiFTData, type LuoiThuongData,
} from './kieu.ts';

type Cot = { key: string; dot: DotChon; tieu: string; phu: string | null; deXuat: string | null; nhanDeXuat: string | null };
type Hop = { anchor: HTMLElement; hang: HangFT | HangThuong; cot: Cot; kyNangDau: KyNangKH | null };

/** Cột tên: 220 (mockup V11 U05), điện thoại 120 — tên dài xuống dòng, không cắt. */
const RONG_TEN = typeof window !== 'undefined' && window.innerWidth < 640 ? 120 : 220;
/** Chủ SP 22/10 (10 mục 6): cột cuối hàng HV (lớp FT) — các lượt S Ex của em theo tuần + nút "+ MT" (MT kế tiếp · S Ex). Kế hoạch Test chỉ
 *  QL / Admin thấy (`plan.week`), máy chủ kiểm lại khi ghi. */
const RONG_SEX = 110;
const HANG_GON = 10;

/**
 * LƯỚI DÙNG CHUNG CHO CẢ LỚP FT VÀ LỚP THƯỜNG (mockup 14 (1), (4)): hàng = học viên, cột = đợt (FT `MT1…MT5[+]`, lớp
 * thường `Giữa khoá` · `Cuối khoá` kèm `đề xuất W4/8`). Bảng `table-layout: fixed` + `colgroup` (G-2), cuộn ngang TRONG
 * thẻ, cột tên dính trái (G-11); trên điện thoại tự cuộn tới đợt đang tới (đợt nhỏ nhất còn em chưa xong). Ô FT: chưa có đợt = `OMt` (`MT3 · chưa xếp`),
 * đã có đợt = `ChipDotFT` (chip theo nhóm kỹ năng, PR-OMT C6); ô lớp thường = `ChipKyNang`; bấm ô mở `HopKyNang` neo cạnh ô.
 */
export function LuoiKeHoach({ loai, data, onReload, onHienDien, chiChuaCoKe = false, hvChon = null }: {
  loai: 'ft' | 'thuong'; data: LuoiFTData | LuoiThuongData; onReload: () => void; onHienDien: (open: boolean) => void;
  /** OV-15c (C18): em vừa chọn ở ô tìm — cuộn tới hàng và đánh dấu hàng. */
  hvChon?: number | null;
  /** U05 (G5, chip "Chưa có MT kế tiếp"): chỉ còn em chưa có lượt MT nào đang chờ và còn ô "Xếp MTn". */
  chiChuaCoKe?: boolean;
}) {
  const [hop, setHop] = useState<Hop | null>(null);
  /** PR-OV4a: ô "Đã huỷ" đang mở hộp Khôi phục (`anchor` giữ để "Xếp MT{n} mới" mở hộp xếp đúng ô). */
  const [huy, setHuy] = useState<{ attemptId: number; anchor: HTMLElement; hang: HangFT; cot: Cot } | null>(null);
  const [hetHang, setHetHang] = useState(false);
  const [sEx, setSEx] = useState<{ hang: HangFT; dong: DongSEx | null } | null>(null);
  const homNay = useNgayNghiepVu().homNay;
  const dienThoai = useDienThoai();
  /* Chủ SP 28/10: lớp GV dạy mà không xếp được — chỉ xem: ô mở trang lượt (đổi trang), không hộp xếp / + MT / sửa ghi chú. */
  const chiXem = !!data.chiXem;
  const cuon = useRef<HTMLDivElement>(null);

  const cots: Cot[] = useMemo(() => {
    if (loai === 'ft') {
      return (data as LuoiFTData).cot.map((n) => ({
        key: `mt${n}`, dot: { loai: 'ft', attemptNo: n } as DotChon, tieu: `MT${n}`, phu: null, deXuat: null, nhanDeXuat: null,
      }));
    }
    return (data as LuoiThuongData).cot.map((c) => ({
      key: c.kind, dot: { loai: 'thuong', kind: c.kind } as DotChon, tieu: c.nhan,
      phu: c.nhanDeXuat ? t('đề xuất {tuanDeXuat}', { tuanDeXuat: dich(c.nhanDeXuat) }) : null, deXuat: c.deXuat, nhanDeXuat: c.nhanDeXuat,
    }));
  }, [loai, data]);

  const rongDot = loai === 'ft' ? 190 : 220;   // mockup V11: ô MT 190; lớp thường thêm W4/8 ở dòng trạng thái   // lớp thường: tuần + W4/8 + chữ trạng thái một dòng
  const dotDenLuot = useMemo(() => cots.findIndex((c) => (data.hang as Array<HangFT | HangThuong>).some((h) => (
    !emXongDot(dotCuaEm(loai === 'ft' ? { loai: 'ft', luoi: data as LuoiFTData, hang: h as HangFT } : { loai: 'thuong', luoi: data as LuoiThuongData, hang: h as HangThuong }, c.dot))
  ))), [cots, data, loai]);

  /* C18: chọn em ở ô tìm → cuộn tới hàng em (giữa màn). */
  useEffect(() => {
    if (!hvChon) return;
    document.getElementById(`kht-hv-${data.classId}-${hvChon}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [hvChon, data.classId]);

  /* 375px: mở sẵn ở đợt đang tới — MT trước đó nằm bên trái ngoài khung nhìn. */
  useEffect(() => {
    const el = cuon.current;
    if (!el || window.innerWidth >= 640 || dotDenLuot <= 0) return;
    el.scrollLeft = dotDenLuot * rongDot;
  }, [dotDenLuot, rongDot]);

  if (data.hang.length === 0) return <div className="p-3"><Empty title={t('Lớp này chưa có học viên đang học')} /></div>;

  const khaiGiang = loai === 'thuong' ? (data as LuoiThuongData).khaiGiang : null;
  const tongTuan = loai === 'thuong' ? (data as LuoiThuongData).tongTuan : null;
  const canXepLai = (h: HangFT | HangThuong) => Object.values((h as HangFT).dot ?? {}).some((d) => !d.lichSu
    && Object.values(d.kn).some((o) => o?.trangThai === 'vang' || (o?.trangThai === 'da-huy' && !o.huyVang)));   // N38 L2: huỷ vắng 2 lần = đã xong
  const chuaXepKeTiep = (h: HangFT | HangThuong) => loai === 'ft' && (data as LuoiFTData).cot.includes((h as HangFT).soKeTiep)
    && !(h as HangFT).dot[(h as HangFT).soKeTiep]?.attemptId && !(h as HangFT).dot[(h as HangFT).soKeTiep]?.huy;
  /* "Chưa có MT kế tiếp" (G5): em không còn lượt MT nào đang chờ (có lịch, chưa xong) — ô "Xếp MTn" của em viền nhấn đậm. */
  const khongConLuot = (h: HangFT | HangThuong) => loai === 'ft' && !Object.values((h as HangFT).dot).some((d) => d.attemptId !== null && !d.lichSu && !emXongDot(d));
  const tatCa = (data.hang as Array<HangFT | HangThuong>).filter((h) => !chiChuaCoKe || (chuaXepKeTiep(h) && khongConLuot(h)));
  /* UI-CHAM-TEST (mockup khu a): lớp dài hiện HANG_GON em đầu + "Hiện tất cả n"; đang tìm em / lọc "Cần xếp lại" thì hiện hết. */
  /* KHT-GON (critique): lớp dài thu gọn vẫn hiện MỌI em cần chú ý (cần xếp lại, trễ chấm, MT kế tiếp chưa xếp trong cột đang vẽ) —
     không em nào bị khuất sau "Hiện tất cả". */
  const canChuY = (h: HangFT | HangThuong) => canXepLai(h) || chuaXepKeTiep(h) || (!!homNay && Object.values((h as HangFT).dot ?? {})
    .some((d) => oGon(d.kn, homNay)?.tt?.loai === 'tre'));
  const hangs = hetHang || hvChon || chiChuaCoKe || tatCa.length <= HANG_GON + 2 ? tatCa
    : tatCa.filter((h, i) => i < HANG_GON || canChuY(h));
  const o = (h: HangFT | HangThuong, c: Cot): { attemptId: number | null; kn: KnO; lichSu?: boolean; do?: boolean; huy?: number } => dotCuaEm(
    loai === 'ft' ? { loai: 'ft', luoi: data as LuoiFTData, hang: h as HangFT } : { loai: 'thuong', luoi: data as LuoiThuongData, hang: h as HangThuong }, c.dot,
  );

  /* U05 khu E (375, lớp FT): mỗi em một thẻ — tên · lượt gần nhất "✗ 6.0 · W2 OCT" · việc kế ("Xếp MTn" hoặc ô MT cùng dạng 1440). Ma trận đủ từ 640. */
  if (dienThoai && loai === 'ft' && homNay) {
    const ft = data as LuoiFTData;
    return (
      <div>
        {hangs.map((h0) => {
          const h = h0 as HangFT;
          const daXong = ft.cot.map((n) => ({ n, d: h.dot[n] })).filter((x) => x.d?.attemptId != null && x.d.ovr !== undefined && emXongDot(x.d));
          const gan = daXong[daXong.length - 1];
          const ganTuan = gan ? Object.values(gan.d!.kn).map((x) => x?.tuan).filter((w): w is string => !!w).sort().pop() : null;
          const tiep = ft.cot.find((n) => h.dot[n]?.attemptId != null && !h.dot[n]!.lichSu && !emXongDot(h.dot[n]!));
          const c = tiep != null ? cotMt(tiep) : null;
          const g = tiep != null ? oGon(h.dot[tiep]!.kn, homNay) : null;
          const moHop = (el: HTMLElement, cot: Cot) => setHop({ anchor: el, hang: h, cot, kyNangDau: null });
          return (
            <div key={h.studentId} id={`kht-hv-${data.classId}-${h.studentId}`} className="the-em">
              <div className="the-em-1"><Link to={duongHoSoHocVien(h.studentId)} className="ten-ho-so">{h.ten}</Link></div>
              {gan && (
                <div className="the-em-2">
                  {t('Gần nhất')} <ODiem so={fmtBand(gan.d!.ovr!)} kq={gan.d!.kyVong == null ? null : kqOverall(gan.d!.ovr!, gan.d!.kyVong)} nhan={`MT${gan.n}`} />
                  {ganTuan && <span className="tabular-nums">· {tuanLich(ganTuan)}</span>}
                </div>
              )}
              <div className="the-em-3">
                {c && g ? (
                  <ODotGon o={g} kn={h.dot[tiep!]!.kn} nhan={nhanDot(c.dot)} onMo={chiXem ? () => {} : (el) => moHop(el, c)}
                    href={chiXem && h.dot[tiep!]!.attemptId ? duongDotTest({ id: h.dot[tiep!]!.attemptId!, kind: 'mock', classId: data.classId, studentId: h.studentId }) : null} />
                ) : chuaXepKeTiep(h) && !chiXem ? (
                  <NutXepO chu={t('Xếp MT{n}', { n: h.soKeTiep })} ke={khongConLuot(h)} onMo={(el) => moHop(el, cotMt(h.soKeTiep))} />
                ) : null}
              </div>
            </div>
          );
        })}
        {hangs.length < tatCa.length && (
          <div className="border-t px-3 py-2 text-[13px] text-dim" style={{ borderColor: 'var(--line)' }}>
            {t('+ {n} HV', { n: tatCa.length - hangs.length })} ·{' '}
            <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0" onClick={() => setHetHang(true)}>{t('Hiện tất cả {n}', { n: tatCa.length })}</button>
          </div>
        )}
        {hop && (() => {
          const dot = o(hop.hang, hop.cot);
          return (
            <HopKyNang key={`${hop.hang.studentId}-${hop.cot.key}`} anchor={hop.anchor}
              tieuDe={`${nhanDot(hop.cot.dot)} · ${hop.hang.ten}`} tenHv={hop.hang.ten} maLop={data.classCode} ghiChu={hop.hang.ghiChu?.[khoaDot(hop.cot.dot)] ?? null} loai={loai} classId={data.classId} studentId={hop.hang.studentId}
              dot={hop.cot.dot} attemptId={dot.attemptId} kn={dot.kn} kyNangDau={hop.kyNangDau} lichSu={!!dot.lichSu}
              deXuat={hop.cot.deXuat} khaiGiang={khaiGiang} tongTuan={tongTuan}
              onClose={() => setHop(null)} onSaved={onReload} onHienDien={onHienDien} />
          );
        })()}
      </div>
    );
  }

  return (
    <div ref={cuon} className="overflow-x-auto">
      {/* Cột đợt rộng CỐ ĐỊNH (mockup PR 659) — cột "+ MT" / S Ex ngay SAU cột đợt cuối (RA-UI-1, mockup `v7/ke-hoach-test.html`), phần dư dồn vào cột trống cuối hàng. */}
      <table className="text-sm" style={{ tableLayout: 'fixed', width: '100%', minWidth: RONG_TEN + cots.length * rongDot + (loai === 'ft' && !chiXem ? RONG_SEX : 0) }}>
        <colgroup>
          <col style={{ width: RONG_TEN }} />
          {cots.map((c) => <col key={c.key} style={{ width: rongDot }} />)}
          {loai === 'ft' && !chiXem && <col style={{ width: RONG_SEX }} />}
          <col />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="kh-th sticky-col">{t('Học viên')}</th>
            {cots.map((c) => (
              <th key={c.key} scope="col" className="kh-th">
                <span className="block">{c.tieu}</span>
                {c.phu && <span className="block text-xs font-normal text-faint">{c.phu}</span>}
              </th>
            ))}
            {/* B23 (mockup V11): cột "+ MT ▾" có tiêu đề nhìn thấy "Thêm". */}
            {loai === 'ft' && !chiXem && <th scope="col" className="kh-th">{t('Thêm')}</th>}
            <th className="kh-th" aria-hidden></th>
          </tr>
        </thead>
        <tbody>
          {hangs.map((h) => (
            <tr key={h.studentId} id={`kht-hv-${data.classId}-${h.studentId}`} className={`kh-hang ${hvChon === h.studentId ? 'row-active' : ''}`}
              aria-current={hvChon === h.studentId ? 'true' : undefined}>
              {/* Q-d (chủ SP 03/11): bỏ "vào muộn" — lượt không áp dụng đã là "—" trong ô. Tên đủ, xuống dòng (ý 7). */}
              <td className="kh-td sticky-col">
                <Link to={duongHoSoHocVien(h.studentId)} className="ten-ho-so">{h.ten}</Link>
              </td>
              {cots.map((c) => {
                const dot = o(h, c);
                /* GV chỉ xem: ô là link tới trang lượt (đổi trang) — Ctrl / chuột giữa mở tab mới. */
                const trangLuot = chiXem && dot.attemptId !== null ? duongDotTest({ id: dot.attemptId, kind: c.dot.loai === 'ft' ? 'mock' : khoaBaiThuong(c.dot.kind), classId: data.classId, studentId: h.studentId }) : null;
                const moHop = (el: HTMLElement) => setHop({ anchor: el, hang: h, cot: c, kyNangDau: null });
                return (
                  <td key={c.key} className="kh-td">
                    {!homNay ? <span className="block px-2 text-xs text-faint">…</span> : dot.attemptId !== null ? (() => {
                      /* KHT-GON (mockup #659): ô = tuần + kết quả / một chữ; ô kỹ năng, dòng riêng, dòng vắng chỉ khi cần (`oGon`). */
                      const ct = loai === 'thuong' ? (data as LuoiThuongData).chuongTrinh : null;
                      const g = oGon(dot.kn, homNay, ct);
                      if (!g) return <OTrong title={t('Đợt này không có kỹ năng nào')} />;
                      const d = dot as DotFT;
                      const kq = loai === 'ft' && d.ovr !== undefined ? { ovr: d.ovr, dat: d.kyVong == null ? null : d.ovr >= d.kyVong, kyVong: d.kyVong ?? null } : null;
                      const tuanChinh = Object.values(dot.kn).map((x) => x?.tuan).filter((w): w is string => !!w).sort()[0] ?? null;
                      return (
                        <ODotGon o={g} kn={dot.kn} ct={ct} nhan={nhanDot(c.dot)} ketQua={kq} onMo={moHop} href={trangLuot}
                          khoa={loai === 'thuong' ? { khaiGiang, tongTuan, tuan: tuanChinh } : null}
                          chon={hop?.hang.studentId === h.studentId && hop.cot.key === c.key} />
                      );
                    })() : loai === 'ft' && c.dot.loai === 'ft' ? (
                      dot.huy ? (
                        /* PR-OV4a: số MT chỉ có lượt đã huỷ — "đã huỷ"; bấm mở hộp Khôi phục (QL). */
                        <OHuy onMo={chiXem ? undefined : (el) => setHuy({ attemptId: dot.huy!, anchor: el, hang: h as HangFT, cot: c })} />
                      ) : c.dot.attemptNo === (h as HangFT).soKeTiep ? (
                        /* K4-08: chỉ MT kế tiếp có "Xếp MTn"; MT sau nữa "–" (mockup #659). GV chỉ xem: chữ mờ "chưa xếp". */
                        <NutXepO chu={t('Xếp MT{n}', { n: c.dot.attemptNo })} title={t('Bấm để xếp {maDot}', { maDot: nhanDot(c.dot) })} ke={khongConLuot(h)} onMo={chiXem ? undefined : moHop} />
                      ) : <OTrong title={t('Xếp MT trước rồi mới tới {maDot}', { maDot: nhanDot(c.dot) })} />
                    ) : /^cp\d+$/.test(c.key) ? (
                      /* OV-6b2: Checkpoint tự sinh theo lịch lớp — em không có Checkpoint này (vào sau) thì không có gì để xếp. */
                      <OTrong title={t('Em không có Checkpoint này')} />
                    ) : (
                      /* Lớp thường chưa có bài: nút viền đứt "Xếp {tuần đề xuất}" — "đề xuất" ở tooltip. */
                      <NutXepO chu={c.deXuat ? t('Xếp {tuan}', { tuan: tuanLich(c.deXuat) }) : t('chưa xếp')}
                        title={t('Xếp {maDot} cho em này', { maDot: nhanDot(c.dot) }) + (c.deXuat ? t(' · đề xuất {tuan}', { tuan: tuanLich(c.deXuat) }) + (c.nhanDeXuat ? ` (${dich(c.nhanDeXuat)})` : '') : '')}
                        onMo={chiXem ? undefined : moHop} />
                    )}
                    {/* PR-MT0 (mockup ④): ô MT0 ngay sau Final — bấm mở hồ sơ Mock để dời / nhập. */}
                    {c.key === 'final' && (h as HangThuong).mt0 && homNay && (() => {
                      const m = (h as HangThuong).mt0!;
                      return <div className="px-2 pb-1"><OMt v={{ so: 0, attemptId: m.attemptId, kn: m.kn, cu: false, khongDung: m.khongDung }} homNay={homNay} href={duongDotTest({ id: m.attemptId, kind: 'mt0' })} /></div>;
                    })()}
                    {/* C21: ghi chú lịch thi một dòng dưới chip — bấm sửa tại chỗ (Enter lưu · Esc huỷ). Chỉ ghi chú, không dời lịch. */}
                    <GhiChuTaiCho khoa={{ classId: data.classId, studentId: h.studentId, dot: khoaDot(c.dot) }} ghiChu={h.ghiChu?.[khoaDot(c.dot)] ?? null}
                      onDoi={onReload} nhan={t('Ghi chú lịch Test {dot}', { dot: nhanDot(c.dot) })} className="px-2 pb-1" chiDoc={chiXem} />
                  </td>
                );
              })}
              {loai === 'ft' && !chiXem && (
                <td className="kh-td">
                  <div className="flex flex-col items-start gap-1">
                    {[...((h as HangFT).sEx ?? [])].sort((a, b) => a.tuan.localeCompare(b.tuan) || a.id - b.id).map((x) => (
                      /* Mockup #659: một dòng khung đứt hồng — "S Ex" · tuần · điểm (chưa chấm: ngày · người thêm ở tooltip). */
                      <button key={x.id} type="button" onClick={() => setSEx({ hang: h as HangFT, dong: x })}
                        className="inline-flex h-[26px] items-baseline gap-1.5 self-start whitespace-nowrap rounded-md border border-dashed border-[var(--hong)] bg-transparent px-2 pt-[4px] text-xs text-slate-100 max-sm:min-h-[44px]"
                        title={[x.ngay && `${x.ngay.slice(8, 10)}/${x.ngay.slice(5, 7)}`, x.themBoi && t('{ai} thêm', { ai: x.themBoi }), x.nguoiCham && t('{ai} chấm', { ai: x.nguoiCham }), x.nhanXet].filter(Boolean).join('\n')}>
                        <b className="font-semibold text-[var(--hong-chu)]">{t('S Ex')}</b>
                        <span className="tabular-nums">{tuanLich(x.tuan)} · {x.diem !== null ? fmtBand(x.diem) : t('chờ chấm')}</span>
                      </button>
                    ))}
                    <NutThemLuot hang={h as HangFT} onMt={(n, el) => setHop({ anchor: el, hang: h, cot: cotMt(n), kyNangDau: null })}
                      onSEx={() => setSEx({ hang: h as HangFT, dong: null })} />
                  </div>
                </td>
              )}
              <td className="kh-td" aria-hidden />
            </tr>
          ))}
        </tbody>
      </table>
      {/* Chân lớp MỘT hàng (mockup #659): "+ n HV · Hiện tất cả" trái · ghi chú lớp (C21) phải. */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t px-3 py-2 text-xs" style={{ borderColor: 'var(--line)' }}>
        {hangs.length < tatCa.length && (
          <span className="text-[13px] text-slate-400">
            {t('+ {n} HV', { n: tatCa.length - hangs.length })} ·{' '}
            <button type="button" className="link appearance-none border-0 bg-transparent p-0 max-sm:min-h-[44px]" onClick={() => setHetHang(true)}>
              {t('Hiện tất cả {n}', { n: tatCa.length })}
            </button>
          </span>
        )}
        {data.ghiChuLop && <b className="text-slate-300">{t('Ghi chú lớp · {lop}', { lop: data.classCode })}</b>}
        <div className="min-w-0 sm:order-first">   {/* mockup V11 `.hang-cuoi`: "+ Ghi chú lớp" sát trái */}
          <GhiChuTaiCho khoa={{ classId: data.classId }} ghiChu={data.ghiChuLop ?? null} onDoi={onReload}
            nhan={t('Ghi chú lớp · {lop}', { lop: data.classCode })} them={t('+ Ghi chú lớp')} chiDoc={chiXem} />
        </div>
        {data.ghiChuLop && <span className="text-[12px] text-slate-500">{[data.ghiChuLop.ai, fmtDateTime(data.ghiChuLop.luc)].filter(Boolean).join(' · ')}</span>}
      </div>

      {huy && huy.cot.dot.loai === 'ft' && (() => {
        const n = huy.cot.dot.attemptNo;
        return (
          <HopKhoiPhucMt attemptId={huy.attemptId} attemptNo={n} z="z-50" onDong={() => setHuy(null)} onXong={onReload}
            onXepMoi={n === huy.hang.soKeTiep ? () => { setHop({ anchor: huy.anchor, hang: huy.hang, cot: huy.cot, kyNangDau: null }); setHuy(null); } : undefined} />
        );
      })()}
      {sEx && <HopSEx studentId={sEx.hang.studentId} ten={sEx.hang.ten} dong={sEx.dong} onDong={() => setSEx(null)} onXong={onReload} />}
      {hop && (() => {
        const dot = o(hop.hang, hop.cot);
        return (
          <HopKyNang key={`${hop.hang.studentId}-${hop.cot.key}`} anchor={hop.anchor}
            tieuDe={`${nhanDot(hop.cot.dot)} · ${hop.hang.ten}`} tenHv={hop.hang.ten} maLop={data.classCode} ghiChu={hop.hang.ghiChu?.[khoaDot(hop.cot.dot)] ?? null} loai={loai} classId={data.classId} studentId={hop.hang.studentId}
            dot={hop.cot.dot} attemptId={dot.attemptId} kn={dot.kn} kyNangDau={hop.kyNangDau} lichSu={!!dot.lichSu}
            deXuat={hop.cot.deXuat} khaiGiang={khaiGiang} tongTuan={tongTuan}
            {...(loai === 'thuong' ? { ky: (data as LuoiThuongData).boMon, ct: (data as LuoiThuongData).chuongTrinh } : {})}
            onClose={() => setHop(null)} onSaved={onReload} onHienDien={onHienDien} />
        );
      })()}
    </div>
  );
}


/** Cột ảo của MT số `n` (MT kế tiếp có thể vượt số cột đang vẽ — hộp xếp đợt mới vẫn mở được). */
const cotMt = (n: number): Cot => ({ key: `mt${n}`, dot: { loai: 'ft', attemptNo: n }, tieu: `MT${n}`, phu: null, deXuat: null, nhanDeXuat: null });

/**
 * "+ MT" cuối hàng HV (chủ SP 22/10, 10 mục 6): chọn loại — MT kế tiếp (hộp xếp đợt sẵn có `HopKyNang`, đường "Tạo MT" của Kế hoạch Test) · S Ex
 * (`HopSEx`, `/s-expert`). MT vượt MT_TOI_DA thì chỉ còn S Ex. Neo hộp xếp đợt vào chính nút.
 */
function NutThemLuot({ hang, onMt, onSEx }: { hang: HangFT; onMt: (n: number, el: HTMLElement) => void; onSEx: () => void }) {
  const neo = useRef<HTMLSpanElement>(null);
  return (
    <span ref={neo} className="self-start">
      <Menu label={t('+ MT')} align="right" className="nut-them" items={[
        ...(hang.soKeTiep <= MT_TOI_DA ? [{ label: t('MT{n} · MT thường', { n: hang.soKeTiep }), onClick: () => onMt(hang.soKeTiep, neo.current!) }] : []),
        { label: t('S Ex · Speaking với chuyên gia'), onClick: onSEx },
      ]} />
    </span>
  );
}
