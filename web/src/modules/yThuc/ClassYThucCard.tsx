import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { Card, Empty, ErrorState, LoiTaiNho, Skeleton } from '../../ui/ui.tsx';
import { CHIP_TRON } from '../../ui/Nhan.tsx';
import { Han } from '../../ui/Han.tsx';
import { DongThoiGian } from '../../ui/DongThoiGian.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, kindCuaBac, ngay, nhanLoaiXuLy, type NhomEm, type ViolationCategory,
} from '@shared/domain/index.ts';
import { usePanelYThuc, type PanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { NhanViPham, MuiTenGap } from './NhanViPham.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BangLo, type BangYThucLop, type DongEm, type KqEm, type ViPhamV4, type YThucHocVien } from './kieu.ts';
import { CO_LO, LoYThucPanel, guiTheoLo, type ViecLo } from './LoYThucPanel.tsx';
import { OChon, ThanhChonNhieu, useChonNhieu, type ChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { PanelBaoPhTvv } from '../congViec/PanelBaoPhTvv.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NutChu } from '../../ui/KhuonViec.tsx';
import { dich, dichChu, t } from '@shared/i18n/index.ts';

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ LỚP — BẢNG THEO HỌC VIÊN (UI-Y-THUC-LOP; mockup V5 `thiet-ke/v5/ho-so-lop.html?tab=y-thuc`,
 * khung `lop-y-thuc-1440 · -toi · -375 · -bao-ph-1440`; brief chủ SP 22/10 mục 10).
 *
 *   Một hàng một em, BỐN khối nghĩa: Vi phạm chờ (nền vàng nhạt; quá hạn nền đỏ nhạt + ⚠ — chỉ ô đó, không tô cả bảng) · Bậc xử lý
 *   (bậc đã qua ✓, bậc lần này viền nhấn) · Duyệt · thu hồi (bấm → xem lần xử lý, nơi Thu hồi) · Báo PH (TVV) + MỘT nút việc của hàng.
 *   Nhóm: Cần xử lý (Quá hạn + Bắt buộc) › Chờ QL duyệt › Mới, chưa ghi nhận › Chờ TVV báo PH; "Đã xử lý · 7 ngày" và nhật ký vi phạm
 *   của lớp GẬP. Chi tiết em (thang + vi phạm + Ghi nhận / Sửa / Xoá / Xác nhận cấp bậc / Đã thực hiện) mở DƯỚI HÀNG — một em một lúc.
 *   Phối hợp SOS là khối học thuật riêng (khung xanh nhạt) cuối thẻ, không trình bày như vi phạm.
 *
 * Việc / thông báo mở `?tab=y-thuc&hv={id}&mo=xu-ly` (hoặc `mo=khai`, `mo=da-thuc-hien&xl={id}`) → mở sẵn hàng em + panel (một lần);
 * `?sub=phoi-hop` cuộn tới khối Phối hợp. GVBM (K2-39): đọc được, không thấy nút xử lý; vẫn có `+ Ghi vi phạm`.
 * OV-13d: `Chọn nhiều` (GVCN / QL) → ô tick ở mỗi hàng (+ nhóm "Chưa xác nhận cấp bậc") + thanh dính đáy: Xác nhận xử lý · Ghi nhận
 * (Hoàn tác trong thanh) · Xác nhận cấp bậc. `?mo=cap-bac` mở thẳng panel cấp bậc của các em trong việc.
 */
/** `thuong`: lớp thường — khối "Phối hợp" (không có chữ SOS); lớp FT: "Phối hợp SOS" (chủ sản phẩm 02/10). */
export function ClassYThucCard({ classId, thuong = false }: { classId: number; thuong?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const board = useApi<BangYThucLop>(`/classes/${classId}/y-thuc`);
  const roster = useApi<any[]>(`/classes/${classId}/roster`);
  const [includeDone, setIncludeDone] = useState(false);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/classes/${classId}/phoi-hop-sos${includeDone ? '?includeDone=1' : ''}`, [classId, includeDone]);
  const [moHv, setMoHv] = useState<number | null>(() => Number(params.get('hv')) || null);
  const [nhomVp, setNhomVp] = useState('');
  const chonN = useChonNhieu();
  const lo = useApi<BangLo>(chonN.bat ? `/classes/${classId}/y-thuc/lo` : null, [chonN.bat, classId]);
  const [loMo, setLoMo] = useState<{ viec: ViecLo; ids: number[] | null } | null>(null);
  const [ghiNhanKq, setGhiNhanKq] = useState<KqEm[] | null>(null);
  const [busyLo, setBusyLo] = useState(false);
  const [baoPh, setBaoPh] = useState<DongEm | null>(null);
  const [lanTai, setLanTai] = useState(0);
  const [dangGhi, setDangGhi] = useState<number | null>(null);
  const phoiHopRef = useRef<HTMLElement>(null);

  const lamMoi = () => { board.reload(); lo.reload(); setLanTai((x) => x + 1); };
  const { mo, panels } = usePanelYThuc({
    maLop: board.data?.classCode ?? null,
    onDone: lamMoi,
    roster: (roster.data ?? []).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null })),
  });

  /* Việc / thông báo: `?hv=` mở sẵn hàng em, `?mo=` mở panel đúng một lần rồi gỡ khỏi địa chỉ (quay lại không mở lại). */
  useEffect(() => {
    const hv = Number(params.get('hv')) || null;
    const moGi = params.get('mo');
    if (hv) setMoHv(hv);
    if (hv && moGi === 'xu-ly') mo({ loai: 'xu-ly', studentId: hv });
    if (hv && moGi === 'khai') mo({ loai: 'khai', studentId: hv });   // PR-VAI-a (K1-15): việc "Xác nhận cấp bậc vi phạm HV cũ"
    const xl = Number(params.get('xl')) || null;
    if (moGi === 'da-thuc-hien' && xl) mo({ loai: 'da-thuc-hien', id: xl });
    /* Rà #408 (5): đúng các em của việc "Xác nhận cấp bậc" (em mới vào web) — không phải mọi em chưa xác nhận của lớp. */
    if (moGi === 'cap-bac') {
      /* KHAI-BAC-LO: không kèm `em` → mọi em của lớp (nút "Khai / sửa cấp bậc"). */
      const em = (params.get('em') ?? '').split(',').map(Number).filter((x) => x > 0);
      setLoMo({ viec: 'cap-bac', ids: em.length ? em : null });
    }
    if (moGi || params.get('loc')) {
      const p = new URLSearchParams(params); p.delete('mo'); p.delete('xl'); p.delete('loc'); p.delete('em');
      setParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('hv'), params.get('mo')]);

  const d = board.data;
  /* Mở từ việc: cuộn tới hàng em / khối Phối hợp khi bảng đã có. */
  const daCuon = useRef(false);
  useEffect(() => {
    if (!d || daCuon.current) return;
    daCuon.current = true;
    const el = params.get('sub') === 'phoi-hop' ? phoiHopRef.current : moHv ? document.getElementById(`yt-em-${moHv}`) : null;
    cuonToi(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  const nhomHang = useMemo(() => {
    if (!d) return null;
    const choPh = (x: DongEm) => x.baoPh?.trangThai === 'mo';
    return {
      canXuLy: [...d.nhom.qua_han.map((x) => ({ x, nhom: 'qua_han' as NhomEm })), ...d.nhom.bat_buoc.map((x) => ({ x, nhom: 'bat_buoc' as NhomEm }))],
      choDuyet: d.nhom.cho_duyet.map((x) => ({ x, nhom: 'cho_duyet' as NhomEm })),
      moi: d.nhom.moi.map((x) => ({ x, nhom: 'moi' as NhomEm })),
      choBaoPh: [...d.nhom.da_xu_ly.filter(choPh), ...d.choBaoPh].map((x) => ({ x, nhom: 'da_xu_ly' as NhomEm })),
      daXuLy: d.nhom.da_xu_ly.filter((x) => !choPh(x)).map((x) => ({ x, nhom: 'da_xu_ly' as NhomEm })),
    };
  }, [d]);
  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;
  if (board.loading || !d || !nhomHang) return <Card title={t('Ý thức & Phối hợp')}><Skeleton rows={4} /></Card>;

  /* OV-13d: em chưa có vi phạm nhưng còn phải xác nhận cấp bậc (em mới vào web) — chỉ hiện khi Chọn nhiều. */
  const chuaKhai = (lo.data?.em ?? []).filter((x) => !x.nhom && x.capBac.duoc && x.capBac.khai === null);
  const daChon = (lo.data?.em ?? []).filter((x) => chonN.chon.has(x.studentId));
  const dem = (v: ViecLo) => daChon.filter((x) => (v === 'xu-ly' ? x.xuLy : v === 'ghi-nhan' ? x.ghiNhan : x.capBac).duoc).length;
  /* Ghi nhận là việc ngắn: làm ngay từ thanh, không panel; Hoàn tác = Bỏ ghi nhận đúng các vi phạm vừa ghi nhận. */
  const ghiNhanLo = async () => {
    setBusyLo(true);
    const tatCa: KqEm[] = [];
    try {
      await guiTheoLo(daChon.filter((x) => x.ghiNhan.duoc).map((x) => x.studentId), CO_LO['ghi-nhan'],
        (lo) => api.post<{ em: KqEm[] }>(`/classes/${classId}/y-thuc/lo/ghi-nhan`, { studentIds: lo }), (em) => { tatCa.push(...em); setGhiNhanKq([...tatCa]); });
    } catch (e: any) { toast.push('error', e.message); } finally {
      setBusyLo(false);
      const loi = tatCa.filter((x) => !x.ok);
      if (loi.length) toast.push('error', loi.map((x) => `${x.ten}: ${x.loi ? dichChu(x.loi) : ''}`).join(' · '));
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      lamMoi();
    }
  };
  const hoanTacGhiNhan = async () => {
    const ok = (ghiNhanKq ?? []).filter((x) => x.ok && x.ids?.length);
    setBusyLo(true);
    const r = await Promise.allSettled(ok.map((x) => api.post(`/students/${x.studentId}/y-thuc/bo-ghi-nhan`, { violationIds: x.ids })));
    setBusyLo(false);
    if (r.some((x) => x.status === 'rejected')) toast.push('error', t('{n} em chưa hoàn tác được — thử lại.', { n: r.filter((x) => x.status === 'rejected').length }));
    setGhiNhanKq(null);
    DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
    lamMoi();
  };
  const okGhiNhan = (ghiNhanKq ?? []).filter((x) => x.ok);

  /* Ghi nhận / Bỏ ghi nhận (OV-7a: bấm nhầm → vi phạm về Mới) — một hoặc nhiều vi phạm của MỘT em. */
  /* Ghi nhận xong có Hoàn tác (luật không khoá cứng); nút của em đang gửi bị khoá — không gửi hai lần. */
  const ghiNhan = async (studentId: number, ids: number[], bo = false) => {
    setDangGhi(studentId);
    try {
      await api.post(`/students/${studentId}/y-thuc/${bo ? 'bo-ghi-nhan' : 'ghi-nhan'}`, { violationIds: ids });
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      if (bo) toast.push('ok', t('Đã bỏ ghi nhận'));
      else toast.hoanTac(t('Đã ghi nhận'), () => void ghiNhan(studentId, ids, true));
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
    finally { setDangGhi(null); }
  };

  const hang = (ds: { x: DongEm; nhom: NhomEm }[]) => ds.map(({ x, nhom }) => (
    <HangEm key={x.studentId} x={x} nhom={nhom} homNay={homNay} canManage={d.canManage} chonN={chonN}
      mo={moHv === x.studentId} onMo={() => setMoHv((c) => (c === x.studentId ? null : x.studentId))}
      onPanel={mo} dangGhi={dangGhi === x.studentId} onGhiNhan={(ids) => void ghiNhan(x.studentId, ids)} onBaoPh={() => setBaoPh(x)}
      chiTiet={moHv === x.studentId ? (
        <ChiTietEm studentId={x.studentId} lanTai={lanTai} homNay={homNay} onPanel={mo} onLamMoi={lamMoi}
          onGhiNhan={(v, bo) => void ghiNhan(v.studentId, [v.id], bo)} />
      ) : null} />
  ));
  const soVp = (ds: { x: DongEm }[]) => ds.reduce((s, { x }) => s + x.viPhamCho.length, 0);
  const soQuaHan = nhomHang.canXuLy.filter((h) => h.nhom === 'qua_han').length;
  const coHang = nhomHang.canXuLy.length + nhomHang.choDuyet.length + nhomHang.moi.length + nhomHang.choBaoPh.length + nhomHang.daXuLy.length > 0;
  const vpLop = d.dongThoiGian.filter((x) => x.loai === 'vi-pham') as Extract<(typeof d.dongThoiGian)[number], { loai: 'vi-pham' }>[];
  const vpLopLoc = nhomVp ? vpLop.filter((v) => v.category === nhomVp) : vpLop;
  const tenPhoiHop = thuong ? t('Phối hợp') : t('Phối hợp SOS');
  const soPhoiHop = coord.data?.pendingCount ?? 0;

  return (
    <Card title={<span className="whitespace-nowrap">{t('Ý thức & Phối hợp')}</span>}
      action={(
        <span className="flex flex-wrap items-center justify-end gap-2">
          {d.canManage && (
            <button type="button" aria-pressed={chonN.bat} onClick={() => { chonN.batTat(); setGhiNhanKq(null); }}
              className={`btn btn-sm min-h-[44px] sm:min-h-0 ${chonN.bat ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}>
              {chonN.bat ? '✓ ' : ''}{t('Chọn nhiều')}
            </button>
          )}
          {/* KHAI-BAC-LO: một panel mọi em của lớp — không cần Chọn nhiều trước. */}
          {d.canManage && (
            <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setLoMo({ viec: 'cap-bac', ids: null })}>{t('Khai / sửa cấp bậc')}</button>
          )}
          {d.canRecord && <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'ghi', studentId: 0 })}>{t('+ Ghi vi phạm')}</button>}
        </span>
      )}
      bodyClass="p-0">
      {!coHang && !(chonN.bat && chuaKhai.length) ? (
        <div className="p-4"><Empty title={t('Không em nào cần xử lý Ý thức')} hint={t('Vi phạm mới, việc bắt buộc và đề xuất chờ QL sẽ hiện ở đây.')} /></div>
      ) : (
        <div>
          {nhomHang.canXuLy.length > 0 && (
            <NhomHang chu={t('Cần xử lý')} dem={<>{t('{n} HV · {so} vi phạm', { n: nhomHang.canXuLy.length, so: soVp(nhomHang.canXuLy) })}{soQuaHan > 0 && <> · <span className="font-semibold text-late">⚠ {t('{n} quá hạn', { n: soQuaHan })}</span></>}</>}>
              {hang(nhomHang.canXuLy)}
            </NhomHang>
          )}
          {nhomHang.choDuyet.length > 0 && <NhomHang chu={t('Chờ QL duyệt')} dem={t('{n} HV', { n: nhomHang.choDuyet.length })}>{hang(nhomHang.choDuyet)}</NhomHang>}
          {nhomHang.moi.length > 0 && <NhomHang chu={t('Mới, chưa ghi nhận')} dem={t('{n} HV · {so} vi phạm', { n: nhomHang.moi.length, so: soVp(nhomHang.moi) })}>{hang(nhomHang.moi)}</NhomHang>}
          {nhomHang.choBaoPh.length > 0 && <NhomHang chu={t('Chờ TVV báo PH')} dem={t('{n} HV', { n: nhomHang.choBaoPh.length })}>{hang(nhomHang.choBaoPh)}</NhomHang>}
          {chonN.bat && chuaKhai.length > 0 && (
            <NhomHang chu={t('Chưa xác nhận cấp bậc')} dem={t('{n} HV', { n: chuaKhai.length })}>
              {chuaKhai.map((x) => (
                <div key={x.studentId} className="flex min-h-[44px] items-center gap-2 border-t px-4" style={{ borderColor: 'var(--line)' }}>
                  <OChon chon={chonN} id={x.studentId} ten={x.ten} />
                  <span className="min-w-0 flex-1 truncate py-2.5 text-sm font-semibold text-slate-100">{x.ten}</span>
                </div>
              ))}
            </NhomHang>
          )}
          {nhomHang.daXuLy.length > 0 && (
            <Gap chu={t('Đã xử lý · 7 ngày ({n})', { n: nhomHang.daXuLy.length })} moSan={nhomHang.daXuLy.some((h) => h.x.studentId === moHv)}>
              {hang(nhomHang.daXuLy)}
            </Gap>
          )}
        </div>
      )}

      {/* Nhật ký vi phạm của lớp — gập (brief: không dàn nhật ký mặc định); lọc theo nhóm vi phạm ở trong. */}
      <Gap chu={t('Nhật ký vi phạm của lớp ({n})', { n: vpLop.length })}>
        <div className="space-y-2 px-4 pb-3">
          <select className="field min-h-[44px] w-auto py-1 text-xs sm:min-h-0" aria-label={t('Nhóm vi phạm')} value={nhomVp} onChange={(e) => setNhomVp(e.target.value)}>
            <option value="">{t('Mọi nhóm vi phạm')}</option>
            {VIOLATION_CATEGORIES.map((c) => <option key={c} value={c}>{VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}</option>)}
          </select>
          <DongThoiGian bien="day-du"
            muc={vpLopLoc.map((x) => ({
              key: `v${x.id}`, ngay: x.ngay,
              cot2: <button type="button" className="link block max-w-full truncate text-left text-sm" onClick={() => { setMoHv(x.studentId); cuonToi(document.getElementById(`yt-em-${x.studentId}`)); }}>{x.ten}</button>,
              tieuDe: x.viPham,
              dongPhu: [dich(x.nhom), x.nguoiGhi ? t('{ten} ghi', { ten: x.nguoiGhi }) : null].filter(Boolean).join(' · '),
              cuoi: <NhanViPham t={x.trangThai} nhan={dich(x.nhanTrangThai)} />,
            }))}
            rong={<Empty title={nhomVp ? t('Không có vi phạm nào thuộc nhóm này') : t('Lớp chưa có vi phạm nào')} />} />
        </div>
      </Gap>

      {/* Phối hợp SOS — nhóm HỌC THUẬT riêng (khung xanh nhạt), không phải vi phạm. */}
      <section ref={phoiHopRef} aria-label={tenPhoiHop} className="scroll-mt-24 border-t" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 flex flex-wrap items-baseline gap-x-2 px-4 pb-1.5 pt-3 text-sm font-bold text-slate-100">
          {tenPhoiHop}
          <span className="text-[13px] font-medium text-dim">
            {soPhoiHop > 0 || includeDone ? (thuong ? t('{n} lượt chưa xong', { n: soPhoiHop }) : t('học thuật · tách khỏi vi phạm')) : t('không có lượt đang mở')}
          </span>
        </h3>
        <div className="mx-4 mb-2 mt-1">
          {coord.error ? <LoiTaiNho chu={t('Không tải được Phối hợp.')} onRetry={coord.reload} className="px-0 py-1" /> : <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="hocVien" gon onChanged={() => { coord.reload(); }} />}
        </div>
        <div className="px-4 pb-3">
          <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-[13px] font-semibold appearance-none sm:min-h-0" onClick={() => setIncludeDone((v) => !v)}>
            {includeDone ? t('Chỉ hiện lượt chưa xong') : t('Hiện cả lượt đã xong')}
          </button>
        </div>
      </section>

      <ThanhChonNhieu chon={chonN}
        viec={[
          { key: 'xu-ly', nhan: t('Xác nhận xử lý · {n}', { n: dem('xu-ly') }), chinh: true, tat: !dem('xu-ly') },
          { key: 'ghi-nhan', nhan: t('Ghi nhận · {n}', { n: dem('ghi-nhan') }), tat: !dem('ghi-nhan') || busyLo },
          { key: 'cap-bac', nhan: t('Xác nhận cấp bậc · {n}', { n: dem('cap-bac') }), tat: !dem('cap-bac') },
        ]}
        onViec={(k) => (k === 'ghi-nhan' ? void ghiNhanLo() : setLoMo({ viec: k as ViecLo, ids: [...chonN.chon] }))}
        dongTren={okGhiNhan.length ? (
          <>
            <span className="font-semibold text-ok">✓ {t('Đã ghi nhận {so} vi phạm · {n} em', { so: okGhiNhan.reduce((s, x) => s + (x.ids?.length ?? 0), 0), n: okGhiNhan.length })}</span>
            <span className="flex-1" />
            <NutChu disabled={busyLo} onClick={() => void hoanTacGhiNhan()}>{t('Hoàn tác')}</NutChu>
          </>
        ) : undefined} />
      {loMo && (
        <LoYThucPanel classId={classId} lop={d.classCode} viec={loMo.viec} studentIds={loMo.ids}
          onClose={() => setLoMo(null)} onDone={lamMoi} />
      )}
      {baoPh?.baoPh && (
        /* Báo PH tại chỗ (TVV / QL) — cùng panel với Công việc; việc dựng từ hàng em. */
        <PanelBaoPhTvv key={baoPh.baoPh.id}
          it={{ viecId: baoPh.baoPh.id, studentId: baoPh.studentId, studentName: baoPh.ten, due: baoPh.baoPh.han, classCode: d.classCode } as WorkItem}
          onDong={() => setBaoPh(null)} onDaLam={lamMoi} onTiep={null} />
      )}
      {panels}
    </Card>
  );
}

