import { Fragment, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SCORE_CHIP, type ScoreTone } from '../../ui/ui.tsx';
import { CHIP_TRON, CHIP_VUONG } from '../../ui/Nhan.tsx';
import { useDienThoai } from '../../ui/TheDong.tsx';
import {
  IconCanhBao, IconChuyenLop, IconDangLam, IconDat, IconGap, IconKhong, IconLen, IconMotPhan, IconSang, IconTamDung,
} from '../../ui/BieuTuong.tsx';
import { NhanLoai } from '../cases/SkillBoard.tsx';
import { chuKhoangDung, chuTuanHoc, duongDotTest, nhanGhim, skillShort, tenMonNgan, tuanLich, type MauKetQua, type TonePaChuong } from '@shared/domain/index.ts';
import { dich, dichChu, t, type Bien } from '@shared/i18n/index.ts';
import { ChipSos } from '../../ui/ChipSos.tsx';

/**
 * CHƯƠNG THEO LỚP (PR-VAI-b Task 10, mockup 26 bản 2) — khối đầu tab Hành trình, thay bảng Lịch sử lớp và khối "Mốc học tập".
 * Nằm ở: Học viên & Lớp › hồ sơ học viên › tab Hành trình · trên trục tuần.
 *
 * Mỗi lớp em học một thẻ (cũ → mới, mới nhất bên phải): lớp · số tuần / tuần học · GVCN · Tạm dừng · kết quả Test · Case (khung rỗng) với PA
 * (khối đặc, ký hiệu kết quả) · vì sao sang lớp sau. KHÔNG việc, hạn, người giữ việc (ở tab Học thuật và trục tuần). Bấm thẻ / "Xem trục tuần"
 * → trục bên dưới chuyển tới giai đoạn của chương (Q16). < 640 px: chương đang học mở sẵn, chương cũ một dòng, mới nhất trên cùng.
 */

type Ghim = Parameters<typeof nhanGhim>[0] & { attemptId: number; classId: number | null; tuan: string | null; nhanNgan: string };
type CaseDong = { caseId: number; ten: string; kyNang: string; sos: number | null; xongO: string | null; diTheoSang: string | null;
  pa: { id: number; ten: string; tone: TonePaChuong }[] };
export type ChuongWeb = {
  enrollmentId: number; classId: number; code: string; ngan: string; nhan: string; ct: string | null; ft: boolean;
  tu: string; den: string | null; dangHoc: boolean; soTuan: number | null; tuanHoc: { tu: number | null; den: number | null; dangDung: boolean } | null; gvcn: string | null;
  tamDung: { tu: string; den: string | null }[]; ghim: Ghim[]; caseDong: CaseDong[];
  ra: { loai: string | null; chu: string; khoa?: string; bien?: Bien; how: string | null; tu: string | null; docBanGiao: { lenhId: number; lopNguonId: number } | null } | null;
};

const MAU_PIN: Record<MauKetQua, ScoreTone> = { dat: 'emerald', sos1: 'sos1', sos2: 'sos2', sos3: 'sos3', tam: 'tam' };
/** PA = khối ĐẶC tô theo kết quả (luật chung với bảng kỹ năng và trục tuần, Q13); chờ = viền đứt tím. */
const KHOI_PA: Record<TonePaChuong, string> = {
  ok: 'border-transparent bg-ok-bg text-ok', part: 'border-transparent bg-soon-bg text-soon', bad: 'border-transparent bg-bad-bg text-bad', run: 'border-transparent bg-doing-bg text-doing',
  wait: 'border-dashed border-muted text-muted', done: 'border-transparent bg-done-bg text-done',
};
const DAU_PA: Record<TonePaChuong, ReactNode> = {
  ok: <IconDat />, part: <IconMotPhan />, bad: <IconKhong />, run: <IconDangLam />, wait: <IconTamDung />, done: <IconDat />,
};

/** "[MT1] Reading … [SOS 1]" (tên Case SOS, T21) → chip MT + phần giữa + chip SOS; tên khác giữ nguyên. */
function TenCaseChuong({ ten }: { ten: string }) {
  const m = /^\[(MT\d+)\] (.*?)(?: \[SOS (\d)\])?$/.exec(ten);
  if (!m) return <span className="min-w-0">{dich(ten)}</span>;
  return (
    <>
      <span className="rounded border border-[color:var(--line-strong)] px-1 text-[12px] font-semibold leading-4 tabular-nums text-slate-300">{m[1]}</span>
      <span className="min-w-0">{dich(m[2])}</span>
      {m[3] && <ChipSos muc={Number(m[3])} dot={m[1]} tinh />}
    </>
  );
}

