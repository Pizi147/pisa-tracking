/**
 * HỒ SƠ MỘT LƯỢT TEST LỚP THƯỜNG (HSL-LT, M4 PR 3 — khung `thiet-ke/v7/ho-so-luot-test.html` "A · lớp thường", 375): `/luot-test/:id`.
 *
 * Cùng khung với hồ sơ lượt FT (`MockDetailPage`): đầu hồ sơ · tóm tắt (% tổng · kết quả · Còn lại) · bảng môn (bấm dòng mở Nhận xét |
 * Case & phương án + Lịch sử môn) · Lịch sử lượt. Khác FT: môn theo chương trình lớp (FOU L · R · G+V · P), điểm = số câu đúng / tổng + %,
 * "Đạt từ" ngưỡng lớp (không Target / kỳ vọng / Overall / S Ex), vắng = dấu "-" tự dời môn sang tuần sau (C08).
 * KHÔNG CÓ LUẬT THỨ HAI: dữ liệu là đúng MỘT dòng của bảng điểm lớp (`GET /regular/attempts/:id`), ô điểm / "-" / nhận xét / ⋯ là chính các thành
 * phần của lưới lớp thường (`ODiemThuong`, `useLuuThuong`, `thaoTacKyNang`, `HopThaoTacMt`), Case / PA là khối của hồ sơ HV (`CaseLuotKn`).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { cuonOnDinh } from '../../lib/cuonOnDinh.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Info as Tag, Skeleton, Status } from '../../ui/ui.tsx';
import { NutLuat } from '../../ui/NutLuat.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { DuongVe } from '../../ui/ThanhTruocSau.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { useManHinh } from '../../ui/TheDong.tsx';
import { ChuDich } from '../../ui/ChuDich.tsx';
import { NhanGt } from '../classes/DauTrangLop.tsx';
import { NganCase } from '../students/NganCase.tsx';
import { TenCase, type CaseCard, type SkillBoardRow } from '../cases/SkillBoard.tsx';
import { KetQua, oThuong, useLuuThuong, type ThuongSheet } from '../cham/LuoiThuong.tsx';
import { DauO, VIEN_LOI } from '../cham/LuoiFT.tsx';
import { NganLichSuBai } from '../cham/NganLichSuBai.tsx';
import { HopThaoTacMt, THAO_TAC_CO_HOP } from './HopThaoTacMt.tsx';
import { KHOA_HOAN_TAT_HINT, ODiemThuong } from './ScoreEntry.tsx';
import { ONhanXet } from './NhanXet.tsx';
import { CaseLuotKn } from './CaseLuotKn.tsx';
import { dongLuot, type LichSuCase } from './DongThoiGianLuot.tsx';
import { ChonDot, ConLaiLuot, Info, LichSuGon, VungMoKn, viecCaseLuot, type ViecConLai } from './MockDetailPage.tsx';
import { attemptHref, fmtDate } from '../../lib/format.ts';
import {
  CHU_THAO_TAC, CHU_THEM_PA, NAV_RONG, PERMISSIONS, duongDotTest, duongNhapDiemCu, moDiemLopCu, ngay, tenMon, tenMonNgan, thaoTacKyNang, trangCha, trangThaiTT, tuanLich,
  vaiXemHocVien, type ThaoTac,
} from '@shared/domain/index.ts';
import { dich, t } from '@shared/i18n/index.ts';

type Dong = ThuongSheet['rows'][number];
type NguonLs = Parameters<typeof dongLuot>[0];
/** `GET /regular/attempts/:id` (`regularAttemptDetail`): đầu bảng điểm lớp + đúng một dòng + lịch sử. */
type ChiTiet = Omit<ThuongSheet, 'rows'> & {
  dong: Dong; cycleId: number | null; lichSuCase: LichSuCase[];
  lopHienTai: { id: number; code: string } | null;
  huy: { lyDo: string | null; ai: string | null; khi: string } | null;
  canCancel: boolean;
  history: NguonLs['history']; scoreHistory: NguonLs['scoreHistory'];
};
type DotCuaHv = Parameters<typeof ChonDot>[0]['ds'][number];
/* Như `ROW_GRID` của FT, cột Môn rộng hơn (tên môn chương trình dài: "Grammar + Vocabulary" không xuống dòng). Chuỗi viết nguyên để Tailwind sinh lớp. */
const LUOI_MON = 'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 md:grid-cols-[12rem_9.5rem_7.5rem_minmax(10rem,1.2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_12rem] md:items-center';
type MoNgan = { caseId: number; paId?: number; viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa' };

export default function LuotThuongPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, can } = useSession();
  const { data, loading, error, reload: taiLai } = useApi<ChiTiet>(id ? `/regular/attempts/${id}` : null);
  /* Khối Case / PA = thẻ của bảng kỹ năng hồ sơ HV, đúng lộ trình của lượt — chỉ gọi khi lượt có Case. */
  const bang = useApi<{ rows: SkillBoardRow[] }>(data?.dong.cases.length
    ? `/students/${data.dong.studentId}/skill-board${data.cycleId ? `?cycleId=${data.cycleId}` : ''}` : null);
  /* Sau mọi thao tác: trang lượt + bảng Case cùng tải lại — Còn lại, cột Case, hai lịch sử đổi cùng lúc. */
  const reload = () => { taiLai(); if (bang.data) bang.reload(); };
  const ct = data?.programme.code ?? null;
  const luu = useLuuThuong(Number(id), reload, ct, data?.dong.studentName);
  const dsDot = useApi<{ rows: DotCuaHv[] }>(data ? `/attempts?studentId=${data.dong.studentId}` : null);
  const { homNay } = useNgayNghiepVu();
  const chiDoc = !!vaiXemHocVien(session?.roles);
  const hep = useManHinh('(max-width: 767px)');
  const toast = useToast();
  const [moKn, setMoKn] = useState<string | null>(null);
  const [formPa, setFormPa] = useState<number | null>(null);
  const [ngan, setNgan] = useState<MoNgan | null>(null);
  const [hop, setHop] = useState<{ t: ThaoTac; k: string } | null>(null);
  const [lichSuMon, setLichSuMon] = useState<string | null>(null);
  const dangKhoiPhuc = useRef(false);   // chống bấm đúp
  /* `?kn=` (hồ sơ HV › bảng Test, Công việc): mở sẵn dòng môn + cuộn tới, một lần khi dữ liệu có. Lượt không có môn đó → không cuộn, không lỗi. */
  const [thamSo] = useSearchParams();
  const knUrl = thamSo.get('kn');
  useEffect(() => {
    if (!data || !knUrl || !data.dong.skillSchedule.some((s) => s.skill === knUrl)) return undefined;
    setMoKn(knUrl);
    return cuonOnDinh(() => document.getElementById(`kn-${knUrl}`), null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data, knUrl]);

  /* Lượt FT / MT0 mở nhầm đường này (máy chủ 404) → hồ sơ Mock; nó tự chuyển tiếp lượt không phải FT, nên không vòng. */
  if ((error as { status?: number } | null)?.status === 404) return <Navigate to={duongDotTest({ id: Number(id) })} replace />;
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={10} />;

  const d = data;
  const r = d.dong;
  const huy = r.status === 'cancelled';
  const theCase = new Map((bang.data?.rows ?? []).flatMap((x) => x.cases).filter((c) => r.cases.some((x) => x.id === c.id)).map((c) => [c.id, c]));
  /** Mở dòng môn + cuộn tới + focus đúng chỗ của việc (Còn lại). */
  const moDong = (k: string, chon?: string) => {
    setMoKn(k);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(`kn-${k}`);
      el?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (chon) document.querySelector<HTMLElement>(`#kn-${k} ${chon}, #vung-${k} ${chon}`)?.focus({ preventScroll: true });
    }));
  };
  const thaoTac = (k: string) => thaoTacMon(d, k, homNay, can);
  const conLai = huy ? [] : conLaiThuong(d, homNay, theCase, chiDoc, thaoTac, {
    moDong, themPa: (k, caseId) => { setFormPa(caseId); moDong(k); }, moCase: (caseId, viec, paId) => setNgan({ caseId, viec, paId }),
  });
  const tuanThi = tuanLuot(r, ct, homNay);
  const nhapDiemLop = r.skillSchedule.some((s) => s.canEdit) && !huy
    ? duongNhapDiemCu(String(d.class.id), new URLSearchParams({ kind: r.kind }), moDiemLopCu(session?.nav ?? NAV_RONG)) : null;
  /* LUAT-34 (T20b): "Khôi phục điểm" một bấm — như ⋯ ô của bảng điểm lớp (máy chủ ghi lại điểm cất qua đúng đường lưu điểm). */
  const khoiPhuc = async (k: string) => {
    if (dangKhoiPhuc.current) return;
    dangKhoiPhuc.current = true;
    try {
      await api.post(`/attempts/${r.attemptId}/skills/${k}/khoi-phuc-diem`, {});
      invalidate('/regular'); invalidate('/classes'); invalidate('/attempts'); invalidate('/students'); invalidate('/my-work');
      toast.push('ok', t('Đã khôi phục điểm {x}{x2}', { x: tenMonNgan(ct, k), x2: ` · ${r.studentName}` }));
      reload();
    } catch (e: any) { toast.push('error', e.message); } finally { dangKhoiPhuc.current = false; }
  };

  return (
    <div className="page space-y-4">
      {/* Lượt đã huỷ (em chuyển lớp, bảo lưu…): dải mảnh nói lý do · ai · ngày; mọi ô khoá (máy chủ `canEdit`). */}
      {huy && (
        <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--line-strong)' }}>
          <span className="font-semibold text-slate-100">{t('Đã huỷ')}</span>
          <span className="min-w-0 break-words text-slate-400">{[d.huy?.lyDo, d.huy?.ai, d.huy ? fmtDate(d.huy.khi) : null].filter(Boolean).join(' · ')}</span>
        </div>
      )}

      {/* ① ĐẦU HỒ SƠ — ai (↗ hồ sơ HV) · lượt nào · lớp lúc Test · lịch · Đạt từ; "Nhập điểm lớp ›" bên phải. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <DuongVe cha={trangCha('luot', { studentId: r.studentId, tenHv: r.studentName })} ten={`${r.kindLabel} · ${r.studentName}`} chiTiet={d.class.code} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="m-0 min-w-0 break-words text-xl font-bold text-slate-100">
              <span className="sr-only">{t('Hồ sơ lượt Test ·')} </span>
              <Link to={`/hoc-vien/${r.studentId}`} className="text-inherit no-underline hover:underline" title={t('Hồ sơ học viên')}>
                {r.studentName}<span aria-hidden className="ml-1 text-base text-slate-400">↗</span>
              </Link>
            </h1>
            <span className="inline-flex items-center gap-2">
              {(dsDot.data?.rows.length ?? 0) > 1 ? (
                <ChonDot hienTai={r.attemptId} ds={dsDot.data?.rows ?? []} homNay={homNay} onChon={(x) => navigate(attemptHref({ ...x, studentId: r.studentId }), { replace: true })} />
              ) : <span className="text-[15px] font-semibold text-slate-200">{r.kindLabel}</span>}
              <NutLuat label={t('Thông tin lượt Test')}>
                <dl className="m-0 grid gap-2">
                  <Info label={t('Chương trình')}>{d.programme.name}</Info>
                  {d.class.branchName && <Info label={t('Chi nhánh')}>{d.class.branchName}</Info>}
                  <Info label={t('Hạn chấm')}>{r.deadline ? t('hạn {ngay}', { ngay: ngay(r.deadline, homNay) }) : '—'}</Info>
                </dl>
              </NutLuat>
            </span>
            {r.hoanTat && <Tag title={t('Hết Chủ nhật {ngay}. {x}', { ngay: ngay(r.chuNhatCuoi), x: KHOA_HOAN_TAT_HINT })}>{t('Đủ điểm')}</Tag>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
            <NhanGt n={t('Lớp lúc Test')} g={<>{d.class.code}{d.lopHienTai && <span className="ml-1 text-xs font-medium text-slate-400">· {t('nay {x}', { x: d.lopHienTai.code })}</span>}</>} />
            <NhanGt n={t('Lịch')} g={<span className="tabular-nums">{tuanThi ?? t('Chưa chốt tuần')}</span>} />
            <NhanGt n={t('Đạt từ')} g={<span className="tabular-nums">{Math.round(d.passThreshold * 100)}%</span>} />
          </div>
        </div>
        {nhapDiemLop && <Link className="btn min-h-[44px] no-underline sm:min-h-0" to={nhapDiemLop}>{t('Nhập điểm lớp ›')}</Link>}
      </div>

      {/* ② TÓM TẮT — % tổng (đủ môn) · kết quả (cùng ô Kết quả của bảng điểm lớp) · Còn lại. */}
      <section aria-label={t('Tóm tắt lượt')} className="card flex flex-wrap items-start gap-x-8 gap-y-3 px-4 py-3">
        <div className="min-w-0">
          <span className="block text-xs font-medium text-slate-400">{t('% tổng')}</span>
          {/* Chỉ khi đủ môn (`tyLeTong`); môn còn thiếu đã nằm ở dòng phụ của Kết quả — không lặp. */}
          <span className="mt-1 block">
            {r.result.tyLeTong != null
              ? <span className="text-xl font-bold leading-none tabular-nums text-slate-100">{Math.round(r.result.tyLeTong * 100)}%</span>
              : <span className="text-xl font-bold leading-none text-slate-600">—</span>}
          </span>
        </div>
        <div className="min-w-0 sm:pt-4">
          {huy ? <Status kind="idle">{t('Đã huỷ')}</Status> : <KetQua row={r} sheet={{ ...d, rows: [r] }} anCase />}
        </div>
        <ConLaiLuot ds={conLai} />
      </section>

      {/* ③ BẢNG MÔN — một dòng một môn; bấm dòng mở vùng Nhận xét | Case & phương án + Lịch sử môn ngay dưới. */}
      <section aria-label={t('Kết quả theo môn')} className="card overflow-hidden p-0">
        <div role="table" aria-label={t('Kết quả theo môn')}>
          <div role="row" className={`${LUOI_MON} hidden px-3 py-2 text-[12px] font-semibold text-slate-500 md:grid`}>
            <div role="columnheader">{t('Môn')}</div>
            <div role="columnheader">{t('Lịch')}</div>
            <div role="columnheader">{t('Điểm')}</div>
            <div role="columnheader">{t('Trạng thái')}</div>
            <div role="columnheader">{t('Nhận xét')}</div>
            <div role="columnheader">Case</div>
            <div role="columnheader"><span className="sr-only">{t('Thao tác')}</span></div>
          </div>
          {d.programme.skills.filter((k) => r.skillSchedule.some((s) => s.skill === k)).map((k) => (
            <DongMon key={k} d={d} k={k} homNay={homNay} chiDoc={chiDoc} hep={hep} luu={luu} mo={moKn === k} thaoTac={thaoTac(k)}
              caseChu={(() => { const c = r.cases.find((x) => x.skill === k); const the = c && theCase.get(c.id); return the ? dich(the.trangThaiV4.chu) : null; })()}
              onMo={() => setMoKn((x) => (x === k ? null : k))}
              onThaoTac={(x) => (x === 'khoi-phuc-diem' ? void khoiPhuc(k) : setHop({ t: x, k }))}
              onLichSu={() => setLichSuMon(k)}
              vungCase={(
                <>
                  <CaseLuotKn cards={r.cases.filter((c) => c.skill === k).map((c) => theCase.get(c.id)).filter((x): x is CaseCard => !!x)}
                    studentId={r.studentId} chiDoc={chiDoc || huy} form={formPa} onForm={setFormPa}
                    onMoCase={(caseId, o) => setNgan({ caseId, paId: o?.paId, viec: o?.viec === 'them-pa' ? undefined : o?.viec })} onDoi={reload} />
                  {/* Case chưa có thẻ ở bảng kỹ năng (đang tải / lộ trình khác): vẫn mở được Ngăn Case. */}
                  {r.cases.filter((c) => c.skill === k && !theCase.has(c.id)).map((c) => (
                    <button key={c.id} type="button" className="link mt-1 block border-0 bg-transparent p-0 text-left text-xs font-semibold max-sm:min-h-[44px]" onClick={() => setNgan({ caseId: c.id })}>
                      <TenCase c={{ title: `Case ${tenMon(ct, k)}`, tenSos: null }} />
                    </button>
                  ))}
                </>
              )}
              lichSu={(
                <LichSuGon tieuDe={t('Lịch sử {x}', { x: tenMon(ct, k) })}
                  dong={dongLuot({ history: d.history.filter((h) => h.field === k), scoreHistory: d.scoreHistory.filter((h) => h.skill === k),
                    lichSuCase: d.lichSuCase.filter((h) => h.topic === k), ct, homNay })} />
              )} />
          ))}
        </div>
      </section>

      {/* ④ LỊCH SỬ LƯỢT — thu gọn cuối trang; "Lịch sử chi tiết" mở nhật ký các ô. */}
      <div id="lich-su">
        <LichSuGon tieuDe={t('Lịch sử lượt')} dong={dongLuot({ history: d.history, scoreHistory: d.scoreHistory, lichSuCase: d.lichSuCase, ct, homNay })} the
          chiTiet={{ dong2: [r.studentName, r.kindLabel, d.class.code], id: r.attemptId }} />
      </div>

      {ngan && (
        <NganCase caseId={ngan.caseId} paId={ngan.paId} viec={ngan.viec} hocVien={r.studentName} lop={d.class.code}
          onClose={() => { setNgan(null); reload(); }} onChanged={reload} />
      )}
      {hop && (
        <HopThaoTacMt key={`${hop.t}:${hop.k}`} thaoTac={hop.t} attemptId={r.attemptId} skill={hop.k} ct={ct} laThuong quanLy={d.canPlan}
          row={{ periodId: null, weekStart: r.skillSchedule.find((s) => s.skill === hop.k)?.weekStart ?? null, deadline: r.skillSchedule.find((s) => s.skill === hop.k)?.deadline ?? null }}
          onClose={() => setHop(null)} onDone={reload} />
      )}
      {lichSuMon && <NganLichSuBai attemptId={r.attemptId} skill={lichSuMon} ct={ct} tenHv={r.studentName} onClose={() => setLichSuMon(null)} />}
    </div>
  );
}

