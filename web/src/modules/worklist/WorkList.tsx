import { type ReactNode, useState } from 'react';
import { Level, NhanTrangThai } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { toneTheoNhan } from '../../lib/format.ts';
import { LOAI_HAN_CUA_VIEC } from '@shared/domain/index.ts';

export type WorkItem = {
  key: string; group: string; urgency: 'overdue' | 'today' | 'normal';
  studentId: number | null; studentName: string;
  classId: number | null; classCode: string | null;
  /** MH4: khung của lớp; `null` = việc không gắn lớp (hiện ở mọi khung). */
  khung?: 'ft' | 'thuong' | null;
  attemptId: number | null; attemptNo: number | null; caseId: number | null;
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string; actionLabel: string; href: string;
  /** Tiêu đề dòng: động từ + đối tượng (B-2). */
  tieuDe: string;
  ownerId: number | null; owner: string | null; mine: boolean;
  due: string | null; statusLabel: string;
  /** Bài/Case liên quan — ô thứ hai của dòng việc: "MT2", "Giữa khoá", "Case". */
  contextLabel: string | null;
  /** Số học viên trong một dòng việc gom. NULL khi dòng chỉ nói về một em. */
  count: number | null;
  /** PR-Ra Q5: chỉ dòng có người phụ trách là TÀI KHOẢN KHÁC người xem, và người xem là QL/QT. */
  nhac?: { ownerId: number; daNhacLuc: string | null } | null;
  /** PR-GOP (§5): dòng gộp "Loại việc · lớp · n em" — các việc thật bên trong (mỗi việc giữ nút, hạn riêng). */
  con?: (WorkItem & { conTen: string; conPhu: string })[];
};
export type WorkGroup = { key: string; label: string; hint: string; items: WorkItem[]; overdue: number; today: number };

/**
 * MỘT DÒNG VIỆC (PR-UX0, mockup 17 (b3)) — ba ô: [tiêu đề + ≤ 1 badge + dòng phụ] · [hạn, cột 150px] · [nút].
 *
 * Việc cần làm là TIÊU ĐỀ (động từ + đối tượng), không nằm trong badge. Không còn `Status`/`Task`/`Alert`/`Info`
 * trên dòng: em nào · lớp · bài · số HV · người phụ trách gộp một dòng phụ mờ; hạn ở cột riêng qua `<Han>` —
 * quá hạn nối ngay sau bằng chữ "⚠ quá hạn n ngày" (B-3, B-5). Thẻ ngoài là `div` để nút phụ
 * đứng cạnh phần bấm-mở mà không lồng `button` trong `button`. Loại việc chưa có loại hạn thì hạn là ngày trơn.
 */
