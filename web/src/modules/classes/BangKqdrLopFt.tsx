import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { DauDuoi, Nhan } from '../../ui/Nhan.tsx';
import { TheDong, useDienThoai } from '../../ui/TheDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { REGULAR_SKILLS, duongCase, tuanLich, type RegularSkill } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** `GET /classes/:id/ket-qua-dau-ra` (server/src/normal/kyVong.ts → kqdrLopFt). Chỉ giá trị QL đã chốt. */
type Em = {
  id: number; ten: string; lopCu: { id: number; code: string }; final: number | null; finalDat: boolean | null;
  mt0: (Record<RegularSkill, number | null> & { overall: number; dat: boolean; monTruot: string[] }) | null;
  kqdr: { dat: boolean; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[] } | null;
  case: { id: number; mon: string }[]; banGiao: string | null;
};
type Bang = { ct: string; lop: { id: number; code: string }[]; dot: { vao: string; hienToi: string; em: Em[] }[] };

const NGAN: Record<string, string> = { listening: 'L', reading: 'R', writing: 'W', speaking: 'S' };
const b1 = (n: number) => n.toFixed(1);

/**
 * HỒ SƠ LỚP FT › Học viên › "Kết quả đầu ra" (OV-3c, mockup M2 §5): mỗi chương trình nguồn một bảng, nhóm con theo đợt (= tuần vào lớp FT),
 * mỗi đợt hiện 4 tuần. Chỉ đọc — sửa Kết quả đầu ra ở hồ sơ lớp cũ (cách xem Lộ trình tiếp theo). Điện thoại: mỗi em một thẻ, không cột Final.
 */
