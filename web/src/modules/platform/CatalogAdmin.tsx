import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Field, Forbidden, Info, NutChon, SectionNote, Skeleton, Th} from '../../ui/ui.tsx';
import { Drawer } from '../../ui/Drawer.tsx';
import { skillLabel } from '../../lib/format.ts';
import { ENTRY_SKILLS, REGULAR_SKILLS } from '@shared/domain/index.ts';

type RouteRow = { code: string; name: string; note: string | null; seq: number; status: string; inUse: number };
type Programme = {
  code: string; name: string; weeks: number | null; scoringMode: string; status: string;
  skills: string[]; checkpoints: { kind: string; studyWeek: number }[];
  classes: number; builtin: boolean;
};

const ALL_SKILLS = [...new Set([...ENTRY_SKILLS, ...REGULAR_SKILLS])] as string[];

/**
 * LỘ TRÌNH VÀ LOẠI LỚP — mục 7.3.
 *
 * Hai thứ này trước là hằng số trong mã nguồn. Trung tâm mở một lộ trình mới thì phải sửa mã
 * rồi chờ cài lại — với một trung tâm đang lớn thì đó là một cái phanh, không phải một biện
 * pháp an toàn.
 *
 * KHÔNG CÓ NÚT XOÁ, và đó là chủ ý. Xoá một lộ trình đang có lớp dùng thì mọi lớp cũ mất chỗ
 * tựa và lịch sử đọc lại thành vô nghĩa. Thay vào đó là NGỪNG DÙNG: biến mất khỏi các ô chọn
 * khi tạo mới, lớp cũ vẫn đọc được như thường.
 */
