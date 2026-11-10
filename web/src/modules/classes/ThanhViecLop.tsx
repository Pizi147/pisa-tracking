import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { PanelViec } from '../congViec/PanelViecLuoi.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { daysBetween, nhanQuaHan, shortDate, tachViec, viecKeTiep } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** `GET /classes/:id/viec-theo-em` (SV-LOP + UI-HO-SO-LOP): việc theo em (cột Case + PA đọc lại) + `cuaToi` = việc của người xem ở lớp.
 * LOP-1-LOP: `soQuaHanLop` = badge "n việc quá hạn" đầu hồ sơ lớp (cùng lần `myWork`, cùng `demDongViec` — S11 đếm dòng); `null` = vai không có badge (TVV / CX / Admin). */
export type ViecLop = { theoEm: Record<number, WorkItem[]>; cuaToi: WorkItem[]; soQuaHanLop: number | null };
export const duongViecLop = (classId: number) => `/classes/${classId}/viec-theo-em?chi=toi`;
const TOI_DA = 3;   // mockup khu b: một hàng ba ô; còn lại ở Công việc

/**
 * THANH "VIỆC CẦN LÀM" ĐẦU HỒ SƠ LỚP (`dieu-chinh-cuoi.html` khu b, `.thanh-viec`): mỗi việc CỦA NGƯỜI XEM ở lớp một ô — tên việc (+ em) · trạng thái
 * hạn + hạn `dd/mm` (P7) · nút động từ. Vạch trái: quá hạn đỏ · hạn hôm nay vàng · còn lại xanh. Bấm nút = panel Công việc ngay tại trang (`PanelViec`,
 * không đổi trang). Không có việc → không vẽ thanh. Quá 3 việc → "+n việc ở Công việc ›" (MOCKUP-1111: ô một dòng cùng cao, chi tiết ở panel).
 */
export function ThanhViecLop({ classId, onDoi }: { classId: number; onDoi: () => void }) {
  const { data, reload } = useApi<ViecLop>(duongViecLop(classId), [classId]);
  const [mo, setMo] = useState<WorkItem | null>(null);
  const ds = data?.cuaToi ?? [];
  const daLam = () => { invalidate('/my-work'); reload(); onDoi(); };
  /* R1-LUU-TIEP [KIỂM]: thứ tự chụp lúc mở việc từ thanh — việc vừa xong rời danh sách vẫn tìm được việc kế (không về việc đầu). */
  const anhChup = useRef<WorkItem[]>([]);
  const moTuThanh = (it: WorkItem) => { anhChup.current = ds; setMo(it); };
  const conKhoa = new Set(ds.map((x) => x.key));
  const keTiep = mo ? viecKeTiep((anhChup.current.length ? anhChup.current : ds).map((x) => ({ ...x, nhom: '' })), mo.key, (x) => conKhoa.has(x.key)) : null;
  const con = ds.length - TOI_DA;
  /* "+n việc ở Công việc ›": 1440 xếp dưới nhãn (3 ô đủ rộng, không cắt chữ); 375 cuối dải. */
  const xemHet = (lop: string) => con > 0 && (
    <Link to="/cong-viec" className={`link relative whitespace-nowrap font-semibold ${lop}`}>{t('+{n} việc ở Công việc ›', { n: con })}</Link>
  );
  return (
    <>
      {ds.length > 0 && (
        /* MOCKUP-1111 màn 1 (`thiet-ke/2026-11-11-mockup-1111/1-dai-viec-cua-toi.html` K1–K4, chủ SP duyệt 11/11): nhãn + tối đa 3 ô CÙNG CAO, một dòng
           (tên việc · em / kỹ năng · số · hạn); chi tiết (tên em, điểm SOS…) ở panel khi bấm. 375: ô xếp dọc, mỗi ô cố định hai dòng. */
        <section aria-label={t('Việc của tôi')} className="grid items-center gap-1.5 pt-0.5 lg:grid-cols-[auto_repeat(3,minmax(0,1fr))] lg:gap-2">
          <span className="grid gap-px pr-1 text-[13px] font-medium leading-[1.3] text-slate-400">
            <span className="whitespace-nowrap">{t('Việc của tôi')} · <b className="tabular-nums text-slate-100">{ds.length}</b></span>
            {xemHet('justify-self-start text-xs max-lg:hidden')}
          </span>
          {ds.slice(0, TOI_DA).map((it) => <OViec key={it.key} it={it} dangMo={mo?.key === it.key} onMo={() => moTuThanh(it)} />)}
          {xemHet('min-h-[44px] justify-self-end text-sm leading-[44px] lg:hidden')}
        </section>
      )}
      {mo && <PanelViec key={mo.key} it={mo} onDong={() => setMo(null)} onDaLam={daLam} onTiep={keTiep ? () => setMo(keTiep) : null}
        tenTiep={keTiep?.studentId !== null ? keTiep?.studentName : null} />}
    </>
  );
}

/**
 * Một ô việc: CẢ Ô là nút mở panel việc tại trang. Cao 40 px một dòng — tên việc 14/600 (không cắt trước phần phụ) · phần phụ 13 mờ · hạn chữ bên phải
 * (⚠ quá hạn đỏ · ⚠ hôm nay vàng · còn lại mờ; không hạn → trống). Vạch trái 3 px theo hạn (giữ mockup v8). 375: hai dòng cố định 56 px.
 */
function OViec({ it, dangMo, onMo }: { it: WorkItem; dangMo: boolean; onMo: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const vach = it.urgency === 'overdue' ? 'rgb(var(--bad-rgb))' : it.urgency === 'today' ? 'rgb(var(--soon-line-rgb))' : 'var(--accent)';
  const { ten, phu } = tachViec(it);
  /* U01 / U03 (PTA 03/11): quá hạn mọi màn "⚠ quá hạn n ngày". */
  const han = it.due ? (it.urgency === 'overdue' && homNay ? nhanQuaHan(Math.max(1, daysBetween(it.due.slice(0, 10), homNay))) : it.urgency === 'today' ? t('hạn hôm nay') : t('hạn {ngay}', { ngay: shortDate(it.due, homNay) })) : null;
  const canhBao = it.urgency === 'overdue' || it.urgency === 'today';
  return (
    <button type="button" onClick={onMo} aria-expanded={dangMo} title={[ten, phu, han].filter(Boolean).join(' — ')} aria-label={[ten, phu, han].filter(Boolean).join(', ')}
      className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] content-center gap-x-2 gap-y-0.5 rounded-lg border border-l-[3px] px-3 text-left max-lg:h-14 lg:flex lg:h-10 lg:items-center ${dangMo ? 'bg-[color:var(--accent-soft)]' : 'bg-[color:var(--surface)] hover:bg-[color:var(--nut-hover)]'}`}
      style={{ borderColor: dangMo ? 'var(--accent)' : 'var(--line)', borderLeftColor: vach }}>
      <span className="truncate text-sm font-semibold text-slate-100 lg:max-w-[72%] lg:shrink-0">{ten}</span>
      {han && (
        <span className={`col-start-2 row-start-1 shrink-0 whitespace-nowrap text-[13px] tabular-nums lg:order-last lg:ml-auto ${
          it.urgency === 'overdue' ? 'font-bold text-bad' : it.urgency === 'today' ? 'font-bold text-soon' : 'font-semibold text-slate-400'}`}>
          {canhBao && <span aria-hidden className="mr-0.5">⚠</span>}{han}
        </span>
      )}
      {phu && <span className="col-span-2 min-w-0 truncate text-[13px] font-medium text-slate-400 lg:min-w-0">{phu}</span>}
    </button>
  );
}
