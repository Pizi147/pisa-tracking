import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PanelNhapDiemLop } from '../cham/PanelNhapDiemLop.tsx';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { BoiCanh, dauViec } from '../../ui/KhuonViec.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { chonNguoi, phuGv } from '../classes/ClassCreatePanel.tsx';
import { DongDaLuu, GhiNhanh, type DaLuuNhanh } from '../cases/GhiNhanh.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { NganCase } from '../students/NganCase.tsx';
import { BanGiaoPanel } from '../classes/BanGiaoPanel.tsx';
import { XacNhanXuLyPanel } from '../yThuc/XacNhanXuLyPanel.tsx';
import { DaThucHienPanel } from '../yThuc/DaThucHienPanel.tsx';
import { KhaiBacPanel } from '../yThuc/KhaiBacPanel.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { LuoiChamLop, duongDiemTheoLuot, type BangTheoLuot } from '../cham/LuoiChamLop.tsx';
import { LuoiNhung } from '../test/lichTest/LuoiNhung.tsx';
import { XacNhanPaLo } from './XacNhanPaLo.tsx';
import { INTERVENTION_KIND_LABEL, KHOA_CHAM_SPEAKING, LOAI_HAN_CUA_VIEC, duongLichTest, laViecChamCheo, outcomeLabelFor, tenMon, tuanLich } from '@shared/domain/index.ts';
import { PanelChamSpeaking } from './PanelChamSpeaking.tsx';
import { VIEC_LO_Y_THUC, type WorkItem } from '../worklist/WorkList.tsx';
import { LoYThucPanel } from '../yThuc/LoYThucPanel.tsx';
import { KetQuaThiThatPanel } from '../students/KetQuaThiThatPanel.tsx';
import { PanelBuocTiep } from '../students/PanelBuocTiep.tsx';
import { StudentYThucSection } from '../yThuc/StudentYThucSection.tsx';
import { SuaThongTinMotEm } from '../students/StudentManagePanel.tsx';
import { PhoiHopSosSection, type CoordTurn } from '../yThuc/PhoiHopSosSection.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** Số sau dấu `:` cuối của khoá việc (`yt_thuc_hien:12`, `mgmt:5`). */
const soCuaKhoa = (k: string) => Number(k.slice(k.lastIndexOf(':') + 1)) || null;

/**
 * VIỆC NÀO LÀM TẠI CHỖ (OV-5a, mockup M1 §2; OV-12c): Xác nhận Case (Progress) · Ghi nhận xét (Case MT cũ) · Thêm PA / Kết quả PA / Xác nhận PA /
 * Mini Test (Ngăn Case, khuôn panel v3 cho Xác nhận Case · Xác nhận PA · Ghi nhận xét) · Nhập điểm
 * (một lớp · một lượt) · Bàn giao · Ý thức (xử lý, đã thực hiện, khai bậc một em) · việc Vận hành. Còn lại (Chốt lộ trình, Kết quả đầu ra, Xét lại
 * lộ trình cần cả bảng lớp; Phối hợp, Thiếu dữ liệu, thi thật…) mở trang như cũ. OV-13m: Chọn bước tiếp = panel Bước tiếp (`PanelBuocTiep`).
 */
