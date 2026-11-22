import { useEffect, useRef, useState, type RefObject } from 'react';
import { api } from '../../lib/api.ts';
import { HopNeo } from '../../ui/HopNeo.tsx';
import { NUT_DONG } from '../../ui/KhungPanel.tsx';
import { ChonNguoi, type NguoiTrongDs } from '../../ui/PeoplePicker.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { HANG_MUC_CV, chuanHangMuc } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** VH-1: nhóm tự đặt của bảng Vận hành (`task_groups`). `n` = số việc (sau lọc) — chỉ có khi đọc từ `/mgmt-tasks`. */
export type NhomViec = { id: number; ten: string; thuTu: number; an: boolean; branchId: number | null; khoa: string | null; coTheSua: boolean; n?: number };

/** Nơi một việc tay nằm (N62): nhóm tự đặt (`groupId`) HOẶC hạng mục chính thống (`hangMuc`); cả hai null = "Không phân loại". */
export type NoiViec = { groupId: number | null; hangMuc: string | null };
export const KHONG_PHAN_LOAI: NoiViec = { groupId: null, hangMuc: null };

export const tenHangMuc = (k: string) => { const m = HANG_MUC_CV.find(([x]) => x === chuanHangMuc(k)); return m ? dich(m[1]) : k; };

/* Ô chọn dùng `ChonNguoi ds` (ô có tìm chung, nhóm có nhãn): id dương = nhóm, âm = hạng mục (vị trí trong `HANG_MUC_CV`), KPL = Không phân loại. */
const KPL = -100000;
const idHangMuc = (k: string) => -1 - HANG_MUC_CV.findIndex(([x]) => x === k);

/**
 * Ô "HẠNG MỤC" của form giao việc (N62 + V2b): hai nhóm lựa chọn có tiêu đề — Tự đặt (nhóm Vận hành, "Không phân loại" cuối nhóm)
 * │ Chính thống (mục của Công việc → việc nằm trong mục đó ở Công việc người nhận). Nhóm ẩn không còn trong ô (V4); việc cũ đang ở nhóm ẩn vẫn hiện tên nhóm đó.
 */
export function OHangMuc({ nhom, value, onChange, id, chiTuDat }: {
  nhom: readonly NhomViec[]; value: NoiViec; onChange: (v: NoiViec) => void; id?: string;
  /** Việc con theo hạng mục của việc cha — chỉ chọn nhóm (máy chủ bỏ qua hạng mục của việc con). */ chiTuDat?: boolean;
}) {
  /* Tự đặt (nhóm Vận hành, "Không phân loại" cuối nhóm — V2b) trước: lựa chọn thường dùng ở bảng Vận hành; Chính thống (N62) sau, cùng ô có tìm. */
  const ds: NguoiTrongDs[] = [
    ...nhom.filter((g) => !g.an || g.id === value.groupId).map((g) => ({ id: g.id, ten: g.ten, nhom: t('Tự đặt'), phu: g.n != null ? t('{n} việc', { n: g.n }) : undefined })),
    { id: KPL, ten: t('Không phân loại'), nhom: t('Tự đặt') },
    ...(chiTuDat ? [] : HANG_MUC_CV.map(([k, ten]) => ({ id: idHangMuc(k), ten: dich(ten), nhom: t('Chính thống') }))),
  ];
  const chon = value.hangMuc ? ds.find((x) => x.id === idHangMuc(value.hangMuc!)) : value.groupId ? ds.find((x) => x.id === value.groupId) : null;
  return (
    <ChonNguoi id={id} ds={ds} nhom="nhan_vien" choToi={false} choNgoai={false} xBo macDinhTrong={t('Không phân loại')}
      placeholder={t('Gõ tên nhóm')} ariaLabel={t('Hạng mục')} tieuDe={t('Hạng mục')}
      value={chon && chon.id !== KPL ? { kieu: 'tai_khoan', id: chon.id, ten: chon.ten } : null}
      onChange={(v) => {
        const so = v?.kieu === 'tai_khoan' ? v.id : KPL;
        if (so === KPL) onChange(KHONG_PHAN_LOAI);
        else if (so < 0) onChange({ groupId: null, hangMuc: HANG_MUC_CV[-1 - so][0] });
        else onChange({ groupId: so, hangMuc: null });
      }} />
  );
}

/** A2-06 (AUDIT-2111, N45): lọc "Nhóm" của bảng Vận hành — ô có tìm như ô Hạng mục (danh sách dài, không cố định); giá trị = tham số `nhom` của địa chỉ
    (id nhóm · `m:<hạng mục>` · `none` · khoá nhóm cũ). Trống = Mọi nhóm. */
