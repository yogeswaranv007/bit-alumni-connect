package com.bitconnect.backend.common.exception;

/**
 * Exception thrown when authentication fails or an unauthenticated user attempts access.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
