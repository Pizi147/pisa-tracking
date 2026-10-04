import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { fmtBand } from '../../lib/format.ts';
import {
  CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL, NHAN_VIEC_QUAN_LY, mucQuanLyHocVien, type LopHocQuyen, type ViecQuanLy, dsLoi, docEmail,
  cauMtSeDoi, GIAI_THICH_KCK, KCK,
} from '@shared/domain/index.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { LoTrinhTiepPanel } from './LoTrinhTiepPanel.tsx';
import { ChuyenLopPanel } from './ChuyenLopPanel.tsx';
import { XoaHocVienPanel } from './XoaHocVienPanel.tsx';
import { DeXuatSuaPanel } from '../duyet/DeXuatSuaPanel.tsx';
import { laBand } from './StudentPlanPanel.tsx';
import { NutChon, TargetText } from '../../ui/ui.tsx';

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

export function StudentManagePanel({ viec, onClose, student, lop, cycle, attempts, onDone, soViPhamMo = 0, canEditCycle = false, onDeXuatSua }: {
  /** Việc đang mở; `null` = không mở gì. `lo-trinh` do nơi gọi mở (StudentPlanPanel), không qua đây. */
  viec: ViecQuanLy | null; onClose: () => void;
  student: {
    id: number; name: string; classId: number | null;
    dob?: string | null; email?: string | null; consultantName?: string | null; note?: string | null; status?: string;
  };
  /** Mã lớp hiện ở đầu ngăn. */
  lop?: string | null;
  cycle: any | null;
  attempts: any[];
  onDone: () => void;
  /** PR-UXF-b (O2): số vi phạm Ý thức còn mở — lấy từ dữ liệu hồ sơ đã nạp (một nguồn với ô Ý thức), không gọi thêm. */
  soViPhamMo?: number;
  /** PR-NT: Thông tin HV lớp thường — không có `cycle.edit` thì Target chỉ đọc + "Đề xuất sửa" (cùng luật `StudentPlanPanel`). */
  canEditCycle?: boolean; onDeXuatSua?: () => void;
}) {
  if (!viec || viec === 'lo-trinh') return null;
  const xong = () => { onDone(); onClose(); };
  const chung = { studentId: student.id, studentName: student.name, lop, onClose, onDone: xong };
  switch (viec) {
    case 'lo-trinh-tiep': return <LoTrinhTiepPanel open {...chung} />;
    case 'chuyen-lop': return <ChuyenLopPanel open cheDo="lenh" {...chung} />;
    case 'de-xuat-chuyen-lop': return <ChuyenLopPanel open cheDo="de-xuat" {...chung} />;
    case 'tam-dung': return <TrangThaiPanel {...chung} status="inactive" soViPhamMo={soViPhamMo} />;
    case 'quay-lai': return <TrangThaiPanel {...chung} status="active" soViPhamMo={soViPhamMo} />;
    case 'ket-thuc': return <TrangThaiPanel {...chung} status="finished" />;
    case 'luu-tru': return <LuuTruPanel {...chung} boLuuTru={false} />;
    case 'bo-luu-tru': return <LuuTruPanel {...chung} boLuuTru />;
    case 'outcome': return <KetLuanLoTrinhPanel {...chung} cycle={cycle} attempts={attempts} />;
    case 'info': return <ThongTinPanel {...chung} student={student} cycle={cycle} attempts={attempts} canEditCycle={canEditCycle} onDeXuatSua={onDeXuatSua} />;
    case 'xoa-hoc-vien': return <XoaHocVienPanel studentId={student.id} studentName={student.name} lop={lop} onClose={onClose} />;
    case 'de-xuat-sua': return (
      <DeXuatSuaPanel studentId={student.id} studentName={student.name} lop={lop} onClose={onClose}
        hienTai={{ target: cycle?.target ?? null, khongCamKet: !!cycle?.khongCamKet, route: cycle?.route ?? null }} />
    );
    default: return null;
  }
}

// ==================================================================== các panel

type ChungViec = { studentId: number; studentName: string; lop?: string | null; onClose: () => void; onDone: () => void };

/**
 * TẠM DỪNG HỌC / QUAY LẠI HỌC / KẾT THÚC HỌC (PR-LT, §3.9.4, Q9). Cùng một panel, ba trạng thái — lý do bắt buộc khi dừng/kết thúc; ngày hiệu
 * lực tuỳ chọn (mặc định hôm nay ở máy chủ).
 */
