package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.search.AlumniProfileResponse;
import com.alumniweb.alumniweb.dto.search.AlumniSearchRequest;
import com.alumniweb.alumniweb.dto.search.AlumniSearchResponse;
import com.alumniweb.alumniweb.dto.search.AlumniSummaryResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AlumniSearchService {

    AlumniSummaryResponse findByRegisterNumber(String registerNumber);

    Page<AlumniSearchResponse> search(AlumniSearchRequest request);

    AlumniProfileResponse getAlumniProfile(String registerNumber);

    List<AlumniProfileResponse> getAllAlumniProfiles();
}
