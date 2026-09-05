package com.alumniweb.alumniweb.service;

public interface EmailService {

    void sendVerificationEmail(String to, String name, String verificationLink);

    void sendOtpEmail(String to, String name, String otp);

    void sendApprovalNotification(String to, String name, String requestType);

    void sendRejectionNotification(String to, String name, String requestType, String reason);

    void sendPasswordResetEmail(String to, String name, String token);

    void sendWelcomeEmail(String to, String name);
}
