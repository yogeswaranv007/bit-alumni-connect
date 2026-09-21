package com.bitconnect.backend.notification;

import com.bitconnect.backend.modules.notification.dto.NotificationDto;
import com.bitconnect.backend.modules.notification.entity.Notification;
import com.bitconnect.backend.modules.notification.entity.NotificationType;
import com.bitconnect.backend.modules.notification.repository.NotificationRepository;
import com.bitconnect.backend.modules.notification.service.NotificationService;
import com.bitconnect.backend.modules.user.entity.Role;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.RoleRepository;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.security.JwtTokenProvider;
import com.bitconnect.backend.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
class NotificationIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User userA;
    private User userB;
    private String tokenUserA;
    private String tokenUserB;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        Role alumniRole = roleRepository.findByName(RoleName.ROLE_ALUMNI)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ALUMNI)));

        userA = userRepository.findByEmail("notif_user_a@bitsathy.ac.in").orElseGet(() -> {
            Set<Role> roles = new HashSet<>();
            roles.add(alumniRole);
            return userRepository.save(User.builder()
                    .email("notif_user_a@bitsathy.ac.in")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Alumnus User A")
                    .isActive(true)
                    .roles(roles)
                    .build());
        });

        userB = userRepository.findByEmail("notif_user_b@bitsathy.ac.in").orElseGet(() -> {
            Set<Role> roles = new HashSet<>();
            roles.add(alumniRole);
            return userRepository.save(User.builder()
                    .email("notif_user_b@bitsathy.ac.in")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Alumnus User B")
                    .isActive(true)
                    .roles(roles)
                    .build());
        });

        tokenUserA = jwtTokenProvider.generateTokenFromUser(UserPrincipal.create(userA));
        tokenUserB = jwtTokenProvider.generateTokenFromUser(UserPrincipal.create(userB));

        // Clean up existing notifications for test users
        notificationRepository.deleteAll(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userA.getId()));
        notificationRepository.deleteAll(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userB.getId()));
    }

    @Test
    @DisplayName("Should retrieve unread notification count and paginated list for authenticated user")
    void testUnreadCountAndPagination() throws Exception {
        // Send 3 notifications to User A (2 unread, 1 read)
        NotificationDto n1 = notificationService.sendNotification(
                userA, NotificationType.CAMPUS_VISIT_APPROVED, "Visit Approved", "Your visit is approved",
                UUID.randomUUID(), "CAMPUS_VISIT", "/alumni/campus-visits"
        );
        NotificationDto n2 = notificationService.sendNotification(
                userA, NotificationType.DIGITAL_ID_GENERATED, "Digital ID Generated", "Your ID is active",
                UUID.randomUUID(), "VIRTUAL_ID", "/alumni/id-card"
        );
        NotificationDto n3 = notificationService.sendNotification(
                userA, NotificationType.SYSTEM_ANNOUNCEMENT, "Welcome", "Welcome to BIT Connect",
                null, "SYSTEM", "/notifications"
        );

        // Mark n3 as read manually
        notificationService.markAsRead(n3.id(), userA.getId());

        // Also send 1 notification to User B
        notificationService.sendNotification(
                userB, NotificationType.SECURITY_ALERT, "User B Alert", "Alert for User B",
                null, "SECURITY", null
        );

        // 1. Check unread count for User A (should be 2)
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(2)))
                .andExpect(jsonPath("$.data.count", is(2)));

        // 2. Check unread count for User B (should be 1)
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(1)));

        // 3. Paginated list for User A (All: total 3)
        mockMvc.perform(get("/api/v1/notifications?page=0&size=10")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(3)))
                .andExpect(jsonPath("$.data.content", hasSize(3)));

        // 4. Paginated list for User A (Unread only: total 2)
        mockMvc.perform(get("/api/v1/notifications?isRead=false&page=0&size=10")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content", hasSize(2)));
    }

    @Test
    @DisplayName("Should mark single notification as read and set readAt timestamp")
    void testMarkAsRead() throws Exception {
        NotificationDto notif = notificationService.sendNotification(
                userA, NotificationType.ALUMNI_VERIFIED, "Profile Verified", "You are verified",
                UUID.randomUUID(), "ALUMNI_PROFILE", "/alumni/id-card"
        );

        mockMvc.perform(patch("/api/v1/notifications/" + notif.id() + "/read")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk());

        Notification updated = notificationRepository.findById(notif.id()).orElseThrow();
        assertThat(updated.isRead()).isTrue();
        assertThat(updated.getReadAt()).isNotNull();

        // Check unread count is now 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(0)));
    }

    @Test
    @DisplayName("Should mark all notifications as read for current user")
    void testMarkAllAsRead() throws Exception {
        notificationService.sendNotification(userA, NotificationType.CAMPUS_VISIT_APPROVED, "T1", "M1", null, "VISIT");
        notificationService.sendNotification(userA, NotificationType.DIGITAL_ID_GENERATED, "T2", "M2", null, "ID");
        notificationService.sendNotification(userB, NotificationType.SECURITY_ALERT, "T3", "M3", null, "SEC");

        // Mark all as read for User A
        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk());

        // User A unread count = 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(0)));

        // User B unread count still = 1 (Isolated!)
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(1)));
    }

    @Test
    @DisplayName("Security Isolation: User B cannot mark User A's notification as read")
    void testSecurityUserIsolation() throws Exception {
        NotificationDto notifA = notificationService.sendNotification(
                userA, NotificationType.ALUMNI_VERIFIED, "For User A", "Private alert",
                null, "ALUMNI_PROFILE"
        );

        // User B attempts to mark User A's notification as read
        mockMvc.perform(patch("/api/v1/notifications/" + notifA.id() + "/read")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isNotFound());

        // Verify User A's notification remains unread
        Notification notif = notificationRepository.findById(notifA.id()).orElseThrow();
        assertThat(notif.isRead()).isFalse();
    }
}
