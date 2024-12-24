package com.cloudmedia.ui;

import com.cloudmedia.service.TokenService;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;

public class TokenScreen extends VBox {
    private TextField tokenField;
    private Label statusLabel;
    private TokenValidationCallback callback;
    private TokenService tokenService;

    public TokenScreen(TokenValidationCallback callback) {
        this.callback = callback;
        this.tokenService = new TokenService();
        setupUI();
    }

    private void setupUI() {
        setAlignment(Pos.CENTER);
        setSpacing(15);
        setPadding(new Insets(20));

        Label titleLabel = new Label("Cloud Media Player");
        titleLabel.setStyle("-fx-font-size: 24px; -fx-font-weight: bold;");

        tokenField = new TextField();
        tokenField.setPromptText("6 haneli token");
        tokenField.setMaxWidth(200);
        
        Button validateButton = new Button("Doğrula");
        validateButton.setOnAction(e -> validateToken());

        statusLabel = new Label();
        statusLabel.setTextFill(Color.RED);

        getChildren().addAll(titleLabel, tokenField, validateButton, statusLabel);
    }

    public void setGeneratedToken(String token) {
        tokenField.setText(token);
    }

    private void validateToken() {
        String token = tokenField.getText();
        if (token == null || token.length() != 6) {
            statusLabel.setText("Token 6 haneli olmalıdır");
            statusLabel.setTextFill(Color.RED);
            return;
        }

        tokenService.validateToken(
            token,
            () -> {
                statusLabel.setText("Token doğrulandı");
                statusLabel.setTextFill(Color.GREEN);
                callback.onTokenValidated(token); // Düzeltildi: onValidated -> onTokenValidated
            },
            errorMessage -> {
                statusLabel.setText(errorMessage);
                statusLabel.setTextFill(Color.RED);
            }
        );
    }
}