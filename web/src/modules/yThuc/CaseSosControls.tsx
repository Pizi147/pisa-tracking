import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { FormPa, NgayKhoa } from '../cases/FormPa.tsx';
import type { CaseDetail } from '../cases/CasePanel.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BoiCanh, CanLam, NhomCoSo } from '../../ui/KhuonViec.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ChonNhom } from '../fasttrack/NhanXet.tsx';
import { skillShort } from '../../lib/format.ts';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, INTERVENTION_KIND_LABEL, NHAN_XET_MT_TOI_THIEU, NHAN_XET_TOI_DA,
  dsLoi, duongHoSoHocVien, kiemGhiRoKhac, tenMonNgan, tuanLich, reasonNeedsText,
  datLaiNguoi, khacNguoi, loiFormPa, nguoiCuaPa, nguoiMacDinh, paMoi, paPayload, type GiaTriPa,
  type CaseDismissReason,
} from '@shared/domain/index.ts';

/**
 * CASE TỰ TẠO TỪ SOS (SOS v4, PR-SOS — M7, YC-12.1, 12.3, 12.4, Q28-3; OV-12c khuôn panel v3):
 *   · Case MT: nguyên nhân = nhận xét + nhóm của bài → `XacNhanPaPanel` (bấm thẳng; Sửa PA / Không cần theo dõi trong khối Cần làm);
 *     Case MT cũ bài chưa nhận xét → `GhiNhanXetPanel`.
 *   · Progress Test lớp thường: `XacNhanCasePanel` MỘT bước (nhóm + mô tả + PA Bổ trợ) → PA chạy.
 *   · `KhongTheoDoiForm` → gửi Quản lý duyệt (thẻ Chờ duyệt, 5 ngày) — Case chưa đóng.
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

/** Đầu panel v3 cho việc của một Case: chip hạn (chỉ người làm) · em ↗ (xem hồ sơ, tách khỏi nút làm) · lớp · ngữ cảnh ("MT2 · Reading"). */
function dauCase(data: CaseDetail, lop: string | null | undefined, ngCanh: string, lam: boolean) {
  const st = data.student;
  return {
    han: lam ? <ChipHan loai="xac-minh-sos" han={data.sos?.dueOn ?? data.trangThaiV4?.han ?? null} /> : null,
    dong2: [
      st ? <Link className="font-bold text-slate-100 no-underline hover:underline" to={duongHoSoHocVien(st.id)}>{st.name}<span aria-hidden className="ml-0.5 text-xs">↗</span></Link> : null,
      lop ?? null, ngCanh,
    ],
  };
}
/** Nguyên nhân Case (chính trước) + nhận xét: "1 Kỹ năng làm bài · 2 Quản lý thời gian — "…"". */
function DongNguyenNhan({ issues }: { issues: any[] }) {
  const ds = [...issues].sort((a, b) => (a.role === 'primary' ? -1 : 0) - (b.role === 'primary' ? -1 : 0));
  if (!ds.length) return null;
  const nx = ds[0]?.observation;
  return <><NhomCoSo ds={ds.map((x) => ({ code: x.code, label: x.label }))} />{nx ? <> — “{nx}”</> : null}</>;
}
/** Kết quả gần nhất của Case MT: mốc mở / trượt lại mới nhất có band — "MT2 · R 5.0 · kỳ vọng 5.5". */
function ketQuaGanNhat(data: CaseDetail): string | null {
  const m = [...(data.milestones ?? [])].reverse().find((x: any) => (x.kind === 'opened' || x.kind === 'repeat') && x.band != null);
  if (!m) return null;
  return `MT${m.attemptNo} · ${skillShort(data.topic ?? '')} ${Number(m.band).toFixed(1)}${m.expectation != null ? ` · kỳ vọng ${Number(m.expectation).toFixed(1)}` : ''}`;
}
/** Dòng trạng thái lưu ở chân (chữ + ký hiệu, không chỉ màu). */
function TrangThaiLuu({ tt, onHuy }: { tt: 'nhap' | 'dang' | null; onHuy?: () => void }) {
  if (!tt) return null;
  return (
    <>
      <span>{tt === 'dang' ? 'Đang lưu…' : 'Chưa lưu'}</span>
      <span className="flex-1" />
      {tt === 'nhap' && onHuy && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={onHuy}>Huỷ sửa</button>}
    </>
  );
}

