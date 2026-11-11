import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
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
  chiNhanh: string; gvcn: string | null; soHvTungHoc: number; finishedAt: string | null;
  /** PR-LUI-b: nút "Mở lại" (Quản lý của lớp / Quản trị). */
  coTheMoLai: boolean;
};
type HocVienLuuTru = {
  id: number; studentCode: string; fullName: string; lopCuoi: string | null; chiNhanh: string | null;
  archivedAt: string; cycleIdCuoi: number | null;
  /** P7 (k5): em Tạm dừng (giữ chỗ lớp) hay Kết thúc học — cả hai ở Lưu trữ; một nút Quay lại học. */
  trangThai: 'tam-dung' | 'ket-thuc'; loTrinh: string | null; coTheQuayLai: boolean;
  /** SUA-NHO-QUYEN: "Sửa thông tin" (email, liên hệ) em Tạm dừng — máy chủ tính cùng cổng PATCH. */
  coTheSuaThongTin: boolean;
};
type DuLieuLuuTru = { lop: LopLuuTru[]; hocVien: HocVienLuuTru[]; phamVi: { chiNhanh: number | null } };

type TabLuuTru = 'lop' | 'hv';

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
  const tab: TabLuuTru = params.get('tab') === 'hv' ? 'hv' : 'lop';
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

  /*
   * U02 (SUA-RA-1311, đề bài 13/11): kết quả "Quay lại học · n em" TỪNG EM nằm lại ở thanh chọn (khe `dongTren`, mẫu OV-13d) sau khi toast tắt:
   * "Đã xong n/m · Cần chọn lớp: … · Xử lý tiếp · Chưa lưu được: … · Thử lại". Xử lý tiếp mở đúng panel của em đầu (cùng `useQuayLaiHoc` một em); Thử lại
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
        <b className="tabular-nums text-slate-100">{t('Đã xong {n}/{m}', { n: ketQua.filter((x) => x.tt === 'xong').length, m: ketQua.length })}</b>
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
            <span className="text-late">· {t('Chưa lưu được')}: {loi.map((x) => (x.loi ? `${x.ten} (${x.loi})` : x.ten)).join(', ')}</span>
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangChay} onClick={() => void quayLaiNhieu(loi.map((x) => x.id), true)}>{t('Thử lại')}</button>
          </span>
        )}
        <span className="flex-1" />
        <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" aria-label={t('Đóng kết quả')} onClick={() => setKetQua(null)}>✕</button>
      </>
    );
  })();

  return (
    <div className="page space-y-3">
      <div>
        <button className="btn btn-sm btn-ghost max-sm:min-h-[44px]" onClick={() => navigate('/hoc-vien')}>‹ {t('Học viên & Lớp')}</button>
      </div>
      <h1 className="text-xl font-bold text-slate-100 m-0">{t('Lưu trữ')}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <input className="field w-full sm:w-72" aria-label={t('Tìm')} placeholder={t('Tìm tên, mã học viên hoặc mã lớp…')}
          value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
        <BranchFilter branchId={branchId} onBranch={(id) => setParam({ cn: id ? String(id) : null, branchId: null })} />
      </div>

      <HangTab panelId="luu-tru-ds" ariaLabel={t('Lưu trữ')} value={tab} onChange={(k) => setParam({ tab: k === 'lop' ? null : k })}
        tabs={[
          { key: 'lop', label: t('Lớp đã kết thúc'), so: data?.lop.length },
          { key: 'hv', label: t('Học viên đã lưu trữ'), so: data?.hocVien.length },
        ]} />

      {error && <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />}
      {loading && !data && <Skeleton rows={6} />}
      <div id="luu-tru-ds" role="tabpanel" aria-label={t('Lưu trữ')} className={cu ? 'dang-tai-lai space-y-3' : 'space-y-3'} aria-busy={cu || undefined}>
      {data && tab === 'lop' && (
        data.lop.length === 0
          ? <Card><Empty title={loc ? t('Không có lớp khớp "{loc}"', { loc }) : t('Chưa có lớp nào kết thúc')} /></Card>
          : <Bang ten={t('Lớp đã kết thúc')} khoa={(l) => l.id} hang={data.lop}
              cot={[
                { key: 'lop', nhan: t('Lớp'), kieu: 'ten', rong: 180 },
                { key: 'trinhDo', nhan: t('Trình độ'), kieu: 'chu', rong: 180 },
                /* B12: chi nhánh là trường đã biết khi danh sách chỉ một chi nhánh (đã lọc) — chỉ thêm cột khi lẫn nhiều chi nhánh. */
                ...(new Set(data.lop.map((l) => l.chiNhanh)).size > 1 ? [{ key: 'cn', nhan: t('Chi nhánh'), kieu: 'chu', rong: 140 } as CotBang] : []),
                { key: 'gvcn', nhan: t('GVCN'), kieu: 'chu', rong: 240 },
                { key: 'hv', nhan: t('HV từng học'), kieu: 'so', rong: 120 },
                { key: 'ketThuc', nhan: t('Kết thúc'), kieu: 'chu', linhHoat: true },
                { key: 'nut', nhan: '', kieu: 'nut', rong: 200 },
              ]}
              oCua={(l, c) => {
                if (c.key === 'lop') return <Link to={`/hoc-vien/lop/${l.id}`} className="link font-bold">{l.code}</Link>;
                if (c.key === 'trinhDo') return l.tenChuongTrinh ?? l.ma ?? '—';
                if (c.key === 'cn') return l.chiNhanh;
                if (c.key === 'gvcn') return l.gvcn ? <span className="text-slate-400">{l.gvcn}</span> : <span className="text-slate-500">—</span>;
                if (c.key === 'hv') return l.soHvTungHoc;
                if (c.key === 'ketThuc') return l.finishedAt ? ngay(l.finishedAt) : '—';
                return (
                  <span className="inline-flex gap-2">
                    <Link to={`/hoc-vien/lop/${l.id}?tab=tong-ket`} className="btn btn-sm min-h-[44px] no-underline sm:min-h-0">{t('Tổng kết')}</Link>
                    {l.coTheMoLai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoLai(l)}>{t('Mở lại')}</button>}
                  </span>
                );
              }} />
      )}
      {data && tab === 'hv' && (
        data.hocVien.length === 0
          ? <Card><Empty title={loc ? t('Không có học viên khớp "{loc}"', { loc }) : t('Chưa có học viên nào được lưu trữ')} /></Card>
          : <div className="space-y-1.5">
              {data.hocVien.some((s) => s.coTheQuayLai) && (
                <div className="flex justify-end">
                  <button type="button" aria-pressed={chon.bat} onClick={chon.batTat}
                    className={`btn btn-sm min-h-[44px] sm:min-h-0 ${chon.bat ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]' : 'btn-ghost'}`}>{t('Chọn nhiều học viên')}</button>
                </div>
              )}
              {data.hocVien.map((s) => {
                const dung = s.trangThai === 'tam-dung';
                return (
                  <div key={s.id} className={`card flex flex-wrap items-center gap-x-2.5 gap-y-1.5 p-3 ${chon.chon.has(s.id) ? 'bg-[color:var(--accent-soft)]' : ''}`}>
                    {chon.bat && s.coTheQuayLai && <OChon chon={chon} id={s.id} ten={s.fullName} />}
                    <Link to={`/hoc-vien/${s.id}`} className="ten-ho-so khong-mui">{s.fullName}</Link>
                    <Nhan tone={dung ? 'doing' : 'soon'}>{dung ? t('Tạm dừng · Có thể quay lại') : t('Kết thúc học')}</Nhan>
                    <span className="min-w-0 flex-1 text-xs text-slate-500 max-sm:basis-full">
                      {[s.lopCuoi ?? t('chưa từng học lớp nào'), s.loTrinh ? `FT ${s.loTrinh}` : null, dung ? t('từ {ngay}', { ngay: ngay(s.archivedAt) }) : ngay(s.archivedAt), s.chiNhanh].filter(Boolean).join(' · ')}
                    </span>
                    {!chon.bat && s.cycleIdCuoi != null && (
                      <Link to={duongHoSoHocVien(s.id, { tab: 'hanh-trinh', tongKet: s.cycleIdCuoi })} className="btn btn-sm min-h-[44px] no-underline sm:min-h-0">{t('Tổng kết')}</Link>
                    )}
                    {!chon.bat && s.coTheSuaThongTin && (
                      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setSuaEm(s)}>{NHAN_VIEC_QUAN_LY.info}</button>
                    )}
                    {!chon.bat && s.coTheQuayLai && (
                      <button type="button" className={dung ? 'btn btn-sm btn-primary min-h-[44px] sm:min-h-0' : 'btn btn-sm min-h-[44px] sm:min-h-0'} disabled={quayLai.dangMo === s.id}
                        onClick={() => { dangXuLy.current = null; void quayLai.mo({ id: s.id, ten: s.fullName, lop: s.lopCuoi }); }}>{t('Quay lại học')}</button>
                    )}
                  </div>
                );
              })}
            </div>
      )}
      {/* Q-RL2b: học viên đã xoá 30 ngày (thùng rác) — Khôi phục tại dòng; rỗng thì không vẽ. */}
      {tab === 'hv' && <DaXoaAdmin loai="hoc_vien" loc={loc} />}
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