/** Lưới 5 cột của bảng (≥ lg); nhỏ hơn: các khối xếp dọc trong một hàng (mockup 375). */
/** Cuộn tới hàng / khối — không trượt khi người dùng tắt chuyển động. */
const cuonToi = (el: Element | null | undefined) =>
  el?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

const COT = 'lg:grid-cols-[200px_minmax(0,1.4fr)_minmax(0,1fr)_180px_150px] lg:gap-x-3';

/** Nhóm hàng (mockup `.yt-nhom`): tiêu đề nhóm 14 px đậm + đếm; hàng tiêu đề cột (`.yt-dau`) vẽ dưới tiêu đề nhóm ĐẦU TIÊN. */
function NhomHang({ chu, dem, children }: { chu: string; dem: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={chu} className="group/nhom">
      <div className="flex flex-wrap items-baseline gap-x-2 border-t px-4 pb-1.5 pt-3 group-first/nhom:border-t-0" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 text-sm font-bold text-slate-100">{chu}</h3>
        <span className="text-[13px] font-medium text-dim">{dem}</span>
      </div>
      <div aria-hidden className={`hidden border-b px-4 py-2 text-[13px] font-semibold text-dim group-first/nhom:lg:grid ${COT}`} style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
        <span>{t('Học viên')}</span>
        <span>{t('Vi phạm chờ xử lý')}</span>
        <span>{t('Bậc xử lý')}</span>
        <span>{t('Duyệt · thu hồi')}</span>
        <span>{t('Báo PH (TVV)')}</span>
      </div>
      {children}
    </section>
  );
}

