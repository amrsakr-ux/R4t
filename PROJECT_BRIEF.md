# سَنَا | أكاديمية القرآن الكريم — Project Brief

> منصة أكاديمية لتحفيظ القرآن الكريم للطالبات والأطفال، بإشراف معلمات متخصصات، بحلقات أونلاين.
> استخدمي هذا الملف كـsystem prompt لأي مساعد ذكي أو مطور جديد ينضم للمشروع.

---

## 1) الرؤية والهوية

**الاسم:** سَنَا (Sana) — أكاديمية القرآن الكريم.
**المعنى:** الضوء والإشراق.
**الجمهور:** الطالبات (نساء) والأطفال فقط في المرحلة الأولى.
**الطابع المطلوب:** هدوء + ثقة + علم + روحانية. مش شكل "موقع تحفيظ تقليدي"، ولا زخارف كثيرة، ولا أخضر فاقع.

### الهوية البصرية
- Primary: أخضر زيتوني داكن `hsl(88 22% 28%)`
- Secondary: Sage green `hsl(100 15% 55%)`
- Accent: ذهبي مطفي `hsl(42 45% 55%)`
- Background: Off-white `hsl(40 33% 97%)`
- الخط: **Tajawal** (Google Fonts) — عربي بالكامل.
- الاتجاه: **RTL** إجباري.
- الأسلوب: Islamic Minimal — Elegant — Calm — Educational.

### الجهاز المستهدف
- **Public + Student**: Desktop + Mobile.
- **Teacher**: **Mobile-first** (المعلمة غالبًا تسجل الحصة من الموبايل).
- **Admin**: Desktop primarily.

---

## 2) Tech Stack (لا يتغير بدون سبب قوي)

```
Framework:   Next.js 15 (App Router) + TypeScript
UI:          Tailwind CSS + shadcn/ui + Radix + Lucide icons
Database:    Supabase Postgres (via Prisma ORM)
Auth:        Custom JWT (jose + bcryptjs) — لا نستخدم Supabase Auth
Storage:     Supabase Storage (لإثباتات الدفع والصور)
Hosting:     Vercel (المخطط)
State:       React Server Components — الحد الأدنى من الـclient state
Validation:  Zod على السيرفر والفورمز
```

### قرارات ثابتة (لا تُعاد مناقشتها)
1. **Auth = Custom JWT + bcrypt** مع HttpOnly cookies. مش Supabase Auth ولا NextAuth.
2. **Login بـUsername** أولاً (email اختياري).
3. **RBAC 3 أدوار فقط**: `student`, `teacher`, `admin`.
4. **العام الدراسي**: سبتمبر → أغسطس (مصري).
5. **Prisma migrations** بشكل رسمي — لا استخدام `db push` في الإنتاج.
6. **الدفع**: يدوي عبر Instapay + مراجعة admin. لا Payment Gateway.
7. **رابط اللقاء (Meet Link)**: يُدار على مستوى الحلقة (Group)، مرن بين Google Meet / Zoom / Discord / Teams / Other.
8. **المعلمة ترسل الرابط للطالبات عبر المنصة** (تحدّثه لكل حصة إن أرادت)، لا نتحكم بالـprovider نيابة عنها.
9. **رقم واتساب الأكاديمية**: `201023290018`.

---

## 3) قواعد الأمان (Security Rules — إلزامية)

### قواعد عامة
- كل authorization يتم **Server-side فقط**. الـclient guard مجرد UX.
- كل API endpoint يبدأ بـ `requireX()` قبل أي DB write.
- كل بيانات مدخلة من المستخدم تُمرَّر عبر Zod schema.
- Passwords تُخزَّن bcrypt (cost=10) فقط.
- Sessions = JWT signed بـ`AUTH_SECRET` (32+ char)، مخزّن في HttpOnly + Secure + SameSite=lax cookie.
- Rate limiting على `/api/auth/login`: 20 محاولة/IP و5 محاولات/username كل 15 دقيقة (جدول `LoginAttempt`).
- Force password change عند أول دخول (`mustChangePassword=true` عند إنشاء الحساب).
- Admin password reset endpoint يفعّل `mustChangePassword` تلقائيًا.

