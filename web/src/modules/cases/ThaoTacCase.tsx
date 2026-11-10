import { useRef, useState, type ReactNode } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { BoiCanh, CanLam, DongTiep, NutVaTiep, TrangThaiLuu, type TiepViec } from '../../ui/KhuonViec.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CHU_TOI_THIEU_CASE,
  CASE_OUTCOMES, INTERVENTION_KIND_LABEL, CASE_OUTCOME_LABEL, HAN_DUYET_NGAY,
  componentsAreCounts, componentsFor, interventionKindsFor, isProposalKind,
  dsLoi, moiKhoaGui, loiFormPa, paMoi, paPayload, type GiaTriPa, } from '@shared/domain/index.ts';
import { ComponentsField, componentsPayload } from './ChiTietKyNang.tsx';
import { FormPa } from './FormPa.tsx';
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
 * LOGIC THÊM PA dùng chung (HSL-FT): panel `ThemPaPanel` và form tại chỗ của hồ sơ lượt (`FormThemPaTaiCho`) — cùng giá trị, lỗi, khoá gửi
 * một lần mở (thử lại không ghi PA thứ hai), cùng đường `POST /cases/:id/interventions`. Lỗi lưu giữ chữ (`loiLuu`, nơi gọi vẽ "Thử lại").
 */
