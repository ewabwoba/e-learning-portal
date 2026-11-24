package com.coursely.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "coursely.mpesa")
public class MpesaProperties {
    private boolean enabled;
    private String baseUrl = "https://sandbox.safaricom.co.ke";
    private String consumerKey;
    private String consumerSecret;
    private String shortcode = "174379";   // Daraja sandbox shortcode
    private String passkey;
    private String callbackUrl;            // must be public HTTPS, e.g. an ngrok URL + /api/payments/mpesa/callback/<secret>
    private String callbackSecret;         // random string; the last part of callbackUrl must equal this

    public boolean isEnabled() { return enabled; } public void setEnabled(boolean v) { enabled = v; }
    public String getBaseUrl() { return baseUrl; } public void setBaseUrl(String v) { baseUrl = v; }
    public String getConsumerKey() { return consumerKey; } public void setConsumerKey(String v) { consumerKey = v; }
    public String getConsumerSecret() { return consumerSecret; } public void setConsumerSecret(String v) { consumerSecret = v; }
    public String getShortcode() { return shortcode; } public void setShortcode(String v) { shortcode = v; }
    public String getPasskey() { return passkey; } public void setPasskey(String v) { passkey = v; }
    public String getCallbackUrl() { return callbackUrl; } public void setCallbackUrl(String v) { callbackUrl = v; }
    public String getCallbackSecret() { return callbackSecret; } public void setCallbackSecret(String v) { callbackSecret = v; }
}