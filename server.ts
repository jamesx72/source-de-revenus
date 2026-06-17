import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp as initializeAdminApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from "fs";

// Initialize Firebase Admin Client SDK for server-side operations (Stripe webhooks)
let db: any = null;
try {
  const adminApp = initializeAdminApp({
    projectId: "studio-8479066300-24a9a",
    credential: applicationDefault()
  });
  db = getAdminFirestore(adminApp, "ai-studio-e122ace1-e8ea-43ff-9de3-8dcb4cf686e6");
  console.log("Firebase Admin Client SDK initialized on server.");
} catch (err: any) {
  console.log("Skipping Firebase server initialization: ", err.message);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook handling
  app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecret || !webhookSecret) {
      console.log("Missing Stripe webhook keys.");
      return res.status(500).send("Missing Stripe keys.");
    }
    
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);
      const signature = req.headers['stripe-signature'];

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature as string,
          webhookSecret
        );
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
        let session: any;
        let amount_total: number;
        let currency: string;
        let payment_status: string;
        let customer_email: string | null = null;
        let metadata: any;

        if (event.type === 'checkout.session.completed') {
            session = event.data.object as any;
            amount_total = session.amount_total;
            currency = session.currency;
            payment_status = session.payment_status;
            customer_email = session.customer_details?.email || null;
            metadata = session.metadata || {};
        } else {
            session = event.data.object as any;
            amount_total = session.amount;
            currency = session.currency;
            payment_status = session.status === 'succeeded' ? 'paid' : session.status;
            customer_email = session.receipt_email || null;
            metadata = session.metadata || {};
        }

        console.log(`Payment was successful for: ${session.id}`);
        
        if (db) {
          try {
            await db.collection('transactions').add({
              sessionId: session.id,
              amount: amount_total / 100, // Amount in units instead of cents
              currency: currency,
              status: payment_status,
              customerEmail: customer_email,
              locationId: metadata?.locationId || null,
              userId: metadata?.userId || null,
              createdAt: new Date().toISOString(),
            });
            console.log(`Transaction ${session.id} recorded successfully.`);
            
            // Increment discount uses if a code was used
            if (metadata?.discountCode && metadata?.locationId) {
                const discountsRef = db.collection('discounts');
                const snapshot = await discountsRef.where('code', '==', metadata.discountCode)
                                                   .where('locationId', '==', metadata.locationId)
                                                   .get();
                if (!snapshot.empty) {
                   const discountDoc = snapshot.docs[0];
                   await discountDoc.ref.update({
                      uses: (discountDoc.data().uses || 0) + 1
                   });
                }
            }
            
            // Automated Email Notifications
            if (metadata?.locationId) {
              const locationDoc = await db.collection('locations').doc(metadata.locationId).get();
              if (locationDoc.exists) {
                 const locationData = locationDoc.data();
                 const smtpConfig = locationData.smtpConfig || {};
                 
                 if (smtpConfig.enabled && smtpConfig.host && smtpConfig.username && smtpConfig.password) {
                     const nodemailer = await import('nodemailer');
                     const transporter = nodemailer.createTransport({
                         host: smtpConfig.host,
                         port: smtpConfig.port,
                         secure: smtpConfig.port === 465, // true for 465, false for other ports
                         auth: {
                             user: smtpConfig.username,
                             pass: smtpConfig.password
                         }
                     });
                     
                     const customerEmail = customer_email;
                     const amountInUnits = amount_total / 100;
                     const currencyStr = currency.toUpperCase();
                     
                     // Ensure voucher exists for this payment intent / session
                     let voucherCode = '';
                     try {
                         const vouchersRef = db.collection('vouchers');
                         const existingSnap = await vouchersRef.where('stripeSessionId', '==', session.id).get();
                         if (!existingSnap.empty) {
                             voucherCode = existingSnap.docs[0].data().code;
                         } else {
                             const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                             for (let i = 0; i < 8; i++) {
                               voucherCode += characters.charAt(Math.floor(Math.random() * characters.length));
                             }
                             let duration = 120;
                             if (metadata?.passName && metadata.passName.includes('Heures')) {
                                 const match = metadata.passName.match(/(\d+)\s*Heures/);
                                 if (match && match[1]) {
                                    duration = parseInt(match[1]) * 60;
                                 }
                             }
                             await vouchersRef.add({
                                code: voucherCode,
                                duration: duration,
                                locationId: metadata?.locationId || '',
                                status: 'active',
                                stripeSessionId: session.id,
                                createdAt: new Date().toISOString()
                             });
                         }
                     } catch (err) {
                         console.error("Failed to generate voucher in webhook:", err);
                     }
                     
                     // Send Receipt to Customer
                     if (customerEmail) {
                         try {
                           await transporter.sendMail({
                               from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                               to: customerEmail,
                               subject: "Votre code d'accès Wi-Fi",
                               html: `
                                 <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                   <div style="background-color: #6366f1; padding: 20px; text-align: center; color: white;">
                                     <h2>Reçu de paiement & Code d'accès</h2>
                                   </div>
                                   <div style="padding: 20px;">
                                     <p>Bonjour,</p>
                                     <p>Merci pour votre achat. Voici votre code pour l'accès Wi-Fi :</p>
                                     <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                       <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #6366f1; font-family: monospace;">${voucherCode}</span>
                                     </div>
                                     <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                       <strong>Montant payé :</strong> ${amountInUnits} ${currencyStr}
                                     </div>
                                     <p>Vous avez maintenant accès au réseau. Conservez cet email.</p>
                                     <p>Cordialement,<br/>L'équipe ${smtpConfig.fromName}</p>
                                   </div>
                                 </div>
                               `
                           });
                           console.log(`Receipt sent to ${customerEmail}`);
                         } catch (mailErr) {
                           console.error('Failed to send receipt:', mailErr);
                         }
                     }
                     
                     // High-value transaction alert to Business Owner (e.g., > 20 EUR)
                     if (amountInUnits >= 20) {
                        try {
                          await transporter.sendMail({
                               from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                               to: smtpConfig.fromEmail, // send to the business owner
                               subject: `🟢 Nouvelle transaction importante (${amountInUnits} ${currencyStr})`,
                               html: `
                                 <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 8px;">
                                   <div style="background-color: #10b981; padding: 15px; text-align: center; color: white; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                     <h3 style="margin: 0;">Alerte Transaction Premium</h3>
                                   </div>
                                   <div style="padding: 20px;">
                                     <p>Une nouvelle transaction d'un montant élevé vient d'être validée sur votre portail.</p>
                                     <ul style="padding-left: 20px;">
                                       <li><strong>Montant:</strong> ${amountInUnits} ${currencyStr}</li>
                                       <li><strong>Client:</strong> ${customerEmail || 'Non renseigné'}</li>
                                       <li><strong>Session Stripe:</strong> <code style="background: #f1f5f9; padding: 2px 4px;">${session.id}</code></li>
                                     </ul>
                                   </div>
                                 </div>
                               `
                          });
                          console.log(`High-value transaction alert sent for session ${session.id}`);
                        } catch (alertErr) {
                          console.error('Failed to send high-value alert:', alertErr);
                        }
                     }
                 }
                 
                 // Advanced Firewall/Radius integration pattern: Webhook out to UniFi/MikroTik 
                 // If the location has a Radius webhook configured, call it.
                 if (locationData.radiusWebhookUrl) {
                    try {
                       console.log(`Triggering Radius integration for MAC auth at ${locationData.radiusWebhookUrl}`);
                       let duration = metadata?.duration || 120;
                       if (metadata?.passName && metadata.passName.includes('Heures')) {
                           const match = metadata.passName.match(/(\d+)\s*Heures/);
                           if (match && match[1]) {
                              duration = parseInt(match[1]) * 60;
                           }
                       }
                       
                       await fetch(locationData.radiusWebhookUrl, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                             action: 'authorize',
                             mac: metadata?.clientMac || '',
                             duration: duration,
                             locationId: metadata?.locationId,
                             passName: metadata?.passName || ''
                         })
                       });
                       console.log('Radius integration webhook sent.');
                    } catch (radiusErr) {
                       console.error('Failed to trigger Radius integration:', radiusErr);
                    }
                 }
              }
            }
          } catch(dbErr) {
            console.error(`Failed to record transaction ${session.id}:`, dbErr);
          }
        }
      }

      res.json({ received: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).send(`Unhandled error: ${e.message}`);
    }
  });

  app.use(express.json());

  // API endpoints
  app.post("/api/generate-theme", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "missing GEMINI_API_KEY environment variable" });
      }

      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate a captive portal branding configuration based on the following brand/industry description: "${prompt}". Provide a theme color (Hex code), a short welcome message, and choose the most appropriate layout theme from: 'default', 'minimal', 'elegant', or 'modern'.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              themeColor: {
                type: Type.STRING,
                description: "A hex code for the primary brand color (e.g., #FF5733)."
              },
              marketingMessage: {
                type: Type.STRING,
                description: "A short welcome message suitable for the captive portal of this industry/brand."
              },
              layoutTheme: {
                type: Type.STRING,
                description: "The most appropriate layout theme. Must be one of: 'default', 'minimal', 'elegant', or 'modern'."
              }
            },
            required: ["themeColor", "marketingMessage", "layoutTheme"]
          }
        }
      });

      let textOutput = response.text || "";
      if (textOutput) {
        textOutput = textOutput.trim();
        if (textOutput.startsWith('```json')) {
            textOutput = textOutput.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        } else if (textOutput.startsWith('```')) {
            textOutput = textOutput.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
        }
        
        const parsed = JSON.parse(textOutput);
        res.json(parsed);
      } else {
         res.status(500).json({ error: "Failed to generate theme." });
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  });

  // Stripe Express Connect Endpoint
  app.post("/api/create-stripe-account-link", express.json(), async (req, res) => {
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(500).json({ error: "missing STRIPE_SECRET_KEY" });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);

      const { locationId, userId } = req.body;
      if (!locationId || !userId) return res.status(400).json({ error: "Missing locationId or userId" });

      if (!db) {
         return res.status(500).json({ error: "Database not initialized" });
      }
      
      const locRef = db.collection('locations').doc(locationId);
      const locDoc = await locRef.get();
      if (!locDoc.exists) return res.status(404).json({ error: "Location not found" });
      
      const locationData = locDoc.data();
      let accountId = locationData.stripeAccountId;

      if (!accountId) {
        // Create an Express connected account
        const account = await stripe.accounts.create({
          type: 'express',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        accountId = account.id;
        await locRef.update({ stripeAccountId: accountId });
      }

      const appUrl = process.env.APP_URL || "http://localhost:3000";

      // Create an account link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${appUrl}/dashboard?stripe_refresh=true`,
        return_url: `${appUrl}/dashboard?stripe_return=true`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(500).json({ error: "missing STRIPE_SECRET_KEY environment variable. Please configure it in your secrets." });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);

      const { locationId, userId, discountCode, clientMac } = req.body;
      let { priceAmount, passName, currency } = req.body;
      currency = currency || 'eur';

      // Apply discount if provided
      if (discountCode && db) {
        const discountsRef = db.collection('discounts');
        const snapshot = await discountsRef.where('code', '==', discountCode)
                                           .where('locationId', '==', locationId)
                                           .where('status', '==', 'active')
                                           .get();
        if (!snapshot.empty) {
          const discountDoc = snapshot.docs[0];
          const discount = discountDoc.data();
          if (discount.maxUses === null || discount.uses < discount.maxUses) {
            if (discount.type === 'percentage') {
              priceAmount = Math.max(0, Math.round(priceAmount * (1 - (discount.value / 100))));
            } else if (discount.type === 'flat') {
              priceAmount = Math.max(0, priceAmount - (discount.value * 100));
            }
          }
        }
      }

      if (priceAmount > 0 && priceAmount < 50) priceAmount = 50;
      if (priceAmount === 0) priceAmount = 50;

      let transfer_data: any = undefined;
      if (db && locationId) {
        const locDoc = await db.collection('locations').doc(locationId).get();
        if (locDoc.exists) {
          const locData = locDoc.data();
          if (locData.stripeAccountId) {
            const transferAmount = Math.round(priceAmount * 0.8);
            if (transferAmount > 0) {
                transfer_data = {
                  destination: locData.stripeAccountId,
                };
            }
          }
        }
      }

      const intentOpts: any = {
        amount: priceAmount,
        currency: currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          locationId: locationId || '',
          userId: userId || '',
          discountCode: discountCode || '',
          passName: passName || '',
          clientMac: clientMac || ''
        }
      };

      if (transfer_data) {
         intentOpts.application_fee_amount = priceAmount - Math.round(priceAmount * 0.8);
         intentOpts.transfer_data = transfer_data;
      }

      const paymentIntent = await stripe.paymentIntents.create(intentOpts);

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Unknown Stripe error" });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(500).json({ error: "missing STRIPE_SECRET_KEY environment variable." });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);

      const { payment_intent } = req.body;
      if (!payment_intent) {
        return res.status(400).json({ error: "Missing payment_intent" });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not succeeded", status: paymentIntent.status });
      }

      if (!db) {
         return res.status(500).json({ error: "Database not initialized" });
      }

      // Check if voucher already exists for this payment intent
      const vouchersRef = db.collection('vouchers');
      const existingVoucherSnap = await vouchersRef.where('stripeSessionId', '==', payment_intent).get();
      
      if (!existingVoucherSnap.empty) {
         const existingVoucher = existingVoucherSnap.docs[0].data();
         return res.json({ voucherCode: existingVoucher.code });
      }

      // Generate new voucher
      const metadata = paymentIntent.metadata || {};
      const locationId = metadata.locationId || '';
      
      // Extract duration from pass name or default to 120 (2h)
      let duration = 120;
      if (metadata.passName && metadata.passName.includes('Heures')) {
          const match = metadata.passName.match(/(\d+)\s*Heures/);
          if (match && match[1]) {
             duration = parseInt(match[1]) * 60;
          }
      }

      const generateCode = () => {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
      };

      const newCode = generateCode();

      await vouchersRef.add({
        code: newCode,
        duration: duration,
        locationId: locationId,
        status: 'active',
        stripeSessionId: payment_intent,
        createdAt: new Date().toISOString()
      });

      res.json({ voucherCode: newCode });
    } catch (e: any) {
      console.error("Error verifying payment:", e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  });

  // Stripe Checkout Endpoint
  app.get("/api/stripe-products", async (req, res) => {
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(500).json({ error: "missing STRIPE_SECRET_KEY environment variable." });
      }

      const locationId = req.query.locationId as string;
      if (!locationId) return res.status(400).json({ error: "Missing locationId" });

      if (!db) return res.status(500).json({ error: "Database not initialized" });
      const locDoc = await db.collection('locations').doc(locationId).get();
      if (!locDoc.exists) return res.status(404).json({ error: "Location not found" });

      const locData = locDoc.data();
      const accountId = locData.stripeAccountId;

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);

      let prices;
      if (accountId) {
        prices = await stripe.prices.list({ expand: ['data.product'], limit: 100 }, { stripeAccount: accountId });
      } else {
        prices = await stripe.prices.list({ expand: ['data.product'], limit: 100 });
      }

      const products = prices.data
        .filter(price => price.active && (price.product as any).active)
        .map(price => {
          const product = price.product as any;
          return {
            priceId: price.id,
            productId: product.id,
            name: product.name,
            description: product.description,
            priceAmount: price.unit_amount,
            currency: price.currency,
            interval: price.type === 'recurring' ? price.recurring?.interval : 'one_time'
          };
        });

      res.json({ products });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(500).json({ error: "missing STRIPE_SECRET_KEY environment variable. Please configure it in your secrets." });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);

      const { locationId, userId, discountCode, priceId } = req.body;
      let { priceAmount, passName } = req.body;
      const appUrl = process.env.APP_URL || "http://localhost:3000";

      let finalPriceAmount = priceAmount;

      // Apply discount if provided
      if (discountCode && db) {
        const discountsRef = db.collection('discounts');
        const snapshot = await discountsRef.where('code', '==', discountCode)
                                           .where('locationId', '==', locationId)
                                           .where('status', '==', 'active')
                                           .get();
        if (!snapshot.empty) {
          const discountDoc = snapshot.docs[0];
          const discount = discountDoc.data();
          if (discount.maxUses === null || discount.uses < discount.maxUses) {
            if (discount.type === 'percentage') {
              finalPriceAmount = Math.max(0, Math.round(finalPriceAmount * (1 - (discount.value / 100))));
            } else if (discount.type === 'flat') {
              // Convert flat discount to cents first
              finalPriceAmount = Math.max(0, finalPriceAmount - (discount.value * 100));
            }
            // We should increment the uses later, maybe on successful payment.
          }
        }
      }

      if (!priceId) {
        if (finalPriceAmount > 0 && finalPriceAmount < 50) finalPriceAmount = 50;

        if (finalPriceAmount === 0) {
           finalPriceAmount = 50;
           passName = passName + " (Discounted to min 0.50€)";
        }
      }

      let transfer_data: any = undefined;
      let accountIdToUse: string | undefined = undefined;

      // Configure sub-merchant payout via Stripe Connect if applicable.
      if (db && locationId) {
        const locDoc = await db.collection('locations').doc(locationId).get();
        if (locDoc.exists) {
          const locData = locDoc.data();
          if (locData.stripeAccountId) {
            accountIdToUse = locData.stripeAccountId;
            const transferAmount = Math.round((finalPriceAmount || 0) * 0.8);
            if (transferAmount > 0) {
                transfer_data = {
                  destination: locData.stripeAccountId,
                };
            }
          }
        }
      }

      const line_item = priceId ? { price: priceId, quantity: 1 } : {
        price_data: {
          currency: 'eur',
          product_data: {
            name: passName,
            description: `Accès Wi-Fi pour ${passName}`,
          },
          unit_amount: finalPriceAmount,
        },
        quantity: 1,
      };

      const sessionOpts: any = {
        ui_mode: 'embedded' as any,
        line_items: [line_item],
        mode: 'payment',
        metadata: {
          locationId: locationId || '',
          userId: userId || '',
          discountCode: discountCode || ''
        },
        return_url: `${appUrl}/portal?locationId=${locationId}&payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      };

      if (transfer_data && !priceId) {
         sessionOpts.payment_intent_data = {
           application_fee_amount: finalPriceAmount - Math.round(finalPriceAmount * 0.8),
           transfer_data: transfer_data
         };
      }

      const sessionRequestOpts = (accountIdToUse && priceId) ? { stripeAccount: accountIdToUse } : undefined;

      const session = await stripe.checkout.sessions.create(sessionOpts, sessionRequestOpts);

      res.json({ clientSecret: session.client_secret });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Unknown Stripe error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