export function lamTaiCho(it: WorkItem): boolean {
  if (moCaDong(it) || it.key === KHOA_CHAM_SPEAKING) return true;   // OV-14c: Chấm Speaking — panel hàng đợi từng em
  switch (it.group) {
    case 'cause': case 'ghi_nhan_xet': return it.caseId !== null;
    case 'xac_nhan_pa': case 'ghi_ket_qua_pa': case 'mini_test': return it.caseId !== null && !!it.paId;
    case 'no_plan': return it.caseId !== null;
    case 'score': return (!!it.luot || !!it.periodId) && it.classId !== null;
    case 'ban_giao': return it.classId !== null;
    case 'yt_xu_ly': return it.studentId !== null || laLo(it);
    case 'yt_xem': return laLo(it) || it.studentId !== null;   // OV-13d lô · OV-13b (11.1e): Ghi nhận một em — tại chỗ
    case 'khai_bac': return it.studentId !== null || it.classId !== null;   // OV-13d: nhiều em → Xác nhận cấp bậc theo lô
    case 'phoi_hop_sos': return it.classId !== null;   // OV-12h: xác nhận meeting CX tại chỗ
    case 'yt_thuc_hien': case 'mgmt': case 'buoc_tiep': case 'thi_that': return soCuaKhoa(it.key) !== null;   // OV-13q: Kết quả thi thật tại chỗ
    /* OV-13b (đặc tả OV-13 §1): Ghi nhận vi phạm · Báo phụ huynh qua TVV · Điền Target (Thiếu thông tin) · Chọn người phụ trách — tại chỗ.
       Thiếu thông tin khác (Chốt tuần MT, Nhập điểm MT cũ, mốc thi) cần cả trang — mở trang như cũ. */
    case 'phoi_hop': return it.studentId !== null;
    case 'missing_data': return it.studentId !== null && it.key.startsWith('target:');
    case 'no_owner': return it.classId !== null && !!it.thieuNguoi;   // CV-LOI: Phân công GV môn / GVCN còn thiếu — tại chỗ
    default: return false;
  }
}

/** OV-13d: dòng gộp Ý thức theo lớp (Xác nhận xử lý · Ghi nhận) → panel lô của đúng các em trong dòng. */
const laLo = (it: WorkItem) => !!it.con?.length && it.classId !== null && VIEC_LO_Y_THUC.has(it.group);

/**
 * OV-13c (mockup OV-13 §3a): dòng gộp làm CẢ DÒNG trong một panel — Xác nhận PA cùng lúc (Case SOS FT cùng lớp + tuần thi + mức SOS) · Nhập điểm theo tuần
 * thi (lưới điểm từng lớp của tuần đó). Bấm dòng mở panel, không mở danh sách em; "việc tiếp" đi qua cả dòng.
 */
/* OV-13g: Speaking chấm chéo KHÔNG mở lưới cả tuần — bấm mở danh sách lớp, mỗi lớp "Chấm" → panel nhập điểm S (mockup OV-13 §3b). */
export const moCaDong = (it: WorkItem): boolean => !!it.con?.length && !laViecChamCheo(it)
  && (it.group === 'xac_nhan_pa' ? it.con.every((c) => !!c.paId) : it.group === 'score' && it.con.every((c) => !!c.periodId && c.classId !== null));

/**
 * PANEL PHẢI CỦA MỘT VIỆC — dùng lại đúng panel sẵn có (không viết lại): `NganCase` đúng việc, `BanGiaoPanel`, form Ý thức, `NganViecVanHanh`,
 * `MotKyNang` (danh sách em một kỹ năng, ô mở hộp nhập điểm "Lưu · em tiếp ›"). Nơi gọi bọc `KhungTaiCho` để panel nằm tại chỗ.
 * `onDaLam`: việc vừa có thay đổi đã lưu — nơi gọi giữ dòng ở chỗ cũ (mờ + gạch khi máy chủ không còn trả việc đó).
 */
