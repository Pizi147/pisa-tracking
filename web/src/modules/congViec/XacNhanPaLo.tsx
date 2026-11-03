import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { CanLam, DaiVuaLuu, TrangThaiLuu, dauViec } from '../../ui/KhuonViec.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useToast } from '../../ui/Toast.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import {
  GOI_Y_MO_TA_PA, INTERVENTION_KIND_LABEL, TRAN_CHU, LOAI_HAN_CUA_VIEC, addDaysIso, coNguoiDay, datLaiNguoi, kiemSoBuoiPa, soBuoiTu, type LoiTruong, type NguoiChon,
} from '@shared/domain/index.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { dich, t } from '@shared/i18n/index.ts';

type Em = NonNullable<WorkItem['con']>[number];
type Rieng = { mo: boolean; moTa: string; batDau: string; nguoi: NguoiChon | null };
/** Cùng ngưỡng máy chủ (`xacNhanPaQuyChe`: mô tả ≥ 15 ký tự). */
const TOI_THIEU = 15;
const RIENG_TRONG: Rieng = { mo: false, moTa: '', batDau: '', nguoi: null };
/** Rà #412: ~40 câu SQL / PA, Netlify cắt lời gọi sau 10 s → gửi tuần tự từng lô ≤ 3 PA. */
const LO = 3;

/**
 * XÁC NHẬN PA CÙNG LÚC (OV-13c, chủ SP 15/10 Q4; mockup OV-13 §3a) — dòng gộp Case SOS FT cùng lớp + tuần thi + mức SOS. Em tick sẵn (bỏ tick được);
 * Nội dung / hướng dẫn * + Bắt đầu + Người dạy DÙNG CHUNG — người dạy chung chỉ điền PA còn trống (máy chủ không đè PA đã có người). "Sửa riêng"
 * mở ngay dưới em: nội dung / ngày / người riêng thắng chung; "Đề xuất PA khác cho em này…" mở panel Xác nhận PA của riêng em đó (em đó làm riêng).
 * Gửi một lần (`POST /interventions/xac-nhan-pa-lo`): mỗi PA một giao dịch — em xong gập ✓, em lỗi giữ lại kèm lý do + "Thử lại".
 * Danh sách em giữ như lúc mở (Công việc tải lại không làm mất kết quả lô).
 */
