/**
 * services/emailService.ts
 * Servicio para envío de emails usando Nodemailer con Gmail (Cloud Functions)
 */

import nodemailer from 'nodemailer';
import * as functions from 'firebase-functions';
import { ApiError } from '../middleware/errorHandler';

interface EmailVerificationParams {
  email: string;
  displayName: string;
  verificationLink: string;
}

interface PasswordResetParams {
  email: string;
  displayName: string;
  resetLink: string;
}

class EmailService {
  private transporter;
  private appName = 'CineApp';

  constructor() {
    // Configurar transporter de Gmail usando Firebase Config
    const gmailUser = functions.config().gmail?.user || process.env.GMAIL_USER;
    const gmailPassword = functions.config().gmail?.password || process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      console.error('❌ Gmail credentials not configured');
      console.error('Run: firebase functions:config:set gmail.user="email" gmail.password="password"');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    // Verificar conexión al iniciar
    this.verifyConnection();
  }

  /**
   * Verifica que la conexión con Gmail funcione
   */
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Servicio de email configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando servicio de email:', error);
    }
  }

  /**
   * Envía email de verificación
   */
  async sendVerificationEmail(params: EmailVerificationParams): Promise<void> {
    const { email, displayName, verificationLink } = params;

    const mailOptions = {
      from: `"${this.appName}" <${functions.config().gmail?.user || process.env.GMAIL_USER}>`,
      to: email,
      subject: `Verifica tu cuenta en ${this.appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              margin-top: 0;
            }
            .button {
              display: inline-block;
              padding: 15px 40px;
              background: #667eea;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .link-box {
              word-break: break-all;
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              background: #f9f9f9;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 ${this.appName}</h1>
            </div>
            
            <div class="content">
              <h2>¡Hola ${displayName}! 👋</h2>
              
              <p>Gracias por registrarte en <strong>${this.appName}</strong>. Estamos emocionados de tenerte con nosotros.</p>
              
              <p>Para completar tu registro y disfrutar de todas las funciones, necesitas verificar tu cuenta:</p>
              
              <div class="button-container">
                <a href="${verificationLink}" class="button">
                  ✅ Verificar mi cuenta
                </a>
              </div>
              
              <p><small>Si el botón no funciona, copia y pega este enlace en tu navegador:</small></p>
              
              <div class="link-box">
                ${verificationLink}
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira en 24 horas por seguridad.
              </div>
              
              <p>Si no creaste una cuenta en ${this.appName}, simplemente ignora este email.</p>
              
              <p>¡Nos vemos en el cine! 🍿</p>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.appName}. Todos los derechos reservados.</p>
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hola ${displayName},
        
        Gracias por registrarte en ${this.appName}.
        
        Para verificar tu cuenta, haz clic en este enlace:
        ${verificationLink}
        
        Este link expira en 24 horas.
        
        Si no solicitaste esta cuenta, ignora este email.
        
        ¡Nos vemos en el cine! 🍿
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de verificación enviado:', info.messageId);
      console.log('📧 Destinatario:', email);
    } catch (error: any) {
      console.error('❌ Error enviando email de verificación:', error);
      throw new ApiError(500, 'Error al enviar email de verificación');
    }
  }

  /**
   * Envía email de reseteo de contraseña
   */
  async sendPasswordResetEmail(params: PasswordResetParams): Promise<void> {
    const { email, displayName, resetLink } = params;

    const mailOptions = {
      from: `"${this.appName}" <${functions.config().gmail?.user || process.env.GMAIL_USER}>`,
      to: email,
      subject: `Restablece tu contraseña en ${this.appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              margin-top: 0;
            }
            .button {
              display: inline-block;
              padding: 15px 40px;
              background: #f5576c;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .link-box {
              word-break: break-all;
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #f5576c;
              margin: 20px 0;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info {
              background: #d1ecf1;
              border-left: 4px solid #17a2b8;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              background: #f9f9f9;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 ${this.appName}</h1>
            </div>
            
            <div class="content">
              <h2>Hola ${displayName},</h2>
              
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
              
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              
              <div class="button-container">
                <a href="${resetLink}" class="button">
                  🔐 Restablecer contraseña
                </a>
              </div>
              
              <p><small>Si el botón no funciona, copia y pega este enlace en tu navegador:</small></p>
              
              <div class="link-box">
                ${resetLink}
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira en 1 hora por seguridad.
              </div>
              
              <div class="info">
                <strong>ℹ️ ¿No solicitaste esto?</strong><br>
                Si no solicitaste restablecer tu contraseña, ignora este email. Tu contraseña permanecerá sin cambios y tu cuenta estará segura.
              </div>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.appName}. Todos los derechos reservados.</p>
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hola ${displayName},
        
        Recibimos una solicitud para restablecer tu contraseña.
        
        Para crear una nueva contraseña, haz clic en este enlace:
        ${resetLink}
        
        Este link expira en 1 hora.
        
        Si no solicitaste esto, ignora este email.
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de reseteo enviado:', info.messageId);
      console.log('📧 Destinatario:', email);
    } catch (error: any) {
      console.error('❌ Error enviando email de reseteo:', error);
      throw new ApiError(500, 'Error al enviar email de reseteo');
    }
  }

  /**
   * Envía email de bienvenida (cuando verifican el email)
   */
  async sendWelcomeEmail(email: string, displayName: string): Promise<void> {
    const mailOptions = {
      from: `"${this.appName}" <${functions.config().gmail?.user || process.env.GMAIL_USER}>`,
      to: email,
      subject: `¡Bienvenido a ${this.appName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .content {
              padding: 40px 30px;
            }
            .success {
              background: #d4edda;
              border-left: 4px solid #28a745;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              color: #155724;
            }
            .features {
              margin: 30px 0;
            }
            .feature-item {
              padding: 15px;
              margin: 10px 0;
              background: #f9f9f9;
              border-radius: 5px;
              border-left: 4px solid #667eea;
            }
            .footer {
              text-align: center;
              padding: 20px;
              background: #f9f9f9;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 ${this.appName}</h1>
              <h2>¡Email verificado!</h2>
            </div>
            
            <div class="content">
              <div class="success">
                ✅ ¡Felicidades ${displayName}! 🎉
              </div>
              
              <p>Tu email ha sido verificado exitosamente.</p>
              
              <p><strong>Ya puedes disfrutar de todas las funciones:</strong></p>
              
              <div class="features">
                <div class="feature-item">
                  🎥 <strong>Explorar</strong> miles de películas y estrenos
                </div>
                <div class="feature-item">
                  ⭐ <strong>Crear</strong> tu lista de favoritos
                </div>
                <div class="feature-item">
                  🎫 <strong>Comprar</strong> entradas de forma segura
                </div>
                <div class="feature-item">
                  💬 <strong>Dejar</strong> reseñas y calificaciones
                </div>
                <div class="feature-item">
                  🔔 <strong>Recibir</strong> notificaciones de estrenos
                </div>
              </div>
              
              <p>¡Disfruta de la mejor experiencia de cine! 🍿</p>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.appName}. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenida enviado:', info.messageId);
    } catch (error: any) {
      console.error('❌ Error enviando email de bienvenida:', error);
      // No lanzar error, es solo informativo
    }
  }
}

export default new EmailService();