export function BangKqdrLopFt({ classId }: { classId: number }) {
  const { data, loading, error, reload } = useApi<{ bang: Bang[] }>(`/classes/${classId}/ket-qua-dau-ra`, [classId]);
  const { homNay } = useNgayNghiepVu();
  const dt = useDienThoai();
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading && !data) return <Skeleton rows={5} />;
  if (!data?.bang.length) return <div className="card"><Empty title={t('Không còn đợt nào trong 4 tuần')} hint={t('Tra Kết quả đầu ra ở Hồ sơ học viên › Hành trình.')} /></div>;
  const tuan = (d: string) => <span className="tabular-nums">{tuanLich(d, homNay)}</span>;

  const oMt0 = (e: Em) => {
    const m = e.mt0;
    if (!m) return <span className="text-slate-500">—</span>;
    const so = (v: number | null, duoi: boolean) => (v === null ? '—' : <span className={duoi ? 'font-semibold text-late' : ''}>{duoi && <DauDuoi />}{b1(v)}</span>);
    return (
      <span className="whitespace-nowrap text-[13px] tabular-nums text-slate-300">
        {REGULAR_SKILLS.map((k, i) => <Fragment key={k}>{i > 0 && ' · '}{so(m[k], m.monTruot.includes(k))}</Fragment>)}
        {' · '}<b className={m.dat ? 'text-slate-100' : 'text-late'}>{!m.dat && <DauDuoi />}{b1(m.overall)}</b>
      </span>
    );
  };
  const oKq = (e: Em) => {
    const k = e.kqdr;
    if (!k) return <Nhan tone="muted" title={t('Quản lý chưa chốt Kết quả đầu ra')}>{t('Chưa chốt')}</Nhan>;
    if (k.dat) return <Nhan tone="ok">{t('Đạt')}</Nhan>;
    return <Nhan tone="bad">{`${t('Không đạt')} · ${k.nguyenNhan === 'hoc_sinh' ? t('Học viên') : t('Trung tâm')}${k.mon.length ? ` · ${k.mon.map((m) => NGAN[m] ?? m).join(' ')}` : ''}`}</Nhan>;
  };
  const oCase = (e: Em) => (e.case.length ? (
    <span className="flex flex-col items-start gap-0.5">
      {e.case.map((c) => (
        <Link key={c.id} className="link" to={duongCase(e.id, c.id)}>
          {`Case ${NGAN[c.mon] ?? c.mon}${e.kqdr?.nguyenNhan === 'trung_tam' ? ` · ${t('Tutor 10 buổi')}` : ''}`}
        </Link>
      ))}
    </span>
  ) : <span className="text-slate-500">—</span>);
  const oBanGiao = (e: Em) => (e.banGiao
    ? <span className="whitespace-pre-line break-words text-[13px] text-slate-300">{e.banGiao}</span>
    : <span className="text-xs text-slate-500">{t('Chưa bàn giao')}</span>);
  const oFinal = (e: Em) => (e.final === null ? <span className="text-slate-500">—</span>
    : <Nhan tone={e.finalDat ? 'ok' : 'soon'}>{`${Math.round(e.final * 100)}%`}</Nhan>);
  const tenEm = (e: Em) => <Link className="link font-semibold" to={`/hoc-vien/${e.id}`}>{e.ten}</Link>;
  const dongDot = (d: Bang['dot'][number]) => (
    <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-400">
      <b className="font-semibold text-slate-200">{t('Đợt')} {tuan(d.vao)}</b>
      <span>{!dt && <>{t('vào lớp')} {tuan(d.vao)} · </>}{t('hiện tới hết')} {tuan(d.hienToi)}</span>
    </span>
  );

  return (
    <div className="space-y-3">
      {data.bang.map((b) => (
        <section key={b.ct} className="card overflow-hidden">
          <h3 className="m-0 flex flex-wrap items-baseline gap-x-1.5 px-3 py-2.5 text-sm font-semibold text-slate-100">
            {t('Kết quả đầu ra {ct}', { ct: b.ct })}
            {!dt && <span className="text-xs font-normal text-slate-500">· {b.lop.map((l) => l.code).join(', ')}</span>}
          </h3>
          {dt ? b.dot.map((d) => (
            <div key={d.vao}>
              <div className="border-t px-3 py-2" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>{dongDot(d)}</div>
              {d.em.map((e) => (
                <TheDong key={e.id} dau={<span className="flex flex-wrap items-baseline gap-x-1">{tenEm(e)}<span className="text-xs text-slate-400">· {e.lopCu.code}</span></span>}
                  dong={[
                    { nhan: 'MT0', noiDung: oMt0(e) },
                    { nhan: t('Kết quả'), noiDung: oKq(e) },
                    e.case.length ? { nhan: t('Hỗ trợ'), noiDung: oCase(e) } : { nhan: t('Bàn giao'), noiDung: oBanGiao(e) },
                  ]} />
              ))}
            </div>
          )) : (
            <div className="table-scroll">
              <table className="w-full min-w-[1080px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[15%]" /><col className="w-[9%]" /><col className="w-[7%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[14%]" /><col />
                </colgroup>
                <thead>
                  <tr>
                    <th className="th">{t('Học viên')}</th><th className="th">{t('Lớp cũ')}</th><th className="th">Final</th><th className="th">MT0 · L R W S · Overall</th>
                    <th className="th">{t('Kết quả đầu ra')}</th><th className="th">{t('Hỗ trợ')}</th><th className="th">{t('Bàn giao từ GV cũ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {b.dot.map((d) => (
                    <Fragment key={d.vao}>
                      <tr><td colSpan={7} className="td" style={{ background: 'var(--surface-2)' }}>{dongDot(d)}</td></tr>
                      {d.em.map((e) => (
                        <tr key={e.id} className="row-hover align-top">
                          <td className="td h-11">{tenEm(e)}</td>
                          <td className="td text-slate-300">{e.lopCu.code}</td>
                          <td className="td">{oFinal(e)}</td>
                          <td className="td">{oMt0(e)}</td>
                          <td className="td">{oKq(e)}</td>
                          <td className="td">{oCase(e)}</td>
                          <td className="td">{oBanGiao(e)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
