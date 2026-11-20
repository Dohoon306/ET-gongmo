package com.gdgoc.et.common.web;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 현재 사용자 ID (X-1). 로그인 대신 프론트가 보내는 X-User-Id 헤더 값을 받습니다.
 *
 * <p>사용 예: {@code public List<ContestResponse> recommended(@CurrentUser Long userId)}
 *
 * <p>헤더가 없으면 400을 돌려줍니다. 없어도 되는 API는 {@code @CurrentUser(required = false)}로 쓰고 null을 받습니다.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUser {
    boolean required() default true;
}
