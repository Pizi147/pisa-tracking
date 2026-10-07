import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, NhanTrangThai, NutChon, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import {
  COORDINATION_KINDS, COORDINATION_KIND_LABEL, COORDINATION_USER_REMOVE_REASONS, COORDINATION_REMOVE_REASON_LABEL,
  type CoordinationKind, type NguoiChon, kiemGhiRoKhac, nguoiThieu, reasonNeedsText, trangThaiPhoiHop,
} from '@shared/domain/index.ts';
import { fmtDate, sosLabel } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Hang2, Truong } from '../../ui/KhungPanel.tsx';

type CoordAction = {
  id: number; kind: string; kindLabel: string; customName: string | null; name: string;
  preset: boolean; status: 'pending' | 'done' | 'removed'; statusLabel: string;
  performedOn: string | null; performerName: string | null; note: string | null;
  removeReasonLabel: string | null; attachmentCount: number;
  /** Báo phụ huynh qua TVV (PR-LT2a): bốn nội dung GVCN chuyển cho TVV — null với việc khác. */
  noiDung?: string[] | null;
  /** PR-PHH: việc đã xong mà chưa lưu bản chụp (xác nhận trước PR-PHH) — `noiDung` là nội dung hiện tại. */
  noiDungLaHienTai?: boolean;
};
export type CoordTurn = {
  attemptId: number; attemptNo: number; studentId: number; studentName: string;
  classCode: string | null; sosLevel: number | null; skillLabels: string[];
  /** Lớp thường (T58): `Giữa khoá` + `2/4 môn đạt` thay cho `MT2 · SOS 2`; null với lượt Mock FT. */
  nhanDot?: string | null; ketQua?: { chinh: string; phu: string | null } | null;
  summary: { done: number; active: number; label: string; complete: boolean };
  actions: CoordAction[]; canAct: boolean;
};

/**
 * K3-38 (PR-YT4): "CX / GĐCN meeting" của Phối hợp SOS KHÁC Meeting CX/GĐCN của Ý thức (cần QL duyệt) — nhãn ghi rõ "sau Mock" + chữ phụ
 * để GVCN không nhầm hai việc. Chỉ đổi chữ hiển thị, không đổi mã.
 */
const laMeetingCx = (k: string) => k === 'cx_meeting_student' || k === 'cx_meeting_family';
const nhanMeetingSauMock = (k: string) => `Meeting CX/GĐCN (sau Mock) · ${k === 'cx_meeting_family' ? 'HV / PH' : 'HV'}`;

/**
 * DANH SÁCH `Phối hợp SOS` (§7.2/§7.3, prototype v3 — PR-HV) — dùng chung cho tab lớp (`cot1="hocVien"`: cột 1 là tên
 * học viên) và tab hồ sơ học viên (`cot1="luot"`: cột 1 là `MT2 · SOS 2`). Mỗi lượt một thẻ `TheSos`.
 */
export function PhoiHopSosSection({ turns, loading, cot1 = 'hocVien', onGoAcademic, onChanged }: {
  turns: CoordTurn[] | null; loading?: boolean;
  cot1?: 'luot' | 'hocVien';
  onGoAcademic?: () => void; onChanged?: () => void;
}) {
  if (loading || !turns) return <Skeleton rows={3} />;
  /* PR-S5F-b: tab dùng chung FT và lớp thường — màn rỗng không nói "SOS" (lớp thường không có SOS). */
  if (!turns.length) return <Empty title="Không có lượt phối hợp nào" />;
  return (
    <div className="space-y-2">
      {turns.map((t) => (
        <TheSos key={t.attemptId} t={t} cot1={cot1} onGoAcademic={onGoAcademic} onChanged={onChanged} />
      ))}
    </div>
  );
}

