import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, ApiError, invalidate } from '../../lib/api.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { BoLocDoan, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { maTuan, ngay, type KhoangNgay, type LoiTruong } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import {
  KET_LUAN, NHAN_KET_LUAN, NX_TOI_THIEU, TIEU_CHI, nhanKyNang, nhanNoiDay, nhanSdt,
  type BuoiDay, type ChiNhanh, type DongTutor, type KetLuan, type NhanXet, type PanelTutorKq, type TieuChi,
} from './kieu.ts';
import { HopTutor } from './HopTutor.tsx';
import { NhanLoai } from './TutorPage.tsx';

/** Lọc bảng Kết quả đã ghi: bấm một ô của dải 5 số = lần ghi "Không" của tiêu chí đó / ≤ 2 sao; "Chỉ dòng có Không" = có "Không" ở một trong ba ô. */
type LocKq = 'tat-ca' | 'khong' | TieuChi | 'sao';
const coKhong = (b: BuoiDay) => b.chuanBi === false || b.taiLieu === false || b.feedbackGv === false;
const khopKq = (l: LocKq, b: BuoiDay) => (l === 'tat-ca' ? true : l === 'khong' ? coKhong(b) : l === 'sao' ? b.danhGia != null && b.danhGia <= 2 : b[l] === false);

/** Đầu một mục của panel (mockup `.dau-muc`): vạch nhấn + chữ 15 / 700, phần phải tuỳ mục. */
function DauMuc({ chu, so, phai }: { chu: string; so?: number; phai?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
      <span aria-hidden className="h-[18px] w-[3px] rounded-sm bg-[color:var(--accent)]" />
      <h3 className="m-0 text-[15px] font-bold text-slate-100">{chu}</h3>
      {so != null && <span className="inline-grid h-[22px] min-w-[22px] place-items-center rounded-md border px-1.5 text-xs font-semibold tabular-nums text-slate-300" style={{ borderColor: 'var(--line-strong)' }}>{so}</span>}
      {phai && <span className="ml-auto flex flex-wrap items-center gap-2">{phai}</span>}
    </div>
  );
}

/**
 * PANEL MỘT NGƯỜI DẠY (TU2-6, mockup Ⓣ2 P1–P4, M2; R2.6) — đầu (tên · nhãn GV / Tutor · SĐT · nơi dạy · kỹ năng · khoảng của TRANG; "Sửa" khi người xem sửa được
 * dòng này, GV: "Hồ sơ GV ›") → dải 5 số (bấm = lọc) → Nhận xét (Head tutor / Quản trị: Kết luận * + Nhận xét * ≥ 8 ký tự; Head / CX chỉ đọc) + dòng thời gian
 * (sửa / xoá của mình) → Kết quả đã ghi (Ngày ghi · Học viên · KN · Buổi · 3 dấu · Đánh giá · Nội dung) + "Chỉ dòng có Không". Không link sang hồ sơ HV / Case (Q2).
 * Sau Lưu nhận xét: ở lại, "✓ Đã lưu nhận xét", nút chính "Người cần chú ý tiếp ›" (V12, XM-4).
 */