### قواعد الأدوار
```
Student  → يرى بياناته فقط، لا شيء عن طالبة أخرى.
Teacher  → يرى طالبات مرتبطات به عبر Active Enrollment للعام الحالي فقط.
         → لا يعدّل بيانات admin أو teacher آخر.
         → لا يصل لطالبات معلمة أخرى.
Admin    → كل شيء.
```

### قواعد Enrollment (مهمة)
- العلاقة الحقيقية بين الطالبة والبرنامج/الحلقة **دائمًا** عبر `Enrollment` (لا حقول مباشرة على `Student`).
- Enrollment له `academicYear` + `status` (active/paused/completed/withdrawn).
- عند نقل طالبة بين حلقات أو برامج **لا يُحذف** enrollment قديم — يُعطَّل (`status = completed / withdrawn`) ويُضاف enrollment جديد.
- أي teacher-side query يستخدم `academicYear = currentAcademicYear()` و `status = 'active'`.

### أمثلة على enforcement
```ts
// كل teacher endpoint يبدأ بـ:
const auth = await requireTeacher();
if (!auth.ok) return auth.response;
// وبعدها:
const owns = await assertTeacherOwnsStudent(auth.ctx.teacherId, studentId);
if (!owns) return NextResponse.json({ error: "..." }, { status: 403 });
```

---

## 4) Data Model (Prisma)

### Users & Roles
- `User(id, username unique, email? unique, passwordHash, role, fullName, phone?, avatarUrl?, isActive, mustChangePassword, lastLoginAt, timestamps)`
- `Student(id, userId unique, gender, birthDate?, guardianName?, guardianPhone?, notes?, joinedAt)`
- `Teacher(id, userId unique, bio?, specialty?, joinedAt)`
- `Admin(id, userId unique)`

### Academic Structure
- `Program(id, name, slug unique, description?, isActive)` — البرامج الافتراضية: الحفظ / المراجعة والتثبيت / الإجازة.
- `Group(id, name, teacherId?, programId?, meetingProvider enum, meetLink?, maxStudents, isActive, academicYear?)`
- `Schedule(id, groupId, dayOfWeek 0-6, startTime "HH:mm", durationMins, timezone)` — قوالب أسبوعية.
- `Enrollment(id, studentId, academicYear, programId?, groupId?, startDate, endDate?, status enum, notes?)` — **مصدر الحقيقة للعلاقة الحالية**.

### Lesson & Evaluation
- `MemorizationPlan(id, studentId unique, currentSurah?, currentAyah[From/To]?, reviewSurah?, reviewAyah[From/To]?, progressPct, notes?)`
- `Lesson(id, groupId, studentId?, scheduledAt, status enum, meetLink?, newPortion?, reviewPortion?, errorsCount?, errorsType?, hasNewMemorization, homework?, teacherNotes?, rescheduledTo?)`
- `Attendance(id, lessonId, studentId, status enum {present/absent/late/excused}, note?)` — unique(lessonId, studentId)
- `Evaluation(id, lessonId unique, studentId, memorization/review/tajweed/commitment: EvaluationGrade, overallNote?)`
  - `EvaluationGrade`: excellent / very_good / good / needs_review.

### Payments
- `Payment(id, studentId, amount Decimal, currency EGP, monthCovered "YYYY-MM", method 'instapay', proofUrl?, status enum {pending/confirmed/rejected}, submittedAt, confirmedAt?, confirmedBy?, note?)`
- سعر الاشتراك: **500 EGP/شهر** عبر Instapay.
- **لا إيقاف تلقائي عند التأخر** — يظهر badge "متأخر" فقط.

### Security Support
- `LoginAttempt(id, ipHash, username?, success, createdAt)` — للـrate limiting.

---

## 5) Roles & Features

### 🌐 الموقع العام (Public)
- Home كامل: Hero + لماذا سَنَا + البرامج + طريقة الدراسة + المعلمات + آراء الطالبات + FAQ + CTA.
- زر التسجيل يوجّه لواتساب `201023290018` (لا تسجيل ذاتي في المنصة).
- Login + Forgot Password (يوجّه لواتساب).