/**
 * MỘT LƯỢT SOS — MỘT THẺ (prototype v3): đầu thẻ 3 cột bấm mở/đóng (`MT2 · SOS 2` + kỹ năng · `2/3 việc hoàn thành`
 * + dòng phụ · nhãn trạng thái); thân thẻ là danh sách việc. Thẻ chưa xong mở sẵn, thẻ xong đóng.
 *
 * Đầu thẻ là `div role="button"` chứ không phải `<button>`: cột 2 có một nút link bên trong (đổi sang tab Học thuật),
 * nút lồng trong nút là HTML sai. Nút link gọi `stopPropagation` để không làm thẻ mở/đóng.
 */
export function TheSos({ t, cot1 = 'luot', onGoAcademic, onChanged }: {
  t: CoordTurn;
  /** 'luot' (hồ sơ HV): cột 1 = `MT2 · SOS 2` + kỹ năng. 'hocVien' (hồ sơ lớp): cột 1 = tên HV + `MT2 · SOS 2 · kỹ năng`. */
  cot1?: 'luot' | 'hocVien';
  onGoAcademic?: () => void;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(!t.summary.complete);
  const [adding, setAdding] = useState(false);
  const mtSos = t.nhanDot
    ? `${t.nhanDot}${t.ketQua ? ` · ${t.ketQua.chinh}` : ''}`
    : `MT${t.attemptNo}${t.sosLevel !== null ? ` · ${sosLabel(t.sosLevel)}` : ''}`;
  const kyNang = t.skillLabels.length > 0 ? t.skillLabels.join(' + ') : '—';

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
      <div role="button" tabIndex={0} aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
        className="grid gap-x-3 gap-y-1 items-center px-3 py-2.5 cursor-pointer row-hover grid-cols-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]">
        <div className="col-span-2 md:col-span-1 min-w-0">
          <span className="block text-sm font-semibold text-slate-100">{cot1 === 'luot' ? mtSos : t.studentName}</span>
          <span className="block text-xs text-slate-500">
            {cot1 === 'luot' ? kyNang : `${mtSos}${t.skillLabels.length > 0 ? ` · ${t.skillLabels.join(' + ')}` : ''}`}
          </span>
        </div>
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-slate-100">{t.summary.label} việc hoàn thành</span>
          {cot1 === 'luot' ? (
            onGoAcademic ? (
              <button type="button" className="link text-xs appearance-none bg-transparent border-0 p-0 cursor-pointer text-left"
                onClick={(e) => { e.stopPropagation(); onGoAcademic(); }}>
                Hỗ trợ học thuật xem ở tab Học thuật
              </button>
            ) : <span className="block text-xs text-slate-500">Hỗ trợ học thuật xem ở tab Học thuật</span>
          ) : <span className="block text-xs text-slate-500">Học thuật theo dõi ở bảng kỹ năng</span>}
        </div>
        <div className="justify-self-end">
          <NhanTrangThai t={t.summary.complete ? 'xong' : 'dang-lam'} />
        </div>
      </div>

      {open && (
        <div className="border-t px-3 pb-3" style={{ borderColor: 'var(--line)' }}>
          {t.actions.map((a) => (
            <ActionRow key={a.id} a={a} canAct={t.canAct} onChanged={onChanged} />
          ))}
          {/* PR-S5F-b: lượt Giữa khoá lớp thường (`nhanDot`) không thêm việc — máy chủ chỉ nhận ở lượt Mock FT có SOS. */}
          {t.canAct && !adding && !t.nhanDot && (
            <button type="button" className="btn btn-sm mt-2" onClick={() => setAdding(true)}>+ Thêm việc</button>
          )}
          {adding && (
            <div className="mt-2">
              <AddCoordinationForm attemptId={t.attemptId} existing={t.actions.map((a) => a.kind)}
                onClose={() => setAdding(false)} onChanged={onChanged} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Một việc phối hợp — một dòng lưới `tên + dòng phụ · trạng thái/nút`; form Xác nhận/Bỏ mở ngay dưới, rộng hết thẻ. */
function ActionRow({ a, canAct, onChanged }: { a: CoordAction; canAct: boolean; onChanged?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const dongPhu = a.status === 'done'
    ? `${fmtDate(a.performedOn)}${a.performerName ? ` · ${a.performerName}` : ''}`
    /* PR-NEN: nhãn cột phải đã nói "Đã huỷ" — dòng phụ chỉ còn lý do, không lặp. */
    : a.status === 'removed' ? (a.removeReasonLabel ?? '')
    /* Người không có quyền: cột phải đã là nhãn `Cần làm` — không lặp ở dòng phụ (rà soát 22/09). */
    : canAct ? 'Cần xử lý' : '';

  return (
    <div className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-2 items-start">
        <span className="min-w-0 break-words">
          <span className="block text-sm text-slate-200">{laMeetingCx(a.kind) ? nhanMeetingSauMock(a.kind) : a.name}</span>
          {laMeetingCx(a.kind) && <span className="block text-xs text-slate-500 mt-0.5">Việc phối hợp sau Mock — không phải xử lý vi phạm, không cần QL duyệt</span>}
          {dongPhu && <span className="block text-xs text-slate-500 mt-0.5">{dongPhu}</span>}
          {a.noiDung && a.noiDung.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs text-slate-400">{a.status === 'done' ? 'Nội dung đã báo TVV' : 'Nội dung gửi TVV'} ({a.noiDung.length})</summary>
              {a.noiDungLaHienTai && <p className="m-0 mt-1 text-xs text-slate-500">Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại</p>}
              <ol className="m-0 mt-1 space-y-1 pl-4 text-xs text-slate-300">
                {a.noiDung.map((x, i) => <li key={i}>{x}</li>)}
              </ol>
            </details>
          )}
        </span>
        <span className="flex flex-wrap gap-1.5 justify-end">
          {/* Việc chờ mà người xem làm được: hai nút đứng chỗ nhãn (dòng phụ đã nói "Cần xử lý"); còn lại là nhãn 6 chữ chung. */}
          {a.status === 'pending' && canAct ? (
            <>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => setConfirming(!confirming)}>{a.kind === 'bao_ph_tvv' ? 'Đánh dấu đã làm' : 'Xác nhận'}</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setRemoving(!removing)}>Bỏ ▾</button>
            </>
          ) : <NhanTrangThai t={trangThaiPhoiHop(a.status)} />}
        </span>
      </div>
      {confirming && <ConfirmCoordinationForm actionId={a.id} onClose={() => setConfirming(false)} onChanged={onChanged} />}
      {removing && <RemoveCoordinationForm actionId={a.id} onClose={() => setRemoving(false)} onChanged={onChanged} />}
    </div>
  );
}

function ConfirmCoordinationForm({ actionId, onClose, onChanged }: {
  actionId: number; onClose: () => void; onChanged?: () => void;
}) {
  const toast = useToast();
  const { homNay: today } = useNgayNghiepVu();
  const [performedOn, setPerformedOn] = useState(today);
  const [note, setNote] = useState('');
  /* PR-NEN T14 (M11): mặc định "Tôi" — máy chủ tự lấy người đang đăng nhập khi không gửi tên (`confirmCoordination`). */
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [busy, setBusy] = useState(false);
  const loiNguoi = nguoiThieu(nguoi, false);

  const save = async () => {
    if (loiNguoi) return;
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${actionId}/confirm`, {
        performedOn, note: note.trim() || undefined,
        performerName: !nguoi || nguoi.kieu === 'toi' ? undefined : nguoi.ten.trim(),
      });
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', 'Đã lưu');
      onChanged?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="mt-2 rounded-lg p-2.5 space-y-2" style={{ background: 'var(--surface-2)' }}>
      <Hang2>
        <Truong nhan="Ngày thực hiện" batBuoc>
          <span className="block w-[11.5rem]"><ONgay kieu="ngay" value={performedOn} onChange={setPerformedOn} toiDa={today} /></span>
        </Truong>
        <Truong nhan="Người thực hiện" as="div" loi={loiNguoi}>
          <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} />
        </Truong>
      </Hang2>
      <textarea className="field w-full" rows={2} placeholder="Ghi chú (tuỳ chọn)" value={note}
        onChange={(e) => setNote(e.target.value)} />
      <BangChung ownerType="sos_coordination_action" ownerId={actionId} canEdit tieuDe="" />
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Đóng</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !performedOn || !!loiNguoi} title={loiNguoi ?? undefined} onClick={save}>Lưu</button>
      </div>
    </div>
  );
}

function RemoveCoordinationForm({ actionId, onClose, onChanged }: {
  actionId: number; onClose: () => void; onChanged?: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const missing = !reason ? 'Chọn một lý do.' : null;
  const loiGhiRo = reasonNeedsText(reason) ? kiemGhiRoKhac(text) : null;

  const save = async () => {
    if (missing || loiGhiRo) return;
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${actionId}/remove`, { reasonCode: reason, reasonText: reasonNeedsText(reason) ? text.trim() : undefined });
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', 'Đã bỏ việc này');
      onChanged?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="mt-2 rounded-lg p-2.5 space-y-2" style={{ background: 'var(--surface-2)' }}>
      <div className="flex flex-wrap gap-1.5">
        {COORDINATION_USER_REMOVE_REASONS.map((r) => (
          <NutChon key={r} nho chon={reason === r} onClick={() => setReason(r)}>
            {COORDINATION_REMOVE_REASON_LABEL[r]}
          </NutChon>
        ))}
      </div>
      <OKhac hien={reasonNeedsText(reason)} value={text} onChange={setText} goiY="Ví dụ: Gia đình xin dời sang tuần sau" loi={loiGhiRo} />
      {missing && <p className="text-xs text-amber-200 m-0">{missing}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Đóng</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!missing || !!loiGhiRo} title={missing ?? loiGhiRo ?? undefined} onClick={save}>Bỏ việc này</button>
      </div>
    </div>
  );
}

function AddCoordinationForm({ attemptId, existing, onClose, onChanged }: {
  attemptId: number; existing: string[]; onClose: () => void; onChanged?: () => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [busy, setBusy] = useState(false);

  /* K2-3: ràng buộc nói TRƯỚC khi bấm — nút mờ + câu thiếu gì, không báo lỗi đỏ sau khi bấm. */
  const missing = !kind ? 'Chọn loại việc.' : null;
  const loiGhiRo = kind === 'other' ? kiemGhiRoKhac(customName) : null;

  const save = async () => {
    if (missing || loiGhiRo) return;
    setBusy(true);
    try {
      await api.post(`/attempts/${attemptId}/phoi-hop-sos`, { kind, customName: kind === 'other' ? customName.trim() : undefined });
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', 'Đã thêm việc');
      onChanged?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg p-2.5 space-y-2" style={{ background: 'var(--surface-2)' }}>
      <div className="flex flex-wrap gap-1.5">
        {COORDINATION_KINDS.map((k) => (
          <NutChon key={k} nho chon={kind === k} disabled={k !== 'other' && existing.includes(k)} onClick={() => setKind(k)}>
            {laMeetingCx(k) ? nhanMeetingSauMock(k) : COORDINATION_KIND_LABEL[k as CoordinationKind]}
          </NutChon>
        ))}
      </div>
      <OKhac hien={kind === 'other'} value={customName} onChange={setCustomName} nhan="Tên việc" goiY="Ví dụ: Gặp Tutor sau giờ học" loi={loiGhiRo} />
      {missing && <p className="text-xs text-amber-200 m-0">{missing}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Đóng</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!missing || !!loiGhiRo} title={missing ?? loiGhiRo ?? undefined} onClick={save}>Thêm</button>
      </div>
    </div>
  );
}
