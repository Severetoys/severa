export async function createPixPayment(..._args: any[]): Promise<{ qrCode: string; paymentId: string; status: string }> {
  // Mock: retorna um objeto simulado
  return {
    qrCode: "MOCKED_QR_CODE",
    paymentId: "MOCKED_PAYMENT_ID",
    status: "pending"
  };
}