export function CatalogAdmin() {
  const routes = useApi<RouteRow[]>('/admin/routes');
  const programmes = useApi<Programme[]>('/admin/programmes');
  const [editRoute, setEditRoute] = useState<RouteRow | null | 'new'>(null);
  const [editProg, setEditProg] = useState<Programme | null | 'new'>(null);

  /* Không có quyền thì nói thẳng, đừng để một khối trống — xem chú thích ở `AccountsAdmin`. */
  if (routes.error || programmes.error) {
    return (
      <Forbidden
        message="Phần này chỉ dành cho Quản trị hệ thống."
        hint="Lộ trình và loại lớp là cấu hình chung của cả trung tâm, nên chỉ một người sửa được."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Card title="Lộ trình" bodyClass="p-0"
        action={<button className="btn btn-sm" onClick={() => setEditRoute('new')}>+ Thêm lộ trình</button>}>
        {routes.loading ? <div className="p-4"><Skeleton rows={3} /></div> : (
          <table className="w-full text-sm">
            <thead>
              <tr><th className="th">Mã</th><th className="th">Tên</th><Th align="right" hint="Có bao nhiêu bản ghi đang dùng mục này. Khác 0 thì không xoá được.">Đang dùng</Th><th className="th" /></tr>
            </thead>
            <tbody>
              {(routes.data ?? []).map((r) => (
                <tr key={r.code} className={`row-hover ${r.status !== 'active' ? 'opacity-50' : ''}`}>
                  <td className="td text-slate-100 whitespace-nowrap">
                    {r.code}
                    {r.status !== 'active' && <Info pending>ngừng dùng</Info>}
                  </td>
                  <td className="td text-slate-300">{r.name}</td>
                  <td className="td text-right tabular-nums text-slate-400">{r.inUse || '—'}</td>
                  <td className="td text-right">
                    <button className="btn btn-sm" onClick={() => setEditRoute(r)}>Sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-3">
          <SectionNote>
            Cột <strong>Đang dùng</strong> đếm lớp và lộ trình học viên đang mang mã này. Lộ trình đang có người
            dùng thì <strong>ngừng dùng</strong> chứ không xoá — xoá là làm hỏng lịch sử của chính những em đó.
          </SectionNote>
        </div>
      </Card>

      <Card title="Loại lớp" bodyClass="p-0"
        action={<button className="btn btn-sm" onClick={() => setEditProg('new')}>+ Thêm loại lớp</button>}>
        {programmes.loading ? <div className="p-4"><Skeleton rows={3} /></div> : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Mã</th><th className="th">Tên</th>
                <th className="th text-right">Tuần</th><th className="th text-right">Lớp</th><th className="th" />
              </tr>
            </thead>
            <tbody>
              {(programmes.data ?? []).map((p) => (
                <tr key={p.code} className={`row-hover ${p.status !== 'active' ? 'opacity-50' : ''}`}>
                  <td className="td text-slate-100 whitespace-nowrap">
                    {p.code}
                    {p.builtin && <Info>gốc</Info>}
                  </td>
                  <td className="td text-slate-300">
                    {p.name}
                    <span className="block text-[11px] text-slate-500">
                      {p.scoringMode === 'ratio' ? 'chấm theo số câu đúng / tổng số câu' : 'chấm theo band IELTS'}
                      {' · '}{p.skills.map(skillLabel).join(' · ')}
                    </span>
                  </td>
                  <td className="td text-right tabular-nums text-slate-400">{p.weeks ?? '—'}</td>
                  <td className="td text-right tabular-nums text-slate-400">{p.classes || '—'}</td>
                  <td className="td text-right">
                    <button className="btn btn-sm" onClick={() => setEditProg(p)}>Sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-3">
          <SectionNote>
            Bốn loại lớp <strong>gốc</strong> khoá hai thứ: <strong>cách chấm</strong> và <strong>bộ kỹ năng</strong>.
            Đổi cách chấm là đổi ý nghĩa của mọi điểm đã nhập từ trước; bỏ một kỹ năng là bỏ chỗ tựa của những ô
            điểm đã có. Tên, số tuần và hai mốc kiểm tra thì sửa thoải mái — chúng chỉ ảnh hưởng tới lớp mở sau.
          </SectionNote>
        </div>
      </Card>

      {editRoute !== null && (
        <RouteDialog row={editRoute === 'new' ? null : editRoute}
          onClose={() => setEditRoute(null)}
          onDone={() => { setEditRoute(null); routes.reload(); invalidate('/ref/routes'); }} />
      )}
      {editProg !== null && (
        <ProgrammeDialog row={editProg === 'new' ? null : editProg}
          onClose={() => setEditProg(null)}
          onDone={() => { setEditProg(null); programmes.reload(); }} />
      )}
    </div>
  );
}

function RouteDialog({ row, onClose, onDone }: {
  row: RouteRow | null; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [f, setF] = useState({
    code: row?.code ?? '', name: row?.name ?? '', note: row?.note ?? '',
    active: (row?.status ?? 'active') === 'active',
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/admin/routes', { ...f, status: f.active ? 'active' : 'inactive' });
      toast.push('ok', 'Đã lưu lộ trình');
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-lg"
      title={row ? `Sửa lộ trình ${row.code}` : 'Thêm lộ trình'}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" onClick={save} disabled={busy || !f.code || !f.name}>Lưu</button>
        </>
      }>
      <div className="space-y-4">
        <Field label="Mã lộ trình" required hint="Chữ in hoa, số và gạch ngang. Ví dụ LT1, LT2, IELTS-CAP.">
          <input className="field w-full" value={f.code} disabled={!!row}
            onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Tên gọi" required>
          <input className="field w-full" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Ghi chú">
          <input className="field w-full" value={f.note ?? ''} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          Còn dùng — bỏ dấu này thì lộ trình biến mất khỏi các ô chọn khi tạo mới, lớp cũ giữ nguyên
        </label>
        {row && row.inUse > 0 && (
          <SectionNote>
            Đang có <strong>{row.inUse}</strong> lớp và lộ trình học viên dùng mã này. Ngừng dùng thì không ai
            chọn được nữa khi tạo mới, nhưng những bản ghi cũ vẫn đọc được bình thường.
          </SectionNote>
        )}
      </div>
    </Drawer>
  );
}

function ProgrammeDialog({ row, onClose, onDone }: {
  row: Programme | null; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [f, setF] = useState({
    code: row?.code ?? '', name: row?.name ?? '',
    weeks: row?.weeks ? String(row.weeks) : '',
    scoringMode: row?.scoringMode ?? 'ratio',
    skills: new Set(row?.skills ?? ['listening', 'reading', 'writing', 'speaking']),
    progressWeek: String(row?.checkpoints.find((c) => c.kind === 'progress')?.studyWeek ?? ''),
    finalWeek: String(row?.checkpoints.find((c) => c.kind === 'final')?.studyWeek ?? ''),
    active: (row?.status ?? 'active') === 'active',
  });
  const [busy, setBusy] = useState(false);
  const locked = !!row?.builtin;

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/admin/programmes', {
        code: f.code, name: f.name,
        weeks: f.weeks.trim() === '' ? null : Number(f.weeks),
        scoringMode: f.scoringMode,
        skills: [...f.skills],
        progressWeek: f.progressWeek ? Number(f.progressWeek) : null,
        finalWeek: f.finalWeek ? Number(f.finalWeek) : null,
        status: f.active ? 'active' : 'inactive',
      });
      toast.push('ok', 'Đã lưu loại lớp');
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-lg"
      title={row ? `Sửa loại lớp ${row.code}` : 'Thêm loại lớp'}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-primary" onClick={save} disabled={busy || !f.code || !f.name}>Lưu</button>
        </>
      }>
      <div className="space-y-4">
        <Field label="Mã loại lớp" required hint="Chữ in hoa, số và gạch ngang. Ví dụ FOU, BE, ELE, PRE-IELTS.">
          <input className="field w-full" value={f.code} disabled={!!row}
            onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Tên gọi" required>
          <input className="field w-full" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>

        <Field label="Cách chấm" required
          hint={locked ? 'Loại lớp gốc không đổi được cách chấm — đổi là đổi ý nghĩa của mọi điểm đã nhập.' : undefined}>
          <div className="flex flex-wrap gap-2">
            {(['ratio', 'ielts_band'] as const).map((m) => (
              <NutChon key={m} nho disabled={locked} chon={f.scoringMode === m} className={locked ? 'opacity-60' : ''}
                onClick={() => setF({ ...f, scoringMode: m })}>
                {m === 'ratio' ? 'Điểm đạt / Tổng điểm' : 'Band IELTS'}
              </NutChon>
            ))}
          </div>
        </Field>

        <Field label="Kỹ năng của chương trình" required
          hint={locked ? 'Loại lớp gốc không đổi được bộ kỹ năng — bỏ một kỹ năng là bỏ chỗ tựa của điểm đã có.' : undefined}>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SKILLS.map((s) => (
              <NutChon key={s} nho disabled={locked} chon={f.skills.has(s)} className={locked ? 'opacity-60' : ''}
                onClick={() => setF({
                  ...f,
                  skills: (() => { const n = new Set(f.skills); if (n.has(s)) n.delete(s); else n.add(s); return n; })(),
                })}>
                {skillLabel(s)}
              </NutChon>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Số tuần" hint="Để trống nếu khoá không cố định (như lớp FT).">
            <input type="number" min={1} max={104} className="field w-full" value={f.weeks}
              onChange={(e) => setF({ ...f, weeks: e.target.value })} />
          </Field>
          <Field label="Tuần Progress Test">
            <input type="number" min={1} className="field w-full" value={f.progressWeek}
              onChange={(e) => setF({ ...f, progressWeek: e.target.value })} />
          </Field>
          <Field label="Tuần Final Test">
            <input type="number" min={1} className="field w-full" value={f.finalWeek}
              onChange={(e) => setF({ ...f, finalWeek: e.target.value })} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          Còn dùng — bỏ dấu này thì loại lớp biến mất khỏi ô chọn khi tạo lớp mới
        </label>

        {row && row.classes > 0 && (
          <SectionNote>
            Đang có <strong>{row.classes}</strong> lớp dùng loại này. Đổi số tuần hay mốc kiểm tra chỉ ảnh hưởng
            tới cách tính tiến độ từ giờ trở đi; điểm đã nhập không đổi.
          </SectionNote>
        )}
      </div>
    </Drawer>
  );
}
