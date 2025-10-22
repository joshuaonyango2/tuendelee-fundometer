import tuendeleeLogo from "@/assets/tuendelee-logo.jpg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-background pb-8 pt-12">
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      <div className="container relative mx-auto px-4">
        <div className="text-center">
          <div className="mb-4">
            <img 
              src={tuendeleeLogo}
              alt="Tuendelee Foundation Logo"
              className="w-64 md:w-80 mx-auto h-auto"
            />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Tuendelee Foundation Fundometer
            </span>
          </h1>
        </div>
      </div>
    </section>
  );
}