export function XacNhanPaLo({ it, onDong, onDaLam, onMo, onTiep }: {
  it: WorkItem; onDong: () => void; onDaLam: () => void; onMo?: (it: WorkItem) => void; onTiep?: (() => void) | null;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [ds] = useState<Em[]>(() => it.con ?? []);
  const [tick, setTick] = useState<ReadonlySet<string>>(() => new Set(ds.map((x) => x.key)));
  const [moTa, setMoTa] = useState('');
  const [batDau, setBatDau] = useState('');
  const [nguoi, setNguoi] = useState<NguoiChon | null>(null);
  const [soBuoi, setSoBuoi] = useState('');
  const [rieng, setRieng] = useState<Record<string, Rieng>>({});
  const [xong, setXong] = useState<ReadonlySet<string>>(new Set());
  const [loiMay, setLoiMay] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [tienDo, setTienDo] = useState<{ n: number; m: number } | null>(null);
  /* HOAN-TAC-XN: PA của lần gửi gần nhất — dải "✓ Đã xác nhận n em · Hoàn tác" (10 s) đảo đúng các PA này; `lan` đổi = dải mới, đếm lại. */
  const [vuaXn, setVuaXn] = useState<{ lan: number; ids: number[] } | null>(null);
  const lf = useLoiForm();

  const conLai = ds.filter((x) => !xong.has(x.key));
  const chon = conLai.filter((x) => tick.has(x.key));
  const ngay = batDau || homNay;
  const riengCua = (k: string) => rieng[k] ?? RIENG_TRONG;
  const datRieng = (k: string, p: Partial<Rieng>) => setRieng((m) => ({ ...m, [k]: { ...riengCua(k), ...p } }));
  /* Nội dung chung bắt buộc trừ khi mọi em đang tick đã có nội dung riêng đủ dài. */
  const canChung = chon.some((x) => riengCua(x.key).moTa.trim().length < TOI_THIEU);
  const ngan = t('Nội dung cần ít nhất {n} ký tự', { n: TOI_THIEU });
  const oRieng = (x: Em) => `noi-dung-${x.paId}`;
  const dai = (s: string) => t('Tối đa {toiDa} ký tự (đang có {n})', { toiDa: TRAN_CHU.noiDungPa, n: s.trim().length });
  /* OV-13b (mockup §9 "Số buổi *"): PA Tutor quy chế sinh ra chưa có Số buổi — ô chung điền cho em Tutor còn trống (em đã có giữ nguyên). */
  const thieuSoBuoi = (x: Em) => x.pa?.kind === 'tutor' && x.pa.soBuoi == null;
  const canSoBuoi = chon.some(thieuSoBuoi);
  const loiSoBuoi = canSoBuoi ? (soBuoiTu(soBuoi) === null ? t('Nhập số buổi') : kiemSoBuoiPa(soBuoi)) : null;
  const loi: LoiTruong[] = [
    ...(loiSoBuoi ? [{ khoa: 'so-buoi', nhan: t('Số buổi / 2 tuần'), lyDo: loiSoBuoi }] : []),
    ...(canChung && moTa.trim().length < TOI_THIEU ? [{ khoa: 'noi-dung', nhan: t('Nội dung / hướng dẫn'), lyDo: moTa.trim() ? ngan : t('Ghi nội dung / hướng dẫn') }] : []),
    ...chon.filter((x) => { const m = riengCua(x.key).moTa.trim(); return m && m.length < TOI_THIEU; }).map((x) => ({ khoa: oRieng(x), nhan: x.studentName, lyDo: ngan })),
    /* N35: nội dung PA ≤ 200 — ô chung và ô riêng từng em; chữ giữ trong ô. */
    ...(moTa.trim().length > TRAN_CHU.noiDungPa ? [{ khoa: 'noi-dung', nhan: t('Nội dung / hướng dẫn'), lyDo: dai(moTa) }] : []),
    ...chon.filter((x) => riengCua(x.key).moTa.trim().length > TRAN_CHU.noiDungPa).map((x) => ({ khoa: oRieng(x), nhan: x.studentName, lyDo: dai(riengCua(x.key).moTa) })),
  ];
  const daSua = !!moTa.trim() || !!batDau || !!nguoi || !!soBuoi.trim() || Object.values(rieng).some((r) => r.moTa.trim() || r.batDau || r.nguoi);
  const loai = [...new Set(ds.map((x) => x.pa?.kind).filter((k): k is string => !!k))];
  const tenLoai = loai.map((k) => INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL] ?? k).join(' · ');
  const coNguoi = ds.some((x) => coNguoiDay(x.pa?.kind ?? 'self_study'));
  const coSoBuoiTrong = ds.some(thieuSoBuoi);
  /* OV-15i2: ô Người dạy chung gợi ý tutor theo chi nhánh LỚP của nhóm (lớp của Case), không theo lớp em đầu đang học; khác lớp → không nhóm Tutor. */
  const lopNhom = ds.length && ds.every((x) => x.classId && x.classId === ds[0].classId) ? ds[0].classId : null;

  const gui = async () => {
    lf.bam();
    if (!chon.length || loi.length) return;
    const theoPa = new Map(chon.map((x) => [x.paId, x.key]));
    const chung = { description: moTa.trim(), batDau: ngay, ...(nguoi ? datLaiNguoi(nguoi) : {}) };
    const hang = chon.map((x) => {
      const r = riengCua(x.key);
      return { id: x.paId as number, ...(thieuSoBuoi(x) ? { soBuoi: soBuoiTu(soBuoi) } : {}), ...(r.moTa.trim() ? { description: r.moTa.trim() } : {}), ...(r.batDau ? { batDau: r.batDau } : {}), ...(r.nguoi ? datLaiNguoi(r.nguoi) : {}) };
    });
    const m = hang.length;
    const loiMoi: Record<string, string> = {};
    let daXong = 0;
    const okLan: number[] = [];
    setBusy(true);
    setTienDo({ n: 0, m });
    try {
      while (hang.length) {
        const lo = hang.splice(0, LO);
        const kq = await api.post<{ ok: number[]; loi: { id: number; loi: string }[]; chuaLam?: number[] }>('/interventions/xac-nhan-pa-lo', { chung, ds: lo });
        for (const l of kq.loi) loiMoi[theoPa.get(l.id) ?? String(l.id)] = l.loi;
        if (kq.ok.length) {
          daXong += kq.ok.length;
          okLan.push(...kq.ok);
          setXong((s) => new Set([...s, ...kq.ok.map((id) => theoPa.get(id)!).filter(Boolean)]));
        }
        /* Máy chủ dừng sớm vì gần hết giờ lời gọi: PA chưa làm gửi lại ở lô sau; cả lô chưa làm = máy chủ bận thật → dừng, báo. */
        const chua = new Set(kq.chuaLam ?? []);
        if (chua.size === lo.length) throw new Error(t('Máy chủ đang bận, chưa lưu gì. Thử lại sau ít phút.'));
        hang.unshift(...lo.filter((x) => chua.has(x.id)));
        setTienDo({ n: m - hang.length, m });
      }
    } catch (e: any) { toast.push('error', e.message); } finally {
      /* Lỗi giữa chừng (mạng chập): em đã xong vẫn ✓, em chưa gửi giữ tick — bấm lại chỉ gửi phần còn lại; PA đã xác nhận máy chủ coi là xong. */
      setLoiMay(loiMoi);
      setBusy(false);
      setTienDo(null);
      if (daXong) {
        onDaLam();
        for (const d of ['/cases', '/students', '/tong-quan', '/my-work']) invalidate(d);
        setVuaXn((v) => ({ lan: (v?.lan ?? 0) + 1, ids: okLan }));
      }
    }
  };
  /* Hoàn tác cả lần gửi (`/interventions/hoan-tac-xac-nhan-pa-lo`): em đảo được về lại danh sách (chữ chung / riêng còn nguyên trong ô); em không đảo được
     giữ ✓, dải báo lý do đầu tiên của máy chủ (403 / 409 + bước tiếp), bấm lại chỉ gửi các em đó. */
  const hoanTacLo = vuaXn ? async () => {
    const kq = await api.post<{ ok: number[]; loi: { id: number; loi: string }[] }>('/interventions/hoan-tac-xac-nhan-pa-lo', { ids: vuaXn.ids });
    const theoPa = new Map(ds.map((x) => [x.paId, x.key]));
    if (kq.ok.length) {
      setXong((s) => { const n = new Set(s); for (const id of kq.ok) n.delete(theoPa.get(id) ?? ''); return n; });
      onDaLam();
      for (const d of ['/cases', '/students', '/tong-quan', '/my-work']) invalidate(d);
    }
    if (kq.loi.length) {
      setVuaXn({ lan: vuaXn.lan, ids: kq.loi.map((l) => l.id) });
      throw new Error(kq.loi[0].loi);
    }
  } : undefined;

  const coLoi = conLai.some((x) => loiMay[x.key]);
  const nut = conLai.length ? (
    <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy || !chon.length} onClick={() => void gui()}>
      {busy ? (tienDo ? t('Đang xác nhận {n}/{m} em', tienDo) : t('Đang lưu…')) : coLoi ? t('Thử lại · {n} em', { n: chon.length }) : t('Xác nhận PA · {n} em', { n: chon.length })}
    </button>
  ) : onTiep ? <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" onClick={onTiep}>{t('Việc tiếp ›')}</button> : undefined;
  const dau = dauViec({
    han: it.due && conLai.length ? <ChipHan loai={LOAI_HAN_CUA_VIEC.xac_nhan_pa ?? 'xac-minh-sos'} han={it.due} /> : null,
    lop: it.classCode, ngCanh: dich(it.contextLabel ?? ''),
  });
  /* Em lỗi lên đầu (mockup 375: lỗi một em không mất phần đã xác nhận). */
  const thuTu = [...conLai].sort((a, b) => Number(!loiMay[a.key]) - Number(!loiMay[b.key]));
  return (
    <KhungPanel tieuDe={t('Xác nhận PA cùng lúc')} dau={dau} onDong={onDong}
      chan={{ v3: true, chinh: nut, daSua: daSua && !!conLai.length, conThieu: lf.conThieu(loi), dongTren: conLai.length && (busy || daSua) ? <TrangThaiLuu tt={busy ? 'dang' : 'nhap'} /> : undefined }}>
      <div className="flex flex-col gap-5 pt-4">
        {xong.size > 0 && (
          <div className="flex flex-col gap-1">
            <DaiVuaLuu key={vuaXn?.lan ?? 0} ai={null} onHoanTac={() => setVuaXn(null)}
              x={{ chu: t('Đã xác nhận {n} em', { n: xong.size }), phu: ds.filter((x) => xong.has(x.key)).map((x) => x.studentName).join(' · '), hoanTac: hoanTacLo }} />
            {!conLai.length && nut && <div className="pt-2 max-sm:hidden">{nut}</div>}
          </div>
        )}
        {conLai.length > 0 && (
          <CanLam>
            {tenLoai && <span className="text-[15px] font-bold text-slate-100">{dich(tenLoai)}{it.sos ? <span className="ml-2 text-[13px] font-normal text-slate-400">{t('quy chế SOS {sos}', { sos: it.sos })}</span> : null}</span>}
            <Truong nhan={t('Nội dung / hướng dẫn')} batBuoc={canChung} loi={lf.loiCua(loi, 'noi-dung')} dem={{ co: moTa.trim().length, can: TOI_THIEU, toiDa: TRAN_CHU.noiDungPa }}>
              <textarea className="field w-full" rows={2} value={moTa} disabled={busy} {...lf.o(loi, 'noi-dung')}
                onChange={(e) => setMoTa(e.target.value)} placeholder={GOI_Y_MO_TA_PA} />
            </Truong>
            <div className="grid gap-3 sm:grid-cols-2">
              <Truong nhan={t('Bắt đầu')} batBuoc>
                <ONgay kieu="ngay" value={ngay} onChange={setBatDau} toiThieu={homNay ? addDaysIso(homNay, -30) : null} toiDa={homNay ? addDaysIso(homNay, 30) : null} disabled={busy} />
              </Truong>
              {coNguoi && (
                <Truong nhan={t('Người dạy')} as="div" tuyChon phu={t('Em đã có người dạy giữ nguyên')}>
                  <ChonNguoi nhom="giao_vien" value={nguoi} onChange={setNguoi} choTrong={t('Để trống')} placeholder={t('Chưa chọn · gõ tên để tìm')}
                    tutor={loai.length === 1 && loai[0] === 'tutor' && lopNhom ? { classId: lopNhom } : undefined}
                    ariaLabel={t('Người dạy')} disabled={busy} id={lf.oId('nguoi')} onBlur={lf.roi('nguoi')} invalid={!!lf.loiCua(loi, 'nguoi')} />
                </Truong>
              )}
              {coSoBuoiTrong && (
                <Truong nhan={t('Số buổi / 2 tuần')} batBuoc={canSoBuoi} loi={lf.loiCua(loi, 'so-buoi')} phu={t('Em đã có số buổi giữ nguyên')}>
                  <input className="field w-24 tabular-nums" inputMode="numeric" maxLength={2} {...lf.o(loi, 'so-buoi')} value={soBuoi} disabled={busy}
                    onChange={(e) => setSoBuoi(e.target.value)} placeholder="—" />
                </Truong>
              )}
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-300">{t('Học viên')} · <span className="tabular-nums">{chon.length}/{conLai.length}</span></span>
              <ul className="m-0 list-none divide-y rounded-lg border p-0" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                {thuTu.map((x) => {
                  const r = riengCua(x.key);
                  const co = tick.has(x.key);
                  return (
                    <li key={x.key} className="px-2.5 py-2">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <label className={`flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-center gap-2.5 sm:min-h-0 ${co ? '' : 'opacity-60'}`}>
                          <input type="checkbox" className="h-4 w-4 shrink-0" checked={co} disabled={busy}
                            onChange={() => setTick((s) => { const n = new Set(s); if (co) n.delete(x.key); else n.add(x.key); return n; })} />
                          <span className="min-w-0">
                            <span className="block font-semibold text-slate-100">{x.studentName}</span>
                            <small className="block text-[12px] text-slate-500">{[dich(x.conPhu), x.pa?.nguoi].filter(Boolean).join(' · ')}{co ? '' : ` · ${t('bỏ tick')}`}</small>
                          </span>
                        </label>
                        <button type="button" className="btn btn-ghost min-h-[44px] font-semibold text-[color:var(--accent)] sm:min-h-[32px]" aria-expanded={r.mo}
                          onClick={() => datRieng(x.key, { mo: !r.mo })}>{r.mo ? t('Xong') : t('Sửa riêng')}</button>
                      </div>
                      {loiMay[x.key] && <p role="alert" className="m-0 mt-1 text-xs text-bad">⚠ {dich(loiMay[x.key])}</p>}
                      {r.mo && (
                        <div className="mt-2 flex flex-col gap-3 border-l-2 pl-3" style={{ borderColor: 'var(--line-strong)' }}>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Truong nhan={t('Bắt đầu')}>
                              <ONgay kieu="ngay" value={r.batDau} onChange={(v) => datRieng(x.key, { batDau: v })} goiY={t('Như ô chung')}
                                toiThieu={homNay ? addDaysIso(homNay, -30) : null} toiDa={homNay ? addDaysIso(homNay, 30) : null} disabled={busy} />
                            </Truong>
                            {coNguoiDay(x.pa?.kind ?? 'self_study') && (
                              <Truong nhan={t('Người dạy')} as="div">
                                <ChonNguoi nhom="giao_vien" studentId={x.studentId} value={r.nguoi} onChange={(v) => datRieng(x.key, { nguoi: v })}
                                  tutor={x.pa?.kind === 'tutor' && x.studentId ? { studentId: x.studentId } : undefined}
                                  choTrong={t('Để trống')} placeholder={x.pa?.nguoi ?? t('Như ô chung')} ariaLabel={t('Người dạy')} disabled={busy} />
                              </Truong>
                            )}
                          </div>
                          <Truong nhan={t('Nội dung riêng')} tuyChon loi={lf.loiCua(loi, oRieng(x))} dem={{ co: r.moTa.trim().length, toiDa: TRAN_CHU.noiDungPa }}>
                            <textarea className="field w-full" rows={2} value={r.moTa} disabled={busy} {...lf.o(loi, oRieng(x))}
                              onChange={(e) => datRieng(x.key, { moTa: e.target.value })} placeholder={t('Trống = nội dung chung')} />
                          </Truong>
                          {onMo && (
                            <button type="button" className="link min-h-[44px] w-fit appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold sm:min-h-0"
                              onClick={() => onMo(x)}>{t('Đề xuất PA khác cho em này…')}</button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="max-sm:hidden">{nut}</div>
          </CanLam>
        )}
      </div>
    </KhungPanel>
  );
}
