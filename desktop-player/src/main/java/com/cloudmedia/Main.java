package com.cloudmedia;

import com.cloudmedia.ui.TokenScreen;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.stage.Stage;

public class Main extends Application {
    private Stage primaryStage;

    @Override
    public void start(Stage primaryStage) {
        this.primaryStage = primaryStage;
        primaryStage.setTitle("Cloud Media Player");
        
        // Token ekranını göster
        TokenScreen tokenScreen = new TokenScreen(this::onTokenValidated);
        Scene scene = new Scene(tokenScreen, 400, 300);
        scene.getStylesheets().add(getClass().getResource("/styles/dark-theme.css").toExternalForm());
        
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    private void onTokenValidated(String token) {
        // Token doğrulandığında ana oynatıcı ekranına geç
        // Bu kısmı daha sonra implemente edeceğiz
        System.out.println("Token validated: " + token);
    }

    public static void main(String[] args) {
        launch(args);
    }
}