export function PanelViec({ it, tuMo = false, onDong, onDaLam, onTiep, onMo }: {
  it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null;
  /** CV-LOI (CV-09): panel do trang tự mở (không phải người bấm) — lưới điểm không đặt con trỏ, không cuộn. */
  tuMo?: boolean;
  /** OV-13c: mở một việc khác tại chỗ (Xác nhận PA cùng lúc → "Đề xuất PA khác cho em này…" mở panel Xác nhận PA của em đó). */
  onMo?: (it: WorkItem) => void;
}) {
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
      if (it.group === 'ghi_ket_qua_pa' && it.ghiNhanh && it.paId) return <PanelKetQuaNhanh key={it.key} it={it} onDong={onDong} onDaLam={onDaLam} onTiep={onTiep} />;
      return <NganCase key={it.key} caseId={it.caseId!} paId={it.paId} viec="ghi-ket-qua" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    case 'no_plan':
      return <NganCase key={it.key} caseId={it.caseId!} viec="them-pa" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
    case 'score':
      if (it.key === KHOA_CHAM_SPEAKING) return <PanelChamSpeaking key={it.key} onDong={onDong} onDaLam={doi} />;
      if (!laViecChamCheo(it) && (it.con || it.periodId)) return <PanelNhapDiemTuan key={it.key} it={it} tuMo={tuMo} onDong={onDong} onDaLam={doi} />;
      return <PanelNhapDiem key={it.key} it={it} tuMo={tuMo} anDan onDong={onDong} onDaLam={doi} />;
    case 'ban_giao':
      return <BanGiaoPanel key={it.key} classId={it.classId!} mon={it.key.startsWith('ban_giao_mon:') ? it.key.split(':')[2] ?? null : null} onClose={onDong} onDone={doi} />;
    case 'yt_xu_ly': case 'yt_xem':
      if (laLo(it)) {
        return <LoYThucPanel key={it.key} classId={it.classId!} lop={lop} viec={it.group === 'yt_xu_ly' ? 'xu-ly' : 'ghi-nhan'}
          studentIds={it.con!.map((c) => c.studentId!).filter((x) => x !== null)} han={it.due} onClose={onDong} onDone={doi} />;
      }
      if (it.group === 'yt_xem') {
        return (
          <KhungPanel key={it.key} tieuDe={dich(it.tieuDe)} dau={dauViec({ han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.yt_xem ?? 'viec-van-hanh'} han={it.due} /> : null, em: hv ? { id: it.studentId!, ten: hv } : null, lop })} onDong={onDong}>
            <div className="pt-3"><StudentYThucSection studentId={it.studentId!} /></div>
          </KhungPanel>
        );
      }
      return <XacNhanXuLyPanel key={it.key} studentId={it.studentId} lop={lop} onClose={onDong} onDone={doi} />;
    case 'yt_thuc_hien':
      return <DaThucHienPanel key={it.key} measureId={soCuaKhoa(it.key)} onClose={onDong} onDone={doi} />;
    case 'khai_bac':
      if (it.studentId === null) return <LoYThucPanel key={it.key} classId={it.classId!} lop={lop} viec="cap-bac" studentIds={it.emIds ?? null} onClose={onDong} onDone={doi} />;
      return <KhaiBacPanel key={it.key} studentId={it.studentId} onClose={onDong} onDone={doi} />;
    case 'mgmt':
      return <NganViecVanHanh key={it.key} taskId={soCuaKhoa(it.key)} onClose={onDong} onDone={doi} />;
    case 'buoc_tiep':
      return <PanelBuocTiep key={it.key} cycleId={soCuaKhoa(it.key)!} hocVien={hv ? { id: it.studentId!, ten: hv } : null} lop={lop} onClose={onDong} onDone={doi} onTiep={onTiep} />;
    case 'thi_that':
      return <KetQuaThiThatPanel key={it.key} cycleId={soCuaKhoa(it.key)!} studentName={it.studentName} lop={lop} onClose={onDong} onDone={doi} />;
    case 'phoi_hop_sos':
      return <PanelPhoiHop key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    case 'phoi_hop':
      return <PanelBaoPh key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    case 'missing_data':
      return <SuaThongTinMotEm key={it.key} studentId={it.studentId!} studentName={it.studentName} lop={lop} onClose={onDong} onDone={doi} />;
    case 'no_owner':
      return <PanelPhanCongMon key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    default:
      return null;
  }
}

/**
 * NHẬP ĐIỂM TẠI CHỖ (mockup M1 §2; OV-15b mockup 2 khung 1a): bảng điểm của lớp · lượt (`/classes/:id/diem-theo-luot/:luot`), lưới chung
 * `LuoiChamLop` chỉ cột của việc (`kns`) + "Cả lớp"; màn hẹp một kỹ năng một lúc (`MotKyNang`). Không đường ghi mới.
 */
