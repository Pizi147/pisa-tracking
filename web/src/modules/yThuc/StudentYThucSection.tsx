import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { BoLocDoan, Empty, ErrorState, LoiTaiNho, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { DongThoiGian, type DongThoiGianMuc } from '../../ui/DongThoiGian.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { VIOLATION_CATEGORIES, VIOLATION_CATEGORY_LABEL, ngay, type ViolationCategory } from '@shared/domain/index.ts';
import { usePanelYThuc } from './panelYThuc.tsx';
import { ChiTietViPham } from './ChiTietViPham.tsx';
import { PhoiHopSosSection, type CoordTurn } from './PhoiHopSosSection.tsx';
import { MuiTenGap, NhanViPham } from './NhanViPham.tsx';
import { ThangYThuc } from './ThangYThuc.tsx';
import { BaoPh, DuyetThuHoi, type HangTrangThai } from './ClassYThucCard.tsx';
import { PanelBaoPhTvv } from '../congViec/PanelBaoPhTvv.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { DUONG_LAM_MOI_Y_THUC, type ViPhamV4, type YThucHocVien } from './kieu.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Loc = 'tat-ca' | 'can' | 'cho' | 'xong';
const MO_VP = new Set(['moi', 'can_xu_ly', 'qua_han']);
/** Vi phạm "chưa xong" của khối giữa: còn chờ GV (Mới · Cần xử lý · Quá hạn) hoặc đang trong đề xuất chờ QL. */
const CHUA_XONG = new Set(['moi', 'can_xu_ly', 'qua_han', 'cho_duyet']);
/** Trạng thái chính của khối theo nhóm em — dòng nào khác trạng thái này mới in nhãn riêng (mockup: nhãn chỉ khi khác dòng đầu khối). */
const TT_KHOI = { qua_han: 'qua_han', bat_buoc: 'can_xu_ly', cho_duyet: 'cho_duyet', moi: 'moi', da_xu_ly: '' } as const;
const CUA_TOI = <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--hong)] align-middle" />;

/**
 * TAB `Ý THỨC & PHỐI HỢP` CỦA HỒ SƠ HỌC VIÊN — UI-Y-THUC-HV (mockup `thiet-ke/v7/ho-so-hv-y-thuc.html`, chủ SP duyệt 28/10). Từ trên xuống:
 *   1. Tiêu đề + `+ Ghi vi phạm`.
 *   2. Khối Thang (Xác nhận xử lý · Đề xuất QL duyệt · ⓘ · Xác nhận / Sửa cấp bậc).
 *   3. Dòng trạng thái hai ô — `Duyệt · thu hồi` | `Báo PH (TVV)` — cùng ô, cùng chữ với hàng em ở tab lớp (`hang` máy chủ = `hangCuaEm`).
 *      Cả hai trống → một dòng mờ.
 *   4. Hai cột: `Vi phạm chưa xong` (nền vàng nhạt; quá hạn đỏ nhạt + ⚠; dòng mở tại chỗ → mô tả · Sửa · Xoá) | `Phối hợp SOS` (khung xanh nhạt,
 *      thẻ lượt V4 giữ đủ thao tác). Khung hẹp (< 900 px — cả panel Công việc) thì xếp dọc.
 *   5. `Nhật ký` gập (vi phạm + lần xử lý, bộ lọc ở trong) — mở sẵn khi em không còn gì chờ.
 * Thông báo / việc mở `?tab=y-thuc&mo=xu-ly` → panel Xác nhận xử lý; `&sub=phoi-hop` → cuộn tới Phối hợp.
 */
