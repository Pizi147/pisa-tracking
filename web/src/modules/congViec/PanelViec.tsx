import { lazyHop } from '../../ui/lazyHop.tsx';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { LuoiTrongPanel } from '../../ui/LuoiTrongPanel.tsx';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { DauViecCongViec, HienLaiPanel, KhungPanel, NhapViec, Truong } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { XemCaseViec, useXem } from '../../lib/quayLai.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { chonNguoi, phuGv } from '../classes/ClassCreatePanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { NganCase } from '../students/NganCase.tsx';
import { tenNganCase, type CaseDetail } from '../cases/CasePanel.tsx';
import { DoiNguoiPhuTrach } from '../cases/DoiNguoiPhuTrach.tsx';
import { DaThucHienPanel } from '../yThuc/DaThucHienPanel.tsx';
import { PanelHoiTinhHinh } from '../yThuc/TinhHinh.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { LuoiChamLop, duongCham, duongDiemTheoLuot, type BangTheoLuot, type Cham } from '../cham/LuoiChamLop.tsx';
import { LuoiNhung } from '../test/lichTest/LuoiNhung.tsx';
import { khopKn } from '../cham/LuoiFT.tsx';
import { oThuong } from '../cham/LuoiThuong.tsx';
import { XacNhanPaLo } from './XacNhanPaLo.tsx';
import { LuoiKetQuaPa } from './LuoiKetQuaPa.tsx';
import { tenBoEm } from './DanhSachViec.tsx';
import { KHOA_CHAM_SPEAKING, conThieuFt, demBaiViec, LOAI_HAN_CUA_VIEC, duongLichTest, emCuaViec, laViecChamCheo, tenMon, tuanLich, quyCheNhapDiem, quyChePhanCong, quyChePhoiHopSos, quyChePhoiHopTvv, quyCheBaoPhTest, shortDate } from '@shared/domain/index.ts';
import { PanelChamSpeaking } from './PanelChamSpeaking.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { laLo, soCuaKhoa } from './lamTaiCho.ts';
import { LoYThucPanel } from '../yThuc/LoYThucPanel.tsx';
import { PanelXemViPham } from '../yThuc/PanelXemViPham.tsx';
import { PanelTraLai } from './PanelTraLai.tsx';
import { PhoiHopSosSection, type CoordTurn } from '../yThuc/PhoiHopSosSection.tsx';
import { BangPhoiHop } from '../yThuc/BangPhoiHop.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { ghiViecMo } from '../../lib/hdNgCanh.ts';
import { KhoiGiaoViec, useGiaoViec } from './KhoiGiaoViec.tsx';
import { PanelNhapDiemTuan, chanViecTiep, hetViec } from './PanelNhapDiemTuan.tsx';
import { dauTuViec } from './dauPanelViec.tsx';
const PanelChotNgayThi = lazyHop(() => import('./PanelSauThi.tsx').then((x) => x.PanelChotNgayThi));
const PanelSauThi = lazyHop(() => import('./PanelSauThi.tsx').then((x) => x.PanelSauThi));
const PanelBaoPhTvv = lazyHop(() => import('./PanelBaoPhTvv.tsx').then((x) => x.PanelBaoPhTvv));
const PanelMeeting = lazyHop(() => import('./PanelMeeting.tsx').then((x) => x.PanelMeeting));
const KhaiBacLoPanel = lazyHop(() => import('../yThuc/KhaiBacLoPanel.tsx').then((x) => x.KhaiBacLoPanel));
const KhaiBacPanel = lazyHop(() => import('../yThuc/KhaiBacPanel.tsx').then((x) => x.KhaiBacPanel));
const SuaThongTinMotEm = lazyHop(() => import('../students/StudentManagePanel.tsx').then((x) => x.SuaThongTinMotEm));
/* TD-NGUOI-2: hộp mở bằng thao tác — mảnh riêng, tải khi mở (`ui/lazyHop.tsx`). */
const PanelXetLai = lazyHop(() => import('../classes/PanelXetLai.tsx').then((x) => x.PanelXetLai));
const PanelChotLoTrinh = lazyHop(() => import('../classes/CuoiKhoaLop.tsx').then((x) => x.PanelChotLoTrinh));
const StudentPlanPanel = lazyHop(() => import('../students/StudentPlanPanel.tsx').then((x) => x.StudentPlanPanel));
const BanGiaoPanel = lazyHop(() => import('../classes/BanGiaoPanel.tsx').then((x) => x.BanGiaoPanel));
const XacNhanXuLyPanel = lazyHop(() => import('../yThuc/XacNhanXuLyPanel.tsx').then((x) => x.XacNhanXuLyPanel));
const BanGiaoGvPanel = lazyHop(() => import('../classes/BanGiaoGvPanel.tsx').then((x) => x.BanGiaoGvPanel));
const PanelNhapDiemLop = lazyHop(() => import('../cham/PanelNhapDiemLop.tsx').then((x) => x.PanelNhapDiemLop));

/**
 * PANEL PHẢI CỦA MỘT VIỆC — dùng lại đúng panel sẵn có (không viết lại): `NganCase` đúng việc, `BanGiaoPanel`, form Ý thức, `NganViecVanHanh`,
 * `MotKyNang` (danh sách em một kỹ năng, ô mở hộp nhập điểm "Lưu · em tiếp ›"). Nơi gọi bọc `KhungTaiCho` để panel nằm tại chỗ.
 * `onDaLam`: việc vừa có thay đổi đã lưu — nơi gọi giữ dòng ở chỗ cũ (mờ + gạch khi máy chủ không còn trả việc đó).
 */