/** Tuần thi của lượt: một tuần → tuần đó; nhiều tuần → "L, R: W3 SEP · P: W4 SEP". Môn dời bằng "-" giữ tuần gốc (cột Lịch ghi tuần mới). */
function tuanLuot(r: Dong, ct: string | null, homNay: string): string | null {
  const nhom: { tuan: string; mon: string[] }[] = [];
  for (const s of r.skillSchedule) {
    const w = s.noShow && s.movedFromStart ? s.movedFromStart : s.weekStart;
    if (!w) continue;
    const tuan = tuanLich(w, homNay);
    const cu = nhom.find((n) => n.tuan === tuan);
    if (cu) cu.mon.push(tenMonNgan(ct, s.skill)); else nhom.push({ tuan, mon: [tenMonNgan(ct, s.skill)] });
  }
  if (!nhom.length) return null;
  return nhom.length === 1 ? nhom[0].tuan : nhom.map((n) => `${n.mon.join(', ')}: ${n.tuan}`).join(' · ');
}

/** Nút chính + menu ⋯ của một môn — cùng `thaoTacKyNang` (laFt = false) với menu ⋯ ô của bảng điểm lớp; nhập / sửa điểm làm ngay trong ô nên không lặp. */
function thaoTacMon(d: ChiTiet, k: string, homNay: string, can: (p: string) => boolean): { chinh: ThaoTac | null; menu: ThaoTac[] } {
  const s = d.dong.skillSchedule.find((x) => x.skill === k);
  if (d.dong.status === 'cancelled' || !s) return { chinh: null, menu: [] };
  const coDiem = (d.dong.result.skills.find((x) => x.skill === k)?.score ?? null) !== null;
  const tt = trangThaiTT({ batBuoc: true, tuanBatDau: s.weekStart ?? null, coDiem, sit: s.sitStatus ?? null, choDuyet: false, lichSu: false, homNay });
  const tat = thaoTacKyNang(tt, { nhapDiem: s.canEdit, quanLy: d.canPlan, gvcn: !!d.laGvcn, laFt: false, dotHoanTat: !!d.dong.hoanTat, doiLich: s.doiLich,
    huy: can(PERMISSIONS.ATTEMPT_SKIP_SKILL), han: can(PERMISSIONS.DEADLINE_OVERRIDE), diemHuy: !!s.diemHuy });
  const chinh = tat.chinh && THAO_TAC_CO_HOP.includes(tat.chinh) ? tat.chinh : null;
  return { chinh, menu: tat.menu };
}

