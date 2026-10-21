import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, KhungPanel, Truong, useNhap, useXoaNhap } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { CanLam, NutChu, TrangThaiLuu } from '../../ui/KhuonViec.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { NutChon, Skeleton } from '../../ui/ui.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BAC_0_NHAN, THANG, dsLoi, nguoiThanhPayload, nguoiThieu, nhanLoaiXuLy, type NguoiChon } from '@shared/domain/index.ts';
import { dich, dichChu, t } from '@shared/i18n/index.ts';
import { DUONG_LAM_MOI_Y_THUC, type BangLo, type EmLo, type KqEm } from './kieu.ts';

export type ViecLo = 'xu-ly' | 'ghi-nhan' | 'cap-bac';
const MO_TA_MIN = 10;
const lamMoi = () => DUONG_LAM_MOI_Y_THUC.forEach((d) => invalidate(d));
const duocCua = (e: EmLo, viec: ViecLo) => (viec === 'xu-ly' ? e.xuLy : viec === 'ghi-nhan' ? e.ghiNhan : e.capBac);
/**
 * Rà #408: một lời gọi phải xong trong ~7,5 s (Netlify) — chia em thành lô nhỏ, gửi lần lượt, tự gửi tiếp (xử lý ~15 câu SQL / em, cấp bậc /
 * ghi nhận ~6 câu / em). Lời gọi hỏng (mạng, 503) thì dừng; em chưa gửi vẫn còn để Thử lại.
 */
export const CO_LO: Record<ViecLo, number> = { 'xu-ly': 4, 'ghi-nhan': 12, 'cap-bac': 12 };
export async function guiTheoLo(ids: readonly number[], co: number, gui: (lo: number[]) => Promise<{ em: KqEm[] }>, moiLo: (em: KqEm[]) => void) {
  for (let i = 0; i < ids.length; i += co) moiLo((await gui(ids.slice(i, i + co))).em);
}
/** Chip bậc của bảng Xác nhận cấp bậc: bậc 0 "Chưa có xử lý vi phạm" + sáu bậc mạch chính (khai tối đa WL 2). */
const CHIP_BAC = [BAC_0_NHAN, ...THANG.map((k) => nhanLoaiXuLy(k))];

/**
 * Ý THỨC NHIỀU EM CÙNG LÚC (OV-13d, mockup OV-13 mục 4, khuôn panel v3) — MỘT panel cho ba hành động trên các em đã chọn ở tab Ý thức lớp hoặc
 * dòng gộp Ý thức ở Công việc:
 *   xu-ly     Xác nhận xử lý chung: em hợp lệ tick sẵn ("An → Report 2"), Ngày · Người · Mô tả chung, "Sửa riêng" mô tả từng em ngay dưới em.
 *   ghi-nhan  Ghi nhận mọi vi phạm Mới của các em; Hoàn tác ngay trong panel.
 *   cap-bac   Bảng em × chip bậc (bậc 0 "Chưa có xử lý vi phạm"); em đã có xử lý trên web khoá (chỉ QL sửa bậc đã khai). Em chưa chọn bậc không gửi.
 * Em không làm được hành động này nằm ở "Không đưa vào" kèm lý do (máy chủ quyết). Kết quả theo từng em: em xong ✓, em lỗi giữ lại kèm lý do + Thử lại.
 * Danh sách em CHỐT lúc mở (lưu xong em không nhảy nhóm); bậc / bậc kế đọc bản mới nhất.
 */
