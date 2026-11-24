import { useMemo, useState } from 'react';
import { INTERVENTION_KIND_LABEL, caseTopicLabel, duongHoSoHocVien, kyGhiKetQua, type InterventionKind, type PaDangChay } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';
import { useNhapPaMoi, type NhapPaMoi } from '../../lib/nhapPa.ts';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { DaiNhom, HanA, xepTin } from './DanhSachViec.tsx';

/**
 * TU2-4 (TU8, TU9, TU17 — mockup Ⓣ1 D1–D5): khối "PA đang chạy" dưới nhóm "Kết quả PA" ở Công việc của GV — MỌI PA người xem giữ việc Kết quả, đang chạy,
 * CHƯA tới hạn (máy chủ `paDangChay` của `/my-work`, đã nạp — 0 request thêm). KHÔNG phải việc: không vào "n việc", badge tab / menu, chuông.
 * Gom theo lớp: lớp ≥ 2 PA = dòng lớp "MB FT 101 · n em · Kỳ …" (bấm = lưới Ghi kết quả PA, như nhóm Kết quả PA); lớp 1 PA = "Lớp · tên em · lượt · kỹ năng · loại PA".
 * CÙNG BỐN Ô khuôn A với mọi dòng việc (Lớp · HV / n em · Thông tin · Hạn), cùng lưới cột `.cvA` (slot `cuoi` của `DanhSachViec`); chữ dài xuống dòng, không "…".
 * Bấm dòng = form Ghi kết quả PA (Lưu nháp cạnh Lưu). Có nháp: "nháp 2 / 6 · 12/09" cuối ô thông tin, đổi ngay tại chỗ (`nhapPa.ts`).
 * ponytail: dòng việc giả (`viecTuPa`) dựng từ `paDangChay` để dùng lại panel Case / lưới có sẵn — thêm trường vào `PaDangChay` nếu panel cần nhiều hơn.
 */
type Nhom = { khoa: string; classId: number | null; lop: string | null; ds: PaDangChay[] };

/** Việc "Ghi kết quả PA" dựng từ một PA chưa tới hạn (cùng khoá `action:{id}` với việc thật khi PA tới hạn). */
export const viecTuPa = (x: PaDangChay, uid: number | null): WorkItem => ({
  key: `action:${x.paId}`, group: 'ghi_ket_qua_pa', urgency: 'normal', studentId: x.studentId, studentName: x.studentName,
  classId: x.classId, classCode: x.classCode, attemptId: null, attemptNo: null, caseId: x.caseId, level: null,
  reason: x.tenPa, actionLabel: t('Ghi kết quả PA'), href: duongHoSoHocVien(x.studentId, { caseId: x.caseId, paId: x.paId, viec: 'ghi-ket-qua' }),
  tieuDe: t('Ghi kết quả PA'), ownerId: uid, owner: null, mine: true, due: x.han, statusLabel: t('Chờ kết quả'), contextLabel: x.dot, count: null, paId: x.paId,
  ghiNhanh: false,   // lưới tự quyết từ PA (`ghiNhanhDuoc` + PA Tutor), không từ cờ này
});
/** Dòng gộp cả lớp (≥ 2 PA) → lưới Ghi kết quả PA; khoá riêng (`pdc-lop:`) để không trùng dòng gộp thật của máy chủ. */
export const viecTuLop = (g: Nhom, uid: number | null): WorkItem => ({
  ...viecTuPa(g.ds[0], uid), key: `pdc-lop:${g.classId}`, paId: null, studentId: null, studentName: `${t('Lớp')} ${g.lop ?? ''}`, tieuDe: t('Ghi kết quả PA'),
  due: g.ds.map((x) => x.han).sort()[0],
  con: g.ds.map((x) => ({ ...viecTuPa(x, uid), conTen: x.studentName, conPhu: '' })),
});

/** Dựng lại việc từ khoá trên địa chỉ (F5 / link) — `action:{paId}` hoặc `pdc-lop:{lớp}`; không có trong `paDangChay` → null. */
export function viecPdcTheoKhoa(ds: readonly PaDangChay[], khoa: string, uid: number | null): WorkItem | null {
  if (khoa.startsWith('action:')) { const x = ds.find((y) => `action:${y.paId}` === khoa); return x ? viecTuPa(x, uid) : null; }
  if (!khoa.startsWith('pdc-lop:')) return null;
  const g = gomTheoLop(ds).find((y) => `pdc-lop:${y.classId}` === khoa && y.ds.length > 1);
  return g ? viecTuLop(g, uid) : null;
}

const KHOA_GAP = (uid: number | null) => `pisa.pa-dang-chay.gap.u${uid ?? ''}`;
const docGap = (uid: number | null): boolean | null => { try { const v = localStorage.getItem(KHOA_GAP(uid)); return v === null ? null : v === '1'; } catch { return null; } };
const nhoGap = (uid: number | null, gap: boolean) => { try { localStorage.setItem(KHOA_GAP(uid), gap ? '1' : '0'); } catch { /* không lưu được: lần sau về mặc định */ } };
const NGUONG_GAP = 10;

