import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImpactStories } from "@/components/ImpactStories";
import { YouTubeChannelPicker } from "@/components/YouTubeChannelPicker";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GraduationCap, HeartHandshake, Briefcase, ArrowRight } from "lucide-react";

const PAGE_URL = "https://tuendelee-fundometer.lovable.app/impact-stories";

const pillars = [
  {
    icon: GraduationCap,
    title: "Kenyan student scholarships",
    body: "Tuendelee Foundation raises funds so that bright, financially disadvantaged students can stay in school. Pledges made on the Fundometer go towards school fees and the learning costs that keep a place at school secure.",
  },
  {
    icon: HeartHandshake,
    title: "Mentorship alongside the money",
    body: "Education sponsorship in Kenya works best when a student is not left alone with it. Supported students are paired with mentors who follow their progress through the school year.",
  },
  {
    icon: Briefcase,
    title: "Career opportunities after school",
    body: "The support does not stop at graduation. The foundation connects students with career guidance and opportunities so that a scholarship turns into a livelihood.",
  },
];

export default function ImpactStoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Helmet>
        <title>Impact Stories — Kenyan Student Scholarships | Tuendelee</title>
        <meta
          name="description"
          content="See the impact behind Tuendelee Foundation: Kenyan student scholarships, mentorship and career support, with stories from the students donations reach."
        />
        <link rel="canonical" href={PAGE_URL} />
        <meta property="og:title" content="Impact Stories — Kenyan Student Scholarships | Tuendelee Foundation" />
        <meta
          property="og:description"
          content="Stories, photos and videos showing how education sponsorship in Kenya changes a student's path — and how your pledge helps."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={PAGE_URL} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Impact Stories — Tuendelee Foundation",
            url: PAGE_URL,
            description:
              "Kenyan student scholarships, mentorship and career support at Tuendelee Foundation, with impact stories from supported students.",
            isPartOf: {
              "@type": "WebSite",
              name: "Tuendelee Foundation Fundometer",
              url: "https://tuendelee-fundometer.lovable.app/",
            },
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 pt-3 flex justify-end">
        <LanguageSwitcher />
      </div>

      <header className="container mx-auto px-4 pt-6 pb-10 text-center max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Impact stories: what your pledge changes
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Tuendelee Foundation supports bright, financially disadvantaged students through
          scholarships, mentorship and career opportunities. This page collects the stories,
          photos, videos and voice notes shared by the foundation so you can see the work
          before you pledge.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="bg-gradient-primary text-white font-bold">
            <Link to="/join">
              Pledge or donate now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/">Back to the Fundometer</Link>
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-4 pb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Where donations to Kenyan students go
        </h2>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {pillars.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-primary/10">
              <CardHeader>
                <Icon className="w-8 h-8 text-primary mb-2" aria-hidden="true" />
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <YouTubeChannelPicker />
      </section>

      <ImpactStories />

      <section className="container mx-auto px-4 pb-16 max-w-3xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Ready to sponsor a student's education?
        </h2>
        <p className="text-base text-muted-foreground mb-6">
          Pledges are made in USD, EUR, KES or GBP and can be paid by M-Pesa, PayPal, bank
          transfer or Benevity. You can follow the live fundraising total on the Fundometer,
          come back later to mark a pledge as paid, and download your receipt.
        </p>
        <Button asChild size="lg" className="bg-gradient-primary text-white font-bold">
          <Link to="/join">
            Make a pledge
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
