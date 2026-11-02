import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Info, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { api } from '../../lib/api.ts';
import { AccountsAdmin } from './AccountsAdmin.tsx';
import { CatalogAdmin } from './CatalogAdmin.tsx';
import { BangQuyDoiAdmin } from './BangQuyDoiAdmin.tsx';
import { DaXoaAdmin } from './DaXoaAdmin.tsx';
import { t as tChu } from '@shared/i18n/index.ts';
import { useSession } from '../../lib/session.tsx';
import { fmtDateTime, roleLabel } from '../../lib/format.ts';
import { MO_TA_QUYEN, NHOM_QUYEN, lyDoCamVai, nhanDoiTuongNhatKy, nhanHanhDongNhatKy } from '@shared/domain/index.ts';

type AdminData = {
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
 *   CHƯƠNG TRÌNH  chương trình + FT theo lộ trình — tên, đạt từ, số tuần, mốc Test; áp cho lớp mở sau (OV-6b1); không thêm mã mới (K1-48).
 *   CẤU HÌNH   ma trận quyền theo vai (`/admin/permissions/matrix`), đơn vị báo cáo, nhật ký thay đổi (`/admin/overview`).
 *   BẢNG QUY ĐỔI  số câu L / R → band (BAND-QUY-DOI) — Quản lý (không có `nav.admin`) vào trang này chỉ thấy tab này + Đã xoá, chỉ đọc.
 *   ĐÃ XOÁ  thùng rác 30 ngày (Q-RL2a) — Case / PA / vi phạm / tệp, khôi phục tại dòng; máy chủ lọc mục theo quyền người xem.
 *
 * Tab nằm trên URL (`?tab=`, OV-11b QT-10g): rời trang rồi Quay lại về đúng tab.
 */
const TABS = [
  { key: 'accounts', label: 'Tài khoản' },
  { key: 'catalog', label: 'Chương trình' },
  { key: 'band', label: 'Bảng quy đổi' },
  { key: 'config', label: 'Quyền & nhật ký' },
  { key: 'da-xoa', label: 'Đã xoá' },
] as const;

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const quanTri = !!useSession().session?.nav?.admin;
  const tabs = quanTri ? TABS : TABS.filter((t) => t.key === 'band' || t.key === 'da-xoa');
  const tab = tabs.find((t) => t.key === params.get('tab'))?.key ?? tabs[0].key;
  /* Đổi tab: bỏ bộ lọc của tab cũ (bộ lọc Tài khoản cũng ở URL), thêm một mục lịch sử để Quay lại về tab trước. */
  const setTab = (k: (typeof TABS)[number]['key']) => setParams(k === 'accounts' ? {} : { tab: k });
  const { data, loading, error, reload } = useApi<AdminData>(tab === 'config' ? '/admin/overview' : null, [tab]);

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">{quanTri ? 'Quản trị hệ thống' : tab === 'da-xoa' ? tChu('Quản trị') : 'Bảng quy đổi band'}</h1>
        {(quanTri || tab === 'band') && (
          <p className="text-xs text-slate-500 mt-0.5">
            {quanTri ? 'Tài khoản, danh mục và cấu hình quyền của phần mềm.' : 'Quản trị hệ thống sửa; Quản lý xem.'}
          </p>
        )}
      </div>

      {tabs.length > 1 && (
        <div data-hd="qt-tab">
          <HangTab panelId="qt-vung" ariaLabel="Quản trị hệ thống" value={tab} onChange={setTab}
            tabs={tabs.map((t) => ({ key: t.key, label: t.key === 'da-xoa' ? tChu(t.label) : t.label }))} />
        </div>
      )}

      {/* DON-NHO-3 (TAB-A11Y): vùng tab cùng space-y-4 của trang → khoảng cách không đổi. */}
      <div id="qt-vung" role="tabpanel" aria-label="Quản trị hệ thống" className="space-y-4">
        {tab === 'accounts' && <AccountsAdmin />}
        {tab === 'catalog' && <CatalogAdmin />}
        {tab === 'band' && <BangQuyDoiAdmin />}
        {tab === 'da-xoa' && <DaXoaAdmin />}
        {tab === 'config' && error && <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />}
        {tab === 'config' && (loading || !data) && !error && <Skeleton rows={8} />}
        {tab === 'config' && data && <ConfigTab data={data} onDone={reload} />}
      </div>
    </div>
  );
}

