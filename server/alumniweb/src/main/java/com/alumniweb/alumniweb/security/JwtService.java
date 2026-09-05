package com.alumniweb.alumniweb.security;

import com.alumniweb.alumniweb.config.JwtProperties;
import com.alumniweb.alumniweb.dto.auth.TokenPair;
import com.alumniweb.alumniweb.exception.JwtAuthenticationException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.getSecret()));
    }

    public TokenPair generateTokenPair(Long userId, String username, String role) {
        Instant now = Instant.now();
        Instant accessExpiration = now.plusMillis(jwtProperties.getAccessTokenExpiration());
        Instant refreshExpiration = now.plusMillis(jwtProperties.getRefreshTokenExpiration());

        String accessToken = generateAccessToken(userId, username, role, now, accessExpiration);
        String refreshToken = generateRefreshToken(userId, username, role, now, refreshExpiration);

        return new TokenPair(
                accessToken,
                refreshToken,
                JwtTokenType.BEARER.name().toLowerCase(),
                accessExpiration
        );
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return parseToken(token).getSubject();
    }

    public Long extractUserId(String token) {
        return parseToken(token).get("userId", Long.class);
    }

    public TokenPair refreshAccessToken(String refreshToken) {
        try {
            Claims claims = parseToken(refreshToken);
            Long userId = claims.get("userId", Long.class);
            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            return generateTokenPair(userId, username, role);
        } catch (ExpiredJwtException e) {
            throw new JwtAuthenticationException("Refresh token has expired");
        } catch (JwtException | IllegalArgumentException e) {
            throw new JwtAuthenticationException("Invalid refresh token");
        }
    }

    private String generateAccessToken(Long userId, String username, String role,
                                       Instant now, Instant expiration) {
        return Jwts.builder()
                .claim("userId", userId)
                .claim("role", role)
                .subject(username)
                .issuer(jwtProperties.getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(signingKey, Jwts.SIG.HS512)
                .compact();
    }

    private String generateRefreshToken(Long userId, String username, String role,
                                        Instant now, Instant expiration) {
        return Jwts.builder()
                .claim("tokenId", UUID.randomUUID().toString())
                .claim("userId", userId)
                .claim("role", role)
                .subject(username)
                .issuer(jwtProperties.getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(signingKey, Jwts.SIG.HS512)
                .compact();
    }
}
