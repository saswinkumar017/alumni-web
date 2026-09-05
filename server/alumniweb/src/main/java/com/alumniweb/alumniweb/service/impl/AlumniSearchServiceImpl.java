package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.search.AlumniProfileResponse;
import com.alumniweb.alumniweb.dto.search.AlumniSearchRequest;
import com.alumniweb.alumniweb.dto.search.AlumniSearchResponse;
import com.alumniweb.alumniweb.dto.search.AlumniSummaryResponse;
import com.alumniweb.alumniweb.exception.AlumniNotFoundException;
import com.alumniweb.alumniweb.model.MasterAlumni;
import com.alumniweb.alumniweb.model.mapper.MasterAlumniMapper;
import com.alumniweb.alumniweb.model.repository.MasterAlumniRepository;
import com.alumniweb.alumniweb.service.AlumniSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlumniSearchServiceImpl implements AlumniSearchService {

    private final MasterAlumniRepository masterAlumniRepository;
    private final MasterAlumniMapper masterAlumniMapper;

    @Override
    public AlumniSummaryResponse findByRegisterNumber(String registerNumber) {
        MasterAlumni alumni = masterAlumniRepository.findByRegisterNumber(registerNumber)
            .orElseThrow(() -> new AlumniNotFoundException(registerNumber));
        return masterAlumniMapper.toSummaryResponse(alumni);
    }

    @Override
    public Page<AlumniSearchResponse> search(AlumniSearchRequest request) {
        Pageable pageable = PageRequest.of(request.page(), request.size());

        if (request.registerNumber() != null && !request.registerNumber().isBlank()) {
            MasterAlumni alumni = masterAlumniRepository
                .findByRegisterNumber(request.registerNumber())
                .orElseThrow(() -> new AlumniNotFoundException(request.registerNumber()));
            List<AlumniSearchResponse> list = List.of(masterAlumniMapper.toSearchResponse(alumni));
            return new PageImpl<>(list, pageable, 1);
        }

        if (request.query() != null && !request.query().isBlank()) {
            return masterAlumniRepository.findByNameContainingIgnoreCase(request.query(), pageable)
                .map(masterAlumniMapper::toSearchResponse);
        }

        return masterAlumniRepository.findAll(pageable)
            .map(masterAlumniMapper::toSearchResponse);
    }

    @Override
    public AlumniProfileResponse getAlumniProfile(String registerNumber) {
        MasterAlumni alumni = masterAlumniRepository.findByRegisterNumber(registerNumber)
            .orElseThrow(() -> new AlumniNotFoundException(registerNumber));
        return masterAlumniMapper.toProfileResponse(alumni);
    }

    @Override
    public List<AlumniProfileResponse> getAllAlumniProfiles() {
        return masterAlumniRepository.findAll().stream()
            .map(masterAlumniMapper::toProfileResponse)
            .toList();
    }
}