/** Khối gập (`Đã xử lý · 7 ngày`, nhật ký lớp) — đóng mặc định. */
function Gap({ chu, moSan = false, children }: { chu: string; moSan?: boolean; children: ReactNode }) {
  const [mo, setMo] = useState(moSan);
  return (
    <div className="border-t" style={{ borderColor: 'var(--line)' }}>
      <button type="button" aria-expanded={mo} onClick={() => setMo((v) => !v)}
        className="flex min-h-[44px] w-full items-center gap-2 border-0 bg-transparent px-4 py-2 text-left text-sm font-semibold text-dim appearance-none bam">
        <MuiTenGap mo={mo} />{chu}
      </button>
      {mo && children}
    </div>
  );
}

/** Nhãn khối nhỏ hiện khi bảng xếp dọc (< lg) — thay tiêu đề cột. */
const NhanKhoi = ({ chu }: { chu: string }) => <span className="mb-0.5 block text-[12px] font-semibold text-faint lg:sr-only">{chu}</span>;

/** Vi phạm chờ tối đa trên hàng; còn lại "+n vi phạm" (mở chi tiết để xem đủ). */
const VP_TREN_HANG = 3;
const CUA_TOI = <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--hong)] align-middle" />;

function HangEm({ x, nhom, homNay, canManage, chonN, mo, onMo, onPanel, dangGhi, onGhiNhan, onBaoPh, chiTiet }: {
  x: DongEm; nhom: NhomEm; homNay: string; canManage: boolean; chonN: ChonNhieu;
  mo: boolean; onMo: () => void; onPanel: (p: PanelYThuc) => void; dangGhi: boolean; onGhiNhan: (ids: number[]) => void; onBaoPh: () => void;
  chiTiet: ReactNode;
}) {
  const quaHan = nhom === 'qua_han';
  const hanVp = nhom === 'qua_han' || nhom === 'bat_buoc' ? x.han ?? x.hanXem : nhom === 'moi' ? x.hanXem : null;
  const dauVp = quaHan ? <>⚠ {t('Quá hạn {n} ngày', { n: x.quaHanNgay ?? 1 })}{hanVp ? ` · ${t('hạn {ngay}', { ngay: ngay(hanVp, homNay) })}` : ''}</>
    : hanVp ? (hanVp === homNay ? t('Hạn hôm nay · {ngay}', { ngay: ngay(hanVp, homNay) }) : nhom === 'moi' ? t('Chưa xem · hạn {ngay}', { ngay: ngay(hanVp, homNay) }) : t('Hạn {ngay}', { ngay: ngay(hanVp, homNay) }))
    : null;
  const lanNay = x.viPhamCho.length > 0 && nhom !== 'cho_duyet';
  const trongPhu = !x.baoPh && !x.thuHoi && !x.deXuat && !x.tuChoi && !x.xuLyGanNhat;

  /* MỘT nút việc của hàng — đúng việc người xem phải làm tiếp (chấm hồng = việc của tôi, mockup `.cua-toi`). */
  const cta = canManage && (nhom === 'qua_han' || nhom === 'bat_buoc')
    ? <button type="button" className={quaHan ? 'btn btn-sm btn-primary min-h-[44px] sm:min-h-0' : 'btn btn-sm min-h-[44px] sm:min-h-0'} onClick={() => onPanel({ loai: 'xu-ly', studentId: x.studentId })}>{CUA_TOI}{t('Xác nhận xử lý')}</button>
    : canManage && nhom === 'moi' && x.viPhamCho.length > 0
      ? <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangGhi} title={t('Đã xem, không cần xử lý')} onClick={() => onGhiNhan(x.viPhamCho.filter((v) => v.trangThai === 'moi').map((v) => v.id))}>
          {CUA_TOI}{dangGhi ? t('Đang lưu…') : x.viPhamCho.length > 1 ? t('Ghi nhận {n} vi phạm', { n: x.viPhamCho.length }) : t('Ghi nhận')}
        </button>
      : canManage && x.deXuat?.status === 'da_duyet'
        ? <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => onPanel({ loai: 'da-thuc-hien', id: x.deXuat!.id })}>{CUA_TOI}{t('Đã thực hiện…')}</button>
        : x.baoPh?.coTheGhi
          ? <button type="button" className={x.baoPh.quaHan ? 'btn btn-sm btn-primary min-h-[44px] sm:min-h-0' : 'btn btn-sm min-h-[44px] sm:min-h-0'} onClick={onBaoPh}>{CUA_TOI}{t('Ghi kết quả báo PH')}</button>
          : null;

  return (
    <div id={`yt-em-${x.studentId}`} className="scroll-mt-24 border-t" style={{ borderColor: 'var(--line)' }}>
      <div className={`grid grid-cols-2 gap-x-3 gap-y-2 px-4 py-3 lg:items-start ${COT} ${mo ? 'bg-doing-bg shadow-[inset_3px_0_0_var(--accent)]' : ''}`}>
        <div className="col-span-2 flex min-w-0 items-start gap-2 lg:col-span-1">
          {chonN.bat && <OChon chon={chonN} id={x.studentId} ten={x.ten} />}
          <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 lg:block">
            <Link className="block truncate text-[15px] font-semibold text-slate-100 max-lg:flex max-lg:min-h-[44px] max-lg:items-center no-underline hover:text-[color:var(--accent)] hover:underline" to={`/hoc-vien/${x.studentId}?tab=y-thuc`}>
              {x.ten}
            </Link>
            <button type="button" aria-expanded={mo} onClick={onMo}
              className="inline-flex min-h-[44px] items-center gap-1 border-0 bg-transparent p-0 text-[13px] text-dim appearance-none hover:text-slate-100 lg:mt-0.5 lg:min-h-[24px]">
              <MuiTenGap mo={mo} />{mo ? t('Thu gọn') : <><span className="lg:hidden">{t('Chi tiết · nhật ký')}</span><span className="max-lg:hidden">{t('Chi tiết')}</span></>}
            </button>
          </span>
        </div>
        <div className="col-span-2 min-w-0 lg:col-span-1">
          <span className="sr-only">{t('Vi phạm chờ xử lý')}</span>
          {x.viPhamCho.length > 0 ? (
            <div className={`flex flex-col gap-0.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-100 ${quaHan ? 'bg-late-bg' : 'bg-soon-bg'}`}>
              {dauVp && <b className="font-bold">{dauVp}</b>}
              {x.viPhamCho.slice(0, VP_TREN_HANG).map((v) => (
                <span key={v.id} className="min-w-0"><span className="tabular-nums">{ngay(v.ngay, homNay)}</span> {v.ten}</span>
              ))}
              {x.viPhamCho.length > VP_TREN_HANG && <span className="text-dim">{t('+{n} vi phạm', { n: x.viPhamCho.length - VP_TREN_HANG })}</span>}
            </div>
          ) : <span className="text-[13px] text-faint">{t('Không còn vi phạm chờ')}</span>}
        </div>
        <div className="col-span-2 min-w-0 lg:col-span-1">
          <span className="sr-only">{t('Bậc xử lý')}</span>
          <ThangNho x={x} lanNay={lanNay} />
        </div>
        {/* < lg: hai khối trống (chưa có xử lý, chưa có Báo PH) thì không vẽ — thẻ 375 ngắn lại. */}
        <div className={`min-w-0 text-[13px] ${trongPhu ? 'max-lg:hidden' : ''}`}>
          <NhanKhoi chu={t('Duyệt · thu hồi')} />
          <DuyetThuHoi x={x} homNay={homNay} canManage={canManage} onXem={(id) => onPanel({ loai: 'xem', id })} />
        </div>
        <div className={`min-w-0 text-[13px] ${trongPhu ? 'max-lg:hidden' : ''}`}>
          <NhanKhoi chu={t('Báo PH (TVV)')} />
          <BaoPh x={x} homNay={homNay} />
          {cta && <div className="mt-2 hidden lg:block">{cta}</div>}
        </div>
        {/* < lg: nút việc một hàng riêng, đủ rộng (không chen cạnh chữ hai khối trên). */}
        {cta && <div className="col-span-2 lg:hidden">{cta}</div>}
      </div>
      {mo && chiTiet}
    </div>
  );
}