type PropsViec = {
  it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null;
  /** CV-LOI (CV-09): panel do trang tự mở (không phải người bấm) — lưới điểm không đặt con trỏ, không cuộn. */
  tuMo?: boolean;
  /** OV-13c: mở một việc khác tại chỗ (Xác nhận PA cùng lúc → "Đề xuất PA khác cho em này…" mở panel Xác nhận PA của em đó). */
  onMo?: (it: WorkItem) => void;
  /** UI-CV-TVV: tên em của việc kế ("Việc kế: Lý Tuấn Bình"). */
  tenTiep?: string | null;
  /** M6 6b-3 (V19): view Case ghi lên URL `?panel=case` — Back trình duyệt lùi một view, F5 giữ view (trang Công việc). */
  xemUrl?: boolean;
};
/**
 * NEN-PANEL (K12): khoá nháp = khoá việc — chữ đang gõ trong panel của việc này giữ ở máy tới khi lưu / bỏ.
 * M6 6b-3 (mockup panel-pilot ②c): panel việc là ngăn xếp view (`useXem`) — "Xem Case" (đầu panel) vào view Case NGAY TRONG panel việc, "‹ {việc}" về
 * đúng form: form việc vẫn gắn (ẩn) nên chữ, lựa chọn, trạng thái lưu còn nguyên; không panel chồng panel. ✕ ở view Case = đóng cả panel.
 */
export function PanelViec(p: PropsViec) {
  const xem = useXem({ url: p.xemUrl, dau: ['viec'] });
  /* HD3-1 (15 mục 8.2): "?" đọc DÒNG VIỆC đang mở → tầng 1 = thẻ của loại việc; dải "làm thay / chỉ xem" theo `mine` của dòng. */
  const { group, key, tieuDe, classCode, mine, chonPa } = p.it;
  const chuaGiu = p.it.ownerId == null;
  useEffect(() => ghiViecMo({ group, key, tieuDe, lop: classCode, mine, chonPa, chuaGiu }), [group, key, tieuDe, classCode, mine, chonPa, chuaGiu]);
  const caseId = p.it.con?.length ? null : p.it.caseId ?? null;
  const dangXemCase = caseId !== null && xem.ds[xem.ds.length - 1] === 'case';
  /* Nút vừa bấm ("Xem Case" / ‹) ẩn theo lớp của nó — focus sang lớp vừa hiện, người dùng bàn phím không mất chỗ. */
  const lopViec = useRef<HTMLDivElement>(null);
  const lopCase = useRef<HTMLDivElement>(null);
  const truoc = useRef(dangXemCase);
  useEffect(() => {
    if (truoc.current === dangXemCase) return;   // chỉ khi đổi lớp — mở panel (kể cả StrictMode chạy effect hai lần) không giành focus (CV-09)
    truoc.current = dangXemCase;
    (dangXemCase ? lopCase : lopViec).current?.querySelector<HTMLElement>('section[tabindex]')?.focus();
  }, [dangXemCase]);
  return (
    <NhapViec khoa={p.it.key}>
      <HienLaiPanel.Provider value={dangXemCase ? xem.lui : null}>
        <XemCaseViec.Provider value={caseId !== null ? () => xem.vao('case') : null}>
          <div ref={lopViec} hidden={dangXemCase}><PanelMotViec {...p} /></div>
        </XemCaseViec.Provider>
      </HienLaiPanel.Provider>
      {dangXemCase && (
        <div ref={lopCase}>
          <NganCase caseId={caseId} viecBanDau={{ loai: 'case' }} paViec={p.it.paId ?? null} hocVien={p.it.studentId !== null ? p.it.studentName : null} lop={p.it.classCode} onClose={p.onDong} onChanged={p.onDaLam}
            veNguon={{ nhan: tenBoEm(p.it), onClick: xem.lui }} />
        </div>
      )}
    </NhapViec>
  );
}

/**
 * BỔ SUNG HỒ SƠ THIẾU (chủ SP 06/11): bấm dòng → sửa thông tin từng em NGAY TẠI CHỖ (panel Sửa thông tin sẵn có), con trỏ ở ô còn thiếu;
 * "Lưu · em tiếp ›" / "Bỏ qua ›" qua em kế; hết em thì đóng. Danh sách em chốt lúc mở (lưu xong dòng việc có thể đổi nhưng thứ tự không nhảy).
 * Không chuyển trang, không đụng bộ lọc / vị trí cuộn của trang đang đứng.
 */
function PanelBoSungHoSo({ emIds, lop, ten, onDong, onDaLam }: { emIds: readonly number[]; lop: string | null; ten: (id: number) => string; onDong: () => void; onDaLam: () => void }) {
  const [ds] = useState(emIds);
  const [i, setI] = useState(0);
  const daLuu = useRef(false);
  const tiep = () => (i + 1 < ds.length ? setI(i + 1) : onDong());
  return (
    <SuaThongTinMotEm key={ds[i]} studentId={ds[i]} studentName={ten(ds[i])} lop={lop}
      tiep={{ stt: i + 1, tong: ds.length, conLai: i + 1 < ds.length, boQua: tiep }}
      /* Panel Sửa thông tin gọi onDone() rồi onClose() sau khi lưu — onClose ngay sau onDone không phải "người dùng đóng". */
      onDone={() => { daLuu.current = true; onDaLam(); tiep(); }}
      onClose={() => { if (daLuu.current) { daLuu.current = false; return; } onDong(); }} />
  );
}

