import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { QuaHan } from '../../ui/Nhan.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { FormPa, VachBuoi } from './FormPa.tsx';
import {
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL,
  GOI_Y_KET_QUA_PA, NUT_LUU_KET_QUA, PLAN_DECISION_HINT, PLAN_DECISION_NGAN, PLAN_DECISION_NGHIA, quyetDinhChoPa,
  decisionBlockedReason, decisionNeedsReason, deadlineView, interventionKindsFor, nhanTuanGhiKetQua, outcomeLabelFor,
  type NguoiChon, type PlanDecision, dsLoi, type LuatTruong,
  coNguoiDay, coSoBuoi, demSauKetQua, giaTriCuaPa, loiFormPa, loiKetQuaTuan, paMoi, paPayload, thanKetQuaTuan, thanSuaPa,
  type GiaTriPa,
} from '@shared/domain/index.ts';

/**
 * KẾT QUẢ CỦA MỘT PA — MỘT PANEL (PR-UX3, N-4, mockup 15 §4–§5; nguồn §8). Thay `CapNhatTuanForm` (form trải trong trang + hộp
 * thoại đè lên ngăn Case): từ Hồ sơ HV, Việc cần làm, Hành trình đều mở NGĂN CASE ở view này.
 *
 * Hai khối: 1 · Kết quả tuần W4 SEP / ghi bù nhiều tuần (4 nút + "Chưa đủ dữ liệu" là nút chữ; khối đếm buổi — PR-PA mockup pa-dong-bo §7:
 * Số buổi tuần này + Người dạy tuần này (thay ô Người phụ trách cũ) + vạch "Đã dạy 3/10 → sau khi lưu 5/10"; Vấn đề còn tồn / Ghi chú —
 * PR-LUI-a2) · 2 · Quyết định (danh sách dọc 5 dòng, khối con mở NGAY DƯỚI dòng được chọn). Luật giữ nguyên (máy chủ vẫn kiểm lại); chỉ đổi CÁCH HIỆN: nút Lưu không mờ, bấm mới
 * hiện "Còn thiếu: Tiến triển · Lý do điều chỉnh" (Q4) — trước khi bấm không có lỗi nào.
 */

export type PaCanCapNhat = {
  id: number; kind: string; description: string | null; performer: string | null;
  actionDue: string | null; cycleNo?: number | null;
  /** Tài khoản người làm hiện tại — giá trị đầu của ô người khi Điều chỉnh (Q15) và của "Người dạy tuần này". */
  performerUserId?: number | null;
  /** PR-SOS (T22, T63): PA theo quy chế · lần ghi này là "Kết quả cuối" · chữ mốc (`đến MT2 · W2 OCT`). */
  batBuoc?: boolean; lanCuoi?: boolean; mocChu?: string | null;
  /** PR-PA (§8): Số buổi của PA (null = không đếm) · Đã dạy (tổng Số buổi tuần này các lần trước). */
  soBuoi?: number | null; daDay?: number;
};

const DA_LUU: Record<PlanDecision, string> = {
  keep: 'Đã lưu kết quả, PA vẫn đang chạy',
  adjust: 'Đã điều chỉnh PA, bản cũ giữ trong lịch sử',
  replace: 'Đã thay PA',
  end: 'Đã kết thúc PA',
  ask_manager: 'Đã gửi Quản lý — PA vẫn chạy',
};

/** Nghĩa ngắn (≤ 1 dòng) của dòng quyết định bị chặn — bản đủ ở `title`. */
function ngiaBiChan(outcome: string): string {
  return !outcome ? 'Chọn kết quả trước' : outcome === 'insufficient' ? 'Cần có kết quả để so' : 'Không hợp với kết quả này';
}

