import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonNgayGan, ChonTuan } from '../../ui/ChonNgay.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  CASE_OUTCOMES, CASE_OUTCOME_LABEL, HAN_DUYET_NGAY, INTERVENTION_KIND_LABEL, RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL,
  componentsAreCounts, componentsFor, interventionKindsFor, isProposalKind,
  ngay, nguoiThanhPayload, planEndDefault, type NguoiChon, dsLoi,
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
 * THÊM PHƯƠNG ÁN (mục 8.2). Danh mục theo nhóm case; tình trạng chỉ còn Đang theo dõi / Đã xong; người làm chọn từ tài khoản
 * (PR-Form F-2); "Dự kiến kết thúc" là hạn HOÀN THÀNH của PA (bỏ trống thì lấy Chủ nhật tuần tiếp theo), không phải một cái nhắc.
 */
export function ThemPaPanel({ caseId, studentId, hocVien, lop, quayLai, onClose, onSaved }: ChungPanel & {
  caseId: number; studentId?: number | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const catalogue = interventionKindsFor();
  const [kind, setKind] = useState<string>(catalogue.selfServe[0]);
  const [description, setDescription] = useState('');
  /* Mặc định ĐANG THEO DÕI: PA vừa lập thì đang chạy, không phải đã xong. */
  const [status, setStatus] = useState<'started' | 'completed'>('started');
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [completedDate, setCompletedDate] = useState('');
  const [startedDate, setStartedDate] = useState('');
  const [followupDue, setFollowupDue] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<string>(RESCHEDULE_TARGETS[0]);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  /* Nhóm Đề xuất luôn phải có Quản lý trả lời. */
  const deXuat = isProposalKind(kind);

  const loi = dsLoi([
    { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 8 },
    ...(status === 'completed' ? [{ khoa: 'ngay-lam', nhan: 'Ngày đã làm', chon: true }] : []),
  ], { 'mo-ta': description, 'ngay-lam': completedDate });
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
        followupDue: followupDue || undefined,
        rescheduleTarget: kind === 'reschedule_mt' ? rescheduleTarget : undefined,
        needsApproval: deXuat,
      });
      invalidate('/cases'); invalidate('/students'); invalidate('/overview');
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
            {deXuat ? 'Gửi duyệt' : 'Thêm PA'}
          </button>
        ),
      }}>
      <Khoi tieuDe="Phương án"
        luat={deXuat
          ? `Đây là một ĐỀ XUẤT nên Quản lý phải trả lời trong ${HAN_DUYET_NGAY} ngày, tính cả hôm gửi. Trong lúc chờ thì chưa ghi kết quả được.`
          : 'Chọn một mục trong "Cần Quản lý duyệt" tức là đang xin ý kiến Quản lý.'}>
        <Truong nhan="Loại PA" batBuoc>
          <select className="field w-full" value={kind} onChange={(e) => setKind(e.target.value)}>
            <optgroup label="Bạn tự làm được">
              {catalogue.selfServe.map((k: string) => (
                <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]}</option>
              ))}
            </optgroup>
            <optgroup label="Cần Quản lý duyệt">
              {catalogue.proposals.map((k: string) => (
                <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL]} · cần QL duyệt</option>
              ))}
            </optgroup>
          </select>
        </Truong>
        {kind === 'reschedule_mt' && (
          <Truong nhan="Lùi cái gì" batBuoc as="div">
            <div className="grid grid-cols-2 gap-2">
              {RESCHEDULE_TARGETS.map((t) => (
                <button key={t} type="button" aria-pressed={rescheduleTarget === t}
                  className={`btn justify-center ${rescheduleTarget === t ? 'btn-primary' : ''}`} onClick={() => setRescheduleTarget(t)}>
                  {RESCHEDULE_TARGET_LABEL[t]}
                </button>
              ))}
            </div>
          </Truong>
        )}
        <Truong nhan="Mô tả" batBuoc phu="Một câu đủ để người khác hiểu sẽ làm gì cho em" loi={lf.loiCua(loi, 'mo-ta')}>
          <input className="field w-full" {...lf.o(loi, 'mo-ta')} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Ví dụ: 10 phút chữa câu mỗi buổi" />
        </Truong>
        <Truong nhan="Tình trạng" batBuoc as="div">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={status === 'started'} className={`btn justify-center ${status === 'started' ? 'btn-primary' : ''}`}
              onClick={() => setStatus('started')}>Đang theo dõi</button>
            <button type="button" aria-pressed={status === 'completed'} className={`btn justify-center ${status === 'completed' ? 'btn-primary' : ''}`}
              onClick={() => setStatus('completed')}>Đã xong</button>
          </div>
        </Truong>
      </Khoi>
      <Khoi tieuDe="Người thực hiện và thời gian">
        <Hang2>
          <Truong nhan="Người thực hiện" as="div">
            <ChonNguoi nhom="giao_vien" studentId={studentId} value={nguoi} onChange={setNguoi} />
          </Truong>
          {status === 'completed' ? (
            <Truong nhan="Ngày đã làm" batBuoc as="div" loi={lf.loiCua(loi, 'ngay-lam')}>
              <div {...lf.o(loi, 'ngay-lam')} tabIndex={-1} className="outline-none">
                <ChonNgayGan value={completedDate} onChange={setCompletedDate} soNgay={30} chuaChon="Chọn ngày" ariaLabel="Ngày đã làm" />
              </div>
            </Truong>
          ) : (
            <Truong nhan="Ngày bắt đầu">
              <ChonNgayGan value={startedDate} onChange={setStartedDate} soNgay={14} chuaChon="Mặc định: hôm nay" />
            </Truong>
          )}
        </Hang2>
        <Truong nhan="Dự kiến kết thúc" phu="Hạn hoàn thành PA, không phải nhắc việc">
          <ChonTuan moc="cuoi" catHomNay={false} lui={0} toi={12} value={followupDue} onChange={setFollowupDue} chuaChon={`Mặc định: CN ${ngay(planEndDefault(startedDate || homNay), homNay)}`} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}

