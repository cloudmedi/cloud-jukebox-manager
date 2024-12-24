package com.cloudmedia.ui;

@FunctionalInterface
public interface TokenValidationCallback {
    void onTokenValidated(String token);
}