export function useThemPa({ caseId, onSaved, v0 }: {
  caseId: number;
  /** M6 6b-3 `diTiep`: bấm "… · việc tiếp ›" (panel việc) — nơi gọi chuyển việc kế thay vì ở lại "✓ Đã lưu". */
  onSaved: (caseMoi: any, x: DaLuuPanel, diTiep: boolean) => void;
  /** Bản nháp còn giữ (form tại chỗ bị đóng khi đổi dòng — không mất chữ). */
  v0?: GiaTriPa;
}) {
  const { homNay } = useNgayNghiepVu();
  const [v, setV] = useState<GiaTriPa>(() => v0 ?? paMoi(interventionKindsFor().selfServe[0]));
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
  const [bam, setBam] = useState<'luu' | 'tiep' | null>(null);

  const loi = [
    ...loiFormPa(v),
    ...dsLoi(status === 'completed' ? [{ khoa: 'ngay-lam', nhan: t('Ngày đã làm'), chon: true }] : [], { 'ngay-lam': completedDate }),
  ];

  const luu = async (diTiep = false) => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    setLoiLuu(null);
    setBam(diTiep ? 'tiep' : 'luu');
    try {
      const c = await api.post<{ interventions?: { id: number }[] }>(`/cases/${caseId}/interventions`, {
        ...paPayload(v), status,
        completedDate: status === 'completed' ? completedDate || undefined : undefined,
        startedDate: status === 'started' ? startedDate || undefined : undefined,
        needsApproval: deXuat,
        idempotencyKey: khoa.current,
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan'); invalidate('/my-work');   // OV-11c (CV-2): việc Thêm PA hết ở Công việc
      /* OV-13b: panel ở lại "✓ Đã lưu · Việc tiếp ›" (nơi gọi vẽ) — không toast đè chân. */
      /* M6 6b-2 (Q1): PA vừa thêm = id lớn nhất Case trả về (gửi lại cùng khoá trả đúng PA đó) → Hoàn tác Thêm PA (#623; máy chủ kiểm người thêm + 10 giây). */
      const paId = Math.max(0, ...(c?.interventions ?? []).map((x) => x.id)) || undefined;
      onSaved(c, { chu: deXuat ? t('Đã gửi Quản lý duyệt') : t('Đã thêm PA'), phu: [dich(INTERVENTION_KIND_LABEL[v.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? v.kind), v.description.trim()].filter(Boolean).join(' · '),
        paId, hoanTac: paId ? async () => { await api.post(`/interventions/${paId}/hoan-tac-them`); invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan'); invalidate('/my-work'); } : undefined }, diTiep);
    } catch (e: any) { setLoiLuu(e.message); } finally { setBusy(false); }
  };

  const daSua = !!(v.description.trim() || status === 'completed');
  return { v, setV, status, setStatus, completedDate, setCompletedDate, startedDate, setStartedDate, lf, busy, bam, loiLuu, deXuat, loi, luu, daSua };
}

/** Ô "Bắt đầu" / "Ngày đã làm" + liên kết "PA đã làm trước đây" của form Thêm PA — panel và form tại chỗ cùng chữ, cùng luật. */
export function phanNgayThemPa(h: ReturnType<typeof useThemPa>) {
  const { status, setStatus, completedDate, setCompletedDate, startedDate, setStartedDate, lf, loi } = h;
  return {
    ngay: status === 'completed' ? (
      <Truong nhan={t('Ngày đã làm')} batBuoc loi={lf.loiCua(loi, 'ngay-lam')}>
        <ChonNgayGan value={completedDate} onChange={setCompletedDate} soNgay={30} chuaChon={t('Chọn ngày')} ariaLabel={t('Ngày đã làm')}
          id={lf.oId('ngay-lam')} onBlur={lf.roi('ngay-lam')} invalid={!!lf.loiCua(loi, 'ngay-lam')} />
      </Truong>
    ) : (
      <Truong nhan={t('Bắt đầu')} batBuoc>
        <ChonNgayGan value={startedDate} onChange={setStartedDate} ariaLabel={t('Bắt đầu')} />
      </Truong>
    ),
    cuoi: (
      /* K3-18: PA đã làm trước đây là trường hợp hiếm — liên kết phụ, không phải công tắc đầu form. */
      <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-left text-xs"
        aria-pressed={status === 'completed'} onClick={() => setStatus(status === 'completed' ? 'started' : 'completed')}>
        {status === 'completed' ? t('Ghi PA đang theo dõi (bỏ chế độ đã làm trước đây)') : t('Ghi một PA đã làm trước đây')}
      </button>
    ),
  };
}

/**
 * THÊM PHƯƠNG ÁN (mục 8.2) — PR-PA (§8): một form PA (`FormPa`): Loại · Nội dung · Số buổi · Người dạy / Người thực hiện (không bắt buộc)
 * · Ngày bắt đầu. PA đã làm trước đây là liên kết phụ cuối form (K3-18). OV-12e (mockup v3 §6): khuôn panel v3 — đầu "Thêm PA" + chip hạn /
 * em (link) · lớp · ngữ cảnh (nơi gọi truyền `dau`), MỘT khối Cần làm (form + nút chính "Thêm PA" / "Gửi QL duyệt"), Bối cảnh ≤ 3 dòng, chân trạng thái lưu;
 * Bắt đầu = ô ngày gõ được + nút lịch (`ChonNgayGan` = `ONgay`, không sau hôm nay), mặc định hôm nay.
 */
export function ThemPaPanel({ caseId, studentId, coPaBatBuoc, hocVien, lop, quayLai, onClose, onSaved, dau, boiCanh, tiep: tiepViec }: ChungPanel & {
  caseId: number; studentId?: number | null;
  /** M6 6b-3: panel việc có việc kế — "Thêm PA · việc tiếp ›" (đề xuất cần Quản lý duyệt thì không). */
  tiep?: TiepViec;
  /** Case có PA theo quy chế đang chạy → PA này là hỗ trợ thêm. */
  coPaBatBuoc?: boolean;
  /** OV-12e: đầu panel v3 (`dauViec`) + Bối cảnh (Nguyên nhân · Kết quả gần nhất). */
  dau?: { han?: ReactNode; dong2: ReactNode[] }; boiCanh?: [string, ReactNode][];
}) {
  const h = useThemPa({ caseId, onSaved: (_c, x, diTiep) => { if (diTiep && tiep) tiep.lam(x); else onSaved(x); } });
  const { v, setV, lf, busy, bam, loiLuu, deXuat, loi, luu, daSua } = h;
  const tiep = deXuat ? undefined : tiepViec;
  const nut = <NutVaTiep chu={deXuat ? t('Gửi Quản lý duyệt') : t('Thêm PA')} chuTiep={t('Thêm PA · việc tiếp ›')} busy={busy} bam={bam} tiep={tiep} luu={(x) => void luu(x)} />;
  const { ngay, cuoi } = phanNgayThemPa(h);
  return (
    <KhungPanel tieuDe={t('Thêm PA')} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose} dau={dau}
      chan={{
        v3: true, chinh: <><DongTiep tiep={tiep} chan />{nut}</>, daSua, conThieu: lf.conThieu(loi),
        dongTren: busy || loiLuu ? <TrangThaiLuu tt={busy ? 'dang' : 'loi'} loi={loiLuu} onThuLai={() => void luu(bam === 'tiep')} /> : undefined,
      }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          {coPaBatBuoc && <p className="m-0 text-xs text-slate-300">{t('PA theo quy chế vẫn chạy — PA này là hỗ trợ thêm.')}</p>}
          <FormPa phang v={v} dat={(p) => setV((x) => ({ ...x, ...p }))} lf={lf} loi={loi} chonLoai studentId={studentId}
            luat={deXuat
              ? t('Đây là một ĐỀ XUẤT nên Quản lý phải trả lời trong {HAN_DUYET_NGAY} ngày, tính cả hôm gửi. Trong lúc chờ thì chưa ghi kết quả được.', { HAN_DUYET_NGAY })
              : t('Chọn một mục trong "Cần Quản lý duyệt" tức là đang xin ý kiến Quản lý.')}
            ngay={ngay} cuoi={cuoi} />
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
          <DongTiep tiep={tiep} />
        </CanLam>
        {boiCanh && <BoiCanh dong={boiCanh} />}
      </div>
    </KhungPanel>
  );
}

// ==================================================================== Hoàn thành Case

/**
 * HOÀN THÀNH CASE — MỘT NÚT, MỘT PANEL (mục 9.3). Sau cả đợt, em tiến bộ đến đâu (bốn mức, bấm một cái) · kết luận (BẮT BUỘC —
 * ba tháng sau chính người viết cũng cần đọc lại) · ngày hoàn thành. Điểm chi tiết theo kỹ năng: tuỳ chọn, đúng kỹ năng của Case.
 */
export function HoanThanhCasePanel({ caseId, category, categoryLabel, ratio, paGanNhat, ketLuanSan, hocVien, lop, quayLai, onClose, onSaved }: ChungPanel & {
  caseId: number; category: string | null; categoryLabel: string | null; ratio: boolean;
  /** #3 (G2-07): Nhận xét của Kết quả PA gần nhất — điền sẵn ô kết luận (sửa được), không gõ lại cùng một ý. */
  ketLuanSan?: string | null;
  /** C6: kết quả cuối của PA gần nhất — gợi ý khi chọn mức. */
  paGanNhat?: string | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  /* OV-11d (HV-22, thay K3-19): điền sẵn theo Kết quả của PA gần nhất (cùng thang chữ) — đổi một bấm; PA "Chưa đủ dữ liệu" / chưa có thì để trống. */
  const [outcome, setOutcome] = useState<string>(() => CASE_OUTCOMES.find((o) => CASE_OUTCOME_LABEL[o] === paGanNhat) ?? '');
  const [note, setNote] = useState(ketLuanSan ?? '');
  const [closedOn, setClosedOn] = useState(homNay);
  const [metrics, setMetrics] = useState<Record<string, { score: string; total: string }>>({});
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const components = componentsFor(category, ratio ? 'ratio' : 'band');
  const counts = componentsAreCounts(category);
  const loi = dsLoi([
    { khoa: 'muc', nhan: t('Em tiến bộ đến đâu'), chon: true },
    { khoa: 'vi-sao', nhan: t('Vì sao kết luận vậy'), toiThieu: CHU_TOI_THIEU_CASE },   // #4 ngưỡng chung
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
        <Truong nhan={t('Vì sao kết luận vậy')} batBuoc
          loi={lf.loiCua(loi, 'vi-sao')} dem={{ co: note.trim().length, can: CHU_TOI_THIEU_CASE }}>
          {/* AUDIT-UI C6: câu hướng dẫn chuyển vào `title` của ô (ví dụ vẫn ở placeholder). */}
          <textarea className="field w-full" title={t('Phương án đã áp dụng cho em, kết quả ra sao, vì sao dừng ở đây')} {...lf.o(loi, 'vi-sao')} rows={3} value={note} onChange={(e) => setNote(e.target.value)}
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

