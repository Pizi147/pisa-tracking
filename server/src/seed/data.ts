/** Dữ liệu tĩnh cho seed. Tất cả tên người và sự kiện đều là GIẢ. */

export const DEMO_DATE = '2026-09-10';
export const WEEKS = 8;

export const BRANCHES = [
  { code: 'CG', name: 'PISA Cầu Giấy', address: 'Quận Cầu Giấy' },
  { code: 'HD', name: 'PISA Hà Đông', address: 'Quận Hà Đông' },
  { code: 'TX', name: 'PISA Thanh Xuân', address: 'Quận Thanh Xuân' },
  { code: 'LB', name: 'PISA Long Biên', address: 'Quận Long Biên' },
  { code: 'VI', name: 'PISA Vinh', address: 'Thành phố Vinh' },
];

export const CLASS_TYPES = [
  { code: 'FT5', name: 'FT 5 buổi/tuần', category: 'FT' },
  { code: 'FT10', name: 'FT 10 buổi/tuần', category: 'FT' },
  { code: 'FT16', name: 'FT 16 buổi/tuần', category: 'FT' },
  { code: 'FOUND', name: 'Foundation', category: 'NORMAL' },
  { code: 'ELEM', name: 'Elementary', category: 'NORMAL' },
  { code: 'PET', name: 'PET', category: 'NORMAL' },
];

/** dueOffsetDays = null nghĩa là mốc KHÔNG có hạn → không bao giờ tự đánh giá chậm. */
export const TEMPLATES = [
  {
    code: 'FT-FLEX', name: 'FT — Lộ trình linh hoạt theo stage', category: 'FT',
    versions: [
      {
        versionNo: 1, notes: 'Bản gốc: stage/milestone không gắn hạn cố định.',
        stages: [
          { stageKey: 'ft-s1', name: 'Stage 1 — Nền tảng & chẩn đoán', kind: 'stage', dueOffsetDays: null },
          { stageKey: 'ft-s2', name: 'Stage 2 — Xây kỹ năng lõi', kind: 'stage', dueOffsetDays: null },
          { stageKey: 'ft-m1', name: 'Mốc — Mock Test lần 1', kind: 'milestone', dueOffsetDays: null },
          { stageKey: 'ft-s3', name: 'Stage 3 — Nâng band theo skill yếu', kind: 'stage', dueOffsetDays: null },
          { stageKey: 'ft-m2', name: 'Mốc — Mock Test lần 2', kind: 'milestone', dueOffsetDays: null },
          { stageKey: 'ft-s4', name: 'Stage 4 — Luyện đề & chiến thuật phòng thi', kind: 'stage', dueOffsetDays: null },
        ],
      },
    ],
  },
  {
    code: 'FT-MILE', name: 'FT — Lộ trình có mốc thời gian', category: 'FT',
    versions: [
      {
        versionNo: 1, notes: 'Có hạn cho từng mốc để theo dõi tiến độ.',
        stages: [
          { stageKey: 'ftm-s1', name: 'Stage 1 — Chẩn đoán đầu vào', kind: 'stage', dueOffsetDays: 14 },
          { stageKey: 'ftm-m1', name: 'Mốc — Hoàn thành khảo sát skill', kind: 'milestone', dueOffsetDays: 21 },
          { stageKey: 'ftm-s2', name: 'Stage 2 — Kỹ năng lõi', kind: 'stage', dueOffsetDays: 49 },
          { stageKey: 'ftm-m2', name: 'Mốc — Mock Test giữa kỳ', kind: 'milestone', dueOffsetDays: 63 },
          { stageKey: 'ftm-s3', name: 'Stage 3 — Luyện đề', kind: 'stage', dueOffsetDays: 98 },
        ],
      },
    ],
  },
  {
    code: 'NM-FOUND', name: 'Foundation', category: 'NORMAL',
    versions: [
      {
        versionNo: 1, notes: 'Chương trình 8 tuần (bản đang áp dụng cho các lớp cũ).',
        stages: Array.from({ length: 8 }, (_, i) => ({
          stageKey: `f1-w${i + 1}`, name: `Tuần ${i + 1}${i === 3 ? ' — Progress Test' : ''}${i === 7 ? ' — Final Test' : ''}`,
          kind: i === 3 || i === 7 ? 'checkpoint' : 'week',
          weekFrom: i + 1, weekTo: i + 1, dueOffsetDays: (i + 1) * 7,
        })),
      },
      {
        versionNo: 2, notes: 'Bản mở rộng 10 tuần, áp dụng cho lớp mở mới.',
        stages: Array.from({ length: 10 }, (_, i) => ({
          stageKey: `f2-w${i + 1}`, name: `Tuần ${i + 1}${i === 4 ? ' — Progress Test' : ''}${i === 9 ? ' — Final Test' : ''}`,
          kind: i === 4 || i === 9 ? 'checkpoint' : 'week',
          weekFrom: i + 1, weekTo: i + 1, dueOffsetDays: (i + 1) * 7,
        })),
      },
    ],
  },
  {
    code: 'NM-ELEM', name: 'Elementary', category: 'NORMAL',
    versions: [
      {
        versionNo: 1, notes: 'Chương trình 12 tuần.',
        stages: Array.from({ length: 12 }, (_, i) => ({
          stageKey: `e1-w${i + 1}`, name: `Tuần ${i + 1}${i === 5 ? ' — Progress Test' : ''}${i === 11 ? ' — Final Test' : ''}`,
          kind: i === 5 || i === 11 ? 'checkpoint' : 'week',
          weekFrom: i + 1, weekTo: i + 1, dueOffsetDays: (i + 1) * 7,
        })),
      },
    ],
  },
  {
    code: 'NM-PET', name: 'PET', category: 'NORMAL',
    versions: [
      {
        versionNo: 1, notes: 'Chương trình PET 10 tuần.',
        stages: Array.from({ length: 10 }, (_, i) => ({
          stageKey: `p1-w${i + 1}`, name: `Tuần ${i + 1}${i === 9 ? ' — Final Test' : ''}`,
          kind: i === 9 ? 'checkpoint' : 'week',
          weekFrom: i + 1, weekTo: i + 1, dueOffsetDays: (i + 1) * 7,
        })),
      },
    ],
  },
];

