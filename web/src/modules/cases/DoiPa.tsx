import { useState } from 'react';
import { Truong } from '../../ui/KhungPanel.tsx';
import { NutChon } from '../../ui/ui.tsx';
import type { useLoiForm } from '../../ui/loiForm.tsx';
import { FormPa } from './FormPa.tsx';
import {
  DOI_PA_TOI_THIEU, INTERVENTION_KIND_LABEL, LOAI_PA_DOI, loiFormPa, nguoiMacDinh, paMoi, paPayload, type GiaTriPa, type LoiTruong,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

const tenLoai = (k: string) => dich(INTERVENTION_KIND_LABEL[k as keyof typeof INTERVENTION_KIND_LABEL] ?? k);

/**
 * ĐỀ XUẤT PA KHÁC (OV-13b, mockup OV-13 §8–§9) — phần form mở NGAY trong khối Cần làm (không panel mới) của Xác nhận PA và Ghi kết quả (Điều chỉnh).
 * PA mới * (loại khác PA gốc) · Nội dung / hướng dẫn * · Người dạy · Số buổi (loại có số buổi) · Lý do * (≥ 10). Gửi: `deXuatPa` / `POST …/de-xuat-doi-pa`.
 */
export function useDoiPa(gocKind: string, nhap?: { v: GiaTriPa; lyDo: string }) {
  const dau = LOAI_PA_DOI.find((k) => k !== gocKind)!;
  const [v, setV] = useState<GiaTriPa>(() => nhap?.v ?? paMoi(dau));
  const [lyDo, setLyDo] = useState(nhap?.lyDo ?? '');
  const loi: LoiTruong[] = [
    ...loiFormPa(v, { tienTo: 'doi-' }),
    ...(lyDo.trim().length < DOI_PA_TOI_THIEU
      ? [{ khoa: 'doi-ly-do', nhan: t('Lý do'), lyDo: t('Ít nhất {n} ký tự · {co}/{n}', { n: DOI_PA_TOI_THIEU, co: lyDo.trim().length }) }] : []),
  ];
  return {
    gocKind, v, lyDo, loi,
    dat: (p: Partial<GiaTriPa>) => setV((x) => ({ ...x, ...p, ...(p.kind && p.kind !== x.kind ? { nguoi: nguoiMacDinh(p.kind) } : {}) })),
    setLyDo,
    payload: () => ({ ...paPayload(v), lyDo: lyDo.trim() }),
    daSua: !!(v.description.trim() || lyDo.trim()),
  };
}

export function FormDoiPa({ d, lf, studentId, chuNgay }: {
  d: ReturnType<typeof useDoiPa>; lf: ReturnType<typeof useLoiForm>; studentId?: number | null;
  /** Dòng "Bắt đầu" — Xác nhận PA: "ngày QL duyệt"; Ghi kết quả: không có. */
  chuNgay?: string;
}) {
  const idLoai = `doi-loai-${d.gocKind}`;
  return (
    <div className="space-y-3">
      <div>
        <span id={idLoai} className="mb-1 block text-[12px] font-bold text-slate-200">{t('PA mới')}<span aria-hidden className="text-bad"> *</span></span>
        <span className="mb-1.5 block text-xs text-slate-400">{t('Thay cho {loai}', { loai: tenLoai(d.gocKind) })}</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={idLoai}>
          {LOAI_PA_DOI.filter((k) => k !== d.gocKind).map((k) => (
            <NutChon key={k} nho chon={d.v.kind === k} onClick={() => d.dat({ kind: k })} className="rounded-full px-3">{tenLoai(k)}</NutChon>
          ))}
        </div>
      </div>
      <FormPa phang tienTo="doi-" v={d.v} dat={d.dat} lf={lf} loi={d.loi} studentId={studentId}
        ngay={chuNgay ? <p className="m-0 text-[13px] text-slate-400">{t('Bắt đầu')}: <span className="text-slate-200">{chuNgay}</span></p> : undefined} />
      <Truong nhan={t('Lý do')} batBuoc loi={lf.loiCua(d.loi, 'doi-ly-do')} dem={{ co: d.lyDo.trim().length, can: DOI_PA_TOI_THIEU }}>
        <textarea className="field w-full" rows={2} maxLength={1000} {...lf.o(d.loi, 'doi-ly-do')} value={d.lyDo} onChange={(e) => d.setLyDo(e.target.value)}
          placeholder={t('Ví dụ: Em không tự học ở nhà được, cần GV kèm trên lớp.')} />
      </Truong>
    </div>
  );
}
