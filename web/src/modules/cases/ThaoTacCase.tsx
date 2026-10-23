import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { BoiCanh, CanLam, TrangThaiLuu } from '../../ui/KhuonViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  CASE_OUTCOMES, INTERVENTION_KIND_LABEL, CASE_OUTCOME_LABEL, HAN_DUYET_NGAY,
  componentsAreCounts, componentsFor, interventionKindsFor, isProposalKind,
  dsLoi, kiemGhiRoKhac, KHAC_TOI_THIEU, moiKhoaGui, tuanLich,
  giaTriCuaPa, loiFormPa, paMoi, paPayload, thanSuaPa, type GiaTriPa, type KetQuaNhatKy,
  URGENCY_LEVELS, URGENCY_LABEL, duongDotTest, caseTopicsFor, issuesForTopic, laKhac, tenMon, tenMonNgan, NHAN_XET_MT_TOI_THIEU, NHAN_XET_TOI_DA,
} from '@shared/domain/index.ts';
import { ComponentsField, componentsPayload } from './ChiTietKyNang.tsx';
import { FormPa, NgayKhoa, NhatKyPa } from './FormPa.tsx';
import type { BanDieuChinh } from './CapNhatTuan.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import type { DaLuuPanel } from '../../ui/KhuonViec.tsx';

/**
 * BA THAO TÁC CỦA NGĂN CASE (PR-UX3, N-4): Thêm PA · Hoàn thành Case · Trả lời đề xuất — trước đây là hộp thoại giữa màn đè lên
 * ngăn Case. Nay mỗi cái là một `KhungPanel` (`NganCase` thay nội dung, có dòng "← Case Listening"); cùng API, cùng luật.
 *
 * Chữ ký chung: `{ …dữ liệu, hocVien, lop, quayLai, onClose, onSaved }`. Lỗi chỉ hiện SAU khi bấm nút chính (`Còn thiếu: …`).
 */

type ChungPanel = {
  hocVien?: string | null; lop?: string | null;
  quayLai?: { nhan: string; onClick: () => void };
  /** OV-13b: Thêm PA truyền chữ "✓ Đã lưu · …" cho panel ở lại (`DaLuuPanel`). */
  onClose: () => void; onSaved: (x?: DaLuuPanel) => void;
};

// ==================================================================== Thêm PA

/**
 * THÊM PHƯƠNG ÁN (mục 8.2) — PR-PA (§8): một form PA (`FormPa`): Loại · Nội dung · Số buổi · Người dạy / Người thực hiện (không bắt buộc)
 * · Ngày bắt đầu. PA đã làm trước đây là liên kết phụ cuối form (K3-18). OV-12e (mockup v3 §6): khuôn panel v3 — đầu "Thêm PA" + chip hạn /
 * em ↗ · lớp · ngữ cảnh (nơi gọi truyền `dau`), MỘT khối Cần làm (form + nút chính "Thêm PA" / "Gửi QL duyệt"), Bối cảnh ≤ 3 dòng, chân trạng thái lưu;
 * Bắt đầu = ô ngày gõ được + nút lịch (`ChonNgayGan` = `ONgay`, không sau hôm nay), mặc định hôm nay.
 */
