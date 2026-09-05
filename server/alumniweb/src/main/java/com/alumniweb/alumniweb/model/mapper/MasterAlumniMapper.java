package com.alumniweb.alumniweb.model.mapper;

import com.alumniweb.alumniweb.dto.search.AlumniProfileResponse;
import com.alumniweb.alumniweb.dto.search.AlumniSearchResponse;
import com.alumniweb.alumniweb.dto.search.AlumniSummaryResponse;
import com.alumniweb.alumniweb.model.MasterAlumni;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.ERROR
)
public interface MasterAlumniMapper {

    AlumniSummaryResponse toSummaryResponse(MasterAlumni alumni);

    List<AlumniSummaryResponse> toSummaryResponseList(List<MasterAlumni> alumni);

    AlumniSearchResponse toSearchResponse(MasterAlumni alumni);

    List<AlumniSearchResponse> toSearchResponseList(List<MasterAlumni> alumni);

    @Mapping(target = "id", expression = "java(String.valueOf(alumni.getId()))")
    @Mapping(target = "slug", source = "registerNumber")
    @Mapping(target = "bio", source = "feedback")
    @Mapping(target = "location", source = "address")
    @Mapping(target = "jobTitle", source = "designation")
    @Mapping(target = "avatar", ignore = true)
    AlumniProfileResponse toProfileResponse(MasterAlumni alumni);

    List<AlumniProfileResponse> toProfileResponseList(List<MasterAlumni> alumni);
}
