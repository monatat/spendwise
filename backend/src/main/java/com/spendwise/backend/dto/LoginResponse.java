
package com.spendwise.backend.dto;

public class LoginResponse {

    private String id;
    private String name;
    private String email;
    private String accessToken;
    private String tokenType;

    public LoginResponse(
            String id,
            String name,
            String email,
            String accessToken) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }
}
