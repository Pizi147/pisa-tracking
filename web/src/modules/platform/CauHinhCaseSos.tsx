import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, quenBanXem } from '../../lib/useApi.ts';
import { ApiError, api } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { BoLocDoan, ErrorState, Forbidden, Skeleton } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { fmtDateTime } from '../../lib/format.ts';
import { t } from '@shared/i18n/index.ts';
import type { LoaiCauHinh, MocSos, NguyenNhan, PhuongAn, ThayDoi } from '@shared/domain/index.ts';
import { BangNguyenNhan, BangPhuongAn } from './cauHinh/BangDanhSach.tsx';
import { MocSosFt, MocSosThuong } from './cauHinh/BangMoc.tsx';

export type Ban<T> = { id: number; du_lieu: T };
export type DongNhatKy = { id: number; loai: LoaiCauHinh; luc: string; nguoi: string | null; thayDoi: ThayDoi[]; khoiPhucTu: number | null };
export type DuLieuCauHinh = {
  nguyen_nhan: Ban<NguyenNhan>; phuong_an: Ban<PhuongAn>; moc_sos: Ban<MocSos>;
  dangDung: Record<string, number>; nhatKy: DongNhatKy[]; suaDuoc: boolean; truoc?: number;
};
/** Lưu một danh sách: `chu` = câu toast (vd "Đã thêm "Nghe từ khoá""). Trả true khi đã lưu (để dòng sửa đóng). */
export type LuuDs = <L extends LoaiCauHinh>(loai: L, duLieu: DuLieuCauHinh[L]['du_lieu'], chu: string) => Promise<boolean>;

const DUONG = '/admin/cau-hinh-case-sos';
const VIEC_CHU: Record<ThayDoi['viec'], string> = {
  them: 'Thêm', sua: 'Sửa', an: 'Ẩn', hien: 'Hiện lại', xoa: 'Xoá', thu_tu: 'Đổi thứ tự', o_moc: 'Sửa ô',
};
const chuDoi = (d: ThayDoi) => `${t(VIEC_CHU[d.viec] as any)} · ${d.muc}${d.truoc || d.sau ? `: ${d.truoc ?? ''}${d.truoc && d.sau ? ' → ' : ''}${d.sau ?? ''}` : ''}`;

/**
 * QUẢN TRỊ › CASE & SOS (CAU-HINH-CASE-SOS, chủ SP duyệt 11/11 — mockup `thiet-ke/2026-11-11-cau-hinh-case-sos/`).
 * Ba danh sách: nhóm nguyên nhân (FT / lớp thường riêng) · nhóm phương án · mốc SOS (FT + lớp thường). Quản trị sửa, Quản lý chỉ xem (máy chủ kiểm).
 * Một luật lưu: ô chữ / số lưu khi Enter hoặc Lưu; nút một bấm (Ẩn, Hiện lại, Xoá, ↑ ↓) lưu ngay + toast Hoàn tác 10 s. Mỗi lần lưu một phiên bản,
 * chỉ áp cho Case / SOS sinh sau. Một khối độc lập — lắp vào khung Quản trị mới chỉ cần đặt vào một ô.
 */
