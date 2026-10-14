import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { caseStatusLabel } from '../../lib/format.ts';
import { INTERVENTION_KIND_LABEL, chuPhuHuynh, deadlineView, nhanQuaHan, type DeadlineKind, outcomeLabelFor, tuanLich } from '@shared/domain/index.ts';
import { useSession } from '../../lib/session.tsx';
import { ThanCase, tenNganCase, type CaseDetail, type ViewCase } from '../cases/CasePanel.tsx';
import { GhiKetQuaPanel, SuaKetQuaPanel } from '../cases/CapNhatTuan.tsx';
import { HoanThanhCasePanel, SuaCasePanel, SuaPaPanel, ThemPaPanel } from '../cases/ThaoTacCase.tsx';
import { DongNguyenNhan, GhiNhanXetPanel, XacNhanCasePanel, XacNhanPaPanel, ketQuaGanNhat, type PaQuyChe } from '../yThuc/CaseSosControls.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { BoiCanh, dauViec } from '../../ui/KhuonViec.tsx';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { NhanTamDung } from '../cases/SkillBoard.tsx';
import { KhoaNho } from '../cases/FormPa.tsx';
import { dich, t } from '@shared/i18n/index.ts';

export type { ViewCase };

/**
 * NGĂN CASE dùng chung cho mọi lối vào (PR-UX3, N-4, G-8): Hồ sơ HV › Học thuật, Hành trình, thông báo (`?case=&pa=`), Việc cần làm
 * (`?viec=ghi-ket-qua`), bảng Case, Phân tích. MỘT panel — không chồng: view `case` (thân Case) và các view làm việc (Kết quả ·
 * Thêm PA · Hoàn thành; PR-DUYET bỏ Trả lời đề xuất — thẻ Chờ duyệt nhúng dưới PA) THAY nội dung cho nhau, có dòng "← Case Listening" để về. Tải `/cases/{id}` MỘT lần.
 *
 * Có `paId` (view `case`) thì sau khi tải xong dò `[data-pa-id="{paId}"]` (giao kèo với Hành trình) để cuộn tới và viền sáng 2 giây.
 * Có `viec` thì mở thẳng view đó; `viecBanDau` là bản đầy đủ khi nơi gọi đã có `ViewCase`.
 */