function PanelMotViec({ it, tuMo = false, onDong, onDaLam, onTiep, onMo, tenTiep }: PropsViec) {
  const lop = it.classCode;
  const hv = it.studentId !== null ? it.studentName : null;
  const doi = () => { invalidate('/my-work'); onDaLam(); };
  switch (it.group) {
    case 'cause':
      return <NganCase key={it.key} caseId={it.caseId!} viec="xac-nhan" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    /* R3-W1 (rà 24/11): Xác nhận Case · Speaking (chấm chéo) — cùng phần Mô tả của panel Case (chọn nhận xét chấm chéo / giữ / viết khác), tại chỗ. */
    case 'ghi_nhan_xet': case 'xem_nx_s':
      return <NganCase key={it.key} caseId={it.caseId!} viec="ghi-nhan-xet" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    case 'xac_nhan_pa':
      if (it.con) return <XacNhanPaLo key={it.key} it={it} onDong={onDong} onDaLam={onDaLam} onMo={onMo} onTiep={onTiep} />;
      return <NganCase key={it.key} caseId={it.caseId!} paId={it.paId} viec="xac-nhan-pa" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    case 'ghi_ket_qua_pa': case 'mini_test':
      /* GD-20c (mockup ⑫ C2): dòng gộp cùng lớp + cùng kỳ → lưới, mỗi dòng một PA. */
      if (it.con) return <LuoiKetQuaPa key={it.key} it={it} onDong={onDong} onDaLam={onDaLam} onTiep={onTiep} />;
      /* CASE-PA-UI b (v16 a · e1): mọi việc Kết quả PA mở CÙNG panel Case — thẻ PA đích mở sẵn form Ghi kết quả (thay panel ghi nhanh riêng). */
      return <NganCase key={it.key} caseId={it.caseId!} paId={it.paId} viec="ghi-ket-qua" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    case 'no_plan':
      return <NganCase key={it.key} caseId={it.caseId!} viec="them-pa" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    case 'score':
      /* R1-LUU-TIEP: mọi việc chấm có "Việc tiếp ›" ở chân panel + trong hộp nhập điểm khi hết phần người xem. */
      /* CV-SUA-1011: dòng theo dõi (việc của GV khác) — hàng đợi của chính GV đó, không của người xem. */
      if (it.key === KHOA_CHAM_SPEAKING) return <PanelChamSpeaking key={it.key} nguoi={it.mine ? null : it.ownerId} onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
      /* N39 (chủ SP 05/11): việc chấm có tuần thi — kể cả Speaking chấm chéo — mở lưới TUẦN + LỚP, chỉ em có bài tuần đó; không mở bảng cả lớp theo đợt MT. */
      if (it.con || it.periodId) return <PanelNhapDiemTuan key={it.key} it={it} tuMo={tuMo} onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
      return <PanelNhapDiem key={it.key} it={it} tuMo={tuMo} onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
    case 'ban_giao':
      /* PR-B: bàn giao khi đổi GV — `ban_giao_gv:{id}`. */
      if (it.key.startsWith('ban_giao_gv:')) return <BanGiaoGvPanel key={it.key} id={Number(it.key.split(':')[1])} onClose={onDong} onDone={doi} onTiep={onTiep} />;
      return <BanGiaoPanel key={it.key} classId={it.classId!} mon={it.key.startsWith('ban_giao_mon:') ? it.key.split(':')[2] ?? null : null} onClose={onDong} onDone={doi} onTiep={onTiep} />;
    case 'yt_xu_ly': case 'yt_xem':
      if (laLo(it)) {
        return <LoYThucPanel key={it.key} classId={it.classId!} lop={lop} viec={it.group === 'yt_xu_ly' ? 'xu-ly' : 'ghi-nhan'}
          studentIds={it.con!.map((c) => c.studentId!).filter((x) => x !== null)} han={it.due} onClose={onDong} onDone={doi} />;
      }
      if (it.group === 'yt_xem') {
        return (
          <PanelXemViPham key={it.key} studentId={it.studentId!} lop={lop} onDong={onDong} onDaLam={doi} onTiep={onTiep}
            dau={dauViec({ han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.yt_xem ?? 'viec-van-hanh'} han={it.due} /> : null, em: hv ? { id: it.studentId!, ten: hv } : null, lop })} />
        );
      }
      return <XacNhanXuLyPanel key={it.key} studentId={it.studentId} lop={lop} dau={dauTuViec(it)} onClose={onDong} onDone={doi} onTiep={onTiep} />;
    case 'yt_hoi_tinh_hinh':
      /* TINH-HINH (mockup v20 F2): TVV hỏi tình hình — GVCN ghi kết quả tại chỗ. */
      return <PanelHoiTinhHinh key={it.key} id={soCuaKhoa(it.key)!} ten={it.studentName} lop={lop} cauHoi={it.reason} han={it.due} dau={dauTuViec(it)}
        onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
    case 'yt_tra_lai':
      /* TL-2 (mockup v22 T4 / T5): Vi phạm / lần xử lý bị trả lại — GV chọn Sửa rồi gửi lại · Giữ nguyên + trả lời · Xoá (cả lần: Thu hồi) tại chỗ. */
      return <PanelTraLai key={it.key} id={soCuaKhoa(it.key)!} lop={lop} onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
    case 'yt_thuc_hien':
      return <DaThucHienPanel key={it.key} measureId={soCuaKhoa(it.key)} dau={dauTuViec(it)} onClose={onDong} onDone={doi} onTiep={onTiep} />;
    case 'khai_bac':
      /* GD-4d: gọi thẳng panel lô (LoYThucPanel chỉ chuyển tiếp 'cap-bac') để truyền việc kế. */
      if (it.studentId === null) return <KhaiBacLoPanel key={it.key} classId={it.classId!} lop={lop} han={it.due} studentIds={it.emIds ?? null} onClose={onDong} onDone={doi} onTiep={onTiep} />;
      return <KhaiBacPanel key={it.key} studentId={it.studentId} lop={lop} dau={dauTuViec(it)} onClose={onDong} onDone={doi} onTiep={onTiep} />;
    case 'mgmt':
      return <NganViecVanHanh key={it.key} taskId={soCuaKhoa(it.key)} onClose={onDong} onDone={doi} />;
    /* UI-CV-TVV (mockup `tvv.html`): KQ thi thật + Chọn bước tiếp = MỘT panel Sau thi hai bước. */
    case 'buoc_tiep': case 'thi_that':
      return <PanelSauThi key={it.key} cycleId={soCuaKhoa(it.key)!} em={{ id: it.studentId!, ten: it.studentName }} lop={lop} han={dauTuViec(it).han} onDong={onDong} onDaLam={doi} onTiep={onTiep} tenTiep={tenTiep} />;
    case 'bao_ph_yt':
      return <PanelBaoPhTvv key={it.key} it={it} onDong={onDong} onDaLam={doi} onTiep={onTiep} tenTiep={tenTiep} />;
    case 'phoi_hop_tvv':
      /* GV-2 (mockup v22 G8b): một việc "Báo PH · Meeting CX/GĐCN" → panel Báo PH (+ hai phần Meeting, khối giao việc); dòng gộp nhiều em giữ lưới lớp. */
      if (it.viecId && !it.con?.length) return <PanelBaoPhTvv key={it.key} it={it} onDong={onDong} onDaLam={doi} onTiep={onTiep} tenTiep={tenTiep} />;
      return <PanelPhoiHop key={it.key} it={it} onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
    case 'phoi_hop_sos':
      return <PanelPhoiHop key={it.key} it={it} onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
    /* GV-2 (B2, mockup v22 G8): Xếp lịch họp (BPXL) · Kết quả meeting (CX) — panel Meeting ba phần. */
    case 'meeting_xep_lich': case 'meeting_ket_qua':
      return <PanelMeeting key={it.key} it={it} onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
    case 'phoi_hop':
      return <PanelBaoPh key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    case 'missing_data':
      /* R3-W2 (rà 24/11): mốc PA chưa có lịch — Nhập dự kiến thi = panel Chốt ngày thi của lộ trình · Xếp lịch MTn = panel Lịch MT (hàng chưa xếp có nút Xếp lịch). */
      if (it.key.startsWith('moc:') && it.cycleId) {
        if (it.kind === 'thi') {
          return <PanelChotNgayThi key={it.key} cycleId={it.cycleId} em={{ id: it.studentId!, ten: it.studentName }} lop={lop} duKien={null}
            onDong={onDong} onDaLam={doi} onTiep={onTiep} tenTiep={tenTiep} />;
        }
        return <StudentPlanPanel key={it.key} cycleId={it.cycleId} studentName={it.studentName} ratio={false} onClose={onDong} onDone={doi} />;
      }
      if (it.key.startsWith('chot-ngay-thi:')) {
        return <PanelChotNgayThi key={it.key} cycleId={soCuaKhoa(it.key)!} em={{ id: it.studentId!, ten: it.studentName }} lop={lop} duKien={it.contextLabel} thangDuKien={/thang=(\d{4}-\d{2})/.exec(it.href ?? '')?.[1] ?? null}
          onDong={onDong} onDaLam={doi} onTiep={onTiep} tenTiep={tenTiep} />;
      }
      return <SuaThongTinMotEm key={it.key} studentId={it.studentId!} studentName={it.studentName} lop={lop} onClose={onDong} onDone={doi} />;
    case 'bo_sung_ho_so':
      return <PanelBoSungHoSo key={it.key} emIds={it.emIds ?? []} lop={lop} ten={(id) => it.con?.find((c) => c.studentId === id)?.studentName ?? ''} onDong={onDong} onDaLam={doi} />;
    /* P9a: panel Xét lại tại chỗ — thanh Việc cần làm ở hồ sơ lớp · R3-T2 (rà 24/11): cả Công việc (trước "Xét lại ›" mở trang lớp, ~125 câu, mất danh sách). */
    case 'xet_lai_lo_trinh':
      return <PanelXetLai key={it.key} classId={it.classId!} onClose={onDong} onDone={doi} />;
    /* CHOT-LO-TRINH-PANEL (v25, chủ SP duyệt 25/11): Chốt lộ trình + Kỳ vọng FT làm tại chỗ ở khe 720 — trước "Cuối khoá ›" mở trang. */
    case 'chot_len_ft': case 'ky_vong_dau_ra':
      return <PanelChotLoTrinh key={it.key} classId={it.classId!} onDong={onDong} />;
    case 'no_owner':
      return it.thieuNguoi ? <PanelPhanCongMon key={it.key} it={it} onDong={onDong} onDaLam={doi} /> : <PanelChonPhuTrach key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    default:
      return null;
  }
}