/** Số buổi chính/tuần theo skill — cấu hình dữ liệu, không suy ra từ tên lớp. */
export const SKILL_CONFIG: Record<string, Record<string, number>> = {
  FT5: { listening: 1, reading: 1, writing1: 1, writing2: 1, speaking: 1 },
  FT10: { listening: 2, reading: 2, writing1: 2, writing2: 2, speaking: 2 },
  FT16: { listening: 3, reading: 3, writing1: 3, writing2: 3, speaking: 4 },
  FOUND: { listening: 1, reading: 1, speaking: 1 },
  ELEM: { listening: 1, reading: 1, writing1: 1, speaking: 1 },
  PET: { listening: 1, reading: 1, writing1: 1, speaking: 1 },
};

export const CLASSES = [
  { code: 'FT-A01', name: 'FT Cầu Giấy A01', branch: 'CG', type: 'FT5', template: 'FT-FLEX', versionNo: 1, startOffsetWeeks: -10 },
  { code: 'FT-A02', name: 'FT Cầu Giấy A02', branch: 'CG', type: 'FT10', template: 'FT-MILE', versionNo: 1, startOffsetWeeks: -14 },
  { code: 'FT-B01', name: 'FT Hà Đông B01', branch: 'HD', type: 'FT5', template: 'FT-FLEX', versionNo: 1, startOffsetWeeks: -9 },
  { code: 'FT-B02', name: 'FT Hà Đông B02', branch: 'HD', type: 'FT16', template: 'FT-FLEX', versionNo: 1, startOffsetWeeks: -7 },
  { code: 'FT-C01', name: 'FT Thanh Xuân C01', branch: 'TX', type: 'FT5', template: 'FT-MILE', versionNo: 1, startOffsetWeeks: -16 },
  { code: 'FT-D01', name: 'FT Long Biên D01', branch: 'LB', type: 'FT10', template: 'FT-FLEX', versionNo: 1, startOffsetWeeks: -6 },
  { code: 'NM-A01', name: 'Foundation Cầu Giấy A01', branch: 'CG', type: 'FOUND', template: 'NM-FOUND', versionNo: 1, startOffsetWeeks: -7 },
  { code: 'NM-A02', name: 'Elementary Cầu Giấy A02', branch: 'CG', type: 'ELEM', template: 'NM-ELEM', versionNo: 1, startOffsetWeeks: -9 },
  { code: 'NM-B01', name: 'Foundation Hà Đông B01', branch: 'HD', type: 'FOUND', template: 'NM-FOUND', versionNo: 1, startOffsetWeeks: -8 },
  { code: 'NM-B02', name: 'PET Hà Đông B02', branch: 'HD', type: 'PET', template: 'NM-PET', versionNo: 1, startOffsetWeeks: -5 },
  { code: 'NM-C01', name: 'Foundation Thanh Xuân C01', branch: 'TX', type: 'FOUND', template: 'NM-FOUND', versionNo: 2, startOffsetWeeks: -3 },
  { code: 'NM-D01', name: 'Elementary Long Biên D01', branch: 'LB', type: 'ELEM', template: 'NM-ELEM', versionNo: 1, startOffsetWeeks: -6 },
];

