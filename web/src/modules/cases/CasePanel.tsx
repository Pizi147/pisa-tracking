import { useState, type ReactNode } from 'react';
import { MenuPa } from './MenuXoaPa.tsx';
import { KhoaNho, NhatKyPa, VachBuoi } from './FormPa.tsx';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, ErrorState, Level, NhanTrangThai, Outcome, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { Nhan, type ToneNhan } from '../../ui/Nhan.tsx';
import { NhanTamDung, TenCase } from './SkillBoard.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CHUA_CO_PHUONG_AN, GOI_Y_THEM_PHUONG_AN } from '../../ui/chu.ts';
import { caseStatusLabel, fmtBand, skillLabel, sosLabel, sosTone } from '../../lib/format.ts';
import {
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL, INTERVENTION_STATUS_LABEL,
  NEXT_STEP_LABEL, OUTCOME_MARK, OUTCOME_TONE,
  chuKhoangPa, coNguoiDay, datLaiNguoi, deadlineView, demBuoi, ghiNhanhDuoc, nhanNguoiDay, nutDongPa, outcomeLabelFor, soDongNhatKyPa, tenMon, toiKyGhi, tuanLich,
  type NguoiChon, type TrangThai,
} from '@shared/domain/index.ts';
import { DongXinYKien } from './DongXinYKien.tsx';
import { DongDaLuu, GhiNhanh, type DaLuuNhanh } from './GhiNhanh.tsx';
import { FormDoiPa, useDoiPa } from './DoiPa.tsx';
import { CanLam, NutChu } from '../../ui/KhuonViec.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { DongNguyenNhan } from '../yThuc/CaseSosControls.tsx';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { dich, t } from '@shared/i18n/index.ts';

/**
 * MỘT VẤN ĐỀ HỌC VỤ (PR-UX3, N-4, mockup 15 §3) — kể theo hai câu người đọc cần: VẤN ĐỀ gì, và ĐÃ LÀM GÌ (các PA, mỗi PA một
 * thẻ; kết quả các tuần trước ở "Lịch sử cập nhật" thu gọn).
 *
 * Phần THÂN (`ThanCase`) dùng chung cho mọi lối vào: ngăn Case (`NganCase`, một panel đổi nội dung theo `view`) và trang riêng
 * `/hoc-thuat/Case/:id` (`CasePanel`, có hàng nút mở ngăn Case). Các thao tác (Ghi kết quả · Thêm PA · Hoàn thành · Trả lời)
 * KHÔNG còn hộp thoại đè lên ngăn — ngăn Case đổi nội dung và có dòng "← Case Listening" để về.
 */

/** Khối `boTro` như `GET /cases/:id` trả (xem `BoTroDto` ở máy chủ) — chỉ các trường giao diện cần. */
export type BoTro = {
  nhom: string; buoiMoiTuan: 1 | 2; chung: boolean;
  mon: { caseId: number; mon: string; tenMon: string }[];
};

export type CaseDetail = {
  id: number; originKind: string;
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
  sosLevel: number | null; urgency: string | null;
  summary: string | null; headline: string; detectedAt: string; reportedBy: string | null;
  status: string; disposition: string | null; dispositionNote: string | null; closedAt: string | null;
  /** Tên Case tự sinh theo mốc mới nhất, ví dụ "MT2 - Listening dưới kỳ vọng". */
  title: string | null;
  /** Hạng mục — đơn vị của Case từ vòng 4. */
  category: string | null; categoryLabel: string | null;
  /** Mã chương trình lộ trình Case (MH2). */
  chuongTrinh?: string | null;
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
  /* OV-12c: Case MT cũ bài chưa nhận xét → Ghi nhận xét (nhận xét + nhóm = nguyên nhân). */
  | { loai: 'ghi-nhan-xet' }
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
  return status === 'completed' ? 'done' : status === 'cancelled' ? 'muted' : status === 'planned' ? 'wait' : 'doing';
}

