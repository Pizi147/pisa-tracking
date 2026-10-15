import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { dauViec } from '../../ui/KhuonViec.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { BanGiaoPanel } from '../classes/BanGiaoPanel.tsx';
import { XacNhanXuLyPanel } from '../yThuc/XacNhanXuLyPanel.tsx';
import { DaThucHienPanel } from '../yThuc/DaThucHienPanel.tsx';
import { KhaiBacPanel } from '../yThuc/KhaiBacPanel.tsx';
import { NganViecVanHanh } from '../worklist/MgmtTasksPage.tsx';
import { MotKyNang } from '../cham/MotKyNang.tsx';
import { duongDiemTheoLuot, type BangTheoLuot } from '../cham/LuoiChamLop.tsx';
import { LuoiNhung } from '../test/lichTest/LuoiNhung.tsx';
import { XacNhanPaLo } from './XacNhanPaLo.tsx';
import { LOAI_HAN_CUA_VIEC, duongLichTest, laViecChamCheo, tuanLich } from '@shared/domain/index.ts';
import { VIEC_LO_Y_THUC, type WorkItem } from '../worklist/WorkList.tsx';
import { LoYThucPanel } from '../yThuc/LoYThucPanel.tsx';
import { NganTongKet } from '../students/NganTongKet.tsx';
import { PhoiHopSosSection, type CoordTurn } from '../yThuc/PhoiHopSosSection.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/** Số sau dấu `:` cuối của khoá việc (`yt_thuc_hien:12`, `mgmt:5`). */
const soCuaKhoa = (k: string) => Number(k.slice(k.lastIndexOf(':') + 1)) || null;

/**
 * VIỆC NÀO LÀM TẠI CHỖ (OV-5a, mockup M1 §2; OV-12c): Xác nhận Case (Progress) · Ghi nhận xét (Case MT cũ) · Thêm PA / Kết quả PA / Xác nhận PA /
 * Mini Test (Ngăn Case, khuôn panel v3 cho Xác nhận Case · Xác nhận PA · Ghi nhận xét) · Nhập điểm
 * (một lớp · một lượt) · Bàn giao · Ý thức (xử lý, đã thực hiện, khai bậc một em) · việc Vận hành. Còn lại (Chốt lộ trình, Kết quả đầu ra, Xét lại
 * lộ trình cần cả bảng lớp; Phối hợp, Thiếu dữ liệu, thi thật…) mở trang như cũ. OV-8a: Chọn bước tiếp sau thi = ngăn Tổng kết lộ trình (mục Bước tiếp).
 */
