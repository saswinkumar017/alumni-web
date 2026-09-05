package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.model.enums.EmailTemplateType;
import com.alumniweb.alumniweb.service.EmailService;
import com.alumniweb.alumniweb.service.EmailTemplateService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailTemplateService emailTemplateService;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailServiceImpl(JavaMailSender mailSender,
                            EmailTemplateService emailTemplateService) {
        this.mailSender = mailSender;
        this.emailTemplateService = emailTemplateService;
    }

    @Async
    @Override
    public void sendVerificationEmail(String to, String name, String verificationLink) {
        send(EmailTemplateType.ACCOUNT_VERIFICATION, to, Map.of(
                "name", name,
                "verificationLink", verificationLink
        ));
    }

    @Async
    @Override
    public void sendOtpEmail(String to, String name, String otp) {
        send(EmailTemplateType.OTP_VERIFICATION, to, Map.of(
                "name", name,
                "otp", otp
        ));
    }

    @Async
    @Override
    public void sendApprovalNotification(String to, String name, String requestType) {
        EmailTemplateType type = switch (requestType) {
            case "EMAIL_CORRECTION" -> EmailTemplateType.EMAIL_CORRECTION_APPROVED;
            case "NEW_ALUMNI" -> EmailTemplateType.NEW_ALUMNI_APPROVED;
            default -> EmailTemplateType.EMAIL_CORRECTION_APPROVED;
        };
        send(type, to, Map.of("name", name != null ? name : "User"));
    }

    @Async
    @Override
    public void sendRejectionNotification(String to, String name, String requestType, String reason) {
        EmailTemplateType type = switch (requestType) {
            case "EMAIL_CORRECTION" -> EmailTemplateType.EMAIL_CORRECTION_REJECTED;
            case "NEW_ALUMNI" -> EmailTemplateType.NEW_ALUMNI_REJECTED;
            default -> EmailTemplateType.EMAIL_CORRECTION_REJECTED;
        };
        Map<String, String> variables = new java.util.HashMap<>(Map.of(
                "name", name != null ? name : "User",
                "reason", reason != null ? reason : "No reason provided"
        ));
        send(type, to, variables);
    }

    @Async
    @Override
    public void sendPasswordResetEmail(String to, String name, String token) {
        send(EmailTemplateType.PASSWORD_RESET, to, Map.of(
                "name", name,
                "resetLink", "http://localhost:8080/api/auth/reset-password?token=" + token
        ));
    }

    @Async
    @Override
    public void sendWelcomeEmail(String to, String name) {
        send(EmailTemplateType.WELCOME, to, Map.of(
                "name", name,
                "portalLink", "http://localhost:8080/"
        ));
    }

    private void send(EmailTemplateType type, String to, Map<String, String> variables) {
        EmailTemplateService.EmailContent content = emailTemplateService.getEmailContent(type, variables);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(content.subject());
            helper.setText(content.htmlBody(), true);
            mailSender.send(message);
            log.info("Email sent successfully to {} for {}", to, type);
        } catch (MessagingException e) {
            log.error("Failed to send email to {} for {}: {}", to, type, e.getMessage());
        }
    }
}
