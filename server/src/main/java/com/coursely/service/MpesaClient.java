package com.coursely.service;

import com.coursely.config.MpesaProperties;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Talks to Safaricom Daraja. Knows nothing about courses or enrolments. */
@Component
public class MpesaClient {
    public record StkResult(String merchantRequestId, String checkoutRequestId, String customerMessage) {}

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneId.of("Africa/Nairobi"));
    private static final Pattern PHONE = Pattern.compile("^(?:\\+?254|0)?([17]\\d{8})$");

    private final MpesaProperties props;
    private final RestClient http;
    private String token;
    private Instant tokenExpiry = Instant.EPOCH;

    public MpesaClient(MpesaProperties props) {
        this.props = props;
        this.http = RestClient.builder().baseUrl(props.getBaseUrl()).build();
    }

    /** 0712345678, +254712345678 or 712345678 become 254712345678. Returns null if it is not a Kenyan mobile number. */
    public static String normalizePhone(String raw) {
        if (raw == null) return null;
        Matcher m = PHONE.matcher(raw.replaceAll("[\\s-]", ""));
        return m.matches() ? "254" + m.group(1) : null;
    }

    private synchronized String accessToken() {
        if (token != null && Instant.now().isBefore(tokenExpiry)) return token;
        String basic = Base64.getEncoder().encodeToString((props.getConsumerKey() + ":" + props.getConsumerSecret()).getBytes(StandardCharsets.UTF_8));
        JsonNode r = http.get().uri("/oauth/v1/generate?grant_type=client_credentials")
            .header("Authorization", "Basic " + basic).retrieve().body(JsonNode.class);
        token = r == null ? null : r.path("access_token").asText(null);
        if (token == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "M-Pesa did not return an access token.");
        tokenExpiry = Instant.now().plusSeconds(Math.max(60, r.path("expires_in").asLong(3599) - 60));
        return token;
    }

    private static String cut(String s, int max) { return s.length() <= max ? s : s.substring(0, max); }

    /** Sends the PIN prompt to the customer's phone. The result arrives later on the callback URL. */
    public StkResult stkPush(String phone, int amount, String accountRef, String description) {
        if (!props.isEnabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "M-Pesa payments are not switched on.");
        String ts = TS.format(Instant.now());
        String password = Base64.getEncoder().encodeToString((props.getShortcode() + props.getPasskey() + ts).getBytes(StandardCharsets.UTF_8));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("BusinessShortCode", props.getShortcode());
        body.put("Password", password);
        body.put("Timestamp", ts);
        body.put("TransactionType", "CustomerPayBillOnline");   // use CustomerBuyGoodsOnline for a Till number
        body.put("Amount", amount);
        body.put("PartyA", phone);
        body.put("PartyB", props.getShortcode());
        body.put("PhoneNumber", phone);
        body.put("CallBackURL", props.getCallbackUrl());
        body.put("AccountReference", cut(accountRef, 12));
        body.put("TransactionDesc", cut(description, 13));
        try {
            JsonNode r = http.post().uri("/mpesa/stkpush/v1/processrequest")
                .header("Authorization", "Bearer " + accessToken()).body(body).retrieve().body(JsonNode.class);
            if (r == null || !"0".equals(r.path("ResponseCode").asText())) {
                String why = r == null ? "empty response" : r.path("ResponseDescription").asText(r.path("errorMessage").asText("rejected"));
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "M-Pesa rejected the request: " + why);
            }
            return new StkResult(r.path("MerchantRequestID").asText(), r.path("CheckoutRequestID").asText(), r.path("CustomerMessage").asText());
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "We could not reach M-Pesa. Please try again.");
        }
    }
}