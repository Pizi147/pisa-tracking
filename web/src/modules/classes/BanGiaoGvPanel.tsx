import { MuiChev } from '../../ui/HangNhom.tsx';
import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { Han } from '../../ui/Han.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { addDaysIso, cauBanGiao, chuCuaPhan, mondayOfDate, ngay, quyCheBanGiaoGv, shortDate, trangThaiEmBg, tuanLich, type DuLieuChuDaGhi, type GopYGv, type PhieuBanGiaoGvDto } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { DsEmBanGiao, OGopY, TuDienEm, useHangLuu } from './banGiaoChung.tsx';
import { dongSauKhiLuu } from '../../lib/luuChac.ts';
import { DaiChenLo, useChenLo } from '../../ui/KhoiDaGhi.tsx';
import { useSession } from '../../lib/session.tsx';

/**
 * BÀN GIAO KHI ĐỔI GV (PR-B, mockup `thiet-ke/v9/phan-cong-gv.html` khu 6 + 9) — panel mẫu F của bàn giao chuyển lớp, nhiều cột:
 * trái danh sách em + trạng thái (Đủ · Thiếu … · Chưa có) + dòng phụ từng cột; phải phiếu em đang chọn: tự điền (chỉ đọc) + MỘT ô góp ý mỗi cột
 * (kỹ năng / GVCN, bắt buộc, lưu khi rời ô). Nhận xét chung cả lớp tuỳ chọn, gập ▸. Xác nhận khi đủ mọi em × mọi cột.
 * Người không viết được (GV mới sau xác nhận, QL trước hạn) đọc cùng khung, chỉ đọc. Lối vào: Công việc · hồ sơ lớp `?viec=ban-giao-gv&id=`.
 */
export function BanGiaoGvPanel({ id, onClose, onDone, quayLai, onTiep }: {
  id: number; onClose: () => void; onDone?: () => void; quayLai?: { nhan: string; onClick: () => void };
  /** GD-4d (lời 36): mở từ danh sách Công việc còn việc kế → "Xác nhận · việc tiếp ›". */ onTiep?: (() => void) | null;
}) {
  const { data, loading, error, reload } = useApi<PhieuBanGiaoGvDto>(`/ban-giao-gv/${id}`, [id]);
  if (error) {
    return (
      <KhungPanel hd="ban-giao" quayLai={quayLai} tieuDe={t('Bàn giao')} onDong={onClose} chan={{ huy: { nhan: t('Đóng'), onClick: onClose } }}>
        <ErrorState message={error.message} hint={error.hint} status={error.status} onRetry={reload} />
      </KhungPanel>
    );
  }
  if (loading || !data) return <KhungPanel hd="ban-giao" quayLai={quayLai} rong="toan" tieuDe={t('Bàn giao')} onDong={onClose}><Skeleton rows={6} /></KhungPanel>;
  return <Phieu dto={data} onClose={onClose} onDone={onDone} reload={reload} quayLai={quayLai} onTiep={onTiep} />;
}

