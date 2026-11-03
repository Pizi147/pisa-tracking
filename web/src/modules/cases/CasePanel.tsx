import { useContext, useEffect, useState, type ReactNode } from 'react';
import { ThanTrongCot } from '../../ui/KhungPanel.tsx';
import { MenuPa } from './MenuXoaPa.tsx';
import { KhoaNho, NhatKyPa, VachBuoi } from './FormPa.tsx';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { NhanTrangThai, Outcome } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { CHIP_VUONG, Nhan, type ToneNhan } from '../../ui/Nhan.tsx';
import { LinkLuot, MuiTen, NhanTamDung, TenCase, type LuotCase } from './SkillBoard.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand, skillLabel } from '../../lib/format.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import {
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL, INTERVENTION_STATUS_LABEL,
  NEXT_STEP_LABEL, OUTCOME_MARK, OUTCOME_TONE,
  chuAiLamDuoc, chuKhoangPa, coNguoiDay, datLaiNguoi, deadlineView, demBuoi, ghiNhanhDuoc, nhanNguoiDay, nutDongPa, outcomeLabelFor, soDongNhatKyPa, tenMon, toiKyGhi, tuanLich,
  type NguoiChon, type TrangThai,
} from '@shared/domain/index.ts';
import { DongXinYKien } from './DongXinYKien.tsx';
import { DongBuoiTutor } from './BuoiTutorO.tsx';
import type { BuoiTutor } from '@shared/domain/index.ts';
import { DongDaLuu, GhiNhanh, type DaLuuNhanh } from './GhiNhanh.tsx';
import { FormDoiPa, useDoiPa } from './DoiPa.tsx';
import { CanLam, NutChu } from '../../ui/KhuonViec.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ketQuaGanNhat } from '../yThuc/CaseSosControls.tsx';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { ChuDich } from '../../ui/ChuDich.tsx';

/**
 * MỘT VẤN ĐỀ HỌC VỤ (PR-UX3, N-4, mockup 15 §3) — kể theo hai câu người đọc cần: VẤN ĐỀ gì, và ĐÃ LÀM GÌ (các PA, mỗi PA một
 * thẻ; kết quả các tuần trước ở "Lịch sử cập nhật" thu gọn).
 *
 * Phần THÂN (`ThanCase`) dùng chung cho mọi lối vào: ngăn Case (`NganCase`, một panel đổi nội dung theo `view`) — cả trang riêng
 * `/hoc-thuat/case/:id` (`CaseRoutePage`) cũng mở ngăn này. Các thao tác (Ghi kết quả · Thêm PA · Hoàn thành · Trả lời)
 * KHÔNG còn hộp thoại đè lên ngăn — ngăn Case đổi nội dung và có dòng "← Case Listening" để về.
 */

/** Khối `boTro` như `GET /cases/:id` trả (xem `BoTroDto` ở máy chủ) — chỉ các trường giao diện cần. */
export type BoTro = {
  nhom: string; buoiMoiTuan: 1 | 2; chung: boolean;
  mon: { caseId: number; mon: string; tenMon: string }[];
};

export type CaseDetail = {
  id: number; originKind: string;
  /** SV-NX-CASE: mốc phiên bản (409 khi Case vừa đổi) — Sửa Case · Mô tả Case. */
  capNhatLuc?: string | null;
  /** Còn thiếu gì để hoàn thành case. Rỗng = đủ điều kiện đóng (mục 7.7 [5]). */
  closeBlockers: string[];
  /** PR-SOS (K3-09): `an` = ẩn nút Hoàn thành (PA theo quy chế chưa khép), `dong` = câu mờ thay nút. */
  hoanThanh?: { an: boolean; dong: string | null; ly_do: string[] } | null;
  /** PR-SOS: trạng thái Case SOS, tên ba phần, MỘT nhãn + MỘT việc tiếp, thẻ Không cần theo dõi đang chờ. */
  sos?: { fromSos: boolean; hasCause: boolean; awaitingCause: boolean; dueOn: string | null;
    /** OV-12c: Case MT (nguyên nhân = nhận xét của bài) · Case MT cũ bài chưa nhận xét. */
    laMt?: boolean; choNhanXet?: boolean;
    /** OV-13a (Q2): Case tạm — lượt chưa chốt SOS. */
    tam?: boolean;
    choDuyetKhongTheoDoi: { hanDuyet: string | null } | null; coPaChoXacNhan: boolean } | null;
  tenSos?: { mt: number | null; giua: string; sos: number | null; kck?: boolean } | null;
  /** PR-LT2a: khối PA Bổ trợ Giữa khoá (nhóm, môn) — null nếu Case không có PA bổ trợ. */
  boTro?: BoTro | null;
  trangThaiV4?: { k: string; t: TrangThai; chu: string; han: string | null };
  /** PR-VAI-b (T65): em đang Tạm dừng → ngày dừng; "quá hạn" thành nhãn vàng. */
  tamDungTu?: string | null;
  viecTiep?: { chu: string; loaiHan: string | null; han: string | null; paId?: number } | null;
  yeuCauCase?: any;
  topic?: string | null;
  student: { id: number; code: string; name: string; status: string; phuHuynh?: { parentName: string | null; parentRelation: string | null; parentPhone: string | null } } | null;
  cycle: { id: number; seq: number; route: string | null; target_score: number | null } | null;
  classId: number | null; attemptId: number | null; attemptNo: number | null;
  /** VIEW-CASE-LUOT: lượt của Case — chip lượt đầu khối Case là link tới trang lượt. */
  luot?: LuotCase | null;
  sosLevel: number | null; urgency: string | null;
  summary: string | null; headline: string; detectedAt: string; reportedBy: string | null;
  status: string; disposition: string | null; dispositionNote: string | null; closedAt: string | null;
  /** Tên Case tự sinh theo mốc mới nhất, ví dụ "MT2 - Listening dưới kỳ vọng". */
  title: string | null;
  /** Hạng mục — đơn vị của Case từ vòng 4. */
  category: string | null; categoryLabel: string | null;
  /** Mã chương trình lộ trình Case (MH2). */
  chuongTrinh?: string | null;
  /** Người phụ trách chính (mục 2.3) · R1-NO-CU (D17): nút "Đổi người…" — quyền + ứng viên do máy chủ tính. */
  ownerUserId?: number | null; owner?: string | null;
  doiChu?: { duoc: boolean; ungVien: { id: number; ten: string | null }[] };
  /** Case mở song song có chủ ý với một Case khác cùng hạng mục. */
  parallel: boolean;
  /** Lớp chấm điểm đạt/tổng (Normal) hay band 0–9 (Fast Track). */
  ratio: boolean;
  /** Các hạng mục hợp lệ để ghi điểm giáo viên tự chấm. */
  categories: { code: string; label: string }[];
  note: string | null;
  /** Hạn BÁO KẾT QUẢ của cả Case — khác hạn ghi kết quả từng phương án. */
  followUntil: string | null; followOverdue: boolean;
  /** Kết quả chung đã chốt. */
  outcome: string | null; outcomeLabel: string | null;
  outcomeNote: string | null; outcomeDecision: string | null; outcomeAt: string | null;
  /** Case bị PR-LT tự đóng khi em chuyển khỏi lớp/khoá (S16/S17) — không phải GV kết luận. */
  systemCloseReason?: string | null; systemCloseLabel: string | null;
  /** Mọi phương án đã có kết quả chưa — điều kiện để chốt kết quả chung. */
  canFinish: boolean;
  /** Các mốc trong vòng đời case. Giao diện xếp MỚI NHẤT LÊN ĐẦU (mục 4.3). */
  milestones: any[];
  issues: any[]; interventions: any[]; followups: any[]; history: any[];
  /** OV-12c (P5): Case MT — nguyên nhân theo từng lượt (nhận xét + nhóm của bài lượt đó). */
  nguyenNhanTheoLuot?: { attemptId: number; luot: string; nhanXet: string | null; nhanXetPhuTrach?: string | null; nhom: { code: string; label: string }[] }[];
  /** SV-NX-CASE (N8 ③): nhận xét Speaking chấm chéo chờ GV phụ trách xác nhận Case (null = không chờ). */
  choXacNhanS?: { nhanXet: string | null; nguoiCham: string | null; luot: string; han: string | null; coTheXacNhan: boolean } | null;
  viewer: { canEdit: boolean; canClose: boolean; canApprove: boolean; /** OV-12c: Xác nhận Case Progress (GVCN lớp đang học làm được). */ coTheXacNhanCase?: boolean;
    /** PR-LUI-a2: Mở lại (Case đã hoàn thành, QL/QT) · Sửa Case · Xoá Case / câu chặn · Kỹ năng khoá · tên để sửa. */
    coTheMoLai?: boolean; coTheSua?: boolean; coTheXoa?: boolean; chanXoa?: string | null; khoaKyNang?: boolean; tenSua?: string | null;
    /** OV-13a (C): ⋯ "Kết thúc PA" cho PA theo quy chế đang chạy — GVCN lớp đang học · Quản lý. */
    coTheKetThucPa?: boolean };
};

