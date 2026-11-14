import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { theoChiNhanh } from '../../ui/theoChiNhanh.ts';
import { Bang, type CotBang } from '../../ui/Bang.tsx';
import { BranchFilter, useChiNhanhMacDinh } from '../../ui/Filters.tsx';
import { MoLaiLopPanel } from '../classes/XoaKetThucLopPanel.tsx';
import { DaXoaAdmin } from '../platform/DaXoaAdmin.tsx';
import { OChon, ThanhChonNhieu, useChonNhieu } from './chonNhieuHocVien.tsx';
import { useQuayLaiHoc } from './QuayLaiHoc.tsx';
import { SuaThongTinMotEm } from './StudentManagePanel.tsx';
import { danhDauXong, quayLaiLo, type KetQuaEm } from './quayLaiLo.ts';
import { NHAN_VIEC_QUAN_LY, duongHoSoHocVien, ngay } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

type LopLuuTru = {
  id: number; code: string; ma: string | null; tenChuongTrinh: string | null;
  chiNhanh: string; branchId: number; gvcn: string | null; soHvTungHoc: number; finishedAt: string | null;
  /** PR-LUI-b: nút "Mở lại" (Quản lý của lớp / Quản trị). */
  coTheMoLai: boolean;
  /** Chủ SP 12/11: nhóm Fast Track · Lớp thường. */
  ft: boolean;
};
type HocVienLuuTru = {
  id: number; studentCode: string; fullName: string; lopCuoi: string | null; lopCuoiId: number | null; chiNhanh: string | null; branchId: number | null;
  archivedAt: string; cycleIdCuoi: number | null;
  /** P7 (k5): em Tạm dừng (giữ chỗ lớp) hay Kết thúc học — cả hai ở Lưu trữ; một nút Quay lại học. */
  trangThai: 'tam-dung' | 'ket-thuc'; loTrinh: string | null; coTheQuayLai: boolean;
  /** SUA-NHO-QUYEN: "Sửa thông tin" (email, liên hệ) em Tạm dừng — máy chủ tính cùng cổng PATCH. */
  coTheSuaThongTin: boolean;
};
type DuLieuLuuTru = { lop: LopLuuTru[]; hocVien: HocVienLuuTru[]; phamVi: { chiNhanh: number | null } };

type TabLuuTru = 'lop' | 'hv' | 'xoa';
/** GD-16 (mockup ⑩ L1, L2): hàng dải nhóm trong bảng (Fast Track / Lớp thường, hoặc lớp cuối) — dòng giả của `Bang` (`hang-nhom-lop`, mẫu BangLuotPanel). */
type DaiNhom = { dai: string; n: number; khoa: string; href?: string; donVi: 'lop' | 'em' };
const laDai = (h: object): h is DaiNhom => 'dai' in h;

/**
 * KHU LƯU TRỮ (PR-LT, Q16/Q22, chủ sản phẩm 23/09) — lớp đã kết thúc · học viên đã lưu trữ,
 * ẩn khỏi Học viên & Lớp mặc định nhưng vẫn tra cứu được ở đây. P7 (N11, mockup V6 `trang-thai-hv.html` k5): em Tạm dừng cũng ở đây (nhãn
 * "Tạm dừng · Có thể quay lại"), MỘT nút Quay lại học cho cả hai loại (thay Bỏ lưu trữ + Học lại); chọn nhiều → "Quay lại học · n em".
 * Q-RL2b: tab Học viên có thêm khối "Đã xoá" (thùng rác 30 ngày, `DaXoaAdmin loai="hoc_vien"`).
 */
