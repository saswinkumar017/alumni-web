package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.admin.BulkImportResponse;
import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.enums.Availability;
import com.alumniweb.alumniweb.model.enums.CurrentStatus;
import com.alumniweb.alumniweb.model.enums.Gender;
import com.alumniweb.alumniweb.model.enums.MaritalStatus;
import com.alumniweb.alumniweb.model.repository.MasterAlumniRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AlumniImportService {

    private static final int CHUNK_SIZE = 500;
    private static final int MAX_ERRORS = 100;

    private final MasterAlumniRepository masterAlumniRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public BulkImportResponse importFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        List<ParsedRow> rows;
        try (InputStream in = file.getInputStream()) {
            if (filename.endsWith(".csv")) {
                rows = parseCsv(in);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                rows = parseExcel(in);
            } else if (filename.endsWith(".json")) {
                rows = parseJson(in);
            } else {
                // sniff content: try JSON, then CSV
                rows = trySniff(in, file);
            }
        }
        if (rows.size() > 20000) {
            throw new IllegalArgumentException("Too many rows (" + rows.size() + "). Max 20000 per import.");
        }
        return upsert(rows);
    }

    private List<ParsedRow> trySniff(InputStream in, MultipartFile file) throws Exception {
        byte[] bytes = file.getBytes();
        String head = new String(bytes, 0, Math.min(bytes.length, 2048), StandardCharsets.UTF_8).trim();
        if (head.startsWith("[") || head.startsWith("{")) {
            return parseJson(new java.io.ByteArrayInputStream(bytes));
        }
        return parseCsv(new java.io.ByteArrayInputStream(bytes));
    }

    // ---------- parsing ----------

    record ParsedRow(int rowNum, Map<String, String> fields) {
    }

    private List<ParsedRow> parseCsv(InputStream in) throws Exception {
        List<ParsedRow> out = new ArrayList<>();
        try (CSVParser parser = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build()
                .parse(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            int n = 1;
            for (CSVRecord rec : parser) {
                n++;
                Map<String, String> m = new LinkedHashMap<>();
                for (String h : parser.getHeaderNames()) {
                    m.put(norm(h), rec.isMapped(h) ? rec.get(h) : null);
                }
                out.add(new ParsedRow(n, m));
            }
        }
        return out;
    }

    private List<ParsedRow> parseExcel(InputStream in) throws Exception {
        List<ParsedRow> out = new ArrayList<>();
        DataFormatter fmt = new DataFormatter();
        try (Workbook wb = WorkbookFactory.create(in)) {
            Sheet sheet = wb.getSheetAt(0);
            Row header = sheet.getRow(sheet.getFirstRowNum());
            if (header == null) return out;
            List<String> headers = new ArrayList<>();
            for (Cell c : header) headers.add(norm(fmt.formatCellValue(c)));
            for (int r = sheet.getFirstRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isEmptyRow(row)) continue;
                Map<String, String> m = new LinkedHashMap<>();
                for (int c = 0; c < headers.size(); c++) {
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    m.put(headers.get(c), cell == null ? null : fmt.formatCellValue(cell).trim());
                }
                out.add(new ParsedRow(r + 1, m));
            }
        }
        return out;
    }

    private boolean isEmptyRow(Row row) {
        for (Cell c : row) {
            if (c != null && c.getCellType() != CellType.BLANK && !c.toString().isBlank()) return false;
        }
        return true;
    }

    private List<ParsedRow> parseJson(InputStream in) throws Exception {
        var node = objectMapper.readTree(in);
        List<Map<String, Object>> list;
        if (node.isArray()) {
            list = objectMapper.convertValue(node, new TypeReference<>() {
            });
        } else if (node.has("data") && node.get("data").isArray()) {
            list = objectMapper.convertValue(node.get("data"), new TypeReference<>() {
            });
        } else if (node.isObject()) {
            list = List.of(objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {
            }));
        } else {
            throw new IllegalArgumentException("Unsupported JSON shape. Expect array or {data:[...]}");
        }
        List<ParsedRow> out = new ArrayList<>();
        int n = 1;
        for (Map<String, Object> obj : list) {
            n++;
            Map<String, String> m = new LinkedHashMap<>();
            obj.forEach((k, v) -> m.put(norm(k), v == null ? null : String.valueOf(v).trim()));
            out.add(new ParsedRow(n, m));
        }
        return out;
    }

    private String norm(String h) {
        if (h == null) return "";
        return h.trim().toLowerCase().replaceAll("[\\s_\\-]+", "");
    }

    private String get(Map<String, String> m, String... keys) {
        for (String k : keys) {
            String v = m.get(norm(k));
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    // ---------- upsert ----------

    private BulkImportResponse upsert(List<ParsedRow> rows) {
        int created = 0, updated = 0, skipped = 0;
        List<BulkImportResponse.RowError> errors = new ArrayList<>();

        // preload existing in batches to avoid huge IN clause
        Map<String, MasterAlumni> existing = new HashMap<>();
        List<String> regNos = rows.stream()
                .map(r -> get(r.fields(), "registernumber", "registerno", "regno", "regnumber"))
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .distinct().toList();
        for (int i = 0; i < regNos.size(); i += 1000) {
            List<MasterAlumni> found = masterAlumniRepository
                    .findAllByRegisterNumberIn(regNos.subList(i, Math.min(i + 1000, regNos.size())));
            for (MasterAlumni m : found) existing.put(m.getRegisterNumber().trim(), m);
        }

        List<MasterAlumni> batch = new ArrayList<>(CHUNK_SIZE);
        java.util.Set<String> batchKeys = new java.util.HashSet<>();

        for (ParsedRow pr : rows) {
            try {
                String regNo = get(pr.fields(), "registernumber", "registerno", "regno", "regnumber");
                String name = get(pr.fields(), "name", "fullname", "studentname");
                if (regNo == null || regNo.isBlank()) {
                    skipped++;
                    addError(errors, pr.rowNum(), regNo, "registerNumber is required");
                    continue;
                }
                if (name == null || name.isBlank()) {
                    skipped++;
                    addError(errors, pr.rowNum(), regNo, "name is required");
                    continue;
                }
                MasterAlumni entity = existing.get(regNo.trim());
                boolean isNew = entity == null;
                if (isNew) {
                    entity = MasterAlumni.builder().registerNumber(regNo.trim()).build();
                }
                apply(entity, pr.fields());
                batch.add(entity);
                batchKeys.add(regNo.trim());
                if (isNew) created++;
                else updated++;

                if (batch.size() >= CHUNK_SIZE) {
                    masterAlumniRepository.saveAll(batch);
                    masterAlumniRepository.flush();
                    for (MasterAlumni s : batch) existing.put(s.getRegisterNumber().trim(), s);
                    batch.clear();
                }
            } catch (Exception e) {
                skipped++;
                addError(errors, pr.rowNum(), get(pr.fields(), "registernumber", "regno"), e.getMessage());
            }
        }
        if (!batch.isEmpty()) {
            masterAlumniRepository.saveAll(batch);
            masterAlumniRepository.flush();
        }
        return new BulkImportResponse(rows.size(), created, updated, skipped, errors);
    }

    private void addError(List<BulkImportResponse.RowError> errors, int row, String regNo, String msg) {
        if (errors.size() < MAX_ERRORS) errors.add(new BulkImportResponse.RowError(row, regNo, msg));
    }

    private void apply(MasterAlumni e, Map<String, String> f) {
        e.setName(req(get(f, "name", "fullname", "studentname"), e.getName()));
        setIfPresent(f, e, "department", "dept", "branch");
        setIfPresent(f, e, "degree");
        setIfPresent(f, e, "batch", "batchname");
        String yop = get(f, "yearofpassing", "yop", "passingyear", "graduationyear");
        if (yop != null) {
            try {
                e.setYearOfPassing(Integer.parseInt(yop.replaceAll("[^0-9]", "")));
            } catch (NumberFormatException ignored) {
            }
        }
        String email = get(f, "email", "emailid", "mail");
        if (email != null) e.setEmail(email);
        String phone = get(f, "phone", "mobile", "mobileno", "contact");
        if (phone != null) e.setPhone(phone);
        String dob = get(f, "dob", "dateofbirth", "birthdate");
        if (dob != null) {
            try {
                e.setDob(LocalDate.parse(dob.substring(0, 10)));
            } catch (Exception ignored) {
            }
        }
        String gender = get(f, "gender", "sex");
        if (gender != null) {
            try {
                e.setGender(Gender.valueOf(gender.trim().toUpperCase()));
            } catch (Exception ignored) {
            }
        }
        String addr = get(f, "address", "location", "city");
        if (addr != null) e.setAddress(addr);
        String comp = get(f, "company", "organization", "employer");
        if (comp != null) e.setCompany(comp);
        String des = get(f, "designation", "jobtitle", "title", "role");
        if (des != null) e.setDesignation(des);
        String prof = get(f, "profession", "occupation");
        if (prof != null) e.setProfession(prof);
        String ms = get(f, "maritalstatus");
        if (ms != null) {
            try {
                e.setMaritalStatus(MaritalStatus.valueOf(ms.trim().toUpperCase()));
            } catch (Exception ignored) {
            }
        }
        String av = get(f, "availability");
        if (av != null) {
            try {
                e.setAvailability(Availability.valueOf(av.trim().toUpperCase()));
            } catch (Exception ignored) {
            }
        }
        String cs = get(f, "currentstatus", "status");
        if (cs != null) {
            try {
                e.setCurrentStatus(CurrentStatus.valueOf(cs.trim().toUpperCase()));
            } catch (Exception ignored) {
            }
        }
        String fb = get(f, "feedback", "bio", "remarks");
        if (fb != null) e.setFeedback(fb);
    }

    private String req(String v, String fallback) {
        return v != null ? v : fallback;
    }

    private void setIfPresent(Map<String, String> f, MasterAlumni e, String... keys) {
        String v = get(f, keys);
        if (v == null) return;
        String key = norm(keys[0]);
        switch (key) {
            case "department" -> e.setDepartment(v);
            case "degree" -> e.setDegree(v);
            case "batch" -> e.setBatch(v);
        }
    }
}
