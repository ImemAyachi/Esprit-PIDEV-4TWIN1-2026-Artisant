import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Transporter Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,     // Votre adresse Gmail (ex: mon.app@gmail.com)
      pass: process.env.SMTP_PASSWORD,  // Votre "Mot de passe d'application" Gmail (pas le mot de passe du compte standard)
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'Artisanet'} <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Facultatif
  };

  try {
    await transporter.sendMail(message);
    console.log(`Email envoyé à ${options.email}`);
    return true;
  } catch (error) {
    console.warn(`[Avertissement] Impossible d'envoyer l'email : ${error.message}`);
    console.log('--- Êtes-vous sûr(e) que SMTP_EMAIL et SMTP_PASSWORD sont configurés dans votre fichier .env ? ---');
    return false;
  }
};

export default sendEmail;
