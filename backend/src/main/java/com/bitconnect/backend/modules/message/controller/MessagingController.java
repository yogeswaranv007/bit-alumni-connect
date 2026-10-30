package com.bitconnect.backend.modules.message.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.common.response.PagedResponse;
import com.bitconnect.backend.modules.message.dto.BlockUserRequest;
import com.bitconnect.backend.modules.message.dto.ConversationResponse;
import com.bitconnect.backend.modules.message.dto.CreateConversationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyRegistrationRequest;
import com.bitconnect.backend.modules.message.dto.DeviceKeyResponse;
import com.bitconnect.backend.modules.message.dto.EncryptedMessageResponse;
import com.bitconnect.backend.modules.message.dto.SendEncryptedMessageRequest;
import com.bitconnect.backend.modules.message.service.MessagingService;
import com.bitconnect.backend.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Private Messaging", description = "End-to-end encrypted 1-to-1 private messaging and device key management")
public class MessagingController {

    private final MessagingService messagingService;

    // ── Device Keys ───────────────────────────────────────────────────────────

    @PostMapping("/keys")
    @Operation(summary = "Register client device public key", description = "Stores client's asymmetric public key (ECDH P-256). Private keys must never leave the client.")
    public ResponseEntity<ApiResponse<DeviceKeyResponse>> registerDeviceKey(
            @Valid @RequestBody DeviceKeyRegistrationRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        DeviceKeyResponse response = messagingService.registerDeviceKey(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Device public key registered successfully", response));
    }

    @GetMapping("/keys/{targetUserId}")
    @Operation(summary = "Get user's active device public keys", description = "Fetches public key needed for client-side ECDH key agreement")
    public ResponseEntity<ApiResponse<List<DeviceKeyResponse>>> getActiveDeviceKeys(
            @PathVariable UUID targetUserId) {
        List<DeviceKeyResponse> keys = messagingService.getActiveDeviceKeys(targetUserId);
        return ResponseEntity.ok(ApiResponse.success(keys));
    }

    // ── Conversations ─────────────────────────────────────────────────────────

    @PostMapping("/conversations")
    @Operation(summary = "Start or retrieve conversation", description = "Retrieves existing conversation or creates a new one with canonical ordering to avoid duplicates")
    public ResponseEntity<ApiResponse<ConversationResponse>> createOrGetConversation(
            @Valid @RequestBody CreateConversationRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ConversationResponse response = messagingService.getOrCreateConversation(currentUserId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/conversations")
    @Operation(summary = "List user conversations", description = "Paginated list of active conversations with unread counts")
    public ResponseEntity<ApiResponse<PagedResponse<ConversationResponse>>> getMyConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        PagedResponse<ConversationResponse> response = messagingService.getMyConversations(currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/conversations/{conversationId}")
    @Operation(summary = "Get conversation details", description = "Retrieves conversation metadata. Requires participant membership.")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationDetails(
            @PathVariable UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        ConversationResponse response = messagingService.getConversationDetails(currentUserId, conversationId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    @GetMapping("/conversations/{conversationId}/messages")
    @Operation(summary = "Get conversation messages", description = "Paginated chronological encrypted message history")
    public ResponseEntity<ApiResponse<PagedResponse<EncryptedMessageResponse>>> getMessages(
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        PagedResponse<EncryptedMessageResponse> response = messagingService.getConversationMessages(currentUserId, conversationId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    @Operation(summary = "Send encrypted message", description = "Persists encrypted ciphertext + IV. Never accepts or processes plaintext bodies.")
    public ResponseEntity<ApiResponse<EncryptedMessageResponse>> sendMessage(
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendEncryptedMessageRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        EncryptedMessageResponse response = messagingService.sendEncryptedMessage(currentUserId, conversationId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message dispatched successfully", response));
    }

    @PatchMapping("/conversations/{conversationId}/read")
    @Operation(summary = "Mark conversation messages as read", description = "Updates delivery status to READ for incoming messages")
    public ResponseEntity<ApiResponse<Integer>> markAsRead(
            @PathVariable UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        int count = messagingService.markMessagesAsRead(currentUserId, conversationId);
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read", count));
    }

    // ── Blocking ──────────────────────────────────────────────────────────────

    @PostMapping("/conversations/{conversationId}/block")
    @Operation(summary = "Block user in conversation", description = "Blocks participant from sending future messages")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @PathVariable UUID conversationId,
            @RequestBody(required = false) BlockUserRequest request) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        messagingService.blockUser(currentUserId, conversationId, request);
        return ResponseEntity.ok(ApiResponse.success("User blocked successfully", null));
    }

    @PostMapping("/conversations/{conversationId}/unblock")
    @Operation(summary = "Unblock conversation", description = "Restores messaging between participants")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @PathVariable UUID conversationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        messagingService.unblockUser(currentUserId, conversationId);
        return ResponseEntity.ok(ApiResponse.success("User unblocked successfully", null));
    }
}
