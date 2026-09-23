import { ClassRoster } from '../students/ClassRoster.tsx';
import { BangDiemLopThuong } from './BangDiemLopThuong.tsx';
import { BangCanHoTro } from './BangCanHoTro.tsx';
import type { HoSoLop } from './DauTrangLop.tsx';
import type { QuyenDong } from './thaoTacDongHocVien.tsx';

/**
 * TAB HỌC VIÊN CỦA HỒ SƠ LỚP (đặc tả §3.7): hai chế độ.
 *   Điểm       FT: bảng đợt MT như hiện có · lớp thường: Giữa khoá | Cuối khoá × L R W S, ô đúng/tổng (10b phương án A)
 *   Cần hỗ trợ học viên có Case mở: vấn đề chính · PA đang chạy · bước tiếp theo + hạn (mockup 06, cho GVCN họp nhanh)
 */
export function TabHocVienLop({ lop, cheDo, onCheDo, onDoi, onThemHocVien }: {
  lop: HoSoLop; cheDo: 'diem' | 'can-ho-tro'; onCheDo: (m: 'diem' | 'can-ho-tro') => void;
  onDoi: () => void; onThemHocVien: () => void;
}) {
  const thuong = lop.programme?.scoringMode === 'ratio';
  const quyen: QuyenDong = {
    coTheSuaHocVien: lop.viewer.canAddStudents, coTheBaoCase: lop.viewer.canReportCase,
    coTheGhiViPham: lop.viewer.canRecordViolation, coTheNhapDiem: lop.viewer.canEnterScores,
  };
  return (
    <div className="space-y-2">
      <div role="group" aria-label="Cách xem" className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
        {(['diem', 'can-ho-tro'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={cheDo === m} onClick={() => onCheDo(m)}
            className={`border-0 px-3 py-1 text-xs font-semibold cursor-pointer ${
              cheDo === m ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'bg-transparent text-slate-400 hover:bg-white/5'
            }`}>
            {m === 'diem' ? 'Điểm' : 'Cần hỗ trợ'}
          </button>
        ))}
      </div>
      {cheDo === 'can-ho-tro'
        ? <BangCanHoTro classId={lop.id} laLopThuong={thuong} quyen={quyen} onDoi={onDoi} />
        : thuong
          ? <BangDiemLopThuong classId={lop.id} quyen={quyen} onDoi={onDoi} />
          : <ClassRoster classId={lop.id} quyen={quyen} onDoi={onDoi} onAddStudents={lop.viewer.canAddStudents ? onThemHocVien : undefined} />}
    </div>
  );
}
