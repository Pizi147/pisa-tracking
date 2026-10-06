import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { QuaHan } from '../../ui/Nhan.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL,
  GOI_Y_KET_QUA_PA, GOI_Y_MO_TA_PA, NUT_LUU_KET_QUA, PLAN_DECISION_HINT, PLAN_DECISION_NGAN, PLAN_DECISION_NGHIA, quyetDinhChoPa,
  RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL,
  decisionBlockedReason, decisionNeedsReason, deadlineView, interventionKindsFor, ngay, nhanTuanGhiKetQua, outcomeLabelFor,
  nguoiThanhPayload, nguoiThieu, type NguoiChon, type PlanDecision, dsLoi, type LuatTruong, kiemGhiRoKhac, KHAC_TOI_THIEU,
} from '@shared/domain/index.ts';

/**
 * GHI KẾT QUẢ CỦA MỘT PA — MỘT PANEL (PR-UX3, N-4, mockup 15 §4–§5; nguồn §8). Thay `CapNhatTuanForm` (form trải trong trang + hộp
 * thoại đè lên ngăn Case): từ Hồ sơ HV, Việc cần làm, Hành trình đều mở NGĂN CASE ở view này.
 *
 * Hai khối: 1 · Kết quả tuần W4 SEP / ghi bù nhiều tuần (4 nút + "Chưa đủ dữ liệu" là nút chữ; Người phụ trách; Vấn đề còn tồn / Ghi chú —
 * PR-LUI-a2) · 2 · Quyết định (danh sách dọc 5 dòng, khối con mở NGAY DƯỚI dòng được chọn). Luật giữ nguyên (máy chủ vẫn kiểm lại); chỉ đổi CÁCH HIỆN: nút Lưu không mờ, bấm mới
 * hiện "Còn thiếu: Tiến triển · Lý do điều chỉnh" (Q4) — trước khi bấm không có lỗi nào.
 */

export type PaCanCapNhat = {
  id: number; kind: string; description: string | null; performer: string | null;
  actionDue: string | null; cycleNo?: number | null;
  /** Tài khoản người làm hiện tại — giá trị đầu của ô "Người thực hiện" khi Điều chỉnh (Q15). */
  performerUserId?: number | null;
  /** PR-SOS (T22, T63): PA theo quy chế · lần ghi này là "Ghi kết quả cuối" · chữ mốc (`đến MT2 · W2 OCT`). */
  batBuoc?: boolean; lanCuoi?: boolean; mocChu?: string | null;
};

const DA_LUU: Record<PlanDecision, string> = {
  keep: 'Đã ghi kết quả, PA vẫn đang chạy',
  adjust: 'Đã điều chỉnh PA, bản cũ giữ trong lịch sử',
  replace: 'Đã thay PA',
  end: 'Đã kết thúc PA',
  ask_manager: 'Đã gửi Quản lý — PA vẫn chạy',
};

/** Nghĩa ngắn (≤ 1 dòng) của dòng quyết định bị chặn — bản đủ ở `title`. */
function ngiaBiChan(outcome: string): string {
  return !outcome ? 'Chọn kết quả trước' : outcome === 'insufficient' ? 'Cần có kết quả để so' : 'Không hợp với kết quả này';
}

/** Người ban đầu của PA thành giá trị `ChonNguoi`: tài khoản nếu có, người ngoài nếu chỉ có tên, không có → `null`. */
function nguoiBanDau(pa: PaCanCapNhat): NguoiChon | null {
  if (pa.performerUserId) return { kieu: 'tai_khoan', id: pa.performerUserId, ten: pa.performer ?? `#${pa.performerUserId}` };
  if (pa.performer) return { kieu: 'ngoai', ten: pa.performer };
  return null;
}
const khacNguoi = (a: NguoiChon | null, b: NguoiChon | null) => {
  if (!a || !b) return a !== b;
  if (a.kieu !== b.kieu) return true;
  return a.kieu === 'tai_khoan' ? a.id !== (b as typeof a).id : a.kieu === 'ngoai' ? a.ten.trim() !== (b as typeof a).ten.trim() : false;
};

