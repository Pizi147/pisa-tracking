import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useCurrentPeriod, WeekPicker } from '../../ui/Filters.tsx';
import { Han } from '../../ui/Han.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { skillLabel, skillShort } from '../../lib/format.ts';
import { LuoiFT, hanSomNhatFt, tenDotFt, type FtSheet } from './LuoiFT.tsx';
import {
  LuoiThuong, hanSomNhatThuong, kindMacDinh, kindsThuong, tuanThiTheoMon, type ThuongSheet,
} from './LuoiThuong.tsx';
import { MotKyNang } from './MotKyNang.tsx';

/** Trả lời của `GET /classes/:classId/cham` (`chamSheet` ở server/src/cham/canCham.ts). */
type Cham = {
  classId: number; classCode: string; branchName: string; canPlanWeek: boolean; today: string;
  mode: 'ielts_band' | 'ratio';
  ft: FtSheet | null;
  thuong: ThuongSheet | null;
};

/**
 * MÀN HẸP (Q16): < 768px — cùng ngưỡng `md` của Tailwind, cho cả lớp FT và lớp thường. Theo dõi `change` của
 * `matchMedia` nên xoay ngang điện thoại hay kéo hẹp cửa sổ là đổi chế độ ngay.
 */
const MAN_HEP = '(max-width: 767px)';
function useManHinhHep() {
  const [hep, setHep] = useState(() => typeof window !== 'undefined' && window.matchMedia(MAN_HEP).matches);
  useEffect(() => {
    const m = window.matchMedia(MAN_HEP);
    const doi = () => setHep(m.matches);
    doi();
    m.addEventListener('change', doi);
    return () => m.removeEventListener('change', doi);
  }, []);
  return hep;
}

/**
 * LƯỚI CHẤM — MỘT TRANG CHO CẢ LỚP FAST TRACK VÀ LỚP THƯỜNG (spec §3.5, mockup 05a §2).
 *
 * Trang này KHÔNG tự đoán loại lớp: máy chủ trả `mode` ở `/classes/:id/cham` và trang chọn lưới theo đó. Nhờ vậy mở
 * `/nhap-diem/:id` của một lớp thường không còn ra lưới Mock Test (đặc tả §6) — và ngược lại.
 *
 * Màn hẹp (< 768px) chuyển sang chế độ MỘT KỸ NĂNG MỘT LÚC (`MotKyNang`) — đúng cách giáo viên chấm thật. Nút chữ nhỏ
 * "Xem dạng bảng" vẫn mở được lưới trên điện thoại (cuộn ngang TRONG THẺ, G-11); "Chấm từng kỹ năng" để quay lại.
 *
 * Đường dẫn mang ngữ cảnh (Q12): `?periodId=` (tuần của lưới FT), `?kind=` (Giữa khoá / Cuối khoá của lớp thường),
 * `?kn=` (kỹ năng — cuộn tới và đặt con trỏ vào em đầu tiên chưa có điểm của cột đó), `?hv=` (một học viên). Không có
 * `kn` lẫn `hv` thì con trỏ đứng ở ô trống đầu tiên mình được sửa.
 */
