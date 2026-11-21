import { useMemo, useState } from 'react';
import { lazyHop } from '../../ui/lazyHop.tsx';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { DemViecPanel } from '../../ui/KhungPanel.tsx';
import { PanelViec } from '../congViec/PanelViecLuoi.tsx';
import { NutChipViec, chipViecLop } from '../congViec/LopCuaToi.tsx';
import type { WorkItem } from '../worklist/WorkList.tsx';
import { NHAN_LOAI_VIEC, laViecChamCheo, tabCuaViec, viecLopTuDong } from '@shared/domain/index.ts';
import { useSession } from '../../lib/session.tsx';
import { moCaDong } from '../congViec/lamTaiCho.ts';
import { t } from '@shared/i18n/index.ts';
/* TD-NGUOI-2: hộp mở bằng thao tác — mảnh riêng, tải khi mở (`ui/lazyHop.tsx`). */
const PanelNhapDiemLop = lazyHop(() => import('../cham/PanelNhapDiemLop.tsx').then((x) => x.PanelNhapDiemLop));

/** `GET /classes/:id/viec-theo-em` (SV-LOP + UI-HO-SO-LOP): việc theo em (cột Case + PA đọc lại) + `cuaToi` = việc của người xem ở lớp.
 * P1 G2-03: `dongToi` = DÒNG hiển thị của `cuaToi` như Công việc (dòng gộp "Cả lớp" = 1, không kèm `con`) — dải vẽ ô + đếm từ đây, cùng số `demDongViec`.
 * LOP-1-LOP: `soQuaHanLop` = badge "n việc quá hạn" đầu hồ sơ lớp (cùng lần `myWork`, cùng `demDongViec` — S11 đếm dòng); `null` = vai không có badge (TVV / CX / Admin). */
export type ViecLop = { theoEm: Record<number, WorkItem[]>; cuaToi: WorkItem[]; dongToi: WorkItem[]; soQuaHanLop: number | null; /** B2-08: ô "Chờ chấm · n việc" (QL). */ soChoChamLop?: number | null };
export const duongViecLop = (classId: number) => `/classes/${classId}/viec-theo-em?chi=toi`;

/** Tài khoản CHỈ là GV (GV / Head tutor, không kiêm QL, Quản trị, Admin, TVV, CX) — máy chủ đi nhánh "việc của mình" (`viecTheoEmCuaLop`). */
const VAI_KHAC_GV = new Set(['manager', 'system_admin', 'office_admin', 'consultant', 'cx']);
export const laGvThuan = (roles: readonly string[] | null | undefined) =>
  !!roles?.some((r) => r === 'teacher' || r === 'head_tutor') && !roles.some((r) => VAI_KHAC_GV.has(r));

/**
 * AUDIT-1611 gói 13 (Turso, báo cáo mục 8): việc của tôi ở hồ sơ lớp. GV thuần dựng từ `/my-work` mà badge menu ĐÃ NẠP (`chiNghe`: nhận bản của App, không gọi
 * thêm; `viecLopTuDong` — cùng tập máy chủ, phép kiểm L4) → bớt `viec-theo-em` (~35–39 câu / ~550–700 dòng mỗi lần mở hồ sơ lớp). Vai khác giữ đường máy chủ
 * (QL / Quản trị xem việc mọi người; badge "Quá hạn của lớp"). Cùng một hook cho đầu trang, dải Việc cần làm, bảng HV, badge tab.
 */
export function useViecLop(classId: number | null, bat = true): { data: ViecLop | null; reload: () => void } {
  const { session } = useSession();
  const gv = laGvThuan(session?.roles) && !!session?.nav?.workSupport;
  const w = useApi<{ dong?: WorkItem[] }>(bat && gv && classId ? '/my-work' : null, [], { chiNghe: true, dungBanLuu: true });
  const s = useApi<ViecLop>(bat && !gv && classId ? duongViecLop(classId) : null, [classId]);
  const dong = w.data?.dong;
  const tuDong = useMemo(() => (gv && classId && dong ? { theoEm: {}, ...viecLopTuDong(dong, classId, (g) => NHAN_LOAI_VIEC[g] ?? g), soQuaHanLop: null } : null),
    [gv, classId, dong]);
  return gv ? { data: tuDong, reload: w.reload } : { data: s.data, reload: s.reload };
}

