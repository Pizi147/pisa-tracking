import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, SectionNote, Skeleton, Th } from '../../ui/ui.tsx';
import { BEHAVIOUR_TOPIC_LABEL } from '@shared/domain/index.ts';

type Row = {
  studentId: number; studentCode: string; fullName: string;
  topics: Record<string, { episodes: number; open: number }>;
  totalEpisodes: number; openEpisodes: number;
  reports: number; warningLetters: number;
  joinedAt: string | null;
};
type Board = {
  classId: number; classCode: string; allJourney: boolean;
  topics: string[]; rows: Row[];
};

/**
 * DẠNG XEM Ý THỨC CỦA MỘT LỚP — mục 13.3.
 *
 * Hàng là học viên; cột là SỐ ĐỢT case từng nhóm, cộng hai con số hành động thật: đã report
 * cho gia đình mấy lần, đã gửi thư cảnh cáo mấy lần.
 *
 * Bảng này cố ý KHÔNG có cột "tỷ lệ tiến bộ". Gia đình đã nhận report không chứng minh em
 * tiến bộ, và bịa một chỉ số thành công học thuật cho một cuộc gọi là nói dối bằng số.
 */
export function ClassBehaviourBoard({ classId }: { classId: number }) {
  /* Mặc định là GIAI ĐOẠN EM HỌC TẠI LỚP NÀY — chuyển lớp không mang lịch sử cũ sang. */
  const [allJourney, setAllJourney] = useState(false);
  const { data, loading, error, reload } = useApi<Board>(
    `/classes/${classId}/behaviour${allJourney ? '?scope=all' : ''}`, [classId, allJourney],
  );

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={6} />;
  if (!data.rows.length) return <Empty title="Lớp này chưa có học viên nào" />;

  const any = data.rows.some((r) => r.totalEpisodes > 0 || r.reports > 0 || r.warningLetters > 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {/* PHẠM VI GHI NGAY CHỖ ĐỌC, không để người xem tự đoán mình đang nhìn khoảng nào. */}
          {allJourney
            ? 'Đang đếm TOÀN BỘ hành trình của em, gồm cả lớp cũ.'
            : 'Đang đếm từ lúc em vào lớp này.'}
        </span>
        <button className="btn btn-sm btn-ghost" onClick={() => setAllJourney(!allJourney)}>
          {allJourney ? 'Chỉ đếm ở lớp này' : 'Đếm toàn hành trình'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Học viên</Th>
              {data.topics.map((t) => (
                <Th key={t} className="text-right"
                  hint="Số ĐỢT case của nhóm này. Nhiều lần báo trong bốn ngày là một đợt, không phải nhiều case.">
                  {BEHAVIOUR_TOPIC_LABEL[t as keyof typeof BEHAVIOUR_TOPIC_LABEL] ?? t}
                </Th>
              ))}
              <Th className="text-right" hint="Số lần ĐÃ report cho gia đình. Phương án dự kiến chưa làm thì không tính.">
                Report gia đình
              </Th>
              <Th className="text-right" hint="Số thư cảnh cáo ĐÃ gửi.">Thư cảnh cáo</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.studentId} className="row-hover">
                <td className="td">
                  <Link className="text-slate-100 no-underline hover:underline" to={`/hoc-vien/${r.studentId}`}>
                    {r.fullName}
                  </Link>
                  <span className="block text-[10px] text-slate-500">{r.studentCode}</span>
                </td>
                {data.topics.map((t) => {
                  const c = r.topics[t] ?? { episodes: 0, open: 0 };
                  return (
                    <td key={t} className="td text-right tabular-nums">
                      {c.episodes === 0 ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <Link className="no-underline" to={`/hoc-vien/${r.studentId}`}>
                          <span className={c.open > 0 ? 'text-amber-200' : 'text-slate-300'}>{c.episodes}</span>
                          {c.open > 0 && <span className="text-[10px] text-amber-300"> ({c.open} đang mở)</span>}
                        </Link>
                      )}
                    </td>
                  );
                })}
                <td className="td text-right tabular-nums text-slate-300">
                  {r.reports || <span className="text-slate-600">—</span>}
                </td>
                <td className="td text-right tabular-nums text-slate-300">
                  {r.warningLetters || <span className="text-slate-600">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!any && (
        <p className="text-xs text-slate-500 m-0">
          Lớp này chưa có đợt Ý thức/Khác nào trong phạm vi đang xem.
        </p>
      )}

      <SectionNote>
        Số ở cột nhóm là <strong>số đợt</strong> sau khi gộp: nhiều lần giáo viên báo trong bốn ngày
        là một đợt, không phải nhiều case. Hai cột cuối đếm <strong>lần đã làm thật</strong> — một
        cuộc gọi nói cả hai chuyện vẫn là một lần. Nhóm này không có tỷ lệ tiến bộ: gia đình đã nhận
        report không chứng minh em đã khá hơn.
      </SectionNote>
    </div>
  );
}