/** Thang thu gọn của hàng: bậc vừa qua ✓ › bậc lần này (viền nhấn) › … — thang đủ ở chi tiết em. */
function ThangNho({ x, lanNay }: { x: DongEm; lanNay: boolean }) {
  const bac = (chu: ReactNode, kieu: 'qua' | 'toi' | 'sau') => (
    <span className={`whitespace-nowrap rounded border px-1.5 py-px ${kieu === 'qua' ? 'border-ok-line text-ok' : kieu === 'toi' ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] font-bold text-[color:var(--accent)]' : 'border-[color:var(--line)]'}`}>{chu}</span>
  );
  /* Cửa sổ ba bậc như mockup: chưa có bậc → [kế tiếp, +1, +2]; có bậc → [✓ bậc vừa qua, kế tiếp, +1]. */
  const dsSau = x.bac > 0 ? [x.bac + 2] : [x.bac + 2, x.bac + 3];
  return (
    <span className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px] text-faint"
      title={[1, 2, 3, 4, 5, 6].map((n) => dich(nhanLoaiXuLy(kindCuaBac(n)))).join(' › ')}>
      {x.bacNhan && <>{bac(<>✓ {dich(x.bacNhan)}</>, 'qua')}<span aria-hidden>›</span></>}
      {bac(<>{dich(x.keTiep.nhan)}{lanNay ? ` · ${t('lần này')}` : ` · ${t('kế tiếp')}`}</>, lanNay ? 'toi' : 'sau')}
      {dsSau.map((n) => <span key={n} className="contents"><span aria-hidden>›</span>{bac(dich(nhanLoaiXuLy(kindCuaBac(n))), 'sau')}</span>)}
      <span aria-hidden>› …</span>
    </span>
  );
}

