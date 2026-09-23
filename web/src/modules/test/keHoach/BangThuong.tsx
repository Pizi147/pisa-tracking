import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, invalidate } from '../../../lib/api.ts';
import { Empty, Th } from '../../../ui/ui.tsx';
import { useToast } from '../../../ui/Toast.tsx';
import { skillLabel, skillShort } from '../../../lib/format.ts';
import { REGULAR_SKILLS, tuanLich } from '@shared/domain/index.ts';
import { HopDoiLichThuong } from './HopDoiLichThuong.tsx';

export type MonThuong = {
  tuan: string | null; deXuat: string | null; xong: boolean; daCham: number; tong: number;
  khac: Array<{ tuan: string; n: number; ten: string[] }>;
};
export type DongThuong = { kind: 'progress' | 'final'; nhan: string; mon: Record<string, MonThuong> };
export type LopThuong = {
  classId: number; code: string; chuongTrinh: string | null; tuanKhoa: string | null;
  thieuKhaiGiang: boolean; hvChuaCoLich: number; dong: DongThuong[];
};

/**
 * KẾ HOẠCH TEST — LỚP THƯỜNG THEO LỚP (R12, R14 phần lịch, mockup 10b §4).
 *
 * Mỗi lớp hai hàng (Giữa khoá, Cuối khoá) × bốn môn. Máy đề xuất tuần theo chương trình (Q13) khi lớp chưa có bài;
 * "Tạo lịch theo đề xuất" gọi lại chính hàm tạo bài đã có (`/regular/classes/:id/plan`).
 */
export function BangThuong({ lop, onReload }: { lop: LopThuong[]; onReload: () => void }) {
  const toast = useToast();
  const [taoBusy, setTaoBusy] = useState<number | null>(null);
  const [hop, setHop] = useState<
    { classId: number; code: string; kind: 'progress' | 'final'; nhan: string; skill: string } | null
  >(null);

  if (!lop.length) return <Empty title="Không có lớp thường nào trong phạm vi này" />;

  const taoLich = async (classId: number) => {
    setTaoBusy(classId);
    try {
      const r = await api.post<{ created: number }>(`/regular/classes/${classId}/plan`);
      toast.push('ok', `Đã tạo ${r.created} bài.`);
      invalidate('/ke-hoach-test'); invalidate('/classes');
      onReload();
    } catch (e: any) {
      toast.push('error', e.message ?? 'Không tạo được lịch — thử lại.');
    } finally {
      setTaoBusy(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 720 }}>
        <colgroup>
          <col style={{ width: 168 }} /><col style={{ width: 96 }} />
          {REGULAR_SKILLS.map((s) => <col key={s} style={{ width: 108 }} />)}
          <col style={{ width: 148 }} />
        </colgroup>
        <thead>
          <tr>
            <Th>Lớp</Th><Th>Bài</Th>
            {REGULAR_SKILLS.map((s) => <Th key={s} align="center" hint={skillLabel(s)}>{skillShort(s)}</Th>)}
            <Th>{null}</Th>
          </tr>
        </thead>
        <tbody>
          {lop.map((l) => l.dong.map((d, di) => (
            <tr key={`${l.classId}:${d.kind}`} className="row-hover">
              {di === 0 && (
                <td className="td py-2 align-top" rowSpan={l.dong.length}>
                  <div className="text-slate-100 truncate">{l.code}</div>
                  <div className="text-[11px] text-slate-500">
                    {l.chuongTrinh ?? '—'}{l.tuanKhoa ? ` · ${l.tuanKhoa}` : ''}
                  </div>
                  {l.thieuKhaiGiang && (
                    <Link to={`/lop/${l.classId}`} className="block text-[11px] text-slate-500 mt-1" title="Mở hồ sơ lớp để đặt tuần khai giảng">
                      Chưa có tuần khai giảng
                    </Link>
                  )}
                  {(l.hvChuaCoLich > 0 || (!l.dong.some((x) => Object.values(x.mon).some((m) => m.tong > 0)))) && !l.thieuKhaiGiang && (
                    <button type="button" className="btn btn-sm mt-1" disabled={taoBusy === l.classId}
                      onClick={() => void taoLich(l.classId)}>
                      {taoBusy === l.classId ? 'Đang tạo…' : 'Tạo lịch theo đề xuất'}
                    </button>
                  )}
                </td>
              )}
              <td className="td py-2">{d.nhan}</td>
              {REGULAR_SKILLS.map((s) => {
                const m = d.mon[s];
                return (
                  <td key={s} className="td py-2 text-center">
                    <OMonThuong m={m}
                      onClick={m && !m.xong && m.tong > 0
                        ? () => setHop({ classId: l.classId, code: l.code, kind: d.kind, nhan: d.nhan, skill: s })
                        : undefined} />
                  </td>
                );
              })}
              <td className="td py-2 text-right">
                {!Object.values(d.mon).every((m) => m.xong) && Object.values(d.mon).some((m) => m.tong > 0) && (
                  <button type="button" className="btn btn-sm"
                    onClick={() => setHop({ classId: l.classId, code: l.code, kind: d.kind, nhan: d.nhan, skill: REGULAR_SKILLS[0] })}>
                    Dời một môn
                  </button>
                )}
              </td>
            </tr>
          )))}
        </tbody>
      </table>

      {hop && (
        <HopDoiLichThuong classId={hop.classId} classCode={hop.code} kind={hop.kind} nhan={hop.nhan}
          skillMacDinh={hop.skill} onClose={() => setHop(null)} onSaved={onReload} />
      )}
    </div>
  );
}

function OMonThuong({ m, onClick }: { m: MonThuong | undefined; onClick?: () => void }) {
  if (!m || m.tong === 0) {
    return m?.deXuat ? (
      <span className="text-[11px] text-slate-500" title="Máy đề xuất theo mốc chương trình — chưa tạo bài">
        đề xuất {tuanLich(m.deXuat)}
      </span>
    ) : <span className="text-slate-700">—</span>;
  }
  const body = (
    <>
      {m.tuan ? tuanLich(m.tuan) : '—'}
      {m.xong && <span aria-hidden title="Đã chấm xong" className="ml-1 text-[11px]">✓</span>}
    </>
  );
  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      {m.xong || !onClick ? (
        <span className="text-slate-200" title={m.xong ? 'Đã chấm xong' : undefined}>{body}</span>
      ) : (
        <button type="button" className="text-[color:var(--accent-strong)] hover:underline" onClick={onClick}
          title="Bấm để đổi tuần cả lớp">{body}</button>
      )}
      {m.khac.length > 0 && (
        <span className="text-[10px]" style={{ color: '#e5c66a' }}
          title={m.khac.map((k) => `${k.tuan}: ${k.ten.join(', ')}`).join('\n')}>
          {m.khac.reduce((n, k) => n + k.n, 0)} HV → {tuanLich(m.khac[0].tuan)}
        </span>
      )}
    </div>
  );
}