/**
 * NHẬP ĐIỂM TẠI CHỖ (mockup M1 §2; OV-15b mockup 2 khung 1a): bảng điểm của lớp · lượt (`/classes/:id/diem-theo-luot/:luot`), lưới chung
 * `LuoiChamLop` chỉ cột của việc (`kns`) + "Cả lớp"; màn hẹp một kỹ năng một lúc (`MotKyNang`). Không đường ghi mới.
 */
/** R1-LUU-TIEP: bài còn thiếu của người xem trong lưới của việc (em + cột của việc) — 0 thì "Việc tiếp ›" nổi bật. */
const conBaiLuoi = (d: BangTheoLuot, chiAttempt: ReadonlySet<number> | null, kns: readonly string[] | null, homNay: string) => {
  const cuaViec = (a: number) => !chiAttempt?.size || chiAttempt.has(a);
  const cot = (k: string) => !kns || kns.some((x) => khopKn(k, x));
  if (d.ft) return d.ft.rows.filter((r) => cuaViec(r.attemptId) && !r.ngungHoc).flatMap((r) => r.cells).filter((c) => cot(c.skill) && conThieuFt(c)).length;
  return (d.thuong?.rows ?? []).filter((r) => cuaViec(r.attemptId))
    .flatMap((r) => r.skillSchedule.filter((x) => cot(x.skill) && oThuong(r, x.skill, homNay).trong)).length;
};

