package com.cloudmedia.service;

@FunctionalInterface
public interface TokenErrorCallback {
    void onError(String message);
}