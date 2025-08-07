export async function createPixPayment(...args: any[]): Promise<any> {
  // Mock: retorna um objeto simulado
  return {
    qrCode: "MOCKED_QR_CODE",
    paymentId: "MOCKED_PAYMENT_ID",
    status: "pending"
  };
}
