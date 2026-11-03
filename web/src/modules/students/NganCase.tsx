import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, NhanTrangThai, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel, KhungTrongCot } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { caseStatusLabel } from '../../lib/format.ts';
import { INTERVENTION_KIND_LABEL, duongHoSoHocVien, chuAiLamDuoc, chuPhuHuynh, ghiNhanhDuoc, laPaMacDinh, maView, toiKyGhi, deadlineView, nhanQuaHan, type DeadlineKind, outcomeLabelFor, tuanLich, viewTuMa } from '@shared/domain/index.ts';
import { XemCaseViec, XemCha, useXem } from '../../lib/quayLai.ts';
import { useSession } from '../../lib/session.tsx';
import { ThanCase, tenNganCase, type CaseDetail, type VuaDoiPa, type ViewCase } from '../cases/CasePanel.tsx';
import { GhiKetQuaPanel, SuaKetQuaPanel } from '../cases/CapNhatTuan.tsx';
import { HoanThanhCasePanel, SuaCasePanel, SuaPaPanel, ThemPaPanel } from '../cases/ThaoTacCase.tsx';
import { DongNguyenNhan, MoTaCasePanel, XacNhanCasePanel, XacNhanPaPanel, XacNhanSPanel, ketQuaGanNhat, type PaQuyChe } from '../yThuc/CaseSosControls.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { BoiCanh, DiemKq, KhoiDaLuu, NutChu, ViecVuaLuu, dauViec, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { TheYeuCau } from '../duyet/TheYeuCau.tsx';
import { NhanTamDung } from '../cases/SkillBoard.tsx';
import { KhoaNho } from '../cases/FormPa.tsx';
import { DoiNguoiPhuTrach } from '../cases/DoiNguoiPhuTrach.tsx';
import { dich, t } from '@shared/i18n/index.ts';

export type { ViewCase };

/**
 * NGĂN CASE dùng chung cho mọi lối vào (PR-UX3, N-4, G-8): Hồ sơ HV › Học thuật, Hành trình, thông báo (`?case=&pa=`), Việc cần làm
 * (`?viec=ghi-ket-qua`), bảng Case, Phân tích. MỘT panel — không chồng: view `case` (thân Case) và các view làm việc (Kết quả ·
 * Thêm PA · Hoàn thành; PR-DUYET bỏ Trả lời đề xuất — thẻ Chờ duyệt nhúng dưới PA) THAY nội dung cho nhau. Tải `/cases/{id}` MỘT lần.
 * M6 6b-1: các view là NGĂN XẾP (`useXem` — `?panel=` khi mở trong panel số, mảng cục bộ ở nơi khác): "‹ {view trước}" lùi đúng một view (view mở từ
 * Case về Case, không nhảy cóc về danh sách); view đầu chuỗi về nơi mở (`XemCha` / `veNguon`); không có nơi mở thì view việc ‹ về Case.
 *
 * Có `paId` (view `case`) thì sau khi tải xong dò `[data-pa-id="{paId}"]` (giao kèo với Hành trình) để cuộn tới và viền sáng 2 giây.
 * Có `viec` thì mở thẳng view đó; `viecBanDau` là bản đầy đủ khi nơi gọi đã có `ViewCase`.
 */
export function NganCase(p: Parameters<typeof ThanNganCase>[0]) {
  /* M6 6b-1: đổi Case khi panel còn mở (thông báo, đổi `?case=`) → dựng lại — chuỗi view, form, chữ của Case trước không mang sang Case sau. */
  return <ThanNganCase key={p.caseId} {...p} />;
}