### 👨‍💼 Admin Panel
| الصفحة | الوصف |
|---|---|
| `/admin` | Dashboard: طالبات نشطات + معلمات + حلقات + حصص الأسبوع + مدفوعات معلقة |
| `/admin/students` | قائمة + إضافة (username auto-generated من الاسم العربي، email اختياري، ينشئ enrollment للعام الحالي تلقائيًا) |
| `/admin/enrollments` | تسجيلات كل عام دراسي مع chips فلترة |
| `/admin/teachers` | قائمة + إضافة |
| `/admin/groups` | كروت + إنشاء (مواعيد أسبوعية ديناميكية + meetingProvider + meetLink + academicYear) |
| `/admin/schedules` | عرض أسبوعي مقسم بالأيام (يبدأ من السبت) |
| `/admin/payments` | مراجعة مدفوعات معلقة، confirm/reject بضغطة |

### 👩‍🏫 Teacher Panel (Mobile-First)
| الصفحة | الوصف |
|---|---|
| `/teacher` | حصص اليوم + join meet + بدء التسميع + إحصائيات أسبوع |
| `/teacher/students` | طالبات نشطات مقسّمة حسب الحلقة، بحث + فلترة |
| `/teacher/students/[id]` | بروفايل: خطة الحفظ، آخر 6 حصص، إحصائيات الحضور |
| `/teacher/students/[id]/plan` | تعديل خطة الحفظ (سورة/آيات/progress slider/ملاحظات) |
| `/teacher/groups` | حلقاتي + إدارة meet link inline |

**Quick Lesson Form (< دقيقة):**
- Attendance chips (حضور/مؤجلة/غياب)
- If present: hasNewMemorization + newPortion + reviewPortion + errorsCount + errorsType (chips) + evaluation (4 buttons) + homework + notes
- Single transaction: Lesson + Attendance + Evaluation

### 🎓 Student Panel (لم يُبنَ بعد — Phase 5)
المخطط:
- Dashboard: حصة اليوم + خطة الحفظ + آخر تقييم + حالة الاشتراك.
- الجدول الأسبوعي.
- خطة الحفظ + التقدم.
- سجل التسميع والتقييمات.
- رفع إثبات الدفع (Supabase Storage).
- تعديل الصورة وكلمة السر فقط (لا تعديل باقي البيانات).

---

## 6) Design System Rules

### القواعد الأساسية
- **RTL دائمًا**: كل الصفحات `dir="rtl"` + `lang="ar"`.
- **الأرقام والتواريخ**: استخدم `formatDateAr` و `formatTimeAr` من `@/lib/utils`.
- **أيام الأسبوع**: `dayNameAr(0..6)` — الأسبوع يبدأ من السبت في العرض.
- **الوقت والـLTR**: أضف `dir="ltr"` للأرقام والوقت والـusername والبريد.
- **Iconography**: Lucide react فقط.
- **Radius**: `rounded-2xl` للـcards، `rounded-xl` للصغيرة، `rounded-lg` للأزرار.

### Components (shadcn/ui)
موجودة في `src/components/ui/`: button, input, label, textarea, badge, card, dialog, dropdown-menu, select, table, tabs, toast, avatar, progress, separator.

### Shared Components
- `PageHeader` من `@/components/page-header` — عنوان + وصف + زر action اختياري.
- `LogoutButton` من `@/components/logout-button`.

### قواعد UX ثابتة
- لا تُطلَق تنبيهات JS (`alert`) — استخدم toast أو inline error.
- الأزرار الحمراء (destructive) فقط للحذف/الرفض.
- لا "Are you sure?" على أفعال reversible.
- أظهر أهم المعلومات أولاً، التفاصيل داخل صفحة العنصر.
- التقييمات: 4 مستويات نصية واضحة، **لا نجوم**.
- Tables تُغلَّف في `overflow-hidden rounded-2xl border`.

---

## 7) Auth Flow (تفصيلي)

```
1. المستخدم يفتح /login
2. يدخل username + password
3. POST /api/auth/login:
   - Zod validation
   - checkLoginRateLimit(ip, username) → 429 لو تجاوز الحد
   - authenticate(username, password) → bcrypt.compare
   - recordLoginAttempt (نجاح أو فشل)
   - lastLoginAt update
   - signSession (JWT via jose, HS256, 30 days)
   - setSessionCookie (HttpOnly, Secure prod, SameSite=lax)
   - redirect: /change-password إن mustChangePassword=true، وإلا dashboard.
4. Middleware:
   - Public paths pass through
   - No token → /login?callbackUrl=...
   - Invalid token → /login
   - mustChangePassword=true → force /change-password
   - Role mismatch → redirect to own dashboard
5. Logout: POST /api/auth/logout → clearSessionCookie → /login
```

