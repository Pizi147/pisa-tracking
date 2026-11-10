import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api } from '../../lib/api.ts';
import { Card, ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { IconGap } from '../../ui/BieuTuong.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import { MO_TA_QUYEN, NHOM_QUYEN, lyDoCamVai } from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type MaTran = {
  vai: { key: string; ten: string; soNguoi: number }[];
  quyen: { key: string; ten: string }[];
  co: Record<string, string[]>;
  suyRaGv: { quyen: string; ai: 'GV' | 'GVCN'; ghiChu: string }[];
  khoa: { vai: string; quyen: string; lyDo: string }[];
};
type ThayDoi = { roleKey: string; permissionKey: string; granted: boolean };
const GVCN = 'gvcn';

/**
 * QUYỀN THEO VAI (QTV2-QUYEN, chủ SP 11/11 "cập nhật vai trò và quyền hạn") — chọn MỘT vai (trái), bật / tắt từng quyền của vai đó (phải, nhóm theo
 * `NHOM_QUYEN`, tìm được). Thay ma trận 8 cột "có / —" + chế độ "Sửa quyền": Quản trị bấm thẳng công tắc → đổi tạm (chữ "đổi"), dải dưới "n thay đổi ·
 * ảnh hưởng m tài khoản" → hộp xác nhận (UX-C7 Q23 giữ: đổi quyền có hiệu lực ngay với mọi tài khoản của vai) → lưu một giao dịch → Hoàn tác (gửi ngược).
 * Ô khoá (tự khoá Quản trị, SCH-01, quyền chỉ suy ra): công tắc mờ + lý do một dòng tại hàng. GVCN: quyền tự có theo chủ nhiệm, chỉ đọc.
 * "So sánh mọi vai": ma trận cũ, chỉ đọc.
 */