export function PanelNhapDiem({ it, onDong, onDaLam, quayLai, tuMo = false, onTiep = null, chiEmViec = false, nhapHo = false }: {
  /** QC-Q82: "Bạn nhập hộ · " đầu dòng quy chế — nơi gọi không có dải "Bạn đang làm thay" (panel GV trễ chấm). */
  nhapHo?: boolean;
  it: Pick<WorkItem, 'classId' | 'luot' | 'kn' | 'studentId' | 'emIds' | 'tieuDe' | 'classCode' | 'contextLabel' | 'due'> & Partial<Pick<WorkItem, 'key' | 'phu' | 'kns'>>;
  onDong: () => void; onDaLam: () => void;
  /** OV-12e: mở từ panel số liệu — "← Danh sách". */
  quayLai?: { nhan: string; onClick: () => void };
  /** CV-LOI: trang tự mở (không con trỏ, không cuộn — CV-09). R1-BO-DAN-EXCEL: bỏ dán điểm từ Excel (chủ SP 26/10). */
  tuMo?: boolean;
  /** R1-LUU-TIEP: việc kế của danh sách (Công việc, Chấm Test, thanh việc lớp). */
  onTiep?: (() => void) | null;
  /** M6 6b-4 (Nhập hộ ở panel GV chấm quá hạn): chỉ hàng các em của dòng (`emIds`), không chỉ khi một em. 6c (#641 XM-2): lưới gọn như mockup —
   *  không cột Kết quả, không nút "Cả lớp" (cả lớp: link "lớp · lượt" ở đầu panel hoặc "Mở lưới lớp ở Lịch Test ›"). */
  chiEmViec?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const { data, error, reload } = useApi<BangTheoLuot>(duongDiemTheoLuot(it.classId!, it.luot!), [it.classId, it.luot]);
  const daLuu = () => { reload(); onDaLam(); };
  /* OV-15b: link "lớp · lượt" đổi panel này sang Nhập điểm cả lớp (cùng chỗ, không panel lồng panel); "‹ Việc" quay về việc. */
  const [caLop, setCaLop] = useState(false);
  /* Plan mục 4: kỹ năng VÀ tiêu đề giữ như lúc mở — tải lại sau khi lưu (việc còn môn khác) không đổi chữ đầu panel dưới tay người dùng. */
  const [kn] = useState(it.kn ?? null);
  const [kns] = useState(() => it.kns ?? (it.kn ? [it.kn] : null));
  const [tieuDe] = useState(it.tieuDe);
  /* OV-15b (mục 1, mockup 2 khung 1a / 2): lưới chung, chỉ cột của việc + Kết quả, con trỏ ở ô trống đầu. Việc một em: chỉ hàng em đó;
     "Cả lớp" mở mọi em + mọi cột. */
  const em = chiEmViec ? emCuaViec(it) : it.studentId !== null ? [it.studentId] : null;
  const chiAttempt = useMemo(() => (data && em
    ? new Set((data.ft?.rows ?? data.thuong?.rows ?? []).filter((r) => em.includes(r.studentId)).map((r) => r.attemptId)) : null), [data, em?.join()]);   // eslint-disable-line react-hooks/exhaustive-deps
  /* OV-12e: đầu panel v3 — tên việc + chip hạn / link lớp · lượt (xem Điểm theo lớp, tách khỏi ô nhập). */
  const dau = dauViec({
    han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.score ?? 'nhap-diem'} han={it.due} /> : null,
    lop: it.classCode, ngCanh: (
      <button type="button" className="link text-left" onClick={() => setCaLop(true)}>
        {dich((laViecChamCheo({ key: it.key ?? '' }) ? it.phu : it.contextLabel) ?? '')}
      </button>
    ),
  });
  if (caLop) {
    return <PanelNhapDiemLop classId={it.classId!} classCode={it.classCode} luot={it.luot} onDong={onDong} quayLai={{ nhan: t('Việc'), onClick: () => setCaLop(false) }} />;
  }
  return (
    <KhungPanel hd="nhap-diem" tieuDe={dich(tieuDe)} dau={dau} quayLai={quayLai} onDong={onDong} quyChe={data ? quyCheNhapDiem({
        /* GD-4b Q1/Q2/Q5/Q6/Q7/Q9/Q58: MT0 (kể cả lớp thường `thuong:mt0`) theo luật vắng Mock (chủ SP 14/11, #1619); dữ liệu đã nạp, không request thêm. */
        thuong: data.mode === 'ratio' || data.luot.ma === 'thuong:mt0', mt0: data.luot.ma === 'thuong:mt0' || data.luot.ma === 'mt:0',
        tuanThi: data.luot.tuanStart, homNay, han: it.due ?? data.luot.quaHan ?? null, nguongDat: data.thuong?.passThreshold ?? null, mtCu: data.luot.lichSu,
        nhapHo,   // QC-Q82: chỉ nơi KHÔNG có dải "Bạn đang làm thay" (panel GV trễ chấm) — Công việc đã có dải (PTA 15/11, [XM-Q82b])
      }) : null}
      chan={chanViecTiep(onTiep, !!data && !!homNay && conBaiLuoi(data, chiAttempt, kns, homNay) === 0)}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : (
            <LuoiTrongPanel className="luoi-trong-panel -mx-4 px-2">
              <LuoiChamLop data={data} kind={null} kn={kn} onReload={daLuu} gon luoiGon anNutTao chiCot={kns} datConTro={!tuMo}
                nutCaLop={!chiEmViec} anKetQua={chiEmViec}
                chiAttempt={chiAttempt?.size ? chiAttempt : null} onHet={hetViec(onTiep)} />
            </LuoiTrongPanel>
          )}
    </KhungPanel>
  );
}