### قواعد لا تُخالَف
- **لا تخزّن passwords plain** أبدًا.
- **لا تسجّل passwords في logs**.
- **لا تعرض** رسالة تفرّق بين "المستخدم غير موجود" و"كلمة سر خطأ" — استخدم رسالة موحّدة.
- **لا تسمح** بـEmail login لتجاوز username uniqueness — كلاهما مقبول في `authenticate()`.

---

## 8) Rules للأدوات والملفات

### Prisma
- Schema في `prisma/schema.prisma`.
- **لا تعمل `db push` في الإنتاج** — استخدم `prisma migrate dev --name <descriptive>` محلياً و `prisma migrate deploy` في CI/CD.
- Seed في `prisma/seed.ts` (`npm run db:seed`). ينشئ admin بـ `username=admin` و `mustChangePassword=true`.

### File Structure
```
src/
├── app/
│   ├── (app)/                   # protected: student/teacher/admin
│   │   ├── layout.tsx           # header + logout
│   │   ├── admin/{layout,page,students,teachers,groups,schedules,enrollments,payments}
│   │   ├── teacher/{layout,page,students,groups}
│   │   └── student/page.tsx
│   ├── api/
│   │   ├── auth/{login,logout,change-password}
│   │   ├── admin/{students,teachers,groups,payments,users/[id]/reset-password}
│   │   └── teacher/{lessons,plans/[studentId],groups/[id]/meet-link}
│   ├── login/{page,login-form}
│   ├── forgot-password/page
│   ├── change-password/{page,change-password-form}
│   ├── layout.tsx               # RTL, Tajawal, metadata
│   ├── globals.css              # sana palette tokens
│   └── page.tsx                 # public home
├── components/
│   ├── ui/                      # shadcn primitives
│   ├── page-header.tsx
│   └── logout-button.tsx
├── lib/
│   ├── auth.ts                  # JWT sign/verify, authenticate, DASHBOARD_ROUTES
│   ├── teacher-auth.ts          # requireTeacher + assertTeacherOwns*
│   ├── api-helpers.ts           # requireAdmin
│   ├── rate-limit.ts            # login rate limiter
│   ├── username.ts              # transliterate + ensureUnique
│   ├── academic-year.ts         # Sep→Aug math
│   ├── constants.ts             # WHATSAPP_NUMBER, whatsappLink()
│   ├── utils.ts                 # cn, formatDateAr, dayNameAr
│   ├── prisma.ts
│   └── supabase.ts              # Storage helpers
├── middleware.ts                # session + role guard + force change-password
└── hooks/use-toast.ts
```