export function StudentYThucSection({ studentId, onGoAcademic, thuong: thuongVao }: {
  studentId: number;
  /** Lớp thường: "Phối hợp" (không có chữ SOS); FT: "Phối hợp SOS". Không truyền thì tự biết từ chuỗi em đang học (panel Công việc). */
  thuong?: boolean;
  /** Đổi sang tab Học thuật của hồ sơ (link trong thẻ Phối hợp SOS). */
  onGoAcademic?: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [phamVi, setPhamVi] = useState<'chuoi' | 'tat-ca'>('chuoi');
  const { data: d, error, loading, reload } = useApi<YThucHocVien>(`/students/${studentId}/y-thuc${phamVi === 'tat-ca' ? '?pham-vi=tat-ca' : ''}`, [studentId, phamVi]);
  const coord = useApi<{ rows: CoordTurn[]; pendingCount: number }>(`/students/${studentId}/phoi-hop-sos`, [studentId]);
  const [loc, setLoc] = useState<Loc>('tat-ca');
  const [nhomVp, setNhomVp] = useState('');
  const [moViPhamId, setMoViPhamId] = useState<number | null>(null);
  const [moNhatKy, setMoNhatKy] = useState<boolean | null>(null);
  const [baoPhMo, setBaoPhMo] = useState(false);
  /* Vi phạm đang gửi Ghi nhận — chỉ dòng đó hiện "Đang lưu…"; mọi nút Ghi nhận khoá tới khi xong (không gửi chồng). */
  const [dangGhiIds, setDangGhiIds] = useState<number[]>([]);
  const dangGhi = dangGhiIds.length > 0;
  const phoiHopRef = useRef<HTMLElement>(null);
  const { mo, panels } = usePanelYThuc({ onDone: reload });

  useEffect(() => {
    const moGi = params.get('mo');
    if (!moGi) return;
    if (moGi === 'xu-ly') mo({ loai: 'xu-ly', studentId });
    const xl = Number(params.get('xl')) || null;
    if (moGi === 'da-thuc-hien' && xl) mo({ loai: 'da-thuc-hien', id: xl });
    const p = new URLSearchParams(params); p.delete('mo'); p.delete('xl');
    setParams(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('mo'), studentId]);
  /* PR-LT2a: việc "Báo phụ huynh qua TVV" mở `&sub=phoi-hop` — nay một trang, cuộn tới khối Phối hợp. */
  const coSub = params.get('sub') === 'phoi-hop';
  useEffect(() => {
    if (!coSub || !d) return;
    phoiHopRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coSub, !!d]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !d) return <Skeleton rows={5} />;

  const lamMoi = () => { DUONG_LAM_MOI_Y_THUC.forEach((x) => invalidate(x)); reload(); };
  /* Ghi nhận có Hoàn tác (luật không khoá cứng); khoá nút khi đang gửi — không gửi hai lần. */
  const ghiNhan = async (ids: number[], bo = false) => {
    setDangGhiIds(ids);
    try {
      await api.post(`/students/${studentId}/y-thuc/${bo ? 'bo-ghi-nhan' : 'ghi-nhan'}`, { violationIds: ids });
      if (bo) toast.push('ok', t('Đã bỏ ghi nhận'));
      else toast.hoanTac(t('Đã ghi nhận {length} vi phạm', { length: ids.length }), () => void ghiNhan(ids, true));
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); }
    finally { setDangGhiIds([]); }
  };

  const coGhiNhan = (v: ViPhamV4) => d.canManage && (v.trangThai === 'moi' || (v.trangThai === 'qua_han' && v.lyDoQuaHan === 'xem'));
  const soCan = d.viPham.filter((v) => MO_VP.has(v.trangThai)).length;
  const chuaXong = d.viPham.filter((v) => CHUA_XONG.has(v.trangThai)).sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id);
  const moiIds = chuaXong.filter(coGhiNhan).map((v) => v.id);
  const hang: HangTrangThai = { ...d.hang, deXuat: d.deXuat };
  const nhatKyMo = moNhatKy ?? (chuaXong.length === 0 && !d.deXuat);
  /* UI-Y-THUC-HV (PTA 28/10): cùng nguồn với dòng đếm Nhật ký — chuỗi không có lộ trình FT = lớp thường. */
  const thuong = thuongVao ?? d.chuoi.nhan === 'lớp thường';
  const tenPhoiHop = thuong ? t('Phối hợp') : t('Phối hợp SOS');
  const chiTiet = (id: number) => (
    <ChiTietViPham violationId={id} onSua={(vv) => mo({ loai: 'sua', v: vv, studentName: d.ten })}
      onDaXoa={() => { setMoViPhamId(null); reload(); }} onMoXuLy={(x) => mo({ loai: 'xem', id: x })} />
  );

  /* ---------------- Nhật ký (dòng thời gian V4, gập) ---------------- */
  const hopLoc = (x: (typeof d.dongThoiGian)[number]) => {
    if (nhomVp && (x.loai !== 'vi-pham' || x.category !== nhomVp)) return false;
    if (loc === 'tat-ca') return true;
    if (x.loai === 'xu-ly') return loc === 'xong' ? x.status === 'done' : loc === 'cho' ? x.status === 'cho_duyet' || x.status === 'da_duyet' : false;
    if (loc === 'can') return MO_VP.has(x.trangThai);
    if (loc === 'cho') return x.trangThai === 'cho_duyet';
    return x.trangThai === 'da_xu_ly';
  };
  const vpTheoId = new Map(d.viPham.map((v) => [v.id, v]));
  const muc: DongThoiGianMuc[] = d.dongThoiGian.filter(hopLoc).map((x) => x.loai === 'xu-ly' ? {
    key: `x${x.id}`, ngay: x.ngay, vach: true,
    cot2: <span className="text-[12px] font-bold  text-slate-400">{t('Xử lý')}</span>,
    tieuDe: <span className="font-bold">{dich(x.nhan)}</span>,
    dongPhu: [t('{soViPham} vi phạm', { soViPham: x.soViPham }), x.nguoi, x.soTep ? t('{soTep} tệp', { soTep: x.soTep }) : null, x.status !== 'done' ? dich(x.statusLabel) : null].filter(Boolean).join(' · '),
    cuoi: <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'xem', id: x.id })}>{t('Xem')}</button>,
  } : {
    key: `v${x.id}`, ngay: x.ngay,
    cot2: <span className="text-[12px] text-slate-400">{t('Vi phạm')}</span>,
    tieuDe: x.viPham,
    dongPhu: [dich(x.nhom), x.mon && dich(x.mon), x.nguoiGhi ? t('{ten} ghi', { ten: x.nguoiGhi }) : null].filter(Boolean).join(' · '),
    cuoi: (
      <span className="flex flex-wrap items-center justify-end gap-1.5">
        <NhanViPham t={x.trangThai} nhan={dich(x.nhanTrangThai)} />
        {vpTheoId.has(x.id) && coGhiNhan(vpTheoId.get(x.id)!) && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangGhi}
          onClick={() => void ghiNhan([x.id])} title={t('Đã xem, không cần xử lý')}>{t('Ghi nhận')}</button>}
        {d.canManage && x.trangThai === 'da_ghi_nhan' && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangGhi} onClick={() => void ghiNhan([x.id], true)}>{t('Bỏ ghi nhận')}</button>}
      </span>
    ),
    mo: moViPhamId === x.id,
    onMo: () => setMoViPhamId((c) => (c === x.id ? null : x.id)),
    chiTiet: chiTiet(x.id),
  });
  const nhanChuoi = phamVi === 'chuoi' ? (d.chuoi.nhan === 'lớp thường' ? t('Các khoá lớp thường này') : t('Lộ trình {nhan}', { nhan: d.chuoi.nhan })) : t('Cả lịch sử');

  return (
    <div className="space-y-3.5 [container-type:inline-size]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 flex-1 text-[17px] font-bold text-slate-100">{t('Ý thức & Phối hợp')}</h2>
        {d.canRecord && <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => mo({ loai: 'ghi', studentId, studentName: d.ten })}>{t('+ Ghi vi phạm')}</button>}
      </div>

      <ThangYThuc d={d} homNay={homNay} xuLyChinh={d.nhom !== 'moi'}
        onKhai={d.canManage ? () => mo({ loai: 'khai', studentId }) : undefined}
        onSuaKhai={d.canSuaKhai ? () => mo({ loai: 'khai', studentId, sua: true }) : undefined}
        onXuLy={() => mo({ loai: 'xu-ly', studentId })}
        onDeXuat={d.canManage ? () => mo({ loai: 'xu-ly', studentId, cheDo: 'de-xuat' }) : undefined} />

      <TrangThaiDong x={hang} homNay={homNay} canManage={d.canManage}
        onXem={(id) => mo({ loai: 'xem', id })} onDaThucHien={(id) => mo({ loai: 'da-thuc-hien', id })} onBaoPh={() => setBaoPhMo(true)} />

      <div className="grid items-start gap-3.5 [@container(min-width:900px)]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="card min-w-0" aria-labelledby={`yt-vp-${studentId}`}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 pb-1.5 pt-3">
            <h3 id={`yt-vp-${studentId}`} className="m-0 text-sm font-bold text-slate-100">{t('Vi phạm chưa xong')}</h3>
            {/* Số chỉ khi dòng đầu khối chưa nói số (quá hạn / đề xuất) — không lặp. */}
            {chuaXong.length > 0 && (d.nhom === 'qua_han' || !!d.deXuat) && <span className="text-[13px] font-medium text-dim">{t('{n} vi phạm', { n: chuaXong.length })}</span>}
            <NutLuat label={t('Luật xử lý vi phạm')}>
              {t('≥ 3 vi phạm trong tuần này + tuần trước → bắt buộc xử lý, hạn 3 ngày. Vi phạm lẻ: Ghi nhận (đã xem, không cần xử lý) hoặc xử lý nếu nghiêm trọng.')}
            </NutLuat>
            {moiIds.length >= 2 && (
              <button type="button" className="btn btn-sm btn-primary ml-auto min-h-[44px] sm:min-h-0" disabled={dangGhi} onClick={() => void ghiNhan(moiIds)}>
                {CUA_TOI}{dangGhiIds.length > 1 ? t('Đang lưu…') : t('Ghi nhận tất cả ({n})', { n: moiIds.length })}
              </button>
            )}
          </div>
          {chuaXong.length === 0 ? (
            <p className="m-0 px-4 pb-3.5 pt-1.5 text-[13px] text-dim">
              {d.hang.xuLyGanNhat
                ? t('Em không có vi phạm nào chưa xong. Lần gần nhất: {nhan} · {ngay}.', { nhan: dich(d.hang.xuLyGanNhat.nhan), ngay: ngay(d.hang.xuLyGanNhat.ngay, homNay) })
                : t('Em không có vi phạm nào chưa xong.')}
            </p>
          ) : (
            <KhoiViPham d={d} ds={chuaXong} homNay={homNay} moId={moViPhamId} dangGhiIds={dangGhiIds} coGhiNhan={coGhiNhan} moiIds={moiIds}
              onMo={(id) => setMoViPhamId((c) => (c === id ? null : id))} onGhiNhan={(ids) => void ghiNhan(ids)} chiTiet={chiTiet} />
          )}
        </section>

        <section ref={phoiHopRef} className="card min-w-0 scroll-mt-24" aria-labelledby={`yt-ph-${studentId}`}>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-4 pb-1.5 pt-3">
            <h3 id={`yt-ph-${studentId}`} className="m-0 text-sm font-bold text-slate-100">{tenPhoiHop}</h3>
            {!thuong && <span className="text-[13px] font-medium text-dim">{t('học thuật · tách khỏi vi phạm')}</span>}
          </div>
          <div className="px-4 pb-3.5 pt-1.5">
            {coord.error ? <LoiTaiNho chu={t('Không tải được Phối hợp.')} onRetry={coord.reload} className="px-0 py-1" />
              : <PhoiHopSosSection turns={coord.data?.rows ?? null} loading={coord.loading} cot1="luot" xanh onGoAcademic={onGoAcademic}
                  onChanged={() => { coord.reload(); }} />}
          </div>
        </section>
      </div>

      <section className="card" aria-labelledby={`yt-nk-${studentId}`}>
        <h3 id={`yt-nk-${studentId}`} className="m-0">
          <button type="button" aria-expanded={nhatKyMo} onClick={() => setMoNhatKy(!nhatKyMo)}
            className="flex min-h-[44px] w-full items-center gap-2 border-0 bg-transparent px-4 py-3 text-left text-sm font-semibold text-dim appearance-none hover:text-slate-100">
            <MuiTenGap mo={nhatKyMo} />{t('Nhật ký · {nhan} ({n})', { nhan: nhanChuoi, n: d.dongThoiGian.length })}
          </button>
        </h3>
        {nhatKyMo && (
          <div className="space-y-2 px-4 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <BoLocDoan ariaLabel={t('Lọc dòng thời gian')} value={loc} onChange={setLoc}
                muc={[{ key: 'tat-ca', nhan: t('Tất cả') }, { key: 'can', nhan: t('Cần xử lý'), so: soCan || null }, { key: 'cho', nhan: t('Chờ duyệt') }, { key: 'xong', nhan: t('Đã xử lý') }]} />
              <select className="field ml-auto min-h-[44px] w-auto py-1 text-xs sm:min-h-0" aria-label={t('Nhóm vi phạm')} value={nhomVp} onChange={(e) => setNhomVp(e.target.value)}>
                <option value="">{t('Mọi nhóm')}</option>
                {VIOLATION_CATEGORIES.map((c) => <option key={c} value={c}>{dich(VIOLATION_CATEGORY_LABEL[c as ViolationCategory])}</option>)}
              </select>
            </div>
            <DongThoiGian bien="day-du" muc={muc}
              rong={<Empty title={loc === 'tat-ca' && !nhomVp ? t('Chưa có vi phạm nào') : t('Không có dòng nào khớp bộ lọc')} />} />
            <p className="m-0 flex flex-wrap items-center gap-x-2 text-[12px] text-slate-500">
              <span>
                {t('{x}: {tong} vi phạm{x2}', { x: nhanChuoi, tong: d.demCuoi.tong, x2: d.demCuoi.theoNhom.length ? ` · ${d.demCuoi.theoNhom.map((x) => `${x.so} ${dich(x.nhom)}`).join(' · ')}` : '' })}
              </span>
              <button type="button" className="link inline-flex items-center appearance-none border-0 bg-transparent p-0 min-h-[44px] sm:min-h-0" onClick={() => setPhamVi((v) => (v === 'chuoi' ? 'tat-ca' : 'chuoi'))}>
                {phamVi === 'chuoi' ? t('Xem cả lịch sử') : t('Chỉ chuỗi hiện tại')}
              </button>
            </p>
          </div>
        )}
      </section>

      {baoPhMo && d.hang.baoPh && (
        /* Báo PH tại chỗ (TVV / QL) — cùng panel với Công việc và tab lớp. */
        <PanelBaoPhTvv key={d.hang.baoPh.id}
          it={{ viecId: d.hang.baoPh.id, studentId, studentName: d.ten, due: d.hang.baoPh.han, classCode: null } as unknown as WorkItem}
          onDong={() => setBaoPhMo(false)} onDaLam={lamMoi} onTiep={null} />
      )}
      {panels}
    </div>
  );
}

