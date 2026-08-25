package com.bitconnect.backend.common.response;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Generic response wrapper for paginated data sets.
 *
 * @param <T> Page element type
 */
public record PagedResponse<T>(
        List<T> content,
        int pageNumber,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean isLast
) {
    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
