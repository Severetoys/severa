import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ApplePayPaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency: string;
  symbol: string;
  onPaymentSuccess: () => void;
}

const ApplePayPaymentModal: React.FC<ApplePayPaymentModalProps> = ({ isOpen, onOpenChange, amount, currency, symbol, onPaymentSuccess }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col items-center justify-center p-6">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/authkit-y9vjx.firebasestorage.app/o/WhatsApp%20Image%202025-07-26%20at%2002.02.58.jpeg?alt=media&token=7a8ad75a-e3d6-4c1f-98ea-0dd5e3ef8bbf"
            alt="Apple Pay"
            width={120}
            height={48}
            className="mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">Confirmar pagamento com Apple Pay</h2>
          <p className="mb-4 text-lg">Valor: <span className="font-bold">{symbol} {amount.toFixed(2)} {currency}</span></p>
          <Button className="w-full" onClick={() => { onPaymentSuccess(); onOpenChange(false); }}>
            Confirmar pagamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplePayPaymentModal;
