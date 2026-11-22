import { Link } from 'react-router-dom';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { Bang } from '../../ui/Bang.tsx';
import { ChipHan, ChipKy, DauQuaHan, LOP_MUC_HAN } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { CASE_CATEGORY_SHORT, gomEmThieu, laViecChamCheo, mucHan, ngay, type DinhNghiaCot } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

const COT: DinhNghiaCot[] = [
  { key: 'hv', nhan: t('Học viên'), kieu: 'ten' }, { key: 'thieu', nhan: t('Còn thiếu'), kieu: 'chu' },
  { key: 'ai', nhan: t('Người phụ trách'), kieu: 'chu' }, { key: 'han', nhan: t('Hạn'), kieu: 'tuan', rong: 124 },
];
const kyHieu = (kn: string) => (CASE_CATEGORY_SHORT as Record<string, string>)[kn] ?? kn;

/**
 * NHẸ HƠN PR-2a · PANEL LỚP ADMIN (mockup v23 ④ A1, chủ SP 22/11 vòng 2–3): bấm dòng Nhập điểm → bảng từng em · còn thiếu · người phụ trách · hạn.
 * Gom MỌI dòng Nhập điểm cùng lớp + cùng tuần (khác người phụ trách = khác dòng máy chủ). Mỗi cặp "kỹ năng ↔ người" một dòng; S Mock = "GV Speaking".
 * Bảng chỉ tô màu ngày (luật hạn — "quá hạn n ngày" chỉ ở danh sách / đầu panel). "Nhập điểm ›" mở lưới cũ (giữ thao tác). Dữ liệu đã nạp, +0 request.
 */
export function PanelLopAdmin({ it, dong, onDong, onLuoi }: { it: WorkItem; dong: readonly WorkItem[]; onDong: () => void; onLuoi: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const cung = dong.filter((x) => x.group === 'score' && x.classId === it.classId && (x.tuanThi ?? x.luot) === (it.tuanThi ?? it.luot));
  const em = gomEmThieu(cung.map((x) => ({ ...x, chamCheo: laViecChamCheo(x) })));
  const soBai = cung.reduce((n, x) => n + (x.soBai ?? 0), 0);
  return (
    <KhungPanel rong="viec" tieuDe={t('Điểm chưa nhập · {ngu}', { ngu: dich(it.contextLabel ?? '') })} onDong={onDong}
      phu={<>{it.classId ? <Link to={`/hoc-vien/lop/${it.classId}`}>{it.classCode}</Link> : it.classCode} · {t('{n} bài · {m} em', { n: soBai, m: em.length })}
        {it.due && <> · <ChipHan loai="nhap-diem" han={it.due} /></>}</>}
      chan={{ huy: { onClick: onDong }, chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-[36px]" onClick={onLuoi}>{t('Nhập điểm ›')}</button> }}>
      <Bang ten={t('Học viên còn thiếu điểm')} cot={COT} hang={em} khoa={(e) => e.id} the375={false} khung={false} oCua={(e, c) => (
        c.key === 'hv' ? <Link className="ten-hv" to={`/hoc-vien/${e.id}`}>{e.ten}</Link>
          : c.key === 'thieu' ? <span className="grid gap-1">{e.cap.map((x) => <span key={x.nguoi ?? ''} className="flex flex-wrap gap-1">{x.kns.map((k) => <ChipKy key={k} k={kyHieu(k)} />)}</span>)}</span>
            : c.key === 'ai' ? <span className="grid gap-1">{e.cap.map((x) => <span key={x.nguoi ?? ''} className="min-h-5 text-[13px] leading-5 text-dim">{x.nguoi ?? '—'}</span>)}</span>
              : e.due ? <MucNgay han={e.due} homNay={homNay} /> : '—')} />
    </KhungPanel>
  );
}

/** Ngày hạn trong bảng: chỉ tô màu (luật hạn); quá hạn thêm dấu ⚠ (không chỉ bằng màu — cùng `DauQuaHan` của PR-1). */
function MucNgay({ han, homNay }: { han: string; homNay: string }) {
  const muc = mucHan(han.slice(0, 10), homNay);
  return <span className={`inline-flex items-center ${LOP_MUC_HAN[muc]}`}>{muc === 'qua' && <DauQuaHan />}{ngay(han)}</span>;
}
