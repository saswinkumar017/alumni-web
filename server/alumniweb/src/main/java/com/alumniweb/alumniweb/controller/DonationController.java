package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.common.ErrorResponse;
import com.alumniweb.alumniweb.model.Donation;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.DonationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/donations")
@Tag(name = "Donations", description = "Endpoints for alumni donations")
@SecurityRequirement(name = "bearerAuth")
public class DonationController {

    private final DonationService donationService;

    public DonationController(DonationService donationService) {
        this.donationService = donationService;
    }

    @GetMapping
    @Operation(summary = "Get donations", description = "Returns all donations made by the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Donations returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<Donation>> getDonations() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(donationService.getDonations(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get donation", description = "Returns a single donation by ID.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Donation returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Donation not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Donation> getDonation(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(donationService.getDonation(id, userId));
    }

    @PostMapping
    @Operation(summary = "Create donation", description = "Creates a new donation record for the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Donation created"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid amount",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Donation>> createDonation(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtils.getCurrentUserId();
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String purpose = (String) body.get("purpose");
        String notes = (String) body.get("notes");
        Donation donation = donationService.createDonation(userId, amount, purpose, notes);
        return ResponseEntity.ok(ApiResponse.success("Donation created successfully", donation));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get donation stats", description = "Returns total amount and count of completed donations.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Stats returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Map<String, Object>> getDonationStats() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(donationService.getDonationStats(userId));
    }
}
