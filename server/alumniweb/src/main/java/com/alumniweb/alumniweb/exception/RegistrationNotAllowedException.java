package com.alumniweb.alumniweb.exception;

public class RegistrationNotAllowedException extends RuntimeException {

    public RegistrationNotAllowedException(String message) {
        super(message);
    }
}