export default function LuuTruPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab: TabLuuTru = params.get('tab') === 'hv' ? 'hv' : params.get('tab') === 'xoa' ? 'xoa' : 'lop';
  const cnUrl = params.get('cn') ?? params.get('branchId');
  const macDinh = useChiNhanhMacDinh();
  const branchId = cnUrl ? Number(cnUrl) : macDinh;
  const q = params.get('q') ?? '';
  const [draftQ, setDraftQ] = useState(q);
  const loc = q.trim();
  const [moLai, setMoLai] = useState<LopLuuTru | null>(null);
  const [suaEm, setSuaEm] = useState<HocVienLuuTru | null>(null);
  /* PR-LUI-b → P7: "Chọn nhiều học viên" — thanh dính đáy "Quay lại học · n em"; từng em đi đúng hướng máy chủ chọn (`useQuayLaiHoc`). */
  const chon = useChonNhieu();

  /* Dựa trên params MỚI NHẤT (ref) — không phải `params` của lần vẽ cũ (react-router 6 cũng đóng băng bản của `setParams(fn)`):
     timer debounce 300 ms không đè tab / chi nhánh vừa chọn. */
  const paramsMoi = useRef(params);
  paramsMoi.current = params;
  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(paramsMoi.current);
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === '') next.delete(k); else next.set(k, v); }
    paramsMoi.current = next;
    setParams(next, { replace: true });
  };

  /* `q` đổi từ ngoài (Back / Forward) → ô gõ theo; `q` do chính ô gõ vừa đẩy lên thì không đè chữ đang gõ tiếp. */
  const qDaGui = useRef(q);
  useEffect(() => { if (q !== qDaGui.current) { qDaGui.current = q; setDraftQ(q); } }, [q]);
  useEffect(() => {
    const t = setTimeout(() => { if (draftQ !== q) { qDaGui.current = draftQ; setParam({ q: draftQ || null }); } }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQ]);

  const qs = (() => {
    const s = new URLSearchParams();
    if (q.trim()) s.set('q', q.trim());
    if (branchId) s.set('branchId', String(branchId));
    return `/hoc-vien-lop/luu-tru?${s.toString()}`;
  })();
  const { data, loading, error, reload, cu } = useApi<DuLieuLuuTru>(qs, [], { giuCu: true });
  /* GD-16: số tab "Đã xoá" khi mở trang (+1 câu); danh sách thùng rác chỉ nạp khi bấm tab (`DaXoaAdmin` gắn ở tab đó). */
  const demXoa = useApi<{ n: number }>('/thung-rac/dem?loai=hoc_vien');

  /*
   * U02 (SUA-RA-1311, đề bài 13/11): kết quả "Quay lại học · n em" TỪNG EM nằm lại ở thanh chọn (khe `dongTren`, mẫu OV-13d) sau khi toast tắt:
   * "Xong n/m · Cần chọn lớp: … · Xử lý tiếp · Không lưu được: … · Thử lại". Xử lý tiếp mở đúng panel của em đầu (cùng `useQuayLaiHoc` một em); Thử lại
   * chỉ gửi các em lỗi. Bỏ chọn / tắt chọn nhiều = bỏ kết quả.
   */
  const [ketQua, setKetQua] = useState<KetQuaEm[] | null>(null);
  const dangXuLy = useRef<number | null>(null);   // em mở panel từ "Xử lý tiếp" — panel xong thì đánh dấu xong
  const quayLai = useQuayLaiHoc(() => {
    const id = dangXuLy.current;
    if (id != null) {
      dangXuLy.current = null;
      setKetQua((k) => (k ? danhDauXong(k, id) : k));
      if (chon.chon.has(id)) chon.doi(id);
    }
    reload();
  });
  useEffect(() => { if (!chon.bat) setKetQua(null); }, [chon.bat]);
  /* Chọn nhiều: em quay lại được một bấm (lớp cũ còn chạy) làm ngay; em cần chọn lớp / lộ trình làm tiếp từng em — không đoán thay người dùng. */
  const [dangChay, setDangChay] = useState(false);
  const dangChayRef = useRef(false);   // chặn bấm lặp trước khi state kịp vẽ lại
  /** `thuLai`: chỉ gửi lại các em lỗi, giữ kết quả các em khác của lần trước. */
  const quayLaiNhieu = async (ids: number[], thuLai = false) => {
    if (dangChayRef.current) return;
    dangChayRef.current = true; setDangChay(true);
    try {
      const kq = await quayLaiLo(ids, (id) => data?.hocVien.find((x) => x.id === id)?.fullName ?? `#${id}`, api, thuLai ? ketQua ?? [] : []);
      const xong = kq.filter((x) => x.tt === 'xong' && ids.includes(x.id)).map((x) => x.id);
      for (const k of ['/students', '/hoc-vien-lop', '/classes', '/my-work']) invalidate(k);
      /* Em đã xong rời danh sách chọn; em chưa xong (cần chọn lớp, lỗi, đóng hộp xác nhận) vẫn được chọn để làm tiếp. */
      const chuaXong = [...new Set([...kq.filter((x) => x.tt !== 'xong').map((x) => x.id), ...ids.filter((id) => !kq.some((x) => x.id === id))])];
      if (chuaXong.length) chon.tatCa(chuaXong, true); else chon.bo();
      setKetQua(kq.some((x) => x.tt !== 'xong') ? kq : null);
      reload();
      if (xong.length) {
        toast.hoanTac(t('Đã cho {n} em quay lại học', { n: xong.length }), async () => {
          let ok = 0; let loiDau = '';
          for (const id of xong) { try { await api.post(`/students/${id}/hoan-tac-quay-lai`, {}); ok++; } catch (e: any) { loiDau ||= e.message; } }
          for (const k of ['/students', '/hoc-vien-lop', '/classes']) invalidate(k);
          setKetQua(null);
          reload();
          if (ok) toast.push('ok', ok === xong.length ? t('Đã hoàn tác') : t('Đã hoàn tác {ok}/{n}', { ok, n: xong.length }));
          if (loiDau) toast.push('error', loiDau);
        }, { key: `quay-lai-nhieu:${xong.join(',')}` });
      }
    } finally { dangChayRef.current = false; setDangChay(false); }
  };

  const dongKetQua = (() => {
    if (!ketQua) return null;
    const chonLop = ketQua.filter((x) => x.tt === 'chon-lop');
    const loi = ketQua.filter((x) => x.tt === 'loi');
    const dau = chonLop[0];
    return (
      <>
        <b className="tabular-nums text-slate-100">{t('Xong {n}/{m}', { n: ketQua.filter((x) => x.tt === 'xong').length, m: ketQua.length })}</b>
        {dau && (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="text-slate-300">· {t('Cần chọn lớp')}: {chonLop.map((x) => x.ten).join(', ')}</span>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangChay || quayLai.dangMo === dau.id}
              onClick={() => { dangXuLy.current = dau.id; void quayLai.mo({ id: dau.id, ten: dau.ten, lop: data?.hocVien.find((x) => x.id === dau.id)?.lopCuoi ?? null }); }}>
              {t('Xử lý tiếp · {ten}', { ten: dau.ten })}
            </button>
          </span>
        )}
        {loi.length > 0 && (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="text-late">· {t('Không lưu được')}: {loi.map((x) => (x.loi ? `${x.ten} (${x.loi})` : x.ten)).join(', ')}</span>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangChay} onClick={() => void quayLaiNhieu(loi.map((x) => x.id), true)}>{t('Thử lại')}</button>
          </span>
        )}
        <span className="flex-1" />
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" aria-label={t('Đóng kết quả')} onClick={() => setKetQua(null)}>✕</button>
      </>
    );
  })();

  /* GD-16 (lời 37): chia theo chi nhánh — dải "tên · n lớp / n em"; ô Xem một chi nhánh → chỉ dải đó (máy chủ đã lọc). Thứ tự trong dải GIỮ máy chủ. */
  const cnLop = theoChiNhanh(data?.lop ?? [], (l) => ({ id: l.branchId, ten: l.chiNhanh }));
  const cnHv = theoChiNhanh(data?.hocVien ?? [], (s) => (s.branchId != null ? { id: s.branchId, ten: s.chiNhanh ?? '—' } : null));
  const dauCn = (ten: string, dem: string) => (
    <h2 className="m-0 flex items-baseline gap-2 text-[15px] font-bold text-slate-100">{ten}<span className="text-[13px] font-normal tabular-nums text-slate-400">{dem}</span></h2>
  );
  const nhanDai = (h: DaiNhom) => (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-[14px] font-bold text-[color:var(--text)]">
      {h.href ? <Link to={h.href} className="link">{h.dai}</Link> : h.dai}<span className="text-[13px] font-medium text-faint">{h.donVi === 'lop' ? t('{n} lớp', { n: h.n }) : t('{n} em', { n: h.n })}</span>
    </span>
  );
  /* Lớp: trong chi nhánh dải Fast Track → Lớp thường (máy chủ đã xếp FT trước, số to trước). */
  const hangLop = (ds: LopLuuTru[]): (LopLuuTru | DaiNhom)[] => [{ ten: 'Fast Track', ft: true }, { ten: t('Lớp thường'), ft: false }]
    .flatMap((g) => { const xs = ds.filter((l) => l.ft === g.ft); return xs.length ? [{ dai: g.ten, n: xs.length, khoa: `dai-${g.ft ? 'ft' : 'thuong'}`, donVi: 'lop' as const }, ...xs] : []; });
  /* Học viên: trong chi nhánh dải lớp cuối (mã lớp là link · n em); em chưa học lớp nào là dải cuối (máy chủ xếp cuối). */
  const hangHv = (ds: HocVienLuuTru[]): (HocVienLuuTru | DaiNhom)[] => {
    const m = new Map<string, HocVienLuuTru[]>();
    for (const s of ds) { const k = s.lopCuoiId != null ? String(s.lopCuoiId) : 'chua'; (m.get(k) ?? m.set(k, []).get(k)!).push(s); }
    return [...m].flatMap(([k, xs]) => [{ dai: xs[0].lopCuoi ?? t('Chưa học lớp nào'), n: xs.length, khoa: `dai-${k}`, href: k === 'chua' ? undefined : `/hoc-vien/lop/${k}`, donVi: 'em' as const }, ...xs]);
  };
  const nutLop = (l: LopLuuTru) => (
    <span className="inline-flex gap-2 max-sm:w-full">
      <Link to={`/hoc-vien/lop/${l.id}?tab=tong-ket`} className="btn btn-sm min-h-[44px] no-underline sm:min-h-0 max-sm:flex-1">{t('Tổng kết')}</Link>
      {/* Chỗ nút giữ cố định để cột thẳng (mockup L1). */}
      {l.coTheMoLai ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0 max-sm:flex-1" onClick={() => setMoLai(l)}>{t('Mở lại')}</button> : <span aria-hidden className="inline-block w-[64px] max-sm:hidden" />}
    </span>
  );
  const nutHv = (s: HocVienLuuTru) => chon.bat ? null : (
    <span className="inline-flex flex-wrap justify-end gap-2 max-sm:w-full">
      {s.cycleIdCuoi != null
        ? <Link to={duongHoSoHocVien(s.id, { tab: 'hanh-trinh', tongKet: s.cycleIdCuoi })} className="btn btn-sm min-h-[44px] no-underline sm:min-h-0 max-sm:flex-1">{t('Tổng kết')}</Link>
        /* Mockup L2: em chưa có khoá học — nút mờ, lý do ngay tại nút. */
        : <span className="btn btn-sm pointer-events-none flex-col !gap-0 border-dashed text-faint min-h-[44px] sm:min-h-0 max-sm:flex-1" aria-disabled="true">{t('Tổng kết')}<span className="text-xs font-normal leading-tight">{t('chưa có khoá học')}</span></span>}
      {s.coTheSuaThongTin && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0 max-sm:flex-1" onClick={() => setSuaEm(s)}>{NHAN_VIEC_QUAN_LY.info}</button>}
      {s.coTheQuayLai && (
        <button type="button" className={s.trangThai === 'tam-dung' ? 'btn btn-sm btn-primary min-h-[44px] sm:min-h-0 max-sm:flex-1' : 'btn btn-sm min-h-[44px] sm:min-h-0 max-sm:flex-1'} disabled={quayLai.dangMo === s.id}
          onClick={() => { dangXuLy.current = null; void quayLai.mo({ id: s.id, ten: s.fullName, lop: s.lopCuoi }); }}>{t('Quay lại học')}</button>
      )}
    </span>
  );
  const ttHv = (s: HocVienLuuTru) => <Nhan tone={s.trangThai === 'tam-dung' ? 'doing' : 'soon'}>{s.trangThai === 'tam-dung' ? t('Tạm dừng · Có thể quay lại') : t('Kết thúc học')}</Nhan>;
  const tenHv = (s: HocVienLuuTru) => (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      {chon.bat && s.coTheQuayLai && <OChon chon={chon} id={s.id} ten={s.fullName} />}
      {/* OV-13f (Q8): không in mã học viên — mockup L2 vẽ mã dưới tên → KHÁC theo luật đã chốt. */}
      <Link to={`/hoc-vien/${s.id}`} className="ten-ho-so khong-mui">{s.fullName}</Link>
    </span>
  );
  const COT_LOP: CotBang[] = [
    { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 180 },
    { key: 'trinhDo', nhan: t('Trình độ'), kieu: 'chu', rong: 180 },
    { key: 'gvcn', nhan: t('GVCN'), kieu: 'chu', rong: 240 },
    { key: 'hv', nhan: t('HV từng học'), kieu: 'so', rong: 120 },
    { key: 'ketThuc', nhan: t('Kết thúc'), kieu: 'chu', linhHoat: true },
    { key: 'nut', nhan: '', kieu: 'nut', rong: 200 },
  ];
  const COT_HV: CotBang[] = [
    { key: 'hv', nhan: t('Học viên'), kieu: 'ten', rong: 240 },
    { key: 'tt', nhan: t('Trạng thái'), kieu: 'chu', rong: 230 },
    { key: 'lt', nhan: t('Lộ trình'), kieu: 'chu', rong: 110 },
    { key: 'tu', nhan: t('Từ ngày'), kieu: 'chu', linhHoat: true },
    { key: 'nut', nhan: '', kieu: 'nut', rong: 340 },
  ];

  return (
    <div className="page space-y-3">
      <div>
        <button className="btn btn-sm btn-ghost max-sm:min-h-[44px]" onClick={() => navigate('/hoc-vien')}>‹ {t('Học viên & Lớp')}</button>
      </div>
      {/* GD-16 (mockup ⑩ L1): một hàng — "Lưu trữ" · Xem (ô chi nhánh; tự ẩn khi chỉ một chi nhánh) · ô tìm bên phải; 375 một cột. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="m-0 text-xl font-bold text-slate-100">{t('Lưu trữ')}</h1>
        {/* Ô chi nhánh chung (D3 `OChiNhanh`: nhãn trong ô, tự ẩn khi chỉ một chi nhánh) — mockup ghi "Xem"; giữ một mẫu mọi trang. */}
        <BranchFilter branchId={branchId} onBranch={(id) => setParam({ cn: id ? String(id) : null, branchId: null })} />
        <input className="field w-full sm:ml-auto sm:w-80" aria-label={t('Tìm')} placeholder={t('Tìm tên, mã học viên hoặc mã lớp…')}
          value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
      </div>

      <HangTab panelId="luu-tru-ds" ariaLabel={t('Lưu trữ')} value={tab} onChange={(k) => setParam({ tab: k === 'lop' ? null : k })}
        tabs={[
          { key: 'lop', label: t('Lớp đã kết thúc'), so: data?.lop.length },
          { key: 'hv', label: t('Học viên đã lưu trữ'), so: data?.hocVien.length },
          /* GD-16 (mockup ⑩ L4): "Đã xoá" là tab thứ ba có số; rỗng vẫn hiện số 0. */
          { key: 'xoa', label: t('Đã xoá'), so: demXoa.data?.n ?? null },
        ]} />

      {error && tab !== 'xoa' && <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />}
      {loading && !data && tab !== 'xoa' && <Skeleton rows={6} />}
      <div id="luu-tru-ds" role="tabpanel" aria-label={t('Lưu trữ')} className={cu ? 'dang-tai-lai space-y-4' : 'space-y-4'} aria-busy={cu || undefined}>
      {data && tab === 'lop' && (
        data.lop.length === 0
          ? <Card><Empty title={loc ? t('Không có lớp khớp "{loc}"', { loc }) : t('Chưa có lớp nào kết thúc')} /></Card>
          : cnLop.map((g) => (
            <section key={g.khoa} aria-label={g.ten} className="space-y-1.5">
              {dauCn(g.ten, t('{n} lớp', { n: g.ds.length }))}
              <Bang<LopLuuTru | DaiNhom> ten={`${t('Lớp đã kết thúc')} · ${g.ten}`} khoa={(h) => (laDai(h) ? h.khoa : h.id)} hang={hangLop(g.ds)} cot={COT_LOP}
                lopHang={(h) => (laDai(h) ? 'hang-nhom-lop' : '')}
                oCua={(h, c) => {
                  if (laDai(h)) return c.key === 'lop' ? nhanDai(h) : null;
                  if (c.key === 'lop') return <Link to={`/hoc-vien/lop/${h.id}`} className="link font-bold">{h.code}</Link>;
                  if (c.key === 'trinhDo') return h.tenChuongTrinh ?? h.ma ?? '—';
                  if (c.key === 'gvcn') return h.gvcn ? <span className="text-slate-400">{h.gvcn}</span> : <span className="text-slate-500">—</span>;
                  if (c.key === 'hv') return h.soHvTungHoc;
                  if (c.key === 'ketThuc') return h.finishedAt ? ngay(h.finishedAt) : '—';
                  return nutLop(h);
                }}
                theRieng={(h) => (laDai(h) ? nhanDai(h) : (
                  <div className="grid gap-1.5">
                    <div className="flex items-baseline gap-2"><Link to={`/hoc-vien/lop/${h.id}`} className="link text-[15px] font-bold">{h.code}</Link><span className="text-[13px] text-dim">{h.tenChuongTrinh ?? h.ma ?? ''}</span><span className="ml-auto text-[13px] tabular-nums text-dim">{h.finishedAt ? ngay(h.finishedAt) : '—'}</span></div>
                    <div className="text-[13px] text-dim">{[h.gvcn, t('{n} HV', { n: h.soHvTungHoc })].filter(Boolean).join(' · ')}</div>
                    {nutLop(h)}
                  </div>
                ))} />
            </section>
          ))
      )}
      {data && tab === 'hv' && (
        data.hocVien.length === 0
          ? <Card><Empty title={loc ? t('Không có học viên khớp "{loc}"', { loc }) : t('Chưa có học viên nào được lưu trữ')} /></Card>
          : <>
              <div className="flex items-center gap-2 text-sm text-dim">
                <span><b className="tabular-nums text-slate-100">{data.hocVien.length}</b> {t('học viên')}</span>
                {data.hocVien.some((s) => s.coTheQuayLai) && (
                  <button type="button" aria-pressed={chon.bat} onClick={chon.batTat}
                    className={`btn btn-sm ml-auto min-h-[44px] sm:min-h-0 ${chon.bat ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : ''}`}>{t('Chọn nhiều học viên')}</button>
                )}
              </div>
              {cnHv.map((g) => (
                <section key={g.khoa} aria-label={g.ten} className="space-y-1.5">
                  {dauCn(g.ten, t('{n} em', { n: g.ds.length }))}
                  <Bang<HocVienLuuTru | DaiNhom> ten={`${t('Học viên đã lưu trữ')} · ${g.ten}`} khoa={(h) => (laDai(h) ? h.khoa : h.id)} hang={hangHv(g.ds)} cot={COT_HV}
                    lopHang={(h) => (laDai(h) ? 'hang-nhom-lop' : chon.chon.has(h.id) ? 'bg-[color:var(--accent-soft)]' : '')}
                    oCua={(h, c) => {
                      if (laDai(h)) return c.key === 'hv' ? nhanDai(h) : null;
                      if (c.key === 'hv') return tenHv(h);
                      if (c.key === 'tt') return ttHv(h);
                      if (c.key === 'lt') return h.loTrinh ? `FT ${h.loTrinh}` : <span className="text-slate-500">—</span>;
                      if (c.key === 'tu') return <span className="tabular-nums">{ngay(h.archivedAt)}</span>;
                      return nutHv(h);
                    }}
                    theRieng={(h) => (laDai(h) ? nhanDai(h) : (
                      <div className="grid gap-1.5">
                        <div className="flex items-start gap-2">{tenHv(h)}<span className="ml-auto">{ttHv(h)}</span></div>
                        <div className="text-[13px] text-dim">{[h.loTrinh ? `FT ${h.loTrinh}` : null, ngay(h.archivedAt)].filter(Boolean).join(' · ')}</div>
                        {nutHv(h)}
                      </div>
                    ))} />
                </section>
              ))}
            </>
      )}
      {tab === 'xoa' && <DaXoaAdmin loai="hoc_vien" loc={loc} branchId={branchId} onDoi={() => { demXoa.reload(); reload(); }} />}
      {data && tab === 'hv' && (
        <ThanhChonNhieu chon={chon} viec={[{ key: 'quay-lai', nhan: t('Quay lại học') }]} dangChay={dangChay} dongTren={dongKetQua} onViec={() => void quayLaiNhieu([...chon.chon])} />
      )}
      </div>
      {quayLai.panels}
      {suaEm && (
        <SuaThongTinMotEm viec="info" studentId={suaEm.id} studentName={suaEm.fullName} lop={suaEm.lopCuoi}
          onClose={() => setSuaEm(null)} onDone={() => setSuaEm(null)} />
      )}
      {moLai && (
        <MoLaiLopPanel classId={moLai.id} classCode={moLai.code} chiNhanh={moLai.chiNhanh} ketThuc={moLai.finishedAt ? ngay(moLai.finishedAt) : null}
          onClose={() => setMoLai(null)} onDone={reload} />
      )}
    </div>
  );
}
