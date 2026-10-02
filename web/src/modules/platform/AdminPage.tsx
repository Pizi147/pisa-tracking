import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Info, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { api } from '../../lib/api.ts';
import { AccountsAdmin } from './AccountsAdmin.tsx';
import { CatalogAdmin } from './CatalogAdmin.tsx';
import { fmtDateTime, roleLabel } from '../../lib/format.ts';
import { nhanHanhDongNhatKy } from '@shared/domain/index.ts';

type AdminData = {
  roles: { id: number; key: string; name: string }[];
  permissions: { id: number; key: string; name: string }[];
  matrix: Record<string, string[]>;
  users: { id: number; code: string; fullName: string; title: string | null; grants: { role: string; roleName: string; scope: string }[]; assignments: number }[];
  branches: { id: number; code: string; name: string }[];
  units: { id: number; code: string; name: string; kind: string; branchId: number | null }[];
  counts: { students: number; classes: number; attempts: number; cases: number };
  audit: { id: number; action: string; entityType: string; entityLabel: string | null; createdAt: string; actorName: string | null }[];
};

/**
 * QUẢN TRỊ HỆ THỐNG — ba việc khác hẳn nhau, nên ba tab thay vì một trang dài.
 *
 *   TÀI KHOẢN  duyệt đăng ký, tạo tài khoản, cấp vai và quyền riêng (mục 7.1, 7.3).
 *   DANH MỤC   lộ trình và chương trình — sửa tên, số tuần, mốc; không thêm mã mới (K1-48).
 *   CẤU HÌNH   bảng quyền theo vai, đơn vị báo cáo, nhật ký thay đổi.
 *
 * Đây là quản trị PHẦN MỀM — khác với Admin chi nhánh là nhân sự văn phòng.
 */
const TABS = [
  { key: 'accounts', label: 'Tài khoản' },
  { key: 'catalog', label: 'Lộ trình & chương trình' },
  { key: 'config', label: 'Quyền & nhật ký' },
] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('accounts');
  const { data, loading, error, reload } = useApi<AdminData>(tab === 'config' ? '/admin/overview' : null, [tab]);

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Quản trị hệ thống</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tài khoản, danh mục và cấu hình quyền của phần mềm.
        </p>
      </div>

      <HangTab ariaLabel="Quản trị hệ thống" value={tab} onChange={setTab}
        tabs={TABS.map((t) => ({ key: t.key, label: t.label }))} />

      {tab === 'accounts' && <AccountsAdmin />}
      {tab === 'catalog' && <CatalogAdmin />}
      {tab === 'config' && error && <ErrorState message={error.message} hint={error.hint} onRetry={reload} />}
      {tab === 'config' && (loading || !data) && !error && <Skeleton rows={8} />}
      {tab === 'config' && data && <ConfigTab data={data} onDone={reload} />}
    </div>
  );
}

