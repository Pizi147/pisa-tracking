import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Episode } from './StudentDetailPage.tsx';
import {
  CASE_CATEGORY_LABEL, CASE_CATEGORY_SHORT, type CaseCategory,
  chuoiDiem, cotCua, duongHoSoHocVien, khoangTruc, ngay, nhanGhim, nhanGiaiDoan, nhanKhoiPa,
  trangThaiHop, trucTuan, xepTang, type CheDoKhoang,
} from '@shared/domain/index.ts';

/**
 * TAB HÀNH TRÌNH (PR-Qb, spec §3.8, mockup `08e-hanh-trinh-lich.html`) — một trục tuần theo LỊCH
 * THẬT (không ép 4 tuần/tháng), mỗi giai đoạn (Lớp thường | Fast Track) một trục riêng, mỗi kỹ
 * năng một hộp gộp điểm + vấn đề + phương án. Mọi nhãn/tầng/badge tính bằng `shared/domain/hanhTrinh.ts`
 * — file này chỉ vẽ theo đúng những gì các hàm đó trả về.
 */

type GiaiDoan = { loai: 'thuong' | 'ft'; tu: string; den: string | null };
type Doan = { loai: 'khoa' | 'lo-trinh'; nhan: string; tu: string; den: string };
type Ghim = {
  attemptId: number; tuan: string; cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string;
  overall: number | null; sosLevel: number | null; soDat: number | null; soYeuCau: number; soCoDiem: number;
};
type Pa = {
  id: number; ten: string; tu: string; den: string | null; status: string;
  lastOutcome: string | null; followupOverdue: boolean; supersededBy: number | null; noiTiepTu: number | null;
};
type VanDe = { caseId: number; ten: string; mo: string; dong: string | null; soPa: number; pa: Pa[] };
type Hop = {
  kyNang: CaseCategory; nhan: string; cheDo: 'ielts' | 'ratio';
  diem: { gt: number; tong?: number | null; chuaDat: boolean }[]; conCho: boolean;
  caseMo: { mo: string; soPa: number }[]; coTungCase: boolean;
  diemCuoiChuaDat: boolean | null; xongGanNhat: string | null; vanDe: VanDe[];
};
type HanhTrinhData = {
  giaiDoan: 'thuong' | 'ft' | null; cacGiaiDoan: GiaiDoan[]; homNay: string;
  doan: Doan[]; ghim: Ghim[]; hop: Hop[];
};
type Truc = ReturnType<typeof trucTuan>;

const CHIP_TAT_CA = 'tat-ca';

