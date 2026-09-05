package com.alumniweb.alumniweb.exception;

import com.alumniweb.alumniweb.dto.common.ErrorResponse;
import com.alumniweb.alumniweb.dto.common.ValidationErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ========== 4xx: Domain exceptions ==========

    @ExceptionHandler(AlumniNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleAlumniNotFound(
            AlumniNotFoundException ex, HttpServletRequest request) {
        return buildErrorResponse(ErrorCode.ALUMNI_NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(RequestNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleRequestNotFound(
            RequestNotFoundException ex, HttpServletRequest request) {
        return buildErrorResponse(ErrorCode.REQUEST_NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(DuplicateUsernameException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateUsername(
            DuplicateUsernameException ex, HttpServletRequest request) {
        return buildErrorResponse(ErrorCode.DUPLICATE_USERNAME, ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException ex, HttpServletRequest request) {
        return buildErrorResponse(ErrorCode.INVALID_CREDENTIALS, ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidEmailException.class)
    public ResponseEntity<ErrorResponse> handleInvalidEmail(
            InvalidEmailException ex, HttpServletRequest request) {
        return buildErrorResponse(ErrorCode.INVALID_EMAIL, ex.getMessage(), request);
    }

    @ExceptionHandler(RegistrationNotAllowedException.class)
    public ResponseEntity<ErrorResponse> handleRegistrationNotAllowed(
            RegistrationNotAllowedException ex, HttpServletRequest request) {
        return buildErrorResponse(ErrorCode.REGISTRATION_NOT_ALLOWED, ex.getMessage(), request);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(
            UserNotFoundException ex, HttpServletRequest request) {
        return buildErrorResponse(ErrorCode.USER_NOT_FOUND, ex.getMessage(), request);
    }

    // ========== 4xx: Validation ==========

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        log.warn("Validation failed: {}", ex.getMessage());

        List<ValidationErrorResponse.FieldError> fieldErrors = new ArrayList<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            fieldErrors.add(new ValidationErrorResponse.FieldError(
                error.getField(),
                error.getRejectedValue(),
                error.getDefaultMessage()
            ))
        );

        ValidationErrorResponse response = new ValidationErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.VALIDATION_FAILED.name(),
                "Validation failed",
                request.getRequestURI(),
                LocalDateTime.now(),
                fieldErrors
        );

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ValidationErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        log.warn("Constraint violation: {}", ex.getMessage());

        List<ValidationErrorResponse.FieldError> fieldErrors = ex.getConstraintViolations().stream()
                .map(violation -> new ValidationErrorResponse.FieldError(
                        violation.getPropertyPath().toString(),
                        violation.getInvalidValue(),
                        violation.getMessage()
                ))
                .toList();

        ValidationErrorResponse response = new ValidationErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.VALIDATION_FAILED.name(),
                "Validation failed",
                request.getRequestURI(),
                LocalDateTime.now(),
                fieldErrors
        );

        return ResponseEntity.badRequest().body(response);
    }

    // ========== 4xx: Framework exceptions ==========

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        log.warn("Method not allowed: {}", ex.getMessage());
        return buildErrorResponse(ErrorCode.METHOD_NOT_ALLOWED, ex.getMessage(), request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleUnsupportedMediaType(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        log.warn("Unsupported media type: {}", ex.getMessage());
        return buildErrorResponse(ErrorCode.UNSUPPORTED_MEDIA_TYPE, ex.getMessage(), request);
    }

    // ========== 4xx: JWT ==========

    @ExceptionHandler(JwtAuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleJwtAuthentication(
            JwtAuthenticationException ex, HttpServletRequest request) {
        return buildErrorResponse(ErrorCode.INVALID_TOKEN, ex.getMessage(), request);
    }

    // ========== 4xx: Catch-all bad requests ==========

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(
            Exception ex, HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return buildErrorResponse(ErrorCode.BAD_REQUEST, "Bad request", request);
    }

    // ========== 4xx/5xx: ResponseStatusException-aware (business rules) ==========

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException ex, HttpServletRequest request) {
        log.warn("403: FORBIDDEN - {}", ex.getMessage());
        ErrorResponse response = new ErrorResponse(
                403,
                "FORBIDDEN",
                "You do not have permission to perform this action",
                request.getRequestURI(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(
            org.springframework.web.server.ResponseStatusException ex, HttpServletRequest request) {
        org.springframework.http.HttpStatusCode statusCode = ex.getStatusCode();
        String message = (ex.getReason() != null && !ex.getReason().isBlank())
                ? ex.getReason()
                : "Request failed";
        log.warn("{}: {}", statusCode.value(), message);
        ErrorResponse response = new ErrorResponse(
                statusCode.value(),
                statusCode.toString(),
                message,
                request.getRequestURI(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, statusCode);
    }

    // ========== 5xx: Fallback ==========

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex, HttpServletRequest request) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return buildErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
    }

    // ========== Helper ==========

    private ResponseEntity<ErrorResponse> buildErrorResponse(
            ErrorCode errorCode, String message, HttpServletRequest request) {
        HttpStatus status = errorCode.getHttpStatus();
        log.warn("{}: {} - {}", status.value(), errorCode.name(), message);
        ErrorResponse response = new ErrorResponse(
                status.value(),
                errorCode.name(),
                message,
                request.getRequestURI(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(response, status);
    }
}
