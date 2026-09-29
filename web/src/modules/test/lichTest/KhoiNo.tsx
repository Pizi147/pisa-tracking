import { Fragment, useMemo } from 'react';
import { KhoiNhom } from '../../../ui/HangNhom.tsx';
import { Nhan } from '../../../ui/Nhan.tsx';
import { Han } from '../../../ui/Han.tsx';
import { skillLabel, skillShort } from '../../../lib/format.ts';
import { chuOChuaLuu, tuanLich } from '@shared/domain/index.ts';
import type { DongNo } from './kieu.ts';
import { LuoiNhung } from './LuoiNhung.tsx';

/**
 * Kỹ năng của dòng Nợ — viết tắt (tooltip tên đủ, G-7). Có lùi lịch thật (Q15) thì thêm "· lùi lịch", tuần cũ/mới và
 * tên em nằm ở tooltip (G-3: một dòng).
 */
function kyNangCua(d: DongNo, homNay: string): { chu: string; goiY: string; phu: string | null } {
  const tatCa = d.kyNang.map(skillLabel).join(', ');
  const chu = d.kyNang.map(skillShort).join(', ');
  const l = d.luiLich;
  if (!l) return { chu, goiY: tatCa, phu: null };
  /* PR-MT (YC-13.1 (3)): dời do vắng thì nói thẳng ra dòng phụ — "dời từ W3 SEP · vắng lần 1" — không giấu trong tooltip. */
  const phu = l.lanVang && l.tuTuanStart ? `dời từ ${tuanLich(l.tuTuanStart, homNay)} · vắng lần ${l.lanVang}` : null;
  const tu = l.tuTuanStart ? ` từ ${tuanLich(l.tuTuanStart, homNay)}` : '';
  const sang = l.sangTuanStart ? ` sang ${tuanLich(l.sangTuanStart, homNay)}` : '';
  const ai = l.hv.length === 1 ? ` của ${l.hv[0]}` : ` · ${l.hv.length} HV: ${l.hv.join(', ')}`;
  return { chu: phu ? chu : `${chu} · lùi lịch`, goiY: `${skillLabel(l.kyNang)}: lùi lịch${tu}${sang}${ai}\nCòn nợ: ${tatCa}`, phu };
}

/** Dòng Nợ là của ai: chờ mình · chờ GV khác (mình dạy lớp) · chờ chấm (Quản lý). Dòng đã chấm xong (Q14) → "Đã chấm ✓". */
function NhanDong({ d, xong, chuaLuu = 0 }: { d: DongNo; xong: boolean; chuaLuu?: number }) {
  if (chuaLuu > 0) return <Nhan tone="bad" title="Ô viền đỏ chưa lưu được — bấm Lưu lại ở ô đó.">{chuOChuaLuu(chuaLuu)}</Nhan>;
  if (xong) return <Nhan tone="done">Đã chấm <span className="font-normal" aria-hidden>✓</span></Nhan>;
  if (d.cuaToi) return <Nhan tone="soon">Chờ bạn chấm</Nhan>;
  return <Nhan tone="wait">{d.coDayLop ? 'Chờ GV khác' : 'Chờ chấm'}</Nhan>;
}

/**
 * KHỐI "NỢ TUẦN TRƯỚC" (PR-UX1, thay tab Cần chấm) — bài còn nợ của các tuần TRƯỚC tuần đang xem, mỗi dòng một lớp +
 * đợt + tuần. Bấm Chấm/Xem → lưới mở ngay DƯỚI DÒNG, chỉ các em còn nợ (một dòng một lúc, không rời trang, G-8).
 *
 * Q14: dòng đang mở mà máy chủ không còn trả (vừa chấm hết) vẫn giữ trên màn, ghi "Đã chấm ✓", tới khi người dùng thu —
 * dòng biến mất giữa lúc gõ là mất ô đang nhập. `dongMo` là bản sao dòng đó, do `LichTestTab` giữ.
 */
