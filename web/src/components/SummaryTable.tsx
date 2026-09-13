import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../lib/useApi.ts';
import { api } from '../lib/api.ts';
import { Card, Empty, Skeleton, Th } from './ui.tsx';

/**
 * BẢNG TỔNG HỢP — một hàng mỗi chi nhánh, hoặc mỗi lớp khi đã chọn chi nhánh.
 *
 * Bảng này trả lời HỌC VIÊN ĐANG YẾU Ở ĐÂU. Bảng "Việc cần lưu ý" ở tab Toàn cảnh công việc
 * trả lời AI PHẢI LÀM GÌ. Owner giữ cả hai và phân vai rõ, nên hai bảng không dùng chung bộ cột.
 *
 * Ba điều làm bảng này đọc được thay vì thành một bức tường số:
 *
 *   1. Ô dạng `12/5` — tổng và phần chưa xử lý cạnh nhau. `12/0` và `12/11` là hai chi
 *      nhánh hoàn toàn khác nhau, mà một con số 12 thì không nói được điều đó.
 *   2. Mọi ô có số đều BẤM ĐƯỢC và mở đúng danh sách tạo nên nó.
 *   3. Hàng TỔNG cộng từ chính các hàng trên, nên đọc dọc luôn khớp.
 *
 * Vòng 4 thêm ba thứ owner yêu cầu ở mục 10.2 và 10.6:
 *
 *   - Ở tầng LỚP, hàng "Cả chi nhánh" lên ĐẦU — đó là con số người ta hỏi trước tiên.
 *   - Lớp gom thành hai nhóm NORMAL và FT, mặc định thu gọn. Hai loại lớp vận hành khác
 *     nhau tới mức trộn chung một danh sách là bắt người đọc tự phân loại lại bằng mắt.
 *   - Bấm tiêu đề cột để sắp xếp; hàng tổng KHÔNG bị cuốn theo.
 */

type Cell = { value: number; of?: number; href?: string };
type Row = {
  key: string; label: string; branchId: number | null; classId: number | null;
  group?: 'normal' | 'ft'; cells: Record<string, Cell>;
};
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
const GROUP_LABEL: Record<string, string> = { normal: 'Normal', ft: 'Fulltime IELTS' };

