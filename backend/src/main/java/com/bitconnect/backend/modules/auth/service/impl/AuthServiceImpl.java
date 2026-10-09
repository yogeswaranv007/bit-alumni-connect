package com.bitconnect.backend.modules.auth.service.impl;

import com.bitconnect.backend.common.exception.BadRequestException;
import com.bitconnect.backend.common.exception.ResourceNotFoundException;
import com.bitconnect.backend.common.exception.UnauthorizedException;
import com.bitconnect.backend.modules.auth.dto.*;
import com.bitconnect.backend.modules.auth.service.AuthService;
import com.bitconnect.backend.modules.institutional.dto.AlumniVerificationRequest;
import com.bitconnect.backend.modules.institutional.dto.AlumniVerificationResult;
import com.bitconnect.backend.modules.institutional.dto.StudentVerificationRequest;
import com.bitconnect.backend.modules.institutional.dto.StudentVerificationResult;
import com.bitconnect.backend.modules.institutional.provider.InstitutionalAlumniDataProvider;
import com.bitconnect.backend.modules.institutional.provider.InstitutionalStudentDataProvider;
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
    private final InstitutionalStudentDataProvider studentDataProvider;
    private final InstitutionalAlumniDataProvider alumniDataProvider;

    // ── Alumni Registration ───────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse registerAlumni(AlumniRegisterRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        // Step 1: Verify against the college alumni master database
        AlumniVerificationRequest verificationRequest = new AlumniVerificationRequest(
                request.registerNumber(),
                request.fullName(),
                request.dateOfBirth()
        );

        AlumniVerificationResult verified = alumniDataProvider.verify(verificationRequest)
                .orElseThrow(() -> new BadRequestException(
                        "Your details could not be matched against the college alumni records. " +
                        "Please check your register number, full name, and date of birth. " +
                        "If the issue persists, contact the BIT alumni office."));

        // Step 2: Prevent duplicate BIT Connect accounts for the same institutional record
        if (alumniDataProvider.isAlreadyRegistered(verified.institutionalRecordId())) {
            throw new BadRequestException(
                    "This institutional alumni record is already registered in BIT Connect. " +
                    "Please use Alumni Login or account recovery.");
        }

        // Step 3: Create BIT Connect account
        Role alumniRole = roleRepository.findByName(RoleName.ROLE_ALUMNI)
                .orElseThrow(() -> new BadRequestException("ROLE_ALUMNI is not initialized in the database"));

        User user = User.builder()
                .email(normalizedEmail)
                .fullName(request.fullName().trim())
                .password(passwordEncoder.encode(request.password()))
                .isActive(true)
                .roles(new HashSet<>(Collections.singletonList(alumniRole)))
                .build();

        User savedUser = userRepository.save(user);

        // Step 4: Link the institutional record to this BIT Connect account (prevents re-registration)
        alumniDataProvider.markAsRegistered(verified.institutionalRecordId(), savedUser.getId());

        log.info("Alumni registered successfully — ID: {}, email: {}, institutionalRecordId: {}",
                savedUser.getId(), savedUser.getEmail(), verified.institutionalRecordId());

        return buildAuthResponse(savedUser);
    }

    // ── Student Registration ──────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse registerStudent(StudentRegisterRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        // Step 1: Verify against the college student master database
        StudentVerificationRequest verificationRequest = new StudentVerificationRequest(
                request.registerNumber(),
                request.fullName(),
                request.dateOfBirth()
        );

        StudentVerificationResult verified = studentDataProvider.verify(verificationRequest)
                .orElseThrow(() -> new BadRequestException(
                        "Your details could not be matched against the college student records. " +
                        "Please check your register number, full name, and date of birth. " +
                        "If the issue persists, contact the BIT student affairs office."));

        // Step 2: Prevent duplicate BIT Connect accounts for the same institutional record
        if (studentDataProvider.isAlreadyRegistered(verified.institutionalRecordId())) {
            throw new BadRequestException(
                    "This institutional student record is already registered in BIT Connect. " +
                    "Please use Student Login or account recovery.");
        }

        // Step 3: Create BIT Connect account
        Role studentRole = roleRepository.findByName(RoleName.ROLE_STUDENT)
                .orElseThrow(() -> new BadRequestException("ROLE_STUDENT is not initialized in the database"));

        User user = User.builder()
                .email(normalizedEmail)
                .fullName(request.fullName().trim())
                .password(passwordEncoder.encode(request.password()))
                .isActive(true)
                .roles(new HashSet<>(Collections.singletonList(studentRole)))
                .build();

        User savedUser = userRepository.save(user);

        // Step 4: Link the institutional record to this BIT Connect account
        studentDataProvider.markAsRegistered(verified.institutionalRecordId(), savedUser.getId());

        log.info("Student registered successfully — ID: {}, email: {}, institutionalRecordId: {}",
                savedUser.getId(), savedUser.getEmail(), verified.institutionalRecordId());

        return buildAuthResponse(savedUser);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        return doLogin(request.email(), request.password(), null);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse loginWithRoleCheck(LoginRequest request, RoleName requiredRole) {
        return doLogin(request.email(), request.password(), requiredRole);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private AuthResponse doLogin(String email, String password, RoleName requiredRole) {
        String normalizedEmail = email.toLowerCase().trim();
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, password)
            );

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Role-scoped portal enforcement: reject logins from wrong roles
            if (requiredRole != null) {
                boolean hasRole = userPrincipal.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals(requiredRole.name()));
                if (!hasRole) {
                    log.warn("Role-scoped login rejected — user {} does not have required role {}",
                            normalizedEmail, requiredRole);
                    throw new UnauthorizedException(
                            "These credentials are not authorised for this portal. " +
                            "Please use the correct login page for your account type.");
                }
            }

            String token = jwtTokenProvider.generateToken(authentication);
            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();

            User user = userRepository.findWithRolesById(userPrincipal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

            UserSummaryResponse userSummary = new UserSummaryResponse(
                    user.getId(), user.getEmail(), user.getFullName(),
                    user.isActive(), roles, user.getCreatedAt());

            log.info("User logged in: {} (role check: {})", normalizedEmail, requiredRole);
            return new AuthResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(), userSummary);

        } catch (BadCredentialsException ex) {
            log.warn("Bad credentials for: {}", normalizedEmail);
            throw new UnauthorizedException("Invalid email or password");
        } catch (DisabledException ex) {
            log.warn("Disabled account login attempt: {}", normalizedEmail);
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
                user.getId(), user.getEmail(), user.getFullName(),
                user.isActive(), roles, user.getCreatedAt());
    }

    private AuthResponse buildAuthResponse(User savedUser) {
        UserPrincipal userPrincipal = UserPrincipal.create(savedUser);
        String token = jwtTokenProvider.generateTokenFromUser(userPrincipal);
        List<String> roles = savedUser.getRoles().stream()
                .map(role -> role.getName().name())
                .toList();
        UserSummaryResponse userSummary = new UserSummaryResponse(
                savedUser.getId(), savedUser.getEmail(), savedUser.getFullName(),
                savedUser.isActive(), roles, savedUser.getCreatedAt());
        return new AuthResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(), userSummary);
    }
}