/**
 * XÁC NHẬN CASE — Progress Test lớp thường (OV-12c, mockup panel v3 §4). MỘT bước, MỘT nút: Nhóm nguyên nhân * (chip, thứ tự chọn — 1 = chính) ·
 * Mô tả ngắn * (≥ 15) · Phương án = PA Bổ trợ điền sẵn (FOU chung 2 buổi/tuần GVCN dạy; BE / ELE 1 buổi/tuần/môn GVBM môn), "Sửa" mở ô ngay
 * trong khối (Nội dung · Số buổi · Người dạy — cùng `FormPa`). Lưu: `POST /cases/:id/xac-nhan` → PA Bổ trợ chạy ngay. Case MT không có bước này.
 */
export function XacNhanCasePanel({ data, onXong, ...chung }: ChungPanel & { data: CaseDetail; onXong: () => void }) {
  const toast = useToast();
  const caseId = data.id;
  const topic = data.topic ?? data.category ?? '';
  const ct = data.chuongTrinh ?? null;
  const pa = (data.interventions ?? []).find((x: any) => x.kind === 'bo_tro' && x.status === 'planned') ?? null;
  const goc: GiaTriPa | null = pa ? { ...paMoi(pa.kind), description: pa.description ?? '', soBuoi: pa.soBuoi == null ? '' : String(pa.soBuoi), nguoi: nguoiCuaPa(pa) } : null;
  const [nhom, setNhom] = useState<string[]>([]);
  const [moTa, setMoTa] = useState('');
  const [sua, setSua] = useState(false);
  const [v, setV] = useState<GiaTriPa | null>(goc);
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const loi = [
    ...dsLoi([{ khoa: 'nguyen-nhan', nhan: 'Nhóm nguyên nhân', chon: true }, { khoa: 'mo-ta', nhan: 'Mô tả ngắn', toiThieu: 15 }],
      { 'nguyen-nhan': nhom[0] ?? '', 'mo-ta': moTa }),
    ...(sua && v && goc ? loiFormPa(v, { goc }) : []),
  ];
  const daSua = !!(nhom.length || moTa.trim() || sua);
  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      let paSua: Record<string, unknown> | undefined;
      if (sua && v && goc) {
        const p = paPayload(v);
        paSua = {
          ...(v.description.trim() !== goc.description.trim() ? { description: p.description } : {}),
          ...(v.soBuoi.trim() !== goc.soBuoi.trim() ? { soBuoi: p.soBuoi } : {}),
          ...(khacNguoi(v.nguoi, goc.nguoi) ? datLaiNguoi(v.nguoi) : {}),
        };
      }
      await api.post(`/cases/${caseId}/xac-nhan`, { nhom, moTa: moTa.trim(), ...(paSua && Object.keys(paSua).length ? { pa: paSua } : {}) });
      invalidateCases();
      toast.push('ok', pa ? 'Đã xác nhận Case — PA Bổ trợ bắt đầu từ hôm nay' : 'Đã xác nhận Case');
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const nut = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void luu()}>{busy ? 'Đang lưu…' : 'Xác nhận Case'}</button>;
  return (
    <KhungPanel tieuDe="Xác nhận Case" {...chung} onDong={chung.onClose}
      dau={dauCase(data, chung.lop, `Progress · ${tenMonNgan(ct, topic)}`, true)}
      chan={{ v3: true, chinh: nut, daSua, conThieu: lf.conThieu(loi), dongTren: <TrangThaiLuu tt={busy ? 'dang' : sua ? 'nhap' : null} onHuy={() => { setSua(false); setV(goc); }} /> }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          <div>
            <span id={`nn-${caseId}`} className="mb-1.5 block text-[13px] font-semibold text-slate-300">Nhóm nguyên nhân<span aria-hidden className="text-bad"> *</span></span>
            <div id={lf.oId('nguyen-nhan')} tabIndex={-1}><ChonNhom skill={topic} ct={ct} value={nhom} onChange={setNhom} disabled={busy} nhanId={`nn-${caseId}`} /></div>
            {lf.loiCua(loi, 'nguyen-nhan') && <p className="m-0 mt-1 text-xs text-bad" role="alert">{lf.loiCua(loi, 'nguyen-nhan')}</p>}
          </div>
          <Truong nhan="Mô tả ngắn" batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: 15 }}>
            <textarea className="field w-full" rows={2} {...lf.o(loi, 'mo-ta')} value={moTa} disabled={busy} onChange={(e) => setMoTa(e.target.value)}
              placeholder="Ví dụ: Đọc chậm, đoán nghĩa từ mới yếu; bỏ trống 5 câu cuối phần Reading" />
          </Truong>
          {pa && v && (
            <div>
              <span className="mb-1 block text-[13px] font-semibold text-slate-300">Phương án</span>
              {!sua ? (
                <p className="m-0 flex flex-wrap items-baseline gap-x-2 text-sm text-slate-200">
                  <span>{pa.description}{pa.performer ? ` · ${pa.performer}` : ''}{pa.mocChu ? ` · ${pa.mocChu}` : ''}</span>
                  <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => setSua(true)}>Sửa</button>
                </p>
              ) : (
                <FormPa phang v={v} dat={(p) => setV((x) => (x ? { ...x, ...p } : x))} lf={lf} loi={loi} studentId={data.student?.id} quyChe={{ mocChu: pa.mocChu ?? null }}
                  ngay={<NgayKhoa chu={pa.mocChu ?? 'đến Cuối khoá'} />} />
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
        </CanLam>
        <BoiCanh dong={[['SOS', data.sosLevel ? `SOS ${data.sosLevel} · theo số môn trượt của Progress Test` : null]]} />
      </div>
    </KhungPanel>
  );
}

/**
 * XÁC NHẬN PA — Case MT có nguyên nhân sẵn từ nhận xét (OV-12c, mockup panel v3 §3). Cần làm = đúng PA cần chốt (loại · nội dung · người · mốc):
 * "Xác nhận PA" MỘT bấm (gửi nội dung quy chế nguyên văn) → PA chạy từ hôm nay. "Sửa PA" mở `FormPa` NGAY trong khối (nút chính vẫn "Xác nhận PA":
 * lưu bản sửa + xác nhận một lần; "Huỷ sửa" về bản quy chế). "Không cần theo dõi" mở tại chỗ (gửi Quản lý duyệt).
 */
export function XacNhanPaPanel({ pa, data, onXong, ...chung }: ChungPanel & { pa: PaQuyChe; data: CaseDetail; onXong: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const goc: GiaTriPa = { ...paMoi(pa.kind), description: pa.description ?? '', soBuoi: pa.soBuoi == null ? '' : String(pa.soBuoi), nguoi: nguoiCuaPa(pa) ?? nguoiMacDinh(pa.kind) };
  const [v, setV] = useState<GiaTriPa>(goc);
  const [sua, setSua] = useState(false);
  const [ktd, setKtd] = useState(false);
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const loi = sua ? loiFormPa(v, { toiThieu: 15 }) : [];
  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      const { description, soBuoi } = paPayload(sua ? v : goc);
      /* Người: chỉ gửi khi đổi (người máy gán đã nghỉ mà không đụng thì không bị 400); đổi thì đủ ba khoá — trống = xoá người. */
      await api.post(`/interventions/${pa.id}/xac-nhan-pa`, { description, soBuoi, ...(sua && khacNguoi(v.nguoi, nguoiCuaPa(pa)) ? datLaiNguoi(v.nguoi) : {}) });
      invalidateCases();
      toast.push('ok', 'Đã xác nhận PA — PA bắt đầu từ hôm nay');
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const tenLoai = INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? 'PA theo quy chế';
  const nut = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy || ktd} onClick={() => void luu()}>{busy ? 'Đang lưu…' : 'Xác nhận PA'}</button>;
  const theoLuot = data.nguyenNhanTheoLuot ?? [];
  return (
    <KhungPanel tieuDe="Xác nhận PA" {...chung} onDong={chung.onClose}
      dau={dauCase(data, chung.lop, `MT${data.tenSos?.mt ?? data.attemptNo ?? ''} · ${data.categoryLabel ?? ''}`, true)}
      chan={{ v3: true, chinh: ktd ? undefined : nut, daSua: sua, conThieu: lf.conThieu(loi), dongTren: <TrangThaiLuu tt={busy ? 'dang' : sua ? 'nhap' : null} onHuy={() => { setSua(false); setV(goc); }} /> }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          {ktd ? (
            <KhongTheoDoiForm caseId={data.id} onClose={() => setKtd(false)} onDone={onXong} />
          ) : !sua ? (
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-bold text-slate-100">{tenLoai}</span>
              <span className="text-sm text-slate-200">{pa.description}</span>
              <span className="text-[13px] text-slate-400">{[pa.performer, `từ ${tuanLich(homNay, homNay)}`, pa.mocChu].filter(Boolean).join(' · ')}</span>
            </div>
          ) : (
            <FormPa phang v={v} dat={(p) => setV((x) => ({ ...x, ...p }))} lf={lf} loi={loi} toiThieu={15} studentId={data.student?.id}
              quyChe={{ mocChu: pa.mocChu }} ngay={<NgayKhoa chu={`Tuần này · ${tuanLich(homNay, homNay)}`} />} />
          )}
          {!ktd && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="max-sm:hidden">{nut}</span>
              {sua
                ? <button type="button" className="btn btn-ghost min-h-[44px] font-semibold text-[color:var(--accent)] sm:min-h-0" onClick={() => { setSua(false); setV(goc); }}>Huỷ sửa</button>
                : <button type="button" className="btn btn-ghost min-h-[44px] font-semibold text-[color:var(--accent)] sm:min-h-0" onClick={() => setSua(true)}>Sửa PA</button>}
              {!sua && <button type="button" className="btn btn-ghost min-h-[44px] text-slate-400 sm:min-h-0" onClick={() => setKtd(true)}>Không cần theo dõi…</button>}
            </div>
          )}
        </CanLam>
        <BoiCanh
          dong={[['Nguyên nhân', <DongNguyenNhan issues={data.issues ?? []} />], ['Kết quả gần nhất', ketQuaGanNhat(data)]]}
          them={theoLuot.length > 1 ? (
            <ul className="m-0 list-none space-y-1 p-0">
              {theoLuot.map((x) => <li key={x.attemptId}><b className="font-semibold text-slate-300">{x.luot}</b>: {x.nhom.map((g) => g.label).join(' · ') || '—'}{x.nhanXet ? ` — “${x.nhanXet}”` : ''}</li>)}
            </ul>
          ) : undefined} />
      </div>
    </KhungPanel>
  );
}

/**
 * GHI NHẬN XÉT — Case MT CŨ (trước luật nhận xét bắt buộc) mà bài chưa có nhận xét (OV-12c). Cần làm = Nhận xét * (≥ 10) + Nhóm nguyên nhân *
 * (chip, 1 = chính) của đúng bài, lưu qua đường ghi điểm (`PUT /attempts/:id/scores/:skill`, chỉ hai trường — điểm không đổi). Lưu xong nguyên
 * nhân Case = nhận xét này, Case sang Xác nhận PA. GV đúng kỹ năng bổ sung được cả khi lượt đã hoàn tất (chỉ ô còn thiếu).
 */
export function GhiNhanXetPanel({ data, onXong, ...chung }: ChungPanel & { data: CaseDetail; onXong: () => void }) {
  const toast = useToast();
  const skill = data.topic ?? '';
  const attemptId = data.attemptId;
  const [nx, setNx] = useState('');
  const [nhom, setNhom] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const loi = dsLoi([{ khoa: 'nhan-xet', nhan: 'Nhận xét', toiThieu: NHAN_XET_MT_TOI_THIEU }, { khoa: 'nhom', nhan: 'Nhóm nguyên nhân', chon: true }],
    { 'nhan-xet': nx, nhom: nhom[0] ?? '' });
  const luu = async () => {
    lf.bam();
    if (loi.length > 0 || !attemptId) return;
    setBusy(true);
    try {
      await api.put(`/attempts/${attemptId}/scores/${skill}`, { nhanXet: nx.trim(), nhomNguyenNhan: nhom });
      invalidateCases(); invalidate('/attempts'); invalidate('/classes');
      toast.push('ok', 'Đã lưu nhận xét — Case sang Xác nhận PA');
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const nut = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void luu()}>{busy ? 'Đang lưu…' : 'Lưu nhận xét'}</button>;
  return (
    <KhungPanel tieuDe={`Ghi nhận xét ${data.categoryLabel ?? ''}`.trim()} {...chung} onDong={chung.onClose}
      dau={dauCase(data, chung.lop, `MT${data.tenSos?.mt ?? data.attemptNo ?? ''} · ${data.categoryLabel ?? ''}`, true)}
      chan={{ v3: true, chinh: nut, daSua: !!(nx.trim() || nhom.length), conThieu: lf.conThieu(loi), dongTren: busy ? <span>Đang lưu…</span> : undefined }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          <Truong nhan="Nhận xét" batBuoc phu="Cũng là nguyên nhân của Case" loi={lf.loiCua(loi, 'nhan-xet')} dem={{ co: nx.trim().length, can: NHAN_XET_MT_TOI_THIEU }}>
            <textarea className="field w-full" rows={3} maxLength={NHAN_XET_TOI_DA} {...lf.o(loi, 'nhan-xet')} value={nx} disabled={busy} onChange={(e) => setNx(e.target.value)}
              placeholder="Ví dụ: Nghe phần 3 còn chậm, sai nhiều câu điền số" />
          </Truong>
          <div>
            <span id={`gnx-${data.id}`} className="mb-1.5 block text-[13px] font-semibold text-slate-300">Nhóm nguyên nhân<span aria-hidden className="text-bad"> *</span></span>
            <div id={lf.oId('nhom')} tabIndex={-1}><ChonNhom skill={skill} value={nhom} onChange={setNhom} disabled={busy} nhanId={`gnx-${data.id}`} /></div>
            {lf.loiCua(loi, 'nhom') && <p className="m-0 mt-1 text-xs text-bad" role="alert">{lf.loiCua(loi, 'nhom')}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
        </CanLam>
        <BoiCanh dong={[['Kết quả gần nhất', ketQuaGanNhat(data)]]} />
      </div>
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