export function HanhTrinh({ studentId, active, episodes, allEpisodes, onOpenCase }: {
  studentId: number; active: boolean; episodes: any[]; allEpisodes: any[];
  onOpenCase: (caseId: number, paId?: number) => void;
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [allJourney, setAllJourney] = useState(false);
  const gdParam = params.get('giai-doan');
  const gd = gdParam === 'thuong' || gdParam === 'ft' ? gdParam : null;
  const url = active ? `/students/${studentId}/hanh-trinh${gd ? `?giai-doan=${gd}` : ''}` : null;
  const { data, loading, error, reload } = useApi<HanhTrinhData>(url, [studentId, gd, active]);
  const [chip, setChip] = useState<string>(CHIP_TAT_CA);
  const [cheDoKhoang, setCheDoKhoang] = useState<CheDoKhoang>('3-thang');

  if (!active) return null;
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.cacGiaiDoan.length) return <Empty title="Chưa có Case nào để hiển thị trong hành trình" />;

  const giaiDoanDangXem = data.giaiDoan ? data.cacGiaiDoan.find((g) => g.loai === data.giaiDoan)! : data.cacGiaiDoan[0];
  const khoang = khoangTruc(giaiDoanDangXem, data.homNay, cheDoKhoang);
  const truc = trucTuan(khoang.tu, khoang.den, data.homNay);
  const colTemplate = `var(--cot-ten) repeat(${truc.tuan.length}, minmax(40px, 1fr))`;

  const setGiaiDoan = (loai: 'thuong' | 'ft') => {
    const next = new URLSearchParams(params);
    next.set('giai-doan', loai);
    setParams(next, { replace: true });
  };

  const hopHienThi = chip === CHIP_TAT_CA ? data.hop : data.hop.filter((h) => h.kyNang === chip);

  /* Số hàng cố định của phần đầu lưới: tháng, tuần, rồi Khoá/Lộ trình và Đợt Test nếu có. */
  let hang = 2;
  const hangDoan = data.doan.length ? ++hang : null;
  const hangGhim = data.ghim.length ? ++hang : null;

  return (
    <div className="space-y-3">
      {/* Hàng điều khiển: hai nút giai đoạn · chip kỹ năng · khoảng đang xem */}
      <div className="flex flex-wrap items-center gap-2">
        {data.cacGiaiDoan.length === 2 && data.cacGiaiDoan.map((g) => (
          <button key={g.loai} className={`btn btn-sm ${g.loai === giaiDoanDangXem.loai ? 'btn-primary' : ''}`}
            onClick={() => setGiaiDoan(g.loai)}>
            {nhanGiaiDoan(g, data.homNay)}
          </button>
        ))}
        <span className="flex flex-wrap gap-1 ml-auto">
          <button className={`btn btn-sm ${chip === CHIP_TAT_CA ? 'btn-primary' : ''}`}
            onClick={() => setChip(CHIP_TAT_CA)}>Tất cả kỹ năng</button>
          {data.hop.map((h) => (
            <button key={h.kyNang} className={`btn btn-sm ${chip === h.kyNang ? 'btn-primary' : ''}`}
              title={CASE_CATEGORY_LABEL[h.kyNang]} onClick={() => setChip(h.kyNang)}>
              {CASE_CATEGORY_SHORT[h.kyNang]}
            </button>
          ))}
        </span>
        <select className="field w-auto" aria-label="Khoảng đang xem" value={cheDoKhoang}
          onChange={(e) => setCheDoKhoang(e.target.value as CheDoKhoang)}>
          <option value="3-thang">3 tháng gần nhất</option>
          <option value="ca-giai-doan">Cả giai đoạn</option>
        </select>
      </div>

      {/* Lưới: trục tháng/tuần · hàng Khoá/Lộ trình · hàng Đợt Test — cùng một khuôn cột */}
      <div className="rounded-lg border overflow-x-auto sm:[--cot-ten:200px] [--cot-ten:128px]" style={{ borderColor: 'var(--line)' }}>
        <div className="grid text-xs" style={{ gridTemplateColumns: colTemplate }}>
          <div className="sticky-col" style={{ gridRow: 1, gridColumn: 1 }} />
          {truc.thang.map((th) => (
            <div key={`${th.tu}-${th.nhan}`} className="px-1 py-1 text-slate-400 border-b truncate"
              style={{ gridRow: 1, gridColumn: `${th.tu + 2} / ${th.tu + th.so + 2}`, borderColor: 'var(--line)' }}>
              {th.nhan}
            </div>
          ))}

          <div className="sticky-col px-2 py-1 text-slate-500 border-b"
            style={{ gridRow: 2, gridColumn: 1, borderColor: 'var(--line)' }}>
            Tuần
          </div>
          {truc.tuan.map((w, i) => (
            <div key={w.thuHai} title={w.homNay ? `${w.nhan} · hôm nay` : w.nhan}
              className={`px-1 py-1 text-center tabular-nums border-b ${w.homNay ? 'font-semibold' : 'text-slate-500'}`}
              style={{
                gridRow: 2, gridColumn: i + 2, borderColor: 'var(--line)',
                background: w.homNay ? 'var(--surface-2)' : undefined,
                color: w.homNay ? 'var(--accent-strong)' : undefined,
              }}>
              {w.nhan}
            </div>
          ))}

          {hangDoan && (
            <>
              <div className="sticky-col px-2 py-1.5 text-slate-500 border-b"
                style={{ gridRow: hangDoan, gridColumn: 1, borderColor: 'var(--line)' }}>
                {data.doan[0].loai === 'khoa' ? 'Khoá' : 'Lộ trình'}
              </div>
              {data.doan.map((d, di) => {
                const a = cotCua(d.tu, truc);
                const b = cotCua(d.den, truc);
                return (
                  <div key={di} className="px-1.5 py-1.5 border-b truncate rounded" title={d.nhan}
                    style={{ gridRow: hangDoan, gridColumn: `${a + 2} / ${b + 3}`, borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
                    {d.nhan}
                  </div>
                );
              })}
            </>
          )}

          {hangGhim && (
            <>
              <div className="sticky-col px-2 py-1.5 text-slate-500 border-b"
                style={{ gridRow: hangGhim, gridColumn: 1, borderColor: 'var(--line)' }}>
                Đợt Test
              </div>
              {data.ghim.map((g) => {
                const col = cotCua(g.tuan, truc);
                const nhan = nhanGhim(g);
                return (
                  <button key={g.attemptId} type="button"
                    className="mx-auto my-auto rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap"
                    title={nhan.day}
                    style={{ gridRow: hangGhim, gridColumn: col + 2, background: toneBg(nhan.tone), color: 'var(--accent-ink)' }}
                    onClick={() => navigate(duongHoSoHocVien(studentId, { dot: g.attemptId }))}>
                    {nhan.ngan}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Hộp kỹ năng */}
      <div className="space-y-3">
        {hopHienThi.map((h) => (
          <HopKyNang key={h.kyNang} hop={h} truc={truc} colTemplate={colTemplate} homNay={data.homNay}
            onOpenCase={onOpenCase} />
        ))}
      </div>

      {/* Chú thích */}
      <p className="text-[11px] text-slate-500 m-0">
        ✓ Tiến bộ rõ · ◐ Tiến bộ một phần · ✗ Không tiến bộ / Kém hơn · Đang thực hiện (viền đỏ = quá hạn cập nhật)
        · Chưa có PA · <span style={{ color: 'var(--accent-strong)' }}>▍</span> tuần này
      </p>

      {/*
        MỐC HỌC TẬP (Q8): vào học, vào lớp, chuyển chương trình, đổi target hay kế hoạch thi, bàn
        giao case, kết quả thi thật, kết luận lộ trình. Mặc định chỉ mốc chính; mở toàn bộ khi cần
        tra lại. Ý thức (cảnh báo/danh sách theo dõi) không còn ở đây (Q8, đã chuyển hẳn sang tab
        Ý thức & Phối hợp).
      */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-200 m-0">
            {allJourney ? 'Toàn bộ ghi nhận' : 'Mốc học tập'}
          </h3>
          <button className="btn btn-sm btn-ghost" onClick={() => setAllJourney(!allJourney)}>
            {allJourney ? 'Chỉ xem mốc chính' : 'Mở toàn hành trình'}
          </button>
        </div>
        {(() => {
          const eps = allJourney ? (allEpisodes ?? episodes) : episodes;
          return eps.length === 0 ? <Empty title="Chưa có sự kiện nào" /> : (
            <ol className="space-y-3 list-none p-0 m-0">
              {eps.map((ep: any) => <Episode key={ep.key} ep={ep} onOpenCase={(id) => onOpenCase(id)} />)}
            </ol>
          );
        })()}
      </div>
    </div>
  );
}

function toneBg(tone: string): string {
  if (tone === 'ok') return 'var(--ok)';
  if (tone === 'danger') return 'var(--danger)';
  if (tone === 'info') return 'var(--accent)';
  return 'var(--line-strong)';
}

/** Đầu hộp: tên đầy đủ · chuỗi điểm · badge trạng thái; dưới đó mỗi vấn đề một khối lưới riêng, cùng khuôn cột. */
function HopKyNang({ hop, truc, colTemplate, homNay, onOpenCase }: {
  hop: Hop; truc: Truc; colTemplate: string; homNay: string;
  onOpenCase: (caseId: number, paId?: number) => void;
}) {
  const moc = chuoiDiem(hop.diem, hop.cheDo === 'ratio' ? 'ratio' : 'ielts', hop.conCho);
  const badge = trangThaiHop({ caseMo: hop.caseMo, coTungCase: hop.coTungCase, diemCuoiChuaDat: hop.diemCuoiChuaDat, xongGanNhat: hop.xongGanNhat }, homNay);

  return (
    <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--line)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-sm text-slate-100">{hop.nhan}</span>
          <span className="text-xs tabular-nums">
            {moc.length === 0
              ? <span className="text-slate-600">chưa có điểm</span>
              : moc.map((m, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-slate-600"> → </span>}
                  <span className={m.xau ? 'text-rose-300' : 'text-slate-300'}>{m.chu}</span>
                </span>
              ))}
          </span>
        </div>
        {badge ? (
          <span className="text-[11px] rounded px-1.5 py-0.5" style={{ background: toneBg2(badge.tone) }}>{badge.chu}</span>
        ) : (
          <span className="text-[11px] text-slate-600">Không có Case</span>
        )}
      </div>

      {hop.vanDe.length > 0 && (
        <div className="overflow-x-auto space-y-1">
          {hop.vanDe.map((v) => <VanDeHang key={v.caseId} v={v} truc={truc} colTemplate={colTemplate} homNay={homNay} onOpenCase={onOpenCase} />)}
        </div>
      )}
    </div>
  );
}

function toneBg2(tone: 'ok' | 'warn' | 'danger'): string {
  return tone === 'ok' ? 'var(--ok)' : tone === 'danger' ? 'var(--danger)' : 'var(--warn)';
}

/** Một vấn đề: LƯỚI RIÊNG cùng khuôn cột — ô tên (bấm mở Case, spans mọi tầng) + các tầng khối phương án (`xepTang`). */
function VanDeHang({ v, truc, colTemplate, homNay, onOpenCase }: {
  v: VanDe; truc: Truc; colTemplate: string; homNay: string;
  onOpenCase: (caseId: number, paId?: number) => void;
}) {
  const tang = xepTang(v.pa.map((p) => ({ id: p.id, tu: p.tu, den: p.den, noiTiepTu: p.noiTiepTu })));
  const soTang = Math.max(1, new Set(tang.values()).size);
  const phu = (v.dong ? `${ngay(v.mo)} → ${ngay(v.dong)}` : `từ ${ngay(v.mo)} · ${v.soPa} PA`).slice(0, 60);

  return (
    <div className="grid gap-y-0.5" style={{ gridTemplateColumns: colTemplate, gridTemplateRows: `repeat(${soTang}, 20px)` }}>
      <div className="py-0.5 pr-2 min-w-0" style={{ gridRow: `1 / span ${soTang}`, gridColumn: 1 }}>
        <button type="button" className="text-left appearance-none bg-transparent border-0 p-0 group w-full"
          onClick={() => onOpenCase(v.caseId)}>
          <span className="block text-xs text-slate-200 truncate group-hover:underline">{v.ten}</span>
          <span className="block text-[10px] text-slate-500 truncate">{phu}</span>
        </button>
      </div>
      {v.pa.length === 0 ? (
        <ChuaCoPa tu={v.mo} homNay={homNay} truc={truc} />
      ) : v.pa.map((p) => (
        <KhoiPa key={p.id} p={p} hang={tang.get(p.id)! + 1} truc={truc} onOpenCase={() => onOpenCase(v.caseId, p.id)} />
      ))}
    </div>
  );
}

function ChuaCoPa({ tu, homNay, truc }: { tu: string; homNay: string; truc: Truc }) {
  const a = cotCua(tu, truc);
  const b = cotCua(homNay, truc);
  return (
    <div className="rounded border border-dashed px-1.5 text-[10px] text-amber-200/80 truncate flex items-center"
      style={{ gridRow: 1, gridColumn: `${a + 2} / ${b + 3}`, borderColor: 'var(--warn)' }}>
      Chưa có phương án nào — cần đề ra
    </div>
  );
}

function KhoiPa({ p, hang, truc, onOpenCase }: { p: Pa; hang: number; truc: Truc; onOpenCase: () => void }) {
  const a = cotCua(p.tu, truc);
  const b = cotCua(p.den ?? truc.tuan[truc.tuan.length - 1]?.thuHai ?? p.tu, truc);
  const nhan = nhanKhoiPa(p);
  const late = nhan.tone === 'late';
  return (
    <button type="button" onClick={onOpenCase}
      data-pa-id={p.id}
      title={`${nhan.chu} · ${ngay(p.tu)} → ${ngay(p.den)}`}
      className="rounded px-1.5 text-[10px] truncate text-left appearance-none flex items-center"
      style={{
        gridRow: hang, gridColumn: `${a + 2} / ${b + 3}`,
        background: khoiPaBg(nhan.tone), color: 'var(--accent-ink)',
        border: late ? '1px solid var(--danger)' : undefined,
      }}>
      {nhan.chu}
    </button>
  );
}

function khoiPaBg(tone: string): string {
  if (tone === 'ok') return 'var(--ok)';
  if (tone === 'bad') return 'var(--danger)';
  if (tone === 'part') return 'var(--warn)';
  return 'var(--accent)'; // run · late
}
