/* =========================
   BANK SMS PARSER
   Turns an Indian bank / UPI alert into { amount, type, title, category, ref }.
   Returns null for messages that aren't a completed transaction
   (OTPs, payment requests, reminders, failed payments...).
========================= */

const IGNORE = [
  /\botp\b/i,
  /one[- ]time password/i,
  /\bwill be (debited|deducted|credited|added)\b/i,
  /\bhas requested\b/i,
  /\bcollect request\b/i,
  /\b(due|overdue)\b.*\b(on|by)\b/i,
  /\b(declined|failed|unsuccessful|reversed?)\b/i,
  /\bminimum amount due\b/i,
];

const DEBIT = /\b(debited|debit|spent|paid|sent|withdrawn|purchase|payment of|txn of|transferred)\b/i;
const CREDIT = /\b(credited|credit|received|deposited|refund(ed)?|added)\b/i;

// Top-up of your own account, e.g. slice: "You added ₹5,160 to your slice bank account"
const TOP_UP = /\b(?:you\s+)?added\b.*?\bto\s+your\s+([a-z]+)\s+(?:bank\s+)?(?:account|a\/c|wallet)/i;

const AMOUNT = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
// Some banks write "debited by 250.00" with no currency marker
const AMOUNT_BARE = /\b(?:debited|credited|sent|paid|spent)\s+(?:by|for|of|with)?\s*([\d,]+(?:\.\d{1,2})?)\b/i;

const REF = /(?:upi\s*ref(?:\s*no)?|ref(?:erence)?\s*(?:no|number)?|refno|rrn|utr|upi(?:\/p2[am])?)[\s.:#\/-]*(\d{8,})/i;

// A merchant name ends before one of these words or sentence punctuation
const END = String.raw`(?=\s+(?:on|ref|refno|rrn|upi|utr|avl|txn|not\s+you|best|regards|thanks|team)\b|[.;,](?:\s|$)|$)`;
const nameAfter = (lead, first = "[A-Za-z0-9]") =>
  new RegExp(String.raw`${lead}\s+(${first}[\w .&@'*-]{1,40}?)${END}`, "i");

const MERCHANT_PATTERNS = [
  /\bto\s+vpa\s+([\w.\-]+@[\w.\-]+)/i,                    // to VPA name@bank
  nameAfter(String.raw`\b(?:trf|transfer(?:red)?)\s+to`, "[A-Za-z]"),
  /;\s*([A-Za-z][\w .&'-]{1,40}?)\s+credited\b/i,         // ICICI: "; NAME credited"
  new RegExp(String.raw`\bupi\/(?:p2[am]\/)?\d+\/([^/\s][^/]{1,40}?)(?=\/|\s+not\s+you\b|\s{2,}|[.;,](?:\s|$)|$)`, "i"), // Axis: UPI/P2M/123/NAME
  nameAfter(String.raw`\bat`),                             // card: at MERCHANT on ...
  nameAfter(String.raw`\bon`, "[A-Za-z]"),                 // spoken: "spent 60 on chai"
  nameAfter(String.raw`\bto`),                             // Sent ... To NAME On ... / slice "To KARTHIK G RRN"
  nameAfter(String.raw`\bfrom`, "[A-Za-z]"),                // credited ... from NAME
];

const CATEGORY_KEYWORDS = [
  ["Food", /swiggy|zomato|zepto|blinkit|bigbasket|instamart|dominos|domino's|mcdonald|\bkfc\b|starbucks|\bcafe|restaurant|dunzo|eatfit|pizza|bakery|\bchai\b/i],
  ["Travel", /uber|ola|rapido|irctc|redbus|makemytrip|goibibo|indigo|air ?india|vistara|metro|fastag|petrol|fuel|hpcl|bpcl|iocl|indian ?oil|shell/i],
  ["Shopping", /amazon|flipkart|myntra|ajio|meesho|nykaa|decathlon|croma|reliance|dmart|tata ?cliq|ikea/i],
  ["Bills", /electricity|bescom|tneb|msedcl|\bjio\b|airtel|vodafone|\bvi\b|bsnl|broadband|act ?fibernet|\bgas\b|\bwater\b|recharge|insurance|\blic\b|\bemi\b|\bloan\b/i],
  ["Entertainment", /netflix|prime ?video|hotstar|spotify|youtube|bookmyshow|pvr|inox|sony ?liv|zee5|steam|playstation/i],
];

const clean = (s) =>
  s.replace(/\s+/g, " ").replace(/[.\-,\s]+$/, "").trim();

const titleCase = (s) =>
  s.includes("@") ? s.toLowerCase() : s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const guessCategory = (text) =>
  CATEGORY_KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? "General";

export const parseBankSms = (raw) => {
  if (typeof raw !== "string") return null;
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || IGNORE.some((re) => re.test(text))) return null;

  const debitAt = text.search(DEBIT);
  const creditAt = text.search(CREDIT);
  if (debitAt === -1 && creditAt === -1) return null;

  // Whichever verb comes first describes the account holder's side
  // ("debited ...; NAME credited" is a debit for us)
  const type =
    creditAt === -1 || (debitAt !== -1 && debitAt < creditAt) ? "expense" : "income";

  const amountMatch = text.match(AMOUNT) || text.match(AMOUNT_BARE);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) return null;

  let merchant = null;
  for (const re of MERCHANT_PATTERNS) {
    // "from" names the payer, which only matters for credits
    if (type === "expense" && re.source.startsWith(String.raw`\bfrom`)) continue;
    const m = text.match(re);
    if (m) {
      const candidate = clean(m[1]);
      // Skip our own account references like "A/c XX1234" or "your account"
      if (!/^(a\/?c\b|acct|account|your|xx|\*+\d|card|hdfc bank|sbi|icici bank|slice|us\b|talk|date\b)/i.test(candidate)) {
        merchant = candidate;
        break;
      }
    }
  }

  const ref = text.match(REF)?.[1] ?? null;

  // Money moved into your own account: a transfer, not a payment from someone
  const topUp = type === "income" && !merchant ? text.match(TOP_UP) : null;
  if (topUp) {
    const bank = topUp[1].charAt(0).toUpperCase() + topUp[1].slice(1).toLowerCase();
    return { amount, type, title: `Added to ${bank}`, category: "Transfer", ref };
  }

  const title = merchant
    ? titleCase(merchant)
    : type === "expense" ? "UPI payment" : "Money received";

  return {
    amount: type === "expense" ? -amount : amount,
    type,
    title: title.slice(0, 60),
    category: type === "income" ? "Income" : guessCategory(merchant ?? text),
    ref,
  };
};
