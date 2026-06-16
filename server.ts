import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import cron from 'node-cron';
import { initializeApp as initializeAdminApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin for background tasks
  let adminDb: any = null;
  try {
    const adminApp = initializeAdminApp({
      projectId: "studio-8479066300-24a9a",
      credential: applicationDefault()
    });
    adminDb = getAdminFirestore(adminApp, "ai-studio-e122ace1-e8ea-43ff-9de3-8dcb4cf686e6");
    console.log("Firebase Admin initialized for automated backups.");
    
    // Schedule backup task every 24 hours (at midnight)
    cron.schedule('0 0 * * *', async () => {
      console.log("Starting automated 24h backup task...");
      try {
        if (!adminDb) return;
        
        const timestamp = new Date().toISOString();
        const backupRef = adminDb.collection('backups').doc(`backup-${timestamp}`);
        
        // 1. Backup Captive Portal Configurations (locations)
        const locationsSnap = await adminDb.collection('locations').get();
        const locationsBackup = locationsSnap.docs.map((doc: any) => ({
           id: doc.id,
           ...doc.data()
        }));
        
        // 2. Backup User Logs
        const logsSnap = await adminDb.collection('userLogs').limit(5000).get();
        const userLogsBackup = logsSnap.docs.map((doc: any) => ({
           id: doc.id,
           ...doc.data()
        }));
        
        // 3. Save to a separate collection
        await backupRef.set({
          timestamp,
          type: 'daily_backup',
          metadata: {
            locationsCount: locationsBackup.length,
            userLogsCount: userLogsBackup.length
          },
          locations: locationsBackup,
          userLogs: userLogsBackup
        });
        
        console.log(`Backup completed successfully at ${timestamp}`);
      } catch (err: any) {
         console.error("Backup failed: ", err.message);
      }
    });
  } catch (err: any) {
    console.log("Skipping Firebase Admin initialization (expected if application default credentials are unavailable): ", err.message);
  }

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
        
        if (adminDb) {
          try {
            await adminDb.collection('transactions').add({
              sessionId: session.id,
              amount: session.amount_total / 100, // Amount in units instead of cents
              currency: session.currency,
              status: session.payment_status,
              customerEmail: session.customer_details?.email || null,
              createdAt: new Date().toISOString(),
            });
            console.log(`Transaction ${session.id} recorded successfully.`);
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

  // Stripe Checkout Endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return res.status(500).json({ error: "missing STRIPE_SECRET_KEY environment variable. Please configure it in your secrets." });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);

      const { priceId, passName, priceAmount, locationId } = req.body;
      const appUrl = process.env.APP_URL || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
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
        return_url: `${appUrl}/portal?locationId=${locationId}&payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      });

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
