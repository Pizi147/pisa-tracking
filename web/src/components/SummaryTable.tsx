import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api } from '../lib/api.ts';
import { Card, Empty, Skeleton } from './ui.tsx';

/**
 * BẢNG TỔNG HỢP — một hàng mỗi chi nhánh, hoặc mỗi lớp khi đã chọn chi nhánh.
 *
 * Ba điều làm bảng này đọc được thay vì thành một bức tường số:
 *
 *   1. Ô dạng `12/5` — tổng và phần chưa xử lý cạnh nhau. `12/0` và `12/11` là hai chi
 *      nhánh hoàn toàn khác nhau, mà một con số 12 thì không nói được điều đó.
 *   2. Mọi ô có số đều BẤM ĐƯỢC và mở đúng danh sách tạo nên nó.
 *   3. Hàng TỔNG cộng từ chính các hàng trên, nên đọc dọc luôn khớp.
 *
 * Bộ cột đặt sẵn thay cho bật/tắt từng cột: mười lăm ô tick là thứ dễ làm nhưng gần như
 * không ai dùng, và đúng chỗ hệ thống bắt đầu rối. Lựa chọn nhớ theo tài khoản.
 */

type Cell = { value: number; of?: number; href?: string };
type Row = { key: string; label: string; branchId: number | null; classId: number | null; cells: Record<string, Cell> };
type Col = { key: string; label: string; group: string; hint?: string };
type Summary = {
  rows: Row[];
  total: { label: string; cells: Record<string, Cell> };
  columns: Col[];
  presets: { key: string; label: string; columns: string[] }[];
  level: 'branch' | 'class';
  scopeEmpty: boolean;
};

const PREF_KEY = 'summary.preset';

export function SummaryTable({ branchId, onPickBranch }: {
  branchId: number | null;
  onPickBranch?: (id: number) => void;
}) {
  const navigate = useNavigate();
  const { data, loading } = useApi<Summary>(`/summary${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);
  const prefs = useApi<Record<string, string>>('/prefs');
  const [preset, setPreset] = useState<string | null>(null);

  /* Nạp lựa chọn đã lưu một lần; sau đó người dùng đổi thì ghi lại ngay. */
  useEffect(() => {
    if (preset === null && prefs.data) setPreset(prefs.data[PREF_KEY] ?? 'default');
  }, [prefs.data, preset]);

  const choose = (key: string) => {
    setPreset(key);
    api.put(`/prefs/${PREF_KEY}`, { value: key }).catch(() => { /* sở thích hiển thị: hỏng cũng không chặn việc gì */ });
  };

  if (loading || !data) return <Card title="Tổng hợp"><Skeleton rows={4} /></Card>;
  if (data.scopeEmpty || data.rows.length === 0) {
    return <Card title="Tổng hợp"><Empty title="Chưa có dữ liệu trong phạm vi bạn được xem" /></Card>;
  }

  const active = data.presets.find((x) => x.key === (preset ?? 'default')) ?? data.presets[0];
  const cols = active.columns.length
    ? data.columns.filter((c) => active.columns.includes(c.key))
    : data.columns;

  const cell = (c: Cell | undefined, col: Col, row?: Row) => {
    if (!c) return <span className="text-slate-600">—</span>;
    const dim = c.value === 0;
    const body = (
      <>
        <span className={`tabular-nums ${dim ? 'text-slate-600' : 'text-slate-100'}`}>{c.value}</span>
        {c.of !== undefined && (
          <span className={`tabular-nums ${c.of > 0 ? 'text-amber-200' : 'text-slate-600'}`}>/{c.of}</span>
        )}
      </>
    );
    if (dim || !c.href) return <span>{body}</span>;
    return (
      <button className="hover:underline" title={`Mở danh sách · ${col.label}${row ? ` · ${row.label}` : ''}`}
        onClick={(e) => { e.stopPropagation(); navigate(c.href!); }}>
        {body}
      </button>
    );
  };

  return (
    <Card
      title={data.level === 'branch' ? 'Tổng hợp theo chi nhánh' : 'Tổng hợp theo lớp'}
      bodyClass="p-0"
      action={
        <div className="flex flex-wrap gap-1">
          {data.presets.map((x) => (
            <button key={x.key} type="button"
              className={`btn btn-sm ${active.key === x.key ? 'btn-primary' : ''}`}
              onClick={() => choose(x.key)}>
              {x.label}
            </button>
          ))}
        </div>
      }>
      {/*
        Bảng rộng hơn màn hình thì cuộn TRONG CHÍNH NÓ. Để cả trang trượt ngang là lỗi nặng
        nhất ở màn hẹp: thanh điều hướng trôi theo và người dùng mất phương hướng.
        Cột đầu dính lại để cuộn ngang vẫn biết đang đọc hàng nào.
      */}
      <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th sticky-col">{data.level === 'branch' ? 'Chi nhánh' : 'Lớp'}</th>
              {cols.map((c) => (
                <th key={c.key} className="th text-right" title={c.hint}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.key} className={onPickBranch && r.branchId ? 'row-hover cursor-pointer' : ''}
                onClick={() => r.branchId && onPickBranch?.(r.branchId)}>
                <td className="td sticky-col whitespace-nowrap text-slate-100">{r.label}</td>
                {cols.map((c) => (
                  <td key={c.key} className="td text-right">{cell(r.cells[c.key], c, r)}</td>
                ))}
              </tr>
            ))}
            {/* Hàng tổng cộng từ chính các hàng trên — đọc dọc phải khớp. */}
            <tr style={{ borderTop: '2px solid var(--line-strong)' }}>
              <td className="td sticky-col whitespace-nowrap font-semibold text-slate-200">{data.total.label}</td>
              {cols.map((c) => (
                <td key={c.key} className="td text-right font-semibold">{cell(data.total.cells[c.key], c)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2.5 text-[11px] text-slate-500 m-0 border-t" style={{ borderColor: 'var(--line)' }}>
        Ô dạng <span className="tabular-nums text-slate-300">12</span>
        <span className="tabular-nums text-amber-200">/5</span> nghĩa là{' '}
        <strong>12 vấn đề, trong đó 5 chưa có phương án hỗ trợ</strong>. Mức SOS đếm{' '}
        <strong>học viên</strong> (một em SOS 2 vẫn là một em); các cột kỹ năng đếm{' '}
        <strong>vấn đề</strong> — nên hai cụm không cộng vào nhau được.
      </p>
    </Card>
  );
}
