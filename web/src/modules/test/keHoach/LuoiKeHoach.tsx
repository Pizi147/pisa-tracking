import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Th } from '../../../ui/ui.tsx';
import { duongDotTest, duongHoSoHocVien, type KyNangKH } from '@shared/domain/index.ts';
import { OMt } from '../../../ui/OMt.tsx';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { fmtDateTime } from '../../../lib/format.ts';
import { ChipDotFT, ChipKyNang } from './ChipKyNang.tsx';
import { HopKyNang } from './HopKyNang.tsx';
import { HopKhoiPhucMt } from './HopKhoiPhucKetQua.tsx';
import { GhiChuTaiCho } from './GhiChuLichThi.tsx';
import { HopSEx } from './HopSEx.tsx';
import { Menu } from '../../../ui/Menu.tsx';
import { fmtBand } from '../../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';
import { MT_TOI_DA, tuanNamChu } from '@shared/domain/index.ts';
import {
  dotCuaEm, emXongDot, khoaDot, nhanDot,
  type DongSEx, type DotChon, type DotFT, type HangFT, type HangThuong, type KnO, type LuoiFTData, type LuoiThuongData,
} from './kieu.ts';

type Cot = { key: string; dot: DotChon; tieu: string; phu: string | null; deXuat: string | null; nhanDeXuat: string | null };
type Hop = { anchor: HTMLElement; hang: HangFT | HangThuong; cot: Cot; kyNangDau: KyNangKH | null };

const RONG_TEN = 180;
/** Chủ SP 22/10 (10 mục 6): cột cuối hàng HV (lớp FT) — các lượt S Ex của em theo tuần + nút "+ MT" (MT kế tiếp · S Ex). Kế hoạch Test chỉ
 *  QL / Admin thấy (`plan.week`), máy chủ kiểm lại khi ghi. */
const RONG_SEX = 168;
const HANG_GON = 10;

/**
 * LƯỚI DÙNG CHUNG CHO CẢ LỚP FT VÀ LỚP THƯỜNG (mockup 14 (1), (4)): hàng = học viên, cột = đợt (FT `MT1…MT5[+]`, lớp
 * thường `Giữa khoá` · `Cuối khoá` kèm `đề xuất W4/8`). Bảng `table-layout: fixed` + `colgroup` (G-2), cuộn ngang TRONG
 * thẻ, cột tên dính trái (G-11); trên điện thoại tự cuộn tới đợt đang tới (đợt nhỏ nhất còn em chưa xong). Ô FT: chưa có đợt = `OMt` (`MT3 · chưa xếp`),
 * đã có đợt = `ChipDotFT` (chip theo nhóm kỹ năng, PR-OMT C6); ô lớp thường = `ChipKyNang`; bấm ô mở `HopKyNang` neo cạnh ô.
 */