function ConfigTab({ data, onDone }: { data: AdminData; onDone: () => void }) {
  return (
    <div className="space-y-4">

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Học viên', data.counts.students], ['Lớp', data.counts.classes],
          ['Lượt Mock', data.counts.attempts], ['Case SOS', data.counts.cases],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-4">
            <div className="text-[12px]  text-slate-400 font-semibold">{label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{value}</div>
          </div>
        ))}
      </div>

      {/* Sửa quyền xong thì tải lại cả tổng quan: nhật ký cuối trang có dòng mới. */}
      <QuyenTheoVai onDaLuu={onDone} />

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
          <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
            {data.audit.map((a) => (
              <li key={a.id} className="px-4 py-2 text-xs">
                <span className="text-slate-200" title={a.action}>{nhanHanhDongNhatKy(a.action)}</span>
                <span className="text-slate-500"> · {a.entityLabel ? nhanDoiTuongNhatKy(a.entityLabel) : a.entityType}</span>
                <div className="text-slate-500">{a.actorName ?? '—'} · {fmtDateTime(a.createdAt)}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

    </div>
  );
}

type MaTran = {
  vai: { key: string; ten: string; soNguoi: number }[];
  quyen: { key: string; ten: string }[];
  co: Record<string, string[]>;
  suyRaGv: { quyen: string; ai: 'GV' | 'GVCN'; ghiChu: string }[];
  khoa: { vai: string; quyen: string; lyDo: string }[];
};
type TrangThaiO = { coSan: boolean; daDoi: boolean; lyDoKhoa: string | null };

/**
 * QUYỀN THEO VAI TRÒ (PR-QU QU-7) — ma trận vai × quyền chia theo `NHOM_QUYEN`, mỗi quyền một câu mô tả + ghi chú phạm vi.
 * Cột GVCN chỉ đọc (quyền tự có theo phân công chủ nhiệm, `suyRaGv`). Ô bị khoá (chống tự khoá, SCH-01, quyền chỉ suy ra) không
 * bấm được và nói lý do ngay dưới tên quyền — không chỉ bằng màu, không chỉ ở tooltip (điện thoại không có tooltip).
 * UX-C7 (Q23) giữ nguyên: "Sửa quyền" → đổi tạm → Lưu gửi chỉ các ô đã đổi; trước khi gửi có hộp xác nhận "Ảnh hưởng n tài khoản".
 * Từ 640px trở lên là bảng; nhỏ hơn là danh sách theo nhóm, mỗi quyền một hàng chip vai (không cuộn ngang trang).
 */
function QuyenTheoVai({ onDaLuu }: { onDaLuu: () => void }) {
  const toast = useToast();
  const mt = useApi<MaTran>('/admin/permissions/matrix');
  const [dangSua, setDangSua] = useState(false);
  const [doi, setDoi] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [xacNhan, setXacNhan] = useState(false);
  const [gap, setGap] = useState<ReadonlySet<string>>(new Set());
  const d = mt.data;

  const khoa = (r: string, p: string) => `${r}|${p}`;
  const bam = (r: string, p: string) => setDoi((s) => { const n = new Set(s); if (n.has(khoa(r, p))) n.delete(khoa(r, p)); else n.add(khoa(r, p)); return n; });
  const doiGap = (k: string) => setGap((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const huy = () => { setDoi(new Set()); setDangSua(false); };

  const trangThai = (r: string, p: string): TrangThaiO => {
    const coSan = !!d?.co[r]?.includes(p);
    /*
     * Khoá theo CHIỀU sẽ bấm: ô đang có chỉ khoá khi gỡ là tự khoá mình (Quản trị); ô chưa có chỉ khoá khi bật bị cấm (SCH-01, quyền chỉ
     * suy ra — cùng câu với `lyDoCamVai` ở máy chủ). Dữ liệu cũ lỡ có ô bị cấm thì vẫn gỡ được.
     */
    const cam = lyDoCamVai(r, p);
    const ds = d?.khoa.filter((k) => k.vai === r && k.quyen === p) ?? [];
    const lyDoKhoa = (coSan ? ds.find((k) => k.lyDo !== cam) : ds.find((k) => k.lyDo === cam))?.lyDo ?? null;
    return { coSan, daDoi: doi.has(khoa(r, p)), lyDoKhoa };
  };

  if (mt.error) return <Card title="Quyền theo vai trò"><ErrorState message={mt.error.message} hint={mt.error.hint} status={mt.error.status} onRetry={mt.reload} /></Card>;
  if (!d) return <Card title="Quyền theo vai trò"><Skeleton rows={8} /></Card>;

  const moTa = MO_TA_QUYEN as Record<string, { nhom: string; moTa: string; phamVi?: string } | undefined>;
  const nhom = [
    ...NHOM_QUYEN.map((g) => ({ key: g.key as string, ten: g.ten, quyen: d.quyen.filter((q) => moTa[q.key]?.nhom === g.key) })),
    { key: 'khac', ten: 'Chưa xếp nhóm', quyen: d.quyen.filter((q) => !moTa[q.key]) },
  ].filter((g) => g.quyen.length > 0);
  const gvcn = new Map(d.suyRaGv.filter((x) => x.ai === 'GVCN').map((x) => [x.quyen, x.ghiChu]));
  const tenQuyen = new Map(d.quyen.map((q) => [q.key, q.ten]));

  /* Lý do khoá của một quyền, gộp các vai cùng lý do: "Quản lý, Giáo viên: …". */
  const khoaCuaQuyen = (p: string) => {
    const m = new Map<string, string[]>();
    for (const v of d.vai) { const l = trangThai(v.key, p).lyDoKhoa; if (l) m.set(l, [...(m.get(l) ?? []), v.ten]); }
    return [...m.entries()].map(([lyDo, vai]) => ({ lyDo, vai }));
  };

  const theoVai = d.vai
    .map((v) => ({ v, ds: [...doi].filter((k) => k.startsWith(`${v.key}|`)).map((k) => k.slice(v.key.length + 1)) }))
    .filter((x) => x.ds.length > 0);
  const soAnhHuong = theoVai.reduce((n, x) => n + x.v.soNguoi, 0);

  const luu = async () => {
    if (!doi.size || busy) return;
    setBusy(true);
    try {
      const thayDoi = [...doi].map((k) => { const [roleKey, permissionKey] = k.split('|'); return { roleKey, permissionKey, granted: !trangThai(roleKey, permissionKey).coSan }; });
      await api.put('/admin/role-permissions', { thayDoi });
      toast.push('ok', `Đã lưu ${thayDoi.length} thay đổi quyền`);
      setXacNhan(false); setDoi(new Set()); setDangSua(false); mt.reload(); onDaLuu();
    } catch (e: any) {
      /* Lỗi thì giữ các ô đã đổi để sửa rồi lưu lại — không bắt bấm lại từ đầu. */
      setXacNhan(false); toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  const oVai = (v: MaTran['vai'][number], q: { key: string; ten: string }, chip: boolean) => (
    <OVai key={v.key} tenVai={v.ten} tenQuyen={q.ten} {...trangThai(v.key, q.key)} chip={chip}
      dangSua={dangSua && !busy} onBam={() => bam(v.key, q.key)} />
  );
  const oGvcn = (q: { key: string }, chip: boolean) => {
    const ghiChu = gvcn.get(q.key);
    const nhuGv = !ghiChu && !!d.co.teacher?.includes(q.key);
    if (chip && !ghiChu) return null;
    return (
      <span title={ghiChu ?? (nhuGv ? 'Có vì GVCN cũng là Giáo viên' : 'Không tự có theo chủ nhiệm')}
        className={chip ? 'inline-flex min-h-[32px] items-center gap-1 rounded-md border border-dashed border-muted-line px-2 text-xs text-slate-300'
          : `block text-sm ${ghiChu ? 'text-sky-200' : nhuGv ? 'text-slate-400' : 'text-slate-500'}`}>
        {chip && 'GVCN: '}{ghiChu || nhuGv ? 'có' : '—'}
        {ghiChu && <span className={`${chip ? '' : 'block '}text-xs text-slate-400`}>chỉ lớp chủ nhiệm</span>}
      </span>
    );
  };
  const dauNhom = (g: { key: string; ten: string; quyen: unknown[] }) => (
    <button type="button" aria-expanded={!gap.has(g.key)} onClick={() => doiGap(g.key)}
      className="flex w-full min-h-[44px] sm:min-h-[36px] items-center gap-2 border-0 bg-transparent px-4 text-left text-xs font-bold  text-slate-300">
      <span className="flex-1">{g.ten}</span>
      <span className="font-normal normal-case tabular-nums text-slate-500">{g.quyen.length} quyền</span>
      <span className="text-slate-400"><IconGap mo={!gap.has(g.key)} /></span>
    </button>
  );
  const tenVaMoTa = (q: { key: string; ten: string }) => {
    const m = moTa[q.key];
    const ds = khoaCuaQuyen(q.key);
    return (
      <>
        <span className="block text-slate-100">{q.ten}</span>
        {m && <span className="block text-xs text-slate-400">{m.moTa}</span>}
        {m?.phamVi && <span className="block text-xs text-slate-500">{m.phamVi}</span>}
        {ds.map((k) => (
          <span key={k.lyDo} className="mt-0.5 flex items-start gap-1 text-xs text-slate-400">
            <IconKhoa className="mt-0.5" /><span><span className="text-slate-300">{k.vai.join(', ')}:</span> {k.lyDo}</span>
          </span>
        ))}
      </>
    );
  };

  return (
    <Card title="Quyền theo vai trò" bodyClass="p-0"
      action={!dangSua && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setDangSua(true)}>Sửa quyền</button>}>
      {/* ≥ 640px: bảng. Cột "Quyền" rộng nhất vì mang mô tả; cột vai hẹp, căn giữa. */}
      <div className="hidden sm:block table-scroll bang-dinh">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th className="sticky-col" hint="Mỗi dòng là một việc cụ thể. Chữ “có” nghĩa là vai đó được làm việc này.">Quyền</Th>
              {d.vai.map((v) => (
                <Th key={v.key} align="center"
                  hint={`Bấm "Sửa quyền", rồi bấm một ô trong cột này để bật hoặc tắt quyền đó cho vai trò ${v.ten}. Đang có ${v.soNguoi} tài khoản mang vai này.`}>
                  {v.ten}<span className="block text-[12px] font-normal normal-case tracking-normal text-slate-500 tabular-nums">{v.soNguoi} tài khoản</span>
                </Th>
              ))}
              <Th align="center" hint="Chỉ đọc. GVCN có mọi quyền của Giáo viên, cộng các quyền tự có theo phân công chủ nhiệm — chỉ trong lớp mình chủ nhiệm.">
                GVCN<span className="block text-[12px] font-normal normal-case tracking-normal text-slate-500">chỉ đọc</span>
              </Th>
            </tr>
          </thead>
          {nhom.map((g) => (
            <tbody key={g.key}>
              <tr><td colSpan={d.vai.length + 2} className="p-0 border-t" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>{dauNhom(g)}</td></tr>
              {!gap.has(g.key) && g.quyen.map((q) => (
                <tr key={q.key} className="row-hover">
                  <td className="td sticky-col min-w-[16rem]">{tenVaMoTa(q)}</td>
                  {d.vai.map((v) => <td key={v.key} className="td text-center p-0 align-middle">{oVai(v, q, false)}</td>)}
                  <td className="td text-center align-middle">{oGvcn(q, false)}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {/* < 640px: danh sách theo nhóm, mỗi quyền một hàng chip vai. */}
      <div className="sm:hidden">
        {nhom.map((g) => (
          <section key={g.key} className="border-t" style={{ borderColor: 'var(--line)' }}>
            {dauNhom(g)}
            {!gap.has(g.key) && (
              <ul className="list-none m-0 p-0">
                {g.quyen.map((q) => (
                  <li key={q.key} className="border-t px-4 py-2.5 text-sm" style={{ borderColor: 'var(--line)' }}>
                    {tenVaMoTa(q)}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {d.vai.map((v) => oVai(v, q, true))}
                      {oGvcn(q, true)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {dangSua && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t px-4 py-2.5" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          <span className="text-xs tabular-nums text-slate-400" role="status">
            {doi.size ? `${doi.size} thay đổi · ảnh hưởng ${soAnhHuong} tài khoản` : 'Chưa đổi ô nào'}
          </span>
          <span className="flex-1" />
          <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={huy}>{doi.size ? 'Huỷ thay đổi' : 'Đóng'}</button>
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !doi.size} onClick={() => setXacNhan(true)}>Lưu</button>
        </div>
      )}

      <ConfirmDialog open={xacNhan} onClose={() => setXacNhan(false)} onConfirm={luu} busy={busy}
        title="Lưu thay đổi quyền theo vai trò" confirmLabel={`Lưu ${doi.size} thay đổi`}
        body={
          <>
            <p className="m-0">Quyền mới có hiệu lực ngay với <strong>mọi tài khoản</strong> mang vai đó, ở mọi chi nhánh của họ.</p>
            <ul className="mt-3 mb-0 list-none space-y-2.5 p-0">
              {theoVai.map(({ v, ds }) => (
                <li key={v.key}>
                  <span className="text-slate-100 font-semibold">{v.ten}</span>
                  <span className="text-slate-400"> · ảnh hưởng <span className="tabular-nums">{v.soNguoi}</span> tài khoản</span>
                  <ul className="m-0 mt-1 list-none space-y-0.5 pl-3 text-xs">
                    {ds.map((p) => (
                      <li key={p}>{trangThai(v.key, p).coSan ? 'Tắt' : 'Bật'}: {tenQuyen.get(p) ?? p}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        } />

      <div className="p-3">
        <SectionNote>
          Quyền = quyền của vai trò × phạm vi chi nhánh của CHÍNH grant đó × phân công lớp/kỹ năng.
          Không vai trò nào mặc định thấy toàn hệ thống: chỉ grant không gắn chi nhánh mới phủ toàn bộ.
          <br />
          Bấm "Sửa quyền", đổi các ô cần đổi rồi bấm Lưu: hộp xác nhận liệt kê từng thay đổi và số tài khoản bị ảnh hưởng. Chỉ các ô
          đã đổi được gửi, mỗi ô một dòng nhật ký ở cuối trang (sửa bảng quyền là việc phải tra lại được). Bấm "Huỷ thay đổi" thì không ghi gì.
          <br />
          <strong>Ô có dấu khoá không bấm được</strong>, lý do ghi ngay dưới tên quyền: hai quyền <strong>Cấu hình hệ thống</strong> và
          <strong> Xem học viên</strong> của vai Quản trị hệ thống không gỡ được (gỡ xong thì không còn ai vào lại được màn này);
          <strong> Chốt tuần MT</strong> không bật cho Giáo viên (SCH-01: giáo viên chỉ dời lịch lớp thường, chốt tuần MT và xếp lịch
          Fast Track là việc của Quản lý); quyền phân công GV bộ môn chỉ tự có theo chủ nhiệm, không bật theo vai.
          <br />
          <strong>Cột GVCN (chỉ đọc):</strong> GVCN có mọi quyền của Giáo viên, cộng các quyền tự có theo phân công chủ nhiệm — chỉ trong
          lớp mình chủ nhiệm, không bật/tắt ở đây. Đổi quyền của GVCN là đổi phân công chủ nhiệm ở màn Lớp.
          <br />
          <strong>Quyền dẫn xuất khác (không có ô bật/tắt):</strong> <em>Xem hồ sơ giáo viên</em> — chính mình; Quản lý: giáo viên
          thuộc chi nhánh mình (có vai hoặc đang dạy lớp ở đó); Quản trị hệ thống: tất cả. <em>Xuất Excel kết quả Test</em> —
          Quản lý và Quản trị hệ thống (trong phạm vi của mình), Giáo viên chủ nhiệm (lớp mình chủ nhiệm).
        </SectionNote>
      </div>
    </Card>
  );
}

/** Ổ khoá 12 px — ô vai × quyền không bấm được (đi kèm chữ "khoá" và lý do, không chỉ dựa vào hình). */
function IconKhoa({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" width={12} height={12} className={`inline-block shrink-0 ${className}`}>
      <rect x="2.2" y="5.3" width="7.6" height="5.2" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 5.3V3.9a2 2 0 0 1 4 0v1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/**
 * MỘT Ô VAI × QUYỀN (UX-C7, Q23). Chỉ bấm được trong chế độ "Sửa quyền"; bấm là ĐỔI TẠM (chưa lưu), ô đã đổi có viền + chữ "đổi"
 * (không chỉ dựa vào màu). Ô khoá: dấu khoá + chữ "khoá", không bấm được, lý do ở `title` và dưới tên quyền.
 * `chip`: dạng chip "Tên vai: có" cho danh sách trên điện thoại.
 */
function OVai({ tenVai, tenQuyen, coSan, daDoi, lyDoKhoa, dangSua, onBam, chip }: TrangThaiO & {
  tenVai: string; tenQuyen: string; dangSua: boolean; onBam: () => void; chip: boolean;
}) {
  const co = daDoi ? !coSan : coSan;
  const bamDuoc = dangSua && !lyDoKhoa;
  const title = lyDoKhoa ?? (dangSua ? `${co ? 'Bỏ' : 'Cấp'} quyền "${tenQuyen}" cho vai trò ${tenVai}` : 'Bấm "Sửa quyền" để đổi');
  return (
    <button
      type="button"
      disabled={!dangSua}
      aria-disabled={!bamDuoc || undefined}
      aria-pressed={bamDuoc ? co : undefined}
      aria-label={`${tenVai}: ${co ? 'có' : 'không'}${lyDoKhoa ? `, khoá — ${lyDoKhoa}` : ''}`}
      title={title}
      className={`${chip ? 'inline-flex min-h-[44px] items-center gap-1 rounded-md px-2 text-xs' : 'w-full min-h-[44px] sm:min-h-[36px] text-sm'} bg-transparent tabular-nums ${co ? 'text-sky-200' : 'text-slate-500'} ${
        daDoi ? 'rounded-md border border-[color:var(--accent-line)]' : chip ? 'border border-muted-line' : 'border border-transparent'} ${bamDuoc ? 'cursor-pointer bam' : 'cursor-default'}`}
      onClick={() => { if (bamDuoc) onBam(); }}
    >
      {chip && <span className="text-slate-300">{tenVai}:</span>}
      {co ? 'có' : '—'}
      {lyDoKhoa && <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-slate-400"><IconKhoa />khoá</span>}
      {daDoi && <span className="ml-1 text-xs text-slate-400">đổi</span>}
    </button>
  );
}
