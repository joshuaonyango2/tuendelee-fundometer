import { T } from "@/components/T";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, CreditCard, Clock, Search, AlertCircle, UserPlus, DollarSign } from "lucide-react";

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Help">
          <HelpCircle className="w-5 h-5" />
          <span className="sr-only"><T>{"Help"}</T></span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle><T>{"How the Fundraising Platform Works"}</T></DialogTitle>
          <DialogDescription>
            <T>{"Complete guide to joining events and making contributions"}</T>
          </DialogDescription>
        </DialogHeader>

        {/* How It Works Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4"><T>{"How It Works"}</T></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h4 className="font-semibold"><T>{"Join Instantly"}</T></h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Click "Join Event Now" and you're in. Simple as that. No complicated forms or long sign-ups.
              </p>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h4 className="font-semibold"><T>{"Make Your Contribution"}</T></h4>
              </div>
              <p className="text-sm text-muted-foreground">
                <T>{"Choose to pay now for immediate impact or pledge to pay later. Pick your preferred payment method - it's flexible and secure."}</T>
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2"><T>{"Frequently Asked Questions"}</T></h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="payment-options">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>What's the difference between "Pay Now" and "Pledge Now"?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <T>{"Pay Now (Immediate Payment)"}</T>
                </h4>
                <p className="text-green-800">
                  <T>{"Choose this if you want to make payment immediately. You'll be directed to provide payment details right away, and your contribution will be marked as paid once confirmed."}</T>
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <T>{"Pledge Now (Pay Later)"}</T>
                </h4>
                <p className="text-orange-800">
                  <T>{"Choose this if you want to commit to a donation but pay later. You'll select a payment deadline (7-30 days), and your pledge will be recorded. You can return later to complete the payment before the deadline."}</T>
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="find-pledge">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                <span><T>{"How do I pay for a pledge I made earlier?"}</T></span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li><T>{"Click the"}</T> <strong>"Find My Pledge"</strong> <T>{"button on the event page"}</T></li>
                <li><T>{"Enter the email address you used when making the pledge"}</T></li>
                <li><T>{"Click"}</T> <strong>"Search"</strong> <T>{"to view all your pledges"}</T></li>
                <li><T>{"Find the unpaid pledge and click"}</T> <strong>"Complete Payment"</strong></li>
                <li><T>{"Follow the payment instructions and submit your payment details"}</T></li>
              </ol>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-xs">
                  <strong><T>{"Tip:"}</T></strong> <T>{"Make sure to use the same email address you provided when making the original pledge."}</T>
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="double-counting">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                <span><T>{"Will my pledge be counted twice if I pay it?"}</T></span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                <strong><T>{"No, your pledge will not be counted twice."}</T></strong> <T>{"Here's how it works:"}</T>
              </p>
              
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong><T>{"1. When you make a pledge:"}</T></strong> The amount is recorded and shown in the "Unpaid Pledges" section of the thermometer.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong><T>{"2. When you pay your pledge:"}</T></strong> Using "Find My Pledge" to submit payment details updates your existing pledge. It moves from "Unpaid" to "Paid" without creating a duplicate.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong><T>{"3. The thermometer shows:"}</T></strong> <T>{"The same pledge amount just moves from the unpaid (lighter) section to the paid (darker green) section."}</T>
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-3">
                <p className="text-yellow-900 text-xs font-medium">
                  ⚠️ Important: Don't create a new pledge when paying an existing one! Always use "Find My Pledge" to complete payment.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payment-methods">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span><T>{"What payment methods are available?"}</T></span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p><T>{"We support multiple payment methods:"}</T></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong><T>{"M-Pesa:"}</T></strong> <T>{"Mobile money transfer (Kenya)"}</T></li>
                <li><strong><T>{"PayPal:"}</T></strong> <T>{"International online payments"}</T></li>
                <li><strong><T>{"Bank Transfer:"}</T></strong> <T>{"Direct bank deposits"}</T></li>
                <li><strong><T>{"Benevity:"}</T></strong> <T>{"Corporate matching donations"}</T></li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                <T>{"Payment methods may vary based on event settings. Choose the method most convenient for you during checkout."}</T>
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="deadline">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span><T>{"What happens if I miss my payment deadline?"}</T></span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                While we encourage you to honor your pledge by the deadline, you can still complete payment after the deadline has passed. The system will mark it as "Overdue" but will still accept your payment.
              </p>
              <p className="text-xs bg-blue-50 p-3 rounded-lg border border-blue-200 text-blue-800 mt-2">
                <strong><T>{"Pro tip:"}</T></strong> <T>{"Set a reminder on your calendar to ensure you don't miss your payment deadline!"}</T>
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="proof-of-payment">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                <span><T>{"How do I prove that I have paid?"}</T></span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <p><T>{"Two things make your payment easy to verify — do both if you can:"}</T></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  <strong><T>{"Type in your transaction code"}</T></strong> <T>{"on the confirmation screen: the M-Pesa code from the Safaricom SMS (10 characters, e.g. QA12B3C4D5), the PayPal transaction ID (17 characters), or the bank/Benevity reference from your slip."}</T>
                </li>
                <li>
                  <strong><T>{"Upload your evidence"}</T></strong> <T>{"— a screenshot of the M-Pesa message, the bank slip, or the PayPal receipt (image or PDF, up to 5MB). It is stored privately and only the fundraising admin can open it."}</T>
                </li>
              </ol>
              <p>
                The system checks the code format straight away and flags a code that was already used, so
                nobody's payment is ever counted twice. The admin then marks your payment verified, and the
                thermometer moves your amount from "pledged" to "paid".
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="thermometer-reading">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span><T>{"How do I read the thermometer?"}</T></span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong><T>{"Green"}</T></strong> <T>{"— money already paid and received."}</T></li>
                <li><strong><T>{"Blue"}</T></strong> <T>{"— pledged but not yet paid."}</T></li>
                <li><strong><T>{"Orange"}</T></strong> <T>{"— the amount still needed to reach the goal."}</T></li>
                <li><strong><T>{"Purple dashed line"}</T></strong> <T>{"— the campaign goal."}</T></li>
              </ul>
              <p>
                <T>{"The scale is marked bottom-up in both US Dollars (left) and Kenya Shillings (right), and it rises live as pledges come in. At a quarter, half, three quarters and the full goal you'll see a celebration — you can mute the sound with the speaker button."}</T>
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>


        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 text-sm"><T>{"Still have questions?"}</T></h4>
          <p className="text-xs text-muted-foreground">
            <T>{"If you need additional help or have specific questions about your pledge, please contact the event organizer directly."}</T>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