function TrangThaiPanel({ studentId, studentName, lop, onClose, onDone, status, soViPhamMo = 0 }: ChungViec & { status: 'active' | 'inactive' | 'finished'; soViPhamMo?: number }) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const canDoLuon = status === 'active';
  const tieuDe = status === 'active' ? NHAN_VIEC['quay-lai'] : status === 'inactive' ? NHAN_VIEC['tam-dung'] : NHAN_VIEC['ket-thuc'];
  /* PR-SOS (K3-41): hệ quả Tạm dừng / Quay lại với Case — đếm từ bảng kỹ năng (cùng đường hồ sơ đã nạp). */
  const bang = useApi<{ rows: { cases: { status: string; trangThaiV4?: { k: string }; plans: { status: string }[] }[] }[] }>(
    status !== 'finished' ? `/students/${studentId}/skill-board` : null);
  const caseMo = (bang.data?.rows ?? []).flatMap((r) => r.cases).filter((c) => c.status !== 'done');
  const soCho = caseMo.filter((c) => c.trangThaiV4?.k === 'cho-nguyen-nhan' || c.trangThaiV4?.k === 'cho-xac-nhan-pa').length;
  const soPa = caseMo.flatMap((c) => c.plans).filter((pl) => pl.status === 'started').length;
  const heQuaCase = soCho + soPa > 0
    ? `${soCho} Case chờ xác nhận · ${soPa} PA đang chạy — ${status === 'inactive' ? 'tạm dừng hạn; Quay lại thì hạn tính lại từ ngày quay lại' : 'hạn tính lại từ ngày quay lại'}.`
    : null;
  /* O2 (Q14): vi phạm Ý thức còn mở cũng dừng hạn khi Tạm dừng, và tính lại từ ngày Quay lại. */
  const heQuaYThuc = status !== 'finished' && soViPhamMo > 0
    ? `${soViPhamMo} vi phạm Ý thức đang chờ xử lý — ${status === 'inactive' ? 'tạm dừng hạn; Quay lại thì hạn tính lại từ ngày quay lại' : 'hạn tính lại từ ngày quay lại'}.`
    : null;
  const loi = dsLoi(canDoLuon ? [] : [{ khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 }], { 'ly-do': lyDo });

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
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
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>Lưu</button>,
      }}>
      <Khoi tieuDe={tieuDe}
        luat={status === 'finished' ? 'Case còn mở sẽ được hệ thống đóng “Học viên kết thúc khoá”. Hồ sơ vào khu Lưu trữ (chỉ xem).'
          : status === 'inactive' ? ['Em nghỉ một thời gian, giữ lớp và lộ trình để quay lại sau.', heQuaCase, heQuaYThuc].filter(Boolean).join(' ')
          : [heQuaCase, heQuaYThuc].filter(Boolean).join(' ') || undefined}>
        {!canDoLuon && (
          <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loi, 'ly-do')}>
            <input className="field w-full" {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
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
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const tieuDe = NHAN_VIEC[boLuuTru ? 'bo-luu-tru' : 'luu-tru'];
  const loi = dsLoi([{ khoa: 'xac-nhan', nhan: 'Xác nhận', chon: true }], { 'xac-nhan': xacNhan });

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
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
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{tieuDe}</button>,
      }}>
      <Khoi tieuDe={tieuDe}>
        <p className="m-0 text-sm text-slate-300">
          {boLuuTru
            ? 'Hồ sơ sẽ trở lại danh sách chính của Học viên & Lớp.'
            : 'Hồ sơ sẽ ẩn khỏi danh sách chính. Không đổi trạng thái, không xoá dữ liệu, không đóng việc còn dở. Xem lại được ở khu Lưu trữ.'}
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" {...lf.o(loi, 'xac-nhan')} checked={xacNhan} onChange={(e) => setXacNhan(e.target.checked)} />
          Tôi hiểu và muốn {boLuuTru ? 'bỏ lưu trữ' : 'lưu trữ'} học viên này.
        </label>
        {lf.loiCua(loi, 'xac-nhan') && <span className="block text-[11px] text-late">Chưa đánh dấu xác nhận</span>}
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
        luat="Đóng lộ trình chỉ nói “không học theo lộ trình này nữa”. Có đạt Target hay không là kết luận riêng. Em học lại thì mở một lộ trình MỚI. KHÔNG lấy một lượt Mock Test làm kết quả thi thật: MT chấm nội bộ, không có phòng thi và không có chứng chỉ.">
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

/**
 * THÔNG TIN HỌC VIÊN — mục 1 của menu (mục 5.1). Với lớp Fast Track, Target và kế hoạch thi thật sửa ở mục `Lộ trình`; với lớp thường,
 * giai đoạn đang học đọc ở đây, sửa `Lộ trình tiếp theo` ở mục riêng (PR-LT). PR-NT (04/10): lớp thường sửa Target + Dự kiến thi ở đây —
 * chỉ để theo dõi, không kỳ vọng/SOS. Đổi Target bắt lý do + `cycle.edit` (máy chủ đi qua `reviseTarget`).
 */
