package com.alumniweb.alumniweb.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI alumniPortalOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Alumni Portal API")
                        .version("1.0.0")
                        .description("REST API for the College Alumni Portal. Supports alumni search, " +
                                "user registration and authentication, email verification, " +
                                "correction/renewal requests, and administrative approval workflows.")
                        .contact(new Contact()
                                .name("Alumni Portal Team")
                                .email("support@alumni-portal.example.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://alumni-portal.example.com/license")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Access token returned from POST /api/login")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Development")
                ));
    }
}
