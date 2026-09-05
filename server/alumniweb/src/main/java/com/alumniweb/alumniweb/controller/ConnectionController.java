package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.common.ErrorResponse;
import com.alumniweb.alumniweb.dto.connection.ConnectionResponse;
import com.alumniweb.alumniweb.dto.connection.ConnectionSuggestionResponse;
import com.alumniweb.alumniweb.model.Connection;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.ConnectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/connections")
@Tag(name = "Connections", description = "Endpoints for alumni connection management")
@SecurityRequirement(name = "bearerAuth")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    @GetMapping
    @Operation(summary = "Get connections", description = "Returns all accepted connections for the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Connections returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<ConnectionResponse>> getConnections() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(connectionService.getConnections(userId));
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending requests", description = "Returns pending connection requests addressed to the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Pending requests returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<ConnectionResponse>> getPendingRequests() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(connectionService.getPendingRequests(userId));
    }

    @GetMapping("/sent")
    @Operation(summary = "Get sent requests", description = "Returns pending connection requests sent by the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Sent requests returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<ConnectionResponse>> getSentRequests() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(connectionService.getSentRequests(userId));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Get connection suggestions", description = "Returns same-batch alumni as connection suggestions, with the connection status relative to the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Suggestions returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<ConnectionSuggestionResponse>> getSuggestions(
            @RequestParam(required = false) String batch) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(connectionService.getSuggestions(userId, batch));
    }

    @PostMapping
    @Operation(summary = "Send connection request", description = "Sends a connection request to another alumni.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Request sent"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Connection>> sendConnectionRequest(@RequestBody Map<String, String> body) {
        Long requesterId = SecurityUtils.getCurrentUserId();
        Long recipientId = Long.parseLong(body.get("recipientId"));
        String message = body.get("message");
        Connection connection = connectionService.sendConnectionRequest(requesterId, recipientId, message);
        return ResponseEntity.ok(ApiResponse.success("Connection request sent", connection));
    }

    @PutMapping("/{id}/accept")
    @Operation(summary = "Accept connection", description = "Accepts a pending connection request.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Connection accepted"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Not your request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Void>> acceptConnection(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        connectionService.acceptConnection(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Connection accepted", null));
    }

    @PostMapping("/by-register/{registerNumber}")
    @Operation(summary = "Send connection request by register number",
        description = "Resolves an alumni by register number and sends a connection request to them.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Request sent"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Unknown register number",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Connection>> sendConnectionRequestByRegister(
            @PathVariable String registerNumber,
            @RequestBody(required = false) Map<String, String> body) {
        Long requesterId = SecurityUtils.getCurrentUserId();
        String message = body == null ? null : body.get("message");
        Connection connection = connectionService.sendConnectionRequestByRegister(requesterId, registerNumber, message);
        return ResponseEntity.ok(ApiResponse.success("Connection request sent", connection));
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Reject connection", description = "Rejects a pending connection request.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Connection rejected"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Not your request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Void>> rejectConnection(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        connectionService.rejectConnection(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Connection rejected", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove connection", description = "Removes an existing connection.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Connection removed"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Not your connection",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Void>> removeConnection(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        connectionService.removeConnection(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Connection removed", null));
    }
}
