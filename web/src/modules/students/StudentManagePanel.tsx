import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { fmtBand } from '../../lib/format.ts';
import {
  CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL, NHAN_VIEC_QUAN_LY, mucQuanLyHocVien, ngay, type LopHocQuyen, type ViecQuanLy,
} from '@shared/domain/index.ts';
import { LoTrinhTiepPanel } from './LoTrinhTiepPanel.tsx';
import { ChuyenLopPanel } from './ChuyenLopPanel.tsx';

/**
 * QUẢN LÝ HỌC VIÊN Ở HỒ SƠ (PR-UX3, Q10) — dấu ⋮ mở MENU THẢ (`Menu`) chứ không còn ngăn "Quản lý học viên" với danh sách việc rồi
 * `← Chọn việc khác`. Mỗi mục mở THẲNG panel của việc đó, một `KhungPanel` một lúc. `Lộ trình` (Fast Track) mở `StudentPlanPanel` như cũ
 * (nơi gọi lo). Nơi gọi: `mucQuanLyHocVien(...)` quyết mục nào hiện; `StudentManagePanel` vẽ đúng panel cho `viec`.
 *
 * PR-LT (mockup 12-C, §3.9.2, Q2, Q15, Q22) — thứ tự đúng: Thông tin học viên · Lộ trình tiếp theo (lớp thường) · Lộ trình (FT) · Chuyển lớp ·
 * Kết luận lộ trình (CHỈ FT, Q15) · nhóm trạng thái (Tạm dừng/Quay lại/Kết thúc học) · Lưu trữ/Bỏ lưu trữ (chỉ QL, chỉ em đã kết thúc học).
 */
export { mucQuanLyHocVien, type LopHocQuyen, type ViecQuanLy };
const NHAN_VIEC = NHAN_VIEC_QUAN_LY;

export function StudentManagePanel({ viec, onClose, student, lop, cycle, attempts, onDone }: {
  /** Việc đang mở; `null` = không mở gì. `lo-trinh` do nơi gọi mở (StudentPlanPanel), không qua đây. */
  viec: ViecQuanLy | null; onClose: () => void;
  student: {
    id: number; name: string; classId: number | null;
    dob?: string | null; consultantName?: string | null; note?: string | null; status?: string;
  };
  /** Mã lớp hiện ở đầu ngăn. */
  lop?: string | null;
  cycle: any | null;
  attempts: any[];
  onDone: () => void;
}) {
  if (!viec || viec === 'lo-trinh') return null;
  const xong = () => { onDone(); onClose(); };
  const chung = { studentId: student.id, studentName: student.name, lop, onClose, onDone: xong };
  switch (viec) {
    case 'lo-trinh-tiep': return <LoTrinhTiepPanel open {...chung} />;
    case 'chuyen-lop': return <ChuyenLopPanel open {...chung} />;
    case 'tam-dung': return <TrangThaiPanel {...chung} status="inactive" />;
    case 'quay-lai': return <TrangThaiPanel {...chung} status="active" />;
    case 'ket-thuc': return <TrangThaiPanel {...chung} status="finished" />;
    case 'luu-tru': return <LuuTruPanel {...chung} boLuuTru={false} />;
    case 'bo-luu-tru': return <LuuTruPanel {...chung} boLuuTru />;
    case 'outcome': return <KetLuanLoTrinhPanel {...chung} cycle={cycle} attempts={attempts} />;
    case 'info': return <ThongTinPanel {...chung} student={student} cycle={cycle} />;
    default: return null;
  }
}

// ==================================================================== các panel

type ChungViec = { studentId: number; studentName: string; lop?: string | null; onClose: () => void; onDone: () => void };

/**
 * TẠM DỪNG HỌC / QUAY LẠI HỌC / KẾT THÚC HỌC (PR-LT, §3.9.4, Q9). Cùng một panel, ba trạng thái — lý do bắt buộc khi dừng/kết thúc; ngày hiệu
 * lực tuỳ chọn (mặc định hôm nay ở máy chủ).
 */