/** OV-13b: Báo PH kết quả Test của một em tại chỗ — cùng thẻ Phối hợp của hồ sơ em (`/students/:id/phoi-hop-sos`). */
function PanelBaoPh({ it, onDong, onDaLam }: { it: WorkItem; onDong: () => void; onDaLam: () => void }) {
  const { data, loading, error, reload } = useApi<{ rows: CoordTurn[] }>(`/students/${it.studentId}/phoi-hop-sos`, [it.studentId]);
  /* GV-2 (N58): việc Báo PH kết quả Test (`baoph:<id>` = hành động Phối hợp) — khối Phụ trách · Hạn · Theo dõi đầu thân. */
  const gv = useGiaoViec('phoi_hop', soCuaKhoa(it.key));
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} dau={dauTuViec(it, it.contextLabel)} onDong={onDong}
      /* Lời 40: còn lượt chưa xong mà bạn làm được mới hiện câu — đã báo PH hết thì không. */
      quyChe={data?.rows.some((r) => r.canAct && !r.summary.complete) ? quyCheBaoPhTest() : null}>
      <div className="flex flex-col gap-3 pt-3">
        {gv.g && <KhoiGiaoViec g={gv.g} dat={gv.dat} reload={gv.reload} onDaDoi={onDaLam} />}
        {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
          : <PhoiHopSosSection turns={data?.rows ?? null} loading={loading} cot1="luot" onChanged={() => { reload(); onDaLam(); }} />}
      </div>
    </KhungPanel>
  );
}

type GvLop = {
  programmeCode: string | null;
  core: { userId: number; name: string }[]; bySkill: { skill: string; userId: number; name: string }[];
  candidates: { id: number; name: string; classCount: number; skills?: string[] }[];
  /** SUA-NO-RA: phiên bản phân công lúc đọc — gửi kèm khi lưu, người khác vừa đổi → 409. */
  phienBan?: string;
};

/**
 * CV-LOI (02 mục 4.7 A13, CV-07, ảnh v4-2): Case chưa có người phụ trách vì lớp thiếu GV môn của Case (hoặc thiếu GVCN) — MỘT ô cho đúng chỗ thiếu,
 * không mở phân công cả lớp. Gửi phân công đang có + ô đó qua đường sẵn có (`PUT /classes/:id/teachers`, máy chủ kiểm luật phân công); máy chủ gán chủ
 * Case cùng giao dịch (`ganChuCaseThieu`) → dòng việc hết. Lỗi luật: chữ máy chủ dưới ô, giữ lựa chọn.
 */
