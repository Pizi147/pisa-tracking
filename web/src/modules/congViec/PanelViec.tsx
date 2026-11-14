import { PanelXetLai } from '../classes/PanelXetLai.tsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PanelNhapDiemLop } from '../cham/PanelNhapDiemLop.tsx';
import { useApi } from '../../lib/useApi.ts';
import { LuoiTrongPanel } from '../../ui/LuoiTrongPanel.tsx';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HienLaiPanel, KhungPanel, NhapViec, Truong } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { XemCaseViec, useXem } from '../../lib/quayLai.ts';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { chonNguoi, phuGv } from '../classes/ClassCreatePanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { NganCase } from '../students/NganCase.tsx';
import { tenNganCase, type CaseDetail } from '../cases/CasePanel.tsx';
import { DoiNguoiPhuTrach } from '../cases/DoiNguoiPhuTrach.tsx';
import { BanGiaoPanel } from '../classes/BanGiaoPanel.tsx';
import { BanGiaoGvPanel } from '../classes/BanGiaoGvPanel.tsx';
import { XacNhanXuLyPanel } from '../yThuc/XacNhanXuLyPanel.tsx';
import { DaThucHienPanel } from '../yThuc/DaThucHienPanel.tsx';
import { PanelHoiTinhHinh } from '../yThuc/TinhHinh.tsx';
import { KhaiBacPanel } from '../yThuc/KhaiBacPanel.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { LuoiChamLop, duongDiemTheoLuot, type BangTheoLuot } from '../cham/LuoiChamLop.tsx';
import { LuoiNhung } from '../test/lichTest/LuoiNhung.tsx';
import { khopKn } from '../cham/LuoiFT.tsx';
import { oThuong } from '../cham/LuoiThuong.tsx';
import { XacNhanPaLo } from './XacNhanPaLo.tsx';
import { tenBoEm } from './DanhSachViec.tsx';
import { KHOA_CHAM_SPEAKING, conThieuFt, LOAI_HAN_CUA_VIEC, duongLichTest, emCuaViec, laViecChamCheo, tenMon, tuanLich, quyCheVang } from '@shared/domain/index.ts';
import { PanelChamSpeaking } from './PanelChamSpeaking.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { laLo, soCuaKhoa } from './lamTaiCho.ts';
import { LoYThucPanel } from '../yThuc/LoYThucPanel.tsx';
import { PanelChotNgayThi, PanelSauThi } from './PanelSauThi.tsx';
import { PanelBaoPhTvv } from './PanelBaoPhTvv.tsx';
import { PanelXemViPham } from '../yThuc/PanelXemViPham.tsx';
import { SuaThongTinMotEm } from '../students/StudentManagePanel.tsx';
import { PhoiHopSosSection, type CoordTurn } from '../yThuc/PhoiHopSosSection.tsx';
import { BangPhoiHop } from '../yThuc/BangPhoiHop.tsx';
import { dich, t } from '@shared/i18n/index.ts';

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
function PanelBoSungHoSo({ emIds, onDong, onDaLam }: { emIds: readonly number[]; onDong: () => void; onDaLam: () => void }) {
  const [ds] = useState(emIds);
  const [i, setI] = useState(0);
  const daLuu = useRef(false);
  const tiep = () => (i + 1 < ds.length ? setI(i + 1) : onDong());
  return (
    <SuaThongTinMotEm key={ds[i]} studentId={ds[i]} studentName="" lop={null}
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
    case 'ghi_nhan_xet':
      return <NganCase key={it.key} caseId={it.caseId!} viec="ghi-nhan-xet" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    case 'xac_nhan_pa':
      if (it.con) return <XacNhanPaLo key={it.key} it={it} onDong={onDong} onDaLam={onDaLam} onMo={onMo} onTiep={onTiep} />;
      return <NganCase key={it.key} caseId={it.caseId!} paId={it.paId} viec="xac-nhan-pa" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    case 'ghi_ket_qua_pa': case 'mini_test':
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
      if (it.key.startsWith('ban_giao_gv:')) return <BanGiaoGvPanel key={it.key} id={Number(it.key.split(':')[1])} onClose={onDong} onDone={doi} />;
      return <BanGiaoPanel key={it.key} classId={it.classId!} mon={it.key.startsWith('ban_giao_mon:') ? it.key.split(':')[2] ?? null : null} onClose={onDong} onDone={doi} />;
    case 'yt_xu_ly': case 'yt_xem':
      if (laLo(it)) {
        return <LoYThucPanel key={it.key} classId={it.classId!} lop={lop} viec={it.group === 'yt_xu_ly' ? 'xu-ly' : 'ghi-nhan'}
          studentIds={it.con!.map((c) => c.studentId!).filter((x) => x !== null)} han={it.due} onClose={onDong} onDone={doi} />;
      }
      if (it.group === 'yt_xem') {
        return (
          <PanelXemViPham key={it.key} studentId={it.studentId!} onDong={onDong} onDaLam={doi}
            dau={dauViec({ han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.yt_xem ?? 'viec-van-hanh'} han={it.due} /> : null, em: hv ? { id: it.studentId!, ten: hv } : null, lop })} />
        );
      }
      return <XacNhanXuLyPanel key={it.key} studentId={it.studentId} lop={lop} onClose={onDong} onDone={doi} />;
    case 'yt_hoi_tinh_hinh':
      /* TINH-HINH (mockup v20 F2): TVV hỏi tình hình — GVCN ghi kết quả tại chỗ. */
      return <PanelHoiTinhHinh key={it.key} id={soCuaKhoa(it.key)!} ten={it.studentName} lop={lop} cauHoi={it.reason} han={it.due}
        onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
    case 'yt_thuc_hien':
      return <DaThucHienPanel key={it.key} measureId={soCuaKhoa(it.key)} onClose={onDong} onDone={doi} />;
    case 'khai_bac':
      if (it.studentId === null) return <LoYThucPanel key={it.key} classId={it.classId!} lop={lop} viec="cap-bac" studentIds={it.emIds ?? null} onClose={onDong} onDone={doi} />;
      return <KhaiBacPanel key={it.key} studentId={it.studentId} onClose={onDong} onDone={doi} onTiep={onTiep} />;
    case 'mgmt':
      return <NganViecVanHanh key={it.key} taskId={soCuaKhoa(it.key)} onClose={onDong} onDone={doi} />;
    /* UI-CV-TVV (mockup `tvv.html`): KQ thi thật + Chọn bước tiếp = MỘT panel Sau thi hai bước. */
    case 'buoc_tiep': case 'thi_that':
      return <PanelSauThi key={it.key} cycleId={soCuaKhoa(it.key)!} em={{ id: it.studentId!, ten: it.studentName }} lop={lop} onDong={onDong} onDaLam={doi} onTiep={onTiep} tenTiep={tenTiep} />;
    case 'bao_ph_yt':
      return <PanelBaoPhTvv key={it.key} it={it} onDong={onDong} onDaLam={doi} onTiep={onTiep} tenTiep={tenTiep} />;
    case 'phoi_hop_sos': case 'phoi_hop_tvv':
      return <PanelPhoiHop key={it.key} it={it} onDong={onDong} onDaLam={doi} onTiep={onTiep} />;
    case 'phoi_hop':
      return <PanelBaoPh key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    case 'missing_data':
      if (it.key.startsWith('chot-ngay-thi:')) {
        return <PanelChotNgayThi key={it.key} cycleId={soCuaKhoa(it.key)!} em={{ id: it.studentId!, ten: it.studentName }} lop={lop} duKien={it.contextLabel}
          onDong={onDong} onDaLam={doi} onTiep={onTiep} tenTiep={tenTiep} />;
      }
      return <SuaThongTinMotEm key={it.key} studentId={it.studentId!} studentName={it.studentName} lop={lop} onClose={onDong} onDone={doi} />;
    case 'bo_sung_ho_so':
      return <PanelBoSungHoSo key={it.key} emIds={it.emIds ?? []} onDong={onDong} onDaLam={doi} />;
    /* P9a: thanh Việc cần làm ở hồ sơ lớp — panel Xét lại tại chỗ (ở Công việc: "Xét lại ›" đổi trang, `lamTaiCho` = false). */
    case 'xet_lai_lo_trinh':
      return <PanelXetLai key={it.key} classId={it.classId!} onClose={onDong} onDone={doi} />;
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

/** Chân panel việc chấm: "Việc tiếp ›" (nổi bật khi đã đủ phần người xem); không có việc kế → không chân. */
const chanViecTiep = (onTiep: (() => void) | null | undefined, xong: boolean) => (onTiep ? {
  huy: null,
  /* Nút hành động kế (không phải nút lựa chọn — NEN B3): nổi bật khi đã đủ phần người xem. */
  chinh: <button type="button" className={xong ? 'btn btn-primary min-h-[44px] sm:min-h-0' : 'btn min-h-[44px] sm:min-h-0'} onClick={onTiep}>{t('Việc tiếp ›')}</button>,
} : undefined);
const hetViec = (onTiep: (() => void) | null | undefined) => () => (onTiep ? { nhan: t('Việc tiếp ›'), onClick: onTiep } : null);

export function PanelNhapDiem({ it, onDong, onDaLam, quayLai, tuMo = false, onTiep = null, chiEmViec = false }: {
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
    <KhungPanel hd="nhap-diem" tieuDe={dich(tieuDe)} dau={dau} quayLai={quayLai} onDong={onDong} quyChe={data ? quyCheVang(data.mode === 'ratio') : null}
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
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} dau={dauViec({ em: { id: it.studentId!, ten: it.studentName }, lop: it.classCode, ngCanh: it.contextLabel })} onDong={onDong}>
      <div className="pt-3">
        {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
          : <PhoiHopSosSection turns={data?.rows ?? null} loading={loading} cot1="luot" onChanged={() => { reload(); onDaLam(); }} />}
      </div>
    </KhungPanel>
  );
}