/** Số ngày từ `tu` đến `den` (ISO), `null` khi thiếu. */
function soNgayGiua(tu: string | null | undefined, den: string | null | undefined): number | null {
  if (!tu || !den) return null;
  const a = Date.parse(`${tu.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${den.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(a) || Number.isNaN(b) ? null : Math.round((b - a) / 86_400_000);
}

export function CasePanel({ caseId }: { caseId: number }) {
  const { data, loading, error, reload } = useApi<CaseDetail>(`/cases/${caseId}`);
  const [ngan, setNgan] = useState<ViewCase | null>(null);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-base font-semibold text-slate-100">{data.title ?? data.headline}</h3>
        <Nhan tone={data.status === 'done' ? 'done' : data.status === 'open' ? 'muted' : 'doing'}>{caseStatusLabel(data.status)}</Nhan>
        {data.sosLevel !== null && data.status !== 'done' && <Level tone={sosTone(data.sosLevel)}>{sosLabel(data.sosLevel)}</Level>}
        {data.student && <Link className="link text-xs" to={`/hoc-vien/${data.student.id}`}>{data.student.name}</Link>}
      </div>
      <ThanCase data={data} onViec={setNgan} />
      {data.viewer.canEdit && (
        <div className="flex flex-wrap gap-2">
          {data.trangThaiV4?.k !== 'tam' && <button type="button" className="btn btn-sm" onClick={() => setNgan({ loai: 'them-pa' })}>{t('+ Thêm PA')}</button>}
          {data.status !== 'done' && data.viewer.canClose && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setNgan({ loai: 'hoan-thanh' })}>{t('Hoàn thành Case')}</button>
          )}
        </div>
      )}
      {ngan && (
        <NganCase caseId={caseId} viecBanDau={ngan} hocVien={data.student?.name} onClose={() => setNgan(null)} onChanged={reload} />
      )}
    </div>
  );
}

/**
 * THÂN của Case (PR-PA §8, mockup pa-dong-bo §9): ba THẺ Vấn đề · Phương án (dòng PA mang `data-pa-id` cho Hành trình cuộn tới; Lịch sử
 * kết quả thu gọn ở cuối thẻ) · Bằng chứng. Không vỏ, không chân — vỏ là `KhungPanel` của `NganCase` hoặc trang riêng.
 */
export function ThanCase({ data, onViec, onDoi }: { data: CaseDetail; onViec: (v: ViewCase) => void; /** OV-13b: đã lưu tại chỗ (ghi nhanh, chọn người dạy, rút) — nơi gọi tải lại. */ onDoi?: () => void }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const primary = data.issues.find((i) => i.role === 'primary') ?? null;
  const secondary = data.issues.filter((i) => i.role === 'secondary');
  const context = data.issues.filter((i) => i.role === 'context');
  /* Đang chạy lên trên, đã xong xuống dưới; trong mỗi nhóm, mới nhất trước. OV-13b: PA mới của đề xuất đổi PA đang chờ / bị từ chối nằm ở dòng PA gốc. */
  const dsPa = [...(data.interventions ?? [])].filter((x) => !(x.laPaDoi && (x.approvalState === 'pending' || x.approvalState === 'declined'))).sort((a, b) =>
    Number(daBatDau(b)) - Number(daBatDau(a)) || (b.id as number) - (a.id as number));
  /* OV-13b (mockup OV-13 §2): PA còn mở ở trên (đang chạy một dòng), PA đã khép gập ở "Lịch sử PA". */
  const paMo = dsPa.filter((x) => daBatDau(x));
  const paKhep = dsPa.filter((x) => !daBatDau(x));
  const lichSu = buildLichSu(data, ngan);
  const chiXem = !data.viewer.canClose && data.status !== 'done';
  /* Số bằng chứng ở đầu thẻ: cùng đường với `BangChung` (lời gọi đang bay dùng chung), thêm / gỡ xong thì tải lại. */
  const bc = useApi<{ rows: unknown[] }>(`/attachments?ownerType=sos_case&ownerId=${data.id}`, [data.id]);
  /* OV-11d (HV-20): Case giữ sau "Overall đã đạt" (OV-1c) — nói ngay đầu Case, không chỉ trong Lịch sử thu gọn. */
  const overallDat = data.status !== 'done' ? [...(data.milestones ?? [])].reverse().find((m) => m.kind === 'overall_dat') : null;

  return (
    <>
      {overallDat && (
        <p className="m-0 mb-2 rounded-lg bg-ok-bg px-3 py-2 text-[12.5px] text-ok">
          {t('Overall {x} đã đạt — xem và Hoàn thành Case', { x: overallDat.dot ?? (overallDat.attemptNo ? `MT${overallDat.attemptNo}` : '') })}
        </p>
      )}
      <The tieuDe={t('Vấn đề')}>
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-100">
          <TenCase c={{ title: data.title ?? data.headline, tenSos: data.tenSos ?? null }} />
        </div>
        {data.summary && <p className="m-0 text-[13.5px] text-slate-300">{data.summary}</p>}
        {data.note && <p className="m-0 text-xs text-slate-400">{data.note}</p>}
        {(primary || secondary.length > 0 || context.length > 0) && (
          <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[12.5px]">
            {(primary || secondary.length > 0) && <>
              <dt className="text-slate-400">{t('Nhóm nguyên nhân')}</dt>
              {/* Hotfix 15/10 (L2): đủ nhóm có số thứ tự + nhận xét (Case MT không có Mô tả — nhận xét của bài là nội dung). */}
              <dd className="m-0 text-slate-200"><DongNguyenNhan issues={[...(primary ? [primary] : []), ...secondary]} /></dd>
            </>}
            {context.length > 0 && <>
              <dt className="text-slate-400">{t('Bối cảnh')}</dt>
              <dd className="m-0 flex flex-wrap items-center gap-1.5">
                {context.map((i) => <Nhan key={i.id} tone="muted" dut title={i.observation ?? undefined}>{i.label}</Nhan>)}
              </dd>
            </>}
          </dl>
        )}
      </The>

      <The tieuDe={t('Phương án')} dem={dsPa.length}
        luat={(
          <>
            <p className="m-0">{t('Mỗi PA cần Kết quả hai tuần một lần, trước hết Thứ Ba sau kỳ. Case chỉ hoàn thành được khi mọi PA đã khép.')}</p>
            {chiXem && <p className="m-0">{t('Chỉ Quản lý, giáo viên dạy đúng môn của Case, hoặc GVCN (Case Ý thức) mới hoàn thành được Case này. Bạn vẫn ghi được kết quả của từng PA.')}</p>}
          </>
        )}>
        {dsPa.length === 0 ? (
          <Empty title={CHUA_CO_PHUONG_AN} hint={GOI_Y_THEM_PHUONG_AN} />
        ) : (
          <>
            {paMo.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {paMo.map((iv) => <TheKhoiPa key={iv.id} iv={iv} data={data} homNay={homNay} ngan={ngan} onViec={onViec} onDoi={onDoi} />)}
              </ul>
            )}
            {paKhep.length > 0 && (
              <details open={paMo.length === 0}>
                <summary className="flex min-h-[44px] cursor-pointer items-center text-[12.5px] text-slate-400 sm:min-h-0">{t('Lịch sử PA · {n}', { n: paKhep.length })}</summary>
                <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                  {paKhep.map((iv) => <TheKhoiPa key={iv.id} iv={iv} data={data} homNay={homNay} ngan={ngan} onViec={onViec} onDoi={onDoi} />)}
                </ul>
              </details>
            )}
          </>
        )}
        {data.outcome || data.status === 'done' ? (
          <p className="m-0 text-sm text-slate-100">
            {t('Đã kết luận')}{data.outcomeLabel && <>: <strong>{dich(data.outcomeLabel)}</strong></>}
            {data.outcomeNote && <span className="text-slate-400"> — {data.outcomeNote}</span>}
            {data.closedAt && <span className="text-slate-500"> {t('· kết thúc theo dõi {tuanLich}', { tuanLich: tuanLich(data.closedAt, homNay) })}</span>}
          </p>
        ) : null}
        {lichSu.length > 0 && (
          <details>
            <summary className="flex min-h-[44px] cursor-pointer items-center text-[12.5px] text-slate-400 sm:min-h-0">{t('Nhật ký · {n}', { n: lichSu.length })}</summary>
            <ol className="m-0 mt-2 list-none space-y-2 border-l p-0 pl-3" style={{ borderColor: 'var(--line)' }}>
              {lichSu.map((m) => (
                <li key={m.key} className="text-xs">
                  <span className="block text-xs tabular-nums text-slate-500">{ngan(m.on)}{m.dot ? <> · {m.dotHref ? <Link to={m.dotHref} className="link">{m.dot}</Link> : m.dot}</> : ''}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-slate-200">{m.tieuDe}{m.badge}</span>
                  {m.than}
                  {m.suaXemLai && <SuaXemLai f={m.suaXemLai} />}
                </li>
              ))}
            </ol>
          </details>
        )}
      </The>

      <The tieuDe={t('Bằng chứng')} dem={bc.data?.rows.length}>
        <BangChung ownerType="sos_case" ownerId={data.id} canEdit={data.viewer.canEdit} tieuDe="" onChanged={bc.reload} />
      </The>
    </>
  );
}

/** Thẻ khối (mockup §9 `.kt`): viền `--line-strong`, đầu nền `surface-2` cao 40, tiêu đề 13.5px đậm + số đếm, ⓘ bên phải. */
function The({ tieuDe, dem, luat, children }: { tieuDe: string; dem?: number; luat?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-3 overflow-hidden rounded-[10px] border" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
      <div className="flex min-h-[40px] items-center gap-2 border-b px-3 py-1.5 surface-2" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 text-[13.5px] font-bold text-slate-100">{tieuDe}</h3>
        {dem !== undefined && <span className="text-xs font-semibold tabular-nums text-slate-500">{dem}</span>}
        <span className="flex-1" />
        {luat && <NutLuat>{luat}</NutLuat>}
      </div>
      <div className="flex flex-col gap-2 px-3 py-2.5">{children}</div>
    </section>
  );
}

/**
 * MỘT DÒNG PA (mockup §8, một mẫu cho mọi loại): tên loại + khoá quy chế + trạng thái · ⋯ (Sửa PA · Xoá PA) · nội dung ·
 * "Dạy X / Thực hiện X · Từ W1 OCT · mốc" · vạch buổi (PA có Số buổi) · chân gạch đứt "Kết quả · hạn T2 13/10" + nút · Nhật ký PA (n).
 */
function TheKhoiPa({ iv, data, homNay, ngan, onViec, onDoi, anDau = false }: {
  iv: any; data: CaseDetail; homNay: string; ngan: (d: string | null | undefined) => string; onViec: (v: ViewCase) => void;
  onDoi?: () => void;
  /** OV-13b: phần chi tiết dưới dòng PA gọn — không đầu dòng, không chân việc. */
  anDau?: boolean;
}) {
  const dangChay = daBatDau(iv);
  const choDuyet = iv.approvalState === 'pending';
  /* OV-13b (mockup OV-13 §2): PA ĐANG CHẠY = một dòng gọn; chờ xác nhận / chờ duyệt / đã khép giữ thẻ đầy đủ. */
  if (!anDau && iv.status === 'started' && !choDuyet && !iv.awaitingConfirmation && !iv.chuaChay) {
    return <DongPaGon iv={iv} data={data} homNay={homNay} ngan={ngan} onViec={onViec} onDoi={onDoi} />;
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
  const nutXacNhan = !!(data.viewer.canEdit && iv.awaitingConfirmation && data.sos?.hasCause);
  const nutKetQua = nut.ketQua && !iv.awaitingConfirmation && !chuaChay;
  const coChan = hienHan || hienChoQl || nutXacNhan || nutKetQua;
  /* Nhật ký PA (mockup §8): Tạo · Kết quả từng tuần · Sửa PA / Điều chỉnh — luôn có ít nhất dòng Tạo. */
  const ketQuaPa = data.followups ?? [];
  /* OV-7b: lần ghi Kết quả gần nhất mà người xem sửa được (người đã ghi + QL, máy chủ quyết `suaDuoc`). */
  const fSua = ketQuaPa.find((f: any) => f.interventionId === iv.id && f.nextStep && f.suaDuoc) ?? null;
  return (
    <li className={anDau ? 'flex list-none flex-col gap-[5px]' : 'flex flex-col gap-[5px] rounded-lg border px-3 py-2.5 surface-2'} style={anDau ? undefined : { borderColor: 'var(--line)', opacity: dangChay || choDuyet ? undefined : 0.75 }} data-pa-id={anDau ? undefined : iv.id}>
      {!anDau && <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-bold text-slate-100">{INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind}</span>
        {/* PR-N1 S4-1: PA theo quy chế SOS do máy gán — dấu nhỏ cạnh tên (khoảng cách lấy từ `gap-1.5` của hàng, nên không thêm `ml-1.5`). */}
        {iv.preset && <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-slate-400" title={iv.kind === 'bo_tro' ? t('PA Bổ trợ bắt buộc đến Cuối khoá — không thay, không kết thúc sớm') : t('PA theo quy chế SOS — chỉ GVCN / QL kết thúc sớm (⋯)')}><KhoaNho />{t('theo quy chế')}</span>}
        {/* Trạng thái CÔNG VIỆC, không phải kết quả (mục 2.2): "Đã xong" chỉ nghĩa việc đã làm xong. */}
        {/* PR-SOS: PA quy chế chưa xác nhận = "Chờ xác nhận" (cùng chữ với hàng PA ở bảng kỹ năng), không phải "Đã lên kế hoạch". */}
        <Nhan tone={toneTrangThaiPa(iv.status)}>{chuaChay ? t('Chưa bắt đầu') : iv.awaitingConfirmation ? t('Chờ xác nhận') : INTERVENTION_STATUS_LABEL[iv.status as keyof typeof INTERVENTION_STATUS_LABEL] ?? iv.status}</Nhan>
        {choDuyet && <Nhan tone="wait" title={iv.approvalDue ? t('Hạn Quản lý trả lời {ngan}', { ngan: ngan(iv.approvalDue) }) : undefined}>{t('Chờ Quản lý duyệt')}</Nhan>}
        {iv.approvalState === 'approved' && <Nhan tone="done">{t('Đã duyệt')}</Nhan>}
        {iv.approvalState === 'declined' && <NhanTrangThai t="can-lam" chu={t('Bị từ chối')} />}
        <span className="flex-1" />
        <MenuPa iv={iv} ten={tenPA(iv)} xoa={nut.xoa} ketThuc={nut.ketThuc} onSua={nut.sua ? () => onViec({ loai: 'sua-pa', paId: iv.id }) : undefined}
          soKetQua={(data.followups ?? []).filter((f: any) => f.interventionId === iv.id).length} />
      </div>}
      {!anDau && <DongDoiPa iv={iv} data={data} ngan={ngan} onDoi={onDoi} />}
      {iv.description && <p className="m-0 text-[13.5px] text-slate-300">{iv.description}</p>}
      {iv.kind === 'bo_tro' && bt?.chung && bt.mon.length > 1 && (
        <p className="m-0 text-xs text-slate-400">{t('PA chung · {x}', { x: bt.mon.map((m) => m.tenMon).join(', ') })}</p>
      )}
      {(thayCho || thayBang) && (
        <p className="m-0 truncate text-xs text-slate-500">
          {[thayCho && t('Thay cho: {tenPA}', { tenPA: tenPA(thayCho) }), thayBang && t('Được thay bằng: {tenPA}', { tenPA: tenPA(thayBang) })].filter(Boolean).join(' · ')}
        </p>
      )}
      <p className="m-0 flex flex-wrap gap-x-3.5 gap-y-0.5 text-[12.5px] text-slate-300">
        {coNguoiDay(iv.kind) && (
          <span><span className="text-slate-500">{nhanNguoiDay(iv.kind) === 'Người dạy' ? t('Dạy') : t('Thực hiện')}</span> {nguoi ?? <span className="text-slate-500">{t('chưa chọn')}</span>}</span>
        )}
        {(khoang || iv.mocChu) && (
          <span className="tabular-nums">{batDau && <span className="text-slate-500">{t('Từ')} </span>}{[khoang, iv.mocChu && dich(iv.mocChu)].filter(Boolean).join(' · ')}</span>
        )}
      </p>
      {dem && (
        <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-slate-300">
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-slate-300">
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
            : <span className={`text-[12.5px] tabular-nums ${quaHan ? 'font-semibold text-late' : 'text-slate-500'}`}>{t('Kết quả · {x}', { x: hanGhi.quaHan ?? hanGhi.han })}</span>)}
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
    </li>
  );
}

/**
 * DÒNG PA ĐANG CHẠY GỌN (OV-13b, mockup OV-13 §2): "Xếp tự học · Đang chạy · kết quả gần nhất W3 OCT Tiến bộ một phần · hạn kế T3 10/11 · ⋯"; PA chưa có
 * người dạy: "Chưa chọn người dạy · Chọn" (chọn tại dòng, lưu ngay). Tới kỳ: ghi nhanh ngay dưới (PA không đếm buổi) / nút Ghi kết quả (Tutor, kết quả
 * cuối → panel); chưa tới kỳ: "Cập nhật trước hạn" (nút thường). Nội dung, người, vạch buổi, Sửa kết quả, Nhật ký PA gập ở "Chi tiết".
 */
function DongPaGon({ iv, data, homNay, ngan, onViec, onDoi }: {
  iv: any; data: CaseDetail; homNay: string; ngan: (d: string | null | undefined) => string; onViec: (v: ViewCase) => void; onDoi?: () => void;
}) {
  const [moNhanh, setMoNhanh] = useState(false);
  const [daLuu, setDaLuu] = useState<DaLuuNhanh | null>(null);
  const [chonNguoi, setChonNguoi] = useState(false);
  const [loiNguoi, setLoiNguoi] = useState<string | null>(null);
  const nut = nutDongPa(iv, { canApprove: data.viewer.canApprove, caseXong: data.status === 'done' });
  const fGan = (data.followups ?? []).find((f: any) => f.interventionId === iv.id && f.outcome) ?? null;
  const hanGhi = iv.actionDue ? deadlineView({ kind: 'cap-nhat-pa', due: iv.actionDue, today: homNay }) : null;
  const toiKy = toiKyGhi(iv.actionDue, homNay);
  const ghiDuoc = nut.ketQua && iv.ghiDuoc !== false;
  const nhanh = ghiNhanhDuoc(iv);
  const thieuNguoi = coNguoiDay(iv.kind) && !iv.performer;
  const datNguoi = async (x: NguoiChon | null) => {
    setLoiNguoi(null);
    try { await api.patch(`/interventions/${iv.id}`, datLaiNguoi(x)); invalidate('/cases'); invalidate('/my-work'); setChonNguoi(false); onDoi?.(); } catch (e: any) { setLoiNguoi(e?.message ?? t('Không lưu được')); }
  };
  const moPanel = () => onViec({ loai: 'ghi-ket-qua', paId: iv.id });
  return (
    <li className="flex flex-col gap-2 rounded-lg border px-3 py-2.5 surface-2" style={{ borderColor: 'var(--line)' }} data-pa-id={iv.id}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-bold text-slate-100">{dich(INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind)}</span>
        {iv.preset && <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-slate-400"><KhoaNho />{t('theo quy chế')}</span>}
        <Nhan tone="doing">{t('Đang chạy')}</Nhan>
        {fGan && (
          <span className="text-[12.5px] text-slate-400">· {t('kết quả gần nhất')} <span className="tabular-nums">{tuanLich(fGan.observedOn, homNay)}</span>{' '}
            <b className="font-semibold text-slate-200">{dich(outcomeLabelFor(fGan.outcome))}</b></span>
        )}
        {hanGhi && !daLuu && (data.tamDungTu ? <NhanTamDung tu={data.tamDungTu} />
          : <span className={`text-[12.5px] tabular-nums ${hanGhi.tone === 'overdue' ? 'font-semibold text-late' : 'text-slate-400'}`}>· {hanGhi.quaHan ? `⚠ ${hanGhi.quaHan}` : t('hạn kế {ngay}', { ngay: ngan(iv.actionDue) })}</span>)}
        <span className="flex-1" />
        <MenuPa iv={iv} ten={iv.description || iv.kind} xoa={nut.xoa} onSua={nut.sua ? () => onViec({ loai: 'sua-pa', paId: iv.id }) : undefined}
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
          <p className="m-0 flex flex-wrap items-center gap-x-2 text-[12.5px]">
            <span className="font-semibold text-soon">{t('Chưa chọn người dạy')}</span>
            {nut.sua && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => setChonNguoi(true)}>{t('Chọn')}</button>}
          </p>
        )
      )}
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
    </li>
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
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-slate-300">
          <Nhan tone="wait">{t('Chờ duyệt đổi PA')}</Nhan>
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
      <p className="m-0 text-[12.5px] text-slate-300">
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
          {m.sosLevel ? <Level tone={sosTone(m.sosLevel)}>{sosLabel(m.sosLevel)}</Level> : null}
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
          {f.note && <span className="block text-slate-300">{f.note}</span>}
          {f.nguoiDay && <span className="block text-xs text-slate-400">{t('Người dạy: {nguoiDay}', { nguoiDay: f.nguoiDay })}</span>}
          {/* OV-12h: Kết quả PA Tutor theo buổi. */}
          {f.buoi?.length > 0 && (
            <ol className="m-0 mt-0.5 list-none space-y-0.5 p-0 text-xs text-slate-400" aria-label={t('Các buổi tutor')}>
              {f.buoi.map((b: { tutor: string; nhanXet: string }, i: number) => (
                <li key={i} className="break-words">{t('Buổi {x} · {tutor}:', { x: i + 1, tutor: b.tutor })} <span className="text-slate-300">{b.nhanXet}</span></li>
              ))}
            </ol>
          )}
          {f.remainingIssue && <span className="block text-xs text-slate-400">{t('Còn tồn / Ghi chú: {remainingIssue}', { remainingIssue: f.remainingIssue })}</span>}
          {f.decisionNote && (
            <span className="block text-xs text-slate-400">{f.nextStep === 'adjust' || f.nextStep === 'propose' ? t('Lý do') : t('Ghi chú')}: {f.decisionNote}</span>
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
