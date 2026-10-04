import { useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  CASE_OUTCOMES, CASE_OUTCOME_LABEL, HAN_DUYET_NGAY, INTERVENTION_KIND_LABEL, RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL,
  componentsAreCounts, componentsFor, interventionKindsFor, isProposalKind,
  GOI_Y_MO_TA_PA, nguoiThanhPayload, type NguoiChon, dsLoi, kiemGhiRoKhac, KHAC_TOI_THIEU, moiKhoaGui,
} from '@shared/domain/index.ts';
import { ComponentsField, componentsPayload } from './ChiTietKyNang.tsx';

/**
 * BA THAO TÁC CỦA NGĂN CASE (PR-UX3, N-4): Thêm PA · Hoàn thành Case · Trả lời đề xuất — trước đây là hộp thoại giữa màn đè lên
 * ngăn Case. Nay mỗi cái là một `KhungPanel` (`NganCase` thay nội dung, có dòng "← Case Listening"); cùng API, cùng luật.
 *
 * Chữ ký chung: `{ …dữ liệu, hocVien, lop, quayLai, onClose, onSaved }`. Lỗi chỉ hiện SAU khi bấm nút chính (`Còn thiếu: …`).
 */

type ChungPanel = {
  hocVien?: string | null; lop?: string | null;
  quayLai?: { nhan: string; onClick: () => void };
  onClose: () => void; onSaved: () => void;
};

// ==================================================================== Thêm PA

/**
 * THÊM PHƯƠNG ÁN (mục 8.2). Danh mục theo nhóm Case; người làm chọn từ tài khoản (PR-Form F-2). PR-SOS: bỏ ô ngày kết thúc (Q28-4);
 * Mô tả gợi ý "hướng dẫn, trọng tâm, ai thực hiện" (Q28-1); PA đã làm trước đây là liên kết phụ cuối form (K3-18).
 */