export function PanelNhapDiem({ it, onDong, onDaLam, quayLai, tuMo = false, anDan = false }: {
  it: Pick<WorkItem, 'classId' | 'luot' | 'kn' | 'studentId' | 'emIds' | 'tieuDe' | 'classCode' | 'contextLabel' | 'due'> & Partial<Pick<WorkItem, 'key' | 'phu' | 'kns'>>;
  onDong: () => void; onDaLam: () => void;
  /** OV-12e: mở từ panel số liệu — "← Danh sách". */
  quayLai?: { nhan: string; onClick: () => void };
  /** CV-LOI: trang tự mở (không con trỏ, không cuộn — CV-09) · panel việc Công việc không Dán Excel (12.3). */
  tuMo?: boolean; anDan?: boolean;
}) {
  const { data, error, reload } = useApi<BangTheoLuot>(duongDiemTheoLuot(it.classId!, it.luot!), [it.classId, it.luot]);
  const daLuu = () => { reload(); onDaLam(); };
  /* OV-15b: "lớp · lượt ↗" đổi panel này sang Nhập điểm cả lớp (cùng chỗ, không panel lồng panel); "‹ Việc" quay về việc. */
  const [caLop, setCaLop] = useState(false);
  /* Plan mục 4: kỹ năng VÀ tiêu đề giữ như lúc mở — tải lại sau khi lưu (việc còn môn khác) không đổi chữ đầu panel dưới tay người dùng. */
  const [kn] = useState(it.kn ?? null);
  const [kns] = useState(() => it.kns ?? (it.kn ? [it.kn] : null));
  const [tieuDe] = useState(it.tieuDe);
  /* OV-15b (mục 1, mockup 2 khung 1a / 2): lưới chung, chỉ cột của việc + Kết quả, con trỏ ở ô trống đầu. Việc một em: chỉ hàng em đó;
     "Cả lớp" mở mọi em + mọi cột. */
  const chiAttempt = useMemo(() => (data && it.studentId !== null
    ? new Set((data.ft?.rows ?? data.thuong?.rows ?? []).filter((r) => r.studentId === it.studentId).map((r) => r.attemptId)) : null), [data, it.studentId]);
  /* OV-12e: đầu panel v3 — tên việc + chip hạn / lớp · lượt ↗ (xem Điểm theo lớp, tách khỏi ô nhập). */
  const dau = dauViec({
    han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.score ?? 'nhap-diem'} han={it.due} /> : null,
    lop: it.classCode, ngCanh: (
      <button type="button" className="link text-left" onClick={() => setCaLop(true)}>
        {dich((laViecChamCheo({ key: it.key ?? '' }) ? it.phu : it.contextLabel) ?? '')} <span aria-hidden className="text-xs">↗</span>
      </button>
    ),
  });
  if (caLop) {
    return <PanelNhapDiemLop classId={it.classId!} classCode={it.classCode} luot={it.luot} onDong={onDong} quayLai={{ nhan: t('‹ Việc'), onClick: () => setCaLop(false) }} />;
  }
  return (
    <KhungPanel tieuDe={dich(tieuDe)} dau={dau} quayLai={quayLai} onDong={onDong}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : (
            <div className="luoi-trong-panel -mx-4 px-2">
              <LuoiChamLop data={data} kind={null} kn={kn} onReload={daLuu} gon anNutTao chiCot={kns} datConTro={!tuMo} anDan={anDan}
                chiAttempt={chiAttempt?.size ? chiAttempt : null} />
            </div>
          )}
    </KhungPanel>
  );
}

