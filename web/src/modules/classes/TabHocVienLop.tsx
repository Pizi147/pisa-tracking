import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BoLocDoan, Level } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useApi } from '../../lib/useApi.ts';
import { NoiDungThongTinLop } from './ThongTinLopPanel.tsx';
import { BangHoSoLop } from './BangHoSoLop.tsx';
import { BangDiemLopThuong } from './BangDiemLopThuong.tsx';
import { BangCanHoTro } from './BangCanHoTro.tsx';
import { BangKqdrLopFt } from './BangKqdrLopFt.tsx';
import { ThanhChonNhieu, useChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { XemTruocHangLoatPanel } from '../students/XemTruocHangLoatPanel.tsx';
import { HopTamDungKetThuc } from '../students/HopTamDungKetThuc.tsx';
import { ChuyenLopNhieuEm } from '../students/ChuyenLopPanel.tsx';
import type { HoSoLop } from './DauTrangLop.tsx';
import type { QuyenDong } from './thaoTacDongHocVien.tsx';
import { PERMISSIONS, vaiXemHocVien, type ViecHangLoat } from '@shared/domain/index.ts';
import { useSession } from '../../lib/session.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * TAB HỌC VIÊN CỦA HỒ SƠ LỚP (đặc tả §3.7): hai chế độ.
 *   Tổng hợp   (PR-OV3a: tên mới của "Điểm"; khoá URL vẫn `diem`) FT: bảng đợt MT như hiện có · lớp thường: Progress | Final × L R W S,
 *              ô đúng/tổng (10b phương án A) + cột Lộ trình tiếp theo (hướng Quản lý đã chốt)
 *   (P9b: "Lộ trình tiếp theo" thành trang con Cuối khoá `?xem=cuoi-khoa` của hồ sơ lớp — `?che-do=lo-trinh` cũ chuyển sang đó.)
 *   (Góp ý hàng tuần OV-12g gỡ 24/10 — chủ SP; link cũ `?che-do=gop-y` mở Tổng hợp; dữ liệu cũ: ⋯ › Lịch sử góp ý tuần.)
 *   Cần hỗ trợ học viên có Case mở: vấn đề chính · PA đang chạy · bước tiếp theo + hạn (mockup 06, cho GVCN họp nhanh)
 *   Kết quả đầu ra (OV-3c, lớp FT; `?che-do=ket-qua`) KQĐR lớp trước của em vào từ FOU/BE/ELE, chỉ khi còn đợt trong 4 tuần (`dai.kqdrDot`);
 *              hết đợt mà mở URL cũ → cách xem mặc định
 * PR-LUI-b (06/10): Quản lý / Quản trị có nút "Chọn nhiều học viên" ở cách xem Tổng hợp — ô chọn hiện ngay trên danh sách, thanh thao tác dính đáy
 * (Lưu trữ · Kết thúc học · Huỷ chuyển lớp · Bỏ chọn), bấm một việc ra panel xem trước rồi xác nhận.
 */
export type CheDoHocVien = 'diem' | 'can-ho-tro' | 'ket-qua' | 'thong-tin';
/** Tên cách xem — cũng là chi tiết của nút "‹ Hồ sơ lớp …" khi đi từ hồ sơ lớp sang hồ sơ khác (PR-OV5b). */
export const CHE_DO_NHAN: Record<CheDoHocVien, string> = {
  diem: t('Tổng hợp'), 'can-ho-tro': t('Cần hỗ trợ'), 'ket-qua': t('Kết quả đầu ra'), 'thong-tin': t('Thông tin lớp'),
};
export function TabHocVienLop({ lop, cheDo: cheDoUrl, moChon, onCheDo, onDoi, onThemHocVien }: {
  lop: HoSoLop; cheDo: CheDoHocVien; moChon?: boolean; onCheDo: (m: CheDoHocVien) => void;
  onDoi: () => void; onThemHocVien: () => void;
}) {
  /* OV-6b2: lớp liên tục (PET, KET…) — không cách xem Lộ trình tiếp theo. */
  const thuong = lop.programme?.scoringMode === 'ratio';
  const soDot = lop.dai?.kqdrDot ?? 0;
  const { can, session } = useSession();
  /*
   * OV-10b (mockup vai mục 2, 6): TVV / CX — Tổng hợp (cột Phụ huynh thay Theo dõi) · Lộ trình tiếp theo / KQĐR đã chốt · Cần hỗ trợ (đọc) · Thông tin
   * lớp (đọc); Admin — Tổng hợp · Thông tin lớp. QL / GV không đổi.
   */
  const vai = vaiXemHocVien(session?.roles);
  const cacCheDo: CheDoHocVien[] = [
    'diem', ...(vai !== 'admin' ? ['can-ho-tro' as const] : []),
    ...(soDot && vai !== 'admin' ? ['ket-qua' as const] : []), ...(vai ? ['thong-tin' as const] : []),
  ];
  const cheDo: CheDoHocVien = cacCheDo.includes(cheDoUrl) ? cheDoUrl : 'diem';
  const quyen: QuyenDong = {
    coTheSuaHocVien: !!lop.viewer.coTheSuaHocVien, coTheBaoCase: lop.viewer.canReportCase,
    coTheGhiViPham: lop.viewer.canRecordViolation, coTheNhapDiem: lop.viewer.canEnterScores, coTheChuyenTiep: lop.viewer.coTheChuyenTiep,
    theoVai: !!vai, coTheSuaThongTin: !!lop.viewer.coTheSuaThongTin, coTheSuaThem: !!lop.viewer.coTheSuaThem,
  };
  const chon = useChonNhieu();
  const [viecChon, setViecChon] = useState<{ viec: ViecHangLoat; ids: number[] } | null>(null);
  const [hopTd, setHopTd] = useState<number[] | null>(null);   // P7: hộp Tạm dừng/ Kết thúc học · n em
  /* R5.3: lớp FT bỏ "Chuyển tiếp lớp" — chọn nhiều em → "Chuyển lớp…" (cùng panel Chuyển lớp nhiều em, ô lớp có "+ Mở lớp mới…"). */
  const [chuyenNhieu, setChuyenNhieu] = useState<number[] | null>(null);
  /* Chỉ Quản lý / Quản trị (`plan.week` của lớp), chỉ cách xem Tổng hợp; lớp đã kết thúc thì mọi cờ viewer tắt nên không có nút. */
  /* OV-10a: Admin có `plan.week` nhưng hàng loạt (Lưu trữ / Kết thúc / Huỷ chuyển lớp) máy chủ đòi `cycle.edit`. */
  const coTheChon = lop.viewer.canPlanWeek && can(PERMISSIONS.CYCLE_EDIT) && cheDo === 'diem';
  /* `?viec=chuyen-tiep` (lớp FT): bật sẵn chọn nhiều — một lần. */
  useEffect(() => { if (moChon && coTheChon && !chon.bat) chon.batTat(); }, [moChon]); // eslint-disable-line react-hooks/exhaustive-deps
  const doiCheDo = (m: CheDoHocVien) => { if (m !== 'diem') chon.bo(); onCheDo(m); };
  /*
   * V8-HSL (mockup v8, chủ SP duyệt 29/10): Cách xem là nút đoạn liền ĐẦU hàng công cụ của thẻ bảng (Tổng hợp FT: cùng hàng lọc · lượt · Chọn nhiều).
   * "Sửa thông tin" dời sang ⋯ đầu trang › Lớp › Sửa thông tin học viên (cùng panel `SuaCaLopPanel`). Cách xem khác (mockup không vẽ): hàng riêng như cũ.
   */
  const cachXem = (
    <BoLocDoan v8 ariaLabel={t('Cách xem')} value={cheDo} onChange={doiCheDo}
      muc={cacCheDo.map((k) => ({ key: k, nhan: CHE_DO_NHAN[k], ...(k === 'ket-qua' ? { so: t('{n} đợt', { n: soDot }) } : {}) }))} />
  );
  const nutChon = coTheChon ? (
    <button type="button" aria-pressed={chon.bat} onClick={chon.batTat}
      className={`btn h-[30px] px-2.5 text-[13px] max-sm:h-11 ${chon.bat ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : ''}`}>{chon.bat ? '✓ ' : ''}{t('Chọn nhiều')}</button>
  ) : null;
  const trongThe = cheDo === 'diem' && !thuong;
  return (
    <div className="space-y-2">
      {!trongThe && (
        <div className="flex flex-wrap items-center justify-between gap-2">{cachXem}{nutChon}</div>
      )}
      {cheDo === 'thong-tin'
        ? (
          <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className="card px-4 py-1" aria-label={t('Thông tin lớp')}><NoiDungThongTinLop lop={lop} chiDoc onDone={onDoi} /></section>
            {vai === 'tvv' && <EmCuaToiOLop lop={lop} />}
          </div>
        )
        : cheDo === 'ket-qua'
        ? <BangKqdrLopFt classId={lop.id} />
        : cheDo === 'can-ho-tro'
        ? <BangCanHoTro classId={lop.id} maLop={lop.code} laLopThuong={thuong} quyen={quyen} onDoi={onDoi} chuongTrinh={lop.programme?.code ?? null} />
        : thuong
          ? <BangDiemLopThuong classId={lop.id} maLop={lop.code} quyen={quyen} onDoi={onDoi} chon={coTheChon ? chon : undefined}
              chuongTrinh={lop.programme?.code ?? null} moc={lop.programme?.checkpoints ?? null} lienTuc={!!lop.lienTuc} />
          : <BangHoSoLop classId={lop.id} maLop={lop.code} quyen={quyen} onDoi={onDoi} chon={coTheChon ? chon : undefined}
              onThemHocVien={lop.viewer.canAddStudents ? onThemHocVien : undefined} cachXem={cachXem} nutChon={nutChon} />}
      {coTheChon && (
        <ThanhChonNhieu chon={chon}
          viec={[...(!thuong && lop.viewer.coTheChuyenTiep ? [{ key: 'chuyen-lop', nhan: t('Chuyển lớp…') }] : []),
            { key: 'tam-dung-ket-thuc', nhan: t('Tạm dừng/ Kết thúc học') }, { key: 'huy-lenh', nhan: t('Huỷ chuyển lớp') }, { key: 'xoa', nhan: t('Xoá') }]}
          onViec={(k) => (k === 'chuyen-lop' ? setChuyenNhieu([...chon.chon]) : k === 'tam-dung-ket-thuc' ? setHopTd([...chon.chon]) : setViecChon({ viec: k as ViecHangLoat, ids: [...chon.chon] }))} />
      )}
      {/* P7 (N11, k3): một mục "Tạm dừng/ Kết thúc học" thay Lưu trữ + Kết thúc học — cùng hộp một em, thêm số em; lỗi một phần giữ em lỗi trong hộp. */}
      {hopTd && (
        <HopTamDungKetThuc em={hopTd.map((id) => ({ id }))} lop={lop.code} tamDungDuoc onClose={() => setHopTd(null)} onDone={() => { chon.bo(); onDoi(); }} />
      )}
      {chuyenNhieu && <ChuyenLopNhieuEm classId={lop.id} emIds={chuyenNhieu} lop={{ code: lop.code, branchId: lop.branchId }} onClose={() => setChuyenNhieu(null)} onDone={() => { chon.bo(); setChuyenNhieu(null); onDoi(); }} />}
      {viecChon && (
        <XemTruocHangLoatPanel viec={viecChon.viec} ids={viecChon.ids} maLop={lop.code}
          onClose={() => setViecChon(null)} onDone={() => { chon.bo(); setViecChon(null); onDoi(); }} />
      )}
    </div>
  );
}

/**
 * "Ở LỚP NÀY · HỌC VIÊN CỦA TÔI" (OV-10b, mockup vai mục 2) — TVV: số em mình phụ trách trong lớp, SOS · Case mới · Tạm dừng. Cùng nguồn với Học viên &
 * Lớp của TVV (`/hoc-vien-lop/theo-vai`, chip = `chipHocVien`); bấm mở danh sách đã lọc theo lớp.
 */
function EmCuaToiOLop({ lop }: { lop: HoSoLop }) {
  const { data } = useApi<{ rows: { id: number; status: string; lop: { id: number } | null; chuY: { sos?: number; caseMoi?: string[] } | null }[] }>('/hoc-vien-lop/theo-vai');
  if (!data) return null;
  const em = data.rows.filter((r) => r.lop?.id === lop.id);
  const so = (f: (r: (typeof em)[number]) => boolean) => em.filter(f).length;
  return (
    <section aria-label={t('Ở lớp này · học viên của tôi')} className="rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2.5 text-[13px] text-slate-200">
      <h2 className="m-0 mb-1.5 text-[12px] font-bold  text-slate-400">{t('Ở lớp này · học viên của tôi')}</h2>
      {em.length ? (
        <>
          <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1">
            <b className="font-semibold tabular-nums">{t('{n} em', { n: em.length })}</b>
            <span aria-hidden className="text-slate-500">·</span><Nhan tone="muted">SOS</Nhan><span className="tabular-nums">{so((r) => !!r.chuY?.sos)}</span>
            <span aria-hidden className="text-slate-500">·</span><Nhan tone="muted">{t('Case mới')}</Nhan><span className="tabular-nums">{so((r) => !!r.chuY?.caseMoi?.length)}</span>
            <span aria-hidden className="text-slate-500">·</span><Nhan tone="soon">{t('Tạm dừng')}</Nhan><span className="tabular-nums">{so((r) => r.status === 'inactive')}</span>
          </p>
          <Link to={`/hoc-vien?q=${encodeURIComponent(lop.code)}`} className="link mt-1.5 inline-flex min-h-[44px] items-center sm:min-h-0">{t('Xem từng em ở Học viên & Lớp')}</Link>
        </>
      ) : <p className="m-0 text-slate-400">{t('Lớp này chưa có học viên nào của bạn.')}</p>}
    </section>
  );
}
