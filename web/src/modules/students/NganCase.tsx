import { useContext, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';
import { ApiError, api, invalidate } from '../../lib/api.ts';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { DauViecCongViec, KhungPanel, KhungTrongCot } from '../../ui/KhungPanel.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { URGENCY_LABEL, URGENCY_LEVELS, caseTopicsFor, chuPhuHuynh, duongHoSoHocVien, tenMon, tenMonNgan, tuanLich, viewTuMa, type DeadlineKind } from '@shared/domain/index.ts';
import { XemCha, useXem } from '../../lib/quayLai.ts';
import { useSession } from '../../lib/session.tsx';
import { ThanCase, tenNganCase, type BaoThanCase, type CaseDetail, type DichCase, type ViewCase } from '../cases/CasePanel.tsx';
import { BaoLuuCase, DaiDaXoa, GiaTriSua, gioLuu, type TtLuuCase } from '../cases/TaiCho.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { ViecVuaLuu, type DaLuuPanel } from '../../ui/KhuonViec.tsx';
import { t } from '@shared/i18n/index.ts';

export type { ViewCase };

/**
 * PANEL CASE MỘT TUYẾN (CASE-PA-UI, mockup `thiet-ke/v16/case-pa.html` a–k, chủ SP duyệt 06/11 #1040) — MỌI lối vào (Công việc, HV & Lớp, hồ sơ HV, hồ sơ lớp,
 * Test, Phân tích, Chờ duyệt, chuông, bảng Case) mở CÙNG panel này; `viec` / `paId` chỉ quyết phần nào mở sẵn + cuộn tới (form việc nằm ngay trong thẻ PA /
 * mục — không view riêng, không panel lồng panel). Tải `/cases/{id}` MỘT lần; lưu tại chỗ thay dữ liệu bằng Case máy chủ trả (không tải lại).
 * Trong cột hồ sơ HV (`KhungTrongCot`, N33 ①): cùng thân, không vỏ, không chân.
 */
export function NganCase(p: Parameters<typeof ThanNganCase>[0]) {
  /* Đổi Case khi panel còn mở (thông báo, đổi `?case=`) → dựng lại — form, chữ của Case trước không mang sang Case sau. */
  return <ThanNganCase key={p.caseId} {...p} />;
}

function ThanNganCase({ caseId, paId, viec, viecBanDau, paViec = null, hocVien, lop, onClose, onChanged, veNguon, onTiep, kyNangTiep = null }: {
  /** U03 A2: Case kỹ năng kế của em — Ghi kết quả có "Lưu · kỹ năng tiếp ›". */
  kyNangTiep?: { ten: string; di: () => void } | null;
  /** Giữ chữ ký cũ (nơi gọi chưa đổi) — nút việc ở dòng tóm tắt cột hồ sơ HV; panel v16 không còn nút việc riêng ở chân. */
  anViecChinh?: boolean;
  /** PA của việc đang mở (panel việc) — thẻ đó viền nhấn, mở sẵn. */
  paViec?: number | null;
  caseId: number; paId?: number | null;
  viec?: 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh' | 'tra-loi' | 'xac-nhan' | 'xac-nhan-pa' | 'ghi-nhan-xet';
  viecBanDau?: ViewCase;
  hocVien?: string | null; lop?: string | null;
  onClose: () => void; onChanged?: () => void;
  /** Nơi mở giữ view bằng state (Panel một em, panel việc) — "‹ {tên em}" về đúng nơi đó. */
  veNguon?: { nhan: string; onClick: () => void };
  /** Việc kế của danh sách nơi mở (Công việc) — nút chính "Việc tiếp ›" ở chân. */
  onTiep?: (() => void) | null;
}) {
  const { homNay } = useNgayNghiepVu();
  const vai = useSession().session?.roles ?? [];
  const { data, error, reload, setData } = useApi<CaseDetail>(`/cases/${caseId}`);
  const trongCot = useContext(KhungTrongCot);
  const dauCv = useContext(DauViecCongViec);
  const chuoi = useContext(XemCha);
  const cv = useContext(ViecVuaLuu);
  const xem = useXem({ dau: ['case'] });
  const [luu, setLuu] = useState<TtLuuCase | null>(null);
  const [formMo, setFormMo] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState<DaLuuPanel | null>(null);
  const [daXoa, setDaXoa] = useState<{ thungRacId: number | null; ten: string; soPa: number } | null>(null);
  const [suaTen, setSuaTen] = useState(false);
  /* Lối vào → phần mở sẵn (v16 i2). Đường cũ trên URL (`?panel=ghi-ket-qua:12`) vẫn mở đúng phần. */
  const [dich] = useState<DichCase | null>(() => {
    const v = (viecBanDau ?? viewTuMa(xem.ds[xem.ds.length - 1] ?? '') ?? null) as ViewCase | null;
    if (v?.loai === 'ghi-ket-qua') return { loai: 'ghi-ket-qua', paId: v.paId };
    if (v?.loai === 'xac-nhan-pa') return { loai: 'xac-nhan-pa', paId: v.paId };
    if (v?.loai === 'them-pa' || v?.loai === 'hoan-thanh') return { loai: v.loai };
    if (v?.loai === 'ghi-nhan-xet' || v?.loai === 'xac-nhan-s') return { loai: 'mo-ta' };
    if (viec === 'ghi-ket-qua' && paId) return { loai: 'ghi-ket-qua', paId };
    if (viec === 'xac-nhan-pa' && paId) return { loai: 'xac-nhan-pa', paId };
    if (viec === 'them-pa' || viec === 'hoan-thanh') return { loai: viec };
    if (viec === 'ghi-nhan-xet') return { loai: 'mo-ta' };
    if (paId ?? paViec) return { loai: 'pa', paId: (paId ?? paViec)! };
    return null;
  });
  const quayLai = veNguon ?? (xem.ten !== null ? { nhan: xem.ten, onClick: xem.lui } : undefined);
  const lamMoi = () => { reload(); onChanged?.(); };

  if (error) {
    return (
      <KhungPanel hd="ngan-case" tieuDe="Case" hocVien={hocVien} lop={lop} onDong={onClose} quayLai={quayLai}>
        <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
      </KhungPanel>
    );
  }
  if (!data) {
    return (
      <KhungPanel hd="ngan-case" tieuDe="Case" hocVien={hocVien} lop={lop} onDong={onClose} quayLai={quayLai}>
        <div className="pt-3"><Skeleton rows={6} /></div>
      </KhungPanel>
    );
  }

  const vw = data.viewer;
  const canDong = data.status !== 'done';
  const em = data.student ? { id: data.student.id, ten: data.student.name } : null;
  const tenCase = data.tenSos ? [tenNganCase(data), data.tenSos.mt ? `MT${data.tenSos.mt}` : null].filter(Boolean).join(' · ') : (data.title ?? tenNganCase(data));
  const v = data.viecTiep ?? null;
  const sua = !!vw.coTheSua && canDong;
  const bao: BaoThanCase = { formMo: setFormMo, daLuu: (x) => { setDaLuu(x); setLuu({ tt: 'da', luc: gioLuu() }); } };

  /* ─── đầu panel (v16 `.pn-h1` · `.pn-tieu` · `.pn-ngu`): loại việc · tên Case (bấm để sửa tên · kỹ năng · mức) + SOS + hạn · em (link hồ sơ) · lớp · mở W… */
  const tieu = (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
      <GiaTriSua kieu="go" tieu nhan={t('Sửa tên Case, kỹ năng')} sua={sua} mo={suaTen} onClick={() => setSuaTen(!suaTen)}>{tenCase}</GiaTriSua>
      {data.sosLevel ? <ChipSos muc={data.sosLevel} tinh /> : null}
    </span>
  );
  const dau = {
    loai: dauCv ? undefined : canDong ? t('CASE HỌC THUẬT') : t('CASE HỌC THUẬT · ĐÃ XONG'),
    tieu,
    han: canDong && v?.han && v.loaiHan ? <ChipHan loai={v.loaiHan as DeadlineKind} han={v.han} /> : null,
    dong2: [
      em ? <Link className="font-semibold text-slate-100 no-underline hover:underline" to={duongHoSoHocVien(em.id)}>{em.ten}</Link> : hocVien ?? null,
      lop ?? null,
      t('mở {tuan}', { tuan: tuanLich(data.detectedAt, homNay) }),
      data.reportedBy ? t('{ten} báo', { ten: data.reportedBy }) : null,
    ].filter(Boolean) as ReactNode[],
  };

  /* ─── chân (v16 `.pn-chan`): trạng thái lưu · "Tiếp: …" · Đóng · Việc tiếp › (form trong thẻ đang mở → Việc tiếp thành nút phụ, chân nói "● … chưa lưu"). */
  const tiepCase = chuoi?.caseTiep?.xong ? chuoi.caseTiep : null;
  const trai = formMo ? <span className="tt-luu nhap">● {t('{form} chưa lưu · nháp giữ trên máy', { form: formMo })}</span>
    : luu?.tt === 'dang' ? <span className="tt-luu dang">{t('Đang lưu…')}</span>
    : luu?.tt === 'loi' ? <span className="tt-luu loi">⚠ {t('Chưa lưu được')}</span>
    : luu?.tt === 'da' ? <span className="tt-luu da">✓ {t('Đã lưu {luc}', { luc: luu.luc ?? '' })}</span>
    : canDong && (vw.canEdit || vw.coTheSua) ? <span className="text-faint">{t('Tự lưu')}</span> : null;
  const nutTiep = onTiep
    ? <button type="button" className={`btn ${formMo ? '' : 'btn-primary'} min-h-[44px] sm:min-h-0`} onClick={() => { if (daLuu && cv) cv.bao(daLuu); onTiep(); }}>{t('Việc tiếp ›')}</button>
    : tiepCase?.di ? <button type="button" className={`btn ${formMo ? '' : 'btn-primary'} min-h-[44px] sm:min-h-0`} onClick={tiepCase.di}>{t('Case tiếp ›')}</button>
    : tiepCase ? <span className="text-[13px] text-slate-400">{t('Hết Case chờ trong danh sách')}</span> : null;
  const chan = trongCot ? undefined : {
    huy: null, trai,
    phu: <>{onTiep && cv?.ten && <span className="text-[13px] text-faint max-sm:hidden">{t('Tiếp: {ten}', { ten: cv.ten })}</span>}
      <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose}>{t('Đóng')}</button></>,
    chinh: nutTiep ?? undefined,
  };

  const ph = data.student?.phuHuynh ?? null;
  const laTvvCx = vai.includes('consultant') || vai.includes('cx');
  return (
    <BaoLuuCase.Provider value={setLuu}>
      <KhungPanel hd="ngan-case" tieuDe={tenCase} hocVien={hocVien ?? data.student?.name ?? null} lop={lop} onDong={onClose} quayLai={quayLai} anDau={trongCot}
        rong="rong" dau={trongCot ? undefined : dau} chan={chan}>
        {trongCot && sua && <div className="pt-2.5">{tieu}</div>}
        {suaTen && sua && <SuaTenCase data={data} onDoi={(d) => { setData(d); invalidate('/my-work'); invalidate('/students'); onChanged?.(); }} onDong={() => setSuaTen(false)} />}
        {daXoa ? (
          <div className="cs-than pt-4">
            <DaiDaXoa chu={<>{t('Đã xoá Case')} <b>{daXoa.ten}</b>{daXoa.soPa ? ` ${t('cùng {n} PA', { n: daXoa.soPa })}` : ''}</>} thungRacId={daXoa.thungRacId}
              onKhoiPhuc={() => { setDaXoa(null); lamMoi(); }} onHet={() => {}}
              phu={t('Việc của Case này cũng rời danh sách.')} />
          </div>
        ) : (
          <ThanCase data={data} setData={setData} reload={reload} onChanged={onChanged} dich={dich} bao={bao} kyNangTiep={kyNangTiep}
            onDaXoaCase={(x) => { setDaXoa(x); onChanged?.(); }} />
        )}
        {laTvvCx && ph && (chuPhuHuynh(ph) || ph.parentPhone) && !daXoa && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[10px] border px-3 py-2.5 text-sm text-slate-200" style={{ borderColor: 'var(--line)' }}>
            <span className="w-full text-[13px] text-slate-500">{t('Phụ huynh')}</span>
            <span className="min-w-0 flex-1">{[chuPhuHuynh(ph), ph.parentPhone].filter(Boolean).join(' · ')}</span>
            {ph.parentPhone && <a className="btn min-h-[44px] sm:min-h-[36px]" href={`tel:${ph.parentPhone.replace(/\s+/g, '')}`}>{t('Gọi')}</a>}
          </div>
        )}
      </KhungPanel>
    </BaoLuuCase.Provider>
  );
}