export function KhoiNo({ no, mo, onMo, chiQuaHan, onBoQuaHan, dongMo, onMoDong, hep, homNay, onDaLuu, knUrl, chuaLuu, baoChuaLuu }: {
  no: DongNo[]; mo: boolean; onMo: () => void;
  chiQuaHan: boolean; onBoQuaHan: () => void;
  dongMo: { d: DongNo; viTri: number; conTro: boolean } | null;
  onMoDong: (d: DongNo | null, viTri: number) => void;
  hep: boolean; homNay: string; onDaLuu: () => void; knUrl: string | null;
  /** Số ô lưu hỏng theo khoá dòng Nợ (đang mở). */
  chuaLuu: Readonly<Record<string, number>>;
  baoChuaLuu: (khoa: string, n: number) => void;
}) {
  const quaHan = no.filter((d) => d.quaHan);
  const baiQuaHan = quaHan.reduce((n, d) => n + d.conBai, 0);
  const soBai = no.reduce((n, d) => n + d.conBai, 0);
  const soLop = new Set(no.map((d) => d.classId)).size;

  /* Danh sách hiện: lọc quá hạn nếu đang bật; dòng đang mở mà máy chủ không còn trả thì chèn lại đúng chỗ cũ. */
  const ds = useMemo(() => {
    const loc = chiQuaHan ? quaHan : no;
    if (!dongMo || loc.some((d) => d.key === dongMo.d.key)) return loc.map((d) => ({ d, xong: false }));
    const out = loc.map((d) => ({ d, xong: false }));
    const conTrenMay = no.some((d) => d.key === dongMo.d.key);
    out.splice(Math.min(dongMo.viTri, out.length), 0, { d: dongMo.d, xong: !conTrenMay });
    return out;
  }, [no, quaHan, chiQuaHan, dongMo]);
  const chiAttempt = useMemo(
    () => (dongMo ? new Set(dongMo.d.attemptIds) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- theo danh sách lượt, không theo đối tượng
    [dongMo?.d.attemptIds.join(',')],
  );

  if (!no.length && !dongMo) return null;
  const soCot = hep ? 2 : 7;

  return (
    <div id="lich-test-no" className="card overflow-hidden p-0">
      <KhoiNhom id="lich-test-no-than" mo={mo} onMo={onMo} nhan="Nợ tuần trước" tieuDe="Nợ tuần trước" dem={soBai}
        phu={
          <>
            {soLop} lớp
            {baiQuaHan > 0 && <span className="ml-2 font-bold text-late">⚠ Quá hạn {baiQuaHan} bài</span>}
          </>
        }>
        {chiQuaHan && (
          <div className="px-3 pt-2">
            <button type="button" onClick={onBoQuaHan} title="Bỏ lọc, xem lại mọi bài nợ"
              className="inline-flex min-h-[28px] items-center gap-1 rounded-full border px-2 text-[11px] text-slate-200"
              style={{ borderColor: 'var(--line-strong)' }}>
              Chỉ quá hạn <span aria-hidden>✕</span>
            </button>
          </div>
        )}
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {hep ? (<><col /><col style={{ width: 72 }} /></>) : (
              <>
                <col style={{ width: 150 }} /><col style={{ width: 110 }} /><col /><col style={{ width: 80 }} />
                <col style={{ width: 190 }} /><col style={{ width: 130 }} /><col style={{ width: 84 }} />
              </>
            )}
          </colgroup>
          {!hep && (
            <thead>
              <tr>
                <th className="th">Lớp</th><th className="th">Đợt</th><th className="th">Kỹ năng</th>
                <th className="th text-right">Còn</th><th className="th">Hạn</th>
                <th className="th"><span className="sr-only">Trạng thái</span></th>
                <th className="th"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
          )}
          <tbody>
            {ds.map(({ d, xong }, i) => {
              const k = kyNangCua(d, homNay);
              const dangMo = dongMo?.d.key === d.key;
              const nut = (
                <button type="button" className={d.duocCham && !xong ? 'btn btn-sm btn-primary min-h-[44px] md:min-h-0' : 'btn btn-sm min-h-[44px] md:min-h-0'}
                  aria-expanded={dangMo}
                  title={dangMo ? 'Thu lưới lại' : d.duocCham ? 'Mở lưới ngay dưới dòng, chỉ các em còn nợ' : 'Xem lưới (môn người khác dạy)'}
                  onClick={() => onMoDong(dangMo ? null : d, i)}>
                  {dangMo ? 'Thu' : d.duocCham && !xong ? 'Chấm' : 'Xem'}
                </button>
              );
              return (
                <Fragment key={d.key}>
                  <tr className="row-hover" style={{ height: 44 }}>
                    {hep ? (
                      <>
                        <td className="td py-1.5">
                          <div className="truncate font-semibold text-slate-100">
                            {d.classCode} · {d.dotLabel} · <span title={k.goiY}>{k.chu}</span>
                          </div>
                          {k.phu && <div className="truncate text-[11px] text-slate-500">{k.phu}</div>}
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 tabular-nums">
                            <span className="whitespace-nowrap">còn {xong ? 0 : d.conBai} bài</span>
                            {!xong && <span className="whitespace-nowrap"><Han loai="nhap-diem" han={d.han} /></span>}
                            <NhanDong d={d} xong={xong} chuaLuu={chuaLuu[`no:${d.key}`]} />
                          </div>
                        </td>
                        <td className="td py-1.5 text-right">{nut}</td>
                      </>
                    ) : (
                      <>
                        <td className="td truncate font-semibold text-slate-100" title={d.classCode}>{d.classCode}</td>
                        <td className="td whitespace-nowrap text-slate-300"
                          title={d.weekStart ? `${d.dotLabel} · thi ${tuanLich(d.weekStart, homNay)}` : d.dotLabel}>
                          {d.dotLabel}
                        </td>
                        <td className="td truncate text-slate-300" title={k.goiY}>
                          {k.chu}
                          {k.phu && <span className="block truncate text-[11px] leading-4 text-slate-500">{k.phu}</span>}
                        </td>
                        <td className="td text-right tabular-nums text-slate-200">{xong ? 0 : d.conBai} <span className="text-[11px] text-slate-500">bài</span></td>
                        <td className="td whitespace-nowrap">{xong ? <span className="text-slate-600">—</span> : <Han loai="nhap-diem" han={d.han} />}</td>
                        <td className="td"><NhanDong d={d} xong={xong} chuaLuu={chuaLuu[`no:${d.key}`]} /></td>
                        <td className="td text-right">{nut}</td>
                      </>
                    )}
                  </tr>
                  {dangMo && (
                    <tr>
                      <td colSpan={soCot} className="p-0" style={{ background: 'var(--hang-con-bg)', paddingLeft: hep ? 0 : 16 }}>
                        <LuoiNhung classId={d.classId} periodId={d.mode === 'ielts_band' ? d.periodId : null}
                          kind={d.mode === 'ratio' ? d.kind : null} tuanDangXem={d.weekStart} chiAttempt={chiAttempt}
                          kn={knUrl ?? d.kyNang[0] ?? null} hrefDayDu={d.hrefDayDu} datConTro={dongMo!.conTro}
                          onDaLuu={onDaLuu} onSoOChuaLuu={(n) => baoChuaLuu(`no:${d.key}`, n)} />
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
