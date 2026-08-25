package com.bitconnect.backend.modules.auth.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.exception.UnauthorizedException;
import com.bitconnect.backend.modules.auth.dto.AuthResponse;
import com.bitconnect.backend.modules.auth.dto.LoginRequest;
import com.bitconnect.backend.modules.auth.dto.RegisterRequest;
import com.bitconnect.backend.modules.auth.dto.UserSummaryResponse;
import com.bitconnect.backend.modules.auth.service.AuthService;
import com.bitconnect.backend.modules.user.entity.Role;
import com.bitconnect.backend.modules.user.entity.RoleName;
import com.bitconnect.backend.modules.user.entity.User;
import com.bitconnect.backend.modules.user.repository.RoleRepository;
import com.bitconnect.backend.modules.user.repository.UserRepository;
import com.bitconnect.backend.security.JwtTokenProvider;
import com.bitconnect.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email address is already in use: " + normalizedEmail);
        }

        Role alumniRole = roleRepository.findByName(RoleName.ROLE_ALUMNI)
                .orElseThrow(() -> new BadRequestException("Default role ROLE_ALUMNI is not initialized in database"));

        User user = User.builder()
                .email(normalizedEmail)
                .fullName(request.fullName().trim())
                .password(passwordEncoder.encode(request.password()))
                .isActive(true)
                .roles(new HashSet<>(Collections.singletonList(alumniRole)))
                .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered successfully with ID: {} and email: {}", savedUser.getId(), savedUser.getEmail());

        UserPrincipal userPrincipal = UserPrincipal.create(savedUser);
        String token = jwtTokenProvider.generateTokenFromUser(userPrincipal);

        List<String> roles = savedUser.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();

        UserSummaryResponse userSummary = new UserSummaryResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.isActive(),
                roles,
                savedUser.getCreatedAt()
        );

        return new AuthResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(), userSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
            );

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            String token = jwtTokenProvider.generateToken(authentication);

            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();

            User user = userRepository.findWithRolesById(userPrincipal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

            UserSummaryResponse userSummary = new UserSummaryResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.isActive(),
                    roles,
                    user.getCreatedAt()
            );

            log.info("User logged in successfully: {}", normalizedEmail);
            return new AuthResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(), userSummary);

        } catch (BadCredentialsException ex) {
            log.warn("Failed login attempt for email: {} - Bad credentials", normalizedEmail);
            throw new UnauthorizedException("Invalid email or password");
        } catch (DisabledException ex) {
            log.warn("Failed login attempt for disabled user: {}", normalizedEmail);
            throw new UnauthorizedException("User account is inactive. Please contact the administrator.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getCurrentUser(UUID userId) {
        User user = userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();

        return new UserSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.isActive(),
                roles,
                user.getCreatedAt()
        );
    }
}