export function OLocNhom({ nhom, hangMuc, value, onChange }: { nhom: readonly NhomViec[]; hangMuc: readonly string[]; value: string; onChange: (v: string | null) => void }) {
  const ds: NguoiTrongDs[] = [
    ...nhom.map((g) => ({ id: g.id, ten: g.ten, nhom: t('Tự đặt') })),
    { id: KPL, ten: t('Không phân loại'), nhom: t('Tự đặt') },
    ...hangMuc.map((k) => ({ id: idHangMuc(k), ten: tenHangMuc(k), nhom: t('Chính thống') })),
  ];
  const so = !value ? null : value === 'none' ? KPL : value.startsWith('m:') ? idHangMuc(value.slice(2)) : /^\d+$/.test(value) ? Number(value) : nhom.find((g) => g.khoa === value)?.id ?? null;
  const chon = so == null ? null : ds.find((x) => x.id === so) ?? null;
  return (
    <ChonNguoi ds={ds} nhom="nhan_vien" choToi={false} choNgoai={false} xBo gon macDinhTrong={t('Mọi nhóm')} placeholder={t('Gõ tên nhóm')} ariaLabel={t('Nhóm')} tieuDe={t('Nhóm')}
      value={chon ? { kieu: 'tai_khoan', id: chon.id, ten: chon.ten } : null}
      onChange={(v) => {
        const id = v?.kieu === 'tai_khoan' ? v.id : null;
        onChange(id == null ? null : id === KPL ? 'none' : id < 0 ? `m:${HANG_MUC_CV[-1 - id][0]}` : String(id));
      }} />
  );
}

/**
 * HỘP "NHÓM CÔNG VIỆC" (V4 / V4b): neo dưới nút "Nhóm…". Đổi tên tại dòng (Enter lưu, Esc huỷ) · ▲ ▼ (bấm phím được) · Ẩn / Hiện (không xoá — việc cũ giữ nhóm)
 * · + Nhóm mới (dòng gõ cuối danh sách). Mỗi thao tác lưu ngay + Hoàn tác 10 giây. Máy chủ trả lại danh sách nhóm → vẽ ngay; bảng tải lại khi đóng hộp (nếu đã đổi).
 */
