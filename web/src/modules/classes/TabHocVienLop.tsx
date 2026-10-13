import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BoLocDoan, Level } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useApi } from '../../lib/useApi.ts';
import { NoiDungThongTinLop } from './ThongTinLopPanel.tsx';
import { ClassRoster } from '../students/ClassRoster.tsx';
import { BangDiemLopThuong } from './BangDiemLopThuong.tsx';
import { BangCanHoTro } from './BangCanHoTro.tsx';
import { BangLoTrinhTiep } from './BangLoTrinhTiep.tsx';
import { BangKqdrLopFt } from './BangKqdrLopFt.tsx';
import { ThanhChonNhieu, useChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { XemTruocHangLoatPanel } from '../students/XemTruocHangLoatPanel.tsx';
import type { HoSoLop } from './DauTrangLop.tsx';
import type { QuyenDong } from './thaoTacDongHocVien.tsx';
import { PERMISSIONS, vaiXemHocVien, type ViecHangLoat } from '@shared/domain/index.ts';
import { useSession } from '../../lib/session.tsx';

/**
 * TAB HỌC VIÊN CỦA HỒ SƠ LỚP (đặc tả §3.7): hai chế độ.
 *   Tổng hợp   (PR-OV3a: tên mới của "Điểm"; khoá URL vẫn `diem`) FT: bảng đợt MT như hiện có · lớp thường: Progress | Final × L R W S,
 *              ô đúng/tổng (10b phương án A) + cột Lộ trình tiếp theo (hướng Quản lý đã chốt)
 *   Lộ trình tiếp theo (OV-3b, lớp thường; `?che-do=lo-trinh`) mỗi hướng một bảng: Lộ trình (nháp / chốt) · Kết quả đầu ra · Bàn giao
 *   Cần hỗ trợ học viên có Case mở: vấn đề chính · PA đang chạy · bước tiếp theo + hạn (mockup 06, cho GVCN họp nhanh)
 *   Kết quả đầu ra (OV-3c, lớp FT; `?che-do=ket-qua`) KQĐR lớp trước của em vào từ FOU/BE/ELE, chỉ khi còn đợt trong 4 tuần (`dai.kqdrDot`);
 *              hết đợt mà mở URL cũ → cách xem mặc định
 * PR-LUI-b (06/10): Quản lý / Quản trị có nút "Chọn nhiều học viên" ở cách xem Tổng hợp — ô chọn hiện ngay trên danh sách, thanh thao tác dính đáy
 * (Lưu trữ · Kết thúc học · Huỷ chuyển lớp · Bỏ chọn), bấm một việc ra panel xem trước rồi xác nhận.
 */
export type CheDoHocVien = 'diem' | 'lo-trinh' | 'can-ho-tro' | 'ket-qua' | 'thong-tin';
/** Tên cách xem — cũng là chi tiết của nút "‹ Hồ sơ lớp …" khi đi từ hồ sơ lớp sang hồ sơ khác (PR-OV5b). */
export const CHE_DO_NHAN: Record<CheDoHocVien, string> = {
  diem: 'Tổng hợp', 'lo-trinh': 'Lộ trình tiếp theo', 'can-ho-tro': 'Cần hỗ trợ', 'ket-qua': 'Kết quả đầu ra', 'thong-tin': 'Thông tin lớp',
};
export function TabHocVienLop({ lop, cheDo: cheDoUrl, onCheDo, onDoi, onThemHocVien, onSuaThongTin, emMo = null, onDaMoEm }: {
  lop: HoSoLop; cheDo: CheDoHocVien; onCheDo: (m: CheDoHocVien) => void;
  /** OV-3b: `&em={id}` — mở sẵn hộp Lộ trình của em đó (cách xem Lộ trình tiếp theo). */
  emMo?: number | null; onDaMoEm?: () => void;
  onDoi: () => void; onThemHocVien: () => void;
  /** PR-SL: mở panel Sửa thông tin học viên (cả lớp) — chỉ truyền khi người xem sửa được học viên của lớp. */
  onSuaThongTin?: () => void;
}) {
  /* OV-6b2: lớp liên tục (PET, KET…) — không cách xem Lộ trình tiếp theo. */
  const thuong = lop.programme?.scoringMode === 'ratio';
  const coLoTrinh = thuong && !lop.lienTuc;
  const soDot = lop.dai?.kqdrDot ?? 0;
  const { can, session } = useSession();
  /*
   * OV-10b (mockup vai mục 2, 6): TVV / CX — Tổng hợp (cột Phụ huynh thay Theo dõi) · Lộ trình tiếp theo / KQĐR đã chốt · Cần hỗ trợ (đọc) · Thông tin
   * lớp (đọc); Admin — Tổng hợp · Thông tin lớp. QL / GV không đổi.
   */
  const vai = vaiXemHocVien(session?.roles);
  const cacCheDo: CheDoHocVien[] = [
    'diem', ...(coLoTrinh && vai !== 'admin' ? ['lo-trinh' as const] : []), ...(vai !== 'admin' ? ['can-ho-tro' as const] : []),
    ...(soDot && vai !== 'admin' ? ['ket-qua' as const] : []), ...(vai ? ['thong-tin' as const] : []),
  ];
  const cheDo: CheDoHocVien = cacCheDo.includes(cheDoUrl) ? cheDoUrl : 'diem';
  const quyen: QuyenDong = {
    coTheSuaHocVien: lop.viewer.canAddStudents, coTheBaoCase: lop.viewer.canReportCase,
    coTheGhiViPham: lop.viewer.canRecordViolation, coTheNhapDiem: lop.viewer.canEnterScores, coTheChuyenTiep: lop.viewer.coTheChuyenTiep,
    theoVai: !!vai, coTheSuaThongTin: !!lop.viewer.coTheSuaThongTin, coTheSuaThem: !!lop.viewer.coTheSuaThem,
  };
  const chon = useChonNhieu();
  const [viecChon, setViecChon] = useState<{ viec: ViecHangLoat; ids: number[] } | null>(null);
  /* Chỉ Quản lý / Quản trị (`plan.week` của lớp), chỉ cách xem Tổng hợp; lớp đã kết thúc thì mọi cờ viewer tắt nên không có nút. */
  /* OV-10a: Admin có `plan.week` nhưng hàng loạt (Lưu trữ / Kết thúc / Huỷ chuyển lớp) máy chủ đòi `cycle.edit`. */
  const coTheChon = lop.viewer.canPlanWeek && can(PERMISSIONS.CYCLE_EDIT) && cheDo === 'diem';
  const doiCheDo = (m: CheDoHocVien) => { if (m !== 'diem') chon.bo(); onCheDo(m); };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BoLocDoan ariaLabel="Cách xem" value={cheDo} onChange={doiCheDo}
          muc={cacCheDo.map((k) => ({ key: k, nhan: CHE_DO_NHAN[k], ...(k === 'ket-qua' ? { so: `${soDot} đợt` } : {}) }))} />
        <span className="flex flex-wrap items-center gap-2">
          {onSuaThongTin && <button type="button" className="btn btn-ghost btn-sm min-h-[44px] sm:min-h-0" onClick={onSuaThongTin}>Sửa thông tin</button>}
          {coTheChon && (
            <button type="button" aria-pressed={chon.bat} onClick={chon.batTat}
              className={`btn btn-sm min-h-[44px] sm:min-h-0 ${chon.bat ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : 'btn-ghost'}`}>Chọn nhiều học viên</button>
          )}
        </span>
      </div>
      {cheDo === 'thong-tin'
        ? (
          <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className="card px-4 py-1" aria-label="Thông tin lớp"><NoiDungThongTinLop lop={lop} chiDoc onDone={onDoi} /></section>
            {vai === 'tvv' && <EmCuaToiOLop lop={lop} />}
          </div>
        )
        : cheDo === 'lo-trinh' && coLoTrinh
        ? <BangLoTrinhTiep classId={lop.id} quyen={quyen} onDoi={onDoi} emMo={emMo} onDaMoEm={() => onDaMoEm?.()} />
        : cheDo === 'ket-qua'
        ? <BangKqdrLopFt classId={lop.id} />
        : cheDo === 'can-ho-tro'
        ? <BangCanHoTro classId={lop.id} maLop={lop.code} laLopThuong={thuong} quyen={quyen} onDoi={onDoi} chuongTrinh={lop.programme?.code ?? null} />
        : thuong
          ? <BangDiemLopThuong classId={lop.id} maLop={lop.code} quyen={quyen} onDoi={onDoi} chon={coTheChon ? chon : undefined}
              chuongTrinh={lop.programme?.code ?? null} moc={lop.programme?.checkpoints ?? null} lienTuc={!!lop.lienTuc} />
          : <ClassRoster classId={lop.id} maLop={lop.code} quyen={quyen} onDoi={onDoi} chon={coTheChon ? chon : undefined}
              onAddStudents={lop.viewer.canAddStudents ? onThemHocVien : undefined} />}
      {coTheChon && (
        <ThanhChonNhieu chon={chon}
          viec={[{ key: 'luu-tru', nhan: 'Lưu trữ' }, { key: 'ket-thuc', nhan: 'Kết thúc học' }, { key: 'huy-lenh', nhan: 'Huỷ chuyển lớp' }]}
          onViec={(k) => setViecChon({ viec: k as ViecHangLoat, ids: [...chon.chon] })} />
      )}
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
    <section aria-label="Ở lớp này · học viên của tôi" className="rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2.5 text-[13px] text-slate-200">
      <h2 className="m-0 mb-1.5 text-[11.5px] font-bold uppercase tracking-[.04em] text-slate-400">Ở lớp này · học viên của tôi</h2>
      {em.length ? (
        <>
          <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1">
            <b className="font-semibold tabular-nums">{em.length} em</b>
            <span aria-hidden className="text-slate-500">·</span><Level tone="sos3">SOS</Level><span className="tabular-nums">{so((r) => !!r.chuY?.sos)}</span>
            <span aria-hidden className="text-slate-500">·</span><Nhan tone="wait">Case mới</Nhan><span className="tabular-nums">{so((r) => !!r.chuY?.caseMoi?.length)}</span>
            <span aria-hidden className="text-slate-500">·</span><Nhan tone="soon">Tạm dừng</Nhan><span className="tabular-nums">{so((r) => r.status === 'inactive')}</span>
          </p>
          <Link to={`/hoc-vien?q=${encodeURIComponent(lop.code)}`} className="link mt-1.5 inline-flex min-h-[44px] items-center sm:min-h-0">Xem từng em ở Học viên & Lớp</Link>
        </>
      ) : <p className="m-0 text-slate-400">Lớp này chưa có học viên nào của bạn.</p>}
    </section>
  );
}
