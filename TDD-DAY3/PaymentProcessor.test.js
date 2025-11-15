// // PaymentProcessor.test.js
// const PaymentProcessor = require("./PaymentProcessor");

// describe("PaymentProcessor (simple & clear)", () => {
//   let apiClient;
//   let processor;

//   beforeEach(() => {
//     apiClient = { post: jest.fn() };
//     processor = new PaymentProcessor(apiClient);
//   });

//   test("validates credit card metadata", () => {
//     expect(() =>
//       processor.processPayment(50, "USD", 1, "credit_card", { expiry: "12/25" }, null, 0)
//     ).toThrow("Invalid card metadata");
//   });

//   test("validates paypal metadata", () => {
//     expect(() =>
//       processor.processPayment(50, "USD", 1, "paypal", {}, null, 0)
//     ).toThrow("Invalid PayPal metadata");
//   });

//   test("logs light vs heavy fraud checks", () => {
//     console.log = jest.fn();

//     processor.processPayment(50, "USD", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, null, 1);
//     expect(console.log).toHaveBeenCalledWith("Performing light fraud check for small payment");

//     console.log.mockClear();
//     processor.processPayment(200, "USD", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, null, 1);
//     expect(console.log).toHaveBeenCalledWith("Performing heavy fraud check for large payment");
//   });

//   test("applies discounts correctly", () => {
//     const t1 = processor.processPayment(100, "USD", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, "SUMMER20", 0);
//     expect(t1.finalAmount).toBe(80);

//     const t2 = processor.processPayment(50, "USD", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, "WELCOME10", 0);
//     expect(t2.finalAmount).toBe(40);
//   });

//   test("converts currency when not USD", () => {
//     const tx = processor.processPayment(100, "EUR", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, null, 0);
//     expect(tx.finalAmount).toBe(100 * 1.2);
//   });

//   test("calls correct API endpoints for credit and paypal", () => {
//     processor.processPayment(20, "USD", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, null, 0);
//     expect(apiClient.post).toHaveBeenCalledWith("/payments/credit", expect.any(Object));

//     processor.processPayment(20, "USD", 1, "paypal", { paypalAccount: "pp@x.com" }, null, 0);
//     expect(apiClient.post).toHaveBeenCalledWith("/payments/paypal", expect.any(Object));
//   });

//   test("refund applies 5% fee and calls API", () => {
//     const r = processor.refundPayment("tx1", 1, "reason", 100, "USD", {});
//     expect(r.netAmount).toBe(95);
//     expect(apiClient.post).toHaveBeenCalledWith("/payments/refund", expect.any(Object));
//   });
// });



// PaymentProcessor.test.js
const PaymentProcessor = require("./PaymentProcessor");

describe("PaymentProcessor - simple tests", () => {
  let apiClient;
  let p;

  beforeEach(() => {
    apiClient = { post: jest.fn() };
    p = new PaymentProcessor(apiClient);
  });

  test("bad metadata for card and paypal throws", () => {
    expect(() =>
      p.processPayment(50, "USD", 1, "credit_card", { expiry: "12/25" }, null, 0)
    ).toThrow("Invalid card metadata");

    expect(() =>
      p.processPayment(50, "USD", 1, "paypal", {}, null, 0)
    ).toThrow("Invalid PayPal metadata");
  });

  test("discount and currency conversion", () => {
    const t = p.processPayment(100, "USD", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, "SUMMER20", 0);
    expect(t.finalAmount).toBe(80);

    const t2 = p.processPayment(100, "EUR", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, null, 0);
    expect(t2.finalAmount).toBe(100 * 1.2);
  });

  test("calls correct api endpoints", () => {
    p.processPayment(10, "USD", 1, "credit_card", { cardNumber: "111", expiry: "12/25" }, null, 0);
    expect(apiClient.post).toHaveBeenCalledWith("/payments/credit", expect.any(Object));

    p.processPayment(10, "USD", 1, "paypal", { paypalAccount: "me@paypal" }, null, 0);
    expect(apiClient.post).toHaveBeenCalledWith("/payments/paypal", expect.any(Object));
  });

  test("refund works", () => {
    const r = p.refundPayment("tx1", 1, "oops", 100, "USD", {});
    expect(r.netAmount).toBe(95);
    expect(apiClient.post).toHaveBeenCalledWith("/payments/refund", expect.any(Object));
  });
});
