import type { StudentSeed } from './journeys.ts';

/**
 * BA MƯƠI HAI HỌC VIÊN, MỖI EM MỘT CÂU CHUYỆN — mục 11.3 và 11.4.
 *
 * Mọi con số ở đây viết tay và phải NỐI ĐƯỢC VỚI NHAU:
 *
 *   · điểm MT2 nói tiếp câu chuyện MT1 mở ra, không mâu thuẫn với nó;
 *   · ngày ghi kết quả luôn SAU ngày phương án bắt đầu;
 *   · không có sự kiện nào "đã hoàn thành" ở một ngày chưa tới (14/09/2026);
 *   · một mốc trong tương lai chỉ là kế hoạch, không bao giờ có điểm.
 *
 * NGƯỠNG ĐỂ ĐỌC BẢNG NÀY:
 *   Fast Track  kỳ vọng = target − 1.0 (MT1) · − 0.5 (MT2) · 0 (MT3 trở đi).
 *               Band Writing = làm tròn nửa của (W1 + 2×W2) / 3.
 *   Normal      đạt khi điểm đạt / tổng điểm ≥ 70%.
 *
 * Khoảng một nửa số em ổn định hoặc đã cải thiện. Chỉ một vài case quá hạn — một màn hình
 * đỏ rực thì không ai phân biệt được chỗ nào thật sự gấp.
 */