/** Nội dung của ngăn Case: một `KhungPanel` đổi nội dung theo view, không chồng panel. */
export type ViewCase = { loai: 'case' } | { loai: 'ghi-ket-qua'; paId: number } | { loai: 'them-pa' } | { loai: 'hoan-thanh' }
  /* PR-SOS (Q28-3): Xác nhận Case → Xác nhận PA theo quy chế. */
  | { loai: 'xac-nhan' } | { loai: 'xac-nhan-pa'; paId: number }
  /* MO-TA-CASE (N8): Case MT chưa có mô tả → Mô tả Case (mô tả + nhóm ghi thẳng vào Case). */
  | { loai: 'ghi-nhan-xet' }
  /* SV-NX-CASE (N8 ③): Speaking chấm chéo — GV phụ trách chọn mô tả Case. */
  | { loai: 'xac-nhan-s' }
  /* PR-LUI-a2: Sửa Case (+ Xoá Case ở chân). */
  | { loai: 'sua' }
  /* PR-PA (§8): Sửa PA — cùng form Thêm PA; mở từ ⋯ của dòng PA. */
  | { loai: 'sua-pa'; paId: number }
  /* OV-7b: sửa lần ghi Kết quả gần nhất của PA — cùng form Kết quả, điền sẵn. */
  | { loai: 'sua-ket-qua'; followupId: number };

/** "Case Listening" — tên ngắn của Case cho tiêu đề ngăn và dòng "← Case Listening". */
export function tenNganCase(d: { categoryLabel: string | null; category: string | null; chuongTrinh?: string | null }): string {
  /* MH2: máy chủ đã gửi `categoryLabel` theo chương trình ("Case G+V" đọc là "Case Grammar + Vocabulary"). */
  const kn = d.categoryLabel ?? (d.category ? tenMon(d.chuongTrinh ?? null, d.category) : null);
  return kn ? `Case ${kn}` : 'Case';
}

const daBatDau = (iv: any) => iv.status === 'planned' || iv.status === 'started';

/** Tone `Nhan` của trạng thái PA (trạng thái CÔNG VIỆC, không phải kết quả — mục 2.2): xanh dương đang chạy, tím chờ, xám xong/huỷ. */
function toneTrangThaiPa(status: string): ToneNhan {
  return status === 'completed' ? 'done' : status === 'cancelled' ? 'muted' : status === 'planned' ? 'muted' : 'doing';
}

