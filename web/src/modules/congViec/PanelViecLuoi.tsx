import { Suspense, type ComponentProps } from 'react';
import { lazyTai } from '../../lib/taiLaiManh.ts';
import type { PanelViec as PanelViecDay } from './PanelViec.tsx';

/**
 * TAI-NHANH-0711: mảnh `PanelViec` (~90 KB gzip, kéo theo lưới điểm, Case, Ý thức, Bàn giao…) chỉ tải khi mở một việc — trang danh sách
 * (Công việc, Kế hoạch Test, hồ sơ lớp, Học viên) không phải chờ. `NAP_SAN` (App.tsx) nạp ngầm mảnh này sau trang đầu nên bấm việc vẫn mở ngay.
 */
const Manh = lazyTai(() => import('./PanelViec.tsx').then((m) => ({ default: m.PanelViec })));

export function PanelViec(p: ComponentProps<typeof PanelViecDay>) {
  return <Suspense fallback={null}><Manh {...p} /></Suspense>;
}
