package com.bitconnect.backend.config;

import com.bitconnect.backend.modules.message.repository.ConversationRepository;
import com.bitconnect.backend.security.CustomUserDetailsService;
import com.bitconnect.backend.security.JwtTokenProvider;
import com.bitconnect.backend.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.UUID;

/**
 * WebSocket STOMP broker configuration with JWT token authentication and subscription authorization.
 * Enforces authenticated connection handshakes during CONNECT frames and validates conversation
 * membership before permitting client subscriptions to /topic/conversations/{id}.
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final ConversationRepository conversationRepository;

    public WebSocketConfig(
            JwtTokenProvider jwtTokenProvider,
            CustomUserDetailsService userDetailsService,
            @Lazy ConversationRepository conversationRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
        this.conversationRepository = conversationRepository;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Fallback-safe SockJS endpoint for browser clients
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Plain WebSocket endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Destination prefixes for outgoing broadcasts & private queues
        registry.enableSimpleBroker("/topic", "/queue");
        // Application destination prefix for client-to-server messages
        registry.setApplicationDestinationPrefixes("/app");
        // User destination prefix for convertAndSendToUser
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                // 1. Connection Authentication
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            if (jwtTokenProvider.validateToken(token)) {
                                UUID userId = jwtTokenProvider.getUserIdFromToken(token);
                                UserDetails userDetails = userDetailsService.loadUserById(userId);

                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(auth);
                                log.debug("Authenticated WebSocket STOMP session for user: {}", userId);
                            }
                        } catch (Exception ex) {
                            log.warn("WebSocket STOMP authentication failed: {}", ex.getMessage());
                        }
                    }
                }

                // 2. Subscription Authorization
                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    if (destination != null && destination.startsWith("/topic/conversations/")) {
                        String sub = destination.substring("/topic/conversations/".length());
                        String convIdStr = sub.contains("/") ? sub.substring(0, sub.indexOf('/')) : sub;
                        try {
                            UUID convId = UUID.fromString(convIdStr);
                            Principal principal = accessor.getUser();
                            if (principal instanceof UsernamePasswordAuthenticationToken auth &&
                                    auth.getPrincipal() instanceof UserPrincipal userPrincipal) {
                                UUID userId = userPrincipal.getId();
                                if (!conversationRepository.isUserParticipant(convId, userId)) {
                                    log.warn("WebSocket subscription denied: User {} is not a participant in conversation {}", userId, convId);
                                    throw new AccessDeniedException("Unauthorized subscription to conversation topic");
                                }
                            } else {
                                log.warn("Unauthenticated WebSocket subscription attempt to {}", destination);
                                throw new AccessDeniedException("Unauthenticated subscription");
                            }
                        } catch (IllegalArgumentException e) {
                            log.warn("Invalid conversation UUID in destination: {}", destination);
                            throw new AccessDeniedException("Invalid conversation destination");
                        }
                    }
                }

                return message;
            }
        });
    }
}
