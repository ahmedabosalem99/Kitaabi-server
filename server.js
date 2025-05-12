require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path"); // لاستعماله في توجيه المسارات بشكل صحيح

const app = express();
const PORT = 4242;


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // خدمة الملفات الثابتة من مجلد public

// Routes

// Stripe payment route to create checkout session
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Your Order Total",
              description: `Payment for this items`,
            },
            unit_amount: req.body.order.totalPrice * 100, // تحويل السعر إلى سنتات
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple endpoint to check payment status by session ID
app.get("/api/check-payment/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      success: session.payment_status === "paid",
      paymentStatus: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error("Error checking payment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
