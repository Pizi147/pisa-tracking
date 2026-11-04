import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Empty, NhanTrangThai, NutChon, Skeleton } from '../../ui/ui.tsx';
import { BangChung } from '../../ui/BangChung.tsx';
import {
  COORDINATION_KINDS, COORDINATION_KIND_LABEL, COORDINATION_USER_REMOVE_REASONS, COORDINATION_REMOVE_REASON_LABEL,
  type CoordinationKind, type NguoiChon, GHI_CHU_MEETING_TOI_THIEU, kiemGhiRoKhac, laMeetingCx, nguoiThieu, reasonNeedsText, trangThaiPhoiHop,
} from '@shared/domain/index.ts';
import { fmtDate, sosLabel } from '../../lib/format.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { ONgay } from '../../ui/ONgay.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Hang2, Truong } from '../../ui/KhungPanel.tsx';
import { CanLam, NutChu } from '../../ui/KhuonViec.tsx';
import { Han } from '../../ui/Han.tsx';
import { DongHan } from '../../ui/DongHan.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { MuiTenGap } from './NhanViPham.tsx';
import { BadgeViec } from './khoiYThuc.tsx';

type CoordAction = {
  id: number; kind: string; kindLabel: string; customName: string | null; name: string;
  preset: boolean; status: 'pending' | 'done' | 'removed'; statusLabel: string;
  performedOn: string | null; performerName: string | null; note: string | null;
  removeReasonCode: string | null; removeReasonLabel: string | null; attachmentCount: number;
  /** OV-12h: hạn xác nhận (meeting CX / GĐCN: ngày tạo + 5) — null với việc khác. */
  han?: string | null;
  /** HAN-BAO-PH (N34 ②): meeting CX — hạn mặc định (tạo + 5) · hạn người dùng chọn (null = mặc định). */
  hanMacDinh?: string | null; hanChon?: string | null;
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
  kyNangNgan?: string[];
  actions: CoordAction[]; canAct: boolean;
};

/**
 * DANH SÁCH `Phối hợp SOS` (§7.2/§7.3, prototype v3 — PR-HV) — dùng chung cho tab lớp (`cot1="hocVien"`: cột 1 là tên
 * học viên) và tab hồ sơ học viên (`cot1="luot"`: cột 1 là `MT2 · SOS 2`). Mỗi lượt một thẻ `TheSos`.
 */
/** `gon`: hiện trước bấy nhiêu lượt (chưa xong xếp trước theo máy chủ), còn lại "Hiện thêm n HV". */
const GON_TOI_DA = 4;

