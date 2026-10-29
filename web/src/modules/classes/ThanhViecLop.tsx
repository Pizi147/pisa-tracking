import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { CHIP_TRON } from '../../ui/Nhan.tsx';
import { PanelViec } from '../congViec/PanelViec.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { shortDate, viecKeTiep } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** `GET /classes/:id/viec-theo-em` (SV-LOP + UI-HO-SO-LOP): việc theo em (cột Case + PA đọc lại) + `cuaToi` = việc của người xem ở lớp. */
export type ViecLop = { theoEm: Record<number, WorkItem[]>; cuaToi: WorkItem[] };
export const duongViecLop = (classId: number) => `/classes/${classId}/viec-theo-em?chi=toi`;
const TOI_DA = 3;   // mockup khu b: một hàng ba ô; còn lại ở Công việc

/**
 * THANH "VIỆC CẦN LÀM" ĐẦU HỒ SƠ LỚP (`dieu-chinh-cuoi.html` khu b, `.thanh-viec`): mỗi việc CỦA NGƯỜI XEM ở lớp một ô — tên việc (+ em) · trạng thái
 * hạn + hạn `dd/mm` (P7) · nút động từ. Vạch trái: quá hạn đỏ · hạn hôm nay vàng · còn lại xanh. Bấm nút = panel Công việc ngay tại trang (`PanelViec`,
 * không đổi trang). Không có việc → không vẽ thanh. Quá 3 việc → "Xem tất cả ở Công việc ›".
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
  return (
    <>
      {ds.length > 0 && (
        /* V8-HSL hàng ⑤ (mockup v8 `.hang-viec`): "Việc của tôi · n" + tối đa 3 ô cao 36 trên MỘT hàng + "+n ở Công việc ›". 375: ô xếp dọc. */
        <section aria-label={t('Việc của tôi')} className="grid items-center gap-2 pt-0.5 lg:grid-cols-[auto_repeat(3,minmax(0,1fr))_auto]">
          <span className="whitespace-nowrap pr-1 text-[13px] font-medium text-slate-400">{t('Việc của tôi')} · <b className="tabular-nums text-slate-100">{ds.length}</b></span>
          {ds.slice(0, TOI_DA).map((it) => <OViec key={it.key} it={it} dangMo={mo?.key === it.key} onMo={() => moTuThanh(it)} />)}
          {ds.length > TOI_DA && (
            <Link to="/cong-viec" className="link justify-self-end whitespace-nowrap text-[14px] font-semibold max-lg:py-2">{t('+{n} ở Công việc ›', { n: ds.length - TOI_DA })}</Link>
          )}
        </section>
      )}
      {mo && <PanelViec key={mo.key} it={mo} onDong={() => setMo(null)} onDaLam={daLam} onTiep={keTiep ? () => setMo(keTiep) : null}
        tenTiep={keTiep?.studentId !== null ? keTiep?.studentName : null} />}
    </>
  );
}

/* Mockup v8: tên kỹ năng trong ô việc viết tắt "Nhập điểm L · R" — ô 36 px một dòng. */
const TAT: Record<string, string> = { 'Writing Task 1': 'W1', 'Writing Task 2': 'W2', Listening: 'L', Reading: 'R', Writing: 'W', Speaking: 'S' };
const gonKyNang = (s: string) => s.replace(/Writing Task [12]|Listening|Reading|Writing|Speaking/g, (k) => TAT[k]).replace(/\b(L|R|W1|W2|W|S), (?=(L|R|W1|W2|W|S)\b)/g, '$1 · ');

/**
 * Một ô việc (mockup v8 `.viec`): CẢ Ô là nút mở panel việc tại trang — tên việc đậm 14 · phụ 13 (số bài) · viên hạn bên phải
 * (quá hạn đỏ ⚠ · hôm nay vàng · còn lại xám). Vạch trái 3 px theo hạn (mockup đã duyệt).
 */
function OViec({ it, dangMo, onMo }: { it: WorkItem; dangMo: boolean; onMo: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const vach = it.urgency === 'overdue' ? 'rgb(var(--bad-rgb))' : it.urgency === 'today' ? 'rgb(var(--soon-line-rgb))' : 'var(--accent)';
  const tieuDe = gonKyNang(dich(it.tieuDe));
  const ten = it.studentId !== null && !tieuDe.includes(it.studentName) ? `${tieuDe} · ${it.studentName}` : tieuDe;
  const han = it.due ? (it.urgency === 'today' ? t('hạn hôm nay') : t('hạn {ngay}', { ngay: shortDate(it.due, homNay) })) : null;
  return (
    <button type="button" onClick={onMo} aria-expanded={dangMo} title={`${ten} — ${dich(it.actionLabel)}`}
      className={`flex h-9 min-w-0 items-center gap-2 rounded-lg border border-l-[3px] px-3 text-left max-lg:h-auto max-lg:min-h-[44px] max-lg:flex-wrap max-lg:py-1.5 ${dangMo ? 'bg-[color:var(--accent-soft)]' : 'bg-[color:var(--surface)] hover:bg-[color:var(--nut-hover)]'}`}
      style={{ borderColor: 'var(--line)', borderLeftColor: vach }}>
      <span className="min-w-0 truncate text-[14px] font-semibold text-slate-100">{ten}</span>
      {it.group === 'score' && it.soBai ? <span className="whitespace-nowrap text-[13px] tabular-nums text-slate-400">{t('{soBai} bài', { soBai: it.soBai })}</span> : null}
      {han && (
        <span className={`${CHIP_TRON} ml-auto shrink-0 tabular-nums ${
          it.urgency === 'overdue' ? 'bg-bad-bg text-bad' : it.urgency === 'today' ? 'bg-soon-bg text-soon' : 'bg-[color:var(--surface-2)] text-slate-400'}`}>
          {it.urgency === 'overdue' && <span aria-hidden className="mr-0.5">⚠</span>}{han}
        </span>
      )}
    </button>
  );
}
