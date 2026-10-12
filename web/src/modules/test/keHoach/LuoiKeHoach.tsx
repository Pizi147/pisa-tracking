import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Th } from '../../../ui/ui.tsx';
import { duongDotTest, duongHoSoHocVien, type KyNangKH } from '@shared/domain/index.ts';
import { OMt } from '../../../ui/OMt.tsx';
import { useNgayNghiepVu } from '../../../ui/ngayNghiepVu.ts';
import { ChipDotFT, ChipKyNang } from './ChipKyNang.tsx';
import { HopKyNang } from './HopKyNang.tsx';
import { HopKhoiPhucMt } from './HopKhoiPhucKetQua.tsx';
import {
  dotCuaEm, emXongDot, nhanDot,
  type DotChon, type HangFT, type HangThuong, type KnO, type LuoiFTData, type LuoiThuongData,
} from './kieu.ts';

type Cot = { key: string; dot: DotChon; tieu: string; phu: string | null; deXuat: string | null; nhanDeXuat: string | null };
type Hop = { anchor: HTMLElement; hang: HangFT | HangThuong; cot: Cot; kyNangDau: KyNangKH | null };

const RONG_TEN = 180;

/**
 * LƯỚI DÙNG CHUNG CHO CẢ LỚP FT VÀ LỚP THƯỜNG (mockup 14 (1), (4)): hàng = học viên, cột = đợt (FT `MT1…MT5[+]`, lớp
 * thường `Giữa khoá` · `Cuối khoá` kèm `đề xuất W4/8`). Bảng `table-layout: fixed` + `colgroup` (G-2), cuộn ngang TRONG
 * thẻ, cột tên dính trái (G-11); trên điện thoại tự cuộn tới đợt đang tới (đợt nhỏ nhất còn em chưa xong). Ô FT: chưa có đợt = `OMt` (`MT3 · chưa xếp`),
 * đã có đợt = `ChipDotFT` (chip theo nhóm kỹ năng, PR-OMT C6); ô lớp thường = `ChipKyNang`; bấm ô mở `HopKyNang` neo cạnh ô.
 */
export function LuoiKeHoach({ loai, data, onReload, onHienDien, chiCanXepLai = false }: {
  loai: 'ft' | 'thuong'; data: LuoiFTData | LuoiThuongData; onReload: () => void; onHienDien: (open: boolean) => void;
  /** PR-XLMT (chip "Cần xếp lại"): chỉ còn hàng có kỹ năng vắng / phần thi đã huỷ. */
  chiCanXepLai?: boolean;
}) {
  const [hop, setHop] = useState<Hop | null>(null);
  /** PR-OV4a: ô "Đã huỷ" đang mở hộp Khôi phục (`anchor` giữ để "Xếp MT{n} mới" mở hộp xếp đúng ô). */
  const [huy, setHuy] = useState<{ attemptId: number; anchor: HTMLElement; hang: HangFT; cot: Cot } | null>(null);
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
  const hangs = (data.hang as Array<HangFT | HangThuong>).filter((h) => !chiCanXepLai || canXepLai(h));
  const o = (h: HangFT | HangThuong, c: Cot): { attemptId: number | null; kn: KnO; lichSu?: boolean; do?: boolean; huy?: number } => dotCuaEm(
    loai === 'ft' ? { loai: 'ft', luoi: data as LuoiFTData, hang: h as HangFT } : { loai: 'thuong', luoi: data as LuoiThuongData, hang: h as HangThuong }, c.dot,
  );

  return (
    <div ref={cuon} className="overflow-x-auto">
      <table className="text-sm" style={{ tableLayout: 'fixed', width: RONG_TEN + cots.length * rongDot, minWidth: '100%' }}>
        <colgroup>
          <col style={{ width: RONG_TEN }} />
          {cots.map((c) => <col key={c.key} style={{ width: rongDot }} />)}
        </colgroup>
        <thead>
          <tr>
            <Th className="sticky-col">Học viên</Th>
            {cots.map((c) => (
              <Th key={c.key} align="center">
                <span className="block">{c.tieu}</span>
                {c.phu && <span className="block text-[11px] font-normal normal-case tracking-normal text-slate-500">{c.phu}</span>}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hangs.map((h) => (
            <tr key={h.studentId} className="row-hover">
              <td className="td sticky-col py-1.5 align-middle">
                <Link to={duongHoSoHocVien(h.studentId)} className="link block truncate text-slate-100" title={h.ten}>{h.ten}</Link>
                <div className="text-xs text-slate-500">
                  {h.ma}{'vaoMuon' in h && h.vaoMuon && <span> · vào muộn</span>}
                </div>
              </td>
              {cots.map((c) => {
                const dot = o(h, c);
                const moHop = (el: HTMLElement) => setHop({ anchor: el, hang: h, cot: c, kyNangDau: null });
                return (
                  <td key={c.key} className={`td py-1.5 align-middle ${loai === 'ft' ? 'text-center' : ''}`}>
                    {loai === 'ft' && c.dot.loai === 'ft' ? (
                      /* PR-OMT C6 (G1): đã có đợt = chip theo nhóm kỹ năng (đủ L R W S + trạng thái); chưa có đợt = Ô MT `MT3 · chưa xếp`. */
                      !homNay ? <span className="text-[11px] text-slate-500">…</span> : dot.attemptId !== null ? (
                        <ChipDotFT so={c.dot.attemptNo} kn={dot.kn} cu={!!dot.lichSu} homNay={homNay} onMo={moHop}
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
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {huy && huy.cot.dot.loai === 'ft' && (() => {
        const n = huy.cot.dot.attemptNo;
        return (
          <HopKhoiPhucMt attemptId={huy.attemptId} attemptNo={n} z="z-50" onDong={() => setHuy(null)} onXong={onReload}
            onXepMoi={n === huy.hang.soKeTiep ? () => { setHop({ anchor: huy.anchor, hang: huy.hang, cot: huy.cot, kyNangDau: null }); setHuy(null); } : undefined} />
        );
      })()}
      {hop && (() => {
        const dot = o(hop.hang, hop.cot);
        return (
          <HopKyNang key={`${hop.hang.studentId}-${hop.cot.key}`} anchor={hop.anchor}
            tieuDe={`${hop.hang.ten} · ${nhanDot(hop.cot.dot)}`} loai={loai} classId={data.classId} studentId={hop.hang.studentId}
            dot={hop.cot.dot} attemptId={dot.attemptId} kn={dot.kn} kyNangDau={hop.kyNangDau} lichSu={!!dot.lichSu}
            deXuat={hop.cot.deXuat} khaiGiang={khaiGiang} tongTuan={tongTuan}
            {...(loai === 'thuong' ? { ky: (data as LuoiThuongData).boMon, ct: (data as LuoiThuongData).chuongTrinh } : {})}
            onClose={() => setHop(null)} onSaved={onReload} onHienDien={onHienDien} />
        );
      })()}
    </div>
  );
}