export function LoYThucPanel({ classId, lop, viec, studentIds, han, onClose, onDone }: {
  classId: number; lop?: string | null; viec: ViecLo;
  /** Hạn sớm nhất của dòng việc (Công việc) — chip hạn ở đầu panel. */
  han?: string | null;
  /** Em đã chọn; null = mọi em làm được hành động này (dòng Công việc mở theo lớp). */
  studentIds: number[] | null;
  onClose: () => void; onDone?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data, error, reload } = useApi<BangLo>(`/classes/${classId}/y-thuc/lo`, [classId]);
  const [ds, setDs] = useState<EmLo[] | null>(null);
  const [tick, setTick] = useState<Set<number>>(new Set());
  const [rieng, setRieng] = useState<Record<number, string>>({});
  const [moRieng, setMoRieng] = useState<number | null>(null);
  const [bac, setBac] = useState<Record<number, number>>({});
  const [ngayTh, setNgayTh] = useState(homNay);
  const [nguoi, setNguoi] = useState<NguoiChon | null>({ kieu: 'toi' });
  const [moTa, setMoTa] = useNhap('lo-mo-ta', '');
  const xoaNhap = useXoaNhap();
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  const [kq, setKq] = useState<Map<number, KqEm>>(new Map());
  const [tienDo, setTienDo] = useState<{ xong: number; tong: number } | null>(null);
  const lf = useLoiForm();
  const idempotencyKey = useMemo(() => `y-thuc-lo:${classId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, [classId]);

  useEffect(() => {
    if (!data || ds) return;
    const chon = studentIds ? new Set(studentIds) : null;
    const em = data.em.filter((e) => (chon ? chon.has(e.studentId) : duocCua(e, viec).duoc && (viec !== 'cap-bac' || e.capBac.khai === null)));
    setDs(em);
    setTick(new Set(em.filter((e) => duocCua(e, viec).duoc).map((e) => e.studentId)));
    setBac(Object.fromEntries(em.filter((e) => e.capBac.khai !== null).map((e) => [e.studentId, e.capBac.khai!])));
  }, [data, ds, studentIds, viec]);

  const tieuDe = viec === 'xu-ly' ? t('Xác nhận xử lý chung') : viec === 'ghi-nhan' ? t('Ghi nhận') : t('Xác nhận cấp bậc');
  const dau = (n: number) => ({ han: han ? <ChipHan loai="xu-ly-vi-pham" han={han} /> : undefined, dong2: [<b key="n" className="text-slate-100">{t('{n} em', { n })}</b>, lop ?? data?.classCode ?? null, t('Ý thức')] });
  if (error) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><p className="mt-3 text-sm text-bad">{dich(error.message)}</p></KhungPanel>;
  if (!ds || !data) return <KhungPanel tieuDe={tieuDe} onDong={onClose}><div className="pt-3"><Skeleton rows={4} /></div></KhungPanel>;

  const moiNhat = (e: EmLo) => data.em.find((x) => x.studentId === e.studentId) ?? e;
  const daXong = (sid: number) => !!kq.get(sid)?.ok;
  /* Rà #408 (2): em làm được lúc mở VÀ theo dữ liệu mới nhất (người khác vừa xử lý → xuống "Không đưa vào", không tick, không Thử lại mãi). */
  const duocNay = (e: EmLo) => daXong(e.studentId) || (duocCua(e, viec).duoc && duocCua(moiNhat(e), viec).duoc);
  const duoc = ds.filter(duocNay);
  const khongDua = ds.filter((e) => !duocNay(e));
  const lyDoCua = (e: EmLo) => duocCua(moiNhat(e), viec).lyDo ?? duocCua(e, viec).lyDo;
  const doi = (sid: number) => setTick((s) => { const n = new Set(s); if (n.has(sid)) n.delete(sid); else n.add(sid); return n; });
  /* Cấp bậc: em gửi = em mở khoá đã chọn bậc khác bậc đã khai. */
  const guiCapBac = duoc.filter((e) => !daXong(e.studentId) && bac[e.studentId] !== undefined && bac[e.studentId] !== e.capBac.khai);
  const gui = viec === 'cap-bac' ? guiCapBac.map((e) => e.studentId) : duoc.filter((e) => tick.has(e.studentId) && !daXong(e.studentId)).map((e) => e.studentId);
  const soOk = [...kq.values()].filter((x) => x.ok).length;
  const soLoi = duoc.filter((e) => kq.get(e.studentId)?.ok === false).length;

  const canChung = viec === 'xu-ly' && gui.some((sid) => !rieng[sid]?.trim());
  const loi = viec === 'xu-ly' ? dsLoi([
    { khoa: 'em', nhan: t('Học viên'), chon: true },
    ...(canChung ? [{ khoa: 'mo-ta', nhan: t('Mô tả chung'), toiThieu: MO_TA_MIN }] : []),
  ], { em: gui.length ? 'co' : '', 'mo-ta': moTa }) : [];
  const loiNguoi = viec === 'xu-ly' ? nguoiThieu(nguoi, true) : null;

  const luu = async () => {
    lf.bam();
    if (!gui.length || loi.length || loiNguoi) return;
    setBusy(true); setLoiLuu(null);
    let coOk = false;
    let xong = 0;
    setTienDo({ xong, tong: gui.length });
    try {
      const duong = `/classes/${classId}/y-thuc/lo/${viec}`;
      await guiTheoLo(gui, CO_LO[viec], (lo) => api.post<{ em: KqEm[] }>(duong, viec === 'xu-ly' ? {
        em: lo.map((sid) => ({ studentId: sid, note: rieng[sid]?.trim() || undefined, bacDaThay: moiNhat(ds.find((e) => e.studentId === sid)!).bac })),
        performedOn: ngayTh, ...nguoiThanhPayload(nguoi), note: moTa.trim(), idempotencyKey,
      } : viec === 'ghi-nhan' ? { studentIds: lo } : { em: lo.map((sid) => ({ studentId: sid, bac: bac[sid] })) }), (em) => {
        setKq((m) => { const n = new Map(m); for (const x of em) n.set(x.studentId, x); return n; });
        coOk ||= em.some((x) => x.ok);
        xong += em.length;
        setTienDo({ xong, tong: gui.length });
      });
      setMoRieng(null);
    } catch (e: any) {
      setLoiLuu(e instanceof ApiError ? dich(e.message) : String(e?.message ?? e));
    } finally {
      setBusy(false); setTienDo(null);
      if (coOk) { xoaNhap(); onDone?.(); lamMoi(); reload(); }
    }
  };

  /* Ghi nhận bấm nhầm: bỏ ghi nhận đúng các vi phạm vừa ghi nhận của từng em (đường một em sẵn có). */
  const hoanTac = async () => {
    const ok = [...kq.values()].filter((x) => x.ok && x.ids?.length);
    setBusy(true);
    const r = await Promise.allSettled(ok.map((x) => api.post(`/students/${x.studentId}/y-thuc/bo-ghi-nhan`, { violationIds: x.ids })));
    setBusy(false);
    const hong = r.filter((x) => x.status === 'rejected').length;
    setKq((m) => { const n = new Map(m); ok.forEach((x, i) => { if (r[i].status === 'fulfilled') n.delete(x.studentId); }); return n; });
    onDone?.(); lamMoi(); reload();
    if (hong) toast.push('error', t('{n} em chưa hoàn tác được — thử lại.', { n: hong }));
  };

  const xongHet = soOk > 0 && !gui.length;
  const nhanNut = xongHet ? t('Xong')
    : soLoi > 0 && soOk > 0 ? t('Thử lại · {n} em', { n: gui.length })
    : viec === 'xu-ly' ? t('Xác nhận xử lý · {n} em', { n: gui.length })
    : viec === 'ghi-nhan' ? t('Ghi nhận · {n} em', { n: gui.length }) : t('Xác nhận cấp bậc · {n} em', { n: gui.length });
  const nutChinh = (
    <button type="button" className="btn btn-primary min-h-[40px] px-4 font-bold" disabled={busy || (!xongHet && !gui.length)}
      onClick={xongHet ? onClose : () => void luu()}>{busy ? t('Đang lưu…') : nhanNut}</button>
  );
  const dongTren = busy && tienDo ? <span role="status" className="font-semibold text-slate-300">{t('Đang lưu… {a}/{b} em', { a: tienDo.xong, b: tienDo.tong })}</span>
    : busy || loiLuu ? <TrangThaiLuu tt={busy ? 'dang' : 'loi'} loi={loiLuu} onThuLai={() => void luu()} />
    : soOk || soLoi ? (
      <span role="status" className="flex w-full flex-wrap items-center gap-2">
        {soOk > 0 && <span className="font-semibold text-ok">✓ {viec === 'ghi-nhan'
          ? t('Đã ghi nhận {so} vi phạm · {n} em', { so: [...kq.values()].reduce((s, x) => s + (x.ok ? x.ids?.length ?? 0 : 0), 0), n: soOk })
          : t('Đã lưu {n} em', { n: soOk })}</span>}
        {soLoi > 0 && <span role="alert" className="font-semibold text-bad">⚠ {t('{n} em chưa lưu', { n: soLoi })}</span>}
        <span className="flex-1" />
        {viec === 'ghi-nhan' && soOk > 0 && <NutChu disabled={busy} onClick={() => void hoanTac()}>{t('Hoàn tác')}</NutChu>}
      </span>
    ) : undefined;

  /** Một dòng em: ô tick (xu-ly / ghi-nhan) · tên + kết quả · dòng phụ; em xong gập ✓, em lỗi hiện lý do. */
  const dongEm = (e: EmLo) => {
    const m = moiNhat(e);
    const k = kq.get(e.studentId);
    const xong = !!k?.ok;
    const phu = viec === 'xu-ly' ? [t('{n} vi phạm', { n: m.xuLy.soViPham }), m.xuLy.tomTat].filter(Boolean).join(' · ')
      : t('{n} vi phạm mới', { n: m.ghiNhan.soMoi });
    return (
      <li key={e.studentId} className="py-1.5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2">
          {xong ? <span aria-hidden className="w-[18px] text-center text-ok">✓</span>
            : <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer max-sm:m-[13px]" checked={tick.has(e.studentId)}
                onChange={() => doi(e.studentId)} aria-label={t('Chọn {ten}', { ten: e.ten })} />}
          <span className={`min-w-0 text-sm font-semibold ${xong ? 'text-slate-400' : 'text-slate-100'}`}>
            {e.ten}
            {viec === 'xu-ly' && <span className="ml-1.5 font-bold text-[color:var(--accent)]">→ {dich(xong ? k!.nhan ?? '' : m.keTiep.nhan)}</span>}
          </span>
          {viec === 'xu-ly' && !xong && (
            <NutChu onClick={() => setMoRieng((x) => (x === e.studentId ? null : e.studentId))} mo={moRieng === e.studentId}>
              {moRieng === e.studentId ? t('Xong') : t('Sửa riêng')}
            </NutChu>
          )}
          {!xong && <span className="col-start-2 col-end-[-1] text-xs text-slate-400">{phu}{rieng[e.studentId]?.trim() && moRieng !== e.studentId ? ` · ${t('mô tả riêng')}` : ''}</span>}
          {k && !k.ok && k.loi && <span role="alert" className="col-start-2 col-end-[-1] text-xs font-semibold text-bad">⚠ {dichChu(k.loi)}</span>}
        </div>
        {viec === 'xu-ly' && moRieng === e.studentId && (
          <div className="mt-2 pl-[26px]">
            <Truong nhan={t('Mô tả riêng')}>
              <textarea className="field w-full" rows={2} value={rieng[e.studentId] ?? ''} autoFocus
                onChange={(ev) => setRieng((r) => ({ ...r, [e.studentId]: ev.target.value }))} placeholder={moTa || t('Ví dụ: Đã gửi Report cho PH qua Zalo')} />
            </Truong>
          </div>
        )}
      </li>
    );
  };

  /** Bảng Xác nhận cấp bậc: một hàng một em, chip bậc 0 … WL 2; em khoá hiện bậc + lý do. */
  const hangBac = (e: EmLo) => {
    const k = kq.get(e.studentId);
    const khoa = !duocNay(e) || !!k?.ok;
    const lyDo = lyDoCua(e);
    const dangChon = khoa ? (k?.ok ? bac[e.studentId] : e.capBac.khai ?? (e.bac > 0 ? e.bac : undefined)) : bac[e.studentId];
    return (
      <li key={e.studentId} className="flex flex-col gap-1.5 py-2.5">
        <span className="text-sm font-semibold text-slate-100">
          {k?.ok && <span aria-hidden className="mr-1 text-ok">✓</span>}{e.ten}
          {!duocNay(e) && lyDo && <small className="ml-2 font-normal text-slate-400">{dichChu(lyDo)}</small>}
        </span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Cấp bậc của {ten}', { ten: e.ten })}>
          {CHIP_BAC.map((nhan, i) => (
            <NutChon key={i} nho chon={dangChon === i} disabled={khoa} onClick={() => setBac((b) => ({ ...b, [e.studentId]: i }))}>{dich(nhan)}</NutChon>
          ))}
        </div>
        {k && !k.ok && k.loi && <span role="alert" className="text-xs font-semibold text-bad">⚠ {dichChu(k.loi)}</span>}
      </li>
    );
  };

  return (
    <KhungPanel tieuDe={tieuDe} onDong={onClose} dau={dau(viec === 'cap-bac' ? ds.length : duoc.length)} rong={viec === 'cap-bac' ? 'rong' : 'hep'}
      chan={{ v3: true, chinh: nutChinh, daSua: !soOk && (!!moTa.trim() || Object.values(rieng).some((x) => x.trim()) || guiCapBac.length > 0), dongTren }}>
      <div className="flex flex-col gap-5 pt-4">
        <CanLam>
          {viec === 'cap-bac' ? (
            <>
              <p className="m-0 text-xs text-slate-300">{t('Chọn bậc đã xử lý gần nhất trước khi dùng web. Em chưa chọn bậc không gửi.')}</p>
              <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>{[...ds].sort((x, y) => Number(y.capBac.duoc) - Number(x.capBac.duoc)).map(hangBac)}</ul>
            </>
          ) : duoc.length === 0 ? (
            <p className="m-0 text-sm text-slate-300">{t('Không em nào trong số đã chọn làm được việc này.')}</p>
          ) : (
            <div id={lf.oId('em')} tabIndex={-1}>
              <span className="mb-1 block text-[13px] font-semibold text-slate-300">{t('Học viên · {a}/{b}', { a: tick.size, b: duoc.length })}</span>
              <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>{duoc.map(dongEm)}</ul>
              {lf.loiCua(loi, 'em') && !soOk && <p className="m-0 mt-1 text-xs text-late">{t('Chọn ít nhất một em.')}</p>}
            </div>
          )}
          {viec === 'xu-ly' && duoc.length > 0 && !xongHet && (
            <>
              <Hang2>
                <Truong nhan={t('Ngày')} batBuoc>
                  <ONgay kieu="ngay" value={ngayTh} onChange={setNgayTh} toiDa={homNay} />
                </Truong>
                <Truong nhan={t('Người')} batBuoc as="div" loi={lf.daBam ? loiNguoi : null}>
                  <ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} />
                </Truong>
              </Hang2>
              <Truong nhan={t('Mô tả chung')} batBuoc={canChung} loi={lf.loiCua(loi, 'mo-ta')} dem={{ co: moTa.trim().length, can: MO_TA_MIN }}>
                <textarea className="field w-full" {...lf.o(loi, 'mo-ta')} rows={3} value={moTa} onChange={(ev) => setMoTa(ev.target.value)}
                  placeholder={t('Ví dụ: Đã gửi Report cho PH qua Zalo')} />
              </Truong>
            </>
          )}
          <div className="max-sm:hidden">{nutChinh}</div>
        </CanLam>
        {khongDua.length > 0 && viec !== 'cap-bac' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-slate-500">{t('Không đưa vào · {n}', { n: khongDua.length })}</span>
            <dl className="m-0 grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px] max-sm:grid-cols-1 max-sm:gap-y-0.5">
              {khongDua.map((e) => (
                <div key={e.studentId} className="contents">
                  <dt className="text-slate-300">{e.ten}</dt>
                  <dd className="m-0 text-slate-400 max-sm:mb-1.5">{lyDoCua(e) ? dichChu(lyDoCua(e)!) : ''}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </KhungPanel>
  );
}
