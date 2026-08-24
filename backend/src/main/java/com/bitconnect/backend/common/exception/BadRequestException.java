package com.bitconnect.backend.common.exception;

/**
 * Exception thrown when a client sends an invalid request or violates business constraints.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
