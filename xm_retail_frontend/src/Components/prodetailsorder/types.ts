// Interface for product data structure
export interface Product {
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  price: {
    price: string;
    value?: number;
    type: string;
    min: string;
    max: string;
    denominations?: string[];
    currency: {
      code: string;
      symbol: string;
      numericCode: string;
    } | string;
  };
  images: {
    thumbnail: string;
    mobile: string;
    base: string;
    small: string;
  };
  currency: string;
  url: string;
}

// Interface for order card data
export interface OrderCard {
  amount: number;
  cardNumber: string;
  cardPin: string;
  sku: string;
  validity: string;
  issuanceDate: string;
  status: string;
  refno?: string;
}

// Interface for order data
export interface OrderData extends OrderCard {
  // Additional fields specific to OrderData
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

// Interface for payment response
export interface PaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Interface for place order request
export interface PlaceOrderRequest {
  sku: string;
  price: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  email: string;
  phone: string;
  name: string;
  quantity: number;
  refno?: string;
}

// Interface for pending payment
export interface PendingPayment {
  response: PaymentResponse;
  cartItem: CartItem;
  userData: {
    email: string;
    phone: string;
    name: string;
  };
  timestamp: number;
}

// Interface for cart item
export interface CartItem {
  sku: string;
  name: string;
  image: string;
  denomination: string;
  currency: { symbol: string };
  quantity: number;
  price: string | number;
}

// Interface for Razorpay options
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
} 