const gomTheoLop = (ds: readonly PaDangChay[]): Nhom[] => {
  const m = new Map<string, Nhom>();
  for (const x of ds) {
    const k = x.classId != null ? `l${x.classId}` : `p${x.paId}`;   // PA không gắn lớp: một nhóm riêng
    const g = m.get(k);
    if (g) g.ds.push(x); else m.set(k, { khoa: k, classId: x.classId, lop: x.classCode, ds: [x] });
  }
  return [...m.values()].sort((a, b) => a.ds[0].han.localeCompare(b.ds[0].han) || (a.lop ?? '').localeCompare(b.lop ?? '') || a.ds[0].paId - b.ds[0].paId);
};

/** Chữ nháp ("nháp 2 / 6 · 12/09") — cuối ô thông tin; không nháp → rỗng (bấm dòng đã mở đúng form Ghi kết quả). */
const chuNhap = (nhap: NhapPaMoi, ngan: (d: string) => string) => {
  if (!nhap) return '';
  const d = new Date(nhap.luc);
  const ngay = Number.isNaN(d.getTime()) ? '' : ngan(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  const buoi = nhap.soBuoi != null ? `${nhap.soBuoi}${nhap.buoiDuKien != null ? ` / ${nhap.buoiDuKien}` : ''}` : '';
  return [t('nháp'), buoi && ` ${buoi}`, ngay && ` · ${ngay}`].filter(Boolean).join('');
};

/** A1-05: tên PA ngắn = loại PA ("Bổ trợ"), mô tả dài của PA nằm ở panel. */
const tenLoai = (x: PaDangChay) => dich(INTERVENTION_KIND_LABEL[x.kind as InterventionKind] ?? x.kind);
/** Thông tin một PA: lượt MT · kỹ năng · loại PA (thứ tự như dòng Case: lượt đứng đầu). */
const tinPa = (x: PaDangChay) => xepTin([x.dot ?? '', x.topic ? dich(caseTopicLabel(x.topic)) : '', tenLoai(x)], false, null).join(' · ');

/** MỘT dòng khuôn A của khối: ô lớp · ô ai · ô thông tin · hạn (`HanA`). */
function Dong({ khoa, lop, ai, tin, it, chon, onBam }: { khoa: string; lop: string | null; ai: string; tin: string; it: WorkItem; chon: boolean; onBam: () => void }) {
  return (
    <div data-hd="cv-dong" data-khoa={khoa} onClick={onBam} className={`cvA-v ${chon ? 'dang-chon' : ''}`}>
      <span className="cvA-lop">{lop}</span>
      <span className="cvA-ai">
        <button type="button" className="cvA-ten" aria-current={chon ? 'true' : undefined} onClick={(e) => { e.stopPropagation(); onBam(); }}>{ai}</button>
      </span>
      <span className="cvA-ct" title={tin}>{tin}</span>
      <HanA it={it} daXong={false} />
    </div>
  );
}

export function PaDangChayKhoi({ ds, uid, onMo, chon }: { ds: readonly PaDangChay[]; uid: number | null; onMo: (it: WorkItem) => void; chon: string | null }) {
  const [gap, setGap] = useState<boolean>(() => docGap(uid) ?? ds.length > NGUONG_GAP);
  const nhapMoi = useNhapPaMoi(ds);
  const { homNay, ngan } = useNgayNghiepVu();
  const nhom = useMemo(() => gomTheoLop(ds), [ds]);
  if (!ds.length) return null;   // không PA → không vẽ khối
  const nhapCua = (x: PaDangChay): NhapPaMoi => (nhapMoi.has(x.paId) ? nhapMoi.get(x.paId)! : x.nhap);
  const doiGap = () => { setGap((g) => { nhoGap(uid, !g); return !g; }); };
  return (
    <section data-muc="pa-dang-chay" className="card cvA-sub overflow-clip p-0" aria-label={t('PA đang chạy')}>
      <DaiNhom k="pa-chay" nhan={t('PA đang chạy')} chip={t('{n} PA', { n: ds.length })} mo={!gap} onMo={doiGap} trungTinh chevPhai
        luat={<NutLuat label={t('Giải thích PA đang chạy')}>{t('PA bạn đang giữ, chưa tới hạn ghi kết quả. Tới hạn − 2 ngày PA chuyển lên nhóm Kết quả PA. Không tính vào số việc.')}</NutLuat>} />
      {!gap && (
        <ul className="cvA-sub">
          {nhom.map((g) => {
            const nhieu = g.ds.length > 1;
            const x0 = g.ds[0];
            const han = g.ds.map((x) => x.han).sort()[0];
            const ky = homNay ? kyGhiKetQua(han, homNay) : null;
            const key = nhieu ? `pdc-lop:${g.classId}` : `action:${x0.paId}`;
            const it = nhieu ? viecTuLop(g, uid) : viecTuPa(x0, uid);
            const tin = nhieu ? (ky ? t('Kỳ {ky}', { ky }) : '') : [tinPa(x0), chuNhap(nhapCua(x0), ngan)].filter(Boolean).join(' · ');
            const soEm = new Set(g.ds.map((x) => x.studentId)).size;
            return (
              <li key={g.khoa} className="cvA-sub">
                <Dong khoa={key} lop={g.lop} ai={nhieu ? t('{n} em', { n: soEm }) : x0.studentName} tin={tin} it={it} chon={chon === key} onBam={() => onMo(it)} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