export function lamTaiCho(it: WorkItem): boolean {
  if (moCaDong(it)) return true;
  switch (it.group) {
    case 'cause': case 'ghi_nhan_xet': return it.caseId !== null;
    case 'xac_nhan_pa': case 'ghi_ket_qua_pa': case 'mini_test': return it.caseId !== null && !!it.paId;
    case 'no_plan': return it.caseId !== null;
    case 'score': return (!!it.luot || !!it.periodId) && it.classId !== null;
    case 'ban_giao': return it.classId !== null;
    case 'yt_xu_ly': return it.studentId !== null || laLo(it);
    case 'yt_xem': return laLo(it);
    case 'khai_bac': return it.studentId !== null || it.classId !== null;   // OV-13d: nhiều em → Xác nhận cấp bậc theo lô
    case 'phoi_hop_sos': return it.classId !== null;   // OV-12h: xác nhận meeting CX tại chỗ
    case 'yt_thuc_hien': case 'mgmt': case 'buoc_tiep': return soCuaKhoa(it.key) !== null;
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
export function PanelViec({ it, onDong, onDaLam, onTiep, onMo }: {
  it: WorkItem; onDong: () => void; onDaLam: () => void; onTiep: (() => void) | null;
  /** OV-13c: mở một việc khác tại chỗ (Xác nhận PA cùng lúc → "Đề xuất PA khác cho em này…" mở panel Xác nhận PA của em đó). */
  onMo?: (it: WorkItem) => void;
}) {
  const lop = it.classCode;
  const hv = it.studentId !== null ? it.studentName : null;
  const doi = () => { invalidate('/my-work'); onDaLam(); };
  switch (it.group) {
    case 'cause':
      return <NganCase key={it.key} caseId={it.caseId!} viec="xac-nhan" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'ghi_nhan_xet':
      return <NganCase key={it.key} caseId={it.caseId!} viec="ghi-nhan-xet" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'xac_nhan_pa':
      if (it.con) return <XacNhanPaLo key={it.key} it={it} onDong={onDong} onDaLam={onDaLam} onMo={onMo} onTiep={onTiep} />;
      return <NganCase key={it.key} caseId={it.caseId!} paId={it.paId} viec="xac-nhan-pa" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'ghi_ket_qua_pa': case 'mini_test':
      return <NganCase key={it.key} caseId={it.caseId!} paId={it.paId} viec="ghi-ket-qua" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'no_plan':
      return <NganCase key={it.key} caseId={it.caseId!} viec="them-pa" hocVien={hv} lop={lop} onClose={onDong} onChanged={onDaLam} />;
    case 'score':
      if (!laViecChamCheo(it) && (it.con || it.periodId)) return <PanelNhapDiemTuan key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
      return <PanelNhapDiem key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    case 'ban_giao':
      return <BanGiaoPanel key={it.key} classId={it.classId!} mon={it.key.startsWith('ban_giao_mon:') ? it.key.split(':')[2] ?? null : null} onClose={onDong} onDone={doi} />;
    case 'yt_xu_ly': case 'yt_xem':
      if (laLo(it)) {
        return <LoYThucPanel key={it.key} classId={it.classId!} lop={lop} viec={it.group === 'yt_xu_ly' ? 'xu-ly' : 'ghi-nhan'}
          studentIds={it.con!.map((c) => c.studentId!).filter((x) => x !== null)} han={it.due} onClose={onDong} onDone={doi} />;
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
      return <NganTongKet key={it.key} cycleId={soCuaKhoa(it.key)!} onClose={onDong} onDoi={doi} />;
    case 'phoi_hop_sos':
      return <PanelPhoiHop key={it.key} it={it} onDong={onDong} onDaLam={doi} />;
    default:
      return null;
  }
}

/**
 * NHẬP ĐIỂM TẠI CHỖ (mockup M1 §2): bảng điểm của lớp · lượt (`/classes/:id/diem-theo-luot/:luot`, cùng nguồn Điểm theo lớp), dạng MỘT KỸ NĂNG
 * MỘT LÚC (`MotKyNang`, chọn sẵn kỹ năng của việc) — ô FT mở hộp nhập điểm (Lưu · em tiếp ›), lớp thường ô gõ thẳng. Không đường ghi mới.
 */
export function PanelNhapDiem({ it, onDong, onDaLam, quayLai }: {
  it: Pick<WorkItem, 'classId' | 'luot' | 'kn' | 'studentId' | 'emIds' | 'tieuDe' | 'classCode' | 'contextLabel' | 'due'> & Partial<Pick<WorkItem, 'key' | 'phu'>>;
  onDong: () => void; onDaLam: () => void;
  /** OV-12e: mở từ panel số liệu — "← Danh sách". */
  quayLai?: { nhan: string; onClick: () => void };
}) {
  const { data, error, reload } = useApi<BangTheoLuot>(duongDiemTheoLuot(it.classId!, it.luot!), [it.classId, it.luot]);
  const daLuu = () => { reload(); onDaLam(); };
  /* OV-11c (CV-6): em của việc lên đầu; phần còn lại của lớp gập "Cả lớp (n)". Kỹ năng giữ như lúc mở (`kn` ban đầu). */
  const em = new Set(it.studentId !== null ? [it.studentId] : it.emIds ?? []);
  /* Plan mục 4: kỹ năng VÀ tiêu đề giữ như lúc mở — tải lại sau khi lưu (việc còn môn khác) không đổi chữ đầu panel dưới tay người dùng. */
  const [kn] = useState(it.kn ?? null);
  const [tieuDe] = useState(it.tieuDe);
  const tach = <S extends { rows: { studentId: number }[] }>(d: S, ve: (x: S) => ReactNode) => {
    const viec = d.rows.filter((r) => em.has(r.studentId));
    if (!viec.length || viec.length === d.rows.length) return ve(d);
    const khac = d.rows.filter((r) => !em.has(r.studentId));
    return (
      <>
        {ve({ ...d, rows: viec })}
        <details className="border-t" style={{ borderColor: 'var(--line)' }}>
          <summary className="min-h-[44px] cursor-pointer px-4 py-3 text-[13px] text-slate-300 sm:min-h-0 sm:py-2">{t('Cả lớp ({length})', { length: khac.length })}</summary>
          {ve({ ...d, rows: khac })}
        </details>
      </>
    );
  };
  /* OV-12e: đầu panel v3 — tên việc + chip hạn / lớp · lượt ↗ (xem Điểm theo lớp, tách khỏi ô nhập). */
  const dau = dauViec({
    han: it.due ? <ChipHan loai={LOAI_HAN_CUA_VIEC.score ?? 'nhap-diem'} han={it.due} /> : null,
    lop: it.classCode, ngCanh: (
      <Link className="link" to={`/test/diem-lop?lop=${it.classId}&luot=${encodeURIComponent(it.luot!)}`}>
        {dich((laViecChamCheo({ key: it.key ?? '' }) ? it.phu : it.contextLabel) ?? '')} <span aria-hidden className="text-xs">↗</span>
      </Link>
    ),
  });
  return (
    <KhungPanel tieuDe={dich(tieuDe)} dau={dau} quayLai={quayLai} onDong={onDong}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : !data ? <div className="pt-3"><Skeleton rows={6} /></div>
          : (
            <div className="-mx-4">
              {data.mode === 'ielts_band' && data.ft
                ? tach(data.ft, (d) => <MotKyNang mode="ielts_band" data={d} kn={kn} onReload={daLuu} />)
                : data.thuong ? tach(data.thuong, (d) => <MotKyNang mode="ratio" data={d} kn={kn} onReload={daLuu} anNutTao />) : null}
            </div>
          )}
    </KhungPanel>
  );
}

/**
 * NHẬP ĐIỂM THEO TUẦN THI (OV-13c, Q4; mockup OV-13 §3a): một dòng = một tuần thi của một người giữ việc, có thể nhiều lớp. Panel = lưới điểm của
 * tuần đó từng lớp (`LuoiNhung`, cùng lưới Lịch Test — luật chấm không đổi), lớp đầu mở sẵn. Danh sách lớp giữ như lúc mở: lớp vừa nhập xong
 * không biến khỏi panel khi Công việc tải lại.
 */
function PanelNhapDiemTuan({ it, onDong, onDaLam }: { it: WorkItem; onDong: () => void; onDaLam: () => void }) {
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
                <div className="px-2 pb-2">
                  <LuoiNhung classId={x.classId!} periodId={x.periodId ?? null} kind={x.kind ?? null} tuanDangXem={x.tuanThi ?? null} kn={x.kn ?? null}
                    hrefDayDu={duongLichTest({ classId: x.classId, periodId: x.periodId })} datConTro={false} onDaLuu={onDaLam} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
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
