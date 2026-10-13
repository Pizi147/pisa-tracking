import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import type { BoTro } from '../cases/CasePanel.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { FormPa, NgayKhoa } from '../cases/FormPa.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, INTERVENTION_KIND_LABEL, URGENCY_LABEL, URGENCY_LEVELS,
  dsLoi, issuesForTopic, kiemGhiRoKhac, laKhac, tuanLich, reasonNeedsText,
  datLaiNguoi, khacNguoi, loiFormPa, nguoiCuaPa, nguoiMacDinh, paMoi, paPayload, type GiaTriPa,
  type CaseDismissReason,
} from '@shared/domain/index.ts';

/**
 * CASE TỰ TẠO TỪ SOS (SOS v4, PR-SOS — M7, YC-12.1, 12.3, 12.4, Q28-3). Hai lối loại trừ cho Case chờ nguyên nhân:
 *   · `XacNhanCasePanel` → lưu xong CHUYỂN THẲNG sang `XacNhanPaPanel` của PA theo quy chế đầu tiên còn chờ (PA chạy từ hôm đó);
 *   · `KhongTheoDoiForm` → gửi Quản lý duyệt (thẻ Chờ duyệt, 5 ngày) — Case chưa đóng.
 * Không còn Xác nhận / Sửa / Thay PA gợi ý, không tệp đính kèm, không ngày kết thúc tự chọn (Q28-4).
 */

const invalidateCases = () => { invalidate('/cases'); invalidate('/students'); invalidate('/tong-quan'); invalidate('/my-work'); invalidate('/yeu-cau'); };

type ChungPanel = {
  hocVien?: string | null; lop?: string | null;
  quayLai?: { nhan: string; onClick: () => void };
  onClose: () => void;
};

/** PA theo quy chế như `caseDetail` trả — chỉ các trường panel cần. */
export type PaQuyChe = {
  id: number; kind: string; description: string | null; performer: string | null; performerUserId: number | null;
  /** PR-PA (§8): Số buổi máy gán (sửa được khi xác nhận). */
  soBuoi?: number | null;
  mocChu: string | null; awaitingConfirmation: boolean;
};

/** Chip nhỏ trong tên Case (T21): `MT1`, `SOS 3` do hệ thống gắn. */
function Chip({ children, sos }: { children: string; sos?: number | null }) {
  const lop = sos ? ({ 1: 'bg-sos1-bg text-sos1', 2: 'bg-sos2-bg text-sos2', 3: 'bg-sos3-bg text-sos3' } as Record<number, string>)[sos] ?? ''
    : 'border border-[color:var(--line-strong)] text-slate-300';
  return <span className={`shrink-0 rounded px-1.5 text-[11px] font-semibold leading-5 tabular-nums ${lop}`}>{children}</span>;
}

/**
 * XÁC NHẬN CASE (M7, YC-12.3). Kỹ năng khoá · Tên Case: chip MT + phần giữa sửa được + chip SOS · Nhóm nguyên nhân * · Mức độ gấp *
 * · Mô tả * (≥ 15) · Bắt đầu theo dõi: hôm nay (khoá) · khối chỉ đọc PA theo quy chế. Không tab "Đã xong từ trước", không tệp đính kèm,
 * không "+ Thêm phương án" ở bước này (Q7).
 */
