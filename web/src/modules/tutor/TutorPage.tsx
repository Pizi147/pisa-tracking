import { t } from '@shared/i18n/index.ts';

/**
 * TU-a: khung trang Tutor (`/tutor`, thanh trên "Tutor" theo `tutor.view`) — Head tutor vào thẳng đây. Bảng tutor, Cần chú ý, panel một tutor,
 * tải danh sách, gộp tên, nhận xét: TU-b (đặc tả Tutor mục 7, 8).
 */
export default function TutorPage() {
  return (
    <div className="page space-y-2">
      <h1 className="m-0 text-lg font-semibold text-slate-100">{t('Tutor')}</h1>
      <p className="m-0 text-sm text-slate-400">{t('Danh sách tutor và kết quả từng buổi sẽ hiện ở đây trong bản cập nhật tới.')}</p>
    </div>
  );
}