export default function ChamDiemPage() {
  const { classId } = useParams();
  const [params, setParams] = useSearchParams();
  const current = useCurrentPeriod();
  const { homNay } = useNgayNghiepVu();
  const hep = useManHinhHep();
  const [xemBang, setXemBang] = useState(false);

  const periodParam = params.get('periodId') ? Number(params.get('periodId')) : null;
  const kindParam = params.get('kind');
  const kn = params.get('kn');
  const hv = params.get('hv') ? Number(params.get('hv')) : null;

  /*
   * MỞ RA LÀ ĐỨNG Ở TUẦN HIỆN TẠI (lưới FT). Có tuần trên đường dẫn thì giữ nguyên; không có thì hỏi thẳng máy chủ tuần
   * hiện tại rồi mới tải lưới — không tải cả lớp mọi tuần trước rồi mới lọc. Lớp thường bỏ qua `periodId`.
   */
  const periodId = periodParam ?? current.data?.id ?? null;
  const choTuan = periodParam === null && !current.data && !current.error;
  const path = classId && !choTuan ? `/classes/${classId}/cham${periodId ? `?periodId=${periodId}` : ''}` : null;
  const { data, error, reload } = useApi<Cham>(path);

  /* "Đã lưu 10:31 ✓" ở đầu trang: giờ của lần lưu thành công gần nhất trên cả lưới. */
  const [luuLuc, setLuuLuc] = useState<Date | null>(null);
  const onReload = () => { setLuuLuc(new Date()); reload(); };

  /** Đổi tham số trên đường dẫn (replace) — tải lại (F5) và Back không nhảy tuần / nhảy bài. */
  const datThamSo = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  /* Lớp thường: một lưới là MỘT bài (mockup 10b §2) — cột tổng và tuần thi chỉ có nghĩa trong một bài. */
  const kinds = useMemo(() => kindsThuong(data?.thuong), [data?.thuong]);
  const kindChon = data?.thuong
    ? (kindParam && kinds.some((k) => k.kind === kindParam) ? kindParam : kindMacDinh(data.thuong))
    : null;
  const thuong = useMemo<ThuongSheet | null>(
    () => (data?.thuong ? { ...data.thuong, rows: data.thuong.rows.filter((r) => !kindChon || r.kind === kindChon) } : null),
    [data?.thuong, kindChon],
  );

  /*
   * Q12 / Task 7 Step 6 — cuộn tới ô trống đầu tiên của cột `kn` (hoặc dòng `hv`) MỘT LẦN cho mỗi ngữ cảnh mở trang.
   * Không có cả hai (gõ thẳng đường dẫn) thì đặt con trỏ vào ô trống ĐẦU TIÊN mình sửa được, môn nào cũng được —
   * `data-trong` chỉ gắn cho ô còn trống VÀ mình được sửa, nên ô trống đầu tiên trên trang là đúng ô cần chấm.
   */
  const khung = useRef<HTMLDivElement>(null);
  const daCuon = useRef<string | null>(null);
  const khoaCuon = `${classId}|${periodId}|${kindChon}|${kn}|${hv}`;
  useEffect(() => {
    if (!data || daCuon.current === khoaCuon) return;
    const id = requestAnimationFrame(() => {
      daCuon.current = khoaCuon;
      const root = khung.current;
      if (!root) return;
      /* Không gắn tên thẻ: cùng bộ chọn cho lưới (tr/td) và màn điện thoại (li/div). */
      const hang = hv !== null ? `[data-hv="${hv}"] ` : '';
      const tim = (chon: string) => root.querySelector<HTMLElement>(chon);
      const o = kn
        ? tim(`${hang}[data-kn="${kn}"][data-trong]`)
          ?? (kn === 'writing' ? tim(`${hang}[data-kn^="writing"][data-trong]`) : null)
          ?? (hang ? tim(`[data-kn="${kn}"][data-trong]`) : null)
        : hv !== null ? tim(`[data-hv="${hv}"]`) : tim('[data-trong]');
      if (!o) return;
      o.scrollIntoView({ block: 'center', inline: 'nearest' });
      const f = o.querySelector<HTMLElement>('input:not([readonly]):not([disabled]), button:not([disabled]), input');
      f?.focus();
      if (f instanceof HTMLInputElement) f.select();
    });
    return () => cancelAnimationFrame(id);
  }, [data, thuong, kn, hv, khoaCuon]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (!data) return <div className="page"><Skeleton rows={8} /></div>;

  const laFt = data.mode === 'ielts_band';
  const tenDot = laFt ? tenDotFt(data.ft) : kinds.find((k) => k.kind === kindChon)?.label ?? '';
  const han = laFt ? hanSomNhatFt(data.ft) : hanSomNhatThuong(thuong);
  const tuanMon = laFt ? null : tuanThiTheoMon(thuong, homNay || data.today);
  const nhapDuoc = (laFt ? data.ft?.editableSkills : data.thuong?.editableSkills) ?? [];
  const tungKyNang = hep && !xemBang;

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link className="btn btn-sm btn-ghost mb-1 no-underline" to="/test" title="Về khu vực Test">← Test</Link>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2 m-0">
            <span className="truncate">{data.classCode}{tenDot ? ` · ${tenDot}` : ''}</span>
            <NutLuat label="Luật chấm điểm">
              <span className="block">
                Ô để trống là chưa nhập, không phải 0 điểm. Chỉ kỹ năng bạn được phân công mới sửa được; kỹ năng khác
                vẫn đọc được để đối chiếu. Enter hoặc ↓ xuống em kế tiếp, Esc huỷ ô đang sửa. Mỗi môn có tuần thi và
                hạn chấm riêng.
              </span>
              {laFt ? (
                <span className="block">
                  Gõ <kbd className="px-1 rounded border text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>-</kbd> khi
                  em có lịch mà không làm bài; sửa lại được đến hết Chủ nhật của tuần thi, còn nguyên thì thành Không
                  dự thi.
                </span>
              ) : (
                <span className="block">
                  Mỗi ô hai số: số câu đúng / tổng số câu, cả hai đều điền. Writing và Speaking chấm theo thang điểm
                  thì điền điểm đạt / tổng điểm. Ô tổng đầu cột để điền nhanh cả cột; em làm đề khác thì sửa riêng ô đó
                  (viền vàng). Đạt từ 70% trở lên. Thiếu điểm khác chưa đạt. Gõ
                  {' '}<kbd className="px-1 rounded border text-slate-200" style={{ borderColor: 'var(--line-strong)' }}>-</kbd>{' '}
                  khi em không làm bài: môn đó tự dời sang tuần sau.
                </span>
              )}
            </NutLuat>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 mb-0">
            {data.branchName}
            {tuanMon && (
              <span title="Tuần thi của từng môn. L = Listening · R = Reading · W = Writing · S = Speaking"> · {tuanMon}</span>
            )}
            {laFt && (
              <span title={nhapDuoc.map((s) => `${skillShort(s)} = ${skillLabel(s)}`).join(' · ') || undefined}>
                {' · '}Bạn được nhập: {nhapDuoc.length ? nhapDuoc.map(skillShort).join(', ') : 'không kỹ năng nào'}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 min-w-0 max-w-full">
          {laFt && (
            <div className="w-[26rem] max-w-full">
              <WeekPicker periodId={periodId} onPeriod={(id) => datThamSo('periodId', id ? String(id) : null)} label="Tuần" />
            </div>
          )}
          {!laFt && kinds.length > 1 && (
            <label className="block">
              <span className="label">Bài</span>
              <select className="field w-40" value={kindChon ?? ''} onChange={(e) => datThamSo('kind', e.target.value || null)}>
                {kinds.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
              </select>
            </label>
          )}
          {han && <div className="pb-2"><Han loai="nhap-diem" han={han} /></div>}
          {luuLuc && (
            <span className="pb-2 text-[11px] text-slate-500 tabular-nums whitespace-nowrap"
              title="Mỗi ô tự lưu khi rời ô hoặc bấm Enter.">
              Đã lưu {String(luuLuc.getHours()).padStart(2, '0')}:{String(luuLuc.getMinutes()).padStart(2, '0')} ✓
            </span>
          )}
        </div>
      </div>

      {/* Q16 — màn hẹp: một kỹ năng một lúc; nút chữ nhỏ đổi qua lại với lưới (lưới cuộn ngang trong thẻ, G-11). */}
      <div ref={khung}>
        {hep && (
          <div className="flex justify-end">
            <button type="button" className="min-h-[44px] px-1 text-xs text-slate-500 hover:text-slate-200"
              onClick={() => setXemBang((v) => !v)}
              title={xemBang ? 'Quay lại chấm từng kỹ năng, mỗi em một ô to' : 'Mở lưới đủ các cột; lưới cuộn ngang trong thẻ'}>
              {xemBang ? 'Chấm từng kỹ năng' : 'Xem dạng bảng'}
            </button>
          </div>
        )}
        <Card bodyClass="p-0">
          {tungKyNang && laFt && data.ft && <MotKyNang mode="ielts_band" data={data.ft} onReload={onReload} kn={kn} hv={hv} />}
          {tungKyNang && !laFt && thuong && <MotKyNang mode="ratio" data={thuong} onReload={onReload} kn={kn} hv={hv} />}
          {!tungKyNang && laFt && data.ft && <LuoiFT data={data.ft} onReload={onReload} kn={kn} hv={hv} />}
          {!tungKyNang && !laFt && thuong && <LuoiThuong data={thuong} onReload={onReload} kn={kn} hv={hv} />}
        </Card>
      </div>
    </div>
  );
}
