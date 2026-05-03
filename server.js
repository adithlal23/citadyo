import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ SUPABASE CONFIG
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

/* =========================
   EXISTING EMAIL ROUTES (UNCHANGED)
========================= */

app.post('/api/send-welcome-email', async (req, res) => {
  const { email } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Citadyo <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to Citadyo 🎉',
      text: `Hi there,

Thank you for joining Citadyo.

Stay tuned — we’ll keep you updated.

— Team Citadyo`,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-investor-email', async (req, res) => {
  const { email } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Citadyo <onboarding@resend.dev>',
      to: email,
      subject: 'Thanks for your interest in Citadyo',
      text: `Hi,

Thanks for your interest in Citadyo.

We’ll get back to you with more details soon.

— Team Citadyo`,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-associate-email', async (req, res) => {
  const { email } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Citadyo <onboarding@resend.dev>',
      to: email,
      subject: 'Thanks for applying to Citadyo',
      text: `Hi,

Thanks for applying as a Citadyo Associate.

We’ll review your application soon.

— Team Citadyo`,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-driver-email', async (req, res) => {
  const { email } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Citadyo <onboarding@resend.dev>',
      to: email,
      subject: 'Thanks for joining Citadyo',
      text: `Hi,

Thanks for your interest in driving with Citadyo.

We’ll review your details and get back soon.

— Team Citadyo`,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   RENTAL API 
========================= */

app.post('/api/rental', async (req, res) => {
  try {
    const data = req.body;
    console.log("Incoming data:", data);

    // ✅ SAVE TO SUPABASE
    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/rental_partners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        company_name: data.company_name,
        owner_name: data.owner_name,
        email: data.email || null,
        contact_number: data.phone,
        city_area: data.city_area,
        business_address: data.address,
        website: data.website || null,

        service_type: data.service_type,
        use_cases: data.use_cases,

        vehicle_count: data.vehicle_count,
        vehicle_types: data.vehicle_types,

        pilot_ready: data.pilot_ready === "Yes",
        on_demand_ready: data.on_demand === "Yes",

        platform_experience: data.experience || null,
        motivation: data.motivation,

        declaration: true
      }),
    });

    // ❌ HANDLE ERROR
    if (!supabaseRes.ok) {
      const errorText = await supabaseRes.text();
      console.error("Supabase error:", errorText);
      return res.status(400).json({ error: errorText });
    }

    // ✅ SEND EMAIL
    if (data.email) {
      await resend.emails.send({
        from: 'Citadyo <onboarding@resend.dev>',
        to: data.email,
        subject: 'Welcome to Citadyo Partner Network 🤝',
        html: `
          <h2>Thanks for partnering with Citadyo 🚀</h2>
          <p>Hi ${data.owner_name || "Partner"},</p>
          <p>We’ve received your application.</p>
          <p>Our team will review and get back to you soon.</p>
          <br/>
          <p>— Team Citadyo</p>
        `,
      });
    }

    // ✅ FINAL RESPONSE
    res.json({ success: true });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ========================= */

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
app.post('/api/delivery', async (req, res) => {
  try {
    const data = req.body;

    console.log("Delivery Data:", data);

    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/delivery_partners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        city_area: data.city_area,
        native_place: data.native_place,

        vehicle_type: data.vehicle_type,
        vehicle_number: data.vehicle_number,
        vehicle_model: data.vehicle_model,
        capacity: data.capacity,

        delivery_ready: data.delivery_ready === "Yes",
        preferred_areas: data.areas,

        primary_language: data.primary_language,
        other_languages: data.other_languages,

        availability: data.availability,
        experience: data.experience,

        declaration: true
      }),
    });

    if (!supabaseRes.ok) {
      const err = await supabaseRes.text();
      console.error("Supabase error:", err);
      return res.status(400).json({ error: err });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});