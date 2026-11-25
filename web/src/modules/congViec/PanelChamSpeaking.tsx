import { useEffect, useMemo, useState } from 'react';
import { LOP_DA_LUU } from '../../ui/KhuonViec.tsx';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { ChipHan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { dotGvCham, ngay, quyCheChamSpeaking } from '@shared/domain/index.ts';
import { suaDuoc } from '../fasttrack/ScoreEntry.tsx';
import { LuoiFT, type FtSheet } from '../cham/LuoiFT.tsx';
import { NutGvCham, useGvChamCot } from '../cham/GvCham.tsx';
import type { NguoiChon } from '@shared/domain/index.ts';
import { MuiTenGap } from '../yThuc/NhanViPham.tsx';
import { t } from '@shared/i18n/index.ts';
import { TinLop } from './TinLop.tsx';
import { type Dong, type DuLieu, type Lop, duongChamSpeaking, gom, hanSom, lopKe, soCho, tuanCuaLop } from './chamSpeakingChung.ts';

/**
 * CHẤM SPEAKING (OV-14c; V6 GD-2; S-CHEO-CN 16/11; KHUÔN A 25/11 — mockup `thiet-ke/v26/cham-speaking.html`) — panel của MỘT LỚP trong việc chung "Chấm Speaking"
 * (GV Speaking chấm chéo S). Danh sách lớp là `ChamSpeakingMuc` (mỗi lớp một dòng); bấm dòng → panel này của đúng lớp đó (`lop`, địa chỉ `?lc=`): ô "GV chấm"
 * (lớp × đợt mới nhất, lưu máy chủ — `useGvChamCot`) + ĐÚNG lưới FT (`LuoiFT`, cột Speaking) + ngăn "Đã có điểm · n bài". Chân: "Lớp tiếp: {mã} ›" (theo thứ tự
 * danh sách) → hết lớp "Việc tiếp ›". Lớp thuộc "Chi nhánh khác" (không có trong hàng đợi chính) tải `?cn=khac` — không vào số việc.
 * Dữ liệu dùng chung với danh sách (`dungBanLuu`): mở panel không thêm request.
 */
export function PanelChamSpeaking({ onDong, onDaLam, lop: lopUrl = null, onLop = null, onTiep = null, nguoi = null }: { onDong: () => void; onDaLam: () => void;
  /** CV-SUA-1011: QL theo dõi việc GV này ("Của GV") — hàng đợi của GV đó; ô sửa được theo quyền người xem. */
  nguoi?: number | null;
  /** R1-LUU-TIEP: việc kế (Công việc) — "Việc tiếp ›" ở chân panel khi hết lớp. */
  onTiep?: (() => void) | null;
  /** Lớp đang mở (mã lớp, địa chỉ `?lc=`); không có → lớp đầu còn bài. */
  lop?: number | null;
  /** Báo nơi gọi lớp vừa chọn ("Lớp tiếp ›") để giữ trên địa chỉ. */
  onLop?: ((classId: number) => void) | null;
}) {
  const { data, error, reload } = useApi<DuLieu>(duongChamSpeaking(nguoi, false), [nguoi], { dungBanLuu: true });
  const [lopNoi, setLopNoi] = useState<number | null>(lopUrl);
  useEffect(() => { setLopNoi(lopUrl); }, [lopUrl]);
  const dsChinh = useMemo(() => gom(data?.rows ?? []), [data]);
  /* Lớp không có trong hàng đợi chính = lớp của "Chi nhánh khác" → tải `?cn=khac` (danh sách đã mở mục đó thì có sẵn bản — `dungBanLuu`). */
  const laKhac = lopNoi !== null && !!data && !dsChinh.some((l) => l.classId === lopNoi);
  const khac = useApi<DuLieu>(laKhac ? duongChamSpeaking(nguoi, true) : null, [nguoi, laKhac], { dungBanLuu: true });
  const dsKhac = useMemo(() => gom(khac.data?.rows ?? []), [khac.data]);
  const ds = laKhac ? dsKhac : dsChinh;
  const dl = laKhac ? khac.data : data;
  const hien = lopNoi !== null ? ds.find((l) => l.classId === lopNoi) ?? null : dsChinh.find((l) => soCho(l.rows)) ?? null;
  /* K3 chân: "✓ Đã lưu n bài" — số lần lưu trong lần mở panel này (cả chi nhánh khác). */
  const [soLuu, setSoLuu] = useState(0);
  /* KHUÔN A: việc chung còn bài ở lớp khác → KHÔNG báo "đã làm" (sẽ ẩn cả danh sách lớp sau lần lưu đầu); chỉ báo khi hàng đợi hết hẳn. */
  const daLuu = () => { setSoLuu((n) => n + 1); reload(); };
  const hetHet = soLuu > 0 && data?.soBai === 0;
  useEffect(() => { if (hetHet) onDaLam(); }, [hetHet]);   // eslint-disable-line react-hooks/exhaustive-deps -- một lần khi hết
  /* Chi nhánh khác không vào số việc — chỉ tải lại phần đó. */
  const daLuuKhac = () => { setSoLuu((n) => n + 1); khac.reload(); };
  const doiLop = (l: Lop) => { setLopNoi(l.classId); onLop?.(l.classId); };
  const ke = hien ? lopKe(ds, hien) : null;
  const onHet = () => (ke ? { nhan: t('Lớp tiếp: {lop} ›', { lop: ke.classCode }), onClick: () => doiLop(ke) } : onTiep ? { nhan: t('Việc tiếp ›'), onClick: onTiep } : null);
  const hetLop = !!hien && soCho(hien.rows) === 0;
  const tuan = hien ? tuanCuaLop(hien.rows) || tuanCuaLop(hien.rows, false) : '';
  const dau = {
    /* GD-1b (lời 24): không ghi "Việc chung" — cùng dạng đầu panel việc khác ("Việc · {tab}"). */
    loai: t('Việc · Chấm Speaking'),
    /* Khuôn A: đầu panel ghi mã tuần như dòng danh sách ("W4 AUG+ · 8 bài" — chủ SP 26/11: nhiều tuần = tuần xa nhất + "+") + hạn sớm nhất. */
    /* Hết bài của lớp: "đã chấm n bài" (mockup A3), không hạn. */
    dong2: hien ? [<b key="l" className="font-semibold text-slate-100">{hien.classCode}</b>, ...(tuan ? [<TinLop key="w" phan={[tuan]} />] : []), <TinLop key="n" phan={[hetLop ? t('đã chấm {n} bài', { n: hien.rows.length }) : t('{n} bài', { n: soCho(hien.rows) })]} />] : [],
    han: hien && !hetLop ? <ChipHan loai="nhap-diem" han={hanSom(hien.rows)} /> : null,
  };
  const tiep = onHet();
  const chinh = tiep ? <button type="button" className={hetLop || !hien ? 'btn btn-primary min-h-[44px] sm:min-h-0' : 'btn min-h-[44px] sm:min-h-0'} onClick={tiep.onClick}>{tiep.nhan}</button> : null;
  const phu = soLuu > 0 ? <span role="status" className={`text-[13px] font-semibold ${LOP_DA_LUU}`}>✓ {t('Đã lưu {n} bài', { n: soLuu })}</span> : undefined;
  return (
    <KhungPanel hd="nhap-diem" tieuDe={t('Chấm Speaking')} dau={dau} loai={dau.loai} onDong={onDong}
      /* GD-4b Q10 / Q12: `nguoi` = hàng đợi của GV khác (QL theo dõi, nhập hộ). */
      quyChe={data?.rows.length ? quyCheChamSpeaking(nguoi != null) : null}
      chan={chinh || phu ? { huy: null, phu, chinh: chinh ?? undefined } : undefined}>
      {error ? <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
        : !data || (laKhac && !khac.data && !khac.error) ? <div className="pt-3"><Skeleton rows={6} /></div>
          : khac.error && laKhac ? <ErrorState message={khac.error.message} hint={khac.error.hint} status={khac.error.status} onRetry={khac.reload} />
            : !hien || !dl ? <div className="pt-3"><Empty title={t('Không có bài Speaking chờ chấm')} /></div>
              : <ThanLop key={hien.khoa} n={hien} onDaLuu={laKhac ? daLuuKhac : daLuu} onHet={onHet} gvChamCot={dl.gvChamCot} />}
    </KhungPanel>
  );
}

/** Thân panel của một lớp: ô "GV chấm" + lưới FT bài chờ (tuần dưới tên em CHỈ khi lớp có nhiều tuần) + ngăn con "Đã có điểm". */
function ThanLop({ n, onDaLuu, onHet, gvChamCot }: {
  gvChamCot?: { chon: Record<string, NguoiChon | null>; macDinh: NguoiChon | null };
  n: Lop; onDaLuu: () => void; onHet: () => { nhan: string; onClick: () => void } | null;
}) {
  const { homNay } = useNgayNghiepVu();
  /* Ô "GV chấm" nhớ theo lớp × đợt: đợt của tuần mới nhất (dòng đầu — `gom` xếp tuần mới trên); chọn một lần dùng cho mọi bài lưu ở lớp này. */
  const moi = n.rows.filter((r) => r.weekStart === n.rows[0]?.weekStart);
  const periodId = moi[0]?.cell.periodId ?? null;
  const dot = dotGvCham(periodId, moi.map((r) => r.attemptNo));
  const tuMayChu = !gvChamCot ? null : dot && `${n.classId}:${dot}` in gvChamCot.chon ? gvChamCot.chon[`${n.classId}:${dot}`] : gvChamCot.macDinh;
  const [gv, setGv] = useGvChamCot(n.classId, dot, tuMayChu);
  /* Ảnh chụp tập bài chờ lúc mở lớp: bài vừa chấm đứng nguyên trong lưới (không nhảy sang "Đã có điểm" giữa phiên chấm) tới khi đóng panel / đổi lớp. */
  const [choLucMo] = useState<ReadonlySet<number>>(() => new Set(n.rows.filter((r) => r.cho).map((r) => r.attemptId)));
  const cho = n.rows.filter((r) => r.cho || choLucMo.has(r.attemptId));
  const daCo = n.rows.filter((r) => !r.cho && !choLucMo.has(r.attemptId))
    .map((r) => {
      const ten = r.cell.gvCham?.ten ?? r.cell.enteredByName;
      return { ...r, phu: ten ? `${t('GV chấm: {ten}', { ten })}${r.cell.enteredAt ? ` · ${ngay(r.cell.enteredAt, homNay)}` : ''}` : null };
    });
  const sua = n.rows.some((r) => suaDuoc(r.cell));
  /* Lớp một tuần: tuần ở đầu panel, không lặp dưới từng em; nhiều tuần / lượt: ghi dưới tên em (`DongVang`). */
  const nhieuTuan = new Set(n.rows.map((r) => r.weekStart)).size > 1;
  const sheet = (rs: Dong[]): FtSheet => ({
    classId: n.classId, classCode: n.classCode, branchName: '',
    /* Một tuần trong lưới → đợt đó; nhiều tuần → không gắn đợt (tuần ghi ở từng dòng). */
    period: periodId !== null && rs.length && rs.every((r) => r.cell.periodId === periodId) && rs[0].weekStart
      ? { id: periodId, code: rs[0].cell.periodCode ?? '', weekStart: rs[0].weekStart, weekEnd: '' } : null,
    editableSkills: sua ? ['speaking'] : [], rows: rs,
  });
  return (
    <div className="pb-1 pt-3">
      {sua && dot && cho.length > 0 && <div className="max-w-[420px] pb-3"><NutGvCham hang nhan={t('GV chấm')} value={gv} onChange={setGv} /></div>}
      {cho.length > 0 && <LuoiFT data={sheet(cho)} onReload={onDaLuu} chiCot={['speaking']} gon hienTuan={nhieuTuan} gvCham={gv} onHet={onHet} />}
      {daCo.length > 0 && (
        <details className="group/da mt-1" open={!cho.length || undefined}>
          <summary className="flex min-h-[44px] cursor-pointer list-none sm:min-h-[40px] items-center gap-2 px-3 text-[13px] font-semibold text-slate-400">
            {t('Đã có điểm · {n} bài', { n: daCo.length })}<span aria-hidden className="group-open/da:rotate-90"><MuiTenGap mo={false} /></span>
          </summary>
          <LuoiFT data={sheet(daCo)} onReload={onDaLuu} chiCot={['speaking']} gon hienTuan={nhieuTuan} gvCham={gv} />
        </details>
      )}
    </div>
  );
}
