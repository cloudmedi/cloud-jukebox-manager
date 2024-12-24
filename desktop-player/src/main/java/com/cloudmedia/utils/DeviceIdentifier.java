package com.cloudmedia.utils;

import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;

public class DeviceIdentifier {
    public static String getMacAddress() {
        try {
            Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
            while (networkInterfaces.hasMoreElements()) {
                NetworkInterface network = networkInterfaces.nextElement();
                byte[] mac = network.getHardwareAddress();
                
                if (mac != null && mac.length > 0 && !network.isLoopback() && !network.isVirtual()) {
                    StringBuilder sb = new StringBuilder();
                    for (byte b : mac) {
                        sb.append(String.format("%02X", b));
                    }
                    return sb.toString();
                }
            }
        } catch (SocketException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static String generateToken() {
        String macAddress = getMacAddress();
        if (macAddress != null) {
            // MAC adresinin son 6 karakterini al
            String lastSixChars = macAddress.substring(Math.max(0, macAddress.length() - 6));
            // Sayısal değer değilse, MAC adresinin hash'ini kullan
            try {
                Integer.parseInt(lastSixChars, 16);
                return lastSixChars;
            } catch (NumberFormatException e) {
                // Hash kullan
                return String.format("%06d", Math.abs(macAddress.hashCode() % 1000000));
            }
        }
        // MAC adresi alınamazsa random token üret
        return String.format("%06d", (int)(Math.random() * 1000000));
    }
}