export function GhiKetQuaPanel({ pa, hocVien, lop, quayLai, onClose, onSaved, onThemPa }: {
  pa: PaCanCapNhat; hocVien?: string | null; lop?: string | null;
  /** PA theo quy chế cần thêm hỗ trợ → mở Thêm PA (T63, K3-12). */
  onThemPa?: () => void;
  quayLai?: { nhan: string; onClick: () => void };
  onClose: () => void; onSaved: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [outcome, setOutcome] = useState('');
  const [progress, setProgress] = useState('');
  const [remaining, setRemaining] = useState('');
  const [decision, setDecision] = useState<PlanDecision | ''>('');
  const [reason, setReason] = useState('');
  const [on, setOn] = useState(homNay);
  const [endOn, setEndOn] = useState(homNay);
  /* Điều chỉnh: cùng form PA (Nội dung · Số buổi · Người dạy), giá trị đầu = bản hiện tại; gửi ô đã đổi như Sửa PA (`thanSuaPa`). */
  const [gocDc] = useState(() => giaTriCuaPa(pa));
  const [dc, setDc] = useState<GiaTriPa>(gocDc);
  /* PR-PA (§8): khối đếm — Số buổi tuần này (PA có Số buổi; mặc định 1) · Người dạy tuần này (điền sẵn người của PA; lưu ở cột phụ trách cũ). */
  const coDem = pa.soBuoi != null;
  const [tuan, setTuan] = useState('1');
  const [nguoiDay, setNguoiDay] = useState<NguoiChon | null>(gocDc.nguoi);
  /* Thay PA: PA mới dùng một form PA (PR-PA §8) — không có Ngày bắt đầu (PA mới chạy từ Ngày ghi). */
  const [paThay, setPaThay] = useState<GiaTriPa>(() => paMoi(interventionKindsFor().selfServe[0]));
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
  const daDay = pa.daDay ?? 0;
  const dem = coDem ? demSauKetQua(daDay, pa.soBuoi!, tuan) : null;
  const thanDc = thanSuaPa(dc, gocDc, { moi: '', cu: null });

  /* Ô lỗi (YC-12.5.2): lý do dưới ô, chân chỉ đếm "n ô cần sửa ↑". Luật giữ như bản cũ. */
  const LUAT: LuatTruong[] = [
    { khoa: 'ket-qua', nhan: 'Kết quả', chon: true },
    { khoa: 'tien-trien', nhan: 'Tiến triển', toiThieu: 8 },
    ...(lanCuoi ? [] : [{ khoa: 'quyet-dinh', nhan: 'Quyết định', chon: true }]),
    ...(lanCuoi && outcome === 'insufficient' ? [{ khoa: 'ly-do', nhan: 'Lý do chưa đủ dữ liệu', toiThieu: 1 }] : []),
    ...(needReason ? [{ khoa: 'ly-do', nhan: decision === 'adjust' ? 'Lý do điều chỉnh' : 'Lý do thay', toiThieu: 1 }] : []),
    ...(decision === 'ask_manager' ? [{ khoa: 'ly-do', nhan: 'Cần Quản lý giúp gì', toiThieu: 8 }] : []),
  ];
  const loi = dsLoi(LUAT, { 'ket-qua': outcome, 'tien-trien': progress, 'quyet-dinh': decision, 'ly-do': reason });
  if (decision === 'replace') loi.push(...loiFormPa(paThay, { tienTo: 'moi-' }));   // khoá riêng: không đụng ô Số buổi tuần này
  if (coMiniTest) {
    const so = Number(mtTyLe.replace(',', '.'));
    if (mtTyLe.trim() === '' || !Number.isFinite(so) || so < 0 || so > 100) loi.push({ khoa: 'mt-ty-le', nhan: 'Mini Test (%)', lyDo: 'Nhập số từ 0 đến 100' });
    if (!mtNgay) loi.push({ khoa: 'mt-ngay', nhan: 'Ngày làm', lyDo: 'Chọn ngày làm Mini Test' });
  }
  loi.push(...loiKetQuaTuan(pa, tuan, nguoiDay));
  if (decision === 'adjust') {
    /* Số buổi mới ≥ đã dạy SAU tuần này (máy chủ kiểm cùng luật). */
    loi.push(...loiFormPa(dc, { goc: gocDc, daDay: dem?.da ?? daDay, tienTo: 'dc-' }));
    if (!Object.keys(thanDc).length) loi.push({ khoa: 'dc-noi-dung', nhan: 'Nội dung', lyDo: 'Đổi ít nhất một ô: nội dung, số buổi hoặc người' });
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
        ...thanKetQuaTuan(pa, tuan, nguoiDay),
      };
      if (decision === 'end') body.completedOn = endOn || undefined;
      if (coMiniTest) body.miniTest = { tyLe: Number(mtTyLe.replace(',', '.')), ngay: mtNgay };
      /* Chỉ ô đã đổi; đổi người gửi đủ ba khoá (cả ba trống = xoá người). */
      if (decision === 'adjust') body.adjust = thanDc;
      if (decision === 'replace') body.newPlan = paPayload(paThay);
      await api.post(`/interventions/${pa.id}/result`, body);
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/tong-quan');
      toast.push('ok', lanCuoi ? 'Đã lưu kết quả cuối — PA theo quy chế kết thúc' : DA_LUU[decision as PlanDecision]);
      onSaved();
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  const hanGhi = pa.actionDue ? deadlineView({ kind: 'cap-nhat-pa', due: pa.actionDue, today: homNay }) : null;
  /* K3-17: tiêu đề khối nói TUẦN đang ghi ('Kết quả tuần W4 SEP'); trễ nhiều tuần thì nói khoảng + số tuần ghi bù. */
  const tuanGhi = nhanTuanGhiKetQua(pa.actionDue ?? null, homNay).tieuDe;
  const tenLoai = INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind;
  /* PR-PA (§7): PA có Số buổi → "Học Tutor · 10 buổi"; còn lại giữ nội dung PA. */
  const tenPa = coDem ? `${tenLoai} · ${pa.soBuoi} buổi` : pa.description || tenLoai;

  /* Khối đếm (mockup §7): hai ô cùng hàng khi PA có Số buổi; PA không Số buổi chỉ có Người dạy tuần này (không bắt buộc). */
  const oBuoi = coDem && (
    <Truong nhan="Số buổi tuần này" batBuoc loi={loiCua('so-buoi-tuan')}>
      <input className="field w-24 tabular-nums" inputMode="numeric" maxLength={2} {...o('so-buoi-tuan')} value={tuan} onChange={(e) => setTuan(e.target.value)} />
    </Truong>
  );
  /* Bắt buộc chỉ khi Số buổi tuần này ≥ 1 (cùng `loiKetQuaTuan` và máy chủ). */
  const canNguoi = coDem && Number(tuan.trim()) >= 1;
  const oNguoi = coNguoiDay(pa.kind) && (
    <Truong nhan="Người dạy tuần này" batBuoc={canNguoi} tuyChon={!canNguoi} as="div" loi={loiCua('nguoi-day')}>
      <ChonNguoi nhom="nhan_vien" value={nguoiDay} onChange={setNguoiDay} choTrong="Để trống" placeholder="Chưa chọn · gõ tên để tìm"
        ariaLabel="Người dạy tuần này" id={lf.oId('nguoi-day')} onBlur={lf.roi('nguoi-day')} invalid={!!loiCua('nguoi-day')} />
    </Truong>
  );

  /* Khối con mở NGAY DƯỚI dòng quyết định được chọn (thụt 12px, vạch trái). */
  const khoiCon = (d: PlanDecision) => {
    if (d === 'adjust') {
      return (
        <div className="space-y-3">
          <FormPa phang tienTo="dc-" v={dc} dat={(p) => setDc((x) => ({ ...x, ...p }))} lf={lf} loi={loi} daDay={dem?.da ?? daDay} />
          <Truong nhan="Lý do điều chỉnh" batBuoc loi={loiCua('ly-do')}>
            <input className="field w-full" {...o('ly-do')} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Truong>
        </div>
      );
    }
    if (d === 'replace') {
      return (
        <div className="space-y-3">
          <FormPa phang chonLoai tienTo="moi-" v={paThay} dat={(p) => setPaThay((x) => ({ ...x, ...p }))} lf={lf} loi={loi} />
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
          <p className="m-0 text-xs text-slate-500">Gửi Quản lý · trả lời trong 5 ngày · xem ở Yêu cầu của tôi</p>
        </div>
      );
    }
    if (d === 'end') {
      return <Truong nhan="Ngày kết thúc"><ONgay kieu="ngay" value={endOn} onChange={setEndOn} toiDa={homNay} /></Truong>;
    }
    return null;
  };

  return (
    <KhungPanel tieuDe={lanCuoi ? 'Kết quả cuối' : 'Kết quả'} hocVien={hocVien} lop={lop} quayLai={quayLai} onDong={onClose}
      ngCanh={(
        <span className="flex items-center gap-1.5 max-sm:flex-col max-sm:items-start max-sm:gap-0.5">
          <span className="truncate max-sm:whitespace-normal max-sm:break-words" title={tenPa}>{tenPa}{pa.cycleNo && pa.cycleNo > 1 ? ` · Đợt ${pa.cycleNo}` : ''}</span>
          {hanGhi && (
            <span className="flex items-center gap-1.5">
              <span className="whitespace-nowrap text-slate-500"><span className="max-sm:hidden">· </span>{hanGhi.han}</span>
              {hanGhi.tone === 'overdue' && <QuaHan ngay={hanGhi.daysOverdue} />}
            </span>
          )}
        </span>
      )}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>
            {busy ? 'Đang lưu…' : lanCuoi ? 'Lưu kết quả cuối' : NUT_LUU_KET_QUA[decision || 'keep']}
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
          <p className="m-0 mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            Chưa có bài để so?
            <NutChon nho chon={outcome === 'insufficient'} onClick={() => pickOutcome('insufficient')}>
              {outcomeLabelFor('insufficient')}
            </NutChon>
          </p>
          {loiCua('ket-qua') && <span className="mt-1 block text-xs text-late">{loiCua('ket-qua')}</span>}
        </div>
        <Truong nhan="Tiến triển" batBuoc loi={loiCua('tien-trien')} dem={{ co: progress.trim().length, can: 8 }}>
          <textarea className="field w-full" {...o('tien-trien')} rows={2} value={progress} onChange={(e) => setProgress(e.target.value)}
            placeholder={GOI_Y_KET_QUA_PA} />
        </Truong>
        {(coDem || coNguoiDay(pa.kind)) && (
          <div className="flex flex-col gap-2.5 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            {coDem && coNguoiDay(pa.kind) ? <Hang2>{oBuoi}{oNguoi}</Hang2> : <>{oBuoi}{oNguoi}</>}
            {dem && (
              <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-slate-300">
                <VachBuoi da={dem.da} tong={dem.tong} tt={dem.tt} />
                <span>Đã dạy <b className="font-semibold text-slate-100 tabular-nums">{dem.truoc}/{dem.tong}</b> → sau khi lưu <b className="font-semibold text-slate-100 tabular-nums">{dem.da}/{dem.tong}</b></span>
                {dem.tt === 'du' ? <span className="font-semibold text-ok">· đủ buổi</span>
                  : dem.tt === 'vuot' ? <span className="font-semibold text-late">· vượt {dem.vuot} buổi</span>
                  : <span>· còn <b className="font-semibold text-slate-100 tabular-nums">{dem.con}</b></span>}
              </div>
            )}
            {/* Đủ buổi: chỉ gợi ý — không tự kết thúc; PA không có "Kết thúc PA" (quy chế, Kết quả cuối) thì không gợi ý. */}
            {dem?.tt === 'du' && !lanCuoi && dsQuyetDinh.includes('end') && <span className="text-xs text-slate-500">Xong PA thì chọn Kết thúc PA ở mục 2.</span>}
            {!coDem && coSoBuoi(pa.kind) && <span className="text-xs text-slate-500">PA chưa có Số buổi — thêm ở ⋯ › Sửa PA nếu muốn đếm.</span>}
          </div>
        )}
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
        luat="Điều chỉnh: cùng PA, sửa nội dung, số buổi hoặc người — bản cũ giữ trong lịch sử. Thay PA: khép PA này và mở PA mới. Kết thúc PA: Case chỉ hoàn thành được khi mọi PA đã khép.">
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
                    <span className="block text-xs text-slate-500">{chan ? ngiaBiChan(outcome) : PLAN_DECISION_NGHIA[d]}</span>
                  </span>
                </button>
                {chon && khoiCon(d) && (
                  <div className="ml-3 mt-2 border-l-2 pl-3" style={{ borderColor: 'var(--accent-line)' }}>{khoiCon(d)}</div>
                )}
              </div>
            );
          })}
        </div>
        {loiCua('quyet-dinh') && <span className="block text-xs text-late">{loiCua('quyet-dinh')}</span>}
      </Khoi>
      )}

      <div className="mt-3.5">
        <Truong nhan="Ngày ghi"><ONgay kieu="ngay" value={on} onChange={setOn} toiDa={homNay} /></Truong>
      </div>
    </KhungPanel>
  );
}

type MatPa = { description: string | null; performer: string | null; soBuoi?: number | null; startedDate?: string | null };
/** Một lần sửa PA (Điều chỉnh · sửa khi Xác nhận PA · Sửa PA), cùng hình với máy chủ (`server/src/cases/planRevisions.ts`). */
export type BanDieuChinh = {
  id: number; on: string; source: 'adjust' | 'confirm_edit' | 'sua_pa'; by: string | null; reason: string;
  before: MatPa; after: MatPa;
};