function TrangThaiPanel({ studentId, studentName, lop, onClose, onDone, status }: ChungViec & { status: 'active' | 'inactive' | 'finished' }) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const canDoLuon = status === 'active';
  const tieuDe = status === 'active' ? NHAN_VIEC['quay-lai'] : status === 'inactive' ? NHAN_VIEC['tam-dung'] : NHAN_VIEC['ket-thuc'];

  const luu = async () => {
    setDaBam(true);
    if (!canDoLuon && !lyDo.trim()) return;
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/status`, { status, date: ngayHl || undefined, reason: lyDo || undefined });
      invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/cases');
      toast.push('ok', 'Đã lưu');
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: daBam && !canDoLuon && !lyDo.trim() ? ['Lý do'] : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>Lưu</button>,
      }}>
      <Khoi tieuDe={tieuDe}
        luat={status === 'finished' ? 'Case còn mở sẽ được hệ thống đóng “Học viên kết thúc khoá”.'
          : status === 'inactive' ? 'Em nghỉ một thời gian, giữ lớp và lộ trình để quay lại sau.' : undefined}>
        {!canDoLuon && (
          <Truong nhan="Lý do" batBuoc>
            <input className="field w-full" value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
          </Truong>
        )}
        <Truong nhan="Có hiệu lực từ">
          <ChonNgayGan value={ngayHl} onChange={setNgayHl} soNgay={30} chuaChon="Mặc định: hôm nay" />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}

/** LƯU TRỮ / BỎ LƯU TRỮ (RB-9, Q22) — hỏi xác nhận ngay trong panel, không mở hộp thoại riêng. */
function LuuTruPanel({ studentId, studentName, lop, onClose, onDone, boLuuTru }: ChungViec & { boLuuTru: boolean }) {
  const toast = useToast();
  const [xacNhan, setXacNhan] = useState(false);
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const tieuDe = NHAN_VIEC[boLuuTru ? 'bo-luu-tru' : 'luu-tru'];

  const luu = async () => {
    setDaBam(true);
    if (!xacNhan) return;
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/${boLuuTru ? 'unarchive' : 'archive'}`, {});
      invalidate('/students'); invalidate('/hoc-vien-lop');
      toast.push('ok', boLuuTru ? 'Đã bỏ lưu trữ' : 'Đã lưu trữ');
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={tieuDe} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: daBam && !xacNhan ? ['Xác nhận'] : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{tieuDe}</button>,
      }}>
      <Khoi tieuDe={tieuDe}>
        <p className="m-0 text-sm text-slate-300">
          {boLuuTru
            ? 'Hồ sơ sẽ trở lại danh sách chính của Học viên & Lớp.'
            : 'Hồ sơ sẽ ẩn khỏi danh sách chính. Không đổi trạng thái, không xoá dữ liệu, không đóng việc còn dở. Xem lại được ở khu Lưu trữ.'}
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={xacNhan} onChange={(e) => setXacNhan(e.target.checked)} />
          Tôi hiểu và muốn {boLuuTru ? 'bỏ lưu trữ' : 'lưu trữ'} học viên này.
        </label>
      </Khoi>
    </KhungPanel>
  );
}

/** KẾT LUẬN LỘ TRÌNH — CHỈ Fast Track (Q15). Khép lộ trình KHÔNG đóng hộ Case còn mở: chúng đi theo em sang giai đoạn sau. */
function KetLuanLoTrinhPanel({ studentName, lop, onClose, onDone, cycle, attempts }: ChungViec & { cycle: any; attempts: any[] }) {
  const toast = useToast();
  const [outcome, setOutcome] = useState(cycle?.outcome?.outcome ?? 'unknown');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  void attempts;

  /* Case còn mở của chính em này — thứ phải bàn giao chứ không biến mất khi lộ trình khép. */
  const open = useApi<{ rows: any[] }>(`/cases?studentId=${cycle?.studentId ?? ''}&status=open`, [cycle?.studentId]);
  const pending = (open.data?.rows ?? []).filter((c: any) => c.status !== 'done');

  const luu = async () => {
    setBusy(true);
    try {
      await api.put(`/cycles/${cycle.id}/outcome`, { outcome, note, score: score || undefined });
      invalidate('/students'); toast.push('ok', 'Đã lưu'); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={NHAN_VIEC.outcome} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{ chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>Lưu</button> }}>
      <Khoi tieuDe="Kết luận"
        luat="Đóng lộ trình chỉ nói “không học theo lộ trình này nữa”. Có đạt mục tiêu hay không là kết luận riêng. Em học lại thì mở một lộ trình MỚI. KHÔNG lấy một lượt Mock Test làm kết quả thi thật: MT chấm nội bộ, không có phòng thi và không có chứng chỉ.">
        <Truong nhan="Kết luận" batBuoc>
          <select className="field w-full" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {CYCLE_OUTCOMES.map((o) => <option key={o} value={o}>{CYCLE_OUTCOME_LABEL[o]}</option>)}
          </select>
        </Truong>
        <Truong nhan="Điểm IELTS thật (Overall)" tuyChon phu="Chưa thi thì để trống — “chưa có căn cứ” là một câu trả lời hợp lệ">
          <input className="field w-full max-w-[8rem]" type="number" step="0.5" min={0} max={9} value={score} onChange={(e) => setScore(e.target.value)} />
        </Truong>
        <Truong nhan="Ghi chú" tuyChon>
          <input className="field w-full" value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>

      {/* CÒN GÌ PHẢI BÀN GIAO — nhìn thấy trước khi bấm, không phải sau. */}
      {pending.length > 0 && (
        <Khoi tieuDe={`Case chưa kết luận · ${pending.length}`}>
          <p className="m-0 text-xs text-soon">Khép lộ trình không đóng hộ các Case này; chúng đi theo em sang giai đoạn sau.</p>
          <ul className="m-0 list-none space-y-1 p-0">
            {pending.slice(0, 6).map((c: any) => <li key={c.id} className="truncate text-xs text-slate-300">{c.title ?? c.headline}</li>)}
          </ul>
        </Khoi>
      )}
    </KhungPanel>
  );
}

