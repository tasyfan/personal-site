const STRIPE_LOCAL_PAYMENT_METHODS = Object.freeze([]);

function buildStripeCheckoutSession({
  orderId,
  payload,
  description,
  siteUrl,
  automaticTax = false,
  productTaxCode = ''
}) {
  if (!orderId) throw new Error('orderId is required');
  if (!payload) throw new Error('payload is required');
  if (!siteUrl) throw new Error('siteUrl is required');

  const session = {
    mode: 'payment',
    locale: payload.locale === 'en' ? 'en' : 'zh',
    customer_creation: 'always',
    billing_address_collection: 'auto',
    automatic_tax: { enabled: automaticTax === true },
    client_reference_id: orderId,
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(payload.amount * 100),
        product_data: {
          name: payload.planName,
          description
        }
      },
      quantity: 1
    }],
    metadata: {
      orderId,
      planId: payload.planId,
      testType: payload.testType,
      locale: payload.locale || 'zh-CN',
      requestedLocalPaymentMethods: STRIPE_LOCAL_PAYMENT_METHODS.join(',')
    },
    success_url: payload.locale === 'en'
      ? `${siteUrl}/?lang=en#/payment-return?orderId=${orderId}&provider=stripe`
      : `${siteUrl}/#/payment-return?orderId=${orderId}&provider=stripe`,
    cancel_url: payload.locale === 'en'
      ? `${siteUrl}/?lang=en${payload.returnPath || '#/'}`
      : `${siteUrl}/${payload.returnPath || '#/'}`
  };
  if (productTaxCode) {
    session.line_items[0].price_data.product_data.tax_code = productTaxCode;
  }
  return session;
}

module.exports = {
  STRIPE_LOCAL_PAYMENT_METHODS,
  buildStripeCheckoutSession
};
