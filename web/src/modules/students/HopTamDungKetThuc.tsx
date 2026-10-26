import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Modal } from '../../ui/Drawer.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { NHAN_VIEC_QUAN_LY, type XemTruocHangLoat } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { chayHangLoat, hoanTacHangLoat } from './hangLoatEm.ts';

const LAM_MOI = ['/students', '/classes', '/hoc-vien-lop', '/cases', '/my-work', '/tong-quan', '/hoc-vien-lop/luu-tru'];
const lamMoi = () => LAM_MOI.forEach((k) => invalidate(k));

/** Khối "Khi lưu, web sẽ" — chữ do máy chủ tính (cùng hàm lúc lưu); viền vàng khi Kết thúc học (hậu quả lớn hơn). */
export function KhoiKhiLuu({ dong, vang }: { dong: string[]; vang?: boolean }) {
  if (!dong.length) return null;
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-sm ${vang ? 'border-soon/60 bg-soon/10' : 'border-[color:var(--line)] bg-[color:var(--surface-2)]'}`}>
      <div className="text-xs font-bold text-slate-400">{t('Khi lưu, web sẽ')}</div>
      <ul className="m-0 mt-1 list-disc space-y-0.5 pl-5 text-slate-200">{dong.map((x) => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

/**
 * HỘP "TẠM DỪNG/ KẾT THÚC HỌC" (P7 SV-LO-TRINH, N11 — mockup V6 `trang-thai-hv.html` k2, k3): MỘT hộp nhỏ cho một em (⋯ hồ sơ, ⋯ dòng theo vai) và nhiều em
 * (thanh chọn ở tab Học viên lớp). Từ ngày (`ONgay`) · Lý do (tuỳ chọn) · ô "Có thể quay lại học" (bật sẵn khi em đang học; em đang tạm dừng thì chỉ còn Kết thúc học)
 * · "Khi lưu, web sẽ" do máy chủ tính. Bật → Tạm dừng + Lưu trữ; tắt → Kết thúc học (+ Lưu trữ). Đang lưu… · lỗi giữ chữ + Thử lại · Hoàn tác 10 s ·
 * bị chặn: đúng câu máy chủ + nút đi tiếp (Chuyển lớp…). Nhiều em: lỗi một phần → "Đã lưu n em" + em lỗi giữ lý do + "Thử lại n em".
 */
export function HopTamDungKetThuc({ em, lop, tamDungDuoc, onClose, onDone, onChuyenLop, dongTamDung = [] }: {
  /** Tên trống (thanh chọn nhiều chỉ có id) → lấy tên từ xem trước của máy chủ. */
  em: { id: number; ten?: string }[];
  /** Mã lớp ở dòng ngữ cảnh. */
  lop?: string | null;
  /** Ô "Có thể quay lại học" bật được (em đang học). false = em đang tạm dừng → chỉ Kết thúc học. */
  tamDungDuoc: boolean;
  onClose: () => void; onDone: () => void;
  /** Bị chặn vì quyết định chuyển lớp chờ → nút "Chuyển lớp…" (chỉ một em). */
  onChuyenLop?: () => void;
  /** Dòng thêm của nơi gọi khi Tạm dừng (O2: vi phạm Ý thức còn mở dừng hạn — số đã có ở hồ sơ). */
  dongTamDung?: string[];
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const [ds, setDs] = useState(em);
  const [ngay, setNgay] = useState(homNay ?? '');
  const [lyDo, setLyDo] = useState('');
  const [quayLai, setQuayLai] = useState(tamDungDuoc);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState<string[]>([]);
  const [loiEm, setLoiEm] = useState<{ id: number; ten: string; message: string }[]>([]);
  const mot = ds.length === 1 ? ds[0] : null;
  const ketThuc = !quayLai;
  const viec = ketThuc ? 'ket-thuc' as const : 'tam-dung' as const;
  /* Xem trước: một em → `GET …/trang-thai/xem-truoc`; nhiều em → xem trước hàng loạt (cùng hàm `tomTatTrangThai`, có lý do từng em không làm được). */
  const motXem = useApi<{ dong: string[]; chan: string | null }>(mot ? `/students/${mot.id}/trang-thai/xem-truoc?ketThuc=${ketThuc ? 1 : 0}` : null, [mot?.id, ketThuc]);
  const [nhieuXem, setNhieuXem] = useState<XemTruocHangLoat | null>(null);
  const idsKhoa = ds.map((e) => e.id).join(',');
  useEffect(() => {
    if (mot) return undefined;
    let con = true;
    api.post<XemTruocHangLoat>('/hang-loat-hoc-vien/xem-truoc', { viec, studentIds: idsKhoa.split(',').map(Number) })
      .then((x) => { if (con) setNhieuXem(x); }, (e: any) => { if (con) setLoi(e?.message ?? null); });
    return () => { con = false; };
  }, [mot, viec, idsKhoa]);
  const dongKhiLuu = [...(mot ? motXem.data?.dong ?? [] : nhieuXem?.tong.tomTat ?? []), ...(ketThuc ? [] : dongTamDung)];
  const boQua = mot ? [] : (nhieuXem?.rows ?? []).filter((r) => r.lyDoBo);
  const chan = mot ? motXem.data?.chan ?? null : null;
  const nhanNut = (ketThuc ? t('Kết thúc học') : t('Tạm dừng')) + (mot ? '' : ` · ${t('{n} em', { n: ds.length - boQua.length })}`);
  const tieuDe = NHAN_VIEC_QUAN_LY['tam-dung-ket-thuc'] + (mot ? '' : ` · ${t('{n} em', { n: ds.length })}`);
  const tenCua = (id: number) => ds.find((e) => e.id === id)?.ten ?? nhieuXem?.rows.find((r) => r.studentId === id)?.ten ?? `#${id}`;
  const nguCanh = [lop, ds.map((e) => tenCua(e.id)).join(', ')].filter(Boolean).join(' · ');

  /* Câu báo do máy chủ trả (`thongBao`, một em) — em FT còn lộ trình chạy kết thúc học thì CHƯA vào Lưu trữ. Hàng loạt: câu theo "Khi lưu, web sẽ" của máy chủ. */
  const coChoThi = (nhieuXem?.tong.tomTat ?? []).some((d) => d.includes('chờ KQ thi thật'));
  const hoanTac = (ids: number[], ten: string, thongBao?: string | null) => toast.hoanTac(
    thongBao ? `${ten}: ${dich(thongBao)}`
      : ketThuc ? (coChoThi ? t('{ten} đã kết thúc học — em FT chờ KQ thi thật rồi vào Lưu trữ', { ten }) : t('{ten} đã vào Lưu trữ · Kết thúc học', { ten }))
        : t('{ten} đã vào Lưu trữ · Tạm dừng', { ten }),
    async () => {
      /* Một em Tạm dừng: đường riêng (TVV / CX có `student.edit_more` hoàn tác được); hàng loạt giữ quyền `cycle.edit`. */
      if (mot && !ketThuc) {
        try { await api.post(`/students/${ids[0]}/hoan-tac-tam-dung`); } catch (e: any) { lamMoi(); toast.push('error', e?.message ?? t('Mất kết nối')); return; }
      } else {
        const r = await hoanTacHangLoat(viec, ids);
        if (r.failed.length) { lamMoi(); toast.push('error', r.failed[0].message); return; }
      }
      lamMoi();
      toast.push('ok', t('Đã hoàn tác'));
      onDone();
    }, { key: `${viec}:${ids.join(',')}` });

  const luu = async () => {
    if (busy || chan) return;
    setBusy(true); setLoi(null);
    try {
      if (mot) {
        const r = await api.post<{ thongBao?: string | null }>(`/students/${mot.id}/status`, { status: ketThuc ? 'finished' : 'inactive', date: ngay || undefined, reason: lyDo.trim() || undefined });
        lamMoi(); hoanTac([mot.id], tenCua(mot.id), r?.thongBao); onDone(); onClose();
        return;
      }
      const r = await chayHangLoat(viec, ds.map((e) => e.id).filter((id) => !boQua.some((b) => b.studentId === id)), { lyDo: lyDo.trim() || undefined, date: ngay || undefined });
      const ten = tenCua;
      if (r.ok.length) { lamMoi(); hoanTac(r.ok, t('{n} em', { n: r.ok.length })); onDone(); }
      if (!r.failed.length) { onClose(); return; }
      /* Lỗi một phần: em đã lưu rời hộp, em lỗi ở lại giữ lý do — "Thử lại n em" gửi đúng các em đó. */
      setDaLuu((cu) => [...cu, ...r.ok.map(ten)]);
      setLoiEm(r.failed.map((f) => ({ id: f.studentId, ten: ten(f.studentId), message: f.message })));
      setDs(ds.filter((e) => r.failed.some((f) => f.studentId === e.id)));
    } catch (e: any) {
      setLoi(e?.message ?? t('Mất kết nối'));
    } finally { setBusy(false); }
  };

  const nutPhu = chan && onChuyenLop
    ? <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={() => { onClose(); onChuyenLop(); }}>{t('Chuyển lớp…')}</button>
    : null;
  return (
    <Modal open onClose={busy ? () => {} : onClose} width="max-w-md"
      title={<span className="flex flex-col"><span>{tieuDe}</span><span className="text-xs font-normal text-slate-400">{nguCanh}</span></span>}
      footer={(
        <>
          {busy && <span className="mr-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--accent)]" role="status">{t('Đang lưu…')}</span>}
          <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={onClose} disabled={busy}>{t('Đóng')}</button>
          {nutPhu}
          {!chan && (
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={() => void luu()} disabled={busy || (!mot && ds.length === boQua.length)}>
              {loi ? t('Thử lại') : loiEm.length ? t('Thử lại {n} em', { n: ds.length }) : nhanNut}
            </button>
          )}
        </>
      )}>
      <div className="space-y-3">
        {daLuu.length > 0 && <p className="m-0 text-[13px] font-semibold text-slate-300" role="status">✓ {t('Đã lưu {n} em: {ten}', { n: daLuu.length, ten: daLuu.join(', ') })}</p>}
        {loiEm.map((e) => (
          <p key={e.id} role="alert" className="m-0 flex gap-2 rounded-lg border border-late/50 bg-late/10 px-3 py-2 text-sm text-slate-100">
            <span aria-hidden className="text-late">⚠</span><span><b className="text-late">{t('{ten} chưa lưu.', { ten: e.ten })}</b> {e.message}</span>
          </p>
        ))}
        {chan ? (
          <p role="alert" className="m-0 flex gap-2 rounded-lg border border-late/50 bg-late/10 px-3 py-2 text-sm text-slate-100"><span aria-hidden className="text-late">⚠</span><span>{chan}</span></p>
        ) : (
          <>
            <Truong nhan={t('Từ ngày')}><ONgay kieu="ngay" value={ngay || null} onChange={setNgay} toiDa={homNay ?? undefined} /></Truong>
            <Truong nhan={t('Lý do')} tuyChon>
              <textarea className="field w-full" rows={2} autoComplete="off" value={lyDo} maxLength={2000} onChange={(e) => setLyDo(e.target.value)} />
            </Truong>
            <label className={`flex min-h-[44px] items-center gap-2 text-sm sm:min-h-0 ${tamDungDuoc ? 'cursor-pointer' : 'opacity-60'}`}>
              <input type="checkbox" className="h-4 w-4" checked={quayLai} disabled={!tamDungDuoc || busy} onChange={(e) => setQuayLai(e.target.checked)} />
              <b className="font-semibold text-slate-100">{t('Có thể quay lại học')}</b>
              {!tamDungDuoc && <span className="text-xs text-slate-400">· {t('em đang tạm dừng')}</span>}
            </label>
            <KhoiKhiLuu dong={dongKhiLuu} vang={ketThuc} />
            {boQua.length > 0 && (
              <ul className="m-0 list-none space-y-1 p-0 text-[13px] text-slate-400">
                {boQua.map((r) => <li key={r.studentId}>{t('{ten} — bỏ qua: {lyDo}', { ten: r.ten, lyDo: r.lyDoBo ?? '' })}</li>)}
              </ul>
            )}
          </>
        )}
        {loi && (
          <p role="alert" className="m-0 flex gap-2 rounded-lg border border-late/50 bg-late/10 px-3 py-2 text-sm text-slate-100">
            <span aria-hidden className="text-late">⚠</span><span><b className="text-late">{t('Không lưu được')}.</b> {loi} — {t('chữ đã gõ vẫn giữ.')}</span>
          </p>
        )}
      </div>
    </Modal>
  );
}
