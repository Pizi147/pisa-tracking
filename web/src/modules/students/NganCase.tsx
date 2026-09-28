import { useEffect, useRef, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Level, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { caseStatusLabel, sosLabel, sosTone } from '../../lib/format.ts';
import { ThanCase, tenNganCase, type CaseDetail, type ViewCase } from '../cases/CasePanel.tsx';
import { GhiKetQuaPanel } from '../cases/CapNhatTuan.tsx';
import { HoanThanhCasePanel, ThemPaPanel, TraLoiDeXuatPanel } from '../cases/ThaoTacCase.tsx';

export type { ViewCase };

/**
 * NGĂN CASE dùng chung cho mọi lối vào (PR-UX3, N-4, G-8): Hồ sơ HV › Học thuật, Hành trình, thông báo (`?case=&pa=`), Việc cần làm
 * (`?viec=ghi-ket-qua`), bảng Case, Phân tích. MỘT panel — không chồng: view `case` (thân Case) và các view làm việc (Ghi kết quả ·
 * Thêm PA · Hoàn thành · Trả lời đề xuất) THAY nội dung cho nhau, có dòng "← Case Listening" để về. Tải `/cases/{id}` MỘT lần.
 *
 * Có `paId` (view `case`) thì sau khi tải xong dò `[data-pa-id="{paId}"]` (giao kèo với Hành trình) để cuộn tới và viền sáng 2 giây.
 * Có `viec` thì mở thẳng view đó; `viecBanDau` là bản đầy đủ khi nơi gọi đã có `ViewCase`.
 */
export function NganCase({ caseId, paId, viec, viecBanDau, hocVien, lop, onClose, onChanged }: {
  caseId: number; paId?: number | null;
  viec?: 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh' | 'tra-loi';
  viecBanDau?: ViewCase;
  hocVien?: string | null; lop?: string | null;
  onClose: () => void; onChanged?: () => void;
}) {
  const { ngan } = useNgayNghiepVu();
  const { data, error, reload } = useApi<CaseDetail>(`/cases/${caseId}`);
  const [view, setView] = useState<ViewCase>(() => viecBanDau ?? tuViec(viec, paId) ?? { loai: 'case' });
  /* Bấm "Hoàn thành Case" khi còn bị chặn: chân nói câu chặn (không phải ô nhập nên không đếm "n ô cần sửa"). */
  const lf = useLoiForm();
  const boxRef = useRef<HTMLDivElement>(null);

  const veCase = () => { setView({ loai: 'case' }); lf.datLai(); };
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

  if (view.loai === 'ghi-ket-qua' || view.loai === 'tra-loi') {
    const iv = (data.interventions ?? []).find((x: any) => x.id === view.paId);
    if (iv && view.loai === 'ghi-ket-qua') {
      return (
        <GhiKetQuaPanel key={iv.id} {...chung} onSaved={xong}
          pa={{
            id: iv.id, kind: iv.kind, description: iv.description ?? null, performer: iv.performer ?? null,
            performerUserId: iv.performerUserId ?? null,
            followupDue: iv.followupDue ?? null, actionDue: iv.actionDue ?? null, cycleNo: iv.cycleNo ?? null,
          }} />
      );
    }
    if (iv && view.loai === 'tra-loi') {
      return <TraLoiDeXuatPanel key={iv.id} {...chung} onSaved={xong} iv={{ id: iv.id, kind: iv.kind, description: iv.description ?? null }} />;
    }
  }
  if (view.loai === 'them-pa') {
    return <ThemPaPanel {...chung} caseId={caseId} studentId={data.student?.id} onSaved={xong} />;
  }
  if (view.loai === 'hoan-thanh') {
    return (
      <HoanThanhCasePanel {...chung} caseId={caseId} category={data.category} categoryLabel={data.categoryLabel} ratio={!!data.ratio}
        onSaved={xong} />
    );
  }

  /* ─────────────── view Case */
  const conPaChay = (data.interventions ?? []).some((i: any) => i.status === 'planned' || i.status === 'started');
  const canDong = data.status !== 'done';
  const chanHoanThanh = data.closeBlockers ?? [];
  return (
    <KhungPanel tieuDe={ten} hocVien={hv} lop={lop} onDong={onClose}
      ngCanh={(
        <span className="flex items-center gap-1.5">
          {data.systemCloseLabel
            ? <Nhan tone="muted" title={data.systemCloseLabel}>Hệ thống tự đóng · {data.systemCloseLabel}</Nhan>
            : <Nhan tone={data.status === 'done' ? 'done' : data.status === 'open' ? 'muted' : 'doing'}>{caseStatusLabel(data.status)}</Nhan>}
          {data.sosLevel !== null && canDong && <Level tone={sosTone(data.sosLevel)}>{sosLabel(data.sosLevel)}</Level>}
          <span className="truncate text-slate-400">
            mở {ngan(data.detectedAt)}{data.reportedBy ? ` · ${data.reportedBy} báo` : ''}
            {/* Hạn báo kết quả cả Case chỉ khi KHÔNG có PA chạy — có PA chạy thì hạn của PA đã nói (B-5, Q2). */}
            {canDong && !conPaChay && data.followUntil ? ` · hạn báo kết quả ${ngan(data.followUntil)}` : ''}
          </span>
        </span>
      )}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose },
        phu: data.viewer.canEdit
          ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setView({ loai: 'them-pa' })}>+ Thêm PA</button>
          : undefined,
        /* Bị chặn thì KHÔNG mờ: bấm hiện "Còn thiếu: …" (Q4). Không có quyền hoàn thành → không có nút chính, ⓘ ở khối Phương án nói quyền. */
        chinh: data.viewer.canEdit && canDong && data.viewer.canClose
          ? (
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0"
              onClick={() => (chanHoanThanh.length > 0 ? lf.bam() : setView({ loai: 'hoan-thanh' }))}>
              Hoàn thành Case
            </button>
          )
          : undefined,
        conThieu: lf.daBam && chanHoanThanh.length > 0 ? [{ nhan: 'Hoàn thành Case', lyDo: chanHoanThanh[0] }] : undefined,
      }}>
      <div ref={boxRef}>
        <ThanCase data={data} onViec={setView} />
      </div>
    </KhungPanel>
  );
}

function tuViec(viec: string | undefined, paId: number | null | undefined): ViewCase | null {
  if (viec === 'ghi-ket-qua' && paId) return { loai: 'ghi-ket-qua', paId };
  if (viec === 'tra-loi' && paId) return { loai: 'tra-loi', paId };
  if (viec === 'them-pa') return { loai: 'them-pa' };
  if (viec === 'hoan-thanh') return { loai: 'hoan-thanh' };
  return null;
}
