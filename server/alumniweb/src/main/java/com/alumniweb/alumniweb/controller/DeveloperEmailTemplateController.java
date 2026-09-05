package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.model.enums.EmailTemplateType;
import com.alumniweb.alumniweb.security.SecurityConstants;
import com.alumniweb.alumniweb.service.EmailTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/developer/email-templates")
@PreAuthorize("hasRole('" + SecurityConstants.ROLE_DEVELOPER + "')")
public class DeveloperEmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    public DeveloperEmailTemplateController(EmailTemplateService emailTemplateService) {
        this.emailTemplateService = emailTemplateService;
    }

    @GetMapping("/types")
    public ResponseEntity<Map<String, String>> listTypes() {
        Map<String, String> types = new java.util.LinkedHashMap<>();
        Arrays.stream(EmailTemplateType.values()).forEach(t ->
            types.put(t.name(), t.name().replace("_", " ").toLowerCase()));
        return ResponseEntity.ok(types);
    }

    @GetMapping("/{type}")
    public ResponseEntity<Map<String, Object>> getTemplate(@PathVariable String type) {
        EmailTemplateType templateType = EmailTemplateType.valueOf(type.toUpperCase());
        // Get default template
        String defaultHtml = switch (templateType) {
            case ACCOUNT_VERIFICATION -> "Hello {{name}}, please verify your email...";
            case OTP_VERIFICATION -> "Your OTP code is: {{otp}}";
            case WELCOME -> "Welcome to the Alumni Portal, {{name}}!";
            case PASSWORD_RESET -> "Click to reset: {{resetLink}}";
            case EMAIL_CORRECTION_APPROVED -> "Your email correction was approved.";
            case EMAIL_CORRECTION_REJECTED -> "Your email correction was rejected. Reason: {{reason}}";
            case NEW_ALUMNI_APPROVED -> "New alumni record approved for {{name}}.";
            case NEW_ALUMNI_REJECTED -> "New alumni request rejected. Reason: {{reason}}";
        };

        String defaultSubject = switch (templateType) {
            case ACCOUNT_VERIFICATION -> "Verify your email - JJCET Alumni Portal";
            case OTP_VERIFICATION -> "Your verification code - JJCET Alumni Portal";
            case WELCOME -> "Welcome - JJCET Alumni Portal";
            case PASSWORD_RESET -> "Password reset - JJCET Alumni Portal";
            case EMAIL_CORRECTION_APPROVED -> "Email correction approved";
            case EMAIL_CORRECTION_REJECTED -> "Email correction rejected";
            case NEW_ALUMNI_APPROVED -> "New alumni request approved";
            case NEW_ALUMNI_REJECTED -> "New alumni request rejected";
        };

        String[] variables = switch (templateType) {
            case ACCOUNT_VERIFICATION -> new String[]{"name", "verificationLink"};
            case OTP_VERIFICATION -> new String[]{"name", "otp"};
            case WELCOME -> new String[]{"name", "portalLink"};
            case PASSWORD_RESET -> new String[]{"name", "resetLink"};
            case EMAIL_CORRECTION_APPROVED -> new String[]{"name"};
            case EMAIL_CORRECTION_REJECTED -> new String[]{"name", "reason"};
            case NEW_ALUMNI_APPROVED -> new String[]{"name"};
            case NEW_ALUMNI_REJECTED -> new String[]{"name", "reason"};
        };

        return ResponseEntity.ok(Map.of(
            "type", type.toUpperCase(),
            "defaultHtml", defaultHtml,
            "defaultSubject", defaultSubject,
            "variables", variables
        ));
    }
}
