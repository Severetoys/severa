import PayPalDemo from '@/components/paypal-demo';

export default function PayPalTestPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-blue-900">
            <div className="container mx-auto py-8">
                <PayPalDemo />
            </div>
        </div>
    );
}
