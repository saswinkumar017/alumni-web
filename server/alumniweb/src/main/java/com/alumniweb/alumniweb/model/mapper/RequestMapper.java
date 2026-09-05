package com.alumniweb.alumniweb.model.mapper;

import com.alumniweb.alumniweb.dto.admin.PendingRequestResponse;
import com.alumniweb.alumniweb.dto.request.RequestStatusResponse;
import com.alumniweb.alumniweb.model.Request;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.ERROR,
    uses = MasterAlumniMapper.class
)
public interface RequestMapper {

    @Mapping(target = "requestId", source = "id")
    RequestStatusResponse toStatusResponse(Request request);

    List<RequestStatusResponse> toStatusResponseList(List<Request> requests);

    @Mapping(target = "requestId", source = "id")
    @Mapping(target = "alumni", source = "masterAlumni")
    PendingRequestResponse toPendingResponse(Request request);

    List<PendingRequestResponse> toPendingResponseList(List<Request> requests);
}