/** Ngày sinh gõ dạng dd/mm/yyyy (ô ngày của trình duyệt hiện theo máy, G-6). Trả ISO, hoặc `null` khi rỗng, `undefined` khi sai dạng. */
function docNgaySinh(s: string): string | null | undefined {
  const t = s.trim();
  if (!t) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (!m) return undefined;
  const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? undefined : iso;
}

/**
 * THÔNG TIN HỌC VIÊN — mục 1 của menu (mục 5.1). Với lớp Fast Track, mục tiêu và kế hoạch thi thật sửa ở mục `Lộ trình`; với lớp thường,
 * giai đoạn đang học đọc ở đây, sửa `Lộ trình tiếp theo` ở mục riêng (PR-LT).
 */
function ThongTinPanel({ studentName, lop, onClose, onDone, student, cycle }: ChungViec & {
  student: { id: number; name: string; dob?: string | null; consultantName?: string | null; note?: string | null };
  cycle: any | null;
}) {
  const toast = useToast();
  const [fullName, setFullName] = useState(student.name);
  const [dob, setDob] = useState(student.dob ? ngay(student.dob, null) : '');
  const [consultantName, setConsultant] = useState(student.consultantName ?? '');
  const [note, setNote] = useState(student.note ?? '');
  const [daBam, setDaBam] = useState(false);
  const [busy, setBusy] = useState(false);
  const dobIso = docNgaySinh(dob);
  const thieu: string[] = [];
  if (!fullName.trim()) thieu.push('Họ tên');
  if (dobIso === undefined) thieu.push('Ngày sinh (dd/mm/yyyy)');

  const luu = async () => {
    setDaBam(true);
    if (thieu.length > 0) return;
    setBusy(true);
    try {
      await api.patch(`/students/${student.id}`, {
        fullName, dob: dobIso ?? null, consultantName: consultantName || null, note: note || null,
      });
      invalidate('/students'); toast.push('ok', 'Đã lưu'); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={NHAN_VIEC.info} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: daBam ? thieu : undefined,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>Lưu</button>,
      }}>
      <Khoi tieuDe="Học viên">
        <Truong nhan="Họ tên" batBuoc>
          <input className="field w-full" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Truong>
        <Truong nhan="Ngày sinh" tuyChon>
          <input className="field w-full" inputMode="numeric" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="Ví dụ: 25/03/2008" />
        </Truong>
        <Truong nhan="Người tư vấn" tuyChon>
          <input className="field w-full" value={consultantName} onChange={(e) => setConsultant(e.target.value)} />
        </Truong>
        <Truong nhan="Ghi chú" tuyChon>
          <textarea className="field w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>
      {cycle && (
        <Khoi tieuDe="Giai đoạn đang học"
          luat={cycle.ratio
            ? 'Giai đoạn là chương trình đang học; tuần kết thúc suy ra từ tuần bắt đầu và độ dài chương trình. Ghi dự định sau lớp này ở mục Lộ trình tiếp theo.'
            : 'Sửa mục tiêu, kế hoạch thi thật, điểm đầu vào và lịch MT ở mục Lộ trình. Đổi mục tiêu ở đâu cũng bắt ghi lý do và ngày hiệu lực.'}>
          {cycle.ratio ? (
            <p className="m-0 text-sm text-slate-200">
              {cycle.programmeName ?? cycle.label}
              {cycle.startWeek && <span className="text-slate-500"> · bắt đầu {cycle.startWeek.code}</span>}
              {cycle.endWeek && <span className="text-slate-500"> · kết thúc {cycle.endWeek.code}</span>}
            </p>
          ) : (
            <p className="m-0 text-sm text-slate-200">
              {cycle.label}
              {cycle.target !== null && cycle.target !== undefined && <span className="text-slate-500"> · mục tiêu {fmtBand(cycle.target)}</span>}
              {cycle.startWeek && <span className="text-slate-500"> · vào học {cycle.startWeek.code}</span>}
              {cycle.examPlan?.confidence !== 'none' && <span className="text-slate-500"> · dự kiến thi {cycle.examPlan?.label}</span>}
            </p>
          )}
        </Khoi>
      )}
    </KhungPanel>
  );
}
