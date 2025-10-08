import tuendeleeLogo from "@/assets/tuendelee-logo.jpg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-background pb-16 pt-24">
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      <div className="container relative mx-auto px-4">
        <div className="text-center">
          <div className="mb-8">
            <img 
              src={tuendeleeLogo}
              alt="Tuendelee Foundation Logo"
              className="w-96 md:w-[500px] mx-auto h-auto"
            />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Tuendelee Foundation
            </span>
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-semibold mb-6">
            <span className="text-foreground">
              Fundraising Thermometer (Fundometer)
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}