// ==================================================================== Hoàn thành Case

/**
 * HOÀN THÀNH CASE — MỘT NÚT, MỘT PANEL (mục 9.3). Sau cả đợt, em tiến bộ đến đâu (bốn mức, bấm một cái) · kết luận (BẮT BUỘC —
 * ba tháng sau chính người viết cũng cần đọc lại) · ngày hoàn thành. Điểm chi tiết theo kỹ năng: tuỳ chọn, đúng kỹ năng của Case.
 */
export function HoanThanhCasePanel({ caseId, category, categoryLabel, ratio, hocVien, lop, quayLai, onClose, onSaved }: ChungPanel & {
  caseId: number; category: string | null; categoryLabel: string | null; ratio: boolean;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [outcome, setOutcome] = useState<string>('improved');
  const [note, setNote] = useState('');
  const [closedOn, setClosedOn] = useState(homNay);
  const [metrics, setMetrics] = useState<Record<string, { score: string; total: string }>>({});
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const components = componentsFor(category, ratio ? 'ratio' : 'band');
  const counts = componentsAreCounts(category);
  const loi = dsLoi([{ khoa: 'vi-sao', nhan: 'Vì sao kết luận vậy', toiThieu: 10 }], { 'vi-sao': note });
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
        <Truong nhan="Sau cả đợt hỗ trợ, em tiến bộ đến đâu?" batBuoc as="div">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group">
            {CASE_OUTCOMES.map((o) => (
              <button key={o} type="button" aria-pressed={outcome === o}
                className={`btn min-h-[44px] justify-center sm:min-h-0 ${outcome === o ? 'btn-primary' : ''}`} onClick={() => setOutcome(o)}>
                {CASE_OUTCOME_LABEL[o]}
              </button>
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

// ==================================================================== Trả lời đề xuất

/**
 * QUẢN LÝ TRẢ LỜI MỘT ĐỀ XUẤT. Ba lựa chọn; chỉ "Góp ý" là không kết thúc việc chờ — đề xuất vẫn nằm ở Việc cần làm cho tới khi
 * duyệt hoặc không duyệt. Không duyệt / góp ý thì BẮT BUỘC ghi lý do: bác một PA mà không nói vì sao thì giáo viên không biết làm gì tiếp.
 */
export function TraLoiDeXuatPanel({ iv, hocVien, lop, quayLai, onClose, onSaved }: ChungPanel & {
  iv: { id: number; kind: string; description?: string | null };
}) {
  const toast = useToast();
  const [decision, setDecision] = useState<'approved' | 'declined' | 'comment'>('approved');
  const [note, setNote] = useState('');
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);
  const canLyDo = decision !== 'approved';
  const loi = dsLoi(canLyDo ? [{ khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 }] : [], { 'ly-do': note });
  const thieu = loi.map((l) => l.nhan);
  const NGHIA: Record<typeof decision, string> = {
    approved: 'Cứ làm', declined: 'Nói rõ vì sao và nên làm gì thay thế', comment: 'Chưa quyết, đề xuất vẫn chờ bạn',
  };

  const gui = async () => {
    lf.bam();
    if (thieu.length > 0) return;
    setBusy(true);
    try {
      await api.post(`/interventions/${iv.id}/respond`, { decision, note });
      invalidate('/cases'); invalidate('/students'); invalidate('/my-work');
      toast.push('ok', 'Đã trả lời');
      onSaved();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Trả lời đề xuất" hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      ngCanh={<span className="truncate">{INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind}{iv.description ? ` — ${iv.description}` : ''}</span>}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={gui}>Gửi</button>,
      }}>
      <Khoi tieuDe="Quyết định">
        <div role="radiogroup" aria-label="Quyết định" className="grid grid-cols-3 gap-2">
          {([['approved', 'Duyệt'], ['declined', 'Không duyệt'], ['comment', 'Góp ý']] as const).map(([k, t]) => (
            <button key={k} type="button" role="radio" aria-checked={decision === k}
              className={`btn min-h-[44px] justify-center sm:min-h-0 ${decision === k ? 'btn-primary' : ''}`} onClick={() => setDecision(k)}>{t}</button>
          ))}
        </div>
        <p className="m-0 text-[11px] text-slate-500">{NGHIA[decision]}</p>
        <Truong nhan={canLyDo ? 'Lý do' : 'Ghi chú'} batBuoc={canLyDo} tuyChon={!canLyDo} loi={lf.loiCua(loi, 'ly-do')}>
          <input className="field w-full" {...lf.o(loi, 'ly-do')} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={decision === 'declined' ? 'Ví dụ: lớp thiếu GV, tạm xếp tự học' : 'Ví dụ: đồng ý, ưu tiên Listening trước'} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