export function ThemPaPanel({ caseId, studentId, coPaBatBuoc, hocVien, lop, quayLai, onClose, onSaved }: ChungPanel & {
  caseId: number; studentId?: number | null;
  /** Case có PA theo quy chế đang chạy → PA này là hỗ trợ thêm. */
  coPaBatBuoc?: boolean;
}) {
  const toast = useToast();
  const catalogue = interventionKindsFor();
  const [kind, setKind] = useState<string>(catalogue.selfServe[0]);
  const [description, setDescription] = useState('');
  /* PA đề xuất "Khác" (T13): ô Tên đề xuất ngay dưới; máy chủ ghép "{tên} — {mô tả}" (Q9). Đổi loại vẫn giữ chữ đã gõ. */
  const [ghiRo, setGhiRo] = useState('');
  const laKhacPa = kind === 'other_proposal';
  /* Mặc định ĐANG THEO DÕI: PA vừa lập thì đang chạy, không phải đã xong. */
  const [status, setStatus] = useState<'started' | 'completed'>('started');
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [completedDate, setCompletedDate] = useState('');
  const [startedDate, setStartedDate] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<string>(RESCHEDULE_TARGETS[0]);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* PR-GVa (F01 = D13): một khoá gửi cho một lần mở panel — thử lại sau lỗi mạng không ghi PA thứ hai. */
  const khoa = useRef(moiKhoaGui('pa'));
  /* Nhóm Đề xuất luôn phải có Quản lý trả lời. */
  const deXuat = isProposalKind(kind);

  const loi = dsLoi([
    ...(laKhacPa ? [{ khoa: 'ghi-ro', nhan: 'Tên đề xuất', toiThieu: KHAC_TOI_THIEU }] : []),
    { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 8 },
    ...(status === 'completed' ? [{ khoa: 'ngay-lam', nhan: 'Ngày đã làm', chon: true }] : []),
  ], { 'ghi-ro': ghiRo, 'mo-ta': description, 'ngay-lam': completedDate });
  const thieu = loi.map((l) => l.nhan);

  const luu = async () => {
    lf.bam();
    if (thieu.length > 0) return;
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/interventions`, {
        kind, description, status,
        ...nguoiThanhPayload(nguoi),
        completedDate: status === 'completed' ? completedDate || undefined : undefined,
        startedDate: startedDate || undefined,
        rescheduleTarget: kind === 'reschedule_mt' ? rescheduleTarget : undefined,
        needsApproval: deXuat,
        ...(laKhacPa ? { ghiRoKhac: ghiRo.trim() } : {}),
        idempotencyKey: khoa.current,
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan');
      toast.push('ok', deXuat ? 'Đã gửi Quản lý duyệt' : 'Đã ghi lại');
      onSaved();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Thêm PA" hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>
            {deXuat ? 'Gửi Quản lý duyệt' : 'Thêm PA'}
          </button>
        ),
      }}>
      {coPaBatBuoc && <p className="m-0 pt-3 text-xs text-slate-400">PA theo quy chế vẫn chạy — PA này là hỗ trợ thêm.</p>}
      <Khoi tieuDe="Phương án"
        luat={deXuat
          ? `Đây là một ĐỀ XUẤT nên Quản lý phải trả lời trong ${HAN_DUYET_NGAY} ngày, tính cả hôm gửi. Trong lúc chờ thì chưa ghi kết quả được.`
          : 'Chọn một mục trong "Cần Quản lý duyệt" tức là đang xin ý kiến Quản lý.'}>
        <div>
          <Truong nhan="Loại PA" batBuoc>
            <select className="field w-full" value={kind} onChange={(e) => setKind(e.target.value)}>
              <optgroup label="Bạn tự làm được">
                {catalogue.selfServe.map((k: string) => (
                  <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]}</option>
                ))}
              </optgroup>
              <optgroup label="Cần Quản lý duyệt">
                {catalogue.proposals.map((k: string) => (
                  <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]} · cần Quản lý duyệt</option>
                ))}
              </optgroup>
            </select>
          </Truong>
          <OKhac hien={laKhacPa} value={ghiRo} onChange={setGhiRo} nhan="Tên đề xuất" goiY="Ví dụ: Học kèm 1-1 với Tutor"
            id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(ghiRo) : null} />
        </div>
        {kind === 'reschedule_mt' && (
          <Truong nhan="Lùi cái gì" batBuoc as="div">
            <div className="grid grid-cols-2 gap-2">
              {RESCHEDULE_TARGETS.map((t) => (
                <NutChon key={t} chon={rescheduleTarget === t} className="justify-center" onClick={() => setRescheduleTarget(t)}>
                  {RESCHEDULE_TARGET_LABEL[t]}
                </NutChon>
              ))}
            </div>
          </Truong>
        )}
        <Truong nhan="Mô tả" batBuoc loi={lf.loiCua(loi, 'mo-ta')}>
          <textarea className="field w-full" rows={2} {...lf.o(loi, 'mo-ta')} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={GOI_Y_MO_TA_PA} />
        </Truong>
      </Khoi>
      <Khoi tieuDe="Người thực hiện và thời gian">
        <Hang2>
          <Truong nhan="Người thực hiện" as="div">
            <ChonNguoi nhom="giao_vien" studentId={studentId} value={nguoi} onChange={setNguoi} />
          </Truong>
          {status === 'completed' ? (
            <Truong nhan="Ngày đã làm" batBuoc loi={lf.loiCua(loi, 'ngay-lam')}>
              <ChonNgayGan value={completedDate} onChange={setCompletedDate} soNgay={30} chuaChon="Chọn ngày" ariaLabel="Ngày đã làm"
                id={lf.oId('ngay-lam')} onBlur={lf.roi('ngay-lam')} invalid={!!lf.loiCua(loi, 'ngay-lam')} />
            </Truong>
          ) : (
            <Truong nhan="Ngày bắt đầu">
              <ChonNgayGan value={startedDate} onChange={setStartedDate} soNgay={14} chuaChon="Mặc định: hôm nay" />
            </Truong>
          )}
        </Hang2>
        {/* K3-18: PA đã làm trước đây là trường hợp hiếm — liên kết phụ, không phải công tắc đầu form. */}
        <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-left text-xs"
          aria-pressed={status === 'completed'} onClick={() => setStatus(status === 'completed' ? 'started' : 'completed')}>
          {status === 'completed' ? 'Ghi PA đang theo dõi (bỏ chế độ đã làm trước đây)' : 'Ghi một PA đã làm trước đây'}
        </button>
      </Khoi>
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
  /* K3-19: không chọn sẵn — người kết luận tự chọn (máy chủ cũng bắt buộc). */
  const [outcome, setOutcome] = useState<string>('');
  const [note, setNote] = useState('');
  const [closedOn, setClosedOn] = useState(homNay);
  const [metrics, setMetrics] = useState<Record<string, { score: string; total: string }>>({});
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const components = componentsFor(category, ratio ? 'ratio' : 'band');
  const counts = componentsAreCounts(category);
  const loi = dsLoi([
    { khoa: 'muc', nhan: 'Em tiến bộ đến đâu', chon: true },
    { khoa: 'vi-sao', nhan: 'Vì sao kết luận vậy', toiThieu: 10 },
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
      toast.push('ok', 'Đã hoàn thành Case');
      onSaved();
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Hoàn thành Case" hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>Hoàn thành Case</button>,
      }}>
      <Khoi tieuDe="Kết quả cuối"
        luat="Hoàn thành KHÔNG phải là xoá: nếu MT sau em trượt lại hạng mục này thì chính Case này mở lại, kèm một mốc tái phát — không sinh Case mới.">
        <Truong nhan="Sau cả đợt hỗ trợ, em tiến bộ đến đâu?" batBuoc as="div" loi={lf.loiCua(loi, 'muc')}
          phu={paGanNhat ? `PA gần nhất: ${paGanNhat}` : undefined}>
          <div className="grid grid-cols-2 gap-2 outline-none sm:grid-cols-4" role="group" id={lf.oId('muc')} tabIndex={-1}>
            {CASE_OUTCOMES.map((o) => (
              <NutChon key={o} chon={outcome === o} className="justify-center" onClick={() => setOutcome(o)}>
                {CASE_OUTCOME_LABEL[o]}
              </NutChon>
            ))}
          </div>
        </Truong>
        <Truong nhan="Vì sao kết luận vậy" batBuoc phu="Phương án đã áp dụng cho em, kết quả ra sao, vì sao dừng ở đây"
          loi={lf.loiCua(loi, 'vi-sao')} dem={{ co: note.trim().length, can: 10 }}>
          <textarea className="field w-full" {...lf.o(loi, 'vi-sao')} rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: MT3 Listening lên 6.0" />
        </Truong>
        <Truong nhan="Ngày hoàn thành"><ONgay kieu="ngay" value={closedOn} onChange={setClosedOn} toiDa={homNay} /></Truong>
      </Khoi>
      {components.length > 0 && (
        <Khoi tieuDe="Điểm chi tiết · không bắt buộc">
          <ComponentsField label={categoryLabel ?? ''} components={components} counts={counts} value={metrics} onChange={setMetrics} />
        </Khoi>
      )}
    </KhungPanel>
  );
}
