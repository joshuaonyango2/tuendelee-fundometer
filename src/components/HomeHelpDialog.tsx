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

export function HomeHelpDialog() {
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
                <span className="sr-only">Help</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-base px-4 py-2 border-2 border-white shadow-lg">
            <p>Need Help? Click Here!</p>
          </TooltipContent>
        </Tooltip>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            Fundometer - Complete Guide
          </DialogTitle>
          <DialogDescription>
            Everything you need to know about using the Tuendelee Foundation Fundometer
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-lg mb-2">What is the Fundometer?</h3>
              <p className="text-sm text-muted-foreground">
                The Fundometer is a live fundraising platform for the Tuendelee Foundation. 
                It allows donors to make pledges, track contributions in real-time, and see the collective impact 
                of all donations toward our projects. Think of it as a transparent, interactive way to support 
                the Tuendelee Foundation's mission together.
              </p>
            </div>

            {/* Detailed Feature Explanations */}
            <Accordion type="single" collapsible className="w-full">
              
              {/* Getting Started */}
              <AccordionItem value="getting-started">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Getting Started - Joining an Event</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p><strong>Step 1:</strong> Click the "Sign Up to Pledge & Track Progress" button on the home page.</p>
                  <p><strong>Step 2:</strong> Fill in your details: Name, Email, and Phone Number.</p>
                  <p><strong>Step 3:</strong> Click "Join Event" and you'll be instantly connected to the live fundraising room.</p>
                  <div className="bg-muted/50 p-3 rounded border-l-4 border-primary">
                    <p className="text-xs font-medium">💡 Tip: You can rejoin the same event anytime by clicking the join button again.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Making a Pledge */}
              <AccordionItem value="making-pledge">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-success" />
                    <span className="font-semibold">Making a Pledge or Donation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>Once inside the event room, you can contribute in two ways:</p>
                  
                  <div className="space-y-2 ml-4">
                    <div>
                      <p className="font-semibold text-primary">Option 1: Pay Now</p>
                      <p>Make an immediate payment and your contribution is instantly recorded and displayed on the thermometer.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-primary">Option 2: Pledge to Pay Later</p>
                      <p>Commit to an amount now and pay within your preferred timeframe. You'll receive a pledge code to complete payment later.</p>
                    </div>
                  </div>

                  <p className="mt-3"><strong>How to make a pledge:</strong></p>
                  <ol className="list-decimal ml-6 space-y-1">
                    <li>Click the "Make a Pledge" button in the event room</li>
                    <li>Enter your pledge amount and select your currency (USD, EUR, KES, or GBP)</li>
                    <li>Choose your payment method (M-Pesa, PayPal, Bank Transfer, or Benevity)</li>
                    <li>Select "Pay Now" or "Pay Later"</li>
                    <li>If paying now, follow the payment instructions for your chosen method</li>
                    <li>If pledging for later, remember your details (name/email/phone) to find your pledge later</li>
                  </ol>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-success">
                    <p className="text-xs font-medium">✅ Your pledge is recorded immediately and appears in the recent pledges list!</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Payment Methods */}
              <AccordionItem value="payment-methods">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Payment Methods Explained</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>We accept multiple payment methods for your convenience:</p>
                  
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="text-green-600">●</span> M-Pesa (Kenya)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Popular mobile money payment. You'll receive paybill/till number and account details. 
                        Send payment via M-Pesa app or USSD code, then confirm your payment in the app. 
                        Remember to include the M-Pesa payment reference (transaction ID) to facilitate tracking of your donation.
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="text-blue-600">●</span> PayPal
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        International payments accepted. You'll receive PayPal.me link or email address. 
                        Send payment through PayPal, then mark as paid in the app. 
                        Remember to include the PayPal transaction ID to facilitate tracking of your donation.
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="text-purple-600">●</span> Bank Transfer
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Direct bank transfers via Standard Chartered or other banks. You'll receive complete 
                        bank account details including account number, bank name, and SWIFT code if needed.
                      </p>
                    </div>

                    <div className="border rounded-lg p-3">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="text-orange-600">●</span> Benevity
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Corporate giving platform. If your employer uses Benevity for matching donations, 
                        you'll receive instructions on how to donate through your company's portal.
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-blue-500">
                    <p className="text-xs font-medium">🔒 Security: We never store your payment credentials. All transactions are processed through trusted providers.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Finding and Paying Pledges */}
              <AccordionItem value="find-pay-pledge">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold">Finding & Paying Existing Pledges</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>If you made a "Pay Later" pledge and want to complete payment:</p>
                  
                  <ol className="list-decimal ml-6 space-y-2">
                    <li>
                      <strong>Inside Event Room:</strong> Look for the "Find My Pledge" or "Pay Existing Pledge" button
                    </li>
                    <li>Enter your name, email, or phone number (any of these that you used when creating the pledge)</li>
                    <li>Your pledge details will appear including amount and current status</li>
                    <li>Choose your preferred payment method (you can change from your original selection)</li>
                    <li>Follow the payment instructions provided</li>
                    <li>Confirm your payment to update the pledge status to "Paid"</li>
                  </ol>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-amber-500 mt-3">
                    <p className="text-xs font-medium">📝 Can't find your pledge? Contact the event organizer with your details - they can help you locate your pledge from the admin dashboard.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Live Tracking */}
              <AccordionItem value="live-tracking">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="font-semibold">Live Progress Tracking</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>The Fundometer provides real-time transparency of the fundraising progress:</p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold">Fundraising Thermometer</p>
                      <p className="text-xs text-muted-foreground">
                        Visual display showing total raised, goal amount, and percentage achieved. 
                        Updates instantly when new payments are confirmed.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold">Recent Pledges Feed</p>
                      <p className="text-xs text-muted-foreground">
                        Live stream of all pledges made during the event. Shows donor names, amounts, 
                        payment status (Paid/Pending), and timestamps. Updates automatically as new pledges come in.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold">Total Statistics</p>
                      <p className="text-xs text-muted-foreground">
                        Key metrics including total amount raised, number of donors, average pledge size, 
                        and breakdown by payment status.
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-purple-500">
                    <p className="text-xs font-medium">🎯 All data updates in real-time! No need to refresh the page - you see contributions as they happen.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Event Information */}
              <AccordionItem value="event-info">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-500" />
                    <span className="font-semibold">Event Information & Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>Each fundraising event includes:</p>
                  
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Event Name:</strong> Displayed at the top of the event room</li>
                    <li><strong>Event Code:</strong> Unique code for joining the event</li>
                    <li><strong>Fundraising Goal:</strong> Target amount to be raised</li>
                    <li><strong>Event Description:</strong> Details about what the funds will support</li>
                    <li><strong>Start/End Dates:</strong> Event duration (if specified)</li>
                    <li><strong>Organizer Contact:</strong> Who to reach for questions</li>
                  </ul>

                  <p className="mt-2">You can view all event details by clicking the info icon in the event room header.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Security & Privacy */}
              <AccordionItem value="security">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    <span className="font-semibold">Security & Privacy Protection</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>Your security and privacy are our top priorities:</p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold">Encrypted Data Transfer</p>
                      <p className="text-xs text-muted-foreground">
                        All data transmitted between your device and our servers is encrypted using SSL/TLS 
                        (the same security technology used by banks).
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold">No Payment Credential Storage</p>
                      <p className="text-xs text-muted-foreground">
                        We never store credit card numbers, M-Pesa PINs, or PayPal passwords. 
                        Payments are processed through trusted third-party providers.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold">Data Privacy</p>
                      <p className="text-xs text-muted-foreground">
                        Your personal information (name, email, phone) is used solely for event participation 
                        and donation tracking. We never share or sell your data to third parties.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold">Secure Database</p>
                      <p className="text-xs text-muted-foreground">
                        All pledge and donor information is stored in encrypted databases with restricted access 
                        and regular security audits.
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
                    <span className="font-semibold">Getting Help & Support</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p>Need assistance? Here's how to get help:</p>
                  
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>In-App Help:</strong> Click the help icon (❓) in any event room for context-specific guidance</li>
                    <li><strong>Lost Pledge:</strong> Contact the event organizer with your name and email</li>
                    <li><strong>Payment Issues:</strong> Check the payment confirmation screen for troubleshooting tips</li>
                    <li><strong>Technical Problems:</strong> Reach out to the event organizer who can escalate to technical support</li>
                    <li><strong>General Questions:</strong> Contact Tuendelee Foundation directly</li>
                  </ul>

                  <div className="bg-muted/50 p-3 rounded border-l-4 border-teal-500 mt-3">
                    <p className="text-xs font-medium mb-2">💬 Event organizers have access to all pledge details and can assist with most issues quickly.</p>
                    <div className="space-y-1">
                      <p className="text-xs"><strong>Email:</strong> donor-relations@tuendelee.org</p>
                      <p className="text-xs"><strong>Phone:</strong> +254 111 209249 or +254 10 30 90 308</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            {/* Quick Tips */}
            <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-lg p-4 border border-primary/20">
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span> Quick Tips for Success
              </h3>
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Remember your details (name, email, or phone) to easily find your pledges later</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>If pledging to pay later, set a reminder to complete payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>You can rejoin the same event multiple times to see updated progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Payment methods can be changed when paying an existing pledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>The app works on all devices - desktop, tablet, and mobile phones</span>
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
