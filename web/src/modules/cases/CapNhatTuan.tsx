import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { QuaHan } from '../../ui/Nhan.tsx';
import { ChonTuan } from '../../ui/ChonNgay.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL, OUTCOME_MARK,
  NUT_LUU_KET_QUA, PLAN_DECISIONS, PLAN_DECISION_HINT, PLAN_DECISION_NGAN, PLAN_DECISION_NGHIA,
  RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL,
  decisionBlockedReason, decisionNeedsReason, deadlineView, interventionKindsFor, ngay, nhanTuanGhiKetQua, outcomeLabelFor,
  nguoiThanhPayload, type NguoiChon, type PlanDecision, dsLoi, type LuatTruong, kiemGhiRoKhac, KHAC_TOI_THIEU,
} from '@shared/domain/index.ts';

/**
 * GHI KẾT QUẢ CỦA MỘT PA — MỘT PANEL (PR-UX3, N-4, mockup 15 §4–§5; nguồn §8). Thay `CapNhatTuanForm` (form trải trong trang + hộp
 * thoại đè lên ngăn Case): từ Hồ sơ HV, Việc cần làm, Hành trình đều mở NGĂN CASE ở view này.
 *
 * Ba khối: 1 · Kết quả tuần W4 SEP / ghi bù nhiều tuần (4 nút + "Chưa đủ dữ liệu" là nút chữ) · 2 · Quyết định (danh sách dọc 5 dòng, khối con mở
 * NGAY DƯỚI dòng được chọn) · 3 · Ghi chú. Luật giữ nguyên (máy chủ vẫn kiểm lại); chỉ đổi CÁCH HIỆN: nút Lưu không mờ, bấm mới
 * hiện "Còn thiếu: Tiến triển · Lý do điều chỉnh" (Q4) — trước khi bấm không có lỗi nào.
 */

export type PaCanCapNhat = {
  id: number; kind: string; description: string | null; performer: string | null;
  followupDue: string | null; actionDue: string | null; cycleNo?: number | null;
  /** Tài khoản người làm hiện tại — giá trị đầu của ô "Người thực hiện" khi Điều chỉnh (Q15). */
  performerUserId?: number | null;
};

