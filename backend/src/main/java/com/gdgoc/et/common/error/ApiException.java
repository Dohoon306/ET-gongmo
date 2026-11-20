package com.gdgoc.et.common.error;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** 기능 코드에서 던지면 GlobalExceptionHandler가 {"message": ...} 형태로 응답합니다. */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
}