const khiChuong = (c: ChuongWeb, homNay: string) => {
  const tu = tuanLich(c.tu, homNay);
  const den = c.den ? tuanLich(c.den, homNay) : null;
  const tuan = c.ft
    ? c.tuanHoc ? (c.tuanHoc.den === null ? chuTuanHoc(c.tuanHoc.tu, null, c.tuanHoc.dangDung) : t('tuần học {a}–{b}', { a: String(c.tuanHoc.tu), b: c.tuanHoc.den })) : null
    : c.soTuan ? t('{n} tuần', { n: c.soTuan }) : null;
  return [den ? `${tu} → ${den}` : t('từ {tuan}', { tuan: tu }), tuan].filter(Boolean).join(' · ');
};
/** Kỹ năng chưa đạt ở đợt Test mới nhất của chương: FT "dưới kỳ vọng: W2 · S"; lớp thường "không đạt: G+V". */
const duoiCua = (c: ChuongWeb): string | null => {
  const g = c.ghim.at(-1);
  if (!g?.kyNangChuaDat?.length) return null;
  return g.cheDo === 'ielts' ? t('dưới kỳ vọng: {ds}', { ds: g.kyNangChuaDat.map((k) => skillShort(k)).join(' · ') }) : t('không đạt: {ds}', { ds: g.kyNangChuaDat.map((k) => tenMonNgan(c.ct, k)).join(' · ') });
};

/** Q23: > 4 chương cuộn ngang — khi gắn khung, cuộn tới mép phải (chương đang học), như trục tuần. Hàm ở cấp module nên chỉ chạy lúc gắn. */
const cuonVeChuongMoi = (el: HTMLDivElement | null) => { if (el) el.scrollLeft = el.scrollWidth; };