function ThanNganCase({ caseId, paId, viec, viecBanDau, paViec = null, hocVien, lop, onClose, onChanged, veNguon, onTiep, anViecChinh = false, dauKyNang = false, kyNangTiep = null }: {
  /** U03 A2 (mở từ tóm tắt kỹ năng hồ sơ lớp): đầu "CASE · kỹ năng" · "em · kỹ năng" + chip SOS · dải Điểm · Kỳ vọng · Phụ trách · Mở. */
  dauKyNang?: boolean;
  /** U03 A2 chân: Case kỹ năng kế của em — Ghi kết quả có "Lưu · kỹ năng tiếp ›". */
  kyNangTiep?: { ten: string; di: () => void } | null;
  /** U02 (một việc một chỗ): nút việc tiếp đã ở dòng tóm tắt Case của cột hồ sơ HV — chân Case không lặp (Hoàn thành Case vẫn ở chân). */
  anViecChinh?: boolean;
  /** 6c (#644 XM-4): view Case mở từ panel việc — PA của việc đó không lặp ô ghi nhanh / "Xác nhận PA" / "Kết quả" (việc nằm ngay view dưới, ‹ về). */
  paViec?: number | null;
  caseId: number; paId?: number | null;
  /** `tra-loi` cũ trên URL (trước PR-DUYET) → mở Ngăn Case thường: trả lời đề xuất nay là thẻ ngay dưới PA. */
  viec?: 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh' | 'tra-loi' | 'xac-nhan' | 'xac-nhan-pa' | 'ghi-nhan-xet';
  viecBanDau?: ViewCase;
  hocVien?: string | null; lop?: string | null;
  onClose: () => void; onChanged?: () => void;
  /** OV-12f: nơi mở giữ view bằng state (Panel một em, panel việc) — "‹ {tên em}" ở view đầu chuỗi, làm xong view đầu về đúng nơi đó (không panel
   *  lồng panel). Mở trong panel số: chuỗi `?panel=` + `XemCha`, không truyền. */
  veNguon?: { nhan: string; onClick: () => void };
  /** OV-13b: việc kế của danh sách nơi mở (Công việc) — nút "Việc tiếp ›" sau khi lưu. */
  onTiep?: (() => void) | null;
}) {
  const { homNay, ngan } = useNgayNghiepVu();
  const vai = useSession().session?.roles ?? [];
  const { data, error, reload } = useApi<CaseDetail>(`/cases/${caseId}`);
  /* UI-HO-SO-HV-2: trong cột, view việc mở thẳng vẫn nằm trên view Case — lưu xong tự về Case (V20), ‹ về Case. */
  const trongCot = useContext(KhungTrongCot);
  const v0 = viecBanDau ?? tuViec(viec, paId);
  const xem = useXem({ dau: trongCot && v0 && v0.loai !== 'case' ? ['case', maView(v0)] : [maView(v0 ?? { loai: 'case' })] });
  const maHien = xem.ds[xem.ds.length - 1] ?? 'case';
  const view = (viewTuMa(maHien) ?? { loai: 'case' }) as ViewCase;   // đoạn lạ trên URL → thân Case
  /* Vào view việc từ view đang xem (push) — ‹ / Back về đúng view này. */
  const setView = (v: ViewCase) => xem.vao(maView(v));
  /* Bấm "Hoàn thành Case" khi còn bị chặn: chân nói câu chặn (không phải ô nhập nên không đếm "n ô cần sửa"). */
  const lf = useLoiForm();
  const toast = useToast();
  const [moLaiBusy, setMoLaiBusy] = useState(false);
  /* R1-NO-CU: hộp Đổi người phụ trách đang mở ở dải đầu. */
  const [doiNguoi, setDoiNguoi] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  /* Trong cột (`trongCot`): không tự mở form khi tải, người chỉ xem thấy đủ Case A (không bản gọn), không nút Đóng. */

  /* Về thân Case: view ngay dưới là Case thì lùi (không chồng Case lên Case), không thì thay view trên cùng. */
  const veCase = () => { if (xem.ds[xem.ds.length - 2] === 'case') xem.lui(); else xem.thay('case'); lf.datLai(); };
  /* Một bước của chuỗi xong (Xác nhận Case → Xác nhận PA, "Việc tiếp ›"): THAY view trên cùng — ‹ vẫn về view cha cũ. */
  const sangViec = (v: ViewCase) => xem.thay(maView(v));
  /* B1: mở từ thông báo / đường `?case=` (không kèm việc) — hoặc `viec=xac-nhan` từ hồ sơ — khi Case đang chờ → mở sẵn đúng khối: Progress chờ
     Xác nhận Case → Xác nhận Case; Case MT chưa mô tả → Mô tả Case (MO-TA-CASE). Trong panel số (`?panel=`) chỉ dòng "Xác nhận Case" chung tự
     sang đúng khối (thay view — F5 giữ khối đã chọn). */
  const tuDong = useRef(trongCot ? false : xem.url ? maHien === 'xac-nhan' : !viecBanDau && !paId && (!viec || viec === 'xac-nhan'));
  useEffect(() => {
    if (!tuDong.current || !data) return;
    tuDong.current = false;
    if (data.choXacNhanS?.coTheXacNhan) sangViec({ loai: 'xac-nhan-s' });   // SV-NX-CASE: S chấm chéo chờ GV phụ trách
    else if (data.trangThaiV4?.k === 'cho-nhan-xet' && data.viewer.canEdit) sangViec({ loai: 'ghi-nhan-xet' });
    else if (data.trangThaiV4?.k === 'cho-nguyen-nhan' && data.viewer.coTheXacNhanCase) sangViec({ loai: 'xac-nhan' });
  }, [data]);   // eslint-disable-line react-hooks/exhaustive-deps
  /*
   * OV-13b (mockup OV-13 §1, §9): Ghi kết quả / Thêm PA / Xác nhận PA lưu xong → Ở LẠI panel: "✓ Đã lưu · …" + "Việc tiếp ›" (việc kế: PA chờ xác
   * nhận kế của Case, rồi việc kế của danh sách), không nhảy sang Case đầy đủ. `truoc` = view vừa làm (Hoàn tác đưa về đó, chữ giữ).
   */
  const [daLuu, setDaLuu] = useState<(DaLuuPanel & { tieuDe: string; luc: string; ma: string; tiep?: ViewCase }) | null>(null);
  /* M6 6b-2 (Q1): PA vừa thêm / vừa ghi kết quả — view Case viền nhấn thẻ PA đó + "✓ … · Hoàn tác" (10 giây). */
  const [vuaDoi, setVuaDoi] = useState<VuaDoiPa | null>(null);
  const chuoi = useContext(XemCha);
  /* M6 6b-3: mở trong panel việc (Công việc) — view việc đầu chuỗi có "Xem Case" (view kế trong panel việc), làm xong báo dải việc vừa lưu. */
  const xemCaseViec = useContext(XemCaseViec);
  const cv = useContext(ViecVuaLuu);
  const xongLuu = (tieuDe: string, tiep?: ViewCase) => (x?: DaLuuPanel) => {
    reload(); onChanged?.();
    /* Q1: Thêm PA / Ghi kết quả mở TỪ Case (view ngay dưới là Case) → lưu xong tự về Case — không ở lại form "✓ Đã lưu" (hộp điểm giữ V12). */
    const paId = view.loai === 'ghi-ket-qua' ? view.paId : x?.paId;
    if ((view.loai === 'them-pa' || view.loai === 'ghi-ket-qua') && xem.ds[xem.ds.length - 2] === 'case' && paId) {
      setVuaDoi({ paId, chu: x?.chu ?? t('Đã lưu'), hoanTac: x?.hoanTac });
      xem.lui();
      return;
    }
    setDaLuu({ chu: t('Đã lưu'), ...x, tieuDe, luc: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), ma: maHien, tiep });
  };

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

  /* Về Case sau lưu: cuộn tới thẻ PA vừa đổi (thẻ tự viền nhấn — `ThanCase`). */
  useEffect(() => {
    if (!vuaDoi || view.loai !== 'case') return;
    boxRef.current?.querySelector<HTMLElement>(`[data-pa-id="${vuaDoi.paId}"]`)?.scrollIntoView({ block: 'center' });
  }, [vuaDoi, view.loai, data]);

  if (error) {
    return (
      <KhungPanel tieuDe="Case" hocVien={hocVien} lop={lop} onDong={onClose}>
        <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
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
  /* ‹ của view đang xem (M6 luật Quay lại): view trước trong chuỗi → view đầu: nơi mở (danh sách `XemCha` / `veNguon`) → không có nơi mở: view việc về
     thân Case (link sâu — thay, không rời app). Làm xong một view việc (`xong`) cũng đi đường này. */
  const tenView = (ma: string) => { const v = viewTuMa(ma); return !v || v.loai === 'case' ? ten : TEN_VIEW[v.loai] ?? ten; };
  const truoc = xem.ds.length >= 2 ? xem.ds[xem.ds.length - 2] : null;
  const quayLai: { nhan: string; onClick: () => void; xem?: boolean } | undefined = truoc !== null ? { nhan: tenView(truoc), onClick: xem.lui }
    : xem.ten !== null ? { nhan: xem.ten, onClick: xem.lui }
      : veNguon ?? (view.loai === 'case' ? undefined
        : xemCaseViec ? { nhan: t('Xem Case'), onClick: xemCaseViec, xem: true } : { nhan: ten, onClick: veCase });
  /* "Xem Case" không phải lùi: làm xong view việc đầu chuỗi trong panel việc thì thay bằng thân Case (như link sâu), không mở thêm view Case. */
  const xong = () => { reload(); onChanged?.(); if (quayLai?.xem) veCase(); else quayLai?.onClick(); };
  /* 6b-3 (mockup ②b): "Xác nhận · việc tiếp ›" — máy chủ nhận xong mới sang: PA chờ xác nhận kế của Case (`sau`), không thì việc kế của danh sách. */
  const tiepViec = (sau?: ViewCase) => (onTiep && cv ? {
    ten: sau ? null : cv?.ten ?? null,
    lam: (x: DaLuuPanel) => { reload(); onChanged?.(); cv?.bao(x, !!sau); if (sau) sangViec(sau); else onTiep(); },
  } : undefined);
  /* Đang "✓ Đã lưu" mà người dùng ‹ / Back sang view khác → thôi khối đã lưu (khối chỉ thuộc view vừa lưu). */
  if (daLuu && daLuu.ma !== maHien) setDaLuu(null);
  if (daLuu?.ma === maHien) {
    const nut = daLuu.tiep
      ? <button type="button" className="btn btn-primary min-h-[48px] px-5 font-bold sm:min-h-[40px]" onClick={() => { sangViec(daLuu.tiep!); setDaLuu(null); }}>{t('Việc tiếp ›')}</button>
      /* 6b-3: Hoàn tác của lần lưu này theo sang đầu việc kế (dải). */
      : onTiep ? <button type="button" className="btn btn-primary min-h-[48px] px-5 font-bold sm:min-h-[40px]" onClick={() => { cv?.bao(daLuu); onTiep(); }}>{t('Việc tiếp ›')}</button>
        : quayLai && !quayLai.xem ? <button type="button" className="btn btn-primary min-h-[48px] px-5 font-bold sm:min-h-[40px]" onClick={quayLai.onClick}>‹ {quayLai.nhan}</button>
          : <button type="button" className="btn btn-primary min-h-[48px] px-5 font-bold sm:min-h-[40px]" onClick={onClose}>{t('Đóng')}</button>;
    return (
      <KhungPanel tieuDe={daLuu.tieuDe} hocVien={hv} lop={lop} onDong={onClose} dau={dauViec({ em: data.student ? { id: data.student.id, ten: data.student.name } : null, lop, ngCanh: data.categoryLabel })}>
        <KhoiDaLuu x={daLuu} luc={daLuu.luc} nutChinh={nut}
          /* 6b-3: trong panel việc "Xem Case" là view kế — ‹ về lại khối "✓ Đã lưu" này. */
          phu={<NutChu onClick={() => { if (xemCaseViec) xemCaseViec(); else { setDaLuu(null); veCase(); } }}>{t('Xem Case')}</NutChu>}
          onHoanTac={() => { setDaLuu(null); reload(); onChanged?.(); }} />
      </KhungPanel>
    );
  }
  const chung = { hocVien: hv, lop, quayLai, onClose };
  /* OV-12e: đầu + Bối cảnh panel v3 cho các việc của Case (Ghi kết quả · Thêm PA). */
  const em = data.student ? { id: data.student.id, ten: data.student.name } : null;
  const nguyenNhan: [string, ReactNode] = [t('Nguyên nhân'), (data.issues ?? []).length ? <DongNguyenNhan issues={data.issues ?? []} attemptId={data.attemptId} /> : null];

  if (view.loai === 'ghi-ket-qua') {
    const iv = (data.interventions ?? []).find((x: any) => x.id === view.paId);
    if (iv) {
      const truoc = (data.followups ?? []).find((f: any) => f.interventionId === iv.id && f.outcome);
      const tenLoai = dich(INTERVENTION_KIND_LABEL[iv.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? iv.kind);
      return (
        <GhiKetQuaPanel key={iv.id} {...chung} onSaved={xongLuu(t('Ghi kết quả'))} onThemPa={() => setView({ loai: 'them-pa' })}
          tiep={kyNangTiep ? { ten: kyNangTiep.ten, lam: (x) => { toast.push('ok', x?.chu ?? t('Đã lưu')); reload(); onChanged?.(); kyNangTiep.di(); } } : undefined} chuTiep={t('Lưu · kỹ năng tiếp ›')}
          em={em} ngCanh={[tenLoai, data.categoryLabel].filter(Boolean).join(' · ')}
          boiCanh={[
            [t('Phương án'), [iv.description || tenLoai, iv.performer, iv.mocChu].filter(Boolean).join(' · ')],
            [t('Kết quả kỳ trước'), truoc ? <><b className="font-semibold text-slate-300">{dich(outcomeLabelFor(truoc.outcome))}</b> · {tuanLich(truoc.observedOn, homNay)}</> : null],
            nguyenNhan,
          ]}
          pa={{
            id: iv.id, kind: iv.kind, description: iv.description ?? null, performer: iv.performer ?? null,
            performerUserId: iv.performerUserId ?? null,
            actionDue: iv.actionDue ?? null, miniTestHan: iv.miniTestHan ?? null, cycleNo: iv.cycleNo ?? null,
            batBuoc: !!iv.batBuoc, lanCuoi: !!iv.lanCuoi, mocChu: iv.mocChu ?? null, soBuoi: iv.soBuoi ?? null, daDay: iv.daDay ?? 0,
            laMacDinh: laPaMacDinh(iv), doiPaCho: iv.doiPa?.trangThai === 'cho',
          }} />
      );
    }
  }
  if (view.loai === 'sua-ket-qua') {
    return <SuaKetQuaPanel key={view.followupId} followupId={view.followupId} {...chung} onSaved={xong} onThemPa={() => setView({ loai: 'them-pa' })} />;
  }
  /* OV-12c (khuôn panel v3): Progress — Xác nhận Case MỘT bước (PA Bổ trợ chạy ngay); Case MT — Mô tả Case (chưa mô tả) → Xác nhận PA. */
  const paCho = (data.interventions ?? []).filter((x: any) => x.awaitingConfirmation && x.kind !== 'bo_tro') as PaQuyChe[];
  if (view.loai === 'xac-nhan' && data.trangThaiV4?.k === 'cho-nguyen-nhan') {
    return <XacNhanCasePanel {...chung} data={data} onXong={xong} tiep={tiepViec()} />;
  }
  /* HOAN-TAC-XN: Hoàn tác Xác nhận Case S khi đã sang Xác nhận PA → Case chưa mô tả, chờ xác nhận lại: hiện lại bước đó (PA chưa xác nhận được). */
  const choLaiS = view.loai === 'xac-nhan-pa' && !(data.issues ?? []).some((i: any) => i.role === 'primary');
  if ((view.loai === 'xac-nhan-s' || choLaiS) && data.choXacNhanS?.coTheXacNhan) {
    return <XacNhanSPanel {...chung} data={data} onXong={() => { if (paCho[0]) { reload(); onChanged?.(); sangViec({ loai: 'xac-nhan-pa', paId: paCho[0].id }); } else xong(); }} />;
  }
  if ((view.loai === 'ghi-nhan-xet' || view.loai === 'xac-nhan') && data.trangThaiV4?.k === 'cho-nhan-xet') {
    return <MoTaCasePanel {...chung} data={data} onXong={() => { if (paCho[0]) { reload(); onChanged?.(); sangViec({ loai: 'xac-nhan-pa', paId: paCho[0].id }); } else xong(); }} />;
  }
  if (view.loai === 'xac-nhan-pa') {
    const pa = paCho.find((x) => x.id === view.paId);
    if (pa) {
      const tiep = paCho.find((x) => x.id !== pa.id);
      return (
        <XacNhanPaPanel key={pa.id} {...chung} pa={pa} data={data} tiep={tiepViec(tiep ? { loai: 'xac-nhan-pa', paId: tiep.id } : undefined)}
          onXong={xongLuu(t('Xác nhận PA'), tiep ? { loai: 'xac-nhan-pa', paId: tiep.id } : undefined)} />
      );
    }
  }
  if (view.loai === 'sua-pa') {
    const iv = (data.interventions ?? []).find((x: any) => x.id === view.paId);
    if (iv) {
      return <SuaPaPanel key={iv.id} {...chung} pa={iv} ketQua={data.followups ?? []} studentId={data.student?.id} onSaved={xong} />;
    }
  }
  if (view.loai === 'them-pa' && !data.viewer.canEdit) {
    /* Không quyền (mở thẳng `viec=them-pa`, hoặc quyền vừa đổi): không form, không 403 trống — MỘT câu "ai làm được" (khu K ⑤). */
    return (
      <KhungPanel tieuDe={t('Thêm PA')} hocVien={hv} lop={lop} quayLai={quayLai} onDong={onClose} dau={dauViec({ em, lop })}>
        <p className="m-0 mt-4 flex items-start gap-2 text-sm leading-relaxed text-slate-200 [text-wrap:pretty]"><span className="mt-0.5 text-slate-400"><KhoaNho /></span>{chuAiLamDuoc(data.owner)}</p>
      </KhungPanel>
    );
  }
  if (view.loai === 'them-pa') {
    return <ThemPaPanel {...chung} caseId={caseId} studentId={data.student?.id} onSaved={xongLuu(t('Thêm PA'))}
      dau={dauViec({ han: data.viewer.canEdit && data.viecTiep?.loaiHan === 'lap-pa' ? <ChipHan loai="lap-pa" han={data.viecTiep.han ?? null} /> : null,
        em, lop, ngCanh: [data.tenSos?.mt ? `MT${data.tenSos.mt}` : null, data.categoryLabel, data.tenSos?.kck ? 'KCK' : null].filter(Boolean).join(' · ') })}
      boiCanh={[nguyenNhan, [t('Kết quả gần nhất'), ketQuaGanNhat(data)]]}
      coPaBatBuoc={(data.interventions ?? []).some((x: any) => x.batBuoc && (x.status === 'planned' || x.status === 'started'))}
      /* Thêm PA mở từ Case (Q1 tự về Case) không có "· việc tiếp ›" — chỉ khi Thêm PA là việc đang làm. */
      tiep={xem.ds[xem.ds.length - 2] === 'case' ? undefined : tiepViec()} />;
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
  if (!trongCot && !vw.canEdit && !vw.canApprove && !vw.canClose && !vw.coTheXacNhanCase && !vw.coTheMoLai && !vw.coTheSua && !data.choXacNhanS?.coTheXacNhan) {
    const vt = data.viecTiep ?? null;
    const hv3 = vt?.han ? deadlineView({ kind: (vt.loaiHan ?? 'xac-minh-sos') as DeadlineKind, due: vt.han, today: homNay }) : null;   // ngưỡng một chỗ
    const paChay = (data.interventions ?? []).find((x: any) => x.status === 'planned' || x.status === 'started');
    const ph = data.student?.phuHuynh ?? null;
    const laTvvCx = vai.includes('consultant') || vai.includes('cx');
    return (
      <KhungPanel tieuDe={ten} hocVien={hv} lop={lop} onDong={onClose} quayLai={quayLai} dau={dauViec({ em, lop })} loai={null}>
        <div ref={boxRef} className="flex flex-col gap-5 pt-4">
          <p className="m-0 text-sm leading-relaxed text-slate-200">
            <b className="font-bold">{data.trangThaiV4?.chu ?? caseStatusLabel(data.status)}</b>
            {vt && vt.chu !== data.trangThaiV4?.chu && <> · {vt.chu}</>}
            {vt?.han && hv3 && (hv3.tone === 'overdue' ? <span className="font-semibold text-late"> · ⚠ {nhanQuaHan(hv3.daysOverdue)}</span>
              : <span className={hv3.ganHan ? 'font-semibold text-soon' : undefined}> · {t('hạn {ngay}', { ngay: ngan(vt.han) })}</span>)}
          </p>
          {data.status !== 'done' && (
            <p className="m-0 -mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-slate-300 [text-wrap:pretty]"><span className="mt-0.5 text-slate-400"><KhoaNho /></span>{chuAiLamDuoc(data.owner)}</p>
          )}
          <BoiCanh
            dong={[
              nguyenNhan,
              [t('Phương án'), paChay ? [dich(INTERVENTION_KIND_LABEL[paChay.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? paChay.kind), paChay.performer, paChay.mocChu].filter(Boolean).join(' · ') : null],
              [t('Kết quả gần nhất'), ketQuaGanNhat(data)],
            ]}
            them={<ThanCase data={data} onViec={setView} onDoi={() => { reload(); onChanged?.(); }} />} />
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
   * NÚT CHÍNH = VIỆC TIẾP (B2, K3-07, K3-09; OV-12c): Xác nhận Case (Progress) / Mô tả Case (MT) / Xác nhận PA / Ghi kết quả cuối {PA} / Ghi kết quả PA {PA quá hạn nhất} /
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
        ? <span className="text-xs text-slate-400">{
          /* Hotfix 15/10 (L9): "Hoàn tác Kết thúc học" chỉ đúng khi đóng vì kết thúc khoá. */
          data.systemCloseReason === 'course_ended' ? t('Hệ thống đóng — Hoàn tác Kết thúc học để mở')
            : data.systemCloseReason === 'cho_chot_sos' ? t('Hệ thống đóng — Case mới tạo khi chốt lượt')
            : data.systemCloseReason === 'overall_dat' ? t('Hệ thống đóng — Overall đã đạt')
            : t('Hệ thống đóng · {lyDoHeThong}', { lyDoHeThong: dich(data.systemCloseLabel) })}</span>
        : null;
  /* OV-13a: Case tạm / chờ nguyên nhân / chờ nhận xét / chờ duyệt không theo dõi chưa thêm PA. */
  const themPaDuoc = data.viewer.canEdit && canDong && !(data.sos?.awaitingCause || data.sos?.choNhanXet || data.sos?.choDuyetKhongTheoDoi || data.sos?.tam);
  /* OV-14b: nút chính là "Xác nhận PA" → thẻ PA đó trong thân không lặp nút. */
  const paNutChinh = data.viewer.canEdit && canDong && v?.chu.startsWith('Xác nhận PA') && v.paId ? v.paId : null;
  const nutHoanThanh = ht?.an || !data.viewer.canClose || data.sos?.tam ? undefined   // OV-13a: Case tạm — chờ chốt SOS, chưa là việc
    : (
      <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0"
        onClick={() => (chanHoanThanh.length > 0 ? lf.bam() : setView({ loai: 'hoan-thanh' }))}>
        {t('Hoàn thành Case')}
      </button>
    );
  const nutChinh = (() => {
    const nut = (chu: string, lam: () => void, title?: string) => <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" title={title} onClick={lam}>{chu}</button>;
    if (data.choXacNhanS?.coTheXacNhan && canDong) return nut(t('Xác nhận Case'), () => setView({ loai: 'xac-nhan-s' }));
    if (v?.chu === 'Xác nhận Case') return data.viewer.coTheXacNhanCase && canDong ? nut(t('Xác nhận Case'), () => setView({ loai: 'xac-nhan' })) : undefined;
    if (!data.viewer.canEdit || !canDong) return undefined;
    if (v?.chu === 'Mô tả Case') return nut(t('Mô tả Case'), () => setView({ loai: 'ghi-nhan-xet' }));
    if (paViec !== null && v?.paId === paViec) return undefined;   // 6c XM-4: việc của PA này đang mở ở view dưới (‹ về)
    if (v?.chu.startsWith('Xác nhận PA') && v.paId) return nut(t('Xác nhận PA'), () => setView({ loai: 'xac-nhan-pa', paId: v.paId! }));
    /* CV-LOI (A1-15): Case chưa có PA (việc tiếp = lập PA) → nút chính là "+ Thêm PA", không phải "Hoàn thành Case". */
    if (v?.loaiHan === 'lap-pa' && themPaDuoc) return nut(t('+ Thêm PA'), () => setView({ loai: 'them-pa' }));
    if (v?.loaiHan === 'cap-nhat-pa' && v.paId) {
      /* OV-13b (mockup OV-13 §2): nút chính chỉ nổi khi TỚI KỲ; PA ghi nhanh được thì ô ghi đã nằm ngay dưới dòng PA — chân không lặp nút. */
      const pa = (data.interventions ?? []).find((x: any) => x.id === v.paId);
      if (!pa || !toiKyGhi(pa.actionDue, homNay) || ghiNhanhDuoc(pa)) return undefined;
      return nut(v.chu.startsWith('Kết quả cuối') ? t('Kết quả cuối') : t('Kết quả'), () => setView({ loai: 'ghi-ket-qua', paId: v.paId! }), dich(v.chu));  /* tên PA là chữ người dạy gõ (có thể dài) — chỉ để ở tooltip */
    }
    return nutHoanThanh;
  })();
  const nutChinhHien = anViecChinh && nutChinh !== nutHoanThanh ? undefined : nutChinh;
  const nutDoiNguoi = canDong && data.doiChu?.duoc && !doiNguoi
    ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setDoiNguoi(true)}>{t('Đổi người…')}</button> : null;
  /* U02 (mockup chân Case): trong cột — Sửa · Đổi người… · + Thêm PA · Hoàn thành Case cùng một chân. */
  const nutCot = trongCot && (nutDau || nutDoiNguoi) ? <>{nutDau}{nutDoiNguoi}</> : null;
  /* M6 6b-2 (Q7): mở từ danh sách "Case chưa chốt PA" — Case vừa xử lý → nút chính "Case tiếp ›" (Case kế bạn làm được, chưa xử lý); hết → một câu. */
  const tiep = chuoi?.caseTiep?.xong ? chuoi.caseTiep : null;
  /* Case còn việc của chính nó (nút chính) → giữ nút đó, "Case tiếp ›" thành nút phụ; hết việc → "Case tiếp ›" là nút chính. */
  const nutTiep = tiep?.di
    ? <button type="button" className={`btn ${nutChinh ? '' : 'btn-primary'} min-h-[44px] sm:min-h-0`} onClick={tiep.di}>{t('Case tiếp ›')}</button>
    : tiep ? <span className="text-[13px] text-slate-400">{t('Hết Case chờ trong danh sách')}</span> : null;
  /* Điều kiện hoàn thành (PA quy chế chưa khép) một dòng có ổ khoá: "Hoàn thành được sau khi PA theo quy chế kết thúc · **mốc**". */
  const dk = canDong && ht?.an && ht.dong ? /^(.*?) \((.*)\)$/.exec(ht.dong) : null;
  return (
    <KhungPanel tieuDe={ten} hocVien={hv} lop={lop} onDong={onClose} quayLai={quayLai} anDau={trongCot}
      /* 6b-2 (critique): hạn của việc tiếp ở đầu view Case — cùng chip của dòng danh sách, không mất khi mở Case. */
      dau={dauKyNang && !trongCot ? {
        /* U03 A2 (mockup `.pn-h1 .loai` · `.pn-tieu`): "CASE · WRITING TASK 2" · "Hà Trần Phúc · Writing Task 2" + chip SOS bên phải. */
        loai: `CASE · ${(data.categoryLabel ?? '').toLocaleUpperCase('vi')}`, dong2: [],
        tieu: <span>{em ? <Link className="text-slate-100 no-underline hover:underline" to={duongHoSoHocVien(em.id)}>{em.ten}</Link> : null}{data.categoryLabel ? ` · ${data.categoryLabel}` : ''}</span>,
        han: data.sosLevel ? <ChipSos muc={data.sosLevel} tinh /> : null,
      } : dauViec({ em, lop, han: canDong && v?.han && v.loaiHan ? <ChipHan loai={v.loaiHan as DeadlineKind} han={v.han} /> : null })}
      chan={trongCot && !themPaDuoc && !nutChinhHien && !nutTiep && !nutCot && !(lf.daBam && chanHoanThanh.length) ? undefined : {
        huy: trongCot ? null : { nhan: t('Đóng'), onClick: onClose },
        phu: <>
          {nutCot}
          {themPaDuoc && v?.loaiHan !== 'lap-pa'   // CV-LOI (A1-15): đã là nút chính thì không lặp
            ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => setView({ loai: 'them-pa' })}>{t('+ Thêm PA')}</button>
            : null}
          {nutChinhHien ? nutTiep : null}
        </>,
        chinh: nutChinhHien ?? nutTiep,
        conThieu: lf.daBam && chanHoanThanh.length > 0 ? [{ nhan: t('Hoàn thành Case'), lyDo: dich(chanHoanThanh[0]) }] : undefined,
      }}>
      <div ref={boxRef}>
        {/* PR-PA (§8, mockup pa-dong-bo §9): dải đầu panel — trạng thái MỘT lần (chip) · "mở W2 OCT · X báo" · Sửa / Mở lại cùng hàng. */}
        <div className={trongCot ? 'flex flex-col gap-1.5 empty:hidden' : '-mx-4 flex flex-col gap-1.5 border-b px-4 pb-3 pt-2.5'} style={trongCot ? { borderColor: 'var(--line)' } : { borderColor: 'var(--line)', background: 'rgb(var(--phu-rgb) / 0.035)' }}>
          {/* U03 A2 (mockup `.facts`): Điểm MTn (✗ số lớn) · Kỳ vọng · Phụ trách · Mở — đứng đầu dải, trước trạng thái + Đổi người / Sửa. */}
          {dauKyNang && !trongCot && <DaiDiemCase data={data} homNay={homNay} />}
          <div className="flex flex-wrap items-center gap-2">
            {trongCot ? null : data.systemCloseLabel
              ? <Nhan tone="muted" title={dich(data.systemCloseLabel)}>{t('Hệ thống đóng · {ly}', { ly: dich(data.systemCloseLabel) })}</Nhan>
              : data.trangThaiV4
                ? (data.tamDungTu && data.trangThaiV4.t === 'qua-han'
                  ? <><NhanTamDung tu={data.tamDungTu} /><span className="text-[13px] text-slate-300">{dich(data.trangThaiV4.chu)}</span></>
                  : <NhanTrangThai t={data.trangThaiV4.t} chu={dich(data.trangThaiV4.chu)} />)
                : <Nhan tone={data.status === 'done' ? 'done' : data.status === 'open' ? 'muted' : 'doing'}>{caseStatusLabel(data.status)}</Nhan>}
            {/* U02: trong cột, "Mở" là một trường của khung Case (sau Mô tả — `ThanCase`), không ở dải đầu. */}
            {!trongCot && !dauKyNang && <span className="min-w-0 text-[13px] text-slate-400 max-sm:order-last max-sm:basis-full">
              {t('mở {tuan}', { tuan: tuanLich(data.detectedAt, homNay) })}{data.reportedBy ? ` · ${t('{ten} báo', { ten: data.reportedBy })}` : ''}
              {/* Hạn báo kết quả cả Case chỉ khi KHÔNG có PA chạy — có PA chạy thì hạn của PA đã nói (B-5, Q2). */}
              {!data.tamDungTu && canDong && !conPaChay && data.followUntil && !data.sos?.tam ? ` · ${t('hạn báo kết quả {ngay}', { ngay: ngan(data.followUntil) })}` : ''}
              {` · ${data.owner ? t('phụ trách: {ten}', { ten: data.owner }) : t('Chưa có người phụ trách')}`}
            </span>}
            {!trongCot && <span className="flex-1" />}
            {/* R1-NO-CU (D17): QL / GVCN lớp em đổi người phụ trách tại chỗ — hộp một ô ngay dưới dải. U02: trong cột hai nút này ở chân Case. */}
            {!trongCot && nutDoiNguoi}
            {!trongCot && nutDau}
          </div>
          {doiNguoi && canDong && data.doiChu?.duoc && (
            <DoiNguoiPhuTrach caseId={caseId} ownerCu={data.ownerUserId ?? null} ungVien={data.doiChu.ungVien}
              onXong={() => { setDoiNguoi(false); reload(); onChanged?.(); }} onTaiLai={reload} onHuy={() => setDoiNguoi(false)} />
          )}
          {/* U02 (PTA 04/11): trong cột lý do khoá nằm ở ⓘ cạnh "Kết luận" (`lyDoKhoa`), không thành dòng riêng. */}
          {canDong && ht?.an && ht.dong && !trongCot && (
            <p className="m-0 flex items-center gap-1.5 text-[13px] text-slate-300">
              <span className="text-slate-400"><KhoaNho /></span>
              <span>{dk ? <>{dich(dk[1])} · <b className="font-semibold text-slate-100">{dich(dk[2])}</b></> : dich(ht.dong)}</span>
            </p>
          )}
        </div>
        {/* S4-5: Quản lý mở Case đang chờ "Không cần theo dõi" thấy thẻ ngay dưới tiêu đề — duyệt / từ chối tại chỗ. */}
        {data.yeuCauCase && data.viewer.canApprove && (
          <div className="pt-3"><TheYeuCau gon yc={data.yeuCauCase} onXong={() => { reload(); onChanged?.(); }} /></div>
        )}
        <ThanCase dauCoDiem={dauKyNang && !trongCot} lyDoKhoa={trongCot && canDong && ht?.an && ht.dong ? (dk ? <>{dich(dk[1])} · <b className="font-semibold">{dich(dk[2])}</b></> : dich(ht.dong)) : null} data={data} onViec={setView} onDoi={() => { reload(); onChanged?.(); }} paNutChinh={paNutChinh} paViec={paViec} anNutMoTa={anViecChinh}
          vuaDoi={vuaDoi} onHoanTac={() => { setVuaDoi(null); reload(); if (chuoi?.caseTiep) chuoi.caseTiep.boXong(); else onChanged?.(); }} />
      </div>
    </KhungPanel>
  );
}
/** U03 A2: dải số đầu panel Case — mốc mở / trượt lại mới nhất có band (cùng mốc `ketQuaGanNhat`); thiếu trường nào bỏ ô đó. */
function DaiDiemCase({ data, homNay }: { data: CaseDetail; homNay: string | null }) {
  const m = [...(data.milestones ?? [])].reverse().find((x: any) => (x.kind === 'opened' || x.kind === 'repeat') && x.band != null);
  const kv = m?.expectation != null ? Number(m.expectation) : null;
  const o: [string, ReactNode][] = [
    ...(m ? [[t('Điểm MT{n}', { n: m.attemptNo }), <span className="text-[17px]"><DiemKq diem={Number(m.band)} kyVong={kv} /></span>] as [string, ReactNode]] : []),
    ...(kv != null ? [[t('Kỳ vọng'), kv.toFixed(1)] as [string, ReactNode]] : []),
    [t('Phụ trách'), data.owner ?? t('Chưa có')],
    [t('Mở'), tuanLich(data.detectedAt, homNay)],
  ];
  return (
    <span className="flex basis-full flex-wrap">
      {o.map(([n, g]) => (
        <span key={n} className="flex min-w-0 flex-col gap-0.5 whitespace-nowrap border-l px-[18px] py-0.5 first:border-l-0 first:pl-0" style={{ borderColor: 'var(--line)' }}>
          <span className="text-xs font-medium leading-[1.3] text-faint">{n}</span><b className="text-[15px] font-semibold leading-[1.35] text-slate-100">{g}</b>
        </span>
      ))}
    </span>
  );
}
/** Tên view trên nút "‹ {view trước}" (cùng chữ với nút mở view đó). */
const TEN_VIEW: Record<string, string> = {
  'ghi-ket-qua': t('Ghi kết quả'), 'sua-ket-qua': t('Sửa kết quả'), 'them-pa': t('Thêm PA'), 'sua-pa': t('Sửa PA'), 'xac-nhan-pa': t('Xác nhận PA'),
  'xac-nhan': t('Xác nhận Case'), 'xac-nhan-s': t('Xác nhận Case'), 'ghi-nhan-xet': t('Mô tả Case'), 'hoan-thanh': t('Hoàn thành Case'), sua: t('Sửa'),
};
function tuViec(viec: string | undefined, paId: number | null | undefined): ViewCase | null {
  if (viec === 'ghi-ket-qua' && paId) return { loai: 'ghi-ket-qua', paId };
  if (viec === 'them-pa') return { loai: 'them-pa' };
  if (viec === 'hoan-thanh') return { loai: 'hoan-thanh' };
  if (viec === 'xac-nhan') return { loai: 'xac-nhan' };
  if (viec === 'xac-nhan-pa' && paId) return { loai: 'xac-nhan-pa', paId };
  if (viec === 'ghi-nhan-xet') return { loai: 'ghi-nhan-xet' };
  return null;
}
