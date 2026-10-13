import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { useCurrentPeriod, WeekPicker } from '../../ui/Filters.tsx';
import { Han } from '../../ui/Han.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { skillLabel, skillShort } from '../../lib/format.ts';
import { chuOChuaLuu, trangCha } from '@shared/domain/index.ts';
import { DuongVe } from '../../ui/ThanhTruocSau.tsx';
import { hanSomNhatFt, tenDotFt } from './LuoiFT.tsx';
import { hanSomNhatThuong, kindMacDinh, kindsThuong, tuanThiTheoMon, type ThuongSheet } from './LuoiThuong.tsx';
import { LuoiChamLop, duongCham, thuongTheoBai, type Cham } from './LuoiChamLop.tsx';

/**
 * LƯỚI CHẤM — MỘT TRANG CHO CẢ LỚP FAST TRACK VÀ LỚP THƯỜNG (spec §3.5, mockup 05a §2).
 *
 * Trang này KHÔNG tự đoán loại lớp: máy chủ trả `mode` ở `/classes/:id/cham` và trang chọn lưới theo đó. Nhờ vậy mở
 * `/nhap-diem/:id` của một lớp thường không còn ra lưới Mock Test (đặc tả §6) — và ngược lại.
 *
 * Phần lưới (chọn lưới theo loại lớp, màn hẹp một kỹ năng một lúc, đặt con trỏ) nằm ở `LuoiChamLop` — dùng chung với
 * lưới mở tại chỗ của Lịch Test (PR-UX1). Trang này chỉ còn đầu trang: tên lớp + đợt, luật ⓘ, chọn tuần/bài, hạn.
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
  /* PR-MT0: `?kind=mt0` ở lớp thường → máy chủ trả lưới band các MT0 (không phải bảng tỷ lệ). */
  const path = classId && !choTuan ? duongCham(Number(classId), { periodId, kind: kindParam === 'mt0' ? 'mt0' : null }) : null;
  const { data, error, reload } = useApi<Cham>(path);

  /* "Đã lưu 10:31 ✓" ở đầu trang: giờ của lần lưu thành công gần nhất trên cả lưới. */
  const [luuLuc, setLuuLuc] = useState<Date | null>(null);
  /* PR-UX1: còn ô lưu hỏng thì đầu trang nói "n ô chưa lưu" thay cho "Đã lưu hh:mm ✓" — không để giờ lưu cuối che ô hỏng. */
  const [chuaLuu, setChuaLuu] = useState(0);
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
  const thuong = useMemo<ThuongSheet | null>(() => thuongTheoBai(data?.thuong, kindChon), [data?.thuong, kindChon]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (!data) return <div className="page"><Skeleton rows={8} /></div>;

  const laFt = data.mode === 'ielts_band';
  const tenDot = laFt ? tenDotFt(data.ft) : kinds.find((k) => k.kind === kindChon)?.label ?? '';
  const han = laFt ? hanSomNhatFt(data.ft) : hanSomNhatThuong(thuong);
  const tuanMon = laFt ? null : tuanThiTheoMon(thuong, homNay || data.today);
  const nhapDuoc = (laFt ? data.ft?.editableSkills : data.thuong?.editableSkills) ?? [];

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <DuongVe cha={trangCha('nhap-diem')} ten={`Nhập điểm ${data.classCode}`} chiTiet={tenDot} />
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2 m-0">
            <span className="truncate" title={`${data.classCode}${tenDot ? ` · ${tenDot}` : ''}`}>{data.classCode}{tenDot ? ` · ${tenDot}` : ''}</span>
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
              <span title="Tuần thi của từng môn (rê chuột lên tên cột để xem tên môn đầy đủ)"> · {tuanMon}</span>
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
          {chuaLuu > 0 && (
            <span className="pb-2 text-xs font-semibold text-bad whitespace-nowrap" role="alert"
              title="Ô viền đỏ chưa lưu được — bấm Lưu lại ở ô đó.">
              {chuOChuaLuu(chuaLuu)}
            </span>
          )}
          {luuLuc && chuaLuu === 0 && (
            <span className="pb-2 text-xs text-slate-500 tabular-nums whitespace-nowrap"
              title="Mỗi ô tự lưu khi rời ô hoặc bấm Enter.">
              Đã lưu {String(luuLuc.getHours()).padStart(2, '0')}:{String(luuLuc.getMinutes()).padStart(2, '0')} ✓
            </span>
          )}
        </div>
      </div>

      <LuoiChamLop data={data} kind={kindChon} kn={kn} hv={hv} onReload={onReload} onSoOChuaLuu={setChuaLuu} />
    </div>
  );
}