/**
 * Dòng trạng thái hai ô (mockup `.trang-thai`): `Duyệt · thu hồi` | `Báo PH (TVV)` — dùng lại ô của hàng em tab lớp.
 * Việc của người xem nằm ngay trong ô: Đánh dấu đã thực hiện (đề xuất đã duyệt) · Ghi kết quả báo PH (TVV / QL — quyền máy chủ).
 */
function TrangThaiDong({ x, homNay, canManage, onXem, onDaThucHien, onBaoPh }: {
  x: HangTrangThai; homNay: string; canManage: boolean;
  onXem: (id: number) => void; onDaThucHien: (id: number) => void; onBaoPh: () => void;
}) {
  if (!x.xuLyGanNhat && !x.tuChoi && !x.thuHoi && !x.deXuat && !x.baoPh) {
    return (
      <p className="m-0 px-0.5 text-[13px] text-faint">
        <span className="font-semibold">{t('Duyệt · thu hồi · Báo PH')}:</span> {t('Chưa có lần xử lý · chưa có gì cần báo PH')}
      </p>
    );
  }
  const nhan = (chu: string) => <span className="block text-[12px] font-semibold text-faint">{chu}</span>;
  const b = x.baoPh;
  return (
    <div className="card grid grid-cols-1 text-[13px] [@container(min-width:600px)]:grid-cols-2">
      <div className="grid content-start gap-1 px-3.5 py-2.5">
        {nhan(t('Duyệt · thu hồi'))}
        <div><DuyetThuHoi x={x} homNay={homNay} canManage={canManage} onXem={onXem} link /></div>
        {canManage && x.deXuat?.status === 'da_duyet' && (
          <div><button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => onDaThucHien(x.deXuat!.id)}>{CUA_TOI}{t('Đánh dấu đã thực hiện')}</button></div>
        )}
      </div>
      <div className="grid content-start gap-1 border-t px-3.5 py-2.5 [border-color:var(--line)] [@container(min-width:600px)]:border-l [@container(min-width:600px)]:border-t-0">
        {nhan(t('Báo PH (TVV)'))}
        {b ? <div><BaoPh x={x} homNay={homNay} /></div> : <span className="text-faint">{t('— chưa có lần xử lý cần báo')}</span>}
        {b?.trangThai === 'mo' && b.coTheGhi && (
          <div><button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={onBaoPh}>{CUA_TOI}{t('Ghi kết quả báo PH')}</button></div>
        )}
      </div>
    </div>
  );
}