export function GhiKetQuaPanel({ pa, hocVien, lop, quayLai, onClose, onSaved, onThemPa }: {
  pa: PaCanCapNhat; hocVien?: string | null; lop?: string | null;
  /** PA theo quy chế cần thêm hỗ trợ → mở Thêm PA (T63, K3-12). */
  onThemPa?: () => void;
  quayLai?: { nhan: string; onClick: () => void };
  onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const goc = nguoiBanDau(pa);
  const [outcome, setOutcome] = useState('');
  const [progress, setProgress] = useState('');
  const [remaining, setRemaining] = useState('');
  const [decision, setDecision] = useState<PlanDecision | ''>('');
  const [reason, setReason] = useState('');
  const [on, setOn] = useState(homNay);
  const [endOn, setEndOn] = useState(homNay);
  /* Điều chỉnh: giá trị ban đầu = bản hiện tại; "đổi" = khác giá trị ban đầu. */
  const [desc, setDesc] = useState(pa.description ?? '');
  const [nguoi, setNguoi] = useState<NguoiChon | null>(goc);
  /* PR-LUI-a2: Người phụ trách của lần ghi — điền sẵn người thực hiện PA; không đổi người thực hiện PA. */
  const [phuTrach, setPhuTrach] = useState<NguoiChon | null>(goc);
  /* Thay */
  const kinds = interventionKindsFor();
  const [newKind, setNewKind] = useState<string>(kinds.selfServe[0]);
  const [newDesc, setNewDesc] = useState('');
  /* PA mới là đề xuất "Khác" (T13): ô Tên đề xuất ngay dưới; máy chủ ghép "{tên} — {mô tả}" (Q9). */
  const [newGhiRo, setNewGhiRo] = useState('');
  const [newNguoi, setNewNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [newTarget, setNewTarget] = useState<string>(RESCHEDULE_TARGETS[0]);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);

  const pickOutcome = (o: string) => {
    setOutcome(o);
    if (decision && decisionBlockedReason(o, decision)) setDecision('');
  };
  /* PR-SOS: lần CUỐI của PA theo quy chế — không khối Quyết định; "Chưa đủ dữ liệu" được, kèm Lý do (K3-13). */
  const lanCuoi = !!pa.lanCuoi;
  /* PR-LT2b (M-05): lần ghi cuối của PA Bổ trợ miễn phí bắt buộc kèm Mini Test — một lần cho cả nhóm PA của em. */
  const coMiniTest = lanCuoi && pa.kind === 'bo_tro_mien_phi';
  const [mtTyLe, setMtTyLe] = useState('');
  const [mtNgay, setMtNgay] = useState(homNay ?? '');
  /* T63, K3-12: PA theo quy chế chỉ có Giữ nguyên / Điều chỉnh / Xin hỗ trợ — Thay và Kết thúc ẨN (không mờ). */
  const dsQuyetDinh = quyetDinhChoPa({ preset: !!pa.batBuoc }, lanCuoi);
  const needReason = !!decision && decisionNeedsReason(decision);
  const descChanged = desc.trim() !== (pa.description ?? '').trim();
  const nguoiDoi = khacNguoi(nguoi, goc);
  const adjustChanged = descChanged || nguoiDoi;

  /* Ô lỗi (YC-12.5.2): lý do dưới ô, chân chỉ đếm "n ô cần sửa ↑". Luật giữ như bản cũ. */
  const LUAT: LuatTruong[] = [
    { khoa: 'ket-qua', nhan: 'Kết quả', chon: true },
    { khoa: 'tien-trien', nhan: 'Tiến triển', toiThieu: 8 },
    ...(lanCuoi ? [] : [{ khoa: 'quyet-dinh', nhan: 'Quyết định', chon: true }]),
    ...(lanCuoi && outcome === 'insufficient' ? [{ khoa: 'ly-do', nhan: 'Lý do chưa đủ dữ liệu', toiThieu: 1 }] : []),
    ...(decision === 'replace' && newKind === 'other_proposal' ? [{ khoa: 'ghi-ro', nhan: 'Tên đề xuất', toiThieu: KHAC_TOI_THIEU }] : []),
    ...(decision === 'replace' ? [{ khoa: 'pa-moi', nhan: 'Nội dung PA mới', toiThieu: 8 }] : []),
    ...(needReason ? [{ khoa: 'ly-do', nhan: decision === 'adjust' ? 'Lý do điều chỉnh' : 'Lý do thay', toiThieu: 1 }] : []),
    ...(decision === 'ask_manager' ? [{ khoa: 'ly-do', nhan: 'Cần Quản lý giúp gì', toiThieu: 8 }] : []),
  ];
  const loi = dsLoi(LUAT, { 'ket-qua': outcome, 'tien-trien': progress, 'quyet-dinh': decision, 'ghi-ro': newGhiRo, 'pa-moi': newDesc, 'ly-do': reason });
  if (coMiniTest) {
    const so = Number(mtTyLe.replace(',', '.'));
    if (mtTyLe.trim() === '' || !Number.isFinite(so) || so < 0 || so > 100) loi.push({ khoa: 'mt-ty-le', nhan: 'Mini Test (%)', lyDo: 'Nhập số từ 0 đến 100' });
    if (!mtNgay) loi.push({ khoa: 'mt-ngay', nhan: 'Ngày làm', lyDo: 'Chọn ngày làm Mini Test' });
  }
  {
    const thieuNguoi = nguoiThieu(phuTrach, true);
    if (thieuNguoi) loi.push({ khoa: 'phu-trach', nhan: 'Người phụ trách', lyDo: phuTrach ? thieuNguoi : 'Chọn Người phụ trách' });
  }
  if (decision === 'adjust') {
    if (!adjustChanged) loi.push({ khoa: 'noi-dung', nhan: 'Nội dung PA', lyDo: 'Đổi ít nhất một ô: nội dung hoặc người làm' });
    else if (descChanged && desc.trim().length < 8) loi.push({ khoa: 'noi-dung', nhan: 'Nội dung PA', lyDo: `Cần ít nhất 8 ký tự (đang có ${desc.trim().length})` });
  }
  const thieu = loi.map((l) => l.nhan);
  const loiCua = (khoa: string) => lf.loiCua(loi, khoa);
  const o = (khoa: string) => lf.o(loi, khoa);

  const luu = async () => {
    lf.bam();
    if (thieu.length > 0 || (!decision && !lanCuoi)) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        decision: lanCuoi ? undefined : decision, outcome, note: progress, observedOn: on || undefined,
        remainingIssue: remaining.trim() || undefined,
        /* Lý do chỉ gửi khi có ô lý do thật — ô "Ghi chú" riêng đã gộp vào "Vấn đề còn tồn / Ghi chú" (PR-LUI-a2). */
        decisionNote: (needReason || decision === 'ask_manager' || (lanCuoi && outcome === 'insufficient')) ? reason.trim() || undefined : undefined,
        phuTrach: nguoiThanhPayload(phuTrach),
      };
      if (decision === 'end') body.completedOn = endOn || undefined;
      if (coMiniTest) body.miniTest = { tyLe: Number(mtTyLe.replace(',', '.')), ngay: mtNgay };
      if (decision === 'adjust') {
        body.adjust = {
          description: descChanged ? desc : undefined,
          /* Không đổi người thì không gửi gì (máy chủ giữ người cũ); đổi thì gửi người mới. */
          ...(nguoiDoi ? nguoiThanhPayload(nguoi) : {}),
        };
      }
      if (decision === 'replace') {
        body.newPlan = {
          kind: newKind, description: newDesc,
          ...nguoiThanhPayload(newNguoi),
          rescheduleTarget: newKind === 'reschedule_mt' ? newTarget : null,
          ...(newKind === 'other_proposal' ? { ghiRoKhac: newGhiRo.trim() } : {}),
        };
      }
      await api.post(`/interventions/${pa.id}/result`, body);
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/tong-quan');
      toast.push('ok', lanCuoi ? 'Đã ghi kết quả cuối — PA theo quy chế kết thúc' : DA_LUU[decision as PlanDecision]);
      onSaved();
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  const hanGhi = pa.actionDue ? deadlineView({ kind: 'cap-nhat-pa', due: pa.actionDue, today: homNay }) : null;
  /* K3-17: tiêu đề khối nói TUẦN đang ghi ('Kết quả tuần W4 SEP'); trễ nhiều tuần thì nói khoảng + số tuần ghi bù. */
  const tuanGhi = nhanTuanGhiKetQua(pa.actionDue ?? null, homNay).tieuDe;
  const tenPa = pa.description || (INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind);

  /* Khối con mở NGAY DƯỚI dòng quyết định được chọn (thụt 12px, vạch trái). */
  const khoiCon = (d: PlanDecision) => {
    if (d === 'adjust') {
      return (
        <div className="space-y-3">
          <Truong nhan="Nội dung PA" loi={loiCua('noi-dung')}>
            <textarea className="field w-full" {...o('noi-dung')} rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Truong>
          <Truong nhan="Người thực hiện" as="div">
            <ChonNguoi nhom="giao_vien" value={nguoi} onChange={setNguoi} />
          </Truong>
          <Truong nhan="Lý do điều chỉnh" batBuoc phu="Phải đổi ít nhất một trong hai ô trên" loi={loiCua('ly-do')}>
            <input className="field w-full" {...o('ly-do')} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
        </div>
      );
    }
    if (d === 'replace') {
      return (
        <div className="space-y-3">
          <div>
            <Truong nhan="PA mới" batBuoc>
              <select className="field w-full" value={newKind} onChange={(e) => setNewKind(e.target.value)}>
                <optgroup label="Bạn tự làm được">
                  {kinds.selfServe.map((k) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k}</option>)}
                </optgroup>
                <optgroup label="Cần Quản lý duyệt">
                  {kinds.proposals.map((k) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k} · cần Quản lý duyệt</option>)}
                </optgroup>
              </select>
            </Truong>
            <OKhac hien={newKind === 'other_proposal'} value={newGhiRo} onChange={setNewGhiRo} nhan="Tên đề xuất"
              goiY="Ví dụ: Học kèm 1-1 với Tutor"
              id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(newGhiRo) : null} />
          </div>
          <Truong nhan="Nội dung" batBuoc loi={loiCua('pa-moi')}>
            <textarea className="field w-full" {...o('pa-moi')} rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder={GOI_Y_MO_TA_PA} />
          </Truong>
          <Hang2>
            <Truong nhan="Người thực hiện" as="div">
              <ChonNguoi nhom="giao_vien" value={newNguoi} onChange={setNewNguoi} />
            </Truong>
            {newKind === 'reschedule_mt' && (
              <Truong nhan="Lùi cái gì">
                <select className="field w-full" value={newTarget} onChange={(e) => setNewTarget(e.target.value)}>
                  {RESCHEDULE_TARGETS.map((t) => <option key={t} value={t}>{RESCHEDULE_TARGET_LABEL[t]}</option>)}
                </select>
              </Truong>
            )}
          </Hang2>
          <Truong nhan="Lý do thay" batBuoc loi={loiCua('ly-do')}>
            <input className="field w-full" {...o('ly-do')} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
        </div>
      );
    }
    if (d === 'ask_manager') {
      return (
        <div className="space-y-2">
          <Truong nhan="Cần Quản lý giúp gì" batBuoc loi={loiCua('ly-do')}>
            <textarea className="field w-full" {...o('ly-do')} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
          <p className="m-0 text-[11px] text-slate-500">Gửi Quản lý · trả lời trong 5 ngày · xem ở Yêu cầu của tôi</p>
        </div>
      );
    }
    if (d === 'end') {
      return <Truong nhan="Ngày kết thúc"><ONgay kieu="ngay" value={endOn} onChange={setEndOn} toiDa={homNay} /></Truong>;
    }
    return null;
  };

  return (
    <KhungPanel tieuDe={lanCuoi ? 'Ghi kết quả cuối' : 'Ghi kết quả'} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      ngCanh={(
        <span className="flex items-center gap-1.5">
          <span className="truncate" title={tenPa}>{tenPa}{pa.cycleNo && pa.cycleNo > 1 ? ` · Đợt ${pa.cycleNo}` : ''}</span>
          {hanGhi && <span className="whitespace-nowrap text-slate-500">· {hanGhi.han}</span>}
          {hanGhi?.tone === 'overdue' && <QuaHan ngay={hanGhi.daysOverdue} />}
        </span>
      )}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>
            {busy ? 'Đang lưu…' : lanCuoi ? 'Ghi kết quả cuối' : decision ? NUT_LUU_KET_QUA[decision] : 'Ghi kết quả'}
          </button>
        ),
      }}>
      <Khoi tieuDe={lanCuoi ? tuanGhi : `1 · ${tuanGhi}`}>
        {lanCuoi && (
          <p className="m-0 text-xs text-slate-300">
            Tuần này chạm mốc quy chế{pa.mocChu ? ` (${pa.mocChu})` : ''} — lưu là PA kết thúc.
          </p>
        )}
        <div>
          {/* PR-LUI-a2: 2 cột ở mọi cỡ (panel ≤ 560 px), chữ cho xuống dòng, bỏ dấu ✓ ↗ – ↓ — không cắt / lệch. Sửa chung NutChon là PR-KHUNG. */}
          <div {...o('ket-qua')} tabIndex={-1} className="grid grid-cols-2 gap-2 outline-none" role="group" aria-label={tuanGhi}>
            {FOLLOWUP_OUTCOMES.filter((o) => o !== 'insufficient').map((o) => (
              <NutChon key={o} chon={outcome === o} onClick={() => pickOutcome(o)} className="justify-center text-sm">
                {outcomeLabelFor(o)}
              </NutChon>
            ))}
          </div>
          <p className="m-0 mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            Chưa có bài để so?
            <NutChon nho chon={outcome === 'insufficient'} onClick={() => pickOutcome('insufficient')}>
              {outcomeLabelFor('insufficient')}
            </NutChon>
          </p>
          {loiCua('ket-qua') && <span className="mt-1 block text-[11px] text-late">{loiCua('ket-qua')}</span>}
        </div>
        <Truong nhan="Tiến triển" batBuoc loi={loiCua('tien-trien')} dem={{ co: progress.trim().length, can: 8 }}>
          <textarea className="field w-full" {...o('tien-trien')} rows={2} value={progress} onChange={(e) => setProgress(e.target.value)}
            placeholder={GOI_Y_KET_QUA_PA} />
        </Truong>
        <Truong nhan="Người phụ trách" batBuoc as="div" loi={loiCua('phu-trach')}>
          <div {...o('phu-trach')} tabIndex={-1} className="outline-none">
            <ChonNguoi nhom="nhan_vien" value={phuTrach} onChange={setPhuTrach} ariaLabel="Người phụ trách" />
          </div>
        </Truong>
        <Truong nhan="Vấn đề còn tồn / Ghi chú" tuyChon>
          <input className="field w-full" maxLength={300} value={remaining} onChange={(e) => setRemaining(e.target.value)}
            placeholder="Ví dụ: còn sai dạng T/F/NG" />
        </Truong>
      </Khoi>

      {coMiniTest && (
        <Khoi tieuDe="Mini Test">
          <Hang2>
            <Truong nhan="Mini Test (%)" batBuoc loi={loiCua('mt-ty-le')} phu="Đạt từ 70%">
              <input className="field w-full tabular-nums" inputMode="decimal" {...o('mt-ty-le')} value={mtTyLe} onChange={(e) => setMtTyLe(e.target.value)} placeholder="Ví dụ: 72" />
            </Truong>
            <Truong nhan="Ngày làm Mini Test" batBuoc loi={loiCua('mt-ngay')}>
              <ONgay kieu="ngay" value={mtNgay} onChange={setMtNgay} toiDa={homNay} />
            </Truong>
          </Hang2>
        </Khoi>
      )}
      {lanCuoi && outcome === 'insufficient' && (
        <Khoi tieuDe="Lý do">
          <Truong nhan="Lý do chưa đủ dữ liệu" batBuoc loi={loiCua('ly-do')}>
            <input className="field w-full" {...o('ly-do')} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Em nghỉ ốm cả tuần cuối, chưa có bài để so" />
          </Truong>
        </Khoi>
      )}
      {!lanCuoi && (
      <Khoi tieuDe="2 · Quyết định"
        luat="Điều chỉnh: cùng PA, sửa nội dung hoặc người làm — bản cũ giữ trong lịch sử. Thay PA: khép PA này và mở PA mới. Kết thúc PA: Case chỉ hoàn thành được khi mọi PA đã khép.">
        {pa.batBuoc && (
          <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            PA theo quy chế — không thay, không kết thúc sớm. Cần thêm hỗ trợ?
            {onThemPa && <button type="button" className="btn btn-sm" onClick={onThemPa}>+ Thêm PA</button>}
          </p>
        )}
        <div {...o('quyet-dinh')} tabIndex={-1} role="radiogroup" aria-label="Quyết định" className="space-y-1.5 outline-none">
          {dsQuyetDinh.map((d) => {
            const chan = outcome ? decisionBlockedReason(outcome, d) : 'Chọn kết quả trước.';
            const chon = decision === d;
            return (
              <div key={d}>
                <button type="button" role="radio" aria-checked={chon} disabled={!!chan} title={chan ?? PLAN_DECISION_HINT[d]}
                  onClick={() => setDecision(d)}
                  className={`flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left disabled:cursor-not-allowed disabled:opacity-45 ${
                    chon ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]' : 'border-[color:var(--line)] hover:border-[color:var(--line-strong)]'}`}
                  style={{ background: chon ? undefined : 'transparent' }}>
                  <span aria-hidden className={`mt-[3px] inline-block h-3 w-3 shrink-0 rounded-full border ${chon ? 'border-[color:var(--accent)] bg-[color:var(--accent)]' : 'border-slate-500'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-100">{PLAN_DECISION_NGAN[d]}</span>
                    <span className="block text-[11px] text-slate-500">{chan ? ngiaBiChan(outcome) : PLAN_DECISION_NGHIA[d]}</span>
                  </span>
                </button>
                {chon && khoiCon(d) && (
                  <div className="ml-3 mt-2 border-l-2 pl-3" style={{ borderColor: 'var(--accent-line)' }}>{khoiCon(d)}</div>
                )}
              </div>
            );
          })}
        </div>
        {loiCua('quyet-dinh') && <span className="block text-[11px] text-late">{loiCua('quyet-dinh')}</span>}
      </Khoi>
      )}

      <div className="mt-3.5">
        <Truong nhan="Ngày ghi"><ONgay kieu="ngay" value={on} onChange={setOn} toiDa={homNay} /></Truong>
      </div>
    </KhungPanel>
  );
}

/** Một lần sửa nội dung PA, cùng hình với máy chủ (`server/src/cases/planRevisions.ts`). */
export type BanDieuChinh = {
  id: number; on: string; source: 'adjust' | 'confirm_edit'; by: string | null; reason: string;
  before: { description: string | null; performer: string | null };
  after: { description: string | null; performer: string | null };
};

/**
 * LỊCH SỬ ĐIỀU CHỈNH của một PA, mới nhất lên trên. Chỉ hiện trường ĐÃ ĐỔI. Dùng trong thẻ PA ở ngăn Case
 * (G-3: thẻ PA chỉ có một dòng phụ, chi tiết để ở đây).
 */
export function LichSuDieuChinh({ revisions }: { revisions: BanDieuChinh[] }) {
  const { homNay } = useNgayNghiepVu();
  if (!revisions.length) return null;
  const d = (x: string | null) => (x ? ngay(x, homNay) : 'chưa đặt');
  return (
    <ol className="list-none p-0 m-0 space-y-1.5">
      {[...revisions].reverse().map((r) => (
        <li key={r.id} className="text-xs">
          <span className="block text-[11px] text-slate-500 tabular-nums">
            {d(r.on)} · Điều chỉnh{r.source === 'confirm_edit' ? ' khi xác nhận PA' : ''}{r.by ? ` · ${r.by}` : ''}
          </span>
          <span className="block text-slate-300">Lý do: {r.reason}</span>
          {r.before.description !== r.after.description && (
            <span className="block text-slate-400 break-words">Trước: “{r.before.description ?? ''}”</span>
          )}
          {r.before.performer !== r.after.performer && (
            <span className="block text-slate-400">Người thực hiện: {r.before.performer ?? 'chưa có'} → {r.after.performer ?? 'chưa có'}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