/**
 * DẢI "VIỆC CẦN LÀM" ĐẦU HỒ SƠ LỚP (GD-6, mockup v21 ② K1 ④ / K2, R2.3 — thay "Việc của tôi" 3 ô): nút-chip theo LOẠI (`chipViecLop`, cùng chip "Lớp của tôi"):
 * Nhập điểm · Case · Ý thức · Vận hành, không biểu tượng, đỏ khi có việc quá hạn (V22 chỉ màu). Bấm chip mở THẲNG panel việc đầu (quá hạn trước) tại trang —
 * đầu panel "i / n", chân "Việc tiếp ›" đi hết việc cùng loại ở lớp ([XM-1]); chip Nhập điểm mở panel nhập điểm của lớp (K2a). Bỏ lối tắt sang trang Công việc (R2.3).
 * Dữ liệu: `viec-theo-em?chi=toi` đã tải ([XM-11]) — không request thêm. Không có việc → không vẽ dải.
 */
export function ThanhViecLop({ classId, classCode, onDoi }: { classId: number; classCode: string; onDoi: () => void }) {
  const { data, reload } = useViecLop(classId);
  /* `ds` chụp lúc bấm chip: việc vừa xong rời danh sách vẫn đếm đúng "i / n" và tìm được việc kế (R1-LUU-TIEP). */
  const [mo, setMo] = useState<{ ds: WorkItem[]; i: number; nhan: string } | null>(null);
  const [nhapDiem, setNhapDiem] = useState(false);
  /* AUDIT-1611 P1-01: chip đếm trên DÒNG (`dongToi`, giữ `con`) như "Lớp của tôi" — cùng số ở Công việc, hồ sơ lớp, HV & Lớp. */
  /* AUDIT-2111 B2-03: chip Nhập điểm đếm BÀI (15/11) — rê chuột ghi thêm số VIỆC (cùng đơn vị "n việc" của dải) để cộng các chip không lệch đầu dải. */
  const viecNd = (data?.dongToi ?? []).filter((x) => !laViecChamCheo(x) && tabCuaViec(x) === 'cham-diem').length;
  const chip = chipViecLop(data?.dongToi ?? [], classId, moCaDong)
    .map((c) => (c.tab === 'cham-diem' ? { ...c, doc: t('{b} bài · {v} việc', { b: c.so, v: viecNd }) } : c));
  const daLam = () => { invalidate('/my-work'); reload(); onDoi(); };
  const conKhoa = new Set((data?.cuaToi ?? []).map((x) => x.key));
  const keTiep = mo ? mo.ds.findIndex((x, k) => k > mo.i && conKhoa.has(x.key)) : -1;
  const viecMo = mo?.ds[mo.i];
  /* Cùng phạm vi với chip: bỏ việc Chấm Speaking chéo (chỉ ở tab của nó — lời 20). */
  const dong = (data?.dongToi ?? data?.cuaToi ?? []).filter((x) => !laViecChamCheo(x));
  const quaHan = dong.filter((x) => x.urgency === 'overdue').length;
  return (
    <>
      {chip.length > 0 && (
        <section aria-label={t('Việc cần làm')} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-0.5">
          {/* Mockup ② K1: "Việc cần làm · n việc · m quá hạn" — n = DÒNG như Công việc (`dongToi`); quá hạn chỉ màu (V22, mockup vẽ ⚠ → KHÁC theo V22). */}
          <span className="whitespace-nowrap pr-1 text-[13px] font-medium text-slate-400 max-sm:basis-full">
            {t('Việc cần làm')} · <b className="tabular-nums text-slate-100">{t('{n} việc', { n: dong.length })}</b>
            {quaHan > 0 && <> · <b className="tabular-nums text-late">{t('{n} quá hạn', { n: quaHan })}</b></>}
          </span>
          {chip.map((c) => (
            <NutChipViec key={c.tab} c={c}
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
