import { useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { api, invalidate } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';
import { Card, Empty, ErrorState, Field, Forbidden, Pill, SectionNote, Skeleton } from '../components/ui.tsx';
import { ConfirmDialog, Modal } from '../components/Drawer.tsx';
import { fmtDate, fmtDateTime, skillLabel } from '../lib/format.ts';
import { ROLE_LABEL, SCOPE_LABEL, TEACHING_SKILLS, PERMISSION_LABEL } from '@shared/domain.ts';

const TABS = [
  { key: 'to-chuc', label: 'Chi nhánh & đơn vị' },
  { key: 'chuong-trinh', label: 'Chương trình & phiên bản' },
  { key: 'nguoi-dung', label: 'Người dùng & phân quyền' },
  { key: 'phan-cong', label: 'Phân công' },
  { key: 'nguong', label: 'Ngưỡng tín hiệu' },
  { key: 'nhat-ky', label: 'Nhật ký thay đổi' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('to-chuc');
  const overview = useApi<any>('/admin/overview');

  if (overview.loading) return <Skeleton rows={7} />;
  if (overview.error) {
    return overview.error.status === 403
      ? <Forbidden message={overview.error.message} hint={overview.error.hint} />
      : <ErrorState message={overview.error.message} onRetry={overview.reload} />;
  }
  const o = overview.data!;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 card p-1 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {tab === 'to-chuc' && <OrgTab o={o} onChanged={overview.reload} />}
      {tab === 'chuong-trinh' && <TemplateTab o={o} onChanged={overview.reload} />}
      {tab === 'nguoi-dung' && <UsersTab />}
      {tab === 'phan-cong' && <AssignmentsTab />}
      {tab === 'nguong' && <SignalTab o={o} onChanged={overview.reload} />}
      {tab === 'nhat-ky' && <AuditTab />}
    </div>
  );
}

function OrgTab({ o, onChanged }: { o: any; onChanged: () => void }) {
  const toast = useToast();
  const [archive, setArchive] = useState<{ table: string; id: number; label: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid xl:grid-cols-2 gap-4">
      <Card title="Chi nhánh" bodyClass="p-0">
        <table className="w-full text-sm">
          <thead><tr><th className="th">Mã</th><th className="th">Tên</th><th className="th">Trạng thái</th><th className="th"></th></tr></thead>
          <tbody>
            {o.branches.map((b: any) => (
              <tr key={b.id} className="row-hover">
                <td className="td text-slate-400">{b.code}</td>
                <td className="td text-slate-100">{b.name}</td>
                <td className="td"><Pill tone={b.status === 'active' ? 'ok' : 'muted'}>{b.status === 'active' ? 'Hoạt động' : 'Đã lưu trữ'}</Pill></td>
                <td className="td text-right">
                  {o.canConfig && b.status === 'active' && (
                    <button className="btn btn-sm btn-danger" onClick={() => setArchive({ table: 'branches', id: b.id, label: b.name })}>Lưu trữ</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Đơn vị báo cáo" bodyClass="p-0">
        <table className="w-full text-sm">
          <thead><tr><th className="th">Tên</th><th className="th">Loại</th><th className="th">Thuộc chi nhánh</th></tr></thead>
          <tbody>
            {o.reportingUnits.map((u: any) => (
              <tr key={u.id} className="row-hover">
                <td className="td text-slate-100">{u.name}</td>
                <td className="td"><Pill tone="neutral">{u.kind === 'branch' ? 'Chi nhánh' : 'Đơn vị riêng'}</Pill></td>
                <td className="td text-slate-400">{u.branch_name ?? <span className="text-slate-600 italic">Không thuộc chi nhánh nào</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <SectionNote>Đơn vị báo cáo riêng (ví dụ Tutor Part-time) nộp báo cáo như chi nhánh nhưng không gắn với một chi nhánh cụ thể.</SectionNote>
        </div>
      </Card>

      <Card title="Loại lớp" bodyClass="p-0" className="xl:col-span-2">
        <table className="w-full text-sm">
          <thead><tr><th className="th">Mã</th><th className="th">Tên</th><th className="th">Nhóm</th></tr></thead>
          <tbody>
            {o.classTypes.map((t: any) => (
              <tr key={t.id} className="row-hover">
                <td className="td text-slate-400">{t.code}</td>
                <td className="td text-slate-100">{t.name}</td>
                <td className="td"><Pill tone="neutral">{t.category}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ConfirmDialog open={!!archive} onClose={() => setArchive(null)} busy={busy} danger
        title="Lưu trữ dữ liệu" confirmLabel="Lưu trữ"
        body={<div className="space-y-2">
          <p>Lưu trữ <strong>{archive?.label}</strong>?</p>
          <p className="text-xs text-slate-400">Dữ liệu không bị xoá khỏi cơ sở dữ liệu, chỉ ẩn khỏi các danh sách đang hoạt động. Lịch sử liên quan vẫn giữ nguyên.</p>
        </div>}
        onConfirm={async () => {
          setBusy(true);
          try { await api.post('/admin/archive', archive); onChanged(); toast.push('ok', 'Đã lưu trữ'); }
          catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); setArchive(null); }
        }} />
    </div>
  );
}

function TemplateTab({ o, onChanged }: { o: any; onChanged: () => void }) {
  const toast = useToast();
  const classes = useApi<any[]>('/ref/classes');
  const [newVersion, setNewVersion] = useState<any>(null);
  const [assign, setAssign] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <SectionNote>
        Phiên bản đã áp dụng là bất biến. Sửa chương trình sẽ tạo <strong>phiên bản mới</strong>; lớp đang dùng phiên bản cũ giữ nguyên.
        Muốn đổi riêng một lớp, dùng "Điều chỉnh" trong tab Tiến độ chương trình của lớp đó.
      </SectionNote>

      {o.templates.map((t: any) => (
        <Card key={t.id} title={<span>{t.name} <Pill tone="neutral">{t.category}</Pill></span>} bodyClass="p-0"
          action={o.canConfig ? <button className="btn btn-sm" onClick={() => setNewVersion({ template: t, basedOn: t.versions[0] })}>Tạo phiên bản mới</button> : undefined}>
          <table className="w-full text-sm">
            <thead><tr><th className="th">Phiên bản</th><th className="th">Số mốc</th><th className="th">Lớp đang dùng</th><th className="th">Ghi chú</th><th className="th">Ngày phát hành</th></tr></thead>
            <tbody>
              {t.versions.map((v: any) => (
                <tr key={v.id} className="row-hover">
                  <td className="td"><Pill tone={v.status === 'published' ? 'ok' : 'warn'}>v{v.version_no}</Pill></td>
                  <td className="td tabular-nums">{v.stageCount}</td>
                  <td className="td tabular-nums">{v.classCount}</td>
                  <td className="td text-xs text-slate-400 max-w-md">{v.notes}</td>
                  <td className="td text-xs text-slate-400">{fmtDate(v.published_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}

      {o.canConfig && (
        <Card title="Áp phiên bản cho lớp" bodyClass="p-4">
          <p className="text-xs text-slate-400 mb-3">
            Đổi phiên bản chương trình của một lớp. Thao tác này được ghi vào nhật ký và không ảnh hưởng các lớp khác.
          </p>
          <button className="btn btn-sm" onClick={() => setAssign({})}>Chọn lớp và phiên bản</button>
        </Card>
      )}

      {newVersion && (
        <Modal open onClose={() => setNewVersion(null)} title={`Tạo phiên bản mới — ${newVersion.template.name}`}
          footer={<>
            <button className="btn" onClick={() => setNewVersion(null)}>Huỷ</button>
            <button className="btn btn-primary" disabled={busy} onClick={async () => {
              setBusy(true);
              try {
                await api.post(`/admin/templates/${newVersion.template.id}/versions`, {
                  basedOnVersionId: newVersion.basedOn?.id, notes: newVersion.notes ?? 'Phiên bản mới', stages: [],
                });
                onChanged(); setNewVersion(null);
                toast.push('ok', 'Đã tạo phiên bản mới. Các lớp cũ vẫn giữ phiên bản đang dùng.');
              } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
              finally { setBusy(false); }
            }}>Tạo phiên bản</button>
          </>}>
          <div className="space-y-3">
            <div className="card p-3 text-xs text-slate-400">
              Phiên bản mới được sao chép từ <strong className="text-slate-200">v{newVersion.basedOn?.version_no}</strong>.
              Sau khi tạo, bạn áp nó cho các lớp mới; lớp đang chạy không bị thay đổi.
            </div>
            <Field label="Ghi chú phiên bản">
              <input className="field" value={newVersion.notes ?? ''} onChange={(e) => setNewVersion({ ...newVersion, notes: e.target.value })}
                placeholder="Ví dụ: Mở rộng lên 12 tuần" />
            </Field>
          </div>
        </Modal>
      )}

      {assign && (
        <Modal open onClose={() => setAssign(null)} title="Áp phiên bản chương trình cho lớp"
          footer={<>
            <button className="btn" onClick={() => setAssign(null)}>Huỷ</button>
            <button className="btn btn-primary" disabled={!assign.classId || !assign.versionId || busy} onClick={async () => {
              setBusy(true);
              try {
                await api.post(`/admin/classes/${assign.classId}/template-version`, { versionId: Number(assign.versionId) });
                invalidate('/classes'); onChanged(); setAssign(null);
                toast.push('ok', 'Đã áp phiên bản cho lớp');
              } catch (e: any) { toast.push('error', e.message); }
              finally { setBusy(false); }
            }}>Áp dụng</button>
          </>}>
          <div className="space-y-3">
            <Field label="Lớp">
              <select className="field" value={assign.classId ?? ''} onChange={(e) => setAssign({ ...assign, classId: e.target.value })}>
                <option value="">— Chọn lớp —</option>
                {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.code} · {c.category}</option>)}
              </select>
            </Field>
            <Field label="Phiên bản chương trình">
              <select className="field" value={assign.versionId ?? ''} onChange={(e) => setAssign({ ...assign, versionId: e.target.value })}>
                <option value="">— Chọn phiên bản —</option>
                {o.templates.flatMap((t: any) => t.versions.map((v: any) => (
                  <option key={v.id} value={v.id}>{t.name} — v{v.version_no} ({v.stageCount} mốc)</option>
                )))}
              </select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UsersTab() {
  const users = useApi<any>('/admin/users');
  const roles = useApi<any>('/admin/roles');
  const branches = useApi<any[]>('/ref/branches');
  const toast = useToast();
  const [grantFor, setGrantFor] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  if (users.loading) return <Skeleton rows={6} />;
  if (users.error) {
    return users.error.status === 403
      ? <Forbidden message={users.error.message} hint={users.error.hint} />
      : <ErrorState message={users.error.message} onRetry={users.reload} />;
  }

  return (
    <div className="space-y-4">
      <SectionNote>
        Vai trò chỉ là nhãn hiển thị. Quyền thực tế = Permission của vai trò × Phạm vi của chính grant đó × Phân công.
        Mỗi grant giữ đúng phạm vi riêng, không cộng phạm vi giữa các vai trò.
      </SectionNote>

      <Card title="Người dùng và phạm vi được cấp" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="th sticky-col">Người dùng</th><th className="th">Vai trò và phạm vi</th>
              <th className="th">Phân công lớp/skill</th><th className="th">Học viên phụ trách</th><th className="th"></th>
            </tr></thead>
            <tbody>
              {(users.data ?? []).map((u: any) => (
                <tr key={u.id} className="row-hover">
                  <td className="td sticky-col">
                    <div className="text-slate-100">{u.full_name}</div>
                    <div className="text-[11px] text-slate-500">{u.code} · {u.title}</div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-1 items-start">
                      {u.grants.map((g: any) => (
                        <span key={g.id} className="flex items-center gap-1">
                          <Pill tone="neutral">{ROLE_LABEL[g.role_key] ?? g.role_key}</Pill>
                          <span className="text-[11px] text-slate-400">{g.label ?? SCOPE_LABEL[g.scope_type as keyof typeof SCOPE_LABEL]}</span>
                          <button className="btn btn-sm btn-ghost text-red-300" title="Gỡ quyền" onClick={async () => {
                            if (!confirm(`Gỡ vai trò ${ROLE_LABEL[g.role_key]} của ${u.full_name}?`)) return;
                            try { await api.del(`/admin/grants/${g.id}`); users.reload(); toast.push('ok', 'Đã gỡ quyền'); }
                            catch (e: any) { toast.push('error', e.message); }
                          }}>×</button>
                        </span>
                      ))}
                      {u.grants.length === 0 && <span className="text-xs text-slate-600">Chưa có quyền nào</span>}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {u.teacherAssignments.map((a: any) => (
                        <Pill key={a.id} tone={a.is_core ? 'ok' : 'info'}>
                          {a.class_code}{a.is_core ? ' · GVCN' : ` · ${skillLabel(a.skill)}`}
                        </Pill>
                      ))}
                      {u.teacherAssignments.length === 0 && <span className="text-xs text-slate-600">—</span>}
                    </div>
                  </td>
                  <td className="td tabular-nums">{u.consultantCount || '—'}</td>
                  <td className="td text-right"><button className="btn btn-sm" onClick={() => setGrantFor(u)}>Cấp quyền</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Vai trò và permission" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Vai trò</th><th className="th">Chức năng được cấp</th></tr></thead>
            <tbody>
              {(roles.data?.roles ?? []).map((r: any) => (
                <tr key={r.id} className="row-hover">
                  <td className="td text-slate-100">{r.name_vi}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.map((p: string) => <Pill key={p} tone="neutral">{PERMISSION_LABEL[p] ?? p}</Pill>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {grantFor && (
        <GrantDialog user={grantFor} branches={branches.data ?? []} onClose={() => setGrantFor(null)}
          onDone={() => { setGrantFor(null); users.reload(); invalidate('/'); toast.push('ok', 'Đã cấp quyền'); }} />
      )}
    </div>
  );
}

function GrantDialog({ user, branches, onClose, onDone }: { user: any; branches: any[]; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [roleKey, setRoleKey] = useState('teacher');
  const [scopeType, setScopeType] = useState('assignment');
  const [scopeId, setScopeId] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const needsScopeId = scopeType === 'branch' || scopeType === 'reporting_unit';

  return (
    <>
      <Modal open onClose={onClose} title={`Cấp quyền — ${user.full_name}`}
        footer={<>
          <button className="btn" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={needsScopeId && !scopeId} onClick={() => setConfirm(true)}>Xem lại và cấp quyền</button>
        </>}>
        <div className="space-y-3">
          <Field label="Vai trò">
            <select className="field" value={roleKey} onChange={(e) => setRoleKey(e.target.value)}>
              {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Phạm vi của quyền này"
            hint="Quyền chỉ có hiệu lực trong đúng phạm vi này, không cộng với phạm vi của các vai trò khác.">
            <select className="field" value={scopeType} onChange={(e) => setScopeType(e.target.value)}>
              {Object.entries(SCOPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          {needsScopeId && (
            <Field label="Chi nhánh / đơn vị" required>
              <select className="field" value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
                <option value="">— Chọn —</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          )}
          <SectionNote>
            GVCN không phải vai trò hệ thống — hãy dùng tab Phân công để đặt giáo viên chủ nhiệm cho từng lớp.
          </SectionNote>
        </div>
      </Modal>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} busy={busy}
        title="Xác nhận cấp quyền" confirmLabel="Cấp quyền"
        body={<p>Cấp vai trò <strong>{ROLE_LABEL[roleKey]}</strong> với phạm vi <strong>{SCOPE_LABEL[scopeType as keyof typeof SCOPE_LABEL]}</strong> cho <strong>{user.full_name}</strong>?</p>}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.post('/admin/grants', {
              userId: user.id, roleKey, scopeType,
              scopeId: needsScopeId ? Number(scopeId) : null,
              label: needsScopeId ? branches.find((b) => String(b.id) === scopeId)?.name : null,
            });
            onDone();
          } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
          finally { setBusy(false); setConfirm(false); }
        }} />
    </>
  );
}

function AssignmentsTab() {
  const toast = useToast();
  const users = useApi<any>('/admin/users');
  const classes = useApi<any[]>('/ref/classes');
  const [form, setForm] = useState({ userId: '', classId: '', skill: '', isCore: false, effectiveFrom: '' });
  const [busy, setBusy] = useState(false);

  if (users.error) {
    return users.error.status === 403
      ? <Forbidden message={users.error.message} hint={users.error.hint} />
      : <ErrorState message={users.error.message} onRetry={users.reload} />;
  }

  return (
    <div className="space-y-4">
      <Card title="Thêm phân công giáo viên" bodyClass="p-4">
        <div className="grid md:grid-cols-5 gap-3 items-end">
          <Field label="Giáo viên">
            <select className="field" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">— Chọn —</option>
              {(users.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </Field>
          <Field label="Lớp">
            <select className="field" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">— Chọn —</option>
              {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </Field>
          <Field label="Skill (GVBM)">
            <select className="field" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })}>
              <option value="">— Không dạy skill nào —</option>
              {TEACHING_SKILLS.map((s) => <option key={s} value={s}>{skillLabel(s)}</option>)}
            </select>
          </Field>
          <Field label="Hiệu lực từ"><input type="date" className="field" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></Field>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
              <input type="checkbox" checked={form.isCore} onChange={(e) => setForm({ ...form, isCore: e.target.checked })} />
              Là GVCN của lớp
            </label>
            <button className="btn btn-primary btn-sm w-full justify-center"
              disabled={!form.userId || !form.classId || !form.effectiveFrom || (!form.skill && !form.isCore) || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.post('/admin/teacher-assignments', {
                    userId: Number(form.userId), classId: Number(form.classId),
                    skill: form.skill || null, isCore: form.isCore, effectiveFrom: form.effectiveFrom,
                  });
                  users.reload(); invalidate('/classes'); invalidate('/dashboard');
                  toast.push('ok', 'Đã thêm phân công');
                  setForm({ userId: '', classId: '', skill: '', isCore: false, effectiveFrom: '' });
                } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
                finally { setBusy(false); }
              }}>Thêm phân công</button>
          </div>
        </div>
        <div className="mt-3">
          <SectionNote>
            Phân công GVCN và phân công dạy skill là hai dòng riêng. Một người có thể vừa là GVCN của lớp vừa chỉ dạy một skill
            tại chính lớp đó — quyền chủ nhiệm không tự cấp quyền sửa mọi skill.
          </SectionNote>
        </div>
      </Card>

      <Card title="Phân công hiện có" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Giáo viên</th><th className="th">Lớp</th><th className="th">Vai trò tại lớp</th><th className="th">Hiệu lực</th><th className="th"></th></tr></thead>
            <tbody>
              {(users.data ?? []).flatMap((u: any) => u.teacherAssignments.map((a: any) => (
                <tr key={a.id} className="row-hover">
                  <td className="td text-slate-200">{u.full_name}</td>
                  <td className="td text-slate-300">{a.class_code}</td>
                  <td className="td">
                    {a.is_core ? <Pill tone="ok">GVCN</Pill> : <Pill tone="info">GVBM {skillLabel(a.skill)}</Pill>}
                  </td>
                  <td className="td text-xs text-slate-400">{fmtDate(a.effective_from)} → {a.effective_to ? fmtDate(a.effective_to) : 'không giới hạn'}</td>
                  <td className="td text-right">
                    <button className="btn btn-sm btn-danger" onClick={async () => {
                      if (!confirm(`Gỡ phân công của ${u.full_name} tại ${a.class_code}?`)) return;
                      try { await api.del(`/admin/teacher-assignments/${a.id}`); users.reload(); invalidate('/classes'); toast.push('ok', 'Đã gỡ phân công'); }
                      catch (e: any) { toast.push('error', e.message); }
                    }}>Gỡ</button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SignalTab({ o, onChanged }: { o: any; onChanged: () => void }) {
  const toast = useToast();
  const active = o.signalPolicies.find((p: any) => p.status === 'active');
  const [form, setForm] = useState({
    label: '', attendanceMinRate: String(active?.attendance_min_rate ?? 0.8),
    homeworkMinRate: String(active?.homework_min_rate ?? 0.7),
    lookbackWeeks: String(active?.lookback_weeks ?? 4),
    dueSoonDays: String(active?.due_soon_days ?? 3),
    longRunningDays: String(active?.long_running_days ?? 21),
  });
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <div className="card p-3 border-amber-500/30">
        <div className="text-amber-300 text-sm font-medium">Ngưỡng thử nghiệm</div>
        <p className="text-xs text-slate-400 mt-1">
          Các ngưỡng dưới đây là giả định thử nghiệm của bản demo, chưa phải quy định chính thức. Mỗi lần đổi tạo một phiên bản mới
          để báo cáo cũ vẫn tra được ngưỡng đã dùng.
        </p>
      </div>

      <Card title="Phiên bản ngưỡng" bodyClass="p-0">
        <table className="w-full text-sm">
          <thead><tr>
            <th className="th">Phiên bản</th><th className="th">Chuyên cần tối thiểu</th><th className="th">Bài tập tối thiểu</th>
            <th className="th">Kỳ tính</th><th className="th">Sắp đến hạn</th><th className="th">Kéo dài</th><th className="th">Trạng thái</th>
          </tr></thead>
          <tbody>
            {o.signalPolicies.map((p: any) => (
              <tr key={p.id} className="row-hover">
                <td className="td">v{p.version} <span className="text-xs text-slate-500">{p.label}</span></td>
                <td className="td tabular-nums">{Math.round(p.attendance_min_rate * 100)}%</td>
                <td className="td tabular-nums">{Math.round(p.homework_min_rate * 100)}%</td>
                <td className="td tabular-nums">{p.lookback_weeks} tuần</td>
                <td className="td tabular-nums">{p.due_soon_days} ngày</td>
                <td className="td tabular-nums">{p.long_running_days} ngày</td>
                <td className="td">
                  {p.status === 'active' ? <Pill tone="ok">Đang dùng</Pill> : <Pill tone="muted">Đã lưu trữ</Pill>}
                  {p.is_experimental === 1 && <Pill tone="warn">Thử nghiệm</Pill>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {o.canConfig && (
        <Card title="Tạo phiên bản ngưỡng mới" bodyClass="p-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Tên phiên bản"><input className="field" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ví dụ: Ngưỡng sau khi review demo" /></Field>
            <Field label="Chuyên cần tối thiểu (0–1)"><input className="field" value={form.attendanceMinRate} onChange={(e) => setForm({ ...form, attendanceMinRate: e.target.value })} /></Field>
            <Field label="Bài tập tối thiểu (0–1)"><input className="field" value={form.homeworkMinRate} onChange={(e) => setForm({ ...form, homeworkMinRate: e.target.value })} /></Field>
            <Field label="Số tuần tính tín hiệu"><input className="field" value={form.lookbackWeeks} onChange={(e) => setForm({ ...form, lookbackWeeks: e.target.value })} /></Field>
            <Field label="Ngưỡng 'sắp đến hạn' (ngày)"><input className="field" value={form.dueSoonDays} onChange={(e) => setForm({ ...form, dueSoonDays: e.target.value })} /></Field>
            <Field label="Ngưỡng 'công việc kéo dài' (ngày)"><input className="field" value={form.longRunningDays} onChange={(e) => setForm({ ...form, longRunningDays: e.target.value })} /></Field>
          </div>
          <button className="btn btn-primary btn-sm mt-3" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await api.post('/admin/signal-policies', {
                label: form.label || undefined,
                attendanceMinRate: Number(form.attendanceMinRate), homeworkMinRate: Number(form.homeworkMinRate),
                lookbackWeeks: Number(form.lookbackWeeks), dueSoonDays: Number(form.dueSoonDays),
                longRunningDays: Number(form.longRunningDays),
              });
              invalidate('/'); onChanged();
              toast.push('ok', 'Đã tạo phiên bản ngưỡng mới và áp dụng');
            } catch (e: any) { toast.push('error', e.hint ? `${e.message} ${e.hint}` : e.message); }
            finally { setBusy(false); }
          }}>Tạo và áp dụng</button>
        </Card>
      )}
    </div>
  );
}

function AuditTab() {
  const audit = useApi<any[]>('/admin/audit?limit=150');
  if (audit.loading) return <Skeleton rows={7} />;
  if (audit.error) {
    return audit.error.status === 403
      ? <Forbidden message={audit.error.message} hint={audit.error.hint} />
      : <ErrorState message={audit.error.message} onRetry={audit.reload} />;
  }

  return (
    <Card title="Nhật ký thay đổi" bodyClass="p-0">
      {(audit.data ?? []).length === 0 ? <Empty title="Chưa có thay đổi nào được ghi lại" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Thời điểm</th><th className="th">Người thực hiện</th><th className="th">Hành động</th><th className="th">Đối tượng</th><th className="th">Trước → Sau</th></tr></thead>
            <tbody>
              {audit.data!.map((a) => (
                <tr key={a.id} className="row-hover">
                  <td className="td text-xs text-slate-400 whitespace-nowrap">{fmtDateTime(a.created_at)}</td>
                  <td className="td text-slate-300">{a.actor_name ?? '—'}</td>
                  <td className="td text-xs"><Pill tone="neutral">{a.action}</Pill></td>
                  <td className="td text-xs text-slate-400">{a.entity_type}{a.entity_label ? ` · ${a.entity_label}` : ''}</td>
                  <td className="td text-[11px] text-slate-500 max-w-lg truncate">
                    {a.sensitivity === 'restricted' ? <span className="italic">Nội dung hạn chế</span>
                      : `${a.before_json ?? '—'} → ${a.after_json ?? '—'}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
