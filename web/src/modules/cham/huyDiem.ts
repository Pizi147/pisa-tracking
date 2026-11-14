import { HOAN_TAC_VANG_MS } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { api, invalidate } from '../../lib/api.ts';

type Toast = { push: (kind: 'ok' | 'error', text: string, opts?: { key?: string; ms?: number; demLui?: boolean; hanhDong?: { nhan: string; onBam: () => void } }) => void };

/**
 * NHAP-DIEM-b (chủ SP 14/11, đặc tả 5.1–5.2): "Huỷ điểm" / "Khôi phục" MỘT kỹ năng của một em — MỘT bấm, không hộp xác nhận, mọi loại bài
 * (Mock, MT0, lớp thường; máy chủ `huyDiemKn`). Huỷ có Hoàn tác 10 giây; sau đó vẫn "Khôi phục" ở ⋯. Ô đã có điểm mới khi Khôi phục → máy chủ hỏi
 * (`api` mở hộp hỏi). Cùng một hàm cho hồ sơ Mock, hộp một đợt, lưới lớp thường và trang bài lớp thường.
 */
const dangGui = new Set<string>();   // chống bấm đúp (menu ⋯, Hoàn tác, Khôi phục) — mọi nơi gọi
export async function guiHuyDiem(toast: Toast, o: { attemptId: number; skill: string; mon: string; tenHv?: string | null; huy: boolean; onDone?: () => void }) {
  const khoa = `${o.attemptId}:${o.skill}`;
  if (dangGui.has(khoa)) return;
  dangGui.add(khoa);
  try {
    await api.post(`/attempts/${o.attemptId}/skills/${o.skill}/huy-diem`, { huy: o.huy });
  } catch (e: any) { toast.push('error', e.message); return; } finally { dangGui.delete(khoa); }
  invalidate('/regular'); invalidate('/classes'); invalidate('/attempts'); invalidate('/students'); invalidate('/my-work'); invalidate('/ke-hoach-test');
  o.onDone?.();
  const ai = o.tenHv ? ` · ${o.tenHv}` : '';
  toast.push('ok', o.huy ? t('Đã huỷ {mon}{ai}', { mon: o.mon, ai }) : t('Đã khôi phục {mon}{ai}', { mon: o.mon, ai }), {
    key: `huy-diem:${o.attemptId}:${o.skill}`,
    ...(o.huy ? { ms: HOAN_TAC_VANG_MS, demLui: true, hanhDong: { nhan: t('Hoàn tác'), onBam: () => void guiHuyDiem(toast, { ...o, huy: false }) } } : {}),
  });
}
