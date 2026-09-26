import { sendMail } from "../lib/mailer.js";

export async function contact(req, res) {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const html = `
    <div style="font-family:Arial; max-width:540px; margin:auto;">
      <h2>New contact message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
      <p><strong>Message:</strong><br/>${String(message).replace(/\n/g, "<br/>")}</p>
    </div>
  `;

  await sendMail({
    to: process.env.SMTP_USER || "flipsaura187@gmail.com",
    subject: `Contact from ${name} via FlipsAura`,
    html,
  });

  await sendMail({
    to: email,
    subject: "We've received your message – FlipsAura",
    html: `
      <h2>Thank you, ${name}!</h2>
      <p>We'll get back to you within 24 hours.</p>
      <p>— Team FlipsAura</p>
    `,
  });

  res.json({ success: true });
}
