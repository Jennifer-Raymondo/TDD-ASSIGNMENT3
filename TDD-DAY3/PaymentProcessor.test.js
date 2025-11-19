// PaymentProcessor.test.js
//const PaymentProcessor = require("./PaymentProcessor-refactor");
const PaymentProcessor = require("./PaymentProcessor-refactor");

describe("PaymentProcessor simple", () => {
  let api;
  let p;

  beforeEach(() => {
    api = { post: jest.fn() };
    p = new PaymentProcessor(api);
  });

  test("invalid metadata throws", () => {
    expect(() =>
      p.processPayment(50, "USD", 1, "credit_card", { expiry: "12/25" }, null, 0)
    ).toThrow("Invalid card metadata");

    expect(() =>
      p.processPayment(50, "USD", 1, "paypal", {}, null, 0)
    ).toThrow("Invalid PayPal metadata");
  });

  test("discount and currency conversion", () => {
    const withDiscount = p.processPayment(100, "USD", 1, "credit_card", { cardNumber: "1", expiry: "12/25" }, "SUMMER20", 0);
    expect(withDiscount.finalAmount).toBe(80);

    const converted = p.processPayment(100, "EUR", 1, "credit_card", { cardNumber: "1", expiry: "12/25" }, null, 0);
    expect(converted.finalAmount).toBe(100 * 1.2);
  });

  test("api endpoints for card and paypal", () => {
    p.processPayment(10, "USD", 1, "credit_card", { cardNumber: "1", expiry: "12/25" }, null, 0);
    expect(api.post).toHaveBeenCalledWith("/payments/credit", expect.any(Object));

    p.processPayment(10, "USD", 1, "paypal", { paypalAccount: "x" }, null, 0);
    expect(api.post).toHaveBeenCalledWith("/payments/paypal", expect.any(Object));
  });

  test("refund applies fee and posts", () => {
    const r = p.refundPayment("t1", 1, "err", 100, "USD", {});
    expect(r.netAmount).toBe(95);
    expect(api.post).toHaveBeenCalledWith("/payments/refund", expect.any(Object));
  });
});