/**
 * "CÒN LẠI" CỦA LƯỢT LỚP THƯỜNG — chỉ gom việc máy chủ đã có: môn tới tuần mà chưa có điểm (cùng `oThuong().trong` với ô cần nhập của lưới),
 * môn vắng chờ xếp lại, môn đã dời bằng "-" chưa làm bài, việc tiếp của Case (cùng `viecCaseLuot` với FT / Công việc). Việc của người xem =
 * nút (mở dòng + focus ô / nút); việc người khác chỉ đọc. Lớp thường không có nhận xét bắt buộc (N8) nên không có việc nhận xét.
 */
function conLaiThuong(d: ChiTiet, homNay: string, theCase: Map<number, CaseCard>, chiDoc: boolean, thaoTac: (k: string) => { chinh: ThaoTac | null }, mo: {
  moDong: (k: string, chon?: string) => void; themPa: (k: string, caseId: number) => void;
  moCase: (caseId: number, viec?: 'ghi-ket-qua' | 'xac-nhan' | 'xac-nhan-pa', paId?: number) => void;
}): ViecConLai[] {
  const ct = d.programme.code;
  const r = d.dong;
  const ds: ViecConLai[] = [];
  for (const k of d.programme.skills) {
    const s = r.skillSchedule.find((x) => x.skill === k);
    if (!s) continue;
    const { cell, trong } = oThuong(r, k, homNay);
    const n = tenMonNgan(ct, k);
    const cua = (viec: string, chon: string | null) => ds.push({ khoa: `${k}:${viec}`, nhan: n, viec, mo: chon !== null && !chiDoc ? () => mo.moDong(k, chon) : undefined });
    if (cell.diem !== null || s.khongDuThi) continue;
    if (s.progress === 'absent') {
      const chinh = thaoTac(k).chinh;
      cua(CHU_THAO_TAC['xep-lai'], chinh === 'xep-lai' ? '[data-chinh]' : null);
    } else if (trong) cua(CHU_THAO_TAC['nhap-diem'], 'input');
    else if (s.progress === 'due' || s.progress === 'sat') cua(t('Chờ điểm'), null);
    else if (s.noShow && s.weekStart) cua(t('Làm bài {tuan}', { tuan: tuanLich(s.weekStart, homNay) }), null);
  }
  for (const c of r.cases) {
    const the = theCase.get(c.id);
    const v = viecCaseLuot({ id: c.id, tam: the?.trangThaiV4.k === 'tam' }, the, `Case ${tenMonNgan(ct, c.skill)}`, homNay, chiDoc,
      { themPa: the?.viecTiep?.chu === CHU_THEM_PA ? () => mo.themPa(c.skill, c.id) : null, moCase: mo.moCase });
    if (v) ds.push(v);
  }
  return ds;
}

