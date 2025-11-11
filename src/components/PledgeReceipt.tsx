import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmountWithKES } from '@/lib/currencyUtils';

interface PledgeReceiptProps {
  pledge: {
    id: string;
    name: string;
    email: string;
    amount: number;
    amount_in_kes: number;
    currency: string;
    payment_method: string;
    payment_reference: string;
    created_at: string;
    is_confirmed: boolean;
  };
  eventTitle: string;
}

export function PledgeReceipt({ pledge, eventTitle }: PledgeReceiptProps) {
  const generatePDF = () => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Donation Receipt - ${pledge.id}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { color: #2563eb; margin: 0; }
          .receipt-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #111827; }
          .amount { font-size: 24px; color: #059669; font-weight: bold; text-align: center; margin: 30px 0; }
          .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
          .status.paid { background: #d1fae5; color: #065f46; }
          .status.pending { background: #fed7aa; color: #92400e; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tuendelee Foundation</h1>
          <p>Official Donation Receipt</p>
        </div>
        
        <div class="receipt-info">
          <div class="info-row">
            <span class="label">Receipt ID:</span>
            <span class="value">${pledge.id}</span>
          </div>
          <div class="info-row">
            <span class="label">Event:</span>
            <span class="value">${eventTitle}</span>
          </div>
          <div class="info-row">
            <span class="label">Donor Name:</span>
            <span class="value">${pledge.name}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${pledge.email}</span>
          </div>
          <div class="info-row">
            <span class="label">Date:</span>
            <span class="value">${format(new Date(pledge.created_at), 'PPP')}</span>
          </div>
          <div class="info-row">
            <span class="label">Payment Method:</span>
            <span class="value">${pledge.payment_method || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Reference:</span>
            <span class="value">${pledge.payment_reference || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Status:</span>
            <span class="value">
              <span class="status ${pledge.is_confirmed ? 'paid' : 'pending'}">
                ${pledge.is_confirmed ? 'PAID' : 'PENDING'}
              </span>
            </span>
          </div>
        </div>
        
        <div class="amount">
          <div>${formatAmountWithKES(pledge.amount, pledge.currency, pledge.amount_in_kes).primary}</div>
          <div style="font-size: 16px; color: #6b7280; margin-top: 10px;">
            ${formatAmountWithKES(pledge.amount, pledge.currency, pledge.amount_in_kes).kes}
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Thank you for supporting Tuendelee Foundation!</strong></p>
          <p>This receipt confirms your generous donation. Your contribution helps us make a difference.</p>
          <p style="margin-top: 20px;">For questions, please contact us at support@tuendelee.org</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="background: #2563eb; color: white; padding: 12px 30px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
            Print Receipt
          </button>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  if (!pledge.is_confirmed) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Download Receipt</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={generatePDF} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download Payment Receipt
        </Button>
      </CardContent>
    </Card>
  );
}
