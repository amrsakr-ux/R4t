import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  CalendarCheck,
  Star,
  MessageCircle,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/201000000000?text=" + encodeURIComponent("السلام عليكم، أرغب في التسجيل بأكاديمية سَنَا");

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <Hero />
      <WhyUs />
      <Programs />
      <HowClassWorks />
      <Teachers />
      <Testimonials />
      <FAQ />
      <CTA />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold text-primary">سَنَا</div>
            <div className="text-[11px] text-muted-foreground">أكاديمية القرآن الكريم</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          <a href="#why" className="hover:text-primary">لماذا سَنَا</a>
          <a href="#programs" className="hover:text-primary">البرامج</a>
          <a href="#how" className="hover:text-primary">كيف تكون الحصة</a>
          <a href="#teachers" className="hover:text-primary">المعلمات</a>
          <a href="#faq" className="hover:text-primary">الأسئلة الشائعة</a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">ابدئي الآن</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-pattern">
      <div className="container relative grid gap-10 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            أكاديمية أونلاين للطالبات والأطفال
          </span>
          <h1 className="mb-5 text-4xl font-bold leading-tight text-primary md:text-5xl lg:text-6xl">
            ابدئي رحلتكِ في حفظ كتاب الله
            <span className="mt-2 block text-accent">في بيئة هادئة وراقية</span>
          </h1>
          <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
            حلقات أونلاين بإشراف معلمات متخصصات، ومتابعة مستمرة لخطة الحفظ والمراجعة،
            بأسلوب يجمع بين الإتقان والرحمة والانضباط.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="ms-2 h-5 w-5" />
                ابدئي الآن عبر واتساب
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#programs">تعرّفي على الأكاديمية</a>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <Stat label="طالبة" value="+120" />
            <Stat label="معلمة متخصصة" value="+12" />
            <Stat label="حلقة أسبوعية" value="+30" />
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative aspect-square w-full max-w-md">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/20" />
            <div className="absolute inset-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">حصة اليوم</div>
                    <div className="text-xs text-muted-foreground">السبت — 6:00 صباحًا</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <PlanRow label="الجديد" text="سورة آل عمران — ربع" />
                  <PlanRow label="المراجعة" text="سورة البقرة — ربع" />
                </div>
                <div className="rounded-lg bg-primary p-3 text-center text-sm font-medium text-primary-foreground">
                  🟢 دخول الحصة
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary md:text-3xl">{value}</div>
      <div className="text-xs text-muted-foreground md:text-sm">{label}</div>
    </div>
  );
}

function PlanRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{text}</div>
    </div>
  );
}

