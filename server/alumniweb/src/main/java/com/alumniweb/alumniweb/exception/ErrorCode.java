package com.alumniweb.alumniweb.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    ALUMNI_NOT_FOUND(HttpStatus.NOT_FOUND),
    DUPLICATE_USERNAME(HttpStatus.CONFLICT),
    INVALID_EMAIL(HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND),
    REGISTRATION_NOT_ALLOWED(HttpStatus.FORBIDDEN),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED),
    BAD_REQUEST(HttpStatus.BAD_REQUEST),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus httpStatus;

    ErrorCode(HttpStatus httpStatus) {
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
