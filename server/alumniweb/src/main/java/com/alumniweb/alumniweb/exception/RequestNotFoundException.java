package com.alumniweb.alumniweb.exception;

public class RequestNotFoundException extends RuntimeException {

    public RequestNotFoundException(Long requestId) {
        super("Request not found with id: " + requestId);
    }
}
