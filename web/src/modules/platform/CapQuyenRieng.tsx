import { useState } from 'react';
import { NutChon } from '../../ui/ui.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { dich, t } from '@shared/i18n/index.ts';
import { MO_TA_QUYEN, NHOM_QUYEN, PERMISSION_LABEL, duocCapRieng, lyDoCamCapRieng, type PermissionKey } from '@shared/domain/index.ts';

/** Một dòng cấp riêng: một quyền ở một phạm vi (`null` = toàn hệ thống) — đúng mô hình `user_permissions`. */
export type QuyenRieng = { permission: string; branchCode: string | null };

/** Khoá so sánh: cùng tập (quyền, phạm vi) thì coi như không đổi, bất kể thứ tự. */
export const khoaTapQuyen = (ds: readonly QuyenRieng[]) =>
  [...new Set(ds.map((x) => `${x.permission}@${x.branchCode ?? '*'}`))].sort().join('|');

/** Quyền đã tick nhưng chưa chọn phạm vi nào — không lưu được. */
export const quyenThieuPhamVi = (chon: ReadonlySet<string>, ds: readonly QuyenRieng[]) =>
  [...chon].filter((k) => !ds.some((x) => x.permission === k));

/**
 * CẤP QUYỀN RIÊNG THEO NHÓM (PR-QU QU-7). Ô tick theo `NHOM_QUYEN`, mỗi quyền một câu mô tả + ghi chú phạm vi; quyền không cấp
 * riêng được (`duocCapRieng`) thì ẩn. Quyền đã tick chọn phạm vi: "Toàn hệ thống" HOẶC một/nhiều chi nhánh (mỗi chi nhánh một dòng).
 * `chon` giữ cả quyền đã tick nhưng chưa chọn phạm vi, để người dùng thấy và sửa — không âm thầm bỏ.
 */
export function CapQuyenRieng({ value, chon, onChange, branches, macDinh, vai }: {
  value: QuyenRieng[]; chon: ReadonlySet<string>;
  /** Vai đang chọn trên form — khoá ô quyền mà MỌI vai đều cấm cấp riêng (`lyDoCamCapRieng`, cùng hàm máy chủ chặn). */
  vai: readonly string[];
  onChange: (value: QuyenRieng[], chon: ReadonlySet<string>) => void;
  branches: { code: string; name: string }[];
  /** Phạm vi gợi sẵn khi vừa tick: chi nhánh theo vai của người này; không có thì để trống cho người cấp tự chọn. */
  macDinh: string[];
}) {
  const nhom = NHOM_QUYEN.map((g) => ({
    ...g,
    quyen: (Object.keys(MO_TA_QUYEN) as PermissionKey[]).filter((k) => MO_TA_QUYEN[k].nhom === g.key && duocCapRieng(k)),
  })).filter((g) => g.quyen.length > 0);
  /* Mở sẵn các nhóm đang có quyền cấp riêng; nhóm khác gập lại cho ngắn. */
  const [mo, setMo] = useState<ReadonlySet<string>>(
    () => new Set(nhom.filter((g) => g.quyen.some((k) => chon.has(k))).map((g) => g.key)),
  );
  const doiMo = (k: string) => setMo((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const phamVi = (k: string) => value.filter((x) => x.permission === k).map((x) => x.branchCode);
  const tick = (k: string) => {
    const n = new Set(chon);
    if (n.has(k)) { n.delete(k); onChange(value.filter((x) => x.permission !== k), n); return; }
    n.add(k);
    onChange([...value, ...macDinh.map((b) => ({ permission: k, branchCode: b }))], n);
  };
  /* "Toàn hệ thống" và chi nhánh loại trừ nhau: toàn hệ thống đã phủ mọi chi nhánh, giữ cả hai chỉ làm người đọc nhầm. */
  const doiPhamVi = (k: string, b: string | null) => {
    const pv = phamVi(k);
    const khac = value.filter((x) => x.permission !== k);
    const moi = pv.includes(b) ? pv.filter((x) => x !== b) : [...(b === null ? [] : pv.filter((x) => x !== null)), b];
    onChange([...khac, ...moi.map((branchCode) => ({ permission: k, branchCode }))], chon);
  };

  return (
    <div className="space-y-2">
      {nhom.map((g) => {
        const soChon = g.quyen.filter((k) => chon.has(k)).length;
        const dangMo = mo.has(g.key);
        return (
          <section key={g.key} className="surface-2 rounded-lg">
            <button type="button" aria-expanded={dangMo} onClick={() => doiMo(g.key)}
              className="flex w-full min-h-[44px] sm:min-h-[36px] items-center gap-2 bg-transparent border-0 px-3 text-left text-sm text-slate-200">
              <span className="flex-1 font-semibold">{dich(g.ten)}</span>
              <span className="text-xs tabular-nums text-slate-500">
                {soChon ? t('{n} đã cấp', { n: soChon }) : t('{n} quyền', { n: g.quyen.length })}
              </span>
              <span className="text-slate-400"><IconGap mo={dangMo} /></span>
            </button>
            {dangMo && (
              <ul className="list-none m-0 px-3 pb-2.5 space-y-2">
                {g.quyen.map((k) => {
                  const mt = MO_TA_QUYEN[k];
                  const daChon = chon.has(k);
                  const pv = phamVi(k);
                  /* PR-SO: ô đã tick (dữ liệu cũ) vẫn bỏ tick được — chỉ khoá việc tick MỚI. */
                  const cam = daChon ? null : lyDoCamCapRieng(vai, k);
                  return (
                    <li key={k} className="border-t pt-2" style={{ borderColor: 'var(--line)' }}>
                      <label className={`flex items-start gap-2 ${cam ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} title={cam ? dich(cam) : undefined}>
                        <input type="checkbox" className="mt-1" checked={daChon} disabled={!!cam} onChange={() => tick(k)} />
                        <span className="min-w-0">
                          <span className="block text-sm text-slate-100">{dich(PERMISSION_LABEL[k] ?? k)}</span>
                          <span className="block text-xs text-slate-400">{dich(mt.moTa)}</span>
                          {mt.phamVi && <span className="block text-xs text-slate-500">{dich(mt.phamVi)}</span>}
                        </span>
                      </label>
                      {daChon && (
                        <div className="mt-1.5 ml-6 flex flex-wrap items-center gap-1" role="group" aria-label={t('Phạm vi: {ten}', { ten: PERMISSION_LABEL[k] ?? k })}>
                          <span className="text-xs text-slate-500 mr-1">{t('Phạm vi:')}</span>
                          <NutChon nho chon={pv.includes(null)} onClick={() => doiPhamVi(k, null)}
                            title={t('Người này làm được việc này ở mọi chi nhánh')}>{t('Toàn hệ thống')}</NutChon>
                          {branches.map((b) => (
                            <NutChon key={b.code} nho chon={pv.includes(b.code)} onClick={() => doiPhamVi(k, b.code)} title={b.name}>
                              {b.code}
                            </NutChon>
                          ))}
                          {pv.length === 0 && <span className="text-xs text-late">{t('Chọn ít nhất một phạm vi')}</span>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
