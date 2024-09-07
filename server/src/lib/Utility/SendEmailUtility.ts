import {Resend} from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/* Use Resend to send the verification email along with the token created while Registering */
export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `http://localhost:5000/auth/new-varification?token=${token}`;
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Confirm your email",
      html: `<p>Click <a href="${confirmLink}">here</a> to confirm email. You have 1 hour before this link expires.</p>`,
    });
    return data;
  } catch (error) {
    console.error(error);
  }
}

/* Use Resend to Send the 2FA Token for login */
export async function sendTwoFactorEmail(email: string, token: string) {
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Login Auth Code",
      html: `<p>Your 2FA code: ${token}.</p>`,
    });
    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `http://localhost:5000/auth/new-password?token=${token}`;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Confirm your email",
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`,
  });
}
