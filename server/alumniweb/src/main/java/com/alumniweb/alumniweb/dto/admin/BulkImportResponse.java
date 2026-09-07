package com.alumniweb.alumniweb.dto.admin;

import java.util.List;

public record BulkImportResponse(
        int totalRows,
        int created,
        int updated,
        int skipped,
        List<RowError> errors
) {
    public record RowError(int row, String registerNumber, String message) {
    }
}
