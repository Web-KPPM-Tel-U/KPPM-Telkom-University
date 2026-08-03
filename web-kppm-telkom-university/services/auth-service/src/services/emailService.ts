import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Kirim email OTP ke mentor
 */
export const sendOtpEmail = async (toEmail: string, otp: string): Promise<void> => {
  const from = process.env.EMAIL_FROM || `"KPPM Telkom University" <${process.env.SMTP_USER}>`;

  const mailOptions = {
    from,
    to: toEmail,
    subject: 'Kode OTP Login Mentor — KPPM Telkom University',
    html: `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Kode OTP Login Mentor</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#CC0000,#990000);padding:32px 40px;text-align:center;">
                    <table cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td style="background:rgba(255,255,255,0.15);border-radius:14px;padding:10px 14px;display:inline-block;">
                          <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">SISTEM KPPM</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:6px;">
                          <span style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:1px;">TELKOM UNIVERSITY</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Kode Verifikasi Login Mentor</p>
                    <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111827;">Masuk ke Portal Mentor</h1>
                    
                    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
                      Halo, Anda menerima email ini karena ada permintaan login ke portal Mentor 
                      Sistem Manajemen KPPM Telkom University. Gunakan kode OTP berikut untuk masuk:
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 28px;">
                          <div style="display:inline-block;background:#fff5f5;border:2px dashed #CC0000;border-radius:16px;padding:20px 48px;">
                            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#CC0000;letter-spacing:2px;text-transform:uppercase;">Kode OTP Anda</p>
                            <p style="margin:0;font-size:42px;font-weight:900;color:#CC0000;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:13px;font-weight:700;color:#374151;">Kode berlaku selama <span style="color:#CC0000;">5 menit</span></p>
                                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Setelah 5 menit, Anda perlu meminta kode baru.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 20px 16px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:13px;font-weight:700;color:#374151;">Jaga kerahasiaan kode ini</p>
                                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Jangan bagikan kode ini kepada siapapun.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                      Jika Anda tidak merasa meminta kode ini, abaikan email ini. 
                      Tidak ada tindakan yang diperlukan.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #f0f0f0;padding:20px 40px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      © ${new Date().getFullYear()} Sistem Manajemen KPPM — Telkom University<br/>
                      Email ini dikirim secara otomatis, mohon tidak membalas email ini.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Kirim email OTP verifikasi email mahasiswa
 */
export const sendStudentVerifyOtpEmail = async (toEmail: string, otp: string): Promise<void> => {
  const from = process.env.EMAIL_FROM || `"KPPM Telkom University" <${process.env.SMTP_USER}>`;

  const mailOptions = {
    from,
    to: toEmail,
    subject: 'Kode Verifikasi Email — KPPM Telkom University',
    html: `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Kode Verifikasi Email Mahasiswa</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#CC0000,#990000);padding:32px 40px;text-align:center;">
                    <table cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td style="background:rgba(255,255,255,0.15);border-radius:14px;padding:10px 14px;display:inline-block;">
                          <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">SISTEM KPPM</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:6px;">
                          <span style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:1px;">TELKOM UNIVERSITY</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Verifikasi Akun Mahasiswa</p>
                    <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111827;">Konfirmasi Email Anda</h1>
                    
                    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
                      Halo, Anda menerima email ini karena telah meminta verifikasi email 
                      untuk akun mahasiswa di Sistem Manajemen KPPM Telkom University. 
                      Gunakan kode berikut untuk menyelesaikan verifikasi:
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 28px;">
                          <div style="display:inline-block;background:#fff5f5;border:2px dashed #CC0000;border-radius:16px;padding:20px 48px;">
                            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#CC0000;letter-spacing:2px;text-transform:uppercase;">Kode Verifikasi</p>
                            <p style="margin:0;font-size:42px;font-weight:900;color:#CC0000;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:13px;font-weight:700;color:#374151;">Kode berlaku selama <span style="color:#CC0000;">5 menit</span></p>
                                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Setelah 5 menit, Anda perlu meminta kode baru.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 20px 16px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:13px;font-weight:700;color:#374151;">Jaga kerahasiaan kode ini</p>
                                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Jangan bagikan kode ini kepada siapapun.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                      Jika Anda tidak merasa meminta kode ini, abaikan email ini. 
                      Tidak ada tindakan yang diperlukan.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #f0f0f0;padding:20px 40px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      &copy; ${new Date().getFullYear()} Sistem Manajemen KPPM — Telkom University<br/>
                      Email ini dikirim secara otomatis, mohon tidak membalas email ini.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Kirim email OTP verifikasi ke dosen (Pembimbing Akademik)
 */
export const sendLecturerVerifyOtpEmail = async (toEmail: string, otp: string): Promise<void> => {
  const from = process.env.EMAIL_FROM || `"KPPM Telkom University" <${process.env.SMTP_USER}>`;

  const mailOptions = {
    from,
    to: toEmail,
    subject: 'Kode Verifikasi Email Pembimbing Akademik — KPPM Telkom University',
    html: `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Kode Verifikasi Email Pembimbing Akademik</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#CC0000,#990000);padding:32px 40px;text-align:center;">
                    <table cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td style="background:rgba(255,255,255,0.15);border-radius:14px;padding:10px 14px;display:inline-block;">
                          <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">SISTEM KPPM</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:6px;">
                          <span style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:1px;">TELKOM UNIVERSITY</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Verifikasi Email Pembimbing Akademik</p>
                    <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#111827;">Konfirmasi Email Anda</h1>

                    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
                      Halo, Anda menerima email ini karena telah meminta verifikasi email
                      untuk akun Pembimbing Akademik di Sistem Manajemen KPPM Telkom University.
                      Gunakan kode berikut untuk menyelesaikan verifikasi:
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 28px;">
                          <div style="display:inline-block;background:#fff5f5;border:2px dashed #CC0000;border-radius:16px;padding:20px 48px;">
                            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#CC0000;letter-spacing:2px;text-transform:uppercase;">Kode Verifikasi</p>
                            <p style="margin:0;font-size:42px;font-weight:900;color:#CC0000;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:13px;font-weight:700;color:#374151;">Kode berlaku selama <span style="color:#CC0000;">5 menit</span></p>
                                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Setelah 5 menit, Anda perlu meminta kode baru.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 20px 16px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:13px;font-weight:700;color:#374151;">Jaga kerahasiaan kode ini</p>
                                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Jangan bagikan kode ini kepada siapapun.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                      Jika Anda tidak merasa meminta kode ini, abaikan email ini.
                      Tidak ada tindakan yang diperlukan.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #f0f0f0;padding:20px 40px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      &copy; ${new Date().getFullYear()} Sistem Manajemen KPPM — Telkom University<br/>
                      Email ini dikirim secara otomatis, mohon tidak membalas email ini.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