export function ThemPaPanel({ caseId, studentId, coPaBatBuoc, hocVien, lop, quayLai, onClose, onSaved, dau, boiCanh }: ChungPanel & {
  caseId: number; studentId?: number | null;
  /** Case có PA theo quy chế đang chạy → PA này là hỗ trợ thêm. */
  coPaBatBuoc?: boolean;
  /** OV-12e: đầu panel v3 (`dauViec`) + Bối cảnh (Nguyên nhân · Kết quả gần nhất). */
  dau?: { han?: ReactNode; dong2: ReactNode[] }; boiCanh?: [string, ReactNode][];
}) {
  const { homNay } = useNgayNghiepVu();
  const [v, setV] = useState<GiaTriPa>(() => paMoi(interventionKindsFor().selfServe[0]));
  /* Mặc định ĐANG THEO DÕI: PA vừa lập thì đang chạy, không phải đã xong. */
  const [status, setStatus] = useState<'started' | 'completed'>('started');
  const [completedDate, setCompletedDate] = useState('');
  const [startedDate, setStartedDate] = useState(homNay);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  /* PR-GVa (F01 = D13): một khoá gửi cho một lần mở panel — thử lại sau lỗi mạng không ghi PA thứ hai. */
  const khoa = useRef(moiKhoaGui('pa'));
  /* Nhóm Đề xuất luôn phải có Quản lý trả lời. */
  const deXuat = isProposalKind(v.kind);

  const loi = [
    ...loiFormPa(v),
    ...dsLoi(status === 'completed' ? [{ khoa: 'ngay-lam', nhan: t('Ngày đã làm'), chon: true }] : [], { 'ngay-lam': completedDate }),
  ];

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    setLoiLuu(null);
    try {
      await api.post(`/cases/${caseId}/interventions`, {
        ...paPayload(v), status,
        completedDate: status === 'completed' ? completedDate || undefined : undefined,
        startedDate: status === 'started' ? startedDate || undefined : undefined,
        needsApproval: deXuat,
        idempotencyKey: khoa.current,
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan'); invalidate('/my-work');   // OV-11c (CV-2): việc Thêm PA hết ở Công việc
      /* OV-13b: panel ở lại "✓ Đã lưu · Việc tiếp ›" (nơi gọi vẽ) — không toast đè chân. */
      onSaved({ chu: deXuat ? t('Đã gửi Quản lý duyệt') : t('Đã thêm PA'), phu: [dich(INTERVENTION_KIND_LABEL[v.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? v.kind), v.description.trim()].filter(Boolean).join(' · ') });
    } catch (e: any) { setLoiLuu(e.message); } finally { setBusy(false); }
  };

  const nut = (
    <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={luu}>
      {busy ? t('Đang lưu…') : deXuat ? t('Gửi Quản lý duyệt') : t('Thêm PA')}
    </button>
  );
  const daSua = !!(v.description.trim() || status === 'completed');
  return (
    <KhungPanel tieuDe={t('Thêm PA')} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose} dau={dau}
      chan={{
        v3: true, chinh: nut, daSua, conThieu: lf.conThieu(loi),
        dongTren: busy || loiLuu ? <TrangThaiLuu tt={busy ? 'dang' : 'loi'} loi={loiLuu} onThuLai={() => void luu()} /> : undefined,
      }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          {coPaBatBuoc && <p className="m-0 text-xs text-slate-300">{t('PA theo quy chế vẫn chạy — PA này là hỗ trợ thêm.')}</p>}
          <FormPa phang v={v} dat={(p) => setV((x) => ({ ...x, ...p }))} lf={lf} loi={loi} chonLoai studentId={studentId}
            luat={deXuat
              ? t('Đây là một ĐỀ XUẤT nên Quản lý phải trả lời trong {HAN_DUYET_NGAY} ngày, tính cả hôm gửi. Trong lúc chờ thì chưa ghi kết quả được.', { HAN_DUYET_NGAY })
              : t('Chọn một mục trong "Cần Quản lý duyệt" tức là đang xin ý kiến Quản lý.')}
            ngay={status === 'completed' ? (
              <Truong nhan={t('Ngày đã làm')} batBuoc loi={lf.loiCua(loi, 'ngay-lam')}>
                <ChonNgayGan value={completedDate} onChange={setCompletedDate} soNgay={30} chuaChon={t('Chọn ngày')} ariaLabel={t('Ngày đã làm')}
                  id={lf.oId('ngay-lam')} onBlur={lf.roi('ngay-lam')} invalid={!!lf.loiCua(loi, 'ngay-lam')} />
              </Truong>
            ) : (
              <Truong nhan={t('Bắt đầu')} batBuoc>
                <ChonNgayGan value={startedDate} onChange={setStartedDate} ariaLabel={t('Bắt đầu')} />
              </Truong>
            )}
            cuoi={(
              /* K3-18: PA đã làm trước đây là trường hợp hiếm — liên kết phụ, không phải công tắc đầu form. */
              <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-left text-xs"
                aria-pressed={status === 'completed'} onClick={() => setStatus(status === 'completed' ? 'started' : 'completed')}>
                {status === 'completed' ? t('Ghi PA đang theo dõi (bỏ chế độ đã làm trước đây)') : t('Ghi một PA đã làm trước đây')}
              </button>
            )} />
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
        </CanLam>
        {boiCanh && <BoiCanh dong={boiCanh} />}
      </div>
    </KhungPanel>
  );
}

// ==================================================================== Sửa PA

/** Phần PA trong `CaseDetail.interventions` mà Sửa PA cần. */
export type PaDeSua = {
  id: number; kind: string; description: string | null; soBuoi: number | null; daDay: number;
  performer: string | null; performerUserId: number | null; startedDate: string | null;
  preset: boolean; recordedBy: string | null; createdAt?: string | null; mocChu: string | null;
  /** Máy chủ: 'ky_vong' (Tutor Kỳ vọng đầu ra) · 'he_thong' (quy chế, Bổ trợ, không người ghi) · null (tạo tay). */
  nguonTao?: 'ky_vong' | 'he_thong' | null;
  revisions: BanDieuChinh[];
};

/** Nguồn của PA web tạo (dòng đầu Sửa PA): `null` = PA người tạo tay; '' = web tạo, không rõ nguồn. */
function nguonWebTao(pa: PaDeSua): string | null {
  if (pa.nguonTao === 'ky_vong') return t('theo Kết quả đầu ra');
  if (!pa.nguonTao) return null;
  if (pa.kind === 'bo_tro') return 'theo Progress Test';
  if (pa.kind === 'bo_tro_mien_phi') return 'theo Final Test';
  return pa.preset ? t('theo quy chế SOS') : '';
}

/**
 * SỬA PA (PR-PA §8, mockup mục 5–6) — cùng form Thêm PA; Loại khoá (đổi loại = Kết quả › Thay PA); Số buổi ≥ đã dạy; Ngày bắt đầu khoá khi
 * PA đã có Kết quả. Chỉ gửi ô ĐÃ ĐỔI (`PATCH /interventions/:id`): ô không đổi không bị kiểm lại (PA vượt buổi, người cũ đã nghỉ vẫn sửa
 * được ô khác); đổi người thì gửi đủ ba khoá người (cả ba trống = xoá người). Mỗi lần lưu máy chủ ghi một dòng Nhật ký PA (cũ → mới).
 * Chân: Huỷ thay đổi / Lưu (`daSua`, luật S3).
 */
export function SuaPaPanel({ pa, ketQua, studentId, hocVien, lop, quayLai, onClose, onSaved }: ChungPanel & {
  pa: PaDeSua;
  /** `CaseDetail.followups` — Nhật ký PA và khoá Ngày bắt đầu khi PA đã có Kết quả. */
  ketQua: readonly KetQuaNhatKy[];
  studentId?: number | null;
}) {
  const coKetQua = ketQua.some((f) => f.interventionId === pa.id);
  const toast = useToast();
  const { homNay, ngan } = useNgayNghiepVu();
  const goc = giaTriCuaPa(pa);
  const [v, setV] = useState<GiaTriPa>(goc);
  const [startedDate, setStartedDate] = useState(pa.startedDate ?? '');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const loi = loiFormPa(v, { daDay: pa.daDay, goc });

  const body = thanSuaPa(v, goc, { moi: startedDate, cu: pa.startedDate });
  const daSua = Object.keys(body).length > 0;

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    if (!daSua) { onSaved(); return; }
    setBusy(true);
    try {
      await api.patch(`/interventions/${pa.id}`, body);
      invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/tong-quan');
      toast.push('ok', t('Đã lưu PA'));
      onSaved();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };

  const nguon = nguonWebTao(pa);
  return (
    <KhungPanel tieuDe={t('Sửa PA')} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      chan={{
        daSua,
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{busy ? t('Đang lưu…') : t('Lưu')}</button>,
      }}>
      {nguon !== null && (
        <p className="m-0 pt-3 text-xs text-slate-300">
          {t('Web tạo{x}{x2}.', { x: nguon ? ` ${nguon}` : '', x2: pa.createdAt ? ` · ${ngan(pa.createdAt)}` : '' })}<span className="max-sm:hidden"> {t('Sửa được mọi ô trừ Loại.')}</span>
        </p>
      )}
      <FormPa v={v} dat={(p) => setV((x) => ({ ...x, ...p }))} lf={lf} loi={loi} daDay={pa.daDay} studentId={studentId}
        quyChe={pa.preset ? { mocChu: pa.mocChu } : null}
        ngay={coKetQua
          ? <NgayKhoa chu={pa.startedDate ? `${tuanLich(pa.startedDate, homNay)} · ${ngan(pa.startedDate)}` : '—'} phu={t('Đã có kết quả tuần — không đổi')} />
          : (
            <Truong nhan={t('Ngày bắt đầu')}>
              <ChonNgayGan value={startedDate} onChange={setStartedDate} soNgay={14} chuaChon={t('Chọn ngày')} />
            </Truong>
          )} />
      <Khoi tieuDe={t('Nhật ký PA')}><NhatKyPa pa={pa} ketQua={ketQua} /></Khoi>
    </KhungPanel>
  );
}

// ==================================================================== Hoàn thành Case

/**
 * HOÀN THÀNH CASE — MỘT NÚT, MỘT PANEL (mục 9.3). Sau cả đợt, em tiến bộ đến đâu (bốn mức, bấm một cái) · kết luận (BẮT BUỘC —
 * ba tháng sau chính người viết cũng cần đọc lại) · ngày hoàn thành. Điểm chi tiết theo kỹ năng: tuỳ chọn, đúng kỹ năng của Case.
 */
export function HoanThanhCasePanel({ caseId, category, categoryLabel, ratio, paGanNhat, hocVien, lop, quayLai, onClose, onSaved }: ChungPanel & {
  caseId: number; category: string | null; categoryLabel: string | null; ratio: boolean;
  /** C6: kết quả cuối của PA gần nhất — gợi ý khi chọn mức. */
  paGanNhat?: string | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  /* OV-11d (HV-22, thay K3-19): điền sẵn theo Kết quả của PA gần nhất (cùng thang chữ) — đổi một bấm; PA "Chưa đủ dữ liệu" / chưa có thì để trống. */
  const [outcome, setOutcome] = useState<string>(() => CASE_OUTCOMES.find((o) => CASE_OUTCOME_LABEL[o] === paGanNhat) ?? '');
  const [note, setNote] = useState('');
  const [closedOn, setClosedOn] = useState(homNay);
  const [metrics, setMetrics] = useState<Record<string, { score: string; total: string }>>({});
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const components = componentsFor(category, ratio ? 'ratio' : 'band');
  const counts = componentsAreCounts(category);
  const loi = dsLoi([
    { khoa: 'muc', nhan: t('Em tiến bộ đến đâu'), chon: true },
    { khoa: 'vi-sao', nhan: t('Vì sao kết luận vậy'), toiThieu: 10 },
  ], { muc: outcome, 'vi-sao': note });
  const thieu = loi.map((l) => l.nhan);

  const luu = async () => {
    lf.bam();
    if (thieu.length > 0) return;
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/outcome`, {
        outcome, note, closedOn: closedOn || undefined,
        metrics: componentsPayload(category, metrics, counts),
      });
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students');
      toast.push('ok', t('Đã hoàn thành Case'));
      onSaved();
    } catch (e: any) {
      toast.push('error', e?.message ?? t('Không lưu được'));
    } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={t('Hoàn thành Case')} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      chan={{
        daSua: !!note.trim() || Object.keys(metrics).length > 0,   // "← …" hỏi trước khi bỏ chữ đang gõ (rà #395)
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{t('Hoàn thành Case')}</button>,
      }}>
      <Khoi tieuDe={t('Kết quả cuối')}
        luat={t('Đóng nhầm thì Quản lý mở lại được. MT sau trượt lại thì có Case mới nối Case này.')}>
        <Truong nhan={t('Sau cả đợt hỗ trợ, em tiến bộ đến đâu?')} batBuoc as="div" loi={lf.loiCua(loi, 'muc')}
          phu={paGanNhat ? t('PA gần nhất: {paGanNhat}', { paGanNhat }) : undefined}>
          <div className="grid grid-cols-2 gap-2 outline-none sm:grid-cols-4" role="group" id={lf.oId('muc')} tabIndex={-1}>
            {CASE_OUTCOMES.map((o) => (
              <NutChon key={o} chon={outcome === o} className="justify-center" onClick={() => setOutcome(o)}>
                {CASE_OUTCOME_LABEL[o]}
              </NutChon>
            ))}
          </div>
        </Truong>
        <Truong nhan={t('Vì sao kết luận vậy')} batBuoc phu={t('Phương án đã áp dụng cho em, kết quả ra sao, vì sao dừng ở đây')}
          loi={lf.loiCua(loi, 'vi-sao')} dem={{ co: note.trim().length, can: 10 }}>
          <textarea className="field w-full" {...lf.o(loi, 'vi-sao')} rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={t('Ví dụ: MT3 Listening lên 6.0')} />
        </Truong>
        <Truong nhan={t('Ngày hoàn thành')}><ONgay kieu="ngay" value={closedOn} onChange={setClosedOn} toiDa={homNay} /></Truong>
      </Khoi>
      {components.length > 0 && (
        <Khoi tieuDe={t('Điểm chi tiết · không bắt buộc')}>
          <ComponentsField label={categoryLabel ?? ''} components={components} counts={counts} value={metrics} onChange={setMetrics} />
        </Khoi>
      )}
    </KhungPanel>
  );
}

// ==================================================================== Sửa Case · Xoá Case (PR-LUI-a2, mockup mục 18–20)

/** Phần dữ liệu Ngăn Case mà panel Sửa Case cần (một phần của `CaseDetail`). */
export type CaseDeSua = {
  id: number; topic?: string | null; chuongTrinh?: string | null; ratio: boolean; urgency: string | null; summary: string | null;
  /** Lượt MT của Case — link "hồ sơ MT" khi nguyên nhân lấy từ bài. */
  attemptId?: number | null;
  issues: { role: string; code: string; label?: string; observation: string | null; byName?: string | null; /** SV-NX-CASE: mô tả đang theo nhận xét MT nào. */ moTaTuMt?: string | null }[];
  /** SV-NX-CASE (N8 ②): Case Mock Test — mô tả = quan sát của nhóm chính; sửa ở đây thì tách khỏi nhận xét của bài. */
  sos?: { laMt?: boolean } | null;
  /** SV-NX-CASE: mốc phiên bản (409 khi Case vừa đổi). */
  capNhatLuc?: string | null;
  viewer: { khoaKyNang?: boolean; coTheXoa?: boolean; chanXoa?: string | null; tenSua?: string | null };
};

/**
 * SỬA CASE: Kỹ năng (khoá khi Case đã có PA) · Nhóm nguyên nhân · Mức độ · Tên Case · Mô tả (Case MT không có — OV-13a Q1). Chân trái `Xoá Case` (Quản lý / Quản trị, Case báo tay chưa có PA
 * ghi kết quả) → hỏi một dòng. Còn PA có kết quả: nút Xoá Case khoá + câu hướng dẫn. Luật nội dung kiểm ở máy chủ (`kiemNoiDungCase`).
 */
export function SuaCasePanel({ c, tenCase, soPaChuaLam, hocVien, lop, quayLai, onClose, onSaved, onDeleted }: ChungPanel & {
  c: CaseDeSua; tenCase: string;
  /** Số PA chưa làm sẽ huỷ theo khi Xoá Case (dòng hỏi). */
  soPaChuaLam: number;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const ct = c.chuongTrinh ?? null;
  const goc = c.issues.find((i) => i.role === 'primary') ?? null;
  const laMt = !!c.sos?.laMt;
  /* OV-13a (Q1) → SV-NX-CASE: Case Mock Test không có ô Mô tả riêng (`summary`) — mô tả là quan sát của nhóm chính, mặc định theo nhận xét của bài. */
  const coMoTa = !laMt;
  const [topic, setTopic] = useState(c.topic ?? '');
  const [primaryCode, setPrimaryCode] = useState(goc?.code ?? '');
  const [ghiRo, setGhiRo] = useState(goc?.observation ?? '');
  const [urgency, setUrgency] = useState(c.urgency ?? '');
  const [title, setTitle] = useState(c.viewer.tenSua ?? '');
  const [summary, setSummary] = useState(c.summary ?? '');
  const [busy, setBusy] = useState(false);
  const [hoiXoa, setHoiXoa] = useState(false);
  /* SV-NX-CASE: mốc phiên bản gửi kèm — 409 thì giữ chữ đang gõ, lấy mốc mới để lần Lưu sau ghi đè có chủ ý. */
  const [luc, setLuc] = useState<string | null | undefined>(c.capNhatLuc);
  const lf = useLoiForm();
  const topics = caseTopicsFor(c.ratio, ct);
  /* Case MT chưa có mô tả: chỉ đổi tên / mức độ thì không đòi nhóm + mô tả; gõ một trong hai thì đòi đủ. */
  const doiNguyenNhan = !(laMt && !goc && !primaryCode && !ghiRo.trim());
  const causes = topic ? issuesForTopic(topic, ct) : [];
  const loi = dsLoi([
    ...(doiNguyenNhan ? [{ khoa: 'phan-loai', nhan: t('Nhóm nguyên nhân'), chon: true }] : []),
    ...(laMt ? (doiNguyenNhan ? [{ khoa: 'ghi-ro', nhan: t('Mô tả'), toiThieu: NHAN_XET_MT_TOI_THIEU }] : [])
      : laKhac(primaryCode) ? [{ khoa: 'ghi-ro', nhan: t('Ghi rõ'), toiThieu: KHAC_TOI_THIEU }] : []),
    { khoa: 'muc-do', nhan: t('Mức độ'), chon: true },
    { khoa: 'ten', nhan: t('Tên Case'), toiThieu: 3 },
    ...(coMoTa ? [{ khoa: 'mo-ta', nhan: t('Mô tả'), toiThieu: 15 }] : []),
  ], { 'phan-loai': primaryCode, 'ghi-ro': ghiRo, 'muc-do': urgency, ten: title, 'mo-ta': summary });
  const daSua = topic !== (c.topic ?? '') || primaryCode !== (goc?.code ?? '') || ghiRo !== (goc?.observation ?? '')
    || urgency !== (c.urgency ?? '') || title !== (c.viewer.tenSua ?? '') || summary !== (c.summary ?? '');

  const luu = async () => {
    lf.bam();
    if (loi.length) return;
    setBusy(true);
    try {
      await api.patch(`/cases/${c.id}`, {
        /* Case MT: chỉ gửi nhóm + mô tả khi đổi — đổi mức độ / tên không tách mô tả khỏi nhận xét. */
        luc, topic, ...(laMt && primaryCode === (goc?.code ?? '') && ghiRo === (goc?.observation ?? '') ? {}
          : { primaryCode, observation: laMt || laKhac(primaryCode) ? ghiRo.trim() : null }), urgency, title: title.trim(), ...(coMoTa ? { summary: summary.trim() } : {}),
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/my-work');
      toast.push('ok', t('Đã lưu Case'));
      onSaved();
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) setLuc(e.details?.luc ?? null);   // chữ đang gõ giữ nguyên
      toast.push('error', e?.message ?? t('Không lưu được'));
    } finally { setBusy(false); }
  };
  const xoa = async () => {
    setBusy(true);
    try {
      await api.del(`/cases/${c.id}`);
      invalidate('/cases'); invalidate('/students'); invalidate('/my-work'); invalidate('/tong-quan'); invalidate('/yeu-cau');
      toast.push('ok', t('Đã xoá Case'));
      onDeleted();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không xoá được')); setHoiXoa(false); } finally { setBusy(false); }
  };

  return (
    <>
      <KhungPanel tieuDe={t('Sửa Case')} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
        ngCanh={<><span aria-hidden className="text-bad">*</span> {t('= bắt buộc')}</>}
        chan={{
          daSua,
          xoa: c.viewer.coTheXoa ? { nhan: t('Xoá Case'), onClick: () => setHoiXoa(true) } : undefined,
          /* Còn PA có kết quả: Xoá Case khoá + câu hướng dẫn (mockup mục 20). */
          phu: c.viewer.chanXoa ? (
            <span className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs text-bad">{c.viewer.chanXoa}</span>
              <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled>{t('Xoá Case')}</button>
            </span>
          ) : undefined,
          conThieu: lf.conThieu(loi),
          chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{busy ? t('Đang lưu…') : t('Lưu')}</button>,
        }}>
        <Khoi tieuDe="Case">
          <Truong nhan={t('Kỹ năng')} batBuoc as="div">
            {c.viewer.khoaKyNang ? (
              <div className="field w-full cursor-not-allowed opacity-70" aria-disabled>{topic ? tenMon(ct, topic) : '—'}</div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(topics.length, 1)}, minmax(0, 1fr))` }}>
                {topics.map((k) => (
                  <NutChon key={k} chon={topic === k} title={tenMon(ct, k)} className="justify-center px-1"
                    onClick={() => { if (k !== topic) { setTopic(k); setPrimaryCode(''); } }}>
                    {tenMonNgan(ct, k)}
                  </NutChon>
                ))}
              </div>
            )}
          </Truong>
          <div>
            <Truong nhan={t('Nhóm nguyên nhân')} batBuoc loi={lf.loiCua(loi, 'phan-loai')}>
              <select className="field w-full" {...lf.o(loi, 'phan-loai')} value={primaryCode} onChange={(e) => setPrimaryCode(e.target.value)}
                title={causes.find((i) => i.code === primaryCode)?.hint}>
                <option value="">{t('Chọn nhóm')}</option>
                {causes.map((i) => <option key={i.code} value={i.code} title={i.hint}>{i.label}</option>)}
              </select>
            </Truong>
            {laMt ? (
              <div className="mt-4">
              <Truong nhan={t('Mô tả')} batBuoc loi={lf.loiCua(loi, 'ghi-ro')} dem={{ co: ghiRo.trim().length, can: NHAN_XET_MT_TOI_THIEU }}>
                <textarea className="field w-full" {...lf.o(loi, 'ghi-ro')} rows={3} maxLength={NHAN_XET_TOI_DA} value={ghiRo} onChange={(e) => setGhiRo(e.target.value)} />
                <div className="mt-1 text-xs text-slate-400">
                  {goc?.moTaTuMt
                    ? (c.attemptId
                      ? <Link className="link" to={duongDotTest({ id: c.attemptId, kind: 'mock' }, c.topic)}>{t('Đang theo nhận xét {mt} — sửa ở đây thì mô tả tách khỏi nhận xét.', { mt: goc.moTaTuMt })}</Link>
                      : t('Đang theo nhận xét {mt} — sửa ở đây thì mô tả tách khỏi nhận xét.', { mt: goc.moTaTuMt }))
                    : goc?.byName ? t('Mô tả đã sửa riêng — nhận xét của bài không đè.') : null}
                </div>
              </Truong>
              </div>
            ) : (
            <OKhac hien={laKhac(primaryCode)} value={ghiRo} onChange={setGhiRo} goiY={t('Ví dụ: Chưa quen dạng bài mới')}
              id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(ghiRo) : null} />
            )}
          </div>
          <Truong nhan={t('Mức độ')} batBuoc as="div" loi={lf.loiCua(loi, 'muc-do')}>
            <div className="grid grid-cols-2 gap-2 outline-none sm:w-80" {...lf.o(loi, 'muc-do')} tabIndex={-1}>
              {URGENCY_LEVELS.map((u) => (
                <NutChon key={u} chon={urgency === u} className="justify-center" onClick={() => setUrgency(u)}>{URGENCY_LABEL[u]}</NutChon>
              ))}
            </div>
          </Truong>
          <Truong nhan={t('Tên Case')} batBuoc loi={lf.loiCua(loi, 'ten')}>
            <input className="field w-full" {...lf.o(loi, 'ten')} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Truong>
          {coMoTa && (
            <Truong nhan={t('Mô tả')} batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: summary.trim().length, can: 15 }}>
              <textarea className="field w-full" {...lf.o(loi, 'mo-ta')} rows={3} maxLength={2000} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </Truong>
          )}
        </Khoi>
      </KhungPanel>
      {hoiXoa && (
        <KhungPanel tieuDe={t('Xoá Case này?')} longTrong z="z-[60]" onDong={() => !busy && setHoiXoa(false)}
          chan={{
            huy: { onClick: () => setHoiXoa(false), disabled: busy },
            chinh: <button type="button" className="btn btn-danger min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xoa()}>{busy ? t('Đang xoá…') : t('Xoá Case')}</button>,
          }}>
          <p className="m-0 pt-3 text-sm leading-relaxed text-slate-300">
            {tenCase}{soPaChuaLam > 0 ? t(' · {soPaChuaLam} PA chưa làm sẽ huỷ', { soPaChuaLam }) : ''}
          </p>
        </KhungPanel>
      )}
    </>
  );
}
