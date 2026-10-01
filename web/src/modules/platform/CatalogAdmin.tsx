import { useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Card, Field, Forbidden, Info, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { THU_TU_KY_HIEU, kyHieuLop, oPhanCong, skillShort, type KyHieuLop } from '@shared/domain/index.ts';

type RouteRow = {
  code: string; name: string; note: string | null; seq: number; status: string; inUse: number;
  kyVong: string | null; lichMt: string | null;
};
type Programme = {
  code: string; name: string; weeks: number | null; scoringMode: string; status: string;
  skills: string[]; checkpoints: { kind: string; studyWeek: number }[]; classes: number;
};
type KetQuaLuu = { lopGiuSoCu: number; soTuanCu: number | null };

const moc = (p: Programme, kind: 'progress' | 'final') => p.checkpoints.find((c) => c.kind === kind)?.studyWeek ?? null;
const thuTu = (p: Programme) => {
  const i = THU_TU_KY_HIEU.indexOf(kyHieuLop(p.code, null) as KyHieuLop);
  return i < 0 ? 99 : i;
};
/** MH9: bộ môn của CHÍNH chương trình đó (FOU: L · R · G+V · P; Pre FOU: Tổng hợp) — không gộp mọi môn. */
function boMon(p: Programme) {
  const mon = oPhanCong(p.code, p.skills).filter((o) => !o.laGvcn).map((o) => o.nhan);
  return (mon.length ? mon : p.skills.map(skillShort)).join(' · ');
}

/**
 * LỘ TRÌNH & CHƯƠNG TRÌNH — mục 7.3, K1-46…K1-50.
 *
 * KHÔNG CÓ NÚT THÊM (K1-48): tên lớp, lịch MT và kỳ vọng đang gắn với các mã có sẵn. Sửa được tên,
 * số tuần, tuần Giữa/Cuối khoá và "còn dùng" — số tuần mới chỉ áp cho lớp tạo sau khi lưu.
 *
 * KHÔNG CÓ NÚT XOÁ, và đó là chủ ý. Xoá một mã đang có lớp dùng thì mọi lớp cũ mất chỗ tựa. Thay vào
 * đó là NGỪNG DÙNG: biến mất khỏi các ô chọn khi tạo mới, lớp cũ vẫn đọc được như thường.
 */
export function CatalogAdmin() {
  const routes = useApi<RouteRow[]>('/admin/routes');
  const programmes = useApi<Programme[]>('/admin/programmes');
  const [editRoute, setEditRoute] = useState<RouteRow | null>(null);
  const [editProg, setEditProg] = useState<Programme | null>(null);
  const [ghiChu, setGhiChu] = useState<string | null>(null);

  /* Không có quyền thì nói thẳng, đừng để một khối trống — xem chú thích ở `AccountsAdmin`. */
  if (routes.error || programmes.error) {
    return (
      <Forbidden
        message="Phần này chỉ dành cho Quản trị hệ thống."
        hint="Lộ trình và chương trình là cấu hình chung của cả trung tâm, nên chỉ một người sửa được."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Card title="Lộ trình" className="min-w-0" bodyClass="p-0">
        {routes.loading ? <div className="p-4"><Skeleton rows={3} /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Lộ trình</th><th className="th">Kỳ vọng MT</th><th className="th">Lịch MT mặc định</th>
                <Th align="right" hint="Số lớp và lộ trình học viên đang mang mã này.">Đang dùng</Th><th className="th" />
              </tr>
            </thead>
            <tbody>
              {(routes.data ?? []).map((r) => (
                <tr key={r.code} className={`row-hover ${r.status !== 'active' ? 'opacity-50' : ''}`}>
                  <td className="td whitespace-nowrap">
                    <span className="text-slate-100">{r.code}</span>
                    <span className="ml-1.5 text-xs text-slate-500">{r.name}</span>
                    {r.status !== 'active' && <span className="ml-1.5"><Info pending>ngừng dùng</Info></span>}
                  </td>
                  <td className="td text-xs text-slate-400 whitespace-nowrap">{r.kyVong ?? '—'}</td>
                  <td className="td text-xs text-slate-400 whitespace-nowrap">{r.lichMt ?? '—'}</td>
                  <td className="td text-right tabular-nums text-slate-400">{r.inUse || '—'}</td>
                  <td className="td text-right">
                    <button className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setEditRoute(r)}>Sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
        <div className="p-3">
          <SectionNote>
            Hai cột <strong>Kỳ vọng MT</strong> và <strong>Lịch MT mặc định</strong> chỉ để đọc. Lộ trình đang có
            người dùng thì <strong>ngừng dùng</strong> chứ không xoá — xoá là làm hỏng lịch sử của chính những em đó.
          </SectionNote>
        </div>
      </Card>

      <Card title="Chương trình" className="min-w-0" bodyClass="p-0">
        {programmes.loading ? <div className="p-4"><Skeleton rows={3} /></div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr>
                <th className="th">Chương trình</th>
                <th className="th text-right">Số tuần</th><th className="th text-right">Giữa khoá</th>
                <th className="th text-right">Cuối khoá</th><th className="th text-right">Lớp</th><th className="th" />
              </tr>
            </thead>
            <tbody>
              {[...(programmes.data ?? [])].sort((a, b) => thuTu(a) - thuTu(b)).map((p) => {
                const kh = kyHieuLop(p.code, null);
                return (
                  <tr key={p.code} className={`row-hover ${p.status !== 'active' ? 'opacity-50' : ''}`}>
                    <td className="td whitespace-nowrap">
                      <span className="text-slate-100">{kh ?? p.name}</span>
                      {kh && <span className="ml-1.5 text-xs text-slate-500">{p.name}</span>}
                      {p.status !== 'active' && <span className="ml-1.5"><Info pending>ngừng dùng</Info></span>}
                    </td>
                    <td className="td text-right tabular-nums text-slate-300">{p.weeks ?? '—'}</td>
                    <td className="td text-right tabular-nums text-slate-400">{moc(p, 'progress') ?? '—'}</td>
                    <td className="td text-right tabular-nums text-slate-400">{moc(p, 'final') ?? '—'}</td>
                    <td className="td text-right tabular-nums text-slate-400">{p.classes || '—'}</td>
                    <td className="td text-right">
                      <button className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setEditProg(p)}>Sửa</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
        {ghiChu && <p className="px-4 pt-3 text-xs text-ok" role="status">{ghiChu}</p>}
        <div className="p-3">
          <SectionNote>
            Sửa được tên, số tuần, tuần Giữa/Cuối khoá. Số mới <strong>áp cho lớp tạo sau khi lưu</strong> — lớp đang
            học giữ số tuần lúc tạo. Cách chấm và bộ môn của chương trình không đổi ở đây: đổi là đổi ý nghĩa của điểm đã nhập.
          </SectionNote>
        </div>
      </Card>

      {editRoute && (
        <RouteDialog row={editRoute}
          onClose={() => setEditRoute(null)}
          onDone={() => { setEditRoute(null); routes.reload(); invalidate('/ref/routes'); }} />
      )}
      {editProg && (
        <ProgrammeDialog row={editProg}
          onClose={() => setEditProg(null)}
          onDone={(kq) => {
            const ten = kyHieuLop(editProg.code, null) ?? editProg.name;
            setGhiChu(`${ten}: áp cho lớp tạo sau khi lưu${kq.lopGiuSoCu
              ? ` · ${kq.lopGiuSoCu} lớp đang học giữ ${kq.soTuanCu ? `${kq.soTuanCu} tuần` : 'số tuần cũ'}` : ''}`);
            setEditProg(null); programmes.reload(); invalidate('/ref/programmes');
          }} />
      )}
    </div>
  );
}

function RouteDialog({ row, onClose, onDone }: { row: RouteRow; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: row.name, note: row.note ?? '', active: row.status === 'active' });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/admin/routes', { code: row.code, name: f.name, note: f.note, status: f.active ? 'active' : 'inactive' });
      toast.push('ok', 'Đã lưu lộ trình');
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={`Sửa lộ trình ${row.code}`} onDong={onClose}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy || !f.name.trim()}>Lưu</button>,
      }}>
      <div className="space-y-4 pt-3">
        <Field label="Tên gọi" required>
          <input className="field w-full" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Ghi chú">
          <input className="field w-full" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          Còn dùng — bỏ dấu này thì lộ trình biến mất khỏi các ô chọn khi tạo mới, lớp cũ giữ nguyên
        </label>
        {row.inUse > 0 && (
          <SectionNote>
            Đang có <strong className="tabular-nums">{row.inUse}</strong> lớp và lộ trình học viên dùng mã này. Ngừng dùng thì
            không ai chọn được nữa khi tạo mới, nhưng những bản ghi cũ vẫn đọc được bình thường.
          </SectionNote>
        )}
      </div>
    </KhungPanel>
  );
}

function ProgrammeDialog({ row, onClose, onDone }: {
  row: Programme; onClose: () => void; onDone: (kq: KetQuaLuu) => void;
}) {
  const toast = useToast();
  const coGiuaKhoa = moc(row, 'progress') !== null;
  const [f, setF] = useState({
    name: row.name,
    weeks: row.weeks ? String(row.weeks) : '',
    progressWeek: String(moc(row, 'progress') ?? ''),
    finalWeek: String(moc(row, 'final') ?? ''),
    active: row.status === 'active',
  });
  const [busy, setBusy] = useState(false);
  const kh = kyHieuLop(row.code, null);

  const save = async () => {
    setBusy(true);
    try {
      const kq = await api.put<KetQuaLuu>('/admin/programmes', {
        code: row.code, name: f.name,
        weeks: f.weeks.trim() === '' ? null : Number(f.weeks),
        progressWeek: coGiuaKhoa && f.progressWeek ? Number(f.progressWeek) : null,
        finalWeek: f.finalWeek ? Number(f.finalWeek) : null,
        status: f.active ? 'active' : 'inactive',
      });
      toast.push('ok', 'Đã lưu chương trình');
      onDone(kq);
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={`Sửa chương trình ${kh ?? row.name}`} onDong={onClose}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy || !f.name.trim()}>Lưu</button>,
      }}>
      <div className="space-y-4 pt-3">
        <Field label="Tên gọi" required>
          <input className="field w-full" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <p className="text-xs text-slate-500">
          {row.scoringMode === 'ratio' ? 'Chấm theo tỷ lệ' : 'Chấm theo band IELTS'} · {boMon(row)}
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Số tuần" hint={row.weeks ? undefined : 'Để trống nếu khoá không cố định (như lớp FT).'}>
            <input type="number" min={1} max={104} className="field w-full tabular-nums" value={f.weeks}
              onChange={(e) => setF({
                ...f, weeks: e.target.value,
                /* Cuối khoá đang = số tuần thì đi theo số tuần mới (5 → 6 thì Cuối khoá cũng 6). */
                finalWeek: f.finalWeek === f.weeks ? e.target.value : f.finalWeek,
              })} />
          </Field>
          {f.weeks.trim() !== '' && coGiuaKhoa && (
            <Field label="Tuần Giữa khoá">
              <input type="number" min={1} className="field w-full tabular-nums" value={f.progressWeek}
                onChange={(e) => setF({ ...f, progressWeek: e.target.value })} />
            </Field>
          )}
          {f.weeks.trim() !== '' && (
            <Field label="Tuần Cuối khoá" hint="Bỏ trống = số tuần.">
              <input type="number" min={1} className="field w-full tabular-nums" value={f.finalWeek} placeholder={f.weeks}
                onChange={(e) => setF({ ...f, finalWeek: e.target.value })} />
            </Field>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          Còn dùng — bỏ dấu này thì chương trình biến mất khỏi ô chọn khi tạo lớp mới
        </label>

        {row.classes > 0 && (
          <SectionNote>
            Có <strong className="tabular-nums">{row.classes}</strong> lớp dùng chương trình này (kể cả lớp đã kết thúc). Số tuần và mốc mới chỉ
            áp cho lớp tạo sau khi lưu; lớp đang học giữ số tuần lúc tạo, điểm đã nhập không đổi.
          </SectionNote>
        )}
      </div>
    </KhungPanel>
  );
}
