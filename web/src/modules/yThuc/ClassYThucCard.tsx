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
import { DUONG_LAM_MOI_Y_THUC, type BangYThucLop, type DongEm, type ViPhamV4, type YThucHocVien } from './kieu.ts';

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

  const lamMoi = () => { board.reload(); hvY.reload(); };
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
    if (moGi || params.get('loc')) {
      const p = new URLSearchParams(params); p.delete('mo'); p.delete('xl'); p.delete('loc');
      setParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('hv'), params.get('mo')]);

  const d = board.data;
  const tatCaEm = useMemo(() => (d ? NHOM_EM.flatMap((k) => d.nhom[k].map((x) => ({ ...x, nhom: k }))) : []), [d]);
  if (board.error) return <ErrorState message={board.error.message} hint={board.error.hint} onRetry={board.reload} />;
  if (board.loading || !d) return <Card title="Ý thức & Phối hợp"><Skeleton rows={4} /></Card>;

  const soCanLam = d.nhom.qua_han.length + d.nhom.bat_buoc.length;
  const chon = (id: number | null) => { setChonHv(id); setMoViPhamId(null); if (id) setKhungDt('vi-pham'); };

  const ghiNhan = async (v: ViPhamV4) => {
    try {
      await api.post(`/students/${v.studentId}/y-thuc/ghi-nhan`, { violationIds: [v.id] });
      DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x));
      toast.push('ok', 'Đã ghi nhận');
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
  };

  const khungTrai = (
    <div className="min-w-0">
      {tatCaEm.length === 0 ? (
        <div className="p-4"><Empty title="Không em nào cần xử lý Ý thức" hint="Vi phạm mới, việc bắt buộc và đề xuất chờ QL sẽ hiện ở đây." /></div>
      ) : NHOM_EM.filter((k) => d.nhom[k].length > 0).map((k) => (
        <section key={k} aria-label={NHOM_EM_LABEL[k]}>
          <h3 className="m-0 border-b px-3 pb-1.5 pt-3 text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500" style={{ borderColor: 'var(--line)' }}>
            {NHOM_EM_LABEL[k]} · <span className="tabular-nums">{d.nhom[k].length}</span>
          </h3>
          <ul className="m-0 list-none p-0">
            {d.nhom[k].map((x) => <DongEmO key={x.studentId} x={x} nhom={k} chon={chonHv === x.studentId} homNay={homNay} onChon={() => chon(x.studentId)} />)}
          </ul>
        </section>
      ))}
    </div>
  );

  const locVp = <T extends { category: string }>(ds: T[]) => (nhomVp ? ds.filter((v) => v.category === nhomVp) : ds);
  const hv = hvY.data;
  const khungPhai = (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--line)' }}>
        <h3 className="m-0 min-w-full flex-1 truncate text-sm font-bold text-slate-100 sm:min-w-0">
          {chonHv ? <>Vi phạm · {hv?.ten ?? tatCaEm.find((x) => x.studentId === chonHv)?.ten ?? '…'}</> : 'Vi phạm của lớp'}
        </h3>
        {chonHv && (
          <>
            <Link className="link text-xs" to={`/hoc-vien/${chonHv}?tab=y-thuc`}>Hồ sơ</Link>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => chon(null)}>Cả lớp</button>
          </>
        )}
        <select className="field w-auto py-1 text-xs" aria-label="Nhóm vi phạm" value={nhomVp} onChange={(e) => setNhomVp(e.target.value)}>
          <option value="">Mọi nhóm vi phạm</option>
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
              dongPhu: [x.nhom, x.nguoiGhi ? `${x.nguoiGhi} ghi` : null].filter(Boolean).join(' · '),
              cuoi: <NhanViPham t={x.trangThai} nhan={x.nhanTrangThai} />,
            }))}
            rong={<Empty title={nhomVp ? 'Không có vi phạm nào thuộc nhóm này' : 'Lớp chưa có vi phạm nào'} />} />
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
                  dongPhu: [v.categoryLabel, v.reportedByName ? `${v.reportedByName} ghi` : null].filter(Boolean).join(' · '),
                  cuoi: (
                    <span className="flex flex-wrap items-center justify-end gap-1.5">
                      <NhanViPham t={v.trangThai} nhan={v.nhanTrangThai} />
                      {coGhiNhan && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => void ghiNhan(v)}
                        title="Đã xem, không cần xử lý">Ghi nhận</button>}
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
              rong={<Empty title={nhomVp ? 'Em không có vi phạm nào thuộc nhóm này' : 'Em chưa có vi phạm nào'} />} />
          </div>
          <ChanEm hv={hv} homNay={homNay}
            onDaThucHien={(id) => mo({ loai: 'da-thuc-hien', id })} />
        </>
      )}
    </div>
  );

  return (
    <Card title="Ý thức & Phối hợp"
      action={d.canRecord ? <button type="button" className="btn btn-sm btn-primary" onClick={() => mo({ loai: 'ghi', studentId: 0 })}>+ Ghi vi phạm</button> : undefined}
      bodyClass="p-0">
      <div className="px-4 pt-3">
        <HangTab cap="con" ariaLabel="Ý thức & Phối hợp của lớp" value={sub} onChange={setSub}
          tabs={[
            { key: 'vi-pham', label: 'Vi phạm & xử lý', so: soCanLam },
            { key: 'phoi-hop', label: thuong ? 'Phối hợp' : 'Phối hợp SOS', so: coord.data?.pendingCount ?? 0 },
          ]} />
      </div>

      {sub === 'vi-pham' && (
        <>
          {/* Dưới md: hai khung thành hai tab. */}
          <div className="px-4 pt-2 md:hidden">
            <HangTab cap="con" ariaLabel="Khung Ý thức" value={khungDt} onChange={setKhungDt}
              tabs={[{ key: 'xu-ly', label: 'Theo xử lý', so: soCanLam }, { key: 'vi-pham', label: 'Theo vi phạm' }]} />
          </div>
          <div className="md:grid md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className={`${khungDt === 'xu-ly' ? 'block' : 'hidden'} md:block md:border-r`} style={{ borderColor: 'var(--line)' }}>{khungTrai}</div>
            <div className={`${khungDt === 'vi-pham' ? 'block' : 'hidden'} md:block`}>{khungPhai}</div>
          </div>
        </>
      )}

      {sub === 'phoi-hop' && (
        <div className="p-4 space-y-3">
          <div className="flex justify-end">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIncludeDone((v) => !v)}>
              {includeDone ? 'Chỉ hiện lượt chưa xong' : 'Hiện cả lượt đã xong'}
            </button>
          </div>
          <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="hocVien" onChanged={() => { coord.reload(); }} />
        </div>
      )}

      {panels}
    </Card>
  );
}