/**
 * MỘT DÒNG MÔN (khung "A · lớp thường"): Môn · Lịch (gốc gạch → tuần mới khi "-" dời) · Điểm (ô của bảng điểm lớp: số câu đúng / tổng, "-" = vắng,
 * sửa có lý do) + % · Trạng thái + hạn · Nhận xét có / chưa · Case · nút chính + ⋯ (+ "Lịch sử" như ⋯ ô của lưới). Bấm khoảng trống mở vùng.
 */
function DongMon({ d, k, homNay, chiDoc, hep, luu, mo, thaoTac, caseChu, onMo, onThaoTac, onLichSu, vungCase, lichSu }: {
  d: ChiTiet; k: string; homNay: string; chiDoc: boolean; hep: boolean; luu: ReturnType<typeof useLuuThuong>;
  mo: boolean; thaoTac: { chinh: ThaoTac | null; menu: ThaoTac[] };
  /** Trạng thái Case đại diện của môn (thẻ hồ sơ HV — `trangThaiV4`), dòng phụ cột Case. */
  caseChu: string | null;
  onMo: () => void; onThaoTac: (x: ThaoTac) => void; onLichSu: () => void; vungCase: ReactNode; lichSu: ReactNode;
}) {
  const r = d.dong;
  const ct = d.programme.code;
  const { s, canEdit, dung, chuDung, quaHan, cell } = oThuong(r, k, homNay);
  if (!s) return null;
  const huy = r.status === 'cancelled';
  const ten = tenMon(ct, k);
  const goc = s.noShow && s.movedFromStart && s.weekStart && s.movedFromStart !== s.weekStart ? tuanLich(s.movedFromStart, homNay) : null;
  const coDiem = cell.diem !== null;
  /* Một dòng trạng thái: như dòng phụ của bảng điểm lớp một kỹ năng (`DongThuongMot`), thêm hạn khi môn còn nợ. */
  const tt: { chu: string; kind: 'done' | 'idle' | 'doing' | 'waiting' } = coDiem ? { chu: t('Đã có điểm'), kind: 'done' }
    : s.khongDuThi ? { chu: t('Vắng'), kind: 'idle' }
    : dung ? { chu: chuDung!, kind: s.progress === 'absent' ? 'waiting' : 'idle' }
    : s.progress === 'upcoming' || (s.noShow && s.weekStart) ? { chu: t('Làm bài {tuan}', { tuan: s.weekStart ? tuanLich(s.weekStart, homNay) : '—' }), kind: 'waiting' }
    : { chu: t('Chờ điểm'), kind: 'doing' };
  const han = !coDiem && !dung && !s.khongDuThi && s.deadline ? (quaHan ?? t('hạn {ngay}', { ngay: ngay(s.deadline, homNay) })) : null;
  const cs = r.cases.filter((c) => c.skill === k);
  const nguoiNhap = (s as { nguoiNhap?: string | null }).nguoiNhap ?? null;
  const bamDong = (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest('button, a, input, select, textarea, [role="dialog"], [role="menu"]')) onMo(); };
  const nhanXetDuoc = !huy && (s.nhanXetDuoc ?? canEdit);
  return (
    <div className={`border-t ${mo ? 'bg-white/[0.025]' : ''}`} style={{ borderColor: 'var(--line)' }}>
      <div id={`kn-${k}`} role="row" onClick={bamDong} className={`${LUOI_MON} cursor-pointer scroll-mt-4 px-3 py-2.5`}>
        <div role="cell" className="min-w-0">
          <button type="button" aria-expanded={mo} aria-controls={mo ? `vung-${k}` : undefined} onClick={onMo}
            className="inline-flex min-h-[44px] items-center gap-2 border-0 bg-transparent p-0 text-left text-[15px] font-bold text-slate-100 sm:min-h-0">
            <span aria-hidden className="w-3 text-xs text-slate-500">{mo ? '▾' : '▸'}</span>{ten}
          </button>
        </div>
        <div role="cell" className={`justify-self-end md:col-start-3 md:row-start-1 md:justify-self-start ${luu.o[k] === 'loi' ? `rounded-md ${VIEN_LOI}` : ''}`} data-kn={k}>
          <span className="inline-flex flex-col items-end gap-0.5 md:items-start">
            <span className="inline-flex items-center gap-1">
              <DauO lon={hep} tt={luu.o[k]} loi={luu.loi[k]} onLuuLai={() => luu.luuLai(k)} />
              {dung ? <span className="text-xs text-slate-500">—</span> : (
                <ODiemThuong lon={hep} tongLaySan cell={cell} tongCot={null} canEdit={canEdit && !chiDoc} tenMon={ten} tenHv={r.studentName}
                  onSave={(p, o) => luu.luu(k, p, o)} onDau={(bat) => luu.dau(k, bat)} onLoiNhap={(x) => luu.loiNhap(k, x)} />
              )}
            </span>
            {/* Ô cỡ lớn (375) đã có "Đạt · 80%" dưới hai số. */}
            {coDiem && cell.tiLe != null && !hep && (
              <span className={`text-xs tabular-nums ${cell.ketQua === 'fail' ? 'text-kq-duoi' : 'text-slate-400'}`}>{Math.round(cell.tiLe * 100)}%</span>
            )}
          </span>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:contents">
          <div role="cell" className="text-sm md:col-start-2 md:row-start-1">
            {s.weekStart ? (
              <span className="tabular-nums">
                {goc && <><s className="whitespace-nowrap text-slate-500" title={t('Lịch gốc')}>{goc}</s><span className="mx-1 text-slate-500">→</span></>}
                <span className="whitespace-nowrap font-semibold text-slate-200">{tuanLich(s.weekStart, homNay)}</span>
                {goc && <span className="block text-xs text-slate-500">{t('vắng')}</span>}
              </span>
            ) : <Tag pending>{t('Chưa xếp tuần')}</Tag>}
          </div>
          <div role="cell" className="min-w-0 space-y-1 md:col-start-4 md:row-start-1">
            <Status kind={tt.kind}>{tt.chu}</Status>
            {han && <div className={`text-xs ${quaHan ? 'text-late' : 'text-slate-400'}`}>{quaHan ? `⚠ ${han}` : han}</div>}
          </div>
        </div>
        <div className="col-span-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm md:contents">
          <div role="cell" className="min-w-0 md:col-start-5 md:row-start-1">
            {s.nhanXet ? <span className="text-slate-300">{[t('Có'), nguoiNhap].filter(Boolean).join(' · ')}</span>
              /* N8: lớp thường không bắt buộc nhận xét — chữ mờ, không màu nhắc như FT (V15). */
              : coDiem ? <span className="text-slate-500">{t('Chưa nhận xét')}</span> : <span className="text-slate-500 max-md:hidden">—</span>}
          </div>
          <div role="cell" className="min-w-0 md:col-start-6 md:row-start-1">
            {!cs.length ? <span className="text-slate-500 max-md:hidden">—</span> : (
              <span className="flex min-w-0 flex-col">
                <b className="text-slate-100">Case {tenMonNgan(ct, k)}{cs.length > 1 && <span className="font-normal text-slate-400"> +{cs.length - 1}</span>}</b>
                {caseChu && <span className="text-xs text-slate-400 max-md:hidden">{caseChu}</span>}
              </span>
            )}
          </div>
        </div>
        <div role="cell" className="col-span-2 flex flex-wrap items-center gap-1.5 md:col-span-1 md:col-start-7 md:row-start-1 md:justify-end">
          {thaoTac.chinh && !chiDoc && (
            <button type="button" data-chinh className="btn btn-sm btn-primary min-h-[44px] sm:min-h-0" onClick={() => onThaoTac(thaoTac.chinh!)}>{CHU_THAO_TAC[thaoTac.chinh]}</button>
          )}
          {!thaoTac.chinh && !chiDoc && !canEdit && !huy && (
            <span className="text-xs text-slate-500" title={t('Bạn không được phân công kỹ năng này')}>{t('Chỉ xem')}</span>
          )}
          <MenuDong nhan={t('Thao tác khác · {skillLabel}', { skillLabel: ten })} muc={[
            ...(chiDoc ? [] : thaoTac.menu).map((x) => ({ key: x, nhan: CHU_THAO_TAC[x], onChon: () => onThaoTac(x), nguyHiem: x === 'huy-diem' })),
            { key: 'lich-su', nhan: t('Lịch sử'), onChon: onLichSu, keTruoc: !chiDoc && thaoTac.menu.length > 0 },
          ]} />
        </div>
      </div>
      {mo && (
        <VungMoKn id={`vung-${k}`} lichSu={lichSu} caseNode={vungCase}
          nhanXet={(
            <section className="min-w-0 space-y-3">
              <h2 className="m-0 text-sm font-semibold text-slate-200">{t('Nhận xét')} {ten}</h2>
              {nhanXetDuoc ? (
                <ONhanXet nhan={t('Nhận xét')} phu={nguoiNhap ? t('Người nhập điểm: {enteredByName}', { enteredByName: nguoiNhap }) : null} kyNang={k} giaTri={s.nhanXet ?? null}
                  onLuu={(v) => luu.nhanXet(k, v).catch(() => false)} />
              ) : s.nhanXet ? (
                <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
                  <ChuDich chu={s.nhanXet} nguon={{ bang: 'assessment_scores', id: r.attemptId, cot: 'comment', kyNang: k }} />
                </p>
              ) : <p className="m-0 text-xs text-slate-500">{t('Chưa có')}</p>}
            </section>
          )} />
      )}
    </div>
  );
}
