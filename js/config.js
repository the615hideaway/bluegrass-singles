const CONFIG = {
  // Set to false to re-enable Stripe payment before going live
  testMode: true,

  submissionFee: 5.0,
  currency: 'USD',

  // ── Google Sheets Backend ──────────────────────────────────────────
  // Paste your deployed Google Apps Script Web App URL here.
  // See SETUP-INSTRUCTIONS.txt for step-by-step instructions.
  googleScriptUrl: 'https://script.google.com/macros/s/AKfycby6QavDpjrbFGYYYWaaKF4mNU4_-HVNE-RHiZXyFX_HG2D__UcJYeqYCg7SoTm0KbLKQw/exec',

  // Stripe Payment Link — opens when user clicks "Pay $5 to Continue"
  stripePaymentLink: 'https://buy.stripe.com/9B6fZg8ta8pZefS3bV5Ne01',

  // In Stripe Dashboard → Payment Links → After payment → Redirect to this URL
  // (use your full hosted URL, e.g. https://yoursite.com/index.html?payment=success)
  paymentSuccessParam: 'payment=success',

  dashboardPassword: '615bluegrass',

  paymentSessionKey: 'bg_singles_paid',
  dashboardAuthKey: 'bg_dashboard_auth',
};