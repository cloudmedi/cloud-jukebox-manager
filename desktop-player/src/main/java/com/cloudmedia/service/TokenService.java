package com.cloudmedia.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.CompletableFuture;

public class TokenService {
    private final String API_URL = "http://localhost:5000/api";
    private final HttpClient client;
    private final ObjectMapper mapper;

    public TokenService() {
        this.client = HttpClient.newHttpClient();
        this.mapper = new ObjectMapper();
    }

    public void validateToken(String token, Runnable onSuccess, TokenErrorCallback onError) {
        CompletableFuture.runAsync(() -> {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL + "/tokens/validate/" + token))
                    .GET()
                    .build();

                HttpResponse<String> response = client.send(request, 
                    HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    javafx.application.Platform.runLater(onSuccess);
                } else {
                    javafx.application.Platform.runLater(() -> 
                        onError.onError("Token geçersiz"));
                }
            } catch (Exception e) {
                javafx.application.Platform.runLater(() -> 
                    onError.onError("Bağlantı hatası"));
            }
        });
    }
}