import type { MeasureKindV3, ViolationCategory } from '../../../shared/domain/index.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * BỘ DEMO Ý THỨC — VI PHẠM VÀ BIỆN PHÁP XỬ LÝ (PR-J J10, thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md §10).
 *
 * Reseed, không migrate: mô hình cũ (Case Ý thức) lệch quá xa để chuyển đổi có nghĩa với bộ demo, nên các học viên có "case Ý
 * thức" trong kịch bản cũ được dựng lại thành vi phạm và biện pháp ở đây. Tổng cộng đủ MƯỜI TÁM tình huống của đặc tả — xem
 * \`DEMO.md\` mục "Ý thức" để biết tình huống nào nằm ở học viên nào.
 *
 * Bộ dựng ghi thẳng xuống bảng (giống \`build.ts\`) chứ không đi qua dịch vụ: nó cần ngày quá khứ và người ghi cụ thể. Ba luật cứng
 * kiểm ngay lúc dựng, giống các bộ dựng khác: (1) không sự kiện nào sau ngày demo, (2) biện pháp đã thực hiện không chứa vi phạm
 * xảy ra SAU ngày thực hiện, (3) mỗi vi phạm trong biện pháp phải tồn tại.
 */

type VSeed = {
  key: string;
  on: string;
  category: ViolationCategory;
  skill?: string | null;
  /** Mã giáo viên ghi. */
  by: string;
  text: string;
  /** Ngày hệ thống ghi nhận nếu khác ngày xảy ra (GV nhớ ra muộn). */
  reportedOn?: string;
  /**
   * Đã bị XOÁ sau khi ghi (rulebook v3, V11′–V14′ — thay "đánh dấu không chính xác"): bộ dựng ghi vi phạm, gắn vào biện pháp, rồi xoá đúng như
   * `deleteViolation` (dòng + dòng nối + lịch sử; một dòng `audit_logs`). Còn lại ở database: biện pháp với số vi phạm ĐANG GẮN.
   */
  deleted?: { by: string; on: string };
};

type MSeed = {
  key: string;
  kind: MeasureKindV3;
  customName?: string;
  createdOn: string;
  status: 'preparing' | 'done';
  /** Ngày thực hiện thực tế (chỉ với \`done\`). */
  performedOn?: string;
  /** Mã người thực hiện (chỉ với \`done\`). */
  performer?: string;
  /** Mã người tạo, nếu khác người phụ trách (ví dụ Quản lý nhập hộ). */
  createdBy?: string;
  owner: string;
  note: string;
  participants?: string;
  /** Vi phạm trong biện pháp; \`addedOn\` chỉ cần khi vi phạm được THÊM SAU lúc tạo. */
  violations: Array<string | { key: string; addedOn: string }>;
  /** Từng được thêm rồi bỏ ra — chỉ để lại dòng lịch sử; vi phạm quay về Chưa xử lý. */
  dropped?: Array<{ key: string; addedOn: string; removedOn: string }>;
  evidence?: Array<{ name: string; url: string }>;
};

type StudentYThuc = { student: string; violations: VSeed[]; measures?: MSeed[] };

const LINK = (name: string) => ({ name, url: `https://drive.pisa.example/thu-canh-cao/${encodeURIComponent(name)}` });