export function DongViec({ it, onOpen, nutPhu }: {
  it: WorkItem; onOpen: (href: string) => void;
  /** Nút phụ đứng cạnh nút chính (PR-Ra: Nhắc/Duyệt). */
  nutPhu?: ReactNode;
}) {
  const [mo, setMo] = useState(false);
  const con = it.con;
  const loaiHan = LOAI_HAN_CUA_VIEC[it.group];
  /* Lớp chỉ hiện khi dòng đang nói về MỘT EM — dòng gom đã lấy chính tên lớp làm tiêu đề phụ. */
  /* PR-LCb: "Chốt lộ trình · lớp" là việc cả lớp (thay "Chuyển tiếp lớp" + "Chốt lên FT"): tiêu đề đã có lớp, chữ việc đã có số em — dòng phụ không nhắc lại. PR-CL: "Xét lại lộ trình · lớp · n em" cũng vậy; PR-KV: "Kỳ vọng đầu ra · lớp · n em". */
  /* PR-GOP: dòng gộp — tiêu đề đã có lớp và số em; dòng phụ chỉ còn chữ chung ("Progress Test" / "1 em quá hạn"). */
  const viecCaLop = it.group === 'chot_len_ft' || it.group === 'xet_lai_lo_trinh' || it.group === 'ky_vong_dau_ra';
  const gomLop = !!con || viecCaLop;
  const dongPhu = [
    gomLop ? null : it.studentName,
    it.classCode && it.studentName !== `Lớp ${it.classCode}` ? it.classCode : null,
    it.contextLabel,
    !gomLop && it.count !== null && it.count > 1 ? `${it.count} HV` : null,
  ].filter(Boolean).join(' · ');
  /* Q31-4 (D9): người phụ trách 12 px — tách khỏi phần ngữ cảnh 11 px của dòng phụ. */
  const nguoi = it.owner ?? (it.ownerId === null && !it.mine && !viecCaLop ? 'chưa ai phụ trách' : null);
  /* PR-GOP (mockup phần 4): bấm tiêu đề hay nút "n em ▾" đều mở / đóng danh sách em; có em quá hạn → nền đỏ nhạt cả dòng. */
  const bam = () => (con ? setMo(!mo) : onOpen(it.href));
  const maDs = `con-${it.key}`;
  return (
    /* PR-VAI-a (§7.3, mockup 23 màn A): bốn cột thẳng qua mọi nhóm — nhãn trạng thái · việc · hạn (12 px) · nút. */
    <div className={`grid grid-cols-[78px_minmax(0,1fr)] gap-x-3 gap-y-1 py-2 pr-3 sm:grid-cols-[78px_minmax(0,1fr)_150px_230px] sm:items-center ${
      con && it.urgency === 'overdue' ? 'bg-late-bg/60' : 'hover:bg-white/5'}`} title={con ? undefined : it.reason}>
      <span className="pt-0.5 sm:pt-0"><NhanTrangThai t={it.urgency === 'overdue' ? 'qua-han' : 'can-lam'} /></span>
      <button type="button" className="min-w-0 appearance-none border-0 bg-transparent p-0 text-left cursor-pointer" onClick={bam}
        aria-expanded={con ? mo : undefined} aria-controls={con ? maDs : undefined}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-slate-100 max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words">{it.tieuDe}</span>
          {it.level && <Level tone={toneTheoNhan(it.level.text, it.level.tone)}>{it.level.text}</Level>}
        </span>
        <span className="block truncate text-xs text-slate-500 max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words">
          {dongPhu}{nguoi && <>{dongPhu ? ' · ' : ''}<span className="text-xs text-slate-400">{nguoi}</span></>}
        </span>
      </button>
      <span className="col-start-2 text-xs sm:col-start-auto [&>span]:text-xs">
        {it.due ? <Han loai={loaiHan ?? 'viec-van-hanh'} han={it.due} haiDong /> : <span className="text-slate-500">Chưa có hạn</span>}
      </span>
      <span className="col-start-2 flex items-center gap-2 sm:col-start-auto sm:justify-end">
        {nutPhu}
        {con ? (
          <button type="button" className="btn btn-sm inline-flex min-h-[44px] items-center gap-1.5 sm:min-h-[32px]" onClick={bam}
            aria-expanded={mo} aria-controls={maDs}>
            {it.actionLabel}
            <svg aria-hidden viewBox="0 0 8 8" width="8" height="8" className={`transition-transform ${mo ? '-rotate-90' : 'rotate-90'}`}>
              <path d="M2.5 1 6 4 2.5 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => onOpen(it.href)}>{it.actionLabel}</button>
        )}
      </span>
      {con && mo && (
        <ul id={maDs} className="col-span-full m-0 mb-0.5 mt-1 list-none divide-y rounded-lg border p-0 sm:col-start-2 sm:col-end-[-1]"
          style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          {con.map((c) => <li key={c.key}><DongCon it={c} loaiHan={loaiHan} onOpen={onOpen} /></li>)}
        </ul>
      )}
    </div>
  );
}

/** Một em trong dòng gộp (mockup phần 4 `.con-ds .ce`): tên + phụ · hạn riêng · nút làm việc của em. Điện thoại: nút sang phải, hạn dưới tên. */
function DongCon({ it, loaiHan, onOpen }: { it: WorkItem & { conTen: string; conPhu: string }; loaiHan: ReturnType<typeof loaiHanCua>; onOpen: (href: string) => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-2.5 py-1.5 text-[12.5px] sm:grid-cols-[minmax(0,1fr)_150px_220px]">
      <button type="button" className="min-w-0 appearance-none border-0 bg-transparent p-0 text-left cursor-pointer" onClick={() => onOpen(it.href)}>
        <span className="block break-words font-semibold text-slate-100">{it.conTen}</span>
        {it.conPhu && <small className="block break-words text-[11.5px] font-normal text-slate-500">{it.conPhu}</small>}
      </button>
      <span className="col-start-1 text-xs sm:col-start-auto [&>span]:text-xs">
        {it.due ? <Han loai={loaiHan ?? 'viec-van-hanh'} han={it.due} haiDong /> : <span className="text-slate-500">Chưa có hạn</span>}
      </span>
      <span className="col-start-2 row-span-2 row-start-1 flex justify-end sm:col-start-auto sm:row-span-1 sm:row-start-auto">
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[32px]" onClick={() => onOpen(it.href)}>{it.actionLabel}</button>
      </span>
    </div>
  );
}
const loaiHanCua = (g: string) => LOAI_HAN_CUA_VIEC[g];
