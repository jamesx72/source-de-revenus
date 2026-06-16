import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from "firebase/firestore";
import fs from "fs";

// Initialize Firebase Client SDK for server-side operations (Stripe webhooks)
let db: any = null;
try {
  const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
  const app = initializeApp(firebaseConfig, "server-app");
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  console.log("Firebase Client SDK initialized on server.");
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

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        console.log('Payment was successful for session:', session.id);
        
        if (db) {
          try {
            await addDoc(collection(db, 'transactions'), {
              sessionId: session.id,
              amount: session.amount_total / 100, // Amount in units instead of cents
              currency: session.currency,
              status: session.payment_status,
              customerEmail: session.customer_details?.email || null,
              locationId: session.metadata?.locationId || null,
              userId: session.metadata?.userId || null,
              createdAt: new Date().toISOString(),
            });
            console.log(`Transaction ${session.id} recorded successfully.`);
            
            // Increment discount uses if a code was used
            if (session.metadata?.discountCode && session.metadata?.locationId) {
                const discountsRef = collection(db, 'discounts');
                const q = query(discountsRef, where('code', '==', session.metadata.discountCode), where('locationId', '==', session.metadata.locationId));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                   const discountDoc = snapshot.docs[0];
                   await updateDoc(doc(db, 'discounts', discountDoc.id), {
                      uses: (discountDoc.data().uses || 0) + 1
                   });
                }
            }
            
            // Automated Email Notifications
            if (session.metadata?.locationId) {
              const locationDoc = await getDoc(doc(db, 'locations', session.metadata.locationId));
              if (locationDoc.exists()) {
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
                     
                     const customerEmail = session.customer_details?.email;
                     const amountInUnits = session.amount_total / 100;
                     const currency = session.currency.toUpperCase();
                     
                     // Send Receipt to Customer
                     if (customerEmail) {
                         try {
                           await transporter.sendMail({
                               from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
                               to: customerEmail,
                               subject: "Votre reçu de paiement Wi-Fi",
                               html: `
                                 <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                   <div style="background-color: #6366f1; padding: 20px; text-align: center; color: white;">
                                     <h2>Reçu de paiement</h2>
                                   </div>
                                   <div style="padding: 20px;">
                                     <p>Bonjour,</p>
                                     <p>Merci pour votre achat. Voici votre reçu pour l'accès Wi-Fi.</p>
                                     <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                       <strong>Montant payé:</strong> ${amountInUnits} ${currency}
                                     </div>
                                     <p>Vous avez maintenant accès au réseau. Pensez à conserver cet email comme preuve d'achat.</p>
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
                               subject: `🟢 Nouvelle transaction importante (${amountInUnits} ${currency})`,
                               html: `
                                 <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 8px;">
                                   <div style="background-color: #10b981; padding: 15px; text-align: center; color: white; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                     <h3 style="margin: 0;">Alerte Transaction Premium</h3>
                                   </div>
                                   <div style="padding: 20px;">
                                     <p>Une nouvelle transaction d'un montant élevé vient d'être validée sur votre portail.</p>
                                     <ul style="padding-left: 20px;">
                                       <li><strong>Montant:</strong> ${amountInUnits} ${currency}</li>
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
                       await fetch(locationData.radiusWebhookUrl, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                             action: 'authorize',
                             mac: 'client-mac-address', // Typically passed in session.metadata or gathered during portal login
                             duration: session.metadata.duration || 60,
                             locationId: session.metadata.locationId
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
      
      const locRef = doc(db, 'locations', locationId);
      const locDoc = await getDoc(locRef);
      if (!locDoc.exists()) return res.status(404).json({ error: "Location not found" });
      
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
        await updateDoc(locRef, { stripeAccountId: accountId });
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

  // Stripe Checkout Endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(500).json({ error: "missing STRIPE_SECRET_KEY environment variable. Please configure it in your secrets." });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);

      const { locationId, userId, discountCode } = req.body;
      let { priceAmount, passName } = req.body;
      const appUrl = process.env.APP_URL || "http://localhost:3000";

      // Apply discount if provided
      if (discountCode && db) {
        const discountsRef = collection(db, 'discounts');
        const q = query(discountsRef, where('code', '==', discountCode), where('locationId', '==', locationId), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const discountDoc = snapshot.docs[0];
          const discount = discountDoc.data();
          if (discount.maxUses === null || discount.uses < discount.maxUses) {
            if (discount.type === 'percentage') {
              priceAmount = Math.max(0, Math.round(priceAmount * (1 - (discount.value / 100))));
            } else if (discount.type === 'flat') {
              // Convert flat discount to cents first
              priceAmount = Math.max(0, priceAmount - (discount.value * 100));
            }
            // We should increment the uses later, maybe on successful payment.
          }
        }
      }

      // Ensure priceAmount is at least 50 cents (Stripe minimum for EUR usually, but let's assume it handles 0 or free somehow, actually Stripe checkout min is 0.5 EUR)
      // Since it's checkout session, if it's 0 we might need a different flow. But for now let's just make it minimum 50 cents if it's less than 50 and greater than 0, or just allow it to fail or be free if Stripe supports it (requires 100% discount differently, but assuming minimum 50 cents).
      if (priceAmount > 0 && priceAmount < 50) priceAmount = 50;

      if (priceAmount === 0) {
         // Free checkout bypass (needs frontend implementation, but for now we just use a minimum of 50 cents or handle later).
         // Just a safeguard:
         priceAmount = 50;
         passName = passName + " (Discounted to min 0.50€)";
      }

      let transfer_data: any = undefined;
      // Configure sub-merchant payout via Stripe Connect if applicable.
      if (db && locationId) {
        const locDoc = await getDoc(doc(db, 'locations', locationId));
        if (locDoc.exists()) {
          const locData = locDoc.data();
          if (locData.stripeAccountId) {
            // Keep 20% platform fee, 80% to the affiliated location sub-merchant.
            const transferAmount = Math.round(priceAmount * 0.8);
            if (transferAmount > 0) {
                transfer_data = {
                  destination: locData.stripeAccountId,
                };
            }
          }
        }
      }

      const sessionOpts: any = {
        ui_mode: 'embedded' as any,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: passName,
                description: `Accès Wi-Fi pour ${passName}`,
              },
              unit_amount: priceAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        metadata: {
          locationId: locationId || '',
          userId: userId || '',
          discountCode: discountCode || ''
        },
        return_url: `${appUrl}/portal?locationId=${locationId}&payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      };

      if (transfer_data) {
         sessionOpts.payment_intent_data = {
           application_fee_amount: priceAmount - Math.round(priceAmount * 0.8),
           transfer_data: transfer_data
         };
      }

      const session = await stripe.checkout.sessions.create(sessionOpts);

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