function PanelPhanCongMon({ it, onDong, onDaLam }: { it: WorkItem; onDong: () => void; onDaLam: () => void }) {
  const toast = useToast();
  const mon = it.thieuNguoi?.mon ?? null;
  const { data, error, reload } = useApi<GvLop>(`/classes/${it.classId}/teachers`, [it.classId]);
  const [chon, setChon] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const nhan = mon ? t('GV {mon}', { mon: tenMon(data?.programmeCode ?? null, mon) }) : t('GVCN');
  /* GV dạy được môn thiếu lên đầu (hồ sơ GV có kỹ năng đó). */
  /* SUA-NO-RA: người khác vừa giao ô này (409 → tải lại) → việc đã xong, không cho giao đè. */
  const daGiao = mon ? data?.bySkill.find((b) => b.skill === mon) : data?.core[0];
  const nguoi = [...(data?.candidates ?? [])].sort((a, b) => Number(!!mon && !!b.skills?.includes(mon)) - Number(!!mon && !!a.skills?.includes(mon)));
  const giao = async () => {
    if (!data || daGiao) return;
    if (chon === '') { setLoi(t('Chọn giáo viên')); return; }
    setBusy(true); setLoi(null);
    try {
      const slots = [
        ...data.core.map((c) => ({ userId: c.userId, skill: null, isCore: true })),
        ...data.bySkill.map((b) => ({ userId: b.userId, skill: b.skill, isCore: false })),
        mon ? { userId: chon, skill: mon, isCore: false } : { userId: chon, skill: null, isCore: true },
      ];
      const kq = await api.put<{ lo?: number | null }>(`/classes/${it.classId}/teachers`, { slots, phienBan: data.phienBan });
      invalidate('/classes'); invalidate('/cases');
      /* P1-05 (AUDIT-2111): máy chủ trả khoá `lo` → Hoàn tác như lưu phân công lớp. */
      if (kq?.lo != null) {
        toast.hoanTac(t('Đã phân công {nhan}', { nhan }), () => {
          api.post('/phan-cong/hoan-tac', { lo: kq.lo })
            .then(() => { invalidate('/classes'); invalidate('/cases'); invalidate('/my-work'); toast.push('ok', t('Đã hoàn tác')); onDaLam(); })
            .catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
        });
      } else toast.push('ok', t('Đã phân công {nhan}', { nhan }));
      onDaLam();
    } catch (e: any) {
      setLoi(e?.message ?? t('Không lưu được'));
      /* SUA-NO-RA (CV-LOI-a): người khác vừa đổi phân công lớp → tải lại bức tranh mới, GIỮ người đang chọn để bấm Giao lại. */
      if (e instanceof ApiError && e.status === 409) reload();
    } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} onDong={onDong} quyChe={quyChePhanCong()}
      dau={dauTuViec(it, it.contextLabel)}>
      {it.reason && <p className="m-0 pt-3 text-sm text-slate-300">{dich(it.reason)}</p>}
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={3} /></div>
          : (
            <div className="flex flex-col gap-3 pt-3">
              {daGiao && <p className="m-0 text-sm text-slate-300" role="status">{mon ? t('Môn này vừa được giao cho {ten}.', { ten: daGiao.name }) : t('Lớp vừa có GVCN: {ten}.', { ten: daGiao.name })}</p>}
              <Truong nhan={nhan} batBuoc loi={daGiao ? null : loi} as="div">
                <ChonNguoi nhom="giao_vien" choToi={false} choNgoai={false} ariaLabel={t('{nhan}: chọn giáo viên', { nhan })} choTrong={t('— Chưa chọn —')}
                  ds={nguoi.map((g) => ({ id: g.id, ten: g.name, phu: phuGv(g) }))} value={chonNguoi(chon, nguoi, (g) => phuGv(g))}
                  onChange={(v) => { setChon(v?.kieu === 'tai_khoan' ? v.id : ''); setLoi(null); }} />
              </Truong>
              <div>
                <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !!daGiao} onClick={() => void giao()}>{busy ? t('Đang lưu…') : t('Giao')}</button>
              </div>
            </div>
          )}
    </KhungPanel>
  );
}

/**
 * R1-NO-CU (D17): "Chọn người phụ trách" — lớp đủ người mà Case vẫn trống (dữ liệu cũ). Cùng hộp với "Đổi người…" ở Ngăn Case (`DoiNguoiPhuTrach`);
 * lưu xong dòng việc hết (cùng nguồn `caseChuaCoNguoi`). Không đổi được (em đã rời lớp, không có ứng viên, không quyền) → nói lý do + hồ sơ em.
 */
function PanelChonPhuTrach({ it, onDong, onDaLam }: { it: WorkItem; onDong: () => void; onDaLam: () => void }) {
  const { data, error, reload } = useApi<CaseDetail>(`/cases/${it.caseId}`, [it.caseId]);
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} onDong={onDong} quyChe={quyChePhanCong()}
      dau={dauTuViec(it, it.contextLabel)}>
      {it.reason && <p className="m-0 pt-3 text-sm text-slate-300">{dich(it.reason)}</p>}
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={3} /></div>
          : (
            <div className="flex flex-col gap-3 pt-3">
              <p className="m-0 text-sm text-slate-300">{tenNganCase(data)} · {data.owner ? t('phụ trách: {ten}', { ten: data.owner }) : t('Chưa có người phụ trách')}</p>
              {data.doiChu?.duoc
                ? <DoiNguoiPhuTrach caseId={data.id} ownerCu={data.ownerUserId ?? null} ungVien={data.doiChu.ungVien} onXong={() => { onDaLam(); onDong(); }} onTaiLai={reload} />
                : (
                  <p className="m-0 text-sm text-slate-300" role="status">
                    {t('Chưa chọn được người ở đây — mở hồ sơ em.')}{' '}
                    <Link className="link" to={it.href}>{t('Hồ sơ em ›')}</Link>
                  </p>
                )}
            </div>
          )}
    </KhungPanel>
  );
}