function Phieu({ dto, onClose, onDone, reload, quayLai, onTiep }: {
  dto: PhieuBanGiaoGvDto; onClose: () => void; onDone?: () => void; reload: () => void; quayLai?: { nhan: string; onClick: () => void }; onTiep?: (() => void) | null;
}) {
  const toast = useToast();
  const h = dto.homNay;
  const viet = dto.nguoiXem.viet;
  const cot = dto.cot.map((c) => c.mon);
  const nhanCot = (m: string) => dto.cot.find((c) => c.mon === m)?.nhan ?? m;
  /* Góp ý vừa lưu (không tải lại cả phiếu sau mỗi ô — Turso đọc ít); khoá `${studentId}|${mon}`. */
  const [daLuu, setDaLuu] = useState<Record<string, string>>({});
  const gopY = (sid: number, m: string): GopYGv | null => {
    const moi = daLuu[`${sid}|${m}`];
    const cu = dto.em.find((e) => e.studentId === sid)?.gopY[m] ?? null;
    return moi !== undefined ? { noiDung: moi, nguoiGhi: cu?.nguoiGhi ?? '', ghiLuc: cu?.ghiLuc ?? '', dienThay: dto.nguoiXem.thay } : cu;
  };
  const [daChenEm, setDaChenEm] = useState<ReadonlySet<number>>(new Set());
  const tt = (sid: number) => {
    const x = trangThaiEmBg(cot, Object.fromEntries(cot.map((m) => [m, gopY(sid, m)])), nhanCot);
    const thieuCot = cot.filter((m) => !gopY(sid, m)).map(nhanCot).join(', ');
    return { khoa: x.khoa, nhan: x.khoa === 'du' ? t('Đủ') : x.khoa === 'chua' ? t('Chưa có') : t('Thiếu {ds}', { ds: thieuCot }) };
  };
  /* GD-20b ([XM-2]): em vừa "Chèn cho n em" mang chip "Đã chèn" (chỉ hiển thị, không vào số đủ / thiếu) tới khi GV mở em đó — không chặn Xác nhận. */
  const ttHien = (sid: number) => (daChenEm.has(sid) ? { khoa: 'thieu' as const, nhan: t('Đã chèn') } : tt(sid));
  const ds = dto.em.map((e) => ({ ...e, id: e.studentId }));
  const du = ds.filter((e) => tt(e.id).khoa === 'du').length;
  const thieu = ds.filter((e) => tt(e.id).khoa !== 'du');
  const [chon, setChon] = useState<number>(thieu[0]?.id ?? ds[0]?.id ?? 0);
  const [moChung, setMoChung] = useState(!!dto.nhanXetChung && !viet);
  const [busy, setBusy] = useState(false);
  const em = ds.find((e) => e.id === chon) ?? ds[0] ?? null;
  const i = em ? ds.indexOf(em) : -1;
  const tiep = i >= 0 && i < ds.length - 1 ? ds[i + 1] : null;
  const cho = dto.trangThai === 'mo';
  const docThoi = !viet;
  const nhanCotDs = dto.cot.map((c) => c.nhan).join(', ');
  const hl = mondayOfDate(dto.hieuLuc) === dto.hieuLuc ? tuanLich(dto.hieuLuc, h) : shortDate(dto.hieuLuc, h);
  const tieuDe = cho || viet
    ? t('Bàn giao {lop} · {mon} cho {ten}', { lop: dto.lop.code, mon: nhanCotDs, ten: [...new Set(dto.cot.map((c) => c.nguoiMoi.ten))].join(', ') })
    : t('Bàn giao {lop} · {mon} từ {ten}', { lop: dto.lop.code, mon: nhanCotDs, ten: dto.nguoiCu.ten });

  /* F01: các ô lưu khi rời ô (bấm Xác nhận / Đóng làm ô mất focus → lưu ô đó trước); ô lưu lỗi giữ chữ theo khoá `${studentId}|${mon}` · `chung`. */
  const hang = useHangLuu();
  const luuGop = (sid: number, m: string) => (chu: string) => api.put(`/ban-giao-gv/${dto.id}/gop-y`, { studentId: sid, mon: m, noiDung: chu })
    .then(() => { setDaLuu((x) => ({ ...x, [`${sid}|${m}`]: chu })); invalidate('/my-work'); });
  /* GD-20b (H2, mockup ⑫ B4): "Bạn đã ghi" 30 ngày gần nhất của lớp — MỘT lần khi mở phiếu đang mở. Khối cạnh ô góp ý (cột GVCN: phần Chung); "Chèn cho n em"
     chèn câu đầu (MT gần nhất, không có thì Case) vào mọi ô trống, tự lưu + Hoàn tác 10 giây; vẫn bấm Xác nhận bàn giao như nay. */
  const toiId = useSession().session?.user?.id ?? null;
  const coGoiY = viet && cho;
  const daGhi = useApi<DuLieuChuDaGhi>(coGoiY ? `/classes/${dto.lop.id}/chu-da-ghi?tu=${addDaysIso(h, -30)}&den=${h}` : null, [dto.lop.id, coGoiY]);
  const emDaGhi = (sid: number) => daGhi.data?.em.find((x) => x.id === sid);
  const khoaGoiY = (m: string) => (m === 'gvcn' ? 'chung' : m);
  const goGop = async (sid: number, m: string, cau: string) => {
    const r = await api.post<{ ok: boolean }>(`/ban-giao-gv/${dto.id}/gop-y/go-chen`, { studentId: sid, mon: m, noiDung: cau })
      .catch((e: any) => { toast.push('error', e.message); return { ok: false }; });
    if (r.ok) { setDaLuu((x) => { const { [`${sid}|${m}`]: _, ...con } = x; return con; }); invalidate('/my-work'); }
    return r.ok;
  };
  const choChen = coGoiY ? ds.flatMap((e) => cot.flatMap((m) => {
    if (gopY(e.id, m)) return [];
    const x = cauBanGiao(emDaGhi(e.id), khoaGoiY(m));
    return x ? [{ sid: e.id, m, cau: x.chu }] : [];
  })) : [];
  const soEmChen = new Set(choChen.map((c) => c.sid)).size;
  const lo = useChenLo<{ sid: number; m: string; cau: string }>((c) => luuGop(c.sid, c.m)(c.cau).catch((e: any) => toast.push('error', e.message)), (c) => goGop(c.sid, c.m, c.cau));
  const denEm = (sid: number) => { setChon(sid); requestAnimationFrame(() => document.getElementById(`bg-gv-em-${sid}`)?.focus()); };
  const denThieu = () => { const e = thieu[0]; if (e) denEm(e.id); };
  const baoChuaLuu = (n: number) => {
    const k = [...hang.chuaLuu.keys()][0] ?? '';
    if (k === 'chung') setMoChung(true); else if (k) denEm(Number(k.split('|')[0]));
    toast.push('error', t('Còn {n} ô chưa lưu được — chữ vẫn giữ. Rời ô để lưu lại; bấm Đóng lần nữa thì chữ ở ô lỗi sẽ mất.', { n }));
  };
  const dong = dongSauKhiLuu(hang, onClose, baoChuaLuu);
  const xacNhan = async (diTiep = false) => {
    if (!hang.cho.size && !hang.chuaLuu.size && thieu.length) { denThieu(); return; }
    setBusy(true);
    try {
      await hang.xong();
      /* Không xác nhận bằng bản cũ khi chữ mới chưa lưu được (F01). Còn thiếu thật → máy chủ trả "Còn n em thiếu góp ý." (toast). */
      if (hang.chuaLuu.size) { baoChuaLuu(hang.chuaLuu.size); return; }
      await api.post(`/ban-giao-gv/${dto.id}/xac-nhan`, {});
      invalidate('/my-work'); invalidate('/classes');
      toast.push('ok', t('Đã xác nhận bàn giao {lop}', { lop: dto.lop.code }));
      onDone?.();
      if (diTiep && onTiep) onTiep(); else reload();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel hd="ban-giao" quayLai={quayLai} rong="toan" loai={viet ? t('Việc · Bàn giao') : t('Bàn giao · đọc')} tieuDe={tieuDe} onDong={dong}
      quyChe={viet && cho ? quyCheBanGiaoGv() : null}
      ngCanh={(
        <span className="flex flex-wrap gap-x-3 gap-y-1 tabular-nums">
          <span><b className="text-slate-100">{ds.length}</b> {t('em')}</span>
          {cho && <span>{t('{a}/{b} em đủ góp ý', { a: du, b: ds.length })}</span>}
          {cho && <Han loai="viec-van-hanh" han={dto.han} />}
          {dto.xacNhan && <span>{t('xác nhận {ngay} bởi {ten}', { ngay: ngay(dto.xacNhan.luc, h), ten: dto.xacNhan.boi })}{dto.xacNhan.thay ? ` ${t('(điền thay)')}` : ''}</span>}
          <span>{t('hiệu lực {tuan}', { tuan: hl })}</span>
        </span>
      )}
      chan={{
        daSua: hang.chuaLuu.size > 0,
        huy: { nhan: t('Đóng'), onClick: dongSauKhiLuu(hang, onClose, baoChuaLuu, true) },
        trai: docThoi ? <span className="text-xs text-slate-500">{t('Chỉ đọc')}</span> : (
          <span className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
            <span>{t('Tự lưu khi rời ô')}</span>
            {cho && (thieu.length
              ? <button type="button" className="link border-0 bg-transparent p-0 text-xs font-semibold" onClick={denThieu}>{t('Còn {n} em thiếu góp ý ↑', { n: thieu.length })}</button>
              : <span className="font-semibold text-done">{t('✓ Đủ {a}/{b} em', { a: du, b: ds.length })}</span>)}
          </span>
        ),
        /* GD-4d (lời 36, ⓪ 40c): còn việc kế → "Đóng" · Xác nhận bàn giao · "Xác nhận · việc tiếp ›" (chính); lẻ → Xác nhận bàn giao (chính). */
        phu: viet && cho && onTiep ? (
          <button type="button" className={`btn min-h-[44px] sm:min-h-0 ${thieu.length ? "opacity-50" : ""}`} onClick={() => void xacNhan()} disabled={busy}
            aria-disabled={thieu.length > 0} title={thieu.length ? t('Còn {n} em thiếu góp ý', { n: thieu.length }) : undefined}>{t('Xác nhận bàn giao')}</button>
        ) : undefined,
        chinh: viet && cho ? (
          <button type="button" className={`btn btn-primary min-h-[44px] sm:min-h-0 ${thieu.length ? "opacity-50" : ""}`} onClick={() => void xacNhan(!!onTiep)} disabled={busy}
            aria-disabled={thieu.length > 0} title={thieu.length ? t('Còn {n} em thiếu góp ý', { n: thieu.length }) : undefined}>{busy ? t('Đang lưu…') : onTiep ? t('Xác nhận · việc tiếp ›') : t('Xác nhận bàn giao')}</button>
        ) : undefined,
      }}>
      <div className="space-y-4 pt-3">
        {dto.nguoiXem.thay && cho && <p className="m-0 text-xs text-slate-400">{t('Quản lý điền thay — góp ý ghi là điền thay.')}</p>}
        <section className="rounded-lg border" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2 text-left text-sm font-semibold text-slate-200" aria-expanded={moChung} onClick={() => setMoChung((x) => !x)}>
            <MuiChev mo={moChung} />
            <span>{t('Nhận xét chung cả lớp')} <span className="font-normal text-slate-500">{t('· tuỳ chọn')}{!dto.nhanXetChung && !moChung ? ` ${t('· chưa viết')}` : ''}</span></span>
          </button>
          {moChung && (
            <div className="px-3 pb-3">
              <OGopY nhan={t('Nhận xét chung cả lớp')} batBuoc={false} giaTri={dto.nhanXetChung ?? ''} docThoi={docThoi} rows={2} hang={hang} khoa="chung"
                onLuu={async (chu) => { await api.put(`/ban-giao-gv/${dto.id}/nhan-xet`, { nhanXetChung: chu }); }} />
            </div>
          )}
        </section>

        {!em ? <p className="m-0 text-sm text-slate-400">{t('Lớp không còn em nào đang học.')}</p> : (
          <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
            <DsEmBanGiao nhan={t('Học viên cần bàn giao')} ds={ds} chon={em.id}
              onChon={(id) => { setChon(id); setDaChenEm((s) => { if (!s.has(id)) return s; const m = new Set(s); m.delete(id); return m; }); }}
              dau={lo.vua ? <DaiChenLo n={new Set(lo.vua.map((c) => c.sid)).size} onHoanTac={() => { void lo.hoanTac(); setDaChenEm(new Set()); }} />
                : soEmChen >= 2 ? <button type="button" className="btn btn-sm min-h-[44px] justify-center sm:min-h-0"
                  onClick={() => { void lo.chenLo(choChen); setDaChenEm(new Set(choChen.map((c) => c.sid))); }}>{t('Chèn cho {n} em', { n: soEmChen })}</button> : undefined}
              trangThai={docThoi && !cho ? undefined : (e) => ttHien(e.id)}
              phu={(e) => (
                <span className="min-w-0 truncate">
                  {cot.map((m, k) => {
                    const co = !!gopY(e.id, m);
                    return <span key={m} className={co ? 'text-done' : 'text-soon'}>{k > 0 && <span className="text-slate-600"> · </span>}{nhanCot(m)} {co ? '✓' : '–'}</span>;
                  })}
                </span>
              )} />

            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 id={`bg-gv-em-${em.id}`} tabIndex={-1} className="m-0 text-base font-semibold text-slate-100 outline-none">{em.ten}</h3>
                {cho && (() => { const x = ttHien(em.id); return <Nhan tone={x.khoa === 'du' ? 'ok' : x.khoa === 'thieu' ? 'soon' : 'muted'}>{x.nhan}</Nhan>; })()}
                <span className="text-xs tabular-nums text-slate-500">{t('em {a}/{b}', { a: i + 1, b: ds.length })}</span>
                {tiep && <button type="button" className="btn btn-sm ml-auto max-md:hidden" onClick={() => setChon(tiep.id)}>{t('Em tiếp: {ten} ↓', { ten: tiep.ten })}</button>}
              </div>
              <TuDienEm tuDien={em.tuDien} daChup={dto.trangThai === 'xong'} />
              <div className={`grid gap-4 ${cot.length > 1 ? 'lg:grid-cols-2' : ''}`}>
                {dto.cot.map((c) => {
                  const g = gopY(em.id, c.mon);
                  return (
                    <OGopY key={`${em.id}|${c.mon}`} nhan={c.ten} ky={c.nhan} batBuoc docThoi={docThoi} giaTri={g?.noiDung ?? ''}
                      aiGhi={g?.nguoiGhi ? `${g.nguoiGhi}${g.ghiLuc ? `, ${ngay(g.ghiLuc, h)}` : ''}${g.dienThay ? ` ${t('(điền thay)')}` : ''}` : null}
                      placeholder={c.mon === 'gvcn' ? t('Tình hình chung, phụ huynh, ý thức…') : undefined}
                      hang={hang} khoa={`${em.id}|${c.mon}`} onLuu={luuGop(em.id, c.mon)}
                      goiY={coGoiY ? { ds: chuCuaPhan(emDaGhi(em.id), khoaGoiY(c.mon)), nhan: t('Bạn đã ghi tháng này'), toiId, homNay: h, mon: c.mon === 'gvcn' ? null : c.mon,
                        tai: daGhi.loading, loi: !!daGhi.error, thuLai: daGhi.reload, onGoRong: (cau) => goGop(em.id, c.mon, cau) } : undefined} />
                  );
                })}
              </div>
              {tiep && <button type="button" className="btn w-full min-h-[44px] md:hidden" onClick={() => setChon(tiep.id)}>{t('Em tiếp: {ten} ↓', { ten: tiep.ten })}</button>}
            </div>
          </div>
        )}
      </div>
    </KhungPanel>
  );
}
