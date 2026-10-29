import { useEffect, useRef, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonLop } from '../../ui/ChonLop.tsx';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { CHU_XAC_NHAN_XOA, NHAN_VIEC_HANG_LOAT, dsLoi, khopXacNhanXoa, type ViecHangLoat, type XemTruocHangLoat } from '@shared/domain/index.ts';
import { chayHangLoat, hoanTacHangLoat } from './hangLoatEm.ts';
import { hoanTacXoaLo, lamMoiHocVien } from '../../lib/thungRac.ts';
import { dich as dichChu, t } from '@shared/i18n/index.ts';

const TEN_HUONG: Record<string, string> = { len_lop: t('Lên'), fast_track: t('Lên FT'), hoc_lai: t('Học lại'), bao_luu: t('Tạm dừng học (bảo lưu)'), dung_hoc: t('Dừng học hẳn'), chuyen_lop: t('Chuyển lớp FT') };
const nhanViec = (v: ViecHangLoat) => dichChu(NHAN_VIEC_HANG_LOAT[v]);
const BAT_BUOC_LY_DO: ViecHangLoat[] = ['ket-thuc', 'huy-lenh'];
const CO_NGAY: ViecHangLoat[] = ['ket-thuc', 'hoc-lai'];

/**
 * PANEL XEM TRƯỚC LÀM NHIỀU HỌC VIÊN (PR-LUI-b, 06/10) — bấm một việc ở thanh dính đáy (hồ sơ lớp, Lưu trữ) thì ra đây: số hệ quả, học viên bị bỏ qua
 * (kèm lý do), lý do chung, rồi xác nhận. Gửi từng lô 8; lỗi giữa chừng giữ phần đã lưu, nút đổi thành "Thử lại n học viên". Xong thì toast Hoàn tác.
 * OV-12a: Xoá — liệt kê em + dữ liệu sẽ mất, gõ XOÁ, nút đỏ, mỗi request một em. Q-RL2b: toast Hoàn tác cả lô = khôi phục thùng rác từng em đã xoá
 * (lô lỗi một phần: toast ngay cho phần đã xoá, Thử lại thì toast mới gồm cả lô).
 */