/** Khối Duyệt · thu hồi: một dòng trạng thái lần xử lý gần nhất; bấm → xem lần xử lý (nơi có Thu hồi, luật 5). */
function DuyetThuHoi({ x, homNay, canManage, onXem }: { x: DongEm; homNay: string; canManage: boolean; onXem: (id: number) => void }) {
  const nut = (id: number, chu: ReactNode, phu?: ReactNode) => (
    <button type="button" className="group/xem block min-h-[44px] border-0 bg-transparent p-0 text-left text-[13px] text-dim appearance-none sm:min-h-0" onClick={() => onXem(id)}>
      <span className="group-hover/xem:text-[color:var(--accent)] group-hover/xem:underline">{chu}</span>{phu}
    </button>
  );
  if (x.thuHoi?.cho) return nut(x.thuHoi.id, dich(x.thuHoi.nhan), <span className="block text-soon">{t('Đang xin thu hồi · chờ QL')}</span>);
  if (x.thuHoi) return nut(x.thuHoi.id, dich(x.thuHoi.nhan), <span className="block">{t('Đã thu hồi · giữ lịch sử')}</span>);
  if (x.deXuat) {
    return (
      <>
        {nut(x.deXuat.id, dich(x.deXuat.nhan))}
        <span className="block text-dim">{x.deXuat.status === 'cho_duyet' ? t('Chờ QL duyệt') : t('QL đã duyệt · chờ thực hiện')}</span>
        {x.deXuat.han && <Han loai={x.deXuat.status === 'cho_duyet' ? 'duyet' : 'xu-ly-vi-pham'} han={x.deXuat.han} />}
      </>
    );
  }
  if (x.tuChoi) return nut(x.tuChoi.id, <span className="text-late">{t('QL từ chối {nhan} · chọn cách khác', { nhan: dich(x.tuChoi.nhan) })}</span>);
  if (x.xuLyGanNhat) return nut(x.xuLyGanNhat.id, <>{dich(x.xuLyGanNhat.nhan)} · {ngay(x.xuLyGanNhat.ngay, homNay)}</>, canManage ? <span className="block text-[12px] text-faint">{t('Thu hồi được · QL duyệt')}</span> : null);
  return <span className="text-faint">{t('Chưa có xử lý')}</span>;
}