/**
 * Sửa tên Case (v16 n2): hộp nhỏ ngay dưới tên — Tên Case · Kỹ năng (khoá khi đã có PA / Case từ Test, ⓘ lý do) · Mức độ (Case tạo tay; Case SOS = mức SOS, không sửa).
 * "Xong" lưu một lần (`PATCH /cases/:id`, chỉ trường đã đổi); lỗi giữ chữ.
 */
function SuaTenCase({ data, onDoi, onDong }: { data: CaseDetail; onDoi: (d: CaseDetail) => void; onDong: () => void }) {
  const ct = data.chuongTrinh ?? null;
  const [title, setTitle] = useState(data.viewer.tenSua ?? data.title ?? '');
  const [topic, setTopic] = useState(data.topic ?? '');
  const [urgency, setUrgency] = useState(data.urgency ?? '');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const caseTay = !data.sos?.fromSos;
  const topics = caseTopicsFor(!!data.ratio, ct);
  const xong = async () => {
    const body: Record<string, unknown> = { luc: data.capNhatLuc };
    if (title.trim() !== (data.viewer.tenSua ?? data.title ?? '').trim()) body.title = title.trim();
    if (topic !== (data.topic ?? '')) body.topic = topic;
    if (caseTay && urgency !== (data.urgency ?? '')) body.urgency = urgency;
    if (Object.keys(body).length === 1) { onDong(); return; }
    if (title.trim().length < 3) { setLoi(t('Tên Case cần ít nhất 3 ký tự')); return; }
    setBusy(true); setLoi(null);
    try { const d = await api.patch<CaseDetail>(`/cases/${data.id}`, body); onDoi(d); onDong(); }
    catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); if (e instanceof ApiError && e.status === 409) invalidate(`/cases/${data.id}`); }
    finally { setBusy(false); }
  };
  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-[10px] border p-3 sm:max-w-[460px]" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
      <label className="flex flex-col gap-1"><span className="text-[13px] font-semibold">{t('Tên Case')}</span>
        <input className="field w-full" maxLength={80} value={title} autoFocus onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onDong(); } else if (e.key === 'Enter') { e.preventDefault(); void xong(); } }} /></label>
      <dl className="m-0 grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 text-sm">
        <dt className="font-semibold text-dim">{t('Kỹ năng')}</dt>
        <dd className="m-0 flex flex-wrap items-center gap-2">{data.viewer.khoaKyNang
          ? <><span>{topic ? tenMon(ct, topic) : '—'}</span><span className="text-[13px] text-faint">{data.originKind === 'mock' ? t('Case từ kết quả Test — không đổi') : t('đã có PA — không đổi')}</span></>
          : topics.map((k) => <NutChon key={k} nho chon={topic === k} title={tenMon(ct, k)} onClick={() => setTopic(k)}>{tenMonNgan(ct, k)}</NutChon>)}</dd>
        <dt className="font-semibold text-dim">{t('Mức độ')}</dt>
        <dd className="m-0 flex flex-wrap items-center gap-2">{caseTay
          ? URGENCY_LEVELS.map((u) => <NutChon key={u} nho chon={urgency === u} onClick={() => setUrgency(u)}>{URGENCY_LABEL[u]}</NutChon>)
          : <>{data.sosLevel ? <ChipSos muc={data.sosLevel} tinh /> : '—'}<span className="text-[13px] text-faint">{t('theo điểm Test')}</span></>}</dd>
      </dl>
      {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi}</p>}
      <span className="flex justify-end gap-2">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={busy} onClick={onDong}>{t('Thôi')}</button>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void xong()}>{busy ? t('Đang lưu…') : t('Xong')}</button>
      </span>
    </div>
  );
}
