package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.common.ErrorResponse;
import com.alumniweb.alumniweb.dto.message.ConversationResponse;
import com.alumniweb.alumniweb.model.AlumniMessage;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.AlumniMessageService;
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
@RequestMapping("/api/messages")
@Tag(name = "Messages", description = "Endpoints for alumni messaging")
@SecurityRequirement(name = "bearerAuth")
public class AlumniMessageController {

    private final AlumniMessageService alumniMessageService;

    public AlumniMessageController(AlumniMessageService alumniMessageService) {
        this.alumniMessageService = alumniMessageService;
    }

    @GetMapping
    @Operation(summary = "Get conversations", description = "Returns direct messages for the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Conversations returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<AlumniMessage>> getConversations() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(alumniMessageService.getConversations(userId));
    }

    @GetMapping("/conversations")
    @Operation(summary = "Get conversation summaries",
        description = "Returns direct-message conversations grouped by counterpart, with names, last message and unread counts.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Conversation summaries returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<ConversationResponse>> getConversationSummaries() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(alumniMessageService.getConversationSummaries(userId));
    }

    @GetMapping("/thread/{userId}")
    @Operation(summary = "Get message thread",
        description = "Returns the direct messages exchanged with another user, oldest first.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thread returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<AlumniMessage>> getThread(@PathVariable("userId") Long counterpartId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(alumniMessageService.getThread(userId, counterpartId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get message", description = "Returns a single message by ID.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Message returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Message not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<AlumniMessage> getMessage(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(alumniMessageService.getMessageForUser(id, userId));
    }

    @PostMapping
    @Operation(summary = "Send message", description = "Sends a direct message to another alumni.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Message sent"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid recipient",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<AlumniMessage>> sendMessage(@RequestBody Map<String, String> body) {
        Long senderId = SecurityUtils.getCurrentUserId();
        Long receiverId = Long.parseLong(body.get("receiverId"));
        String subject = body.get("subject");
        String messageBody = body.get("body");
        AlumniMessage message = alumniMessageService.sendMessage(senderId, receiverId, subject, messageBody);
        return ResponseEntity.ok(ApiResponse.success("Message sent successfully", message));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark message as read", description = "Marks a received message as read.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Message marked as read"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Not your message",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        alumniMessageService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete message", description = "Soft-deletes a message owned by the user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Message deleted"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Not your message",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        alumniMessageService.deleteMessage(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", null));
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Get unread count", description = "Returns the count of unread messages for the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Unread count returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long userId = SecurityUtils.getCurrentUserId();
        long count = alumniMessageService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @GetMapping("/broadcasts")
    @Operation(summary = "Get broadcasts", description = "Returns unread broadcast messages for the authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Broadcasts returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<AlumniMessage>> getBroadcasts() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(alumniMessageService.getBroadcasts(userId));
    }
}
