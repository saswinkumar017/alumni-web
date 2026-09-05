package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.auth.RegisterRequest;
import com.alumniweb.alumniweb.dto.auth.RegisterResponse;
import com.alumniweb.alumniweb.exception.AlumniNotFoundException;
import com.alumniweb.alumniweb.exception.DuplicateUsernameException;
import com.alumniweb.alumniweb.exception.InvalidEmailException;
import com.alumniweb.alumniweb.exception.RegistrationNotAllowedException;
import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.User;
import com.alumniweb.alumniweb.model.VerificationToken;
import com.alumniweb.alumniweb.model.enums.AccountStatus;
import com.alumniweb.alumniweb.model.enums.EmailTemplateType;
import com.alumniweb.alumniweb.model.enums.UserRole;
import com.alumniweb.alumniweb.model.mapper.UserMapper;
import com.alumniweb.alumniweb.model.repository.MasterAlumniRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.service.EmailService;
import com.alumniweb.alumniweb.service.EmailVerificationTokenService;
import com.alumniweb.alumniweb.service.OtpService;
import com.alumniweb.alumniweb.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegistrationServiceImpl implements RegistrationService {

    private final MasterAlumniRepository masterAlumniRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final EmailService emailService;
    private final EmailVerificationTokenService emailVerificationTokenService;
    private final OtpService otpService;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        MasterAlumni master = masterAlumniRepository.findByRegisterNumber(request.registerNumber())
            .orElseThrow(() -> new AlumniNotFoundException(request.registerNumber()));

        if (!master.getEmail().equalsIgnoreCase(request.email())) {
            throw new InvalidEmailException("Email does not match our records");
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateUsernameException(request.username());
        }

        if (userRepository.findByMasterAlumni(master).isPresent()) {
            throw new RegistrationNotAllowedException("An account already exists for this alumni");
        }

        User user = User.builder()
            .masterAlumni(master)
            .username(request.username())
            .passwordHash(passwordEncoder.encode(request.password()))
            .role(UserRole.USER)
            .accountStatus(AccountStatus.PENDING_VERIFICATION)
            .build();

        user = userRepository.save(user);

        String otp = otpService.generateOtp(user.getId(), master.getEmail(), "REGISTRATION");
        emailService.sendOtpEmail(master.getEmail(), request.username(), otp);

        return new RegisterResponse(
            user.getId(),
            user.getUsername(),
            "Registration successful. Please enter the OTP sent to your email."
        );
    }

    @Override
    @Transactional
    public RegisterResponse verifyEmail(String token) {
        VerificationToken vt = emailVerificationTokenService.validateToken(
                token, EmailTemplateType.ACCOUNT_VERIFICATION);

        User user = userRepository.findById(vt.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEmailVerified(true);
        user.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        emailVerificationTokenService.markAsUsed(vt);

        return new RegisterResponse(
            user.getId(),
            user.getUsername(),
            "Email verified successfully. Your account is now active."
        );
    }
}
