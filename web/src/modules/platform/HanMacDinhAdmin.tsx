import { useRef, useState, type KeyboardEvent } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { NhatKyMuc } from './NhatKyChung.tsx';
import type { HanMacDinh, MaHan } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type Xem = { id: number; han: HanMacDinh; goc: HanMacDinh; suaDuoc: boolean };
type GiaTri = Record<string, number>;

const THU: Record<number, string> = { 2: t('T2'), 3: t('T3'), 4: t('T4'), 5: t('T5'), 6: t('T6'), 7: t('T7'), 8: t('CN') };
const TUAN: Record<number, string> = { [-2]: t('trước 2 tuần'), [-1]: t('tuần trước'), 0: t('tuần đó'), 1: t('tuần sau'), 2: t('sau 2 tuần') };
const ngay = (n: number) => t('{n} ngày', { n });

/** Mỗi hạn: tên việc · tính từ · ai làm · cách hiện giá trị · ⓘ luật gốc. Thứ tự + nhóm = bảng spec mục 5.4. */
const DONG: { ma: MaHan; nhom: string; viec: string; tu: string; ai: string; hien: (v: GiaTri) => string; luat?: string }[] = [
  { ma: 'cham_test', nhom: t('Test & điểm'), viec: t('Chấm Mock / Test lớp thường'), tu: t('tuần thi'), ai: t('GV chấm'), hien: (v) => `${THU[v.thu]} ${TUAN[v.tuanLech]}`, luat: t('T19 · cả Fast Track và lớp thường; MT0 cùng hạn.') },
  { ma: 'xac_nhan_case', nhom: t('Case & PA'), viec: t('Xác nhận Case · thêm PA'), tu: t('ngày phát hiện'), ai: t('GV phụ trách'), hien: (v) => t('{a} ngày · gấp {b}', { a: v.ngay, b: v.ngayGap }), luat: t('Gấp = Case gấp hoặc SOS 3. Progress Test lớp thường luôn theo hạn thường.') },
  { ma: 'xac_minh_tin_hieu', nhom: t('Case & PA'), viec: t('Xác nhận nguyên nhân Case'), tu: t('ngày Case chờ xác nhận nguyên nhân'), ai: t('GV phụ trách'), hien: (v) => ngay(v.ngay) },
  { ma: 'ql_duyet_pa', nhom: t('Case & PA'), viec: t('QL trả lời Chờ duyệt'), tu: t('ngày gửi'), ai: t('QL chi nhánh'), hien: (v) => ngay(v.ngay), luat: t('Đề xuất PA, xin ý kiến, đề xuất sửa thông tin, xử lý / thu hồi Ý thức, xin xoá — tính cả ngày gửi.') },
  { ma: 'ghi_kq_pa', nhom: t('Case & PA'), viec: t('Ghi kết quả PA'), tu: t('ngày bắt đầu PA'), ai: t('người làm PA'), hien: (v) => t('{n} tuần / lần · hết T3', { n: v.kyTuan }) },
  { ma: 'ket_thuc_pa', nhom: t('Case & PA'), viec: t('PA quy chế "1 tháng"'), tu: t('ngày tạo PA'), ai: '—', hien: (v) => t('{n} ngày, tới CN', { n: v.ngay }) },
  { ma: 'xu_ly_vi_pham', nhom: t('Ý thức'), viec: t('Xử lý vi phạm'), tu: t('ngày QL duyệt'), ai: t('GVCN'), hien: (v) => ngay(v.ngay) },
  { ma: 'bao_ph_vi_pham', nhom: t('Ý thức'), viec: t('Báo PH sau xử lý vi phạm'), tu: t('ngày GVCN lưu'), ai: t('TVV của em'), hien: (v) => ngay(v.ngay), luat: t('N1, N2 · ngày lưu là ngày 1 · gồm T7, CN · hết 23:59.') },
  { ma: 'chot_lo_trinh', nhom: t('Lộ trình & lớp'), viec: t('Chốt lộ trình lớp thường'), tu: t('tuần Final'), ai: t('QL'), hien: (v) => `${THU[v.thu]} ${TUAN[v.tuanLech]}`, luat: t('N20 · nhắc từ T2 tuần trước Final; bàn giao hết CN tuần Final.') },
  { ma: 'ban_giao_chuyen_lop', nhom: t('Lộ trình & lớp'), viec: t('Bàn giao chuyển lớp'), tu: t('ngày quyết định chuyển lớp'), ai: t('GV lớp cũ'), hien: (v) => ngay(v.ngay), luat: t('Tính cả ngày quyết định.') },
  { ma: 'ban_giao_doi_gv', nhom: t('Lộ trình & lớp'), viec: t('Bàn giao đổi GV'), tu: t('ngày đổi GV'), ai: t('GV cũ'), hien: (v) => t('{a} ngày · còn xem {b}', { a: v.ngay, b: v.xemNgay }), luat: t('N29 · GV cũ còn xem lớp cũ thêm số ngày này.') },
  { ma: 'buoc_tiep_sau_thi', nhom: t('Lộ trình & lớp'), viec: t('Bước tiếp sau thi thật'), tu: t('ngày có KQ thi'), ai: t('TVV của em'), hien: (v) => ngay(v.ngay), luat: 'N6' },
  { ma: 'xet_lai', nhom: t('Lộ trình & lớp'), viec: t('Xét lại lộ trình'), tu: t('tuần đầu lớp mới'), ai: t('QL'), hien: (v) => `${THU[v.thu]} ${TUAN[v.tuanLech]}`, luat: t('N21 · Mini Test: CN tuần sau ngày ghi (giữ).') },
];
const NHAN_TRUONG: Record<string, string> = { ngay: t('Số ngày'), ngayGap: t('Gấp'), xemNgay: t('Còn xem'), kyTuan: t('Số tuần'), tuanLech: t('Tuần'), thu: t('Thứ') };
const GIOI: Record<string, [number, number]> = { ngay: [1, 60], ngayGap: [1, 60], xemNgay: [0, 60], kyTuan: [1, 4] };