export function SummaryTable({ branchId, onPickBranch }: {
  branchId: number | null;
  onPickBranch?: (id: number) => void;
}) {
  const navigate = useNavigate();
  const { data, loading } = useApi<Summary>(`/summary${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);
  const prefs = useApi<Record<string, string>>('/prefs');
  const [preset, setPreset] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);

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

  const sortOf = (key: string) => ({
    active: sort?.col === key,
    dir: (sort?.col === key ? sort.dir : 'desc') as 'asc' | 'desc',
    onSort: () => setSort((s) => (s?.col === key
      ? { col: key, dir: s.dir === 'desc' ? 'asc' : 'desc' }
      : { col: key, dir: 'desc' })),
  });
  const sorted = (rows: Row[]) => {
    if (!sort) return rows;
    const k = sort.col;
    return [...rows].sort((a, b) => {
      const av = a.cells[k]?.value ?? 0;
      const bv = b.cells[k]?.value ?? 0;
      return sort.dir === 'desc' ? bv - av : av - bv;
    });
  };

  /* Một hàng tổng dùng lại ở hai chỗ: đầu bảng khi xem lớp, cuối bảng khi xem chi nhánh. */
  const totalRow = (
    <tr style={{ background: 'rgba(255,255,255,.05)' }}>
      <td className="td sticky-col whitespace-nowrap font-semibold text-slate-200">{data.total.label}</td>
      {cols.map((c) => (
        <td key={c.key} className="td text-right font-semibold">{cell(data.total.cells[c.key], c)}</td>
      ))}
    </tr>
  );

  const classRow = (r: Row, indent = false) => (
    <tr key={r.key} className="row-hover">
      <td className={`td sticky-col whitespace-nowrap ${indent ? 'pl-8' : ''}`}>
        {/* Bấm tên lớp mở THẲNG trang lớp đó (mục 10.2), không phải mở thêm một bảng nữa. */}
        <button type="button" className="link appearance-none bg-transparent border-0 p-0 cursor-pointer"
          onClick={() => navigate(`/hoc-vien/lop/${r.classId}`)}>{r.label}</button>
      </td>
      {cols.map((c) => (
        <td key={c.key} className="td text-right">{cell(r.cells[c.key], c, r)}</td>
      ))}
    </tr>
  );

  const groups = data.level === 'class'
    ? (['normal', 'ft'] as const)
      .map((g) => ({ key: g, rows: data.rows.filter((r) => (r.group ?? 'normal') === g) }))
      .filter((g) => g.rows.length > 0)
    : [];

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
              <Th className="sticky-col">{data.level === 'branch' ? 'Chi nhánh' : 'Lớp'}</Th>
              {cols.map((c) => (
                <Th key={c.key} align="right" hint={c.hint} sort={sortOf(c.key)}>{c.label}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Tầng LỚP: tổng cả chi nhánh lên đầu, rồi hai nhóm loại lớp. */}
            {data.level === 'class' && totalRow}

            {data.level === 'branch' && sorted(data.rows).map((r) => (
              <tr key={r.key} className={onPickBranch && r.branchId ? 'row-hover cursor-pointer' : ''}
                onClick={() => r.branchId && onPickBranch?.(r.branchId)}>
                <td className="td sticky-col whitespace-nowrap text-slate-100">{r.label}</td>
                {cols.map((c) => (
                  <td key={c.key} className="td text-right">{cell(r.cells[c.key], c, r)}</td>
                ))}
              </tr>
            ))}

            {groups.map((g) => {
              const open = openGroups.has(g.key);
              /* Tổng của nhóm cộng từ chính các lớp trong nhóm — không đếm lại bằng đường khác. */
              const sum = (key: string) => ({
                value: g.rows.reduce((a, r) => a + (r.cells[key]?.value ?? 0), 0),
                of: g.rows.some((r) => r.cells[key]?.of !== undefined)
                  ? g.rows.reduce((a, r) => a + (r.cells[key]?.of ?? 0), 0) : undefined,
              });
              return (
                <Fragment key={g.key}>
                  <tr className="row-hover cursor-pointer"
                    onClick={() => setOpenGroups((s) => {
                      const next = new Set(s);
                      if (next.has(g.key)) next.delete(g.key); else next.add(g.key);
                      return next;
                    })}>
                    <td className="td sticky-col whitespace-nowrap">
                      <span className="text-slate-500 mr-1.5" aria-hidden>{open ? '▾' : '▸'}</span>
                      <span className="text-slate-100">{GROUP_LABEL[g.key]}</span>
                      <span className="text-[11px] text-slate-500 ml-1.5">{g.rows.length} lớp</span>
                    </td>
                    {cols.map((c) => (
                      <td key={c.key} className="td text-right">{cell(sum(c.key), c)}</td>
                    ))}
                  </tr>
                  {open && sorted(g.rows).map((r) => classRow(r, true))}
                </Fragment>
              );
            })}

            {/* Tầng CHI NHÁNH: hàng tổng nằm cuối, đúng thói quen đọc một bảng cộng dồn. */}
            {data.level === 'branch' && (
              <tr style={{ borderTop: '2px solid var(--line-strong)' }}>
                <td className="td sticky-col whitespace-nowrap font-semibold text-slate-200">{data.total.label}</td>
                {cols.map((c) => (
                  <td key={c.key} className="td text-right font-semibold">{cell(data.total.cells[c.key], c)}</td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2.5 text-[11px] text-slate-500 m-0 border-t" style={{ borderColor: 'var(--line)' }}>
        Ô dạng <span className="tabular-nums text-slate-300">12</span>
        <span className="tabular-nums text-amber-200">/5</span> nghĩa là{' '}
        <strong>12 case, trong đó 5 chưa có phương án hỗ trợ</strong>. Mức SOS đếm{' '}
        <strong>học viên</strong> (một em SOS 2 vẫn là một em); các cột kỹ năng đếm{' '}
        <strong>case</strong> — nên hai cụm không cộng vào nhau được. Case Pronunciation của lớp
        Foundation gộp vào cột <strong>S</strong>, case Writing của lớp Normal gộp vào <strong>W2</strong>.
      </p>
    </Card>
  );
}
