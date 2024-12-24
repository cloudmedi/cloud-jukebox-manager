package com.cloudmedia.ui;

import com.cloudmedia.service.TokenService;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;

public class TokenScreenController {
    @FXML
    private TextField tokenField;
    
    @FXML
    private Button validateButton;
    
    @FXML
    private Label errorLabel;

    private TokenService tokenService;
    private TokenValidationCallback callback;

    public void initialize() {
        tokenService = new TokenService();
        
        // Token alanını 6 karakterle sınırla
        tokenField.textProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue.length() > 6) {
                tokenField.setText(oldValue);
            }
        });
    }

    public void setCallback(TokenValidationCallback callback) {
        this.callback = callback;
    }

    @FXML
    private void validateToken() {
        String token = tokenField.getText();
        if (token.length() != 6) {
            showError("Token 6 haneli olmalıdır");
            return;
        }

        validateButton.setDisable(true);
        errorLabel.setVisible(false);

        tokenService.validateToken(token, 
            // Success callback
            () -> {
                if (callback != null) {
                    callback.onTokenValidated(token);
                }
            },
            // Error callback
            error -> {
                showError(error);
                validateButton.setDisable(false);
            }
        );
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }
}