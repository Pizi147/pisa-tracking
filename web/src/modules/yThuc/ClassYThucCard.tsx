import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { Han } from '../../ui/Han.tsx';
import { DongThoiGian } from '../../ui/DongThoiGian.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import {
  NHOM_EM, NHOM_EM_LABEL, VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, ngay, type NhomEm, type ViolationCategory,
} from '@shared/domain/index.ts';
import { usePanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { NhanViPham } from './NhanViPham.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { DUONG_LAM_MOI_Y_THUC, type BangLo, type BangYThucLop, type DongEm, type KqEm, type ViPhamV4, type YThucHocVien } from './kieu.ts';
import { CO_LO, LoYThucPanel, guiTheoLo, type ViecLo } from './LoYThucPanel.tsx';
import { OChon, ThanhChonNhieu, useChonNhieu, type ChonNhieu } from '../students/chonNhieuHocVien.tsx';
import { NutChu } from '../../ui/KhuonViec.tsx';
import { dich, dichChu, t } from '@shared/i18n/index.ts';

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ LỚP — HAI KHUNG (mockup M6, K2-38, PR-YT4).
 *
 *   Trái "Xử lý": em theo nhóm của CỬA TRẠNG THÁI — Quá hạn › Bắt buộc xử lý › Chờ QL duyệt › Mới, chưa ghi nhận › Đã xử lý (7 ngày);
 *   nhóm rỗng không vẽ. Lọc trạng thái CHÍNH LÀ khung này (Q14) — không chip phụ, không hai chế độ, không ô tick.
 *   Phải "Vi phạm": chưa chọn em → dòng thời gian cả lớp (có tên em, không thang, không Xác nhận xử lý); chọn em → khối Thang (hai nút) +
 *   vi phạm của em (nhãn + `Ghi nhận`) + chân câu M6. Bộ lọc duy nhất: nhóm vi phạm.
 *   Dưới `md`: hai khung thành hai tab `Xử lý · Vi phạm`; chọn em → sang tab Vi phạm.
 *
 * Việc / thông báo mở `?tab=y-thuc&hv={id}&mo=xu-ly` (hoặc `mo=da-thuc-hien&xl={id}`) → chọn sẵn em, mở panel (một lần).
 * GVBM (K2-39): đọc được hai khung, KHÔNG thấy Ghi nhận / Xác nhận xử lý / Xác nhận cấp bậc; vẫn có `+ Ghi vi phạm`.
 * OV-13d (mockup OV-13 mục 4): `Chọn nhiều` (GVCN / QL) → ô tick ở mỗi em (thêm nhóm "Chưa xác nhận cấp bậc" cho em chưa có vi phạm) + thanh dính đáy:
 * Xác nhận xử lý · Ghi nhận (làm ngay, Hoàn tác trong thanh) · Xác nhận cấp bậc — số trên nút = số em đã chọn làm được việc đó (`/y-thuc/lo`).
 * `?mo=cap-bac` (việc "Xác nhận cấp bậc" nhiều em ở Công việc) mở thẳng panel cấp bậc của mọi em còn chưa xác nhận.
 */
/** `thuong`: lớp thường — tab "Phối hợp" (không có chữ SOS); lớp FT: "Phối hợp SOS" (chủ sản phẩm 02/10). */
export function ClassYThucCard({ classId, thuong = false }: { classId: number; thuong?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const board = useApi<BangYThucLop>(`/classes/${classId}/y-thuc`);
  const roster = useApi<any[]>(`/classes/${classId}/roster`);
  /* PR-VAI-a (K5-10): việc "Phối hợp SOS" mở `?tab=y-thuc&sub=phoi-hop` — vào thẳng tab con Phối hợp. */
  const [sub, setSub] = useState<'vi-pham' | 'phoi-hop'>(params.get('sub') === 'phoi-hop' ? 'phoi-hop' : 'vi-pham');
  const [includeDone, setIncludeDone] = useState(false);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(
    sub === 'phoi-hop' ? `/classes/${classId}/phoi-hop-sos${includeDone ? '?includeDone=1' : ''}` : null, [sub, includeDone],
  );
  const [chonHv, setChonHv] = useState<number | null>(() => Number(params.get('hv')) || null);
  const [khungDt, setKhungDt] = useState<'xu-ly' | 'vi-pham'>(chonHv ? 'vi-pham' : 'xu-ly');
  const [nhomVp, setNhomVp] = useState('');
  const [moViPhamId, setMoViPhamId] = useState<number | null>(null);
  const hvY = useApi<YThucHocVien>(chonHv ? `/students/${chonHv}/y-thuc` : null, [chonHv]);
  const chonN = useChonNhieu();
  const lo = useApi<BangLo>(chonN.bat ? `/classes/${classId}/y-thuc/lo` : null, [chonN.bat, classId]);
  const [loMo, setLoMo] = useState<{ viec: ViecLo; ids: number[] | null } | null>(null);
  const [ghiNhanKq, setGhiNhanKq] = useState<KqEm[] | null>(null);
  const [busyLo, setBusyLo] = useState(false);

  const lamMoi = () => { board.reload(); hvY.reload(); lo.reload(); };
  const { mo, panels } = usePanelYThuc({
    maLop: board.data?.classCode ?? null,
    onDone: lamMoi,
    roster: (roster.data ?? []).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null })),
  });

  /* Việc / thông báo: `?hv=` chọn sẵn em, `?mo=` mở panel đúng một lần rồi gỡ khỏi địa chỉ (quay lại không mở lại). */
  useEffect(() => {
    const hv = Number(params.get('hv')) || null;
    const moGi = params.get('mo');
    if (hv) { setChonHv(hv); setKhungDt('vi-pham'); }
    if (hv && moGi === 'xu-ly') mo({ loai: 'xu-ly', studentId: hv });
    if (hv && moGi === 'khai') mo({ loai: 'khai', studentId: hv });   // PR-VAI-a (K1-15): việc "Xác nhận cấp bậc vi phạm HV cũ"
    const xl = Number(params.get('xl')) || null;
    if (moGi === 'da-thuc-hien' && xl) mo({ loai: 'da-thuc-hien', id: xl });
    /* Rà #408 (5): đúng các em của việc "Xác nhận cấp bậc" (em mới vào web) — không phải mọi em chưa xác nhận của lớp. */
    if (moGi === 'cap-bac') setLoMo({ viec: 'cap-bac', ids: (params.get('em') ?? '').split(',').map(Number).filter((x) => x > 0) });
    if (moGi || params.get('loc')) {
      const p = new URLSearchParams(params); p.delete('mo'); p.delete('xl'); p.delete('loc'); p.delete('em');
      setParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('hv'), params.get('mo')]);

  const d = board.data;
  const tatCaEm = useMemo(() => (d ? NHOM_EM.flatMap((k) => d.nhom[k].map((x) => ({ ...x, nhom: k }))) : []), [d]);
  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;
  if (board.loading || !d) return <Card title={t('Ý thức & Phối hợp')}><Skeleton rows={4} /></Card>;

  const soCanLam = d.nhom.qua_han.length + d.nhom.bat_buoc.length;
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
  const chon = (id: number | null) => { setChonHv(id); setMoViPhamId(null); if (id) setKhungDt('vi-pham'); };

  const ghiNhan = async (v: ViPhamV4) => {
    try {
      await api.post(`/students/${v.studentId}/y-thuc/ghi-nhan`, { violationIds: [v.id] });
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      toast.push('ok', t('Đã ghi nhận'));
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
  };
  /* OV-7a: Ghi nhận bấm nhầm → Bỏ ghi nhận (vi phạm về Mới). */
  const boGhiNhan = async (v: ViPhamV4) => {
    try {
      await api.post(`/students/${v.studentId}/y-thuc/bo-ghi-nhan`, { violationIds: [v.id] });
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      toast.push('ok', t('Đã bỏ ghi nhận'));
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
  };

  const khungTrai = (
    <div className="min-w-0">
      {tatCaEm.length === 0 ? (
        <div className="p-4"><Empty title={t('Không em nào cần xử lý Ý thức')} hint={t('Vi phạm mới, việc bắt buộc và đề xuất chờ QL sẽ hiện ở đây.')} /></div>
      ) : NHOM_EM.filter((k) => d.nhom[k].length > 0).map((k) => (
        <section key={k} aria-label={NHOM_EM_LABEL[k]}>
          <TieuDeNhom chu={NHOM_EM_LABEL[k]} so={d.nhom[k].length} />
          <ul className="m-0 list-none p-0">
            {d.nhom[k].map((x) => <DongEmO key={x.studentId} x={x} nhom={k} chon={chonHv === x.studentId} homNay={homNay} onChon={() => chon(x.studentId)} chonN={chonN} />)}
          </ul>
        </section>
      ))}
      {chonN.bat && chuaKhai.length > 0 && (
        <section aria-label={t('Chưa xác nhận cấp bậc')}>
          <TieuDeNhom chu={t('Chưa xác nhận cấp bậc')} so={chuaKhai.length} />
          <ul className="m-0 list-none p-0">
            {chuaKhai.map((x) => (
              <li key={x.studentId} className="flex min-h-[44px] items-center gap-2 border-b pl-3" style={{ borderColor: 'var(--line)' }}>
                <OChon chon={chonN} id={x.studentId} ten={x.ten} />
                <span className="min-w-0 flex-1 truncate py-2.5 text-sm font-semibold text-slate-100">{x.ten}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  const locVp = <T extends { category: string }>(ds: T[]) => (nhomVp ? ds.filter((v) => v.category === nhomVp) : ds);
  const hv = hvY.data;
  const khungPhai = (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 min-w-full flex-1 truncate text-sm font-bold text-slate-100 sm:min-w-0">
          {chonHv ? <>{t('Vi phạm · {x}', { x: hv?.ten ?? tatCaEm.find((x) => x.studentId === chonHv)?.ten ?? '…' })}</> : t('Vi phạm của lớp')}
        </h3>
        {chonHv && (
          <>
            <Link className="link text-xs" to={`/hoc-vien/${chonHv}?tab=y-thuc`}>{t('Hồ sơ')}</Link>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => chon(null)}>{t('Cả lớp')}</button>
          </>
        )}
        <select className="field w-auto py-1 text-xs" aria-label={t('Nhóm vi phạm')} value={nhomVp} onChange={(e) => setNhomVp(e.target.value)}>
          <option value="">{t('Mọi nhóm vi phạm')}</option>
          {VIOLATION_CATEGORIES.map((c) => <option key={c} value={c}>{VIOLATION_CATEGORY_LABEL[c as ViolationCategory]}</option>)}
        </select>
      </div>

      {!chonHv ? (
        <div className="p-3">
          <DongThoiGian bien="day-du"
            muc={locVp(d.dongThoiGian.filter((x) => x.loai === 'vi-pham') as Extract<(typeof d.dongThoiGian)[number], { loai: 'vi-pham' }>[]).map((x) => ({
              key: `v${x.id}`, ngay: x.ngay,
              cot2: <button type="button" className="link block max-w-full truncate text-left text-sm" onClick={() => chon(x.studentId)}>{x.ten}</button>,
              tieuDe: x.viPham,
              dongPhu: [dich(x.nhom), x.nguoiGhi ? t('{ten} ghi', { ten: x.nguoiGhi }) : null].filter(Boolean).join(' · '),
              cuoi: <NhanViPham t={x.trangThai} nhan={dich(x.nhanTrangThai)} />,
            }))}
            rong={<Empty title={nhomVp ? t('Không có vi phạm nào thuộc nhóm này') : t('Lớp chưa có vi phạm nào')} />} />
        </div>
      ) : hvY.error ? <div className="p-3"><ErrorState message={hvY.error.message} hint={hvY.error.hint} onRetry={hvY.reload} /></div>   /* PR-S3F #12: lỗi tải hồ sơ Ý thức của em không xoay mãi */
      : !hv ? <div className="p-3"><Skeleton rows={4} /></div> : (
        <>
          <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
            <ThangYThuc d={hv} homNay={homNay}
              onKhai={hv.canManage ? () => mo({ loai: 'khai', studentId: hv.studentId }) : undefined}
              onXuLy={() => mo({ loai: 'xu-ly', studentId: hv.studentId })}
              onDeXuat={hv.canManage ? () => mo({ loai: 'xu-ly', studentId: hv.studentId, cheDo: 'de-xuat' }) : undefined} />
          </div>
          <div className="p-3">
            <DongThoiGian bien="gon"
              muc={locVp(hv.viPham).map((v) => {
                /* V4-2: vi phạm đang bắt buộc (Cần xử lý / Quá hạn vì chưa xử lý) không còn nút Ghi nhận. */
                const coGhiNhan = hv.canManage && (v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem'));
                return {
                  key: `v${v.id}`, ngay: v.occurredOn,
                  tieuDe: v.ten,
                  dongPhu: [dich(v.categoryLabel), v.reportedByName ? t('{ten} ghi', { ten: v.reportedByName }) : null].filter(Boolean).join(' · '),
                  cuoi: (
                    <span className="flex flex-wrap items-center justify-end gap-1.5">
                      <NhanViPham t={v.trangThai} nhan={dich(v.nhanTrangThai)} />
                      {coGhiNhan && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => void ghiNhan(v)}
                        title={t('Đã xem, không cần xử lý')}>{t('Ghi nhận')}</button>}
                      {hv.canManage && v.trangThai === 'da_ghi_nhan' && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => void boGhiNhan(v)}>{t('Bỏ ghi nhận')}</button>}
                    </span>
                  ),
                  mo: moViPhamId === v.id,
                  onMo: () => setMoViPhamId((c) => (c === v.id ? null : v.id)),
                  chiTiet: (
                    <ChiTietViPham violationId={v.id} onSua={(vv) => mo({ loai: 'sua', v: vv })}
                      onDaXoa={() => { setMoViPhamId(null); lamMoi(); }} onMoXuLy={(id) => mo({ loai: 'xem', id })} />
                  ),
                };
              })}
              rong={<Empty title={nhomVp ? t('Em không có vi phạm nào thuộc nhóm này') : t('Em chưa có vi phạm nào')} />} />
          </div>
          <ChanEm hv={hv} homNay={homNay}
            onDaThucHien={(id) => mo({ loai: 'da-thuc-hien', id })} />
        </>
      )}
    </div>
  );

  return (
    <Card title={t('Ý thức & Phối hợp')}
      action={d.canRecord ? <button type="button" className="btn btn-sm btn-primary" onClick={() => mo({ loai: 'ghi', studentId: 0 })}>{t('+ Ghi vi phạm')}</button> : undefined}
      bodyClass="p-0">
      <div className="px-4 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <HangTab cap="con" ariaLabel={t('Ý thức & Phối hợp của lớp')} value={sub} onChange={setSub}
              tabs={[
                { key: 'vi-pham', label: t('Vi phạm & xử lý'), so: soCanLam },
                { key: 'phoi-hop', label: thuong ? t('Phối hợp') : t('Phối hợp SOS'), so: coord.data?.pendingCount ?? 0 },
              ]} />
          </div>
          {sub === 'vi-pham' && d.canManage && (
            <button type="button" aria-pressed={chonN.bat} onClick={() => { chonN.batTat(); setGhiNhanKq(null); if (!chonN.bat) setKhungDt('xu-ly'); }}
              className={`btn btn-sm min-h-[44px] sm:min-h-0 ${chonN.bat ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : ''}`}>
              {chonN.bat ? '✓ ' : ''}{t('Chọn nhiều')}
            </button>
          )}
        </div>
      </div>

      {sub === 'vi-pham' && (
        <>
          {/* Dưới md: hai khung thành hai tab. */}
          <div className="px-4 pt-2 md:hidden">
            <HangTab cap="con" ariaLabel={t('Khung Ý thức')} value={khungDt} onChange={setKhungDt}
              tabs={[{ key: 'xu-ly', label: t('Theo xử lý'), so: soCanLam }, { key: 'vi-pham', label: t('Theo vi phạm') }]} />
          </div>
          <div className="md:grid md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className={`${khungDt === 'xu-ly' ? 'block' : 'hidden'} md:block md:border-r`} style={{ borderColor: 'var(--line)' }}>{khungTrai}</div>
            <div className={`${khungDt === 'vi-pham' ? 'block' : 'hidden'} md:block`}>{khungPhai}</div>
          </div>
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
        </>
      )}
      {loMo && (
        <LoYThucPanel classId={classId} lop={d.classCode} viec={loMo.viec} studentIds={loMo.ids}
          onClose={() => setLoMo(null)} onDone={lamMoi} />
      )}

      {sub === 'phoi-hop' && (
        <div className="p-4 space-y-3">
          <div className="flex justify-end">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIncludeDone((v) => !v)}>
              {includeDone ? t('Chỉ hiện lượt chưa xong') : t('Hiện cả lượt đã xong')}
            </button>
          </div>
          <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="hocVien" onChanged={() => { coord.reload(); }} />
        </div>
      )}

      {panels}
    </Card>
  );
}

/** Tiêu đề một nhóm em ở khung trái ("BẮT BUỘC XỬ LÝ · 3"). */
function TieuDeNhom({ chu, so }: { chu: string; so: number }) {
  return (
    <h3 className="m-0 border-b px-3 pb-1.5 pt-3 text-[12px] font-semibold text-slate-500" style={{ borderColor: 'var(--line)' }}>
      {chu} · <span className="tabular-nums">{so}</span>
    </h3>
  );
}

/** Một dòng em ở khung trái: tên · dòng phụ theo nhóm · hạn (cột phải thẳng hàng). Cả dòng là một nút chọn em. */
function DongEmO({ x, nhom, chon, homNay, onChon, chonN }: { x: DongEm; nhom: NhomEm; chon: boolean; homNay: string; onChon: () => void; chonN: ChonNhieu }) {
  const ke = <>{t('bậc kế tiếp')} <b className="font-semibold text-slate-200">{dich(x.keTiep.nhan)}</b></>;
  const chuDeXuat = x.deXuat && nhom !== 'cho_duyet' ? t(' · 1 đề xuất {x}', { x: x.deXuat.status === 'cho_duyet' ? t('chờ QL') : t('đã duyệt') }) : '';
  const phu = nhom === 'qua_han' || nhom === 'bat_buoc'
    ? (x.tuChoi ? <>{t('Quản lý từ chối {nhan} · chọn cách xử lý khác', { nhan: x.tuChoi.nhan })} · {ke}</> : x.soBatBuoc > 0 ? <>{t('{soBatBuoc} vi phạm / 2 tuần', { soBatBuoc: x.soBatBuoc })} · {ke}</> : <>{t('{soMoi} vi phạm chưa xem', { soMoi: x.soMoi })}</>)
    : nhom === 'cho_duyet' ? <>{x.deXuat ? dich(x.deXuat.nhan) : t('Đề xuất')} · {x.deXuat?.status === 'da_duyet' ? t('đã duyệt, chờ thực hiện') : t('chờ QL duyệt')}</>
    : nhom === 'moi' ? <>{t('{soMoi} vi phạm', { soMoi: x.soMoi })}{x.moiTuoi !== null ? <> · <span className={x.moiTuoi >= 4 ? 'font-semibold text-soon' : ''}>{t('{moiTuoi} ngày', { moiTuoi: x.moiTuoi })}</span></> : null}</>
    : <>{x.xuLyGanNhat ? dich(x.xuLyGanNhat.nhan) : t('Đã xử lý')}{x.xuLyGanNhat ? ` · ${ngay(x.xuLyGanNhat.ngay, homNay)}` : ''}</>;
  const han = nhom === 'cho_duyet' ? x.deXuat?.han ?? null : nhom === 'qua_han' || nhom === 'bat_buoc' ? x.han ?? x.hanXem : nhom === 'moi' ? x.hanXem : null;
  return (
    <li className={chonN.bat ? 'flex items-stretch' : undefined}>
      {chonN.bat && <span className="flex items-center border-b pl-3" style={{ borderColor: 'var(--line)' }}><OChon chon={chonN} id={x.studentId} ten={x.ten} /></span>}
      <button type="button" aria-pressed={chon} onClick={onChon}
        className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 border-0 border-b px-3 py-2.5 text-left appearance-none bam min-h-[44px] ${chon ? 'bg-white/[.06]' : 'bg-transparent'}`}
        style={{ borderColor: 'var(--line)' }}>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-100">{x.ten}</span>
          <span className="block text-[12px] text-slate-400">{phu}{chuDeXuat}</span>
        </span>
        <span className="pt-0.5 text-right">
          {han ? <Han loai={nhom === 'cho_duyet' && x.deXuat?.status === 'cho_duyet' ? 'duyet' : 'xu-ly-vi-pham'} han={han} haiDong />
            : nhom === 'da_xu_ly' ? <span className="text-xs text-done">{t('Xong')}</span> : null}
        </span>
      </button>
    </li>
  );
}

/**
 * Chân khung phải khi đã chọn em: MỘT câu nói vì sao (M6). Nút Xác nhận xử lý / Đề xuất QL duyệt ở khối Thang phía trên (một chỗ, như hồ sơ HV);
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
    <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
      <p className="m-0 min-w-0 flex-1 text-xs text-slate-400">{cau}</p>
      {nut}
    </div>
  );
}
