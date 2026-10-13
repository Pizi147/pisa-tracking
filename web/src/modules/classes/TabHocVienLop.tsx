import { useState } from 'react';
import { BoLocDoan } from '../../ui/ui.tsx';
import { ClassRoster } from '../students/ClassRoster.tsx';
import { BangDiemLopThuong } from './BangDiemLopThuong.tsx';
import { BangCanHoTro } from './BangCanHoTro.tsx';
import { BangLoTrinhTiep } from './BangLoTrinhTiep.tsx';
import { BangKqdrLopFt } from './BangKqdrLopFt.tsx';
import { ThanhChonNhieu, useChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { XemTruocHangLoatPanel } from '../students/XemTruocHangLoatPanel.tsx';
import type { HoSoLop } from './DauTrangLop.tsx';
import type { QuyenDong } from './thaoTacDongHocVien.tsx';
import type { ViecHangLoat } from '@shared/domain/index.ts';

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
export type CheDoHocVien = 'diem' | 'lo-trinh' | 'can-ho-tro' | 'ket-qua';
export function TabHocVienLop({ lop, cheDo: cheDoUrl, onCheDo, onDoi, onThemHocVien, onSuaThongTin, emMo = null, onDaMoEm }: {
  lop: HoSoLop; cheDo: CheDoHocVien; onCheDo: (m: CheDoHocVien) => void;
  /** OV-3b: `&em={id}` — mở sẵn hộp Lộ trình của em đó (cách xem Lộ trình tiếp theo). */
  emMo?: number | null; onDaMoEm?: () => void;
  onDoi: () => void; onThemHocVien: () => void;
  /** PR-SL: mở panel Sửa thông tin học viên (cả lớp) — chỉ truyền khi người xem sửa được học viên của lớp. */
  onSuaThongTin?: () => void;
}) {
  const thuong = lop.programme?.scoringMode === 'ratio';
  const soDot = lop.dai?.kqdrDot ?? 0;
  const cheDo: CheDoHocVien = cheDoUrl === 'ket-qua' && !soDot ? 'diem' : cheDoUrl;
  const quyen: QuyenDong = {
    coTheSuaHocVien: lop.viewer.canAddStudents, coTheBaoCase: lop.viewer.canReportCase,
    coTheGhiViPham: lop.viewer.canRecordViolation, coTheNhapDiem: lop.viewer.canEnterScores, coTheChuyenTiep: lop.viewer.coTheChuyenTiep,
  };
  const chon = useChonNhieu();
  const [viecChon, setViecChon] = useState<{ viec: ViecHangLoat; ids: number[] } | null>(null);
  /* Chỉ Quản lý / Quản trị (`plan.week` của lớp), chỉ cách xem Tổng hợp; lớp đã kết thúc thì mọi cờ viewer tắt nên không có nút. */
  const coTheChon = lop.viewer.canPlanWeek && cheDo === 'diem';
  const doiCheDo = (m: CheDoHocVien) => { if (m !== 'diem') chon.bo(); onCheDo(m); };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BoLocDoan ariaLabel="Cách xem" value={cheDo} onChange={doiCheDo}
          muc={[{ key: 'diem', nhan: 'Tổng hợp' }, ...(thuong ? [{ key: 'lo-trinh' as const, nhan: 'Lộ trình tiếp theo' }] : []), { key: 'can-ho-tro', nhan: 'Cần hỗ trợ' },
            ...(soDot ? [{ key: 'ket-qua' as const, nhan: 'Kết quả đầu ra', so: `${soDot} đợt` }] : [])]} />
        <span className="flex flex-wrap items-center gap-2">
          {onSuaThongTin && <button type="button" className="btn btn-ghost btn-sm min-h-[44px] sm:min-h-0" onClick={onSuaThongTin}>Sửa thông tin</button>}
          {coTheChon && (
            <button type="button" aria-pressed={chon.bat} onClick={chon.batTat}
              className={`btn btn-sm min-h-[44px] sm:min-h-0 ${chon.bat ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : 'btn-ghost'}`}>Chọn nhiều học viên</button>
          )}
        </span>
      </div>
      {cheDo === 'lo-trinh' && thuong
        ? <BangLoTrinhTiep classId={lop.id} quyen={quyen} onDoi={onDoi} emMo={emMo} onDaMoEm={() => onDaMoEm?.()} />
        : cheDo === 'ket-qua'
        ? <BangKqdrLopFt classId={lop.id} />
        : cheDo === 'can-ho-tro'
        ? <BangCanHoTro classId={lop.id} maLop={lop.code} laLopThuong={thuong} quyen={quyen} onDoi={onDoi} chuongTrinh={lop.programme?.code ?? null} />
        : thuong
          ? <BangDiemLopThuong classId={lop.id} maLop={lop.code} quyen={quyen} onDoi={onDoi} chon={coTheChon ? chon : undefined}
              chuongTrinh={lop.programme?.code ?? null} moc={lop.programme?.checkpoints ?? null} />
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
