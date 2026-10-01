import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { KhoiKeHoach, bodyKeHoach, invalidateKeHoach, luatKeHoach, nguoiDayMacDinh, type BoTro, type KeHoachForm } from '../cases/NopKeHoachPanel.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, GOI_Y_MO_TA_PA, INTERVENTION_KIND_LABEL, URGENCY_LABEL, URGENCY_LEVELS,
  dsLoi, issuesForTopic, kiemGhiRoKhac, laKhac, nguoiThanhPayload, tuanLich, reasonNeedsText,
  type CaseDismissReason, type NguoiChon,
} from '@shared/domain/index.ts';

/**
 * CASE TỰ TẠO TỪ SOS (SOS v4, PR-SOS — M7, YC-12.1, 12.3, 12.4, Q28-3). Hai lối loại trừ cho Case chờ nguyên nhân:
 *   · `XacNhanCasePanel` → lưu xong CHUYỂN THẲNG sang `XacNhanPaPanel` của PA theo quy chế đầu tiên còn chờ (PA chạy từ hôm đó);
 *   · `KhongTheoDoiForm` → gửi Quản lý duyệt (thẻ Chờ duyệt, 5 ngày) — Case chưa đóng.
 * Không còn Xác nhận / Sửa / Thay PA gợi ý, không tệp đính kèm, không ngày kết thúc tự chọn (Q28-4).
 */

const invalidateCases = () => { invalidate('/cases'); invalidate('/students'); invalidate('/overview'); invalidate('/my-work'); invalidate('/yeu-cau'); };

type ChungPanel = {
  hocVien?: string | null; lop?: string | null;
  quayLai?: { nhan: string; onClick: () => void };
  onClose: () => void;
};

/** PA theo quy chế như `caseDetail` trả — chỉ các trường panel cần. */
export type PaQuyChe = {
  id: number; kind: string; description: string | null; performer: string | null; performerUserId: number | null;
  mocChu: string | null; awaitingConfirmation: boolean;
};

/** Chip nhỏ trong tên Case (T21): `MT1`, `SOS 3` do hệ thống gắn. */
function Chip({ children, sos }: { children: string; sos?: number | null }) {
  const lop = sos ? ({ 1: 'bg-sos1-bg text-sos1', 2: 'bg-sos2-bg text-sos2', 3: 'bg-sos3-bg text-sos3' } as Record<number, string>)[sos] ?? ''
    : 'border border-[color:var(--line-strong)] text-slate-300';
  return <span className={`shrink-0 rounded px-1.5 text-[11px] font-semibold leading-5 tabular-nums ${lop}`}>{children}</span>;
}

/**
 * XÁC NHẬN CASE (M7, YC-12.3). Kỹ năng khoá · Tên Case: chip MT + phần giữa sửa được + chip SOS · Phân loại nguyên nhân * · Mức độ gấp *
 * · Mô tả * (≥ 15) · Bắt đầu theo dõi: hôm nay (khoá) · khối chỉ đọc PA theo quy chế. Không tab "Đã xong từ trước", không tệp đính kèm,
 * không "+ Thêm phương án" ở bước này (Q7).
 */