export const Y_THUC_SEEDS: StudentYThuc[] = [
  /* ============================================================ Nguyễn Minh An — bốn giáo viên · ba nhóm · một Report đang chuẩn bị được thêm vi phạm sau ·
                                                                    cảnh báo 9 ngày (tình huống 3, 4, 7, 10) */
  {
    student: 'J01',
    violations: [
      { key: 'a1', on: '2026-08-31', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading tuần cuối tháng 8' },
      { key: 'a2', on: '2026-09-02', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ một buổi không xin phép, gia đình chưa liên lạc' },
      { key: 'a3', on: '2026-09-10', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Nói chuyện riêng trong giờ Writing, đã nhắc hai lần' },
      /* Bốn vi phạm CHƯA XỬ LÝ của bốn giáo viên khác nhau, cái cũ nhất 9 ngày: đủ ba nhóm, bốn dòng độc lập, không gộp thành "đợt". */
      { key: 'a4', on: '2026-09-05', category: 'homework', skill: 'writing1', by: 'T_KHOA', text: 'Không nộp bài Writing Task 1 buổi 05/09' },
      { key: 'a5', on: '2026-09-07', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading tuần này, hỏi thì nói để quên vở' },
      { key: 'a6', on: '2026-09-08', category: 'attendance', skill: 'speaking', by: 'T_TRANG', text: 'Đi muộn 20 phút buổi Speaking' },
      { key: 'a7', on: '2026-09-12', category: 'conduct', skill: 'writing2', by: 'T_LINH', text: 'Dùng điện thoại trong giờ Writing, nhắc hai lần vẫn tiếp tục' },
    ],
    measures: [
      {
        /* Tạo 04/09 với hai vi phạm; 11/09 GVCN gộp thêm a3 vào (tình huống 7) — biện pháp vẫn Đang chuẩn bị. */
        key: 'am1', kind: 'family_report', createdOn: '2026-09-04', status: 'preparing', owner: 'T_HA',
        note: 'Chờ liên lạc được với phụ huynh, dự kiến gọi trong tuần này.',
        violations: ['a1', 'a2', { key: 'a3', addedOn: '2026-09-11' }],
      },
    ],
  },

  /* ============================================================ Trần Thu Hà — vi phạm đã xoá · vi phạm được thêm rồi bỏ khỏi biện pháp (tình huống 2, 8) */
  {
    student: 'J02',
    violations: [
      { key: 'g1', on: '2026-08-28', category: 'homework', skill: 'writing2', by: 'T_LINH', text: 'Không nộp bài Writing Task 2 tuần 4' },
      { key: 'g2', on: '2026-09-01', category: 'homework', skill: 'listening', by: 'T_HA', text: 'Thiếu bài Listening tuần 5' },
      { key: 'g3', on: '2026-09-03', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ một buổi không xin phép' },
      {
        key: 'g4', on: '2026-09-10', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading tuần này',
        deleted: { by: 'T_HA', on: '2026-09-11' },
      },
      { key: 'g5', on: '2026-09-09', category: 'conduct', skill: 'speaking', by: 'T_TRANG', text: 'Dùng điện thoại trong giờ Speaking' },
      { key: 'g6', on: '2026-09-11', category: 'attendance', skill: null, by: 'T_HA', text: 'Đi muộn 15 phút buổi sáng' },
    ],
    measures: [
      {
        /* Tạo 04/09 với ba vi phạm; 12/09 gộp thêm g6; g5 từng được thêm rồi bỏ ra — dòng lịch sử còn, vi phạm quay về Chưa xử lý (tình huống 8). */
        key: 'gm1', kind: 'family_report', createdOn: '2026-09-04', status: 'preparing', owner: 'T_HA',
        note: 'Chờ liên lạc được với phụ huynh, dự kiến gọi trong tuần này.',
        violations: ['g1', 'g2', 'g3', { key: 'g6', addedOn: '2026-09-12' }],
        dropped: [{ key: 'g5', addedOn: '2026-09-10', removedOn: '2026-09-11' }],
      },
    ],
  },

  /* ============================================================ Lê Quang Huy — nhóm sáu vi phạm vào ba biện pháp · Report gom năm · một vi phạm nằm trong hai biện pháp ·
                                                                    vi phạm bị XOÁ SAU khi biện pháp đã thực hiện (tình huống 5, 6, 16, 17) */
  {
    student: 'J03',
    violations: [
      { key: 'h1', on: '2026-08-10', category: 'homework', skill: 'listening', by: 'T_HA', text: 'Không nộp BTVN Listening ba buổi liền' },
      { key: 'h2', on: '2026-08-12', category: 'homework', skill: 'speaking', by: 'T_TRANG', text: 'Buổi Speaking em cũng không chuẩn bị bài nói ở nhà' },
      { key: 'h3', on: '2026-08-25', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ hai buổi liên tiếp không báo trước' },
      { key: 'h4', on: '2026-09-01', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ bốn buổi trong hai tuần, chỉ báo trước một buổi' },
      {
        key: 'h5', on: '2026-09-03', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Không hợp tác làm việc nhóm trong giờ Writing',
        deleted: { by: 'T_KHOA', on: '2026-09-12' },   // ghi nhầm em (bạn cùng tên) — xoá sau khi các biện pháp đã thực hiện
      },
      { key: 'h6', on: '2026-09-08', category: 'classroom', skill: 'writing2', by: 'T_LINH', text: 'Ra ngoài giữa giờ không xin phép' },
      { key: 'h7', on: '2026-09-04', category: 'classroom', skill: 'reading', by: 'T_KHOA', text: 'Rời chỗ đi lại trong giờ Reading, nhắc hai lần' },
    ],
    measures: [
      {
        /* Vi phạm h1 đã được xử lý một lần từ tháng 8 — rồi lại nằm trong ba biện pháp tháng 9 (tình huống 17). */
        key: 'hm0', kind: 'talk_short', createdOn: '2026-08-14', status: 'done', performedOn: '2026-08-14', performer: 'T_HA', owner: 'T_HA',
        note: 'Nhắc em ngay sau buổi học, em hứa nộp bù.', violations: ['h1'],
      },
      {
        key: 'hm1', kind: 'meeting_student', createdOn: '2026-09-07', status: 'done', performedOn: '2026-09-09', performer: 'T_HA', owner: 'T_HA',
        note: 'Gặp em sau giờ học: em nhận đã bỏ bài nhiều buổi, hứa nộp đủ từ tuần sau.', violations: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7'],
      },
      {
        /* Một Report gom NĂM vi phạm khác nhóm, khác môn, khác GV, khác ngày (tình huống 5). */
        key: 'hm2', kind: 'family_report', createdOn: '2026-09-08', status: 'done', performedOn: '2026-09-10', performer: 'T_HA', owner: 'T_HA',
        note: 'Gọi cho mẹ em, báo tình hình bỏ bài và nghỉ học. Gia đình nắm được và đồng ý phối hợp.', violations: ['h1', 'h2', 'h3', 'h4', 'h5', 'h7'],
      },
      {
        key: 'hm3', kind: 'warning_1', createdOn: '2026-09-09', status: 'done', performedOn: '2026-09-11', performer: 'T_HA', owner: 'T_HA',
        note: 'Gửi thư cảnh cáo lần 1 về việc bỏ bài và nghỉ học không báo.', violations: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7'],
        evidence: [LINK('Thư cảnh cáo lần 1 — Lê Quang Huy.pdf')],
      },
    ],
  },

  /* ============================================================ Phạm Bảo Ngọc — Thư cảnh cáo 1 → 2 → 3 đúng thứ tự, mỗi thư có tệp (tình huống 9) */
  {
    student: 'J08',
    violations: [
      { key: 'n1', on: '2026-08-03', category: 'homework', skill: 'reading', by: 'T_HA', text: 'Không nộp bài Reading hai tuần liền' },
      { key: 'n2', on: '2026-08-06', category: 'attendance', skill: null, by: 'T_HA', text: 'Nghỉ ba buổi không báo trước' },
      { key: 'n3', on: '2026-08-20', category: 'conduct', skill: 'writing1', by: 'T_KHOA', text: 'Nói chuyện riêng liên tục, không nghe nhắc nhở' },
      { key: 'n4', on: '2026-09-01', category: 'classroom', skill: 'writing2', by: 'T_LINH', text: 'Sử dụng điện thoại trong giờ học sau khi đã bị nhắc' },
      { key: 'n5', on: '2026-09-08', category: 'homework', skill: 'listening', by: 'T_HA', text: 'Bỏ bài Listening, đây là lần thứ ba trong tháng' },
    ],
    measures: [
      {
        key: 'nm1', kind: 'warning_1', createdOn: '2026-08-08', status: 'done', performedOn: '2026-08-10', performer: 'T_HA', owner: 'T_HA',
        note: 'Thư cảnh cáo lần 1 về việc bỏ bài và nghỉ học.', violations: ['n1', 'n2'], evidence: [LINK('Thư cảnh cáo lần 1 — Phạm Bảo Ngọc.pdf')],
      },
      {
        key: 'nm2', kind: 'warning_2', createdOn: '2026-08-26', status: 'done', performedOn: '2026-08-28', performer: 'T_HA', owner: 'T_HA',
        note: 'Thư cảnh cáo lần 2 về thái độ trong giờ học.', violations: ['n3'], evidence: [LINK('Thư cảnh cáo lần 2 — Phạm Bảo Ngọc.pdf')],
      },
      {
        key: 'nm3', kind: 'warning_3', createdOn: '2026-09-09', status: 'done', performedOn: '2026-09-10', performer: 'T_HA', owner: 'T_HA',
        note: 'Thư cảnh cáo lần 3 — gia đình đã được mời làm việc trực tiếp.', violations: ['n4', 'n5'],
        evidence: [LINK('Thư cảnh cáo lần 3 — Phạm Bảo Ngọc.pdf')],
      },
    ],
  },

  /* ============================================================ Đặng Thu Vân — đã xử lý bằng hai biện pháp (Quản lý nhập hộ), rồi một vi phạm mới 8 ngày (tình huống 10) */
  {
    student: 'J11',
    violations: [
      { key: 'v1', on: '2026-08-10', category: 'attendance', skill: null, by: 'T_QUAN', text: 'Nghỉ ba buổi liên tiếp không báo, buổi thứ nhất' },
      { key: 'v2', on: '2026-08-11', category: 'attendance', skill: null, by: 'T_QUAN', text: 'Nghỉ buổi thứ hai liên tiếp, gia đình không liên lạc' },
      { key: 'v3', on: '2026-08-12', category: 'attendance', skill: 'writing1', by: 'T_HAN', text: 'Nghỉ buổi thứ ba liên tiếp, bài Writing chưa có ai thu' },
      { key: 'v4', on: '2026-09-06', category: 'attendance', skill: null, by: 'T_QUAN', text: 'Nghỉ hai buổi đầu tuần, gia đình chưa liên lạc' },
    ],
    measures: [
      {
        key: 'vm1', kind: 'meeting_student', createdOn: '2026-08-12', status: 'done', performedOn: '2026-08-13', performer: 'T_QUAN', owner: 'T_QUAN',
        note: 'Gặp em cuối buổi, hỏi lý do nghỉ: nhà đang chuyển, đi lại xa.', violations: ['v1', 'v2'],
      },
      {
        /* NGƯỜI NHẬP HỘ KHÁC NGƯỜI THỰC HIỆN: Quản lý ghi lại việc cô Quân đã gọi phụ huynh. */
        key: 'vm2', kind: 'family_report', createdOn: '2026-08-19', status: 'done', performedOn: '2026-08-19', performer: 'T_QUAN', createdBy: 'MGR_BC', owner: 'T_QUAN',
        note: 'Gọi phụ huynh trao đổi về lịch đi học; gia đình xin giữ nguyên lịch tới khi chuyển nhà xong.', violations: ['v1', 'v2', 'v3'],
      },
    ],
  },

  /* ============================================================ Ngô Hải Yến — hai GV cùng ghi BTVN, không gộp thành "đợt" (tình huống 3, 10) */
  {
    student: 'S12',
    violations: [
      { key: 'y1', on: '2026-08-24', category: 'conduct', skill: null, by: 'T_DUNG', text: 'Ngồi im cả buổi, gọi mới nói và chỉ trả lời một câu ngắn' },
      { key: 'y2', on: '2026-09-08', category: 'homework', skill: 'reading', by: 'T_NAM', text: 'Ba buổi Reading liên tiếp em không nộp bài về nhà, hỏi thì nói quên vở' },
      { key: 'y3', on: '2026-09-09', category: 'homework', skill: 'writing2', by: 'T_DUNG', text: 'Không nộp bài Writing Task 2, em nói tối qua bận việc nhà' },
    ],
    measures: [
      {
        key: 'ym1', kind: 'talk_short', createdOn: '2026-09-04', status: 'done', performedOn: '2026-09-05', performer: 'T_DUNG', owner: 'T_NAM',
        note: 'Đổi chỗ ngồi và gọi phát biểu có chủ đích; em đã chủ động trả lời hơn.', violations: ['y1'],
      },
    ],
  },

  /* ============================================================ Trần Hải Kiên — Thư cảnh cáo 1, 2 ở lộ trình cũ; sang lộ trình mới thì chuỗi reset (tình huống 18) */
  {
    student: 'J09',
    violations: [
      { key: 'k1', on: '2026-08-05', category: 'attendance', skill: null, by: 'T_YEN', text: 'Nghỉ hai buổi đầu tuần, không báo trước' },
      { key: 'k2', on: '2026-08-06', category: 'conduct', skill: 'speaking', by: 'T_YEN', text: 'Gần như không nói trong giờ Speaking, không hợp tác làm việc cặp' },
      { key: 'k3', on: '2026-08-07', category: 'homework', skill: 'writing', by: 'T_DUNG', text: 'Chưa nộp bài Writing của tuần đầu tiên' },
      { key: 'k4', on: '2026-09-09', category: 'attendance', skill: null, by: 'T_YEN', text: 'Đi muộn 25 phút buổi sáng, lớp Fast Track mới' },
    ],
    measures: [
      {
        key: 'km1', kind: 'warning_1', createdOn: '2026-08-06', status: 'done', performedOn: '2026-08-06', performer: 'T_YEN', owner: 'T_YEN',
        note: 'Thư cảnh cáo lần 1 về việc nghỉ học không báo.', violations: ['k1', 'k2'], evidence: [LINK('Thư cảnh cáo lần 1 — Trần Hải Kiên.pdf')],
      },
      {
        key: 'km2', kind: 'warning_2', createdOn: '2026-08-08', status: 'done', performedOn: '2026-08-09', performer: 'T_YEN', owner: 'T_YEN',
        note: 'Thư cảnh cáo lần 2 — em vẫn chưa nộp bài Writing.', violations: ['k3'], evidence: [LINK('Thư cảnh cáo lần 2 — Trần Hải Kiên.pdf')],
      },
    ],
  },
];

/**
 * DỰNG. Gọi SAU \`buildJourneys\` vì cần học viên, lớp, ghi danh và lộ trình đã có.
 */
export function buildYThuc(ctx: BuildCtx) {
  const { conn } = ctx;
  const userOf = (code: string): number => {
    const id = ctx.userId.get(code);
    if (!id) throw new Error(`Bộ demo Ý thức nhắc tới người không có: ${code}`);
    return id;
  };
  const stamp = (date: string, time: string) => `${date}T${time}.000Z`;
  const notFuture = (date: string, what: string) => {
    if (date > DEMO_DATE) throw new Error(`Bộ demo Ý thức: ${what} ở ngày ${date}, sau ngày demo ${DEMO_DATE}`);
    return date;
  };
  const cycleAt = (sid: number, on: string): number | null => {
    const r = (conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? AND started_at <= ? ORDER BY started_at DESC, id DESC LIMIT 1').get(sid, on)
      ?? conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY id LIMIT 1').get(sid)) as any;
    return r?.id ?? null;
  };
  const classAt = (sid: number, on: string): number | null => {
    const r = (conn.prepare(
      `SELECT class_id FROM enrollments WHERE student_id = ? AND started_at <= ? AND (ended_at IS NULL OR ended_at >= ?)
        ORDER BY started_at DESC, id DESC LIMIT 1`).get(sid, on, on)
      ?? conn.prepare('SELECT class_id FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1').get(sid)) as any;
    return r?.class_id ?? null;
  };

  const insertViolation = conn.prepare(
    `INSERT INTO violations (student_id, cycle_id, class_id, category, skill, occurred_on, reported_on, reported_by, description, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  );
  const insertAudit = conn.prepare(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at) VALUES (?,?,?,?,?,?,?,?)`,
  );
  const insertHistory = conn.prepare(
    `INSERT INTO violation_history (violation_id, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?)`,
  );
  const insertMeasure = conn.prepare(
    `INSERT INTO discipline_measures (student_id, cycle_id, class_id, kind, custom_name, status, owner_user_id, note, performed_on, performed_by,
                                      performer_name, participants, confirmed_by, confirmed_at, created_at, created_by, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const link = conn.prepare('INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
  const attach = conn.prepare(
    `INSERT INTO attachments (owner_type, owner_id, kind, url, display_name, mime_type, size_bytes, uploaded_by, created_at)
     VALUES ('discipline_measure', ?, 'link', ?, ?, NULL, NULL, ?, ?)`,
  );

  const counts = { violations: 0, deleted: 0, measures: 0, done: 0, preparing: 0, links: 0, attachments: 0 };

  for (const s of Y_THUC_SEEDS) {
    const sid = ctx.studentIdByCode?.get(s.student);
    if (!sid) throw new Error(`Bộ demo Ý thức nhắc tới học viên không có trong kịch bản: ${s.student}`);

    const vid = new Map<string, number>();
    const vOn = new Map<string, string>();
    for (const v of s.violations) {
      const reportedOn = notFuture(v.reportedOn ?? v.on, `vi phạm ${v.key}`);
      const by = userOf(v.by);
      const info = insertViolation.run(
        sid, cycleAt(sid, v.on), classAt(sid, v.on), v.category, v.skill ?? null, notFuture(v.on, `vi phạm ${v.key}`), reportedOn, by, v.text,
        stamp(reportedOn, '08:00:00'),
      );
      const id = Number(info.lastInsertRowid);
      vid.set(v.key, id);
      vOn.set(v.key, v.on);
      counts.violations += 1;
    }

    for (const m of s.measures ?? []) {
      const createdBy = userOf(m.createdBy ?? m.owner);
      const info0 = insertMeasure.run(
        sid, cycleAt(sid, m.createdOn), classAt(sid, m.createdOn), m.kind, m.customName ?? null, 'preparing', userOf(m.owner), m.note,
        null, null, null, m.participants ?? null, null, null,
        stamp(notFuture(m.createdOn, `biện pháp ${m.key}`), '09:00:00'), createdBy, null,
      );
      const mid = Number(info0.lastInsertRowid);
      counts.measures += 1;

      const entries = m.violations.map((x) => (typeof x === 'string' ? { key: x, addedOn: m.createdOn } : x));
      for (const e of entries) {
        const id = vid.get(e.key);
        if (!id) throw new Error(`Bộ demo Ý thức: biện pháp ${m.key} nhắc tới vi phạm không có: ${e.key}`);
        if (m.status === 'done' && vOn.get(e.key)! > m.performedOn!) {
          throw new Error(`Bộ demo Ý thức: biện pháp ${m.key} thực hiện ${m.performedOn} nhưng chứa vi phạm ${e.key} xảy ra sau đó (${vOn.get(e.key)})`);
        }
        link.run(mid, id, createdBy, stamp(notFuture(e.addedOn, `thêm ${e.key}`), '09:30:00'));
        counts.links += 1;
        if (e.addedOn !== m.createdOn) insertHistory.run(id, 'measure', null, String(mid), null, createdBy, stamp(e.addedOn, '09:30:00'));
        else insertHistory.run(id, 'measure', null, String(mid), null, createdBy, stamp(m.createdOn, '09:00:00'));
      }
      for (const d of m.dropped ?? []) {
        const id = vid.get(d.key);
        if (!id) throw new Error(`Bộ demo Ý thức: biện pháp ${m.key} nhắc tới vi phạm không có: ${d.key}`);
        insertHistory.run(id, 'measure', null, String(mid), null, createdBy, stamp(notFuture(d.addedOn, `thêm ${d.key}`), '09:30:00'));
        insertHistory.run(id, 'measure', String(mid), null, null, createdBy, stamp(notFuture(d.removedOn, `bỏ ${d.key}`), '09:45:00'));
      }

      if (m.status === 'done') {
        const performer = userOf(m.performer!);
        conn.prepare(
          `UPDATE discipline_measures SET status = 'done', performed_on = ?, performed_by = ?, confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ?`,
        ).run(notFuture(m.performedOn!, `thực hiện ${m.key}`), performer, createdBy, stamp(m.performedOn!, '17:00:00'), stamp(m.performedOn!, '17:00:00'), mid);
        counts.done += 1;
      } else {
        counts.preparing += 1;
      }
      for (const ev of m.evidence ?? []) {
        attach.run(mid, ev.url, ev.name, m.performer ? userOf(m.performer) : createdBy, stamp(m.performedOn ?? m.createdOn, '16:30:00'));
        counts.attachments += 1;
      }
    }

    /*
     * XOÁ SAU CÙNG (V13′): dựng đúng như `deleteViolation` — gỡ dòng nối và lịch sử, xoá dòng, ghi MỘT dòng audit giữ nội dung đã xoá. Xoá SAU các biện
     * pháp để biện pháp đã thực hiện còn lại với số vi phạm ĐANG GẮN (tình huống 16).
     */
    for (const v of s.violations) {
      if (!v.deleted) continue;
      const id = vid.get(v.key)!;
      const measureIds = (conn.prepare('SELECT measure_id FROM measure_violations WHERE violation_id = ? ORDER BY measure_id').all(id) as any[]).map((r) => r.measure_id);
      const at = stamp(notFuture(v.deleted.on, `xoá ${v.key}`), '10:00:00');
      conn.prepare('DELETE FROM measure_violations WHERE violation_id = ?').run(id);
      conn.prepare('DELETE FROM violation_history WHERE violation_id = ?').run(id);
      conn.prepare('DELETE FROM violations WHERE id = ?').run(id);
      insertAudit.run(userOf(v.deleted.by), 'violation.delete', 'violation', id, `Bộ demo · ${v.key}`, JSON.stringify({
        studentId: sid, category: v.category, skill: v.skill ?? null, occurredOn: v.on, reportedBy: userOf(v.by), description: v.text, measureIds,
      }), null, at);
      vid.delete(v.key);
      counts.violations -= 1;
      counts.deleted += 1;
    }
  }
  return counts;
}
