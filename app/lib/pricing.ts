// Published catalogue already reserves 10% tax, 15% margin and 1% payment.
// Replace that payment provision; do not add a surcharge at checkout.
export const paymentPricing = Object.freeze({
  rateBps: 399,
  fixedCents: 39,
  transactions: 2,
  previousPaymentBps: 100,
  taxProvisionBps: 1000,
  marginBps: 1500,
  source: "https://stripe.com/br/pricing",
  checkedAt: "2026-09-26",
});
export function paymentEstimate(totalCents: number) {
  if (!Number.isSafeInteger(totalCents) || totalCents < 100)
    throw new Error("Valor inválido.");
  const depositCents = Math.ceil(totalCents / 2),
    balanceCents = totalCents - depositCents;
  const fee = (amount: number) =>
    Math.round((amount * paymentPricing.rateBps) / 10000) +
    paymentPricing.fixedCents;
  const feesCents = fee(depositCents) + fee(balanceCents);
  return {
    depositCents,
    balanceCents,
    feesCents,
    netCents: totalCents - feesCents,
  };
}
export function priceWithStripe(baseCents: number) {
  if (!Number.isSafeInteger(baseCents) || baseCents < 100)
    throw new Error("Valor-base inválido.");
  const {
    taxProvisionBps,
    marginBps,
    previousPaymentBps,
    rateBps,
    fixedCents,
    transactions,
  } = paymentPricing;
  const operatingBudget = Math.ceil(
    (baseCents * (10000 - taxProvisionBps - marginBps - previousPaymentBps)) /
      10000,
  );
  let total = Math.ceil(
    ((operatingBudget + fixedCents * transactions) * 10000) /
      (10000 - taxProvisionBps - marginBps - rateBps),
  );
  while (
    paymentEstimate(total).netCents -
      Math.ceil((total * (taxProvisionBps + marginBps)) / 10000) <
    operatingBudget
  )
    total++;
  return total;
}