export const REPORT_CATEGORIES = [
  { key: 'enrollment_class', label: 'Sĩ số & tình hình lớp', seq: 1 },
  { key: 'teaching_quality', label: 'Chất lượng dạy học', seq: 2 },
  { key: 'students_parents', label: 'Học viên & phụ huynh', seq: 3 },
  { key: 'teacher_staffing', label: 'Nhân sự giáo viên', seq: 4 },
  { key: 'curriculum', label: 'Giáo trình / chương trình học', seq: 5 },
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'academic.view', 'academic.weekly.edit', 'academic.summary.edit', 'academic.official_score.edit',
    'academic.estimate.edit', 'academic.note_internal.view', 'student.transfer', 'student.import',
    'class.progress.edit', 'class.override.edit', 'issue.view', 'issue.manage', 'task.view', 'task.manage',
    'task.update_assigned', 'ops.branch_report.view', 'ops.branch_report.manage', 'ops.meeting.view',
    'ops.meeting.manage', 'admin.config', 'admin.users', 'audit.view',
  ],
  manager: [
    'academic.view', 'academic.weekly.edit', 'academic.summary.edit', 'academic.official_score.edit',
    'academic.estimate.edit', 'academic.note_internal.view', 'student.transfer', 'student.import',
    'class.progress.edit', 'class.override.edit', 'issue.view', 'issue.manage', 'task.view', 'task.manage',
    'task.update_assigned', 'ops.branch_report.view', 'ops.branch_report.manage', 'ops.meeting.view',
    'ops.meeting.manage', 'audit.view',
  ],
  teacher: [
    'academic.view', 'academic.weekly.edit', 'academic.estimate.edit', 'academic.summary.edit',
    'academic.note_internal.view', 'issue.view', 'task.view', 'task.update_assigned',
  ],
  consultant: ['academic.view', 'task.view', 'task.update_assigned'],
  consultant_manager: ['academic.view', 'task.view', 'task.update_assigned', 'issue.view'],
};

export const PERMISSION_GROUPS: Record<string, string> = {
  'academic.view': 'Học vụ', 'academic.weekly.edit': 'Học vụ', 'academic.summary.edit': 'Học vụ',
  'academic.official_score.edit': 'Học vụ', 'academic.estimate.edit': 'Học vụ', 'academic.note_internal.view': 'Học vụ',
  'student.transfer': 'Học viên', 'student.import': 'Học viên',
  'class.progress.edit': 'Lớp học', 'class.override.edit': 'Lớp học',
  'issue.view': 'Vận hành', 'issue.manage': 'Vận hành',
  'task.view': 'Vận hành', 'task.manage': 'Vận hành', 'task.update_assigned': 'Vận hành',
  'ops.branch_report.view': 'Vận hành', 'ops.branch_report.manage': 'Vận hành',
  'ops.meeting.view': 'Vận hành', 'ops.meeting.manage': 'Vận hành',
  'admin.config': 'Quản trị', 'admin.users': 'Quản trị', 'audit.view': 'Quản trị',
};

export const FIRST_NAMES = [
  'An', 'Anh', 'Bảo', 'Bình', 'Chi', 'Cường', 'Dung', 'Duy', 'Đạt', 'Đức',
  'Giang', 'Hà', 'Hải', 'Hạnh', 'Hiếu', 'Hoa', 'Hùng', 'Huy', 'Hương', 'Khanh',
  'Khôi', 'Lâm', 'Linh', 'Long', 'Mai', 'Minh', 'Nam', 'Nga', 'Ngọc', 'Nhi',
  'Phong', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Thịnh', 'Thu', 'Trang',
  'Trí', 'Trúc', 'Tú', 'Tuấn', 'Uyên', 'Vân', 'Việt', 'Vy', 'Yến', 'Ánh',
];
export const MIDDLE_NAMES = [
  'Thị', 'Văn', 'Minh', 'Gia', 'Hoàng', 'Ngọc', 'Thanh', 'Quang', 'Nhật', 'Bảo',
  'Đình', 'Hữu', 'Khánh', 'Phương', 'Thu', 'Xuân', 'Diệu', 'Tuấn',
];
export const LAST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trịnh', 'Cao', 'Mai',
];
