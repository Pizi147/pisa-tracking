import { useEffect, useState } from 'react';
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

const TEN_HUONG: Record<string, string> = { len_lop: 'Lên', fast_track: 'Lên FT', hoc_lai: 'Học lại', bao_luu: 'Tạm dừng học (bảo lưu)', dung_hoc: 'Dừng học hẳn', chuyen_lop: 'Chuyển lớp FT' };
const BAT_BUOC_LY_DO: ViecHangLoat[] = ['ket-thuc', 'huy-lenh'];
const CO_NGAY: ViecHangLoat[] = ['ket-thuc', 'hoc-lai'];

/**
 * PANEL XEM TRƯỚC LÀM NHIỀU HỌC VIÊN (PR-LUI-b, 06/10) — bấm một việc ở thanh dính đáy (hồ sơ lớp, Lưu trữ) thì ra đây: số hệ quả, học viên bị bỏ qua
 * (kèm lý do), lý do chung, rồi xác nhận. Gửi từng lô 8; lỗi giữa chừng giữ phần đã lưu, nút đổi thành "Thử lại n học viên". Xong thì toast Hoàn tác.
 * OV-12a: Xoá — liệt kê em + dữ liệu sẽ mất, gõ XOÁ, nút đỏ, mỗi request một em; không Hoàn tác.
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
  const nap = () => {
    setLoiXem(null);
    api.post<XemTruocHangLoat>('/hang-loat-hoc-vien/xem-truoc', { viec, studentIds: ids }).then(setXem).catch((e: any) => setLoiXem(e.message));
  };
  useEffect(nap, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const batBuoc = BAT_BUOC_LY_DO.includes(viec);
  const loi = dsLoi([
    ...(batBuoc ? [{ khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 }] : []),
    ...(viec === 'hoc-lai' && dich === 'moi' ? [{ khoa: 'lop', nhan: 'Lớp', toiThieu: 1 }] : []),
  ], { 'ly-do': lyDo, lop: lopMoiId === '' ? '' : String(lopMoiId) });
  const idsLam = (xem?.rows ?? []).filter((r) => !r.lyDoBo).map((r) => r.studentId);
  const ten = (sid: number) => xem?.rows.find((r) => r.studentId === sid)?.ten ?? `#${sid}`;
  const dangThu = chuaLuu.length > 0;
  /* OV-12a: Xoá nói "xoá", không nói "lưu". */
  const chuKetQua = (ok: number, loi: number) => (viec === 'xoa' ? `Đã xoá ${ok} em · ${loi} em chưa xoá` : `Đã lưu ${ok} học viên · ${loi} học viên chưa lưu`);

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
    if (kq.failed.length) {
      setChuaLuu(kq.failed);
      toast.push('error', chuKetQua(tatCa.length, kq.failed.length));
      return;
    }
    if (viec === 'xoa') { toast.push('ok', `Đã xoá ${tatCa.length} học viên`); onDone(); onClose(); return; }
    toast.hoanTac(`${NHAN_VIEC_HANG_LOAT[viec]} ${tatCa.length} học viên`, async () => {
      const r = await hoanTacHangLoat(viec, tatCa);
      for (const k of ['/students', '/classes', '/hoc-vien-lop', '/cases', '/lenh-chuyen', '/my-work']) invalidate(k);
      toast.push(r.failed.length ? 'error' : 'ok', r.failed.length ? `Hoàn tác ${r.ok.length} học viên · ${r.failed.length} học viên chưa được — ${r.failed[0].message}` : 'Đã hoàn tác');
      onDone();
    }, { key: `hang-loat:${viec}` });
    onDone(); onClose();
  };

  const theoHuong = Object.entries(xem?.tong.theoHuong ?? {}).map(([h, n]) => `${TEN_HUONG[h] ?? h} ${n}`);
  return (
    <KhungPanel tieuDe={`${NHAN_VIEC_HANG_LOAT[viec]} · ${ids.length} học viên`} lop={maLop} onDong={busy ? () => {} : onClose}
      chan={{
        daSua: !!lyDo.trim() || !!ngayHl || !!goXoa.trim(),
        conThieu: lf.conThieu(loi),
        dongTren: dangThu ? <p role="alert" className="m-0 px-4 pt-2 text-xs text-late tabular-nums">{chuKetQua(daLuu.length, chuaLuu.length)}</p> : undefined,
        chinh: (
          <button type="button" className={`btn ${viec === 'xoa' ? 'btn-danger' : 'btn-primary'} min-h-[44px] sm:min-h-0`} onClick={chay}
            disabled={busy || !xem || (!dangThu && !idsLam.length) || (viec === 'xoa' && !khopXacNhanXoa(goXoa))}>
            {busy ? (tienDo ? `Đang lưu ${tienDo.xong}/${tienDo.tong}…` : 'Đang lưu…') : dangThu ? `Thử lại ${chuaLuu.length} học viên` : xem ? `${NHAN_VIEC_HANG_LOAT[viec]} ${idsLam.length} học viên` : NHAN_VIEC_HANG_LOAT[viec]}
          </button>
        ),
      }}>
      {loiXem ? <ErrorState message={loiXem} onRetry={nap} /> : !xem ? <Skeleton rows={4} /> : (
        <>
          <Khoi tieuDe={NHAN_VIEC_HANG_LOAT[viec]}>
            <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-slate-300">
              <span><b className="text-slate-100">{idsLam.length}</b> học viên</span>
              {viec === 'ket-thuc' && <><span>Case đóng <b className="text-slate-100">{xem.tong.caseDong}</b></span><span>PA huỷ <b className="text-slate-100">{xem.tong.paHuy}</b></span><span>Quyết định chuyển lớp huỷ <b className="text-slate-100">{xem.tong.lenhHuy}</b></span></>}
              {viec === 'huy-lenh' && theoHuong.map((t) => <span key={t}>{t}</span>)}
              {viec === 'hoc-lai' && dich === 'cu' && xem.tong.lopMoLai.length > 0 && <span className="text-soon">Mở lại lớp {xem.tong.lopMoLai.join(', ')}</span>}
            </p>
            {viec === 'hoc-lai' && (
              <>
                <span role="group" aria-label="Học lại" className="flex flex-wrap gap-1.5">
                  <NutChon chon={dich === 'cu'} onClick={() => setDich('cu')}>Về lớp cũ</NutChon>
                  <NutChon chon={dich === 'moi'} onClick={() => setDich('moi')}>Sang lớp mới</NutChon>
                </span>
                {dich === 'moi' && (
                  <Truong nhan="Lớp" batBuoc loi={lf.loiCua(loi, 'lop')}>
                    <ChonLop ariaLabel="Lớp" {...lf.o(loi, 'lop')} value={lopMoiId || null} onChange={(id) => setLopMoiId(id ?? '')} khongKhop={dsLop.data ? undefined : 'Đang tải…'}
                      ds={(dsLop.data?.lop ?? []).filter((l) => !l.ft).map((l) => ({ id: l.id, ma: l.code, phu: [l.tenChuongTrinh, l.gvcn ? `GVCN ${l.gvcn}` : null, l.siSo != null ? `${l.siSo} em` : null].filter(Boolean).join(' · ') }))} />
                  </Truong>
                )}
              </>
            )}
            {CO_NGAY.includes(viec) && <Truong nhan="Có hiệu lực từ"><ChonNgayGan value={ngayHl} onChange={setNgayHl} soNgay={30} chuaChon="Mặc định: hôm nay" /></Truong>}
            {batBuoc && (
              <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loi, 'ly-do')}>
                <input className="field w-full" maxLength={2000} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
              </Truong>
            )}
            {viec === 'xoa' && (
              <>
                <p className="m-0 text-sm text-slate-200">Xoá hẳn hồ sơ và mọi dữ liệu của các em này. <span className="text-soon">Không hoàn tác được.</span></p>
                <ul className="m-0 list-none space-y-0.5 p-0" aria-label="Học viên sẽ xoá">
                  {xem.rows.filter((r) => !r.lyDoBo).map((r) => (
                    <li key={r.studentId} className="text-sm text-slate-200">{r.ten}{r.lop && <span className="text-slate-400"> · {r.lop}</span>}</li>
                  ))}
                </ul>
                {(xem.tong.mat ?? []).length > 0 && (
                  <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-slate-300">
                    {xem.tong.mat!.map((m) => <span key={m.nhan}>{m.nhan} <b className="text-slate-100">{m.so}</b></span>)}
                  </p>
                )}
                <Truong nhan={`Gõ ${CHU_XAC_NHAN_XOA} để xác nhận`} batBuoc>
                  <input className="field w-full" value={goXoa} onChange={(e) => setGoXoa(e.target.value)} autoComplete="off" spellCheck={false} />
                </Truong>
              </>
            )}
            {!batBuoc && viec !== 'luu-tru' && viec !== 'bo-luu-tru' && viec !== 'xoa' && (
              <Truong nhan="Lý do" tuyChon><input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} /></Truong>
            )}
          </Khoi>
          {dangThu && (
            <Khoi tieuDe={`${viec === 'xoa' ? 'Chưa xoá' : 'Chưa lưu'} · ${chuaLuu.length}`}>
              <ul className="m-0 list-none space-y-1 p-0">
                {chuaLuu.map((c) => <li key={c.studentId} className="text-sm text-slate-200">{ten(c.studentId)}<span className="block text-xs text-late">{c.message}</span></li>)}
              </ul>
            </Khoi>
          )}
          {xem.tong.boQua > 0 && (
            <Khoi tieuDe={`Bỏ qua ${xem.tong.boQua} học viên`}>
              <ul className="m-0 list-none space-y-1 p-0">
                {xem.rows.filter((r) => r.lyDoBo).map((r) => <li key={r.studentId} className="text-sm text-slate-200">{r.ten}<span className="block text-xs text-slate-500">{r.lyDoBo}</span></li>)}
              </ul>
            </Khoi>
          )}
        </>
      )}
    </KhungPanel>
  );
}
