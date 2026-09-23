import test from "node:test";
import assert from "node:assert/strict";
import { parseBankSms } from "../src/utils/smsParser.js";

/* Real-world bank alert wordings (account numbers and refs are made up).
   Run with: npm test */

const TRANSACTIONS = [
  ["HDFC UPI", "Sent Rs.250.00 From HDFC Bank A/C *1234 To SWIGGY On 21/09/26 Ref 426512345678 Not You? Call 18002586161",
    { amount: -250, title: "Swiggy", category: "Food", ref: "426512345678" }],
  ["SBI UPI", "Dear UPI user A/C X1234 debited by 120.0 on date 21Sep26 trf to UBER INDIA Refno 426598765432. If not u? call 1800111109. -SBI",
    { amount: -120, title: "Uber India", category: "Travel", ref: "426598765432" }],
  ["ICICI UPI", "ICICI Bank Acct XX123 debited for Rs 649.00 on 21-Sep-26; NETFLIX credited. UPI:426511112222.",
    { amount: -649, title: "Netflix", category: "Entertainment", ref: "426511112222" }],
  ["Axis UPI", "INR 1,499.00 debited A/c no. XX1234 21-09-26, 10:15:02 UPI/P2M/426533334444/AMAZON PAY Not you? SMS BLOCKUPI Cust ID to 919951860002 Axis Bank",
    { amount: -1499, title: "Amazon Pay", category: "Shopping", ref: "426533334444" }],
  ["Kotak UPI", "Sent Rs.300.00 from Kotak Bank AC X1234 to rahul.k@okaxis on 21-09-26.UPI Ref 426555556666.",
    { amount: -300, title: "rahul.k@okaxis", category: "General", ref: "426555556666" }],
  ["Card spend", "Rs.2,340.00 spent on HDFC Bank Card x1234 at DMART AVENUE on 2026-09-21:18:04:11 Avl Lmt: Rs.98,000.",
    { amount: -2340, title: "Dmart Avenue", category: "Shopping", ref: null }],
  ["Salary credit", "Rs.60,000.00 credited to A/c XX1234 on 25-09-26 by NEFT from ACME TECH PVT LTD. Avl Bal Rs.1,23,456.00 -HDFC Bank",
    { amount: 60000, title: "Acme Tech Pvt Ltd", category: "Income", ref: null }],
  ["UPI received", "Dear Customer, Acct XX123 is credited with Rs 500.00 on 21-Sep-26 from priya@oksbi. UPI:426577778888-ICICI Bank.",
    { amount: 500, title: "priya@oksbi", category: "Income", ref: "426577778888" }],
  ["slice debit email", "₹1 debited from your slice account\nHi MD Ayan,\n₹1 debited from your slice bank account xx8625 via UPI.\nTransaction date\t21-Sep-26\nTo\tKARTHIK G\nRRN\t626429329770\nBest,\nTeam slice",
    { amount: -1, title: "Karthik G", category: "General", ref: "626429329770" }],
  ["slice credit email", "₹500 credited to your slice account\n₹500 credited to your slice bank account xx8625 via UPI.\nFrom PRIYA S\nRRN 626400001111\nTeam slice",
    { amount: 500, title: "Priya S", category: "Income", ref: "626400001111" }],
  ["slice top-up email", "₹5,160 added to slice bank account!\nHi MD Ayan,\n\nYou added ₹5,160 to your slice bank account.\n\nYour updated account balance is ₹5,218.18.\n\nTeam slice",
    { amount: 5160, title: "Added to Slice", category: "Transfer", ref: null }],
  ["voice: on chai", "spent 60 on chai", { amount: -60, title: "Chai", category: "Food", ref: null }],
  ["voice: at Swiggy", "spent 250 at Swiggy", { amount: -250, title: "Swiggy", category: "Food", ref: null }],
  ["voice: paid to Rahul", "paid 1200 to Rahul", { amount: -1200, title: "Rahul", category: "General", ref: null }],
];

const IGNORED = [
  ["OTP", "123456 is your OTP for txn of Rs.250.00 at SWIGGY. Do not share. -HDFC"],
  ["collect request", "Rahul has requested Rs 500 from you on Google Pay. Pay or decline in the app."],
  ["future debit", "Rs.649 will be debited from your a/c on 05-10-26 for NETFLIX mandate."],
  ["future credit", "Rs.500 will be credited to your account by 25-Sep as cashback."],
  ["failed payment", "Your UPI transaction of Rs.250.00 to SWIGGY has failed. Amount if debited will be refunded."],
  ["marketing", "Get flat 50% off on your next order! Use code SAVE50."],
];

test("reads real bank alerts", () => {
  for (const [name, message, expected] of TRANSACTIONS) {
    const got = parseBankSms(message);
    assert.ok(got, `${name}: expected a transaction, got null`);
    assert.deepEqual(
      { amount: got.amount, title: got.title, category: got.category, ref: got.ref },
      expected,
      name
    );
  }
});

test("ignores anything that isn't a completed payment", () => {
  for (const [name, message] of IGNORED) {
    assert.equal(parseBankSms(message), null, `${name}: should have been ignored`);
  }
});

test("ignores empty or non-text input", () => {
  for (const value of ["", "   ", null, undefined, 42, {}]) {
    assert.equal(parseBankSms(value), null, `${JSON.stringify(value)} should be ignored`);
  }
});