/** Khối Báo PH (TVV): viên trạng thái việc Báo PH mới nhất — chờ (vàng) · quá hạn (đỏ + ⚠) · đã báo (✓) · đã bỏ. */
function BaoPh({ x, homNay }: { x: DongEm; homNay: string }) {
  const b = x.baoPh;
  if (!b) return <span className="text-faint">—</span>;
  /* Mockup `.bd-td`: viên tròn không viền, chấm màu chữ phía trước; ⚠ chỉ khi quá hạn (luật V5 — mockup vẽ ⚠ cả lúc chờ). */
  const vien = `${CHIP_TRON} max-w-full gap-1`;
  const cham = <span aria-hidden className="h-[7px] w-[7px] shrink-0 rounded-full bg-current" />;
  const han = ngay(b.han, homNay);
  return (
    <>
      {b.trangThai === 'mo' ? (
        <span className={`${vien} ${b.quaHan ? 'bg-late-bg text-late' : 'bg-soon-bg text-soon'}`}>
          {b.quaHan ? '⚠' : cham}{b.nhanTrangThai === 'Chưa báo' ? t('Chờ báo PH') : dich(b.nhanTrangThai)} · {t('hạn {ngay}', { ngay: han })}
        </span>
      ) : b.trangThai === 'xong' ? (
        <span className={`${vien} bg-ok-bg text-ok`}>✓ {t('Đã báo PH')}{b.ngayXong ? ` · ${ngay(b.ngayXong, homNay)}` : ''}</span>
      ) : <span className="text-faint">{t('Báo PH đã bỏ')}</span>}
      <span className="mt-1 block text-[12px] text-faint">{t('Việc của TVV · {nhan}', { nhan: dich(b.nhan) })}</span>
    </>
  );
}

