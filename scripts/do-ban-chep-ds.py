"""Lập danh sách (tài khoản × trang) cho do-ban-chep.mjs từ bản chép thật. Vai chính theo quyền cao nhất."""
import sqlite3, sys, json
sys.stdout.reconfigure(encoding='utf-8')
c = sqlite3.connect(sys.argv[1]); out = sys.argv[2]
TU, DEN = '2026-10-26', '2026-11-08'
rows = c.execute("""select u.id, group_concat(distinct r.key), min(case when r.key in ('manager','system_admin','office_admin','cx','consultant') then ur.branch_id end), min(ur.branch_id) from users u join user_roles ur on ur.user_id=u.id
  join roles r on r.id=ur.role_id where ur.status='active' and u.status='active' and u.deleted_at is null group by u.id""").fetchall()
ds = []
GOC = {'QT': 'system_admin', 'QL': 'manager', 'ADMIN': 'office_admin', 'CX': 'cx', 'TVV': 'consultant', 'GV': 'teacher'}
def lop_cua(uid):
    return c.execute("""select ta.class_id, (select min(e.student_id) from enrollments e where e.class_id=ta.class_id and e.status='active')
      from teacher_assignments ta join classes cl on cl.id=ta.class_id where ta.user_id=? and ta.status='active' and cl.status='active'
      order by ta.is_core desc, (select count(*) from enrollments e where e.class_id=ta.class_id and e.status='active') desc limit 1""", (uid,)).fetchone()
for uid, roles, cnq, cng in rows:
    cn = cnq or cng or 1
    r = set(roles.split(','))
    vai = 'QT' if 'system_admin' in r else 'QL' if 'manager' in r else 'ADMIN' if 'office_admin' in r else 'CX' if 'cx' in r else 'TVV' if 'consultant' in r else 'GV'
    hv = ['/hoc-vien-lop?', '/hoc-vien-lop?goc=sos']
    test = ['/cham/lich-test?', '/cham/lich-test/qua-han?']
    if vai == 'GV':
        p = {'tq': ['/my-work', '/tong-quan/lop-toi-day/hai-khoi', f'/giao-vien/{uid}/o?cot=case-mo'], 'cv': ['/my-work'], 'hv': hv, 'test': test}
        l = lop_cua(uid)
        if l:
            p['lop'] = [f'/classes/{l[0]}/{x}' for x in ['roster', 'diem-theo-luot', 'overview', 'viec-theo-em?chi=toi']] + [f'/cases?classId={l[0]}']
            if l[1]: p['hshv'] = [f'/students/{l[1]}', f'/students/{l[1]}/skill-board', f'/students/{l[1]}/y-thuc', f'/students/{l[1]}/bai-tren-lop']
    elif vai in ('QL', 'QT'):
        p = {'tq': ['/yeu-cau/dem', '/my-work', '/tong-quan/v5?ct=ft', f'/phan-tich/giao-vien?cn={cn}&ct=ft&kieu=tuy-chon&tu={TU}&den={DEN}', f'/yeu-cau?hop=cho-duyet&branchId={cn}'],
             'cv': ['/my-work?nguoi=tat-ca'], 'hv': hv, 'test': test,
             'pt': [f'/tong-quan/v5?branchId={cn}&ct=ft&kieu=2-tuan&tu=2026-11-02&den=2026-11-29&baoCao=chi-nhanh', f'/phan-tich/giao-vien?cn={cn}&ct=ft&kieu=2-tuan&tu=2026-11-02&den=2026-11-29&v2=1']}
    elif vai == 'ADMIN':
        p = {'tq': ['/my-work', '/tong-quan/mock-test', '/highlights?'], 'cv': ['/my-work?nguoi=tat-ca'], 'test': test, 'hv': ['/hoc-vien-lop?']}
    elif vai == 'CX':
        p = {'tq': ['/tong-quan/v5?ct=ft', '/tong-quan/hoc-vien'], 'hv': hv + ['/hoc-vien-lop/theo-vai'],
             'pt': ['/tong-quan/v5?ct=ft&kieu=2-tuan&tu=2026-11-02&den=2026-11-29&baoCao=chi-nhanh']}
    else:
        p = {'tq': ['/tong-quan/tvv', '/tong-quan/hoc-vien', '/my-work'], 'hv': hv + [f'/hoc-vien-lop/theo-vai?phamVi=chi-nhanh&branchId={cn}']}
    for trang, urls in p.items():
        ds.append({'ten': f'{vai} {uid} {trang}', 'user': uid, 'urls': urls, **({'goc': GOC[vai]} if len(r) > 1 else {})})
json.dump(ds, open(out, 'w', encoding='utf-8'), ensure_ascii=False)
from collections import Counter
print(len(ds), Counter(d['ten'].split()[0] for d in ds))