export function QuyenTheoVai({ onDaLuu }: { onDaLuu: () => void }) {
  const toast = useToast();
  const dienThoai = useDienThoai();
  const mt = useApi<MaTran>('/admin/permissions/matrix');
  const [vai, setVai] = useState('manager');
  const [doi, setDoi] = useState<ReadonlySet<string>>(new Set());
  const [gap, setGap] = useState<ReadonlySet<string>>(new Set());
  const [tim, setTim] = useState('');
  const [busy, setBusy] = useState(false);
  const [xacNhan, setXacNhan] = useState(false);
  const [soSanh, setSoSanh] = useState(false);

  if (mt.error) return <Card title={t('Quyền theo vai trò')}><ErrorState message={mt.error.message} hint={mt.error.hint} status={mt.error.status} onRetry={mt.reload} /></Card>;
  if (!mt.data) return <Card title={t('Quyền theo vai trò')}><Skeleton rows={8} /></Card>;
  const d = mt.data;
  const khoa = (r: string, p: string) => `${r}|${p}`;
  const coSan = (r: string, p: string) => !!d.co[r]?.includes(p);
  /* Khoá theo CHIỀU sẽ bấm: đang có → khoá khi gỡ là tự khoá; chưa có → khoá khi bật bị cấm (cùng câu `lyDoCamVai` máy chủ). */
  const lyDoKhoa = (r: string, p: string) => {
    const cam = lyDoCamVai(r, p);
    const ds = d.khoa.filter((k) => k.vai === r && k.quyen === p);
    return (coSan(r, p) ? ds.find((k) => k.lyDo !== cam) : ds.find((k) => k.lyDo === cam))?.lyDo ?? null;
  };
  const co = (r: string, p: string) => (doi.has(khoa(r, p)) ? !coSan(r, p) : coSan(r, p));
  const bam = (r: string, p: string) => setDoi((s) => { const n = new Set(s); if (n.has(khoa(r, p))) n.delete(khoa(r, p)); else n.add(khoa(r, p)); return n; });
  const gvcn = new Map(d.suyRaGv.filter((x) => x.ai === 'GVCN').map((x) => [x.quyen, dich(x.ghiChu)]));
  const tenVai = (k: string) => (k === GVCN ? t('GVCN') : dich(d.vai.find((v) => v.key === k)?.ten ?? k));
  const moTa = MO_TA_QUYEN as Record<string, { nhom: string; moTa?: string; phamVi?: string } | undefined>;
  const q = tim.trim().toLowerCase();
  const nhom = [
    ...NHOM_QUYEN.map((g) => ({ key: g.key as string, ten: dich(g.ten), quyen: d.quyen.filter((x) => moTa[x.key]?.nhom === g.key) })),
    { key: 'khac', ten: t('Chưa xếp nhóm'), quyen: d.quyen.filter((x) => !moTa[x.key]) },
  ].map((g) => ({ ...g, quyen: g.quyen.filter((x) => !q || dich(x.ten).toLowerCase().includes(q)) })).filter((g) => g.quyen.length > 0);
  const thayDoi: ThayDoi[] = [...doi].map((k) => { const [roleKey, permissionKey] = k.split('|'); return { roleKey, permissionKey, granted: !coSan(roleKey, permissionKey) }; });
  const soAnhHuong = [...new Set(thayDoi.map((x) => x.roleKey))].reduce((n, r) => n + (d.vai.find((v) => v.key === r)?.soNguoi ?? 0), 0);
  const tenQuyen = new Map(d.quyen.map((x) => [x.key, dich(x.ten)]));
  const soQuyen = (r: string) => (r === GVCN ? gvcn.size : d.quyen.filter((x) => co(r, x.key)).length);

  const gui = (ds: ThayDoi[]) => api.put('/admin/role-permissions', { thayDoi: ds });
  const luu = async () => {
    if (!thayDoi.length || busy) return;
    setBusy(true);
    try {
      const daGui = thayDoi;
      await gui(daGui);
      setXacNhan(false); setDoi(new Set()); mt.reload(); onDaLuu();
      toast.hoanTac(t('Đã lưu {n} thay đổi quyền', { n: daGui.length }), () => {
        gui(daGui.map((x) => ({ ...x, granted: !x.granted })))
          .then(() => { mt.reload(); onDaLuu(); toast.push('ok', t('Đã hoàn tác thay đổi quyền')); })
          .catch((e: any) => toast.push('error', e?.message ?? t('Không hoàn tác được')));
      }, { key: 'quyen-vai' });
    } catch (e: any) {
      /* Lỗi thì giữ các ô đã đổi để sửa rồi lưu lại. */
      setXacNhan(false); toast.push('error', e?.message ?? t('Không lưu được'));
    } finally { setBusy(false); }
  };

  const chonVai = (
    <ul className="m-0 grid list-none gap-0.5 p-1.5" aria-label={t('Vai trò')}>
      {[...d.vai.map((v) => ({ key: v.key, ten: dich(v.ten), soNguoi: v.soNguoi as number | null })), { key: GVCN, ten: t('GVCN'), soNguoi: null }].map((v) => (
        <li key={v.key} className={v.key === GVCN ? 'mt-1 border-t pt-1' : ''} style={{ borderColor: 'var(--line)' }}>
          <button type="button" aria-current={vai === v.key} onClick={() => setVai(v.key)}
            className={`grid w-full grid-cols-[1fr_auto] items-center gap-x-2 rounded-lg border-0 px-3 py-2 text-left cursor-pointer ${vai === v.key ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : 'bg-transparent hover:bg-[color:var(--accent-soft)]'}`}>
            <span className="text-[15px] font-semibold text-slate-100">{v.ten}</span>
            <span className="row-span-2 text-[13px] tabular-nums text-slate-400">{t('{n} quyền', { n: soQuyen(v.key) })}</span>
            <span className="text-[13px] text-slate-400">{v.soNguoi === null ? t('tự có theo chủ nhiệm') : t('{n} tài khoản', { n: v.soNguoi })}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const hangQuyen = (p: { key: string; ten: string }) => {
    const m = moTa[p.key];
    const giai = [m?.moTa, m?.phamVi].filter(Boolean).map((x) => dich(x!)).join(' ');
    const laGvcn = vai === GVCN;
    const ly = laGvcn ? null : lyDoKhoa(vai, p.key);
    const bat = laGvcn ? gvcn.has(p.key) || coSan('teacher', p.key) : co(vai, p.key);
    const daDoi = !laGvcn && doi.has(khoa(vai, p.key));
    const bamDuoc = !laGvcn && !ly && !busy;
    return (
      <li key={p.key} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-t px-4 py-2 max-sm:min-h-[56px] ${daDoi ? 'bg-[color:var(--accent-soft)] shadow-[inset_3px_0_0_var(--accent)]' : ''}`} style={{ borderColor: 'var(--line)' }}>
        <span className="flex min-w-0 items-center gap-1 text-[15px] text-slate-100">
          <span className="min-w-0">{dich(p.ten)}</span>
          {giai && <NutLuat label={dich(p.ten)}>{giai}</NutLuat>}
        </span>
        <button type="button" role="switch" aria-checked={bat} aria-disabled={!bamDuoc || undefined} disabled={laGvcn}
          aria-label={`${tenVai(vai)} · ${dich(p.ten)}: ${bat ? t('Có') : t('Không')}${ly ? ` — ${dich(ly)}` : ''}`}
          title={ly ? dich(ly) : undefined} onClick={() => { if (bamDuoc) bam(vai, p.key); }}
          className={`inline-flex min-h-[44px] items-center justify-end gap-2 border-0 bg-transparent text-[13px] font-semibold sm:min-h-[36px] ${bamDuoc ? 'cursor-pointer' : 'cursor-default opacity-60'} ${bat ? 'text-slate-100' : 'text-slate-400'}`}>
          {daDoi && <span className="text-xs text-accent">{t('đổi')}</span>}
          {ly && <IconKhoa />}
          {bat ? t('Có') : t('Không')}
          <span aria-hidden className={`relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors ${bat ? 'border-[color:var(--accent)] bg-[color:var(--accent)]' : 'border-[color:var(--line-strong)] bg-[color:var(--surface-2)]'}`}>
            <span className={`absolute left-0 top-[2px] h-4 w-4 rounded-full transition-transform ${bat ? 'translate-x-[18px] bg-[color:var(--bg)]' : 'translate-x-[2px] bg-slate-400'}`} />
          </span>
        </button>
        {ly && <span className="col-span-2 -mt-1 text-xs text-slate-400">{dich(ly)}</span>}
        {laGvcn && gvcn.has(p.key) && <span className="col-span-2 -mt-1 text-xs text-slate-400">{gvcn.get(p.key)}</span>}
      </li>
    );
  };

  return (
    <Card title={<span className="inline-flex items-center gap-1.5">{t('Quyền theo vai trò')}<NutLuat>
        {t('Quyền = quyền của vai trò × phạm vi chi nhánh của CHÍNH grant đó × phân công lớp/kỹ năng. Không vai trò nào mặc định thấy toàn hệ thống: chỉ grant không gắn chi nhánh mới phủ toàn bộ.')}
      </NutLuat></span>} bodyClass="p-0"
      action={<button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" aria-pressed={soSanh} onClick={() => setSoSanh(!soSanh)}>
        {soSanh ? t('Theo từng vai') : t('So sánh mọi vai')}</button>}>
      {soSanh ? <MaTranChiDoc d={d} gvcn={gvcn} /> : (
        <div className="grid sm:grid-cols-[264px_minmax(0,1fr)]">
          {dienThoai ? (
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
              <select className="field w-full min-h-[44px]" aria-label={t('Vai trò')} value={vai} onChange={(e) => setVai(e.target.value)}>
                {[...d.vai.map((v) => v.key), GVCN].map((k) => <option key={k} value={k}>{tenVai(k)} · {t('{n} quyền', { n: soQuyen(k) })}</option>)}
              </select>
            </div>
          ) : <div className="border-r" style={{ borderColor: 'var(--line)' }}>{chonVai}</div>}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <span className="text-[17px] font-bold text-slate-100">{tenVai(vai)}</span>
              {vai !== GVCN && <Link className="text-[13px] font-semibold" to={`/quan-tri?vai=${vai}`}>{t('{n} tài khoản', { n: d.vai.find((v) => v.key === vai)?.soNguoi ?? 0 })} ›</Link>}
              <input type="search" className="field ml-auto w-full sm:w-56" placeholder={t('Tìm quyền…')} aria-label={t('Tìm quyền')} value={tim} maxLength={60}
                onChange={(e) => setTim(e.target.value)} />
            </div>
            {nhom.length === 0 && <p className="m-0 border-t px-4 py-4 text-sm text-slate-400" style={{ borderColor: 'var(--line)' }}>{t('Không có quyền nào khớp.')}</p>}
            {nhom.map((g) => {
              const mo = !!q || !gap.has(g.key);
              const soDoi = vai === GVCN ? 0 : g.quyen.filter((x) => doi.has(khoa(vai, x.key))).length;
              return (
                <section key={g.key}>
                  <button type="button" aria-expanded={mo} onClick={() => setGap((s) => { const n = new Set(s); if (n.has(g.key)) n.delete(g.key); else n.add(g.key); return n; })}
                    className="flex min-h-[44px] w-full items-center gap-2 border-0 border-t bg-[color:var(--surface-2)] px-4 text-left text-[15px] font-bold text-slate-100 shadow-[inset_3px_0_0_var(--accent)] sm:min-h-[40px]"
                    style={{ borderColor: 'var(--line)' }}>
                    {g.ten}
                    <span className="text-[13px] font-normal tabular-nums text-slate-400">{g.quyen.filter((x) => (vai === GVCN ? gvcn.has(x.key) || coSan('teacher', x.key) : co(vai, x.key))).length} / {g.quyen.length}</span>
                    {soDoi > 0 && <span className="text-xs font-semibold text-accent">{t('{n} đổi', { n: soDoi })}</span>}
                    <span className="ml-auto text-slate-400"><IconGap mo={mo} /></span>
                  </button>
                  {mo && <ul className="m-0 list-none p-0">{g.quyen.map(hangQuyen)}</ul>}
                </section>
              );
            })}
            {doi.size > 0 && (
              <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t px-4 py-2.5" style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)' }}>
                <span className="text-sm tabular-nums text-slate-300" role="status">{t('{n} thay đổi · ảnh hưởng {m} tài khoản', { n: doi.size, m: soAnhHuong })}</span>
                <span className="flex-1" />
                <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => setDoi(new Set())}>{t('Huỷ thay đổi')}</button>
                <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => setXacNhan(true)}>{t('Lưu')}</button>
              </div>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog open={xacNhan} onClose={() => setXacNhan(false)} onConfirm={luu} busy={busy}
        title={t('Lưu thay đổi quyền theo vai trò')} confirmLabel={t('Lưu {n} thay đổi', { n: doi.size })}
        body={
          <>
            <p className="m-0">{t('Quyền mới có hiệu lực ngay với')} <strong>{t('mọi tài khoản')}</strong> {t('mang vai đó, ở mọi chi nhánh của họ.')}</p>
            <ul className="mt-3 mb-0 list-none space-y-2.5 p-0">
              {[...new Set(thayDoi.map((x) => x.roleKey))].map((r) => (
                <li key={r}>
                  <span className="font-semibold text-slate-100">{tenVai(r)}</span>
                  <span className="text-slate-400"> · {t('ảnh hưởng {n} tài khoản', { n: d.vai.find((v) => v.key === r)?.soNguoi ?? 0 })}</span>
                  <ul className="m-0 mt-1 list-none space-y-0.5 pl-3 text-xs">
                    {thayDoi.filter((x) => x.roleKey === r).map((x) => <li key={x.permissionKey}>{x.granted ? t('Bật') : t('Tắt')}: {tenQuyen.get(x.permissionKey) ?? x.permissionKey}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        } />
    </Card>
  );
}

/** Ma trận mọi vai × quyền, CHỈ ĐỌC ("So sánh mọi vai") — sửa ở chế độ theo từng vai. Bảng cuộn ngang trong khung, cột quyền dính. */
function MaTranChiDoc({ d, gvcn }: { d: MaTran; gvcn: Map<string, string> }) {
  const moTa = MO_TA_QUYEN as Record<string, { nhom: string } | undefined>;
  return (
    <div className="table-scroll bang-dinh">
      <table className="w-full text-sm">
        <thead><tr>
          <Th className="sticky-col">{t('Quyền')}</Th>
          {d.vai.map((v) => <Th key={v.key} align="center">{dich(v.ten)}</Th>)}
          <Th align="center">{t('GVCN')}</Th>
        </tr></thead>
        {NHOM_QUYEN.map((g) => {
          const ds = d.quyen.filter((q) => moTa[q.key]?.nhom === g.key);
          if (!ds.length) return null;
          return (
            <tbody key={g.key}>
              <tr><td colSpan={d.vai.length + 2} className="td border-t text-xs font-bold text-slate-300" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>{dich(g.ten)}</td></tr>
              {ds.map((q) => (
                <tr key={q.key} className="row-hover">
                  <td className="td sticky-col min-w-[16rem] text-slate-100">{dich(q.ten)}</td>
                  {d.vai.map((v) => <td key={v.key} className={`td text-center ${d.co[v.key]?.includes(q.key) ? 'text-slate-100' : 'text-slate-500'}`}>{d.co[v.key]?.includes(q.key) ? t('có') : '—'}</td>)}
                  <td className="td text-center text-slate-400" title={gvcn.get(q.key)}>{gvcn.has(q.key) || d.co.teacher?.includes(q.key) ? t('có') : '—'}</td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

/** Ổ khoá 12 px — ô bị khoá (đi kèm lý do bằng chữ, không chỉ dựa vào hình). */
function IconKhoa() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" width={12} height={12} className="inline-block shrink-0">
      <rect x="2.2" y="5.3" width="7.6" height="5.2" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 5.3V3.9a2 2 0 0 1 4 0v1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
