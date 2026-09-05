package com.alumniweb.alumniweb.service.impl;

import com.alumniweb.alumniweb.dto.developer.MonitoringResponse;
import com.alumniweb.alumniweb.model.repository.AppSessionRepository;
import com.alumniweb.alumniweb.model.repository.LoginEventRepository;
import com.alumniweb.alumniweb.model.repository.UserRepository;
import com.alumniweb.alumniweb.service.DeveloperMonitoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeveloperMonitoringServiceImpl implements DeveloperMonitoringService {

    private final AppSessionRepository appSessionRepository;
    private final LoginEventRepository loginEventRepository;
    private final UserRepository userRepository;

    @Override
    public MonitoringResponse getMonitoringData() {
        long totalUsers = userRepository.count();
        long totalSessions = appSessionRepository.count();
        long totalLoginEvents = loginEventRepository.count();

        Map<String, String> services = new LinkedHashMap<>();
        services.put("database", "UP");
        services.put("auth-service", "UP");
        services.put("storage", "UP");

        return new MonitoringResponse(
                new MonitoringResponse.OnlineUsersInfo(totalSessions, totalLoginEvents),
                new MonitoringResponse.SessionsInfo(totalSessions, totalSessions),
                new MonitoringResponse.InfrastructureHealthInfo(
                        "HEALTHY",
                        "UP",
                        LocalDateTime.now(),
                        services
                )
        );
    }
}
