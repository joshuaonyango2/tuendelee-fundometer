import { GraduationCap, Heart, Users, Target } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-background pb-16 pt-24">
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      <div className="container relative mx-auto px-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-6">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Supporting Education Since 2019
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Tuendelee Foundation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Empowering bright, financially disadvantaged students through scholarships, 
            mentorship, and career opportunities
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-primary flex items-center justify-center text-white">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">Scholarships</h3>
              <p className="text-sm text-muted-foreground">Full university support</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-secondary flex items-center justify-center text-white">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">Mentorship</h3>
              <p className="text-sm text-muted-foreground">Career guidance</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-success flex items-center justify-center text-white">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">Internships</h3>
              <p className="text-sm text-muted-foreground">Real experience</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-hero flex items-center justify-center text-white">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">Job Placement</h3>
              <p className="text-sm text-muted-foreground">Career success</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}