export const STUDENTS: StudentSeed[] = [

  /* ═══════════════════════════════════════════════ MB FT 101 · Monbay · Fast Track LT1
     MT1 06/07 · MT2 17/08 · MT3 14/09 (tuần này) */

  {
    code: 'J01', name: 'Nguyễn Minh An', branch: 'MB', dob: '2008-04-11',
    story: 'Hành trình dài nhất: Foundation (12/2025) → Beginner → Fast Track. Lớp cũ, điểm cũ '
      + 'và một case Reading từ lớp Beginner vẫn còn mở, nên nó theo em sang lớp mới như một '
      + 'việc bàn giao. Ý thức: bảy vi phạm của bốn giáo viên, trong đó bốn cái chưa ai xử lý (cũ nhất 9 ngày → cảnh báo) '
      + 'và một Report cho gia đình đang chuẩn bị, được gộp thêm vi phạm sau khi tạo (`yThucSeed.ts`).',
    enrollments: [
      { class: 'MB FOU 03', from: '2025-12-01', to: '2026-01-25', status: 'completed' },
      { class: 'MB BE 08', from: '2026-02-16', to: '2026-04-26', status: 'completed' },
      { class: 'MB FT 101', from: '2026-06-01', status: 'active' },
    ],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'MB FOU 03', status: 'completed',
        startWeek: '2025-12-01', startedAt: '2025-12-01', endedAt: '2026-01-25',
        outcome: 'reached', outcomeNote: 'Hoàn thành Foundation, đủ điều kiện lên Beginner.',
        tests: [
          {
            no: 1, kind: 'progress', week: '2025-12-22', status: 'done',
            ratios: { listening: [24, 40], reading: [26, 40], writing: [14, 20], speaking: [16, 25] },
          },
          {
            no: 2, kind: 'final', week: '2026-01-19', status: 'done',
            ratios: { listening: [28, 40], reading: [27, 40], writing: [15, 20], speaking: [17, 25] },
          },
        ],
      },
      {
        seq: 2, route: null, target: null, classCode: 'MB BE 08', status: 'completed',
        startWeek: '2026-02-16', startedAt: '2026-02-16', endedAt: '2026-04-26',
        outcome: 'reached', outcomeNote: 'Hoàn thành Beginner, chuyển sang Fast Track.',
        tests: [
          {
            no: 1, kind: 'progress', week: '2026-03-16', status: 'done',
            ratios: { listening: [26, 40], reading: [25, 40], writing: [13, 20], speaking: [16, 25] },
          },
          {
            /* Reading 22/40 = 55% → dưới ngưỡng. Đây là case sẽ theo em sang lớp Fast Track. */
            no: 2, kind: 'final', week: '2026-04-20', status: 'done',
            ratios: { listening: [28, 40], reading: [22, 40], writing: [14, 20], speaking: [17, 25] },
          },
        ],
        cases: [
          {
            topic: 'reading', fromTest: 2, sosLevel: 1, detectedAt: '2026-04-26',
            primaryCode: 'student.reading.technique',
            title: 'Reading Final Test Beginner còn dưới ngưỡng',
            summary: 'Em làm hết bài nhưng sai nhiều câu dạng matching headings.',
            status: 'in_progress', owner: 'T_KHOA',
            plans: [
              {
                kind: 'self_study', description: 'Luyện matching headings hai bài/tuần, có chữa',
                performer: 'T_KHOA', cycleStart: '2026-05-04', status: 'started',
                startedOn: '2026-05-04', followupDue: '2026-09-21',
              },
            ],
          },
        ],
      },
      {
        seq: 3, route: 'LT1', target: 6.5, classCode: 'MB FT 101', status: 'active',
        startWeek: '2026-06-01', startedAt: '2026-06-01',
        examMonth: '2027-02', examWeek: '2027-02-08',
        baseline: { score: 5.0, source: 'previous_cycle', note: 'Kết quả Final Test Beginner quy đổi.' },
        tests: [
          {
            /* Kỳ vọng MT1 = 5.5. Reading 5.0 dưới kỳ vọng → SOS 1. */
            no: 1, kind: 'mock', week: '2026-07-06', status: 'done',
            bands: { listening: 5.5, reading: 5.0, writing1: 5.5, writing2: 5.5, speaking: 5.5 },
          },
          {
            /* Kỳ vọng MT2 = 6.0. Writing gộp (5.5 + 12)/3 = 6.0 → đạt hết. */
            no: 2, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 5.5, writing2: 6.0, speaking: 6.0 },
          },
          {
            /*
             * VẮNG LẦN ĐẦU, CHƯA AI XỬ LÝ (mục 10.6).
             *
             * GVCN đã xác minh em vắng buổi Speaking nhưng chưa bấm dời. Đây là lần thứ nhất,
             * nên GVCN tự dời được — và chỉ dời đúng sang tuần kế tiếp của lịch đang có, không
             * chọn tuỳ ý. Bộ demo cần cả hai khúc này để so được hai đường đi.
             */
            no: 3, kind: 'mock', week: '2026-09-14', status: 'planned',
            absent: {
              skill: 'speaking',
              note: 'GVCN xác minh em không tới buổi Speaking',
            },
          },
        ],
        cases: [
          {
            topic: 'reading', fromTest: 1, sosLevel: 1, detectedAt: '2026-07-12',
            primaryCode: 'student.reading.technique',
            title: 'Reading MT1 dưới kỳ vọng',
            summary: 'Vẫn là dạng matching headings — đúng vấn đề đã theo dõi từ lớp Beginner.',
            status: 'done', owner: 'T_HA',
            disposition: 'action', outcome: 'improved',
            outcomeNote: 'MT2 Reading lên 6.0, đạt kỳ vọng. Khép lại, theo dõi tiếp ở MT3.',
            closedOn: '2026-08-24', closedBy: 'T_HA',
            plans: [
              {
                kind: 'tutor', description: 'Hai buổi tutor Reading, tập trung matching headings',
                performer: 'T_HA', cycleStart: '2026-07-13', status: 'completed',
                startedOn: '2026-07-15', completedOn: '2026-08-05', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-24', outcome: 'improved', nextStep: 'complete',
                  note: 'MT2 Reading 6.0, đạt kỳ vọng. Em tự làm được dạng bài này.',
                }],
              },
            ],
          },
        ],
      },
    ],
  },

  {
    code: 'J02', name: 'Trần Thu Hà', branch: 'MB', dob: '2009-01-22',
    story: 'SOS giảm dần sau hỗ trợ: MT1 SOS 2 → hỗ trợ → MT2 SOS 1 → MT3 đang chờ điểm. '
      + 'Vẫn còn một case Speaking đang theo dõi dù kết quả gần nhất đã khá lên.',
    enrollments: [{ class: 'MB FT 101', from: '2026-06-01', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 6.0, classCode: 'MB FT 101', status: 'active',
        startWeek: '2026-06-01', startedAt: '2026-06-01',
        examMonth: '2027-01', examWeek: '2027-01-11',
        baseline: { score: 4.5, source: 'entrance', note: 'Bài kiểm tra đầu vào tháng 5/2026.' },
        tests: [
          {
            /* Kỳ vọng 5.0. Reading 4.5 và Speaking 4.5 dưới kỳ vọng → SOS 2. */
            no: 1, kind: 'mock', week: '2026-07-06', status: 'done',
            bands: { listening: 5.0, reading: 4.5, writing1: 5.0, writing2: 5.0, speaking: 4.5 },
          },
          {
            /* Kỳ vọng 5.5. Reading đã lên 5.5; Speaking 5.0 vẫn dưới → SOS 1. */
            no: 2, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 5.5, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 5.0 },
          },
          {
            /*
             * VẮNG LẦN HAI, ĐANG CHỜ QUẢN LÝ DUYỆT (mục 10.6).
             *
             * Em đã vắng buổi Speaking một lần và được GVCN dời; lần này vắng tiếp, nên GVCN
             * chỉ ĐỀ NGHỊ được, còn lịch giữ nguyên cho tới khi Quản lý trả lời. Hạn trả lời
             * là ngày TRƯỚC khi tuần mới bắt đầu — quá hạn thì phần thi bị huỷ.
             *
             * Đây là ô để người xem bấm thử đường duyệt, và để thấy một "Chờ duyệt dời" thật
             * trên bảng lịch kỹ năng.
             */
            no: 3, kind: 'mock', week: '2026-09-14', status: 'planned',
            absent: {
              skill: 'speaking', moveCount: 1, pending: true,
              note: 'GVCN xác minh em không tới buổi Speaking',
              reason: 'Em ốm, gia đình báo sáng cùng ngày',
            },
          },
        ],
        cases: [
          {
            topic: 'reading', fromTest: 1, sosLevel: 2, detectedAt: '2026-07-12',
            primaryCode: 'student.reading.time',
            title: 'Reading chậm, không kịp giờ',
            summary: 'Em đọc kỹ từng câu nên hết giờ khi còn 8 câu chưa làm.',
            status: 'done', owner: 'T_HA', disposition: 'action', outcome: 'improved',
            outcomeNote: 'MT2 Reading 5.5, đạt kỳ vọng. Kỹ thuật skimming đã dùng được.',
            closedOn: '2026-08-24', closedBy: 'T_HA',
            plans: [
              {
                kind: 'teaching_adjust', description: 'Dạy skimming/scanning, bấm giờ từng passage',
                performer: 'T_HA', cycleStart: '2026-07-13', status: 'completed',
                startedOn: '2026-07-14', completedOn: '2026-08-10', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-24', outcome: 'improved', nextStep: 'complete',
                  note: 'MT2 làm hết bài, Reading 5.5.',
                }],
              },
            ],
          },
          {
            topic: 'speaking', fromTest: 1, sosLevel: 2, detectedAt: '2026-07-12',
            primaryCode: 'student.speaking.fluency',
            title: 'Speaking Part 2 nói ngắn',
            summary: 'Part 2 em chỉ nói được khoảng 45 giây rồi dừng.',
            status: 'in_progress', owner: 'T_TRANG',
            repeatsAt: [2],
            plans: [
              {
                kind: 'tutor', description: 'Tutor Speaking 1-1, luyện dàn ý Part 2',
                performer: 'T_TRANG', cycleStart: '2026-07-13', status: 'completed',
                startedOn: '2026-07-16', completedOn: '2026-08-12', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-24', outcome: 'partial', nextStep: 'monitor',
                  note: 'Nói được 1 phút 10, còn ngập ngừng ở phần lý do. Chưa đạt kỳ vọng nhưng có tiến bộ.',
                }],
              },
              {
                kind: 'self_study', description: 'Ghi âm một đề Part 2 mỗi tuần, cô nghe và chữa',
                performer: 'T_TRANG', cycleNo: 2, cycleStart: '2026-08-24', status: 'started',
                startedOn: '2026-08-25', followupDue: '2026-09-21',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    code: 'J03', name: 'Lê Quang Huy', branch: 'MB', dob: '2008-09-30',
    story: 'HỒ SƠ DÀY NHẤT của bộ demo — dựng để xem một em nhiều case thì màn hình ra sao. '
      + 'Sáu case ở năm hạng mục, đủ mọi trạng thái: một case Listening đi qua hai chu kỳ hỗ '
      + 'trợ mà chưa xong; một case Reading đã khép lại có kết quả tốt; một case Writing 2 có '
      + 'phương án KHÔNG ăn thua rồi bị thay bằng phương án khác — kết quả thất bại cũ vẫn ở '
      + 'lại trong báo cáo; một case Speaking đã đóng rồi TÁI DIỄN nên có case mới nối vào case '
      + 'cũ. Chuyện Ý thức của em nằm ở phần Vi phạm và Biện pháp (`yThucSeed.ts`): sáu vi phạm đi vào ba biện pháp, một vi '
      + 'phạm nằm trong hai biện pháp ở hai thời điểm khác nhau, và một vi phạm đã bị đánh dấu không chính xác sau khi biện pháp '
      + 'đã thực hiện.',
    enrollments: [{ class: 'MB FT 101', from: '2026-06-01', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 6.5, classCode: 'MB FT 101', status: 'active',
        startWeek: '2026-06-01', startedAt: '2026-06-01',
        examMonth: '2027-02', examWeek: null,
        baseline: { score: 5.0, source: 'entrance' },
        tests: [
          {
            /* Kỳ vọng 5.5 — Listening 5.0 dưới kỳ vọng. */
            no: 1, kind: 'mock', week: '2026-07-06', status: 'done',
            bands: { listening: 5.0, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 6.0 },
          },
          {
            /* Kỳ vọng 6.0 — Listening 5.5, vẫn dưới. Case CŨ mở lại, không mở case mới. */
            no: 2, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 5.5, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 },
          },
          { no: 3, kind: 'mock', week: '2026-09-14', status: 'planned' },
        ],
        cases: [
          {
            topic: 'listening', fromTest: 1, sosLevel: 1, detectedAt: '2026-07-12',
            primaryCode: 'student.listening.technique',
            title: 'Listening mất điểm ở Section 3',
            summary: 'Em theo kịp Section 1–2 nhưng mất mạch khi có ba người nói.',
            status: 'in_progress', owner: 'T_HA', repeatsAt: [2],
            plans: [
              {
                kind: 'self_study', description: 'Nghe chép chính tả Section 3, hai bài/tuần',
                performer: 'T_HA', cycleStart: '2026-07-13', status: 'completed',
                startedOn: '2026-07-14', completedOn: '2026-08-10', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-24', outcome: 'partial', nextStep: 'continue',
                  note: 'MT2 Listening lên 5.5 nhưng kỳ vọng cũng lên 6.0 — vẫn chưa đạt. Giữ nguyên cách làm, tăng liều.',
                }],
              },
              {
                kind: 'tutor', description: 'Thêm một buổi tutor Listening mỗi tuần',
                performer: 'T_HA', cycleNo: 2, cycleStart: '2026-08-24', status: 'started',
                startedOn: '2026-08-26', followupDue: '2026-09-28',
              },
            ],
          },

          /*
           * CASE ĐÃ KHÉP LẠI VÀ ĂN THUA — để bảng hiệu quả có một "thành công" thật, và để
           * hồ sơ không chỉ toàn việc đang dở. Case đã đóng vẫn phải vào báo cáo hiệu quả
           * (mục 15.3), nếu không thì phần thành công đã khép biến mất khỏi mọi con số.
           */
          {
            topic: 'reading', fromTest: 1, sosLevel: 1, detectedAt: '2026-07-12',
            primaryCode: 'student.reading.time',
            title: 'Reading: hết giờ khi còn hai câu cuối',
            summary: 'Em đọc kỹ từng câu nên luôn hết giờ khi còn hai câu cuối của Passage 3.',
            status: 'done', owner: 'T_HA',
            disposition: 'action', outcome: 'improved',
            outcomeNote: 'MT2 Reading 6.0, làm hết bài còn dư hai phút. Khép lại, theo dõi ở MT3.',
            closedOn: '2026-08-24', closedBy: 'T_HA',
            plans: [
              {
                kind: 'teaching_adjust',
                description: 'Buổi chữa bài làm chậm phần tìm dẫn chứng, ép bấm giờ từng passage',
                performer: 'T_HA', cycleStart: '2026-07-13', status: 'completed',
                startedOn: '2026-07-15', completedOn: '2026-08-10', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [
                  /*
                   * "CHƯA ĐỦ DỮ LIỆU" rồi mới tới tiến bộ (tình huống 11 của mục 18.2).
                   * Lần cập nhật đầu KHÔNG được vào mẫu số hiệu quả; kết quả cuối mới tính.
                   */
                  {
                    on: '2026-07-27', outcome: 'insufficient', nextStep: 'continue',
                    note: 'Tuần này lớp chưa có bài Reading bấm giờ nào nên chưa nhìn được gì.',
                  },
                  {
                    on: '2026-08-24', outcome: 'improved', nextStep: 'complete',
                    note: 'Bài bấm giờ hai tuần liền em làm hết Passage 3 còn dư hai phút.',
                    metrics: [{ skill: 'reading', score: 32, total: 40 }],
                  },
                ],
              },
            ],
          },

          /*
           * PHƯƠNG ÁN KHÔNG ĂN THUA RỒI BỊ THAY (tình huống 12 của mục 18.2).
           *
           * Phương án cũ đóng với lý do "bị thay thế" nhưng kết quả "Không tiến bộ" của nó
           * VẪN NẰM LẠI trong báo cáo hiệu quả. Loại hết phương án bị thay là loại đúng những
           * phương án kém, và tỷ lệ còn lại đẹp giả.
           */
          {
            topic: 'writing2', fromTest: 1, sosLevel: 1, detectedAt: '2026-07-12',
            primaryCode: 'student.writing.organisation',
            title: 'Task 2: hai thân bài nói chồng ý nhau',
            summary: 'Hai thân bài của em nói cùng một ý bằng hai cách, kết luận nhắc lại đề.',
            status: 'in_progress', owner: 'T_HA',
            plans: [
              {
                kind: 'extra_homework', description: 'Mỗi tuần viết một dàn ý Task 2 rồi nộp chữa',
                performer: 'T_HA', cycleStart: '2026-07-13', status: 'completed',
                startedOn: '2026-07-14', completedOn: '2026-08-17', followupDue: '2026-08-24',
                closedReason: 'superseded',
                followups: [{
                  on: '2026-08-24', outcome: 'unchanged', nextStep: 'propose',
                  note: 'Bốn tuần nộp dàn ý nhưng bài viết vẫn chồng ý — em làm dàn ý xong lại '
                    + 'viết theo cách cũ. Đổi cách khác.',
                }],
              },
              {
                kind: 'tutor', description: 'Tutor Writing 1-1, chữa trực tiếp bố cục từng bài',
                performer: 'T_HA', cycleNo: 2, cycleStart: '2026-08-24', status: 'started',
                startedOn: '2026-08-26', followupDue: '2026-09-21',
              },
            ],
          },

          /*
           * CASE ĐÃ ĐÓNG RỒI TÁI DIỄN — hai bản ghi nối nhau, không phải một case bị mở lại.
           * Kết luận cũ giữ nguyên; case mới nói rõ nó nối vào case nào.
           */
          {
            topic: 'speaking', fromTest: 1, sosLevel: 1, detectedAt: '2026-07-12',
            primaryCode: 'student.speaking.fluency',
            title: 'Speaking Part 2 nói chưa đủ hai phút',
            summary: 'Part 2 em nói khoảng một phút rồi dừng, phần lý do bỏ trống.',
            status: 'done', owner: 'T_TRANG',
            disposition: 'action', outcome: 'improved',
            outcomeNote: 'MT2 Speaking 6.0, nói đủ hai phút. Khép lại.',
            closedOn: '2026-08-24', closedBy: 'T_TRANG',
            plans: [
              {
                kind: 'self_study', description: 'Ghi âm một đề Part 2 mỗi tuần, tự nghe lại',
                performer: 'T_TRANG', cycleStart: '2026-07-13', status: 'completed',
                startedOn: '2026-07-15', completedOn: '2026-08-12', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-24', outcome: 'improved', nextStep: 'complete',
                  note: 'Em nói đủ hai phút, có phần lý do. MT2 Speaking 6.0.',
                }],
              },
            ],
          },
          {
            topic: 'speaking', detectedAt: '2026-09-07', sosLevel: null,
            /* Đặc tả Ý thức §10 tình huống 12 — case học thuật mức Gấp. Từ 21/09/2026 không còn case Ý thức nào mang mức này, nên nó ở đây. */
            originKind: 'teacher_report', urgency: 'urgent',
            primaryCode: 'student.speaking.lexical',
            linksPreviousOf: 'speaking',
            title: 'Speaking tái diễn: nói dài nhưng lặp từ',
            summary: 'Nay em nói đủ giờ nhưng dùng đi dùng lại bốn năm từ, Part 3 gần như không '
              + 'triển khai được ý nào mới.',
            status: 'open', owner: 'T_TRANG', reportedBy: 'T_TRANG',
          },

        ],
      },
    ],
  },

  {
    code: 'J08', name: 'Phạm Bảo Ngọc', branch: 'MB', dob: '2009-06-05',
    story: 'MT3 của tuần này mới nhập được 2/4 kỹ năng, nên kết luận là TẠM THỜI. Điểm MT2 đầy '
      + 'đủ vẫn xem được nhưng KHÔNG lấp vào ô còn thiếu và không ghép thành Overall của MT3.',
    enrollments: [{ class: 'MB FT 101', from: '2026-06-01', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 7.0, classCode: 'MB FT 101', status: 'active',
        startWeek: '2026-06-01', startedAt: '2026-06-01',
        examMonth: '2027-03', examWeek: null,
        baseline: { score: 5.5, source: 'external', note: 'Điểm IELTS 5.5 thi ở nơi khác tháng 3/2026.' },
        tests: [
          {
            /* Kỳ vọng 6.0 — đạt hết. */
            no: 1, kind: 'mock', week: '2026-07-06', status: 'done',
            bands: { listening: 6.0, reading: 6.5, writing1: 6.0, writing2: 6.0, speaking: 6.0 },
          },
          {
            /* Kỳ vọng 6.5 — đạt hết. */
            no: 2, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 6.5, reading: 7.0, writing1: 6.5, writing2: 6.5, speaking: 6.5 },
          },
          {
            /*
             * Kỳ vọng 7.0. Mới có L và R; Writing và Speaking CHƯA NHẬP → kết luận tạm thời.
             *
             * ĐỢT NÀY TÁCH TUẦN: R/L/W thi tuần 14–20/9, Speaking tuần 21–27/9 (mục 10.1).
             * Writing đang chờ chấm với hạn thứ Tư 23/9, còn Speaking thì CHƯA ĐẾN LỊCH nên
             * không hiện nợ nhập điểm — đúng điều mục 10.5 đòi.
             */
            no: 3, kind: 'mock', week: '2026-09-14', status: 'done',
            bands: { listening: 6.5, reading: 7.0 }, enteredOn: '2026-09-14',
            skillWeeks: { speaking: '2026-09-21' },
          },
        ],
        cases: [
          {
            topic: 'listening', fromTest: 3, sosLevel: 1, detectedAt: '2026-09-14',
            primaryCode: 'student.listening.other',
            title: 'Listening MT3 chưa chạm kỳ vọng 7.0',
            summary: 'Mới có điểm 2/4 kỹ năng nên đây là kết luận tạm thời của MT3.',
            status: 'open', owner: 'T_HA',
          },
        ],
      },
    ],
  },

  {
    code: 'S01', name: 'Vũ Hải Đăng', branch: 'MB', dob: '2008-11-17',
    story: 'Học viên ổn định — không có case nào. Bảng nào cũng cần một em như vậy để người '
      + 'đọc biết màn hình trống là tin tốt chứ không phải lỗi dữ liệu.',
    enrollments: [{ class: 'MB FT 101', from: '2026-06-01', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 6.0, classCode: 'MB FT 101', status: 'active',
        startWeek: '2026-06-01', startedAt: '2026-06-01',
        examMonth: '2027-01', examWeek: '2027-01-11',
        baseline: { score: 5.0, source: 'entrance' },
        tests: [
          { no: 1, kind: 'mock', week: '2026-07-06', status: 'done',
            bands: { listening: 5.5, reading: 5.5, writing1: 5.0, writing2: 5.5, speaking: 5.5 } },
          { no: 2, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 5.5, writing2: 6.0, speaking: 6.0 } },
          { no: 3, kind: 'mock', week: '2026-09-14', status: 'planned' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════ MB FT 102 · Monbay · Fast Track LT2
     MT1 03/08 đã xong · MT2 14/09 (tuần này) */

  {
    code: 'S26', name: 'Chu Minh Hiếu', branch: 'MB', dob: '2008-02-19',
    story: 'Lớp Fast Track thứ hai của Monbay: MT1 đã xong, MT2 rơi đúng tuần này. Em ổn định.',
    enrollments: [{ class: 'MB FT 102', from: '2026-06-29', status: 'active' }],
    cycles: [{
      seq: 1, route: 'LT2', target: 6.0, classCode: 'MB FT 102', status: 'active',
      startWeek: '2026-06-29', startedAt: '2026-06-29',
      examMonth: '2027-02', examWeek: null,
      baseline: { score: 5.0, source: 'entrance' },
      tests: [
        { no: 1, kind: 'mock', week: '2026-08-03', status: 'done',
          bands: { listening: 5.5, reading: 5.5, writing1: 5.0, writing2: 5.5, speaking: 5.5 } },
        {
          /*
           * MT2 TUẦN NÀY, ĐIỂM VỪA VÀO. Kỳ vọng 5.5; Reading 5.0 dưới kỳ vọng nên sinh một
           * tín hiệu cho cô Reading, hạn xác minh 16/09 — CHƯA quá hạn.
           *
           * Đây là ca "vừa có tín hiệu, còn trong hạn" của bộ demo: mở hàng việc ra phải
           * thấy cả việc còn thời gian, không chỉ toàn việc đã đỏ.
           */
          no: 2, kind: 'mock', week: '2026-09-14', status: 'done',
          bands: { listening: 6.0, reading: 5.0, writing1: 5.5, writing2: 5.5, speaking: 6.0 },
          enteredOn: '2026-09-14',
        },
      ],
    }],
  },
  {
    code: 'S27', name: 'Tạ Thu Quỳnh', branch: 'MB', dob: '2009-11-11',
    story: 'Cùng lớp với S26. MT1 có một kỹ năng dưới kỳ vọng và case đã khép với kết luận rõ.',
    enrollments: [{ class: 'MB FT 102', from: '2026-06-29', status: 'active' }],
    cycles: [{
      seq: 1, route: 'LT2', target: 6.5, classCode: 'MB FT 102', status: 'active',
      startWeek: '2026-06-29', startedAt: '2026-06-29',
      examMonth: '2027-03', examWeek: null,
      baseline: { score: 5.0, source: 'entrance' },
      tests: [
        {
          /* Kỳ vọng 5.5 — Listening 5.0 dưới kỳ vọng. */
          no: 1, kind: 'mock', week: '2026-08-03', status: 'done',
          bands: { listening: 5.0, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 6.0 },
        },
        {
          /*
           * CHIỀU NGƯỢC LẠI của J08: Speaking thi TRƯỚC (tuần 14–20/9), R/L/W thi tuần sau
           * (21–27/9). Đề bài nói rõ cả hai chiều đều có thật, nên bộ demo phải có cả hai.
           * Tuần kế hoạch hoàn tất của đợt vì thế là tuần 21–27/9, tuần muộn nhất.
           */
          no: 2, kind: 'mock', week: '2026-09-14', status: 'planned',
          skillWeeks: { listening: '2026-09-21', reading: '2026-09-21', writing: '2026-09-21' },
        },
      ],
      cases: [
        {
          topic: 'listening', fromTest: 1, sosLevel: 1, detectedAt: '2026-08-09',
          primaryCode: 'student.listening.sound',
          summary: 'Em mất điểm ở phần điền số và ngày tháng.',
          status: 'done', owner: 'T_LINH', disposition: 'monitor', outcome: 'improved',
          outcomeNote: 'Sau ba tuần luyện nghe số, cô nghe thử lại thấy em bắt được. '
            + 'Chốt theo dõi tiếp ở MT2.',
          closedOn: '2026-08-31', closedBy: 'T_LINH',
          plans: [
            {
              kind: 'self_study', description: 'Luyện nghe số, ngày tháng và địa chỉ 10 phút/ngày',
              performer: 'T_LINH', cycleStart: '2026-08-10', status: 'completed',
              startedOn: '2026-08-11', completedOn: '2026-08-28', followupDue: '2026-08-31',
              closedReason: 'done',
              followups: [{
                on: '2026-08-31', outcome: 'improved', nextStep: 'monitor',
                note: 'Cô cho làm thử một section, em bắt đúng cả 10 câu số.',
                metrics: [{ skill: 'listening', score: 10, total: 10 }],
              }],
            },
          ],
        },
      ],
    }],
  },

  /* ═══════════════════════════════════════════════ MB FOU 12 · Monbay · Foundation
     Progress 17/08 đã xong · Final 14/09 đúng tuần này */

  {
    code: 'S02', name: 'Đỗ Gia Bảo', branch: 'MB', dob: '2011-02-03',
    story: 'Lớp Normal, Progress Test đủ điểm và đạt. Final Test rơi đúng tuần này nên chưa có điểm.',
    enrollments: [{ class: 'MB FOU 12', from: '2026-07-27', status: 'active' }],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'MB FOU 12', status: 'active',
        startWeek: '2026-07-27', startedAt: '2026-07-27',
        tests: [
          { no: 1, kind: 'progress', week: '2026-08-17', status: 'done',
            ratios: { listening: [28, 40], reading: [27, 40], writing: [15, 20], speaking: [18, 25] } },
          {
            /*
             * FINAL TEST TRẢI BA TUẦN — cả lớp MB FOU 12 thi như nhau.
             * L và R tuần 14–20/9, Writing tuần 21–27/9, Speaking tuần 28/9–4/10.
             * Hạn chấm của lớp Normal là hết CHỦ NHẬT của chính tuần thi môn đó, nên ba
             * môn có ba hạn khác nhau và môn chưa tới tuần thì chưa nợ ai cái gì.
             * Vẫn là MỘT bài Final Test, vẫn phải đủ bốn môn mới hoàn tất.
             */
            no: 2, kind: 'final', week: '2026-09-14', status: 'planned',
            skillWeeks: { writing: '2026-09-21', speaking: '2026-09-28' },
          },
        ],
      },
    ],
  },

  {
    code: 'S03', name: 'Hoàng Thanh Mai', branch: 'MB', dob: '2011-05-19',
    story: 'Lớp Normal: Writing 10/20 = 50%, dưới ngưỡng 70% → một tín hiệu môn W của lớp thường. '
      + 'Không dùng nhãn W2 của Fast Track cho môn này.',
    enrollments: [{ class: 'MB FOU 12', from: '2026-07-27', status: 'active' }],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'MB FOU 12', status: 'active',
        startWeek: '2026-07-27', startedAt: '2026-07-27',
        tests: [
          { no: 1, kind: 'progress', week: '2026-08-17', status: 'done',
            ratios: { listening: [26, 40], reading: [25, 40], writing: [10, 20], speaking: [17, 25] } },
          {
            /*
             * FINAL TEST TRẢI BA TUẦN — cả lớp MB FOU 12 thi như nhau.
             * L và R tuần 14–20/9, Writing tuần 21–27/9, Speaking tuần 28/9–4/10.
             * Hạn chấm của lớp Normal là hết CHỦ NHẬT của chính tuần thi môn đó, nên ba
             * môn có ba hạn khác nhau và môn chưa tới tuần thì chưa nợ ai cái gì.
             * Vẫn là MỘT bài Final Test, vẫn phải đủ bốn môn mới hoàn tất.
             */
            no: 2, kind: 'final', week: '2026-09-14', status: 'planned',
            skillWeeks: { writing: '2026-09-21', speaking: '2026-09-28' },
          },
        ],
        cases: [
          {
            topic: 'writing', fromTest: 1, sosLevel: 1, detectedAt: '2026-08-23',
            primaryCode: 'student.writing.organisation',
            title: 'Writing Progress Test chưa đạt',
            summary: 'Bài viết đủ ý nhưng câu rời rạc, thiếu từ nối.',
            status: 'in_progress', owner: 'T_KHOA',
            plans: [
              {
                kind: 'teaching_adjust', description: 'Mỗi buổi dành 15 phút chữa câu và từ nối',
                performer: 'T_KHOA', cycleStart: '2026-08-24', status: 'started',
                startedOn: '2026-08-25', followupDue: '2026-09-14',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    code: 'S04', name: 'Bùi Khánh Linh', branch: 'MB', dob: '2011-08-27',
    story: 'Lớp Normal: Progress Test THIẾU điểm Speaking (em vắng buổi đó). Ba môn đã chấm đều '
      + 'đạt, nhưng thiếu điểm KHÔNG được đọc thành "đạt" — bảng phải ghi là chưa kết luận được.',
    enrollments: [{ class: 'MB FOU 12', from: '2026-07-27', status: 'active' }],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'MB FOU 12', status: 'active',
        startWeek: '2026-07-27', startedAt: '2026-07-27',
        tests: [
          { no: 1, kind: 'progress', week: '2026-08-17', status: 'done',
            ratios: { listening: [27, 40], reading: [26, 40], writing: [14, 20] } },
          {
            /*
             * FINAL TEST TRẢI BA TUẦN — cả lớp MB FOU 12 thi như nhau.
             * L và R tuần 14–20/9, Writing tuần 21–27/9, Speaking tuần 28/9–4/10.
             * Hạn chấm của lớp Normal là hết CHỦ NHẬT của chính tuần thi môn đó, nên ba
             * môn có ba hạn khác nhau và môn chưa tới tuần thì chưa nợ ai cái gì.
             * Vẫn là MỘT bài Final Test, vẫn phải đủ bốn môn mới hoàn tất.
             */
            no: 2, kind: 'final', week: '2026-09-14', status: 'planned',
            skillWeeks: { writing: '2026-09-21', speaking: '2026-09-28' },
          },
        ],
      },
    ],
  },

  {
    code: 'S05', name: 'Dương Ngọc Ánh', branch: 'MB', dob: '2011-03-14',
    story: 'Lớp Normal: hai môn dưới ngưỡng ở Progress Test → SOS 2. Case Listening đã có phương '
      + 'án, case Reading thì CHƯA CÓ AI NHẬN — và đó chính là một việc cần làm.',
    enrollments: [{ class: 'MB FOU 12', from: '2026-07-27', status: 'active' }],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'MB FOU 12', status: 'active',
        startWeek: '2026-07-27', startedAt: '2026-07-27',
        tests: [
          { no: 1, kind: 'progress', week: '2026-08-17', status: 'done',
            ratios: { listening: [20, 40], reading: [21, 40], writing: [13, 20], speaking: [16, 25] } },
          {
            /*
             * FINAL TEST TRẢI BA TUẦN — cả lớp MB FOU 12 thi như nhau.
             * L và R tuần 14–20/9, Writing tuần 21–27/9, Speaking tuần 28/9–4/10.
             * Hạn chấm của lớp Normal là hết CHỦ NHẬT của chính tuần thi môn đó, nên ba
             * môn có ba hạn khác nhau và môn chưa tới tuần thì chưa nợ ai cái gì.
             * Vẫn là MỘT bài Final Test, vẫn phải đủ bốn môn mới hoàn tất.
             */
            no: 2, kind: 'final', week: '2026-09-14', status: 'planned',
            skillWeeks: { writing: '2026-09-21', speaking: '2026-09-28' },
          },
        ],
        cases: [
          {
            topic: 'listening', fromTest: 1, sosLevel: 2, detectedAt: '2026-08-23',
            primaryCode: 'student.listening.sound',
            summary: 'Em chưa quen tốc độ nói của bài nghe.',
            status: 'in_progress', owner: 'T_HA',
            plans: [
              {
                kind: 'self_study', description: 'Nghe lại bài trên lớp ở tốc độ 0.8 rồi 1.0',
                performer: 'T_HA', cycleStart: '2026-08-24', status: 'started',
                startedOn: '2026-08-24', followupDue: '2026-09-14',
              },
            ],
          },
          {
            /*
             * CHƯA CÓ NGƯỜI PHỤ TRÁCH, nhưng câu tóm tắt vẫn CÓ NGƯỜI ĐỨNG TÊN.
             * Hai vai khác nhau: cô Hà là người ghi nhận, còn ai điều phối case thì chưa ai nhận.
             */
            topic: 'reading', fromTest: 1, sosLevel: 2, detectedAt: '2026-08-23',
            primaryCode: 'student.reading.language',
            summary: 'Vốn từ còn hẹp nên đọc chậm.',
            reportedBy: 'T_HA',
            status: 'open',
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════ BC FT 205 · Bãi Cháy · Fast Track LT2
     MT1 13/07 đã xong · MT2 07/09 (TUẦN TRƯỚC) chưa có điểm → quá hạn nhập */

  {
    code: 'J07', name: 'Phan Minh Tú', branch: 'BC', dob: '2008-07-08',
    story: 'Quy trình duyệt: một đề xuất đang chờ Quản lý trả lời, và một đề xuất trước đó đã bị '
      + 'từ chối kèm lý do rồi được sửa lại. Chu kỳ thực hiện chỉ chạy TỪ LÚC được duyệt.',
    enrollments: [{ class: 'BC FT 205', from: '2026-06-08', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT2', target: 6.5, classCode: 'BC FT 205', status: 'active',
        startWeek: '2026-06-08', startedAt: '2026-06-08',
        examMonth: '2027-02', examWeek: null,
        baseline: { score: 5.0, source: 'entrance' },
        tests: [
          {
            /* Kỳ vọng 5.5. Speaking 5.0 và Writing gộp (5.0+10)/3 = 5.0 đều dưới → SOS 2. */
            no: 1, kind: 'mock', week: '2026-07-13', status: 'done',
            bands: { listening: 6.0, reading: 5.5, writing1: 5.0, writing2: 5.0, speaking: 5.0 },
          },
          {
            /*
             * MT2 của tuần trước, chưa ai nhập điểm. Quản lý đã GIA HẠN nhập điểm tới 18/09
             * vì giáo viên Speaking nghỉ ốm — hạn tự đặt này thay hạn mặc định, và chỉ có
             * MỘT hạn có hiệu lực chứ không phải hai.
             */
            no: 2, kind: 'mock', week: '2026-09-07', status: 'planned',
            deadlineOverride: {
              date: '2026-09-18', by: 'MGR_BC',
              reason: 'Giáo viên Speaking nghỉ ốm hai buổi, gia hạn nhập điểm tới hết thứ Sáu.',
            },
          },
        ],
        cases: [
          {
            /*
             * CASE CỦA RIÊNG WRITING TASK 1.
             *
             * MT1 của em có band Writing gộp 5.0, dưới kỳ vọng 5.5, và cả W1 lẫn W2 đều dưới.
             * Hai task chấm riêng và thường do hai giáo viên khác nhau dạy, nên tín hiệu của
             * chúng cũng riêng — cô W1 xác minh và mở case cho đúng task mình phụ trách.
             */
            topic: 'writing1', fromTest: 1, sosLevel: 2, detectedAt: '2026-07-19',
            primaryCode: 'student.writing.task',
            title: 'Writing Task 1: đọc sai xu hướng của biểu đồ',
            summary: 'Em tả đủ số liệu nhưng nêu sai xu hướng chính, và thiếu câu tổng quan.',
            status: 'in_progress', owner: 'T_TRANG',
            plans: [
              {
                kind: 'teaching_adjust',
                description: 'Mỗi buổi 10 phút luyện viết câu tổng quan từ một biểu đồ mẫu',
                performer: 'T_TRANG', cycleStart: '2026-07-20', status: 'started',
                startedOn: '2026-07-21', followupDue: '2026-09-21',   // PR-Dọn (10a): hạn PA luôn rơi Thứ Hai
              },
            ],
          },
          {
            topic: 'speaking', fromTest: 1, sosLevel: 2, detectedAt: '2026-07-19',
            primaryCode: 'student.speaking.pronunciation',
            title: 'Speaking phát âm đuôi từ chưa rõ',
            summary: 'Giám khảo khó nghe ở các từ có đuôi -ed và -s.',
            status: 'in_progress', owner: 'T_TRANG',
            plans: [
              {
                /* ĐỀ XUẤT BỊ TỪ CHỐI — có lý do, và người đề xuất sửa lại. */
                kind: 'extra_support', description: 'Xin 8 buổi tutor Speaking 1-1 ngoài định mức',
                performer: 'T_TRANG', cycleStart: '2026-07-20', status: 'cancelled',
                approval: {
                  state: 'declined', due: '2026-07-27', on: '2026-07-24', by: 'MGR_BC',
                  note: 'Tám buổi vượt định mức quý này. Đề xuất lại ở mức 4 buổi, hoặc ghép nhóm hai em.',
                },
              },
              {
                /* ĐỀ XUẤT SỬA LẠI — được duyệt, chu kỳ chạy TỪ ngày duyệt. */
                kind: 'extra_support', description: 'Tutor Speaking 4 buổi, ghép nhóm hai em',
                performer: 'T_TRANG', cycleNo: 2, cycleStart: '2026-07-28', status: 'completed',
                approval: { state: 'approved', due: '2026-08-04', on: '2026-07-28', by: 'MGR_BC' },
                startedOn: '2026-07-30', completedOn: '2026-08-20', followupDue: '2026-08-31',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-31', outcome: 'partial', nextStep: 'ask_manager',
                  note: 'Đuôi -s đã rõ hơn, -ed vẫn nuốt. Tự mình không quyết được việc chuyển lớp, '
                    + 'xin ý kiến Quản lý.',
                  /* Điểm cô TỰ CHẤM, KHÔNG phải điểm chính thức và không đổi mức SOS. */
                  metrics: [{ skill: 'speaking', score: 55, total: 100 }],
                }],
              },
              {
                /* ĐANG CHỜ QUẢN LÝ DUYỆT — bên kia không đi tiếp được cho tới khi có trả lời. */
                kind: 'teacher_change_request', description: 'Xin chuyển em sang lớp Speaking nhỏ hơn',
                performer: 'T_TRANG', cycleNo: 3, cycleStart: '2026-09-01', status: 'planned',
                approval: { state: 'pending', due: '2026-09-08' },
              },
            ],
          },
        ],
      },
    ],
  },

  {
    code: 'J11', name: 'Đặng Thu Vân', branch: 'BC', dob: '2009-04-02',
    story: 'Ý thức: ba vi phạm chuyên cần tháng 8 đã được xử lý bằng hai biện pháp (meeting với em, report cho gia đình), '
      + 'rồi một vi phạm mới ngày 06/09 chưa ai xử lý — cảnh báo 8 ngày hiện ở tab Ý thức của lớp. Học thuật chưa có case.',
    enrollments: [{ class: 'BC FT 205', from: '2026-06-08', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT2', target: 6.0, classCode: 'BC FT 205', status: 'active',
        startWeek: '2026-06-08', startedAt: '2026-06-08',
        examMonth: '2027-01', examWeek: '2027-01-18',
        baseline: { score: 4.5, source: 'entrance' },
        tests: [
          { no: 1, kind: 'mock', week: '2026-07-13', status: 'done',
            bands: { listening: 5.5, reading: 5.5, writing1: 5.0, writing2: 5.5, speaking: 5.5 } },
          { no: 2, kind: 'mock', week: '2026-09-07', status: 'planned' },
        ],
      },
    ],
  },

  {
    code: 'S06', name: 'Trương Gia Huy', branch: 'BC', dob: '2008-12-25',
    story: 'Ổn định, không case. Ở lớp này em vẫn nằm trong nhóm chờ nhập điểm MT2 quá hạn.',
    enrollments: [{ class: 'BC FT 205', from: '2026-06-08', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT2', target: 6.0, classCode: 'BC FT 205', status: 'active',
        startWeek: '2026-06-08', startedAt: '2026-06-08',
        examMonth: '2027-01', examWeek: null,
        baseline: { score: 5.0, source: 'entrance' },
        tests: [
          { no: 1, kind: 'mock', week: '2026-07-13', status: 'done',
            bands: { listening: 5.5, reading: 6.0, writing1: 5.5, writing2: 5.5, speaking: 5.5 } },
          { no: 2, kind: 'mock', week: '2026-09-07', status: 'planned' },
        ],
      },
    ],
  },

  {
    code: 'S07', name: 'Mai Ngọc Diệp', branch: 'BC', dob: '2009-10-11',
    story: 'Đang được hỗ trợ ĐÚNG HẠN — hẹn xem lại ngày 21/09, chưa tới hạn nên không phải việc gấp.',
    enrollments: [{ class: 'BC FT 205', from: '2026-06-08', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT2', target: 6.5, classCode: 'BC FT 205', status: 'active',
        startWeek: '2026-06-08', startedAt: '2026-06-08',
        examMonth: '2027-03', examWeek: null,
        baseline: { score: 5.0, source: 'entrance' },
        tests: [
          {
            /* Kỳ vọng 5.5 — Reading 5.0 dưới kỳ vọng → SOS 1. */
            no: 1, kind: 'mock', week: '2026-07-13', status: 'done',
            bands: { listening: 6.0, reading: 5.0, writing1: 5.5, writing2: 6.0, speaking: 6.0 },
          },
          {
            /*
             * MT2 TUẦN TRƯỚC, ĐÃ CÓ ĐIỂM, MÀ CHƯA AI XÁC MINH TÍN HIỆU.
             *
             * Kỳ vọng MT2 = 6.0. Speaking 5.5 dưới kỳ vọng nên sinh một tín hiệu cho cô
             * Speaking từ 07/09, hạn xác minh 09/09 — nay đã quá hạn. Đây là ca QUÁ HẠN XÁC
             * MINH có chủ đích của bộ demo: bản demo phải có cả trường hợp chưa ai xem, nếu
             * không thì hàng việc mới của mục 6.2 nhìn lúc nào cũng trống.
             *
             * Reading đã đạt lại ở lượt này, nên case Reading đang mở nhận một mốc "đã đạt
             * kỳ vọng" và mức hạ về 0 — nhưng KHÔNG tự đóng.
             */
            no: 2, kind: 'mock', week: '2026-09-07', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 5.5 },
            enteredOn: '2026-09-07',
          },
        ],
        cases: [
          {
            /*
             * MỞ THEO YÊU CẦU QUẢN LÝ: Quản lý giao việc cho cả lớp, case sinh ra đã CÓ SẴN
             * phương án (chính là việc được giao) nên nó vào thẳng "đang xử lý" — không bao
             * giờ bị đếm vào nhóm "chưa có phương án".
             */
            topic: 'reading', fromTest: 1, sosLevel: 1, detectedAt: '2026-07-19',
            primaryCode: 'student.reading.logic',
            originKind: 'manager_task',
            summary: 'Em bỏ trống phần True/False/Not Given.',
            status: 'in_progress', owner: 'T_QUAN',
            plans: [
              {
                kind: 'self_study', description: 'Bộ 30 câu True/False/Not Given, chữa hằng tuần',
                performer: 'T_QUAN', cycleStart: '2026-08-31', status: 'started',
                startedOn: '2026-09-01', followupDue: '2026-09-21',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    code: 'S08', name: 'Cao Hải Sơn', branch: 'BC', dob: '2008-03-09',
    story: 'Một trong số ít case QUÁ HẠN thật: hẹn xem lại 31/08 mà tới 14/09 vẫn chưa ai cập nhật.',
    enrollments: [{ class: 'BC FT 205', from: '2026-06-08', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT2', target: 6.5, classCode: 'BC FT 205', status: 'active',
        startWeek: '2026-06-08', startedAt: '2026-06-08',
        examMonth: '2027-04', examWeek: null,
        baseline: { score: 4.5, source: 'entrance' },
        tests: [
          {
            /* Kỳ vọng 5.5. L 5.0, R 5.0, Writing gộp 5.0 → ba kỹ năng dưới kỳ vọng → SOS 3. */
            no: 1, kind: 'mock', week: '2026-07-13', status: 'done',
            bands: { listening: 5.0, reading: 5.0, writing1: 5.0, writing2: 5.0, speaking: 5.5 },
          },
          { no: 2, kind: 'mock', week: '2026-09-07', status: 'planned' },
        ],
        cases: [
          {
            topic: 'listening', fromTest: 1, sosLevel: 3, detectedAt: '2026-07-19',
            primaryCode: 'student.listening.sound',
            summary: 'Nghe không kịp, mất điểm đều ở cả bốn section.',
            status: 'in_progress', owner: 'T_QUAN',
            plans: [
              {
                kind: 'tutor', description: 'Tutor Listening hai buổi/tuần',
                performer: 'T_QUAN', cycleStart: '2026-07-20', status: 'started',
                startedOn: '2026-07-22', followupDue: '2026-08-31',
              },
            ],
          },
          {
            topic: 'reading', fromTest: 1, sosLevel: 3, detectedAt: '2026-07-19',
            primaryCode: 'student.reading.time',
            summary: 'Đọc chậm, chưa hết bài đã hết giờ.',
            status: 'open', owner: 'T_QUAN',
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════ BC ELE 01 · Bãi Cháy · Elementary
     Tuần 5/10 — Progress Test đúng tuần này, chưa có điểm */

  {
    code: 'S09', name: 'Nguyễn Hà My', branch: 'BC', dob: '2011-06-30',
    story: 'Lớp Normal mới học được 5 tuần, Progress Test đúng tuần này. Chưa có kết quả nào — '
      + '"chưa đủ dữ liệu" là một trạng thái hợp lệ, không phải lỗi.',
    enrollments: [{ class: 'BC ELE 01', from: '2026-08-17', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'BC ELE 01', status: 'active',
      startWeek: '2026-08-17', startedAt: '2026-08-17',
      tests: [
        { no: 1, kind: 'progress', week: '2026-09-14', status: 'planned' },
        { no: 2, kind: 'final', week: '2026-10-19', status: 'planned' },
      ],
    }],
  },
  {
    code: 'S10', name: 'Trần Bảo Long', branch: 'BC', dob: '2011-09-21',
    story: 'Cùng lớp với S09 — lớp mới, chưa có kết quả.',
    enrollments: [{ class: 'BC ELE 01', from: '2026-08-17', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'BC ELE 01', status: 'active',
      startWeek: '2026-08-17', startedAt: '2026-08-17',
      tests: [
        { no: 1, kind: 'progress', week: '2026-09-14', status: 'planned' },
        { no: 2, kind: 'final', week: '2026-10-19', status: 'planned' },
      ],
    }],
  },
  {
    code: 'S11', name: 'Lê Thu Thảo', branch: 'BC', dob: null,
    story: 'Cùng lớp với S09. Em này CHƯA CÓ NGÀY SINH — thiếu thông tin hành chính, nhưng nó '
      + 'KHÔNG cản trở buổi dạy nào nên không lên badge cảnh báo học thuật.',
    enrollments: [{ class: 'BC ELE 01', from: '2026-08-17', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'BC ELE 01', status: 'active',
      startWeek: '2026-08-17', startedAt: '2026-08-17',
      tests: [
        { no: 1, kind: 'progress', week: '2026-09-14', status: 'planned' },
        { no: 2, kind: 'final', week: '2026-10-19', status: 'planned' },
      ],
    }],
  },

  /* ═══════════════════════════════════════════════ CP FT 110 · Cẩm Phả · Fast Track LT1
     MT1 18/05 · MT2 29/06 · MT3 17/08 · MT4 28/09 (kế hoạch) */

  {
    code: 'J04', name: 'Hồ Thanh Tùng', branch: 'CP', dob: '2008-06-14',
    story: 'Case TÁI DIỄN: Reading từng có một case đã chốt xong ở MT1, tới MT3 lại yếu → mở case '
      + 'MỚI nối vào case cũ. Case cũ giữ nguyên kết quả của nó, không bị viết lại.',
    enrollments: [{ class: 'CP FT 110', from: '2026-04-13', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 6.5, classCode: 'CP FT 110', status: 'active',
        startWeek: '2026-04-13', startedAt: '2026-04-13',
        examMonth: '2026-12', examWeek: '2026-12-14',
        baseline: { score: 5.0, source: 'entrance' },
        tests: [
          {
            /* Kỳ vọng 5.5 — Reading 5.0 dưới kỳ vọng. */
            no: 1, kind: 'mock', week: '2026-05-18', status: 'done',
            bands: { listening: 5.5, reading: 5.0, writing1: 5.5, writing2: 5.5, speaking: 5.5 },
          },
          {
            /* Kỳ vọng 6.0 — đạt hết, case Reading đóng lại. */
            no: 2, kind: 'mock', week: '2026-06-29', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 },
          },
          {
            /* Kỳ vọng 6.5 — Reading tụt còn 5.5: TÁI DIỄN, mở case mới nối vào case cũ. */
            no: 3, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 6.5, reading: 5.5, writing1: 6.5, writing2: 6.5, speaking: 6.5 },
          },
          { no: 4, kind: 'mock', week: '2026-09-28', status: 'planned' },
        ],
        cases: [
          {
            topic: 'reading', fromTest: 1, sosLevel: 1, detectedAt: '2026-05-24',
            primaryCode: 'student.reading.technique',
            title: 'Reading MT1 dưới kỳ vọng',
            summary: 'Em chưa quen dạng bài True/False/Not Given.',
            status: 'done', owner: 'T_NAM', disposition: 'action', outcome: 'improved',
            outcomeNote: 'MT2 Reading 6.0, đạt kỳ vọng. Khép lại.',
            closedOn: '2026-07-06', closedBy: 'T_NAM',
            plans: [
              {
                kind: 'self_study', description: 'Bộ bài True/False/Not Given, chữa hằng tuần',
                performer: 'T_NAM', cycleStart: '2026-05-25', status: 'completed',
                startedOn: '2026-05-26', completedOn: '2026-06-22', followupDue: '2026-07-06',
                closedReason: 'done',
                followups: [{
                  on: '2026-07-06', outcome: 'improved', nextStep: 'complete',
                  note: 'MT2 Reading 6.0. Em làm đúng dạng bài này rồi.',
                }],
              },
            ],
          },
          {
            topic: 'reading', fromTest: 3, sosLevel: 1, detectedAt: '2026-08-23',
            primaryCode: 'student.reading.technique',
            title: 'Reading tái diễn ở MT3',
            summary: 'Lần này mất điểm ở dạng matching information, không phải dạng cũ.',
            status: 'in_progress', owner: 'T_NAM', linksPreviousOf: 'reading',
            plans: [
              {
                /*
                 * ĐƯỢC DUYỆT NGÀY 31/08 — chu kỳ chạy TỪ NGÀY DUYỆT, không từ ngày đề xuất.
                 * Thời gian Quản lý cầm hồ sơ là thời gian của Quản lý.
                 */
                kind: 'tutor', description: 'Tutor Reading, tập trung matching information',
                performer: 'T_NAM', cycleStart: '2026-08-24', status: 'started',
                approval: { state: 'approved', due: '2026-09-07', on: '2026-08-31', by: 'MGR_CP' },
                startedOn: '2026-09-01',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    code: 'J05', name: 'Đinh Ngọc Quyên', branch: 'CP', dob: '2009-02-28',
    story: 'HAI case Writing Task 2 mở SONG SONG có chủ ý: một case về bố cục bài, một case về '
      + 'vốn từ học thuật. Mỗi case có tên riêng, phương án riêng, và cả hai đều mở ra được.',
    enrollments: [{ class: 'CP FT 110', from: '2026-04-13', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 7.0, classCode: 'CP FT 110', status: 'active',
        startWeek: '2026-04-13', startedAt: '2026-04-13',
        examMonth: '2027-01', examWeek: null,
        baseline: { score: 5.5, source: 'entrance' },
        tests: [
          { no: 1, kind: 'mock', week: '2026-05-18', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 } },
          {
            /* Kỳ vọng 6.5. Writing gộp (5.5+11)/3 = 5.5 → dưới; W1 và W2 đều dưới → hai ô. */
            no: 2, kind: 'mock', week: '2026-06-29', status: 'done',
            bands: { listening: 6.5, reading: 6.5, writing1: 5.5, writing2: 5.5, speaking: 6.5 },
          },
          {
            /* Kỳ vọng 7.0. Writing gộp (6+13)/3 = 6.5 → vẫn dưới kỳ vọng 7.0. */
            no: 3, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 7.0, reading: 7.0, writing1: 6.0, writing2: 6.5, speaking: 7.0 },
          },
          { no: 4, kind: 'mock', week: '2026-09-28', status: 'planned' },
        ],
        cases: [
          {
            topic: 'writing2', fromTest: 2, sosLevel: 1, detectedAt: '2026-07-05',
            primaryCode: 'student.writing.organisation',
            title: 'Task 2: bố cục bài chưa rõ',
            summary: 'Hai thân bài nói chồng ý nhau, kết luận nhắc lại đề.',
            status: 'in_progress', owner: 'T_DUNG', repeatsAt: [3],
            plans: [
              {
                kind: 'teaching_adjust', description: 'Bắt lập dàn ý trước khi viết, cô duyệt dàn ý',
                performer: 'T_DUNG', cycleStart: '2026-07-06', status: 'started',
                startedOn: '2026-07-08', followupDue: '2026-09-21',
              },
              {
                /* ĐANG CHỜ QUẢN LÝ CẨM PHẢ TRẢ LỜI — chu kỳ thực hiện chưa chạy. */
                kind: 'extra_support', description: 'Xin thêm hai buổi chữa bài Writing ngoài định mức',
                performer: 'T_DUNG', cycleNo: 2, cycleStart: '2026-09-07', status: 'planned',
                approval: { state: 'pending', due: '2026-09-14' },
              },
            ],
          },
          {
            topic: 'writing2', fromTest: 2, sosLevel: 1, detectedAt: '2026-07-05',
            primaryCode: 'student.writing.lexical',
            title: 'Task 2: vốn từ học thuật còn hẹp',
            summary: 'Em lặp lại đúng những từ trong đề, chưa paraphrase được.',
            status: 'in_progress', owner: 'T_DUNG', parallel: true,
            plans: [
              {
                kind: 'self_study', description: 'Mỗi tuần 20 cụm từ theo chủ đề, dùng lại trong bài',
                performer: 'T_DUNG', cycleStart: '2026-07-06', status: 'completed',
                startedOn: '2026-07-08', completedOn: '2026-08-10', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-24', outcome: 'partial', nextStep: 'monitor',
                  note: 'MT3 Task 2 lên 6.5, dùng được một số cụm mới. Chưa chạm 7.0.',
                }],
              },
            ],
          },
        ],
      },
    ],
  },

  {
    code: 'J06', name: 'Lý Tuấn Bình', branch: 'CP', dob: '2008-10-04',
    story: 'THAY PHƯƠNG ÁN: cách đầu tiên không ăn thua, giáo viên xem lại nhận định rồi đổi sang '
      + 'cách khác. Phương án cũ khép với lý do "Được thay thế" — KHÔNG phải một thành công.',
    enrollments: [{ class: 'CP FT 110', from: '2026-04-13', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 6.0, classCode: 'CP FT 110', status: 'active',
        startWeek: '2026-04-13', startedAt: '2026-04-13',
        examMonth: '2026-11', examWeek: '2026-11-09',
        baseline: { score: 4.5, source: 'entrance' },
        tests: [
          {
            /* Kỳ vọng 5.0 — Listening 4.5 dưới kỳ vọng. */
            no: 1, kind: 'mock', week: '2026-05-18', status: 'done',
            bands: { listening: 4.5, reading: 5.0, writing1: 5.0, writing2: 5.0, speaking: 5.5 },
          },
          {
            /* Kỳ vọng 5.5 — Listening 5.0, vẫn dưới. Phương án đầu không ăn thua. */
            no: 2, kind: 'mock', week: '2026-06-29', status: 'done',
            bands: { listening: 5.0, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 6.0 },
          },
          {
            /* Kỳ vọng 6.0 — Listening 6.0, đạt. Phương án thay thế có hiệu quả. */
            no: 3, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 },
          },
          { no: 4, kind: 'mock', week: '2026-09-28', status: 'planned' },
        ],
        cases: [
          {
            topic: 'listening', fromTest: 1, sosLevel: 1, detectedAt: '2026-05-24',
            primaryCode: 'student.listening.sound',
            title: 'Listening không theo kịp bài',
            summary: 'Ban đầu nhận định là em thiếu từ vựng.',
            status: 'done', owner: 'T_NAM', disposition: 'action', outcome: 'improved',
            outcomeNote: 'Nhận định ban đầu sai: vấn đề là em không quen giọng, không phải thiếu từ. '
              + 'Sau khi đổi cách luyện, MT3 Listening đạt 6.0.',
            closedOn: '2026-08-24', closedBy: 'T_NAM',
            repeatsAt: [2],
            plans: [
              {
                /* PHƯƠNG ÁN BỊ THAY THẾ — không ăn thua, và không được đếm là thành công. */
                kind: 'self_study', description: 'Học 30 từ vựng theo chủ đề mỗi tuần',
                performer: 'T_NAM', cycleStart: '2026-05-25', status: 'completed',
                startedOn: '2026-05-26', completedOn: '2026-07-06', followupDue: '2026-07-06',
                closedReason: 'superseded',
                followups: [{
                  on: '2026-07-06', outcome: 'unchanged', nextStep: 'propose',
                  note: 'MT2 Listening vẫn 5.0. Nghe lại bài của em thì thấy em biết từ nhưng '
                    + 'không nhận ra khi người nói nối âm — vấn đề là giọng, không phải từ vựng.',
                }],
              },
              {
                kind: 'tutor', description: 'Luyện nghe nối âm và rút gọn, giọng Anh-Úc',
                performer: 'T_NAM', cycleNo: 2, cycleStart: '2026-07-06', status: 'completed',
                startedOn: '2026-07-08', completedOn: '2026-08-12', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-24', outcome: 'improved', nextStep: 'complete',
                  note: 'MT3 Listening 6.0, đạt kỳ vọng. Đúng hướng.',
                }],
              },
            ],
          },
        ],
      },
    ],
  },

  {
    code: 'S12', name: 'Ngô Hải Yến', branch: 'CP', dob: '2009-07-19',
    story: 'Tiến bộ đều qua ba lượt MT, học thuật chưa từng có case. Nhưng chuyện BTVN thì có: hai giáo viên khác nhau '
      + '(cô Reading và cô Listening) cùng ghi vi phạm BTVN của em — hai dòng độc lập, không gộp, không có "đợt" nào.',
    enrollments: [{ class: 'CP FT 110', from: '2026-04-13', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 6.5, classCode: 'CP FT 110', status: 'active',
        startWeek: '2026-04-13', startedAt: '2026-04-13',
        examMonth: '2026-12', examWeek: '2026-12-14',
        baseline: { score: 5.0, source: 'entrance' },
        tests: [
          { no: 1, kind: 'mock', week: '2026-05-18', status: 'done',
            bands: { listening: 5.5, reading: 6.0, writing1: 5.5, writing2: 5.5, speaking: 6.0 } },
          { no: 2, kind: 'mock', week: '2026-06-29', status: 'done',
            bands: { listening: 6.0, reading: 6.5, writing1: 6.0, writing2: 6.0, speaking: 6.0 } },
          { no: 3, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 6.5, reading: 7.0, writing1: 6.5, writing2: 6.5, speaking: 6.5 } },
          { no: 4, kind: 'mock', week: '2026-09-28', status: 'planned' },
        ],
      },
    ],
  },

  {
    code: 'S13', name: 'Bùi Thu Ninh', branch: 'CP', dob: '2008-05-23',
    story: 'Case Speaking đang mở mà CHƯA CÓ AI NHẬN điều phối — một dòng việc riêng ở Toàn cảnh. '
      + 'Cũng là em có Writing Task 1 thấp hơn Task 2 nhưng band Writing gộp vẫn ĐẠT, nên KHÔNG '
      + 'sinh case Writing nào.',
    enrollments: [{ class: 'CP FT 110', from: '2026-04-13', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 6.0, classCode: 'CP FT 110', status: 'active',
        startWeek: '2026-04-13', startedAt: '2026-04-13',
        examMonth: '2026-11', examWeek: null,
        baseline: { score: 4.5, source: 'entrance', note: 'Bài đầu vào chỉ chấm Writing gộp, không tách Task 1/2.' },
        tests: [
          { no: 1, kind: 'mock', week: '2026-05-18', status: 'done',
            bands: { listening: 5.0, reading: 5.0, writing1: 5.0, writing2: 5.0, speaking: 5.0 } },
          { no: 2, kind: 'mock', week: '2026-06-29', status: 'done',
            bands: { listening: 5.5, reading: 5.5, writing1: 5.0, writing2: 6.0, speaking: 5.5 } },
          {
            /*
             * Kỳ vọng 6.0. W1 = 5.5 THẤP HƠN kỳ vọng nhưng band Writing gộp = (5.5+12)/3 = 6.0
             * ĐẠT → không sinh case Writing nào. Speaking 5.5 mới là ô dưới kỳ vọng.
             */
            no: 3, kind: 'mock', week: '2026-08-17', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 5.5, writing2: 6.0, speaking: 5.5 },
          },
          { no: 4, kind: 'mock', week: '2026-09-28', status: 'planned' },
        ],
        cases: [
          {
            topic: 'speaking', fromTest: 3, sosLevel: 1, detectedAt: '2026-08-23',
            primaryCode: 'student.speaking.fluency',
            summary: 'Em ngại nói, Part 3 gần như không trả lời được.',
            reportedBy: 'T_NAM',
            status: 'open',
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════ HD FOU 05 · Hải Dương · Foundation
     Đã học hết 8 tuần (kết thúc 26/07). Bốn em đã chuyển sang HD BE 21, hai em chưa. */

  {
    code: 'S14', name: 'Hoàng Tuấn Phong', branch: 'HD', dob: '2011-01-08',
    story: 'Lớp đã hết chương trình mà em CHƯA ĐƯỢC XẾP LỚP TIẾP. Đây là một việc cần xử lý, '
      + 'không phải một sự kiện đã qua.',
    enrollments: [{ class: 'HD FOU 05', from: '2026-06-01', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'HD FOU 05', status: 'active',
      startWeek: '2026-06-01', startedAt: '2026-06-01',
      tests: [
        { no: 1, kind: 'progress', week: '2026-06-22', status: 'done',
          ratios: { listening: [26, 40], reading: [25, 40], writing: [13, 20], speaking: [16, 25] } },
        { no: 2, kind: 'final', week: '2026-07-20', status: 'done',
          ratios: { listening: [29, 40], reading: [28, 40], writing: [15, 20], speaking: [18, 25] } },
      ],
    }],
  },
  {
    code: 'S15', name: 'Đỗ Khánh Chi', branch: 'HD', dob: '2011-04-16',
    story: 'Cũng chưa được xếp lớp tiếp, nhưng kết quả Final Test còn thiếu môn Speaking — '
      + 'hai chuyện khác nhau và bảng phải nói được cả hai.',
    enrollments: [{ class: 'HD FOU 05', from: '2026-06-01', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'HD FOU 05', status: 'active',
      startWeek: '2026-06-01', startedAt: '2026-06-01',
      tests: [
        { no: 1, kind: 'progress', week: '2026-06-22', status: 'done',
          ratios: { listening: [24, 40], reading: [24, 40], writing: [12, 20], speaking: [15, 25] } },
        { no: 2, kind: 'final', week: '2026-07-20', status: 'done',
          ratios: { listening: [26, 40], reading: [25, 40], writing: [13, 20] } },
      ],
    }],
  },

  /* ═══════════════════════════════════════════════ HD BE 21 · Hải Dương · Beginner
     Tuần 7/10. Ba em chuyển lên từ HD FOU 05. */

  {
    code: 'J10', name: 'Phạm Gia Hân', branch: 'HD', dob: '2010-12-02',
    story: 'CHUYỂN LỚP KHI CASE CÒN MỞ: case Writing mở ở lớp Foundation đi theo em sang lớp '
      + 'Beginner cùng một ghi chú bàn giao. Lịch sử nơi phát sinh và người làm trước giữ nguyên.',
    enrollments: [
      { class: 'HD FOU 05', from: '2026-06-01', to: '2026-08-03', status: 'transferred',
        handover: 'Case Writing của em đang ở chu kỳ hai, cô Yến đã chữa câu được ba tuần. '
          + 'Nhờ lớp mới giữ nhịp 15 phút chữa bài mỗi buổi.' },
      { class: 'HD BE 21', from: '2026-08-03', status: 'active' },
    ],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'HD FOU 05', status: 'completed',
        startWeek: '2026-06-01', startedAt: '2026-06-01', endedAt: '2026-08-03',
        outcome: 'reached', outcomeNote: 'Hoàn thành Foundation, lên Beginner.',
        tests: [
          { no: 1, kind: 'progress', week: '2026-06-22', status: 'done',
            ratios: { listening: [25, 40], reading: [26, 40], writing: [10, 20], speaking: [16, 25] } },
          { no: 2, kind: 'final', week: '2026-07-20', status: 'done',
            ratios: { listening: [27, 40], reading: [27, 40], writing: [11, 20], speaking: [17, 25] } },
        ],
        cases: [
          {
            topic: 'writing', fromTest: 1, sosLevel: 1, detectedAt: '2026-06-28',
            primaryCode: 'student.writing.grammar',
            title: 'Writing: câu sai ngữ pháp cơ bản',
            summary: 'Em viết được ý nhưng sai thì và sai giới từ gần như mọi câu.',
            status: 'in_progress', owner: 'T_YEN', repeatsAt: [2],
            plans: [
              {
                kind: 'teaching_adjust', description: 'Chữa câu 15 phút cuối mỗi buổi',
                performer: 'T_YEN', cycleStart: '2026-06-29', status: 'completed',
                startedOn: '2026-06-30', completedOn: '2026-07-27', followupDue: '2026-08-03',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-03', outcome: 'partial', nextStep: 'continue',
                  note: 'Final Test Writing 11/20 — có nhích nhưng vẫn dưới ngưỡng. Bàn giao sang lớp Beginner.',
                }],
              },
              {
                kind: 'teaching_adjust', description: 'Giữ nhịp chữa câu ở lớp Beginner',
                performer: 'T_DUNG', cycleNo: 2, cycleStart: '2026-08-03', status: 'started',
                startedOn: '2026-08-05', followupDue: '2026-09-21',
              },
            ],
          },
        ],
      },
      {
        seq: 2, route: null, target: null, classCode: 'HD BE 21', status: 'active',
        startWeek: '2026-08-03', startedAt: '2026-08-03',
        tests: [
          { no: 1, kind: 'progress', week: '2026-08-31', status: 'done',
            ratios: { listening: [27, 40], reading: [26, 40], writing: [13, 20], speaking: [17, 25] } },
          { no: 2, kind: 'final', week: '2026-10-05', status: 'planned' },
        ],
      },
    ],
  },
  {
    code: 'S16', name: 'Nguyễn Bảo Trâm', branch: 'HD', dob: '2010-08-09',
    story: 'Chuyển từ Foundation lên Beginner, không mang theo case nào.',
    enrollments: [
      { class: 'HD FOU 05', from: '2026-06-01', to: '2026-08-03', status: 'transferred' },
      { class: 'HD BE 21', from: '2026-08-03', status: 'active' },
    ],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'HD FOU 05', status: 'completed',
        startWeek: '2026-06-01', startedAt: '2026-06-01', endedAt: '2026-08-03',
        outcome: 'reached',
        tests: [
          { no: 1, kind: 'progress', week: '2026-06-22', status: 'done',
            ratios: { listening: [28, 40], reading: [27, 40], writing: [15, 20], speaking: [18, 25] } },
          { no: 2, kind: 'final', week: '2026-07-20', status: 'done',
            ratios: { listening: [30, 40], reading: [29, 40], writing: [16, 20], speaking: [19, 25] } },
        ],
      },
      {
        seq: 2, route: null, target: null, classCode: 'HD BE 21', status: 'active',
        startWeek: '2026-08-03', startedAt: '2026-08-03',
        tests: [
          { no: 1, kind: 'progress', week: '2026-08-31', status: 'done',
            ratios: { listening: [29, 40], reading: [28, 40], writing: [15, 20], speaking: [18, 25] } },
          { no: 2, kind: 'final', week: '2026-10-05', status: 'planned' },
        ],
      },
    ],
  },
  {
    code: 'S17', name: 'Lê Minh Phúc', branch: 'HD', dob: '2010-10-25',
    story: 'Lớp Beginner: Progress Test tuần 5 trượt Reading → case đang được hỗ trợ đúng hạn.',
    enrollments: [
      { class: 'HD FOU 05', from: '2026-06-01', to: '2026-08-03', status: 'transferred' },
      { class: 'HD BE 21', from: '2026-08-03', status: 'active' },
    ],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'HD FOU 05', status: 'completed',
        startWeek: '2026-06-01', startedAt: '2026-06-01', endedAt: '2026-08-03',
        outcome: 'reached',
        tests: [
          { no: 1, kind: 'progress', week: '2026-06-22', status: 'done',
            ratios: { listening: [26, 40], reading: [24, 40], writing: [13, 20], speaking: [16, 25] } },
          { no: 2, kind: 'final', week: '2026-07-20', status: 'done',
            ratios: { listening: [27, 40], reading: [25, 40], writing: [14, 20], speaking: [17, 25] } },
        ],
      },
      {
        seq: 2, route: null, target: null, classCode: 'HD BE 21', status: 'active',
        startWeek: '2026-08-03', startedAt: '2026-08-03',
        tests: [
          { no: 1, kind: 'progress', week: '2026-08-31', status: 'done',
            ratios: { listening: [26, 40], reading: [21, 40], writing: [13, 20], speaking: [16, 25] } },
          { no: 2, kind: 'final', week: '2026-10-05', status: 'planned' },
        ],
        cases: [
          {
            topic: 'reading', fromTest: 1, sosLevel: 1, detectedAt: '2026-09-06',
            primaryCode: 'student.reading.time',
            summary: 'Em đọc từng chữ nên không kịp hết bài.',
            status: 'in_progress', owner: 'T_YEN',
            plans: [
              {
                kind: 'teaching_adjust', description: 'Bấm giờ từng đoạn, tập đọc lướt tìm ý chính',
                performer: 'T_YEN', cycleStart: '2026-09-07', status: 'started',
                startedOn: '2026-09-08', followupDue: '2026-09-21',
              },
            ],
          },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════ HD FT 302 · Hải Dương · Fast Track LT1
     Lớp mới mở, MT1 rơi đúng tuần này. Thiếu GV W1 và W2. */

  {
    code: 'J09', name: 'Trần Hải Kiên', branch: 'HD', dob: '2009-03-12',
    story: 'Lộ trình MỚI, CHƯA có kết quả MT nào — nên em KHÔNG có mức SOS hiện tại. Nhưng em '
      + 'vẫn mang theo một case từ chương trình Beginner cũ, và case đó phải nhìn thấy được '
      + 'như một việc bàn giao chứ không bị đọc thành SOS của lộ trình mới.',
    enrollments: [
      { class: 'HD BE 21', from: '2026-08-03', to: '2026-08-10', status: 'transferred',
        handover: 'Em chuyển lên Fast Track sớm. Case Speaking còn dở, nhờ cô Yến theo tiếp.' },
      { class: 'HD FT 302', from: '2026-08-10', status: 'active' },
    ],
    cycles: [
      {
        seq: 1, route: null, target: null, classCode: 'HD BE 21', status: 'completed',
        startWeek: '2026-08-03', startedAt: '2026-08-03', endedAt: '2026-08-10',
        outcome: 'unknown', outcomeNote: 'Chuyển lên Fast Track trước khi hết chương trình Beginner.',
        tests: [],
        cases: [
          {
            topic: 'speaking', originKind: 'teacher_report',
            primaryCode: 'student.speaking.fluency',
            title: 'Gần như không nói trong giờ Speaking',
            summary: 'Ba buổi liền em chỉ trả lời một câu rồi im.',
            detectedAt: '2026-08-05', urgency: 'attention',
            status: 'in_progress', owner: 'T_YEN', reportedBy: 'T_YEN',
            plans: [
              {
                kind: 'teaching_adjust', description: 'Gặp riêng em, tìm hiểu vì sao ngại nói',
                performer: 'T_YEN', cycleStart: '2026-08-05', status: 'completed',
                startedOn: '2026-08-06', completedOn: '2026-08-06', followupDue: '2026-08-31',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-31', outcome: 'partial', nextStep: 'monitor',
                  note: 'Em nói sợ phát âm sai bị cười. Đã đổi sang cho em nói theo cặp trước. Có nói nhiều hơn.',
                }],
              },
              {
                kind: 'teaching_adjust', description: 'Cho nói theo cặp trước khi nói trước lớp',
                performer: 'T_YEN', cycleNo: 2, cycleStart: '2026-08-31', status: 'started',
                startedOn: '2026-09-01', followupDue: '2026-09-28',
              },
            ],
          },
        ],
      },
      {
        seq: 2, route: 'LT1', target: 6.0, classCode: 'HD FT 302', status: 'active',
        startWeek: '2026-08-10', startedAt: '2026-08-10',
        examMonth: '2027-04', examWeek: null,
        baseline: { score: 4.5, source: 'previous_cycle', note: 'Quy đổi từ kết quả lớp Beginner.' },
        tests: [{ no: 1, kind: 'mock', week: '2026-09-14', status: 'planned' }],
      },
    ],
  },
  {
    code: 'S18', name: 'Đặng Ngọc Lam', branch: 'HD', dob: '2009-05-07',
    story: 'Lớp Fast Track mới mở: chưa có kết quả nào, MT1 đang là kế hoạch của tuần này.',
    enrollments: [{ class: 'HD FT 302', from: '2026-08-10', status: 'active' }],
    cycles: [{
      seq: 1, route: 'LT1', target: 6.5, classCode: 'HD FT 302', status: 'active',
      startWeek: '2026-08-10', startedAt: '2026-08-10',
      examMonth: '2027-05', examWeek: null,
      baseline: { score: 5.0, source: 'entrance' },
      tests: [{ no: 1, kind: 'mock', week: '2026-09-14', status: 'planned' }],
    }],
  },
  {
    code: 'S19', name: 'Ngô Quang Vinh', branch: 'HD', dob: '2008-08-18',
    story: 'Cùng lớp với S18, nhưng CHƯA KHAI tuần bắt đầu học và CHƯA CÓ target — hai thiếu sót '
      + 'thật sự cản trở việc đánh giá, nên chúng lên badge "Thiếu thông tin".',
    enrollments: [{ class: 'HD FT 302', from: '2026-08-10', status: 'active' }],
    cycles: [{
      seq: 1, route: 'LT1', target: null, classCode: 'HD FT 302', status: 'active',
      startWeek: null, startedAt: '2026-08-10',
      examMonth: null, examWeek: null,
      tests: [{ no: 1, kind: 'mock', week: '2026-09-14', status: 'planned' }],
    }],
  },

  /* ═══════════════════════════════════════════════ UB FT 401 · Uông Bí · Fast Track LT2
     MT1 30/03 · MT2 11/05 · MT3 08/06 · MT4 06/07 — lớp gần cuối lộ trình */

  {
    code: 'J12a', name: 'Dương Minh Quân', branch: 'UB', dob: '2007-11-30',
    story: 'ĐÃ THI THẬT VÀ ĐẠT MỤC TIÊU: thi IELTS tháng 8/2026, Overall 7.0 đúng bằng target. '
      + 'Lộ trình khép lại với kết luận "Đạt mục tiêu".',
    enrollments: [{ class: 'UB FT 401', from: '2026-02-23', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT2', target: 7.0, classCode: 'UB FT 401', status: 'completed',
        startWeek: '2026-02-23', startedAt: '2026-02-23', endedAt: '2026-08-24',
        examMonth: '2026-08', examWeek: '2026-08-10',
        baseline: { score: 5.5, source: 'entrance' },
        outcome: 'reached',
        outcomeNote: 'Thi IELTS ngày 15/08/2026, Overall 7.0 (L 7.5 · R 7.5 · W 6.5 · S 6.5). Đạt target.',
        tests: [
          { no: 1, kind: 'mock', week: '2026-03-30', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 } },
          { no: 2, kind: 'mock', week: '2026-05-11', status: 'done',
            bands: { listening: 6.5, reading: 6.5, writing1: 6.5, writing2: 6.5, speaking: 6.5 } },
          { no: 3, kind: 'mock', week: '2026-06-08', status: 'done',
            bands: { listening: 7.0, reading: 7.0, writing1: 6.5, writing2: 7.0, speaking: 7.0 } },
          { no: 4, kind: 'mock', week: '2026-07-06', status: 'done',
            bands: { listening: 7.5, reading: 7.5, writing1: 6.5, writing2: 7.0, speaking: 7.0 } },
        ],
      },
    ],
  },
  {
    code: 'J12b', name: 'Lý Thanh Trúc', branch: 'UB', dob: '2008-02-14',
    story: 'ĐÃ THI THẬT NHƯNG CHƯA ĐẠT: Overall 6.0 so với target 6.5, thiếu ở Writing. Lộ trình '
      + 'khép với kết luận "Chưa đạt mục tiêu" và ghi rõ hướng đi tiếp, không bỏ lửng.',
    enrollments: [{ class: 'UB FT 401', from: '2026-02-23', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT2', target: 6.5, classCode: 'UB FT 401', status: 'completed',
        startWeek: '2026-02-23', startedAt: '2026-02-23', endedAt: '2026-08-24',
        examMonth: '2026-08', examWeek: '2026-08-10',
        baseline: { score: 5.0, source: 'entrance' },
        outcome: 'not_reached',
        outcomeNote: 'Thi IELTS ngày 15/08/2026, Overall 6.0 (L 6.5 · R 6.5 · W 5.5 · S 6.0). '
          + 'Thiếu 0.5 so với target, vướng ở Writing. Đã tư vấn học thêm một lộ trình ngắn '
          + 'tập trung Writing rồi thi lại tháng 12/2026.',
        tests: [
          { no: 1, kind: 'mock', week: '2026-03-30', status: 'done',
            bands: { listening: 5.5, reading: 5.5, writing1: 5.0, writing2: 5.5, speaking: 5.5 } },
          { no: 2, kind: 'mock', week: '2026-05-11', status: 'done',
            bands: { listening: 6.0, reading: 6.0, writing1: 5.0, writing2: 5.5, speaking: 6.0 } },
          {
            /* Kỳ vọng MT3 = 6.5. Writing gộp (5+11)/3 = 5.5 → dưới kỳ vọng. */
            no: 3, kind: 'mock', week: '2026-06-08', status: 'done',
            bands: { listening: 6.5, reading: 6.5, writing1: 5.0, writing2: 5.5, speaking: 6.0 },
          },
          {
            /* Kỳ vọng 6.5. Writing gộp (5.5+11)/3 = 5.5 và Speaking 6.0 đều dưới → SOS 2. */
            no: 4, kind: 'mock', week: '2026-07-06', status: 'done',
            bands: { listening: 6.5, reading: 6.5, writing1: 5.5, writing2: 5.5, speaking: 6.0 },
          },
        ],
        cases: [
          {
            topic: 'writing2', fromTest: 3, sosLevel: 1, detectedAt: '2026-06-14',
            primaryCode: 'student.writing.task',
            title: 'Writing Task 2 không lên được band',
            summary: 'Ý đủ nhưng lập luận chưa triển khai, ví dụ chung chung.',
            status: 'done', owner: 'T_KIEN', repeatsAt: [4],
            disposition: 'action', outcome: 'unchanged',
            outcomeNote: 'Đã hỗ trợ hai chu kỳ, Writing vẫn 5.5 ở kỳ thi thật. Chuyển sang lộ trình '
              + 'ngắn chuyên Writing thay vì tiếp tục ở đây.',
            closedOn: '2026-08-24', closedBy: 'MGR_UB',
            plans: [
              {
                kind: 'tutor', description: 'Tutor Writing Task 2, mỗi tuần một bài có chữa chi tiết',
                performer: 'T_KIEN', cycleStart: '2026-06-15', status: 'completed',
                startedOn: '2026-06-16', completedOn: '2026-07-13', followupDue: '2026-07-20',
                closedReason: 'done',
                followups: [{
                  on: '2026-07-20', outcome: 'unchanged', nextStep: 'continue',
                  note: 'MT4 Task 2 vẫn 5.5. Bài dài hơn nhưng lập luận chưa sâu hơn.',
                }],
              },
              {
                kind: 'self_study', description: 'Đọc bài mẫu band 7 và viết lại một đoạn mỗi ngày',
                performer: 'T_KIEN', cycleNo: 2, cycleStart: '2026-07-20', status: 'completed',
                startedOn: '2026-07-21', completedOn: '2026-08-10', followupDue: '2026-08-24',
                closedReason: 'done',
                followups: [{
                  on: '2026-08-24', outcome: 'insufficient', nextStep: 'complete',
                  note: 'Em đi thi ngay sau đó nên chưa có bài mock nào để so. Không đủ căn cứ kết luận '
                    + 'cách này có tác dụng hay không — ghi đúng như vậy, không suy thành công hay thất bại.',
                }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: 'S20', name: 'Phan Hải Anh', branch: 'UB', dob: '2008-06-21',
    story: 'Ổn định, bốn lượt MT tăng đều, chưa thi thật — dự kiến thi tháng 11 nhưng chưa chốt tuần.',
    enrollments: [{ class: 'UB FT 401', from: '2026-02-23', status: 'active' }],
    cycles: [{
      seq: 1, route: 'LT2', target: 6.5, classCode: 'UB FT 401', status: 'active',
      startWeek: '2026-02-23', startedAt: '2026-02-23',
      examMonth: '2026-11', examWeek: null,
      baseline: { score: 5.0, source: 'entrance' },
      tests: [
        { no: 1, kind: 'mock', week: '2026-03-30', status: 'done',
          bands: { listening: 5.5, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 5.5 } },
        { no: 2, kind: 'mock', week: '2026-05-11', status: 'done',
          bands: { listening: 6.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 } },
        { no: 3, kind: 'mock', week: '2026-06-08', status: 'done',
          bands: { listening: 6.5, reading: 6.5, writing1: 6.5, writing2: 6.5, speaking: 6.5 } },
        { no: 4, kind: 'mock', week: '2026-07-06', status: 'done',
          bands: { listening: 6.5, reading: 7.0, writing1: 6.5, writing2: 6.5, speaking: 6.5 } },
      ],
    }],
  },
  {
    code: 'S21', name: 'Trương Ngọc Bích', branch: 'UB', dob: '2008-09-03',
    story: 'MT4 có một kỹ năng ĐƯỢC ĐÁNH DẤU KHÔNG MOCK (em vắng buổi Speaking có lý do), nên '
      + 'mức SOS tính trên ba kỹ năng còn lại — không đếm kỹ năng vắng thành một môn trượt.',
    enrollments: [{ class: 'UB FT 401', from: '2026-02-23', status: 'active' }],
    cycles: [{
      seq: 1, route: 'LT2', target: 6.0, classCode: 'UB FT 401', status: 'active',
      startWeek: '2026-02-23', startedAt: '2026-02-23',
      examMonth: '2026-12', examWeek: '2026-12-07',
      baseline: { score: 4.5, source: 'entrance' },
      tests: [
        { no: 1, kind: 'mock', week: '2026-03-30', status: 'done',
          bands: { listening: 5.0, reading: 5.0, writing1: 5.0, writing2: 5.0, speaking: 5.0 } },
        { no: 2, kind: 'mock', week: '2026-05-11', status: 'done',
          bands: { listening: 5.5, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 5.5 } },
        { no: 3, kind: 'mock', week: '2026-06-08', status: 'done',
          bands: { listening: 6.0, reading: 6.0, writing1: 5.5, writing2: 6.0, speaking: 6.0 } },
        {
          /* Kỳ vọng 6.0, Speaking không mock. Writing gộp (5.5+11)/3 = 5.5 → SOS 1 trên 3 kỹ năng. */
          no: 4, kind: 'mock', week: '2026-07-06', status: 'done', skip: 'speaking',
          bands: { listening: 6.0, reading: 6.0, writing1: 5.5, writing2: 5.5 },
        },
      ],
      cases: [
        {
          topic: 'writing2', fromTest: 4, sosLevel: 1, detectedAt: '2026-07-12',
          primaryCode: 'student.writing.task',
          summary: 'Task 2 viết chưa đủ 250 từ trong thời gian cho phép.',
          status: 'in_progress', owner: 'T_KIEN',
          plans: [
            {
              kind: 'self_study', description: 'Viết có bấm giờ, mỗi tuần hai bài',
              performer: 'T_KIEN', cycleStart: '2026-08-31', status: 'started',
              startedOn: '2026-09-01', followupDue: '2026-09-28',
            },
          ],
        },
      ],
    }],
  },

  /* ═══════════════════════════════════════════════ UB FOU 07 · Uông Bí · Foundation (mã cũ)
     Đã học hết chương trình (kết thúc 30/08). Thiếu GV Speaking. */

  {
    code: 'S22', name: 'Cao Minh Tuấn', branch: 'UB', dob: '2011-07-12',
    story: 'Lớp mang mã cũ "FOUND" — hệ thống đọc đúng ra chương trình Foundation mà không sửa '
      + 'mã lớp. Lớp đã hết chương trình, em chưa được xếp lớp tiếp.',
    enrollments: [{ class: 'UB FOU 07', from: '2026-07-06', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'UB FOU 07', status: 'active',
      startWeek: '2026-07-06', startedAt: '2026-07-06',
      tests: [
        { no: 1, kind: 'progress', week: '2026-07-27', status: 'done',
          ratios: { listening: [25, 40], reading: [26, 40], writing: [14, 20] } },
        { no: 2, kind: 'final', week: '2026-08-24', status: 'done',
          ratios: { listening: [28, 40], reading: [28, 40], writing: [15, 20] } },
      ],
    }],
  },
  {
    code: 'S23', name: 'Đinh Thu Hương', branch: 'UB', dob: '2011-11-05',
    story: 'Cũng ở lớp đã hết chương trình, và kết quả Final Test có hai môn dưới ngưỡng — cần cân '
      + 'nhắc khi xếp lớp tiếp.',
    enrollments: [{ class: 'UB FOU 07', from: '2026-07-06', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'UB FOU 07', status: 'active',
      startWeek: '2026-07-06', startedAt: '2026-07-06',
      tests: [
        { no: 1, kind: 'progress', week: '2026-07-27', status: 'done',
          ratios: { listening: [22, 40], reading: [23, 40], writing: [12, 20] } },
        { no: 2, kind: 'final', week: '2026-08-24', status: 'done',
          ratios: { listening: [21, 40], reading: [22, 40], writing: [13, 20] } },
      ],
      cases: [
        {
          topic: 'listening', fromTest: 2, sosLevel: 2, detectedAt: '2026-08-30',
          primaryCode: 'student.listening.other',
          summary: 'Final Test vẫn dưới ngưỡng ở cả Listening và Reading.',
          status: 'in_progress', owner: 'T_KIEN',
          plans: [
            {
              kind: 'meeting_cx', description: 'Gặp phụ huynh bàn hướng học lại Foundation hoặc học chậm hơn',
              performer: 'T_KIEN', cycleStart: '2026-08-31', status: 'planned',
              actionDue: '2026-09-08',   // PR-Dọn (10a) → OV-12a: hạn rơi Thứ Ba — vẫn quá hạn như cũ
            },
          ],
        },
      ],
    }],
  },

  /* ═══════════════════════════════════════════════ đã kết thúc học */

  {
    code: 'S24', name: 'Vũ Thu Uyên', branch: 'MB', dob: '2009-12-08',
    status: 'finished', finishedAt: '2026-04-26',
    story: 'ĐÃ KẾT THÚC HỌC. Hồ sơ vẫn tra lại được đầy đủ. Case còn dở của em được HỆ THỐNG tự đóng với lý do '
      + '"Học viên kết thúc khoá" (S16) — xem lại được trong lịch sử, việc đóng không tính là kết quả hỗ trợ.',
    enrollments: [{ class: 'MB BE 08', from: '2026-02-16', to: '2026-04-26', status: 'completed' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'MB BE 08', status: 'completed',
      startWeek: '2026-02-16', startedAt: '2026-02-16', endedAt: '2026-04-26',
      outcome: 'reached', outcomeNote: 'Hoàn thành Beginner rồi chuyển sang trung tâm khác.',
      tests: [
        { no: 1, kind: 'progress', week: '2026-03-16', status: 'done',
          ratios: { listening: [27, 40], reading: [26, 40], writing: [14, 20], speaking: [17, 25] } },
        { no: 2, kind: 'final', week: '2026-04-20', status: 'done',
          ratios: { listening: [29, 40], reading: [22, 40], writing: [15, 20], speaking: [18, 25] } },
      ],
      cases: [
        {
          topic: 'reading', fromTest: 2, sosLevel: 1, detectedAt: '2026-04-26',
          primaryCode: 'student.reading.other',
          summary: 'Reading Final Test còn dưới ngưỡng; em nghỉ học ngay sau đó nên chưa xử lý xong.',
          status: 'in_progress', owner: 'T_KHOA',
        },
      ],
    }],
  },

  /* ═══════════════════════════════════════════════ hai lộ trình Fast Track nối nhau */

  {
    code: 'J13', name: 'Lê Hoàng Sơn', branch: 'UB', dob: '2007-08-05',
    story: 'HAI LỘ TRÌNH FAST TRACK NỐI NHAU: lộ trình 1 target 6.0 đã khép, lộ trình 2 target '
      + '7.0 đánh số MT lại từ MT1. Lộ trình 1 còn có một lượt "học tiếp" ở MT5 — số MT tăng '
      + 'tiếp trong chính lộ trình đó, target giữ nguyên.',
    enrollments: [{ class: 'UB FT 401', from: '2026-02-23', status: 'active' }],
    cycles: [
      {
        seq: 1, route: 'LT1', target: 6.0, classCode: 'UB FT 401', status: 'completed',
        startWeek: '2026-02-23', startedAt: '2026-02-23', endedAt: '2026-06-22',
        examMonth: '2026-06', examWeek: '2026-06-15',
        baseline: { score: 4.5, source: 'entrance' },
        outcome: 'reached',
        outcomeNote: 'Thi IELTS ngày 20/06/2026, Overall 6.0. Đạt target của lộ trình 1, '
          + 'em đăng ký học tiếp lộ trình 2 để lên 7.0.',
        tests: [
          { no: 1, kind: 'mock', week: '2026-03-30', status: 'done',
            bands: { listening: 5.0, reading: 5.0, writing1: 5.0, writing2: 5.0, speaking: 5.0 } },
          { no: 2, kind: 'mock', week: '2026-05-11', status: 'done',
            bands: { listening: 5.5, reading: 5.5, writing1: 5.5, writing2: 5.5, speaking: 5.5 } },
          {
            /*
             * HỌC TIẾP TRONG CÙNG LỘ TRÌNH: em xin học thêm hai tháng trước khi thi, nên số
             * MT chạy tiếp lên 5 chứ KHÔNG mở lộ trình mới — target vẫn là 6.0.
             */
            no: 5, kind: 'mock', week: '2026-06-01', status: 'done',
            note: 'Học tiếp lộ trình — em xin thêm hai tháng ôn trước kỳ thi.',
            bands: { listening: 6.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 },
          },
        ],
      },
      {
        seq: 2, route: 'LT2', target: 7.0, classCode: 'UB FT 401', status: 'active',
        startWeek: '2026-07-06', startedAt: '2026-07-06',
        examMonth: '2027-02', examWeek: null,
        baseline: { score: 6.0, source: 'previous_cycle', note: 'Kết quả IELTS 6.0 tháng 6/2026.' },
        tests: [
          {
            /* Kỳ vọng MT1 của lộ trình mới = 6.0 — đánh số lại từ 1, không nối tiếp MT5 cũ. */
            no: 1, kind: 'mock', week: '2026-08-10', status: 'done',
            bands: { listening: 6.5, reading: 6.5, writing1: 6.0, writing2: 6.0, speaking: 6.0 },
          },
          { no: 2, kind: 'mock', week: '2026-09-21', status: 'planned' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════ lớp Normal có đủ ba mức SOS */

  {
    code: 'S25', name: 'Trịnh Bảo Khang', branch: 'UB', dob: '2011-09-14',
    story: 'Lớp Normal với BA môn dưới ngưỡng ở bài Final Test → SOS 3. Bộ demo cần đủ cả ba mức '
      + 'SOS ở lớp Normal, không chỉ ở lớp Fast Track.',
    enrollments: [{ class: 'UB FOU 07', from: '2026-07-06', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'UB FOU 07', status: 'active',
      startWeek: '2026-07-06', startedAt: '2026-07-06',
      tests: [
        { no: 1, kind: 'progress', week: '2026-07-27', status: 'done',
          ratios: { listening: [20, 40], reading: [21, 40], writing: [10, 20] } },
        { no: 2, kind: 'final', week: '2026-08-24', status: 'done',
          ratios: { listening: [19, 40], reading: [20, 40], writing: [11, 20] } },
      ],
      cases: [
        {
          topic: 'listening', fromTest: 2, sosLevel: 3, detectedAt: '2026-08-30',
          primaryCode: 'student.listening.other',
          summary: 'Ba môn cùng dưới ngưỡng ở bài Final Test.',
          status: 'in_progress', owner: 'T_KIEN',
          plans: [
            {
              kind: 'meeting_cx', description: 'Gặp phụ huynh bàn phương án học lại Foundation',
              performer: 'T_KIEN', cycleStart: '2026-08-31', status: 'started',
              startedOn: '2026-09-01', followupDue: '2026-09-21',
            },
          ],
        },
      ],
    }],
  },

  /* ═══════════════════════════════════════════════ MB Pre FOU 03 · Monbay · Pre Foundation (PR-MON D12)
     Một ô Tổng hợp, chỉ GVCN · Cuối khoá tuần 14/9 · kết quả là % tổng (MH7) */

  {
    code: 'S26', name: 'Lê Minh Châu', branch: 'MB', dob: '2013-03-11',
    story: 'Pre FOU: Final Test 26/50 = 52% — chưa đạt, hiện "52%" chứ không "SOS".',
    enrollments: [{ class: 'MB Pre FOU 03', from: '2026-08-17', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'MB Pre FOU 03', status: 'active',
      startWeek: '2026-08-17', startedAt: '2026-08-17',
      tests: [
        { no: 1, kind: 'final', week: '2026-09-14', status: 'done',
          ratios: { tong_hop: [26, 50] } },
      ],
    }],
  },
  {
    code: 'S27', name: 'Nguyễn Hải Đăng', branch: 'MB', dob: '2013-06-02',
    story: 'Pre FOU: Final Test 32/50 = 64% — chưa đạt, sát ngưỡng 70%.',
    enrollments: [{ class: 'MB Pre FOU 03', from: '2026-08-17', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'MB Pre FOU 03', status: 'active',
      startWeek: '2026-08-17', startedAt: '2026-08-17',
      tests: [
        { no: 1, kind: 'final', week: '2026-09-14', status: 'done',
          ratios: { tong_hop: [32, 50] } },
      ],
    }],
  },
  {
    code: 'S28', name: 'Phan Thảo Nhi', branch: 'MB', dob: '2013-10-25',
    story: 'Pre FOU: Final Test 39/50 = 78% — đạt.',
    enrollments: [{ class: 'MB Pre FOU 03', from: '2026-08-17', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'MB Pre FOU 03', status: 'active',
      startWeek: '2026-08-17', startedAt: '2026-08-17',
      tests: [
        { no: 1, kind: 'final', week: '2026-09-14', status: 'done',
          ratios: { tong_hop: [39, 50] } },
      ],
    }],
  },
  {
    code: 'S29', name: 'Vũ Đức Anh', branch: 'MB', dob: '2013-01-17',
    story: 'Pre FOU: Final Test chưa nhập điểm — GVCN đang nợ một bài Tổng hợp.',
    enrollments: [{ class: 'MB Pre FOU 03', from: '2026-08-17', status: 'active' }],
    cycles: [{
      seq: 1, route: null, target: null, classCode: 'MB Pre FOU 03', status: 'active',
      startWeek: '2026-08-17', startedAt: '2026-08-17',
      tests: [
        { no: 1, kind: 'final', week: '2026-09-14', status: 'planned' },
      ],
    }],
  },
];
