// PaymentProcessor.js
const CONVERSION_RATE = 1.2;
const SUMMER20_RATE = 0.8;
const WELCOME10_AMOUNT = 10;
const REFUND_FEE_RATE = 0.05;

class PaymentProcessor {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.currencyConversionRate = CONVERSION_RATE;
  }

  processPayment(amount, currency, userId, paymentMethod, metadata, discountCode, fraudCheckLevel) {
    this._validatePaymentMethod(paymentMethod, metadata);

    if (fraudCheckLevel > 0) {
      this._performFraudCheck(amount, userId);
    }

    let finalAmount = this._applyDiscount(amount, discountCode);

    if (currency !== "USD") {
      finalAmount = this._convertCurrency(finalAmount);
    }

    const transaction = this._buildTransaction({
      userId,
      originalAmount: amount,
      finalAmount,
      currency,
      paymentMethod,
      metadata,
      discountCode,
      fraudCheckLevel,
    });

    this._sendToApi(paymentMethod, transaction);
    this._sendConfirmationEmail(userId, finalAmount, currency);
    this._logAnalytics({ userId, amount: finalAmount, currency, method: paymentMethod });

    return transaction;
  }

  _validatePaymentMethod(method, metadata) {
    if (method === "credit_card") {
      if (!metadata || !metadata.cardNumber || !metadata.expiry) {
        throw new Error("Invalid card metadata");
      }
    } else if (method === "paypal") {
      if (!metadata || !metadata.paypalAccount) {
        throw new Error("Invalid PayPal metadata");
      }
    } else {
      throw new Error("Unsupported payment method");
    }
  }

  _performFraudCheck(amount, userId) {
    if (amount < 100) {
      console.log("Performing light fraud check for small payment");
      this._lightFraudCheck(userId, amount);
    } else {
      console.log("Performing heavy fraud check for large payment");
      this._heavyFraudCheck(userId, amount);
    }
  }

  _applyDiscount(amount, code) {
    if (!code) return amount;
    if (code === "SUMMER20") return amount * SUMMER20_RATE;
    if (code === "WELCOME10") return amount - WELCOME10_AMOUNT;
    console.log("Unknown discount code");
    return amount;
  }

  _convertCurrency(amount) {
    return amount * this.currencyConversionRate;
  }

  _buildTransaction({ userId, originalAmount, finalAmount, currency, paymentMethod, metadata, discountCode, fraudCheckLevel }) {
    return {
      userId: userId,
      originalAmount: originalAmount,
      finalAmount: finalAmount,
      currency: currency,
      paymentMethod: paymentMethod,
      metadata: metadata,
      discountCode: discountCode,
      fraudChecked: fraudCheckLevel,
      timestamp: new Date().toISOString(),
    };
  }

  _sendToApi(paymentMethod, transaction) {
    const endpoint = paymentMethod === "credit_card" ? "/payments/credit" : "/payments/paypal";
    try {
      this.apiClient.post(endpoint, transaction);
      console.log("Payment sent to API:", transaction);
    } catch (err) {
      console.error("Failed to send payment:", err);
      throw err;
    }
  }

  _sendConfirmationEmail(userId, amount, currency) {
    console.log(`Sending email to user ${userId}: Your payment of ${amount} ${currency} was successful.`);
  }

  _logAnalytics(data) {
    console.log("Analytics event:", data);
  }

  _lightFraudCheck(userId, amount) {
    console.log(`Light fraud check for user ${userId} on amount ${amount}`);
    if (amount < 10) {
      console.log("Very low risk");
    } else {
      console.log("Low risk");
    }
  }

  _heavyFraudCheck(userId, amount) {
    console.log(`Heavy fraud check for user ${userId} on amount ${amount}`);
    if (amount < 1000) {
      console.log("Medium risk");
    } else {
      console.log("High risk");
    }
  }

  refundPayment(transactionId, userId, reason, amount, currency, metadata) {
    const refundFee = amount * REFUND_FEE_RATE;
    const refund = {
      transactionId,
      userId,
      reason,
      amount,
      currency,
      metadata,
      date: new Date(),
      netAmount: amount - refundFee,
    };

    this.apiClient.post("/payments/refund", refund);
    console.log("Refund processed:", refund);
    return refund;
  }
}

module.exports = PaymentProcessor;
