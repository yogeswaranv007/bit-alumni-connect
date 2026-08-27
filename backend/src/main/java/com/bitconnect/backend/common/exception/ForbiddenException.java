package com.bitconnect.backend.common.exception;

/**
 * Exception thrown when an authenticated user attempts an operation they do not have rights to.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}
