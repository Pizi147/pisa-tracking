/**
 * DỮ LIỆU NỀN DÙNG CHUNG — quyền, vai trò (kể cả vai `retired`), lộ trình, chương trình học + kỹ năng + mốc.
 * Bộ demo (`seed.ts`) và bản chính (`ops/initBanChinh.ts`, PR-Z2) cùng gọi hàm này, nên hai bên không bao giờ lệch nhau.
 * KHÔNG tạo chi nhánh, người dùng, lớp, học viên hay cấu hình demo nào (chỉ ba dòng dấu ở `demo_config` — ngưỡng, khoá backfill, DB mới — xem cuối hàm).
 * Mã bên dưới chuyển NGUYÊN VĂN từ `runSeed()`.
 */
import { PERMISSION_LABEL, PROGRAMME_TEMPLATES } from '../../../shared/domain/index.ts';
import { seedRoutes } from '../platform/sysconfig.ts';
import { dienCauHinh } from '../migrate/prOv6b1.ts';
import { chenPetKet } from '../migrate/prOv6b2.ts';
import { KHOA_MOC_BC_PH_VIEC_GV } from '../migrate/prBcPhViecGv.ts';
import { ngayTheoGioVN } from '../../../shared/domain/index.ts';
import { RETIRED_ROLES, ROLES, ROLE_PERMISSIONS } from './data.ts';

