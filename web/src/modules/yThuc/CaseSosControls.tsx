import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { KhungPanel, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import { FormPa, NgayKhoa } from '../cases/FormPa.tsx';
import type { CaseDetail } from '../cases/CasePanel.tsx';
import { NutChon } from '../../ui/ui.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BoiCanh, CanLam, DiemKq, NhomCoSo, NutChu, TrangThaiLuu, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { FormDoiPa, useDoiPa } from '../cases/DoiPa.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ChonNhom, viDuNhanXet } from '../fasttrack/NhanXet.tsx';
import { skillShort } from '../../lib/format.ts';
import {
  CASE_DISMISS_REASONS, CASE_DISMISS_REASON_LABEL, INTERVENTION_KIND_LABEL, NHAN_XET_MT_TOI_THIEU, NHAN_XET_TOI_DA,
  dsLoi, duongHoSoHocVien, kiemGhiRoKhac, tenMonNgan, tuanLich, reasonNeedsText,
  datLaiNguoi, khacNguoi, loiFormPa, nguoiCuaPa, nguoiMacDinh, paMoi, paPayload, type GiaTriPa,
  type CaseDismissReason,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { ChuDich, type NguonDich } from '../../ui/ChuDich.tsx';

/** P14 DICH: ô nhận xét của lượt theo kỹ năng Case — Writing có hai ô (Task 1 / 2) nên không có nút ở dòng gộp. */
const oDich = (attemptId: number, topic: string | null | undefined): NguonDich | null =>
  topic === 'listening' || topic === 'reading' || topic === 'speaking' ? { bang: 'assessment_scores', id: attemptId, cot: 'comment', kyNang: topic } : null;

/**
 * CASE TỰ TẠO TỪ SOS (SOS v4, PR-SOS — M7, YC-12.1, 12.3, 12.4, Q28-3; OV-12c khuôn panel v3):
 *   · Case MT: nguyên nhân = nhận xét + nhóm của bài → `XacNhanPaPanel` (bấm thẳng; Sửa PA / Không cần theo dõi trong khối Cần làm);
 *     Case MT chưa có mô tả (bài không nhận xét) → `MoTaCasePanel`.
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
  /** OV-13b: đề xuất đổi PA mới nhất (chờ / bị từ chối kèm lý do). */
  doiPa?: { trangThai: 'cho' | 'tu_choi'; lyDoTuChoi: string | null; yeuCauId: number } | null;
};