/** Số ngày từ `tu` đến `den` (ISO), `null` khi thiếu. */
function soNgayGiua(tu: string | null | undefined, den: string | null | undefined): number | null {
  if (!tu || !den) return null;
  const a = Date.parse(`${tu.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${den.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(a) || Number.isNaN(b) ? null : Math.round((b - a) / 86_400_000);
}

/** M6 6b-2 (Q1): PA vừa thêm / vừa ghi kết quả — thẻ PA viền nhấn + "✓ {chu} · Hoàn tác" (đường đảo của form, 10 giây). */
export type VuaDoiPa = { paId: number; chu: string; hoanTac?: () => Promise<void> };

/**
 * KHỐI CASE A (M6 6b-2, mockup `thiet-ke/v7/panel-pilot.html` "Case — phương án A", "Vòng 2 · chữ") — THÂN Case dùng chung cho mọi lối vào (Ngăn Case,
 * trang riêng, panel việc; M5 ② và trang lượt M4 dùng lại): một cột đọc từ trên xuống, mỗi mục một ĐẦU MỤC (`DauMuc`) — Case (tên · Điểm · Nguyên nhân ·
 * Mô tả) → Phương án (Chờ duyệt · xác nhận / Đang theo dõi; Đã kết thúc gập; việc của PA nằm ngay trong thẻ PA; dòng PA mang `data-pa-id` cho Hành trình
 * cuộn tới) → Kết luận → Lịch sử (gập) → Bằng chứng. Không vỏ, không chân — vỏ là `KhungPanel` của nơi gọi.
 */
export function ThanCase({ data, onViec, onDoi, paNutChinh = null, paViec = null, vuaDoi = null, onHoanTac, anNutMoTa = false, lyDoKhoa = null, dauCoDiem = false }: {
  /** U03 A2: đầu panel đã có tên Case + SOS + dải Điểm · Kỳ vọng — thân không lặp dòng tên Case và dòng Điểm. */
  dauCoDiem?: boolean;
  /** U02 (PTA 04/11): trong cột hồ sơ HV — lý do chưa hoàn thành được (PA quy chế chưa khép) vào ⓘ cạnh "Kết luận". */
  lyDoKhoa?: ReactNode;
  /** U02: nút "Mô tả Case" đã ở dòng tóm tắt Case (cột hồ sơ HV) — trường Mô tả chỉ ghi "Chưa có". */
  anNutMoTa?: boolean;
  /** 6c (#644 XM-4): PA mà việc đang mở (view dưới, panel việc) đã làm — thẻ PA đó không lặp thao tác của việc. */
  paViec?: number | null;
  data: CaseDetail; onViec: (v: ViewCase) => void; /** OV-13b: đã lưu tại chỗ (ghi nhanh, chọn người dạy, rút) — nơi gọi tải lại. */ onDoi?: () => void;
  /** OV-14b: PA mà nút chính ở chân panel đã là "Xác nhận PA" — thẻ PA đó không lặp nút. */
  paNutChinh?: number | null;
  /** M6 6b-2 (Q1): PA vừa đổi ở form trong chuỗi Case; `onHoanTac` = đã hoàn tác xong (nơi gọi tải lại). */
  vuaDoi?: VuaDoiPa | null; onHoanTac?: () => void;
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const primary = data.issues.find((i) => i.role === 'primary') ?? null;
  const secondary = data.issues.filter((i) => i.role === 'secondary');
  const context = data.issues.filter((i) => i.role === 'context');
  /* Đang chạy lên trên, đã xong xuống dưới; trong mỗi nhóm, mới nhất trước. OV-13b: PA mới của đề xuất đổi PA đang chờ / bị từ chối nằm ở dòng PA gốc. */
  const dsPa = [...(data.interventions ?? [])].filter((x) => !(x.laPaDoi && (x.approvalState === 'pending' || x.approvalState === 'declined'))).sort((a, b) =>
    Number(daBatDau(b)) - Number(daBatDau(a)) || (b.id as number) - (a.id as number));
  /* Case A: PA còn mở chia "Chờ duyệt · xác nhận" (việc đang chờ ai đó) và "Đang theo dõi"; PA đã khép gập ở "Đã kết thúc". */
  const paMo = dsPa.filter((x) => daBatDau(x));
  const paCho = paMo.filter((x) => x.awaitingConfirmation || x.approvalState === 'pending' || x.chuaChay);
  const paChay = paMo.filter((x) => !paCho.includes(x));
  const paKhep = dsPa.filter((x) => !daBatDau(x));
  const lichSu = buildLichSu(data, ngan);
  const chiXem = !data.viewer.canClose && data.status !== 'done';
  /* Số bằng chứng ở đầu thẻ: cùng đường với `BangChung` (lời gọi đang bay dùng chung), thêm / gỡ xong thì tải lại. */
  const bc = useApi<{ rows: unknown[] }>(`/attachments?ownerType=sos_case&ownerId=${data.id}`, [data.id]);
  /* OV-11d (HV-20): Case giữ sau "Overall đã đạt" (OV-1c) — nói ngay đầu Case, không chỉ trong Lịch sử thu gọn. */
  const overallDat = data.status !== 'done' ? [...(data.milestones ?? [])].reverse().find((m) => m.kind === 'overall_dat') : null;
  const diem = ketQuaGanNhat(data);
  const khung = useContext(ThanTrongCot);
  const [moBc, setMoBc] = useState(false);
  const pa = (iv: any) => <TheKhoiPa key={iv.id} iv={iv} data={data} homNay={homNay} ngan={ngan} onViec={onViec} onDoi={onDoi} anXacNhan={iv.id === paNutChinh} anViec={iv.id === paViec}
    vua={vuaDoi?.paId === iv.id ? vuaDoi : null} onHoanTac={onHoanTac} />;
  const nhomPa = (ten: string, ds: any[]) => ds.length > 0 && (
    <>
      {paCho.length > 0 && paChay.length > 0 && <p className="m-0 mt-1 flex items-center gap-2 text-[13px] font-semibold text-slate-300">{ten} <span className={`${CHIP_VUONG} text-slate-300`} style={{ borderColor: 'var(--line-strong)' }}>{ds.length}</span></p>}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">{ds.map(pa)}</ul>
    </>
  );

  return (
    <>
      {overallDat && (
        <p className="m-0 mt-3 rounded-lg bg-ok-bg px-3 py-2 text-[13px] text-ok">
          {t('Overall {x} đã đạt — xem và Hoàn thành Case', { x: overallDat.dot ?? (overallDat.attemptNo ? `MT${overallDat.attemptNo}` : '') })}
        </p>
      )}
      {/* VIEW-CASE-LUOT (mockup panel-pilot đầu mục Case): có lượt → đầu mục "Case MT3 · W2 SEP" (link), tên Case (phần giữa + SOS) là dòng đầu ngay dưới; Case tay giữ tên ở đầu mục. */}
      {/* U02 (PTA 04/11): trong cột không vẽ link lượt — lượt đã ở chip "MTn ✗ …" dòng tóm tắt, mở lượt bằng "MTn ›" của bảng Mock Test cùng trang. */}
      <DauMuc dau tieuDe="Case" phu={khung ? null : data.luot ? <LinkLuot luot={data.luot} kn={data.topic} />
        : <span className="min-w-0 text-[13px] font-medium text-slate-300"><TenCase c={{ title: data.title ?? data.headline, tenSos: data.tenSos ?? null }} /></span>}>
        {data.luot && !khung && !dauCoDiem && <p className="m-0 -mt-1 text-[13px] font-medium text-slate-300"><TenCase c={{ title: data.title ?? data.headline, tenSos: data.tenSos ?? null }} luot={data.luot} anLuot /></p>}
        {/* Case A (mockup audit 03/11 `.fld`, U02 c2 + U03 A2): khung trường nhãn trái 13 / 500 mờ | giá trị 15 sáng, mỗi hàng một kẻ; Nguyên nhân = thẻ,
            Mô tả = đoạn trích vạch trái + nguồn 12 mờ dưới. Trong cột hồ sơ HV: Điểm đã ở dòng tóm tắt (chip MTn) — không lặp. "Ghi nhận" → "Mô tả" (N8). */}
        <dl className="fld">
          {diem && !khung && !dauCoDiem && <><dt>{t('Điểm')}</dt><dd>{diem}</dd></>}
          {(primary || secondary.length > 0) && <>
            {/* N8 (PTA rà #632): Nguyên nhân chỉ ghi NHÓM (chính trước, phụ sau) — câu nhận xét / mô tả nằm ở dòng Mô tả, không lặp. */}
            <dt>{t('Nguyên nhân')}</dt>
            <dd><span className="flex flex-wrap items-center gap-1.5">{[...(primary ? [primary] : []), ...secondary].map((x) => <span key={x.id} className="the-phu">{dich(x.label)}</span>)}</span></dd>
          </>}
          <dt>{t('Mô tả')}</dt>
          <dd className="flex flex-col items-start gap-1">
            {/* N8: mô tả Case = câu của nguyên nhân chính (cùng nguồn #626: đi theo nhận xét bài `moTaTuMt` — chỉ ghi lượt, vì ngày dòng là ngày đồng bộ,
                không phải ngày GV nhận xét; hoặc người ghi / sửa riêng `byName` · ngày) ·
                không có thì tóm tắt của Case · thật sự không có → "Chưa có" + "Mô tả Case" khi người xem làm được. */}
            {primary?.observation || data.summary ? (
              <MoTaGon dai={(primary?.observation ?? data.summary ?? '').length > 180}>
                {primary?.observation
                  ? <ChuDich chu={primary.observation} nguon={{ bang: 'case_issues', id: primary.id, cot: 'observation' }} />
                  : <ChuDich chu={data.summary!} nguon={{ bang: 'sos_cases', id: data.id, cot: 'summary' }} />}
              </MoTaGon>
            ) : (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-faint">{t('Chưa có')}</span>
                {data.viewer.canEdit && data.trangThaiV4?.k === 'cho-nhan-xet' && !anNutMoTa && (
                  <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onViec({ loai: 'ghi-nhan-xet' })}>{t('Mô tả Case')}</button>
                )}
              </span>
            )}
            {primary?.observation && (primary.moTaTuMt || primary.byName) && (
              <span className="nguon">{(primary.moTaTuMt ? [t('theo nhận xét {mt}', { mt: primary.moTaTuMt })] : [primary.byName, primary.createdAt ? ngan(primary.createdAt) : null]).filter(Boolean).join(' · ')}</span>
            )}
            {primary?.observation && data.summary && <span className="text-[13px] text-slate-400"><ChuDich chu={data.summary} nguon={{ bang: 'sos_cases', id: data.id, cot: 'summary' }} /></span>}
            {primary?.nhanXetPhuTrach && (
              <span className="text-[13px] text-slate-300"><span className="text-slate-400">{t('Nhận xét GV phụ trách')}:</span> “<ChuDich chu={primary.nhanXetPhuTrach} nguon={data.attemptId ? { bang: 'assessment_scores', id: data.attemptId, cot: 'nhan_xet_phu_trach', kyNang: 'speaking' } : null} />”</span>
            )}
            {data.note && <span className="text-[13px] text-slate-400"><ChuDich chu={data.note} nguon={{ bang: 'sos_cases', id: data.id, cot: 'note' }} /></span>}
          </dd>
          {khung && <>
            {/* U02 c2: "Mở" = mã tuần; người báo xem ở Lịch sử, phụ trách ở dòng tóm tắt. */}
            <dt>{t('Mở')}</dt>
            <dd>{tuanLich(data.detectedAt, homNay)}</dd>
          </>}
          {context.length > 0 && <>
            <dt>{t('Bối cảnh')}</dt>
            <dd className="flex flex-wrap items-center gap-1.5">
              {context.map((i) => <Nhan key={i.id} tone="muted" dut title={i.observation ?? undefined}>{i.label}</Nhan>)}
            </dd>
          </>}
        </dl>
      </DauMuc>

      {/* U02 c2: trong cột "Phương án" không số, không ⓘ (luật vào ⓘ của Kết luận). */}
      <DauMuc tieuDe={t('Phương án')} dem={khung ? undefined : dsPa.length || undefined}
        luat={khung ? undefined : (
          <>
            <p className="m-0">{t('Mỗi PA cần Kết quả hai tuần một lần, trước hết Thứ Ba sau kỳ. Case chỉ hoàn thành được khi mọi PA đã khép.')}</p>
            {chiXem && <p className="m-0">{t('Chỉ Quản lý, giáo viên dạy đúng môn của Case, hoặc GVCN (Case Ý thức) mới hoàn thành được Case này. Bạn vẫn ghi được kết quả của từng PA.')}</p>}
          </>
        )}>
        {!data.viewer.canEdit && data.status !== 'done' && (
          <p className="m-0 flex items-start gap-2 text-[13px] leading-relaxed text-slate-300 [text-wrap:pretty]"><span className="mt-0.5 text-slate-400"><KhoaNho /></span>{chuAiLamDuoc(data.owner)}</p>
        )}
        {dsPa.length === 0 ? <p className="m-0 text-sm text-slate-400">{t('Chưa có PA.')}</p> : (
          <>
            {nhomPa(t('Chờ duyệt · xác nhận'), paCho)}
            {nhomPa(t('Đang theo dõi'), paChay)}
            {paKhep.length > 0 && (
              <details open={paMo.length === 0 || paKhep.some((x) => x.id === vuaDoi?.paId)}>
                <summary className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-300 sm:min-h-0">
                  {t('Đã kết thúc')} <span className={`${CHIP_VUONG} text-slate-300`} style={{ borderColor: 'var(--line-strong)' }}>{paKhep.length}</span>
                </summary>
                <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">{paKhep.map(pa)}</ul>
              </details>
            )}
          </>
        )}
      </DauMuc>

      {(dsPa.length > 0 || data.outcome || data.status === 'done') && (
        <DauMuc tieuDe={t('Kết luận')}>
          {data.outcome || data.status === 'done' ? (
            <p className="m-0 text-[15px] text-slate-100">
              {t('Đã kết luận')}{data.outcomeLabel && <>: <strong>{dich(data.outcomeLabel)}</strong></>}
              {data.outcomeNote && <span className="text-slate-400"> — {data.outcomeNote}</span>}
              {data.closedAt && <span className="text-slate-400"> {t('· kết thúc theo dõi {tuanLich}', { tuanLich: tuanLich(data.closedAt, homNay) })}</span>}
            </p>
          ) : khung ? (
            /* U02 c2: "chưa có ⓘ" — lý do khoá + luật PA trong ⓘ cạnh giá trị. */
            <div className="flex items-center gap-1.5 text-[15px] text-slate-100">{t('chưa có')}
              <NutLuat>
                <>
                  {lyDoKhoa && <p className="m-0">{lyDoKhoa}</p>}
                  <p className="m-0">{t('Mỗi PA cần Kết quả hai tuần một lần, trước hết Thứ Ba sau kỳ. Case chỉ hoàn thành được khi mọi PA đã khép.')}</p>
                  {chiXem && <p className="m-0">{t('Chỉ Quản lý, giáo viên dạy đúng môn của Case, hoặc GVCN (Case Ý thức) mới hoàn thành được Case này. Bạn vẫn ghi được kết quả của từng PA.')}</p>}
                </>
              </NutLuat>
            </div>
          ) : <p className="m-0 text-sm text-slate-400">{t('Chưa có · ghi khi mọi PA đã khép')}</p>}
        </DauMuc>
      )}

      {lichSu.length > 0 && (
        <details className={`group border-t ${khung ? 'py-2.5' : 'mt-[22px] pt-3'}`} style={{ borderColor: 'var(--line)' }}>
          <summary className={`flex min-h-[44px] cursor-pointer list-none items-center gap-2 sm:min-h-[32px] ${khung ? 'sm:grid sm:grid-cols-[8.5rem_auto_auto] sm:justify-start sm:gap-x-0' : ''}`}>
            {khung ? <><span className="text-[13px] font-medium text-slate-400">{t('Lịch sử')}</span><span className="text-[15px] font-semibold text-[color:var(--accent)]">{t('{n} thay đổi', { n: lichSu.length })}</span></>
              : <TieuDeMuc tieuDe={t('Lịch sử')} dem={lichSu.length} />}
            <span aria-hidden className="inline-flex text-slate-400 transition-transform group-open:rotate-90"><MuiTen mo={false} /></span>
          </summary>
          <ol className="m-0 mt-3 list-none space-y-2 border-l p-0 pl-3" style={{ borderColor: 'var(--line)' }}>
            {lichSu.map((m) => (
              <li key={m.key} className="text-[13px]">
                <span className="block text-xs tabular-nums text-slate-400">{ngan(m.on)}{m.dot ? <> · {m.dotHref ? <Link to={m.dotHref} className="link">{m.dot}</Link> : m.dot}</> : ''}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-slate-200">{m.tieuDe}{m.badge}</span>
                {m.than}
                {m.suaXemLai && <SuaXemLai f={m.suaXemLai} />}
              </li>
            ))}
          </ol>
        </details>
      )}

      <DauMuc tieuDe={t('Bằng chứng')} dem={bc.data?.rows.length || undefined}>
        {/* U02 (D7): trong cột, chưa có bằng chứng → "chưa có · + Thêm"; bấm mới mở khung thêm tệp / liên kết. */}
        {khung && !moBc && bc.data && bc.data.rows.length === 0 ? (
          <span className="flex flex-wrap items-center gap-x-3 text-[15px] text-slate-400">{t('chưa có')}
            {data.viewer.canEdit && <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" onClick={() => setMoBc(true)}>{t('+ Thêm')}</button>}
          </span>
        ) : <BangChung ownerType="sos_case" ownerId={data.id} canEdit={data.viewer.canEdit} tieuDe="" onChanged={bc.reload} />}
      </DauMuc>
    </>
  );
}

/** U02 dòng 7 (N35, `00` 21 "Mô tả dài"): mô tả = đoạn trích vạch trái (`.trich`); dài ≤ 3 dòng + "Xem đầy đủ" tại chỗ — không cắt dữ liệu lưu; nút Dịch nằm trong chữ (ChuDich) như cũ. */
function MoTaGon({ dai, children }: { dai: boolean; children: ReactNode }) {
  const [du, setDu] = useState(false);
  return (
    <>
      <p className={`trich ${dai && !du ? 'trich-3' : ''}`}>{children}</p>
      {dai && (
        <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold max-sm:min-h-[44px]" aria-expanded={du} onClick={() => setDu(!du)}>
          {du ? t('Thu gọn') : t('Xem đầy đủ')}
        </button>
      )}
    </>
  );
}

/** Chữ đầu mục (luật chữ đầu mục, M6): vạch 3 × 18 px màu nhấn + 15 / 700 + chip đếm vuông. */
function TieuDeMuc({ tieuDe, dem }: { tieuDe: string; dem?: number }) {
  return (
    <h3 className="m-0 flex items-center gap-2 text-[15px] font-bold leading-[1.35] text-slate-100">
      <span aria-hidden className="h-[18px] w-[3px] shrink-0 rounded-sm" style={{ background: 'var(--accent)' }} />
      {tieuDe}
      {dem !== undefined && <span className={`${CHIP_VUONG} text-slate-300`} style={{ borderColor: 'var(--line-strong)' }}>{dem}</span>}
    </h3>
  );
}

/**
 * ĐẦU MỤC của khối Case A (luật chữ đầu mục, M6 — ghi ở DESIGN.md): đường kẻ trên, khoảng trên 22 px, chữ 15 / 700 có vạch nhấn, chip đếm; `phu` = chip
 * ngữ cảnh cùng hàng (tên Case, lượt); `luat` = ⓘ (V6). Dùng chung: Ngăn Case, trang lượt, M5 ②.
 */
export function DauMuc({ tieuDe, dem, phu, luat, dau = false, children }: {
  tieuDe: string; dem?: number; phu?: ReactNode; luat?: ReactNode; /** Mục đầu khối: không đường kẻ trên (nơi gọi đã có vạch / viền). */ dau?: boolean; children: ReactNode;
}) {
  /* U02 (mockup `.fld`): Case trong cột hồ sơ HV — mỗi mục một hàng khung trường, nhãn trái 13 mờ | nội dung phải; đầu mục "Case" không vẽ (dòng tóm tắt đã nói). */
  const khung = useContext(ThanTrongCot);
  if (khung && dau) return <section className="flex flex-col gap-2">{phu && <div className="flex flex-wrap items-center gap-2">{phu}</div>}{children}</section>;
  if (khung) {
    return (
      <section className="grid border-t py-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)]" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-start gap-1.5 pt-0.5 text-[13px] font-medium text-slate-400">
          {tieuDe}{dem !== undefined && <span className="tabular-nums">({dem})</span>}{luat && <NutLuat>{luat}</NutLuat>}
        </div>
        <div className="flex min-w-0 flex-col gap-2">{phu && <div className="flex flex-wrap items-center gap-2">{phu}</div>}{children}</div>
      </section>
    );
  }
  return (
    <section className={dau ? 'mt-4 first:mt-0' : 'mt-[22px] border-t pt-3'} style={{ borderColor: 'var(--line)' }}>
      <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <TieuDeMuc tieuDe={tieuDe} dem={dem} />
        {phu}
        <span className="flex-1" />
        {luat && <NutLuat>{luat}</NutLuat>}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/**
 * MỘT DÒNG PA (mockup §8, một mẫu cho mọi loại): tên loại + khoá quy chế + trạng thái · ⋯ (Sửa PA · Xoá PA) · nội dung ·
 * "Dạy X / Thực hiện X · Từ W1 OCT · mốc" · vạch buổi (PA có Số buổi) · chân gạch đứt "Kết quả · hạn T2 13/10" + nút · Nhật ký PA (n).
 */
function TheKhoiPa({ iv, data, homNay, ngan, onViec, onDoi, anDau = false, anXacNhan = false, anViec = false, vua = null, onHoanTac }: {
  iv: any; data: CaseDetail; homNay: string; ngan: (d: string | null | undefined) => string; onViec: (v: ViewCase) => void;
  onDoi?: () => void; anXacNhan?: boolean;
  /** 6c (#644 XM-4): việc của PA này đang mở ở view dưới — không vẽ Xác nhận PA / Kết quả / ghi nhanh. */
  anViec?: boolean;
  /** M6 6b-2 (Q1): PA vừa đổi — viền nhấn + "✓ … · Hoàn tác". */
  vua?: VuaDoiPa | null; onHoanTac?: () => void;
  /** OV-13b: phần chi tiết dưới dòng PA gọn — không đầu dòng, không chân việc. */
  anDau?: boolean;
}) {
  const dangChay = daBatDau(iv);
  const choDuyet = iv.approvalState === 'pending';
  /* OV-13b (mockup OV-13 §2): PA ĐANG CHẠY = một dòng gọn; chờ xác nhận / chờ duyệt / đã khép giữ thẻ đầy đủ. */
  if (!anDau && iv.status === 'started' && !choDuyet && !iv.awaitingConfirmation && !iv.chuaChay) {
    return <DongPaGon iv={iv} data={data} homNay={homNay} ngan={ngan} onViec={onViec} onDoi={onDoi} anViec={anViec} vua={vua} onHoanTac={onHoanTac} />;
  }
  /* PR-LT2a → PR-CT2: PA Bổ trợ chưa chạy = chờ Xác nhận Case (không có "Xác nhận PA", không có "Kết quả"). */
  const bt = data.boTro ?? null;
  const chuaChay = !!iv.chuaChay;
  const hanGhi = iv.actionDue && dangChay ? deadlineView({ kind: 'cap-nhat-pa', due: iv.actionDue, today: homNay }) : null;
  const all: any[] = data.interventions ?? [];
  const tenPA = (x: any) => x.description || INTERVENTION_KIND_LABEL[x.kind as keyof typeof INTERVENTION_KIND_LABEL] || x.kind;
  /* OV-13b: `superseded_by` khi PA gốc CHƯA khép = đề xuất đổi PA còn chờ — chưa "được thay"; chỉ nói sau khi QL duyệt (gốc khép). */
  const thayBang = iv.supersededBy && iv.closedReason ? all.find((x) => x.id === iv.supersededBy) ?? null : null;
  const thayCho = all.find((x) => x.supersededBy === iv.id && x.closedReason) ?? null;
  const batDau = iv.startedDate ?? iv.plannedDate ?? null;
  /* PR-SOS (Q28-4): không còn "dự kiến kết thúc"; PA quy chế nói mốc riêng. Khoảng PA nói MÃ TUẦN ("Từ W3 SEP", "Từ W3 SEP → W1 OCT"). */
  const ketThuc = iv.completedDate ?? null;
  const khoang = batDau ? chuKhoangPa({ startedOn: batDau, completedOn: ketThuc }, homNay)?.replace(/^từ /, '') : ketThuc ? t('đến {tuanLich}', { tuanLich: tuanLich(ketThuc, homNay) }) : null;
  /* Người: "Dạy X" (Tutor, Bổ trợ) · "Thực hiện X" (loại khác) · Tự học không có. Không có ô Người theo dõi (§8). */
  const nguoi = iv.performer ? `${iv.performer}${iv.byProxy && iv.recordedBy ? t(' ({recordedBy} nhập hộ)', { recordedBy: iv.recordedBy }) : ''}` : null;
  const nut = nutDongPa(iv, { canApprove: data.viewer.canApprove, caseXong: data.status === 'done', coTheKetThucPa: data.viewer.coTheKetThucPa });
  const dem = iv.soBuoi != null ? demBuoi(iv.daDay ?? 0, iv.soBuoi) : null;
  const quaHan = hanGhi?.tone === 'overdue';
  /* Chân dòng PA: mỗi phần một cờ, tính một lần; không phần nào thì không vẽ chân. */
  const hienHan = !!hanGhi && !choDuyet;
  const hienChoQl = choDuyet && !(data.viewer.canApprove && iv.yeuCau);
  const nutXacNhan = !anXacNhan && !anViec && !!(data.viewer.canEdit && iv.awaitingConfirmation && data.sos?.hasCause);
  const nutKetQua = !anViec && nut.ketQua && !iv.awaitingConfirmation && !chuaChay;
  const coChan = hienHan || hienChoQl || nutXacNhan || nutKetQua;
  /* Nhật ký PA (mockup §8): Tạo · Kết quả từng tuần · Sửa PA / Điều chỉnh — luôn có ít nhất dòng Tạo. */
  const ketQuaPa = data.followups ?? [];
  /* OV-7b: lần ghi Kết quả gần nhất mà người xem sửa được (người đã ghi + QL, máy chủ quyết `suaDuoc`). */
  const fSua = ketQuaPa.find((f: any) => f.interventionId === iv.id && f.nextStep && f.suaDuoc) ?? null;
  const fGan = anDau ? null : ketQuaPa.find((f: any) => f.interventionId === iv.id && f.outcome) ?? null;
  const khung = useContext(ThanTrongCot);
  return (
    <li className={anDau ? 'flex list-none flex-col gap-[5px]' : 'pa-the'} style={anDau ? undefined : { ...vienVua(vua), opacity: dangChay || choDuyet || vua ? undefined : 0.8 }} data-pa-id={anDau ? undefined : iv.id}>
      {!anDau && <div className="flex flex-wrap items-center gap-1.5">
        {/* Mockup audit 03/11 `.pa-the`: tên PA đậm + thẻ (theo quy chế · đến MTn · người dạy) — chip trạng thái công việc sau. */}
        <TenPaThe iv={iv} nhat={khung} />
        {/* Trạng thái CÔNG VIỆC, không phải kết quả (mục 2.2): "Đã xong" chỉ nghĩa việc đã làm xong. */}
        {/* PR-SOS: PA quy chế chưa xác nhận = "Chờ xác nhận" (cùng chữ với hàng PA ở bảng kỹ năng), không phải "Đã lên kế hoạch". */}
        <Nhan tone={toneTrangThaiPa(iv.status)}>{chuaChay ? t('Chưa bắt đầu') : iv.awaitingConfirmation ? t('Chờ xác nhận') : INTERVENTION_STATUS_LABEL[iv.status as keyof typeof INTERVENTION_STATUS_LABEL] ?? iv.status}</Nhan>
        {choDuyet && <Nhan tone="muted" title={iv.approvalDue ? t('Hạn Quản lý trả lời {ngan}', { ngan: ngan(iv.approvalDue) }) : undefined}>{t('Chờ Quản lý duyệt')}</Nhan>}
        {iv.approvalState === 'approved' && <Nhan tone="done">{t('Đã duyệt')}</Nhan>}
        {iv.approvalState === 'declined' && <NhanTrangThai t="can-lam" chu={t('Bị từ chối')} />}
        <span className="flex-1" />
        <MenuPa iv={iv} ten={tenPA(iv)} xoa={nut.xoa} ketThuc={nut.ketThuc} onSua={nut.sua ? () => onViec({ loai: 'sua-pa', paId: iv.id }) : undefined}
          soKetQua={(data.followups ?? []).filter((f: any) => f.interventionId === iv.id).length} />
      </div>}
      {!anDau && <DongDoiPa iv={iv} data={data} ngan={ngan} onDoi={onDoi} />}
      {/* Dòng gọn (DongPaGon) đã vẽ nội dung — phần "Chi tiết" (`anDau`) không lặp. */}
      {iv.description && !anDau && <p className="trich hai"><ChuDich chu={iv.description} nguon={{ bang: 'case_interventions', id: iv.id, cot: 'description' }} /></p>}
      {fGan && <KetQuaGan f={fGan} homNay={homNay} ghiChu={!khung} cuoi={!dangChay && !choDuyet} />}
      {iv.kind === 'bo_tro' && bt?.chung && bt.mon.length > 1 && (
        <p className="m-0 text-xs text-slate-400">{t('PA chung · {x}', { x: bt.mon.map((m) => m.tenMon).join(', ') })}</p>
      )}
      {(thayCho || thayBang) && (
        <p className="m-0 truncate text-xs text-slate-500">
          {[thayCho && t('Thay cho: {tenPA}', { tenPA: tenPA(thayCho) }), thayBang && t('Được thay bằng: {tenPA}', { tenPA: tenPA(thayBang) })].filter(Boolean).join(' · ')}
        </p>
      )}
      {/* Người dạy + mốc đã là thẻ ở dòng tên; ở đây: chưa chọn người / nhập hộ, khoảng chạy ("Chi tiết" của dòng gọn: đủ như cũ). */}
      {(anDau || (coNguoiDay(iv.kind) && (!iv.performer || iv.byProxy)) || khoang) && (
        <p className="m-0 flex flex-wrap gap-x-3.5 gap-y-0.5 text-[13px] text-slate-300">
          {coNguoiDay(iv.kind) && (anDau || !iv.performer || iv.byProxy) && (
            <span><span className="text-slate-500">{nhanNguoiDay(iv.kind) === 'Người dạy' ? t('Dạy') : t('Thực hiện')}</span> {nguoi ?? <span className="text-slate-500">{t('chưa chọn')}</span>}</span>
          )}
          {(khoang || (anDau && iv.mocChu)) && (
            <span className="tabular-nums">{batDau && <span className="text-slate-500">{t('Từ')} </span>}{[khoang, anDau && iv.mocChu && dich(iv.mocChu)].filter(Boolean).join(' · ')}</span>
          )}
        </p>
      )}
      {dem && (
        <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-slate-300">
          <VachBuoi da={dem.da} tong={dem.tong} tt={dem.tt} />
          <span>{t('Đã dạy')} <b className="font-semibold text-slate-100 tabular-nums">{dem.da}/{dem.tong}</b></span>
          {dem.tt === 'du' ? <span className="font-semibold text-ok">{t('· đủ buổi')}</span>
            : dem.tt === 'vuot' ? <span className="font-semibold text-late">{t('· vượt {x}', { x: dem.da - dem.tong })}</span>
            : <span>{t('· còn')} <b className="font-semibold text-slate-100 tabular-nums">{dem.con}</b></span>}
        </div>
      )}
      {iv.approvalNote && (
        <p className="m-0 border-l pl-3 text-xs text-slate-300" style={{ borderColor: 'var(--line)' }}>
          {t('Quản lý{x}: {approvalNote}', { x: iv.approvedBy ? ` (${iv.approvedBy})` : '', approvalNote: iv.approvalNote })}
        </p>
      )}
      {/* PR-DUYET (T64): Xin ý kiến không dừng PA — dòng tím khi đang chờ, câu trả lời của QL khi đã có. */}
      <DongXinYKien x={iv.xinYKien} ngan={ngan} />
      {fSua && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-300">
          <span className="min-w-0">
            <span className="text-slate-500">{t('Kết quả {tuanLich} ·', { tuanLich: tuanLich(fSua.observedOn, homNay) })} </span>{outcomeLabelFor(fSua.outcome)}
            <span className="text-slate-500"> → {NEXT_STEP_LABEL[fSua.nextStep as keyof typeof NEXT_STEP_LABEL] ?? fSua.nextStep}</span>
          </span>
          <button type="button" className="btn btn-sm ml-auto min-h-[44px] sm:min-h-0" aria-label={t('Sửa kết quả {tuanLich}', { tuanLich: tuanLich(fSua.observedOn, homNay) })}
            onClick={() => onViec({ loai: 'sua-ket-qua', followupId: fSua.id })}>{t('Sửa')}</button>
        </div>
      )}
      {coChan && !anDau && (
        <div className="flex flex-wrap items-center gap-2 border-t border-dashed pt-1" style={{ borderColor: 'var(--line)' }}>
          {/* Hạn Kết quả: "Kết quả · hạn T2 13/10"; quá hạn → "Kết quả · quá hạn n ngày" cam đậm; em Tạm dừng → nhãn Tạm dừng. */}
          {hienHan && hanGhi && (data.tamDungTu ? <NhanTamDung tu={data.tamDungTu} />
            : <span className={`text-[13px] tabular-nums ${quaHan ? 'font-semibold text-late' : 'text-slate-500'}`}>{t('Kết quả · {x}', { x: hanGhi.quaHan ?? hanGhi.han })}</span>)}
          {hienChoQl && (
            <span className="text-xs text-slate-500 tabular-nums">
              {t('Đang chờ Quản lý trả lời{x} — thời gian chờ tính cho Quản lý.', { x: iv.approvalDue ? t(' · hạn {ngan}', { ngan: ngan(iv.approvalDue) }) : '' })}
            </span>
          )}
          <span className="flex-1" />
          {nutXacNhan && (
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => onViec({ loai: 'xac-nhan-pa', paId: iv.id })}>{t('Xác nhận PA')}</button>
          )}
          {nutKetQua && (
            <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => onViec({ loai: 'ghi-ket-qua', paId: iv.id })}
              title={t('Kết quả kỳ, tiến triển, và quyết định {x}', { x: iv.preset ? t('Giữ nguyên / Điều chỉnh / Xin ý kiến') : t('Giữ nguyên / Điều chỉnh / Thay / Kết thúc') })}>
              {iv.lanCuoi ? t('Kết quả cuối') : t('Kết quả')}
            </button>
          )}
        </div>
      )}
      {/* "Đã điều chỉnh n lần" gộp vào Nhật ký PA (mockup §8): n = số dòng nhật ký (`soDongNhatKyPa`, cùng danh sách `NhatKyPa` vẽ). */}
      <details>
        <summary className="cursor-pointer text-xs text-slate-400 max-sm:flex max-sm:min-h-[44px] max-sm:items-center">{t('Nhật ký PA ({soDongNhatKyPa})', { soDongNhatKyPa: soDongNhatKyPa(iv, ketQuaPa) })}</summary>
        <div className="mt-1"><NhatKyPa pa={iv} ketQua={ketQuaPa} /></div>
      </details>
      {/* PR-DUYET (K3-20): người duyệt được quyết NGAY dưới PA — cùng thẻ với hộp Chờ duyệt, không còn panel "Trả lời đề xuất". */}
      {!anDau && data.viewer.canApprove && iv.yeuCau && iv.yeuCau.loai === 'de_xuat_pa' && (
        <div className="mt-1"><TheYeuCau gon yc={iv.yeuCau} onXong={() => onViec({ loai: 'case' })} /></div>
      )}
      {vua && !anDau && <DaiVuaDoi x={vua} onHoanTac={onHoanTac} />}
    </li>
  );
}

/**
 * DÒNG PA ĐANG CHẠY GỌN (OV-13b, mockup OV-13 §2): "Xếp tự học · Đang chạy · kết quả gần nhất W3 OCT Tiến bộ một phần · hạn kế T3 10/11 · ⋯"; PA chưa có
 * người dạy: "Chưa chọn người dạy · Chọn" (chọn tại dòng, lưu ngay). Tới kỳ: ghi nhanh ngay dưới (PA không đếm buổi) / nút Ghi kết quả (Tutor, kết quả
 * cuối → panel); chưa tới kỳ: "Cập nhật trước hạn" (nút thường). Nội dung, người, vạch buổi, Sửa kết quả, Nhật ký PA gập ở "Chi tiết".
 */
function DongPaGon({ iv, data, homNay, ngan, onViec, onDoi, anViec = false, vua = null, onHoanTac }: {
  iv: any; data: CaseDetail; homNay: string; ngan: (d: string | null | undefined) => string; onViec: (v: ViewCase) => void; onDoi?: () => void;
  anViec?: boolean;
  vua?: VuaDoiPa | null; onHoanTac?: () => void;
}) {
  const [moNhanh, setMoNhanh] = useState(false);
  const [daLuu, setDaLuu] = useState<DaLuuNhanh | null>(null);
  const [chonNguoi, setChonNguoi] = useState(false);
  const [loiNguoi, setLoiNguoi] = useState<string | null>(null);
  /* 6c-2 (bấm thử): PA quy chế đang chạy luôn vẽ dòng gọn — thiếu `coTheKetThucPa` / `ketThuc` ở đây thì "Kết thúc PA" không với tới được. */
  const nut = nutDongPa(iv, { canApprove: data.viewer.canApprove, caseXong: data.status === 'done', coTheKetThucPa: data.viewer.coTheKetThucPa });
  const fGan = (data.followups ?? []).find((f: any) => f.interventionId === iv.id && f.outcome) ?? null;
  const hanGhi = iv.actionDue ? deadlineView({ kind: 'cap-nhat-pa', due: iv.actionDue, today: homNay }) : null;
  const toiKy = toiKyGhi(iv.actionDue, homNay);
  const ghiDuoc = !anViec && nut.ketQua && iv.ghiDuoc !== false;
  const nhanh = ghiNhanhDuoc(iv);
  const thieuNguoi = coNguoiDay(iv.kind) && !iv.performer;
  const datNguoi = async (x: NguoiChon | null) => {
    setLoiNguoi(null);
    try { await api.patch(`/interventions/${iv.id}`, datLaiNguoi(x)); invalidate('/cases'); invalidate('/my-work'); setChonNguoi(false); onDoi?.(); } catch (e: any) { setLoiNguoi(e?.message ?? t('Không lưu được')); }
  };
  const moPanel = () => onViec({ loai: 'ghi-ket-qua', paId: iv.id });
  const khung = useContext(ThanTrongCot);
  return (
    <li className="pa-the" style={vienVua(vua)} data-pa-id={iv.id}>
      <div className="flex items-start gap-x-2">
        {/* Mockup audit 03/11 `.pa-the`: tên PA đậm + thẻ (theo quy chế · đến MTn · người dạy); "đang chạy" đã ở dòng tóm tắt / đầu mục — không chip lặp. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
        <TenPaThe iv={iv} nhat={khung} />
        {hanGhi && !daLuu && (data.tamDungTu ? <NhanTamDung tu={data.tamDungTu} />
          : <span className={`text-[13px] tabular-nums ${hanGhi.tone === 'overdue' ? 'font-semibold text-late' : 'text-slate-400'}`}>{hanGhi.quaHan ? `⚠ ${hanGhi.quaHan}` : t('hạn kế {ngay}', { ngay: ngan(iv.actionDue) })}</span>)}
        </div>
        <MenuPa iv={iv} ten={iv.description || iv.kind} xoa={nut.xoa} ketThuc={nut.ketThuc} onSua={nut.sua ? () => onViec({ loai: 'sua-pa', paId: iv.id }) : undefined}
          soKetQua={(data.followups ?? []).filter((f: any) => f.interventionId === iv.id).length} />
      </div>
      {thieuNguoi && (
        chonNguoi ? (
          <div className="flex flex-col gap-1">
            <ChonNguoi nhom="giao_vien" studentId={data.student?.id} value={null} onChange={(x) => void datNguoi(x)} ariaLabel={t('Người dạy')}
              placeholder={t('Chưa chọn · gõ tên để tìm')} />
            {loiNguoi && <span role="alert" className="text-xs text-bad">⚠ {loiNguoi}</span>}
          </div>
        ) : (
          <p className="m-0 flex flex-wrap items-center gap-x-2 text-[13px]">
            <span className="font-semibold text-soon">{t('Chưa chọn người dạy')}</span>
            {nut.sua && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setChonNguoi(true)}>{t('Chọn')}</button>}
          </p>
        )
      )}
      {iv.description && <p className="trich hai"><ChuDich chu={iv.description} nguon={{ bang: 'case_interventions', id: iv.id, cot: 'description' }} /></p>}
      {fGan && <KetQuaGan f={fGan} homNay={homNay} ghiChu={!khung} />}
      <DongDoiPa iv={iv} data={data} ngan={ngan} onDoi={onDoi} />
      {ghiDuoc && (daLuu ? (
        <DongDaLuu kq={daLuu} onHoanTac={() => { setDaLuu(null); setMoNhanh(true); onDoi?.(); }} />
      ) : nhanh && (toiKy || moNhanh) ? (
        <GhiNhanh paId={iv.id} batBuoc={!!iv.batBuoc} onDaLuu={(kq) => { setDaLuu(kq); setMoNhanh(false); onDoi?.(); }} onMoPanel={moPanel} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {toiKy
            ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" onClick={moPanel}>{iv.lanCuoi ? t('Ghi kết quả cuối') : t('Ghi kết quả')}</button>
            : <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => (nhanh ? setMoNhanh(true) : moPanel())}>{t('Cập nhật trước hạn')}</button>}
        </div>
      ))}
      <details>
        <summary className="flex min-h-[44px] cursor-pointer items-center text-xs text-slate-400 sm:min-h-0">{t('Chi tiết · Nhật ký PA ({soDongNhatKyPa})', { soDongNhatKyPa: soDongNhatKyPa(iv, data.followups ?? []) })}</summary>
        <ul className="m-0 mt-1 p-0"><TheKhoiPa iv={iv} data={data} homNay={homNay} ngan={ngan} onViec={onViec} onDoi={onDoi} anDau /></ul>
      </details>
      {vua && <DaiVuaDoi x={vua} onHoanTac={onHoanTac} />}
    </li>
  );
}

/** Tên PA (mockup audit 03/11 `.pa-the`): tên 15 / 700 + thẻ "theo quy chế" · mốc ("đến MT3") · "người dạy: X"; `nhat` = thẻ nền mờ (cột hồ sơ HV, U02 c2), không = thẻ viền (panel, U03 A2). */
function TenPaThe({ iv, nhat }: { iv: any; nhat: boolean }) {
  const lop = `the-phu ${nhat ? 'nhat' : ''}`;
  return (
    <>
      <b className="text-[15px] font-bold text-slate-100">{dich(INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind)}</b>
      {/* PR-N1 S4-1: PA theo quy chế SOS do máy gán. */}
      {iv.preset && <span className={lop} title={iv.kind === 'bo_tro' ? t('PA Bổ trợ bắt buộc đến Cuối khoá — không thay, không kết thúc sớm') : t('PA theo quy chế SOS — chỉ GVCN / QL kết thúc sớm (⋯)')}>{t('theo quy chế')}</span>}
      {iv.mocChu && <span className={`${lop} tabular-nums`}>{dich(iv.mocChu)}</span>}
      {coNguoiDay(iv.kind) && iv.performer && <span className={lop}>{t('người dạy: {ten}', { ten: iv.performer })}</span>}
    </>
  );
}

/** Mockup `.ket`: tone kết quả (OUTCOME_TONE) → lớp chip — tiến bộ rõ xanh · một phần / không đổi vàng · kém hơn đỏ · chưa đủ dữ liệu xám. */
const LOP_KET: Record<string, string> = { ok: 'tb', warn: 'mp', danger: 'ko', muted: 'cd' };

/** "Kết quả gần nhất: [chip] [tuần]" (U02 c2) — panel (U03 A2) thêm ghi chú mờ; PA đã khép: "Kết quả cuối:". */
function KetQuaGan({ f, homNay, ghiChu, cuoi = false }: { f: any; homNay: string; ghiChu: boolean; cuoi?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] text-slate-100">
      {cuoi ? t('Kết quả cuối:') : t('Kết quả gần nhất:')}
      <span className={`ket ${LOP_KET[OUTCOME_TONE[f.outcome]] ?? 'cd'}`}>{dich(outcomeLabelFor(f.outcome))}</span>
      <span className="the-phu nhat tabular-nums">{tuanLich(f.observedOn, homNay)}</span>
      {ghiChu && f.note && <span className="min-w-0 text-[14px] text-slate-300"><ChuDich chu={f.note} nguon={{ bang: 'case_followups', id: f.id, cot: 'note' }} /></span>}
    </span>
  );
}

/** Thẻ PA vừa đổi: viền nhấn 2 px (cùng dáng "đang chọn" — G14), thẻ khác viền mảnh. */
const vienVua = (vua: VuaDoiPa | null) => (vua ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' } : { borderColor: 'var(--line)' });

/** "✓ Đã thêm PA · Hoàn tác" ngay trong thẻ PA vừa đổi (Q1) — Hoàn tác 10 giây, gọi đường đảo của form (máy chủ kiểm lại quyền + thời gian). */
function DaiVuaDoi({ x, onHoanTac }: { x: VuaDoiPa; onHoanTac?: () => void }) {
  const [con, setCon] = useState(!!x.hoanTac);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => {
    if (!con) return undefined;
    const h = setTimeout(() => setCon(false), 10_000);
    return () => clearTimeout(h);
  }, [con]);
  const bam = async () => {
    setBusy(true); setLoi(null);
    try { await x.hoanTac!(); onHoanTac?.(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); setBusy(false); }
  };
  return (
    <p role="status" className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-2 text-[13px]" style={{ borderColor: 'var(--line)' }}>
      <b className="font-semibold text-ok">✓ {x.chu}</b>
      {con && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" disabled={busy} onClick={() => void bam()}>{busy ? t('Đang lưu…') : t('Hoàn tác')}</button>}
      {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
    </p>
  );
}

/**
 * OV-13b (mockup OV-13 §8): dòng "Đề xuất PA khác" dưới PA gốc — chờ: "Chờ duyệt đổi PA → Tăng cường bài tập · PA gốc vẫn chạy · gửi … · QL hạn …" +
 * Rút (người gửi) / thẻ duyệt tại chỗ (QL); bị từ chối: "QL từ chối đổi PA: “…”" + Đề xuất lại (form ngay dưới).
 */
function DongDoiPa({ iv, data, ngan, onDoi }: { iv: any; data: CaseDetail; ngan: (d: string | null | undefined) => string; onDoi?: () => void }) {
  const d = iv.doiPa as { trangThai: 'cho' | 'tu_choi'; paMoiId: number; loaiMoi: string; guiLuc: string; hanDuyet: string | null; lyDoTuChoi: string | null; yeuCauId: number; laNguoiGui: boolean } | null;
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [lai, setLai] = useState(false);
  if (!d) return null;
  const tenMoi = dich(INTERVENTION_KIND_LABEL[d.loaiMoi as keyof typeof INTERVENTION_KIND_LABEL] ?? d.loaiMoi);
  const rut = async () => {
    setBusy(true); setLoi(null);
    try { await api.post(`/yeu-cau/${d.yeuCauId}/rut`); invalidate('/cases'); invalidate('/my-work'); invalidate('/yeu-cau'); onDoi?.(); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  if (d.trangThai === 'cho') {
    const the = data.viewer.canApprove ? (data.interventions ?? []).find((x: any) => x.id === d.paMoiId)?.yeuCau ?? null : null;
    return (
      <div className="flex flex-col gap-1.5">
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-300">
          <Nhan tone="muted">{t('Chờ duyệt đổi PA')}</Nhan>
          <span>→ <b className="font-semibold text-slate-100">{tenMoi}</b></span>
          <span className="text-slate-400">· {iv.status === 'started' ? t('PA gốc vẫn chạy') : t('chưa chạy')} · {t('gửi {ngay}', { ngay: ngan(d.guiLuc) })}{d.hanDuyet ? ` · ${t('QL hạn {ngay}', { ngay: ngan(d.hanDuyet) })}` : ''}</span>
          {d.laNguoiGui && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" disabled={busy} onClick={() => void rut()}>{busy ? t('Đang lưu…') : t('Rút')}</button>}
          {loi && <span role="alert" className="text-bad">⚠ {loi}</span>}
        </p>
        {the && <TheYeuCau gon yc={the} onXong={() => onDoi?.()} />}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-[13px] text-slate-300">
        <b className="font-semibold text-late">{t('QL từ chối đổi PA')}</b>{d.lyDoTuChoi ? `: “${d.lyDoTuChoi}”` : ''}
        {iv.status === 'started' && iv.ghiDuoc && !lai && <> · <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setLai(true)}>{t('Đề xuất lại')}</button></>}
      </p>
      {lai && <DeXuatLai iv={iv} studentId={data.student?.id} onHuy={() => setLai(false)} onXong={() => { setLai(false); onDoi?.(); }} />}
    </div>
  );
}

/** "Đề xuất lại" sau khi QL từ chối (PA gốc đang chạy) — cùng form `FormDoiPa`, gửi `POST …/de-xuat-doi-pa`. */
function DeXuatLai({ iv, studentId, onHuy, onXong }: { iv: any; studentId?: number | null; onHuy: () => void; onXong: () => void }) {
  const d = useDoiPa(iv.kind);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const gui = async () => {
    lf.bam();
    if (d.loi.length) return;
    setBusy(true); setLoi(null);
    try { await api.post(`/interventions/${iv.id}/de-xuat-doi-pa`, d.payload()); invalidate('/cases'); invalidate('/my-work'); invalidate('/yeu-cau'); onXong(); }
    catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <CanLam>
      <FormDoiPa d={d} lf={lf} studentId={studentId} chuNgay={t('ngày QL duyệt')} />
      {loi && <p role="alert" className="m-0 text-[13px] font-semibold text-bad">⚠ {loi}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" disabled={busy} onClick={() => void gui()}>{busy ? t('Đang gửi…') : t('Gửi Quản lý duyệt')}</button>
        <NutChu onClick={onHuy}>{t('Đóng')}</NutChu>
      </div>
    </CanLam>
  );
}

// ==================================================================== lịch sử cập nhật (thu gọn)

type MucLichSu = { key: string; on: string; dot: string | null; dotHref?: string | null; tieuDe: ReactNode; badge: ReactNode; than: ReactNode; suaXemLai?: any };

const MILESTONE_TITLE: Record<string, string> = {
  repeat: t('Trượt lại'),
  recurrence: t('Tái phát sau khi đã chốt kết thúc'),
  passed: t('Đã đạt kỳ vọng'),
  closed: t('Chốt kết thúc'),
  extended: t('Chốt đợt này, kéo dài theo dõi'),
  route_changed: t('Sang lộ trình mới'),
  /* PR-SOS (K3-21): Xác nhận Case + ba mốc của thẻ Không cần theo dõi (lý do ở dòng ghi chú). */
  xac_nhan_case: t('Xác nhận Case'),
  xin_khong_theo_doi: t('Xin không theo dõi'),
  ql_duyet_khong_theo_doi: t('Quản lý duyệt không theo dõi'),
  ql_tu_choi_khong_theo_doi: t('Quản lý từ chối không theo dõi'),
  /* PR-LT2a (K3-21): kế hoạch bổ trợ lớp thường — PR-CT2 bỏ bước này, nhãn giữ để đọc lịch sử Case cũ. */
  nop_ke_hoach: t('Nộp kế hoạch bổ trợ'),
  ke_hoach_duyet: t('Quản lý duyệt kế hoạch'),
  ke_hoach_tu_choi: t('Quản lý từ chối kế hoạch'),
  /* PR-LUI-a2: Quản lý mở lại Case đã hoàn thành. */
  reopened: t('Mở lại'),
  /* OV-1c: Overall ≥ kỳ vọng sau khi kỹ năng dời có điểm — Case đã có người làm giữ, GV tự đóng. */
  overall_dat: t('Overall đã đạt'),
  /* OV-13a (C): GVCN / QL kết thúc sớm PA theo quy chế — lý do ở dòng ghi chú. */
  ket_thuc_pa: t('Kết thúc PA'),
};

/** OV-7b: sửa "Xem lại sau hỗ trợ" lần mới nhất TẠI CHỖ — kết quả quan sát + ghi chú; Đóng trả về chữ đã lưu, lỗi thì giữ chữ đang gõ. */
function SuaXemLai({ f }: { f: any }) {
  const toast = useToast();
  const [mo, setMo] = useState(false);
  const [outcome, setOutcome] = useState<string>(f.outcome ?? '');
  const [note, setNote] = useState<string>(f.note ?? '');
  const [busy, setBusy] = useState(false);
  if (!mo) {
    return <button type="button" className="btn btn-sm mt-1 min-h-[44px] sm:min-h-0" aria-label={t('Sửa lần xem lại này')} onClick={() => setMo(true)}>{t('Sửa')}</button>;
  }
  const huy = () => { setOutcome(f.outcome ?? ''); setNote(f.note ?? ''); setMo(false); };
  const luu = async () => {
    setBusy(true);
    try {
      await api.patch(`/followups/${f.id}`, { outcome: outcome || null, note });
      invalidate('/cases'); invalidate('/students');
      toast.push('ok', t('Đã sửa lần xem lại'));
      setMo(false);
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  return (
    <div className="mt-1.5 flex flex-col gap-2">
      <select className="field w-full sm:w-auto" aria-label={t('Kết quả quan sát')} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
        <option value="">{t('Chưa chọn kết quả')}</option>
        {FOLLOWUP_OUTCOMES.map((o) => <option key={o} value={o}>{outcomeLabelFor(o)}</option>)}
      </select>
      <textarea className="field w-full" rows={2} aria-label={t('Ghi chú lần xem lại')} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={huy}>{t('Đóng')}</button>
      </div>
    </div>
  );
}

/** Điểm cô tự chấm: LUÔN có chữ "cô chấm" — một con số 6.5 đứng trơ sẽ bị đọc nhầm thành điểm mock. */
function MetricPills({ metrics, ct = null }: {
  ct?: string | null;
  metrics?: { skill: string; component?: string | null; score: number; total: number | null }[] | null;
}) {
  if (!metrics?.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {metrics.map((m) => (
        <Nhan key={`${m.skill}:${m.component ?? ''}`} tone="muted">
          {t('cô chấm {x} {x2}', { x: m.component ?? tenMon(ct, m.skill), x2: m.total ? `${m.score}/${m.total}` : fmtBand(m.score) })}
        </Nhan>
      ))}
    </span>
  );
}

/** Mốc của Case + mọi lần ghi kết quả, MỚI NHẤT LÊN ĐẦU (mục 4.3). Phương án đã nằm ở khối trên nên không lặp ở đây. */
function buildLichSu(data: CaseDetail, ngan: (d: string | null | undefined) => string): MucLichSu[] {
  const out: MucLichSu[] = [];
  for (const m of data.milestones ?? []) {
    if (m.kind === 'opened') continue;   // ngày mở và người tạo đã ở khối Vấn đề
    out.push({
      key: `m${m.id}`, on: m.occurredOn, dot: m.attemptNo ? (m.dot ?? `MT${m.attemptNo}`) : null, dotHref: m.href ?? null,
      tieuDe: (m.kind === 'reopened' || m.kind === 'ket_thuc_pa') && m.actorName ? `${MILESTONE_TITLE[m.kind]} · ${m.actorName}` : MILESTONE_TITLE[m.kind] ?? m.kind,
      badge: (
        <>
          {m.band !== null && m.band !== undefined && (
            <Outcome tone={m.expectation !== null && m.band < m.expectation ? 'danger' : 'ok'}>
              {fmtBand(m.band)}{m.expectation !== null ? t(' · kỳ vọng {fmtBand}', { fmtBand: fmtBand(m.expectation) }) : ''}
            </Outcome>
          )}
          {m.sosLevel ? <ChipSos muc={m.sosLevel} dot={m.attemptNo ? (m.dot ?? `MT${m.attemptNo}`) : null} /> : null}
        </>
      ),
      than: m.note ? <span className="block text-slate-400">{m.note}</span> : null,
    });
  }
  const tenPa = (id: number | null) => {
    const iv = (data.interventions ?? []).find((x: any) => x.id === id);
    return iv ? (iv.description || INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] || iv.kind) : null;
  };
  for (const f of data.followups ?? []) {
    const tre = f.late ? soNgayGiua(f.cycleDue, f.observedOn) : null;
    out.push({
      key: `f${f.id}`, on: f.observedOn, dot: f.cycleNo ? t('Đợt {cycleNo}', { cycleNo: f.cycleNo }) : null,
      tieuDe: f.interventionId ? (tenPa(f.interventionId) ?? t('Kết quả PA')) : (f.metrics?.length ? t('Điểm giáo viên tự chấm') : t('Theo dõi chung')),
      badge: (
        <>
          {f.outcome && (
            <Outcome tone={OUTCOME_TONE[f.outcome] ?? 'muted'} mark={OUTCOME_MARK[f.outcome]}>{outcomeLabelFor(f.outcome)}</Outcome>
          )}
          {f.late && <span className="text-xs text-slate-500">{t('ghi trễ{x}', { x: tre && tre > 0 ? t(' {tre} ngày', { tre }) : '' })}</span>}
        </>
      ),
      than: (
        <>
          {(f.nextStep || f.observerName) && (
            <span className="block text-xs text-slate-500">
              {f.nextStep && <>→ {NEXT_STEP_LABEL[f.nextStep as keyof typeof NEXT_STEP_LABEL] ?? f.nextStep}</>}
              {f.nextStep && f.observerName && ' · '}
              {f.observerName && t('{ten} ghi', { ten: f.observerName })}
            </span>
          )}
          {f.note && <span className="block text-slate-300"><ChuDich chu={f.note} nguon={{ bang: 'case_followups', id: f.id, cot: 'note' }} /></span>}
          {f.nguoiDay && <span className="block text-xs text-slate-400">{t('Người dạy: {nguoiDay}', { nguoiDay: f.nguoiDay })}</span>}
          {/* OV-12h: Kết quả PA Tutor theo buổi. */}
          {f.buoi?.length > 0 && (
            <ol className="m-0 mt-0.5 list-none space-y-1.5 p-0 text-xs text-slate-400" aria-label={t('Các buổi tutor')}>
              {/* TU-a (mockup tutor-1 §8): hình thức + 3 dấu ✓ / ✗ + sao + nhận xét về tutor. */}
              {f.buoi.map((b: BuoiTutor, i: number) => <DongBuoiTutor key={i} b={b} i={i} />)}
            </ol>
          )}
          {f.remainingIssue && <span className="block text-xs text-slate-400">{t('Còn tồn / Ghi chú')}: <ChuDich chu={f.remainingIssue} nguon={{ bang: 'case_followups', id: f.id, cot: 'remaining_issue' }} /></span>}
          {f.decisionNote && (
            <span className="block text-xs text-slate-400">{f.nextStep === 'adjust' || f.nextStep === 'propose' ? t('Lý do') : t('Ghi chú')}: <ChuDich chu={f.decisionNote} nguon={{ bang: 'case_followups', id: f.id, cot: 'decision_note' }} /></span>
          )}
          <MetricPills metrics={f.metrics} ct={data.chuongTrinh ?? null} />
        </>
      ),
      suaXemLai: !f.nextStep && f.suaDuoc ? f : undefined,
    });
  }
  out.sort((a, b) => (b.on ?? '').localeCompare(a.on ?? '') || b.key.localeCompare(a.key));
  return out;
}

export { skillLabel };