export function XemTruocHangLoatPanel({ viec, ids, maLop, onClose, onDone }: {
  viec: ViecHangLoat; ids: number[]; maLop?: string | null; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const lf = useLoiForm();
  const [xem, setXem] = useState<XemTruocHangLoat | null>(null);
  const [loiXem, setLoiXem] = useState<string | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const [goXoa, setGoXoa] = useState('');
  const [busy, setBusy] = useState(false);
  /* Học lại hàng loạt: `Về lớp cũ` (mặc định) hoặc `Sang lớp mới` — chỉ lớp THƯỜNG (sang Fast Track cần Target từng học viên → học lại từng em). */
  const [dich, setDich] = useState<'cu' | 'moi'>('cu');
  const [lopMoiId, setLopMoiId] = useState<number | ''>('');
  const dsLop = useApi<{ lop: { id: number; code: string; ft: boolean; tenChuongTrinh: string | null; gvcn: string | null; siSo?: number }[] }>(
    viec === 'hoc-lai' && dich === 'moi' ? `/students/${ids[0]}/hoc-lai/lop-dich` : null, [dich]);
  const [tienDo, setTienDo] = useState<{ xong: number; tong: number } | null>(null);
  const [chuaLuu, setChuaLuu] = useState<{ studentId: number; message: string }[]>([]);
  const [daLuu, setDaLuu] = useState<number[]>([]);
  /* Q-RL2b: id thùng rác của mọi em đã xoá qua các lần Thử lại; Hoàn tác bỏ id đã khôi phục (ref: toast sống cả khi panel đã đóng). */
  const racRef = useRef<number[]>([]);
  const nap = () => {
    setLoiXem(null);
    api.post<XemTruocHangLoat>('/hang-loat-hoc-vien/xem-truoc', { viec, studentIds: ids }).then(setXem).catch((e: any) => setLoiXem(e.message));
  };
  useEffect(nap, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const batBuoc = BAT_BUOC_LY_DO.includes(viec);
  const loi = dsLoi([
    ...(batBuoc ? [{ khoa: 'ly-do', nhan: t('Lý do'), toiThieu: 1 }] : []),
    ...(viec === 'hoc-lai' && dich === 'moi' ? [{ khoa: 'lop', nhan: t('Lớp'), toiThieu: 1 }] : []),
  ], { 'ly-do': lyDo, lop: lopMoiId === '' ? '' : String(lopMoiId) });
  const idsLam = (xem?.rows ?? []).filter((r) => !r.lyDoBo).map((r) => r.studentId);
  const ten = (sid: number) => xem?.rows.find((r) => r.studentId === sid)?.ten ?? `#${sid}`;
  const dangThu = chuaLuu.length > 0;
  /* OV-12a: Xoá nói "xoá", không nói "lưu". */
  const chuKetQua = (ok: number, loi: number) => (viec === 'xoa' ? t('Đã xoá {ok} em · {loi} em chưa xoá', { ok, loi }) : t('Đã lưu {ok} học viên · {loi} học viên chưa lưu', { ok, loi }));

  const chay = async () => {
    lf.bam();
    if (loi.length) return;
    const lam = dangThu ? chuaLuu.map((c) => c.studentId) : idsLam;
    setBusy(true); setChuaLuu([]);
    const kq = await chayHangLoat(viec, lam, {
      lyDo: lyDo.trim(), date: ngayHl, moLaiLop: viec === 'hoc-lai', lopMoiId: dich === 'moi' && lopMoiId !== '' ? lopMoiId : undefined, xacNhan: viec === 'xoa' ? goXoa : undefined,
    }, (xong, tong) => setTienDo({ xong, tong }));
    setBusy(false); setTienDo(null);
    for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases', '/lenh-chuyen', '/my-work']) invalidate(k);
    const tatCa = [...daLuu, ...kq.ok];
    setDaLuu(tatCa);
    if (viec === 'xoa') {
      lamMoiHocVien();
      racRef.current = [...racRef.current, ...(kq.thungRac ?? [])];
      const chu = kq.failed.length ? chuKetQua(tatCa.length, kq.failed.length) : t('Đã xoá {n} học viên', { n: tatCa.length });
      if (!racRef.current.length && kq.failed.length) toast.push('error', chu, { key: 'hang-loat:xoa' });
      else hoanTacXoaLo(toast, racRef.current, chu, 'hang-loat:xoa', (xong) => {
        racRef.current = racRef.current.filter((id) => !xong.includes(id));
        lamMoiHocVien(); onDone();
      });
      if (kq.failed.length) { setChuaLuu(kq.failed); return; }
      onDone(); onClose(); return;
    }
    if (kq.failed.length) {
      setChuaLuu(kq.failed);
      toast.push('error', chuKetQua(tatCa.length, kq.failed.length));
      return;
    }
    toast.hoanTac(`${nhanViec(viec)} ${t('{n} học viên', { n: tatCa.length })}`, async () => {
      const r = await hoanTacHangLoat(viec, tatCa);
      for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases', '/lenh-chuyen', '/my-work']) invalidate(k);
      toast.push(r.failed.length ? 'error' : 'ok', r.failed.length ? t('Hoàn tác {ok} học viên · {loi} học viên chưa được — {ly}', { ok: r.ok.length, loi: r.failed.length, ly: r.failed[0].message }) : t('Đã hoàn tác'));
      onDone();
    }, { key: `hang-loat:${viec}` });
    onDone(); onClose();
  };

  const theoHuong = Object.entries(xem?.tong.theoHuong ?? {}).map(([h, n]) => `${TEN_HUONG[h] ?? h} ${n}`);
  return (
    <KhungPanel tieuDe={`${nhanViec(viec)} · ${t('{n} học viên', { n: ids.length })}`} lop={maLop} onDong={busy ? () => {} : onClose}
      chan={{
        daSua: !!lyDo.trim() || !!ngayHl || !!goXoa.trim(),
        conThieu: lf.conThieu(loi),
        dongTren: dangThu ? <p role="alert" className="m-0 px-4 pt-2 text-xs text-late tabular-nums">{chuKetQua(daLuu.length, chuaLuu.length)}</p> : undefined,
        chinh: (
          <button type="button" className={`btn ${viec === 'xoa' ? 'btn-danger' : 'btn-primary'} min-h-[44px] sm:min-h-0`} onClick={chay}
            disabled={busy || !xem || (!dangThu && !idsLam.length) || (viec === 'xoa' && !khopXacNhanXoa(goXoa))}>
            {busy ? (tienDo ? t('Đang lưu {xong}/{tong}…', { xong: tienDo.xong, tong: tienDo.tong }) : t('Đang lưu…')) : dangThu ? t('Thử lại {n} học viên', { n: chuaLuu.length }) : xem ? `${nhanViec(viec)} ${t('{n} học viên', { n: idsLam.length })}` : nhanViec(viec)}
          </button>
        ),
      }}>
      {loiXem ? <ErrorState message={loiXem} onRetry={nap} /> : !xem ? <Skeleton rows={4} /> : (
        <>
          <Khoi tieuDe={nhanViec(viec)}>
            <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-slate-300">
              <span><b className="text-slate-100">{idsLam.length}</b> {t('học viên')}</span>
              {viec === 'ket-thuc' && <><span>{t('Case đóng')} <b className="text-slate-100">{xem.tong.caseDong}</b></span><span>{t('PA huỷ')} <b className="text-slate-100">{xem.tong.paHuy}</b></span><span>{t('Quyết định chuyển lớp huỷ')} <b className="text-slate-100">{xem.tong.lenhHuy}</b></span></>}
              {viec === 'huy-lenh' && theoHuong.map((x) => <span key={x}>{x}</span>)}
              {viec === 'hoc-lai' && dich === 'cu' && xem.tong.lopMoLai.length > 0 && <span className="text-soon">{t('Mở lại lớp {ds}', { ds: xem.tong.lopMoLai.join(', ') })}</span>}
            </p>
            {viec === 'hoc-lai' && (
              <>
                <span role="group" aria-label={t('Học lại')} className="flex flex-wrap gap-1.5">
                  <NutChon chon={dich === 'cu'} onClick={() => setDich('cu')}>{t('Về lớp cũ')}</NutChon>
                  <NutChon chon={dich === 'moi'} onClick={() => setDich('moi')}>{t('Sang lớp mới')}</NutChon>
                </span>
                {dich === 'moi' && (
                  <Truong nhan={t('Lớp')} batBuoc loi={lf.loiCua(loi, 'lop')}>
                    <ChonLop ariaLabel={t('Lớp')} {...lf.o(loi, 'lop')} value={lopMoiId || null} onChange={(id) => setLopMoiId(id ?? '')} khongKhop={dsLop.data ? undefined : t('Đang tải…')}
                      ds={(dsLop.data?.lop ?? []).filter((l) => !l.ft).map((l) => ({ id: l.id, ma: l.code, phu: [l.tenChuongTrinh, l.gvcn ? `${t('GVCN')} ${l.gvcn}` : null, l.siSo != null ? t('{n} em', { n: l.siSo }) : null].filter(Boolean).join(' · ') }))} />
                  </Truong>
                )}
              </>
            )}
            {CO_NGAY.includes(viec) && <Truong nhan={t('Có hiệu lực từ')}><ChonNgayGan value={ngayHl} onChange={setNgayHl} soNgay={30} chuaChon={t('Mặc định: hôm nay')} /></Truong>}
            {batBuoc && (
              <Truong nhan={t('Lý do')} batBuoc loi={lf.loiCua(loi, 'ly-do')}>
                <input className="field w-full" maxLength={2000} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
              </Truong>
            )}
            {viec === 'xoa' && (
              <>
                <p className="m-0 text-sm text-slate-200">{t('Xoá hồ sơ và mọi dữ liệu của các em này.')} <span className="text-slate-400">{t('Khôi phục được trong 30 ngày (Quản trị › Đã xoá hoặc Lưu trữ).')}</span></p>
                <ul className="m-0 list-none space-y-0.5 p-0" aria-label={t('Học viên sẽ xoá')}>
                  {xem.rows.filter((r) => !r.lyDoBo).map((r) => (
                    <li key={r.studentId} className="text-sm text-slate-200">{r.ten}{r.lop && <span className="text-slate-400"> · {r.lop}</span>}</li>
                  ))}
                </ul>
                {(xem.tong.mat ?? []).length > 0 && (
                  <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-slate-300">
                    {xem.tong.mat!.map((m) => <span key={m.nhan}>{dichChu(m.nhan)} <b className="text-slate-100">{m.so}</b></span>)}
                  </p>
                )}
                <Truong nhan={t('Gõ {chu} để xác nhận', { chu: CHU_XAC_NHAN_XOA })} batBuoc>
                  <input className="field w-full" value={goXoa} onChange={(e) => setGoXoa(e.target.value)} autoComplete="off" spellCheck={false} />
                </Truong>
              </>
            )}
            {!batBuoc && viec !== 'luu-tru' && viec !== 'bo-luu-tru' && viec !== 'xoa' && (
              <Truong nhan={t('Lý do')} tuyChon><input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} /></Truong>
            )}
          </Khoi>
          {dangThu && (
            <Khoi tieuDe={`${viec === 'xoa' ? t('Chưa xoá') : t('Chưa lưu')} · ${chuaLuu.length}`}>
              <ul className="m-0 list-none space-y-1 p-0">
                {chuaLuu.map((c) => <li key={c.studentId} className="text-sm text-slate-200">{ten(c.studentId)}<span className="block text-xs text-late">{dichChu(c.message)}</span></li>)}
              </ul>
            </Khoi>
          )}
          {xem.tong.boQua > 0 && (
            <Khoi tieuDe={t('Bỏ qua {n} học viên', { n: xem.tong.boQua })}>
              <ul className="m-0 list-none space-y-1 p-0">
                {xem.rows.filter((r) => r.lyDoBo).map((r) => <li key={r.studentId} className="text-sm text-slate-200">{r.ten}<span className="block text-xs text-slate-500">{dichChu(r.lyDoBo!)}</span></li>)}
              </ul>
            </Khoi>
          )}
        </>
      )}
    </KhungPanel>
  );
}