function ThongTinPanel({ studentName, lop, onClose, onDone, student, cycle, attempts, canEditCycle, onDeXuatSua }: ChungViec & {
  student: { id: number; name: string; dob?: string | null; email?: string | null; consultantName?: string | null; note?: string | null };
  cycle: any | null; attempts: any[]; canEditCycle?: boolean; onDeXuatSua?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [fullName, setFullName] = useState(student.name);
  /* Ô ngày thống nhất: giá trị ISO; gõ sai thì ô tự báo lỗi dưới ô và trả '' (xem `luu` — không để '' đó xoá mất ngày sinh). */
  const [dob, setDob] = useState(student.dob ?? '');
  const [email, setEmail] = useState(student.email ?? '');
  const tuanCu: string = cycle?.startWeek?.week_start ?? '';
  const [tuan, setTuan] = useState(tuanCu);
  const [consultantName, setConsultant] = useState(student.consultantName ?? '');
  const [note, setNote] = useState(student.note ?? '');
  /* PR-NT: Target + Dự kiến thi lớp thường. Target: '' = chưa có, KCK = không cam kết, còn lại là band. */
  const targetCu: string = cycle?.khongCamKet ? KCK : cycle?.target != null ? String(cycle.target) : '';
  const [target, setTarget] = useState(targetCu);
  const [lyDo, setLyDo] = useState('');
  const thiCu: string = cycle?.examDate ?? cycle?.examMonth ?? '';
  const [thi, setThi] = useState(thiCu);
  const suaMucTieu = !!cycle?.ratio;
  const doiTarget = suaMucTieu && !!canEditCycle && target !== targetCu;
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const loi = dsLoi([{ khoa: 'ho-ten', nhan: 'Họ tên', toiThieu: 1 }], { 'ho-ten': fullName });
  const loiEmail = docEmail(email).loi;
  if (loiEmail) loi.push({ khoa: 'email', nhan: 'Email', lyDo: loiEmail });
  if (cycle && !tuan) loi.push({ khoa: 'tuan', nhan: 'Tuần bắt đầu', lyDo: 'Chưa chọn' });
  if (doiTarget && target !== KCK && target !== '' && !laBand(target)) loi.push({ khoa: 'target', nhan: 'Target', lyDo: 'Band từ 0 đến 9, bước 0.5 — hoặc chọn KCK' });
  if (doiTarget) loi.push(...dsLoi([{ khoa: 'ly-do-target', nhan: 'Lý do đổi Target', toiThieu: 1 }], { 'ly-do-target': lyDo }));
  const thieu = loi.map((l) => l.nhan);
  /*
   * M6, K2-33(2): đổi tuần bắt đầu của lộ trình FT thì máy chủ dời các lượt MT hệ thống tự xếp (`auto`), chưa làm, chưa có điểm — nói
   * trước lượt nào dời sang tuần nào (cùng luật tuần học `tuanHocCuaMt` của PR-MT). Lượt QL chốt tay / đã có điểm đứng yên.
   */
  const route: string | null = cycle?.route ?? null;
  const cauDoi = tuan !== tuanCu ? cauMtSeDoi(route, attempts, tuan, homNay) : undefined;

  const luu = async () => {
    lf.bam();
    if (thieu.length > 0) return;
    /* Ô ngày sinh còn chữ mà giá trị rỗng = gõ sai (lỗi đang hiện dưới ô) — không gửi '' đi xoá ngày sinh cũ. */
    if (!dob && (document.getElementById(lf.oId('ngay-sinh')) as HTMLInputElement | null)?.value.trim()) {
      toast.push('error', 'Ngày sinh chưa đúng — sửa lại hoặc xoá hết ô.');
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/students/${student.id}`, {
        fullName, dob: dob || null, email: email.trim() || null, consultantName: consultantName || null, note: note || null,
      });
      /* Tuần bắt đầu (+ Target, Dự kiến thi lớp thường) nằm ở LỘ TRÌNH — MỘT lời gọi, chỉ gửi trường đã đổi (máy chủ kiểm lại). */
      const doi = {
        ...(cycle && tuan !== tuanCu ? { startWeek: tuan } : {}),
        ...(doiTarget ? { targetScore: target === '' ? null : target === KCK ? KCK : Number(target), lyDo: lyDo.trim() } : {}),
        ...(suaMucTieu && thi !== thiCu ? { examDate: thi } : {}),
      };
      if (cycle && Object.keys(doi).length) {
        await api.patch(`/cycles/${cycle.id}`, doi);
        invalidate('/cycles'); invalidate('/attempts');
      }
      invalidate('/students'); toast.push('ok', 'Đã lưu'); onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={NHAN_VIEC.info} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>Lưu</button>,
      }}>
      <Khoi tieuDe="Học viên">
        <Truong nhan="Họ tên" batBuoc loi={lf.loiCua(loi, 'ho-ten')}>
          <input className="field w-full" {...lf.o(loi, 'ho-ten')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Truong>
        <Truong nhan="Ngày sinh" tuyChon>
          <ONgay kieu="ngay" toiDa={homNay} id={lf.oId('ngay-sinh')} value={dob} onChange={setDob} />
        </Truong>
        <Truong nhan="Email" tuyChon loi={lf.loiCua(loi, 'email')}
          phu={!email.trim() && !student.email ? 'Chưa có email — bổ sung khi có' : undefined}>
          <input className="field w-full" type="email" inputMode="email" autoComplete="off" {...lf.o(loi, 'email')}
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ví dụ: an.nguyen@gmail.com" />
        </Truong>
        <Truong nhan="Tư vấn viên" tuyChon>
          <input className="field w-full" value={consultantName} onChange={(e) => setConsultant(e.target.value)} />
        </Truong>
        <Truong nhan="Ghi chú" tuyChon>
          <textarea className="field w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>
      {cycle && (
        <Khoi tieuDe="Giai đoạn đang học"
          luat={cycle.ratio
            ? 'Giai đoạn là chương trình đang học; tuần kết thúc suy ra từ tuần bắt đầu và độ dài chương trình. Target và Dự kiến thi chỉ để theo dõi — lớp thường không tính kỳ vọng hay SOS theo Target. Ghi dự định sau lớp này ở mục Lộ trình tiếp theo.'
            : 'Sửa Target, kế hoạch thi thật, điểm đầu vào và lịch MT ở mục Lộ trình. Đổi Target ở đâu cũng bắt ghi lý do và ngày hiệu lực.'}>
          <Truong nhan="Tuần bắt đầu" batBuoc loi={lf.loiCua(loi, 'tuan')} phu={cauDoi}>
            <ONgay kieu="tuan" id={lf.oId('tuan')} onBlur={lf.roi('tuan')} invalid={!!lf.loiCua(loi, 'tuan')}
              value={tuan} onChange={setTuan} />
          </Truong>
          {cycle.ratio ? (
            <>
              <p className="m-0 text-sm text-slate-200">
                {cycle.programmeName ?? cycle.label}
                {cycle.endWeek && <span className="text-slate-500"> · kết thúc {tuanLich(cycle.endWeek.weekStart, homNay)}</span>}
              </p>
              {canEditCycle ? (
                <Truong nhan="Target" tuyChon loi={lf.loiCua(loi, 'target')} phu={`Band 0–9, bước 0,5. KCK: ${GIAI_THICH_KCK}.`}>
                  <span className="flex flex-wrap items-center gap-2">
                    <input className="field max-w-[8rem]" type="number" inputMode="decimal" step="0.5" min={0} max={9} aria-label="Target"
                      {...lf.o(loi, 'target')} value={target === KCK ? '' : target} disabled={target === KCK}
                      onChange={(e) => setTarget(e.target.value)} />
                    <NutChon nho chon={target === KCK} onClick={() => setTarget(target === KCK ? '' : KCK)}>Không cam kết (KCK)</NutChon>
                  </span>
                </Truong>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
                  <span>Target: {targetCu ? <strong><TargetText band={cycle.target ?? null} kck={!!cycle.khongCamKet} /></strong> : <span className="text-slate-500">chưa có</span>}</span>
                  {onDeXuatSua && (
                    <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={onDeXuatSua}
                      title="Target do Quản lý sửa — gửi đề xuất để Quản lý duyệt">Đề xuất sửa</button>
                  )}
                </div>
              )}
              {doiTarget && (
                <Truong nhan="Lý do đổi Target" batBuoc loi={lf.loiCua(loi, 'ly-do-target')} phu="Ghi vào Hành trình — sau này đọc lại biết vì sao Target đổi.">
                  <input className="field w-full" maxLength={2000} {...lf.o(loi, 'ly-do-target')} value={lyDo}
                    onChange={(e) => setLyDo(e.target.value)} placeholder="Ví dụ: Gia đình đổi kế hoạch thi" />
                </Truong>
              )}
              <Truong nhan="Dự kiến thi" tuyChon phu="Biết ngày thì gõ dd/mm/yyyy; mới biết tháng thì gõ mm/yyyy.">
                <ONgay kieu="ngay-hoac-thang" value={thi} goiY="dd/mm/yyyy hoặc mm/yyyy" onChange={setThi} />
              </Truong>
            </>
          ) : (
            <p className="m-0 text-sm text-slate-200">
              {cycle.label}
              {cycle.target !== null && cycle.target !== undefined && <span className="text-slate-500"> · Target {fmtBand(cycle.target)}</span>}
              {cycle.examPlan?.confidence !== 'none' && <span className="text-slate-500"> · dự kiến thi {cycle.examPlan?.label}</span>}
            </p>
          )}
        </Khoi>
      )}
    </KhungPanel>
  );
}