/**
 * NHẬP ĐIỂM THEO TUẦN THI (OV-13c, Q4; mockup OV-13 §3a): một dòng = một tuần thi của một người giữ việc, có thể nhiều lớp. Panel = lưới điểm của
 * tuần đó từng lớp (`LuoiNhung`, cùng lưới Lịch Test — luật chấm không đổi), lớp đầu mở sẵn. Danh sách lớp giữ như lúc mở: lớp vừa nhập xong
 * không biến khỏi panel khi Công việc tải lại.
 */
function PanelNhapDiemTuan({ it, tuMo, onDong, onDaLam, onTiep }: { it: WorkItem; tuMo: boolean; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null }) {
  const [lop] = useState(() => (it.con?.length ? it.con : [it]));
  /* R1-LUU-TIEP: hết bài của người xem ở một lớp → "Lớp tiếp: {mã} ›" (lớp kế của việc, theo thứ tự) mở lớp đó tại panel, con trỏ ô trống đầu;
     lớp cuối → "Việc tiếp ›". ponytail: lớp kế theo thứ tự, không đếm bài còn thiếu (dữ liệu từng lớp nằm trong `LuoiNhung`) — lớp kế đã xong thì hộp báo hết ngay. */
  const [conTro, setConTro] = useState<string | null>(null);
  const hetLop = (x: WorkItem) => () => {
    const ke = lop[lop.indexOf(x) + 1];
    if (!ke) return hetViec(onTiep)();
    return { nhan: t('Lớp tiếp: {lop} ›', { lop: ke.classCode ?? '' }), onClick: () => { setMo(new Set([ke.key])); setConTro(ke.key); } };
  };
  /* GD-3 (mockup v21 K2): một lớp → tiêu đề = tên việc ("Nhập điểm Listening, Reading"), dòng 2 "lớp · tuần · n bài", lưới ngay dưới (không hàng gập lớp). */
  const motLop = lop.length === 1;
  const [tieuDe] = useState(() => (motLop && it.tieuDe ? dich(it.tieuDe) : t('Nhập điểm · {tuan}', { tuan: it.tuanThi ? tuanLich(it.tuanThi) : '' })));
  const [mo, setMo] = useState<ReadonlySet<string>>(() => new Set([lop[0].key]));
  const periodId = lop[0].periodId ?? null;
  const dau = dauViec({
    han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.score ?? 'nhap-diem'} han={it.due} /> : null,
    ngCanh: (
      <Link className="link" to={duongLichTest({ periodId })}>
        {motLop ? [lop[0].classCode, it.tuanThi ? tuanLich(it.tuanThi) : null].filter(Boolean).join(' · ') : t('{n} lớp', { n: new Set(lop.map((x) => x.classId)).size })} · {t('{soBai} bài', { soBai: lop.reduce((n, x) => n + (x.soBai ?? 0), 0) })}
      </Link>
    ),
  });
  const luoiLop = (x: WorkItem, lopKhung: string) => (
    <LuoiTrongPanel className={lopKhung}>
      <LuoiNhung chiHv={emCuaViec(x)} classId={x.classId!} periodId={x.periodId ?? null} kind={x.kind ?? null} tuanDangXem={x.tuanThi ?? null} kn={x.kn ?? null}
                    hrefDayDu={duongLichTest({ classId: x.classId, periodId: x.periodId })} onDaLuu={onDaLam} chiCot={x.kns ?? (x.kn ? [x.kn] : null)}
                    emCoBaiTuan={(x.kind ?? 'mock') === 'mock'} luoiGon
                    /* OV-14b: lớp đầu (mở sẵn) cuộn ngang tới cột của việc + con trỏ ở ô trống đầu cột đó; lớp mở sau không giật trang. */
                    datConTro={(!tuMo && !!x.kn && x.key === lop[0].key) || x.key === conTro} onHet={hetLop(x)} />
    </LuoiTrongPanel>
  );
  return (
    <KhungPanel hd="nhap-diem" tieuDe={tieuDe} dau={dau} onDong={onDong} chan={chanViecTiep(onTiep, false)} quyChe={quyCheVang(it.khung === 'thuong')}>
      {motLop ? luoiLop(lop[0], 'luoi-trong-panel -mx-4 px-2 pt-1') : (
      <ul className="-mx-4 m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
        {lop.map((x) => {
          const dangMo = mo.has(x.key);
          return (
            <li key={x.key}>
              <button type="button" aria-expanded={dangMo} onClick={() => setMo((s) => { const n = new Set(s); if (dangMo) n.delete(x.key); else n.add(x.key); return n; })}
                className="flex min-h-[44px] w-full appearance-none items-center gap-2 border-0 bg-transparent px-4 py-2.5 text-left sm:min-h-0">
                <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`shrink-0 transition-transform ${dangMo ? 'rotate-90' : ''}`}>
                  <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <b className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-slate-100">{x.classCode}</b>
                <span className="min-w-0 truncate text-xs text-slate-400">{dich(x.contextLabel ?? '')} · {dich(x.phu ?? x.reason)} · {t('{soBai} bài', { soBai: x.soBai ?? 0 })}</span>
              </button>
              {dangMo && luoiLop(x, 'luoi-trong-panel px-2 pb-2')}
            </li>
          );
        })}
      </ul>
      )}
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
      await api.put(`/classes/${it.classId}/teachers`, { slots, phienBan: data.phienBan });
      invalidate('/classes'); invalidate('/cases');
      toast.push('ok', t('Đã phân công {nhan}', { nhan }));
      onDaLam();
    } catch (e: any) {
      setLoi(e?.message ?? t('Không lưu được'));
      /* SUA-NO-RA (CV-LOI-a): người khác vừa đổi phân công lớp → tải lại bức tranh mới, GIỮ người đang chọn để bấm Giao lại. */
      if (e instanceof ApiError && e.status === 409) reload();
    } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} onDong={onDong}
      dau={dauViec({ em: it.studentId !== null ? { id: it.studentId, ten: it.studentName } : null, lop: it.classCode, ngCanh: it.contextLabel })}>
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
    <KhungPanel tieuDe={dich(it.tieuDe)} onDong={onDong}
      dau={dauViec({ em: it.studentId !== null ? { id: it.studentId, ten: it.studentName } : null, lop: it.classCode, ngCanh: it.contextLabel })}>
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
  const { data, error, reload } = useApi<{ rows: CoordTurn[] }>(`/classes/${it.classId}/phoi-hop-sos?includeDone=1`, [it.classId]);
  const ten = tvv ? t('Báo PH · Meeting CX/GĐCN') : dich(it.tieuDe.split(' · ')[0]);
  const n = it.con?.length ?? it.count ?? 1;
  const dau = dauViec({
    han: it.due ? <ChipHan loai="phoi-hop" han={it.due} /> : null,
    ngCanh: <><Link className="ten-ho-so" to={`/hoc-vien/lop/${it.classId}?tab=y-thuc&sub=phoi-hop`}>{it.classCode}</Link>{` · ${tvv ? t('{n} em cần báo', { n }) : t('{n} em cần làm', { n })}`}</>,
  });
  return (
    <KhungPanel hd="phoi-hop-sos" tieuDe={ten} dau={dau} onDong={onDong}
      chan={{
        huy: null,
        /* YT-b (mockup v19 B1–B2, XM-1 duyệt): panel chỉ còn em cần làm — việc đã làm xem / sửa ở hồ sơ lớp › Phối hợp SOS. */
        trai: <Link className="link text-sm font-semibold max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center" to={`/hoc-vien/lop/${it.classId}?tab=y-thuc&sub=phoi-hop`}>{tvv ? t('Đã báo · hồ sơ lớp ›') : t('Đã làm · hồ sơ lớp ›')}</Link>,
        chinh: onTiep ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button> : undefined,
      }}>
      <div className="pt-2">
        {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
          : !data ? <Skeleton rows={4} />
          : <BangPhoiHop turns={data.rows} che={tvv ? { loai: 'tvv' } : { loai: 'gvcn', khoa: it.phoiHop?.khoa ?? '' }} chiEm={it.studentId} lop={it.classCode ?? undefined}
              onChanged={() => { reload(); onDaLam(); }} />}
      </div>
    </KhungPanel>
  );
}