export function CauHinhCaseSos() {
  const { data, error, loading, reload, setData } = useApi<DuLieuCauHinh>(DUONG);
  const { reload: taiPhien } = useSession();
  const toast = useToast();
  const [ds, setDs] = useState<'nn' | 'pa' | 'moc'>('nn');
  const [ben, setBen] = useState<'ft' | 'thuong'>('ft');
  const [xung, setXung] = useState(false);
  const [khoiPhuc, setKhoiPhuc] = useState<{ id: number; loai: LoaiCauHinh; ten: string; dao: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  if (error && error.status === 403) return <Forbidden message={t('Phần này dành cho Quản trị hệ thống và Quản lý.')} />;
  if (error) return <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const sauLuu = (r: DuLieuCauHinh) => {
    setData(r);
    quenBanXem(DUONG);
    void taiPhien();   // ô chọn trên web (cùng tab) đọc bản mới qua phiên
  };
  const gui = async (loai: LoaiCauHinh, body: Record<string, unknown>): Promise<DuLieuCauHinh> => {
    try {
      const r = await api.put<DuLieuCauHinh>(`${DUONG}/${loai}`, body);
      sauLuu(r);
      return r;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setXung(true);
      throw e;
    }
  };
  const luuDs: LuuDs = async (loai, duLieu, chu) => {
    const tu = data[loai].id;
    try {
      const r = await gui(loai, { duLieu, tuPhienBan: tu });
      if (r[loai].id === tu) { toast.push('info', t('Không có gì đổi.')); return true; }
      const moi = r[loai].id, truoc = r.truoc ?? tu;
      toast.hoanTac(`${chu} · ${t('áp cho Case / SOS mới')}`, () => {
        gui(loai, { khoiPhucTu: truoc, tuPhienBan: moi }).then(() => toast.push('ok', t('Đã hoàn tác'))).catch((e) => toast.push('error', (e as Error).message));
      }, { key: 'cau-hinh-case-sos' });
      return true;
    } catch (e) {
      toast.push('error', (e as Error).message);
      return false;
    }
  };
  const loai: LoaiCauHinh = ds === 'nn' ? 'nguyen_nhan' : ds === 'pa' ? 'phuong_an' : 'moc_sos';
  const nk = data.nhatKy.filter((d) => d.loai === loai);
  /** Khôi phục về một bản: hộp nêu các lần đổi SAU bản đó (sẽ đảo lại). */
  const moKhoiPhuc = (id: number, ten: string) => setKhoiPhuc({
    id, loai, ten, dao: nk.filter((d) => d.id > id && d.id <= data[loai].id).flatMap((d) => d.thayDoi.map(chuDoi)),
  });
  const chiXem = !data.suaDuoc;
  const chung = { duLieu: data, chiXem, luuDs };

  return (
    <div className="grid gap-4" data-hd="cau-hinh-case-sos">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
        <h2 className="m-0 text-lg font-bold text-slate-100">Case &amp; SOS</h2>
        <BoLocDoan v8 ariaLabel={t('Danh sách')} value={ds} onChange={setDs}
          muc={[{ key: 'nn', nhan: t('Nguyên nhân') }, { key: 'pa', nhan: t('Phương án') }, { key: 'moc', nhan: t('Mốc SOS') }]} />
        {ds !== 'pa' && <BoLocDoan v8 ariaLabel={t('Loại lớp')} value={ben} onChange={setBen}
          muc={[{ key: 'ft', nhan: 'Fast Track' }, { key: 'thuong', nhan: t('Lớp thường') }]} />}
        <span className="flex items-center gap-1 text-[13px] text-slate-400 sm:ml-auto">
          {t('Áp cho Case / SOS sinh sau')}
          <NutLuat label={t('Giải thích')} phai>{t('Lưu là áp ngay cho Case, PA, SOS sinh SAU lúc lưu. Case, PA, việc đã sinh giữ đúng bản lúc sinh (tên, hạn, người làm). Đổi tên = cùng nghĩa (Phân tích gộp theo nhóm); muốn đổi nghĩa thì Ẩn nhóm cũ, Thêm nhóm mới.')}</NutLuat>
        </span>
        {chiXem && <span className="text-[13px] font-semibold text-slate-300" title={t('Quản trị hệ thống sửa')}><span aria-hidden>🔒</span> {t('Chỉ xem')}</span>}
      </div>

      {xung && (
        <div role="alert" className="flex flex-wrap items-center gap-2.5 rounded-lg border border-soon-line bg-soon-bg px-3.5 py-2.5 text-sm">
          <b className="text-soon">⚠ {t('Vừa có người khác sửa danh sách này')}</b>
          <span className="text-slate-200">{t('Chữ bạn đang gõ vẫn giữ — tải lại rồi lưu lại.')}</span>
          <button type="button" className="btn btn-sm min-h-[44px] sm:ml-auto sm:min-h-0" onClick={() => { setXung(false); reload(); }}>{t('Tải lại')}</button>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {ds === 'nn' && <BangNguyenNhan {...chung} ben={ben} />}
          {ds === 'pa' && <BangPhuongAn {...chung} />}
          {ds === 'moc' && (ben === 'ft' ? <MocSosFt {...chung} /> : <MocSosThuong {...chung} />)}
        </div>
        <aside className="card min-w-0 px-4 pb-1.5 pt-3.5" aria-label={t('Nhật ký')}>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="m-0 text-[15px] font-bold text-slate-100">{t('Nhật ký')}</h3>
            {/* Nhật ký chung (Quản trị › Quyền & nhật ký) có mọi lần đổi (audit `cau_hinh_case_sos.*`); ở đây 8 lần gần nhất của danh sách đang xem. */}
            {!chiXem && nk.length > 8 && <Link to="/quan-tri?tab=config&muc=case-sos" className="ml-auto text-[13px] font-semibold">{t('Xem tất cả ›')}</Link>}
          </div>
          <ul className="m-0 list-none p-0">
            {nk.slice(0, 8).map((d) => (
              <li key={d.id} className="grid gap-0.5 border-t py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[12px] font-semibold text-slate-500">{d.khoiPhucTu !== null ? t('Khôi phục') : d.thayDoi.length > 1 ? t('{n} thay đổi', { n: d.thayDoi.length }) : t(VIEC_CHU[d.thayDoi[0]?.viec ?? 'sua'] as any)}</span>
                <span className="text-sm text-slate-100">{d.thayDoi.map(chuDoi).join(' · ') || '—'}</span>
                <span className="flex flex-wrap items-center gap-2 text-[13px] text-slate-400">
                  <span className="tabular-nums">{d.nguoi ?? t('Hệ thống')} · {fmtDateTime(d.luc)}</span>
                  {!chiXem && d.id !== data[loai].id && (
                    <button type="button" className="btn btn-ghost btn-sm ml-auto min-h-[44px] text-[color:var(--accent)] sm:min-h-0" onClick={() => moKhoiPhuc(d.id, fmtDateTime(d.luc))}>{t('Khôi phục về đây')}</button>
                  )}
                </span>
              </li>
            ))}
            <li className="grid gap-0.5 border-t py-2.5 first:border-t-0" style={{ borderColor: 'var(--line)' }}>
              <span className="text-[12px] font-semibold text-slate-500">{t('Bản gốc')}</span>
              <span className="text-sm text-slate-300">{t('Đúng danh sách trước khi có màn này')}</span>
              {!chiXem && data[loai].id !== 0 && (
                <button type="button" className="btn btn-ghost btn-sm min-h-[44px] justify-self-end text-[color:var(--accent)] sm:min-h-0" onClick={() => moKhoiPhuc(0, t('bản gốc'))}>{t('Khôi phục về đây')}</button>
              )}
            </li>
          </ul>
        </aside>
      </div>

      <ConfirmDialog open={!!khoiPhuc} onClose={() => setKhoiPhuc(null)} busy={busy} confirmLabel={t('Khôi phục')}
        title={khoiPhuc ? t('Khôi phục về {ten}?', { ten: khoiPhuc.ten }) : ''}
        body={khoiPhuc && (
          <div className="grid gap-2 text-sm text-slate-300">
            <span>{t('Các thay đổi sau lần đó sẽ đảo lại:')}</span>
            <ul className="m-0 grid gap-1 pl-4 text-slate-100">{khoiPhuc.dao.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <span>{t('Case đã gắn các mục này giữ nguyên. Khôi phục là một lần đổi mới — Hoàn tác được.')}</span>
          </div>
        )}
        onConfirm={() => {
          if (!khoiPhuc) return;
          setBusy(true);
          gui(khoiPhuc.loai, { khoiPhucTu: khoiPhuc.id, tuPhienBan: data[khoiPhuc.loai].id })
            .then(() => { toast.push('ok', t('Đã khôi phục')); setKhoiPhuc(null); })
            .catch((e) => toast.push('error', (e as Error).message))
            .finally(() => setBusy(false));
        }} />
    </div>
  );
}