export function LuoiKeHoach({ loai, data, onReload, onHienDien, chiCanXepLai = false, hvChon = null }: {
  loai: 'ft' | 'thuong'; data: LuoiFTData | LuoiThuongData; onReload: () => void; onHienDien: (open: boolean) => void;
  /** OV-15c (C18): em vừa chọn ở ô tìm — cuộn tới hàng và đánh dấu hàng. */
  hvChon?: number | null;
  /** PR-XLMT (chip "Cần xếp lại"): chỉ còn hàng có kỹ năng vắng / phần thi đã huỷ. */
  chiCanXepLai?: boolean;
}) {
  const [hop, setHop] = useState<Hop | null>(null);
  /** PR-OV4a: ô "Đã huỷ" đang mở hộp Khôi phục (`anchor` giữ để "Xếp MT{n} mới" mở hộp xếp đúng ô). */
  const [huy, setHuy] = useState<{ attemptId: number; anchor: HTMLElement; hang: HangFT; cot: Cot } | null>(null);
  const [hetHang, setHetHang] = useState(false);
  const [sEx, setSEx] = useState<{ hang: HangFT; dong: DongSEx | null } | null>(null);
  const homNay = useNgayNghiepVu().homNay;
  const cuon = useRef<HTMLDivElement>(null);

  const cots: Cot[] = useMemo(() => {
    if (loai === 'ft') {
      return (data as LuoiFTData).cot.map((n) => ({
        key: `mt${n}`, dot: { loai: 'ft', attemptNo: n } as DotChon, tieu: `MT${n}`, phu: null, deXuat: null, nhanDeXuat: null,
      }));
    }
    return (data as LuoiThuongData).cot.map((c) => ({
      key: c.kind, dot: { loai: 'thuong', kind: c.kind } as DotChon, tieu: c.nhan,
      phu: c.nhanDeXuat ? `đề xuất ${c.nhanDeXuat}` : null, deXuat: c.deXuat, nhanDeXuat: c.nhanDeXuat,
    }));
  }, [loai, data]);

  const rongDot = loai === 'ft' ? 168 : 208;
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

  if (data.hang.length === 0) return <div className="p-3"><Empty title="Lớp này chưa có học viên đang học" /></div>;

  const khaiGiang = loai === 'thuong' ? (data as LuoiThuongData).khaiGiang : null;
  const tongTuan = loai === 'thuong' ? (data as LuoiThuongData).tongTuan : null;
  const canXepLai = (h: HangFT | HangThuong) => Object.values((h as HangFT).dot ?? {}).some((d) => !d.lichSu
    && Object.values(d.kn).some((o) => o?.trangThai === 'vang' || o?.trangThai === 'da-huy'));
  const tatCa = (data.hang as Array<HangFT | HangThuong>).filter((h) => !chiCanXepLai || canXepLai(h));
  /* UI-CHAM-TEST (mockup khu a): lớp dài hiện HANG_GON em đầu + "Hiện tất cả n"; đang tìm em / lọc "Cần xếp lại" thì hiện hết. */
  const hangs = hetHang || hvChon || chiCanXepLai || tatCa.length <= HANG_GON + 2 ? tatCa : tatCa.slice(0, HANG_GON);
  const o = (h: HangFT | HangThuong, c: Cot): { attemptId: number | null; kn: KnO; lichSu?: boolean; do?: boolean; huy?: number } => dotCuaEm(
    loai === 'ft' ? { loai: 'ft', luoi: data as LuoiFTData, hang: h as HangFT } : { loai: 'thuong', luoi: data as LuoiThuongData, hang: h as HangThuong }, c.dot,
  );

  return (
    <div ref={cuon} className="overflow-x-auto">
      <table className="text-sm" style={{ tableLayout: 'fixed', width: RONG_TEN + cots.length * rongDot + (loai === 'ft' ? RONG_SEX : 0), minWidth: '100%' }}>
        <colgroup>
          <col style={{ width: RONG_TEN }} />
          {cots.map((c) => <col key={c.key} style={{ width: rongDot }} />)}
          {loai === 'ft' && <col style={{ width: RONG_SEX }} />}
        </colgroup>
        <thead>
          <tr>
            <Th className="sticky-col">Học viên</Th>
            {cots.map((c) => (
              <Th key={c.key} align="center">
                <span className="block">{c.tieu}</span>
                {c.phu && <span className="block text-[12px] font-normal normal-case tracking-normal text-slate-500">{c.phu}</span>}
              </Th>
            ))}
            {loai === 'ft' && (
              <Th align="center"><span className="sr-only">{t('Lượt thêm')}</span></Th>
            )}
          </tr>
        </thead>
        <tbody>
          {hangs.map((h) => (
            <tr key={h.studentId} id={`kht-hv-${data.classId}-${h.studentId}`} className={`row-hover ${hvChon === h.studentId ? 'row-active' : ''}`}
              aria-current={hvChon === h.studentId ? 'true' : undefined}>
              <td className="td sticky-col py-1.5 align-middle">
                <Link to={duongHoSoHocVien(h.studentId)} className="link block truncate text-slate-100" title={h.ten}>{h.ten}</Link>
                <div className="text-xs text-slate-500">
                  {'vaoMuon' in h && h.vaoMuon && <span>vào muộn</span>}
                </div>
              </td>
              {cots.map((c) => {
                const dot = o(h, c);
                const moHop = (el: HTMLElement) => setHop({ anchor: el, hang: h, cot: c, kyNangDau: null });
                return (
                  <td key={c.key} className={`td py-1.5 align-middle ${loai === 'ft' ? 'text-center' : ''}`}>
                    {loai === 'ft' && c.dot.loai === 'ft' ? (
                      /* PR-OMT C6 (G1): đã có đợt = chip theo nhóm kỹ năng (đủ L R W S + trạng thái); chưa có đợt = Ô MT `MT3 · chưa xếp`. */
                      !homNay ? <span className="text-[12px] text-slate-500">…</span> : dot.attemptId !== null ? (
                        <ChipDotFT so={c.dot.attemptNo} kn={dot.kn} cu={!!dot.lichSu} homNay={homNay} onMo={moHop}
                          ovr={(dot as DotFT).ovr} kyVong={(dot as DotFT).kyVong}
                          /* "Đang chọn" = ô của em đang mở hộp. */
                          chon={hop?.hang.studentId === h.studentId && hop.cot.key === c.key} />
                      ) : dot.huy ? (
                        /* PR-OV4a: số MT chỉ có lượt đã huỷ — chữ "Đã huỷ" (không chỉ màu), viền đứt; bấm mở hộp Khôi phục. */
                        <OMt v={{ so: c.dot.attemptNo, attemptId: null, kn: {}, cu: false }} homNay={homNay} huy
                          chon={huy?.hang.studentId === h.studentId && huy.cot.key === c.key} ghiChu="Bấm để xem / khôi phục"
                          onClick={(el) => setHuy({ attemptId: dot.huy!, anchor: el, hang: h as HangFT, cot: c })} />
                      ) : (
                        <OMt v={{ so: c.dot.attemptNo, attemptId: null, kn: {}, cu: false }} homNay={homNay}
                          chon={hop?.hang.studentId === h.studentId && hop.cot.key === c.key}
                          /* Em chưa tới lượt (số MT liền mạch, K4-08): không bấm. Ô trống tới lượt: bấm mở hộp đợt mới. */
                          {...(c.dot.attemptNo !== (h as HangFT).soKeTiep
                            ? { ghiChu: `Xếp MT trước rồi mới tới ${nhanDot(c.dot)}` }
                            : { onClick: moHop, ghiChu: `Bấm để xếp ${nhanDot(c.dot)}` })} />
                      )
                    ) : (
                      /* OV-6b2: Checkpoint tự sinh theo lịch lớp — em không có Checkpoint này (vào sau) thì không có gì để xếp. */
                      /^cp\d+$/.test(c.key) && dot.attemptId === null ? <span className="text-xs text-slate-500" title="Em không có Checkpoint này">—</span> : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ChipKyNang kn={dot.kn} attemptId={dot.attemptId} ct={(data as LuoiThuongData).chuongTrinh} khaiGiang={khaiGiang} tongTuan={tongTuan}
                          deXuat={c.deXuat} nhanDeXuat={c.nhanDeXuat} tenDot={nhanDot(c.dot)}
                          onMo={(skill, el) => setHop({ anchor: el, hang: h, cot: c, kyNangDau: skill })} />
                        {/* PR-MT0 (mockup ④): ô MT0 ngay sau Final — tên môn IELTS (`ct` null); bấm mở hồ sơ Mock để dời / nhập. */}
                        {c.key === 'final' && (h as HangThuong).mt0 && homNay && (() => {
                          const m = (h as HangThuong).mt0!;
                          return <OMt v={{ so: 0, attemptId: m.attemptId, kn: m.kn, cu: false, khongDung: m.khongDung }} homNay={homNay} href={duongDotTest({ id: m.attemptId, kind: 'mt0' })} />;
                        })()}
                      </div>
                      )
                    )}
                    {/* C21: ghi chú lịch thi một dòng dưới chip — bấm sửa tại chỗ (Enter lưu · Esc huỷ). Chỉ ghi chú, không dời lịch. */}
                    <GhiChuTaiCho khoa={{ classId: data.classId, studentId: h.studentId, dot: khoaDot(c.dot) }} ghiChu={h.ghiChu?.[khoaDot(c.dot)] ?? null}
                      onDoi={onReload} nhan={t('Ghi chú lịch Test {dot}', { dot: nhanDot(c.dot) })} className="mx-auto mt-0.5 max-w-[168px]" />
                  </td>
                );
              })}
              {loai === 'ft' && (
                <td className="td py-1.5 text-center align-middle">
                  <div className="mx-auto flex max-w-[152px] flex-col gap-1">
                    {[...((h as HangFT).sEx ?? [])].sort((a, b) => a.tuan.localeCompare(b.tuan) || a.id - b.id).map((x) => (
                      /* Mockup khu a `.o-kh.ex`: khung viền đứt hồng — "S Ex" · tuần · điểm hoặc "dd/mm · người thêm". */
                      <button key={x.id} type="button" onClick={() => setSEx({ hang: h as HangFT, dong: x })}
                        className="flex w-full flex-col items-start gap-px rounded-md border border-dashed border-[var(--hong)] bg-[var(--surface)] px-2 py-1 text-left max-sm:min-h-[44px]"
                        title={[x.themBoi && t('{ai} thêm', { ai: x.themBoi }), x.nguoiCham && t('{ai} chấm', { ai: x.nguoiCham }), x.nhanXet].filter(Boolean).join('\n')}>
                        <span className="text-xs font-bold text-[var(--hong-chu)]">{t('S Ex')}</span>
                        <span className="whitespace-nowrap text-sm font-bold tabular-nums text-slate-100">{tuanNamChu(x.tuan)}</span>
                        <span className="text-xs tabular-nums text-slate-400">
                          {x.diem !== null ? <b className="text-slate-100">{fmtBand(x.diem)}</b>
                            : [x.ngay ? `${x.ngay.slice(8, 10)}/${x.ngay.slice(5, 7)}` : null, x.themBoi && t('{ai} thêm', { ai: x.themBoi })].filter(Boolean).join(' · ') || t('chờ chấm')}
                        </span>
                      </button>
                    ))}
                    <NutThemLuot hang={h as HangFT} onMt={(n, el) => setHop({ anchor: el, hang: h, cot: cotMt(n), kyNangDau: null })}
                      onSEx={() => setSEx({ hang: h as HangFT, dong: null })} />
                  </div>
                </td>
              )}
            </tr>
          ))}
          {hangs.length < tatCa.length && (
            <tr>
              <td colSpan={1 + cots.length + (loai === 'ft' ? 1 : 0)} className="td sticky-col py-2 text-[13px] text-slate-400">
                {t('+ {n} HV', { n: tatCa.length - hangs.length })} ·{' '}
                <button type="button" className="link appearance-none border-0 bg-transparent p-0 max-sm:min-h-[44px]" onClick={() => setHetHang(true)}>
                  {t('Hiện tất cả {n}', { n: tatCa.length })}
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* C21: ghi chú cả lớp dưới bảng, ghi rõ "Ghi chú lớp". */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t px-3 py-2 text-xs" style={{ borderColor: 'var(--line)' }}>
        {data.ghiChuLop && <b className="text-slate-300">{t('Ghi chú lớp · {lop}', { lop: data.classCode })}</b>}
        <div className="min-w-0 flex-1">
          <GhiChuTaiCho khoa={{ classId: data.classId }} ghiChu={data.ghiChuLop ?? null} onDoi={onReload}
            nhan={t('Ghi chú lớp · {lop}', { lop: data.classCode })} them={t('+ Ghi chú lớp')} />
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
            tieuDe={`${hop.hang.ten} · ${nhanDot(hop.cot.dot)}`} tenHv={hop.hang.ten} ghiChu={hop.hang.ghiChu?.[khoaDot(hop.cot.dot)] ?? null} loai={loai} classId={data.classId} studentId={hop.hang.studentId}
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
    <span ref={neo} className="self-center">
      <Menu label={t('+ MT')} align="right" className="btn btn-sm min-h-[32px] border-dashed sm:min-h-0" items={[
        ...(hang.soKeTiep <= MT_TOI_DA ? [{ label: t('MT{n} · MT thường', { n: hang.soKeTiep }), onClick: () => onMt(hang.soKeTiep, neo.current!) }] : []),
        { label: t('S Ex · Speaking với chuyên gia'), onClick: onSEx },
      ]} />
    </span>
  );
}
