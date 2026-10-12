import { useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import {
  NHAN_VIEC_QUAN_LY, mucQuanLyHocVien, cacTabTrangThai, type LopHocQuyen, type ViecQuanLy, type TabTrangThai, dsLoi, docEmail,
  cauMtSeDoi, tuanLich, GIAI_THICH_KCK, KCK, roundToHalf, type NguoiChon, duongLoTrinhLop,
} from '@shared/domain/index.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { hoanTacHangLoat } from './hangLoatEm.ts';
import { ChuyenLopPanel } from './ChuyenLopPanel.tsx';
import { XoaHocVienPanel } from './XoaHocVienPanel.tsx';
import { DeXuatSuaPanel } from '../duyet/DeXuatSuaPanel.tsx';
import { laBand } from './StudentPlanPanel.tsx';
import { KetQuaThiThatPanel } from './KetQuaThiThatPanel.tsx';
import { ErrorState, NutChon, Skeleton, TargetText } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { ChonNguoi, type NguoiTrongDs } from '../../ui/PeoplePicker.tsx';

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

export function StudentManagePanel({ viec, onClose, student, lop, cycle, attempts, onDone, soViPhamMo = 0, quyen, lopHoc, onDeXuatSua }: {
  /** Việc đang mở; `null` = không mở gì. `lo-trinh` do nơi gọi mở (StudentPlanPanel), không qua đây. */
  viec: ViecQuanLy | null; onClose: () => void;
  student: ThongTinEm;
  /** Mã lớp hiện ở đầu ngăn. */
  lop?: string | null;
  cycle: any | null;
  attempts: any[];
  onDone: () => void;
  /** PR-UXF-b (O2): số vi phạm Ý thức còn mở — lấy từ dữ liệu hồ sơ đã nạp (một nguồn với ô Ý thức), không gọi thêm. */
  soViPhamMo?: number;
  /** Quyền người xem (từ `viewer` của hồ sơ) — Sửa thông tin khoá / mở từng ô theo đó; máy chủ kiểm lại. */
  quyen: QuyenSua;
  /** PR-OV2b: quyền theo lớp — panel Tạm dừng / Thôi học chỉ mở tab được phép. */
  lopHoc?: { quyen: LopHocQuyen } | null;
  onDeXuatSua?: () => void;
}) {
  if (!viec || viec === 'lo-trinh') return null;
  const xong = () => { onDone(); onClose(); };
  const chung = { studentId: student.id, studentName: student.name, lop, onClose, onDone: xong };
  switch (viec) {
    /* OV-3b: mở hộp Lộ trình của em ở hồ sơ lớp › Lộ trình tiếp theo (một chỗ làm). */
    case 'lo-trinh-tiep': return student.classId ? <Navigate to={duongLoTrinhLop(student.classId, student.id)} /> : null;
    case 'chuyen-lop': return <ChuyenLopPanel open cheDo="lenh" {...chung} />;
    case 'de-xuat-chuyen-lop': return <ChuyenLopPanel open cheDo="de-xuat" {...chung} />;
    case 'tam-dung-thoi-hoc': return <TamDungThoiHocPanel {...chung} tabs={cacTabTrangThai(lopHoc?.quyen, student.status)} soViPhamMo={soViPhamMo} />;
    case 'quay-lai': return <TrangThaiPanel {...chung} status="active" soViPhamMo={soViPhamMo} />;
    case 'hoc-lai': return <HocLaiPanel {...chung} />;
    case 'luu-tru': return <LuuTruPanel {...chung} boLuuTru={false} />;
    case 'bo-luu-tru': return <LuuTruPanel {...chung} boLuuTru />;
    case 'outcome': return <KetQuaThiThatPanel cycleId={cycle.id} studentName={chung.studentName} lop={chung.lop} onClose={chung.onClose} onDone={chung.onDone} />;
    case 'info': return <ThongTinPanel {...chung} student={student} cycle={cycle} attempts={attempts} quyen={quyen} onDeXuatSua={onDeXuatSua} />;
    case 'xoa-hoc-vien': return <XoaHocVienPanel studentId={student.id} studentName={student.name} lop={lop} onClose={onClose} />;
    case 'de-xuat-sua': return (
      <DeXuatSuaPanel studentId={student.id} studentName={student.name} lop={lop} onClose={onClose}
        hienTai={{ target: cycle?.target ?? null, khongCamKet: !!cycle?.khongCamKet, route: cycle?.route ?? null }} />
    );
    default: return null;
  }
}

/** Dữ liệu em cho Sửa thông tin — đúng các trường hồ sơ (`/students/:id`) trả. */
export type ThongTinEm = {
  id: number; name: string; classId: number | null;
  dob?: string | null; email?: string | null; consultantName?: string | null; note?: string | null; status?: string;
  tvv?: { id: number; ten: string } | null; tvvChon?: NguoiTrongDs[] | null;
};
/** `canEdit` = `student.edit` (QL, GVCN) · `coTheSuaThongTin` = thêm Admin / TVV / CX · `canEditCycle` = Target sửa thẳng (QL). */
export type QuyenSua = { canEdit: boolean; coTheSuaThongTin?: boolean; canEditCycle?: boolean; coTheDeXuatSua?: boolean };

/**
 * SỬA THÔNG TIN MỘT EM TỪ DÒNG BẢNG (PR-OV2b — ⋯ dòng ở hồ sơ lớp / Học viên & Lớp): nạp hồ sơ em rồi mở đúng panel của ⋯ hồ sơ HV.
 */
export function SuaThongTinMotEm({ studentId, studentName, lop, onClose, onDone }: {
  studentId: number; studentName: string; lop?: string | null; onClose: () => void; onDone: () => void;
}) {
  const { data, error, reload } = useApi<any>(`/students/${studentId}`, [studentId]);
  const [deXuat, setDeXuat] = useState(false);
  if (error) return <KhungPanel tieuDe={NHAN_VIEC.info} hocVien={studentName} lop={lop} onDong={onClose}><ErrorState message={error.message} hint={error.hint} onRetry={reload} /></KhungPanel>;
  if (!data) return <KhungPanel tieuDe={NHAN_VIEC.info} hocVien={studentName} lop={lop} onDong={onClose}><Skeleton rows={6} /></KhungPanel>;
  return (
    <StudentManagePanel viec={deXuat ? 'de-xuat-sua' : 'info'} onClose={onClose} lop={lop} cycle={data.cycle} attempts={data.attempts ?? []} onDone={onDone}
      student={thongTinEmCua(data)} quyen={data.viewer} onDeXuatSua={() => setDeXuat(true)} />
  );
}

/** Hồ sơ (`/students/:id`) → dữ liệu Sửa thông tin. Chung cho hồ sơ HV và ⋯ dòng. */
export function thongTinEmCua(d: any): ThongTinEm {
  return {
    id: d.id, name: d.fullName, classId: d.currentClass?.id ?? null, dob: d.dob ?? null, email: d.email ?? null,
    consultantName: d.consultantName ?? null, note: d.note ?? null, status: d.status, tvv: d.tvv ?? null, tvvChon: d.tvvChon ?? null,
  };
}

// ==================================================================== các panel

type ChungViec = { studentId: number; studentName: string; lop?: string | null; onClose: () => void; onDone: () => void };

/**
 * PR-OV2b (mockup overhaul-2 §6): MỘT mục "Tạm dừng / Thôi học", panel nhỏ hai tab — Tạm dừng (= Tạm dừng học, inactive) · Thôi học
 * (= Kết thúc học, finished, có Hoàn tác). Luật mỗi tab giữ nguyên `TrangThaiPanel`; tab không được phép thì không có.
 */
function TamDungThoiHocPanel({ tabs, soViPhamMo, ...chung }: ChungViec & { tabs: TabTrangThai[]; soViPhamMo?: number }) {
  const [tab, setTab] = useState<TabTrangThai>(tabs[0] ?? 'thoi-hoc');
  return (
    <TrangThaiPanel {...chung} status={tab === 'tam-dung' ? 'inactive' : 'finished'} soViPhamMo={soViPhamMo} tieuDeKhung={NHAN_VIEC['tam-dung-thoi-hoc']}
      dau={tabs.length > 1 ? (
        <HangTab cap="con" ariaLabel="Tạm dừng hoặc thôi học" value={tab} onChange={setTab}
          tabs={tabs.map((k) => ({ key: k, label: k === 'tam-dung' ? 'Tạm dừng' : 'Thôi học' }))} />
      ) : null} />
  );
}

/**
 * TẠM DỪNG HỌC / QUAY LẠI HỌC / KẾT THÚC HỌC (PR-LT, §3.9.4, Q9). Cùng một panel, ba trạng thái — lý do bắt buộc khi dừng/kết thúc; ngày hiệu
 * lực tuỳ chọn (mặc định hôm nay ở máy chủ).
 */
function TrangThaiPanel({ studentId, studentName, lop, onClose, onDone, status, soViPhamMo = 0, tieuDeKhung, dau }: ChungViec & {
  status: 'active' | 'inactive' | 'finished'; soViPhamMo?: number; tieuDeKhung?: string; dau?: ReactNode;
}) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const canDoLuon = status === 'active';
  const tieuDe = status === 'active' ? NHAN_VIEC['quay-lai'] : status === 'inactive' ? 'Tạm dừng học' : 'Thôi học';
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
      /* PR-LUI-b (06/10): Kết thúc học có Hoàn tác — mở lại đúng ghi danh / lộ trình / Case / PA lần này đóng (máy chủ: `hoan-tac-ket-thuc`). */
      if (status === 'finished') {
        toast.hoanTac(`Đã cho ${studentName} thôi học`, async () => {
          const r = await hoanTacHangLoat('ket-thuc', [studentId]);
          for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases']) invalidate(k);
          if (r.failed.length) { toast.push('error', r.failed[0].message); return; }
          toast.push('ok', 'Đã hoàn tác');
          onDone();
        }, { key: `ket-thuc:${studentId}` });
      } else toast.push('ok', 'Đã lưu');
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={tieuDeKhung ?? tieuDe} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{tieuDe}</button>,
      }}>
      {dau}
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
        {lf.loiCua(loi, 'xac-nhan') && <span className="block text-xs text-late">Chưa đánh dấu xác nhận</span>}
      </Khoi>
    </KhungPanel>
  );
}