export function PanelTutor({ id, tieuChi, xemChuY, khoang, dsChiNhanh, chiNhanhDanhBa, ds, tiep, onTiep, onDong }: {
  id: number; tieuChi?: TieuChi; khoang: KhoangNgay;
  /** N56 ⑥: mở từ lý do "Cần chú ý" → bảng Kết quả đã ghi = đúng các dòng gây chú ý (mọi thời gian), có nút về khoảng của trang. */
  xemChuY?: boolean; dsChiNhanh: ChiNhanh[]; chiNhanhDanhBa: ChiNhanh[] | null; ds: DongTutor[];
  /** Người cần chú ý kế tiếp (theo thứ tự bảng) — null: không còn ai. */
  tiep: DongTutor | null; onTiep: (id: number) => void; onDong: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  /* N56 ⑥: id dòng gây chú ý lấy từ bảng đã nạp (không thêm request); sau khi nhận xét, bảng tải lại → hết id → tự về khoảng. */
  const [cy, setCy] = useState(!!xemChuY);
  const idsCy = cy ? (ds.find((d) => d.id === id)?.chuYIds ?? []).join(',') : '';
  const qs = new URLSearchParams({ kieu: khoang.kieu, tu: khoang.tu, den: khoang.den, ...(idsCy ? { ids: idsCy } : {}) }).toString();
  const { data, loading, error, reload } = useApi<PanelTutorKq>(`/tutors/${id}?${qs}`, [id, qs]);
  const [loc, setLoc] = useState<LocKq>(tieuChi ?? 'tat-ca');
  const [kl, setKl] = useState<KetLuan | null>(null);
  const [noiDung, setNoiDung] = useState('');
  const [dangSua, setDangSua] = useState<number | null>(null);
  const [loiChung, setLoiChung] = useState<string | null>(null);
  const lf = useLoiForm();
  const [gui, setGui] = useState(false);
  const [xoa, setXoa] = useState<NhanXet | null>(null);
  const [suaTutor, setSuaTutor] = useState(false);
  const [daLuu, setDaLuu] = useState<string | null>(null);

  const daGo = !!noiDung.trim() || !!kl;
  /* Luật lỗi form chung (PR-N1): lý do dưới ô sau khi rời ô / bấm Lưu; chân panel "n ô cần sửa ↑". */
  const loi: LoiTruong[] = [
    ...(kl ? [] : [{ khoa: 'tutor-kl', nhan: t('Kết luận'), lyDo: t('Chọn Kết luận') }]),
    ...(noiDung.trim().length >= NX_TOI_THIEU ? [] : [{ khoa: 'tutor-nx', nhan: t('Nhận xét'), lyDo: t('Nhận xét cần ít nhất {n} ký tự.', { n: NX_TOI_THIEU }) }]),
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
      setDaLuu(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      /* Lỗi lưu: GIỮ chữ đang gõ, báo dưới form. */
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
  const tatCa = data?.buoi ?? [];
  const kq = tatCa.filter((b) => khopKq(loc, b));
  const soKhong = tatCa.filter(coKhong).length;
  const khoangChu = `${maTuan(khoang.tu).ma} – ${maTuan(khoang.den).ma}`;
  const ngoaiKhoang = !!idsCy && tatCa.some((b) => b.ngay < khoang.tu || b.ngay > khoang.den);
  const dau = (v: boolean | null) => (v == null ? <span className="text-faint">—</span>
    : v ? <span className="whitespace-nowrap text-[13px] font-semibold text-ok">✓ {t('Có')}</span> : <span className="whitespace-nowrap text-[13px] font-bold text-late">✗ {t('Không')}</span>);
  const sao = (v: number | null) => (v == null ? <span className="text-faint">—</span> : <span className={`whitespace-nowrap tabular-nums ${v <= 2 ? 'font-bold text-late' : ''}`}>★ {v.toFixed(1)}</span>);
  const tl = (v: [number, number]) => (v[1] ? <span className={v[0] < v[1] ? 'text-late' : ''}>{v[0]}<small className="text-[13px] font-medium text-faint"> / {v[1]}</small></span> : '—');
  const oSo = (k: LocKq, nhan: string, gt: ReactNode) => (
    <button type="button" aria-pressed={loc === k} onClick={() => setLoc(loc === k ? 'tat-ca' : k)}
      className={`grid min-h-[52px] gap-0.5 rounded-[10px] border px-2 py-1.5 text-left sm:px-3 sm:min-h-[56px] sm:py-2 hover:border-[color:var(--accent)] ${loc === k ? '!border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[inset_0_0_0_1px_var(--accent)]' : 'bg-[color:var(--surface)]'}`}
      style={{ borderColor: loc === k ? undefined : 'var(--line)' }}>
      <span className="truncate text-[13px] font-medium text-slate-400">{nhan}</span><b className="text-[17px] font-bold tabular-nums text-slate-100">{gt}</b>
    </button>
  );
  const NHAN_LOC: Record<Exclude<LocKq, 'tat-ca' | 'khong'>, string> = {
    chuanBi: t('Chuẩn bị · Không'), taiLieu: t('Tài liệu · Không'), feedbackGv: t('Feedback GV · Không'), sao: t('Đánh giá ≤ 2'),
  };
  const cot: CotBang[] = [
    { key: 'ngay', nhan: t('Ngày ghi'), kieu: 'chu', rong: 80 },
    { key: 'hv', nhan: t('Học viên'), kieu: 'ten', rong: 200 },
    { key: 'kn', nhan: 'KN', kieu: 'chu', rong: 48 },
    { key: 'buoi', nhan: t('Buổi'), kieu: 'so', rong: 60 },
    ...TIEU_CHI.map((c): CotBang => ({ key: c.k, nhan: c.nhan, kieu: 'chu', rong: c.k === 'feedbackGv' ? 104 : c.k === 'chuanBi' ? 84 : 76 })),
    { key: 'sao', nhan: t('Đánh giá'), kieu: 'so', rong: 76 },
    { key: 'nd', nhan: t('Nội dung'), kieu: 'chu', linhHoat: true },
  ];
  /* P2-9: dòng phụ qua `phuCua` của `Bang` (lớp · người ghi; về tutor) — `Bang` biết hàng có dòng phụ nên cao đều 64. */
  const phuKq = (b: BuoiDay, c: CotBang): ReactNode => (c.key === 'hv' ? [b.lop, b.nguoiGhi ? t('ghi: {ten}', { ten: b.nguoiGhi }) : null].filter(Boolean).join(' · ')
    : c.key === 'nd' && b.nhanXetTutor ? `${t('Về tutor')}: ${b.nhanXetTutor}` : null);
  const oKq = (b: BuoiDay, c: CotBang): ReactNode => {
    switch (c.key) {
      case 'ngay': return <span className="tabular-nums">{ngay(b.ngay, homNay)}</span>;
      case 'hv': return <b className="ten-hv font-semibold text-slate-100">{b.hocVien}</b>;
      case 'kn': return b.kn || '—';
      case 'buoi': return <span className="tabular-nums">{b.soBuoi}</span>;
      case 'sao': return sao(b.danhGia);
      /* P2-9: một dòng chính (đủ chữ ở title) + "Về tutor" là dòng phụ của `Bang` → mọi hàng cao 64 như chuẩn bảng. */
      case 'nd': return <span className="text-[13px] text-slate-300" title={b.nhanXet}>{b.nhanXet}</span>;
      default: return dau(b[c.key as TieuChi]);
    }
  };

  /* Nút chính ở chân: đang viết → Lưu nhận xét; vừa lưu (form trống) → Người cần chú ý tiếp › (nếu còn). */
  const sauLuu = !!daLuu && !daGo && !dangSua;
  const nutChinh = !data?.coSua ? undefined
    : sauLuu && tiep ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => onTiep(tiep.id)}>{t('Người cần chú ý tiếp ›')}</button>
    : sauLuu ? undefined
    : <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={gui} onClick={luu}>{gui ? t('Đang lưu…') : dangSua ? t('Lưu sửa') : t('Lưu nhận xét')}</button>;
  const suaDuoc = !!tu?.suaDuoc;

  return (
    <KhungPanel tieuDe={tu?.ten ?? t('Người dạy')} rong="nguoi-day" onDong={onDong} loai={t('Người dạy')}
      dau={tu ? {
        tieu: <span className="flex min-w-0 flex-wrap items-center gap-2">{tu.ten}<NhanLoai d={tu} /></span>,
        han: tu.loai === 'gv' && tu.gvId
          ? <Link to={`/giao-vien/${tu.gvId}`} className="link inline-flex min-h-[44px] items-center whitespace-nowrap text-sm font-semibold sm:min-h-0">{t('Hồ sơ GV ›')}</Link>
          : suaDuoc ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSuaTutor(true)}>{t('Sửa')}</button> : undefined,
        dong2: [tu.sdt ? <span key="sdt" className="tabular-nums">{nhanSdt(tu.sdt)}</span> : null, nhanNoiDay(tu.noiDay), nhanKyNang(tu.kyNang), idsCy ? t('Lần ghi cần chú ý') : khoangChu].filter(Boolean),
      } : undefined}
      chan={{ huy: { onClick: onDong }, daSua: daGo, conThieu: data?.coSua ? lf.conThieu(loi) : undefined, chinh: nutChinh,
        trai: daLuu && !daGo ? <span className="text-[13px] font-semibold text-ok" role="status">✓ {t('Đã lưu nhận xét')} · {daLuu}</span> : undefined }}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : loading || !data || !tu || !so ? <Skeleton rows={8} /> : (
          <div className="space-y-4 pt-3">
            {tu.thieu.length > 0 && <p className="m-0 text-xs text-faint">{tu.thieu.map((x) => (x === 'sdt' ? t('thiếu SĐT') : t('thiếu nơi dạy'))).join(' · ')}</p>}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="group" aria-label={t('Lọc kết quả đã ghi')}>
              {oSo('tat-ca', t('Buổi'), so.buoi)}
              {TIEU_CHI.map((c) => <span key={c.k} className="contents">{oSo(c.k, c.nhan, tl(so[c.k]))}</span>)}
              {oSo('sao', t('Đánh giá'), so.danhGia == null ? '—' : <span className={so.danhGia <= 2 ? 'text-late' : ''}>★ {so.danhGia.toFixed(1)}</span>)}
            </div>

            <DauMuc chu={t('Nhận xét')} />
            {tu.chuY && (
              <p className="m-0 text-[13px] font-semibold text-late">{t('Cần chú ý')}: {idsCy ? dich(tu.chuY) : (
                <button type="button" className="-mx-1 rounded border-0 bg-transparent px-1 text-left font-semibold text-late underline underline-offset-[3px] max-sm:min-h-[44px]"
                  onClick={() => { setCy(true); setLoc('tat-ca'); }}>{dich(tu.chuY)}</button>)}
                {tu.chuYNgay && <span className="whitespace-nowrap tabular-nums"> · {ngay(tu.chuYNgay, homNay)}</span>}
                <span className="font-normal text-faint"> · {tu.ketLuan ? t('sau nhận xét {ngay}', { ngay: ngay(tu.ketLuan.luc, homNay) }) : t('chưa có nhận xét')}</span></p>
            )}
            {data.coSua ? (
              <div className="grid gap-3 rounded-[10px] border p-3.5" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }} data-hd="tutor-nhan-xet">
                <Truong nhan={t('Kết luận')} batBuoc as="div" loi={lf.loiCua(loi, 'tutor-kl')}>
                  <span {...lf.o(loi, 'tutor-kl')} tabIndex={-1} className="inline-flex max-w-full max-sm:w-full max-sm:[&_button]:!flex-auto">
                    <BoLocDoan<KetLuan | ''> v8 ariaLabel={t('Kết luận')} value={kl ?? ''} onChange={(k) => { setKl(k || null); setDaLuu(null); }}
                      muc={KET_LUAN.map((k) => ({ key: k, nhan: NHAN_KET_LUAN[k] }))} />
                  </span>
                </Truong>
                <Truong nhan={t('Nhận xét')} batBuoc loi={lf.loiCua(loi, 'tutor-nx')} dem={{ co: noiDung.trim().length, can: NX_TOI_THIEU, toiDa: 1000 }}>
                  {/* Ô thấp (2 dòng) để bảng Kết quả đã ghi không bị đẩy quá thấp (sửa sót mockup — P2 critique). */}
                  <textarea className="field w-full" rows={2} maxLength={1000} value={noiDung}
                    placeholder={t('Ví dụ: Đã gọi nhắc gửi feedback cho GV sau mỗi buổi.')}
                    {...lf.o(loi, 'tutor-nx')} onChange={(e) => { setNoiDung(e.target.value); setDaLuu(null); }} />
                </Truong>
                {loiChung && <p role="alert" className="m-0 text-xs text-late">{loiChung}</p>}
                {dangSua && <button type="button" className="btn btn-sm btn-ghost justify-self-start" onClick={boForm}>{t('Bỏ sửa')}</button>}
              </div>
            ) : <p className="m-0 text-[13px] text-slate-400">{t('Chỉ Head tutor và Quản trị viết nhận xét.')}</p>}
            {data.nhanXet.length > 0 && (
              <ol className="m-0 grid list-none p-0">
                {data.nhanXet.map((n) => (
                  <li key={n.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-baseline gap-3 border-t py-2 text-sm first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                    <span className="tabular-nums text-[13px] text-faint">{ngay(n.luc, homNay)}</span>
                    <span className="min-w-0">
                      <b className="mr-1.5 font-semibold text-slate-100">{NHAN_KET_LUAN[n.kl]}</b><span className="text-slate-300">{n.noiDung}</span>
                      <span className="mt-0.5 block text-xs text-faint">{n.nguoi}{n.suaLuc ? ` · ${t('đã sửa')}` : ''}</span>
                    </span>
                    {n.coSua ? (
                      <span className="flex shrink-0 gap-1">
                        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => { setDangSua(n.id); setKl(n.kl); setNoiDung(n.noiDung); setLoiChung(null); setDaLuu(null); lf.datLai(); }}>{t('Sửa')}</button>
                        {n.coXoa && <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setXoa(n)}>{t('Xoá')}</button>}
                      </span>
                    ) : <span />}
                  </li>
                ))}
              </ol>
            )}

            <DauMuc chu={t('Kết quả đã ghi')} so={kq.length} phai={<>
              {loc !== 'tat-ca' && loc !== 'khong' && (
                <span className="inline-flex h-[30px] items-center gap-1.5 rounded-lg border pl-2.5 pr-1 text-[13px] font-semibold text-slate-100" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
                  {NHAN_LOC[loc]}
                  <button type="button" className="grid h-6 w-6 place-items-center rounded-md border-0 bg-transparent p-0 text-xs text-slate-300 hover:text-slate-100" aria-label={t('Bỏ lọc')} onClick={() => setLoc('tat-ca')}>✕</button>
                </span>
              )}
              <button type="button" aria-pressed={loc === 'khong'} disabled={!soKhong && loc !== 'khong'} onClick={() => setLoc(loc === 'khong' ? 'tat-ca' : 'khong')}
                className={`inline-flex h-[30px] items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 text-[13px] max-sm:h-11 ${loc === 'khong' ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] font-semibold text-slate-100' : 'bg-transparent font-medium text-slate-400'} disabled:opacity-50`}
                style={{ borderColor: loc === 'khong' ? undefined : 'var(--line-strong)' }}>
                {loc === 'khong' && <span aria-hidden>✓</span>}{t('Chỉ dòng có Không')} <span className="tabular-nums text-faint">{soKhong}</span>
              </button>
            </>} />
            {idsCy && (
              <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[10px] border px-3 py-2 text-[13px] text-slate-300" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
                <span className="min-w-0 flex-1">{ngoaiKhoang
                  ? t('Đang xem {n} lần ghi cần chú ý — có lần ngoài {khoang}.', { n: tatCa.length, khoang: khoangChu })
                  : t('Đang xem {n} lần ghi cần chú ý.', { n: tatCa.length })}</span>
                <button type="button" className="btn btn-sm min-h-[44px] shrink-0 sm:min-h-0" onClick={() => { setCy(false); setLoc('tat-ca'); }}>{t('Về {khoang}', { khoang: khoangChu })}</button>
              </div>
            )}
            <Bang<BuoiDay> ten={t('Kết quả đã ghi')} khung={false} cot={cot} hang={kq} khoa={(b) => b.id} oCua={oKq} phuCua={phuKq}
              rong={{ tieuDe: tatCa.length ? t('Không có lần ghi khớp bộ lọc.') : t('Chưa có kết quả nào trong khoảng này.') }} />
          </div>
        )}
      <ConfirmDialog open={!!xoa} onClose={() => setXoa(null)} onConfirm={() => xoa && xoaNx(xoa)} busy={gui} danger z="z-[60]"
        title={t('Xoá nhận xét?')} body={xoa ? `${NHAN_KET_LUAN[xoa.kl]} · ${xoa.noiDung}` : ''} confirmLabel={t('Xoá')} />
      {suaTutor && tu && <HopTutor dsChiNhanh={dsChiNhanh} chiNhanhDanhBa={chiNhanhDanhBa} ds={ds} tutor={tu} coBuoi={data?.coBuoi ?? true}
        onDong={() => setSuaTutor(false)} onXong={() => setSuaTutor(false)} onXoa={() => { setSuaTutor(false); onDong(); }} />}
    </KhungPanel>
  );
}
