import nodemailer from 'nodemailer';

// Email configuration - using placeholders for secrets
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'PLACEHOLDER_SMTP_HOST',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'PLACEHOLDER_SMTP_USER',
    pass: process.env.SMTP_PASS || 'PLACEHOLDER_SMTP_PASS',
  },
};

// App configuration
const APP_CONFIG = {
  name: 'بوابة نظم المعلومات الجغرافية',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://gisgate.com',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@gisgate.com',
  fromEmail: process.env.FROM_EMAIL || 'noreply@gisgate.com',
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  verificationToken: string;
}

export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterEmailData {
  firstName: string;
  lastName: string;
  email: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport(EMAIL_CONFIG);

  // Verify email configuration
  static async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  }

  // Send generic email
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${APP_CONFIG.name}" <${APP_CONFIG.fromEmail}>`,
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Send welcome/verification email
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const verificationUrl = `${APP_CONFIG.url}/auth/verify-email?token=${data.verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مرحباً بك في ${APP_CONFIG.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; color: #333; line-height: 1.6; }
          .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
          .social-links { margin: 20px 0; }
          .social-links a { margin: 0 10px; color: #1e40af; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>مرحباً بك في ${APP_CONFIG.name}</h1>
            <p>منصة التعلم المتخصصة في نظم المعلومات الجغرافية</p>
          </div>

          <div class="content">
            <h2>مرحباً ${data.name}!</h2>
            <p>شكراً لتسجيلك في ${APP_CONFIG.name}. نحن متحمسون لانضمامك إلينا!</p>

            <p>لإكمال عملية التسجيل وتفعيل حسابك، يرجى الضغط على الزر أدناه للتحقق من عنوان بريدك الإلكتروني:</p>

            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">تفعيل الحساب</a>
            </div>

            <p>إذا لم يعمل الزر، يمكنك نسخ ولصق الرابط التالي في متصفحك:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${verificationUrl}</p>

            <p>هذا الرابط صالح لمدة 24 ساعة فقط.</p>

            <p>إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا على ${APP_CONFIG.supportEmail}</p>

            <p>مع خالص التحية,<br>فريق ${APP_CONFIG.name}</p>
          </div>

          <div class="footer">
            <div class="social-links">
              <a href="https://x.com/gis_gate">تويتر</a> |
              <a href="https://www.facebook.com/arabgisgate">فيسبوك</a> |
              <a href="https://www.youtube.com/channel/UC1R4Y31wIYw3KZN5vdPrN1w">يوتيوب</a>
            </div>
            <p>&copy; 2025 ${APP_CONFIG.name}. جميع الحقوق محفوظة.</p>
            <p>هذا البريد الإلكتروني مرسل إليك لأنك قمت بالتسجيل في موقعنا. إذا كنت لا تريد تلقي رسائل إلكترونية منا، يمكنك إلغاء الاشتراك في أي وقت.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
مرحباً ${data.name}!

شكراً لتسجيلك في ${APP_CONFIG.name}.

لإكمال عملية التسجيل، يرجى زيارة الرابط التالي للتحقق من بريدك الإلكتروني:
${verificationUrl}

هذا الرابط صالح لمدة 24 ساعة.

مع خالص التحية,
فريق ${APP_CONFIG.name}
    `.trim();

    return this.sendEmail({
      to: data.email,
      subject: `مرحباً بك في ${APP_CONFIG.name} - تفعيل الحساب`,
      html,
      text,
    });
  }

  // Send contact form email
  static async sendContactEmail(data: ContactEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>رسالة اتصال جديدة</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; color: #333; line-height: 1.6; }
          .message-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af; margin: 20px 0; }
          .info-item { margin: 10px 0; }
          .label { font-weight: bold; color: #1e40af; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>رسالة اتصال جديدة</h1>
            <p>تم استلام رسالة من خلال نموذج الاتصال</p>
          </div>

          <div class="content">
            <div class="info-item">
              <span class="label">الاسم:</span> ${data.name}
            </div>
            <div class="info-item">
              <span class="label">البريد الإلكتروني:</span> ${data.email}
            </div>
            <div class="info-item">
              <span class="label">الموضوع:</span> ${data.subject}
            </div>

            <div class="message-box">
              <div class="label">الرسالة:</div>
              <div style="margin-top: 10px; white-space: pre-wrap;">${data.message}</div>
            </div>

            <p>يمكنك الرد مباشرة على هذا البريد الإلكتروني للتواصل مع العميل.</p>
          </div>

          <div class="footer">
            <p>هذه الرسالة مرسلة من نموذج الاتصال في ${APP_CONFIG.name}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
رسالة اتصال جديدة

الاسم: ${data.name}
البريد الإلكتروني: ${data.email}
الموضوع: ${data.subject}

الرسالة:
${data.message}

---
هذه الرسالة مرسلة من نموذج الاتصال في ${APP_CONFIG.name}
    `.trim();

    return this.sendEmail({
      to: APP_CONFIG.supportEmail,
      subject: `رسالة اتصال جديدة: ${data.subject}`,
      html,
      text,
    });
  }

  // Send newsletter subscription confirmation
  static async sendNewsletterConfirmation(data: NewsletterEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تأكيد الاشتراك في النشرة الإخبارية</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; color: #333; line-height: 1.6; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
          .social-links { margin: 20px 0; }
          .social-links a { margin: 0 10px; color: #059669; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✓</div>
            <h1>تم تأكيد اشتراكك بنجاح!</h1>
            <p>مرحباً بك في عائلة ${APP_CONFIG.name}</p>
          </div>

          <div class="content">
            <h2>مرحباً ${data.firstName} ${data.lastName}!</h2>
            <p>شكراً لاشتراكك في النشرة الإخبارية لـ ${APP_CONFIG.name}.</p>

            <p>ستتلقى الآن تحديثات منتظمة حول:</p>
            <ul>
              <li>الدورات التدريبية الجديدة في نظم المعلومات الجغرافية</li>
              <li>المحتوى التعليمي والمقالات</li>
              <li>الأخبار والتحديثات</li>
              <li>العروض والخصومات الخاصة</li>
            </ul>

            <p>نحن ملتزمون بحماية خصوصيتك ونعدك بعدم إرسال رسائل مزعجة.</p>

            <p>إذا كان لديك أي أسئلة، يمكنك التواصل معنا على ${APP_CONFIG.supportEmail}</p>

            <p>مع خالص التحية,<br>فريق ${APP_CONFIG.name}</p>
          </div>

          <div class="footer">
            <div class="social-links">
              <a href="https://x.com/gis_gate">تويتر</a> |
              <a href="https://www.facebook.com/arabgisgate">فيسبوك</a> |
              <a href="https://www.youtube.com/channel/UC1R4Y31wIYw3KZN5vdPrN1w">يوتيوب</a>
            </div>
            <p>&copy; 2025 ${APP_CONFIG.name}. جميع الحقوق محفوظة.</p>
            <p>هذا البريد الإلكتروني مرسل إليك لأنك اشتركت في نشرتنا الإخبارية. يمكنك إلغاء الاشتراك في أي وقت من خلال الرابط الموجود في أسفل رسائلنا.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
مرحباً ${data.firstName} ${data.lastName}!

شكراً لاشتراكك في النشرة الإخبارية لـ ${APP_CONFIG.name}.

ستتلقى الآن تحديثات منتظمة حول الدورات التدريبية والمحتوى التعليمي والأخبار.

مع خالص التحية,
فريق ${APP_CONFIG.name}
    `.trim();

    return this.sendEmail({
      to: data.email,
      subject: `تم تأكيد اشتراكك في نشرة ${APP_CONFIG.name}`,
      html,
      text,
    });
  }

  // Send newsletter to subscribers (for future use)
  static async sendNewsletterToSubscribers(subject: string, content: string, subscribers: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of subscribers) {
      const sent = await this.sendEmail({
        to: email,
        subject,
        html: content,
      });

      if (sent) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }
}