function ConfigTab({ data, onDone }: { data: AdminData; onDone: () => void }) {
  const toast = useToast();
  /* UX-C7 (Q23): chế độ Sửa — ô bấm được, đổi tạm; Lưu gửi chỉ các ô đã đổi trong MỘT lần (một giao dịch, mỗi ô một dòng nhật ký). */
  const [dangSua, setDangSua] = useState(false);
  const [doi, setDoi] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const khoa = (r: string, p: string) => `${r}|${p}`;
  const coSan = (r: string, p: string) => !!data.matrix[r]?.includes(p);
  const bam = (r: string, p: string) => setDoi((s) => { const n = new Set(s); if (n.has(khoa(r, p))) n.delete(khoa(r, p)); else n.add(khoa(r, p)); return n; });
  const huy = () => { setDoi(new Set()); setDangSua(false); };
  const luu = async () => {
    if (!doi.size || busy) return;
    setBusy(true);
    try {
      const thayDoi = [...doi].map((k) => { const [roleKey, permissionKey] = k.split('|'); return { roleKey, permissionKey, granted: !coSan(roleKey, permissionKey) }; });
      await api.put('/admin/role-permissions', { thayDoi });
      toast.push('ok', `Đã lưu ${thayDoi.length} thay đổi quyền`);
      setDoi(new Set()); setDangSua(false); onDone();
    } catch (e: any) { toast.push('error', e?.message ?? 'Không lưu được'); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Học viên', data.counts.students], ['Lớp', data.counts.classes],
          ['Lượt Mock', data.counts.attempts], ['Case SOS', data.counts.cases],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{value}</div>
          </div>
        ))}
      </div>

      <Card title="Quyền theo vai trò" bodyClass="p-0"
        action={!dangSua && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setDangSua(true)}>Sửa quyền</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th className="sticky-col" hint="Mỗi dòng là một việc cụ thể. Dấu tích nghĩa là vai đó được làm việc này.">Quyền</Th>
                {data.roles.map((r) => (
                  <Th key={r.key} align="center"
                    hint={`Bấm "Sửa quyền", rồi bấm một ô trong cột này để bật hoặc tắt quyền đó cho vai trò ${r.name}.`}>
                    {r.name}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.permissions.map((p) => (
                <tr key={p.key} className="row-hover">
                  <td className="td sticky-col text-slate-200">{p.name} <span className="text-[11px] text-slate-500">{p.key}</span></td>
                  {data.roles.map((r) => (
                    <td key={r.key} className="td text-center p-0">
                      <PermCell roleName={r.name} perm={p} granted={coSan(r.key, p.key)} doi={doi.has(khoa(r.key, p.key))}
                        dangSua={dangSua && !busy} onBam={() => bam(r.key, p.key)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {dangSua && (
          <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t px-4 py-2.5" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <span className="text-xs tabular-nums text-slate-400" role="status">{doi.size ? `${doi.size} thay đổi` : 'Chưa đổi ô nào'}</span>
            <span className="flex-1" />
            <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={huy}>Huỷ thay đổi</button>
            <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !doi.size} onClick={luu}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
          </div>
        )}
        <div className="p-3">
          <SectionNote>
            Quyền = quyền của vai trò × phạm vi chi nhánh của CHÍNH grant đó × phân công lớp/kỹ năng.
            Không vai trò nào mặc định thấy toàn hệ thống: chỉ grant không gắn chi nhánh mới phủ toàn bộ.
            <br />
            Bấm "Sửa quyền", đổi các ô cần đổi rồi bấm Lưu một lần — chỉ các ô đã đổi được gửi, mỗi ô một dòng nhật ký ở cuối trang
            (sửa bảng quyền là việc phải tra lại được). Bấm "Huỷ thay đổi" thì không ghi gì. Hai quyền <strong>Cấu hình hệ thống</strong> và
            <strong> Xem học viên</strong> của vai Quản trị hệ thống KHÔNG gỡ được: gỡ xong thì không
            còn ai vào lại được màn này.
            <br />
            <strong>Quyền dẫn xuất (không có ô bật/tắt):</strong> <em>Xem hồ sơ giáo viên</em> — chính mình; Quản lý: giáo viên
            thuộc chi nhánh mình (có vai hoặc đang dạy lớp ở đó); Quản trị hệ thống: tất cả. <em>Xuất Excel kết quả Test</em> —
            Quản lý và Quản trị hệ thống (trong phạm vi của mình), Giáo viên chủ nhiệm (lớp mình chủ nhiệm).
          </SectionNote>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Đơn vị báo cáo">
          <ul className="text-sm space-y-1.5 list-none p-0 m-0">
            {data.units.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <span className="text-slate-100">{u.name}</span>
                <Info>{u.kind === 'branch' ? 'Chi nhánh' : 'Đơn vị độc lập'}</Info>
              </li>
            ))}
          </ul>
          <SectionNote>Tutor part-time là đơn vị báo cáo riêng, không phải chi nhánh thứ sáu.</SectionNote>
        </Card>

        <Card title="Nhật ký thay đổi gần nhất" bodyClass="p-0">
          <ul className="divide-y list-none p-0 m-0 max-h-96 overflow-y-auto" style={{ borderColor: 'var(--line)' }}>
            {data.audit.map((a) => (
              <li key={a.id} className="px-4 py-2 text-xs">
                <span className="text-slate-200" title={a.action}>{nhanHanhDongNhatKy(a.action)}</span>
                <span className="text-slate-500"> · {a.entityLabel ?? a.entityType}</span>
                <div className="text-slate-500">{a.actorName ?? '—'} · {fmtDateTime(a.createdAt)}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

    </div>
  );
}

/**
 * MỘT Ô TRONG BẢNG QUYỀN (UX-C7, Q23). Chỉ bấm được trong chế độ "Sửa quyền"; bấm là ĐỔI TẠM (chưa lưu), ô đã đổi có viền + chữ "đổi"
 * (không chỉ dựa vào màu). Lưu gửi chỉ các ô đã đổi — không ghi đè cả bảng, mỗi ô một dòng nhật ký.
 */
function PermCell({ roleName, perm, granted, doi, dangSua, onBam }: {
  roleName: string; perm: { key: string; name: string };
  granted: boolean; doi: boolean; dangSua: boolean; onBam: () => void;
}) {
  const co = doi ? !granted : granted;
  return (
    <button
      type="button"
      disabled={!dangSua}
      aria-pressed={dangSua ? co : undefined}
      title={dangSua ? `${co ? 'Bỏ' : 'Cấp'} quyền "${perm.name}" cho vai trò ${roleName}` : 'Bấm "Sửa quyền" để đổi'}
      className={`w-full min-h-[36px] bg-transparent text-sm tabular-nums ${co ? 'text-sky-200' : 'text-slate-600'} ${
        doi ? 'rounded-md border border-[color:var(--accent-line)]' : 'border border-transparent'} ${dangSua ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
      onClick={onBam}
    >
      {co ? 'có' : '—'}{doi && <span className="ml-1 text-[11px] text-slate-400">đổi</span>}
    </button>
  );
}