export function HopNhomViec({ neo, nhom: dau, branchId, onDong }: {
  neo: RefObject<HTMLElement | null>; nhom: readonly NhomViec[]; branchId: number | null;
  /** `doi`: có thay đổi → bảng tải lại một lần. */ onDong: (doi: boolean) => void;
}) {
  const toast = useToast();
  const dem = useRef(new Map(dau.map((g) => [g.id, g.n ?? 0]))).current;
  const [ds, setDs] = useState<NhomViec[]>([...dau]);
  const [sua, setSua] = useState<{ id: number | 'moi'; ten: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const daDoi = useRef(false);
  const o = useRef<HTMLInputElement>(null);
  useEffect(() => { if (sua) o.current?.focus(); }, [sua?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const goi = async (f: () => Promise<{ rows: NhomViec[] }>, hoanTac?: { chu: string; f: () => Promise<{ rows: NhomViec[] }> }) => {
    setDang(true); setLoi(null);
    try {
      setDs((await f()).rows); daDoi.current = true; setSua(null);
      if (hoanTac) toast.hoanTac(hoanTac.chu, () => { void hoanTac.f().then((r) => setDs(r.rows)).catch((e) => toast.push('error', e?.message ?? t('Không lưu được'))); }, { ms: 10_000 });
      return true;
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); return false; } finally { setDang(false); }
  };
  const patch = (id: number, b: object) => () => api.patch<{ rows: NhomViec[] }>(`/mgmt-tasks/nhom/${id}`, { ...b, branchId });
  const luuTen = () => {
    if (!sua || dang) return;
    const ten = sua.ten.trim();
    if (!ten) { setLoi(t('Nhóm phải có tên.')); return; }
    if (sua.id === 'moi') {
      void goi(() => api.post<{ rows: NhomViec[] }>('/mgmt-tasks/nhom', { ten, branchId }));
      return;
    }
    const g = ds.find((x) => x.id === sua.id);
    if (!g || g.ten === ten) { setSua(null); return; }
    void goi(patch(g.id, { ten }), { chu: t('Đã đổi tên nhóm'), f: patch(g.id, { ten: g.ten }) });
  };
  /* Nhóm ẩn gom cuối; trong mỗi phần giữ thứ tự máy chủ. ▲▼ chỉ đổi chỗ trong cùng phạm vi (máy chủ) — mép phần tắt nút. */
  const hien = [...ds.filter((g) => !g.an), ...ds.filter((g) => g.an)];
  const dangDung = ds.filter((g) => !g.an).length;
  const NUT = 'btn btn-sm min-h-[44px] sm:min-h-[30px]';
  const VUONG = `${NUT} min-w-[44px] justify-center px-0 sm:w-[30px] sm:min-w-[30px]`;
  const oSua = (id: number | 'moi') => sua?.id === id && (
    <input ref={o} className="field h-[34px] min-h-0 py-1 text-sm" maxLength={60} value={sua.ten} aria-label={t('Tên nhóm')} disabled={dang}
      onChange={(e) => setSua({ id, ten: e.target.value })}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); luuTen(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setSua(null); setLoi(null); } }} />
  );
  const DONG = 'grid min-h-[48px] grid-cols-[minmax(0,1fr)_64px_auto] items-center gap-1.5 border-t py-1.5 pl-3 pr-2 text-sm first:border-t-0 sm:grid-cols-[minmax(0,1fr)_64px_72px_30px_30px_auto]';
  const muiTen = (h: 'len' | 'xuong') => <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d={h === 'len' ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'} /></svg>;
  return (
    <HopNeo neo={neo} nhan={t('Nhóm công việc')} rong={520} onNgoai={() => onDong(daDoi.current)} lop="grid gap-3 p-0">
      <div className="flex items-start gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <b className="text-[14px] font-bold">{t('Nhóm công việc')}</b>
          <span className="text-[13px] text-dim">{t('{n} nhóm đang dùng', { n: dangDung })}</span>
        </div>
        <button type="button" className={`${NUT_DONG} -mr-1`} aria-label={t('Đóng')} onClick={() => onDong(daDoi.current)}>✕</button>
      </div>
      <div className="grid gap-3 px-4 pb-4">
        <div className="grid overflow-clip rounded-[10px] border" style={{ borderColor: 'var(--line)' }}>
          {hien.map((g, i) => {
            const cung = (j: number) => hien[j] && hien[j].an === g.an && hien[j].branchId === g.branchId;
            const dangSua = sua?.id === g.id;
            return (
              <div key={g.id} className={DONG} style={{ borderColor: 'var(--line)' }}>
                {dangSua ? oSua(g.id) : (
                  <span className={`min-w-0 truncate ${g.an ? 'font-medium text-faint' : 'font-semibold'}`}>
                    {g.ten}{g.an && <span className="ml-2 rounded border px-1.5 text-xs font-medium text-dim" style={{ borderColor: 'var(--line-strong)' }}>{t('đã ẩn')}</span>}
                  </span>
                )}
                <span className="whitespace-nowrap text-right text-xs tabular-nums text-faint">{t('{n} việc', { n: dem.get(g.id) ?? 0 })}</span>
                {!g.coTheSua ? <span className="text-right text-xs text-faint sm:col-span-4">{t('dùng chung · Quản trị sửa')}</span> : g.an ? (
                  <><span className="max-sm:hidden" /><span className="max-sm:hidden" /><span className="max-sm:hidden" />
                    <button type="button" className={NUT} disabled={dang} onClick={() => void goi(patch(g.id, { an: false }))}>{t('Hiện')}</button></>
                ) : (
                  <span className="contents max-sm:col-span-3 max-sm:col-start-1 max-sm:flex max-sm:flex-wrap max-sm:justify-end max-sm:gap-1.5">
                    {dangSua
                      ? <button type="button" className={`${NUT} btn-primary`} disabled={dang} onClick={luuTen}>{t('Lưu')}</button>
                      : <button type="button" className={NUT} disabled={dang || !!sua} onClick={() => { setLoi(null); setSua({ id: g.id, ten: g.ten }); }}>{t('Đổi tên')}</button>}
                    <button type="button" className={VUONG} aria-label={t('Lên: {ten}', { ten: g.ten })} disabled={dang || !cung(i - 1)}
                      onClick={() => void goi(patch(g.id, { doi: -1 }), { chu: t('Đã đổi thứ tự'), f: patch(g.id, { doi: 1 }) })}>{muiTen('len')}</button>
                    <button type="button" className={VUONG} aria-label={t('Xuống: {ten}', { ten: g.ten })} disabled={dang || !cung(i + 1)}
                      onClick={() => void goi(patch(g.id, { doi: 1 }), { chu: t('Đã đổi thứ tự'), f: patch(g.id, { doi: -1 }) })}>{muiTen('xuong')}</button>
                    {dangSua
                      ? <button type="button" className={NUT} disabled={dang} onClick={() => { setSua(null); setLoi(null); }}>{t('Huỷ đổi tên')}</button>
                      : <button type="button" className={NUT} disabled={dang || !!sua} onClick={() => void goi(patch(g.id, { an: true }), { chu: t('Đã ẩn nhóm {ten}', { ten: g.ten }), f: patch(g.id, { an: false }) })}>{t('Ẩn')}</button>}
                  </span>
                )}
              </div>
            );
          })}
          {sua?.id === 'moi' && (
            <div className={DONG} style={{ borderColor: 'var(--line)' }}>
              {oSua('moi')}
              <span className="text-right text-xs text-faint">{t('mới')}</span>
              <span className="contents max-sm:col-span-3 max-sm:flex max-sm:justify-end max-sm:gap-1.5">
                <button type="button" className={`${NUT} btn-primary`} disabled={dang} onClick={luuTen}>{t('Tạo')}</button>
                <span className="max-sm:hidden" /><span className="max-sm:hidden" />
                <button type="button" className={NUT} disabled={dang} onClick={() => { setSua(null); setLoi(null); }}>{t('Huỷ tạo')}</button>
              </span>
            </div>
          )}
        </div>
        {loi && <p role="alert" className="m-0 text-[13px] text-bad">⚠ {loi}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={NUT} disabled={dang || !!sua} onClick={() => { setLoi(null); setSua({ id: 'moi', ten: '' }); }}>{t('+ Nhóm mới')}</button>
          <span className="ml-auto text-[13px] text-faint">{t('Không phân loại · luôn cuối')}</span>
        </div>
      </div>
    </HopNeo>
  );
}
