// Payment-related TypeScript interfaces and types
// Generated from Prisma schema for frontend use

export interface PaymentOrder {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paypalOrderId: string | null;
  paypalPaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    fullNameArabic: string | null;
    fullNameEnglish: string | null;
  };
  course?: {
    id: string;
    title: string;
    titleEnglish: string | null;
    featuredImage: string | null;
  };
  transactions?: PaymentTransaction[];
  refunds?: PaymentRefund[];
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  paypalTransactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paypalFee: number | null;
  netAmount: number | null;
  createdAt: Date;
}

export interface PaymentRefund {
  id: string;
  orderId: string;
  paypalRefundId: string;
  amount: number;
  currency: string;
  reason: string | null;
  status: RefundStatus;
  requestedAt: Date;
  processedAt: Date | null;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type RefundStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// API Response types
export interface PaymentListResponse {
  payments: PaymentOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaymentDetailsResponse {
  payment: PaymentOrder & {
    summary: {
      totalPaid: number;
      totalRefunded: number;
      netAmount: number;
      canRefund: boolean;
    };
  };
}

export interface AdminPaymentListResponse extends PaymentListResponse {
  summary: {
    totalRevenue: number;
    totalRefunds: number;
    pendingPayments: number;
    completedPayments: number;
  };
}

// API Request types
export interface CreatePaymentOrderRequest {
  courseId: string;
}

export interface CapturePaymentOrderRequest {
  orderId: string;
}

export interface RefundPaymentRequest {
  orderId: string;
  amount: number;
  reason?: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  userId?: string;
  courseId?: string;
}

// PayPal integration types
export interface PayPalOrderResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
  }>;
  payer?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  seller_receivable_breakdown?: {
    paypal_fee?: {
      value: string;
    };
    net_amount?: {
      value: string;
    };
  };
}

export interface PayPalRefundResponse {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
}