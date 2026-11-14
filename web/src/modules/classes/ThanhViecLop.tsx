import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { DemViecPanel } from '../../ui/KhungPanel.tsx';
import { PanelViec } from '../congViec/PanelViecLuoi.tsx';
import { NutChipViec, chipViecLop } from '../congViec/LopCuaToi.tsx';
import { PanelNhapDiemLop } from '../cham/PanelNhapDiemLop.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { t } from '@shared/i18n/index.ts';

/** `GET /classes/:id/viec-theo-em` (SV-LOP + UI-HO-SO-LOP): việc theo em (cột Case + PA đọc lại) + `cuaToi` = việc của người xem ở lớp.
 * P1 G2-03: `dongToi` = DÒNG hiển thị của `cuaToi` như Công việc (dòng gộp "Cả lớp" = 1, không kèm `con`) — dải vẽ ô + đếm từ đây, cùng số `demDongViec`.
 * LOP-1-LOP: `soQuaHanLop` = badge "n việc quá hạn" đầu hồ sơ lớp (cùng lần `myWork`, cùng `demDongViec` — S11 đếm dòng); `null` = vai không có badge (TVV / CX / Admin). */
export type ViecLop = { theoEm: Record<number, WorkItem[]>; cuaToi: WorkItem[]; dongToi: WorkItem[]; soQuaHanLop: number | null };
export const duongViecLop = (classId: number) => `/classes/${classId}/viec-theo-em?chi=toi`;

/**
 * DẢI "VIỆC CẦN LÀM" ĐẦU HỒ SƠ LỚP (GD-6, mockup v21 ② K1 ④ / K2, R2.3 — thay "Việc của tôi" 3 ô): nút-chip theo LOẠI (`chipViecLop`, cùng chip "Lớp của tôi"):
 * Nhập điểm · Case · Ý thức · Vận hành, không biểu tượng, đỏ khi có việc quá hạn (V22 chỉ màu). Bấm chip mở THẲNG panel việc đầu (quá hạn trước) tại trang —
 * đầu panel "i / n", chân "Việc tiếp ›" đi hết việc cùng loại ở lớp ([XM-1]); chip Nhập điểm mở panel nhập điểm của lớp (K2a). Bỏ "+n việc ở Công việc ›".
 * Dữ liệu: `viec-theo-em?chi=toi` đã tải ([XM-11]) — không request thêm. Không có việc → không vẽ dải.
 */
export function ThanhViecLop({ classId, classCode, onDoi }: { classId: number; classCode: string; onDoi: () => void }) {
  const { data, reload } = useApi<ViecLop>(duongViecLop(classId), [classId]);
  /* `ds` chụp lúc bấm chip: việc vừa xong rời danh sách vẫn đếm đúng "i / n" và tìm được việc kế (R1-LUU-TIEP). */
  const [mo, setMo] = useState<{ ds: WorkItem[]; i: number; nhan: string } | null>(null);
  const [nhapDiem, setNhapDiem] = useState(false);
  const chip = chipViecLop(data?.cuaToi ?? [], classId);
  const daLam = () => { invalidate('/my-work'); reload(); onDoi(); };
  const conKhoa = new Set((data?.cuaToi ?? []).flatMap((x) => (x.con?.length ? x.con : [x])).map((x) => x.key));
  const keTiep = mo ? mo.ds.findIndex((x, k) => k > mo.i && conKhoa.has(x.key)) : -1;
  const viecMo = mo?.ds[mo.i];
  return (
    <>
      {chip.length > 0 && (
        <section aria-label={t('Việc cần làm')} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-0.5 max-sm:grid max-sm:grid-cols-2">
          <span className="whitespace-nowrap pr-1 text-[13px] font-medium text-slate-400 max-sm:col-span-2">{t('Việc cần làm')}</span>
          {chip.map((c) => (
            <NutChipViec key={c.tab} c={c} doiTrang={false}
              onBam={() => (c.tab === 'cham-diem' ? setNhapDiem(true) : setMo({ ds: c.ds, i: 0, nhan: t('Việc {loai} của bạn ở lớp này', { loai: c.nhan }) }))} />
          ))}
        </section>
      )}
      {mo && viecMo && (
        <DemViecPanel.Provider value={{ i: mo.i + 1, n: mo.ds.length, nhan: mo.nhan }}>
          <PanelViec key={viecMo.key} it={viecMo} onDong={() => setMo(null)} onDaLam={daLam}
            onTiep={keTiep >= 0 ? () => setMo({ ...mo, i: keTiep }) : null}
            tenTiep={keTiep >= 0 && mo.ds[keTiep].studentId !== null ? mo.ds[keTiep].studentName : null} />
        </DemViecPanel.Provider>
      )}
      {nhapDiem && <PanelNhapDiemLop classId={classId} classCode={classCode} onDong={() => { setNhapDiem(false); daLam(); }} />}
    </>
  );
}
