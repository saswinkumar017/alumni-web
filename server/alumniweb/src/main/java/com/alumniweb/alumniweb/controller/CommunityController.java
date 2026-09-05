package com.alumniweb.alumniweb.controller;

import com.alumniweb.alumniweb.dto.common.ApiResponse;
import com.alumniweb.alumniweb.dto.common.ErrorResponse;
import com.alumniweb.alumniweb.dto.community.CommunityMessageResponse;
import com.alumniweb.alumniweb.dto.community.CreateCommunityRequest;
import com.alumniweb.alumniweb.model.Community;
import com.alumniweb.alumniweb.model.CommunityMember;
import com.alumniweb.alumniweb.security.SecurityUtils;
import com.alumniweb.alumniweb.service.CommunityService;
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
@RequestMapping("/api/communities")
@Tag(name = "Communities", description = "Endpoints for alumni community management")
@SecurityRequirement(name = "bearerAuth")
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @GetMapping
    @Operation(summary = "List communities", description = "Returns all communities, optionally filtered by batch or department.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Communities returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<Community>> listCommunities(
            @RequestParam(required = false) String batch,
            @RequestParam(required = false) String department) {
        return ResponseEntity.ok(communityService.listCommunities(batch, department, SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get community", description = "Returns a single community by ID.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Community returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Community not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Community> getCommunity(@PathVariable Long id) {
        return ResponseEntity.ok(communityService.getCommunity(id, SecurityUtils.getCurrentUserId()));
    }

    @PostMapping
    @Operation(summary = "Create community", description = "Creates a new community and joins the creator as its ADMIN.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Community created"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Community>> createCommunity(@RequestBody CreateCommunityRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        Community community = communityService.createCommunity(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Community created successfully", community));
    }

    @PostMapping("/{id}/join")
    @Operation(summary = "Join community", description = "Joins the authenticated user to a community.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully joined"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Already a member",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<CommunityMember>> joinCommunity(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        CommunityMember member = communityService.joinCommunity(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Joined community successfully", member));
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Leave community", description = "Removes the authenticated user from a community.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully left"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Not a member",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<Void>> leaveCommunity(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        communityService.leaveCommunity(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Left community successfully", null));
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get community messages", description = "Returns all messages for a community.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Messages returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Community not found",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<CommunityMessageResponse>> getCommunityMessages(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(communityService.getCommunityMessages(id, userId));
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Post community message", description = "Posts a message to a community.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Message posted"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Not a member",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ApiResponse<CommunityMessageResponse>> postCommunityMessage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Long userId = SecurityUtils.getCurrentUserId();
        String messageBody = body.get("body");
        CommunityMessageResponse message = communityService.postCommunityMessage(id, userId, messageBody);
        return ResponseEntity.ok(ApiResponse.success("Message posted successfully", message));
    }
}