/** Một dòng em ở khung trái: tên · dòng phụ theo nhóm · hạn (cột phải thẳng hàng). Cả dòng là một nút chọn em. */
function DongEmO({ x, nhom, chon, homNay, onChon }: { x: DongEm; nhom: NhomEm; chon: boolean; homNay: string; onChon: () => void }) {
  const ke = <>bậc kế tiếp <b className="font-semibold text-slate-200">{x.keTiep.nhan}</b></>;
  const chuDeXuat = x.deXuat && nhom !== 'cho_duyet' ? ` · 1 đề xuất ${x.deXuat.status === 'cho_duyet' ? 'chờ QL' : 'đã duyệt'}` : '';
  const phu = nhom === 'qua_han' || nhom === 'bat_buoc'
    ? (x.tuChoi ? <>Quản lý từ chối {x.tuChoi.nhan} · chọn cách xử lý khác · {ke}</> : x.soBatBuoc > 0 ? <>{x.soBatBuoc} vi phạm / 2 tuần · {ke}</> : <>{x.soMoi} vi phạm chưa xem</>)
    : nhom === 'cho_duyet' ? <>{x.deXuat?.nhan ?? 'Đề xuất'} · {x.deXuat?.status === 'da_duyet' ? 'đã duyệt, chờ thực hiện' : 'chờ QL duyệt'}</>
    : nhom === 'moi' ? <>{x.soMoi} vi phạm{x.moiTuoi !== null ? <> · <span className={x.moiTuoi >= 4 ? 'font-semibold text-soon' : ''}>{x.moiTuoi} ngày</span></> : null}</>
    : <>{x.xuLyGanNhat?.nhan ?? 'Đã xử lý'}{x.xuLyGanNhat ? ` · ${ngay(x.xuLyGanNhat.ngay, homNay)}` : ''}</>;
  const han = nhom === 'cho_duyet' ? x.deXuat?.han ?? null : nhom === 'qua_han' || nhom === 'bat_buoc' ? x.han ?? x.hanXem : nhom === 'moi' ? x.hanXem : null;
  return (
    <li>
      <button type="button" aria-pressed={chon} onClick={onChon}
        className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 border-0 border-b px-3 py-2.5 text-left appearance-none row-hover min-h-[44px] ${chon ? 'bg-white/[.06]' : 'bg-transparent'}`}
        style={{ borderColor: 'var(--line)' }}>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-100">{x.ten}</span>
          <span className="block text-[11.5px] text-slate-400">{phu}{chuDeXuat}</span>
        </span>
        <span className="pt-0.5 text-right">
          {han ? <Han loai={nhom === 'cho_duyet' && x.deXuat?.status === 'cho_duyet' ? 'duyet' : 'xu-ly-vi-pham'} han={han} haiDong />
            : nhom === 'da_xu_ly' ? <span className="text-[11px] text-done">Xong</span> : null}
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
    ? `Em có ${hv.soBatBuoc} vi phạm trong tuần này + tuần trước → phải xử lý${hv.han ? `, hạn ${ngay(hv.han, homNay)}` : ''}; không còn nút Ghi nhận.`
    : hv.deXuat?.status === 'cho_duyet' ? `Đề xuất ${hv.deXuat.nhan} đang chờ QL${hv.deXuat.han ? ` (hạn ${ngay(hv.deXuat.han, homNay)})` : ''}.`
    : hv.deXuat?.status === 'da_duyet' ? `QL đã duyệt ${hv.deXuat.nhan} — ghi "Đã thực hiện"${hv.deXuat.han ? ` trước ${ngay(hv.deXuat.han, homNay)}` : ''}.`
    : hv.soMoi > 0 ? 'Vi phạm mới: Ghi nhận (không cần xử lý) hoặc Xác nhận xử lý nếu cần.'
    : 'Không có vi phạm nào cần làm. Vẫn Xác nhận xử lý được khi vi phạm nghiêm trọng.';
  const nut = hv.canManage && hv.deXuat?.status === 'da_duyet'
    ? <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => onDaThucHien(hv.deXuat!.id)}>Đã thực hiện…</button> : null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
      <p className="m-0 min-w-0 flex-1 text-xs text-slate-400">{cau}</p>
      {nut}
    </div>
  );
}