/**
 * QUẢN TRỊ › HẠN MẶC ĐỊNH (QTV2-HAN, chủ SP 11/11 "luật lệ hạn mặc định"): 14 hạn trước đây viết cứng, nay sửa được — Quản trị sửa tại dòng, Quản lý
 * xem. Mỗi lần lưu = một phiên bản, CHỈ ÁP CHO VIỆC SINH SAU (việc đã sinh giữ hạn lúc sinh); Hoàn tác = bản mới bằng bản trước. Hàng khác gốc:
 * "gốc: … · Về gốc". Cột Nhật ký bên phải (mẫu chung tab cấu hình).
 */
export function HanMacDinhAdmin() {
  const r = useApi<Xem>('/admin/cau-hinh/han');
  const phien = useSession();
  const quanTri = !!phien.session?.nav?.admin;
  const toast = useToast();
  const [sua, setSua] = useState<MaHan | null>(null);
  /* Bản vừa lưu (id + hạn) — lưu / Hoàn tác liền nhau không đợi GET tải lại (khỏi 409 giả với chính mình). */
  const vuaLuu = useRef<{ id: number; han: HanMacDinh } | null>(null);
  if (r.error) return <Card title={t('Hạn mặc định')}><ErrorState message={r.error.message} hint={r.error.hint} status={r.error.status} onRetry={r.reload} /></Card>;
  if (!r.data) return <Card title={t('Hạn mặc định')}><Skeleton rows={8} /></Card>;
  const d = r.data;
  const suaDuoc = d.suaDuoc;

  const hienTai = () => (vuaLuu.current && vuaLuu.current.id >= d.id ? vuaLuu.current : { id: d.id, han: d.han });
  /* Ghép MỘT hạn lên bản mới nhất rồi lưu — lưu, Về gốc và Hoàn tác đều chỉ đổi đúng hạn đó (không đè hạn khác vừa sửa). */
  const gui = async (ma: MaHan, v: GiaTri, khoiPhucTu?: number) => {
    const cur = hienTai();
    const han = { ...cur.han, [ma]: v } as HanMacDinh;
    const x = await api.put<{ id: number; truocId: number; truocHan: HanMacDinh; doi: unknown[] }>('/admin/cau-hinh/han', { han, tuPhienBan: cur.id, khoiPhucTu });
    vuaLuu.current = { id: x.id, han };
    r.reload(); invalidate('/admin/nhat-ky'); void phien.reload();   // phiên mang bản hạn — các màn khác tính theo bản mới ngay
    return x;
  };
  const luu = async (ma: MaHan, v: GiaTri) => {
    const x = await gui(ma, v);
    if (!x.doi.length) return;
    const ten = DONG.find((q) => q.ma === ma)!.viec;
    toast.hoanTac(t('Đã lưu hạn {viec}', { viec: ten }), () => {
      gui(ma, x.truocHan[ma] as unknown as GiaTri, x.truocId).then(() => toast.push('ok', t('Đã hoàn tác'))).catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
    }, { key: `han-${ma}` });
  };

  const nhom = [...new Set(DONG.map((q) => q.nhom))];
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="card min-w-0" aria-label={t('Hạn mặc định')}>
        <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
          <h2 className="h-khoi m-0 text-lg font-bold text-slate-100">{t('Hạn mặc định')}</h2>
          <span className="text-[13px] text-slate-400">{t('{n} hạn', { n: DONG.length })}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[13px] text-slate-400">{t('Áp cho việc sinh sau')}
            <NutLuat label={t('Áp cho việc sinh sau')}>{t('Việc đã sinh giữ hạn lúc sinh; việc sinh từ ngày lưu theo hạn mới. Hạn sửa tay từng việc (Gia hạn) vẫn thắng.')}</NutLuat></span>
        </header>
        {!suaDuoc && <p className="m-0 border-b px-4 py-2 text-[13px] text-slate-400" style={{ borderColor: 'var(--line)' }}>{t('Quản trị hệ thống sửa; Quản lý xem.')}</p>}
        <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_2rem] gap-3 border-b px-4 py-2 text-[13px] font-semibold text-slate-400 sm:grid" style={{ borderColor: 'var(--line-strong)' }}>
          <span>{t('Việc')}</span><span>{t('Hạn')}</span><span>{t('Tính từ')}</span><span>{t('Ai làm')}</span><span />
        </div>
        {nhom.map((n) => (
          <section key={n}>
            <div className="flex min-h-[42px] items-center gap-2 border-b px-4 text-[15px] font-bold text-slate-100" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', boxShadow: 'inset 3px 0 0 var(--accent)' }}>
              {n}<span className="text-[13px] font-normal tabular-nums text-slate-400">{DONG.filter((q) => q.nhom === n).length}</span>
            </div>
            <ul className="m-0 list-none p-0">
              {DONG.filter((q) => q.nhom === n).map((q) => {
                const v = d.han[q.ma] as unknown as GiaTri;
                const g = d.goc[q.ma] as unknown as GiaTri;
                const khacGoc = JSON.stringify(v) !== JSON.stringify(g);
                return (
                  <li key={q.ma} className="grid gap-1 border-b px-4 py-2.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_2rem] sm:items-center sm:gap-3" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[15px] text-slate-100">{q.viec}</span>
                    <span className="min-w-0">
                      {sua === q.ma ? (
                        <SuaHan v={v} onThoi={() => setSua(null)} onLuu={async (moi) => { await luu(q.ma, moi); setSua(null); }} />
                      ) : suaDuoc ? (
                        <button type="button" aria-label={`${t('Sửa')} ${q.viec}`} onClick={() => setSua(q.ma)}
                          className={`inline-flex min-h-[32px] items-center rounded-md border px-2.5 text-[15px] font-semibold hover:border-[color:var(--accent)] max-sm:min-h-[44px] ${khacGoc ? 'text-accent' : 'text-slate-100'}`}
                          style={{ borderColor: 'var(--line-strong)' }}>{q.hien(v)}</button>
                      ) : <span className={`text-[15px] font-semibold ${khacGoc ? 'text-accent' : 'text-slate-100'}`}>{q.hien(v)}</span>}
                      {khacGoc && sua !== q.ma && (
                        <span className="mt-0.5 block text-xs text-slate-400">{t('gốc: {g}', { g: q.hien(g) })}
                          {suaDuoc && <button type="button" className="ml-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-accent" onClick={() => void luu(q.ma, g).catch((e: any) => toast.push('error', e?.message ?? t('Không lưu được')))}>{t('Về gốc')}</button>}
                        </span>
                      )}
                    </span>
                    <span className="text-[13px] text-slate-400 sm:text-sm">{t('từ')} {q.tu}<span className="sm:hidden"> · {q.ai}</span></span>
                    <span className="hidden text-sm text-slate-400 sm:block">{q.ai}</span>
                    <span>{q.luat && <NutLuat label={q.viec}>{q.luat}</NutLuat>}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </section>
      <NhatKyMuc muc="han" quanTri={quanTri} />
    </div>
  );
}

/** Ô sửa một hạn tại dòng: số ngày / tuần (ô số), thứ + tuần lệch (ô chọn). Enter lưu, Esc thôi (đã đổi thì hỏi một lần). Lỗi máy chủ giữ giá trị + báo tại ô. */
function SuaHan({ v, onThoi, onLuu }: { v: GiaTri; onThoi: () => void; onLuu: (v: GiaTri) => Promise<void> }) {
  const [x, setX] = useState<GiaTri>({ ...v });
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hoiBo, setHoiBo] = useState(false);
  const daDoi = JSON.stringify(x) !== JSON.stringify(v);
  const ngoai = () => { if (busy) return; if (daDoi) setHoiBo(true); else onThoi(); };
  const luu = async () => {
    if (busy) return;
    const sai = Object.entries(x).find(([k, n]) => GIOI[k] && (!Number.isInteger(n) || n < GIOI[k][0] || n > GIOI[k][1]));
    if (sai) { setLoi(t('{ten}: số nguyên từ {a} đến {b}', { ten: NHAN_TRUONG[sai[0]], a: GIOI[sai[0]][0], b: GIOI[sai[0]][1] })); return; }
    if (!daDoi) { onThoi(); return; }
    setBusy(true); setLoi(null);
    try { await onLuu(x); } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  const phim = (e: KeyboardEvent) => {
    const o = (e.target as HTMLElement).tagName;
    if (e.key === 'Enter' && (o === 'INPUT' || o === 'SELECT')) { e.preventDefault(); void luu(); }   // Enter ở nút = bấm nút đó
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); ngoai(); }
  };
  return (
    <span className="grid gap-1.5" onKeyDown={phim}>
      <span className="flex flex-wrap items-center gap-1.5">
        {Object.keys(v).map((k, i) => (k === 'thu' || k === 'tuanLech' ? (
          <select key={k} autoFocus={i === 0} className="field w-auto max-sm:min-h-[44px]" aria-label={NHAN_TRUONG[k]} value={x[k]} disabled={busy}
            onChange={(e) => setX({ ...x, [k]: Number(e.target.value) })}>
            {Object.entries(k === 'thu' ? THU : TUAN).sort((a, b) => Number(a[0]) - Number(b[0])).map(([n, ten]) => <option key={n} value={n}>{ten}</option>)}
          </select>
        ) : (
          <label key={k} className="inline-flex items-center gap-1 text-[13px] text-slate-400">{k !== 'ngay' && k !== 'kyTuan' && NHAN_TRUONG[k]}
            <input autoFocus={i === 0} type="number" inputMode="numeric" className="field w-16 text-center tabular-nums max-sm:min-h-[44px]" aria-label={NHAN_TRUONG[k]}
              aria-invalid={!!loi} value={x[k]} min={GIOI[k]?.[0]} max={GIOI[k]?.[1]} disabled={busy} onChange={(e) => setX({ ...x, [k]: Number(e.target.value) })} />
            {k === 'kyTuan' ? t('tuần') : t('ngày')}
          </label>
        )))}
      </span>
      {loi && <span className="text-xs text-late" role="alert">{loi}</span>}
      {hoiBo ? (
        <span className="flex flex-wrap items-center gap-1.5" role="status">
          <span className="text-xs text-slate-300">{t('Chưa lưu thay đổi')}</span>
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={() => setHoiBo(false)}>{t('Ở lại')}</button>
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" onClick={onThoi}>{t('Bỏ thay đổi')}</button>
        </span>
      ) : (
        <span className="flex gap-1.5">
          <button type="button" className="btn btn-sm max-sm:min-h-[44px]" disabled={busy} onClick={ngoai}>{daDoi ? t('Huỷ thay đổi') : t('Đóng')}</button>
          <button type="button" className="btn btn-sm btn-primary max-sm:min-h-[44px]" disabled={busy} onClick={() => void luu()}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
        </span>
      )}
    </span>
  );
}
