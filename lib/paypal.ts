import {
  Client,
  Environment,
  OrdersController,
  PaymentsController,
  CheckoutPaymentIntent,
  OrderApplicationContextUserAction,
  ApiError
} from '@paypal/paypal-server-sdk';

export class PayPalService {
  private client: Client;
  private ordersController: OrdersController;
  private paymentsController: PaymentsController;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const environment = process.env.PAYPAL_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: clientId,
        oAuthClientSecret: clientSecret,
      },
      timeout: 0,
      environment,
    });

    this.ordersController = new OrdersController(this.client);
    this.paymentsController = new PaymentsController(this.client);
  }

  async createOrder(amount: number, currency: string = 'USD', courseTitle: string) {
    try {
      const body = {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [{
          amount: {
            currencyCode: currency,
            value: amount.toFixed(2),
          },
          description: `دورة: ${courseTitle}`,
        }],
        applicationContext: {
          returnUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payment/success',
          cancelUrl: process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/payment/cancel',
          userAction: OrderApplicationContextUserAction.PayNow,
          brandName: 'GIS Gate',
          locale: 'ar-SA',
        },
      };

      const response = await this.ordersController.createOrder({ body });
      return response.result;
    } catch (error) {
      console.error('PayPal create order error:', error);
      throw new Error('Failed to create PayPal order');
    }
  }

  async captureOrder(orderId: string) {
    try {
      const response = await this.ordersController.captureOrder({
        id: orderId,
        prefer: 'return=representation'
      });
      return response.result;
    } catch (error) {
      console.error('PayPal capture order error:', error);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  async refundPayment(captureId: string, amount: number, currency: string = 'USD', reason?: string) {
    try {
      const body = {
        amount: {
          currencyCode: currency,
          value: amount.toFixed(2),
        },
        reason: reason || 'Customer requested refund',
      };

      const response = await this.paymentsController.refundCapturedPayment({
        captureId,
        body
      });
      return response.result;
    } catch (error) {
      console.error('PayPal refund error:', error);
      throw new Error('Failed to process refund');
    }
  }

  async getOrder(orderId: string) {
    try {
      const response = await this.ordersController.getOrder({ id: orderId });
      return response.result;
    } catch (error) {
      console.error('PayPal get order error:', error);
      throw new Error('Failed to get PayPal order details');
    }
  }

  async getPayment(captureId: string) {
    try {
      const response = await this.paymentsController.getCapturedPayment({ captureId });
      return response.result;
    } catch (error) {
      console.error('PayPal get payment error:', error);
      throw new Error('Failed to get PayPal payment details');
    }
  }
}