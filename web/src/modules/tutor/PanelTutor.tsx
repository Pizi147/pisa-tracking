import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { KhungPanel, Khoi, Truong } from '../../ui/KhungPanel.tsx';
import { BoLocDoan, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { BoChonThoiGian } from '../phanTich/BoChonThoiGian.tsx';
import { ngay, type KhoangNgay, type LoiTruong } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import {
  KET_LUAN, NHAN_KET_LUAN, TIEU_CHI, nhanKyNang, nhanNoiDay, nhanSdt,
  type BuoiDay, type ChiNhanh, type DongTutor, type KetLuan, type NhanXet, type PanelTutorKq, type TieuChi,
} from './kieu.ts';
import { HopTutor } from './HopTutor.tsx';

/** Lọc bảng buổi: bấm một ô số = buổi "Không" của tiêu chí đó / buổi ≤ 2 sao; "Chỉ buổi chưa đạt" = có "Không" hoặc ≤ 2 sao. */
type LocBuoi = 'tat-ca' | 'chua-dat' | TieuChi | 'sao';
const chuaDat = (b: BuoiDay) => b.chuanBi === false || b.taiLieu === false || b.feedbackGv === false || (b.danhGia != null && b.danhGia <= 2);
const khopBuoi = (l: LocBuoi, b: BuoiDay) => (l === 'tat-ca' ? true : l === 'chua-dat' ? chuaDat(b) : l === 'sao' ? b.danhGia != null && b.danhGia <= 2 : b[l] === false);

/**
 * PANEL MỘT TUTOR (TU-b, đặc tả mục 7, mockup mục 3, 7) — đầu (SĐT · nơi dạy · kỹ năng, Sửa / Bổ sung) → 5 ô số (bấm = lọc bảng buổi) → Nhận xét
 * (Head tutor / Quản trị: Kết luận * + Nhận xét * ≥ 10 ký tự; sửa / xoá của mình trong 24 giờ; QL chỉ đọc) → Buổi dạy (người ghi ở dòng phụ).
 * Không link sang hồ sơ HV / Case (Q2). Đổi khoảng thời gian ở đây = đổi khoảng chung của trang.
 */
export function PanelTutor({ id, tieuChi, khoang, onKhoang, dsChiNhanh, ds, onDong }: {
  id: number; tieuChi?: TieuChi; khoang: KhoangNgay; onKhoang: (k: KhoangNgay) => void; dsChiNhanh: ChiNhanh[]; ds: DongTutor[]; onDong: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const dienThoai = useDienThoai();
  const toast = useToast();
  const qs = new URLSearchParams({ kieu: khoang.kieu, tu: khoang.tu, den: khoang.den }).toString();
  const { data, loading, error, reload } = useApi<PanelTutorKq>(`/tutors/${id}?${qs}`, [id, qs]);
  const [loc, setLoc] = useState<LocBuoi>(tieuChi ?? 'tat-ca');
  const [kl, setKl] = useState<KetLuan | null>(null);
  const [noiDung, setNoiDung] = useState('');
  const [dangSua, setDangSua] = useState<number | null>(null);
  const [loiChung, setLoiChung] = useState<string | null>(null);
  const lf = useLoiForm();
  const [gui, setGui] = useState(false);
  const [xoa, setXoa] = useState<NhanXet | null>(null);
  const [suaTutor, setSuaTutor] = useState(false);

  const daGo = !!noiDung.trim() || !!kl;
  /* Luật lỗi form chung (PR-N1): lý do dưới ô sau khi rời ô / bấm Lưu; chân panel "n ô cần sửa ↑". */
  const loi: LoiTruong[] = [
    ...(kl ? [] : [{ khoa: 'tutor-kl', nhan: t('Kết luận'), lyDo: t('Chọn Kết luận') }]),
    ...(noiDung.trim().length >= 10 ? [] : [{ khoa: 'tutor-nx', nhan: t('Nhận xét'), lyDo: t('Nhận xét cần ít nhất 10 ký tự.') }]),
  ];
  const boForm = () => { setKl(null); setNoiDung(''); setDangSua(null); setLoiChung(null); lf.datLai(); };
  async function luu() {
    lf.bam();
    if (loi.length) { document.getElementById(lf.oId(loi[0].khoa))?.focus(); return; }
    setGui(true);
    try {
      const than = { ketLuan: kl, noiDung: noiDung.trim() };
      if (dangSua) await api.patch(`/tutors/nhan-xet/${dangSua}`, than); else await api.post(`/tutors/${id}/nhan-xet`, than);
      boForm();
      invalidate('/tutors');
      toast.push('ok', dangSua ? t('Đã sửa nhận xét') : t('Đã lưu nhận xét'));
    } catch (e) {
      setLoiChung(e instanceof ApiError ? e.message : t('Không lưu được — thử lại.'));
    } finally { setGui(false); }
  }
  async function xoaNx(n: NhanXet) {
    setGui(true);
    try {
      await api.del(`/tutors/nhan-xet/${n.id}`);
      setXoa(null);
      if (dangSua === n.id) boForm();
      invalidate('/tutors');
      toast.push('ok', t('Đã xoá nhận xét'));
    } catch (e) {
      toast.push('error', e instanceof ApiError ? e.message : t('Không xoá được — thử lại.'));
    } finally { setGui(false); }
  }

  const tu = data?.tutor;
  const so = data?.so;
  const buoi = (data?.buoi ?? []).filter((b) => khopBuoi(loc, b));
  const soChuaDat = (data?.buoi ?? []).filter(chuaDat).length;
  const dau = (v: boolean | null) => (v == null ? <span className="text-faint">—</span>
    : v ? <span className="whitespace-nowrap text-xs text-ok">✓ {t('Có')}</span> : <span className="whitespace-nowrap text-xs font-semibold text-late">✗ {t('Không')}</span>);
  const sao = (v: number | null) => (v == null ? <span className="text-faint">—</span> : <span className={`tabular-nums ${v <= 2 ? 'font-semibold text-late' : ''}`}>★ {v}</span>);
  const oSo = (k: LocBuoi, nhan: string, gt: React.ReactNode) => (
    <button type="button" aria-pressed={loc === k} onClick={() => setLoc(loc === k ? 'tat-ca' : k)}
      className={`flex min-h-[44px] flex-col items-start rounded-lg border px-3 py-2 text-left ${loc === k ? 'shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`}
      style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
      <span className="text-xs text-slate-400">{nhan}</span><b className="text-lg font-semibold tabular-nums text-slate-100">{gt}</b>
    </button>
  );
  const tl = (v: [number, number]) => (v[1] ? <span className={v[0] < v[1] ? 'text-late' : ''}>{v[0]}<span className="text-sm text-slate-500">/{v[1]}</span></span> : '—');
  const hvO = (b: BuoiDay) => (
    <span className="block min-w-0"><b className="font-semibold text-slate-100">{b.hocVien}</b>
      <span className="block text-xs text-slate-400">{[b.lop, b.nguoiGhi ? t('ghi: {ten}', { ten: b.nguoiGhi }) : null].filter(Boolean).join(' · ')}</span></span>
  );
  const nxO = (b: BuoiDay) => (
    <span className="block text-xs text-slate-300">{b.nhanXet}
      {b.nhanXetTutor && <span className="mt-0.5 block text-slate-400">{t('Về tutor')}: {b.nhanXetTutor}</span>}</span>
  );
  const hinh = (b: BuoiDay) => (b.hinhThuc === 'online' ? 'Online' : b.hinhThuc === 'offline' ? 'Offline' : '—');

  return (
    <KhungPanel tieuDe={tu?.ten ?? t('Tutor')} rong="rong" onDong={onDong}
      chan={{ huy: { onClick: onDong }, daSua: daGo, conThieu: data?.coSua ? lf.conThieu(loi) : undefined,
        chinh: data?.coSua ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={gui} onClick={luu}>{dangSua ? t('Lưu sửa') : t('Lưu nhận xét')}</button> : undefined }}>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data || !tu || !so ? <Skeleton rows={8} /> : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span>{[nhanSdt(tu.sdt) || null, nhanNoiDay(tu.noiDay), nhanKyNang(tu.kyNang)].filter(Boolean).join(' · ')}</span>
              {tu.thieu.length > 0 && <span className="text-xs text-slate-500">{tu.thieu.map((x) => (x === 'sdt' ? t('Thiếu SĐT') : t('Thiếu nơi dạy'))).join(' · ')}</span>}
              <span className="flex-1" />
              {data.coSua && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSuaTutor(true)}>{tu.thieu.length ? t('Bổ sung') : t('Sửa')}</button>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <BoChonThoiGian khoang={khoang} onChange={onKhoang} />
              <span className="flex-1" />
              {tu.ketLuan && <span className="text-xs text-slate-300">{NHAN_KET_LUAN[tu.ketLuan.kl]} <span className="tabular-nums text-slate-500">{ngay(tu.ketLuan.luc, homNay)}</span></span>}
            </div>
            {tu.chuY && <p className="m-0 text-xs text-late">{t('Cần chú ý vì')}: {dich(tu.chuY)}</p>}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {oSo('tat-ca', t('Buổi'), so.buoi)}
              {TIEU_CHI.map((c) => <span key={c.k} className="contents">{oSo(c.k, c.nhan, tl(so[c.k]))}</span>)}
              {oSo('sao', t('Đánh giá'), so.danhGia == null ? '—' : <span className={so.danhGia <= 2 ? 'text-late' : ''}>★ {so.danhGia.toFixed(1)}</span>)}
            </div>

            <Khoi tieuDe={t('Nhận xét')}>
              {data.coSua && (
                <div className="space-y-2" data-hd="tutor-nhan-xet">
                  <Truong nhan={t('Kết luận')} batBuoc as="div" loi={lf.loiCua(loi, 'tutor-kl')}>
                    <span {...lf.o(loi, 'tutor-kl')} tabIndex={-1} className="inline-flex max-w-full">
                    <BoLocDoan<KetLuan | ''> ariaLabel={t('Kết luận')} value={kl ?? ''} onChange={(k) => setKl(k || null)}
                      muc={KET_LUAN.map((k) => ({ key: k, nhan: NHAN_KET_LUAN[k] }))} />
                    </span>
                  </Truong>
                  <Truong nhan={t('Nhận xét')} batBuoc loi={lf.loiCua(loi, 'tutor-nx')} dem={{ co: noiDung.trim().length, can: 10 }}>
                    <textarea className="field w-full" rows={dienThoai ? 3 : 2} maxLength={1000} value={noiDung}
                      placeholder={t('Ví dụ: Đã gọi nhắc gửi feedback cho GV sau mỗi buổi.')}
                      {...lf.o(loi, 'tutor-nx')} onChange={(e) => setNoiDung(e.target.value)} />
                  </Truong>
                  {loiChung && <p role="alert" className="m-0 text-xs text-late">{loiChung}</p>}
                  {dangSua && <button type="button" className="btn btn-sm btn-ghost" onClick={boForm}>{t('Bỏ sửa')}</button>}
                </div>
              )}
              {data.nhanXet.length ? (
                <ol className="m-0 list-none space-y-2 p-0">
                  {data.nhanXet.map((n) => (
                    <li key={n.id} className="flex gap-3 text-sm">
                      <span className="w-12 shrink-0 tabular-nums text-xs text-slate-500">{ngay(n.luc, homNay)}</span>
                      <span className="min-w-0 flex-1">
                        <b className="text-xs font-semibold text-slate-200">{NHAN_KET_LUAN[n.kl]}</b> <span className="text-slate-300">{n.noiDung}</span>
                        <span className="block text-xs text-slate-500">{n.nguoi}{n.suaLuc ? ` · ${t('đã sửa')}` : ''}</span>
                      </span>
                      {n.coSua && (
                        <span className="flex shrink-0 gap-1">
                          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => { setDangSua(n.id); setKl(n.kl); setNoiDung(n.noiDung); setLoiChung(null); lf.datLai(); }}>{t('Sửa')}</button>
                          <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setXoa(n)}>{t('Xoá')}</button>
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              ) : <p className="m-0 text-xs text-slate-500">{t('Chưa có nhận xét.')}</p>}
            </Khoi>

            <Khoi tieuDe={t('Buổi dạy')}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">{t('{n} buổi', { n: buoi.length })}</span>
                <span className="flex-1" />
                <button type="button" aria-pressed={loc === 'chua-dat'} className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={!soChuaDat && loc !== 'chua-dat'}
                  onClick={() => setLoc(loc === 'chua-dat' ? 'tat-ca' : 'chua-dat')}>
                  {loc === 'chua-dat' ? '✓ ' : ''}{t('Chỉ buổi chưa đạt')} <span className="tabular-nums text-slate-500">{soChuaDat}</span>
                </button>
              </div>
              {!buoi.length ? <p className="m-0 text-xs text-slate-500">{t('Không có buổi nào trong khoảng này.')}</p>
                : dienThoai ? (
                  <div>{buoi.map((b) => (
                    <TheDong key={b.id} dau={<span className="block min-w-0">{hvO(b)}<span className="text-xs text-slate-500">{ngay(b.ngay, homNay)} · {b.kn || '—'} · {hinh(b)}</span></span>}
                      dong={[...TIEU_CHI.map((c) => ({ nhan: c.nhan, noiDung: <span className="flex justify-end">{dau(b[c.k])}</span> })),
                        { nhan: t('Đánh giá'), noiDung: <span className="flex justify-end">{sao(b.danhGia)}</span> },
                        { nhan: t('Nhận xét buổi'), noiDung: nxO(b) }]} />
                  ))}</div>
                ) : (
                  <div className="table-scroll">
                    <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 640 }}>
                      <colgroup><col style={{ width: 48 }} /><col style={{ width: 132 }} /><col style={{ width: 34 }} /><col style={{ width: 60 }} />
                        <col style={{ width: 64 }} /><col style={{ width: 58 }} /><col style={{ width: 84 }} /><col style={{ width: 46 }} /><col /></colgroup>
                      <thead><tr>
                        <th className="th">{t('Ngày')}</th><th className="th">{t('Học viên · lớp')}</th><th className="th">KN</th><th className="th">{t('Hình thức')}</th>
                        {TIEU_CHI.map((c) => <th key={c.k} className="th">{c.k === 'taiLieu' ? t('Tài liệu') : c.nhan}</th>)}
                        <th className="th" title={t('Đánh giá')}><span aria-hidden>★</span><span className="sr-only">{t('Đánh giá')}</span></th><th className="th">{t('Nhận xét buổi')}</th>
                      </tr></thead>
                      <tbody>{buoi.map((b) => (
                        <tr key={b.id} className="row-hover align-top">
                          <td className="td tabular-nums text-xs text-slate-400">{ngay(b.ngay, homNay)}</td>
                          <td className="td">{hvO(b)}</td><td className="td text-xs">{b.kn || '—'}</td><td className="td text-xs">{hinh(b)}</td>
                          {TIEU_CHI.map((c) => <td key={c.k} className="td">{dau(b[c.k])}</td>)}
                          <td className="td">{sao(b.danhGia)}</td><td className="td">{nxO(b)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
            </Khoi>
          </div>
        )}
      <ConfirmDialog open={!!xoa} onClose={() => setXoa(null)} onConfirm={() => xoa && xoaNx(xoa)} busy={gui} danger z="z-[60]"
        title={t('Xoá nhận xét?')} body={xoa ? `${NHAN_KET_LUAN[xoa.kl]} · ${xoa.noiDung}` : ''} confirmLabel={t('Xoá')} />
      {suaTutor && tu && <HopTutor dsChiNhanh={dsChiNhanh} ds={ds} tutor={tu} coBuoi={data?.coBuoi ?? true}
        onDong={() => setSuaTutor(false)} onXong={() => setSuaTutor(false)} onXoa={() => { setSuaTutor(false); onDong(); }} />}
    </KhungPanel>
  );
}