const DA_LUU: Record<PlanDecision, string> = {
  keep: 'Đã ghi kết quả, PA vẫn đang chạy',
  adjust: 'Đã điều chỉnh PA, bản cũ giữ trong lịch sử',
  replace: 'Đã thay PA',
  end: 'Đã kết thúc PA',
  ask_manager: 'Đã chuyển sang chờ Quản lý',
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

export function GhiKetQuaPanel({ pa, hocVien, lop, quayLai, onClose, onSaved }: {
  pa: PaCanCapNhat; hocVien?: string | null; lop?: string | null;
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
  const [due, setDue] = useState(pa.followupDue ?? '');
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
  const needReason = !!decision && decisionNeedsReason(decision);
  const descChanged = desc.trim() !== (pa.description ?? '').trim();
  const dueChanged = !!due && due !== (pa.followupDue ?? '');
  const nguoiDoi = khacNguoi(nguoi, goc);
  const adjustChanged = descChanged || nguoiDoi || dueChanged;

  /* Ô lỗi (YC-12.5.2): lý do dưới ô, chân chỉ đếm "n ô cần sửa ↑". Luật giữ như bản cũ. */
  const LUAT: LuatTruong[] = [
    { khoa: 'ket-qua', nhan: 'Kết quả', chon: true },
    { khoa: 'tien-trien', nhan: 'Tiến triển', toiThieu: 8 },
    { khoa: 'quyet-dinh', nhan: 'Quyết định', chon: true },
    ...(decision === 'replace' && newKind === 'other_proposal' ? [{ khoa: 'ghi-ro', nhan: 'Tên đề xuất', toiThieu: KHAC_TOI_THIEU }] : []),
    ...(decision === 'replace' ? [{ khoa: 'pa-moi', nhan: 'Nội dung PA mới', toiThieu: 8 }] : []),
    ...(needReason ? [{ khoa: 'ly-do', nhan: decision === 'adjust' ? 'Lý do điều chỉnh' : 'Lý do thay', toiThieu: 8 }] : []),
    ...(decision === 'ask_manager' ? [{ khoa: 'ly-do', nhan: 'Cần Quản lý giúp gì', toiThieu: 8 }] : []),
  ];
  const loi = dsLoi(LUAT, { 'ket-qua': outcome, 'tien-trien': progress, 'quyet-dinh': decision, 'ghi-ro': newGhiRo, 'pa-moi': newDesc, 'ly-do': reason });
  if (decision === 'adjust') {
    if (!adjustChanged) loi.push({ khoa: 'noi-dung', nhan: 'Nội dung PA', lyDo: 'Đổi ít nhất một ô: nội dung, người làm hoặc hạn' });
    else if (descChanged && desc.trim().length < 8) loi.push({ khoa: 'noi-dung', nhan: 'Nội dung PA', lyDo: `Cần ít nhất 8 ký tự (đang có ${desc.trim().length})` });
    else if (dueChanged && !!on && due < on) loi.push({ khoa: 'han', nhan: 'Hạn kết thúc PA', lyDo: 'Không được sớm hơn ngày ghi' });
  }
  const thieu = loi.map((l) => l.nhan);
  const loiCua = (khoa: string) => lf.loiCua(loi, khoa);
  const o = (khoa: string) => lf.o(loi, khoa);

  const luu = async () => {
    lf.bam();
    if (thieu.length > 0 || !decision) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        decision, outcome, note: progress, observedOn: on || undefined,
        remainingIssue: remaining.trim() || undefined, decisionNote: reason.trim() || undefined,
      };
      if (decision === 'end') body.completedOn = endOn || undefined;
      if (decision === 'adjust') {
        body.adjust = {
          description: descChanged ? desc : undefined,
          /* Không đổi người thì không gửi gì (máy chủ giữ người cũ); đổi thì gửi người mới. */
          ...(nguoiDoi ? nguoiThanhPayload(nguoi) : {}),
          followupDue: dueChanged ? due : undefined,
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
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', DA_LUU[decision]);
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
          <Hang2>
            <Truong nhan="Người thực hiện" as="div">
              <ChonNguoi nhom="giao_vien" value={nguoi} onChange={setNguoi} />
            </Truong>
            <Truong nhan="Đến (hạn kết thúc PA)" loi={loiCua('han')}>
              <ChonTuan moc="cuoi" catHomNay={false} lui={0} toi={12} value={due} onChange={setDue} ariaLabel="Đến (hạn kết thúc PA)"
                id={lf.oId('han')} onBlur={lf.roi('han')} invalid={!!loiCua('han')} />
            </Truong>
          </Hang2>
          <Truong nhan="Lý do điều chỉnh" batBuoc phu="Phải đổi ít nhất một trong ba ô trên" loi={loiCua('ly-do')}>
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
                  {kinds.proposals.map((k) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k} · cần QL duyệt</option>)}
                </optgroup>
              </select>
            </Truong>
            <OKhac hien={newKind === 'other_proposal'} value={newGhiRo} onChange={setNewGhiRo} nhan="Tên đề xuất"
              goiY="Ví dụ: Học kèm 1-1 với trợ giảng"
              id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(newGhiRo) : null} />
          </div>
          <Truong nhan="Nội dung" batBuoc phu="Ví dụ: 10 phút chữa câu mỗi buổi, hai bài viết lại mỗi tuần" loi={loiCua('pa-moi')}>
            <textarea className="field w-full" {...o('pa-moi')} rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
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
          <p className="m-0 text-[11px] text-slate-500">Gửi Quản lý chi nhánh · nhận ở Việc cần làm</p>
        </div>
      );
    }
    if (d === 'end') {
      return <Truong nhan="Ngày kết thúc"><ONgay kieu="ngay" value={endOn} onChange={setEndOn} toiDa={homNay} /></Truong>;
    }
    return null;
  };

  return (
    <KhungPanel tieuDe="Ghi kết quả PA" hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
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
            {busy ? 'Đang lưu…' : decision ? NUT_LUU_KET_QUA[decision] : 'Lưu kết quả'}
          </button>
        ),
      }}>
      <Khoi tieuDe={`1 · ${tuanGhi}`}>
        <div>
          <div {...o('ket-qua')} tabIndex={-1} className="grid grid-cols-2 gap-2 outline-none sm:grid-cols-4" role="group" aria-label={tuanGhi}>
            {FOLLOWUP_OUTCOMES.filter((o) => o !== 'insufficient').map((o) => (
              <NutChon key={o} chon={outcome === o} onClick={() => pickOutcome(o)}
                className="justify-center whitespace-nowrap px-1.5 text-xs">
                {OUTCOME_MARK[o] ?? ''} {outcomeLabelFor(o)}
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
            placeholder="Ví dụ: nghe 1.0 vẫn sót số và tên riêng" />
        </Truong>
        <Truong nhan="Vấn đề còn tồn" tuyChon>
          <input className="field w-full" maxLength={300} value={remaining} onChange={(e) => setRemaining(e.target.value)}
            placeholder="Ví dụ: còn sai dạng T/F/NG" />
        </Truong>
      </Khoi>

      <Khoi tieuDe="2 · Quyết định"
        luat="Điều chỉnh: cùng PA, sửa nội dung, người làm hoặc hạn — bản cũ giữ trong lịch sử. Thay PA: khép PA này và mở PA mới. Kết thúc PA: Case chỉ hoàn thành được khi mọi PA đã khép.">
        <div {...o('quyet-dinh')} tabIndex={-1} role="radiogroup" aria-label="Quyết định" className="space-y-1.5 outline-none">
          {PLAN_DECISIONS.map((d) => {
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

      {(decision === 'keep' || decision === 'end' || !decision) && (
        <Khoi tieuDe="3 · Ghi chú">
          <Truong nhan="Ghi chú" tuyChon>
            <input className="field w-full" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
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
  before: { description: string | null; performer: string | null; followupDue: string | null };
  after: { description: string | null; performer: string | null; followupDue: string | null };
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
            {d(r.on)} · Điều chỉnh{r.source === 'confirm_edit' ? ' khi xác nhận gợi ý' : ''}{r.by ? ` · ${r.by}` : ''}
          </span>
          <span className="block text-slate-300">Lý do: {r.reason}</span>
          {r.before.description !== r.after.description && (
            <span className="block text-slate-400 break-words">Trước: “{r.before.description ?? ''}”</span>
          )}
          {r.before.performer !== r.after.performer && (
            <span className="block text-slate-400">Người thực hiện: {r.before.performer ?? 'chưa có'} → {r.after.performer ?? 'chưa có'}</span>
          )}
          {r.before.followupDue !== r.after.followupDue && (
            <span className="block text-slate-400">Hạn kết thúc: {d(r.before.followupDue)} → {d(r.after.followupDue)}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