type LopDich = { id: number; code: string; ft: boolean; ma: string | null; route: string | null; tenChuongTrinh: string | null; tuan: string | null; gvcn: string | null; siSo?: number };
type DuLieuHocLai = { lopCu: { id: number; code: string; daKetThuc: boolean; ft: boolean } | null; loTrinh: { chayTiep: boolean; ten: string | null; target: string }; chiNhanh: { id: number; name: string }[]; lop: LopDich[] };

/**
 * HỌC LẠI (PR-LUI-b, chủ sản phẩm 06/10) — đường lui của Kết thúc học, chỉ Quản lý / Quản trị. CHỌN ĐÍCH: `Về lớp cũ` (lộ trình cũ chạy tiếp; lớp cũ đã kết thúc thì
 * mở lại cùng lúc) hoặc `Sang lớp mới` (chọn lớp đang học, mở lộ trình mới, lộ trình cũ giữ ở Hành trình; sang Fast Track từ lớp thường phải có Target).
 * Lý do tuỳ chọn. Hoàn tác = `hoan-tac-hoc-lai` (máy chủ trả học viên về đúng trạng thái sau Kết thúc học; lộ trình mới đã có dữ liệu thì từ chối kèm câu rõ).
 */
function HocLaiPanel({ studentId, studentName, lop, onClose, onDone }: ChungViec) {
  const toast = useToast();
  const lf = useLoiForm();
  const { data, error, reload } = useApi<DuLieuHocLai>(`/students/${studentId}/hoc-lai/lop-dich`, [studentId]);
  const [dich, setDich] = useState<'cu' | 'moi'>('cu');
  const [lopMoiId, setLopMoiId] = useState<number | ''>('');
  const [targetGo, setTargetGo] = useState<string | null>(null);   // null = chưa gõ → dùng Target cũ khi FT → FT
  const [thi, setThi] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const [busy, setBusy] = useState(false);
  const lopMoi = data?.lop.find((l) => l.id === lopMoiId) ?? null;
  const canTarget = dich === 'moi' && !!lopMoi?.ft;
  /* FT → FT: máy chủ giữ Target cũ → điền sẵn, không bắt nhập lại; từ lớp thường lên FT mới bắt buộc. */
  const giuTargetCu = !!data?.lopCu?.ft;
  const target = targetGo ?? (giuTargetCu ? data?.loTrinh.target ?? '' : '');
  const setTarget = (v: string) => setTargetGo(v);
  const loi = dsLoi([...(dich === 'moi' ? [{ khoa: 'lop', nhan: 'Lớp', toiThieu: 1 }] : [])], { lop: lopMoiId === '' ? '' : String(lopMoiId) });
  if (canTarget && !giuTargetCu && !target.trim()) loi.push({ khoa: 'target', nhan: 'Target', lyDo: 'Lên FT cần Target' });
  /* Tên lộ trình đúng như hồ sơ gọi: lớp FT = LT1 / RF…, lớp thường = chương trình (FOU…). */
  const tenLoTrinhMoi = lopMoi ? (lopMoi.ft ? lopMoi.route : lopMoi.ma) : null;
  const chan = !data?.lopCu ? 'Chưa có lớp để học lại' : null;

  const luu = async () => {
    lf.bam();
    if (loi.length) return;
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/hoc-lai`, {
        date: ngayHl || undefined, lyDo: lyDo.trim() || undefined, moLaiLop: true,
        ...(dich === 'moi' ? { lopMoiId, mucTieu: canTarget && target.trim() ? (target.trim().toUpperCase() === KCK ? KCK : Number(target)) : undefined, thangThi: thi || undefined } : {}),
      });
      for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases']) invalidate(k);
      toast.hoanTac(`Đã cho ${studentName} học lại${lopMoi ? ` · ${lopMoi.code}` : ''}`, async () => {
        const r = await hoanTacHangLoat('hoc-lai', [studentId]);
        for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases']) invalidate(k);
        if (r.failed.length) { toast.push('error', r.failed[0].message); return; }
        toast.push('ok', 'Đã hoàn tác');
        onDone();
      }, { key: `hoc-lai:${studentId}` });
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={NHAN_VIEC['hoc-lai']} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        daSua: !!lyDo.trim() || !!ngayHl || dich === 'moi',
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy || !data || !!chan}>Học lại</button>,
      }}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <Skeleton rows={4} /> : (
          <Khoi tieuDe="Học lại">
            {chan ? <p className="m-0 text-sm text-late">{chan}</p> : null}
            <span role="group" aria-label="Học lại" className="flex flex-wrap gap-1.5">
              <NutChon chon={dich === 'cu'} onClick={() => setDich('cu')}>Về lớp cũ</NutChon>
              <NutChon chon={dich === 'moi'} onClick={() => setDich('moi')}>Sang lớp mới</NutChon>
            </span>
            {dich === 'cu' ? (
              <ul className="m-0 list-none space-y-1 p-0 text-sm text-slate-200">
                <li>Về lớp {data.lopCu?.code}</li><li>{data.loTrinh.chayTiep ? 'Lộ trình chạy tiếp' : 'Lộ trình mới'}{data.loTrinh.ten ? ` · ${data.loTrinh.ten}` : ''}</li><li>Ra khỏi Lưu trữ</li>
                {data.lopCu?.daKetThuc && <li className="text-soon">Mở lại lớp {data.lopCu.code}</li>}
              </ul>
            ) : (
              <>
                <Truong nhan="Lớp" batBuoc loi={lf.loiCua(loi, 'lop')}>
                  <select className="field w-full" {...lf.o(loi, 'lop')} value={lopMoiId} onChange={(e) => setLopMoiId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Chọn lớp</option>
                    {data.lop.filter((l) => l.id !== data.lopCu?.id).map((l) => <option key={l.id} value={l.id}>{[l.code, l.ft ? 'Fast Track' : l.tenChuongTrinh, l.gvcn ? `GVCN ${l.gvcn}` : null, l.siSo != null ? `${l.siSo} em` : null].filter(Boolean).join(' · ')}</option>)}
                  </select>
                </Truong>
                {canTarget && (
                  <>
                    <Truong nhan="Target" batBuoc={!giuTargetCu} loi={lf.loiCua(loi, 'target')}>
                      <input className="field w-full max-w-[8rem]" inputMode="decimal" placeholder="Ví dụ: 6.5" {...lf.o(loi, 'target')} value={target} onChange={(e) => setTarget(e.target.value)} />
                    </Truong>
                    <Truong nhan="Dự kiến thi" tuyChon><ONgay kieu="ngay-hoac-thang" value={thi} goiY="dd/mm/yyyy hoặc mm/yyyy" onChange={setThi} /></Truong>
                  </>
                )}
                {lopMoi && (
                  <ul className="m-0 list-none space-y-1 p-0 text-sm text-slate-200">
                    <li>Vào lớp {lopMoi.code}</li><li>Lộ trình mới{tenLoTrinhMoi ? ` · ${tenLoTrinhMoi}` : ''}</li><li>Lộ trình cũ giữ ở Hành trình</li><li>Ra khỏi Lưu trữ</li>
                  </ul>
                )}
              </>
            )}
            <Truong nhan="Có hiệu lực từ"><ChonNgayGan value={ngayHl} onChange={setNgayHl} soNgay={30} chuaChon="Mặc định: hôm nay" /></Truong>
            <Truong nhan="Lý do" tuyChon><input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} /></Truong>
          </Khoi>
        )}
    </KhungPanel>
  );
}

/**
 * SỬA THÔNG TIN (PR-OV2b, mockup overhaul-2 §6): Họ tên · Ngày sinh * · Email * · TVV (chọn người) · Dự kiến thi · Target · Điểm đầu vào (FT);
 * QL / GVCN thêm Tuần bắt đầu + Ghi chú. Admin / TVV / CX (`student.edit_info`): Target chỉ đọc, không Tuần bắt đầu / Ghi chú.
 * Target: `cycle.edit` sửa thẳng kèm lý do (`target-revision`); GVCN cùng ô → Đề xuất sửa gửi QL duyệt (`de-xuat-sua`).
 * Lưu một lần, ba phần theo thứ tự (hồ sơ + TVV + điểm đầu vào · lộ trình · Target): phần lỗi báo đúng phần, phần đã lưu nói rõ, panel còn mở.
 */
function ThongTinPanel({ studentName, lop, onClose, onDone, student, cycle, attempts, quyen, onDeXuatSua }: ChungViec & {
  student: ThongTinEm; cycle: any | null; attempts: any[]; quyen: QuyenSua; onDeXuatSua?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const quanLy = quyen.canEdit;                                   // QL, GVCN: thêm Tuần bắt đầu, Ghi chú
  const targetThang = !!quyen.canEditCycle;                       // QL / Quản trị
  const targetDeXuat = quanLy && !targetThang;                    // GVCN
  const [fullName, setFullName] = useState(student.name);
  const [dob, setDob] = useState(student.dob ?? '');
  const [email, setEmail] = useState(student.email ?? '');
  const tvvCu: NguoiChon | null = student.tvv ? { kieu: 'tai_khoan', id: student.tvv.id, ten: student.tvv.ten } : null;
  const [tvv, setTvv] = useState<NguoiChon | null>(tvvCu);
  const [note, setNote] = useState(student.note ?? '');
  const tuanCu: string = cycle?.startWeek?.week_start ?? '';
  const [tuan, setTuan] = useState(tuanCu);
  const thiCu: string = cycle?.examDate ?? cycle?.examMonth ?? '';
  const [thi, setThi] = useState(thiCu);
  /* Target: '' = chưa có, KCK = không cam kết, còn lại là band. */
  const targetCu: string = cycle?.khongCamKet ? KCK : cycle?.target != null ? String(cycle.target) : '';
  const [target, setTarget] = useState(targetCu);
  const [lyDo, setLyDo] = useState('');
  /* Điểm đầu vào — chỉ FT (lớp thường không có, như Thêm học viên). */
  const coDauVao = !!cycle && !cycle.ratio;
  const bl = cycle?.baseline ?? null;
  const dvCu = { l: s5(bl?.bands?.listening), r: s5(bl?.bands?.reading), w: s5(bl?.bands?.writing), s: s5(bl?.bands?.speaking), o: s5(bl?.score) };
  const [dv, setDv] = useState(dvCu);
  const kn = [dv.l, dv.r, dv.w, dv.s];
  const duKn = kn.every((x) => laBand(x));
  const overall = duKn ? String(roundToHalf(kn.reduce((a, x) => a + Number(x), 0) / 4)) : dv.o;
  const doiDauVao = coDauVao && JSON.stringify(dv) !== JSON.stringify(dvCu);
  const doiTarget = !!cycle && (targetThang || targetDeXuat) && target !== targetCu;
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* Lỗi máy chủ gắn đúng ô (câu lỗi mở đầu bằng tên ô); gõ lại thì bỏ. */
  const [loiMay, setLoiMay] = useState<{ khoa: string; nhan: string; lyDo: string } | null>(null);
  const sua = <T,>(f: (v: T) => void) => (v: T) => { setLoiMay(null); f(v); };

  const loi = dsLoi([{ khoa: 'ho-ten', nhan: 'Họ tên', toiThieu: 1 }], { 'ho-ten': fullName });
  if (!dob) loi.push({ khoa: 'ngay-sinh', nhan: 'Ngày sinh', lyDo: 'Bắt buộc' });
  const loiEmail = email.trim() ? docEmail(email).loi : 'Bắt buộc';
  if (loiEmail) loi.push({ khoa: 'email', nhan: 'Email', lyDo: loiEmail });
  if (quanLy && cycle && !tuan) loi.push({ khoa: 'tuan', nhan: 'Tuần bắt đầu', lyDo: 'Chưa chọn' });
  if (doiTarget && target !== KCK && !laBand(target)) loi.push({ khoa: 'target', nhan: 'Target', lyDo: 'Band từ 0 đến 9, bước 0.5 — hoặc chọn KCK' });
  if (doiTarget) loi.push(...dsLoi([{ khoa: 'ly-do-target', nhan: 'Lý do đổi Target', toiThieu: 1 }], { 'ly-do-target': lyDo }));
  if (doiDauVao) {
    if (kn.some((x) => x !== '' && !laBand(x))) loi.push({ khoa: 'dau-vao', nhan: 'Điểm đầu vào', lyDo: 'Band 0–9, bước 0.5' });
    else if (!duKn && dv.o !== '' && !laBand(dv.o)) loi.push({ khoa: 'dau-vao', nhan: 'Điểm đầu vào', lyDo: 'Overall: band 0–9, bước 0.5' });
    else if (!duKn && dv.o === '' && kn.some((x) => x !== '')) loi.push({ khoa: 'dau-vao', nhan: 'Điểm đầu vào', lyDo: 'Nhập đủ L R W S hoặc nhập Overall' });
  }
  if (loiMay) loi.push(loiMay);
  const cauDoi = tuan !== tuanCu ? cauMtSeDoi(cycle?.lichMt ?? [], attempts, tuan, homNay) : undefined;   // OV-6b1: lịch MT của lớp (API)

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    const xong: string[] = [];
    let phan = 'Thông tin';
    try {
      const dauVao = !doiDauVao ? undefined
        : kn.every((x) => x === '') && dv.o === '' ? null
        : duKn ? { listening: Number(dv.l), reading: Number(dv.r), writing: Number(dv.w), speaking: Number(dv.s) }
        : { overall: Number(dv.o), listening: kn[0] || null, reading: kn[1] || null, writing: kn[2] || null, speaking: kn[3] || null };
      const tvvId = tvv?.kieu === 'tai_khoan' ? tvv.id : null;
      await api.patch(`/students/${student.id}`, {
        fullName, dob, email: email.trim(),
        ...(tvvId !== (student.tvv?.id ?? null) ? { consultantUserId: tvvId } : {}),
        ...(quanLy ? { note: note || null } : {}),
        ...(dauVao !== undefined ? { dauVao } : {}),
      });
      xong.push('thông tin');
      /* Lộ trình — chỉ trường đã đổi (máy chủ kiểm lại). */
      const doi = { ...(quanLy && cycle && tuan !== tuanCu ? { startWeek: tuan } : {}), ...(cycle && thi !== thiCu ? { examDate: thi } : {}) };
      if (cycle && Object.keys(doi).length) {
        phan = 'Lộ trình';
        await api.patch(`/cycles/${cycle.id}`, doi);
        xong.push('lộ trình');
      }
      if (doiTarget) {
        phan = 'Target';
        const moi = target === '' ? null : target === KCK ? KCK : Number(target);
        if (targetThang) { await api.post(`/cycles/${cycle.id}/target-revision`, { newTarget: moi, reason: lyDo.trim() }); xong.push('Target'); }
        else { await api.post(`/students/${student.id}/de-xuat-sua`, { truong: 'target', moi: moi ?? '', lyDo: lyDo.trim() }); invalidate('/yeu-cau'); xong.push('đề xuất Target'); }
      }
      for (const k of ['/students', '/cycles', '/attempts', '/classes', '/hoc-vien-lop', '/tong-quan']) invalidate(k);
      toast.push('ok', targetDeXuat && doiTarget ? 'Đã lưu · Target gửi Quản lý duyệt' : 'Đã lưu');
      onDone();
    } catch (e: any) {
      if (xong.length) for (const k of ['/students', '/cycles', '/attempts', '/classes', '/hoc-vien-lop']) invalidate(k);
      const o = oCuaLoi(String(e.message ?? ''));
      if (o) setLoiMay({ ...o, lyDo: String(e.message).replace(/^[^:]+:\s*/, '') });
      toast.push('error', xong.length ? `Đã lưu ${xong.join(', ')} · ${phan} chưa lưu: ${e.message}` : e.message);
    } finally { setBusy(false); }
  };

  const daSua = fullName !== student.name || dob !== (student.dob ?? '') || email !== (student.email ?? '') || tvv?.kieu === 'tai_khoan' && tvv.id !== student.tvv?.id
    || (!tvv && !!student.tvv) || note !== (student.note ?? '') || tuan !== tuanCu || thi !== thiCu || target !== targetCu || doiDauVao;

  return (
    <KhungPanel tieuDe={NHAN_VIEC.info} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        daSua,
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>,
      }}>
      <Khoi tieuDe="Học viên">
        <Truong nhan="Họ tên" batBuoc loi={lf.loiCua(loi, 'ho-ten')}>
          <input className="field w-full" {...lf.o(loi, 'ho-ten')} value={fullName} onChange={(e) => sua(setFullName)(e.target.value)} />
        </Truong>
        <Truong nhan="Ngày sinh" batBuoc loi={lf.loiCua(loi, 'ngay-sinh')}
          phu={!student.dob ? 'Em chưa có ngày sinh — điền để lưu' : undefined}>
          <ONgay kieu="ngay" toiDa={homNay} id={lf.oId('ngay-sinh')} onBlur={lf.roi('ngay-sinh')} invalid={!!lf.loiCua(loi, 'ngay-sinh')}
            value={dob} onChange={sua(setDob)} />
        </Truong>
        <Truong nhan="Email" batBuoc loi={lf.loiCua(loi, 'email')}
          phu={!student.email ? 'Em chưa có email — điền để lưu' : undefined}>
          <input className="field w-full" type="email" inputMode="email" autoComplete="off" {...lf.o(loi, 'email')}
            value={email} onChange={(e) => sua(setEmail)(e.target.value)} placeholder="Ví dụ: an.nguyen@gmail.com" />
        </Truong>
        <Truong nhan="TVV" tuyChon loi={lf.loiCua(loi, 'tvv')}
          phu={[student.consultantName ? `Ghi cũ: “${student.consultantName}”` : null,
            !(student.tvvChon ?? []).length ? 'Chưa có tài khoản Tư vấn viên — Quản trị tạo ở Tài khoản' : null].filter(Boolean).join(' · ') || undefined}>
          <ChonNguoi nhom="nhan_vien" choToi={false} choNgoai={false} ds={student.tvvChon ?? []} choTrong="— Chưa chọn —"
            placeholder="Chọn tư vấn viên" ariaLabel="TVV" id={lf.oId('tvv')} invalid={!!lf.loiCua(loi, 'tvv')}
            value={tvv} onChange={sua(setTvv)} khongKhop={(go) => `Không có tư vấn viên khớp “${go}”`} />
        </Truong>
        {quanLy && (
          <Truong nhan="Ghi chú" tuyChon>
            <textarea className="field w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Truong>
        )}
      </Khoi>
      {cycle ? (
        <Khoi tieuDe="Lộ trình đang học"
          luat={cycle.ratio
            ? 'Lớp thường: Target và Dự kiến thi chỉ để theo dõi — không tính kỳ vọng hay SOS theo Target. Ghi dự định sau lớp này ở mục Lộ trình tiếp theo.'
            : 'Lịch MT sửa ở mục Lộ trình. Đổi Target ở đâu cũng bắt ghi lý do.'}>
          <p className="m-0 text-sm text-slate-200">
            {cycle.ratio ? (cycle.programmeName ?? cycle.label) : cycle.label}
            {cycle.endWeek && <span className="text-slate-500"> · kết thúc {tuanLich(cycle.endWeek.weekStart, homNay)}</span>}
          </p>
          {quanLy && (
            <Truong nhan="Tuần bắt đầu" batBuoc loi={lf.loiCua(loi, 'tuan')} phu={cauDoi}>
              <ONgay kieu="tuan" id={lf.oId('tuan')} onBlur={lf.roi('tuan')} invalid={!!lf.loiCua(loi, 'tuan')} value={tuan} onChange={setTuan} />
            </Truong>
          )}
          <Truong nhan="Dự kiến thi" tuyChon loi={lf.loiCua(loi, 'thi')} phu="dd/mm/yyyy hoặc mm/yyyy">
            <ONgay kieu="ngay-hoac-thang" id={lf.oId('thi')} value={thi} goiY="dd/mm/yyyy hoặc mm/yyyy" onChange={sua(setThi)} />
          </Truong>
          {targetThang || targetDeXuat ? (
            <Truong nhan="Target" tuyChon loi={lf.loiCua(loi, 'target')}
              phu={targetDeXuat ? 'Lưu thành Đề xuất sửa — Quản lý duyệt rồi Target mới đổi.' : `Band 0–9, bước 0,5. KCK: ${GIAI_THICH_KCK}.`}>
              <span className="flex flex-wrap items-center gap-2">
                <input className="field max-w-[8rem]" type="number" inputMode="decimal" step="0.5" min={0} max={9} aria-label="Target"
                  {...lf.o(loi, 'target')} value={target === KCK ? '' : target} disabled={target === KCK}
                  onChange={(e) => sua(setTarget)(e.target.value)} />
                <NutChon nho chon={target === KCK} onClick={() => sua(setTarget)(target === KCK ? '' : KCK)}>Không cam kết (KCK)</NutChon>
              </span>
            </Truong>
          ) : (
            <div className="text-sm text-slate-200">
              Target: {targetCu ? <strong><TargetText band={cycle.target ?? null} kck={!!cycle.khongCamKet} /></strong> : <span className="text-slate-500">chưa có</span>}
              <span className="text-slate-500"> · Quản lý sửa</span>
            </div>
          )}
          {doiTarget && (
            <Truong nhan="Lý do đổi Target" batBuoc loi={lf.loiCua(loi, 'ly-do-target')}
              phu={targetDeXuat ? 'Quản lý đọc lý do này khi duyệt.' : 'Ghi vào Hành trình — sau này đọc lại biết vì sao Target đổi.'}>
              <input className="field w-full" maxLength={2000} {...lf.o(loi, 'ly-do-target')} value={lyDo}
                onChange={(e) => setLyDo(e.target.value)} placeholder="Ví dụ: Gia đình đổi kế hoạch thi" />
            </Truong>
          )}
          {targetDeXuat && onDeXuatSua && (
            <button type="button" className="btn btn-sm btn-ghost self-start min-h-[44px] sm:min-h-0" onClick={onDeXuatSua}>Đề xuất sửa lộ trình / thông tin khác…</button>
          )}
          {coDauVao && (
            <Truong as="div" nhan="Điểm đầu vào" tuyChon loi={lf.loiCua(loi, 'dau-vao')}
              phu={bl?.attemptId ? `Đang lấy từ MT${bl.attemptNo ?? ''} · gõ tay thì thay` : 'Đủ L R W S thì Overall tự tính'}>
              <span className="flex flex-wrap items-center gap-2" id={lf.oId('dau-vao')} onBlur={lf.roi('dau-vao')}>
                {(['l', 'r', 'w', 's'] as const).map((k) => (
                  <label key={k} className="flex items-center gap-1 text-xs text-slate-400">
                    {k.toUpperCase()}
                    <input className="field w-16 tabular-nums" inputMode="decimal" aria-label={`Điểm đầu vào ${k.toUpperCase()}`}
                      aria-invalid={!!lf.loiCua(loi, 'dau-vao')} value={dv[k]} onChange={(e) => sua(setDv)({ ...dv, [k]: e.target.value.replace(',', '.') })} />
                  </label>
                ))}
                <label className="flex items-center gap-1 text-xs text-slate-400">
                  Overall
                  {duKn
                    ? <strong className="w-16 tabular-nums text-sm text-slate-100" aria-label="Overall tự tính">{overall}</strong>
                    : <input className="field w-16 tabular-nums" inputMode="decimal" aria-label="Điểm đầu vào Overall" aria-invalid={!!lf.loiCua(loi, 'dau-vao')}
                        value={dv.o} onChange={(e) => sua(setDv)({ ...dv, o: e.target.value.replace(',', '.') })} />}
                </label>
              </span>
            </Truong>
          )}
        </Khoi>
      ) : (
        <Khoi tieuDe="Lộ trình đang học">
          <p className="m-0 text-sm text-slate-400">Em chưa có lộ trình — Dự kiến thi, Target, Điểm đầu vào sửa được sau khi em vào lớp.</p>
        </Khoi>
      )}
    </KhungPanel>
  );
}

/** Band → chữ cho ô ('' khi trống). */
function s5(v: number | null | undefined): string { return v == null ? '' : String(v); }

/** Câu lỗi máy chủ mở đầu bằng tên ô ("Email: …", "Ngày sinh: …") → ô đó. */
function oCuaLoi(m: string): { khoa: string; nhan: string } | null {
  const o: [RegExp, string, string][] = [[/^Họ tên/, 'ho-ten', 'Họ tên'], [/^Ngày sinh/, 'ngay-sinh', 'Ngày sinh'], [/^Email/, 'email', 'Email'],
    [/^TVV/, 'tvv', 'TVV'], [/^Dự kiến thi/, 'thi', 'Dự kiến thi'], [/^Điểm đầu vào/, 'dau-vao', 'Điểm đầu vào'], [/Target/, 'target', 'Target']];
  const x = o.find(([re]) => re.test(m));
  return x ? { khoa: x[1], nhan: x[2] } : null;
}
