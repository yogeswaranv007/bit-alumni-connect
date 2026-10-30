package com.bitconnect.backend.message;

import com.bitconnect.backend.config.WebSocketConfig;
import com.bitconnect.backend.modules.message.repository.ConversationRepository;
import com.bitconnect.backend.security.CustomUserDetailsService;
import com.bitconnect.backend.security.JwtTokenProvider;
import com.bitconnect.backend.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebSocketSecurityUnitTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private CustomUserDetailsService userDetailsService;
    @Mock
    private ConversationRepository conversationRepository;
    @Mock
    private MessageChannel messageChannel;

    private WebSocketConfig webSocketConfig;
    private ChannelInterceptor interceptor;

    private final UUID authorizedUserId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID intruderUserId = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private final UUID conversationId = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @BeforeEach
    void setUp() {
        webSocketConfig = new WebSocketConfig(jwtTokenProvider, userDetailsService, conversationRepository);

        ChannelRegistration registration = new ChannelRegistration();
        webSocketConfig.configureClientInboundChannel(registration);
        // Extract interceptor via reflection or recreate behavior
        interceptor = new ChannelInterceptor() {
            // We replicate the exact interceptor logic configured in WebSocketConfig
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                // We test directly against the interceptor created in WebSocketConfig
                return message;
            }
        };
    }

    @Test
    @DisplayName("STOMP CONNECT with valid Bearer token sets authenticated UserPrincipal")
    void stompConnect_withValidJwt_authenticatesSession() {
        String token = "valid-jwt-token";
        UserPrincipal principal = UserPrincipal.builder()
                .id(authorizedUserId)
                .email("alice@bitsathy.ac.in")
                .authorities(Collections.emptyList())
                .build();

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(token)).thenReturn(authorizedUserId);
        when(userDetailsService.loadUserById(authorizedUserId)).thenReturn(principal);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.setNativeHeader("Authorization", "Bearer " + token);
        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        ChannelRegistration reg = mock(ChannelRegistration.class);
        var captor = org.mockito.ArgumentCaptor.forClass(ChannelInterceptor.class);
        webSocketConfig.configureClientInboundChannel(reg);
        verify(reg).interceptors(captor.capture());

        ChannelInterceptor actualInterceptor = captor.getValue();
        Message<?> result = actualInterceptor.preSend(msg, messageChannel);

        assertThat(result).isNotNull();
        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertThat(resultAccessor.getUser()).isNotNull();
        assertThat(resultAccessor.getUser().getName()).isEqualTo("alice@bitsathy.ac.in");
    }

    @Test
    @DisplayName("STOMP SUBSCRIBE to conversation topic succeeds when user is a participant")
    void stompSubscribe_authorizedParticipant_allowsSubscription() {
        UserPrincipal principal = UserPrincipal.builder()
                .id(authorizedUserId)
                .email("alice@bitsathy.ac.in")
                .authorities(Collections.emptyList())
                .build();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        when(conversationRepository.isUserParticipant(conversationId, authorizedUserId)).thenReturn(true);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/conversations/" + conversationId);
        accessor.setUser(auth);
        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        ChannelRegistration reg = mock(ChannelRegistration.class);
        var captor = org.mockito.ArgumentCaptor.forClass(ChannelInterceptor.class);
        webSocketConfig.configureClientInboundChannel(reg);
        verify(reg).interceptors(captor.capture());

        ChannelInterceptor actualInterceptor = captor.getValue();
        Message<?> result = actualInterceptor.preSend(msg, messageChannel);

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("STOMP SUBSCRIBE to conversation topic is rejected with AccessDeniedException when user is NOT a participant")
    void stompSubscribe_nonParticipant_deniesSubscription() {
        UserPrincipal intruderPrincipal = UserPrincipal.builder()
                .id(intruderUserId)
                .email("intruder@bitsathy.ac.in")
                .authorities(Collections.emptyList())
                .build();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(intruderPrincipal, null, intruderPrincipal.getAuthorities());

        when(conversationRepository.isUserParticipant(conversationId, intruderUserId)).thenReturn(false);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/conversations/" + conversationId);
        accessor.setUser(auth);
        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        ChannelRegistration reg = mock(ChannelRegistration.class);
        var captor = org.mockito.ArgumentCaptor.forClass(ChannelInterceptor.class);
        webSocketConfig.configureClientInboundChannel(reg);
        verify(reg).interceptors(captor.capture());

        ChannelInterceptor actualInterceptor = captor.getValue();

        assertThatThrownBy(() -> actualInterceptor.preSend(msg, messageChannel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Unauthorized subscription to conversation topic");
    }

    @Test
    @DisplayName("STOMP SUBSCRIBE to conversation topic is rejected when unauthenticated")
    void stompSubscribe_unauthenticated_deniesSubscription() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/conversations/" + conversationId);
        Message<?> msg = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        ChannelRegistration reg = mock(ChannelRegistration.class);
        var captor = org.mockito.ArgumentCaptor.forClass(ChannelInterceptor.class);
        webSocketConfig.configureClientInboundChannel(reg);
        verify(reg).interceptors(captor.capture());

        ChannelInterceptor actualInterceptor = captor.getValue();

        assertThatThrownBy(() -> actualInterceptor.preSend(msg, messageChannel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Unauthenticated subscription");
    }
}
