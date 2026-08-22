import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSection } from "@/components/HeroSection";
import { HomeHelpDialog } from "@/components/HomeHelpDialog";
import { ImpactStories } from "@/components/ImpactStories";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Users, Lock, CreditCard, Database, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-background">
      <Helmet>
        <title>Tuendelee Fundometer — Live Fundraising for Students</title>
        <meta
          name="description"
          content="Pledge, donate and follow live fundraising progress for Tuendelee Foundation projects supporting bright, financially disadvantaged students."
        />
        <link rel="canonical" href="https://tuendelee-fundometer.lovable.app/" />
        <meta property="og:url" content="https://tuendelee-fundometer.lovable.app/" />
      </Helmet>

      {/* Language selector */}
      <div className="container mx-auto px-4 pt-3 flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Impact Stories (admin-managed video / photo / audio) */}
      <ImpactStories />

      {/* Help Button */}
      <HomeHelpDialog />

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            {t("home.heading")}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            {t("home.subheading")}
          </p>
        </div>

        {/* Primary CTA - Join Event */}
        <div className="flex justify-center mb-16">
          <div className="bg-gradient-primary text-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-3 text-center">{t("home.ctaCardTitle")}</h3>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/join")}
                className="bg-white text-primary hover:bg-white/90 font-bold text-base py-6 px-8 shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                {t("home.ctaButton")}
              </Button>
            </div>
          </div>
        </div>


        {/* Security & Data Protection Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-success mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              {t("security.title")}
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("security.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <Lock className="w-8 h-8 text-success mb-2" />
                <CardTitle>{t("security.encryptionTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("security.encryptionBody")}</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CreditCard className="w-8 h-8 text-success mb-2" />
                <CardTitle>{t("security.paymentTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("security.paymentBody")}</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <Database className="w-8 h-8 text-success mb-2" />
                <CardTitle>{t("security.storageTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("security.storageBody")}</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <Shield className="w-8 h-8 text-success mb-2" />
                <CardTitle>{t("security.privacyTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("security.privacyBody")}</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CheckCircle className="w-8 h-8 text-success mb-2" />
                <CardTitle>{t("security.trustedTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("security.trustedBody")}</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <Users className="w-8 h-8 text-success mb-2" />
                <CardTitle>{t("security.trackingTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("security.trackingBody")}</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {t("how.title")}
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-bold mb-2">{t("how.step1Title")}</h4>
              <p className="text-sm text-muted-foreground">{t("how.step1Body")}</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-bold mb-2">{t("how.step2Title")}</h4>
              <p className="text-sm text-muted-foreground">{t("how.step2Body")}</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <p className="text-xl mb-6 font-medium">{t("home.finalCtaText")}</p>
          <Button 
            size="lg" 
            onClick={() => navigate("/join")}
            className="bg-gradient-primary hover:opacity-90 text-white font-bold text-lg py-6 px-10"
          >
            <Users className="w-5 h-5 mr-2" />
            {t("home.finalCtaButton")}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">{t("home.finalCtaNote")}</p>
        </div>
      </div>
    </div>
  );
};

export default Index;