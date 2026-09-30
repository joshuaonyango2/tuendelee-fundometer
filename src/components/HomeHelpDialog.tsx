import { T } from "@/components/T";
import { HelpCircle, X, Users, DollarSign, CreditCard, TrendingUp, Shield, Search, Calendar, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";

export function HomeHelpDialog() {
  const { t } = useLanguage();
  return (
    <TooltipProvider>
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="lg"
                className="fixed bottom-6 right-6 rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 h-16 w-16 p-0 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-4 border-white animate-pulse hover:animate-none hover:scale-110"
              >
                <HelpCircle className="w-8 h-8" />
                <span className="sr-only"><T>{"Help"}</T></span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-base px-4 py-2 border-2 border-white shadow-lg">
            <p>{t("help.button")}</p>
          </TooltipContent>
        </Tooltip>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-3xl flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-primary" />
            <T>{"Fundometer - Complete Guide"}</T>
          </DialogTitle>
          <DialogDescription className="text-base">
            <T>{"Everything you need to know about using the Tuendelee Foundation Fundometer"}</T>
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-xl mb-2"><T>{"What is the Fundometer?"}</T></h3>
              <p className="text-base text-muted-foreground">
                <T>{"The Fundometer is a live fundraising platform for the Tuendelee Foundation. It allows donors to make pledges, track contributions in real-time, and see the collective impact of all donations toward our projects. Think of it as a transparent, interactive way to support the Tuendelee Foundation's mission together."}</T>
              </p>
            </div>

            {/* Detailed Feature Explanations */}
            <Accordion type="single" collapsible className="w-full">
              
              {/* Getting Started */}
              <AccordionItem value="getting-started">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-base"><T>{"Getting Started - Joining an Event"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p><strong><T>{"Step 1:"}</T></strong> Click the "Sign Up to Pledge & Track Progress" button on the home page.</p>
                  <p><strong><T>{"Step 2:"}</T></strong> <T>{"Fill in your details: Name, Email, and Phone Number."}</T></p>
                  <p><strong><T>{"Step 3:"}</T></strong> Click "Join Event" and you'll be instantly connected to the live fundraising room.</p>
                  <div className="bg-muted/50 p-3 rounded border-l-4 border-primary">
                    <p className="text-sm font-medium"><T>{"💡 Tip: You can rejoin the same event anytime by clicking the join button again."}</T></p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Making a Pledge */}
              <AccordionItem value="making-pledge">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-success" />
                    <span className="font-semibold text-base"><T>{"Making a Pledge or Donation"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p><T>{"Once inside the event room, you can contribute in two ways:"}</T></p>
                  
                  <div className="space-y-2 ml-4">
                    <div>
                      <p className="font-semibold text-primary"><T>{"Option 1: Pay Now"}</T></p>
                      <p><T>{"Make an immediate payment and your contribution is instantly recorded and displayed on the thermometer."}</T></p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-primary"><T>{"Option 2: Pledge to Pay Later"}</T></p>
                      <p><T>{"Commit to an amount now and pay within your preferred timeframe. You'll receive a pledge code to complete payment later."}</T></p>
                    </div>
                  </div>

                  <p className="mt-3"><strong><T>{"How to make a pledge:"}</T></strong></p>
                  <ol className="list-decimal ml-6 space-y-1">
                    <li>Click the "Make a Pledge" button in the event room</li>
                    <li><T>{"Enter your pledge amount and select your currency (USD, EUR, KES, or GBP)"}</T></li>
                    <li><T>{"Choose your payment method (M-Pesa, PayPal, Bank Transfer, or Benevity)"}</T></li>
                    <li>Select "Pay Now" or "Pay Later"</li>
                    <li><T>{"If paying now, follow the payment instructions for your chosen method"}</T></li>
                    <li><T>{"If pledging for later, remember your details (name/email/phone) to find your pledge later"}</T></li>
                  </ol>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-success">
                    <p className="text-sm font-medium"><T>{"✅ Your pledge is recorded immediately and appears in the recent pledges list!"}</T></p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Payment Methods */}
              <AccordionItem value="payment-methods">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-base"><T>{"Payment Methods Explained"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p><T>{"We accept multiple payment methods for your convenience:"}</T></p>
                  
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="text-green-600">●</span> <T>{"M-Pesa (Kenya)"}</T>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <T>{"Popular mobile money payment. You'll receive paybill/till number and account details. Send payment via M-Pesa app or USSD code, then confirm your payment in the app. Remember to include the M-Pesa payment reference (transaction ID) to facilitate tracking of your donation."}</T>
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="text-blue-600">●</span> <T>{"PayPal"}</T>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <T>{"International payments accepted. You'll receive PayPal.me link or email address. Send payment through PayPal, then mark as paid in the app. Remember to include the PayPal transaction ID to facilitate tracking of your donation."}</T>
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="text-purple-600">●</span> <T>{"Bank Transfer"}</T>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <T>{"Direct bank transfers via Standard Chartered or other banks. You'll receive complete bank account details including account number, bank name, and SWIFT code if needed."}</T>
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="text-orange-600">●</span> <T>{"Benevity"}</T>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <T>{"Corporate giving platform. If your employer uses Benevity for matching donations, you'll receive instructions on how to donate through your company's portal."}</T>
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-blue-500">
                    <p className="text-sm font-medium"><T>{"🔒 Security: We never store your payment credentials. All transactions are processed through trusted providers."}</T></p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Finding and Paying Pledges */}
              <AccordionItem value="find-pay-pledge">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-base"><T>{"Finding & Paying Existing Pledges"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p>If you made a "Pay Later" pledge and want to complete payment:</p>
                  
                  <ol className="list-decimal ml-6 space-y-2">
                    <li>
                      <strong><T>{"Inside Event Room:"}</T></strong> Look for the "Find My Pledge" or "Pay Existing Pledge" button
                    </li>
                    <li><T>{"Enter your name, email, or phone number (any of these that you used when creating the pledge)"}</T></li>
                    <li><T>{"Your pledge details will appear including amount and current status"}</T></li>
                    <li><T>{"Choose your preferred payment method (you can change from your original selection)"}</T></li>
                    <li><T>{"Follow the payment instructions provided"}</T></li>
                    <li>Confirm your payment to update the pledge status to "Paid"</li>
                  </ol>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-amber-500 mt-3">
                    <p className="text-sm font-medium"><T>{"📝 Can't find your pledge? Contact the event organizer with your details - they can help you locate your pledge from the admin dashboard."}</T></p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Live Tracking */}
              <AccordionItem value="live-tracking">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold text-base"><T>{"Live Progress Tracking"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p><T>{"The Fundometer provides real-time transparency of the fundraising progress:"}</T></p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold"><T>{"Fundraising Thermometer"}</T></p>
                      <p className="text-sm text-muted-foreground">
                        <T>{"Visual display showing total raised, goal amount, and percentage achieved. Updates instantly when new payments are confirmed."}</T>
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold"><T>{"Recent Pledges Feed"}</T></p>
                      <p className="text-sm text-muted-foreground">
                        <T>{"Live stream of all pledges made during the event. Shows donor names, amounts, payment status (Paid/Pending), and timestamps. Updates automatically as new pledges come in."}</T>
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold"><T>{"Total Statistics"}</T></p>
                      <p className="text-sm text-muted-foreground">
                        <T>{"Key metrics including total amount raised, number of donors, average pledge size, and breakdown by payment status."}</T>
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-purple-500">
                    <p className="text-sm font-medium"><T>{"🎯 All data updates in real-time! No need to refresh the page - you see contributions as they happen."}</T></p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Event Information */}
              <AccordionItem value="event-info">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-500" />
                    <span className="font-semibold text-base"><T>{"Event Information & Details"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p><T>{"Each fundraising event includes:"}</T></p>
                  
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong><T>{"Event Name:"}</T></strong> <T>{"Displayed at the top of the event room"}</T></li>
                    <li><strong><T>{"Event Code:"}</T></strong> <T>{"Unique code for joining the event"}</T></li>
                    <li><strong><T>{"Fundraising Goal:"}</T></strong> <T>{"Target amount to be raised"}</T></li>
                    <li><strong><T>{"Event Description:"}</T></strong> <T>{"Details about what the funds will support"}</T></li>
                    <li><strong><T>{"Start/End Dates:"}</T></strong> <T>{"Event duration (if specified)"}</T></li>
                    <li><strong><T>{"Organizer Contact:"}</T></strong> <T>{"Who to reach for questions"}</T></li>
                  </ul>

                  <p className="mt-2"><T>{"You can view all event details by clicking the info icon in the event room header."}</T></p>
                </AccordionContent>
              </AccordionItem>

              {/* Proof of payment & verification */}
              <AccordionItem value="proof-verification">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-base"><T>{"Proving & Verifying Your Payment"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p><T>{"After you send the money, confirm it in the app so it is counted once and only once:"}</T></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li><T>{"Open"}</T> <strong><T>{"Find My Pledge"}</T></strong> <T>{"and search with your name, email or phone number."}</T></li>
                    <li><T>{"Choose the method you actually used (you can change it if you paid differently)."}</T></li>
                    <li>
                      <T>{"Enter your"}</T> <strong><T>{"transaction code"}</T></strong><T>{": the M-Pesa code from the Safaricom SMS (10 characters), the PayPal transaction ID (17 characters), or your bank/Benevity reference."}</T>
                    </li>
                    <li>
                      <strong><T>{"Upload your receipt or screenshot"}</T></strong> <T>{"(image or PDF, up to 5MB). It is kept private — only the fundraising admin can open it."}</T>
                    </li>
                  </ol>
                  <p className="text-sm text-muted-foreground">
                    <T>{"The system validates the code format instantly and warns if that code was already used, so duplicate or double payments are caught. The admin then verifies it, you receive a receipt by email, and the thermometer moves your amount from pledged (blue) to paid (green)."}</T>
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Impact stories & channel */}
              <AccordionItem value="impact-media">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold text-base"><T>{"Watching Impact Stories & Our Videos"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p>
                    <T>{"The homepage plays the newest impact story uploaded by the foundation — a video, a photo or a photo with a voice note you can listen to."}</T>
                  </p>
                  <p>
                    <T>{"On the"}</T> <strong><T>{"Impact Stories"}</T></strong> <T>{"page you can also browse our YouTube channel and pick any video you want to watch, then pledge straight from the same page."}</T>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <T>{"Everything you read here — texts, stories and translations (English, Italian, French, Kiswahili) — is managed by the foundation's admin, so the content is always current."}</T>
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Security & Privacy */}

              <AccordionItem value="security">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-base"><T>{"Security & Privacy Protection"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p><T>{"Your security and privacy are our top priorities:"}</T></p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold"><T>{"Encrypted Data Transfer"}</T></p>
                      <p className="text-sm text-muted-foreground">
                        <T>{"All data transmitted between your device and our servers is encrypted using SSL/TLS (the same security technology used by banks)."}</T>
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold"><T>{"No Payment Credential Storage"}</T></p>
                      <p className="text-sm text-muted-foreground">
                        <T>{"We never store credit card numbers, M-Pesa PINs, or PayPal passwords. Payments are processed through trusted third-party providers."}</T>
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold"><T>{"Data Privacy"}</T></p>
                      <p className="text-sm text-muted-foreground">
                        <T>{"Your personal information (name, email, phone) is used solely for event participation and donation tracking. We never share or sell your data to third parties."}</T>
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold"><T>{"Secure Database"}</T></p>
                      <p className="text-sm text-muted-foreground">
                        <T>{"All pledge and donor information is stored in encrypted databases with restricted access and regular security audits."}</T>
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Help & Support */}
              <AccordionItem value="support">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    <span className="font-semibold text-base"><T>{"Getting Help & Support"}</T></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-base">
                  <p><T>{"Need assistance? Here's how to get help:"}</T></p>
                  
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong><T>{"In-App Help:"}</T></strong> <T>{"Click the help icon (❓) in any event room for context-specific guidance"}</T></li>
                    <li><strong><T>{"Lost Pledge:"}</T></strong> <T>{"Contact the event organizer with your name and email"}</T></li>
                    <li><strong><T>{"Payment Issues:"}</T></strong> <T>{"Check the payment confirmation screen for troubleshooting tips"}</T></li>
                    <li><strong><T>{"Technical Problems:"}</T></strong> <T>{"Reach out to the event organizer who can escalate to technical support"}</T></li>
                    <li><strong><T>{"General Questions:"}</T></strong> <T>{"Contact Tuendelee Foundation directly"}</T></li>
                  </ul>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-teal-500 mt-3">
                    <p className="text-xs font-medium mb-2"><T>{"💬 Event organizers have access to all pledge details and can assist with most issues quickly."}</T></p>
                    <div className="space-y-1">
                      <p className="text-xs"><strong><T>{"Email:"}</T></strong> <T>{"donor-relations@tuendelee.org"}</T></p>
                      <p className="text-xs"><strong><T>{"Phone:"}</T></strong> <T>{"+254 111 209249 or +254 10 30 90 308"}</T></p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span> <T>{"Quick Tips for Success"}</T>
              </h3>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><T>{"Remember your details (name, email, or phone) to easily find your pledges later"}</T></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><T>{"If pledging to pay later, set a reminder to complete payment"}</T></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><T>{"You can rejoin the same event multiple times to see updated progress"}</T></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><T>{"Payment methods can be changed when paying an existing pledge"}</T></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><T>{"The app works on all devices - desktop, tablet, and mobile phones"}</T></span>
                </li>
              </ul>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}
