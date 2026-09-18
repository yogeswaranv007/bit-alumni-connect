package com.bitconnect.backend.modules.event.controller;

import com.bitconnect.backend.common.response.ApiResponse;
import com.bitconnect.backend.modules.event.dto.EventCreateRequest;
import com.bitconnect.backend.modules.event.dto.EventDto;
import com.bitconnect.backend.modules.event.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Events & Activities", description = "Endpoints for institutional events, department seminars, and meetings")
public class EventController {

    private final EventService eventService;

    @GetMapping
    @Operation(summary = "Get upcoming events", description = "Returns all active upcoming events")
    public ResponseEntity<ApiResponse<List<EventDto>>> getUpcomingEvents() {
        List<EventDto> events = eventService.getUpcomingEvents();
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/on-campus")
    @Operation(summary = "Get upcoming on-campus events", description = "Returns on-campus events available for visit association")
    public ResponseEntity<ApiResponse<List<EventDto>>> getUpcomingOnCampusEvents() {
        List<EventDto> events = eventService.getUpcomingOnCampusEvents();
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get event by ID")
    public ResponseEntity<ApiResponse<EventDto>> getEventById(@PathVariable UUID id) {
        EventDto event = eventService.getEventById(id);
        return ResponseEntity.ok(ApiResponse.success(event));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Create an event", description = "Creates a new event or faculty meeting")
    public ResponseEntity<ApiResponse<EventDto>> createEvent(@Valid @RequestBody EventCreateRequest request) {
        EventDto event = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Event created successfully", event));
    }
}
