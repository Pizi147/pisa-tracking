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
import { dich, t } from '@shared/i18n/index.ts';
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
  { key: 'accounts', label: t('Tài khoản') },
  { key: 'catalog', label: t('Chương trình') },
  { key: 'band', label: t('Bảng quy đổi') },
  { key: 'config', label: t('Quyền & nhật ký') },
  { key: 'da-xoa', label: t('Đã xoá') },
] as const;

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const quanTri = !!useSession().session?.nav?.admin;
  const tabs = quanTri ? TABS : TABS.filter((x) => x.key === 'band' || x.key === 'da-xoa');
  const tab = tabs.find((x) => x.key === params.get('tab'))?.key ?? tabs[0].key;
  /* Đổi tab: bỏ bộ lọc của tab cũ (bộ lọc Tài khoản cũng ở URL), thêm một mục lịch sử để Quay lại về tab trước. */
  const setTab = (k: (typeof TABS)[number]['key']) => setParams(k === 'accounts' ? {} : { tab: k });
  const { data, loading, error, reload } = useApi<AdminData>(tab === 'config' ? '/admin/overview' : null, [tab]);

  return (
    <div className="page space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">{quanTri ? t('Quản trị hệ thống') : tab === 'da-xoa' ? t('Quản trị') : t('Bảng quy đổi band')}</h1>
        {(quanTri || tab === 'band') && (
          <p className="text-xs text-slate-500 mt-0.5">
            {quanTri ? t('Tài khoản, danh mục và cấu hình quyền của phần mềm.') : t('Quản trị hệ thống sửa; Quản lý xem.')}
          </p>
        )}
      </div>

      {tabs.length > 1 && (
        <div data-hd="qt-tab">
          <HangTab panelId="qt-vung" ariaLabel={t('Quản trị hệ thống')} value={tab} onChange={setTab}
            tabs={tabs.map((x) => ({ key: x.key, label: x.label }))} />
        </div>
      )}

      {/* DON-NHO-3 (TAB-A11Y): vùng tab cùng space-y-4 của trang → khoảng cách không đổi. */}
      <div id="qt-vung" role="tabpanel" aria-label={t('Quản trị hệ thống')} className="space-y-4">
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
          [t('Học viên'), data.counts.students], [t('Lớp'), data.counts.classes],
          [t('Lượt Mock'), data.counts.attempts], [t('Case SOS'), data.counts.cases],
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
        <Card title={t('Đơn vị báo cáo')}>
          <ul className="text-sm space-y-1.5 list-none p-0 m-0">
            {data.units.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <span className="text-slate-100">{u.name}</span>
                <Info>{u.kind === 'branch' ? t('Chi nhánh') : t('Đơn vị độc lập')}</Info>
              </li>
            ))}
          </ul>
          <SectionNote>{t('Tutor part-time là đơn vị báo cáo riêng, không phải chi nhánh thứ sáu.')}</SectionNote>
        </Card>

        <Card title={t('Nhật ký thay đổi gần nhất')} bodyClass="p-0">
          <ul className="divide-y list-none p-0 m-0" style={{ borderColor: 'var(--line)' }}>
            {data.audit.map((a) => (
              <li key={a.id} className="px-4 py-2 text-xs">
                <span className="text-slate-200" title={a.action}>{dich(nhanHanhDongNhatKy(a.action))}</span>
                <span className="text-slate-500"> · {a.entityLabel ? dich(nhanDoiTuongNhatKy(a.entityLabel)) : a.entityType}</span>
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
  /* EN-SOT: tên vai / quyền / ghi chú GVCN máy chủ gửi bằng chữ Việt — dịch ở chỗ hiện. `khoa[].lyDo` giữ Việt (so với `lyDoCamVai`), dịch khi hiện. */
  const d = mt.data && {
    ...mt.data,
    vai: mt.data.vai.map((v) => ({ ...v, ten: dich(v.ten) })),
    quyen: mt.data.quyen.map((q) => ({ ...q, ten: dich(q.ten) })),
    suyRaGv: mt.data.suyRaGv.map((x) => ({ ...x, ghiChu: dich(x.ghiChu) })),
  };

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

  if (mt.error) return <Card title={t('Quyền theo vai trò')}><ErrorState message={mt.error.message} hint={mt.error.hint} status={mt.error.status} onRetry={mt.reload} /></Card>;
  if (!d) return <Card title={t('Quyền theo vai trò')}><Skeleton rows={8} /></Card>;

  const moTa = MO_TA_QUYEN as Record<string, { nhom: string; moTa: string; phamVi?: string } | undefined>;
  const nhom = [
    ...NHOM_QUYEN.map((g) => ({ key: g.key as string, ten: dich(g.ten), quyen: d.quyen.filter((q) => moTa[q.key]?.nhom === g.key) })),
    { key: 'khac', ten: t('Chưa xếp nhóm'), quyen: d.quyen.filter((q) => !moTa[q.key]) },
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
      toast.push('ok', t('Đã lưu {n} thay đổi quyền', { n: thayDoi.length }));
      setXacNhan(false); setDoi(new Set()); setDangSua(false); mt.reload(); onDaLuu();
    } catch (e: any) {
      /* Lỗi thì giữ các ô đã đổi để sửa rồi lưu lại — không bắt bấm lại từ đầu. */
      setXacNhan(false); toast.push('error', e?.message ?? t('Không lưu được'));
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
      <span title={ghiChu ?? (nhuGv ? t('Có vì GVCN cũng là Giáo viên') : t('Không tự có theo chủ nhiệm'))}
        className={chip ? 'inline-flex min-h-[32px] items-center gap-1 rounded-md border border-dashed border-muted-line px-2 text-xs text-slate-300'
          : `block text-sm ${ghiChu ? 'text-sky-200' : nhuGv ? 'text-slate-400' : 'text-slate-500'}`}>
        {chip && `${t('GVCN')}: `}{ghiChu || nhuGv ? t('có') : '—'}
        {ghiChu && <span className={`${chip ? '' : 'block '}text-xs text-slate-400`}>{t('chỉ lớp chủ nhiệm')}</span>}
      </span>
    );
  };
  const dauNhom = (g: { key: string; ten: string; quyen: unknown[] }) => (
    <button type="button" aria-expanded={!gap.has(g.key)} onClick={() => doiGap(g.key)}
      className="flex w-full min-h-[44px] sm:min-h-[36px] items-center gap-2 border-0 bg-transparent px-4 text-left text-xs font-bold  text-slate-300">
      <span className="flex-1">{g.ten}</span>
      <span className="font-normal normal-case tabular-nums text-slate-500">{t('{n} quyền', { n: g.quyen.length })}</span>
      <span className="text-slate-400"><IconGap mo={!gap.has(g.key)} /></span>
    </button>
  );
  const tenVaMoTa = (q: { key: string; ten: string }) => {
    const m = moTa[q.key];
    const ds = khoaCuaQuyen(q.key);
    return (
      <>
        <span className="block text-slate-100">{q.ten}</span>
        {m && <span className="block text-xs text-slate-400">{dich(m.moTa)}</span>}
        {m?.phamVi && <span className="block text-xs text-slate-500">{dich(m.phamVi)}</span>}
        {ds.map((k) => (
          <span key={k.lyDo} className="mt-0.5 flex items-start gap-1 text-xs text-slate-400">
            <IconKhoa className="mt-0.5" /><span><span className="text-slate-300">{k.vai.join(', ')}:</span> {dich(k.lyDo)}</span>
          </span>
        ))}
      </>
    );
  };

  return (
    <Card title={t('Quyền theo vai trò')} bodyClass="p-0"
      action={!dangSua && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setDangSua(true)}>{t('Sửa quyền')}</button>}>
      {/* ≥ 640px: bảng. Cột "Quyền" rộng nhất vì mang mô tả; cột vai hẹp, căn giữa. */}
      <div className="hidden sm:block table-scroll bang-dinh">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th className="sticky-col" hint={t('Mỗi dòng là một việc cụ thể. Chữ “có” nghĩa là vai đó được làm việc này.')}>{t('Quyền')}</Th>
              {d.vai.map((v) => (
                <Th key={v.key} align="center"
                  hint={t('Bấm "Sửa quyền", rồi bấm một ô trong cột này để bật hoặc tắt quyền đó cho vai trò {vai}. Đang có {n} tài khoản mang vai này.', { vai: v.ten, n: v.soNguoi })}>
                  {v.ten}<span className="block text-[12px] font-normal normal-case tracking-normal text-slate-500 tabular-nums">{t('{n} tài khoản', { n: v.soNguoi })}</span>
                </Th>
              ))}
              <Th align="center" hint={t('Chỉ đọc. GVCN có mọi quyền của Giáo viên, cộng các quyền tự có theo phân công chủ nhiệm — chỉ trong lớp mình chủ nhiệm.')}>
                {t('GVCN')}<span className="block text-[12px] font-normal normal-case tracking-normal text-slate-500">{t('chỉ đọc')}</span>
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
            {doi.size ? t('{n} thay đổi · ảnh hưởng {m} tài khoản', { n: doi.size, m: soAnhHuong }) : t('Chưa đổi ô nào')}
          </span>
          <span className="flex-1" />
          <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={huy}>{doi.size ? t('Huỷ thay đổi') : t('Đóng')}</button>
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !doi.size} onClick={() => setXacNhan(true)}>{t('Lưu')}</button>
        </div>
      )}

      <ConfirmDialog open={xacNhan} onClose={() => setXacNhan(false)} onConfirm={luu} busy={busy}
        title={t('Lưu thay đổi quyền theo vai trò')} confirmLabel={t('Lưu {n} thay đổi', { n: doi.size })}
        body={
          <>
            <p className="m-0">{t('Quyền mới có hiệu lực ngay với')} <strong>{t('mọi tài khoản')}</strong> {t('mang vai đó, ở mọi chi nhánh của họ.')}</p>
            <ul className="mt-3 mb-0 list-none space-y-2.5 p-0">
              {theoVai.map(({ v, ds }) => (
                <li key={v.key}>
                  <span className="text-slate-100 font-semibold">{v.ten}</span>
                  <span className="text-slate-400"> · {t('ảnh hưởng {n} tài khoản', { n: v.soNguoi })}</span>
                  <ul className="m-0 mt-1 list-none space-y-0.5 pl-3 text-xs">
                    {ds.map((p) => (
                      <li key={p}>{trangThai(v.key, p).coSan ? t('Tắt') : t('Bật')}: {tenQuyen.get(p) ?? p}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        } />

      <div className="p-3">
        <SectionNote>
          {t('Quyền = quyền của vai trò × phạm vi chi nhánh của CHÍNH grant đó × phân công lớp/kỹ năng. Không vai trò nào mặc định thấy toàn hệ thống: chỉ grant không gắn chi nhánh mới phủ toàn bộ.')}
          <br />
          {t('Bấm "Sửa quyền", đổi các ô cần đổi rồi bấm Lưu: hộp xác nhận liệt kê từng thay đổi và số tài khoản bị ảnh hưởng. Chỉ các ô đã đổi được gửi, mỗi ô một dòng nhật ký ở cuối trang (sửa bảng quyền là việc phải tra lại được). Bấm "Huỷ thay đổi" thì không ghi gì.')}
          <br />
          <strong>{t('Ô có dấu khoá không bấm được')}</strong>{t(', lý do ghi ngay dưới tên quyền: hai quyền')} <strong>{t('Cấu hình hệ thống')}</strong> {t('và')}
          <strong> {t('Xem học viên')}</strong> {t('của vai Quản trị hệ thống không gỡ được (gỡ xong thì không còn ai vào lại được màn này);')}
          <strong> {t('Chốt tuần MT')}</strong> {t('không bật cho Giáo viên (SCH-01: giáo viên chỉ dời lịch lớp thường, chốt tuần MT và xếp lịch Fast Track là việc của Quản lý); quyền phân công GV bộ môn chỉ tự có theo chủ nhiệm, không bật theo vai.')}
          <br />
          <strong>{t('Cột GVCN (chỉ đọc):')}</strong> {t('GVCN có mọi quyền của Giáo viên, cộng các quyền tự có theo phân công chủ nhiệm — chỉ trong lớp mình chủ nhiệm, không bật/tắt ở đây. Đổi quyền của GVCN là đổi phân công chủ nhiệm ở màn Lớp.')}
          <br />
          <strong>{t('Quyền dẫn xuất khác (không có ô bật/tắt):')}</strong> <em>{t('Xem hồ sơ giáo viên')}</em> {t('— chính mình; Quản lý: giáo viên thuộc chi nhánh mình (có vai hoặc đang dạy lớp ở đó); Quản trị hệ thống: tất cả.')}
          {' '}<em>{t('Xuất Excel kết quả Test')}</em> {t('— Quản lý và Quản trị hệ thống (trong phạm vi của mình), Giáo viên chủ nhiệm (lớp mình chủ nhiệm).')}
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
  const lyDo = lyDoKhoa ? dich(lyDoKhoa) : null;
  const title = lyDo ?? (dangSua ? (co ? t('Bỏ quyền "{quyen}" cho vai trò {vai}', { quyen: tenQuyen, vai: tenVai }) : t('Cấp quyền "{quyen}" cho vai trò {vai}', { quyen: tenQuyen, vai: tenVai })) : t('Bấm "Sửa quyền" để đổi'));
  return (
    <button
      type="button"
      disabled={!dangSua}
      aria-disabled={!bamDuoc || undefined}
      aria-pressed={bamDuoc ? co : undefined}
      aria-label={`${tenVai}: ${co ? t('có') : t('không')}${lyDo ? `, ${t('khoá')} — ${lyDo}` : ''}`}
      title={title}
      className={`${chip ? 'inline-flex min-h-[44px] items-center gap-1 rounded-md px-2 text-xs' : 'w-full min-h-[44px] sm:min-h-[36px] text-sm'} bg-transparent tabular-nums ${co ? 'text-sky-200' : 'text-slate-500'} ${
        daDoi ? 'rounded-md border border-[color:var(--accent-line)]' : chip ? 'border border-muted-line' : 'border border-transparent'} ${bamDuoc ? 'cursor-pointer bam' : 'cursor-default'}`}
      onClick={() => { if (bamDuoc) onBam(); }}
    >
      {chip && <span className="text-slate-300">{tenVai}:</span>}
      {co ? t('có') : '—'}
      {lyDoKhoa && <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-slate-400"><IconKhoa />{t('khoá')}</span>}
      {daDoi && <span className="ml-1 text-xs text-slate-400">{t('đổi')}</span>}
    </button>
  );
}