export function napDuLieuNen(conn: any, now: string): { roleId: Map<string, number>; permId: Map<string, number> } {
  // ---------------------------------------------------------------- vai trò & quyền
  const permId = new Map<string, number>();
  for (const [key, label] of Object.entries(PERMISSION_LABEL)) {
    const info = conn.prepare('INSERT INTO permissions (key, name_vi) VALUES (?,?)').run(key, label);
    permId.set(key, Number(info.lastInsertRowid));
  }
  const roleId = new Map<string, number>();
  for (const r of ROLES) {
    const info = conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES (?,?,'active')")
      .run(r.key, r.name);
    roleId.set(r.key, Number(info.lastInsertRowid));
    for (const p of ROLE_PERMISSIONS[r.key]) {
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)')
        .run(Number(info.lastInsertRowid), permId.get(p)!);
    }
  }
  /*
   * VAI TRÒ ĐÃ BỎ vẫn có dòng trong bảng, ở trạng thái `retired` và KHÔNG kèm quyền nào.
   *
   * Bộ demo cần nó để chứng minh đúng một điều: một database đã chạy thật, có người từng
   * mang vai đó, thì sau khi bỏ vai vẫn đọc được lịch sử. Không tài khoản demo nào được
   * giao vai này.
   */
  for (const r of RETIRED_ROLES) {
    const info = conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES (?,?,'retired')")
      .run(r.key, r.name);
    roleId.set(r.key, Number(info.lastInsertRowid));
  }

  /*
   * LỘ TRÌNH nay là DỮ LIỆU (mục 7.3) — nạp lần đầu từ danh sách viết cứng, sau đó Quản trị
   * hệ thống thêm sửa trong màn quản trị mà không phải đụng vào mã nguồn.
   */
  seedRoutes(conn);

  // ---------------------------------------------------------------- chương trình học
  for (const t of Object.values(PROGRAMME_TEMPLATES)) {
    conn.prepare('INSERT INTO programmes (code, name, weeks, scoring_mode, status, created_at) VALUES (?,?,?,?,?,?)')
      .run(t.code, t.name, t.weeks, t.scoringMode, 'active', now);
    t.skills.forEach((skill, i) => {
      conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(t.code, skill, i);
    });
    for (const cp of t.checkpoints) {
      conn.prepare('INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES (?,?,?)')
        .run(t.code, cp.kind, cp.studyWeek);
    }
  }
  dienCauHinh(conn);   // OV-6b1: tuần MT lộ trình + ngưỡng đạt — cùng luật với migrate
  chenPetKet(conn);    // OV-6b2: PET, KET — cùng hàm với migrate
  /*
   * DẤU NGƯỠNG ĐẠT LỚP NORMAL (PR-Z2c-b). Ngưỡng thật là hằng RATIO_PASS_THRESHOLD trong mã; dòng này chỉ là dấu cho bước
   * migrate `migrateNormalPassThreshold` biết database đã ở luật 70%. Thiếu dấu thì lần migrate đầu trên một database MỚI
   * (bản chính vừa khởi tạo) ghi audit "đổi luật 60% → 70%" — sai sự thật: database đó chưa từng có luật 60%.
   */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('normal_pass_threshold', '0.7', now);
  /* DB mới chưa từng có em thôi học kiểu cũ — khoá trước để migrate không lưu trữ lại em QL đã Bỏ lưu trữ (DEP-1, `migrateXoaDuLieu`). */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('xoa_du_lieu_backfill_at', now, now);
  /* PR-QU: DB mới đã cấp `case.close` cho Giáo viên theo `ROLE_PERMISSIONS` — khoá trước để migrate không cấp lại ô Quản trị đã gỡ. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_qu_case_close_gv_at', now, now);
  /* OV-13p: DB mới đã cấp `class.create` + `student.add` theo `ROLE_PERMISSIONS` — khoá trước như PR-QU. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_ov13p_tvv_cx_tao_lop_at', now, now);
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_ov13q_han_sau_thi_at', now, now);   // OV-13q: hạn sau thi theo luật mới từ đầu
  /* PR-CT2: DB mới không có Kết quả Tutor kỳ vọng kiểu cũ — khoá trước để migrate không điền Số buổi tuần này cho dòng mới. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_ct2_dien_buoi', now, now);
  /* PR-OV13a (d): DB mới không có Case "Chờ chốt SOS" kiểu cũ — khoá trước để migrate không chạy `prOv1c` (chỉ chạy một lần trên DB cũ). */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_ov1c_da_chay', now, now);
  /* SOS-TAM-PA: DB mới chốt SOS theo luật PA GV ↔ PA quy chế từ đầu — khoá trước, migrate `prSosTamPa` chỉ chạy một lần trên DB cũ. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_sos_tam_pa_da_chay', now, now);
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('lich_su_thay_doi_tu', now, now);   // OV-15g: DB mới = lịch sử ghi từ lúc khởi tạo (`MOC_LICH_SU`)
  /* SUA-NO-RA: DB mới không có Case cũ trống chủ — khoá trước để migrate không chạy bước gán chủ `prCvLoi` (chỉ một lần trên DB cũ). */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_cv_loi_gan_chu_case_at', now, now);
  /* MON-CT-1311: DB mới đã có PET / KET L+S · R+W — khoá trước, migrate `prMonCt1311` chỉ gộp một lần trên DB cũ (bộ 4 môn của P13). */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_mon_ct_1311_at', now, now);
  /* HOTFIX-3: như trên cho `prOv1b` (dọn "-" cũ) — khoá trước, migrate chỉ ghi khoá trên DB cũ. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_ov1b_da_chay', now, now);
  /* PR-MT-VANG-RESET (N38 L5): DB mới đã theo luật chọn tuần = lần vắng 0 — khoá trước, migrate chỉ đặt lại một lần trên DB cũ. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_mt_vang_reset_da_chay', now, now);
  /* NGHI-HOC-LUU-TRU: DB mới — Kết thúc học đã luôn vào Lưu trữ; khoá trước, migrate chỉ lưu trữ một lần trên DB cũ. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_nghi_hoc_luu_tru_da_chay', now, now);
  /* RESET-HAN-CASE: DB mới không có việc Case quá hạn kiểu cũ — khoá trước, migrate chỉ đặt lại hạn một lần trên DB cũ. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_reset_han_case_da_chay', '', now);   // giá trị = ngày reset; rỗng = không có lần ghi trễ cũ nào bị loại
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_pa_trung_0711_da_chay', now, now);   // PA-TRUNG: DB mới không có PA trùng cũ
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_w_lech_da_chay', now, now);   // W-LECH: DB mới đã theo luật "-" một W = cả buổi
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_k316_da_chay', now, now);   // K3-16: DB mới không có PA cũ chạy cạnh PA mới
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('pr_tinh_lui_phan_cong_da_chay', now, now);   // TINH-LUI-PC: DB mới — phân công khai đúng ngày từ đầu, không tính lùi
  /* LG-3: mốc bật việc GV "Viết Báo cáo PH" = ngày dựng DB (giờ VN); seed ghi đè = ngày demo. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_MOC_BC_PH_VIEC_GV, ngayTheoGioVN(now), now);
  /* DẤU DB MỚI (DEP-2): database dựng bằng mã hiện hành (init / seed) không có dữ liệu kiểu cũ — các bước CHUYỂN DỮ LIỆU CŨ của migrate bỏ qua. */
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run('khoi_tao_moi_at', now, now);
  return { roleId, permId };
}
