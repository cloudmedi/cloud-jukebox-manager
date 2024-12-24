package com.cloudmedia;

import com.cloudmedia.ui.TokenScreen;
import com.cloudmedia.utils.DeviceIdentifier;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.stage.Stage;

public class Main extends Application {
    private Stage primaryStage;

    @Override
    public void start(Stage primaryStage) {
        this.primaryStage = primaryStage;
        primaryStage.setTitle("Cloud Media Player");
        
        // MAC adresinden token oluştur
        String generatedToken = DeviceIdentifier.generateToken();
        
        // Token ekranını göster ve oluşturulan tokeni set et
        TokenScreen tokenScreen = new TokenScreen(this::onTokenValidated);
        tokenScreen.setGeneratedToken(generatedToken);
        Scene scene = new Scene(tokenScreen, 400, 300);
        
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    private void onTokenValidated(String token) {
        System.out.println("Token validated: " + token);
    }

    public static void main(String[] args) {
        launch(args);
    }
}