### Environment Variables
```env
DATABASE_URL=postgresql://...           # Supabase pooler (6543, pgbouncer=true)
DIRECT_URL=postgresql://...             # Supabase direct (5432) — for migrations
AUTH_SECRET=<32+ chars random>
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server only>
SUPABASE_STORAGE_BUCKET=sana-uploads
NEXT_PUBLIC_WHATSAPP_NUMBER=201023290018
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Commands
```bash
npm run dev         # dev server
npm run build       # production build
npx prisma generate # after schema change
npx prisma migrate dev --name <name>  # local migration
npm run db:seed     # admin + programs
npx tsc --noEmit    # typecheck
```

---

## 9) قواعد التطوير (Coding Rules)

### DO
- ✅ Server Components افتراضيًا. `"use client"` فقط عند الحاجة لـstate/effects.
- ✅ Zod validation على كل API endpoint.
- ✅ `requireAdmin()` أو `requireTeacher()` قبل أي DB write.
- ✅ `assertTeacherOwns*` قبل أي تعديل على student/lesson/group.
- ✅ استخدم `currentAcademicYear()` لكل query متعلق بالطالبات النشطات.
- ✅ Transactions (`prisma.$transaction`) للعمليات المتعددة (مثل Lesson + Attendance + Evaluation).
- ✅ Mobile-first في Teacher Panel.
- ✅ اسم metadata عربي دائمًا.
- ✅ اختبار الـauthorization بمحاولة الوصول لـID لا يخص المستخدم.

### DON'T
- ❌ لا تعرض بيانات طالبة لطالبة أخرى مهما بلغت الظروف.
- ❌ لا تسمح لمعلمة بالوصول لطالبات معلمة أخرى.
- ❌ لا تستخدم `if (role === "admin")` كحماية وحيدة — لازم يكون في السيرفر.
- ❌ لا تحذف Enrollment تاريخي عند نقل الطالبة.
- ❌ لا تضيف comments في الكود إلا لو الـWHY غير واضح.
- ❌ لا تضيف emojis إلا لو المستخدم طلب.
- ❌ لا تنشئ ملفات `*.md` documentation بدون طلب.
- ❌ لا تحاول تنفيذ Supabase Auth أو NextAuth — Custom JWT فقط.
- ❌ لا تخلط الـLogin بين email و username في UI (username هو الأساسي).
- ❌ لا تدفع لـmain بدون طلب.

---

## 10) الحالة الحالية

### ✅ منجَز
- Phase 0-1: Branding + RTL + Prisma schema + Auth + Home + Login.
- Phase 2 (Foundation Hardening): Username system, Enrollment model, Academic year, Rate limiting, Force password change, Meeting provider enum.
- Phase 3: Admin panel كامل (Students, Teachers, Groups, Schedules, Enrollments, Payments).
- Phase 4: Teacher panel كامل مع Server-side authorization + Quick lesson form.

### ⏳ متبقٍ
- **Phase 5**: Student Panel (Dashboard, Schedule, Plan view, Lesson history, Payment upload).
- **Phase 6**: صفحات About/Programs/FAQ منفصلة (اختياري).
- **Phase 7**: Deploy على Vercel + ربط Supabase + Migrations + Seed + Security review نهائي.
- **Notifications**: مؤجلة لـPhase Post-MVP (WhatsApp/Email).

### قبل الإطلاق (Pre-Launch Checklist)
- [ ] `prisma migrate dev --name init` على DB حقيقي.
- [ ] `npm run db:seed` وتغيير admin password فورًا.
- [ ] Security review: محاولة الوصول لـIDs غير مصرّح بها من كل دور.
- [ ] اختبار على موبايل (Teacher).
- [ ] ربط الدومين + HTTPS.
- [ ] Backups تلقائية على Supabase.
- [ ] Vercel env vars مضبوطة.

---

## 11) نبرة التواصل مع المستخدمين

- **الطابع**: احترام + دفء + وقار.
- **الضمير**: مؤنث (الطالبة، المعلمة).
- **لا مبالغة تسويقية**، ولا مصطلحات تقنية أمام الطالبات.
- **رسائل الخطأ**: مفهومة، بدون كلمات مثل "Server Error 500". مثال: "تعذّر حفظ الحصة، حاولي مرة أخرى".
- **الأزرار**: أفعال قصيرة (حفظ، إلغاء، دخول، بدء التسميع).
- **الاختصارات**: تجنّب "OK" و"Cancel" — قل "تم" و"إلغاء".

---

## 12) قواعد التعامل مع الـAI/المطور الجديد

عند البدء في أي feature أو تعديل:
1. اقرأ هذا الملف كاملاً.
2. راجع `prisma/schema.prisma`.
3. راجع `src/lib/auth.ts` و `src/lib/teacher-auth.ts` و `src/lib/api-helpers.ts`.
4. ابحث عن مثال مشابه قبل كتابة من الصفر.
5. اكتب `requireX()` + `assertOwns()` قبل أي كتابة للـDB.
6. شغّل `npx tsc --noEmit` و `next build` قبل الـcommit.
7. commit message بالإنجليزية، وصفي، بدون emoji.
8. لا تدفع بدون تأكيد من صاحب المشروع (`amrsakr-ux`).

---

_آخر تحديث: بعد إتمام Phase 4._
_مطوّر المشروع: amrsakr-ux._
_البرانش: `claude/quran-academy-platform-1564yn`._