function WhyUs() {
  const items = [
    { icon: HeartHandshake, title: "بيئة راقية وهادئة", text: "نهتم بأدب الطلب قبل حفظ المتن؛ حلقاتنا محضن للطمأنينة والالتزام." },
    { icon: GraduationCap, title: "معلمات متخصصات", text: "إجازات في القرآن الكريم وخبرة في تدريس الطالبات والأطفال." },
    { icon: CalendarCheck, title: "متابعة يومية", text: "خطة حفظ ومراجعة واضحة، وتقييم بعد كل حصة تصلكِ فور انتهائها." },
    { icon: Users, title: "حلقات مركّزة", text: "أعداد صغيرة داخل الحلقة لتمنح كل طالبة نصيبها من التسميع والتوجيه." },
  ];
  return (
    <section id="why" className="container py-20">
      <SectionHeader eyebrow="لماذا سَنَا" title="أكاديمية بُنيت على الإتقان والرحمة" />
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-border bg-card p-6 transition hover:border-accent/50 hover:shadow-sm">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 font-semibold">{it.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{it.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Programs() {
  const programs = [
    { name: "برنامج الحفظ", desc: "خطة حفظ متدرجة من الجزء الثلاثين وحتى ختم القرآن، بأسلوب مرن يناسب مستواكِ." },
    { name: "برنامج المراجعة والتثبيت", desc: "لمن حفظ القرآن أو أجزاءً منه ويرغب في تثبيت الحفظ ومراجعته بطريقة منهجية." },
    { name: "برنامج الإجازة في القرآن الكريم", desc: "للطالبات المتقدمات الراغبات في الحصول على إجازة برواية حفص عن عاصم بشروطها." },
  ];
  return (
    <section id="programs" className="bg-muted/40 py-20">
      <div className="container">
        <SectionHeader eyebrow="البرامج المتاحة" title="اختاري ما يناسب مستواكِ" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {programs.map((p, i) => (
            <div key={p.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-accent/15 font-bold text-accent">
                {i + 1}
              </div>
              <h3 className="mb-3 text-xl font-semibold text-primary">{p.name}</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              <Button asChild variant="ghost" size="sm" className="p-0 text-primary hover:bg-transparent">
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  التسجيل في البرنامج ←
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowClassWorks() {
  const steps = [
    { n: 1, title: "التسجيل", text: "تواصلي معنا عبر واتساب لاختيار البرنامج والوقت المناسب." },
    { n: 2, title: "الحلقة", text: "تُلحقين بحلقة مع معلمة متخصصة ومجموعة صغيرة من الطالبات." },
    { n: 3, title: "التسميع", text: "في كل حصة تسمّعين الجديد والمراجعة، مع توجيه في التجويد." },
    { n: 4, title: "المتابعة", text: "تقييم مكتوب بعد كل حصة وخطة أسبوعية واضحة لتقدمكِ." },
  ];
  return (
    <section id="how" className="container py-20">
      <SectionHeader eyebrow="طريقة الدراسة" title="كيف تسير الحصة؟" />
      <div className="mt-12 grid gap-4 md:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 text-4xl font-bold text-accent/60">{s.n.toString().padStart(2, "0")}</div>
            <h3 className="mb-2 font-semibold text-primary">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Teachers() {
  return (
    <section id="teachers" className="bg-muted/40 py-20">
      <div className="container">
        <SectionHeader eyebrow="المعلمات" title="معلمات مؤهلات وذوات إجازة" />
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          جميع معلمات سَنَا حاصلات على إجازات في القرآن الكريم أو دارسات في كليات متخصصة،
          مع خبرة عملية في تعليم الطالبات والأطفال.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {["أ. سارة", "أ. مريم", "أ. فاطمة"].map((name) => (
            <div key={name} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {name.split(" ")[1]?.[0]}
              </div>
              <div className="font-semibold">{name}</div>
              <div className="text-sm text-muted-foreground">إجازة برواية حفص عن عاصم</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "أم يوسف", text: "ابنتي تحفظ في سَنَا منذ 6 أشهر، والتقدم ملحوظ. المعلمة صبورة والمتابعة يومية." },
    { name: "الطالبة نور", text: "المنصة نظمت لي خطة حفظي، وأصبح عندي رغبة حقيقية في إتمام القرآن." },
    { name: "أم فاطمة", text: "أعجبني جدًا التقييم بعد كل حصة، أستطيع متابعة تقدم ابنتي بكل وضوح." },
  ];
  return (
    <section className="container py-20">
      <SectionHeader eyebrow="آراء الطالبات" title="ماذا يقلن عنّا" />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((t) => (
          <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
            <div className="text-sm font-semibold text-primary">{t.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "هل الأكاديمية للنساء والأطفال فقط؟", a: "نعم، سَنَا مخصصة حاليًا للطالبات والأطفال، بإشراف معلمات متخصصات." },
    { q: "كم عدد الحصص في الأسبوع؟", a: "يختلف حسب البرنامج، وعادةً ما تكون حصتين إلى ثلاث حصص أسبوعيًا." },
    { q: "ما هي رسوم الاشتراك؟", a: "الاشتراك الشهري 500 جنيه مصري، ويتم التحويل عبر Instapay." },
    { q: "كيف تُعقد الحصة؟", a: "الحصة أونلاين عبر Google Meet أو Zoom، والمعلمة تشارك الرابط قبل موعدها." },
    { q: "هل يمكنني تأجيل حصة؟", a: "نعم، بالتنسيق المسبق مع المعلمة، ويتم توثيق التأجيل على المنصة." },
  ];
  return (
    <section id="faq" className="bg-muted/40 py-20">
      <div className="container max-w-3xl">
        <SectionHeader eyebrow="الأسئلة الشائعة" title="أهم ما يدور في ذهنكِ" />
        <div className="mt-12 space-y-3">
          {items.map((it, i) => (
            <details key={i} className="group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-primary">
                {it.q}
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container py-20">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-center text-primary-foreground md:p-16">
        <div className="absolute inset-0 bg-pattern opacity-10" />
        <div className="relative">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">ابدئي رحلتكِ اليوم</h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/85">
            تواصلي معنا الآن وابدئي أولى خطواتكِ نحو حفظ كتاب الله في بيئة تليق بكِ.
          </p>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="ms-2 h-5 w-5" />
              التسجيل عبر واتساب
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground md:flex-row">
        <div>© {new Date().getFullYear()} أكاديمية سَنَا. جميع الحقوق محفوظة.</div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-primary">تسجيل الدخول</Link>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-primary">تواصلي معنا</a>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</div>
      <h2 className="text-3xl font-bold text-primary md:text-4xl">{title}</h2>
    </div>
  );
}
