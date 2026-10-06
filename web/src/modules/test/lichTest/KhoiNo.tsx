import { Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { KhoiNhom } from '../../../ui/HangNhom.tsx';
import { Nhan, TONE_TRANG_THAI } from '../../../ui/Nhan.tsx';
import { Han } from '../../../ui/Han.tsx';
import { CHAM_CHEO, chuOChuaLuu, tenMon, tenMonNgan, tuanLich } from '@shared/domain/index.ts';
import type { DongNo } from './kieu.ts';
import { LuoiNhung } from './LuoiNhung.tsx';
import { COT_DAU_LICH_TEST } from './HangLop.tsx';

/**
 * Kỹ năng của dòng — viết tắt (tooltip tên đủ, G-7). Có lùi lịch thật (Q15) thì thêm "· lùi lịch", tuần cũ/mới và
 * tên em nằm ở tooltip (G-3: một dòng).
 */
function kyNangCua(d: DongNo, homNay: string): { chu: string; goiY: string; phu: string | null } {
  /* MH2: tên môn theo chương trình lớp (FOU "P", Pre FOU "Tổng hợp"). */
  const tatCa = d.kyNang.map((k) => tenMon(d.chuongTrinh, k)).join(', ');
  const chu = d.kyNang.map((k) => tenMonNgan(d.chuongTrinh, k)).join(', ');
  const l = d.luiLich;
  if (!l) return { chu, goiY: tatCa, phu: null };
  /* PR-MT (YC-13.1 (3)): dời do vắng thì nói thẳng ra dòng phụ — "dời từ W3 SEP · vắng lần 1" — không giấu trong tooltip. */
  const phu = l.lanVang && l.tuTuanStart ? `dời từ ${tuanLich(l.tuTuanStart, homNay)} · vắng lần ${l.lanVang}` : null;
  const tu = l.tuTuanStart ? ` từ ${tuanLich(l.tuTuanStart, homNay)}` : '';
  const sang = l.sangTuanStart ? ` sang ${tuanLich(l.sangTuanStart, homNay)}` : '';
  const ai = l.hv.length === 1 ? ` của ${l.hv[0]}` : ` · ${l.hv.length} HV: ${l.hv.join(', ')}`;
  return { chu: phu ? chu : `${chu} · lùi lịch`, goiY: `${tenMon(d.chuongTrinh, l.kyNang)}: lùi lịch${tu}${sang}${ai}\nCòn nợ: ${tatCa}`, phu };
}

/** Cột thao tác: nút "Nhập điểm" 86 px + đệm ô 2×12 — hẹp hơn thì nút lòi khỏi khung `card` và bị cắt (UX-G G4). */
const COT_THAO_TAC = 112;

/** Dòng là của ai: chờ mình · chờ GV khác (mình dạy lớp) · chờ chấm (Quản lý). Dòng đã chấm xong (Q14) → "Đã chấm ✓". */
function NhanDong({ d, xong, chuaLuu = 0 }: { d: DongNo; xong: boolean; chuaLuu?: number }) {
  if (chuaLuu > 0) return <Nhan tone="bad" title="Ô viền đỏ chưa lưu được — bấm Lưu lại ở ô đó.">{chuOChuaLuu(chuaLuu)}</Nhan>;
  if (xong) return <Nhan tone="done">Đã chấm <span className="font-normal" aria-hidden>✓</span></Nhan>;
  if (d.cuaToi) return <Nhan tone={TONE_TRANG_THAI['cho-cham']}>Chờ bạn chấm</Nhan>;
  return <Nhan tone={TONE_TRANG_THAI['cho-cham']}>{d.coDayLop ? 'Chờ GV khác' : 'Chờ chấm'}</Nhan>;
}

/** GV chấm (T17): tên GV còn nợ; Speaking Mock chưa ai nhập = "GV chấm chéo" chữ tím (T18, Q3). Xuống dòng, không cắt. */
function GvCham({ gv }: { gv: string[] }) {
  if (!gv.length) return <span className="text-slate-600">—</span>;
  return (
    <>
      {gv.map((t, i) => (
        <Fragment key={t}>
          {i > 0 && ', '}
          {t === CHAM_CHEO ? <span className="whitespace-nowrap font-semibold text-wait">{t}</span> : t}
        </Fragment>
      ))}
    </>
  );
}

/** PR-UXF-a (UX-F7, K4-06): ô Đợt ghi kèm TUẦN THI — "MT3 · W3 SEP"; một lớp có MT3 ở hai tuần thi ra hai dòng khác chữ. */
const dotTuan = (d: DongNo, homNay: string) => (d.weekStart ? `${d.dotLabel} · ${tuanLich(d.weekStart, homNay)}` : d.dotLabel);

/**
 * KHỐI 1 "TEST QUÁ HẠN CHẤM" (PR-LT3 T16–T17; trước là "Nợ tuần trước") — bài thi từ hai tuần trước mà đã quá hạn, theo HÔM NAY
 * (đổi tuần xem không đổi khối này). Mỗi dòng một lớp + đợt + tuần. Bấm "Nhập điểm" → lưới mở ngay DƯỚI DÒNG như một MỤC CON nhẹ
 * (thụt + một vạch dọc mảnh, nền nhạt — không khung thứ hai), chỉ các em còn nợ (một dòng một lúc, G-8).
 *
 * Q14: dòng đang mở mà máy chủ không còn trả (vừa chấm hết) vẫn giữ trên màn, ghi "Đã chấm ✓", tới khi người dùng thu —
 * dòng biến mất giữa lúc gõ là mất ô đang nhập. `dongMo` là bản sao dòng đó, do `LichTestTab` giữ.
 */
export function KhoiNo({ no, mo, onMo, dongMo, onMoDong, hep, homNay, onDaLuu, knUrl, chuaLuu, baoChuaLuu }: {
  no: DongNo[]; mo: boolean; onMo: () => void;
  dongMo: { d: DongNo; viTri: number; conTro: boolean } | null;
  onMoDong: (d: DongNo | null, viTri: number) => void;
  hep: boolean; homNay: string; onDaLuu: () => void; knUrl: string | null;
  /** Số ô lưu hỏng theo khoá dòng (đang mở). */
  chuaLuu: Readonly<Record<string, number>>;
  baoChuaLuu: (khoa: string, n: number) => void;
}) {
  const soBai = no.reduce((n, d) => n + d.conBai, 0);
  const soLop = new Set(no.map((d) => d.classId)).size;

  /* Dòng đang mở mà máy chủ không còn trả thì chèn lại đúng chỗ cũ. */
  const ds = useMemo(() => {
    const out = no.map((d) => ({ d, xong: false }));
    if (!dongMo || no.some((d) => d.key === dongMo.d.key)) return out;
    out.splice(Math.min(dongMo.viTri, out.length), 0, { d: dongMo.d, xong: true });
    return out;
  }, [no, dongMo]);
  const chiAttempt = useMemo(
    () => (dongMo ? new Set(dongMo.d.attemptIds) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- theo danh sách lượt, không theo đối tượng
    [dongMo?.d.attemptIds.join(',')],
  );

  const tieuDe = 'Test quá hạn chấm';
  if (!ds.length) return <div id="lich-test-no" className="card overflow-hidden p-0"><KhoiNhom id="lich-test-no-than" rong phang mo={false} onMo={onMo} nhan={tieuDe} tieuDe={tieuDe} dem={0} /></div>;
  const soCot = hep ? 2 : 9;

  return (
    <div id="lich-test-no" className="card overflow-hidden p-0">
      <KhoiNhom id="lich-test-no-than" phang mo={mo} onMo={onMo} nhan={tieuDe} tieuDe={tieuDe} dem={soBai} demMau={soBai > 0 ? 'late' : undefined}
        phu={`${soLop} lớp`}>
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {hep ? (<><col /><col style={{ width: COT_THAO_TAC - 4 }} /></>) : (
              <>
                {/* E5: ba cột đầu cùng độ rộng với bảng lớp (`COT_DAU_LICH_TEST`) — các bảng thẳng cột. GV chấm giãn (cột không cố định). */}
                {COT_DAU_LICH_TEST.map((w, i) => <col key={i} style={{ width: w }} />)}
                <col style={{ width: 72 }} /><col style={{ width: 200 }} /><col /><col style={{ width: 128 }} /><col style={{ width: 44 }} />
                <col style={{ width: COT_THAO_TAC }} />
              </>
            )}
          </colgroup>
          {!hep && (
            <thead>
              <tr>
                <th className="th">Lớp</th><th className="th">Đợt</th><th className="th">Kỹ năng</th>
                <th className="th text-right">Còn</th><th className="th">Hạn</th><th className="th">GV chấm</th>
                <th className="th"><span className="sr-only">Trạng thái</span></th>
                <th className="th"><span className="sr-only">Mở lưới đầy đủ</span></th>
                <th className="th"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
          )}
          <tbody>
            {ds.map(({ d, xong }, i) => {
              const k = kyNangCua(d, homNay);
              const dangMo = dongMo?.d.key === d.key;
              const nut = (
                <button type="button" className={d.duocCham && !xong && !dangMo ? 'btn btn-sm btn-primary min-h-[44px] md:min-h-0' : 'btn btn-sm min-h-[44px] md:min-h-0'}
                  aria-expanded={dangMo}
                  title={dangMo ? 'Thu lưới lại' : d.duocCham ? 'Mở lưới ngay dưới dòng, chỉ các em còn nợ' : 'Xem lưới (môn người khác dạy)'}
                  onClick={() => onMoDong(dangMo ? null : d, i)}>
                  {dangMo ? 'Thu' : d.duocCham && !xong ? 'Nhập điểm' : 'Xem'}
                </button>
              );
              return (
                <Fragment key={d.key}>
                  <tr className="row-hover" style={{ height: 44 }}>
                    {hep ? (
                      <>
                        <td className="td py-2">
                          <div className="font-semibold text-slate-100">
                            {d.classCode} · {dotTuan(d, homNay)} · <span title={k.goiY}>{k.chu}</span>
                          </div>
                          {k.phu && <div className="truncate text-[11px] text-slate-500">{k.phu}</div>}
                          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-slate-400 tabular-nums">
                            <span className="whitespace-nowrap">còn {xong ? 0 : d.conBai} bài</span>
                            {!xong && <span className="whitespace-nowrap"><Han loai="nhap-diem" han={d.han} /></span>}
                            <NhanDong d={d} xong={xong} chuaLuu={chuaLuu[`no:${d.key}`]} />
                          </div>
                          {d.gvNo.length > 0 && <div className="mt-0.5 text-xs text-slate-400">GV chấm: <GvCham gv={d.gvNo} /></div>}
                        </td>
                        <td className="td py-2 pl-0 text-right">{nut}</td>
                      </>
                    ) : (
                      <>
                        <td className="td truncate font-semibold text-slate-100" title={d.classCode}>{d.classCode}</td>
                        <td className="td truncate text-slate-300" title={dotTuan(d, homNay)}>{dotTuan(d, homNay)}</td>
                        <td className="td truncate text-slate-300" title={k.goiY}>
                          {k.chu}
                          {k.phu && <span className="block truncate text-[11px] leading-4 text-slate-500">{k.phu}</span>}
                        </td>
                        <td className="td text-right tabular-nums text-slate-200">{xong ? 0 : d.conBai} <span className="text-[11px] text-slate-500">bài</span></td>
                        <td className="td whitespace-nowrap">{xong ? <span className="text-slate-600">—</span> : <Han loai="nhap-diem" han={d.han} />}</td>
                        <td className="td py-1.5 text-xs leading-[1.35] text-slate-300"><GvCham gv={d.gvNo} /></td>
                        <td className="td"><NhanDong d={d} xong={xong} chuaLuu={chuaLuu[`no:${d.key}`]} /></td>
                        <td className="px-1 text-center">
                          <Link to={d.hrefDayDu} title="Mở lưới đầy đủ" aria-label={`Mở lưới đầy đủ lớp ${d.classCode}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 no-underline hover:text-slate-100">↗</Link>
                        </td>
                        <td className="td text-right">{nut}</td>
                      </>
                    )}
                  </tr>
                  {dangMo && (
                    /* Mục con (T17): nền nhạt, thụt + MỘT vạch dọc 1 px — không khung bo, không viền thứ hai. */
                    <tr>
                      <td colSpan={soCot} className="p-0" style={{ background: 'var(--hang-con-bg)' }}>
                        <div className="muc-con ml-2 border-l py-1.5 pl-2.5 sm:ml-5 sm:pl-3.5" style={{ borderColor: 'var(--line-strong)' }}>
                          <LuoiNhung classId={d.classId} periodId={d.mode === 'ielts_band' ? d.periodId : null}
                            kind={d.mode === 'ratio' ? d.kind : null} tuanDangXem={d.weekStart} chiAttempt={chiAttempt}
                            kn={knUrl ?? d.kyNang[0] ?? null} hrefDayDu={d.hrefDayDu} datConTro={dongMo!.conTro} coLinkRieng
                            onDaLuu={onDaLuu} onSoOChuaLuu={(n) => baoChuaLuu(`no:${d.key}`, n)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </KhoiNhom>
    </div>
  );
}
