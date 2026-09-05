package com.alumniweb.alumniweb.model.mapper;

import com.alumniweb.alumniweb.dto.auth.LoginResponse;
import com.alumniweb.alumniweb.dto.auth.RegisterResponse;
import com.alumniweb.alumniweb.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.ERROR
)
public interface UserMapper {

    @Mapping(target = "userId", source = "id")
    @Mapping(target = "message", ignore = true)
    RegisterResponse toRegisterResponse(User user);

    @Mapping(target = "accessToken", ignore = true)
    @Mapping(target = "refreshToken", ignore = true)
    @Mapping(target = "tokenType", ignore = true)
    @Mapping(target = "expiresAt", ignore = true)
    LoginResponse toLoginResponse(User user);
}