/** Đầu panel v3 cho việc của một Case: chip hạn (chỉ người làm) · em ↗ (xem hồ sơ, tách khỏi nút làm) · lớp · ngữ cảnh ("MT2 · Reading"). */
export function dauCase(data: CaseDetail, lop: string | null | undefined, ngCanh: string, lam: boolean) {
  const st = data.student;
  return {
    han: lam ? <ChipHan loai="xac-minh-sos" han={data.sos?.dueOn ?? data.trangThaiV4?.han ?? null} /> : null, loai: t('VIỆC'),
    dong2: [
      st ? <Link className="font-bold text-slate-100 no-underline hover:underline" to={duongHoSoHocVien(st.id)}>{st.name}<span aria-hidden className="ml-0.5 text-xs">↗</span></Link> : null,
      lop ?? null, ngCanh,
    ],
  };
}
/** Nguyên nhân Case (chính trước) + nhận xét: "1 Kỹ năng làm bài · 2 Quản lý thời gian — "…"". */
/** `attemptId`: lượt của Case MT — nút Dịch cho nhận xét GV phụ trách (P14). */
export function DongNguyenNhan({ issues, attemptId = null }: { issues: any[]; attemptId?: number | null }) {
  const ds = [...issues].sort((a, b) => (a.role === 'primary' ? -1 : 0) - (b.role === 'primary' ? -1 : 0));
  if (!ds.length) return null;
  const nx = ds[0]?.observation;
  const pt = ds[0]?.nhanXetPhuTrach;   // OV-13k: Case MT Speaking — nhận xét GV phụ trách (lưu riêng)
  return (
    <>
      <NhomCoSo ds={ds.map((x) => ({ code: x.code, label: x.label }))} />{nx ? <> — “<ChuDich chu={nx} nguon={{ bang: 'case_issues', id: ds[0].id, cot: 'observation' }} />”</> : null}
      {pt ? <span className="mt-1 block text-slate-300"><span className="text-slate-400">{t('Nhận xét GV phụ trách')}:</span> “<ChuDich chu={pt} nguon={attemptId ? { bang: 'assessment_scores', id: attemptId, cot: 'nhan_xet_phu_trach', kyNang: 'speaking' } : null} />”</span> : null}
    </>
  );
}
/** Kết quả gần nhất của Case MT: mốc mở / trượt lại mới nhất có band — "MT2 · R ✗ 5.0 · kỳ vọng 5.5" (điểm tô màu kết quả, P2). */
export function ketQuaGanNhat(data: CaseDetail): ReactNode {
  const m = [...(data.milestones ?? [])].reverse().find((x: any) => (x.kind === 'opened' || x.kind === 'repeat') && x.band != null);
  if (!m) return null;
  const kv = m.expectation != null ? Number(m.expectation) : null;
  return <>MT{m.attemptNo} · {skillShort(data.topic ?? '')} <DiemKq diem={Number(m.band)} kyVong={kv} />{kv != null ? t(' · kỳ vọng {toFixed}', { toFixed: kv.toFixed(1) }) : ''}</>;
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
  const [moTa, setMoTa] = useNhap('xac-nhan-case-mo-ta', '');
  const xoaNhap = useXoaNhap();
  const [sua, setSua] = useState(false);
  const [v, setV] = useState<GiaTriPa | null>(goc);
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const loi = [
    ...dsLoi([{ khoa: 'nguyen-nhan', nhan: t('Nhóm nguyên nhân'), chon: true }, { khoa: 'mo-ta', nhan: t('Mô tả ngắn'), toiThieu: 15 }],
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
      xoaNhap();
      toast.push('ok', pa ? t('Đã xác nhận Case — PA Bổ trợ bắt đầu từ hôm nay') : t('Đã xác nhận Case'));
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const nut = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Xác nhận Case')}</button>;
  return (
    <KhungPanel tieuDe={t('Xác nhận Case')} {...chung} onDong={chung.onClose}
      dau={dauCase(data, chung.lop, `Progress · ${tenMonNgan(ct, topic)}`, true)}
      chan={{ v3: true, chinh: nut, daSua, conThieu: lf.conThieu(loi), dongTren: busy || sua ? <TrangThaiLuu tt={busy ? 'dang' : 'nhap'} onHuy={() => { setSua(false); setV(goc); }} /> : undefined }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          <div>
            <span id={`nn-${caseId}`} className="mb-1.5 block text-[13px] font-semibold text-slate-300">{t('Nhóm nguyên nhân')}<span aria-hidden className="text-bad"> *</span></span>
            <div id={lf.oId('nguyen-nhan')} tabIndex={-1}><ChonNhom skill={topic} ct={ct} value={nhom} onChange={setNhom} disabled={busy} nhanId={`nn-${caseId}`} /></div>
            {lf.loiCua(loi, 'nguyen-nhan') && <p className="m-0 mt-1 text-xs text-bad" role="alert">{lf.loiCua(loi, 'nguyen-nhan')}</p>}
          </div>
          <Truong nhan={t('Mô tả ngắn')} batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: 15 }}>
            <textarea className="field w-full" rows={2} {...lf.o(loi, 'mo-ta')} value={moTa} disabled={busy} onChange={(e) => setMoTa(e.target.value)}
              placeholder={t('Ví dụ: Đọc chậm, đoán nghĩa từ mới yếu; bỏ trống 5 câu cuối phần Reading')} />
          </Truong>
          {pa && v && (
            <div>
              <span className="mb-1 block text-[13px] font-semibold text-slate-300">{t('Phương án')}</span>
              {!sua ? (
                <p className="m-0 flex flex-wrap items-baseline gap-x-2 text-sm text-slate-200">
                  <span>{pa.description}{pa.performer ? ` · ${pa.performer}` : ''}{pa.mocChu ? ` · ${dich(pa.mocChu)}` : ''}</span>
                  {/* Rà #389: chỉ người sửa được PA (`ghiDuoc` = luật Sửa PA) — FOU PA chung do GVCN dạy, GVBM không sửa (không để cả lần xác nhận bị từ chối). */}
                  {pa.ghiDuoc && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0" onClick={() => setSua(true)}>{t('Sửa')}</button>}
                </p>
              ) : (
                <FormPa phang v={v} dat={(p) => setV((x) => (x ? { ...x, ...p } : x))} lf={lf} loi={loi} studentId={data.student?.id} quyChe={{ mocChu: pa.mocChu ?? null }}
                  ngay={<NgayKhoa chu={pa.mocChu ?? t('đến Cuối khoá')} />} />
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
        </CanLam>
        <BoiCanh dong={[['SOS', data.sosLevel ? t('SOS {sosLevel} · theo số môn trượt của Progress Test', { sosLevel: data.sosLevel }) : null]]} />
      </div>
    </KhungPanel>
  );
}

/**
 * XÁC NHẬN PA — luôn mở panel (OV-13b, mockup OV-13 §9; chủ SP 15/10): PA quy chế điền sẵn loại + mốc; Cần làm = Nội dung / hướng dẫn * (gợi ý
 * `GOI_Y_MO_TA_PA`, ≥ 15) · Người dạy (loại có người) · Số buổi (Tutor / Tự học) · Bắt đầu *; nút chính "Xác nhận PA" + "Đề xuất PA khác…" (PA mới +
 * lý do → Quản lý duyệt; PA gốc chờ, chưa chạy) + "Không cần theo dõi…". QL từ chối PA khác → dòng lý do ở đầu, việc quay lại.
 */
export function XacNhanPaPanel({ pa, data, onXong, ...chung }: ChungPanel & { pa: PaQuyChe; data: CaseDetail; onXong: (x?: DaLuuPanel) => void }) {
  const { homNay, ngan } = useNgayNghiepVu();
  const goc: GiaTriPa = { ...paMoi(pa.kind), soBuoi: pa.soBuoi == null ? '' : String(pa.soBuoi), nguoi: nguoiCuaPa(pa) ?? nguoiMacDinh(pa.kind) };
  const [v, setV] = useState<GiaTriPa>(goc);
  const [batDau, setBatDau] = useState(homNay);
  const [cheDo, setCheDo] = useState<'xac-nhan' | 'doi' | 'ktd'>('xac-nhan');
  const doi = useDoiPa(pa.kind);
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  const lf = useLoiForm();
  const loi = cheDo === 'doi' ? doi.loi : [
    ...loiFormPa(v, { toiThieu: 15, batBuoc: true }),
    ...(batDau ? [] : [{ khoa: 'bat-dau', nhan: t('Bắt đầu'), lyDo: t('Chọn ngày bắt đầu') }]),
  ];
  const tenLoai = dich(INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? t('PA theo quy chế'));
  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true); setLoiLuu(null);
    try {
      if (cheDo === 'doi') {
        const ct = await api.post<any>(`/interventions/${pa.id}/de-xuat-doi-pa`, doi.payload());
        invalidateCases();
        const yc = (ct?.interventions ?? []).find((x: any) => x.id === pa.id)?.doiPa?.yeuCauId ?? null;
        onXong({
          chu: t('Đã gửi Quản lý duyệt'),
          phu: t('{moi} thay {goc} · Case "Chờ duyệt đổi PA"', { moi: dich(INTERVENTION_KIND_LABEL[doi.v.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? doi.v.kind), goc: tenLoai }),
          /* Hoàn tác = Rút đề xuất (người gửi rút được khi QL chưa trả lời). */
          hoanTac: yc ? async () => { await api.post(`/yeu-cau/${yc}/rut`); invalidateCases(); } : undefined,
        });
      } else {
        const { description, soBuoi } = paPayload(v);
        /* Người: chỉ gửi khi đổi (người máy gán đã nghỉ mà không đụng thì không bị 400); đổi thì đủ ba khoá — trống = xoá người. */
        const ct = await api.post<any>(`/interventions/${pa.id}/xac-nhan-pa`, {
          description, soBuoi, startedDate: batDau, ...(khacNguoi(v.nguoi, nguoiCuaPa(pa)) ? datLaiNguoi(v.nguoi) : {}),
        });
        invalidateCases();
        const iv = (ct?.interventions ?? []).find((x: any) => x.id === pa.id);
        onXong({
          chu: t('Đã xác nhận PA'),
          phu: [tenLoai, t('từ {tuanLich}', { tuanLich: tuanLich(batDau, homNay) }), iv?.actionDue ? t('hạn kết quả {ngay}', { ngay: ngan(iv.actionDue) }) : null].filter(Boolean).join(' · '),
        });
      }
    } catch (e: any) { setLoiLuu(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  const nut = (
    <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void luu()}>
      {busy ? (cheDo === 'doi' ? t('Đang gửi…') : t('Đang lưu…')) : cheDo === 'doi' ? t('Gửi Quản lý duyệt') : t('Xác nhận PA')}
    </button>
  );
  const daSua = cheDo === 'doi' ? doi.daSua : !!v.description.trim();
  const theoLuot = data.nguyenNhanTheoLuot ?? [];
  const tuChoi = pa.doiPa?.trangThai === 'tu_choi' ? pa.doiPa : null;
  const quyChe = [t('quy chế'), data.sosLevel ? `SOS ${data.sosLevel}` : null].filter(Boolean).join(' ');
  return (
    <KhungPanel tieuDe={t('Xác nhận PA')} {...chung} onDong={chung.onClose}
      dau={dauCase(data, chung.lop, [`MT${data.tenSos?.mt ?? data.attemptNo ?? ''}`, data.categoryLabel ?? '', data.sosLevel ? `SOS ${data.sosLevel}` : null].filter(Boolean).join(' · '), true)}
      chan={{ v3: true, chinh: cheDo === 'ktd' ? undefined : nut, daSua, conThieu: lf.conThieu(loi),
        dongTren: busy || loiLuu || daSua ? <TrangThaiLuu tt={busy ? 'dang' : loiLuu ? 'loi' : 'nhap'} loi={loiLuu} onThuLai={() => void luu()} /> : undefined }}>
      <div className="flex flex-col gap-5 pt-4">
        {tuChoi && (
          <p className="m-0 rounded-lg bg-late-bg px-3 py-2 text-[13px] text-slate-200" role="status">
            <b className="font-semibold text-late">{t('QL từ chối PA khác')}</b>{tuChoi.lyDoTuChoi ? ` · “${tuChoi.lyDoTuChoi}”` : ''}
          </p>
        )}
        <CanLam>
          {cheDo === 'ktd' ? (
            <KhongTheoDoiForm caseId={data.id} onClose={() => setCheDo('xac-nhan')} onDone={() => onXong({ chu: t('Đã gửi Quản lý duyệt'), phu: t('Không cần theo dõi') })} />
          ) : cheDo === 'doi' ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-slate-100">{t('Đề xuất PA khác')}</span>
                <span className="flex-1" />
                <NutChu onClick={() => { setCheDo('xac-nhan'); lf.datLai(); }}>{t('‹ Xác nhận PA gốc')}</NutChu>
              </div>
              <FormDoiPa d={doi} lf={lf} studentId={data.student?.id} chuNgay={t('ngày QL duyệt')} />
              <p className="m-0 text-xs text-slate-400">{t('Nếu gửi: {goc} chờ, chưa chạy · Case "Chờ duyệt đổi PA"', { goc: tenLoai })}</p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[15px] font-bold text-slate-100">{tenLoai}</span>
                <span className="text-[13px] text-slate-400">{[quyChe, pa.mocChu].filter(Boolean).join(' · ')}</span>
              </div>
              <FormPa phang batBuoc v={v} dat={(p) => setV((x) => ({ ...x, ...p }))} lf={lf} loi={loi} toiThieu={15} studentId={data.student?.id}
                ngay={(
                  <Truong nhan={t('Bắt đầu')} batBuoc loi={lf.loiCua(loi, 'bat-dau')}>
                    <ONgay kieu="ngay" value={batDau} onChange={setBatDau} toiThieu={homNay} ariaLabel={t('Bắt đầu')} id={lf.oId('bat-dau')} />
                  </Truong>
                )} />
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="max-sm:hidden">{nut}</span>
                <NutChu onClick={() => { setCheDo('doi'); lf.datLai(); }}>{t('Đề xuất PA khác…')}</NutChu>
                <button type="button" className="btn btn-ghost min-h-[44px] text-slate-400 sm:min-h-0" onClick={() => setCheDo('ktd')}>{t('Không cần theo dõi…')}</button>
              </div>
            </>
          )}
        </CanLam>
        <BoiCanh
          dong={[[t('Nguyên nhân'), <DongNguyenNhan issues={data.issues ?? []} attemptId={data.attemptId} />], [t('Kết quả gần nhất'), ketQuaGanNhat(data)]]}
          them={theoLuot.length > 1 ? (
            <ul className="m-0 list-none space-y-1 p-0">
              {theoLuot.map((x) => <li key={x.attemptId}><b className="font-semibold text-slate-300">{x.luot}</b>: {x.nhom.map((g) => g.label).join(' · ') || '—'}{x.nhanXet ? <> — “<ChuDich chu={x.nhanXet} nguon={oDich(x.attemptId, data.topic)} />”</> : ''}{x.nhanXetPhuTrach ? <> · {t('Nhận xét GV phụ trách')}: “<ChuDich chu={x.nhanXetPhuTrach} nguon={{ bang: 'assessment_scores', id: x.attemptId, cot: 'nhan_xet_phu_trach', kyNang: 'speaking' }} />”</> : ''}</li>)}
            </ul>
          ) : undefined} />
      </div>
    </KhungPanel>
  );
}

/**
 * MÔ TẢ CASE (MO-TA-CASE, N8 — chủ SP 27/10): nhận xét bài KHÔNG bắt buộc; Case MT chưa có mô tả (bài không nhận xét) → GV phụ trách kỹ năng ghi
 * Mô tả * (≥ 10) + Nhóm nguyên nhân * (chip, 1 = chính) THẲNG vào Case (`PATCH /cases/:id` — `nhom` + `observation`, như Sửa Case: mô tả riêng, nhận xét
 * sau không đè). Bài không bị ghi nhận xét. Lưu xong Case sang Xác nhận PA. `luc` cũ (Case vừa có mô tả từ nhận xét) → 409: tự tải lại Case, chữ đang gõ giữ.
 */
export function MoTaCasePanel({ data, onXong, ...chung }: ChungPanel & { data: CaseDetail; onXong: () => void }) {
  const toast = useToast();
  const skill = data.topic ?? '';
  const [nx, setNx] = useNhap('ghi-nhan-xet', '');
  const xoaNhap = useXoaNhap();
  const [nhom, setNhom] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [luc, setLuc] = useState<string | null | undefined>(data.capNhatLuc);
  const lf = useLoiForm();
  const loi = dsLoi([{ khoa: 'nhan-xet', nhan: t('Mô tả'), toiThieu: NHAN_XET_MT_TOI_THIEU }, { khoa: 'nhom', nhan: t('Nhóm nguyên nhân'), chon: true }],
    { 'nhan-xet': nx, nhom: nhom[0] ?? '' });
  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      await api.patch(`/cases/${data.id}`, { luc, nhom, observation: nx.trim() });
      invalidateCases();
      xoaNhap();
      toast.push('ok', t('Đã lưu mô tả — Case sang Xác nhận PA'));
      onXong();
    } catch (e: any) {
      /* D8: Case vừa đổi → tải lại Case (thấy mô tả mới nếu có); chữ đang gõ giữ trong kho nháp. */
      if (e instanceof ApiError && e.status === 409) { setLuc(e.details?.luc ?? null); invalidateCases(); }
      toast.push('error', e.message);
    } finally { setBusy(false); }
  };
  const nut = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu mô tả')}</button>;
  return (
    <KhungPanel tieuDe={t('Mô tả Case {x}', { x: data.categoryLabel ?? '' }).trim()} {...chung} onDong={chung.onClose}
      dau={dauCase(data, chung.lop, `MT${data.tenSos?.mt ?? data.attemptNo ?? ''} · ${data.categoryLabel ?? ''}`, true)}
      chan={{ v3: true, chinh: nut, daSua: !!(nx.trim() || nhom.length), conThieu: lf.conThieu(loi), dongTren: busy ? <span>{t('Đang lưu…')}</span> : undefined }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          <Truong nhan={t('Mô tả')} batBuoc phu={t('Nguyên nhân của Case — bài không cần nhận xét')} loi={lf.loiCua(loi, 'nhan-xet')} dem={{ co: nx.trim().length, can: NHAN_XET_MT_TOI_THIEU }}>
            <textarea className="field w-full" rows={3} maxLength={NHAN_XET_TOI_DA} {...lf.o(loi, 'nhan-xet')} value={nx} disabled={busy} onChange={(e) => setNx(e.target.value)}
              placeholder={viDuNhanXet(skill)} />
          </Truong>
          <div>
            <span id={`gnx-${data.id}`} className="mb-1.5 block text-[13px] font-semibold text-slate-300">{t('Nhóm nguyên nhân')}<span aria-hidden className="text-bad"> *</span></span>
            <div id={lf.oId('nhom')} tabIndex={-1}><ChonNhom skill={skill} value={nhom} onChange={setNhom} disabled={busy} nhanId={`gnx-${data.id}`} /></div>
            {lf.loiCua(loi, 'nhom') && <p className="m-0 mt-1 text-xs text-bad" role="alert">{lf.loiCua(loi, 'nhom')}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
        </CanLam>
        <BoiCanh dong={[[t('Kết quả gần nhất'), ketQuaGanNhat(data)]]} />
      </div>
    </KhungPanel>
  );
}

/**
 * SV-NX-CASE (N8 ③): XÁC NHẬN CASE SPEAKING CHẤM CHÉO — nhận xét của người chấm chéo hiện sẵn; GV phụ trách S chọn dùng nó làm mô tả, giữ mô tả đang có, hoặc
 * viết mô tả khác (≥ 10 ký tự). Lưu xong việc "Xác nhận Case" hết. Máy chủ: `POST /cases/:id/xac-nhan-s`.
 */
export function XacNhanSPanel({ data, onXong, ...chung }: ChungPanel & { data: CaseDetail; onXong: () => void }) {
  const toast = useToast();
  const x = data.choXacNhanS!;
  const chinh = (data.issues ?? []).find((i: any) => i.role === 'primary');
  const moTaCu = chinh?.observation ?? null;
  const idMoTa = (chinh?.id ?? null) as number | null;
  const [cach, setCach] = useState<'dung' | 'giu' | 'viet'>(x.nhanXet ? 'dung' : 'viet');
  const [moTa, setMoTa] = useNhap(`xac-nhan-s-${data.id}`, '');
  const xoaNhap = useXoaNhap();
  const [busy, setBusy] = useState(false);
  const lf = useLoiForm();
  const loi = dsLoi(cach === 'viet' ? [{ khoa: 'mo-ta', nhan: t('Mô tả'), toiThieu: NHAN_XET_MT_TOI_THIEU }] : [], { 'mo-ta': moTa });
  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      await api.post(`/cases/${data.id}/xac-nhan-s`, { cach, ...(cach === 'viet' ? { moTa: moTa.trim() } : {}) });
      invalidateCases(); invalidate('/attempts');
      xoaNhap();
      toast.push('ok', t('Đã xác nhận Case'));
      onXong();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  const nut = <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Xác nhận Case')}</button>;
  const lua = (k: 'dung' | 'giu' | 'viet', chu: string) => <NutChon chon={cach === k} onClick={() => setCach(k)}>{chu}</NutChon>;
  return (
    <KhungPanel tieuDe={t('Xác nhận Case {x}', { x: data.categoryLabel ?? '' }).trim()} {...chung} onDong={chung.onClose}
      dau={dauCase(data, chung.lop, `${x.luot} · ${data.categoryLabel ?? ''}`, true)}
      chan={{ v3: true, chinh: nut, daSua: cach === 'viet' && !!moTa.trim(), conThieu: lf.conThieu(loi), dongTren: busy ? <span>{t('Đang lưu…')}</span> : undefined }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          <div className="text-sm">
            <span className="block text-[13px] font-semibold text-slate-300">{t('Nhận xét chấm chéo')}{x.nguoiCham ? ` · ${x.nguoiCham}` : ''}</span>
            <p className="m-0 mt-1 whitespace-pre-wrap break-words text-slate-200">{x.nhanXet ? <ChuDich chu={x.nhanXet} nguon={data.attemptId ? { bang: 'assessment_scores', id: data.attemptId, cot: 'comment', kyNang: 'speaking' } : null} /> : t('Chưa có nhận xét')}</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('Mô tả Case')}>
            {x.nhanXet && lua('dung', moTaCu ? t('Dùng làm mô tả (thay mô tả đang có)') : t('Dùng làm mô tả'))}
            {moTaCu && lua('giu', t('Giữ mô tả đang có'))}
            {lua('viet', t('Viết mô tả khác'))}
          </div>
          {cach !== 'viet' && moTaCu && (
            <div className="text-sm">
              <span className="block text-[13px] font-semibold text-slate-300">{cach === 'dung' ? t('Mô tả đang có — sẽ thay bằng nhận xét chấm chéo (cả nhóm nguyên nhân theo bài)') : t('Mô tả đang có')}</span>
              <p className="m-0 mt-1 whitespace-pre-wrap break-words text-slate-300"><ChuDich chu={moTaCu} nguon={idMoTa ? { bang: 'case_issues', id: idMoTa, cot: 'observation' } : null} /></p>
            </div>
          )}
          {cach === 'viet' && (
            <Truong nhan={t('Mô tả')} batBuoc loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: NHAN_XET_MT_TOI_THIEU }}>
              <textarea className="field w-full" rows={3} maxLength={NHAN_XET_TOI_DA} {...lf.o(loi, 'mo-ta')} value={moTa} disabled={busy} onChange={(e) => setMoTa(e.target.value)}
                placeholder={viDuNhanXet('speaking')} />
            </Truong>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 max-sm:hidden">{nut}</div>
        </CanLam>
        <BoiCanh dong={[[t('Kết quả gần nhất'), ketQuaGanNhat(data)]]} />
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
  const thieu = !reason ? t('Chọn một lý do.') : null;

  const gui = async () => {
    setDaBam(true);
    if (thieu || loiGhiRo) return;
    setBusy(true);
    try {
      await api.post(`/cases/${caseId}/dismiss`, { reasonCode: reason, reasonText: reasonNeedsText(reason) ? text.trim() : undefined });
      invalidateCases();
      toast.push('ok', t('Đã gửi Quản lý duyệt — xem ở Yêu cầu của tôi'));
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2 rounded-lg p-2.5" style={{ background: 'var(--surface-2)' }} role="group" aria-label={t('Không cần theo dõi')}>
      <p className="m-0 text-xs text-slate-300">{t('Không cần theo dõi Case này vì:')}</p>
      <div className="flex flex-wrap gap-1.5">
        {CASE_DISMISS_REASONS.map((r) => (
          <NutChon key={r} nho chon={reason === r} onClick={() => setReason(r)}>
            {CASE_DISMISS_REASON_LABEL[r as CaseDismissReason]}
          </NutChon>
        ))}
      </div>
      <OKhac hien={reasonNeedsText(reason)} value={text} onChange={setText} goiY={t('Ví dụ: Em nghỉ ốm cả tuần Test')} loi={daBam ? loiGhiRo : null} />
      {daBam && thieu && <p className="m-0 text-xs text-bad" role="alert">{thieu}</p>}
      <p className="m-0 text-xs text-slate-500">{t('Gửi Quản lý duyệt · trả lời trong 5 ngày · xem ở Yêu cầu của tôi')}</p>
      <div className="flex gap-1.5">
        <button type="button" className="btn btn-sm" onClick={onClose} disabled={busy}>{t('Đóng')}</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={gui}>{t('Gửi Quản lý duyệt')}</button>
      </div>
    </div>
  );
}
