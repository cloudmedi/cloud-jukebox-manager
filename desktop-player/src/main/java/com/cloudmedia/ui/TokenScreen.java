package com.cloudmedia.ui;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.scene.layout.VBox;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;

public class TokenScreen extends VBox {
    private final TextField tokenField;
    private final Label errorLabel;
    private final TokenValidationCallback callback;

    public TokenScreen(TokenValidationCallback callback) {
        this.callback = callback;
        
        // Ana container ayarları
        setAlignment(Pos.CENTER);
        setSpacing(20);
        setPadding(new Insets(20));
        setStyle("-fx-background-color: #1a1b1e;");

        // Başlık
        Label titleLabel = new Label("Cloud Media Player");
        titleLabel.setFont(Font.font("System", FontWeight.BOLD, 24));
        titleLabel.setStyle("-fx-text-fill: white;");

        // Bilgi metni
        Label infoLabel = new Label("Lütfen 6 haneli token kodunu girin");
        infoLabel.setStyle("-fx-text-fill: #a1a1aa;");

        // Token giriş alanı
        tokenField = new TextField();
        tokenField.setMaxWidth(200);
        tokenField.setPromptText("Token");
        tokenField.setStyle("-fx-background-color: #27272a; -fx-text-fill: white; -fx-prompt-text-fill: #71717a;");
        
        // Token uzunluğunu 6 karakter ile sınırla
        tokenField.textProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue.length() > 6) {
                tokenField.setText(oldValue);
            }
        });

        // Doğrula butonu
        Button validateButton = new Button("Doğrula");
        validateButton.setStyle("-fx-background-color: #3b82f6; -fx-text-fill: white;");
        validateButton.setOnAction(e -> validateToken());

        // Hata mesajı etiketi
        errorLabel = new Label();
        errorLabel.setStyle("-fx-text-fill: #ef4444;");
        errorLabel.setVisible(false);

        // Componentleri ekle
        getChildren().addAll(titleLabel, infoLabel, tokenField, validateButton, errorLabel);
    }

    private void validateToken() {
        String token = tokenField.getText();
        if (token.length() != 6) {
            showError("Token 6 haneli olmalıdır");
            return;
        }

        // Token doğrulama işlemi
        callback.onTokenValidated(token);
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }
}