/**
 * CHI TIẾT EM — mở dưới hàng: thang đủ (Xác nhận xử lý · Đề xuất QL duyệt · Xác nhận cấp bậc) · vi phạm của em (Ghi nhận / Bỏ ghi nhận,
 * mở dòng → Sửa · Xoá · xem lần xử lý) · lần xử lý (kể cả đã thu hồi) · chân một câu (M6) + "Đã thực hiện…".
 */
function ChiTietEm({ studentId, lanTai, homNay, onPanel, onLamMoi, onGhiNhan }: {
  studentId: number; lanTai: number; homNay: string;
  onPanel: (p: PanelYThuc) => void; onLamMoi: () => void; onGhiNhan: (v: ViPhamV4, bo: boolean) => void;
}) {
  const hvY = useApi<YThucHocVien>(`/students/${studentId}/y-thuc`, [studentId, lanTai]);
  const [moViPhamId, setMoViPhamId] = useState<number | null>(null);
  const hv = hvY.data;
  const khung = (c: ReactNode) => <div className="border-t px-4 py-3 lg:pl-8" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>{c}</div>;
  /* PR-S3F #12: lỗi tải hồ sơ Ý thức của em không xoay mãi. */
  if (hvY.error) return khung(<ErrorState message={hvY.error.message} hint={hvY.error.hint} onRetry={hvY.reload} />);
  if (!hv) return khung(<Skeleton rows={3} />);
  const xuLy = hv.dongThoiGian.filter((x) => x.loai === 'xu-ly') as Extract<YThucHocVien['dongThoiGian'][number], { loai: 'xu-ly' }>[];
  return khung(
    <div className="space-y-3">
      <ThangYThuc d={hv} homNay={homNay}
        onKhai={hv.canManage ? () => onPanel({ loai: 'khai', studentId: hv.studentId }) : undefined}
        onXuLy={() => onPanel({ loai: 'xu-ly', studentId: hv.studentId })}
        onDeXuat={hv.canManage ? () => onPanel({ loai: 'xu-ly', studentId: hv.studentId, cheDo: 'de-xuat' }) : undefined} />
      <div>
        <h4 className="m-0 mb-1 text-[12px] font-semibold text-dim">{t('Vi phạm ({n})', { n: hv.viPham.length })}</h4>
        <DongThoiGian bien="gon"
          muc={hv.viPham.map((v) => {
            /* V4-2: vi phạm đang bắt buộc (Cần xử lý / Quá hạn vì chưa xử lý) không còn nút Ghi nhận. */
            const coGhiNhan = hv.canManage && (v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem'));
            return {
              key: `v${v.id}`, ngay: v.occurredOn,
              tieuDe: v.ten,
              dongPhu: [dich(v.categoryLabel), v.reportedByName ? t('{ten} ghi', { ten: v.reportedByName }) : null].filter(Boolean).join(' · '),
              cuoi: (
                <span className="flex flex-wrap items-center justify-end gap-1.5">
                  <NhanViPham t={v.trangThai} nhan={dich(v.nhanTrangThai)} />
                  {coGhiNhan && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onGhiNhan(v, false)}
                    title={t('Đã xem, không cần xử lý')}>{t('Ghi nhận')}</button>}
                  {hv.canManage && v.trangThai === 'da_ghi_nhan' && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => onGhiNhan(v, true)}>{t('Bỏ ghi nhận')}</button>}
                </span>
              ),
              mo: moViPhamId === v.id,
              onMo: () => setMoViPhamId((c) => (c === v.id ? null : v.id)),
              chiTiet: (
                <ChiTietViPham violationId={v.id} onSua={(vv) => onPanel({ loai: 'sua', v: vv })}
                  onDaXoa={() => { setMoViPhamId(null); onLamMoi(); }} onMoXuLy={(id) => onPanel({ loai: 'xem', id })} />
              ),
            };
          })}
          rong={<Empty title={t('Em chưa có vi phạm nào')} />} />
      </div>
      {xuLy.length > 0 && (
        <div>
          <h4 className="m-0 mb-1 text-[12px] font-semibold text-dim">{t('Lần xử lý ({n})', { n: xuLy.length })}</h4>
          <ul className="m-0 list-none space-y-0.5 p-0 text-[13px]">
            {xuLy.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="w-12 shrink-0 tabular-nums text-dim">{ngay(m.ngay, homNay)}</span>
                <button type="button" className="link min-h-[44px] border-0 bg-transparent p-0 text-left appearance-none sm:min-h-0" onClick={() => onPanel({ loai: 'xem', id: m.id })}>{dich(m.nhan)}</button>
                <span className="text-dim">{dich(m.statusLabel)}{m.nguoi ? ` · ${m.nguoi}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ChanEm hv={hv} homNay={homNay} onDaThucHien={(id) => onPanel({ loai: 'da-thuc-hien', id })} />
    </div>,
  );
}

/**
 * Chân chi tiết em: MỘT câu nói vì sao (M6). Nút Xác nhận xử lý / Đề xuất QL duyệt ở khối Thang phía trên (một chỗ, như hồ sơ HV);
 * ở đây chỉ còn "Đã thực hiện…" khi QL đã duyệt đề xuất.
 */
function ChanEm({ hv, homNay, onDaThucHien }: { hv: YThucHocVien; homNay: string; onDaThucHien: (id: number) => void }) {
  const cau = hv.soBatBuoc > 0
    ? t('Em có {soBatBuoc} vi phạm trong tuần này + tuần trước → phải xử lý{x}; không còn nút Ghi nhận.', { soBatBuoc: hv.soBatBuoc, x: hv.han ? t(', hạn {ngay}', { ngay: ngay(hv.han, homNay) }) : '' })
    : hv.deXuat?.status === 'cho_duyet' ? t('Đề xuất {nhan} đang chờ QL{x}.', { nhan: hv.deXuat.nhan, x: hv.deXuat.han ? t(' (hạn {ngay})', { ngay: ngay(hv.deXuat.han, homNay) }) : '' })
    : hv.deXuat?.status === 'da_duyet' ? t('QL đã duyệt {nhan} — ghi "Đã thực hiện"{x}.', { nhan: hv.deXuat.nhan, x: hv.deXuat.han ? t(' trước {ngay}', { ngay: ngay(hv.deXuat.han, homNay) }) : '' })
    : hv.soMoi > 0 ? t('Vi phạm mới: Ghi nhận (không cần xử lý) hoặc Xác nhận xử lý nếu cần.')
    : t('Không có vi phạm nào cần làm. Vẫn Xác nhận xử lý được khi vi phạm nghiêm trọng.');
  const nut = hv.canManage && hv.deXuat?.status === 'da_duyet'
    ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => onDaThucHien(hv.deXuat!.id)}>{t('Đã thực hiện…')}</button> : null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="m-0 min-w-0 flex-1 text-xs text-dim">{cau}</p>
      {nut}
    </div>
  );
}