export function PhoiHopSosSection({ turns, loading, cot1 = 'hocVien', onGoAcademic, onChanged, gon = false, xanh = false }: {
  turns: CoordTurn[] | null; loading?: boolean;
  cot1?: 'luot' | 'hocVien';
  /** UI-Y-THUC-LOP: hồ sơ lớp — mọi thẻ đóng sẵn (một dòng một em, bấm mở việc); mặc định thẻ chưa xong mở sẵn. */
  gon?: boolean;
  /** UI-Y-THUC-HV: khung xanh nhạt (nhóm học thuật, mockup `.phoi-hop`) mà thẻ vẫn mở sẵn như cũ. */
  xanh?: boolean;
  onGoAcademic?: () => void; onChanged?: () => void;
}) {
  const [het, setHet] = useState(false);
  if (loading || !turns) return <Skeleton rows={3} />;
  /* PR-S5F-b: tab dùng chung FT và lớp thường — màn rỗng không nói "SOS" (lớp thường không có SOS). */
  if (!turns.length) return xanh ? <p className="m-0 text-[13px] text-dim">{t('Không có lượt phối hợp nào')}</p> : <Empty title={t('Không có lượt phối hợp nào')} />;
  /* `gon`: lượt chưa xong lên trước (máy chủ xếp theo tên) — "Hiện thêm" không giấu việc còn mở. */
  const xep = gon ? [...turns].sort((a, b) => Number(a.summary.complete) - Number(b.summary.complete)) : turns;
  const hien = gon && !het ? xep.slice(0, GON_TOI_DA) : xep;
  return (
    <div className="space-y-2">
      {hien.map((t) => (
        <TheSos key={t.attemptId} t={t} cot1={cot1} onGoAcademic={onGoAcademic} onChanged={onChanged} gon={gon} xanh={xanh} />
      ))}
      {gon && turns.length > GON_TOI_DA && (
        <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-[13px] font-semibold appearance-none sm:min-h-0" onClick={() => setHet((v) => !v)}>
          {het ? t('Thu gọn') : t('Hiện thêm {n} HV', { n: turns.length - GON_TOI_DA })}
        </button>
      )}
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
export function TheSos({ t: luot, cot1 = 'luot', onGoAcademic, onChanged, gon = false, xanh = false }: {
  t: CoordTurn; gon?: boolean; xanh?: boolean;
  /** 'luot' (hồ sơ HV): cột 1 = `MT2 · SOS 2` + kỹ năng. 'hocVien' (hồ sơ lớp): cột 1 = tên HV + `MT2 · SOS 2 · kỹ năng`. */
  cot1?: 'luot' | 'hocVien';
  onGoAcademic?: () => void;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(!gon && !luot.summary.complete);
  const [adding, setAdding] = useState(false);
  const mtSos = luot.nhanDot
    ? `${luot.nhanDot}${luot.ketQua ? ` · ${luot.ketQua.chinh}` : ''}`
    : `MT${luot.attemptNo}${luot.sosLevel !== null ? ` · ${sosLabel(luot.sosLevel)}` : ''}`;
  const kyNang = luot.skillLabels.length > 0 ? luot.skillLabels.join(' + ') : '—';

  if (xanh) {
    /* UI-3 / UI-2 (mockup U10 K8): phân đoạn Phối hợp SOS hồ sơ HV và hồ sơ lớp — đầu lượt một dòng (lớp: tên em trước), việc là hàng 3 cột (tên · hạn · nút). */
    return (
      <div className="border-t pt-3 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center gap-2.5">
          {cot1 === 'hocVien' && (
            <Link to={`/hoc-vien/${luot.studentId}?tab=y-thuc&sub=phoi-hop`} className="text-[15px] font-semibold text-slate-100 no-underline hover:text-[color:var(--accent)] hover:underline max-sm:flex max-sm:min-h-[44px] max-sm:items-center">{luot.studentName}</Link>
          )}
          {!luot.nhanDot && luot.sosLevel !== null
            ? <ChipSos muc={luot.sosLevel} kyNang={luot.kyNangNgan} dot={`MT${luot.attemptNo}`} ten={luot.studentName} tinh />
            : <b className="text-[15px] font-semibold text-slate-100">{mtSos}</b>}
          {!luot.nhanDot && luot.sosLevel !== null && <span className="inline-flex h-[22px] items-center rounded-md px-2 text-xs font-semibold text-slate-400 surface-2">MT{luot.attemptNo}</span>}
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <BadgeViec tong={luot.summary.complete ? 'xong' : 'dang'}>{t('{label} việc xong', { label: luot.summary.label })}</BadgeViec>
            {luot.summary.complete && <button type="button" className="link inline-flex min-h-[44px] items-center gap-1 appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" aria-expanded={open} onClick={() => setOpen((v) => !v)}><MuiTenGap mo={open} />{t('Việc')}</button>}
            {onGoAcademic && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={onGoAcademic}>{t('Học thuật ›')}</button>}
            {luot.canAct && !adding && !luot.nhanDot && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setAdding(true)}>{t('+ Thêm việc')}</button>}
          </span>
        </div>
        <div className="mt-1">
          {open && luot.actions.map((a) => <ActionRow key={a.id} a={a} canAct={luot.canAct} onChanged={onChanged} />)}
          {adding && <div className="mt-2"><AddCoordinationForm attemptId={luot.attemptId} existing={luot.actions.map((a) => a.kind)} onClose={() => setAdding(false)} onChanged={onChanged} /></div>}
        </div>
      </div>
    );
  }
  return (
    /* UI-Y-THUC-LOP (`gon`): mỗi em một khung xanh nhạt (mockup `.phoi-hop`) — nhóm học thuật, khác hẳn hàng vi phạm. */
    <div className={gon || xanh ? 'rounded-[10px] border border-doing-line bg-doing-bg' : 'rounded-lg border'} style={gon || xanh ? undefined : { borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
      <div role="button" tabIndex={0} aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
        className={`grid gap-x-3 gap-y-1 items-center cursor-pointer bam grid-cols-2 ${gon ? 'px-3.5 py-3' : 'px-3 py-2.5'} md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]`}>
        <div className="col-span-2 md:col-span-1 min-w-0">
          <span className={`flex items-center gap-1 font-semibold text-slate-100 ${gon ? 'text-[15px]' : 'text-sm'}`}>{gon && <MuiTenGap mo={open} />}{cot1 === 'luot' ? mtSos : luot.studentName}</span>
          {gon && !luot.nhanDot && luot.sosLevel !== null ? (
            /* Mockup `.phoi-hop`: chip "SOS 2 · R, W" dưới tên; chip tĩnh — đầu thẻ đã là nút mở. */
            <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <ChipSos muc={luot.sosLevel} kyNang={luot.kyNangNgan} dot={`MT${luot.attemptNo}`} ten={luot.studentName} tinh />MT{luot.attemptNo}
            </span>
          ) : (
            <span className={`block text-xs text-slate-500 ${gon ? 'truncate' : ''}`} title={gon ? kyNang : undefined}>
              {cot1 === 'luot' ? kyNang : gon ? mtSos : `${mtSos}${luot.skillLabels.length > 0 ? ` · ${luot.skillLabels.join(' + ')}` : ''}`}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <span className={gon ? 'block text-sm text-dim' : 'block text-sm font-semibold text-slate-100'}>{t('{label} việc hoàn thành', { label: luot.summary.label })}</span>
          {cot1 === 'luot' ? (
            onGoAcademic ? (
              <button type="button" className="link min-h-[44px] text-xs appearance-none bg-transparent border-0 p-0 cursor-pointer text-left sm:min-h-0"
                onClick={(e) => { e.stopPropagation(); onGoAcademic(); }}>
                {t('Hỗ trợ học thuật xem ở tab Học thuật')}
              </button>
            ) : <span className="block text-xs text-slate-500">{t('Hỗ trợ học thuật xem ở tab Học thuật')}</span>
          ) : gon ? (
            /* Việc còn mở ngay trên đầu thẻ — không phải mở thẻ mới biết còn gì. */
            luot.actions.some((a) => a.status === 'pending')
              ? (() => { const con = t('Còn: {viec}', { viec: luot.actions.filter((a) => a.status === 'pending').map((a) => dich(a.name)).join(' · ') });
                return <span className="block line-clamp-2 text-xs text-dim md:truncate" title={con}>{con}</span>; })() : null
          ) : <span className="block text-xs text-slate-500">{t('Học thuật theo dõi ở bảng kỹ năng')}</span>}
        </div>
        <div className="justify-self-end">
          <NhanTrangThai t={luot.summary.complete ? 'xong' : 'dang-lam'} />
        </div>
      </div>

      {open && (
        <div className="border-t px-3 pb-3" style={{ borderColor: 'var(--line)' }}>
          {luot.actions.map((a) => (
            <ActionRow key={a.id} a={a} canAct={luot.canAct} onChanged={onChanged} />
          ))}
          {/* PR-S5F-b: lượt Giữa khoá lớp thường (`nhanDot`) không thêm việc — máy chủ chỉ nhận ở lượt Mock FT có SOS. */}
          {luot.canAct && !adding && !luot.nhanDot && (
            <button type="button" className="btn btn-sm mt-2 min-h-[44px] sm:min-h-0" onClick={() => setAdding(true)}>{t('+ Thêm việc')}</button>
          )}
          {adding && (
            <div className="mt-2">
              <AddCoordinationForm attemptId={luot.attemptId} existing={luot.actions.map((a) => a.kind)}
                onClose={() => setAdding(false)} onChanged={onChanged} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Một việc phối hợp — một dòng lưới `tên + dòng phụ · trạng thái/nút`; form Xác nhận/Bỏ mở ngay dưới, rộng hết thẻ.
 * OV-7a: việc đã xong → `Sửa` (form Xác nhận điền sẵn) · `Đưa lại Cần xử lý`; việc người dùng đã bỏ → `Khôi phục` (việc hệ thống bỏ theo điểm thì không).
 */
function ActionRow({ a, canAct, onChanged }: { a: CoordAction; canAct: boolean; onChanged?: () => void }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const khoiPhucDuoc = a.status === 'removed' && (COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(a.removeReasonCode ?? '');
  const moLai = async () => {
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${a.id}/mo-lai`);
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', a.status === 'done' ? t('Đã đưa lại Cần xử lý') : t('Đã khôi phục'));
      onChanged?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const dongPhu = a.status === 'done'
    ? `${fmtDate(a.performedOn)}${a.performerName ? ` · ${a.performerName}` : ''}`
    /* PR-NEN: nhãn cột phải đã nói "Đã huỷ" — dòng phụ chỉ còn lý do, không lặp. */
    : a.status === 'removed' ? (a.removeReasonLabel ?? '')
    /* Việc chờ: nút / nhãn ở cột phải đã nói trạng thái — không lặp "Cần xử lý" (UI-3, "thừa thì đừng thêm chữ"). */
    : '';
  /* Cột hạn (mockup K8): meeting CX có hạn (Sửa hạn cho GVCN / QL); việc khác "không hạn" (P10). */
  const hanO = a.status !== 'pending' ? null : a.han ? (canAct && a.hanMacDinh
    ? <DongHan gon han={a.han} hanMacDinh={a.hanMacDinh} hanChon={a.hanChon ?? null} suaDuoc onTaiLai={() => onChanged?.()}
        onLuu={async (han, hanCu) => { await api.post(`/phoi-hop-sos/${a.id}/han`, { han, hanCu }); toast.push('ok', t('Đã lưu hạn')); invalidate('/classes'); invalidate('/students'); invalidate('/my-work'); onChanged?.(); }} />
    : <Han loai="phoi-hop" han={a.han} />) : <span className="text-[13px] text-slate-500">{t('không hạn')}</span>;

  return (
    <div className="border-t first:border-t-0" style={{ borderColor: 'var(--line)' }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 [@container(min-width:760px)]:grid-cols-[minmax(0,1fr)_minmax(0,330px)_auto]">
        <span className="col-start-1 row-start-1 min-w-0 break-words">
          <span className="block text-sm font-semibold text-slate-100">{laMeetingCx(a.kind) ? COORDINATION_KIND_LABEL[a.kind as CoordinationKind] : a.name}</span>
          {dongPhu && <span className="block text-xs text-slate-500 mt-0.5">{dongPhu}</span>}
          {a.noiDung && a.noiDung.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs text-slate-400">{a.status === 'done' ? t('Nội dung đã báo TVV') : t('Nội dung gửi TVV')} ({a.noiDung.length})</summary>
              {a.noiDungLaHienTai && <p className="m-0 mt-1 text-xs text-slate-500">{t('Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại')}</p>}
              <ol className="m-0 mt-1 space-y-1 pl-4 text-xs text-slate-300">
                {a.noiDung.map((x, i) => <li key={i}>{x}</li>)}
              </ol>
            </details>
          )}
        </span>
        {hanO && <span className="col-span-2 row-start-2 [@container(min-width:760px)]:col-span-1 [@container(min-width:760px)]:col-start-2 [@container(min-width:760px)]:row-start-1">{hanO}</span>}
        <span className="col-start-2 row-start-1 flex flex-wrap justify-end gap-1.5 [@container(min-width:760px)]:col-start-3">
          {/* Việc chờ mà người xem làm được: Xác nhận + ⋯ (Bỏ việc…); còn lại là nhãn 6 chữ chung. */}
          {a.status === 'pending' && canAct ? (
            <>
              <button type="button" className="btn btn-sm max-sm:min-h-[44px] btn-primary" onClick={() => setConfirming(!confirming)}>{a.kind === 'bao_ph_tvv' ? t('Đánh dấu đã làm') : t('Xác nhận')}</button>
              <button type="button" className="btn btn-sm max-sm:min-h-[44px] max-sm:min-w-[44px]" aria-label={t('Bỏ việc…')} aria-expanded={removing} onClick={() => setRemoving(!removing)}>⋯</button>
            </>
          ) : <NhanTrangThai t={trangThaiPhoiHop(a.status)} />}
        </span>
      </div>
      {/* Thao tác sửa sai nằm DƯỚI tên việc (không chiếm cột nhãn) — màn 375 tên việc không bị ép hẹp. */}
      {canAct && (a.status === 'done' || khoiPhucDuoc) && (
        <div className="-mt-1 flex flex-wrap gap-1.5 pb-2">
          {a.status === 'done' && <>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-expanded={confirming} onClick={() => setConfirming(!confirming)}>{t('Sửa')}</button>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void moLai()}>{t('Đưa lại Cần xử lý')}</button>
          </>}
          {khoiPhucDuoc && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void moLai()}>{t('Khôi phục')}</button>}
        </div>
      )}
      {confirming && <ConfirmCoordinationForm a={a} onClose={() => setConfirming(false)} onChanged={onChanged} />}
      {removing && <RemoveCoordinationForm actionId={a.id} onClose={() => setRemoving(false)} onChanged={onChanged} />}
    </div>
  );
}

/** Xác nhận đã xong — OV-7a: cùng form để Sửa việc đã xong (điền sẵn ngày / người / ghi chú; lưu lại thì Báo PH chụp lại nội dung). */
function ConfirmCoordinationForm({ a, onClose, onChanged }: {
  a: CoordAction; onClose: () => void; onChanged?: () => void;
}) {
  const actionId = a.id;
  const toast = useToast();
  const { homNay: today } = useNgayNghiepVu();
  const [performedOn, setPerformedOn] = useState(a.performedOn ?? today);
  const [note, setNote] = useState(a.note ?? '');
  /* PR-NEN T14 (M11): mặc định "Tôi" — máy chủ tự lấy người đang đăng nhập khi không gửi tên (`confirmCoordination`). */
  const [nguoi, setNguoi] = useState<NguoiChon | null>(a.performerName ? { kieu: 'ngoai', ten: a.performerName } : { kieu: 'toi' });
  const [busy, setBusy] = useState(false);
  const loiNguoi = nguoiThieu(nguoi, false);
  /* OV-12h: meeting CX / GĐCN — Ghi chú bắt buộc ≥ 10 ký tự (máy chủ kiểm cùng số). */
  const canGhiChu = laMeetingCx(a.kind) ? GHI_CHU_MEETING_TOI_THIEU : 0;
  const [daBam, setDaBam] = useState(false);
  const loiGhiChu = canGhiChu && note.trim().length < canGhiChu ? t('Ít nhất {canGhiChu} ký tự', { canGhiChu }) : null;

  const save = async () => {
    setDaBam(true);
    if (loiNguoi || loiGhiChu) return;
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${actionId}/confirm`, {
        performedOn, note: note.trim() || undefined,
        performerName: !nguoi || nguoi.kieu === 'toi' ? undefined : nguoi.ten.trim(),
      });
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', t('Đã lưu'));
      onChanged?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  /* OV-12e (mockup v3 §7): form xác nhận là khối Cần làm (khối duy nhất có màu) — đối tượng · Ngày * · Người * · Ghi chú * · Tệp · MỘT nút chính. */
  const meeting = laMeetingCx(a.kind);
  return (
    <div className="mb-2 mt-1"><CanLam>
      {meeting && <span className="text-[15px] font-bold text-slate-100">{a.kind === 'cx_meeting_family' ? t('CX / GĐCN gặp HV và PH') : t('CX / GĐCN gặp HV')}</span>}
      <Hang2>
        <Truong nhan={meeting ? t('Ngày') : t('Ngày thực hiện')} batBuoc>
          <span className="block w-[11.5rem]"><ONgay kieu="ngay" value={performedOn} onChange={setPerformedOn} toiDa={today} /></span>
        </Truong>
        <Truong nhan={meeting ? t('Người') : t('Người thực hiện')} batBuoc={meeting} as="div" loi={loiNguoi}>
          <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} />
        </Truong>
      </Hang2>
      {canGhiChu ? (
        <Truong nhan={t('Ghi chú')} batBuoc loi={daBam ? loiGhiChu : null} dem={{ co: note.trim().length, can: canGhiChu }}>
          <textarea className="field w-full" rows={2} placeholder={t('Kết quả buổi gặp: đã thống nhất gì với em / phụ huynh')} value={note}
            onChange={(e) => setNote(e.target.value)} aria-invalid={daBam && !!loiGhiChu} />
        </Truong>
      ) : (
        <textarea className="field w-full" rows={2} placeholder={t('Ghi chú (tuỳ chọn)')} value={note}
          onChange={(e) => setNote(e.target.value)} />
      )}
      <div>
        {meeting && <span className="mb-1 block text-[13px] font-semibold text-slate-300">{t('Tệp')}</span>}
        <BangChung ownerType="sos_coordination_action" ownerId={actionId} canEdit tieuDe="" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className="btn btn-primary min-h-[44px] px-4 font-bold sm:min-h-[40px]" disabled={busy || !performedOn || !!loiNguoi} title={loiNguoi ?? undefined} onClick={save}>
          {busy ? t('Đang lưu…') : meeting && a.status !== 'done' ? t('Xác nhận meeting') : t('Lưu')}
        </button>
        <NutChu mo onClick={onClose} disabled={busy}>{t('Đóng')}</NutChu>
      </div>
    </CanLam></div>
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
  const missing = !reason ? t('Chọn một lý do.') : null;
  const loiGhiRo = reasonNeedsText(reason) ? kiemGhiRoKhac(text) : null;

  const save = async () => {
    if (missing || loiGhiRo) return;
    setBusy(true);
    try {
      await api.post(`/phoi-hop-sos/${actionId}/remove`, { reasonCode: reason, reasonText: reasonNeedsText(reason) ? text.trim() : undefined });
      invalidate('/classes'); invalidate('/students');
      /* Q-RL2c: Hoàn tác 5 s = Khôi phục (mo-lai trả nguyên dòng trước khi bỏ). */
      toast.hoanTac(t('Đã bỏ việc này'), () => {
        api.post(`/phoi-hop-sos/${actionId}/mo-lai`).then(() => { invalidate('/classes'); invalidate('/students'); onChanged?.(); },
          (e: any) => toast.push('error', e?.message ?? t('Không lưu được')));
      }, { key: `phoi-hop-bo:${actionId}` });
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
      <OKhac hien={reasonNeedsText(reason)} value={text} onChange={setText} goiY={t('Ví dụ: Gia đình xin dời sang tuần sau')} loi={loiGhiRo} />
      {missing && <p className="text-xs text-amber-200 m-0">{missing}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>{t('Đóng')}</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!missing || !!loiGhiRo} title={missing ?? loiGhiRo ?? undefined} onClick={save}>{t('Bỏ việc này')}</button>
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
  const missing = !kind ? t('Chọn loại việc.') : null;
  const loiGhiRo = kind === 'other' ? kiemGhiRoKhac(customName) : null;

  const save = async () => {
    if (missing || loiGhiRo) return;
    setBusy(true);
    try {
      await api.post(`/attempts/${attemptId}/phoi-hop-sos`, { kind, customName: kind === 'other' ? customName.trim() : undefined });
      invalidate('/classes'); invalidate('/students');
      toast.push('ok', t('Đã thêm việc'));
      onChanged?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg p-2.5 space-y-2" style={{ background: 'var(--surface-2)' }}>
      <div className="flex flex-wrap gap-1.5">
        {COORDINATION_KINDS.map((k) => (
          <NutChon key={k} nho chon={kind === k} disabled={k !== 'other' && existing.includes(k)} onClick={() => setKind(k)}>
            {COORDINATION_KIND_LABEL[k as CoordinationKind]}
          </NutChon>
        ))}
      </div>
      <OKhac hien={kind === 'other'} value={customName} onChange={setCustomName} nhan={t('Tên việc')} goiY={t('Ví dụ: Gặp Tutor sau giờ học')} loi={loiGhiRo} />
      {missing && <p className="text-xs text-amber-200 m-0">{missing}</p>}
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>{t('Đóng')}</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!missing || !!loiGhiRo} title={missing ?? loiGhiRo ?? undefined} onClick={save}>{t('Thêm')}</button>
      </div>
    </div>
  );
}