/** OV-13b: Báo phụ huynh qua TVV của một em tại chỗ — cùng thẻ Phối hợp của hồ sơ em (`/students/:id/phoi-hop-sos`). */
function PanelBaoPh({ it, onDong, onDaLam }: { it: WorkItem; onDong: () => void; onDaLam: () => void }) {
  const { data, loading, error, reload } = useApi<{ rows: CoordTurn[] }>(`/students/${it.studentId}/phoi-hop-sos`, [it.studentId]);
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} dau={dauViec({ em: { id: it.studentId!, ten: it.studentName }, lop: it.classCode, ngCanh: it.contextLabel })} onDong={onDong}>
      <div className="pt-3">
        {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
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
function PanelNhapDiemTuan({ it, tuMo, onDong, onDaLam }: { it: WorkItem; tuMo: boolean; onDong: () => void; onDaLam: () => void }) {
  const [lop] = useState(() => (it.con?.length ? it.con : [it]));
  const [tieuDe] = useState(() => t('Nhập điểm · {tuan}', { tuan: it.tuanThi ? tuanLich(it.tuanThi) : '' }));
  const [mo, setMo] = useState<ReadonlySet<string>>(() => new Set([lop[0].key]));
  const periodId = lop[0].periodId ?? null;
  const dau = dauViec({
    han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.score ?? 'nhap-diem'} han={it.due} /> : null,
    ngCanh: (
      <Link className="link" to={duongLichTest({ periodId })}>
        {t('{n} lớp', { n: new Set(lop.map((x) => x.classId)).size })} · {t('{soBai} bài', { soBai: lop.reduce((n, x) => n + (x.soBai ?? 0), 0) })} <span aria-hidden className="text-xs">↗</span>
      </Link>
    ),
  });
  return (
    <KhungPanel tieuDe={tieuDe} dau={dau} onDong={onDong}>
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
              {dangMo && (
                <div className="luoi-trong-panel px-2 pb-2">
                  <LuoiNhung classId={x.classId!} periodId={x.periodId ?? null} kind={x.kind ?? null} tuanDangXem={x.tuanThi ?? null} kn={x.kn ?? null}
                    hrefDayDu={duongLichTest({ classId: x.classId, periodId: x.periodId })} onDaLuu={onDaLam} chiCot={x.kns ?? (x.kn ? [x.kn] : null)} anDan
                    /* OV-14b: lớp đầu (mở sẵn) cuộn ngang tới cột của việc + con trỏ ở ô trống đầu cột đó; lớp mở sau không giật trang. */
                    datConTro={!tuMo && !!x.kn && x.key === lop[0].key} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </KhungPanel>
  );
}

type GvLop = {
  programmeCode: string | null;
  core: { userId: number }[]; bySkill: { skill: string; userId: number }[];
  candidates: { id: number; name: string; classCount: number; skills?: string[] }[];
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
  const nguoi = [...(data?.candidates ?? [])].sort((a, b) => Number(!!mon && !!b.skills?.includes(mon)) - Number(!!mon && !!a.skills?.includes(mon)));
  const giao = async () => {
    if (!data) return;
    if (chon === '') { setLoi(t('Chọn giáo viên')); return; }
    setBusy(true); setLoi(null);
    try {
      const slots = [
        ...data.core.map((c) => ({ userId: c.userId, skill: null, isCore: true })),
        ...data.bySkill.map((b) => ({ userId: b.userId, skill: b.skill, isCore: false })),
        mon ? { userId: chon, skill: mon, isCore: false } : { userId: chon, skill: null, isCore: true },
      ];
      await api.put(`/classes/${it.classId}/teachers`, { slots });
      invalidate('/classes'); invalidate('/cases');
      toast.push('ok', t('Đã phân công {nhan}', { nhan }));
      onDaLam();
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} onDong={onDong}
      dau={dauViec({ em: it.studentId !== null ? { id: it.studentId, ten: it.studentName } : null, lop: it.classCode, ngCanh: it.contextLabel })}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={3} /></div>
          : (
            <div className="flex flex-col gap-3 pt-3">
              <Truong nhan={nhan} batBuoc loi={loi} as="div">
                <ChonNguoi nhom="giao_vien" choToi={false} choNgoai={false} ariaLabel={t('{nhan}: chọn giáo viên', { nhan })} choTrong={t('— Chưa chọn —')}
                  ds={nguoi.map((g) => ({ id: g.id, ten: g.name, phu: phuGv(g) }))} value={chonNguoi(chon, nguoi, (g) => phuGv(g))}
                  onChange={(v) => { setChon(v?.kieu === 'tai_khoan' ? v.id : ''); setLoi(null); }} />
              </Truong>
              <div>
                <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void giao()}>{busy ? t('Đang lưu…') : t('Giao')}</button>
              </div>
            </div>
          )}
    </KhungPanel>
  );
}