export function XacNhanCasePanel({ caseId, topic, kyNang, ct, tenSos, paQuyChe, boTro = null, studentId, onXong, ...chung }: ChungPanel & {
  caseId: number; topic: string | null; kyNang: string; ct?: string | null;
  tenSos: { mt: number | null; giua: string; sos: number | null } | null;
  paQuyChe: PaQuyChe[];
  /** Case Giữa khoá lớp thường (PR-LT2a): khối kế hoạch bài giảng nếu người xem phải nộp, hoặc dòng nói ai nộp (FOU). */
  boTro?: BoTro | null; studentId?: number | null;
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
  /* Kế hoạch bài giảng: Nội dung yếu điền sẵn từ Mô tả (sửa được — gõ vào là tách khỏi Mô tả). */
  const kem = !!boTro?.phaiGuiKem;
  const [kh, setKh] = useState<{ noiDungYeu: string | null; keHoach: string; nguoi: KeHoachForm['nguoi'] }>({ noiDungYeu: null, keHoach: '', nguoi: nguoiDayMacDinh(boTro) });
  const fKh: KeHoachForm = { noiDungYeu: kh.noiDungYeu ?? moTa, keHoach: kh.keHoach, nguoi: kh.nguoi };

  const loi = dsLoi([
    { khoa: 'ten', nhan: 'Tên Case', toiThieu: 3 },
    { khoa: 'nguyen-nhan', nhan: 'Phân loại nguyên nhân', chon: true },
    ...(laKhac(code) ? [{ khoa: 'ghi-ro', nhan: 'Ghi rõ nguyên nhân', toiThieu: 3 }] : []),
    { khoa: 'muc-do', nhan: 'Mức độ gấp', chon: true },
    { khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 },
  ], { ten: giua, 'nguyen-nhan': code, 'ghi-ro': ghiRo, 'muc-do': urgency, 'mo-ta': moTa });
  const loiKh = kem ? luatKeHoach(fKh) : [];
  const tatCaLoi = [...loi, ...loiKh];

  const luu = async () => {
    lf.bam();
    if (tatCaLoi.length > 0) return;
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/xac-nhan`, {
        primaryCode: code, observation: laKhac(code) ? ghiRo.trim() : undefined, urgency, moTa: moTa.trim(), tenGiua: giua.trim(),
        ...(kem ? { keHoach: bodyKeHoach(fKh) } : {}),
      });
      invalidateCases();
      if (kem) invalidateKeHoach();
      toast.push('ok', kem ? 'Đã xác nhận Case và gửi Quản lý duyệt — xem ở Yêu cầu của tôi'
        : boTro ? 'Đã xác nhận Case' : 'Đã xác nhận Case — còn xác nhận PA theo quy chế');
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe="Xác nhận Case" {...chung} onDong={chung.onClose}
      chan={{
        conThieu: lf.conThieu(tatCaLoi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={luu}>{kem ? 'Xác nhận Case và gửi kế hoạch' : 'Xác nhận Case'}</button>,
      }}>
      <Khoi tieuDe="Nguyên nhân">
        <Truong nhan="Kỹ năng" as="div">
          <span className="field flex items-center text-slate-300" aria-readonly>{kyNang}</span>
        </Truong>
        <Truong nhan="Tên Case" batBuoc phu={boTro ? 'Chỉ sửa được phần giữa. Đợt kiểm tra do hệ thống gắn.' : 'Chỉ sửa được phần giữa. MT# và SOS do hệ thống gắn.'} loi={lf.loiCua(loi, 'ten')}>
          <span className="flex items-center gap-1.5">
            {boTro ? <Chip>Giữa khoá</Chip> : tenSos?.mt ? <Chip>{`MT${tenSos.mt}`}</Chip> : null}
            <input className="field min-w-0 flex-1" maxLength={80} {...lf.o(loi, 'ten')} value={giua} onChange={(e) => setGiua(e.target.value)} />
            {tenSos?.sos ? <Chip sos={tenSos.sos}>{`SOS ${tenSos.sos}`}</Chip> : null}
          </span>
        </Truong>
        <div>
          <Truong nhan="Phân loại nguyên nhân" batBuoc loi={lf.loiCua(loi, 'nguyen-nhan')}>
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
      {kem && boTro && (
        <KhoiKeHoach boTro={boTro} f={fKh} dat={(p) => setKh((x) => ({ ...x, ...p }))} lf={lf} loi={loiKh} studentId={studentId} />
      )}
      {boTro && !kem && boTro.chung && (
        <Khoi tieuDe="Kế hoạch bài giảng">
          <p className="m-0 text-xs text-slate-300">
            Kế hoạch chung do {boTro.nguoiDay?.ten ?? 'giáo viên chủ nhiệm'}{' '}
            {boTro.keHoach?.trangThai === 'cho' ? 'đã nộp — đang chờ Quản lý duyệt.' : boTro.keHoach?.trangThai === 'duyet' ? 'đã nộp và được duyệt.' : 'nộp sau khi có nguyên nhân.'}
          </p>
        </Khoi>
      )}
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
 * XÁC NHẬN PA THEO QUY CHẾ (Q28-3, khuôn giống Thêm PA): Phân loại · Bắt đầu hôm nay · Kết thúc theo quy chế (chỉ đọc) · Người thực hiện
 * (đổi được) · Mô tả * (≥ 15, điền sẵn mô tả máy). Không Tình trạng, không Ngày bắt đầu, không tệp đính kèm. Lưu → PA chạy từ hôm nay.
 */
export function XacNhanPaPanel({ pa, studentId, onXong, ...chung }: ChungPanel & {
  pa: PaQuyChe; studentId?: number | null;
  onXong: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  /* PR-S3F #9 (Q28-5): KHÔNG điền sẵn mô tả máy gán ("Tutor · đến lúc thi") — người xác nhận tự viết đủ ≥ 15 ký tự; gợi ý mờ ở placeholder (Q28-1). */
  const [moTa, setMoTa] = useState('');
  const [nguoi, setNguoi] = useState<NguoiChon | null>(
    pa.performerUserId ? { kieu: 'tai_khoan', id: pa.performerUserId, ten: pa.performer ?? '' } : pa.performer ? { kieu: 'ngoai', ten: pa.performer } : { kieu: 'toi' },
  );
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const loaiPa = INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? 'PA theo quy chế';
  const loi = dsLoi([{ khoa: 'mo-ta', nhan: 'Mô tả', toiThieu: 15 }], { 'mo-ta': moTa });

  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      await api.post(`/interventions/${pa.id}/xac-nhan-pa`, { description: moTa.trim(), ...nguoiThanhPayload(nguoi) });
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
      <Khoi tieuDe="Phương án">
        <p className="m-0 text-xs text-slate-300">
          Phân loại: <b className="text-slate-100">{loaiPa}</b> · Bắt đầu: tuần này ({tuanLich(homNay, homNay)})
          {pa.mocChu ? <> · Kết thúc theo quy chế: <b className="text-slate-100">{pa.mocChu}</b></> : null}
        </p>
        <Truong nhan="Người thực hiện" as="div">
          <ChonNguoi nhom="giao_vien" studentId={studentId} value={nguoi} onChange={setNguoi} />
        </Truong>
        <Truong nhan="Mô tả" batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: 15 }}>
          <textarea className="field w-full" rows={3} {...lf.o(loi, 'mo-ta')} value={moTa} onChange={(e) => setMoTa(e.target.value)}
            placeholder={GOI_Y_MO_TA_PA} />
        </Truong>
      </Khoi>
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
      <p className="m-0 text-[11px] text-slate-500">Gửi Quản lý duyệt · trả lời trong 5 ngày · xem ở Yêu cầu của tôi</p>
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>Huỷ</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={gui}>Gửi Quản lý duyệt</button>
      </div>
    </div>
  );
}
