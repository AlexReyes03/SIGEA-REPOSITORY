package com.utez.edu.sigeabackend.utils.security;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.util.Base64;

public class JwsTokenGenerator {
    public static void main(String[] args) {
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        String encoded = Base64.getEncoder().encodeToString(key.getEncoded());
        System.out.println("Generated JWT Secret: " + encoded);
    }
}
