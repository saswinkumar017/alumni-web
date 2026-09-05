package com.alumniweb.alumniweb.exception;

public class AlumniNotFoundException extends RuntimeException {

    public AlumniNotFoundException(String registerNumber) {
        super("Alumni not found with register number: " + registerNumber);
    }

    public AlumniNotFoundException(Long id) {
        super("Alumni not found with id: " + id);
    }
}