export function ChuongLop({ chuong, lapLai, homNay, onChon }: {
  chuong: ChuongWeb[]; lapLai: { kyNang: string; lop: string[] }[]; homNay: string; onChon: (c: ChuongWeb) => void;
}) {
  const dienThoai = useDienThoai();
  if (!chuong.length) return null;
  const tongTuan = Math.max(1, Math.round((Date.parse(homNay) - Date.parse(chuong[0].tu)) / (7 * 86_400_000)) + 1);
  return (
    <section aria-label={t('Chương theo lớp')} className="space-y-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="m-0 text-[15px] font-semibold text-slate-100">
          {t('{n} lớp · từ {tuan} · {so} tuần', { n: chuong.length, tuan: tuanLich(chuong[0].tu, homNay), so: tongTuan })}
        </h3>
        <span className="text-[12px] text-slate-400">{dienThoai ? t('Chương đang học mở sẵn; chương cũ bấm để mở') : t('Mới nhất ở bên phải · cuối mỗi thẻ là cách em sang lớp sau')}</span>
      </div>

      {dienThoai ? <ChuongDienThoai chuong={chuong} homNay={homNay} onChon={onChon} /> : (
        /* > 4 chương: cuộn ngang trong khung (Q23), chương đang học luôn ở bên phải. */
        <div ref={cuonVeChuongMoi} className="overflow-x-auto pb-1">
          <div className={chuong.length > 4 ? 'flex gap-[26px]' : 'grid gap-[26px]'}
            style={chuong.length > 4 ? undefined : { gridTemplateColumns: `${chuong.length > 1 ? `repeat(${chuong.length - 1}, minmax(0,1fr)) ` : ''}minmax(0,1.45fr)` }}>
            {chuong.map((c, i) => (
              <div key={c.enrollmentId} className={`relative ${chuong.length > 4 ? (c.dangHoc ? 'w-[360px]' : 'w-[260px]') + ' shrink-0' : 'min-w-0'}`}>
                <TheChuong c={c} homNay={homNay} onChon={onChon} />
                {i < chuong.length - 1 && <span aria-hidden className="absolute -right-[20px] top-6 text-slate-400"><IconSang size={14} /></span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {lapLai.map((l) => (
        <p key={l.kyNang} className="m-0 flex items-start gap-2.5 rounded-[10px] px-3 py-[9px] text-[13px] text-slate-200" style={{ background: 'var(--surface-2)' }}>
          <span className="mt-[3px] text-late"><IconCanhBao /></span>
          <span><b className="font-semibold">{t('Lặp lại qua các lớp:')}</b> {t('{kn} có Case ở {lop}.', { kn: dich(l.kyNang), lop: l.lop.join(', ').replace(/, ([^,]*)$/, ` ${t('và')} $1`) })}{' '}
            <span className="text-slate-400">{t('Hệ thống tự viết dòng này khi một kỹ năng có Case ở hai lớp trở lên.')}</span></span>
        </p>
      ))}
    </section>
  );
}

/** Một thẻ chương (desktop; điện thoại dùng cho chương đang học). */
function TheChuong({ c, homNay, onChon }: { c: ChuongWeb; homNay: string; onChon: (c: ChuongWeb) => void }) {
  const navigate = useNavigate();
  const duoi = duoiCua(c);
  return (
    <article aria-label={`${c.code}${c.dangHoc ? `, ${t('đang học')}` : ''}`} onClick={() => onChon(c)}
      className={`flex h-full min-w-0 cursor-pointer flex-col gap-2.5 rounded-xl border bg-[color:var(--surface)] px-3.5 py-3 ${c.dangHoc ? 'border-[color:var(--accent)] shadow-lg' : ''}`}
      style={c.dangHoc ? undefined : { borderColor: 'var(--line)' }}>
      <div className="flex flex-col gap-0.5">
        <span className={`text-[12px] font-bold tracking-[.05em] ${c.dangHoc ? 'text-[color:var(--accent)]' : 'text-slate-400'}`}>{dich(c.nhan)}</span>
        {/* Bàn phím: mã lớp là nút (cả thẻ bấm được bằng chuột) — Tab tới được mọi chương, không lồng liên kết ghim vào nút. */}
        <button type="button" className="self-start rounded border-0 bg-transparent p-0 text-left text-[15px] font-bold leading-tight text-slate-100"
          title={t('Xem trục tuần {lop}', { lop: c.code })} onClick={(e) => { e.stopPropagation(); onChon(c); }}>{c.code}</button>
        <span className="text-[12px] tabular-nums text-slate-400">{khiChuong(c, homNay)}</span>
        {c.gvcn && <span className="text-[12px] text-slate-400">{t('GVCN')} {c.gvcn}</span>}
      </div>
      {c.tamDung.map((d, k) => (
        <div key={k} className="flex items-center gap-1.5 rounded-md px-2 py-[3px] text-[12px] text-soon"
          style={{ background: 'repeating-linear-gradient(135deg, rgb(var(--soon-bg-rgb)) 0 5px, transparent 5px 10px)' }}>
          <IconTamDung />{t('Tạm dừng {khoang}', { khoang: chuKhoangDung(d, homNay) })}
        </div>
      ))}
      {c.ghim.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-wrap gap-1">
            {c.ghim.map((g) => {
              const nh = nhanGhim({ ...g, homNay });
              return (
                <Link key={g.attemptId} to={duongDotTest({ id: g.attemptId, kind: g.kind, classId: g.classId })} title={nh.day}
                  onClick={(e) => e.stopPropagation()}
                  className={`${CHIP_TRON} no-underline ${SCORE_CHIP[MAU_PIN[nh.mau]]}`}>
                  {nh.chuong ?? nh.chu}
                </Link>
              );
            })}
          </div>
          {duoi && <span className="text-[12px] text-slate-400">{duoi}</span>}
        </div>
      )}
      {c.caseDong.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-2" style={{ borderColor: 'var(--line)' }}>
          {c.caseDong.map((x) => (
            <div key={x.caseId} className="flex flex-col gap-1">
              <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-slate-100">
                <NhanLoai loai="Case" /><TenCaseChuong ten={x.ten} />
                {x.xongO && <span className="text-[12px] font-medium text-slate-400">{t('xong ở {dot}', { dot: dich(x.xongO) })}</span>}
              </span>
              {x.pa.length > 0 && (
                <span className="flex flex-wrap items-center gap-1">
                  {x.pa.map((p) => (
                    <span key={p.id} title={dich(p.ten)}
                      className={`${CHIP_VUONG} h-5 min-w-0 max-w-full gap-1 overflow-hidden max-sm:h-auto max-sm:min-h-5 max-sm:py-0.5 max-sm:whitespace-normal ${KHOI_PA[p.tone]}`}>
                      {DAU_PA[p.tone]}<span className={`truncate max-sm:whitespace-normal max-sm:overflow-visible max-sm:break-words ${p.tone === 'wait' ? '' : 'text-slate-100'}`}>{dich(p.ten)}</span>
                    </span>
                  ))}
                </span>
              )}
              {x.diTheoSang && <span className="text-[12px] text-slate-400">{t('Case bàn giao sang {lop}', { lop: x.diTheoSang })}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto flex flex-col gap-0.5 border-t pt-2 text-[12px]" style={{ borderColor: 'var(--line)' }}>
        {c.ra ? (
          <>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-100">
              <span className={c.ra.loai === 'chuyen' ? 'text-[color:var(--accent)]' : 'text-slate-400'}>{c.ra.loai === 'chuyen' ? <IconChuyenLop /> : <IconLen />}</span>
              {dichChu(c.ra)}
            </span>
            <span className="text-[12px] text-slate-400">{[c.ra.how && dich(c.ra.how), c.ra.tu ? t('từ {tuan}', { tuan: tuanLich(c.ra.tu, homNay) }) : null].filter(Boolean).join(' · ')}</span>
            {c.ra.docBanGiao && (
              <button type="button" className="btn btn-sm mt-1 self-start" onClick={(e) => {
                e.stopPropagation();
                navigate(`/hoc-vien/lop/${c.ra!.docBanGiao!.lopNguonId}?viec=ban-giao&lenh=${c.ra!.docBanGiao!.lenhId}`);
              }}>{t('Đọc bàn giao')}</button>
            )}
          </>
        ) : (
          <span className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-slate-400">{t('đang học')}</span>
            <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onChon(c); }}>{t('Xem trục tuần')}</button>
          </span>
        )}
      </div>
    </article>
  );
}

/** Điện thoại: chương đang học mở sẵn (thẻ đủ), chương cũ gập một dòng — giữa các dòng là mối nối "cách em sang lớp sau"; mới nhất ở trên. */
function ChuongDienThoai({ chuong, homNay, onChon }: { chuong: ChuongWeb[]; homNay: string; onChon: (c: ChuongWeb) => void }) {
  const [mo, setMo] = useState<number | null>(null);
  const moiTruoc = [...chuong].reverse();
  return (
    <div className="flex flex-col">
      {moiTruoc.map((c, i) => {
        const truoc = moiTruoc[i + 1];
        const noi = truoc?.ra ? (
          <div className="flex items-center gap-1.5 border-x px-3 py-[3px] text-[12px] text-slate-400" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
            {truoc.ra.loai === 'chuyen' ? <IconChuyenLop size={10} /> : <IconLen size={10} />}
            {(() => { const chu = dichChu(truoc.ra); return chu.charAt(0).toLowerCase() + chu.slice(1); })()}{c.tu ? ` · ${tuanLich(c.tu, homNay)}` : ''}
          </div>
        ) : null;
        const tomTat = [c.ghim.at(-1) ? nhanGhim({ ...c.ghim.at(-1)!, homNay }).chu : null,
          c.caseDong.length ? `Case ${c.caseDong.map((x) => dich(x.kyNang)).join(', ')}` : null,
          c.tamDung.length ? t('Tạm dừng {khoang}', { khoang: c.tamDung.length === 1 ? chuKhoangDung(c.tamDung[0], homNay) : t('{n} lần', { n: c.tamDung.length }) }) : null].filter(Boolean).join(' · ');
        return (
          <Fragment key={c.enrollmentId}>
            {c.dangHoc || mo === c.enrollmentId
              ? <div className={i > 0 ? 'mt-0' : ''}><TheChuong c={c} homNay={homNay} onChon={onChon} /></div>
              : (
                <button type="button" aria-expanded={false} onClick={() => setMo(c.enrollmentId)}
                  className={`grid min-h-[44px] w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 border bg-[color:var(--surface)] px-3 py-2 text-left text-[13px] ${i === moiTruoc.length - 1 ? 'rounded-b-[10px]' : ''}`}
                  style={{ borderColor: 'var(--line)' }}>
                  <b className="font-semibold text-slate-100">{c.code}</b>
                  <span className="flex items-center gap-1 text-[12px] tabular-nums text-slate-400">{khiChuong(c, homNay).split(' · ')[0]}<IconGap mo={false} size={10} /></span>
                  {tomTat && <span className="col-span-2 text-[12px] text-slate-400">{tomTat}</span>}
                </button>
              )}
            {noi}
          </Fragment>
        );
      })}
    </div>
  );
}
