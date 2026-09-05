package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.model.enums.EmailTemplateType;
import com.alumniweb.alumniweb.model.repository.PlatformConfigRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EmailTemplateService {

    private final PlatformConfigRepository platformConfigRepository;

    public EmailTemplateService(PlatformConfigRepository platformConfigRepository) {
        this.platformConfigRepository = platformConfigRepository;
    }

    public record EmailContent(String subject, String htmlBody) {
    }

    public EmailContent getEmailContent(EmailTemplateType type, Map<String, String> variables) {
        String templateKey = "email_template." + type.name().toLowerCase();
        String subjectKey = templateKey + ".subject";

        // Read from platform_config, fallback to defaults
        String rawHtml = platformConfigRepository.findByKey(templateKey)
                .map(c -> c.getValue())
                .orElseGet(() -> resolveTemplate(type));

        String subject = platformConfigRepository.findByKey(subjectKey)
                .map(c -> c.getValue())
                .orElseGet(() -> resolveSubject(type));

        // Replace variables
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            rawHtml = rawHtml.replace(placeholder, entry.getValue() != null ? entry.getValue() : "");
            subject = subject.replace(placeholder, entry.getValue() != null ? entry.getValue() : "");
        }

        return new EmailContent(subject, wrapWithShell(rawHtml));
    }

    private String wrapWithShell(String body) {
        return """
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"/></head>
                <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 24px;">
                    <table align="center" cellpadding="0" cellspacing="0"
                           style="max-width: 600px; background: #ffffff; border-radius: 8px;">
                        <tr>
                            <td style="padding: 32px;">
                                <h2 style="color: #1a365d; margin: 0 0 16px 0;">JJCET Alumni Portal</h2>
                                %s
                                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 8px 0;"/>
                                <p style="font-size: 12px; color: #718096;">
                                    This is an automated message from the Alumni Portal. Please do not reply.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>"""
                .formatted(body);
    }

    private String resolveTemplate(EmailTemplateType type) {
        return switch (type) {
            case ACCOUNT_VERIFICATION -> """
                <p>Hello {{name}},</p>
                <p>Thank you for registering with the Alumni Portal.</p>
                <p>Please verify your email address by clicking the link below:</p>
                <p style="text-align: center;">
                    <a href="{{verificationLink}}"
                       style="display: inline-block; padding: 12px 24px; background: #1a365d; color: #ffffff;
                              text-decoration: none; border-radius: 4px;">Verify Email</a>
                </p>
                <p>This link will expire in 24 hours.</p>""";
            case OTP_VERIFICATION -> """
                <p>Hello {{name}},</p>
                <p>Your one-time verification code is:</p>
                <p style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a365d; padding: 20px 0;">
                    {{otp}}
                </p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>""";
            case WELCOME -> """
                <p>Hello {{name}},</p>
                <p>Your account has been activated successfully.</p>
                <p>You can now access all features of the Alumni Portal.</p>
                <p style="text-align: center;">
                    <a href="{{portalLink}}"
                       style="display: inline-block; padding: 12px 24px; background: #1a365d; color: #ffffff;
                              text-decoration: none; border-radius: 4px;">Go to Portal</a>
                </p>""";
            case PASSWORD_RESET -> """
                <p>Hello {{name}},</p>
                <p>You have requested to reset your password.</p>
                <p>Click the link below to set a new password:</p>
                <p style="text-align: center;">
                    <a href="{{resetLink}}"
                       style="display: inline-block; padding: 12px 24px; background: #1a365d; color: #ffffff;
                              text-decoration: none; border-radius: 4px;">Reset Password</a>
                </p>
                <p>This link will expire in 15 minutes.</p>""";
            case EMAIL_CORRECTION_APPROVED -> """
                <p>Hello {{name}},</p>
                <p>Your request to update your email address has been <strong>approved</strong>.</p>
                <p>Your email has been updated in our records.</p>""";
            case EMAIL_CORRECTION_REJECTED -> """
                <p>Hello {{name}},</p>
                <p>Your request to update your email address has been <strong>rejected</strong>.</p>
                <p>Reason: {{reason}}</p>
                <p>If you have any questions, please contact the administration.</p>""";
            case NEW_ALUMNI_APPROVED -> """
                <p>Hello {{name}},</p>
                <p>Your request to add a new alumni record has been <strong>approved</strong>.</p>
                <p>The alumni profile has been added to our records.</p>""";
            case NEW_ALUMNI_REJECTED -> """
                <p>Hello {{name}},</p>
                <p>Your request to add a new alumni record has been <strong>rejected</strong>.</p>
                <p>Reason: {{reason}}</p>
                <p>If you have any questions, please contact the administration.</p>""";
        };
    }

    private String resolveSubject(EmailTemplateType type) {
        return switch (type) {
            case ACCOUNT_VERIFICATION -> "Verify your email address - JJCET Alumni Portal";
            case OTP_VERIFICATION -> "Your verification code - JJCET Alumni Portal";
            case WELCOME -> "Welcome to the Alumni Portal - JJCET Alumni Portal";
            case PASSWORD_RESET -> "Password reset request - JJCET Alumni Portal";
            case EMAIL_CORRECTION_APPROVED -> "Email correction approved - JJCET Alumni Portal";
            case EMAIL_CORRECTION_REJECTED -> "Email correction rejected - JJCET Alumni Portal";
            case NEW_ALUMNI_APPROVED -> "New alumni request approved - JJCET Alumni Portal";
            case NEW_ALUMNI_REJECTED -> "New alumni request rejected - JJCET Alumni Portal";
        };
    }
}
