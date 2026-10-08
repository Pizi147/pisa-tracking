import { useEffect, useRef, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { caseStatusLabel } from '../../lib/format.ts';
import { outcomeLabelFor, tuanLich } from '@shared/domain/index.ts';
import { ThanCase, tenNganCase, type CaseDetail, type ViewCase } from '../cases/CasePanel.tsx';
import { GhiKetQuaPanel } from '../cases/CapNhatTuan.tsx';
import { HoanThanhCasePanel, SuaCasePanel, SuaPaPanel, ThemPaPanel } from '../cases/ThaoTacCase.tsx';
import { XacNhanCasePanel, XacNhanPaPanel, type PaQuyChe } from '../yThuc/CaseSosControls.tsx';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { NhanTamDung } from '../cases/SkillBoard.tsx';
import { KhoaNho } from '../cases/FormPa.tsx';

export type { ViewCase };

/**
 * NGĂN CASE dùng chung cho mọi lối vào (PR-UX3, N-4, G-8): Hồ sơ HV › Học thuật, Hành trình, thông báo (`?case=&pa=`), Việc cần làm
 * (`?viec=ghi-ket-qua`), bảng Case, Phân tích. MỘT panel — không chồng: view `case` (thân Case) và các view làm việc (Kết quả ·
 * Thêm PA · Hoàn thành; PR-DUYET bỏ Trả lời đề xuất — thẻ Chờ duyệt nhúng dưới PA) THAY nội dung cho nhau, có dòng "← Case Listening" để về. Tải `/cases/{id}` MỘT lần.
 *
 * Có `paId` (view `case`) thì sau khi tải xong dò `[data-pa-id="{paId}"]` (giao kèo với Hành trình) để cuộn tới và viền sáng 2 giây.
 * Có `viec` thì mở thẳng view đó; `viecBanDau` là bản đầy đủ khi nơi gọi đã có `ViewCase`.
 */
export function NganCase({ caseId, paId, viec, viecBanDau, hocVien, lop, onClose, onChanged }: {
  caseId: number; paId?: number | null;
  /** `tra-loi` cũ trên URL (trước PR-DUYET) → mở Ngăn Case thường: trả lời đề xuất nay là thẻ ngay dưới PA. */
  viec?: 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh' | 'tra-loi' | 'xac-nhan' | 'xac-nhan-pa';
  viecBanDau?: ViewCase;
  hocVien?: string | null; lop?: string | null;
  onClose: () => void; onChanged?: () => void;
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const { data, error, reload } = useApi<CaseDetail>(`/cases/${caseId}`);
  const [view, setView] = useState<ViewCase>(() => viecBanDau ?? tuViec(viec, paId) ?? { loai: 'case' });
  /* Bấm "Hoàn thành Case" khi còn bị chặn: chân nói câu chặn (không phải ô nhập nên không đếm "n ô cần sửa"). */
  const lf = useLoiForm();
  const toast = useToast();
  const [moLaiBusy, setMoLaiBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const veCase = () => { setView({ loai: 'case' }); lf.datLai(); };
  /* B1: mở từ thông báo / đường `?case=` (không kèm việc) khi Case chờ nguyên nhân → mở sẵn form Xác nhận Case. */
  const tuDong = useRef(!viec && !viecBanDau && !paId);
  useEffect(() => {
    if (!tuDong.current || !data) return;
    tuDong.current = false;
    if (data.trangThaiV4?.k === 'cho-nguyen-nhan' && data.viewer.canEdit) setView({ loai: 'xac-nhan' });
  }, [data]);
  const xong = () => { reload(); onChanged?.(); veCase(); };

  /* Cuộn tới PA (chỉ ở view Case) + viền sáng 2 giây. Thân đã render cùng lượt với `data`, nên không cần đợi. */
  useEffect(() => {
    if (!paId || !data || view.loai !== 'case') return;
    const el = boxRef.current?.querySelector<HTMLElement>(`[data-pa-id="${paId}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    el.style.outline = '2px solid var(--accent-strong)';
    el.style.outlineOffset = '2px';
    const t = setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 2000);
    return () => { clearTimeout(t); el.style.outline = ''; el.style.outlineOffset = ''; };
  }, [data, paId, view.loai]);

  if (error) {
    return (
      <KhungPanel tieuDe="Case" hocVien={hocVien} lop={lop} onDong={onClose}>
        <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
      </KhungPanel>
    );
  }
  if (!data) {
    return (
      <KhungPanel tieuDe="Case" hocVien={hocVien} lop={lop} onDong={onClose}>
        <div className="pt-3"><Skeleton rows={6} /></div>
      </KhungPanel>
    );
  }

  const ten = tenNganCase(data);
  const hv = hocVien ?? data.student?.name ?? null;
  const chung = { hocVien: hv, lop, quayLai: { nhan: ten, onClick: veCase }, onClose };

  if (view.loai === 'ghi-ket-qua') {
    const iv = (data.interventions ?? []).find((x: any) => x.id === view.paId);
    if (iv) {
      return (
        <GhiKetQuaPanel key={iv.id} {...chung} onSaved={xong} onThemPa={() => setView({ loai: 'them-pa' })}
          pa={{
            id: iv.id, kind: iv.kind, description: iv.description ?? null, performer: iv.performer ?? null,
            performerUserId: iv.performerUserId ?? null,
            actionDue: iv.actionDue ?? null, cycleNo: iv.cycleNo ?? null,
            batBuoc: !!iv.batBuoc, lanCuoi: !!iv.lanCuoi, mocChu: iv.mocChu ?? null, soBuoi: iv.soBuoi ?? null, daDay: iv.daDay ?? 0,
          }} />
      );
    }
  }
  /* PR-SOS (Q28-3): Xác nhận Case → chuyển thẳng sang Xác nhận PA của PA theo quy chế đầu tiên còn chờ; còn PA chờ khác (trượt lại) → mở tiếp. */
  const paCho = (data.interventions ?? []).filter((x: any) => x.awaitingConfirmation) as PaQuyChe[];
  if (view.loai === 'xac-nhan') {
    return (
      <XacNhanCasePanel {...chung} caseId={caseId} topic={data.topic ?? data.category} kyNang={data.categoryLabel ?? data.category ?? 'Kỹ năng'}
        ct={data.chuongTrinh ?? null} tenSos={data.tenSos ?? null} paQuyChe={paCho} boTro={data.boTro ?? null}
        onXong={() => { reload(); onChanged?.(); setView(paCho[0] ? { loai: 'xac-nhan-pa', paId: paCho[0].id } : { loai: 'case' }); }} />
    );
  }
  if (view.loai === 'xac-nhan-pa') {
    const pa = paCho.find((x) => x.id === view.paId);
    if (pa) {
      const tiep = paCho.find((x) => x.id !== pa.id);
      return (
        <XacNhanPaPanel key={pa.id} {...chung} pa={pa} studentId={data.student?.id}
          onXong={() => { reload(); onChanged?.(); setView(tiep ? { loai: 'xac-nhan-pa', paId: tiep.id } : { loai: 'case' }); }} />
      );
    }
  }
  if (view.loai === 'sua-pa') {
    const iv = (data.interventions ?? []).find((x: any) => x.id === view.paId);
    if (iv) {
      return <SuaPaPanel key={iv.id} {...chung} pa={iv} ketQua={data.followups ?? []} studentId={data.student?.id} onSaved={xong} />;
    }
  }
  if (view.loai === 'them-pa') {
    return <ThemPaPanel {...chung} caseId={caseId} studentId={data.student?.id} onSaved={xong}
      coPaBatBuoc={(data.interventions ?? []).some((x: any) => x.batBuoc && (x.status === 'planned' || x.status === 'started'))} />;
  }
  if (view.loai === 'sua' && data.viewer.coTheSua) {
    return (
      <SuaCasePanel {...chung} c={data} tenCase={(() => { const t = data.title ?? ten; const kn = data.categoryLabel; return kn && !t.startsWith(kn) ? `${kn} — ${t}` : t; })()} onSaved={xong}
        soPaChuaLam={(data.interventions ?? []).filter((x: any) => x.status === 'planned' || x.status === 'started').length}
        onDeleted={() => { onChanged?.(); onClose(); }} />
    );
  }
  if (view.loai === 'hoan-thanh') {
    return (
      <HoanThanhCasePanel {...chung} caseId={caseId} category={data.category} categoryLabel={data.categoryLabel} ratio={!!data.ratio}
        paGanNhat={(() => { const f = (data.followups ?? []).find((x: any) => x.outcome); return f ? outcomeLabelFor(f.outcome) : null; })()}
        onSaved={xong} />
    );
  }

  /* ─────────────── view Case */
  const conPaChay = (data.interventions ?? []).some((i: any) => i.status === 'planned' || i.status === 'started');
  const canDong = data.status !== 'done';
  const chanHoanThanh = data.closeBlockers ?? [];
  const ht = data.hoanThanh ?? null;
  /*
   * NÚT CHÍNH = VIỆC TIẾP (B2, K3-07, K3-09): Xác nhận nguyên nhân / Xác nhận PA / Ghi kết quả cuối {PA} / Ghi kết quả PA {PA quá hạn nhất} /
   * Hoàn thành Case. PA theo quy chế chưa khép → ẨN Hoàn thành, hiện dòng mờ nói khi nào hoàn thành được.
   */
  const v = data.viecTiep ?? null;
  /* PR-LUI-a2: Mở lại Case đã hoàn thành — Quản lý / Quản trị, một bấm, không lý do. */
  const moLai = async () => {
    setMoLaiBusy(true);
    try {
      await api.post(`/cases/${caseId}/mo-lai`);
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students');
      toast.push('ok', 'Đã mở lại Case');
      onChanged?.();
    } catch (e: any) { toast.push('error', e?.message ?? 'Không mở lại được'); } finally { setMoLaiBusy(false); }
  };
  const nutDau = data.viewer.coTheMoLai
    ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={moLaiBusy} onClick={() => void moLai()}>{moLaiBusy ? 'Đang mở lại…' : 'Mở lại'}</button>
    : canDong && data.viewer.coTheSua
      ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setView({ loai: 'sua' })}>Sửa</button>
      /* Rà #229: Case hệ thống đóng — không có Mở lại tay, nói đường mở. */
      : data.status === 'done' && data.systemCloseLabel && data.viewer.canApprove
        ? <span className="text-xs text-slate-400">Hệ thống đóng — Hoàn tác Kết thúc học để mở</span>
        : null;
  const nutChinh = (() => {
    if (!data.viewer.canEdit || !canDong) return undefined;
    const nut = (chu: string, lam: () => void, title?: string) => <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" title={title} onClick={lam}>{chu}</button>;
    if (v?.chu === 'Xác nhận nguyên nhân') return nut('Xác nhận nguyên nhân', () => setView({ loai: 'xac-nhan' }));
    if (v?.chu.startsWith('Xác nhận PA') && v.paId) return nut('Xác nhận PA', () => setView({ loai: 'xac-nhan-pa', paId: v.paId! }));
    if (v?.loaiHan === 'cap-nhat-pa' && v.paId) return nut(v.chu.startsWith('Kết quả cuối') ? 'Kết quả cuối' : 'Kết quả', () => setView({ loai: 'ghi-ket-qua', paId: v.paId! }), v.chu);  /* tên PA là chữ người dạy gõ (có thể dài) — chỉ để ở tooltip; nút nào cũng đã có "Kết quả" riêng ở thẻ PA */
    if (ht?.an || !data.viewer.canClose) return undefined;
    return (
      <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0"
        onClick={() => (chanHoanThanh.length > 0 ? lf.bam() : setView({ loai: 'hoan-thanh' }))}>
        Hoàn thành Case
      </button>
    );
  })();
  /* Điều kiện hoàn thành (PA quy chế chưa khép) một dòng có ổ khoá: "Hoàn thành được sau khi PA theo quy chế kết thúc · **mốc**". */
  const dk = canDong && ht?.an && ht.dong ? /^(.*?) \((.*)\)$/.exec(ht.dong) : null;
  return (
    <KhungPanel tieuDe={ten} hocVien={hv} lop={lop} onDong={onClose}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose },
        phu: data.viewer.canEdit && canDong && !(data.sos?.awaitingCause || data.sos?.choDuyetKhongTheoDoi)
          ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setView({ loai: 'them-pa' })}>+ Thêm PA</button>
          : undefined,
        chinh: nutChinh,
        conThieu: lf.daBam && chanHoanThanh.length > 0 ? [{ nhan: 'Hoàn thành Case', lyDo: chanHoanThanh[0] }] : undefined,
      }}>
      <div ref={boxRef}>
        {/* PR-PA (§8, mockup pa-dong-bo §9): dải đầu panel — trạng thái MỘT lần (chip) · "mở W2 OCT · X báo" · Sửa / Mở lại cùng hàng. */}
        <div className="-mx-4 flex flex-col gap-1.5 border-b px-4 pb-3 pt-2.5" style={{ borderColor: 'var(--line)', background: 'rgb(var(--phu-rgb) / 0.035)' }}>
          <div className="flex flex-wrap items-center gap-2">
            {data.systemCloseLabel
              ? <Nhan tone="muted" title={data.systemCloseLabel}>Hệ thống đóng · {data.systemCloseLabel}</Nhan>
              : data.trangThaiV4
                ? (data.tamDungTu && data.trangThaiV4.t === 'qua-han'
                  ? <><NhanTamDung tu={data.tamDungTu} /><span className="text-[12.5px] text-slate-300">{data.trangThaiV4.chu}</span></>
                  : <NhanTrangThai t={data.trangThaiV4.t} chu={data.trangThaiV4.chu} />)
                : <Nhan tone={data.status === 'done' ? 'done' : data.status === 'open' ? 'muted' : 'doing'}>{caseStatusLabel(data.status)}</Nhan>}
            <span className="min-w-0 text-[12.5px] text-slate-400">
              mở {tuanLich(data.detectedAt, homNay)}{data.reportedBy ? ` · ${data.reportedBy} báo` : ''}
              {/* Hạn báo kết quả cả Case chỉ khi KHÔNG có PA chạy — có PA chạy thì hạn của PA đã nói (B-5, Q2). */}
              {!data.tamDungTu && canDong && !conPaChay && data.followUntil ? ` · hạn báo kết quả ${ngan(data.followUntil)}` : ''}
            </span>
            <span className="flex-1" />
            {nutDau}
          </div>
          {canDong && ht?.an && ht.dong && (
            <p className="m-0 flex items-center gap-1.5 text-[12.5px] text-slate-300">
              <span className="text-slate-400"><KhoaNho /></span>
              <span>{dk ? <>{dk[1]} · <b className="font-semibold text-slate-100">{dk[2]}</b></> : ht.dong}</span>
            </p>
          )}
        </div>
        {/* S4-5: Quản lý mở Case đang chờ "Không cần theo dõi" thấy thẻ ngay dưới tiêu đề — duyệt / từ chối tại chỗ. */}
        {data.yeuCauCase && data.viewer.canApprove && (
          <div className="pt-3"><TheYeuCau gon yc={data.yeuCauCase} onXong={() => { reload(); onChanged?.(); }} /></div>
        )}
        <ThanCase data={data} onViec={setView} />
      </div>
    </KhungPanel>
  );
}
function tuViec(viec: string | undefined, paId: number | null | undefined): ViewCase | null {
  if (viec === 'ghi-ket-qua' && paId) return { loai: 'ghi-ket-qua', paId };
  if (viec === 'them-pa') return { loai: 'them-pa' };
  if (viec === 'hoan-thanh') return { loai: 'hoan-thanh' };
  if (viec === 'xac-nhan') return { loai: 'xac-nhan' };
  if (viec === 'xac-nhan-pa' && paId) return { loai: 'xac-nhan-pa', paId };
  return null;
}