/** OV-12h: Phối hợp SOS của lớp (lượt chưa xong) tại chỗ — cùng thẻ lượt / form Xác nhận của hồ sơ lớp; meeting CX có hạn 5 ngày. */
/**
 * PHOI-HOP-V2 (mockup #1368 K1–K3) + YT-b (mockup v19 B1–B2): panel một dòng (lớp × việc) — CHỈ em cần làm: GVCN `Học viên · Cần làm`, TVV `Học viên · GVCN gửi · Báo PH`, xác nhận tại dòng.
 * `phoi_hop_tvv`: việc TVV sau Meeting CX của lớp (cả việc đã báo — `includeDone`). MỘT request khi mở panel.
 */
function PanelPhoiHop({ it, onDong, onDaLam, onTiep }: { it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null }) {
  const tvv = it.group === 'phoi_hop_tvv';
  /* `includeDone`: em vừa xong việc cuối của lượt vẫn ở lại tại dòng (nền xanh, Hoàn tác) tới khi đóng panel — một lớp, một request.
     ponytail: giữ includeDone (đọc cả lượt đã xong) chỉ để dòng vừa lưu không mất; bỏ được nếu giữ ảnh dòng ở trình duyệt. */
  /* GV-2 (N58): một việc Phối hợp (`phoi_hop_viec:<id>` — việc đã giao / một em) → khối giao việc đầu thân + thẻ Phối hợp CỦA EM (người được giao không cần quyền xem cả lớp). */
  const mot = it.key.startsWith('phoi_hop_viec:') && it.viecId ? it.viecId : null;
  const gv = useGiaoViec('phoi_hop', mot);
  const { data, error, reload } = useApi<{ rows: CoordTurn[] }>(mot && it.studentId ? `/students/${it.studentId}/phoi-hop-sos` : `/classes/${it.classId}/phoi-hop-sos?includeDone=1`, [it.classId, mot]);
  const ten = tvv ? t('Báo PH · Meeting CX/GĐCN') : dich(it.tieuDe.split(' · ')[0]);
  const { homNay } = useNgayNghiepVu();
  /* GD-4b Q53 / Q54 / Q62: dòng Meeting CX/GĐCN → câu Meeting (TVV nhận việc báo PH); dòng khác → câu Xác nhận. "Bỏ" chọn ở từng em → vào ⓘ. */
  const han = it.due ? shortDate(it.due, homNay) : null;
  const qc = tvv ? quyChePhoiHopTvv(han) : { ...quyChePhoiHopSos(/meeting/i.test(it.tieuDe) ? 'meeting' : 'xac-nhan', han), chiTiet: quyChePhoiHopSos('bo', null).chu };
  const n = it.con?.length ?? it.count ?? 1;
  const dau = dauViec({
    han: it.due ? <ChipHan chuThuong loai="phoi-hop" han={it.due} /> : null,
    ngCanh: <><Link className="ten-ho-so" to={`/hoc-vien/lop/${it.classId}?tab=y-thuc&sub=phoi-hop`}>{it.classCode}</Link>{` · ${tvv ? t('{n} em cần báo', { n }) : t('{n} em cần làm', { n })}`}</>,
  });
  return (
    <KhungPanel hd="phoi-hop-sos" tieuDe={ten} dau={dau} onDong={onDong} quyChe={data?.rows.some((r) => r.canAct && !r.summary.complete) ? qc : null}
      chan={{
        huy: null,
        /* YT-b (mockup v19 B1–B2, XM-1 duyệt): panel chỉ còn em cần làm — việc đã làm xem / sửa ở hồ sơ lớp › Phối hợp SOS. */
        trai: <Link className="link text-sm font-semibold max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={`/hoc-vien/lop/${it.classId}?tab=y-thuc&sub=phoi-hop`}>{tvv ? t('Đã báo · hồ sơ lớp ›') : t('Đã làm · hồ sơ lớp ›')}</Link>,
        /* GD-4d: hết em cần làm → "Việc tiếp ›" thành nút chính (lưu đã ở từng dòng). */
        chinh: onTiep ? <button type="button" className={data && !data.rows.some((r) => r.canAct && !r.summary.complete) ? 'btn btn-primary min-h-[44px] sm:min-h-0' : 'btn min-h-[44px] sm:min-h-0'} onClick={onTiep}>{t('Việc tiếp ›')}</button> : undefined,
      }}>
      <div className="flex flex-col gap-3 pt-2">
        {gv.g && <KhoiGiaoViec g={gv.g} dat={gv.dat} reload={gv.reload} onDaDoi={onDaLam} />}
        {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
          : !data ? <Skeleton rows={4} />
          : <BangPhoiHop anHan={!!mot} turns={data.rows} che={tvv ? { loai: 'tvv' } : { loai: 'gvcn', khoa: it.phoiHop?.khoa ?? '' }} chiEm={it.studentId} lop={it.classCode ?? undefined}
              onChanged={() => { reload(); onDaLam(); }} />}
      </div>
    </KhungPanel>
  );
}