export function NganCase({ caseId, paId, viec, viecBanDau, hocVien, lop, onClose, onChanged, veNguon }: {
  caseId: number; paId?: number | null;
  /** `tra-loi` cũ trên URL (trước PR-DUYET) → mở Ngăn Case thường: trả lời đề xuất nay là thẻ ngay dưới PA. */
  viec?: 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh' | 'tra-loi' | 'xac-nhan' | 'xac-nhan-pa' | 'ghi-nhan-xet';
  viecBanDau?: ViewCase;
  hocVien?: string | null; lop?: string | null;
  onClose: () => void; onChanged?: () => void;
  /** OV-12f / OV-12e: mở từ Panel một em hoặc panel số liệu — "← {tên em}" / "← Danh sách" thay "← Case …", làm xong về đúng nơi đó
   *  (không panel lồng panel). */
  veNguon?: { nhan: string; onClick: () => void };
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const vai = useSession().session?.roles ?? [];
  const { data, error, reload } = useApi<CaseDetail>(`/cases/${caseId}`);
  const [view, setView] = useState<ViewCase>(() => viecBanDau ?? tuViec(viec, paId) ?? { loai: 'case' });
  /* Bấm "Hoàn thành Case" khi còn bị chặn: chân nói câu chặn (không phải ô nhập nên không đếm "n ô cần sửa"). */
  const lf = useLoiForm();
  const toast = useToast();
  const [moLaiBusy, setMoLaiBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const veCase = () => { setView({ loai: 'case' }); lf.datLai(); };
  /* B1: mở từ thông báo / đường `?case=` (không kèm việc) — hoặc `viec=xac-nhan` từ hồ sơ — khi Case đang chờ → mở sẵn đúng khối: Progress chờ
     Xác nhận Case → Xác nhận Case; Case MT cũ bài chưa nhận xét → Ghi nhận xét (OV-12c). */
  const tuDong = useRef(!viecBanDau && !paId && (!viec || viec === 'xac-nhan'));
  useEffect(() => {
    if (!tuDong.current || !data) return;
    tuDong.current = false;
    if (data.trangThaiV4?.k === 'cho-nhan-xet' && data.viewer.canEdit) setView({ loai: 'ghi-nhan-xet' });
    else if (data.trangThaiV4?.k === 'cho-nguyen-nhan' && data.viewer.coTheXacNhanCase) setView({ loai: 'xac-nhan' });
  }, [data]);
  /* Làm xong một việc: về nơi mở (panel em / danh sách) nếu có, không thì về thân Case. */
  const veSau = () => (veNguon ? veNguon.onClick() : veCase());
  const xong = () => { reload(); onChanged?.(); veSau(); };

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
  const chung = { hocVien: hv, lop, quayLai: veNguon ?? { nhan: ten, onClick: veCase }, onClose };
  /* OV-12e: đầu + Bối cảnh panel v3 cho các việc của Case (Ghi kết quả · Thêm PA). */
  const em = data.student ? { id: data.student.id, ten: data.student.name } : null;
  const nguyenNhan: [string, ReactNode] = [t('Nguyên nhân'), (data.issues ?? []).length ? <DongNguyenNhan issues={data.issues ?? []} /> : null];

  if (view.loai === 'ghi-ket-qua') {
    const iv = (data.interventions ?? []).find((x: any) => x.id === view.paId);
    if (iv) {
      const truoc = (data.followups ?? []).find((f: any) => f.interventionId === iv.id && f.outcome);
      const tenLoai = dich(INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind);
      return (
        <GhiKetQuaPanel key={iv.id} {...chung} onSaved={xong} onThemPa={() => setView({ loai: 'them-pa' })}
          em={em} ngCanh={[tenLoai, data.categoryLabel].filter(Boolean).join(' · ')}
          boiCanh={[
            [t('Phương án'), [iv.description || tenLoai, iv.performer, iv.mocChu].filter(Boolean).join(' · ')],
            [t('Kết quả kỳ trước'), truoc ? <><b className="font-semibold text-slate-300">{dich(outcomeLabelFor(truoc.outcome))}</b> · {tuanLich(truoc.observedOn, homNay)}</> : null],
            nguyenNhan,
          ]}
          pa={{
            id: iv.id, kind: iv.kind, description: iv.description ?? null, performer: iv.performer ?? null,
            performerUserId: iv.performerUserId ?? null,
            actionDue: iv.actionDue ?? null, cycleNo: iv.cycleNo ?? null,
            batBuoc: !!iv.batBuoc, lanCuoi: !!iv.lanCuoi, mocChu: iv.mocChu ?? null, soBuoi: iv.soBuoi ?? null, daDay: iv.daDay ?? 0,
          }} />
      );
    }
  }
  if (view.loai === 'sua-ket-qua') {
    return <SuaKetQuaPanel key={view.followupId} followupId={view.followupId} {...chung} onSaved={xong} onThemPa={() => setView({ loai: 'them-pa' })} />;
  }
  /* OV-12c (khuôn panel v3): Progress — Xác nhận Case MỘT bước (PA Bổ trợ chạy ngay); Case MT — Ghi nhận xét (MT cũ) → Xác nhận PA. */
  const paCho = (data.interventions ?? []).filter((x: any) => x.awaitingConfirmation && x.kind !== 'bo_tro') as PaQuyChe[];
  if (view.loai === 'xac-nhan' && data.trangThaiV4?.k === 'cho-nguyen-nhan') {
    return <XacNhanCasePanel {...chung} data={data} onXong={() => { reload(); onChanged?.(); veSau(); }} />;
  }
  if ((view.loai === 'ghi-nhan-xet' || view.loai === 'xac-nhan') && data.trangThaiV4?.k === 'cho-nhan-xet') {
    return <GhiNhanXetPanel {...chung} data={data} onXong={() => { reload(); onChanged?.(); if (paCho[0]) setView({ loai: 'xac-nhan-pa', paId: paCho[0].id }); else veSau(); }} />;
  }
  if (view.loai === 'xac-nhan-pa') {
    const pa = paCho.find((x) => x.id === view.paId);
    if (pa) {
      const tiep = paCho.find((x) => x.id !== pa.id);
      return (
        <XacNhanPaPanel key={pa.id} {...chung} pa={pa} data={data}
          onXong={() => { reload(); onChanged?.(); if (tiep) setView({ loai: 'xac-nhan-pa', paId: tiep.id }); else veSau(); }} />
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
      dau={dauViec({ han: data.viewer.canEdit && data.viecTiep?.loaiHan === 'lap-pa' ? <ChipHan loai="lap-pa" han={data.viecTiep.han ?? null} /> : null,
        em, lop, ngCanh: [data.tenSos?.mt ? `MT${data.tenSos.mt}` : null, data.categoryLabel, data.tenSos?.kck ? 'KCK' : null].filter(Boolean).join(' · ') })}
      boiCanh={[nguyenNhan, [t('Kết quả gần nhất'), ketQuaGanNhat(data)]]}
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

  /*
   * ─────────────── CHỈ ĐỌC GỌN (OV-12e, mockup v3 §1 bảng vai, §3–§6): người xem không làm được gì ở Case (TVV, CX, GV môn khác) — MỘT câu tình trạng
   * + Bối cảnh 3 dòng (+ Phụ huynh · Gọi cho TVV / CX); toàn bộ thân Case (PA, lịch sử, bằng chứng) ở "Xem thêm", không mất thông tin.
   */
  const vw = data.viewer;
  if (!vw.canEdit && !vw.canApprove && !vw.canClose && !vw.coTheXacNhanCase && !vw.coTheMoLai && !vw.coTheSua) {
    const vt = data.viecTiep ?? null;
    const hv3 = vt?.han ? deadlineView({ kind: (vt.loaiHan ?? 'xac-minh-sos') as DeadlineKind, due: vt.han, today: homNay }) : null;   // ngưỡng một chỗ
    const paChay = (data.interventions ?? []).find((x: any) => x.status === 'planned' || x.status === 'started');
    const ph = data.student?.phuHuynh ?? null;
    const laTvvCx = vai.includes('consultant') || vai.includes('cx');
    return (
      <KhungPanel tieuDe={ten} hocVien={hv} lop={lop} onDong={onClose} quayLai={veNguon} dau={dauViec({ em, lop })}>
        <div ref={boxRef} className="flex flex-col gap-5 pt-4">
          <p className="m-0 text-sm leading-relaxed text-slate-200">
            <b className="font-bold">{data.trangThaiV4?.chu ?? caseStatusLabel(data.status)}</b>
            {vt && vt.chu !== data.trangThaiV4?.chu && <> · {vt.chu}</>}
            {vt?.han && hv3 && (hv3.tone === 'overdue' ? <span className="font-semibold text-late"> · ⚠ {nhanQuaHan(hv3.daysOverdue)}</span>
              : <span className={hv3.ganHan ? 'font-semibold text-soon' : undefined}> · {t('hạn {ngay}', { ngay: ngan(vt.han) })}</span>)}
          </p>
          <BoiCanh
            dong={[
              nguyenNhan,
              [t('Phương án'), paChay ? [dich(INTERVENTION_KIND_LABEL[paChay.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? paChay.kind), paChay.performer, paChay.mocChu].filter(Boolean).join(' · ') : null],
              [t('Kết quả gần nhất'), ketQuaGanNhat(data)],
            ]}
            them={<ThanCase data={data} onViec={setView} />} />
          {laTvvCx && ph && (chuPhuHuynh(ph) || ph.parentPhone) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[10px] border px-3 py-2.5 text-sm text-slate-200" style={{ borderColor: 'var(--line)' }}>
              <span className="w-full text-[13px] text-slate-500">{t('Phụ huynh')}</span>
              <span className="min-w-0 flex-1">{[chuPhuHuynh(ph), ph.parentPhone].filter(Boolean).join(' · ')}</span>
              {ph.parentPhone && <a className="btn min-h-[44px] sm:min-h-[36px]" href={`tel:${ph.parentPhone.replace(/\s+/g, '')}`}>{t('Gọi')}</a>}
            </div>
          )}
        </div>
      </KhungPanel>
    );
  }

  /* ─────────────── view Case */
  const conPaChay = (data.interventions ?? []).some((i: any) => i.status === 'planned' || i.status === 'started');
  const canDong = data.status !== 'done';
  const chanHoanThanh = data.closeBlockers ?? [];
  const ht = data.hoanThanh ?? null;
  /*
   * NÚT CHÍNH = VIỆC TIẾP (B2, K3-07, K3-09; OV-12c): Xác nhận Case (Progress) / Ghi nhận xét (MT cũ) / Xác nhận PA / Ghi kết quả cuối {PA} / Ghi kết quả PA {PA quá hạn nhất} /
   * Hoàn thành Case. PA theo quy chế chưa khép → ẨN Hoàn thành, hiện dòng mờ nói khi nào hoàn thành được.
   */
  const v = data.viecTiep ?? null;
  /* PR-LUI-a2: Mở lại Case đã hoàn thành — Quản lý / Quản trị, và người đã hoàn thành Case (OV-7b); một bấm, không lý do. */
  const moLai = async () => {
    setMoLaiBusy(true);
    try {
      await api.post(`/cases/${caseId}/mo-lai`);
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students');
      toast.push('ok', t('Đã mở lại Case'));
      onChanged?.();
    } catch (e: any) { toast.push('error', e?.message ?? t('Không mở lại được')); } finally { setMoLaiBusy(false); }
  };
  const nutDau = data.viewer.coTheMoLai
    ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={moLaiBusy} onClick={() => void moLai()}>{moLaiBusy ? t('Đang mở lại…') : t('Mở lại')}</button>
    : canDong && data.viewer.coTheSua
      /* OV-7b: Case từ SOS đã xác nhận nguyên nhân — cùng panel Sửa Case, chữ nói đúng việc ("Sửa xác nhận": nguyên nhân, mô tả). OV-12c: Case MT không có bước xác nhận → "Sửa". */
      ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setView({ loai: 'sua' })}>{data.sos?.fromSos && data.sos?.hasCause && !data.sos?.laMt ? t('Sửa xác nhận') : t('Sửa')}</button>
      /* Rà #229: Case hệ thống đóng — không có Mở lại tay, nói đường mở. */
      : data.status === 'done' && data.systemCloseLabel && data.viewer.canApprove
        ? <span className="text-xs text-slate-400">{t('Hệ thống đóng — Hoàn tác Kết thúc học để mở')}</span>
        : null;
  const nutChinh = (() => {
    const nut = (chu: string, lam: () => void, title?: string) => <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" title={title} onClick={lam}>{chu}</button>;
    if (v?.chu === 'Xác nhận Case') return data.viewer.coTheXacNhanCase && canDong ? nut(t('Xác nhận Case'), () => setView({ loai: 'xac-nhan' })) : undefined;
    if (!data.viewer.canEdit || !canDong) return undefined;
    if (v?.chu === 'Ghi nhận xét') return nut(t('Ghi nhận xét'), () => setView({ loai: 'ghi-nhan-xet' }));
    if (v?.chu.startsWith('Xác nhận PA') && v.paId) return nut(t('Xác nhận PA'), () => setView({ loai: 'xac-nhan-pa', paId: v.paId! }));
    if (v?.loaiHan === 'cap-nhat-pa' && v.paId) return nut(v.chu.startsWith('Kết quả cuối') ? t('Kết quả cuối') : t('Kết quả'), () => setView({ loai: 'ghi-ket-qua', paId: v.paId! }), dich(v.chu));  /* tên PA là chữ người dạy gõ (có thể dài) — chỉ để ở tooltip; nút nào cũng đã có "Kết quả" riêng ở thẻ PA */
    if (ht?.an || !data.viewer.canClose) return undefined;
    return (
      <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0"
        onClick={() => (chanHoanThanh.length > 0 ? lf.bam() : setView({ loai: 'hoan-thanh' }))}>
        {t('Hoàn thành Case')}
      </button>
    );
  })();
  /* Điều kiện hoàn thành (PA quy chế chưa khép) một dòng có ổ khoá: "Hoàn thành được sau khi PA theo quy chế kết thúc · **mốc**". */
  const dk = canDong && ht?.an && ht.dong ? /^(.*?) \((.*)\)$/.exec(ht.dong) : null;
  return (
    <KhungPanel tieuDe={ten} hocVien={hv} lop={lop} onDong={onClose} quayLai={veNguon}
      dau={dauViec({ em, lop })}
      chan={{
        huy: { nhan: t('Đóng'), onClick: onClose },
        phu: data.viewer.canEdit && canDong && !(data.sos?.awaitingCause || data.sos?.choNhanXet || data.sos?.choDuyetKhongTheoDoi)
          ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setView({ loai: 'them-pa' })}>{t('+ Thêm PA')}</button>
          : undefined,
        chinh: nutChinh,
        conThieu: lf.daBam && chanHoanThanh.length > 0 ? [{ nhan: t('Hoàn thành Case'), lyDo: dich(chanHoanThanh[0]) }] : undefined,
      }}>
      <div ref={boxRef}>
        {/* PR-PA (§8, mockup pa-dong-bo §9): dải đầu panel — trạng thái MỘT lần (chip) · "mở W2 OCT · X báo" · Sửa / Mở lại cùng hàng. */}
        <div className="-mx-4 flex flex-col gap-1.5 border-b px-4 pb-3 pt-2.5" style={{ borderColor: 'var(--line)', background: 'rgb(var(--phu-rgb) / 0.035)' }}>
          <div className="flex flex-wrap items-center gap-2">
            {data.systemCloseLabel
              ? <Nhan tone="muted" title={dich(data.systemCloseLabel)}>{t('Hệ thống đóng · {ly}', { ly: dich(data.systemCloseLabel) })}</Nhan>
              : data.trangThaiV4
                ? (data.tamDungTu && data.trangThaiV4.t === 'qua-han'
                  ? <><NhanTamDung tu={data.tamDungTu} /><span className="text-[12.5px] text-slate-300">{dich(data.trangThaiV4.chu)}</span></>
                  : <NhanTrangThai t={data.trangThaiV4.t} chu={dich(data.trangThaiV4.chu)} />)
                : <Nhan tone={data.status === 'done' ? 'done' : data.status === 'open' ? 'muted' : 'doing'}>{caseStatusLabel(data.status)}</Nhan>}
            <span className="min-w-0 text-[12.5px] text-slate-400">
              {t('mở {tuan}', { tuan: tuanLich(data.detectedAt, homNay) })}{data.reportedBy ? ` · ${t('{ten} báo', { ten: data.reportedBy })}` : ''}
              {/* Hạn báo kết quả cả Case chỉ khi KHÔNG có PA chạy — có PA chạy thì hạn của PA đã nói (B-5, Q2). */}
              {!data.tamDungTu && canDong && !conPaChay && data.followUntil ? ` · ${t('hạn báo kết quả {ngay}', { ngay: ngan(data.followUntil) })}` : ''}
            </span>
            <span className="flex-1" />
            {nutDau}
          </div>
          {canDong && ht?.an && ht.dong && (
            <p className="m-0 flex items-center gap-1.5 text-[12.5px] text-slate-300">
              <span className="text-slate-400"><KhoaNho /></span>
              <span>{dk ? <>{dich(dk[1])} · <b className="font-semibold text-slate-100">{dk[2]}</b></> : dich(ht.dong)}</span>
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
  if (viec === 'ghi-nhan-xet') return { loai: 'ghi-nhan-xet' };
  return null;
}
