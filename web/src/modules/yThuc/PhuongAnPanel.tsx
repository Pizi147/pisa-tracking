import { useEffect, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { ConfirmDialog } from '../../ui/Drawer.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { Nhan } from '../../ui/Nhan.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { BangChung } from '../../ui/BangChung.tsx';
import { ChonNguoi } from '../../ui/PeoplePicker.tsx';
import { OKhac } from '../../ui/OKhac.tsx';
import {
  MEASURE_KINDS_V3, MEASURE_KIND_LABEL_V3, chiaThemViPham, kiemGhiRoKhac, ngay, thanPatchPhuongAn, type MeasureKindV3, type NguoiChon,
  type PatchPhuongAnGoc, type ViolationState,
} from '@shared/domain/index.ts';
import { ChiTietViPham } from './ChiTietViPham.tsx';

type KindRow = { kind: MeasureKindV3; label: string; available: boolean; reason: string | null };
type ViolationRow = { id: number; occurredOn: string; description: string; categoryLabel: string; state: ViolationState; stateLabel: string };
type MeasureDetail = {
  id: number; studentId: number; studentName: string; kind: string; customName: string | null;
  ownerUserId: number | null; ownerName: string | null; note: string | null;
  createdAt: string; canManage: boolean; attachmentCount: number;
  violations: { id: number }[];
};

/**
 * PANEL `PHƯƠNG ÁN XỬ LÝ` ĐANG CHUẨN BỊ (YT-2, YT-3; PR-UX3 mockup 15 §7) — sửa loại/người thực hiện/nội dung/danh sách vi phạm TẠI
 * CHỖ, một lần Lưu. Sửa một vi phạm bên trong: đóng panel này → mở form Sửa → xong quay lại đúng đây (`usePanelYThuc`).
 * Danh sách vi phạm có thay đổi CHƯA LƯU thì khoá Sửa/Xoá của từng vi phạm.
 *
 * Chân: trái `Xoá PA` (viền đỏ, hỏi lại bằng `ConfirmDialog`) · phụ `Lưu` · chính `Đã thực hiện` (→ `ConfirmMeasurePanel`).
 * "Thêm vi phạm chưa xử lý" và "Đã xử lý ở PA khác" THU GỌN — mặc định chỉ hiện các vi phạm đang thuộc PA này.
 */
export function PhuongAnPanel({ measureId, onClose, onDone, onXacNhan, onSuaViPham, onMoPhuongAnKhac }: {
  measureId: number;
  onClose: () => void;
  onDone?: () => void;
  onXacNhan: (measureId: number) => void;
  onSuaViPham: (v: { id: number; studentId: number; category: string; skill: string | null; occurredOn: string; description: string }, measureId: number) => void;
  /** Vi phạm này còn nằm ở MỘT phương án KHÁC — mở đúng phương án đó (đóng PA đang xem trước). */
  onMoPhuongAnKhac: (m: { id: number; status: string }) => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const { data: d, reload } = useApi<MeasureDetail>(`/measures/${measureId}`, [measureId]);
  const kinds = useApi<{ rows: KindRow[] }>(d ? `/students/${d.studentId}/measure-kinds?excludeMeasureId=${measureId}` : null, [d?.studentId, measureId]);
  const allV = useApi<{ rows: ViolationRow[] }>(d ? `/students/${d.studentId}/violations` : null, [d?.studentId]);

  const [kind, setKind] = useState<string>('talk_short');
  const [customName, setCustomName] = useState('');
  const [note, setNote] = useState('');
  /* Giá trị ban đầu = người phụ trách hiện có (không còn "Không đổi · hiện: …"); đổi = khác giá trị ban đầu. */
  const [owner, setOwner] = useState<NguoiChon | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [initedFor, setInitedFor] = useState<number | null>(null);
  const [moThem, setMoThem] = useState(false);
  const [xemDaXuLy, setXemDaXuLy] = useState(false);
  const [moChiTiet, setMoChiTiet] = useState<number | null>(null);
  const [hoiXoa, setHoiXoa] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (d && initedFor !== measureId) {
      setKind(d.kind); setCustomName(d.customName ?? ''); setNote(d.note ?? '');
      setOwner(d.ownerUserId ? { kieu: 'tai_khoan', id: d.ownerUserId, ten: d.ownerName ?? `#${d.ownerUserId}` } : null);
      setPicked(new Set(d.violations.map((v) => v.id)));
      setMoThem(false); setXemDaXuLy(false); setMoChiTiet(null); setHoiXoa(false);
      setInitedFor(measureId);
    }
  }, [d, measureId, initedFor]);

  /* Chờ nạp xong giá trị đầu (đặc biệt là người phụ trách) rồi mới vẽ form: `ChonNguoi` quyết chế độ hiện tên/ô gõ ngay lúc gắn vào. */
  if (!d || initedFor !== measureId) {
    return <KhungPanel tieuDe="Phương án xử lý" onDong={onClose}><p className="mt-3 text-sm text-slate-400">Đang tải…</p></KhungPanel>;
  }

  const byId = new Map((allV.data?.rows ?? []).map((v) => [v.id, v]));
  const list = [...picked].map((id) => byId.get(id)).filter((v): v is ViolationRow => !!v)
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.id - a.id);
  /*
   * Bỏ tích một vi phạm ĐANG thuộc PA này (nằm trong `d.violations` gốc) thì coi là "chưa xử lý" cho mục "Thêm vi phạm" —
   * lưu xong nó sẽ thật sự rời PA và về lại tập chưa xử lý; xếp nó vào "đã xử lý ở PA khác" theo `state` máy chủ
   * (vẫn 'preparing' vì CHƯA lưu) là sai chỗ.
   */
  const gocIds = new Set(d.violations.map((v) => v.id));
  const rowsChoThem = (allV.data?.rows ?? []).map((v) => (gocIds.has(v.id) ? { ...v, state: 'unhandled' as const } : v));
  const them = chiaThemViPham(rowsChoThem, picked);
  const laDuyNhat = picked.size === 1;

  const goc: PatchPhuongAnGoc = {
    kind: d.kind, customName: d.customName ?? null, note: d.note ?? null, ownerUserId: d.ownerUserId ?? null,
    violationIds: d.violations.map((v) => v.id),
  };
  /* Chỉ gửi người phụ trách khi ĐỔI so với người hiện có. */
  const ownerMoi = owner === null ? undefined : owner.kieu === 'toi' ? session?.user?.id : owner.kieu === 'tai_khoan' ? owner.id : undefined;
  const ownerUserId = ownerMoi !== undefined && ownerMoi !== d.ownerUserId ? ownerMoi : undefined;
  const patch = thanPatchPhuongAn(goc, {
    kind, customName: kind === 'other' ? (customName.trim() || null) : null, note: note.trim() || null,
    ownerUserId, violationIds: [...picked],
  });
  const dirty = patch !== null;
  /* Loại "Khác" (T13): Tên phương án ≥ 3 ký tự — chặn lưu thay đổi khi chưa đủ (PA cũ không đổi gì vẫn bấm Đã thực hiện được). */
  const loiGhiRo = dirty && kind === 'other' ? kiemGhiRoKhac(customName) : null;
  const choSua = !dirty;
  const choXoa = !dirty && !laDuyNhat;

  const isLocked = (k: string) => (kinds.data?.rows ?? []).find((r) => r.kind === k)?.available === false;
  const lockReason = (k: string) => (kinds.data?.rows ?? []).find((r) => r.kind === k)?.reason ?? null;

  const toggle = (id: number) => {
    setPicked((s) => {
      if (s.size === 1 && s.has(id)) return s; // B02: PA phải còn ít nhất một vi phạm
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const ghiXongToast = () => {
    invalidate('/measures'); invalidate('/violations'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
    toast.push('ok', 'Đã lưu phương án');
  };

  const luu = async () => {
    if (!patch || loiGhiRo) return;
    setBusy(true);
    try { await api.patch(`/measures/${measureId}`, patch); ghiXongToast(); }
    catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  const xacNhan = async () => {
    if (loiGhiRo) return;
    setBusy(true);
    try {
      if (patch) { await api.patch(`/measures/${measureId}`, patch); ghiXongToast(); }
      onXacNhan(measureId);
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  const xoaPhuongAn = async () => {
    setBusy(true);
    try {
      await api.del(`/measures/${measureId}`);
      invalidate('/measures'); invalidate('/violations'); invalidate('/classes'); invalidate('/students'); invalidate('/y-thuc');
      toast.push('ok', 'Đã xoá phương án');
      onClose(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); }
    finally { setBusy(false); }
  };

  /* Mô tả một dòng, cắt "…" (tooltip là bản đủ); dòng 2 mờ: `10/09 · Thái độ / hành vi`. */
  const cat = (v: ViolationRow) => `${ngay(v.occurredOn, homNay)} · ${v.categoryLabel}`;

  return (
    <KhungPanel tieuDe="Phương án xử lý" hocVien={d.studentName} onDong={onClose}
      ngCanh={(
        <span className="flex items-center gap-1.5">
          <Nhan tone="doing">Đang chuẩn bị</Nhan>
          <span className="truncate text-slate-400">tạo {ngay(d.createdAt, homNay)}{d.ownerName ? ` · ${d.ownerName}` : ''}</span>
        </span>
      )}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose },
        xoa: { nhan: 'Xoá PA', onClick: () => setHoiXoa(true) },
        phu: (
          <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy || !patch || !!loiGhiRo} title={!patch ? 'Chưa có gì thay đổi' : loiGhiRo ?? undefined} onClick={luu}>Lưu</button>
        ),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !!loiGhiRo} title={loiGhiRo ?? undefined} onClick={xacNhan}>Đã thực hiện</button>,
      }}>
      <Khoi tieuDe="Phương án">
        <Hang2>
          <div>
            <Truong nhan="Loại" batBuoc>
              <select className="field w-full" value={kind} onChange={(e) => setKind(e.target.value)}>
                {MEASURE_KINDS_V3.map((k) => (
                  <option key={k} value={k} disabled={isLocked(k) && k !== d.kind} title={isLocked(k) && k !== d.kind ? lockReason(k) ?? undefined : undefined}>
                    {MEASURE_KIND_LABEL_V3[k]}
                  </option>
                ))}
              </select>
            </Truong>
            <OKhac hien={kind === 'other'} value={customName} onChange={setCustomName} nhan="Tên phương án" goiY="Ví dụ: Viết bản cam kết" loi={loiGhiRo} />
          </div>
          <Truong nhan="Phụ trách" as="div">
            <ChonNguoi nhom="nhan_vien" choNgoai={false} value={owner} onChange={setOwner} />
          </Truong>
        </Hang2>
        <Truong nhan="Nội dung" tuyChon>
          <textarea className="field w-full" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Truong>
      </Khoi>

      <Khoi tieuDe={`Vi phạm được xử lý · ${list.length}`}>
        <ul className="m-0 list-none space-y-2 p-0">
          {list.map((v) => (
            <li key={v.id}>
              <div className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked disabled={picked.size === 1}
                  title={picked.size === 1 ? 'PA cần ít nhất một vi phạm. Không cần nữa thì Xoá PA' : undefined}
                  onChange={() => toggle(v.id)} />
                <button type="button" className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-left"
                  onClick={() => setMoChiTiet((cur) => (cur === v.id ? null : v.id))}>
                  <span className="block truncate text-sm text-slate-200 hover:underline" title={v.description}>{v.description}</span>
                  <span className="block text-[11px] text-slate-500">{cat(v)}</span>
                </button>
              </div>
              {moChiTiet === v.id && (
                <div className="ml-6 mt-1.5 border-l pl-3" style={{ borderColor: 'var(--line)' }}>
                  <ChiTietViPham violationId={v.id} canManage={d.canManage} boQuaPhuongAnId={measureId} choSua={choSua} choXoa={choXoa}
                    onSua={(vv) => onSuaViPham({ ...vv }, measureId)}
                    onDaXoa={() => {
                      setPicked((s) => { const n = new Set(s); n.delete(v.id); return n; });
                      setMoChiTiet(null);
                      reload();
                    }}
                    onMoPhuongAn={onMoPhuongAnKhac} />
                </div>
              )}
            </li>
          ))}
        </ul>

        {them.chuaXuLy.length === 0 && them.daXuLy.length === 0 ? (
          <p className="m-0 text-xs text-slate-500">Không còn vi phạm nào khác của em này.</p>
        ) : (
          <>
            {them.chuaXuLy.length > 0 && (
              <div>
                <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs" aria-expanded={moThem}
                  onClick={() => setMoThem((v) => !v)}>
                  {moThem ? '▾' : '▸'} Thêm vi phạm chưa xử lý ({them.chuaXuLy.length})
                </button>
                {moThem && (
                  <ul className="m-0 mt-2 list-none space-y-2 p-0">
                    {them.chuaXuLy.map((v) => (
                      <li key={v.id} className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" checked={false} onChange={() => toggle(v.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-slate-300" title={v.description}>{v.description}</span>
                          <span className="block text-[11px] text-slate-500">{cat(v)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {them.daXuLy.length > 0 && (
              <div>
                <button type="button" className="link appearance-none border-0 bg-transparent p-0 text-xs" aria-expanded={xemDaXuLy}
                  onClick={() => setXemDaXuLy((v) => !v)}>
                  {xemDaXuLy ? '▾' : '▸'} Đã xử lý ở PA khác ({them.daXuLy.length})
                </button>
                {xemDaXuLy && (
                  <ul className="m-0 mt-2 list-none space-y-2 p-0">
                    {them.daXuLy.map((v) => (
                      <li key={v.id} className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" checked={false} onChange={() => toggle(v.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-slate-300" title={v.description}>{v.description}</span>
                          <span className="block text-[11px] text-slate-500">{cat(v)} · {v.stateLabel}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </Khoi>

      <Khoi tieuDe={`Bằng chứng · ${d.attachmentCount}`}>
        <BangChung ownerType="discipline_measure" ownerId={d.id} canEdit={d.canManage} tieuDe="" onChanged={reload} />
      </Khoi>

      <ConfirmDialog open={hoiXoa} onClose={() => setHoiXoa(false)} onConfirm={xoaPhuongAn} title="Xoá PA" danger confirmLabel="Xoá" busy={busy}
        body="Xoá PA này? Vi phạm quay về Chưa xử lý." />
    </KhungPanel>
  );
}
