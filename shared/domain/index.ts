/**
 * TỪ VỰNG NGHIỆP VỤ DÙNG CHUNG cho API và giao diện.
 *
 * Trước đây tất cả nằm trong MỘT file 1200 dòng, nên câu hỏi "luật này ở đâu" không có câu
 * trả lời ngắn nào. Nay chia đúng theo tám module nghiệp vụ của hệ thống; file này chỉ gom
 * lại để mọi chỗ vẫn `import { X } from '@shared/domain/index.ts'` như cũ.
 *
 *   skills     năm ô nhập của Fast Track, bốn môn của Normal
 *   students   trạng thái học viên, lộ trình học, mốc hành trình
 *   fasttrack  lịch Mock Test, kỳ vọng theo lượt, mức SOS
 *   normal     chương trình FOU/BE/ELE, mốc kiểm tra, chấm theo tỷ lệ
 *   cases      hạng mục case, phân loại nguyên nhân, phương án, phê duyệt, kết quả
 *   worklist   báo cáo đơn vị, loại việc, nhãn thời hạn
 *   people     vai trò, quyền, bộ lọc học viên theo vai
 */
export * from './skills.ts';
export * from './students.ts';
export * from './fasttrack.ts';
export * from './normal.ts';
export * from './cases.ts';
export * from './worklist.ts';
export * from './people.ts';