export function XacNhanCasePanel({ caseId, topic, kyNang, ct, tenSos, paQuyChe, boTro = null, onXong, ...chung }: ChungPanel & {
  caseId: number; topic: string | null; kyNang: string; ct?: string | null;
  tenSos: { mt: number | null; giua: string; sos: number | null; kck?: boolean } | null;
  paQuyChe: PaQuyChe[];
  /** Case Giữa khoá lớp thường (PR-LT2a): tên môn ngắn cho Tên Case. PR-CT2: xác nhận xong PA Bổ trợ chạy ngay (bỏ kế hoạch bài giảng). */
  boTro?: BoTro | null;
  /** Lưu xong: nơi gọi mở tiếp Xác nhận PA (Planning tự quyết (1)). */
  onXong: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  /* Lớp thường: tên môn NGẮN như tên Case (`G+V không đạt`), khớp máy chủ. */
  const [giua, setGiua] = useState(tenSos?.giua ?? `${boTro?.mon.find((m) => m.caseId === caseId)?.tenMon ?? kyNang} không đạt`);
  const [code, setCode] = useState('');
  const [ghiRo, setGhiRo] = useState('');
  const [urgency, setUrgency] = useState('');
  const [moTa, setMoTa] = useState('');
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const causes = topic ? issuesForTopic(topic, ct ?? null) : [];

  const loi = dsLoi([
    { khoa: 'ten', nhan: 'Tên Case', toiThieu: 3 },
    { khoa: 'nguyen-nhan', nhan: 'Nhóm nguyên nhân', chon: true },
    ...(laKhac(code) ? [{ khoa: 'ghi-ro', nhan: 'Ghi rõ nguyên nhân', toiThieu: 3 }] : []),
    { khoa: 'muc-do', nhan: 'Mức độ gấp', chon: true },
    { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 },
  ], { ten: giua, 'nguyen-nhan': code, 'ghi-ro': ghiRo, 'muc-do': urgency, 'mo-ta': moTa });

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/xac-nhan`, {
        primaryCode: code, observation: laKhac(code) ? ghiRo.trim() : undefined, urgency, moTa: moTa.trim(), tenGiua: giua.trim(),
      });
      invalidateCases();
      toast.push('ok', boTro ? 'Đã xác nhận Case' : 'Đã xác nhận Case — còn xác nhận PA theo quy chế');
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Xác nhận Case" {...chung} onDong={chung.onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>Xác nhận Case</button>,
      }}>
      <Khoi tieuDe="Nguyên nhân">
        <Truong nhan="Kỹ năng" as="div">
          <span className="field flex items-center text-slate-300" aria-readonly>{kyNang}</span>
        </Truong>
        <Truong nhan="Tên Case" batBuoc phu={boTro ? 'Chỉ sửa được phần giữa. Đợt kiểm tra do hệ thống gắn.' : tenSos?.kck ? 'Chỉ sửa được phần giữa. MT# và KCK do hệ thống gắn.' : 'Chỉ sửa được phần giữa. MT# và SOS do hệ thống gắn.'} loi={lf.loiCua(loi, 'ten')}>
          <span className="flex items-center gap-1.5">
            {boTro ? <Chip>Progress Test</Chip> : tenSos?.mt ? <Chip>{`MT${tenSos.mt}`}</Chip> : null}
            <input className="field min-w-0 flex-1" maxLength={80} {...lf.o(loi, 'ten')} value={giua} onChange={(e) => setGiua(e.target.value)} />
            {tenSos?.kck ? <Chip>KCK</Chip> : tenSos?.sos ? <Chip sos={tenSos.sos}>{`SOS ${tenSos.sos}`}</Chip> : null}
          </span>
        </Truong>
        <div>
          <Truong nhan="Nhóm nguyên nhân" batBuoc loi={lf.loiCua(loi, 'nguyen-nhan')}>
            <select className="field w-full" {...lf.o(loi, 'nguyen-nhan')} value={code}
              title={causes.find((i) => i.code === code)?.hint} onChange={(e) => setCode(e.target.value)}>
              <option value="">Chọn phân loại</option>
              {causes.map((i) => <option key={i.code} value={i.code} title={i.hint}>{i.label}</option>)}
            </select>
          </Truong>
          <OKhac hien={laKhac(code)} value={ghiRo} onChange={setGhiRo} goiY="Ví dụ: Chưa quen dạng bài mới"
            id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(ghiRo) : null} />
        </div>
        <Truong nhan="Mức độ gấp" batBuoc as="div" loi={lf.loiCua(loi, 'muc-do')}>
          <div className="grid grid-cols-2 gap-2" id={lf.oId('muc-do')} tabIndex={-1}>
            {URGENCY_LEVELS.map((u) => (
              <NutChon key={u} chon={urgency === u} className="justify-center" onClick={() => setUrgency(u)}>{URGENCY_LABEL[u]}</NutChon>
            ))}
          </div>
        </Truong>
        <Truong nhan="Mô tả" batBuoc phu="Sai ở đâu, bài hay buổi nào" loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: 15 }}>
          <textarea className="field w-full" rows={3} {...lf.o(loi, 'mo-ta')} value={moTa} onChange={(e) => setMoTa(e.target.value)}
            placeholder="Ví dụ: Sai nhiều câu True/False/Not Given ở passage 2" />
        </Truong>
        <Truong nhan="Bắt đầu theo dõi" as="div">
          <span className="field flex items-center text-slate-300" aria-readonly>Tuần này · {tuanLich(homNay, homNay)}</span>
        </Truong>
      </Khoi>
      {paQuyChe.length > 0 && (
        <Khoi tieuDe="Phương án theo quy chế SOS — bắt buộc"
          luat="PA theo quy chế không thay, không kết thúc sớm. Sau khi xác nhận Case, bạn xác nhận PA để PA bắt đầu từ hôm đó.">
          <ul className="m-0 list-none space-y-1 p-0 text-xs">
            {paQuyChe.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-1.5 text-slate-200">
                <span className="font-semibold">{p.description || INTERVENTION_KIND_LABEL[p.kind as keyof typeof INTERVENTION_KIND_LABEL] || 'PA theo quy chế'}</span>
                {p.performer && <span className="text-slate-500">· {p.performer}</span>}
                {p.mocChu && <span className="text-slate-500">· {p.mocChu}</span>}
              </li>
            ))}
          </ul>
        </Khoi>
      )}
    </KhungPanel>
  );
}

/**
 * XÁC NHẬN PA THEO QUY CHẾ (Q28-3) — PR-PA (§8): cùng một form PA (`FormPa`): Loại khoá "theo quy chế" (phụ: mốc kết thúc) · Nội dung * (≥ 15,
 * không điền sẵn mô tả máy — Q28-5) · Số buổi (loại có số buổi) · Người dạy / Người thực hiện (Tự học không có) · Ngày bắt đầu khoá tuần này.
 * Lưu → PA chạy từ hôm nay.
 */
export function XacNhanPaPanel({ pa, studentId, onXong, ...chung }: ChungPanel & {
  pa: PaQuyChe; studentId?: number | null;
  onXong: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [v, setV] = useState<GiaTriPa>(() => ({
    ...paMoi(pa.kind), soBuoi: pa.soBuoi == null ? '' : String(pa.soBuoi),
    nguoi: nguoiCuaPa(pa) ?? nguoiMacDinh(pa.kind),
  }));
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const loi = loiFormPa(v, { toiThieu: 15 });

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      const { description, soBuoi } = paPayload(v);
      /* Người: chỉ gửi khi đổi (người máy gán đã nghỉ mà không đụng thì không bị 400); đổi thì đủ ba khoá — trống = xoá người. */
      await api.post(`/interventions/${pa.id}/xac-nhan-pa`, { description, soBuoi, ...(khacNguoi(v.nguoi, nguoiCuaPa(pa)) ? datLaiNguoi(v.nguoi) : {}) });
      invalidateCases();
      toast.push('ok', 'Đã xác nhận PA — PA bắt đầu từ hôm nay');
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Xác nhận PA theo quy chế" {...chung} onDong={chung.onClose}
      chan={{
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>Xác nhận PA</button>,
      }}>
      <FormPa v={v} dat={(p) => setV((x) => ({ ...x, ...p }))} lf={lf} loi={loi} toiThieu={15} studentId={studentId}
        quyChe={{ mocChu: pa.mocChu }} ngay={<NgayKhoa chu={`Tuần này · ${tuanLich(homNay, homNay)}`} />} />
    </KhungPanel>
  );
}

/**
 * `KHÔNG CẦN THEO DÕI…` (S4-5, YC-12.4) — lý do chọn nhanh (Khác cần ghi rõ) rồi GỬI QUẢN LÝ DUYỆT. Case chưa đóng: hàng Case thành
 * "Chờ Quản lý duyệt · không theo dõi"; kết quả xem ở Yêu cầu của tôi.
 */
export function KhongTheoDoiForm({ caseId, onClose, onDone }: { caseId: number; onClose: () => void; onDone?: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [daBam, setDaBam] = useState(false);

  const loiGhiRo = reasonNeedsText(reason) ? kiemGhiRoKhac(text) : null;
  const thieu = !reason ? 'Chọn một lý do.' : null;

  const gui = async () => {
    setDaBam(true);
    if (thieu || loiGhiRo) return;
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/dismiss`, { reasonCode: reason, reasonText: reasonNeedsText(reason) ? text.trim() : undefined });
      invalidateCases();
      toast.push('ok', 'Đã gửi Quản lý duyệt — xem ở Yêu cầu của tôi');
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2 rounded-lg p-2.5" style={{ background: 'var(--surface-2)' }} role="group" aria-label="Không cần theo dõi">
      <p className="m-0 text-xs text-slate-300">Không cần theo dõi Case này vì:</p>
      <div className="flex flex-wrap gap-1.5">
        {CASE_DISMISS_REASONS.map((r) => (
          <NutChon key={r} nho chon={reason === r} onClick={() => setReason(r)}>
            {CASE_DISMISS_REASON_LABEL[r as CaseDismissReason]}
          </NutChon>
        ))}
      </div>
      <OKhac hien={reasonNeedsText(reason)} value={text} onChange={setText} goiY="Ví dụ: Em nghỉ ốm cả tuần thi" loi={daBam ? loiGhiRo : null} />
      {daBam && thieu && <p className="m-0 text-xs text-bad" role="alert">{thieu}</p>}
      <p className="m-0 text-xs text-slate-500">Gửi Quản lý duyệt · trả lời trong 5 ngày · xem ở Yêu cầu của tôi</p>
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Đóng</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={gui}>Gửi Quản lý duyệt</button>
      </div>
    </div>
  );
}
