import type { HTMLAttributes } from 'react';
import { NutChon } from '../../ui/ui.tsx';
import { ROLES, ROLE_LABEL, roleLabel, type Role } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

/** Một vai + các chi nhánh của vai đó (rỗng = toàn hệ thống với Quản trị, CX, Head tutor). */
export type CapVai = { role: string; branches: Set<string> };
type Branch = { code: string; name: string };

/** Vai luôn / được phép toàn hệ thống — không bắt chọn chi nhánh (máy chủ cùng luật, `chuanVai`). */
const KHONG_CAN_CN = new Set(['system_admin', 'cx', 'head_tutor']);

export function capTuTaiKhoan(roles: { role: string; branchCode: string | null }[]): CapVai[] {
  const m = new Map<string, Set<string>>();
  for (const g of roles) {
    if (!m.has(g.role)) m.set(g.role, new Set());
    if (g.branchCode) m.get(g.role)!.add(g.branchCode);
  }
  return [...m.entries()].map(([role, branches]) => ({ role, branches }));
}
export const payloadVai = (ds: CapVai[]) => ds.filter((g) => g.role).map((g) => ({ role: g.role, branches: [...g.branches] }));
/** Khoá so sánh — chỉ gửi máy chủ khi vai thật sự đổi (OV-11b QT-3: không "đặt lại vai" giả). */
export const khoaVai = (ds: CapVai[]) => ds.map((g) => `${g.role}:${[...g.branches].sort().join(',')}`).sort().join('|');
/** OV-11b (QT-1): vai cần chi nhánh mà chưa chọn — báo sớm tại hàng (máy chủ cũng chặn 400). */
export const loiThieuChiNhanh = (ds: CapVai[]) => ds.flatMap((g, i) => (g.role && !KHONG_CAN_CN.has(g.role) && g.branches.size === 0
  ? [{ i, lyDo: t('Chọn chi nhánh cho vai {vai}', { vai: roleLabel(g.role) }) }] : []));

/**
 * BỘ SỬA VAI TRÒ · CHI NHÁNH — dùng chung cho panel Sửa tài khoản và hộp đổi vai tại dòng (QTV2-TK): mỗi vai một hàng (ô chọn vai + nút chi nhánh
 * bật / tắt + Gỡ). `qtCuaMinh`: hàng Quản trị của chính mình khoá ô vai + Gỡ (OV-11b QT-2, máy chủ cũng chặn).
 */
export function SuaVaiChiNhanh({ value, onChange, branches, qtCuaMinh, loiHang, propsHang }: {
  value: CapVai[]; onChange: (v: CapVai[]) => void; branches: Branch[]; qtCuaMinh: boolean;
  loiHang?: (i: number) => string | null | undefined;
  /** Gắn `id` / `aria-*` của `useLoiForm` vào hàng (focus ô lỗi khi bấm Lưu). */
  propsHang?: (i: number) => HTMLAttributes<HTMLDivElement>;
}) {
  const sua = (i: number, f: (g: CapVai) => CapVai) => onChange(value.map((g, j) => (j === i ? f(g) : g)));
  return (
    <div className="space-y-2">
      {value.map((g, i) => {
        const khoaQt = qtCuaMinh && g.role === 'system_admin';
        const loi = loiHang?.(i);
        return (
          <div key={i} className="surface-2 rounded-lg p-2.5">
            <div className="flex flex-wrap items-center gap-2" {...propsHang?.(i)} tabIndex={-1}>
              <select className="field w-44 max-sm:min-h-[44px]" aria-label={t('Vai trò')} value={g.role} disabled={khoaQt}
                onChange={(e) => sua(i, (x) => ({ ...x, role: e.target.value }))}>
                {ROLES.map((r) => <option key={r} value={r}>{dich(ROLE_LABEL[r as Role])}</option>)}
              </select>
              {/* TU-a: Head tutor như Quản trị — luôn toàn hệ thống. */}
              {g.role === 'system_admin' || g.role === 'head_tutor' ? (
                <span className="text-xs text-slate-400">{t('Toàn hệ thống — không gắn chi nhánh')}</span>
              ) : (<>
                {/* PR-OV2a: CX mặc định toàn hệ thống (không chọn chi nhánh nào); chọn chi nhánh thì theo chi nhánh như vai khác. */}
                {g.role === 'cx' && (
                  <NutChon nho chon={g.branches.size === 0} onClick={() => sua(i, (x) => ({ ...x, branches: new Set<string>() }))}>
                    {t('Toàn hệ thống')}
                  </NutChon>
                )}
                {branches.map((b) => (
                  <NutChon key={b.code} nho chon={g.branches.has(b.code)} title={b.name}
                    onClick={() => sua(i, (x) => {
                      const next = new Set(x.branches);
                      if (next.has(b.code)) next.delete(b.code); else next.add(b.code);
                      return { ...x, branches: next };
                    })}>
                    {b.code}
                  </NutChon>
                ))}
              </>)}
              <button className="btn btn-sm btn-ghost ml-auto max-sm:min-h-[44px]" type="button" disabled={khoaQt}
                onClick={() => onChange(value.filter((_, j) => j !== i))}>{t('Gỡ')}</button>
            </div>
            {khoaQt && <p className="m-0 mt-1.5 text-xs text-slate-400">{t('Không tự gỡ vai Quản trị của mình')}</p>}
            {loi && <p className="m-0 mt-1.5 text-xs text-late">{loi}</p>}
          </div>
        );
      })}
    </div>
  );
}