/**
 * KHỐI VI PHẠM CHƯA XONG (mockup `.vp`): nền vàng nhạt (quá hạn: đỏ nhạt + ⚠, chỉ khối này) · dòng đầu đậm nói hạn và lý do ·
 * mỗi vi phạm một dòng (ngày · tên, mở tại chỗ · nhóm + người ghi · Ghi nhận, hoặc nhãn khi khác trạng thái khối).
 */
function KhoiViPham({ d, ds, homNay, moId, dangGhiIds, coGhiNhan, moiIds, onMo, onGhiNhan, chiTiet }: {
  d: YThucHocVien; ds: ViPhamV4[]; homNay: string; moId: number | null; dangGhiIds: number[];
  coGhiNhan: (v: ViPhamV4) => boolean; moiIds: number[];
  onMo: (id: number) => void; onGhiNhan: (ids: number[]) => void; chiTiet: (id: number) => ReactNode;
}) {
  const qua = d.nhom === 'qua_han';
  const han = d.han ?? d.hanXem;
  const dau = qua
    ? `⚠ ${t('Quá hạn {n} ngày', { n: d.quaHanNgay ?? 1 })}${han ? ` · ${t('hạn {ngay}', { ngay: ngay(han, homNay) })}` : ''}${d.daBaoQl ? t(' · đã báo QL') : ''}`
    : d.deXuat?.status === 'cho_duyet'
      ? t('Đề xuất {nhan} · chờ QL{x}', { nhan: dich(d.deXuat.nhan), x: d.deXuat.han ? t(' · hạn {ngay}', { ngay: ngay(d.deXuat.han, homNay) }) : '' })
      : d.deXuat?.status === 'da_duyet'
        ? t('QL đã duyệt {nhan} · chờ "Đã thực hiện"', { nhan: dich(d.deXuat.nhan) })
        : d.soBatBuoc > 0
          ? `${d.han ? `${d.han === homNay ? t('Hạn hôm nay · {ngay}', { ngay: ngay(d.han, homNay) }) : t('Hạn {ngay}', { ngay: ngay(d.han, homNay) })} · ` : ''}${t('{soBatBuoc} vi phạm trong tuần này + tuần trước → bắt buộc xử lý{x}', { soBatBuoc: d.soBatBuoc, x: '' })}`
          : d.soMoi > 0
            ? `${t('{soMoi} vi phạm chưa xem{x}', { soMoi: d.soMoi, x: d.hanXem ? t(' · hạn {ngay}', { ngay: ngay(d.hanXem, homNay) }) : '' })} · ${t('chưa tới mức bắt buộc')}`
            : t('{n} vi phạm', { n: ds.length });
  const ttKhoi = d.nhom ? TT_KHOI[d.nhom] : '';
  /* Một vi phạm Mới duy nhất ở em chỉ có vi phạm Mới → Ghi nhận là việc chính; còn lại việc chính là Xác nhận xử lý ở khối Thang. */
  const motMoi = moiIds.length === 1 && d.nhom === 'moi';
  return (
    <div className={`mx-4 mb-3.5 mt-1.5 rounded-lg px-2.5 pb-1 pt-2 text-[13px] ${qua ? 'bg-late-bg' : 'bg-soon-bg'}`}>
      <b className="block pb-1 font-bold text-slate-100">{dau}</b>
      <ul className="m-0 list-none p-0">
        {ds.map((v) => {
          const mo = moId === v.id;
          const nut = coGhiNhan(v)
            ? <button type="button" className={`btn btn-sm min-h-[44px] sm:min-h-0${motMoi ? ' btn-primary' : ''}`} disabled={dangGhiIds.length > 0}
                title={t('Đã xem, không cần xử lý')} onClick={() => onGhiNhan([v.id])}>{motMoi && CUA_TOI}{dangGhiIds.includes(v.id) ? t('Đang lưu…') : t('Ghi nhận')}</button>
            : v.trangThai !== ttKhoi ? <NhanViPham t={v.trangThai} nhan={dich(v.nhanTrangThai)} /> : null;
          return (
            <li key={v.id} className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 border-t py-1.5 [border-color:color-mix(in_srgb,var(--text)_10%,transparent)] [@container(min-width:600px)]:grid-cols-[44px_minmax(0,1fr)_auto]">
              <span className="tabular-nums">{ngay(v.occurredOn, homNay)}</span>
              <button type="button" aria-expanded={mo} onClick={() => onMo(v.id)}
                className="min-h-[44px] min-w-0 border-0 bg-transparent p-0 text-left appearance-none hover:underline sm:min-h-0">
                <span className="inline-flex items-center gap-1">{v.ten}<span className="text-faint"><MuiTenGap mo={mo} /></span></span>
                <span className="block text-[12px] text-dim">{[dich(v.categoryLabel), v.reportedByName ? t('{ten} ghi', { ten: v.reportedByName }) : null].filter(Boolean).join(' · ')}</span>
              </button>
              {nut && <span className="col-start-2 flex flex-wrap items-center gap-1.5 [@container(min-width:600px)]:col-start-3 [@container(min-width:600px)]:justify-end">{nut}</span>}
              {mo && <div className="col-span-full py-1">{chiTiet(v.id)}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