/**
 * CV-LOI (02 mục 4.7 A12, X-62, ảnh v4-3): Kết quả PA ghi nhanh được — khung phải như mọi việc, không mở dưới dòng. Đầu = tên việc + hạn · em · lớp;
 * Bối cảnh (Phương án · Kết quả kỳ trước); form gọn `GhiNhanh` (Tiến triển · Nhận xét · Lưu — vẫn 3 bấm); "Điều chỉnh / Kết thúc…" mở phần đủ ngay tại
 * chỗ (`NganCase`, chữ mang theo). Lưu xong: "✓ Đã lưu · Hoàn tác" + Việc tiếp ›.
 */
function PanelKetQuaNhanh({ it, onDong, onDaLam, onTiep }: { it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null }) {
  const { homNay } = useNgayNghiepVu();
  const [lon, setLon] = useState(false);
  const [daLuu, setDaLuu] = useState<DaLuuNhanh | null>(null);
  const { data } = useApi<any>(`/cases/${it.caseId}`, [it.caseId]);
  const em = it.studentId !== null ? { id: it.studentId, ten: it.studentName } : null;
  if (lon) return <NganCase caseId={it.caseId!} paId={it.paId} viec="ghi-ket-qua" hocVien={em?.ten ?? null} lop={it.classCode} onClose={onDong} onChanged={onDaLam} onTiep={onTiep} />;
  const iv = (data?.interventions ?? []).find((x: any) => x.id === it.paId);
  const truoc = (data?.followups ?? []).find((f: any) => f.interventionId === it.paId && f.outcome);
  const tenLoai = iv ? dich(INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind) : null;
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} onDong={onDong}
      dau={dauViec({ han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.ghi_ket_qua_pa ?? 'cap-nhat-pa'} han={it.due} /> : null, em, lop: it.classCode, ngCanh: it.contextLabel })}>
      <div className="flex flex-col gap-4 pt-3">
        <BoiCanh dong={[
          [t('Phương án'), iv ? [iv.description || tenLoai, iv.performer, iv.mocChu].filter(Boolean).join(' · ') : null],
          [t('Kết quả kỳ trước'), truoc ? <><b className="font-semibold text-slate-300">{dich(outcomeLabelFor(truoc.outcome))}</b> · {tuanLich(truoc.observedOn, homNay)}</> : null],
        ]} />
        {daLuu ? (
          <div className="flex flex-col gap-2">
            <DongDaLuu kq={daLuu} onHoanTac={() => setDaLuu(null)} />
            <div>
              {onTiep
                ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={onTiep}>{t('Việc tiếp ›')}</button>
                : <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onDong}>{t('Đóng')}</button>}
            </div>
          </div>
        ) : (
          <GhiNhanh key={it.paId} paId={it.paId!} batBuoc={!!iv?.batBuoc} onDaLuu={(kq) => { setDaLuu(kq); onDaLam(); }} onMoPanel={() => setLon(true)} />
        )}
      </div>
    </KhungPanel>
  );
}

/** OV-12h: Phối hợp SOS của lớp (lượt chưa xong) tại chỗ — cùng thẻ lượt / form Xác nhận của hồ sơ lớp; meeting CX có hạn 5 ngày. */
function PanelPhoiHop({ it, onDong, onDaLam }: { it: WorkItem; onDong: () => void; onDaLam: () => void }) {
  const { data, loading, error, reload } = useApi<{ rows: CoordTurn[] }>(`/classes/${it.classId}/phoi-hop-sos`, [it.classId]);
  const dau = dauViec({
    han: it.due ? <ChipHan loai="phoi-hop" han={it.due} /> : null,
    ngCanh: <Link className="link" to={`/hoc-vien/lop/${it.classId}?tab=y-thuc&sub=phoi-hop`}>{it.classCode} <span aria-hidden className="text-xs">↗</span></Link>,
  });
  return (
    <KhungPanel tieuDe={dich(it.tieuDe)} dau={dau} onDong={onDong}>
      <div className="pt-3">
        {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
          : <PhoiHopSosSection turns={data?.rows ?? null} loading={loading} cot1="hocVien" onChanged={() => { reload(); onDaLam(); }} />}
      </div>
    </KhungPanel>
  );
}
